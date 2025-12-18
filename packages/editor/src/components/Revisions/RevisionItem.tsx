/**
 * RevisionItem - Individual revision item with author, preview, and actions
 * Per Constitution Section 6 - Track Changes
 */
import { useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { Revision } from '../../types/revision';
import { REVISION_COLORS } from '../../types/revision';
import {
  ACCEPT_REVISION_COMMAND,
  REJECT_REVISION_COMMAND,
} from '../../plugins/TrackChangesPlugin';
import './RevisionItem.css';

export interface RevisionItemProps {
  revision: Revision;
  isSelected?: boolean | undefined;
  onSelect?: ((revisionId: string) => void) | undefined;
}

/**
 * Format timestamp to relative time or date
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * RevisionItem component
 */
export function RevisionItem({
  revision,
  isSelected = false,
  onSelect,
}: RevisionItemProps): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const handleAccept = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      editor.dispatchCommand(ACCEPT_REVISION_COMMAND, revision.id);
    },
    [editor, revision.id]
  );

  const handleReject = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      editor.dispatchCommand(REJECT_REVISION_COMMAND, revision.id);
    },
    [editor, revision.id]
  );

  const handleClick = useCallback(() => {
    onSelect?.(revision.id);
  }, [onSelect, revision.id]);

  const isInsertion = revision.type === 'insertion';
  const insertionColors = REVISION_COLORS.insertion;
  const deletionColors = REVISION_COLORS.deletion;
  const typeLabel = isInsertion ? 'Inserted' : 'Deleted';
  const typeIcon = isInsertion ? '+' : '-';

  return (
    <div
      className={`revision-item ${isSelected ? 'revision-item--selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Header with author and timestamp */}
      <div className="revision-item__header">
        <div className="revision-item__author">
          <span
            className="revision-item__author-badge"
            style={{ backgroundColor: isInsertion ? insertionColors.text : deletionColors.text }}
          >
            {revision.author.name.charAt(0).toUpperCase()}
          </span>
          <span className="revision-item__author-name">
            {revision.author.name}
          </span>
        </div>
        <span className="revision-item__timestamp">
          {formatTimestamp(revision.createdAt)}
        </span>
      </div>

      {/* Change type and preview */}
      <div className="revision-item__content">
        <span
          className={`revision-item__type revision-item__type--${revision.type}`}
          style={{
            backgroundColor: isInsertion ? insertionColors.bg : 'transparent',
            color: isInsertion ? insertionColors.text : deletionColors.text,
            textDecoration: isInsertion ? 'none' : 'line-through',
          }}
        >
          <span className="revision-item__type-icon">{typeIcon}</span>
          {typeLabel}
        </span>
        <span
          className="revision-item__preview"
          style={{
            backgroundColor: isInsertion ? insertionColors.bg : 'transparent',
            color: isInsertion ? insertionColors.text : deletionColors.text,
            textDecoration: isInsertion ? `underline ${insertionColors.underline}` : 'line-through',
            textDecorationColor: isInsertion ? insertionColors.underline : deletionColors.strikethrough,
          }}
        >
          {truncateText(revision.content, 50)}
        </span>
      </div>

      {/* Action buttons */}
      {revision.status === 'pending' && (
        <div className="revision-item__actions">
          <button
            className="revision-item__button revision-item__button--accept"
            onClick={handleAccept}
            title="Accept this change"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Accept
          </button>
          <button
            className="revision-item__button revision-item__button--reject"
            onClick={handleReject}
            title="Reject this change"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reject
          </button>
        </div>
      )}

      {/* Status indicator for resolved revisions */}
      {revision.status !== 'pending' && (
        <div className={`revision-item__status revision-item__status--${revision.status}`}>
          {revision.status === 'accepted' ? 'Accepted' : 'Rejected'}
        </div>
      )}
    </div>
  );
}

export default RevisionItem;
