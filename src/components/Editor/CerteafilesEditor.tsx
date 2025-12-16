/**
 * CerteafilesEditor - Main WYSIWYG Editor Component
 * Per Constitution Section 2.4
 */
import { useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, LexicalEditor } from 'lexical';

import { createEditorConfig } from '../../config';
import { A4_CONSTANTS, mmToPx } from '../../utils/a4-constants';
import type { A4Configuration } from '../../config';

/**
 * Props for CerteafilesEditor
 */
export interface CerteafilesEditorProps {
  /** Initial editor state as JSON string */
  initialState?: string;
  /** Whether the editor is editable */
  editable?: boolean;
  /** A4 page configuration */
  a4Config?: Partial<A4Configuration>;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Callback when editor state changes */
  onChange?: (editorState: EditorState, editor: LexicalEditor) => void;
  /** Callback when editor is ready */
  onReady?: (editor: LexicalEditor) => void;
  /** Additional CSS class for the editor container */
  className?: string;
}

/**
 * Placeholder component for empty editor
 */
function EditorPlaceholder({ text }: { text: string }): JSX.Element {
  return (
    <div className="editor-placeholder">
      {text}
    </div>
  );
}

/**
 * CerteafilesEditor - Main editor component
 */
export function CerteafilesEditor({
  initialState,
  editable = true,
  a4Config,
  placeholder = 'Start typing your document...',
  onChange,
  className = '',
}: CerteafilesEditorProps): JSX.Element {
  // Merge A4 config with defaults
  const margins = {
    top: a4Config?.margins?.top ?? A4_CONSTANTS.MARGIN_TOP,
    right: a4Config?.margins?.right ?? A4_CONSTANTS.MARGIN_RIGHT,
    bottom: a4Config?.margins?.bottom ?? A4_CONSTANTS.MARGIN_BOTTOM,
    left: a4Config?.margins?.left ?? A4_CONSTANTS.MARGIN_LEFT,
  };

  // Create editor configuration
  const editorConfig = createEditorConfig({ editable });

  // Add initial state if provided
  const initialConfig = initialState
    ? { ...editorConfig, editorState: initialState }
    : editorConfig;

  // Handle editor changes
  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      onChange?.(editorState, editor);
    },
    [onChange]
  );

  // URL validation for LinkPlugin
  const validateUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`certeafiles-editor-container ${className}`}>
        {/* A4 Page Container */}
        <div
          className="a4-page"
          style={{
            width: `${A4_CONSTANTS.WIDTH_PX}px`,
            minHeight: `${A4_CONSTANTS.HEIGHT_PX}px`,
            paddingTop: `${mmToPx(margins.top)}px`,
            paddingRight: `${mmToPx(margins.right)}px`,
            paddingBottom: `${mmToPx(margins.bottom)}px`,
            paddingLeft: `${mmToPx(margins.left)}px`,
          }}
        >
          {/* Rich Text Editor */}
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-content"
                aria-placeholder={placeholder}
                placeholder={<EditorPlaceholder text={placeholder} />}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          {/* Core Plugins */}
          <HistoryPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin validateUrl={validateUrl} />
          <TablePlugin />
          <TabIndentationPlugin />
          <HorizontalRulePlugin />

          {/* Change Handler */}
          {onChange && (
            <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
          )}
        </div>
      </div>
    </LexicalComposer>
  );
}

export default CerteafilesEditor;
