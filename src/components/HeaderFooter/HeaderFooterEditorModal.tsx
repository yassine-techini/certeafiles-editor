/**
 * HeaderFooterEditorModal - Modal dialog for editing page headers and footers
 * Per Constitution Section 4.2 - Headers and Footers
 * Design based on design2.png specification
 */
import { useState, useCallback, useEffect, useLayoutEffect } from 'react';
import {
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  Link,
  Table,
  Undo,
  Redo,
  ChevronDown,
  Type,
} from 'lucide-react';
import { useHeaderFooterStore } from '../../stores/headerFooterStore';
import { setModalOpen } from '../../utils/modalState';

interface HeaderFooterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'header' | 'footer';
}

// Special sections that can be customized
const SPECIAL_SECTIONS = [
  { id: 'products_by_group', label: 'Produits concernés (par groupes de produits):', placeholder: 'Titre section Produits (par groupes de produits) personnalisé' },
  { id: 'products', label: 'Produits concernés (par produits):', placeholder: 'Titre section Produits (par produits) personnalisée' },
  { id: 'history', label: 'Historique:', placeholder: 'Titre section Historique personnalisé' },
  { id: 'validation', label: 'Validation:', placeholder: 'Titre section Validation personnalisé' },
  { id: 'toc', label: 'Table des matières:', placeholder: 'Titre section Table des matières personnalisé' },
];

/**
 * Mini Toolbar Component for rich text editing
 */
