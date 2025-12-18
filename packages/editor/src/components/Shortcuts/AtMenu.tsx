/**
 * AtMenu - Floating menu for @mentions
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useEffect, useRef } from 'react';
import { User, Package, FileText, Anchor, Star } from 'lucide-react';
import {
  type MentionType,
  type MentionData,
  MENTION_COLORS,
  MENTION_TYPE_LABELS,
} from '../../types/mention';

export interface AtMenuProps {
  /** Filtered items to display */
  items: MentionData[];
  /** Items grouped by type */
  groupedItems: Map<MentionType, MentionData[]>;
  /** Currently selected index */
  selectedIndex: number;
  /** Callback when item is selected */
  onSelect: (item: MentionData) => void;
  /** Callback when hover changes selection */
  onHover: (index: number) => void;
  /** Position of the menu */
  position: { top: number; left: number };
  /** Current search query */
  query: string;
}

/**
 * Get icon component for mention type
 */
function MentionIcon({
  type,
  size = 16,
}: {
  type: MentionType;
  size?: number;
}): JSX.Element {
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
 * Highlight matching text in label
 */
function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}): JSX.Element {
  if (!query) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark style={highlightStyles}>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

/**
 * AtMenu - Component for displaying @mention search results
 */
export function AtMenu({
  items,
  groupedItems,
  selectedIndex,
  onSelect,
  onHover,
  position,
  query,
}: AtMenuProps): JSX.Element | null {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && menuRef.current) {
      const menu = menuRef.current;
      const item = selectedItemRef.current;
      const menuRect = menu.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();

      if (itemRect.top < menuRect.top) {
        item.scrollIntoView({ block: 'nearest' });
      } else if (itemRect.bottom > menuRect.bottom) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Track global index for keyboard navigation
  let globalIndex = 0;

  // Group order
  const groupOrder: MentionType[] = ['user', 'product', 'document', 'anchor'];

  // No results message
  if (items.length === 0) {
    return (
      <div
        style={{
          ...menuStyles,
          top: position.top,
          left: position.left,
        }}
      >
        <div style={emptyStyles}>
          Aucun résultat pour "@{query}"
        </div>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      style={{
        ...menuStyles,
        top: position.top,
        left: position.left,
      }}
      className="at-menu"
    >
      {/* Render groups in order */}
      {groupOrder.map((type) => {
        const groupItems = groupedItems.get(type);
        if (!groupItems || groupItems.length === 0) return null;

        const colors = MENTION_COLORS[type];
        const startIndex = globalIndex;

        return (
          <div key={type} style={groupStyles}>
            {/* Group Header */}
            <div style={{ ...groupHeaderStyles, color: colors.text }}>
              <MentionIcon type={type} size={12} />
              <span>{MENTION_TYPE_LABELS[type]}</span>
            </div>

            {/* Group Items */}
            {groupItems.map((item, itemIndex) => {
              const currentGlobalIndex = startIndex + itemIndex;
              const isSelected = currentGlobalIndex === selectedIndex;
              globalIndex++;

              return (
                <div
                  key={item.id}
                  ref={isSelected ? selectedItemRef : undefined}
                  style={{
                    ...itemStyles,
                    backgroundColor: isSelected ? '#f3f4f6' : 'transparent',
                  }}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => onHover(currentGlobalIndex)}
                >
                  {/* Avatar or Icon */}
                  <div style={itemIconStyles}>
                    {item.type === 'user' && item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.name}
                        style={avatarStyles}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          ...iconPlaceholderStyles,
                          backgroundColor: colors.bg,
                          color: colors.icon,
                        }}
                      >
                        <MentionIcon type={item.type} size={14} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={itemContentStyles}>
                    <div style={itemNameStyles}>
                      <HighlightMatch text={item.name} query={query} />
                      {item.isPriority && (
                        <Star size={12} style={priorityIconStyles} fill="#f59e0b" />
                      )}
                    </div>
                    {item.description && (
                      <div style={itemDescriptionStyles}>
                        {item.description}
                      </div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div
                    style={{
                      ...typeBadgeStyles,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border,
                    }}
                  >
                    {item.type}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Footer with hint */}
      <div style={footerStyles}>
        <span style={footerHintStyles}>
          ↑↓ naviguer • ↵ sélectionner • esc fermer
        </span>
      </div>
    </div>
  );
}

// Styles
const menuStyles: React.CSSProperties = {
  position: 'absolute',
  zIndex: 9999,
  minWidth: '280px',
  maxWidth: '360px',
  maxHeight: '320px',
  overflowY: 'auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
  border: '1px solid #e5e7eb',
  padding: '4px 0',
};

const groupStyles: React.CSSProperties = {
  marginBottom: '4px',
};

const groupHeaderStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px 4px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  position: 'sticky',
  top: 0,
  backgroundColor: '#ffffff',
  zIndex: 1,
};

const itemStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 12px',
  cursor: 'pointer',
  transition: 'background-color 0.1s ease',
};

const itemIconStyles: React.CSSProperties = {
  flexShrink: 0,
};

const avatarStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  objectFit: 'cover',
};

const iconPlaceholderStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const itemContentStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const itemNameStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#1f2937',
};

const itemDescriptionStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const typeBadgeStyles: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'capitalize',
  border: '1px solid',
  flexShrink: 0,
};

const priorityIconStyles: React.CSSProperties = {
  color: '#f59e0b',
};

const footerStyles: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  padding: '6px 12px',
  marginTop: '4px',
};

const footerHintStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const emptyStyles: React.CSSProperties = {
  padding: '16px 12px',
  textAlign: 'center',
  color: '#6b7280',
  fontSize: '13px',
};

const highlightStyles: React.CSSProperties = {
  backgroundColor: '#fef08a',
  color: 'inherit',
  padding: '0 1px',
  borderRadius: '2px',
};

export default AtMenu;
