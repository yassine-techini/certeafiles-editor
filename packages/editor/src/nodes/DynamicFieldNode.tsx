/**
 * DynamicFieldNode - DecoratorNode for dynamic fields
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useEffect, useState, useCallback } from 'react';
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
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  type DynamicFieldType,
  type DynamicFieldConfig,
  DYNAMIC_FIELD_COLORS,
  DYNAMIC_FIELD_LABELS,
} from '../types/dynamicField';

/**
 * Command to insert a dynamic field
 */
export const INSERT_DYNAMIC_FIELD_COMMAND: LexicalCommand<DynamicFieldNodePayload> = createCommand(
  'INSERT_DYNAMIC_FIELD_COMMAND'
);

/**
 * Payload for creating a DynamicFieldNode
 */
export interface DynamicFieldNodePayload {
  fieldType: DynamicFieldType;
  config?: DynamicFieldConfig | undefined;
  key?: NodeKey;
}

/**
 * Serialized DynamicFieldNode structure
 */
export type SerializedDynamicFieldNode = Spread<
  {
    fieldType: DynamicFieldType;
    config: DynamicFieldConfig;
  },
  SerializedLexicalNode
>;

/**
 * Convert DOM element to DynamicFieldNode
 */
function $convertDynamicFieldElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLElement && domNode.hasAttribute('data-dynamic-field-type')) {
    const fieldType = domNode.getAttribute('data-dynamic-field-type') as DynamicFieldType;
    const configStr = domNode.getAttribute('data-dynamic-field-config');
    const config: DynamicFieldConfig = configStr ? JSON.parse(configStr) : {};

    const node = $createDynamicFieldNode({ fieldType, config });
    return { node };
  }
  return null;
}

/**
 * DynamicFieldNode - DecoratorNode that renders dynamic field values
 */
export class DynamicFieldNode extends DecoratorNode<JSX.Element> {
  __fieldType: DynamicFieldType;
  __config: DynamicFieldConfig;

  static override getType(): string {
    return 'dynamic-field';
  }

  static override clone(node: DynamicFieldNode): DynamicFieldNode {
    return new DynamicFieldNode(
      node.__fieldType,
      node.__config,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedDynamicFieldNode): DynamicFieldNode {
    const { fieldType, config } = serializedNode;
    return $createDynamicFieldNode({ fieldType, config });
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.hasAttribute('data-dynamic-field-type')) {
          return {
            conversion: $convertDynamicFieldElement,
            priority: 1,
          };
        }
        return null;
      },
    };
  }

  constructor(
    fieldType: DynamicFieldType,
    config: DynamicFieldConfig = {},
    key?: NodeKey
  ) {
    super(key);
    this.__fieldType = fieldType;
    this.__config = config;
  }

  override exportJSON(): SerializedDynamicFieldNode {
    return {
      type: 'dynamic-field',
      version: 1,
      fieldType: this.__fieldType,
      config: this.__config,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('span');
    element.setAttribute('data-dynamic-field-type', this.__fieldType);
    element.setAttribute('data-dynamic-field-config', JSON.stringify(this.__config));
    element.className = 'dynamic-field';

    const colors = DYNAMIC_FIELD_COLORS[this.__fieldType];
    element.style.backgroundColor = colors.bg;
    element.style.borderColor = colors.border;
    element.style.color = colors.text;
    element.textContent = this.getPlaceholderText();

    return { element };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span');
    span.setAttribute('data-dynamic-field-type', this.__fieldType);
    span.setAttribute('data-dynamic-field-config', JSON.stringify(this.__config));

    // Base classes
    span.className = 'dynamic-field';

    // Apply theme class if available
    const theme = config.theme;
    if (theme.dynamicField) {
      span.className += ` ${theme.dynamicField}`;
    }

    // Apply type-specific class
    span.className += ` dynamic-field-${this.__fieldType}`;

    // Make it non-editable
    span.contentEditable = 'false';

    return span;
  }

  override updateDOM(prevNode: DynamicFieldNode, dom: HTMLElement): boolean {
    if (
      prevNode.__fieldType !== this.__fieldType ||
      JSON.stringify(prevNode.__config) !== JSON.stringify(this.__config)
    ) {
      dom.setAttribute('data-dynamic-field-type', this.__fieldType);
      dom.setAttribute('data-dynamic-field-config', JSON.stringify(this.__config));
    }
    return false;
  }

  /**
   * Get placeholder text for the field type
   */
  getPlaceholderText(): string {
    const prefix = this.__config.prefix || '';
    const suffix = this.__config.suffix || '';

    switch (this.__fieldType) {
      case 'page_number':
        return `${prefix}1${suffix}`;
      case 'total_pages':
        return `${prefix}10${suffix}`;
      case 'page_of_total':
        return `${prefix}1 sur 10${suffix}`;
      case 'date':
        return `${prefix}17/12/2025${suffix}`;
      case 'time':
        return `${prefix}14:30${suffix}`;
      case 'datetime':
        return `${prefix}17/12/2025 14:30${suffix}`;
      case 'version':
        return `${prefix}1.0${suffix}`;
      case 'title':
        return `${prefix}Document sans titre${suffix}`;
      case 'author':
        return `${prefix}Auteur${suffix}`;
      case 'filename':
        return `${prefix}document.pdf${suffix}`;
      case 'last_modified':
        return `${prefix}17/12/2025${suffix}`;
      case 'logo':
        return '[Logo]';
      default:
        return `[${DYNAMIC_FIELD_LABELS[this.__fieldType]}]`;
    }
  }

  // Getters
  getFieldType(): DynamicFieldType {
    return this.__fieldType;
  }

  getConfig(): DynamicFieldConfig {
    return this.__config;
  }

  // Setters
  setConfig(config: DynamicFieldConfig): void {
    const writable = this.getWritable();
    writable.__config = config;
  }

  updateConfig(updates: Partial<DynamicFieldConfig>): void {
    const writable = this.getWritable();
    writable.__config = { ...writable.__config, ...updates };
  }

  override isInline(): boolean {
    return true;
  }

  /**
   * Render the dynamic field as a React component
   */
  override decorate(): JSX.Element {
    return (
      <DynamicFieldComponent
        nodeKey={this.__key}
        fieldType={this.__fieldType}
        config={this.__config}
      />
    );
  }
}

