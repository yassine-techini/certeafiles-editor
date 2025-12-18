/**
 * SpecialTablePlugin - Plugin for inserting and managing special business tables
 * Per Constitution Section 3 - Special Tables
 */
import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { $insertNodeToNearestRoot } from '@lexical/utils';
import { DecoratorNode } from 'lexical';
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { Package, History, CheckCircle, X } from 'lucide-react';

import { ProductsTable } from '../components/Editor/SpecialTables/ProductsTable';
import { HistoryTable } from '../components/Editor/SpecialTables/HistoryTable';
import { ValidationTable } from '../components/Editor/SpecialTables/ValidationTable';
import {
  type SpecialTableType,
  type SpecialTableData,
  SPECIAL_TABLE_LABELS,
  createDefaultSpecialTable,
} from '../types/specialTables';

/**
 * Command to insert a special table
 */
export const INSERT_SPECIAL_TABLE_COMMAND: LexicalCommand<{
  tableType: SpecialTableType;
  data?: SpecialTableData;
}> = createCommand('INSERT_SPECIAL_TABLE_COMMAND');

/**
 * Command to open special table selector
 */
export const OPEN_SPECIAL_TABLE_SELECTOR_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_SPECIAL_TABLE_SELECTOR_COMMAND'
);

/**
 * Serialized SpecialTableNode
 */
export type SerializedSpecialTableNode = Spread<
  {
    tableType: SpecialTableType;
    tableData: SpecialTableData;
  },
  SerializedLexicalNode
>;

/**
 * SpecialTableNode - Decorator node for special business tables
 */
export class SpecialTableNode extends DecoratorNode<JSX.Element> {
  __tableType: SpecialTableType;
  __tableData: SpecialTableData;

  static override getType(): string {
    return 'special-table';
  }

  static override clone(node: SpecialTableNode): SpecialTableNode {
    return new SpecialTableNode(node.__tableType, node.__tableData, node.__key);
  }

