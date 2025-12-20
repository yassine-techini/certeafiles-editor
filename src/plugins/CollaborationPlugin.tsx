/**
 * CollaborationPlugin - Real-time collaboration using Yjs and Cloudflare Durable Objects
 * Per Constitution Section 7 - Collaboration
 *
 * Uses @lexical/yjs for proper binding between Lexical and Yjs
 */
import { useEffect, useRef, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  createBinding,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
  initLocalState,
} from '@lexical/yjs';
import type { Binding, Provider, ExcludedProperties } from '@lexical/yjs';
import * as Y from 'yjs';
import { Text as YText, YEvent } from 'yjs';
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
 * WebSocket Provider for Yjs - compatible with Provider interface for @lexical/yjs
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
  private _destroyed = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private connecting = false;

  private statusCallbacks = new Set<(arg0: { status: string }) => void>();
  private syncCallbacks = new Set<(synced: boolean) => void>();
  private updateCallbacks = new Set<(arg0: unknown) => void>();
  private reloadCallbacks = new Set<(doc: Y.Doc) => void>();

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

    console.log('[CollaborationProvider] Created for room:', roomId);
  }

  // Provider interface implementation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(type: string, cb: (...args: any[]) => void): void {
    if (type === 'sync') {
      this.syncCallbacks.add(cb as (synced: boolean) => void);
      // Immediately notify with current state
      (cb as (synced: boolean) => void)(this.synced);
    } else if (type === 'status') {
      this.statusCallbacks.add(cb as (arg0: { status: string }) => void);
      (cb as (arg0: { status: string }) => void)({ status: this._connected ? 'connected' : 'disconnected' });
    } else if (type === 'update') {
      this.updateCallbacks.add(cb as (arg0: unknown) => void);
    } else if (type === 'reload') {
      this.reloadCallbacks.add(cb as (doc: Y.Doc) => void);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(type: string, cb: (...args: any[]) => void): void {
    if (type === 'sync') {
      this.syncCallbacks.delete(cb as (synced: boolean) => void);
    } else if (type === 'status') {
      this.statusCallbacks.delete(cb as (arg0: { status: string }) => void);
    } else if (type === 'update') {
      this.updateCallbacks.delete(cb as (arg0: unknown) => void);
    } else if (type === 'reload') {
      this.reloadCallbacks.delete(cb as (doc: Y.Doc) => void);
    }
  }

  private notifyStatus(status: string): void {
    console.log('[CollaborationProvider] Status:', status);
    this.statusCallbacks.forEach((cb) => cb({ status }));
  }

  private notifySync(synced: boolean): void {
    this.synced = synced;
    this.syncCallbacks.forEach((cb) => cb(synced));
  }

  private notifyUpdate(update: unknown): void {
    this.updateCallbacks.forEach((cb) => cb(update));
  }

  // Public getter for destroyed state
  get destroyed(): boolean {
    return this._destroyed;
  }

  connect(): void {
    if (this._destroyed || this.connecting || this._connected) {
      console.log('[CollaborationProvider] Skipping connect:', {
        destroyed: this._destroyed,
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
        if (this._destroyed) {
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

          if (!this._destroyed && event.code !== 1000) {
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
    if (this._destroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
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
      if (!this._destroyed) {
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
    // Notify update listeners
    this.notifyUpdate({ update, origin });

    if (origin === this || this._destroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

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
    if (origin === this || this._destroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

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
    this._destroyed = true;
    this.disconnect();
    this.awareness.destroy();
    this.doc.destroy();
    this.statusCallbacks.clear();
    this.syncCallbacks.clear();
    this.updateCallbacks.clear();
    this.reloadCallbacks.clear();
  }
}

// Singleton provider cache with cleanup support
const providerCache = new Map<string, WebSocketProvider>();

/**
 * Get or create a WebSocket provider for a room
 * Includes proper cleanup of destroyed/stale providers
 */
function getOrCreateProvider(roomId: string, serverUrl: string, user: CollaborationUser): WebSocketProvider {
  const key = `${roomId}`;
  let provider = providerCache.get(key);

  // Check if existing provider is still valid (not destroyed)
  if (provider) {
    // If the provider was destroyed, remove it from cache and create new one
    if ((provider as unknown as { destroyed?: boolean }).destroyed) {
      console.log('[CollaborationPlugin] Removing destroyed provider from cache:', roomId);
      providerCache.delete(key);
      provider = undefined;
    }
  }

  if (!provider) {
    provider = new WebSocketProvider(roomId, serverUrl, user);
    providerCache.set(key, provider);
    console.log('[CollaborationPlugin] Created new provider for room:', roomId);
  } else {
    console.log('[CollaborationPlugin] Reusing existing provider for room:', roomId, 'connected:', provider.isConnected());
  }
  return provider;
}

/**
 * Remove and destroy a provider from the cache
 */
export function removeProvider(roomId: string): void {
  const key = `${roomId}`;
  const provider = providerCache.get(key);
  if (provider) {
    console.log('[CollaborationPlugin] Removing provider for room:', roomId);
    provider.destroy();
    providerCache.delete(key);
  }
}

/**
 * Clear all providers from the cache
 */
export function clearAllProviders(): void {
  console.log('[CollaborationPlugin] Clearing all providers');
  providerCache.forEach((provider, _key) => {
    provider.destroy();
  });
  providerCache.clear();
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
  const [editor] = useLexicalComposerContext();
  const providerRef = useRef<WebSocketProvider | null>(null);
  const bindingRef = useRef<Binding | null>(null);

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

    console.log('[CollaborationPlugin] Initializing for room:', roomId, 'serverUrl:', serverUrl);

    const provider = getOrCreateProvider(roomId, serverUrl, collaborationUser);
    providerRef.current = provider;

    // Create Lexical <-> Yjs binding
    const yjsDocMap = new Map<string, Y.Doc>();
    yjsDocMap.set('root', provider.doc);

    // Create the binding between Lexical and Yjs
    const excludedProperties: ExcludedProperties = new Map();
    const binding = createBinding(
      editor,
      provider as unknown as Provider,
      crypto.randomUUID(),
      provider.doc,
      yjsDocMap,
      excludedProperties
    );

    bindingRef.current = binding;

    // Initialize local state for cursor sync
    initLocalState(
      provider as unknown as Provider,
      userName,
      userColor,
      true, // focusing
      { id: userId }
    );

    // Set up status callbacks
    const handleStatus = ({ status }: { status: string }) => {
      console.log('[CollaborationPlugin] Status changed to:', status);
      if (onStatusChange) {
        onStatusChange(status as ConnectionStatus);
      }
      if (onStateChange) {
        onStateChange({
          status: status as ConnectionStatus,
          isSynced: provider.isSynced(),
          isOffline: !navigator.onLine,
          users: provider.getUsers(),
        });
      }
    };

    const handleSync = (synced: boolean) => {
      console.log('[CollaborationPlugin] Sync:', synced);
      if (onSyncChange) {
        onSyncChange(synced);
      }
    };

    provider.on('status', handleStatus);
    provider.on('sync', handleSync);

    // Set up users callback via awareness
    const handleAwarenessChange = () => {
      const users = provider.getUsers();
      if (onUsersChange) {
        onUsersChange(users);
      }
    };
    provider.awareness.on('update', handleAwarenessChange);

    // Set up Lexical -> Yjs sync
    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, prevEditorState, normalizedNodes, tags }) => {
        if (tags.has('collaboration') || tags.has('historic')) {
          return;
        }
        syncLexicalUpdateToYjs(
          binding,
          provider as unknown as Provider,
          prevEditorState,
          editorState,
          dirtyElements,
          dirtyLeaves,
          normalizedNodes,
          tags
        );
      }
    );

    // Set up Yjs -> Lexical sync
    const yTextContent = provider.doc.get('root', Y.XmlText) as Y.XmlText;
    const handleYjsObserve = (events: Array<YEvent<YText>>) => {
      syncYjsChangesToLexical(binding, provider as unknown as Provider, events, false);
    };
    yTextContent.observeDeep(handleYjsObserve as (events: Array<Y.YEvent<Y.AbstractType<unknown>>>) => void);

    // Connect immediately
    if (!provider.isConnected()) {
      provider.connect();
    }

    return () => {
      console.log('[CollaborationPlugin] Cleaning up');
      removeUpdateListener();
      provider.off('status', handleStatus);
      provider.off('sync', handleSync);
      provider.awareness.off('update', handleAwarenessChange);
      yTextContent.unobserveDeep(handleYjsObserve as (events: Array<Y.YEvent<Y.AbstractType<unknown>>>) => void);
      bindingRef.current = null;
    };
  }, [editor, enabled, roomId, serverUrl, collaborationUser, userName, userColor, userId, onStatusChange, onSyncChange, onUsersChange, onStateChange]);

  // Cleanup on page unload
  useEffect(() => {
    const handleUnload = () => {
      clearAllProviders();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return null;
}

export default CollaborationPlugin;
