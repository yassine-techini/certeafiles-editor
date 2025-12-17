/**
 * PlusMenu - Floating menu for "+" dynamic fields
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useEffect, useRef } from 'react';
import {
  Hash,
  Layers,
  FileStack,
  Calendar,
  Clock,
  CalendarClock,
  GitBranch,
  Type,
  User,
  Image,
  File,
} from 'lucide-react';
import {
  type DynamicFieldType,
  type DynamicFieldConfig,
  DYNAMIC_FIELD_COLORS,
  DYNAMIC_FIELD_CATEGORIES,
} from '../../types/dynamicField';

/**
 * Plus menu item structure
 */
export interface PlusMenuItem {
  id: string;
  fieldType: DynamicFieldType;
  label: string;
  description: string;
  preview: string;
  category: keyof typeof DYNAMIC_FIELD_CATEGORIES;
  config?: DynamicFieldConfig | undefined;
}

export interface PlusMenuProps {
  /** Items to display */
  items: PlusMenuItem[];
  /** Items grouped by category */
  groupedItems: Map<string, PlusMenuItem[]>;
  /** Currently selected index */
  selectedIndex: number;
  /** Callback when item is selected */
  onSelect: (item: PlusMenuItem) => void;
  /** Callback when hover changes selection */
  onHover: (index: number) => void;
  /** Position of the menu */
  position: { top: number; left: number };
  /** Current search query */
  query: string;
  /** Current context (header, footer, or body) */
  context: 'header' | 'footer' | 'body';
}

/**
 * Get icon component for field type
 */
function FieldIcon({
  type,
  size = 16,
}: {
  type: DynamicFieldType;
  size?: number;
}): JSX.Element {
  const iconProps = { size, strokeWidth: 2 };

  switch (type) {
    case 'page_number':
      return <Hash {...iconProps} />;
    case 'total_pages':
      return <Layers {...iconProps} />;
    case 'page_of_total':
      return <FileStack {...iconProps} />;
    case 'date':
    case 'last_modified':
      return <Calendar {...iconProps} />;
    case 'time':
      return <Clock {...iconProps} />;
    case 'datetime':
      return <CalendarClock {...iconProps} />;
    case 'version':
      return <GitBranch {...iconProps} />;
    case 'title':
      return <Type {...iconProps} />;
    case 'author':
      return <User {...iconProps} />;
    case 'logo':
      return <Image {...iconProps} />;
    case 'filename':
      return <File {...iconProps} />;
    default:
      return <Hash {...iconProps} />;
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
 * PlusMenu - Component for displaying dynamic field options
 */
export function PlusMenu({
  items,
  groupedItems,
  selectedIndex,
  onSelect,
  onHover,
  position,
  query,
  context,
}: PlusMenuProps): JSX.Element | null {
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
  const groupOrder: (keyof typeof DYNAMIC_FIELD_CATEGORIES)[] = ['PAGE', 'DATE', 'DOCUMENT', 'MEDIA'];

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
          Aucun champ pour "+{query}"
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
      className="plus-menu"
    >
      {/* Header with context info */}
      <div style={headerStyles}>
        <span style={headerTitleStyles}>Champs dynamiques</span>
        <span style={contextBadgeStyles}>
          {context === 'header' ? 'En-tête' : context === 'footer' ? 'Pied de page' : 'Corps'}
        </span>
      </div>

      {/* Render groups in order */}
      {groupOrder.map((categoryKey) => {
        const categoryLabel = DYNAMIC_FIELD_CATEGORIES[categoryKey];
        const groupItems = groupedItems.get(categoryKey);
        if (!groupItems || groupItems.length === 0) return null;

        const startIndex = globalIndex;

        return (
          <div key={categoryKey} style={groupStyles}>
            {/* Group Header */}
            <div style={groupHeaderStyles}>
              {categoryLabel}
            </div>

            {/* Group Items */}
            {groupItems.map((item, itemIndex) => {
              const currentGlobalIndex = startIndex + itemIndex;
              const isSelected = currentGlobalIndex === selectedIndex;
              const colors = DYNAMIC_FIELD_COLORS[item.fieldType];
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
                  {/* Icon */}
                  <div
                    style={{
                      ...iconContainerStyles,
                      backgroundColor: colors.bg,
                      color: colors.text,
                    }}
                  >
                    <FieldIcon type={item.fieldType} size={14} />
                  </div>

                  {/* Content */}
                  <div style={itemContentStyles}>
                    <div style={itemLabelStyles}>
                      <HighlightMatch text={item.label} query={query} />
                    </div>
                    <div style={itemDescriptionStyles}>
                      {item.description}
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    style={{
                      ...previewStyles,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border,
                    }}
                  >
                    {item.preview}
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
          ↑↓ naviguer • ↵ insérer • esc fermer
        </span>
      </div>
    </div>
  );
}

// Styles
const menuStyles: React.CSSProperties = {
  position: 'absolute',
  zIndex: 9999,
  minWidth: '320px',
  maxWidth: '400px',
  maxHeight: '360px',
  overflowY: 'auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
  border: '1px solid #e5e7eb',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  borderBottom: '1px solid #e5e7eb',
  backgroundColor: '#f9fafb',
};

const headerTitleStyles: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
};

const contextBadgeStyles: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: '4px',
  fontSize: '10px',
  fontWeight: 500,
  backgroundColor: '#e0e7ff',
  color: '#4338ca',
};

const groupStyles: React.CSSProperties = {
  marginBottom: '4px',
};

const groupHeaderStyles: React.CSSProperties = {
  padding: '8px 12px 4px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#6b7280',
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

const iconContainerStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const itemContentStyles: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const itemLabelStyles: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#1f2937',
};

const itemDescriptionStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#6b7280',
  marginTop: '1px',
};

const previewStyles: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '11px',
  fontWeight: 500,
  border: '1px solid',
  flexShrink: 0,
  fontFamily: 'monospace',
};

const footerStyles: React.CSSProperties = {
  borderTop: '1px solid #e5e7eb',
  padding: '8px 12px',
  backgroundColor: '#f9fafb',
};

const footerHintStyles: React.CSSProperties = {
  fontSize: '11px',
  color: '#9ca3af',
};

const emptyStyles: React.CSSProperties = {
  padding: '20px 12px',
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

export default PlusMenu;
