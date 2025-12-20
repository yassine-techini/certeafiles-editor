/**
 * HeaderFooterEditor - Advanced modal for editing headers, footers, and special sections
 * Per Constitution Section 4.2 - Headers and Footers
 * Redesigned per design specs with dynamic variables
 */
import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import type { SerializedEditorState } from 'lexical';
import {
  X,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

import { useHeaderFooterStore } from '../../stores/headerFooterStore';
import type { HeaderFooterContent } from '../../types/headerFooter';
import { setModalOpen } from '../../utils/modalState';

export interface HeaderFooterEditorProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close the modal */
  onClose: () => void;
  /** The folio ID being edited (null for default) */
  folioId: string | null;
}


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
 * Helper to extract text content from HeaderFooterContent
 */
function getContentText(content: HeaderFooterContent | null): string {
  if (!content) return '';
  const parts: string[] = [];
  if (content.left?.content) parts.push(content.left.content);
  if (content.center?.content) parts.push(content.center.content);
  if (content.right?.content) parts.push(content.right.content);
  return parts.join('  |  ');
}
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_headerEvenState, setHeaderEvenState] = useState<SerializedEditorState | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_footerEvenState, setFooterEvenState] = useState<SerializedEditorState | null>(null);
  const [sectionTitles, setSectionTitles] = useState<Record<string, string>>({});
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);
  const [resetTarget, setResetTarget] = useState<'header' | 'footer' | 'all'>('all');

  // Odd/Even page options
  const [headerDifferentOddEven, setHeaderDifferentOddEven] = useState(false);
  const [footerDifferentOddEven, setFooterDifferentOddEven] = useState(false);
  const [headerShowOnFirstPage, setHeaderShowOnFirstPage] = useState(true);
  const [footerShowOnFirstPage, setFooterShowOnFirstPage] = useState(true);

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

  // CRITICAL: Set modal state synchronously using useLayoutEffect
  // This runs before useEffect and before browser paint
  useLayoutEffect(() => {
    if (isOpen) {
      setModalOpen(true);
      console.log('[HeaderFooterEditor] Modal opened - setModalOpen(true)');
    }
    return () => {
      if (isOpen) {
        setModalOpen(false);
        console.log('[HeaderFooterEditor] Modal closed - setModalOpen(false)');
      }
    };
  }, [isOpen]);

  // Reset state when modal opens and prevent background scroll
  useEffect(() => {
    if (isOpen) {
      setHeaderState(null);
      setFooterState(null);
      setHeaderEvenState(null);
      setFooterEvenState(null);

      // Initialize odd/even settings from content
      if (headerContent) {
        setHeaderDifferentOddEven(headerContent.differentOddEven ?? false);
        setHeaderShowOnFirstPage(headerContent.showOnFirstPage ?? true);
      } else {
        setHeaderDifferentOddEven(false);
        setHeaderShowOnFirstPage(true);
      }

      if (footerContent) {
        setFooterDifferentOddEven(footerContent.differentOddEven ?? false);
        setFooterShowOnFirstPage(footerContent.showOnFirstPage ?? true);
      } else {
        setFooterDifferentOddEven(false);
        setFooterShowOnFirstPage(true);
      }

      // Initialize section titles with defaults
      const defaultTitles: Record<string, string> = {};
      SPECIAL_SECTIONS.forEach((s) => {
        defaultTitles[s.id] = s.defaultTitle;
      });
      setSectionTitles(defaultTitles);

      // Prevent ALL background interactions when modal is open
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;

      // Lock the body completely
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';

      // Store the original scroll positions of all scrollable containers
      const allScrollContainers = document.querySelectorAll('.overflow-auto, .overflow-y-auto, .overflow-scroll') as NodeListOf<HTMLElement>;
      const savedScrollPositions = new Map<HTMLElement, number>();
      allScrollContainers.forEach((container) => {
        savedScrollPositions.set(container, container.scrollTop);
      });

      // Block ALL scroll events at capture phase on document
      const blockAllScrollEvents = (e: Event) => {
        const modal = document.querySelector('[data-modal-open="true"]');
        if (!modal) return;

        const target = e.target as Node;
        // Allow scroll only inside the modal
        if (!modal.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      };

      // Block wheel events globally
      const blockWheelEvent = (e: WheelEvent) => {
        const modal = document.querySelector('[data-modal-open="true"]');
        if (!modal) return;

        const target = e.target as Node;
        if (!modal.contains(target)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      // Restore scroll positions if they change
      const enforceScrollPosition = () => {
        savedScrollPositions.forEach((scrollTop, container) => {
          if (container.scrollTop !== scrollTop) {
            container.scrollTop = scrollTop;
          }
        });
      };

      // Add listeners at capture phase for maximum priority
      document.addEventListener('scroll', blockAllScrollEvents, { capture: true, passive: false });
      document.addEventListener('wheel', blockWheelEvent, { capture: true, passive: false });

      // Periodically enforce scroll positions
      const enforceInterval = setInterval(enforceScrollPosition, 50);

      return () => {
        // Restore body styles
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;

        // Restore scroll position
        window.scrollTo(0, scrollY);

        // Clean up listeners
        clearInterval(enforceInterval);
        document.removeEventListener('scroll', blockAllScrollEvents, { capture: true });
        document.removeEventListener('wheel', blockWheelEvent, { capture: true });
      };
    }
    return undefined;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-modal-open="true">
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
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">En-tête:</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={headerShowOnFirstPage}
                    onChange={(e) => setHeaderShowOnFirstPage(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Afficher sur la première page
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={headerDifferentOddEven}
                    onChange={(e) => setHeaderDifferentOddEven(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Différencier pages paires/impaires
                </label>
              </div>
            </div>

            {/* Odd pages (or all pages if not differentiated) */}
            <div className="space-y-2">
              {headerDifferentOddEven && (
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pages impaires (1, 3, 5...)
                </label>
              )}
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Saisir le contenu de l'en-tête..."
                rows={3}
                defaultValue={getContentText(headerContent)}
                onChange={(e) => setHeaderState(e.target.value as unknown as SerializedEditorState)}
              />
            </div>

            {/* Even pages - only shown when differentOddEven is enabled */}
            {headerDifferentOddEven && (
              <div className="space-y-2 mt-3">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pages paires (2, 4, 6...)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Saisir le contenu de l'en-tête pour les pages paires..."
                  rows={3}
                  defaultValue={headerContent?.evenPageContent ? getContentText({
                    ...headerContent,
                    left: headerContent.evenPageContent.left,
                    center: headerContent.evenPageContent.center,
                    right: headerContent.evenPageContent.right,
                  }) : ''}
                  onChange={(e) => setHeaderEvenState(e.target.value as unknown as SerializedEditorState)}
                />
              </div>
            )}

            <p className="text-xs text-gray-500 italic mt-2">
              Éditeur simplifié pour test - les variables ne sont pas disponibles
            </p>
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
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Pied de page:</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={footerShowOnFirstPage}
                    onChange={(e) => setFooterShowOnFirstPage(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Afficher sur la première page
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={footerDifferentOddEven}
                    onChange={(e) => setFooterDifferentOddEven(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Différencier pages paires/impaires
                </label>
              </div>
            </div>

            {/* Odd pages (or all pages if not differentiated) */}
            <div className="space-y-2">
              {footerDifferentOddEven && (
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pages impaires (1, 3, 5...)
                </label>
              )}
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Saisir le contenu du pied de page..."
                rows={3}
                defaultValue={getContentText(footerContent)}
                onChange={(e) => setFooterState(e.target.value as unknown as SerializedEditorState)}
              />
            </div>

            {/* Even pages - only shown when differentOddEven is enabled */}
            {footerDifferentOddEven && (
              <div className="space-y-2 mt-3">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Pages paires (2, 4, 6...)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Saisir le contenu du pied de page pour les pages paires..."
                  rows={3}
                  defaultValue={footerContent?.evenPageContent ? getContentText({
                    ...footerContent,
                    left: footerContent.evenPageContent.left,
                    center: footerContent.evenPageContent.center,
                    right: footerContent.evenPageContent.right,
                  }) : ''}
                  onChange={(e) => setFooterEvenState(e.target.value as unknown as SerializedEditorState)}
                />
              </div>
            )}

            <p className="text-xs text-gray-500 italic mt-2">
              Éditeur simplifié pour test - les variables ne sont pas disponibles
            </p>
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
