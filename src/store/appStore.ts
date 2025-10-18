import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { localStorage } from '../utils/storage';
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

// Mock user for demo purposes
const mockUser: User = {
  user_id: 'demo-user-123',
  email: 'demo@therajournal.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Demo state - user is always authenticated
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      offlineMode: false,
      lastSyncAt: new Date().toISOString(),
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
          // For demo, just reset to mock user
          set({ 
            user: mockUser, 
            isAuthenticated: true, 
            encryptionKey: null,
            isLoading: false 
          });
        } catch (error) {
          logger.error('Logout error:', error);
          set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        // For demo, always return authenticated
        set({ 
          user: mockUser, 
          isAuthenticated: true, 
          isLoading: false 
        });
      },

      setEncryptionKey: (key) => set({ encryptionKey: key }),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
    }),
    {
      name: 'thera-app-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        settings: state.settings,
        // Don't persist sensitive data like encryption keys
      }),
    }
  )
);