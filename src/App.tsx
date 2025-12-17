/**
 * Certeafiles Editor Application
 * Per Constitution Section 9.1 - Architecture Finale
 */
import { useCallback, useEffect, useState, useRef } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';

import { CerteafilesEditor, ZoomControl } from './components/Editor';
import { FolioPanel } from './components/Folios';
import { HeaderFooterTestPanel } from './components/HeaderFooter';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFolioStore } from './stores';
import { useFolioThumbnails } from './hooks';
import { A4_CONSTANTS } from './utils/a4-constants';
import type { Orientation } from './utils/a4-constants';

function App(): JSX.Element {
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState<number>(A4_CONSTANTS.ZOOM_DEFAULT);
  const editorRef = useRef<LexicalEditor | null>(null);

  // Folio store state and actions
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const activeFolio = useFolioStore((state) => state.getActiveFolio());
  const { initialize, toggleOrientation } = useFolioStore.getState();

  // Thumbnail generation hook
  const { thumbnails, generateThumbnail } = useFolioThumbnails({
    debounceMs: 500,
    autoUpdate: true,
  });

  // Initialize folio store on mount
  useEffect(() => {
    console.log('[App] Initializing folio store');
    initialize();
  }, [initialize]);

  // Get orientation from active folio
  const orientation: Orientation = activeFolio?.orientation ?? 'portrait';

  // Handle editor changes
  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      // Store editor reference for thumbnail generation
      if (!editorRef.current) {
        editorRef.current = editor;
      }

      editorState.read(() => {
        // Count words in the editor
        const text = editorState.read(() => {
          const root = editorState._nodeMap.get('root');
          if (root) {
            return root.getTextContent();
          }
          return '';
        });
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
      });

      // Update thumbnail for active folio
      if (activeFolioId && editorRef.current) {
        generateThumbnail(activeFolioId, editorRef.current);
      }
    },
    [activeFolioId, generateThumbnail]
  );

  // Handle toggling folio orientation
  const handleToggleOrientation = useCallback(
    (id: string) => {
      toggleOrientation(id);
      console.log('[App] Toggled orientation for folio:', id);
    },
    [toggleOrientation]
  );

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Left Panel - Folio Thumbnails */}
      <FolioPanel thumbnails={thumbnails} width={200} />

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-10 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          <span className="text-sm font-medium text-gray-700">
            Certeafiles Editor
          </span>

          {/* Orientation Toggle (for active folio) */}
          {activeFolioId && (
            <div className="flex items-center gap-1 ml-4 border-l border-gray-300 pl-4">
              <button
                type="button"
                onClick={() => handleToggleOrientation(activeFolioId)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  orientation === 'portrait'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Portrait orientation"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => handleToggleOrientation(activeFolioId)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  orientation === 'landscape'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Landscape orientation"
              >
                Landscape
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="ml-4 border-l border-gray-300 pl-4">
            <ZoomControl
              zoom={zoom}
              onZoomChange={setZoom}
              showSlider={true}
              showPercentage={true}
            />
          </div>

          <span className="text-xs text-gray-400 ml-auto">
            {wordCount} words | A4: {A4_CONSTANTS.WIDTH_PX}×{A4_CONSTANTS.HEIGHT_PX}px
          </span>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8">
          <ErrorBoundary
            fallback={
              <div className="text-center p-8 text-red-600">
                Editor failed to load. Please refresh the page.
              </div>
            }
          >
            <CerteafilesEditor
              placeholder="Start typing your document... Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline."
              onChange={handleEditorChange}
              orientation={orientation}
              zoom={zoom}
              className="mx-auto"
            />
          </ErrorBoundary>
        </div>
      </main>

      {/* Right Panel - Header/Footer Test (320px) */}
      <aside className="w-[320px] bg-white border-l border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <HeaderFooterTestPanel />
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400">
            <p>Keyboard shortcuts:</p>
            <ul className="mt-1 space-y-1">
              <li>Ctrl+B: Bold</li>
              <li>Ctrl+I: Italic</li>
              <li>Ctrl+U: Underline</li>
              <li>Ctrl+Z: Undo</li>
              <li>Ctrl+Y: Redo</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
