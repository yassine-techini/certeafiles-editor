/**
 * useFolioThumbnails - Generate thumbnails from editor state
 * Per Constitution Section 4.1
 * Creates accurate miniature representations of page content
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LexicalEditor } from 'lexical';
import { useFolioStore } from '../stores/folioStore';
import { THUMBNAIL_CONSTANTS } from '../utils/a4-constants';
import type { FolioOrientation } from '../types/folio';

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
}

/**
 * Generate thumbnail from DOM element
 * Draws content at scaled positions matching the actual page layout
 */
function generateThumbnailFromDOM(
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
  const sourceWidth = rect.width;
  const sourceHeight = rect.height;

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

  // Draw header if present
  const header = element.querySelector('header');
  if (header) {
    const headerRect = header.getBoundingClientRect();
    const headerTop = (headerRect.top - rect.top) * scale + offsetY;
    const headerHeight = headerRect.height * scale;

    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(offsetX + 1, headerTop, scaledWidth - 2, headerHeight);

    // Draw header border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(offsetX + 1, headerTop + headerHeight);
    ctx.lineTo(offsetX + scaledWidth - 1, headerTop + headerHeight);
    ctx.stroke();

    // Draw header text
    const headerText = header.textContent?.trim() || '';
    if (headerText) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${Math.max(3, 4 * scale)}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(
        headerText.slice(0, 50),
        offsetX + 3,
        headerTop + headerHeight / 2,
        scaledWidth - 6
      );
    }
  }

  // Draw footer if present
  const footer = element.querySelector('footer');
  if (footer) {
    const footerRect = footer.getBoundingClientRect();
    const footerTop = (footerRect.top - rect.top) * scale + offsetY;
    const footerHeight = footerRect.height * scale;

    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(offsetX + 1, footerTop, scaledWidth - 2, footerHeight);

    // Draw footer border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(offsetX + 1, footerTop);
    ctx.lineTo(offsetX + scaledWidth - 1, footerTop);
    ctx.stroke();

    // Draw footer text
    const footerText = footer.textContent?.trim() || '';
    if (footerText) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = `${Math.max(3, 4 * scale)}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(
        footerText.slice(0, 50),
        offsetX + 3,
        footerTop + footerHeight / 2,
        scaledWidth - 6
      );
    }
  }

  // Get all text elements excluding header and footer
  const textElements = Array.from(
    element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, td, th')
  ).filter((el) => {
    return !el.closest('header') && !el.closest('footer');
  });

  // Draw each text element at its scaled position
  let previewText = '';

  textElements.forEach((el) => {
    const elRect = el.getBoundingClientRect();

    // Skip elements outside the visible area
    if (elRect.width === 0 || elRect.height === 0) return;

    // Calculate scaled position relative to the folio
    const elTop = (elRect.top - rect.top) * scale + offsetY;
    const elLeft = (elRect.left - rect.left) * scale + offsetX;
    const elWidth = elRect.width * scale;
    const elHeight = elRect.height * scale;

    // Skip if outside canvas bounds
    if (elTop < offsetY || elTop > offsetY + scaledHeight) return;
    if (elLeft < offsetX || elLeft > offsetX + scaledWidth) return;

    const text = el.textContent?.trim() || '';
    if (!text) return;

    // Collect preview text
    if (previewText.length < 200) {
      previewText += text + ' ';
    }

    const tagName = el.tagName.toLowerCase();
    const computed = window.getComputedStyle(el);

    // Calculate font size - scale it proportionally
    let fontSize = parseFloat(computed.fontSize) * scale;
    fontSize = Math.max(2, Math.min(fontSize, 8)); // Clamp between 2 and 8px

    // Style based on element type
    if (tagName.startsWith('h')) {
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = '#111827';
    } else {
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = computed.color || '#374151';
    }

    ctx.textBaseline = 'top';

    // Draw the text with word wrapping
    const words = text.split(/\s+/);
    let line = '';
    let currentY = elTop;
    const lineHeight = fontSize * 1.3;
    const maxWidth = elWidth - 2;
    const maxY = elTop + elHeight;

    for (const word of words) {
      if (currentY > maxY) break;

      const testLine = line ? `${line} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, elLeft + 1, currentY, maxWidth);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line && currentY <= maxY) {
      ctx.fillText(line, elLeft + 1, currentY, maxWidth);
    }
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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get folios from store
  const folios = useFolioStore((state) => state.getFoliosInOrder());

  // Generate thumbnail for a single folio by capturing the DOM element
  const generateThumbnail = useCallback(
    (folioId: string, _editor: LexicalEditor) => {
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
          const result = generateThumbnailFromDOM(folioElement, folio.orientation);
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
          // Use empty thumbnail on error
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

  // Generate thumbnails for all folios
  const generateAllThumbnails = useCallback(
    (editor: LexicalEditor) => {
      folios.forEach((folio) => {
        generateThumbnail(folio.id, editor);
      });
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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Generate initial thumbnails when folios change
  useEffect(() => {
    // Create thumbnails for new folios
    folios.forEach((folio) => {
      const existingThumbnail = thumbnails.get(folio.id);
      const hasPdfImage = folio.metadata?.pdfPageImage;

      // If folio has PDF image, always use it (even if we have an empty placeholder)
      if (hasPdfImage) {
        const pdfImage = folio.metadata.pdfPageImage as string;
        const pdfText = (folio.metadata.pdfTextContent as string)?.slice(0, 200) || '';

        // Only update if we don't have a thumbnail or if current thumbnail is empty/different
        if (!existingThumbnail || !existingThumbnail.dataUrl?.includes('data:image/png')) {
          setThumbnails((prev) => {
            const next = new Map(prev);
            next.set(folio.id, {
              folioId: folio.id,
              dataUrl: pdfImage,
              previewText: pdfText,
              timestamp: Date.now(),
            });
            return next;
          });
        }
      } else if (!existingThumbnail) {
        // No PDF image and no thumbnail - create empty placeholder
        const canvas = generateEmptyThumbnail(folio.orientation);
        setThumbnails((prev) => {
          const next = new Map(prev);
          next.set(folio.id, {
            folioId: folio.id,
            dataUrl: canvas.toDataURL('image/png'),
            previewText: '',
            timestamp: Date.now(),
          });
          return next;
        });
      }
    });

    // Remove thumbnails for deleted folios
    const folioIds = new Set(folios.map((f) => f.id));
    setThumbnails((prev) => {
      const next = new Map(prev);
      for (const key of next.keys()) {
        if (!folioIds.has(key)) {
          next.delete(key);
        }
      }
      return next;
    });
  }, [folios, thumbnails]);

  return {
    thumbnails,
    generateThumbnail,
    generateAllThumbnails,
    getThumbnail,
    clearThumbnails,
  };
}

/**
 * Hook to connect thumbnail generation to editor updates
 */
export function useFolioThumbnailUpdater(
  editor: LexicalEditor | null,
  options: UseFolioThumbnailsOptions = {}
): UseFolioThumbnailsReturn {
  const thumbnailsHook = useFolioThumbnails(options);
  const { generateThumbnail, generateAllThumbnails } = thumbnailsHook;
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Generate thumbnails on editor changes
  useEffect(() => {
    if (!editor || !options.autoUpdate) return;

    const unregister = editor.registerUpdateListener(({ tags }) => {
      // Skip if this is a collaboration update or initial load
      if (tags.has('collaboration') || tags.has('history-merge')) return;

      // Debounce updates
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        if (activeFolioId) {
          generateThumbnail(activeFolioId, editor);
        }
      }, options.debounceMs ?? 500);
    });

    return () => {
      unregister();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [editor, activeFolioId, generateThumbnail, options.autoUpdate, options.debounceMs]);

  // Generate all thumbnails on initial load
  useEffect(() => {
    if (editor) {
      // Small delay to ensure editor is ready
      setTimeout(() => {
        generateAllThumbnails(editor);
      }, 100);
    }
  }, [editor, generateAllThumbnails]);

  return thumbnailsHook;
}

export default useFolioThumbnails;
