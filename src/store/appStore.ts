import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User } from '../data/schemas';
import { getCurrentUser, signOut } from '../auth/auth';
import { CryptoKey } from '../utils/types';
import logger from '../utils/logger';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOfflineMode: (offline: boolean) => void;
  setLastSync: (timestamp: string | null) => void;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  // Encryption
  encryptionKey: CryptoKey | null;
  setEncryptionKey: (key: CryptoKey | null) => void;
  
  // Settings
  settings: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    autoSync: boolean;
    aiProvider: 'groq' | 'huggingface' | 'ollama';
    apiKey: string | null;
  };
  updateSettings: (settings: Partial<AppStore['settings']>) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      offlineMode: false,
      lastSyncAt: null,
      encryptionKey: null,
      
      settings: {
        theme: 'auto',
        notifications: true,
        autoSync: true,
        aiProvider: 'groq', // Default to free Groq
        apiKey: null,
      },

      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setOfflineMode: (offline) => set({ offlineMode: offline }),

      setLastSync: (timestamp) => set({ lastSyncAt: timestamp }),

      login: async (user) => {
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await signOut();
          set({ 
            user: null, 
            isAuthenticated: false, 
            encryptionKey: null,
            isLoading: false 
          });
        } catch (error) {
          logger.error('Logout error:', error);
          set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        try {
          set({ isLoading: true });
          const { user, error } = await getCurrentUser();
          
          if (error) {
            logger.error('Auth check error:', error);
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          set({ 
            user, 
            isAuthenticated: !!user, 
            isLoading: false 
          });
        } catch (error) {
          logger.error('Auth check failed:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setEncryptionKey: (key) => set({ encryptionKey: key }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'thera-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist sensitive data like encryption keys
      }),
    }
  )
);
