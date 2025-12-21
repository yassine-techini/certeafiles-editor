-- CerteaFiles D1 Database Schema
-- Per Constitution Section 5.1 - Document Storage

-- Documents table - stores document metadata
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Sans titre',
  owner_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_deleted INTEGER NOT NULL DEFAULT 0,
  metadata TEXT -- JSON blob for flexible metadata
);

-- Document versions - for versioning/snapshots
CREATE TABLE IF NOT EXISTS versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL, -- Serialized Lexical state
  yjs_state BLOB, -- Yjs document state for CRDT
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  created_by TEXT,
  label TEXT, -- Optional version label (e.g., "Draft 1", "Final")
  is_snapshot INTEGER NOT NULL DEFAULT 0, -- Manual snapshot vs auto-save
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Active collaborators tracking
CREATE TABLE IF NOT EXISTS collaborators (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  color TEXT, -- Cursor/selection color
  joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen_at INTEGER NOT NULL DEFAULT (unixepoch()),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Document shares - for sharing documents with others
CREATE TABLE IF NOT EXISTS shares (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('link', 'user', 'email')),
  share_target TEXT, -- User ID, email, or null for link shares
  permission TEXT NOT NULL CHECK (permission IN ('view', 'comment', 'edit')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_document ON versions(document_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_collaborators_document ON collaborators(document_id, is_active);
CREATE INDEX IF NOT EXISTS idx_shares_document ON shares(document_id, is_active);
