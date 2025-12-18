/**
 * SpellCheckPlugin - Plugin for multilingual spell checking
 * Per Constitution Section 1 - General Features
 *
 * Uses the browser's native spellcheck API with custom dictionary support.
 */
import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { Languages, Check, Plus, X, BookOpen } from 'lucide-react';
import { useSpellCheckStore } from '../stores/spellcheckStore';
import { LANGUAGE_LABELS, type SpellCheckLanguage } from '../types/spellcheck';

/**
 * Commands for spell check
 */
export const TOGGLE_SPELLCHECK_COMMAND: LexicalCommand<void> = createCommand(
  'TOGGLE_SPELLCHECK_COMMAND'
);

export const SET_SPELLCHECK_LANGUAGE_COMMAND: LexicalCommand<SpellCheckLanguage> = createCommand(
  'SET_SPELLCHECK_LANGUAGE_COMMAND'
);

export const ADD_TO_DICTIONARY_COMMAND: LexicalCommand<string> = createCommand(
  'ADD_TO_DICTIONARY_COMMAND'
);

export interface SpellCheckPluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
}

/**
 * SpellCheckPlugin - Enables browser-based spell checking with language selection
 */
export function SpellCheckPlugin({
  enabled = true,
}: SpellCheckPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {
    enabled: spellCheckEnabled,
    language,
    toggleEnabled,
    setLanguage,
    addToDictionary,
  } = useSpellCheckStore();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  /**
   * Apply spellcheck attribute to editor
   */
  useEffect(() => {
    if (!enabled) return;

    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // Set spellcheck attribute
    rootElement.spellcheck = spellCheckEnabled;

    // Set language attribute for better spell checking
    rootElement.lang = language;

    return () => {
      rootElement.spellcheck = false;
    };
  }, [editor, enabled, spellCheckEnabled, language]);

  /**
   * Register commands
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterToggle = editor.registerCommand(
      TOGGLE_SPELLCHECK_COMMAND,
      () => {
        toggleEnabled();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterSetLanguage = editor.registerCommand(
      SET_SPELLCHECK_LANGUAGE_COMMAND,
      (newLanguage) => {
        setLanguage(newLanguage);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterAddToDictionary = editor.registerCommand(
      ADD_TO_DICTIONARY_COMMAND,
      (word) => {
        addToDictionary(word);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterToggle();
      unregisterSetLanguage();
      unregisterAddToDictionary();
    };
  }, [editor, enabled, toggleEnabled, setLanguage, addToDictionary]);

  /**
   * Add selected word to dictionary via context menu
   */
  const handleAddSelectedToDictionary = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const text = selection.getTextContent().trim();
        if (text && !text.includes(' ')) {
          addToDictionary(text);
        }
      }
    });
  }, [editor, addToDictionary]);

  if (!enabled) return null;

  return (
    <>
      {/* Language Selector Modal */}
      {showLanguageSelector &&
        createPortal(
          <LanguageSelectorModal
            currentLanguage={language}
            onSelect={(lang) => {
              setLanguage(lang);
              setShowLanguageSelector(false);
            }}
            onClose={() => setShowLanguageSelector(false)}
          />,
          document.body
        )}

      {/* Spell Check Toolbar Button */}
      <SpellCheckToolbarButton
        enabled={spellCheckEnabled}
        language={language}
        onToggle={toggleEnabled}
        onLanguageClick={() => setShowLanguageSelector(true)}
        onAddToDictionary={handleAddSelectedToDictionary}
      />
    </>
  );
}

/**
 * Toolbar button for spell check
 */
interface SpellCheckToolbarButtonProps {
  enabled: boolean;
  language: SpellCheckLanguage;
  onToggle: () => void;
  onLanguageClick: () => void;
  onAddToDictionary: () => void;
}

function SpellCheckToolbarButton({
  enabled,
  language,
  onToggle,
  onLanguageClick,
}: SpellCheckToolbarButtonProps): JSX.Element {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          transition-colors
          ${enabled
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }
        `}
        title="Correcteur orthographique"
      >
        <Languages size={16} />
        <span className="hidden sm:inline">
          {LANGUAGE_LABELS[language].split(' ')[0]}
        </span>
      </button>

      {showMenu && (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-50"
          onMouseLeave={() => setShowMenu(false)}
        >
          <button
            type="button"
            onClick={() => {
              onToggle();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
          >
            {enabled ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-gray-400" />}
            <span>{enabled ? 'Désactiver' : 'Activer'} le correcteur</span>
          </button>

          <div className="border-t border-gray-100 my-1" />

          <button
            type="button"
            onClick={() => {
              onLanguageClick();
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
          >
            <BookOpen size={14} className="text-blue-600" />
            <span>Changer la langue</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Language selector modal
 */
interface LanguageSelectorModalProps {
  currentLanguage: SpellCheckLanguage;
  onSelect: (language: SpellCheckLanguage) => void;
  onClose: () => void;
}

function LanguageSelectorModal({
  currentLanguage,
  onSelect,
  onClose,
}: LanguageSelectorModalProps): JSX.Element {
  const languages = Object.entries(LANGUAGE_LABELS) as [SpellCheckLanguage, string][];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-4 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Langue du correcteur</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {languages.map(([code, label]) => (
            <button
              key={code}
              onClick={() => onSelect(code)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
                transition-colors
                ${currentLanguage === code
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-50'
                }
              `}
              type="button"
            >
              <span>{label}</span>
              {currentLanguage === code && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Spell Check Menu Component (for use in toolbar)
 */
export interface SpellCheckMenuProps {
  className?: string;
}

export function SpellCheckMenu({ className = '' }: SpellCheckMenuProps): JSX.Element {
  const {
    enabled,
    language,
    customDictionary,
    toggleEnabled,
    setLanguage,
    clearDictionary,
  } = useSpellCheckStore();

  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  return (
    <div className={`spellcheck-menu ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleEnabled}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-colors
            ${enabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
          title={enabled ? 'Désactiver le correcteur' : 'Activer le correcteur'}
        >
          <Languages size={16} />
          <span>{enabled ? 'Activé' : 'Désactivé'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
        >
          <span>{LANGUAGE_LABELS[language]}</span>
        </button>

        {customDictionary.length > 0 && (
          <button
            type="button"
            onClick={clearDictionary}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50"
            title={`${customDictionary.length} mot(s) dans le dictionnaire personnel`}
          >
            <Plus size={14} />
            <span>{customDictionary.length}</span>
          </button>
        )}
      </div>

      {showLanguageSelector && (
        <div className="absolute mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-50">
          {(Object.entries(LANGUAGE_LABELS) as [SpellCheckLanguage, string][]).map(
            ([code, label]) => (
              <button
                key={code}
                onClick={() => {
                  setLanguage(code);
                  setShowLanguageSelector(false);
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2 text-left text-sm
                  ${language === code ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}
                `}
                type="button"
              >
                <span>{label}</span>
                {language === code && <Check size={14} />}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default SpellCheckPlugin;
