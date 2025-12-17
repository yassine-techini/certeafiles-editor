/**
 * Lexical Editor Configuration
 * Per Constitution Section 2.1 and 2.2
 */
import type { EditorThemeClasses, Klass, LexicalNode } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';

import { editorTheme } from '../theme';
import { ImageNode } from '../nodes/ImageNode';
import { FolioNode } from '../nodes/FolioNode';
import { HeaderNode } from '../nodes/HeaderNode';
import { FooterNode } from '../nodes/FooterNode';
import { PageNumberNode } from '../nodes/PageNumberNode.tsx';
import { SlotNode } from '../nodes/SlotNode';
import { CommentNode } from '../nodes/CommentNode';
import { MentionNode } from '../nodes/MentionNode';
import { DynamicFieldNode } from '../nodes/DynamicFieldNode';
import { InsertionNode } from '../nodes/InsertionNode';
import { DeletionNode } from '../nodes/DeletionNode';
import { A4_CONSTANTS } from '../utils/a4-constants';

/**
 * Editor configuration interface
 */
export interface EditorConfiguration {
  namespace: string;
  theme: EditorThemeClasses;
  editable: boolean;
  a4: A4Configuration;
}

/**
 * A4 page configuration
 */
export interface A4Configuration {
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  zoom: number;
}

/**
 * All Lexical nodes to register with the editor
 * Per Constitution Section 2.1
 */
export const EDITOR_NODES: Array<Klass<LexicalNode>> = [
  // Rich text nodes
  HeadingNode,
  QuoteNode,

  // List nodes
  ListNode,
  ListItemNode,

  // Link nodes
  LinkNode,
  AutoLinkNode,

  // Code nodes
  CodeNode,
  CodeHighlightNode,

  // Table nodes
  TableNode,
  TableCellNode,
  TableRowNode,

  // Horizontal rule
  HorizontalRuleNode,

  // Custom nodes
  ImageNode,
  FolioNode,
  HeaderNode,
  FooterNode,
  PageNumberNode,
  SlotNode,
  CommentNode,
  MentionNode,
  DynamicFieldNode,
  InsertionNode,
  DeletionNode,

];

/**
 * Default editor configuration
 */
export const defaultEditorConfig: EditorConfiguration = {
  namespace: 'CerteafilesEditor',
  theme: editorTheme,
  editable: true,
  a4: {
    orientation: 'portrait',
    margins: {
      top: A4_CONSTANTS.MARGIN_TOP,
      right: A4_CONSTANTS.MARGIN_RIGHT,
      bottom: A4_CONSTANTS.MARGIN_BOTTOM,
      left: A4_CONSTANTS.MARGIN_LEFT,
    },
    zoom: A4_CONSTANTS.ZOOM_DEFAULT,
  },
};

/**
 * Error handler for Lexical editor
 */
export function onEditorError(error: Error): void {
  console.error('[CerteafilesEditor] Error:', error);
}

/**
 * URL validation patterns for links
 */
export const URL_MATCHERS = [
  // Match URLs with protocol
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/,
  // Match email addresses
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
];

/**
 * Create initial editor config for LexicalComposer
 */
export function createEditorConfig(
  config: Partial<EditorConfiguration> = {}
): {
  namespace: string;
  theme: EditorThemeClasses;
  nodes: Array<Klass<LexicalNode>>;
  editable: boolean;
  onError: (error: Error) => void;
} {
  const mergedConfig = { ...defaultEditorConfig, ...config };

  return {
    namespace: mergedConfig.namespace,
    theme: mergedConfig.theme,
    nodes: EDITOR_NODES,
    editable: mergedConfig.editable,
    onError: onEditorError,
  };
}
