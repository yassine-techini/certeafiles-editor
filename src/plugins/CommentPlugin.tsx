/**
 * CommentPlugin - Plugin for managing comments in the editor
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $isTextNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  type TextNode,
} from 'lexical';
import {
  $createCommentNode,
  $getCommentNodesByThreadId,
  $unwrapCommentNode,
} from '../nodes/CommentNode';
import { useCommentStore } from '../stores/commentStore';
import type { CommentType, User } from '../types/comment';

/**
 * Command to create a comment on the current selection
 */
export const CREATE_COMMENT_COMMAND: LexicalCommand<{
  content: string;
  type?: CommentType;
}> = createCommand('CREATE_COMMENT_COMMAND');

/**
 * Command to delete a comment thread
 */
export const DELETE_COMMENT_COMMAND: LexicalCommand<{
  threadId: string;
}> = createCommand('DELETE_COMMENT_COMMAND');

/**
 * Command to resolve a comment thread
 */
export const RESOLVE_COMMENT_COMMAND: LexicalCommand<{
  threadId: string;
}> = createCommand('RESOLVE_COMMENT_COMMAND');

export interface CommentPluginProps {
  /** Default user for creating comments */
  defaultUser?: User;
  /** Callback when a comment is created */
  onCommentCreate?: (threadId: string) => void;
  /** Callback when a comment is resolved */
  onCommentResolve?: (threadId: string) => void;
}

/**
 * CommentPlugin - Manages comment creation and lifecycle
 */
