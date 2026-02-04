# VB Desk API Reference

Complete reference for all smart contract instructions, accounts, and types.

## Program Overview

- **Program ID:** `TBD` (will be set after devnet deployment)
- **Anchor Version:** 0.32.1
- **Solana Version:** 1.18.x
- **Language:** Rust (Anchor framework)

---

## Instructions

### 1. `create_auction`

Create a new sealed-bid auction for OTC token trading.

**Accounts:**

```rust
pub struct CreateAuction<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        init,
        payer = seller,
        space = 8 + Auction::SPACE,
        seeds = [b"auction", seller.key().as_ref(), &auction_id.to_le_bytes()],
        bump
    )]
    pub auction: Account<'info, Auction>,
    
    pub selling_token_mint: Account<'info, Mint>,
    pub buying_token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == selling_token_mint.key()
    )]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = seller,
        associated_token::mint = selling_token_mint,
        associated_token::authority = auction
    )]
    pub auction_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}
```

**Parameters:**

- `auction_id: u64` - Unique identifier for this auction
- `selling_amount: u64` - Amount of tokens being sold (in token's smallest unit)
- `reserve_price: u64` - Minimum acceptable bid (in buying token's smallest unit)
- `commit_duration: i64` - How long bidders can submit commitments (seconds)
- `reveal_duration: i64` - How long bidders can reveal bids (seconds)
- `min_bid_deposit: u64` - Minimum SOL deposit required from bidders (lamports)

**Example:**

```typescript
await program.methods
  .createAuction(
    new BN(1),           // auction_id
    new BN(10_000000),   // 10 SOL (selling)
    new BN(1000_000000), // 1000 USDC (reserve price)
    new BN(3600),        // 1 hour commit phase
    new BN(1800),        // 30 min reveal phase
    new BN(100000000)    // 0.1 SOL min deposit
  )
  .accounts({ ... })
  .rpc();
```

---

### 2. `place_bid`

Submit a sealed bid (commitment) during the commit phase.

**Accounts:**

```rust
pub struct PlaceBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.status == AuctionStatus::Open,
        constraint = Clock::get()?.unix_timestamp < auction.commit_end
    )]
    pub auction: Account<'info, Auction>,
    
    #[account(
        init,
        payer = bidder,
        space = 8 + Bid::SPACE,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, Bid>,
    
    pub system_program: Program<'info, System>,
}
```

**Parameters:**

- `commitment: [u8; 32]` - SHA-256 hash of (bid_price || nonce)

**Example:**

```typescript
// Client-side: generate commitment
const price = new BN(1050_000000); // 1050 USDC
const nonce = crypto.randomBytes(32);
const commitment = sha256(Buffer.concat([
  price.toArrayLike(Buffer, 'le', 8),
  nonce
]));

// Submit to contract
await program.methods
  .placeBid(Array.from(commitment))
  .accounts({ ... })
  .rpc();

// CRITICAL: Save nonce for reveal phase!
```

---

### 3. `reveal_bid`

Reveal your bid after the commit phase ends.

**Accounts:**

```rust
pub struct RevealBid<'info> {
    pub bidder: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.status == AuctionStatus::Open,
        constraint = Clock::get()?.unix_timestamp >= auction.commit_end,
        constraint = Clock::get()?.unix_timestamp < auction.reveal_end
    )]
    pub auction: Account<'info, Auction>,
    
    #[account(
        mut,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump,
        constraint = bid.bidder == bidder.key(),
        constraint = !bid.revealed
    )]
    pub bid: Account<'info, Bid>,
}
```

**Parameters:**

- `price: u64` - Original bid amount (must match commitment)
- `nonce: [u8; 32]` - Original nonce (must match commitment)

**Example:**

```typescript
await program.methods
  .revealBid(
    new BN(1050_000000),  // original price
    Array.from(nonce)      // original nonce
  )
  .accounts({ ... })
  .rpc();
```

**Verification:**

Contract verifies: `SHA256(price || nonce) == stored_commitment`

If verification fails, transaction reverts and bid remains unrevealed (deposit forfeited).

---

### 4. `finalize_auction`

Finalize the auction after reveal phase ends. Determines winner.

**Accounts:**

```rust
pub struct FinalizeAuction<'info> {
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.status == AuctionStatus::Open,
        constraint = Clock::get()?.unix_timestamp >= auction.reveal_end
    )]
    pub auction: Account<'info, Auction>,
}
```

**Parameters:** None

**Logic:**
1. Iterate through all bids
2. Find highest revealed bid >= reserve price
3. Set auction status to `Finalized`
4. Record winning bid and bidder

**Example:**

```typescript
await program.methods
  .finalizeAuction()
  .accounts({ ... })
  .rpc();
```

---

### 5. `complete_trade`

Execute the trade between seller and winning bidder.

**Accounts:**

```rust
pub struct CompleteTrade<'info> {
    pub winner: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.status == AuctionStatus::Finalized,
        constraint = auction.winner == Some(winner.key())
    )]
    pub auction: Account<'info, Auction>,
    
    #[account(
        mut,
        seeds = [b"bid", auction.key().as_ref(), winner.key().as_ref()],
        bump
    )]
    pub winning_bid: Account<'info, Bid>,
    
    #[account(mut)]
    pub seller: SystemAccount<'info>,
    
    // Token accounts for the trade
    #[account(mut)]
    pub auction_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub winner_payment_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_payment_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}
```

**Parameters:** None

**Logic:**
1. Transfer selling tokens from auction PDA → winner
2. Transfer payment tokens from winner → seller
3. Refund winner's SOL deposit
4. Set trade as completed

---

### 6. `withdraw_bid`

Withdraw deposit for non-winning bids (or cancel before reveal).

**Accounts:**

```rust
pub struct WithdrawBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.status == AuctionStatus::Finalized || 
                     auction.status == AuctionStatus::Cancelled
    )]
    pub auction: Account<'info, Auction>,
    
    #[account(
        mut,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump,
        constraint = bid.bidder == bidder.key(),
        close = bidder
    )]
    pub bid: Account<'info, Bid>,
}
```

**Parameters:** None

**Conditions:**
- Auction must be finalized or cancelled
- Bidder must have revealed their bid (or auction is cancelled)
- Bidder must not be the winner
- If bidder didn't reveal: deposit is forfeited (transferred to seller)

---

### 7. `cancel_auction`

Cancel an auction (seller only, before any bids placed or after failed auction).

**Accounts:**

```rust
pub struct CancelAuction<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,
    
    #[account(
        mut,
        constraint = auction.seller == seller.key(),
        constraint = auction.status == AuctionStatus::Open,
        close = seller
    )]
    pub auction: Account<'info, Auction>,
    
    #[account(mut)]
    pub auction_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}
```

**Parameters:** None

**Conditions:**
- No bids have been placed yet, OR
- All bidders failed to reveal (auction failed)

---

## Account Structures

### `Auction`

```rust
pub struct Auction {
    pub seller: Pubkey,               // 32 bytes
    pub auction_id: u64,              // 8 bytes
    pub selling_token_mint: Pubkey,   // 32 bytes
    pub buying_token_mint: Pubkey,    // 32 bytes
    pub selling_amount: u64,          // 8 bytes
    pub reserve_price: u64,           // 8 bytes
    pub commit_end: i64,              // 8 bytes
    pub reveal_end: i64,              // 8 bytes
    pub min_bid_deposit: u64,         // 8 bytes
    pub status: AuctionStatus,        // 1 byte
    pub winner: Option<Pubkey>,       // 33 bytes (1 + 32)
    pub winning_bid: Option<u64>,     // 9 bytes (1 + 8)
    pub created_at: i64,              // 8 bytes
    pub bump: u8,                     // 1 byte
}
// Total: ~196 bytes + discriminator (8) = 204 bytes
```

**PDA Seeds:** `["auction", seller_pubkey, auction_id_u64]`

### `Bid`

```rust
pub struct Bid {
    pub bidder: Pubkey,          // 32 bytes
    pub auction: Pubkey,         // 32 bytes
    pub commitment: [u8; 32],    // 32 bytes
    pub revealed: bool,          // 1 byte
    pub revealed_price: u64,     // 8 bytes
    pub deposit_amount: u64,     // 8 bytes
    pub created_at: i64,         // 8 bytes
    pub revealed_at: Option<i64>,// 9 bytes (1 + 8)
    pub bump: u8,                // 1 byte
}
// Total: ~131 bytes + discriminator (8) = 139 bytes
```

**PDA Seeds:** `["bid", auction_pubkey, bidder_pubkey]`

---

## Enums

### `AuctionStatus`

```rust
pub enum AuctionStatus {
    Open,       // Accepting bids or reveals
    Finalized,  // Winner determined
    Cancelled,  // Seller cancelled
    Completed,  // Trade executed
}
```

---

## Error Codes

```rust
pub enum ErrorCode {
    #[msg("Auction has not started yet")]
    AuctionNotStarted,
    
    #[msg("Commit phase has ended")]
    CommitPhaseEnded,
    
    #[msg("Reveal phase has not started")]
    RevealPhaseNotStarted,
    
    #[msg("Reveal phase has ended")]
    RevealPhaseEnded,
    
    #[msg("Commitment verification failed")]
    InvalidCommitment,
    
    #[msg("Bid is below reserve price")]
    BidBelowReserve,
    
    #[msg("Insufficient deposit")]
    InsufficientDeposit,
    
    #[msg("Auction already finalized")]
    AlreadyFinalized,
    
    #[msg("No valid bids")]
    NoValidBids,
    
    #[msg("Unauthorized")]
    Unauthorized,
}
```

---

## Events

### `AuctionCreated`

```rust
#[event]
pub struct AuctionCreated {
    pub auction: Pubkey,
    pub seller: Pubkey,
    pub selling_token: Pubkey,
    pub buying_token: Pubkey,
    pub selling_amount: u64,
    pub reserve_price: u64,
    pub commit_end: i64,
    pub reveal_end: i64,
}
```

### `BidPlaced`

```rust
#[event]
pub struct BidPlaced {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub commitment: [u8; 32],
    pub deposit: u64,
}
```

### `BidRevealed`

```rust
#[event]
pub struct BidRevealed {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub price: u64,
}
```

### `AuctionFinalized`

```rust
#[event]
pub struct AuctionFinalized {
    pub auction: Pubkey,
    pub winner: Option<Pubkey>,
    pub winning_bid: Option<u64>,
}
```

### `TradeCompleted`

```rust
#[event]
pub struct TradeCompleted {
    pub auction: Pubkey,
    pub seller: Pubkey,
    pub winner: Pubkey,
    pub amount_sold: u64,
    pub amount_paid: u64,
}
```

---

## TypeScript Client Example

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { VbDesk } from '../target/types/vb_desk';

// Initialize
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.VbDesk as Program<VbDesk>;

// Create auction
const auctionId = new anchor.BN(Date.now());
const [auctionPDA] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("auction"), provider.wallet.publicKey.toBuffer(), auctionId.toArrayLike(Buffer, 'le', 8)],
  program.programId
);

