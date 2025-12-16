import { A4_CONSTANTS } from './utils/a4-constants';

function App(): JSX.Element {
  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Left Panel - Folios (200px) */}
      <aside className="w-[200px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Folios</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {/* Folio thumbnails will go here */}
          <div className="text-center text-gray-400 text-sm mt-8">
            No folios yet
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
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-2">
          <span className="text-sm font-medium text-gray-700">
            Certeafiles Editor
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            v0.1.0 | A4: {A4_CONSTANTS.WIDTH_PX}×{A4_CONSTANTS.HEIGHT_PX}px
          </span>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8">
          <div
            className="a4-page mx-auto"
            style={{
              width: `${A4_CONSTANTS.WIDTH_PX}px`,
              minHeight: `${A4_CONSTANTS.HEIGHT_PX}px`,
            }}
          >
            {/* Editor content will be rendered here */}
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="text-lg mb-2">Certeafiles WYSIWYG Editor</p>
                <p className="text-sm">
                  A4 Document Editor ({A4_CONSTANTS.WIDTH_MM}×{A4_CONSTANTS.HEIGHT_MM}mm)
                </p>
                <p className="text-xs mt-4 text-gray-300">
                  Lexical-based editor initialized
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Panel - Comments (320px) */}
      <aside className="w-[320px] bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700">Comments</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {/* Comment threads will go here */}
          <div className="text-center text-gray-400 text-sm mt-8">
            No comments yet
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
