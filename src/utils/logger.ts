/**
 * Production-safe logging utility for web
 * Logs are only shown in development mode
 */

// Use Vite's import.meta.env.DEV instead of React Native's __DEV__
const IS_DEV = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log('[TheraJournal]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (IS_DEV) {
      console.info('[TheraJournal]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn('[TheraJournal WARN]', ...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error('[TheraJournal ERROR]', ...args);
  },

  debug: (...args: any[]) => {
    if (IS_DEV) {
      console.debug('[TheraJournal DEBUG]', ...args);
    }
  },
};

export default logger;