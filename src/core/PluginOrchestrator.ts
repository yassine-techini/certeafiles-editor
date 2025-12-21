/**
 * PluginOrchestrator - Central coordinator for all plugin updates
 * Prevents race conditions by queuing and prioritizing updates
 */

export interface UpdateTask {
  plugin: string;
  priority: number;
  task: () => void | Promise<void>;
  timestamp: number;
}

/**
 * Plugin priorities - lower number = higher priority
 */
export const PLUGIN_PRIORITIES = {
  FOLIO: 1,           // Structure de base des pages
  HEADER_FOOTER: 2,   // Injection headers/footers
  PAGE_NUMBERING: 3,  // Numérotation après headers/footers
  AUTO_PAGINATION: 4, // Pagination après numérotation
  CONTENT: 5,         // Contenu éditable
  COMMENTS: 6,        // Commentaires
  COLLABORATION: 7,   // Sync collaboration
  VERSIONING: 8,      // Versioning
} as const;

/**
 * PluginOrchestrator singleton class
 * Coordinates all plugin updates to prevent race conditions
 */
class PluginOrchestratorClass {
  private updateQueue: UpdateTask[] = [];
  private isProcessing = false;
  private lastUpdateByPlugin: Map<string, number> = new Map();

  // Debounce settings per plugin
  private debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private debounceDelays: Map<string, number> = new Map();

  constructor() {
    // Set default debounce delays
    this.debounceDelays.set('folio', 50);
    this.debounceDelays.set('header-footer', 100);
    this.debounceDelays.set('page-numbering', 100);
    this.debounceDelays.set('auto-pagination', 150);
    this.debounceDelays.set('collaboration', 200);
    this.debounceDelays.set('versioning', 300);
  }

  /**
   * Schedule an update from a plugin
   * Updates are queued and processed in priority order
   */
  scheduleUpdate(
    plugin: string,
    priority: number,
    task: () => void | Promise<void>,
    debounce = true
  ): void {
    const now = Date.now();

    // Check if we should debounce this update
    if (debounce) {
      const debounceDelay = this.debounceDelays.get(plugin) ?? 100;
      const existingTimer = this.debounceTimers.get(plugin);

      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.debounceTimers.delete(plugin);
        this.queueTask(plugin, priority, task, now);
      }, debounceDelay);

      this.debounceTimers.set(plugin, timer);
    } else {
      // Immediate execution (no debounce)
      this.queueTask(plugin, priority, task, now);
    }
  }

  /**
   * Schedule an immediate update (bypasses debounce)
   */
  scheduleImmediateUpdate(
    plugin: string,
    priority: number,
    task: () => void | Promise<void>
  ): void {
    this.scheduleUpdate(plugin, priority, task, false);
  }

  /**
   * Queue a task for processing
   */
  private queueTask(
    plugin: string,
    priority: number,
    task: () => void | Promise<void>,
    timestamp: number
  ): void {
    // Remove any pending tasks from the same plugin (keep only latest)
    this.updateQueue = this.updateQueue.filter(t => t.plugin !== plugin);

    // Add new task
    this.updateQueue.push({ plugin, priority, task, timestamp });

    // Start processing if not already
    this.processQueue();
  }

  /**
   * Process the update queue in priority order
   */
  private async processQueue(): Promise<void> {
    // If already processing, wait for current batch
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.updateQueue.length > 0) {
        // Sort by priority (ascending) then by timestamp (ascending)
        this.updateQueue.sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          return a.timestamp - b.timestamp;
        });

        // Get next task
        const task = this.updateQueue.shift();
        if (!task) break;

        try {
          // Execute task
          const result = task.task();
          if (result instanceof Promise) {
            await result;
          }

          // Record last update time
          this.lastUpdateByPlugin.set(task.plugin, Date.now());
        } catch (error) {
          console.error(`[PluginOrchestrator] Error in ${task.plugin}:`, error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Wait for all pending updates to complete
   */
  async waitForPendingUpdates(): Promise<void> {
    if (this.isProcessing) {
      // Wait a bit for current processing to finish
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.waitForPendingUpdates();
    }

    // Also wait for any debounced updates
    const pendingDebounces = Array.from(this.debounceTimers.values());
    if (pendingDebounces.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  /**
   * Cancel all pending updates for a plugin
   */
  cancelUpdates(plugin: string): void {
    // Cancel debounce timer
    const timer = this.debounceTimers.get(plugin);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(plugin);
    }

    // Remove from queue
    this.updateQueue = this.updateQueue.filter(t => t.plugin !== plugin);
  }

  /**
   * Cancel all pending updates
   */
  cancelAllUpdates(): void {
    // Cancel all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Clear queue
    this.updateQueue = [];
  }

  /**
   * Set custom debounce delay for a plugin
   */
  setDebounceDelay(plugin: string, delay: number): void {
    this.debounceDelays.set(plugin, delay);
  }

  /**
   * Get time since last update for a plugin
   */
  getTimeSinceLastUpdate(plugin: string): number | null {
    const lastUpdate = this.lastUpdateByPlugin.get(plugin);
    if (!lastUpdate) return null;
    return Date.now() - lastUpdate;
  }

  /**
   * Check if a plugin has pending updates
   */
  hasPendingUpdates(plugin: string): boolean {
    return (
      this.debounceTimers.has(plugin) ||
      this.updateQueue.some(t => t.plugin === plugin)
    );
  }

  /**
   * Get queue status for debugging
   */
  getStatus(): {
    isProcessing: boolean;
    queueLength: number;
    pendingDebounces: string[];
  } {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.updateQueue.length,
      pendingDebounces: Array.from(this.debounceTimers.keys()),
    };
  }
}

// Singleton instance
export const PluginOrchestrator = new PluginOrchestratorClass();

// Export class for testing purposes
export { PluginOrchestratorClass };

export default PluginOrchestrator;
