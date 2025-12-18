/**
 * DOCX Export Utility - Converts Lexical editor state to Word document
 * Per Constitution Section 8 - Export
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
  ImageRun,
  ExternalHyperlink,
  FootnoteReferenceRun,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
import type { EditorState, SerializedLexicalNode } from 'lexical';
import type { DocxExportOptions, DocxExportProgress } from '../types/docxExport';

/**
 * Export editor content to DOCX format
 */
export async function exportToDocx(
  editorState: EditorState,
  options: DocxExportOptions,
  onProgress?: (progress: DocxExportProgress) => void
): Promise<Blob> {
  onProgress?.({
    step: 'preparing',
    percentage: 10,
    message: 'Préparation du document...',
  });

  // Get serialized state
  const serialized = editorState.toJSON();

  onProgress?.({
    step: 'converting',
    percentage: 30,
    message: 'Conversion du contenu...',
  });

  // Convert Lexical nodes to docx elements
  const children = await convertNodesToDocx(serialized.root.children, options);

  onProgress?.({
    step: 'generating',
    percentage: 70,
    message: 'Génération du fichier Word...',
  });

  // Build section options
  const sectionOptions: {
    properties: { page: { margin: { top: number; right: number; bottom: number; left: number } } };
    headers?: { default: Header };
    footers?: { default: Footer };
    children: (Paragraph | Table)[];
  } = {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left: convertInchesToTwip(1),
        },
      },
    },
    children,
  };

  if (options.includeHeaders) {
    sectionOptions.headers = {
      default: new Header({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: options.title || 'Document',
                size: 20,
                color: '666666',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
    };
  }

  if (options.includeFooters) {
    sectionOptions.footers = {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                children: ['Page ', PageNumber.CURRENT, ' sur ', PageNumber.TOTAL_PAGES],
                size: 18,
                color: '666666',
              }),
            ],
          }),
        ],
      }),
    };
  }

  // Create document
  const doc = new Document({
    creator: options.author || 'CerteaFiles Editor',
    title: options.title,
    subject: options.subject,
    description: options.description,
    keywords: options.keywords.join(', '),
    sections: [sectionOptions],
  });

  onProgress?.({
    step: 'complete',
    percentage: 100,
    message: 'Export terminé !',
  });

  // Generate blob
  return await Packer.toBlob(doc);
}

/**
 * Download DOCX file
 */
export async function downloadDocx(
  editorState: EditorState,
  filename: string,
  options: DocxExportOptions,
  onProgress?: (progress: DocxExportProgress) => void
): Promise<void> {
  const blob = await exportToDocx(editorState, options, onProgress);
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}

/**
 * Convert Lexical nodes to docx elements
 */
async function convertNodesToDocx(
  nodes: SerializedLexicalNode[],
  options: DocxExportOptions
): Promise<(Paragraph | Table)[]> {
  const elements: (Paragraph | Table)[] = [];

  for (const node of nodes) {
    const converted = await convertNodeToDocx(node, options);
    if (converted) {
      if (Array.isArray(converted)) {
        elements.push(...converted);
      } else {
        elements.push(converted);
      }
    }
  }

  return elements;
}

/**
 * Convert a single Lexical node to docx element
 */
