/**
 * useFolioDragDrop - Drag and drop hook for folio reordering
 * Per Constitution Section 4.1
 */
import { useCallback } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useFolioStore } from '../stores/folioStore';

export interface UseFolioDragDropOptions {
  /** Callback when drag starts */
  onDragStart?: (folioId: string) => void;
  /** Callback when drag ends */
  onDragEnd?: (folioId: string, newIndex: number) => void;
}

export interface UseFolioDragDropReturn {
  /** Handler for drag start event */
  handleDragStart: (event: DragStartEvent) => void;
  /** Handler for drag end event */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Get ordered folio IDs */
  getOrderedFolioIds: () => string[];
}

/**
 * useFolioDragDrop - Hook to handle folio drag and drop reordering
 */
export function useFolioDragDrop(
  options: UseFolioDragDropOptions = {}
): UseFolioDragDropReturn {
  const { onDragStart, onDragEnd } = options;

  // Get store actions
  const reorderFolios = useFolioStore((state) => state.reorderFolios);
  const getFoliosInOrder = useFolioStore((state) => state.getFoliosInOrder);

  // Get ordered folio IDs
  const getOrderedFolioIds = useCallback((): string[] => {
    return getFoliosInOrder().map((folio) => folio.id);
  }, [getFoliosInOrder]);

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const folioId = event.active.id as string;
      onDragStart?.(folioId);
    },
    [onDragStart]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      const folioIds = getOrderedFolioIds();
      const oldIndex = folioIds.indexOf(active.id as string);
      const newIndex = folioIds.indexOf(over.id as string);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Reorder the array
      const newOrder = arrayMove(folioIds, oldIndex, newIndex);

      // Update the store
      reorderFolios(newOrder);

      // Call callback
      onDragEnd?.(active.id as string, newIndex);

      console.log('[useFolioDragDrop] Reordered folios:', {
        folioId: active.id,
        from: oldIndex,
        to: newIndex,
      });
    },
    [getOrderedFolioIds, reorderFolios, onDragEnd]
  );

  return {
    handleDragStart,
    handleDragEnd,
    getOrderedFolioIds,
  };
}

export default useFolioDragDrop;
