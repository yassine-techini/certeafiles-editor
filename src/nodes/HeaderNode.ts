/**
 * HeaderNode - ElementNode for page header container
 * Per Constitution Section 4.2 - Headers and Footers
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
} from 'lexical';
import {
  $applyNodeReplacement,
  ElementNode,
} from 'lexical';
import { A4_CONSTANTS } from '../utils/a4-constants';
import { DEFAULT_HEADER_HEIGHT } from '../types/headerFooter';
import { CSS_CLASSES } from '../core/constants';

/**
 * Payload for creating a HeaderNode
 */
export interface HeaderPayload {
  folioId: string;
  contentId?: string | undefined;
  isDefault: boolean;
  height?: number | undefined; // in mm
  key?: NodeKey | undefined;
}

/**
 * Serialized HeaderNode structure
 */
export type SerializedHeaderNode = Spread<
  {
    folioId: string;
    contentId: string | null;
    isDefault: boolean;
    height: number;
  },
  SerializedElementNode
>;

/**
 * Convert DOM element to HeaderNode
 */
function $convertHeaderElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-header-folio-id')) {
    const folioId = domNode.getAttribute('data-header-folio-id') || '';
    const contentId = domNode.getAttribute('data-header-content-id') || null;
    const isDefault = domNode.getAttribute('data-header-is-default') === 'true';
    const height = parseFloat(domNode.getAttribute('data-header-height') || String(DEFAULT_HEADER_HEIGHT));

    const node = $createHeaderNode({
      folioId,
      contentId: contentId ?? undefined,
      isDefault,
      height,
    });
    return { node };
  }
  return null;
}

/**
 * HeaderNode - ElementNode that renders at the top of a folio
 */
export class HeaderNode extends ElementNode {
  __folioId: string;
  __contentId: string | null;
  __isDefault: boolean;
  __height: number; // in mm

  static override getType(): string {
    return 'header';
  }

