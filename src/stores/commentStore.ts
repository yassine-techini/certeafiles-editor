/**
 * Comment Store - Zustand state management for comments
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  type CommentThread,
  type CommentType,
  type CommentStatus,
  type CommentFilter,
  type User,
  createComment,
  createThreadFromComment,
  threadMatchesFilter,
} from '../types/comment';

/**
 * Pending comment state for Google Docs-like UX
 */
export interface PendingComment {
  quotedText: string;
  selectionKey: string;
}

/**
 * Comment store state interface
 */
export interface CommentState {
  // All comment threads
  threads: Map<string, CommentThread>;

  // Currently active thread (selected)
  activeThreadId: string | null;

  // Current user for authoring
  currentUser: User | null;

  // Pending comment (waiting for user input in side panel)
  pendingComment: PendingComment | null;

  // Computed helpers
  getThread: (id: string) => CommentThread | undefined;
  getThreadByNodeKey: (nodeKey: string) => CommentThread | undefined;
  getAllThreads: () => CommentThread[];
  getOpenThreads: () => CommentThread[];
  getResolvedThreads: () => CommentThread[];

  // Filter helpers
  filterByType: (type: CommentType) => CommentThread[];
  filterByAuthor: (authorId: string) => CommentThread[];
  filterByStatus: (status: CommentStatus) => CommentThread[];
  filterThreads: (filter: CommentFilter) => CommentThread[];

  // Thread actions
  createThread: (
    content: string,
    type?: CommentType,
    quotedText?: string
  ) => string | null;
  addReply: (threadId: string, content: string) => string | null;
  resolveThread: (threadId: string) => void;
  reopenThread: (threadId: string) => void;
  closeThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;

  // Comment actions
  editComment: (threadId: string, commentId: string, content: string) => void;
  deleteComment: (threadId: string, commentId: string) => void;

  // Node key management
  setThreadNodeKey: (threadId: string, nodeKey: string) => void;

  // Active thread management
  setActiveThread: (threadId: string | null) => void;

  // User management
  setCurrentUser: (user: User | null) => void;

  // Pending comment management
  startPendingComment: (quotedText: string, selectionKey: string) => void;
  cancelPendingComment: () => void;
  submitPendingComment: (content: string, type?: CommentType) => string | null;

  // Bulk actions
  clear: () => void;
  resolveAllThreads: () => void;
}

/**
 * Create the comment store
 */
