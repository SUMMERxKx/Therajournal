import { CRYPTO_ALGORITHM, CRYPTO_KEY_LENGTH, IV_LENGTH, SALT_LENGTH } from '../utils/constants';
import { EncryptedData, CryptoKeys } from '../utils/types';
// import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../utils/constants';

/**
 * Generate a random Data Encryption Key (DEK)
 */
export async function generateDEK(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: CRYPTO_ALGORITHM,
      length: CRYPTO_KEY_LENGTH,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random IV for encryption
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Derive a Key Encryption Key (KEK) from a passphrase using Argon2id
 * Note: For MVP, we'll use PBKDF2 as it's more widely supported
 */
export async function deriveKEK(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: CRYPTO_ALGORITHM,
      length: CRYPTO_KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt for key derivation
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(
  data: string,
  key: CryptoKey,
  iv?: Uint8Array
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const encryptionIV = iv || generateIV();
  
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: CRYPTO_ALGORITHM,
      iv: encryptionIV,
    },
    key,
    dataBuffer
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    iv: encryptionIV,
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(
  encryptedData: EncryptedData,
  key: CryptoKey
): Promise<string> {
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: CRYPTO_ALGORITHM,
      iv: encryptedData.iv,
    },
    key,
    encryptedData.ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * Wrap a DEK with a KEK for secure storage
 */
export async function wrapDEK(dek: CryptoKey, kek: CryptoKey): Promise<Uint8Array> {
  const exportedDEK = await crypto.subtle.exportKey('raw', dek);
  const wrapped = await crypto.subtle.encrypt(
    {
      name: CRYPTO_ALGORITHM,
      length: CRYPTO_KEY_LENGTH,
    },
    kek,
    exportedDEK
  );

  return new Uint8Array(wrapped);
}

/**
 * Unwrap a DEK using a KEK
 */
export async function unwrapDEK(wrappedDEK: Uint8Array, kek: CryptoKey): Promise<CryptoKey> {
  const unwrapped = await crypto.subtle.decrypt(
    {
      name: CRYPTO_ALGORITHM,
      length: CRYPTO_KEY_LENGTH,
    },
    kek,
    wrappedDEK
  );

  return await crypto.subtle.importKey(
    'raw',
    unwrapped,
    {
      name: CRYPTO_ALGORITHM,
      length: CRYPTO_KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Store encrypted DEK in SecureStore
 */
export async function storeEncryptedDEK(
  wrappedDEK: Uint8Array,
  salt: Uint8Array
): Promise<void> {
  const wrappedHex = Array.from(wrappedDEK).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  
  await SecureStore.setItemAsync(STORAGE_KEYS.DEK, wrappedHex);
  await SecureStore.setItemAsync(STORAGE_KEYS.KEK_SALT, saltHex);
}

/**
 * Retrieve and decrypt DEK from SecureStore
 */
export async function retrieveEncryptedDEK(passphrase: string): Promise<CryptoKey> {
  const wrappedHex = await SecureStore.getItemAsync(STORAGE_KEYS.DEK);
  const saltHex = await SecureStore.getItemAsync(STORAGE_KEYS.KEK_SALT);
  
  if (!wrappedHex || !saltHex) {
    throw new Error('No encrypted DEK found in storage');
  }

  const wrappedDEK = new Uint8Array(
    wrappedHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );

  const kek = await deriveKEK(passphrase, salt);
  return await unwrapDEK(wrappedDEK, kek);
}

/**
 * Store DEK directly in device keystore (simpler but device-dependent)
 */
export async function storeDEKInKeystore(dek: CryptoKey): Promise<void> {
  const exportedDEK = await crypto.subtle.exportKey('raw', dek);
  const dekHex = Array.from(new Uint8Array(exportedDEK))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  await SecureStore.setItemAsync(STORAGE_KEYS.DEK, dekHex);
}

/**
 * Retrieve DEK from device keystore
 */
export async function retrieveDEKFromKeystore(): Promise<CryptoKey> {
  const dekHex = await SecureStore.getItemAsync(STORAGE_KEYS.DEK);
  
  if (!dekHex) {
    throw new Error('No DEK found in device keystore');
  }

  const dekBytes = new Uint8Array(
    dekHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );

  return await crypto.subtle.importKey(
    'raw',
    dekBytes,
    {
      name: CRYPTO_ALGORITHM,
      length: CRYPTO_KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Clear all stored keys (for logout/reset)
 */
export async function clearStoredKeys(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.DEK);
  await SecureStore.deleteItemAsync(STORAGE_KEYS.KEK_SALT);
}

/**
 * Check if keys are stored
 */
export async function hasStoredKeys(): Promise<boolean> {
  const dek = await SecureStore.getItemAsync(STORAGE_KEYS.DEK);
  return dek !== null;
}

/**
 * Convert Uint8Array to hex string for storage
 */
export function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
}
