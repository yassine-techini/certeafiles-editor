/**
 * CerteaFiles Yjs WebSocket Server
 *
 * Handles real-time collaboration using the standard Yjs binary protocol.
 * Uses Cloudflare Durable Objects for per-room state persistence.
 */

// Export Durable Object
export { YjsServer } from './YjsRoom';

interface Env {
  YJS_ROOM: DurableObjectNamespace;
  CORS_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': env.CORS_ORIGIN,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // WebSocket upgrade - check this FIRST before health check
    const upgradeHeader = request.headers.get('Upgrade');
    const roomId = url.searchParams.get('room');

    // If it's a WebSocket request with a room, handle it
    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket' && roomId) {
      console.log(`[Worker] WebSocket request for room: ${roomId}`);

      // Get or create Durable Object for this room
      const durableId = env.YJS_ROOM.idFromName(roomId);
      const stub = env.YJS_ROOM.get(durableId);

      // Forward the request to the Durable Object
      return stub.fetch(request);
    }

    // Health check endpoint (only if not a WebSocket request)
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        service: 'certeafiles-yjs-server',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.CORS_ORIGIN,
        },
      });
    }

    // If WebSocket upgrade but no room
    if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
      return new Response('Missing room parameter', { status: 400 });
    }

    // Return 404 for any other request
    return new Response('Not found', { status: 404 });
  },
};
