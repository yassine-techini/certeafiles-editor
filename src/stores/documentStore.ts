/**
 * Document Store - Manages document metadata and persistence
 * Per Constitution Section 2 - Core Architecture
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Document metadata
 */
export interface DocumentMetadata {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  /** Whether this document has collaboration enabled */
  collaborationEnabled: boolean;
  /** The collaboration room ID (same as document ID for simplicity) */
  roomId: string;
  /** Preview/thumbnail data URL */
  thumbnail?: string;
  /** Document owner/creator */
  ownerId?: string;
  /** Last editor */
  lastEditorId?: string;
  /** Document tags */
  tags?: string[];
}

/**
 * Document content stored in localStorage
 */
export interface StoredDocument {
  id: string;
  metadata: DocumentMetadata;
  /** Lexical editor state as JSON string */
  editorState?: string;
  /** Folio store state */
  folioState?: unknown;
}

/**
 * Document store state
 */
interface DocumentStoreState {
  /** Map of all documents by ID */
  documents: Map<string, DocumentMetadata>;
  /** Currently active document ID */
  activeDocumentId: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
}

/**
 * Document store actions
 */
interface DocumentStoreActions {
  /** Create a new document */
  createDocument: (title?: string) => DocumentMetadata;
  /** Get a document by ID */
  getDocument: (id: string) => DocumentMetadata | undefined;
  /** Update document metadata */
  updateDocument: (id: string, updates: Partial<DocumentMetadata>) => void;
  /** Delete a document */
  deleteDocument: (id: string) => void;
  /** Set active document */
  setActiveDocument: (id: string | null) => void;
  /** Get all documents sorted by update date */
  getDocumentsList: () => DocumentMetadata[];
  /** Check if a document exists */
  documentExists: (id: string) => boolean;
  /** Enable collaboration for a document */
  enableCollaboration: (id: string) => void;
  /** Disable collaboration for a document */
  disableCollaboration: (id: string) => void;
  /** Generate a share link for a document */
  getShareLink: (id: string) => string;
  /** Load document from a share link */
  loadFromShareLink: (url: string) => string | null;
  /** Reset store */
  reset: () => void;
}

type DocumentStore = DocumentStoreState & DocumentStoreActions;

/**
 * Generate a unique document ID
 */
function generateDocumentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `doc-${timestamp}-${random}`;
}

/**
 * Initial state
 */
const initialState: DocumentStoreState = {
  documents: new Map(),
  activeDocumentId: null,
  isLoading: false,
  error: null,
};

/**
 * Document store with persistence
 */
export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      createDocument: (title?: string) => {
        const id = generateDocumentId();
        const now = new Date();

        const metadata: DocumentMetadata = {
          id,
          title: title || `Document sans titre`,
          createdAt: now,
          updatedAt: now,
          collaborationEnabled: false,
          roomId: id, // Room ID is same as document ID
        };

        set((state) => {
          const newDocs = new Map(state.documents);
          newDocs.set(id, metadata);
          return {
            documents: newDocs,
            activeDocumentId: id,
          };
        });

        return metadata;
      },

      getDocument: (id: string) => {
        return get().documents.get(id);
      },

      updateDocument: (id: string, updates: Partial<DocumentMetadata>) => {
        set((state) => {
          const doc = state.documents.get(id);
          if (!doc) return state;

          const newDocs = new Map(state.documents);
          newDocs.set(id, {
            ...doc,
            ...updates,
            updatedAt: new Date(),
          });
          return { documents: newDocs };
        });
      },

      deleteDocument: (id: string) => {
        set((state) => {
          const newDocs = new Map(state.documents);
          newDocs.delete(id);

          // Clear active document if deleted
          const activeDocumentId = state.activeDocumentId === id
            ? null
            : state.activeDocumentId;

          return {
            documents: newDocs,
            activeDocumentId,
          };
        });

        // Also clear document content from localStorage
        localStorage.removeItem(`certeafiles-doc-${id}`);
      },

      setActiveDocument: (id: string | null) => {
        set({ activeDocumentId: id });
      },

      getDocumentsList: () => {
        const docs = Array.from(get().documents.values());
        return docs.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },

      documentExists: (id: string) => {
        return get().documents.has(id);
      },

      enableCollaboration: (id: string) => {
        get().updateDocument(id, { collaborationEnabled: true });
      },

      disableCollaboration: (id: string) => {
        get().updateDocument(id, { collaborationEnabled: false });
      },

      getShareLink: (id: string) => {
        const doc = get().documents.get(id);
        if (!doc) return '';

        const baseUrl = window.location.origin;
        return `${baseUrl}/doc/${id}`;
      },

      loadFromShareLink: (url: string) => {
        try {
          const urlObj = new URL(url);
          const pathMatch = urlObj.pathname.match(/^\/doc\/([a-zA-Z0-9-]+)$/);
          if (pathMatch) {
            return pathMatch[1];
          }
          // Also support query param format
          const docId = urlObj.searchParams.get('doc');
          return docId;
        } catch {
          return null;
        }
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'certeafiles-documents',
      // Custom serialization for Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          const parsed = JSON.parse(str);
          // Convert documents array back to Map
          if (parsed.state?.documents) {
            parsed.state.documents = new Map(
              parsed.state.documents.map((doc: DocumentMetadata) => [doc.id, {
                ...doc,
                createdAt: new Date(doc.createdAt),
                updatedAt: new Date(doc.updatedAt),
              }])
            );
          }
          return parsed;
        },
        setItem: (name, value) => {
          // Convert Map to array for serialization
          const toStore = {
            ...value,
            state: {
              ...value.state,
              documents: Array.from(value.state.documents.values()),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

/**
 * Save document content to localStorage
 */
export function saveDocumentContent(id: string, editorState: string): void {
  const key = `certeafiles-doc-${id}`;
  localStorage.setItem(key, editorState);

  // Update the document's updatedAt
  useDocumentStore.getState().updateDocument(id, {});
}

/**
 * Load document content from localStorage
 */
export function loadDocumentContent(id: string): string | null {
  const key = `certeafiles-doc-${id}`;
  return localStorage.getItem(key);
}

/**
 * Get the document ID from the current URL
 */
export function getDocumentIdFromUrl(): string | null {
  const pathname = window.location.pathname;

  // Match /doc/:id pattern
  const match = pathname.match(/^\/doc\/([a-zA-Z0-9-]+)$/);
  if (match) {
    return match[1];
  }

  // Also check query params for backward compatibility
  const params = new URLSearchParams(window.location.search);
  return params.get('doc');
}

/**
 * Navigate to a document
 */
export function navigateToDocument(id: string): void {
  window.history.pushState({}, '', `/doc/${id}`);
  // Dispatch popstate to notify React Router (if used) or our own listener
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Navigate to home (document list)
 */
export function navigateToHome(): void {
  window.history.pushState({}, '', '/');
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default useDocumentStore;
