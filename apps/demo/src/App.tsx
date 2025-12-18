/**
 * CerteaFiles Editor Demo Application
 *
 * Demonstrates all editor features:
 * - WYSIWYG editor with custom specifications
 * - Header and footer implementation
 * - Shortcuts: /, @, +
 * - Slots management with graphical behaviors + comments
 * - Revision tracking (insertion/deletion)
 * - Visual query builder integration
 * - PDF export with portrait/landscape support
 */
import { useState, useCallback } from 'react';
import {
  CerteafilesEditor,
  useRevisionStore,
  useSlotStore,
  useCommentStore,
  TrackChangesToolbar,
} from '@certeafiles/editor';
import type { EditorState, LexicalEditor } from 'lexical';

type DemoTab =
  | 'editor'
  | 'shortcuts'
  | 'slots'
  | 'revisions'
  | 'query'
  | 'export';

interface FeatureCard {
  id: DemoTab;
  title: string;
  description: string;
  icon: string;
}

const FEATURES: FeatureCard[] = [
  {
    id: 'editor',
    title: 'Éditeur WYSIWYG',
    description: 'Éditeur riche avec header/footer personnalisables',
    icon: '📝',
  },
  {
    id: 'shortcuts',
    title: 'Raccourcis /, @, +',
    description: 'Menus contextuels pour insertion rapide',
    icon: '⌨️',
  },
  {
    id: 'slots',
    title: 'Gestion des Slots',
    description: 'Zones dynamiques avec comportements graphiques',
    icon: '🎯',
  },
  {
    id: 'revisions',
    title: 'Suivi des Révisions',
    description: 'Track changes avec insertion/suppression',
    icon: '📊',
  },
  {
    id: 'query',
    title: 'Query Builder',
    description: 'Éditeur graphique de requêtes SQL',
    icon: '🔍',
  },
  {
    id: 'export',
    title: 'Export PDF/DOCX',
    description: 'Export fidèle portrait/paysage',
    icon: '📄',
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<DemoTab>('editor');
  const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(null);
  const { trackingEnabled, toggleTracking } = useRevisionStore();
  const { slots } = useSlotStore();
  const { threads } = useCommentStore();

  const handleEditorChange = useCallback(
    (_editorState: EditorState, editor: LexicalEditor) => {
      if (!editorInstance) {
        setEditorInstance(editor);
      }
    },
    [editorInstance]
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                CerteaFiles Editor
              </h1>
              <p className="text-sm text-gray-500">
                Demo des fonctionnalités de l'éditeur
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Slots: {slots.length} | Commentaires: {threads.length}
              </span>
              <a
                href="https://github.com/yassine-techini/certeafiles-editor"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {FEATURES.map((feature) => (
              <button
                key={feature.id}
                onClick={() => setActiveTab(feature.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === feature.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{feature.icon}</span>
                {feature.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Feature Description */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">
              {FEATURES.find((f) => f.id === activeTab)?.icon}
            </span>
            <div>
              <h2 className="text-xl font-semibold">
                {FEATURES.find((f) => f.id === activeTab)?.title}
              </h2>
              <p className="text-gray-600">
                {FEATURES.find((f) => f.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'editor' && (
          <EditorDemo onEditorChange={handleEditorChange} />
        )}
        {activeTab === 'shortcuts' && <ShortcutsDemo />}
        {activeTab === 'slots' && <SlotsDemo />}
        {activeTab === 'revisions' && (
          <RevisionsDemo
            trackingEnabled={trackingEnabled}
            toggleTracking={toggleTracking}
          />
        )}
        {activeTab === 'query' && <QueryBuilderDemo />}
        {activeTab === 'export' && <ExportDemo />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          CerteaFiles Editor v1.0.0 - Built with Lexical & React
        </div>
      </footer>
    </div>
  );
}

/**
 * Editor Demo Tab
 */
function EditorDemo({
  onEditorChange,
}: {
  onEditorChange: (state: EditorState, editor: LexicalEditor) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="font-semibold mb-2">Instructions</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Utilisez la barre d'outils pour formater le texte</li>
          <li>• Le header et footer sont personnalisables via le menu</li>
          <li>• Tapez <code className="bg-gray-100 px-1 rounded">/</code> pour ouvrir le menu slash</li>
          <li>• Tapez <code className="bg-gray-100 px-1 rounded">@</code> pour mentionner quelqu'un</li>
          <li>• Tapez <code className="bg-gray-100 px-1 rounded">+</code> pour insérer un élément</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <CerteafilesEditor
          onChange={onEditorChange}
          className="min-h-[600px]"
          placeholder="Commencez à écrire... Tapez / pour les commandes"
        />
      </div>
    </div>
  );
}

/**
 * Shortcuts Demo Tab
 */
function ShortcutsDemo() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-4xl mb-4">/</div>
        <h3 className="font-semibold text-lg mb-2">Slash Commands</h3>
        <p className="text-gray-600 text-sm mb-4">
          Tapez <code className="bg-gray-100 px-1 rounded">/</code> pour ouvrir le menu des commandes
        </p>
        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">h1</span>
            Titre niveau 1
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">h2</span>
            Titre niveau 2
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">table</span>
            Insérer tableau
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">slot</span>
            Insérer slot
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">query</span>
            Ouvrir Query Builder
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-4xl mb-4">@</div>
        <h3 className="font-semibold text-lg mb-2">Mentions</h3>
        <p className="text-gray-600 text-sm mb-4">
          Tapez <code className="bg-gray-100 px-1 rounded">@</code> pour mentionner un utilisateur ou document
        </p>
        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">@user</span>
            Mentionner utilisateur
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">@doc</span>
            Référencer document
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">@team</span>
            Mentionner équipe
          </li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-4xl mb-4">+</div>
        <h3 className="font-semibold text-lg mb-2">Insertion Rapide</h3>
        <p className="text-gray-600 text-sm mb-4">
          Tapez <code className="bg-gray-100 px-1 rounded">+</code> pour insérer du contenu
        </p>
        <ul className="text-sm space-y-2">
          <li className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">+img</span>
            Insérer image
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">+file</span>
            Joindre fichier
          </li>
          <li className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">+date</span>
            Insérer date
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Slots Demo Tab
 */
function SlotsDemo() {
  const { slots } = useSlotStore();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Gestion des Slots</h3>
        <p className="text-gray-600 mb-4">
          Les slots sont des zones dynamiques qui peuvent afficher du contenu conditionnel
          basé sur des règles métier. Ils supportent les commentaires et différents états visuels.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Types de Slots</h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <strong>text</strong> - Contenu textuel simple
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <strong>date</strong> - Champ de date
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <strong>number</strong> - Valeur numérique
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <strong>choice</strong> - Liste de choix
              </li>
              <li className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <strong>conditional</strong> - Affichage conditionnel
              </li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Comportements</h4>
            <ul className="text-sm space-y-2">
              <li>
                <strong>required</strong> - Slot obligatoire
              </li>
              <li>
                <strong>optional</strong> - Slot optionnel
              </li>
              <li>
                <strong>computed</strong> - Valeur calculée automatiquement
              </li>
              <li>
                <strong>locked</strong> - Non modifiable
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">
          Slots actifs ({slots.length})
        </h3>
        {slots.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucun slot créé. Utilisez <code className="bg-gray-100 px-1 rounded">/slot</code> dans l'éditeur pour en créer un.
          </p>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <span className="font-medium">{slot.name}</span>
                  <span className="text-gray-500 text-sm ml-2">({slot.type})</span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    slot.status === 'filled'
                      ? 'bg-green-100 text-green-800'
                      : slot.status === 'empty'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {slot.status}
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
 * Revisions Demo Tab
 */
function RevisionsDemo({
  trackingEnabled,
  toggleTracking,
}: {
  trackingEnabled: boolean;
  toggleTracking: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Suivi des Révisions</h3>
          <button
            onClick={toggleTracking}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              trackingEnabled
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {trackingEnabled ? 'Suivi activé' : 'Activer le suivi'}
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Le suivi des révisions permet de visualiser toutes les modifications
          apportées au document avec l'identification de l'auteur et la date.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4 bg-green-50">
            <h4 className="font-medium text-green-800 mb-2">Insertions</h4>
            <p className="text-sm text-green-700">
              Le texte ajouté apparaît en <span className="underline decoration-green-500">vert souligné</span>
            </p>
            <div className="mt-2 p-2 bg-white rounded text-sm">
              Exemple: <span className="text-green-600 underline">nouveau texte inséré</span>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-red-50">
            <h4 className="font-medium text-red-800 mb-2">Suppressions</h4>
            <p className="text-sm text-red-700">
              Le texte supprimé apparaît en <span className="line-through decoration-red-500">rouge barré</span>
            </p>
            <div className="mt-2 p-2 bg-white rounded text-sm">
              Exemple: <span className="text-red-600 line-through">texte supprimé</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Barre d'outils Track Changes</h3>
        <TrackChangesToolbar />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Modes d'affichage</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📝</div>
            <h4 className="font-medium">Tout afficher</h4>
            <p className="text-xs text-gray-500">Toutes les marques visibles</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📄</div>
            <h4 className="font-medium">Simple</h4>
            <p className="text-xs text-gray-500">Marques simplifiées</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">✅</div>
            <h4 className="font-medium">Final</h4>
            <p className="text-xs text-gray-500">Document final</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl mb-2">📜</div>
            <h4 className="font-medium">Original</h4>
            <p className="text-xs text-gray-500">Version originale</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Query Builder Demo Tab
 */
function QueryBuilderDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Éditeur Graphique de Requêtes</h3>
        <p className="text-gray-600 mb-4">
          Le Query Builder permet de créer des requêtes SQL visuellement sans écrire de code.
          Idéal pour les utilisateurs non-techniques.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Fonctionnalités</h4>
            <ul className="text-sm space-y-2">
              <li>✓ Construction visuelle de conditions</li>
              <li>✓ Support des opérateurs AND/OR</li>
              <li>✓ Groupes de conditions imbriqués</li>
              <li>✓ Tri et pagination</li>
              <li>✓ Prévisualisation SQL en temps réel</li>
              <li>✓ Sauvegarde des requêtes</li>
            </ul>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">Types de champs supportés</h4>
            <ul className="text-sm space-y-2">
              <li>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">string</span>{' '}
                Texte
              </li>
              <li>
                <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">number</span>{' '}
                Numérique
              </li>
              <li>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">date</span>{' '}
                Date
              </li>
              <li>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">boolean</span>{' '}
                Booléen
              </li>
              <li>
                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">enum</span>{' '}
                Énumération
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Exemple de requête</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
          <pre>{`SELECT *
FROM documents
WHERE (
  status = 'published'
  AND created_at >= '2024-01-01'
)
OR (
  author = 'admin'
  AND category IN ('legal', 'compliance')
)
ORDER BY created_at DESC
LIMIT 50`}</pre>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Utilisez <code className="bg-gray-100 px-1 rounded">/query</code> dans l'éditeur pour ouvrir le Query Builder
        </p>
      </div>
    </div>
  );
}

/**
 * Export Demo Tab
 */
function ExportDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Export PDF & DOCX</h3>
        <p className="text-gray-600 mb-4">
          Exportez vos documents avec une fidélité parfaite dans différents formats.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <div className="text-4xl mb-4">📑</div>
            <h4 className="font-semibold text-lg mb-2">Export PDF</h4>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>✓ Format Portrait ou Paysage</li>
              <li>✓ Header et footer personnalisés</li>
              <li>✓ Numérotation des pages</li>
              <li>✓ Marges configurables</li>
              <li>✓ Qualité d'impression professionnelle</li>
              <li>✓ Support des images et tableaux</li>
            </ul>
          </div>

          <div className="border rounded-lg p-6">
            <div className="text-4xl mb-4">📄</div>
            <h4 className="font-semibold text-lg mb-2">Export DOCX</h4>
            <ul className="text-sm space-y-2 text-gray-600">
              <li>✓ Compatible Microsoft Word</li>
              <li>✓ Styles préservés</li>
              <li>✓ Table des matières</li>
              <li>✓ Notes de bas de page</li>
              <li>✓ Track changes exportables</li>
              <li>✓ Images et médias intégrés</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Options d'orientation</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 text-center">
            <div className="w-24 h-32 bg-gray-200 rounded mx-auto mb-3 flex items-center justify-center">
              <span className="text-gray-500">A4</span>
            </div>
            <h4 className="font-medium">Portrait</h4>
            <p className="text-xs text-gray-500">210mm × 297mm</p>
          </div>
          <div className="border rounded-lg p-4 text-center">
            <div className="w-32 h-24 bg-gray-200 rounded mx-auto mb-3 flex items-center justify-center">
              <span className="text-gray-500">A4</span>
            </div>
            <h4 className="font-medium">Paysage</h4>
            <p className="text-xs text-gray-500">297mm × 210mm</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-lg mb-4">Comment exporter</h3>
        <ol className="text-sm space-y-2 text-gray-600">
          <li>1. Cliquez sur le bouton <strong>Export</strong> dans la barre d'outils</li>
          <li>2. Choisissez le format (PDF ou DOCX)</li>
          <li>3. Configurez les options (orientation, marges, header/footer)</li>
          <li>4. Cliquez sur <strong>Exporter</strong></li>
        </ol>
        <p className="text-sm text-gray-500 mt-4">
          Raccourci: <code className="bg-gray-100 px-1 rounded">/export</code> dans l'éditeur
        </p>
      </div>
    </div>
  );
}

export default App;
