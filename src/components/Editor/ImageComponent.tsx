/**
 * ImageComponent - React component for rendering images in the editor
 * Per Constitution Section 3.3
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Trash2,
  GripHorizontal,
} from 'lucide-react';
import { $isImageNode } from '../../nodes/ImageNode';
import type { ImageAlignment } from '../../nodes/ImageNode';

export interface ImageComponentProps {
  src: string;
  altText: string;
  width?: number | undefined;
  height?: number | undefined;
  alignment: ImageAlignment;
  caption: string;
  nodeKey: string;
  resizable?: boolean;
}

/**
 * ImageComponent - Renders an image with resize handles and controls
 */
export function ImageComponent({
  src,
  altText,
  width,
  height,
  alignment,
  caption,
  nodeKey,
  resizable = true,
}: ImageComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState(caption);
  const [currentWidth, setCurrentWidth] = useState(width);
  const [currentHeight, setCurrentHeight] = useState(height);

  // Handle click to select
  const onSelect = useCallback(
    (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        if (!event.shiftKey) {
          clearSelection();
        }
        setSelected(true);
        return true;
      }
      return false;
    },
    [clearSelection, setSelected]
  );

  // Handle delete
  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.remove();
          }
        });
        return true;
      }
      return false;
    },
    [editor, isSelected, nodeKey]
  );

  // Handle escape to deselect
  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected) {
        event.preventDefault();
        clearSelection();
        setEditingCaption(false);
        return true;
      }
      return false;
    },
    [clearSelection, isSelected]
  );

  // Handle enter to edit caption
  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && !editingCaption) {
        event.preventDefault();
        setEditingCaption(true);
        return true;
      }
      return false;
    },
    [isSelected, editingCaption]
  );

  // Register event handlers
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        onSelect,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        onEscape,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        onEnter,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, onSelect, onDelete, onEscape, onEnter]);

  // Update caption in node
  const updateCaption = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setCaption(captionText);
      }
    });
    setEditingCaption(false);
  }, [editor, nodeKey, captionText]);

  // Update alignment
  const setAlignment = useCallback(
    (newAlignment: ImageAlignment) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.setAlignment(newAlignment);
        }
      });
    },
    [editor, nodeKey]
  );

  // Delete image
  const deleteImage = useCallback(() => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.remove();
      }
    });
  }, [editor, nodeKey]);

  // Resize handling
  const onResizeStart = useCallback(
    (event: React.MouseEvent, direction: 'nw' | 'ne' | 'sw' | 'se') => {
      if (!resizable) return;
      event.preventDefault();
      event.stopPropagation();

      const startX = event.clientX;
      const startWidth = currentWidth || imageRef.current?.naturalWidth || 300;
      const startHeight = currentHeight || imageRef.current?.naturalHeight || 200;
      const aspectRatio = startWidth / startHeight;

      setIsResizing(true);

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        // deltaY is not used because we maintain aspect ratio

        let newWidth = startWidth;
        let newHeight = startHeight;

        // Calculate new dimensions based on direction
        if (direction === 'se' || direction === 'ne') {
          newWidth = Math.max(100, startWidth + deltaX);
        } else {
          newWidth = Math.max(100, startWidth - deltaX);
        }

        // Maintain aspect ratio
        newHeight = newWidth / aspectRatio;

        setCurrentWidth(Math.round(newWidth));
        setCurrentHeight(Math.round(newHeight));
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // Update node dimensions
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.setDimensions(currentWidth, currentHeight);
          }
        });
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [currentWidth, currentHeight, editor, nodeKey, resizable]
  );

  // Alignment styles
  const alignmentStyles: Record<ImageAlignment, React.CSSProperties> = {
    left: { marginRight: 'auto' },
    center: { marginLeft: 'auto', marginRight: 'auto' },
    right: { marginLeft: 'auto' },
    full: { width: '100%' },
  };

  return (
    <div
      ref={containerRef}
      className={`image-component relative inline-block ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={alignmentStyles[alignment]}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isSelected && setShowControls(false)}
      draggable={false}
    >
      {/* Image */}
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        width={currentWidth || width}
        height={currentHeight || height}
        className={`max-w-full h-auto ${isResizing ? 'pointer-events-none' : ''}`}
        style={{
          width: alignment === 'full' ? '100%' : currentWidth || width || 'auto',
          height: alignment === 'full' ? 'auto' : currentHeight || height || 'auto',
        }}
        draggable={false}
      />

      {/* Controls Overlay */}
      {(showControls || isSelected) && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white rounded-lg shadow-lg p-1 z-10">
          <button
            type="button"
            onClick={() => setAlignment('left')}
            className={`p-1.5 rounded hover:bg-gray-100 ${alignment === 'left' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Align left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setAlignment('center')}
            className={`p-1.5 rounded hover:bg-gray-100 ${alignment === 'center' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Align center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => setAlignment('right')}
            className={`p-1.5 rounded hover:bg-gray-100 ${alignment === 'right' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Align right"
          >
            <AlignRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => setAlignment('full')}
            className={`p-1.5 rounded hover:bg-gray-100 ${alignment === 'full' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
            title="Full width"
          >
            <Maximize2 size={16} />
          </button>
          <div className="w-px bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={deleteImage}
            className="p-1.5 rounded hover:bg-red-100 text-red-600"
            title="Delete image"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Resize Handles */}
      {resizable && isSelected && alignment !== 'full' && (
        <>
          <div
            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize rounded-sm -translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => onResizeStart(e, 'nw')}
          >
            <GripHorizontal size={10} className="text-white" />
          </div>
          <div
            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize rounded-sm translate-x-1/2 -translate-y-1/2"
            onMouseDown={(e) => onResizeStart(e, 'ne')}
          >
            <GripHorizontal size={10} className="text-white" />
          </div>
          <div
            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize rounded-sm -translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => onResizeStart(e, 'sw')}
          >
            <GripHorizontal size={10} className="text-white" />
          </div>
          <div
            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm translate-x-1/2 translate-y-1/2"
            onMouseDown={(e) => onResizeStart(e, 'se')}
          >
            <GripHorizontal size={10} className="text-white" />
          </div>
        </>
      )}

      {/* Caption */}
      {(caption || editingCaption) && (
        <div className="mt-2 text-center">
          {editingCaption ? (
            <input
              type="text"
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              onBlur={updateCaption}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateCaption();
                } else if (e.key === 'Escape') {
                  setCaptionText(caption);
                  setEditingCaption(false);
                }
              }}
              className="w-full text-center text-sm text-gray-600 border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1"
              placeholder="Add a caption..."
              autoFocus
            />
          ) : (
            <p
              className="text-sm text-gray-600 italic cursor-pointer hover:text-gray-800"
              onClick={() => isSelected && setEditingCaption(true)}
            >
              {caption}
            </p>
          )}
        </div>
      )}

      {/* Add caption prompt when selected but no caption */}
      {isSelected && !caption && !editingCaption && (
        <button
          type="button"
          onClick={() => setEditingCaption(true)}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 block mx-auto"
        >
          + Add caption
        </button>
      )}
    </div>
  );
}

export default ImageComponent;
