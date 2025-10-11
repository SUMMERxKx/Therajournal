import { supabase } from '../api/supabase';
import { SignUp, SignIn, User } from '../data/schemas';
import { 
  generateDEK, 
  storeDEKInKeystore, 
  storeEncryptedDEK,
  generateSalt,
  deriveKEK,
  hasStoredKeys,
  clearStoredKeys,
  retrieveDEKFromKeystore,
  retrieveEncryptedDEK,
  wrapDEK
} from '../crypto/encryption';
import { KeySetup } from '../data/schemas';
import logger from '../utils/logger';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

export interface KeySetupResult {
  success: boolean;
  error: string | null;
}

/**
 * Sign up a new user
 */
export async function signUp(data: SignUp): Promise<AuthResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'No user data returned' };
    }

    // User profile is automatically created by database trigger
    // We need to wait a moment for the trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (userError) {
      return { user: null, error: userError.message };
    }

    return { user: userData, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(data: SignIn): Promise<AuthResult> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { user: null, error: authError.message };
    }

    if (!authData.user) {
      return { user: null, error: 'No user data returned' };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (userError) {
      return { user: null, error: userError.message };
    }

    return { user: userData, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error: string | null }> {
  try {
    await clearStoredKeys();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return { user: null, error: null };
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', authUser.id)
      .single();

    if (userError) {
      return { user: null, error: userError.message };
    }

    return { user: userData, error: null };
  } catch (error) {
    return { 
      user: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Set up encryption keys for a user
 */
export async function setupKeys(keySetup: KeySetup): Promise<KeySetupResult> {
  try {
    const dek = await generateDEK();

    if (keySetup.useDeviceKeystore) {
      // Simple approach: store DEK directly in device keystore
      await storeDEKInKeystore(dek);
    } else if (keySetup.passphrase) {
      // Advanced approach: wrap DEK with passphrase-derived KEK
      const salt = generateSalt();
      const kek = await deriveKEK(keySetup.passphrase, salt);
      const wrappedDEK = await wrapDEK(dek, kek);
      await storeEncryptedDEK(wrappedDEK, salt);
    } else {
      return { success: false, error: 'Either use device keystore or provide passphrase' };
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Check if user has encryption keys set up
 */
export async function hasEncryptionKeys(): Promise<boolean> {
  return await hasStoredKeys();
}

/**
 * Get the user's encryption key
 */
export async function getUserEncryptionKey(passphrase?: string): Promise<CryptoKey | null> {
  try {
    if (passphrase) {
      // Try to retrieve passphrase-wrapped key
      return await retrieveEncryptedDEK(passphrase);
    } else {
      // Try to retrieve device keystore key
      return await retrieveDEKFromKeystore();
    }
  } catch (error) {
    logger.error('Failed to retrieve encryption key:', error);
    return null;
  }
}

/**
 * Reset user's encryption keys (for account reset)
 */
export async function resetEncryptionKeys(): Promise<{ success: boolean; error: string | null }> {
  try {
    await clearStoredKeys();
    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const result = await getCurrentUser();
      callback(result.user);
    } else {
      callback(null);
    }
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.refreshSession();
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'therajournal://reset-password',
    });
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}