export const useCommentStore = create<CommentState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      threads: new Map<string, CommentThread>(),
      activeThreadId: null,
      currentUser: null,
      pendingComment: null,

      // Computed helpers
      getThread: (id: string) => get().threads.get(id),

      getThreadByNodeKey: (nodeKey: string) => {
        for (const thread of get().threads.values()) {
          if (thread.nodeKey === nodeKey) {
            return thread;
          }
        }
        return undefined;
      },

      getAllThreads: () => Array.from(get().threads.values()),

      getOpenThreads: () => {
        const threads: CommentThread[] = [];
        for (const thread of get().threads.values()) {
          if (thread.status === 'open') {
            threads.push(thread);
          }
        }
        return threads;
      },

      getResolvedThreads: () => {
        const threads: CommentThread[] = [];
        for (const thread of get().threads.values()) {
          if (thread.status === 'resolved') {
            threads.push(thread);
          }
        }
        return threads;
      },

      // Filter helpers
      filterByType: (type: CommentType) => {
        const threads: CommentThread[] = [];
        for (const thread of get().threads.values()) {
          if (thread.type === type) {
            threads.push(thread);
          }
        }
        return threads;
      },

      filterByAuthor: (authorId: string) => {
        const threads: CommentThread[] = [];
        for (const thread of get().threads.values()) {
          const hasAuthor = thread.comments.some(
            (comment) => comment.author.id === authorId
          );
          if (hasAuthor) {
            threads.push(thread);
          }
        }
        return threads;
      },

      filterByStatus: (status: CommentStatus) => {
        const threads: CommentThread[] = [];
        for (const thread of get().threads.values()) {
          if (thread.status === status) {
            threads.push(thread);
          }
        }
        return threads;
      },

      filterThreads: (filter: CommentFilter) => {
        const threads: CommentThread[] = [];
        for (const thread of get().threads.values()) {
          if (threadMatchesFilter(thread, filter)) {
            threads.push(thread);
          }
        }
        return threads;
      },

      // Thread actions
      createThread: (content, type = 'remark', quotedText) => {
        const { currentUser } = get();
        if (!currentUser) {
          console.warn('[CommentStore] Cannot create thread: no current user');
          return null;
        }

        const id = uuidv4();
        const thread = createThreadFromComment(id, currentUser, content, type, quotedText);

        set((state) => {
          const newThreads = new Map(state.threads);
          newThreads.set(id, thread);
          return { threads: newThreads, activeThreadId: id };
        });

        console.log('[CommentStore] Created thread:', id);
        return id;
      },

      addReply: (threadId, content) => {
        const { currentUser, threads } = get();
        if (!currentUser) {
          console.warn('[CommentStore] Cannot add reply: no current user');
          return null;
        }

        const thread = threads.get(threadId);
        if (!thread) {
          console.warn('[CommentStore] Thread not found:', threadId);
          return null;
        }

        const commentId = `${threadId}-${thread.comments.length}`;
        const reply = createComment(commentId, threadId, currentUser, content, thread.type);

        set((state) => {
          const existingThread = state.threads.get(threadId);
          if (!existingThread) return state;

          const newThreads = new Map(state.threads);
          newThreads.set(threadId, {
            ...existingThread,
            comments: [...existingThread.comments, reply],
            updatedAt: new Date(),
          });
          return { threads: newThreads };
        });

        console.log('[CommentStore] Added reply to thread:', threadId);
        return commentId;
      },

      resolveThread: (threadId) => {
        const { currentUser } = get();

        set((state) => {
          const thread = state.threads.get(threadId);
          if (!thread) return state;

          const newThreads = new Map(state.threads);
          newThreads.set(threadId, {
            ...thread,
            status: 'resolved',
            resolvedBy: currentUser ?? undefined,
            resolvedAt: new Date(),
            updatedAt: new Date(),
          });
          return { threads: newThreads };
        });

        console.log('[CommentStore] Resolved thread:', threadId);
      },

      reopenThread: (threadId) => {
        set((state) => {
          const thread = state.threads.get(threadId);
          if (!thread) return state;

          const newThreads = new Map(state.threads);
          newThreads.set(threadId, {
            ...thread,
            status: 'open',
            resolvedBy: undefined,
            resolvedAt: undefined,
            updatedAt: new Date(),
          });
          return { threads: newThreads };
        });

        console.log('[CommentStore] Reopened thread:', threadId);
      },

      closeThread: (threadId) => {
        set((state) => {
          const thread = state.threads.get(threadId);
          if (!thread) return state;

          const newThreads = new Map(state.threads);
          newThreads.set(threadId, {
            ...thread,
            status: 'closed',
            updatedAt: new Date(),
          });
          return { threads: newThreads };
        });

        console.log('[CommentStore] Closed thread:', threadId);
      },

      deleteThread: (threadId) => {
        set((state) => {
          const newThreads = new Map(state.threads);
          newThreads.delete(threadId);

          // Clear active thread if it was deleted
          const newActiveId =
            state.activeThreadId === threadId ? null : state.activeThreadId;

          return { threads: newThreads, activeThreadId: newActiveId };
        });

        console.log('[CommentStore] Deleted thread:', threadId);
      },

      // Comment actions
      editComment: (threadId, commentId, content) => {
        set((state) => {
          const thread = state.threads.get(threadId);
          if (!thread) return state;

          const newComments = thread.comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  content,
                  updatedAt: new Date(),
                  isEdited: true,
                }
              : comment
          );

          const newThreads = new Map(state.threads);
          newThreads.set(threadId, {
            ...thread,
            comments: newComments,
            updatedAt: new Date(),
          });
          return { threads: newThreads };
        });

        console.log('[CommentStore] Edited comment:', commentId);
      },

      deleteComment: (threadId, commentId) => {
        set((state) => {
          const thread = state.threads.get(threadId);
          if (!thread) return state;

          // Don't delete the main comment (first comment)
          if (thread.comments[0]?.id === commentId) {
            console.warn('[CommentStore] Cannot delete main comment');
            return state;
          }

          const newComments = thread.comments.filter(
            (comment) => comment.id !== commentId
          );

          const newThreads = new Map(state.threads);
          newThreads.set(threadId, {
            ...thread,
            comments: newComments,
            updatedAt: new Date(),
          });
          return { threads: newThreads };
        });

        console.log('[CommentStore] Deleted comment:', commentId);
      },

      // Node key management
      setThreadNodeKey: (threadId, nodeKey) => {
        set((state) => {
          const thread = state.threads.get(threadId);
          if (!thread) return state;

          const newThreads = new Map(state.threads);
          newThreads.set(threadId, {
            ...thread,
            nodeKey,
          });
          return { threads: newThreads };
        });
      },

      // Active thread management
      setActiveThread: (threadId) => {
        set({ activeThreadId: threadId });
      },

      // User management
      setCurrentUser: (user) => {
        set({ currentUser: user });
        console.log('[CommentStore] Set current user:', user?.name);
      },

      // Pending comment management
      startPendingComment: (quotedText, selectionKey) => {
        set({
          pendingComment: { quotedText, selectionKey },
        });
        console.log('[CommentStore] Started pending comment for:', quotedText.slice(0, 50));
      },

      cancelPendingComment: () => {
        set({ pendingComment: null });
        console.log('[CommentStore] Cancelled pending comment');
      },

      submitPendingComment: (content, type = 'remark') => {
        const { pendingComment, currentUser } = get();
        if (!pendingComment) {
          console.warn('[CommentStore] No pending comment to submit');
          return null;
        }
        if (!currentUser) {
          console.warn('[CommentStore] Cannot submit comment: no current user');
          return null;
        }

        const id = uuidv4();
        const thread = createThreadFromComment(
          id,
          currentUser,
          content,
          type,
          pendingComment.quotedText
        );

        set((state) => {
          const newThreads = new Map(state.threads);
          newThreads.set(id, thread);
          return {
            threads: newThreads,
            activeThreadId: id,
            pendingComment: null,
          };
        });

        console.log('[CommentStore] Submitted pending comment as thread:', id);
        return id;
      },

      // Bulk actions
      clear: () => {
        set({
          threads: new Map(),
          activeThreadId: null,
        });
        console.log('[CommentStore] Cleared all threads');
      },

      resolveAllThreads: () => {
        const { currentUser } = get();

        set((state) => {
          const newThreads = new Map<string, CommentThread>();
          const now = new Date();

          for (const [id, thread] of state.threads) {
            if (thread.status === 'open') {
              newThreads.set(id, {
                ...thread,
                status: 'resolved',
                resolvedBy: currentUser ?? undefined,
                resolvedAt: now,
                updatedAt: now,
              });
            } else {
              newThreads.set(id, thread);
            }
          }

          return { threads: newThreads };
        });

        console.log('[CommentStore] Resolved all threads');
      },
    })),
    { name: 'comment-store' }
  )
);

/**
 * Selector hooks for common use cases
 */
export const useThread = (id: string) =>
  useCommentStore((state) => state.getThread(id));

export const useAllThreads = () =>
  useCommentStore((state) => state.getAllThreads());

export const useOpenThreads = () =>
  useCommentStore((state) => state.getOpenThreads());

export const useActiveThread = () =>
  useCommentStore((state) => {
    const activeId = state.activeThreadId;
    return activeId ? state.getThread(activeId) : undefined;
  });

export const useCurrentUser = () =>
  useCommentStore((state) => state.currentUser);

export default useCommentStore;
