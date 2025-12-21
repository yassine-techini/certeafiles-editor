/**
 * CerteaFiles API - Cloudflare Worker Entry Point
 * Per Constitution Section 5.1 - Backend Services
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

// Import Durable Object
export { DocumentRoom } from './durable-objects/DocumentRoom';

// Environment bindings
interface Env {
  DB: D1Database;
  DOCUMENT_ROOM: DurableObjectNamespace;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN === '*' ? '*' : c.env.CORS_ORIGIN,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

// Health check
app.get('/', (c) => {
  return c.json({
    service: 'certeafiles-api',
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// ============ Document Routes ============

// List all documents
app.get('/api/documents', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      `SELECT id, title, owner_id, created_at, updated_at, metadata
       FROM documents
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC
       LIMIT 100`
    ).all();

    return c.json({ documents: result.results });
  } catch (error) {
    console.error('Error listing documents:', error);
    return c.json({ error: 'Failed to list documents' }, 500);
  }
});

// Create new document
app.post('/api/documents', async (c) => {
  try {
    const body = await c.req.json();
    const id = crypto.randomUUID();
    const title = body.title || 'Sans titre';
    const ownerId = body.ownerId || null;
    const metadata = body.metadata ? JSON.stringify(body.metadata) : null;

    await c.env.DB.prepare(
      `INSERT INTO documents (id, title, owner_id, metadata) VALUES (?, ?, ?, ?)`
    )
      .bind(id, title, ownerId, metadata)
      .run();

    // Create initial version
    const versionId = crypto.randomUUID();
    const initialContent = body.content || '{"root":{"children":[],"type":"root"}}';

    await c.env.DB.prepare(
      `INSERT INTO versions (id, document_id, version_number, content, created_by, is_snapshot)
       VALUES (?, ?, 1, ?, ?, 0)`
    )
      .bind(versionId, id, initialContent, ownerId)
      .run();

    return c.json({ id, title, created: true }, 201);
  } catch (error) {
    console.error('Error creating document:', error);
    return c.json({ error: 'Failed to create document' }, 500);
  }
});

// Get document by ID
app.get('/api/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');

    const doc = await c.env.DB.prepare(
      `SELECT id, title, owner_id, created_at, updated_at, metadata
       FROM documents WHERE id = ? AND deleted_at IS NULL`
    )
      .bind(id)
      .first();

    if (!doc) {
      return c.json({ error: 'Document not found' }, 404);
    }

    // Get latest version
    const version = await c.env.DB.prepare(
      `SELECT id, version_number, content, created_at, label
       FROM versions WHERE document_id = ?
       ORDER BY version_number DESC LIMIT 1`
    )
      .bind(id)
      .first();

    return c.json({ document: doc, latestVersion: version });
  } catch (error) {
    console.error('Error getting document:', error);
    return c.json({ error: 'Failed to get document' }, 500);
  }
});

// Update document metadata
app.patch('/api/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }

    if (body.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(body.metadata));
    }

    if (updates.length === 0) {
      return c.json({ error: 'No updates provided' }, 400);
    }

    updates.push("updated_at = datetime('now')");
    values.push(id);

    await c.env.DB.prepare(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = ? AND deleted_at IS NULL`
    )
      .bind(...values)
      .run();

    return c.json({ updated: true });
  } catch (error) {
    console.error('Error updating document:', error);
    return c.json({ error: 'Failed to update document' }, 500);
  }
});

// Delete document (soft delete)
app.delete('/api/documents/:id', async (c) => {
  try {
    const id = c.req.param('id');

    await c.env.DB.prepare(
      `UPDATE documents SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
    )
      .bind(id)
      .run();

    return c.json({ deleted: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return c.json({ error: 'Failed to delete document' }, 500);
  }
});

// ============ Version Routes ============

// Get document versions
app.get('/api/documents/:id/versions', async (c) => {
  try {
    const id = c.req.param('id');
    const snapshotsOnly = c.req.query('snapshots') === 'true';

    let query = `SELECT id, version_number, created_at, created_by, label, is_snapshot
                 FROM versions WHERE document_id = ?`;

    if (snapshotsOnly) {
      query += ' AND is_snapshot = 1';
    }

    query += ' ORDER BY version_number DESC LIMIT 50';

    const result = await c.env.DB.prepare(query).bind(id).all();

    return c.json({ versions: result.results });
  } catch (error) {
    console.error('Error getting versions:', error);
    return c.json({ error: 'Failed to get versions' }, 500);
  }
});

// Create new version/snapshot
app.post('/api/documents/:id/versions', async (c) => {
  try {
    const documentId = c.req.param('id');
    const body = await c.req.json();

    // Get current max version number
    const maxVersion = await c.env.DB.prepare(
      `SELECT MAX(version_number) as max FROM versions WHERE document_id = ?`
    )
      .bind(documentId)
      .first<{ max: number }>();

    const versionNumber = (maxVersion?.max || 0) + 1;
    const versionId = crypto.randomUUID();

    await c.env.DB.prepare(
      `INSERT INTO versions (id, document_id, version_number, content, yjs_state, created_by, label, is_snapshot)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        versionId,
        documentId,
        versionNumber,
        body.content,
        body.yjsState || null,
        body.createdBy || null,
        body.label || null,
        body.isSnapshot ? 1 : 0
      )
      .run();

    // Update document updated_at
    await c.env.DB.prepare(
      `UPDATE documents SET updated_at = unixepoch() WHERE id = ?`
    )
      .bind(documentId)
      .run();

    return c.json({ id: versionId, versionNumber, created: true }, 201);
  } catch (error) {
    console.error('Error creating version:', error);
    return c.json({ error: 'Failed to create version' }, 500);
  }
});

// Get specific version content
app.get('/api/documents/:id/versions/:versionId', async (c) => {
  try {
    const versionId = c.req.param('versionId');

    const version = await c.env.DB.prepare(
      `SELECT id, document_id, version_number, content, yjs_state, created_at, created_by, label
       FROM versions WHERE id = ?`
    )
      .bind(versionId)
      .first();

    if (!version) {
      return c.json({ error: 'Version not found' }, 404);
    }

    return c.json({ version });
  } catch (error) {
    console.error('Error getting version:', error);
    return c.json({ error: 'Failed to get version' }, 500);
  }
});

// ============ Collaboration WebSocket ============

// WebSocket upgrade for real-time collaboration
app.get('/api/documents/:id/collaborate', async (c) => {
  const id = c.req.param('id');

  // Get or create Durable Object for this document
  const durableId = c.env.DOCUMENT_ROOM.idFromName(id);
  const stub = c.env.DOCUMENT_ROOM.get(durableId);

  // Forward the request to the Durable Object
  const url = new URL(c.req.url);
  url.pathname = '/websocket';

  return stub.fetch(new Request(url.toString(), c.req.raw));
});

// ============ Collaborators Routes ============

// Get active collaborators
app.get('/api/documents/:id/collaborators', async (c) => {
  try {
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(
      `SELECT id, user_id, user_name, color, joined_at, last_seen_at
       FROM collaborators
       WHERE document_id = ? AND is_active = 1
       ORDER BY joined_at DESC`
    )
      .bind(id)
      .all();

    return c.json({ collaborators: result.results });
  } catch (error) {
    console.error('Error getting collaborators:', error);
    return c.json({ error: 'Failed to get collaborators' }, 500);
  }
});

export default app;
