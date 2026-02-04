import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random 32-byte nonce (salt) for bid commitment
 * CRITICAL: User must save this nonce to reveal their bid later
 */
export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create SHA-256 commitment from bid price and nonce
 * commitment = SHA256(price || nonce)
 */
export function createCommitment(priceInLamports: bigint, nonce: string): Buffer {
  const priceBuffer = Buffer.alloc(8);
  priceBuffer.writeBigUInt64LE(priceInLamports);
  
  const nonceBuffer = Buffer.from(nonce, 'hex');
  const combined = Buffer.concat([priceBuffer, nonceBuffer]);
  
  return createHash('sha256').update(combined).digest();
}

/**
 * Verify that a revealed bid matches the original commitment
 */
export function verifyCommitment(
  priceInLamports: bigint,
  nonce: string,
  originalCommitment: Buffer
): boolean {
  const computedCommitment = createCommitment(priceInLamports, nonce);
  return computedCommitment.equals(originalCommitment);
}

/**
 * Store nonce in localStorage with big warning
 * NOTE: This is NOT secure long-term storage - users should backup externally
 */
export function storeNonce(auctionId: string, nonce: string): void {
  const key = `vbdesk_nonce_${auctionId}`;
  localStorage.setItem(key, nonce);
  
  // Also store a warning flag
  localStorage.setItem(`${key}_warned`, 'true');
}

/**
 * Retrieve stored nonce
 */
export function retrieveNonce(auctionId: string): string | null {
  const key = `vbdesk_nonce_${auctionId}`;
  return localStorage.getItem(key);
}

/**
 * Check if user has been warned about nonce storage
 */
export function hasBeenWarned(auctionId: string): boolean {
  const key = `vbdesk_nonce_${auctionId}_warned`;
  return localStorage.getItem(key) === 'true';
}
