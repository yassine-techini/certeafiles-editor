/**
 * HeaderFooterPlugin - Inject headers/footers into folios
 * Per Constitution Section 4.2 - Headers and Footers
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $createTextNode,
  $createParagraphNode,
} from 'lexical';
import { $getAllFolioNodes, FolioNode } from '../nodes/FolioNode';
import {
  $createHeaderNode,
  $isHeaderNode,
  HeaderNode,
} from '../nodes/HeaderNode';
import {
  $createFooterNode,
  $isFooterNode,
  FooterNode,
} from '../nodes/FooterNode';
import { useHeaderFooterStore } from '../stores/headerFooterStore';
import { useFolioStore } from '../stores/folioStore';
import type { HeaderFooterContent, HeaderFooterSegment } from '../types/headerFooter';
import { isModalCurrentlyOpen } from '../utils/modalState';

export interface HeaderFooterPluginProps {
  /** Whether to automatically inject headers/footers */
  autoInject?: boolean;
  /** Whether to sync with store changes */
  syncWithStore?: boolean;
}

// Debounce delay for sync operations (ms)
const SYNC_DEBOUNCE_DELAY = 500;
// Delay after initial load before allowing sync
const INITIAL_LOAD_DELAY = 1000;

/**
 * HeaderFooterPlugin - Manages header/footer injection and synchronization
 */
