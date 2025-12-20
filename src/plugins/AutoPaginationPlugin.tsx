/**
 * AutoPaginationPlugin - Automatically creates new pages when content overflows
 * Per Constitution Section 2.6 - Pagination
 */
import { useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $setSelection,
  $createRangeSelection,
  $getSelection,
  $isRangeSelection,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_HIGH,
  type LexicalNode,
} from 'lexical';
import { v4 as uuidv4 } from 'uuid';
import {
  type FolioNode,
  $createFolioNodeWithContent,
  $getAllFolioNodes,
} from '../nodes/FolioNode';
import { useFolioStore } from '../stores/folioStore';
import { isModalCurrentlyOpen } from '../utils/modalState';

export interface AutoPaginationPluginProps {
  /** Whether auto pagination is enabled */
  enabled?: boolean;
  /** Debounce delay in ms for checking overflow */
  debounceMs?: number;
}

/**
 * Get the available content height of a folio (excluding header/footer)
 */
function getContentHeight(folioElement: Element): number {
  // Find header and footer elements within the folio
  const header = folioElement.querySelector('[data-header-node]');
  const footer = folioElement.querySelector('[data-footer-node]');

  const totalHeight = folioElement.clientHeight;
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const footerHeight = footer ? footer.getBoundingClientRect().height : 0;

  // Return available content area height
  return totalHeight - headerHeight - footerHeight;
}

/**
 * Get the current content scroll height (excluding header/footer)
 */
function getContentScrollHeight(folioElement: Element): number {
  // Sum up heights of all children except header/footer
  const children = folioElement.children;
  let contentHeight = 0;

  for (const child of children) {
    if (!child.hasAttribute('data-header-node') && !child.hasAttribute('data-footer-node')) {
      contentHeight += child.getBoundingClientRect().height;
    }
  }

  return contentHeight;
}

/**
 * Check if a folio element has overflow (content exceeds visible area)
 */
function hasFolioOverflow(folioElement: Element): boolean {
  const availableHeight = getContentHeight(folioElement);
  const contentHeight = getContentScrollHeight(folioElement);

  // 10px tolerance for rounding errors
  return contentHeight > availableHeight + 10;
}

/**
 * Get the folio element from current selection
 */
function getCurrentFolioElement(): { element: Element | null; folioId: string | null } {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return { element: null, folioId: null };
  }

  const range = selection.getRangeAt(0);
  let element: Element | null = range.startContainer instanceof Element
    ? range.startContainer
    : range.startContainer.parentElement;

  while (element && !element.hasAttribute('data-folio-id')) {
    element = element.parentElement;
  }

  if (!element) {
    return { element: null, folioId: null };
  }

  return {
    element,
    folioId: element.getAttribute('data-folio-id'),
  };
}

/**
 * AutoPaginationPlugin - Monitors folio content and creates new pages when overflow detected
 */
