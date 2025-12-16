/**
 * Certeafiles Editor Application
 * Per Constitution Section 9.1 - Architecture Finale
 */
import { useCallback, useState } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';

import { CerteafilesEditor } from './components/Editor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { A4_CONSTANTS } from './utils/a4-constants';

function App(): JSX.Element {
  const [wordCount, setWordCount] = useState(0);

  // Handle editor changes
  const handleEditorChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
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
    },
    []
  );

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Left Panel - Folios (200px) */}
      <aside className="w-[200px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Folios</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* Folio thumbnail placeholder */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 mb-2">
            <div
              className="bg-white shadow-sm rounded border border-gray-200 mx-auto"
              style={{
                width: '100px',
                height: '141px',
              }}
            >
              <div className="h-full flex items-center justify-center text-gray-300 text-xs">
                Page 1
              </div>
            </div>
          </div>
        </div>
        <div className="p-2 border-t border-gray-200">
          <button
            type="button"
            className="w-full py-2 px-4 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            + Add Folio
          </button>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
          <span className="text-sm font-medium text-gray-700">
            Certeafiles Editor
          </span>
          <div className="flex items-center gap-2 ml-4">
            <button
              type="button"
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="Underline (Ctrl+U)"
            >
              <u>U</u>
            </button>
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
              className="mx-auto"
            />
          </ErrorBoundary>
        </div>
      </main>

      {/* Right Panel - Comments (320px) */}
      <aside className="w-[320px] bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Comments</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="text-center text-gray-400 text-sm mt-8">
            <p className="mb-2">No comments yet</p>
            <p className="text-xs text-gray-300">
              Select text and click "Add Comment" to start a discussion
            </p>
          </div>
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