  static override clone(node: HeaderNode): HeaderNode {
    return new HeaderNode(
      node.__folioId,
      node.__contentId,
      node.__isDefault,
      node.__height,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedHeaderNode): HeaderNode {
    const { folioId, contentId, isDefault, height } = serializedNode;
    const node = $createHeaderNode({
      folioId,
      contentId: contentId ?? undefined,
      isDefault,
      height,
    });
    return node;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      header: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-header-folio-id')) {
          return {
            conversion: $convertHeaderElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    folioId: string,
    contentId: string | null = null,
    isDefault: boolean = true,
    height: number = DEFAULT_HEADER_HEIGHT,
    key?: NodeKey
  ) {
    super(key);
    this.__folioId = folioId;
    this.__contentId = contentId;
    this.__isDefault = isDefault;
    this.__height = height;
  }

  override exportJSON(): SerializedHeaderNode {
    return {
      ...super.exportJSON(),
      type: 'header',
      version: 1,
      folioId: this.__folioId,
      contentId: this.__contentId,
      isDefault: this.__isDefault,
      height: this.__height,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('header');
    element.setAttribute('data-header-folio-id', this.__folioId);
    if (this.__contentId) {
      element.setAttribute('data-header-content-id', this.__contentId);
    }
    element.setAttribute('data-header-is-default', String(this.__isDefault));
    element.setAttribute('data-header-height', String(this.__height));
    element.className = 'folio-header';

    // Set dimensions
    const heightPx = this.__height * A4_CONSTANTS.MM_TO_PX;
    element.style.height = `${heightPx}px`;
    element.style.position = 'absolute';
    element.style.top = '0';
    element.style.left = '0';
    element.style.right = '0';

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const header = document.createElement('header');
    header.setAttribute('data-header-folio-id', this.__folioId);
    header.setAttribute('data-header-node', 'true');
    if (this.__contentId) {
      header.setAttribute('data-header-content-id', this.__contentId);
    }
    header.setAttribute('data-header-is-default', String(this.__isDefault));
    header.setAttribute('data-header-height', String(this.__height));

    // Base classes
    header.className = CSS_CLASSES.FOLIO_HEADER;

    // Apply theme class if available
    const theme = config.theme;
    if (theme.header) {
      header.className += ` ${theme.header}`;
    }

    // CRITICAL: Make header non-editable - it's a protected zone
    // Users must edit headers through the Header/Footer popup dialog
    header.contentEditable = 'false';
    header.style.userSelect = 'none';
    header.style.cursor = 'default';

    // Additional protection: prevent selection leaking into header
    header.setAttribute('data-lexical-non-selectable', 'true');
    header.addEventListener('mousedown', (e) => e.preventDefault());
    header.addEventListener('click', (e) => e.stopPropagation());

    // Set dimensions - Flexbox item at top
    const heightPx = this.__height * A4_CONSTANTS.MM_TO_PX;

    header.style.height = `${heightPx}px`;
    header.style.minHeight = `${heightPx}px`;
    header.style.flexShrink = '0';
    header.style.width = '100%';
    header.style.boxSizing = 'border-box';
    header.style.fontSize = '11px';
    header.style.color = '#374151';
    header.style.border = '1px solid #e5e7eb';
    header.style.borderBottom = '1px solid #d1d5db';
    header.style.backgroundColor = '#f9fafb';
    header.style.display = 'table';
    header.style.tableLayout = 'fixed';
    header.style.borderCollapse = 'collapse';

    return header;
  }

  override updateDOM(prevNode: HeaderNode, dom: HTMLElement): boolean {
    if (prevNode.__height !== this.__height) {
      const heightPx = this.__height * A4_CONSTANTS.MM_TO_PX;
      dom.style.height = `${heightPx}px`;
      dom.style.minHeight = `${heightPx}px`;
      dom.setAttribute('data-header-height', String(this.__height));
    }

    if (prevNode.__contentId !== this.__contentId) {
      if (this.__contentId) {
        dom.setAttribute('data-header-content-id', this.__contentId);
      } else {
        dom.removeAttribute('data-header-content-id');
      }
    }

    if (prevNode.__isDefault !== this.__isDefault) {
      dom.setAttribute('data-header-is-default', String(this.__isDefault));
    }

    return false;
  }

  // Getters
  getFolioId(): string {
    return this.__folioId;
  }

  getContentId(): string | null {
    return this.__contentId;
  }

  getIsDefault(): boolean {
    return this.__isDefault;
  }

  getHeight(): number {
    return this.__height;
  }

  // Setters
  setContentId(contentId: string | null): void {
    const writable = this.getWritable();
    writable.__contentId = contentId;
  }

  setIsDefault(isDefault: boolean): void {
    const writable = this.getWritable();
    writable.__isDefault = isDefault;
  }

  setHeight(height: number): void {
    const writable = this.getWritable();
    writable.__height = height;
  }

  // ElementNode overrides
  override canBeEmpty(): boolean {
    return true;
  }

  override isInline(): boolean {
    return false;
  }

  override canIndent(): boolean {
    return false;
  }

  // CRITICAL: Prevent selection/editing in header zone
  // Header is read-only and can only be edited via the Header/Footer dialog
  override canInsertTextBefore(): boolean {
    return false;
  }

  override canInsertTextAfter(): boolean {
    return false;
  }

  override excludeFromCopy(): boolean {
    return true;
  }

  /**
   * Always return false to indicate this node is not selected
   * This helps prevent user from selecting header content
   */
  override isSelected(): boolean {
    return false;
  }
}

/**
 * Create a new HeaderNode
 */
export function $createHeaderNode(payload: HeaderPayload): HeaderNode {
  const { folioId, contentId, isDefault, height, key } = payload;
  const node = new HeaderNode(
    folioId,
    contentId ?? null,
    isDefault ?? true,
    height ?? DEFAULT_HEADER_HEIGHT,
    key
  );

  // Note: No initial paragraph - HeaderFooterPlugin.updateNodeContent() manages content
  // This avoids contradictory editable paragraph inside non-editable zone

  return $applyNodeReplacement(node);
}

/**
 * Type guard for HeaderNode
 */
export function $isHeaderNode(node: LexicalNode | null | undefined): node is HeaderNode {
  return node instanceof HeaderNode;
}

/**
 * Get HeaderNode for a specific folio
 */
export function $getHeaderNodeForFolio(
  root: ElementNode,
  folioId: string
): HeaderNode | null {
  const children = root.getChildren();
  for (const child of children) {
    if ($isHeaderNode(child) && child.getFolioId() === folioId) {
      return child;
    }
    if (child instanceof ElementNode) {
      const found = $getHeaderNodeForFolio(child, folioId);
      if (found) return found;
    }
  }
  return null;
}

export default HeaderNode;
