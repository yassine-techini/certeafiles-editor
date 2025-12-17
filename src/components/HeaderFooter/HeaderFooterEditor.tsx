/**
 * HeaderFooterEditor - Modal with mini Lexical editor for header/footer content
 * Per Constitution Section 4.2 - Headers and Footers
 */
import { useState, useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

import { PageNumberNode } from '../../nodes/PageNumberNode';
import { HeaderFooterToolbar } from './HeaderFooterToolbar';
import { useHeaderFooterStore } from '../../stores/headerFooterStore';
import type { HeaderFooterContent } from '../../types/headerFooter';

export interface HeaderFooterEditorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close the modal */
  onClose: () => void;
  /** The folio ID being edited (null for default) */
  folioId: string | null;
}

type TabType = 'header' | 'footer';

/**
 * Mini editor configuration for header/footer
 */
const miniEditorConfig = {
  namespace: 'HeaderFooterMiniEditor',
  theme: {
    paragraph: 'hf-paragraph',
    text: {
      bold: 'hf-bold',
      italic: 'hf-italic',
    },
  },
  nodes: [PageNumberNode],
  onError: (error: Error) => {
    console.error('[HeaderFooterEditor] Error:', error);
  },
};

/**
 * Plugin to initialize editor content
 */
function InitialContentPlugin({
  content,
}: {
  content: HeaderFooterContent | null;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        // Build display text from segments
        const parts: string[] = [];
        if (content.left?.content) parts.push(content.left.content);
        if (content.center?.content) parts.push(content.center.content);
        if (content.right?.content) parts.push(content.right.content);

        const displayText = parts.join('  |  ') || '';

        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(displayText));
        root.append(paragraph);
      });
    }
  }, [editor, content]);

  return null;
}

/**
 * Plugin to capture editor state changes
 */
function EditorStatePlugin({
  onChange,
}: {
  onChange: (state: SerializedEditorState) => void;
}): JSX.Element {
  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      onChange(editorState.toJSON());
    },
    [onChange]
  );

  return <OnChangePlugin onChange={handleChange} />;
}

/**
 * HeaderFooterEditor - Modal component for editing headers and footers
 */
