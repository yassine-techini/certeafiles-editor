/**
 * EditorToolbar - Main toolbar for the WYSIWYG editor
 * Per Constitution Section 3.1
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
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
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
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Undo,
  Redo,
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Table,
  FileText,
  Braces,
  MessageSquare,
  GitBranch,
  Eye,
  EyeOff,
  PanelRight,
} from 'lucide-react';
import { INSERT_IMAGE_COMMAND } from '../../nodes/ImageNode';
import { OPEN_TABLE_DIALOG_COMMAND } from '../../plugins/TablePlugin';
import { INSERT_SLOT_COMMAND } from '../../plugins/SlotPlugin';
import { CREATE_COMMENT_COMMAND } from '../../plugins/CommentPlugin';
import { TOGGLE_TRACK_CHANGES_COMMAND } from '../../plugins/TrackChangesPlugin';
import { useRevisionStore } from '../../stores/revisionStore';
import type { SlotType } from '../../types/slot';
import { SLOT_TYPE_LABELS, SLOT_TYPE_ICONS } from '../../types/slot';

export interface EditorToolbarProps {
  /** Additional class name */
  className?: string;
  /** Callback to open header/footer editor */
  onEditHeaderFooter?: () => void;
  /** Callback to toggle revision panel */
  onToggleRevisionPanel?: () => void;
  /** Whether revision panel is open */
  isRevisionPanelOpen?: boolean | undefined;
}

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number';

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bullet: 'Bullet List',
  number: 'Numbered List',
};

/**
 * EditorToolbar - Comprehensive formatting toolbar
 */
