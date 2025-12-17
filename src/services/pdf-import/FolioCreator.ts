/**
 * FolioCreator - Create folios from PDF pages
 * Per Constitution Section 8 - Import
 */

import type { LexicalEditor } from 'lexical';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import type { ExtractedPage, PageOrientation } from './PdfImportService';

/**
 * Folio data structure
 */
export interface FolioData {
  /** Unique folio ID */
  id: string;
  /** Folio index (0-based) */
  index: number;
  /** Page orientation */
  orientation: PageOrientation;
  /** Source PDF page number */
  sourcePageNumber: number;
  /** Content type */
  contentType: 'text' | 'image' | 'mixed';
  /** Text content (if text-based) */
  textContent?: string | undefined;
  /** Image data URL (if image-based) */
  imageDataUrl?: string | undefined;
  /** Original page dimensions */
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Folio creation options
 */
export interface FolioCreationOptions {
  /** How to handle scanned pages */
  scannedPageMode: 'image' | 'placeholder' | 'skip';
  /** Whether to preserve page breaks */
  preservePageBreaks?: boolean | undefined;
  /** Minimum text length to consider page as text-based */
  minTextLength?: number | undefined;
  /** Custom ID generator */
  idGenerator?: (() => string) | undefined;
  /** Start index for folios */
  startIndex?: number | undefined;
}

/**
 * Default folio creation options
 */
export const DEFAULT_FOLIO_OPTIONS: FolioCreationOptions = {
  scannedPageMode: 'image',
  preservePageBreaks: true,
  minTextLength: 50,
  startIndex: 0,
};

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `folio-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * FolioCreator class
 */
export class FolioCreator {
  private options: FolioCreationOptions;

  constructor(options: Partial<FolioCreationOptions> = {}) {
    this.options = { ...DEFAULT_FOLIO_OPTIONS, ...options };
  }

  /**
   * Create folios from extracted PDF pages
   */
  createFolios(pages: ExtractedPage[]): FolioData[] {
    const folios: FolioData[] = [];
    const idGen = this.options.idGenerator ?? generateId;
    const startIndex = this.options.startIndex ?? 0;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const folio = this.createFolioFromPage(page, startIndex + i, idGen);

      if (folio) {
        folios.push(folio);
      }
    }

    return folios;
  }

  /**
   * Create a single folio from an extracted page
   */
  private createFolioFromPage(
    page: ExtractedPage,
    index: number,
    idGenerator: () => string
  ): FolioData | null {
    const { scannedPageMode, minTextLength } = this.options;

    // Determine content type
    const hasSubstantialText = page.textContent.length >= (minTextLength ?? 50);
    const hasImage = !!page.imageDataUrl;

    let contentType: FolioData['contentType'];
    let textContent: string | undefined;
    let imageDataUrl: string | undefined;

    if (page.isScanned) {
      // Handle scanned page
      switch (scannedPageMode) {
        case 'skip':
          return null;
        case 'placeholder':
          contentType = 'text';
          textContent = `[Page ${page.pageNumber} - Scanned content]`;
          break;
        case 'image':
        default:
          contentType = 'image';
          imageDataUrl = page.imageDataUrl;
          textContent = page.textContent || undefined;
          break;
      }
    } else if (hasSubstantialText && hasImage) {
      contentType = 'mixed';
      textContent = page.textContent;
      imageDataUrl = page.imageDataUrl;
    } else if (hasSubstantialText) {
      contentType = 'text';
      textContent = page.textContent;
    } else if (hasImage) {
      contentType = 'image';
      imageDataUrl = page.imageDataUrl;
    } else {
      // Empty page - create with placeholder
      contentType = 'text';
      textContent = '';
    }

    return {
      id: idGenerator(),
      index,
      orientation: page.orientation,
      sourcePageNumber: page.pageNumber,
      contentType,
      textContent,
      imageDataUrl,
      dimensions: {
        width: page.width,
        height: page.height,
      },
    };
  }

  /**
   * Insert folio content into a Lexical editor
   */
  async insertFolioContent(
    editor: LexicalEditor,
    folio: FolioData
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      editor.update(
        () => {
          try {
            const root = $getRoot();
            root.clear();

            if (folio.contentType === 'text' || folio.contentType === 'mixed') {
              // Insert text content
              this.insertTextContent(folio.textContent || '');
            }

            if (folio.contentType === 'image' && folio.imageDataUrl) {
              // Insert image placeholder
              this.insertImagePlaceholder(folio);
            }

            resolve();
          } catch (error) {
            reject(error);
          }
        },
        { discrete: true }
      );
    });
  }

  /**
   * Insert text content as paragraphs
   */
  private insertTextContent(text: string): void {
    const root = $getRoot();
    const lines = text.split('\n');

    for (const line of lines) {
      const paragraph = $createParagraphNode();

      if (line.trim()) {
        paragraph.append($createTextNode(line));
      }

      root.append(paragraph);
    }

    // Ensure at least one paragraph
    if (root.getChildrenSize() === 0) {
      root.append($createParagraphNode());
    }
  }

  /**
   * Insert image placeholder for scanned pages
   */
  private insertImagePlaceholder(folio: FolioData): void {
    const root = $getRoot();

    // Create a paragraph with image info
    const paragraph = $createParagraphNode();
    paragraph.append(
      $createTextNode(
        `[PDF Page ${folio.sourcePageNumber} - Image content]`
      )
    );
    root.append(paragraph);

    // Note: In a full implementation, you would create an ImageNode here
    // with the imageDataUrl. For now, we store a placeholder.
  }

  /**
   * Convert folios to HTML for preview
   */
  foliosToHtml(folios: FolioData[]): string {
    const htmlParts: string[] = [];

    for (const folio of folios) {
      htmlParts.push(`<div class="folio-preview" data-page="${folio.sourcePageNumber}">`);
      htmlParts.push(`<div class="folio-header">Page ${folio.sourcePageNumber} (${folio.orientation})</div>`);

      if (folio.contentType === 'image' && folio.imageDataUrl) {
        htmlParts.push(
          `<img src="${folio.imageDataUrl}" alt="Page ${folio.sourcePageNumber}" style="max-width: 100%;" />`
        );
      }

      if (folio.textContent) {
        const escapedText = folio.textContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        htmlParts.push(`<div class="folio-text">${escapedText}</div>`);
      }

      htmlParts.push('</div>');
    }

    return htmlParts.join('\n');
  }

  /**
   * Get summary of folios
   */
  getFolioSummary(folios: FolioData[]): {
    total: number;
    portrait: number;
    landscape: number;
    textBased: number;
    imageBased: number;
    mixed: number;
  } {
    return {
      total: folios.length,
      portrait: folios.filter((f) => f.orientation === 'portrait').length,
      landscape: folios.filter((f) => f.orientation === 'landscape').length,
      textBased: folios.filter((f) => f.contentType === 'text').length,
      imageBased: folios.filter((f) => f.contentType === 'image').length,
      mixed: folios.filter((f) => f.contentType === 'mixed').length,
    };
  }
}

/**
 * Create folio creator instance
 */
export function createFolioCreator(
  options?: Partial<FolioCreationOptions>
): FolioCreator {
  return new FolioCreator(options);
}

/**
 * Quick function to create folios from PDF pages
 */
export function createFoliosFromPages(
  pages: ExtractedPage[],
  options?: Partial<FolioCreationOptions>
): FolioData[] {
  const creator = createFolioCreator(options);
  return creator.createFolios(pages);
}

export default FolioCreator;
