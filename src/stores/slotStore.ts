/**
 * Slot Store - Zustand state management for slots (dynamic variables)
 * Per Constitution Section 5 - Slots & Dynamic Variables
 */
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  type Slot,
  type SlotType,
  type SlotMetadata,
  type SlotValidationResult,
  createSlot,
} from '../types/slot';

/**
 * Slot store state interface
 */
export interface SlotState {
  // All slots in the document
  slots: Map<string, Slot>;

  // Computed helpers
  getSlot: (id: string) => Slot | undefined;
  getSlotsByType: (type: SlotType) => Slot[];
  getSlotByStartKey: (nodeKey: string) => Slot | undefined;
  getSlotByEndKey: (nodeKey: string) => Slot | undefined;
  getAllSlots: () => Slot[];

  // Actions
  insertSlot: (
    type: SlotType,
    startKey: string,
    endKey: string,
    metadata?: Partial<SlotMetadata>
  ) => string;
  removeSlot: (id: string) => void;
  updateSlot: (id: string, updates: Partial<Omit<Slot, 'id' | 'type' | 'createdAt'>>) => void;
  updateSlotMetadata: (id: string, metadata: Partial<SlotMetadata>) => void;
  setSlotValue: (id: string, value: string) => void;
  clearSlotValue: (id: string) => void;

  // Node key management
  updateStartKey: (id: string, nodeKey: string) => void;
  updateEndKey: (id: string, nodeKey: string) => void;

  // Validation
  validateSlots: () => SlotValidationResult;

  // Bulk actions
  clear: () => void;
  removeOrphanedSlots: () => void;
}

/**
 * Create the slot store
 */
export const useSlotStore = create<SlotState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      slots: new Map<string, Slot>(),

      // Computed helpers
      getSlot: (id: string) => get().slots.get(id),

      getSlotsByType: (type: SlotType) => {
        const slots: Slot[] = [];
        for (const slot of get().slots.values()) {
          if (slot.type === type) {
            slots.push(slot);
          }
        }
        return slots;
      },

      getSlotByStartKey: (nodeKey: string) => {
        for (const slot of get().slots.values()) {
          if (slot.startKey === nodeKey) {
            return slot;
          }
        }
        return undefined;
      },

      getSlotByEndKey: (nodeKey: string) => {
        for (const slot of get().slots.values()) {
          if (slot.endKey === nodeKey) {
            return slot;
          }
        }
        return undefined;
      },

      getAllSlots: () => Array.from(get().slots.values()),

      // Actions
      insertSlot: (type, startKey, endKey, metadata) => {
        const id = uuidv4();
        const slot = createSlot(id, type, startKey, endKey, metadata);

        set((state) => {
          const newSlots = new Map(state.slots);
          newSlots.set(id, slot);
          return { slots: newSlots };
        });

        console.log('[SlotStore] Inserted slot:', id, type);
        return id;
      },

      removeSlot: (id) => {
        set((state) => {
          const newSlots = new Map(state.slots);
          newSlots.delete(id);
          return { slots: newSlots };
        });

        console.log('[SlotStore] Removed slot:', id);
      },

      updateSlot: (id, updates) => {
        set((state) => {
          const slot = state.slots.get(id);
          if (!slot) return state;

          const newSlots = new Map(state.slots);
          newSlots.set(id, {
            ...slot,
            ...updates,
            updatedAt: new Date(),
          });
          return { slots: newSlots };
        });
      },

      updateSlotMetadata: (id, metadata) => {
        set((state) => {
          const slot = state.slots.get(id);
          if (!slot) return state;

          const newSlots = new Map(state.slots);
          newSlots.set(id, {
            ...slot,
            metadata: {
              ...slot.metadata,
              ...metadata,
            },
            updatedAt: new Date(),
          });
          return { slots: newSlots };
        });
      },

      setSlotValue: (id, value) => {
        set((state) => {
          const slot = state.slots.get(id);
          if (!slot) return state;

          const newSlots = new Map(state.slots);
          newSlots.set(id, {
            ...slot,
            value,
            isFilled: true,
            updatedAt: new Date(),
          });
          return { slots: newSlots };
        });

        console.log('[SlotStore] Set slot value:', id);
      },

      clearSlotValue: (id) => {
        set((state) => {
          const slot = state.slots.get(id);
          if (!slot) return state;

          const newSlots = new Map(state.slots);
          newSlots.set(id, {
            ...slot,
            value: undefined,
            isFilled: false,
            updatedAt: new Date(),
          });
          return { slots: newSlots };
        });

        console.log('[SlotStore] Cleared slot value:', id);
      },

      // Node key management
      updateStartKey: (id, nodeKey) => {
        set((state) => {
          const slot = state.slots.get(id);
          if (!slot) return state;

          const newSlots = new Map(state.slots);
          newSlots.set(id, {
            ...slot,
            startKey: nodeKey,
            updatedAt: new Date(),
          });
          return { slots: newSlots };
        });
      },

      updateEndKey: (id, nodeKey) => {
        set((state) => {
          const slot = state.slots.get(id);
          if (!slot) return state;

          const newSlots = new Map(state.slots);
          newSlots.set(id, {
            ...slot,
            endKey: nodeKey,
            updatedAt: new Date(),
          });
          return { slots: newSlots };
        });
      },

      // Validation
      validateSlots: () => {
        const { slots } = get();
        const result: SlotValidationResult = {
          isValid: true,
          missingEndMarkers: [],
          missingStartMarkers: [],
          orphanedMarkers: [],
          requiredUnfilled: [],
        };

        // Check each slot
        for (const slot of slots.values()) {
          // Check for missing markers
          if (!slot.startKey) {
            result.missingStartMarkers.push(slot.id);
            result.isValid = false;
          }

          if (!slot.endKey) {
            result.missingEndMarkers.push(slot.id);
            result.isValid = false;
          }

          // Check required slots
          if (slot.metadata.required && !slot.isFilled) {
            result.requiredUnfilled.push(slot.id);
            result.isValid = false;
          }
        }

        console.log('[SlotStore] Validation result:', result);
        return result;
      },

      // Bulk actions
      clear: () => {
        set({ slots: new Map() });
        console.log('[SlotStore] Cleared all slots');
      },

      removeOrphanedSlots: () => {
        set((state) => {
          const newSlots = new Map<string, Slot>();

          for (const [id, slot] of state.slots) {
            // Keep only slots with both start and end keys
            if (slot.startKey && slot.endKey) {
              newSlots.set(id, slot);
            } else {
              console.log('[SlotStore] Removing orphaned slot:', id);
            }
          }

          return { slots: newSlots };
        });
      },
    })),
    { name: 'slot-store' }
  )
);

/**
 * Selector hooks for common use cases
 */
export const useSlot = (id: string) =>
  useSlotStore((state) => state.getSlot(id));

export const useSlotsByType = (type: SlotType) =>
  useSlotStore((state) => state.getSlotsByType(type));

export const useAllSlots = () =>
  useSlotStore((state) => state.getAllSlots());

export default useSlotStore;
