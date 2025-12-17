/**
 * FolioThumbnail - Canvas-based thumbnail for folio preview
 * Per Constitution Section 4.1
 */
import { useEffect, useRef, memo } from 'react';
import { RotateCw, Trash2, Lock, Unlock } from 'lucide-react';
import { THUMBNAIL_CONSTANTS } from '../../utils/a4-constants';
import type { FolioOrientation } from '../../types/folio';

export interface FolioThumbnailProps {
  /** Folio ID */
  folioId: string;
  /** Folio index (0-based) */
  folioIndex: number;
  /** Page orientation */
  orientation: FolioOrientation;
  /** Whether this folio is currently active */
  isActive: boolean;
  /** Whether this folio is locked */
  isLocked: boolean;
  /** Thumbnail image data URL (from canvas) */
  thumbnailDataUrl: string | null;
  /** Preview text content (fallback when no image) */
  previewText: string;
  /** Click handler */
  onClick: () => void;
  /** Rotate handler */
  onRotate: () => void;
  /** Delete handler */
  onDelete: () => void;
  /** Lock toggle handler */
  onToggleLock: () => void;
  /** Whether delete is allowed */
  canDelete: boolean;
}

/**
 * FolioThumbnail - Displays a thumbnail preview of a folio
 */
export const FolioThumbnail = memo(function FolioThumbnail({
  folioId,
  folioIndex,
  orientation,
  isActive,
  isLocked,
  thumbnailDataUrl,
  previewText,
  onClick,
  onRotate,
  onDelete,
  onToggleLock,
  canDelete,
}: FolioThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Get thumbnail dimensions based on orientation
  const dimensions =
    orientation === 'portrait'
      ? THUMBNAIL_CONSTANTS.PORTRAIT
      : THUMBNAIL_CONSTANTS.LANDSCAPE;

  // Draw preview text on canvas when no image
  useEffect(() => {
    if (thumbnailDataUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw preview text
    if (previewText) {
      ctx.fillStyle = '#9ca3af';
      ctx.font = '8px Inter, system-ui, sans-serif';
      ctx.textBaseline = 'top';

      const padding = 6;
      const lineHeight = 10;
      const maxWidth = canvas.width - padding * 2;
      const lines = wrapText(ctx, previewText, maxWidth);

      lines.slice(0, 12).forEach((line, index) => {
        ctx.fillText(line, padding, padding + index * lineHeight);
      });

      // Add fade effect at bottom if text is truncated
      if (lines.length > 12) {
        const gradient = ctx.createLinearGradient(
          0,
          canvas.height - 30,
          0,
          canvas.height
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
      }
    } else {
      // Empty page indicator
      ctx.fillStyle = '#e5e7eb';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Empty', canvas.width / 2, canvas.height / 2);
    }
  }, [thumbnailDataUrl, previewText, dimensions]);

  return (
    <div
      data-folio-thumbnail={folioId}
      className={`
        group relative rounded-lg p-2 cursor-pointer transition-all duration-150
        ${
          isActive
            ? 'bg-blue-50 ring-2 ring-blue-500'
            : 'hover:bg-gray-100 ring-1 ring-transparent hover:ring-gray-300'
        }
      `}
      onClick={onClick}
    >
      {/* Thumbnail container */}
      <div
        className="relative mx-auto bg-white rounded shadow-sm border border-gray-200 overflow-hidden"
        style={{
          width: dimensions.WIDTH,
          height: dimensions.HEIGHT,
        }}
      >
        {thumbnailDataUrl ? (
          <img
            src={thumbnailDataUrl}
            alt={`Page ${folioIndex + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={dimensions.WIDTH}
            height={dimensions.HEIGHT}
            className="w-full h-full"
          />
        )}

        {/* Lock indicator */}
        {isLocked && (
          <div className="absolute top-1 right-1 bg-yellow-100 rounded p-0.5">
            <Lock size={10} className="text-yellow-600" />
          </div>
        )}

        {/* Page number badge */}
        <div className="absolute bottom-1 right-1 bg-gray-900/70 text-white text-[10px] px-1.5 py-0.5 rounded">
          {folioIndex + 1}
        </div>
      </div>

      {/* Orientation indicator */}
      <div className="mt-1 text-center">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          {orientation === 'portrait' ? 'Portrait' : 'Landscape'}
        </span>
      </div>

      {/* Hover actions */}
      <div
        className={`
          absolute top-1 right-1 flex gap-1 transition-opacity duration-150
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onRotate}
          className="p-1 bg-white rounded shadow-sm hover:bg-gray-100 transition-colors"
          title="Rotate orientation"
        >
          <RotateCw size={12} className="text-gray-600" />
        </button>

        <button
          type="button"
          onClick={onToggleLock}
          className="p-1 bg-white rounded shadow-sm hover:bg-gray-100 transition-colors"
          title={isLocked ? 'Unlock folio' : 'Lock folio'}
        >
          {isLocked ? (
            <Unlock size={12} className="text-yellow-600" />
          ) : (
            <Lock size={12} className="text-gray-600" />
          )}
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1 bg-white rounded shadow-sm hover:bg-red-50 transition-colors"
            title="Delete folio"
          >
            <Trash2 size={12} className="text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Wrap text to fit within a given width
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
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

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export default FolioThumbnail;