export function AutoPaginationPlugin({
  enabled = true,
  debounceMs = 100,
}: AutoPaginationPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const { createFolio } = useFolioStore.getState();

  /**
   * Create a new page and move overflow content to it
   */
  const createNewPageWithOverflowContent = useCallback((
    currentFolioNode: FolioNode,
    nodesToMove: LexicalNode[]
  ): FolioNode | null => {
    // Skip if a modal is open
    if (isModalCurrentlyOpen()) return null;

    if (nodesToMove.length === 0) return null;

    const root = $getRoot();
    const folioId = currentFolioNode.getFolioId();
    const orientation = currentFolioNode.getOrientation();
    const folioIndex = currentFolioNode.getFolioIndex();

    // Check if next folio already exists
    const allFolios = $getAllFolioNodes(root);
    let nextFolioNode = allFolios.find(f => f.getFolioIndex() === folioIndex + 1);

    if (!nextFolioNode) {
      // Generate new folio ID first
      const newFolioId = uuidv4();

      // Create new folio node in editor first
      nextFolioNode = $createFolioNodeWithContent({
        folioId: newFolioId,
        folioIndex: folioIndex + 1,
        orientation: orientation,
      });

      // Insert after current folio
      currentFolioNode.insertAfter(nextFolioNode);

      // Update indices of subsequent folios
      $getAllFolioNodes(root).forEach((node, idx) => {
        if (node.getFolioIndex() !== idx) {
          node.setFolioIndex(idx);
        }
      });

      // Create folio in store with the same ID (deferred to avoid nested updates)
      const capturedNewFolioId = newFolioId;
      const capturedOrientation = orientation;
      setTimeout(() => {
        const { folios } = useFolioStore.getState();
        // Only create if not already in store
        if (!folios.has(capturedNewFolioId)) {
          createFolio({
            afterId: folioId,
            orientation: capturedOrientation,
          });
        }
      }, 0);

      console.log('[AutoPagination] Created new page:', newFolioId);
    }

    // Move nodes to the next page - skip header/footer nodes
    const targetChildren = nextFolioNode.getChildren();
    const targetFirstContentChild = targetChildren.find(child => {
      const key = child.getKey();
      const element = editor.getElementByKey(key);
      return element && !element.hasAttribute('data-header-node') && !element.hasAttribute('data-footer-node');
    });

    // Remove the initial empty paragraph if exists and we're adding content
    if (targetFirstContentChild && targetFirstContentChild.getTextContent() === '') {
      targetFirstContentChild.remove();
    }

    // Filter nodes to move - don't move header/footer nodes
    const contentNodesToMove = nodesToMove.filter(node => {
      const key = node.getKey();
      const element = editor.getElementByKey(key);
      return !element || (!element.hasAttribute('data-header-node') && !element.hasAttribute('data-footer-node'));
    });

    // Move each node to the next page (insert before footer if exists)
    const nextChildren = nextFolioNode.getChildren();
    const footerNode = nextChildren.find(child => {
      const key = child.getKey();
      const element = editor.getElementByKey(key);
      return element && element.hasAttribute('data-footer-node');
    });

    contentNodesToMove.forEach((node) => {
      node.remove();
      if (footerNode) {
        footerNode.insertBefore(node);
      } else {
        nextFolioNode!.append(node);
      }
    });

    console.log('[AutoPagination] Moved', contentNodesToMove.length, 'nodes to next page');

    // Move cursor to the first moved node in the new page
    if (contentNodesToMove.length > 0) {
      try {
        const firstMovedNode = contentNodesToMove[0];
        const newSelection = $createRangeSelection();

        // Set selection at the beginning of the first moved node
        newSelection.anchor.set(firstMovedNode.getKey(), 0, 'element');
        newSelection.focus.set(firstMovedNode.getKey(), 0, 'element');
        $setSelection(newSelection);
      } catch (error) {
        console.warn('[AutoPagination] Could not set selection:', error);
      }

      // NOTE: We intentionally do NOT call setActiveFolio or scrollIntoView here
      // during auto-pagination to avoid scroll jumps during document loading.
      // The user's current scroll position should be preserved.
    }

    return nextFolioNode;
  }, [editor, createFolio]);

  /**
   * Handle Enter key - check if we need to create a new page
   */
  const handleEnterKey = useCallback((event: KeyboardEvent | null): boolean => {
    if (!enabled || isProcessingRef.current) return false;

    // Skip if a modal is open
    if (isModalCurrentlyOpen()) return false;

    const { element: folioElement, folioId } = getCurrentFolioElement();
    if (!folioElement || !folioId) return false;

    // Check if folio has overflow or is about to overflow
    const hasOverflow = hasFolioOverflow(folioElement);

    if (hasOverflow) {
      console.log('[AutoPagination] Enter key - overflow detected, creating new page');

      isProcessingRef.current = true;

      try {
        editor.update(() => {
          const root = $getRoot();
          const folioNodes = $getAllFolioNodes(root);
          const folio = folioNodes.find(f => f.getFolioId() === folioId);

          if (folio) {
            // Find all nodes that overflow the page
            const children = folio.getChildren();
            const folioElementForHeight = document.querySelector(`[data-folio-id="${folioId}"]`);

            if (!folioElementForHeight) {
              return;
            }

            // Use content height (excluding header/footer)
            const maxHeight = getContentHeight(folioElementForHeight);
            const nodesToMove: LexicalNode[] = [];

            // Get header height offset for correct position calculation
            const header = folioElementForHeight.querySelector('[data-header-node]');
            const headerHeight = header ? header.getBoundingClientRect().height : 0;

            // Find which nodes overflow (skip header/footer nodes)
            for (let i = 0; i < children.length; i++) {
              const child = children[i];
              const childKey = child.getKey();
              const childElement = editor.getElementByKey(childKey);

              if (childElement) {
                // Skip header/footer nodes
                if (childElement.hasAttribute('data-header-node') ||
                    childElement.hasAttribute('data-footer-node')) {
                  continue;
                }

                const childRect = childElement.getBoundingClientRect();
                const folioRect = folioElementForHeight.getBoundingClientRect();
                // Adjust for header offset
                const childBottom = childRect.bottom - folioRect.top - headerHeight;

                // If this child's bottom exceeds the content area height, it overflows
                if (childBottom > maxHeight) {
                  nodesToMove.push(child);
                }
              }
            }

            // If we found overflow nodes, move them
            if (nodesToMove.length > 0) {
              createNewPageWithOverflowContent(folio, nodesToMove);
            } else {
              // No specific overflow nodes found, but overflow detected
              // This can happen with a single large element
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();
                // Don't move header/footer nodes
                const anchorElement = editor.getElementByKey(anchorNode.getKey());
                if (anchorElement &&
                    !anchorElement.hasAttribute('data-header-node') &&
                    !anchorElement.hasAttribute('data-footer-node')) {
                  createNewPageWithOverflowContent(folio, [anchorNode]);
                }
              }
            }
          }
        });
      } finally {
        isProcessingRef.current = false;
      }

      // Prevent default Enter behavior
      if (event) {
        event.preventDefault();
      }
      return true;
    }

    return false;
  }, [editor, enabled, createNewPageWithOverflowContent]);

  /**
   * Check for overflow after each update and handle it
   */
  const checkAndHandleOverflow = useCallback(() => {
    if (!enabled || isProcessingRef.current) return;

    // Skip if a modal is open
    if (isModalCurrentlyOpen()) return;

    // Check all folios for overflow, not just the current selection's folio
    const allFolioElements = document.querySelectorAll('[data-folio-id]');

    for (const folioElement of allFolioElements) {
      const folioId = folioElement.getAttribute('data-folio-id');
      if (!folioId) continue;

      if (hasFolioOverflow(folioElement)) {
        console.log('[AutoPagination] Overflow detected in folio', folioId, {
          contentHeight: getContentScrollHeight(folioElement),
          availableHeight: getContentHeight(folioElement),
        });

        isProcessingRef.current = true;

        try {
          editor.update(() => {
            const root = $getRoot();
            const folioNodes = $getAllFolioNodes(root);
            const folio = folioNodes.find(f => f.getFolioId() === folioId);

            if (folio) {
              const children = folio.getChildren();
              // Use content height (excluding header/footer)
              const maxHeight = getContentHeight(folioElement);
              const nodesToMove: LexicalNode[] = [];

              // Get header height offset for correct position calculation
              const header = folioElement.querySelector('[data-header-node]');
              const headerHeight = header ? header.getBoundingClientRect().height : 0;

              // Find which nodes overflow (skip header/footer nodes)
              for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const childKey = child.getKey();
                const childElement = editor.getElementByKey(childKey);

                if (childElement) {
                  // Skip header/footer nodes
                  if (childElement.hasAttribute('data-header-node') ||
                      childElement.hasAttribute('data-footer-node')) {
                    continue;
                  }

                  const childRect = childElement.getBoundingClientRect();
                  const folioRect = folioElement.getBoundingClientRect();
                  // Adjust for header offset
                  const childBottom = childRect.bottom - folioRect.top - headerHeight;

                  // If this child's bottom exceeds the content area height, it overflows
                  if (childBottom > maxHeight) {
                    nodesToMove.push(child);
                  }
                }
              }

              // Move overflow nodes to next page
              if (nodesToMove.length > 0) {
                createNewPageWithOverflowContent(folio, nodesToMove);
              }
            }
          });
        } finally {
          isProcessingRef.current = false;
        }

        // Re-check after changes (might still have overflow)
        setTimeout(() => checkAndHandleOverflow(), debounceMs);
        return; // Process one folio at a time
      }
    }
  }, [editor, enabled, createNewPageWithOverflowContent, debounceMs]);

  /**
   * Schedule overflow check with debounce
   */
  const scheduleOverflowCheck = useCallback(() => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    checkTimeoutRef.current = setTimeout(checkAndHandleOverflow, debounceMs);
  }, [checkAndHandleOverflow, debounceMs]);

  /**
   * Register Enter key command
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        return handleEnterKey(event);
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, enabled, handleEnterKey]);

  /**
   * Listen to editor updates and check for overflow
   */
  useEffect(() => {
    if (!enabled) return;

    const removeUpdateListener = editor.registerUpdateListener(({ dirtyElements }) => {
      if (dirtyElements.size > 0) {
        scheduleOverflowCheck();
      }
    });

    // Initial check after mount
    setTimeout(checkAndHandleOverflow, 500);

    return () => {
      removeUpdateListener();
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [editor, enabled, scheduleOverflowCheck, checkAndHandleOverflow]);

  return null;
}

export default AutoPaginationPlugin;
