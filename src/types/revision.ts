/**
 * Revision (Track Changes) types and interfaces
 * Per Constitution Section 6 - Track Changes
 */

/**
 * Type of revision
 */
export type RevisionType = 'insertion' | 'deletion' | 'format';

/**
 * Status of a revision
 */
export type RevisionStatus = 'pending' | 'accepted' | 'rejected';

/**
 * Author information for a revision
 */
export interface RevisionAuthor {
  /** User ID */
  id: string;
  /** Display name */
  name: string;
  /** Email */
  email?: string | undefined;
  /** Avatar URL */
  avatarUrl?: string | undefined;
  /** Author color for visual distinction */
  color?: string | undefined;
}

/**
 * A single revision entry
 */
export interface Revision {
  /** Unique revision ID */
  id: string;
  /** Type of change */
  type: RevisionType;
  /** Current status */
  status: RevisionStatus;
  /** Content of the change */
  content: string;
  /** Author of the change */
  author: RevisionAuthor;
  /** Timestamp when change was made */
  createdAt: Date;
  /** Node key in the editor */
  nodeKey: string;
  /** Original content (for deletions) */
  originalContent?: string | undefined;
  /** Format changes (for format type) */
  formatChanges?: {
    property: string;
    oldValue: string | boolean | number | null;
    newValue: string | boolean | number | null;
  }[] | undefined;
}

/**
 * View mode for track changes
 */
export type TrackChangesViewMode =
  | 'all_markup'      // Show all changes with markup
  | 'simple_markup'   // Show simplified markup
  | 'no_markup'       // Show final result (accepted changes only)
  | 'original';       // Show original document (before any changes)

/**
 * Colors for revision types
 */
export const REVISION_COLORS = {
  insertion: {
    bg: '#dbeafe',           // Light blue background
    text: '#1e40af',         // Dark blue text
    underline: '#3b82f6',    // Blue underline
  },
  deletion: {
    bg: 'transparent',       // No background
    text: '#3b82f6',         // Blue text
    strikethrough: '#3b82f6', // Blue strikethrough
  },
  format: {
    bg: '#fef3c7',           // Light yellow background
    text: '#92400e',         // Dark yellow text
    border: '#f59e0b',       // Yellow border
  },
} as const;

/**
 * Revision store state interface
 */
export interface RevisionStoreState {
  /** All revisions by ID */
  revisions: Map<string, Revision>;
  /** Whether tracking is enabled */
  trackingEnabled: boolean;
  /** Current view mode */
  viewMode: TrackChangesViewMode;
  /** Current user (author of new changes) */
  currentAuthor: RevisionAuthor;
  /** Show deletions in document */
  showDeletions: boolean;
}

/**
 * Generate a unique revision ID
 */
export function generateRevisionId(): string {
  return `rev-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Default author for anonymous changes
 */
export const DEFAULT_AUTHOR: RevisionAuthor = {
  id: 'anonymous',
  name: 'Utilisateur anonyme',
  color: '#3b82f6',
};

// Collaboration types (kept for future use)

export interface CollaboratorInfo {
  clientId: number;
  user: {
    id: string;
    name: string;
    color: string;
  };
  cursor: CursorPosition | null;
  selection: SelectionRange | null;
  lastActive: Date;
}

export interface CursorPosition {
  x: number;
  y: number;
  folioId: string;
}

export interface SelectionRange {
  start: number;
  end: number;
  folioId: string;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingChanges: number;
}