  static override importJSON(serializedNode: SerializedSpecialTableNode): SpecialTableNode {
    return $createSpecialTableNode(serializedNode.tableType, serializedNode.tableData);
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-special-table-type')) {
          return {
            conversion: () => {
              const tableType = domNode.getAttribute('data-special-table-type') as SpecialTableType;
              const dataStr = domNode.getAttribute('data-special-table-data');
              let data: SpecialTableData | undefined;
              if (dataStr) {
                try {
                  data = JSON.parse(dataStr);
                } catch {
                  // Use default
                }
              }
              return { node: $createSpecialTableNode(tableType, data) };
            },
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(tableType: SpecialTableType, tableData?: SpecialTableData, key?: NodeKey) {
    super(key);
    this.__tableType = tableType;
    this.__tableData = tableData || createDefaultSpecialTable(tableType);
  }

  override exportJSON(): SerializedSpecialTableNode {
    return {
      type: 'special-table',
      version: 1,
      tableType: this.__tableType,
      tableData: this.__tableData,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-special-table-type', this.__tableType);
    element.setAttribute('data-special-table-data', JSON.stringify(this.__tableData));
    element.className = 'special-table-container';
    return { element };
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    element.className = 'special-table-wrapper';
    element.setAttribute('data-special-table-type', this.__tableType);
    return element;
  }

  override updateDOM(): boolean {
    return false;
  }

  getTableType(): SpecialTableType {
    return this.__tableType;
  }

  getTableData(): SpecialTableData {
    return this.__tableData;
  }

  setTableData(data: SpecialTableData): void {
    const writable = this.getWritable();
    writable.__tableData = data;
  }

  override decorate(): JSX.Element {
    return (
      <SpecialTableComponent
        nodeKey={this.__key}
        tableType={this.__tableType}
        tableData={this.__tableData}
      />
    );
  }
}

/**
 * Create a SpecialTableNode
 */
export function $createSpecialTableNode(
  tableType: SpecialTableType,
  data?: SpecialTableData
): SpecialTableNode {
  return new SpecialTableNode(tableType, data);
}

/**
 * Check if a node is a SpecialTableNode
 */
export function $isSpecialTableNode(
  node: LexicalNode | null | undefined
): node is SpecialTableNode {
  return node instanceof SpecialTableNode;
}

/**
 * Component for rendering special tables
 */
interface SpecialTableComponentProps {
  nodeKey: NodeKey;
  tableType: SpecialTableType;
  tableData: SpecialTableData;
}

function SpecialTableComponent({
  nodeKey,
  tableType,
  tableData,
}: SpecialTableComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback(
    (newData: SpecialTableData) => {
      editor.update(() => {
        const node = editor.getEditorState()._nodeMap.get(nodeKey);
        if ($isSpecialTableNode(node)) {
          node.setTableData(newData);
        }
      });
    },
    [editor, nodeKey]
  );

  const handleDelete = useCallback(() => {
    editor.update(() => {
      const node = editor.getEditorState()._nodeMap.get(nodeKey);
      if (node) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  return (
    <div className="special-table-container relative" style={{ margin: '16px 0' }}>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 rounded-full text-red-600 z-10"
        title="Supprimer le tableau"
        type="button"
      >
        <X size={16} />
      </button>

      {tableType === 'products_by_group' && tableData.type === 'products_by_group' && (
        <ProductsTable data={tableData} onChange={handleChange} editable={true} />
      )}

      {tableType === 'history' && tableData.type === 'history' && (
        <HistoryTable data={tableData} onChange={handleChange} editable={true} />
      )}

      {tableType === 'validation' && tableData.type === 'validation' && (
        <ValidationTable data={tableData} onChange={handleChange} editable={true} />
      )}
    </div>
  );
}

/**
 * Special Table Selector Dialog
 */
interface SpecialTableSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tableType: SpecialTableType) => void;
}

function SpecialTableSelector({
  isOpen,
  onClose,
  onSelect,
}: SpecialTableSelectorProps): JSX.Element | null {
  if (!isOpen) return null;

  const tableOptions: { type: SpecialTableType; icon: JSX.Element; description: string }[] = [
    {
      type: 'products_by_group',
      icon: <Package size={24} />,
      description: 'Liste des produits organisés par groupes',
    },
    {
      type: 'history',
      icon: <History size={24} />,
      description: 'Historique des versions du document',
    },
    {
      type: 'validation',
      icon: <CheckCircle size={24} />,
      description: 'Tableau de validation et signatures',
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insérer un tableau spécial</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {tableOptions.map((option) => (
            <button
              key={option.type}
              onClick={() => {
                onSelect(option.type);
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
              type="button"
            >
              <div className="text-blue-600">{option.icon}</div>
              <div>
                <div className="font-medium">{SPECIAL_TABLE_LABELS[option.type]}</div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

export interface SpecialTablePluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
}

/**
 * SpecialTablePlugin - Handles special table insertion and management
 */
export function SpecialTablePlugin({
  enabled = true,
}: SpecialTablePluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [selectorOpen, setSelectorOpen] = useState(false);

  /**
   * Insert a special table
   */
  const insertSpecialTable = useCallback(
    (tableType: SpecialTableType, data?: SpecialTableData) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const tableNode = $createSpecialTableNode(tableType, data);
          $insertNodeToNearestRoot(tableNode);
        }
      });
    },
    [editor]
  );

  /**
   * Handle table selection from dialog
   */
  const handleSelectTable = useCallback(
    (tableType: SpecialTableType) => {
      insertSpecialTable(tableType);
    },
    [insertSpecialTable]
  );

  /**
   * Register commands
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterInsert = editor.registerCommand(
      INSERT_SPECIAL_TABLE_COMMAND,
      (payload) => {
        insertSpecialTable(payload.tableType, payload.data);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterOpen = editor.registerCommand(
      OPEN_SPECIAL_TABLE_SELECTOR_COMMAND,
      () => {
        setSelectorOpen(true);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterInsert();
      unregisterOpen();
    };
  }, [editor, enabled, insertSpecialTable]);

  return (
    <SpecialTableSelector
      isOpen={selectorOpen}
      onClose={() => setSelectorOpen(false)}
      onSelect={handleSelectTable}
    />
  );
}

export default SpecialTablePlugin;
