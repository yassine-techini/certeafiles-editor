/**
 * FolioStore Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFolioStore } from '../folioStore';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => `test-uuid-${Math.random().toString(36).substring(7)}`),
}));

describe('folioStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFolioStore.getState().clear();
  });

  describe('initialize', () => {
    it('should create a default folio when initialized', () => {
      const store = useFolioStore.getState();
      store.initialize();

      const folios = store.getFoliosInOrder();
      expect(folios).toHaveLength(1);
      expect(folios[0].index).toBe(0);
      expect(folios[0].orientation).toBe('portrait');
    });

    it('should not reinitialize if folios exist', () => {
      const store = useFolioStore.getState();
      store.initialize();
      const firstFolioId = store.getFoliosInOrder()[0].id;

      store.initialize();

      const folios = store.getFoliosInOrder();
      expect(folios).toHaveLength(1);
      expect(folios[0].id).toBe(firstFolioId);
    });
  });

  describe('createFolio', () => {
    it('should create a new folio with default values', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio();

      const folio = store.getFolio(id);
      expect(folio).toBeDefined();
      expect(folio?.orientation).toBe('portrait');
      expect(folio?.locked).toBe(false);
      expect(folio?.sectionId).toBeNull();
    });

    it('should create a folio with custom orientation', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio({ orientation: 'landscape' });

      const folio = store.getFolio(id);
      expect(folio?.orientation).toBe('landscape');
    });

    it('should create a folio with custom margins', () => {
      const store = useFolioStore.getState();
      const margins = { top: 30, right: 25, bottom: 30, left: 25 };
      const id = store.createFolio({ margins });

      const folio = store.getFolio(id);
      expect(folio?.margins).toEqual(margins);
    });

    it('should set the new folio as active', () => {
      const id = useFolioStore.getState().createFolio();

      expect(useFolioStore.getState().activeFolioId).toBe(id);
    });

    it('should insert after specified folio', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      const id3 = store.createFolio({ afterId: id1 });

      const folios = store.getFoliosInOrder();
      expect(folios[0].id).toBe(id1);
      expect(folios[1].id).toBe(id3);
      expect(folios[2].id).toBe(id2);
    });

    it('should assign correct indices to new folios', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.createFolio();
      store.createFolio();

      const folios = store.getFoliosInOrder();
      expect(folios[0].index).toBe(0);
      expect(folios[1].index).toBe(1);
      expect(folios[2].index).toBe(2);
    });
  });

  describe('deleteFolio', () => {
    it('should delete an existing folio', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      const id2 = store.createFolio();

      store.deleteFolio(id2);

      expect(store.getFolio(id2)).toBeUndefined();
      expect(store.getFoliosInOrder()).toHaveLength(1);
    });

    it('should not delete the last folio', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio();

      store.deleteFolio(id);

      expect(store.getFolio(id)).toBeDefined();
      expect(store.getFoliosInOrder()).toHaveLength(1);
    });

    it('should reindex remaining folios after deletion', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      const id3 = store.createFolio();

      store.deleteFolio(id2);

      const folios = store.getFoliosInOrder();
      expect(folios).toHaveLength(2);
      expect(folios[0].id).toBe(id1);
      expect(folios[0].index).toBe(0);
      expect(folios[1].id).toBe(id3);
      expect(folios[1].index).toBe(1);
    });

    it('should update active folio when deleting active', () => {
      const id1 = useFolioStore.getState().createFolio();
      const id2 = useFolioStore.getState().createFolio();

      useFolioStore.getState().setActiveFolio(id2);
      useFolioStore.getState().deleteFolio(id2);

      expect(useFolioStore.getState().activeFolioId).toBe(id1);
    });

    it('should handle deleting non-existent folio gracefully', () => {
      const store = useFolioStore.getState();
      store.createFolio();

      expect(() => store.deleteFolio('non-existent')).not.toThrow();
    });
  });

  describe('updateFolio', () => {
    it('should update folio properties', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio();

      store.updateFolio(id, { locked: true });

      expect(store.getFolio(id)?.locked).toBe(true);
    });

    it('should update updatedAt timestamp', () => {
      const id = useFolioStore.getState().createFolio();
      const originalUpdatedAt = useFolioStore.getState().getFolio(id)?.updatedAt;

      useFolioStore.getState().updateFolio(id, { locked: true });

      const newUpdatedAt = useFolioStore.getState().getFolio(id)?.updatedAt;
      expect(newUpdatedAt).toBeDefined();
      expect(newUpdatedAt?.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt?.getTime() ?? 0);
    });

    it('should handle updating non-existent folio gracefully', () => {
      const store = useFolioStore.getState();

      expect(() => store.updateFolio('non-existent', { locked: true })).not.toThrow();
    });
  });

  describe('reorderFolios', () => {
    it('should reorder folios according to new order', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      const id3 = store.createFolio();

      store.reorderFolios([id3, id1, id2]);

      const folios = store.getFoliosInOrder();
      expect(folios[0].id).toBe(id3);
      expect(folios[1].id).toBe(id1);
      expect(folios[2].id).toBe(id2);
    });

    it('should update indices correctly after reorder', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      const id3 = store.createFolio();

      store.reorderFolios([id3, id1, id2]);

      expect(store.getFolio(id3)?.index).toBe(0);
      expect(store.getFolio(id1)?.index).toBe(1);
      expect(store.getFolio(id2)?.index).toBe(2);
    });
  });

  describe('toggleOrientation', () => {
    it('should toggle from portrait to landscape', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio({ orientation: 'portrait' });

      store.toggleOrientation(id);

      expect(store.getFolio(id)?.orientation).toBe('landscape');
    });

    it('should toggle from landscape to portrait', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio({ orientation: 'landscape' });

      store.toggleOrientation(id);

      expect(store.getFolio(id)?.orientation).toBe('portrait');
    });

    it('should handle non-existent folio gracefully', () => {
      const store = useFolioStore.getState();

      expect(() => store.toggleOrientation('non-existent')).not.toThrow();
    });
  });

  describe('setFolioMargins', () => {
    it('should set folio margins', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio();
      const newMargins = { top: 10, right: 15, bottom: 10, left: 15 };

      store.setFolioMargins(id, newMargins);

      expect(store.getFolio(id)?.margins).toEqual(newMargins);
    });
  });

  describe('lockFolio', () => {
    it('should lock a folio', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio();

      store.lockFolio(id, true);

      expect(store.getFolio(id)?.locked).toBe(true);
    });

    it('should unlock a folio', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio();
      store.lockFolio(id, true);

      store.lockFolio(id, false);

      expect(store.getFolio(id)?.locked).toBe(false);
    });
  });

  describe('setActiveFolio', () => {
    it('should set active folio', () => {
      const id1 = useFolioStore.getState().createFolio();
      useFolioStore.getState().createFolio();

      useFolioStore.getState().setActiveFolio(id1);

      expect(useFolioStore.getState().activeFolioId).toBe(id1);
    });

    it('should allow setting active to null', () => {
      useFolioStore.getState().createFolio();

      useFolioStore.getState().setActiveFolio(null);

      expect(useFolioStore.getState().activeFolioId).toBeNull();
    });
  });

  describe('getActiveFolio', () => {
    it('should return the active folio', () => {
      const store = useFolioStore.getState();
      const id = store.createFolio();

      const activeFolio = store.getActiveFolio();

      expect(activeFolio?.id).toBe(id);
    });

    it('should return undefined when no active folio', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.setActiveFolio(null);

      const activeFolio = store.getActiveFolio();

      expect(activeFolio).toBeUndefined();
    });
  });

  describe('getFoliosInOrder', () => {
    it('should return folios sorted by index', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.createFolio();
      store.createFolio();

      const folios = store.getFoliosInOrder();

      for (let i = 1; i < folios.length; i++) {
        expect(folios[i].index).toBeGreaterThan(folios[i - 1].index);
      }
    });
  });

  describe('sections', () => {
    it('should create a section', () => {
      const sectionId = useFolioStore.getState().createSection('Test Section');

      const sections = useFolioStore.getState().sections;
      expect(sections.get(sectionId)).toBeDefined();
      expect(sections.get(sectionId)?.name).toBe('Test Section');
    });

    it('should delete a section and update folios', () => {
      const store = useFolioStore.getState();
      const sectionId = store.createSection('Test Section');
      const folioId = store.createFolio({ sectionId });

      store.deleteSection(sectionId);

      expect(store.sections.get(sectionId)).toBeUndefined();
      expect(store.getFolio(folioId)?.sectionId).toBeNull();
    });

    it('should get folios by section', () => {
      const store = useFolioStore.getState();
      const sectionId = store.createSection('Test Section');
      const id1 = store.createFolio({ sectionId });
      store.createFolio(); // No section
      const id3 = store.createFolio({ sectionId });

      const sectionFolios = store.getFoliosBySection(sectionId);

      expect(sectionFolios).toHaveLength(2);
      expect(sectionFolios.map((f) => f.id)).toContain(id1);
      expect(sectionFolios.map((f) => f.id)).toContain(id3);
    });

    it('should toggle section collapse', () => {
      const sectionId = useFolioStore.getState().createSection('Test Section');

      expect(useFolioStore.getState().sections.get(sectionId)?.collapsed).toBe(false);

      useFolioStore.getState().toggleSectionCollapse(sectionId);

      expect(useFolioStore.getState().sections.get(sectionId)?.collapsed).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.createSection('Test');

      store.clear();

      expect(store.getFoliosInOrder()).toHaveLength(0);
      expect(store.sections.size).toBe(0);
      expect(store.activeFolioId).toBeNull();
    });
  });
});
