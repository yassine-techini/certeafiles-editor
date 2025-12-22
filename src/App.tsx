/**
 * CerteaFiles Editor - Main Application with Document Management
 * Implements document routing and collaboration
 * Updated: Dec 2024 - Added new document button
 */
import { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';

import { CerteafilesEditor, ZoomControl } from './components/Editor';
import { FolioPanel } from './components/Folios';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TrackChangesToolbar } from './components/Revisions/TrackChangesToolbar';
import { useFolioStore } from './stores';
import { useRevisionStore } from './stores/revisionStore';
import { useSlotStore } from './stores/slotStore';
import { useCommentStore } from './stores/commentStore';
import {
  useDocumentStore,
  saveDocumentContent,
  loadDocumentContent,
  getDocumentIdFromUrl,
  navigateToDocument,
  navigateToHome,
  type DocumentMetadata,
} from './stores/documentStore';
import { useFolioThumbnails } from './hooks';
import { A4_CONSTANTS } from './utils/a4-constants';
import type { Orientation } from './utils/a4-constants';
import {
  Type,
  AtSign,
  Plus,
  GitBranch,
  FileText,
  Download,
  Search,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Keyboard,
  Users,
  Copy,
  Check,
  Save,
  FileEdit,
} from 'lucide-react';
import { ThemeSelector } from './components/ThemeSelector/ThemeSelector';
import { useCollaboration } from './hooks/useCollaboration';
import type { UseCollaborationReturn } from './hooks/useCollaboration';

type DemoSection = 'shortcuts' | 'trackchanges' | 'slots' | 'export' | 'query' | 'collaboration';

interface FeatureItem {
  id: DemoSection;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'shortcuts',
    title: 'Raccourcis',
    icon: <Keyboard size={16} />,
    description: 'Commandes /, @ et +',
  },
  {
    id: 'trackchanges',
    title: 'Track Changes',
    icon: <GitBranch size={16} />,
    description: 'Suivi des révisions',
  },
  {
    id: 'slots',
    title: 'Slots',
    icon: <Bookmark size={16} />,
    description: 'Zones dynamiques',
  },
  {
    id: 'export',
    title: 'Export',
    icon: <Download size={16} />,
    description: 'PDF et DOCX',
  },
  {
    id: 'query',
    title: 'Query Builder',
    icon: <Search size={16} />,
    description: 'Requêtes visuelles',
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    icon: <Users size={16} />,
    description: 'Temps réel & présence',
  },
];

/**
 * Router - Simple client-side routing based on URL path
 */
