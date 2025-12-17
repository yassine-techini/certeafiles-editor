/**
 * ImagePlugin - Handles image insertion, upload, drag/drop, and paste
 * Per Constitution Section 3.2
 */
import { useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  PASTE_COMMAND,
} from 'lexical';
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils';
import {
  $createImageNode,
  ImageNode,
  INSERT_IMAGE_COMMAND,
} from '../nodes/ImageNode';
import type { ImagePayload } from '../nodes/ImageNode';

export interface ImagePluginProps {
  /** API endpoint for uploading images */
  uploadEndpoint?: string;
  /** Maximum file size in bytes (default 10MB) */
  maxFileSize?: number;
  /** Allowed MIME types */
  allowedTypes?: string[];
  /** Callback when upload starts */
  onUploadStart?: () => void;
  /** Callback when upload completes */
  onUploadComplete?: (url: string) => void;
  /** Callback when upload fails */
  onUploadError?: (error: Error) => void;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

/**
 * Upload a file to R2 via the API
 */
async function uploadToR2(
  file: File,
  endpoint: string
): Promise<{ url: string; width?: number; height?: number }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }

  return response.json();
}

/**
 * Get image dimensions from a file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if an event contains files
 */
function hasFiles(event: DragEvent | ClipboardEvent): boolean {
  if ('dataTransfer' in event && event.dataTransfer) {
    return event.dataTransfer.files.length > 0;
  }
  if ('clipboardData' in event && event.clipboardData) {
    return event.clipboardData.files.length > 0;
  }
  return false;
}

/**
 * Get files from an event
 */
function getFiles(event: DragEvent | ClipboardEvent): FileList | null {
  if ('dataTransfer' in event && event.dataTransfer) {
    return event.dataTransfer.files;
  }
  if ('clipboardData' in event && event.clipboardData) {
    return event.clipboardData.files;
  }
  return null;
}

/**
 * Check if file is a valid image
 */
function isValidImageFile(file: File, allowedTypes: string[], maxSize: number): boolean {
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}

/**
 * ImagePlugin - Manages image functionality in the editor
 */
export function ImagePlugin({
  uploadEndpoint = '/api/upload',
  maxFileSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: ImagePluginProps): null {
  const [editor] = useLexicalComposerContext();

  // Insert image into editor
  const insertImage = useCallback(
    (payload: ImagePayload) => {
      editor.update(() => {
        const imageNode = $createImageNode(payload);
        $insertNodes([imageNode]);
        if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
          $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
        }
      });
    },
    [editor]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!isValidImageFile(file, allowedTypes, maxFileSize)) {
        const error = new Error(
          file.size > maxFileSize
            ? `File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`
            : `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        );
        onUploadError?.(error);
        return;
      }

      onUploadStart?.();

      try {
        // Get dimensions before upload
        const dimensions = await getImageDimensions(file);

        // Upload to R2
        const result = await uploadToR2(file, uploadEndpoint);

        // Insert image into editor
        insertImage({
          src: result.url,
          altText: file.name,
          width: result.width || dimensions.width,
          height: result.height || dimensions.height,
        });

        onUploadComplete?.(result.url);
      } catch (error) {
        onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
      }
    },
    [uploadEndpoint, maxFileSize, allowedTypes, insertImage, onUploadStart, onUploadComplete, onUploadError]
  );

  // Register commands
  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error('ImagePlugin: ImageNode not registered in editor');
    }

    return mergeRegister(
      // Handle INSERT_IMAGE_COMMAND
      editor.registerCommand(
        INSERT_IMAGE_COMMAND,
        (payload: ImagePayload) => {
          insertImage(payload);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),

      // Handle paste
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          if (hasFiles(event)) {
            const files = getFiles(event);
            if (files) {
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('image/')) {
                  event.preventDefault();
                  handleFileUpload(file);
                  return true;
                }
              }
            }
          }

          // Check for pasted image URL
          const html = event.clipboardData?.getData('text/html');
          if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const img = doc.querySelector('img');
            if (img?.src) {
              event.preventDefault();
              insertImage({
                src: img.src,
                altText: img.alt || '',
                width: img.width || undefined,
                height: img.height || undefined,
              });
              return true;
            }
          }

          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),

      // Handle dragover
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event: DragEvent) => {
          const hasImageFiles = event.dataTransfer?.types.includes('Files');
          if (hasImageFiles) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),

      // Handle drop
      editor.registerCommand(
        DROP_COMMAND,
        (event: DragEvent) => {
          if (hasFiles(event)) {
            const files = getFiles(event);
            if (files) {
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('image/')) {
                  event.preventDefault();
                  handleFileUpload(file);
                  return true;
                }
              }
            }
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),

      // Prevent dragging images outside the editor
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event: DragEvent) => {
          const target = event.target as HTMLElement;
          if (target.tagName === 'IMG') {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, insertImage, handleFileUpload]);

  return null;
}

export default ImagePlugin;
