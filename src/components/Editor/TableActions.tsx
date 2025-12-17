/**
 * TableActions - Floating menu for table operations
 * Per Constitution Section 3.1
 */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import {
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $unmergeCell,
} from '@lexical/table';
import {
  Minus,
  Trash2,
  PaintBucket,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Columns,
  Rows,
  Split,
} from 'lucide-react';

// Predefined background colors
const CELL_COLORS = [
  { name: 'None', value: '' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Gray', value: '#e5e7eb' },
  { name: 'Light Blue', value: '#dbeafe' },
  { name: 'Blue', value: '#bfdbfe' },
  { name: 'Light Green', value: '#dcfce7' },
  { name: 'Green', value: '#bbf7d0' },
  { name: 'Light Yellow', value: '#fef9c3' },
  { name: 'Yellow', value: '#fef08a' },
  { name: 'Light Orange', value: '#ffedd5' },
  { name: 'Orange', value: '#fed7aa' },
  { name: 'Light Red', value: '#fee2e2' },
  { name: 'Red', value: '#fecaca' },
  { name: 'Light Purple', value: '#f3e8ff' },
  { name: 'Purple', value: '#e9d5ff' },
  { name: 'Light Pink', value: '#fce7f3' },
];

export interface TableActionsProps {
  /** Position of the menu */
  position: { top: number; left: number } | null;
  /** Whether the menu is visible */
  isVisible: boolean;
  /** Close handler */
  onClose: () => void;
}

/**
 * TableActionsMenu - Comprehensive floating menu for table operations
 */
export function TableActionsMenu({
  position,
  isVisible,
  onClose,
}: TableActionsProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<'row' | 'column' | null>(null);
  const [selectedCellColor, setSelectedCellColor] = useState('');
  const [canUnmerge, setCanUnmerge] = useState(false);

  // Check if cells can be merged/unmerged
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          if (cellNode) {
            setSelectedCellColor(cellNode.getBackgroundColor() || '');
            // Check if cell spans multiple rows/columns
            const colSpan = cellNode.getColSpan();
            const rowSpan = cellNode.getRowSpan();
            setCanUnmerge(colSpan > 1 || rowSpan > 1);
          }
        }
      });
    });
  }, [editor]);

  // Row operations
  const insertRowAbove = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(false);
    });
    setActiveSubmenu(null);
  }, [editor]);

  const insertRowBelow = useCallback(() => {
    editor.update(() => {
      $insertTableRow__EXPERIMENTAL(true);
    });
    setActiveSubmenu(null);
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
    });
    setActiveSubmenu(null);
  }, [editor]);

  // Column operations
  const insertColumnLeft = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(false);
    });
    setActiveSubmenu(null);
  }, [editor]);

  const insertColumnRight = useCallback(() => {
    editor.update(() => {
      $insertTableColumn__EXPERIMENTAL(true);
    });
    setActiveSubmenu(null);
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
    });
    setActiveSubmenu(null);
  }, [editor]);

  // Delete entire table
  const deleteTable = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        try {
          const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
          tableNode.remove();
        } catch {
          // Not in a table
        }
      }
    });
    onClose();
  }, [editor, onClose]);

  // Set cell background color
  const setCellBackgroundColor = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          if (cellNode) {
            cellNode.setBackgroundColor(color);
          }
        }
      });
      setSelectedCellColor(color);
      setShowColorPicker(false);
    },
    [editor]
  );

  // Unmerge cell
  const handleUnmergeCell = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
        if (cellNode) {
          $unmergeCell();
        }
      }
    });
  }, [editor]);

  if (!isVisible || !position) {
    return null;
  }

  return createPortal(
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <div className="p-2 flex flex-col gap-1 min-w-[180px]">
        {/* Row Operations */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveSubmenu(activeSubmenu === 'row' ? null : 'row')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <span className="flex items-center gap-2">
              <Rows size={16} />
              Rows
            </span>
            <ChevronDown size={14} className={activeSubmenu === 'row' ? 'rotate-180' : ''} />
          </button>
          {activeSubmenu === 'row' && (
            <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[150px]">
              <button
                type="button"
                onClick={insertRowAbove}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <ArrowUp size={14} />
                Insert Above
              </button>
              <button
                type="button"
                onClick={insertRowBelow}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <ArrowDown size={14} />
                Insert Below
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                type="button"
                onClick={deleteRow}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                <Minus size={14} />
                Delete Row
              </button>
            </div>
          )}
        </div>

        {/* Column Operations */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveSubmenu(activeSubmenu === 'column' ? null : 'column')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <span className="flex items-center gap-2">
              <Columns size={16} />
              Columns
            </span>
            <ChevronDown size={14} className={activeSubmenu === 'column' ? 'rotate-180' : ''} />
          </button>
          {activeSubmenu === 'column' && (
            <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[150px]">
              <button
                type="button"
                onClick={insertColumnLeft}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <ArrowLeft size={14} />
                Insert Left
              </button>
              <button
                type="button"
                onClick={insertColumnRight}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <ArrowRight size={14} />
                Insert Right
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                type="button"
                onClick={deleteColumn}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                <Minus size={14} />
                Delete Column
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 my-1" />

        {/* Cell Background Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <span className="flex items-center gap-2">
              <PaintBucket size={16} />
              Cell Color
            </span>
            <span
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: selectedCellColor || '#ffffff' }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[200px]">
              <p className="text-xs text-gray-500 mb-2 px-1">Background Color</p>
              <div className="grid grid-cols-4 gap-1">
                {CELL_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setCellBackgroundColor(color.value)}
                    className={`w-8 h-8 rounded border-2 transition-colors ${
                      selectedCellColor === color.value
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: color.value || '#ffffff' }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Unmerge Cell (if applicable) */}
        {canUnmerge && (
          <button
            type="button"
            onClick={handleUnmergeCell}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
          >
            <Split size={16} />
            Unmerge Cell
          </button>
        )}

        <div className="border-t border-gray-200 my-1" />

        {/* Delete Table */}
        <button
          type="button"
          onClick={deleteTable}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
        >
          <Trash2 size={16} />
          Delete Table
        </button>
      </div>
    </div>,
    document.body
  );
}

/**
 * useTableActions - Hook to manage table action menu state
 */
export function useTableActions() {
  const [editor] = useLexicalComposerContext();
  const [isInTable, setIsInTable] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);
          setIsInTable(!!cellNode);
        } else {
          setIsInTable(false);
        }
      });
    });
  }, [editor]);

  const openMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setMenuPosition({ top: event.clientY, left: event.clientX });
    setShowMenu(true);
  }, []);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
    setMenuPosition(null);
  }, []);

  return {
    isInTable,
    showMenu,
    menuPosition,
    openMenu,
    closeMenu,
  };
}

export default TableActionsMenu;
