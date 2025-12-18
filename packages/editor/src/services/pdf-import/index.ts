/**
 * PDF Import Service - Main exports
 * Per Constitution Section 8 - Import
 */

export {
  PdfImportService,
  createPdfImportService,
  DEFAULT_PDF_IMPORT_OPTIONS,
} from './PdfImportService';
export type {
  PageOrientation,
  ExtractedPage,
  PdfImportOptions,
  PdfImportResult,
} from './PdfImportService';

export {
  FolioCreator,
  createFolioCreator,
  createFoliosFromPages,
  DEFAULT_FOLIO_OPTIONS,
} from './FolioCreator';
export type {
  FolioData,
  FolioCreationOptions,
} from './FolioCreator';
