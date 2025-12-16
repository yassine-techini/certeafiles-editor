export type CommentType =
  | 'remark'
  | 'question'
  | 'suggestion'
  | 'correction'
  | 'validation'
  | 'blocker';

export type CommentStatus = 'open' | 'resolved' | 'closed';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  color: string;
}

export interface Mention {
  userId: string;
  offset: number;
  length: number;
}

export interface Comment {
  id: string;
  threadId: string;
  slotId: string;
  type: CommentType;
  status: CommentStatus;
  content: string;
  author: User;
  mentions: Mention[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentThread {
  id: string;
  slotId: string;
  comments: Comment[];
  status: CommentStatus;
  position: CommentPosition;
}

export interface CommentPosition {
  threadId: string;
  top: number;         // Original Y position
  actualTop: number;   // Position after overlap resolution
  height: number;
}

export const COMMENT_COLORS: Record<CommentType, string> = {
  remark: '#6B7280',
  question: '#3B82F6',
  suggestion: '#22C55E',
  correction: '#F59E0B',
  validation: '#10B981',
  blocker: '#EF4444',
} as const;
