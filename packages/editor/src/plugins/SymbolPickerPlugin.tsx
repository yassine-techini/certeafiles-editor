/**
 * SymbolPickerPlugin - Plugin for inserting special symbols
 * Per Constitution Section 1 - General Features
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
import { Type, X, Clock, Search } from 'lucide-react';

import { SYMBOL_CATEGORIES, SPECIAL_SYMBOLS } from '../types/documentStyles';
import { useStyleStore } from '../stores/styleStore';

/**
 * Commands for symbol picker
 */
export const OPEN_SYMBOL_PICKER_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_SYMBOL_PICKER_COMMAND'
);

export const INSERT_SYMBOL_COMMAND: LexicalCommand<{ symbol: string }> =
  createCommand('INSERT_SYMBOL_COMMAND');

export interface SymbolPickerPluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
}

/**
 * SymbolPickerPlugin - Provides special symbol insertion
 */
export function SymbolPickerPlugin({
  enabled = true,
}: SymbolPickerPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const { recentSymbols, addRecentSymbol } = useStyleStore();

  /**
   * Handle symbol insertion
   */
  const insertSymbol = useCallback(
    (symbol: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(symbol);
        }
      });

      addRecentSymbol(symbol);
      setIsOpen(false);
    },
    [editor, addRecentSymbol]
  );

  /**
   * Register commands
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterOpen = editor.registerCommand(
      OPEN_SYMBOL_PICKER_COMMAND,
      () => {
        setIsOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterInsert = editor.registerCommand(
      INSERT_SYMBOL_COMMAND,
      (payload) => {
        insertSymbol(payload.symbol);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterOpen();
      unregisterInsert();
    };
  }, [editor, enabled, insertSymbol]);

  if (!enabled) return null;

  return (
    <>
      {isOpen &&
        createPortal(
          <SymbolPickerModal
            recentSymbols={recentSymbols}
            onSelect={insertSymbol}
            onClose={() => setIsOpen(false)}
          />,
          document.body
        )}
    </>
  );
}

/**
 * Symbol Picker Modal Component
 */
interface SymbolPickerModalProps {
  recentSymbols: string[];
  onSelect: (symbol: string) => void;
  onClose: () => void;
}

function SymbolPickerModal({
  recentSymbols,
  onSelect,
  onClose,
}: SymbolPickerModalProps): JSX.Element {
  const [activeCategory, setActiveCategory] = useState<keyof typeof SYMBOL_CATEGORIES>('COMMON');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter symbols based on search
  const filteredSymbols = searchQuery
    ? Object.values(SPECIAL_SYMBOLS)
        .flat()
        .filter((s) => s.includes(searchQuery))
    : SPECIAL_SYMBOLS[activeCategory];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Type size={20} className="text-blue-600" />
            Symboles spéciaux
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un symbole..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Category Sidebar */}
          {!searchQuery && (
            <div className="w-44 border-r border-gray-100 overflow-y-auto py-2">
              {/* Recent symbols */}
              {recentSymbols.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('COMMON')}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                    ${activeCategory === 'COMMON' && recentSymbols.length > 0
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <Clock size={14} />
                  <span>Récents</span>
                </button>
              )}

              {/* Categories */}
              {(Object.keys(SYMBOL_CATEGORIES) as (keyof typeof SYMBOL_CATEGORIES)[]).map(
                (key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={`
                      w-full px-3 py-2 text-sm text-left transition-colors
                      ${activeCategory === key
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    {SYMBOL_CATEGORIES[key]}
                  </button>
                )
              )}
            </div>
          )}

          {/* Symbols Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Recent symbols section */}
            {recentSymbols.length > 0 && activeCategory === 'COMMON' && !searchQuery && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Récemment utilisés
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recentSymbols.map((symbol, index) => (
                    <SymbolButton
                      key={`recent-${index}`}
                      symbol={symbol}
                      onClick={() => onSelect(symbol)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Category symbols */}
            <div>
              {!searchQuery && (
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {SYMBOL_CATEGORIES[activeCategory]}
                </h4>
              )}
              <div className="flex flex-wrap gap-1">
                {filteredSymbols.map((symbol, index) => (
                  <SymbolButton
                    key={`symbol-${index}`}
                    symbol={symbol}
                    onClick={() => onSelect(symbol)}
                  />
                ))}
              </div>
              {filteredSymbols.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucun symbole trouvé
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500 text-center">
            Cliquez sur un symbole pour l&apos;insérer dans le document
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Symbol Button Component
 */
interface SymbolButtonProps {
  symbol: string;
  onClick: () => void;
}

function SymbolButton({ symbol, onClick }: SymbolButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-10 h-10 flex items-center justify-center text-lg border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
      title={`Insérer ${symbol}`}
    >
      {symbol}
    </button>
  );
}

/**
 * Symbol Picker Toolbar Button
 */
export function SymbolPickerToolbarButton(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleClick = useCallback(() => {
    editor.dispatchCommand(OPEN_SYMBOL_PICKER_COMMAND, undefined);
  }, [editor]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      title="Insérer un symbole spécial"
    >
      <Type size={16} />
      <span className="hidden sm:inline">Ω</span>
    </button>
  );
}

export default SymbolPickerPlugin;
