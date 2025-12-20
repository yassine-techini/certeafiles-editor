/**
 * SlashMenu - Floating menu for "/" commands
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useRef, useEffect, useMemo } from 'react';
import {
  Sparkles,
  AtSign,
  Database,
  Anchor,
  LayoutTemplate,
  MessageSquareDashed,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Table,
  Image,
  Minus,
  Quote,
  Code,
  FileText,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import type { SlashMenuItem } from '../../types/slashMenu';

/**
 * Icon mapping for slash menu items
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  AtSign,
  Database,
  Anchor,
  LayoutTemplate,
  MessageSquareDashed,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Table,
  Image,
  Minus,
  Quote,
  Code,
  FileBreak: FileText,
  MessageSquare,
  HelpCircle,
  Lightbulb,
};

export interface SlashMenuProps {
  /** Items to display */
  items: SlashMenuItem[];
  /** Grouped items by category */
  groupedItems: Map<string, SlashMenuItem[]>;
  /** Currently selected index */
  selectedIndex: number;
  /** Callback when item is clicked */
  onSelect: (item: SlashMenuItem) => void;
  /** Callback when mouse hovers an item */
  onHover: (index: number) => void;
  /** Position of the menu */
  position: { top: number; left: number };
  /** Current query string */
  query: string;
}

/**
 * Get icon component for menu item
 */
function getIcon(iconName: string | undefined): LucideIcon | null {
  if (!iconName) return null;
  return ICON_MAP[iconName] || null;
}

/**
 * Highlight matching text in label
 */
function HighlightedLabel({
  label,
  query,
}: {
  label: string;
  query: string;
}): JSX.Element {
  if (!query) {
    return <>{label}</>;
  }

  const lowerLabel = label.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerLabel.indexOf(lowerQuery);

  if (index === -1) {
    return <>{label}</>;
  }

  return (
    <>
      {label.slice(0, index)}
      <span className="bg-yellow-200 text-yellow-900 rounded px-0.5">
        {label.slice(index, index + query.length)}
      </span>
      {label.slice(index + query.length)}
    </>
  );
}

/**
 * SlashMenuItem component
 */
function SlashMenuItemComponent({
  item,
  isSelected,
  onClick,
  onMouseEnter,
  query,
}: {
  item: SlashMenuItem;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  query: string;
}): JSX.Element {
  const Icon = getIcon(item.icon);
  const itemRef = useRef<HTMLButtonElement>(null);

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isSelected]);

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 text-blue-900'
          : 'hover:bg-gray-50 text-gray-700'
      }`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isSelected ? 'bg-blue-100' : 'bg-gray-100'
        }`}
      >
        {Icon && (
          <Icon
            size={18}
            className={isSelected ? 'text-blue-600' : 'text-gray-500'}
          />
        )}
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">
          <HighlightedLabel label={item.label} query={query} />
        </div>
        {item.description && (
          <div className="text-xs text-gray-500 truncate">
            {item.description}
          </div>
        )}
      </div>

      {/* Shortcut hint */}
      {item.shortcut && (
        <span className="flex-shrink-0 text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
          {item.shortcut}
        </span>
      )}
    </button>
  );
}

/**
 * SlashMenu - Floating command menu component
 */
export function SlashMenu({
  items,
  groupedItems,
  selectedIndex,
  onSelect,
  onHover,
  position,
  query,
}: SlashMenuProps): JSX.Element | null {
  const menuRef = useRef<HTMLDivElement>(null);

  // Calculate cumulative index for grouped items
  const indexMap = useMemo(() => {
    const map = new Map<string, number>();
    let currentIndex = 0;

    for (const [_category, categoryItems] of groupedItems) {
      for (const item of categoryItems) {
        map.set(item.id, currentIndex);
        currentIndex++;
      }
    }

    return map;
  }, [groupedItems]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Adjust if menu goes below viewport
      if (rect.bottom > viewportHeight - 20) {
        menuRef.current.style.top = `${position.top - rect.height - 10}px`;
      }

      // Adjust if menu goes beyond right edge
      if (rect.right > viewportWidth - 20) {
        menuRef.current.style.left = `${viewportWidth - rect.width - 20}px`;
      }
    }
  }, [position]);

  if (items.length === 0) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-3 px-4"
        style={{ top: position.top, left: position.left }}
      >
        <p className="text-sm text-gray-500">No results found</p>
        <p className="text-xs text-gray-400 mt-1">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: '320px',
        width: '320px',
      }}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b bg-gray-50">
        <p className="text-xs text-gray-500">
          {query ? (
            <>
              Results for "<span className="font-medium">{query}</span>"
            </>
          ) : (
            'Type to filter commands'
          )}
        </p>
      </div>

      {/* Items list */}
      <div className="overflow-y-auto max-h-[260px]">
        {Array.from(groupedItems.entries()).map(([category, categoryItems]) => (
          <div key={category}>
            {/* Category header */}
            <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/50">
              {category}
            </div>

            {/* Category items */}
            {categoryItems.map((item) => {
              const itemIndex = indexMap.get(item.id) ?? 0;
              return (
                <SlashMenuItemComponent
                  key={item.id}
                  item={item}
                  isSelected={itemIndex === selectedIndex}
                  onClick={() => onSelect(item)}
                  onMouseEnter={() => onHover(itemIndex)}
                  query={query}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t bg-gray-50 flex items-center gap-3 text-xs text-gray-400">
        <span>
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">↑↓</kbd> Navigate
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">↵</kbd> Select
        </span>
        <span>
          <kbd className="px-1 py-0.5 bg-gray-200 rounded text-gray-600">Esc</kbd> Close
        </span>
      </div>
    </div>
  );
}

export default SlashMenu;
