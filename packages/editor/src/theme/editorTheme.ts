/**
 * Lexical Editor Theme Configuration
 * Per Constitution Section 2.7
 */
import type { EditorThemeClasses } from 'lexical';

export const editorTheme: EditorThemeClasses = {
  // Root element
  root: 'editor-root',

  // Paragraphs
  paragraph: 'editor-paragraph',

  // Headings
  heading: {
    h1: 'editor-h1',
    h2: 'editor-h2',
    h3: 'editor-h3',
    h4: 'editor-h4',
    h5: 'editor-h5',
    h6: 'editor-h6',
  },

  // Text formatting
  text: {
    bold: 'editor-bold',
    italic: 'editor-italic',
    underline: 'editor-underline',
    strikethrough: 'editor-strikethrough',
    subscript: 'editor-subscript',
    superscript: 'editor-superscript',
    code: 'editor-code-inline',
    highlight: 'editor-highlight',
  },

  // Lists
  list: {
    ul: 'editor-ul',
    ulDepth: ['editor-ul-depth-1', 'editor-ul-depth-2', 'editor-ul-depth-3'],
    ol: 'editor-ol',
    olDepth: ['editor-ol-depth-1', 'editor-ol-depth-2', 'editor-ol-depth-3'],
    listitem: 'editor-listitem',
    listitemChecked: 'editor-listitem-checked',
    listitemUnchecked: 'editor-listitem-unchecked',
    nested: {
      listitem: 'editor-nested-listitem',
    },
  },

  // Tables
  table: 'editor-table',
  tableCell: 'editor-table-cell',
  tableCellHeader: 'editor-table-cell-header',
  tableRow: 'editor-table-row',
  tableAddColumns: 'editor-table-add-columns',
  tableAddRows: 'editor-table-add-rows',
  tableCellResizer: 'editor-table-cell-resizer',
  tableCellSelected: 'editor-table-cell-selected',
  tableSelected: 'editor-table-selected',

  // Links
  link: 'editor-link',

  // Code
  code: 'editor-code-block',
  codeHighlight: {
    atrule: 'editor-code-atrule',
    attr: 'editor-code-attr',
    boolean: 'editor-code-boolean',
    builtin: 'editor-code-builtin',
    cdata: 'editor-code-cdata',
    char: 'editor-code-char',
    class: 'editor-code-class',
    'class-name': 'editor-code-class-name',
    comment: 'editor-code-comment',
    constant: 'editor-code-constant',
    deleted: 'editor-code-deleted',
    doctype: 'editor-code-doctype',
    entity: 'editor-code-entity',
    function: 'editor-code-function',
    important: 'editor-code-important',
    inserted: 'editor-code-inserted',
    keyword: 'editor-code-keyword',
    namespace: 'editor-code-namespace',
    number: 'editor-code-number',
    operator: 'editor-code-operator',
    prolog: 'editor-code-prolog',
    property: 'editor-code-property',
    punctuation: 'editor-code-punctuation',
    regex: 'editor-code-regex',
    selector: 'editor-code-selector',
    string: 'editor-code-string',
    symbol: 'editor-code-symbol',
    tag: 'editor-code-tag',
    url: 'editor-code-url',
    variable: 'editor-code-variable',
  },

  // Block quote
  quote: 'editor-quote',

  // Horizontal rule
  hr: 'editor-hr',

  // Image
  image: 'editor-image',

  // Indent
  indent: 'editor-indent',

  // Layout
  layoutContainer: 'editor-layout-container',
  layoutItem: 'editor-layout-item',

  // Placeholder
  ltr: 'editor-ltr',
  rtl: 'editor-rtl',

  // Custom nodes (per constitution)
  // These will be used by custom nodes
  embedBlock: {
    base: 'editor-embed-block',
    focus: 'editor-embed-block-focus',
  },

  // Folio (page) node
  folio: 'folio-page',
};

/**
 * Theme class name prefix for namespacing
 */
export const THEME_PREFIX = 'certeafiles';

/**
 * Get fully qualified class name
 */
export function getThemeClass(className: string): string {
  return `${THEME_PREFIX}-${className}`;
}
