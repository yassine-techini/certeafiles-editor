/**
 * FolioPanel - Left sidebar with folio thumbnails
 * Per Constitution Section 4.1 - Redesigned per design specs
 */
import { useCallback, useState, useRef, useEffect, memo } from 'react';
import {
  Plus,
  Download,
  Pencil,
  Trash2,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Loader2,
} from 'lucide-react';
import { VirtualizedFolioList } from './VirtualizedFolioList';
import { useFolioStore } from '../../stores/folioStore';
import type { ThumbnailData } from '../../hooks/useFolioThumbnails';
import type { Folio, FolioSection } from '../../types/folio';
import { exportToPDF } from '../../utils/pdfExport';

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
  /** Zoom level */
  zoom?: number;
  /** Zoom change handler */
  onZoomChange?: (zoom: number) => void;
  /** Download handler */
  onDownload?: () => void;
}

/**
 * Section divider with label
 */
function SectionDivider({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 py-2 px-1">
      <div className="flex-1 flex items-center">
        <div className="h-px bg-gray-300 flex-1" />
        <span className="px-2 text-xs text-gray-500 font-medium whitespace-nowrap">
          {label}
        </span>
        <div className="h-px bg-gray-300 flex-1" />
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Éditer la section"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Supprimer la section"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Zoom control component
 */
function ZoomControl({
  zoom,
  onZoomChange,
}: {
  zoom: number;
  onZoomChange?: (zoom: number) => void;
}) {
  const zoomPercent = Math.round(zoom * 100);

  const handleZoomOut = () => {
    if (onZoomChange) {
      onZoomChange(Math.max(0.5, zoom - 0.1));
    }
  };

  const handleZoomIn = () => {
    if (onZoomChange) {
      onZoomChange(Math.min(2, zoom + 0.1));
    }
  };

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-2 py-1">
      <button
        type="button"
        onClick={handleZoomOut}
        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Zoom arrière"
      >
        <ZoomOut size={14} />
      </button>
      <div className="flex items-center gap-1 px-1">
        <span className="text-sm text-gray-700 font-medium min-w-[40px] text-center">
          {zoomPercent}%
        </span>
        <ChevronDown size={12} className="text-gray-400" />
      </div>
      <button
        type="button"
        onClick={handleZoomIn}
        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Zoom avant"
      >
        <ZoomIn size={14} />
      </button>
    </div>
  );
}

/**
 * FolioPanel - Fixed left sidebar with folio thumbnails
 */
export const FolioPanel = memo(function FolioPanel({
  thumbnails,
  width = 180,
  showSections = true,
  forceVirtualization = false,
  zoom = 1,
  onZoomChange,
  onDownload,
}: FolioPanelProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

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
    toggleFolioStatus,
    deleteSection,
  } = useFolioStore.getState();

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

  // Handle toggle status
  const handleToggleStatus = useCallback(
    (folioId: string) => {
      toggleFolioStatus(folioId);
    },
    [toggleFolioStatus]
  );

  // Handle download / PDF export
  const handleDownload = useCallback(async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    // Default behavior: export to PDF
    setIsExporting(true);
    setExportProgress({ current: 0, total: folios.length });

    try {
      await exportToPDF({
        title: 'Document',
        quality: 0.95,
        onProgress: (current, total) => {
          setExportProgress({ current, total });
        },
      });
    } catch (error) {
      console.error('[FolioPanel] PDF export error:', error);
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  }, [onDownload, folios.length]);

  // Group folios by section
  const groupedFolios = groupFoliosBySection(folios, sections);

  // Determine if virtualization should be used
  const shouldVirtualize = forceVirtualization || folios.length > VIRTUALIZATION_THRESHOLD;

  // Observe container size for virtualization
  useEffect(() => {
    if (!listContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(listContainerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Render folios with section dividers
  const renderFoliosWithSections = () => {
    const elements: JSX.Element[] = [];
    let currentSectionIndex = -1;

    folios.forEach((folio, index) => {
      // Check if we need to add a section divider
      const folioSection = folio.sectionId
        ? sections.find((s) => s.id === folio.sectionId)
        : null;

      if (folioSection) {
        const sectionIdx = sections.findIndex((s) => s.id === folioSection.id);
        if (sectionIdx !== currentSectionIndex) {
          currentSectionIndex = sectionIdx;
          elements.push(
            <SectionDivider
              key={`section-${folioSection.id}`}
              label={folioSection.name}
              onEdit={() => {
                // Edit section - could open modal
                console.log('Edit section:', folioSection.id);
              }}
              onDelete={() => {
                if (window.confirm(`Supprimer la section "${folioSection.name}" ?`)) {
                  deleteSection(folioSection.id);
                }
              }}
            />
          );
        }
      } else if (index === 0 || (index > 0 && folios[index - 1].sectionId)) {
        // Add a divider for unsectioned folios if coming after sectioned ones
        if (groupedFolios.unsectioned.length > 0 && currentSectionIndex >= 0) {
          currentSectionIndex = -1;
        }
      }
    });

    return elements;
  };

  return (
    <aside
      className="flex flex-col h-full"
      style={{ width }}
    >
      {/* Folio list with blue scrollbar */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto p-3 left-panel-scroll">
        {showSections && sections.length > 0 && (
          <div className="mb-2">
            {renderFoliosWithSections()}
          </div>
        )}

        {shouldVirtualize ? (
          <VirtualizedFolioList
            folios={folios}
            thumbnails={thumbnails}
            activeFolioId={activeFolioId}
            onFolioClick={setActiveFolio}
            onRotate={handleRotateFolio}
            onDelete={handleDeleteFolio}
            onToggleLock={handleToggleLock}
            onToggleStatus={handleToggleStatus}
            containerHeight={containerHeight - 16}
          />
        ) : (
          <div className="space-y-1">
            {groupedFolios.unsectioned.length > 0 && (
              <>
                {groupedFolios.unsectioned.map((folio) => {
                  const thumbnail = thumbnails.get(folio.id);
                  return (
                    <FolioItem
                      key={folio.id}
                      folio={folio}
                      thumbnail={thumbnail}
                      isActive={folio.id === activeFolioId}
                      onClick={() => setActiveFolio(folio.id)}
                      onEdit={() => handleRotateFolio(folio.id)}
                      onDelete={() => handleDeleteFolio(folio.id)}
                      canDelete={folios.length > 1}
                    />
                  );
                })}
              </>
            )}

            {sections.map((section) => {
              const sectionFolios = groupedFolios.bySection.get(section.id) || [];
              if (sectionFolios.length === 0) return null;

              return (
                <div key={section.id}>
                  <SectionDivider
                    label={section.name}
                    onEdit={() => console.log('Edit section:', section.id)}
                    onDelete={() => {
                      if (window.confirm(`Supprimer la section "${section.name}" ?`)) {
                        deleteSection(section.id);
                      }
                    }}
                  />
                  {sectionFolios.map((folio) => {
                    const thumbnail = thumbnails.get(folio.id);
                    return (
                      <FolioItem
                        key={folio.id}
                        folio={folio}
                        thumbnail={thumbnail}
                        isActive={folio.id === activeFolioId}
                        onClick={() => setActiveFolio(folio.id)}
                        onEdit={() => handleRotateFolio(folio.id)}
                        onDelete={() => handleDeleteFolio(folio.id)}
                        canDelete={folios.length > 1}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom buttons - modern design */}
      <div className="p-3 border-t border-slate-200/60 bg-gradient-to-r from-slate-50 to-white space-y-2">
        {/* Add page button */}
        <button
          type="button"
          onClick={handleAddFolio}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30"
        >
          <Plus size={18} />
          Ajouter une page
        </button>

        {/* Download button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all duration-200 ${
            isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="text-blue-500 animate-spin" />
              <span>Export {exportProgress.current}/{exportProgress.total}</span>
            </>
          ) : (
            <>
              <Download size={18} className="text-slate-500" />
              <span>Télécharger PDF</span>
            </>
          )}
        </button>

        {/* Zoom control - aligned left with dropdown */}
        <div className="flex items-center pt-1">
          {onZoomChange ? (
            <ZoomControl zoom={zoom} onZoomChange={onZoomChange} />
          ) : (
            <ZoomControl zoom={zoom} />
          )}
        </div>
      </div>
    </aside>
  );
});

/**
 * Single folio item with edit/delete buttons - Modern design
 */
function FolioItem({
  folio,
  thumbnail,
  isActive,
  onClick,
  onEdit,
  onDelete,
  canDelete,
}: {
  folio: Folio;
  thumbnail: ThumbnailData | undefined;
  isActive: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  return (
    <div
      className={`
        group relative rounded-xl p-2 cursor-pointer transition-all duration-200
        ${isActive
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 ring-2 ring-blue-500 shadow-md shadow-blue-500/20'
          : 'hover:bg-slate-50 ring-1 ring-slate-200/60 hover:ring-slate-300 hover:shadow-md'
        }
      `}
      onClick={onClick}
      data-folio-thumbnail={folio.id}
    >
      {/* Thumbnail */}
      <div className="relative mx-auto bg-white rounded-lg shadow-sm border border-slate-200/80 overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]"
        style={{ width: 120, height: 170 }}
      >
        {thumbnail?.dataUrl ? (
          <img
            src={thumbnail.dataUrl}
            alt={`Page ${folio.index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <svg className="w-8 h-8 text-slate-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-slate-400 text-xs font-medium">Page {folio.index + 1}</span>
          </div>
        )}

        {/* Page number badge - Modern pill style */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
          {folio.index + 1}
        </div>

        {/* Orientation indicator */}
        {folio.orientation === 'landscape' && (
          <div className="absolute top-1.5 left-1.5 bg-amber-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
            </svg>
          </div>
        )}
      </div>

      {/* Hover actions - Modern floating buttons */}
      <div
        className={`
          absolute -top-1 -right-1 flex gap-1 p-1 transition-all duration-200
          ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 bg-white rounded-lg shadow-md hover:bg-blue-50 hover:shadow-lg transition-all duration-200 border border-slate-200"
          title="Rotation"
        >
          <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 bg-white rounded-lg shadow-md hover:bg-red-50 hover:shadow-lg transition-all duration-200 border border-slate-200"
            title="Supprimer"
          >
            <Trash2 size={12} className="text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
}

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
