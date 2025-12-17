/**
 * ExportDialog - PDF export configuration dialog
 * Per Constitution Section 8 - Export
 */
import { useState, useCallback, useMemo } from 'react';
import type {
  PdfExportOptions,
  PdfMetadata,
  PdfQuality,
  PdfPaperSize,
  ExportProgress,
} from '../../types/export';
import { DEFAULT_PDF_OPTIONS, DEFAULT_PDF_METADATA, QUALITY_SETTINGS } from '../../types/export';
import './ExportDialog.css';

export interface ExportDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Export handler */
  onExport: (options: PdfExportOptions, metadata: PdfMetadata) => Promise<void>;
  /** Current document title */
  documentTitle?: string | undefined;
  /** Current document author */
  documentAuthor?: string | undefined;
  /** Total page count */
  totalPages: number;
  /** Export progress (when exporting) */
  progress?: ExportProgress | undefined;
  /** Whether export is in progress */
  isExporting?: boolean | undefined;
  /** Cancel export handler */
  onCancel?: (() => void) | undefined;
}

/**
 * Quality option descriptions
 */
const QUALITY_DESCRIPTIONS: Record<PdfQuality, string> = {
  draft: 'Quick preview, smaller file size',
  standard: 'Good quality for digital viewing',
  high: 'High quality for printing',
  print: 'Maximum quality for professional printing',
};

/**
 * Paper size labels
 */
const PAPER_SIZE_LABELS: Record<PdfPaperSize, string> = {
  a4: 'A4 (210 x 297 mm)',
  letter: 'Letter (8.5 x 11 in)',
  legal: 'Legal (8.5 x 14 in)',
};

/**
 * ExportDialog component
 */
