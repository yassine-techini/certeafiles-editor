/**
 * Dynamic Field types and constants
 * Per Constitution Section 5 - Shortcuts & Commands
 */

/**
 * Types of dynamic fields supported
 */
export type DynamicFieldType =
  | 'page_number'
  | 'total_pages'
  | 'page_of_total'
  | 'date'
  | 'time'
  | 'datetime'
  | 'version'
  | 'title'
  | 'author'
  | 'logo'
  | 'filename'
  | 'last_modified';

/**
 * Date format options
 */
export type DateFormat =
  | 'short'      // 17/12/2025
  | 'medium'     // 17 déc. 2025
  | 'long'       // 17 décembre 2025
  | 'iso'        // 2025-12-17
  | 'custom';

/**
 * Time format options
 */
export type TimeFormat =
  | '24h'        // 14:30
  | '12h'        // 2:30 PM
  | 'full';      // 14:30:45

/**
 * Dynamic field configuration
 */
export interface DynamicFieldConfig {
  /** Date format (for date fields) */
  dateFormat?: DateFormat | undefined;
  /** Time format (for time/datetime fields) */
  timeFormat?: TimeFormat | undefined;
  /** Custom format string */
  customFormat?: string | undefined;
  /** Prefix text */
  prefix?: string | undefined;
  /** Suffix text */
  suffix?: string | undefined;
  /** Number format for page numbers */
  numberFormat?: 'arabic' | 'roman' | 'alpha' | undefined;
  /** Logo URL (for logo field) */
  logoUrl?: string | undefined;
  /** Logo width in px */
  logoWidth?: number | undefined;
  /** Logo height in px */
  logoHeight?: number | undefined;
}

/**
 * Colors for dynamic field types (for visual distinction in editor)
 */
export const DYNAMIC_FIELD_COLORS: Record<DynamicFieldType, { bg: string; border: string; text: string }> = {
  page_number: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  total_pages: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  page_of_total: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
  date: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  time: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  datetime: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
  version: { bg: '#dcfce7', border: '#22c55e', text: '#166534' },
  title: { bg: '#f3e8ff', border: '#a855f7', text: '#6b21a8' },
  author: { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' },
  logo: { bg: '#e0e7ff', border: '#6366f1', text: '#4338ca' },
  filename: { bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
  last_modified: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
};

/**
 * Labels for dynamic field types
 */
export const DYNAMIC_FIELD_LABELS: Record<DynamicFieldType, string> = {
  page_number: 'Numéro de page',
  total_pages: 'Total pages',
  page_of_total: 'Page X sur Y',
  date: 'Date',
  time: 'Heure',
  datetime: 'Date et heure',
  version: 'Version',
  title: 'Titre du document',
  author: 'Auteur',
  logo: 'Logo',
  filename: 'Nom du fichier',
  last_modified: 'Dernière modification',
};

/**
 * Icons for dynamic field types (lucide icon names)
 */
export const DYNAMIC_FIELD_ICONS: Record<DynamicFieldType, string> = {
  page_number: 'Hash',
  total_pages: 'Layers',
  page_of_total: 'FileStack',
  date: 'Calendar',
  time: 'Clock',
  datetime: 'CalendarClock',
  version: 'GitBranch',
  title: 'Type',
  author: 'User',
  logo: 'Image',
  filename: 'File',
  last_modified: 'Clock',
};

/**
 * Categories for grouping in menu
 */
export const DYNAMIC_FIELD_CATEGORIES = {
  PAGE: 'Pagination',
  DATE: 'Date & Heure',
  DOCUMENT: 'Document',
  MEDIA: 'Média',
} as const;

/**
 * Field to category mapping
 */
export const FIELD_CATEGORY_MAP: Record<DynamicFieldType, keyof typeof DYNAMIC_FIELD_CATEGORIES> = {
  page_number: 'PAGE',
  total_pages: 'PAGE',
  page_of_total: 'PAGE',
  date: 'DATE',
  time: 'DATE',
  datetime: 'DATE',
  version: 'DOCUMENT',
  title: 'DOCUMENT',
  author: 'DOCUMENT',
  filename: 'DOCUMENT',
  last_modified: 'DATE',
  logo: 'MEDIA',
};

/**
 * Context availability for fields
 */
export const FIELD_CONTEXT: Record<DynamicFieldType, { header: boolean; footer: boolean; body: boolean }> = {
  page_number: { header: true, footer: true, body: false },
  total_pages: { header: true, footer: true, body: false },
  page_of_total: { header: true, footer: true, body: false },
  date: { header: true, footer: true, body: true },
  time: { header: true, footer: true, body: true },
  datetime: { header: true, footer: true, body: true },
  version: { header: true, footer: true, body: true },
  title: { header: true, footer: true, body: true },
  author: { header: true, footer: true, body: true },
  filename: { header: true, footer: true, body: true },
  last_modified: { header: true, footer: true, body: true },
  logo: { header: true, footer: true, body: true },
};
