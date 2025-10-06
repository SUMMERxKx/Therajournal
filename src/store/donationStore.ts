import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DonationConfig, DonationRecord, DonationTier } from '../types/donation';

interface DonationStore {
  // Configuration
  config: DonationConfig;
  
  // User donation history
  donations: DonationRecord[];
  
  // App state
  showSupportBanner: boolean;
  lastBannerShown: string | null;
  
  // Actions
  updateConfig: (config: Partial<DonationConfig>) => void;
  addDonation: (donation: DonationRecord) => void;
  acknowledgeDonation: (donationId: string) => void;
  
  // Banner management
  shouldShowBanner: () => boolean;
  hideBanner: () => void;
  markBannerShown: () => void;
  
  // Analytics
  getTotalDonated: () => number;
  getMonthlyDonations: () => DonationRecord[];
  isSupporter: () => boolean;
}

const defaultConfig: DonationConfig = {
  enabled: true,
  monthlyCap: 25, // $25/month cap
  tiers: [
    {
      id: 'coffee',
      amount: 2,
      label: '☕ Coffee',
      description: 'Buy me a coffee to keep the servers running'
    },
    {
      id: 'lunch',
      amount: 5,
      label: '🍕 Lunch',
      description: 'Help cover a day of AI costs'
    },
    {
      id: 'dinner',
      amount: 10,
      label: '🍽️ Dinner',
      description: 'Support a week of development',
      popular: true
    },
    {
      id: 'sponsor',
      amount: 25,
      label: '⭐ Sponsor',
      description: 'Become a monthly supporter'
    }
  ],
  paypalLink: 'https://paypal.me/therajournal', // Replace with actual link
};

export const useDonationStore = create<DonationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      config: defaultConfig,
      donations: [],
      showSupportBanner: false,
      lastBannerShown: null,

      // Actions
      updateConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig }
      })),

      addDonation: (donation) => set((state) => ({
        donations: [...state.donations, donation]
      })),

      acknowledgeDonation: (donationId) => set((state) => ({
        donations: state.donations.map(d => 
          d.id === donationId ? { ...d, acknowledged: true } : d
        )
      })),

      // Banner management
      shouldShowBanner: () => {
        const { donations, lastBannerShown } = get();
        const now = Date.now();
        
        // Don't show if user has donated recently
        const recentDonation = donations.find(d => 
          Date.now() - new Date(d.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // 7 days
        );
        
        if (recentDonation) return false;
        
        // Show banner every 3 days for non-donors
        if (!lastBannerShown) return true;
        
        const daysSinceLastBanner = (now - new Date(lastBannerShown).getTime()) / (24 * 60 * 60 * 1000);
        return daysSinceLastBanner >= 3;
      },

      hideBanner: () => set({ showSupportBanner: false }),

      markBannerShown: () => set({ 
        lastBannerShown: new Date().toISOString(),
        showSupportBanner: false 
      }),

      // Analytics
      getTotalDonated: () => {
        const { donations } = get();
        return donations.reduce((total, donation) => total + donation.amount, 0);
      },

      getMonthlyDonations: () => {
        const { donations } = get();
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return donations.filter(d => 
          new Date(d.timestamp) >= startOfMonth
        );
      },

      isSupporter: () => {
        const { donations } = get();
        const monthlyDonations = get().getMonthlyDonations();
        const monthlyTotal = monthlyDonations.reduce((sum, d) => sum + d.amount, 0);
        
        // Consider user a supporter if they've donated $5+ this month
        return monthlyTotal >= 5;
      },
    }),
    {
      name: 'thera-donation-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        config: state.config,
        donations: state.donations,
        lastBannerShown: state.lastBannerShown,
      }),
    }
  )
);
