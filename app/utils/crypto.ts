import crypto from 'crypto';

/**
 * Generate SHA256 hash for sealed bid
 * Used to securely commit to a bid amount without revealing it
 * 
 * @param amount - Bid amount (string or number)
 * @param nonce - Random secret string
 * @returns Hex-encoded SHA256 hash
 * 
 * @example
 * const hash = generateBidHash('5.5', 'my-secret-nonce');
 * // Returns: 'a3f4d2e1...' (64 char hex)
 */
export const generateBidHash = (amount: string | number, nonce: string): string => {
  const data = `${amount}${nonce}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Verify that an amount + nonce produce the expected hash
 * 
 * @param amount - Bid amount
 * @param nonce - Secret nonce
 * @param expectedHash - Hash to verify against
 * @returns true if hash matches
 */
export const verifyBidHash = (amount: string | number, nonce: string, expectedHash: string): boolean => {
  const hash = generateBidHash(amount, nonce);
  return hash === expectedHash;
};

/**
 * Generate a random nonce for sealing bids
 * @param length - Nonce length in bytes (default 32)
 * @returns Random hex string
 */
export const generateNonce = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password or secret for storage
 * NOT for bid hashing - use generateBidHash() instead
 * 
 * @param password - Secret to hash
 * @returns Hash string
 */
export const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Encode bid data for smart contract
 * Format: amount (u64) + nonce (32 bytes)
 * 
 * @param amount - Bid amount in SOL
 * @param nonce - Secret nonce
 * @returns Encoded buffer (ready to send to contract)
 */
export const encodeBidData = (amount: number, nonce: string): Buffer => {
  // Convert amount to lamports (1 SOL = 1e9 lamports)
  const lamports = BigInt(Math.round(amount * 1e9));
  
  // Create buffer for amount (8 bytes, little-endian u64)
  const amountBuffer = Buffer.alloc(8);
  amountBuffer.writeBigUInt64LE(lamports, 0);
  
  // Convert nonce string to buffer (should be hex)
  const nonceBuffer = Buffer.from(nonce, 'hex');
  
  // Combine: amount + nonce
  return Buffer.concat([amountBuffer, nonceBuffer]);
};

/**
 * Decode bid data from smart contract response
 * 
 * @param data - Encoded bid data
 * @returns { amount: number in SOL, nonce: string in hex }
 */
export const decodeBidData = (data: Buffer): { amount: number; nonce: string } => {
  // First 8 bytes: amount (little-endian u64)
  const lamports = data.readBigUInt64LE(0);
  const amount = Number(lamports) / 1e9;
  
  // Remaining bytes: nonce
  const nonce = data.slice(8).toString('hex');
  
  return { amount, nonce };
};

/**
 * Format amount for display
 * @param amount - Amount in SOL
 * @param decimals - Decimal places (default 2)
 * @returns Formatted string (e.g., "5.50 SOL")
 */
export const formatSol = (amount: number, decimals: number = 2): string => {
  return `${amount.toFixed(decimals)} SOL`;
};

/**
 * Parse SOL string to number
 * Handles "5.5 SOL" or "5.5" formats
 * 
 * @param input - Input string
 * @returns Parsed amount or null if invalid
 */
export const parseSol = (input: string): number | null => {
  const cleaned = input.replace(/\s*SOL\s*/i, '').trim();
  const amount = parseFloat(cleaned);
  return !isNaN(amount) && amount > 0 ? amount : null;
};
