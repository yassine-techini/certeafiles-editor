/**
 * CollaborationPlugin - Real-time collaboration using Yjs and Cloudflare Durable Objects
 * Per Constitution Section 7 - Collaboration
 *
 * Simplified version that manages WebSocket connection and status
 */
import { useEffect, useRef, useMemo } from 'react';
import * as Y from 'yjs';
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

/**
 * WebSocket Provider for Yjs - connects to Cloudflare Durable Objects
 */
class WebSocketProvider {
  private ws: WebSocket | null = null;
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  private serverUrl: string;
  private roomId: string;
  private user: CollaborationUser;
  private synced = false;
  private _connected = false;
  private destroyed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connecting = false;

  private statusCallbacks = new Set<(status: ConnectionStatus) => void>();
  private syncCallbacks = new Set<(synced: boolean) => void>();
  private usersCallbacks = new Set<(users: CollaborationUser[]) => void>();

  constructor(roomId: string, serverUrl: string, user: CollaborationUser) {
    this.roomId = roomId;
    this.serverUrl = serverUrl;
    this.user = user;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    // Set local user state
    this.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
    });

    // Listen for awareness changes
    this.awareness.on('update', () => {
      this.notifyUsers();
    });

    console.log('[CollaborationProvider] Created for room:', roomId);
  }

  onStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.statusCallbacks.add(callback);
    // Immediately notify with current status
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
    console.log('[CollaborationProvider] Status:', status);
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  private notifySync(synced: boolean): void {
    this.synced = synced;
    this.syncCallbacks.forEach((cb) => cb(synced));
  }

  private notifyUsers(): void {
    const users = this.getUsers();
    this.usersCallbacks.forEach((cb) => cb(users));
  }

  connect(): void {
    if (this.destroyed || this.connecting || this._connected) {
      console.log('[CollaborationProvider] Skipping connect:', {
        destroyed: this.destroyed,
        connecting: this.connecting,
        connected: this._connected
      });
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

    console.log('[CollaborationProvider] Connecting to:', url.toString());

    try {
      const ws = new WebSocket(url.toString());
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        if (this.destroyed) {
          ws.close();
          return;
        }

        console.log('[CollaborationProvider] WebSocket connected');
        this.ws = ws;
        this.connecting = false;
        this._connected = true;
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');

        // Send sync step 1
        this.sendSyncStep1();

        // Send awareness
        this.sendAwareness();

        // Set up listeners
        this.doc.on('update', this.handleDocUpdate);
        this.awareness.on('update', this.handleAwarenessUpdate);
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws) return;
        this.handleMessage(new Uint8Array(event.data));
      };

      ws.onclose = (event) => {
        console.log('[CollaborationProvider] WebSocket closed:', event.code, event.reason);

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

      ws.onerror = (error) => {
        console.error('[CollaborationProvider] WebSocket error:', error);
        this.connecting = false;
      };
    } catch (error) {
      console.error('[CollaborationProvider] Connection error:', error);
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
      syncProtocol.writeSyncStep1(encoder, this.doc);
      this.ws.send(encoding.toUint8Array(encoder));
      console.log('[CollaborationProvider] Sent sync step 1');
    } catch (e) {
      console.error('[CollaborationProvider] Error sending sync step 1:', e);
    }
  }

  private sendAwareness(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.doc.clientID])
      );
      this.ws.send(encoding.toUint8Array(encoder));
      console.log('[CollaborationProvider] Sent awareness');
    } catch (e) {
      console.error('[CollaborationProvider] Error sending awareness:', e);
    }
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[CollaborationProvider] Max reconnect attempts reached');
      this.notifyStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    console.log(`[CollaborationProvider] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

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

        const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, this.doc, this);

        if (encoding.length(encoder) > 1 && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(encoding.toUint8Array(encoder));
        }

        // Sync step 2 = synced
        if (syncMessageType === 1 && !this.synced) {
          console.log('[CollaborationProvider] Synced with server');
          this.notifySync(true);
        }
      } else if (messageType === MessageType.AWARENESS) {
        const update = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);
      }
    } catch (e) {
      console.error('[CollaborationProvider] Error handling message:', e);
    }
  };

  private handleDocUpdate = (update: Uint8Array, origin: unknown): void => {
    if (origin === this || this.destroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.SYNC);
      syncProtocol.writeUpdate(encoder, update);
      this.ws.send(encoding.toUint8Array(encoder));
    } catch (e) {
      console.error('[CollaborationProvider] Error sending doc update:', e);
    }
  };

  private handleAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ): void => {
    if (origin === this || this.destroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

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
      console.error('[CollaborationProvider] Error sending awareness update:', e);
    }
  };

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

  disconnect(): void {
    console.log('[CollaborationProvider] Disconnecting');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.doc.off('update', this.handleDocUpdate);
    this.awareness.off('update', this.handleAwarenessUpdate);

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000);
      }
      this.ws = null;
    }
    this._connected = false;
    this.connecting = false;
  }

  destroy(): void {
    console.log('[CollaborationProvider] Destroying');
    this.destroyed = true;
    this.disconnect();
    this.awareness.destroy();
    this.doc.destroy();
    this.statusCallbacks.clear();
    this.syncCallbacks.clear();
    this.usersCallbacks.clear();
  }
}

// Singleton provider cache
const providerCache = new Map<string, WebSocketProvider>();

function getOrCreateProvider(roomId: string, serverUrl: string, user: CollaborationUser): WebSocketProvider {
  const key = `${roomId}`;
  let provider = providerCache.get(key);
  if (!provider || provider.isConnected() === false) {
    // Create new provider if none exists or if disconnected
    if (provider) {
      provider.destroy();
    }
    provider = new WebSocketProvider(roomId, serverUrl, user);
    providerCache.set(key, provider);
  }
  return provider;
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

export function CollaborationPlugin({
  roomId,
  serverUrl = 'https://certeafiles-yjs-server.yassine-techini.workers.dev',
  user,
  onStatusChange,
  onSyncChange,
  onUsersChange,
  onStateChange,
  enabled = true,
}: CollaborationPluginProps): null {
  const providerRef = useRef<WebSocketProvider | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);

  const userId = user?.id || getUserId();
  const userName = user?.name || getUserName();
  const userColor = user?.color || getColorForUser(userId);

  const collaborationUser = useMemo(() => ({
    id: userId,
    name: userName,
    color: userColor,
  }), [userId, userName, userColor]);

  useEffect(() => {
    if (!enabled) {
      console.log('[CollaborationPlugin] Disabled');
      return;
    }

    console.log('[CollaborationPlugin] Initializing for room:', roomId);

    const provider = getOrCreateProvider(roomId, serverUrl, collaborationUser);
    providerRef.current = provider;

    // Set up callbacks
    const cleanups: (() => void)[] = [];

    if (onStatusChange) {
      cleanups.push(provider.onStatus(onStatusChange));
    }
    if (onSyncChange) {
      cleanups.push(provider.onSync(onSyncChange));
    }
    if (onUsersChange) {
      cleanups.push(provider.onUsers(onUsersChange));
    }
    if (onStateChange) {
      cleanups.push(
        provider.onStatus((status) => {
          onStateChange({
            status,
            isSynced: provider.isSynced(),
            isOffline: !navigator.onLine,
            users: provider.getUsers(),
          });
        })
      );
    }

    cleanupRef.current = cleanups;

    // Connect immediately
    if (!provider.isConnected()) {
      provider.connect();
    }

    return () => {
      console.log('[CollaborationPlugin] Cleaning up');
      cleanupRef.current.forEach((cleanup) => cleanup());
      cleanupRef.current = [];
    };
  }, [enabled, roomId, serverUrl, collaborationUser, onStatusChange, onSyncChange, onUsersChange, onStateChange]);

  // Cleanup on page unload
  useEffect(() => {
    const handleUnload = () => {
      providerCache.forEach((p) => p.destroy());
      providerCache.clear();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return null;
}

export default CollaborationPlugin;
