/**
 * QueryBuilderPlugin - Plugin for visual query building
 * Per Constitution Section 1 - General Features
 */
import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createTextNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { Database, X, Save, Play, Code, Trash2, Plus } from 'lucide-react';

import { QueryBuilder } from '../components/QueryBuilder/QueryBuilder';
import { useQueryBuilderStore } from '../stores/queryBuilderStore';
import type { Query, QueryEntity } from '../types/queryBuilder';

/**
 * Commands for query builder
 */
export const OPEN_QUERY_BUILDER_COMMAND: LexicalCommand<{ entityId?: string }> =
  createCommand('OPEN_QUERY_BUILDER_COMMAND');

export const INSERT_QUERY_COMMAND: LexicalCommand<{ query: Query }> =
  createCommand('INSERT_QUERY_COMMAND');

export const EXECUTE_QUERY_COMMAND: LexicalCommand<{ query: Query }> =
  createCommand('EXECUTE_QUERY_COMMAND');

export interface QueryBuilderPluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Available entities for querying */
  entities?: QueryEntity[];
  /** Callback when a query is executed */
  onQueryExecute?: (query: Query, sql: string) => void;
  /** Callback when query results should be inserted */
  onQueryInsert?: (query: Query, sql: string) => void;
}

/**
 * QueryBuilderPlugin - Provides visual query building functionality
 */
export function QueryBuilderPlugin({
  enabled = true,
  entities,
  onQueryExecute,
  onQueryInsert,
}: QueryBuilderPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {
    isOpen,
    openBuilder,
    closeBuilder,
    setEntities,
    currentQuery,
    savedQueries,
    generateSQL,
    createQuery,
    loadQuery,
    deleteQuery,
    saveQuery,
  } = useQueryBuilderStore();

  const [showSavedQueries, setShowSavedQueries] = useState(false);

  // Initialize entities if provided
  useEffect(() => {
    if (entities) {
      setEntities(entities);
    }
  }, [entities, setEntities]);

  /**
   * Handle query execution
   */
  const handleExecuteQuery = useCallback(() => {
    if (!currentQuery) return;

    const sql = generateSQL();
    console.log('[QueryBuilderPlugin] Execute query:', sql);

    if (onQueryExecute) {
      onQueryExecute(currentQuery, sql);
    }
  }, [currentQuery, generateSQL, onQueryExecute]);

  /**
   * Handle inserting SQL into editor
   */
  const handleInsertSQL = useCallback(() => {
    if (!currentQuery) return;

    const sql = generateSQL();

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Insert as code block or formatted text
        const textNode = $createTextNode(sql);
        selection.insertNodes([textNode]);
      }
    });

    if (onQueryInsert) {
      onQueryInsert(currentQuery, sql);
    }

    closeBuilder();
  }, [editor, currentQuery, generateSQL, closeBuilder, onQueryInsert]);

  /**
   * Register commands
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterOpen = editor.registerCommand(
      OPEN_QUERY_BUILDER_COMMAND,
      (payload) => {
        openBuilder(payload?.entityId);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterInsert = editor.registerCommand(
      INSERT_QUERY_COMMAND,
      (_payload) => {
        const sql = useQueryBuilderStore.getState().generateSQL();
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const textNode = $createTextNode(sql);
            selection.insertNodes([textNode]);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterExecute = editor.registerCommand(
      EXECUTE_QUERY_COMMAND,
      (payload) => {
        if (onQueryExecute) {
          const sql = useQueryBuilderStore.getState().generateSQL();
          onQueryExecute(payload.query, sql);
        }
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterOpen();
      unregisterInsert();
      unregisterExecute();
    };
  }, [editor, enabled, openBuilder, onQueryExecute]);

  if (!enabled) return null;

  return (
    <>
      {isOpen &&
        createPortal(
          <QueryBuilderModal
            onClose={closeBuilder}
            onExecute={handleExecuteQuery}
            onInsertSQL={handleInsertSQL}
            onSave={saveQuery}
            showSavedQueries={showSavedQueries}
            onToggleSavedQueries={() => setShowSavedQueries(!showSavedQueries)}
            savedQueries={savedQueries}
            onLoadQuery={(id) => {
              loadQuery(id);
              setShowSavedQueries(false);
            }}
            onDeleteQuery={deleteQuery}
            currentQuery={currentQuery}
            onCreateQuery={createQuery}
          />,
          document.body
        )}
    </>
  );
}

/**
 * Query Builder Modal Component
 */
