/**
 * CommentNode - TextNode wrapper that links text to a comment thread
 * Per Constitution Section 6 - Comments & Collaboration
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
import { $applyNodeReplacement, TextNode } from 'lexical';
import {
  type CommentType,
  COMMENT_TYPE_COLORS,
} from '../types/comment';

/**
 * Payload for creating a CommentNode
 */
export interface CommentNodePayload {
  text: string;
  threadId: string;
  commentType?: CommentType;
  key?: NodeKey;
}

/**
 * Serialized CommentNode structure
 */
export type SerializedCommentNode = Spread<
  {
    threadId: string;
    commentType: CommentType;
  },
  SerializedTextNode
>;

/**
 * Convert DOM element to CommentNode
 */
function $convertCommentElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-comment-thread-id')) {
    const threadId = domNode.getAttribute('data-comment-thread-id') || '';
    const commentType = (domNode.getAttribute('data-comment-type') || 'remark') as CommentType;
    const text = domNode.textContent || '';

    const node = $createCommentNode(text, threadId, commentType);
    return { node };
  }
  return null;
}

/**
 * CommentNode - TextNode that links to a comment thread
 */
export class CommentNode extends TextNode {
  __threadId: string;
  __commentType: CommentType;

  static override getType(): string {
    return 'comment';
  }

  static override clone(node: CommentNode): CommentNode {
    return new CommentNode(
      node.__text,
      node.__threadId,
      node.__commentType,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedCommentNode): CommentNode {
    const node = $createCommentNode(
      serializedNode.text,
      serializedNode.threadId,
      serializedNode.commentType
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-comment-thread-id')) {
          return {
            conversion: $convertCommentElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    text: string,
    threadId: string,
    commentType: CommentType = 'remark',
    key?: NodeKey
  ) {
    super(text, key);
    this.__threadId = threadId;
    this.__commentType = commentType;
  }

  override exportJSON(): SerializedCommentNode {
    return {
      ...super.exportJSON(),
      type: 'comment',
      threadId: this.__threadId,
      commentType: this.__commentType,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-comment-thread-id', this.__threadId);
    element.setAttribute('data-comment-type', this.__commentType);
    element.className = 'comment-highlight';
    element.textContent = this.__text;

    const colors = COMMENT_TYPE_COLORS[this.__commentType];
    element.style.backgroundColor = colors.bg;
    element.style.borderBottom = `2px solid ${colors.border}`;

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.setAttribute('data-comment-thread-id', this.__threadId);
    element.setAttribute('data-comment-type', this.__commentType);

    // Base classes
    element.className = 'comment-highlight';

    // Apply theme class if available
    const theme = config.theme;
    if (theme.comment) {
      element.className += ` ${theme.comment}`;
    }

    // Apply type-specific class
    element.className += ` comment-${this.__commentType}`;

    // Style - highlight background
    const colors = COMMENT_TYPE_COLORS[this.__commentType];
    element.style.backgroundColor = colors.bg;
    element.style.borderBottom = `2px solid ${colors.border}`;
    element.style.borderRadius = '2px';
    element.style.cursor = 'pointer';
    element.style.transition = 'background-color 0.15s ease';

    return element;
  }

  override updateDOM(
    prevNode: CommentNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    const isUpdated = super.updateDOM(prevNode, dom, config);

    if (
      prevNode.__threadId !== this.__threadId ||
      prevNode.__commentType !== this.__commentType
    ) {
      dom.setAttribute('data-comment-thread-id', this.__threadId);
      dom.setAttribute('data-comment-type', this.__commentType);

      const colors = COMMENT_TYPE_COLORS[this.__commentType];
      dom.style.backgroundColor = colors.bg;
      dom.style.borderBottomColor = colors.border;
    }

    return isUpdated;
  }

  // Getters
  getThreadId(): string {
    return this.__threadId;
  }

  getCommentType(): CommentType {
    return this.__commentType;
  }

  // Setters
  setThreadId(threadId: string): void {
    const writable = this.getWritable();
    writable.__threadId = threadId;
  }

  setCommentType(commentType: CommentType): void {
    const writable = this.getWritable();
    writable.__commentType = commentType;
  }

  override canInsertTextBefore(): boolean {
    return false;
  }

  override canInsertTextAfter(): boolean {
    return false;
  }

  override isTextEntity(): true {
    return true;
  }
}

/**
 * Create a new CommentNode
 */
export function $createCommentNode(
  text: string,
  threadId: string,
  commentType: CommentType = 'remark',
  key?: NodeKey
): CommentNode {
  return $applyNodeReplacement(
    new CommentNode(text, threadId, commentType, key)
  );
}

/**
 * Type guard for CommentNode
 */
export function $isCommentNode(
  node: LexicalNode | null | undefined
): node is CommentNode {
  return node instanceof CommentNode;
}

/**
 * Get all CommentNodes with a specific thread ID
 */
export function $getCommentNodesByThreadId(
  root: LexicalNode,
  threadId: string
): CommentNode[] {
  const nodes: CommentNode[] = [];

  const traverse = (node: LexicalNode) => {
    if ($isCommentNode(node) && node.getThreadId() === threadId) {
      nodes.push(node);
    }

    if ('getChildren' in node && typeof node.getChildren === 'function') {
      const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
      children.forEach(traverse);
    }
  };

  traverse(root);
  return nodes;
}

/**
 * Unwrap a CommentNode back to regular TextNode
 */
export function $unwrapCommentNode(node: CommentNode): TextNode {
  const textNode = new TextNode(node.__text);
  textNode.setFormat(node.getFormat());
  textNode.setDetail(node.getDetail());
  textNode.setMode(node.getMode());
  textNode.setStyle(node.getStyle());
  node.replace(textNode);
  return textNode;
}

export default CommentNode;
