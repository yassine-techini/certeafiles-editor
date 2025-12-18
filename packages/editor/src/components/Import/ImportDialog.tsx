/**
 * ImportDialog - DOCX and PDF import dialog with drag & drop
 * Per Constitution Section 8 - Import
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import type { LexicalEditor } from 'lexical';
import type { ImportMode, DocxImportOptions, DocxImportResult } from '../../services/docx-import/DocxImportService';
import { createDocxImportService } from '../../services/docx-import/DocxImportService';
import type { PdfImportResult } from '../../services/pdf-import/PdfImportService';
import { createPdfImportService } from '../../services/pdf-import/PdfImportService';
import type { FolioData } from '../../services/pdf-import/FolioCreator';
import { createFolioCreator } from '../../services/pdf-import/FolioCreator';
import './ImportDialog.css';

/**
 * File type detection
 */
type FileType = 'docx' | 'pdf' | 'unknown';

/**
 * Combined import result
 */
export type ImportResult =
  | { type: 'docx'; result: DocxImportResult }
  | { type: 'pdf'; result: PdfImportResult; folios: FolioData[] };

export interface ImportDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Editor instance for direct import */
  editor?: LexicalEditor | undefined;
  /** Import complete handler for DOCX */
  onImportComplete?: ((result: ImportResult) => void) | undefined;
  /** Handler for PDF folio creation */
  onFoliosCreated?: ((folios: FolioData[]) => void) | undefined;
  /** Maximum file size in bytes */
  maxFileSize?: number | undefined;
}

/**
 * File info for preview
 */
interface FileInfo {
  file: File;
  name: string;
  size: string;
  type: string;
  fileType: FileType;
}

/**
 * PDF-specific stats
 */
interface PdfStats {
  totalPages: number;
  portrait: number;
  landscape: number;
  textBased: number;
  imageBased: number;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Detect file type from file
 */
function detectFileType(file: File): FileType {
  const mimeType = file.type.toLowerCase();
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (
    mimeType === 'application/pdf' ||
    extension === 'pdf'
  ) {
    return 'pdf';
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    extension === 'docx' ||
    extension === 'doc'
  ) {
    return 'docx';
  }

  return 'unknown';
}

/**
 * ImportDialog component
 */
export function ImportDialog({
  isOpen,
  onClose,
  editor,
  onImportComplete,
  onFoliosCreated,
  maxFileSize = 20 * 1024 * 1024, // 20MB default for PDFs
}: ImportDialogProps): JSX.Element | null {
  // State
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('replace');
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [preserveImages, setPreserveImages] = useState(true);
  const [preserveTables, setPreserveTables] = useState(true);
  const [preserveLists, setPreserveLists] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewStats, setPreviewStats] = useState<DocxImportResult['stats'] | null>(null);
  const [pdfStats, setPdfStats] = useState<PdfStats | null>(null);
  const [pdfFolios, setPdfFolios] = useState<FolioData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // PDF-specific options
  const [renderAsImages, setRenderAsImages] = useState(false);
  const [scannedPageMode, setScannedPageMode] = useState<'image' | 'placeholder' | 'skip'>('image');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Create import services
  const docxService = useMemo(() => createDocxImportService(), []);
  const pdfService = useMemo(() => createPdfImportService(), []);
  const folioCreator = useMemo(() => createFolioCreator({ scannedPageMode }), [scannedPageMode]);

  // Handle DOCX file
  const handleDocxFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const result = await docxService.preview(file, {
        preserveImages,
        preserveTables,
        preserveLists,
      });

