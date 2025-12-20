/**
 * SlashMenuPlugin - Plugin for "/" command menu
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  KEY_TAB_COMMAND,
  TextNode,
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createQuoteNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { mergeRegister } from '@lexical/utils';

import { SlashMenu } from '../components/Shortcuts/SlashMenu';
import { useTypeahead } from '../hooks/useTypeahead';
import { SLASH_MENU_ITEMS, type SlashMenuItem } from '../types/slashMenu';
import { INSERT_IMAGE_COMMAND } from '../nodes/ImageNode';
import { OPEN_TABLE_DIALOG_COMMAND } from './TablePlugin';
import { INSERT_SLOT_COMMAND } from './SlotPlugin';
import { CREATE_COMMENT_COMMAND } from './CommentPlugin';
import { INSERT_SPECIAL_TABLE_COMMAND } from './SpecialTablePlugin';
import { INSERT_FOOTNOTE_COMMAND } from './FootnotePlugin';
import { OPEN_SYMBOL_PICKER_COMMAND } from './SymbolPickerPlugin';
import { OPEN_QUERY_BUILDER_COMMAND } from './QueryBuilderPlugin';
import type { SlotType } from '../types/slot';
import type { CommentType } from '../types/comment';
import type { SpecialTablePayloadType } from '../types/slashMenu';

export interface SlashMenuPluginProps {
  /** Custom menu items (overrides default) */
  items?: SlashMenuItem[] | undefined;
  /** Whether plugin is enabled */
  enabled?: boolean | undefined;
  /** Trigger character (default: "/") */
  trigger?: string | undefined;
}

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
 * SlashMenuPlugin - Detects "/" and shows command menu
 */
export function SlashMenuPlugin({
  items = SLASH_MENU_ITEMS,
  enabled = true,
  trigger = '/',
}: SlashMenuPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  // Menu state
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [triggerNodeKey, setTriggerNodeKey] = useState<string | null>(null);

  /**
   * Handle item selection
   */
  const handleSelect = useCallback(
    (item: SlashMenuItem) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Remove the trigger text and query
        if (triggerNodeKey) {
          // Find and remove the slash command text
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

        // Execute the action
        switch (item.actionType) {
          case 'insert_slot': {
            const payload = item.payload;
            if (payload?.type === 'slot') {
              editor.dispatchCommand(INSERT_SLOT_COMMAND, {
                type: payload.slotType as SlotType,
                metadata: { label: item.label },
              });
            }
            break;
          }

          case 'insert_heading': {
            const payload = item.payload;
            if (payload?.type === 'heading') {
              const headingNode = $createHeadingNode(`h${payload.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
              selection.insertNodes([headingNode]);
            }
            break;
          }

          case 'insert_list': {
            const payload = item.payload;
            if (payload?.type === 'list') {
              switch (payload.listType) {
                case 'bullet':
                  editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
                  break;
                case 'number':
                  editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
                  break;
                case 'check':
                  editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
                  break;
              }
            }
            break;
          }

          case 'insert_table': {
            editor.dispatchCommand(OPEN_TABLE_DIALOG_COMMAND, undefined);
            break;
          }

          case 'insert_special_table': {
            const payload = item.payload;
            if (payload?.type === 'special_table') {
              editor.dispatchCommand(INSERT_SPECIAL_TABLE_COMMAND, {
                tableType: payload.tableType as SpecialTablePayloadType,
              });
            }
            break;
          }

          case 'insert_image': {
            // Trigger file picker
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.onload = () => {
                const src = reader.result as string;
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                  src,
                  altText: file.name,
                });
              };
              reader.readAsDataURL(file);
            };
            input.click();
            break;
          }

          case 'insert_divider': {
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
            break;
          }

          case 'insert_quote': {
            const quoteNode = $createQuoteNode();
            selection.insertNodes([quoteNode]);
            break;
          }

          case 'insert_code': {
            // Insert a paragraph with code formatting for now
            const paragraph = $createParagraphNode();
            selection.insertNodes([paragraph]);
            break;
          }

          case 'insert_comment': {
            const payload = item.payload;
            const commentType: CommentType = payload?.type === 'comment' && payload.commentType
              ? payload.commentType
              : 'remark';
            const content = window.prompt('Enter your comment:');
            if (content) {
              editor.dispatchCommand(CREATE_COMMENT_COMMAND, {
                content,
                type: commentType,
              });
            }
            break;
          }

          case 'insert_page_break': {
            // Insert a horizontal rule as page break indicator
            editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined);
            break;
          }

          case 'insert_footnote': {
            // Insert a footnote
            editor.dispatchCommand(INSERT_FOOTNOTE_COMMAND, {});
            break;
          }

          case 'insert_symbol': {
            // Open the symbol picker
            editor.dispatchCommand(OPEN_SYMBOL_PICKER_COMMAND, undefined);
            break;
          }

          case 'open_query_builder': {
            // Open the query builder
            editor.dispatchCommand(OPEN_QUERY_BUILDER_COMMAND, {});
            break;
          }
        }
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

  // Use typeahead hook
  const {
    filteredItems,
    groupedItems,
    selectedIndex,
    setSelectedIndex,
    moveUp,
    moveDown,
    selectCurrent,
    hasResults,
  } = useTypeahead({
    items,
    query,
    onSelect: handleSelect,
    onClose: handleClose,
    maxResults: 15,
  });

  /**
   * Detect "/" trigger and track query
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

          // Don't trigger if there's a space in the query (command ended)
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
          if (hasResults) {
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
          if (hasResults) {
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
    hasResults,
    moveUp,
    moveDown,
    selectCurrent,
    handleClose,
  ]);

  /**
   * Close menu on click outside
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.slash-menu')) {
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
    <div className="slash-menu">
      <SlashMenu
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

export default SlashMenuPlugin;
