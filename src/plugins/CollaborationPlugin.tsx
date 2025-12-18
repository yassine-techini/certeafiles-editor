/**
 * CollaborationPlugin - Real-time collaboration using Yjs and Cloudflare Durable Objects
 * Per Constitution Section 7 - Collaboration
 *
 * Full Lexical-Yjs synchronization with custom WebSocket provider
 */
import { useCallback, useMemo } from 'react';
import { CollaborationPlugin as LexicalCollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import type { Provider } from '@lexical/yjs';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import type {
  CollaborationUser,
  ConnectionStatus,
  CollaborationState,
} from '../types/collaboration';
import { getColorForUser } from '../types/collaboration';

const MessageType = {
  SYNC: 0,
  AWARENESS: 1,
  QUERY_AWARENESS: 3,
} as const;

type EventCallback = (...args: unknown[]) => void;

/**
 * Custom WebSocket Provider for Yjs that connects to Cloudflare Durable Objects
 * Implements the Provider interface required by @lexical/yjs
 */
class WebSocketProvider {
  private ws: WebSocket | null = null;
  private _doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  private serverUrl: string;
  private roomId: string;
  private user: CollaborationUser;
  private synced = false;
  private _connected = false;
  private destroyed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connecting = false;
  private indexeddb: IndexeddbPersistence | null = null;

  // Event emitter pattern for Provider interface
  private eventListeners: Map<string, Set<EventCallback>> = new Map();

  private statusCallbacks = new Set<(status: ConnectionStatus) => void>();
  private syncCallbacks = new Set<(synced: boolean) => void>();
  private usersCallbacks = new Set<(users: CollaborationUser[]) => void>();

  constructor(roomId: string, serverUrl: string, user: CollaborationUser, doc: Y.Doc) {
    this.roomId = roomId;
    this.serverUrl = serverUrl;
    this.user = user;
    this._doc = doc;
    this.awareness = new awarenessProtocol.Awareness(doc);

    // Set local user state for awareness
    this.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
    });

    // Set up IndexedDB persistence
    this.indexeddb = new IndexeddbPersistence(`certeafiles-${roomId}`, doc);
    this.indexeddb.on('synced', () => {
      console.log('[WebSocketProvider] IndexedDB synced');
    });

    // Listen for awareness changes
    this.awareness.on('update', () => {
      this.notifyUsers();
    });

    console.log('[WebSocketProvider] Created for room:', roomId);
  }

  // Provider interface: on method
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  // Provider interface: off method
  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(...args));
    }
  }

  onStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    callback(this._connected ? 'connected' : 'disconnected');
    return () => this.statusCallbacks.delete(callback);
  }

  onSync(callback: (synced: boolean) => void): () => void {
    this.syncCallbacks.add(callback);
    callback(this.synced);
    return () => this.syncCallbacks.delete(callback);
  }

  onUsers(callback: (users: CollaborationUser[]) => void): () => void {
    this.usersCallbacks.add(callback);
    callback(this.getUsers());
    return () => this.usersCallbacks.delete(callback);
  }

  private notifyStatus(status: ConnectionStatus): void {
    this.statusCallbacks.forEach((cb) => cb(status));
    this.emit('status', [{ status }]);
  }

  private notifySync(synced: boolean): void {
    this.synced = synced;
    this.syncCallbacks.forEach((cb) => cb(synced));
    if (synced) {
      this.emit('sync', true);
    }
  }

  private notifyUsers(): void {
    const users = this.getUsers();
    this.usersCallbacks.forEach((cb) => cb(users));
  }

  connect(): void {
    if (this.destroyed || this.connecting || this._connected) {
      return;
    }

    this.connecting = true;
    this.notifyStatus('connecting');

    const url = new URL(this.serverUrl);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.searchParams.set('room', this.roomId);
    url.searchParams.set('userId', this.user.id);
    url.searchParams.set('userName', this.user.name);
    url.searchParams.set('userColor', this.user.color);

    console.log('[WebSocketProvider] Connecting to:', url.toString());

    try {
      const ws = new WebSocket(url.toString());
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        if (this.destroyed) {
          ws.close();
          return;
        }

        console.log('[WebSocketProvider] Connected');
        this.ws = ws;
        this.connecting = false;
        this._connected = true;
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');

        // Send sync step 1
        this.sendSyncStep1();

        // Send awareness
        this.sendAwareness();

        // Set up doc update listener
        this._doc.on('update', this.handleDocUpdate);
        this.awareness.on('update', this.handleAwarenessUpdate);
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws) return;
        this.handleMessage(new Uint8Array(event.data));
      };

      ws.onclose = (event) => {
        console.log('[WebSocketProvider] Disconnected:', event.code);

        if (this.ws === ws) {
          this.ws = null;
          this._connected = false;
          this.connecting = false;

          if (this.synced) {
            this.notifySync(false);
          }

          if (!this.destroyed && event.code !== 1000) {
            this.scheduleReconnect();
          } else {
            this.notifyStatus('disconnected');
          }
        }
      };

      ws.onerror = () => {
        console.log('[WebSocketProvider] WebSocket error');
        this.connecting = false;
      };
    } catch (error) {
      console.error('[WebSocketProvider] Connection error:', error);
      this.connecting = false;
      this.notifyStatus('error');
      this.scheduleReconnect();
    }
  }

  private sendSyncStep1(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.SYNC);
      syncProtocol.writeSyncStep1(encoder, this._doc);
      this.ws.send(encoding.toUint8Array(encoder));
    } catch (e) {
      console.error('[WebSocketProvider] Error sending sync step 1:', e);
    }
  }

  private sendAwareness(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, [
          this._doc.clientID,
        ])
      );
      this.ws.send(encoding.toUint8Array(encoder));
    } catch (e) {
      console.error('[WebSocketProvider] Error sending awareness:', e);
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketProvider] Max reconnect attempts reached');
      this.notifyStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(2000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
    console.log(
      `[WebSocketProvider] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.notifyStatus('reconnecting');

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (!this.destroyed) {
        this.connect();
      }
    }, delay);
  }

  private handleMessage = (data: Uint8Array): void => {
    try {
      const decoder = decoding.createDecoder(data);
      const messageType = decoding.readVarUint(decoder);

      if (messageType === MessageType.SYNC) {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MessageType.SYNC);

        const syncMessageType = syncProtocol.readSyncMessage(
          decoder,
          encoder,
          this._doc,
          this
        );

        if (
          encoding.length(encoder) > 1 &&
          this.ws?.readyState === WebSocket.OPEN
        ) {
          this.ws.send(encoding.toUint8Array(encoder));
        }

        // Sync step 2 = synced
        if (syncMessageType === 1 && !this.synced) {
          console.log('[WebSocketProvider] Synced with server');
          this.notifySync(true);
        }
      } else if (messageType === MessageType.AWARENESS) {
        const update = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);
      }
    } catch (e) {
      console.error('[WebSocketProvider] Error handling message:', e);
    }
  };

  private handleDocUpdate = (update: Uint8Array, origin: unknown): void => {
    if (
      origin === this ||
      this.destroyed ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    )
      return;

    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.SYNC);
      syncProtocol.writeUpdate(encoder, update);
      this.ws.send(encoding.toUint8Array(encoder));
    } catch (e) {
      console.error('[WebSocketProvider] Error sending doc update:', e);
    }
  };

  private handleAwarenessUpdate = (
    {
      added,
      updated,
      removed,
    }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ): void => {
    if (
      origin === this ||
      this.destroyed ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    )
      return;

    const changed = added.concat(updated, removed);
    if (changed.length === 0) return;

    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed)
      );
      this.ws.send(encoding.toUint8Array(encoder));
    } catch (e) {
      console.error('[WebSocketProvider] Error sending awareness update:', e);
    }
  };

  disconnect(): void {
    console.log('[WebSocketProvider] Disconnecting');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this._doc.off('update', this.handleDocUpdate);
    this.awareness.off('update', this.handleAwarenessUpdate);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000);
    }
    this.ws = null;
    this._connected = false;
    this.connecting = false;
  }

  getUsers(): CollaborationUser[] {
    const users: CollaborationUser[] = [];
    this.awareness.getStates().forEach((state) => {
      const s = state as { user?: CollaborationUser };
      if (s.user) users.push(s.user);
    });
    return users;
  }

  isConnected(): boolean {
    return this._connected;
  }

  isSynced(): boolean {
    return this.synced;
  }

  destroy(): void {
    console.log('[WebSocketProvider] Destroying');
    this.destroyed = true;
    this.disconnect();
    this.indexeddb?.destroy();
    this.awareness.destroy();
    this.statusCallbacks.clear();
    this.syncCallbacks.clear();
    this.usersCallbacks.clear();
    this.eventListeners.clear();
  }
}

export interface CollaborationPluginProps {
  roomId: string;
  serverUrl?: string | undefined;
  user?: { id?: string; name?: string; color?: string } | undefined;
  onStatusChange?: ((status: ConnectionStatus) => void) | undefined;
  onSyncChange?: ((synced: boolean) => void) | undefined;
  onUsersChange?: ((users: CollaborationUser[]) => void) | undefined;
  onStateChange?: ((state: CollaborationState) => void) | undefined;
  enabled?: boolean | undefined;
}

function getUserId(): string {
  const stored = localStorage.getItem('certeafiles-user-id');
  if (stored) return stored;
  const newId = crypto.randomUUID();
  localStorage.setItem('certeafiles-user-id', newId);
  return newId;
}

function getUserName(): string {
  return localStorage.getItem('certeafiles-user-name') || 'Utilisateur';
}

// Cursor colors for collaboration
const CURSOR_COLORS = [
  '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
  '#2196f3', '#03a9f4', '#00bcd4', '#009688',
  '#4caf50', '#8bc34a', '#ff9800', '#ff5722',
];

export function CollaborationPlugin({
  roomId,
  serverUrl = 'https://certeafiles-yjs-server.yassine-techini.workers.dev',
  user,
  onStatusChange,
  onSyncChange,
  onUsersChange,
  onStateChange,
  enabled = true,
}: CollaborationPluginProps): JSX.Element | null {
  const userId = user?.id || getUserId();
  const userName = user?.name || getUserName();
  const userColor = user?.color || getColorForUser(userId);

  // Cursor color based on user ID
  const cursorColor = useMemo(() => {
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return CURSOR_COLORS[index % CURSOR_COLORS.length];
  }, [userId]);

  // Provider factory - creates a new provider for the given room
  const providerFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
      // Get or create the Y.Doc for this room
      let doc = yjsDocMap.get(id);
      if (!doc) {
        doc = new Y.Doc();
        yjsDocMap.set(id, doc);
      }

      const collaborationUser: CollaborationUser = {
        id: userId,
        name: userName,
        color: userColor,
      };

      const provider = new WebSocketProvider(roomId, serverUrl, collaborationUser, doc);

      // Set up callbacks
      if (onStatusChange) {
        provider.onStatus(onStatusChange);
      }
      if (onSyncChange) {
        provider.onSync(onSyncChange);
      }
      if (onUsersChange) {
        provider.onUsers(onUsersChange);
      }
      if (onStateChange) {
        provider.onStatus((status) => {
          onStateChange({
            status,
            isSynced: provider.isSynced(),
            isOffline: !navigator.onLine,
            users: provider.getUsers(),
          });
        });
      }

      // Connect with a small delay
      setTimeout(() => {
        provider.connect();
      }, 100);

      // Cast to Provider - our implementation satisfies the interface
      return provider as unknown as Provider;
    },
    [roomId, serverUrl, userId, userName, userColor, onStatusChange, onSyncChange, onUsersChange, onStateChange]
  );

  if (!enabled) {
    return null;
  }

  return (
    <LexicalCollaborationPlugin
      id={roomId}
      providerFactory={providerFactory}
      shouldBootstrap={true}
      username={userName}
      cursorColor={cursorColor}
      initialEditorState={null}
    />
  );
}

export default CollaborationPlugin;