await program.methods
  .createAuction(
    auctionId,
    new anchor.BN(10_000_000_000), // 10 SOL
    new anchor.BN(1000_000_000),   // 1000 USDC
    new anchor.BN(3600),
    new anchor.BN(1800),
    new anchor.BN(100_000_000)
  )
  .accounts({
    seller: provider.wallet.publicKey,
    auction: auctionPDA,
    sellingTokenMint: WSOL_MINT,
    buyingTokenMint: USDC_MINT,
    // ... other accounts
  })
  .rpc();
```

---

## Security Considerations

1. **Commitment Scheme**: Uses SHA-256. Secure against preimage attacks.
2. **Nonce Requirement**: 32-byte nonce prevents brute-force attacks on low-value bids.
3. **Deposit Mechanism**: Prevents spam/griefing. Forfeited if not revealed.
4. **PDA Authority**: Auction PDA controls escrowed tokens, not seller.
5. **Time Checks**: Unix timestamps prevent phase manipulation.
6. **Reveal Verification**: On-chain verification prevents fake reveals.

---

## Rate Limits & Costs

**Account Rent:**
- Auction account: ~0.0028 SOL
- Bid account: ~0.0019 SOL

**Transaction Fees:**
- Create auction: ~0.00005 SOL
- Place bid: ~0.00005 SOL
- Reveal bid: ~0.00001 SOL
- Complete trade: ~0.00007 SOL (token transfers)

**Compute Units:**
- create_auction: ~15,000 CU
- place_bid: ~8,000 CU
- reveal_bid: ~12,000 CU (SHA-256 verification)
- finalize_auction: ~10,000 CU + (500 CU × num_bids)
- complete_trade: ~18,000 CU

---

## License

MIT License - see LICENSE file for details.
