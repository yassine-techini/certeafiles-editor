/**
 * Performance Monitoring Utilities
 * Tracks Web Vitals and custom metrics for CerteaFiles Editor
 */

// Performance targets
export const PERFORMANCE_TARGETS = {
  INITIAL_LOAD: 2000, // < 2s
  FOLIO_RENDER: 100, // < 100ms
  SYNC_LATENCY: 200, // < 200ms
  THUMBNAIL_GENERATION: 50, // < 50ms
  AUTO_SAVE: 100, // < 100ms
} as const;

// Custom metric names
export const METRIC_NAMES = {
  INITIAL_LOAD: 'certeafiles.initial_load',
  FOLIO_RENDER: 'certeafiles.folio_render',
  SYNC_LATENCY: 'certeafiles.sync_latency',
  THUMBNAIL_GEN: 'certeafiles.thumbnail_generation',
  AUTO_SAVE: 'certeafiles.auto_save',
  EDITOR_READY: 'certeafiles.editor_ready',
  PLUGIN_LOAD: 'certeafiles.plugin_load',
} as const;

// Web Vitals types
export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

export interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  target?: number;
  metadata?: Record<string, unknown>;
}

// Performance observer singleton
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, CustomMetric[]> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();
  private callbacks: Set<(metric: CustomMetric | WebVitalsMetric) => void> = new Set();
  private marks: Map<string, number> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance monitoring
   */
  initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;

    this.initialized = true;
    this.setupWebVitals();
    this.setupResourceObserver();
    this.setupLongTaskObserver();

    console.log('[PerformanceMonitor] Initialized');
  }

  /**
   * Set up Web Vitals monitoring
   */
  private setupWebVitals(): void {
    // Dynamic import of web-vitals library
    import('web-vitals').then(({ onCLS, onFCP, onFID, onINP, onLCP, onTTFB }) => {
      const handleVital = (metric: WebVitalsMetric) => {
        this.recordWebVital(metric);
      };

      onCLS(handleVital as (metric: WebVitalsMetric) => void);
      onFCP(handleVital as (metric: WebVitalsMetric) => void);
      onFID(handleVital as (metric: WebVitalsMetric) => void);
      onINP(handleVital as (metric: WebVitalsMetric) => void);
      onLCP(handleVital as (metric: WebVitalsMetric) => void);
      onTTFB(handleVital as (metric: WebVitalsMetric) => void);
    }).catch((err) => {
      console.warn('[PerformanceMonitor] Web Vitals not available:', err);
    });
  }

  /**
   * Set up resource timing observer
   */
  private setupResourceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            // Track slow resources
            if (resource.duration > 500) {
              console.warn('[PerformanceMonitor] Slow resource:', resource.name, resource.duration + 'ms');
            }
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (e) {
      console.warn('[PerformanceMonitor] Resource observer not supported');
    }
  }

  /**
   * Set up long task observer
   */
  private setupLongTaskObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn('[PerformanceMonitor] Long task detected:', entry.duration + 'ms');
            this.recordMetric({
              name: 'certeafiles.long_task',
              value: entry.duration,
              timestamp: Date.now(),
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (e) {
      // Long task observer not supported in all browsers
    }
  }

  /**
   * Record a Web Vital metric
   */
  private recordWebVital(metric: WebVitalsMetric): void {
    console.log(`[WebVitals] ${metric.name}: ${metric.value} (${metric.rating})`);
    this.notifyCallbacks(metric);
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: CustomMetric): void {
    const { name, value, target } = metric;

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Keep only last 100 measurements
    const measurements = this.metrics.get(name)!;
    if (measurements.length > 100) {
      measurements.shift();
    }

    // Log if exceeding target
    if (target && value > target) {
      console.warn(`[PerformanceMonitor] ${name}: ${value}ms exceeds target of ${target}ms`);
    } else {
      console.log(`[PerformanceMonitor] ${name}: ${value}ms`);
    }

    this.notifyCallbacks(metric);
  }

  /**
   * Start a performance mark
   */
  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End a mark and record the duration
   */
  endMark(name: string, target?: number, metadata?: Record<string, unknown>): number {
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      console.warn(`[PerformanceMonitor] No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      target,
      metadata,
    });

    return duration;
  }

  /**
   * Measure a function's execution time
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>,
    target?: number
  ): Promise<T> {
    this.startMark(name);
    try {
      const result = await fn();
      this.endMark(name, target);
      return result;
    } catch (error) {
      this.endMark(name, target, { error: true });
      throw error;
    }
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback: (metric: CustomMetric | WebVitalsMetric) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Notify all subscribers
   */
  private notifyCallbacks(metric: CustomMetric | WebVitalsMetric): void {
    this.callbacks.forEach((callback) => callback(metric));
  }

  /**
   * Get metrics for a specific name
   */
  getMetrics(name: string): CustomMetric[] {
    return this.metrics.get(name) ?? [];
  }

  /**
   * Get average for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  /**
   * Get P95 for a metric
   */
  getP95(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sorted = [...metrics].sort((a, b) => a.value - b.value);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index]?.value ?? 0;
  }

  /**
   * Get performance report
   */
  getReport(): Record<string, { average: number; p95: number; count: number }> {
    const report: Record<string, { average: number; p95: number; count: number }> = {};

    this.metrics.forEach((metrics, name) => {
      report[name] = {
        average: this.getAverage(name),
        p95: this.getP95(name),
        count: metrics.length,
      };
    });

    return report;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.marks.clear();
  }

  /**
   * Destroy the monitor
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.clear();
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

/**
 * Hook to use performance monitoring in components
 */
export function usePerformanceMonitor() {
  return performanceMonitor;
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(
  name: string,
  target?: number
): MethodDecorator {
  return function (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      return performanceMonitor.measure(name, () => originalMethod.apply(this, args), target);
    };

    return descriptor;
  };
}

/**
 * Create a debounced function with performance tracking
 */
export function createDebouncedWithMetrics<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  metricName: string
): T {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      const timeSinceLastCall = now - lastCallTime;
      lastCallTime = now;

      performanceMonitor.startMark(metricName);
      const result = fn(...args);

      if (result instanceof Promise) {
        result.finally(() => {
          performanceMonitor.endMark(metricName);
        });
      } else {
        performanceMonitor.endMark(metricName);
      }

      // Record debounce efficiency
      if (timeSinceLastCall < delay) {
        performanceMonitor.recordMetric({
          name: `${metricName}.debounce_skipped`,
          value: 1,
          timestamp: Date.now(),
        });
      }

      return result;
    }, delay);
  }) as T;
}
