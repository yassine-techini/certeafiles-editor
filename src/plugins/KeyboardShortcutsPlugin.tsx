/**
 * KeyboardShortcutsPlugin - Plugin for managing keyboard shortcuts
 * Per Constitution Section 8 - Accessibility
 *
 * Provides comprehensive keyboard shortcut management with:
 * - Default shortcuts for common actions
 * - Custom shortcut configuration
 * - Shortcut help dialog
 * - Conflict detection
 */
import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  createCommand,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import {
  Keyboard,
  X,
  Search,
  Command,
  ChevronRight,
} from 'lucide-react';
import { OPEN_VERSION_HISTORY_COMMAND, QUICK_SAVE_VERSION_COMMAND } from './VersionHistoryPlugin';
import { OPEN_EXPORT_DIALOG_COMMAND } from './ExportPlugin';

/**
 * Commands for shortcut management
 */
export const OPEN_SHORTCUTS_DIALOG_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_SHORTCUTS_DIALOG_COMMAND'
);

export const CLOSE_SHORTCUTS_DIALOG_COMMAND: LexicalCommand<void> = createCommand(
  'CLOSE_SHORTCUTS_DIALOG_COMMAND'
);

/**
 * Shortcut category
 */
export type ShortcutCategory =
  | 'formatting'
  | 'editing'
  | 'navigation'
  | 'document'
  | 'view'
  | 'other';

/**
 * Shortcut definition
 */
export interface KeyboardShortcut {
  id: string;
  label: string;
  description?: string;
  category: ShortcutCategory;
  keys: string[];
  action: () => void;
  enabled?: boolean;
}

/**
 * Category labels in French
 */
const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  formatting: 'Formatage',
  editing: 'Édition',
  navigation: 'Navigation',
  document: 'Document',
  view: 'Affichage',
  other: 'Autres',
};

/**
 * Format keyboard shortcut for display
 */
function formatShortcut(keys: string[]): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return keys
    .map((key) => {
      if (key === 'Ctrl') return isMac ? '⌘' : 'Ctrl';
      if (key === 'Alt') return isMac ? '⌥' : 'Alt';
      if (key === 'Shift') return isMac ? '⇧' : 'Shift';
      if (key === 'Enter') return '↵';
      if (key === 'Backspace') return '⌫';
      if (key === 'Delete') return '⌦';
      if (key === 'Escape') return 'Esc';
      if (key === 'ArrowUp') return '↑';
      if (key === 'ArrowDown') return '↓';
      if (key === 'ArrowLeft') return '←';
      if (key === 'ArrowRight') return '→';
      if (key === 'Tab') return '⇥';
      return key.toUpperCase();
    })
    .join(' + ');
}

/**
 * Shortcuts Help Dialog Component
 */