      if (result.success && result.cleanedHtml) {
        setPreviewHtml(result.cleanedHtml);
        setPreviewStats(result.stats ?? null);
      } else {
        setError(result.error || 'Failed to preview file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
    } finally {
      setIsLoading(false);
    }
  }, [docxService, preserveImages, preserveTables, preserveLists]);

  // Handle PDF file
  const handlePdfFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const result = await pdfService.importPdf(file, {
        extractText: true,
        renderAsImages,
        imageScale: 1.5,
      });

      if (result.success) {
        // Create folios from pages
        const folios = folioCreator.createFolios(result.pages);
        setPdfFolios(folios);

        // Calculate stats
        const summary = folioCreator.getFolioSummary(folios);
        setPdfStats({
          totalPages: result.totalPages,
          portrait: summary.portrait,
          landscape: summary.landscape,
          textBased: summary.textBased,
          imageBased: summary.imageBased,
        });

        // Create preview HTML
        const previewContent = folioCreator.foliosToHtml(folios.slice(0, 3)); // Show first 3 pages
        setPreviewHtml(previewContent);
      } else {
        setError(result.error || 'Failed to preview PDF');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview PDF');
    } finally {
      setIsLoading(false);
    }
  }, [pdfService, folioCreator, renderAsImages]);

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setPreviewHtml(null);
    setPreviewStats(null);
    setPdfStats(null);
    setPdfFolios(null);

    const fileType = detectFileType(file);

    if (fileType === 'unknown') {
      setError('Please select a valid Word document (.docx) or PDF file (.pdf)');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File size exceeds maximum of ${formatFileSize(maxFileSize)}`);
      return;
    }

    // Set file info
    setFileInfo({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      fileType,
    });

    // Process based on file type
    if (fileType === 'docx') {
      await handleDocxFile(file);
    } else if (fileType === 'pdf') {
      await handlePdfFile(file);
    }
  }, [maxFileSize, handleDocxFile, handlePdfFile]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const relatedTarget = e.relatedTarget as Node | null;
    if (!dropZoneRef.current?.contains(relatedTarget)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  // Handle import
  const handleImport = useCallback(async () => {
    if (!fileInfo) return;

    setIsLoading(true);
    setError(null);

    try {
      if (fileInfo.fileType === 'docx') {
        // DOCX import
        const options: Partial<DocxImportOptions> = {
          mode: importMode,
          preserveImages,
          preserveTables,
          preserveLists,
        };

        let result: DocxImportResult;

        if (editor) {
          result = await docxService.importToEditor(editor, fileInfo.file, options);
        } else {
          result = await docxService.importDocx(fileInfo.file, options);
        }

        if (result.success) {
          onImportComplete?.({ type: 'docx', result });
          onClose();
        } else {
          setError(result.error || 'Import failed');
        }
      } else if (fileInfo.fileType === 'pdf') {
        // PDF import - create folios
        if (pdfFolios && pdfFolios.length > 0) {
          // Call the folio creation handler
          onFoliosCreated?.(pdfFolios);

          // Also call onImportComplete with full result
          const pdfResult = await pdfService.importPdf(fileInfo.file, {
            extractText: true,
            renderAsImages,
          });

          if (pdfResult.success) {
            onImportComplete?.({
              type: 'pdf',
              result: pdfResult,
              folios: pdfFolios,
            });
          }

          onClose();
        } else {
          setError('No pages found in PDF');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  }, [
    fileInfo,
    importMode,
    preserveImages,
    preserveTables,
    preserveLists,
    editor,
    docxService,
    pdfService,
    pdfFolios,
    renderAsImages,
    onImportComplete,
    onFoliosCreated,
    onClose,
  ]);

  // Handle browse click
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Reset state
  const handleReset = useCallback(() => {
    setFileInfo(null);
    setPreviewHtml(null);
    setPreviewStats(null);
    setPdfStats(null);
    setPdfFolios(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  if (!isOpen) return null;

  const isPdf = fileInfo?.fileType === 'pdf';
  const isDocx = fileInfo?.fileType === 'docx';

  return (
    <div className="import-dialog-overlay" onClick={onClose}>
      <div
        className="import-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="import-dialog-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="import-dialog__header">
          <h2 id="import-dialog-title" className="import-dialog__title">
            Import Document
          </h2>
          <button
            className="import-dialog__close"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isLoading}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="import-dialog__content">
          {/* Error message */}
          {error && (
            <div className="import-dialog__error">
              <span className="import-dialog__error-icon">!</span>
              {error}
            </div>
          )}

          {/* Drop zone */}
          {!fileInfo && (
            <div
              ref={dropZoneRef}
              className={`import-dialog__dropzone ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              role="button"
              tabIndex={0}
              aria-label="Drop zone for file upload"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf"
                onChange={handleFileInputChange}
                className="import-dialog__file-input"
              />
              <div className="import-dialog__dropzone-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                </svg>
              </div>
              <div className="import-dialog__dropzone-text">
                <span className="import-dialog__dropzone-main">
                  Drag & drop your document here
                </span>
                <span className="import-dialog__dropzone-sub">
                  or <button type="button" className="import-dialog__browse-btn">browse</button> to select
                </span>
              </div>
              <div className="import-dialog__dropzone-hint">
                Supports .docx and .pdf files up to {formatFileSize(maxFileSize)}
              </div>
            </div>
          )}

          {/* File info and preview */}
          {fileInfo && (
            <div className="import-dialog__file-section">
              {/* File card */}
              <div className="import-dialog__file-card">
                <div className={`import-dialog__file-icon ${isPdf ? 'import-dialog__file-icon--pdf' : ''}`}>
                  {isPdf ? (
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                    </svg>
                  )}
                </div>
                <div className="import-dialog__file-info">
                  <span className="import-dialog__file-name">{fileInfo.name}</span>
                  <span className="import-dialog__file-size">
                    {fileInfo.size}
                    {isPdf && pdfStats && ` • ${pdfStats.totalPages} pages`}
                  </span>
                </div>
                <button
                  className="import-dialog__file-remove"
                  onClick={handleReset}
                  aria-label="Remove file"
                  disabled={isLoading}
                >
                  &times;
                </button>
              </div>

              {/* DOCX Stats */}
              {isDocx && previewStats && (
                <div className="import-dialog__stats">
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{previewStats.paragraphs}</span>
                    <span className="import-dialog__stat-label">Paragraphs</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{previewStats.headings}</span>
                    <span className="import-dialog__stat-label">Headings</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{previewStats.lists}</span>
                    <span className="import-dialog__stat-label">Lists</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{previewStats.tables}</span>
                    <span className="import-dialog__stat-label">Tables</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{previewStats.images}</span>
                    <span className="import-dialog__stat-label">Images</span>
                  </div>
                </div>
              )}

              {/* PDF Stats */}
              {isPdf && pdfStats && (
                <div className="import-dialog__stats">
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{pdfStats.totalPages}</span>
                    <span className="import-dialog__stat-label">Pages</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{pdfStats.portrait}</span>
                    <span className="import-dialog__stat-label">Portrait</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{pdfStats.landscape}</span>
                    <span className="import-dialog__stat-label">Landscape</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{pdfStats.textBased}</span>
                    <span className="import-dialog__stat-label">Text</span>
                  </div>
                  <div className="import-dialog__stat">
                    <span className="import-dialog__stat-value">{pdfStats.imageBased}</span>
                    <span className="import-dialog__stat-label">Scanned</span>
                  </div>
                </div>
              )}

              {/* Preview */}
              {previewHtml && (
                <div className="import-dialog__preview">
                  <h3 className="import-dialog__preview-title">
                    Preview {isPdf && pdfStats && pdfStats.totalPages > 3 && `(first 3 of ${pdfStats.totalPages} pages)`}
                  </h3>
                  <div
                    className="import-dialog__preview-content"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}

              {/* Options */}
              <div className="import-dialog__options">
                <h3 className="import-dialog__options-title">Import Options</h3>

                {/* Import mode (DOCX only) */}
                {isDocx && (
                  <div className="import-dialog__option-group">
                    <label className="import-dialog__label">Import Mode</label>
                    <div className="import-dialog__mode-options">
                      <label className="import-dialog__radio">
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          disabled={isLoading}
                        />
                        <span className="import-dialog__radio-label">Replace</span>
                        <span className="import-dialog__radio-desc">Replace all existing content</span>
                      </label>
                      <label className="import-dialog__radio">
                        <input
                          type="radio"
                          name="importMode"
                          value="append"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                          disabled={isLoading}
                        />
                        <span className="import-dialog__radio-label">Append</span>
                        <span className="import-dialog__radio-desc">Add to end of document</span>
                      </label>
                      <label className="import-dialog__radio">
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          disabled={isLoading}
                        />
                        <span className="import-dialog__radio-label">Insert</span>
                        <span className="import-dialog__radio-desc">Insert at cursor position</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* PDF Folio info */}
                {isPdf && (
                  <div className="import-dialog__option-group">
                    <label className="import-dialog__label">Folio Creation</label>
                    <div className="import-dialog__info-text">
                      Each PDF page will create a new folio with the correct orientation.
                      {pdfStats && pdfStats.imageBased > 0 && (
                        <span className="import-dialog__info-warning">
                          {` ${pdfStats.imageBased} scanned page(s) detected.`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* PDF scanned page handling */}
                {isPdf && pdfStats && pdfStats.imageBased > 0 && (
                  <div className="import-dialog__option-group">
                    <label className="import-dialog__label">Scanned Pages</label>
                    <div className="import-dialog__mode-options">
                      <label className="import-dialog__radio">
                        <input
                          type="radio"
                          name="scannedMode"
                          value="image"
                          checked={scannedPageMode === 'image'}
                          onChange={() => setScannedPageMode('image')}
                          disabled={isLoading}
                        />
                        <span className="import-dialog__radio-label">As Image</span>
                        <span className="import-dialog__radio-desc">Keep as page image</span>
                      </label>
                      <label className="import-dialog__radio">
                        <input
                          type="radio"
                          name="scannedMode"
                          value="placeholder"
                          checked={scannedPageMode === 'placeholder'}
                          onChange={() => setScannedPageMode('placeholder')}
                          disabled={isLoading}
                        />
                        <span className="import-dialog__radio-label">Placeholder</span>
                        <span className="import-dialog__radio-desc">Add placeholder text</span>
                      </label>
                      <label className="import-dialog__radio">
                        <input
                          type="radio"
                          name="scannedMode"
                          value="skip"
                          checked={scannedPageMode === 'skip'}
                          onChange={() => setScannedPageMode('skip')}
                          disabled={isLoading}
                        />
                        <span className="import-dialog__radio-label">Skip</span>
                        <span className="import-dialog__radio-desc">Skip scanned pages</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* PDF render option */}
                {isPdf && (
                  <div className="import-dialog__option-group">
                    <label className="import-dialog__label">Page Rendering</label>
                    <div className="import-dialog__checkboxes">
                      <label className="import-dialog__checkbox">
                        <input
                          type="checkbox"
                          checked={renderAsImages}
                          onChange={(e) => setRenderAsImages(e.target.checked)}
                          disabled={isLoading}
                        />
                        Render all pages as images (for complex layouts)
                      </label>
                    </div>
                  </div>
                )}

                {/* DOCX content options */}
                {isDocx && (
                  <div className="import-dialog__option-group">
                    <label className="import-dialog__label">Content Options</label>
                    <div className="import-dialog__checkboxes">
                      <label className="import-dialog__checkbox">
                        <input
                          type="checkbox"
                          checked={preserveFormatting}
                          onChange={(e) => setPreserveFormatting(e.target.checked)}
                          disabled={isLoading}
                        />
                        Preserve formatting
                      </label>
                      <label className="import-dialog__checkbox">
                        <input
                          type="checkbox"
                          checked={preserveImages}
                          onChange={(e) => setPreserveImages(e.target.checked)}
                          disabled={isLoading}
                        />
                        Include images
                      </label>
                      <label className="import-dialog__checkbox">
                        <input
                          type="checkbox"
                          checked={preserveTables}
                          onChange={(e) => setPreserveTables(e.target.checked)}
                          disabled={isLoading}
                        />
                        Include tables
                      </label>
                      <label className="import-dialog__checkbox">
                        <input
                          type="checkbox"
                          checked={preserveLists}
                          onChange={(e) => setPreserveLists(e.target.checked)}
                          disabled={isLoading}
                        />
                        Include lists
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="import-dialog__loading">
              <div className="import-dialog__spinner" />
              <span>Processing {isPdf ? 'PDF' : 'document'}...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="import-dialog__footer">
          <button
            className="import-dialog__btn import-dialog__btn--secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="import-dialog__btn import-dialog__btn--primary"
            onClick={handleImport}
            disabled={!fileInfo || isLoading}
          >
            {isLoading
              ? 'Importing...'
              : isPdf
                ? `Create ${pdfStats?.totalPages || 0} Folios`
                : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportDialog;
