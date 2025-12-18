/**
 * HeaderFooterToolbar - Simplified toolbar for header/footer editing
 * Per Constitution Section 4.2 - Headers and Footers
 */
import { useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, $createTextNode } from 'lexical';
import { $createPageNumberNode, type PageNumberFormat } from '../../nodes/PageNumberNode';

export interface HeaderFooterToolbarProps {
  onInsertLogo?: () => void;
}

/**
 * HeaderFooterToolbar - Provides insert buttons for header/footer content
 */
export function HeaderFooterToolbar({ onInsertLogo }: HeaderFooterToolbarProps): JSX.Element {
  const [editor] = useLexicalComposerContext();

  /**
   * Insert a page number node at the current selection
   */
  const insertPageNumber = useCallback(
    (format: PageNumberFormat = 'page') => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const pageNumberNode = $createPageNumberNode({ format });
          selection.insertNodes([pageNumberNode]);
        }
      });
    },
    [editor]
  );

  /**
   * Insert current date at the current selection
   */
  const insertDate = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const dateText = new Date().toLocaleDateString();
        const textNode = $createTextNode(dateText);
        selection.insertNodes([textNode]);
      }
    });
  }, [editor]);

  /**
   * Insert current time at the current selection
   */
  const insertTime = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const timeText = new Date().toLocaleTimeString();
        const textNode = $createTextNode(timeText);
        selection.insertNodes([textNode]);
      }
    });
  }, [editor]);

  return (
    <div className="header-footer-toolbar" style={toolbarStyles}>
      {/* Page Number Group */}
      <div className="toolbar-group" style={groupStyles}>
        <span style={labelStyles}>Page:</span>
        <button
          onClick={() => insertPageNumber('page')}
          style={buttonStyles}
          title="Insert page number"
        >
          #
        </button>
        <button
          onClick={() => insertPageNumber('page_of_total')}
          style={buttonStyles}
          title="Insert 'Page X of Y'"
        >
          # / #
        </button>
        <button
          onClick={() => insertPageNumber('total')}
          style={buttonStyles}
          title="Insert total pages"
        >
          Total
        </button>
      </div>

      {/* Divider */}
      <div style={dividerStyles} />

      {/* Date/Time Group */}
      <div className="toolbar-group" style={groupStyles}>
        <span style={labelStyles}>Insert:</span>
        <button onClick={insertDate} style={buttonStyles} title="Insert current date">
          Date
        </button>
        <button onClick={insertTime} style={buttonStyles} title="Insert current time">
          Time
        </button>
      </div>

      {/* Divider */}
      <div style={dividerStyles} />

      {/* Logo Group */}
      <div className="toolbar-group" style={groupStyles}>
        <button
          onClick={onInsertLogo}
          style={buttonStyles}
          title="Insert logo image"
          disabled={!onInsertLogo}
        >
          Logo
        </button>
      </div>
    </div>
  );
}

// Styles
const toolbarStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 12px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  borderRadius: '4px 4px 0 0',
};

const groupStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
};

const labelStyles: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748b',
  marginRight: '4px',
};

const buttonStyles: React.CSSProperties = {
  padding: '4px 8px',
  fontSize: '12px',
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  cursor: 'pointer',
  color: '#334155',
  transition: 'all 0.15s ease',
};

const dividerStyles: React.CSSProperties = {
  width: '1px',
  height: '20px',
  backgroundColor: '#e2e8f0',
};

export default HeaderFooterToolbar;
