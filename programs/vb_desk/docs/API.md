# VB Desk - API Reference

## Quick Reference

| Instruction | Purpose | Caller | Returns |
|-------------|---------|--------|---------|
| `CreateAuction` | Seller creates auction | Seller wallet | Auction ID |
| `SubmitBid` | Bidder submits commitment + deposit | Bidder wallet | Bid confirmed |
| `RevealBid` | Bidder reveals actual bid amount | Bidder wallet | Bid revealed |
| `SettleAuction` | Determine winner after deadlines | Anyone | Winner announced |
| `ClaimDeposit` | Bidder/winner claims refund/payment | Bidder wallet | Deposit released |

---

## Instruction Details

### 1. CreateAuction

**Initiates an auction for an asset.**

#### Request

```typescript
// TypeScript / Anchor client
const tx = await program.methods
  .createAuction({
    assetMint: new PublicKey("..."),      // SPL token mint or NFT mint
    reservePrice: new BN(1_000_000),      // Min bid (in lamports or token units)
    biddingDeadline: new BN(Date.now() / 1000 + 3600),  // Now + 1 hour
    revealDeadline: new BN(Date.now() / 1000 + 7200),   // Now + 2 hours
  })
  .accounts({
    seller: sellerWallet.publicKey,
    auction: auctionPDA,                  // Derived: ["auction", seller, auto_id]
    asset: assetTokenAccount,             // Seller's token account (escrow source)
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([sellerWallet])
  .rpc();

console.log("Auction created:", tx);
```

#### Response

```json
{
  "transaction_signature": "3vZ...",
  "auction_id": 1,
  "seller": "9B5...",
  "asset_mint": "EPj...",
  "reserve_price": 1000000,
  "bidding_deadline": 1707000000,
  "reveal_deadline": 1707003600,
  "state": "Active",
  "total_bids_submitted": 0,
  "total_bids_revealed": 0
}
```

#### Parameters

| Parameter | Type | Description | Constraints |
|-----------|------|-------------|-----------|
| `assetMint` | PublicKey | Token/NFT to auction | Must exist |
| `reservePrice` | u64 | Minimum acceptable bid | > 0 |
| `biddingDeadline` | i64 | Unix timestamp (when bidding closes) | > now, < revealDeadline |
| `revealDeadline` | i64 | Unix timestamp (when reveals close) | > biddingDeadline |

#### Errors

| Error | Meaning |
|-------|---------|
| `InvalidDeadline` | Deadlines invalid (wrong order, in past, etc) |
| `InvalidReservePrice` | Reserve price is zero or negative |
| `MissingAsset` | Seller doesn't have asset to auction |
| `InsufficientAuthority` | Signer is not seller |

#### Events

```rust
pub struct AuctionCreatedEvent {
    pub auction_id: u64,
    pub seller: Pubkey,
    pub asset: Pubkey,
    pub reserve_price: u64,
    pub bidding_deadline: i64,
    pub reveal_deadline: i64,
}
```

---

### 2. SubmitBid

**Bidder submits commitment hash and deposits security funds.**

#### Request

```typescript
import { keccak256 } from 'js-sha3';

// Step 1: Generate commitment locally
const bidAmount = 1_500_000;        // 1.5 SOL in lamports
const nonce = crypto.getRandomValues(new Uint8Array(32));  // Random 32 bytes
const bidderPubkey = bidderWallet.publicKey;

function createCommitment(amount: number, nonce: Uint8Array, bidder: PublicKey): Buffer {
  const packed = Buffer.concat([
    Buffer.from(new BigInt64Array([BigInt(amount)]).buffer),
    Buffer.from(nonce),
    bidder.toBuffer(),
  ]);
  const hash = keccak256(packed);
  return Buffer.from(hash, 'hex');
}

const commitmentHash = createCommitment(bidAmount, nonce, bidderPubkey);

// Step 2: Submit bid to contract
const tx = await program.methods
  .submitBid({
    auctionId: new BN(1),
    commitmentHash: commitmentHash,    // 32-byte Keccak256 hash
    depositAmount: new BN(500_000),    // Security deposit (0.5 SOL)
  })
  .accounts({
    bidder: bidderWallet.publicKey,
    auction: auctionPDA,               // Derived: ["auction", seller, auction_id]
    bid: bidPDA,                       // Derived: ["bid", auction_id, bidder]
    escrow: escrowPDA,                 // Derived: ["escrow", auction_id, bidder]
    bidderTokenAccount: ...,           // Bidder's SOL account (for deposit)
    systemProgram: SystemProgram.programId,
  })
  .signers([bidderWallet])
  .rpc();

// Step 3: Save locally for reveal phase!
localStorage.setItem(`bid_${auctionId}_${bidderPubkey}`, JSON.stringify({
  nonce: Array.from(nonce),
  bidAmount,
  commitmentHash: commitmentHash.toString('hex'),
}));

console.log("Bid submitted:", tx);
```

