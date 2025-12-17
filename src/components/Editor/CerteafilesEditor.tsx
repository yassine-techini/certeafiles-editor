/**
 * CerteafilesEditor - Main WYSIWYG Editor Component
 * Per Constitution Section 2.4
 */
import { useCallback, useState, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin as LexicalTablePlugin } from '@lexical/react/LexicalTablePlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import type { EditorState, LexicalEditor } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { A4ContentEditable, A4Placeholder } from './A4ContentEditable';
import { EditorToolbar } from './EditorToolbar';
import { A4LayoutPlugin } from '../../plugins/A4LayoutPlugin';
import { ImagePlugin } from '../../plugins/ImagePlugin';
import { TablePlugin } from '../../plugins/TablePlugin';
import { FloatingToolbarPlugin } from '../../plugins/FloatingToolbarPlugin';
import { FolioPlugin } from '../../plugins/FolioPlugin';
import { FolioScrollSyncPlugin } from '../../plugins/FolioScrollSyncPlugin';
import { HeaderFooterPlugin } from '../../plugins/HeaderFooterPlugin';
import { PageNumberingPlugin } from '../../plugins/PageNumberingPlugin';
import { SlotPlugin } from '../../plugins/SlotPlugin';
import { CommentPlugin } from '../../plugins/CommentPlugin';
import { HeaderFooterEditor } from '../HeaderFooter/HeaderFooterEditor';
import { AlignedCommentPanel } from '../Comments/AlignedCommentPanel';
import { RevisionPanel } from '../Revisions/RevisionPanel';
import { CREATE_COMMENT_COMMAND } from '../../plugins/CommentPlugin';
import { CommentAlignmentPlugin } from '../../plugins/CommentAlignmentPlugin';
import { SlashMenuPlugin } from '../../plugins/SlashMenuPlugin';
import { AtMenuPlugin } from '../../plugins/AtMenuPlugin';
import { PlusMenuPlugin } from '../../plugins/PlusMenuPlugin';
import { TrackChangesPlugin } from '../../plugins/TrackChangesPlugin';
import { createEditorConfig } from '../../config';
import { A4_CONSTANTS } from '../../utils/a4-constants';
import type { Orientation } from '../../utils/a4-constants';

/**
 * Props for CerteafilesEditor
 */
export interface CerteafilesEditorProps {
  /** Initial editor state as JSON string */
  initialState?: string;
  /** Whether the editor is editable */
  editable?: boolean;
  /** Page orientation */
  orientation?: Orientation;
  /** Zoom level (0.5 - 2.0) */
  zoom?: number;
  /** Custom margins in mm */
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Callback when editor state changes */
  onChange?: (editorState: EditorState, editor: LexicalEditor) => void;
  /** Callback when editor is ready */
  onReady?: (editor: LexicalEditor) => void;
  /** Additional CSS class for the editor container */
  className?: string;
  /** Whether to show the toolbar */
  showToolbar?: boolean;
  /** Whether to show the comment panel */
  showCommentPanel?: boolean;
}

/**
 * CerteafilesEditor - Main editor component with A4 faithful rendering
 */
/**
 * Inner component that has access to LexicalComposerContext
 */
