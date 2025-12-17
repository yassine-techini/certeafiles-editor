# CerteaFiles Editor

A high-performance, multi-folio document editor built with React, Lexical, and TypeScript. Designed for professional document editing with real-time collaboration, comments, revisions tracking, and A4 print-ready output.

## Features

- **Multi-Folio Editing** - Manage multiple pages with drag-and-drop reordering
- **A4 Document Layout** - Print-ready pages with portrait/landscape orientation
- **Rich Text Editing** - Full formatting support via Lexical editor
- **Real-time Collaboration** - Yjs-powered concurrent editing with presence awareness
- **Comments & Annotations** - Thread-based comments aligned with document content
- **Revision History** - Full change tracking with visual diffs
- **Header/Footer Templates** - Customizable page headers and footers
- **Page Numbering** - Automatic pagination with format options
- **Performance Optimized** - Virtualized lists, lazy-loaded plugins, debounced saves

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CerteafilesEditor                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌────────────────────────────────────────────┐   │
│  │ FolioPanel  │  │              OptimizedEditor               │   │
│  │             │  │  ┌──────────────────────────────────────┐  │   │
│  │ - Thumbnails│  │  │           LexicalComposer            │  │   │
│  │ - Sections  │  │  │  ┌──────────────────────────────┐    │  │   │
│  │ - Drag/Drop │  │  │  │    A4ContentEditable         │    │  │   │
│  │             │  │  │  │  ┌────────────────────────┐  │    │  │   │
│  │ Virtualized │  │  │  │  │   Document Content     │  │    │  │   │
│  │ for 100+    │  │  │  │  │   - Rich Text          │  │    │  │   │
│  │ folios      │  │  │  │  │   - Tables             │  │    │  │   │
│  │             │  │  │  │  │   - Images             │  │    │  │   │
│  └─────────────┘  │  │  │  │   - Comments           │  │    │  │   │
│                   │  │  │  └────────────────────────┘  │    │  │   │
│                   │  │  └──────────────────────────────┘    │  │   │
│                   │  │                                       │  │   │
│                   │  │  Plugins: History, List, Link, Table, │  │   │
│                   │  │  A4Layout, Folio, HeaderFooter,       │  │   │
│                   │  │  Comments, TrackChanges, Collaboration│  │   │
│                   │  └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  Stores: folioStore, commentStore, revisionStore, collaborationStore│
└─────────────────────────────────────────────────────────────────────┘
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd certeafiles-editor

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with HMR |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run unit tests with Vitest |
| `pnpm test:e2e` | Run E2E tests with Playwright |
| `pnpm lint` | Run ESLint |
| `pnpm tsc` | Type check with TypeScript |

## Project Structure

```
src/
├── components/
│   ├── Editor/           # Main editor components
│   │   ├── A4ContentEditable.tsx
│   │   ├── EditorToolbar.tsx
│   │   └── OptimizedEditor.tsx
│   ├── Folios/           # Folio management
│   │   ├── FolioPanel.tsx
│   │   ├── FolioThumbnail.tsx
│   │   ├── FolioSortableList.tsx
│   │   └── VirtualizedFolioList.tsx
│   ├── Comments/         # Comment system
│   │   ├── AlignedCommentPanel.tsx
│   │   └── CommentThread.tsx
│   ├── Revisions/        # Revision history
│   │   ├── RevisionPanel.tsx
│   │   └── RevisionDiff.tsx
│   ├── HeaderFooter/     # Header/footer templates
│   └── UI/               # Shared UI components
│       └── LoadingStates.tsx
├── plugins/              # Lexical plugins
│   ├── A4LayoutPlugin.tsx
│   ├── FolioPlugin.tsx
│   ├── CommentPlugin.tsx
│   ├── CollaborationPlugin.tsx
│   ├── TrackChangesPlugin.tsx
│   └── LazyPlugins.tsx
├── stores/               # Zustand state stores
│   ├── folioStore.ts
│   ├── commentStore.ts
│   ├── revisionStore.ts
│   └── collaborationStore.ts
├── hooks/                # Custom React hooks
│   ├── useFolios.ts
│   ├── useFolioThumbnails.ts
│   ├── useAutoSave.ts
│   └── useKeyboardNavigation.ts
├── utils/                # Utilities
│   ├── a4-constants.ts
│   ├── performance.ts
│   └── generateUUID.ts
└── types/                # TypeScript types
    ├── folio.ts
    ├── comment.ts
    └── revision.ts
```

