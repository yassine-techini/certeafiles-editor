/**
 * DocxImportService - Import DOCX files using mammoth.js
 * Per Constitution Section 8 - Import
 */

import mammoth from 'mammoth';
import type { LexicalEditor } from 'lexical';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
} from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { StyleMapper, createStyleMapper } from './StyleMapper';
import type { StyleMappingConfig } from './StyleMapper';

/**
 * Mammoth options type (simplified for our use)
 */
interface MammothOptions {
  styleMap?: string | string[] | undefined;
  includeDefaultStyleMap?: boolean | undefined;
  convertImage?: unknown | undefined;
  transformDocument?: ((element: unknown) => unknown) | undefined;
}

/**
 * Import mode options
 */
export type ImportMode = 'replace' | 'merge' | 'append';

/**
 * Import options
 */
export interface DocxImportOptions {
  /** Import mode */
  mode: ImportMode;
  /** Style mapping configuration */
  styleConfig?: Partial<StyleMappingConfig> | undefined;
  /** Whether to preserve images */
  preserveImages?: boolean | undefined;
  /** Whether to preserve tables */
  preserveTables?: boolean | undefined;
  /** Whether to preserve lists */
  preserveLists?: boolean | undefined;
  /** Whether to convert comments to editor comments */
  importComments?: boolean | undefined;
  /** Whether to import track changes */
  importTrackChanges?: boolean | undefined;
  /** Custom element transformers */
  transformers?: ((element: unknown) => unknown) | undefined;
}

/**
 * Import result
 */
export interface DocxImportResult {
  /** Whether import was successful */
  success: boolean;
  /** Generated HTML */
  html?: string | undefined;
  /** Cleaned HTML */
  cleanedHtml?: string | undefined;
  /** Warnings from mammoth */
  warnings?: string[] | undefined;
  /** Error message if failed */
  error?: string | undefined;
  /** Statistics about imported content */
  stats?: {
    paragraphs: number;
    headings: number;
    lists: number;
    tables: number;
    images: number;
  } | undefined;
}

/**
 * Default import options
 */
export const DEFAULT_IMPORT_OPTIONS: DocxImportOptions = {
  mode: 'replace',
  preserveImages: true,
  preserveTables: true,
  preserveLists: true,
  importComments: false,
  importTrackChanges: false,
};

/**
 * Mammoth style map for better HTML output
 */
const MAMMOTH_STYLE_MAP = [
  // Headings
  "p[style-name='Heading 1'] => h1:fresh",
  "p[style-name='Heading 2'] => h2:fresh",
  "p[style-name='Heading 3'] => h3:fresh",
  "p[style-name='Heading 4'] => h4:fresh",
  "p[style-name='Heading 5'] => h5:fresh",
  "p[style-name='Heading 6'] => h6:fresh",
  "p[style-name='Title'] => h1.document-title:fresh",
  "p[style-name='Subtitle'] => h2.document-subtitle:fresh",

  // Quotes
  "p[style-name='Quote'] => blockquote:fresh",
  "p[style-name='Intense Quote'] => blockquote.intense:fresh",

  // Code
  "p[style-name='Code'] => pre > code:fresh",
  "r[style-name='Code Char'] => code",

  // Lists
  "p[style-name='List Paragraph'] => li:fresh",

  // Character styles
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "r[style-name='Intense Emphasis'] => em > strong",

  // Tables
  'table => table.imported-table',
  'tr => tr',
  'td => td',
  'th => th',

  // Preserve other inline styles
  'b => strong',
  'i => em',
  'u => u',
  'strike => s',
  'sup => sup',
  'sub => sub',
];

/**
 * DocxImportService class
 */
export class DocxImportService {
  private styleMapper: StyleMapper;

  constructor(styleConfig?: Partial<StyleMappingConfig>) {
    this.styleMapper = createStyleMapper(styleConfig);
  }

  /**
   * Import a DOCX file
   */
  async importDocx(
    file: File | ArrayBuffer,
    options: Partial<DocxImportOptions> = {}
  ): Promise<DocxImportResult> {
    const mergedOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options };

