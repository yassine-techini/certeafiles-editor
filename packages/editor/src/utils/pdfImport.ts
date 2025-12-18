/**
 * PDF Import Utility
 * Imports PDF files and converts pages to images for the editor
 */
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker for version 5.x
// Use the worker from node_modules via ESM import
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface PDFImportOptions {
  /** Scale factor for rendering (default 2 for high quality) */
  scale?: number;
  /** Callback for progress updates */
  onProgress?: (current: number, total: number) => void;
}

export interface PDFPageData {
  /** Page number (1-based) */
  pageNumber: number;
  /** Image data URL */
  imageDataUrl: string;
  /** Original page width in points */
  width: number;
  /** Original page height in points */
  height: number;
  /** Extracted text content */
  textContent: string;
}

export interface PDFImportResult {
  /** Number of pages */
  pageCount: number;
  /** Page data array */
  pages: PDFPageData[];
  /** PDF metadata */
  metadata: {
    title?: string | undefined;
    author?: string | undefined;
    subject?: string | undefined;
    creator?: string | undefined;
  };
}

/**
 * Import a PDF file and extract pages as images
 */
export async function importPDF(
  file: File,
  options: PDFImportOptions = {}
): Promise<PDFImportResult> {
  const { scale = 2, onProgress } = options;

  // Read file as array buffer
  const arrayBuffer = await file.arrayBuffer();

  // Load PDF document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDocument = await loadingTask.promise;

  const pageCount = pdfDocument.numPages;
  const pages: PDFPageData[] = [];

  // Get metadata
  const metadata = await pdfDocument.getMetadata();
  const info = metadata.info as Record<string, string> | undefined;

  // Process each page
  for (let i = 1; i <= pageCount; i++) {
    if (onProgress) {
      onProgress(i, pageCount);
    }

    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale });

    // Create canvas for rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not get canvas context');
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Render page to canvas
    // Note: canvas is required by TypeScript types but may not be used at runtime
    await page.render({
      canvasContext: context,
      viewport,
      canvas,
    } as Parameters<typeof page.render>[0]).promise;

    // Extract text content
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');

    // Convert canvas to data URL
    const imageDataUrl = canvas.toDataURL('image/png', 0.92);

    pages.push({
      pageNumber: i,
      imageDataUrl,
      width: page.getViewport({ scale: 1 }).width,
      height: page.getViewport({ scale: 1 }).height,
      textContent: text,
    });

    // Cleanup
    canvas.remove();
  }

  return {
    pageCount,
    pages,
    metadata: {
      title: info?.Title || undefined,
      author: info?.Author || undefined,
      subject: info?.Subject || undefined,
      creator: info?.Creator || undefined,
    },
  };
}

/**
 * Create a file input and prompt user to select a PDF
 */
export function selectPDFFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };

    input.oncancel = () => {
      resolve(null);
    };

    input.click();
  });
}

export default importPDF;