function MiniToolbar({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 px-3 py-2 bg-slate-100 rounded-t-lg border border-slate-200 border-b-0 ${className}`}>
      {/* Undo/Redo */}
      <button type="button" className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700">
        <Undo size={16} />
      </button>
      <button type="button" className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-700">
        <Redo size={16} />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Paragraph style dropdown */}
      <button type="button" className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded text-sm text-slate-700">
        Paragraphe
        <ChevronDown size={14} />
      </button>

      {/* Font dropdown */}
      <button type="button" className="flex items-center gap-1 px-2 py-1 hover:bg-slate-200 rounded text-sm text-slate-700">
        Time New ...
        <ChevronDown size={14} />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Font size */}
      <div className="flex items-center gap-0.5">
        <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500 text-sm">−</button>
        <span className="text-sm text-slate-700 px-1">16px</span>
        <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500 text-sm">+</button>
      </div>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Text formatting */}
      <button type="button" className="p-1.5 hover:bg-slate-200 rounded text-slate-700 font-bold">
        <Bold size={16} />
      </button>
      <button type="button" className="p-1.5 hover:bg-slate-200 rounded text-slate-500">
        <Italic size={16} />
      </button>
      <button type="button" className="p-1.5 hover:bg-slate-200 rounded text-slate-500">
        <Underline size={16} />
      </button>
      <button type="button" className="flex items-center p-1.5 hover:bg-slate-200 rounded">
        <Type size={16} className="text-slate-500" />
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {/* Text color with red indicator */}
      <button type="button" className="flex items-center p-1.5 hover:bg-slate-200 rounded relative">
        <span className="text-slate-700 font-serif text-sm">A</span>
        <div className="absolute bottom-1 left-1.5 right-1.5 h-0.5 bg-red-500 rounded" />
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      <div className="w-px h-5 bg-slate-300 mx-1" />

      {/* Alignment */}
      <button type="button" className="flex items-center p-1.5 hover:bg-slate-200 rounded text-slate-500">
        <AlignLeft size={16} />
        <ChevronDown size={12} className="text-slate-400" />
      </button>

      {/* Link */}
      <button type="button" className="p-1.5 hover:bg-slate-200 rounded text-slate-500">
        <Link size={16} />
      </button>

      {/* Table */}
      <button type="button" className="flex items-center p-1.5 hover:bg-slate-200 rounded text-slate-500">
        <Table size={16} />
        <ChevronDown size={12} className="text-slate-400" />
      </button>
    </div>
  );
}

/**
 * Variable Tag Component - displays a variable as a bordered tag
 */
function VariableTag({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 border border-slate-400 rounded text-sm text-slate-700 cursor-default hover:bg-slate-50"
      onClick={onClick}
    >
      {label}
    </span>
  );
}

/**
 * Header Editor Component - 3-column layout with rich editing
 */
function HeaderEditor() {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-900">En-tête:</label>

      {/* Toolbar */}
      <MiniToolbar />

      {/* 3-Column Header Layout */}
      <div className="border border-slate-200 rounded-b-lg bg-white">
        <div className="flex divide-x divide-slate-200">
          {/* Left Column - Logo */}
          <div className="flex-1 p-4 min-h-[100px]">
            <div className="flex items-center justify-center h-full">
              <VariableTag label="logoEntreprise" />
            </div>
          </div>

          {/* Center Column - Group Name & Document Name */}
          <div className="flex-1 p-4 min-h-[100px]">
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <VariableTag label="nomGroupeProduits" />
              <VariableTag label="nomDocument" />
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="flex-1 p-4 min-h-[100px]">
            <div className="flex flex-col items-end justify-center h-full gap-1 text-sm">
              <div className="flex items-center gap-1">
                <VariableTag label="refVersionneeModele" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-600">Application date:</span>
              </div>
              <div className="flex items-center gap-1">
                <VariableTag label="dateApplicationModele" />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-slate-600">Page</span>
                <VariableTag label="pagecourante" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-600">sur</span>
                <VariableTag label="nbreTotalPages" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500">
        Utilisez + pour accéder aux éléments nécessaires
      </p>
    </div>
  );
}

/**
 * Special Sections Editor Component
 */
function SpecialSectionsEditor({
  sections,
  onChange,
}: {
  sections: Record<string, string>;
  onChange: (sectionId: string, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Sections spéciales : personnalisez ici les titres des sections spéciales:
        </h3>

        <div className="space-y-4">
          {SPECIAL_SECTIONS.map((section) => (
            <div key={section.id} className="flex items-center gap-4">
              <label className="w-72 text-sm text-slate-700 shrink-0">
                {section.label}
              </label>
              <input
                type="text"
                value={sections[section.id] || ''}
                onChange={(e) => onChange(section.id, e.target.value)}
                placeholder={section.placeholder}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Footer Editor Component - with rich editing
 */
function FooterEditor() {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-900">Pied de page:</label>

      {/* Toolbar */}
      <MiniToolbar />

      {/* Footer Content Area */}
      <div className="border border-slate-200 rounded-b-lg bg-white p-4 min-h-[60px]">
        <div className="flex items-center justify-center gap-2">
          <VariableTag label="refVersionneeDocument" />
          <span className="text-slate-600">-</span>
          <VariableTag label="nomDocument" />
        </div>
      </div>

      {/* Helper text */}
      <p className="text-xs text-slate-500">
        Utilisez + pour accéder aux éléments nécessaires
      </p>
    </div>
  );
}

/**
 * HeaderFooterEditorModal - Main modal component
 */
export function HeaderFooterEditorModal({
  isOpen,
  onClose,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialTab: _initialTab = 'header',
}: HeaderFooterEditorModalProps) {
  // Store actions
  const {
    defaultHeaderId,
    defaultFooterId,
    initialize,
  } = useHeaderFooterStore();

  // Local state for special sections
  const [specialSections, setSpecialSections] = useState<Record<string, string>>({});

  // Initialize store if needed
  useEffect(() => {
    if (isOpen && !defaultHeaderId && !defaultFooterId) {
      initialize();
    }
  }, [isOpen, defaultHeaderId, defaultFooterId, initialize]);

  // CRITICAL: Set modal state synchronously using useLayoutEffect
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

  // Handle special section change
  const handleSpecialSectionChange = useCallback((sectionId: string, value: string) => {
    setSpecialSections(prev => ({
      ...prev,
      [sectionId]: value,
    }));
  }, []);

  // Handle close with save
  const handleApply = useCallback(() => {
    // Save special sections to store if needed
    // For now, we just close the modal
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Configuration des en-têtes et pieds de page
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(90vh-140px)] bg-slate-50">
          {/* Header Editor */}
          <HeaderEditor />

          {/* Special Sections */}
          <SpecialSectionsEditor
            sections={specialSections}
            onChange={handleSpecialSectionChange}
          />

          {/* Footer Editor */}
          <FooterEditor />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}

export default HeaderFooterEditorModal;
