/**
 * Slot Types - Dynamic variable system for document templates
 * Per Constitution Section 5 - Slots & Dynamic Variables
 */

/**
 * The 6 slot types supported by the system
 */
export type SlotType =
  | 'dynamic_content'   // Dynamic content replacement
  | 'at_fetcher'        // External data fetch via @mention
  | 'donnee'            // Data field binding
  | 'ancre'             // Anchor/reference point
  | 'section_speciale'  // Special section marker
  | 'commentaire';      // Comment/annotation

/**
 * Role of the slot marker (start or end of a slot region)
 */
export type SlotRole = 'start' | 'end';

/**
 * Slot metadata - varies by slot type
 */
export interface SlotMetadata {
  /** Display label for the slot */
  label?: string;
  /** Description/help text */
  description?: string;
  /** Whether this slot is required */
  required?: boolean;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text when empty */
  placeholder?: string;
  /** Source for at_fetcher slots */
  source?: string;
  /** Field path for donnee slots */
  field?: string;
  /** Anchor ID for ancre slots */
  anchorId?: string;
  /** Section type for section_speciale */
  sectionType?: string;
  /** Author for commentaire */
  author?: string;
  /** Timestamp for commentaire */
  timestamp?: Date;
  /** Resolution status for commentaire */
  resolved?: boolean;
}

/**
 * Complete slot definition
 */
export interface Slot {
  /** Unique identifier for the slot */
  id: string;
  /** Type of the slot */
  type: SlotType;
  /** Node key of the start marker */
  startKey: string;
  /** Node key of the end marker */
  endKey: string;
  /** Slot metadata */
  metadata: SlotMetadata;
  /** Current value (if filled) */
  value?: string | undefined;
  /** Whether the slot has been filled */
  isFilled: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Payload for creating a new slot
 */
export interface CreateSlotPayload {
  type: SlotType;
  metadata?: SlotMetadata;
}

/**
 * Slot validation result
 */
export interface SlotValidationResult {
  /** Whether all slots are valid */
  isValid: boolean;
  /** Slots with missing end markers */
  missingEndMarkers: string[];
  /** Slots with missing start markers */
  missingStartMarkers: string[];
  /** Orphaned markers (no matching pair) */
  orphanedMarkers: string[];
  /** Required slots that are not filled */
  requiredUnfilled: string[];
}

/**
 * Slot colors by type
 */
export const SLOT_COLORS: Record<SlotType, { bg: string; border: string; text: string }> = {
  dynamic_content: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
  at_fetcher: { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },
  donnee: { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
  ancre: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
  section_speciale: { bg: '#fce7f3', border: '#ec4899', text: '#be185d' },
  commentaire: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' },
};

/**
 * Slot type labels
 */
export const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  dynamic_content: 'Dynamic Content',
  at_fetcher: 'Data Fetcher',
  donnee: 'Data Field',
  ancre: 'Anchor',
  section_speciale: 'Special Section',
  commentaire: 'Comment',
};

/**
 * Slot type icons
 */
export const SLOT_TYPE_ICONS: Record<SlotType, string> = {
  dynamic_content: '{ }',
  at_fetcher: '@',
  donnee: 'D',
  ancre: '#',
  section_speciale: '[ ]',
  commentaire: '///',
};

/**
 * Create default metadata for a slot type
 */
export function createDefaultMetadata(
  type: SlotType,
  label?: string
): SlotMetadata {
  const base: SlotMetadata = {
    label: label || SLOT_TYPE_LABELS[type],
    required: false,
  };

  switch (type) {
    case 'dynamic_content':
      return {
        ...base,
        placeholder: 'Enter content...',
      };

    case 'at_fetcher':
      return {
        ...base,
        source: '',
        placeholder: '@source.field',
      };

    case 'donnee':
      return {
        ...base,
        field: '',
      };

    case 'ancre':
      return {
        ...base,
        anchorId: '',
      };

    case 'section_speciale':
      return {
        ...base,
        sectionType: 'default',
      };

    case 'commentaire':
      return {
        ...base,
        author: '',
        resolved: false,
      };

    default:
      return base;
  }
}

/**
 * Create a new slot with default values
 */
export function createSlot(
  id: string,
  type: SlotType,
  startKey: string,
  endKey: string,
  metadata?: Partial<SlotMetadata>
): Slot {
  const now = new Date();
  return {
    id,
    type,
    startKey,
    endKey,
    metadata: {
      ...createDefaultMetadata(type),
      ...metadata,
    },
    isFilled: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get display text for a slot marker
 */
export function getSlotMarkerText(
  type: SlotType,
  role: SlotRole,
  label?: string
): string {
  const icon = SLOT_TYPE_ICONS[type];
  const shortLabel = label ? ` ${label.substring(0, 10)}${label.length > 10 ? '...' : ''}` : '';

  if (role === 'start') {
    return `${icon}${shortLabel}`;
  } else {
    return `/${icon}`;
  }
}

// Export type is not a default export with verbatimModuleSyntax
