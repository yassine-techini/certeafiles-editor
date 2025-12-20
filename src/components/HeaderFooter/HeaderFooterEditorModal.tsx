/**
 * HeaderFooterEditorModal - Modal dialog for editing page headers and footers
 * Per Constitution Section 4.2 - Headers and Footers
 */
import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  X,
  Hash,
  Calendar,
  Clock,
  FileText,
  User,
  Plus,
  Trash2,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { useHeaderFooterStore } from '../../stores/headerFooterStore';
import {
  type HeaderFooterContent,
  type HeaderFooterSegment,
  type DynamicFieldType,
  createTextSegment,
  createDynamicSegment,
  DEFAULT_HEADER_HEIGHT,
  DEFAULT_FOOTER_HEIGHT,
} from '../../types/headerFooter';
import { setModalOpen } from '../../utils/modalState';

interface HeaderFooterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'header' | 'footer';
}

type SegmentPosition = 'left' | 'center' | 'right';

const DYNAMIC_FIELDS: { type: DynamicFieldType; label: string; icon: React.ReactNode; preview: string }[] = [
  { type: 'page_number', label: 'Numéro de page', icon: <Hash size={16} />, preview: '1' },
  { type: 'total_pages', label: 'Total pages', icon: <Hash size={16} />, preview: '10' },
  { type: 'date', label: 'Date', icon: <Calendar size={16} />, preview: new Date().toLocaleDateString() },
  { type: 'time', label: 'Heure', icon: <Clock size={16} />, preview: new Date().toLocaleTimeString() },
  { type: 'document_title', label: 'Titre du document', icon: <FileText size={16} />, preview: 'Document' },
  { type: 'author', label: 'Auteur', icon: <User size={16} />, preview: 'Utilisateur' },
];

/**
 * Segment Editor Component
 */
