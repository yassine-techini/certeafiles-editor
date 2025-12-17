/**
 * ZoomControl - Zoom controls for the A4 editor
 * Per Constitution Section 4.1
 */
import { useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { A4_CONSTANTS } from '../../utils/a4-constants';

export interface ZoomControlProps {
  /** Current zoom level (0.5 - 2.0) */
  zoom: number;
  /** Callback when zoom changes */
  onZoomChange: (zoom: number) => void;
  /** Whether to show the slider */
  showSlider?: boolean;
  /** Whether to show the percentage */
  showPercentage?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * Predefined zoom levels for quick selection
 */
const ZOOM_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * ZoomControl - Component for controlling editor zoom
 */
export function ZoomControl({
  zoom,
  onZoomChange,
  showSlider = true,
  showPercentage = true,
  className = '',
}: ZoomControlProps): JSX.Element {
  // Calculate zoom percentage
  const zoomPercent = Math.round(zoom * 100);

  // Check if zoom is at limits
  const canZoomIn = zoom < A4_CONSTANTS.ZOOM_MAX;
  const canZoomOut = zoom > A4_CONSTANTS.ZOOM_MIN;

  // Zoom in by step
  const handleZoomIn = useCallback(() => {
    if (canZoomIn) {
      const newZoom = Math.min(
        A4_CONSTANTS.ZOOM_MAX,
        zoom + A4_CONSTANTS.ZOOM_STEP
      );
      onZoomChange(Math.round(newZoom * 10) / 10);
    }
  }, [zoom, canZoomIn, onZoomChange]);

  // Zoom out by step
  const handleZoomOut = useCallback(() => {
    if (canZoomOut) {
      const newZoom = Math.max(
        A4_CONSTANTS.ZOOM_MIN,
        zoom - A4_CONSTANTS.ZOOM_STEP
      );
      onZoomChange(Math.round(newZoom * 10) / 10);
    }
  }, [zoom, canZoomOut, onZoomChange]);

  // Reset to default zoom
  const handleReset = useCallback(() => {
    onZoomChange(A4_CONSTANTS.ZOOM_DEFAULT);
  }, [onZoomChange]);

  // Handle slider change
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      onZoomChange(value);
    },
    [onZoomChange]
  );

  return (
    <div className={`zoom-control flex items-center gap-2 ${className}`}>
      {/* Zoom Out Button */}
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={!canZoomOut}
        className={`
          p-1.5 rounded transition-colors
          ${canZoomOut
            ? 'hover:bg-gray-200 text-gray-700'
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
        title="Zoom out (decrease by 10%)"
        aria-label="Zoom out"
      >
        <ZoomOut size={18} />
      </button>

      {/* Zoom Slider */}
      {showSlider && (
        <input
          type="range"
          min={A4_CONSTANTS.ZOOM_MIN}
          max={A4_CONSTANTS.ZOOM_MAX}
          step={A4_CONSTANTS.ZOOM_STEP}
          value={zoom}
          onChange={handleSliderChange}
          className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          title={`Zoom: ${zoomPercent}%`}
          aria-label="Zoom level"
        />
      )}

      {/* Zoom In Button */}
      <button
        type="button"
        onClick={handleZoomIn}
        disabled={!canZoomIn}
        className={`
          p-1.5 rounded transition-colors
          ${canZoomIn
            ? 'hover:bg-gray-200 text-gray-700'
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
        title="Zoom in (increase by 10%)"
        aria-label="Zoom in"
      >
        <ZoomIn size={18} />
      </button>

      {/* Zoom Percentage Display */}
      {showPercentage && (
        <span
          className="text-xs text-gray-500 min-w-[40px] text-center font-medium"
          title="Current zoom level"
        >
          {zoomPercent}%
        </span>
      )}

      {/* Reset Button */}
      <button
        type="button"
        onClick={handleReset}
        disabled={zoom === A4_CONSTANTS.ZOOM_DEFAULT}
        className={`
          p-1.5 rounded transition-colors
          ${zoom !== A4_CONSTANTS.ZOOM_DEFAULT
            ? 'hover:bg-gray-200 text-gray-700'
            : 'text-gray-300 cursor-not-allowed'
          }
        `}
        title="Reset zoom to 100%"
        aria-label="Reset zoom"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}

/**
 * ZoomPresets - Dropdown or button group for quick zoom selection
 */
export function ZoomPresets({
  zoom,
  onZoomChange,
  className = '',
}: Omit<ZoomControlProps, 'showSlider' | 'showPercentage'>): JSX.Element {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className={`zoom-presets ${className}`}>
      <select
        value={zoom}
        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Select zoom level"
        aria-label="Zoom level preset"
      >
        {ZOOM_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {Math.round(preset * 100)}%
          </option>
        ))}
        {/* Add current zoom if not in presets */}
        {!ZOOM_PRESETS.includes(zoom as typeof ZOOM_PRESETS[number]) && (
          <option value={zoom}>{zoomPercent}%</option>
        )}
      </select>
    </div>
  );
}

/**
 * CompactZoomControl - Minimal zoom control for tight spaces
 */
export function CompactZoomControl({
  zoom,
  onZoomChange,
  className = '',
}: Omit<ZoomControlProps, 'showSlider' | 'showPercentage'>): JSX.Element {
  const zoomPercent = Math.round(zoom * 100);
  const canZoomIn = zoom < A4_CONSTANTS.ZOOM_MAX;
  const canZoomOut = zoom > A4_CONSTANTS.ZOOM_MIN;

  return (
    <div className={`compact-zoom-control inline-flex items-center border border-gray-300 rounded overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => canZoomOut && onZoomChange(Math.max(A4_CONSTANTS.ZOOM_MIN, zoom - A4_CONSTANTS.ZOOM_STEP))}
        disabled={!canZoomOut}
        className="px-2 py-1 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed border-r border-gray-300"
        aria-label="Zoom out"
      >
        <ZoomOut size={14} />
      </button>
      <span className="px-2 py-1 text-xs font-medium min-w-[45px] text-center bg-gray-50">
        {zoomPercent}%
      </span>
      <button
        type="button"
        onClick={() => canZoomIn && onZoomChange(Math.min(A4_CONSTANTS.ZOOM_MAX, zoom + A4_CONSTANTS.ZOOM_STEP))}
        disabled={!canZoomIn}
        className="px-2 py-1 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed border-l border-gray-300"
        aria-label="Zoom in"
      >
        <ZoomIn size={14} />
      </button>
    </div>
  );
}

export default ZoomControl;
