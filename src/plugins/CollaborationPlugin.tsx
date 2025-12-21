/**
 * CollaborationPlugin - Real-time collaboration using Yjs and Cloudflare Durable Objects
 * Per Constitution Section 7 - Collaboration
 *
 * Uses the official Lexical CollaborationPlugin with a custom WebSocket provider
 */
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { CollaborationPlugin as LexicalCollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import type { Provider, ProviderAwareness, UserState } from '@lexical/yjs';
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
 * Wrapper for y-protocols Awareness that implements Lexical's ProviderAwareness interface
 */
class LexicalAwarenessWrapper implements ProviderAwareness {
  private yjsAwareness: awarenessProtocol.Awareness;

  constructor(yjsAwareness: awarenessProtocol.Awareness) {
    this.yjsAwareness = yjsAwareness;
  }

  getLocalState(): UserState | null {
    const state = this.yjsAwareness.getLocalState();
    if (!state) return null;
    // Convert to UserState format
    return {
      anchorPos: state.anchorPos ?? null,
      color: state.color ?? state.user?.color ?? '#000000',
      focusing: state.focusing ?? false,
      focusPos: state.focusPos ?? null,
      name: state.name ?? state.user?.name ?? 'Anonymous',
      awarenessData: state.awarenessData ?? {},
      ...state,
    } as UserState;
  }

  getStates(): Map<number, UserState> {
    const states = this.yjsAwareness.getStates();
    const result = new Map<number, UserState>();
    states.forEach((state, clientId) => {
      result.set(clientId, {
        anchorPos: state.anchorPos ?? null,
        color: state.color ?? state.user?.color ?? '#000000',
        focusing: state.focusing ?? false,
        focusPos: state.focusPos ?? null,
        name: state.name ?? state.user?.name ?? 'Anonymous',
        awarenessData: state.awarenessData ?? {},
        ...state,
      } as UserState);
    });
    return result;
  }

  off(_type: 'update', cb: () => void): void {
    this.yjsAwareness.off('update', cb);
  }

  on(_type: 'update', cb: () => void): void {
    this.yjsAwareness.on('update', cb);
  }

  setLocalState(state: UserState): void {
    // Need to call setLocalStateField for each field
    Object.entries(state).forEach(([key, value]) => {
      this.yjsAwareness.setLocalStateField(key, value);
    });
  }

  setLocalStateField(field: string, value: unknown): void {
    this.yjsAwareness.setLocalStateField(field, value);
  }

  // Expose underlying awareness for internal use
  getYjsAwareness(): awarenessProtocol.Awareness {
    return this.yjsAwareness;
  }
}

/**
 * WebSocket Provider for Yjs - compatible with Provider interface for @lexical/yjs
 */
class WebSocketProvider implements Provider {
  private ws: WebSocket | null = null;
  doc: Y.Doc;
  private _yjsAwareness: awarenessProtocol.Awareness;
  awareness: ProviderAwareness;
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
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  private statusCallbacks = new Set<(arg0: { status: string }) => void>();
  private syncCallbacks = new Set<(synced: boolean) => void>();
  private updateCallbacks = new Set<(arg0: unknown) => void>();
  private reloadCallbacks = new Set<(doc: Y.Doc) => void>();

  constructor(roomId: string, serverUrl: string, user: CollaborationUser, doc: Y.Doc) {
    this.roomId = roomId;
    this.serverUrl = serverUrl;
    this.user = user;
    this.doc = doc;
    this._yjsAwareness = new awarenessProtocol.Awareness(this.doc);
    this.awareness = new LexicalAwarenessWrapper(this._yjsAwareness);

    // Set local user state
    this._yjsAwareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
    });

    console.log('[WebSocketProvider] Created for room:', roomId, 'docClientId:', this.doc.clientID);
  }

  // Provider interface implementation - using function overloads
  on(type: 'sync', cb: (isSynced: boolean) => void): void;
  on(type: 'status', cb: (arg0: { status: string }) => void): void;
  on(type: 'update', cb: (arg0: unknown) => void): void;
  on(type: 'reload', cb: (doc: Y.Doc) => void): void;
  on(
    type: 'sync' | 'status' | 'update' | 'reload',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb: (...args: any[]) => void
  ): void {
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

  off(type: 'sync', cb: (isSynced: boolean) => void): void;
  off(type: 'status', cb: (arg0: { status: string }) => void): void;
  off(type: 'update', cb: (arg0: unknown) => void): void;
  off(type: 'reload', cb: (doc: Y.Doc) => void): void;
  off(
    type: 'sync' | 'status' | 'update' | 'reload',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb: (...args: any[]) => void
  ): void {
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
    console.log('[WebSocketProvider] Status:', status);
    this.statusCallbacks.forEach((cb) => cb({ status }));
  }

  private notifySync(synced: boolean): void {
    this.synced = synced;
    console.log('[WebSocketProvider] Synced:', synced);
    this.syncCallbacks.forEach((cb) => cb(synced));
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  connect(): void {
    if (this._destroyed || this.connecting || this._connected) {
      console.log('[WebSocketProvider] Skipping connect:', {
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

    console.log('[WebSocketProvider] Connecting to:', url.toString());

    try {
      const ws = new WebSocket(url.toString());
      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        if (this._destroyed) {
          ws.close();
          return;
        }

        console.log('[WebSocketProvider] WebSocket connected');
        this.ws = ws;
        this.connecting = false;
        this._connected = true;
        this.reconnectAttempts = 0;
        this.notifyStatus('connected');

        // Send sync step 1
        this.sendSyncStep1();

        // Send awareness
        this.sendAwareness();

        // Set up listeners for ongoing updates
        this.doc.on('update', this.handleDocUpdate);
        this._yjsAwareness.on('update', this.handleAwarenessUpdate);

        // Start keep-alive to prevent Cloudflare from closing the connection
        this.startKeepAlive();
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws) return;
        this.handleMessage(new Uint8Array(event.data));
      };

      ws.onclose = (event) => {
        console.log('[WebSocketProvider] WebSocket closed:', event.code, event.reason);

        if (this.ws === ws) {
          this.ws = null;
          this._connected = false;
          this.connecting = false;

          // Remove listeners
          this.doc.off('update', this.handleDocUpdate);
          this._yjsAwareness.off('update', this.handleAwarenessUpdate);

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
        console.error('[WebSocketProvider] WebSocket error:', error);
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
      syncProtocol.writeSyncStep1(encoder, this.doc);
      this.ws.send(encoding.toUint8Array(encoder));
      console.log('[WebSocketProvider] Sent sync step 1');
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
        awarenessProtocol.encodeAwarenessUpdate(this._yjsAwareness, [this.doc.clientID])
      );
      this.ws.send(encoding.toUint8Array(encoder));
      console.log('[WebSocketProvider] Sent awareness');
    } catch (e) {
      console.error('[WebSocketProvider] Error sending awareness:', e);
    }
  }

  private startKeepAlive(): void {
    this.stopKeepAlive();
    // Send awareness update every 30 seconds to keep connection alive
    this.keepAliveTimer = setInterval(() => {
      if (this._connected && this.ws?.readyState === WebSocket.OPEN) {
        this.sendAwareness();
      }
    }, 30000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this._destroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketProvider] Max reconnect attempts reached');
      this.notifyStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), 30000);
    console.log(`[WebSocketProvider] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

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
          console.log('[WebSocketProvider] Synced with server');
          this.notifySync(true);
        }
      } else if (messageType === MessageType.AWARENESS) {
        const update = decoding.readVarUint8Array(decoder);
        awarenessProtocol.applyAwarenessUpdate(this._yjsAwareness, update, this);
      }
    } catch (e) {
      console.error('[WebSocketProvider] Error handling message:', e);
    }
  };

  private handleDocUpdate = (update: Uint8Array, origin: unknown): void => {
    // Notify update listeners
    this.updateCallbacks.forEach((cb) => cb({ update, origin }));

    // Don't send updates that originated from the server
    if (origin === this || this._destroyed || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.SYNC);
      syncProtocol.writeUpdate(encoder, update);
      this.ws.send(encoding.toUint8Array(encoder));
      console.log('[WebSocketProvider] Sent doc update, size:', update.length);
    } catch (e) {
      console.error('[WebSocketProvider] Error sending doc update:', e);
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
        awarenessProtocol.encodeAwarenessUpdate(this._yjsAwareness, changed)
      );
      this.ws.send(encoding.toUint8Array(encoder));
    } catch (e) {
      console.error('[WebSocketProvider] Error sending awareness update:', e);
    }
  };

  getUsers(): CollaborationUser[] {
    const users: CollaborationUser[] = [];
    this._yjsAwareness.getStates().forEach((state) => {
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
    // Check if provider is still in cache - if so, keep connection alive
    // This handles React StrictMode where component unmounts then immediately remounts
    const cachedProvider = providerCache.get(this.roomId);
    const isCachedAndNotDestroyed = cachedProvider === this && !this._destroyed;

    if (isCachedAndNotDestroyed) {
      console.log('[WebSocketProvider] Disconnect called but provider is still cached, keeping connection alive');
      return;
    }

    console.log('[WebSocketProvider] Disconnecting:', {
      roomId: this.roomId,
      destroyed: this._destroyed,
      inCache: cachedProvider === this
    });

    this.stopKeepAlive();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.doc.off('update', this.handleDocUpdate);
    this._yjsAwareness.off('update', this.handleAwarenessUpdate);

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000);
      }
      this.ws = null;
    }
    this._connected = false;
    this.connecting = false;
    this.notifyStatus('disconnected');
  }

  destroy(): void {
    console.log('[WebSocketProvider] Destroying');
    this._destroyed = true;
    this.disconnect();
    this._yjsAwareness.destroy();
    // Don't destroy the doc - it's managed by Lexical
    this.statusCallbacks.clear();
    this.syncCallbacks.clear();
    this.updateCallbacks.clear();
    this.reloadCallbacks.clear();
  }
}

// Global provider cache - keyed by roomId
const providerCache = new Map<string, WebSocketProvider>();

/**
 * Get or create a WebSocket provider for a room
 * IMPORTANT: We cache providers by roomId to handle React StrictMode double-mount
 * But we MUST use the correct Y.Doc for the binding
 */
function getOrCreateProvider(
  roomId: string,
  serverUrl: string,
  user: CollaborationUser,
  doc: Y.Doc
): WebSocketProvider {
  let provider = providerCache.get(roomId);

  // Check if existing provider is still valid
  if (provider) {
    if (provider.destroyed) {
      console.log('[CollaborationPlugin] Removing destroyed provider from cache:', roomId);
      providerCache.delete(roomId);
      provider = undefined;
    } else if (provider.doc !== doc) {
      // Doc changed - we need to create a new provider with the new doc
      // Otherwise the Y.Doc binding won't work
      console.log('[CollaborationPlugin] Doc changed for room:', roomId, 'destroying old provider and creating new one');
      provider.destroy();
      providerCache.delete(roomId);
      provider = undefined;
    }
  }

  if (!provider) {
    provider = new WebSocketProvider(roomId, serverUrl, user, doc);
    providerCache.set(roomId, provider);
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
  const provider = providerCache.get(roomId);
  if (provider) {
    console.log('[CollaborationPlugin] Removing provider for room:', roomId);
    provider.destroy();
    providerCache.delete(roomId);
  }
}

/**
 * Clear all providers from the cache
 */
export function clearAllProviders(): void {
  console.log('[CollaborationPlugin] Clearing all providers');
  providerCache.forEach((provider) => {
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
}: CollaborationPluginProps): JSX.Element | null {
  const userId = user?.id || getUserId();
  const userName = user?.name || getUserName();
  const userColor = user?.color || getColorForUser(userId);

  const collaborationUser = useMemo(() => ({
    id: userId,
    name: userName,
    color: userColor,
  }), [userId, userName, userColor]);

  // Stable callback refs
  const onStatusChangeRef = useRef(onStatusChange);
  const onSyncChangeRef = useRef(onSyncChange);
  const onUsersChangeRef = useRef(onUsersChange);
  const onStateChangeRef = useRef(onStateChange);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onSyncChangeRef.current = onSyncChange;
    onUsersChangeRef.current = onUsersChange;
    onStateChangeRef.current = onStateChange;
  }, [onStatusChange, onSyncChange, onUsersChange, onStateChange]);

  // Provider factory for Lexical CollaborationPlugin
  const providerFactory = useCallback((id: string, yjsDocMap: Map<string, Y.Doc>): Provider => {
    console.log('[CollaborationPlugin] providerFactory called with id:', id);

    // IMPORTANT: Get or create doc and put it in yjsDocMap BEFORE creating provider
    let doc = yjsDocMap.get(id);
    if (!doc) {
      doc = new Y.Doc();
      yjsDocMap.set(id, doc);
      console.log('[CollaborationPlugin] Created new Y.Doc for id:', id);
    } else {
      console.log('[CollaborationPlugin] Reusing existing Y.Doc for id:', id);
    }

    const provider = getOrCreateProvider(roomId, serverUrl, collaborationUser, doc);

    // Set up callbacks
    const handleStatus = ({ status }: { status: string }) => {
      console.log('[CollaborationPlugin] Status change:', status);
      onStatusChangeRef.current?.(status as ConnectionStatus);
      onStateChangeRef.current?.({
        status: status as ConnectionStatus,
        isSynced: provider.isSynced(),
        isOffline: !navigator.onLine,
        users: provider.getUsers(),
      });
    };

    const handleSync = (synced: boolean) => {
      console.log('[CollaborationPlugin] Sync change:', synced);
      onSyncChangeRef.current?.(synced);
    };

    const handleAwarenessChange = () => {
      const users = provider.getUsers();
      onUsersChangeRef.current?.(users);
    };

    provider.on('status', handleStatus);
    provider.on('sync', handleSync);
    provider.awareness.on('update', handleAwarenessChange);

    // Connect AFTER setting up listeners
    if (!provider.isConnected()) {
      console.log('[CollaborationPlugin] Connecting provider...');
      provider.connect();
    }

    return provider;
  }, [roomId, serverUrl, collaborationUser]);

  // Cleanup on page unload
  useEffect(() => {
    const handleUnload = () => {
      clearAllProviders();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <LexicalCollaborationPlugin
      id={roomId}
      providerFactory={providerFactory}
      shouldBootstrap={true}
      username={userName}
      cursorColor={userColor}
    />
  );
}

export default CollaborationPlugin;
