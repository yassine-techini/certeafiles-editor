/**
 * ImageNode - Custom image node for Lexical editor
 * Per Constitution Section 3.3 - Custom Nodes
 */
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import {
  $applyNodeReplacement,
  createCommand,
  DecoratorNode,
} from 'lexical';
import { ImageComponent } from '../components/Editor/ImageComponent';

export type ImageAlignment = 'left' | 'center' | 'right' | 'full';

export interface ImagePayload {
  src: string;
  altText: string;
  width?: number | undefined;
  height?: number | undefined;
  alignment?: ImageAlignment;
  caption?: string;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width?: number | undefined;
    height?: number | undefined;
    alignment: ImageAlignment;
    caption: string;
  },
  SerializedLexicalNode
>;

// Command for inserting images
export const INSERT_IMAGE_COMMAND: LexicalCommand<ImagePayload> = createCommand(
  'INSERT_IMAGE_COMMAND'
);

function $convertImageElement(domNode: Node): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const { src, alt, width, height } = domNode;
    const node = $createImageNode({
      src,
      altText: alt || '',
      width: width || undefined,
      height: height || undefined,
    });
    return { node };
  }
  return null;
}

/**
 * ImageNode - DecoratorNode for images with alignment and caption
 */
export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;
  __width: number | undefined;
  __height: number | undefined;
  __alignment: ImageAlignment;
  __caption: string;

  static override getType(): string {
    return 'image';
  }

  static override clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__alignment,
      node.__caption,
      node.__key
    );
  }

  static override importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height, alignment, caption } = serializedNode;
    const node = $createImageNode({
      src,
      altText,
      width,
      height,
      alignment,
      caption,
    });
    return node;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    alignment: ImageAlignment = 'center',
    caption: string = '',
    key?: NodeKey
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__alignment = alignment;
    this.__caption = caption;
  }

  override exportJSON(): SerializedImageNode {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      alignment: this.__alignment,
      caption: this.__caption,
    };
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) {
      element.setAttribute('width', String(this.__width));
    }
    if (this.__height) {
      element.setAttribute('height', String(this.__height));
    }
    element.style.display = 'block';
    if (this.__alignment === 'center') {
      element.style.marginLeft = 'auto';
      element.style.marginRight = 'auto';
    } else if (this.__alignment === 'right') {
      element.style.marginLeft = 'auto';
    } else if (this.__alignment === 'full') {
      element.style.width = '100%';
    }
    return { element };
  }

  // Getters
  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }

  getWidth(): number | undefined {
    return this.__width;
  }

  getHeight(): number | undefined {
    return this.__height;
  }

  getAlignment(): ImageAlignment {
    return this.__alignment;
  }

  getCaption(): string {
    return this.__caption;
  }

  // Setters (return writable node)
  setSrc(src: string): void {
    const writable = this.getWritable();
    writable.__src = src;
  }

  setAltText(altText: string): void {
    const writable = this.getWritable();
    writable.__altText = altText;
  }

  setWidth(width: number | undefined): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setHeight(height: number | undefined): void {
    const writable = this.getWritable();
    writable.__height = height;
  }

  setDimensions(width: number | undefined, height: number | undefined): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setAlignment(alignment: ImageAlignment): void {
    const writable = this.getWritable();
    writable.__alignment = alignment;
  }

  setCaption(caption: string): void {
    const writable = this.getWritable();
    writable.__caption = caption;
  }

  // Required DecoratorNode methods
  override createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('div');
    div.className = `image-node image-align-${this.__alignment}`;
    const theme = config.theme;
    if (theme.image) {
      div.className += ` ${theme.image}`;
    }
    return div;
  }

  override updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
    // Update alignment class if changed
    if (prevNode.__alignment !== this.__alignment) {
      dom.className = `image-node image-align-${this.__alignment}`;
      return false;
    }
    return false;
  }

  override decorate(): JSX.Element {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        alignment={this.__alignment}
        caption={this.__caption}
        nodeKey={this.getKey()}
      />
    );
  }

  override isInline(): boolean {
    return false;
  }
}

/**
 * Create a new ImageNode
 */
export function $createImageNode({
  src,
  altText,
  width,
  height,
  alignment = 'center',
  caption = '',
  key,
}: ImagePayload): ImageNode {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, height, alignment, caption, key)
  );
}

/**
 * Check if a node is an ImageNode
 */
export function $isImageNode(
  node: LexicalNode | null | undefined
): node is ImageNode {
  return node instanceof ImageNode;
}

export default ImageNode;
