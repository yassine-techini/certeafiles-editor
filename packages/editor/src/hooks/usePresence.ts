/**
 * usePresence Hook - Track connected users from Yjs awareness
 * Per Constitution Section 7 - Collaboration
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Awareness } from 'y-protocols/awareness';
import type { CollaborationUser } from '../types/collaboration';
import type { PresenceStatus, PresenceUser } from '../components/Collaboration/PresenceIndicator';
import type { RemoteCursor, CursorState } from '../plugins/CursorPlugin';

/**
 * Hook options
 */
export interface UsePresenceOptions {
  /** Yjs awareness instance */
  awareness: Awareness | null;
  /** Current user info */
  currentUser: CollaborationUser;
  /** Time before marking user as away (ms) */
  awayTimeout?: number | undefined;
  /** Time before marking user as offline (ms) */
  offlineTimeout?: number | undefined;
  /** Refresh interval for status updates (ms) */
  refreshInterval?: number | undefined;
}

/**
 * Hook return value
 */
export interface UsePresenceReturn {
  /** All connected users (with presence status) */
  users: PresenceUser[];
  /** Remote cursors */
  cursors: RemoteCursor[];
  /** Total online users count (including self) */
  onlineCount: number;
  /** Total connected users count */
  totalCount: number;
  /** Whether there are other users connected */
  hasOtherUsers: boolean;
  /** Update local user activity */
  updateActivity: () => void;
  /** Set local user status */
  setLocalStatus: (status: PresenceStatus) => void;
}

/**
 * Get presence status from last active timestamp
 */
function getPresenceStatus(
  lastActive: number,
  awayTimeout: number,
  offlineTimeout: number
): PresenceStatus {
  const now = Date.now();
  const elapsed = now - lastActive;

  if (elapsed < awayTimeout) return 'online';
  if (elapsed < offlineTimeout) return 'away';
  return 'offline';
}

/**
 * usePresence hook
 */
export function usePresence({
  awareness,
  currentUser,
  awayTimeout = 60000, // 1 minute
  offlineTimeout = 300000, // 5 minutes
  refreshInterval = 10000, // 10 seconds
}: UsePresenceOptions): UsePresenceReturn {
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);
  const [localStatus, setLocalStatus] = useState<PresenceStatus>('online');

  /**
   * Update local activity timestamp
   */
  const updateActivity = useCallback(() => {
    if (!awareness) return;

    awareness.setLocalStateField('user', {
      ...currentUser,
      lastActive: Date.now(),
    });
  }, [awareness, currentUser]);

  /**
   * Set local status explicitly
   */
  const handleSetLocalStatus = useCallback((status: PresenceStatus) => {
    setLocalStatus(status);

    if (!awareness) return;

    awareness.setLocalStateField('status', status);
  }, [awareness]);

  /**
   * Process awareness states into users and cursors
   */
  const processAwarenessStates = useCallback(() => {
    if (!awareness) return;

    const states = awareness.getStates();
    const localClientId = awareness.clientID;
    const now = Date.now();

    const newUsers: PresenceUser[] = [];
    const newCursors: RemoteCursor[] = [];

    states.forEach((state, clientId) => {
      // Skip local user
      if (clientId === localClientId) return;

      // Get user info from state
      const userInfo = state.user as CollaborationUser | undefined;
      const cursorState = state.cursor as CursorState | undefined;
      const explicitStatus = state.status as PresenceStatus | undefined;

      if (!userInfo) return;

      // Determine last active time
      const lastActive = cursorState?.lastActive || (state.lastActive as number) || now;

      // Determine status
      const status = explicitStatus || getPresenceStatus(lastActive, awayTimeout, offlineTimeout);

      // Add to users list
      newUsers.push({
        ...userInfo,
        status,
        lastActive,
      });

      // Add cursor if present
      if (cursorState?.selection) {
        newCursors.push({
          clientId,
          user: userInfo,
          cursor: cursorState.cursor,
          selection: cursorState.selection,
          position: null, // Will be calculated by CursorPlugin
          selectionRects: [],
          isActive: status === 'online',
          lastActive,
        });
      }
    });

    setUsers(newUsers);
    setCursors(newCursors);
  }, [awareness, awayTimeout, offlineTimeout]);

  /**
   * Set up initial local state
   */
  useEffect(() => {
    if (!awareness) return;

    // Set initial user state
    awareness.setLocalStateField('user', {
      ...currentUser,
      lastActive: Date.now(),
    });
    awareness.setLocalStateField('status', localStatus);

    // Process initial states
    processAwarenessStates();
  }, [awareness, currentUser, localStatus, processAwarenessStates]);

  /**
   * Listen to awareness updates
   */
  useEffect(() => {
    if (!awareness) return;

    const handleUpdate = () => {
      processAwarenessStates();
    };

    awareness.on('update', handleUpdate);

    return () => {
      awareness.off('update', handleUpdate);
    };
  }, [awareness, processAwarenessStates]);

  /**
   * Periodically refresh status calculations
   */
  useEffect(() => {
    if (!awareness) return;

    const intervalId = setInterval(() => {
      processAwarenessStates();
    }, refreshInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [awareness, refreshInterval, processAwarenessStates]);

  /**
   * Track user activity (mouse/keyboard)
   */
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

    let activityTimeout: ReturnType<typeof setTimeout> | null = null;

    const handleActivity = () => {
      // Debounce activity updates
      if (activityTimeout) return;

      activityTimeout = setTimeout(() => {
        updateActivity();
        activityTimeout = null;
      }, 5000); // Update at most every 5 seconds
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [updateActivity]);

  /**
   * Handle visibility change (tab focus)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSetLocalStatus('away');
      } else {
        handleSetLocalStatus('online');
        updateActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleSetLocalStatus, updateActivity]);

  // Derived values
  const onlineCount = useMemo(() => {
    return users.filter((u) => u.status === 'online').length + 1; // +1 for self
  }, [users]);

  const totalCount = useMemo(() => {
    return users.length + 1; // +1 for self
  }, [users]);

  const hasOtherUsers = users.length > 0;

  return {
    users,
    cursors,
    onlineCount,
    totalCount,
    hasOtherUsers,
    updateActivity,
    setLocalStatus: handleSetLocalStatus,
  };
}

export default usePresence;
