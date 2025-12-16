/**
 * Health Check API Endpoint
 * Verifies D1 and R2 bindings are accessible
 */

interface Env {
  DB: D1Database;
  R2_ASSETS: R2Bucket;
  ENVIRONMENT: string;
  APP_NAME: string;
  APP_VERSION: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT,
    app: {
      name: env.APP_NAME,
      version: env.APP_VERSION,
    },
    services: {
      d1: { status: 'unknown' as string, tables: 0 },
      r2: { status: 'unknown' as string },
    },
  };

  // Check D1 Database
  try {
    const result = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
    ).first<{ count: number }>();
    health.services.d1 = {
      status: 'connected',
      tables: result?.count ?? 0,
    };
  } catch (error) {
    health.services.d1 = {
      status: 'error',
      tables: 0,
    };
    health.status = 'degraded';
  }

  // Check R2 Bucket
  try {
    const listed = await env.R2_ASSETS.list({ limit: 1 });
    health.services.r2 = {
      status: 'connected',
    };
  } catch (error) {
    health.services.r2 = {
      status: 'error',
    };
    health.status = 'degraded';
  }

  return new Response(JSON.stringify(health, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    status: health.status === 'healthy' ? 200 : 503,
  });
};