export function HeaderFooterEditor({
  isOpen,
  onClose,
  folioId,
}: HeaderFooterEditorProps): JSX.Element | null {
  const [activeTab, setActiveTab] = useState<TabType>('header');
  const [useDefault, setUseDefault] = useState(true);
  const [headerState, setHeaderState] = useState<SerializedEditorState | null>(null);
  const [footerState, setFooterState] = useState<SerializedEditorState | null>(null);

  // Store actions
  const {
    getHeaderForFolio,
    getFooterForFolio,
    setFolioHeaderOverride,
    setFolioFooterOverride,
    resetFolioHeaderToDefault,
    resetFolioFooterToDefault,
    headers,
    footers,
    defaultHeaderId,
    defaultFooterId,
  } = useHeaderFooterStore();

  // Get current content
  const headerContent = folioId
    ? getHeaderForFolio(folioId).content
    : defaultHeaderId
      ? headers.get(defaultHeaderId) ?? null
      : null;

  const footerContent = folioId
    ? getFooterForFolio(folioId).content
    : defaultFooterId
      ? footers.get(defaultFooterId) ?? null
      : null;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('header');
      if (folioId) {
        const headerResolved = getHeaderForFolio(folioId);
        const footerResolved = getFooterForFolio(folioId);
        setUseDefault(headerResolved.isDefault && footerResolved.isDefault);
      } else {
        setUseDefault(true);
      }
      setHeaderState(null);
      setFooterState(null);
    }
  }, [isOpen, folioId, getHeaderForFolio, getFooterForFolio]);

  /**
   * Handle save
   */
  const handleSave = useCallback(() => {
    if (folioId) {
      if (useDefault) {
        // Clear overrides to use defaults
        resetFolioHeaderToDefault(folioId);
        resetFolioFooterToDefault(folioId);
      } else {
        // Save custom content
        // For now, we create simple content from editor state
        // In a full implementation, this would parse the editor state
        if (headerState) {
          const contentId = `custom-header-${folioId}`;
          setFolioHeaderOverride(folioId, contentId);
        }
        if (footerState) {
          const contentId = `custom-footer-${folioId}`;
          setFolioFooterOverride(folioId, contentId);
        }
      }
    }
    onClose();
  }, [folioId, useDefault, headerState, footerState, resetFolioHeaderToDefault, resetFolioFooterToDefault, setFolioHeaderOverride, setFolioFooterOverride, onClose]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="header-footer-editor-overlay" style={overlayStyles}>
      <div className="header-footer-editor-modal" style={modalStyles}>
        {/* Modal Header */}
        <div style={modalHeaderStyles}>
          <h2 style={titleStyles}>
            Edit {folioId ? `Page ${folioId}` : 'Default'} Header/Footer
          </h2>
          <button onClick={handleCancel} style={closeButtonStyles} title="Close">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={tabsContainerStyles}>
          <button
            onClick={() => setActiveTab('header')}
            style={{
              ...tabStyles,
              ...(activeTab === 'header' ? activeTabStyles : {}),
            }}
          >
            Header
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            style={{
              ...tabStyles,
              ...(activeTab === 'footer' ? activeTabStyles : {}),
            }}
          >
            Footer
          </button>
        </div>

        {/* Use Default Toggle (only for folio-specific editing) */}
        {folioId && (
          <div style={toggleContainerStyles}>
            <label style={toggleLabelStyles}>
              <input
                type="checkbox"
                checked={useDefault}
                onChange={(e) => setUseDefault(e.target.checked)}
                style={checkboxStyles}
              />
              Use default {activeTab}
            </label>
          </div>
        )}

        {/* Editor Area */}
        <div style={editorContainerStyles}>
          {(!folioId || !useDefault) && (
            <LexicalComposer initialConfig={miniEditorConfig}>
              <HeaderFooterToolbar />
              <div style={editorWrapperStyles}>
                <RichTextPlugin
                  contentEditable={
                    <ContentEditable
                      style={contentEditableStyles}
                      aria-placeholder="Enter content..."
                      placeholder={<div style={placeholderStyles}>Enter content...</div>}
                    />
                  }
                  ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin />
                <InitialContentPlugin
                  content={activeTab === 'header' ? headerContent : footerContent}
                />
                <EditorStatePlugin
                  onChange={activeTab === 'header' ? setHeaderState : setFooterState}
                />
              </div>
            </LexicalComposer>
          )}

          {folioId && useDefault && (
            <div style={defaultPreviewStyles}>
              <p style={defaultTextStyles}>
                Using default {activeTab}. Uncheck "Use default {activeTab}" to customize.
              </p>
              {activeTab === 'header' && headerContent && (
                <div style={previewContentStyles}>
                  Preview: {headerContent.left?.content || ''}{' '}
                  {headerContent.center?.content || ''} {headerContent.right?.content || ''}
                </div>
              )}
              {activeTab === 'footer' && footerContent && (
                <div style={previewContentStyles}>
                  Preview: {footerContent.left?.content || ''}{' '}
                  {footerContent.center?.content || ''} {footerContent.right?.content || ''}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={modalFooterStyles}>
          <button onClick={handleCancel} style={cancelButtonStyles}>
            Cancel
          </button>
          <button onClick={handleSave} style={saveButtonStyles}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Styles
const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyles: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  width: '600px',
  maxWidth: '90vw',
  maxHeight: '80vh',
  display: 'flex',
  flexDirection: 'column',
};

const modalHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: '1px solid #e2e8f0',
};

const titleStyles: React.CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: '#1e293b',
};

const closeButtonStyles: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: '#64748b',
  padding: '4px 8px',
  lineHeight: 1,
};

const tabsContainerStyles: React.CSSProperties = {
  display: 'flex',
  borderBottom: '1px solid #e2e8f0',
  padding: '0 20px',
};

const tabStyles: React.CSSProperties = {
  padding: '12px 24px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  color: '#64748b',
  borderBottom: '2px solid transparent',
  marginBottom: '-1px',
  transition: 'all 0.15s ease',
};

const activeTabStyles: React.CSSProperties = {
  color: '#3b82f6',
  borderBottomColor: '#3b82f6',
};

const toggleContainerStyles: React.CSSProperties = {
  padding: '12px 20px',
  backgroundColor: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
};

const toggleLabelStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#334155',
  cursor: 'pointer',
};

const checkboxStyles: React.CSSProperties = {
  width: '16px',
  height: '16px',
  cursor: 'pointer',
};

const editorContainerStyles: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  minHeight: '200px',
};

const editorWrapperStyles: React.CSSProperties = {
  padding: '12px 20px',
};

const contentEditableStyles: React.CSSProperties = {
  minHeight: '100px',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  outline: 'none',
  fontSize: '14px',
  lineHeight: 1.6,
};

const defaultPreviewStyles: React.CSSProperties = {
  padding: '20px',
  textAlign: 'center',
};

const defaultTextStyles: React.CSSProperties = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 12px 0',
};

const previewContentStyles: React.CSSProperties = {
  padding: '12px',
  backgroundColor: '#f8fafc',
  borderRadius: '4px',
  fontSize: '13px',
  color: '#334155',
};

const modalFooterStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  padding: '16px 20px',
  borderTop: '1px solid #e2e8f0',
};

const cancelButtonStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#64748b',
};

const saveButtonStyles: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: '14px',
  fontWeight: 500,
  backgroundColor: '#3b82f6',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  color: '#ffffff',
};

const placeholderStyles: React.CSSProperties = {
  color: '#9ca3af',
  position: 'absolute',
  top: '12px',
  left: '12px',
  pointerEvents: 'none',
  fontSize: '14px',
};

export default HeaderFooterEditor;
