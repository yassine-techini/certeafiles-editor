/**
 * VersionHistoryPanel - Display and manage document versions
 * Per Constitution Section 5.3 - Versioning UI
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useVersionStore, selectSnapshots } from '../stores/versionStore';
import type { Version } from '../services/api';

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreVersion: (content: string) => void;
}

type ViewMode = 'all' | 'snapshots';

export function VersionHistoryPanel({
  isOpen,
  onClose,
  onRestoreVersion,
}: VersionHistoryPanelProps): React.ReactElement | null {
  const [viewMode, setViewMode] = useState<ViewMode>('snapshots');

  const {
    versions,
    isLoadingVersions,
    selectedVersionId,
    loadVersions,
    selectVersion,
    restoreVersion,
    error,
    clearError,
  } = useVersionStore();

  const snapshots = useVersionStore(selectSnapshots);

  const displayedVersions = viewMode === 'snapshots' ? snapshots : versions;

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, loadVersions]);

  const handleRestore = useCallback(async () => {
    if (!selectedVersionId) return;

    try {
      const content = await restoreVersion(selectedVersionId);
      onRestoreVersion(content);
      onClose();
    } catch (err) {
      console.error('Failed to restore version:', err);
    }
  }, [selectedVersionId, restoreVersion, onRestoreVersion, onClose]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return formatDate(timestamp);
  };

  if (!isOpen) return null;

  return (
    <div className="version-history-panel">
      <div className="version-history-overlay" onClick={onClose} />

      <div className="version-history-content">
        <div className="version-history-header">
          <h2>Historique des versions</h2>
          <button className="close-button" onClick={onClose} aria-label="Fermer">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="version-error">
            <span>{error}</span>
            <button onClick={clearError}>Fermer</button>
          </div>
        )}

        <div className="version-tabs">
          <button
            className={`version-tab ${viewMode === 'snapshots' ? 'active' : ''}`}
            onClick={() => setViewMode('snapshots')}
          >
            Snapshots ({snapshots.length})
          </button>
          <button
            className={`version-tab ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            Toutes ({versions.length})
          </button>
        </div>

        <div className="version-list">
          {isLoadingVersions ? (
            <div className="version-loading">
              <div className="spinner" />
              <span>Chargement...</span>
            </div>
          ) : displayedVersions.length === 0 ? (
            <div className="version-empty">
              {viewMode === 'snapshots'
                ? 'Aucun snapshot créé'
                : 'Aucune version enregistrée'}
            </div>
          ) : (
            displayedVersions.map((version) => (
              <VersionItem
                key={version.id}
                version={version}
                isSelected={selectedVersionId === version.id}
                onSelect={() => selectVersion(version.id)}
                formatRelativeTime={formatRelativeTime}
              />
            ))
          )}
        </div>

        <div className="version-actions">
          {selectedVersionId && (
            <button
              className="restore-button"
              onClick={handleRestore}
            >
              Restaurer cette version
            </button>
          )}
        </div>

        <style>{`
          .version-history-panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            z-index: 1000;
            display: flex;
            justify-content: flex-end;
          }

          .version-history-overlay {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background: rgba(0, 0, 0, 0.3);
          }

          .version-history-content {
            position: relative;
            width: 360px;
            max-width: 100%;
            background: white;
            box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
            display: flex;
            flex-direction: column;
            z-index: 1;
          }

          .version-history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            border-bottom: 1px solid #e5e7eb;
          }

          .version-history-header h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
          }

          .close-button {
            background: none;
            border: none;
            padding: 8px;
            cursor: pointer;
            color: #6b7280;
            border-radius: 4px;
            transition: all 0.15s;
          }

          .close-button:hover {
            background: #f3f4f6;
            color: #1f2937;
          }

          .version-error {
            margin: 12px 16px;
            padding: 12px;
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #dc2626;
            font-size: 14px;
          }

          .version-error button {
            background: none;
            border: none;
            color: #dc2626;
            cursor: pointer;
            font-weight: 500;
          }

          .version-tabs {
            display: flex;
            padding: 12px 16px;
            gap: 8px;
            border-bottom: 1px solid #e5e7eb;
          }

          .version-tab {
            flex: 1;
            padding: 8px 16px;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: white;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.15s;
          }

          .version-tab:hover {
            background: #f9fafb;
          }

          .version-tab.active {
            background: #2563eb;
            border-color: #2563eb;
            color: white;
          }

          .version-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
          }

          .version-loading,
          .version-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            color: #6b7280;
            font-size: 14px;
            gap: 12px;
          }

          .spinner {
            width: 24px;
            height: 24px;
            border: 2px solid #e5e7eb;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .version-item {
            padding: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 8px;
            cursor: pointer;
            transition: all 0.15s;
          }

          .version-item:hover {
            border-color: #d1d5db;
            background: #f9fafb;
          }

          .version-item.selected {
            border-color: #2563eb;
            background: #eff6ff;
          }

          .version-item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
          }

          .version-label {
            font-weight: 500;
            font-size: 14px;
            color: #1f2937;
          }

          .version-badge {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            background: #dbeafe;
            color: #1e40af;
            font-weight: 500;
          }

          .version-meta {
            font-size: 12px;
            color: #6b7280;
          }

          .version-actions {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
          }

          .restore-button {
            width: 100%;
            padding: 12px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
          }

          .restore-button:hover {
            background: #1d4ed8;
          }

          .create-snapshot-form {
            padding: 16px;
            border-top: 1px solid #e5e7eb;
          }

          .create-snapshot-form input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
            margin-bottom: 8px;
          }

          .create-snapshot-form input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          }

          .create-snapshot-button {
            width: 100%;
            padding: 10px;
            background: #059669;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: background 0.15s;
          }

          .create-snapshot-button:hover {
            background: #047857;
          }

          .create-snapshot-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}

interface VersionItemProps {
  version: Version;
  isSelected: boolean;
  onSelect: () => void;
  formatRelativeTime: (timestamp: number) => string;
}

function VersionItem({
  version,
  isSelected,
  onSelect,
  formatRelativeTime,
}: VersionItemProps): React.ReactElement {
  return (
    <div
      className={`version-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="version-item-header">
        <span className="version-label">
          {version.label || `Version ${version.version_number}`}
        </span>
        {version.is_snapshot && (
          <span className="version-badge">Snapshot</span>
        )}
      </div>
      <div className="version-meta">
        {formatRelativeTime(version.created_at)}
        {version.created_by && ` • ${version.created_by}`}
      </div>
    </div>
  );
}

export default VersionHistoryPanel;
