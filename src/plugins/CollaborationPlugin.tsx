/**
 * CollaborationPlugin - Real-time collaboration using Yjs
 * Per Constitution Section 7 - Collaboration
 */
import { useEffect, useCallback, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type {
  CollaborationConfig,
  CollaborationState,
  ConnectionStatus,
  CollaborationUser,
} from '../types/collaboration';
import { DEFAULT_COLLABORATION_CONFIG } from '../types/collaboration';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';

/**
 * Message types for Yjs protocol
 */
const MessageType = {
  SYNC: 0,
  AWARENESS: 1,
  AUTH: 2,
  QUERY_AWARENESS: 3,
} as const;

/**
 * WebSocket provider for Yjs
 */
class WebSocketProvider {
  private ws: WebSocket | null = null;
  private doc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;
  private roomId: string;
  private serverUrl: string;
  private user: CollaborationUser;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private synced = false;
  private _onStatusChange: ((status: ConnectionStatus) => void) | null = null;
  private _onSyncChange: ((synced: boolean) => void) | null = null;
  private _onUsersChange: ((users: CollaborationUser[]) => void) | null = null;

  constructor(
    doc: Y.Doc,
    awareness: awarenessProtocol.Awareness,
    roomId: string,
    serverUrl: string,
    user: CollaborationUser,
    options: { reconnectDelay?: number | undefined; maxReconnectAttempts?: number | undefined } = {}
  ) {
    this.doc = doc;
    this.awareness = awareness;
    this.roomId = roomId;
    this.serverUrl = serverUrl;
    this.user = user;
    this.reconnectDelay = options.reconnectDelay ?? 1000;
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10;

    // Set up awareness for current user
    this.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name,
      color: user.color,
    });

    // Listen for document updates
    this.doc.on('update', this.handleDocUpdate);

    // Listen for awareness updates
    this.awareness.on('update', this.handleAwarenessUpdate);
  }

  /**
   * Set status change callback
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): void {
    this._onStatusChange = callback;
  }

  /**
   * Set sync change callback
   */
  onSyncChange(callback: (synced: boolean) => void): void {
    this._onSyncChange = callback;
  }

  /**
   * Set users change callback
   */
  onUsersChange(callback: (users: CollaborationUser[]) => void): void {
    this._onUsersChange = callback;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this._onStatusChange?.('connecting');

    try {
      // Build WebSocket URL
      const url = new URL(this.serverUrl);
      url.searchParams.set('room', this.roomId);
      url.searchParams.set('userId', this.user.id);
      url.searchParams.set('userName', this.user.name);
      url.searchParams.set('userColor', this.user.color);

      this.ws = new WebSocket(url.toString());
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[CollaborationPlugin] WebSocket connected');
        this.reconnectAttempts = 0;
        this._onStatusChange?.('connected');

        // Send initial sync request
        this.sendSyncStep1();

        // Query for awareness states
        this.sendQueryAwareness();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(new Uint8Array(event.data));
      };

      this.ws.onclose = (event) => {
        console.log('[CollaborationPlugin] WebSocket closed:', event.code, event.reason);
        this.ws = null;
        this.synced = false;
        this._onSyncChange?.(false);

        if (event.code !== 1000) {
          this.attemptReconnect();
        } else {
          this._onStatusChange?.('disconnected');
        }
      };

      this.ws.onerror = (event) => {
        console.error('[CollaborationPlugin] WebSocket error:', event);
        this._onStatusChange?.('error');
      };
    } catch (error) {
      console.error('[CollaborationPlugin] Failed to connect:', error);
      this._onStatusChange?.('error');
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }

    this._onStatusChange?.('disconnected');
  }

  /**
   * Destroy provider
   */
  destroy(): void {
    this.disconnect();
    this.doc.off('update', this.handleDocUpdate);
    this.awareness.off('update', this.handleAwarenessUpdate);
    this.awareness.destroy();
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[CollaborationPlugin] Max reconnect attempts reached');
      this._onStatusChange?.('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[CollaborationPlugin] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this._onStatusChange?.('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage = (data: Uint8Array): void => {
    const decoder = decoding.createDecoder(data);
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MessageType.SYNC:
        this.handleSyncMessage(decoder);
        break;
      case MessageType.AWARENESS:
        this.handleAwarenessMessage(decoder);
        break;
    }
  };

  /**
   * Handle sync protocol message
   */
  private handleSyncMessage(decoder: decoding.Decoder): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.SYNC);

    const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, this.doc, this);

    // If there's a response to send
    if (encoding.length(encoder) > 1) {
      this.send(encoding.toUint8Array(encoder));
    }

    // Mark as synced after receiving sync step 2
    if (syncMessageType === 1 && !this.synced) {
      this.synced = true;
      this._onSyncChange?.(true);
    }
  }

  /**
   * Handle awareness protocol message
   */
  private handleAwarenessMessage(decoder: decoding.Decoder): void {
    const update = decoding.readVarUint8Array(decoder);
    awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);

    // Update users list
    this.updateUsers();
  }

  /**
   * Handle local document update
   */
  private handleDocUpdate = (update: Uint8Array, origin: unknown): void => {
    if (origin === this) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.SYNC);
    syncProtocol.writeUpdate(encoder, update);
    this.send(encoding.toUint8Array(encoder));
  };

  /**
   * Handle local awareness update
   */
  private handleAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown
  ): void => {
    if (origin === this) return;

    const changedClients = added.concat(updated, removed);
    if (changedClients.length === 0) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
    );
    this.send(encoding.toUint8Array(encoder));
  };

  /**
   * Send sync step 1
   */
  private sendSyncStep1(): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.SYNC);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    this.send(encoding.toUint8Array(encoder));
  }

  /**
   * Send query awareness message
   */
  private sendQueryAwareness(): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.QUERY_AWARENESS);
    this.send(encoding.toUint8Array(encoder));
  }

  /**
   * Send message to WebSocket
   */
  private send(message: Uint8Array): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  /**
   * Update connected users list
   */
  private updateUsers(): void {
    const users: CollaborationUser[] = [];
    const states = this.awareness.getStates();
    states.forEach((state) => {
      const stateObj = state as { user?: CollaborationUser };
      if (stateObj.user) {
        users.push(stateObj.user);
      }
    });
    this._onUsersChange?.(users);
  }
}

