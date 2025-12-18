/**
 * FootnotePlugin - Plugin for managing footnotes
 * Per Constitution Section 1 - General Features
 *
 * Handles footnote insertion, editing, and display at page bottom.
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
import { FileText, Edit2, Trash2, X, Plus } from 'lucide-react';

import { FootnoteNode, $createFootnoteNode, $isFootnoteNode } from '../nodes/FootnoteNode';
import { useFootnoteStore } from '../stores/footnoteStore';
import type { Footnote } from '../types/footnote';

/**
 * Commands for footnotes
 */
export const INSERT_FOOTNOTE_COMMAND: LexicalCommand<{ content?: string }> =
  createCommand('INSERT_FOOTNOTE_COMMAND');

export const DELETE_FOOTNOTE_COMMAND: LexicalCommand<{ footnoteId: string }> =
  createCommand('DELETE_FOOTNOTE_COMMAND');

export const UPDATE_FOOTNOTE_COMMAND: LexicalCommand<{
  footnoteId: string;
  content: string;
}> = createCommand('UPDATE_FOOTNOTE_COMMAND');

export interface FootnotePluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Whether to show the footnote panel */
  showPanel?: boolean;
}

/**
 * FootnotePlugin - Manages footnotes in the editor
 */
export function FootnotePlugin({
  enabled = true,
  showPanel = true,
}: FootnotePluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {
    getAllFootnotes,
    addFootnote,
    updateFootnote,
    deleteFootnote,
    getFootnote,
  } = useFootnoteStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFootnote, setEditingFootnote] = useState<Footnote | null>(null);
  const [footnoteContent, setFootnoteContent] = useState('');

  /**
   * Register FootnoteNode
   */
  useEffect(() => {
    if (!editor.hasNodes([FootnoteNode])) {
      console.warn(
        '[FootnotePlugin] FootnoteNode not registered. Add it to editor config.'
      );
    }
  }, [editor]);

  /**
   * Handle insert footnote command
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterInsert = editor.registerCommand(
      INSERT_FOOTNOTE_COMMAND,
      (payload) => {
        const content = payload?.content || '';

        if (content) {
          // Insert directly with content
          const footnoteId = addFootnote(content);
          const nextNumber = getAllFootnotes().length;

          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              const footnoteNode = $createFootnoteNode(footnoteId, nextNumber);
              selection.insertNodes([footnoteNode]);
            }
          });
        } else {
          // Show dialog to enter content
          setShowAddDialog(true);
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterDelete = editor.registerCommand(
      DELETE_FOOTNOTE_COMMAND,
      (payload) => {
        const { footnoteId } = payload;

        // Delete from store
        deleteFootnote(footnoteId);

        // Remove node from editor
        editor.update(() => {
          const root = editor.getEditorState()._nodeMap;
          root.forEach((node) => {
            if ($isFootnoteNode(node) && node.getFootnoteId() === footnoteId) {
              node.remove();
            }
          });
        });

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterUpdate = editor.registerCommand(
      UPDATE_FOOTNOTE_COMMAND,
      (payload) => {
        const { footnoteId, content } = payload;
        updateFootnote(footnoteId, content);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterInsert();
      unregisterDelete();
      unregisterUpdate();
    };
  }, [
    editor,
    enabled,
    addFootnote,
    deleteFootnote,
    updateFootnote,
    getAllFootnotes,
  ]);

  /**
   * Handle adding a new footnote from dialog
   */
  const handleAddFootnote = useCallback(() => {
    if (!footnoteContent.trim()) return;

    const footnoteId = addFootnote(footnoteContent.trim());
    const allFootnotes = getAllFootnotes();
    const nextNumber = allFootnotes.length;

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const footnoteNode = $createFootnoteNode(footnoteId, nextNumber);
        selection.insertNodes([footnoteNode]);
      }
    });

    setFootnoteContent('');
    setShowAddDialog(false);
  }, [editor, footnoteContent, addFootnote, getAllFootnotes]);

  /**
   * Handle updating a footnote
   */
  const handleUpdateFootnote = useCallback(() => {
    if (!editingFootnote || !footnoteContent.trim()) return;

    updateFootnote(editingFootnote.id, footnoteContent.trim());
    setFootnoteContent('');
    setEditingFootnote(null);
  }, [editingFootnote, footnoteContent, updateFootnote]);

  /**
   * Handle deleting a footnote
   */
  const handleDeleteFootnote = useCallback(
    (footnoteId: string) => {
      if (!window.confirm('Supprimer cette note de bas de page ?')) return;

      editor.dispatchCommand(DELETE_FOOTNOTE_COMMAND, { footnoteId });
    },
    [editor]
  );

  /**
   * Open edit dialog
   */
  const handleEditClick = useCallback(
    (footnoteId: string) => {
      const footnote = getFootnote(footnoteId);
      if (footnote) {
        setEditingFootnote(footnote);
        setFootnoteContent(footnote.content);
      }
    },
    [getFootnote]
  );

  if (!enabled) return null;

  const allFootnotes = getAllFootnotes();

  return (
    <>
      {/* Add Footnote Dialog */}
      {showAddDialog &&
        createPortal(
          <FootnoteDialog
            title="Ajouter une note de bas de page"
            content={footnoteContent}
            onContentChange={setFootnoteContent}
            onSave={handleAddFootnote}
            onClose={() => {
              setShowAddDialog(false);
              setFootnoteContent('');
            }}
            saveLabel="Ajouter"
          />,
          document.body
        )}

      {/* Edit Footnote Dialog */}
      {editingFootnote &&
        createPortal(
          <FootnoteDialog
            title={`Modifier la note ${editingFootnote.number}`}
            content={footnoteContent}
            onContentChange={setFootnoteContent}
            onSave={handleUpdateFootnote}
            onClose={() => {
              setEditingFootnote(null);
              setFootnoteContent('');
            }}
            saveLabel="Enregistrer"
          />,
          document.body
        )}

      {/* Footnote Panel at bottom of editor */}
      {showPanel && allFootnotes.length > 0 && (
        <FootnotePanel
          footnotes={allFootnotes}
          onEdit={handleEditClick}
          onDelete={handleDeleteFootnote}
        />
      )}
    </>
  );
}

