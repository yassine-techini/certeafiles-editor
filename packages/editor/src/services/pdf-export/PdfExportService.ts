/**
 * PdfExportService - Coordinates PDF export process
 * Per Constitution Section 8 - Export
 */

import type { LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import type {
  PdfExportOptions,
  PdfMetadata,
  PdfMetadataRequest,
  PdfExportRequest,
  PdfExportResponse,
  ExportProgress,
} from '../../types/export';
import { DEFAULT_PDF_OPTIONS, DEFAULT_PDF_METADATA } from '../../types/export';
import type { Slot } from '../../types/slot';
import type { ResolutionContext } from './SlotResolver';
import { SlotResolver, createSlotResolver } from './SlotResolver';

/**
 * Folio data for export
 */
export interface ExportFolio {
  id: string;
  index: number;
  orientation: 'portrait' | 'landscape';
  editor: LexicalEditor;
  slots: Slot[];
}

/**
 * Export service configuration
 */
export interface PdfExportServiceConfig {
  /** API endpoint URL */
  apiUrl: string;
  /** Timeout in milliseconds */
  timeout?: number | undefined;
  /** Retry count on failure */
  retryCount?: number | undefined;
  /** Progress callback */
  onProgress?: ((progress: ExportProgress) => void) | undefined;
}

/**
 * Default CSS styles for export
 */
const DEFAULT_EXPORT_STYLES = `
  /* Reset and base styles */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .editor-content {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000;
  }

  /* Typography */
  p {
    margin-bottom: 0.5em;
  }

  h1 { font-size: 24pt; font-weight: bold; margin: 12pt 0; }
  h2 { font-size: 18pt; font-weight: bold; margin: 10pt 0; }
  h3 { font-size: 14pt; font-weight: bold; margin: 8pt 0; }
  h4 { font-size: 12pt; font-weight: bold; margin: 6pt 0; }

  /* Lists */
  ul, ol {
    margin-left: 20pt;
    margin-bottom: 0.5em;
  }

  li {
    margin-bottom: 0.25em;
  }

  /* Tables */
  table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1em;
  }

  th, td {
    border: 1px solid #000;
    padding: 6pt;
    text-align: left;
    vertical-align: top;
  }

  th {
    font-weight: bold;
    background-color: #f5f5f5;
  }

  /* Images */
  img {
    max-width: 100%;
    height: auto;
  }

  /* Slots */
  .slot-placeholder {
    color: #666;
    font-style: italic;
  }

  .slot-filled {
    /* Filled slots render as normal text */
  }

  /* Legal specific styles */
  .article-title {
    font-weight: bold;
    text-transform: uppercase;
    margin: 1em 0 0.5em;
  }

  .clause {
    margin-left: 20pt;
  }

  .signature-block {
    margin-top: 2em;
    page-break-inside: avoid;
  }
`;

/**
 * Internal config with all required fields
 */
interface ResolvedConfig {
  apiUrl: string;
  timeout: number;
  retryCount: number;
  onProgress: (progress: ExportProgress) => void;
}

/**
 * PdfExportService class
 */
export class PdfExportService {
  private config: ResolvedConfig;
  private slotResolver: SlotResolver;
  private abortController: AbortController | null = null;

  constructor(config: PdfExportServiceConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      timeout: config.timeout ?? 60000,
      retryCount: config.retryCount ?? 2,
      onProgress: config.onProgress ?? (() => {}),
    };
    this.slotResolver = createSlotResolver();
  }

  /**
   * Export folios to PDF
   */
  async exportToPdf(
    folios: ExportFolio[],
    options: Partial<PdfExportOptions> = {},
    metadata: Partial<PdfMetadata> = {}
  ): Promise<PdfExportResponse> {
    // Create abort controller for cancellation
    this.abortController = new AbortController();

    try {
      // Merge options with defaults
      const mergedOptions: PdfExportOptions = {
        ...DEFAULT_PDF_OPTIONS,
        ...options,
      };

      const mergedMetadata: PdfMetadata = {
        ...DEFAULT_PDF_METADATA,
        ...metadata,
        creationDate: new Date(),
        modificationDate: new Date(),
      };

      // Update progress: preparing
      this.updateProgress({
        status: 'preparing',
        percentage: 5,
        message: 'Preparing document for export...',
        currentPage: 0,
        totalPages: folios.length,
      });

      // Filter folios by page range if specified
      let exportFolios = folios;
      if (mergedOptions.pageRange) {
        exportFolios = folios.filter(
          (f) =>
            f.index >= mergedOptions.pageRange!.start &&
            f.index <= mergedOptions.pageRange!.end
        );
      }

      // Resolve slots if enabled
      let resolvedSlots: Record<string, string> = {};
      if (mergedOptions.resolveSlots) {
        this.updateProgress({
          status: 'resolving_slots',
          percentage: 15,
          message: 'Resolving document slots...',
          currentPage: 0,
          totalPages: exportFolios.length,
        });

        resolvedSlots = await this.resolveAllSlots(exportFolios, mergedMetadata);
      }

      // Generate HTML for each folio
      this.updateProgress({
        status: 'rendering',
        percentage: 30,
        message: 'Rendering pages...',
        currentPage: 0,
        totalPages: exportFolios.length,
      });

      const serializedFolios = await this.serializeFolios(
        exportFolios,
        mergedOptions
      );

      // Build request payload - convert Date objects to ISO strings for API
      const requestMetadata: PdfMetadataRequest = {
        title: mergedMetadata.title,
        author: mergedMetadata.author,
        subject: mergedMetadata.subject,
        keywords: mergedMetadata.keywords,
        creator: mergedMetadata.creator,
        producer: mergedMetadata.producer,
        creationDate: mergedMetadata.creationDate.toISOString(),
        modificationDate: mergedMetadata.modificationDate.toISOString(),
      };

      const request: PdfExportRequest = {
        folios: serializedFolios,
        options: mergedOptions,
        metadata: requestMetadata,
        resolvedSlots,
      };

      // Send to API
      this.updateProgress({
        status: 'generating_pdf',
        percentage: 60,
        message: 'Generating PDF...',
        currentPage: exportFolios.length,
        totalPages: exportFolios.length,
      });

      const response = await this.sendToApi(request);

      // Finalize
      this.updateProgress({
        status: 'finalizing',
        percentage: 90,
        message: 'Finalizing export...',
        currentPage: exportFolios.length,
        totalPages: exportFolios.length,
      });

      // If we got HTML back (client-side mode), create PDF
      if (response.success && 'html' in response) {
        const pdfResult = await this.generateClientSidePdf(
          response as { html: string; filename: string; pageCount: number }
        );

        this.updateProgress({
          status: 'complete',
          percentage: 100,
          message: 'Export complete!',
          currentPage: exportFolios.length,
          totalPages: exportFolios.length,
        });

        return pdfResult;
      }

      this.updateProgress({
        status: 'complete',
        percentage: 100,
        message: 'Export complete!',
        currentPage: exportFolios.length,
        totalPages: exportFolios.length,
      });

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.updateProgress({
        status: 'error',
        percentage: 0,
        message: errorMessage,
        currentPage: 0,
        totalPages: folios.length,
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing export
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Resolve all slots across folios
   */
  private async resolveAllSlots(
    folios: ExportFolio[],
    metadata: PdfMetadata
  ): Promise<Record<string, string>> {
    const allSlots: Slot[] = [];
    const slotsByFolio: Map<string, Slot[]> = new Map();

    // Collect all slots
    for (const folio of folios) {
      slotsByFolio.set(folio.id, folio.slots);
      allSlots.push(...folio.slots);
    }

    // Create resolution context
    const context: ResolutionContext = {
      documentId: metadata.title,
      pageNumber: 1,
      totalPages: folios.length,
      metadata: {
        title: metadata.title,
        author: metadata.author,
        subject: metadata.subject,
        version: '1.0',
      },
      dataSources: [],
      userValues: {},
      now: new Date(),
    };

    // Resolve all slots
    const result = await this.slotResolver.resolveAll(allSlots, context);

    return result.values;
  }

  /**
   * Serialize folios to export format
   */
  private async serializeFolios(
    folios: ExportFolio[],
    options: PdfExportOptions
  ): Promise<PdfExportRequest['folios']> {
    const serialized: PdfExportRequest['folios'] = [];

    for (let i = 0; i < folios.length; i++) {
      const folio = folios[i];

      this.updateProgress({
        status: 'rendering',
        percentage: 30 + Math.floor((i / folios.length) * 30),
        message: `Rendering page ${i + 1} of ${folios.length}...`,
        currentPage: i + 1,
        totalPages: folios.length,
      });

      // Generate HTML from editor state
      const htmlContent = await this.generateHtmlFromEditor(folio.editor, options);

      serialized.push({
        id: folio.id,
        index: folio.index,
        orientation: folio.orientation,
        htmlContent,
        cssStyles: DEFAULT_EXPORT_STYLES,
      });
    }

    return serialized;
  }

  /**
   * Generate HTML from Lexical editor
   */
  private generateHtmlFromEditor(
    editor: LexicalEditor,
    _options: PdfExportOptions
  ): Promise<string> {
    return new Promise((resolve) => {
      editor.getEditorState().read(() => {
        const html = $generateHtmlFromNodes(editor);
        resolve(`<div class="editor-content">${html}</div>`);
      });
    });
  }

  /**
   * Send export request to API
   */
  private async sendToApi(request: PdfExportRequest): Promise<PdfExportResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
      try {
        const fetchOptions: RequestInit = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        };

        // Add abort signal if available
        if (this.abortController) {
          fetchOptions.signal = this.abortController.signal;
        }

        const response = await fetch(this.config.apiUrl, fetchOptions);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Export cancelled');
        }

        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Wait before retry
        if (attempt < this.config.retryCount) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    throw lastError || new Error('Failed to export PDF');
  }

  /**
   * Generate PDF on client side using browser APIs
   */
  private async generateClientSidePdf(data: {
    html: string;
    filename: string;
    pageCount: number;
  }): Promise<PdfExportResponse> {
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '0';
    iframe.style.height = '0';
    document.body.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Failed to create print frame');
      }

      // Write HTML content
      iframeDoc.open();
      iframeDoc.write(data.html);
      iframeDoc.close();

      // Wait for content to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Trigger print dialog (user will save as PDF)
      iframe.contentWindow?.print();

      return {
        success: true,
        filename: data.filename,
        pageCount: data.pageCount,
      };
    } finally {
      // Cleanup iframe after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }
  }

  /**
   * Update export progress
   */
  private updateProgress(progress: ExportProgress): void {
    this.config.onProgress(progress);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create PDF export service
 */
export function createPdfExportService(
  config: PdfExportServiceConfig
): PdfExportService {
  return new PdfExportService(config);
}

/**
 * Quick export function for simple use cases
 */
export async function exportToPdf(
  folios: ExportFolio[],
  options: {
    apiUrl: string;
    exportOptions?: Partial<PdfExportOptions> | undefined;
    metadata?: Partial<PdfMetadata> | undefined;
    onProgress?: ((progress: ExportProgress) => void) | undefined;
  }
): Promise<PdfExportResponse> {
  const service = createPdfExportService({
    apiUrl: options.apiUrl,
    onProgress: options.onProgress,
  });

  return service.exportToPdf(
    folios,
    options.exportOptions,
    options.metadata
  );
}

export default PdfExportService;
