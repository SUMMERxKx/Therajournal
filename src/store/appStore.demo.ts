// Demo version of app store for testing UI without backend

import { create } from 'zustand';
import { AppState, User } from '../data/schemas';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setOfflineMode: (offline: boolean) => void;
  setLastSync: (timestamp: string | null) => void;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

// Demo user
const DEMO_USER: User = {
  user_id: 'demo-user-123',
  email: 'demo@therajournal.com',
  created_at: new Date().toISOString(),
  tz: 'America/Vancouver'
};

export const useAppStore = create<AppStore>()((set, get) => ({
  // Initial state
  user: DEMO_USER,
  isAuthenticated: true,
  isLoading: false,
  offlineMode: false,
  lastSync: new Date().toISOString(),
  encryptionKey: null,
  settings: {
    theme: 'auto',
    notifications: true,
    autoSync: true,
    aiProvider: 'groq',
    apiKey: null,
  },

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setOfflineMode: (offlineMode) => set({ offlineMode }),
  
  setLastSync: (lastSync) => set({ lastSync }),
  
  login: async (user) => {
    set({ user, isAuthenticated: true });
  },
  
  logout: async () => {
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: async () => {
    // Demo mode - always authenticated
    set({ user: DEMO_USER, isAuthenticated: true, isLoading: false });
  },
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
}));
