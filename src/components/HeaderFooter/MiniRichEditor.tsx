/**
 * MiniRichEditor - Compact rich text editor for header/footer editing
 * A simplified version of the main editor with toolbar and content area
 */
import { useCallback, useEffect, useState, memo, useId } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListNode, ListItemNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { HeadingNode } from '@lexical/rich-text';
import type { EditorState, LexicalEditor, SerializedEditorState } from 'lexical';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $createTextNode,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CAN_REDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import {
  Bold,
  Italic,
  Underline,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Plus,
} from 'lucide-react';

import { PageNumberNode } from '../../nodes/PageNumberNode';

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

export interface MiniRichEditorProps {
  /** Initial content as text (simple initialization) */
  initialContent?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when content changes */
  onChange?: (state: SerializedEditorState) => void;
  /** Additional CSS class */
  className?: string;
  /** Minimum height in pixels */
  minHeight?: number;
  /** Label for the editor */
  label?: string;
}

/**
 * Mini editor configuration
 */
const createMiniEditorConfig = (namespace: string) => ({
  namespace,
  theme: {
    root: 'mini-editor-root',
    paragraph: 'mini-editor-paragraph',
    text: {
      bold: 'font-bold',
      italic: 'italic',
      underline: 'underline',
    },
    link: 'text-blue-600 underline cursor-pointer',
  },
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    LinkNode,
    PageNumberNode,
  ],
  onError: (error: Error) => {
    console.error('[MiniRichEditor] Error:', error);
  },
});

/**
 * Mini toolbar component
 */
const MiniToolbar = memo(function MiniToolbar(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showAlignDropdown, setShowAlignDropdown] = useState(false);

  // Update toolbar state based on selection
  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  // Register listeners
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor, updateToolbar]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    if (!showVariables && !showAlignDropdown) return;
    const handleClick = () => {
      setShowVariables(false);
      setShowAlignDropdown(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showVariables, showAlignDropdown]);

  // Format handlers
  const formatBold = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }, [editor]);

  const formatItalic = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  }, [editor]);

  const formatUnderline = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  }, [editor]);

  const formatAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, align);
      setAlignment(align);
      setShowAlignDropdown(false);
    },
    [editor]
  );

  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

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

  const getAlignIcon = () => {
    switch (alignment) {
      case 'center': return <AlignCenter size={16} />;
      case 'right': return <AlignRight size={16} />;
      default: return <AlignLeft size={16} />;
    }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-gray-50 border-b border-gray-200 rounded-t-lg flex-wrap">
      {/* Undo/Redo */}
      <button
        type="button"
        onClick={handleUndo}
        disabled={!canUndo}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${!canUndo ? 'opacity-40 cursor-not-allowed' : ''}`}
        title="Annuler"
      >
        <Undo size={16} className="text-gray-600" />
      </button>
      <button
        type="button"
        onClick={handleRedo}
        disabled={!canRedo}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${!canRedo ? 'opacity-40 cursor-not-allowed' : ''}`}
        title="Rétablir"
      >
        <Redo size={16} className="text-gray-600" />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Text formatting */}
      <button
        type="button"
        onClick={formatBold}
        className={`p-1.5 rounded transition-colors ${isBold ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
        title="Gras (Ctrl+B)"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={formatItalic}
        className={`p-1.5 rounded transition-colors ${isItalic ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
        title="Italique (Ctrl+I)"
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={formatUnderline}
        className={`p-1.5 rounded transition-colors ${isUnderline ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-600'}`}
        title="Souligné (Ctrl+U)"
      >
        <Underline size={16} />
      </button>

      <div className="w-px h-5 bg-gray-300 mx-1" />

      {/* Alignment dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowAlignDropdown(!showAlignDropdown);
          }}
          className="flex items-center gap-0.5 p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-600"
          title="Alignement"
        >
          {getAlignIcon()}
          <ChevronDown size={12} />
        </button>
        {showAlignDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
            <button
              type="button"
              onClick={() => formatAlign('left')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 ${alignment === 'left' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              <AlignLeft size={14} /> Gauche
            </button>
            <button
              type="button"
              onClick={() => formatAlign('center')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 ${alignment === 'center' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              <AlignCenter size={14} /> Centre
            </button>
            <button
              type="button"
              onClick={() => formatAlign('right')}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 ${alignment === 'right' ? 'bg-blue-50 text-blue-600' : ''}`}
            >
              <AlignRight size={14} /> Droite
            </button>
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Insert variable dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowVariables(!showVariables);
          }}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus size={12} /> Variable
        </button>
        {showVariables && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] py-1 max-h-[200px] overflow-y-auto">
            {DYNAMIC_VARIABLES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => insertVariable(v.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex flex-col"
              >
                <span className="font-medium text-gray-900">{v.label}</span>
                <span className="text-xs text-gray-500">{`{${v.id}}`}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Plugin to initialize editor content
 */
function InitialContentPlugin({ content }: { content?: string }): null {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (content && !initialized) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(content));
        root.append(paragraph);
      });
      setInitialized(true);
    }
  }, [editor, content, initialized]);

  return null;
}

/**
 * MiniRichEditor - Compact rich text editor with toolbar
 */
export function MiniRichEditor({
  initialContent,
  placeholder = 'Saisir le contenu...',
  onChange,
  className = '',
  minHeight = 100,
  label,
}: MiniRichEditorProps): JSX.Element {
  // Use React's useId for stable namespace across renders
  const id = useId();
  const namespace = `MiniEditor-${id.replace(/:/g, '-')}`;

  const handleChange = useCallback(
    (editorState: EditorState, _editor: LexicalEditor) => {
      onChange?.(editorState.toJSON());
    },
    [onChange]
  );

  return (
    <div className={`mini-rich-editor ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <LexicalComposer initialConfig={createMiniEditorConfig(namespace)}>
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Toolbar */}
          <MiniToolbar />

          {/* Editor content area */}
          <div className="relative" style={{ minHeight }}>
            <RichTextPlugin
              contentEditable={
                <ContentEditable
                  className="outline-none p-3 text-sm text-gray-800 prose prose-sm max-w-none"
                  style={{ minHeight }}
                />
              }
              placeholder={
                <div className="absolute top-0 left-0 p-3 text-sm text-gray-400 pointer-events-none">
                  {placeholder}
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
          </div>

          {/* Plugins */}
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          {initialContent && <InitialContentPlugin content={initialContent} />}
          {onChange && <OnChangePlugin onChange={handleChange} />}
        </div>
      </LexicalComposer>
    </div>
  );
}

export default MiniRichEditor;
