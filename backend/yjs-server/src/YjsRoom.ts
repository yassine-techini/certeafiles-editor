/**
 * YjsRoom Durable Object
 *
 * Handles WebSocket connections for a single collaboration room.
 * Implements the standard Yjs sync protocol with awareness support.
 */

import * as Y from 'yjs';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';

// Message types matching the client-side protocol
const MessageType = {
  SYNC: 0,
  AWARENESS: 1,
  AUTH: 2,
  QUERY_AWARENESS: 3,
} as const;

interface Session {
  ws: WebSocket;
  clientId: number;
  userId?: string;
  userName?: string;
  userColor?: string;
}

export class YjsServer implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, Session> = new Map();
  private doc: Y.Doc;
  private awareness: awarenessProtocol.Awareness;
  private nextClientId = 1;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    // Load persisted state
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<Uint8Array>('yjsState');
      if (stored) {
        try {
          Y.applyUpdate(this.doc, new Uint8Array(stored));
          console.log('[YjsRoom] Loaded persisted state');
        } catch (e) {
          console.error('[YjsRoom] Error loading persisted state:', e);
        }
      }
    });

    // Persist on updates (debounced)
    let persistTimeout: ReturnType<typeof setTimeout> | null = null;
    this.doc.on('update', () => {
      if (persistTimeout) clearTimeout(persistTimeout);
      persistTimeout = setTimeout(() => {
        this.persistState();
      }, 1000);
    });

    // Clean up awareness when clients disconnect
    this.awareness.on('update', ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }) => {
      const changedClients = added.concat(updated).concat(removed);
      this.broadcastAwarenessUpdate(changedClients);
    });
  }

  private async persistState(): Promise<void> {
    try {
      const state = Y.encodeStateAsUpdate(this.doc);
      await this.state.storage.put('yjsState', state);
    } catch (e) {
      console.error('[YjsRoom] Error persisting state:', e);
    }
  }

  private broadcast(message: Uint8Array, exclude?: WebSocket): void {
    for (const [ws, _session] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
        } catch (e) {
          console.error('[YjsRoom] Error broadcasting:', e);
        }
      }
    }
  }

  private broadcastAwarenessUpdate(changedClients: number[], exclude?: WebSocket): void {
    const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
      this.awareness,
      changedClients
    );
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.AWARENESS);
    encoding.writeVarUint8Array(encoder, awarenessUpdate);
    this.broadcast(encoding.toUint8Array(encoder), exclude);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const upgradeHeader = request.headers.get('Upgrade');

    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    // Parse user info from query params
    const userId = url.searchParams.get('userId') || undefined;
    const userName = url.searchParams.get('userName') || undefined;
    const userColor = url.searchParams.get('userColor') || undefined;

    // Create WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Use standard WebSocket API (not hibernatable) for more control
    server.accept();

    // Create session
    const clientId = this.nextClientId++;
    const session: Session = {
      ws: server,
      clientId,
      userId,
      userName,
      userColor,
    };
    this.sessions.set(server, session);

    console.log(`[YjsRoom] Client ${clientId} connected (${userName || 'anonymous'})`);

    // Set up event handlers for the server WebSocket
    server.addEventListener('message', (event) => {
      this.handleWebSocketMessage(server, event.data);
    });

    server.addEventListener('close', (event) => {
      this.handleWebSocketClose(server, event.code, event.reason);
    });

    server.addEventListener('error', (event) => {
      this.handleWebSocketError(server, event);
    });

    // Send sync step 1 to the new client (server's state vector)
    this.sendSyncStep1(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private sendSyncStep1(ws: WebSocket): void {
    try {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MessageType.SYNC);
      syncProtocol.writeSyncStep1(encoder, this.doc);
      ws.send(encoding.toUint8Array(encoder));
      console.log('[YjsRoom] Sent sync step 1 to client');
    } catch (e) {
      console.error('[YjsRoom] Error sending sync step 1:', e);
    }
  }

  private handleWebSocketMessage(ws: WebSocket, message: string | ArrayBuffer): void {
    const session = this.sessions.get(ws);
    if (!session) return;

    try {
      const data = message instanceof ArrayBuffer
        ? new Uint8Array(message)
        : new Uint8Array(new TextEncoder().encode(message));

      const decoder = decoding.createDecoder(data);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MessageType.SYNC: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MessageType.SYNC);

          const syncMessageType = syncProtocol.readSyncMessage(
            decoder,
            encoder,
            this.doc,
            null // No origin tracking needed for server
          );

          console.log(`[YjsRoom] Received sync message type: ${syncMessageType}, response length: ${encoding.length(encoder)}`);

          // If we have a response (sync step 2 or update), send it
          if (encoding.length(encoder) > 1) {
            ws.send(encoding.toUint8Array(encoder));
            console.log(`[YjsRoom] Sent sync response, size: ${encoding.length(encoder)}`);
          }

          // If this was an update (syncMessageType === 2), broadcast to others
          if (syncMessageType === 2) {
            console.log('[YjsRoom] Broadcasting update to other clients');
            this.broadcast(data, ws);
          }
          break;
        }

        case MessageType.AWARENESS: {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(
            this.awareness,
            update,
            session.clientId
          );
          // Broadcast awareness update to all other clients
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MessageType.AWARENESS);
          encoding.writeVarUint8Array(encoder, update);
          this.broadcast(encoding.toUint8Array(encoder), ws);
          break;
        }

        case MessageType.QUERY_AWARENESS: {
          // Send current awareness state
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
            ws.send(encoding.toUint8Array(encoder));
          }
          break;
        }

        default:
          console.log('[YjsRoom] Unknown message type:', messageType);
      }
    } catch (e) {
      console.error('[YjsRoom] Error handling message:', e);
    }
  }

  private handleWebSocketClose(ws: WebSocket, code: number, reason: string): void {
    const session = this.sessions.get(ws);
    if (session) {
      console.log(`[YjsRoom] Client ${session.clientId} disconnected (${code}: ${reason})`);

      // Remove awareness state for this client
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [session.clientId],
        'disconnect'
      );

      this.sessions.delete(ws);

      // Persist state when last client disconnects
      if (this.sessions.size === 0) {
        this.persistState();
      }
    }
  }

  private handleWebSocketError(ws: WebSocket, error: unknown): void {
    console.error('[YjsRoom] WebSocket error:', error);
    const session = this.sessions.get(ws);
    if (session) {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [session.clientId],
        'error'
      );
      this.sessions.delete(ws);
    }
  }
}
