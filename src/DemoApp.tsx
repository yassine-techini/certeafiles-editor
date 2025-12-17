/**
 * DemoApp - Demonstration page with 20+ folios pre-populated with varied content
 * Includes different headers/footers per section
 */
import { useCallback, useEffect, useState, useRef } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createListNode, $createListItemNode } from '@lexical/list';
import {
  $createTableNode,
  $createTableRowNode,
  $createTableCellNode,
  TableCellHeaderStates,
} from '@lexical/table';

import { CerteafilesEditor, ZoomControl } from './components/Editor';
import { FolioPanel } from './components/Folios';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFolioStore } from './stores/folioStore';
import { useHeaderFooterStore } from './stores/headerFooterStore';
import { useFolioThumbnails } from './hooks';
import { A4_CONSTANTS } from './utils/a4-constants';
import type { Orientation } from './utils/a4-constants';

// Demo content data
const DEMO_SECTIONS = [
  { id: 'intro', name: 'Introduction', pageCount: 3 },
  { id: 'chapter1', name: 'Chapter 1: Overview', pageCount: 5 },
  { id: 'chapter2', name: 'Chapter 2: Technical Details', pageCount: 6 },
  { id: 'chapter3', name: 'Chapter 3: Results', pageCount: 4 },
  { id: 'appendix', name: 'Appendices', pageCount: 4 },
];

// Sample text content for pages
const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.',
];

const TECHNICAL_TERMS = [
  'Architecture', 'Implementation', 'Performance', 'Scalability', 'Security',
  'Database', 'API', 'Frontend', 'Backend', 'Infrastructure',
];

const METRICS_DATA = [
  { metric: 'Response Time', value: '45ms', target: '<100ms', status: 'Good' },
  { metric: 'Throughput', value: '1,200 req/s', target: '>1,000', status: 'Good' },
  { metric: 'Error Rate', value: '0.02%', target: '<1%', status: 'Excellent' },
  { metric: 'Uptime', value: '99.99%', target: '>99.9%', status: 'Excellent' },
  { metric: 'CPU Usage', value: '35%', target: '<70%', status: 'Good' },
  { metric: 'Memory Usage', value: '2.1GB', target: '<4GB', status: 'Good' },
];

const TIMELINE_DATA = [
  { phase: 'Planning', start: 'Jan 2024', end: 'Feb 2024', status: 'Completed' },
  { phase: 'Design', start: 'Feb 2024', end: 'Mar 2024', status: 'Completed' },
  { phase: 'Development', start: 'Mar 2024', end: 'Aug 2024', status: 'Completed' },
  { phase: 'Testing', start: 'Aug 2024', end: 'Oct 2024', status: 'Completed' },
  { phase: 'Deployment', start: 'Oct 2024', end: 'Nov 2024', status: 'In Progress' },
  { phase: 'Maintenance', start: 'Nov 2024', end: 'Ongoing', status: 'Planned' },
];

