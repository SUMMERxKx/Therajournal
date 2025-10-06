import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  tz: z.string().default('America/Vancouver'),
});

// Entry schemas
export const EntryCreateSchema = z.object({
  entry_at: z.string().datetime().optional(),
  mood: z.number().int().min(-5).max(5).optional(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
});

export const EntryUpdateSchema = EntryCreateSchema.partial();

export const EntryPlainSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  entry_at: z.string().datetime(),
  mood: z.number().int().min(-5).max(5).optional(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  deleted_at: z.string().datetime().optional(),
});

export const EntryEncryptedSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  entry_at: z.string().datetime(),
  mood: z.number().int().min(-5).max(5).optional(),
  title_enc: z.instanceof(Uint8Array),
  body_enc: z.instanceof(Uint8Array),
  iv: z.instanceof(Uint8Array),
  tags_enc: z.instanceof(Uint8Array).optional(),
  deleted_at: z.string().datetime().optional(),
});

// Conversation schemas
export const ConversationCreateSchema = z.object({
  title: z.string().max(200).optional(),
});

export const ConversationPlainSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  title: z.string().optional(),
});

export const ConversationEncryptedSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  title_enc: z.instanceof(Uint8Array).optional(),
  iv: z.instanceof(Uint8Array),
});

// Message schemas
export const MessageCreateSchema = z.object({
  conversation_id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  body: z.string().min(1).max(4000),
});

export const MessagePlainSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  role: z.enum(['user', 'assistant']),
  body: z.string(),
});

export const MessageEncryptedSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  role: z.enum(['user', 'assistant']),
  body_enc: z.instanceof(Uint8Array),
  iv: z.instanceof(Uint8Array),
});

// Search schemas
export const SearchQuerySchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.object({
    moodRange: z.tuple([z.number().int().min(-5), z.number().int().max(5)]).optional(),
    dateRange: z.tuple([z.string().datetime(), z.string().datetime()]).optional(),
    tags: z.array(z.string()).optional(),
  }).optional(),
  limit: z.number().int().min(1).max(50).default(8),
});

export const SearchResultSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
  mood: z.number().int().min(-5).max(5).optional(),
  entry_at: z.string().datetime(),
  score: z.number().min(0).max(1),
});

// Chat schemas
export const ChatContextSchema = z.object({
  entries: z.array(SearchResultSchema),
  conversationHistory: z.array(MessagePlainSchema).max(20),
});

export const LLMResponseSchema = z.object({
  content: z.string().max(2000),
  tokens: z.number().int().min(1),
  cached: z.boolean().default(false),
});

// Weekly reflection schemas
export const WeeklyStatsSchema = z.object({
  entriesCount: z.number().int().min(0),
  avgMood: z.number().min(-5).max(5),
  topKeywords: z.array(z.object({
    word: z.string(),
    count: z.number().int().min(1),
  })),
  moodTrend: z.array(z.object({
    date: z.string().datetime(),
    mood: z.number().min(-5).max(5),
  })),
});

// Auth schemas
export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  timezone: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const KeySetupSchema = z.object({
  passphrase: z.string().min(8).max(128).optional(),
  useDeviceKeystore: z.boolean().default(true),
});

// App state schemas
export const AppStateSchema = z.object({
  user: UserSchema.nullable(),
  isAuthenticated: z.boolean(),
  isLoading: z.boolean(),
  offlineMode: z.boolean(),
  lastSyncAt: z.string().datetime().nullable(),
});

export const WriteStateSchema = z.object({
  currentEntry: EntryCreateSchema.partial(),
  isDraft: z.boolean(),
  isSaving: z.boolean(),
});

export const ChatStateSchema = z.object({
  currentConversation: z.string().uuid().nullable(),
  conversations: z.array(ConversationPlainSchema),
  messages: z.record(z.string().uuid(), z.array(MessagePlainSchema)),
  isGenerating: z.boolean(),
});

export const SearchStateSchema = z.object({
  query: z.string(),
  results: z.array(SearchResultSchema),
  filters: z.object({
    moodRange: z.tuple([z.number().int().min(-5), z.number().int().max(5)]).optional(),
    dateRange: z.tuple([z.string().datetime(), z.string().datetime()]).optional(),
    tags: z.array(z.string()).optional(),
  }),
});

// Type exports
export type User = z.infer<typeof UserSchema>;
export type EntryCreate = z.infer<typeof EntryCreateSchema>;
export type EntryUpdate = z.infer<typeof EntryUpdateSchema>;
export type EntryPlain = z.infer<typeof EntryPlainSchema>;
export type EntryEncrypted = z.infer<typeof EntryEncryptedSchema>;
export type ConversationCreate = z.infer<typeof ConversationCreateSchema>;
export type ConversationPlain = z.infer<typeof ConversationPlainSchema>;
export type ConversationEncrypted = z.infer<typeof ConversationEncryptedSchema>;
export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type MessagePlain = z.infer<typeof MessagePlainSchema>;
export type MessageEncrypted = z.infer<typeof MessageEncryptedSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type ChatContext = z.infer<typeof ChatContextSchema>;
export type LLMResponse = z.infer<typeof LLMResponseSchema>;
export type WeeklyStats = z.infer<typeof WeeklyStatsSchema>;
export type SignUp = z.infer<typeof SignUpSchema>;
export type SignIn = z.infer<typeof SignInSchema>;
export type KeySetup = z.infer<typeof KeySetupSchema>;
export type AppState = z.infer<typeof AppStateSchema>;
export type WriteState = z.infer<typeof WriteStateSchema>;
export type ChatState = z.infer<typeof ChatStateSchema>;
export type SearchState = z.infer<typeof SearchStateSchema>;
