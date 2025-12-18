/**
 * CursorPlugin - Track and broadcast cursor positions via Yjs awareness
 * Per Constitution Section 7 - Collaboration
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import type { RangeSelection } from 'lexical';
import type { Awareness } from 'y-protocols/awareness';
import type { CollaborationCursorPosition, CollaborationUser } from '../types/collaboration';

/**
 * Cursor state broadcasted via awareness
 */
export interface CursorState {
  user: CollaborationUser;
  cursor: CollaborationCursorPosition | null;
  selection: {
    anchorKey: string;
    anchorOffset: number;
    focusKey: string;
    focusOffset: number;
  } | null;
  /** Relative position data for rendering */
  relativePosition: {
    anchorRect: DOMRect | null;
    focusRect: DOMRect | null;
  } | null;
  lastActive: number;
}

/**
 * Remote cursor data for rendering
 */
export interface RemoteCursor {
  clientId: number;
  user: CollaborationUser;
  cursor: CollaborationCursorPosition | null;
  selection: CursorState['selection'];
  position: {
    x: number;
    y: number;
    height: number;
  } | null;
  selectionRects: DOMRect[];
  isActive: boolean;
  lastActive: number;
}

export interface CursorPluginProps {
  /** Yjs awareness instance */
  awareness: Awareness | null;
  /** Current user info */
  currentUser: CollaborationUser;
  /** Callback when remote cursors change */
  onCursorsChange?: ((cursors: RemoteCursor[]) => void) | undefined;
  /** Whether cursor tracking is enabled */
  enabled?: boolean | undefined;
  /** Debounce delay for cursor updates (ms) */
  debounceMs?: number | undefined;
  /** Time before marking user as inactive (ms) */
  inactiveTimeout?: number | undefined;
}

/**
 * Get selection position data from Lexical selection
 */
function getSelectionPosition(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  selection: RangeSelection
): { anchorRect: DOMRect | null; focusRect: DOMRect | null } {
  const anchorNode = selection.anchor.getNode();
  const focusNode = selection.focus.getNode();

  const anchorElement = editor.getElementByKey(anchorNode.getKey());
  const focusElement = editor.getElementByKey(focusNode.getKey());

  let anchorRect: DOMRect | null = null;
  let focusRect: DOMRect | null = null;

  if (anchorElement) {
    const range = document.createRange();
    const textNode = anchorElement.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const offset = Math.min(selection.anchor.offset, textNode.textContent?.length || 0);
      range.setStart(textNode, offset);
      range.setEnd(textNode, offset);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        anchorRect = rects[0];
      }
    } else {
      anchorRect = anchorElement.getBoundingClientRect();
    }
  }

  if (focusElement) {
    const range = document.createRange();
    const textNode = focusElement.firstChild;
    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
      const offset = Math.min(selection.focus.offset, textNode.textContent?.length || 0);
      range.setStart(textNode, offset);
      range.setEnd(textNode, offset);
      const rects = range.getClientRects();
      if (rects.length > 0) {
        focusRect = rects[0];
      }
    } else {
      focusRect = focusElement.getBoundingClientRect();
    }
  }

  return { anchorRect, focusRect };
}

/**
 * Get selection highlight rectangles
 */
function getSelectionRects(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  selection: CursorState['selection']
): DOMRect[] {
  if (!selection) return [];

  const rects: DOMRect[] = [];

  try {
    const anchorElement = editor.getElementByKey(selection.anchorKey);
    const focusElement = editor.getElementByKey(selection.focusKey);

    if (!anchorElement || !focusElement) return rects;

    const range = document.createRange();

    // Set range start
    const anchorTextNode = anchorElement.firstChild;
    if (anchorTextNode && anchorTextNode.nodeType === Node.TEXT_NODE) {
      const offset = Math.min(selection.anchorOffset, anchorTextNode.textContent?.length || 0);
      range.setStart(anchorTextNode, offset);
    } else {
      range.setStart(anchorElement, 0);
    }

    // Set range end
    const focusTextNode = focusElement.firstChild;
    if (focusTextNode && focusTextNode.nodeType === Node.TEXT_NODE) {
      const offset = Math.min(selection.focusOffset, focusTextNode.textContent?.length || 0);
      range.setEnd(focusTextNode, offset);
    } else {
      range.setEnd(focusElement, 0);
    }

    const clientRects = range.getClientRects();
    for (let i = 0; i < clientRects.length; i++) {
      rects.push(clientRects[i]);
    }
  } catch (e) {
    // Ignore errors from invalid ranges
  }

  return rects;
}

/**
 * CursorPlugin - Tracks local cursor and broadcasts via awareness
 */