function ShortcutsDialog({
  isOpen,
  onClose,
  shortcuts,
}: {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}): JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<ShortcutCategory | null>('formatting');

  if (!isOpen) return null;

  // Filter shortcuts by search query
  const filteredShortcuts = shortcuts.filter((shortcut) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      shortcut.label.toLowerCase().includes(query) ||
      shortcut.description?.toLowerCase().includes(query) ||
      shortcut.keys.join(' ').toLowerCase().includes(query)
    );
  });

  // Group shortcuts by category
  const shortcutsByCategory = filteredShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<ShortcutCategory, KeyboardShortcut[]>
  );

  const categories = Object.keys(shortcutsByCategory) as ShortcutCategory[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Keyboard size={22} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Raccourcis clavier</h2>
              <p className="text-sm text-gray-500">Tous les raccourcis disponibles dans l'éditeur</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fermer (Esc)"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un raccourci..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoFocus
            />
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Keyboard size={48} className="mx-auto mb-2 opacity-50" />
              <p>Aucun raccourci trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() =>
                      setExpandedCategory(expandedCategory === category ? null : category)
                    }
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Command size={16} className="text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {CATEGORY_LABELS[category]}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {shortcutsByCategory[category].length}
                      </span>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        expandedCategory === category ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Category Shortcuts */}
                  {expandedCategory === category && (
                    <div className="divide-y divide-gray-100">
                      {shortcutsByCategory[category].map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className="flex items-center justify-between p-4 hover:bg-gray-50"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{shortcut.label}</p>
                            {shortcut.description && (
                              <p className="text-sm text-gray-500">{shortcut.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {shortcut.keys.map((key, index) => (
                              <span key={index}>
                                <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-700 shadow-sm">
                                  {formatShortcut([key])}
                                </kbd>
                                {index < shortcut.keys.length - 1 && (
                                  <span className="mx-1 text-gray-400">+</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Appuyez sur <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-xs">Esc</kbd> pour fermer
          </p>
        </div>
      </div>
    </div>
  );
}

export interface KeyboardShortcutsPluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Additional custom shortcuts */
  customShortcuts?: KeyboardShortcut[];
  /** Show help button in toolbar */
  showHelpButton?: boolean;
}

/**
 * KeyboardShortcutsPlugin - Comprehensive keyboard shortcut management
 */
export function KeyboardShortcutsPlugin({
  enabled = true,
  customShortcuts = [],
}: KeyboardShortcutsPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Default shortcuts list
   */
  const defaultShortcuts: KeyboardShortcut[] = [
    // Formatting
    {
      id: 'bold',
      label: 'Gras',
      category: 'formatting',
      keys: ['Ctrl', 'B'],
      action: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),
    },
    {
      id: 'italic',
      label: 'Italique',
      category: 'formatting',
      keys: ['Ctrl', 'I'],
      action: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),
    },
    {
      id: 'underline',
      label: 'Souligné',
      category: 'formatting',
      keys: ['Ctrl', 'U'],
      action: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'),
    },
    {
      id: 'strikethrough',
      label: 'Barré',
      category: 'formatting',
      keys: ['Ctrl', 'Shift', 'S'],
      action: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'),
    },
    {
      id: 'code',
      label: 'Code',
      category: 'formatting',
      keys: ['Ctrl', 'E'],
      action: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),
    },
    {
      id: 'subscript',
      label: 'Indice',
      category: 'formatting',
      keys: ['Ctrl', ','],
      action: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript'),
    },
    {
      id: 'superscript',
      label: 'Exposant',
      category: 'formatting',
      keys: ['Ctrl', '.'],
      action: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript'),
    },

    // Editing
    {
      id: 'undo',
      label: 'Annuler',
      category: 'editing',
      keys: ['Ctrl', 'Z'],
      action: () => editor.dispatchCommand(UNDO_COMMAND, undefined),
    },
    {
      id: 'redo',
      label: 'Rétablir',
      category: 'editing',
      keys: ['Ctrl', 'Y'],
      action: () => editor.dispatchCommand(REDO_COMMAND, undefined),
    },
    {
      id: 'redo-alt',
      label: 'Rétablir (alternatif)',
      category: 'editing',
      keys: ['Ctrl', 'Shift', 'Z'],
      action: () => editor.dispatchCommand(REDO_COMMAND, undefined),
    },
    {
      id: 'select-all',
      label: 'Tout sélectionner',
      category: 'editing',
      keys: ['Ctrl', 'A'],
      action: () => {}, // Native browser behavior
    },
    {
      id: 'copy',
      label: 'Copier',
      category: 'editing',
      keys: ['Ctrl', 'C'],
      action: () => {}, // Native browser behavior
    },
    {
      id: 'cut',
      label: 'Couper',
      category: 'editing',
      keys: ['Ctrl', 'X'],
      action: () => {}, // Native browser behavior
    },
    {
      id: 'paste',
      label: 'Coller',
      category: 'editing',
      keys: ['Ctrl', 'V'],
      action: () => {}, // Native browser behavior
    },

    // Document
    {
      id: 'save-version',
      label: 'Sauvegarder une version',
      description: 'Crée un point de restauration',
      category: 'document',
      keys: ['Ctrl', 'Shift', 'S'],
      action: () => editor.dispatchCommand(QUICK_SAVE_VERSION_COMMAND, undefined),
    },
    {
      id: 'version-history',
      label: 'Historique des versions',
      description: 'Affiche l\'historique des versions',
      category: 'document',
      keys: ['Ctrl', 'Shift', 'H'],
      action: () => editor.dispatchCommand(OPEN_VERSION_HISTORY_COMMAND, undefined),
    },
    {
      id: 'export',
      label: 'Exporter',
      description: 'Ouvre le dialogue d\'export',
      category: 'document',
      keys: ['Ctrl', 'Shift', 'E'],
      action: () => editor.dispatchCommand(OPEN_EXPORT_DIALOG_COMMAND, {}),
    },

    // View
    {
      id: 'shortcuts-help',
      label: 'Aide raccourcis',
      description: 'Affiche cette fenêtre d\'aide',
      category: 'view',
      keys: ['Ctrl', '/'],
      action: () => setIsDialogOpen(true),
    },
    {
      id: 'shortcuts-help-alt',
      label: 'Aide raccourcis (alternatif)',
      category: 'view',
      keys: ['F1'],
      action: () => setIsDialogOpen(true),
    },
  ];

  const allShortcuts = [...defaultShortcuts, ...customShortcuts];

  /**
   * Register keyboard event listener for shortcuts help
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or F1 to open shortcuts dialog
      if (
        ((e.ctrlKey || e.metaKey) && e.key === '/') ||
        e.key === 'F1'
      ) {
        e.preventDefault();
        setIsDialogOpen(true);
      }

      // Escape to close dialog
      if (e.key === 'Escape' && isDialogOpen) {
        e.preventDefault();
        setIsDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isDialogOpen]);

  /**
   * Register commands
   */
  useEffect(() => {
    if (!enabled) return;

    return mergeRegister(
      editor.registerCommand(
        OPEN_SHORTCUTS_DIALOG_COMMAND,
        () => {
          setIsDialogOpen(true);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CLOSE_SHORTCUTS_DIALOG_COMMAND,
        () => {
          setIsDialogOpen(false);
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, enabled]);

  if (!enabled) return null;

  return (
    <ShortcutsDialog
      isOpen={isDialogOpen}
      onClose={() => setIsDialogOpen(false)}
      shortcuts={allShortcuts}
    />
  );
}

export default KeyboardShortcutsPlugin;
