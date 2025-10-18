import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { localStorage } from '../utils/storage';
import { Conversation, Message } from '../data/schemas';
import { ConversationQueries } from '../data/queries';

interface ChatStore {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  
  // Actions
  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  createConversation: (userId: string, title: string) => Promise<Conversation>;
  loadConversations: (userId: string) => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      conversations: [],
      currentConversation: null,
      messages: [],

      // Actions
      setCurrentConversation: (conversation) => {
        set({ currentConversation: conversation });
        if (conversation) {
          get().loadMessages(conversation.id);
        }
      },

      addMessage: (message) => {
        const { messages } = get();
        set({ messages: [...messages, message] });
      },

      createConversation: async (userId: string, title: string) => {
        try {
          const result = await ConversationQueries.createConversation({
            user_id: userId,
            title_enc: new Uint8Array(), // Will be encrypted by the query
            iv: new Uint8Array(),
          });
          
          if (result.error) {
            throw new Error(result.error);
          }

          const conversation = result.conversation!;
          const { conversations } = get();
          set({ 
            conversations: [conversation, ...conversations],
            currentConversation: conversation,
            messages: [],
          });

          return conversation;
        } catch (error) {
          throw error;
        }
      },

      loadConversations: async (userId: string) => {
        try {
          const result = await ConversationQueries.getConversations(userId);
          if (result.error) {
            throw new Error(result.error);
          }
          set({ conversations: result.conversations || [] });
        } catch (error) {
          console.error('Failed to load conversations:', error);
        }
      },

      loadMessages: async (conversationId: string) => {
        try {
          const result = await MessageQueries.getMessages(conversationId);
          if (result.error) {
            throw new Error(result.error);
          }
          set({ messages: result.messages || [] });
        } catch (error) {
          console.error('Failed to load messages:', error);
        }
      },
    }),
    {
      name: 'thera-chat-store',
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (name, value) => localStorage.setItem(name, value),
        removeItem: (name) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversation: state.currentConversation,
        // Don't persist messages for privacy
      }),
    }
  )
);