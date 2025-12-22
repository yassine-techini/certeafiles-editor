/**
 * Thumbnail Events
 *
 * Custom events for coordinating thumbnail generation with other components.
 * This allows HeaderFooterPlugin to notify when a folio is fully rendered.
 */

// Event name for when a folio is completely rendered (including headers/footers)
export const FOLIO_RENDER_COMPLETE = 'folio:render-complete';

// Event name for when all folios are rendered
export const ALL_FOLIOS_RENDER_COMPLETE = 'folios:all-render-complete';

/**
 * Emit event when a single folio is completely rendered
 */
export function emitFolioRenderComplete(folioId: string): void {
  console.log(`[ThumbnailEvents] Folio render complete: ${folioId}`);
  window.dispatchEvent(
    new CustomEvent(FOLIO_RENDER_COMPLETE, {
      detail: { folioId, timestamp: Date.now() },
    })
  );
}

/**
 * Emit event when all folios are rendered
 */
export function emitAllFoliosRenderComplete(folioIds: string[]): void {
  console.log(`[ThumbnailEvents] All folios render complete: ${folioIds.length} folios`);
  window.dispatchEvent(
    new CustomEvent(ALL_FOLIOS_RENDER_COMPLETE, {
      detail: { folioIds, timestamp: Date.now() },
    })
  );
}

/**
 * Subscribe to folio render complete events
 */
export function onFolioRenderComplete(
  callback: (folioId: string) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ folioId: string }>;
    callback(customEvent.detail.folioId);
  };

  window.addEventListener(FOLIO_RENDER_COMPLETE, handler);

  return () => {
    window.removeEventListener(FOLIO_RENDER_COMPLETE, handler);
  };
}

/**
 * Subscribe to all folios render complete events
 */
export function onAllFoliosRenderComplete(
  callback: (folioIds: string[]) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ folioIds: string[] }>;
    callback(customEvent.detail.folioIds);
  };

  window.addEventListener(ALL_FOLIOS_RENDER_COMPLETE, handler);

  return () => {
    window.removeEventListener(ALL_FOLIOS_RENDER_COMPLETE, handler);
  };
}
