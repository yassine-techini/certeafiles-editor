/**
 * PresenceIndicator - Shows connected users with avatars and status
 * Per Constitution Section 7 - Collaboration
 */
import { useMemo, useState } from 'react';
import type { CollaborationUser } from '../../types/collaboration';
import './PresenceIndicator.css';

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'offline';

/**
 * User with presence information
 */
export interface PresenceUser extends CollaborationUser {
  status: PresenceStatus;
  lastActive: number;
}

export interface PresenceIndicatorProps {
  /** Current user */
  currentUser: CollaborationUser;
  /** Other connected users */
  users: PresenceUser[];
  /** Max avatars to show before collapsing */
  maxVisible?: number | undefined;
  /** Whether to show the dropdown on click */
  showDropdown?: boolean | undefined;
  /** Callback when user is clicked */
  onUserClick?: ((user: PresenceUser) => void) | undefined;
  /** Size of avatars */
  size?: 'small' | 'medium' | 'large' | undefined;
  /** Show online/away indicator dots */
  showStatusDots?: boolean | undefined;
}

/**
 * Get relative time string
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  });
}

/**
 * Get status color
 */
function getStatusColor(status: PresenceStatus): string {
  switch (status) {
    case 'online':
      return '#22c55e';
    case 'away':
      return '#eab308';
    case 'offline':
      return '#94a3b8';
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: PresenceStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Away';
    case 'offline':
      return 'Offline';
  }
}

/**
 * Avatar component
 */
interface AvatarProps {
  user: CollaborationUser | PresenceUser;
  size: 'small' | 'medium' | 'large';
  showStatusDot: boolean;
  status?: PresenceStatus | undefined;
  isCurrentUser?: boolean | undefined;
  onClick?: (() => void) | undefined;
}

function Avatar({
  user,
  size,
  showStatusDot,
  status,
  isCurrentUser = false,
  onClick,
}: AvatarProps): JSX.Element {
  const sizeClass = `presence-avatar--${size}`;
  const statusColor = status ? getStatusColor(status) : undefined;

  return (
    <div
      className={`presence-avatar ${sizeClass} ${isCurrentUser ? 'presence-avatar--current' : ''} ${onClick ? 'presence-avatar--clickable' : ''}`}
      style={{ backgroundColor: user.color }}
      title={`${user.name}${isCurrentUser ? ' (you)' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="presence-avatar__initial">
        {user.name.charAt(0).toUpperCase()}
      </span>
      {showStatusDot && status && (
        <span
          className="presence-avatar__status"
          style={{ backgroundColor: statusColor }}
        />
      )}
    </div>
  );
}

/**
 * PresenceIndicator component
 */
export function PresenceIndicator({
  currentUser,
  users,
  maxVisible = 4,
  showDropdown = true,
  onUserClick,
  size = 'medium',
  showStatusDots = true,
}: PresenceIndicatorProps): JSX.Element {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Split visible and hidden users
  const { visibleUsers, hiddenCount } = useMemo(() => {
    const visible = users.slice(0, maxVisible);
    const hidden = users.slice(maxVisible);
    return {
      visibleUsers: visible,
      hiddenCount: hidden.length,
    };
  }, [users, maxVisible]);

  // All users for dropdown
  const allUsers = useMemo(() => {
    return users.sort((a, b) => {
      // Sort by status (online first) then by name
      const statusOrder: Record<PresenceStatus, number> = {
        online: 0,
        away: 1,
        offline: 2,
      };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.name.localeCompare(b.name);
    });
  }, [users]);

  const totalOnline = useMemo(() => {
    return users.filter((u) => u.status === 'online').length + 1; // +1 for current user
  }, [users]);

  const handleToggleDropdown = () => {
    if (showDropdown) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleUserClick = (user: PresenceUser) => {
    onUserClick?.(user);
    setIsDropdownOpen(false);
  };

  return (
    <div className="presence-indicator">
      {/* Avatar stack */}
      <div className="presence-indicator__avatars" onClick={handleToggleDropdown}>
        {/* Current user */}
        <Avatar
          user={currentUser}
          size={size}
          showStatusDot={showStatusDots}
          status="online"
          isCurrentUser
        />

        {/* Other visible users */}
        {visibleUsers.map((user) => (
          <Avatar
            key={user.id}
            user={user}
            size={size}
            showStatusDot={showStatusDots}
            status={user.status}
          />
        ))}

        {/* Hidden count badge */}
        {hiddenCount > 0 && (
          <div className={`presence-avatar presence-avatar--more presence-avatar--${size}`}>
            +{hiddenCount}
          </div>
        )}
      </div>

      {/* Online count */}
      <div className="presence-indicator__count">
        <span className="presence-indicator__count-dot" />
        {totalOnline} online
      </div>

      {/* Dropdown */}
      {showDropdown && isDropdownOpen && (
        <>
          <div
            className="presence-indicator__backdrop"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="presence-indicator__dropdown">
            <div className="presence-indicator__dropdown-header">
              <span className="presence-indicator__dropdown-title">
                Collaborators
              </span>
              <span className="presence-indicator__dropdown-count">
                {totalOnline} online
              </span>
            </div>

            <div className="presence-indicator__dropdown-list">
              {/* Current user */}
              <div className="presence-indicator__dropdown-item presence-indicator__dropdown-item--current">
                <Avatar
                  user={currentUser}
                  size="small"
                  showStatusDot={showStatusDots}
                  status="online"
                  isCurrentUser
                />
                <div className="presence-indicator__dropdown-info">
                  <span className="presence-indicator__dropdown-name">
                    {currentUser.name}
                    <span className="presence-indicator__dropdown-you">(you)</span>
                  </span>
                  <span className="presence-indicator__dropdown-status">
                    {getStatusLabel('online')}
                  </span>
                </div>
              </div>

              {/* Separator */}
              {allUsers.length > 0 && (
                <div className="presence-indicator__dropdown-separator" />
              )}

              {/* Other users */}
              {allUsers.map((user) => (
                <div
                  key={user.id}
                  className="presence-indicator__dropdown-item"
                  onClick={() => handleUserClick(user)}
                  role="button"
                  tabIndex={0}
                >
                  <Avatar
                    user={user}
                    size="small"
                    showStatusDot={showStatusDots}
                    status={user.status}
                  />
                  <div className="presence-indicator__dropdown-info">
                    <span className="presence-indicator__dropdown-name">
                      {user.name}
                    </span>
                    <span className="presence-indicator__dropdown-status">
                      {getStatusLabel(user.status)}
                      {user.status !== 'online' && (
                        <span className="presence-indicator__dropdown-time">
                          {' '}- {getRelativeTime(user.lastActive)}
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    className="presence-indicator__dropdown-dot"
                    style={{ backgroundColor: getStatusColor(user.status) }}
                  />
                </div>
              ))}

              {/* Empty state */}
              {allUsers.length === 0 && (
                <div className="presence-indicator__dropdown-empty">
                  No other users connected
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PresenceIndicator;
