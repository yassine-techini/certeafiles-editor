/**
 * DemoApp - Main Demo Application
 *
 * Cette application démontre toutes les fonctionnalités de l'éditeur CerteaFiles.
 */
import { useState, useCallback } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';
import { CerteafilesEditor } from '../components/Editor/CerteafilesEditor';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { FolioPanel } from '../components/Folios';
import { DemoHeader } from './components/DemoHeader';
import { FeaturePanel } from './components/FeaturePanel';
import { useFolioStore } from '../stores/folioStore';
import { useRevisionStore } from '../stores/revisionStore';
import { useSlotStore } from '../stores/slotStore';
import { useCommentStore } from '../stores/commentStore';
import { useCollaboration } from '../hooks/useCollaboration';
import { useFolioThumbnails } from '../hooks/useFolioThumbnails';
import type { Orientation } from '../utils/a4-constants';

/**
 * Main Demo Application Component
 */
export function DemoApp() {
  // Editor state
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [zoom, setZoom] = useState(0.8);
  const [wordCount, setWordCount] = useState(0);

  // Stores
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const { toggleOrientation } = useFolioStore.getState();
  const { trackingEnabled, toggleTracking } = useRevisionStore();
  const { slots } = useSlotStore();
  const { threads } = useCommentStore();
  const { thumbnails, isLoading: isLoadingThumbnails, progress: thumbnailProgress } = useFolioThumbnails();

  // Collaboration
  const collaboration = useCollaboration({
    roomId: 'certeafiles-demo-room',
    userName: 'Demo User',
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

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <DemoHeader
        zoom={zoom}
        onZoomChange={setZoom}
        orientation={orientation}
        onOrientationToggle={handleOrientationToggle}
        wordCount={wordCount}
        slotsCount={slots.size}
        commentsCount={threads.size}
        trackingEnabled={trackingEnabled}
      />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Folio Thumbnails */}
        <aside className="w-48 bg-white border-r border-gray-200 overflow-hidden">
          <FolioPanel
            thumbnails={thumbnails}
            zoom={zoom}
            onZoomChange={setZoom}
            isLoadingThumbnails={isLoadingThumbnails}
            thumbnailProgress={thumbnailProgress}
          />
        </aside>

        {/* Center - Editor */}
        <div className="flex-1 overflow-hidden">
          <ErrorBoundary
            fallback={
              <div className="flex items-center justify-center h-full text-red-500">
                Erreur de chargement. Veuillez rafraîchir la page.
              </div>
            }
          >
            <CerteafilesEditor
              placeholder="Commencez à écrire... Tapez / pour les commandes, @ pour les mentions, + pour l'insertion rapide"
              onChange={handleEditorChange}
              orientation={orientation}
              zoom={zoom}
              className="mx-auto"
              showToolbar={true}
              showCommentPanel={true}
              enableCollaboration={true}
              collaborationRoomId="certeafiles-demo-room"
              collaborationUser={{
                id: collaboration.currentUser.id,
                name: collaboration.currentUser.name,
                color: collaboration.currentUser.color,
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Right Panel - Features Demo */}
        <FeaturePanel
          trackingEnabled={trackingEnabled}
          toggleTracking={toggleTracking}
          collaboration={collaboration}
        />
      </main>

      {/* Status Bar */}
      <footer className="h-8 bg-white border-t border-gray-200 flex items-center px-4 text-xs text-gray-500 gap-4 shrink-0">
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

export default DemoApp;
