/**
 * CerteafilesEditor - Main WYSIWYG Editor Component
 * Per Constitution Section 2.4
 */
import { useCallback, useState, useEffect, useMemo } from 'react';
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
import { AutoPaginationPlugin } from '../../plugins/AutoPaginationPlugin';
import { HeaderFooterPlugin } from '../../plugins/HeaderFooterPlugin';
import { PageNumberingPlugin } from '../../plugins/PageNumberingPlugin';
import { SlotPlugin } from '../../plugins/SlotPlugin';
import { CommentPlugin } from '../../plugins/CommentPlugin';
import { CommentPanel } from '../Comments/CommentPanel';
import { CommentAlignmentPlugin } from '../../plugins/CommentAlignmentPlugin';
import { RevisionPanel } from '../Revisions/RevisionPanel';
import { SlashMenuPlugin } from '../../plugins/SlashMenuPlugin';
import { AtMenuPlugin } from '../../plugins/AtMenuPlugin';
import { PlusMenuPlugin } from '../../plugins/PlusMenuPlugin';
import { TrackChangesPlugin } from '../../plugins/TrackChangesPlugin';
import { PDFBackgroundPlugin } from '../../plugins/PDFBackgroundPlugin';
import { CollaborationPlugin } from '../../plugins/CollaborationPlugin';
import { SpellCheckPlugin, SpellCheckMenu } from '../../plugins/SpellCheckPlugin';
import { SpecialTablePlugin } from '../../plugins/SpecialTablePlugin';
import { FootnotePlugin } from '../../plugins/FootnotePlugin';
import { SymbolPickerPlugin } from '../../plugins/SymbolPickerPlugin';
import { ExportPlugin } from '../../plugins/ExportPlugin';
import { QueryBuilderPlugin } from '../../plugins/QueryBuilderPlugin';
import { InitialContentPlugin } from '../../plugins/InitialContentPlugin';
import { VersionHistoryPlugin } from '../../plugins/VersionHistoryPlugin';
import { KeyboardShortcutsPlugin } from '../../plugins/KeyboardShortcutsPlugin';
import { HeaderFooterEditorModal } from '../HeaderFooter';
import type { CollaborationUser, ConnectionStatus, CollaborationState } from '../../types/collaboration';
import { createEditorConfig } from '../../config';
import { A4_CONSTANTS } from '../../utils/a4-constants';
import type { Orientation } from '../../utils/a4-constants';
import { useFolioStore } from '../../stores/folioStore';

/**
 * Props for CerteafilesEditor
 */
