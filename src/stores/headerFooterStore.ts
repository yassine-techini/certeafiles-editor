/**
 * Header/Footer Store - Zustand state management for headers and footers
 * Per Constitution Section 4.2
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  type HeaderFooterContent,
  type HeaderFooterSegment,
  type ResolvedHeaderFooter,
  createEmptyHeaderFooter,
  createDefaultHeader,
  createDefaultFooter,
} from '../types/headerFooter';

/**
 * Header/Footer store state interface
 */
export interface HeaderFooterState {
  // Default header/footer (used when folio doesn't have an override)
  defaultHeaderId: string | null;
  defaultFooterId: string | null;

  // All header/footer content definitions
  headers: Map<string, HeaderFooterContent>;
  footers: Map<string, HeaderFooterContent>;

  // Folio-specific overrides (folioId -> contentId or null for "no header/footer")
  folioHeaders: Map<string, string | null>;
  folioFooters: Map<string, string | null>;

  // Computed helpers
  getHeader: (id: string) => HeaderFooterContent | undefined;
  getFooter: (id: string) => HeaderFooterContent | undefined;
  getDefaultHeader: () => HeaderFooterContent | undefined;
  getDefaultFooter: () => HeaderFooterContent | undefined;
  getHeaderForFolio: (folioId: string) => ResolvedHeaderFooter;
  getFooterForFolio: (folioId: string) => ResolvedHeaderFooter;
  isUsingDefaultHeader: (folioId: string) => boolean;
  isUsingDefaultFooter: (folioId: string) => boolean;
  hasHeaderOverride: (folioId: string) => boolean;
  hasFooterOverride: (folioId: string) => boolean;

  // Header content actions
  createHeader: (options?: Partial<HeaderFooterContent>) => string;
  updateHeader: (id: string, updates: Partial<Omit<HeaderFooterContent, 'id' | 'createdAt'>>) => void;
  deleteHeader: (id: string) => void;
  updateHeaderSegment: (
    id: string,
    position: 'left' | 'center' | 'right',
    segment: HeaderFooterSegment | null
  ) => void;

  // Footer content actions
  createFooter: (options?: Partial<HeaderFooterContent>) => string;
  updateFooter: (id: string, updates: Partial<Omit<HeaderFooterContent, 'id' | 'createdAt'>>) => void;
  deleteFooter: (id: string) => void;
  updateFooterSegment: (
    id: string,
    position: 'left' | 'center' | 'right',
    segment: HeaderFooterSegment | null
  ) => void;

  // Default actions
  setDefaultHeader: (id: string | null) => void;
  setDefaultFooter: (id: string | null) => void;

  // Folio override actions
  setFolioHeaderOverride: (folioId: string, headerId: string | null) => void;
  setFolioFooterOverride: (folioId: string, footerId: string | null) => void;
  resetFolioHeaderToDefault: (folioId: string) => void;
  resetFolioFooterToDefault: (folioId: string) => void;
  clearFolioHeader: (folioId: string) => void;
  clearFolioFooter: (folioId: string) => void;

  // Bulk actions
  clear: () => void;
  initialize: () => void;
}

/**
 * Create the header/footer store
 */
