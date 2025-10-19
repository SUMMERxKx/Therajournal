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

    // Try to get user profile, with retry logic
    let userData = null;
    let userError = null;
    
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle(); // Use maybeSingle() instead of single()
      
      if (data && !error) {
        userData = data;
        break;
      }
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        userError = error;
        break;
      }
      
      // Wait a bit more and try again
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (userError) {
      return { user: null, error: userError.message };
    }

    if (!userData) {
      // If no user profile was created, the trigger might have failed
      // Let's try to create one with a longer wait and different approach
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try one more time to get the user profile
      const { data: retryData, error: retryError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();
      
      if (retryData) {
        userData = retryData;
      } else {
        // If still no profile, try to create one using the database function
        const { data: functionResult, error: functionError } = await supabase
          .rpc('create_user_profile', { user_uuid: authData.user.id });
        
        if (functionResult && !functionError) {
          userData = functionResult;
        } else {
          // If all else fails, return the auth user data without the profile
          return { 
            user: {
              user_id: authData.user.id,
              email: authData.user.email || '',
              created_at: authData.user.created_at,
              tz: 'America/Vancouver'
            }, 
            error: null 
          };
        }
      }
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
      .maybeSingle(); // Use maybeSingle() instead of single()

    if (userError) {
      return { user: null, error: userError.message };
    }

    if (!userData) {
      // If no user profile exists, return auth user data
      // The profile will be created by the trigger on next interaction
      return { 
        user: {
          user_id: authData.user.id,
          email: authData.user.email || '',
          created_at: authData.user.created_at,
          tz: 'America/Vancouver'
        }, 
        error: null 
      };
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
      .maybeSingle(); // Use maybeSingle() instead of single()

    if (userError) {
      return { user: null, error: userError.message };
    }

    if (!userData) {
      // If no user profile exists, return auth user data
      // The profile will be created by the trigger on next interaction
      return { 
        user: {
          user_id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at,
          tz: 'America/Vancouver'
        }, 
        error: null 
      };
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
