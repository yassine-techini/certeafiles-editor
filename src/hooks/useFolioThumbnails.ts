/**
 * useFolioThumbnails - Generate thumbnails from editor state
 * Per Constitution Section 4.1
 * Creates accurate miniature representations of page content
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LexicalEditor } from 'lexical';
import html2canvas from 'html2canvas';
import { useFolioStore } from '../stores/folioStore';
import { THUMBNAIL_CONSTANTS } from '../utils/a4-constants';
import type { FolioOrientation } from '../types/folio';
import { onAllFoliosRenderComplete } from '../events/thumbnailEvents';

export interface ThumbnailData {
  folioId: string;
  dataUrl: string | null;
  previewText: string;
  timestamp: number;
}

export interface UseFolioThumbnailsOptions {
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Whether to auto-update on editor changes */
  autoUpdate?: boolean;
}

export interface UseFolioThumbnailsReturn {
  /** Map of folioId to thumbnail data */
  thumbnails: Map<string, ThumbnailData>;
  /** Generate thumbnail for a specific folio */
  generateThumbnail: (folioId: string, editor: LexicalEditor) => void;
  /** Generate thumbnails for all folios */
  generateAllThumbnails: (editor: LexicalEditor) => void;
  /** Get thumbnail data for a folio */
  getThumbnail: (folioId: string) => ThumbnailData | undefined;
  /** Clear all thumbnails */
  clearThumbnails: () => void;
  /** Whether thumbnails are currently being generated */
  isLoading: boolean;
  /** Progress of thumbnail generation (0 to 1) */
  progress: number;
  /** Force regenerate all thumbnails from DOM (useful after content is loaded) */
  regenerateFromDOM: () => void;
}

/**
 * Check if the folio content is ready for capture
 * Verifies headers, footers, and content are present
 */
function isContentReady(element: HTMLElement): boolean {
  // Check for header and footer containers
  const hasHeader = element.querySelector('[data-header-container], .folio-header, header') !== null;
  const hasFooter = element.querySelector('[data-footer-container], .folio-footer, footer') !== null;

  // Check if there's actual content
  const contentArea = element.querySelector('.folio-content, .editor-input, [contenteditable]');
  const contentText = contentArea?.textContent?.trim() || '';
  const hasVisibleContent = contentText.length > 0;

  // For debugging (disabled in production to reduce console noise)
  // console.log('[Thumbnail] Content ready check:', { hasHeader, hasFooter, hasVisibleContent });

  // Content is ready if we have headers/footers OR if there's visible content
  return (hasHeader && hasFooter) || hasVisibleContent;
}

/**
 * Generate thumbnail from DOM element using html2canvas for accurate capture
 * This captures the actual visual representation of the page
 */
async function generateThumbnailFromDOMAsync(
  element: HTMLElement,
  orientation: FolioOrientation
): Promise<{ dataUrl: string; previewText: string }> {
  const isPortrait = orientation === 'portrait';
  const dimensions = isPortrait
    ? THUMBNAIL_CONSTANTS.PORTRAIT
    : THUMBNAIL_CONSTANTS.LANDSCAPE;

  // Wait for fonts to be loaded before capturing
  try {
    await document.fonts.ready;
  } catch {
    // Fonts API might not be available, continue anyway
  }

  // Extract preview text from the element
  const textElements = Array.from(
    element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, td, th')
  ).filter((el) => !el.closest('header') && !el.closest('footer'));

  let previewText = '';
  textElements.forEach((el) => {
    const text = el.textContent?.trim() || '';
    if (text && previewText.length < 200) {
      previewText += text + ' ';
    }
  });

  try {
    // Use html2canvas to capture the actual visual content
    const canvas = await html2canvas(element, {
      scale: 0.2, // Scale down for thumbnail (20% of original)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      // Reset transforms for accurate capture
      onclone: (_clonedDoc, clonedElement) => {
        // Remove any transforms that might affect positioning
        clonedElement.style.transform = 'none';
        clonedElement.style.position = 'relative';
      },
    });

    // Create final thumbnail canvas with correct dimensions
    const thumbnailCanvas = document.createElement('canvas');
    thumbnailCanvas.width = dimensions.WIDTH;
    thumbnailCanvas.height = dimensions.HEIGHT;
    const ctx = thumbnailCanvas.getContext('2d');

    if (!ctx) {
      return { dataUrl: '', previewText: previewText.slice(0, 200).trim() };
    }

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, thumbnailCanvas.width, thumbnailCanvas.height);

    // Calculate scaling to fit while maintaining aspect ratio
    const scaleX = dimensions.WIDTH / canvas.width;
    const scaleY = dimensions.HEIGHT / canvas.height;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const offsetX = (dimensions.WIDTH - scaledWidth) / 2;
    const offsetY = (dimensions.HEIGHT - scaledHeight) / 2;

    // Draw the captured content scaled to fit
    ctx.drawImage(
      canvas,
      0, 0, canvas.width, canvas.height,
      offsetX, offsetY, scaledWidth, scaledHeight
    );

    // Add subtle border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, scaledWidth - 1, scaledHeight - 1);

    return {
      dataUrl: thumbnailCanvas.toDataURL('image/png', 0.8),
      previewText: previewText.slice(0, 200).trim(),
    };
  } catch (error) {
    console.warn('[Thumbnail] html2canvas failed, using fallback:', error);
    // Return fallback with just preview text
    return {
      dataUrl: '',
      previewText: previewText.slice(0, 200).trim(),
    };
  }
}