function useRouter() {
  const [path, setPath] = useState(window.location.pathname);
  const [documentId, setDocumentId] = useState<string | null>(getDocumentIdFromUrl());

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
      setDocumentId(getDocumentIdFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Playground mode: /playground shows editor with default document
  const isPlayground = path === '/playground' || path === '/';
  // Document mode: /doc/{id} shows specific document
  const isDocument = path.startsWith('/doc/') && !!documentId;

  return { path, documentId, isPlayground, isDocument };
}

function App(): JSX.Element {
  const router = useRouter();
  const documentStore = useDocumentStore();

  // Handle document creation - generates unique ID and navigates
  const handleCreateDocument = useCallback(() => {
    const doc = documentStore.createDocument();
    navigateToDocument(doc.id);
  }, [documentStore]);

  // Show editor for specific document via /doc/{id}
  if (router.isDocument && router.documentId) {
    return (
      <DocumentEditor
        documentId={router.documentId}
        onNavigateHome={navigateToHome}
        onCreateDocument={handleCreateDocument}
      />
    );
  }

  // Playground mode: show editor with "playground" as default document ID
  // This allows testing without needing to create a document first
  return (
    <DocumentEditor
      documentId="playground"
      onNavigateHome={navigateToHome}
      onCreateDocument={handleCreateDocument}
    />
  );
}

/**
 * Document Editor - Editor view for a specific document
 */
interface DocumentEditorProps {
  documentId: string;
  onNavigateHome: () => void;
  onCreateDocument: () => void;
}

function DocumentEditor({ documentId, onNavigateHome, onCreateDocument }: DocumentEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState<number>(A4_CONSTANTS.ZOOM_DEFAULT);
  const [activeSection, setActiveSection] = useState<DemoSection | null>('collaboration');
  const [showFeaturePanel, setShowFeaturePanel] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorRef = useRef<LexicalEditor | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Document store
  const documentStore = useDocumentStore();
  const document = documentStore.getDocument(documentId);

  // Create document if it doesn't exist (e.g., shared link)
  useEffect(() => {
    if (!document) {
      // Document doesn't exist - create it (this happens when opening a shared link)
      const newDoc: DocumentMetadata = {
        id: documentId,
        title: 'Document partagé',
        createdAt: new Date(),
        updatedAt: new Date(),
        collaborationEnabled: true, // Enable collaboration by default for shared docs
        roomId: documentId,
      };
      documentStore.documents.set(documentId, newDoc);
      useDocumentStore.setState({ documents: new Map(documentStore.documents) });
    }
  }, [documentId, document, documentStore]);

  // Collaboration state
  const [collaborationEnabled, setCollaborationEnabled] = useState(
    document?.collaborationEnabled ?? false
  );

  // Update collaboration state when document changes
  useEffect(() => {
    if (document) {
      setCollaborationEnabled(document.collaborationEnabled);
    }
  }, [document]);

  // Stores
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const activeFolio = useFolioStore((state) => state.getActiveFolio());
  const { toggleOrientation } = useFolioStore.getState();
  const { trackingEnabled, toggleTracking } = useRevisionStore();
  const { slots } = useSlotStore();
  const { threads } = useCommentStore();

  // Collaboration - use documentId as roomId
  const collaboration = useCollaboration({
    roomId: documentId,
    userName: 'Utilisateur',
  });

  // Thumbnail generation hook
  const { thumbnails, generateThumbnail } = useFolioThumbnails({
    debounceMs: 500,
    autoUpdate: true,
  });

  const orientation: Orientation = activeFolio?.orientation ?? 'portrait';

  // Load document content on mount
  const [initialState, setInitialState] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only load from localStorage if collaboration is not enabled
    if (!collaborationEnabled) {
      const savedContent = loadDocumentContent(documentId);
      if (savedContent) {
        setInitialState(savedContent);
      }
    }
    setIsLoading(false);
  }, [documentId, collaborationEnabled]);

  // Auto-save document content
  const saveDocument = useCallback(() => {
    if (!editorRef.current || collaborationEnabled) return; // Don't save locally if collaboration is on

    setIsSaving(true);
    const editorState = editorRef.current.getEditorState();
    const jsonState = JSON.stringify(editorState.toJSON());
    saveDocumentContent(documentId, jsonState);
    setLastSaved(new Date());
    setIsSaving(false);
  }, [documentId, collaborationEnabled]);

  // Handle editor changes
  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (!editorRef.current) {
        editorRef.current = editor;
      }

      editorState.read(() => {
        const text = editorState.read(() => {
          const root = editorState._nodeMap.get('root');
          if (root) {
            return root.getTextContent();
          }
          return '';
        });
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        setWordCount(words);
      });

      if (activeFolioId && editorRef.current) {
        generateThumbnail(activeFolioId, editorRef.current);
      }

      // Auto-save with debounce (only if collaboration is off)
      if (!collaborationEnabled) {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(saveDocument, 2000);
      }
    },
    [activeFolioId, generateThumbnail, saveDocument, collaborationEnabled]
  );

  const handleToggleOrientation = useCallback(
    (id: string) => {
      toggleOrientation(id);
    },
    [toggleOrientation]
  );

  // Toggle collaboration
  const handleToggleCollaboration = useCallback((enabled: boolean) => {
    setCollaborationEnabled(enabled);
    documentStore.updateDocument(documentId, { collaborationEnabled: enabled });
  }, [documentId, documentStore]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-theme-bg-primary">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
          <p className="text-theme-text-secondary">Chargement du document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-theme-bg-primary overflow-hidden">
      {/* Left Panel - Folio Thumbnails - fixed width, no shrink */}
      <div className="flex-shrink-0">
        <FolioPanel thumbnails={thumbnails} width={180} />
      </div>

      {/* Main Editor Area - takes remaining space */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header Bar - Linear Style */}
        <header className="h-14 bg-theme-bg-secondary border-b border-theme-border-subtle flex items-center px-4 gap-3">
          {/* Logo/Home */}
          <button
            onClick={onNavigateHome}
            className="p-2 rounded-lg text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover transition-all duration-200 glow-on-hover"
            title="Retour à l'accueil"
          >
            <FileEdit size={20} className="text-accent-primary" />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-theme-border-default" />

          {/* New Document Button - Gradient style */}
          <button
            onClick={onCreateDocument}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-accent-primary to-accent-secondary text-white text-sm font-medium rounded-lg shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40 hover:opacity-90 transition-all duration-200"
            title="Créer un nouveau document avec lien unique"
          >
            <Plus size={16} />
            <span>Nouveau</span>
          </button>

          {/* Theme Selector - Prominent position for visibility */}
          <ThemeSelector compact={false} />

          {/* Document Title */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium gradient-text">
              {document?.title || 'Document'}
            </span>
          </div>

          {/* Save indicator */}
          {!collaborationEnabled && (
            <div className="flex items-center gap-1 text-xs text-theme-text-tertiary">
              {isSaving ? (
                <>
                  <Save size={12} className="animate-pulse text-accent-primary" />
                  <span>Enregistrement...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save size={12} className="text-green-500" />
                  <span className="text-green-500">Enregistré</span>
                </>
              ) : null}
            </div>
          )}

          {/* Collaboration indicator */}
          {collaborationEnabled && (
            <div className="flex items-center gap-1.5 text-xs text-accent-primary bg-accent-100 px-2.5 py-1 rounded-full border border-accent-primary/20">
              <Users size={12} />
              <span className="font-medium">Live</span>
            </div>
          )}

          {/* Separator */}
          <div className="w-px h-6 bg-theme-border-default ml-2" />

          {/* Orientation Toggle */}
          {activeFolioId && (
            <div className="flex items-center gap-1 p-1 bg-theme-bg-tertiary rounded-lg">
              <button
                type="button"
                onClick={() => handleToggleOrientation(activeFolioId)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  orientation === 'portrait'
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover'
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => handleToggleOrientation(activeFolioId)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  orientation === 'landscape'
                    ? 'bg-accent-primary text-white shadow-sm'
                    : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-hover'
                }`}
              >
                Paysage
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="ml-2">
            <ZoomControl
              zoom={zoom}
              onZoomChange={setZoom}
              showSlider={true}
              showPercentage={true}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-theme-text-tertiary">
            <span className="px-2 py-1 rounded-md bg-theme-bg-tertiary">{wordCount} mots</span>
            <span className="px-2 py-1 rounded-md bg-theme-bg-tertiary">Slots: {slots.size}</span>
            <span className="px-2 py-1 rounded-md bg-theme-bg-tertiary">Coms: {threads.size}</span>
            <span
              className={`px-2 py-1 rounded-md font-medium ${
                trackingEnabled
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-theme-bg-tertiary text-theme-text-tertiary'
              }`}
            >
              Track: {trackingEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

        </header>

        {/* Editor Canvas - takes all remaining space, no overflow issues */}
        <div className="flex-1 min-h-0 min-w-0">
          <ErrorBoundary
            fallback={
              <div className="text-center p-8 text-red-600">
                Erreur de chargement. Veuillez rafraîchir la page.
              </div>
            }
          >
            <CerteafilesEditor
              key={`${documentId}-${collaborationEnabled}`}
              initialState={!collaborationEnabled ? initialState : undefined}
              placeholder="Commencez à écrire... Tapez / pour les commandes, @ pour les mentions, + pour l'insertion rapide"
              onChange={handleEditorChange}
              orientation={orientation}
              zoom={zoom}
              className="h-full"
              showToolbar={true}
              showCommentPanel={true}
              enableCollaboration={collaborationEnabled}
              collaborationRoomId={documentId}
              collaborationUser={{
                id: collaboration.currentUser.id,
                name: collaboration.currentUser.name,
                color: collaboration.currentUser.color,
              }}
              onCollaborationStatusChange={collaboration.handleStatusChange}
              onCollaborationUsersChange={collaboration.handleUsersChange}
              onCollaborationStateChange={collaboration.handleStateChange}
              controlledCollaborationStatus={collaboration.state.status}
              controlledCollaborationUsers={collaboration.state.users}
              controlledCollaborationSynced={collaboration.state.isSynced}
            />
          </ErrorBoundary>
        </div>
      </main>

      {/* Right Panel - Feature Demo - Linear Style - fixed width, no shrink */}
      <aside
        className={`flex-shrink-0 bg-theme-bg-secondary border-l border-theme-border-subtle flex flex-col panel-transition ${
          showFeaturePanel ? 'w-[320px]' : 'w-12'
        }`}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShowFeaturePanel(!showFeaturePanel)}
          className="h-14 flex items-center justify-center border-b border-theme-border-subtle hover:bg-theme-bg-hover text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        >
          {showFeaturePanel ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {showFeaturePanel && (
          <>
            {/* Feature Tabs */}
            <div className="p-3 border-b border-theme-border-subtle">
              <div className="text-xs font-semibold text-theme-text-muted mb-3 px-2 uppercase tracking-wider">
                Fonctionnalités
              </div>
              <div className="space-y-1">
                {FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() =>
                      setActiveSection(activeSection === feature.id ? null : feature.id)
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all duration-200 ${
                      activeSection === feature.id
                        ? 'bg-accent-100 text-accent-primary border border-accent-primary/20'
                        : 'hover:bg-theme-bg-hover text-theme-text-secondary hover:text-theme-text-primary'
                    }`}
                  >
                    <span className={activeSection === feature.id ? 'text-accent-primary' : ''}>
                      {feature.icon}
                    </span>
                    <div className="flex-1">
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-xs text-theme-text-muted">{feature.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
              {activeSection === 'shortcuts' && <ShortcutsDemo />}
              {activeSection === 'trackchanges' && (
                <TrackChangesDemo
                  trackingEnabled={trackingEnabled}
                  toggleTracking={toggleTracking}
                />
              )}
              {activeSection === 'slots' && <SlotsDemo />}
              {activeSection === 'export' && <ExportDemo />}
              {activeSection === 'query' && <QueryDemo />}
              {activeSection === 'collaboration' && (
                <CollaborationDemo
                  collaboration={collaboration}
                  documentId={documentId}
                  collaborationEnabled={collaborationEnabled}
                  setCollaborationEnabled={handleToggleCollaboration}
                />
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

/**
 * Shortcuts Demo Panel
 */
function ShortcutsDemo() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="font-semibold text-theme-text-primary">Raccourcis Clavier</h3>

      {/* Slash Commands */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Type size={18} className="text-blue-400" />
          <span className="font-medium text-blue-400">/ Slash Commands</span>
        </div>
        <p className="text-xs text-theme-text-secondary mb-3">
          Tapez <kbd className="bg-theme-bg-tertiary px-1.5 py-0.5 rounded border border-theme-border-default text-xs text-theme-text-primary">/</kbd> pour
          ouvrir le menu
        </p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/h1 - Titre 1</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/h2 - Titre 2</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/table - Tableau</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/slot - Slot</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/quote - Citation</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/code - Code</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/export - Export</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">/query - Query</div>
        </div>
      </div>

      {/* Mentions */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <AtSign size={18} className="text-green-400" />
          <span className="font-medium text-green-400">@ Mentions</span>
        </div>
        <p className="text-xs text-theme-text-secondary mb-3">
          Tapez <kbd className="bg-theme-bg-tertiary px-1.5 py-0.5 rounded border border-theme-border-default text-xs text-theme-text-primary">@</kbd> pour
          mentionner
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">@utilisateur - Mention personne</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">@document - Référence doc</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">@équipe - Mention groupe</div>
        </div>
      </div>

      {/* Plus Menu */}
      <div className="bg-accent-100 border border-accent-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plus size={18} className="text-accent-primary" />
          <span className="font-medium text-accent-primary">+ Insertion Rapide</span>
        </div>
        <p className="text-xs text-theme-text-secondary mb-3">
          Tapez <kbd className="bg-theme-bg-tertiary px-1.5 py-0.5 rounded border border-theme-border-default text-xs text-theme-text-primary">+</kbd> pour
          insérer
        </p>
        <div className="space-y-1.5 text-xs">
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">+image - Insérer image</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">+date - Date du jour</div>
          <div className="bg-theme-bg-tertiary/50 px-2 py-1.5 rounded-md text-theme-text-secondary">+fichier - Joindre fichier</div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-theme-bg-tertiary/50 border border-theme-border-default rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Keyboard size={18} className="text-theme-text-secondary" />
          <span className="font-medium text-theme-text-primary">Formatage</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between px-2 py-1.5 bg-theme-bg-primary/50 rounded-md">
            <span className="text-theme-text-secondary">Gras</span>
            <kbd className="bg-theme-bg-tertiary px-1.5 rounded border border-theme-border-default text-theme-text-primary">Ctrl+B</kbd>
          </div>
          <div className="flex justify-between px-2 py-1.5 bg-theme-bg-primary/50 rounded-md">
            <span className="text-theme-text-secondary">Italique</span>
            <kbd className="bg-theme-bg-tertiary px-1.5 rounded border border-theme-border-default text-theme-text-primary">Ctrl+I</kbd>
          </div>
          <div className="flex justify-between px-2 py-1.5 bg-theme-bg-primary/50 rounded-md">
            <span className="text-theme-text-secondary">Souligné</span>
            <kbd className="bg-theme-bg-tertiary px-1.5 rounded border border-theme-border-default text-theme-text-primary">Ctrl+U</kbd>
          </div>
          <div className="flex justify-between px-2 py-1.5 bg-theme-bg-primary/50 rounded-md">
            <span className="text-theme-text-secondary">Annuler</span>
            <kbd className="bg-theme-bg-tertiary px-1.5 rounded border border-theme-border-default text-theme-text-primary">Ctrl+Z</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Track Changes Demo Panel
 */
function TrackChangesDemo({
  trackingEnabled,
  toggleTracking,
}: {
  trackingEnabled: boolean;
  toggleTracking: () => void;
}) {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="font-semibold text-theme-text-primary">Suivi des Révisions</h3>

      {/* Toggle */}
      <button
        onClick={toggleTracking}
        className={`w-full py-2.5 px-4 rounded-lg font-medium transition-all duration-200 ${
          trackingEnabled
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
            : 'bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-bg-hover border border-theme-border-default'
        }`}
      >
        {trackingEnabled ? 'Suivi Activé' : 'Activer le Suivi'}
      </button>

      {/* Track Changes Toolbar */}
      <div className="border border-theme-border-default rounded-xl overflow-hidden bg-theme-bg-tertiary">
        <TrackChangesToolbar compact={false} />
      </div>

      {/* Legend */}
      <div className="space-y-2 p-4 bg-theme-bg-tertiary/50 rounded-xl border border-theme-border-subtle">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 bg-blue-500/20 border-b-2 border-blue-400 rounded"></span>
          <span className="text-sm text-theme-text-secondary">Insertion</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 bg-red-500/20 border-b-2 border-red-400 line-through rounded"></span>
          <span className="text-sm text-theme-text-secondary">Suppression</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-theme-text-tertiary space-y-1.5 p-3 bg-theme-bg-primary/50 rounded-lg">
        <p>• Les insertions apparaissent en bleu souligné</p>
        <p>• Les suppressions apparaissent barrées en bleu</p>
        <p>• Accepter/Rejeter individuellement ou en masse</p>
        <p>• 4 modes d'affichage disponibles</p>
      </div>
    </div>
  );
}

/**
 * Slots Demo Panel
 */
function SlotsDemo() {
  const { slots } = useSlotStore();

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="font-semibold text-theme-text-primary">Gestion des Slots</h3>

      <p className="text-xs text-theme-text-secondary">
        Les slots sont des zones dynamiques pour le contenu variable.
        Utilisez <kbd className="bg-theme-bg-tertiary px-1.5 py-0.5 rounded border border-theme-border-default text-theme-text-primary">/slot</kbd> pour en créer.
      </p>

      {/* Slot Types */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">Types disponibles</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            text
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            date
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400">
            <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
            number
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-accent-100 border border-accent-primary/20 rounded-lg text-accent-primary">
            <span className="w-2 h-2 bg-accent-primary rounded-full"></span>
            choice
          </div>
        </div>
      </div>

      {/* Active Slots */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">
          Slots actifs ({slots.size})
        </div>
        {slots.size === 0 ? (
          <div className="text-xs text-theme-text-tertiary italic p-3 bg-theme-bg-tertiary/50 rounded-lg border border-theme-border-subtle">
            Aucun slot créé
          </div>
        ) : (
          <div className="space-y-2">
            {Array.from(slots.values()).map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 bg-theme-bg-tertiary/50 rounded-lg border border-theme-border-subtle text-xs"
              >
                <span className="font-medium text-theme-text-primary">{slot.metadata.label || slot.type}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    slot.isFilled
                      ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20'
                  }`}
                >
                  {slot.isFilled ? 'rempli' : 'vide'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Export Demo Panel
 */
function ExportDemo() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="font-semibold text-theme-text-primary">Export PDF & DOCX</h3>

      <p className="text-xs text-theme-text-secondary">
        Exportez vos documents avec fidélité parfaite.
        Utilisez <kbd className="bg-theme-bg-tertiary px-1.5 py-0.5 rounded border border-theme-border-default text-theme-text-primary">/export</kbd> pour ouvrir.
      </p>

      {/* PDF Export */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-red-400" />
          <span className="font-medium text-red-400">Export PDF</span>
        </div>
        <ul className="text-xs text-theme-text-secondary space-y-1.5">
          <li>• Portrait ou Paysage</li>
          <li>• Header/Footer personnalisés</li>
          <li>• Numérotation des pages</li>
          <li>• Marges configurables</li>
        </ul>
      </div>

      {/* DOCX Export */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={18} className="text-blue-400" />
          <span className="font-medium text-blue-400">Export DOCX</span>
        </div>
        <ul className="text-xs text-theme-text-secondary space-y-1.5">
          <li>• Compatible Microsoft Word</li>
          <li>• Styles préservés</li>
          <li>• Track Changes exportables</li>
          <li>• Images intégrées</li>
        </ul>
      </div>

      {/* Orientation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-4 bg-theme-bg-tertiary/50 border border-theme-border-subtle rounded-xl hover:border-accent-primary/30 transition-colors cursor-pointer">
          <div className="w-8 h-12 bg-white border border-theme-border-default mx-auto mb-2 rounded shadow-sm"></div>
          <span className="text-xs text-theme-text-secondary">Portrait</span>
        </div>
        <div className="text-center p-4 bg-theme-bg-tertiary/50 border border-theme-border-subtle rounded-xl hover:border-accent-primary/30 transition-colors cursor-pointer">
          <div className="w-12 h-8 bg-white border border-theme-border-default mx-auto mb-2 rounded shadow-sm"></div>
          <span className="text-xs text-theme-text-secondary">Paysage</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Query Builder Demo Panel
 */
function QueryDemo() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="font-semibold text-theme-text-primary">Query Builder</h3>

      <p className="text-xs text-theme-text-secondary">
        Créez des requêtes SQL visuellement.
        Utilisez <kbd className="bg-theme-bg-tertiary px-1.5 py-0.5 rounded border border-theme-border-default text-theme-text-primary">/query</kbd> pour ouvrir.
      </p>

      {/* Features */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
          <span className="text-green-400">✓</span>
          Construction visuelle de conditions
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
          <span className="text-green-400">✓</span>
          Opérateurs AND/OR
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
          <span className="text-green-400">✓</span>
          Groupes imbriqués
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
          <span className="text-green-400">✓</span>
          Prévisualisation SQL
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
          <span className="text-green-400">✓</span>
          Sauvegarde des requêtes
        </div>
      </div>

      {/* Field Types */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">Types de champs</div>
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full text-xs">string</span>
          <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/20 rounded-full text-xs">number</span>
          <span className="px-2.5 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-full text-xs">date</span>
          <span className="px-2.5 py-1 bg-accent-100 text-accent-primary border border-accent-primary/20 rounded-full text-xs">boolean</span>
          <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-xs">enum</span>
        </div>
      </div>

      {/* Example SQL */}
      <div className="bg-theme-bg-primary border border-theme-border-default text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto">
        <pre className="text-green-400">{`SELECT *
FROM documents
WHERE status = 'published'
ORDER BY created_at DESC`}</pre>
      </div>
    </div>
  );
}

/**
 * Collaboration Demo Panel
 */
function CollaborationDemo({
  collaboration,
  documentId,
  collaborationEnabled,
  setCollaborationEnabled,
}: {
  collaboration: UseCollaborationReturn;
  documentId: string;
  collaborationEnabled: boolean;
  setCollaborationEnabled: (enabled: boolean) => void;
}) {
  const { state, currentUser, otherUsers, isConnected, isSynced, isOffline, setUserName } = collaboration;
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentUser.name);
  const [copied, setCopied] = useState(false);

  const handleSaveName = () => {
    setUserName(tempName);
    setEditingName(false);
  };

  const shareUrl = useMemo(() => {
    return `${window.location.origin}/doc/${documentId}`;
  }, [documentId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h3 className="font-semibold text-theme-text-primary">Collaboration Temps Réel</h3>

      <p className="text-xs text-theme-text-secondary">
        Travaillez à plusieurs sur le même document avec synchronisation en temps réel.
      </p>

      {/* Document ID */}
      <div className="bg-theme-bg-tertiary/50 border border-theme-border-subtle rounded-xl p-4">
        <div className="text-xs font-medium text-theme-text-muted mb-2 uppercase tracking-wider">ID du document</div>
        <code className="text-xs text-theme-text-secondary bg-theme-bg-primary px-3 py-1.5 rounded-lg border border-theme-border-default block truncate">
          {documentId}
        </code>
      </div>

      {/* Enable/Disable Collaboration */}
      <div className="bg-theme-bg-tertiary/50 border border-theme-border-subtle rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-theme-text-primary">Activer la collaboration</div>
            <div className="text-xs text-theme-text-tertiary">Partager ce document en temps réel</div>
          </div>
          <button
            onClick={() => setCollaborationEnabled(!collaborationEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
              collaborationEnabled ? 'bg-gradient-to-r from-accent-primary to-accent-secondary shadow-lg shadow-accent-primary/25' : 'bg-theme-bg-hover border border-theme-border-default'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                collaborationEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Share Link - Only show when collaboration is enabled */}
      {collaborationEnabled && (
        <div className="bg-accent-100 border border-accent-primary/20 rounded-xl p-4">
          <div className="text-xs font-medium text-accent-primary mb-2 uppercase tracking-wider">Lien de partage</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-theme-bg-primary rounded-lg border border-theme-border-default px-3 py-2 text-xs text-theme-text-secondary truncate">
              {shareUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                copied
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                  : 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25 hover:shadow-accent-primary/40'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copié!' : 'Copier'}
            </button>
          </div>
          <p className="text-xs text-accent-primary/80 mt-2">
            Partagez ce lien pour collaborer sur ce document.
          </p>
        </div>
      )}

      {/* Connection Status - Only show when collaboration is enabled */}
      {collaborationEnabled && (
        <div className="bg-theme-bg-tertiary/50 border border-theme-border-subtle rounded-xl p-4">
          <div className="text-xs font-medium text-theme-text-muted mb-2 uppercase tracking-wider">Statut de connexion</div>
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ring-4 ${
                isOffline
                  ? 'bg-gray-400 ring-gray-400/20'
                  : isConnected
                    ? 'bg-green-500 ring-green-500/20'
                    : 'bg-yellow-500 ring-yellow-500/20 animate-pulse'
              }`}
            />
            <span className="text-sm font-medium text-theme-text-primary">
              {isOffline ? 'Hors ligne' : isConnected ? 'Connecté' : 'Connexion...'}
            </span>
            {isConnected && (
              <span className="text-xs text-theme-text-tertiary">
                {isSynced ? '(synchronisé)' : '(synchronisation...)'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Current User - always visible for name editing */}
      <div className="bg-theme-bg-tertiary/50 border border-theme-border-subtle rounded-xl p-4">
        <div className="text-xs font-medium text-theme-text-muted mb-3 uppercase tracking-wider">Votre profil</div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ring-2 ring-white/20"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          {editingName ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm bg-theme-bg-primary border border-theme-border-default rounded-lg text-theme-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-3 py-1.5 bg-accent-primary text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="font-medium text-theme-text-primary">{currentUser.name}</div>
              <button
                onClick={() => setEditingName(true)}
                className="text-xs text-accent-primary hover:underline"
              >
                Modifier le nom
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connected Users - Only when collaboration is enabled */}
      {collaborationEnabled && (
        <div className="space-y-3">
          <div className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">
            Collaborateurs ({otherUsers.length})
          </div>
          {otherUsers.length === 0 ? (
            <div className="text-xs text-theme-text-tertiary italic p-3 bg-theme-bg-tertiary/50 rounded-lg border border-theme-border-subtle">
              Aucun autre utilisateur connecté. Partagez le lien ci-dessus!
            </div>
          ) : (
            <div className="space-y-2">
              {otherUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-theme-bg-tertiary/50 rounded-lg border border-theme-border-subtle"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/20"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-theme-text-primary">{user.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Features */}
      <div className="space-y-3">
        <div className="text-xs font-medium text-theme-text-muted uppercase tracking-wider">Fonctionnalités</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
            <span className="text-green-400">✓</span>
            Édition simultanée (Yjs/CRDT)
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
            <span className="text-green-400">✓</span>
            Curseurs des collaborateurs
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
            <span className="text-green-400">✓</span>
            Indicateurs de présence
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
            <span className="text-green-400">✓</span>
            Liens de partage permanents
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-theme-text-secondary">
            <span className="text-green-400">✓</span>
            Reconnexion automatique
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-lg text-xs text-theme-text-secondary">
            <span className="text-orange-400">☁</span>
            Cloudflare Durable Objects
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="bg-theme-bg-primary border border-theme-border-default p-4 rounded-xl text-xs font-mono">
        <div className="text-theme-text-muted mb-2"># Room Info</div>
        <div className="text-green-400">roomId: "{documentId}"</div>
        <div className="text-green-400">status: "{state.status}"</div>
        <div className="text-green-400">users: {otherUsers.length + 1}</div>
        <div className="text-green-400">synced: {isSynced ? 'true' : 'false'}</div>
      </div>
    </div>
  );
}

export default App;
