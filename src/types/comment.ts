/**
 * Comment Types - Document commenting and annotation system
 * Per Constitution Section 6 - Comments & Collaboration
 */

/**
 * Comment type/category
 */
export type CommentType =
  | 'remark'      // General remark
  | 'question'    // Question for clarification
  | 'suggestion'  // Suggested change
  | 'correction'  // Correction needed
  | 'validation'  // Validation/approval
  | 'blocker';    // Blocking issue

/**
 * Comment thread status
 */
export type CommentStatus = 'open' | 'resolved' | 'closed';

/**
 * User/author information
 */
export interface User {
  /** User ID */
  id: string;
  /** Display name */
  name: string;
  /** Email */
  email: string;
  /** Avatar URL (optional) */
  avatarUrl?: string | undefined;
  /** User color for highlights */
  color: string;
}

/**
 * Mention (@user) in comment content
 */
export interface Mention {
  /** Mentioned user ID */
  userId: string;
  /** Character offset in content */
  offset: number;
  /** Length of mention text */
  length: number;
}

/**
 * Individual comment in a thread
 */
export interface Comment {
  /** Unique comment ID */
  id: string;
  /** Parent thread ID */
  threadId: string;
  /** Comment type */
  type: CommentType;
  /** Comment status (for main comment) */
  status: CommentStatus;
  /** Comment text content */
  content: string;
  /** Comment author */
  author: User;
  /** Mentions in the comment */
  mentions: Mention[];
  /** Creation timestamp */
  createdAt: Date;
  /** Last edit timestamp */
  updatedAt: Date;
  /** Whether this is an edit (not original) */
  isEdited?: boolean | undefined;
}

/**
 * Comment position for sidebar display
 */
export interface CommentPosition {
  /** Thread ID */
  threadId: string;
  /** Original Y position */
  top: number;
  /** Adjusted position after overlap resolution */
  actualTop: number;
  /** Height of the thread UI */
  height: number;
}

/**
 * Comment thread (contains main comment + replies)
 */
export interface CommentThread {
  /** Unique thread ID */
  id: string;
  /** Thread status */
  status: CommentStatus;
  /** Comment type (from main comment) */
  type: CommentType;
  /** All comments in thread (first is the main comment) */
  comments: Comment[];
  /** Associated text content (quoted) */
  quotedText?: string | undefined;
  /** Node key of the CommentNode in the editor */
  nodeKey?: string | undefined;
  /** Position for sidebar display */
  position?: CommentPosition | undefined;
  /** Creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  updatedAt: Date;
  /** User who resolved the thread */
  resolvedBy?: User | undefined;
  /** Resolution timestamp */
  resolvedAt?: Date | undefined;
}

/**
 * Payload for creating a new comment thread
 */
export interface CreateThreadPayload {
  /** Initial comment content */
  content: string;
  /** Comment author */
  author: User;
  /** Comment type */
  type?: CommentType | undefined;
  /** Quoted text from selection */
  quotedText?: string | undefined;
}

/**
 * Payload for adding a reply to a thread
 */
export interface AddReplyPayload {
  /** Thread ID to reply to */
  threadId: string;
  /** Reply content */
  content: string;
  /** Reply author */
}

/**
 * Comment filter options
 */
export interface CommentFilter {
  /** Filter by status */
  status?: CommentStatus | undefined;
  /** Filter by type */
  type?: CommentType | undefined;
  /** Filter by author ID */
  authorId?: string | undefined;
  /** Search in comment content */
  searchText?: string | undefined;
}

/**
 * Comment colors by type (with full color set)
 */
export const COMMENT_COLORS: Record<CommentType, string> = {
  remark: '#6B7280',
  question: '#3B82F6',
  suggestion: '#22C55E',
  correction: '#F59E0B',
  validation: '#10B981',
  blocker: '#EF4444',
} as const;

/**
 * Comment type colors with bg, border, text
 */
export const COMMENT_TYPE_COLORS: Record<CommentType, { bg: string; border: string; text: string }> = {
  remark: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' },
  question: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  suggestion: { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
  correction: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
  validation: { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  blocker: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
};

/**
 * Comment type labels
 */
export const COMMENT_TYPE_LABELS: Record<CommentType, string> = {
  remark: 'Remark',
  question: 'Question',
  suggestion: 'Suggestion',
  correction: 'Correction',
  validation: 'Validation',
  blocker: 'Blocker',
};

/**
 * Comment status labels
 */
export const COMMENT_STATUS_LABELS: Record<CommentStatus, string> = {
  open: 'Open',
  resolved: 'Resolved',
  closed: 'Closed',
};

/**
 * Create a new comment
 */
export function createComment(
  id: string,
  threadId: string,
  author: User,
  content: string,
  type: CommentType = 'remark'
): Comment {
  const now = new Date();
  return {
    id,
    threadId,
    type,
    status: 'open',
    content,
    author,
    mentions: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create a new comment thread
 */
export function createThreadFromComment(
  id: string,
  author: User,
  content: string,
  type: CommentType = 'remark',
  quotedText?: string
): CommentThread {
  const now = new Date();
  const mainComment = createComment(`${id}-0`, id, author, content, type);

  return {
    id,
    status: 'open',
    type,
    comments: [mainComment],
    quotedText,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Check if a thread matches a filter
 */
export function threadMatchesFilter(
  thread: CommentThread,
  filter: CommentFilter
): boolean {
  if (filter.status && thread.status !== filter.status) {
    return false;
  }

  if (filter.type && thread.type !== filter.type) {
    return false;
  }

  if (filter.authorId) {
    const hasAuthor = thread.comments.some(
      (comment) => comment.author.id === filter.authorId
    );
    if (!hasAuthor) {
      return false;
    }
  }

  if (filter.searchText) {
    const searchLower = filter.searchText.toLowerCase();
    const hasMatch = thread.comments.some(
      (comment) => comment.content.toLowerCase().includes(searchLower)
    );
    if (!hasMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Get the main comment from a thread
 */
export function getMainComment(thread: CommentThread): Comment | undefined {
  return thread.comments[0];
}

/**
 * Get replies from a thread (excluding main comment)
 */
export function getReplies(thread: CommentThread): Comment[] {
  return thread.comments.slice(1);
}

/**
 * Get reply count for a thread
 */
export function getReplyCount(thread: CommentThread): number {
  return Math.max(0, thread.comments.length - 1);
}
