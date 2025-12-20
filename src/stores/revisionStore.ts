/**
 * Revision Store - Zustand state management for document versions and track changes
 * Per Constitution Section 6 - Track Changes
 *
 * Supports two modes:
 * 1. Version-based system with snapshots
 * 2. Per-revision track changes (insertions/deletions)
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import {
  type RevisionAuthor,
  type TrackChangesViewMode,
  type RevisionType,
  type RevisionStatus,
  generateRevisionId,
  DEFAULT_AUTHOR,
} from '../types/revision';

/**
 * Document version (snapshot)
 */
export interface DocumentVersion {
  id: string;
  label: string;
  content: string; // Serialized editor state JSON
  author: RevisionAuthor;
  createdAt: Date;
  isAutoSave: boolean;
}

/**
 * Individual revision (for track changes mode)
 */
export interface Revision {
  id: string;
  type: RevisionType;
  content: string;
  author: RevisionAuthor;
  nodeKey: string;
  status: RevisionStatus;
  createdAt: Date;
}

/**
 * Revision store state and actions
 */
export interface RevisionState {
  // Data
  versions: Map<string, DocumentVersion>;
  revisions: Map<string, Revision>;
  trackingEnabled: boolean;
  viewMode: TrackChangesViewMode;
  currentAuthor: RevisionAuthor;
  showDeletions: boolean;
  activeVersionId: string | null;
  /** Document is validated - only show insertions, hide deletions */
  documentValidated: boolean;

  // Version getters
  getVersion: (id: string) => DocumentVersion | undefined;
  getAllVersions: () => DocumentVersion[];
  getVersionCount: () => number;

  // Revision getters
  getRevision: (id: string) => Revision | undefined;
  getRevisionCount: () => { total: number; pending: number; accepted: number; rejected: number };
  getPendingRevisions: () => Revision[];
  getRevisionsByType: (type: RevisionType) => Revision[];
  getRevisionsByAuthor: (authorId: string) => Revision[];
  getRevisionByNodeKey: (nodeKey: string) => Revision | undefined;

  // Version actions
  addVersion: (data: { label: string; content: string; author: RevisionAuthor; isAutoSave?: boolean }) => string;
  deleteVersion: (id: string) => void;
  restoreVersion: (id: string) => DocumentVersion | undefined;
  setActiveVersion: (id: string | null) => void;

  // Revision actions
  addRevision: (data: { type: RevisionType; content: string; author: RevisionAuthor; nodeKey: string }) => string;
  removeRevision: (id: string) => void;
  acceptRevision: (id: string) => void;
  rejectRevision: (id: string) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  acceptByAuthor: (authorId: string) => void;
  rejectByAuthor: (authorId: string) => void;
  updateRevisionNodeKey: (id: string, newNodeKey: string) => void;

  // Tracking control
  enableTracking: () => void;
  disableTracking: () => void;
  toggleTracking: () => void;
  setViewMode: (mode: TrackChangesViewMode) => void;
  setShowDeletions: (show: boolean) => void;
  setCurrentAuthor: (author: RevisionAuthor) => void;

  // Document validation
  setDocumentValidated: (validated: boolean) => void;
  toggleDocumentValidated: () => void;

  // Utility
  clearAllVersions: () => void;
  clearAll: () => void;
}

/**
 * Create the revision store with persistence
 */
