/**
 * Special Tables Types - Business-specific table structures
 * Per Constitution Section 3 - Header/Footer and Special Tables
 */

/**
 * Type of special table
 */
export type SpecialTableType =
  | 'products_by_group'   // Produits concernés par groupe
  | 'history'             // Historique des versions
  | 'validation';         // Validation (signatures)

/**
 * Product group entry for products table
 */
export interface ProductGroup {
  /** Group name */
  groupName: string;
  /** Products in this group */
  products: string[];
}

/**
 * Products by Group table data
 */
export interface ProductsTableData {
  type: 'products_by_group';
  /** Title of the table */
  title: string;
  /** Product groups */
  groups: ProductGroup[];
}

/**
 * History entry for version history table
 */
export interface HistoryEntry {
  /** Version number */
  version: string;
  /** Date of the version */
  date: Date | string;
  /** Author of the changes */
  author: string;
  /** Description of changes */
  description: string;
  /** Status */
  status?: 'draft' | 'review' | 'approved' | 'published';
}

/**
 * History table data
 */
export interface HistoryTableData {
  type: 'history';
  /** Title of the table */
  title: string;
  /** History entries */
  entries: HistoryEntry[];
}

/**
 * Validation entry for signature table
 */
export interface ValidationEntry {
  /** Role of the validator */
  role: string;
  /** Name of the validator */
  name: string;
  /** Date of validation */
  date: Date | string | null;
  /** Signature (could be text or image reference) */
  signature: string | null;
  /** Validation status */
  status: 'pending' | 'approved' | 'rejected';
  /** Comments */
  comments?: string;
}

/**
 * Validation table data
 */
export interface ValidationTableData {
  type: 'validation';
  /** Title of the table */
  title: string;
  /** Validation entries */
  entries: ValidationEntry[];
}

/**
 * Union type for all special table data
 */
export type SpecialTableData =
  | ProductsTableData
  | HistoryTableData
  | ValidationTableData;

/**
 * Labels for special table types
 */
export const SPECIAL_TABLE_LABELS: Record<SpecialTableType, string> = {
  products_by_group: 'Produits concernés par groupe',
  history: 'Historique des versions',
  validation: 'Validation',
};

/**
 * Icons for special table types (lucide icon names)
 */
export const SPECIAL_TABLE_ICONS: Record<SpecialTableType, string> = {
  products_by_group: 'Package',
  history: 'History',
  validation: 'CheckCircle',
};

/**
 * Colors for special table types
 */
export const SPECIAL_TABLE_COLORS: Record<SpecialTableType, { bg: string; border: string; header: string }> = {
  products_by_group: {
    bg: '#f0f9ff',
    border: '#0ea5e9',
    header: '#0369a1',
  },
  history: {
    bg: '#fefce8',
    border: '#eab308',
    header: '#a16207',
  },
  validation: {
    bg: '#f0fdf4',
    border: '#22c55e',
    header: '#15803d',
  },
};

/**
 * Default data for Products table
 */
export function createDefaultProductsTable(): ProductsTableData {
  return {
    type: 'products_by_group',
    title: 'Produits concernés par groupe',
    groups: [
      {
        groupName: 'Groupe 1',
        products: ['Produit A', 'Produit B'],
      },
      {
        groupName: 'Groupe 2',
        products: ['Produit C'],
      },
    ],
  };
}

/**
 * Default data for History table
 */
export function createDefaultHistoryTable(): HistoryTableData {
  return {
    type: 'history',
    title: 'Historique des versions',
    entries: [
      {
        version: '1.0',
        date: new Date().toLocaleDateString('fr-FR'),
        author: 'Auteur',
        description: 'Version initiale',
        status: 'draft',
      },
    ],
  };
}

/**
 * Default data for Validation table
 */
export function createDefaultValidationTable(): ValidationTableData {
  return {
    type: 'validation',
    title: 'Validation',
    entries: [
      {
        role: 'Rédacteur',
        name: '',
        date: null,
        signature: null,
        status: 'pending',
      },
      {
        role: 'Vérificateur',
        name: '',
        date: null,
        signature: null,
        status: 'pending',
      },
      {
        role: 'Approbateur',
        name: '',
        date: null,
        signature: null,
        status: 'pending',
      },
    ],
  };
}

/**
 * Create default data for a special table type
 */
export function createDefaultSpecialTable(type: SpecialTableType): SpecialTableData {
  switch (type) {
    case 'products_by_group':
      return createDefaultProductsTable();
    case 'history':
      return createDefaultHistoryTable();
    case 'validation':
      return createDefaultValidationTable();
  }
}

/**
 * Validation status labels
 */
export const VALIDATION_STATUS_LABELS: Record<ValidationEntry['status'], string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

/**
 * Validation status colors
 */
export const VALIDATION_STATUS_COLORS: Record<ValidationEntry['status'], { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  approved: { bg: '#dcfce7', text: '#166534' },
  rejected: { bg: '#fee2e2', text: '#991b1b' },
};

/**
 * History status labels
 */
export const HISTORY_STATUS_LABELS: Record<NonNullable<HistoryEntry['status']>, string> = {
  draft: 'Brouillon',
  review: 'En revue',
  approved: 'Approuvé',
  published: 'Publié',
};

/**
 * History status colors
 */
export const HISTORY_STATUS_COLORS: Record<NonNullable<HistoryEntry['status']>, { bg: string; text: string }> = {
  draft: { bg: '#f3f4f6', text: '#374151' },
  review: { bg: '#dbeafe', text: '#1e40af' },
  approved: { bg: '#dcfce7', text: '#166534' },
  published: { bg: '#ede9fe', text: '#5b21b6' },
};
