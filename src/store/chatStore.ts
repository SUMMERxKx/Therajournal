import { create } from 'zustand';
import { ChatState, ConversationPlain, MessagePlain } from '../data/schemas';

interface ChatStore extends ChatState {
  // Actions
  setCurrentConversation: (conversationId: string | null) => void;
  addConversation: (conversation: ConversationPlain) => void;
  updateConversation: (id: string, updates: Partial<ConversationPlain>) => void;
  removeConversation: (id: string) => void;
  
  // Messages
  addMessage: (conversationId: string, message: MessagePlain) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<MessagePlain>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  setMessages: (conversationId: string, messages: MessagePlain[]) => void;
  
  // UI state
  setGenerating: (generating: boolean) => void;
  
  // Helpers
  getCurrentMessages: () => MessagePlain[];
  getConversation: (id: string) => ConversationPlain | undefined;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  messages: {},
  isGenerating: false,

  // Actions
  setCurrentConversation: (conversationId) => set({ 
    currentConversation: conversationId 
  }),

  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations]
  })),

  updateConversation: (id, updates) => set((state) => ({
    conversations: state.conversations.map(conv => 
      conv.id === id ? { ...conv, ...updates } : conv
    )
  })),

  removeConversation: (id) => set((state) => {
    const { [id]: removed, ...remainingMessages } = state.messages;
    return {
      conversations: state.conversations.filter(conv => conv.id !== id),
      messages: remainingMessages,
      currentConversation: state.currentConversation === id ? null : state.currentConversation
    };
  }),

  addMessage: (conversationId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: [...(state.messages[conversationId] || []), message]
    }
  })),

  updateMessage: (conversationId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: (state.messages[conversationId] || []).map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    }
  })),

  removeMessage: (conversationId, messageId) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: (state.messages[conversationId] || []).filter(msg => msg.id !== messageId)
    }
  })),

  setMessages: (conversationId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: messages
    }
  })),

  setGenerating: (generating) => set({ isGenerating: generating }),

  // Helpers
  getCurrentMessages: () => {
    const { currentConversation, messages } = get();
    return currentConversation ? (messages[currentConversation] || []) : [];
  },

  getConversation: (id) => {
    const { conversations } = get();
    return conversations.find(conv => conv.id === id);
  },

  clearChat: () => set({
    currentConversation: null,
    conversations: [],
    messages: {},
    isGenerating: false
  }),
}));
