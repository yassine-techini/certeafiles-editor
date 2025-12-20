/**
 * AtMenuPlugin - Plugin for "@" mention menu
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useEffect, useCallback, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  TextNode,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';

import { AtMenu } from '../components/Shortcuts/AtMenu';
import { $createMentionNode, INSERT_MENTION_COMMAND } from '../nodes/MentionNode';
import type { MentionType, MentionData } from '../types/mention';

export interface AtMenuPluginProps {
  /** Whether plugin is enabled */
  enabled?: boolean | undefined;
  /** Trigger character (default: "@") */
  trigger?: string | undefined;
  /** Function to fetch mention suggestions */
  fetchSuggestions?: ((query: string, type?: MentionType) => Promise<MentionData[]>) | undefined;
  /** Static list of internal links */
  internalLinks?: MentionData[] | undefined;
  /** Static list of annex links */
  annexLinks?: MentionData[] | undefined;
  /** Static list of external documents */
  externalDocuments?: MentionData[] | undefined;
  /** Static list of users (if not using fetchSuggestions) */
  users?: MentionData[] | undefined;
  /** Static list of products (if not using fetchSuggestions) */
  products?: MentionData[] | undefined;
  /** Static list of documents (if not using fetchSuggestions) - backward compatibility */
  documents?: MentionData[] | undefined;
  /** Static list of anchors (if not using fetchSuggestions) - backward compatibility */
  anchors?: MentionData[] | undefined;
  /** Max results to show */
  maxResults?: number | undefined;
}

/**
 * Default mock data for development
 * Per specifications:
 * - lien interne au document
 * - lien vers annexe
 * - lien vers document externe
 * - lien vers utilisateur (filtré par étapes/compétences, puis autres utilisateurs)
 * - lien vers produit en cours
 */

// Liens internes au document
const DEFAULT_INTERNAL_LINKS: MentionData[] = [
  { id: 'internal-1', name: 'Section 1.2 - Introduction', type: 'internal_link', description: 'Lien vers section' },
  { id: 'internal-2', name: 'Section 2.3 - Procédures', type: 'internal_link', description: 'Lien vers section' },
  { id: 'internal-3', name: 'Section 4.1 - Validation', type: 'internal_link', description: 'Lien vers section' },
];

// Liens vers annexes
const DEFAULT_ANNEX_LINKS: MentionData[] = [
  { id: 'annex-1', name: 'Annexe A - Spécifications techniques', type: 'annex_link', description: 'Document annexe' },
  { id: 'annex-2', name: 'Annexe B - Résultats des tests', type: 'annex_link', description: 'Document annexe' },
  { id: 'annex-3', name: 'Annexe C - Formulaires', type: 'annex_link', description: 'Document annexe' },
];

// Liens vers documents externes
const DEFAULT_EXTERNAL_DOCS: MentionData[] = [
  { id: 'ext-1', name: 'ISO 13485:2016', type: 'external_document', description: 'Norme externe' },
  { id: 'ext-2', name: 'Règlement 2017/745 MDR', type: 'external_document', description: 'Règlement européen' },
  { id: 'ext-3', name: 'IEC 62304', type: 'external_document', description: 'Norme logiciel médical' },
];

// Utilisateurs - prioritaires (assignés à l'étape/compétence)
const DEFAULT_USERS: MentionData[] = [
  { id: 'user-1', name: 'Dr. Martin Dupont', type: 'user', email: 'martin@example.com', isPriority: true, description: 'Responsable Qualité - Assigné à cette étape' },
  { id: 'user-2', name: 'Sophie Bernard', type: 'user', email: 'sophie@example.com', isPriority: true, description: 'Ingénieure R&D - Compétence requise' },
  // Autres utilisateurs (non prioritaires - affichés en couleur différente)
  { id: 'user-3', name: 'Jean Lambert', type: 'user', email: 'jean@example.com', isPriority: false, description: 'Directeur Technique' },
  { id: 'user-4', name: 'Marie Petit', type: 'user', email: 'marie@example.com', isPriority: false, description: 'Responsable Production' },
  { id: 'user-5', name: 'Pierre Durand', type: 'user', email: 'pierre@example.com', isPriority: false, description: 'Analyste' },
];

