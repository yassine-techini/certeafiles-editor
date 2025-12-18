/**
 * ExportPlugin - Plugin for document export (PDF and DOCX)
 * Per Constitution Section 8 - Export
 */
import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
} from 'lexical';
import type { LexicalCommand } from 'lexical';
import { Download, FileText, FileDown } from 'lucide-react';

import { DocxExportDialog } from '../components/Export/DocxExportDialog';
import { downloadDocx } from '../utils/docxExport';
import type { DocxExportOptions, DocxExportProgress, ExportFormat } from '../types/docxExport';

/**
 * Commands for export
 */
export const OPEN_EXPORT_DIALOG_COMMAND: LexicalCommand<{ format?: ExportFormat }> =
  createCommand('OPEN_EXPORT_DIALOG_COMMAND');

export const EXPORT_TO_DOCX_COMMAND: LexicalCommand<DocxExportOptions> =
  createCommand('EXPORT_TO_DOCX_COMMAND');

export interface ExportPluginProps {
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Document title */
  documentTitle?: string;
  /** Document author */
  documentAuthor?: string;
  /** Total page count */
  totalPages?: number;
}

/**
 * ExportPlugin - Provides document export functionality
 */
export function ExportPlugin({
  enabled = true,
  documentTitle = 'Document',
  documentAuthor = '',
  totalPages = 1,
}: ExportPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [showDocxDialog, setShowDocxDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<DocxExportProgress | undefined>();

  /**
   * Handle DOCX export
   */
  const handleDocxExport = useCallback(
    async (options: DocxExportOptions, filename: string) => {
      setIsExporting(true);
      try {
        const editorState = editor.getEditorState();
        await downloadDocx(editorState, filename, options, setExportProgress);
        setShowDocxDialog(false);
      } catch (error) {
        console.error('[ExportPlugin] DOCX export failed:', error);
        alert('Erreur lors de l\'export. Veuillez réessayer.');
      } finally {
        setIsExporting(false);
        setExportProgress(undefined);
      }
    },
    [editor]
  );

  /**
   * Register commands
   */
  useEffect(() => {
    if (!enabled) return;

    const unregisterOpenDialog = editor.registerCommand(
      OPEN_EXPORT_DIALOG_COMMAND,
      (payload) => {
        const format = payload?.format || 'docx';
        if (format === 'docx') {
          setShowDocxDialog(true);
        }
        // PDF export can be handled by existing ExportDialog
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    const unregisterExportDocx = editor.registerCommand(
      EXPORT_TO_DOCX_COMMAND,
      (options) => {
        handleDocxExport(options, documentTitle);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      unregisterOpenDialog();
      unregisterExportDocx();
    };
  }, [editor, enabled, handleDocxExport, documentTitle]);

  if (!enabled) return null;

  return (
    <>
      {/* DOCX Export Dialog */}
      {showDocxDialog &&
        createPortal(
          <DocxExportDialog
            isOpen={showDocxDialog}
            onClose={() => setShowDocxDialog(false)}
            onExport={handleDocxExport}
            documentTitle={documentTitle}
            documentAuthor={documentAuthor}
            totalPages={totalPages}
            isExporting={isExporting}
            {...(exportProgress && { progress: exportProgress })}
          />,
          document.body
        )}
    </>
  );
}

/**
 * Export Menu Component - Dropdown menu for export options
 */
export interface ExportMenuProps {
  className?: string;
}

export function ExportMenu({ className = '' }: ExportMenuProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [showMenu, setShowMenu] = useState(false);

  const handleExportPdf = useCallback(() => {
    // Trigger PDF export (handled by existing system)
    setShowMenu(false);
    // You can dispatch to existing PDF export system here
  }, []);

  const handleExportDocx = useCallback(() => {
    editor.dispatchCommand(OPEN_EXPORT_DIALOG_COMMAND, { format: 'docx' });
    setShowMenu(false);
  }, [editor]);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        title="Exporter le document"
      >
        <Download size={16} />
        <span>Exporter</span>
      </button>

      {showMenu && (
        <div
          className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[180px] z-50"
          onMouseLeave={() => setShowMenu(false)}
        >
          <button
            type="button"
            onClick={handleExportPdf}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
          >
            <FileDown size={16} className="text-red-600" />
            <div>
              <div className="font-medium">Export PDF</div>
              <div className="text-xs text-gray-500">Format d'impression</div>
            </div>
          </button>
          <button
            type="button"
            onClick={handleExportDocx}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
          >
            <FileText size={16} className="text-blue-600" />
            <div>
              <div className="font-medium">Export Word</div>
              <div className="text-xs text-gray-500">Format .docx éditable</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Export Toolbar Button - Simple button for toolbar
 */
export function ExportToolbarButton(): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleClick = useCallback(() => {
    editor.dispatchCommand(OPEN_EXPORT_DIALOG_COMMAND, { format: 'docx' });
  }, [editor]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      title="Exporter en Word"
    >
      <FileText size={16} />
      <span className="hidden sm:inline">.docx</span>
    </button>
  );
}

export default ExportPlugin;
