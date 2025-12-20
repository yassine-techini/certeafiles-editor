/**
 * DocumentPage - Editor page with pre-loaded document content
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Clock,
  CheckCircle,
  Save,
  RotateCw,
  Eye,
  Edit3,
  Loader2,
} from 'lucide-react';
import type { EditorState, LexicalEditor } from 'lexical';
import { CerteafilesEditor } from '../../components/Editor/CerteafilesEditor';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { FolioPanel } from '../../components/Folios';
import { ZoomControl } from '../../components/Editor/ZoomControl';
import { useFolioStore } from '../../stores/folioStore';
import { useRevisionStore } from '../../stores/revisionStore';
import { useHeaderFooterStore } from '../../stores/headerFooterStore';
import { useCollaboration } from '../../hooks/useCollaboration';
import { useFolioThumbnails } from '../../hooks/useFolioThumbnails';
import { getDocumentTemplate, getDocumentContent } from '../data/sampleDocuments';
import type { Orientation } from '../../utils/a4-constants';

/**
 * DocumentPage component
 */
export function DocumentPage() {
  const { documentId } = useParams<{ documentId: string }>();

  // Get document template info
  const template = documentId ? getDocumentTemplate(documentId) : undefined;
  const initialContent = documentId ? getDocumentContent(documentId) : '';

  // Editor state
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [zoom, setZoom] = useState(0.75);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showFolioPanel] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isContentLoading, setIsContentLoading] = useState(true);

  // Key to force editor remount when document changes
  const [editorKey, setEditorKey] = useState(documentId || 'default');
  const previousDocumentIdRef = useRef<string | undefined>(undefined);

  // Stores
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const { toggleOrientation } = useFolioStore.getState();
  const { trackingEnabled, toggleTracking } = useRevisionStore();
  const { thumbnails, isLoading: isLoadingThumbnails, progress: thumbnailProgress, regenerateFromDOM } = useFolioThumbnails();

  // Reset stores when document changes
  useEffect(() => {
    if (previousDocumentIdRef.current !== documentId) {
      console.log('[DocumentPage] Document changed from', previousDocumentIdRef.current, 'to', documentId);

      // Clear all stores to reset state
      const { clear: clearFolios } = useFolioStore.getState();
      const { clear: clearHeaderFooter } = useHeaderFooterStore.getState();
      const { clearAllVersions } = useRevisionStore.getState();

      // Clear folio store
      clearFolios();

      // Clear header/footer store
      clearHeaderFooter();

      // Clear revision store
      clearAllVersions();

      // Reset local state
      setOrientation('portrait');
      setWordCount(0);
      setLastSaved(null);
      setIsContentLoading(true);

      // Update editor key to force remount
      setEditorKey(`${documentId}-${Date.now()}`);

      // Update ref
      previousDocumentIdRef.current = documentId;
    }
  }, [documentId]);

  // Collaboration
  const collaboration = useCollaboration({
    roomId: `certeafiles-${documentId || 'default'}`,
    userName: 'Utilisateur',
  });

  // Handle editor changes
  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      editorState.read(() => {
        const text = editor.getRootElement()?.textContent || '';
        setWordCount(text.split(/\s+/).filter(Boolean).length);
      });
    },
    []
  );

  // Handle orientation toggle
  const handleOrientationToggle = useCallback(() => {
    const newOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
    if (activeFolioId) {
      toggleOrientation(activeFolioId);
    }
  }, [orientation, activeFolioId, toggleOrientation]);

  // Simulate save
  const handleSave = useCallback(() => {
    setLastSaved(new Date());
  }, []);

  // Handle content loaded - regenerate thumbnails after content is in DOM
  const handleContentLoaded = useCallback(() => {
    setIsContentLoading(false);

    // Force thumbnail regeneration after DOM updates with multiple attempts
    const attemptRegenerate = (attempt = 1) => {
      const folioElements = document.querySelectorAll('[data-folio-id]');
      console.log('[DocumentPage] Content loaded attempt', attempt, '- found', folioElements.length, 'folio elements');

      if (folioElements.length > 0) {
        // Use the regenerateFromDOM function from the hook
        regenerateFromDOM();
      } else if (attempt < 5) {
        // Retry if no folio elements found yet
        setTimeout(() => attemptRegenerate(attempt + 1), 200);
      }
    };

    // Wait for DOM to be populated
    setTimeout(() => attemptRegenerate(1), 300);
  }, [regenerateFromDOM]);

  // Auto-save simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastSaved(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if document not found
  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Document non trouvé
          </h2>
          <p className="text-gray-600 mb-4">
            Le document demandé n'existe pas ou a été supprimé.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0">
        {/* Back button */}
        <Link
          to="/"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Retour à l'accueil"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>

        {/* Document info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${template.color}15`, color: template.color }}
          >
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-gray-900 truncate">
                {template.title}
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ backgroundColor: `${template.color}15`, color: template.color }}
              >
                {template.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lastSaved
                  ? `Sauvegardé ${lastSaved.toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
                  : 'Non sauvegardé'}
              </span>
              <span>{wordCount} mots</span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          {/* Track Changes Toggle */}
          <button
            onClick={toggleTracking}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              trackingEnabled
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Track Changes</span>
          </button>

          {/* Orientation */}
          <button
            onClick={handleOrientationToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            title="Changer l'orientation"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden sm:inline">
              {orientation === 'portrait' ? 'Portrait' : 'Paysage'}
            </span>
          </button>

          {/* Zoom */}
          <div className="hidden md:block">
            <ZoomControl
              zoom={zoom}
              onZoomChange={setZoom}
              showSlider={true}
              showPercentage={true}
            />
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`p-2 rounded-lg transition-colors ${
              isPreviewMode
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            title={isPreviewMode ? 'Mode édition' : 'Mode prévisualisation'}
          >
            {isPreviewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Collaborators */}
          <div className="flex items-center -space-x-2">
            {collaboration.allUsers.slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-medium text-white"
                style={{ backgroundColor: user.color, zIndex: 3 - index }}
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {collaboration.allUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                +{collaboration.allUsers.length - 3}
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Sauvegarder</span>
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-5 h-5 text-gray-600" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Folio Thumbnails */}
        {showFolioPanel && (
          <aside className="w-48 bg-white border-r border-gray-200 overflow-hidden shrink-0">
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
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          {/* Loading Overlay */}
          {isContentLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">Chargement du document</p>
                  <p className="text-sm text-gray-500">{template?.title}</p>
                </div>
              </div>
            </div>
          )}

          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full text-red-500">
                Erreur de chargement. Veuillez rafraîchir la page.
              </div>
            }
          >
            <CerteafilesEditor
              key={editorKey}
              placeholder="Commencez à écrire..."
              initialTextContent={initialContent}
              onContentLoaded={handleContentLoaded}
              onChange={handleEditorChange}
              orientation={orientation}
              zoom={zoom}
              className="mx-auto"
              showToolbar={true}
              showCommentPanel={true}
              enableCollaboration={true}
              collaborationRoomId={`certeafiles-${documentId}`}
              collaborationUser={{
                id: collaboration.currentUser.id,
                name: collaboration.currentUser.name,
                color: collaboration.currentUser.color,
              }}
            />
          </ErrorBoundary>
        </div>
      </main>

      {/* Status Bar */}
      <footer className="h-8 bg-white border-t border-gray-200 flex items-center px-4 text-xs text-gray-500 gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              collaboration.state.status === 'connected'
                ? 'bg-green-500'
                : collaboration.state.status === 'connecting'
                ? 'bg-yellow-500 animate-pulse'
                : 'bg-gray-400'
            }`}
          />
          <span>
            {collaboration.state.status === 'connected'
              ? 'Connecté'
              : collaboration.state.status === 'connecting'
              ? 'Connexion...'
              : 'Hors ligne'}
          </span>
        </div>
        <span>|</span>
        <span>{collaboration.allUsers.length} utilisateur(s) en ligne</span>
        <span>|</span>
        <span>
          {orientation === 'portrait' ? 'A4 Portrait' : 'A4 Paysage'} • {Math.round(zoom * 100)}%
        </span>
        <div className="flex-1" />
        <span>
          Règlement (UE) 2017/745 • ISO 13485 • ISO 14971
        </span>
      </footer>
    </div>
  );
}

export default DocumentPage;
