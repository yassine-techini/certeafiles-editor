/**
 * useHeaderFooter - Hook for header/footer management
 * Per Constitution Section 4.2
 */
import { useCallback, useMemo } from 'react';
import { useHeaderFooterStore } from '../stores/headerFooterStore';
import { useFolioStore } from '../stores/folioStore';
import type {
  HeaderFooterContent,
  HeaderFooterSegment,
  ResolvedHeaderFooter,
} from '../types/headerFooter';

export interface UseHeaderFooterOptions {
  /** Folio ID to get header/footer for */
  folioId?: string;
}

export interface UseHeaderFooterReturn {
  // Resolved content for the folio
  header: ResolvedHeaderFooter;
  footer: ResolvedHeaderFooter;

  // Status flags
  hasHeader: boolean;
  hasFooter: boolean;
  isHeaderDefault: boolean;
  isFooterDefault: boolean;
  hasHeaderOverride: boolean;
  hasFooterOverride: boolean;

  // Actions
  setHeaderContent: (content: Partial<HeaderFooterContent>) => void;
  setFooterContent: (content: Partial<HeaderFooterContent>) => void;
  setHeaderSegment: (
    position: 'left' | 'center' | 'right',
    segment: HeaderFooterSegment | null
  ) => void;
  setFooterSegment: (
    position: 'left' | 'center' | 'right',
    segment: HeaderFooterSegment | null
  ) => void;
  useDefaultHeader: () => void;
  useDefaultFooter: () => void;
  createCustomHeader: () => string;
  createCustomFooter: () => string;
  removeHeader: () => void;
  removeFooter: () => void;
}

/**
 * useHeaderFooter - Hook for managing headers and footers
 */
export function useHeaderFooter(
  options: UseHeaderFooterOptions = {}
): UseHeaderFooterReturn {
  // Get active folio if not specified
  const activeFolioId = useFolioStore((state) => state.activeFolioId);
  const folioId = options.folioId ?? activeFolioId;

  // Get store state
  const getHeaderForFolio = useHeaderFooterStore((state) => state.getHeaderForFolio);
  const getFooterForFolio = useHeaderFooterStore((state) => state.getFooterForFolio);
  const hasHeaderOverride = useHeaderFooterStore((state) => state.hasHeaderOverride);
  const hasFooterOverride = useHeaderFooterStore((state) => state.hasFooterOverride);

  // Get store actions
  const {
    createHeader,
    updateHeader,
    updateHeaderSegment,
    createFooter,
    updateFooter,
    updateFooterSegment,
    setFolioHeaderOverride,
    setFolioFooterOverride,
    resetFolioHeaderToDefault,
    resetFolioFooterToDefault,
    clearFolioHeader,
    clearFolioFooter,
  } = useHeaderFooterStore.getState();

  // Get resolved header/footer for the folio
  const header = useMemo(() => {
    if (!folioId) {
      return {
        content: null,
        isDefault: true,
        isOverride: false,
      };
    }
    return getHeaderForFolio(folioId);
  }, [folioId, getHeaderForFolio]);

  const footer = useMemo(() => {
    if (!folioId) {
      return {
        content: null,
        isDefault: true,
        isOverride: false,
      };
    }
    return getFooterForFolio(folioId);
  }, [folioId, getFooterForFolio]);

  // Status flags
  const hasHeader = header.content !== null;
  const hasFooter = footer.content !== null;
  const isHeaderDefault = header.isDefault;
  const isFooterDefault = footer.isDefault;
  const folioHasHeaderOverride = folioId ? hasHeaderOverride(folioId) : false;
  const folioHasFooterOverride = folioId ? hasFooterOverride(folioId) : false;

  // Set header content
  const setHeaderContent = useCallback(
    (content: Partial<HeaderFooterContent>) => {
      if (header.content?.id) {
        updateHeader(header.content.id, content);
      }
    },
    [header.content?.id, updateHeader]
  );

  // Set footer content
  const setFooterContent = useCallback(
    (content: Partial<HeaderFooterContent>) => {
      if (footer.content?.id) {
        updateFooter(footer.content.id, content);
      }
    },
    [footer.content?.id, updateFooter]
  );

  // Set header segment
  const setHeaderSegment = useCallback(
    (
      position: 'left' | 'center' | 'right',
      segment: HeaderFooterSegment | null
    ) => {
      if (header.content?.id) {
        updateHeaderSegment(header.content.id, position, segment);
      }
    },
    [header.content?.id, updateHeaderSegment]
  );

  // Set footer segment
  const setFooterSegment = useCallback(
    (
      position: 'left' | 'center' | 'right',
      segment: HeaderFooterSegment | null
    ) => {
      if (footer.content?.id) {
        updateFooterSegment(footer.content.id, position, segment);
      }
    },
    [footer.content?.id, updateFooterSegment]
  );

  // Use default header (remove override)
  const useDefaultHeader = useCallback(() => {
    if (folioId) {
      resetFolioHeaderToDefault(folioId);
    }
  }, [folioId, resetFolioHeaderToDefault]);

  // Use default footer (remove override)
  const useDefaultFooter = useCallback(() => {
    if (folioId) {
      resetFolioFooterToDefault(folioId);
    }
  }, [folioId, resetFolioFooterToDefault]);

  // Create custom header for this folio
  const createCustomHeader = useCallback(() => {
    const headerId = createHeader();
    if (folioId) {
      setFolioHeaderOverride(folioId, headerId);
    }
    return headerId;
  }, [folioId, createHeader, setFolioHeaderOverride]);

  // Create custom footer for this folio
  const createCustomFooter = useCallback(() => {
    const footerId = createFooter();
    if (folioId) {
      setFolioFooterOverride(folioId, footerId);
    }
    return footerId;
  }, [folioId, createFooter, setFolioFooterOverride]);

  // Remove header from this folio (explicitly no header)
  const removeHeader = useCallback(() => {
    if (folioId) {
      clearFolioHeader(folioId);
    }
  }, [folioId, clearFolioHeader]);

  // Remove footer from this folio (explicitly no footer)
  const removeFooter = useCallback(() => {
    if (folioId) {
      clearFolioFooter(folioId);
    }
  }, [folioId, clearFolioFooter]);

  return {
    header,
    footer,
    hasHeader,
    hasFooter,
    isHeaderDefault,
    isFooterDefault,
    hasHeaderOverride: folioHasHeaderOverride,
    hasFooterOverride: folioHasFooterOverride,
    setHeaderContent,
    setFooterContent,
    setHeaderSegment,
    setFooterSegment,
    useDefaultHeader,
    useDefaultFooter,
    createCustomHeader,
    createCustomFooter,
    removeHeader,
    removeFooter,
  };
}

/**
 * Hook to get all headers/footers for document export
 */
export function useAllHeadersFooters() {
  const headers = useHeaderFooterStore((state) => state.headers);
  const footers = useHeaderFooterStore((state) => state.footers);
  const defaultHeaderId = useHeaderFooterStore((state) => state.defaultHeaderId);
  const defaultFooterId = useHeaderFooterStore((state) => state.defaultFooterId);
  const folioHeaders = useHeaderFooterStore((state) => state.folioHeaders);
  const folioFooters = useHeaderFooterStore((state) => state.folioFooters);

  return {
    headers: Array.from(headers.values()),
    footers: Array.from(footers.values()),
    defaultHeaderId,
    defaultFooterId,
    folioHeaders: Object.fromEntries(folioHeaders),
    folioFooters: Object.fromEntries(folioFooters),
  };
}

export default useHeaderFooter;
