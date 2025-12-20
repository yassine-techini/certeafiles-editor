/**
 * CerteaFiles Editor - Library Exports
 *
 * Ce fichier exporte tous les composants, hooks, stores et types
 * nécessaires pour intégrer l'éditeur dans un autre projet.
 *
 * @example
 * ```tsx
 * import { CerteafilesEditor, useFolioStore } from 'certeafiles-editor';
 *
 * function MyApp() {
 *   return <CerteafilesEditor />;
 * }
 * ```
 */

// ============================================================================
// MAIN EDITOR COMPONENT
// ============================================================================
export { CerteafilesEditor, default as Editor } from '../components/Editor/CerteafilesEditor';
export type { CerteafilesEditorProps } from '../components/Editor/CerteafilesEditor';

// ============================================================================
// EDITOR SUB-COMPONENTS
// ============================================================================
export { EditorToolbar } from '../components/Editor/EditorToolbar';
export { A4ContentEditable, A4Placeholder } from '../components/Editor/A4ContentEditable';
export { FloatingToolbar } from '../components/Editor/FloatingToolbar';
export { ZoomControl } from '../components/Editor/ZoomControl';
export { useTableActions } from '../components/Editor/TableActions';
export { ImageComponent } from '../components/Editor/ImageComponent';

// Special Tables
export { HistoryTable } from '../components/Editor/SpecialTables/HistoryTable';
export { ProductsTable } from '../components/Editor/SpecialTables/ProductsTable';
export { ValidationTable } from '../components/Editor/SpecialTables/ValidationTable';

// ============================================================================
// COLLABORATION COMPONENTS
// ============================================================================
export {
  CollaborationStatus,
  CollaboratorCursors,
  PresenceIndicator,
} from '../components/Collaboration';

// ============================================================================
// COMMENTS COMPONENTS
// ============================================================================
export {
  CommentPanel,
  CommentThread as CommentThreadComponent,
  CommentInput,
  CommentItem,
  AlignedCommentPanel,
} from '../components/Comments';

// ============================================================================
// FOLIOS (PAGES) COMPONENTS
// ============================================================================
export {
  FolioPanel,
  FolioThumbnail,
  FolioSortableList,
  SortableFolioThumbnail,
} from '../components/Folios';

// ============================================================================
// REVISIONS (TRACK CHANGES) COMPONENTS
// ============================================================================
export {
  RevisionPanel,
  RevisionItem,
} from '../components/Revisions';

// ============================================================================
// HEADER/FOOTER COMPONENTS
// ============================================================================
export {
  HeaderFooterEditorModal,
} from '../components/HeaderFooter';

// ============================================================================
// SHORTCUTS MENUS COMPONENTS
// ============================================================================
export {
  SlashMenu,
  AtMenu,
  PlusMenu,
  MentionPill,
} from '../components/Shortcuts';

// ============================================================================
// SLOTS COMPONENTS
// ============================================================================
export { SlotMarker } from '../components/Slots';

// ============================================================================
// QUERY BUILDER COMPONENTS
// ============================================================================
export { QueryBuilder } from '../components/QueryBuilder/QueryBuilder';

// ============================================================================
// IMPORT/EXPORT COMPONENTS
// ============================================================================
export { ExportDialog } from '../components/Export/ExportDialog';
export { DocxExportDialog } from '../components/Export/DocxExportDialog';
export { ImportDialog } from '../components/Import/ImportDialog';

// ============================================================================
// UI COMPONENTS
// ============================================================================
export { ErrorBoundary } from '../components/ErrorBoundary';

