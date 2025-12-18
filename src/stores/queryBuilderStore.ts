/**
 * Query Builder Store - State management for visual query builder
 * Per Constitution Section 1 - General Features
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Query,
  QueryEntity,
  QueryCondition,
  QueryConditionGroup,
  QuerySort,
} from '../types/queryBuilder';
import {
  createEmptyQuery,
  createCondition,
  createConditionGroup,
  SAMPLE_ENTITIES,
} from '../types/queryBuilder';

/**
 * Query Builder State
 */
export interface QueryBuilderState {
  /** Available entities for querying */
  entities: QueryEntity[];
  /** Saved queries */
  savedQueries: Query[];
  /** Currently editing query */
  currentQuery: Query | null;
  /** Whether the builder is open */
  isOpen: boolean;
  /** Selected query ID for editing */
  selectedQueryId: string | null;
}

/**
 * Query Builder Actions
 */
export interface QueryBuilderActions {
  /** Open the query builder */
  openBuilder: (entityId?: string) => void;
  /** Close the query builder */
  closeBuilder: () => void;
  /** Set entities */
  setEntities: (entities: QueryEntity[]) => void;
  /** Create a new query */
  createQuery: (entityId: string) => void;
  /** Save the current query */
  saveQuery: () => void;
  /** Load a saved query */
  loadQuery: (queryId: string) => void;
  /** Delete a saved query */
  deleteQuery: (queryId: string) => void;
  /** Update current query name */
  updateQueryName: (name: string) => void;
  /** Update current query description */
  updateQueryDescription: (description: string) => void;
  /** Change source entity */
  changeEntity: (entityId: string) => void;
  /** Toggle field selection */
  toggleField: (fieldId: string) => void;
  /** Select all fields */
  selectAllFields: () => void;
  /** Deselect all fields */
  deselectAllFields: () => void;
  /** Add a condition */
  addCondition: (groupId: string, fieldId: string) => void;
  /** Update a condition */
  updateCondition: (conditionId: string, updates: Partial<QueryCondition>) => void;
  /** Remove a condition */
  removeCondition: (conditionId: string) => void;
  /** Add a condition group */
  addConditionGroup: (parentGroupId: string) => void;
  /** Update group logical operator */
  updateGroupOperator: (groupId: string, operator: 'AND' | 'OR') => void;
  /** Remove a condition group */
  removeConditionGroup: (groupId: string) => void;
  /** Add a sort */
  addSort: (fieldId: string) => void;
  /** Update a sort */
  updateSort: (index: number, updates: Partial<QuerySort>) => void;
  /** Remove a sort */
  removeSort: (index: number) => void;
  /** Reorder sorts */
  reorderSorts: (fromIndex: number, toIndex: number) => void;
  /** Set limit */
  setLimit: (limit: number | undefined) => void;
  /** Set offset */
  setOffset: (offset: number | undefined) => void;
  /** Generate SQL from current query */
  generateSQL: () => string;
  /** Clear the store */
  reset: () => void;
}

/**
 * Helper function to find and update condition in nested groups
 */
function updateConditionInGroup(
  group: QueryConditionGroup,
  conditionId: string,
  updates: Partial<QueryCondition>
): QueryConditionGroup {
  return {
    ...group,
    conditions: group.conditions.map((item) => {
      if ('conditions' in item) {
        return updateConditionInGroup(item, conditionId, updates);
      } else if (item.id === conditionId) {
        return { ...item, ...updates };
      }
      return item;
    }),
  };
}

/**
 * Helper function to remove condition from nested groups
 */
function removeConditionFromGroup(
  group: QueryConditionGroup,
  conditionId: string
): QueryConditionGroup {
  return {
    ...group,
    conditions: group.conditions
      .filter((item) => {
        if ('conditions' in item) {
          return true;
        }
        return item.id !== conditionId;
      })
      .map((item) => {
        if ('conditions' in item) {
          return removeConditionFromGroup(item, conditionId);
        }
        return item;
      }),
  };
}

/**
 * Helper function to add condition to a specific group
 */
function addConditionToGroup(
  group: QueryConditionGroup,
  targetGroupId: string,
  condition: QueryCondition
): QueryConditionGroup {
  if (group.id === targetGroupId) {
    return {
      ...group,
      conditions: [...group.conditions, condition],
    };
  }

  return {
    ...group,
    conditions: group.conditions.map((item) => {
      if ('conditions' in item) {
        return addConditionToGroup(item, targetGroupId, condition);
      }
      return item;
    }),
  };
}