/**
 * Synchronous fallback for thumbnail generation (simpler drawing)
 */
function generateThumbnailFromDOMSync(
  element: HTMLElement,
  orientation: FolioOrientation
): { dataUrl: string; previewText: string } {
  const isPortrait = orientation === 'portrait';
  const dimensions = isPortrait
    ? THUMBNAIL_CONSTANTS.PORTRAIT
    : THUMBNAIL_CONSTANTS.LANDSCAPE;

  // Create canvas with thumbnail dimensions
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.WIDTH;
  canvas.height = dimensions.HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', previewText: '' };
  }

  // Get the actual dimensions of the folio element
  const rect = element.getBoundingClientRect();
  const sourceWidth = rect.width || 794;
  const sourceHeight = rect.height || 1123;

  // Calculate scale to fit thumbnail
  const scale = Math.min(
    dimensions.WIDTH / sourceWidth,
    dimensions.HEIGHT / sourceHeight
  );

  // Calculate offset to center the content
  const scaledWidth = sourceWidth * scale;
  const scaledHeight = sourceHeight * scale;
  const offsetX = (dimensions.WIDTH - scaledWidth) / 2;
  const offsetY = (dimensions.HEIGHT - scaledHeight) / 2;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(offsetX + 0.5, offsetY + 0.5, scaledWidth - 1, scaledHeight - 1);

  // Extract and draw text content
  const textElements = Array.from(
    element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')
  ).filter((el) => !el.closest('header') && !el.closest('footer'));

  let previewText = '';
  let currentY = offsetY + 10;
  const lineHeight = 6;
  const maxLines = Math.floor((scaledHeight - 20) / lineHeight);
  let lineCount = 0;

  ctx.fillStyle = '#374151';
  ctx.font = '4px sans-serif';
  ctx.textBaseline = 'top';

  textElements.forEach((el) => {
    if (lineCount >= maxLines) return;

    const text = el.textContent?.trim() || '';
    if (!text) return;

    if (previewText.length < 200) {
      previewText += text + ' ';
    }

    // Draw simplified text representation
    const tagName = el.tagName.toLowerCase();
    if (tagName.startsWith('h')) {
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 5px sans-serif';
    } else {
      ctx.fillStyle = '#374151';
      ctx.font = '4px sans-serif';
    }

    // Draw a line of text (truncated)
    const maxWidth = scaledWidth - 20;
    ctx.fillText(text.slice(0, 80), offsetX + 10, currentY, maxWidth);
    currentY += lineHeight;
    lineCount++;
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    previewText: previewText.slice(0, 200).trim(),
  };
}

/**
 * Generate empty thumbnail canvas
 */
