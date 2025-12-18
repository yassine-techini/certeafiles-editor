// Zustand stores
// Per Constitution Section 3.2

export {
  useFolioStore,
  useActiveFolio,
  useFoliosInOrder,
  useActiveFolioId,
} from './folioStore';
export type { FolioState } from './folioStore';

export {
  useHeaderFooterStore,
  useDefaultHeader,
  useDefaultFooter,
  useHeaderForFolio,
  useFooterForFolio,
} from './headerFooterStore';
export type { HeaderFooterState } from './headerFooterStore';

export { useRevisionStore } from './revisionStore';
export type { RevisionState } from './revisionStore';

// Future exports:
// export { useCommentStore } from './commentStore';
