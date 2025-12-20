/**
 * PlaygroundPage - Editor Playground with API Documentation
 * Demonstrates all editor features and available APIs
 */
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Code,
  Settings,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Zap,
  Box,
  Database,
  Layers,
  Terminal,
  Keyboard,
  Tag,
  RefreshCw,
  Save,
  FileUp,
  FileType,
  FileDown,
  CheckCircle,
  History,
} from 'lucide-react';
import type { EditorState, LexicalEditor } from 'lexical';
import { CerteafilesEditor } from '../../components/Editor/CerteafilesEditor';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { FolioPanel } from '../../components/Folios';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useFolioThumbnails } from '../../hooks/useFolioThumbnails';
import { useRevisionStore } from '../../stores/revisionStore';
import { useFolioStore } from '../../stores/folioStore';
import { DOCUMENT_TEMPLATES, getDocumentContent } from '../data/sampleDocuments';
import { RICH_DOCUMENTS, getRichDocument } from '../data/richDocuments';
import { MASSIVE_DOCUMENTS, getMassiveDocument } from '../data/massiveDocumentGenerator';
import type { Orientation } from '../../utils/a4-constants';
import { exportToPDF } from '../../utils/pdfExport';

// Version info
const VERSION = '1.0.0';
const BUILD_DATE = '2024-12';

/**
 * API Category data
 */
interface APICategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: APIItem[];
}

interface APIItem {
  name: string;
  type: 'prop' | 'hook' | 'store' | 'plugin' | 'node' | 'util' | 'shortcut';
  signature?: string;
  description: string;
  example?: string;
}

/**
 * Keyboard Shortcuts
 */
const KEYBOARD_SHORTCUTS: APIItem[] = [
  { name: 'Ctrl/Cmd + B', type: 'shortcut', description: 'Bold text' },
  { name: 'Ctrl/Cmd + I', type: 'shortcut', description: 'Italic text' },
  { name: 'Ctrl/Cmd + U', type: 'shortcut', description: 'Underline text' },
  { name: 'Ctrl/Cmd + Z', type: 'shortcut', description: 'Undo' },
  { name: 'Ctrl/Cmd + Shift + Z', type: 'shortcut', description: 'Redo' },
  { name: 'Ctrl/Cmd + K', type: 'shortcut', description: 'Insert link' },
  { name: 'Ctrl/Cmd + Shift + X', type: 'shortcut', description: 'Strikethrough' },
  { name: 'Tab', type: 'shortcut', description: 'Indent list item / Insert tab' },
  { name: 'Shift + Tab', type: 'shortcut', description: 'Outdent list item' },
  { name: '/', type: 'shortcut', description: 'Open slash command menu' },
  { name: '@', type: 'shortcut', description: 'Open mention menu' },
  { name: '+', type: 'shortcut', description: 'Open dynamic field menu' },
  { name: 'Enter', type: 'shortcut', description: 'New paragraph' },
  { name: 'Shift + Enter', type: 'shortcut', description: 'Soft line break' },
];

/**
 * Editor Props Documentation
 */
