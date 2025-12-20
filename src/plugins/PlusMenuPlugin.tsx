/**
 * PlusMenuPlugin - Plugin for "+" dynamic fields menu
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

import { PlusMenu, type PlusMenuItem } from '../components/Shortcuts/PlusMenu';
import { $createDynamicFieldNode, INSERT_DYNAMIC_FIELD_COMMAND } from '../nodes/DynamicFieldNode';
import {
  DYNAMIC_FIELD_LABELS,
  FIELD_CATEGORY_MAP,
  FIELD_CONTEXT,
} from '../types/dynamicField';

export interface PlusMenuPluginProps {
  /** Whether plugin is enabled */
  enabled?: boolean | undefined;
  /** Trigger character (default: "+") */
  trigger?: string | undefined;
  /** Max results to show */
  maxResults?: number | undefined;
}

/**
 * All available dynamic field items
 */
const ALL_PLUS_ITEMS: PlusMenuItem[] = [
  // Pagination
  {
    id: 'page_number',
    fieldType: 'page_number',
    label: DYNAMIC_FIELD_LABELS.page_number,
    description: 'Numéro de la page courante',
    preview: '1',
    category: 'PAGE',
  },
  {
    id: 'total_pages',
    fieldType: 'total_pages',
    label: DYNAMIC_FIELD_LABELS.total_pages,
    description: 'Nombre total de pages',
    preview: '10',
    category: 'PAGE',
  },
  {
    id: 'page_of_total',
    fieldType: 'page_of_total',
    label: DYNAMIC_FIELD_LABELS.page_of_total,
    description: 'Page X sur Y',
    preview: '1/10',
    category: 'PAGE',
  },

  // Date & Time
  {
    id: 'date',
    fieldType: 'date',
    label: DYNAMIC_FIELD_LABELS.date,
    description: 'Date actuelle',
    preview: '17/12/25',
    category: 'DATE',
  },
  {
    id: 'time',
    fieldType: 'time',
    label: DYNAMIC_FIELD_LABELS.time,
    description: 'Heure actuelle',
    preview: '14:30',
    category: 'DATE',
  },
  {
    id: 'datetime',
    fieldType: 'datetime',
    label: DYNAMIC_FIELD_LABELS.datetime,
    description: 'Date et heure actuelles',
    preview: '17/12 14:30',
    category: 'DATE',
  },
  {
    id: 'last_modified',
    fieldType: 'last_modified',
    label: DYNAMIC_FIELD_LABELS.last_modified,
    description: 'Date de dernière modification',
    preview: '17/12/25',
    category: 'DATE',
  },

  // Document
  {
    id: 'version',
    fieldType: 'version',
    label: DYNAMIC_FIELD_LABELS.version,
    description: 'Version du document',
    preview: 'v1.0',
    category: 'DOCUMENT',
    config: { customFormat: '1.0' },
  },
  {
    id: 'title',
    fieldType: 'title',
    label: DYNAMIC_FIELD_LABELS.title,
    description: 'Titre du document',
    preview: 'Titre',
    category: 'DOCUMENT',
  },
  {
    id: 'author',
    fieldType: 'author',
    label: DYNAMIC_FIELD_LABELS.author,
    description: 'Auteur du document',
    preview: 'Auteur',
    category: 'DOCUMENT',
    config: { customFormat: 'Auteur' },
  },
  {
    id: 'filename',
    fieldType: 'filename',
    label: DYNAMIC_FIELD_LABELS.filename,
    description: 'Nom du fichier',
    preview: 'doc.pdf',
    category: 'DOCUMENT',
    config: { customFormat: 'document.pdf' },
  },

  // Media
  {
    id: 'logo',
    fieldType: 'logo',
    label: DYNAMIC_FIELD_LABELS.logo,
    description: 'Logo de l\'entreprise',
    preview: '[Logo]',
    category: 'MEDIA',
    config: { logoHeight: 24 },
  },
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
 * Detect current context (header, footer, or body)
 */
function detectContext(): 'header' | 'footer' | 'body' {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 'body';

  let element = selection.anchorNode as HTMLElement | null;
  while (element) {
    if (element.classList?.contains('header-content') || element.hasAttribute?.('data-header-id')) {
      return 'header';
    }
    if (element.classList?.contains('footer-content') || element.hasAttribute?.('data-footer-id')) {
      return 'footer';
    }
    element = element.parentElement;
  }

  return 'body';
}

/**
 * Filter items based on context and query
 */
function filterItems(
  items: PlusMenuItem[],
  query: string,
  context: 'header' | 'footer' | 'body',
  maxResults: number
): { filtered: PlusMenuItem[]; grouped: Map<string, PlusMenuItem[]> } {
  const lowerQuery = query.toLowerCase();

  // Filter by context availability and query
  const filtered = items.filter((item) => {
    const contextAllowed = FIELD_CONTEXT[item.fieldType][context];
    if (!contextAllowed) return false;

    if (!query) return true;
    return (
      item.label.toLowerCase().includes(lowerQuery) ||
      item.description.toLowerCase().includes(lowerQuery) ||
      item.fieldType.toLowerCase().includes(lowerQuery)
    );
  });

  // Limit results
  const limited = filtered.slice(0, maxResults);

  // Group by category
  const grouped = new Map<string, PlusMenuItem[]>();
  for (const item of limited) {
    const category = FIELD_CATEGORY_MAP[item.fieldType];
    const group = grouped.get(category) || [];
    group.push(item);
    grouped.set(category, group);
  }

  return { filtered: limited, grouped };
}

/**
 * PlusMenuPlugin - Detects "+" and shows dynamic fields menu
 */
export function PlusMenuPlugin({
  enabled = true,
  trigger = '+',
  maxResults = 15,
}: PlusMenuPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  // Menu state
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [triggerNodeKey, setTriggerNodeKey] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [context, setContext] = useState<'header' | 'footer' | 'body'>('body');

  // Filter items based on context and query
  const { filtered: filteredItems, grouped: groupedItems } = useMemo(() => {
    return filterItems(ALL_PLUS_ITEMS, query, context, maxResults);
  }, [query, context, maxResults]);

  // Reset selected index when filtered items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length, query]);

  /**
   * Handle item selection
   */
  const handleSelect = useCallback(
    (item: PlusMenuItem) => {
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

        // Insert the dynamic field node
        const fieldNode = $createDynamicFieldNode({
          fieldType: item.fieldType,
          config: item.config,
        });

        selection.insertNodes([fieldNode]);

        // Insert a space after the field
        const spaceNode = new TextNode(' ');
        fieldNode.insertAfter(spaceNode);
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
   * Detect "+" trigger and track query
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

          // Don't trigger if there's a space in the query (field name ended)
          if (currentQuery.includes(' ')) {
            if (isOpen) handleClose();
            return;
          }

          setQuery(currentQuery);
          setTriggerNodeKey(anchorNode.getKey());
          setContext(detectContext());

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
   * Register INSERT_DYNAMIC_FIELD_COMMAND handler
   */
  useEffect(() => {
    return editor.registerCommand(
      INSERT_DYNAMIC_FIELD_COMMAND,
      (payload) => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const fieldNode = $createDynamicFieldNode(payload);
          selection.insertNodes([fieldNode]);

          // Insert a space after
          const spaceNode = new TextNode(' ');
          fieldNode.insertAfter(spaceNode);
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
      if (!target.closest('.plus-menu')) {
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
    <div className="plus-menu">
      <PlusMenu
        items={filteredItems}
        groupedItems={groupedItems}
        selectedIndex={selectedIndex}
        onSelect={handleSelect}
        onHover={setSelectedIndex}
        position={position}
        query={query}
        context={context}
      />
    </div>,
    document.body
  );
}

export default PlusMenuPlugin;
