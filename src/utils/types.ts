// Core data types for TheraJournal
export interface User {
  user_id: string;
  created_at: string;
  tz: string;
}

export interface Entry {
  id: string;
  user_id: string;
  created_at: string;
  entry_at: string;
  mood?: number; // -5 to +5
  title_enc: Uint8Array;
  body_enc: Uint8Array;
  iv: Uint8Array;
  tags_enc?: Uint8Array;
  deleted_at?: string;
}

export interface EntryPlain {
  id: string;
  user_id: string;
  created_at: string;
  entry_at: string;
  mood?: number;
  title: string;
  body: string;
  tags: string[];
  deleted_at?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  created_at: string;
  title_enc?: Uint8Array;
  iv: Uint8Array;
}

export interface ConversationPlain {
  id: string;
  user_id: string;
  created_at: string;
  title?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  body_enc: Uint8Array;
  iv: Uint8Array;
}

export interface MessagePlain {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
  role: 'user' | 'assistant';
  body: string;
}

export interface SearchResult {
  id: string;
  title: string;
  body: string;
  tags: string[];
  mood?: number;
  entry_at: string;
  score: number;
}

export interface ChatContext {
  entries: SearchResult[];
  conversationHistory: MessagePlain[];
}

export interface WeeklyStats {
  entriesCount: number;
  avgMood: number;
  topKeywords: Array<{ word: string; count: number }>;
  moodTrend: Array<{ date: string; mood: number }>;
}

// Crypto types
export interface CryptoKeys {
  dek: CryptoKey; // Data Encryption Key
  kek?: CryptoKey; // Key Encryption Key (if using passphrase)
}

export interface EncryptedData {
  ciphertext: Uint8Array;
  iv: Uint8Array;
}

// AI types
export interface LLMResponse {
  content: string;
  tokens: number;
  cached: boolean;
}

export interface PromptContext {
  entries: SearchResult[];
  conversationHistory: MessagePlain[];
  userMessage: string;
  maxTokens: number;
}

// App state types
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  offlineMode: boolean;
  lastSyncAt: string | null;
}

export interface WriteState {
  currentEntry: Partial<EntryPlain>;
  isDraft: boolean;
  isSaving: boolean;
}

export interface ChatState {
  currentConversation: string | null;
  conversations: ConversationPlain[];
  messages: Record<string, MessagePlain[]>;
  isGenerating: boolean;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  filters: {
    moodRange?: [number, number];
    dateRange?: [string, string];
    tags?: string[];
  };
}
