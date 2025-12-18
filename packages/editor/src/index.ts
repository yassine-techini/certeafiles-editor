/**
 * @certeafiles/editor
 *
 * A professional WYSIWYG document editor built with Lexical.
 * Features: Track changes, slots, comments, PDF export, shortcuts (/, @, +)
 */

// Main Editor Component
export { CerteafilesEditor } from './components/Editor/CerteafilesEditor';
export type { CerteafilesEditorProps } from './components/Editor/CerteafilesEditor';

// Editor Configuration
export { editorConfig, editorNodes } from './components/Editor/editorConfig';

// Toolbar
export { EditorToolbar } from './components/Editor/Toolbar/EditorToolbar';

// Plugins
export { SlashMenuPlugin } from './plugins/SlashMenuPlugin';
export { MentionPlugin } from './plugins/MentionPlugin';
export { SlotPlugin, INSERT_SLOT_COMMAND, OPEN_SLOT_PANEL_COMMAND } from './plugins/SlotPlugin';
export { CommentPlugin, INSERT_COMMENT_COMMAND, TOGGLE_COMMENTS_COMMAND } from './plugins/CommentPlugin';
export { TrackChangesPlugin, TOGGLE_TRACK_CHANGES_COMMAND, SAVE_VERSION_COMMAND, RESTORE_VERSION_COMMAND, ACCEPT_REVISION_COMMAND, REJECT_REVISION_COMMAND, ACCEPT_ALL_REVISIONS_COMMAND, REJECT_ALL_REVISIONS_COMMAND } from './plugins/TrackChangesPlugin';
export { FootnotePlugin, INSERT_FOOTNOTE_COMMAND } from './plugins/FootnotePlugin';
export { ExportPlugin, EXPORT_PDF_COMMAND, EXPORT_DOCX_COMMAND, OPEN_EXPORT_DIALOG_COMMAND } from './plugins/ExportPlugin';
export { QueryBuilderPlugin, OPEN_QUERY_BUILDER_COMMAND, INSERT_QUERY_COMMAND, EXECUTE_QUERY_COMMAND } from './plugins/QueryBuilderPlugin';
export { SpecialTablePlugin, INSERT_SPECIAL_TABLE_COMMAND, OPEN_SPECIAL_TABLE_SELECTOR_COMMAND } from './plugins/SpecialTablePlugin';
export { SpellCheckPlugin } from './plugins/SpellCheckPlugin';
export { SymbolPickerPlugin, INSERT_SYMBOL_COMMAND, OPEN_SYMBOL_PICKER_COMMAND } from './plugins/SymbolPickerPlugin';
export { PDFBackgroundPlugin, SET_PDF_BACKGROUND_COMMAND } from './plugins/PDFBackgroundPlugin';

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
export { useSpellcheckStore } from './stores/spellcheckStore';
export { useQueryBuilderStore } from './stores/queryBuilderStore';

// Types
export type { Slot, SlotType, SlotBehavior, SlotStatus } from './types/slot';
export type { Comment, CommentThread, CommentStatus } from './types/comment';
export type { Revision, RevisionType, DocumentVersion, TrackChangesViewMode } from './types/revision';
export type { Footnote, FootnotePosition, FootnoteStyle } from './types/footnote';
export type { DocumentStyle, ParagraphStyle, CharacterStyle } from './types/documentStyles';
export type { PDFExportOptions, DocxExportOptions, ExportFormat, PageOrientation } from './types/docxExport';
export type { QueryDefinition, QueryCondition, QueryConditionGroup, QueryField, QueryFieldType, ComparisonOperator, LogicalOperator, SortDirection, QuerySort, SavedQuery } from './types/queryBuilder';
export type { SpecialTableType, SpecialTableData, ProductsTableData, HistoryTableData, ValidationTableData } from './types/specialTables';
export type { SpellcheckLanguage, SpellcheckResult, SpellcheckSuggestion } from './types/spellcheck';

// Components
export { TrackChangesToolbar } from './components/Revisions/TrackChangesToolbar';
export { QueryBuilder } from './components/QueryBuilder/QueryBuilder';
export { DocxExportDialog } from './components/Export/DocxExportDialog';
export { ProductsTable } from './components/Editor/SpecialTables/ProductsTable';
export { HistoryTable } from './components/Editor/SpecialTables/HistoryTable';
export { ValidationTable } from './components/Editor/SpecialTables/ValidationTable';

// Utilities
export { exportToPDF, createPDFDocument } from './utils/pdfExport';
export { exportToDocx, createDocxDocument } from './utils/docxExport';
export { generateSlotId, createDefaultSlot } from './types/slot';
export { generateCommentId, createComment, createCommentThread } from './types/comment';
export { generateRevisionId, generateVersionId, createDocumentVersion } from './types/revision';
export { createFootnote, generateFootnoteId } from './types/footnote';
export { createDefaultSpecialTable, SPECIAL_TABLE_LABELS } from './types/specialTables';

// Slash Menu
export { SLASH_MENU_ITEMS, getSlashMenuItems } from './components/Editor/SlashMenu/slashMenu';
export type { SlashMenuItem, SlashMenuCategory } from './components/Editor/SlashMenu/slashMenu';
