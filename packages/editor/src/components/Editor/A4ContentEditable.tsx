/**
 * A4ContentEditable - Content editable area for folio-based documents
 * Per Constitution Section 4.1
 */
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
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
 * A4ContentEditable - Simple wrapper for ContentEditable
 * FolioNodes handle the A4 page rendering
 */
export function A4ContentEditable({
  zoom = 1,
  placeholder,
  className = '',
}: A4ContentEditableProps): JSX.Element {
  return (
    <div
      className="a4-editor-wrapper"
      style={{
        // Container for folio nodes
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 0',
        minHeight: '100%',
        transform: `scale(${zoom})`,
        transformOrigin: 'top center',
      }}
    >
      {/* Placeholder - shown when editor is empty */}
      {placeholder && (
        <div
          className="editor-placeholder-hint"
          style={{
            position: 'absolute',
            top: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#9ca3af',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0,
          }}
        >
          {placeholder}
        </div>
      )}

      {/* Content Editable Area - FolioNodes render inside */}
      <ContentEditable
        className={`editor-content ${className}`}
        style={{
          outline: 'none',
          width: '100%',
          minHeight: '100%',
          caretColor: '#000',
        }}
      />
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