/**
 * Helper function to add a subgroup to a specific group
 */
function addSubgroupToGroup(
  group: QueryConditionGroup,
  targetGroupId: string,
  newGroup: QueryConditionGroup
): QueryConditionGroup {
  if (group.id === targetGroupId) {
    return {
      ...group,
      conditions: [...group.conditions, newGroup],
    };
  }

  return {
    ...group,
    conditions: group.conditions.map((item) => {
      if ('conditions' in item) {
        return addSubgroupToGroup(item, targetGroupId, newGroup);
      }
      return item;
    }),
  };
}

/**
 * Helper function to update group operator
 */
function updateGroupOperatorInGroup(
  group: QueryConditionGroup,
  targetGroupId: string,
  operator: 'AND' | 'OR'
): QueryConditionGroup {
  if (group.id === targetGroupId) {
    return { ...group, logicalOperator: operator };
  }

  return {
    ...group,
    conditions: group.conditions.map((item) => {
      if ('conditions' in item) {
        return updateGroupOperatorInGroup(item, targetGroupId, operator);
      }
      return item;
    }),
  };
}

/**
 * Helper function to remove a group
 */
function removeGroupFromGroup(
  group: QueryConditionGroup,
  targetGroupId: string
): QueryConditionGroup {
  return {
    ...group,
    conditions: group.conditions
      .filter((item) => {
        if ('conditions' in item && item.id === targetGroupId) {
          return false;
        }
        return true;
      })
      .map((item) => {
        if ('conditions' in item) {
          return removeGroupFromGroup(item, targetGroupId);
        }
        return item;
      }),
  };
}

/**
 * Initial state
 */
const initialState: QueryBuilderState = {
  entities: SAMPLE_ENTITIES,
  savedQueries: [],
  currentQuery: null,
  isOpen: false,
  selectedQueryId: null,
};

/**
 * Query Builder Store
 */
