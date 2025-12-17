/**
 * OptimizedEditor - Performance-optimized editor component
 * Implements lazy loading, memoization, and performance tracking
 */
import { useCallback, useState, useRef, useEffect, memo, Suspense, lazy } from 'react';
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
import type { EditorState, LexicalEditor } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { A4ContentEditable, A4Placeholder } from './A4ContentEditable';
import { EditorToolbar } from './EditorToolbar';
import { A4LayoutPlugin } from '../../plugins/A4LayoutPlugin';
import { FolioPlugin } from '../../plugins/FolioPlugin';
import { FolioScrollSyncPlugin } from '../../plugins/FolioScrollSyncPlugin';
import { HeaderFooterPlugin } from '../../plugins/HeaderFooterPlugin';
import { PageNumberingPlugin } from '../../plugins/PageNumberingPlugin';
import { SlotPlugin } from '../../plugins/SlotPlugin';
import { CommentPlugin } from '../../plugins/CommentPlugin';
import { FloatingToolbarPlugin } from '../../plugins/FloatingToolbarPlugin';
import { HeaderFooterEditor } from '../HeaderFooter/HeaderFooterEditor';
import { CREATE_COMMENT_COMMAND } from '../../plugins/CommentPlugin';
import {
  DeferredPlugin,
  IdlePlugin,
  LazySlashMenuPlugin,
  LazyAtMenuPlugin,
  LazyPlusMenuPlugin,
  LazyTrackChangesPlugin,
  LazyCommentAlignmentPlugin,
  LazyImagePlugin,
  LazyTablePlugin,
} from '../../plugins/LazyPlugins';
import { createEditorConfig } from '../../config';
import { A4_CONSTANTS } from '../../utils/a4-constants';
import { performanceMonitor, METRIC_NAMES, PERFORMANCE_TARGETS } from '../../utils/performance';
import type { Orientation } from '../../utils/a4-constants';

// Lazy load heavy panel components
const LazyAlignedCommentPanel = lazy(() => import('../Comments/AlignedCommentPanel'));
const LazyRevisionPanel = lazy(() => import('../Revisions/RevisionPanel'));

/**
 * Props for OptimizedEditor
 */
export interface OptimizedEditorProps {
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
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
}

/**
 * Memoized EditorToolbar
 */
const MemoizedEditorToolbar = memo(EditorToolbar);

/**
 * Panel loading fallback
 */
