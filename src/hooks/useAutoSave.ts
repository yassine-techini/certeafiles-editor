/**
 * useAutoSave - Debounced auto-save hook with performance tracking
 * Per Constitution Section 3.2
 */
import { useCallback, useRef, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { SerializedEditorState } from 'lexical';
import { performanceMonitor, METRIC_NAMES, PERFORMANCE_TARGETS } from '../utils/performance';

export interface UseAutoSaveOptions {
  /** Debounce delay in ms (default: 1000) */
  debounceMs?: number;
  /** Callback when save is triggered */
  onSave?: (content: SerializedEditorState) => void | Promise<void>;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Save on unmount */
  saveOnUnmount?: boolean;
  /** Max wait time before forced save (default: 5000) */
  maxWaitMs?: number;
}

export interface UseAutoSaveReturn {
  /** Trigger immediate save */
  saveNow: () => Promise<void>;
  /** Whether a save is pending */
  isPending: boolean;
  /** Last saved content hash */
  lastSavedHash: string | null;
  /** Time since last save in ms */
  timeSinceLastSave: number | null;
}

/**
 * Simple hash function for content comparison
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * useAutoSave - Provides debounced auto-save functionality
 */
export function useAutoSave(options: UseAutoSaveOptions = {}): UseAutoSaveReturn {
  const {
    debounceMs = 1000,
    onSave,
    enabled = true,
    saveOnUnmount = true,
    maxWaitMs = 5000,
  } = options;

  const [editor] = useLexicalComposerContext();

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const lastSavedHashRef = useRef<string | null>(null);
  const isPendingRef = useRef(false);
  const pendingContentRef = useRef<SerializedEditorState | null>(null);
  const firstChangeTimeRef = useRef<number | null>(null);

  /**
   * Perform the actual save
   */
  const performSave = useCallback(async (content: SerializedEditorState) => {
    if (!onSave) return;

    const contentString = JSON.stringify(content);
    const contentHash = hashContent(contentString);

    // Skip if content hasn't changed
    if (contentHash === lastSavedHashRef.current) {
      isPendingRef.current = false;
      pendingContentRef.current = null;
      firstChangeTimeRef.current = null;
      return;
    }

    performanceMonitor.startMark(METRIC_NAMES.AUTO_SAVE);

    try {
      await onSave(content);
      lastSavedHashRef.current = contentHash;
      lastSaveTimeRef.current = Date.now();
    } catch (error) {
      console.error('[useAutoSave] Save failed:', error);
    } finally {
      performanceMonitor.endMark(METRIC_NAMES.AUTO_SAVE, PERFORMANCE_TARGETS.AUTO_SAVE);
      isPendingRef.current = false;
      pendingContentRef.current = null;
      firstChangeTimeRef.current = null;
    }
  }, [onSave]);

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback((content: SerializedEditorState) => {
    if (!enabled) return;

    isPendingRef.current = true;
    pendingContentRef.current = content;

    // Track first change time for max wait
    if (firstChangeTimeRef.current === null) {
      firstChangeTimeRef.current = Date.now();
    }

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Clear existing max wait timer
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
    }

    // Calculate time since first change
    const timeSinceFirstChange = Date.now() - (firstChangeTimeRef.current ?? Date.now());

    // If we've been waiting too long, save immediately
    if (timeSinceFirstChange >= maxWaitMs) {
      performSave(content);
      return;
    }

    // Schedule debounced save
    debounceTimerRef.current = setTimeout(() => {
      performSave(content);
    }, debounceMs);

    // Schedule max wait timer
    const remainingMaxWait = maxWaitMs - timeSinceFirstChange;
    if (remainingMaxWait > 0) {
      maxWaitTimerRef.current = setTimeout(() => {
        if (pendingContentRef.current) {
          performSave(pendingContentRef.current);
        }
      }, remainingMaxWait);
    }
  }, [enabled, debounceMs, maxWaitMs, performSave]);

  /**
   * Handle editor changes
   */
  useEffect(() => {
    if (!enabled || !onSave) return;

    const removeListener = editor.registerUpdateListener(({ editorState, tags }) => {
      // Skip history merges and collaboration updates
      if (tags.has('history-merge') || tags.has('collaboration')) {
        return;
      }

      const content = editorState.toJSON();
      scheduleSave(content);
    });

    return removeListener;
  }, [editor, enabled, onSave, scheduleSave]);

  /**
   * Save immediately
   */
  const saveNow = useCallback(async () => {
    // Clear pending timers
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxWaitTimerRef.current) {
      clearTimeout(maxWaitTimerRef.current);
      maxWaitTimerRef.current = null;
    }

    // Get current content and save
    const editorState = editor.getEditorState();
    const content = editorState.toJSON();
    await performSave(content);
  }, [editor, performSave]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Clear timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (maxWaitTimerRef.current) {
        clearTimeout(maxWaitTimerRef.current);
      }

      // Save pending content on unmount with error handling
      if (saveOnUnmount && pendingContentRef.current && onSave) {
        try {
          const result = onSave(pendingContentRef.current);
          // Handle async onSave - catch errors to prevent silent failures
          if (result && typeof result.catch === 'function') {
            result.catch((error: unknown) => {
              console.error('[useAutoSave] Failed to save on unmount:', error);
            });
          }
        } catch (error) {
          console.error('[useAutoSave] Failed to save on unmount:', error);
        }
      }
    };
  }, [saveOnUnmount, onSave]);

  return {
    saveNow,
    isPending: isPendingRef.current,
    lastSavedHash: lastSavedHashRef.current,
    timeSinceLastSave: lastSaveTimeRef.current
      ? Date.now() - lastSaveTimeRef.current
      : null,
  };
}

