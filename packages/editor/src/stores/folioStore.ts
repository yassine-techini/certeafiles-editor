/**
 * Folio Store - Zustand state management for folios
 * Per Constitution Section 3.2
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { SerializedEditorState } from 'lexical';
import {
  type Folio,
  type FolioSection,
  type FolioOrientation,
  type FolioStatus,
  type FolioCreatePayload,
  type FolioMargins,
  type FolioMetadata,
  createEmptyFolio,
  DEFAULT_MARGINS,
} from '../types/folio';
import { generateLexicalContent } from '../utils/demoContent';

// Get demo configuration from URL
type DemoType = 'empty' | 'small' | 'large';

function getDemoConfigFromURL(): { type: DemoType; pageCount: number } {
  if (typeof window === 'undefined') {
    return { type: 'empty', pageCount: 1 };
  }
  const urlParams = new URLSearchParams(window.location.search);
  const demo = urlParams.get('demo') as DemoType | null;

  switch (demo) {
    case 'small':
      return { type: 'small', pageCount: 20 };
    case 'large':
      return { type: 'large', pageCount: 300 };
    case 'empty':
    default:
      return { type: 'empty', pageCount: 1 };
  }
}

/**
 * Generate demo content for a folio page using the rich content generator
 */
function generateDemoContent(pageIndex: number, totalPages: number): SerializedEditorState {
  return generateLexicalContent(pageIndex, {
    includeTable: true,
    includeImage: true,
    totalPages,
  }) as SerializedEditorState;
}

/**
 * Folio store state interface
 */
export interface FolioState {
  // Data
  folios: Map<string, Folio>;
  sections: Map<string, FolioSection>;
  activeFolioId: string | null;

  // Computed helpers
  getFolio: (id: string) => Folio | undefined;
  getActiveFolio: () => Folio | undefined;
  getFoliosInOrder: () => Folio[];
  getFoliosBySection: (sectionId: string) => Folio[];

  // Actions
  createFolio: (payload?: FolioCreatePayload) => string;
  deleteFolio: (id: string) => void;
  updateFolio: (id: string, updates: Partial<Omit<Folio, 'id' | 'createdAt'>>) => void;
  updateFolioContent: (id: string, content: SerializedEditorState) => void;
  reorderFolios: (orderedIds: string[]) => void;
  toggleOrientation: (id: string) => void;
  setFolioMargins: (id: string, margins: FolioMargins) => void;
  setActiveFolio: (id: string | null) => void;
  lockFolio: (id: string, locked: boolean) => void;
  setFolioStatus: (id: string, status: FolioStatus) => void;
  toggleFolioStatus: (id: string) => void;
  setFolioMetadata: (id: string, metadata: FolioMetadata) => void;

  // Section actions
  createSection: (name: string, afterSectionId?: string) => string;
  deleteSection: (id: string) => void;
  updateSection: (id: string, updates: Partial<Omit<FolioSection, 'id'>>) => void;
  toggleSectionCollapse: (id: string) => void;

  // Bulk actions
  clear: () => void;
  initialize: () => void;
}

/**
 * Generate ordered folio array from map
 */
function getOrderedFolios(folios: Map<string, Folio>): Folio[] {
  return Array.from(folios.values()).sort((a, b) => a.index - b.index);
}

/**
 * Reindex folios to ensure continuous ordering
 */
function reindexFolios(folios: Map<string, Folio>): Map<string, Folio> {
  const ordered = getOrderedFolios(folios);
  const newMap = new Map<string, Folio>();

  ordered.forEach((folio, index) => {
    newMap.set(folio.id, { ...folio, index });
  });

  return newMap;
}

/**
 * Create the folio store
 */