#### Response

```json
{
  "transaction_signature": "5xC...",
  "auction_id": 1,
  "bidder": "3Ek...",
  "commitment_hash": "a1b2c3...",
  "deposit_amount": 500000,
  "state": "Submitted"
}
```

#### Parameters

| Parameter | Type | Description | Constraints |
|-----------|------|-------------|-----------|
| `auctionId` | u64 | Which auction to bid on | Must exist & be ACTIVE |
| `commitmentHash` | [u8; 32] | Keccak256(bidAmount \|\| nonce \|\| bidder) | Exactly 32 bytes |
| `depositAmount` | u64 | Security deposit (lamports or tokens) | >= 1000 (configurable min) |

#### Errors

| Error | Meaning |
|-------|---------|
| `AuctionNotFound` | Auction ID doesn't exist |
| `AuctionClosed` | Bidding deadline has passed |
| `InsufficientDeposit` | Deposit < minimum required |
| `InsufficientBalance` | Bidder doesn't have enough balance for deposit |
| `BidAlreadySubmitted` | Bidder already bid on this auction (or allow update?) |

#### Security Notes

⚠️ **Save your nonce!** You will need it to reveal. Store in:
- Browser localStorage (local dev only!)
- Local file (production recommendation)
- Password manager (backup)
- **DO NOT** share nonce or bid amount with anyone

If you lose the nonce, you **cannot reveal your bid** and will forfeit your deposit.

---

### 3. RevealBid

**Bidder reveals actual bid amount and nonce to prove commitment.**

#### Request

```typescript
// Step 1: Retrieve saved bid data from localStorage
const savedBid = JSON.parse(localStorage.getItem(`bid_${auctionId}_${bidderPubkey}`));
const nonce = new Uint8Array(savedBid.nonce);
const bidAmount = savedBid.bidAmount;

// Step 2: Reveal to contract
const tx = await program.methods
  .revealBid({
    auctionId: new BN(1),
    bidAmount: new BN(bidAmount),      // Your actual bid amount
    nonce: Array.from(nonce),          // Your nonce (32 bytes)
  })
  .accounts({
    bidder: bidderWallet.publicKey,
    auction: auctionPDA,
    bid: bidPDA,                       // Derived: ["bid", auction_id, bidder]
    systemProgram: SystemProgram.programId,
  })
  .signers([bidderWallet])
  .rpc();

console.log("Bid revealed:", tx);
```

#### Response

```json
{
  "transaction_signature": "7qR...",
  "auction_id": 1,
  "bidder": "3Ek...",
  "revealed_amount": 1500000,
  "commitment_verified": true,
  "state": "Revealed"
}
```

#### Parameters

| Parameter | Type | Description | Constraints |
|-----------|------|-------------|-----------|
| `auctionId` | u64 | Which auction to reveal in | Must exist |
| `bidAmount` | u64 | Your actual bid amount | 0 < amount <= u64::MAX |
| `nonce` | [u8; 32] | Your nonce from bidding phase | Must match submitted commitment |

#### Verification

The contract will compute:
```
hash = Keccak256(bidAmount || nonce || bidder_pubkey)
if hash == commitment_hash_from_submit_bid:
    ✅ Reveal accepted, bid_amount stored
else:
    ❌ Reject (hash mismatch)
```

