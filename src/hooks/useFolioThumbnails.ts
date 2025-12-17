/**
 * useFolioThumbnails - Generate thumbnails from editor state
 * Per Constitution Section 4.1
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LexicalEditor, SerializedEditorState } from 'lexical';
import { $getRoot } from 'lexical';
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
 * Extract text content from serialized editor state
 */
function extractTextFromEditorState(
  editorState: SerializedEditorState | null
): string {
  if (!editorState || !editorState.root) return '';

  const extractText = (node: Record<string, unknown>): string => {
    let text = '';

    if (node.text && typeof node.text === 'string') {
      text += node.text;
    }

    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        text += extractText(child as Record<string, unknown>);
        // Add newline between block-level elements
        if (
          child &&
          typeof child === 'object' &&
          'type' in child &&
          ['paragraph', 'heading', 'listitem'].includes(child.type as string)
        ) {
          text += '\n';
        }
      }
    }

    return text;
  };

  return extractText(editorState.root as Record<string, unknown>).trim();
}

/**
 * Generate thumbnail canvas from folio content
 */
function generateThumbnailCanvas(
  text: string,
  orientation: FolioOrientation
): HTMLCanvasElement {
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

  // Draw text preview
  if (text) {
    ctx.fillStyle = '#374151';
    ctx.font = '7px Inter, system-ui, sans-serif';
    ctx.textBaseline = 'top';

    const padding = 6;
    const lineHeight = 9;
    const maxWidth = canvas.width - padding * 2;

    // Word wrap
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Draw lines (limit to visible area)
    const maxLines = Math.floor((canvas.height - padding * 2) / lineHeight);
    lines.slice(0, maxLines).forEach((line, index) => {
      ctx.fillText(line, padding, padding + index * lineHeight);
    });

    // Fade effect if truncated
    if (lines.length > maxLines) {
      const gradient = ctx.createLinearGradient(
        0,
        canvas.height - 20,
        0,
        canvas.height
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    }
  } else {
    // Empty page indicator
    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Empty', canvas.width / 2, canvas.height / 2);
  }

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

  // Generate thumbnail for a single folio
  const generateThumbnail = useCallback(
    (folioId: string, editor: LexicalEditor) => {
      const folio = folios.find((f) => f.id === folioId);
      if (!folio) return;

      // Get text content from editor state
      let previewText = '';

      if (folio.content) {
        previewText = extractTextFromEditorState(folio.content);
      } else {
        // Try to get from current editor state
        editor.getEditorState().read(() => {
          const root = $getRoot();
          previewText = root.getTextContent().trim();
        });
      }

      // Generate canvas thumbnail
      const canvas = generateThumbnailCanvas(previewText, folio.orientation);
      const dataUrl = canvas.toDataURL('image/png');

      setThumbnails((prev) => {
        const next = new Map(prev);
        next.set(folioId, {
          folioId,
          dataUrl,
          previewText,
          timestamp: Date.now(),
        });
        return next;
      });
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
    // Create placeholder thumbnails for new folios
    folios.forEach((folio) => {
      if (!thumbnails.has(folio.id)) {
        const canvas = generateThumbnailCanvas('', folio.orientation);
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
