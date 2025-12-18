/**
 * FootnoteNode - Lexical node for footnote markers
 * Per Constitution Section 1 - General Features
 *
 * Renders as a superscript number in the document.
 */
import type {
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { DecoratorNode } from 'lexical';

/**
 * Serialized footnote node
 */
export type SerializedFootnoteNode = Spread<
  {
    footnoteId: string;
    footnoteNumber: number;
  },
  SerializedLexicalNode
>;

/**
 * FootnoteNode - Represents a footnote marker in the document
 */
export class FootnoteNode extends DecoratorNode<JSX.Element> {
  __footnoteId: string;
  __footnoteNumber: number;

  static override getType(): string {
    return 'footnote';
  }

  static override clone(node: FootnoteNode): FootnoteNode {
    return new FootnoteNode(
      node.__footnoteId,
      node.__footnoteNumber,
      node.__key
    );
  }

  constructor(
    footnoteId: string,
    footnoteNumber: number,
    key?: NodeKey
  ) {
    super(key);
    this.__footnoteId = footnoteId;
    this.__footnoteNumber = footnoteNumber;
  }

  // Getters
  getFootnoteId(): string {
    return this.__footnoteId;
  }

  getFootnoteNumber(): number {
    return this.__footnoteNumber;
  }

  // Setters
  setFootnoteNumber(number: number): void {
    const self = this.getWritable();
    self.__footnoteNumber = number;
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const sup = document.createElement('sup');
    sup.className = 'footnote-marker';
    sup.setAttribute('data-footnote-id', this.__footnoteId);
    sup.setAttribute('data-footnote-number', String(this.__footnoteNumber));
    return sup;
  }

  override updateDOM(
    prevNode: FootnoteNode,
    dom: HTMLElement,
    _config: EditorConfig
  ): boolean {
    if (prevNode.__footnoteNumber !== this.__footnoteNumber) {
      dom.setAttribute('data-footnote-number', String(this.__footnoteNumber));
      return true;
    }
    return false;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      sup: (node: Node) => {
        const element = node as HTMLElement;
        if (element.classList.contains('footnote-marker')) {
          return {
            conversion: (domNode: Node) => {
              const el = domNode as HTMLElement;
              const footnoteId = el.getAttribute('data-footnote-id') || '';
              const footnoteNumber = parseInt(
                el.getAttribute('data-footnote-number') || '1',
                10
              );
              return {
                node: new FootnoteNode(footnoteId, footnoteNumber),
              };
            },
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('sup');
    element.className = 'footnote-marker';
    element.setAttribute('data-footnote-id', this.__footnoteId);
    element.setAttribute('data-footnote-number', String(this.__footnoteNumber));
    element.textContent = String(this.__footnoteNumber);
    return { element };
  }

  static override importJSON(serializedNode: SerializedFootnoteNode): FootnoteNode {
    return new FootnoteNode(
      serializedNode.footnoteId,
      serializedNode.footnoteNumber
    );
  }

  override exportJSON(): SerializedFootnoteNode {
    return {
      type: 'footnote',
      version: 1,
      footnoteId: this.__footnoteId,
      footnoteNumber: this.__footnoteNumber,
    };
  }

  override decorate(): JSX.Element {
    return <FootnoteMarker footnoteId={this.__footnoteId} number={this.__footnoteNumber} />;
  }

  override isInline(): boolean {
    return true;
  }

  override isIsolated(): boolean {
    return false;
  }
}

/**
 * FootnoteMarker Component - Renders the footnote superscript
 */
interface FootnoteMarkerProps {
  footnoteId: string;
  number: number;
}

function FootnoteMarker({ footnoteId, number }: FootnoteMarkerProps): JSX.Element {
  const handleClick = () => {
    // Scroll to footnote content at bottom of page
    const footnoteContent = document.querySelector(
      `[data-footnote-content-id="${footnoteId}"]`
    );
    if (footnoteContent) {
      footnoteContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
      footnoteContent.classList.add('footnote-highlight');
      setTimeout(() => {
        footnoteContent.classList.remove('footnote-highlight');
      }, 2000);
    }
  };

  return (
    <span
      className="footnote-marker inline-flex items-baseline cursor-pointer hover:text-blue-600 transition-colors"
      data-footnote-id={footnoteId}
      onClick={handleClick}
      title={`Note ${number}`}
    >
      <sup className="text-blue-600 font-medium text-xs leading-none">
        {number}
      </sup>
    </span>
  );
}

/**
 * Helper to create a footnote node
 */
export function $createFootnoteNode(
  footnoteId: string,
  footnoteNumber: number
): FootnoteNode {
  return new FootnoteNode(footnoteId, footnoteNumber);
}

/**
 * Type guard for footnote node
 */
export function $isFootnoteNode(
  node: LexicalNode | null | undefined
): node is FootnoteNode {
  return node instanceof FootnoteNode;
}

export default FootnoteNode;
