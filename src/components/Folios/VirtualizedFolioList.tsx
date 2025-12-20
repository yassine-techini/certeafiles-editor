/**
 * VirtualizedFolioList - Efficiently renders large folio lists using virtualization
 * Per Constitution Section 4.1 - Performance optimized for 100+ folios
 */
import { useRef, useState, useCallback, useEffect, memo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableFolioThumbnail } from './SortableFolioThumbnail';
import { FolioThumbnail } from './FolioThumbnail';
import { useFolioDragDrop } from '../../hooks/useFolioDragDrop';
import type { ThumbnailData } from '../../hooks/useFolioThumbnails';
import type { Folio } from '../../types/folio';
import { isModalCurrentlyOpen } from '../../utils/modalState';

// Virtualization constants
const ITEM_HEIGHT = 180; // Height of each thumbnail item (141px thumbnail + padding + compact icons + margins)
const BUFFER_SIZE = 5; // Number of items to render above/below viewport
const SCROLL_THRESHOLD = 50; // Pixels from edge to trigger pagination

export interface VirtualizedFolioListProps {
  /** Ordered list of folios */
  folios: Folio[];
  /** Thumbnail data map */
  thumbnails: Map<string, ThumbnailData>;
  /** Active folio ID */
  activeFolioId: string | null;
  /** Click handler */
  onFolioClick: (folioId: string) => void;
  /** Rotate handler */
  onRotate: (folioId: string) => void;
  /** Delete handler */
  onDelete: (folioId: string) => void;
  /** Lock toggle handler */
  onToggleLock: (folioId: string, currentLocked: boolean) => void;
  /** Status toggle handler */
  onToggleStatus: (folioId: string) => void;
  /** Container height */
  containerHeight?: number;
}

interface VirtualItem {
  index: number;
  folio: Folio;
  top: number;
}

/**
 * VirtualizedFolioList - Renders a virtualized sortable list of folio thumbnails
 */
