/**
 * RevisionPanel - Panel for managing document versions
 * Per Constitution Section 6 - Track Changes
 *
 * Note: This component is kept for backwards compatibility.
 * The main version management UI is now in VersionsTabContent (DemoApp.tsx)
 */
import { useCallback } from 'react';
import { useRevisionStore, type DocumentVersion } from '../../stores/revisionStore';
import './RevisionPanel.css';

export interface RevisionPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
}

/**
 * RevisionPanel component - Version history panel
 */
export function RevisionPanel({
  isOpen,
  onClose,
}: RevisionPanelProps): JSX.Element | null {
  const versions = useRevisionStore((state) => state.getAllVersions());
  const deleteVersion = useRevisionStore((state) => state.deleteVersion);
  const restoreVersion = useRevisionStore((state) => state.restoreVersion);

  const formatDateTime = useCallback((date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleRestore = useCallback((versionId: string) => {
    restoreVersion(versionId);
  }, [restoreVersion]);

  const handleDelete = useCallback((versionId: string) => {
    deleteVersion(versionId);
  }, [deleteVersion]);

  if (!isOpen) return null;

  return (
    <div className="revision-panel">
      {/* Header */}
      <div className="revision-panel__header">
        <h3 className="revision-panel__title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Historique des versions
        </h3>
        <button
          className="revision-panel__close"
          onClick={onClose}
          title="Fermer le panneau"
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
          <span className="revision-panel__stat-value">{versions.length}</span>
          <span className="revision-panel__stat-label">Versions</span>
        </div>
      </div>

      {/* Version list */}
      <div className="revision-panel__list">
        {versions.length === 0 ? (
          <div className="revision-panel__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>Aucune version sauvegardée</p>
            <span>Cliquez sur "Sauvegarder version" pour créer un point de restauration</span>
          </div>
        ) : (
          versions.map((version: DocumentVersion, index: number) => (
            <div
              key={version.id}
              className="revision-panel__item"
            >
              <div className="revision-panel__item-header">
                <div className="revision-panel__item-badge">
                  {versions.length - index}
                </div>
                <div className="revision-panel__item-info">
                  <span className="revision-panel__item-label">{version.label}</span>
                  <span className="revision-panel__item-meta">
                    {version.author.name} • {formatDateTime(version.createdAt)}
                  </span>
                </div>
              </div>
              <div className="revision-panel__item-actions">
                <button
                  className="revision-panel__action-btn revision-panel__action-btn--restore"
                  onClick={() => handleRestore(version.id)}
                  title="Restaurer cette version"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  className="revision-panel__action-btn revision-panel__action-btn--delete"
                  onClick={() => handleDelete(version.id)}
                  title="Supprimer cette version"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RevisionPanel;