export const useFolioStore = create<FolioState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      folios: new Map<string, Folio>(),
      sections: new Map<string, FolioSection>(),
      activeFolioId: null,

      // Computed helpers
      getFolio: (id: string) => get().folios.get(id),

      getActiveFolio: () => {
        const { activeFolioId, folios } = get();
        return activeFolioId ? folios.get(activeFolioId) : undefined;
      },

      getFoliosInOrder: () => getOrderedFolios(get().folios),

      getFoliosBySection: (sectionId: string) => {
        return getOrderedFolios(get().folios).filter(
          (folio) => folio.sectionId === sectionId
        );
      },

      // Create a new folio
      createFolio: (payload?: FolioCreatePayload) => {
        const id = uuidv4();
        const { folios } = get();

        // Determine index
        let index: number;
        if (payload?.afterId) {
          const afterFolio = folios.get(payload.afterId);
          index = afterFolio ? afterFolio.index + 1 : folios.size;
        } else {
          index = folios.size;
        }

        const newFolio = createEmptyFolio(id, index, {
          orientation: payload?.orientation ?? 'portrait',
          sectionId: payload?.sectionId ?? null,
          margins: payload?.margins ?? { ...DEFAULT_MARGINS },
        });

        // If inserting in middle, shift subsequent folios
        const newFolios = new Map(folios);
        if (payload?.afterId) {
          newFolios.forEach((folio, fId) => {
            if (folio.index >= index) {
              newFolios.set(fId, { ...folio, index: folio.index + 1 });
            }
          });
        }
        newFolios.set(id, newFolio);

        console.log('[FolioStore] createFolio:', { id, index, payload });

        set({ folios: newFolios, activeFolioId: id });
        return id;
      },

      // Delete a folio
      deleteFolio: (id: string) => {
        const { folios, activeFolioId } = get();

        if (!folios.has(id)) {
          console.warn('[FolioStore] deleteFolio: Folio not found:', id);
          return;
        }

        // Don't delete if it's the last folio
        if (folios.size <= 1) {
          console.warn('[FolioStore] deleteFolio: Cannot delete last folio');
          return;
        }

        const newFolios = new Map(folios);
        newFolios.delete(id);

        // Reindex remaining folios
        const reindexed = reindexFolios(newFolios);

        // Update active folio if needed
        let newActiveFolioId = activeFolioId;
        if (activeFolioId === id) {
          const ordered = getOrderedFolios(reindexed);
          newActiveFolioId = ordered.length > 0 ? ordered[0].id : null;
        }

        console.log('[FolioStore] deleteFolio:', { id, newActiveFolioId });

        set({ folios: reindexed, activeFolioId: newActiveFolioId });
      },

      // Update a folio
      updateFolio: (id: string, updates: Partial<Omit<Folio, 'id' | 'createdAt'>>) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] updateFolio: Folio not found:', id);
          return;
        }

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          ...updates,
          updatedAt: new Date(),
        });

        console.log('[FolioStore] updateFolio:', { id, updates });

        set({ folios: newFolios });
      },

      // Update folio content (editor state)
      updateFolioContent: (id: string, content: SerializedEditorState) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] updateFolioContent: Folio not found:', id);
          return;
        }

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          content,
          updatedAt: new Date(),
        });

        // Don't log content updates to avoid console spam
        set({ folios: newFolios });
      },

      // Reorder folios
      reorderFolios: (orderedIds: string[]) => {
        const { folios } = get();
        const newFolios = new Map<string, Folio>();

        orderedIds.forEach((id, index) => {
          const folio = folios.get(id);
          if (folio) {
            newFolios.set(id, { ...folio, index, updatedAt: new Date() });
          }
        });

        // Add any folios not in orderedIds at the end
        folios.forEach((folio, id) => {
          if (!newFolios.has(id)) {
            newFolios.set(id, { ...folio, index: newFolios.size });
          }
        });

        console.log('[FolioStore] reorderFolios:', orderedIds);

        set({ folios: newFolios });
      },

      // Toggle folio orientation
      toggleOrientation: (id: string) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] toggleOrientation: Folio not found:', id);
          return;
        }

        const newOrientation: FolioOrientation =
          folio.orientation === 'portrait' ? 'landscape' : 'portrait';

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          orientation: newOrientation,
          updatedAt: new Date(),
        });

        console.log('[FolioStore] toggleOrientation:', { id, newOrientation });

        set({ folios: newFolios });
      },

      // Set folio margins
      setFolioMargins: (id: string, margins: FolioMargins) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] setFolioMargins: Folio not found:', id);
          return;
        }

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          margins,
          updatedAt: new Date(),
        });

        console.log('[FolioStore] setFolioMargins:', { id, margins });

        set({ folios: newFolios });
      },

      // Set active folio
      setActiveFolio: (id: string | null) => {
        console.log('[FolioStore] setActiveFolio:', id);
        set({ activeFolioId: id });
      },

      // Lock/unlock folio
      lockFolio: (id: string, locked: boolean) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] lockFolio: Folio not found:', id);
          return;
        }

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          locked,
          updatedAt: new Date(),
        });

        console.log('[FolioStore] lockFolio:', { id, locked });

        set({ folios: newFolios });
      },

      // Set folio status
      setFolioStatus: (id: string, status: FolioStatus) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] setFolioStatus: Folio not found:', id);
          return;
        }

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          status,
          updatedAt: new Date(),
        });

        console.log('[FolioStore] setFolioStatus:', { id, status });

        set({ folios: newFolios });
      },

      // Toggle folio status between modified and validated
      toggleFolioStatus: (id: string) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] toggleFolioStatus: Folio not found:', id);
          return;
        }

        // Cycle: draft -> modified -> validated -> modified
        let newStatus: FolioStatus;
        if (folio.status === 'draft') {
          newStatus = 'modified';
        } else if (folio.status === 'modified') {
          newStatus = 'validated';
        } else {
          newStatus = 'modified';
        }

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          status: newStatus,
          updatedAt: new Date(),
        });

        console.log('[FolioStore] toggleFolioStatus:', { id, oldStatus: folio.status, newStatus });

        set({ folios: newFolios });
      },

      // Set folio metadata (for PDF import, etc.)
      setFolioMetadata: (id: string, metadata: FolioMetadata) => {
        const { folios } = get();
        const folio = folios.get(id);

        if (!folio) {
          console.warn('[FolioStore] setFolioMetadata: Folio not found:', id);
          return;
        }

        const newFolios = new Map(folios);
        newFolios.set(id, {
          ...folio,
          metadata: { ...folio.metadata, ...metadata },
          updatedAt: new Date(),
        });

        console.log('[FolioStore] setFolioMetadata:', { id, metadata });

        set({ folios: newFolios });
      },

      // Create a new section
      createSection: (name: string, afterSectionId?: string) => {
        const id = uuidv4();
        const { sections } = get();

        // Determine index
        let index: number;
        if (afterSectionId) {
          const afterSection = sections.get(afterSectionId);
          index = afterSection ? afterSection.index + 1 : sections.size;
        } else {
          index = sections.size;
        }

        const newSection: FolioSection = {
          id,
          name,
          index,
          collapsed: false,
          numberingStyle: 'continuous',
        };

        const newSections = new Map(sections);
        newSections.set(id, newSection);

        console.log('[FolioStore] createSection:', { id, name, index });

        set({ sections: newSections });
        return id;
      },

      // Delete a section
      deleteSection: (id: string) => {
        const { sections, folios } = get();

        if (!sections.has(id)) {
          console.warn('[FolioStore] deleteSection: Section not found:', id);
          return;
        }

        const newSections = new Map(sections);
        newSections.delete(id);

        // Remove section reference from folios
        const newFolios = new Map(folios);
        newFolios.forEach((folio, fId) => {
          if (folio.sectionId === id) {
            newFolios.set(fId, { ...folio, sectionId: null });
          }
        });

        console.log('[FolioStore] deleteSection:', id);

        set({ sections: newSections, folios: newFolios });
      },

      // Update a section
      updateSection: (id: string, updates: Partial<Omit<FolioSection, 'id'>>) => {
        const { sections } = get();
        const section = sections.get(id);

        if (!section) {
          console.warn('[FolioStore] updateSection: Section not found:', id);
          return;
        }

        const newSections = new Map(sections);
        newSections.set(id, { ...section, ...updates });

        console.log('[FolioStore] updateSection:', { id, updates });

        set({ sections: newSections });
      },

      // Toggle section collapse state
      toggleSectionCollapse: (id: string) => {
        const { sections } = get();
        const section = sections.get(id);

        if (!section) {
          console.warn('[FolioStore] toggleSectionCollapse: Section not found:', id);
          return;
        }

        const newSections = new Map(sections);
        newSections.set(id, { ...section, collapsed: !section.collapsed });

        console.log('[FolioStore] toggleSectionCollapse:', { id, collapsed: !section.collapsed });

        set({ sections: newSections });
      },

      // Clear all data
      clear: () => {
        console.log('[FolioStore] clear');
        set({
          folios: new Map(),
          sections: new Map(),
          activeFolioId: null,
        });
      },

      // Initialize with folios based on URL demo parameter
      initialize: () => {
        const { folios } = get();

        // Only initialize if empty
        if (folios.size > 0) {
          console.log('[FolioStore] initialize: Already has folios, skipping');
          return;
        }

        // Get configuration from URL
        const config = getDemoConfigFromURL();
        const { pageCount, type: demoType } = config;

        // Create the specified number of pages
        const count = Math.max(1, Math.min(pageCount, 500)); // Limit to 500 pages
        const newFolios = new Map<string, Folio>();
        let firstId: string | null = null;

        // Generate content based on demo type
        const shouldGenerateContent = demoType === 'small' || demoType === 'large';

        for (let i = 0; i < count; i++) {
          const id = uuidv4();
          const folio = createEmptyFolio(id, i);

          // Add demo content for non-empty demos
          if (shouldGenerateContent) {
            folio.content = generateDemoContent(i, count);
          }

          newFolios.set(id, folio);
          if (i === 0) firstId = id;
        }

        console.log('[FolioStore] initialize: Creating folios', { count, demoType });

        set({
          folios: newFolios,
          activeFolioId: firstId,
        });
      },
    })),
    { name: 'FolioStore' }
  )
);

// Export selector hooks for common patterns
export const useActiveFolio = () => useFolioStore((state) => state.getActiveFolio());
export const useFoliosInOrder = () => useFolioStore((state) => state.getFoliosInOrder());
export const useActiveFolioId = () => useFolioStore((state) => state.activeFolioId);

export default useFolioStore;