export function EditorToolbar({
  className = '',
  onEditHeaderFooter,
  onToggleRevisionPanel,
  isRevisionPanelOpen = false,
}: EditorToolbarProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { trackingEnabled, showDeletions, setShowDeletions, getRevisionCount } = useRevisionStore();

  // Text format states
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  // Block type state
  const [blockType, setBlockType] = useState<BlockType>('paragraph');

  // Alignment state
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  // Undo/Redo states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Dropdown state
  const [showBlockDropdown, setShowBlockDropdown] = useState(false);
  const [showSlotDropdown, setShowSlotDropdown] = useState(false);

  // Update toolbar state based on selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));

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
    if (!showBlockDropdown && !showSlotDropdown) {
      return;
    }
    const handleClickOutside = () => {
      setShowBlockDropdown(false);
      setShowSlotDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showBlockDropdown, showSlotDropdown]);

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

  const formatStrikethrough = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  }, [editor]);

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
    setShowBlockDropdown(false);
  }, [editor, blockType]);

  const formatNumberedList = useCallback(() => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
    setShowBlockDropdown(false);
  }, [editor, blockType]);

  // Alignment handlers
  const formatAlign = useCallback(
    (align: 'left' | 'center' | 'right' | 'justify') => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
    },
    [editor]
  );

  // Indent handlers
  const handleIndent = useCallback(() => {
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  const handleOutdent = useCallback(() => {
    editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
  }, [editor]);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  // Image insertion handler
  const handleInsertImage = useCallback(() => {
    // Create a hidden file input and trigger it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      // For URL-based images, we'll use a prompt
      // The actual file upload is handled by the ImagePlugin
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          src,
          altText: file.name,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  // Table insertion handler
  const handleInsertTable = useCallback(() => {
    editor.dispatchCommand(OPEN_TABLE_DIALOG_COMMAND, undefined);
  }, [editor]);

  // Slot insertion handler
  const handleInsertSlot = useCallback(
    (type: SlotType) => {
      editor.dispatchCommand(INSERT_SLOT_COMMAND, {
        type,
        metadata: { label: SLOT_TYPE_LABELS[type] },
      });
      setShowSlotDropdown(false);
    },
    [editor]
  );

  // Comment insertion handler
  const handleInsertComment = useCallback(() => {
    // Prompt for comment content
    const content = window.prompt('Enter your comment:');
    if (content) {
      editor.dispatchCommand(CREATE_COMMENT_COMMAND, {
        content,
        type: 'remark',
      });
    }
  }, [editor]);

  // Track changes toggle handler
  const handleToggleTrackChanges = useCallback(() => {
    editor.dispatchCommand(TOGGLE_TRACK_CHANGES_COMMAND, undefined);
  }, [editor]);

  // Show/hide deletions toggle
  const handleToggleShowDeletions = useCallback(() => {
    setShowDeletions(!showDeletions);
  }, [showDeletions, setShowDeletions]);

  // Get pending revision count
  const revisionStats = getRevisionCount();

  // Button component for toolbar items
  const ToolbarButton = ({
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
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        p-1.5 rounded transition-colors
        ${active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      {children}
    </button>
  );

  // Divider component
  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  return (
    <div
      className={`editor-toolbar flex items-center gap-0.5 px-2 py-1 bg-white border-b border-gray-200 flex-wrap ${className}`}
    >
      {/* Undo/Redo */}
      <ToolbarButton onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <Redo size={18} />
      </ToolbarButton>

      <Divider />

      {/* Block Type Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowBlockDropdown(!showBlockDropdown);
          }}
          className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-100 rounded min-w-[100px] justify-between"
          title="Text style"
        >
          <span className="truncate">{BLOCK_TYPE_LABELS[blockType]}</span>
          <ChevronDown size={14} />
        </button>

        {showBlockDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[150px]">
            <button
              type="button"
              onClick={formatParagraph}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                blockType === 'paragraph' ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <Type size={16} />
              Normal
            </button>
            <button
              type="button"
              onClick={() => formatHeading('h1')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                blockType === 'h1' ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <Heading1 size={16} />
              Heading 1
            </button>
            <button
              type="button"
              onClick={() => formatHeading('h2')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                blockType === 'h2' ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <Heading2 size={16} />
              Heading 2
            </button>
            <button
              type="button"
              onClick={() => formatHeading('h3')}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                blockType === 'h3' ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <Heading3 size={16} />
              Heading 3
            </button>
            <div className="border-t border-gray-200" />
            <button
              type="button"
              onClick={formatBulletList}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                blockType === 'bullet' ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <List size={16} />
              Bullet List
            </button>
            <button
              type="button"
              onClick={formatNumberedList}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 ${
                blockType === 'number' ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <ListOrdered size={16} />
              Numbered List
            </button>
          </div>
        )}
      </div>

      <Divider />

      {/* Text Formatting */}
      <ToolbarButton onClick={formatBold} active={isBold} title="Bold (Ctrl+B)">
        <Bold size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={formatItalic} active={isItalic} title="Italic (Ctrl+I)">
        <Italic size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={formatUnderline} active={isUnderline} title="Underline (Ctrl+U)">
        <Underline size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={formatStrikethrough}
        active={isStrikethrough}
        title="Strikethrough"
      >
        <Strikethrough size={18} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={formatBulletList}
        active={blockType === 'bullet'}
        title="Bullet List"
      >
        <List size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={formatNumberedList}
        active={blockType === 'number'}
        title="Numbered List"
      >
        <ListOrdered size={18} />
      </ToolbarButton>

      <Divider />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => formatAlign('left')}
        active={alignment === 'left'}
        title="Align Left"
      >
        <AlignLeft size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlign('center')}
        active={alignment === 'center'}
        title="Align Center"
      >
        <AlignCenter size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlign('right')}
        active={alignment === 'right'}
        title="Align Right"
      >
        <AlignRight size={18} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatAlign('justify')}
        active={alignment === 'justify'}
        title="Justify"
      >
        <AlignJustify size={18} />
      </ToolbarButton>

      <Divider />

      {/* Indent/Outdent */}
      <ToolbarButton onClick={handleOutdent} title="Decrease Indent">
        <Outdent size={18} />
      </ToolbarButton>
      <ToolbarButton onClick={handleIndent} title="Increase Indent">
        <Indent size={18} />
      </ToolbarButton>

      <Divider />

      {/* Insert Image */}
      <ToolbarButton onClick={handleInsertImage} title="Insert Image">
        <ImageIcon size={18} />
      </ToolbarButton>

      {/* Insert Table */}
      <ToolbarButton onClick={handleInsertTable} title="Insert Table">
        <Table size={18} />
      </ToolbarButton>

      {/* Insert Slot Dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowSlotDropdown(!showSlotDropdown);
          }}
          className="flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-100 rounded"
          title="Insert Slot"
        >
          <Braces size={18} />
        </button>

        {showSlotDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
            {(['dynamic_content', 'at_fetcher', 'donnee', 'ancre', 'section_speciale', 'commentaire'] as SlotType[]).map(
              (type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleInsertSlot(type)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100"
                >
                  <span className="w-6 text-center font-mono text-xs">{SLOT_TYPE_ICONS[type]}</span>
                  {SLOT_TYPE_LABELS[type]}
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Insert Comment */}
      <ToolbarButton onClick={handleInsertComment} title="Add Comment">
        <MessageSquare size={18} />
      </ToolbarButton>

      <Divider />

      {/* Edit Header/Footer */}
      {onEditHeaderFooter && (
        <ToolbarButton onClick={onEditHeaderFooter} title="Edit Header/Footer">
          <FileText size={18} />
        </ToolbarButton>
      )}

      <Divider />

      {/* Track Changes Controls */}
      <div className="flex items-center gap-1">
        {/* Toggle Track Changes */}
        <button
          type="button"
          onClick={handleToggleTrackChanges}
          className={`
            flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors
            ${trackingEnabled
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'hover:bg-gray-100 text-gray-600'}
          `}
          title={trackingEnabled ? 'Disable Track Changes' : 'Enable Track Changes'}
        >
          <GitBranch size={16} />
          <span className="hidden sm:inline">Track</span>
        </button>

        {/* Show/Hide Deletions (Validated Mode) */}
        <ToolbarButton
          onClick={handleToggleShowDeletions}
          active={!showDeletions}
          title={showDeletions ? 'Hide deletions (Clean view)' : 'Show deletions'}
        >
          {showDeletions ? <Eye size={18} /> : <EyeOff size={18} />}
        </ToolbarButton>

        {/* Toggle Revision Panel */}
        {onToggleRevisionPanel && (
          <button
            type="button"
            onClick={onToggleRevisionPanel}
            className={`
              flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors relative
              ${isRevisionPanelOpen
                ? 'bg-blue-100 text-blue-700'
                : 'hover:bg-gray-100 text-gray-600'}
            `}
            title={isRevisionPanelOpen ? 'Hide Revision Panel' : 'Show Revision Panel'}
          >
            <PanelRight size={16} />
            {revisionStats.pending > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {revisionStats.pending > 9 ? '9+' : revisionStats.pending}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default EditorToolbar;