const EDITOR_PROPS: APIItem[] = [
  {
    name: 'initialState',
    type: 'prop',
    signature: 'string | undefined',
    description: 'Initial editor state as JSON string (Lexical serialized state)',
    example: 'initialState={JSON.stringify(savedState)}',
  },
  {
    name: 'initialTextContent',
    type: 'prop',
    signature: 'string | undefined',
    description: 'Initial plain text content to load into the editor',
    example: 'initialTextContent="Hello World"',
  },
  {
    name: 'editable',
    type: 'prop',
    signature: 'boolean',
    description: 'Whether the editor is editable (default: true)',
    example: 'editable={false}',
  },
  {
    name: 'orientation',
    type: 'prop',
    signature: "'portrait' | 'landscape'",
    description: 'Page orientation for A4 layout (default: portrait)',
    example: "orientation='landscape'",
  },
  {
    name: 'zoom',
    type: 'prop',
    signature: 'number',
    description: 'Zoom level from 0.5 to 2.0 (default: 0.75)',
    example: 'zoom={0.8}',
  },
  {
    name: 'placeholder',
    type: 'prop',
    signature: 'string',
    description: 'Placeholder text when editor is empty',
    example: 'placeholder="Start typing..."',
  },
  {
    name: 'onChange',
    type: 'prop',
    signature: '(editorState: EditorState, editor: LexicalEditor) => void',
    description: 'Callback fired when editor content changes',
    example: 'onChange={(state, editor) => console.log(state)}',
  },
  {
    name: 'onContentLoaded',
    type: 'prop',
    signature: '() => void',
    description: 'Callback fired when initial content is loaded',
    example: 'onContentLoaded={() => setLoading(false)}',
  },
  {
    name: 'showToolbar',
    type: 'prop',
    signature: 'boolean',
    description: 'Show/hide the formatting toolbar (default: true)',
    example: 'showToolbar={false}',
  },
  {
    name: 'showCommentPanel',
    type: 'prop',
    signature: 'boolean',
    description: 'Show/hide the comment panel (default: true)',
    example: 'showCommentPanel={true}',
  },
  {
    name: 'enableCollaboration',
    type: 'prop',
    signature: 'boolean',
    description: 'Enable real-time collaboration (default: false)',
    example: 'enableCollaboration={true}',
  },
  {
    name: 'collaborationRoomId',
    type: 'prop',
    signature: 'string',
    description: 'Room ID for collaboration session',
    example: 'collaborationRoomId="doc-123"',
  },
  {
    name: 'collaborationUser',
    type: 'prop',
    signature: '{ id?: string; name?: string; color?: string }',
    description: 'Current user info for collaboration',
    example: 'collaborationUser={{ name: "John", color: "#3B82F6" }}',
  },
];

/**
 * Available Hooks
 */
const HOOKS: APIItem[] = [
  {
    name: 'useCollaboration',
    type: 'hook',
    signature: '(options: { roomId: string; userName?: string }) => UseCollaborationReturn',
    description: 'Hook for managing real-time collaboration state and users',
    example: 'const { allUsers, state, currentUser } = useCollaboration({ roomId: "doc-1" })',
  },
  {
    name: 'useFolioStore',
    type: 'hook',
    signature: '() => FolioStoreState',
    description: 'Zustand store for managing folios (pages)',
    example: 'const { folios, activeFolioId, createFolio } = useFolioStore()',
  },
  {
    name: 'useFolioThumbnails',
    type: 'hook',
    signature: '(options?: UseFolioThumbnailsOptions) => UseFolioThumbnailsReturn',
    description: 'Hook for generating and managing folio thumbnails',
    example: 'const { thumbnails, generateThumbnail } = useFolioThumbnails()',
  },
  {
    name: 'useRevisionStore',
    type: 'hook',
    signature: '() => RevisionStoreState',
    description: 'Zustand store for track changes/revisions',
    example: 'const { trackingEnabled, toggleTracking, revisions } = useRevisionStore()',
  },
  {
    name: 'useCommentStore',
    type: 'hook',
    signature: '() => CommentStoreState',
    description: 'Zustand store for managing comments and threads',
    example: 'const { threads, addThread, resolveThread } = useCommentStore()',
  },
  {
    name: 'useSlotStore',
    type: 'hook',
    signature: '() => SlotStoreState',
    description: 'Zustand store for dynamic variable slots',
    example: 'const { slots, setSlotValue, validateSlots } = useSlotStore()',
  },
];

/**
 * Available Plugins
 */
