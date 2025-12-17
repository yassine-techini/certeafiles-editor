/**
 * R2 Upload API Route
 * Per Constitution Section 6.3 - Asset Storage
 */
import type { PagesFunction } from '@cloudflare/workers-types';

interface Env {
  R2_ASSETS: R2Bucket;
}

interface UploadResponse {
  url: string;
  key: string;
  size: number;
  contentType: string;
  width?: number;
  height?: number;
}

interface ErrorResponse {
  error: string;
  message: string;
}

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Generate a unique filename
 */
function generateFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'bin';
  return `images/${timestamp}-${random}.${extension}`;
}

/**
 * POST handler for file upload
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Check if R2 bucket is available
  if (!env.R2_ASSETS) {
    return Response.json(
      { error: 'storage_unavailable', message: 'Storage not configured' } as ErrorResponse,
      { status: 503 }
    );
  }

  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json(
        { error: 'no_file', message: 'No file provided' } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        {
          error: 'invalid_type',
          message: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        {
          error: 'file_too_large',
          message: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Generate unique filename
    const key = generateFilename(file.name);

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to R2
    await env.R2_ASSETS.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Generate public URL
    // Note: This assumes R2 is configured with public access or a custom domain
    // For production, you may need to use signed URLs or a CDN
    const url = `/api/assets/${key}`;

    const response: UploadResponse = {
      url,
      key,
      size: file.size,
      contentType: file.type,
    };

    return Response.json(response, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      {
        error: 'upload_failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      } as ErrorResponse,
      { status: 500 }
    );
  }
};

/**
 * OPTIONS handler for CORS preflight
 */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
};
