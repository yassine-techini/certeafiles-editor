/**
 * Revision Store - Zustand state management for document versions
 * Per Constitution Section 6 - Track Changes
 *
 * New approach: Version-based system with snapshots instead of per-character tracking
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector, persist } from 'zustand/middleware';
import {
  type RevisionAuthor,
  type TrackChangesViewMode,
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
 * Revision store state and actions
 */
export interface RevisionState {
  // Data
  versions: Map<string, DocumentVersion>;
  trackingEnabled: boolean;
  viewMode: TrackChangesViewMode;
  currentAuthor: RevisionAuthor;
  showDeletions: boolean;
  activeVersionId: string | null;

  // Version getters
  getVersion: (id: string) => DocumentVersion | undefined;
  getAllVersions: () => DocumentVersion[];
  getVersionCount: () => number;
  getRevisionCount: () => { total: number; pending: number; accepted: number; rejected: number };

  // Version actions
  addVersion: (data: { label: string; content: string; author: RevisionAuthor; isAutoSave?: boolean }) => string;
  deleteVersion: (id: string) => void;
  restoreVersion: (id: string) => DocumentVersion | undefined;
  setActiveVersion: (id: string | null) => void;

  // Tracking control
  enableTracking: () => void;
  disableTracking: () => void;
  toggleTracking: () => void;
  setViewMode: (mode: TrackChangesViewMode) => void;
  setShowDeletions: (show: boolean) => void;
  setCurrentAuthor: (author: RevisionAuthor) => void;

  // Utility
  clearAllVersions: () => void;
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
          trackingEnabled: false,
          viewMode: 'all_markup',
          currentAuthor: DEFAULT_AUTHOR,
          showDeletions: true,
          activeVersionId: null,

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

          // For backward compatibility with UI
          getRevisionCount: () => {
            const count = get().versions.size;
            return {
              total: count,
              pending: count,
              accepted: 0,
              rejected: 0,
            };
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

          // Utility
          clearAllVersions: () => {
            set({ versions: new Map(), activeVersionId: null });
            console.log('[RevisionStore] Cleared all versions');
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
              return parsed;
            },
            setItem: (name, value) => {
              // Convert Map to array for storage
              const toStore = {
                ...value,
                state: {
                  ...value.state,
                  versions: Array.from(value.state.versions.entries()),
                },
              };
              localStorage.setItem(name, JSON.stringify(toStore));
            },
            removeItem: (name) => localStorage.removeItem(name),
          },
          partialize: (state) => ({
            versions: state.versions,
            currentAuthor: state.currentAuthor,
          } as unknown as RevisionState),
        }
      )
    ),
    { name: 'revision-store' }
  )
);

export default useRevisionStore;