export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  documentTitle = 'Untitled Document',
  documentAuthor = '',
  totalPages,
  progress,
  isExporting = false,
  onCancel,
}: ExportDialogProps): JSX.Element | null {
  // Export options state
  const [options, setOptions] = useState<PdfExportOptions>({
    ...DEFAULT_PDF_OPTIONS,
  });

  // Metadata state
  const [metadata, setMetadata] = useState<PdfMetadata>({
    ...DEFAULT_PDF_METADATA,
    title: documentTitle,
    author: documentAuthor,
  });

  // Page range state
  const [usePageRange, setUsePageRange] = useState(false);
  const [pageRangeStart, setPageRangeStart] = useState(1);
  const [pageRangeEnd, setPageRangeEnd] = useState(totalPages);

  // Active tab
  const [activeTab, setActiveTab] = useState<'options' | 'metadata'>('options');

  // Update option handler
  const updateOption = useCallback(
    <K extends keyof PdfExportOptions>(key: K, value: PdfExportOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Update metadata handler
  const updateMetadata = useCallback(
    <K extends keyof PdfMetadata>(key: K, value: PdfMetadata[K]) => {
      setMetadata((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Build final options with page range
  const finalOptions = useMemo((): PdfExportOptions => {
    return {
      ...options,
      pageRange: usePageRange
        ? { start: pageRangeStart, end: pageRangeEnd }
        : null,
    };
  }, [options, usePageRange, pageRangeStart, pageRangeEnd]);

  // Handle export
  const handleExport = useCallback(async () => {
    await onExport(finalOptions, metadata);
  }, [onExport, finalOptions, metadata]);

  // Estimate file size based on quality and pages
  const estimatedSize = useMemo(() => {
    const pageCount = usePageRange
      ? Math.max(0, pageRangeEnd - pageRangeStart + 1)
      : totalPages;
    const qualityMultiplier = {
      draft: 50,
      standard: 150,
      high: 400,
      print: 800,
    };
    const sizeKb = pageCount * qualityMultiplier[options.quality];
    if (sizeKb >= 1024) {
      return `~${(sizeKb / 1024).toFixed(1)} MB`;
    }
    return `~${sizeKb} KB`;
  }, [options.quality, totalPages, usePageRange, pageRangeStart, pageRangeEnd]);

  if (!isOpen) return null;

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div
        className="export-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="export-dialog-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="export-dialog__header">
          <h2 id="export-dialog-title" className="export-dialog__title">
            Export to PDF
          </h2>
          <button
            className="export-dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isExporting}
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="export-dialog__tabs">
          <button
            className={`export-dialog__tab ${activeTab === 'options' ? 'active' : ''}`}
            onClick={() => setActiveTab('options')}
            disabled={isExporting}
          >
            Export Options
          </button>
          <button
            className={`export-dialog__tab ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
            disabled={isExporting}
          >
            Document Info
          </button>
        </div>

        {/* Content */}
        <div className="export-dialog__content">
          {/* Progress overlay */}
          {isExporting && progress && (
            <div className="export-dialog__progress">
              <div className="export-dialog__progress-info">
                <span className="export-dialog__progress-status">
                  {progress.message}
                </span>
                <span className="export-dialog__progress-percentage">
                  {progress.percentage}%
                </span>
              </div>
              <div className="export-dialog__progress-bar">
                <div
                  className="export-dialog__progress-fill"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              {progress.totalPages > 0 && (
                <span className="export-dialog__progress-pages">
                  Page {progress.currentPage} of {progress.totalPages}
                </span>
              )}
              {onCancel && (
                <button
                  className="export-dialog__cancel"
                  onClick={onCancel}
                >
                  Cancel Export
                </button>
              )}
            </div>
          )}

          {/* Options tab */}
          {activeTab === 'options' && !isExporting && (
            <div className="export-dialog__options">
              {/* Quality */}
              <div className="export-dialog__group">
                <label className="export-dialog__label">Quality</label>
                <div className="export-dialog__quality-options">
                  {(['draft', 'standard', 'high', 'print'] as PdfQuality[]).map(
                    (quality) => (
                      <button
                        key={quality}
                        className={`export-dialog__quality-btn ${options.quality === quality ? 'selected' : ''}`}
                        onClick={() => updateOption('quality', quality)}
                      >
                        <span className="export-dialog__quality-name">
                          {quality.charAt(0).toUpperCase() + quality.slice(1)}
                        </span>
                        <span className="export-dialog__quality-dpi">
                          {QUALITY_SETTINGS[quality].dpi} DPI
                        </span>
                        <span className="export-dialog__quality-desc">
                          {QUALITY_DESCRIPTIONS[quality]}
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Paper Size */}
              <div className="export-dialog__group">
                <label className="export-dialog__label">Paper Size</label>
                <select
                  className="export-dialog__select"
                  value={options.paperSize}
                  onChange={(e) =>
                    updateOption('paperSize', e.target.value as PdfPaperSize)
                  }
                >
                  {Object.entries(PAPER_SIZE_LABELS).map(([size, label]) => (
                    <option key={size} value={size}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Range */}
              <div className="export-dialog__group">
                <label className="export-dialog__label">
                  <input
                    type="checkbox"
                    checked={usePageRange}
                    onChange={(e) => setUsePageRange(e.target.checked)}
                  />
                  Export specific pages
                </label>
                {usePageRange && (
                  <div className="export-dialog__page-range">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageRangeStart}
                      onChange={(e) =>
                        setPageRangeStart(
                          Math.min(parseInt(e.target.value, 10) || 1, pageRangeEnd)
                        )
                      }
                      className="export-dialog__input"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageRangeEnd}
                      onChange={(e) =>
                        setPageRangeEnd(
                          Math.max(
                            parseInt(e.target.value, 10) || totalPages,
                            pageRangeStart
                          )
                        )
                      }
                      className="export-dialog__input"
                    />
                    <span>of {totalPages}</span>
                  </div>
                )}
              </div>

              {/* Content Options */}
              <div className="export-dialog__group">
                <label className="export-dialog__label">Content Options</label>
                <div className="export-dialog__checkboxes">
                  <label>
                    <input
                      type="checkbox"
                      checked={options.resolveSlots}
                      onChange={(e) =>
                        updateOption('resolveSlots', e.target.checked)
                      }
                    />
                    Resolve placeholder values
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={options.includeTrackChanges}
                      onChange={(e) =>
                        updateOption('includeTrackChanges', e.target.checked)
                      }
                    />
                    Include track changes
                  </label>
                  {options.includeTrackChanges && (
                    <label className="export-dialog__nested-option">
                      <input
                        type="checkbox"
                        checked={options.showTrackChangesMarkup}
                        onChange={(e) =>
                          updateOption('showTrackChangesMarkup', e.target.checked)
                        }
                      />
                      Show markup (highlight changes)
                    </label>
                  )}
                  <label>
                    <input
                      type="checkbox"
                      checked={options.includeComments}
                      onChange={(e) =>
                        updateOption('includeComments', e.target.checked)
                      }
                    />
                    Include comments
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={options.embedFonts}
                      onChange={(e) =>
                        updateOption('embedFonts', e.target.checked)
                      }
                    />
                    Embed fonts
                  </label>
                </div>
              </div>

              {/* PDF/A Compliance */}
              <div className="export-dialog__group">
                <label className="export-dialog__label">PDF/A Compliance</label>
                <select
                  className="export-dialog__select"
                  value={options.pdfACompliance}
                  onChange={(e) =>
                    updateOption(
                      'pdfACompliance',
                      e.target.value as PdfExportOptions['pdfACompliance']
                    )
                  }
                >
                  <option value="none">None (Standard PDF)</option>
                  <option value="pdf-a-1b">PDF/A-1b (Basic archival)</option>
                  <option value="pdf-a-2b">PDF/A-2b (Enhanced archival)</option>
                  <option value="pdf-a-3b">PDF/A-3b (With attachments)</option>
                </select>
                <span className="export-dialog__hint">
                  PDF/A format ensures long-term document preservation
                </span>
              </div>
            </div>
          )}

          {/* Metadata tab */}
          {activeTab === 'metadata' && !isExporting && (
            <div className="export-dialog__metadata">
              <div className="export-dialog__group">
                <label className="export-dialog__label">Title</label>
                <input
                  type="text"
                  className="export-dialog__input export-dialog__input--full"
                  value={metadata.title}
                  onChange={(e) => updateMetadata('title', e.target.value)}
                  placeholder="Document title"
                />
              </div>

              <div className="export-dialog__group">
                <label className="export-dialog__label">Author</label>
                <input
                  type="text"
                  className="export-dialog__input export-dialog__input--full"
                  value={metadata.author}
                  onChange={(e) => updateMetadata('author', e.target.value)}
                  placeholder="Author name"
                />
              </div>

              <div className="export-dialog__group">
                <label className="export-dialog__label">Subject</label>
                <input
                  type="text"
                  className="export-dialog__input export-dialog__input--full"
                  value={metadata.subject}
                  onChange={(e) => updateMetadata('subject', e.target.value)}
                  placeholder="Document subject or description"
                />
              </div>

              <div className="export-dialog__group">
                <label className="export-dialog__label">Keywords</label>
                <input
                  type="text"
                  className="export-dialog__input export-dialog__input--full"
                  value={metadata.keywords}
                  onChange={(e) => updateMetadata('keywords', e.target.value)}
                  placeholder="Comma-separated keywords"
                />
              </div>

              <div className="export-dialog__group export-dialog__group--readonly">
                <label className="export-dialog__label">Creator</label>
                <input
                  type="text"
                  className="export-dialog__input export-dialog__input--full"
                  value={metadata.creator}
                  readOnly
                />
              </div>

              <div className="export-dialog__group export-dialog__group--readonly">
                <label className="export-dialog__label">Producer</label>
                <input
                  type="text"
                  className="export-dialog__input export-dialog__input--full"
                  value={metadata.producer}
                  readOnly
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="export-dialog__footer">
          <div className="export-dialog__info">
            <span className="export-dialog__pages">
              {usePageRange
                ? `${Math.max(0, pageRangeEnd - pageRangeStart + 1)} pages`
                : `${totalPages} pages`}
            </span>
            <span className="export-dialog__estimate">
              Estimated size: {estimatedSize}
            </span>
          </div>
          <div className="export-dialog__actions">
            <button
              className="export-dialog__btn export-dialog__btn--secondary"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancel
            </button>
            <button
              className="export-dialog__btn export-dialog__btn--primary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportDialog;