export function CommentPlugin({
  defaultUser,
  onCommentCreate,
  onCommentResolve,
}: CommentPluginProps): null {
  const [editor] = useLexicalComposerContext();

  // Store actions
  const createThread = useCommentStore((state) => state.createThread);
  const deleteThread = useCommentStore((state) => state.deleteThread);
  const resolveThread = useCommentStore((state) => state.resolveThread);
  const setThreadNodeKey = useCommentStore((state) => state.setThreadNodeKey);
  const setCurrentUser = useCommentStore((state) => state.setCurrentUser);
  const currentUser = useCommentStore((state) => state.currentUser);

  // Set default user on mount
  useEffect(() => {
    if (defaultUser && !currentUser) {
      setCurrentUser(defaultUser);
    }
  }, [defaultUser, currentUser, setCurrentUser]);

  /**
   * Create a comment on the current selection
   */
  const handleCreateComment = useCallback(
    (content: string, type: CommentType = 'remark') => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          console.warn('[CommentPlugin] Cannot create comment: no range selection');
          return;
        }

        if (selection.isCollapsed()) {
          console.warn('[CommentPlugin] Cannot create comment: selection is collapsed');
          return;
        }

        // Get quoted text from selection
        const quotedText = selection.getTextContent();

        // Create thread in store
        const threadId = createThread(content, type, quotedText);
        if (!threadId) {
          console.warn('[CommentPlugin] Failed to create thread');
          return;
        }

        // Get selected nodes and wrap them in CommentNodes
        const nodes = selection.getNodes();
        let firstNodeKey: string | null = null;

        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            const textNode = node as TextNode;
            const textContent = textNode.getTextContent();

            // Check if this node is fully or partially selected
            const anchor = selection.anchor;
            const focus = selection.focus;
            const anchorNode = anchor.getNode();
            const focusNode = focus.getNode();

            let startOffset = 0;
            let endOffset = textContent.length;

            if (node.is(anchorNode)) {
              startOffset = anchor.offset;
            }
            if (node.is(focusNode)) {
              endOffset = focus.offset;
            }

            // Handle reversed selection
            if (startOffset > endOffset) {
              [startOffset, endOffset] = [endOffset, startOffset];
            }

            const selectedText = textContent.slice(startOffset, endOffset);

            if (selectedText.length > 0) {
              // Split node if needed
              if (startOffset > 0 || endOffset < textContent.length) {
                // Create nodes for before, selected, and after
                const beforeText = textContent.slice(0, startOffset);
                const afterText = textContent.slice(endOffset);

                const commentNode = $createCommentNode(selectedText, threadId, type);

                if (beforeText) {
                  const beforeNode = textNode.splitText(startOffset)[0];
                  if (beforeNode && afterText) {
                    const middleAndAfter = beforeNode.getNextSibling();
                    if (middleAndAfter && $isTextNode(middleAndAfter)) {
                      const [middle] = middleAndAfter.splitText(endOffset - startOffset);
                      if (middle) {
                        middle.replace(commentNode);
                      }
                    }
                  } else if (beforeNode) {
                    const nextSibling = beforeNode.getNextSibling();
                    if (nextSibling) {
                      nextSibling.replace(commentNode);
                    }
                  }
                } else if (afterText) {
                  const [selectedPart] = textNode.splitText(endOffset);
                  if (selectedPart) {
                    selectedPart.replace(commentNode);
                  }
                } else {
                  textNode.replace(commentNode);
                }

                if (firstNodeKey === null) {
                  firstNodeKey = commentNode.getKey();
                }
              } else {
                // Whole node is selected
                const commentNode = $createCommentNode(textContent, threadId, type);
                textNode.replace(commentNode);

                if (firstNodeKey === null) {
                  firstNodeKey = commentNode.getKey();
                }
              }
            }
          }
        });

        // Store the node key in the thread
        if (firstNodeKey !== null) {
          setThreadNodeKey(threadId, firstNodeKey);
        }

        console.log('[CommentPlugin] Created comment thread:', threadId);

        if (onCommentCreate) {
          onCommentCreate(threadId);
        }
      });
    },
    [editor, createThread, setThreadNodeKey, onCommentCreate]
  );

  /**
   * Delete a comment thread and unwrap the CommentNodes
   */
  const handleDeleteComment = useCallback(
    (threadId: string) => {
      editor.update(() => {
        const root = $getRoot();
        const commentNodes = $getCommentNodesByThreadId(root, threadId);

        // Unwrap all comment nodes back to regular text
        commentNodes.forEach((node) => {
          $unwrapCommentNode(node);
        });

        // Delete thread from store
        deleteThread(threadId);

        console.log('[CommentPlugin] Deleted comment thread:', threadId);
      });
    },
    [editor, deleteThread]
  );

  /**
   * Resolve a comment thread
   */
  const handleResolveComment = useCallback(
    (threadId: string) => {
      resolveThread(threadId);

      console.log('[CommentPlugin] Resolved comment thread:', threadId);

      if (onCommentResolve) {
        onCommentResolve(threadId);
      }
    },
    [resolveThread, onCommentResolve]
  );

  // Register commands
  useEffect(() => {
    return editor.registerCommand(
      CREATE_COMMENT_COMMAND,
      (payload) => {
        handleCreateComment(payload.content, payload.type);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, handleCreateComment]);

  useEffect(() => {
    return editor.registerCommand(
      DELETE_COMMENT_COMMAND,
      (payload) => {
        handleDeleteComment(payload.threadId);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, handleDeleteComment]);

  useEffect(() => {
    return editor.registerCommand(
      RESOLVE_COMMENT_COMMAND,
      (payload) => {
        handleResolveComment(payload.threadId);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, handleResolveComment]);

  // Add click handler for comment nodes to show thread
  useEffect(() => {
    const removeListener = editor.registerRootListener((rootElement) => {
      if (rootElement) {
        const handleClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          const commentElement = target.closest('[data-comment-thread-id]');

          if (commentElement) {
            const threadId = commentElement.getAttribute('data-comment-thread-id');
            if (threadId) {
              useCommentStore.getState().setActiveThread(threadId);
            }
          }
        };

        rootElement.addEventListener('click', handleClick);
        return () => {
          rootElement.removeEventListener('click', handleClick);
        };
      }
      return undefined;
    });

    return removeListener;
  }, [editor]);

  return null;
}

export default CommentPlugin;
