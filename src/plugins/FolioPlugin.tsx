/**
 * FolioPlugin - Syncs FolioNodes with folioStore
 * Per Constitution Section 3.2 - Plugins
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import {
  FolioNode,
  $createFolioNode,
  $createFolioNodeWithContent,
  $isFolioNode,
  $getAllFolioNodes,
  $getFolioNodeById,
  INSERT_FOLIO_COMMAND,
  DELETE_FOLIO_COMMAND,
  UPDATE_FOLIO_COMMAND,
} from '../nodes/FolioNode';
import { $generateNodesFromSerializedNodes } from '@lexical/clipboard';
import { useFolioStore } from '../stores/folioStore';

export interface FolioPluginProps {
  /** Whether to auto-sync with store on changes */
  autoSync?: boolean;
}

/**
 * FolioPlugin - Manages FolioNodes and syncs with Zustand store
 */
export function FolioPlugin({ autoSync = true }: FolioPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const isInitializedRef = useRef(false);
  const isSyncingRef = useRef(false);

  // Get store state and actions
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const { setActiveFolio, initialize } = useFolioStore.getState();

  // Initialize folios in editor from store
  const initializeFoliosInEditor = useCallback(() => {
    if (isInitializedRef.current) return;

    editor.update(() => {
      const root = $getRoot();
      const existingFolios = $getAllFolioNodes(root);

      // If there are already folio nodes, skip initialization
      if (existingFolios.length > 0) {
        console.log('[FolioPlugin] Editor already has folio nodes, skipping init');
        isInitializedRef.current = true;
        return;
      }

      // Get folios from store
      const storeFolios = useFolioStore.getState().getFoliosInOrder();

      if (storeFolios.length === 0) {
        // Initialize store with default folio
        initialize();
        return; // Will be called again when store updates
      }

      console.log('[FolioPlugin] Initializing editor with', storeFolios.length, 'folios');

      // Clear root and add folio nodes
      root.clear();

      storeFolios.forEach((folio) => {
        // Create the folio node
        const folioNode = $createFolioNode({
          folioId: folio.id,
          folioIndex: folio.index,
          orientation: folio.orientation,
          sectionId: folio.sectionId,
        });

        // If folio has content, parse and add it
        if (folio.content && folio.content.root && folio.content.root.children) {
          try {
            // Generate nodes from serialized content
            const nodes = $generateNodesFromSerializedNodes(folio.content.root.children);
            nodes.forEach((node) => {
              folioNode.append(node);
            });
            console.log('[FolioPlugin] Loaded content for folio', folio.id, 'with', nodes.length, 'nodes');
          } catch (error) {
            console.error('[FolioPlugin] Error loading content for folio', folio.id, error);
            // Fallback: add empty paragraph
            folioNode.append($createParagraphNode());
          }
        } else {
          // No content - add empty paragraph
          folioNode.append($createParagraphNode());
        }

        root.append(folioNode);
      });

      isInitializedRef.current = true;
    });
  }, [editor, initialize]);

  // Sync store folios to editor nodes
  const syncStoreToEditor = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    editor.update(() => {
      const root = $getRoot();
      const existingNodes = $getAllFolioNodes(root);
      const storeFolios = useFolioStore.getState().getFoliosInOrder();

      // Create a map of existing nodes by folioId
      const nodeMap = new Map<string, FolioNode>();
      existingNodes.forEach((node) => {
        nodeMap.set(node.getFolioId(), node);
      });

      // Track which nodes we've processed
      const processedIds = new Set<string>();

      // Update or create nodes for each store folio
      storeFolios.forEach((folio, index) => {
        processedIds.add(folio.id);
        const existingNode = nodeMap.get(folio.id);

        if (existingNode) {
          // Update existing node if properties changed
          if (existingNode.getFolioIndex() !== index) {
            existingNode.setFolioIndex(index);
          }
          if (existingNode.getOrientation() !== folio.orientation) {
            existingNode.setOrientation(folio.orientation);
          }
          if (existingNode.getSectionId() !== folio.sectionId) {
            existingNode.setSectionId(folio.sectionId);
          }
        } else {
          // Create new folio node
          const newNode = $createFolioNodeWithContent({
            folioId: folio.id,
            folioIndex: index,
            orientation: folio.orientation,
            sectionId: folio.sectionId,
          });

          // Insert at correct position
          const allNodes = $getAllFolioNodes(root);
          if (index >= allNodes.length) {
            root.append(newNode);
          } else {
            const nodeAtIndex = allNodes[index];
            if (nodeAtIndex) {
              nodeAtIndex.insertBefore(newNode);
            } else {
              root.append(newNode);
            }
          }
          console.log('[FolioPlugin] Created new folio node:', folio.id);
        }
      });

      // Remove nodes that are no longer in store
      existingNodes.forEach((node) => {
        if (!processedIds.has(node.getFolioId())) {
          console.log('[FolioPlugin] Removing folio node:', node.getFolioId());
          node.remove();
        }
      });

      // Reorder nodes to match store order
      const reorderedNodes = $getAllFolioNodes(root);
      reorderedNodes.forEach((node, index) => {
        const expectedFolio = storeFolios[index];
        if (expectedFolio && node.getFolioId() !== expectedFolio.id) {
          // Node is in wrong position, find correct node and swap
          const correctNode = reorderedNodes.find(
            (n) => n.getFolioId() === expectedFolio.id
          );
          if (correctNode) {
            node.insertBefore(correctNode);
          }
        }
      });
    });

    isSyncingRef.current = false;
  }, [editor]);

  // Handle INSERT_FOLIO_COMMAND
  const handleInsertFolio = useCallback(
    (payload: { folioId: string; folioIndex: number; orientation?: 'portrait' | 'landscape'; sectionId?: string | null }) => {
      editor.update(() => {
        const root = $getRoot();

        // Create new folio node
        const newFolioNode = $createFolioNodeWithContent({
          folioId: payload.folioId,
          folioIndex: payload.folioIndex,
          orientation: payload.orientation ?? 'portrait',
          sectionId: payload.sectionId ?? null,
        });

        // Find insertion position
        const existingNodes = $getAllFolioNodes(root);
        if (payload.folioIndex >= existingNodes.length) {
          root.append(newFolioNode);
        } else {
          const nodeAtIndex = existingNodes[payload.folioIndex];
          if (nodeAtIndex) {
            nodeAtIndex.insertBefore(newFolioNode);
          } else {
            root.append(newFolioNode);
          }
        }

        // Update indices of subsequent nodes
        $getAllFolioNodes(root).forEach((node, idx) => {
          if (node.getFolioIndex() !== idx) {
            node.setFolioIndex(idx);
          }
        });

        console.log('[FolioPlugin] Inserted folio node:', payload.folioId);
      });

      return true;
    },
    [editor]
  );

  // Handle DELETE_FOLIO_COMMAND
  const handleDeleteFolio = useCallback(
    (folioId: string) => {
      editor.update(() => {
        const root = $getRoot();
        const folioNode = $getFolioNodeById(root, folioId);

        if (folioNode) {
          // Don't delete if it's the only folio
          const allFolios = $getAllFolioNodes(root);
          if (allFolios.length <= 1) {
            console.warn('[FolioPlugin] Cannot delete last folio');
            return;
          }

          folioNode.remove();

          // Re-index remaining folios
          $getAllFolioNodes(root).forEach((node, idx) => {
            node.setFolioIndex(idx);
          });

          console.log('[FolioPlugin] Deleted folio node:', folioId);
        }
      });

      return true;
    },
    [editor]
  );

  // Handle UPDATE_FOLIO_COMMAND
  const handleUpdateFolio = useCallback(
    (payload: { folioId: string; updates: Partial<{ folioIndex: number; orientation: 'portrait' | 'landscape'; sectionId: string | null }> }) => {
      editor.update(() => {
        const root = $getRoot();
        const folioNode = $getFolioNodeById(root, payload.folioId);

        if (folioNode) {
          if (payload.updates.orientation !== undefined) {
            folioNode.setOrientation(payload.updates.orientation);
          }
          if (payload.updates.sectionId !== undefined) {
            folioNode.setSectionId(payload.updates.sectionId);
          }
          if (payload.updates.folioIndex !== undefined) {
            folioNode.setFolioIndex(payload.updates.folioIndex);
          }

          console.log('[FolioPlugin] Updated folio node:', payload.folioId, payload.updates);
        }
      });

      return true;
    },
    [editor]
  );

  // Initialize on mount
  useEffect(() => {
    // Small delay to ensure store is initialized
    const timeoutId = setTimeout(() => {
      initializeFoliosInEditor();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [initializeFoliosInEditor]);

  // Register commands
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        INSERT_FOLIO_COMMAND,
        handleInsertFolio,
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        DELETE_FOLIO_COMMAND,
        handleDeleteFolio,
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        UPDATE_FOLIO_COMMAND,
        handleUpdateFolio,
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor, handleInsertFolio, handleDeleteFolio, handleUpdateFolio]);

  // Subscribe to store changes and sync to editor
  useEffect(() => {
    if (!autoSync) return;

    // Subscribe to the folios Map directly - this gives us proper change detection
    const unsubscribe = useFolioStore.subscribe(
      (state) => state.folios,
      (newFoliosMap, prevFoliosMap) => {
        // Convert to arrays for comparison
        const newFolios = Array.from(newFoliosMap.values()).sort((a, b) => a.index - b.index);
        const prevFolios = Array.from(prevFoliosMap.values()).sort((a, b) => a.index - b.index);

        // Only sync if folios actually changed
        if (
          newFolios.length !== prevFolios.length ||
          newFolios.some((f, i) => {
            const prev = prevFolios[i];
            return (
              !prev ||
              f.id !== prev.id ||
              f.orientation !== prev.orientation ||
              f.index !== prev.index
            );
          })
        ) {
          console.log('[FolioPlugin] Store changed, syncing to editor');
          syncStoreToEditor();
        }
      }
    );

    return unsubscribe;
  }, [autoSync, syncStoreToEditor]);

  // Track active folio based on selection
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();

        // Walk up to find containing FolioNode
        let node = anchorNode;
        while (node !== null) {
          if ($isFolioNode(node)) {
            const folioId = node.getFolioId();
            if (folioId !== activeFolioId) {
              setActiveFolio(folioId);
            }
            return;
          }
          const parent = node.getParent();
          if (parent === null) break;
          node = parent;
        }
      });
    });
  }, [editor, activeFolioId, setActiveFolio]);

  return null;
}

export default FolioPlugin;
