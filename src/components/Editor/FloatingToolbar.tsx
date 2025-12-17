/**
 * FloatingToolbar - Contextual toolbar that appears on text selection
 * Per Constitution Section 3.1
 */
import { useCallback, useEffect, useState } from 'react';
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

export interface FloatingToolbarProps {
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
  let top = selectionRect.top - TOOLBAR_HEIGHT - 8;
  let left = selectionRect.left + selectionRect.width / 2 - TOOLBAR_WIDTH / 2;

  // Handle top edge - show below selection if not enough space above
  if (top < VIEWPORT_PADDING) {
    top = selectionRect.bottom + 8;
  }

  // Handle bottom edge when toolbar is below selection
  if (top + TOOLBAR_HEIGHT > viewportHeight - VIEWPORT_PADDING) {
    top = viewportHeight - TOOLBAR_HEIGHT - VIEWPORT_PADDING;
  }

  // Handle left edge
  if (left < VIEWPORT_PADDING) {
    left = VIEWPORT_PADDING;
  }

  // Handle right edge
  if (left + TOOLBAR_WIDTH > viewportWidth - VIEWPORT_PADDING) {
    left = viewportWidth - TOOLBAR_WIDTH - VIEWPORT_PADDING;
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
 * FloatingToolbar - Appears on text selection with quick format options
 */
export function FloatingToolbar({
  className = '',
}: FloatingToolbarProps): JSX.Element | null {
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
  const [isAnimating, setIsAnimating] = useState(false);

  // Update format state based on current selection
  const updateFormatState = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      return;
    }

    setFormatState({
      isBold: selection.hasFormat('bold'),
      isItalic: selection.hasFormat('italic'),
      isUnderline: selection.hasFormat('underline'),
      isStrikethrough: selection.hasFormat('strikethrough'),
      isCode: selection.hasFormat('code'),
      isHighlight: selection.hasFormat('highlight'),
      isLink: false, // Will be updated below
    });

    // Check if selection contains a link
    const nodes = selection.getNodes();
    const isLink = nodes.some((node) => {
      const parent = node.getParent();
      return $isLinkNode(parent) || $isLinkNode(node);
    });
    setFormatState((prev) => ({ ...prev, isLink }));
  }, []);

  // Update toolbar position and visibility
  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();

      // Only show for range selections with actual content
      if (!$isRangeSelection(selection) || selection.isCollapsed()) {
        if (isVisible) {
          setIsAnimating(true);
          setTimeout(() => {
            setIsVisible(false);
            setIsAnimating(false);
          }, 150);
        }
        return;
      }

      const selectionText = selection.getTextContent();
      if (!selectionText.trim()) {
        if (isVisible) {
          setIsAnimating(true);
          setTimeout(() => {
            setIsVisible(false);
            setIsAnimating(false);
          }, 150);
        }
        return;
      }

      // Get selection rect
      const selectionRect = getSelectionRect();
      if (!selectionRect) {
        return;
      }

      // Calculate position with viewport edge handling
      const newPosition = calculatePosition(
        selectionRect,
        window.innerWidth,
        window.innerHeight
      );

      setPosition(newPosition);
      updateFormatState();

      if (!isVisible) {
        setIsVisible(true);
      }
    });
  }, [editor, isVisible, updateFormatState]);

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

  // Handle mouse up to catch selection completion
  useEffect(() => {
    const handleMouseUp = () => {
      // Small delay to ensure selection is complete
      setTimeout(updateToolbar, 10);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Update on shift+arrow keys (selection)
      if (e.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setTimeout(updateToolbar, 10);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateToolbar]);

  // Format handlers
  const handleBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }, [editor]);

  const handleItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  }, [editor]);

  const handleUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  }, [editor]);

  const handleStrikethrough = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  }, [editor]);

  const handleCode = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
  }, [editor]);

  const handleHighlight = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight');
  }, [editor]);

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
    });
  }, [editor]);

  if (!isVisible || !position) {
    return null;
  }

  const toolbarClasses = `
    fixed z-50 flex items-center gap-0.5
    bg-gray-900 text-white rounded-lg shadow-xl
    px-1 py-1
    transition-all duration-150 ease-out
    ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
    ${className}
  `.trim();

  return createPortal(
    <div
      className={toolbarClasses}
      style={{
        top: position.top,
        left: position.left,
      }}
      role="toolbar"
      aria-label="Text formatting"
    >
      {/* Bold */}
      <button
        type="button"
        onClick={handleBold}
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
        onClick={handleItalic}
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
        onClick={handleUnderline}
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
        onClick={handleStrikethrough}
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
        onClick={handleCode}
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
        onClick={handleHighlight}
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

export default FloatingToolbar;
