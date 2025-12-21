/**
 * AutoSavePlugin - Automatically saves document to backend
 * Per Constitution Section 5.3 - Auto-save
 */
import { useEffect, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useVersionStore } from '../stores/versionStore';
import { TIMING } from '../core/constants';

export interface AutoSavePluginProps {
  /** Auto-save interval in milliseconds */
  intervalMs?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save completes */
  onSaveComplete?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

const DEFAULT_INTERVAL_MS = 30000; // 30 seconds

export function AutoSavePlugin({
  intervalMs = DEFAULT_INTERVAL_MS,
  enabled = true,
  onSaveStart,
  onSaveComplete,
  onSaveError,
}: AutoSavePluginProps): null {
  const [editor] = useLexicalComposerContext();
  const lastContentRef = useRef<string>('');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Flag to skip initial editor updates during initialization
  const isInitializedRef = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    documentId,
    isDirty,
    isSaving,
    autoSaveEnabled,
    setDirty,
    saveVersion,
  } = useVersionStore();

  /**
   * Get current editor content as JSON string
   */
  const getEditorContent = useCallback((): string => {
    let content = '';
    editor.getEditorState().read(() => {
      content = JSON.stringify(editor.getEditorState().toJSON());
    });
    return content;
  }, [editor]);

  /**
   * Save current content to backend
   */
  const save = useCallback(async () => {
    if (!documentId || isSaving || !autoSaveEnabled || !enabled) {
      return;
    }

    const content = getEditorContent();

    // Skip if content hasn't changed
    if (content === lastContentRef.current) {
      return;
    }

    try {
      onSaveStart?.();
      await saveVersion(content, false);
      lastContentRef.current = content;
      onSaveComplete?.();
    } catch (error) {
      console.error('[AutoSavePlugin] Save failed:', error);
      onSaveError?.(error instanceof Error ? error : new Error('Save failed'));
    }
  }, [
    documentId,
    isSaving,
    autoSaveEnabled,
    enabled,
    getEditorContent,
    saveVersion,
    onSaveStart,
    onSaveComplete,
    onSaveError,
  ]);

  /**
   * Debounced save - waits for user to stop typing
   */
  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, TIMING.DEBOUNCE_SLOW * 2); // 600ms after last change
  }, [save]);

  /**
   * Listen to editor changes
   */
  useEffect(() => {
    if (!enabled || !autoSaveEnabled) return;

    const removeUpdateListener = editor.registerUpdateListener(
      ({ editorState, dirtyElements, dirtyLeaves, tags }) => {
        // Skip if not yet initialized (avoid saving during initial load)
        if (!isInitializedRef.current) return;

        // Skip history-related or other internal updates
        if (tags.has('history-merge') || tags.has('historic')) return;

        // Only mark dirty if there are actual content changes
        if (dirtyElements.size > 0 || dirtyLeaves.size > 0) {
          const content = JSON.stringify(editorState.toJSON());

          if (content !== lastContentRef.current) {
            setDirty(true);
            debouncedSave();
          }
        }
      }
    );

    return () => {
      removeUpdateListener();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, enabled, autoSaveEnabled, setDirty, debouncedSave]);

  /**
   * Periodic save interval
   */
  useEffect(() => {
    if (!enabled || !autoSaveEnabled || !documentId) return;

    intervalRef.current = setInterval(() => {
      if (isDirty) {
        save();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, autoSaveEnabled, documentId, isDirty, intervalMs, save]);

  /**
   * Save on beforeunload (page close/refresh)
   */
  useEffect(() => {
    if (!enabled || !autoSaveEnabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        // Try to save synchronously (best effort)
        const content = getEditorContent();
        if (documentId && content !== lastContentRef.current) {
          // Use sendBeacon for reliable delivery
          const url = `${import.meta.env.VITE_API_URL || 'https://certeafiles-api.yassine-techini.workers.dev'}/api/documents/${documentId}/versions`;
          const data = JSON.stringify({ content, isSnapshot: false });

          navigator.sendBeacon(url, new Blob([data], { type: 'application/json' }));
        }

        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, autoSaveEnabled, isDirty, documentId, getEditorContent]);

  /**
   * Initialize last content reference and enable tracking after delay
   * This prevents auto-save from triggering during initial document load
   */
  useEffect(() => {
    if (!documentId) {
      return;
    }

    // Get current content directly from editor (avoid using callback in deps)
    const getCurrentContent = (): string => {
      let content = '';
      editor.getEditorState().read(() => {
        content = JSON.stringify(editor.getEditorState().toJSON());
      });
      return content;
    };

    // Initialize content reference immediately
    lastContentRef.current = getCurrentContent();

    // Reset initialization flag
    isInitializedRef.current = false;

    // Clear any pending timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    // Wait for editor to stabilize before enabling auto-save tracking
    // This gives time for initial content loading, folio creation, etc.
    initTimeoutRef.current = setTimeout(() => {
      // Update the content reference again after stabilization
      lastContentRef.current = getCurrentContent();
      isInitializedRef.current = true;
      console.log('[AutoSavePlugin] Initialized, tracking changes now');
    }, 2000); // 2 seconds delay to allow initial setup

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [documentId, editor]);

  return null;
}

export default AutoSavePlugin;
