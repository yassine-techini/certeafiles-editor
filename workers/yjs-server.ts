/**
 * Yjs Durable Object Server
 * Real-time collaboration backend using Cloudflare Durable Objects
 * Per Constitution Section 7 - Collaboration
 */

import * as Y from 'yjs';
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
 * WebSocket close codes
 */
const CloseCode = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  UNSUPPORTED: 1003,
  ABNORMAL: 1006,
  UNAUTHORIZED: 4001,
  ROOM_NOT_FOUND: 4004,
} as const;

/**
 * Client connection state
 */
interface ClientState {
  ws: WebSocket;
  clientId: number;
  userId: string;
  userName: string;
  userColor: string;
  awareness: Map<string, unknown>;
  lastSeen: number;
}

/**
 * Durable Object state interface
 */
interface DurableObjectState {
  storage: DurableObjectStorage;
}

/**
 * YjsServer Durable Object
 * Handles WebSocket connections and Y.Doc synchronization for a single document room
 */
export class YjsServer implements DurableObject {
  private state: DurableObjectState;
  private doc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;
  private clients: Map<WebSocket, ClientState>;
  private roomId: string | null = null;
  private persistenceTimer: ReturnType<typeof setInterval> | null = null;
  private lastPersisted: number = 0;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);
    this.clients = new Map();

    // Set up awareness change handler
    this.awareness.on('update', (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      const changedClients = added.concat(updated, removed);
      this.broadcastAwareness(changedClients, origin);
    });

    // Set up document update handler
    this.doc.on('update', (update: Uint8Array, origin: unknown) => {
      this.broadcastUpdate(update, origin);
      this.schedulePersistence();
    });
  }

  /**
   * Handle incoming HTTP/WebSocket requests
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Set roomId from query params for all requests
    this.roomId = url.searchParams.get('room') || 'default';

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Handle WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      return this.handleWebSocket(request);
    }

    // Handle REST API endpoints
    if (path === '/health') {
      return this.handleHealth();
    }

    if (path === '/state') {
      return this.handleState();
    }

    if (path === '/reset' && (request.method === 'POST' || request.method === 'DELETE')) {
      return this.handleReset();
    }

    return new Response('Not Found', { status: 404 });
  }

  /**
   * Handle WebSocket connection upgrade
   */
  private async handleWebSocket(request: Request): Promise<Response> {
    const url = new URL(request.url);
    this.roomId = url.searchParams.get('room') || 'default';

    // Get user info from query params or headers
    const userId = url.searchParams.get('userId') || crypto.randomUUID();
    const userName = url.searchParams.get('userName') || 'Anonymous';
    const userColor = url.searchParams.get('userColor') || this.generateColor();

    // Load persisted document state if this is the first connection
    if (this.clients.size === 0) {
      await this.loadPersistedState();
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket
    server.accept();

    // Generate unique client ID
    const clientId = Math.floor(Math.random() * 0xFFFFFFFF);

    // Store client state
    const clientState: ClientState = {
      ws: server,
      clientId,
      userId,
      userName,
      userColor,
      awareness: new Map(),
      lastSeen: Date.now(),
    };
    this.clients.set(server, clientState);

    console.log(`[YjsServer] Client connected: ${userId} (${userName}) to room ${this.roomId}`);

    // Set up message handler
    server.addEventListener('message', (event) => {
      this.handleMessage(server, event.data);
    });

    // Set up close handler
    server.addEventListener('close', () => {
      this.handleClose(server);
    });

    // Set up error handler
    server.addEventListener('error', (event) => {
      console.error('[YjsServer] WebSocket error:', event);
      this.handleClose(server);
    });

    // Send initial sync
    this.sendInitialSync(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(ws: WebSocket, data: ArrayBuffer | string): void {
    const client = this.clients.get(ws);
    if (!client) return;

    client.lastSeen = Date.now();

    try {
      const message = new Uint8Array(data as ArrayBuffer);
      const decoder = decoding.createDecoder(message);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MessageType.SYNC:
          this.handleSyncMessage(ws, decoder, client);
          break;
        case MessageType.AWARENESS:
          this.handleAwarenessMessage(decoder, client);
          break;
        case MessageType.QUERY_AWARENESS:
          this.sendAwarenessState(ws);
          break;
        default:
          console.warn(`[YjsServer] Unknown message type: ${messageType}`);
      }
    } catch (error) {
      console.error('[YjsServer] Error handling message:', error);
    }
  }

  /**
   * Handle sync protocol message
   */
  private handleSyncMessage(
    ws: WebSocket,
    decoder: decoding.Decoder,
    client: ClientState
  ): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.SYNC);

    const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, this.doc, client);

    // If there's a response to send
    if (encoding.length(encoder) > 1) {
      this.send(ws, encoding.toUint8Array(encoder));
    }
  }

  /**
   * Handle awareness protocol message
   */
  private handleAwarenessMessage(
    decoder: decoding.Decoder,
    client: ClientState
  ): void {
    const update = decoding.readVarUint8Array(decoder);
    awarenessProtocol.applyAwarenessUpdate(this.awareness, update, client);
  }

  /**
   * Send initial sync to new client
   */
  private sendInitialSync(ws: WebSocket): void {
    // Send sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.SYNC);
    syncProtocol.writeSyncStep1(encoder, this.doc);
    this.send(ws, encoding.toUint8Array(encoder));

    // Send current awareness state
    this.sendAwarenessState(ws);
  }

  /**
   * Send awareness state to client
   */
  private sendAwarenessState(ws: WebSocket): void {
    const awarenessStates = this.awareness.getStates();
    if (awarenessStates.size > 0) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.AWARENESS);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(
          this.awareness,
          Array.from(awarenessStates.keys())
        )
      );
      this.send(ws, encoding.toUint8Array(encoder));
    }
  }

  /**
   * Broadcast document update to all clients except origin
   */
  private broadcastUpdate(update: Uint8Array, origin: unknown): void {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    this.clients.forEach((client, ws) => {
      if (ws !== origin && ws.readyState === WebSocket.OPEN) {
        this.send(ws, message);
      }
    });
  }

  /**
   * Broadcast awareness update to all clients except origin
   */
  private broadcastAwareness(changedClients: number[], origin: unknown): void {
    if (changedClients.length === 0) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    this.clients.forEach((client, ws) => {
      if (ws !== origin && ws.readyState === WebSocket.OPEN) {
        this.send(ws, message);
      }
    });
  }

  /**
   * Send message to WebSocket
   */
  private send(ws: WebSocket, message: Uint8Array): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    } catch (error) {
      console.error('[YjsServer] Error sending message:', error);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleClose(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (client) {
      console.log(`[YjsServer] Client disconnected: ${client.userId} (${client.userName})`);

      // Remove awareness state for this client
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [client.clientId],
        'disconnect'
      );

      this.clients.delete(ws);

      // Persist state when last client disconnects
      if (this.clients.size === 0) {
        this.persistState();
      }
    }
  }

  /**
   * Schedule persistence (debounced)
   */
  private schedulePersistence(): void {
    const now = Date.now();
    const debounceMs = 5000; // 5 seconds

    if (now - this.lastPersisted > debounceMs) {
      if (this.persistenceTimer) {
        clearTimeout(this.persistenceTimer);
      }
      this.persistenceTimer = setTimeout(() => {
        this.persistState();
      }, debounceMs);
    }
  }

  /**
   * Persist document state to Durable Object storage
   */
  private async persistState(): Promise<void> {
    try {
      const state = Y.encodeStateAsUpdate(this.doc);
      await this.state.storage.put(`doc:${this.roomId}`, state);
      this.lastPersisted = Date.now();
      console.log(`[YjsServer] Persisted document state for room ${this.roomId}`);
    } catch (error) {
      console.error('[YjsServer] Error persisting state:', error);
    }
  }

  /**
   * Load persisted document state from Durable Object storage
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const state = await this.state.storage.get<Uint8Array>(`doc:${this.roomId}`);
      if (state) {
        Y.applyUpdate(this.doc, new Uint8Array(state));
        console.log(`[YjsServer] Loaded persisted state for room ${this.roomId}`);
      }
    } catch (error) {
      console.error('[YjsServer] Error loading persisted state:', error);
    }
  }

  /**
   * Handle health check endpoint
   */
  private handleHealth(): Response {
    return new Response(JSON.stringify({
      status: 'healthy',
      roomId: this.roomId,
      clients: this.clients.size,
      docSize: Y.encodeStateAsUpdate(this.doc).length,
      timestamp: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handle state endpoint (for debugging)
   */
  private handleState(): Response {
    const clientList = Array.from(this.clients.values()).map((client) => ({
      clientId: client.clientId,
      userId: client.userId,
      userName: client.userName,
      userColor: client.userColor,
      lastSeen: new Date(client.lastSeen).toISOString(),
    }));

    return new Response(JSON.stringify({
      roomId: this.roomId,
      clients: clientList,
      awarenessStates: Object.fromEntries(this.awareness.getStates()),
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Handle reset endpoint - clears the room state
   */
  private async handleReset(): Promise<Response> {
    try {
      console.log(`[YjsServer] Resetting room ${this.roomId}`);

      // Close all connected clients
      this.clients.forEach((client, ws) => {
        try {
          ws.close(CloseCode.NORMAL, 'Room reset');
        } catch (e) {
          // Ignore close errors
        }
      });
      this.clients.clear();

      // Clear the document
      const root = this.doc.get('root', Y.XmlText) as Y.XmlText;
      this.doc.transact(() => {
        root.delete(0, root.length);
      });

      // Delete persisted state
      await this.state.storage.delete(`doc:${this.roomId}`);

      // Create a fresh document
      this.doc.destroy();
      this.doc = new Y.Doc();
      this.awareness.destroy();
      this.awareness = new awarenessProtocol.Awareness(this.doc);

      // Re-setup handlers
      this.awareness.on('update', (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        origin: unknown
      ) => {
        const changedClients = added.concat(updated, removed);
        this.broadcastAwareness(changedClients, origin);
      });

      this.doc.on('update', (update: Uint8Array, origin: unknown) => {
        this.broadcastUpdate(update, origin);
        this.schedulePersistence();
      });

      console.log(`[YjsServer] Room ${this.roomId} has been reset`);

      return new Response(JSON.stringify({
        success: true,
        message: `Room ${this.roomId} has been reset`,
        timestamp: new Date().toISOString(),
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('[YjsServer] Error resetting room:', error);
      return new Response(JSON.stringify({
        success: false,
        error: String(error),
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  /**
   * Generate a random color for user
   */
  private generateColor(): string {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

/**
 * Worker entry point
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('room') || 'default';

    // Get Durable Object stub for this room
    const id = env.YJS_SERVER.idFromName(roomId);
    const stub = env.YJS_SERVER.get(id);

    // Forward request to Durable Object
    return stub.fetch(request);
  },
};

/**
 * Environment interface
 */
interface Env {
  YJS_SERVER: DurableObjectNamespace;
}

/**
 * Durable Object interface
 */
interface DurableObject {
  fetch(request: Request): Promise<Response>;
}
