/**
 * A4ContentEditable - Content editable area with exact A4 dimensions
 * Per Constitution Section 4.1
 */
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { A4_CONSTANTS, LANDSCAPE_CONSTANTS, mmToPx } from '../../utils/a4-constants';
import type { Orientation } from '../../utils/a4-constants';

export interface A4ContentEditableProps {
  /** Page orientation */
  orientation?: Orientation;
  /** Custom margins in mm */
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Zoom level (0.5 - 2.0) */
  zoom?: number;
  /** Placeholder element */
  placeholder?: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * A4ContentEditable - Renders a ContentEditable with exact A4 dimensions
 */
export function A4ContentEditable({
  orientation = 'portrait',
  margins,
  zoom = 1,
  placeholder,
  className = '',
}: A4ContentEditableProps): JSX.Element {
  // Get dimensions based on orientation
  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? LANDSCAPE_CONSTANTS.WIDTH_PX : A4_CONSTANTS.WIDTH_PX;
  const pageHeight = isLandscape ? LANDSCAPE_CONSTANTS.HEIGHT_PX : A4_CONSTANTS.HEIGHT_PX;

  // Calculate margins in pixels
  const marginTop = mmToPx(margins?.top ?? A4_CONSTANTS.MARGIN_TOP);
  const marginRight = mmToPx(margins?.right ?? A4_CONSTANTS.MARGIN_RIGHT);
  const marginBottom = mmToPx(margins?.bottom ?? A4_CONSTANTS.MARGIN_BOTTOM);
  const marginLeft = mmToPx(margins?.left ?? A4_CONSTANTS.MARGIN_LEFT);

  return (
    <div
      className="a4-page-wrapper"
      style={{
        // Center the page and apply zoom
        display: 'flex',
        justifyContent: 'center',
        padding: '32px',
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
        // Adjust container size to account for zoom
        marginBottom: zoom < 1 ? `${(1 - zoom) * -pageHeight}px` : 0,
      }}
    >
      {/* A4 Page Container */}
      <div
        className={`a4-page ${isLandscape ? 'a4-page-landscape' : ''}`}
        style={{
          width: `${pageWidth}px`,
          minHeight: `${pageHeight}px`,
          backgroundColor: 'white',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          // Apply margins as padding
          paddingTop: `${marginTop}px`,
          paddingRight: `${marginRight}px`,
          paddingBottom: `${marginBottom}px`,
          paddingLeft: `${marginLeft}px`,
        }}
        data-orientation={orientation}
        data-zoom={zoom}
      >
        {/* Placeholder */}
        {placeholder && (
          <div
            className="editor-placeholder"
            style={{
              position: 'absolute',
              top: `${marginTop}px`,
              left: `${marginLeft}px`,
              right: `${marginRight}px`,
              color: '#9ca3af',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {placeholder}
          </div>
        )}

        {/* Content Editable Area */}
        <ContentEditable
          className={`editor-content ${className}`}
          style={{
            outline: 'none',
            minHeight: `${pageHeight - marginTop - marginBottom}px`,
            width: '100%',
            caretColor: '#000',
          }}
        />
      </div>
    </div>
  );
}

/**
 * A4Placeholder - Styled placeholder for the editor
 */
export function A4Placeholder({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className="text-gray-400 text-base pointer-events-none select-none">
      {children}
    </div>
  );
}

export default A4ContentEditable;
