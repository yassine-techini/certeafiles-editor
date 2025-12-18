/**
 * DOCX Export Types - Types for Word document export
 * Per Constitution Section 8 - Export
 */

/**
 * DOCX export options
 */
export interface DocxExportOptions {
  /** Include headers */
  includeHeaders: boolean;
  /** Include footers */
  includeFooters: boolean;
  /** Include track changes as revision marks */
  includeTrackChanges: boolean;
  /** Include comments */
  includeComments: boolean;
  /** Include footnotes */
  includeFootnotes: boolean;
  /** Resolve slots/placeholders with actual values */
  resolveSlots: boolean;
  /** Page range to export (null = all pages) */
  pageRange: { start: number; end: number } | null;
  /** Document title */
  title: string;
  /** Document author */
  author: string;
  /** Document subject */
  subject: string;
  /** Document description */
  description: string;
  /** Keywords for document */
  keywords: string[];
}

/**
 * Default DOCX export options
 */
export const DEFAULT_DOCX_OPTIONS: DocxExportOptions = {
  includeHeaders: true,
  includeFooters: true,
  includeTrackChanges: false,
  includeComments: true,
  includeFootnotes: true,
  resolveSlots: true,
  pageRange: null,
  title: '',
  author: '',
  subject: '',
  description: '',
  keywords: [],
};

/**
 * Export progress for DOCX
 */
export interface DocxExportProgress {
  /** Current step */
  step: 'preparing' | 'converting' | 'generating' | 'complete';
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current status message */
  message: string;
}

/**
 * Export format type
 */
export type ExportFormat = 'pdf' | 'docx';

/**
 * Combined export options for format selection
 */
export interface ExportOptions {
  format: ExportFormat;
  filename: string;
}