export interface CerteafilesEditorProps {
  /** Initial editor state as JSON string */
  initialState?: string | undefined;
  /** Initial text content to load (plain text) */
  initialTextContent?: string;
  /** Callback when initial content is loaded */
  onContentLoaded?: () => void;
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
  /** Whether to show the status bar at bottom */
  showStatusBar?: boolean;
  /** Whether to show the comment panel */
  showCommentPanel?: boolean;
  /** Whether to show the revision panel */
  showRevisionPanel?: boolean;
  /** Callback when revision panel toggle is requested */
  onToggleRevisionPanel?: () => void;
  /** Whether revision panel is open (controlled) */
  isRevisionPanelOpen?: boolean;
  /** Callback when comment button is clicked in floating toolbar */
  onCommentClick?: () => void;
  /** Enable real-time collaboration */
  enableCollaboration?: boolean;
  /** Collaboration room ID */
  collaborationRoomId?: string;
  /** Collaboration user info */
  collaborationUser?: { id?: string; name?: string; color?: string };
  /** Callback when collaboration status changes */
  onCollaborationStatusChange?: (status: ConnectionStatus) => void;
  /** Callback when collaboration users change */
  onCollaborationUsersChange?: (users: CollaborationUser[]) => void;
  /** Callback when collaboration state changes */
  onCollaborationStateChange?: (state: CollaborationState) => void;
  /** Collaboration status (controlled - overrides internal state when provided) */
  controlledCollaborationStatus?: ConnectionStatus;
  /** Collaboration users (controlled - overrides internal state when provided) */
  controlledCollaborationUsers?: CollaborationUser[];
  /** Whether collaboration is synced (controlled - overrides internal state when provided) */
  controlledCollaborationSynced?: boolean;
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
  initialTextContent,
  onContentLoaded,
  onChange,
  onReady,
  showToolbar,
  showStatusBar,
  showCommentPanel,
  showRevisionPanel,
  onToggleRevisionPanel,
  isRevisionPanelOpen,
  onCommentClick,
  enableCollaboration,
  collaborationRoomId,
  collaborationUser,
  onCollaborationStatusChange,
  onCollaborationUsersChange,
  onCollaborationStateChange,
  controlledCollaborationStatus,
  controlledCollaborationUsers,
  controlledCollaborationSynced,
}: {
  orientation: Orientation;
  zoom: number;
  margins: { top?: number; right?: number; bottom?: number; left?: number } | undefined;
  placeholder: string;
  initialTextContent: string | undefined;
  onContentLoaded: (() => void) | undefined;
  onChange: ((editorState: EditorState, editor: LexicalEditor) => void) | undefined;
  onReady: ((editor: LexicalEditor) => void) | undefined;
  showToolbar: boolean;
  showStatusBar: boolean;
  showCommentPanel: boolean;
  showRevisionPanel: boolean;
  onToggleRevisionPanel: (() => void) | undefined;
  isRevisionPanelOpen: boolean;
  onCommentClick: (() => void) | undefined;
  enableCollaboration: boolean;
  collaborationRoomId: string | undefined;
  collaborationUser: { id?: string; name?: string; color?: string } | undefined;
  onCollaborationStatusChange: ((status: ConnectionStatus) => void) | undefined;
  onCollaborationUsersChange: ((users: CollaborationUser[]) => void) | undefined;
  onCollaborationStateChange: ((state: CollaborationState) => void) | undefined;
  controlledCollaborationStatus: ConnectionStatus | undefined;
  controlledCollaborationUsers: CollaborationUser[] | undefined;
  controlledCollaborationSynced: boolean | undefined;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  // Call onReady when editor is available
  useEffect(() => {
    if (editor && onReady) {
      onReady(editor);
    }
  }, [editor, onReady]);

  // Comment panel state
  const [isCommentPanelOpen, setIsCommentPanelOpen] = useState(showCommentPanel);

  // Header/Footer editor modal state
  const [isHeaderFooterEditorOpen, setIsHeaderFooterEditorOpen] = useState(false);

  // Collaboration state for status bar (internal state, can be overridden by controlled props)
  const [internalCollaborationStatus, setInternalCollaborationStatus] = useState<ConnectionStatus>('disconnected');
  const [internalCollaborationUsers, setInternalCollaborationUsers] = useState<CollaborationUser[]>([]);
  const [internalIsSynced, setInternalIsSynced] = useState(false);

  // Use controlled props when provided, otherwise fall back to internal state
  // This unifies the source of truth - parent can control the state if needed
  const collaborationStatus = controlledCollaborationStatus ?? internalCollaborationStatus;
  const collaborationUsers = controlledCollaborationUsers ?? internalCollaborationUsers;
  const isSynced = controlledCollaborationSynced ?? internalIsSynced;

  // Handle collaboration callbacks - update internal state and notify parent
  const handleCollaborationStatusChange = useCallback((status: ConnectionStatus) => {
    setInternalCollaborationStatus(status);
    onCollaborationStatusChange?.(status);
  }, [onCollaborationStatusChange]);

  const handleCollaborationUsersChange = useCallback((users: CollaborationUser[]) => {
    setInternalCollaborationUsers(users);
    onCollaborationUsersChange?.(users);
  }, [onCollaborationUsersChange]);

  const handleCollaborationStateChange = useCallback((state: CollaborationState) => {
    setInternalCollaborationStatus(state.status);
    setInternalCollaborationUsers(state.users);
    setInternalIsSynced(state.isSynced);
    onCollaborationStateChange?.(state);
  }, [onCollaborationStateChange]);

  // Force recalculation trigger for comment alignment
  const [, setAlignmentTrigger] = useState(0);
  const triggerAlignmentRecalc = useCallback(() => {
    setAlignmentTrigger((n) => n + 1);
  }, []);

  // Sync orientation prop with active folio in store
  useEffect(() => {
    const { activeFolioId, updateFolio } = useFolioStore.getState();
    if (activeFolioId) {
      updateFolio(activeFolioId, { orientation });
      console.log('[CerteafilesEditor] Syncing orientation to folio store:', activeFolioId, orientation);
    }
  }, [orientation]);

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
          // Re-query the element in case it was removed/replaced during the timeout
          const element = document.querySelector(
            `[data-comment-thread-id="${threadId}"]`
          );
          if (element) {
            element.classList.remove('comment-highlight-pulse');
          }
        }, 2000);
      }
    },
    []
  );

  // Get active folio orientation from store for dynamic page width
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const foliosMap = useFolioStore((state) => state.folios);
  const activeFolioOrientation = useMemo(() => {
    if (activeFolioId && foliosMap.has(activeFolioId)) {
      return foliosMap.get(activeFolioId)?.orientation || orientation;
    }
    return orientation;
  }, [activeFolioId, foliosMap, orientation]);

  // Calculate page width based on active folio orientation (not prop)
  // This ensures the container adapts when folio orientation changes
  const pageWidth = activeFolioOrientation === 'landscape' ? 1123 : 794;

  // Get status info for display
  const getStatusInfo = () => {
    switch (collaborationStatus) {
      case 'connected':
        return { color: 'bg-green-500', label: 'Connecté', icon: '●' };
      case 'connecting':
        return { color: 'bg-yellow-500 animate-pulse', label: 'Connexion...', icon: '○' };
      case 'reconnecting':
        return { color: 'bg-orange-500 animate-pulse', label: 'Reconnexion...', icon: '○' };
      case 'error':
        return { color: 'bg-red-500', label: 'Erreur', icon: '✕' };
      default:
        return { color: 'bg-gray-400', label: 'Déconnecté', icon: '○' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Main content area - horizontal flex layout */}
      <div className="flex flex-1 min-h-0">
        {/* Editor scrollable container - takes remaining space, with border */}
        <div
          className="flex-1 min-w-0 overflow-auto editor-scroll border-2 border-theme-border-subtle rounded-lg m-1"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
          }}
        >
          {/* Toolbar - sticky at top, centered, independent of page width */}
          {showToolbar && (
            <div
              className="sticky top-0 z-20 flex justify-center"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                paddingTop: '8px',
                paddingBottom: '8px',
                overflow: 'visible',
              }}
            >
              <div
                className="bg-white rounded-xl shadow-lg border border-slate-200/60"
                style={{
                  overflow: 'visible',
                }}
              >
                <EditorToolbar
                  onEditHeaderFooter={() => setIsHeaderFooterEditorOpen(true)}
                />
              </div>
            </div>
          )}

          {/* Inner container for centering page - has min-width to ensure scrollbar appears when zoomed */}
          <div
            className="flex flex-col items-center min-h-full py-6 px-4"
            style={{
              minWidth: `${Math.max(pageWidth * zoom + 64, 100)}px`,
            }}
          >
            {/* Rich Text Editor with A4 ContentEditable - centered */}
            <div
              className="flex-shrink-0"
              style={{
                width: `${pageWidth * zoom}px`,
                minWidth: `${pageWidth * zoom}px`,
                transition: 'width 0.3s ease, min-width 0.3s ease',
              }}
            >
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
            </div>
          </div>
        </div>

        {/* Comment Panel - Google Docs style, fixed width, no overlap */}
        {showCommentPanel && (
          <div className="flex-shrink-0 border-l border-theme-border-subtle">
            <CommentPanel
              isOpen={isCommentPanelOpen}
              onToggle={() => setIsCommentPanelOpen(!isCommentPanelOpen)}
              onScrollToThread={handleScrollToThread}
              editor={editor}
            />
          </div>
        )}

        {/* Revision Panel - Track Changes, only if enabled */}
        {showRevisionPanel && (
          <div className="flex-shrink-0 border-l border-theme-border-subtle">
            <RevisionPanel
              isOpen={isRevisionPanelOpen}
              onClose={() => onToggleRevisionPanel?.()}
            />
          </div>
        )}

      </div>

      {/* Status Bar at bottom - only if enabled */}
      {showStatusBar && (
        <div className="h-8 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-xs">
          {/* Left side - Spell check */}
          <div className="flex items-center gap-2">
            <SpellCheckMenu />
          </div>

          {/* Right side - Collaboration status */}
          {enableCollaboration && (
            <div className="flex items-center gap-3">
              {/* Connected users avatars */}
              {collaborationUsers.length > 0 && (
                <div className="flex items-center -space-x-2">
                  {collaborationUsers.slice(0, 4).map((user) => (
                    <div
                      key={user.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                      style={{ backgroundColor: user.color }}
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {collaborationUsers.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                      +{collaborationUsers.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* Connection status */}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${statusInfo.color}`} />
                <span className="text-gray-600">{statusInfo.label}</span>
                {collaborationStatus === 'connected' && (
                  <span className="text-gray-400">
                    {isSynced ? '(sync)' : '(...)'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
      <FloatingToolbarPlugin showInTables={true} onCommentClick={onCommentClick} />

      {/* Folio Plugin for multi-page support */}
      <FolioPlugin autoSync={true} />

      {/* Folio Scroll Sync Plugin for two-way synchronization */}
      <FolioScrollSyncPlugin enabled={true} debounceMs={150} />

      {/* Auto Pagination Plugin for automatic page breaks */}
      <AutoPaginationPlugin enabled={true} debounceMs={500} />

      {/* Header/Footer Plugin for page headers and footers */}
      <HeaderFooterPlugin autoInject={true} syncWithStore={true} />

      {/* Page Numbering Plugin for calculating page numbers */}
      <PageNumberingPlugin autoUpdate={true} debounceMs={100} />

      {/* Slot Plugin for dynamic variables */}
      <SlotPlugin validateOnSave={true} />

      {/* Comment Plugin for document commenting - always loaded */}
      <CommentPlugin />

      {/* Comment Alignment Plugin for position tracking - only if panel shown */}
      {showCommentPanel && (
        <CommentAlignmentPlugin
          onPositionsChange={triggerAlignmentRecalc}
          debounceMs={100}
          enabled={isCommentPanelOpen}
        />
      )}

      {/* Slash Menu Plugin for "/" commands */}
      <SlashMenuPlugin enabled={true} />

      {/* At Menu Plugin for "@" mentions */}
      <AtMenuPlugin enabled={true} />

      {/* Plus Menu Plugin for "+" dynamic fields */}
      <PlusMenuPlugin enabled={true} />

      {/* Track Changes Plugin for revisions */}
      <TrackChangesPlugin enabled={true} />

      {/* Spell Check Plugin for multilingual spell checking */}
      <SpellCheckPlugin enabled={true} />

      {/* Special Table Plugin for business tables */}
      <SpecialTablePlugin />

      {/* Footnote Plugin for page footnotes */}
      <FootnotePlugin enabled={true} showPanel={true} />

      {/* Symbol Picker Plugin for special characters */}
      <SymbolPickerPlugin enabled={true} />

      {/* Export Plugin for PDF and DOCX export */}
      <ExportPlugin
        enabled={true}
        documentTitle="Document"
        totalPages={1}
      />

      {/* Query Builder Plugin for visual SQL query building */}
      <QueryBuilderPlugin enabled={true} />

      {/* Version History Plugin for document versioning */}
      <VersionHistoryPlugin enabled={true} autoSaveIntervalMinutes={5} />

      {/* Keyboard Shortcuts Plugin for shortcut management */}
      <KeyboardShortcutsPlugin enabled={true} />

      {/* PDF Background Plugin for imported PDF pages */}
      <PDFBackgroundPlugin />

      {/* Collaboration Plugin for real-time editing */}
      {enableCollaboration && collaborationRoomId && (
        <CollaborationPlugin
          roomId={collaborationRoomId}
          user={collaborationUser}
          enabled={enableCollaboration}
          onStatusChange={handleCollaborationStatusChange}
          onUsersChange={handleCollaborationUsersChange}
          onStateChange={handleCollaborationStateChange}
        />
      )}

      {/* Initial Content Plugin - loads text content on mount */}
      {initialTextContent && (
        <InitialContentPlugin
          content={initialTextContent}
          onContentLoaded={onContentLoaded}
        />
      )}

      {/* Change Handler */}
      {onChange && (
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      )}

      {/* Header/Footer Editor Modal */}
      <HeaderFooterEditorModal
        isOpen={isHeaderFooterEditorOpen}
        onClose={() => setIsHeaderFooterEditorOpen(false)}
      />
    </div>
  );
}

/**
 * CerteafilesEditor - Main editor component with A4 faithful rendering
 */
export function CerteafilesEditor({
  initialState,
  initialTextContent,
  onContentLoaded,
  editable = true,
  orientation = 'portrait',
  zoom = A4_CONSTANTS.ZOOM_DEFAULT,
  margins,
  placeholder = 'Start typing your document...',
  onChange,
  onReady,
  className = '',
  showToolbar = true,
  showStatusBar = true,
  showCommentPanel = true,
  showRevisionPanel = false,
  onToggleRevisionPanel,
  isRevisionPanelOpen = false,
  onCommentClick,
  enableCollaboration = false,
  collaborationRoomId,
  collaborationUser,
  onCollaborationStatusChange,
  onCollaborationUsersChange,
  onCollaborationStateChange,
  controlledCollaborationStatus,
  controlledCollaborationUsers,
  controlledCollaborationSynced,
}: CerteafilesEditorProps): JSX.Element {
  // Create editor configuration
  const editorConfig = createEditorConfig({ editable });

  // IMPORTANT: When collaboration is enabled, editorState MUST be null
  // so the collaboration plugin can manage the initial state from Yjs
  // See: https://lexical.dev/docs/collaboration/react
  const initialConfig = enableCollaboration
    ? { ...editorConfig, editorState: null }
    : initialState
      ? { ...editorConfig, editorState: initialState }
      : editorConfig;

  // Use a key to force remount when collaboration mode changes
  // This ensures a clean state when switching between local and collaborative editing
  const composerKey = enableCollaboration ? `collab-${collaborationRoomId}` : 'local';

  return (
    <LexicalComposer key={composerKey} initialConfig={initialConfig}>
      <div className={`certeafiles-editor-container h-full ${className}`}>
        <EditorInner
          orientation={orientation}
          zoom={zoom}
          margins={margins}
          placeholder={placeholder}
          initialTextContent={initialTextContent}
          onContentLoaded={onContentLoaded}
          onChange={onChange}
          onReady={onReady}
          showToolbar={showToolbar}
          showStatusBar={showStatusBar}
          showCommentPanel={showCommentPanel}
          showRevisionPanel={showRevisionPanel}
          onToggleRevisionPanel={onToggleRevisionPanel}
          isRevisionPanelOpen={isRevisionPanelOpen}
          onCommentClick={onCommentClick}
          enableCollaboration={enableCollaboration}
          collaborationRoomId={collaborationRoomId}
          collaborationUser={collaborationUser}
          onCollaborationStatusChange={onCollaborationStatusChange}
          onCollaborationUsersChange={onCollaborationUsersChange}
          onCollaborationStateChange={onCollaborationStateChange}
          controlledCollaborationStatus={controlledCollaborationStatus}
          controlledCollaborationUsers={controlledCollaborationUsers}
          controlledCollaborationSynced={controlledCollaborationSynced}
        />
      </div>
    </LexicalComposer>
  );
}

export default CerteafilesEditor;