function SegmentEditor({
  segment,
  position,
  onChange,
  onRemove,
}: {
  segment: HeaderFooterSegment | null;
  position: SegmentPosition;
  onChange: (segment: HeaderFooterSegment | null) => void;
  onRemove: () => void;
}) {
  const [showDynamicPicker, setShowDynamicPicker] = useState(false);

  const positionLabels: Record<SegmentPosition, string> = {
    left: 'Gauche',
    center: 'Centre',
    right: 'Droite',
  };

  const handleTextChange = (text: string) => {
    onChange(text ? createTextSegment(text) : null);
  };

  const handleDynamicFieldSelect = (fieldType: DynamicFieldType) => {
    onChange(createDynamicSegment(fieldType));
    setShowDynamicPicker(false);
  };

  const getSegmentPreview = (): string => {
    if (!segment) return '';
    if (segment.type === 'text') return segment.content || '';
    if (segment.type === 'dynamic' && segment.dynamicField) {
      const field = DYNAMIC_FIELDS.find(f => f.type === segment.dynamicField?.type);
      return field ? `{${field.label}}` : '';
    }
    return '';
  };

  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {positionLabels[position]}
      </label>
      <div className="relative">
        <div className="flex gap-1">
          <input
            type="text"
            value={segment?.type === 'text' ? segment.content || '' : ''}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={segment?.type === 'dynamic' ? getSegmentPreview() : 'Texte...'}
            className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              segment?.type === 'dynamic' ? 'bg-blue-50 border-blue-200' : 'border-slate-200'
            }`}
            disabled={segment?.type === 'dynamic'}
          />
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDynamicPicker(!showDynamicPicker)}
              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
              title="Champ dynamique"
            >
              <Plus size={18} />
            </button>
            {showDynamicPicker && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 min-w-[200px]">
                <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">
                  Champs dynamiques
                </div>
                {DYNAMIC_FIELDS.map((field) => (
                  <button
                    key={field.type}
                    type="button"
                    onClick={() => handleDynamicFieldSelect(field.type)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 text-left"
                  >
                    {field.icon}
                    <span className="flex-1">{field.label}</span>
                    <span className="text-xs text-slate-400">{field.preview}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {segment && (
            <button
              type="button"
              onClick={onRemove}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        {segment?.type === 'dynamic' && (
          <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
            <Hash size={12} />
            Champ dynamique: {getSegmentPreview()}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Preview Component
 */
function Preview({
  content,
  type,
}: {
  content: HeaderFooterContent | null;
  type: 'header' | 'footer';
}) {
  const getPreviewText = (segment: HeaderFooterSegment | null): string => {
    if (!segment) return '';
    if (segment.type === 'text') return segment.content || '';
    if (segment.type === 'dynamic' && segment.dynamicField) {
      switch (segment.dynamicField.type) {
        case 'page_number': return '1';
        case 'total_pages': return '10';
        case 'date': return new Date().toLocaleDateString('fr-FR');
        case 'time': return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        case 'document_title': return 'Document Title';
        case 'author': return 'Auteur';
        default: return '';
      }
    }
    return '';
  };

  if (!content) {
    return (
      <div className="bg-slate-100 rounded-lg p-4 text-center text-slate-400 text-sm">
        Aucun {type === 'header' ? 'en-tête' : 'pied de page'} configuré
      </div>
    );
  }

  return (
    <div
      className={`bg-white border rounded-lg ${
        type === 'header' ? 'border-b-2 border-b-slate-300' : 'border-t-2 border-t-slate-300'
      }`}
      style={{ height: `${content.height * 2}px`, minHeight: '40px' }}
    >
      <div className="h-full flex items-center justify-between px-4 text-sm text-slate-700">
        <div className="flex-1 text-left truncate">
          {getPreviewText(content.left)}
        </div>
        <div className="flex-1 text-center truncate font-medium">
          {getPreviewText(content.center)}
        </div>
        <div className="flex-1 text-right truncate">
          {getPreviewText(content.right)}
        </div>
      </div>
    </div>
  );
}

/**
 * HeaderFooterEditorModal - Main modal component
 */
export function HeaderFooterEditorModal({
  isOpen,
  onClose,
  initialTab = 'header',
}: HeaderFooterEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'header' | 'footer'>(initialTab);

  // Store actions
  const {
    getDefaultHeader,
    getDefaultFooter,
    updateHeaderSegment,
    updateFooterSegment,
    updateHeader,
    updateFooter,
    resetDefaultHeaderToTemplate,
    resetDefaultFooterToTemplate,
    defaultHeaderId,
    defaultFooterId,
    initialize,
  } = useHeaderFooterStore();

  // Initialize store if needed
  useEffect(() => {
    if (isOpen && !defaultHeaderId && !defaultFooterId) {
      initialize();
    }
  }, [isOpen, defaultHeaderId, defaultFooterId, initialize]);

  // CRITICAL: Set modal state synchronously using useLayoutEffect
  // This runs before useEffect and before browser paint
  useLayoutEffect(() => {
    if (isOpen) {
      setModalOpen(true);
      console.log('[HeaderFooterEditorModal] Modal opened - setModalOpen(true)');
    }
    return () => {
      if (isOpen) {
        setModalOpen(false);
        console.log('[HeaderFooterEditorModal] Modal closed - setModalOpen(false)');
      }
    };
  }, [isOpen]);

  // Get current content
  const headerContent = getDefaultHeader() || null;
  const footerContent = getDefaultFooter() || null;

  // Current content based on active tab
  const currentContent = activeTab === 'header' ? headerContent : footerContent;
  const currentId = activeTab === 'header' ? defaultHeaderId : defaultFooterId;

  // Update segment handler
  const handleSegmentChange = useCallback(
    (position: SegmentPosition, segment: HeaderFooterSegment | null) => {
      if (!currentId) return;

      if (activeTab === 'header') {
        updateHeaderSegment(currentId, position, segment);
      } else {
        updateFooterSegment(currentId, position, segment);
      }
    },
    [activeTab, currentId, updateHeaderSegment, updateFooterSegment]
  );

  // Update height handler
  const handleHeightChange = useCallback(
    (height: number) => {
      if (!currentId) return;

      if (activeTab === 'header') {
        updateHeader(currentId, { height });
      } else {
        updateFooter(currentId, { height });
      }
    },
    [activeTab, currentId, updateHeader, updateFooter]
  );

  // Update options handler
  const handleOptionsChange = useCallback(
    (updates: Partial<HeaderFooterContent>) => {
      if (!currentId) return;

      if (activeTab === 'header') {
        updateHeader(currentId, updates);
      } else {
        updateFooter(currentId, updates);
      }
    },
    [activeTab, currentId, updateHeader, updateFooter]
  );

  // Reset handler
  const handleReset = useCallback(() => {
    if (activeTab === 'header') {
      resetDefaultHeaderToTemplate();
    } else {
      resetDefaultFooterToTemplate();
    }
  }, [activeTab, resetDefaultHeaderToTemplate, resetDefaultFooterToTemplate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            En-têtes et pieds de page
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('header')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'header'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            En-tête (Header)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('footer')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'footer'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Pied de page (Footer)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Preview */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={16} className="text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Apercu</h3>
            </div>
            <Preview content={currentContent} type={activeTab} />
          </div>

          {/* Segment Editors */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Contenu</h3>
            <div className="flex gap-4">
              <SegmentEditor
                segment={currentContent?.left || null}
                position="left"
                onChange={(segment) => handleSegmentChange('left', segment)}
                onRemove={() => handleSegmentChange('left', null)}
              />
              <SegmentEditor
                segment={currentContent?.center || null}
                position="center"
                onChange={(segment) => handleSegmentChange('center', segment)}
                onRemove={() => handleSegmentChange('center', null)}
              />
              <SegmentEditor
                segment={currentContent?.right || null}
                position="right"
                onChange={(segment) => handleSegmentChange('right', segment)}
                onRemove={() => handleSegmentChange('right', null)}
              />
            </div>
          </div>

          {/* Quick Insert */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Insertion rapide</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSegmentChange('center', createTextSegment('Page {page} / {total}'))}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
              >
                Page X / Y
              </button>
              <button
                type="button"
                onClick={() => handleSegmentChange('right', createDynamicSegment('date'))}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => handleSegmentChange('left', createTextSegment('Document confidentiel'))}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
              >
                Confidentiel
              </button>
              <button
                type="button"
                onClick={() => handleSegmentChange('center', createDynamicSegment('document_title'))}
                className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors"
              >
                Titre du document
              </button>
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Options</h3>
            <div className="space-y-4">
              {/* Height */}
              <div className="flex items-center gap-4">
                <label className="text-sm text-slate-600 w-32">Hauteur (mm)</label>
                <input
                  type="number"
                  min={10}
                  max={50}
                  value={currentContent?.height || (activeTab === 'header' ? DEFAULT_HEADER_HEIGHT : DEFAULT_FOOTER_HEIGHT)}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value) || 15)}
                  className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              {/* Show on first page */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentContent?.showOnFirstPage ?? true}
                  onChange={(e) => handleOptionsChange({ showOnFirstPage: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  Afficher sur la premiere page
                </span>
              </label>

              {/* Show border */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentContent?.showBorder ?? false}
                  onChange={(e) => handleOptionsChange({ showBorder: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  Afficher une bordure
                </span>
              </label>

              {/* Different odd/even */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentContent?.differentOddEven ?? false}
                  onChange={(e) => handleOptionsChange({ differentOddEven: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  Different sur pages paires/impaires
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw size={16} />
            Reinitialiser
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeaderFooterEditorModal;