#### Errors

| Error | Meaning |
|-------|---------|
| `BidNotFound` | No bid found for (auction, bidder) |
| `HashMismatch` | Your (bidAmount, nonce) doesn't match committed hash |
| `AlreadyRevealed` | This bid already revealed (can't change) |
| `RevealWindowClosed` | reveal_deadline has passed |
| `AuctionNotActive` | Auction cancelled or settled |

#### Failure Recovery

If your reveal fails:

1. **Check deadline:** Is current time < reveal_deadline?
   ```typescript
   const now = Math.floor(Date.now() / 1000);
   if (now > revealDeadline) {
     console.error("Reveal window closed, cannot reveal");
   }
   ```

2. **Check bid data:** Did you use the EXACT nonce from submission?
   ```typescript
   // Re-compute and verify commitment locally
   const recomputed = createCommitment(bidAmount, nonce, bidderPubkey);
   if (recomputed.toString('hex') !== commitmentHash) {
     console.error("Your nonce/amount doesn't match committed hash");
   }
   ```

3. **Check auction state:** Has auction already been settled?
   ```typescript
   const auctionState = await program.account.auction.fetch(auctionPDA);
   console.log("Auction state:", auctionState.state);
   ```

---

### 4. SettleAuction

**After reveal deadline, determine winner and execute settlement.**

#### Request

```typescript
// Anyone can settle (not just seller)
const tx = await program.methods
  .settleAuction({
    auctionId: new BN(1),
  })
  .accounts({
    auction: auctionPDA,
    winner: winnerBidPDA,               // Will be determined by contract
    seller: sellerWallet.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();

console.log("Auction settled:", tx);
```

#### Response (Success)

```json
{
  "transaction_signature": "8sT...",
  "auction_id": 1,
  "winner": "7Fh...",
  "winning_bid": 1500000,
  "state": "Settled",
  "asset_transferred_to": "7Fh...",
  "seller_received": 1500000
}
```

#### Response (Failed - No Valid Bids)

```json
{
  "transaction_signature": "9aU...",
  "auction_id": 1,
  "state": "Cancelled",
  "reason": "No valid bids or all below reserve",
  "asset_returned_to_seller": true
}
```

#### Parameters

| Parameter | Type | Description | Constraints |
|-----------|------|-------------|-----------|
| `auctionId` | u64 | Auction to settle | Must exist |

#### Logic

1. **Check deadline:** Current time > reveal_deadline?
   - If NO: Reject with `TooEarlyToSettle`
   - If YES: Continue

2. **Find highest valid reveal:**
   ```
   max_bid_value = 0
   winner = None
   for each (bidder, revealed_amount) in bids:
       if revealed_amount > max_bid_value:
           max_bid_value = revealed_amount
           winner = bidder
   ```

3. **Compare to reserve:**
   - If `max_bid_value >= reserve_price`:
     - **Winner found!** Transfer asset to winner, payment to seller
     - Mark auction as `SETTLED`
   - If `max_bid_value < reserve_price` OR no bids revealed:
     - **No winner.** Return asset to seller, mark as `CANCELLED`
     - Deposits become refundable

4. **Prevent double-settle:**
   - If already settled: Either reject or idempotently return success

#### Errors

| Error | Meaning |
|-------|---------|
| `AuctionNotFound` | Auction ID invalid |
| `TooEarlyToSettle` | reveal_deadline not yet reached |
| `AuctionAlreadySettled` | Already settled (can settle again?) |
| `NoValidBids` | No bids revealed, or all below reserve |

#### Events

```rust
pub struct AuctionSettledEvent {
    pub auction_id: u64,
    pub winner: Option<Pubkey>,
    pub winning_bid: Option<u64>,
    pub state: AuctionState,
}
```

---

### 5. ClaimDeposit

**Bidder (winner or loser) claims their deposit refund or payment.**

#### Request

```typescript
const tx = await program.methods
  .claimDeposit({
    auctionId: new BN(1),
  })
  .accounts({
    bidder: bidderWallet.publicKey,
    auction: auctionPDA,
    bid: bidPDA,                       // Derived: ["bid", auction_id, bidder]
    escrow: escrowPDA,                 // Derived: ["escrow", auction_id, bidder]
    bidderTokenAccount: ...,           // Where to send deposit back
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([bidderWallet])
  .rpc();

console.log("Deposit claimed:", tx);
```

#### Response (Loser Refund)

```json
{
  "transaction_signature": "4bV...",
  "auction_id": 1,
  "bidder": "3Ek...",
  "refund_amount": 500000,
  "status": "non-winner",
  "message": "Your deposit has been refunded"
}
```

#### Response (Winner Payment)

```json
{
  "transaction_signature": "5cW...",
  "auction_id": 1,
  "bidder": "7Fh...",
  "deposit_applied": 500000,
  "note": "Your deposit was applied to your winning bid payment",
  "status": "winner"
}
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `auctionId` | u64 | Auction to claim from |

#### Claim Rules

**For Non-Winners (who revealed):**
- Receive full deposit refund

**For Winners:**
- Deposit offset from winning bid payment
- Example: Bid 1.5 SOL, deposit 0.5 SOL → Seller gets 1.5 SOL, winner's account charged only 1.0 SOL
- (Spec TBD: exact offset mechanism)

**For Non-Revealers:**
- **SPEC QUESTION:** Forfeit or refund?
- Current implementation: **Refund** (no penalty for non-reveal)

#### Errors

| Error | Meaning |
|-------|---------|
| `AuctionNotFound` | Auction invalid |
| `BidNotFound` | Bidder didn't bid on this auction |
| `AuctionNotSettled` | Auction still ongoing, can't claim yet |
| `AlreadyClaimed` | Deposit already claimed (prevent double-claim) |
| `InsufficientBalance` | Escrow doesn't have claimed amount (should not happen) |
| `Unauthorized` | Signer is not the bidder |

#### Timing

Can only claim AFTER auction is settled.

```typescript
// Check if can claim
const auctionPDA = await program.account.auction.fetch(auctionPDAAddress);
if (auctionPDA.state !== "Settled") {
  console.error("Auction not yet settled, please wait");
  return;
}

// Safe to claim
await claimDeposit();
```

---

## Account Types & PDAs

### Auction PDA

**Seed:** `["auction", seller_pubkey, auction_id]`

**Size:** ~300 bytes

**Fields:**
```rust
pub struct Auction {
    pub auction_id: u64,              // Auto-increment counter
    pub seller: Pubkey,               // Seller's wallet
    pub asset: Pubkey,                // Asset mint (what's being auctioned)
    pub reserve_price: u64,           // Min bid
    pub bidding_deadline: i64,        // When bidding closes
    pub reveal_deadline: i64,         // When reveals close
    pub state: AuctionState,          // ACTIVE, REVEALING, SETTLED, CANCELLED
    pub winner: Option<Pubkey>,       // Winning bidder (after settlement)
    pub winning_bid: Option<u64>,     // Highest bid amount
    pub total_bids_submitted: u32,    // Bid counter
    pub total_bids_revealed: u32,     // Reveal counter
    pub bump: u8,                     // PDA bump
}
```

### Bid PDA

**Seed:** `["bid", auction_id, bidder_pubkey]`

**Size:** ~300 bytes

**Fields:**
```rust
pub struct Bid {
    pub auction_id: u64,               // Parent auction
    pub bidder: Pubkey,                // Bidder's wallet
    pub commitment_hash: [u8; 32],    // Keccak256 hash
    pub revealed_value: Option<u64>,  // Bid amount (after reveal)
    pub deposit_amount: u64,           // Escrow amount
    pub deposit_received: bool,        // Escrow transferred?
    pub claimed: bool,                 // Refund claimed?
    pub bump: u8,                      // PDA bump
}
```

### Escrow PDA

**Seed:** `["escrow", auction_id, bidder_pubkey]`

**Size:** ~150 bytes

**Fields:**
```rust
pub struct Escrow {
    pub auction_id: u64,
    pub bidder: Pubkey,
    pub amount: u64,
    pub token_type: TokenType,  // Sol, Spl { mint }, Nft { mint }
    pub released: bool,
    pub bump: u8,
}
```

---

## Example Workflows

### Happy Path: Create → Bid → Reveal → Settle → Claim

```typescript
// Day 1: Seller creates auction
const createAuctionTx = await createAuction({
  assetMint: "EPjFWaLb3odcccccc...",  // USDC
  reservePrice: 1_000_000_000,         // 1000 USDC
  biddingDeadline: now + 86400,        // 24 hours
  revealDeadline: now + 172800,        // 48 hours
});
console.log("Auction ID:", createAuctionTx.auctionId);  // 1

// Day 1: Bidder_1 submits bid (1500 USDC)
const bid1Commitment = createCommitment(1_500_000_000, nonce1, bidder1);
const submitBid1Tx = await submitBid({
  auctionId: 1,
  commitmentHash: bid1Commitment,
  depositAmount: 100_000_000,  // 100 USDC security deposit
});
console.log("Bid submitted, nonce saved locally");

// Day 1: Bidder_2 submits bid (1200 USDC)
const bid2Commitment = createCommitment(1_200_000_000, nonce2, bidder2);
const submitBid2Tx = await submitBid({
  auctionId: 1,
  commitmentHash: bid2Commitment,
  depositAmount: 100_000_000,
});

// Day 2 (after biddingDeadline): Bidder_1 reveals (1500 USDC)
const reveal1Tx = await revealBid({
  auctionId: 1,
  bidAmount: 1_500_000_000,
  nonce: nonce1,  // Retrieved from localStorage
});
console.log("Bid 1 revealed: 1500 USDC");

// Day 2: Bidder_2 reveals (1200 USDC)
const reveal2Tx = await revealBid({
  auctionId: 1,
  bidAmount: 1_200_000_000,
  nonce: nonce2,
});
console.log("Bid 2 revealed: 1200 USDC");

// Day 3 (after revealDeadline): Anyone can settle
const settleTx = await settleAuction({
  auctionId: 1,
});
console.log("Auction settled, winner: bidder_1 (1500 USDC)");

// Day 3: Bidder_1 (winner) claims deposit
const claimWinnerTx = await claimDeposit({
  auctionId: 1,
  bidder: bidder1,
});
console.log("Winner's deposit refunded/applied");

// Day 3: Bidder_2 (loser) claims deposit refund
const claimLoserTx = await claimDeposit({
  auctionId: 1,
  bidder: bidder2,
});
console.log("Loser's deposit refunded: 100 USDC");

// Day 3: Seller claims winning payment
const claimSellerTx = await claimPayment({
  auctionId: 1,
});
console.log("Seller received: 1500 USDC");
```

---

## Error Codes

| Code | Name | Meaning |
|------|------|---------|
| 1000 | `InvalidDeadline` | Deadline invalid or in past |
| 1001 | `InvalidReservePrice` | Reserve price invalid |
| 1002 | `AuctionNotFound` | Auction ID doesn't exist |
| 1003 | `AuctionClosed` | Bidding deadline passed |
| 1004 | `InsufficientDeposit` | Deposit below minimum |
| 1005 | `InsufficientBalance` | Wallet doesn't have enough balance |
| 1006 | `BidAlreadySubmitted` | Bidder already bid on this auction |
| 1007 | `BidNotFound` | No bid for (auction, bidder) |
| 1008 | `HashMismatch` | Reveal hash doesn't match commitment |
| 1009 | `AlreadyRevealed` | Bid already revealed |
| 1010 | `RevealWindowClosed` | Reveal deadline passed |
| 1011 | `TooEarlyToSettle` | Reveal deadline not yet passed |
| 1012 | `AuctionAlreadySettled` | Auction already settled |
| 1013 | `NoValidBids` | No bids or all below reserve |
| 1014 | `AlreadyClaimed` | Deposit already claimed |
| 1015 | `AuctionNotSettled` | Can't claim before settlement |
| 1016 | `Unauthorized` | Signer not authorized |

---

**Version:** 1.0 | **Date:** 2026-02-03 | **Status:** DRAFT  
**Updated:** When contract logic complete