function generateEmptyThumbnail(orientation: FolioOrientation): HTMLCanvasElement {
  const isPortrait = orientation === 'portrait';
  const dimensions = isPortrait
    ? THUMBNAIL_CONSTANTS.PORTRAIT
    : THUMBNAIL_CONSTANTS.LANDSCAPE;

  const canvas = document.createElement('canvas');
  canvas.width = dimensions.WIDTH;
  canvas.height = dimensions.HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

  return canvas;
}

/**
 * useFolioThumbnails - Hook to generate and manage folio thumbnails
 */
export function useFolioThumbnails(
  _options: UseFolioThumbnailsOptions = {}
): UseFolioThumbnailsReturn {
  const [thumbnails, setThumbnails] = useState<Map<string, ThumbnailData>>(
    new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get folios from store
  const folios = useFolioStore((state) => state.getFoliosInOrder());

  // Generate thumbnail for a single folio by capturing the DOM element (async with html2canvas)
  const generateThumbnail = useCallback(
    async (folioId: string, _editor: LexicalEditor) => {
      const folio = folios.find((f) => f.id === folioId);
      if (!folio) return;

      // If this folio has a PDF page image, use it directly for thumbnail
      if (folio.metadata?.pdfPageImage) {
        setThumbnails((prev) => {
          const next = new Map(prev);
          next.set(folioId, {
            folioId,
            dataUrl: folio.metadata.pdfPageImage as string,
            previewText: (folio.metadata.pdfTextContent as string)?.slice(0, 200) || '',
            timestamp: Date.now(),
          });
          return next;
        });
        return;
      }

      // Find the DOM element for this folio
      const folioElement = document.querySelector(
        `[data-folio-id="${folioId}"]`
      ) as HTMLElement;

      if (folioElement) {
        try {
          // Use async html2canvas for accurate visual capture
          const result = await generateThumbnailFromDOMAsync(folioElement, folio.orientation);
          setThumbnails((prev) => {
            const next = new Map(prev);
            next.set(folioId, {
              folioId,
              dataUrl: result.dataUrl,
              previewText: result.previewText,
              timestamp: Date.now(),
            });
            return next;
          });
        } catch (error) {
          console.warn('[Thumbnail] Error generating thumbnail:', error);
          // Fallback to sync method on error
          try {
            const result = generateThumbnailFromDOMSync(folioElement, folio.orientation);
            setThumbnails((prev) => {
              const next = new Map(prev);
              next.set(folioId, {
                folioId,
                dataUrl: result.dataUrl,
                previewText: result.previewText,
                timestamp: Date.now(),
              });
              return next;
            });
          } catch {
            // Use empty thumbnail on complete failure
            const canvas = generateEmptyThumbnail(folio.orientation);
            setThumbnails((prev) => {
              const next = new Map(prev);
              next.set(folioId, {
                folioId,
                dataUrl: canvas.toDataURL('image/png'),
                previewText: '',
                timestamp: Date.now(),
              });
              return next;
            });
          }
        }
      } else {
        // Fallback to empty thumbnail
        const canvas = generateEmptyThumbnail(folio.orientation);
        setThumbnails((prev) => {
          const next = new Map(prev);
          next.set(folioId, {
            folioId,
            dataUrl: canvas.toDataURL('image/png'),
            previewText: '',
            timestamp: Date.now(),
          });
          return next;
        });
      }
    },
    [folios]
  );

  // Generate thumbnails for all folios with progress tracking
  const generateAllThumbnails = useCallback(
    (editor: LexicalEditor) => {
      if (folios.length === 0) return;

      setIsLoading(true);
      setProgress(0);

      // Process thumbnails in batches to avoid blocking the UI
      const batchSize = 10;
      let processed = 0;

      const processBatch = (startIndex: number) => {
        const endIndex = Math.min(startIndex + batchSize, folios.length);

        for (let i = startIndex; i < endIndex; i++) {
          generateThumbnail(folios[i].id, editor);
          processed++;
        }

        setProgress(processed / folios.length);

        if (endIndex < folios.length) {
          // Schedule next batch
          requestAnimationFrame(() => processBatch(endIndex));
        } else {
          // All done
          setIsLoading(false);
          setProgress(1);
        }
      };

      // Start processing
      requestAnimationFrame(() => processBatch(0));
    },
    [folios, generateThumbnail]
  );

  // Get thumbnail for a specific folio
  const getThumbnail = useCallback(
    (folioId: string): ThumbnailData | undefined => {
      return thumbnails.get(folioId);
    },
    [thumbnails]
  );

  // Clear all thumbnails
  const clearThumbnails = useCallback(() => {
    setThumbnails(new Map());
  }, []);

  // Regenerate all thumbnails from DOM (call this after content is loaded) - async with html2canvas
  const regenerateFromDOM = useCallback(async () => {
    if (folios.length === 0) return;

    // console.log('[Thumbnail] regenerateFromDOM called, capturing thumbnails for', folios.length, 'folios');
    setIsLoading(true);
    setProgress(0);

    const newThumbnails = new Map<string, ThumbnailData>();
    let capturedCount = 0;

    // Process folios sequentially to avoid overwhelming html2canvas
    for (let i = 0; i < folios.length; i++) {
      const folio = folios[i];

      // If folio has PDF image, use it
      if (folio.metadata?.pdfPageImage) {
        newThumbnails.set(folio.id, {
          folioId: folio.id,
          dataUrl: folio.metadata.pdfPageImage as string,
          previewText: (folio.metadata.pdfTextContent as string)?.slice(0, 200) || 'PDF Page',
          timestamp: Date.now(),
        });
        capturedCount++;
        setProgress((i + 1) / folios.length);
        continue;
      }

      // Try to capture from DOM with html2canvas
      const folioElement = document.querySelector(
        `[data-folio-id="${folio.id}"]`
      ) as HTMLElement;

      if (folioElement) {
        try {
          // Use async html2canvas for accurate visual capture
          const result = await generateThumbnailFromDOMAsync(folioElement, folio.orientation);
          newThumbnails.set(folio.id, {
            folioId: folio.id,
            dataUrl: result.dataUrl,
            previewText: result.previewText || `Page ${folio.index + 1}`,
            timestamp: Date.now(),
          });
          if (result.previewText) {
            capturedCount++;
          }
        } catch (error) {
          console.warn('[Thumbnail] Error generating thumbnail for', folio.id, error);
          // Fallback to sync method
          try {
            const result = generateThumbnailFromDOMSync(folioElement, folio.orientation);
            newThumbnails.set(folio.id, {
              folioId: folio.id,
              dataUrl: result.dataUrl,
              previewText: result.previewText || `Page ${folio.index + 1}`,
              timestamp: Date.now(),
            });
          } catch {
            const canvas = generateEmptyThumbnail(folio.orientation);
            newThumbnails.set(folio.id, {
              folioId: folio.id,
              dataUrl: canvas.toDataURL('image/png'),
              previewText: `Page ${folio.index + 1}`,
              timestamp: Date.now(),
            });
          }
        }
      } else {
        // DOM element not found - create placeholder
        const canvas = generateEmptyThumbnail(folio.orientation);
        newThumbnails.set(folio.id, {
          folioId: folio.id,
          dataUrl: canvas.toDataURL('image/png'),
          previewText: `Page ${folio.index + 1}`,
          timestamp: Date.now(),
        });
      }

      setProgress((i + 1) / folios.length);
    }

    setThumbnails(newThumbnails);
    setIsLoading(false);
    setProgress(1);
    // console.log(`[Thumbnail] regenerateFromDOM completed: ${capturedCount}/${folios.length} thumbnails captured`);
  }, [folios]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Generate thumbnails from DOM when folios change - async with html2canvas
  useEffect(() => {
    if (folios.length === 0) return;

    let cancelled = false;
    let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;

    /**
     * Wait for DOM elements to be present AND content to be ready before capturing thumbnails
     * This is crucial because:
     * 1. The folios are synced to the store before the DOM is rendered
     * 2. HeaderFooterPlugin has a 1000ms delay before injecting headers/footers
     */
    const waitForDOMAndCapture = (attempt = 1, maxAttempts = 15) => {
      if (cancelled) return;

      // Check how many folio elements are in the DOM
      const folioElements = document.querySelectorAll('[data-folio-id]');
      const domFolioCount = folioElements.length;

      // Check if any element has content ready (headers/footers present)
      let hasReadyContent = false;
      folioElements.forEach((el) => {
        if (isContentReady(el as HTMLElement)) {
          hasReadyContent = true;
        }
      });

      // console.log(`[Thumbnail] Attempt ${attempt}: DOM has ${domFolioCount}/${folios.length} folio elements, content ready: ${hasReadyContent}`);

      // Start capturing if:
      // 1. We have DOM elements AND content is ready, OR
      // 2. We've tried enough times
      if ((domFolioCount > 0 && hasReadyContent) || attempt >= maxAttempts) {
        void startThumbnailCapture();
      } else {
        // Wait longer and retry - exponential backoff with higher base for header/footer timing
        // Start at 200ms, grow to max 1500ms (accounting for HeaderFooterPlugin's 1000ms delay)
        const delay = Math.min(200 * Math.pow(1.3, attempt - 1), 1500);
        // console.log(`[Thumbnail] Content not ready, retrying in ${delay}ms...`);
        retryTimeoutId = setTimeout(() => waitForDOMAndCapture(attempt + 1, maxAttempts), delay);
      }
    };

    const startThumbnailCapture = async () => {
      if (cancelled) return;

      setIsLoading(true);
      setProgress(0);

      const newThumbnails = new Map<string, ThumbnailData>();
      let capturedCount = 0;

      // Process folios sequentially for async html2canvas
      for (let i = 0; i < folios.length; i++) {
        if (cancelled) break;

        const folio = folios[i];
        const existingThumbnail = thumbnails.get(folio.id);

        // Skip if we already have a valid thumbnail with actual content
        if (existingThumbnail && existingThumbnail.previewText && !existingThumbnail.previewText.startsWith('Page ')) {
          newThumbnails.set(folio.id, existingThumbnail);
          capturedCount++;
          setProgress((i + 1) / folios.length);
          continue;
        }

        // If folio has PDF image, use it
        if (folio.metadata?.pdfPageImage) {
          newThumbnails.set(folio.id, {
            folioId: folio.id,
            dataUrl: folio.metadata.pdfPageImage as string,
            previewText: (folio.metadata.pdfTextContent as string)?.slice(0, 200) || 'PDF Page',
            timestamp: Date.now(),
          });
          capturedCount++;
          setProgress((i + 1) / folios.length);
          continue;
        }

        // Try to capture from DOM with html2canvas
        const folioElement = document.querySelector(
          `[data-folio-id="${folio.id}"]`
        ) as HTMLElement;

        if (folioElement) {
          try {
            // Use async html2canvas for accurate visual capture
            const result = await generateThumbnailFromDOMAsync(folioElement, folio.orientation);
            newThumbnails.set(folio.id, {
              folioId: folio.id,
              dataUrl: result.dataUrl,
              previewText: result.previewText || `Page ${folio.index + 1}`,
              timestamp: Date.now(),
            });
            if (result.previewText) {
              capturedCount++;
            }
          } catch (error) {
            console.warn('[Thumbnail] Error generating thumbnail for', folio.id, error);
            // Fallback to sync method
            try {
              const result = generateThumbnailFromDOMSync(folioElement, folio.orientation);
              newThumbnails.set(folio.id, {
                folioId: folio.id,
                dataUrl: result.dataUrl,
                previewText: result.previewText || `Page ${folio.index + 1}`,
                timestamp: Date.now(),
              });
            } catch {
              // Create placeholder with page number
              const canvas = generateEmptyThumbnail(folio.orientation);
              newThumbnails.set(folio.id, {
                folioId: folio.id,
                dataUrl: canvas.toDataURL('image/png'),
                previewText: `Page ${folio.index + 1}`,
                timestamp: Date.now(),
              });
            }
          }
        } else {
          // DOM element not found - create placeholder
          const canvas = generateEmptyThumbnail(folio.orientation);
          newThumbnails.set(folio.id, {
            folioId: folio.id,
            dataUrl: canvas.toDataURL('image/png'),
            previewText: `Page ${folio.index + 1}`,
            timestamp: Date.now(),
          });
        }

        setProgress((i + 1) / folios.length);
      }

      if (!cancelled) {
        // All done - update thumbnails state
        setThumbnails(newThumbnails);
        setIsLoading(false);
        setProgress(1);
        // console.log(`[Thumbnail] Completed: ${capturedCount}/${folios.length} thumbnails captured from DOM`);
      }
    };

    // Start waiting for DOM with initial delay for React render AND HeaderFooterPlugin (1000ms stabilization delay)
    // We wait 1200ms to ensure headers/footers are injected before we start checking
    const initialDelay = setTimeout(() => waitForDOMAndCapture(1), 1200);

    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
      }
    };
  }, [folios.length]); // Only re-run when folio count changes

  // Remove thumbnails for deleted folios
  useEffect(() => {
    const folioIds = new Set(folios.map((f) => f.id));
    setThumbnails((prev) => {
      let hasChanges = false;
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (!folioIds.has(key)) {
          next.delete(key);
          hasChanges = true;
        }
      }
      return hasChanges ? next : prev;
    });
  }, [folios]);

  // Listen for folio render complete events from HeaderFooterPlugin
  // This ensures thumbnails are captured AFTER headers/footers are injected
  useEffect(() => {
    const unsubscribe = onAllFoliosRenderComplete((_folioIds) => {
      // console.log(`[Thumbnail] Received render complete event for ${_folioIds.length} folios, triggering regeneration`);
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        void regenerateFromDOM();
      }, 100);
    });

    return unsubscribe;
  }, [regenerateFromDOM]);

  return {
    thumbnails,
    generateThumbnail,
    generateAllThumbnails,
    getThumbnail,
    clearThumbnails,
    isLoading,
    progress,
    regenerateFromDOM,
  };
}

