/**
 * PdfImportService - Import PDF files using pdfjs-dist
 * Per Constitution Section 8 - Import
 */

import * as pdfjsLib from 'pdfjs-dist';
import type {
  PDFDocumentProxy,
  PDFPageProxy,
  TextContent,
  TextItem,
} from 'pdfjs-dist/types/src/display/api';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

/**
 * Page orientation
 */
export type PageOrientation = 'portrait' | 'landscape';

/**
 * Extracted page data
 */
export interface ExtractedPage {
  /** Page number (1-indexed) */
  pageNumber: number;
  /** Page width in points */
  width: number;
  /** Page height in points */
  height: number;
  /** Detected orientation */
  orientation: PageOrientation;
  /** Extracted text content */
  textContent: string;
  /** Text items with positions (for advanced layout) */
  textItems: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
    fontSize: number;
  }>;
  /** Page rendered as image (base64 data URL) */
  imageDataUrl?: string | undefined;
  /** Whether page appears to be scanned/image-based */
  isScanned: boolean;
}

/**
 * PDF import options
 */
export interface PdfImportOptions {
  /** Whether to extract text */
  extractText?: boolean | undefined;
  /** Whether to render pages as images */
  renderAsImages?: boolean | undefined;
  /** Image render scale (1 = 72 DPI, 2 = 144 DPI, etc.) */
  imageScale?: number | undefined;
  /** Page range to import (null = all) */
  pageRange?: { start: number; end: number } | null | undefined;
  /** Whether to use OCR for scanned pages (placeholder for future) */
  useOcr?: boolean | undefined;
  /** Password for encrypted PDFs */
  password?: string | undefined;
}

/**
 * PDF import result
 */
export interface PdfImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Total pages in PDF */
  totalPages: number;
  /** Extracted pages */
  pages: ExtractedPage[];
  /** PDF metadata */
  metadata?: {
    title?: string | undefined;
    author?: string | undefined;
    subject?: string | undefined;
    keywords?: string | undefined;
    creator?: string | undefined;
    producer?: string | undefined;
    creationDate?: Date | undefined;
    modificationDate?: Date | undefined;
  } | undefined;
  /** Error message if failed */
  error?: string | undefined;
  /** Warnings during import */
  warnings?: string[] | undefined;
}

/**
 * Default import options
 */
export const DEFAULT_PDF_IMPORT_OPTIONS: PdfImportOptions = {
  extractText: true,
  renderAsImages: false,
  imageScale: 1.5,
  pageRange: null,
  useOcr: false,
};

/**
 * PdfImportService class
 */
export class PdfImportService {
  private pdfDocument: PDFDocumentProxy | null = null;

  /**
   * Import a PDF file
   */
  async importPdf(
    file: File | ArrayBuffer | Uint8Array,
    options: PdfImportOptions = {}
  ): Promise<PdfImportResult> {
    const mergedOptions = { ...DEFAULT_PDF_IMPORT_OPTIONS, ...options };
    const warnings: string[] = [];

    try {
      // Load PDF document
      const data = await this.getArrayBuffer(file);

      const loadingTask = pdfjsLib.getDocument({
        data,
        password: mergedOptions.password,
      });

      this.pdfDocument = await loadingTask.promise;
      const totalPages = this.pdfDocument.numPages;

      // Extract metadata
      const metadata = await this.extractMetadata(this.pdfDocument);

      // Determine page range
      const startPage = mergedOptions.pageRange?.start ?? 1;
      const endPage = Math.min(
        mergedOptions.pageRange?.end ?? totalPages,
        totalPages
      );

      // Extract pages
      const pages: ExtractedPage[] = [];

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        try {
          const page = await this.pdfDocument.getPage(pageNum);
          const extractedPage = await this.extractPage(page, pageNum, mergedOptions);
          pages.push(extractedPage);
        } catch (pageError) {
          warnings.push(
            `Failed to extract page ${pageNum}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`
          );
        }
      }

      return {
        success: true,
        totalPages,
        pages,
        metadata,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        totalPages: 0,
        pages: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } finally {
      // Cleanup
      if (this.pdfDocument) {
        await this.pdfDocument.destroy();
        this.pdfDocument = null;
      }
    }
  }

