/**
 * VersionHistoryPlugin - Plugin for managing document version history
 * Per Constitution Section 6 - Track Changes
 *
 * Provides UI and commands for saving, viewing, and restoring document versions.
 */
import { useEffect, useCallback, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { createCommand, COMMAND_PRIORITY_NORMAL } from 'lexical';
import type { LexicalCommand } from 'lexical';
import {
  History,
  Save,
  RotateCcw,
  Trash2,
  Clock,
  User,
  X,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useRevisionStore, type DocumentVersion } from '../stores/revisionStore';

/**
 * Commands for version history management
 */
export const OPEN_VERSION_HISTORY_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_VERSION_HISTORY_COMMAND'
);

export const CLOSE_VERSION_HISTORY_COMMAND: LexicalCommand<void> = createCommand(
  'CLOSE_VERSION_HISTORY_COMMAND'
);

export const QUICK_SAVE_VERSION_COMMAND: LexicalCommand<string | undefined> = createCommand(
  'QUICK_SAVE_VERSION_COMMAND'
);

export interface VersionHistoryPluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Auto-save interval in minutes (0 to disable) */
  autoSaveIntervalMinutes?: number;
  /** Maximum number of versions to keep */
  maxVersions?: number;
  /** Show version panel by default */
  showPanelByDefault?: boolean;
}

/**
 * Format relative time in French
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;

  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Version History Panel Component
 */
function VersionHistoryPanel({
  isOpen,
  onClose,
  onRestore,
  onDelete,
  onSave,
  versions,
  activeVersionId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (label?: string) => void;
  versions: DocumentVersion[];
  activeVersionId: string | null;
}): JSX.Element | null {
  const [saveLabel, setSaveLabel] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(saveLabel || undefined);
    setSaveLabel('');
    setShowSaveForm(false);
  };

  const handleRestore = (id: string) => {
    if (window.confirm('Voulez-vous restaurer cette version ? Les modifications non sauvegardées seront perdues.')) {
      onRestore(id);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous supprimer cette version ?')) {
      onDelete(id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-96 h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <History size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Historique des versions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fermer"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Save New Version Button */}
        <div className="p-4 border-b border-gray-200">
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save size={18} />
              Sauvegarder une version
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                placeholder="Nom de la version (optionnel)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setShowSaveForm(false);
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Sauvegarder
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto">
          {versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-500">
              <History size={48} className="mb-2 opacity-50" />
              <p className="text-sm">Aucune version sauvegardée</p>
              <p className="text-xs text-gray-400 mt-1">Cliquez sur "Sauvegarder" pour créer une version</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedVersionId === version.id ? 'bg-blue-50' : ''
                  } ${activeVersionId === version.id ? 'border-l-4 border-blue-600' : ''}`}
                  onClick={() => setSelectedVersionId(selectedVersionId === version.id ? null : version.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {version.label}
                        </span>
                        {version.isAutoSave && (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            Auto
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatRelativeTime(version.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {version.author.name}
                        </span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-gray-400 transition-transform ${
                        selectedVersionId === version.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded Actions */}
                  {selectedVersionId === version.id && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <RotateCcw size={14} />
                        Restaurer
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Download version as JSON
                          const blob = new Blob([version.content], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${version.label.replace(/[^a-z0-9]/gi, '_')}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Download size={14} />
                        Exporter
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(version.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm ml-auto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {versions.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {versions.length} version{versions.length > 1 ? 's' : ''} sauvegardée{versions.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * VersionHistoryPlugin - Document version management
 */
export function VersionHistoryPlugin({
  enabled = true,
  autoSaveIntervalMinutes = 0,
  showPanelByDefault = false,
}: VersionHistoryPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isPanelOpen, setIsPanelOpen] = useState(showPanelByDefault);

  const {
    getAllVersions,
    addVersion,
    deleteVersion,
    restoreVersion,
    activeVersionId,
    currentAuthor,
  } = useRevisionStore();

  const versions = getAllVersions();

  /**
   * Save current document state as a version
   */
  const handleSaveVersion = useCallback(
    (label?: string) => {
      const editorState = editor.getEditorState();
      const serializedState = JSON.stringify(editorState.toJSON());

      addVersion({
        label: label || `Version du ${new Date().toLocaleString('fr-FR')}`,
        content: serializedState,
        author: currentAuthor,
        isAutoSave: !label,
      });
    },
    [editor, addVersion, currentAuthor]
  );

  /**
   * Restore a version - saves current state as backup first
   */
  const handleRestoreVersion = useCallback(
    (versionId: string) => {
      // First, save current state as a backup before restoring
      const currentEditorState = editor.getEditorState();
      const currentSerializedState = JSON.stringify(currentEditorState.toJSON());

      addVersion({
        label: `Sauvegarde avant restauration - ${new Date().toLocaleString('fr-FR')}`,
        content: currentSerializedState,
        author: currentAuthor,
        isAutoSave: true,
      });

      console.log('[VersionHistoryPlugin] Created backup before restoration');

      // Now restore the selected version
      const version = restoreVersion(versionId);
      if (!version) return;

      try {
        const parsedState = JSON.parse(version.content);
        const newEditorState = editor.parseEditorState(parsedState);
        editor.setEditorState(newEditorState);
        console.log('[VersionHistoryPlugin] Restored version:', versionId);
      } catch (error) {
        console.error('[VersionHistoryPlugin] Failed to restore version:', error);
      }
    },
    [editor, restoreVersion, addVersion, currentAuthor]
  );

  /**
   * Delete a version
   */
  const handleDeleteVersion = useCallback(
    (versionId: string) => {
      deleteVersion(versionId);
    },
    [deleteVersion]
  );

  /**
   * Auto-save at interval
   */
  useEffect(() => {
    if (!enabled || autoSaveIntervalMinutes <= 0) return;

    const intervalId = setInterval(() => {
      handleSaveVersion(`Sauvegarde auto - ${new Date().toLocaleString('fr-FR')}`);
    }, autoSaveIntervalMinutes * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [enabled, autoSaveIntervalMinutes, handleSaveVersion]);

  /**
   * Register commands
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterOpen = editor.registerCommand(
      OPEN_VERSION_HISTORY_COMMAND,
      () => {
        setIsPanelOpen(true);
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );

    const unregisterClose = editor.registerCommand(
      CLOSE_VERSION_HISTORY_COMMAND,
      () => {
        setIsPanelOpen(false);
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );

    const unregisterQuickSave = editor.registerCommand(
      QUICK_SAVE_VERSION_COMMAND,
      (label) => {
        handleSaveVersion(label);
        return true;
      },
      COMMAND_PRIORITY_NORMAL
    );

    return () => {
      unregisterOpen();
      unregisterClose();
      unregisterQuickSave();
    };
  }, [editor, enabled, handleSaveVersion]);

  /**
   * Keyboard shortcut: Ctrl+Shift+S for quick save
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
        e.preventDefault();
        handleSaveVersion();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'h') {
        e.preventDefault();
        setIsPanelOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleSaveVersion]);

  if (!enabled) return null;

  return (
    <VersionHistoryPanel
      isOpen={isPanelOpen}
      onClose={() => setIsPanelOpen(false)}
      onRestore={handleRestoreVersion}
      onDelete={handleDeleteVersion}
      onSave={handleSaveVersion}
      versions={versions}
      activeVersionId={activeVersionId}
    />
  );
}

export default VersionHistoryPlugin;
