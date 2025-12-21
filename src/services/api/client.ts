/**
 * API Client for CerteaFiles Backend
 * Per Constitution Section 5.1 - Backend Integration
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://certeafiles-api.yassine-techini.workers.dev';

export interface Document {
  id: string;
  title: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown> | null;
}

export interface Version {
  id: string;
  document_id: string;
  version_number: number;
  content: string;
  yjs_state?: Uint8Array | null;
  created_at: number;
  created_by: string | null;
  label: string | null;
  is_snapshot: boolean;
}

export interface CreateDocumentRequest {
  title?: string;
  ownerId?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateVersionRequest {
  content: string;
  yjsState?: number[];
  createdBy?: string;
  label?: string;
  isSnapshot?: boolean;
}

export interface UpdateDocumentRequest {
  title?: string;
  metadata?: Record<string, unknown>;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data
    );
  }

  return data as T;
}

// ============ Document API ============

export async function listDocuments(): Promise<{ documents: Document[] }> {
  return request<{ documents: Document[] }>('/api/documents');
}

export async function getDocument(
  id: string
): Promise<{ document: Document; latestVersion: Version | null }> {
  return request<{ document: Document; latestVersion: Version | null }>(
    `/api/documents/${id}`
  );
}

export async function createDocument(
  data: CreateDocumentRequest
): Promise<{ id: string; title: string; created: boolean }> {
  return request<{ id: string; title: string; created: boolean }>(
    '/api/documents',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function updateDocument(
  id: string,
  data: UpdateDocumentRequest
): Promise<{ updated: boolean }> {
  return request<{ updated: boolean }>(`/api/documents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteDocument(
  id: string
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/api/documents/${id}`, {
    method: 'DELETE',
  });
}

// ============ Version API ============

export async function getVersions(
  documentId: string,
  snapshotsOnly = false
): Promise<{ versions: Version[] }> {
  const query = snapshotsOnly ? '?snapshots=true' : '';
  return request<{ versions: Version[] }>(
    `/api/documents/${documentId}/versions${query}`
  );
}

export async function createVersion(
  documentId: string,
  data: CreateVersionRequest
): Promise<{ id: string; versionNumber: number; created: boolean }> {
  return request<{ id: string; versionNumber: number; created: boolean }>(
    `/api/documents/${documentId}/versions`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function getVersion(
  documentId: string,
  versionId: string
): Promise<{ version: Version }> {
  return request<{ version: Version }>(
    `/api/documents/${documentId}/versions/${versionId}`
  );
}

// ============ Collaboration ============

export function getCollaborationWebSocketUrl(
  documentId: string,
  userId: string,
  userName: string
): string {
  const wsBase = API_BASE_URL.replace('https://', 'wss://').replace(
    'http://',
    'ws://'
  );
  return `${wsBase}/api/documents/${documentId}/collaborate?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`;
}

// ============ Health Check ============

export async function healthCheck(): Promise<{
  service: string;
  status: string;
  environment: string;
  timestamp: string;
}> {
  return request<{
    service: string;
    status: string;
    environment: string;
    timestamp: string;
  }>('/');
}

export { ApiError };
