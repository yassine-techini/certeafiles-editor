/**
 * useFolioScroll - Scroll synchronization between editor and folio panel
 * Per Constitution Section 4.1
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFolioStore } from '../stores/folioStore';

export interface UseFolioScrollOptions {
  /** Debounce delay in ms for scroll updates */
  debounceMs?: number;
  /** Threshold for IntersectionObserver (0-1) */
  threshold?: number;
  /** Root margin for IntersectionObserver */
  rootMargin?: string;
  /** Whether to enable auto-detection of visible folio */
  autoDetect?: boolean;
}

export interface UseFolioScrollReturn {
  /** Currently most visible folio ID */
  visibleFolioId: string | null;
  /** Scroll to a specific folio in the editor */
  scrollToFolio: (folioId: string, behavior?: ScrollBehavior) => void;
  /** Scroll to a specific folio thumbnail in the panel */
  scrollToThumbnail: (folioId: string, behavior?: ScrollBehavior) => void;
  /** Whether scroll sync is currently active */
  isSyncing: boolean;
  /** Temporarily disable sync (e.g., during programmatic scroll) */
  disableSync: () => void;
  /** Re-enable sync */
  enableSync: () => void;
}

/**
 * useFolioScroll - Hook to synchronize scroll between editor and folio panel
 */
export function useFolioScroll(
  options: UseFolioScrollOptions = {}
): UseFolioScrollReturn {
  const {
    debounceMs = 150,
    threshold = 0.5,
    rootMargin = '-10% 0px -10% 0px',
    autoDetect = true,
  } = options;

  const [visibleFolioId, setVisibleFolioId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityMapRef = useRef<Map<string, number>>(new Map());
  const syncDisabledUntilRef = useRef<number>(0);

  // Get store actions
  const setActiveFolio = useFolioStore((state) => state.setActiveFolio);

  // Disable sync temporarily
  const disableSync = useCallback(() => {
    setIsSyncing(false);
    syncDisabledUntilRef.current = Date.now() + 500; // Disable for 500ms
  }, []);

  // Enable sync
  const enableSync = useCallback(() => {
    setIsSyncing(true);
  }, []);

  // Scroll to a folio in the editor
  const scrollToFolio = useCallback(
    (folioId: string, behavior: ScrollBehavior = 'smooth') => {
      // Temporarily disable sync to prevent feedback loop
      disableSync();

      const folioElement = document.querySelector(
        `[data-folio-id="${folioId}"]`
      );

      if (folioElement) {
        // Find the scrollable container (editor area)
        const scrollContainer = folioElement.closest('.overflow-auto');

        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = folioElement.getBoundingClientRect();

          // Calculate scroll position to center the folio
          const scrollTop =
            scrollContainer.scrollTop +
            elementRect.top -
            containerRect.top -
            containerRect.height / 2 +
            elementRect.height / 2;

          scrollContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior,
          });
        } else {
          // Fallback to scrollIntoView
          folioElement.scrollIntoView({
            behavior,
            block: 'center',
          });
        }

        console.log('[useFolioScroll] Scrolled to folio:', folioId);
      }

      // Re-enable sync after animation
      setTimeout(enableSync, 600);
    },
    [disableSync, enableSync]
  );

  // Scroll to a thumbnail in the panel
  const scrollToThumbnail = useCallback(
    (folioId: string, behavior: ScrollBehavior = 'smooth') => {
      const thumbnailElement = document.querySelector(
        `[data-folio-thumbnail="${folioId}"]`
      );

      if (thumbnailElement) {
        thumbnailElement.scrollIntoView({
          behavior,
          block: 'nearest',
        });
      }
    },
    []
  );

  // Update the most visible folio based on intersection ratios
  const updateMostVisibleFolio = useCallback(() => {
    if (!isSyncing || Date.now() < syncDisabledUntilRef.current) {
      return;
    }

    const visibilityMap = visibilityMapRef.current;
    let maxVisibility = 0;
    let mostVisibleId: string | null = null;

    visibilityMap.forEach((ratio, id) => {
      if (ratio > maxVisibility) {
        maxVisibility = ratio;
        mostVisibleId = id;
      }
    });

    if (mostVisibleId && mostVisibleId !== visibleFolioId) {
      setVisibleFolioId(mostVisibleId);
      setActiveFolio(mostVisibleId);
      scrollToThumbnail(mostVisibleId);

      console.log('[useFolioScroll] Most visible folio:', mostVisibleId, 'ratio:', maxVisibility);
    }
  }, [isSyncing, visibleFolioId, setActiveFolio, scrollToThumbnail]);

  // Set up IntersectionObserver
  useEffect(() => {
    if (!autoDetect) return;

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Update visibility map
        entries.forEach((entry) => {
          const folioId = entry.target.getAttribute('data-folio-id');
          if (folioId) {
            if (entry.isIntersecting) {
              visibilityMapRef.current.set(folioId, entry.intersectionRatio);
            } else {
              visibilityMapRef.current.delete(folioId);
            }
          }
        });

        // Debounce the update
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(updateMostVisibleFolio, debounceMs);
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin,
      }
    );

    // Observe all folio elements
    const folioElements = document.querySelectorAll('[data-folio-id]');
    folioElements.forEach((el) => {
      observerRef.current?.observe(el);
    });

    // Set up MutationObserver to watch for new folios
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute('data-folio-id')) {
              observerRef.current?.observe(node);
            }
            // Also check children
            node.querySelectorAll?.('[data-folio-id]').forEach((el) => {
              observerRef.current?.observe(el);
            });
          }
        });
        mutation.removedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const folioId = node.getAttribute('data-folio-id');
            if (folioId) {
              visibilityMapRef.current.delete(folioId);
              observerRef.current?.unobserve(node);
            }
          }
        });
      });
    });

    // Start observing DOM changes
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [autoDetect, debounceMs, rootMargin, threshold, updateMostVisibleFolio]);

  return {
    visibleFolioId,
    scrollToFolio,
    scrollToThumbnail,
    isSyncing,
    disableSync,
    enableSync,
  };
}

export default useFolioScroll;
