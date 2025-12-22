# CerteaFiles Editor

A high-performance, multi-folio document editor built with React, Lexical, and TypeScript. Designed for professional document editing with real-time collaboration, comments, revisions tracking, and A4 print-ready output.

## Live Demo

- **Production**: https://certeafiles-editor.pages.dev
- **Playground**: https://certeafiles-editor.pages.dev/playground

## Features

### Document Editing
- **Multi-Folio Editing** - Manage multiple pages with drag-and-drop reordering
- **A4 Document Layout** - Print-ready pages with portrait/landscape orientation
- **Rich Text Editing** - Full formatting support via Lexical editor
- **Auto-Pagination** - Automatic page creation when content overflows
- **Header/Footer Templates** - Customizable page headers and footers
- **Page Numbering** - Automatic pagination with format options

### Collaboration
- **Real-time Collaboration** - Yjs-powered concurrent editing with presence awareness
- **Cloudflare Durable Objects** - Backend for persistent collaboration state
- **Comments & Annotations** - Thread-based comments aligned with document content
- **Revision History** - Full change tracking with visual diffs

### Themes
Four color themes available:
- **Amethyst** (Purple) - Default
- **Sapphire** (Blue)
- **Aqua** (Teal)
- **Emerald** (Green)

### Export/Import
- Export to PDF
- Export to DOCX (Microsoft Word)
- Import from PDF
- Import from DOCX

### Performance
- Virtualized lists for 100+ pages
- Lazy-loaded plugins
- Debounced saves
- Canvas-based thumbnail generation

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CerteafilesEditor                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌────────────────────────────────────────────┐   │
│  │ FolioPanel  │  │              LexicalComposer               │   │
│  │             │  │  ┌──────────────────────────────────────┐  │   │
│  │ - Thumbnails│  │  │           FolioNode (Page)           │  │   │
│  │ - Sections  │  │  │  ┌────────────────────────────────┐  │  │   │
│  │ - Drag/Drop │  │  │  │       Document Content         │  │  │   │
│  │             │  │  │  │   - Rich Text                  │  │  │   │
│  │ Virtualized │  │  │  │   - Tables                     │  │  │   │
│  │ for 100+    │  │  │  │   - Images                     │  │  │   │
│  │ folios      │  │  │  │   - Comments                   │  │  │   │
│  └─────────────┘  │  │  └────────────────────────────────┘  │  │   │
│                   │  └──────────────────────────────────────┘  │   │
│                   │                                             │   │
│                   │  Plugins: FolioPlugin, AutoPaginationPlugin,│   │
│                   │  CollaborationPlugin, HeaderFooterPlugin,   │   │
│                   │  CommentPlugin, TrackChangesPlugin          │   │
│                   └─────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  Stores: folioStore, documentStore, commentStore, revisionStore    │
└─────────────────────────────────────────────────────────────────────┘
```

## Project Structure

```
certeafiles-editor/
├── src/
│   ├── components/
│   │   ├── Editor/           # Main editor components
│   │   │   ├── CerteafilesEditor.tsx
│   │   │   └── EditorToolbar.tsx
│   │   ├── Folios/           # Page management
│   │   │   ├── FolioPanel.tsx
│   │   │   └── FolioThumbnail.tsx
│   │   ├── DocumentList/     # Document management
│   │   └── ThemeSelector/    # Theme switching
│   ├── nodes/                # Custom Lexical nodes
│   │   ├── FolioNode.ts      # Page node
│   │   └── PageBreakNode.ts
│   ├── plugins/              # Lexical plugins
│   │   ├── FolioPlugin.tsx   # Page sync with store
│   │   ├── AutoPaginationPlugin.tsx
│   │   ├── CollaborationPlugin.tsx
│   │   └── HeaderFooterPlugin.tsx
│   ├── stores/               # Zustand state management
│   │   ├── folioStore.ts     # Page state
│   │   └── documentStore.ts  # Document state
│   ├── contexts/             # React contexts
│   │   └── ThemeContext.tsx
│   ├── hooks/                # Custom hooks
│   ├── types/                # TypeScript types
│   ├── styles/               # Theme CSS files
│   └── utils/                # Utilities
├── backend/
│   └── yjs-server/           # Cloudflare Durable Objects Yjs server
│       ├── src/
│       │   ├── index.ts
│       │   └── YjsRoom.ts
│       └── wrangler.toml
└── public/
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yassine-techini/certeafiles-editor.git
cd certeafiles-editor

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server at http://localhost:5173 |
| `pnpm build` | Build for production |
| `pnpm test` | Run unit tests with Vitest |
| `pnpm test:e2e` | Run E2E tests with Playwright |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |

## API Documentation

### CerteafilesEditor

The main editor component.

```tsx
import { CerteafilesEditor } from 'certeafiles-editor';

<CerteafilesEditor
  placeholder="Start typing..."
  orientation="portrait"
  zoom={0.75}
  showToolbar={true}
  showFolioPanel={true}
  editable={true}
  enableCollaboration={false}
  onChange={(state) => {}}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | "Start typing..." | Placeholder text |
| `orientation` | `'portrait' \| 'landscape'` | `'portrait'` | Default page orientation |
| `zoom` | `number` | `0.75` | Zoom level (0.25 - 2.0) |
| `showToolbar` | `boolean` | `true` | Show/hide toolbar |
| `showFolioPanel` | `boolean` | `true` | Show/hide page panel |
| `editable` | `boolean` | `true` | Enable/disable editing |
| `enableCollaboration` | `boolean` | `false` | Enable real-time collaboration |
| `onChange` | `function` | - | Callback on content change |

### FolioStore

Manages document pages (folios).

```typescript
import { useFolioStore } from './stores/folioStore';

// Get folios
const folios = useFolioStore(state => state.folios);
const activeFolioId = useFolioStore(state => state.activeFolioId);

// Actions
const { createFolio, deleteFolio, setActiveFolio, updateFolioOrientation } = useFolioStore.getState();

// Create new folio
createFolio({ afterId: 'folio-123' });

// Change orientation
updateFolioOrientation('folio-123', 'landscape');
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + U` | Underline |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |

## Deployment

### Cloudflare Pages (Frontend)

```bash
# Build and deploy to production
pnpm build
CLOUDFLARE_ACCOUNT_ID=<your-account-id> wrangler pages deploy dist --project-name=certeafiles-editor --branch=main
```

### Yjs Server (Durable Objects)

```bash
cd backend/yjs-server
pnpm install
CLOUDFLARE_ACCOUNT_ID=<your-account-id> wrangler deploy
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Editor**: Lexical (Meta's text editor framework)
- **Styling**: Tailwind CSS
- **State Management**: Zustand with subscribeWithSelector
- **Collaboration**: Yjs, y-partykit
- **Backend**: Cloudflare Workers, Durable Objects
- **Testing**: Vitest, Playwright
- **Deployment**: Cloudflare Pages

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Repository

- **GitHub**: https://github.com/yassine-techini/certeafiles-editor
- **Production URL**: https://certeafiles-editor.pages.dev

## License

Private - All rights reserved

## Support

For issues and feature requests, please use [GitHub Issues](https://github.com/yassine-techini/certeafiles-editor/issues).
