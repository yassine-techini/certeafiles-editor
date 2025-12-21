/**
 * FolioNode - ElementNode representing an A4 page/folio
 * Per Constitution Section 3.3 - Custom Nodes
 *
 * Architecture: FolioNode creates a DOM structure with 3 fixed zones:
 * - folio-header-zone: Container for header content (injected by HeaderFooterPlugin)
 * - folio-content-zone: Container for Lexical editable content
 * - folio-footer-zone: Container for footer content (injected by HeaderFooterPlugin)
 *
 * This prevents overlapping issues as each zone has fixed, non-overlapping positions.
 */
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
  Spread,
  LexicalCommand,
} from 'lexical';
import {
  $applyNodeReplacement,
  $createParagraphNode,
  createCommand,
  ElementNode,
} from 'lexical';
import { A4_CONSTANTS, LANDSCAPE_CONSTANTS } from '../utils/a4-constants';
import { CSS_CLASSES } from '../core/constants';
import type { FolioOrientation } from '../types/folio';

/**
 * Payload for creating a new FolioNode
 */
export interface FolioPayload {
  folioId: string;
  folioIndex: number;
  orientation?: FolioOrientation;
  sectionId?: string | null;
  key?: NodeKey;
}

/**
 * Serialized FolioNode structure
 */
export type SerializedFolioNode = Spread<
  {
    folioId: string;
    folioIndex: number;
    orientation: FolioOrientation;
    sectionId: string | null;
  },
  SerializedElementNode
>;

// Commands for folio operations
export const INSERT_FOLIO_COMMAND: LexicalCommand<FolioPayload> = createCommand(
  'INSERT_FOLIO_COMMAND'
);
export const DELETE_FOLIO_COMMAND: LexicalCommand<string> = createCommand(
  'DELETE_FOLIO_COMMAND'
);
export const UPDATE_FOLIO_COMMAND: LexicalCommand<{
  folioId: string;
  updates: Partial<FolioPayload>;
}> = createCommand('UPDATE_FOLIO_COMMAND');

/**
 * Convert DOM element to FolioNode
 */
function $convertFolioElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-folio-id')) {
    const folioId = domNode.getAttribute('data-folio-id') || '';
    const folioIndex = parseInt(domNode.getAttribute('data-folio-index') || '0', 10);
    const orientation = (domNode.getAttribute('data-folio-orientation') || 'portrait') as FolioOrientation;
    const sectionId = domNode.getAttribute('data-folio-section-id') || null;

    const node = $createFolioNode({
      folioId,
      folioIndex,
      orientation,
      sectionId,
    });
    return { node };
  }
  return null;
}

/**
 * FolioNode - ElementNode that represents an A4 page
 * Contains page content and handles portrait/landscape dimensions
 */
export class FolioNode extends ElementNode {
  __folioId: string;
  __folioIndex: number;
  __orientation: FolioOrientation;
  __sectionId: string | null;

  static override getType(): string {
    return 'folio';
  }

