/**
 * A4 Paper Dimensions and Constants
 * Per Constitution Section 4.1
 */

export const A4_CONSTANTS = {
  // Dimensions at 96 DPI
  WIDTH_PX: 794,           // 210mm
  HEIGHT_PX: 1123,         // 297mm

  // Dimensions in mm
  WIDTH_MM: 210,
  HEIGHT_MM: 297,

  // DPI
  DPI: 96,

  // Conversion
  MM_TO_PX: 3.7795275591,  // 96 / 25.4

  // Default margins (mm)
  MARGIN_TOP: 20,
  MARGIN_RIGHT: 20,
  MARGIN_BOTTOM: 20,
  MARGIN_LEFT: 20,

  // Content area (px)
  CONTENT_WIDTH: 718,      // 794 - 2*20*3.78
  CONTENT_HEIGHT: 972,     // 1123 - 2*20*3.78

  // Zoom levels
  ZOOM_MIN: 0.5,
  ZOOM_MAX: 2.0,
  ZOOM_DEFAULT: 1.0,
  ZOOM_STEP: 0.1,
} as const;

export const LANDSCAPE_CONSTANTS = {
  WIDTH_PX: 1123,
  HEIGHT_PX: 794,
  WIDTH_MM: 297,
  HEIGHT_MM: 210,
} as const;

export const THUMBNAIL_CONSTANTS = {
  PORTRAIT: {
    WIDTH: 100,
    HEIGHT: 141,
  },
  LANDSCAPE: {
    WIDTH: 141,
    HEIGHT: 100,
  },
  SCALE: 0.126,  // 100/794
} as const;

export type Orientation = 'portrait' | 'landscape';

export function getPageDimensions(orientation: Orientation): { width: number; height: number } {
  if (orientation === 'landscape') {
    return {
      width: LANDSCAPE_CONSTANTS.WIDTH_PX,
      height: LANDSCAPE_CONSTANTS.HEIGHT_PX,
    };
  }
  return {
    width: A4_CONSTANTS.WIDTH_PX,
    height: A4_CONSTANTS.HEIGHT_PX,
  };
}

export function mmToPx(mm: number): number {
  return Math.round(mm * A4_CONSTANTS.MM_TO_PX);
}

export function pxToMm(px: number): number {
  return px / A4_CONSTANTS.MM_TO_PX;
}

/**
 * Get content area dimensions based on orientation and margins
 */
export function getContentDimensions(
  orientation: Orientation,
  margins: { top: number; right: number; bottom: number; left: number } = {
    top: A4_CONSTANTS.MARGIN_TOP,
    right: A4_CONSTANTS.MARGIN_RIGHT,
    bottom: A4_CONSTANTS.MARGIN_BOTTOM,
    left: A4_CONSTANTS.MARGIN_LEFT,
  }
): { width: number; height: number } {
  const page = getPageDimensions(orientation);
  return {
    width: page.width - mmToPx(margins.left) - mmToPx(margins.right),
    height: page.height - mmToPx(margins.top) - mmToPx(margins.bottom),
  };
}

/**
 * Get CSS styles for A4 page
 */
export function getA4PageStyles(
  orientation: Orientation,
  zoom: number = A4_CONSTANTS.ZOOM_DEFAULT
): React.CSSProperties {
  const dimensions = getPageDimensions(orientation);
  return {
    width: `${dimensions.width}px`,
    minHeight: `${dimensions.height}px`,
    transform: `scale(${zoom})`,
    transformOrigin: 'top center',
  };
}

/**
 * Get CSS styles for A4 content area (with margins)
 */
export function getA4ContentStyles(
  margins: { top: number; right: number; bottom: number; left: number } = {
    top: A4_CONSTANTS.MARGIN_TOP,
    right: A4_CONSTANTS.MARGIN_RIGHT,
    bottom: A4_CONSTANTS.MARGIN_BOTTOM,
    left: A4_CONSTANTS.MARGIN_LEFT,
  }
): React.CSSProperties {
  return {
    paddingTop: `${mmToPx(margins.top)}px`,
    paddingRight: `${mmToPx(margins.right)}px`,
    paddingBottom: `${mmToPx(margins.bottom)}px`,
    paddingLeft: `${mmToPx(margins.left)}px`,
  };
}
