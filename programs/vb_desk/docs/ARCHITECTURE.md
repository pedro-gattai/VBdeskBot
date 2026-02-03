# VB Desk - System Architecture

## Overview

VB Desk is a **sealed-bid auction system on Solana**. Sellers create auctions for assets (SPL tokens, NFTs, or custom data), and bidders submit bids using cryptographic hash commitments to hide their bid amounts until a reveal phase.

**Key Innovation:** Hash commitments (`Keccak256(value || nonce || bidder)`) ensure bidders cannot see others' bids until the reveal phase, preventing collusion and bid-sniping.

---

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Seller Creates Auction                                     │
│  (asset, reserve price, bidding deadline, reveal deadline)  │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Bidding Phase (now → bidding_deadline)                     │
│  - Bidders submit Keccak256 commitments + escrow deposits   │
│  - Bids are hidden (only hash visible)                      │
│  - Multiple bids per auction allowed                        │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Reveal Phase (bidding_deadline → reveal_deadline)          │
│  - Bidders reveal: value + nonce                            │
│  - Contract verifies: Keccak256(value || nonce || bidder)   │
│  - Revealed bid value extracted and stored                  │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Settlement (after reveal_deadline)                         │
│  - Determine highest valid reveal                           │
│  - If >= reserve price: winner wins auction                 │
│  - If < reserve price: auction fails, asset returned        │
│  - Loser deposits refunded                                  │
└─────────┬───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│  Claim Phase                                                │
│  - Winner claims asset + seller claims payment              │
│  - Non-winners claim deposit refunds                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Smart Contract Architecture

### Program Entry Point: `lib.rs`

Routes all instructions to handlers:

```rust
pub fn route_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> Result<()> {
    let instruction = VBDeskInstruction::unpack(data)?;
    match instruction {
        VBDeskInstruction::CreateAuction { ... } => create_auction(...),
        VBDeskInstruction::SubmitBid { ... } => submit_bid(...),
        VBDeskInstruction::RevealBid { ... } => reveal_bid(...),
        VBDeskInstruction::SettleAuction { ... } => settle_auction(...),
        VBDeskInstruction::ClaimDeposit { ... } => claim_deposit(...),
    }
}
```

### Account Structures

#### 1. **Auction Account (PDA)**

Stores auction metadata and state.

```rust
pub struct Auction {
    pub auction_id: u64,           // Unique ID, auto-increment
    pub seller: Pubkey,             // Auction creator
    pub asset: Pubkey,              // SPL token mint or NFT mint
    pub reserve_price: u64,         // Min bid amount (lamports or token units)
    pub bidding_deadline: i64,      // Unix timestamp (when bidding closes)
    pub reveal_deadline: i64,       // Unix timestamp (when reveals must complete)
    pub state: AuctionState,        // ACTIVE, REVEALING, SETTLED
    pub winner: Option<Pubkey>,     // Highest bidder (after settlement)
    pub winning_bid: Option<u64>,   // Highest bid amount
    pub total_bids_submitted: u32,  // Count of bids submitted
    pub total_bids_revealed: u32,   // Count of bids revealed
    pub bump: u8,                   // PDA bump seed
}

pub enum AuctionState {
    Active,      // Bidding phase ongoing
    Revealing,   // Reveal phase (bids closed, reveals open)
    Settled,     // Settlement complete
    Cancelled,   // No winner (all bids < reserve)
}
```

**PDA Seed:** `["auction", seller, auction_id]`

#### 2. **Bid Account (PDA)**

Stores individual bid commitment and revealed value.

```rust
pub struct Bid {
    pub auction_id: u64,                 // Reference to auction
    pub bidder: Pubkey,                  // Bid submitter
    pub commitment_hash: [u8; 32],       // Keccak256(value || nonce || bidder)
    pub revealed_value: Option<u64>,     // Bid amount (after reveal)
    pub deposit_amount: u64,             // Escrow amount locked
    pub deposit_received: bool,          // Has escrow been transferred?
    pub claimed: bool,                   // Has bidder claimed refund/payment?
    pub bump: u8,                        // PDA bump seed
}
```

**PDA Seed:** `["bid", auction_id, bidder_pubkey]`

#### 3. **Deposit Escrow Account**

Holds locked SOL or SPL tokens from bidders.

```rust
pub struct Escrow {
    pub auction_id: u64,
    pub bidder: Pubkey,
    pub amount: u64,
    pub token_type: TokenType,  // SOL, SPL, or NFT
    pub release_authorized: bool,
    pub bump: u8,
}

pub enum TokenType {
    Sol,
    Spl { mint: Pubkey },
    Nft { mint: Pubkey },
}
```

