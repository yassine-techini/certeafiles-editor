/**
 * Export Types - PDF and document export configuration
 * Per Constitution Section 8 - Export
 */

/**
 * PDF quality preset
 */
export type PdfQuality = 'draft' | 'standard' | 'high' | 'print';

/**
 * PDF paper size
 */
export type PdfPaperSize = 'a4' | 'letter' | 'legal';

/**
 * PDF export options
 */
export interface PdfExportOptions {
  /** Quality preset affecting DPI and compression */
  quality: PdfQuality;
  /** Paper size */
  paperSize: PdfPaperSize;
  /** Whether to resolve slot placeholders */
  resolveSlots: boolean;
  /** Whether to include comments */
  includeComments: boolean;
  /** Whether to include track changes */
  includeTrackChanges: boolean;
  /** Whether to show track changes markup */
  showTrackChangesMarkup: boolean;
  /** Page range (null = all) */
  pageRange: { start: number; end: number } | null;
  /** Whether to embed fonts */
  embedFonts: boolean;
  /** PDF/A compliance level */
  pdfACompliance: 'none' | 'pdf-a-1b' | 'pdf-a-2b' | 'pdf-a-3b';
}

/**
 * PDF metadata
 */
export interface PdfMetadata {
  /** Document title */
  title: string;
  /** Document author */
  author: string;
  /** Document subject */
  subject: string;
  /** Keywords (comma-separated) */
  keywords: string;
  /** Creator application */
  creator: string;
  /** Producer application */
  producer: string;
  /** Creation date */
  creationDate: Date;
  /** Modification date */
  modificationDate: Date;
}

/**
 * Export progress status
 */
export type ExportProgressStatus =
  | 'idle'
  | 'preparing'
  | 'resolving_slots'
  | 'rendering'
  | 'generating_pdf'
  | 'finalizing'
  | 'complete'
  | 'error';

/**
 * Export progress info
 */
export interface ExportProgress {
  /** Current status */
  status: ExportProgressStatus;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current step message */
  message: string;
  /** Current page being processed */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Error message if status is 'error' */
  error?: string | undefined;
}

/**
 * PDF metadata for API requests (with ISO string dates)
 */
export interface PdfMetadataRequest {
  /** Document title */
  title: string;
  /** Document author */
  author: string;
  /** Document subject */
  subject: string;
  /** Keywords (comma-separated) */
  keywords: string;
  /** Creator application */
  creator: string;
  /** Producer application */
  producer: string;
  /** Creation date (ISO string) */
  creationDate: string;
  /** Modification date (ISO string) */
  modificationDate: string;
}

/**
 * Export request payload sent to Worker
 */
export interface PdfExportRequest {
  /** Serialized editor states for each folio */
  folios: {
    id: string;
    index: number;
    orientation: 'portrait' | 'landscape';
    htmlContent: string;
    cssStyles: string;
  }[];
  /** Export options */
  options: PdfExportOptions;
  /** PDF metadata (with ISO string dates for API) */
  metadata: PdfMetadataRequest;
  /** Resolved slot values */
  resolvedSlots: Record<string, string>;
}

/**
 * Export response from Worker
 */
export interface PdfExportResponse {
  /** Success status */
  success: boolean;
  /** PDF blob URL or base64 data */
  data?: string | undefined;
  /** Filename suggestion */
  filename?: string | undefined;
  /** Total pages generated */
  pageCount?: number | undefined;
  /** File size in bytes */
  fileSize?: number | undefined;
  /** Error message if failed */
  error?: string | undefined;
}

/**
 * Default export options
 */
export const DEFAULT_PDF_OPTIONS: PdfExportOptions = {
  quality: 'standard',
  paperSize: 'a4',
  resolveSlots: true,
  includeComments: false,
  includeTrackChanges: true,
  showTrackChangesMarkup: false,
  pageRange: null,
  embedFonts: true,
  pdfACompliance: 'none',
};

/**
 * Default PDF metadata
 */
export const DEFAULT_PDF_METADATA: PdfMetadata = {
  title: 'Untitled Document',
  author: '',
  subject: '',
  keywords: '',
  creator: 'Certeafiles Editor',
  producer: 'Certeafiles PDF Generator',
  creationDate: new Date(),
  modificationDate: new Date(),
};

/**
 * Quality settings by preset
 */
export const QUALITY_SETTINGS: Record<PdfQuality, { dpi: number; compression: number }> = {
  draft: { dpi: 72, compression: 0.5 },
  standard: { dpi: 150, compression: 0.7 },
  high: { dpi: 300, compression: 0.85 },
  print: { dpi: 600, compression: 1.0 },
};

/**
 * Paper dimensions in mm
 */
export const PAPER_DIMENSIONS: Record<PdfPaperSize, { width: number; height: number }> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
  legal: { width: 215.9, height: 355.6 },
};
