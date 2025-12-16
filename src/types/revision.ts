export type RevisionType = 'insertion' | 'deletion' | 'format';
export type RevisionStatus = 'pending' | 'accepted' | 'rejected';

export interface RevisionAuthor {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface Revision {
  id: string;
  type: RevisionType;
  status: RevisionStatus;
  content: string;
  author: RevisionAuthor;
  createdAt: Date;
  nodeKey: string;
}

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
