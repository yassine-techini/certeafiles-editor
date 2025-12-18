/**
 * Header/Footer types
 * Per Constitution Section 4.2
 */
import type { SerializedEditorState } from 'lexical';

/**
 * Position alignment for header/footer content
 */
export type HeaderFooterAlignment = 'left' | 'center' | 'right';

/**
 * Content type for dynamic fields
 */
export type DynamicFieldType =
  | 'page_number'
  | 'total_pages'
  | 'date'
  | 'time'
  | 'document_title'
  | 'section_name'
  | 'author';

/**
 * Dynamic field configuration
 */
export interface DynamicField {
  type: DynamicFieldType;
  format?: string | undefined; // For date/time formatting
}

/**
 * Content segment for header/footer
 * Can be plain text, rich content, or dynamic field
 */
export interface HeaderFooterSegment {
  type: 'text' | 'rich' | 'dynamic';
  content?: string; // For text type
  richContent?: SerializedEditorState; // For rich type
  dynamicField?: DynamicField; // For dynamic type
}

/**
 * Header or Footer content structure
 */
export interface HeaderFooterContent {
  id: string;
  /** Left-aligned content */
  left: HeaderFooterSegment | null;
  /** Center-aligned content */
  center: HeaderFooterSegment | null;
  /** Right-aligned content */
  right: HeaderFooterSegment | null;
  /** Height in mm */
  height: number;
  /** Whether to show on first page */
  showOnFirstPage: boolean;
  /** Different content for odd/even pages */
  differentOddEven: boolean;
  /** Content for even pages (if differentOddEven is true) */
  evenPageContent?: {
    left: HeaderFooterSegment | null;
    center: HeaderFooterSegment | null;
    right: HeaderFooterSegment | null;
  };
  /** Border below header / above footer */
  showBorder: boolean;
  /** Padding in mm */
  padding: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default header/footer heights in mm
 */
export const DEFAULT_HEADER_HEIGHT = 15;
export const DEFAULT_FOOTER_HEIGHT = 15;
export const DEFAULT_HEADER_FOOTER_PADDING = 5;

/**
 * Create an empty header/footer segment
 */
export function createEmptySegment(): HeaderFooterSegment {
  return {
    type: 'text',
    content: '',
  };
}

/**
 * Create a text segment
 */
export function createTextSegment(text: string): HeaderFooterSegment {
  return {
    type: 'text',
    content: text,
  };
}

/**
 * Create a dynamic field segment
 */
export function createDynamicSegment(
  fieldType: DynamicFieldType,
  format?: string
): HeaderFooterSegment {
  return {
    type: 'dynamic',
    dynamicField: {
      type: fieldType,
      format,
    },
  };
}

/**
 * Create page number segment (e.g., "Page 1 of 5")
 */
export function createPageNumberSegment(): HeaderFooterSegment {
  return {
    type: 'text',
    content: 'Page {page} of {total}',
  };
}

/**
 * Create empty header/footer content
 */
export function createEmptyHeaderFooter(
  id: string,
  type: 'header' | 'footer'
): HeaderFooterContent {
  const now = new Date();
  return {
    id,
    left: null,
    center: null,
    right: null,
    height: type === 'header' ? DEFAULT_HEADER_HEIGHT : DEFAULT_FOOTER_HEIGHT,
    showOnFirstPage: true,
    differentOddEven: false,
    showBorder: false,
    padding: DEFAULT_HEADER_FOOTER_PADDING,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create default header with document title
 */
export function createDefaultHeader(id: string): HeaderFooterContent {
  const content = createEmptyHeaderFooter(id, 'header');
  content.center = createTextSegment('Document Title');
  return content;
}

/**
 * Create default footer with page numbers
 */
export function createDefaultFooter(id: string): HeaderFooterContent {
  const content = createEmptyHeaderFooter(id, 'footer');
  content.center = createPageNumberSegment();
  return content;
}

/**
 * Override entry for folio-specific header/footer
 */
export interface HeaderFooterOverride {
  folioId: string;
  contentId: string;
  useDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resolved header/footer for a folio
 */
export interface ResolvedHeaderFooter {
  content: HeaderFooterContent | null;
  isDefault: boolean;
  isOverride: boolean;
  overrideId?: string | undefined;
}
