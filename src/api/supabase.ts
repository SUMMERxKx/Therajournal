import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { webSecureStore } from '../utils/webSecureStore';

// Mock Supabase configuration for frontend testing
// Replace these with your actual Supabase values when ready
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

// Create Supabase client with mock values for frontend testing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: webSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to convert Uint8Array to bytea format for Supabase
export const uint8ArrayToBytea = (arr: Uint8Array): string => {
  return '\\x' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper to convert bytea from Supabase to Uint8Array
export const byteaToUint8Array = (bytea: string): Uint8Array => {
  const hex = bytea.startsWith('\\x') ? bytea.slice(2) : bytea;
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16));
  }
  return new Uint8Array(bytes);
};