/**
 * Footnote Dialog Component
 */
interface FootnoteDialogProps {
  title: string;
  content: string;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onClose: () => void;
  saveLabel: string;
}

function FootnoteDialog({
  title,
  content,
  onContentChange,
  onSave,
  onClose,
  saveLabel,
}: FootnoteDialogProps): JSX.Element {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-[500px] max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contenu de la note
          </label>
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Entrez le texte de la note..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!content.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Footnote Panel Component - Displays footnotes at bottom
 */
interface FootnotePanelProps {
  footnotes: Footnote[];
  onEdit: (footnoteId: string) => void;
  onDelete: (footnoteId: string) => void;
}

function FootnotePanel({
  footnotes,
  onEdit,
  onDelete,
}: FootnotePanelProps): JSX.Element {
  return (
    <div className="footnote-panel border-t-2 border-gray-300 mt-8 pt-4 px-4">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Notes de bas de page
      </h4>
      <div className="space-y-2">
        {footnotes.map((footnote) => (
          <div
            key={footnote.id}
            data-footnote-content-id={footnote.id}
            className="flex items-start gap-2 group py-1 px-2 rounded hover:bg-gray-50 transition-colors"
          >
            <sup className="text-blue-600 font-semibold text-sm mt-0.5">
              {footnote.number}
            </sup>
            <p className="flex-1 text-sm text-gray-700">{footnote.content}</p>
            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
              <button
                type="button"
                onClick={() => onEdit(footnote.id)}
                className="p-1 hover:bg-blue-100 rounded text-blue-600"
                title="Modifier"
              >
                <Edit2 size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(footnote.id)}
                className="p-1 hover:bg-red-100 rounded text-red-600"
                title="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Footnote Toolbar Button - Can be added to toolbar
 */
export function FootnoteToolbarButton(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleClick = useCallback(() => {
    editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, {});
  }, [editor]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      title="Ajouter une note de bas de page"
    >
      <Plus size={14} />
      <FileText size={14} />
      <span className="hidden sm:inline">Note</span>
    </button>
  );
}

export default FootnotePlugin;
