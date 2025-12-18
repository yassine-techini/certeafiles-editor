/**
 * SlotNode - DecoratorNode for slot markers (dynamic variables)
 * Per Constitution Section 5 - Slots & Dynamic Variables
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
import { $applyNodeReplacement, DecoratorNode } from 'lexical';
import {
  type SlotType,
  type SlotRole,
  type SlotMetadata,
  SLOT_COLORS,
} from '../types/slot';
import { SlotMarker } from '../components/Slots/SlotMarker';

/**
 * Payload for creating a SlotNode
 */
export interface SlotNodePayload {
  slotId: string;
  slotType: SlotType;
  role: SlotRole;
  metadata?: SlotMetadata;
  key?: NodeKey;
}

/**
 * Serialized SlotNode structure
 */
export type SerializedSlotNode = Spread<
  {
    slotId: string;
    slotType: SlotType;
    role: SlotRole;
    metadata: SlotMetadata;
  },
  SerializedLexicalNode
>;

/**
 * Convert DOM element to SlotNode
 */
function $convertSlotElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-slot-id')) {
    const slotId = domNode.getAttribute('data-slot-id') || '';
    const slotType = (domNode.getAttribute('data-slot-type') || 'dynamic_content') as SlotType;
    const role = (domNode.getAttribute('data-slot-role') || 'start') as SlotRole;
    const metadataStr = domNode.getAttribute('data-slot-metadata');
    const metadata: SlotMetadata = metadataStr ? JSON.parse(metadataStr) : {};

    const node = $createSlotNode({
      slotId,
      slotType,
      role,
      metadata,
    });
    return { node };
  }
  return null;
}

/**
 * SlotNode - DecoratorNode that renders slot markers
 */
export class SlotNode extends DecoratorNode<JSX.Element> {
  __slotId: string;
  __slotType: SlotType;
  __role: SlotRole;
  __metadata: SlotMetadata;

  static override getType(): string {
    return 'slot';
  }

  static override clone(node: SlotNode): SlotNode {
    return new SlotNode(
      node.__slotId,
      node.__slotType,
      node.__role,
      node.__metadata,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedSlotNode): SlotNode {
    const { slotId, slotType, role, metadata } = serializedNode;
    return $createSlotNode({ slotId, slotType, role, metadata });
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-slot-id')) {
          return {
            conversion: $convertSlotElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    slotId: string,
    slotType: SlotType,
    role: SlotRole,
    metadata: SlotMetadata = {},
    key?: NodeKey
  ) {
    super(key);
    this.__slotId = slotId;
    this.__slotType = slotType;
    this.__role = role;
    this.__metadata = metadata;
  }

  override exportJSON(): SerializedSlotNode {
    return {
      type: 'slot',
      version: 1,
      slotId: this.__slotId,
      slotType: this.__slotType,
      role: this.__role,
      metadata: this.__metadata,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-slot-id', this.__slotId);
    element.setAttribute('data-slot-type', this.__slotType);
    element.setAttribute('data-slot-role', this.__role);
    element.setAttribute('data-slot-metadata', JSON.stringify(this.__metadata));
    element.className = 'slot-marker';

    const colors = SLOT_COLORS[this.__slotType];
    element.style.backgroundColor = colors.bg;
    element.style.borderColor = colors.border;
    element.style.color = colors.text;

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.setAttribute('data-slot-id', this.__slotId);
    span.setAttribute('data-slot-type', this.__slotType);
    span.setAttribute('data-slot-role', this.__role);

    // Base classes
    span.className = 'slot-marker';

    // Apply theme class if available
    const theme = config.theme;
    if (theme.slot) {
      span.className += ` ${theme.slot}`;
    }

    // Apply type-specific class
    span.className += ` slot-${this.__slotType}`;
    span.className += ` slot-role-${this.__role}`;

    // Make it non-editable
    span.contentEditable = 'false';

    // Style
    const colors = SLOT_COLORS[this.__slotType];
    span.style.backgroundColor = colors.bg;
    span.style.border = `1px solid ${colors.border}`;
    span.style.color = colors.text;
    span.style.borderRadius = '3px';
    span.style.padding = '1px 4px';
    span.style.fontSize = '11px';
    span.style.fontWeight = '500';
    span.style.fontFamily = 'monospace';
    span.style.userSelect = 'none';
    span.style.cursor = 'pointer';
    span.style.display = 'inline-block';
    span.style.verticalAlign = 'baseline';

    return span;
  }

  override updateDOM(prevNode: SlotNode, dom: HTMLElement): boolean {
    if (
      prevNode.__slotId !== this.__slotId ||
      prevNode.__slotType !== this.__slotType ||
      prevNode.__role !== this.__role
    ) {
      dom.setAttribute('data-slot-id', this.__slotId);
      dom.setAttribute('data-slot-type', this.__slotType);
      dom.setAttribute('data-slot-role', this.__role);

      const colors = SLOT_COLORS[this.__slotType];
      dom.style.backgroundColor = colors.bg;
      dom.style.borderColor = colors.border;
      dom.style.color = colors.text;
    }
    return false;
  }

  // Getters
  getSlotId(): string {
    return this.__slotId;
  }

  getSlotType(): SlotType {
    return this.__slotType;
  }

  getRole(): SlotRole {
    return this.__role;
  }

  getMetadata(): SlotMetadata {
    return this.__metadata;
  }

  // Setters
  setMetadata(metadata: SlotMetadata): void {
    const writable = this.getWritable();
    writable.__metadata = metadata;
  }

  updateMetadata(updates: Partial<SlotMetadata>): void {
    const writable = this.getWritable();
    writable.__metadata = {
      ...writable.__metadata,
      ...updates,
    };
  }

  override isInline(): boolean {
    return true;
  }

  /**
   * Render the slot marker as a React component
   */
  override decorate(): JSX.Element {
    return (
      <SlotMarker
        nodeKey={this.__key}
        slotId={this.__slotId}
        slotType={this.__slotType}
        role={this.__role}
        metadata={this.__metadata}
      />
    );
  }
}

/**
 * Create a new SlotNode
 */
export function $createSlotNode(payload: SlotNodePayload): SlotNode {
  const { slotId, slotType, role, metadata, key } = payload;
  return $applyNodeReplacement(
    new SlotNode(slotId, slotType, role, metadata ?? {}, key)
  );
}

/**
 * Type guard for SlotNode
 */
export function $isSlotNode(
  node: LexicalNode | null | undefined
): node is SlotNode {
  return node instanceof SlotNode;
}

/**
 * Get all SlotNodes with a specific slot ID
 */
export function $getSlotNodesById(
  root: LexicalNode,
  slotId: string
): { start?: SlotNode; end?: SlotNode } {
  const result: { start?: SlotNode; end?: SlotNode } = {};

  const traverse = (node: LexicalNode) => {
    if ($isSlotNode(node) && node.getSlotId() === slotId) {
      if (node.getRole() === 'start') {
        result.start = node;
      } else {
        result.end = node;
      }
    }

    if ('getChildren' in node && typeof node.getChildren === 'function') {
      const children = (node as { getChildren: () => LexicalNode[] }).getChildren();
      children.forEach(traverse);
    }
  };

  traverse(root);
  return result;
}

export default SlotNode;
