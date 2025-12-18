/**
 * Style Store - Zustand state management for document styles
 * Per Constitution Section 1 - General Features
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  type DocumentStyle,
  type ParagraphStyleProperties,
  SYSTEM_STYLES,
  createDocumentStyle,
} from '../types/documentStyles';

/**
 * Style store state interface
 */
export interface StyleState {
  /** All available styles (system + custom) */
  styles: DocumentStyle[];
  /** Currently selected style ID */
  selectedStyleId: string | null;
  /** Recent symbols for quick access */
  recentSymbols: string[];
}

/**
 * Style store actions interface
 */
export interface StyleStore extends StyleState {
  // Getters
  getStyle: (id: string) => DocumentStyle | undefined;
  getStylesByType: (type: DocumentStyle['type']) => DocumentStyle[];
  getSystemStyles: () => DocumentStyle[];
  getCustomStyles: () => DocumentStyle[];

  // Style actions
  createStyle: (
    name: string,
    type: DocumentStyle['type'],
    properties: ParagraphStyleProperties,
    basedOn?: string
  ) => string;
  updateStyle: (id: string, updates: Partial<Omit<DocumentStyle, 'id' | 'createdAt' | 'isSystem'>>) => void;
  deleteStyle: (id: string) => boolean;
  duplicateStyle: (id: string, newName: string) => string | null;

  // Selection
  setSelectedStyle: (id: string | null) => void;

  // Recent symbols
  addRecentSymbol: (symbol: string) => void;
  clearRecentSymbols: () => void;

  // Bulk actions
  reset: () => void;
  importStyles: (styles: DocumentStyle[]) => void;
}

const DEFAULT_STATE: StyleState = {
  styles: [...SYSTEM_STYLES],
  selectedStyleId: 'normal',
  recentSymbols: [],
};

const MAX_RECENT_SYMBOLS = 20;

/**
 * Create the style store with persistence
 */
export const useStyleStore = create<StyleStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...DEFAULT_STATE,

        // Getters
        getStyle: (id: string) => {
          return get().styles.find((s) => s.id === id);
        },

        getStylesByType: (type: DocumentStyle['type']) => {
          return get().styles.filter((s) => s.type === type);
        },

        getSystemStyles: () => {
          return get().styles.filter((s) => s.isSystem);
        },

        getCustomStyles: () => {
          return get().styles.filter((s) => !s.isSystem);
        },

        // Style actions
        createStyle: (name, type, properties, basedOn) => {
          const newStyle = createDocumentStyle(name, type, properties, basedOn);

          set((state) => ({
            styles: [...state.styles, newStyle],
          }));

          console.log('[StyleStore] Created style:', newStyle.id, name);
          return newStyle.id;
        },

        updateStyle: (id, updates) => {
          set((state) => ({
            styles: state.styles.map((s) =>
              s.id === id && !s.isSystem
                ? { ...s, ...updates, updatedAt: new Date() }
                : s
            ),
          }));

          console.log('[StyleStore] Updated style:', id);
        },

        deleteStyle: (id) => {
          const style = get().getStyle(id);
          if (!style || style.isSystem) {
            console.warn('[StyleStore] Cannot delete system style:', id);
            return false;
          }

          set((state) => ({
            styles: state.styles.filter((s) => s.id !== id),
            selectedStyleId:
              state.selectedStyleId === id ? 'normal' : state.selectedStyleId,
          }));

          console.log('[StyleStore] Deleted style:', id);
          return true;
        },

        duplicateStyle: (id, newName) => {
          const style = get().getStyle(id);
          if (!style) return null;

          const newStyle = createDocumentStyle(
            newName,
            style.type,
            { ...style.properties },
            style.id
          );

          set((state) => ({
            styles: [...state.styles, newStyle],
          }));

          console.log('[StyleStore] Duplicated style:', id, '->', newStyle.id);
          return newStyle.id;
        },

        // Selection
        setSelectedStyle: (id) => {
          set({ selectedStyleId: id });
        },

        // Recent symbols
        addRecentSymbol: (symbol) => {
          set((state) => {
            const filtered = state.recentSymbols.filter((s) => s !== symbol);
            return {
              recentSymbols: [symbol, ...filtered].slice(0, MAX_RECENT_SYMBOLS),
            };
          });
        },

        clearRecentSymbols: () => {
          set({ recentSymbols: [] });
        },

        // Bulk actions
        reset: () => {
          set(DEFAULT_STATE);
          console.log('[StyleStore] Reset to defaults');
        },

        importStyles: (styles) => {
          // Merge with existing, keeping system styles
          set((state) => {
            const systemStyles = state.styles.filter((s) => s.isSystem);
            const importedCustom = styles.filter((s) => !s.isSystem);
            return {
              styles: [...systemStyles, ...importedCustom],
            };
          });

          console.log('[StyleStore] Imported', styles.length, 'styles');
        },
      }),
      {
        name: 'certeafiles-styles',
        partialize: (state) => ({
          styles: state.styles.filter((s) => !s.isSystem),
          selectedStyleId: state.selectedStyleId,
          recentSymbols: state.recentSymbols,
        }),
        merge: (persisted, current) => {
          const persistedState = persisted as Partial<StyleState>;
          const customStyles = persistedState?.styles || [];
          return {
            ...current,
            styles: [...SYSTEM_STYLES, ...customStyles],
            selectedStyleId: persistedState?.selectedStyleId || 'normal',
            recentSymbols: persistedState?.recentSymbols || [],
          };
        },
      }
    ),
    { name: 'style-store' }
  )
);

export default useStyleStore;
