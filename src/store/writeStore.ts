import { create } from 'zustand';
import { WriteState, EntryCreate } from '../data/schemas';

interface WriteStore extends WriteState {
  // Actions
  setCurrentEntry: (entry: Partial<EntryCreate>) => void;
  updateCurrentEntry: (updates: Partial<EntryCreate>) => void;
  clearCurrentEntry: () => void;
  setDraft: (isDraft: boolean) => void;
  setSaving: (saving: boolean) => void;
  
  // Validation
  validateEntry: () => { isValid: boolean; errors: string[] };
  
  // Auto-save
  lastAutoSave: string | null;
  setLastAutoSave: (timestamp: string) => void;
}

const initialEntry: Partial<EntryCreate> = {
  title: '',
  body: '',
  mood: undefined,
  tags: [],
  entry_at: new Date().toISOString(),
};

export const useWriteStore = create<WriteStore>((set, get) => ({
  // Initial state
  currentEntry: { ...initialEntry },
  isDraft: true,
  isSaving: false,
  lastAutoSave: null,

  // Actions
  setCurrentEntry: (entry) => set({ 
    currentEntry: { ...entry },
    isDraft: true 
  }),

  updateCurrentEntry: (updates) => set((state) => ({
    currentEntry: { ...state.currentEntry, ...updates },
    isDraft: true
  })),

  clearCurrentEntry: () => set({ 
    currentEntry: { ...initialEntry },
    isDraft: true,
    lastAutoSave: null
  }),

  setDraft: (isDraft) => set({ isDraft }),

  setSaving: (saving) => set({ isSaving: saving }),

  validateEntry: () => {
    const { currentEntry } = get();
    const errors: string[] = [];

    if (!currentEntry.title || currentEntry.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!currentEntry.body || currentEntry.body.trim().length === 0) {
      errors.push('Entry content is required');
    }

    if (currentEntry.title && currentEntry.title.length > 200) {
      errors.push('Title must be less than 200 characters');
    }

    if (currentEntry.body && currentEntry.body.length > 50000) {
      errors.push('Entry content must be less than 50,000 characters');
    }

    if (currentEntry.mood !== undefined && (currentEntry.mood < -5 || currentEntry.mood > 5)) {
      errors.push('Mood must be between -5 and 5');
    }

    if (currentEntry.tags && currentEntry.tags.length > 10) {
      errors.push('Maximum 10 tags allowed');
    }

    if (currentEntry.tags) {
      for (const tag of currentEntry.tags) {
        if (tag.length === 0 || tag.length > 50) {
          errors.push('Tags must be between 1 and 50 characters');
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  setLastAutoSave: (timestamp) => set({ lastAutoSave: timestamp }),
}));
