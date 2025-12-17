/**
 * CollaborationStatus - Shows collaboration connection status and users
 * Per Constitution Section 7 - Collaboration
 */
import type { CollaborationUser, ConnectionStatus } from '../../types/collaboration';
import './CollaborationStatus.css';

export interface CollaborationStatusProps {
  /** Connection status */
  status: ConnectionStatus;
  /** Whether synced with server */
  isSynced: boolean;
  /** Whether offline */
  isOffline: boolean;
  /** Current user */
  currentUser: CollaborationUser;
  /** Other connected users */
  otherUsers: CollaborationUser[];
  /** Max users to show before collapsing */
  maxVisible?: number | undefined;
}

/**
 * Get status icon and color
 */
function getStatusInfo(status: ConnectionStatus, isOffline: boolean): {
  icon: string;
  color: string;
  label: string;
} {
  if (isOffline) {
    return { icon: '📴', color: '#94a3b8', label: 'Offline' };
  }

  switch (status) {
    case 'connected':
      return { icon: '🟢', color: '#22c55e', label: 'Connected' };
    case 'connecting':
      return { icon: '🟡', color: '#eab308', label: 'Connecting...' };
    case 'reconnecting':
      return { icon: '🟠', color: '#f97316', label: 'Reconnecting...' };
    case 'error':
      return { icon: '🔴', color: '#ef4444', label: 'Connection Error' };
    default:
      return { icon: '⚪', color: '#94a3b8', label: 'Disconnected' };
  }
}

/**
 * CollaborationStatus component
 */
export function CollaborationStatus({
  status,
  isSynced,
  isOffline,
  currentUser,
  otherUsers,
  maxVisible = 3,
}: CollaborationStatusProps): JSX.Element {
  const statusInfo = getStatusInfo(status, isOffline);
  const visibleUsers = otherUsers.slice(0, maxVisible);
  const hiddenCount = Math.max(0, otherUsers.length - maxVisible);

  return (
    <div className="collaboration-status">
      {/* Connection Status */}
      <div
        className="collaboration-status__indicator"
        title={statusInfo.label}
      >
        <span
          className="collaboration-status__dot"
          style={{ backgroundColor: statusInfo.color }}
        />
        <span className="collaboration-status__label">{statusInfo.label}</span>
      </div>

      {/* Sync indicator */}
      {status === 'connected' && (
        <div
          className={`collaboration-status__sync ${isSynced ? 'synced' : 'syncing'}`}
          title={isSynced ? 'All changes synced' : 'Syncing changes...'}
        >
          {isSynced ? '✓' : '↻'}
        </div>
      )}

      {/* User avatars */}
      <div className="collaboration-status__users">
        {/* Current user */}
        <div
          className="collaboration-status__avatar collaboration-status__avatar--current"
          style={{ backgroundColor: currentUser.color }}
          title={`${currentUser.name} (you)`}
        >
          {currentUser.name.charAt(0).toUpperCase()}
        </div>

        {/* Other users */}
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className="collaboration-status__avatar"
            style={{ backgroundColor: user.color }}
            title={user.name}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
        ))}

        {/* Hidden users count */}
        {hiddenCount > 0 && (
          <div
            className="collaboration-status__avatar collaboration-status__avatar--more"
            title={`${hiddenCount} more user${hiddenCount > 1 ? 's' : ''}`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollaborationStatus;
