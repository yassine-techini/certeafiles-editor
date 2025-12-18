/**
 * HeaderFooterEditor - Advanced modal for editing headers, footers, and special sections
 * Per Constitution Section 4.2 - Headers and Footers
 * Redesigned per design specs with dynamic variables
 */
import { useState, useCallback, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';
import { $getRoot, $createParagraphNode, $createTextNode, $getSelection, $isRangeSelection } from 'lexical';
import {
  X,
  Plus,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  ChevronDown,
  Minus,
  AlignLeft,
  Link,
  Table,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

import { PageNumberNode } from '../../nodes/PageNumberNode';
import { useHeaderFooterStore } from '../../stores/headerFooterStore';
import type { HeaderFooterContent } from '../../types/headerFooter';

export interface HeaderFooterEditorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close the modal */
  onClose: () => void;
  /** The folio ID being edited (null for default) */
  folioId: string | null;
}

/**
 * Dynamic variables available for insertion
 */
const DYNAMIC_VARIABLES = [
  { id: 'logoEntreprise', label: 'Logo Entreprise', description: 'Logo de l\'entreprise' },
  { id: 'nomGroupeProduits', label: 'Nom Groupe Produits', description: 'Nom du groupe de produits' },
  { id: 'nomDocument', label: 'Nom Document', description: 'Nom du document' },
  { id: 'refVersionneeModele', label: 'Réf. Version Modèle', description: 'Référence versionnée du modèle' },
  { id: 'dateApplicationModele', label: 'Date Application', description: 'Date d\'application du modèle' },
  { id: 'pagecourante', label: 'Page Courante', description: 'Numéro de page actuel' },
  { id: 'nbreTotalPages', label: 'Total Pages', description: 'Nombre total de pages' },
  { id: 'refVersionneeDocument', label: 'Réf. Version Doc', description: 'Référence versionnée du document' },
];

/**
 * Special sections configuration
 */
const SPECIAL_SECTIONS = [
  { id: 'produits_groupes', label: 'Produits concernés (par groupes de produits)', defaultTitle: 'Titre section Produits (par groupes de produits) personnalisé' },
  { id: 'produits', label: 'Produits concernés (par produits)', defaultTitle: 'Titre section Produits (par produits) personnalisée' },
  { id: 'historique', label: 'Historique', defaultTitle: 'Titre section Historique personnalisé' },
  { id: 'validation', label: 'Validation', defaultTitle: 'Titre section Validation personnalisé' },
  { id: 'table_matieres', label: 'Table des matières', defaultTitle: 'Titre section Table des matières personnalisé' },
];

/**
 * Mini editor configuration
 */
const miniEditorConfig = {
  namespace: 'HeaderFooterMiniEditor',
  theme: {
    paragraph: 'hf-paragraph',
    text: {
      bold: 'hf-bold',
      italic: 'hf-italic',
      underline: 'hf-underline',
    },
  },
  nodes: [PageNumberNode],
  onError: (error: Error) => {
    console.error('[HeaderFooterEditor] Error:', error);
  },
};

/**
 * Variable tag component - insertable token
 */
function VariableTag({
  variable,
  onClick,
}: {
  variable: string;
  onClick?: () => void;
}): JSX.Element {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 mx-0.5 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-300 rounded cursor-pointer hover:bg-blue-200 transition-colors"
      onClick={onClick}
    >
      {variable}
    </span>
  );
}

/**
 * Mini toolbar for header/footer editors
 */