export function HeaderFooterPlugin({
  autoInject = true,
  syncWithStore = true,
}: HeaderFooterPluginProps): null {
  const [editor] = useLexicalComposerContext();

  // Refs for debouncing and preventing race conditions
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const lastFolioCountRef = useRef(0);

  // Get store state
  const getHeaderForFolio = useHeaderFooterStore((state) => state.getHeaderForFolio);
  const getFooterForFolio = useHeaderFooterStore((state) => state.getFooterForFolio);
  const defaultHeaderId = useHeaderFooterStore((state) => state.defaultHeaderId);
  const defaultFooterId = useHeaderFooterStore((state) => state.defaultFooterId);

  /**
   * Create content nodes from HeaderFooterSegment
   */
  const createSegmentContent = useCallback(
    (segment: HeaderFooterSegment | null, pageNumber: number, totalPages: number): string => {
      if (!segment) return '';

      if (segment.type === 'text' && segment.content) {
        // Replace placeholders
        return segment.content
          .replace('{page}', String(pageNumber))
          .replace('{total}', String(totalPages));
      }

      if (segment.type === 'dynamic' && segment.dynamicField) {
        switch (segment.dynamicField.type) {
          case 'page_number':
            return String(pageNumber);
          case 'total_pages':
            return String(totalPages);
          case 'date':
            return new Date().toLocaleDateString();
          case 'time':
            return new Date().toLocaleTimeString();
          default:
            return '';
        }
      }

      return '';
    },
    []
  );

  /**
   * Update header/footer content in a node
   */
  const updateNodeContent = useCallback(
    (
      node: HeaderNode | FooterNode,
      content: HeaderFooterContent | null,
      pageNumber: number,
      totalPages: number,
      isHeader: boolean = true
    ) => {
      // Clear existing children
      node.clear();

      if (!content) {
        // Add empty paragraph
        const para = $createParagraphNode();
        para.append($createTextNode(''));
        node.append(para);
        return;
      }

      // For header, create a table-like structured content
      if (isHeader) {
        // Create three paragraphs for left, center, right columns
        const leftPara = $createParagraphNode();
        const centerPara = $createParagraphNode();
        const rightPara = $createParagraphNode();

        // Left: Logo placeholder
        const leftText = createSegmentContent(content.left, pageNumber, totalPages) || '[Logo]';
        leftPara.append($createTextNode(leftText));

        // Center: Document title and group
        const centerText = createSegmentContent(content.center, pageNumber, totalPages) || 'Document';
        centerPara.append($createTextNode(centerText));

        // Right: Metadata (version, date, page)
        const rightText = createSegmentContent(content.right, pageNumber, totalPages) ||
          `Page ${pageNumber} / ${totalPages}`;
        rightPara.append($createTextNode(rightText));

        node.append(leftPara);
        node.append(centerPara);
        node.append(rightPara);
      } else {
        // For footer, simple centered content
        const container = $createParagraphNode();
        const leftText = createSegmentContent(content.left, pageNumber, totalPages);
        const centerText = createSegmentContent(content.center, pageNumber, totalPages);
        const rightText = createSegmentContent(content.right, pageNumber, totalPages);

        const parts: string[] = [];
        if (leftText) parts.push(leftText);
        if (centerText) parts.push(centerText);
        if (rightText) parts.push(rightText);

        const displayText = parts.join(' - ') || `Page ${pageNumber} / ${totalPages}`;
        container.append($createTextNode(displayText));
        node.append(container);
      }
    },
    [createSegmentContent]
  );

  /**
   * Inject or update header for a folio
   */
  const injectHeader = useCallback(
    (folioNode: FolioNode, pageNumber: number, totalPages: number) => {
      const folioId = folioNode.getFolioId();
      const resolved = getHeaderForFolio(folioId);

      // Find existing header in folio
      const children = folioNode.getChildren();
      let headerNode = children.find((child) => $isHeaderNode(child)) as HeaderNode | undefined;

      if (!resolved.content) {
        // No header needed - remove if exists
        if (headerNode) {
          headerNode.remove();
        }
        return;
      }

      const contentId = resolved.overrideId ?? defaultHeaderId;

      if (!headerNode) {
        // Create new header
        headerNode = $createHeaderNode({
          folioId,
          contentId: contentId ?? undefined,
          isDefault: resolved.isDefault,
          height: resolved.content.height,
        });

        // Insert at the beginning of folio
        const firstChild = folioNode.getFirstChild();
        if (firstChild) {
          firstChild.insertBefore(headerNode);
        } else {
          folioNode.append(headerNode);
        }
      } else {
        // Update existing header
        headerNode.setContentId(contentId ?? null);
        headerNode.setIsDefault(resolved.isDefault);
        headerNode.setHeight(resolved.content.height);
      }

      // Update content
      updateNodeContent(headerNode, resolved.content, pageNumber, totalPages, true);
    },
    [getHeaderForFolio, defaultHeaderId, updateNodeContent]
  );

  /**
   * Inject or update footer for a folio
   */
  const injectFooter = useCallback(
    (folioNode: FolioNode, pageNumber: number, totalPages: number) => {
      const folioId = folioNode.getFolioId();
      const resolved = getFooterForFolio(folioId);

      // Find existing footer in folio
      const children = folioNode.getChildren();
      let footerNode = children.find((child) => $isFooterNode(child)) as FooterNode | undefined;

      if (!resolved.content) {
        // No footer needed - remove if exists
        if (footerNode) {
          footerNode.remove();
        }
        return;
      }

      const contentId = resolved.overrideId ?? defaultFooterId;

      if (!footerNode) {
        // Create new footer
        footerNode = $createFooterNode({
          folioId,
          contentId: contentId ?? undefined,
          isDefault: resolved.isDefault,
          height: resolved.content.height,
        });

        // Insert at the end of folio
        folioNode.append(footerNode);
      } else {
        // Update existing footer
        footerNode.setContentId(contentId ?? null);
        footerNode.setIsDefault(resolved.isDefault);
        footerNode.setHeight(resolved.content.height);
      }

      // Update content
      updateNodeContent(footerNode, resolved.content, pageNumber, totalPages, false);
    },
    [getFooterForFolio, defaultFooterId, updateNodeContent]
  );

  /**
   * Internal sync function - performs the actual sync
   */
  const performSync = useCallback(() => {
    // Skip if a modal is open
    if (isModalCurrentlyOpen()) {
      console.log('[HeaderFooterPlugin] Skipping sync - modal is open');
      return;
    }

    // Skip if already syncing
    if (isSyncingRef.current) {
      console.log('[HeaderFooterPlugin] Skipping sync - already syncing');
      return;
    }

    isSyncingRef.current = true;

    editor.update(
      () => {
        const root = $getRoot();
        const folioNodes = $getAllFolioNodes(root);
        const totalPages = folioNodes.length;

        if (totalPages === 0) {
          console.log('[HeaderFooterPlugin] No folios found, skipping sync');
          isSyncingRef.current = false;
          return;
        }

        // Check if document is still loading (folio count changing rapidly)
        if (lastFolioCountRef.current > 0 && Math.abs(totalPages - lastFolioCountRef.current) > 5) {
          console.log('[HeaderFooterPlugin] Document loading detected, deferring sync');
          isSyncingRef.current = false;
          return;
        }

        lastFolioCountRef.current = totalPages;

        folioNodes.forEach((folioNode, index) => {
          const pageNumber = index + 1;

          // Check if folio already has header/footer to avoid duplicates
          const children = folioNode.getChildren();
          const existingHeaders = children.filter((child) => $isHeaderNode(child));
          const existingFooters = children.filter((child) => $isFooterNode(child));

          // Remove duplicate headers (keep first)
          if (existingHeaders.length > 1) {
            existingHeaders.slice(1).forEach((h) => h.remove());
          }

          // Remove duplicate footers (keep first)
          if (existingFooters.length > 1) {
            existingFooters.slice(1).forEach((f) => f.remove());
          }

          injectHeader(folioNode, pageNumber, totalPages);
          injectFooter(folioNode, pageNumber, totalPages);
        });

        console.log('[HeaderFooterPlugin] Synced headers/footers for', folioNodes.length, 'folios');
        isSyncingRef.current = false;
      },
      { tag: 'header-footer-sync', discrete: true }
    );

    // Safety: reset syncing flag after a timeout in case update doesn't complete
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 100);
  }, [editor, injectHeader, injectFooter]);

  /**
   * Debounced sync function - prevents rapid consecutive syncs
   */
  const syncAllHeadersFooters = useCallback(() => {
    // Cancel any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    // Schedule new sync with debounce
    syncTimeoutRef.current = setTimeout(() => {
      performSync();
      syncTimeoutRef.current = null;
    }, SYNC_DEBOUNCE_DELAY);
  }, [performSync]);

  /**
   * Immediate sync (for initial load only)
   */
  const syncImmediate = useCallback(() => {
    // Cancel any pending debounced sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    performSync();
  }, [performSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Initial injection - wait for document to be fully loaded
  useEffect(() => {
    if (!autoInject) return;

    // Wait for store initialization
    const unsubscribe = useHeaderFooterStore.subscribe(
      (state) => state.defaultHeaderId,
      (defaultHeaderId) => {
        if (defaultHeaderId && !isInitializedRef.current) {
          // Wait for document to stabilize before initial sync
          setTimeout(() => {
            isInitializedRef.current = true;
            syncImmediate();
          }, INITIAL_LOAD_DELAY);
        }
      },
      { fireImmediately: true }
    );

    return unsubscribe;
  }, [autoInject, syncImmediate]);

  // Sync when store changes (only after initialization)
  useEffect(() => {
    if (!syncWithStore) return;

    // Subscribe to relevant store changes
    const unsubscribeHeaders = useHeaderFooterStore.subscribe(
      (state) => ({
        headers: state.headers,
        folioHeaders: state.folioHeaders,
        defaultHeaderId: state.defaultHeaderId,
      }),
      () => {
        // Only sync after initialization
        if (isInitializedRef.current) {
          syncAllHeadersFooters();
        }
      }
    );

    const unsubscribeFooters = useHeaderFooterStore.subscribe(
      (state) => ({
        footers: state.footers,
        folioFooters: state.folioFooters,
        defaultFooterId: state.defaultFooterId,
      }),
      () => {
        // Only sync after initialization
        if (isInitializedRef.current) {
          syncAllHeadersFooters();
        }
      }
    );

    return () => {
      unsubscribeHeaders();
      unsubscribeFooters();
    };
  }, [syncWithStore, syncAllHeadersFooters]);

  // Sync when folios change (only after initialization, and only for significant changes)
  useEffect(() => {
    let previousSize = 0;

    const unsubscribe = useFolioStore.subscribe(
      (state) => state.folios.size,
      (size) => {
        // Only sync after initialization and if this is a single folio add/remove
        if (isInitializedRef.current && previousSize > 0 && Math.abs(size - previousSize) <= 2) {
          syncAllHeadersFooters();
        }
        previousSize = size;
      }
    );

    return unsubscribe;
  }, [syncAllHeadersFooters]);

  // Listen for editor updates - disabled during loading to prevent chaos
  useEffect(() => {
    return editor.registerUpdateListener(({ tags }) => {
      // Skip if not initialized
      if (!isInitializedRef.current) return;

      // Skip if this is from our own update
      if (tags.has('header-footer-sync')) return;

      // Skip if modal is open
      if (isModalCurrentlyOpen()) return;

      // Skip if currently syncing
      if (isSyncingRef.current) return;

      editor.getEditorState().read(() => {
        const root = $getRoot();
        const folioNodes = $getAllFolioNodes(root);

        // Check if any folio is missing header/footer
        let needsSync = false;
        folioNodes.forEach((folioNode) => {
          const children = folioNode.getChildren();
          const hasHeader = children.some((child) => $isHeaderNode(child));
          const hasFooter = children.some((child) => $isFooterNode(child));

          const headerResolved = getHeaderForFolio(folioNode.getFolioId());
          const footerResolved = getFooterForFolio(folioNode.getFolioId());

          if ((headerResolved.content && !hasHeader) || (footerResolved.content && !hasFooter)) {
            needsSync = true;
          }
        });

        if (needsSync && !isModalCurrentlyOpen()) {
          // Use debounced sync
          syncAllHeadersFooters();
        }
      });
    });
  }, [editor, getHeaderForFolio, getFooterForFolio, syncAllHeadersFooters]);

  return null;
}

export default HeaderFooterPlugin;
