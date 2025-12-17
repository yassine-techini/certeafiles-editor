/**
 * Revision Store - Zustand state management for track changes
 * Per Constitution Section 6 - Track Changes
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  type Revision,
  type RevisionAuthor,
  type RevisionType,
  type TrackChangesViewMode,
  generateRevisionId,
  DEFAULT_AUTHOR,
} from '../types/revision';

/**
 * Revision store state and actions
 */
export interface RevisionState {
  // Data
  revisions: Map<string, Revision>;
  trackingEnabled: boolean;
  viewMode: TrackChangesViewMode;
  currentAuthor: RevisionAuthor;
  showDeletions: boolean;

  // Getters
  getRevision: (id: string) => Revision | undefined;
  getPendingRevisions: () => Revision[];
  getRevisionsByType: (type: RevisionType) => Revision[];
  getRevisionsByAuthor: (authorId: string) => Revision[];
  getRevisionByNodeKey: (nodeKey: string) => Revision | undefined;
  getRevisionCount: () => { total: number; pending: number; accepted: number; rejected: number };

  // Actions
  addRevision: (revision: Omit<Revision, 'id' | 'createdAt' | 'status'>) => string;
  removeRevision: (id: string) => void;
  acceptRevision: (id: string) => void;
  rejectRevision: (id: string) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  acceptByAuthor: (authorId: string) => void;
  rejectByAuthor: (authorId: string) => void;

  // Tracking control
  enableTracking: () => void;
  disableTracking: () => void;
  toggleTracking: () => void;
  setViewMode: (mode: TrackChangesViewMode) => void;
  setShowDeletions: (show: boolean) => void;
  setCurrentAuthor: (author: RevisionAuthor) => void;

  // Utility
  updateRevisionNodeKey: (id: string, nodeKey: string) => void;
  clearAll: () => void;
}

/**
 * Create the revision store
 */
export const useRevisionStore = create<RevisionState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      revisions: new Map(),
      trackingEnabled: false,
      viewMode: 'all_markup',
      currentAuthor: DEFAULT_AUTHOR,
      showDeletions: true,

      // Getters
      getRevision: (id: string) => {
        return get().revisions.get(id);
      },

      getPendingRevisions: () => {
        return Array.from(get().revisions.values()).filter(
          (r) => r.status === 'pending'
        );
      },

      getRevisionsByType: (type: RevisionType) => {
        return Array.from(get().revisions.values()).filter(
          (r) => r.type === type
        );
      },

      getRevisionsByAuthor: (authorId: string) => {
        return Array.from(get().revisions.values()).filter(
          (r) => r.author.id === authorId
        );
      },

      getRevisionByNodeKey: (nodeKey: string) => {
        return Array.from(get().revisions.values()).find(
          (r) => r.nodeKey === nodeKey
        );
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

      // Actions
      addRevision: (revisionData) => {
        const id = generateRevisionId();
        const revision: Revision = {
          ...revisionData,
          id,
          status: 'pending',
          createdAt: new Date(),
        };

        set((state) => {
          const newRevisions = new Map(state.revisions);
          newRevisions.set(id, revision);
          return { revisions: newRevisions };
        });

        console.log('[RevisionStore] Added revision:', id, revision.type);
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
        console.log('[RevisionStore] Accepted revisions by author:', authorId);
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
        console.log('[RevisionStore] Rejected revisions by author:', authorId);
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
        set((state) => ({ trackingEnabled: !state.trackingEnabled }));
        console.log('[RevisionStore] Tracking toggled:', !get().trackingEnabled);
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
      updateRevisionNodeKey: (id: string, nodeKey: string) => {
        set((state) => {
          const revision = state.revisions.get(id);
          if (!revision) return state;

          const newRevisions = new Map(state.revisions);
          newRevisions.set(id, { ...revision, nodeKey });
          return { revisions: newRevisions };
        });
      },

      clearAll: () => {
        set({ revisions: new Map() });
        console.log('[RevisionStore] Cleared all revisions');
      },
    })),
    { name: 'revision-store' }
  )
);

export default useRevisionStore;
