/**
 * Query Builder Types - Visual query builder for data fetching
 * Per Constitution Section 1 - General Features
 */

/**
 * Field types supported in queries
 */
export type QueryFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'reference';

/**
 * Comparison operators
 */
export type ComparisonOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

/**
 * Logical operators for combining conditions
 */
export type LogicalOperator = 'AND' | 'OR';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Query field definition
 */
export interface QueryField {
  /** Field identifier */
  id: string;
  /** Display name */
  name: string;
  /** Field type */
  type: QueryFieldType;
  /** Available for filtering */
  filterable: boolean;
  /** Available for sorting */
  sortable: boolean;
  /** Available for selection */
  selectable: boolean;
  /** Options for select type */
  options?: { value: string; label: string }[];
  /** Reference entity for reference type */
  referenceEntity?: string;
}

/**
 * Query condition
 */
export interface QueryCondition {
  /** Unique identifier */
  id: string;
  /** Field to filter */
  fieldId: string;
  /** Comparison operator */
  operator: ComparisonOperator;
  /** Value(s) for comparison */
  value: string | number | boolean | string[] | null;
  /** Second value for 'between' operator */
  value2?: string | number | null;
}

/**
 * Condition group for nested logic
 */
export interface QueryConditionGroup {
  /** Unique identifier */
  id: string;
  /** Logical operator for combining conditions */
  logicalOperator: LogicalOperator;
  /** Conditions in this group */
  conditions: (QueryCondition | QueryConditionGroup)[];
}

/**
 * Sort specification
 */
export interface QuerySort {
  /** Field to sort by */
  fieldId: string;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Complete query definition
 */
export interface Query {
  /** Unique identifier */
  id: string;
  /** Query name */
  name: string;
  /** Description */
  description?: string;
  /** Source entity/table */
  entity: string;
  /** Selected fields */
  selectedFields: string[];
  /** Filter conditions */
  conditions: QueryConditionGroup;
  /** Sort specifications */
  sorts: QuerySort[];
  /** Result limit */
  limit?: number;
  /** Result offset */
  offset?: number;
  /** Created timestamp */
  createdAt: Date;
  /** Updated timestamp */
  updatedAt: Date;
}

/**
 * Available entities for querying
 */
export interface QueryEntity {
  /** Entity identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description?: string;
  /** Available fields */
  fields: QueryField[];
}

/**
 * Operator labels for display
 */
export const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  equals: 'égal à',
  not_equals: 'différent de',
  contains: 'contient',
  starts_with: 'commence par',
  ends_with: 'se termine par',
  greater_than: 'supérieur à',
  less_than: 'inférieur à',
  greater_or_equal: 'supérieur ou égal à',
  less_or_equal: 'inférieur ou égal à',
  between: 'entre',
  in: 'dans la liste',
  not_in: 'pas dans la liste',
  is_null: 'est vide',
  is_not_null: 'n\'est pas vide',
};

/**
 * Get available operators for a field type
 */
export function getOperatorsForFieldType(fieldType: QueryFieldType): ComparisonOperator[] {
  switch (fieldType) {
    case 'text':
      return [
        'equals',
        'not_equals',
        'contains',
        'starts_with',
        'ends_with',
        'is_null',
        'is_not_null',
      ];
    case 'number':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_or_equal',
        'less_or_equal',
        'between',
        'is_null',
        'is_not_null',
      ];
    case 'date':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_or_equal',
        'less_or_equal',
        'between',
        'is_null',
        'is_not_null',
      ];
    case 'boolean':
      return ['equals', 'not_equals', 'is_null', 'is_not_null'];
    case 'select':
      return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'];
    case 'reference':
      return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'];
    default:
      return ['equals', 'not_equals'];
  }
}

/**
 * Create an empty query
 */
export function createEmptyQuery(entity: string): Query {
  const now = new Date();
  return {
    id: `query-${Date.now()}`,
    name: 'Nouvelle requête',
    entity,
    selectedFields: [],
    conditions: {
      id: 'root',
      logicalOperator: 'AND',
      conditions: [],
    },
    sorts: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new condition
 */
export function createCondition(fieldId: string): QueryCondition {
  return {
    id: `condition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fieldId,
    operator: 'equals',
    value: '',
  };
}

/**
 * Create a new condition group
 */
export function createConditionGroup(): QueryConditionGroup {
  return {
    id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    logicalOperator: 'AND',
    conditions: [],
  };
}

/**
 * Sample entities for demo
 */
export const SAMPLE_ENTITIES: QueryEntity[] = [
  {
    id: 'products',
    name: 'Produits',
    description: 'Liste des produits',
    fields: [
      { id: 'id', name: 'ID', type: 'number', filterable: true, sortable: true, selectable: true },
      { id: 'name', name: 'Nom', type: 'text', filterable: true, sortable: true, selectable: true },
      { id: 'code', name: 'Code', type: 'text', filterable: true, sortable: true, selectable: true },
      { id: 'price', name: 'Prix', type: 'number', filterable: true, sortable: true, selectable: true },
      { id: 'category', name: 'Catégorie', type: 'select', filterable: true, sortable: true, selectable: true, options: [
        { value: 'electronics', label: 'Électronique' },
        { value: 'clothing', label: 'Vêtements' },
        { value: 'food', label: 'Alimentation' },
      ]},
      { id: 'active', name: 'Actif', type: 'boolean', filterable: true, sortable: true, selectable: true },
      { id: 'createdAt', name: 'Date création', type: 'date', filterable: true, sortable: true, selectable: true },
    ],
  },
  {
    id: 'clients',
    name: 'Clients',
    description: 'Liste des clients',
    fields: [
      { id: 'id', name: 'ID', type: 'number', filterable: true, sortable: true, selectable: true },
      { id: 'name', name: 'Nom', type: 'text', filterable: true, sortable: true, selectable: true },
      { id: 'email', name: 'Email', type: 'text', filterable: true, sortable: true, selectable: true },
      { id: 'phone', name: 'Téléphone', type: 'text', filterable: true, sortable: false, selectable: true },
      { id: 'type', name: 'Type', type: 'select', filterable: true, sortable: true, selectable: true, options: [
        { value: 'individual', label: 'Particulier' },
        { value: 'company', label: 'Entreprise' },
        { value: 'government', label: 'Administration' },
      ]},
      { id: 'active', name: 'Actif', type: 'boolean', filterable: true, sortable: true, selectable: true },
    ],
  },
  {
    id: 'orders',
    name: 'Commandes',
    description: 'Liste des commandes',
    fields: [
      { id: 'id', name: 'ID', type: 'number', filterable: true, sortable: true, selectable: true },
      { id: 'orderNumber', name: 'N° Commande', type: 'text', filterable: true, sortable: true, selectable: true },
      { id: 'clientId', name: 'Client', type: 'reference', filterable: true, sortable: false, selectable: true, referenceEntity: 'clients' },
      { id: 'total', name: 'Total', type: 'number', filterable: true, sortable: true, selectable: true },
      { id: 'status', name: 'Statut', type: 'select', filterable: true, sortable: true, selectable: true, options: [
        { value: 'pending', label: 'En attente' },
        { value: 'processing', label: 'En cours' },
        { value: 'shipped', label: 'Expédié' },
        { value: 'delivered', label: 'Livré' },
        { value: 'cancelled', label: 'Annulé' },
      ]},
      { id: 'orderDate', name: 'Date commande', type: 'date', filterable: true, sortable: true, selectable: true },
    ],
  },
];
