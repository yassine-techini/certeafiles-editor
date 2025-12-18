/**
 * EditorToolbar - Main toolbar for the WYSIWYG editor
 * Per Constitution Section 3.1 - Simplified single-line design
 */
import { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import {
  $isListNode,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $isHeadingNode, $createHeadingNode } from '@lexical/rich-text';
import type { HeadingTagType } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import {
  Bold,
  Italic,
  Underline,
  Undo,
  Redo,
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  Minus,
  Plus,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Table,
  Image,
  Strikethrough,
  Subscript,
  Superscript,
  Quote,
  Code,
  ListOrdered,
  MoreHorizontal,
} from 'lucide-react';
import { OPEN_TABLE_DIALOG_COMMAND } from '../../plugins/TablePlugin';
import { INSERT_IMAGE_COMMAND } from '../../nodes/ImageNode';

export interface EditorToolbarProps {
  /** Additional class name */
  className?: string;
  /** Callback to open header/footer editor */
  onEditHeaderFooter?: (() => void) | undefined;
  /** Callback to toggle revision panel */
  onToggleRevisionPanel?: (() => void) | undefined;
  /** Whether revision panel is open */
  isRevisionPanelOpen?: boolean | undefined;
  /** Callback to toggle comment panel */
  onToggleCommentPanel?: (() => void) | undefined;
  /** Whether comment panel is open */
  isCommentPanelOpen?: boolean | undefined;
}

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number';

// Button component for toolbar items
function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        p-2 rounded-lg transition-all duration-150
        ${active ? 'bg-blue-100 text-blue-600 shadow-sm' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Paragraphe',
  h1: 'Titre 1',
  h2: 'Titre 2',
  h3: 'Titre 3',
  bullet: 'Liste à puces',
  number: 'Liste numérotée',
};

// Font families
const FONT_FAMILIES = [
  { value: 'Times New Roman', label: 'Time New ...' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Courier New', label: 'Courier New' },
];

// Font sizes
const FONT_SIZES = [
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
  { value: '28px', label: '28' },
  { value: '32px', label: '32' },
];

// Text colors for the color picker
const TEXT_COLORS = [
  '#000000', '#374151', '#DC2626', '#EA580C', '#CA8A04',
  '#16A34A', '#2563EB', '#7C3AED', '#DB2777', '#64748B',
];

// Highlight colors for the highlighter
const HIGHLIGHT_COLORS = [
  '#FEF08A', '#FED7AA', '#FECACA', '#D9F99D', '#A5F3FC',
  '#DDD6FE', '#FBCFE8', '#E5E7EB', '#FFFFFF', 'transparent',
];

/**
 * EditorToolbar - Single-line toolbar per design specs
 */
export function EditorToolbar({
  className = '',
}: EditorToolbarProps): JSX.Element {
  const [editor] = useLexicalComposerContext();

  // Text format states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // Block type state
  const [blockType, setBlockType] = useState<BlockType>('paragraph');

  // Alignment state
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Undo/Redo states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Dropdown state
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showFontSizeDropdown, setShowFontSizeDropdown] = useState(false);
  const [showTextColorDropdown, setShowTextColorDropdown] = useState(false);
  const [showHighlightDropdown, setShowHighlightDropdown] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  // Font state
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [fontSize, setFontSize] = useState('16px');
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');

  // Update toolbar state based on selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // Get anchor node for block type detection
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update block type
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type === 'bullet' ? 'bullet' : 'number');
        } else {
          const type = $isHeadingNode(element) ? element.getTag() : 'paragraph';
          setBlockType(type as BlockType);
        }
      }

      // Update alignment from element style
      const elementStyle = elementDOM?.style;
      if (elementStyle) {
        const textAlign = elementStyle.textAlign as 'left' | 'center' | 'right' | 'justify';
        setAlignment(textAlign || 'left');
      }
    }
  }, [editor]);

  // Register selection change listener
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, updateToolbar]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const anyDropdownOpen = showBlockDropdown || showFontDropdown || showFontSizeDropdown || showTextColorDropdown || showHighlightDropdown || showAlignDropdown || showMoreDropdown;
    if (!anyDropdownOpen) return;

    const handleClickOutside = () => {
      setShowBlockDropdown(false);
      setShowFontDropdown(false);
      setShowFontSizeDropdown(false);
      setShowTextColorDropdown(false);
      setShowHighlightDropdown(false);
      setShowAlignDropdown(false);
      setShowMoreDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showBlockDropdown, showFontDropdown, showFontSizeDropdown, showTextColorDropdown, showHighlightDropdown, showAlignDropdown, showMoreDropdown]);

  // Format text command handlers
  const formatBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }, [editor]);

  const formatItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  }, [editor]);

  const formatUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  }, [editor]);

  // Font family handler
  const handleFontFamilyChange = useCallback(
    (font: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            const element = editor.getElementByKey(node.getKey());
            if (element) {
              (element as HTMLElement).style.fontFamily = font;
            }
          });
        }
      });
      setFontFamily(font);
      setShowFontDropdown(false);
    },
    [editor]
  );

  // Font size handler
  const handleFontSizeChange = useCallback(
    (size: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            const element = editor.getElementByKey(node.getKey());
            if (element) {
              (element as HTMLElement).style.fontSize = size;
            }
          });
        }
      });
      setFontSize(size);
      setShowFontSizeDropdown(false);
    },
    [editor]
  );

  // Increment/decrement font size
  const adjustFontSize = useCallback(
    (delta: number) => {
      const currentSize = parseInt(fontSize);
      const newSize = Math.max(8, Math.min(72, currentSize + delta));
      handleFontSizeChange(`${newSize}px`);
    },
    [fontSize, handleFontSizeChange]
  );

  // Text color handler
  const handleTextColorChange = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            const element = editor.getElementByKey(node.getKey());
            if (element) {
              (element as HTMLElement).style.color = color;
            }
          });
        }
      });
      setTextColor(color);
      setShowTextColorDropdown(false);
    },
    [editor]
  );

  // Highlight color handler
  const handleHighlightChange = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            const element = editor.getElementByKey(node.getKey());
            if (element) {
              (element as HTMLElement).style.backgroundColor = color === 'transparent' ? '' : color;
            }
          });
        }
      });
      setHighlightColor(color);
      setShowHighlightDropdown(false);
    },
    [editor]
  );

  // Block type handlers
  const formatHeading = useCallback(
    (headingSize: HeadingTagType) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
      setShowBlockDropdown(false);
    },
    [editor]
  );

  const formatParagraph = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
    setShowBlockDropdown(false);
  }, [editor]);

  // List handlers
  const formatBulletList = useCallback(() => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  }, [editor, blockType]);

  // Alignment handlers
  const formatAlign = useCallback(
    (align: 'left' | 'center' | 'right' | 'justify') => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
      setShowAlignDropdown(false);
    },
    [editor]
  );

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  // Table insertion handler
  const handleInsertTable = useCallback(() => {
    editor.dispatchCommand(OPEN_TABLE_DIALOG_COMMAND, undefined);
  }, [editor]);

  // Image insertion handler
  const handleInsertImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src,
            altText: file.name,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  // Additional format handlers for "More" menu
  const formatStrikethrough = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
    setShowMoreDropdown(false);
  }, [editor]);

  const formatSubscript = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
    setShowMoreDropdown(false);
  }, [editor]);

  const formatSuperscript = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript');
    setShowMoreDropdown(false);
  }, [editor]);

  const formatCode = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
    setShowMoreDropdown(false);
  }, [editor]);

  // Get alignment icon
  const getAlignIcon = () => {
    switch (alignment) {
      case 'center': return <AlignCenter size={18} />;
      case 'right': return <AlignRight size={18} />;
      case 'justify': return <AlignJustify size={18} />;
      default: return <AlignLeft size={18} />;
    }
  };

  return (
    <div className={`editor-toolbar-wrapper ${className}`}>
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto">
        {/* Undo/Redo */}
        <ToolbarButton onClick={handleUndo} disabled={!canUndo} title="Annuler (Ctrl+Z)">
          <Undo size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={handleRedo} disabled={!canRedo} title="Rétablir (Ctrl+Y)">
          <Redo size={18} />
        </ToolbarButton>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Block Type Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBlockDropdown(!showBlockDropdown);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 min-w-[120px] justify-between transition-all duration-150"
            title="Style de texte"
          >
            <span className="truncate">{BLOCK_TYPE_LABELS[blockType]}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showBlockDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[160px] py-1.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={formatParagraph}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  blockType === 'paragraph' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Type size={16} />
                Paragraphe
              </button>
              <button
                type="button"
                onClick={() => formatHeading('h1')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  blockType === 'h1' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Heading1 size={16} />
                Titre 1
              </button>
              <button
                type="button"
                onClick={() => formatHeading('h2')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  blockType === 'h2' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Heading2 size={16} />
                Titre 2
              </button>
              <button
                type="button"
                onClick={() => formatHeading('h3')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  blockType === 'h3' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <Heading3 size={16} />
                Titre 3
              </button>
            </div>
          )}
        </div>

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFontDropdown(!showFontDropdown);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 min-w-[110px] justify-between transition-all duration-150"
            title="Police"
          >
            <span className="truncate">{FONT_FAMILIES.find(f => f.value === fontFamily)?.label || 'Time New ...'}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showFontDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 min-w-[160px] py-1.5 max-h-[300px] overflow-y-auto">
              {FONT_FAMILIES.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => handleFontFamilyChange(font.value)}
                  className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 ${
                    fontFamily === font.value ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size */}
        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
          <button
            type="button"
            onClick={() => adjustFontSize(-2)}
            className="p-1.5 hover:bg-slate-100 rounded-l-lg border-r border-slate-200 text-slate-600 transition-colors"
            title="Réduire la taille"
          >
            <Minus size={14} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowFontSizeDropdown(!showFontSizeDropdown);
              }}
              className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-slate-700 min-w-[50px] justify-center"
              title="Taille de police"
            >
              <span>{parseInt(fontSize)}px</span>
            </button>
            {showFontSizeDropdown && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 max-h-[200px] overflow-y-auto">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => handleFontSizeChange(size.value)}
                    className={`w-full px-4 py-1.5 text-sm hover:bg-gray-100 ${
                      fontSize === size.value ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => adjustFontSize(2)}
            className="p-1.5 hover:bg-slate-100 rounded-r-lg border-l border-slate-200 text-slate-600 transition-colors"
            title="Augmenter la taille"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-slate-200 mx-1" />

        {/* Text Formatting - B I U */}
        <ToolbarButton onClick={formatBold} active={isBold} title="Gras (Ctrl+B)">
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={formatItalic} active={isItalic} title="Italique (Ctrl+I)">
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={formatUnderline} active={isUnderline} title="Souligné (Ctrl+U)">
          <Underline size={18} />
        </ToolbarButton>

        {/* Text Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowTextColorDropdown(!showTextColorDropdown);
            }}
            className="flex flex-col items-center p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Couleur du texte"
          >
            <span className="text-base font-bold" style={{ color: textColor }}>T</span>
            <div
              className="w-4 h-1 rounded-sm -mt-0.5"
              style={{ backgroundColor: textColor }}
            />
          </button>
          {showTextColorDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
              <div className="grid grid-cols-5 gap-1">
                {TEXT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleTextColorChange(color)}
                    className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                      textColor === color ? 'border-blue-500' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowHighlightDropdown(!showHighlightDropdown);
            }}
            className="flex items-center gap-0.5 p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Surlignage"
          >
            <Highlighter size={18} />
            <ChevronDown size={12} />
          </button>
          {showHighlightDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
              <div className="grid grid-cols-5 gap-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleHighlightChange(color)}
                    className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${
                      highlightColor === color ? 'border-blue-500' : 'border-gray-200'
                    } ${color === 'transparent' ? 'bg-gray-100 relative' : ''}`}
                    style={{ backgroundColor: color !== 'transparent' ? color : undefined }}
                    title={color === 'transparent' ? 'Aucun' : color}
                  >
                    {color === 'transparent' && (
                      <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">✕</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alignment Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowAlignDropdown(!showAlignDropdown);
            }}
            className="flex items-center gap-0.5 p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Alignement"
          >
            {getAlignIcon()}
            <ChevronDown size={12} />
          </button>
          {showAlignDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
              <button
                type="button"
                onClick={() => formatAlign('left')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  alignment === 'left' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <AlignLeft size={16} />
                Gauche
              </button>
              <button
                type="button"
                onClick={() => formatAlign('center')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  alignment === 'center' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <AlignCenter size={16} />
                Centre
              </button>
              <button
                type="button"
                onClick={() => formatAlign('right')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  alignment === 'right' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <AlignRight size={16} />
                Droite
              </button>
              <button
                type="button"
                onClick={() => formatAlign('justify')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                  alignment === 'justify' ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <AlignJustify size={16} />
                Justifié
              </button>
            </div>
          )}
        </div>

        {/* List */}
        <ToolbarButton
          onClick={formatBulletList}
          active={blockType === 'bullet'}
          title="Liste à puces"
        >
          <List size={18} />
        </ToolbarButton>

        {/* Link */}
        <ToolbarButton
          onClick={() => {
            // Simple link insertion - could be enhanced
            const url = window.prompt('URL du lien:');
            if (url) {
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  // Insert link - simplified version
                  const nodes = selection.getNodes();
                  nodes.forEach((node) => {
                    const element = editor.getElementByKey(node.getKey());
                    if (element && element.parentElement) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.target = '_blank';
                      link.style.color = '#2563eb';
                      link.style.textDecoration = 'underline';
                      link.textContent = element.textContent || url;
                      element.replaceWith(link);
                    }
                  });
                }
              });
            }
          }}
          title="Insérer un lien"
        >
          <Link2 size={18} />
        </ToolbarButton>

        {/* Table */}
        <ToolbarButton onClick={handleInsertTable} title="Insérer un tableau">
          <Table size={18} />
        </ToolbarButton>

        {/* Image */}
        <ToolbarButton onClick={handleInsertImage} title="Insérer une image">
          <Image size={18} />
        </ToolbarButton>

        {/* More options dropdown */}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreDropdown(!showMoreDropdown);
            }}
            className="flex items-center gap-1 p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500"
            title="Plus d'options"
          >
            <MoreHorizontal size={18} />
            <ChevronDown size={12} />
          </button>

          {showMoreDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]">
              <div className="px-2 py-1 text-xs text-gray-400 uppercase tracking-wide">Formatage</div>
              <button
                type="button"
                onClick={formatStrikethrough}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Strikethrough size={16} />
                Barré
              </button>
              <button
                type="button"
                onClick={formatSubscript}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Subscript size={16} />
                Indice
              </button>
              <button
                type="button"
                onClick={formatSuperscript}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Superscript size={16} />
                Exposant
              </button>
              <button
                type="button"
                onClick={formatCode}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Code size={16} />
                Code
              </button>

              <div className="border-t border-gray-200 my-1" />
              <div className="px-2 py-1 text-xs text-gray-400 uppercase tracking-wide">Blocs</div>
              <button
                type="button"
                onClick={() => {
                  // Insert quote block
                  editor.update(() => {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                      const paragraph = $createParagraphNode();
                      const element = editor.getElementByKey(paragraph.getKey());
                      if (element) {
                        (element as HTMLElement).style.borderLeft = '4px solid #e5e7eb';
                        (element as HTMLElement).style.paddingLeft = '16px';
                        (element as HTMLElement).style.fontStyle = 'italic';
                      }
                    }
                  });
                  setShowMoreDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <Quote size={16} />
                Citation
              </button>
              <button
                type="button"
                onClick={() => {
                  // Toggle numbered list
                  if (blockType !== 'number') {
                    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                  } else {
                    editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
                  }
                  setShowMoreDropdown(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
              >
                <ListOrdered size={16} />
                Liste numérotée
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditorToolbar;
