/**
 * useCollaboration Hook - Manage collaboration state
 * Per Constitution Section 7 - Collaboration
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import type {
  CollaborationConfig,
  CollaborationState,
  CollaborationUser,
  ConnectionStatus,
} from '../types/collaboration';
import { getColorForUser, DEFAULT_COLLABORATION_CONFIG } from '../types/collaboration';

/**
 * Generate a unique user ID
 */
function generateUserId(): string {
  // Check localStorage for existing user ID
  const stored = localStorage.getItem('certeafiles-user-id');
  if (stored) return stored;

  // Generate new ID
  const newId = crypto.randomUUID();
  localStorage.setItem('certeafiles-user-id', newId);
  return newId;
}

/**
 * Get stored user name or generate default
 */
function getStoredUserName(): string {
  return localStorage.getItem('certeafiles-user-name') || 'Anonymous User';
}

/**
 * Save user name to localStorage
 */
function saveUserName(name: string): void {
  localStorage.setItem('certeafiles-user-name', name);
}

/**
 * Hook options
 */
export interface UseCollaborationOptions {
  /** Room/document ID */
  roomId: string;
  /** WebSocket server URL (default: derived from current origin) */
  serverUrl?: string | undefined;
  /** User name (default: from localStorage or 'Anonymous User') */
  userName?: string | undefined;
  /** User color (default: generated from user ID) */
  userColor?: string | undefined;
  /** Enable offline persistence */
  enableOfflinePersistence?: boolean | undefined;
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean | undefined;
}

/**
 * Hook return value
 */
export interface UseCollaborationReturn {
  /** Full collaboration config for plugin */
  config: CollaborationConfig;
  /** Current collaboration state */
  state: CollaborationState;
  /** Current user info */
  currentUser: CollaborationUser;
  /** Whether collaboration is available */
  isAvailable: boolean;
  /** Whether currently connected */
  isConnected: boolean;
  /** Whether synced with server */
  isSynced: boolean;
  /** Whether offline */
  isOffline: boolean;
  /** Connected users (excluding self) */
  otherUsers: CollaborationUser[];
  /** All connected users (including self) */
  allUsers: CollaborationUser[];
  /** Update user name */
  setUserName: (name: string) => void;
  /** Handle status change (for plugin) */
  handleStatusChange: (status: ConnectionStatus) => void;
  /** Handle sync change (for plugin) */
  handleSyncChange: (synced: boolean) => void;
  /** Handle users change (for plugin) */
  handleUsersChange: (users: CollaborationUser[]) => void;
  /** Handle state change (for plugin) */
  handleStateChange: (state: CollaborationState) => void;
}

/**
 * useCollaboration hook
 */
export function useCollaboration(options: UseCollaborationOptions): UseCollaborationReturn {
  const {
    roomId,
    serverUrl: providedServerUrl,
    userName: providedUserName,
    userColor: providedUserColor,
    enableOfflinePersistence = true,
    autoReconnect = true,
  } = options;

  // Generate or get user ID
  const [userId] = useState(() => generateUserId());

  // User name state
  const [userName, setUserNameState] = useState(() => providedUserName || getStoredUserName());

  // User color (deterministic based on user ID)
  const userColor = useMemo(
    () => providedUserColor || getColorForUser(userId),
    [providedUserColor, userId]
  );

  // Derive server URL from current origin if not provided
  const serverUrl = useMemo(() => {
    if (providedServerUrl) return providedServerUrl;

    // Use current origin with /api/collaboration path
    const origin = window.location.origin;
    const protocol = origin.startsWith('https') ? 'wss' : 'ws';
    const host = window.location.host;
    return `${protocol}://${host}/api/collaboration`;
  }, [providedServerUrl]);

  // Current user object
  const currentUser: CollaborationUser = useMemo(() => ({
    id: userId,
    name: userName,
    color: userColor,
  }), [userId, userName, userColor]);

  // Collaboration state
  const [state, setState] = useState<CollaborationState>({
    status: 'disconnected',
    isSynced: false,
    isOffline: !navigator.onLine,
    users: [],
  });

  // Build full config
  const config: CollaborationConfig = useMemo(() => ({
    roomId,
    serverUrl,
    user: currentUser,
    enableOfflinePersistence,
    autoReconnect,
    ...DEFAULT_COLLABORATION_CONFIG,
  }), [roomId, serverUrl, currentUser, enableOfflinePersistence, autoReconnect]);

  // Update user name
  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    saveUserName(name);
  }, []);

  // Handle status change from plugin
  const handleStatusChange = useCallback((status: ConnectionStatus) => {
    setState((prev) => ({ ...prev, status }));
  }, []);

  // Handle sync change from plugin
  const handleSyncChange = useCallback((synced: boolean) => {
    setState((prev) => ({
      ...prev,
      isSynced: synced,
      lastSyncedAt: synced ? new Date() : prev.lastSyncedAt,
    }));
  }, []);

  // Handle users change from plugin
  const handleUsersChange = useCallback((users: CollaborationUser[]) => {
    setState((prev) => ({ ...prev, users }));
  }, []);

  // Handle full state change from plugin
  const handleStateChange = useCallback((newState: CollaborationState) => {
    setState(newState);
  }, []);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOffline: false }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Derived values
  const isAvailable = true; // Could add feature detection
  const isConnected = state.status === 'connected';
  const isSynced = state.isSynced;
  const isOffline = state.isOffline;

  // Filter out current user from other users
  const otherUsers = useMemo(
    () => state.users.filter((user) => user.id !== userId),
    [state.users, userId]
  );

  // All users including current
  const allUsers = useMemo(
    () => {
      // Ensure current user is in the list
      const hasCurrentUser = state.users.some((user) => user.id === userId);
      if (hasCurrentUser) return state.users;
      return [currentUser, ...state.users];
    },
    [state.users, userId, currentUser]
  );

  return {
    config,
    state,
    currentUser,
    isAvailable,
    isConnected,
    isSynced,
    isOffline,
    otherUsers,
    allUsers,
    setUserName,
    handleStatusChange,
    handleSyncChange,
    handleUsersChange,
    handleStateChange,
  };
}

export default useCollaboration;
