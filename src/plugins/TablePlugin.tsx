/**
 * TablePlugin - Enhanced table functionality for Lexical editor
 * Per Constitution Section 3.2
 */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import {
  $createTableCellNode,
  $createTableNode,
  $createTableRowNode,
  $getTableCellNodeFromLexicalNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $insertTableColumn__EXPERIMENTAL,
  $insertTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  TableCellHeaderStates,
} from '@lexical/table';
import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import {
  Grid3X3,
  Plus,
  Minus,
  Trash2,
  PaintBucket,
  X,
} from 'lucide-react';

// Commands for table operations
export const INSERT_TABLE_COMMAND: LexicalCommand<{ rows: number; columns: number }> =
  createCommand('INSERT_TABLE_COMMAND');
export const OPEN_TABLE_DIALOG_COMMAND: LexicalCommand<void> =
  createCommand('OPEN_TABLE_DIALOG_COMMAND');

export interface TablePluginProps {
  /** Whether to show cell actions on selection */
  showCellActions?: boolean;
}

// Predefined background colors for cells
const CELL_COLORS = [
  { name: 'None', value: '' },
  { name: 'Light Gray', value: '#f3f4f6' },
  { name: 'Light Blue', value: '#dbeafe' },
  { name: 'Light Green', value: '#dcfce7' },
  { name: 'Light Yellow', value: '#fef9c3' },
  { name: 'Light Red', value: '#fee2e2' },
  { name: 'Light Purple', value: '#f3e8ff' },
];

/**
 * TableInsertDialog - Dialog for inserting a new table
 */
