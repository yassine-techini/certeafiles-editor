/**
 * TrackChangesPlugin - Plugin for tracking document changes
 * Per Constitution Section 6 - Track Changes
 */
import { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $isTextNode,
  $createTextNode,
  COMMAND_PRIORITY_CRITICAL,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  DELETE_LINE_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  createCommand,
  TextNode,
} from 'lexical';
import type { LexicalCommand, LexicalNode } from 'lexical';
import { mergeRegister } from '@lexical/utils';

import {
  $createInsertionNode,
  $isInsertionNode,
} from '../nodes/InsertionNode';
import {
  $createDeletionNode,
  $isDeletionNode,
} from '../nodes/DeletionNode';
import { useRevisionStore } from '../stores/revisionStore';
import { generateRevisionId } from '../types/revision';

/**
 * Commands for track changes
 */
export const TOGGLE_TRACK_CHANGES_COMMAND: LexicalCommand<void> = createCommand(
  'TOGGLE_TRACK_CHANGES_COMMAND'
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
}

/**
 * TrackChangesPlugin - Intercepts text changes and creates revision nodes
 */
export function TrackChangesPlugin({
  enabled = true,
  initialTracking = false,
}: TrackChangesPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const {
    trackingEnabled,
    currentAuthor,
    addRevision,
    enableTracking,
    toggleTracking,
    acceptRevision,
    rejectRevision,
    acceptAll,
    rejectAll,
    showDeletions,
  } = useRevisionStore();

  // Set initial tracking state
  useEffect(() => {
    if (initialTracking) {
      enableTracking();
    }
  }, [initialTracking, enableTracking]);

  /**
   * Handle text insertion when tracking is enabled
   */
  const handleTextInsertion = useCallback(
    (text: string): boolean => {
      if (!trackingEnabled || !enabled) return false;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Generate revision ID
        const revisionId = generateRevisionId();

        // If there's a selection, first handle the deletion
        if (!selection.isCollapsed()) {
          const selectedText = selection.getTextContent();
          if (selectedText) {
            // Create deletion node for selected text
            const deletionRevisionId = generateRevisionId();
            const deletionNode = $createDeletionNode({
              text: selectedText,
              revisionId: deletionRevisionId,
              author: currentAuthor,
            });

            // Add deletion to store
            addRevision({
              type: 'deletion',
              content: selectedText,
              author: currentAuthor,
              nodeKey: deletionNode.getKey(),
              originalContent: selectedText,
            });

            // Insert deletion node at start of selection
            selection.insertNodes([deletionNode]);
          }
        }

        // Create insertion node for the new text
        const insertionNode = $createInsertionNode({
          text,
          revisionId,
          author: currentAuthor,
        });

        // Add insertion to store
        addRevision({
          type: 'insertion',
          content: text,
          author: currentAuthor,
          nodeKey: insertionNode.getKey(),
        });

        // Insert the node
        selection.insertNodes([insertionNode]);
      });

      return true;
    },
    [editor, trackingEnabled, enabled, currentAuthor, addRevision]
  );

  /**
   * Handle text deletion when tracking is enabled
   */
  const handleDeletion = useCallback(
    (isBackward: boolean): boolean => {
      if (!trackingEnabled || !enabled) return false;

      let handled = false;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Get text to delete
        let textToDelete = '';
        let nodeToProcess: TextNode | null = null;

        if (selection.isCollapsed()) {
          // Get the character/word to delete
          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();

          if ($isTextNode(anchorNode)) {
            const textContent = anchorNode.getTextContent();
            const offset = anchor.offset;

            if (isBackward) {
              // Backspace
              if (offset > 0) {
                textToDelete = textContent.charAt(offset - 1);
                nodeToProcess = anchorNode;
              }
            } else {
              // Delete
              if (offset < textContent.length) {
                textToDelete = textContent.charAt(offset);
                nodeToProcess = anchorNode;
              }
            }
          }
        } else {
          // Selection exists
          textToDelete = selection.getTextContent();
        }

        if (!textToDelete) return;

        // If deleting from an InsertionNode that's pending, just remove the text
        if (nodeToProcess && $isInsertionNode(nodeToProcess)) {
          // Let the normal deletion happen for insertion nodes
          return;
        }

        // If deleting from a DeletionNode, don't do anything
        if (nodeToProcess && $isDeletionNode(nodeToProcess)) {
          handled = true;
          return;
        }

        // Create deletion node for the text
        const revisionId = generateRevisionId();
        const deletionNode = $createDeletionNode({
          text: textToDelete,
          revisionId,
          author: currentAuthor,
        });

        // Add to store
        addRevision({
          type: 'deletion',
          content: textToDelete,
          author: currentAuthor,
          nodeKey: deletionNode.getKey(),
          originalContent: textToDelete,
        });

        if (selection.isCollapsed() && nodeToProcess) {
          // Single character deletion
          const textContent = nodeToProcess.getTextContent();
          const offset = selection.anchor.offset;

          if (isBackward && offset > 0) {
            // Split and insert deletion node
            const beforeText = textContent.slice(0, offset - 1);
            const afterText = textContent.slice(offset);

            if (beforeText) {
              const beforeNode = $createTextNode(beforeText);
              nodeToProcess.insertBefore(beforeNode);
            }
            nodeToProcess.insertBefore(deletionNode);
            if (afterText) {
              nodeToProcess.setTextContent(afterText);
            } else {
              nodeToProcess.remove();
            }
          } else if (!isBackward && offset < textContent.length) {
            const beforeText = textContent.slice(0, offset);
            const afterText = textContent.slice(offset + 1);

            if (beforeText) {
              const beforeNode = $createTextNode(beforeText);
              nodeToProcess.insertBefore(beforeNode);
            }
            nodeToProcess.insertBefore(deletionNode);
            if (afterText) {
              nodeToProcess.setTextContent(afterText);
            } else {
              nodeToProcess.remove();
            }
          }
        } else {
          // Selection deletion - replace with deletion node
          selection.insertNodes([deletionNode]);
        }

        handled = true;
      });

      return handled;
    },
    [editor, trackingEnabled, enabled, currentAuthor, addRevision]
  );

  /**
   * Accept a revision - convert InsertionNode to TextNode, remove DeletionNode
   */
  const handleAcceptRevision = useCallback(
    (revisionId: string) => {
      editor.update(() => {
        const root = $getRoot();
        const traverse = (node: LexicalNode) => {
          if ($isInsertionNode(node) && node.getRevisionId() === revisionId) {
            // Convert InsertionNode to regular TextNode
            const textNode = $createTextNode(node.getTextContent());
            textNode.setFormat(node.getFormat());
            node.replace(textNode);
          } else if ($isDeletionNode(node) && node.getRevisionId() === revisionId) {
            // Remove DeletionNode entirely
            node.remove();
          }

          if ('getChildren' in node && typeof node.getChildren === 'function') {
            const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
            children.forEach(traverse);
          }
        };
        traverse(root);
      });

      acceptRevision(revisionId);
    },
    [editor, acceptRevision]
  );

  /**
   * Reject a revision - remove InsertionNode, restore DeletionNode content
   */
  const handleRejectRevision = useCallback(
    (revisionId: string) => {
      editor.update(() => {
        const root = $getRoot();
        const traverse = (node: LexicalNode) => {
          if ($isInsertionNode(node) && node.getRevisionId() === revisionId) {
            // Remove InsertionNode entirely
            node.remove();
          } else if ($isDeletionNode(node) && node.getRevisionId() === revisionId) {
            // Convert DeletionNode back to regular TextNode
            const textNode = $createTextNode(node.getTextContent());
            textNode.setFormat(node.getFormat());
            node.replace(textNode);
          }

          if ('getChildren' in node && typeof node.getChildren === 'function') {
            const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
            children.forEach(traverse);
          }
        };
        traverse(root);
      });

      rejectRevision(revisionId);
    },
    [editor, rejectRevision]
  );

  /**
   * Accept all revisions
   */
  const handleAcceptAll = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const traverse = (node: LexicalNode) => {
        if ($isInsertionNode(node)) {
          // Convert InsertionNode to regular TextNode
          const textNode = $createTextNode(node.getTextContent());
          textNode.setFormat(node.getFormat());
          node.replace(textNode);
        } else if ($isDeletionNode(node)) {
          // Remove DeletionNode entirely
          node.remove();
        }

        if ('getChildren' in node && typeof node.getChildren === 'function') {
          const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
          children.forEach(traverse);
        }
      };
      traverse(root);
    });

    acceptAll();
  }, [editor, acceptAll]);

  /**
   * Reject all revisions
   */
  const handleRejectAll = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const traverse = (node: LexicalNode) => {
        if ($isInsertionNode(node)) {
          // Remove InsertionNode entirely
          node.remove();
        } else if ($isDeletionNode(node)) {
          // Convert DeletionNode back to regular TextNode
          const textNode = $createTextNode(node.getTextContent());
          textNode.setFormat(node.getFormat());
          node.replace(textNode);
        }

        if ('getChildren' in node && typeof node.getChildren === 'function') {
          const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
          children.forEach(traverse);
        }
      };
      traverse(root);
    });

    rejectAll();
  }, [editor, rejectAll]);

  /**
   * Register command handlers
   */
  useEffect(() => {
    if (!enabled) return;

    return mergeRegister(
      // Text insertion
      editor.registerCommand(
        CONTROLLED_TEXT_INSERTION_COMMAND,
        (payload) => {
          if (!trackingEnabled) return false;
          const text = typeof payload === 'string' ? payload : String(payload);
          return handleTextInsertion(text);
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Backspace
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          if (!trackingEnabled) return false;
          const handled = handleDeletion(true);
          if (handled && event) {
            event.preventDefault();
          }
          return handled;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Delete key
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (event) => {
          if (!trackingEnabled) return false;
          const handled = handleDeletion(false);
          if (handled && event) {
            event.preventDefault();
          }
          return handled;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Delete character command
      editor.registerCommand(
        DELETE_CHARACTER_COMMAND,
        (isBackward) => {
          if (!trackingEnabled) return false;
          return handleDeletion(isBackward);
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Delete word command
      editor.registerCommand(
        DELETE_WORD_COMMAND,
        (isBackward) => {
          if (!trackingEnabled) return false;
          return handleDeletion(isBackward);
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Delete line command
      editor.registerCommand(
        DELETE_LINE_COMMAND,
        (isBackward) => {
          if (!trackingEnabled) return false;
          return handleDeletion(isBackward);
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Toggle track changes
      editor.registerCommand(
        TOGGLE_TRACK_CHANGES_COMMAND,
        () => {
          toggleTracking();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Accept revision
      editor.registerCommand(
        ACCEPT_REVISION_COMMAND,
        (revisionId) => {
          handleAcceptRevision(revisionId);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Reject revision
      editor.registerCommand(
        REJECT_REVISION_COMMAND,
        (revisionId) => {
          handleRejectRevision(revisionId);
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Accept all
      editor.registerCommand(
        ACCEPT_ALL_REVISIONS_COMMAND,
        () => {
          handleAcceptAll();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Reject all
      editor.registerCommand(
        REJECT_ALL_REVISIONS_COMMAND,
        () => {
          handleRejectAll();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [
    editor,
    enabled,
    trackingEnabled,
    handleTextInsertion,
    handleDeletion,
    toggleTracking,
    handleAcceptRevision,
    handleRejectRevision,
    handleAcceptAll,
    handleRejectAll,
  ]);

  /**
   * Update visibility of deletion nodes based on viewMode
   */
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      const traverse = (node: LexicalNode) => {
        if ($isDeletionNode(node)) {
          const element = editor.getElementByKey(node.getKey());
          if (element) {
            element.style.display = showDeletions ? 'inline' : 'none';
          }
        }

        if ('getChildren' in node && typeof node.getChildren === 'function') {
          const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
          children.forEach(traverse);
        }
      };
      traverse(root);
    });
  }, [editor, showDeletions]);

  return null;
}

export default TrackChangesPlugin;
