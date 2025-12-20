# CerteaFiles Editor - Guide d'Intégration

Ce guide explique comment intégrer l'éditeur CerteaFiles dans votre projet React/TypeScript.

## Table des matières

1. [Architecture](#architecture)
2. [Installation](#installation)
3. [Configuration de base](#configuration-de-base)
4. [Composant principal](#composant-principal)
5. [Props disponibles](#props-disponibles)
6. [Stores Zustand](#stores-zustand)
7. [Hooks personnalisés](#hooks-personnalisés)
8. [Plugins disponibles](#plugins-disponibles)
9. [Nodes Lexical](#nodes-lexical)
10. [Collaboration temps réel](#collaboration-temps-réel)
11. [Import/Export](#importexport)
12. [Personnalisation](#personnalisation)
13. [Exemples complets](#exemples-complets)

---

## Architecture

L'éditeur est construit avec :
- **Lexical** (v0.20.0) - Framework d'édition de texte de Meta
- **React** (v18.3.1) - Bibliothèque UI
- **Zustand** - Gestion d'état
- **Yjs** - CRDT pour collaboration temps réel
- **TailwindCSS** - Styles

### Structure du Projet

```
src/
├── lib/                              # 📦 Exports de la bibliothèque
│   └── index.ts                      # Point d'entrée principal
├── demo/                             # 🎯 Application de démonstration
│   ├── DemoApp.tsx                   # App de démo principale
│   └── components/
│       ├── DemoHeader.tsx            # Header de la démo
│       ├── FeaturePanel.tsx          # Panneau des fonctionnalités
│       └── features/                 # Démos individuelles
│           ├── ShortcutsDemo.tsx
│           ├── TrackChangesDemo.tsx
│           ├── SlotsDemo.tsx
│           ├── ExportDemo.tsx
│           ├── QueryDemo.tsx
│           └── CollaborationDemo.tsx
├── components/
│   ├── Editor/                       # Composants éditeur
│   │   ├── CerteafilesEditor.tsx     # ⭐ Composant principal
│   │   ├── EditorToolbar.tsx         # Barre d'outils
│   │   ├── FloatingToolbar.tsx       # Toolbar contextuel
│   │   ├── A4ContentEditable.tsx     # Zone d'édition A4
│   │   └── SpecialTables/            # Tableaux métier
│   ├── Collaboration/                # Collaboration temps réel
│   ├── Comments/                     # Système de commentaires
│   ├── Folios/                       # Gestion des pages
│   ├── Revisions/                    # Track Changes
│   ├── HeaderFooter/                 # En-têtes/pieds de page
│   ├── Shortcuts/                    # Menus slash/at/plus
│   ├── Slots/                        # Champs dynamiques
│   ├── QueryBuilder/                 # Builder de requêtes
│   ├── Export/                       # Export PDF/DOCX
│   └── Import/                       # Import de fichiers
├── nodes/                            # Nodes Lexical personnalisés
├── plugins/                          # 26 Plugins Lexical
├── stores/                           # 10 Stores Zustand
├── hooks/                            # Hooks personnalisés
├── types/                            # Types TypeScript
└── utils/                            # Utilitaires
```

---

## Installation

### Utiliser le package npm (bientôt disponible)

```bash
# Avec pnpm
pnpm add certeafiles-editor

# Avec npm
npm install certeafiles-editor

# Avec yarn
yarn add certeafiles-editor
```

### Intégration directe (copie des sources)

```bash
# Copier les dossiers nécessaires
cp -r src/components src/nodes src/plugins src/stores src/hooks src/types src/utils your-project/src/

# Installer les dépendances
pnpm add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/table @lexical/utils @lexical/yjs zustand lucide-react yjs y-protocols
```

### Import depuis la bibliothèque

```tsx
// Import unique depuis le point d'entrée
import {
  CerteafilesEditor,
  useFolioStore,
  useRevisionStore,
  exportToPDF,
} from 'certeafiles-editor';
// ou
import { CerteafilesEditor } from './lib';
```

---

## Configuration de base

### 1. Import du CSS

```tsx
// Dans votre fichier principal (main.tsx ou App.tsx)
import 'certeafiles-editor/dist/style.css';
// ou si intégration directe
import './index.css';
```

### 2. Configuration Tailwind (optionnel)

```js
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/certeafiles-editor/dist/**/*.{js,ts,jsx,tsx}',
  ],
};
```

---

## Composant principal

### Import basique

```tsx
import { CerteafilesEditor } from 'certeafiles-editor';

function MyEditor() {
  return (
    <CerteafilesEditor
      placeholder="Commencez à écrire..."
    />
  );
}
```

### Import avec gestion d'état

```tsx
import { useState, useCallback } from 'react';
import { CerteafilesEditor } from 'certeafiles-editor';
import type { EditorState, LexicalEditor } from 'lexical';

function MyEditor() {
  const [wordCount, setWordCount] = useState(0);

  const handleChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      editorState.read(() => {
        const text = editor.getRootElement()?.textContent || '';
        setWordCount(text.split(/\s+/).filter(Boolean).length);
      });
    },
    []
  );

  return (
    <div>
      <p>Mots: {wordCount}</p>
      <CerteafilesEditor
        placeholder="Tapez / pour les commandes..."
        onChange={handleChange}
      />
    </div>
  );
}
```

---

## Props disponibles

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `placeholder` | `string` | `""` | Texte affiché quand l'éditeur est vide |
| `onChange` | `(editorState, editor) => void` | - | Callback appelé à chaque changement |
| `onError` | `(error) => void` | - | Callback pour les erreurs |
| `initialContent` | `string` | - | Contenu initial (JSON Lexical) |
| `orientation` | `'portrait' \| 'landscape'` | `'portrait'` | Orientation des pages A4 |
| `zoom` | `number` | `1` | Niveau de zoom (0.5 à 2) |
| `className` | `string` | - | Classes CSS additionnelles |
| `showToolbar` | `boolean` | `true` | Afficher la barre d'outils |
| `showCommentPanel` | `boolean` | `false` | Afficher le panneau des commentaires |
| `readOnly` | `boolean` | `false` | Mode lecture seule |
| `enableCollaboration` | `boolean` | `false` | Activer la collaboration temps réel |
| `collaborationRoomId` | `string` | - | ID de la room de collaboration |
| `collaborationUser` | `CollaborationUser` | - | Informations utilisateur |

### Exemple complet avec props

```tsx
<CerteafilesEditor
  placeholder="Tapez / pour les commandes, @ pour les mentions"
  onChange={handleChange}
  orientation="portrait"
  zoom={0.8}
  showToolbar={true}
  showCommentPanel={true}
  enableCollaboration={true}
  collaborationRoomId="my-document-123"
  collaborationUser={{
    id: 'user-1',
    name: 'Jean Dupont',
    color: '#3B82F6',
  }}
/>
```

## Fonctionnalités

### Raccourcis Clavier

| Raccourci | Action |
|-----------|--------|
| `/` | Ouvre le menu slash (commandes) |
| `@` | Mentions (utilisateurs, documents) |
| `+` | Insertion rapide (images, fichiers) |
| `Ctrl+B` | Gras |
| `Ctrl+I` | Italique |
| `Ctrl+U` | Souligné |

### Commandes Slash (`/`)

- `/h1`, `/h2`, `/h3` - Titres
- `/table` - Insérer un tableau
- `/slot` - Insérer un slot dynamique
- `/query` - Ouvrir le Query Builder
- `/export` - Export PDF/DOCX
- `/comment` - Ajouter un commentaire

### Track Changes

```tsx
import { useRevisionStore } from './stores/revisionStore';

function MyComponent() {
  const { trackingEnabled, toggleTracking } = useRevisionStore();

  return (
    <button onClick={toggleTracking}>
      {trackingEnabled ? 'Désactiver' : 'Activer'} le suivi
    </button>
  );
}
```

### Export PDF/DOCX

```tsx
import { exportToPDF } from './utils/pdfExport';
import { exportToDocx } from './utils/docxExport';

// Export PDF
const handleExportPDF = async (editor) => {
  await exportToPDF(editor, {
    orientation: 'portrait', // ou 'landscape'
    includeHeader: true,
    includeFooter: true,
  });
};

// Export DOCX
const handleExportDocx = async (editor) => {
  await exportToDocx(editor, {
    filename: 'document.docx',
  });
};
```

### Query Builder

```tsx
import { QueryBuilder } from './components/QueryBuilder/QueryBuilder';
import { useQueryBuilderStore } from './stores/queryBuilderStore';

function QueryPanel() {
  const { generateSQL, currentQuery } = useQueryBuilderStore();

  const handleExecute = () => {
    const sql = generateSQL();
    console.log('SQL généré:', sql);
    // Exécuter la requête...
  };

  return (
    <QueryBuilder
      fields={[
        { id: 'title', name: 'Titre', type: 'string' },
        { id: 'status', name: 'Statut', type: 'enum', options: ['draft', 'published'] },
        { id: 'created_at', name: 'Date création', type: 'date' },
      ]}
      onExecute={handleExecute}
    />
  );
}
```

### Slots Dynamiques

```tsx
import { useSlotStore } from './stores/slotStore';

function SlotManager() {
  const { slots, insertSlot, updateSlot } = useSlotStore();

  const handleAddSlot = () => {
    insertSlot('dynamic_content', 'startKey', 'endKey', {
      label: 'Nom du client',
      required: true,
    });
  };

  return (
    <div>
      <button onClick={handleAddSlot}>Ajouter un slot</button>
      {Array.from(slots.values()).map(slot => (
        <div key={slot.id}>
          {slot.metadata.label}: {slot.value || '(vide)'}
        </div>
      ))}
    </div>
  );
}
```

### Collaboration Temps Réel

```tsx
import { useCollaboration } from './hooks/useCollaboration';
import { CollaborationStatus } from './components/Collaboration';

function MyEditor() {
  const collaboration = useCollaboration({
    roomId: 'my-document-id',
    userName: 'John Doe',
  });

  return (
    <div>
      {/* Afficher le statut de connexion */}
      <CollaborationStatus
        status={collaboration.state.status}
        isSynced={collaboration.isSynced}
        isOffline={collaboration.isOffline}
        currentUser={collaboration.currentUser}
        otherUsers={collaboration.otherUsers}
      />

      {/* Utilisateurs connectés */}
      <div>
        <p>{collaboration.allUsers.length} utilisateur(s) connecté(s)</p>
        {collaboration.otherUsers.map(user => (
          <span key={user.id} style={{ color: user.color }}>
            {user.name}
          </span>
        ))}
      </div>
    </div>
  );
}
```

#### Fonctionnalités de Collaboration

| Fonctionnalité | Description |
|----------------|-------------|
| Édition simultanée | Yjs/CRDT pour la résolution de conflits |
| Curseurs collaborateurs | Affichage des curseurs des autres utilisateurs |
| Indicateurs de présence | Statut en ligne/absent/hors ligne |
| Persistance hors ligne | IndexedDB pour le travail sans connexion |
| Reconnexion automatique | Reconnexion transparente après perte de connexion |
| Cloudflare Durable Objects | Serveur WebSocket avec persistance et edge computing |

#### Architecture Backend (Cloudflare)

Le serveur de collaboration utilise Cloudflare Durable Objects :

```
workers/
├── wrangler.toml    # Configuration Durable Objects
├── yjs-server.ts    # Serveur Yjs avec WebSocket
└── package.json     # Dépendances
```

Déployer le worker :
```bash
cd workers && pnpm deploy
```

URL du serveur : `https://certeafiles-yjs-server.yassine-techini.workers.dev`

## Personnalisation

### Thème

Les styles sont dans `src/index.css`. Principales classes :

```css
/* Éditeur */
.editor-paragraph { }
.editor-h1, .editor-h2, .editor-h3 { }
.editor-bold, .editor-italic { }
.editor-table, .editor-table-cell { }

/* Track Changes */
.insertion-node { }
.deletion-node { }

/* Commentaires */
.comment-highlight { }
.comment-remark, .comment-question { }
```

### Nodes Personnalisés

Pour ajouter un nouveau type de node :

```tsx
import { DecoratorNode } from 'lexical';

class MyCustomNode extends DecoratorNode<JSX.Element> {
  static getType(): string {
    return 'my-custom';
  }

  static clone(node: MyCustomNode): MyCustomNode {
    return new MyCustomNode(node.__key);
  }

  decorate(): JSX.Element {
    return <MyCustomComponent />;
  }
}
```

## Environnements

| Env | URL |
|-----|-----|
| **DEV** | https://certeafiles-editor-dev.pages.dev |
| **STAGING** | https://certeafiles-editor-staging.pages.dev |
| **PROD** | https://certeafiles-editor-prod.pages.dev |

## Déploiement

```bash
# Build
pnpm build

# Déployer vers DEV
pnpm deploy:dev

# Déployer vers STAGING
pnpm deploy:staging

# Déployer vers PROD
pnpm deploy:prod
```

---

## Stores Zustand

L'éditeur utilise plusieurs stores Zustand pour la gestion d'état:

### useFolioStore - Gestion des pages

```tsx
import { useFolioStore, useActiveFolio, useFoliosInOrder } from 'certeafiles-editor';

function FolioManager() {
  const activeFolio = useActiveFolio();
  const folios = useFoliosInOrder();
  const { addFolio, removeFolio, reorderFolios, setActiveFolio } = useFolioStore.getState();

  return (
    <div>
      <p>Page active: {activeFolio?.title}</p>
      <p>Nombre de pages: {folios.length}</p>
      <button onClick={() => addFolio({ title: 'Nouvelle page' })}>
        Ajouter une page
      </button>
    </div>
  );
}
```

### useCommentStore - Gestion des commentaires

```tsx
import { useCommentStore } from 'certeafiles-editor';

function CommentManager() {
  const { threads, addThread, addReply, resolveThread } = useCommentStore();

  return (
    <div>
      <p>Fils de commentaires: {threads.size}</p>
      {Array.from(threads.values()).map(thread => (
        <div key={thread.id}>
          <p>{thread.comments[0].content}</p>
          <button onClick={() => resolveThread(thread.id)}>
            {thread.resolved ? 'Rouvrir' : 'Résoudre'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Tous les stores disponibles

```tsx
import {
  useFolioStore,           // Gestion des pages/folios
  useHeaderFooterStore,    // En-têtes et pieds de page
  useRevisionStore,        // Track changes
  useCommentStore,         // Commentaires
  useSlotStore,            // Champs dynamiques
  useFootnoteStore,        // Notes de bas de page
  useQueryBuilderStore,    // Requêtes conditionnelles
  useSpellCheckStore,      // Correction orthographique
  useStyleStore,           // Styles personnalisés
} from 'certeafiles-editor';
```

---

## Hooks personnalisés

### useCollaboration - Collaboration temps réel

```tsx
import { useCollaboration } from 'certeafiles-editor';

function CollaborativeEditor() {
  const collaboration = useCollaboration({
    roomId: 'document-123',
    userName: 'Jean Dupont',
  });

  return (
    <div>
      <p>Status: {collaboration.connectionStatus}</p>
      <ul>
        {collaboration.users.map(user => (
          <li key={user.id} style={{ color: user.color }}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Tous les hooks disponibles

```tsx
import {
  useFolios,              // Gestion avancée des folios
  useFolioThumbnails,     // Miniatures des pages
  useFolioDragDrop,       // Drag & drop des pages
  useFolioScroll,         // Scroll synchronisé
  useHeaderFooter,        // En-têtes/pieds de page
  useCommentAlignment,    // Alignement des commentaires
  useCollaboration,       // Collaboration temps réel
  usePresence,            // Présence des utilisateurs
  useTypeahead,           // Auto-complétion
  useAutoSave,            // Sauvegarde automatique
  useKeyboardNavigation,  // Navigation clavier
} from 'certeafiles-editor';
```

---

## Plugins disponibles

```tsx
import {
  // Layout et affichage
  A4LayoutPlugin,           // Mise en page A4
  FloatingToolbarPlugin,    // Barre d'outils flottante

  // Menus contextuels
  SlashMenuPlugin,          // Menu slash (/)
  AtMenuPlugin,             // Menu mentions (@)
  PlusMenuPlugin,           // Menu insertion (+)

  // Fonctionnalités document
  FolioPlugin,              // Gestion des pages
  HeaderFooterPlugin,       // En-têtes/pieds de page
  PageNumberingPlugin,      // Numérotation des pages
  FootnotePlugin,           // Notes de bas de page

  // Collaboration et commentaires
  CollaborationPlugin,      // Collaboration temps réel
  CommentPlugin,            // Commentaires
  CursorPlugin,             // Curseurs collaboratifs

  // Suivi des modifications
  TrackChangesPlugin,       // Track changes

  // Tableaux et médias
  TablePlugin,              // Tableaux
  SpecialTablePlugin,       // Tableaux spéciaux
  ImagePlugin,              // Images

  // Import/Export
  ExportPlugin,             // Export PDF/DOCX
  ClipboardImportPlugin,    // Import presse-papier

  // Autres
  SlotPlugin,               // Champs dynamiques
  QueryBuilderPlugin,       // Requêtes conditionnelles
  SpellCheckPlugin,         // Correction orthographique
  SymbolPickerPlugin,       // Sélecteur de symboles
} from 'certeafiles-editor';
```

---

## Nodes Lexical

Nodes personnalisés pour étendre l'éditeur:

```tsx
import {
  CommentNode, $createCommentNode, $isCommentNode,
  DeletionNode, $createDeletionNode, $isDeletionNode,
  InsertionNode, $createInsertionNode, $isInsertionNode,
  DynamicFieldNode, $createDynamicFieldNode, $isDynamicFieldNode,
  FolioNode, $createFolioNode, $isFolioNode,
  HeaderNode, $createHeaderNode, $isHeaderNode,
  FooterNode, $createFooterNode, $isFooterNode,
  ImageNode, $createImageNode, $isImageNode,
  MentionNode, $createMentionNode, $isMentionNode,
  PageNumberNode, $createPageNumberNode, $isPageNumberNode,
  SlotNode, $createSlotNode, $isSlotNode,
  FootnoteNode, $createFootnoteNode, $isFootnoteNode,
} from 'certeafiles-editor';
```

---

## Types TypeScript

Tous les types sont exportés pour une intégration TypeScript complète:

```tsx
import type {
  // Folios
  Folio, FolioSection, FolioStatus,
  // Slots
  Slot, SlotType, SlotMetadata, SlotValue,
  // Comments
  Comment, CommentThread, CommentType,
  // Revisions
  Revision, RevisionType,
  // Collaboration
  CollaborationUser, ConnectionStatus, CollaborationState,
  // Header/Footer
  HeaderFooterContent, FolioHeaderFooter,
  // Mentions
  Mention, MentionType,
  // Query Builder
  QueryCondition, QueryGroup, QueryOperator,
  // Slash Menu
  SlashMenuItem, CommandCategory,
  // Export
  ExportFormat, PdfExportOptions, DocxExportOptions,
  // Footnotes
  Footnote, FootnotePosition,
  // Spell Check
  SpellCheckLanguage,
  // Layout
  Orientation, A4Dimensions,
} from 'certeafiles-editor';
```

---

## Exemples complets

### Application avec sidebar de pages

```tsx
import { useState } from 'react';
import { CerteafilesEditor, FolioPanel, useFolioStore } from 'certeafiles-editor';

function EditorWithSidebar() {
  const [zoom, setZoom] = useState(0.8);

  return (
    <div className="flex h-screen">
      <aside className="w-48 border-r">
        <FolioPanel showAddButton={true} showActions={true} />
      </aside>
      <main className="flex-1">
        <CerteafilesEditor
          zoom={zoom}
          showToolbar={true}
          showCommentPanel={true}
        />
      </main>
    </div>
  );
}
```

### Application collaborative complète

```tsx
import {
  CerteafilesEditor,
  FolioPanel,
  RevisionPanel,
  CollaborationStatus,
  useCollaboration,
  useRevisionStore,
} from 'certeafiles-editor';

function CollaborativeApp() {
  const collaboration = useCollaboration({
    roomId: 'shared-document-123',
    userName: 'Utilisateur',
  });
  const { trackingEnabled, toggleTracking } = useRevisionStore();

  return (
    <div className="h-screen flex flex-col">
      <header className="h-12 border-b flex items-center justify-between px-4">
        <label>
          <input type="checkbox" checked={trackingEnabled} onChange={toggleTracking} />
          Track Changes
        </label>
        <CollaborationStatus status={collaboration.connectionStatus} />
      </header>
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-48 border-r">
          <FolioPanel showAddButton showActions />
        </aside>
        <main className="flex-1">
          <CerteafilesEditor
            showToolbar={true}
            enableCollaboration={true}
            collaborationRoomId="shared-document-123"
            collaborationUser={{
              id: collaboration.currentUser.id,
              name: collaboration.currentUser.name,
              color: collaboration.currentUser.color,
            }}
          />
        </main>
        {trackingEnabled && (
          <aside className="w-64 border-l">
            <RevisionPanel />
          </aside>
        )}
      </div>
    </div>
  );
}
```

---

## Support

Pour toute question ou problème, ouvrez une issue sur GitHub :
https://github.com/yassine-techini/certeafiles-editor/issues
