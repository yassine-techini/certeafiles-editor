/**
 * RevisionStore Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRevisionStore } from '../revisionStore';
import type { RevisionAuthor, RevisionType } from '../../types/revision';

// Mock the generateRevisionId function
vi.mock('../../types/revision', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  let counter = 0;
  return {
    ...actual,
    generateRevisionId: vi.fn(() => `rev-test-${++counter}`),
  };
});

const testAuthor: RevisionAuthor = {
  id: 'author-1',
  name: 'Test Author',
  email: 'author@test.com',
  color: '#3b82f6',
};

const testAuthor2: RevisionAuthor = {
  id: 'author-2',
  name: 'Test Author 2',
  email: 'author2@test.com',
  color: '#22c55e',
};

describe('revisionStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useRevisionStore.getState();
    store.clearAll();
    store.disableTracking();
    store.setViewMode('all_markup');
    store.setShowDeletions(true);
    store.setCurrentAuthor({ id: 'anonymous', name: 'Utilisateur anonyme', color: '#3b82f6' });
  });

  describe('addRevision', () => {
    it('should add a new revision', () => {
      const store = useRevisionStore.getState();
      const revisionId = store.addRevision({
        type: 'insertion',
        content: 'New text',
        author: testAuthor,
        nodeKey: 'node-1',
      });

      expect(revisionId).toBeTruthy();
      const revision = store.getRevision(revisionId);
      expect(revision).toBeDefined();
      expect(revision?.type).toBe('insertion');
      expect(revision?.content).toBe('New text');
      expect(revision?.status).toBe('pending');
    });

    it('should set status to pending by default', () => {
      const store = useRevisionStore.getState();
      const revisionId = store.addRevision({
        type: 'deletion',
        content: 'Deleted text',
        author: testAuthor,
        nodeKey: 'node-2',
      });

      const revision = store.getRevision(revisionId);
      expect(revision?.status).toBe('pending');
    });

    it('should set createdAt timestamp', () => {
      const store = useRevisionStore.getState();
      const before = new Date();
      const revisionId = store.addRevision({
        type: 'insertion',
        content: 'New text',
        author: testAuthor,
        nodeKey: 'node-3',
      });
      const after = new Date();

      const revision = store.getRevision(revisionId);
      expect(revision?.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(revision?.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('removeRevision', () => {
    it('should remove a revision', () => {
      const store = useRevisionStore.getState();
      const revisionId = store.addRevision({
        type: 'insertion',
        content: 'New text',
        author: testAuthor,
        nodeKey: 'node-1',
      });

      store.removeRevision(revisionId);

      expect(store.getRevision(revisionId)).toBeUndefined();
    });
  });

  describe('acceptRevision', () => {
    it('should accept a pending revision', () => {
      const store = useRevisionStore.getState();
      const revisionId = store.addRevision({
        type: 'insertion',
        content: 'New text',
        author: testAuthor,
        nodeKey: 'node-1',
      });

      store.acceptRevision(revisionId);

      const revision = store.getRevision(revisionId);
      expect(revision?.status).toBe('accepted');
    });

    it('should handle non-existent revision gracefully', () => {
      const store = useRevisionStore.getState();

      expect(() => store.acceptRevision('non-existent')).not.toThrow();
    });
  });

  describe('rejectRevision', () => {
    it('should reject a pending revision', () => {
      const store = useRevisionStore.getState();
      const revisionId = store.addRevision({
        type: 'insertion',
        content: 'New text',
        author: testAuthor,
        nodeKey: 'node-1',
      });

      store.rejectRevision(revisionId);

      const revision = store.getRevision(revisionId);
      expect(revision?.status).toBe('rejected');
    });
  });

  describe('acceptAll', () => {
    it('should accept all pending revisions', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Text 1',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'deletion',
        content: 'Text 2',
        author: testAuthor,
        nodeKey: 'node-2',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Text 3',
        author: testAuthor,
        nodeKey: 'node-3',
      });

      store.acceptAll();

      const counts = store.getRevisionCount();
      expect(counts.pending).toBe(0);
      expect(counts.accepted).toBe(3);
    });

    it('should not change already accepted/rejected revisions', () => {
      const store = useRevisionStore.getState();
      const rev1 = store.addRevision({
        type: 'insertion',
        content: 'Text 1',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      const rev2 = store.addRevision({
        type: 'deletion',
        content: 'Text 2',
        author: testAuthor,
        nodeKey: 'node-2',
      });

      store.rejectRevision(rev1);
      store.acceptAll();

      expect(store.getRevision(rev1)?.status).toBe('rejected');
      expect(store.getRevision(rev2)?.status).toBe('accepted');
    });
  });

  describe('rejectAll', () => {
    it('should reject all pending revisions', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Text 1',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'deletion',
        content: 'Text 2',
        author: testAuthor,
        nodeKey: 'node-2',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Text 3',
        author: testAuthor,
        nodeKey: 'node-3',
      });

      store.rejectAll();

      const counts = store.getRevisionCount();
      expect(counts.pending).toBe(0);
      expect(counts.rejected).toBe(3);
    });
  });

  describe('acceptByAuthor', () => {
    it('should accept all revisions by a specific author', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Author 1 text',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Author 2 text',
        author: testAuthor2,
        nodeKey: 'node-2',
      });
      store.addRevision({
        type: 'deletion',
        content: 'Author 1 deletion',
        author: testAuthor,
        nodeKey: 'node-3',
      });

      store.acceptByAuthor('author-1');

      const author1Revisions = store.getRevisionsByAuthor('author-1');
      const author2Revisions = store.getRevisionsByAuthor('author-2');

      expect(author1Revisions.every((r) => r.status === 'accepted')).toBe(true);
      expect(author2Revisions.every((r) => r.status === 'pending')).toBe(true);
    });
  });

  describe('rejectByAuthor', () => {
    it('should reject all revisions by a specific author', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Author 1 text',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Author 2 text',
        author: testAuthor2,
        nodeKey: 'node-2',
      });
      store.addRevision({
        type: 'deletion',
        content: 'Author 1 deletion',
        author: testAuthor,
        nodeKey: 'node-3',
      });

      store.rejectByAuthor('author-1');

      const author1Revisions = store.getRevisionsByAuthor('author-1');
      const author2Revisions = store.getRevisionsByAuthor('author-2');

      expect(author1Revisions.every((r) => r.status === 'rejected')).toBe(true);
      expect(author2Revisions.every((r) => r.status === 'pending')).toBe(true);
    });
  });

  describe('tracking control', () => {
    it('should enable tracking', () => {
      expect(useRevisionStore.getState().trackingEnabled).toBe(false);

      useRevisionStore.getState().enableTracking();

      expect(useRevisionStore.getState().trackingEnabled).toBe(true);
    });

    it('should disable tracking', () => {
      useRevisionStore.getState().enableTracking();

      useRevisionStore.getState().disableTracking();

      expect(useRevisionStore.getState().trackingEnabled).toBe(false);
    });

    it('should toggle tracking', () => {
      expect(useRevisionStore.getState().trackingEnabled).toBe(false);

      useRevisionStore.getState().toggleTracking();
      expect(useRevisionStore.getState().trackingEnabled).toBe(true);

      useRevisionStore.getState().toggleTracking();
      expect(useRevisionStore.getState().trackingEnabled).toBe(false);
    });
  });

  describe('view mode', () => {
    it('should set view mode', () => {
      useRevisionStore.getState().setViewMode('no_markup');

      expect(useRevisionStore.getState().viewMode).toBe('no_markup');
    });

    it('should support all view modes', () => {
      const modes = ['all_markup', 'simple_markup', 'no_markup', 'original'] as const;

      for (const mode of modes) {
        useRevisionStore.getState().setViewMode(mode);
        expect(useRevisionStore.getState().viewMode).toBe(mode);
      }
    });
  });

  describe('setShowDeletions', () => {
    it('should set show deletions flag', () => {
      useRevisionStore.getState().setShowDeletions(false);

      expect(useRevisionStore.getState().showDeletions).toBe(false);
    });
  });

  describe('setCurrentAuthor', () => {
    it('should set current author', () => {
      useRevisionStore.getState().setCurrentAuthor(testAuthor);

      expect(useRevisionStore.getState().currentAuthor).toEqual(testAuthor);
    });
  });

  describe('getPendingRevisions', () => {
    it('should return only pending revisions', () => {
      const store = useRevisionStore.getState();
      const rev1 = store.addRevision({
        type: 'insertion',
        content: 'Text 1',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'deletion',
        content: 'Text 2',
        author: testAuthor,
        nodeKey: 'node-2',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Text 3',
        author: testAuthor,
        nodeKey: 'node-3',
      });

      store.acceptRevision(rev1);

      const pending = store.getPendingRevisions();
      expect(pending).toHaveLength(2);
      expect(pending.every((r) => r.status === 'pending')).toBe(true);
    });
  });

  describe('getRevisionsByType', () => {
    it('should return revisions of a specific type', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Text 1',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'deletion',
        content: 'Text 2',
        author: testAuthor,
        nodeKey: 'node-2',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Text 3',
        author: testAuthor,
        nodeKey: 'node-3',
      });

      const insertions = store.getRevisionsByType('insertion');
      const deletions = store.getRevisionsByType('deletion');

      expect(insertions).toHaveLength(2);
      expect(deletions).toHaveLength(1);
    });
  });

  describe('getRevisionsByAuthor', () => {
    it('should return revisions by author', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Author 1 text',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Author 2 text',
        author: testAuthor2,
        nodeKey: 'node-2',
      });

      const author1Revisions = store.getRevisionsByAuthor('author-1');

      expect(author1Revisions).toHaveLength(1);
      expect(author1Revisions[0].author.id).toBe('author-1');
    });
  });

  describe('getRevisionByNodeKey', () => {
    it('should find revision by node key', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Text',
        author: testAuthor,
        nodeKey: 'unique-node-key',
      });

      const revision = store.getRevisionByNodeKey('unique-node-key');

      expect(revision).toBeDefined();
      expect(revision?.nodeKey).toBe('unique-node-key');
    });

    it('should return undefined for unknown node key', () => {
      const store = useRevisionStore.getState();

      const revision = store.getRevisionByNodeKey('unknown');

      expect(revision).toBeUndefined();
    });
  });

  describe('getRevisionCount', () => {
    it('should return correct counts', () => {
      const store = useRevisionStore.getState();
      const rev1 = store.addRevision({
        type: 'insertion',
        content: 'Text 1',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      const rev2 = store.addRevision({
        type: 'deletion',
        content: 'Text 2',
        author: testAuthor,
        nodeKey: 'node-2',
      });
      store.addRevision({
        type: 'insertion',
        content: 'Text 3',
        author: testAuthor,
        nodeKey: 'node-3',
      });

      store.acceptRevision(rev1);
      store.rejectRevision(rev2);

      const counts = store.getRevisionCount();
      expect(counts.total).toBe(3);
      expect(counts.pending).toBe(1);
      expect(counts.accepted).toBe(1);
      expect(counts.rejected).toBe(1);
    });
  });

  describe('updateRevisionNodeKey', () => {
    it('should update node key of a revision', () => {
      const store = useRevisionStore.getState();
      const revisionId = store.addRevision({
        type: 'insertion',
        content: 'Text',
        author: testAuthor,
        nodeKey: 'old-node-key',
      });

      store.updateRevisionNodeKey(revisionId, 'new-node-key');

      const revision = store.getRevision(revisionId);
      expect(revision?.nodeKey).toBe('new-node-key');
    });
  });

  describe('clearAll', () => {
    it('should clear all revisions', () => {
      const store = useRevisionStore.getState();
      store.addRevision({
        type: 'insertion',
        content: 'Text 1',
        author: testAuthor,
        nodeKey: 'node-1',
      });
      store.addRevision({
        type: 'deletion',
        content: 'Text 2',
        author: testAuthor,
        nodeKey: 'node-2',
      });

      store.clearAll();

      const counts = store.getRevisionCount();
      expect(counts.total).toBe(0);
    });
  });
});
