/**
 * ClipboardImportPlugin - Detect and clean Word content on paste
 * Per Constitution Section 8 - Import
 */
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  PASTE_COMMAND,
  COMMAND_PRIORITY_HIGH,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  $insertNodes,
} from 'lexical';
import { $generateNodesFromDOM } from '@lexical/html';
import { createStyleMapper } from '../services/docx-import/StyleMapper';

export interface ClipboardImportPluginProps {
  /** Whether to auto-clean Word content */
  cleanWordContent?: boolean | undefined;
  /** Whether to preserve formatting */
  preserveFormatting?: boolean | undefined;
  /** Callback when Word content is detected */
  onWordContentDetected?: ((html: string) => void) | undefined;
  /** Callback after content is cleaned */
  onContentCleaned?: ((html: string) => void) | undefined;
  /** Whether plugin is enabled */
  enabled?: boolean | undefined;
}

/**
 * Patterns to detect Word/Office content
 */
const WORD_CONTENT_PATTERNS = [
  /class="?Mso/i,
  /style="[^"]*mso-/i,
  /<o:/i,
  /<w:/i,
  /xmlns:o=/i,
  /xmlns:w=/i,
  /urn:schemas-microsoft-com/i,
  /<!--\[if/i,
  /<!\[endif\]/i,
  /class="?WordSection/i,
  /style="[^"]*tab-stops/i,
];

/**
 * Detect if HTML content is from Microsoft Word
 */
function isWordContent(html: string): boolean {
  return WORD_CONTENT_PATTERNS.some((pattern) => pattern.test(html));
}

/**
 * Clean Word HTML content
 */
function cleanWordHtml(html: string): string {
  const styleMapper = createStyleMapper();
  let cleaned = styleMapper.cleanOfficeStyles(html);

  // Additional Word-specific cleaning
  cleaned = cleanWordSpecificElements(cleaned);
  cleaned = normalizeStructure(cleaned);

  return cleaned;
}

/**
 * Clean Word-specific elements and attributes
 */
function cleanWordSpecificElements(html: string): string {
  let cleaned = html;

  // Remove Word-specific XML namespaces
  cleaned = cleaned.replace(/<\?xml[^>]*>/gi, '');
  cleaned = cleaned.replace(/xmlns:[a-z]+="[^"]*"/gi, '');

  // Remove conditional comments
  cleaned = cleaned.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');
  cleaned = cleaned.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]>/gi, '');

  // Remove Office namespace elements
  cleaned = cleaned.replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<m:[^>]*>[\s\S]*?<\/m:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<v:[^>]*>[\s\S]*?<\/v:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<x:[^>]*>[\s\S]*?<\/x:[^>]*>/gi, '');

  // Remove WordSection divs while keeping content
  cleaned = cleaned.replace(/<div[^>]*class="?WordSection[^>]*>/gi, '');
  cleaned = cleaned.replace(/<\/div>/gi, '');

  // Clean up Mso classes
  cleaned = cleaned.replace(/class="?Mso[^"]*"?/gi, '');

  // Remove empty language spans
  cleaned = cleaned.replace(/<span[^>]*lang="[^"]*"[^>]*>\s*<\/span>/gi, '');

  // Remove font tags
  cleaned = cleaned.replace(/<\/?font[^>]*>/gi, '');

  // Remove Word smart tags
  cleaned = cleaned.replace(/<st1:[^>]*>[\s\S]*?<\/st1:[^>]*>/gi, '');

  return cleaned;
}

/**
 * Normalize document structure
 */
function normalizeStructure(html: string): string {
  let cleaned = html;

  // Convert Word's bold/italic spans to semantic elements
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*font-weight:\s*bold[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<strong>$1</strong>'
  );
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*font-style:\s*italic[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<em>$1</em>'
  );
  cleaned = cleaned.replace(
    /<span[^>]*style="[^"]*text-decoration:\s*underline[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '<u>$1</u>'
  );

  // Clean empty style attributes
  cleaned = cleaned.replace(/\s*style="\s*"/gi, '');

  // Clean empty class attributes
  cleaned = cleaned.replace(/\s*class="\s*"/gi, '');

  // Remove empty spans
  cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, '');

  // Normalize multiple spaces
  cleaned = cleaned.replace(/&nbsp;/gi, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Clean up consecutive line breaks
  cleaned = cleaned.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

  // Remove empty paragraphs but keep intentional breaks
  cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');

  return cleaned.trim();
}

/**
 * ClipboardImportPlugin component
 */
export function ClipboardImportPlugin({
  cleanWordContent = true,
  preserveFormatting = true,
  onWordContentDetected,
  onContentCleaned,
  enabled = true,
}: ClipboardImportPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData;
        if (!clipboardData) {
          return false;
        }

        // Get HTML content from clipboard
        const htmlContent = clipboardData.getData('text/html');
        const textContent = clipboardData.getData('text/plain');

        // If no HTML content, let default handling take over
        if (!htmlContent) {
          return false;
        }

        // Check if it's Word content
        const isWord = isWordContent(htmlContent);

        if (isWord) {
          onWordContentDetected?.(htmlContent);

          if (cleanWordContent) {
            // Prevent default paste
            event.preventDefault();

            // Clean the HTML
            const cleanedHtml = preserveFormatting
              ? cleanWordHtml(htmlContent)
              : `<p>${textContent}</p>`;

            onContentCleaned?.(cleanedHtml);

            // Insert the cleaned content
            editor.update(() => {
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) {
                return;
              }

              // Parse cleaned HTML
              const parser = new DOMParser();
              const dom = parser.parseFromString(cleanedHtml, 'text/html');

              // Generate Lexical nodes
              const nodes = $generateNodesFromDOM(editor, dom);

              if (nodes.length === 0) {
                // Fallback to plain text
                if (textContent) {
                  const paragraph = $createParagraphNode();
                  paragraph.append($createTextNode(textContent));
                  $insertNodes([paragraph]);
                }
              } else {
                $insertNodes(nodes);
              }
            });

            return true;
          }
        }

        // Let default handling continue for non-Word content
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [
    editor,
    cleanWordContent,
    preserveFormatting,
    onWordContentDetected,
    onContentCleaned,
    enabled,
  ]);

  return null;
}

export default ClipboardImportPlugin;
