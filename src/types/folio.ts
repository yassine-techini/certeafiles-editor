import type { SerializedEditorState } from 'lexical';

export type FolioOrientation = 'portrait' | 'landscape';
export type NumberingStyle = 'continuous' | 'reset' | 'roman' | 'alpha' | 'none';
export type FolioStatus = 'draft' | 'modified' | 'validated';

/**
 * Margins configuration in millimeters
 */
export interface FolioMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Default margins in mm
 */
export const DEFAULT_MARGINS: FolioMargins = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

/**
 * Metadata for imported PDF pages
 */
export interface FolioMetadata {
  pdfPageImage?: string;
  pdfPageNumber?: number;
  pdfTextContent?: string;
  [key: string]: unknown;
}

export interface Folio {
  id: string;
  index: number;
  sectionId: string | null;
  orientation: FolioOrientation;
  margins: FolioMargins;
  content: SerializedEditorState | null;
  headerId: string | null;
  footerId: string | null;
  locked: boolean;
  status: FolioStatus;
  metadata: FolioMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolioSection {
  id: string;
  name: string;
  index: number;
  collapsed: boolean;
  numberingStyle: NumberingStyle;
}

export interface FolioCreatePayload {
  afterId?: string;
  orientation?: FolioOrientation;
  sectionId?: string | null;
  margins?: FolioMargins;
}

/**
 * Create a new empty folio with defaults
 */
export function createEmptyFolio(
  id: string,
  index: number = 0,
  options: Partial<Omit<Folio, 'id' | 'index' | 'createdAt' | 'updatedAt'>> = {}
): Folio {
  const now = new Date();
  return {
    id,
    index,
    sectionId: options.sectionId ?? null,
    orientation: options.orientation ?? 'portrait',
    margins: options.margins ?? { ...DEFAULT_MARGINS },
    content: options.content ?? null,
    headerId: options.headerId ?? null,
    footerId: options.footerId ?? null,
    locked: options.locked ?? false,
    status: options.status ?? 'draft',
    metadata: options.metadata ?? {},
    createdAt: now,
    updatedAt: now,
  };
}
