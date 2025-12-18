/**
 * QueryBuilder - Visual query builder component
 * Per Constitution Section 1 - General Features
 */
import { useState, useCallback, useMemo } from 'react';
import {
  Database,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Check,
  Save,
  Play,
  Copy,
} from 'lucide-react';
import {
  type Query,
  type QueryEntity,
  type QueryCondition,
  type QueryConditionGroup,
  type QuerySort,
  type ComparisonOperator,
  type LogicalOperator,
  type QueryFieldType,
  OPERATOR_LABELS,
  getOperatorsForFieldType,
  createCondition,
  createEmptyQuery,
  SAMPLE_ENTITIES,
} from '../../types/queryBuilder';

export interface QueryBuilderProps {
  /** Initial query */
  initialQuery?: Query;
  /** Available entities */
  entities?: QueryEntity[];
  /** Callback when query changes */
  onChange?: (query: Query) => void;
  /** Callback when save is requested */
  onSave?: (query: Query) => void;
  /** Callback when execute is requested */
  onExecute?: (query: Query) => void;
  /** Read-only mode */
  readOnly?: boolean;
}

/**
 * QueryBuilder - Visual query builder component
 */
export function QueryBuilder({
  initialQuery,
  entities = SAMPLE_ENTITIES,
  onChange,
  onSave,
  onExecute,
  readOnly = false,
}: QueryBuilderProps): JSX.Element {
  const [query, setQuery] = useState<Query>(
    initialQuery || createEmptyQuery(entities[0]?.id || '')
  );
  const [expandedSections, setExpandedSections] = useState({
    fields: true,
    filters: true,
    sort: true,
  });

  // Get selected entity
  const selectedEntity = useMemo(
    () => entities.find((e) => e.id === query.entity),
    [entities, query.entity]
  );

  /**
   * Update query and notify
   */
  const updateQuery = useCallback(
    (updates: Partial<Query>) => {
      setQuery((prev) => {
        const updated = { ...prev, ...updates, updatedAt: new Date() };
        onChange?.(updated);
        return updated;
      });
    },
    [onChange]
  );

  /**
   * Toggle section expansion
   */
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  /**
   * Handle entity change
   */
  const handleEntityChange = useCallback(
    (entityId: string) => {
      updateQuery({
        entity: entityId,
        selectedFields: [],
        conditions: { id: 'root', logicalOperator: 'AND', conditions: [] },
        sorts: [],
      });
    },
    [updateQuery]
  );

  /**
   * Toggle field selection
   */
  const toggleField = useCallback(
    (fieldId: string) => {
      updateQuery({
        selectedFields: query.selectedFields.includes(fieldId)
          ? query.selectedFields.filter((f) => f !== fieldId)
          : [...query.selectedFields, fieldId],
      });
    },
    [query.selectedFields, updateQuery]
  );

  /**
   * Add a condition to the root group
   */
  const addCondition = useCallback(() => {
    if (!selectedEntity?.fields.length) return;
    const firstField = selectedEntity.fields.find((f) => f.filterable);
    if (!firstField) return;

    const newCondition = createCondition(firstField.id);
    updateQuery({
      conditions: {
        ...query.conditions,
        conditions: [...query.conditions.conditions, newCondition],
      },
    });
  }, [selectedEntity, query.conditions, updateQuery]);

  /**
   * Remove a condition
   */
  const removeCondition = useCallback(
    (conditionId: string) => {
      const removeFromGroup = (
        group: QueryConditionGroup
      ): QueryConditionGroup => ({
        ...group,
        conditions: group.conditions
          .filter((c) => c.id !== conditionId)
          .map((c) =>
            'conditions' in c ? removeFromGroup(c as QueryConditionGroup) : c
          ),
      });

      updateQuery({ conditions: removeFromGroup(query.conditions) });
    },
    [query.conditions, updateQuery]
  );

  /**
   * Update a condition
   */
  const updateCondition = useCallback(
    (conditionId: string, updates: Partial<QueryCondition>) => {
      const updateInGroup = (
        group: QueryConditionGroup
      ): QueryConditionGroup => ({
        ...group,
        conditions: group.conditions.map((c) => {
          if (c.id === conditionId && !('conditions' in c)) {
            return { ...c, ...updates };
          }
          if ('conditions' in c) {
            return updateInGroup(c as QueryConditionGroup);
          }
          return c;
        }),
      });

      updateQuery({ conditions: updateInGroup(query.conditions) });
    },
    [query.conditions, updateQuery]
  );

  /**
   * Add a sort
   */
  const addSort = useCallback(() => {
    if (!selectedEntity?.fields.length) return;
    const availableFields = selectedEntity.fields.filter(
      (f) => f.sortable && !query.sorts.find((s) => s.fieldId === f.id)
    );
    if (!availableFields.length) return;

    updateQuery({
      sorts: [...query.sorts, { fieldId: availableFields[0].id, direction: 'asc' }],
    });
  }, [selectedEntity, query.sorts, updateQuery]);

  /**
   * Remove a sort
   */
  const removeSort = useCallback(
    (index: number) => {
      updateQuery({
        sorts: query.sorts.filter((_, i) => i !== index),
      });
    },
    [query.sorts, updateQuery]
  );

  /**
   * Update a sort
   */
  const updateSort = useCallback(
    (index: number, updates: Partial<QuerySort>) => {
      updateQuery({
        sorts: query.sorts.map((s, i) => (i === index ? { ...s, ...updates } : s)),
      });
    },
    [query.sorts, updateQuery]
  );

  /**
   * Generate SQL preview
   */
  const sqlPreview = useMemo(() => {
    if (!selectedEntity) return '';

    const fields =
      query.selectedFields.length > 0
        ? query.selectedFields.join(', ')
        : '*';

    let sql = `SELECT ${fields}\nFROM ${query.entity}`;

    // Add WHERE clause
    const conditions = query.conditions.conditions
      .filter((c) => !('conditions' in c) && (c as QueryCondition).value !== '')
      .map((c) => {
        const cond = c as QueryCondition;
        const field = selectedEntity.fields.find((f) => f.id === cond.fieldId);
        const op = cond.operator;
        let value = cond.value;

        if (field?.type === 'text' || field?.type === 'date') {
          value = `'${value}'`;
        }

        switch (op) {
          case 'equals':
            return `${cond.fieldId} = ${value}`;
          case 'not_equals':
            return `${cond.fieldId} != ${value}`;
          case 'contains':
            return `${cond.fieldId} LIKE '%${cond.value}%'`;
          case 'starts_with':
            return `${cond.fieldId} LIKE '${cond.value}%'`;
          case 'ends_with':
            return `${cond.fieldId} LIKE '%${cond.value}'`;
          case 'greater_than':
            return `${cond.fieldId} > ${value}`;
          case 'less_than':
            return `${cond.fieldId} < ${value}`;
          case 'is_null':
            return `${cond.fieldId} IS NULL`;
          case 'is_not_null':
            return `${cond.fieldId} IS NOT NULL`;
          default:
            return `${cond.fieldId} = ${value}`;
        }
      });

    if (conditions.length > 0) {
      sql += `\nWHERE ${conditions.join(`\n  ${query.conditions.logicalOperator} `)}`;
    }

    // Add ORDER BY clause
    if (query.sorts.length > 0) {
      const sorts = query.sorts
        .map((s) => `${s.fieldId} ${s.direction.toUpperCase()}`)
        .join(', ');
      sql += `\nORDER BY ${sorts}`;
    }

    // Add LIMIT
    if (query.limit) {
      sql += `\nLIMIT ${query.limit}`;
      if (query.offset) {
        sql += ` OFFSET ${query.offset}`;
      }
    }

    return sql;
  }, [selectedEntity, query]);

  return (
    <div className="query-builder bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Database className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">Constructeur de requêtes</h3>
        </div>
        <div className="flex items-center gap-2">
          {onExecute && (
            <button
              type="button"
              onClick={() => onExecute(query)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Play size={14} />
              Exécuter
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(query)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={14} />
              Enregistrer
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Entity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source de données
          </label>
          <select
            value={query.entity}
            onChange={(e) => handleEntityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={readOnly}
          >
            {entities.map((entity) => (
              <option key={entity.id} value={entity.id}>
                {entity.name} {entity.description && `- ${entity.description}`}
              </option>
            ))}
          </select>
        </div>

        {/* Field Selection */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('fields')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <Check size={16} />
              Champs sélectionnés ({query.selectedFields.length})
            </span>
            {expandedSections.fields ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
          {expandedSections.fields && selectedEntity && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedEntity.fields
                .filter((f) => f.selectable)
                .map((field) => (
                  <label
                    key={field.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={query.selectedFields.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={readOnly}
                    />
                    <span>{field.name}</span>
                  </label>
                ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('filters')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <Filter size={16} />
              Filtres ({query.conditions.conditions.length})
            </span>
            {expandedSections.filters ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
          {expandedSections.filters && (
            <div className="p-4 space-y-3">
              {/* Logical operator selector */}
              {query.conditions.conditions.length > 1 && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-600">Combiner avec:</span>
                  <select
                    value={query.conditions.logicalOperator}
                    onChange={(e) =>
                      updateQuery({
                        conditions: {
                          ...query.conditions,
                          logicalOperator: e.target.value as LogicalOperator,
                        },
                      })
                    }
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    disabled={readOnly}
                  >
                    <option value="AND">ET (AND)</option>
                    <option value="OR">OU (OR)</option>
                  </select>
                </div>
              )}

              {/* Conditions */}
              {query.conditions.conditions.map((condition) => {
                if ('conditions' in condition) return null; // Skip nested groups for now
                const cond = condition as QueryCondition;

                return (
                  <ConditionRow
                    key={cond.id}
                    condition={cond}
                    fields={selectedEntity?.fields.filter((f) => f.filterable) || []}
                    onChange={(updates) => updateCondition(cond.id, updates)}
                    onRemove={() => removeCondition(cond.id)}
                    readOnly={readOnly}
                  />
                );
              })}

              {!readOnly && (
                <button
                  type="button"
                  onClick={addCondition}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Ajouter un filtre
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sort')}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <ArrowUpDown size={16} />
              Tri ({query.sorts.length})
            </span>
            {expandedSections.sort ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>
          {expandedSections.sort && (
            <div className="p-4 space-y-3">
              {query.sorts.map((sort, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={sort.fieldId}
                    onChange={(e) => updateSort(index, { fieldId: e.target.value })}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                    disabled={readOnly}
                  >
                    {selectedEntity?.fields
                      .filter((f) => f.sortable)
                      .map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.name}
                        </option>
                      ))}
                  </select>
                  <select
                    value={sort.direction}
                    onChange={(e) =>
                      updateSort(index, { direction: e.target.value as 'asc' | 'desc' })
                    }
                    className="px-2 py-1.5 border border-gray-300 rounded text-sm"
                    disabled={readOnly}
                  >
                    <option value="asc">Croissant ↑</option>
                    <option value="desc">Décroissant ↓</option>
                  </select>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeSort(index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <button
                  type="button"
                  onClick={addSort}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Ajouter un tri
                </button>
              )}
            </div>
          )}
        </div>

        {/* SQL Preview */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Aperçu SQL</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(sqlPreview)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
              title="Copier"
            >
              <Copy size={12} />
              Copier
            </button>
          </div>
          <pre className="p-4 text-sm font-mono text-gray-700 bg-gray-900 text-green-400 overflow-x-auto">
            {sqlPreview || '-- Sélectionnez des champs et ajoutez des filtres'}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Condition Row Component
 */
interface ConditionRowProps {
  condition: QueryCondition;
  fields: { id: string; name: string; type: string; options?: { value: string; label: string }[] }[];
  onChange: (updates: Partial<QueryCondition>) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

function ConditionRow({
  condition,
  fields,
  onChange,
  onRemove,
  readOnly = false,
}: ConditionRowProps): JSX.Element {
  const field = fields.find((f) => f.id === condition.fieldId);
  const availableOperators: ComparisonOperator[] = field
    ? getOperatorsForFieldType(field.type as QueryFieldType)
    : ['equals'];

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      {/* Field selector */}
      <select
        value={condition.fieldId}
        onChange={(e) => onChange({ fieldId: e.target.value })}
        className="px-2 py-1.5 border border-gray-300 rounded text-sm min-w-[120px]"
        disabled={readOnly}
      >
        {fields.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={condition.operator}
        onChange={(e) => onChange({ operator: e.target.value as ComparisonOperator })}
        className="px-2 py-1.5 border border-gray-300 rounded text-sm"
        disabled={readOnly}
      >
        {availableOperators.map((op) => (
          <option key={op} value={op}>
            {OPERATOR_LABELS[op]}
          </option>
        ))}
      </select>

      {/* Value input */}
      {condition.operator !== 'is_null' && condition.operator !== 'is_not_null' && (
        <>
          {field?.type === 'boolean' ? (
            <select
              value={String(condition.value)}
              onChange={(e) => onChange({ value: e.target.value === 'true' })}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm"
              disabled={readOnly}
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>
          ) : field?.type === 'select' && field.options ? (
            <select
              value={String(condition.value)}
              onChange={(e) => onChange({ value: e.target.value })}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm flex-1"
              disabled={readOnly}
            >
              <option value="">-- Sélectionner --</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field?.type === 'number' ? 'number' : field?.type === 'date' ? 'date' : 'text'}
              value={String(condition.value || '')}
              onChange={(e) => onChange({ value: e.target.value })}
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
              placeholder="Valeur..."
              disabled={readOnly}
            />
          )}
        </>
      )}

      {/* Remove button */}
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
          title="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

export default QueryBuilder;
