/**
 * RevisionPanel - Panel for managing tracked changes
 * Per Constitution Section 6 - Track Changes
 */
import { useState, useMemo, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRevisionStore } from '../../stores/revisionStore';
import {
  ACCEPT_ALL_REVISIONS_COMMAND,
  REJECT_ALL_REVISIONS_COMMAND,
} from '../../plugins/TrackChangesPlugin';
import { RevisionItem } from './RevisionItem';
import './RevisionPanel.css';

export interface RevisionPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

type FilterType = 'all' | 'insertion' | 'deletion';
type FilterAuthor = 'all' | string;

/**
 * RevisionPanel component
 */
export function RevisionPanel({
  isOpen,
  onClose,
}: RevisionPanelProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const { revisions } = useRevisionStore();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterAuthor, setFilterAuthor] = useState<FilterAuthor>('all');
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(null);

  // Get stats
  const stats = useMemo(() => {
    const allRevisions = Array.from(revisions.values());
    const pendingRevisions = allRevisions.filter((r) => r.status === 'pending');
    return {
      total: pendingRevisions.length,
      insertions: pendingRevisions.filter((r) => r.type === 'insertion').length,
      deletions: pendingRevisions.filter((r) => r.type === 'deletion').length,
    };
  }, [revisions]);

  // Get unique authors
  const authors = useMemo(() => {
    const authorMap = new Map<string, string>();
    revisions.forEach((r) => {
      if (r.status === 'pending') {
        authorMap.set(r.author.id, r.author.name);
      }
    });
    return Array.from(authorMap.entries());
  }, [revisions]);

  // Filter revisions
  const filteredRevisions = useMemo(() => {
    let result = Array.from(revisions.values()).filter(
      (r) => r.status === 'pending'
    );

    if (filterType !== 'all') {
      result = result.filter((r) => r.type === filterType);
    }

    if (filterAuthor !== 'all') {
      result = result.filter((r) => r.author.id === filterAuthor);
    }

    // Sort by timestamp, newest first
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return result;
  }, [revisions, filterType, filterAuthor]);

  const handleAcceptAll = useCallback(() => {
    editor.dispatchCommand(ACCEPT_ALL_REVISIONS_COMMAND, undefined);
  }, [editor]);

  const handleRejectAll = useCallback(() => {
    editor.dispatchCommand(REJECT_ALL_REVISIONS_COMMAND, undefined);
  }, [editor]);

  const handleSelectRevision = useCallback((revisionId: string) => {
    setSelectedRevisionId((prev) => (prev === revisionId ? null : revisionId));
  }, []);

  if (!isOpen) return null;

  return (
    <div className="revision-panel">
      {/* Header */}
      <div className="revision-panel__header">
        <h3 className="revision-panel__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Track Changes
        </h3>
        <button
          className="revision-panel__close"
          onClick={onClose}
          title="Close panel"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="revision-panel__stats">
        <div className="revision-panel__stat">
          <span className="revision-panel__stat-value">{stats.total}</span>
          <span className="revision-panel__stat-label">Changes</span>
        </div>
        <div className="revision-panel__stat revision-panel__stat--insertion">
          <span className="revision-panel__stat-value">{stats.insertions}</span>
          <span className="revision-panel__stat-label">Insertions</span>
        </div>
        <div className="revision-panel__stat revision-panel__stat--deletion">
          <span className="revision-panel__stat-value">{stats.deletions}</span>
          <span className="revision-panel__stat-label">Deletions</span>
        </div>
      </div>

      {/* Filters */}
      <div className="revision-panel__filters">
        <div className="revision-panel__filter">
          <label className="revision-panel__filter-label">Type</label>
          <select
            className="revision-panel__filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
          >
            <option value="all">All types</option>
            <option value="insertion">Insertions only</option>
            <option value="deletion">Deletions only</option>
          </select>
        </div>
        {authors.length > 1 && (
          <div className="revision-panel__filter">
            <label className="revision-panel__filter-label">Author</label>
            <select
              className="revision-panel__filter-select"
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
            >
              <option value="all">All authors</option>
              {authors.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {stats.total > 0 && (
        <div className="revision-panel__bulk-actions">
          <button
            className="revision-panel__bulk-button revision-panel__bulk-button--accept"
            onClick={handleAcceptAll}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Accept All
          </button>
          <button
            className="revision-panel__bulk-button revision-panel__bulk-button--reject"
            onClick={handleRejectAll}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Reject All
          </button>
        </div>
      )}

      {/* Revision list */}
      <div className="revision-panel__list">
        {filteredRevisions.length === 0 ? (
          <div className="revision-panel__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <p>No pending changes</p>
            <span>Changes will appear here when track changes is enabled</span>
          </div>
        ) : (
          filteredRevisions.map((revision) => (
            <RevisionItem
              key={revision.id}
              revision={revision}
              isSelected={selectedRevisionId === revision.id}
              onSelect={handleSelectRevision}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default RevisionPanel;
