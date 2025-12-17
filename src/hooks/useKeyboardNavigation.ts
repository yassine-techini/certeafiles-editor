/**
 * useKeyboardNavigation - Hook for accessible keyboard navigation
 * Provides keyboard shortcuts and focus management
 */
import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

export interface UseKeyboardNavigationOptions {
  shortcuts?: KeyboardShortcut[];
  enabled?: boolean;
  scope?: HTMLElement | null;
}

/**
 * Check if a keyboard event matches a shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
  const shiftMatches = !!shortcut.shift === event.shiftKey;
  const altMatches = !!shortcut.alt === event.altKey;

  return keyMatches && ctrlMatches && shiftMatches && altMatches;
}

/**
 * useKeyboardNavigation - Manages keyboard shortcuts
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const { shortcuts = [], enabled = true, scope = null } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(event, shortcut)) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    const targetElement = scope || document;
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, scope]);

  return {
    shortcuts,
  };
}

/**
 * useFocusTrap - Traps focus within a container for modals
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus the first element
    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous element
      previousActiveElement.current?.focus();
    };
  }, [isActive, containerRef]);
}

/**
 * useArrowNavigation - Arrow key navigation for lists
 */
export function useArrowNavigation<T extends HTMLElement>(
  items: React.RefObject<T>[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', wrap = true, onSelect } = options;
  const currentIndex = useRef(0);

  const navigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const count = items.length;
      if (count === 0) return;

      let newIndex = currentIndex.current;
      const isVerticalNav = direction === 'up' || direction === 'down';
      const isHorizontalNav = direction === 'left' || direction === 'right';

      // Check if navigation direction is allowed
      if (orientation === 'horizontal' && isVerticalNav) return;
      if (orientation === 'vertical' && isHorizontalNav) return;

      // Calculate new index
      if (direction === 'down' || direction === 'right') {
        newIndex = wrap ? (currentIndex.current + 1) % count : Math.min(currentIndex.current + 1, count - 1);
      } else {
        newIndex = wrap ? (currentIndex.current - 1 + count) % count : Math.max(currentIndex.current - 1, 0);
      }

      currentIndex.current = newIndex;
      items[newIndex]?.current?.focus();
      onSelect?.(newIndex);
    },
    [items, orientation, wrap, onSelect]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          navigate('up');
          break;
        case 'ArrowDown':
          event.preventDefault();
          navigate('down');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          navigate('left');
          break;
        case 'ArrowRight':
          event.preventDefault();
          navigate('right');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return {
    currentIndex: currentIndex.current,
    navigate,
    setCurrentIndex: (index: number) => {
      currentIndex.current = index;
    },
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Default editor shortcuts
 */
export const DEFAULT_EDITOR_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 's',
    ctrl: true,
    action: () => announceToScreenReader('Document saved'),
    description: 'Save document',
  },
  {
    key: 'z',
    ctrl: true,
    action: () => {},
    description: 'Undo',
  },
  {
    key: 'z',
    ctrl: true,
    shift: true,
    action: () => {},
    description: 'Redo',
  },
  {
    key: 'b',
    ctrl: true,
    action: () => {},
    description: 'Bold',
  },
  {
    key: 'i',
    ctrl: true,
    action: () => {},
    description: 'Italic',
  },
  {
    key: 'u',
    ctrl: true,
    action: () => {},
    description: 'Underline',
  },
];

export default useKeyboardNavigation;
