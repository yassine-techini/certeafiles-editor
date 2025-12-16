import type { SerializedEditorState } from 'lexical';

export type FolioOrientation = 'portrait' | 'landscape';
export type NumberingStyle = 'continuous' | 'reset' | 'roman' | 'alpha' | 'none';

export interface Folio {
  id: string;
  index: number;
  sectionId: string | null;
  orientation: FolioOrientation;
  content: SerializedEditorState | null;
  headerId: string | null;
  footerId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolioSection {
  id: string;
  name: string;
  index: number;
  collapsed: boolean;
  numberingStyle: NumberingStyle;
}

export interface FolioCreatePayload {
  afterId?: string;
  orientation?: FolioOrientation;
  sectionId?: string | null;
}
