/**
 * Collaboration WebSocket Proxy
 * Routes WebSocket connections to the Yjs Durable Object
 * Per Constitution Section 7 - Collaboration
 *
 * Note: For full WebSocket support with Durable Objects,
 * deploy the YJS Worker separately and update YJS_WORKER_URL.
 */

interface Env {
  YJS_SERVER?: DurableObjectNamespace;
  YJS_WORKER_URL?: string;
  DB: D1Database;
  R2_ASSETS: R2Bucket;
}

/**
 * Handle WebSocket upgrade requests for collaboration
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const url = new URL(request.url);

  // Get room ID from path params
  const roomPath = params.room;
  const roomId = Array.isArray(roomPath) ? roomPath.join('/') : roomPath || 'default';

  // Check if this is a WebSocket upgrade request
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  // Check if we have a Durable Object binding
  if (env.YJS_SERVER) {
    // Get the Durable Object stub for this room
    const id = env.YJS_SERVER.idFromName(roomId);
    const stub = env.YJS_SERVER.get(id);

    // Build the request URL with room and user info
    const wsUrl = new URL(request.url);
    wsUrl.searchParams.set('room', roomId);

    // Forward user info from query params
    const userId = url.searchParams.get('userId');
    const userName = url.searchParams.get('userName');
    const userColor = url.searchParams.get('userColor');

    if (userId) wsUrl.searchParams.set('userId', userId);
    if (userName) wsUrl.searchParams.set('userName', userName);
    if (userColor) wsUrl.searchParams.set('userColor', userColor);

    // Create a new request with the updated URL
    const newRequest = new Request(wsUrl.toString(), {
      method: request.method,
      headers: request.headers,
    });

    // Forward to Durable Object
    return stub.fetch(newRequest);
  }

  // If no Durable Object, return info about configuration needed
  return new Response(JSON.stringify({
    error: 'WebSocket collaboration not configured',
    message: 'Deploy the YJS Worker and configure YJS_SERVER binding for real-time collaboration',
    roomId,
  }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * Handle GET requests for room info
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  // If WebSocket upgrade, handle it
  const upgradeHeader = request.headers.get('Upgrade');
  if (upgradeHeader === 'websocket') {
    return onRequest(context);
  }

  // Get room ID from path params
  const roomPath = params.room;
  const roomId = Array.isArray(roomPath) ? roomPath.join('/') : roomPath || 'default';

  // Check if we have a Durable Object binding
  if (env.YJS_SERVER) {
    // Get the Durable Object stub for this room
    const id = env.YJS_SERVER.idFromName(roomId);
    const stub = env.YJS_SERVER.get(id);

    // Request health/state info from Durable Object
    const stateUrl = new URL(request.url);
    stateUrl.pathname = '/state';

    const stateRequest = new Request(stateUrl.toString(), {
      method: 'GET',
    });

    try {
      const response = await stub.fetch(stateRequest);
      const data = await response.json();

      return new Response(JSON.stringify({
        roomId,
        ...data,
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        roomId,
        error: 'Failed to get room state',
        clients: 0,
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }

  // Return stub response when DO not configured
  return new Response(JSON.stringify({
    roomId,
    status: 'not_configured',
    message: 'Collaboration server not configured. Deploy YJS Worker for real-time sync.',
    clients: 0,
    awarenessStates: {},
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
  });
};
