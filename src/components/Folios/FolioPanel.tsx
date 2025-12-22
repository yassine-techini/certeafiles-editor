/**
 * FolioPanel - Left sidebar with folio thumbnails
 * Per Constitution Section 4.1 - Redesigned per design specs
 */
import { useCallback, useState, useRef, useEffect, memo, useMemo } from 'react';
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
  /** Whether thumbnails are loading */
  isLoadingThumbnails?: boolean;
  /** Thumbnail loading progress (0 to 1) */
  thumbnailProgress?: number;
}

/**
 * Section divider with label - Linear Style
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
        <div className="h-px bg-theme-border-subtle flex-1" />
        <span className="px-2 text-xs text-theme-text-muted font-medium whitespace-nowrap uppercase tracking-wider">
          {label}
        </span>
        <div className="h-px bg-theme-border-subtle flex-1" />
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1 text-accent-primary hover:bg-accent-100 rounded-md transition-colors"
              title="Éditer la section"
            >
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
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
 * Zoom control component - Linear Style
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
    <div className="flex items-center gap-1 bg-theme-bg-tertiary rounded-lg border border-theme-border-subtle px-2 py-1">
      <button
        type="button"
        onClick={handleZoomOut}
        className="p-1 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover rounded-md transition-colors"
        title="Zoom arrière"
      >
        <ZoomOut size={14} />
      </button>
      <div className="flex items-center gap-1 px-1">
        <span className="text-sm text-theme-text-primary font-medium min-w-[40px] text-center">
          {zoomPercent}%
        </span>
        <ChevronDown size={12} className="text-theme-text-muted" />
      </div>
      <button
        type="button"
        onClick={handleZoomIn}
        className="p-1 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover rounded-md transition-colors"
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
  isLoadingThumbnails = false,
  thumbnailProgress = 0,
}: FolioPanelProps) {
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

  // Get store state and actions
  // Use shallow selector on folios Map directly for proper reactivity
  const foliosMap = useFolioStore((state) => state.folios);
  const folios = useMemo(() => {
    return Array.from(foliosMap.values()).sort((a, b) => a.index - b.index);
  }, [foliosMap]);
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
      className="flex flex-col h-full bg-theme-bg-secondary border-r border-theme-border-subtle"
      style={{ width }}
    >
      {/* Loading overlay - Linear style */}
      {isLoadingThumbnails && (
        <div className="px-3 py-2.5 bg-accent-100 border-b border-accent-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={14} className="text-accent-primary animate-spin" />
            <span className="text-xs font-medium text-accent-primary">
              Génération des aperçus...
            </span>
          </div>
          <div className="w-full bg-theme-bg-tertiary rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-accent-primary to-accent-secondary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(thumbnailProgress * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-accent-primary/80 mt-1.5 text-center">
            {Math.round(thumbnailProgress * 100)}% ({Math.round(thumbnailProgress * folios.length)}/{folios.length} pages)
          </div>
        </div>
      )}

      {/* Folio list - Linear style scrollbar */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto p-3 scrollbar-thin">
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

      {/* Bottom buttons - Linear style */}
      <div className="p-3 border-t border-theme-border-subtle bg-theme-bg-tertiary/50 space-y-2">
        {/* Add page button - Gradient accent */}
        <button
          type="button"
          onClick={handleAddFolio}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40"
        >
          <Plus size={18} />
          Ajouter une page
        </button>

        {/* Download button - Ghost style */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isExporting}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-theme-bg-primary border border-theme-border-default text-theme-text-secondary text-sm font-semibold rounded-xl transition-all duration-200 ${
            isExporting ? 'opacity-70 cursor-wait' : 'hover:bg-theme-bg-hover hover:text-theme-text-primary hover:border-theme-border-strong'
          }`}
        >
          {isExporting ? (
            <>
              <Loader2 size={18} className="text-accent-primary animate-spin" />
              <span>Export {exportProgress.current}/{exportProgress.total}</span>
            </>
          ) : (
            <>
              <Download size={18} className="text-theme-text-tertiary" />
              <span>Télécharger PDF</span>
            </>
          )}
        </button>

        {/* Zoom control */}
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
 * Single folio item with edit/delete buttons - Linear Style
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
          ? 'bg-accent-100 ring-2 ring-accent-primary shadow-glow'
          : 'hover:bg-theme-bg-hover ring-1 ring-theme-border-subtle hover:ring-accent-primary/50'
        }
      `}
      onClick={onClick}
      data-folio-thumbnail={folio.id}
    >
      {/* Thumbnail */}
      <div className="relative mx-auto bg-white rounded-lg shadow-dark-sm border border-theme-border-subtle overflow-hidden transition-transform duration-200 group-hover:scale-[1.02]"
        style={{
          width: folio.orientation === 'landscape' ? 140 : 120,
          height: folio.orientation === 'landscape' ? 100 : 170,
          transition: 'width 0.3s ease, height 0.3s ease',
        }}
      >
        {thumbnail?.dataUrl ? (
          <img
            src={thumbnail.dataUrl}
            alt={`Page ${folio.index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-theme-bg-tertiary to-theme-bg-elevated">
            <svg className="w-8 h-8 text-theme-text-muted mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span className="text-theme-text-tertiary text-xs font-medium">Page {folio.index + 1}</span>
          </div>
        )}

        {/* Page number badge - Linear style */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-theme-bg-primary/90 backdrop-blur-sm text-theme-text-primary text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-dark-md border border-theme-border-subtle">
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

      {/* Hover actions - Linear floating buttons */}
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
          className="p-1.5 bg-theme-bg-elevated rounded-lg shadow-dark-md hover:bg-accent-100 hover:shadow-glow transition-all duration-200 border border-theme-border-default"
          title="Rotation"
        >
          <svg className="w-3 h-3 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 bg-theme-bg-elevated rounded-lg shadow-dark-md hover:bg-red-500/10 hover:shadow-lg transition-all duration-200 border border-theme-border-default"
            title="Supprimer"
          >
            <Trash2 size={12} className="text-red-400" />
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