/**
 * Props for CollaborationPlugin
 */
export interface CollaborationPluginProps {
  /** Collaboration configuration */
  config: CollaborationConfig;
  /** Callback when connection status changes */
  onStatusChange?: ((status: ConnectionStatus) => void) | undefined;
  /** Callback when sync status changes */
  onSyncChange?: ((synced: boolean) => void) | undefined;
  /** Callback when connected users change */
  onUsersChange?: ((users: CollaborationUser[]) => void) | undefined;
  /** Callback when collaboration state changes */
  onStateChange?: ((state: CollaborationState) => void) | undefined;
  /** Whether collaboration is enabled */
  enabled?: boolean | undefined;
}

/**
 * CollaborationPlugin - Enables real-time collaboration
 */
export function CollaborationPlugin({
  config,
  onStatusChange,
  onSyncChange,
  onUsersChange,
  onStateChange,
  enabled = true,
}: CollaborationPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const providerRef = useRef<WebSocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const awarenessRef = useRef<awarenessProtocol.Awareness | null>(null);
  const indexeddbRef = useRef<IndexeddbPersistence | null>(null);

  // Merge config with defaults
  const fullConfig = { ...DEFAULT_COLLABORATION_CONFIG, ...config };

  // Track state
  const [, setState] = useState<CollaborationState>({
    status: 'disconnected',
    isSynced: false,
    isOffline: !navigator.onLine,
    users: [],
  });

  // Update state and notify
  const updateState = useCallback((updates: Partial<CollaborationState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      updateState({ isOffline: false });
      // Reconnect when back online
      providerRef.current?.connect();
    };

    const handleOffline = () => {
      updateState({ isOffline: true });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateState]);

  // Initialize Yjs and connect
  useEffect(() => {
    if (!enabled) return;

    // Create Y.Doc
    const doc = new Y.Doc();
    docRef.current = doc;

    // Create awareness
    const awareness = new awarenessProtocol.Awareness(doc);
    awarenessRef.current = awareness;

    // Set up IndexedDB persistence if enabled
    if (fullConfig.enableOfflinePersistence) {
      const indexeddb = new IndexeddbPersistence(
        `certeafiles-${fullConfig.roomId}`,
        doc
      );
      indexeddbRef.current = indexeddb;

      indexeddb.on('synced', () => {
        console.log('[CollaborationPlugin] IndexedDB synced');
      });
    }

    // Create WebSocket provider
    const provider = new WebSocketProvider(
      doc,
      awareness,
      fullConfig.roomId,
      fullConfig.serverUrl,
      fullConfig.user,
      {
        reconnectDelay: fullConfig.reconnectDelay,
        maxReconnectAttempts: fullConfig.maxReconnectAttempts,
      }
    );
    providerRef.current = provider;

    // Set up callbacks
    provider.onStatusChange((status) => {
      updateState({ status });
      onStatusChange?.(status);
    });

    provider.onSyncChange((synced) => {
      updateState({ isSynced: synced, lastSyncedAt: synced ? new Date() : undefined });
      onSyncChange?.(synced);
    });

    provider.onUsersChange((users) => {
      updateState({ users });
      onUsersChange?.(users);
    });

    // Connect if online
    if (navigator.onLine) {
      provider.connect();
    }

    // Clean up
    return () => {
      provider.destroy();
      indexeddbRef.current?.destroy();
      doc.destroy();
    };
  }, [
    enabled,
    fullConfig.roomId,
    fullConfig.serverUrl,
    fullConfig.user.id,
    fullConfig.user.name,
    fullConfig.user.color,
    fullConfig.enableOfflinePersistence,
    fullConfig.reconnectDelay,
    fullConfig.maxReconnectAttempts,
    onStatusChange,
    onSyncChange,
    onUsersChange,
    updateState,
  ]);

  // Bind Yjs to Lexical editor
  useEffect(() => {
    if (!enabled || !docRef.current || !awarenessRef.current) return;

    // TODO: Integrate with @lexical/yjs when proper bindings are set up
    // For now, we're setting up the provider infrastructure

    // The actual Lexical integration would use:
    // import { CollaborationPlugin as LexicalCollabPlugin } from '@lexical/react/LexicalCollaborationPlugin';
    // But we're creating our own provider layer for more control

    console.log('[CollaborationPlugin] Yjs provider initialized for room:', fullConfig.roomId);
  }, [enabled, fullConfig.roomId, editor]);

  return null;
}

export default CollaborationPlugin;
