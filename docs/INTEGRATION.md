# CerteaFiles Editor - Guide d'Intégration

Ce guide explique comment intégrer le CerteaFiles Editor dans un autre projet.

## Architecture

L'éditeur est construit avec :
- **Lexical** (v0.20.0) - Framework d'édition de texte de Meta
- **React** (v18.3.1) - Bibliothèque UI
- **Zustand** - Gestion d'état
- **TailwindCSS** - Styles

## Structure des Composants

```
src/
├── components/
│   ├── Editor/
│   │   ├── CerteafilesEditor.tsx    # Composant principal
│   │   ├── EditorToolbar.tsx        # Barre d'outils
│   │   ├── FloatingToolbar.tsx      # Toolbar contextuel
│   │   └── SpecialTables/           # Tableaux métier
│   ├── Comments/                     # Système de commentaires
│   ├── Export/                       # Export PDF/DOCX
│   ├── QueryBuilder/                 # Builder de requêtes
│   └── Revisions/                    # Track Changes
├── nodes/                            # Nodes Lexical personnalisés
├── plugins/                          # Plugins Lexical
├── stores/                           # Stores Zustand
├── types/                            # Types TypeScript
└── utils/                            # Utilitaires
```

## Intégration Basique

### 1. Installation des Dépendances

```bash
pnpm add lexical @lexical/react @lexical/rich-text @lexical/list @lexical/table @lexical/utils zustand lucide-react
```

### 2. Import du Composant

```tsx
import { CerteafilesEditor } from './components/Editor/CerteafilesEditor';

function MyApp() {
  const handleChange = (editorState, editor) => {
    // Sauvegarde ou traitement des changements
    console.log(editorState.toJSON());
  };

  return (
    <CerteafilesEditor
      onChange={handleChange}
      className="min-h-[600px]"
    />
  );
}
```

### 3. Props Disponibles

| Prop | Type | Description |
|------|------|-------------|
| `onChange` | `(state, editor) => void` | Callback sur changement |
| `className` | `string` | Classes CSS additionnelles |
| `initialContent` | `string` | Contenu JSON initial |
| `readOnly` | `boolean` | Mode lecture seule |

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
  const { slots, addSlot, updateSlot } = useSlotStore();

  const handleAddSlot = () => {
    addSlot({
      name: 'Nom du client',
      type: 'text',
      required: true,
    });
  };

  return (
    <div>
      <button onClick={handleAddSlot}>Ajouter un slot</button>
      {slots.map(slot => (
        <div key={slot.id}>
          {slot.name}: {slot.value || '(vide)'}
        </div>
      ))}
    </div>
  );
}
```

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

## Support

Pour toute question ou problème, ouvrez une issue sur GitHub :
https://github.com/yassine-techini/certeafiles-editor/issues