function DemoApp(): JSX.Element {
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState<number>(A4_CONSTANTS.ZOOM_DEFAULT);
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef<LexicalEditor | null>(null);

  // Folio store state and actions
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const activeFolio = useFolioStore((state) => state.getActiveFolio());
  const folioStore = useFolioStore.getState();
  const headerFooterStore = useHeaderFooterStore.getState();

  // Thumbnail generation hook
  const { thumbnails, generateThumbnail } = useFolioThumbnails({
    debounceMs: 500,
    autoUpdate: true,
  });

  // Initialize demo content
  useEffect(() => {
    if (isInitialized) return;

    console.log('[DemoApp] Initializing demo content with 20+ folios...');

    // Clear existing data
    folioStore.clear();
    headerFooterStore.clear();

    // Create different header/footer templates
    const introHeaderId = headerFooterStore.createHeader({
      left: { type: 'text', content: 'CerteaFiles Editor' },
      center: { type: 'text', content: 'Introduction' },
      right: { type: 'dynamic', dynamicField: { type: 'date' } },
    });

    const introFooterId = headerFooterStore.createFooter({
      left: { type: 'text', content: 'Confidential' },
      center: { type: 'dynamic', dynamicField: { type: 'page_number' } },
      right: { type: 'text', content: 'v1.0.0' },
    });

    const chapter1HeaderId = headerFooterStore.createHeader({
      left: { type: 'text', content: 'Chapter 1' },
      center: { type: 'text', content: 'System Overview' },
      right: { type: 'dynamic', dynamicField: { type: 'date' } },
    });

    const chapter1FooterId = headerFooterStore.createFooter({
      left: { type: 'text', content: 'Technical Documentation' },
      center: { type: 'dynamic', dynamicField: { type: 'page_number' } },
      right: { type: 'text', content: '' },
    });

    const chapter2HeaderId = headerFooterStore.createHeader({
      left: { type: 'text', content: 'Chapter 2' },
      center: { type: 'text', content: 'Technical Details' },
      right: { type: 'dynamic', dynamicField: { type: 'date' } },
    });

    const chapter2FooterId = headerFooterStore.createFooter({
      left: { type: 'text', content: 'Architecture Guide' },
      center: { type: 'dynamic', dynamicField: { type: 'page_number' } },
      right: { type: 'text', content: '' },
    });

    const chapter3HeaderId = headerFooterStore.createHeader({
      left: { type: 'text', content: 'Chapter 3' },
      center: { type: 'text', content: 'Results & Analysis' },
      right: { type: 'dynamic', dynamicField: { type: 'date' } },
    });

    const chapter3FooterId = headerFooterStore.createFooter({
      left: { type: 'text', content: 'Performance Report' },
      center: { type: 'dynamic', dynamicField: { type: 'page_number' } },
      right: { type: 'text', content: '' },
    });

    const appendixHeaderId = headerFooterStore.createHeader({
      left: { type: 'text', content: 'Appendices' },
      center: { type: 'text', content: '' },
      right: { type: 'dynamic', dynamicField: { type: 'date' } },
    });

    const appendixFooterId = headerFooterStore.createFooter({
      left: { type: 'text', content: '' },
      center: { type: 'dynamic', dynamicField: { type: 'page_number' } },
      right: { type: 'text', content: 'Reference Material' },
    });

    // Map section IDs to header/footer IDs
    const sectionHeaders: Record<string, string> = {
      intro: introHeaderId,
      chapter1: chapter1HeaderId,
      chapter2: chapter2HeaderId,
      chapter3: chapter3HeaderId,
      appendix: appendixHeaderId,
    };

    const sectionFooters: Record<string, string> = {
      intro: introFooterId,
      chapter1: chapter1FooterId,
      chapter2: chapter2FooterId,
      chapter3: chapter3FooterId,
      appendix: appendixFooterId,
    };

    // Create sections
    DEMO_SECTIONS.forEach((section) => {
      folioStore.createSection(section.name);
    });

    // Create folios with content
    let pageNumber = 1;
    let firstFolioId: string | null = null;

    DEMO_SECTIONS.forEach((section, sectionIndex) => {
      for (let i = 0; i < section.pageCount; i++) {
        const folioId = folioStore.createFolio({
          orientation: sectionIndex === 2 && i === 2 ? 'landscape' : 'portrait', // One landscape page in Chapter 2
        });

        if (!firstFolioId) {
          firstFolioId = folioId;
        }

        // Assign header/footer based on section
        headerFooterStore.setFolioHeaderOverride(folioId, sectionHeaders[section.id]);
        headerFooterStore.setFolioFooterOverride(folioId, sectionFooters[section.id]);

        pageNumber++;
      }
    });

    // Set first folio as active
    if (firstFolioId) {
      folioStore.setActiveFolio(firstFolioId);
    }

    // Set default header/footer
    headerFooterStore.setDefaultHeader(introHeaderId);
    headerFooterStore.setDefaultFooter(introFooterId);

    setIsInitialized(true);
    console.log('[DemoApp] Demo content initialized with', pageNumber - 1, 'folios');
  }, [isInitialized, folioStore, headerFooterStore]);

  // Get orientation from active folio
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

  // Handle toggling folio orientation
  const handleToggleOrientation = useCallback(
    (id: string) => {
      folioStore.toggleOrientation(id);
    },
    [folioStore]
  );

  // Handle editor ready - populate with content
  const handleEditorReady = useCallback(
    (editor: LexicalEditor) => {
      editorRef.current = editor;

      // Populate editor with demo content based on active folio
      if (activeFolio) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();

          const folioIndex = activeFolio.index;
          const sectionInfo = getSectionForFolioIndex(folioIndex);

          // Add heading
          const heading = $createHeadingNode('h1');
          heading.append($createTextNode(sectionInfo.title));
          root.append(heading);

          // Add content based on section type
          if (sectionInfo.section === 'intro') {
            addIntroductionContent(root, sectionInfo.pageInSection);
          } else if (sectionInfo.section === 'chapter1') {
            addChapter1Content(root, sectionInfo.pageInSection);
          } else if (sectionInfo.section === 'chapter2') {
            addChapter2Content(root, sectionInfo.pageInSection);
          } else if (sectionInfo.section === 'chapter3') {
            addChapter3Content(root, sectionInfo.pageInSection);
          } else if (sectionInfo.section === 'appendix') {
            addAppendixContent(root, sectionInfo.pageInSection);
          }
        });
      }
    },
    [activeFolio]
  );

  // Repopulate content when active folio changes
  useEffect(() => {
    if (editorRef.current && activeFolio && isInitialized) {
      handleEditorReady(editorRef.current);
    }
  }, [activeFolioId, isInitialized]);

  return (
    <div className="flex h-screen w-full bg-gray-100">
      {/* Left Panel - Folio Thumbnails */}
      <FolioPanel thumbnails={thumbnails} width={220} showSections={true} />

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CE</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-800">
                CerteaFiles Editor Demo
              </span>
              <span className="text-xs text-gray-400 ml-2">
                20+ Pages Document
              </span>
            </div>
          </div>

          {/* Orientation Toggle */}
          {activeFolioId && (
            <div className="flex items-center gap-1 ml-4 border-l border-gray-300 pl-4">
              <button
                type="button"
                onClick={() => handleToggleOrientation(activeFolioId)}
                className={`px-3 py-1.5 text-xs font-medium rounded-l-lg transition-colors ${
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
                className={`px-3 py-1.5 text-xs font-medium rounded-r-lg transition-colors ${
                  orientation === 'landscape'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Landscape
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
            <span className="px-2 py-1 bg-gray-100 rounded">
              {wordCount} words
            </span>
            <span className="px-2 py-1 bg-gray-100 rounded">
              Page {(activeFolio?.index ?? 0) + 1} of {useFolioStore.getState().getFoliosInOrder().length}
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-auto bg-gray-200 p-8">
          <ErrorBoundary
            fallback={
              <div className="text-center p-8 text-red-600">
                Editor failed to load. Please refresh the page.
              </div>
            }
          >
            {isInitialized && (
              <CerteafilesEditor
                placeholder="Start typing..."
                onChange={handleEditorChange}
                onReady={handleEditorReady}
                orientation={orientation}
                zoom={zoom}
                className="mx-auto"
                showToolbar={true}
                showCommentPanel={false}
              />
            )}
          </ErrorBoundary>
        </div>
      </main>

      {/* Right Panel - Info */}
      <aside className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Document Structure</h3>
          <p className="text-xs text-gray-500 mt-1">
            22 pages with varied content and headers/footers
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Section Overview */}
          <div className="space-y-3">
            {DEMO_SECTIONS.map((section) => (
              <div
                key={section.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {section.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {section.pageCount} pages
                  </span>
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: section.pageCount }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-4 bg-blue-200 rounded-sm"
                      title={`Page ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Content Types */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Content Types Included
            </h4>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                Rich Text (Headings, Paragraphs)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Tables (Data, Metrics)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full" />
                Bullet & Numbered Lists
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                Headers & Footers (5 variants)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Page Numbers (Dynamic)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-teal-500 rounded-full" />
                Landscape Page (Chapter 2)
              </li>
            </ul>
          </div>

          {/* Header/Footer Info */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Headers/Footers per Section
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-blue-50 rounded border-l-2 border-blue-400">
                <span className="font-medium">Introduction:</span>
                <span className="text-gray-600 ml-1">Company branding + Date</span>
              </div>
              <div className="p-2 bg-green-50 rounded border-l-2 border-green-400">
                <span className="font-medium">Chapter 1:</span>
                <span className="text-gray-600 ml-1">Section title + Page #</span>
              </div>
              <div className="p-2 bg-purple-50 rounded border-l-2 border-purple-400">
                <span className="font-medium">Chapter 2:</span>
                <span className="text-gray-600 ml-1">Technical docs style</span>
              </div>
              <div className="p-2 bg-orange-50 rounded border-l-2 border-orange-400">
                <span className="font-medium">Chapter 3:</span>
                <span className="text-gray-600 ml-1">Results report style</span>
              </div>
              <div className="p-2 bg-gray-100 rounded border-l-2 border-gray-400">
                <span className="font-medium">Appendices:</span>
                <span className="text-gray-600 ml-1">Reference style</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-400">
            <p className="font-medium text-gray-600 mb-2">Keyboard shortcuts:</p>
            <div className="grid grid-cols-2 gap-1">
              <span>Ctrl+B: Bold</span>
              <span>Ctrl+I: Italic</span>
              <span>Ctrl+U: Underline</span>
              <span>Ctrl+Z: Undo</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Helper function to get section info for a folio index
function getSectionForFolioIndex(folioIndex: number): {
  section: string;
  title: string;
  pageInSection: number;
} {
  let currentIndex = 0;
  for (const section of DEMO_SECTIONS) {
    if (folioIndex < currentIndex + section.pageCount) {
      return {
        section: section.id,
        title: section.name,
        pageInSection: folioIndex - currentIndex,
      };
    }
    currentIndex += section.pageCount;
  }
  return { section: 'intro', title: 'Introduction', pageInSection: 0 };
}

// Content generation functions
function addIntroductionContent(root: ReturnType<typeof $getRoot>, pageIndex: number): void {
  if (pageIndex === 0) {
    // Title page
    const subtitle = $createHeadingNode('h2');
    subtitle.append($createTextNode('Technical Documentation'));
    root.append(subtitle);

    const version = $createParagraphNode();
    version.append($createTextNode('Version 1.0.0 - December 2024'));
    root.append(version);

    const author = $createParagraphNode();
    author.append($createTextNode('Prepared by: CerteaFiles Team'));
    root.append(author);

    // Add description paragraphs
    LOREM_PARAGRAPHS.slice(0, 3).forEach((text) => {
      const para = $createParagraphNode();
      para.append($createTextNode(text));
      root.append(para);
    });
  } else if (pageIndex === 1) {
    // Table of Contents
    const tocTitle = $createHeadingNode('h2');
    tocTitle.append($createTextNode('Table of Contents'));
    root.append(tocTitle);

    const list = $createListNode('number');
    DEMO_SECTIONS.forEach((section) => {
      const item = $createListItemNode();
      item.append($createTextNode(`${section.name} (${section.pageCount} pages)`));
      list.append(item);
    });
    root.append(list);

    const note = $createParagraphNode();
    note.append($createTextNode('This document contains detailed technical information about the CerteaFiles Editor system, including architecture, implementation details, performance analysis, and reference materials.'));
    root.append(note);
  } else {
    // Executive Summary
    const summaryTitle = $createHeadingNode('h2');
    summaryTitle.append($createTextNode('Executive Summary'));
    root.append(summaryTitle);

    LOREM_PARAGRAPHS.forEach((text) => {
      const para = $createParagraphNode();
      para.append($createTextNode(text));
      root.append(para);
    });
  }
}

function addChapter1Content(root: ReturnType<typeof $getRoot>, pageIndex: number): void {
  const subheading = $createHeadingNode('h2');
  subheading.append($createTextNode(`Section 1.${pageIndex + 1}`));
  root.append(subheading);

  if (pageIndex === 0) {
    // System overview with bullet list
    const intro = $createParagraphNode();
    intro.append($createTextNode('The CerteaFiles Editor is a comprehensive document editing solution with the following key components:'));
    root.append(intro);

    const list = $createListNode('bullet');
    const components = [
      'Multi-folio document management with drag-and-drop reordering',
      'A4 document layout with portrait and landscape orientation support',
      'Rich text editing powered by Lexical editor framework',
      'Real-time collaboration using Yjs for concurrent editing',
      'Thread-based comments with document alignment',
      'Full revision history with visual diff comparison',
    ];
    components.forEach((text) => {
      const item = $createListItemNode();
      item.append($createTextNode(text));
      list.append(item);
    });
    root.append(list);
  } else if (pageIndex === 1) {
    // Architecture overview table
    const table = createSimpleTable([
      ['Component', 'Technology', 'Purpose'],
      ['Editor Core', 'Lexical', 'Rich text editing'],
      ['State Management', 'Zustand', 'Application state'],
      ['Collaboration', 'Yjs + WebSocket', 'Real-time sync'],
      ['UI Framework', 'React 18', 'Component rendering'],
      ['Styling', 'Tailwind CSS', 'Utility-first CSS'],
      ['Build Tool', 'Vite', 'Fast development'],
    ]);
    root.append(table);

    const note = $createParagraphNode();
    note.append($createTextNode('Table 1.1: Technology stack overview'));
    root.append(note);
  } else {
    // Regular content
    LOREM_PARAGRAPHS.slice(0, 3).forEach((text, i) => {
      if (i === 0) {
        const boldStart = $createParagraphNode();
        const boldText = $createTextNode(TECHNICAL_TERMS[pageIndex % TECHNICAL_TERMS.length] + ': ');
        boldText.toggleFormat('bold');
        boldStart.append(boldText);
        boldStart.append($createTextNode(text));
        root.append(boldStart);
      } else {
        const para = $createParagraphNode();
        para.append($createTextNode(text));
        root.append(para);
      }
    });
  }
}

function addChapter2Content(root: ReturnType<typeof $getRoot>, pageIndex: number): void {
  const subheading = $createHeadingNode('h2');
  subheading.append($createTextNode(`Technical Detail 2.${pageIndex + 1}`));
  root.append(subheading);

  if (pageIndex === 0) {
    // API documentation style
    const apiTitle = $createHeadingNode('h3');
    apiTitle.append($createTextNode('API Reference'));
    root.append(apiTitle);

    const list = $createListNode('bullet');
    const apis = [
      'createFolio(payload?: FolioCreatePayload): string',
      'deleteFolio(id: string): void',
      'updateFolioContent(id: string, content: SerializedEditorState): void',
      'reorderFolios(orderedIds: string[]): void',
      'toggleOrientation(id: string): void',
    ];
    apis.forEach((text) => {
      const item = $createListItemNode();
      const code = $createTextNode(text);
      code.toggleFormat('code');
      item.append(code);
      list.append(item);
    });
    root.append(list);
  } else if (pageIndex === 2) {
    // Performance metrics table (landscape page)
    const table = createSimpleTable([
      ['Metric', 'Current Value', 'Target', 'Status'],
      ...METRICS_DATA.map((d) => [d.metric, d.value, d.target, d.status]),
    ]);
    root.append(table);

    const caption = $createParagraphNode();
    caption.append($createTextNode('Table 2.1: Performance metrics dashboard (landscape view for better readability)'));
    root.append(caption);
  } else if (pageIndex === 3) {
    // Code example style
    const codeTitle = $createHeadingNode('h3');
    codeTitle.append($createTextNode('Implementation Example'));
    root.append(codeTitle);

    const codeBlock = $createParagraphNode();
    const code = $createTextNode(`
// Example: Creating a new folio with content
const folioId = useFolioStore.getState().createFolio({
  title: 'New Document',
  orientation: 'portrait',
});

// Update folio content
useFolioStore.getState().updateFolioContent(
  folioId,
  editor.getEditorState().toJSON()
);
    `.trim());
    code.toggleFormat('code');
    codeBlock.append(code);
    root.append(codeBlock);
  } else {
    // Regular technical content
    LOREM_PARAGRAPHS.slice(0, 4).forEach((text) => {
      const para = $createParagraphNode();
      para.append($createTextNode(text));
      root.append(para);
    });
  }
}

function addChapter3Content(root: ReturnType<typeof $getRoot>, pageIndex: number): void {
  const subheading = $createHeadingNode('h2');
  subheading.append($createTextNode(`Results ${pageIndex + 1}`));
  root.append(subheading);

  if (pageIndex === 0) {
    // Results summary
    const summary = $createParagraphNode();
    summary.append($createTextNode('The following results were observed during performance testing and validation:'));
    root.append(summary);

    const list = $createListNode('number');
    const results = [
      'Initial load time reduced by 45% through lazy loading optimizations',
      'Memory usage decreased by 30% with virtualized folio list',
      'Collaboration sync latency improved to under 200ms',
      'Editor responsiveness maintained at 60fps during heavy operations',
    ];
    results.forEach((text) => {
      const item = $createListItemNode();
      item.append($createTextNode(text));
      list.append(item);
    });
    root.append(list);
  } else if (pageIndex === 1) {
    // Timeline table
    const table = createSimpleTable([
      ['Phase', 'Start Date', 'End Date', 'Status'],
      ...TIMELINE_DATA.map((d) => [d.phase, d.start, d.end, d.status]),
    ]);
    root.append(table);

    const caption = $createParagraphNode();
    caption.append($createTextNode('Table 3.1: Project timeline and milestones'));
    root.append(caption);
  } else {
    // Analysis paragraphs
    LOREM_PARAGRAPHS.forEach((text) => {
      const para = $createParagraphNode();
      para.append($createTextNode(text));
      root.append(para);
    });
  }
}

function addAppendixContent(root: ReturnType<typeof $getRoot>, pageIndex: number): void {
  const subheading = $createHeadingNode('h2');
  subheading.append($createTextNode(`Appendix ${String.fromCharCode(65 + pageIndex)}`));
  root.append(subheading);

  if (pageIndex === 0) {
    // Glossary
    const glossaryTitle = $createHeadingNode('h3');
    glossaryTitle.append($createTextNode('Glossary of Terms'));
    root.append(glossaryTitle);

    const terms = [
      ['Folio', 'A single page or document unit within the editor'],
      ['Lexical', 'The extensible text editor framework used by CerteaFiles'],
      ['Yjs', 'A CRDT-based library for real-time collaboration'],
      ['Zustand', 'A lightweight state management library for React'],
      ['CRDT', 'Conflict-free Replicated Data Type'],
    ];

    terms.forEach(([term, definition]) => {
      const para = $createParagraphNode();
      const termText = $createTextNode(term + ': ');
      termText.toggleFormat('bold');
      para.append(termText);
      para.append($createTextNode(definition));
      root.append(para);
    });
  } else if (pageIndex === 1) {
    // References
    const refsTitle = $createHeadingNode('h3');
    refsTitle.append($createTextNode('References'));
    root.append(refsTitle);

    const list = $createListNode('number');
    const refs = [
      'Lexical Editor Documentation - https://lexical.dev',
      'React 18 Documentation - https://react.dev',
      'Yjs CRDT Library - https://yjs.dev',
      'Zustand State Management - https://zustand-demo.pmnd.rs',
      'Tailwind CSS Framework - https://tailwindcss.com',
    ];
    refs.forEach((text) => {
      const item = $createListItemNode();
      item.append($createTextNode(text));
      list.append(item);
    });
    root.append(list);
  } else {
    // Additional reference content
    LOREM_PARAGRAPHS.slice(0, 3).forEach((text) => {
      const para = $createParagraphNode();
      para.append($createTextNode(text));
      root.append(para);
    });
  }
}

// Helper to create a simple table
function createSimpleTable(data: string[][]): ReturnType<typeof $createTableNode> {
  const table = $createTableNode();

  data.forEach((rowData, rowIndex) => {
    const row = $createTableRowNode();

    rowData.forEach((cellText) => {
      const cell = $createTableCellNode(
        rowIndex === 0 ? TableCellHeaderStates.ROW : TableCellHeaderStates.NO_STATUS
      );
      const para = $createParagraphNode();
      const text = $createTextNode(cellText);
      if (rowIndex === 0) {
        text.toggleFormat('bold');
      }
      para.append(text);
      cell.append(para);
      row.append(cell);
    });

    table.append(row);
  });

  return table;
}

export default DemoApp;