    try {
      // Convert File to ArrayBuffer if needed
      const arrayBuffer =
        file instanceof File ? await file.arrayBuffer() : file;

      // Configure mammoth options
      const mammothOptions: MammothOptions = {
        styleMap: MAMMOTH_STYLE_MAP,
        includeDefaultStyleMap: true,
        convertImage: mergedOptions.preserveImages
          ? mammoth.images.imgElement((image: { contentType: string; read: (encoding: string) => Promise<string> }) =>
              image.read('base64').then((imageBuffer: string) => ({
                src: `data:${image.contentType};base64,${imageBuffer}`,
              }))
            )
          : undefined,
      };

      // Add custom transformer if provided
      if (mergedOptions.transformers) {
        mammothOptions.transformDocument = mergedOptions.transformers;
      }

      // Convert DOCX to HTML
      // Cast options to satisfy mammoth's type requirements
      const result = await mammoth.convertToHtml(
        { arrayBuffer },
        mammothOptions as Parameters<typeof mammoth.convertToHtml>[1]
      );

      // Clean the HTML
      const cleanedHtml = this.cleanHtml(result.value, mergedOptions);

      // Calculate statistics
      const stats = this.calculateStats(cleanedHtml);

      // Extract warnings
      const warnings = result.messages
        .filter((msg) => msg.type === 'warning')
        .map((msg) => msg.message);

      return {
        success: true,
        html: result.value,
        cleanedHtml,
        warnings: warnings.length > 0 ? warnings : undefined,
        stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Import DOCX content into a Lexical editor
   */
  async importToEditor(
    editor: LexicalEditor,
    file: File | ArrayBuffer,
    options: Partial<DocxImportOptions> = {}
  ): Promise<DocxImportResult> {
    const mergedOptions = { ...DEFAULT_IMPORT_OPTIONS, ...options };

    // First, convert DOCX to HTML
    const importResult = await this.importDocx(file, mergedOptions);

    if (!importResult.success || !importResult.cleanedHtml) {
      return importResult;
    }

    try {
      // Import HTML into Lexical
      await this.importHtmlToEditor(
        editor,
        importResult.cleanedHtml,
        mergedOptions.mode
      );

      return importResult;
    } catch (error) {
      return {
        ...importResult,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import to editor',
      };
    }
  }

  /**
   * Import HTML content into Lexical editor
   */
  async importHtmlToEditor(
    editor: LexicalEditor,
    html: string,
    mode: ImportMode
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      editor.update(
        () => {
          try {
            // Create a DOM parser
            const parser = new DOMParser();
            const dom = parser.parseFromString(html, 'text/html');

            // Generate Lexical nodes from DOM
            const nodes = $generateNodesFromDOM(editor, dom);

            if (nodes.length === 0) {
              // If no nodes were generated, create a paragraph with the text
              const textContent = dom.body.textContent || '';
              if (textContent.trim()) {
                const paragraph = $createParagraphNode();
                paragraph.append($createTextNode(textContent));
                nodes.push(paragraph);
              }
            }

            const root = $getRoot();

            switch (mode) {
              case 'replace':
                // Clear existing content and insert new
                root.clear();
                root.append(...nodes);
                break;

              case 'append':
                // Add to end of document
                root.append(...nodes);
                break;

              case 'merge':
                // Insert at current selection or end
                $insertNodes(nodes);
                break;
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
   * Clean imported HTML
   */
  private cleanHtml(html: string, options: DocxImportOptions): string {
    let cleaned = html;

    // Use StyleMapper to clean Office styles
    cleaned = this.styleMapper.cleanOfficeStyles(cleaned);

    // Additional cleaning
    cleaned = this.cleanEmptyElements(cleaned);
    cleaned = this.normalizeWhitespace(cleaned);

    // Remove tables if not preserving
    if (!options.preserveTables) {
      cleaned = cleaned.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, '');
    }

    // Remove lists if not preserving
    if (!options.preserveLists) {
      cleaned = cleaned.replace(/<[ou]l[^>]*>[\s\S]*?<\/[ou]l>/gi, (match) => {
        // Extract text from list items
        const items = match.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        return items
          .map((item) => {
            const text = item.replace(/<[^>]*>/g, '').trim();
            return `<p>${text}</p>`;
          })
          .join('');
      });
    }

    // Remove images if not preserving
    if (!options.preserveImages) {
      cleaned = cleaned.replace(/<img[^>]*>/gi, '');
    }

    // Clean up consecutive empty paragraphs
    cleaned = cleaned.replace(/(<p[^>]*>\s*<\/p>\s*){2,}/gi, '<p></p>');

    return cleaned;
  }

  /**
   * Clean empty elements
   */
  private cleanEmptyElements(html: string): string {
    let cleaned = html;

    // Remove empty spans
    cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, '');

    // Remove empty divs
    cleaned = cleaned.replace(/<div[^>]*>\s*<\/div>/gi, '');

    // Remove empty anchors without href
    cleaned = cleaned.replace(/<a(?![^>]*href)[^>]*>\s*<\/a>/gi, '');

    return cleaned;
  }

  /**
   * Normalize whitespace
   */
  private normalizeWhitespace(html: string): string {
    let cleaned = html;

    // Normalize multiple spaces to single space
    cleaned = cleaned.replace(/  +/g, ' ');

    // Remove leading/trailing whitespace in elements
    cleaned = cleaned.replace(/>\s+/g, '> ');
    cleaned = cleaned.replace(/\s+</g, ' <');

    // Trim content
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Calculate statistics about imported content
   */
  private calculateStats(html: string): DocxImportResult['stats'] {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    return {
      paragraphs: tempDiv.querySelectorAll('p').length,
      headings: tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
      lists: tempDiv.querySelectorAll('ul, ol').length,
      tables: tempDiv.querySelectorAll('table').length,
      images: tempDiv.querySelectorAll('img').length,
    };
  }

  /**
   * Preview DOCX content without importing
   */
  async preview(
    file: File | ArrayBuffer,
    options: Partial<DocxImportOptions> = {}
  ): Promise<DocxImportResult> {
    return this.importDocx(file, options);
  }

  /**
   * Extract raw text from DOCX
   */
  async extractText(file: File | ArrayBuffer): Promise<string> {
    try {
      const arrayBuffer =
        file instanceof File ? await file.arrayBuffer() : file;

      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      throw new Error(
        `Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get the style mapper instance
   */
  getStyleMapper(): StyleMapper {
    return this.styleMapper;
  }
}

/**
 * Create a DOCX import service
 */
export function createDocxImportService(
  styleConfig?: Partial<StyleMappingConfig>
): DocxImportService {
  return new DocxImportService(styleConfig);
}

/**
 * Quick import function
 */
export async function importDocxFile(
  file: File,
  editor?: LexicalEditor,
  options?: Partial<DocxImportOptions>
): Promise<DocxImportResult> {
  const service = createDocxImportService(options?.styleConfig);

  if (editor) {
    return service.importToEditor(editor, file, options);
  }

  return service.importDocx(file, options);
}

export default DocxImportService;
