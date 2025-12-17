/**
 * InsertionNode - TextNode for tracked insertions
 * Per Constitution Section 6 - Track Changes
 */
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedTextNode,
  Spread,
} from 'lexical';
import { $applyNodeReplacement, TextNode, createCommand } from 'lexical';
import type { LexicalCommand } from 'lexical';
import { type RevisionAuthor, REVISION_COLORS } from '../types/revision';

/**
 * Command to insert an InsertionNode
 */
export const INSERT_INSERTION_COMMAND: LexicalCommand<InsertionNodePayload> = createCommand(
  'INSERT_INSERTION_COMMAND'
);

/**
 * Payload for creating an InsertionNode
 */
export interface InsertionNodePayload {
  text: string;
  revisionId: string;
  author: RevisionAuthor;
  timestamp?: number;
  key?: NodeKey;
}

/**
 * Serialized InsertionNode structure
 */
export type SerializedInsertionNode = Spread<
  {
    revisionId: string;
    author: RevisionAuthor;
    timestamp: number;
  },
  SerializedTextNode
>;

/**
 * Convert DOM element to InsertionNode
 */
function $convertInsertionElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-revision-id')) {
    const revisionId = domNode.getAttribute('data-revision-id') || '';
    const authorStr = domNode.getAttribute('data-revision-author');
    const author: RevisionAuthor = authorStr ? JSON.parse(authorStr) : { id: 'unknown', name: 'Unknown' };
    const timestamp = parseInt(domNode.getAttribute('data-revision-timestamp') || '0', 10);
    const text = domNode.textContent || '';

    const node = $createInsertionNode({ text, revisionId, author, timestamp });
    return { node };
  }
  return null;
}

/**
 * InsertionNode - TextNode that represents inserted text in track changes
 */
export class InsertionNode extends TextNode {
  __revisionId: string;
  __author: RevisionAuthor;
  __timestamp: number;

  static override getType(): string {
    return 'insertion';
  }

  static override clone(node: InsertionNode): InsertionNode {
    return new InsertionNode(
      node.__text,
      node.__revisionId,
      node.__author,
      node.__timestamp,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedInsertionNode): InsertionNode {
    const node = $createInsertionNode({
      text: serializedNode.text,
      revisionId: serializedNode.revisionId,
      author: serializedNode.author,
      timestamp: serializedNode.timestamp,
    });
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      ins: () => ({
        conversion: $convertInsertionElement,
        priority: 1,
      }),
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-revision-type') &&
            domNode.getAttribute('data-revision-type') === 'insertion') {
          return {
            conversion: $convertInsertionElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    text: string,
    revisionId: string,
    author: RevisionAuthor,
    timestamp: number = Date.now(),
    key?: NodeKey
  ) {
    super(text, key);
    this.__revisionId = revisionId;
    this.__author = author;
    this.__timestamp = timestamp;
  }

  override exportJSON(): SerializedInsertionNode {
    return {
      ...super.exportJSON(),
      type: 'insertion',
      revisionId: this.__revisionId,
      author: this.__author,
      timestamp: this.__timestamp,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('ins');
    element.setAttribute('data-revision-id', this.__revisionId);
    element.setAttribute('data-revision-type', 'insertion');
    element.setAttribute('data-revision-author', JSON.stringify(this.__author));
    element.setAttribute('data-revision-timestamp', String(this.__timestamp));
    element.textContent = this.__text;

    // Apply styles
    const colors = REVISION_COLORS.insertion;
    element.style.backgroundColor = colors.bg;
    element.style.color = colors.text;
    element.style.textDecoration = `underline ${colors.underline}`;
    element.style.textDecorationStyle = 'solid';

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);

    // Set revision attributes
    element.setAttribute('data-revision-id', this.__revisionId);
    element.setAttribute('data-revision-type', 'insertion');
    element.setAttribute('data-revision-author', JSON.stringify(this.__author));
    element.setAttribute('data-revision-timestamp', String(this.__timestamp));

    // Apply theme class
    const theme = config.theme;
    if (theme.insertion) {
      element.classList.add(theme.insertion);
    }
    element.classList.add('insertion-node');

    // Apply styles - blue highlight background and blue underline
    const colors = REVISION_COLORS.insertion;
    element.style.backgroundColor = colors.bg;
    element.style.color = colors.text;
    element.style.textDecoration = `underline`;
    element.style.textDecorationColor = colors.underline;
    element.style.textDecorationStyle = 'solid';
    element.style.textDecorationThickness = '2px';

    // Tooltip with author info
    element.title = `Inserted by ${this.__author.name} on ${new Date(this.__timestamp).toLocaleString('fr-FR')}`;

    return element;
  }

  override updateDOM(
    prevNode: InsertionNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const updated = super.updateDOM(prevNode, dom, config);

    // Update attributes if revision data changed
    if (prevNode.__revisionId !== this.__revisionId) {
      dom.setAttribute('data-revision-id', this.__revisionId);
    }
    if (JSON.stringify(prevNode.__author) !== JSON.stringify(this.__author)) {
      dom.setAttribute('data-revision-author', JSON.stringify(this.__author));
      dom.title = `Inserted by ${this.__author.name} on ${new Date(this.__timestamp).toLocaleString('fr-FR')}`;
    }

    return updated;
  }

  // Getters
  getRevisionId(): string {
    return this.__revisionId;
  }

  getAuthor(): RevisionAuthor {
    return this.__author;
  }

  getTimestamp(): number {
    return this.__timestamp;
  }
}


/**
 * Create a new InsertionNode
 */
export function $createInsertionNode(payload: InsertionNodePayload): InsertionNode {
  const { text, revisionId, author, timestamp, key } = payload;
  return $applyNodeReplacement(
    new InsertionNode(text, revisionId, author, timestamp ?? Date.now(), key)
  );
}

/**
 * Type guard for InsertionNode
 */
export function $isInsertionNode(
  node: LexicalNode | null | undefined
): node is InsertionNode {
  return node instanceof InsertionNode;
}

export default InsertionNode;
