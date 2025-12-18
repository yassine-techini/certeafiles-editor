/**
 * useFolios - Hook combining folio store with Lexical operations
 * Per Constitution Section 3.2
 */
import { useCallback, useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor, SerializedEditorState } from 'lexical';
import { useFolioStore } from '../stores/folioStore';
import type { Folio, FolioCreatePayload, FolioMargins } from '../types/folio';

export interface UseFoliosOptions {
  /** Auto-initialize with default folio */
  autoInitialize?: boolean;
  /** Auto-save interval in ms (0 to disable) */
  autoSaveInterval?: number;
}

export interface UseFoliosReturn {
  // State
  folios: Folio[];
  activeFolioId: string | null;
  activeFolio: Folio | undefined;

  // Folio actions
  createFolio: (payload?: FolioCreatePayload) => string;
  deleteFolio: (id: string) => void;
  setActiveFolio: (id: string | null) => void;
  reorderFolios: (orderedIds: string[]) => void;
  toggleOrientation: (id: string) => void;
  setFolioMargins: (id: string, margins: FolioMargins) => void;
  lockFolio: (id: string, locked: boolean) => void;

  // Lexical integration
  scrollToFolio: (id: string) => void;
  updateFolioContent: (id: string, content: SerializedEditorState) => void;
  saveCurrentFolioContent: () => void;
  loadFolioContent: (id: string) => void;

  // Editor reference
  editor: LexicalEditor;
}

/**
 * useFolios - Wrapper hook combining store + Lexical operations
 */
