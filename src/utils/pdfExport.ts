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

      // Calculate dimensions to fit A4
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // Center the image on the page
      const offsetX = (pdfWidth - scaledWidth) / 2;
      const offsetY = (pdfHeight - scaledHeight) / 2;

      // Add new page for subsequent folios
      if (i > 0) {
        pdf.addPage();
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

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = A4_CONSTANTS.WIDTH_MM;
  const pdfHeight = A4_CONSTANTS.HEIGHT_MM;

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
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    const offsetX = (pdfWidth - scaledWidth) / 2;
    const offsetY = (pdfHeight - scaledHeight) / 2;

    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, scaledWidth, scaledHeight);
    pdf.save(`${title}.pdf`);

  } catch (error) {
    console.error('[PDF Export] Error:', error);
  }
}

export default exportToPDF;