// Produits en cours
const DEFAULT_PRODUCTS: MentionData[] = [
  { id: 'prod-1', name: 'Dispositif médical XR-100', type: 'product', description: 'Produit en cours' },
  { id: 'prod-2', name: 'Module capteur SC-50', type: 'product', description: 'Composant principal' },
  { id: 'prod-3', name: 'Software embarqué v2.0', type: 'product', description: 'Logiciel associé' },
];

// Backward compatibility - anciens types
const DEFAULT_DOCUMENTS: MentionData[] = [
  { id: 'doc-1', name: 'Cahier des charges', type: 'document', description: 'v2.1' },
];

const DEFAULT_ANCHORS: MentionData[] = [
  { id: 'anchor-1', name: 'Introduction', type: 'anchor', description: 'Section 1' },
];

/**
 * Get cursor position in the editor
 */
function getCursorPosition(): { top: number; left: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return {
    top: rect.bottom + window.scrollY + 4,
    left: rect.left + window.scrollX,
  };
}

/**
 * Filter and sort mention items
 */
function filterMentions(
  items: MentionData[],
  query: string,
  maxResults: number
): { filtered: MentionData[]; grouped: Map<MentionType, MentionData[]> } {
  const lowerQuery = query.toLowerCase();

  // Filter by query
  const filtered = items.filter((item) => {
    if (!query) return true;
    return (
      item.name.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery) ||
      item.email?.toLowerCase().includes(lowerQuery)
    );
  });

  // Sort: priority items first, then alphabetically
  filtered.sort((a, b) => {
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return a.name.localeCompare(b.name);
  });

  // Limit results
  const limited = filtered.slice(0, maxResults);

  // Group by type
  const grouped = new Map<MentionType, MentionData[]>();
  for (const item of limited) {
    const group = grouped.get(item.type) || [];
    group.push(item);
    grouped.set(item.type, group);
  }

  return { filtered: limited, grouped };
}

/**
 * AtMenuPlugin - Detects "@" and shows mention menu
 */