## API Documentation

### CerteafilesEditor

The main editor component.

```tsx
import { CerteafilesEditor } from './components/Editor/CerteafilesEditor';

<CerteafilesEditor
  initialState={serializedEditorState}
  editable={true}
  orientation="portrait"
  zoom={1.0}
  showToolbar={true}
  showCommentPanel={true}
  onChange={(editorState, editor) => {}}
  onReady={(editor) => {}}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialState` | `string` | - | Serialized Lexical editor state |
| `editable` | `boolean` | `true` | Whether content is editable |
| `orientation` | `'portrait' \| 'landscape'` | `'portrait'` | Page orientation |
| `zoom` | `number` | `1.0` | Zoom level (0.5 - 2.0) |
| `margins` | `object` | - | Custom margins in mm |
| `showToolbar` | `boolean` | `true` | Show editor toolbar |
| `showCommentPanel` | `boolean` | `true` | Show comment panel |
| `onChange` | `function` | - | Called on content change |
| `onReady` | `function` | - | Called when editor is ready |

### FolioStore

Manages document pages (folios).

```typescript
import { useFolioStore } from './stores/folioStore';

// Get folios
const folios = useFolioStore(state => state.getFoliosInOrder());
const activeFolioId = useFolioStore(state => state.activeFolioId);

// Actions
const { createFolio, deleteFolio, reorderFolios, setActiveFolio } = useFolioStore.getState();

// Create new folio
createFolio({ afterId: 'folio-123' });

// Reorder folios
reorderFolios('folio-1', 'folio-3'); // Move folio-1 after folio-3
```

### CommentStore

Manages document comments and threads.

```typescript
import { useCommentStore } from './stores/commentStore';

// Get comments
const threads = useCommentStore(state => state.getThreadsForFolio('folio-123'));

// Actions
const { createThread, addReply, resolveThread, deleteThread } = useCommentStore.getState();

// Create comment thread
createThread({
  content: 'Please review this section',
  anchorKey: 'node-key',
  anchorOffset: 0,
  focusKey: 'node-key',
  focusOffset: 10,
});

// Add reply
addReply('thread-123', 'Thanks for the feedback!');
```

### RevisionStore

Manages revision history.

```typescript
import { useRevisionStore } from './stores/revisionStore';

// Get revisions
const revisions = useRevisionStore(state => state.revisions);
const currentRevision = useRevisionStore(state => state.currentRevisionId);

// Actions
const { createRevision, restoreRevision, compareRevisions } = useRevisionStore.getState();

// Create revision snapshot
createRevision('Added introduction section');

// Restore previous revision
restoreRevision('rev-123');
```

## Performance

The editor is optimized for performance with the following features:

| Metric | Target | Implementation |
|--------|--------|----------------|
| Initial Load | < 2s | Lazy-loaded plugins, code splitting |
| Folio Render | < 100ms | Memoized components, virtualized list |
| Sync Latency | < 200ms | Debounced saves, optimistic updates |
| Thumbnail Gen | < 50ms | Canvas rendering, caching |

### Performance Monitoring

```typescript
import { performanceMonitor, METRIC_NAMES } from './utils/performance';

// Initialize monitoring
performanceMonitor.initialize();

// Get performance summary
const summary = performanceMonitor.getSummary();
console.log(summary);
// {
//   initialLoad: { duration: 1234, target: 2000, met: true },
//   folioRender: { avg: 45, max: 89, target: 100, met: true },
//   ...
// }
```

## Testing

### Unit Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run in watch mode
pnpm test --watch
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm exec playwright test e2e/editor.spec.ts

# Run with UI
pnpm exec playwright test --ui
```

## Deployment

### Build for Production

```bash
pnpm build
```

### Deploy to Cloudflare Pages

```bash
CLOUDFLARE_ACCOUNT_ID=<account-id> pnpm wrangler pages deploy dist
```

## Accessibility

The editor follows WCAG 2.1 AA guidelines:

- **Keyboard Navigation** - Full keyboard support with focus management
- **Screen Reader Support** - ARIA labels and live announcements
- **Focus Trapping** - Modal dialogs trap focus correctly
- **High Contrast** - Supports reduced motion and high contrast modes

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save document |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Ctrl+U` | Underline |

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## License

MIT License - see [LICENSE](LICENSE) for details.