function MiniToolbar(): JSX.Element {
  const [showVariables, setShowVariables] = useState(false);
  const [editor] = useLexicalComposerContext();

  const insertVariable = useCallback(
    (variableId: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.insertText(`{${variableId}}`);
        }
      });
      setShowVariables(false);
    },
    [editor]
  );

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-blue-50 border-b border-blue-100 flex-wrap">
      {/* Undo/Redo */}
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Annuler">
        <Undo size={16} />
      </button>
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Rétablir">
        <Redo size={16} />
      </button>

      <div className="w-px h-5 bg-blue-200 mx-1" />

      {/* Block type */}
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 text-sm bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        Paragraphe <ChevronDown size={12} />
      </button>

      {/* Font */}
      <button
        type="button"
        className="flex items-center gap-1 px-2 py-1 text-sm bg-white rounded border border-gray-200 hover:bg-gray-50"
      >
        Time New ... <ChevronDown size={12} />
      </button>

      {/* Font size */}
      <div className="flex items-center border border-gray-200 rounded bg-white">
        <button type="button" className="p-1 hover:bg-gray-100 rounded-l">
          <Minus size={12} />
        </button>
        <span className="px-2 text-sm">16px</span>
        <button type="button" className="p-1 hover:bg-gray-100 rounded-r">
          <Plus size={12} />
        </button>
      </div>

      <div className="w-px h-5 bg-blue-200 mx-1" />

      {/* Text formatting */}
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Gras">
        <Bold size={16} />
      </button>
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Italique">
        <Italic size={16} />
      </button>
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Souligné">
        <Underline size={16} />
      </button>

      {/* Text color */}
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600 relative" title="Couleur du texte">
        <span className="font-bold text-red-500">T</span>
        <ChevronDown size={10} className="absolute bottom-0.5 right-0.5" />
      </button>

      {/* Highlight */}
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600 relative" title="Surlignage">
        <span className="font-bold text-yellow-500 bg-yellow-100 px-0.5">A</span>
        <ChevronDown size={10} className="absolute bottom-0.5 right-0.5" />
      </button>

      <div className="w-px h-5 bg-blue-200 mx-1" />

      {/* Alignment */}
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Alignement">
        <AlignLeft size={16} />
        <ChevronDown size={10} className="ml-0.5" />
      </button>

      {/* Link */}
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Lien">
        <Link size={16} />
      </button>

      {/* Table */}
      <button type="button" className="p-1.5 hover:bg-blue-100 rounded text-gray-600" title="Tableau">
        <Table size={16} />
        <ChevronDown size={10} className="ml-0.5" />
      </button>

      <div className="flex-1" />

      {/* Insert variable dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowVariables(!showVariables)}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus size={14} /> Variable
        </button>
        {showVariables && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[220px] py-1 max-h-[250px] overflow-y-auto">
            {DYNAMIC_VARIABLES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => insertVariable(v.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex flex-col"
              >
                <span className="font-medium text-gray-900">{v.label}</span>
                <span className="text-xs text-gray-500">{v.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Plugin to initialize editor content
 */
function InitialContentPlugin({
  content,
}: {
  content: HeaderFooterContent | null;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (content) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();

        // Build display text from segments
        const parts: string[] = [];
        if (content.left?.content) parts.push(content.left.content);
        if (content.center?.content) parts.push(content.center.content);
        if (content.right?.content) parts.push(content.right.content);

        const displayText = parts.join('  |  ') || '';

        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(displayText));
        root.append(paragraph);
      });
    }
  }, [editor, content]);

  return null;
}

/**
 * Plugin to capture editor state changes
 */
function EditorStatePlugin({
  onChange,
}: {
  onChange: (state: SerializedEditorState) => void;
}): JSX.Element {
  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      onChange(editorState.toJSON());
    },
    [onChange]
  );

  return <OnChangePlugin onChange={handleChange} />;
}

/**
 * Header visual preview with three columns
 */
function HeaderPreview(): JSX.Element {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="border border-gray-200 p-3 w-1/4 align-top">
              <VariableTag variable="logoEntreprise" />
            </td>
            <td className="border border-gray-200 p-3 w-1/2 align-top text-center">
              <div className="font-bold text-lg">
                <VariableTag variable="nomGroupeProduits" />
              </div>
              <div className="font-semibold mt-1">
                <VariableTag variable="nomDocument" />
              </div>
            </td>
            <td className="border border-gray-200 p-3 w-1/4 align-top text-right text-xs">
              <div><VariableTag variable="refVersionneeModele" /></div>
              <div className="mt-1">Application date:</div>
              <div><VariableTag variable="dateApplicationModele" /></div>
              <div className="mt-1">
                Page <VariableTag variable="pagecourante" /> sur <VariableTag variable="nbreTotalPages" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * Footer visual preview
 */
function FooterPreview(): JSX.Element {
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white p-4 text-center">
      <VariableTag variable="refVersionneeDocument" />
      <span className="mx-2">-</span>
      <VariableTag variable="nomDocument" />
    </div>
  );
}

/**
 * HeaderFooterEditor - Modal component for editing headers, footers, and special sections
 */
/**
 * Reset Confirmation Dialog
 */
function ResetConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 rounded-full">
            <AlertTriangle className="text-amber-600" size={24} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * HeaderFooterEditor - Modal component for editing headers, footers, and special sections
 */