export function AtMenuPlugin({
  enabled = true,
  trigger = '@',
  fetchSuggestions,
  internalLinks = DEFAULT_INTERNAL_LINKS,
  annexLinks = DEFAULT_ANNEX_LINKS,
  externalDocuments = DEFAULT_EXTERNAL_DOCS,
  users = DEFAULT_USERS,
  products = DEFAULT_PRODUCTS,
  documents = DEFAULT_DOCUMENTS,
  anchors = DEFAULT_ANCHORS,
  maxResults = 15,
}: AtMenuPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  // Menu state
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [triggerNodeKey, setTriggerNodeKey] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<MentionData[]>([]);

  // Combine all static items (in order of display priority)
  const allItems = useMemo(() => {
    return [...internalLinks, ...annexLinks, ...externalDocuments, ...users, ...products, ...documents, ...anchors];
  }, [internalLinks, annexLinks, externalDocuments, users, products, documents, anchors]);

  // Filter and group items
  const { filtered: filteredItems, grouped: groupedItems } = useMemo(() => {
    const items = fetchSuggestions ? suggestions : allItems;
    return filterMentions(items, query, maxResults);
  }, [fetchSuggestions, suggestions, allItems, query, maxResults]);

  // Fetch suggestions when query changes (if using fetchSuggestions)
  useEffect(() => {
    if (!isOpen || !fetchSuggestions) return;

    const fetchData = async () => {
      try {
        const results = await fetchSuggestions(query);
        setSuggestions(results);
      } catch (error) {
        console.error('[AtMenuPlugin] Failed to fetch suggestions:', error);
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchData, 150);
    return () => clearTimeout(timeoutId);
  }, [isOpen, query, fetchSuggestions]);

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query]);

  /**
   * Handle item selection
   */
  const handleSelect = useCallback(
    (item: MentionData) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Remove the trigger text and query
        if (triggerNodeKey) {
          const anchorNode = selection.anchor.getNode();
          if (anchorNode instanceof TextNode) {
            const text = anchorNode.getTextContent();
            const triggerIndex = text.lastIndexOf(trigger);
            if (triggerIndex !== -1) {
              // Remove from trigger to current position
              const beforeTrigger = text.slice(0, triggerIndex);
              anchorNode.setTextContent(beforeTrigger);
              selection.anchor.set(anchorNode.getKey(), beforeTrigger.length, 'text');
              selection.focus.set(anchorNode.getKey(), beforeTrigger.length, 'text');
            }
          }
        }

        // Insert the mention node
        const mentionNode = $createMentionNode({
          mentionId: item.id,
          mentionType: item.type,
          name: item.name,
          avatarUrl: item.avatarUrl,
          metadata: item.metadata,
        });

        selection.insertNodes([mentionNode]);

        // Insert a space after the mention
        const spaceNode = new TextNode(' ');
        mentionNode.insertAfter(spaceNode);
        spaceNode.select();
      });

      // Close menu
      setIsOpen(false);
      setQuery('');
      setTriggerNodeKey(null);
    },
    [editor, trigger, triggerNodeKey]
  );

  /**
   * Close the menu
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setTriggerNodeKey(null);
    setSuggestions([]);
  }, []);

  /**
   * Navigation functions
   */
  const moveUp = useCallback(() => {
    setSelectedIndex((current) =>
      current > 0 ? current - 1 : filteredItems.length - 1
    );
  }, [filteredItems.length]);

  const moveDown = useCallback(() => {
    setSelectedIndex((current) =>
      current < filteredItems.length - 1 ? current + 1 : 0
    );
  }, [filteredItems.length]);

  const selectCurrent = useCallback(() => {
    if (filteredItems.length > 0 && selectedIndex < filteredItems.length) {
      handleSelect(filteredItems[selectedIndex]);
    }
  }, [filteredItems, selectedIndex, handleSelect]);

  /**
   * Detect "@" trigger and track query
   */
  useEffect(() => {
    if (!enabled) return;

    const removeListener = editor.registerTextContentListener(() => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          if (isOpen) handleClose();
          return;
        }

        const anchorNode = selection.anchor.getNode();
        if (!(anchorNode instanceof TextNode)) {
          if (isOpen) handleClose();
          return;
        }

        const textContent = anchorNode.getTextContent();
        const anchorOffset = selection.anchor.offset;
        const textBeforeCursor = textContent.slice(0, anchorOffset);

        // Find the trigger
        const triggerIndex = textBeforeCursor.lastIndexOf(trigger);

        // Check if trigger is at word boundary (start of line or after space)
        const isValidTrigger =
          triggerIndex !== -1 &&
          (triggerIndex === 0 || textBeforeCursor[triggerIndex - 1] === ' ');

        if (isValidTrigger) {
          const currentQuery = textBeforeCursor.slice(triggerIndex + trigger.length);

          // Don't trigger if there's a space in the query (mention ended)
          if (currentQuery.includes(' ')) {
            if (isOpen) handleClose();
            return;
          }

          setQuery(currentQuery);
          setTriggerNodeKey(anchorNode.getKey());

          if (!isOpen) {
            const pos = getCursorPosition();
            if (pos) {
              setPosition(pos);
              setIsOpen(true);
            }
          }
        } else if (isOpen) {
          handleClose();
        }
      });
    });

    return removeListener;
  }, [editor, enabled, isOpen, trigger, handleClose]);

  /**
   * Handle keyboard navigation
   */
  useEffect(() => {
    if (!isOpen || !enabled) return;

    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_DOWN_COMMAND,
        (event) => {
          event.preventDefault();
          moveDown();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ARROW_UP_COMMAND,
        (event) => {
          event.preventDefault();
          moveUp();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event) => {
          if (filteredItems.length > 0) {
            event?.preventDefault();
            selectCurrent();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event) => {
          if (filteredItems.length > 0) {
            event.preventDefault();
            selectCurrent();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          handleClose();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [
    editor,
    enabled,
    isOpen,
    filteredItems.length,
    moveUp,
    moveDown,
    selectCurrent,
    handleClose,
  ]);

  /**
   * Register INSERT_MENTION_COMMAND handler
   */
  useEffect(() => {
    return editor.registerCommand(
      INSERT_MENTION_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const mentionNode = $createMentionNode(payload);
          selection.insertNodes([mentionNode]);

          // Insert a space after
          const spaceNode = new TextNode(' ');
          mentionNode.insertAfter(spaceNode);
          spaceNode.select();
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  /**
   * Close menu on click outside
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.at-menu')) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Render menu in portal
  return createPortal(
    <div className="at-menu">
      <AtMenu
        items={filteredItems}
        groupedItems={groupedItems}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        onHover={setSelectedIndex}
        position={position}
        query={query}
      />
    </div>,
    document.body
  );
}

export default AtMenuPlugin;