export const useRevisionStore = create<RevisionState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          // Initial state
          versions: new Map(),
          revisions: new Map(),
          trackingEnabled: false,
          viewMode: 'all_markup',
          currentAuthor: DEFAULT_AUTHOR,
          showDeletions: true,
          activeVersionId: null,
          documentValidated: false,

          // Version getters
          getVersion: (id: string) => {
            return get().versions.get(id);
          },

          getAllVersions: () => {
            return Array.from(get().versions.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          },

          getVersionCount: () => {
            return get().versions.size;
          },

          // Revision getters
          getRevision: (id: string) => {
            return get().revisions.get(id);
          },

          getRevisionCount: () => {
            const revisions = Array.from(get().revisions.values());
            return {
              total: revisions.length,
              pending: revisions.filter((r) => r.status === 'pending').length,
              accepted: revisions.filter((r) => r.status === 'accepted').length,
              rejected: revisions.filter((r) => r.status === 'rejected').length,
            };
          },

          getPendingRevisions: () => {
            return Array.from(get().revisions.values()).filter((r) => r.status === 'pending');
          },

          getRevisionsByType: (type: RevisionType) => {
            return Array.from(get().revisions.values()).filter((r) => r.type === type);
          },

          getRevisionsByAuthor: (authorId: string) => {
            return Array.from(get().revisions.values()).filter((r) => r.author.id === authorId);
          },

          getRevisionByNodeKey: (nodeKey: string) => {
            return Array.from(get().revisions.values()).find((r) => r.nodeKey === nodeKey);
          },

          // Version actions
          addVersion: ({ label, content, author, isAutoSave = false }) => {
            const id = generateRevisionId();
            const version: DocumentVersion = {
              id,
              label,
              content,
              author,
              createdAt: new Date(),
              isAutoSave,
            };

            set((state) => {
              const newVersions = new Map(state.versions);
              newVersions.set(id, version);

              // Keep only last 50 versions to prevent memory issues
              if (newVersions.size > 50) {
                const sortedVersions = Array.from(newVersions.entries()).sort(
                  ([, a], [, b]) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                const versionsToKeep = sortedVersions.slice(0, 50);
                return { versions: new Map(versionsToKeep) };
              }

              return { versions: newVersions };
            });

            console.log('[RevisionStore] Added version:', id, label);
            return id;
          },

          deleteVersion: (id: string) => {
            set((state) => {
              const newVersions = new Map(state.versions);
              newVersions.delete(id);

              // Clear active version if deleted
              const newActiveId = state.activeVersionId === id ? null : state.activeVersionId;

              return { versions: newVersions, activeVersionId: newActiveId };
            });
            console.log('[RevisionStore] Deleted version:', id);
          },

          restoreVersion: (id: string) => {
            const version = get().versions.get(id);
            if (version) {
              set({ activeVersionId: id });
              console.log('[RevisionStore] Restoring version:', id);
            }
            return version;
          },

          setActiveVersion: (id: string | null) => {
            set({ activeVersionId: id });
          },

          // Revision actions
          addRevision: ({ type, content, author, nodeKey }) => {
            const id = generateRevisionId();
            const revision: Revision = {
              id,
              type,
              content,
              author,
              nodeKey,
              status: 'pending',
              createdAt: new Date(),
            };

            set((state) => {
              const newRevisions = new Map(state.revisions);
              newRevisions.set(id, revision);
              return { revisions: newRevisions };
            });

            console.log('[RevisionStore] Added revision:', id, type);
            return id;
          },

          removeRevision: (id: string) => {
            set((state) => {
              const newRevisions = new Map(state.revisions);
              newRevisions.delete(id);
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Removed revision:', id);
          },

          acceptRevision: (id: string) => {
            set((state) => {
              const revision = state.revisions.get(id);
              if (!revision) return state;

              const newRevisions = new Map(state.revisions);
              newRevisions.set(id, { ...revision, status: 'accepted' });
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Accepted revision:', id);
          },

          rejectRevision: (id: string) => {
            set((state) => {
              const revision = state.revisions.get(id);
              if (!revision) return state;

              const newRevisions = new Map(state.revisions);
              newRevisions.set(id, { ...revision, status: 'rejected' });
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Rejected revision:', id);
          },

          acceptAll: () => {
            set((state) => {
              const newRevisions = new Map(state.revisions);
              newRevisions.forEach((revision, id) => {
                if (revision.status === 'pending') {
                  newRevisions.set(id, { ...revision, status: 'accepted' });
                }
              });
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Accepted all pending revisions');
          },

          rejectAll: () => {
            set((state) => {
              const newRevisions = new Map(state.revisions);
              newRevisions.forEach((revision, id) => {
                if (revision.status === 'pending') {
                  newRevisions.set(id, { ...revision, status: 'rejected' });
                }
              });
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Rejected all pending revisions');
          },

          acceptByAuthor: (authorId: string) => {
            set((state) => {
              const newRevisions = new Map(state.revisions);
              newRevisions.forEach((revision, id) => {
                if (revision.author.id === authorId && revision.status === 'pending') {
                  newRevisions.set(id, { ...revision, status: 'accepted' });
                }
              });
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Accepted all revisions by author:', authorId);
          },

          rejectByAuthor: (authorId: string) => {
            set((state) => {
              const newRevisions = new Map(state.revisions);
              newRevisions.forEach((revision, id) => {
                if (revision.author.id === authorId && revision.status === 'pending') {
                  newRevisions.set(id, { ...revision, status: 'rejected' });
                }
              });
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Rejected all revisions by author:', authorId);
          },

          updateRevisionNodeKey: (id: string, newNodeKey: string) => {
            set((state) => {
              const revision = state.revisions.get(id);
              if (!revision) return state;

              const newRevisions = new Map(state.revisions);
              newRevisions.set(id, { ...revision, nodeKey: newNodeKey });
              return { revisions: newRevisions };
            });
            console.log('[RevisionStore] Updated revision node key:', id, newNodeKey);
          },

          // Tracking control
          enableTracking: () => {
            set({ trackingEnabled: true });
            console.log('[RevisionStore] Tracking enabled');
          },

          disableTracking: () => {
            set({ trackingEnabled: false });
            console.log('[RevisionStore] Tracking disabled');
          },

          toggleTracking: () => {
            const newValue = !get().trackingEnabled;
            set({ trackingEnabled: newValue });
            console.log('[RevisionStore] Tracking toggled:', newValue);
          },

          setViewMode: (mode: TrackChangesViewMode) => {
            set({ viewMode: mode });
            console.log('[RevisionStore] View mode set to:', mode);
          },

          setShowDeletions: (show: boolean) => {
            set({ showDeletions: show });
            console.log('[RevisionStore] Show deletions:', show);
          },

          setCurrentAuthor: (author: RevisionAuthor) => {
            set({ currentAuthor: author });
            console.log('[RevisionStore] Current author set to:', author.name);
          },

          // Document validation
          setDocumentValidated: (validated: boolean) => {
            set({ documentValidated: validated });
            console.log('[RevisionStore] Document validated:', validated);
          },

          toggleDocumentValidated: () => {
            const newValue = !get().documentValidated;
            set({ documentValidated: newValue });
            console.log('[RevisionStore] Document validated toggled:', newValue);
          },

          // Utility
          clearAllVersions: () => {
            set({ versions: new Map(), activeVersionId: null });
            console.log('[RevisionStore] Cleared all versions');
          },

          clearAll: () => {
            set({ versions: new Map(), revisions: new Map(), activeVersionId: null });
            console.log('[RevisionStore] Cleared all versions and revisions');
          },
        }),
        {
          name: 'certeafiles-versions',
          // Custom serialization for Map
          storage: {
            getItem: (name) => {
              const str = localStorage.getItem(name);
              if (!str) return null;
              const parsed = JSON.parse(str);
              // Convert versions array back to Map
              if (parsed.state?.versions) {
                parsed.state.versions = new Map(parsed.state.versions);
              }
              // Convert revisions array back to Map
              if (parsed.state?.revisions) {
                parsed.state.revisions = new Map(parsed.state.revisions);
              }
              return parsed;
            },
            setItem: (name, value) => {
              // Convert Maps to arrays for storage
              const toStore = {
                ...value,
                state: {
                  ...value.state,
                  versions: Array.from(value.state.versions.entries()),
                  revisions: Array.from(value.state.revisions.entries()),
                },
              };
              localStorage.setItem(name, JSON.stringify(toStore));
            },
            removeItem: (name) => localStorage.removeItem(name),
          },
          partialize: (state) => ({
            versions: state.versions,
            revisions: state.revisions,
            currentAuthor: state.currentAuthor,
          } as unknown as RevisionState),
        }
      )
    ),
    { name: 'revision-store' }
  )
);

export default useRevisionStore;
