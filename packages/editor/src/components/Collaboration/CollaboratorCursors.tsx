/**
 * CollaboratorCursors - Render remote user cursors and selections
 * Per Constitution Section 7 - Collaboration
 */
import { useMemo, useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { RemoteCursor } from '../../plugins/CursorPlugin';
import './CollaboratorCursors.css';

export interface CollaboratorCursorsProps {
  /** Remote cursors to render */
  cursors: RemoteCursor[];
  /** Container element to render cursors relative to */
  container: HTMLElement | null;
  /** Whether to show selection highlights */
  showSelections?: boolean | undefined;
  /** Whether to show user name labels */
  showLabels?: boolean | undefined;
  /** Cursor opacity for inactive users */
  inactiveOpacity?: number | undefined;
  /** Animation duration for cursor movement (ms) */
  animationDuration?: number | undefined;
}

/**
 * Individual cursor component
 */
interface CursorComponentProps {
  cursor: RemoteCursor;
  containerRect: DOMRect;
  showSelections: boolean;
  showLabel: boolean;
  inactiveOpacity: number;
  animationDuration: number;
}

function CursorComponent({
  cursor,
  containerRect,
  showSelections,
  showLabel,
  inactiveOpacity,
  animationDuration,
}: CursorComponentProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState(false);
  const prevPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate relative position
  const position = useMemo(() => {
    if (!cursor.position) return null;

    return {
      x: cursor.position.x - containerRect.left,
      y: cursor.position.y - containerRect.top,
      height: cursor.position.height,
    };
  }, [cursor.position, containerRect]);

  // Calculate selection rects relative to container
  const selectionRects = useMemo(() => {
    if (!showSelections || cursor.selectionRects.length === 0) return [];

    return cursor.selectionRects.map((rect) => ({
      x: rect.left - containerRect.left,
      y: rect.top - containerRect.top,
      width: rect.width,
      height: rect.height,
    }));
  }, [cursor.selectionRects, containerRect, showSelections]);

  // Animate visibility
  useEffect(() => {
    if (position) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      return undefined;
    }
  }, [position]);

  // Track previous position for animation
  useEffect(() => {
    if (position) {
      prevPositionRef.current = { x: position.x, y: position.y };
    }
  }, [position]);

  if (!position) return null;

  const opacity = cursor.isActive ? 1 : inactiveOpacity;
  const transitionStyle = `transform ${animationDuration}ms ease-out, opacity ${animationDuration}ms ease-out`;

  return (
    <>
      {/* Selection highlights */}
      {selectionRects.map((rect, index) => (
        <div
          key={`selection-${cursor.clientId}-${index}`}
          className="collaborator-selection"
          style={{
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: cursor.user.color,
            opacity: opacity * 0.2,
            transition: transitionStyle,
          }}
        />
      ))}

      {/* Cursor caret */}
      <div
        className={`collaborator-cursor ${isVisible ? 'visible' : ''} ${cursor.isActive ? 'active' : 'inactive'}`}
        style={{
          left: position.x,
          top: position.y,
          height: position.height,
          opacity,
          transition: transitionStyle,
          '--cursor-color': cursor.user.color,
        } as React.CSSProperties}
      >
        {/* Cursor line */}
        <div
          className="collaborator-cursor__line"
          style={{
            backgroundColor: cursor.user.color,
            height: position.height,
          }}
        />

        {/* User label */}
        {showLabel && (
          <div
            className="collaborator-cursor__label"
            style={{
              backgroundColor: cursor.user.color,
            }}
          >
            <span className="collaborator-cursor__label-text">
              {cursor.user.name}
            </span>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * CollaboratorCursors - Renders all remote cursors
 */
export function CollaboratorCursors({
  cursors,
  container,
  showSelections = true,
  showLabels = true,
  inactiveOpacity = 0.4,
  animationDuration = 100,
}: CollaboratorCursorsProps): JSX.Element | null {
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  // Update container rect on changes
  useEffect(() => {
    if (!container) {
      setContainerRect(null);
      return;
    }

    const updateRect = () => {
      setContainerRect(container.getBoundingClientRect());
    };

    updateRect();

    // Observe container size changes
    const resizeObserver = new ResizeObserver(updateRect);
    resizeObserver.observe(container);

    // Update on scroll
    const scrollContainer = container.closest('.a4-scroll-container');
    scrollContainer?.addEventListener('scroll', updateRect);
    window.addEventListener('resize', updateRect);

    return () => {
      resizeObserver.disconnect();
      scrollContainer?.removeEventListener('scroll', updateRect);
      window.removeEventListener('resize', updateRect);
    };
  }, [container]);

  // Filter to only cursors with positions
  const visibleCursors = useMemo(() => {
    return cursors.filter((c) => c.position !== null);
  }, [cursors]);

  if (!container || !containerRect || visibleCursors.length === 0) {
    return null;
  }

  return createPortal(
    <div className="collaborator-cursors-container">
      {visibleCursors.map((cursor) => (
        <CursorComponent
          key={cursor.clientId}
          cursor={cursor}
          containerRect={containerRect}
          showSelections={showSelections}
          showLabel={showLabels}
          inactiveOpacity={inactiveOpacity}
          animationDuration={animationDuration}
        />
      ))}
    </div>,
    container
  );
}

export default CollaboratorCursors;
