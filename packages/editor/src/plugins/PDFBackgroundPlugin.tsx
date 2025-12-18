/**
 * PDFBackgroundPlugin - Displays PDF page images as backgrounds for imported folios
 * Uses CSS background-image on folio elements
 */
import { useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useFolioStore } from '../stores/folioStore';

/**
 * Plugin that adds PDF page images as backgrounds to folio elements
 */
export function PDFBackgroundPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const updateScheduledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stable callback to update backgrounds
  const updateBackgrounds = useCallback(() => {
    const folios = useFolioStore.getState().getFoliosInOrder();

    folios.forEach((folio) => {
      const pdfImage = folio.metadata?.pdfPageImage as string | undefined;

      if (!pdfImage) return;

      const folioElement = document.querySelector(
        `[data-folio-id="${folio.id}"]`
      ) as HTMLElement;

      if (!folioElement) return;

      // Check if background is already set correctly
      const currentBg = folioElement.style.backgroundImage;
      if (currentBg && currentBg.includes('data:image')) {
        return; // Already has a data URL background
      }

      // Apply background image
      folioElement.style.backgroundImage = `url(${pdfImage})`;
      folioElement.style.backgroundSize = 'cover';
      folioElement.style.backgroundPosition = 'center top';
      folioElement.style.backgroundRepeat = 'no-repeat';
    });

    updateScheduledRef.current = false;
  }, []);

  // Debounced update scheduler
  const scheduleUpdate = useCallback(() => {
    if (updateScheduledRef.current) return;
    updateScheduledRef.current = true;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      updateBackgrounds();
    }, 150);
  }, [updateBackgrounds]);

  useEffect(() => {
    // Initial update after mount with increasing delays
    const timeouts = [100, 300, 600, 1000, 2000];
    const timeoutIds = timeouts.map((delay) =>
      setTimeout(updateBackgrounds, delay)
    );

    // Also set up a periodic check for the first 5 seconds
    intervalRef.current = setInterval(updateBackgrounds, 500);
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 5000);

    // Subscribe to store changes
    const unsubscribe = useFolioStore.subscribe(
      (state) => state.folios,
      () => {
        scheduleUpdate();
      }
    );

    // Listen to editor updates for DOM changes
    const unregisterEditor = editor.registerUpdateListener(() => {
      scheduleUpdate();
    });

    return () => {
      timeoutIds.forEach(clearTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribe();
      unregisterEditor();
    };
  }, [editor, updateBackgrounds, scheduleUpdate]);

  return null;
}

export default PDFBackgroundPlugin;
