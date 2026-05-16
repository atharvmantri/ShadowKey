import { SecretKey } from './index.js';

const STORAGE_KEY = 'shadowkey_demo_secret_v1';

/**
 * Witness provider: supplies the user's secret from browser localStorage.
 * In production, derive this from a wallet signature or secure enclave.
 */
export function getUserSecret(): SecretKey {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    const arr = new Uint8Array(JSON.parse(stored));
    return { bytes: arr as any };
  }

  // Generate cryptographically secure random 32 bytes
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(randomBytes)));

  return { bytes: randomBytes as any };
}
