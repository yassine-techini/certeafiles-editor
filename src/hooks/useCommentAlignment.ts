/**
 * useCommentAlignment - Hook for calculating aligned comment positions
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import type { CommentThread } from '../types/comment';

/** Minimum gap between comment threads in pixels */
const MIN_GAP = 8;

/** Default thread height estimate when not yet measured */
const DEFAULT_THREAD_HEIGHT = 120;

/**
 * Position data for a single comment thread
 */
export interface ThreadPosition {
  /** Thread ID */
  threadId: string;
  /** Original Y position from anchor element */
  anchorTop: number;
  /** Adjusted Y position after resolving overlaps */
  alignedTop: number;
  /** Measured height of the thread UI */
  height: number;
  /** Whether the anchor is currently visible */
  isAnchorVisible: boolean;
  /** Left position of anchor (for connector line) */
  anchorLeft: number;
  /** Width of anchor element */
  anchorWidth: number;
}

/**
 * Map of thread ID to position data
 */
export type ThreadPositionMap = Map<string, ThreadPosition>;

/**
 * Options for useCommentAlignment hook
 */
export interface UseCommentAlignmentOptions {
  /** Container element for the editor */
  editorContainer: HTMLElement | null;
  /** Container element for the comment panel */
  panelContainer: HTMLElement | null;
  /** List of active threads */
  threads: CommentThread[];
  /** Whether alignment is enabled */
  enabled?: boolean;
  /** Debounce delay for position updates in ms */
  debounceMs?: number;
}

/**
 * Result of useCommentAlignment hook
 */
export interface UseCommentAlignmentResult {
  /** Map of thread positions */
  positions: ThreadPositionMap;
  /** Update a thread's measured height */
  updateThreadHeight: (threadId: string, height: number) => void;
  /** Force recalculation of all positions */
  recalculate: () => void;
  /** Whether positions are currently being calculated */
  isCalculating: boolean;
}

/**
 * Get the anchor element for a thread
 */
function getAnchorElement(threadId: string): HTMLElement | null {
  return document.querySelector(`[data-comment-thread-id="${threadId}"]`);
}

/**
 * Calculate raw positions from anchor elements
 */
function calculateRawPositions(
  threads: CommentThread[],
  editorContainer: HTMLElement | null,
  panelContainer: HTMLElement | null,
  heightMap: Map<string, number>
): ThreadPosition[] {
  if (!editorContainer || !panelContainer) {
    return [];
  }

  const editorRect = editorContainer.getBoundingClientRect();
  const panelRect = panelContainer.getBoundingClientRect();

  const positions: ThreadPosition[] = [];

  for (const thread of threads) {
    const anchor = getAnchorElement(thread.id);

    if (anchor) {
      const anchorRect = anchor.getBoundingClientRect();

      // Calculate position relative to panel container
      const anchorTop = anchorRect.top - panelRect.top + panelContainer.scrollTop;
      const anchorLeft = anchorRect.left - editorRect.left;

      // Check if anchor is visible in viewport
      const isAnchorVisible =
        anchorRect.top >= editorRect.top &&
        anchorRect.bottom <= editorRect.bottom;

      positions.push({
        threadId: thread.id,
        anchorTop,
        alignedTop: anchorTop, // Will be adjusted for overlaps
        height: heightMap.get(thread.id) || DEFAULT_THREAD_HEIGHT,
        isAnchorVisible,
        anchorLeft,
        anchorWidth: anchorRect.width,
      });
    } else {
      // Thread without anchor - position at end
      const lastPos = positions.length > 0
        ? positions[positions.length - 1]
        : null;
      const top = lastPos
        ? lastPos.alignedTop + lastPos.height + MIN_GAP
        : 0;

      positions.push({
        threadId: thread.id,
        anchorTop: top,
        alignedTop: top,
        height: heightMap.get(thread.id) || DEFAULT_THREAD_HEIGHT,
        isAnchorVisible: false,
        anchorLeft: 0,
        anchorWidth: 0,
      });
    }
  }

  return positions;
}

/**
 * Resolve overlapping threads by pushing down
 */
function resolveOverlaps(positions: ThreadPosition[]): ThreadPosition[] {
  if (positions.length === 0) return positions;

  // Sort by anchor position
  const sorted = [...positions].sort((a, b) => a.anchorTop - b.anchorTop);

  // Resolve overlaps
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const minTop = prev.alignedTop + prev.height + MIN_GAP;

    if (curr.alignedTop < minTop) {
      curr.alignedTop = minTop;
    }
  }

  return sorted;
}

/**
 * Hook for calculating aligned comment positions
 */
export function useCommentAlignment({
  editorContainer,
  panelContainer,
  threads,
  enabled = true,
  debounceMs = 100,
}: UseCommentAlignmentOptions): UseCommentAlignmentResult {
  const [positions, setPositions] = useState<ThreadPositionMap>(new Map());
  const [isCalculating, setIsCalculating] = useState(false);

  // Store measured heights
  const heightMapRef = useRef<Map<string, number>>(new Map());

  // Debounce timer ref
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Calculate and update all positions
   */
  const recalculate = useCallback(() => {
    if (!enabled || !editorContainer || !panelContainer) {
      return;
    }

    setIsCalculating(true);

    // Calculate raw positions
    const rawPositions = calculateRawPositions(
      threads,
      editorContainer,
      panelContainer,
      heightMapRef.current
    );

    // Resolve overlaps
    const resolvedPositions = resolveOverlaps(rawPositions);

    // Convert to map
    const positionMap = new Map<string, ThreadPosition>();
    for (const pos of resolvedPositions) {
      positionMap.set(pos.threadId, pos);
    }

    setPositions(positionMap);
    setIsCalculating(false);
  }, [enabled, editorContainer, panelContainer, threads]);

  /**
   * Debounced recalculation
   */
  const debouncedRecalculate = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      recalculate();
    }, debounceMs);
  }, [recalculate, debounceMs]);

  /**
   * Update a thread's measured height
   */
  const updateThreadHeight = useCallback(
    (threadId: string, height: number) => {
      const currentHeight = heightMapRef.current.get(threadId);
      if (currentHeight !== height) {
        heightMapRef.current.set(threadId, height);
        debouncedRecalculate();
      }
    },
    [debouncedRecalculate]
  );

  // Initial calculation and recalculate on dependency changes
  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // Set up scroll listener on editor container
  useEffect(() => {
    if (!editorContainer || !enabled) return;

    const handleScroll = () => {
      debouncedRecalculate();
    };

    editorContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      editorContainer.removeEventListener('scroll', handleScroll);
    };
  }, [editorContainer, enabled, debouncedRecalculate]);

  // Set up resize observer with proper cleanup
  useEffect(() => {
    // Early return if disabled - no observer created
    if (!enabled) return;
    if (!editorContainer || !panelContainer) return;

    const resizeObserver = new ResizeObserver(() => {
      // Double-check enabled state inside callback to handle rapid state changes
      debouncedRecalculate();
    });

    resizeObserver.observe(editorContainer);
    resizeObserver.observe(panelContainer);

    // Cleanup function - always disconnect observer
    return () => {
      resizeObserver.disconnect();
    };
  }, [editorContainer, panelContainer, enabled, debouncedRecalculate]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    positions,
    updateThreadHeight,
    recalculate,
    isCalculating,
  };
}

export default useCommentAlignment;