**PDA Seed:** `["escrow", auction_id, bidder_pubkey]`

---

## Instruction Details

### 1. `create_auction()`

**Purpose:** Seller initiates auction

**Parameters:**
- `asset`: SPL token mint or NFT mint to auction
- `reserve_price`: Minimum acceptable bid (in lamports or token units)
- `bidding_deadline`: Unix timestamp when bidding closes
- `reveal_deadline`: Unix timestamp when reveals must complete

**Validation:**
- ✅ `reveal_deadline > bidding_deadline`
- ✅ Both deadlines in future
- ✅ Reserve price > 0
- ✅ Seller signs transaction
- ✅ Seller has asset to transfer (escrow it to contract)

**State Change:**
- Create `Auction` PDA with auto-incrementing ID
- Transfer asset to contract custody
- Mark auction as `ACTIVE`

**Error Cases:**
- `InvalidDeadline` - Deadlines in wrong order or past
- `InvalidReservePrice` - Zero or negative
- `MissingAsset` - Seller doesn't have asset to auction

---

### 2. `submit_bid()`

**Purpose:** Bidder submits commitment hash + escrow deposit

**Parameters:**
- `auction_id`: Which auction to bid on
- `commitment_hash`: Keccak256(value || nonce || bidder_pubkey)
- `deposit_amount`: SOL/tokens to lock as security

**Validation:**
- ✅ Auction exists and in `ACTIVE` state
- ✅ Current time < bidding_deadline
- ✅ Deposit amount >= minimum (TBD: 10 lamports? 0.1 SOL?)
- ✅ Bidder has sufficient balance
- ✅ No duplicate bids from same bidder (or allow update?)

**State Change:**
- Create `Bid` PDA with commitment hash
- Create `Escrow` PDA, lock bidder's deposit
- Increment `total_bids_submitted` counter
- Transition auction to `REVEALING` if bidding deadline passed

**Error Cases:**
- `AuctionNotFound` - Auction ID invalid
- `AuctionClosed` - Bidding deadline passed
- `InsufficientDeposit` - Deposit too small
- `BidAlreadySubmitted` - Bidder already bid on this auction

---

### 3. `reveal_bid()`

**Purpose:** Bidder reveals actual bid amount and nonce

**Parameters:**
- `auction_id`: Auction to reveal in
- `bid_amount`: The actual bid value (uint64)
- `nonce`: Random value used in commitment

**Validation:**
- ✅ Bid exists with matching `auction_id` + `bidder`
- ✅ Hash verification: `Keccak256(bid_amount || nonce || bidder) == commitment_hash`
- ✅ Current time < reveal_deadline
- ✅ Bid not already revealed

**State Change:**
- Update `Bid.revealed_value = bid_amount`
- Increment `total_bids_revealed` counter
- Transition auction to `REVEALING` state if needed

**Error Cases:**
- `BidNotFound` - No bid exists for this (auction, bidder)
- `HashMismatch` - Provided (value, nonce) doesn't match commitment
- `AlreadyRevealed` - Bid already revealed (idempotent?)
- `RevealWindowClosed` - Current time > reveal_deadline

---

### 4. `settle_auction()`

**Purpose:** After reveal deadline, determine winner and settle

**Parameters:**
- `auction_id`: Auction to settle

**Validation:**
- ✅ Current time > reveal_deadline
- ✅ Auction not already settled
- ✅ At least one valid reveal

**Logic:**
1. Scan all `Bid` PDAs for auction_id
2. Find `max(revealed_value)` across all reveals
3. If `max_value >= reserve_price`:
   - **Winner Found:** Mark winner, store winning bid
   - Transfer asset to winner
   - Transfer winning bid amount to seller
4. If `max_value < reserve_price` (or no reveals):
   - **Auction Failed:** Return asset to seller
   - Mark deposits available for refund (see spec question)

**State Change:**
- Update auction to `SETTLED`
- Set `winner` and `winning_bid`

**Error Cases:**
- `AuctionNotFound`
- `TooEarlyToSettle` - reveal_deadline not yet passed
- `AuctionAlreadySettled` - Idempotent? (should be allowed)
- `NoValidBids` - No one revealed, fallback behavior

---

### 5. `claim_deposit()`

**Purpose:** Non-winners recover deposits; winner gets payment applied

**Parameters:**
- `auction_id`: Auction to claim from

