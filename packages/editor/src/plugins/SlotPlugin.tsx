/**
 * SlotPlugin - Plugin for managing slot insertion and validation
 * Per Constitution Section 5 - Slots & Dynamic Variables
 */
import { useEffect, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $getRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { v4 as uuidv4 } from 'uuid';
import {
  $createSlotNode,
  $isSlotNode,
} from '../nodes/SlotNode';
import { useSlotStore } from '../stores/slotStore';
import type { SlotType, SlotMetadata, SlotValidationResult } from '../types/slot';

/**
 * Command to insert a slot at the current selection
 */
export const INSERT_SLOT_COMMAND: LexicalCommand<{
  type: SlotType;
  metadata?: SlotMetadata;
}> = createCommand('INSERT_SLOT_COMMAND');

/**
 * Command to remove a slot by ID
 */
export const REMOVE_SLOT_COMMAND: LexicalCommand<{
  slotId: string;
}> = createCommand('REMOVE_SLOT_COMMAND');

/**
 * Command to validate all slots
 */
export const VALIDATE_SLOTS_COMMAND: LexicalCommand<void> = createCommand(
  'VALIDATE_SLOTS_COMMAND'
);

export interface SlotPluginProps {
  /** Whether to validate on save */
  validateOnSave?: boolean;
  /** Callback when validation fails */
  onValidationError?: (result: SlotValidationResult) => void;
}

/**
 * SlotPlugin - Manages slot insertion, removal, and validation
 */
export function SlotPlugin({
  onValidationError,
}: SlotPluginProps): null {
  const [editor] = useLexicalComposerContext();

  // Store actions
  const insertSlotToStore = useSlotStore((state) => state.insertSlot);
  const removeSlotFromStore = useSlotStore((state) => state.removeSlot);
  const validateSlots = useSlotStore((state) => state.validateSlots);

  /**
   * Insert a slot pair (start and end markers) at the current selection
   */
  const handleInsertSlot = useCallback(
    (type: SlotType, metadata?: SlotMetadata) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          console.warn('[SlotPlugin] Cannot insert slot: no range selection');
          return;
        }

        const slotId = uuidv4();

        // Create start marker
        const startNode = $createSlotNode({
          slotId,
          slotType: type,
          role: 'start',
          metadata: metadata ?? {},
        });

        // Create end marker
        const endNode = $createSlotNode({
          slotId,
          slotType: type,
          role: 'end',
          metadata: metadata ?? {},
        });

        // Insert both markers at the cursor position
        // For simplicity, always insert at current position
        selection.insertNodes([startNode, endNode]);

        // Register in store
        const startKey = startNode.getKey();
        const endKey = endNode.getKey();
        insertSlotToStore(type, startKey, endKey, metadata);

        console.log('[SlotPlugin] Inserted slot:', slotId, type);
      });
    },
    [editor, insertSlotToStore]
  );

  /**
   * Remove a slot and its markers
   */
  const handleRemoveSlot = useCallback(
    (slotId: string) => {
      editor.update(() => {
        const root = $getRoot();

        // Find and remove all slot nodes with this ID
        const traverse = (node: ReturnType<typeof root.getChildren>[number]) => {
          if ($isSlotNode(node) && node.getSlotId() === slotId) {
            node.remove();
          }

          if ('getChildren' in node && typeof node.getChildren === 'function') {
            const children = node.getChildren();
            children.forEach(traverse);
          }
        };

        root.getChildren().forEach(traverse);

        // Remove from store
        removeSlotFromStore(slotId);

        console.log('[SlotPlugin] Removed slot:', slotId);
      });
    },
    [editor, removeSlotFromStore]
  );

  /**
   * Validate all slots and return result
   */
  const handleValidateSlots = useCallback((): SlotValidationResult => {
    const result = validateSlots();

    if (!result.isValid && onValidationError) {
      onValidationError(result);
    }

    return result;
  }, [validateSlots, onValidationError]);

  // Register commands
  useEffect(() => {
    return editor.registerCommand(
      INSERT_SLOT_COMMAND,
      (payload) => {
        handleInsertSlot(payload.type, payload.metadata);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, handleInsertSlot]);

  useEffect(() => {
    return editor.registerCommand(
      REMOVE_SLOT_COMMAND,
      (payload) => {
        handleRemoveSlot(payload.slotId);
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, handleRemoveSlot]);

  useEffect(() => {
    return editor.registerCommand(
      VALIDATE_SLOTS_COMMAND,
      () => {
        handleValidateSlots();
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor, handleValidateSlots]);

  return null;
}

export default SlotPlugin;
