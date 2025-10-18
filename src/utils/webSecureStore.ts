/**
 * Web-compatible secure storage for Supabase authentication
 * Uses sessionStorage for better security than localStorage
 * (sessionStorage is cleared when browser tab closes)
 */

export const webSecureStore = {
  getItem: (key: string): string | null => {
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error('Failed to get item from sessionStorage:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): void => {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error('Failed to set item in sessionStorage:', error);
    }
  },

  removeItem: (key: string): void => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item from sessionStorage:', error);
    }
  },
};