/**
 * Hook to connect thumbnail generation to editor updates
 * OPTIMIZED: Only regenerate thumbnails when actual content changes, not on toolbar clicks
 */
export function useFolioThumbnailUpdater(
  editor: LexicalEditor | null,
  options: UseFolioThumbnailsOptions = {}
): UseFolioThumbnailsReturn {
  const thumbnailsHook = useFolioThumbnails(options);
  const { generateThumbnail, generateAllThumbnails } = thumbnailsHook;
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentHashRef = useRef<string>('');
  const isGeneratingRef = useRef(false);

  // Generate thumbnails on editor changes - ONLY when content actually changes
  useEffect(() => {
    if (!editor || !options.autoUpdate) return;

    const unregister = editor.registerUpdateListener(({ editorState, tags, dirtyElements, dirtyLeaves }) => {
      // Skip if this is a collaboration update, history merge, or selection-only change
      if (tags.has('collaboration') || tags.has('history-merge')) return;

      // Skip if nothing actually changed (just selection or focus)
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

      // Skip if already generating to avoid multiple concurrent html2canvas calls
      if (isGeneratingRef.current) return;

      // Compute a simple content hash to detect actual content changes
      const contentHash = editorState.read(() => {
        const root = editorState._nodeMap.get('root');
        if (root) {
          // Use text content length + first 100 chars as a simple hash
          const text = root.getTextContent();
          return `${text.length}:${text.slice(0, 100)}`;
        }
        return '';
      });

      // Skip if content hasn't actually changed
      if (contentHash === lastContentHashRef.current) return;
      lastContentHashRef.current = contentHash;

      // Debounce updates with a longer delay to reduce frequency
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Use a longer debounce (2 seconds) to batch multiple rapid changes
      debounceTimerRef.current = setTimeout(() => {
        if (activeFolioId && !isGeneratingRef.current) {
          isGeneratingRef.current = true;
          generateThumbnail(activeFolioId, editor);
          // Reset flag after a delay to allow next generation
          setTimeout(() => {
            isGeneratingRef.current = false;
          }, 1000);
        }
      }, options.debounceMs ?? 2000); // Increased default debounce to 2 seconds
    });

    return () => {
      unregister();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [editor, activeFolioId, generateThumbnail, options.autoUpdate, options.debounceMs]);

  // Generate all thumbnails on initial load - only once
  useEffect(() => {
    if (editor) {
      // Longer delay to ensure editor and content are fully ready
      setTimeout(() => {
        generateAllThumbnails(editor);
      }, 500);
    }
  }, [editor, generateAllThumbnails]);

  return thumbnailsHook;
}

export default useFolioThumbnails;
