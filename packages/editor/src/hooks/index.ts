// Custom React hooks
// Per Constitution Section 3.2

export { useFolios, useFolioNavigation } from './useFolios';
export type { UseFoliosOptions, UseFoliosReturn } from './useFolios';

export {
  useFolioThumbnails,
  useFolioThumbnailUpdater,
} from './useFolioThumbnails';
export type {
  ThumbnailData,
  UseFolioThumbnailsOptions,
  UseFolioThumbnailsReturn,
} from './useFolioThumbnails';

export { useFolioDragDrop } from './useFolioDragDrop';
export type {
  UseFolioDragDropOptions,
  UseFolioDragDropReturn,
} from './useFolioDragDrop';

export { useFolioScroll } from './useFolioScroll';
export type {
  UseFolioScrollOptions,
  UseFolioScrollReturn,
} from './useFolioScroll';

export { useHeaderFooter, useAllHeadersFooters } from './useHeaderFooter';
export type { UseHeaderFooterOptions, UseHeaderFooterReturn } from './useHeaderFooter';

export { useCommentAlignment } from './useCommentAlignment';
export type {
  UseCommentAlignmentOptions,
  UseCommentAlignmentResult,
  ThreadPosition,
  ThreadPositionMap,
} from './useCommentAlignment';

export { useTypeahead } from './useTypeahead';
export type {
  TypeaheadItem,
  UseTypeaheadOptions,
  UseTypeaheadResult,
} from './useTypeahead';

export { useCollaboration } from './useCollaboration';
export type {
  UseCollaborationOptions,
  UseCollaborationReturn,
} from './useCollaboration';

export { usePresence } from './usePresence';
export type {
  UsePresenceOptions,
  UsePresenceReturn,
} from './usePresence';

// Future exports:
// export { useSlots } from './useSlots';
// export { useRevisions } from './useRevisions';
// export { useExport } from './useExport';
