/**
 * useFolioNavigation Hook Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFolioNavigation } from '../useFolios';
import { useFolioStore } from '../../stores/folioStore';

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => `test-uuid-${Math.random().toString(36).substring(7)}`),
}));

describe('useFolioNavigation', () => {
  beforeEach(() => {
    // Reset store before each test
    useFolioStore.getState().clear();
  });

  describe('initial state', () => {
    it('should return empty state when no folios exist', () => {
      const { result } = renderHook(() => useFolioNavigation());

      expect(result.current.folios).toHaveLength(0);
      expect(result.current.activeFolioId).toBeNull();
      expect(result.current.currentIndex).toBe(-1);
      expect(result.current.totalFolios).toBe(0);
    });

    it('should return folios when they exist', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.createFolio();

      const { result } = renderHook(() => useFolioNavigation());

      expect(result.current.folios).toHaveLength(2);
      expect(result.current.totalFolios).toBe(2);
    });
  });

  describe('currentIndex', () => {
    it('should return correct index for active folio', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      const id3 = store.createFolio();

      store.setActiveFolio(id2);

      const { result } = renderHook(() => useFolioNavigation());

      expect(result.current.currentIndex).toBe(1);
    });

    it('should return -1 when no active folio', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.setActiveFolio(null);

      const { result } = renderHook(() => useFolioNavigation());

      expect(result.current.currentIndex).toBe(-1);
    });
  });

  describe('goToNextFolio', () => {
    it('should navigate to next folio', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      const id3 = store.createFolio();

      store.setActiveFolio(id1);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToNextFolio();
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id2);
    });

    it('should not navigate past last folio', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      const id2 = store.createFolio();

      store.setActiveFolio(id2);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToNextFolio();
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id2);
    });

    it('should do nothing when no active folio', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.setActiveFolio(null);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToNextFolio();
      });

      expect(useFolioStore.getState().activeFolioId).toBeNull();
    });
  });

  describe('goToPreviousFolio', () => {
    it('should navigate to previous folio', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      store.createFolio();

      store.setActiveFolio(id2);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToPreviousFolio();
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id1);
    });

    it('should not navigate before first folio', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      store.createFolio();

      store.setActiveFolio(id1);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToPreviousFolio();
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id1);
    });

    it('should do nothing when no active folio', () => {
      const store = useFolioStore.getState();
      store.createFolio();
      store.setActiveFolio(null);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToPreviousFolio();
      });

      expect(useFolioStore.getState().activeFolioId).toBeNull();
    });
  });

  describe('goToFolio', () => {
    it('should navigate to folio by index', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();
      const id3 = store.createFolio();

      store.setActiveFolio(id1);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToFolio(2);
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id3);
    });

    it('should not navigate to invalid index (negative)', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      store.createFolio();

      store.setActiveFolio(id1);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToFolio(-1);
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id1);
    });

    it('should not navigate to invalid index (out of bounds)', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      store.createFolio();

      store.setActiveFolio(id1);

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.goToFolio(100);
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id1);
    });
  });

  describe('setActiveFolio', () => {
    it('should set active folio directly', () => {
      const store = useFolioStore.getState();
      const id1 = store.createFolio();
      const id2 = store.createFolio();

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.setActiveFolio(id1);
      });

      expect(useFolioStore.getState().activeFolioId).toBe(id1);
    });

    it('should allow setting to null', () => {
      const store = useFolioStore.getState();
      store.createFolio();

      const { result } = renderHook(() => useFolioNavigation());

      act(() => {
        result.current.setActiveFolio(null);
      });

      expect(useFolioStore.getState().activeFolioId).toBeNull();
    });
  });

  describe('reactivity', () => {
    it('should update when folios change', () => {
      const store = useFolioStore.getState();

      const { result, rerender } = renderHook(() => useFolioNavigation());

      expect(result.current.totalFolios).toBe(0);

      act(() => {
        store.createFolio();
      });

      rerender();

      expect(result.current.totalFolios).toBe(1);
    });
  });
});
