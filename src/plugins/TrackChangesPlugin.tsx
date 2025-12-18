/**
 * TrackChangesPlugin - Plugin for real-time track changes
 * Per Constitution Section 6 - Track Changes
 *
 * Intercepts text modifications to create InsertionNode and DeletionNode
 * for visual tracking of document changes.
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  createCommand,
  TextNode,
} from 'lexical';
import type { LexicalCommand, LexicalNode } from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { useRevisionStore } from '../stores/revisionStore';
import { $isInsertionNode } from '../nodes/InsertionNode';
import { $createDeletionNode, $isDeletionNode } from '../nodes/DeletionNode';
import { generateRevisionId } from '../types/revision';

/**
 * Commands for track changes management
 */
export const TOGGLE_TRACK_CHANGES_COMMAND: LexicalCommand<void> = createCommand(
  'TOGGLE_TRACK_CHANGES_COMMAND'
);

export const SAVE_VERSION_COMMAND: LexicalCommand<string | undefined> = createCommand(
  'SAVE_VERSION_COMMAND'
);

export const RESTORE_VERSION_COMMAND: LexicalCommand<string> = createCommand(
  'RESTORE_VERSION_COMMAND'
);

export const ACCEPT_REVISION_COMMAND: LexicalCommand<string> = createCommand(
  'ACCEPT_REVISION_COMMAND'
);

export const REJECT_REVISION_COMMAND: LexicalCommand<string> = createCommand(
  'REJECT_REVISION_COMMAND'
);

export const ACCEPT_ALL_REVISIONS_COMMAND: LexicalCommand<void> = createCommand(
  'ACCEPT_ALL_REVISIONS_COMMAND'
);

export const REJECT_ALL_REVISIONS_COMMAND: LexicalCommand<void> = createCommand(
  'REJECT_ALL_REVISIONS_COMMAND'
);

export interface TrackChangesPluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean | undefined;
  /** Initial tracking state */
  initialTracking?: boolean | undefined;
  /** Auto-save interval in ms (0 to disable) */
  autoSaveInterval?: number;
}

/**
 * TrackChangesPlugin - Real-time tracking of insertions and deletions
 */
