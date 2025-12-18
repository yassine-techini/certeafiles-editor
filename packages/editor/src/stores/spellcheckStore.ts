/**
 * Spell Check Store - Zustand state management for spell checking
 * Per Constitution Section 1 - General Features
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  type SpellCheckLanguage,
  type SpellCheckState,
  DEFAULT_SPELLCHECK_STATE,
  createDictionaryEntry,
  isInCustomDictionary,
} from '../types/spellcheck';

/**
 * Spell check store state and actions
 */
export interface SpellCheckStore extends SpellCheckState {
  // Actions
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  setLanguage: (language: SpellCheckLanguage) => void;
  setCheckAsYouType: (check: boolean) => void;
  setShowSuggestions: (show: boolean) => void;
  setMaxSuggestions: (max: number) => void;

  // Dictionary actions
  addToDictionary: (word: string, language?: SpellCheckLanguage | 'all') => void;
  removeFromDictionary: (word: string) => void;
  clearDictionary: () => void;
  isInDictionary: (word: string) => boolean;

  // Reset
  reset: () => void;
}

/**
 * Create the spell check store with persistence
 */
export const useSpellCheckStore = create<SpellCheckStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        ...DEFAULT_SPELLCHECK_STATE,

        // Actions
        setEnabled: (enabled: boolean) => {
          set({ enabled });
          console.log('[SpellCheckStore] Enabled:', enabled);
        },

        toggleEnabled: () => {
          const newValue = !get().enabled;
          set({ enabled: newValue });
          console.log('[SpellCheckStore] Toggled:', newValue);
        },

        setLanguage: (language: SpellCheckLanguage) => {
          set({ language });
          console.log('[SpellCheckStore] Language set to:', language);
        },

        setCheckAsYouType: (check: boolean) => {
          set({ checkAsYouType: check });
        },

        setShowSuggestions: (show: boolean) => {
          set({ showSuggestions: show });
        },

        setMaxSuggestions: (max: number) => {
          set({ maxSuggestions: Math.max(1, Math.min(10, max)) });
        },

        // Dictionary actions
        addToDictionary: (word: string, language: SpellCheckLanguage | 'all' = 'all') => {
          const state = get();
          const lowerWord = word.toLowerCase();

          // Check if already in dictionary
          if (isInCustomDictionary(lowerWord, state.customDictionary, state.language)) {
            console.log('[SpellCheckStore] Word already in dictionary:', word);
            return;
          }

          const entry = createDictionaryEntry(lowerWord, language);
          set({ customDictionary: [...state.customDictionary, entry] });
          console.log('[SpellCheckStore] Added to dictionary:', word);
        },

        removeFromDictionary: (word: string) => {
          const lowerWord = word.toLowerCase();
          set((state) => ({
            customDictionary: state.customDictionary.filter(
              (entry) => entry.word !== lowerWord
            ),
          }));
          console.log('[SpellCheckStore] Removed from dictionary:', word);
        },

        clearDictionary: () => {
          set({ customDictionary: [] });
          console.log('[SpellCheckStore] Dictionary cleared');
        },

        isInDictionary: (word: string) => {
          const state = get();
          return isInCustomDictionary(word, state.customDictionary, state.language);
        },

        // Reset
        reset: () => {
          set(DEFAULT_SPELLCHECK_STATE);
          console.log('[SpellCheckStore] Reset to defaults');
        },
      }),
      {
        name: 'certeafiles-spellcheck',
        partialize: (state) => ({
          enabled: state.enabled,
          language: state.language,
          customDictionary: state.customDictionary,
          checkAsYouType: state.checkAsYouType,
          showSuggestions: state.showSuggestions,
          maxSuggestions: state.maxSuggestions,
        }),
      }
    ),
    { name: 'spellcheck-store' }
  )
);

export default useSpellCheckStore;
