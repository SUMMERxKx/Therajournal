// Demo version of auth utilities for testing UI without backend

import { SignUp, SignIn, User } from '../data/schemas';

export interface AuthResult {
  user: User | null;
  error: string | null;
}

// Mock user data
const DEMO_USER: User = {
  user_id: 'demo-user-123',
  email: 'demo@therajournal.com',
  created_at: new Date().toISOString(),
  tz: 'America/Vancouver'
};

// Demo implementations
export async function signUp(data: SignUp): Promise<AuthResult> {
  // Mock implementation - always succeeds
  return {
    user: DEMO_USER,
    error: null
  };
}

export async function signIn(data: SignIn): Promise<AuthResult> {
  // Mock implementation - always succeeds
  return {
    user: DEMO_USER,
    error: null
  };
}

export async function logout(): Promise<void> {
  // Mock implementation
  console.log('Demo: User logged out');
}

export async function getCurrentUser(): Promise<User | null> {
  // Mock implementation - always returns demo user
  return DEMO_USER;
}

export async function setupEncryptionKeys(data: { passphrase: string }): Promise<{ success: boolean; error?: string }> {
  // Mock implementation - always succeeds
  return { success: true };
}

export async function updatePassword(data: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; error?: string }> {
  // Mock implementation - always succeeds
  return { success: true };
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  // Mock implementation - always succeeds
  return { success: true };
}

export async function resetEncryptionKeys(): Promise<{ success: boolean; error?: string }> {
  // Mock implementation - always succeeds
  return { success: true };
}
