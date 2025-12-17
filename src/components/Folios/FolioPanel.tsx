/**
 * FolioPanel - Left sidebar with folio thumbnails
 * Per Constitution Section 4.1
 */
import { useCallback, useState, useRef, useEffect, memo } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
} from 'lucide-react';
import { FolioSortableList } from './FolioSortableList';
import { VirtualizedFolioList } from './VirtualizedFolioList';
import { useFolioStore } from '../../stores/folioStore';
import type { ThumbnailData } from '../../hooks/useFolioThumbnails';
import type { Folio, FolioSection } from '../../types/folio';

// Threshold for enabling virtualization
const VIRTUALIZATION_THRESHOLD = 20;

export interface FolioPanelProps {
  /** Thumbnail data map */
  thumbnails: Map<string, ThumbnailData>;
  /** Panel width */
  width?: number;
  /** Whether to show section headers */
  showSections?: boolean;
  /** Force virtualization even for small lists */
  forceVirtualization?: boolean;
}

/**
 * Section header component
 */
function SectionHeader({
  section,
  isCollapsed,
  onToggle,
  folioCount,
}: {
  section: FolioSection;
  isCollapsed: boolean;
  onToggle: () => void;
  folioCount: number;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
    >
      {isCollapsed ? (
        <ChevronRight size={14} className="text-gray-400" />
      ) : (
        <ChevronDown size={14} className="text-gray-400" />
      )}
      <FolderOpen size={14} className="text-gray-500" />
      <span className="flex-1 text-left truncate">{section.name}</span>
      <span className="text-xs text-gray-400">{folioCount}</span>
    </button>
  );
}

/**
 * FolioPanel - Fixed left sidebar with folio thumbnails
 */
export const FolioPanel = memo(function FolioPanel({
  thumbnails,
  width = 200,
  showSections = false,
  forceVirtualization = false,
}: FolioPanelProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);

  // Get store state and actions
  const folios = useFolioStore((state) => state.getFoliosInOrder());
  const sections = useFolioStore((state) =>
    Array.from(state.sections.values()).sort((a, b) => a.index - b.index)
  );
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const {
    createFolio,
    deleteFolio,
    setActiveFolio,
    toggleOrientation,
    lockFolio,
  } = useFolioStore.getState();

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Handle add folio
  const handleAddFolio = useCallback(() => {
    const payload = activeFolioId ? { afterId: activeFolioId } : undefined;
    createFolio(payload);
  }, [createFolio, activeFolioId]);

  // Handle delete folio
  const handleDeleteFolio = useCallback(
    (folioId: string) => {
      if (folios.length > 1) {
        deleteFolio(folioId);
      }
    },
    [deleteFolio, folios.length]
  );

  // Handle rotate folio
  const handleRotateFolio = useCallback(
    (folioId: string) => {
      toggleOrientation(folioId);
    },
    [toggleOrientation]
  );

  // Handle toggle lock
  const handleToggleLock = useCallback(
    (folioId: string, currentLocked: boolean) => {
      lockFolio(folioId, !currentLocked);
    },
    [lockFolio]
  );

  // Group folios by section
  const foliosBySection = showSections
    ? groupFoliosBySection(folios, sections)
    : null;

  // Determine if virtualization should be used
  const shouldVirtualize = forceVirtualization || folios.length > VIRTUALIZATION_THRESHOLD;

  // Observe container size for virtualization
  useEffect(() => {
    if (!listContainerRef.current || !shouldVirtualize) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(listContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [shouldVirtualize]);

  return (
    <aside
      className="flex flex-col bg-gray-50 border-r border-gray-200"
      style={{ width }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Pages</h2>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {folios.length}
        </span>
      </div>

      {/* Folio list */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto p-2">
        {shouldVirtualize && !showSections ? (
          // Use virtualized list for large folio counts
          <VirtualizedFolioList
            folios={folios}
            thumbnails={thumbnails}
            activeFolioId={activeFolioId}
            onFolioClick={setActiveFolio}
            onRotate={handleRotateFolio}
            onDelete={handleDeleteFolio}
            onToggleLock={handleToggleLock}
            containerHeight={containerHeight}
          />
        ) : showSections && foliosBySection ? (
          // Render with sections
          <>
            {/* Unsectioned folios */}
            {foliosBySection.unsectioned.length > 0 && (
              <div className="mb-2">
                <FolioSortableList
                  folios={foliosBySection.unsectioned}
                  thumbnails={thumbnails}
                  activeFolioId={activeFolioId}
                  onFolioClick={setActiveFolio}
                  onRotate={handleRotateFolio}
                  onDelete={handleDeleteFolio}
                  onToggleLock={handleToggleLock}
                />
              </div>
            )}

            {/* Sectioned folios */}
            {sections.map((section) => {
              const sectionFolios = foliosBySection.bySection.get(section.id) || [];
              if (sectionFolios.length === 0) return null;

              const isCollapsed = collapsedSections.has(section.id);

              return (
                <div key={section.id} className="mb-2">
                  <SectionHeader
                    section={section}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleSection(section.id)}
                    folioCount={sectionFolios.length}
                  />
                  {!isCollapsed && (
                    <div className="pl-2 mt-1">
                      <FolioSortableList
                        folios={sectionFolios}
                        thumbnails={thumbnails}
                        activeFolioId={activeFolioId}
                        onFolioClick={setActiveFolio}
                        onRotate={handleRotateFolio}
                        onDelete={handleDeleteFolio}
                        onToggleLock={handleToggleLock}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          // Render flat sortable list
          <FolioSortableList
            folios={folios}
            thumbnails={thumbnails}
            activeFolioId={activeFolioId}
            onFolioClick={setActiveFolio}
            onRotate={handleRotateFolio}
            onDelete={handleDeleteFolio}
            onToggleLock={handleToggleLock}
          />
        )}

        {/* Empty state */}
        {folios.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <FileText size={24} className="mb-2" />
            <p className="text-sm">No pages yet</p>
          </div>
        )}
      </div>

      {/* Add folio button */}
      <div className="p-2 border-t border-gray-200 bg-white">
        <button
          type="button"
          onClick={handleAddFolio}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus size={16} />
          Add Page
        </button>
      </div>
    </aside>
  );
});

/**
 * Group folios by section
 */
function groupFoliosBySection(
  folios: Folio[],
  sections: FolioSection[]
) {
  const bySection = new Map<string, Folio[]>();
  const unsectioned: Folio[] = [];

  // Initialize section maps
  sections.forEach((section) => {
    bySection.set(section.id, []);
  });

  // Group folios
  folios.forEach((folio) => {
    if (folio.sectionId && bySection.has(folio.sectionId)) {
      bySection.get(folio.sectionId)!.push(folio);
    } else {
      unsectioned.push(folio);
    }
  });

  return { bySection, unsectioned };
}

export default FolioPanel;
