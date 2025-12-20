/**
 * Zustand Stores - State Management
 * CerteaFiles Editor
 */

// Folio/Page Store
export {
  useFolioStore,
  useActiveFolio,
  useFoliosInOrder,
  useActiveFolioId,
} from './folioStore';
export type { FolioState } from './folioStore';

// Header/Footer Store
export {
  useHeaderFooterStore,
  useDefaultHeader,
  useDefaultFooter,
  useHeaderForFolio,
  useFooterForFolio,
} from './headerFooterStore';
export type { HeaderFooterState } from './headerFooterStore';

// Revision/Track Changes Store
export { useRevisionStore } from './revisionStore';
export type { RevisionState } from './revisionStore';

// Comment Store
export { useCommentStore } from './commentStore';

// Slot Store
export { useSlotStore } from './slotStore';

// Footnote Store
export { useFootnoteStore } from './footnoteStore';

// Query Builder Store
export { useQueryBuilderStore } from './queryBuilderStore';

// Spell Check Store
export { useSpellCheckStore } from './spellcheckStore';

// Style Store
export { useStyleStore } from './styleStore';
