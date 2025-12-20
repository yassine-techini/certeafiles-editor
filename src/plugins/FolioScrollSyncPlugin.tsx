/**
 * FolioScrollSyncPlugin - Two-way scroll synchronization
 * Per Constitution Section 4.1
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useFolioStore } from '../stores/folioStore';
import { isModalCurrentlyOpen } from '../utils/modalState';

export interface FolioScrollSyncPluginProps {
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Whether sync is enabled */
  enabled?: boolean;
  /** Callback when a folio becomes visible */
  onFolioVisible?: (folioId: string) => void;
}

/**
 * FolioScrollSyncPlugin - Synchronizes scroll between editor and folio panel
 */
export function FolioScrollSyncPlugin({
  debounceMs = 150,
  enabled = true,
  onFolioVisible,
}: FolioScrollSyncPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibilityMapRef = useRef<Map<string, number>>(new Map());
  const syncDisabledUntilRef = useRef<number>(0);
  const lastActiveFolioRef = useRef<string | null>(null);

  // Get store state and actions
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const setActiveFolio = useFolioStore((state) => state.setActiveFolio);

  // Track last active folio to detect external changes
  useEffect(() => {
    lastActiveFolioRef.current = activeFolioId;
  }, [activeFolioId]);

  // Scroll to a folio in the editor
  const scrollToFolio = useCallback(
    (folioId: string, behavior: ScrollBehavior = 'smooth') => {
      // Disable observer temporarily to prevent feedback loop
      syncDisabledUntilRef.current = Date.now() + 600;

      const folioElement = document.querySelector(
        `[data-folio-id="${folioId}"]`
      );

      if (folioElement) {
        // Find the scrollable container
        const scrollContainer = folioElement.closest('.overflow-auto');

        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = folioElement.getBoundingClientRect();

          // Calculate scroll position to show folio at top with padding
          const scrollTop =
            scrollContainer.scrollTop +
            elementRect.top -
            containerRect.top -
            32; // 32px padding from top

          scrollContainer.scrollTo({
            top: Math.max(0, scrollTop),
            behavior,
          });
        } else {
          // Fallback to scrollIntoView
          folioElement.scrollIntoView({
            behavior,
            block: 'start',
          });
        }
      }
    },
    []
  );

  // Scroll thumbnail into view
  const scrollThumbnailIntoView = useCallback(
    (folioId: string, behavior: ScrollBehavior = 'smooth') => {
      // Skip if a modal is open
      if (isModalCurrentlyOpen()) {
        return;
      }

      const thumbnailElement = document.querySelector(
        `[data-folio-thumbnail="${folioId}"]`
      );

      if (thumbnailElement) {
        const scrollContainer = thumbnailElement.closest('.overflow-y-auto');

        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = thumbnailElement.getBoundingClientRect();

          // Check if element is already visible
          const isVisible =
            elementRect.top >= containerRect.top &&
            elementRect.bottom <= containerRect.bottom;

          if (!isVisible) {
            // Calculate position to center the thumbnail
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
          }
        }
      }
    },
    []
  );

  // Check if any modal is currently open - use global state
  const isModalOpen = useCallback(() => {
    return isModalCurrentlyOpen();
  }, []);

  // Update the most visible folio based on intersection ratios
  const updateMostVisibleFolio = useCallback(() => {
    if (Date.now() < syncDisabledUntilRef.current) {
      return;
    }

    // Skip if a modal is open
    if (isModalOpen()) {
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

    // Only update if there's a clearly visible folio and it's different
    if (mostVisibleId && maxVisibility > 0.2 && mostVisibleId !== lastActiveFolioRef.current) {
      setActiveFolio(mostVisibleId);
      scrollThumbnailIntoView(mostVisibleId);
      onFolioVisible?.(mostVisibleId);
    }
  }, [setActiveFolio, scrollThumbnailIntoView, onFolioVisible, isModalOpen]);

  // Set up IntersectionObserver for scroll detection
  useEffect(() => {
    if (!enabled) return;

    // Get the editor root element to use as intersection root
    const editorRoot = editor.getRootElement();
    const scrollContainer = editorRoot?.closest('.overflow-auto') as HTMLElement | null;

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Skip if a modal is open - don't update visibility map
        if (isModalCurrentlyOpen()) {
          return;
        }

        // Update visibility map
        entries.forEach((entry) => {
          const folioId = entry.target.getAttribute('data-folio-id');
          if (folioId) {
            if (entry.isIntersecting && entry.intersectionRatio > 0) {
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
        root: scrollContainer,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
        rootMargin: '-5% 0px -5% 0px',
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
  }, [editor, enabled, debounceMs, updateMostVisibleFolio]);

  // Listen for thumbnail clicks to scroll to folio
  useEffect(() => {
    if (!enabled) return;

    const handleThumbnailClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const thumbnailElement = target.closest('[data-folio-thumbnail]');

      if (thumbnailElement) {
        const folioId = thumbnailElement.getAttribute('data-folio-thumbnail');
        if (folioId) {
          // Small delay to let the click handler set active folio first
          setTimeout(() => {
            scrollToFolio(folioId);
          }, 50);
        }
      }
    };

    document.addEventListener('click', handleThumbnailClick, true);

    return () => {
      document.removeEventListener('click', handleThumbnailClick, true);
    };
  }, [enabled, scrollToFolio]);

  return null;
}

export default FolioScrollSyncPlugin;