export function CursorPlugin({
  awareness,
  currentUser,
  onCursorsChange,
  enabled = true,
  debounceMs = 50,
  inactiveTimeout = 30000,
}: CursorPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  /**
   * Broadcast local cursor position
   */
  const broadcastCursor = useCallback(() => {
    if (!awareness || !enabled) return;

    editor.getEditorState().read(() => {
      const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        const { anchorRect, focusRect } = getSelectionPosition(editor, selection);

        const cursorState: CursorState = {
          user: currentUser,
          cursor: {
            anchor: {
              key: selection.anchor.key,
              offset: selection.anchor.offset,
            },
            focus: {
              key: selection.focus.key,
              offset: selection.focus.offset,
            },
          },
          selection: {
            anchorKey: selection.anchor.key,
            anchorOffset: selection.anchor.offset,
            focusKey: selection.focus.key,
            focusOffset: selection.focus.offset,
          },
          relativePosition: {
            anchorRect,
            focusRect,
          },
          lastActive: Date.now(),
        };

        awareness.setLocalStateField('cursor', cursorState);
      } else {
        // No selection - clear cursor
        awareness.setLocalStateField('cursor', {
          user: currentUser,
          cursor: null,
          selection: null,
          relativePosition: null,
          lastActive: Date.now(),
        });
      }
    });
  }, [awareness, editor, currentUser, enabled]);

  /**
   * Debounced cursor broadcast
   */
  const debouncedBroadcast = useCallback(() => {
    const now = Date.now();

    // Immediate update if enough time has passed
    if (now - lastUpdateRef.current > debounceMs * 2) {
      lastUpdateRef.current = now;
      broadcastCursor();
      return;
    }

    // Otherwise debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      lastUpdateRef.current = Date.now();
      broadcastCursor();
    }, debounceMs);
  }, [broadcastCursor, debounceMs]);

  /**
   * Process remote cursor updates
   */
  const processRemoteCursors = useCallback(() => {
    if (!awareness || !onCursorsChange) return;

    const states = awareness.getStates();
    const localClientId = awareness.clientID;
    const now = Date.now();
    const remoteCursors: RemoteCursor[] = [];

    states.forEach((state, clientId) => {
      // Skip local user
      if (clientId === localClientId) return;

      const cursorState = state.cursor as CursorState | undefined;
      if (!cursorState?.user) return;

      // Calculate position from selection
      let position: RemoteCursor['position'] = null;
      let selectionRects: DOMRect[] = [];

      if (cursorState.selection) {
        // Get selection rectangles for highlighting
        selectionRects = getSelectionRects(editor, cursorState.selection);

        // Get cursor position (at focus point)
        const focusElement = editor.getElementByKey(cursorState.selection.focusKey);
        if (focusElement) {
          try {
            const range = document.createRange();
            const textNode = focusElement.firstChild;
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const offset = Math.min(
                cursorState.selection.focusOffset,
                textNode.textContent?.length || 0
              );
              range.setStart(textNode, offset);
              range.setEnd(textNode, offset);
              const rect = range.getBoundingClientRect();
              position = {
                x: rect.left,
                y: rect.top,
                height: rect.height || 20,
              };
            } else {
              const rect = focusElement.getBoundingClientRect();
              position = {
                x: rect.left,
                y: rect.top,
                height: rect.height || 20,
              };
            }
          } catch (e) {
            // Ignore range errors
          }
        }
      }

      const isActive = now - cursorState.lastActive < inactiveTimeout;

      remoteCursors.push({
        clientId,
        user: cursorState.user,
        cursor: cursorState.cursor,
        selection: cursorState.selection,
        position,
        selectionRects,
        isActive,
        lastActive: cursorState.lastActive,
      });
    });

    onCursorsChange(remoteCursors);
  }, [awareness, editor, onCursorsChange, inactiveTimeout]);

  /**
   * Register selection change listener
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        debouncedBroadcast();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, enabled, debouncedBroadcast]);

  /**
   * Listen to awareness updates
   */
  useEffect(() => {
    if (!awareness || !enabled) return;

    const handleAwarenessUpdate = () => {
      processRemoteCursors();
    };

    awareness.on('update', handleAwarenessUpdate);

    // Initial broadcast
    broadcastCursor();

    return () => {
      awareness.off('update', handleAwarenessUpdate);

      // Clear local cursor on unmount
      awareness.setLocalStateField('cursor', null);
    };
  }, [awareness, enabled, broadcastCursor, processRemoteCursors]);

  /**
   * Periodically refresh cursor positions (for scroll/resize)
   */
  useEffect(() => {
    if (!enabled || !onCursorsChange) return;

    const handleRefresh = () => {
      processRemoteCursors();
    };

    // Refresh on scroll
    const editorElement = editor.getRootElement();
    const scrollContainer = editorElement?.closest('.a4-scroll-container');

    scrollContainer?.addEventListener('scroll', handleRefresh);
    window.addEventListener('resize', handleRefresh);

    return () => {
      scrollContainer?.removeEventListener('scroll', handleRefresh);
      window.removeEventListener('resize', handleRefresh);
    };
  }, [editor, enabled, onCursorsChange, processRemoteCursors]);

  /**
   * Cleanup debounce timer
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return null;
}

export default CursorPlugin;
