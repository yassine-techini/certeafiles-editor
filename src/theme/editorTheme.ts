import type { EditorThemeClasses } from 'lexical';

export const editorTheme: EditorThemeClasses = {
  paragraph: 'editor-paragraph',
  heading: {
    h1: 'editor-h1',
    h2: 'editor-h2',
    h3: 'editor-h3',
    h4: 'editor-h4',
    h5: 'editor-h5',
    h6: 'editor-h6',
  },
  text: {
    bold: 'editor-bold',
    italic: 'editor-italic',
    underline: 'editor-underline',
    strikethrough: 'editor-strikethrough',
    subscript: 'editor-subscript',
    superscript: 'editor-superscript',
    code: 'editor-code',
  },
  list: {
    ul: 'editor-ul',
    ol: 'editor-ol',
    listitem: 'editor-listitem',
    nested: {
      listitem: 'editor-nested-listitem',
    },
  },
  table: 'editor-table',
  tableCell: 'editor-table-cell',
  tableCellHeader: 'editor-table-cell-header',
  tableRow: 'editor-table-row',
  link: 'editor-link',
  code: 'editor-code-block',
  quote: 'editor-quote',
};
