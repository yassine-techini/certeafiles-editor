/**
 * PDF Export Utility
 * Exports folio pages to PDF using jsPDF and html2canvas
 */
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { A4_CONSTANTS } from './a4-constants';

export interface PDFExportOptions {
  /** Document title */
  title?: string;
  /** Include page numbers */
  includePageNumbers?: boolean;
  /** Quality (0-1) */
  quality?: number;
  /** Callback for progress updates */
  onProgress?: (current: number, total: number) => void;
}

/**
 * Export all folios to PDF
 */
export async function exportToPDF(options: PDFExportOptions = {}): Promise<void> {
  const {
    title = 'Document',
    quality = 0.95,
    onProgress,
  } = options;

  // Find all folio elements
  const folioElements = document.querySelectorAll('[data-folio-id]');

  if (folioElements.length === 0) {
    console.warn('[PDF Export] No folio elements found');
    return;
  }

  // Create PDF in A4 format
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = A4_CONSTANTS.WIDTH_MM;
  const pdfHeight = A4_CONSTANTS.HEIGHT_MM;

  // Process each folio
  for (let i = 0; i < folioElements.length; i++) {
    const folioElement = folioElements[i] as HTMLElement;

    // Report progress
    if (onProgress) {
      onProgress(i + 1, folioElements.length);
    }

    // Get orientation from data attribute
    const orientation = folioElement.getAttribute('data-folio-orientation') === 'landscape'
      ? 'landscape'
      : 'portrait';
    const isLandscape = orientation === 'landscape';

    // Page dimensions based on orientation
    const pageWidth = isLandscape ? pdfHeight : pdfWidth;
    const pageHeight = isLandscape ? pdfWidth : pdfHeight;

    try {
      // Capture the folio as canvas
      const canvas = await html2canvas(folioElement, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', quality);

      // Calculate dimensions to fit page
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // Center the image on the page
      const offsetX = (pageWidth - scaledWidth) / 2;
      const offsetY = (pageHeight - scaledHeight) / 2;

      // Add new page for subsequent folios with correct orientation
      if (i > 0) {
        pdf.addPage('a4', orientation);
      } else if (isLandscape) {
        // First page: if landscape, we need to recreate the PDF with landscape
        // jsPDF doesn't allow changing first page orientation, so we handle it differently
        pdf.deletePage(1);
        pdf.addPage('a4', 'landscape');
      }

      // Add the image to PDF
      pdf.addImage(imgData, 'JPEG', offsetX, offsetY, scaledWidth, scaledHeight);

    } catch (error) {
      console.error(`[PDF Export] Error processing page ${i + 1}:`, error);
    }
  }

  // Save the PDF
  pdf.save(`${title}.pdf`);
}

/**
 * Export a single folio to PDF
 */
export async function exportFolioToPDF(
  folioId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const { title = 'Page', quality = 0.95 } = options;

  const folioElement = document.querySelector(`[data-folio-id="${folioId}"]`) as HTMLElement;

  if (!folioElement) {
    console.warn(`[PDF Export] Folio element not found: ${folioId}`);
    return;
  }

  // Get orientation from data attribute
  const orientation = folioElement.getAttribute('data-folio-orientation') === 'landscape'
    ? 'landscape'
    : 'portrait';
  const isLandscape = orientation === 'landscape';

  // Create PDF with correct orientation
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Page dimensions based on orientation
  const pageWidth = isLandscape ? A4_CONSTANTS.HEIGHT_MM : A4_CONSTANTS.WIDTH_MM;
  const pageHeight = isLandscape ? A4_CONSTANTS.WIDTH_MM : A4_CONSTANTS.HEIGHT_MM;

  try {
    const canvas = await html2canvas(folioElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    const offsetX = (pageWidth - scaledWidth) / 2;
    const offsetY = (pageHeight - scaledHeight) / 2;

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, scaledWidth, scaledHeight);
    pdf.save(`${title}.pdf`);

  } catch (error) {
    console.error('[PDF Export] Error:', error);
  }
}

export default exportToPDF;
