/**
 * Production-safe logging utility
 * Logs are only shown in development mode
 */

const IS_DEV = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log('[TheraJournal]', ...args);
    }
  },

  error: (...args: any[]) => {
    if (IS_DEV) {
      console.error('[TheraJournal ERROR]', ...args);
    } else {
      // In production, you could send to error tracking service (Sentry, etc.)
      // For now, we'll keep critical errors visible
      console.error('[TheraJournal ERROR]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn('[TheraJournal WARN]', ...args);
    }
  },

  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.debug('[TheraJournal DEBUG]', ...args);
    }
  },
};

export default logger;

