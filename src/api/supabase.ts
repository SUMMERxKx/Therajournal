import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Replace with your Supabase project URL and anon key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: require('expo-secure-store'),
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
