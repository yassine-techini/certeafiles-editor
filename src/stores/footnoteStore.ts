/**
 * Footnote Store - Zustand state management for footnotes
 * Per Constitution Section 1 - General Features
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  type Footnote,
  type FootnoteState,
  DEFAULT_FOOTNOTE_STATE,
  createFootnote,
} from '../types/footnote';

/**
 * Footnote store interface
 */
export interface FootnoteStore extends FootnoteState {
  // Getters
  getFootnote: (id: string) => Footnote | undefined;
  getFootnoteByNumber: (number: number) => Footnote | undefined;
  getAllFootnotes: () => Footnote[];
  getNextNumber: () => number;

  // Actions
  addFootnote: (content: string, folioId?: string) => string;
  updateFootnote: (id: string, content: string) => void;
  deleteFootnote: (id: string) => void;
  reorderFootnotes: (orderedIds: string[]) => void;
  renumberFootnotes: () => void;

  // Bulk actions
  clear: () => void;
  setFootnotes: (footnotes: Footnote[]) => void;
}

/**
 * Create the footnote store with persistence
 */
export const useFootnoteStore = create<FootnoteStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...DEFAULT_FOOTNOTE_STATE,

        // Getters
        getFootnote: (id: string) => get().footnotes.get(id),

        getFootnoteByNumber: (number: number) => {
          const footnotes = Array.from(get().footnotes.values());
          return footnotes.find((f) => f.number === number);
        },

        getAllFootnotes: () => {
          const { footnotes, footnoteOrder } = get();
          return footnoteOrder
            .map((id) => footnotes.get(id))
            .filter((f): f is Footnote => f !== undefined);
        },

        getNextNumber: () => {
          return get().footnoteOrder.length + 1;
        },

        // Actions
        addFootnote: (content: string, folioId?: string) => {
          const id = uuidv4();
          const number = get().getNextNumber();
          const footnote = createFootnote(id, content, number, folioId);

          set((state) => {
            const newFootnotes = new Map(state.footnotes);
            newFootnotes.set(id, footnote);
            return {
              footnotes: newFootnotes,
              footnoteOrder: [...state.footnoteOrder, id],
            };
          });

          console.log('[FootnoteStore] Added footnote:', id, number);
          return id;
        },

        updateFootnote: (id: string, content: string) => {
          set((state) => {
            const footnote = state.footnotes.get(id);
            if (!footnote) return state;

            const newFootnotes = new Map(state.footnotes);
            newFootnotes.set(id, {
              ...footnote,
              content,
              updatedAt: new Date(),
            });
            return { footnotes: newFootnotes };
          });

          console.log('[FootnoteStore] Updated footnote:', id);
        },

        deleteFootnote: (id: string) => {
          set((state) => {
            const newFootnotes = new Map(state.footnotes);
            newFootnotes.delete(id);

            const newOrder = state.footnoteOrder.filter((fId) => fId !== id);

            return {
              footnotes: newFootnotes,
              footnoteOrder: newOrder,
            };
          });

          // Renumber remaining footnotes
          get().renumberFootnotes();

          console.log('[FootnoteStore] Deleted footnote:', id);
        },

        reorderFootnotes: (orderedIds: string[]) => {
          set({ footnoteOrder: orderedIds });
          get().renumberFootnotes();
        },

        renumberFootnotes: () => {
          set((state) => {
            const newFootnotes = new Map(state.footnotes);
            state.footnoteOrder.forEach((id, index) => {
              const footnote = newFootnotes.get(id);
              if (footnote) {
                newFootnotes.set(id, {
                  ...footnote,
                  number: index + 1,
                  updatedAt: new Date(),
                });
              }
            });
            return { footnotes: newFootnotes };
          });

          console.log('[FootnoteStore] Renumbered footnotes');
        },

        // Bulk actions
        clear: () => {
          set({
            footnotes: new Map(),
            footnoteOrder: [],
          });
          console.log('[FootnoteStore] Cleared all footnotes');
        },

        setFootnotes: (footnotes: Footnote[]) => {
          const newFootnotes = new Map<string, Footnote>();
          const newOrder: string[] = [];

          footnotes.forEach((f) => {
            newFootnotes.set(f.id, f);
            newOrder.push(f.id);
          });

          set({
            footnotes: newFootnotes,
            footnoteOrder: newOrder,
          });
        },
      }),
      {
        name: 'certeafiles-footnotes',
        partialize: (state) => ({
          footnotes: Array.from(state.footnotes.entries()),
          footnoteOrder: state.footnoteOrder,
        }),
        merge: (persisted, current) => {
          const persistedState = persisted as {
            footnotes?: [string, Footnote][];
            footnoteOrder?: string[];
          };
          return {
            ...current,
            footnotes: new Map(persistedState?.footnotes || []),
            footnoteOrder: persistedState?.footnoteOrder || [],
          };
        },
      }
    ),
    { name: 'footnote-store' }
  )
);

export default useFootnoteStore;
