/**
 * LazyPlugins - Lazy-loaded plugin components for improved initial load time
 * Per Constitution Section 2.4
 */
import { lazy, Suspense, useEffect, useState } from 'react';
import { performanceMonitor, METRIC_NAMES } from '../utils/performance';

// Lazy load non-critical plugins
export const LazySlashMenuPlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.slash_menu`);
  return import('./SlashMenuPlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.slash_menu`);
    return module;
  });
});

export const LazyAtMenuPlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.at_menu`);
  return import('./AtMenuPlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.at_menu`);
    return module;
  });
});

export const LazyPlusMenuPlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.plus_menu`);
  return import('./PlusMenuPlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.plus_menu`);
    return module;
  });
});

export const LazyTrackChangesPlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.track_changes`);
  return import('./TrackChangesPlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.track_changes`);
    return module;
  });
});

export const LazyCommentAlignmentPlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.comment_alignment`);
  return import('./CommentAlignmentPlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.comment_alignment`);
    return module;
  });
});

export const LazyImagePlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.image`);
  return import('./ImagePlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.image`);
    return module;
  });
});

export const LazyTablePlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.table`);
  return import('./TablePlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.table`);
    return module;
  });
});

export const LazyCollaborationPlugin = lazy(() => {
  performanceMonitor.startMark(`${METRIC_NAMES.PLUGIN_LOAD}.collaboration`);
  return import('./CollaborationPlugin').then((module) => {
    performanceMonitor.endMark(`${METRIC_NAMES.PLUGIN_LOAD}.collaboration`);
    return module;
  });
});

/**
 * PluginLoadingFallback - Shows nothing during plugin loading
 */
function PluginLoadingFallback() {
  return null;
}

/**
 * DeferredPlugin - Delays plugin loading until after initial render
 */
interface DeferredPluginProps {
  children: React.ReactNode;
  /** Delay in ms before loading (default: 100) */
  delay?: number;
  /** Whether the plugin is enabled */
  enabled?: boolean;
}

export function DeferredPlugin({
  children,
  delay = 100,
  enabled = true,
}: DeferredPluginProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, enabled]);

  if (!enabled || !shouldRender) {
    return null;
  }

  return <Suspense fallback={<PluginLoadingFallback />}>{children}</Suspense>;
}

/**
 * IdlePlugin - Loads plugin during idle time using requestIdleCallback
 */
interface IdlePluginProps {
  children: React.ReactNode;
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Timeout for idle callback (default: 2000) */
  timeout?: number;
}

export function IdlePlugin({
  children,
  enabled = true,
  timeout = 2000,
}: IdlePluginProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const scheduleLoad = () => {
      if ('requestIdleCallback' in window) {
        (window as Window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback(
          () => {
            if (!cancelled) {
              setShouldRender(true);
            }
          },
          { timeout }
        );
      } else {
        // Fallback for Safari
        setTimeout(() => {
          if (!cancelled) {
            setShouldRender(true);
          }
        }, 50);
      }
    };

    // Wait for first paint before scheduling
    requestAnimationFrame(() => {
      requestAnimationFrame(scheduleLoad);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, timeout]);

  if (!enabled || !shouldRender) {
    return null;
  }

  return <Suspense fallback={<PluginLoadingFallback />}>{children}</Suspense>;
}

/**
 * InteractionPlugin - Loads plugin on first user interaction
 */
interface InteractionPluginProps {
  children: React.ReactNode;
  /** Whether the plugin is enabled */
  enabled?: boolean;
  /** Events to listen for (default: ['click', 'keydown', 'touchstart']) */
  events?: string[];
}

export function InteractionPlugin({
  children,
  enabled = true,
  events = ['click', 'keydown', 'touchstart'],
}: InteractionPluginProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!enabled || shouldRender) return;

    const handleInteraction = () => {
      setShouldRender(true);
      // Remove listeners after first interaction
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };

    // Add listeners
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [enabled, events, shouldRender]);

  if (!enabled || !shouldRender) {
    return null;
  }

  return <Suspense fallback={<PluginLoadingFallback />}>{children}</Suspense>;
}

/**
 * PriorityPluginLoader - Loads plugins in priority order
 */
interface PluginConfig {
  id: string;
  component: React.ReactNode;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enabled?: boolean;
}

interface PriorityPluginLoaderProps {
  plugins: PluginConfig[];
}

export function PriorityPluginLoader({ plugins }: PriorityPluginLoaderProps) {
  const [loadedPriorities, setLoadedPriorities] = useState<Set<string>>(new Set(['critical']));

  useEffect(() => {
    // Load high priority after first render
    const highTimer = setTimeout(() => {
      setLoadedPriorities((prev) => new Set([...prev, 'high']));
    }, 50);

    // Load medium priority after a delay
    const mediumTimer = setTimeout(() => {
      setLoadedPriorities((prev) => new Set([...prev, 'medium']));
    }, 200);

    // Load low priority during idle
    const lowTimer = setTimeout(() => {
      setLoadedPriorities((prev) => new Set([...prev, 'low']));
    }, 500);

    return () => {
      clearTimeout(highTimer);
      clearTimeout(mediumTimer);
      clearTimeout(lowTimer);
    };
  }, []);

  return (
    <>
      {plugins
        .filter((p) => (p.enabled ?? true) && loadedPriorities.has(p.priority))
        .map((plugin) => (
          <Suspense key={plugin.id} fallback={<PluginLoadingFallback />}>
            {plugin.component}
          </Suspense>
        ))}
    </>
  );
}

export default {
  LazySlashMenuPlugin,
  LazyAtMenuPlugin,
  LazyPlusMenuPlugin,
  LazyTrackChangesPlugin,
  LazyCommentAlignmentPlugin,
  LazyImagePlugin,
  LazyTablePlugin,
  LazyCollaborationPlugin,
  DeferredPlugin,
  IdlePlugin,
  InteractionPlugin,
  PriorityPluginLoader,
};
