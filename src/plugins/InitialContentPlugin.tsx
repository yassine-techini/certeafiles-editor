/**
 * InitialContentPlugin - Loads initial text content into the editor
 * Converts plain text to Lexical nodes on mount
 * Preserves FolioNode structure for A4 pagination
 */
import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, ElementNode } from 'lexical';
import { $isFolioNode } from '../nodes/FolioNode';

interface InitialContentPluginProps {
  /** Plain text content to load */
  content: string;
  /** Callback when content is loaded */
  onContentLoaded?: (() => void) | undefined;
}

/**
 * Create a paragraph node with the given text and optional formatting
 */
function createFormattedParagraph(paragraph: string): ElementNode {
  const paragraphNode = $createParagraphNode();

  if (paragraph.trim()) {
    // Check for special formatting
    if (paragraph.startsWith('═══')) {
      // Horizontal separator line
      const textNode = $createTextNode(paragraph);
      textNode.setFormat('bold');
      paragraphNode.append(textNode);
    } else if (paragraph.match(/^#+\s/)) {
      // Heading (markdown style)
      const text = paragraph.replace(/^#+\s/, '');
      const textNode = $createTextNode(text);
      textNode.setFormat('bold');
      paragraphNode.append(textNode);
    } else if (paragraph.startsWith('•')) {
      // Bullet point
      const textNode = $createTextNode(paragraph);
      paragraphNode.append(textNode);
    } else if (paragraph.startsWith('|')) {
      // Table row - keep as text for now
      const textNode = $createTextNode(paragraph);
      paragraphNode.append(textNode);
    } else if (paragraph.match(/^\d+\.\s/)) {
      // Numbered item
      const textNode = $createTextNode(paragraph);
      paragraphNode.append(textNode);
    } else if (paragraph.match(/^[A-Z][A-Z\s]+$/) && paragraph.length < 60) {
      // All caps and short - likely a section header
      const textNode = $createTextNode(paragraph);
      textNode.setFormat('bold');
      paragraphNode.append(textNode);
    } else {
      // Regular paragraph
      const textNode = $createTextNode(paragraph);
      paragraphNode.append(textNode);
    }
  }

  return paragraphNode;
}

/**
 * Plugin that loads initial text content into the editor
 * Parses plain text and creates appropriate Lexical nodes
 * Inserts content into existing FolioNode structure to preserve A4 pagination
 */
export function InitialContentPlugin({
  content,
  onContentLoaded,
}: InitialContentPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const lastContentRef = useRef<string>('');

  useEffect(() => {
    // Skip if no content or same content already loaded
    if (!content || content === lastContentRef.current) {
      if (!content) {
        onContentLoaded?.();
      }
      return;
    }

    // Store the content we're loading to prevent duplicate loads
    lastContentRef.current = content;

    console.log('[InitialContentPlugin] Loading content, length:', content.length);

    // Delay to ensure FolioPlugin has initialized the folio structure
    const timeoutId = setTimeout(() => {
      editor.update(
        () => {
          const root = $getRoot();
          const children = root.getChildren();

          // Find the first FolioNode to insert content into
          let targetContainer: ElementNode | null = null;

          for (const child of children) {
            if ($isFolioNode(child)) {
              targetContainer = child;
              break;
            }
          }

          // If no FolioNode found, use root directly (fallback)
          if (!targetContainer) {
            console.log('[InitialContentPlugin] No FolioNode found, using root');
            targetContainer = root;
          } else {
            console.log('[InitialContentPlugin] Found FolioNode, inserting content');
          }

          // Get existing children of the container
          const existingChildren = targetContainer.getChildren();

          // Split content into paragraphs
          const paragraphs = content.split('\n');

          // Create all paragraph nodes first
          const newNodes: ElementNode[] = [];
          paragraphs.forEach((paragraph) => {
            const paragraphNode = createFormattedParagraph(paragraph);
            newNodes.push(paragraphNode);
          });

          // If there's an existing first child (empty paragraph), replace it with first new node
          if (existingChildren.length > 0 && newNodes.length > 0) {
            const firstChild = existingChildren[0];
            const firstNewNode = newNodes[0];
            firstChild.replace(firstNewNode);

            // Append remaining nodes after the first one
            let lastNode = firstNewNode;
            for (let i = 1; i < newNodes.length; i++) {
              lastNode.insertAfter(newNodes[i]);
              lastNode = newNodes[i];
            }

            // Remove any other existing children (except the first which was replaced)
            for (let i = 1; i < existingChildren.length; i++) {
              existingChildren[i].remove();
            }
          } else {
            // No existing children, just append all
            newNodes.forEach((node) => {
              targetContainer!.append(node);
            });
          }

          console.log('[InitialContentPlugin] Loaded', paragraphs.length, 'paragraphs');
        },
        { discrete: true }
      );

      onContentLoaded?.();
    }, 500); // Delay to ensure FolioPlugin runs first

    return () => clearTimeout(timeoutId);
  }, [editor, content, onContentLoaded]);

  return null;
}

export default InitialContentPlugin;
