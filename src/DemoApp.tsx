/**
 * DemoApp - Demonstration page with configurable folios
 * Supports URL parameters: ?demo=empty (1 page), ?demo=small (20 pages), ?demo=large (300 pages)
 */
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import type { EditorState, LexicalEditor } from 'lexical';

import { CerteafilesEditor, ZoomControl } from './components/Editor';
import { FolioPanel } from './components/Folios';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFolioStore } from './stores/folioStore';
import { useHeaderFooterStore } from './stores/headerFooterStore';
import { useFolioThumbnails } from './hooks';
import { A4_CONSTANTS } from './utils/a4-constants';
import { generateLexicalContent } from './utils/demoContent';
import type { Orientation } from './utils/a4-constants';
import { exportToPDF } from './utils/pdfExport';
import { importPDF, selectPDFFile } from './utils/pdfImport';
import { useRevisionStore } from './stores/revisionStore';
import { HeaderFooterEditor } from './components/HeaderFooter/HeaderFooterEditor';
import { useCommentStore } from './stores/commentStore';
import type { CollaborationUser, ConnectionStatus } from './types/collaboration';

// Demo configuration from URL
type DemoType = 'empty' | 'small' | 'large';

interface DemoConfig {
  type: DemoType;
  pageCount: number;
  label: string;
}

function getDemoConfig(): DemoConfig {
  const urlParams = new URLSearchParams(window.location.search);
  const demo = urlParams.get('demo') as DemoType | null;

  switch (demo) {
    case 'small':
      return { type: 'small', pageCount: 20, label: '20 Pages Document' };
    case 'large':
      return { type: 'large', pageCount: 300, label: '300 Pages Document' };
    case 'empty':
    default:
      return { type: 'empty', pageCount: 1, label: 'Empty Document' };
  }
}

// Demo content data - dynamically generated based on page count
function generateDemoSections(totalPages: number): Array<{ id: string; name: string; pageCount: number }> {
  if (totalPages <= 1) {
    return [{ id: 'main', name: 'Document', pageCount: 1 }];
  }

  if (totalPages <= 20) {
    // Distribute pages across 5 sections
    const basePagesPerSection = Math.floor(totalPages / 5);
    const remainder = totalPages % 5;
    return [
      { id: 'intro', name: 'Introduction', pageCount: basePagesPerSection + (remainder > 0 ? 1 : 0) },
      { id: 'chapter1', name: 'Chapter 1: Overview', pageCount: basePagesPerSection + (remainder > 1 ? 1 : 0) },
      { id: 'chapter2', name: 'Chapter 2: Technical Details', pageCount: basePagesPerSection + (remainder > 2 ? 1 : 0) },
      { id: 'chapter3', name: 'Chapter 3: Results', pageCount: basePagesPerSection + (remainder > 3 ? 1 : 0) },
      { id: 'appendix', name: 'Appendices', pageCount: basePagesPerSection + (remainder > 4 ? 1 : 0) },
    ];
  }

  // For large documents (300 pages), create more sections
  const sectionsCount = 10;
  const basePagesPerSection = Math.floor(totalPages / sectionsCount);
  const remainder = totalPages % sectionsCount;

  return [
    { id: 'intro', name: 'Introduction', pageCount: basePagesPerSection + (remainder > 0 ? 1 : 0) },
    { id: 'chapter1', name: 'Chapter 1: Overview', pageCount: basePagesPerSection + (remainder > 1 ? 1 : 0) },
    { id: 'chapter2', name: 'Chapter 2: Architecture', pageCount: basePagesPerSection + (remainder > 2 ? 1 : 0) },
    { id: 'chapter3', name: 'Chapter 3: Implementation', pageCount: basePagesPerSection + (remainder > 3 ? 1 : 0) },
    { id: 'chapter4', name: 'Chapter 4: Testing', pageCount: basePagesPerSection + (remainder > 4 ? 1 : 0) },
    { id: 'chapter5', name: 'Chapter 5: Deployment', pageCount: basePagesPerSection + (remainder > 5 ? 1 : 0) },
    { id: 'chapter6', name: 'Chapter 6: Maintenance', pageCount: basePagesPerSection + (remainder > 6 ? 1 : 0) },
    { id: 'chapter7', name: 'Chapter 7: Performance', pageCount: basePagesPerSection + (remainder > 7 ? 1 : 0) },
    { id: 'chapter8', name: 'Chapter 8: Security', pageCount: basePagesPerSection + (remainder > 8 ? 1 : 0) },
    { id: 'appendix', name: 'Appendices', pageCount: basePagesPerSection + (remainder > 9 ? 1 : 0) },
  ];
}