export function TrackChangesPlugin({
  enabled = true,
  initialTracking = false,
  autoSaveInterval = 0,
}: TrackChangesPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const {
    trackingEnabled,
    currentAuthor,
    enableTracking,
    toggleTracking,
    addVersion,
    restoreVersion,
  } = useRevisionStore();

  // Track if we're currently processing a change to avoid infinite loops
  const isProcessingRef = useRef(false);

  // Set initial tracking state
  useEffect(() => {
    if (initialTracking) {
      enableTracking();
    }
  }, [initialTracking, enableTracking]);

  /**
   * Save current editor state as a version
   */
  const handleSaveVersion = useCallback(
    (label?: string) => {
      const editorState = editor.getEditorState();
      const serializedState = JSON.stringify(editorState.toJSON());

      addVersion({
        label: label || `Version ${new Date().toLocaleString('fr-FR')}`,
        content: serializedState,
        author: currentAuthor,
      });

      console.log('[TrackChangesPlugin] Version saved:', label);
    },
    [editor, currentAuthor, addVersion]
  );

  /**
   * Restore a previous version
   */
  const handleRestoreVersion = useCallback(
    (versionId: string) => {
      const version = restoreVersion(versionId);
      if (!version) {
        console.warn('[TrackChangesPlugin] Version not found:', versionId);
        return;
      }

      try {
        const parsedState = JSON.parse(version.content);
        const newEditorState = editor.parseEditorState(parsedState);

        editor.setEditorState(newEditorState);
        console.log('[TrackChangesPlugin] Version restored:', versionId);
      } catch (error) {
        console.error('[TrackChangesPlugin] Failed to restore version:', error);
      }
    },
    [editor, restoreVersion]
  );

  /**
   * Accept a specific revision
   */
  const handleAcceptRevision = useCallback(
    (nodeKey: string) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (!node) return;

        if ($isInsertionNode(node)) {
          // Convert InsertionNode to regular TextNode
          const text = node.getTextContent();
          const textNode = new TextNode(text);
          node.replace(textNode);
        } else if ($isDeletionNode(node)) {
          // Remove DeletionNode completely
          node.remove();
        }
      });
    },
    [editor]
  );

  /**
   * Reject a specific revision
   */
  const handleRejectRevision = useCallback(
    (nodeKey: string) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if (!node) return;

        if ($isInsertionNode(node)) {
          // Remove InsertionNode (reject the insertion)
          node.remove();
        } else if ($isDeletionNode(node)) {
          // Convert DeletionNode back to regular TextNode (reject the deletion)
          const text = node.getTextContent();
          const textNode = new TextNode(text);
          node.replace(textNode);
        }
      });
    },
    [editor]
  );

  /**
   * Accept all revisions
   */
  const handleAcceptAllRevisions = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();

      const processNode = (node: LexicalNode) => {
        if ($isInsertionNode(node)) {
          const text = node.getTextContent();
          const textNode = new TextNode(text);
          node.replace(textNode);
        } else if ($isDeletionNode(node)) {
          node.remove();
        }
      };

      const traverse = (node: LexicalNode) => {
        if ($isElementNode(node)) {
          const children = node.getChildren();
          // Process in reverse to avoid index issues when removing nodes
          [...children].reverse().forEach((child) => {
            traverse(child);
            processNode(child);
          });
        }
      };

      traverse(root);
    });
  }, [editor]);

  /**
   * Reject all revisions
   */
  const handleRejectAllRevisions = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();

      const processNode = (node: LexicalNode) => {
        if ($isInsertionNode(node)) {
          node.remove();
        } else if ($isDeletionNode(node)) {
          const text = node.getTextContent();
          const textNode = new TextNode(text);
          node.replace(textNode);
        }
      };

      const traverse = (node: LexicalNode) => {
        if ($isElementNode(node)) {
          const children = node.getChildren();
          // Process in reverse to avoid index issues when removing nodes
          [...children].reverse().forEach((child) => {
            traverse(child);
            processNode(child);
          });
        }
      };

      traverse(root);
    });
  }, [editor]);

  /**
   * Auto-save versions at interval if tracking is enabled
   */
  useEffect(() => {
    if (!enabled || !trackingEnabled || autoSaveInterval <= 0) return;

    const intervalId = setInterval(() => {
      handleSaveVersion('Auto-save');
    }, autoSaveInterval);

    return () => clearInterval(intervalId);
  }, [enabled, trackingEnabled, autoSaveInterval, handleSaveVersion]);

  /**
   * Intercept backspace/delete to create DeletionNodes instead of removing text
   */
  useEffect(() => {
    if (!enabled) return;

    return mergeRegister(
      // Handle backspace
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          if (!trackingEnabled || isProcessingRef.current) return false;

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          // If there's a selection, let default behavior handle it for now
          if (!selection.isCollapsed()) return false;

          const anchorNode = selection.anchor.getNode();
          const anchorOffset = selection.anchor.offset;

          // If at the start of a text node, we can't delete backwards
          if (anchorOffset === 0) return false;

          // If the node is already a revision node, let default behavior apply
          if ($isInsertionNode(anchorNode) || $isDeletionNode(anchorNode)) {
            return false;
          }

          if ($isTextNode(anchorNode)) {
            event?.preventDefault();
            isProcessingRef.current = true;

            editor.update(() => {
              const text = anchorNode.getTextContent();
              const charToDelete = text[anchorOffset - 1];

              // Create deletion node for the character
              const deletionNode = $createDeletionNode({
                text: charToDelete,
                revisionId: generateRevisionId(),
                author: currentAuthor,
              });

              // Split the text and insert deletion node
              const beforeText = text.slice(0, anchorOffset - 1);
              const afterText = text.slice(anchorOffset);

              if (beforeText) {
                anchorNode.setTextContent(beforeText);
                anchorNode.insertAfter(deletionNode);
                if (afterText) {
                  const afterNode = new TextNode(afterText);
                  deletionNode.insertAfter(afterNode);
                }
              } else {
                // At the start, replace with deletion + after
                anchorNode.setTextContent(charToDelete);
                const newDeletionNode = $createDeletionNode({
                  text: charToDelete,
                  revisionId: generateRevisionId(),
                  author: currentAuthor,
                });
                anchorNode.replace(newDeletionNode);
                if (afterText) {
                  const afterNode = new TextNode(afterText);
                  newDeletionNode.insertAfter(afterNode);
                  afterNode.select(0, 0);
                }
              }

              isProcessingRef.current = false;
            });

            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),

      // Handle delete key
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          if (!trackingEnabled || isProcessingRef.current) return false;

          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;

          // If there's a selection, let default behavior handle it for now
          if (!selection.isCollapsed()) return false;

          const anchorNode = selection.anchor.getNode();
          const anchorOffset = selection.anchor.offset;

          // If the node is already a revision node, let default behavior apply
          if ($isInsertionNode(anchorNode) || $isDeletionNode(anchorNode)) {
            return false;
          }

          if ($isTextNode(anchorNode)) {
            const text = anchorNode.getTextContent();

            // If at the end of the text, can't delete forward
            if (anchorOffset >= text.length) return false;

            event?.preventDefault();
            isProcessingRef.current = true;

            editor.update(() => {
              const charToDelete = text[anchorOffset];

              // Create deletion node for the character
              const deletionNode = $createDeletionNode({
                text: charToDelete,
                revisionId: generateRevisionId(),
                author: currentAuthor,
              });

              // Split the text and insert deletion node
              const beforeText = text.slice(0, anchorOffset);
              const afterText = text.slice(anchorOffset + 1);

              anchorNode.setTextContent(beforeText || '');

              if (beforeText) {
                anchorNode.insertAfter(deletionNode);
              } else {
                anchorNode.replace(deletionNode);
              }

              if (afterText) {
                const afterNode = new TextNode(afterText);
                deletionNode.insertAfter(afterNode);
              }

              isProcessingRef.current = false;
            });

            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, enabled, trackingEnabled, currentAuthor]);

  /**
   * Listen for text insertions to create InsertionNodes
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerNodeTransform(TextNode, (textNode) => {
      if (!trackingEnabled || isProcessingRef.current) return;

      // Skip if this is already a revision node
      if ($isInsertionNode(textNode) || $isDeletionNode(textNode)) return;

      // Check if the text node was just created/modified
      // We use a simple heuristic: if the node is dirty and has content
      const isDirty = textNode.isDirty();

      if (isDirty) {
        // For now, we don't automatically convert all text to InsertionNodes
        // as that would be too aggressive. The tracking mainly focuses on
        // deletions. Insertions are handled through explicit commands.
        // This can be enhanced later with more sophisticated change detection.
      }
    });
  }, [editor, enabled, trackingEnabled, currentAuthor]);

  /**
   * Register command handlers
   */
  useEffect(() => {
    if (!enabled) return;

    return mergeRegister(
      editor.registerCommand(
        TOGGLE_TRACK_CHANGES_COMMAND,
        () => {
          toggleTracking();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        SAVE_VERSION_COMMAND,
        (label) => {
          handleSaveVersion(label);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        RESTORE_VERSION_COMMAND,
        (versionId) => {
          handleRestoreVersion(versionId);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        ACCEPT_REVISION_COMMAND,
        (nodeKey) => {
          handleAcceptRevision(nodeKey);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        REJECT_REVISION_COMMAND,
        (nodeKey) => {
          handleRejectRevision(nodeKey);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        ACCEPT_ALL_REVISIONS_COMMAND,
        () => {
          handleAcceptAllRevisions();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      editor.registerCommand(
        REJECT_ALL_REVISIONS_COMMAND,
        () => {
          handleRejectAllRevisions();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [
    editor,
    enabled,
    toggleTracking,
    handleSaveVersion,
    handleRestoreVersion,
    handleAcceptRevision,
    handleRejectRevision,
    handleAcceptAllRevisions,
    handleRejectAllRevisions,
  ]);

  /**
   * Apply view mode class to editor container
   */
  useEffect(() => {
    if (!enabled) return;

    const { viewMode, showDeletions } = useRevisionStore.getState();

    const updateViewMode = () => {
      const editorElement = editor.getRootElement()?.closest('.certeafiles-editor-container');
      if (!editorElement) return;

      editorElement.classList.remove(
        'track-changes-final',
        'track-changes-original',
        'track-changes-hide-deletions'
      );

      if (viewMode === 'no_markup') {
        editorElement.classList.add('track-changes-final');
      } else if (viewMode === 'original') {
        editorElement.classList.add('track-changes-original');
      }

      if (!showDeletions) {
        editorElement.classList.add('track-changes-hide-deletions');
      }
    };

    // Initial application
    updateViewMode();

    // Subscribe to store changes
    const unsubscribe = useRevisionStore.subscribe(
      (state) => ({ viewMode: state.viewMode, showDeletions: state.showDeletions }),
      updateViewMode
    );

    return unsubscribe;
  }, [editor, enabled]);

  return null;
}

export default TrackChangesPlugin;
