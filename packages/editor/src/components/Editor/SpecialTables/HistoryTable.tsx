/**
 * HistoryTable - Historique des versions
 * Per Constitution Section 3 - Special Tables
 */
import { useState, useCallback } from 'react';
import { History, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { HistoryTableData, HistoryEntry } from '../../../types/specialTables';
import {
  SPECIAL_TABLE_COLORS,
  HISTORY_STATUS_LABELS,
  HISTORY_STATUS_COLORS,
} from '../../../types/specialTables';

export interface HistoryTableProps {
  /** Table data */
  data: HistoryTableData;
  /** Callback when data changes */
  onChange?: (data: HistoryTableData) => void;
  /** Whether the table is editable */
  editable?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * HistoryTable - Displays version history
 */
export function HistoryTable({
  data,
  onChange,
  editable = true,
  className = '',
}: HistoryTableProps): JSX.Element {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<HistoryEntry>>({});

  const colors = SPECIAL_TABLE_COLORS.history;

  /**
   * Add a new history entry
   */
  const handleAddEntry = useCallback(() => {
    if (!onChange) return;

    const lastEntry = data.entries[data.entries.length - 1];
    const newVersion = lastEntry
      ? `${(parseFloat(lastEntry.version) + 0.1).toFixed(1)}`
      : '1.0';

    const newEntry: HistoryEntry = {
      version: newVersion,
      date: new Date().toLocaleDateString('fr-FR'),
      author: '',
      description: '',
      status: 'draft',
    };

    onChange({
      ...data,
      entries: [...data.entries, newEntry],
    });
  }, [data, onChange]);

  /**
   * Remove an entry
   */
  const handleRemoveEntry = useCallback(
    (index: number) => {
      if (!onChange) return;

      onChange({
        ...data,
        entries: data.entries.filter((_, i) => i !== index),
      });
    },
    [data, onChange]
  );

  /**
   * Start editing a row
   */
  const handleStartEdit = useCallback((index: number, entry: HistoryEntry) => {
    setEditingRow(index);
    setEditValues({ ...entry });
  }, []);

  /**
   * Save row edit
   */
  const handleSaveEdit = useCallback(() => {
    if (!onChange || editingRow === null) return;

    const newEntries = [...data.entries];
    newEntries[editingRow] = {
      ...newEntries[editingRow],
      ...editValues,
    } as HistoryEntry;

    onChange({ ...data, entries: newEntries });
    setEditingRow(null);
    setEditValues({});
  }, [data, onChange, editingRow, editValues]);

  /**
   * Cancel editing
   */
  const handleCancelEdit = useCallback(() => {
    setEditingRow(null);
    setEditValues({});
  }, []);

  /**
   * Update edit value
   */
  const updateEditValue = useCallback(
    <K extends keyof HistoryEntry>(key: K, value: HistoryEntry[K]) => {
      setEditValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Render status badge
   */
  const renderStatus = (status: HistoryEntry['status']) => {
    if (!status) return null;
    const statusColors = HISTORY_STATUS_COLORS[status];
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '11px',
          fontWeight: 500,
          backgroundColor: statusColors.bg,
          color: statusColors.text,
        }}
      >
        {HISTORY_STATUS_LABELS[status]}
      </span>
    );
  };

  return (
    <div
      className={`special-table history-table ${className}`}
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.header,
          color: 'white',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 600,
        }}
      >
        <History size={18} />
        <span>{data.title}</span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr>
              {['Version', 'Date', 'Auteur', 'Description', 'Statut'].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderBottom: `2px solid ${colors.border}`,
                    fontWeight: 600,
                    color: colors.header,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header}
                </th>
              ))}
              {editable && (
                <th
                  style={{
                    width: '80px',
                    padding: '8px 12px',
                    borderBottom: `2px solid ${colors.border}`,
                  }}
                />
              )}
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry, index) => (
              <tr key={index}>
                {editingRow === index ? (
                  // Edit mode
                  <>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={editValues.version || ''}
                        onChange={(e) => updateEditValue('version', e.target.value)}
                        style={{
                          width: '60px',
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={String(editValues.date || '')}
                        onChange={(e) => updateEditValue('date', e.target.value)}
                        style={{
                          width: '100px',
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={editValues.author || ''}
                        onChange={(e) => updateEditValue('author', e.target.value)}
                        style={{
                          width: '120px',
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={editValues.description || ''}
                        onChange={(e) => updateEditValue('description', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <select
                        value={editValues.status || 'draft'}
                        onChange={(e) =>
                          updateEditValue('status', e.target.value as HistoryEntry['status'])
                        }
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                        }}
                      >
                        {Object.entries(HISTORY_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={handleSaveEdit}
                          style={{
                            padding: '4px',
                            background: '#22c55e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '4px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // View mode
                  <>
                    <td
                      style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid #e2e8f0',
                        fontWeight: 500,
                      }}
                    >
                      {entry.version}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {typeof entry.date === 'string'
                        ? entry.date
                        : entry.date.toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {entry.author}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {entry.description}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {renderStatus(entry.status)}
                    </td>
                    {editable && (
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleStartEdit(index, entry)}
                            style={{
                              padding: '4px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#6b7280',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveEntry(index)}
                            style={{
                              padding: '4px',
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#ef4444',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {editable && (
          <button
            onClick={handleAddEntry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              marginTop: '12px',
              background: 'white',
              border: `1px dashed ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              color: colors.header,
              fontWeight: 500,
            }}
          >
            <Plus size={16} />
            Ajouter une version
          </button>
        )}
      </div>
    </div>
  );
}

export default HistoryTable;
