/**
 * Collaboration Types
 * Per Constitution Section 7 - Collaboration
 */

/**
 * Collaboration connection status
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Collaboration user
 */
export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: CollaborationCursorPosition | undefined;
}

/**
 * Cursor position in the document (for collaboration)
 */
export interface CollaborationCursorPosition {
  anchor: {
    key: string;
    offset: number;
  };
  focus: {
    key: string;
    offset: number;
  };
}

/**
 * Awareness state for a user
 */
export interface AwarenessState {
  user: CollaborationUser;
  cursor?: CollaborationCursorPosition | undefined;
  selection?: {
    anchor: number;
    focus: number;
  } | undefined;
}

/**
 * Collaboration config
 */
export interface CollaborationConfig {
  /** Room/document ID */
  roomId: string;
  /** WebSocket server URL */
  serverUrl: string;
  /** Current user info */
  user: CollaborationUser;
  /** Enable offline persistence with IndexedDB */
  enableOfflinePersistence?: boolean | undefined;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean | undefined;
  /** Reconnect delay in ms */
  reconnectDelay?: number | undefined;
  /** Max reconnect attempts */
  maxReconnectAttempts?: number | undefined;
}

/**
 * Collaboration state
 */
export interface CollaborationState {
  /** Connection status */
  status: ConnectionStatus;
  /** Whether currently synced with server */
  isSynced: boolean;
  /** Whether offline mode is active */
  isOffline: boolean;
  /** Connected users */
  users: CollaborationUser[];
  /** Error message if any */
  error?: string | undefined;
  /** Last sync timestamp */
  lastSyncedAt?: Date | undefined;
}

/**
 * Default collaboration colors
 */
export const COLLABORATION_COLORS = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
] as const;

/**
 * Generate a random collaboration color
 */
export function getRandomColor(): string {
  return COLLABORATION_COLORS[Math.floor(Math.random() * COLLABORATION_COLORS.length)];
}

/**
 * Generate a color based on user ID (deterministic)
 */
export function getColorForUser(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return COLLABORATION_COLORS[Math.abs(hash) % COLLABORATION_COLORS.length];
}

/**
 * Default collaboration config
 */
export const DEFAULT_COLLABORATION_CONFIG: Partial<CollaborationConfig> = {
  enableOfflinePersistence: true,
  autoReconnect: true,
  reconnectDelay: 1000,
  maxReconnectAttempts: 10,
};
