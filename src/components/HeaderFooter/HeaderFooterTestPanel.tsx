/**
 * HeaderFooterTestPanel - Temporary UI for testing header/footer store
 * Per Constitution Section 4.2
 */
import { useEffect } from 'react';
import { FileText, Plus, Trash2, RotateCcw } from 'lucide-react';
import { useHeaderFooterStore } from '../../stores/headerFooterStore';
import { useHeaderFooter } from '../../hooks/useHeaderFooter';
import { useFolioStore } from '../../stores/folioStore';
import { createTextSegment } from '../../types/headerFooter';

/**
 * HeaderFooterTestPanel - Test UI for header/footer management
 */
export function HeaderFooterTestPanel() {
  // Initialize store
  const { initialize } = useHeaderFooterStore.getState();
  const activeFolioId = useFolioStore((state) => state.activeFolioId);

  // Get header/footer state for active folio
  const {
    header,
    footer,
    hasHeader,
    hasFooter,
    isHeaderDefault,
    isFooterDefault,
    hasHeaderOverride,
    hasFooterOverride,
    setHeaderSegment,
    setFooterSegment,
    useDefaultHeader,
    useDefaultFooter,
    createCustomHeader,
    createCustomFooter,
    removeHeader,
    removeFooter,
  } = useHeaderFooter();

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Get store state for display
  const defaultHeaderId = useHeaderFooterStore((state) => state.defaultHeaderId);
  const defaultFooterId = useHeaderFooterStore((state) => state.defaultFooterId);
  const headersCount = useHeaderFooterStore((state) => state.headers.size);
  const footersCount = useHeaderFooterStore((state) => state.footers.size);

  // Helper to get segment text
  const getSegmentText = (segment: { type: string; content?: string } | null): string => {
    if (!segment) return '-';
    if (segment.type === 'text' && segment.content) return segment.content;
    return `[${segment.type}]`;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText size={16} className="text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700">Header/Footer Test</h3>
      </div>

      {/* Store Status */}
      <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
        <p className="font-medium text-gray-600">Store Status:</p>
        <p className="text-gray-500">Default Header: {defaultHeaderId ? 'Set' : 'None'}</p>
        <p className="text-gray-500">Default Footer: {defaultFooterId ? 'Set' : 'None'}</p>
        <p className="text-gray-500">Headers: {headersCount} | Footers: {footersCount}</p>
      </div>

      {/* Active Folio Info */}
      <div className="bg-blue-50 rounded-lg p-3 text-xs space-y-1">
        <p className="font-medium text-blue-700">Active Folio: {activeFolioId ? activeFolioId.slice(0, 8) + '...' : 'None'}</p>
        {activeFolioId && (
          <>
            <p className="text-blue-600">
              Header: {hasHeader ? 'Yes' : 'No'} |
              {isHeaderDefault ? ' Default' : hasHeaderOverride ? ' Override' : ' None'}
            </p>
            <p className="text-blue-600">
              Footer: {hasFooter ? 'Yes' : 'No'} |
              {isFooterDefault ? ' Default' : hasFooterOverride ? ' Override' : ' None'}
            </p>
          </>
        )}
      </div>

      {/* Header Section */}
      <div className="border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Header</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={createCustomHeader}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
              title="Create custom header"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={useDefaultHeader}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title="Use default header"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={removeHeader}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title="Remove header"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {header.content && (
          <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
            <div className="flex gap-2">
              <span className="text-gray-400 w-12">Left:</span>
              <input
                type="text"
                className="flex-1 px-2 py-1 border rounded text-xs"
                value={getSegmentText(header.content.left)}
                onChange={(e) => setHeaderSegment('left', createTextSegment(e.target.value))}
                placeholder="Left text"
              />
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-12">Center:</span>
              <input
                type="text"
                className="flex-1 px-2 py-1 border rounded text-xs"
                value={getSegmentText(header.content.center)}
                onChange={(e) => setHeaderSegment('center', createTextSegment(e.target.value))}
                placeholder="Center text"
              />
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-12">Right:</span>
              <input
                type="text"
                className="flex-1 px-2 py-1 border rounded text-xs"
                value={getSegmentText(header.content.right)}
                onChange={(e) => setHeaderSegment('right', createTextSegment(e.target.value))}
                placeholder="Right text"
              />
            </div>
          </div>
        )}

        {!header.content && (
          <p className="text-xs text-gray-400 italic">No header for this folio</p>
        )}
      </div>

      {/* Footer Section */}
      <div className="border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Footer</span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={createCustomFooter}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
              title="Create custom footer"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={useDefaultFooter}
              className="p-1 text-gray-500 hover:bg-gray-100 rounded"
              title="Use default footer"
            >
              <RotateCcw size={14} />
            </button>
            <button
              type="button"
              onClick={removeFooter}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
              title="Remove footer"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {footer.content && (
          <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
            <div className="flex gap-2">
              <span className="text-gray-400 w-12">Left:</span>
              <input
                type="text"
                className="flex-1 px-2 py-1 border rounded text-xs"
                value={getSegmentText(footer.content.left)}
                onChange={(e) => setFooterSegment('left', createTextSegment(e.target.value))}
                placeholder="Left text"
              />
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-12">Center:</span>
              <input
                type="text"
                className="flex-1 px-2 py-1 border rounded text-xs"
                value={getSegmentText(footer.content.center)}
                onChange={(e) => setFooterSegment('center', createTextSegment(e.target.value))}
                placeholder="Center text"
              />
            </div>
            <div className="flex gap-2">
              <span className="text-gray-400 w-12">Right:</span>
              <input
                type="text"
                className="flex-1 px-2 py-1 border rounded text-xs"
                value={getSegmentText(footer.content.right)}
                onChange={(e) => setFooterSegment('right', createTextSegment(e.target.value))}
                placeholder="Right text"
              />
            </div>
          </div>
        )}

        {!footer.content && (
          <p className="text-xs text-gray-400 italic">No footer for this folio</p>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-400 space-y-1">
        <p className="font-medium">Test Instructions:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Click + to create custom header/footer</li>
          <li>Click reset to use default</li>
          <li>Click trash to remove</li>
          <li>Edit text in inputs</li>
          <li>Switch folios to test inheritance</li>
        </ul>
      </div>
    </div>
  );
}

export default HeaderFooterTestPanel;