export const VirtualizedFolioList = memo(function VirtualizedFolioList({
  folios,
  thumbnails,
  activeFolioId,
  onFolioClick,
  onRotate,
  onDelete,
  onToggleLock,
  onToggleStatus,
  containerHeight = 600,
}: VirtualizedFolioListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get drag handlers from hook
  const { handleDragEnd } = useFolioDragDrop({
    onDragStart: (folioId) => setActiveId(folioId),
    onDragEnd: () => setActiveId(null),
  });

  // Handle drag start
  const handleDragStart = (event: { active: { id: string | number } }) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null);
  };

  // Calculate visible range
  const totalHeight = folios.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    folios.length - 1,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );

  // Calculate visible items
  const visibleItems: VirtualItem[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    if (folios[i]) {
      visibleItems.push({
        index: i,
        folio: folios[i],
        top: i * ITEM_HEIGHT,
      });
    }
  }

  // Handle scroll with debouncing
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Debounce scroll updates for performance
    scrollTimeoutRef.current = setTimeout(() => {
      setScrollTop(target.scrollTop);
    }, 16); // ~60fps
  }, []);

  // Scroll to active folio only when activeFolioId changes (not on every scroll)
  const prevActiveFolioIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Only scroll if activeFolioId actually changed
    if (activeFolioId === prevActiveFolioIdRef.current) return;
    prevActiveFolioIdRef.current = activeFolioId;

    if (!activeFolioId || !containerRef.current) return;

    // Skip if a modal is open
    if (isModalCurrentlyOpen()) return;

    const activeIndex = folios.findIndex((f) => f.id === activeFolioId);
    if (activeIndex === -1) return;

    const itemTop = activeIndex * ITEM_HEIGHT;
    const itemBottom = itemTop + ITEM_HEIGHT;
    const currentScrollTop = containerRef.current.scrollTop;
    const viewportBottom = currentScrollTop + containerHeight;

    // Check if item is outside viewport - only then scroll
    if (itemTop < currentScrollTop) {
      containerRef.current.scrollTop = itemTop - SCROLL_THRESHOLD;
    } else if (itemBottom > viewportBottom) {
      containerRef.current.scrollTop = itemBottom - containerHeight + SCROLL_THRESHOLD;
    }
  }, [activeFolioId, folios, containerHeight]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Get folio IDs for sortable context
  const folioIds = folios.map((f) => f.id);

  // Find the active folio for overlay
  const activeFolio = activeId ? folios.find((f) => f.id === activeId) : null;
  const activeThumbnail = activeId ? thumbnails.get(activeId) : null;

  // For small lists, skip virtualization
  if (folios.length <= 20) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={folioIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {folios.map((folio) => {
              const thumbnail = thumbnails.get(folio.id);
              return (
                <SortableFolioThumbnail
                  key={folio.id}
                  folioId={folio.id}
                  folioIndex={folio.index}
                  orientation={folio.orientation}
                  isActive={folio.id === activeFolioId}
                  isLocked={folio.locked}
                  status={folio.status}
                  thumbnailDataUrl={thumbnail?.dataUrl ?? null}
                  previewText={thumbnail?.previewText ?? ''}
                  onClick={() => onFolioClick(folio.id)}
                  onRotate={() => onRotate(folio.id)}
                  onDelete={() => onDelete(folio.id)}
                  onToggleLock={() => onToggleLock(folio.id, folio.locked)}
                  onToggleStatus={() => onToggleStatus(folio.id)}
                  canDelete={folios.length > 1}
                  disabled={folio.locked}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay adjustScale={false}>
          {activeFolio && (
            <div className="opacity-90 shadow-xl">
              <FolioThumbnail
                folioId={activeFolio.id}
                folioIndex={activeFolio.index}
                orientation={activeFolio.orientation}
                isActive={true}
                isLocked={activeFolio.locked}
                status={activeFolio.status}
                thumbnailDataUrl={activeThumbnail?.dataUrl ?? null}
                previewText={activeThumbnail?.previewText ?? ''}
                onClick={() => {}}
                onRotate={() => {}}
                onDelete={() => {}}
                onToggleLock={() => {}}
                onToggleStatus={() => {}}
                canDelete={false}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={folioIds} strategy={verticalListSortingStrategy}>
        <div
          ref={containerRef}
          className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          {/* Virtual spacer for total height */}
          <div
            className="relative"
            style={{ height: totalHeight }}
          >
            {/* Render only visible items */}
            {visibleItems.map(({ folio, top }) => {
              const thumbnail = thumbnails.get(folio.id);
              return (
                <div
                  key={folio.id}
                  className="absolute left-0 right-0 px-1"
                  style={{
                    top,
                    height: ITEM_HEIGHT,
                    paddingTop: 4,
                    paddingBottom: 4,
                    boxSizing: 'border-box'
                  }}
                >
                  <SortableFolioThumbnail
                    folioId={folio.id}
                    folioIndex={folio.index}
                    orientation={folio.orientation}
                    isActive={folio.id === activeFolioId}
                    isLocked={folio.locked}
                    status={folio.status}
                    thumbnailDataUrl={thumbnail?.dataUrl ?? null}
                    previewText={thumbnail?.previewText ?? ''}
                    onClick={() => onFolioClick(folio.id)}
                    onRotate={() => onRotate(folio.id)}
                    onDelete={() => onDelete(folio.id)}
                    onToggleLock={() => onToggleLock(folio.id, folio.locked)}
                    onToggleStatus={() => onToggleStatus(folio.id)}
                    canDelete={folios.length > 1}
                    disabled={folio.locked}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </SortableContext>

      {/* Drag overlay */}
      <DragOverlay adjustScale={false}>
        {activeFolio && (
          <div className="opacity-90 shadow-xl">
            <FolioThumbnail
              folioId={activeFolio.id}
              folioIndex={activeFolio.index}
              orientation={activeFolio.orientation}
              isActive={true}
              isLocked={activeFolio.locked}
              status={activeFolio.status}
              thumbnailDataUrl={activeThumbnail?.dataUrl ?? null}
              previewText={activeThumbnail?.previewText ?? ''}
              onClick={() => {}}
              onRotate={() => {}}
              onDelete={() => {}}
              onToggleLock={() => {}}
              onToggleStatus={() => {}}
              canDelete={false}
            />
          </div>
        )}
      </DragOverlay>

      {/* Folio count indicator for large lists */}
      <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm py-2 text-center text-xs text-gray-500 border-t">
        Showing {startIndex + 1}-{Math.min(endIndex + 1, folios.length)} of {folios.length} pages
      </div>
    </DndContext>
  );
});

export default VirtualizedFolioList;