const PLUGINS: APIItem[] = [
  {
    name: 'FolioPlugin',
    type: 'plugin',
    description: 'Manages A4 page (folio) nodes and syncs with store',
    example: '<FolioPlugin autoSync={true} />',
  },
  {
    name: 'TrackChangesPlugin',
    type: 'plugin',
    description: 'Enables track changes with insertions/deletions',
    example: '<TrackChangesPlugin enabled={true} />',
  },
  {
    name: 'CommentPlugin',
    type: 'plugin',
    description: 'Enables inline comments and threads',
    example: '<CommentPlugin />',
  },
  {
    name: 'SlotPlugin',
    type: 'plugin',
    description: 'Manages dynamic variable slots (placeholders)',
    example: '<SlotPlugin validateOnSave={true} />',
  },
  {
    name: 'CollaborationPlugin',
    type: 'plugin',
    description: 'Real-time collaboration via Yjs/WebSocket',
    example: '<CollaborationPlugin roomId="doc-1" enabled={true} />',
  },
  {
    name: 'SlashMenuPlugin',
    type: 'plugin',
    description: 'Slash command menu (type / for commands)',
    example: '<SlashMenuPlugin enabled={true} />',
  },
  {
    name: 'AtMenuPlugin',
    type: 'plugin',
    description: 'Mention menu (type @ for mentions)',
    example: '<AtMenuPlugin enabled={true} />',
  },
  {
    name: 'ImagePlugin',
    type: 'plugin',
    description: 'Image insertion and upload support',
    example: '<ImagePlugin uploadEndpoint="/api/upload" />',
  },
  {
    name: 'TablePlugin',
    type: 'plugin',
    description: 'Table creation and editing',
    example: '<TablePlugin showCellActions={true} />',
  },
  {
    name: 'ExportPlugin',
    type: 'plugin',
    description: 'Export to PDF/DOCX formats',
    example: '<ExportPlugin enabled={true} documentTitle="Doc" />',
  },
  {
    name: 'SpellCheckPlugin',
    type: 'plugin',
    description: 'Multilingual spell checking',
    example: '<SpellCheckPlugin enabled={true} />',
  },
  {
    name: 'FootnotePlugin',
    type: 'plugin',
    description: 'Footnote support with automatic numbering',
    example: '<FootnotePlugin enabled={true} showPanel={true} />',
  },
  {
    name: 'HeaderFooterPlugin',
    type: 'plugin',
    description: 'Page header and footer management',
    example: '<HeaderFooterPlugin autoInject={true} syncWithStore={true} />',
  },
  {
    name: 'PageNumberingPlugin',
    type: 'plugin',
    description: 'Automatic page numbering',
    example: '<PageNumberingPlugin autoUpdate={true} />',
  },
  {
    name: 'QueryBuilderPlugin',
    type: 'plugin',
    description: 'Visual SQL query builder for database interactions',
    example: '<QueryBuilderPlugin enabled={true} />',
  },
  {
    name: 'FolioPanel',
    type: 'plugin',
    description: 'Page thumbnail panel with navigation (demo component)',
    example: '<FolioPanel thumbnails={thumbnails} zoom={zoom} onZoomChange={setZoom} />',
  },
  {
    name: 'PDFBackgroundPlugin',
    type: 'plugin',
    description: 'Import and display PDF pages as editable backgrounds',
    example: '<PDFBackgroundPlugin />',
  },
  {
    name: 'SymbolPickerPlugin',
    type: 'plugin',
    description: 'Special character and symbol insertion',
    example: '<SymbolPickerPlugin enabled={true} />',
  },
];

/**
 * Custom Nodes
 */
const NODES: APIItem[] = [
  {
    name: 'FolioNode',
    type: 'node',
    description: 'A4 page container with dimensions and orientation',
    example: '$createFolioNode({ folioId: "1", folioIndex: 0 })',
  },
  {
    name: 'SlotNode',
    type: 'node',
    description: 'Dynamic variable placeholder',
    example: '$createSlotNode({ slotId: "name", defaultValue: "John" })',
  },
  {
    name: 'CommentNode',
    type: 'node',
    description: 'Text marked with a comment thread',
    example: '$createCommentNode(threadId)',
  },
  {
    name: 'ImageNode',
    type: 'node',
    description: 'Image with caption and alignment',
    example: '$createImageNode({ src: "url", altText: "desc" })',
  },
  {
    name: 'FootnoteNode',
    type: 'node',
    description: 'Footnote reference in text',
    example: '$createFootnoteNode({ content: "Reference text" })',
  },
  {
    name: 'MentionNode',
    type: 'node',
    description: 'User mention (@username)',
    example: '$createMentionNode({ mentionName: "john" })',
  },
  {
    name: 'RevisionNode',
    type: 'node',
    description: 'Track change insertion/deletion mark',
    example: '$createRevisionNode({ type: "insertion", author: "user" })',
  },
];

/**
 * Utility Functions
 */
const UTILS: APIItem[] = [
  {
    name: 'exportToPDF',
    type: 'util',
    signature: '(options: PDFExportOptions) => Promise<void>',
    description: 'Export document to PDF format',
    example: 'await exportToPDF({ title: "Document", quality: 0.95 })',
  },
  {
    name: 'exportToDocx',
    type: 'util',
    signature: '(options: DocxExportOptions) => Promise<Blob>',
    description: 'Export document to DOCX format',
    example: 'const blob = await exportToDocx({ title: "Document" })',
  },
  {
    name: 'getPageDimensions',
    type: 'util',
    signature: "(orientation: 'portrait' | 'landscape') => Dimensions",
    description: 'Get A4 page dimensions in pixels',
    example: 'const { width, height } = getPageDimensions("portrait")',
  },
];