function PanelLoadingFallback() {
  return (
    <div className="w-80 bg-gray-50 animate-pulse">
      <div className="h-12 bg-gray-200 mb-2" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/**
 * Inner component that has access to LexicalComposerContext
 */
const EditorInner = memo(function EditorInner({
  orientation,
  zoom,
  margins,
  placeholder,
  onChange,
  showToolbar,
  showCommentPanel,
  enablePerformanceMonitoring,
  onReady,
}: {
  orientation: Orientation;
  zoom: number;
  margins: { top?: number; right?: number; bottom?: number; left?: number } | undefined;
  placeholder: string;
  onChange: ((editorState: EditorState, editor: LexicalEditor) => void) | undefined;
  showToolbar: boolean;
  showCommentPanel: boolean;
  enablePerformanceMonitoring: boolean;
  onReady: ((editor: LexicalEditor) => void) | undefined;
}) {
  const [editor] = useLexicalComposerContext();

  // Track editor ready time
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.endMark(METRIC_NAMES.EDITOR_READY, PERFORMANCE_TARGETS.INITIAL_LOAD);
    }
    onReady?.(editor);
  }, [editor, enablePerformanceMonitoring, onReady]);

  // Header/Footer Editor modal state
  const [showHeaderFooterEditor, setShowHeaderFooterEditor] = useState(false);

  // Comment panel state - start closed for faster initial render
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(false);

  // Revision panel state
  const [isRevisionPanelOpen, setIsRevisionPanelOpen] = useState(false);

  // Editor container ref for alignment calculation
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Force recalculation trigger
  const [, setAlignmentTrigger] = useState(0);
  const triggerAlignmentRecalc = useCallback(() => {
    setAlignmentTrigger((n) => n + 1);
  }, []);

  // Handle editor changes with debouncing
  const handleChange = useCallback(
    (editorState: EditorState, editorInstance: LexicalEditor) => {
      onChange?.(editorState, editorInstance);
    },
    [onChange]
  );

  // URL validation for LinkPlugin - memoized
  const validateUrl = useCallback((url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle new comment from panel - memoized
  const handleNewComment = useCallback(() => {
    const content = window.prompt('Enter your comment:');
    if (content) {
      editor.dispatchCommand(CREATE_COMMENT_COMMAND, {
        content,
        type: 'remark',
      });
    }
  }, [editor]);

  // Handle scroll to thread - memoized
  const handleScrollToThread = useCallback((threadId: string) => {
    const commentElement = document.querySelector(
      `[data-comment-thread-id="${threadId}"]`
    );
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentElement.classList.add('comment-highlight-pulse');
      setTimeout(() => {
        commentElement.classList.remove('comment-highlight-pulse');
      }, 2000);
    }
  }, []);

  // Memoized toolbar handlers
  const handleEditHeaderFooter = useCallback(() => setShowHeaderFooterEditor(true), []);
  const handleToggleRevisionPanel = useCallback(() => setIsRevisionPanelOpen((prev) => !prev), []);
  const handleCloseHeaderFooter = useCallback(() => setShowHeaderFooterEditor(false), []);
  const handleCloseRevisionPanel = useCallback(() => setIsRevisionPanelOpen(false), []);
  const handleToggleCommentPanel = useCallback(() => setIsCommentPanelOpen((prev) => !prev), []);

  // Open comment panel after initial render if showCommentPanel is true
  useEffect(() => {
    if (showCommentPanel) {
      const timer = setTimeout(() => setIsCommentPanelOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, [showCommentPanel]);

  return (
    <div className="flex h-full">
      <div ref={editorContainerRef} className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Editor Toolbar - memoized */}
        {showToolbar && (
          <MemoizedEditorToolbar
            onEditHeaderFooter={handleEditHeaderFooter}
            onToggleRevisionPanel={handleToggleRevisionPanel}
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

        {/* Critical plugins - load immediately */}
        <A4LayoutPlugin
          orientation={orientation}
          zoom={zoom}
          {...(margins && { margins })}
        />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <LinkPlugin validateUrl={validateUrl} />
        <LexicalTablePlugin />
        <TabIndentationPlugin />
        <HorizontalRulePlugin />

        {/* High priority plugins - load after first render */}
        <FolioPlugin autoSync={true} />
        <FolioScrollSyncPlugin enabled={true} debounceMs={150} />
        <HeaderFooterPlugin autoInject={true} syncWithStore={true} />
        <PageNumberingPlugin autoUpdate={true} debounceMs={100} />
        <SlotPlugin validateOnSave={true} />
        <CommentPlugin />
        <FloatingToolbarPlugin showInTables={true} />

        {/* Medium priority plugins - deferred loading */}
        <DeferredPlugin delay={100}>
          <Suspense fallback={null}>
            <LazyTablePlugin showCellActions={true} />
          </Suspense>
        </DeferredPlugin>

        <DeferredPlugin delay={150}>
          <Suspense fallback={null}>
            <LazyImagePlugin uploadEndpoint="/api/upload" />
          </Suspense>
        </DeferredPlugin>

        {/* Low priority plugins - load during idle time */}
        <IdlePlugin timeout={2000}>
          <Suspense fallback={null}>
            <LazySlashMenuPlugin enabled={true} />
          </Suspense>
        </IdlePlugin>

        <IdlePlugin timeout={2000}>
          <Suspense fallback={null}>
            <LazyAtMenuPlugin enabled={true} />
          </Suspense>
        </IdlePlugin>

        <IdlePlugin timeout={2000}>
          <Suspense fallback={null}>
            <LazyPlusMenuPlugin enabled={true} />
          </Suspense>
        </IdlePlugin>

        <IdlePlugin timeout={2000}>
          <Suspense fallback={null}>
            <LazyTrackChangesPlugin enabled={true} />
          </Suspense>
        </IdlePlugin>

        {/* Comment alignment - only when panel is open */}
        {isCommentPanelOpen && (
          <DeferredPlugin delay={50}>
            <Suspense fallback={null}>
              <LazyCommentAlignmentPlugin
                onPositionsChange={triggerAlignmentRecalc}
                debounceMs={100}
                enabled={true}
              />
            </Suspense>
          </DeferredPlugin>
        )}

        {/* Change handler - debounced */}
        {onChange && (
          <ChangeHandler onChange={handleChange} />
        )}

        {/* Header/Footer Editor Modal */}
        <HeaderFooterEditor
          isOpen={showHeaderFooterEditor}
          onClose={handleCloseHeaderFooter}
          folioId={null}
        />
      </div>

      {/* Comment Panel - lazy loaded */}
      <Suspense fallback={<PanelLoadingFallback />}>
        <LazyAlignedCommentPanel
          isOpen={isCommentPanelOpen}
          onToggle={handleToggleCommentPanel}
          onNewComment={handleNewComment}
          onScrollToThread={handleScrollToThread}
          editorContainer={editorContainerRef.current}
          onPositionsRecalculate={triggerAlignmentRecalc}
        />
      </Suspense>

      {/* Revision Panel - lazy loaded */}
      {isRevisionPanelOpen && (
        <Suspense fallback={<PanelLoadingFallback />}>
          <LazyRevisionPanel
            isOpen={isRevisionPanelOpen}
            onClose={handleCloseRevisionPanel}
          />
        </Suspense>
      )}
    </div>
  );
});

/**
 * Debounced change handler component
 */
const ChangeHandler = memo(function ChangeHandler({
  onChange,
}: {
  onChange: (editorState: EditorState, editor: LexicalEditor) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      // Skip certain updates
      if (tags.has('history-merge') || tags.has('collaboration')) {
        return;
      }

      // Debounce onChange callback
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        onChange(editorState, editor);
      }, 100);
    });
  }, [editor, onChange]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return null;
});

/**
 * OptimizedEditor - Main editor component with performance optimizations
 */
export function OptimizedEditor({
  initialState,
  editable = true,
  orientation = 'portrait',
  zoom = A4_CONSTANTS.ZOOM_DEFAULT,
  margins,
  placeholder = 'Start typing your document...',
  onChange,
  onReady,
  className = '',
  showToolbar = true,
  showCommentPanel = true,
  enablePerformanceMonitoring = true,
}: OptimizedEditorProps): JSX.Element {
  // Start performance tracking
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.initialize();
      performanceMonitor.startMark(METRIC_NAMES.INITIAL_LOAD);
      performanceMonitor.startMark(METRIC_NAMES.EDITOR_READY);
    }
  }, [enablePerformanceMonitoring]);

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
          enablePerformanceMonitoring={enablePerformanceMonitoring}
          onReady={onReady}
        />
      </div>
    </LexicalComposer>
  );
}

export default OptimizedEditor;
