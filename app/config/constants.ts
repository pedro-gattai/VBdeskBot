/**
 * VB Desk - Frontend Configuration Constants
 */

export const APP_NAME = 'VB Desk';
export const APP_DESCRIPTION = 'Sealed-Bid Auction Platform on Solana';
export const APP_VERSION = '0.2.0';

/**
 * Solana Configuration
 */
export const SOLANA_NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK as 'devnet' | 'mainnet-beta' | 'testnet') || 'devnet';
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet.solana.com';
export const PROGRAM_ID = process.env.NEXT_PUBLIC_PROGRAM_ID || '';

/**
 * Wallet Configuration
 */
export const WALLET_AUTO_CONNECT = process.env.NEXT_PUBLIC_AUTO_CONNECT_WALLET === 'true';

/**
 * Auction Constants
 */
export const AUCTION_STATUS = {
  ACTIVE: 'active',
  PENDING_REVEAL: 'pending_reveal',
  COMPLETED: 'completed',
} as const;

export const AUCTION_DURATION_PRESETS = [
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 },
  { label: '72 hours', hours: 72 },
  { label: '1 week', hours: 168 },
] as const;

export const MIN_BID_INCREMENT = 0.01; // SOL
export const MIN_STARTING_BID = 0.1;  // SOL

/**
 * Bid Constraints
 */
export const BID_NONCE_MIN_LENGTH = 8;  // bytes
export const BID_NONCE_MAX_LENGTH = 32; // bytes
export const BID_HASH_LENGTH = 64;      // SHA256 hex = 64 chars

/**
 * UI Configuration
 */
export const ITEMS_PER_PAGE = 12;
export const AUCTION_GRID_COLUMNS = {
  mobile: 1,
  tablet: 2,
  desktop: 3,
} as const;

/**
 * Time Configuration (ms)
 */
export const REFRESH_INTERVALS = {
  AUCTION_LIST: 30000,      // 30s
  AUCTION_DETAIL: 5000,     // 5s
  COUNTDOWN: 1000,          // 1s
  BID_STATUS: 10000,        // 10s
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your Phantom wallet',
  INVALID_AMOUNT: 'Please enter a valid bid amount',
  AMOUNT_TOO_LOW: `Minimum bid is ${MIN_STARTING_BID} SOL`,
  INVALID_NONCE: 'Nonce must be at least 8 characters',
  BID_SUBMISSION_FAILED: 'Failed to submit bid. Please try again.',
  REVEAL_FAILED: 'Failed to reveal bid. Please check your inputs.',
  CREATE_FAILED: 'Failed to create auction. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  RPC_ERROR: 'RPC endpoint error. Please try again.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  BID_PLACED: 'Bid submitted successfully!',
  BID_REVEALED: 'Bid revealed successfully!',
  AUCTION_CREATED: 'Auction created successfully!',
  WALLET_CONNECTED: 'Wallet connected successfully!',
} as const;

/**
 * Status Colors (Tailwind classes)
 */
export const STATUS_COLORS = {
  active: {
    bg: 'bg-green-500/20',
    text: 'text-green-300',
    dot: 'bg-green-500',
  },
  pending_reveal: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-300',
    dot: 'bg-yellow-500',
  },
  completed: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    dot: 'bg-slate-500',
  },
} as const;

/**
 * Links & External Resources
 */
export const EXTERNAL_LINKS = {
  PHANTOM_WALLET: 'https://phantom.app',
  SOLANA_EXPLORER: `https://explorer.solana.com/?cluster=${SOLANA_NETWORK}`,
  SOLANA_FAUCET: 'https://faucet.solana.com',
  DOCS: 'https://docs.solana.com',
} as const;

/**
 * Deployment Info
 */
export const DEPLOYMENT_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_DEPLOYMENT_NAME || 'Development',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown',
} as const;