export const useHeaderFooterStore = create<HeaderFooterState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      defaultHeaderId: null,
      defaultFooterId: null,
      headers: new Map<string, HeaderFooterContent>(),
      footers: new Map<string, HeaderFooterContent>(),
      folioHeaders: new Map<string, string | null>(),
      folioFooters: new Map<string, string | null>(),

      // Computed helpers
      getHeader: (id: string) => get().headers.get(id),

      getFooter: (id: string) => get().footers.get(id),

      getDefaultHeader: () => {
        const { defaultHeaderId, headers } = get();
        return defaultHeaderId ? headers.get(defaultHeaderId) : undefined;
      },

      getDefaultFooter: () => {
        const { defaultFooterId, footers } = get();
        return defaultFooterId ? footers.get(defaultFooterId) : undefined;
      },

      getHeaderForFolio: (folioId: string): ResolvedHeaderFooter => {
        const { folioHeaders, headers, defaultHeaderId } = get();

        // Check for folio-specific override
        if (folioHeaders.has(folioId)) {
          const overrideId = folioHeaders.get(folioId);

          // null means explicitly no header for this folio
          if (overrideId === null || overrideId === undefined) {
            return {
              content: null,
              isDefault: false,
              isOverride: true,
            };
          }

          // Has a specific header
          const content = headers.get(overrideId);
          return {
            content: content ?? null,
            isDefault: false,
            isOverride: true,
            overrideId: overrideId,
          };
        }

        // Use default header
        const defaultContent = defaultHeaderId
          ? headers.get(defaultHeaderId)
          : undefined;

        return {
          content: defaultContent ?? null,
          isDefault: true,
          isOverride: false,
        };
      },

      getFooterForFolio: (folioId: string): ResolvedHeaderFooter => {
        const { folioFooters, footers, defaultFooterId } = get();

        // Check for folio-specific override
        if (folioFooters.has(folioId)) {
          const overrideId = folioFooters.get(folioId);

          // null means explicitly no footer for this folio
          if (overrideId === null || overrideId === undefined) {
            return {
              content: null,
              isDefault: false,
              isOverride: true,
            };
          }

          // Has a specific footer
          const content = footers.get(overrideId);
          return {
            content: content ?? null,
            isDefault: false,
            isOverride: true,
            overrideId: overrideId,
          };
        }

        // Use default footer
        const defaultContent = defaultFooterId
          ? footers.get(defaultFooterId)
          : undefined;

        return {
          content: defaultContent ?? null,
          isDefault: true,
          isOverride: false,
        };
      },

      isUsingDefaultHeader: (folioId: string) => {
        return !get().folioHeaders.has(folioId);
      },

      isUsingDefaultFooter: (folioId: string) => {
        return !get().folioFooters.has(folioId);
      },

      hasHeaderOverride: (folioId: string) => {
        return get().folioHeaders.has(folioId);
      },

      hasFooterOverride: (folioId: string) => {
        return get().folioFooters.has(folioId);
      },

      // Header content actions
      createHeader: (options?: Partial<HeaderFooterContent>) => {
        const id = uuidv4();
        const header = {
          ...createEmptyHeaderFooter(id, 'header'),
          ...options,
          id,
        };

        set((state) => {
          const newHeaders = new Map(state.headers);
          newHeaders.set(id, header);
          return { headers: newHeaders };
        });

        console.log('[HeaderFooterStore] Created header:', id);
        return id;
      },

      updateHeader: (id, updates) => {
        set((state) => {
          const header = state.headers.get(id);
          if (!header) return state;

          const newHeaders = new Map(state.headers);
          newHeaders.set(id, {
            ...header,
            ...updates,
            updatedAt: new Date(),
          });
          return { headers: newHeaders };
        });
      },

      deleteHeader: (id) => {
        set((state) => {
          const newHeaders = new Map(state.headers);
          newHeaders.delete(id);

          // Also remove from folioHeaders if any folio uses this header
          const newFolioHeaders = new Map(state.folioHeaders);
          for (const [folioId, headerId] of newFolioHeaders) {
            if (headerId === id) {
              newFolioHeaders.delete(folioId);
            }
          }

          // Reset default if this was the default
          const newDefaultHeaderId =
            state.defaultHeaderId === id ? null : state.defaultHeaderId;

          return {
            headers: newHeaders,
            folioHeaders: newFolioHeaders,
            defaultHeaderId: newDefaultHeaderId,
          };
        });

        console.log('[HeaderFooterStore] Deleted header:', id);
      },

      updateHeaderSegment: (id, position, segment) => {
        set((state) => {
          const header = state.headers.get(id);
          if (!header) return state;

          const newHeaders = new Map(state.headers);
          newHeaders.set(id, {
            ...header,
            [position]: segment,
            updatedAt: new Date(),
          });
          return { headers: newHeaders };
        });
      },

      // Footer content actions
      createFooter: (options?: Partial<HeaderFooterContent>) => {
        const id = uuidv4();
        const footer = {
          ...createEmptyHeaderFooter(id, 'footer'),
          ...options,
          id,
        };

        set((state) => {
          const newFooters = new Map(state.footers);
          newFooters.set(id, footer);
          return { footers: newFooters };
        });

        console.log('[HeaderFooterStore] Created footer:', id);
        return id;
      },

      updateFooter: (id, updates) => {
        set((state) => {
          const footer = state.footers.get(id);
          if (!footer) return state;

          const newFooters = new Map(state.footers);
          newFooters.set(id, {
            ...footer,
            ...updates,
            updatedAt: new Date(),
          });
          return { footers: newFooters };
        });
      },

      deleteFooter: (id) => {
        set((state) => {
          const newFooters = new Map(state.footers);
          newFooters.delete(id);

          // Also remove from folioFooters if any folio uses this footer
          const newFolioFooters = new Map(state.folioFooters);
          for (const [folioId, footerId] of newFolioFooters) {
            if (footerId === id) {
              newFolioFooters.delete(folioId);
            }
          }

          // Reset default if this was the default
          const newDefaultFooterId =
            state.defaultFooterId === id ? null : state.defaultFooterId;

          return {
            footers: newFooters,
            folioFooters: newFolioFooters,
            defaultFooterId: newDefaultFooterId,
          };
        });

        console.log('[HeaderFooterStore] Deleted footer:', id);
      },

      updateFooterSegment: (id, position, segment) => {
        set((state) => {
          const footer = state.footers.get(id);
          if (!footer) return state;

          const newFooters = new Map(state.footers);
          newFooters.set(id, {
            ...footer,
            [position]: segment,
            updatedAt: new Date(),
          });
          return { footers: newFooters };
        });
      },

      // Default actions
      setDefaultHeader: (id) => {
        set({ defaultHeaderId: id });
        console.log('[HeaderFooterStore] Set default header:', id);
      },

      setDefaultFooter: (id) => {
        set({ defaultFooterId: id });
        console.log('[HeaderFooterStore] Set default footer:', id);
      },

      // Folio override actions
      setFolioHeaderOverride: (folioId, headerId) => {
        set((state) => {
          const newFolioHeaders = new Map(state.folioHeaders);
          newFolioHeaders.set(folioId, headerId);
          return { folioHeaders: newFolioHeaders };
        });
        console.log('[HeaderFooterStore] Set folio header override:', folioId, '->', headerId);
      },

      setFolioFooterOverride: (folioId, footerId) => {
        set((state) => {
          const newFolioFooters = new Map(state.folioFooters);
          newFolioFooters.set(folioId, footerId);
          return { folioFooters: newFolioFooters };
        });
        console.log('[HeaderFooterStore] Set folio footer override:', folioId, '->', footerId);
      },

      resetFolioHeaderToDefault: (folioId) => {
        set((state) => {
          const newFolioHeaders = new Map(state.folioHeaders);
          newFolioHeaders.delete(folioId);
          return { folioHeaders: newFolioHeaders };
        });
        console.log('[HeaderFooterStore] Reset folio header to default:', folioId);
      },

      resetFolioFooterToDefault: (folioId) => {
        set((state) => {
          const newFolioFooters = new Map(state.folioFooters);
          newFolioFooters.delete(folioId);
          return { folioFooters: newFolioFooters };
        });
        console.log('[HeaderFooterStore] Reset folio footer to default:', folioId);
      },

      clearFolioHeader: (folioId) => {
        // Set to null = explicitly no header
        set((state) => {
          const newFolioHeaders = new Map(state.folioHeaders);
          newFolioHeaders.set(folioId, null);
          return { folioHeaders: newFolioHeaders };
        });
        console.log('[HeaderFooterStore] Cleared header for folio:', folioId);
      },

      clearFolioFooter: (folioId) => {
        // Set to null = explicitly no footer
        set((state) => {
          const newFolioFooters = new Map(state.folioFooters);
          newFolioFooters.set(folioId, null);
          return { folioFooters: newFolioFooters };
        });
        console.log('[HeaderFooterStore] Cleared footer for folio:', folioId);
      },

      // Bulk actions
      clear: () => {
        set({
          defaultHeaderId: null,
          defaultFooterId: null,
          headers: new Map(),
          footers: new Map(),
          folioHeaders: new Map(),
          folioFooters: new Map(),
        });
        console.log('[HeaderFooterStore] Cleared all data');
      },

      initialize: () => {
        const { headers, footers, defaultHeaderId, defaultFooterId } = get();

        // Only initialize if no defaults exist
        if (defaultHeaderId || defaultFooterId) {
          console.log('[HeaderFooterStore] Already initialized');
          return;
        }

        // Create default header
        const defaultHeader = createDefaultHeader(uuidv4());
        const newHeaders = new Map(headers);
        newHeaders.set(defaultHeader.id, defaultHeader);

        // Create default footer
        const defaultFooter = createDefaultFooter(uuidv4());
        const newFooters = new Map(footers);
        newFooters.set(defaultFooter.id, defaultFooter);

        set({
          headers: newHeaders,
          footers: newFooters,
          defaultHeaderId: defaultHeader.id,
          defaultFooterId: defaultFooter.id,
        });

        console.log('[HeaderFooterStore] Initialized with defaults:', {
          defaultHeaderId: defaultHeader.id,
          defaultFooterId: defaultFooter.id,
        });
      },
    })),
    { name: 'header-footer-store' }
  )
);

/**
 * Selector hooks for common use cases
 */
export const useDefaultHeader = () =>
  useHeaderFooterStore((state) => state.getDefaultHeader());

export const useDefaultFooter = () =>
  useHeaderFooterStore((state) => state.getDefaultFooter());

export const useHeaderForFolio = (folioId: string) =>
  useHeaderFooterStore((state) => state.getHeaderForFolio(folioId));

export const useFooterForFolio = (folioId: string) =>
  useHeaderFooterStore((state) => state.getFooterForFolio(folioId));

export default useHeaderFooterStore;