/**
 * All API Categories
 */
const API_CATEGORIES: APICategory[] = [
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: <Keyboard className="w-4 h-4" />,
    items: KEYBOARD_SHORTCUTS,
  },
  {
    id: 'props',
    title: 'Editor Props',
    icon: <Settings className="w-4 h-4" />,
    items: EDITOR_PROPS,
  },
  {
    id: 'hooks',
    title: 'Hooks & Stores',
    icon: <Database className="w-4 h-4" />,
    items: HOOKS,
  },
  {
    id: 'plugins',
    title: 'Plugins',
    icon: <Zap className="w-4 h-4" />,
    items: PLUGINS,
  },
  {
    id: 'nodes',
    title: 'Custom Nodes',
    icon: <Box className="w-4 h-4" />,
    items: NODES,
  },
  {
    id: 'utils',
    title: 'Utilities',
    icon: <Terminal className="w-4 h-4" />,
    items: UTILS,
  },
];

/**
 * Code snippet component with copy button
 */
function CodeSnippet({ code, language = 'tsx' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 text-xs p-3 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-slate-300" />
        )}
      </button>
    </div>
  );
}

/**
 * API Item component
 */
function APIItemCard({ item }: { item: APIItem }) {
  const [expanded, setExpanded] = useState(false);

  const typeColors: Record<string, string> = {
    prop: 'bg-blue-100 text-blue-700',
    hook: 'bg-purple-100 text-purple-700',
    store: 'bg-indigo-100 text-indigo-700',
    plugin: 'bg-green-100 text-green-700',
    node: 'bg-orange-100 text-orange-700',
    util: 'bg-cyan-100 text-cyan-700',
    shortcut: 'bg-slate-100 text-slate-700',
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColors[item.type] || 'bg-slate-100 text-slate-700'}`}>
          {item.type}
        </span>
        <span className="font-mono text-sm font-medium text-slate-800">{item.name}</span>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 bg-slate-50">
          {item.signature && (
            <div className="pt-2">
              <span className="text-xs text-slate-500">Signature:</span>
              <code className="block mt-1 text-xs bg-white p-2 rounded border border-slate-200 text-slate-700">
                {item.signature}
              </code>
            </div>
          )}
          <p className="text-sm text-slate-600 pt-2">{item.description}</p>
          {item.example && (
            <div className="pt-2">
              <span className="text-xs text-slate-500">Example:</span>
              <CodeSnippet code={item.example} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * API Category Section
 */
function APICategorySection({ category }: { category: APICategory }) {
  const [expanded, setExpanded] = useState(category.id === 'shortcuts');

  return (
    <div className="mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600">{category.icon}</span>
        <span className="font-semibold text-slate-800">{category.title}</span>
        <span className="text-xs text-slate-400 ml-1">({category.items.length})</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
        )}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {category.items.map((item) => (
            <APIItemCard key={item.name} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * PlaygroundPage - Main component
 */
export function PlaygroundPage() {
  // Editor state
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [zoom, setZoom] = useState(0.65);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  // Collaboration is disabled - enabling it dynamically causes content sync issues
  // To use collaboration, it should be enabled from the start with a specific roomId
  const [enableCollaboration] = useState(false);
  const [editable, setEditable] = useState(true);
  const [editorKey, setEditorKey] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [initialContent, setInitialContent] = useState<string>('');
  const [initialEditorState, setInitialEditorState] = useState<string | undefined>(undefined);
  const [showFolioPanel, setShowFolioPanel] = useState(false);
  const [showPagination, setShowPagination] = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);

  // Track changes store
  const { trackingEnabled, toggleTracking, documentValidated, toggleDocumentValidated } = useRevisionStore();

  // Folio thumbnails
  const { thumbnails, isLoading: isLoadingThumbnails, progress: thumbnailProgress } = useFolioThumbnails();

  // Loading state for massive documents
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle document selection - clears folioStore first to prevent header/footer chaos
  const handleDocumentChange = useCallback((docId: string) => {
    // Clear the folio store first to prevent stale data
    useFolioStore.getState().clear();

    setSelectedDocument(docId);
    if (docId) {
      // Check if it's a massive document first
      const massiveDoc = getMassiveDocument(docId);
      if (massiveDoc) {
        setIsGenerating(true);
        // Use setTimeout to allow UI to update before heavy computation
        setTimeout(() => {
          try {
            const generatedState = massiveDoc.generator();
            setInitialEditorState(generatedState);
            setInitialContent('');
            // Small delay after clearing store before remount
            setTimeout(() => {
              setEditorKey((k) => k + 1);
            }, 50);
          } finally {
            setIsGenerating(false);
          }
        }, 100);
        return;
      }

      // Check if it's a rich document
      const richDoc = getRichDocument(docId);
      if (richDoc) {
        setInitialEditorState(richDoc.editorState);
        setInitialContent('');
      } else {
        // Fall back to plain text documents
        const content = getDocumentContent(docId);
        setInitialContent(content);
        setInitialEditorState(undefined);
      }
      // Small delay after clearing store before remount
      setTimeout(() => {
        setEditorKey((k) => k + 1);
      }, 50);
    } else {
      setInitialContent('');
      setInitialEditorState(undefined);
      setTimeout(() => {
        setEditorKey((k) => k + 1);
      }, 50);
    }
  }, []);

  // Collaboration
  const collaboration = useCollaboration({
    roomId: 'certeafiles-playground',
    userName: 'Playground User',
  });

  // Handle editor change
  const handleEditorChange = useCallback(
    (_editorState: EditorState, _editor: LexicalEditor) => {
      // Could log state changes here
    },
    []
  );

  // Handle save
  const handleSave = useCallback(() => {
    setLastSaved(new Date());
    // In a real app, would serialize and save editor state
    console.log('[Playground] Document saved at', new Date().toISOString());
  }, []);

  // Handle PDF import (simulated)
  const handleImportPDF = useCallback(() => {
    // Create a file input and trigger click
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log('[Playground] Would import PDF:', file.name);
        alert(`Import PDF: ${file.name}\n\nCette fonctionnalité nécessite une intégration backend.`);
      }
    };
    input.click();
  }, []);

  // Handle PDF export
  const handleExportPDF = useCallback(async () => {
    try {
      console.log('[Playground] Exporting to PDF...');
      await exportToPDF({
        title: 'Document CerteaFiles',
        quality: 0.95,
      });
      console.log('[Playground] PDF export complete');
    } catch (error) {
      console.error('[Playground] PDF export error:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
  }, []);

  // Handle DOCX export - simplified version that alerts user
  const handleExportDocx = useCallback(() => {
    // DOCX export requires editor state access which is complex
    // For now, show a message directing users to use the toolbar export
    alert('Export DOCX: Cette fonctionnalité est disponible via le toolbar de l\'éditeur.\n\nCliquez sur le bouton export dans la barre d\'outils.');
    console.log('[Playground] DOCX export - directing user to toolbar');
  }, []);

  // Reset editor - clear stores first to prevent header/footer chaos
  const handleResetEditor = useCallback(() => {
    // Clear the folio store to prevent stale data from causing header/footer issues
    useFolioStore.getState().clear();
    // Reset document selection and content
    setSelectedDocument('');
    setInitialContent('');
    setInitialEditorState(undefined);
    // Small delay to let the stores clear before remounting
    setTimeout(() => {
      setEditorKey((k) => k + 1);
    }, 50);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-4 shrink-0">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Home className="w-5 h-5 text-slate-600" />
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Code className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Link to="/" className="text-slate-500 hover:text-slate-700">
              CerteaFiles
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">Playground</span>
          </div>
        </div>

        {/* Version Badge */}
        <div className="flex items-center gap-2 ml-4">
          <Tag className="w-4 h-4 text-slate-400" />
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full font-mono">
            v{VERSION}
          </span>
          <span className="text-xs text-slate-400">
            ({BUILD_DATE})
          </span>
        </div>

        <div className="flex-1" />

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title={lastSaved ? `Dernier enregistrement: ${lastSaved.toLocaleTimeString('fr-FR')}` : 'Enregistrer'}
        >
          <Save className="w-4 h-4" />
          <span className="hidden md:inline">Enregistrer</span>
        </button>

        {/* Import PDF Button */}
        <button
          onClick={handleImportPDF}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title="Importer un PDF"
        >
          <FileUp className="w-4 h-4" />
          <span className="hidden md:inline">Import PDF</span>
        </button>

        {/* Export PDF Button */}
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title="Exporter en PDF"
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden md:inline">Export PDF</span>
        </button>

        {/* Export DOCX Button */}
        <button
          onClick={handleExportDocx}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title="Exporter en DOCX"
        >
          <FileDown className="w-4 h-4" />
          <span className="hidden md:inline">Export DOCX</span>
        </button>

        {/* Document Selector */}
        <div className="hidden lg:flex items-center gap-2">
          <select
            value={selectedDocument}
            onChange={(e) => handleDocumentChange(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 max-w-[280px]"
            disabled={isGenerating}
          >
            <option value="">-- Document exemple --</option>
            <optgroup label="Documents Massifs (500+ pages)">
              {MASSIVE_DOCUMENTS.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} ({doc.pageCount} pages)
                </option>
              ))}
            </optgroup>
            <optgroup label="Documents Riches (avec tableaux)">
              {RICH_DOCUMENTS.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Documents Texte">
              {DOCUMENT_TEMPLATES.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </optgroup>
          </select>
          {isGenerating && (
            <span className="text-xs text-blue-600 animate-pulse">Génération...</span>
          )}
        </div>

        {/* Reset Editor Button */}
        <button
          onClick={handleResetEditor}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden md:inline">Reset</span>
        </button>

        <Link
          to="/editor"
          className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          Full Editor
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left - Folio Panel (Pages) */}
        {showFolioPanel && (
          <aside className="w-48 bg-white border-r border-slate-200 overflow-hidden shrink-0">
            <FolioPanel
              thumbnails={thumbnails}
              zoom={zoom}
              onZoomChange={setZoom}
              isLoadingThumbnails={isLoadingThumbnails}
              thumbnailProgress={thumbnailProgress}
            />
          </aside>
        )}

        {/* Center - Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor Controls - Plugin toggles */}
          <div className="bg-white border-b border-slate-200 p-3 flex items-center gap-4 flex-wrap">
            {/* Orientation & Zoom */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Orientation:</span>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as Orientation)}
                className="text-sm border border-slate-200 rounded px-2 py-1"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Zoom:</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-slate-600 w-10">{Math.round(zoom * 100)}%</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Plugin Toggles */}
            <span className="text-xs text-slate-400 font-medium">Plugins:</span>

            {/* A4 Pagination Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPagination}
                onChange={(e) => {
                  setShowPagination(e.target.checked);
                  setEditorKey((k) => k + 1); // Remount editor
                }}
                className="rounded"
              />
              <span className="text-xs text-slate-600">Pagination A4</span>
            </label>

            {/* Pages/Folio Panel Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showFolioPanel}
                onChange={(e) => setShowFolioPanel(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-slate-600">Pages</span>
            </label>

            {/* Track Changes Toggle */}
            <button
              onClick={toggleTracking}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                trackingEnabled
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Suivi des modifications"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Track Changes
            </button>

            {/* Document Validated Toggle */}
            <button
              onClick={toggleDocumentValidated}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                documentValidated
                  ? 'bg-blue-600 text-white border border-blue-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Mode document validé (masque les suppressions)"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {documentValidated ? 'Validé' : 'En édition'}
            </button>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showToolbar}
                onChange={(e) => setShowToolbar(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-slate-600">Toolbar</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showStatusBar}
                onChange={(e) => setShowStatusBar(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-slate-600">Status Bar</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCommentPanel}
                onChange={(e) => setShowCommentPanel(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-slate-600">Comments</span>
            </label>

            <label className="flex items-center gap-2 cursor-not-allowed opacity-50" title="La collaboration doit être configurée au démarrage de l'éditeur">
              <input
                type="checkbox"
                checked={enableCollaboration}
                disabled
                className="rounded"
              />
              <span className="text-xs text-slate-600">Collab</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editable}
                onChange={(e) => setEditable(e.target.checked)}
                className="rounded"
              />
              <span className="text-xs text-slate-600">Editable</span>
            </label>

            <div className="h-4 w-px bg-slate-200" />

            <div className="h-4 w-px bg-slate-200" />

            {/* Version History Button */}
            <button
              onClick={() => {
                // Trigger Ctrl+Shift+H keyboard event
                const event = new KeyboardEvent('keydown', {
                  key: 'h',
                  code: 'KeyH',
                  ctrlKey: true,
                  shiftKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
              title="Historique des versions (Ctrl+Shift+H)"
            >
              <History className="w-3.5 h-3.5" />
              Versions
            </button>

            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => {
                // Trigger F1 keyboard event
                const event = new KeyboardEvent('keydown', {
                  key: 'F1',
                  code: 'F1',
                  bubbles: true,
                });
                document.dispatchEvent(event);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Raccourcis clavier (F1)"
            >
              <Keyboard className="w-3.5 h-3.5" />
              Raccourcis
            </button>

            <div className="h-4 w-px bg-slate-200" />

            {/* Info badges */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <FileType className="w-3.5 h-3.5" />
              <span>Header/Footer: auto</span>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 overflow-hidden bg-slate-200 relative">
            {isGenerating && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                <p className="text-lg font-semibold text-slate-700">Génération du document...</p>
                <p className="text-sm text-slate-500">Cela peut prendre quelques secondes pour les documents massifs</p>
              </div>
            )}
            <ErrorBoundary
              fallback={
                <div className="flex items-center justify-center h-full text-red-500">
                  Error loading editor. Try resetting.
                </div>
              }
            >
              <CerteafilesEditor
                key={`editor-${editorKey}-${showPagination}`}
                placeholder="Commencez à écrire ici... Utilisez / pour les commandes, @ pour les mentions, + pour les champs dynamiques"
                {...(initialEditorState ? { initialState: initialEditorState } : {})}
                {...(!initialEditorState && initialContent ? { initialTextContent: initialContent } : {})}
                onChange={handleEditorChange}
                orientation={orientation}
                zoom={zoom}
                editable={editable}
                showToolbar={showToolbar}
                showStatusBar={showStatusBar}
                showCommentPanel={showCommentPanel}
                enableCollaboration={enableCollaboration}
                collaborationRoomId="certeafiles-playground"
                collaborationUser={{
                  id: collaboration.currentUser.id,
                  name: collaboration.currentUser.name,
                  color: collaboration.currentUser.color,
                }}
              />
            </ErrorBoundary>
          </div>

          {/* Editor Status */}
          <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center gap-4 text-xs text-slate-500">
            {/* Save status */}
            <div className="flex items-center gap-2">
              <Save className="w-3.5 h-3.5" />
              <span>
                {lastSaved
                  ? `Enregistré ${lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Non enregistré'}
              </span>
            </div>

            <span>|</span>

            {/* Collaboration status */}
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  enableCollaboration
                    ? collaboration.state.status === 'connected'
                      ? 'bg-green-500'
                      : collaboration.state.status === 'connecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-slate-400'
                    : 'bg-slate-300'
                }`}
              />
              <span>
                {enableCollaboration
                  ? collaboration.state.status === 'connected'
                    ? 'Connecté'
                    : collaboration.state.status === 'connecting'
                    ? 'Connexion...'
                    : 'Hors ligne'
                  : 'Local'}
              </span>
            </div>
            {enableCollaboration && collaboration.allUsers.length > 0 && (
              <>
                <span>|</span>
                <span>{collaboration.allUsers.length} utilisateur(s)</span>
              </>
            )}

            <span>|</span>

            {/* Track changes status */}
            <div className="flex items-center gap-1.5">
              <CheckCircle className={`w-3.5 h-3.5 ${trackingEnabled ? 'text-green-500' : 'text-slate-300'}`} />
              <span className={trackingEnabled ? 'text-green-600' : ''}>
                {trackingEnabled ? 'Track Changes ON' : 'Track Changes OFF'}
              </span>
            </div>

            <span>|</span>
            <span>
              {orientation === 'portrait' ? 'A4 Portrait' : 'A4 Paysage'} • {Math.round(zoom * 100)}%
            </span>

            <div className="flex-1" />
            <span className="text-slate-400">
              MDR 2017/745 • ISO 13485 • ISO 14971
            </span>
          </div>
        </div>

        {/* Right - API Documentation */}
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-800">API Reference</h2>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Documentation et raccourcis clavier
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* Usage Example */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Installation</h3>
              <CodeSnippet code="npm install certeafiles-editor" language="bash" />
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Basic Usage</h3>
              <CodeSnippet
                code={`import { CerteafilesEditor } from 'certeafiles-editor';

<CerteafilesEditor
  placeholder="Start typing..."
  orientation="portrait"
  zoom={0.75}
  showToolbar={true}
  onChange={(state) => {}}
/>`}
              />
            </div>

            {/* API Categories */}
            {API_CATEGORIES.map((category) => (
              <APICategorySection key={category.id} category={category} />
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}

export default PlaygroundPage;