  /**
   * Get page count without full import
   */
  async getPageCount(file: File | ArrayBuffer | Uint8Array): Promise<number> {
    try {
      const data = await this.getArrayBuffer(file);
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdf = await loadingTask.promise;
      const count = pdf.numPages;
      await pdf.destroy();
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Extract a single page
   */
  private async extractPage(
    page: PDFPageProxy,
    pageNumber: number,
    options: PdfImportOptions
  ): Promise<ExtractedPage> {
    const viewport = page.getViewport({ scale: 1 });
    const width = viewport.width;
    const height = viewport.height;
    const orientation: PageOrientation = width > height ? 'landscape' : 'portrait';

    let textContent = '';
    let textItems: ExtractedPage['textItems'] = [];
    let isScanned = false;

    // Extract text if enabled
    if (options.extractText) {
      const textResult = await this.extractTextFromPage(page);
      textContent = textResult.text;
      textItems = textResult.items;
      isScanned = textResult.isScanned;
    }

    // Render as image if enabled or if page is scanned
    let imageDataUrl: string | undefined;
    if (options.renderAsImages || (isScanned && !options.useOcr)) {
      imageDataUrl = await this.renderPageAsImage(page, options.imageScale ?? 1.5);
    }

    return {
      pageNumber,
      width,
      height,
      orientation,
      textContent,
      textItems,
      imageDataUrl,
      isScanned,
    };
  }

  /**
   * Extract text from a page
   */
  private async extractTextFromPage(
    page: PDFPageProxy
  ): Promise<{ text: string; items: ExtractedPage['textItems']; isScanned: boolean }> {
    const textContent: TextContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });

    const items: ExtractedPage['textItems'] = [];
    const textParts: string[] = [];
    let totalChars = 0;

    for (const item of textContent.items) {
      // Check if it's a TextItem (not a TextMarkedContent)
      if ('str' in item) {
        const textItem = item as TextItem;
        const text = textItem.str;

        if (text.trim()) {
          totalChars += text.length;
          textParts.push(text);

          // Get position information
          const tx = textItem.transform;
          items.push({
            text,
            x: tx[4],
            y: viewport.height - tx[5], // Flip Y coordinate
            width: textItem.width,
            height: textItem.height,
            fontName: textItem.fontName,
            fontSize: Math.sqrt(tx[0] * tx[0] + tx[1] * tx[1]), // Calculate font size from transform
          });
        }
      }
    }

    // Detect if page is likely scanned (very little text)
    const pageArea = viewport.width * viewport.height;
    const textDensity = totalChars / pageArea;
    const isScanned = totalChars < 50 || textDensity < 0.0001;

    // Join text with proper spacing
    const fullText = this.reconstructText(items, viewport.height);

    return {
      text: fullText,
      items,
      isScanned,
    };
  }

  /**
   * Reconstruct text with proper line breaks
   */
  private reconstructText(
    items: ExtractedPage['textItems'],
    _pageHeight: number
  ): string {
    if (items.length === 0) return '';

    // Sort items by position (top to bottom, left to right)
    const sorted = [...items].sort((a, b) => {
      const yDiff = a.y - b.y;
      if (Math.abs(yDiff) > 5) return yDiff; // Different lines
      return a.x - b.x; // Same line, sort by x
    });

    const lines: string[] = [];
    let currentLine: string[] = [];
    let lastY = sorted[0].y;
    const lineThreshold = 10; // Pixels to consider same line

    for (const item of sorted) {
      if (Math.abs(item.y - lastY) > lineThreshold) {
        // New line
        if (currentLine.length > 0) {
          lines.push(currentLine.join(' '));
        }
        currentLine = [item.text];
        lastY = item.y;
      } else {
        currentLine.push(item.text);
      }
    }

    // Add last line
    if (currentLine.length > 0) {
      lines.push(currentLine.join(' '));
    }

    return lines.join('\n');
  }

  /**
   * Render page as image
   */
  private async renderPageAsImage(
    page: PDFPageProxy,
    scale: number
  ): Promise<string> {
    const viewport = page.getViewport({ scale });

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get canvas context');
    }

    // Render page to canvas - use type assertion for compatibility
    const renderContext = {
      canvasContext: context,
      viewport,
      canvas,
    } as Parameters<typeof page.render>[0];

    await page.render(renderContext).promise;

    // Convert to data URL
    return canvas.toDataURL('image/png');
  }

  /**
   * Extract PDF metadata
   */
  private async extractMetadata(
    pdf: PDFDocumentProxy
  ): Promise<PdfImportResult['metadata']> {
    try {
      const metadata = await pdf.getMetadata();
      const info = metadata.info as Record<string, unknown>;

      return {
        title: typeof info.Title === 'string' ? info.Title : undefined,
        author: typeof info.Author === 'string' ? info.Author : undefined,
        subject: typeof info.Subject === 'string' ? info.Subject : undefined,
        keywords: typeof info.Keywords === 'string' ? info.Keywords : undefined,
        creator: typeof info.Creator === 'string' ? info.Creator : undefined,
        producer: typeof info.Producer === 'string' ? info.Producer : undefined,
        creationDate: this.parseDate(info.CreationDate),
        modificationDate: this.parseDate(info.ModDate),
      };
    } catch {
      return undefined;
    }
  }

  /**
   * Parse PDF date string
   */
  private parseDate(dateStr: unknown): Date | undefined {
    if (typeof dateStr !== 'string') return undefined;

    // PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
    const match = dateStr.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
    if (!match) return undefined;

    const [, year, month, day, hour = '0', minute = '0', second = '0'] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }

  /**
   * Convert input to ArrayBuffer
   */
  private async getArrayBuffer(
    input: File | ArrayBuffer | Uint8Array
  ): Promise<ArrayBuffer> {
    if (input instanceof File) {
      return input.arrayBuffer();
    }
    if (input instanceof Uint8Array) {
      return input.buffer.slice(
        input.byteOffset,
        input.byteOffset + input.byteLength
      );
    }
    return input;
  }
}

/**
 * Create PDF import service
 */
export function createPdfImportService(): PdfImportService {
  return new PdfImportService();
}

export default PdfImportService;
