/**
 * Footnote Types - Types for footnotes management
 * Per Constitution Section 1 - General Features
 */

/**
 * Footnote entry interface
 */
export interface Footnote {
  /** Unique identifier for the footnote */
  id: string;
  /** The footnote content/text */
  content: string;
  /** The display number (1, 2, 3, etc.) */
  number: number;
  /** The folio/page ID where this footnote appears */
  folioId?: string;
  /** When the footnote was created */
  createdAt: Date;
  /** When the footnote was last updated */
  updatedAt: Date;
}

/**
 * Footnote store state
 */
export interface FootnoteState {
  /** Map of footnote ID to footnote data */
  footnotes: Map<string, Footnote>;
  /** Order of footnotes by ID (for numbering) */
  footnoteOrder: string[];
}

/**
 * Default footnote state
 */
export const DEFAULT_FOOTNOTE_STATE: FootnoteState = {
  footnotes: new Map(),
  footnoteOrder: [],
};

/**
 * Create a new footnote
 */
export function createFootnote(
  id: string,
  content: string,
  number: number,
  folioId?: string
): Footnote {
  const now = new Date();
  const footnote: Footnote = {
    id,
    content,
    number,
    createdAt: now,
    updatedAt: now,
  };
  if (folioId !== undefined) {
    footnote.folioId = folioId;
  }
  return footnote;
}

/**
 * Serialized footnote for Lexical node
 */
export interface SerializedFootnoteNode {
  type: 'footnote';
  version: 1;
  footnoteId: string;
  footnoteNumber: number;
}
