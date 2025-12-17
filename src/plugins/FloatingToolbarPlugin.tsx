/**
 * FloatingToolbarPlugin - Plugin to manage floating toolbar on text selection
 * Per Constitution Section 3.2
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $getTableCellNodeFromLexicalNode } from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link,
  Code,
  Highlighter,
} from 'lucide-react';

export interface FloatingToolbarPluginProps {
  /** Whether to show in tables */
  showInTables?: boolean;
  /** Additional CSS class */
  className?: string;
}

interface ToolbarPosition {
  top: number;
  left: number;
}

interface FormatState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isCode: boolean;
  isHighlight: boolean;
  isLink: boolean;
}

const TOOLBAR_HEIGHT = 40;
const TOOLBAR_WIDTH = 280;
const VIEWPORT_PADDING = 10;

/**
 * Calculate toolbar position from selection, handling viewport edges
 */
function calculatePosition(
  selectionRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number
): ToolbarPosition {
  // Default position: centered above the selection
  let top = selectionRect.top - TOOLBAR_HEIGHT - 8 + window.scrollY;
  let left = selectionRect.left + selectionRect.width / 2 - TOOLBAR_WIDTH / 2 + window.scrollX;

  // Handle top edge - show below selection if not enough space above
  if (selectionRect.top - TOOLBAR_HEIGHT - 8 < VIEWPORT_PADDING) {
    top = selectionRect.bottom + 8 + window.scrollY;
  }

  // Handle bottom edge when toolbar is below selection
  if (selectionRect.bottom + TOOLBAR_HEIGHT + 8 > viewportHeight - VIEWPORT_PADDING) {
    top = selectionRect.top - TOOLBAR_HEIGHT - 8 + window.scrollY;
  }

  // Handle left edge
  if (left < VIEWPORT_PADDING + window.scrollX) {
    left = VIEWPORT_PADDING + window.scrollX;
  }

  // Handle right edge
  if (left + TOOLBAR_WIDTH > viewportWidth - VIEWPORT_PADDING + window.scrollX) {
    left = viewportWidth - TOOLBAR_WIDTH - VIEWPORT_PADDING + window.scrollX;
  }

  return { top, left };
}

/**
 * Get the bounding rect of the current selection
 */
function getSelectionRect(): DOMRect | null {
  const domSelection = window.getSelection();
  if (!domSelection || domSelection.rangeCount === 0) {
    return null;
  }

  const range = domSelection.getRangeAt(0);
  if (range.collapsed) {
    return null;
  }

  return range.getBoundingClientRect();
}

/**
 * FloatingToolbarPlugin - Manages floating toolbar display on selection
 */
