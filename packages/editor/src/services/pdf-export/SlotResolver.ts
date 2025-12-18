/**
 * SlotResolver - Resolves slot placeholders to actual values
 * Per Constitution Section 8 - Export
 */

import type { Slot } from '../../types/slot';

/**
 * Data source for external fetches
 */
export interface DataSource {
  /** Source identifier */
  id: string;
  /** Source type */
  type: 'api' | 'database' | 'static';
  /** Base URL for API sources */
  baseUrl?: string | undefined;
  /** Authentication token */
  authToken?: string | undefined;
  /** Static data for static sources */
  data?: Record<string, unknown> | undefined;
}

/**
 * Resolution context
 */
export interface ResolutionContext {
  /** Document ID */
  documentId: string;
  /** Current page number */
  pageNumber: number;
  /** Total pages */
  totalPages: number;
  /** Document metadata */
  metadata: Record<string, string>;
  /** Available data sources */
  dataSources: DataSource[];
  /** User-provided slot values */
  userValues: Record<string, string>;
  /** Current date/time */
  now: Date;
}

/**
 * Resolution result
 */
export interface ResolutionResult {
  /** Resolved values by slot ID */
  values: Record<string, string>;
  /** Slots that failed to resolve */
  errors: Array<{ slotId: string; error: string }>;
  /** Warnings (non-critical issues) */
  warnings: Array<{ slotId: string; message: string }>;
}

/**
 * Built-in dynamic field resolvers
 */
const BUILTIN_RESOLVERS: Record<string, (context: ResolutionContext) => string> = {
  // Page numbering
  'page_number': (ctx) => String(ctx.pageNumber),
  'total_pages': (ctx) => String(ctx.totalPages),
  'page_of_total': (ctx) => `${ctx.pageNumber} / ${ctx.totalPages}`,

  // Date/time
  'date': (ctx) => ctx.now.toLocaleDateString('fr-FR'),
  'date_iso': (ctx) => ctx.now.toISOString().split('T')[0],
  'date_long': (ctx) => ctx.now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  'time': (ctx) => ctx.now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }),
  'datetime': (ctx) => ctx.now.toLocaleString('fr-FR'),

  // Document metadata
  'title': (ctx) => ctx.metadata.title || 'Untitled',
  'author': (ctx) => ctx.metadata.author || '',
  'version': (ctx) => ctx.metadata.version || '1.0',
  'document_id': (ctx) => ctx.documentId,
};

/**
 * SlotResolver class
 */
export class SlotResolver {
  private dataSources: Map<string, DataSource>;
  private cache: Map<string, string>;
  private fetchCache: Map<string, Promise<unknown>>;

  constructor() {
    this.dataSources = new Map();
    this.cache = new Map();
    this.fetchCache = new Map();
  }

  /**
   * Register a data source
   */
  registerDataSource(source: DataSource): void {
    this.dataSources.set(source.id, source);
  }

  /**
   * Clear caches
   */
  clearCache(): void {
    this.cache.clear();
    this.fetchCache.clear();
  }