// ============================================================================
// ZUSTAND STORES
// ============================================================================
export {
  // Folio Store
  useFolioStore,
  useActiveFolio,
  useFoliosInOrder,
  useActiveFolioId,
  // Header/Footer Store
  useHeaderFooterStore,
  useDefaultHeader,
  useDefaultFooter,
  useHeaderForFolio,
  useFooterForFolio,
  // Revision Store
  useRevisionStore,
  // Comment Store
  useCommentStore,
  // Slot Store
  useSlotStore,
  // Footnote Store
  useFootnoteStore,
  // Query Builder Store
  useQueryBuilderStore,
  // Spell Check Store
  useSpellCheckStore,
  // Style Store
  useStyleStore,
} from '../stores';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================
export { useFolios } from '../hooks/useFolios';
export { useFolioThumbnails } from '../hooks/useFolioThumbnails';
export { useFolioDragDrop } from '../hooks/useFolioDragDrop';
export { useFolioScroll } from '../hooks/useFolioScroll';
export { useHeaderFooter } from '../hooks/useHeaderFooter';
export { useCommentAlignment } from '../hooks/useCommentAlignment';
export { useCollaboration } from '../hooks/useCollaboration';
export { usePresence } from '../hooks/usePresence';
export { useTypeahead } from '../hooks/useTypeahead';
export { useAutoSave } from '../hooks/useAutoSave';
export { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';

// ============================================================================
// LEXICAL NODES
// ============================================================================
export { CommentNode, $createCommentNode, $isCommentNode } from '../nodes/CommentNode';
export { DeletionNode, $createDeletionNode, $isDeletionNode } from '../nodes/DeletionNode';
export { InsertionNode, $createInsertionNode, $isInsertionNode } from '../nodes/InsertionNode';
export { DynamicFieldNode, $createDynamicFieldNode, $isDynamicFieldNode } from '../nodes/DynamicFieldNode';
export { FolioNode, $createFolioNode, $isFolioNode } from '../nodes/FolioNode';
export { HeaderNode, $createHeaderNode, $isHeaderNode } from '../nodes/HeaderNode';
export { FooterNode, $createFooterNode, $isFooterNode } from '../nodes/FooterNode';
export { ImageNode, $createImageNode, $isImageNode } from '../nodes/ImageNode';
export { MentionNode, $createMentionNode, $isMentionNode } from '../nodes/MentionNode';
export { PageNumberNode, $createPageNumberNode, $isPageNumberNode } from '../nodes/PageNumberNode';
export { SlotNode, $createSlotNode, $isSlotNode } from '../nodes/SlotNode';
export { FootnoteNode, $createFootnoteNode, $isFootnoteNode } from '../nodes/FootnoteNode';

// ============================================================================
// LEXICAL PLUGINS
// ============================================================================
export { A4LayoutPlugin } from '../plugins/A4LayoutPlugin';
export { AtMenuPlugin } from '../plugins/AtMenuPlugin';
export { ClipboardImportPlugin } from '../plugins/ClipboardImportPlugin';
export { CollaborationPlugin } from '../plugins/CollaborationPlugin';
export { CommentAlignmentPlugin } from '../plugins/CommentAlignmentPlugin';
export { CommentPlugin } from '../plugins/CommentPlugin';
export { CursorPlugin } from '../plugins/CursorPlugin';
export { ExportPlugin } from '../plugins/ExportPlugin';
export { FloatingToolbarPlugin } from '../plugins/FloatingToolbarPlugin';
export { FolioPlugin } from '../plugins/FolioPlugin';
export { FolioScrollSyncPlugin } from '../plugins/FolioScrollSyncPlugin';
export { FootnotePlugin } from '../plugins/FootnotePlugin';
export { HeaderFooterPlugin } from '../plugins/HeaderFooterPlugin';
export { ImagePlugin } from '../plugins/ImagePlugin';
export { PDFBackgroundPlugin } from '../plugins/PDFBackgroundPlugin';
export { PageNumberingPlugin } from '../plugins/PageNumberingPlugin';
export { PlusMenuPlugin } from '../plugins/PlusMenuPlugin';
export { QueryBuilderPlugin } from '../plugins/QueryBuilderPlugin';
export { SlashMenuPlugin } from '../plugins/SlashMenuPlugin';
export { SlotPlugin } from '../plugins/SlotPlugin';
export { SpecialTablePlugin } from '../plugins/SpecialTablePlugin';
export { SpellCheckPlugin } from '../plugins/SpellCheckPlugin';
export { SymbolPickerPlugin } from '../plugins/SymbolPickerPlugin';
export { TablePlugin } from '../plugins/TablePlugin';
export { TrackChangesPlugin } from '../plugins/TrackChangesPlugin';

// ============================================================================
// UTILITIES
// ============================================================================
export { A4_CONSTANTS, getPageDimensions, mmToPx, pxToMm } from '../utils/a4-constants';
export type { Orientation } from '../utils/a4-constants';
export { exportToPDF } from '../utils/pdfExport';
export { exportToDocx } from '../utils/docxExport';
export { importPDF } from '../utils/pdfImport';

// ============================================================================
// TYPES
// ============================================================================
export type {
  Folio,
  FolioSection,
  FolioStatus,
} from '../types/folio';

export type {
  Slot,
  SlotType,
  SlotMetadata,
} from '../types/slot';

export type {
  Comment,
  CommentThread,
  CommentType,
} from '../types/comment';

export type {
  Revision,
  RevisionType,
} from '../types/revision';

export type {
  CollaborationUser,
  ConnectionStatus,
  CollaborationState,
} from '../types/collaboration';

export type {
  HeaderFooterContent,
} from '../types/headerFooter';

export type {
  MentionData,
  MentionType,
} from '../types/mention';

export type {
  QueryCondition,
  QueryConditionGroup,
  LogicalOperator,
} from '../types/queryBuilder';

export type {
  SlashMenuItem,
} from '../types/slashMenu';
export { SLASH_MENU_CATEGORIES } from '../types/slashMenu';

export type {
  PdfExportOptions,
} from '../types/export';

export type {
  Footnote,
} from '../types/footnote';

export type {
  SpellCheckLanguage,
} from '../types/spellcheck';

// ============================================================================
// CONFIGURATION
// ============================================================================
export { createEditorConfig, defaultEditorConfig } from '../config';

// ============================================================================
// THEME
// ============================================================================
export { editorTheme } from '../theme/editorTheme';
