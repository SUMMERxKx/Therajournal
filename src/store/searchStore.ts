import { create } from 'zustand';
import { SearchState, SearchResult } from '../data/schemas';

interface SearchStore extends SearchState {
  // Actions
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  updateFilters: (filters: Partial<SearchState['filters']>) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  
  // Helpers
  hasActiveFilters: () => boolean;
  getFilteredResults: () => SearchResult[];
}

const initialFilters = {
  moodRange: undefined,
  dateRange: undefined,
  tags: undefined,
};

export const useSearchStore = create<SearchStore>((set, get) => ({
  // Initial state
  query: '',
  results: [],
  filters: initialFilters,

  // Actions
  setQuery: (query) => set({ query }),

  setResults: (results) => set({ results }),

  updateFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  clearFilters: () => set({ filters: initialFilters }),

  clearSearch: () => set({ 
    query: '', 
    results: [], 
    filters: initialFilters 
  }),

  // Helpers
  hasActiveFilters: () => {
    const { filters } = get();
    return !!(
      filters.moodRange || 
      filters.dateRange || 
      (filters.tags && filters.tags.length > 0)
    );
  },

  getFilteredResults: () => {
    const { results, filters } = get();
    
    return results.filter(result => {
      // Mood filter
      if (filters.moodRange && result.mood !== undefined) {
        const [min, max] = filters.moodRange;
        if (result.mood < min || result.mood > max) return false;
      }

      // Date filter
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        if (result.entry_at < start || result.entry_at > end) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          result.tags.some(resultTag => 
            resultTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  },
}));