function EditorInner({
  orientation,
  zoom,
  margins,
  placeholder,
  onChange,
  showToolbar,
  showCommentPanel,
}: {
  orientation: Orientation;
  zoom: number;
  margins: { top?: number; right?: number; bottom?: number; left?: number } | undefined;
  placeholder: string;
  onChange: ((editorState: EditorState, editor: LexicalEditor) => void) | undefined;
  showToolbar: boolean;
  showCommentPanel: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  // Header/Footer Editor modal state
  const [showHeaderFooterEditor, setShowHeaderFooterEditor] = useState(false);

  // Comment panel state
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(showCommentPanel);

  // Revision panel state
  const [isRevisionPanelOpen, setIsRevisionPanelOpen] = useState(false);

  // Editor container ref for alignment calculation
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Force recalculation trigger
  const [, setAlignmentTrigger] = useState(0);
  const triggerAlignmentRecalc = useCallback(() => {
    setAlignmentTrigger((n) => n + 1);
  }, []);

  // Handle editor changes
  const handleChange = useCallback(
    (editorState: EditorState, editorInstance: LexicalEditor) => {
      onChange?.(editorState, editorInstance);
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

  // Handle new comment from panel
  const handleNewComment = useCallback(() => {
    const content = window.prompt('Enter your comment:');
    if (content) {
      editor.dispatchCommand(CREATE_COMMENT_COMMAND, {
        content,
        type: 'remark',
      });
    }
  }, [editor]);

  // Handle scroll to thread
  const handleScrollToThread = useCallback(
    (threadId: string) => {
      // Find the comment node in the editor and scroll to it
      const commentElement = document.querySelector(
        `[data-comment-thread-id="${threadId}"]`
      );
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a brief highlight effect
        commentElement.classList.add('comment-highlight-pulse');
        setTimeout(() => {
          commentElement.classList.remove('comment-highlight-pulse');
        }, 2000);
      }
    },
    []
  );

  return (
    <div className="flex h-full">
      <div ref={editorContainerRef} className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Editor Toolbar */}
        {showToolbar && (
          <EditorToolbar
            onEditHeaderFooter={() => setShowHeaderFooterEditor(true)}
            onToggleRevisionPanel={() => setIsRevisionPanelOpen(!isRevisionPanelOpen)}
            isRevisionPanelOpen={isRevisionPanelOpen}
          />
        )}

        {/* Rich Text Editor with A4 ContentEditable */}
        <RichTextPlugin
          contentEditable={
            <A4ContentEditable
              orientation={orientation}
              zoom={zoom}
              {...(margins && { margins })}
              placeholder={<A4Placeholder>{placeholder}</A4Placeholder>}
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />

        {/* A4 Layout Plugin */}
        <A4LayoutPlugin
          orientation={orientation}
          zoom={zoom}
          {...(margins && { margins })}
        />

        {/* Core Plugins */}
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin validateUrl={validateUrl} />
        <LexicalTablePlugin />
        <TablePlugin showCellActions={true} />
        <TabIndentationPlugin />
        <HorizontalRulePlugin />
        <ImagePlugin uploadEndpoint="/api/upload" />

        {/* Floating Toolbar on Selection */}
        <FloatingToolbarPlugin showInTables={true} />

        {/* Folio Plugin for multi-page support */}
        <FolioPlugin autoSync={true} />

        {/* Folio Scroll Sync Plugin for two-way synchronization */}
        <FolioScrollSyncPlugin enabled={true} debounceMs={150} />

        {/* Header/Footer Plugin for page headers and footers */}
        <HeaderFooterPlugin autoInject={true} syncWithStore={true} />

        {/* Page Numbering Plugin for calculating page numbers */}
        <PageNumberingPlugin autoUpdate={true} debounceMs={100} />

        {/* Slot Plugin for dynamic variables */}
        <SlotPlugin validateOnSave={true} />

        {/* Comment Plugin for document commenting */}
        <CommentPlugin />

        {/* Comment Alignment Plugin for position tracking */}
        <CommentAlignmentPlugin
          onPositionsChange={triggerAlignmentRecalc}
          debounceMs={100}
          enabled={isCommentPanelOpen}
        />

        {/* Slash Menu Plugin for "/" commands */}
        <SlashMenuPlugin enabled={true} />

        {/* At Menu Plugin for "@" mentions */}
        <AtMenuPlugin enabled={true} />

        {/* Plus Menu Plugin for "+" dynamic fields */}
        <PlusMenuPlugin enabled={true} />

        {/* Track Changes Plugin for revisions */}
        <TrackChangesPlugin enabled={true} />

        {/* Change Handler */}
        {onChange && (
          <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
        )}

        {/* Header/Footer Editor Modal */}
        <HeaderFooterEditor
          isOpen={showHeaderFooterEditor}
          onClose={() => setShowHeaderFooterEditor(false)}
          folioId={null}
        />
      </div>

      {/* Comment Panel with Alignment */}
      <AlignedCommentPanel
        isOpen={isCommentPanelOpen}
        onToggle={() => setIsCommentPanelOpen(!isCommentPanelOpen)}
        onNewComment={handleNewComment}
        onScrollToThread={handleScrollToThread}
        editorContainer={editorContainerRef.current}
        onPositionsRecalculate={triggerAlignmentRecalc}
      />

      {/* Revision Panel */}
      <RevisionPanel
        isOpen={isRevisionPanelOpen}
        onClose={() => setIsRevisionPanelOpen(false)}
      />
    </div>
  );
}

/**
 * CerteafilesEditor - Main editor component with A4 faithful rendering
 */
export function CerteafilesEditor({
  initialState,
  editable = true,
  orientation = 'portrait',
  zoom = A4_CONSTANTS.ZOOM_DEFAULT,
  margins,
  placeholder = 'Start typing your document...',
  onChange,
  className = '',
  showToolbar = true,
  showCommentPanel = true,
}: CerteafilesEditorProps): JSX.Element {
  // Create editor configuration
  const editorConfig = createEditorConfig({ editable });

  // Add initial state if provided
  const initialConfig = initialState
    ? { ...editorConfig, editorState: initialState }
    : editorConfig;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={`certeafiles-editor-container h-full ${className}`}>
        <EditorInner
          orientation={orientation}
          zoom={zoom}
          margins={margins}
          placeholder={placeholder}
          onChange={onChange}
          showToolbar={showToolbar}
          showCommentPanel={showCommentPanel}
        />
      </div>
    </LexicalComposer>
  );
}

export default CerteafilesEditor;
