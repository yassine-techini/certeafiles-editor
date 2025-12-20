/**
 * Logger Utility - Configurable logging for production/development
 * Per Constitution Section 3.2 - Utilities
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

interface LoggerConfig {
  /** Minimum log level to output */
  level: LogLevel;
  /** Whether logging is enabled */
  enabled: boolean;
  /** Prefix for all log messages */
  prefix: string;
  /** Whether to include timestamps */
  timestamps: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

// Default config - production mode disables debug/info logs
const defaultConfig: LoggerConfig = {
  level: import.meta.env.PROD ? 'warn' : 'debug',
  enabled: true,
  prefix: '[CerteaFiles]',
  timestamps: false,
};

let config: LoggerConfig = { ...defaultConfig };

/**
 * Format a log message with optional prefix and timestamp
 */
function formatMessage(level: LogLevel, message: string): string {
  const parts: string[] = [];

  if (config.timestamps) {
    parts.push(`[${new Date().toISOString()}]`);
  }

  if (config.prefix) {
    parts.push(config.prefix);
  }

  parts.push(`[${level.toUpperCase()}]`);
  parts.push(message);

  return parts.join(' ');
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
}

/**
 * Logger object with standard logging methods
 */
export const logger = {
  /**
   * Configure the logger
   */
  configure(newConfig: Partial<LoggerConfig>): void {
    config = { ...config, ...newConfig };
  },

  /**
   * Reset to default configuration
   */
  reset(): void {
    config = { ...defaultConfig };
  },

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...config };
  },

  /**
   * Debug level logging - only in development
   */
  debug(message: string, ...args: unknown[]): void {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message), ...args);
    }
  },

  /**
   * Info level logging
   */
  info(message: string, ...args: unknown[]): void {
    if (shouldLog('info')) {
      console.info(formatMessage('info', message), ...args);
    }
  },

  /**
   * Warning level logging
   */
  warn(message: string, ...args: unknown[]): void {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  /**
   * Error level logging
   */
  error(message: string, ...args: unknown[]): void {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message), ...args);
    }
  },

  /**
   * Create a scoped logger with a specific prefix
   */
  scope(scopeName: string) {
    return {
      debug: (message: string, ...args: unknown[]) =>
        logger.debug(`[${scopeName}] ${message}`, ...args),
      info: (message: string, ...args: unknown[]) =>
        logger.info(`[${scopeName}] ${message}`, ...args),
      warn: (message: string, ...args: unknown[]) =>
        logger.warn(`[${scopeName}] ${message}`, ...args),
      error: (message: string, ...args: unknown[]) =>
        logger.error(`[${scopeName}] ${message}`, ...args),
    };
  },

  /**
   * Time a function execution
   */
  time<T>(label: string, fn: () => T): T {
    if (!shouldLog('debug')) {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    logger.debug(`${label} took ${duration.toFixed(2)}ms`);
    return result;
  },

  /**
   * Time an async function execution
   */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!shouldLog('debug')) {
      return fn();
    }

    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    logger.debug(`${label} took ${duration.toFixed(2)}ms`);
    return result;
  },
};

export default logger;
