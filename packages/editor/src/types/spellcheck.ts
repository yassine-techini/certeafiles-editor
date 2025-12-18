/**
 * Spellcheck Types - Spell checking configuration and state
 * Per Constitution Section 1 - General Features
 */

/**
 * Supported languages for spell checking
 */
export type SpellCheckLanguage =
  | 'fr-FR'    // French (France)
  | 'fr-CA'    // French (Canada)
  | 'en-US'    // English (US)
  | 'en-GB'    // English (UK)
  | 'es-ES'    // Spanish (Spain)
  | 'de-DE'    // German (Germany)
  | 'it-IT'    // Italian
  | 'pt-BR'    // Portuguese (Brazil)
  | 'nl-NL';   // Dutch

/**
 * Language labels for display
 */
export const LANGUAGE_LABELS: Record<SpellCheckLanguage, string> = {
  'fr-FR': 'Français (France)',
  'fr-CA': 'Français (Canada)',
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Español',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
  'pt-BR': 'Português (Brasil)',
  'nl-NL': 'Nederlands',
};

/**
 * Spell check error
 */
export interface SpellError {
  /** Word that is misspelled */
  word: string;
  /** Start offset in the text */
  offset: number;
  /** Length of the word */
  length: number;
  /** Suggested corrections */
  suggestions: string[];
}

/**
 * Custom dictionary entry
 */
export interface DictionaryEntry {
  /** Word to add to dictionary */
  word: string;
  /** Language for which this word is valid */
  language: SpellCheckLanguage | 'all';
  /** When the word was added */
  addedAt: Date;
}

/**
 * Spell check state
 */
export interface SpellCheckState {
  /** Whether spell check is enabled */
  enabled: boolean;
  /** Current language */
  language: SpellCheckLanguage;
  /** Custom dictionary entries */
  customDictionary: DictionaryEntry[];
  /** Whether to check spelling as you type */
  checkAsYouType: boolean;
  /** Whether to show suggestions in context menu */
  showSuggestions: boolean;
  /** Maximum number of suggestions to show */
  maxSuggestions: number;
}

/**
 * Default spell check state
 */
export const DEFAULT_SPELLCHECK_STATE: SpellCheckState = {
  enabled: true,
  language: 'fr-FR',
  customDictionary: [],
  checkAsYouType: true,
  showSuggestions: true,
  maxSuggestions: 5,
};

/**
 * Create a dictionary entry
 */
export function createDictionaryEntry(
  word: string,
  language: SpellCheckLanguage | 'all' = 'all'
): DictionaryEntry {
  return {
    word: word.toLowerCase(),
    language,
    addedAt: new Date(),
  };
}

/**
 * Check if a word is in the custom dictionary
 */
export function isInCustomDictionary(
  word: string,
  dictionary: DictionaryEntry[],
  language: SpellCheckLanguage
): boolean {
  const lowerWord = word.toLowerCase();
  return dictionary.some(
    (entry) =>
      entry.word === lowerWord &&
      (entry.language === 'all' || entry.language === language)
  );
}
