/**
 * Core constants for CerteaFiles Editor
 * Unified timing and configuration values
 */

/**
 * Timing constants for debounce operations
 * All plugins should use these values for consistency
 */
export const TIMING = {
  /** Immediate execution (0ms) - for critical updates */
  DEBOUNCE_IMMEDIATE: 0,

  /** Fast debounce (50ms) - for visual updates */
  DEBOUNCE_FAST: 50,

  /** Normal debounce (150ms) - for store synchronization */
  DEBOUNCE_NORMAL: 150,

  /** Slow debounce (300ms) - for expensive operations */
  DEBOUNCE_SLOW: 300,

  /** Initial load delay (500ms) - wait after document load */
  INITIAL_LOAD_DELAY: 500,

  /** Document stabilization delay (1000ms) - before first sync */
  STABILIZATION_DELAY: 1000,
} as const;

/**
 * Plugin names (for consistency across codebase)
 */
export const PLUGIN_NAMES = {
  FOLIO: 'folio',
  HEADER_FOOTER: 'header-footer',
  PAGE_NUMBERING: 'page-numbering',
  AUTO_PAGINATION: 'auto-pagination',
  CONTENT: 'content',
  COMMENTS: 'comments',
  COLLABORATION: 'collaboration',
  VERSIONING: 'versioning',
} as const;

/**
 * Editor update tags (to identify update sources)
 */
export const UPDATE_TAGS = {
  FOLIO_SYNC: 'folio-sync',
  HEADER_FOOTER_SYNC: 'header-footer-sync',
  PAGE_NUMBER_SYNC: 'page-number-sync',
  AUTO_PAGINATION: 'auto-pagination',
  COLLABORATION_SYNC: 'collaboration-sync',
  HISTORY_RESTORE: 'history-restore',
  INITIAL_LOAD: 'initial-load',
} as const;

/**
 * Zone identifiers for FolioNode structure
 */
export const FOLIO_ZONES = {
  HEADER: 'folio-header-zone',
  CONTENT: 'folio-content-zone',
  FOOTER: 'folio-footer-zone',
} as const;

/**
 * CSS class names
 */
export const CSS_CLASSES = {
  FOLIO_PAGE: 'folio-page',
  FOLIO_HEADER: 'folio-header',
  FOLIO_FOOTER: 'folio-footer',
  FOLIO_CONTENT: 'folio-content',
  HEADER_ZONE: 'folio-header-zone',
  CONTENT_ZONE: 'folio-content-zone',
  FOOTER_ZONE: 'folio-footer-zone',
} as const;

/**
 * Maximum values for safety limits
 */
export const LIMITS = {
  /** Maximum number of folios allowed */
  MAX_FOLIOS: 1000,

  /** Maximum queue size for orchestrator */
  MAX_QUEUE_SIZE: 100,

  /** Maximum retry attempts for operations */
  MAX_RETRIES: 3,

  /** Maximum wait time for sync operations (ms) */
  MAX_SYNC_WAIT: 5000,
} as const;

export default {
  TIMING,
  PLUGIN_NAMES,
  UPDATE_TAGS,
  FOLIO_ZONES,
  CSS_CLASSES,
  LIMITS,
};
