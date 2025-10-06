// Demo version of encryption utilities for testing UI without secure store

export interface EncryptedData {
  data: ArrayBuffer;
  iv: Uint8Array;
}

export interface CryptoKeys {
  dek: CryptoKey;
  kek: CryptoKey;
  salt: Uint8Array;
}

// Demo implementations that return mock data
export async function generateDEK(): Promise<CryptoKey> {
  // Mock implementation for demo
  return {} as CryptoKey;
}

export function generateIV(): Uint8Array {
  return new Uint8Array(12); // Mock IV
}

export async function deriveKEK(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  // Mock implementation for demo
  return {} as CryptoKey;
}

export async function encryptData(data: string, key: CryptoKey, iv: Uint8Array): Promise<EncryptedData> {
  // Mock implementation - just return the original data as "encrypted"
  const encoder = new TextEncoder();
  return {
    data: encoder.encode(data).buffer,
    iv: iv
  };
}

export async function decryptData(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
  // Mock implementation - just return the data as "decrypted"
  const decoder = new TextDecoder();
  return decoder.decode(encryptedData.data);
}

export async function storeKeys(keys: CryptoKeys): Promise<void> {
  // Mock implementation for demo
  console.log('Demo: Storing keys');
}

export async function retrieveKeys(): Promise<CryptoKeys | null> {
  // Mock implementation for demo
  console.log('Demo: Retrieving keys');
  return null;
}

export async function removeKeys(): Promise<void> {
  // Mock implementation for demo
  console.log('Demo: Removing keys');
}
