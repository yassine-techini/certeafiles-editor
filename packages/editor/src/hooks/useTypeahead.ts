/**
 * useTypeahead - Generic typeahead/autocomplete logic
 * Per Constitution Section 5 - Shortcuts & Commands
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

/**
 * Generic typeahead item interface
 */
export interface TypeaheadItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string | undefined;
  /** Category for grouping */
  category?: string | undefined;
  /** Keywords for search matching */
  keywords?: string[] | undefined;
  /** Icon name or component */
  icon?: string | undefined;
  /** Whether item is disabled */
  disabled?: boolean | undefined;
}

/**
 * Options for useTypeahead hook
 */
export interface UseTypeaheadOptions<T extends TypeaheadItem> {
  /** List of all items */
  items: T[];
  /** Current query string */
  query: string;
  /** Callback when item is selected */
  onSelect: (item: T) => void;
  /** Callback when menu should close */
  onClose: () => void;
  /** Maximum number of results to show */
  maxResults?: number | undefined;
  /** Whether to match from start of string only */
  matchFromStart?: boolean | undefined;
  /** Custom filter function */
  filterFn?: ((item: T, query: string) => boolean) | undefined;
  /** Custom sort function */
  sortFn?: ((a: T, b: T, query: string) => number) | undefined;
}

/**
 * Result of useTypeahead hook
 */
export interface UseTypeaheadResult<T extends TypeaheadItem> {
  /** Filtered and sorted items */
  filteredItems: T[];
  /** Items grouped by category */
  groupedItems: Map<string, T[]>;
  /** Currently selected index */
  selectedIndex: number;
  /** Set selected index */
  setSelectedIndex: (index: number) => void;
  /** Handle keyboard navigation */
  handleKeyDown: (event: KeyboardEvent | React.KeyboardEvent) => boolean;
  /** Select current item */
  selectCurrent: () => void;
  /** Move selection up */
  moveUp: () => void;
  /** Move selection down */
  moveDown: () => void;
  /** Whether there are any results */
  hasResults: boolean;
  /** Get item at index */
  getItemAt: (index: number) => T | undefined;
}

/**
 * Default filter function - matches query against label, description, and keywords
 */
function defaultFilter<T extends TypeaheadItem>(
  item: T,
  query: string,
  matchFromStart: boolean
): boolean {
  if (!query) return true;

  const lowerQuery = query.toLowerCase();

  // Check label
  const labelMatch = matchFromStart
    ? item.label.toLowerCase().startsWith(lowerQuery)
    : item.label.toLowerCase().includes(lowerQuery);

  if (labelMatch) return true;

  // Check description
  if (item.description) {
    const descMatch = item.description.toLowerCase().includes(lowerQuery);
    if (descMatch) return true;
  }

  // Check keywords
  if (item.keywords) {
    const keywordMatch = item.keywords.some((keyword) =>
      keyword.toLowerCase().includes(lowerQuery)
    );
    if (keywordMatch) return true;
  }

  return false;
}

/**
 * Default sort function - prioritizes exact matches and label matches
 */
function defaultSort<T extends TypeaheadItem>(
  a: T,
  b: T,
  query: string
): number {
  if (!query) {
    // Sort by category first, then by label
    if (a.category !== b.category) {
      return (a.category || '').localeCompare(b.category || '');
    }
    return a.label.localeCompare(b.label);
  }

  const lowerQuery = query.toLowerCase();
  const aLabel = a.label.toLowerCase();
  const bLabel = b.label.toLowerCase();

  // Exact match first
  if (aLabel === lowerQuery && bLabel !== lowerQuery) return -1;
  if (bLabel === lowerQuery && aLabel !== lowerQuery) return 1;

  // Starts with query
  const aStarts = aLabel.startsWith(lowerQuery);
  const bStarts = bLabel.startsWith(lowerQuery);
  if (aStarts && !bStarts) return -1;
  if (bStarts && !aStarts) return 1;

  // Alphabetical
  return aLabel.localeCompare(bLabel);
}

/**
 * Group items by category
 */
function groupByCategory<T extends TypeaheadItem>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const category = item.category || 'Other';
    const existing = groups.get(category);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(category, [item]);
    }
  }

  return groups;
}

/**
 * useTypeahead - Generic typeahead/autocomplete hook
 */
export function useTypeahead<T extends TypeaheadItem>({
  items,
  query,
  onSelect,
  onClose,
  maxResults = 10,
  matchFromStart = false,
  filterFn,
  sortFn,
}: UseTypeaheadOptions<T>): UseTypeaheadResult<T> {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Track previous query to reset selection
  const prevQueryRef = useRef(query);

  // Filter items
  const filteredItems = useMemo(() => {
    const filter = filterFn || ((item: T, q: string) => defaultFilter(item, q, matchFromStart));
    const sort = sortFn || defaultSort;

    return items
      .filter((item) => !item.disabled && filter(item, query))
      .sort((a, b) => sort(a, b, query))
      .slice(0, maxResults);
  }, [items, query, maxResults, matchFromStart, filterFn, sortFn]);

  // Group items by category
  const groupedItems = useMemo(
    () => groupByCategory(filteredItems),
    [filteredItems]
  );

  // Reset selection when query changes
  useEffect(() => {
    if (query !== prevQueryRef.current) {
      setSelectedIndex(0);
      prevQueryRef.current = query;
    }
  }, [query]);

  // Ensure selection is within bounds
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  // Get item at index
  const getItemAt = useCallback(
    (index: number): T | undefined => {
      return filteredItems[index];
    },
    [filteredItems]
  );

  // Move selection up
  const moveUp = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev <= 0) {
        return filteredItems.length - 1; // Wrap to end
      }
      return prev - 1;
    });
  }, [filteredItems.length]);

  // Move selection down
  const moveDown = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev >= filteredItems.length - 1) {
        return 0; // Wrap to start
      }
      return prev + 1;
    });
  }, [filteredItems.length]);

  // Select current item
  const selectCurrent = useCallback(() => {
    const item = filteredItems[selectedIndex];
    if (item) {
      onSelect(item);
    }
  }, [filteredItems, selectedIndex, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: KeyboardEvent | React.KeyboardEvent): boolean => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          moveUp();
          return true;

        case 'ArrowDown':
          event.preventDefault();
          moveDown();
          return true;

        case 'Enter':
        case 'Tab':
          if (filteredItems.length > 0) {
            event.preventDefault();
            selectCurrent();
            return true;
          }
          break;

        case 'Escape':
          event.preventDefault();
          onClose();
          return true;
      }

      return false;
    },
    [moveUp, moveDown, selectCurrent, onClose, filteredItems.length]
  );

  return {
    filteredItems,
    groupedItems,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    selectCurrent,
    moveUp,
    moveDown,
    hasResults: filteredItems.length > 0,
    getItemAt,
  };
}

export default useTypeahead;
