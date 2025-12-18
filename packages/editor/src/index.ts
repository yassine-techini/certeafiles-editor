/**
 * @certeafiles/editor
 *
 * A professional WYSIWYG document editor built with Lexical.
 * Features: Track changes, slots, comments, PDF export, shortcuts (/, @, +)
 */

// Main Editor Component
export { CerteafilesEditor } from './components/Editor/CerteafilesEditor';
export type { CerteafilesEditorProps } from './components/Editor/CerteafilesEditor';

// Toolbar
export { EditorToolbar } from './components/Editor/EditorToolbar';

// Plugins
export { SlashMenuPlugin } from './plugins/SlashMenuPlugin';
export { SlotPlugin, INSERT_SLOT_COMMAND } from './plugins/SlotPlugin';
export { CommentPlugin, CREATE_COMMENT_COMMAND, RESOLVE_COMMENT_COMMAND } from './plugins/CommentPlugin';
export {
  TrackChangesPlugin,
  TOGGLE_TRACK_CHANGES_COMMAND,
  SAVE_VERSION_COMMAND,
  RESTORE_VERSION_COMMAND,
  ACCEPT_REVISION_COMMAND,
  REJECT_REVISION_COMMAND,
  ACCEPT_ALL_REVISIONS_COMMAND,
  REJECT_ALL_REVISIONS_COMMAND
} from './plugins/TrackChangesPlugin';
export { FootnotePlugin, INSERT_FOOTNOTE_COMMAND } from './plugins/FootnotePlugin';
export { ExportPlugin, EXPORT_TO_DOCX_COMMAND, OPEN_EXPORT_DIALOG_COMMAND } from './plugins/ExportPlugin';
export { QueryBuilderPlugin, OPEN_QUERY_BUILDER_COMMAND, INSERT_QUERY_COMMAND, EXECUTE_QUERY_COMMAND } from './plugins/QueryBuilderPlugin';
export { SpecialTablePlugin, INSERT_SPECIAL_TABLE_COMMAND, OPEN_SPECIAL_TABLE_SELECTOR_COMMAND } from './plugins/SpecialTablePlugin';
export { SpellCheckPlugin } from './plugins/SpellCheckPlugin';
export { SymbolPickerPlugin, INSERT_SYMBOL_COMMAND, OPEN_SYMBOL_PICKER_COMMAND } from './plugins/SymbolPickerPlugin';
export { PDFBackgroundPlugin } from './plugins/PDFBackgroundPlugin';

// Nodes
export { SlotNode, $createSlotNode, $isSlotNode } from './nodes/SlotNode';
export type { SerializedSlotNode } from './nodes/SlotNode';
export { CommentNode, $createCommentNode, $isCommentNode } from './nodes/CommentNode';
export type { SerializedCommentNode } from './nodes/CommentNode';
export { InsertionNode, $createInsertionNode, $isInsertionNode } from './nodes/InsertionNode';
export type { SerializedInsertionNode } from './nodes/InsertionNode';
export { DeletionNode, $createDeletionNode, $isDeletionNode } from './nodes/DeletionNode';
export type { SerializedDeletionNode } from './nodes/DeletionNode';
export { FootnoteNode, $createFootnoteNode, $isFootnoteNode } from './nodes/FootnoteNode';
export type { SerializedFootnoteNode } from './nodes/FootnoteNode';
export { SpecialTableNode, $createSpecialTableNode, $isSpecialTableNode } from './plugins/SpecialTablePlugin';
export type { SerializedSpecialTableNode } from './plugins/SpecialTablePlugin';

// Stores
export { useSlotStore } from './stores/slotStore';
export { useCommentStore } from './stores/commentStore';
export { useRevisionStore } from './stores/revisionStore';
export { useFootnoteStore } from './stores/footnoteStore';
export { useStyleStore } from './stores/styleStore';
export { useSpellCheckStore } from './stores/spellcheckStore';
export { useQueryBuilderStore } from './stores/queryBuilderStore';

// Types - Slot
export type { Slot, SlotType } from './types/slot';

// Types - Comment
export type { Comment, CommentThread, CommentStatus } from './types/comment';

// Types - Revision
export type { Revision, RevisionType, TrackChangesViewMode } from './types/revision';
export { generateRevisionId } from './types/revision';

// Types - Footnote
export type { Footnote } from './types/footnote';
export { createFootnote } from './types/footnote';

// Types - Document Styles
export type { DocumentStyle } from './types/documentStyles';

// Types - Export
export type { DocxExportOptions, ExportFormat } from './types/docxExport';

// Types - Query Builder
export type {
  QueryCondition,
  QueryConditionGroup,
  QueryField,
  QueryFieldType,
  ComparisonOperator,
  LogicalOperator,
  SortDirection,
  QuerySort
} from './types/queryBuilder';

// Types - Special Tables
export type {
  SpecialTableType,
  SpecialTableData,
  ProductsTableData,
  HistoryTableData,
  ValidationTableData
} from './types/specialTables';

// Types - Spellcheck
export type { SpellCheckLanguage } from './types/spellcheck';

// Components
export { TrackChangesToolbar } from './components/Revisions/TrackChangesToolbar';
export { QueryBuilder } from './components/QueryBuilder/QueryBuilder';
export { DocxExportDialog } from './components/Export/DocxExportDialog';
export { ProductsTable } from './components/Editor/SpecialTables/ProductsTable';
export { HistoryTable } from './components/Editor/SpecialTables/HistoryTable';
export { ValidationTable } from './components/Editor/SpecialTables/ValidationTable';

// Utilities
export { exportToPDF } from './utils/pdfExport';
export { exportToDocx } from './utils/docxExport';
export { createDefaultSpecialTable, SPECIAL_TABLE_LABELS } from './types/specialTables';
export { createComment } from './types/comment';
