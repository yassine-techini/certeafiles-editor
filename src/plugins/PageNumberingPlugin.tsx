/**
 * PageNumberingPlugin - Calculate and update page numbers across folios
 * Per Constitution Section 4.2 - Headers and Footers
 */
import { useEffect, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { $getAllFolioNodes } from '../nodes/FolioNode';
import { useFolioStore } from '../stores/folioStore';
import { isModalCurrentlyOpen } from '../utils/modalState';
import { PluginOrchestrator, PLUGIN_PRIORITIES } from '../core/PluginOrchestrator';
import { TIMING, UPDATE_TAGS } from '../core/constants';

/**
 * Section numbering configuration
 */
export interface SectionNumbering {
  /** Section ID */
  sectionId: string;
  /** Starting page number for this section */
  startNumber: number;
  /** Whether to restart numbering at this section */
  restartNumbering: boolean;
  /** Folio IDs in this section */
  folioIds: string[];
}

export interface PageNumberingPluginProps {
  /** Sections for section-based numbering */
  sections?: SectionNumbering[];
  /** Whether to auto-update on changes */
  autoUpdate?: boolean;
  /** Debounce delay in ms */
  debounceMs?: number;
}

/**
 * PageNumberingPlugin - Manages page number calculation and updates
 */
export function PageNumberingPlugin({
  sections,
  autoUpdate = true,
}: PageNumberingPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateRef = useRef<number>(0);

  /**
   * Calculate page number for a folio based on sections
   */
  const calculatePageNumber = useCallback(
    (folioId: string, folioIndex: number): number => {
      if (!sections || sections.length === 0) {
        // Simple sequential numbering
        return folioIndex + 1;
      }

      // Find which section this folio belongs to
      let currentPageNumber = 1;
      let foundInSection = false;

      for (const section of sections) {
        if (section.restartNumbering) {
          currentPageNumber = section.startNumber;
        }

        const folioIndexInSection = section.folioIds.indexOf(folioId);
        if (folioIndexInSection !== -1) {
          foundInSection = true;
          return currentPageNumber + folioIndexInSection;
        }

        currentPageNumber += section.folioIds.length;
      }

      // Folio not in any section, use global index
      if (!foundInSection) {
        return folioIndex + 1;
      }

      return currentPageNumber;
    },
    [sections]
  );

  /**
   * Update all page number nodes in the document
   */
  const updateAllPageNumbers = useCallback(() => {
    // Skip if a modal is open
    if (isModalCurrentlyOpen()) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 50) {
      // Prevent too frequent updates
      return;
    }
    lastUpdateRef.current = now;

    editor.update(
      () => {
        const root = $getRoot();
        const folioNodes = $getAllFolioNodes(root);
        const totalPages = folioNodes.length;

        // Build a map of folio ID to page number
        const folioPageNumbers = new Map<string, number>();
        folioNodes.forEach((folio, index) => {
          const pageNumber = calculatePageNumber(folio.getFolioId(), index);
          folioPageNumbers.set(folio.getFolioId(), pageNumber);
        });

        // Update DOM elements for PageNumberNodes
        // Since PageNumberNode is a DecoratorNode, we need to update via DOM
        const pageNumberElements = document.querySelectorAll('[data-page-number-format]');
        pageNumberElements.forEach((element) => {
          // Find the folio this element belongs to
          let parent = element.parentElement;
          let folioId: string | null = null;

          while (parent) {
            if (parent.hasAttribute('data-folio-id')) {
              folioId = parent.getAttribute('data-folio-id');
              break;
            }
            parent = parent.parentElement;
          }

          if (folioId) {
            const pageNumber = folioPageNumbers.get(folioId) || 1;
            const format = element.getAttribute('data-page-number-format');
            const prefix = element.getAttribute('data-page-number-prefix') || '';
            const suffix = element.getAttribute('data-page-number-suffix') || '';

            let displayText = '';
            switch (format) {
              case 'page_of_total':
                displayText = `${prefix}${pageNumber} of ${totalPages}${suffix}`;
                break;
              case 'total':
                displayText = `${prefix}${totalPages}${suffix}`;
                break;
              case 'roman':
                displayText = `${prefix}${toRoman(pageNumber)}${suffix}`;
                break;
              case 'alpha':
                displayText = `${prefix}${toAlpha(pageNumber)}${suffix}`;
                break;
              default:
                displayText = `${prefix}${pageNumber}${suffix}`;
            }

            // Update the display text in the component
            const componentSpan = element.querySelector('.page-number-component');
            if (componentSpan) {
              componentSpan.textContent = displayText;
            }
          }
        });

        // Also update DynamicFieldNodes with page-related types
        const dynamicFieldElements = document.querySelectorAll('[data-dynamic-field-type]');
        dynamicFieldElements.forEach((element) => {
          const fieldType = element.getAttribute('data-dynamic-field-type');
          if (!['page_number', 'total_pages', 'page_of_total'].includes(fieldType || '')) {
            return;
          }

          // Find the folio this element belongs to
          let parent = element.parentElement;
          let folioId: string | null = null;

          while (parent) {
            if (parent.hasAttribute('data-folio-id')) {
              folioId = parent.getAttribute('data-folio-id');
              break;
            }
            parent = parent.parentElement;
          }

          if (folioId || fieldType === 'total_pages') {
            const pageNumber = folioId ? folioPageNumbers.get(folioId) || 1 : 1;
            const configStr = element.getAttribute('data-dynamic-field-config');
            const config = configStr ? JSON.parse(configStr) : {};
            const prefix = config.prefix || '';
            const suffix = config.suffix || '';
            const numberFormat = config.numberFormat || 'arabic';

            const formatNum = (n: number) => {
              switch (numberFormat) {
                case 'roman': return toRoman(n);
                case 'alpha': return toAlpha(n);
                default: return String(n);
              }
            };

            let displayText = '';
            switch (fieldType) {
              case 'page_number':
                displayText = `${prefix}${formatNum(pageNumber)}${suffix}`;
                break;
              case 'total_pages':
                displayText = `${prefix}${formatNum(totalPages)}${suffix}`;
                break;
              case 'page_of_total':
                displayText = `${prefix}${formatNum(pageNumber)} sur ${formatNum(totalPages)}${suffix}`;
                break;
            }

            // Update the display text in the component
            const componentSpan = element.querySelector('.dynamic-field-component');
            if (componentSpan) {
              componentSpan.textContent = displayText;
            }
          }
        });

        console.log(
          '[PageNumberingPlugin] Updated page numbers for',
          folioNodes.length,
          'folios'
        );
      },
      { tag: UPDATE_TAGS.PAGE_NUMBER_SYNC }
    );
  }, [editor, calculatePageNumber]);

  /**
   * Debounced update function - uses orchestrator for coordination
   */
  const debouncedUpdate = useCallback(() => {
    // Use orchestrator for coordinated updates
    PluginOrchestrator.scheduleUpdate(
      'page-numbering',
      PLUGIN_PRIORITIES.PAGE_NUMBERING,
      updateAllPageNumbers
    );
  }, [updateAllPageNumbers]);

  // Listen for editor changes
  useEffect(() => {
    if (!autoUpdate) return;

    return editor.registerUpdateListener(({ tags }) => {
      // Skip if this is our own update
      if (tags.has(UPDATE_TAGS.PAGE_NUMBER_SYNC)) return;

      debouncedUpdate();
    });
  }, [editor, autoUpdate, debouncedUpdate]);

  // Listen for folio changes
  useEffect(() => {
    const unsubscribe = useFolioStore.subscribe(
      (state) => state.folios.size,
      () => {
        debouncedUpdate();
      }
    );

    return unsubscribe;
  }, [debouncedUpdate]);

  // Initial update
  useEffect(() => {
    // Use centralized timing for initial delay
    const timeout = setTimeout(updateAllPageNumbers, TIMING.INITIAL_LOAD_DELAY);
    return () => clearTimeout(timeout);
  }, [updateAllPageNumbers]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return null;
}

/**
 * Convert number to Roman numerals
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
}

/**
 * Convert number to alphabetic (A, B, C, ..., Z, AA, AB, ...)
 */
function toAlpha(num: number): string {
  let result = '';
  while (num > 0) {
    num--;
    result = String.fromCharCode(65 + (num % 26)) + result;
    num = Math.floor(num / 26);
  }
  return result;
}

export default PageNumberingPlugin;
