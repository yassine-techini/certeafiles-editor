/**
 * TrackChangesToolbar - Toolbar for managing track changes
 * Per Constitution Section 6 - Track Changes
 */
import { useCallback, useMemo } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createTextNode,
} from 'lexical';
import {
  Check,
  X,
  Eye,
  EyeOff,
  FileText,
  History,
  CheckCheck,
  XCircle,
} from 'lucide-react';
import { useRevisionStore } from '../../stores/revisionStore';
import { $isInsertionNode, InsertionNode } from '../../nodes/InsertionNode';
import { $isDeletionNode, DeletionNode } from '../../nodes/DeletionNode';
import type { TrackChangesViewMode } from '../../types/revision';

export interface TrackChangesToolbarProps {
  /** Additional class name */
  className?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * View mode labels
 */
const VIEW_MODE_LABELS: Record<TrackChangesViewMode, string> = {
  all_markup: 'Tout afficher',
  simple_markup: 'Simple',
  no_markup: 'Final',
  original: 'Original',
};

/**
 * TrackChangesToolbar - Controls for track changes functionality
 */
export function TrackChangesToolbar({
  className = '',
  compact = false,
}: TrackChangesToolbarProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const {
    trackingEnabled,
    viewMode,
    showDeletions,
    toggleTracking,
    setViewMode,
    setShowDeletions,
  } = useRevisionStore();

  /**
   * Count revision nodes in the editor
   */
  const revisionCounts = useMemo(() => {
    let insertions = 0;
    let deletions = 0;

    editor.getEditorState().read(() => {
      const root = $getRoot();
      const processNode = (node: unknown) => {
        if ($isInsertionNode(node as InsertionNode)) {
          insertions++;
        } else if ($isDeletionNode(node as DeletionNode)) {
          deletions++;
        }
      };

      // Traverse all nodes
      const traverse = (node: unknown) => {
        processNode(node);
        const children = (node as { getChildren?: () => unknown[] }).getChildren?.();
        if (children) {
          children.forEach(traverse);
        }
      };

      root.getChildren().forEach(traverse);
    });

    return { insertions, deletions, total: insertions + deletions };
  }, [editor]);

  /**
   * Accept selected revision or all revisions
   */
  const handleAcceptRevision = useCallback(
    (acceptAll: boolean = false) => {
      editor.update(() => {
        const processNode = (node: unknown) => {
          if ($isInsertionNode(node as InsertionNode)) {
            // Convert InsertionNode to regular TextNode - accept insertion
            const insertionNode = node as InsertionNode;
            const textContent = insertionNode.getTextContent();
            const textNode = $createTextNode(textContent);
            insertionNode.replace(textNode);
          } else if ($isDeletionNode(node as DeletionNode)) {
            // Remove DeletionNode completely - accept deletion
            (node as DeletionNode).remove();
          }
        };

        if (acceptAll) {
          // Process all revision nodes
          const root = $getRoot();
          const traverse = (node: unknown) => {
            const children = (node as { getChildren?: () => unknown[] }).getChildren?.();
            if (children) {
              // Process in reverse to avoid index issues
              [...children].reverse().forEach((child) => {
                traverse(child);
                processNode(child);
              });
            }
          };
          traverse(root);
        } else {
          // Process selected node
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();
            nodes.forEach(processNode);
          }
        }
      });
    },
    [editor]
  );

