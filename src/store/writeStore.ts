import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { localStorage } from '../utils/storage';

interface WriteStore {
  // Form state
  title: string;
  body: string;
  mood: number;
  tags: string[];
  
  // Actions
  setTitle: (title: string) => void;
  setBody: (body: string) => void;
  setMood: (mood: number) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (index: number) => void;
  clearForm: () => void;
}

export const useWriteStore = create<WriteStore>()(
  persist(
    (set, get) => ({
      // Initial state
      title: '',
      body: '',
      mood: 0,
      tags: [],

      // Actions
      setTitle: (title) => set({ title }),
      setBody: (body) => set({ body }),
      setMood: (mood) => set({ mood }),
      setTags: (tags) => set({ tags }),
      
      addTag: (tag) => {
        const { tags } = get();
        if (!tags.includes(tag) && tags.length < 10) {
          set({ tags: [...tags, tag] });
        }
      },
      
      removeTag: (index) => {
        const { tags } = get();
        set({ tags: tags.filter((_, i) => i !== index) });
      },
      
      clearForm: () => set({
        title: '',
        body: '',
        mood: 0,
        tags: [],
      }),
    }),
    {
      name: 'thera-write-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      })),
    }
  )
);