// Lexical plugins
// Per Constitution Section 3.2

export { A4LayoutPlugin } from './A4LayoutPlugin';
export type { A4LayoutPluginProps, A4LayoutInfo } from './A4LayoutPlugin';

export { ImagePlugin } from './ImagePlugin';
export type { ImagePluginProps } from './ImagePlugin';

export {
  TablePlugin,
  INSERT_TABLE_COMMAND,
  OPEN_TABLE_DIALOG_COMMAND,
} from './TablePlugin';
export type { TablePluginProps } from './TablePlugin';

export { FloatingToolbarPlugin } from './FloatingToolbarPlugin';
export type { FloatingToolbarPluginProps } from './FloatingToolbarPlugin';

export { FolioPlugin } from './FolioPlugin';
export type { FolioPluginProps } from './FolioPlugin';

export { FolioScrollSyncPlugin } from './FolioScrollSyncPlugin';
export type { FolioScrollSyncPluginProps } from './FolioScrollSyncPlugin';

export { HeaderFooterPlugin } from './HeaderFooterPlugin';
export type { HeaderFooterPluginProps } from './HeaderFooterPlugin';

export { PageNumberingPlugin } from './PageNumberingPlugin';
export type { PageNumberingPluginProps, SectionNumbering } from './PageNumberingPlugin';

export {
  SlotPlugin,
  INSERT_SLOT_COMMAND,
  REMOVE_SLOT_COMMAND,
  VALIDATE_SLOTS_COMMAND,
} from './SlotPlugin';
export type { SlotPluginProps } from './SlotPlugin';

export {
  CommentPlugin,
  CREATE_COMMENT_COMMAND,
  DELETE_COMMENT_COMMAND,
  RESOLVE_COMMENT_COMMAND,
} from './CommentPlugin';
export type { CommentPluginProps } from './CommentPlugin';

export { CommentAlignmentPlugin } from './CommentAlignmentPlugin';
export type { CommentAlignmentPluginProps } from './CommentAlignmentPlugin';

export { SlashMenuPlugin } from './SlashMenuPlugin';
export type { SlashMenuPluginProps } from './SlashMenuPlugin';

export { AtMenuPlugin } from './AtMenuPlugin';
export type { AtMenuPluginProps } from './AtMenuPlugin';

export { PlusMenuPlugin } from './PlusMenuPlugin';
export type { PlusMenuPluginProps } from './PlusMenuPlugin';

export {
  TrackChangesPlugin,
  TOGGLE_TRACK_CHANGES_COMMAND,
  ACCEPT_REVISION_COMMAND,
  REJECT_REVISION_COMMAND,
  ACCEPT_ALL_REVISIONS_COMMAND,
  REJECT_ALL_REVISIONS_COMMAND,
} from './TrackChangesPlugin';
export type { TrackChangesPluginProps } from './TrackChangesPlugin';

export { CollaborationPlugin } from './CollaborationPlugin';
export type { CollaborationPluginProps } from './CollaborationPlugin';

export { CursorPlugin } from './CursorPlugin';
export type {
  CursorPluginProps,
  CursorState,
  RemoteCursor,
} from './CursorPlugin';
