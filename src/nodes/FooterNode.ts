/**
 * FooterNode - ElementNode for page footer container
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
import { DEFAULT_FOOTER_HEIGHT } from '../types/headerFooter';
import { CSS_CLASSES } from '../core/constants';

/**
 * Payload for creating a FooterNode
 */
export interface FooterPayload {
  folioId: string;
  contentId?: string | undefined;
  isDefault: boolean;
  height?: number | undefined; // in mm
  key?: NodeKey | undefined;
}

/**
 * Serialized FooterNode structure
 */
export type SerializedFooterNode = Spread<
  {
    folioId: string;
    contentId: string | null;
    isDefault: boolean;
    height: number;
  },
  SerializedElementNode
>;

/**
 * Convert DOM element to FooterNode
 */
function $convertFooterElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-footer-folio-id')) {
    const folioId = domNode.getAttribute('data-footer-folio-id') || '';
    const contentId = domNode.getAttribute('data-footer-content-id') || null;
    const isDefault = domNode.getAttribute('data-footer-is-default') === 'true';
    const height = parseFloat(domNode.getAttribute('data-footer-height') || String(DEFAULT_FOOTER_HEIGHT));

    const node = $createFooterNode({
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
 * FooterNode - ElementNode that renders at the bottom of a folio
 */
export class FooterNode extends ElementNode {
  __folioId: string;
  __contentId: string | null;
  __isDefault: boolean;
  __height: number; // in mm

  static override getType(): string {
    return 'footer';
  }

  static override clone(node: FooterNode): FooterNode {
    return new FooterNode(
      node.__folioId,
      node.__contentId,
      node.__isDefault,
      node.__height,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedFooterNode): FooterNode {
    const { folioId, contentId, isDefault, height } = serializedNode;
    const node = $createFooterNode({
      folioId,
      contentId: contentId ?? undefined,
      isDefault,
      height,
    });
    return node;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      footer: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-footer-folio-id')) {
          return {
            conversion: $convertFooterElement,
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
    height: number = DEFAULT_FOOTER_HEIGHT,
    key?: NodeKey
  ) {
    super(key);
    this.__folioId = folioId;
    this.__contentId = contentId;
    this.__isDefault = isDefault;
    this.__height = height;
  }

  override exportJSON(): SerializedFooterNode {
    return {
      ...super.exportJSON(),
      type: 'footer',
      version: 1,
      folioId: this.__folioId,
      contentId: this.__contentId,
      isDefault: this.__isDefault,
      height: this.__height,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('footer');
    element.setAttribute('data-footer-folio-id', this.__folioId);
    if (this.__contentId) {
      element.setAttribute('data-footer-content-id', this.__contentId);
    }
    element.setAttribute('data-footer-is-default', String(this.__isDefault));
    element.setAttribute('data-footer-height', String(this.__height));
    element.className = 'folio-footer';

    // Set dimensions
    const heightPx = this.__height * A4_CONSTANTS.MM_TO_PX;
    element.style.height = `${heightPx}px`;
    element.style.position = 'absolute';
    element.style.bottom = '0';
    element.style.left = '0';
    element.style.right = '0';

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const footer = document.createElement('footer');
    footer.setAttribute('data-footer-folio-id', this.__folioId);
    footer.setAttribute('data-footer-node', 'true');
    if (this.__contentId) {
      footer.setAttribute('data-footer-content-id', this.__contentId);
    }
    footer.setAttribute('data-footer-is-default', String(this.__isDefault));
    footer.setAttribute('data-footer-height', String(this.__height));

    // Base classes
    footer.className = CSS_CLASSES.FOLIO_FOOTER;

    // Apply theme class if available
    const theme = config.theme;
    if (theme.footer) {
      footer.className += ` ${theme.footer}`;
    }

    // CRITICAL: Make footer non-editable - it's a protected zone
    // Users must edit footers through the Header/Footer popup dialog
    footer.contentEditable = 'false';
    footer.style.userSelect = 'none';
    footer.style.cursor = 'default';

    // Additional protection: prevent selection leaking into footer
    footer.setAttribute('data-lexical-non-selectable', 'true');
    footer.addEventListener('mousedown', (e) => e.preventDefault());
    footer.addEventListener('click', (e) => e.stopPropagation());

    // Set dimensions - Flexbox item pushed to bottom with margin-top: auto
    const heightPx = this.__height * A4_CONSTANTS.MM_TO_PX;

    footer.style.marginTop = 'auto';
    footer.style.flexShrink = '0';
    footer.style.height = `${heightPx}px`;
    footer.style.minHeight = `${heightPx}px`;
    footer.style.width = '100%';
    footer.style.display = 'flex';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'center';
    footer.style.padding = '0 8px';
    footer.style.boxSizing = 'border-box';
    footer.style.fontSize = '10px';
    footer.style.color = '#6b7280';
    footer.style.borderTop = '1px solid #d1d5db';
    footer.style.backgroundColor = '#f9fafb';

    return footer;
  }

  override updateDOM(prevNode: FooterNode, dom: HTMLElement): boolean {
    if (prevNode.__height !== this.__height) {
      const heightPx = this.__height * A4_CONSTANTS.MM_TO_PX;
      dom.style.height = `${heightPx}px`;
      dom.style.minHeight = `${heightPx}px`;
      dom.setAttribute('data-footer-height', String(this.__height));
    }

    if (prevNode.__contentId !== this.__contentId) {
      if (this.__contentId) {
        dom.setAttribute('data-footer-content-id', this.__contentId);
      } else {
        dom.removeAttribute('data-footer-content-id');
      }
    }

    if (prevNode.__isDefault !== this.__isDefault) {
      dom.setAttribute('data-footer-is-default', String(this.__isDefault));
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

  // CRITICAL: Prevent selection/editing in footer zone
  // Footer is read-only and can only be edited via the Header/Footer dialog
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
   * This helps prevent user from selecting footer content
   */
  override isSelected(): boolean {
    return false;
  }
}

/**
 * Create a new FooterNode
 */
export function $createFooterNode(payload: FooterPayload): FooterNode {
  const { folioId, contentId, isDefault, height, key } = payload;
  const node = new FooterNode(
    folioId,
    contentId ?? null,
    isDefault ?? true,
    height ?? DEFAULT_FOOTER_HEIGHT,
    key
  );

  // Note: No initial paragraph - HeaderFooterPlugin.updateNodeContent() manages content
  // This avoids contradictory editable paragraph inside non-editable zone

  return $applyNodeReplacement(node);
}

/**
 * Type guard for FooterNode
 */
export function $isFooterNode(node: LexicalNode | null | undefined): node is FooterNode {
  return node instanceof FooterNode;
}

/**
 * Get FooterNode for a specific folio
 */
export function $getFooterNodeForFolio(
  root: ElementNode,
  folioId: string
): FooterNode | null {
  const children = root.getChildren();
  for (const child of children) {
    if ($isFooterNode(child) && child.getFolioId() === folioId) {
      return child;
    }
    if (child instanceof ElementNode) {
      const found = $getFooterNodeForFolio(child, folioId);
      if (found) return found;
    }
  }
  return null;
}

export default FooterNode;