/**
 * Create a standalone debounced save function (for use outside React)
 */
export function createDebouncedSave(
  saveFunction: (content: SerializedEditorState) => void | Promise<void>,
  options: { debounceMs?: number; maxWaitMs?: number } = {}
) {
  const { debounceMs = 1000, maxWaitMs = 5000 } = options;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimer: ReturnType<typeof setTimeout> | null = null;
  let firstChangeTime: number | null = null;
  let lastContent: SerializedEditorState | null = null;
  let lastHash: string | null = null;

  const performSave = async (content: SerializedEditorState) => {
    const contentString = JSON.stringify(content);
    const contentHash = hashContent(contentString);

    if (contentHash === lastHash) return;

    performanceMonitor.startMark(METRIC_NAMES.AUTO_SAVE);
    try {
      await saveFunction(content);
      lastHash = contentHash;
    } finally {
      performanceMonitor.endMark(METRIC_NAMES.AUTO_SAVE, PERFORMANCE_TARGETS.AUTO_SAVE);
      firstChangeTime = null;
      lastContent = null;
    }
  };

  return {
    schedule: (content: SerializedEditorState) => {
      lastContent = content;

      if (firstChangeTime === null) {
        firstChangeTime = Date.now();
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);

      const timeSinceFirstChange = Date.now() - firstChangeTime;

      if (timeSinceFirstChange >= maxWaitMs) {
        performSave(content);
        return;
      }

      debounceTimer = setTimeout(() => performSave(content), debounceMs);

      const remainingMaxWait = maxWaitMs - timeSinceFirstChange;
      if (remainingMaxWait > 0) {
        maxWaitTimer = setTimeout(() => {
          if (lastContent) performSave(lastContent);
        }, remainingMaxWait);
      }
    },

    flush: async () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
      if (lastContent) await performSave(lastContent);
    },

    cancel: () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (maxWaitTimer) clearTimeout(maxWaitTimer);
      firstChangeTime = null;
      lastContent = null;
    },
  };
}

export default useAutoSave;
