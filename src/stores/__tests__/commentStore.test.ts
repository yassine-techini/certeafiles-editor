/**
 * CommentStore Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCommentStore } from '../commentStore';
import type { User } from '../../types/comment';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => `test-uuid-${Math.random().toString(36).substring(7)}`),
}));

const testUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  color: '#3b82f6',
};

const testUser2: User = {
  id: 'user-2',
  name: 'Test User 2',
  email: 'test2@example.com',
  color: '#22c55e',
};

describe('commentStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCommentStore.getState().clear();
    useCommentStore.getState().setCurrentUser(null);
  });

  describe('setCurrentUser', () => {
    it('should set the current user', () => {
      useCommentStore.getState().setCurrentUser(testUser);

      expect(useCommentStore.getState().currentUser).toEqual(testUser);
    });

    it('should allow clearing current user', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.setCurrentUser(null);

      expect(store.currentUser).toBeNull();
    });
  });

  describe('createThread', () => {
    it('should create a new thread', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);

      const threadId = store.createThread('Test comment');

      expect(threadId).toBeTruthy();
      const thread = store.getThread(threadId!);
      expect(thread).toBeDefined();
      expect(thread?.comments[0].content).toBe('Test comment');
    });

    it('should return null if no current user', () => {
      const store = useCommentStore.getState();

      const threadId = store.createThread('Test comment');

      expect(threadId).toBeNull();
    });

    it('should create thread with specific type', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);

      const threadId = store.createThread('Is this correct?', 'question');

      const thread = store.getThread(threadId!);
      expect(thread?.type).toBe('question');
    });

    it('should create thread with quoted text', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);

      const threadId = store.createThread('Comment on this', 'remark', 'Selected text');

      const thread = store.getThread(threadId!);
      expect(thread?.quotedText).toBe('Selected text');
    });

    it('should set new thread as active', () => {
      useCommentStore.getState().setCurrentUser(testUser);

      const threadId = useCommentStore.getState().createThread('Test comment');

      expect(useCommentStore.getState().activeThreadId).toBe(threadId);
    });
  });

  describe('addReply', () => {
    it('should add a reply to a thread', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Original comment');

      const replyId = store.addReply(threadId!, 'This is a reply');

      expect(replyId).toBeTruthy();
      const thread = store.getThread(threadId!);
      expect(thread?.comments).toHaveLength(2);
      expect(thread?.comments[1].content).toBe('This is a reply');
    });

    it('should return null if no current user', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Original comment');
      store.setCurrentUser(null);

      const replyId = store.addReply(threadId!, 'This is a reply');

      expect(replyId).toBeNull();
    });

    it('should return null if thread not found', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);

      const replyId = store.addReply('non-existent', 'This is a reply');

      expect(replyId).toBeNull();
    });
  });

  describe('resolveThread', () => {
    it('should resolve an open thread', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Test comment');

      store.resolveThread(threadId!);

      const thread = store.getThread(threadId!);
      expect(thread?.status).toBe('resolved');
      expect(thread?.resolvedBy).toEqual(testUser);
      expect(thread?.resolvedAt).toBeDefined();
    });
  });

  describe('reopenThread', () => {
    it('should reopen a resolved thread', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Test comment');
      store.resolveThread(threadId!);

      store.reopenThread(threadId!);

      const thread = store.getThread(threadId!);
      expect(thread?.status).toBe('open');
      expect(thread?.resolvedBy).toBeUndefined();
      expect(thread?.resolvedAt).toBeUndefined();
    });
  });

  describe('closeThread', () => {
    it('should close a thread', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Test comment');

      store.closeThread(threadId!);

      const thread = store.getThread(threadId!);
      expect(thread?.status).toBe('closed');
    });
  });

  describe('deleteThread', () => {
    it('should delete a thread', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Test comment');

      store.deleteThread(threadId!);

      expect(store.getThread(threadId!)).toBeUndefined();
    });

    it('should clear active thread if deleting active', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Test comment');

      store.deleteThread(threadId!);

      expect(store.activeThreadId).toBeNull();
    });
  });

  describe('editComment', () => {
    it('should edit a comment in a thread', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Original content');
      const commentId = store.getThread(threadId!)!.comments[0].id;

      store.editComment(threadId!, commentId, 'Updated content');

      const thread = store.getThread(threadId!);
      expect(thread?.comments[0].content).toBe('Updated content');
      expect(thread?.comments[0].isEdited).toBe(true);
    });
  });

  describe('deleteComment', () => {
    it('should delete a reply comment', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Original comment');
      const replyId = store.addReply(threadId!, 'Reply to delete');

      store.deleteComment(threadId!, replyId!);

      const thread = store.getThread(threadId!);
      expect(thread?.comments).toHaveLength(1);
    });

    it('should not delete the main comment', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Main comment');
      const mainCommentId = store.getThread(threadId!)!.comments[0].id;

      store.deleteComment(threadId!, mainCommentId);

      const thread = store.getThread(threadId!);
      expect(thread?.comments).toHaveLength(1);
    });
  });

  describe('filterByType', () => {
    it('should filter threads by type', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.createThread('Remark 1', 'remark');
      store.createThread('Question 1', 'question');
      store.createThread('Remark 2', 'remark');
      store.createThread('Suggestion 1', 'suggestion');

      const remarks = store.filterByType('remark');
      const questions = store.filterByType('question');

      expect(remarks).toHaveLength(2);
      expect(questions).toHaveLength(1);
      expect(remarks.every((t) => t.type === 'remark')).toBe(true);
    });
  });

  describe('filterByAuthor', () => {
    it('should filter threads by author', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.createThread('Comment by user 1');
      store.createThread('Another by user 1');
      store.setCurrentUser(testUser2);
      store.createThread('Comment by user 2');

      const user1Threads = store.filterByAuthor('user-1');
      const user2Threads = store.filterByAuthor('user-2');

      expect(user1Threads).toHaveLength(2);
      expect(user2Threads).toHaveLength(1);
    });
  });

  describe('filterByStatus', () => {
    it('should filter threads by status', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const thread1 = store.createThread('Thread 1');
      store.createThread('Thread 2');
      const thread3 = store.createThread('Thread 3');

      store.resolveThread(thread1!);
      store.closeThread(thread3!);

      const openThreads = store.filterByStatus('open');
      const resolvedThreads = store.filterByStatus('resolved');
      const closedThreads = store.filterByStatus('closed');

      expect(openThreads).toHaveLength(1);
      expect(resolvedThreads).toHaveLength(1);
      expect(closedThreads).toHaveLength(1);
    });
  });

  describe('filterThreads', () => {
    it('should filter threads by multiple criteria', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.createThread('Question about code', 'question');
      const t2 = store.createThread('Another question', 'question');
      store.createThread('A remark', 'remark');

      store.resolveThread(t2!);

      const filtered = store.filterThreads({
        type: 'question',
        status: 'open',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe('question');
      expect(filtered[0].status).toBe('open');
    });

    it('should filter by search text', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.createThread('Comment about testing');
      store.createThread('Another comment');
      store.createThread('Testing is important');

      const filtered = store.filterThreads({ searchText: 'testing' });

      expect(filtered).toHaveLength(2);
    });
  });

  describe('getOpenThreads', () => {
    it('should return only open threads', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.createThread('Thread 1');
      const t2 = store.createThread('Thread 2');
      store.createThread('Thread 3');

      store.resolveThread(t2!);

      const openThreads = store.getOpenThreads();

      expect(openThreads).toHaveLength(2);
      expect(openThreads.every((t) => t.status === 'open')).toBe(true);
    });
  });

  describe('getResolvedThreads', () => {
    it('should return only resolved threads', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const t1 = store.createThread('Thread 1');
      const t2 = store.createThread('Thread 2');
      store.createThread('Thread 3');

      store.resolveThread(t1!);
      store.resolveThread(t2!);

      const resolvedThreads = store.getResolvedThreads();

      expect(resolvedThreads).toHaveLength(2);
      expect(resolvedThreads.every((t) => t.status === 'resolved')).toBe(true);
    });
  });

  describe('getThreadByNodeKey', () => {
    it('should find thread by node key', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      const threadId = store.createThread('Test comment');
      store.setThreadNodeKey(threadId!, 'node-123');

      const thread = store.getThreadByNodeKey('node-123');

      expect(thread).toBeDefined();
      expect(thread?.id).toBe(threadId);
    });

    it('should return undefined for unknown node key', () => {
      const store = useCommentStore.getState();

      const thread = store.getThreadByNodeKey('unknown');

      expect(thread).toBeUndefined();
    });
  });

  describe('setActiveThread', () => {
    it('should set active thread', () => {
      useCommentStore.getState().setCurrentUser(testUser);
      const t1 = useCommentStore.getState().createThread('Thread 1');
      useCommentStore.getState().createThread('Thread 2');

      useCommentStore.getState().setActiveThread(t1);

      expect(useCommentStore.getState().activeThreadId).toBe(t1);
    });
  });

  describe('resolveAllThreads', () => {
    it('should resolve all open threads', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.createThread('Thread 1');
      store.createThread('Thread 2');
      store.createThread('Thread 3');

      store.resolveAllThreads();

      const allThreads = store.getAllThreads();
      expect(allThreads.every((t) => t.status === 'resolved')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all threads', () => {
      const store = useCommentStore.getState();
      store.setCurrentUser(testUser);
      store.createThread('Thread 1');
      store.createThread('Thread 2');

      store.clear();

      expect(store.getAllThreads()).toHaveLength(0);
      expect(store.activeThreadId).toBeNull();
    });
  });
});