export function HeaderFooterEditor({
  isOpen,
  onClose,
  folioId,
}: HeaderFooterEditorProps): JSX.Element | null {
  const [headerState, setHeaderState] = useState<SerializedEditorState | null>(null);
  const [footerState, setFooterState] = useState<SerializedEditorState | null>(null);
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>({});
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [resetTarget, setResetTarget] = useState<'header' | 'footer' | 'all'>('all');

  // Store actions
  const {
    getHeaderForFolio,
    getFooterForFolio,
    setFolioHeaderOverride,
    setFolioFooterOverride,
    resetFolioHeaderToDefault,
    resetFolioFooterToDefault,
    resetDefaultHeaderToTemplate,
    resetDefaultFooterToTemplate,
    resetAllToTemplateDefaults,
    propagateHeaderToAllFolios,
    propagateFooterToAllFolios,
    propagateAllToFolios,
    getFoliosWithHeaderOverride,
    getFoliosWithFooterOverride,
    headers,
    footers,
    defaultHeaderId,
    defaultFooterId,
  } = useHeaderFooterStore();

  // Check if there are folios with overrides
  const foliosWithHeaderOverride = getFoliosWithHeaderOverride();
  const foliosWithFooterOverride = getFoliosWithFooterOverride();
  const hasAnyOverrides = foliosWithHeaderOverride.length > 0 || foliosWithFooterOverride.length > 0;

  // Get current content
  const headerContent = folioId
    ? getHeaderForFolio(folioId).content
    : defaultHeaderId
      ? headers.get(defaultHeaderId) ?? null
      : null;

  const footerContent = folioId
    ? getFooterForFolio(folioId).content
    : defaultFooterId
      ? footers.get(defaultFooterId) ?? null
      : null;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHeaderState(null);
      setFooterState(null);
      // Initialize section titles with defaults
      const defaultTitles: Record<string, string> = {};
      SPECIAL_SECTIONS.forEach((s) => {
        defaultTitles[s.id] = s.defaultTitle;
      });
      setSectionTitles(defaultTitles);
    }
  }, [isOpen]);

  /**
   * Handle section title change
   */
  const handleSectionTitleChange = useCallback((sectionId: string, title: string) => {
    setSectionTitles((prev) => ({ ...prev, [sectionId]: title }));
  }, []);

  /**
   * Handle save
   */
  const handleSave = useCallback(() => {
    if (folioId) {
      // Save custom content
      if (headerState) {
        const contentId = `custom-header-${folioId}`;
        setFolioHeaderOverride(folioId, contentId);
      }
      if (footerState) {
        const contentId = `custom-footer-${folioId}`;
        setFolioFooterOverride(folioId, contentId);
      }
    }
    // TODO: Save section titles to store
    onClose();
  }, [folioId, headerState, footerState, setFolioHeaderOverride, setFolioFooterOverride, onClose]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  /**
   * Handle reset request - shows confirmation dialog
   */
  const handleResetRequest = useCallback((target: 'header' | 'footer' | 'all') => {
    setResetTarget(target);
    setShowResetConfirmation(true);
  }, []);

  /**
   * Handle reset confirmation
   */
  const handleResetConfirm = useCallback(() => {
    if (folioId) {
      // Reset folio-specific overrides to document default
      switch (resetTarget) {
        case 'header':
          resetFolioHeaderToDefault(folioId);
          break;
        case 'footer':
          resetFolioFooterToDefault(folioId);
          break;
        case 'all':
          resetFolioHeaderToDefault(folioId);
          resetFolioFooterToDefault(folioId);
          break;
      }
    } else {
      // Reset document defaults to template defaults
      switch (resetTarget) {
        case 'header':
          resetDefaultHeaderToTemplate();
          break;
        case 'footer':
          resetDefaultFooterToTemplate();
          break;
        case 'all':
          resetAllToTemplateDefaults();
          break;
      }
    }
    setShowResetConfirmation(false);
    // Reset local state
    setHeaderState(null);
    setFooterState(null);
  }, [
    folioId,
    resetTarget,
    resetFolioHeaderToDefault,
    resetFolioFooterToDefault,
    resetDefaultHeaderToTemplate,
    resetDefaultFooterToTemplate,
    resetAllToTemplateDefaults,
  ]);

  /**
   * Get reset dialog message based on context
   */
  const getResetMessage = useCallback(() => {
    if (folioId) {
      switch (resetTarget) {
        case 'header':
          return 'L\'en-tête de ce folio sera réinitialisé au modèle par défaut du document.';
        case 'footer':
          return 'Le pied de page de ce folio sera réinitialisé au modèle par défaut du document.';
        case 'all':
          return 'L\'en-tête et le pied de page de ce folio seront réinitialisés aux modèles par défaut du document.';
      }
    } else {
      switch (resetTarget) {
        case 'header':
          return 'L\'en-tête par défaut sera réinitialisé au modèle de base. Tous les folios utilisant le modèle par défaut seront affectés.';
        case 'footer':
          return 'Le pied de page par défaut sera réinitialisé au modèle de base. Tous les folios utilisant le modèle par défaut seront affectés.';
        case 'all':
          return 'Tous les en-têtes et pieds de page seront réinitialisés aux modèles de base. Les personnalisations des folios seront perdues.';
      }
    }
  }, [folioId, resetTarget]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-50 rounded-xl shadow-2xl w-[900px] max-w-[95vw] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900">
            Configuration En-tête / Pied de page
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Header Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">En-tête:</h3>
            <div className="bg-blue-50 rounded-xl overflow-hidden border border-blue-100">
              <LexicalComposer initialConfig={miniEditorConfig}>
                <MiniToolbar />
                <div className="p-4">
                  <HeaderPreview />
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Utilisez + pour accéder aux éléments nécessaires
                  </p>
                </div>
                <InitialContentPlugin content={headerContent} />
                <EditorStatePlugin onChange={setHeaderState} />
                <HistoryPlugin />
              </LexicalComposer>
            </div>
          </section>

          {/* Special Sections Configuration */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Sections spéciales : personnalisez ici les titres des sections spéciales:
            </h3>
            <div className="space-y-4">
              {SPECIAL_SECTIONS.map((section) => (
                <div key={section.id} className="flex items-center gap-4">
                  <label className="w-72 text-sm text-gray-600 font-medium">
                    {section.label}:
                  </label>
                  <input
                    type="text"
                    value={sectionTitles[section.id] || ''}
                    onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                    placeholder={section.defaultTitle}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Footer Section */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Pied de page:</h3>
            <div className="bg-blue-50 rounded-xl overflow-hidden border border-blue-100">
              <LexicalComposer initialConfig={{ ...miniEditorConfig, namespace: 'FooterMiniEditor' }}>
                <MiniToolbar />
                <div className="p-4">
                  <FooterPreview />
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Utilisez + pour accéder aux éléments nécessaires
                  </p>
                </div>
                <InitialContentPlugin content={footerContent} />
                <EditorStatePlugin onChange={setFooterState} />
                <HistoryPlugin />
              </LexicalComposer>
            </div>
          </section>

          {/* Propagation Section - Only show when editing default (no folioId) and there are overrides */}
          {!folioId && hasAnyOverrides && (
            <section className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Propagation aux folios
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 mb-4">
                  Certains folios ont des en-têtes/pieds de page personnalisés.
                  Vous pouvez propager les modèles par défaut à toutes les pages.
                </p>
                <div className="flex flex-wrap gap-3">
                  {foliosWithHeaderOverride.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Propager l'en-tête par défaut à ${foliosWithHeaderOverride.length} folio(s) ? Les personnalisations seront perdues.`)) {
                          propagateHeaderToAllFolios();
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      Propager l'en-tête ({foliosWithHeaderOverride.length} folio{foliosWithHeaderOverride.length > 1 ? 's' : ''})
                    </button>
                  )}
                  {foliosWithFooterOverride.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Propager le pied de page par défaut à ${foliosWithFooterOverride.length} folio(s) ? Les personnalisations seront perdues.`)) {
                          propagateFooterToAllFolios();
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-700 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
                    >
                      Propager le pied de page ({foliosWithFooterOverride.length} folio{foliosWithFooterOverride.length > 1 ? 's' : ''})
                    </button>
                  )}
                  {hasAnyOverrides && (
                    <button
                      type="button"
                      onClick={() => {
                        const totalOverrides = new Set([...foliosWithHeaderOverride, ...foliosWithFooterOverride]).size;
                        if (window.confirm(`Propager les modèles par défaut à ${totalOverrides} folio(s) ? Toutes les personnalisations seront perdues.`)) {
                          propagateAllToFolios();
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Propager tout
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-white rounded-b-xl">
          {/* Reset button on the left */}
          <button
            type="button"
            onClick={() => handleResetRequest('all')}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
            title={folioId ? 'Réinitialiser au modèle par défaut' : 'Réinitialiser au modèle de base'}
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>

          {/* Cancel and Save buttons on the right */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </div>

        {/* Reset Confirmation Dialog */}
        <ResetConfirmationDialog
          isOpen={showResetConfirmation}
          onConfirm={handleResetConfirm}
          onCancel={() => setShowResetConfirmation(false)}
          title="Confirmer la réinitialisation"
          message={getResetMessage()}
        />
      </div>
    </div>
  );
}

export default HeaderFooterEditor;