interface QueryBuilderModalProps {
  onClose: () => void;
  onExecute: () => void;
  onInsertSQL: () => void;
  onSave: () => void;
  showSavedQueries: boolean;
  onToggleSavedQueries: () => void;
  savedQueries: Query[];
  onLoadQuery: (id: string) => void;
  onDeleteQuery: (id: string) => void;
  currentQuery: Query | null;
  onCreateQuery: (entityId: string) => void;
}

function QueryBuilderModal({
  onClose,
  onExecute,
  onInsertSQL,
  onSave,
  showSavedQueries,
  onToggleSavedQueries,
  savedQueries,
  onLoadQuery,
  onDeleteQuery,
  currentQuery,
  onCreateQuery,
}: QueryBuilderModalProps): JSX.Element {
  const { entities, generateSQL } = useQueryBuilderStore();

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-[1400px] h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Database className="text-blue-600" size={24} />
            Editeur de requetes
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSavedQueries}
              className={`
                inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                ${showSavedQueries
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Database size={16} />
              Requetes sauvegardees ({savedQueries.length})
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Saved Queries Sidebar */}
          {showSavedQueries && (
            <div className="w-72 border-r border-gray-200 flex flex-col bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">
                  Requetes sauvegardees
                </h3>
                <p className="text-xs text-gray-500">
                  Cliquez sur une requete pour la charger
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {savedQueries.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aucune requete sauvegardee
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedQueries.map((query) => (
                      <div
                        key={query.id}
                        className={`
                          p-3 rounded-lg cursor-pointer transition-colors
                          ${currentQuery?.id === query.id
                            ? 'bg-blue-100 border border-blue-200'
                            : 'bg-white border border-gray-200 hover:border-blue-200'
                          }
                        `}
                        onClick={() => onLoadQuery(query.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {query.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {entities.find((e) => e.id === query.entity)?.name || query.entity}
                            </p>
                            {query.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {query.description}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteQuery(query.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3 border-t border-gray-200">
                <NewQueryDropdown
                  entities={entities}
                  onSelect={onCreateQuery}
                />
              </div>
            </div>
          )}

          {/* Main Query Builder Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {currentQuery ? (
              <>
                <div className="flex-1 overflow-auto">
                  <QueryBuilder />
                </div>

                {/* SQL Preview */}
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="px-4 py-2 flex items-center justify-between border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Code size={16} />
                      Apercu SQL
                    </h4>
                  </div>
                  <div className="p-4 max-h-32 overflow-auto">
                    <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                      {generateSQL() || '-- Selectionnez des champs pour generer la requete'}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Database size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Creer une nouvelle requete
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Selectionnez une source de donnees pour commencer
                  </p>
                  <NewQueryDropdown
                    entities={entities}
                    onSelect={onCreateQuery}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="text-sm text-gray-500">
            {currentQuery && (
              <>
                {currentQuery.selectedFields.length} champ(s) selectionne(s)
                {currentQuery.conditions.conditions.length > 0 && (
                  <span> | {currentQuery.conditions.conditions.length} condition(s)</span>
                )}
                {currentQuery.sorts.length > 0 && (
                  <span> | {currentQuery.sorts.length} tri(s)</span>
                )}
              </>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onSave}
              disabled={!currentQuery}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={onInsertSQL}
              disabled={!currentQuery || currentQuery.selectedFields.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Code size={16} />
              Inserer SQL
            </button>
            <button
              type="button"
              onClick={onExecute}
              disabled={!currentQuery || currentQuery.selectedFields.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play size={16} />
              Executer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * New Query Dropdown Component
 */
interface NewQueryDropdownProps {
  entities: QueryEntity[];
  onSelect: (entityId: string) => void;
}

function NewQueryDropdown({ entities, onSelect }: NewQueryDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
      >
        <Plus size={16} />
        Nouvelle requete
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {entities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => {
                  onSelect(entity.id);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                {entity.description && (
                  <div className="text-xs text-gray-500">{entity.description}</div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Query Builder Toolbar Button
 */
export function QueryBuilderToolbarButton(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleClick = useCallback(() => {
    editor.dispatchCommand(OPEN_QUERY_BUILDER_COMMAND, {});
  }, [editor]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      title="Ouvrir l'editeur de requetes"
    >
      <Database size={16} />
      <span className="hidden sm:inline">Requetes</span>
    </button>
  );
}

export default QueryBuilderPlugin;