async function convertNodeToDocx(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Promise<Paragraph | Table | (Paragraph | Table)[] | null> {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node, options);

    case 'heading':
      return convertHeading(node, options);

    case 'list':
      return convertList(node, options);

    case 'listitem':
      return convertListItem(node, options);

    case 'quote':
      return convertQuote(node, options);

    case 'table':
      return convertTable(node, options);

    case 'horizontalrule':
      return new Paragraph({
        border: {
          bottom: {
            color: '999999',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { before: 200, after: 200 },
      });

    case 'image':
      return await convertImage(node);

    case 'slot':
      if (options.resolveSlots) {
        // Return resolved value or placeholder text
        return new Paragraph({
          children: [
            new TextRun({
              text: (node as SerializedSlotNode).resolvedValue || `[${(node as SerializedSlotNode).slotType}]`,
              highlight: 'yellow',
            }),
          ],
        });
      }
      return new Paragraph({
        children: [
          new TextRun({
            text: `{${(node as SerializedSlotNode).slotType}}`,
            color: '0066CC',
          }),
        ],
      });

    case 'footnote':
      if (options.includeFootnotes) {
        return new Paragraph({
          children: [
            new FootnoteReferenceRun((node as SerializedFootnoteNode).footnoteNumber),
          ],
        });
      }
      return null;

    case 'insertion':
      if (options.includeTrackChanges) {
        return convertInsertionNode(node, options);
      }
      // If not including track changes, just render the content normally
      return convertChildrenToParagraph(getNodeChildren(node), options);

    case 'deletion':
      if (options.includeTrackChanges) {
        return convertDeletionNode(node, options);
      }
      // If not including track changes, skip deleted content
      return null;

    default:
      // Unknown node type - try to extract text
      const defaultChildren = getNodeChildren(node);
      if (defaultChildren.length > 0) {
        return convertChildrenToParagraph(defaultChildren, options);
      }
      return null;
  }
}

/**
 * Helper to get children from a node safely
 */
function getNodeChildren(node: SerializedLexicalNode): SerializedLexicalNode[] {
  if ('children' in node && Array.isArray((node as NodeWithChildren).children)) {
    return (node as NodeWithChildren).children;
  }
  return [];
}

/**
 * Interface for nodes with children
 */
interface NodeWithChildren extends SerializedLexicalNode {
  children: SerializedLexicalNode[];
}

/**
 * Convert paragraph node
 */
function convertParagraph(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Paragraph {
  const children = convertTextChildren(getNodeChildren(node), options);
  const format = (node as SerializedParagraphNode).format;

  return new Paragraph({
    children,
    alignment: getAlignment(format),
    spacing: { after: 120 },
  });
}

/**
 * Convert heading node
 */
function convertHeading(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Paragraph {
  const headingNode = node as SerializedHeadingNode;
  const children = convertTextChildren(getNodeChildren(node), options);
  const level = parseInt(headingNode.tag?.replace('h', '') || '1', 10);

  const headingLevelMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  };

  return new Paragraph({
    children,
    heading: headingLevelMap[level] || HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
  });
}

/**
 * Convert list node
 */
function convertList(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Paragraph[] {
  const listNode = node as SerializedListNode;
  const isOrdered = listNode.listType === 'number';
  const items: Paragraph[] = [];

  for (const child of getNodeChildren(node)) {
    if (child.type === 'listitem') {
      const text = convertTextChildren(getNodeChildren(child), options);
      const paragraphOptions: { children: TextRun[]; bullet?: { level: number }; numbering?: { reference: string; level: number } } = {
        children: text,
      };
      if (!isOrdered) {
        paragraphOptions.bullet = { level: 0 };
      } else {
        paragraphOptions.numbering = { reference: 'default-numbering', level: 0 };
      }
      items.push(new Paragraph(paragraphOptions));
    }
  }

  return items;
}

/**
 * Convert list item node
 */
function convertListItem(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Paragraph {
  const children = convertTextChildren(getNodeChildren(node), options);
  return new Paragraph({
    children,
    bullet: { level: 0 },
  });
}

/**
 * Convert quote node
 */
function convertQuote(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Paragraph {
  const children = convertTextChildren(getNodeChildren(node), options);
  return new Paragraph({
    children,
    indent: { left: convertInchesToTwip(0.5) },
    border: {
      left: {
        color: '999999',
        space: 10,
        style: BorderStyle.SINGLE,
        size: 12,
      },
    },
    spacing: { before: 200, after: 200 },
  });
}

/**
 * Convert table node
 */
function convertTable(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Table {
  const rows: TableRow[] = [];

  for (const rowNode of getNodeChildren(node)) {
    if (rowNode.type === 'tablerow') {
      const cells: TableCell[] = [];
      const rowChildren = getNodeChildren(rowNode);
      for (const cellNode of rowChildren) {
        if (cellNode.type === 'tablecell') {
          const paragraphs = convertTextChildren(getNodeChildren(cellNode), options);
          cells.push(
            new TableCell({
              children: [new Paragraph({ children: paragraphs })],
              width: { size: 100 / (rowChildren.length || 1), type: WidthType.PERCENTAGE },
            })
          );
        }
      }
      rows.push(new TableRow({ children: cells }));
    }
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Convert image node
 */
async function convertImage(node: SerializedLexicalNode): Promise<Paragraph | null> {
  const imageNode = node as SerializedImageNode;

  try {
    // For base64 images
    if (imageNode.src?.startsWith('data:image')) {
      const base64Data = imageNode.src.split(',')[1];
      const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      return new Paragraph({
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: {
              width: imageNode.width || 400,
              height: imageNode.height || 300,
            },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
      });
    }

    // For URL images, fetch and convert
    if (imageNode.src) {
      const response = await fetch(imageNode.src);
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = new Uint8Array(arrayBuffer);

      return new Paragraph({
        children: [
          new ImageRun({
            data: imageBuffer,
            transformation: {
              width: imageNode.width || 400,
              height: imageNode.height || 300,
            },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
      });
    }
  } catch (error) {
    console.error('[DocxExport] Failed to convert image:', error);
  }

  return null;
}

/**
 * Convert insertion node (track changes)
 */
function convertInsertionNode(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Paragraph {
  const children = convertTextChildren(getNodeChildren(node), options);
  // Add underline to indicate insertion
  return new Paragraph({
    children: children.map((child) => {
      if (child instanceof TextRun) {
        return new TextRun({
          text: (child as unknown as { text: string }).text,
          underline: { type: 'single', color: '0000FF' },
          color: '0000FF',
        });
      }
      return child;
    }),
  });
}

/**
 * Convert deletion node (track changes)
 */
function convertDeletionNode(
  node: SerializedLexicalNode,
  options: DocxExportOptions
): Paragraph {
  const children = convertTextChildren(getNodeChildren(node), options);
  // Add strikethrough to indicate deletion
  return new Paragraph({
    children: children.map((child) => {
      if (child instanceof TextRun) {
        return new TextRun({
          text: (child as unknown as { text: string }).text,
          strike: true,
          color: 'FF0000',
        });
      }
      return child;
    }),
  });
}

/**
 * Convert children to a paragraph
 */
function convertChildrenToParagraph(
  children: SerializedLexicalNode[],
  options: DocxExportOptions
): Paragraph {
  const textRuns = convertTextChildren(children, options);
  return new Paragraph({ children: textRuns });
}

/**
 * Convert text children to TextRun array
 */
function convertTextChildren(
  children: SerializedLexicalNode[],
  options: DocxExportOptions
): TextRun[] {
  const runs: TextRun[] = [];

  for (const child of children) {
    if (child.type === 'text') {
      const textNode = child as SerializedTextNode;
      const runOptions: {
        text: string;
        bold?: boolean;
        italics?: boolean;
        underline?: { type: 'single' };
        strike?: boolean;
        superScript?: boolean;
        subScript?: boolean;
      } = {
        text: textNode.text,
      };
      if (textNode.format & 1) runOptions.bold = true;
      if (textNode.format & 2) runOptions.italics = true;
      if (textNode.format & 8) runOptions.underline = { type: 'single' };
      if (textNode.format & 4) runOptions.strike = true;
      if (textNode.format & 32) runOptions.superScript = true;
      if (textNode.format & 64) runOptions.subScript = true;
      runs.push(new TextRun(runOptions));
    } else if (child.type === 'link') {
      const linkNode = child as SerializedLinkNode;
      const linkText = extractTextFromNode(linkNode);
      runs.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: linkText,
              color: '0066CC',
              underline: { type: 'single' },
            }),
          ],
          link: linkNode.url || '',
        }) as unknown as TextRun
      );
    } else if (child.type === 'linebreak') {
      runs.push(new TextRun({ break: 1 }));
    } else {
      // Recursively process nested children
      const nestedChildren = getNodeChildren(child);
      if (nestedChildren.length > 0) {
        runs.push(...convertTextChildren(nestedChildren, options));
      }
    }
  }

  return runs;
}

/**
 * Extract text content from a node
 */
function extractTextFromNode(node: SerializedLexicalNode): string {
  if (node.type === 'text') {
    return (node as SerializedTextNode).text;
  }
  const children = getNodeChildren(node);
  if (children.length > 0) {
    return children.map(extractTextFromNode).join('');
  }
  return '';
}

/**
 * Get alignment from format number
 */
function getAlignment(format?: number): (typeof AlignmentType)[keyof typeof AlignmentType] {
  switch (format) {
    case 1:
      return AlignmentType.LEFT;
    case 2:
      return AlignmentType.CENTER;
    case 3:
      return AlignmentType.RIGHT;
    case 4:
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
}

// Type definitions for serialized nodes
interface SerializedTextNode extends SerializedLexicalNode {
  text: string;
  format: number;
}

interface SerializedParagraphNode extends SerializedLexicalNode {
  format?: number;
  children?: SerializedLexicalNode[];
}

interface SerializedHeadingNode extends SerializedLexicalNode {
  tag?: string;
  children?: SerializedLexicalNode[];
}

interface SerializedListNode extends SerializedLexicalNode {
  listType?: 'bullet' | 'number' | 'check';
  children?: SerializedLexicalNode[];
}

interface SerializedImageNode extends SerializedLexicalNode {
  src?: string;
  altText?: string;
  width?: number;
  height?: number;
}

interface SerializedLinkNode extends SerializedLexicalNode {
  url?: string;
  children?: SerializedLexicalNode[];
}

interface SerializedSlotNode extends SerializedLexicalNode {
  slotType?: string;
  resolvedValue?: string;
}

interface SerializedFootnoteNode extends SerializedLexicalNode {
  footnoteId?: string;
  footnoteNumber: number;
}
