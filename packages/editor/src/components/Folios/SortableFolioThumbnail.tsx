/**
 * SortableFolioThumbnail - Draggable wrapper for FolioThumbnail
 * Per Constitution Section 4.1
 */
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { FolioThumbnail } from './FolioThumbnail';
import type { FolioThumbnailProps } from './FolioThumbnail';

export interface SortableFolioThumbnailProps extends FolioThumbnailProps {
  /** Whether drag is disabled */
  disabled?: boolean;
}

/**
 * SortableFolioThumbnail - Wraps FolioThumbnail with drag-and-drop functionality
 */
export function SortableFolioThumbnail({
  folioId,
  disabled = false,
  ...props
}: SortableFolioThumbnailProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: folioId,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'ring-2 ring-blue-400 rounded-lg' : ''}`}
    >
      {/* Drag handle */}
      {!disabled && (
        <button
          type="button"
          className={`
            absolute left-0 top-1/2 -translate-y-1/2 z-10
            p-1 rounded-r bg-gray-100 hover:bg-gray-200
            cursor-grab active:cursor-grabbing
            opacity-0 hover:opacity-100 transition-opacity
            ${isDragging ? 'opacity-100 bg-blue-100' : ''}
          `}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} className="text-gray-500" />
        </button>
      )}

      <FolioThumbnail folioId={folioId} {...props} />
    </div>
  );
}

export default SortableFolioThumbnail;