/**
 * React component for rendering dynamic fields
 */
interface DynamicFieldComponentProps {
  nodeKey: NodeKey;
  fieldType: DynamicFieldType;
  config: DynamicFieldConfig;
}

function DynamicFieldComponent({
  nodeKey,
  fieldType,
  config,
}: DynamicFieldComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [displayValue, setDisplayValue] = useState<string>('');

  const colors = DYNAMIC_FIELD_COLORS[fieldType];

  /**
   * Format date based on config
   */
  const formatDate = useCallback((date: Date, format: string = 'short'): string => {
    const locale = 'fr-FR';
    switch (format) {
      case 'short':
        return date.toLocaleDateString(locale);
      case 'medium':
        return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
      case 'long':
        return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
      case 'iso':
        return date.toISOString().split('T')[0];
      default:
        return date.toLocaleDateString(locale);
    }
  }, []);

  /**
   * Format time based on config
   */
  const formatTime = useCallback((date: Date, format: string = '24h'): string => {
    const locale = 'fr-FR';
    switch (format) {
      case '12h':
        return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12: true });
      case 'full':
        return date.toLocaleTimeString(locale);
      default:
        return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }, []);

  /**
   * Format number based on config
   */
  const formatNumber = useCallback((num: number, format: string = 'arabic'): string => {
    switch (format) {
      case 'roman':
        return toRoman(num);
      case 'alpha':
        return toAlpha(num);
      default:
        return String(num);
    }
  }, []);

  /**
   * Calculate and update the display value
   */
  const updateDisplayValue = useCallback(() => {
    const prefix = config.prefix || '';
    const suffix = config.suffix || '';
    const now = new Date();

    let value = '';

    switch (fieldType) {
      case 'page_number': {
        // Find folio context
        const folioElement = findParentFolio(nodeKey, editor);
        const pageNum = folioElement
          ? parseInt(folioElement.getAttribute('data-folio-index') || '0', 10) + 1
          : 1;
        value = formatNumber(pageNum, config.numberFormat);
        break;
      }
      case 'total_pages': {
        const folioElements = document.querySelectorAll('[data-folio-id]');
        value = formatNumber(folioElements.length || 1, config.numberFormat);
        break;
      }
      case 'page_of_total': {
        const folioElement = findParentFolio(nodeKey, editor);
        const pageNum = folioElement
          ? parseInt(folioElement.getAttribute('data-folio-index') || '0', 10) + 1
          : 1;
        const folioElements = document.querySelectorAll('[data-folio-id]');
        const total = folioElements.length || 1;
        value = `${formatNumber(pageNum, config.numberFormat)} sur ${formatNumber(total, config.numberFormat)}`;
        break;
      }
      case 'date':
        value = formatDate(now, config.dateFormat);
        break;
      case 'time':
        value = formatTime(now, config.timeFormat);
        break;
      case 'datetime':
        value = `${formatDate(now, config.dateFormat)} ${formatTime(now, config.timeFormat)}`;
        break;
      case 'version':
        value = config.customFormat || '1.0';
        break;
      case 'title':
        value = document.title || 'Document sans titre';
        break;
      case 'author':
        value = config.customFormat || 'Auteur';
        break;
      case 'filename':
        value = config.customFormat || 'document.pdf';
        break;
      case 'last_modified':
        value = formatDate(now, config.dateFormat);
        break;
      case 'logo':
        // Logo is handled separately
        value = '';
        break;
      default:
        value = DYNAMIC_FIELD_LABELS[fieldType];
    }

    setDisplayValue(`${prefix}${value}${suffix}`);
  }, [fieldType, config, nodeKey, editor, formatDate, formatTime, formatNumber]);

  // Update on mount and when config changes
  useEffect(() => {
    updateDisplayValue();

    // Update periodically for time-based fields
    if (['time', 'datetime'].includes(fieldType)) {
      const interval = setInterval(updateDisplayValue, 60000); // Every minute
      return () => clearInterval(interval);
    }

    // Update on editor changes for page-based fields
    if (['page_number', 'total_pages', 'page_of_total'].includes(fieldType)) {
      return editor.registerUpdateListener(() => {
        updateDisplayValue();
      });
    }

    return undefined;
  }, [fieldType, config, editor, updateDisplayValue]);

  const handleClick = useCallback(() => {
    clearSelection();
    setSelected(true);
  }, [clearSelection, setSelected]);

  // Logo rendering
  if (fieldType === 'logo' && config.logoUrl) {
    return (
      <span
        className={`dynamic-field-component ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
        style={{
          display: 'inline-block',
          outline: isSelected ? `2px solid ${colors.border}` : 'none',
          outlineOffset: '2px',
          borderRadius: '4px',
        }}
      >
        <img
          src={config.logoUrl}
          alt="Logo"
          style={{
            width: config.logoWidth || 'auto',
            height: config.logoHeight || 24,
            verticalAlign: 'middle',
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={`dynamic-field-component ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '1px 4px',
        borderRadius: '3px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: '12px',
        fontWeight: 500,
        cursor: 'pointer',
        userSelect: 'none',
        outline: isSelected ? `2px solid ${colors.border}` : 'none',
        outlineOffset: '1px',
      }}
      title={DYNAMIC_FIELD_LABELS[fieldType]}
    >
      {displayValue || `[${DYNAMIC_FIELD_LABELS[fieldType]}]`}
    </span>
  );
}

/**
 * Find parent folio element for a node
 */
function findParentFolio(
  nodeKey: NodeKey,
  editor: ReturnType<typeof useLexicalComposerContext>[0]
): HTMLElement | null {
  const element = editor.getElementByKey(nodeKey);
  if (!element) return null;

  let parent = element.parentElement;
  while (parent) {
    if (parent.hasAttribute('data-folio-id')) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

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
 * Create a new DynamicFieldNode
 */
export function $createDynamicFieldNode(payload: DynamicFieldNodePayload): DynamicFieldNode {
  const { fieldType, config, key } = payload;
  return $applyNodeReplacement(
    new DynamicFieldNode(fieldType, config ?? {}, key)
  );
}

/**
 * Type guard for DynamicFieldNode
 */
export function $isDynamicFieldNode(
  node: LexicalNode | null | undefined
): node is DynamicFieldNode {
  return node instanceof DynamicFieldNode;
}

export default DynamicFieldNode;
