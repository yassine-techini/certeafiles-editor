/**
 * DeletionNode - TextNode for tracked deletions
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
 * Command to insert a DeletionNode
 */
export const INSERT_DELETION_COMMAND: LexicalCommand<DeletionNodePayload> = createCommand(
  'INSERT_DELETION_COMMAND'
);

/**
 * Payload for creating a DeletionNode
 */
export interface DeletionNodePayload {
  text: string;
  revisionId: string;
  author: RevisionAuthor;
  timestamp?: number;
  key?: NodeKey;
}

/**
 * Serialized DeletionNode structure
 */
export type SerializedDeletionNode = Spread<
  {
    revisionId: string;
    author: RevisionAuthor;
    timestamp: number;
  },
  SerializedTextNode
>;

/**
 * Convert DOM element to DeletionNode
 */
function $convertDeletionElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-revision-id')) {
    const revisionId = domNode.getAttribute('data-revision-id') || '';
    const authorStr = domNode.getAttribute('data-revision-author');
    const author: RevisionAuthor = authorStr ? JSON.parse(authorStr) : { id: 'unknown', name: 'Unknown' };
    const timestamp = parseInt(domNode.getAttribute('data-revision-timestamp') || '0', 10);
    const text = domNode.textContent || '';

    const node = $createDeletionNode({ text, revisionId, author, timestamp });
    return { node };
  }
  return null;
}

/**
 * DeletionNode - TextNode that represents deleted text in track changes
 */
export class DeletionNode extends TextNode {
  __revisionId: string;
  __author: RevisionAuthor;
  __timestamp: number;

  static override getType(): string {
    return 'deletion';
  }

  static override clone(node: DeletionNode): DeletionNode {
    return new DeletionNode(
      node.__text,
      node.__revisionId,
      node.__author,
      node.__timestamp,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedDeletionNode): DeletionNode {
    const node = $createDeletionNode({
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
      del: () => ({
        conversion: $convertDeletionElement,
        priority: 1,
      }),
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-revision-type') &&
            domNode.getAttribute('data-revision-type') === 'deletion') {
          return {
            conversion: $convertDeletionElement,
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

  override exportJSON(): SerializedDeletionNode {
    return {
      ...super.exportJSON(),
      type: 'deletion',
      revisionId: this.__revisionId,
      author: this.__author,
      timestamp: this.__timestamp,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('del');
    element.setAttribute('data-revision-id', this.__revisionId);
    element.setAttribute('data-revision-type', 'deletion');
    element.setAttribute('data-revision-author', JSON.stringify(this.__author));
    element.setAttribute('data-revision-timestamp', String(this.__timestamp));
    element.textContent = this.__text;

    // Apply styles - blue strikethrough
    const colors = REVISION_COLORS.deletion;
    element.style.color = colors.text;
    element.style.textDecoration = `line-through`;
    element.style.textDecorationColor = colors.strikethrough;

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);

    // Set revision attributes
    element.setAttribute('data-revision-id', this.__revisionId);
    element.setAttribute('data-revision-type', 'deletion');
    element.setAttribute('data-revision-author', JSON.stringify(this.__author));
    element.setAttribute('data-revision-timestamp', String(this.__timestamp));

    // Apply theme class
    const theme = config.theme;
    if (theme.deletion) {
      element.classList.add(theme.deletion);
    }
    element.classList.add('deletion-node');

    // Apply styles - blue strikethrough
    const colors = REVISION_COLORS.deletion;
    element.style.color = colors.text;
    element.style.textDecoration = 'line-through';
    element.style.textDecorationColor = colors.strikethrough;
    element.style.textDecorationStyle = 'solid';
    element.style.textDecorationThickness = '2px';
    element.style.opacity = '0.7';

    // Tooltip with author info
    element.title = `Deleted by ${this.__author.name} on ${new Date(this.__timestamp).toLocaleString('fr-FR')}`;

    return element;
  }

  override updateDOM(
    prevNode: DeletionNode,
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
      dom.title = `Deleted by ${this.__author.name} on ${new Date(this.__timestamp).toLocaleString('fr-FR')}`;
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

  /**
   * Deletion nodes should not be editable directly
   */
  override isSimpleText(): boolean {
    return false;
  }
}

/**
 * Create a new DeletionNode
 */
export function $createDeletionNode(payload: DeletionNodePayload): DeletionNode {
  const { text, revisionId, author, timestamp, key } = payload;
  return $applyNodeReplacement(
    new DeletionNode(text, revisionId, author, timestamp ?? Date.now(), key)
  );
}

/**
 * Type guard for DeletionNode
 */
export function $isDeletionNode(
  node: LexicalNode | null | undefined
): node is DeletionNode {
  return node instanceof DeletionNode;
}

export default DeletionNode;
