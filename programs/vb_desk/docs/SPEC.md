# VB Desk Technical Specification (LOCKED)

## Core Design
Sealed-bid auction where no one can see actual bids until the reveal phase. Uses SHA-256 cryptographic commitments for bid hiding.

## 5 Instructions

### 1. `create_auction(auction_id, reserve_price, duration_seconds)`
**Parameters:**
- `auction_id: u64` - Unique identifier for this auction
- `reserve_price: u64` - Minimum acceptable bid (in token units)
- `duration_seconds: u64` - How long auction stays active

**Requires:**
- Seller account (signer)
- Mint account (the token being auctioned... or used for bids?)
- System program

**Creates PDA:**
- `Auction` account seeded by `["auction", auction_id]`

**State:**
- Initializes Auction with start_time = now, end_time = now + duration_seconds
- Sets is_settled = false, is_cancelled = false
- Reserves highest_bid tracking

---

### 2. `submit_bid(auction_id, commitment, deposit_amount)`
**Parameters:**
- `auction_id: u64` - Which auction
- `commitment: [u8; 32]` - SHA256(amount || nonce || bidder_address)
- `deposit_amount: u64` - Fixed deposit locked in escrow

**Requires:**
- Bidder (signer)
- Bidder's token account (ATA or custom)
- Escrow token account (PDA seeded `["escrow", auction_id]`)

**Creates PDA:**
- `Bid` account seeded by `["bid", auction_id, bidder]`

**State:**
- Stores commitment (bid value HIDDEN)
- Transfers `deposit_amount` from bidder → escrow
- Records submission timestamp
- Records first bidder (for tie-breaking)

**Rules:**
- Multiple bids from same bidder: DISALLOWED (PDA already exists error)
- Deposit amount: Must be >= reserve_price (enforce in tests)
- Auction must be active (end_time not reached)

---

### 3. `reveal_bid(auction_id, amount, nonce)`
**Parameters:**
- `auction_id: u64` - Which auction
- `amount: u64` - Actual bid amount
- `nonce: [u8; 32]` - Random bytes used in commitment

**Requires:**
- Bidder (signer)
- Bid account (seeded `["bid", auction_id, bidder]`)
- Auction account

**Verification:**
- Compute SHA256(amount || nonce || bidder.pubkey)
- Must equal stored commitment
- REJECT if mismatch → AuctionError::InvalidCommitment

**State:**
- Marks bid as is_revealed = true
- Stores revealed_amount, nonce
- Updates Auction.highest_bid IF amount > current highest
- Tie-breaker: If amount == highest_bid AND bidder == first_bidder → update to this bidder

**Rules:**
- Reveal phase: Can happen anytime (before AND after auction end)
- Multiple reveals from same bidder: DISALLOWED (already_revealed error)
- Auction must not yet be settled

---

### 4. `settle_auction(auction_id)`
**Parameters:**
- `auction_id: u64` - Which auction

**Requires:**
- Auction account (mut)
- Escrow account (token account holding deposits)
- Seller's token account
- Token program

**Rules:**
- Permissionless: Anyone can call (no signer required, but Auction as owner)
- Must happen AFTER auction end_time
- Must not already be settled

**Cases:**

**A) Reserve Met (highest_bid >= reserve_price):**
- Transfer highest_bid from escrow → seller_token_account
- Remaining deposits stay in escrow (claimed via claim_deposit)

**B) Reserve NOT Met (highest_bid < reserve_price):**
- Mark is_cancelled = true
- All deposits remain in escrow (everyone gets full refund via claim_deposit)
- Seller receives nothing

**State:**
- Marks is_settled = true
- Sets is_cancelled if reserve failed

---

### 5. `claim_deposit(auction_id)`
**Parameters:**
- `auction_id: u64` - Which auction

**Requires:**
- Bidder (signer)
- Bid account (seeded `["bid", auction_id, bidder]`)
- Auction account (must be settled)
- Escrow account
- Bidder's token account
- Token program

**State:**
- Marks claim_processed = true (prevent double-claiming)

**Refund Logic:**

| Case | Condition | Refund |
|------|-----------|--------|
| **Non-revealer** | is_revealed = false | 0 (forfeited to seller) |
| **Winner** | highest_bidder == bidder | deposit_locked - highest_bid |
| **Loser (revealed)** | is_revealed = true, not winner | deposit_locked (full refund) |

**Important:** If reserve was not met (is_cancelled = true):
- ALL bidders get full refund, including non-revealers

---

## PDAs (Program Derived Addresses)

### 1. Auction PDA
```
seeds: [b"auction", auction_id.to_le_bytes()]
authority: the program
```
Contains: Auction struct

### 2. Bid PDA
```
seeds: [b"bid", auction_id.to_le_bytes(), bidder.pubkey]
authority: the program
```
Contains: Bid struct

### 3. Escrow PDA
```
seeds: [b"escrow", auction_id.to_le_bytes()]
authority: Auction account (so it can sign transfers out)
mint: The token mint being used for deposits
```
Contains: TokenAccount (holds all deposits)

---

## Data Structures

### Auction
```rust
pub struct Auction {
    pub auction_id: u64,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub reserve_price: u64,
    pub start_time: u64,          // Unix timestamp
    pub end_time: u64,            // Unix timestamp
    pub highest_bid: u64,
    pub highest_bidder: Option<Pubkey>,
    pub first_bidder: Option<Pubkey>,  // For tie-breaking
    pub is_settled: bool,
    pub is_cancelled: bool,
}
```

### Bid
```rust
pub struct Bid {
    pub auction_id: u64,
    pub bidder: Pubkey,
    pub commitment: [u8; 32],      // SHA256 hash
    pub revealed_amount: Option<u64>,
    pub nonce: Option<[u8; 32]>,
    pub is_revealed: bool,
    pub deposit_locked: u64,
    pub submitted_at: u64,         // Unix timestamp
    pub claim_processed: bool,
}
```

---

## Error Codes
- `InvalidCommitment` - Reveal doesn't match commitment
- `AlreadySettled` - Can't settle twice
- `AuctionStillActive` - Auction end time not reached
- `AuctionNotSettled` - Auction not yet settled (for claim)
- `AlreadyClaimed` - Bid already claimed

---

## Network
**Devnet only** for Day 1-4 development & testing.

---

## Notes for Implementation
1. Use `Clock::get()?.unix_timestamp as u64` for timing
2. Commitment hash: `SHA256(amount.to_le_bytes() || nonce || bidder.pubkey.as_ref())`
3. Token transfers use CPI (Cross-Program Invocation) to spl-token
4. Escrow is a token account (TokenAccount struct), not a regular Lamports account
5. All error checks should happen early to minimize rent waste
6. PDA bumps are auto-derived by Anchor
