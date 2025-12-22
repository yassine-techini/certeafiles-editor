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
import { isModalCurrentlyOpen } from '../utils/modalState';

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
  // Generation counter to prevent feedback loops
  const syncGenerationRef = useRef(0);
  // Ref to hold the init function for recursive calls
  const initFnRef = useRef<(() => void) | null>(null);
  // Track editor instance to detect remounts
  const editorIdRef = useRef<string | null>(null);

  // Get store state and actions
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const { setActiveFolio, initialize } = useFolioStore.getState();

  /**
   * Sync editor FolioNodes TO the store (additive only - never removes existing store data)
   * This is called when the editor has folio nodes that don't exist in the store
   * Uses a generation counter to prevent race conditions
   */
  const syncEditorToStore = useCallback(() => {
    if (isSyncingRef.current) return;

    // Increment generation to track this sync operation
    const currentGeneration = ++syncGenerationRef.current;
    isSyncingRef.current = true;

    try {
      editor.getEditorState().read(() => {
        // Check if a newer sync was started (race condition prevention)
        if (currentGeneration !== syncGenerationRef.current) {
          return;
        }

        const root = $getRoot();
        const editorFolios = $getAllFolioNodes(root);
        const storeState = useFolioStore.getState();
        const storeFolios = storeState.folios;

        // Only add missing folios to store - never clear or remove
        if (editorFolios.length > 0) {
          const newFolios = new Map(storeFolios);
          let hasChanges = false;
          let firstId: string | null = storeState.activeFolioId;

          editorFolios.forEach((folioNode, index) => {
            const folioId = folioNode.getFolioId();

            // Only add if not already in store
            if (!newFolios.has(folioId)) {
              const orientation = folioNode.getOrientation();
              const sectionId = folioNode.getSectionId();

              const folio: import('../types/folio').Folio = {
                id: folioId,
                index,
                orientation: orientation as 'portrait' | 'landscape',
                sectionId: sectionId || null,
                locked: false,
                status: 'draft' as const,
                margins: { top: 20, right: 20, bottom: 20, left: 20 },
                content: null,
                headerId: null,
                footerId: null,
                metadata: {},
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              newFolios.set(folioId, folio);
              hasChanges = true;

              if (index === 0 && !firstId) {
                firstId = folioId;
              }
            } else {
              // Update index if changed
              const existingFolio = newFolios.get(folioId);
              if (existingFolio && existingFolio.index !== index) {
                newFolios.set(folioId, { ...existingFolio, index });
                hasChanges = true;
              }
            }
          });

          // Final check before committing - ensure we're still the latest sync
          if (hasChanges && currentGeneration === syncGenerationRef.current) {
            useFolioStore.setState({
              folios: newFolios,
              activeFolioId: firstId,
            });
          }
        }
      });
    } finally {
      // Only reset if we're still the current generation
      if (currentGeneration === syncGenerationRef.current) {
        isSyncingRef.current = false;
      }
    }
  }, [editor]);

  // Initialize folios in editor from store
  const initializeFoliosInEditor = useCallback(() => {
    // Detect editor remount by checking editor key
    const currentEditorKey = editor.getKey();
    if (editorIdRef.current !== currentEditorKey) {
      // New editor instance - reset initialization state
      console.log('[FolioPlugin] New editor detected, resetting init state');
      editorIdRef.current = currentEditorKey;
      isInitializedRef.current = false;
      isSyncingRef.current = false;
      syncGenerationRef.current = 0;
    }

    if (isInitializedRef.current) return;

    // Get folios from store BEFORE updating editor
    const storeFolios = useFolioStore.getState().getFoliosInOrder();

    // If store is empty, initialize first then retry
    if (storeFolios.length === 0) {
      console.log('[FolioPlugin] Store empty, initializing...');
      initialize();

      // Use a simple retry after store is initialized
      // The initialize() call is synchronous and immediately sets folios
      setTimeout(() => {
        const newStoreFolios = useFolioStore.getState().getFoliosInOrder();
        if (newStoreFolios.length > 0) {
          console.log('[FolioPlugin] Store initialized with', newStoreFolios.length, 'folios, retrying...');
          isInitializedRef.current = false;
          if (initFnRef.current) {
            initFnRef.current();
          }
        }
      }, 10);
      return;
    }

    console.log('[FolioPlugin] Initializing editor with', storeFolios.length, 'folios from store');

    editor.update(() => {
      const root = $getRoot();
      const existingFolios = $getAllFolioNodes(root);

      // If there are already the correct number of folio nodes, just sync to store
      if (existingFolios.length === storeFolios.length) {
        console.log('[FolioPlugin] Editor already has correct folio count, syncing to store');
        isInitializedRef.current = true;
        // Sync editor folios to store (outside of update to avoid nested updates)
        setTimeout(() => syncEditorToStore(), 0);
        return;
      }

      // Clear root and add folio nodes from store
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
      console.log('[FolioPlugin] Editor initialized with', storeFolios.length, 'folio nodes');
    });
  }, [editor, initialize, syncEditorToStore]);

  // Update ref to point to the initialization function for recursive calls
  initFnRef.current = initializeFoliosInEditor;

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

  // Subscribe to store changes and sync to editor (only for orientation/sectionId changes)
  useEffect(() => {
    if (!autoSync) return;

    // Subscribe to the folios Map directly - this gives us proper change detection
    const unsubscribe = useFolioStore.subscribe(
      (state) => state.folios,
      (newFoliosMap, prevFoliosMap) => {
        // Skip if we're currently syncing (to avoid loops)
        if (isSyncingRef.current) return;

        // Check for orientation changes by comparing same-ID folios
        const changedFolios: Array<{ id: string; orientation: 'portrait' | 'landscape' }> = [];

        newFoliosMap.forEach((newFolio, id) => {
          const prevFolio = prevFoliosMap.get(id);
          if (prevFolio && newFolio.orientation !== prevFolio.orientation) {
            changedFolios.push({ id, orientation: newFolio.orientation });
          }
        });

        // Only sync orientation changes - don't sync count changes (that comes from editor)
        if (changedFolios.length > 0) {
          console.log('[FolioPlugin] Store orientation changed, syncing to editor:', changedFolios);

          editor.update(() => {
            const root = $getRoot();
            changedFolios.forEach(({ id, orientation }) => {
              const folioNode = $getFolioNodeById(root, id);
              if (folioNode && folioNode.getOrientation() !== orientation) {
                console.log('[FolioPlugin] Updating orientation for folio:', id, orientation);
                folioNode.setOrientation(orientation);
              }
            });
          }, { discrete: true });
        }
        // NOTE: We don't call syncStoreToEditor for count changes anymore
        // The editor is the source of truth for content/count
      }
    );

    return unsubscribe;
  }, [autoSync, editor]);

  // Keep store in sync when folios are added/removed in editor (e.g., during auto-pagination)
  useEffect(() => {
    if (!autoSync) return;

    let lastFolioCount = -1; // Start with -1 to skip first update

    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      // Skip if not initialized yet
      if (!isInitializedRef.current) return;

      // Skip if a modal is open
      if (isModalCurrentlyOpen()) return;

      // Skip if currently syncing
      if (isSyncingRef.current) return;

      editorState.read(() => {
        const root = $getRoot();
        const editorFolios = $getAllFolioNodes(root);
        const storeFolios = useFolioStore.getState().folios;

        // Initialize lastFolioCount on first valid update
        if (lastFolioCount === -1) {
          lastFolioCount = editorFolios.length;
          return;
        }

        // Only sync if editor has more folios than store (new folios were created)
        // This handles auto-pagination creating new pages
        if (editorFolios.length > lastFolioCount && editorFolios.length > storeFolios.size) {
          console.log('[FolioPlugin] Editor folios increased:', lastFolioCount, '->', editorFolios.length, 'store:', storeFolios.size);
          lastFolioCount = editorFolios.length;

          // Defer to avoid state updates during render
          setTimeout(() => {
            // Check modal again before syncing
            if (isModalCurrentlyOpen()) return;
            syncEditorToStore();
          }, 10);
        } else {
          lastFolioCount = editorFolios.length;
        }
      });
    });

    return removeUpdateListener;
  }, [autoSync, editor, syncEditorToStore]);

  // Track active folio based on selection
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      // Skip if a modal is open to prevent unwanted scroll sync
      if (isModalCurrentlyOpen()) return;

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
