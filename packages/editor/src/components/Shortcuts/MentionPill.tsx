/**
 * MentionPill - Figma-style pill for displaying mentions
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useCallback, useState } from 'react';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import type { NodeKey } from 'lexical';
import { User, Package, FileText, Anchor } from 'lucide-react';
import { type MentionType, MENTION_COLORS } from '../../types/mention';

export interface MentionPillProps {
  nodeKey: NodeKey;
  mentionId: string;
  mentionType: MentionType;
  name: string;
  avatarUrl?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Get icon component for mention type
 */
function MentionIcon({ type, size = 12 }: { type: MentionType; size?: number }): JSX.Element {
  const iconProps = { size, strokeWidth: 2 };

  switch (type) {
    case 'user':
      return <User {...iconProps} />;
    case 'product':
      return <Package {...iconProps} />;
    case 'document':
      return <FileText {...iconProps} />;
    case 'anchor':
      return <Anchor {...iconProps} />;
    default:
      return <User {...iconProps} />;
  }
}

/**
 * MentionPill - React component for rendering mentions as colored pills
 */
export function MentionPill({
  nodeKey,
  mentionId,
  mentionType,
  name,
  avatarUrl,
}: MentionPillProps): JSX.Element {
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [showTooltip, setShowTooltip] = useState(false);

  const colors = MENTION_COLORS[mentionType];

  /**
   * Handle click to select the mention
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

  return (
    <span
      className={`mention-pill ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{
        ...pillStyles,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        outline: isSelected ? `2px solid ${colors.border}` : 'none',
        outlineOffset: '1px',
      }}
      data-mention-id={mentionId}
      data-mention-type={mentionType}
    >
      {/* Avatar or Icon */}
      {mentionType === 'user' && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          style={avatarStyles}
          onError={(e) => {
            // Fallback to icon on error
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span style={{ ...iconContainerStyles, color: colors.icon }}>
          <MentionIcon type={mentionType} size={11} />
        </span>
      )}

      {/* Name */}
      <span style={nameStyles}>
        @{name.length > 20 ? `${name.substring(0, 20)}...` : name}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div style={tooltipStyles}>
          <div style={tooltipContentStyles}>
            {mentionType === 'user' && avatarUrl && (
              <img src={avatarUrl} alt={name} style={tooltipAvatarStyles} />
            )}
            <div>
              <div style={{ fontWeight: 600 }}>{name}</div>
              <div style={{ opacity: 0.7, fontSize: '10px', textTransform: 'capitalize' }}>
                {mentionType}
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}

// Styles
const pillStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '3px',
  padding: '2px 6px',
  borderRadius: '12px',
  border: '1px solid',
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  userSelect: 'none',
  verticalAlign: 'baseline',
  position: 'relative',
  whiteSpace: 'nowrap',
  transition: 'all 0.15s ease',
};

const avatarStyles: React.CSSProperties = {
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  objectFit: 'cover',
};

const iconContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const nameStyles: React.CSSProperties = {
  fontWeight: 500,
  lineHeight: 1,
};

const tooltipStyles: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  marginTop: '6px',
  padding: '8px 12px',
  backgroundColor: '#1f2937',
  color: '#ffffff',
  borderRadius: '8px',
  fontSize: '12px',
  lineHeight: 1.4,
  zIndex: 1000,
  minWidth: '120px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  pointerEvents: 'none',
};

const tooltipContentStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const tooltipAvatarStyles: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  objectFit: 'cover',
};

export default MentionPill;