  static override clone(node: FolioNode): FolioNode {
    return new FolioNode(
      node.__folioId,
      node.__folioIndex,
      node.__orientation,
      node.__sectionId,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedFolioNode): FolioNode {
    const { folioId, folioIndex, orientation, sectionId } = serializedNode;
    const node = $createFolioNode({
      folioId,
      folioIndex,
      orientation,
      sectionId,
    });
    return node;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-folio-id')) {
          return {
            conversion: $convertFolioElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    folioId: string,
    folioIndex: number,
    orientation: FolioOrientation = 'portrait',
    sectionId: string | null = null,
    key?: NodeKey
  ) {
    super(key);
    this.__folioId = folioId;
    this.__folioIndex = folioIndex;
    this.__orientation = orientation;
    this.__sectionId = sectionId;
  }

  override exportJSON(): SerializedFolioNode {
    return {
      ...super.exportJSON(),
      type: 'folio',
      version: 1,
      folioId: this.__folioId,
      folioIndex: this.__folioIndex,
      orientation: this.__orientation,
      sectionId: this.__sectionId,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-folio-id', this.__folioId);
    element.setAttribute('data-folio-index', String(this.__folioIndex));
    element.setAttribute('data-folio-orientation', this.__orientation);
    if (this.__sectionId) {
      element.setAttribute('data-folio-section-id', this.__sectionId);
    }
    element.className = 'folio-page';

    // Set A4 dimensions
    const dimensions = this.getDimensions();
    element.style.width = `${dimensions.width}px`;
    element.style.minHeight = `${dimensions.height}px`;
    element.style.backgroundColor = '#ffffff';
    element.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    element.style.pageBreakAfter = 'always';

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.setAttribute('data-folio-id', this.__folioId);
    div.setAttribute('data-folio-index', String(this.__folioIndex));
    div.setAttribute('data-folio-orientation', this.__orientation);
    if (this.__sectionId) {
      div.setAttribute('data-folio-section-id', this.__sectionId);
    }

    // Base classes
    div.className = CSS_CLASSES.FOLIO_PAGE;

    // Apply theme class if available
    const theme = config.theme;
    if (theme.folio) {
      div.className += ` ${theme.folio}`;
    }

    // Set A4 dimensions based on orientation
    const dimensions = this.getDimensions();
    div.style.width = `${dimensions.width}px`;
    div.style.height = `${dimensions.height}px`;
    div.style.maxHeight = `${dimensions.height}px`;
    // Store height as data attribute for AutoPaginationPlugin
    div.setAttribute('data-folio-height', String(Math.round(dimensions.height)));
    div.style.backgroundColor = '#ffffff';
    div.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    div.style.marginBottom = '24px';
    div.style.position = 'relative';
    div.style.overflow = 'hidden';

    // Use Flexbox for layout - vertical column
    // HeaderNode uses flexShrink: 0 and stays at top
    // FooterNode uses marginTop: auto and stays at bottom
    // Content fills the middle
    div.style.display = 'flex';
    div.style.flexDirection = 'column';
    div.style.boxSizing = 'border-box';

    // Padding for margins (applied to the folio container)
    const marginPx = A4_CONSTANTS.MARGIN_LEFT * A4_CONSTANTS.MM_TO_PX;
    div.style.paddingLeft = `${marginPx}px`;
    div.style.paddingRight = `${marginPx}px`;

    return div;
  }

  override updateDOM(prevNode: FolioNode, dom: HTMLElement): boolean {
    // Update orientation if changed
    if (prevNode.__orientation !== this.__orientation) {
      console.log('[FolioNode] Orientation changed:', prevNode.__orientation, '->', this.__orientation);
      dom.setAttribute('data-folio-orientation', this.__orientation);
      const dimensions = this.getDimensions();

      // Force immediate style update
      dom.style.width = `${dimensions.width}px`;
      dom.style.height = `${dimensions.height}px`;
      dom.style.maxHeight = `${dimensions.height}px`;

      // Add transition class for smooth animation
      dom.classList.add('orientation-transition');

      // Force reflow to apply changes immediately
      void dom.offsetHeight;

      // Remove transition class after animation
      requestAnimationFrame(() => {
        setTimeout(() => {
          dom.classList.remove('orientation-transition');
        }, 300);
      });

      return false;
    }

    // Update index if changed
    if (prevNode.__folioIndex !== this.__folioIndex) {
      dom.setAttribute('data-folio-index', String(this.__folioIndex));
      return false;
    }

    // Update section ID if changed
    if (prevNode.__sectionId !== this.__sectionId) {
      if (this.__sectionId) {
        dom.setAttribute('data-folio-section-id', this.__sectionId);
      } else {
        dom.removeAttribute('data-folio-section-id');
      }
      return false;
    }

    return false;
  }

  /**
   * Get A4 dimensions based on orientation
   */
  getDimensions(): { width: number; height: number } {
    if (this.__orientation === 'landscape') {
      return {
        width: LANDSCAPE_CONSTANTS.WIDTH_PX,
        height: LANDSCAPE_CONSTANTS.HEIGHT_PX,
      };
    }
    return {
      width: A4_CONSTANTS.WIDTH_PX,
      height: A4_CONSTANTS.HEIGHT_PX,
    };
  }

  // Getters
  getFolioId(): string {
    return this.__folioId;
  }

  getFolioIndex(): number {
    return this.__folioIndex;
  }

  getOrientation(): FolioOrientation {
    return this.__orientation;
  }

  getSectionId(): string | null {
    return this.__sectionId;
  }

  // Setters
  setFolioId(folioId: string): void {
    const writable = this.getWritable();
    writable.__folioId = folioId;
  }

  setFolioIndex(folioIndex: number): void {
    const writable = this.getWritable();
    writable.__folioIndex = folioIndex;
  }

  setOrientation(orientation: FolioOrientation): void {
    const writable = this.getWritable();
    writable.__orientation = orientation;
  }

  setSectionId(sectionId: string | null): void {
    const writable = this.getWritable();
    writable.__sectionId = sectionId;
  }

  // ElementNode overrides
  override canBeEmpty(): boolean {
    return false;
  }

  override canIndent(): boolean {
    return false;
  }

  override isInline(): boolean {
    return false;
  }

  override isShadowRoot(): boolean {
    // FolioNode acts as a shadow root - selections don't escape it easily
    return false;
  }

  /**
   * Folios should not be extracted to root when merging
   */
  override extractWithChild(): boolean {
    return false;
  }
}

/**
 * Create a new FolioNode
 */
export function $createFolioNode({
  folioId,
  folioIndex,
  orientation = 'portrait',
  sectionId = null,
  key,
}: FolioPayload): FolioNode {
  const folioNode = new FolioNode(folioId, folioIndex, orientation, sectionId, key);
  // Initialize with empty paragraph if creating new
  return $applyNodeReplacement(folioNode);
}

/**
 * Create a FolioNode with initial content (paragraph)
 */
export function $createFolioNodeWithContent(payload: FolioPayload): FolioNode {
  const folioNode = $createFolioNode(payload);
  const paragraph = $createParagraphNode();
  folioNode.append(paragraph);
  return folioNode;
}

/**
 * Check if a node is a FolioNode
 */
export function $isFolioNode(
  node: LexicalNode | null | undefined
): node is FolioNode {
  return node instanceof FolioNode;
}

/**
 * Get all FolioNodes from the editor
 */
export function $getAllFolioNodes(root: ElementNode): FolioNode[] {
  const folioNodes: FolioNode[] = [];
  const children = root.getChildren();

  for (const child of children) {
    if ($isFolioNode(child)) {
      folioNodes.push(child);
    }
  }

  return folioNodes.sort((a, b) => a.getFolioIndex() - b.getFolioIndex());
}

/**
 * Get a FolioNode by its folioId
 */
export function $getFolioNodeById(root: ElementNode, folioId: string): FolioNode | null {
  const folioNodes = $getAllFolioNodes(root);
  return folioNodes.find((node) => node.getFolioId() === folioId) || null;
}

export default FolioNode;
