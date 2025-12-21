/**
 * DocumentRoom Durable Object
 * Per Constitution Section 5.2 - Real-time Collaboration
 *
 * Handles WebSocket connections for real-time document collaboration
 * Uses Yjs CRDT for conflict-free concurrent editing
 */
import * as Y from 'yjs';

interface Session {
  webSocket: WebSocket;
  userId: string;
  userName: string;
  color: string;
  cursor?: { anchor: number; head: number };
  joinedAt: number;
}

interface AwarenessUpdate {
  type: 'awareness';
  clientId: string;
  userId: string;
  userName: string;
  color: string;
  cursor?: { anchor: number; head: number };
}

interface SyncUpdate {
  type: 'sync';
  update: number[]; // Yjs update as array
}

interface CursorUpdate {
  type: 'cursor';
  userId: string;
  cursor: { anchor: number; head: number };
}

type Message = AwarenessUpdate | SyncUpdate | CursorUpdate | { type: string; [key: string]: unknown };

// Cursor colors for collaborators
const CURSOR_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Sky
];

export class DocumentRoom implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<WebSocket, Session> = new Map();
  private yDoc: Y.Doc;
  private documentId: string | null = null;
  private colorIndex = 0;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.yDoc = new Y.Doc();

    // Load persisted Yjs state if exists
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<Uint8Array>('yjsState');
      if (stored) {
        Y.applyUpdate(this.yDoc, stored);
      }
    });

    // Observe changes to persist them
    this.yDoc.on('update', (update: Uint8Array) => {
      this.persistYjsState();
    });
  }

  private async persistYjsState(): Promise<void> {
    const state = Y.encodeStateAsUpdate(this.yDoc);
    await this.state.storage.put('yjsState', state);
  }

  private getNextColor(): string {
    const color = CURSOR_COLORS[this.colorIndex % CURSOR_COLORS.length];
    this.colorIndex++;
    return color;
  }

  private broadcastMessage(message: Message, exclude?: WebSocket): void {
    const data = JSON.stringify(message);
    for (const [ws, _session] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(data);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    }
  }

  private broadcastAwareness(): void {
    const users = Array.from(this.sessions.values()).map((session) => ({
      type: 'awareness' as const,
      clientId: session.userId,
      userId: session.userId,
      userName: session.userName,
      color: session.color,
      cursor: session.cursor,
    }));

    this.broadcastMessage({ type: 'users', users });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      // Extract document ID from query params
      this.documentId = url.searchParams.get('documentId');

      // Handle WebSocket upgrade
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      // Create WebSocket pair
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      // Accept the WebSocket connection
      this.state.acceptWebSocket(server);

      // Parse user info from query params
      const userId = url.searchParams.get('userId') || crypto.randomUUID();
      const userName = url.searchParams.get('userName') || 'Anonymous';

      // Create session
      const session: Session = {
        webSocket: server,
        userId,
        userName,
        color: this.getNextColor(),
        joinedAt: Date.now(),
      };

      this.sessions.set(server, session);

      // Send initial state to the new client
      server.send(
        JSON.stringify({
          type: 'init',
          userId: session.userId,
          color: session.color,
          yjsState: Array.from(Y.encodeStateAsUpdate(this.yDoc)),
          users: Array.from(this.sessions.values()).map((s) => ({
            userId: s.userId,
            userName: s.userName,
            color: s.color,
            cursor: s.cursor,
          })),
        })
      );

      // Broadcast user joined
      this.broadcastMessage(
        {
          type: 'user-joined',
          userId: session.userId,
          userName: session.userName,
          color: session.color,
        },
        server
      );

      this.broadcastAwareness();

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const session = this.sessions.get(ws);
    if (!session) return;

    try {
      if (typeof message === 'string') {
        const data = JSON.parse(message) as Message;

        switch (data.type) {
          case 'sync': {
            // Apply Yjs update
            const syncData = data as SyncUpdate;
            const update = new Uint8Array(syncData.update);
            Y.applyUpdate(this.yDoc, update);

            // Broadcast to other clients
            this.broadcastMessage(
              {
                type: 'sync',
                update: syncData.update,
              },
              ws
            );
            break;
          }

          case 'cursor': {
            // Update cursor position
            const cursorData = data as CursorUpdate;
            session.cursor = cursorData.cursor;

            // Broadcast cursor update
            this.broadcastMessage(
              {
                type: 'cursor',
                userId: session.userId,
                cursor: cursorData.cursor,
              },
              ws
            );
            break;
          }

          case 'awareness': {
            // Update awareness info
            const awarenessData = data as AwarenessUpdate;
            if (awarenessData.cursor) {
              session.cursor = awarenessData.cursor;
            }

            // Broadcast awareness
            this.broadcastAwareness();
            break;
          }

          default:
            console.log('Unknown message type:', data.type);
        }
      } else {
        // Binary message - assume it's a Yjs update
        const update = new Uint8Array(message);
        Y.applyUpdate(this.yDoc, update);

        // Broadcast to other clients
        for (const [otherWs, _otherSession] of this.sessions) {
          if (otherWs !== ws && otherWs.readyState === WebSocket.OPEN) {
            otherWs.send(message);
          }
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    const session = this.sessions.get(ws);
    if (session) {
      // Broadcast user left
      this.broadcastMessage({
        type: 'user-left',
        userId: session.userId,
      });

      this.sessions.delete(ws);
      this.broadcastAwareness();

      console.log(`User ${session.userName} left (${code}: ${reason})`);
    }
  }

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    console.error('WebSocket error:', error);
    const session = this.sessions.get(ws);
    if (session) {
      this.sessions.delete(ws);
      this.broadcastAwareness();
    }
  }
}
