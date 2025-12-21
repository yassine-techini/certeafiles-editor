/**
 * CerteaFiles Editor - Demo Application
 * Demonstrates all editor features with toolbar aligned with pages
 */
import { useCallback, useState, useRef } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';

import { CerteafilesEditor, ZoomControl } from './components/Editor';
import { FolioPanel } from './components/Folios';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TrackChangesToolbar } from './components/Revisions/TrackChangesToolbar';
import { useFolioStore } from './stores';
import { useRevisionStore } from './stores/revisionStore';
import { useSlotStore } from './stores/slotStore';
import { useCommentStore } from './stores/commentStore';
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
  ChevronDown,
  Keyboard,
  Users,
} from 'lucide-react';
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

function App(): JSX.Element {
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState<number>(A4_CONSTANTS.ZOOM_DEFAULT);
  const [activeSection, setActiveSection] = useState<DemoSection | null>('shortcuts');
  const [showFeaturePanel, setShowFeaturePanel] = useState(true);
  const editorRef = useRef<LexicalEditor | null>(null);

  // Stores
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const activeFolio = useFolioStore((state) => state.getActiveFolio());
  const { toggleOrientation } = useFolioStore.getState();
  const { trackingEnabled, toggleTracking } = useRevisionStore();
  const { slots } = useSlotStore();
  const { threads } = useCommentStore();

  // Collaboration
  const collaboration = useCollaboration({
    roomId: 'certeafiles-demo-room',
    userName: 'Demo User',
  });

  // Thumbnail generation hook
  const { thumbnails, generateThumbnail } = useFolioThumbnails({
    debounceMs: 500,
    autoUpdate: true,
  });

  const orientation: Orientation = activeFolio?.orientation ?? 'portrait';

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
    },
    [activeFolioId, generateThumbnail]
  );

  const handleToggleOrientation = useCallback(
    (id: string) => {
      toggleOrientation(id);
    },
    [toggleOrientation]
  );

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Left Panel - Folio Thumbnails */}
      <FolioPanel thumbnails={thumbnails} width={180} />

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm">
          <span className="text-sm font-semibold text-blue-600">
            CerteaFiles Editor
          </span>
          <span className="text-xs text-gray-400">Demo</span>

          {/* Orientation Toggle */}
          {activeFolioId && (
            <div className="flex items-center gap-1 ml-4 border-l border-gray-300 pl-4">
              <button
                type="button"
                onClick={() => handleToggleOrientation(activeFolioId)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  orientation === 'portrait'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => handleToggleOrientation(activeFolioId)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  orientation === 'landscape'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Paysage
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="ml-4 border-l border-gray-300 pl-4">
            <ZoomControl
              zoom={zoom}
              onZoomChange={setZoom}
              showSlider={true}
              showPercentage={true}
            />
          </div>

          {/* Stats */}
          <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
            <span>{wordCount} mots</span>
            <span>Slots: {slots.size}</span>
            <span>Commentaires: {threads.size}</span>
            <span
              className={`px-2 py-0.5 rounded ${
                trackingEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100'
              }`}
            >
              Track Changes: {trackingEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-auto bg-slate-200">
            <ErrorBoundary
              fallback={
                <div className="text-center p-8 text-red-600">
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
        </div>
      </main>

      {/* Right Panel - Feature Demo */}
      <aside
        className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ${
          showFeaturePanel ? 'w-[320px]' : 'w-12'
        }`}
      >
        {/* Toggle Button */}
        <button
          type="button"
          onClick={() => setShowFeaturePanel(!showFeaturePanel)}
          className="h-12 flex items-center justify-center border-b border-gray-200 hover:bg-gray-50"
        >
          {showFeaturePanel ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
        </button>

        {showFeaturePanel && (
          <>
            {/* Feature Tabs */}
            <div className="p-2 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                FONCTIONNALITÉS
              </div>
              <div className="space-y-1">
                {FEATURES.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() =>
                      setActiveSection(activeSection === feature.id ? null : feature.id)
                    }
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                      activeSection === feature.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {feature.icon}
                    <div className="flex-1">
                      <div className="font-medium">{feature.title}</div>
                      <div className="text-xs text-gray-500">{feature.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature Content */}
            <div className="flex-1 overflow-y-auto p-4">
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
                <CollaborationDemo collaboration={collaboration} />
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
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Raccourcis Clavier</h3>

      {/* Slash Commands */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Type size={18} className="text-blue-600" />
          <span className="font-medium text-blue-800">/ Slash Commands</span>
        </div>
        <p className="text-xs text-blue-700 mb-2">
          Tapez <kbd className="bg-white px-1.5 py-0.5 rounded border text-xs">/</kbd> pour
          ouvrir le menu
        </p>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="bg-white/60 px-2 py-1 rounded">/h1 - Titre 1</div>
          <div className="bg-white/60 px-2 py-1 rounded">/h2 - Titre 2</div>
          <div className="bg-white/60 px-2 py-1 rounded">/table - Tableau</div>
          <div className="bg-white/60 px-2 py-1 rounded">/slot - Slot</div>
          <div className="bg-white/60 px-2 py-1 rounded">/quote - Citation</div>
          <div className="bg-white/60 px-2 py-1 rounded">/code - Code</div>
          <div className="bg-white/60 px-2 py-1 rounded">/export - Export</div>
          <div className="bg-white/60 px-2 py-1 rounded">/query - Query</div>
        </div>
      </div>

      {/* Mentions */}
      <div className="bg-green-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <AtSign size={18} className="text-green-600" />
          <span className="font-medium text-green-800">@ Mentions</span>
        </div>
        <p className="text-xs text-green-700 mb-2">
          Tapez <kbd className="bg-white px-1.5 py-0.5 rounded border text-xs">@</kbd> pour
          mentionner
        </p>
        <div className="space-y-1 text-xs">
          <div className="bg-white/60 px-2 py-1 rounded">@utilisateur - Mention personne</div>
          <div className="bg-white/60 px-2 py-1 rounded">@document - Référence doc</div>
          <div className="bg-white/60 px-2 py-1 rounded">@équipe - Mention groupe</div>
        </div>
      </div>

      {/* Plus Menu */}
      <div className="bg-purple-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Plus size={18} className="text-purple-600" />
          <span className="font-medium text-purple-800">+ Insertion Rapide</span>
        </div>
        <p className="text-xs text-purple-700 mb-2">
          Tapez <kbd className="bg-white px-1.5 py-0.5 rounded border text-xs">+</kbd> pour
          insérer
        </p>
        <div className="space-y-1 text-xs">
          <div className="bg-white/60 px-2 py-1 rounded">+image - Insérer image</div>
          <div className="bg-white/60 px-2 py-1 rounded">+date - Date du jour</div>
          <div className="bg-white/60 px-2 py-1 rounded">+fichier - Joindre fichier</div>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Keyboard size={18} className="text-gray-600" />
          <span className="font-medium text-gray-800">Formatage</span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex justify-between px-2 py-1">
            <span>Gras</span>
            <kbd className="bg-white px-1 rounded border">Ctrl+B</kbd>
          </div>
          <div className="flex justify-between px-2 py-1">
            <span>Italique</span>
            <kbd className="bg-white px-1 rounded border">Ctrl+I</kbd>
          </div>
          <div className="flex justify-between px-2 py-1">
            <span>Souligné</span>
            <kbd className="bg-white px-1 rounded border">Ctrl+U</kbd>
          </div>
          <div className="flex justify-between px-2 py-1">
            <span>Annuler</span>
            <kbd className="bg-white px-1 rounded border">Ctrl+Z</kbd>
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
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Suivi des Révisions</h3>

      {/* Toggle */}
      <button
        onClick={toggleTracking}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          trackingEnabled
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {trackingEnabled ? 'Suivi Activé' : 'Activer le Suivi'}
      </button>

      {/* Track Changes Toolbar */}
      <div className="border rounded-lg overflow-hidden">
        <TrackChangesToolbar compact={false} />
      </div>

      {/* Legend */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-blue-100 border-b-2 border-blue-500 rounded"></span>
          <span className="text-sm">Insertion</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-red-100 border-b-2 border-red-500 line-through rounded"></span>
          <span className="text-sm">Suppression</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 space-y-1">
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
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Gestion des Slots</h3>

      <p className="text-xs text-gray-600">
        Les slots sont des zones dynamiques pour le contenu variable.
        Utilisez <kbd className="bg-gray-100 px-1 rounded">/slot</kbd> pour en créer.
      </p>

      {/* Slot Types */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">TYPES DISPONIBLES</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            text
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            date
          </div>
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            number
          </div>
          <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            choice
          </div>
        </div>
      </div>

      {/* Active Slots */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">
          SLOTS ACTIFS ({slots.size})
        </div>
        {slots.size === 0 ? (
          <div className="text-xs text-gray-400 italic p-2 bg-gray-50 rounded">
            Aucun slot créé
          </div>
        ) : (
          <div className="space-y-1">
            {Array.from(slots.values()).map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs"
              >
                <span className="font-medium">{slot.metadata.label || slot.type}</span>
                <span
                  className={`px-1.5 py-0.5 rounded ${
                    slot.isFilled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
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
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Export PDF & DOCX</h3>

      <p className="text-xs text-gray-600">
        Exportez vos documents avec fidélité parfaite.
        Utilisez <kbd className="bg-gray-100 px-1 rounded">/export</kbd> pour ouvrir.
      </p>

      {/* PDF Export */}
      <div className="bg-red-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-red-600" />
          <span className="font-medium text-red-800">Export PDF</span>
        </div>
        <ul className="text-xs text-red-700 space-y-1">
          <li>• Portrait ou Paysage</li>
          <li>• Header/Footer personnalisés</li>
          <li>• Numérotation des pages</li>
          <li>• Marges configurables</li>
        </ul>
      </div>

      {/* DOCX Export */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} className="text-blue-600" />
          <span className="font-medium text-blue-800">Export DOCX</span>
        </div>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Compatible Microsoft Word</li>
          <li>• Styles préservés</li>
          <li>• Track Changes exportables</li>
          <li>• Images intégrées</li>
        </ul>
      </div>

      {/* Orientation */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="w-8 h-12 bg-white border mx-auto mb-1"></div>
          <span className="text-xs">Portrait</span>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="w-12 h-8 bg-white border mx-auto mb-1"></div>
          <span className="text-xs">Paysage</span>
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
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Query Builder</h3>

      <p className="text-xs text-gray-600">
        Créez des requêtes SQL visuellement.
        Utilisez <kbd className="bg-gray-100 px-1 rounded">/query</kbd> pour ouvrir.
      </p>

      {/* Features */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
          <span className="text-green-600">✓</span>
          Construction visuelle de conditions
        </div>
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
          <span className="text-green-600">✓</span>
          Opérateurs AND/OR
        </div>
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
          <span className="text-green-600">✓</span>
          Groupes imbriqués
        </div>
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
          <span className="text-green-600">✓</span>
          Prévisualisation SQL
        </div>
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
          <span className="text-green-600">✓</span>
          Sauvegarde des requêtes
        </div>
      </div>

      {/* Field Types */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">TYPES DE CHAMPS</div>
        <div className="flex flex-wrap gap-1">
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">string</span>
          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">number</span>
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">date</span>
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">boolean</span>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">enum</span>
        </div>
      </div>

      {/* Example SQL */}
      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-x-auto">
        <pre>{`SELECT *
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
function CollaborationDemo({ collaboration }: { collaboration: UseCollaborationReturn }) {
  const { state, currentUser, otherUsers, isConnected, isSynced, isOffline, setUserName } = collaboration;
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(currentUser.name);

  const handleSaveName = () => {
    setUserName(tempName);
    setEditingName(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Collaboration Temps Réel</h3>

      <p className="text-xs text-gray-600">
        Travaillez à plusieurs sur le même document avec synchronisation en temps réel.
      </p>

      {/* Connection Status */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs font-medium text-gray-500 mb-2">STATUT DE CONNEXION</div>
        <div className="flex items-center gap-2">
          <span
            className={`w-3 h-3 rounded-full ${
              isOffline
                ? 'bg-gray-400'
                : isConnected
                  ? 'bg-green-500'
                  : 'bg-yellow-500 animate-pulse'
            }`}
          />
          <span className="text-sm font-medium">
            {isOffline ? 'Hors ligne' : isConnected ? 'Connecté' : 'Connexion...'}
          </span>
          {isConnected && (
            <span className="text-xs text-gray-500">
              {isSynced ? '(synchronisé)' : '(synchronisation...)'}
            </span>
          )}
        </div>
      </div>

      {/* Current User */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="text-xs font-medium text-blue-600 mb-2">VOUS</div>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
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
                className="flex-1 px-2 py-1 text-sm border rounded"
                autoFocus
              />
              <button
                onClick={handleSaveName}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <div className="font-medium">{currentUser.name}</div>
              <button
                onClick={() => setEditingName(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Modifier le nom
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Connected Users */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">
          COLLABORATEURS ({otherUsers.length})
        </div>
        {otherUsers.length === 0 ? (
          <div className="text-xs text-gray-400 italic p-2 bg-gray-50 rounded">
            Aucun autre utilisateur connecté
          </div>
        ) : (
          <div className="space-y-2">
            {otherUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{user.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500">FONCTIONNALITÉS</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
            <span className="text-green-600">✓</span>
            Édition simultanée (Yjs/CRDT)
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
            <span className="text-green-600">✓</span>
            Curseurs des collaborateurs
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
            <span className="text-green-600">✓</span>
            Indicateurs de présence
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
            <span className="text-green-600">✓</span>
            Persistance hors ligne (IndexedDB)
          </div>
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-xs">
            <span className="text-green-600">✓</span>
            Reconnexion automatique
          </div>
          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded text-xs">
            <span className="text-orange-600">☁</span>
            Cloudflare Durable Objects
          </div>
        </div>
      </div>

      {/* Technical Info */}
      <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
        <div className="text-gray-500 mb-1"># Room Info</div>
        <div>roomId: "{state.status === 'connected' ? 'certeafiles-demo' : '...'}"</div>
        <div>status: "{state.status}"</div>
        <div>users: {otherUsers.length + 1}</div>
        <div>synced: {isSynced ? 'true' : 'false'}</div>
      </div>
    </div>
  );
}

export default App;