export const useQueryBuilderStore = create<QueryBuilderState & QueryBuilderActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      openBuilder: (entityId) => {
        const state = get();
        if (entityId && !state.currentQuery) {
          const query = createEmptyQuery(entityId);
          set({ isOpen: true, currentQuery: query, selectedQueryId: null });
        } else {
          set({ isOpen: true });
        }
      },

      closeBuilder: () => {
        set({ isOpen: false });
      },

      setEntities: (entities) => {
        set({ entities });
      },

      createQuery: (entityId) => {
        const query = createEmptyQuery(entityId);
        set({ currentQuery: query, selectedQueryId: null });
      },

      saveQuery: () => {
        const state = get();
        if (!state.currentQuery) return;

        const now = new Date();
        const updatedQuery = { ...state.currentQuery, updatedAt: now };

        const existingIndex = state.savedQueries.findIndex(
          (q) => q.id === updatedQuery.id
        );

        if (existingIndex >= 0) {
          const updatedQueries = [...state.savedQueries];
          updatedQueries[existingIndex] = updatedQuery;
          set({ savedQueries: updatedQueries, currentQuery: updatedQuery });
        } else {
          set({
            savedQueries: [...state.savedQueries, updatedQuery],
            currentQuery: updatedQuery,
          });
        }
      },

      loadQuery: (queryId) => {
        const state = get();
        const query = state.savedQueries.find((q) => q.id === queryId);
        if (query) {
          set({ currentQuery: { ...query }, selectedQueryId: queryId });
        }
      },

      deleteQuery: (queryId) => {
        const state = get();
        set({
          savedQueries: state.savedQueries.filter((q) => q.id !== queryId),
          currentQuery:
            state.currentQuery?.id === queryId ? null : state.currentQuery,
          selectedQueryId:
            state.selectedQueryId === queryId ? null : state.selectedQueryId,
        });
      },

      updateQueryName: (name) => {
        const state = get();
        if (!state.currentQuery) return;
        set({
          currentQuery: { ...state.currentQuery, name, updatedAt: new Date() },
        });
      },

      updateQueryDescription: (description) => {
        const state = get();
        if (!state.currentQuery) return;
        set({
          currentQuery: {
            ...state.currentQuery,
            description,
            updatedAt: new Date(),
          },
        });
      },

      changeEntity: (entityId) => {
        const state = get();
        if (!state.currentQuery) return;
        set({
          currentQuery: {
            ...state.currentQuery,
            entity: entityId,
            selectedFields: [],
            conditions: { id: 'root', logicalOperator: 'AND', conditions: [] },
            sorts: [],
            updatedAt: new Date(),
          },
        });
      },

      toggleField: (fieldId) => {
        const state = get();
        if (!state.currentQuery) return;

        const selectedFields = state.currentQuery.selectedFields.includes(fieldId)
          ? state.currentQuery.selectedFields.filter((f) => f !== fieldId)
          : [...state.currentQuery.selectedFields, fieldId];

        set({
          currentQuery: {
            ...state.currentQuery,
            selectedFields,
            updatedAt: new Date(),
          },
        });
      },

      selectAllFields: () => {
        const state = get();
        if (!state.currentQuery) return;

        const entity = state.entities.find(
          (e) => e.id === state.currentQuery!.entity
        );
        if (!entity) return;

        const selectableFields = entity.fields
          .filter((f) => f.selectable)
          .map((f) => f.id);

        set({
          currentQuery: {
            ...state.currentQuery,
            selectedFields: selectableFields,
            updatedAt: new Date(),
          },
        });
      },

      deselectAllFields: () => {
        const state = get();
        if (!state.currentQuery) return;

        set({
          currentQuery: {
            ...state.currentQuery,
            selectedFields: [],
            updatedAt: new Date(),
          },
        });
      },

      addCondition: (groupId, fieldId) => {
        const state = get();
        if (!state.currentQuery) return;

        const condition = createCondition(fieldId);
        const updatedConditions = addConditionToGroup(
          state.currentQuery.conditions,
          groupId,
          condition
        );

        set({
          currentQuery: {
            ...state.currentQuery,
            conditions: updatedConditions,
            updatedAt: new Date(),
          },
        });
      },

      updateCondition: (conditionId, updates) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedConditions = updateConditionInGroup(
          state.currentQuery.conditions,
          conditionId,
          updates
        );

        set({
          currentQuery: {
            ...state.currentQuery,
            conditions: updatedConditions,
            updatedAt: new Date(),
          },
        });
      },

      removeCondition: (conditionId) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedConditions = removeConditionFromGroup(
          state.currentQuery.conditions,
          conditionId
        );

        set({
          currentQuery: {
            ...state.currentQuery,
            conditions: updatedConditions,
            updatedAt: new Date(),
          },
        });
      },

      addConditionGroup: (parentGroupId) => {
        const state = get();
        if (!state.currentQuery) return;

        const newGroup = createConditionGroup();
        const updatedConditions = addSubgroupToGroup(
          state.currentQuery.conditions,
          parentGroupId,
          newGroup
        );

        set({
          currentQuery: {
            ...state.currentQuery,
            conditions: updatedConditions,
            updatedAt: new Date(),
          },
        });
      },

      updateGroupOperator: (groupId, operator) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedConditions = updateGroupOperatorInGroup(
          state.currentQuery.conditions,
          groupId,
          operator
        );

        set({
          currentQuery: {
            ...state.currentQuery,
            conditions: updatedConditions,
            updatedAt: new Date(),
          },
        });
      },

      removeConditionGroup: (groupId) => {
        const state = get();
        if (!state.currentQuery) return;

        // Don't remove root group
        if (groupId === 'root') return;

        const updatedConditions = removeGroupFromGroup(
          state.currentQuery.conditions,
          groupId
        );

        set({
          currentQuery: {
            ...state.currentQuery,
            conditions: updatedConditions,
            updatedAt: new Date(),
          },
        });
      },

      addSort: (fieldId) => {
        const state = get();
        if (!state.currentQuery) return;

        // Don't add duplicate sorts
        if (state.currentQuery.sorts.some((s) => s.fieldId === fieldId)) return;

        set({
          currentQuery: {
            ...state.currentQuery,
            sorts: [...state.currentQuery.sorts, { fieldId, direction: 'asc' }],
            updatedAt: new Date(),
          },
        });
      },

      updateSort: (index, updates) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedSorts = [...state.currentQuery.sorts];
        updatedSorts[index] = { ...updatedSorts[index], ...updates };

        set({
          currentQuery: {
            ...state.currentQuery,
            sorts: updatedSorts,
            updatedAt: new Date(),
          },
        });
      },

      removeSort: (index) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedSorts = state.currentQuery.sorts.filter((_, i) => i !== index);

        set({
          currentQuery: {
            ...state.currentQuery,
            sorts: updatedSorts,
            updatedAt: new Date(),
          },
        });
      },

      reorderSorts: (fromIndex, toIndex) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedSorts = [...state.currentQuery.sorts];
        const [removed] = updatedSorts.splice(fromIndex, 1);
        updatedSorts.splice(toIndex, 0, removed);

        set({
          currentQuery: {
            ...state.currentQuery,
            sorts: updatedSorts,
            updatedAt: new Date(),
          },
        });
      },

      setLimit: (limit) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedQuery = {
          ...state.currentQuery,
          updatedAt: new Date(),
        };
        if (limit !== undefined) {
          updatedQuery.limit = limit;
        } else {
          delete updatedQuery.limit;
        }
        set({ currentQuery: updatedQuery });
      },

      setOffset: (offset) => {
        const state = get();
        if (!state.currentQuery) return;

        const updatedQuery = {
          ...state.currentQuery,
          updatedAt: new Date(),
        };
        if (offset !== undefined) {
          updatedQuery.offset = offset;
        } else {
          delete updatedQuery.offset;
        }
        set({ currentQuery: updatedQuery });
      },

      generateSQL: () => {
        const state = get();
        if (!state.currentQuery) return '';

        const query = state.currentQuery;
        const entity = state.entities.find((e) => e.id === query.entity);
        if (!entity) return '';

        // SELECT clause
        const fields =
          query.selectedFields.length > 0
            ? query.selectedFields.join(', ')
            : '*';
        let sql = `SELECT ${fields}\nFROM ${query.entity}`;

        // WHERE clause
        const buildConditionSQL = (
          group: QueryConditionGroup,
          depth: number = 0
        ): string => {
          if (group.conditions.length === 0) return '';

          const parts = group.conditions
            .map((item) => {
              if ('conditions' in item) {
                const nested = buildConditionSQL(item, depth + 1);
                return nested ? `(${nested})` : '';
              } else {
                const field = entity.fields.find((f) => f.id === item.fieldId);
                if (!field) return '';

                const fieldName = item.fieldId;
                const value =
                  typeof item.value === 'string'
                    ? `'${item.value}'`
                    : item.value;

                switch (item.operator) {
                  case 'equals':
                    return `${fieldName} = ${value}`;
                  case 'not_equals':
                    return `${fieldName} <> ${value}`;
                  case 'contains':
                    return `${fieldName} LIKE '%${item.value}%'`;
                  case 'starts_with':
                    return `${fieldName} LIKE '${item.value}%'`;
                  case 'ends_with':
                    return `${fieldName} LIKE '%${item.value}'`;
                  case 'greater_than':
                    return `${fieldName} > ${value}`;
                  case 'less_than':
                    return `${fieldName} < ${value}`;
                  case 'greater_or_equal':
                    return `${fieldName} >= ${value}`;
                  case 'less_or_equal':
                    return `${fieldName} <= ${value}`;
                  case 'between':
                    return `${fieldName} BETWEEN ${value} AND ${item.value2}`;
                  case 'in':
                    return `${fieldName} IN (${Array.isArray(item.value) ? item.value.map((v) => `'${v}'`).join(', ') : value})`;
                  case 'not_in':
                    return `${fieldName} NOT IN (${Array.isArray(item.value) ? item.value.map((v) => `'${v}'`).join(', ') : value})`;
                  case 'is_null':
                    return `${fieldName} IS NULL`;
                  case 'is_not_null':
                    return `${fieldName} IS NOT NULL`;
                  default:
                    return '';
                }
              }
            })
            .filter(Boolean);

          return parts.join(` ${group.logicalOperator} `);
        };

        const whereClause = buildConditionSQL(query.conditions);
        if (whereClause) {
          sql += `\nWHERE ${whereClause}`;
        }

        // ORDER BY clause
        if (query.sorts.length > 0) {
          const orderBy = query.sorts
            .map((s) => `${s.fieldId} ${s.direction.toUpperCase()}`)
            .join(', ');
          sql += `\nORDER BY ${orderBy}`;
        }

        // LIMIT and OFFSET
        if (query.limit !== undefined) {
          sql += `\nLIMIT ${query.limit}`;
        }
        if (query.offset !== undefined) {
          sql += `\nOFFSET ${query.offset}`;
        }

        return sql;
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'certeafiles-query-builder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedQueries: state.savedQueries,
        entities: state.entities,
      }),
    }
  )
);

export default useQueryBuilderStore;
