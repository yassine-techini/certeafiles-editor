export type SlotType =
  | 'dynamic_content'
  | 'at_fetcher'
  | 'donnee'
  | 'ancre'
  | 'section_speciale'
  | 'commentaire';

export type SlotRole = 'start' | 'end';

export interface SlotMetadata {
  label?: string;
  source?: string;      // For at_fetcher
  field?: string;       // For donnee
  anchorId?: string;    // For ancre
  sectionType?: string; // For section_speciale
}

export interface Slot {
  id: string;
  type: SlotType;
  startKey: string;     // Lexical node key
  endKey: string;
  metadata: SlotMetadata;
  defaultValue?: string;
}

export const SLOT_COLORS: Record<SlotType, string> = {
  dynamic_content: '#3B82F6',   // Blue
  at_fetcher: '#8B5CF6',        // Violet
  donnee: '#22C55E',            // Green
  ancre: '#F59E0B',             // Amber
  section_speciale: '#EC4899',  // Pink
  commentaire: '#EF4444',       // Red
} as const;
