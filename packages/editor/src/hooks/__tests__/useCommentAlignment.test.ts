/**
 * useCommentAlignment Hook Tests
 *
 * Tests the hook interface and basic behavior.
 * Note: Full DOM integration tests are skipped due to jsdom memory constraints.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommentAlignment } from '../useCommentAlignment';

describe('useCommentAlignment', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should initialize with empty positions when containers are null', () => {
      const { result } = renderHook(() =>
        useCommentAlignment({
          editorContainer: null,
          panelContainer: null,
          threads: [],
        })
      );

      expect(result.current.positions.size).toBe(0);
      expect(result.current.isCalculating).toBe(false);
    });
  });

  describe('disabled state', () => {
    it('should return empty positions when disabled', () => {
      const { result } = renderHook(() =>
        useCommentAlignment({
          editorContainer: null,
          panelContainer: null,
          threads: [],
          enabled: false,
        })
      );

      expect(result.current.positions.size).toBe(0);
    });
  });

  describe('hook interface', () => {
    it('should return positions map', () => {
      const { result } = renderHook(() =>
        useCommentAlignment({
          editorContainer: null,
          panelContainer: null,
          threads: [],
        })
      );

      expect(result.current.positions).toBeInstanceOf(Map);
    });

    it('should return updateThreadHeight function', () => {
      const { result } = renderHook(() =>
        useCommentAlignment({
          editorContainer: null,
          panelContainer: null,
          threads: [],
        })
      );

      expect(typeof result.current.updateThreadHeight).toBe('function');
    });

    it('should return recalculate function', () => {
      const { result } = renderHook(() =>
        useCommentAlignment({
          editorContainer: null,
          panelContainer: null,
          threads: [],
        })
      );

      expect(typeof result.current.recalculate).toBe('function');
    });

    it('should return isCalculating boolean', () => {
      const { result } = renderHook(() =>
        useCommentAlignment({
          editorContainer: null,
          panelContainer: null,
          threads: [],
        })
      );

      expect(typeof result.current.isCalculating).toBe('boolean');
    });
  });
});
