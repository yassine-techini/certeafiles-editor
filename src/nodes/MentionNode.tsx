/**
 * MentionNode - DecoratorNode for @mentions
 * Per Constitution Section 5 - Shortcuts & Commands
 */
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
import { $applyNodeReplacement, DecoratorNode, createCommand } from 'lexical';
import type { LexicalCommand } from 'lexical';
import { type MentionType, MENTION_COLORS } from '../types/mention';
import { MentionPill } from '../components/Shortcuts/MentionPill';

/**
 * Command to insert a mention
 */
export const INSERT_MENTION_COMMAND: LexicalCommand<MentionNodePayload> = createCommand(
  'INSERT_MENTION_COMMAND'
);

/**
 * Payload for creating a MentionNode
 */
export interface MentionNodePayload {
  mentionId: string;
  mentionType: MentionType;
  name: string;
  avatarUrl?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  key?: NodeKey;
}

/**
 * Serialized MentionNode structure
 */
export type SerializedMentionNode = Spread<
  {
    mentionId: string;
    mentionType: MentionType;
    name: string;
    avatarUrl?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
  },
  SerializedLexicalNode
>;

/**
 * Convert DOM element to MentionNode
 */
function $convertMentionElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-mention-id')) {
    const mentionId = domNode.getAttribute('data-mention-id') || '';
    const mentionType = (domNode.getAttribute('data-mention-type') || 'user') as MentionType;
    const name = domNode.getAttribute('data-mention-name') || '';
    const avatarUrl = domNode.getAttribute('data-mention-avatar') || undefined;
    const metadataStr = domNode.getAttribute('data-mention-metadata');

    // Safely parse metadata with error handling
    let metadata: Record<string, unknown> = {};
    if (metadataStr) {
      try {
        metadata = JSON.parse(metadataStr);
      } catch {
        // Invalid JSON, use empty metadata
        metadata = {};
      }
    }

    const node = $createMentionNode({
      mentionId,
      mentionType,
      name,
      avatarUrl,
      metadata,
    });
    return { node };
  }
  return null;
}

/**
 * MentionNode - DecoratorNode that renders mention pills
 */
export class MentionNode extends DecoratorNode<JSX.Element> {
  __mentionId: string;
  __mentionType: MentionType;
  __name: string;
  __avatarUrl: string | undefined;
  __metadata: Record<string, unknown>;

  static override getType(): string {
    return 'mention';
  }

  static override clone(node: MentionNode): MentionNode {
    return new MentionNode(
      node.__mentionId,
      node.__mentionType,
      node.__name,
      node.__avatarUrl,
      node.__metadata,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedMentionNode): MentionNode {
    const { mentionId, mentionType, name, avatarUrl, metadata } = serializedNode;
    return $createMentionNode({ mentionId, mentionType, name, avatarUrl, metadata });
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-mention-id')) {
          return {
            conversion: $convertMentionElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    mentionId: string,
    mentionType: MentionType,
    name: string,
    avatarUrl: string | undefined = undefined,
    metadata: Record<string, unknown> = {},
    key?: NodeKey
  ) {
    super(key);
    this.__mentionId = mentionId;
    this.__mentionType = mentionType;
    this.__name = name;
    this.__avatarUrl = avatarUrl;
    this.__metadata = metadata;
  }

  override exportJSON(): SerializedMentionNode {
    return {
      type: 'mention',
      version: 1,
      mentionId: this.__mentionId,
      mentionType: this.__mentionType,
      name: this.__name,
      avatarUrl: this.__avatarUrl,
      metadata: this.__metadata,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-mention-id', this.__mentionId);
    element.setAttribute('data-mention-type', this.__mentionType);
    element.setAttribute('data-mention-name', this.__name);
    if (this.__avatarUrl) {
      element.setAttribute('data-mention-avatar', this.__avatarUrl);
    }
    if (Object.keys(this.__metadata).length > 0) {
      element.setAttribute('data-mention-metadata', JSON.stringify(this.__metadata));
    }
    element.className = 'mention-pill';

    const colors = MENTION_COLORS[this.__mentionType];
    element.style.backgroundColor = colors.bg;
    element.style.borderColor = colors.border;
    element.style.color = colors.text;
    element.textContent = `@${this.__name}`;

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.setAttribute('data-mention-id', this.__mentionId);
    span.setAttribute('data-mention-type', this.__mentionType);
    span.setAttribute('data-mention-name', this.__name);

    // Base classes
    span.className = 'mention-node';

    // Apply theme class if available
    const theme = config.theme;
    if (theme.mention) {
      span.className += ` ${theme.mention}`;
    }

    // Apply type-specific class
    span.className += ` mention-${this.__mentionType}`;

    // Make it non-editable
    span.contentEditable = 'false';

    // Style
    const colors = MENTION_COLORS[this.__mentionType];
    span.style.backgroundColor = colors.bg;
    span.style.border = `1px solid ${colors.border}`;
    span.style.color = colors.text;
    span.style.borderRadius = '12px';
    span.style.padding = '2px 6px';
    span.style.fontSize = '12px';
    span.style.fontWeight = '500';
    span.style.userSelect = 'none';
    span.style.cursor = 'pointer';
    span.style.display = 'inline-block';
    span.style.verticalAlign = 'baseline';

    return span;
  }

  override updateDOM(prevNode: MentionNode, dom: HTMLElement): boolean {
    if (
      prevNode.__mentionId !== this.__mentionId ||
      prevNode.__mentionType !== this.__mentionType ||
      prevNode.__name !== this.__name
    ) {
      dom.setAttribute('data-mention-id', this.__mentionId);
      dom.setAttribute('data-mention-type', this.__mentionType);
      dom.setAttribute('data-mention-name', this.__name);

      const colors = MENTION_COLORS[this.__mentionType];
      dom.style.backgroundColor = colors.bg;
      dom.style.borderColor = colors.border;
      dom.style.color = colors.text;
    }
    return false;
  }

  // Getters
  getMentionId(): string {
    return this.__mentionId;
  }

  getMentionType(): MentionType {
    return this.__mentionType;
  }

  getName(): string {
    return this.__name;
  }

  getAvatarUrl(): string | undefined {
    return this.__avatarUrl;
  }

  getMetadata(): Record<string, unknown> {
    return this.__metadata;
  }

  // Override text content for copy/paste
  override getTextContent(): string {
    return `@${this.__name}`;
  }

  override isInline(): boolean {
    return true;
  }

  /**
   * Render the mention as a React component (MentionPill)
   */
  override decorate(): JSX.Element {
    return (
      <MentionPill
        nodeKey={this.__key}
        mentionId={this.__mentionId}
        mentionType={this.__mentionType}
        name={this.__name}
        avatarUrl={this.__avatarUrl}
        metadata={this.__metadata}
      />
    );
  }
}

/**
 * Create a new MentionNode
 */
export function $createMentionNode(payload: MentionNodePayload): MentionNode {
  const { mentionId, mentionType, name, avatarUrl, metadata, key } = payload;
  return $applyNodeReplacement(
    new MentionNode(mentionId, mentionType, name, avatarUrl, metadata ?? {}, key)
  );
}

/**
 * Type guard for MentionNode
 */
export function $isMentionNode(
  node: LexicalNode | null | undefined
): node is MentionNode {
  return node instanceof MentionNode;
}

export default MentionNode;
