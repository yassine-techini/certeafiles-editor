/**
 * FolioSortableList - Drag-and-drop sortable list for folios
 * Per Constitution Section 4.1
 */
import { useState } from 'react';
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

export interface FolioSortableListProps {
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
  onToggleStatus?: (folioId: string) => void;
}

/**
 * FolioSortableList - Renders a sortable list of folio thumbnails
 */
export function FolioSortableList({
  folios,
  thumbnails,
  activeFolioId,
  onFolioClick,
  onRotate,
  onDelete,
  onToggleLock,
  onToggleStatus,
}: FolioSortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
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

  // Get folio IDs for sortable context
  const folioIds = folios.map((f) => f.id);

  // Find the active folio for overlay
  const activeFolio = activeId ? folios.find((f) => f.id === activeId) : null;
  const activeThumbnail = activeId ? thumbnails.get(activeId) : null;

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
                onToggleStatus={() => onToggleStatus?.(folio.id)}
                canDelete={folios.length > 1}
                disabled={folio.locked}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag overlay - shows preview while dragging */}
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

export default FolioSortableList;
