/**
 * R2 Asset Retrieval API Route
 * Per Constitution Section 6.3 - Asset Storage
 *
 * This route serves assets from R2 storage
 * Path: /api/assets/images/filename.ext
 */
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  R2_ASSETS: R2Bucket;
}

/**
 * GET handler for asset retrieval
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;

  // Check if R2 bucket is available
  if (!env.R2_ASSETS) {
    return new Response('Storage not configured', { status: 503 });
  }

  // Get the path from params
  const pathSegments = params.path;
  if (!pathSegments || (Array.isArray(pathSegments) && pathSegments.length === 0)) {
    return new Response('Asset path required', { status: 400 });
  }

  // Construct the key
  const key = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  try {
    // Fetch from R2
    const object = await env.R2_ASSETS.get(key);

    if (!object) {
      return new Response('Asset not found', { status: 404 });
    }

    // Get headers
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('ETag', object.etag);

    // Add CORS headers
    headers.set('Access-Control-Allow-Origin', '*');

    // Return the object body
    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error('Asset retrieval error:', error);
    return new Response('Failed to retrieve asset', { status: 500 });
  }
};

/**
 * HEAD handler for checking asset existence
 */
export const onRequestHead: PagesFunction<Env> = async (context) => {
  const { params, env } = context;

  if (!env.R2_ASSETS) {
    return new Response(null, { status: 503 });
  }

  const pathSegments = params.path;
  if (!pathSegments) {
    return new Response(null, { status: 400 });
  }

  const key = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments;

  try {
    const object = await env.R2_ASSETS.head(key);

    if (!object) {
      return new Response(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Length', String(object.size));
    headers.set('ETag', object.etag);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(null, { status: 200, headers });
  } catch (error) {
    return new Response(null, { status: 500 });
  }
};

/**
 * OPTIONS handler for CORS
 */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
