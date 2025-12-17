/**
 * A4LayoutPlugin - Applies A4 dimensions to the Lexical editor
 * Per Constitution Section 2.6 and 4.1
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { A4_CONSTANTS, LANDSCAPE_CONSTANTS, mmToPx } from '../utils/a4-constants';
import type { Orientation } from '../utils/a4-constants';

export interface A4LayoutPluginProps {
  /** Page orientation */
  orientation?: Orientation;
  /** Zoom level (0.5 - 2.0) */
  zoom?: number;
  /** Custom margins in mm */
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Callback when layout changes */
  onLayoutChange?: (layout: A4LayoutInfo) => void;
}

export interface A4LayoutInfo {
  orientation: Orientation;
  zoom: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  contentHeight: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * A4LayoutPlugin - Manages A4 page layout and zoom
 */
export function A4LayoutPlugin({
  orientation = 'portrait',
  zoom = 1,
  margins,
  onLayoutChange,
}: A4LayoutPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Clamp zoom to valid range
    const clampedZoom = Math.max(
      A4_CONSTANTS.ZOOM_MIN,
      Math.min(A4_CONSTANTS.ZOOM_MAX, zoom)
    );

    // Get dimensions based on orientation
    const isLandscape = orientation === 'landscape';
    const pageWidth = isLandscape ? LANDSCAPE_CONSTANTS.WIDTH_PX : A4_CONSTANTS.WIDTH_PX;
    const pageHeight = isLandscape ? LANDSCAPE_CONSTANTS.HEIGHT_PX : A4_CONSTANTS.HEIGHT_PX;

    // Calculate margins
    const marginTop = margins?.top ?? A4_CONSTANTS.MARGIN_TOP;
    const marginRight = margins?.right ?? A4_CONSTANTS.MARGIN_RIGHT;
    const marginBottom = margins?.bottom ?? A4_CONSTANTS.MARGIN_BOTTOM;
    const marginLeft = margins?.left ?? A4_CONSTANTS.MARGIN_LEFT;

    // Calculate content area
    const contentWidth = pageWidth - mmToPx(marginLeft) - mmToPx(marginRight);
    const contentHeight = pageHeight - mmToPx(marginTop) - mmToPx(marginBottom);

    // Get root element and apply styles
    const rootElement = editor.getRootElement();
    if (rootElement) {
      // Apply content area dimensions
      rootElement.style.minHeight = `${contentHeight}px`;
      rootElement.style.width = '100%';

      // Set CSS custom properties for use in styles
      rootElement.style.setProperty('--a4-page-width', `${pageWidth}px`);
      rootElement.style.setProperty('--a4-page-height', `${pageHeight}px`);
      rootElement.style.setProperty('--a4-content-width', `${contentWidth}px`);
      rootElement.style.setProperty('--a4-content-height', `${contentHeight}px`);
      rootElement.style.setProperty('--a4-zoom', `${clampedZoom}`);
      rootElement.style.setProperty('--a4-margin-top', `${mmToPx(marginTop)}px`);
      rootElement.style.setProperty('--a4-margin-right', `${mmToPx(marginRight)}px`);
      rootElement.style.setProperty('--a4-margin-bottom', `${mmToPx(marginBottom)}px`);
      rootElement.style.setProperty('--a4-margin-left', `${mmToPx(marginLeft)}px`);

      // Set data attributes for debugging
      rootElement.dataset.orientation = orientation;
      rootElement.dataset.zoom = String(clampedZoom);
    }

    // Notify about layout change
    if (onLayoutChange) {
      const layoutInfo: A4LayoutInfo = {
        orientation,
        zoom: clampedZoom,
        pageWidth,
        pageHeight,
        contentWidth,
        contentHeight,
        margins: {
          top: marginTop,
          right: marginRight,
          bottom: marginBottom,
          left: marginLeft,
        },
      };
      onLayoutChange(layoutInfo);
    }
  }, [editor, orientation, zoom, margins, onLayoutChange]);

  // This plugin doesn't render anything
  return null;
}

/**
 * Hook to get current zoom level with bounds checking
 */
export function useA4Zoom(initialZoom: number = A4_CONSTANTS.ZOOM_DEFAULT): {
  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
} {
  const clamp = (value: number): number =>
    Math.max(A4_CONSTANTS.ZOOM_MIN, Math.min(A4_CONSTANTS.ZOOM_MAX, value));

  // This would typically use useState, but we'll return the interface
  // The actual state management will be done in the parent component
  return {
    zoom: clamp(initialZoom),
    setZoom: () => {},
    zoomIn: () => {},
    zoomOut: () => {},
    resetZoom: () => {},
    canZoomIn: initialZoom < A4_CONSTANTS.ZOOM_MAX,
    canZoomOut: initialZoom > A4_CONSTANTS.ZOOM_MIN,
  };
}

export default A4LayoutPlugin;
