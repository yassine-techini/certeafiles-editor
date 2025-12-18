/**
 * Middleware for Pages Functions
 * Handles CORS and common headers for API routes only
 */

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // Skip middleware for static assets and root page
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico')
  ) {
    return context.next();
  }

  // Handle CORS preflight for API routes
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Continue with the request
  const response = await context.next();

  // Add CORS headers to API responses
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
