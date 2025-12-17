/**
 * PageNumberNode - DecoratorNode for dynamic page numbers
 * Per Constitution Section 4.2 - Headers and Footers
 */
import { useEffect, useState } from 'react';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, $getNodeByKey, DecoratorNode } from 'lexical';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

/**
 * Page number format types
 */
export type PageNumberFormat = 'page' | 'page_of_total' | 'total' | 'roman' | 'alpha';

/**
 * Payload for creating a PageNumberNode
 */
export interface PageNumberPayload {
  format?: PageNumberFormat;
  prefix?: string;
  suffix?: string;
  key?: NodeKey;
}

/**
 * Serialized PageNumberNode structure
 */
export type SerializedPageNumberNode = Spread<
  {
    format: PageNumberFormat;
    prefix: string;
    suffix: string;
  },
  SerializedLexicalNode
>;

/**
 * Convert number to Roman numerals
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

/**
 * Convert number to alphabetic (A, B, C, ..., Z, AA, AB, ...)
 */
function toAlpha(num: number): string {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

/**
 * Convert DOM element to PageNumberNode
 */
function $convertPageNumberElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-page-number-format')) {
    const format = (domNode.getAttribute('data-page-number-format') || 'page') as PageNumberFormat;
    const prefix = domNode.getAttribute('data-page-number-prefix') || '';
    const suffix = domNode.getAttribute('data-page-number-suffix') || '';

    const node = $createPageNumberNode({ format, prefix, suffix });
    return { node };
  }
  return null;
}

/**
 * PageNumberNode - DecoratorNode that renders dynamic page numbers
 */
export class PageNumberNode extends DecoratorNode<JSX.Element> {
  __format: PageNumberFormat;
  __prefix: string;
  __suffix: string;

  static override getType(): string {
    return 'page-number';
  }