export function FloatingToolbarPlugin({
  showInTables = true,
  className = '',
}: FloatingToolbarPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<ToolbarPosition | null>(null);
  const [formatState, setFormatState] = useState<FormatState>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isCode: false,
    isHighlight: false,
    isLink: false,
  });
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Update format state based on current selection
  const updateFormatState = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    // Check if selection contains a link
    const nodes = selection.getNodes();
    const isLink = nodes.some((node) => {
      const parent = node.getParent();
      return $isLinkNode(parent) || $isLinkNode(node);
    });

    setFormatState({
      isBold: selection.hasFormat('bold'),
      isItalic: selection.hasFormat('italic'),
      isUnderline: selection.hasFormat('underline'),
      isStrikethrough: selection.hasFormat('strikethrough'),
      isCode: selection.hasFormat('code'),
      isHighlight: selection.hasFormat('highlight'),
      isLink,
    });
  }, []);

  // Hide toolbar with animation
  const hideToolbar = useCallback(() => {
    if (!isVisible) return;

    setIsAnimatingOut(true);
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setIsAnimatingOut(false);
      setPosition(null);
    }, 150);
  }, [isVisible]);

  // Show toolbar
  const showToolbar = useCallback((rect: DOMRect) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    const newPosition = calculatePosition(
      rect,
      window.innerWidth,
      window.innerHeight
    );

    setPosition(newPosition);
    setIsAnimatingOut(false);
    setIsVisible(true);
  }, []);

  // Update toolbar position and visibility
  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      // Only show for range selections with actual content
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        hideToolbar();
        return;
      }

      // Check if inside table and handle accordingly
      if (!showInTables) {
        const anchorNode = selection.anchor.getNode();
        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        if (cellNode) {
          hideToolbar();
          return;
        }
      }

      const selectionText = selection.getTextContent();
      if (!selectionText.trim()) {
        hideToolbar();
        return;
      }

      // Get selection rect
      const selectionRect = getSelectionRect();
      if (!selectionRect) {
        hideToolbar();
        return;
      }

      // Ensure selection is within reasonable bounds (not selecting across entire document)
      if (selectionRect.height > 500) {
        hideToolbar();
        return;
      }

      showToolbar(selectionRect);
      updateFormatState();
    });
  }, [editor, showInTables, hideToolbar, showToolbar, updateFormatState]);

  // Register listeners
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      })
    );
  }, [editor, updateToolbar]);

  // Handle mouse events
  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(updateToolbar, 10);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Hide toolbar if clicking outside of it
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // Don't hide immediately - let the selection update first
        setTimeout(() => {
          const selection = window.getSelection();
          if (!selection || selection.isCollapsed) {
            hideToolbar();
          }
        }, 10);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Update on shift+arrow keys (selection)
      if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setTimeout(updateToolbar, 10);
      }
      // Hide on Escape
      if (e.key === 'Escape') {
        hideToolbar();
      }
    };

    const handleScroll = () => {
      // Recalculate position on scroll
      if (isVisible) {
        const selectionRect = getSelectionRect();
        if (selectionRect) {
          showToolbar(selectionRect);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [updateToolbar, hideToolbar, showToolbar, isVisible]);

  // Format handlers
  const handleFormat = useCallback(
    (format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'highlight') => {
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
      // Update format state after applying
      setTimeout(() => {
        editor.getEditorState().read(updateFormatState);
      }, 10);
    },
    [editor, updateFormatState]
  );

  const handleLink = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }

      // Check if already a link
      const nodes = selection.getNodes();
      const isLink = nodes.some((node) => {
        const parent = node.getParent();
        return $isLinkNode(parent) || $isLinkNode(node);
      });

      if (isLink) {
        // Remove link
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      } else {
        // Prompt for URL
        const url = prompt('Enter URL:');
        if (url) {
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }
      }

      // Update format state after applying
      setTimeout(() => {
        editor.getEditorState().read(updateFormatState);
      }, 10);
    });
  }, [editor, updateFormatState]);

  if (!isVisible || !position) {
    return null;
  }

  const toolbarClasses = `
    fixed z-[60] flex items-center gap-0.5
    bg-gray-900 text-white rounded-lg shadow-xl
    px-1 py-1
    transition-all duration-150 ease-out
    ${isAnimatingOut ? 'opacity-0 scale-95 translate-y-1' : 'opacity-100 scale-100 translate-y-0'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return createPortal(
    <div
      ref={toolbarRef}
      className={toolbarClasses}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="toolbar"
      aria-label="Text formatting"
      onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
    >
      {/* Bold */}
      <button
        type="button"
        onClick={() => handleFormat('bold')}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          formatState.isBold ? 'bg-gray-700 text-blue-400' : ''
        }`}
        title="Bold (Ctrl+B)"
        aria-pressed={formatState.isBold}
      >
        <Bold size={16} />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => handleFormat('italic')}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          formatState.isItalic ? 'bg-gray-700 text-blue-400' : ''
        }`}
        title="Italic (Ctrl+I)"
        aria-pressed={formatState.isItalic}
      >
        <Italic size={16} />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => handleFormat('underline')}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          formatState.isUnderline ? 'bg-gray-700 text-blue-400' : ''
        }`}
        title="Underline (Ctrl+U)"
        aria-pressed={formatState.isUnderline}
      >
        <Underline size={16} />
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onClick={() => handleFormat('strikethrough')}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          formatState.isStrikethrough ? 'bg-gray-700 text-blue-400' : ''
        }`}
        title="Strikethrough"
        aria-pressed={formatState.isStrikethrough}
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* Code */}
      <button
        type="button"
        onClick={() => handleFormat('code')}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          formatState.isCode ? 'bg-gray-700 text-blue-400' : ''
        }`}
        title="Inline Code"
        aria-pressed={formatState.isCode}
      >
        <Code size={16} />
      </button>

      {/* Highlight */}
      <button
        type="button"
        onClick={() => handleFormat('highlight')}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          formatState.isHighlight ? 'bg-gray-700 text-yellow-400' : ''
        }`}
        title="Highlight"
        aria-pressed={formatState.isHighlight}
      >
        <Highlighter size={16} />
      </button>

      <div className="w-px h-5 bg-gray-600 mx-1" />

      {/* Link */}
      <button
        type="button"
        onClick={handleLink}
        className={`p-2 rounded hover:bg-gray-700 transition-colors ${
          formatState.isLink ? 'bg-gray-700 text-blue-400' : ''
        }`}
        title={formatState.isLink ? 'Remove Link' : 'Add Link'}
        aria-pressed={formatState.isLink}
      >
        <Link size={16} />
      </button>
    </div>,
    document.body
  );
}

export default FloatingToolbarPlugin;
