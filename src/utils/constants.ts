// App constants
export const APP_NAME = 'TheraJournal';

// Encryption constants
export const CRYPTO_ALGORITHM = 'AES-GCM';
export const CRYPTO_KEY_LENGTH = 256;
export const IV_LENGTH = 12; // 96 bits for GCM
export const SALT_LENGTH = 32;

// Token limits for AI
export const MAX_CONTEXT_TOKENS = 500;
export const MAX_OUTPUT_TOKENS = 200;
export const MAX_INPUT_TOKENS = 1000;

// Search limits
export const MAX_SEARCH_RESULTS = 8;
export const SEARCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pagination
export const ENTRIES_PER_PAGE = 20;
export const MESSAGES_PER_PAGE = 50;

// Mood scale
export const MOOD_MIN = -5;
export const MOOD_MAX = 5;
export const MOOD_LABELS = [
  'Very Low',
  'Low',
  'Below Average',
  'Average',
  'Above Average',
  'Good',
  'Very Good'
];

// Crisis keywords for safety
export const CRISIS_KEYWORDS = [
  'suicidal',
  'kill myself',
  'end it all',
  'self harm',
  'hurt myself',
  'want to die',
  'not worth living'
];

// Resource URLs (you'll need to replace with actual resources)
export const CRISIS_RESOURCES = {
  national: 'https://suicidepreventionlifeline.org',
  chat: 'https://suicidepreventionlifeline.org/chat/',
  text: 'Text HOME to 741741',
  phone: '988'
};

// Storage keys
export const STORAGE_KEYS = {
  DEK: 'thera_dek',
  KEK_SALT: 'thera_kek_salt',
  SEARCH_INDEX: 'thera_search_index',
  LAST_SYNC: 'thera_last_sync',
  USER_PREFERENCES: 'thera_user_prefs'
} as const;

// API endpoints (for Supabase Edge Functions)
export const API_ENDPOINTS = {
  CHAT: '/chat',
  REFLECTION: '/reflection'
} as const;
