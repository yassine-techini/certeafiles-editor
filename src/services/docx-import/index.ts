/**
 * DOCX Import Service - Main exports
 * Per Constitution Section 8 - Import
 */

export {
  DocxImportService,
  createDocxImportService,
  importDocxFile,
  DEFAULT_IMPORT_OPTIONS,
} from './DocxImportService';
export type {
  ImportMode,
  DocxImportOptions,
  DocxImportResult,
} from './DocxImportService';

export {
  StyleMapper,
  createStyleMapper,
  OFFICE_SPECIFIC_STYLES,
  DEFAULT_STYLE_CONFIG,
} from './StyleMapper';
export type {
  WordStyleCategory,
  MappedStyle,
  StyleMappingConfig,
} from './StyleMapper';
