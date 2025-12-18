/**
 * ValidationTable - Tableau de validation (signatures)
 * Per Constitution Section 3 - Special Tables
 */
import { useState, useCallback } from 'react';
import { CheckCircle, Plus, Trash2, Edit2, Check, X, Clock, XCircle } from 'lucide-react';
import type { ValidationTableData, ValidationEntry } from '../../../types/specialTables';
import {
  SPECIAL_TABLE_COLORS,
  VALIDATION_STATUS_LABELS,
  VALIDATION_STATUS_COLORS,
} from '../../../types/specialTables';

export interface ValidationTableProps {
  /** Table data */
  data: ValidationTableData;
  /** Callback when data changes */
  onChange?: (data: ValidationTableData) => void;
  /** Whether the table is editable */
  editable?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * ValidationTable - Displays validation/signature entries
 */
export function ValidationTable({
  data,
  onChange,
  editable = true,
  className = '',
}: ValidationTableProps): JSX.Element {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Partial<ValidationEntry>>({});

  const colors = SPECIAL_TABLE_COLORS.validation;

  /**
   * Add a new validation entry
   */
  const handleAddEntry = useCallback(() => {
    if (!onChange) return;

    const newEntry: ValidationEntry = {
      role: 'Nouveau rôle',
      name: '',
      date: null,
      signature: null,
      status: 'pending',
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
  const handleStartEdit = useCallback((index: number, entry: ValidationEntry) => {
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
    } as ValidationEntry;

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
    <K extends keyof ValidationEntry>(key: K, value: ValidationEntry[K]) => {
      setEditValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  /**
   * Toggle validation status
   */
  const handleToggleStatus = useCallback(
    (index: number, currentStatus: ValidationEntry['status']) => {
      if (!onChange) return;

      const statusCycle: ValidationEntry['status'][] = ['pending', 'approved', 'rejected'];
      const currentIndex = statusCycle.indexOf(currentStatus);
      const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

      const newEntries = [...data.entries];
      newEntries[index] = {
        ...newEntries[index],
        status: nextStatus,
        date: nextStatus !== 'pending' ? new Date().toLocaleDateString('fr-FR') : null,
      };

      onChange({ ...data, entries: newEntries });
    },
    [data, onChange]
  );

  /**
   * Render status icon
   */
  const renderStatusIcon = (status: ValidationEntry['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={18} className="text-red-600" />;
      default:
        return <Clock size={18} className="text-yellow-600" />;
    }
  };

  /**
   * Render status badge
   */
  const renderStatus = (status: ValidationEntry['status']) => {
    const statusColors = VALIDATION_STATUS_COLORS[status];
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 500,
          backgroundColor: statusColors.bg,
          color: statusColors.text,
        }}
      >
        {renderStatusIcon(status)}
        {VALIDATION_STATUS_LABELS[status]}
      </span>
    );
  };

  return (
    <div
      className={`special-table validation-table ${className}`}
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
        <CheckCircle size={18} />
        <span>{data.title}</span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead>
            <tr>
              {['Rôle', 'Nom', 'Date', 'Signature', 'Statut'].map((header) => (
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
                        value={editValues.role || ''}
                        onChange={(e) => updateEditValue('role', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                        }}
                      />
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      <input
                        type="text"
                        value={editValues.name || ''}
                        onChange={(e) => updateEditValue('name', e.target.value)}
                        style={{
                          width: '100%',
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
                        onChange={(e) => updateEditValue('date', e.target.value || null)}
                        placeholder="JJ/MM/AAAA"
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
                        value={editValues.signature || ''}
                        onChange={(e) => updateEditValue('signature', e.target.value || null)}
                        placeholder="Signature"
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
                        value={editValues.status || 'pending'}
                        onChange={(e) =>
                          updateEditValue('status', e.target.value as ValidationEntry['status'])
                        }
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                        }}
                      >
                        {Object.entries(VALIDATION_STATUS_LABELS).map(([value, label]) => (
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
                      {entry.role}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {entry.name || (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Non renseigné</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {entry.date ? (
                        typeof entry.date === 'string' ? (
                          entry.date
                        ) : (
                          entry.date.toLocaleDateString('fr-FR')
                        )
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {entry.signature ? (
                        <span
                          style={{
                            fontFamily: 'cursive',
                            fontSize: '14px',
                            color: '#1e40af',
                          }}
                        >
                          {entry.signature}
                        </span>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                      {editable ? (
                        <button
                          onClick={() => handleToggleStatus(index, entry.status)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                          title="Cliquez pour changer le statut"
                        >
                          {renderStatus(entry.status)}
                        </button>
                      ) : (
                        renderStatus(entry.status)
                      )}
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
            Ajouter un validateur
          </button>
        )}
      </div>
    </div>
  );
}

export default ValidationTable;
