/**
 * Version Store - Manages document versions and snapshots
 * Per Constitution Section 5.3 - Versioning
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Version } from '../services/api';
import * as api from '../services/api';

export interface VersionState {
  // Current document
  documentId: string | null;
  documentTitle: string;

  // Versions
  versions: Version[];
  isLoadingVersions: boolean;
  selectedVersionId: string | null;

  // Auto-save state
  isDirty: boolean;
  lastSavedAt: Date | null;
  isSaving: boolean;
  autoSaveEnabled: boolean;

  // Error state
  error: string | null;
}

export interface VersionActions {
  // Document management
  setDocumentId: (id: string | null) => void;
  setDocumentTitle: (title: string) => void;
  loadDocument: (id: string) => Promise<void>;
  createNewDocument: (title?: string) => Promise<string>;

  // Version management
  loadVersions: () => Promise<void>;
  selectVersion: (versionId: string | null) => void;
  createSnapshot: (label: string, content: string) => Promise<void>;
  restoreVersion: (versionId: string) => Promise<string>;

  // Auto-save
  setDirty: (dirty: boolean) => void;
  saveVersion: (content: string, isSnapshot?: boolean, label?: string) => Promise<void>;
  setAutoSaveEnabled: (enabled: boolean) => void;

  // Error handling
  clearError: () => void;
}

const initialState: VersionState = {
  documentId: null,
  documentTitle: 'Sans titre',
  versions: [],
  isLoadingVersions: false,
  selectedVersionId: null,
  isDirty: false,
  lastSavedAt: null,
  isSaving: false,
  autoSaveEnabled: false,
  error: null,
};

export const useVersionStore = create<VersionState & VersionActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setDocumentId: (id) => {
      set({ documentId: id });
    },

    setDocumentTitle: (title) => {
      set({ documentTitle: title });
    },

    loadDocument: async (id) => {
      try {
        set({ isLoadingVersions: true, error: null });

        const { document, latestVersion } = await api.getDocument(id);

        set({
          documentId: id,
          documentTitle: document.title,
          isLoadingVersions: false,
        });

        // Load all versions
        await get().loadVersions();

        // Return the latest content if available
        if (latestVersion) {
          set({ lastSavedAt: new Date(latestVersion.created_at * 1000) });
        }
      } catch (error) {
        console.error('Error loading document:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load document',
          isLoadingVersions: false,
        });
      }
    },

    createNewDocument: async (title = 'Sans titre') => {
      try {
        set({ isSaving: true, error: null });

        const { id } = await api.createDocument({ title });

        set({
          documentId: id,
          documentTitle: title,
          versions: [],
          isDirty: false,
          lastSavedAt: new Date(),
          isSaving: false,
        });

        return id;
      } catch (error) {
        console.error('Error creating document:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to create document',
          isSaving: false,
        });
        throw error;
      }
    },

    loadVersions: async () => {
      const { documentId } = get();
      if (!documentId) return;

      try {
        set({ isLoadingVersions: true, error: null });

        const { versions } = await api.getVersions(documentId);

        set({
          versions,
          isLoadingVersions: false,
        });
      } catch (error) {
        console.error('Error loading versions:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to load versions',
          isLoadingVersions: false,
        });
      }
    },

    selectVersion: (versionId) => {
      set({ selectedVersionId: versionId });
    },

    createSnapshot: async (label, content) => {
      await get().saveVersion(content, true, label);
    },

    restoreVersion: async (versionId) => {
      const { documentId } = get();
      if (!documentId) throw new Error('No document loaded');

      try {
        const { version } = await api.getVersion(documentId, versionId);
        return version.content;
      } catch (error) {
        console.error('Error restoring version:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to restore version',
        });
        throw error;
      }
    },

    setDirty: (dirty) => {
      set({ isDirty: dirty });
    },

    saveVersion: async (content, isSnapshot = false, label) => {
      const { documentId, isSaving } = get();

      if (!documentId || isSaving) return;

      try {
        set({ isSaving: true, error: null });

        await api.createVersion(documentId, {
          content,
          isSnapshot,
          ...(label ? { label } : {}),
        });

        set({
          isDirty: false,
          lastSavedAt: new Date(),
          isSaving: false,
        });

        // Reload versions if it was a snapshot
        if (isSnapshot) {
          await get().loadVersions();
        }
      } catch (error) {
        console.error('Error saving version:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to save',
          isSaving: false,
        });
      }
    },

    setAutoSaveEnabled: (enabled) => {
      set({ autoSaveEnabled: enabled });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);

// Selector helpers
export const selectIsSaving = (state: VersionState) => state.isSaving;
export const selectIsDirty = (state: VersionState) => state.isDirty;
export const selectVersions = (state: VersionState) => state.versions;
export const selectSnapshots = (state: VersionState) =>
  state.versions.filter((v) => v.is_snapshot);