export function useFolios(options: UseFoliosOptions = {}): UseFoliosReturn {
  const { autoInitialize = true, autoSaveInterval = 0 } = options;
  const [editor] = useLexicalComposerContext();
  const autoSaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get store state and actions
  const folios = useFolioStore((state) => state.getFoliosInOrder());
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const activeFolio = useFolioStore((state) => state.getActiveFolio());

  // Store actions
  const {
    createFolio: storeCreateFolio,
    deleteFolio: storeDeleteFolio,
    setActiveFolio: storeSetActiveFolio,
    reorderFolios: storeReorderFolios,
    toggleOrientation: storeToggleOrientation,
    setFolioMargins: storeSetFolioMargins,
    lockFolio: storeLockFolio,
    updateFolioContent: storeUpdateFolioContent,
    getFolio,
    initialize,
  } = useFolioStore.getState();

  // Initialize on mount
  useEffect(() => {
    if (autoInitialize) {
      console.log('[useFolios] Auto-initializing store');
      initialize();
    }
  }, [autoInitialize, initialize]);

  // Save current folio content to store
  const saveCurrentFolioContent = useCallback(() => {
    if (!activeFolioId) return;

    const editorState = editor.getEditorState();
    const serialized = editorState.toJSON();
    storeUpdateFolioContent(activeFolioId, serialized);
  }, [editor, activeFolioId, storeUpdateFolioContent]);

  // Load folio content into editor
  const loadFolioContent = useCallback(
    (id: string) => {
      const folio = getFolio(id);
      if (!folio) {
        console.warn('[useFolios] loadFolioContent: Folio not found:', id);
        return;
      }

      if (folio.content) {
        const editorState = editor.parseEditorState(JSON.stringify(folio.content));
        editor.setEditorState(editorState);
        console.log('[useFolios] loadFolioContent: Loaded content for folio', id);
      } else {
        // Clear editor for empty folio
        editor.update(() => {
          const root = editor.getEditorState()._nodeMap.get('root');
          if (root) {
            // Just clear - the editor will handle empty state
          }
        });
        console.log('[useFolios] loadFolioContent: No content for folio', id);
      }
    },
    [editor, getFolio]
  );

  // Update folio content in store
  const updateFolioContent = useCallback(
    (id: string, content: SerializedEditorState) => {
      storeUpdateFolioContent(id, content);
    },
    [storeUpdateFolioContent]
  );

  // Scroll to a specific folio element
  const scrollToFolio = useCallback((id: string) => {
    const folioElement = document.querySelector(`[data-folio-id="${id}"]`);
    if (folioElement) {
      folioElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      console.log('[useFolios] scrollToFolio:', id);
    } else {
      console.warn('[useFolios] scrollToFolio: Element not found for folio:', id);
    }
  }, []);

  // Create folio with optional content initialization
  const createFolio = useCallback(
    (payload?: FolioCreatePayload) => {
      // Save current folio content before creating new one
      saveCurrentFolioContent();

      const newId = storeCreateFolio(payload);
      console.log('[useFolios] createFolio: Created new folio', newId);

      return newId;
    },
    [storeCreateFolio, saveCurrentFolioContent]
  );

  // Delete folio with cleanup
  const deleteFolio = useCallback(
    (id: string) => {
      storeDeleteFolio(id);
      console.log('[useFolios] deleteFolio:', id);
    },
    [storeDeleteFolio]
  );

  // Set active folio and load its content
  const setActiveFolio = useCallback(
    (id: string | null) => {
      // Save current folio content before switching
      if (activeFolioId && id !== activeFolioId) {
        saveCurrentFolioContent();
      }

      storeSetActiveFolio(id);

      // Load new folio content
      if (id) {
        loadFolioContent(id);
      }

      console.log('[useFolios] setActiveFolio:', id);
    },
    [activeFolioId, saveCurrentFolioContent, storeSetActiveFolio, loadFolioContent]
  );

  // Reorder folios
  const reorderFolios = useCallback(
    (orderedIds: string[]) => {
      storeReorderFolios(orderedIds);
      console.log('[useFolios] reorderFolios:', orderedIds);
    },
    [storeReorderFolios]
  );

  // Toggle orientation
  const toggleOrientation = useCallback(
    (id: string) => {
      storeToggleOrientation(id);
      console.log('[useFolios] toggleOrientation:', id);
    },
    [storeToggleOrientation]
  );

  // Set margins
  const setFolioMargins = useCallback(
    (id: string, margins: FolioMargins) => {
      storeSetFolioMargins(id, margins);
      console.log('[useFolios] setFolioMargins:', { id, margins });
    },
    [storeSetFolioMargins]
  );

  // Lock/unlock folio
  const lockFolio = useCallback(
    (id: string, locked: boolean) => {
      storeLockFolio(id, locked);
      console.log('[useFolios] lockFolio:', { id, locked });
    },
    [storeLockFolio]
  );

  // Auto-save setup
  useEffect(() => {
    if (autoSaveInterval > 0) {
      autoSaveIntervalRef.current = setInterval(() => {
        saveCurrentFolioContent();
      }, autoSaveInterval);

      console.log('[useFolios] Auto-save enabled with interval:', autoSaveInterval);

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
    return undefined;
  }, [autoSaveInterval, saveCurrentFolioContent]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveCurrentFolioContent();
    };
  }, [saveCurrentFolioContent]);

  return {
    // State
    folios,
    activeFolioId,
    activeFolio,

    // Folio actions
    createFolio,
    deleteFolio,
    setActiveFolio,
    reorderFolios,
    toggleOrientation,
    setFolioMargins,
    lockFolio,

    // Lexical integration
    scrollToFolio,
    updateFolioContent,
    saveCurrentFolioContent,
    loadFolioContent,

    // Editor reference
    editor,
  };
}

/**
 * Standalone hook for folio navigation (doesn't require Lexical context)
 */
export function useFolioNavigation() {
  const folios = useFolioStore((state) => state.getFoliosInOrder());
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const setActiveFolio = useFolioStore((state) => state.setActiveFolio);

  const goToNextFolio = useCallback(() => {
    if (!activeFolioId) return;

    const currentIndex = folios.findIndex((f) => f.id === activeFolioId);
    if (currentIndex < folios.length - 1) {
      setActiveFolio(folios[currentIndex + 1].id);
    }
  }, [folios, activeFolioId, setActiveFolio]);

  const goToPreviousFolio = useCallback(() => {
    if (!activeFolioId) return;

    const currentIndex = folios.findIndex((f) => f.id === activeFolioId);
    if (currentIndex > 0) {
      setActiveFolio(folios[currentIndex - 1].id);
    }
  }, [folios, activeFolioId, setActiveFolio]);

  const goToFolio = useCallback(
    (index: number) => {
      if (index >= 0 && index < folios.length) {
        setActiveFolio(folios[index].id);
      }
    },
    [folios, setActiveFolio]
  );

  return {
    folios,
    activeFolioId,
    currentIndex: activeFolioId
      ? folios.findIndex((f) => f.id === activeFolioId)
      : -1,
    totalFolios: folios.length,
    goToNextFolio,
    goToPreviousFolio,
    goToFolio,
    setActiveFolio,
  };
}

export default useFolios;