/**
 * VersionsTabContent - Document version management panel
 */
function VersionsTabContent({ onSaveVersion, onRestoreVersion }: {
  onSaveVersion?: () => void;
  onRestoreVersion?: (versionId: string) => void;
}): JSX.Element {
  const versions = useRevisionStore((state) => state.getAllVersions());
  const deleteVersion = useRevisionStore((state) => state.deleteVersion);
  const [versionLabel, setVersionLabel] = useState('');
  const [isNaming, setIsNaming] = useState(false);

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSave = () => {
    if (isNaming && versionLabel.trim()) {
      onSaveVersion?.();
      setVersionLabel('');
      setIsNaming(false);
    } else if (!isNaming) {
      setIsNaming(true);
    }
  };

  const handleQuickSave = () => {
    onSaveVersion?.();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Save Version Button */}
      <div className="space-y-2">
        {isNaming ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={versionLabel}
              onChange={(e) => setVersionLabel(e.target.value)}
              placeholder="Nom de la version..."
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && versionLabel.trim()) {
                  handleSave();
                } else if (e.key === 'Escape') {
                  setIsNaming(false);
                  setVersionLabel('');
                }
              }}
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!versionLabel.trim()}
              className="px-3 py-2 bg-cyan-500 text-white text-xs font-semibold rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sauver
            </button>
            <button
              type="button"
              onClick={() => { setIsNaming(false); setVersionLabel(''); }}
              className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleQuickSave}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-semibold rounded-lg hover:from-cyan-600 hover:to-cyan-700 shadow-sm hover:shadow-md transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Sauvegarder version
            </button>
            <button
              type="button"
              onClick={() => setIsNaming(true)}
              className="px-3 py-2.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              title="Nommer la version"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-3 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-slate-700">Historique des versions</span>
          </div>
          <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
            {versions.length}
          </span>
        </div>
      </div>

      {/* Versions List */}
      <div className="space-y-2">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-500">Aucune version sauvegardée</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Cliquez sur "Sauvegarder version" pour créer un point de restauration
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="p-3 rounded-lg border border-slate-200/60 bg-white hover:border-cyan-300 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                        index === 0 ? 'bg-cyan-500' : 'bg-slate-400'
                      }`}>
                        {versions.length - index}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {version.label}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 ml-8">
                      {version.author.name} • {formatDateTime(version.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onRestoreVersion?.(version.id)}
                      className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      title="Restaurer cette version"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteVersion(version.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer cette version"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * CommentsTabContent - Google Docs style comments panel
 */
function CommentsTabContent(): JSX.Element {
  const threads = useCommentStore((state) => state.threads);
  const pendingComment = useCommentStore((state) => state.pendingComment);
  const submitPendingComment = useCommentStore((state) => state.submitPendingComment);
  const cancelPendingComment = useCommentStore((state) => state.cancelPendingComment);
  const resolveThread = useCommentStore((state) => state.resolveThread);
  const reopenThread = useCommentStore((state) => state.reopenThread);
  const deleteThread = useCommentStore((state) => state.deleteThread);
  const [newCommentText, setNewCommentText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const threadList = Array.from(threads.values()).sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Focus textarea when pending comment appears
  useEffect(() => {
    if (pendingComment && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [pendingComment]);

  const handleSubmit = () => {
    if (newCommentText.trim()) {
      submitPendingComment(newCommentText.trim());
      setNewCommentText('');
    }
  };

  const handleCancel = () => {
    cancelPendingComment();
    setNewCommentText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="space-y-3">
      {/* New comment input - Google Docs style */}
      {pendingComment && (
        <div className="bg-white rounded-lg border-2 border-amber-400 shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {/* Quoted text */}
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
            <p className="text-[10px] text-amber-600 font-medium mb-1">Texte sélectionné:</p>
            <p className="text-xs text-slate-700 italic line-clamp-2">"{pendingComment.quotedText}"</p>
          </div>

          {/* Comment input */}
          <div className="p-3">
            <textarea
              ref={textareaRef}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ajouter un commentaire..."
              className="w-full text-sm border-0 resize-none focus:ring-0 focus:outline-none placeholder-slate-400 min-h-[60px]"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-400">⌘+Enter pour envoyer</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!newCommentText.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Commenter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Existing comments */}
      {threadList.length === 0 && !pendingComment ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">Aucun commentaire</p>
          <p className="text-xs text-slate-400 mt-1">
            Sélectionnez du texte et cliquez sur 💬 pour commenter.
          </p>
        </div>
      ) : (
        threadList.map((thread) => {
          const isResolved = thread.status === 'resolved';
          const authorName = thread.comments[0]?.author?.name || 'Utilisateur';
          return (
            <div
              key={thread.id}
              className={`group rounded-lg border transition-all duration-200 overflow-hidden ${
                isResolved
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-white border-amber-200 hover:border-amber-300 hover:shadow-sm'
              }`}
            >
              {/* Quoted text if available */}
              {thread.quotedText && (
                <div className={`px-3 py-2 border-b ${isResolved ? 'bg-slate-100 border-slate-200' : 'bg-amber-50 border-amber-100'}`}>
                  <p className={`text-[10px] italic line-clamp-2 ${isResolved ? 'text-slate-400' : 'text-amber-700'}`}>
                    "{thread.quotedText}"
                  </p>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    isResolved ? 'bg-slate-400' : 'bg-gradient-to-br from-amber-400 to-amber-500'
                  }`}>
                    {authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-semibold truncate ${isResolved ? 'text-slate-500' : 'text-slate-700'}`}>
                        {authorName}
                      </span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {new Date(thread.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isResolved ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                      {thread.comments[0]?.content || 'Commentaire'}
                    </p>
                    {thread.comments.length > 1 && (
                      <div className="mt-2 text-[10px] text-amber-600 font-medium">
                        +{thread.comments.length - 1} réponse{thread.comments.length > 2 ? 's' : ''}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className={`flex items-center gap-2 mt-3 pt-2 border-t ${isResolved ? 'border-slate-200' : 'border-slate-100'}`}>
                      {isResolved ? (
                        <>
                          <button
                            type="button"
                            onClick={() => reopenThread(thread.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Rouvrir
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteThread(thread.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Supprimer
                          </button>
                          <div className="flex-1" />
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Résolu
                          </span>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => resolveThread(thread.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Résoudre
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteThread(thread.id)}
                            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function DemoApp(): JSX.Element {
  const [wordCount, setWordCount] = useState(0);
  const [zoom, setZoom] = useState<number>(A4_CONSTANTS.ZOOM_DEFAULT);
  const [isInitialized, setIsInitialized] = useState(false);
  const editorRef = useRef<LexicalEditor | null>(null);

  // Get demo config from URL
  const demoConfig = useMemo(() => getDemoConfig(), []);
  const demoSections = useMemo(() => generateDemoSections(demoConfig.pageCount), [demoConfig.pageCount]);

  // Folio store state and actions
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const activeFolio = useFolioStore((state) => state.getActiveFolio());
  const folios = useFolioStore((state) => state.getFoliosInOrder());

  // Thumbnail generation hook
  const { thumbnails, generateThumbnail, generateAllThumbnails } = useFolioThumbnails({
    debounceMs: 500,
    autoUpdate: true,
  });

  // Initialize demo content once
  useEffect(() => {
    if (isInitialized) return;

    const folioStore = useFolioStore.getState();
    const headerFooterStore = useHeaderFooterStore.getState();

    console.log(`[DemoApp] Initializing demo content with ${demoConfig.pageCount} folios (${demoConfig.type})...`);

    // Clear existing data
    folioStore.clear();
    headerFooterStore.clear();

    // For empty demo, just create one empty folio
    if (demoConfig.type === 'empty') {
      const folioId = folioStore.createFolio({ orientation: 'portrait' });
      folioStore.setActiveFolio(folioId);
      setIsInitialized(true);
      console.log('[DemoApp] Empty demo initialized with 1 folio');
      return;
    }

    // Create header/footer templates for multi-page demos
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

    const chapterHeaderId = headerFooterStore.createHeader({
      left: { type: 'text', content: 'Chapter' },
      center: { type: 'text', content: 'Content' },
      right: { type: 'dynamic', dynamicField: { type: 'date' } },
    });

    const chapterFooterId = headerFooterStore.createFooter({
      left: { type: 'text', content: 'Documentation' },
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
    const getHeaderForSection = (sectionId: string): string => {
      if (sectionId === 'intro' || sectionId === 'main') return introHeaderId;
      if (sectionId === 'appendix') return appendixHeaderId;
      return chapterHeaderId;
    };

    const getFooterForSection = (sectionId: string): string => {
      if (sectionId === 'intro' || sectionId === 'main') return introFooterId;
      if (sectionId === 'appendix') return appendixFooterId;
      return chapterFooterId;
    };

    // Create sections
    demoSections.forEach((section) => {
      folioStore.createSection(section.name);
    });

    // Create folios with rich content
    let firstFolioId: string | null = null;
    let globalPageIndex = 0;
    const totalPages = demoConfig.pageCount;

    demoSections.forEach((section) => {
      for (let i = 0; i < section.pageCount; i++) {
        const folioId = folioStore.createFolio({
          // Occasional landscape page for variety
          orientation: globalPageIndex % 15 === 7 ? 'landscape' : 'portrait',
        });

        if (!firstFolioId) {
          firstFolioId = folioId;
        }

        // Generate and set rich content for this folio
        const content = generateLexicalContent(globalPageIndex, {
          includeTable: true,
          includeImage: true,
          totalPages,
        });
        folioStore.updateFolioContent(folioId, content as import('lexical').SerializedEditorState);

        // Assign header/footer based on section
        headerFooterStore.setFolioHeaderOverride(folioId, getHeaderForSection(section.id));
        headerFooterStore.setFolioFooterOverride(folioId, getFooterForSection(section.id));

        globalPageIndex++;
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
    console.log(`[DemoApp] Demo content initialized with ${demoConfig.pageCount} folios`);
  }, [isInitialized, demoConfig, demoSections]);

  // Get orientation from active folio
  const orientation: Orientation = activeFolio?.orientation ?? 'portrait';

  // Handle editor changes
  const handleEditorChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (!editorRef.current) {
        editorRef.current = editor;
        // Generate all thumbnails once editor is ready
        setTimeout(() => {
          if (editorRef.current) {
            generateAllThumbnails(editorRef.current);
          }
        }, 500);
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
    [activeFolioId, generateThumbnail, generateAllThumbnails]
  );

  // Handle toggling folio orientation
  const handleToggleOrientation = useCallback(() => {
    if (activeFolioId) {
      useFolioStore.getState().toggleOrientation(activeFolioId);
    }
  }, [activeFolioId]);

  // State for save and export
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Revision store
  const revisionCount = useRevisionStore((state) => state.getRevisionCount());
  const addVersion = useRevisionStore((state) => state.addVersion);
  const restoreVersion = useRevisionStore((state) => state.restoreVersion);
  const currentAuthor = useRevisionStore((state) => state.currentAuthor);

  // Version management handlers
  const handleSaveVersion = useCallback(() => {
    if (!editorRef.current) return;

    const editorState = editorRef.current.getEditorState();
    const serializedState = JSON.stringify(editorState.toJSON());

    addVersion({
      label: `Version ${new Date().toLocaleString('fr-FR')}`,
      content: serializedState,
      author: currentAuthor,
      isAutoSave: false,
    });
  }, [addVersion, currentAuthor]);

  const handleRestoreVersion = useCallback((versionId: string) => {
    if (!editorRef.current) return;

    // First, save current state as a backup before restoring
    const currentEditorState = editorRef.current.getEditorState();
    const currentSerializedState = JSON.stringify(currentEditorState.toJSON());

    addVersion({
      label: `Sauvegarde avant restauration - ${new Date().toLocaleString('fr-FR')}`,
      content: currentSerializedState,
      author: currentAuthor,
      isAutoSave: true,
    });

    console.log('[DemoApp] Created backup before restoration');

    // Now restore the selected version
    const version = restoreVersion(versionId);
    if (!version) return;

    try {
      const parsedState = JSON.parse(version.content);
      const newEditorState = editorRef.current.parseEditorState(parsedState);
      editorRef.current.setEditorState(newEditorState);
      console.log('[DemoApp] Restored version:', versionId);
    } catch (error) {
      console.error('[DemoApp] Failed to restore version:', error);
    }
  }, [restoreVersion, addVersion, currentAuthor]);

  // State for PDF import
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // State for Header/Footer editor
  const [isHeaderFooterEditorOpen, setIsHeaderFooterEditorOpen] = useState(false);

  // State for collapsible panels
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // State for right panel tabs
  const [rightPanelTab, setRightPanelTab] = useState<'structure' | 'comments' | 'versions'>('structure');

  // Collaboration state
  const [collaborationStatus, setCollaborationStatus] = useState<ConnectionStatus>('disconnected');
  const [collaborationUsers, setCollaborationUsers] = useState<CollaborationUser[]>([]);
  const collaborationRoomId = useMemo(() => {
    // Use URL path + demo type as room ID
    const urlParams = new URLSearchParams(window.location.search);
    const demo = urlParams.get('demo') || 'default';
    return `certeafiles-${demo}-${window.location.pathname.replace(/\//g, '-')}`;
  }, []);

  // Initialize default user for comments
  useEffect(() => {
    const { currentUser, setCurrentUser } = useCommentStore.getState();
    if (!currentUser) {
      setCurrentUser({
        id: 'demo-user',
        name: 'Utilisateur Demo',
        email: 'demo@certeafiles.com',
        color: '#f59e0b',
      });
    }
  }, []);

  // Handle comment click - open panel and switch to comments tab
  const handleCommentClick = useCallback(() => {
    setIsRightPanelCollapsed(false);
    setRightPanelTab('comments');
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    setIsSaving(true);
    // Simulate save operation (in real app, would save to backend)
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      console.log('[DemoApp] Document saved');
    }, 500);
  }, []);

  // Handle PDF export
  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: folios.length });

    try {
      await exportToPDF({
        title: `CerteaFiles-${demoConfig.type}-${new Date().toISOString().split('T')[0]}`,
        quality: 0.95,
        onProgress: (current, total) => {
          setExportProgress({ current, total });
        },
      });
      console.log('[DemoApp] PDF exported successfully');
    } catch (error) {
      console.error('[DemoApp] PDF export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  }, [folios.length, demoConfig.type]);

  // Handle PDF import - inserts PDF pages at current cursor position
  const handleImportPDF = useCallback(async () => {
    const file = await selectPDFFile();
    if (!file) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: 0 });

    try {
      const result = await importPDF(file, {
        scale: 1.5, // Reduced scale for better performance
        onProgress: (current, total) => {
          setImportProgress({ current, total });
        },
      });

      console.log('[DemoApp] PDF imported:', result.pageCount, 'pages');

      // Use batch update approach - collect all data first, then update store once
      const folioStore = useFolioStore.getState();
      const currentActiveFolioId = folioStore.activeFolioId;

      // Prepare all folio data
      const newFoliosData: Array<{
        orientation: 'portrait' | 'landscape';
        metadata: { pdfPageImage: string; pdfPageNumber: number; pdfTextContent: string };
      }> = [];

      for (const page of result.pages) {
        const isLandscape = page.width > page.height;
        newFoliosData.push({
          orientation: isLandscape ? 'landscape' : 'portrait',
          metadata: {
            pdfPageImage: page.imageDataUrl,
            pdfPageNumber: page.pageNumber,
            pdfTextContent: page.textContent,
          },
        });
      }

      // Now create all folios in sequence (each createFolio updates store)
      // But we batch the metadata updates
      let insertAfterId = currentActiveFolioId;
      let firstNewFolioId: string | null = null;
      const createdFolioIds: string[] = [];

      for (const folioData of newFoliosData) {
        const createPayload: { orientation: 'portrait' | 'landscape'; afterId?: string } = {
          orientation: folioData.orientation,
        };
        if (insertAfterId) {
          createPayload.afterId = insertAfterId;
        }

        const folioId = folioStore.createFolio(createPayload);
        createdFolioIds.push(folioId);

        if (!firstNewFolioId) {
          firstNewFolioId = folioId;
        }

        insertAfterId = folioId;
      }

      // Set metadata for all created folios
      createdFolioIds.forEach((folioId, index) => {
        folioStore.setFolioMetadata(folioId, newFoliosData[index].metadata);
      });

      // Navigate to the first imported page after a delay
      if (firstNewFolioId) {
        setTimeout(() => {
          useFolioStore.getState().setActiveFolio(firstNewFolioId);
        }, 100);
      }

      // Trigger thumbnail regeneration after everything is stable
      setTimeout(() => {
        if (editorRef.current) {
          generateAllThumbnails(editorRef.current);
        }
      }, 500);

      console.log(`[DemoApp] Inserted ${result.pageCount} PDF pages`);

    } catch (error) {
      console.error('[DemoApp] PDF import failed:', error);
      alert('Erreur lors de l\'import du PDF. Veuillez réessayer.');
    } finally {
      setIsImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  }, [generateAllThumbnails]);

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Left Panel - Folio Thumbnails (Collapsible) */}
      <div
        className={`relative flex flex-col bg-white/80 backdrop-blur-sm border-r border-slate-200/60 transition-all duration-300 ease-out ${
          isLeftPanelCollapsed ? 'w-12' : 'w-[160px]'
        }`}
      >
        {/* Panel Header */}
        {!isLeftPanelCollapsed && (
          <div className="px-4 py-3 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-700">Pages</span>
              </div>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {folios.length}
              </span>
            </div>
          </div>
        )}

        {/* Collapse/Expand Button */}
        <button
          type="button"
          onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-14 bg-white border border-slate-200 rounded-r-xl shadow-md hover:shadow-lg hover:bg-slate-50 flex items-center justify-center transition-all duration-200"
          title={isLeftPanelCollapsed ? 'Afficher les pages' : 'Masquer les pages'}
        >
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isLeftPanelCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Panel Content */}
        {isLeftPanelCollapsed ? (
          <div className="flex flex-col items-center py-4 gap-3">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-[10px] text-slate-500 font-semibold writing-mode-vertical transform rotate-180" style={{ writingMode: 'vertical-rl' }}>
              {folios.length} pages
            </span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <FolioPanel thumbnails={thumbnails} width={160} />
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar - Modern glassmorphism design */}
        <div className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 flex items-center px-5 shadow-sm">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-base tracking-tight">CE</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 truncate tracking-tight">
                CerteaFiles Editor
              </h1>
              <p className="text-[11px] text-slate-400 truncate font-medium">
                {demoConfig.label}
              </p>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-5 flex-shrink-0" />

          {/* File Actions Group */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 rounded-lg p-1">
            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 px-3 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-white rounded-md transition-all duration-200 shadow-sm hover:shadow disabled:opacity-50"
              title={lastSaved ? `Sauvegardé: ${lastSaved.toLocaleTimeString()}` : 'Sauvegarder'}
            >
              {isSaving ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17H17.01M17.4 14H18C18.9319 14 19.3978 14 19.7654 14.1522C20.2554 14.3552 20.6448 14.7446 20.8478 15.2346C21 15.6022 21 16.0681 21 17C21 17.9319 21 18.3978 20.8478 18.7654C20.6448 19.2554 20.2554 19.6448 19.7654 19.8478C19.3978 20 18.9319 20 18 20H6C5.06812 20 4.60218 20 4.23463 19.8478C3.74458 19.6448 3.35523 19.2554 3.15224 18.7654C3 18.3978 3 17.9319 3 17C3 16.0681 3 15.6022 3.15224 15.2346C3.35523 14.7446 3.74458 14.3552 4.23463 14.1522C4.60218 14 5.06812 14 6 14H6.6M12 15V4M12 15L9 12M12 15L15 12" />
                </svg>
              )}
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>

            {/* Import PDF */}
            <button
              type="button"
              onClick={handleImportPDF}
              disabled={isImporting}
              className="h-8 px-3 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all duration-200 hover:shadow disabled:opacity-50"
              title="Importer un PDF"
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{importProgress.current}/{importProgress.total}</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                  </svg>
                  <span className="hidden sm:inline">Importer</span>
                </>
              )}
            </button>

            {/* Export PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="h-8 px-3 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-md transition-all duration-200 hover:shadow disabled:opacity-50"
              title="Exporter en PDF"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{exportProgress.current}/{exportProgress.total}</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span className="hidden sm:inline">Exporter</span>
                </>
              )}
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-4 flex-shrink-0" />

          {/* Document Settings Group */}
          <div className="flex items-center gap-2">
            {/* Orientation Toggle */}
            {activeFolioId && (
              <div className="flex items-center bg-slate-100/80 rounded-lg p-1">
                <button
                  type="button"
                  onClick={handleToggleOrientation}
                  className={`h-7 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                    orientation === 'portrait'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                  title="Portrait"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
                  </svg>
                  <span className="hidden lg:inline">Portrait</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleOrientation}
                  className={`h-7 px-3 flex items-center gap-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                    orientation === 'landscape'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                  title="Paysage"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z" />
                  </svg>
                  <span className="hidden lg:inline">Paysage</span>
                </button>
              </div>
            )}

            {/* Header/Footer */}
            <button
              type="button"
              onClick={() => setIsHeaderFooterEditorOpen(true)}
              className="h-8 px-3 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100/80 hover:bg-white rounded-lg transition-all duration-200 hover:shadow"
              title="En-tête et pied de page"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
              <span className="hidden md:inline">En-tête/Pied</span>
            </button>
          </div>

          {/* Separator */}
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-4 flex-shrink-0" />

          {/* Versions Button */}
          <button
            type="button"
            onClick={() => { setIsRightPanelCollapsed(false); setRightPanelTab('versions'); }}
            className={`h-8 px-3 flex items-center gap-2 text-xs font-semibold rounded-md transition-all duration-200 ${
              rightPanelTab === 'versions' && !isRightPanelCollapsed
                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md shadow-cyan-500/25'
                : 'bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow'
            }`}
            title="Historique des versions"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Versions</span>
            {revisionCount.total > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-bold shadow-sm ${
                rightPanelTab === 'versions' && !isRightPanelCollapsed
                  ? 'bg-white/20 text-white'
                  : 'bg-cyan-500 text-white'
              }`}>
                {revisionCount.total}
              </span>
            )}
          </button>

          {/* Separator */}
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-200 to-transparent mx-4 flex-shrink-0" />

          {/* Zoom Control */}
          <div className="flex-shrink-0">
            <ZoomControl
              zoom={zoom}
              onZoomChange={setZoom}
              showSlider={true}
              showPercentage={true}
            />
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 rounded-lg">
              <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-xs font-semibold text-slate-600">{wordCount} mots</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
              <span className="text-xs font-bold text-blue-600">
                {(activeFolio?.index ?? 0) + 1}
              </span>
              <span className="text-xs text-blue-400">/</span>
              <span className="text-xs font-medium text-blue-500">{folios.length}</span>
            </div>
            {lastSaved && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg" title={`Sauvegardé à ${lastSaved.toLocaleTimeString()}`}>
                <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs font-semibold text-emerald-600">Sauvé</span>
              </div>
            )}

            {/* Collaboration Status - More prominent */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              collaborationStatus === 'connected' ? 'bg-green-50 border-green-200' :
              collaborationStatus === 'connecting' || collaborationStatus === 'reconnecting' ? 'bg-yellow-50 border-yellow-200' :
              collaborationStatus === 'error' ? 'bg-red-50 border-red-200' :
              'bg-slate-50 border-slate-200'
            }`}>
              {/* Status indicator - larger */}
              <div
                className={`w-3 h-3 rounded-full ${
                  collaborationStatus === 'connected' ? 'bg-green-500' :
                  collaborationStatus === 'connecting' || collaborationStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' :
                  collaborationStatus === 'error' ? 'bg-red-500' :
                  'bg-gray-400'
                }`}
                title={`Status: ${collaborationStatus}`}
              />

              {/* Status label */}
              <span className={`text-xs font-medium ${
                collaborationStatus === 'connected' ? 'text-green-700' :
                collaborationStatus === 'connecting' || collaborationStatus === 'reconnecting' ? 'text-yellow-700' :
                collaborationStatus === 'error' ? 'text-red-700' :
                'text-slate-500'
              }`}>
                {collaborationStatus === 'connected' ? 'Connecté' :
                 collaborationStatus === 'connecting' ? 'Connexion...' :
                 collaborationStatus === 'reconnecting' ? 'Reconnexion...' :
                 collaborationStatus === 'error' ? 'Erreur' :
                 'Déconnecté'}
              </span>

              {/* Connected users avatars */}
              {collaborationUsers.length > 0 && (
                <div className="flex -space-x-2 ml-1">
                  {collaborationUsers.slice(0, 4).map((user, idx) => (
                    <div
                      key={user.id}
                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: user.color, zIndex: 10 - idx }}
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {collaborationUsers.length > 4 && (
                    <div
                      className="w-6 h-6 rounded-full border-2 border-white bg-slate-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                      title={`+${collaborationUsers.length - 4} autres`}
                    >
                      +{collaborationUsers.length - 4}
                    </div>
                  )}
                </div>
              )}

              {/* User count */}
              <span className="text-xs text-slate-500">
                ({collaborationUsers.length})
              </span>
            </div>
          </div>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <ErrorBoundary
            fallback={
              <div className="text-center p-8 text-red-600">
                Editor failed to load. Please refresh the page.
              </div>
            }
          >
            {isInitialized && (
              <CerteafilesEditor
                placeholder="Start typing your document content here..."
                onChange={handleEditorChange}
                orientation={orientation}
                zoom={zoom}
                className="mx-auto"
                showToolbar={true}
                showCommentPanel={false}
                showRevisionPanel={false}
                onCommentClick={handleCommentClick}
                enableCollaboration={false}
                collaborationRoomId={collaborationRoomId}
                onCollaborationStatusChange={setCollaborationStatus}
                onCollaborationUsersChange={setCollaborationUsers}
              />
            )}
          </ErrorBoundary>
        </div>
      </main>

      {/* Right Panel - Structure & Comments with Tabs (Collapsible) */}
      <aside
        className={`relative bg-white/80 backdrop-blur-sm border-l border-slate-200/60 flex flex-col transition-all duration-300 ease-out ${
          isRightPanelCollapsed ? 'w-12' : 'w-72'
        }`}
      >
        {/* Collapse/Expand Button */}
        <button
          type="button"
          onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-14 bg-white border border-slate-200 rounded-l-xl shadow-md hover:shadow-lg hover:bg-slate-50 flex items-center justify-center transition-all duration-200"
          title={isRightPanelCollapsed ? 'Afficher le panneau' : 'Masquer le panneau'}
        >
          <svg
            className={`w-4 h-4 text-gray-500 transition-transform ${isRightPanelCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {isRightPanelCollapsed ? (
          /* Collapsed view */
          <div className="flex flex-col items-center py-4 gap-4">
            <button
              type="button"
              onClick={() => { setIsRightPanelCollapsed(false); setRightPanelTab('structure'); }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm hover:shadow-md transition-all"
              title="Structure"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setIsRightPanelCollapsed(false); setRightPanelTab('comments'); }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm hover:shadow-md transition-all"
              title="Commentaires"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setIsRightPanelCollapsed(false); setRightPanelTab('versions'); }}
              className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm hover:shadow-md transition-all relative"
              title="Versions"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {revisionCount.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] bg-red-500 text-white rounded-full font-bold flex items-center justify-center">
                  {revisionCount.pending}
                </span>
              )}
            </button>
          </div>
        ) : (
          /* Expanded view with tabs */
          <>
            {/* Tab Header */}
            <div className="flex border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
              <button
                type="button"
                onClick={() => setRightPanelTab('structure')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-all duration-200 ${
                  rightPanelTab === 'structure'
                    ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Structure
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('comments')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-all duration-200 ${
                  rightPanelTab === 'comments'
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Commentaires
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('versions')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold transition-all duration-200 relative ${
                  rightPanelTab === 'versions'
                    ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Versions
                {revisionCount.pending > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-cyan-500 text-white rounded-full font-bold">
                    {revisionCount.pending}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {rightPanelTab === 'structure' && (
                /* Structure Tab Content */
                <div className="p-4 space-y-4">
                  {/* Section Overview */}
                  <div className="space-y-2">
                    {demoSections.map((section, idx) => (
                      <div
                        key={section.id}
                        className="p-2.5 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200/60 hover:shadow-sm hover:border-slate-300/60 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                              idx === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                              idx === demoSections.length - 1 ? 'bg-gradient-to-br from-slate-500 to-slate-600' :
                              'bg-gradient-to-br from-indigo-500 to-indigo-600'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors truncate">
                              {section.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {section.pageCount}p
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Document Info */}
                  <div className="pt-4 border-t border-slate-200/60">
                    <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Document
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-slate-700">{demoConfig.pageCount}</div>
                        <div className="text-[10px] text-slate-500">Pages</div>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-slate-700">{demoSections.length}</div>
                        <div className="text-[10px] text-slate-500">Sections</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {rightPanelTab === 'comments' && (
                /* Comments Tab Content */
                <div className="p-4">
                  <CommentsTabContent />
                </div>
              )}
              {rightPanelTab === 'versions' && (
                /* Versions Tab Content */
                <VersionsTabContent
                  onSaveVersion={handleSaveVersion}
                  onRestoreVersion={handleRestoreVersion}
                />
              )}
            </div>
          </>
        )}
      </aside>

      {/* Header/Footer Editor Modal */}
      <HeaderFooterEditor
        isOpen={isHeaderFooterEditorOpen}
        onClose={() => setIsHeaderFooterEditorOpen(false)}
        folioId={activeFolioId}
      />
    </div>
  );
}

export default DemoApp;
