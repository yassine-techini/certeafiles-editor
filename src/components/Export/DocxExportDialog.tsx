/**
 * DocxExportDialog - DOCX export configuration dialog
 * Per Constitution Section 8 - Export
 */
import { useState, useCallback } from 'react';
import { FileText, X, Download, FileCheck, Settings } from 'lucide-react';
import type { DocxExportOptions, DocxExportProgress } from '../../types/docxExport';
import { DEFAULT_DOCX_OPTIONS } from '../../types/docxExport';

export interface DocxExportDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Export handler */
  onExport: (options: DocxExportOptions, filename: string) => Promise<void>;
  /** Current document title */
  documentTitle?: string;
  /** Current document author */
  documentAuthor?: string;
  /** Total page count */
  totalPages: number;
  /** Export progress */
  progress?: DocxExportProgress;
  /** Whether export is in progress */
  isExporting?: boolean;
}

/**
 * DocxExportDialog component
 */
export function DocxExportDialog({
  isOpen,
  onClose,
  onExport,
  documentTitle = 'Document',
  documentAuthor = '',
  totalPages,
  progress,
  isExporting = false,
}: DocxExportDialogProps): JSX.Element | null {
  const [options, setOptions] = useState<DocxExportOptions>({
    ...DEFAULT_DOCX_OPTIONS,
    title: documentTitle,
    author: documentAuthor,
  });

  const [filename, setFilename] = useState(
    documentTitle.replace(/[^a-zA-Z0-9\s-_]/g, '').trim() || 'document'
  );

  const [usePageRange, setUsePageRange] = useState(false);
  const [pageRangeStart, setPageRangeStart] = useState(1);
  const [pageRangeEnd, setPageRangeEnd] = useState(totalPages);

  const [activeTab, setActiveTab] = useState<'options' | 'metadata'>('options');

  /**
   * Update option
   */
  const updateOption = useCallback(
    <K extends keyof DocxExportOptions>(key: K, value: DocxExportOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Handle export
   */
  const handleExport = useCallback(async () => {
    const finalOptions = {
      ...options,
      pageRange: usePageRange ? { start: pageRangeStart, end: pageRangeEnd } : null,
    };
    await onExport(finalOptions, filename);
  }, [options, usePageRange, pageRangeStart, pageRangeEnd, onExport, filename]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[550px] max-w-[90vw] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={24} />
            Exporter en Word (.docx)
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isExporting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('options')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'options'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={isExporting}
          >
            <Settings size={16} className="inline mr-2" />
            Options d'export
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'metadata'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={isExporting}
          >
            <FileCheck size={16} className="inline mr-2" />
            Métadonnées
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Progress overlay */}
          {isExporting && progress && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  {progress.message}
                </span>
                <span className="text-sm text-blue-600">{progress.percentage}%</span>
              </div>
              <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Options Tab */}
          {activeTab === 'options' && !isExporting && (
            <div className="space-y-6">
              {/* Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du fichier
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nom du fichier"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-500">
                    .docx
                  </span>
                </div>
              </div>

              {/* Page Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={usePageRange}
                    onChange={(e) => setUsePageRange(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Exporter une plage de pages
                </label>
                {usePageRange && (
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageRangeStart}
                      onChange={(e) =>
                        setPageRangeStart(
                          Math.min(parseInt(e.target.value, 10) || 1, pageRangeEnd)
                        )
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <span className="text-gray-500">à</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageRangeEnd}
                      onChange={(e) =>
                        setPageRangeEnd(
                          Math.max(parseInt(e.target.value, 10) || totalPages, pageRangeStart)
                        )
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                    />
                    <span className="text-gray-500">sur {totalPages}</span>
                  </div>
                )}
              </div>

              {/* Content Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Options de contenu
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={options.includeHeaders}
                      onChange={(e) => updateOption('includeHeaders', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Inclure les en-têtes
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={options.includeFooters}
                      onChange={(e) => updateOption('includeFooters', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Inclure les pieds de page
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={options.includeFootnotes}
                      onChange={(e) => updateOption('includeFootnotes', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Inclure les notes de bas de page
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={options.includeComments}
                      onChange={(e) => updateOption('includeComments', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Inclure les commentaires
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={options.includeTrackChanges}
                      onChange={(e) => updateOption('includeTrackChanges', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Inclure les marques de révision
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={options.resolveSlots}
                      onChange={(e) => updateOption('resolveSlots', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Résoudre les variables dynamiques
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Metadata Tab */}
          {activeTab === 'metadata' && !isExporting && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du document
                </label>
                <input
                  type="text"
                  value={options.title}
                  onChange={(e) => updateOption('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Titre du document"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auteur
                </label>
                <input
                  type="text"
                  value={options.author}
                  onChange={(e) => updateOption('author', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'auteur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sujet
                </label>
                <input
                  type="text"
                  value={options.subject}
                  onChange={(e) => updateOption('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Sujet ou description courte"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={options.description}
                  onChange={(e) => updateOption('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Description du document"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mots-clés (séparés par des virgules)
                </label>
                <input
                  type="text"
                  value={options.keywords.join(', ')}
                  onChange={(e) =>
                    updateOption(
                      'keywords',
                      e.target.value.split(',').map((k) => k.trim()).filter(Boolean)
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="mot1, mot2, mot3"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <span className="text-sm text-gray-500">
            {usePageRange
              ? `${Math.max(0, pageRangeEnd - pageRangeStart + 1)} page(s)`
              : `${totalPages} page(s)`}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isExporting}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || !filename.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={16} />
              {isExporting ? 'Exportation...' : 'Exporter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocxExportDialog;
