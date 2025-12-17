/**
 * CommentAlignmentPlugin - Plugin for managing comment alignment observers
 * Per Constitution Section 6 - Comments & Collaboration
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCommentStore } from '../stores/commentStore';

export interface CommentAlignmentPluginProps {
  /** Callback when anchor positions change */
  onPositionsChange?: () => void;
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Whether plugin is enabled */
  enabled?: boolean;
}

/**
 * CommentAlignmentPlugin - Manages observers for comment alignment
 */
export function CommentAlignmentPlugin({
  onPositionsChange,
  debounceMs = 100,
  enabled = true,
}: CommentAlignmentPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const threads = useCommentStore((state) => state.getAllThreads());

  // Refs for observers
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Debounced position change handler
   */
  const handlePositionChange = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onPositionsChange?.();
    }, debounceMs);
  }, [onPositionsChange, debounceMs]);

  /**
   * Set up IntersectionObserver for anchor visibility
   */
  useEffect(() => {
    if (!enabled) return;

    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // Find the scrollable container
    const scrollContainer = rootElement.closest('.overflow-y-auto') || rootElement.parentElement;

    // Create intersection observer
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        // Check if any comment anchors changed visibility
        const hasCommentChanges = entries.some((entry) =>
          entry.target.hasAttribute('data-comment-thread-id')
        );

        if (hasCommentChanges) {
          handlePositionChange();
        }
      },
      {
        root: scrollContainer,
        rootMargin: '50px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe all comment anchor elements
    const commentAnchors = rootElement.querySelectorAll('[data-comment-thread-id]');
    commentAnchors.forEach((anchor) => {
      intersectionObserverRef.current?.observe(anchor);
    });

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [editor, enabled, handlePositionChange, threads]);

  /**
   * Set up MutationObserver to detect new comment anchors
   */
  useEffect(() => {
    if (!enabled) return;

    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    mutationObserverRef.current = new MutationObserver((mutations) => {
      let shouldUpdate = false;

      for (const mutation of mutations) {
        // Check for added nodes with comment attributes
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            if (
              node.hasAttribute('data-comment-thread-id') ||
              node.querySelector('[data-comment-thread-id]')
            ) {
              shouldUpdate = true;

              // Observe new anchor with intersection observer
              if (node.hasAttribute('data-comment-thread-id')) {
                intersectionObserverRef.current?.observe(node);
              }
              node.querySelectorAll('[data-comment-thread-id]').forEach((anchor) => {
                intersectionObserverRef.current?.observe(anchor);
              });
            }
          }
        }

        // Check for removed nodes
        for (const node of Array.from(mutation.removedNodes)) {
          if (node instanceof HTMLElement) {
            if (
              node.hasAttribute('data-comment-thread-id') ||
              node.querySelector('[data-comment-thread-id]')
            ) {
              shouldUpdate = true;
            }
          }
        }

        // Check for attribute changes on comment elements
        if (
          mutation.type === 'attributes' &&
          mutation.target instanceof HTMLElement &&
          mutation.target.hasAttribute('data-comment-thread-id')
        ) {
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        handlePositionChange();
      }
    });

    mutationObserverRef.current.observe(rootElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-comment-thread-id'],
    });

    return () => {
      mutationObserverRef.current?.disconnect();
    };
  }, [editor, enabled, handlePositionChange]);

  /**
   * Listen for editor updates that might affect positions
   */
  useEffect(() => {
    if (!enabled) return;

    const unregister = editor.registerUpdateListener(() => {
      // Small delay to allow DOM to update
      setTimeout(handlePositionChange, 10);
    });

    return unregister;
  }, [editor, enabled, handlePositionChange]);

  /**
   * Handle window resize
   */
  useEffect(() => {
    if (!enabled) return;

    const handleResize = () => {
      handlePositionChange();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled, handlePositionChange]);

  /**
   * Cleanup debounce timer
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return null;
}

export default CommentAlignmentPlugin;