  /**
   * Resolve all slots
   */
  async resolveAll(
    slots: Slot[],
    context: ResolutionContext
  ): Promise<ResolutionResult> {
    const result: ResolutionResult = {
      values: {},
      errors: [],
      warnings: [],
    };

    // Process slots in parallel where possible
    const promises = slots.map(async (slot) => {
      try {
        const value = await this.resolveSlot(slot, context);
        result.values[slot.id] = value;
      } catch (error) {
        result.errors.push({
          slotId: slot.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Use placeholder or empty string on error
        result.values[slot.id] = slot.metadata.placeholder || `[${slot.metadata.label || slot.id}]`;
      }
    });

    await Promise.all(promises);

    return result;
  }

  /**
   * Resolve a single slot
   */
  async resolveSlot(slot: Slot, context: ResolutionContext): Promise<string> {
    // Check cache first
    const cacheKey = `${slot.id}:${context.pageNumber}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check user-provided values
    if (context.userValues[slot.id]) {
      return context.userValues[slot.id];
    }

    // If slot is already filled, use that value
    if (slot.isFilled && slot.value) {
      return slot.value;
    }

    let value: string;

    switch (slot.type) {
      case 'dynamic_content':
        value = await this.resolveDynamicContent(slot, context);
        break;
      case 'at_fetcher':
        value = await this.resolveAtFetcher(slot, context);
        break;
      case 'donnee':
        value = await this.resolveDonnee(slot, context);
        break;
      case 'ancre':
        value = this.resolveAncre(slot, context);
        break;
      case 'section_speciale':
        value = this.resolveSectionSpeciale(slot, context);
        break;
      case 'commentaire':
        value = this.resolveCommentaire(slot, context);
        break;
      default:
        value = slot.metadata.defaultValue || '';
    }

    // Cache the result
    this.cache.set(cacheKey, value);

    return value;
  }

  /**
   * Resolve dynamic content slot
   */
  private async resolveDynamicContent(
    slot: Slot,
    context: ResolutionContext
  ): Promise<string> {
    const { label, defaultValue } = slot.metadata;

    // Check for built-in resolver
    const resolverKey = label?.toLowerCase().replace(/\s+/g, '_');
    if (resolverKey && BUILTIN_RESOLVERS[resolverKey]) {
      return BUILTIN_RESOLVERS[resolverKey](context);
    }

    // Check metadata for matching key
    if (label && context.metadata[label]) {
      return context.metadata[label];
    }

    return defaultValue || '';
  }

  /**
   * Resolve at_fetcher slot (external data)
   */
  private async resolveAtFetcher(
    slot: Slot,
    context: ResolutionContext
  ): Promise<string> {
    const { source, field } = slot.metadata;

    if (!source) {
      throw new Error('No source specified for at_fetcher slot');
    }

    // Parse source format: @source.field or @source/path.field
    const [sourceId, ...pathParts] = source.replace('@', '').split('.');
    const fieldPath = field || pathParts.join('.');

    const dataSource = this.dataSources.get(sourceId) ||
      context.dataSources.find((ds) => ds.id === sourceId);

    if (!dataSource) {
      throw new Error(`Data source not found: ${sourceId}`);
    }

    // Fetch data
    const data = await this.fetchFromSource(dataSource, fieldPath, context);

    if (data === undefined || data === null) {
      return slot.metadata.defaultValue || '';
    }

    return String(data);
  }

  /**
   * Fetch data from a source
   */
  private async fetchFromSource(
    source: DataSource,
    fieldPath: string,
    context: ResolutionContext
  ): Promise<unknown> {
    const cacheKey = `fetch:${source.id}:${fieldPath}`;

    // Check fetch cache for in-flight requests
    if (this.fetchCache.has(cacheKey)) {
      return this.fetchCache.get(cacheKey);
    }

    let fetchPromise: Promise<unknown>;

    switch (source.type) {
      case 'static':
        fetchPromise = Promise.resolve(
          this.getNestedValue(source.data || {}, fieldPath)
        );
        break;

      case 'api':
        fetchPromise = this.fetchFromApi(source, fieldPath, context);
        break;

      case 'database':
        // Database fetching would require server-side handling
        fetchPromise = Promise.resolve(null);
        break;

      default:
        fetchPromise = Promise.resolve(null);
    }

    this.fetchCache.set(cacheKey, fetchPromise);

    return fetchPromise;
  }

  /**
   * Fetch data from API
   */
  private async fetchFromApi(
    source: DataSource,
    fieldPath: string,
    _context: ResolutionContext
  ): Promise<unknown> {
    if (!source.baseUrl) {
      throw new Error('No base URL for API source');
    }

    const url = `${source.baseUrl}/${fieldPath.replace(/\./g, '/')}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (source.authToken) {
      headers['Authorization'] = `Bearer ${source.authToken}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return this.getNestedValue(data, fieldPath);
  }

  /**
   * Get nested value from object by path
   */
  private getNestedValue(obj: unknown, path: string): unknown {
    if (!path) return obj;

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Resolve donnee (data field) slot
   */
  private async resolveDonnee(
    slot: Slot,
    context: ResolutionContext
  ): Promise<string> {
    const { field, defaultValue } = slot.metadata;

    if (!field) {
      return defaultValue || '';
    }

    // Check context metadata
    const value = this.getNestedValue(context.metadata, field);
    if (value !== undefined && value !== null) {
      return String(value);
    }

    // Check data sources
    for (const source of context.dataSources) {
      if (source.type === 'static' && source.data) {
        const sourceValue = this.getNestedValue(source.data, field);
        if (sourceValue !== undefined && sourceValue !== null) {
          return String(sourceValue);
        }
      }
    }

    return defaultValue || '';
  }

  /**
   * Resolve ancre (anchor) slot
   */
  private resolveAncre(_slot: Slot, _context: ResolutionContext): string {
    // Anchors are typically invisible reference points
    // Return empty string for PDF export
    return '';
  }

  /**
   * Resolve section_speciale slot
   */
  private resolveSectionSpeciale(
    _slot: Slot,
    _context: ResolutionContext
  ): string {
    // Special sections are typically structural
    // Return empty string for PDF export
    return '';
  }

  /**
   * Resolve commentaire slot
   */
  private resolveCommentaire(_slot: Slot, _context: ResolutionContext): string {
    // Comments are typically excluded from PDF export
    // Return empty string
    return '';
  }
}

/**
 * Create a default slot resolver
 */
export function createSlotResolver(): SlotResolver {
  return new SlotResolver();
}

export default SlotResolver;