**Validation:**
- ✅ Auction is `SETTLED`
- ✅ Bid exists for (auction, claimer)
- ✅ Not yet claimed

**Logic:**

**If claimer is WINNER:**
- Deposit applied as partial payment (or full refund?)
- **SPEC QUESTION:** Does winner's deposit offset seller payment?

**If claimer is NON-WINNER (who revealed):**
- Full deposit refunded to claimer
- (Standard case)

**If claimer NEVER REVEALED:**
- **SPEC QUESTION:** Refund or forfeit?
- Current plan: **Refund** (don't punish non-reveals)

**State Change:**
- Mark bid as `claimed`
- Transfer escrow to claimer

**Error Cases:**
- `AuctionNotFound`
- `BidNotFound`
- `AuctionNotSettled`
- `AlreadyClaimed` - Prevent double-claim

---

## Hash Commitment Scheme

### Design

```
commitment_hash = Keccak256(bid_value || nonce || bidder_pubkey)
```

**Why Keccak256?**
- Industry standard (Ethereum, Bitcoin, etc.)
- Preimage resistance: can't find (value, nonce) from hash
- Collision resistance: high confidence no hash collisions
- Already available in Solana ecosystem (`solana_program::keccak`)

**Security Properties:**
- **Bidder can't change bid after committing:** Would need new nonce → different hash
- **Can't see others' bid values until reveal:** Only commitment hash visible on-chain
- **No double-bidding:** Commitment is unique per (bid_value, nonce, bidder) tuple

### Client-Side Generation (Frontend)

```typescript
import { keccak_256 } from 'js-sha3';

function createCommitment(
  bidAmount: number,
  nonce: Buffer,  // 32 random bytes
  bidderPubkey: PublicKey
): Buffer {
  const packed = Buffer.concat([
    Buffer.from(new BigInt64Array([BigInt(bidAmount)]).buffer),
    nonce,
    bidderPubkey.toBuffer(),
  ]);
  return Buffer.from(keccak_256(packed), 'hex');
}
```

### Contract Verification (Rust)

```rust
use solana_program::keccak;

pub fn verify_commitment(
    bid_value: u64,
    nonce: &[u8; 32],
    bidder: &Pubkey,
    claimed_commitment: &[u8; 32],
) -> Result<()> {
    let mut hasher = keccak::Hasher::default();
    hasher.hash(&bid_value.to_le_bytes());
    hasher.hash(nonce);
    hasher.hash(bidder.as_ref());
    let hash = hasher.finalize();
    
    if hash.0 != *claimed_commitment {
        return Err(VBDeskError::HashMismatch.into());
    }
    Ok(())
}
```

---

## Account Relationships

```
                        ┌──────────────┐
                        │   Auction    │
                        │    (PDA)     │
                        │              │
                        │ auction_id   │
                        │ seller       │
                        │ asset        │
                        │ state        │
                        │ winner       │
                        └──────┬───────┘
                               │
                    ┌──────────┴──────────┬─────────┐
                    │                     │         │
              1     │1                   1 │         │n
           ┌────────▼────────┐   ┌────────▼──────┐  │
           │   Asset Escrow  │   │   Bid #1 (PDA)│  │
           │   (Seller's)    │   │                │  │
           │                 │   │  bidder_1     │  │
           │  amount         │   │  commitment_  │  │
           │  token_type     │   │    hash       │  │
           │                 │   │  revealed_    │  │
           └─────────────────┘   │    value: 150 │  │
                                 │                │  │
                                 │  ┌────────────┐│  │
                                 │  │ Deposit    ││  │
                                 │  │ Escrow #1  ││  │
                                 │  │  50 SOL    ││  │
                                 │  └────────────┘│  │
                                 └────────────────┘  │
                                                    │
                            ┌───────────────────────┘
                            │
                     ┌──────▼────────┐
                     │  Bid #2 (PDA) │
                     │                │
                     │  bidder_2      │
                     │  commitment_   │
                     │    hash        │
                     │  revealed_     │
                     │    value: 100  │
                     │                │
                     │  ┌───────────┐ │
                     │  │ Deposit   │ │
                     │  │ Escrow #2 │ │
                     │  │ 50 SOL    │ │
                     │  └───────────┘ │
                     └────────────────┘
```

---

## Security Model

### Assumptions

1. **Solana VM is secure** - No ability to forge signatures, modify data
2. **Keccak256 is cryptographically secure** - No practical preimage/collision attacks
3. **Contract is deterministic** - Same inputs always produce same outputs
4. **Wallets are trusted** - Users control their private keys (no compromise)

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| **Bid Sniping** (bidder waits to see others' bids) | Commitment hashing hides bids until reveal |
| **Collusion** (multiple bidders coordinate) | No way to share hidden bid values; risk = exposure |
| **Reentrancy** (malicious bidder re-enters settle) | `Bid` marked claimed immediately; CPI guards |
| **Arithmetic Overflow** (bid value > u64::MAX) | Checked arithmetic in Anchor |
| **Timestamp Manipulation** (validator can tweak time) | Soft constraint only (±25 seconds possible); mitigated by long deadlines |
| **Front-running** (network observer replays bid) | Signature required; can't replay reveal with wrong nonce |
| **Selfish Seller** (seller changes mind, tries to cancel) | No cancel instruction; asset locked until settlement |
| **Missing Reveals** (bidder submits bid but never reveals) | Deposit forfeited OR refunded (spec TBD) |

### Critical Sections

1. **Hash Verification** (reveal_bid)
   - Must exactly match Keccak256 computation
   - No alternative paths accepted
   - **Test:** Fuzz with 1000+ random (value, nonce, bidder) tuples

2. **Highest Bidder Determination** (settle_auction)
   - Iterate ALL reveals, find max value
   - No shortcuts or caching
   - **Test:** Settle with 10+ bids, verify winner correct

3. **Deposit Refunds** (claim_deposit)
   - Only claimer can claim their own deposit
   - Can't claim twice
   - **Test:** Attempt claim as different wallet, expect error

4. **PDA Authority** (all instructions)
   - Ensure signer == bidder/seller as needed
   - Check account ownership
   - **Test:** Attempt instruction with wrong signer, expect error

---

## Performance & Scalability

### Gas (Compute Units) Targets

- `create_auction`: ~200K CU
- `submit_bid`: ~150K CU (Keccak + state update)
- `reveal_bid`: ~200K CU (hash verification)
- `settle_auction`: ~500K CU + 50K per bid (scan all reveals)
- `claim_deposit`: ~100K CU

**Bottleneck:** `settle_auction` with many bids. If 1000 bids per auction, may exceed compute limit. **Solution:** Implement bid index/cache for fast max lookup.

### On-Chain Storage

Per auction:
- Auction PDA: ~200 bytes
- Per bid: ~200 bytes + 32 bytes commitment + 8 bytes revealed value
- Example: 100 bids = 20KB

Minimal; no scaling concerns for MVP.

---

## Frontend Architecture

### Key Components

- **WalletConnect.tsx** - Phantom/Solflare integration
- **CreateAuctionForm.tsx** - Seller creates auction
- **BrowseAuctions.tsx** - List all active/settled auctions
- **BidForm.tsx** - Bidder submits commitment + deposit
- **RevealForm.tsx** - Bidder reveals actual bid
- **AuctionDetail.tsx** - View auction state, all reveals, winner
- **TxStatus.tsx** - Transaction confirmation feedback

### Hooks

- **useProgram.ts** - Anchor program wrapper + RPC calls
- **useAuctions.ts** - Fetch & subscribe to auction updates
- **useWallet.ts** - Wallet adapter + balance tracking

### Utils

- **hash.ts** - Client-side Keccak256 commitment generation
- **constants.ts** - Program ID, RPC URLs, network config

---

## Testing Strategy

### Unit Tests (Rust)
- Each instruction in isolation
- Happy path + error paths
- Arithmetic edge cases (overflow, u64::MAX)

### Integration Tests
- Full workflow: create → bid → reveal → settle → claim
- Multiple concurrent auctions
- Reentrancy attempts
- Hash collision fuzzing (1000+ random inputs)

### Frontend Tests
- Commitment hash generation matches contract
- Form validation (amounts, deadlines)
- Wallet connection flows
- Transaction confirmation UX

### Security Audit (Day 7)
- Manual code review
- Fuzzing critical sections
- Edge case identification
- Performance benchmarking

---

## Deployment Checklist

- [ ] All tests passing locally (devnet validator)
- [ ] All Clippy warnings resolved
- [ ] No `unsafe` code (unless justified)
- [ ] IDL generated and exported
- [ ] Frontend can fetch IDL and call contract
- [ ] Demo video recorded
- [ ] Mainnet deployment script prepared (keys not committed!)

---

**Version:** 1.0 | **Date:** 2026-02-03 | **Status:** DRAFT  
**Next Review:** When contract logic complete (Day 4)
