/**
 * Mention types and constants
 * Per Constitution Section 5 - Shortcuts & Commands
 */

/**
 * Types of mentions supported
 */
export type MentionType = 'user' | 'product' | 'document' | 'anchor';

/**
 * Mention data structure
 */
export interface MentionData {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Mention type */
  type: MentionType;
  /** Avatar URL (for users) */
  avatarUrl?: string | undefined;
  /** Email (for users) */
  email?: string | undefined;
  /** Description or subtitle */
  description?: string | undefined;
  /** Whether this is a priority item (e.g., assigned user) */
  isPriority?: boolean | undefined;
  /** Additional metadata */
  metadata?: Record<string, unknown> | undefined;
}

/**
 * User mention data
 */
export interface UserMention extends MentionData {
  type: 'user';
  avatarUrl?: string | undefined;
  email?: string | undefined;
  role?: string | undefined;
  department?: string | undefined;
  isPriority?: boolean | undefined;
}

/**
 * Product mention data
 */
export interface ProductMention extends MentionData {
  type: 'product';
  sku?: string | undefined;
  category?: string | undefined;
}

/**
 * Document mention data
 */
export interface DocumentMention extends MentionData {
  type: 'document';
  documentType?: string | undefined;
  version?: string | undefined;
}

/**
 * Anchor mention data (internal document reference)
 */
export interface AnchorMention extends MentionData {
  type: 'anchor';
  anchorId: string;
  sectionTitle?: string | undefined;
}

/**
 * Colors for mention types
 */
export const MENTION_COLORS: Record<MentionType, { bg: string; border: string; text: string; icon: string }> = {
  user: {
    bg: '#dbeafe',
    border: '#3b82f6',
    text: '#1e40af',
    icon: '#3b82f6',
  },
  product: {
    bg: '#dcfce7',
    border: '#22c55e',
    text: '#166534',
    icon: '#22c55e',
  },
  document: {
    bg: '#fef3c7',
    border: '#f59e0b',
    text: '#92400e',
    icon: '#f59e0b',
  },
  anchor: {
    bg: '#f3e8ff',
    border: '#a855f7',
    text: '#6b21a8',
    icon: '#a855f7',
  },
};

/**
 * Labels for mention types
 */
export const MENTION_TYPE_LABELS: Record<MentionType, string> = {
  user: 'Utilisateur',
  product: 'Produit',
  document: 'Document',
  anchor: 'Ancre',
};

/**
 * Icons for mention types (lucide icon names)
 */
export const MENTION_TYPE_ICONS: Record<MentionType, string> = {
  user: 'User',
  product: 'Package',
  document: 'FileText',
  anchor: 'Anchor',
};
