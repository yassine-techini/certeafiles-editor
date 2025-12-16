-- Certeafiles Editor Initial Schema
-- Per Constitution Section 2.6

-- =============================================================================
-- Documents Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    is_template INTEGER NOT NULL DEFAULT 0,
    metadata TEXT -- JSON field for additional metadata
);

CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_created ON documents(created_at);
CREATE INDEX idx_documents_deleted ON documents(deleted_at);

-- =============================================================================
-- Folios Table (Pages within a document)
-- =============================================================================
CREATE TABLE IF NOT EXISTS folios (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    index_order INTEGER NOT NULL,
    section_id TEXT,
    orientation TEXT NOT NULL DEFAULT 'portrait' CHECK (orientation IN ('portrait', 'landscape')),
    content TEXT, -- Serialized Lexical EditorState JSON
    header_id TEXT,
    footer_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_folios_document ON folios(document_id);
CREATE INDEX idx_folios_order ON folios(document_id, index_order);

-- =============================================================================
-- Sections Table (Groups of folios)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    name TEXT NOT NULL,
    index_order INTEGER NOT NULL,
    collapsed INTEGER NOT NULL DEFAULT 0,
    numbering_style TEXT NOT NULL DEFAULT 'continuous' CHECK (numbering_style IN ('continuous', 'reset', 'roman', 'alpha', 'none')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_sections_document ON sections(document_id);

-- =============================================================================
-- Headers/Footers Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS headers_footers (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('header', 'footer')),
    is_default INTEGER NOT NULL DEFAULT 0,
    folio_id TEXT, -- NULL means document-level default
    content TEXT, -- Serialized Lexical EditorState JSON
    height_mm REAL NOT NULL DEFAULT 20,
    show_page_number INTEGER NOT NULL DEFAULT 0,
    page_number_position TEXT DEFAULT 'center' CHECK (page_number_position IN ('left', 'center', 'right')),
    page_number_format TEXT DEFAULT 'page' CHECK (page_number_format IN ('page', 'page_of_total', 'total')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (folio_id) REFERENCES folios(id) ON DELETE CASCADE
);

CREATE INDEX idx_headers_footers_document ON headers_footers(document_id);
CREATE INDEX idx_headers_footers_folio ON headers_footers(folio_id);

-- =============================================================================
-- Slots Table (Dynamic variables)
-- =============================================================================
CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    folio_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('dynamic_content', 'at_fetcher', 'donnee', 'ancre', 'section_speciale', 'commentaire')),
    start_key TEXT NOT NULL, -- Lexical node key
    end_key TEXT NOT NULL,
    metadata TEXT, -- JSON for slot-specific data
    default_value TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (folio_id) REFERENCES folios(id) ON DELETE CASCADE
);

CREATE INDEX idx_slots_document ON slots(document_id);
CREATE INDEX idx_slots_folio ON slots(folio_id);
CREATE INDEX idx_slots_type ON slots(type);

-- =============================================================================
-- Comments Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    slot_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('remark', 'question', 'suggestion', 'correction', 'validation', 'blocker')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    content TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    author_color TEXT,
    mentions TEXT, -- JSON array of mentions
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_thread ON comments(thread_id);
CREATE INDEX idx_comments_document ON comments(document_id);
CREATE INDEX idx_comments_slot ON comments(slot_id);
CREATE INDEX idx_comments_status ON comments(status);

-- =============================================================================
-- Comment Threads Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS comment_threads (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    slot_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
    position_top REAL,
    position_actual_top REAL,
    position_height REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES slots(id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_threads_document ON comment_threads(document_id);
CREATE INDEX idx_comment_threads_slot ON comment_threads(slot_id);

-- =============================================================================
-- Revisions Table (Track Changes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS revisions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    folio_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('insertion', 'deletion', 'format')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    content TEXT,
    node_key TEXT NOT NULL,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_email TEXT,
    author_color TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    resolved_by TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (folio_id) REFERENCES folios(id) ON DELETE CASCADE
);

CREATE INDEX idx_revisions_document ON revisions(document_id);
CREATE INDEX idx_revisions_folio ON revisions(folio_id);
CREATE INDEX idx_revisions_status ON revisions(status);

-- =============================================================================
-- Users Table (for collaboration)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    color TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_active_at TEXT
);

CREATE INDEX idx_users_email ON users(email);

-- =============================================================================
-- Document Access Table (permissions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS document_access (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'reviewer', 'viewer')),
    granted_at TEXT NOT NULL DEFAULT (datetime('now')),
    granted_by TEXT,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(document_id, user_id)
);

CREATE INDEX idx_document_access_document ON document_access(document_id);
CREATE INDEX idx_document_access_user ON document_access(user_id);

-- =============================================================================
-- Assets Table (references to R2 objects)
-- =============================================================================
CREATE TABLE IF NOT EXISTS assets (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    folio_id TEXT,
    r2_key TEXT NOT NULL UNIQUE,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    uploaded_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (folio_id) REFERENCES folios(id) ON DELETE SET NULL
);

CREATE INDEX idx_assets_document ON assets(document_id);
CREATE INDEX idx_assets_folio ON assets(folio_id);
CREATE INDEX idx_assets_r2_key ON assets(r2_key);
