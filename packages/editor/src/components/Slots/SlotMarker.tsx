/**
 * SlotMarker - Visual component for slot markers in the editor
 * Per Constitution Section 5 - Slots & Dynamic Variables
 */
import { useCallback, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import type { NodeKey } from 'lexical';
import {
  type SlotType,
  type SlotRole,
  type SlotMetadata,
  SLOT_COLORS,
  SLOT_TYPE_ICONS,
  SLOT_TYPE_LABELS,
} from '../../types/slot';
import { useSlotStore } from '../../stores/slotStore';

export interface SlotMarkerProps {
  nodeKey: NodeKey;
  slotId: string;
  slotType: SlotType;
  role: SlotRole;
  metadata: SlotMetadata;
}

/**
 * SlotMarker - React component for rendering slot markers
 */
export function SlotMarker({
  nodeKey,
  slotId,
  slotType,
  role,
  metadata,
}: SlotMarkerProps): JSX.Element {
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [showTooltip, setShowTooltip] = useState(false);

  const colors = SLOT_COLORS[slotType];
  const typeLabel = SLOT_TYPE_LABELS[slotType];

  // Get slot from store for additional info
  const slot = useSlotStore((state) => state.getSlot(slotId));

  /**
   * Handle click to select the marker
   */
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      clearSelection();
      setSelected(true);
    },
    [clearSelection, setSelected]
  );

  /**
   * Handle double click to edit metadata
   */
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // TODO: Open metadata editor dialog
      console.log('[SlotMarker] Double-clicked, edit metadata:', slotId);
    },
    [slotId]
  );

  return (
    <span
      className={`slot-marker-component ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        ...markerStyles,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        outline: isSelected ? `2px solid ${colors.border}` : 'none',
        outlineOffset: '1px',
      }}
      title={`${typeLabel} - ${metadata.label || 'Unnamed'} (${role})`}
    >
      {/* Icon */}
      <span style={iconStyles}>{SLOT_TYPE_ICONS[slotType]}</span>

      {/* Label (only for start markers) */}
      {role === 'start' && metadata.label && (
        <span style={labelStyles}>
          {metadata.label.length > 12
            ? `${metadata.label.substring(0, 12)}...`
            : metadata.label}
        </span>
      )}

      {/* End marker indicator */}
      {role === 'end' && <span style={endIndicatorStyles}>/</span>}

      {/* Required indicator */}
      {role === 'start' && metadata.required && (
        <span style={requiredStyles}>*</span>
      )}

      {/* Filled indicator */}
      {slot?.isFilled && (
        <span style={filledStyles}>&#10003;</span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div style={tooltipStyles}>
          <div style={tooltipHeaderStyles}>
            <span style={{ fontWeight: 600 }}>{typeLabel}</span>
            <span style={{ opacity: 0.7, marginLeft: '4px' }}>({role})</span>
          </div>
          {metadata.label && (
            <div style={tooltipRowStyles}>
              <strong>Label:</strong> {metadata.label}
            </div>
          )}
          {metadata.description && (
            <div style={tooltipRowStyles}>
              <strong>Description:</strong> {metadata.description}
            </div>
          )}
          {metadata.required && (
            <div style={{ ...tooltipRowStyles, color: '#ef4444' }}>
              Required field
            </div>
          )}
          {slot?.isFilled && slot.value && (
            <div style={{ ...tooltipRowStyles, color: '#22c55e' }}>
              <strong>Value:</strong> {slot.value.substring(0, 50)}
              {slot.value.length > 50 ? '...' : ''}
            </div>
          )}
          <div style={{ ...tooltipRowStyles, opacity: 0.5, fontSize: '9px' }}>
            ID: {slotId.substring(0, 8)}...
          </div>
        </div>
      )}
    </span>
  );
}

// Styles
const markerStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  padding: '1px 4px',
  borderRadius: '3px',
  border: '1px solid',
  fontSize: '11px',
  fontWeight: 500,
  fontFamily: 'monospace',
  cursor: 'pointer',
  userSelect: 'none',
  verticalAlign: 'baseline',
  position: 'relative',
  whiteSpace: 'nowrap',
};

const iconStyles: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
};

const labelStyles: React.CSSProperties = {
  marginLeft: '2px',
  fontSize: '10px',
};

const endIndicatorStyles: React.CSSProperties = {
  fontSize: '10px',
  marginRight: '1px',
};

const requiredStyles: React.CSSProperties = {
  color: '#ef4444',
  marginLeft: '1px',
  fontSize: '12px',
  fontWeight: 700,
};

const filledStyles: React.CSSProperties = {
  color: '#22c55e',
  marginLeft: '2px',
  fontSize: '10px',
};

const tooltipStyles: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: '0',
  marginTop: '4px',
  padding: '8px 10px',
  backgroundColor: '#1f2937',
  color: '#ffffff',
  borderRadius: '6px',
  fontSize: '11px',
  lineHeight: 1.4,
  zIndex: 1000,
  minWidth: '150px',
  maxWidth: '250px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  pointerEvents: 'none',
};

const tooltipHeaderStyles: React.CSSProperties = {
  marginBottom: '4px',
  paddingBottom: '4px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
};

const tooltipRowStyles: React.CSSProperties = {
  marginTop: '3px',
};

export default SlotMarker;