function TableInsertDialog({
  onInsert,
  onClose,
}: {
  onInsert: (rows: number, columns: number) => void;
  onClose: () => void;
}): JSX.Element {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const handleGridClick = useCallback(
    (row: number, col: number) => {
      onInsert(row + 1, col + 1);
    },
    [onInsert]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (rows > 0 && columns > 0) {
        onInsert(rows, columns);
      }
    },
    [rows, columns, onInsert]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl p-4 min-w-[300px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Grid3X3 size={20} />
            Insert Table
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick select grid */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Quick select:</p>
          <div className="inline-grid grid-cols-8 gap-1 p-2 bg-gray-50 rounded">
            {Array.from({ length: 8 }).map((_, rowIndex) =>
              Array.from({ length: 8 }).map((_, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  className={`w-5 h-5 border rounded transition-colors ${
                    hoveredCell &&
                    rowIndex <= hoveredCell.row &&
                    colIndex <= hoveredCell.col
                      ? 'bg-blue-500 border-blue-600'
                      : 'bg-white border-gray-300 hover:border-blue-400'
                  }`}
                  onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                  onMouseLeave={() => setHoveredCell(null)}
                  onClick={() => handleGridClick(rowIndex, colIndex)}
                  aria-label={`${rowIndex + 1} x ${colIndex + 1} table`}
                />
              ))
            )}
          </div>
          {hoveredCell && (
            <p className="text-xs text-gray-500 mt-1">
              {hoveredCell.row + 1} x {hoveredCell.col + 1}
            </p>
          )}
        </div>

        {/* Manual input */}
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Rows</label>
              <input
                type="number"
                min={1}
                max={50}
                value={rows}
                onChange={(e) => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Columns</label>
              <input
                type="number"
                min={1}
                max={20}
                value={columns}
                onChange={(e) => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded"
            >
              Insert Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * TableCellColorPicker - Color picker for cell backgrounds
 */
function TableCellColorPicker({
  onSelect,
  onClose,
  currentColor,
}: {
  onSelect: (color: string) => void;
  onClose: () => void;
  currentColor: string;
}): JSX.Element {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
      <p className="text-xs text-gray-500 mb-2">Cell Background</p>
      <div className="grid grid-cols-4 gap-1">
        {CELL_COLORS.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => {
              onSelect(color.value);
              onClose();
            }}
            className={`w-8 h-8 rounded border-2 transition-colors ${
              currentColor === color.value
                ? 'border-blue-500'
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color.value || '#ffffff' }}
            title={color.name}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * TablePlugin - Enhanced table functionality
 */
export function TablePlugin({
  showCellActions = true,
}: TablePluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [showDialog, setShowDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedCellColor, setSelectedCellColor] = useState('');
  const [tableMenuPosition, setTableMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isInTable, setIsInTable] = useState(false);

  // Insert a new table
  const insertTable = useCallback(
    (rows: number, columns: number) => {
      editor.update(() => {
        const tableNode = $createTableNode();

        for (let r = 0; r < rows; r++) {
          const rowNode = $createTableRowNode();

          for (let c = 0; c < columns; c++) {
            const cellNode = $createTableCellNode(
              r === 0 ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS
            );
            const paragraph = $createParagraphNode();
            cellNode.append(paragraph);
            rowNode.append(cellNode);
          }

          tableNode.append(rowNode);
        }

        $insertNodeToNearestRoot(tableNode);
      });
      setShowDialog(false);
    },
    [editor]
  );

  // Add row above/below
  const addRow = useCallback(
    (insertAfter: boolean) => {
      editor.update(() => {
        $insertTableRow__EXPERIMENTAL(insertAfter);
      });
    },
    [editor]
  );

  // Add column left/right
  const addColumn = useCallback(
    (insertAfter: boolean) => {
      editor.update(() => {
        $insertTableColumn__EXPERIMENTAL(insertAfter);
      });
    },
    [editor]
  );

  // Delete row
  const deleteRow = useCallback(() => {
    editor.update(() => {
      $deleteTableRow__EXPERIMENTAL();
    });
  }, [editor]);

  // Delete column
  const deleteColumn = useCallback(() => {
    editor.update(() => {
      $deleteTableColumn__EXPERIMENTAL();
    });
  }, [editor]);

  // Delete entire table
  const deleteTable = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
        if (tableNode) {
          tableNode.remove();
        }
      }
    });
  }, [editor]);

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
    },
    [editor]
  );

  // Track selection in table
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const cellNode = $getTableCellNodeFromLexicalNode(anchorNode);

          if (cellNode) {
            setIsInTable(true);
            setSelectedCellColor(cellNode.getBackgroundColor() || '');

            // Get position for floating menu
            if (showCellActions) {
              const cellElement = editor.getElementByKey(cellNode.getKey());
              if (cellElement) {
                const rect = cellElement.getBoundingClientRect();
                setTableMenuPosition({
                  top: rect.top - 40,
                  left: rect.left,
                });
              }
            }
          } else {
            setIsInTable(false);
            setTableMenuPosition(null);
          }
        } else {
          setIsInTable(false);
          setTableMenuPosition(null);
        }
      });
    });
  }, [editor, showCellActions]);

  // Register commands
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_TABLE_COMMAND,
        ({ rows, columns }) => {
          insertTable(rows, columns);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        OPEN_TABLE_DIALOG_COMMAND,
        () => {
          setShowDialog(true);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor, insertTable]);

  return (
    <>
      {/* Insert Table Dialog */}
      {showDialog &&
        createPortal(
          <TableInsertDialog
            onInsert={insertTable}
            onClose={() => setShowDialog(false)}
          />,
          document.body
        )}

      {/* Floating Table Actions Menu */}
      {showCellActions &&
        isInTable &&
        tableMenuPosition &&
        createPortal(
          <div
            className="fixed z-50 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
            style={{
              top: tableMenuPosition.top,
              left: tableMenuPosition.left,
            }}
          >
            {/* Add Row */}
            <button
              type="button"
              onClick={() => addRow(true)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
              title="Add row below"
            >
              <Plus size={16} />
              <span className="sr-only">Row</span>
            </button>

            {/* Delete Row */}
            <button
              type="button"
              onClick={deleteRow}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
              title="Delete row"
            >
              <Minus size={16} />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-0.5" />

            {/* Add Column */}
            <button
              type="button"
              onClick={() => addColumn(true)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
              title="Add column right"
            >
              <Plus size={16} className="rotate-90" />
            </button>

            {/* Delete Column */}
            <button
              type="button"
              onClick={deleteColumn}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-700"
              title="Delete column"
            >
              <Minus size={16} className="rotate-90" />
            </button>

            <div className="w-px h-5 bg-gray-300 mx-0.5" />

            {/* Cell Background Color */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-700 flex items-center"
                title="Cell background color"
              >
                <PaintBucket size={16} />
                {selectedCellColor && (
                  <span
                    className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full border border-white"
                    style={{ backgroundColor: selectedCellColor }}
                  />
                )}
              </button>
              {showColorPicker && (
                <TableCellColorPicker
                  onSelect={setCellBackgroundColor}
                  onClose={() => setShowColorPicker(false)}
                  currentColor={selectedCellColor}
                />
              )}
            </div>

            <div className="w-px h-5 bg-gray-300 mx-0.5" />

            {/* Delete Table */}
            <button
              type="button"
              onClick={deleteTable}
              className="p-1.5 hover:bg-red-100 rounded text-red-600"
              title="Delete table"
            >
              <Trash2 size={16} />
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

export default TablePlugin;
