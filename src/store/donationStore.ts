import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { localStorage } from '../utils/storage';

interface DonationStore {
  // State
  totalDonated: number;
  monthlyTotal: number;
  donationCount: number;
  donations: Array<{ amount: number; date: string }>;
  
  // Actions
  addDonation: (amount: number) => void;
  isSupporter: () => boolean;
  getMonthlyDonations: () => number;
}

export const useDonationStore = create<DonationStore>()(
  persist(
    (set, get) => ({
      // Initial state
      totalDonated: 0,
      monthlyTotal: 0,
      donationCount: 0,
      donations: [],

      // Actions
      addDonation: (amount: number) => {
        const { donations, totalDonated, donationCount } = get();
        const newDonation = { amount, date: new Date().toISOString() };
        
        set({
          donations: [...donations, newDonation],
          totalDonated: totalDonated + amount,
          donationCount: donationCount + 1,
          monthlyTotal: get().getMonthlyDonations() + amount,
        });
      },

      isSupporter: () => {
        const { monthlyTotal } = get();
        return monthlyTotal >= 5; // $5+ per month makes you a supporter
      },

      getMonthlyDonations: () => {
        const { donations } = get();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        return donations
          .filter(donation => {
            const donationDate = new Date(donation.date);
            return donationDate.getMonth() === currentMonth && 
                   donationDate.getFullYear() === currentYear;
          })
          .reduce((sum, donation) => sum + donation.amount, 0);
      },
    }),
    {
      name: 'thera-donation-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      })),
    }
  )
);