  static override clone(node: PageNumberNode): PageNumberNode {
    return new PageNumberNode(
      node.__format,
      node.__prefix,
      node.__suffix,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedPageNumberNode): PageNumberNode {
    const { format, prefix, suffix } = serializedNode;
    return $createPageNumberNode({ format, prefix, suffix });
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-page-number-format')) {
          return {
            conversion: $convertPageNumberElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    format: PageNumberFormat = 'page',
    prefix: string = '',
    suffix: string = '',
    key?: NodeKey
  ) {
    super(key);
    this.__format = format;
    this.__prefix = prefix;
    this.__suffix = suffix;
  }

  override exportJSON(): SerializedPageNumberNode {
    return {
      type: 'page-number',
      version: 1,
      format: this.__format,
      prefix: this.__prefix,
      suffix: this.__suffix,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-page-number-format', this.__format);
    element.setAttribute('data-page-number-prefix', this.__prefix);
    element.setAttribute('data-page-number-suffix', this.__suffix);
    element.className = 'page-number';
    element.textContent = this.getDisplayText(1, 1); // Placeholder for export
    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.setAttribute('data-page-number-format', this.__format);
    span.setAttribute('data-page-number-prefix', this.__prefix);
    span.setAttribute('data-page-number-suffix', this.__suffix);

    // Base classes
    span.className = 'page-number';

    // Apply theme class if available
    const theme = config.theme;
    if (theme.pageNumber) {
      span.className += ` ${theme.pageNumber}`;
    }

    // Style
    span.style.fontFamily = 'inherit';
    span.style.fontSize = 'inherit';
    span.style.color = 'inherit';

    return span;
  }

  override updateDOM(prevNode: PageNumberNode, dom: HTMLElement): boolean {
    if (
      prevNode.__format !== this.__format ||
      prevNode.__prefix !== this.__prefix ||
      prevNode.__suffix !== this.__suffix
    ) {
      dom.setAttribute('data-page-number-format', this.__format);
      dom.setAttribute('data-page-number-prefix', this.__prefix);
      dom.setAttribute('data-page-number-suffix', this.__suffix);
    }
    return false;
  }

  /**
   * Get formatted page number text
   */
  getDisplayText(pageNumber: number, totalPages: number): string {
    let pageText: string;
    let totalText: string;

    switch (this.__format) {
      case 'roman':
        pageText = toRoman(pageNumber);
        totalText = toRoman(totalPages);
        break;
      case 'alpha':
        pageText = toAlpha(pageNumber);
        totalText = toAlpha(totalPages);
        break;
      default:
        pageText = String(pageNumber);
        totalText = String(totalPages);
    }

    let result: string;
    switch (this.__format) {
      case 'page_of_total':
        result = `${pageText} of ${totalText}`;
        break;
      case 'total':
        result = totalText;
        break;
      default:
        result = pageText;
    }

    return `${this.__prefix}${result}${this.__suffix}`;
  }

  // Getters
  getFormat(): PageNumberFormat {
    return this.__format;
  }

  getPrefix(): string {
    return this.__prefix;
  }

  getSuffix(): string {
    return this.__suffix;
  }

  // Setters
  setFormat(format: PageNumberFormat): void {
    const writable = this.getWritable();
    writable.__format = format;
  }

  setPrefix(prefix: string): void {
    const writable = this.getWritable();
    writable.__prefix = prefix;
  }

  setSuffix(suffix: string): void {
    const writable = this.getWritable();
    writable.__suffix = suffix;
  }

  override isInline(): boolean {
    return true;
  }

  /**
   * Render the page number as a React component
   */
  override decorate(): JSX.Element {
    // This will be rendered by the PageNumberComponent
    return <PageNumberComponent nodeKey={this.__key} />;
  }
}

/**
 * React component for rendering page numbers
 */
interface PageNumberComponentProps {
  nodeKey: NodeKey;
}

function PageNumberComponent({ nodeKey }: PageNumberComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [displayText, setDisplayText] = useState('1');

  useEffect(() => {
    // Get the page number based on the folio position
    const updatePageNumber = () => {
      editor.getEditorState().read(() => {
        const node = $getNodeByKey(nodeKey);
        if (!$isPageNumberNode(node)) return;

        // Find the folio this node is in
        let parent = node.getParent();
        let folioIndex = 0;

        while (parent) {
          const parentElement = editor.getElementByKey(parent.getKey());
          if (parentElement?.hasAttribute('data-folio-id')) {
            folioIndex = parseInt(
              parentElement.getAttribute('data-folio-index') || '0',
              10
            );
            break;
          }
          parent = parent.getParent();
        }

        // Count total folios
        const folioElements = document.querySelectorAll('[data-folio-id]');
        const total = folioElements.length;

        setDisplayText(node.getDisplayText(folioIndex + 1, total || 1));
      });
    };

    updatePageNumber();

    // Update on editor changes
    return editor.registerUpdateListener(() => {
      updatePageNumber();
    });
  }, [editor, nodeKey]);

  return (
    <span
      className={`page-number-component ${isSelected ? 'selected' : ''}`}
      style={{
        backgroundColor: isSelected ? '#e0e7ff' : 'transparent',
        borderRadius: '2px',
        padding: '0 2px',
        cursor: 'default',
      }}
      onClick={() => {
        clearSelection();
        setSelected(true);
      }}
    >
      {displayText}
    </span>
  );
}

/**
 * Create a new PageNumberNode
 */
export function $createPageNumberNode(payload: PageNumberPayload = {}): PageNumberNode {
  const { format, prefix, suffix, key } = payload;
  return $applyNodeReplacement(
    new PageNumberNode(format ?? 'page', prefix ?? '', suffix ?? '', key)
  );
}

/**
 * Type guard for PageNumberNode
 */
export function $isPageNumberNode(
  node: LexicalNode | null | undefined
): node is PageNumberNode {
  return node instanceof PageNumberNode;
}

export default PageNumberNode;