  /**
   * Reject selected revision or all revisions
   */
  const handleRejectRevision = useCallback(
    (rejectAll: boolean = false) => {
      editor.update(() => {
        const processNode = (node: unknown) => {
          if ($isInsertionNode(node as InsertionNode)) {
            // Remove InsertionNode completely (reject insertion)
            (node as InsertionNode).remove();
          } else if ($isDeletionNode(node as DeletionNode)) {
            // Convert DeletionNode back to regular text (reject deletion)
            const deletionNode = node as DeletionNode;
            const textContent = deletionNode.getTextContent();
            const textNode = $createTextNode(textContent);
            deletionNode.replace(textNode);
          }
        };

        if (rejectAll) {
          // Process all revision nodes
          const root = $getRoot();
          const traverse = (node: unknown) => {
            const children = (node as { getChildren?: () => unknown[] }).getChildren?.();
            if (children) {
              // Process in reverse to avoid index issues
              [...children].reverse().forEach((child) => {
                traverse(child);
                processNode(child);
              });
            }
          };
          traverse(root);
        } else {
          // Process selected node
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const nodes = selection.getNodes();
            nodes.forEach(processNode);
          }
        }
      });
    },
    [editor]
  );

  /**
   * Toggle view mode
   */
  const handleViewModeChange = useCallback(
    (mode: TrackChangesViewMode) => {
      setViewMode(mode);

      // Apply CSS class to editor container
      const editorElement = editor.getRootElement()?.closest('.certeafiles-editor-container');
      if (editorElement) {
        editorElement.classList.remove(
          'track-changes-final',
          'track-changes-original',
          'track-changes-hide-deletions'
        );

        if (mode === 'no_markup') {
          editorElement.classList.add('track-changes-final');
        } else if (mode === 'original') {
          editorElement.classList.add('track-changes-original');
        }
      }
    },
    [editor, setViewMode]
  );

  /**
   * Toggle show/hide deletions
   */
  const handleToggleDeletions = useCallback(() => {
    const newValue = !showDeletions;
    setShowDeletions(newValue);

    // Apply CSS class to editor container
    const editorElement = editor.getRootElement()?.closest('.certeafiles-editor-container');
    if (editorElement) {
      if (newValue) {
        editorElement.classList.remove('track-changes-hide-deletions');
      } else {
        editorElement.classList.add('track-changes-hide-deletions');
      }
    }
  }, [editor, showDeletions, setShowDeletions]);

  if (compact) {
    return (
      <div className={`track-changes-toolbar ${className}`}>
        <button
          type="button"
          className={`track-changes-toolbar-button track-changes-toolbar-button-toggle ${
            trackingEnabled ? 'active' : ''
          }`}
          onClick={toggleTracking}
          title={trackingEnabled ? 'Désactiver le suivi' : 'Activer le suivi'}
        >
          <History size={16} />
          {trackingEnabled && <span className="revision-count-badge">{revisionCounts.total}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className={`track-changes-toolbar ${className}`}>
      {/* Toggle tracking button */}
      <button
        type="button"
        className={`track-changes-toolbar-button track-changes-toolbar-button-toggle ${
          trackingEnabled ? 'active' : ''
        }`}
        onClick={toggleTracking}
        title={trackingEnabled ? 'Désactiver le suivi des modifications' : 'Activer le suivi des modifications'}
      >
        <History size={16} />
        <span>{trackingEnabled ? 'Suivi activé' : 'Suivi désactivé'}</span>
      </button>

      {trackingEnabled && (
        <>
          {/* Separator */}
          <div className="w-px h-6 bg-slate-300 mx-2" />

          {/* Revision count */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText size={16} />
            <span>
              {revisionCounts.insertions} insertion{revisionCounts.insertions !== 1 ? 's' : ''}
            </span>
            <span className="text-slate-400">|</span>
            <span>
              {revisionCounts.deletions} suppression{revisionCounts.deletions !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-300 mx-2" />

          {/* Accept/Reject buttons */}
          <button
            type="button"
            className="track-changes-toolbar-button track-changes-toolbar-button-accept"
            onClick={() => handleAcceptRevision(false)}
            disabled={revisionCounts.total === 0}
            title="Accepter la modification sélectionnée"
          >
            <Check size={16} />
            <span>Accepter</span>
          </button>

          <button
            type="button"
            className="track-changes-toolbar-button track-changes-toolbar-button-reject"
            onClick={() => handleRejectRevision(false)}
            disabled={revisionCounts.total === 0}
            title="Rejeter la modification sélectionnée"
          >
            <X size={16} />
            <span>Rejeter</span>
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-300 mx-2" />

          {/* Accept/Reject all */}
          <button
            type="button"
            className="track-changes-toolbar-button track-changes-toolbar-button-accept"
            onClick={() => handleAcceptRevision(true)}
            disabled={revisionCounts.total === 0}
            title="Accepter toutes les modifications"
          >
            <CheckCheck size={16} />
            <span>Tout accepter</span>
          </button>

          <button
            type="button"
            className="track-changes-toolbar-button track-changes-toolbar-button-reject"
            onClick={() => handleRejectRevision(true)}
            disabled={revisionCounts.total === 0}
            title="Rejeter toutes les modifications"
          >
            <XCircle size={16} />
            <span>Tout rejeter</span>
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-300 mx-2" />

          {/* Toggle deletions visibility */}
          <button
            type="button"
            className={`track-changes-toolbar-button track-changes-toolbar-button-toggle ${
              showDeletions ? '' : 'active'
            }`}
            onClick={handleToggleDeletions}
            title={showDeletions ? 'Masquer les suppressions' : 'Afficher les suppressions'}
          >
            {showDeletions ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>

          {/* View mode selector */}
          <div className="track-changes-view-selector ml-auto">
            {(Object.keys(VIEW_MODE_LABELS) as TrackChangesViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`track-changes-view-option ${viewMode === mode ? 'active' : ''}`}
                onClick={() => handleViewModeChange(mode)}
              >
                {VIEW_MODE_LABELS[mode]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TrackChangesToolbar;
