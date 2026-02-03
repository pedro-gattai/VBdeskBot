# Day 2 Quick Start - Full Logic Implementation

**Status:** Phase 1 complete, ready for logic
**Time Budget:** 8 hours
**Deadline Check:** 3 days left (Feb 12, 12:00 PM EST)

---

## 🎯 Primary Objectives (in order)

### 1️⃣ TOKEN TRANSFER LOGIC (Highest Impact)
**Files:** programs/vb-desk/src/lib.rs (lines ~60-90, ~120-160, ~210-250)

**Tasks:**
```rust
// submit_bid: Transfer deposit from bidder → escrow
let cpi_ctx = CpiContext::new(
    ctx.accounts.token_program.to_account_info(),
    Transfer {
        from: ctx.accounts.bidder_token_account.to_account_info(),
        to: ctx.accounts.escrow_account.to_account_info(),
        authority: ctx.accounts.bidder.to_account_info(),
    },
);
token::transfer(cpi_ctx, deposit_amount)?;

// settle_auction: Transfer highest_bid from escrow → seller
// (Escrow is PDA authority, needs CPI)

// claim_deposit: Transfer refund from escrow → bidder
```

**Key Points:**
- Escrow is a TokenAccount (PDA seeded `["escrow", auction_id]`)
- Escrow authority = Auction PDA (for signing transfers out)
- Use `token::transfer` from anchor_spl
- All amounts in token units (u64)

---

### 2️⃣ COMMITMENT VERIFICATION (reveal_bid)
**File:** programs/vb-desk/src/lib.rs (lines ~125-165)

**Implementation:**
```rust
pub fn reveal_bid(
    ctx: Context<RevealBid>,
    auction_id: u64,
    amount: u64,
    nonce: [u8; 32],
) -> Result<()> {
    let bid = &mut ctx.accounts.bid;
    
    // Compute hash
    let mut hasher = Sha256::new();
    hasher.update(amount.to_le_bytes());
    hasher.update(&nonce);
    hasher.update(ctx.accounts.bidder.key().as_ref());
    let computed = hasher.finalize();
    
    // Verify
    require_eq!(
        computed.as_slice(),
        &bid.commitment,
        AuctionError::InvalidCommitment
    );
    
    // Update highest bid
    let auction = &mut ctx.accounts.auction;
    if amount > auction.highest_bid {
        auction.highest_bid = amount;
        auction.highest_bidder = Some(ctx.accounts.bidder.key());
    } else if amount == auction.highest_bid 
        && auction.first_bidder == Some(ctx.accounts.bidder.key()) {
        // Tie-breaker: first bidder wins
        auction.highest_bidder = Some(ctx.accounts.bidder.key());
    }
    
    bid.is_revealed = true;
    bid.revealed_amount = Some(amount);
    bid.nonce = Some(nonce);
    
    Ok(())
}
```

**Test Early:**
- Verify hash for known values
- Test tie-breaking logic
- Test invalid commitment rejection

---

### 3️⃣ SETTLEMENT LOGIC (settle_auction)
**File:** programs/vb-desk/src/lib.rs (lines ~168-200)

**Flow:**
```rust
pub fn settle_auction(
    ctx: Context<SettleAuction>,
    auction_id: u64,
) -> Result<()> {
    let auction = &mut ctx.accounts.auction;
    
    require!(!auction.is_settled, AuctionError::AlreadySettled);
    require!(
        Clock::get()?.unix_timestamp as u64 >= auction.end_time,
        AuctionError::AuctionStillActive
    );
    
    auction.is_settled = true;
    
    if auction.highest_bid >= auction.reserve_price {
        // CASE A: Reserve met
        // Transfer highest_bid from escrow → seller
        // Use CPI with Auction as signer (PDA)
        let seeds = &[
            b"auction".as_ref(),
            auction.auction_id.to_le_bytes().as_ref(),
            &[ctx.bumps.auction],
        ];
        let signer = &[&seeds[..]];
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.auction.to_account_info(),
            },
            signer,
        );
        token::transfer(cpi_ctx, auction.highest_bid)?;
    } else {
        // CASE B: Reserve NOT met
        // Mark cancelled, all deposits refunded via claim_deposit
        auction.is_cancelled = true;
    }
    
    Ok(())
}
```

**Key Point:** Escrow authority = Auction PDA, so we need to sign with PDA seeds.

---

### 4️⃣ CLAIM DEPOSIT LOGIC (claim_deposit)
**File:** programs/vb-desk/src/lib.rs (lines ~203-250)

**Refund Calculation:**
```rust
let refund_amount = if !bid.is_revealed {
    // Non-revealer: forfeited to seller
    0
} else if auction.highest_bidder == Some(ctx.accounts.bidder.key()) {
    // Winner: refund difference
    bid.deposit_locked.saturating_sub(auction.highest_bid)
} else {
    // Loser (revealed): full refund
    bid.deposit_locked
};

if refund_amount > 0 {
    // Transfer from escrow → bidder
    // Use CPI with Auction PDA signer
}
```

**Special Case:** If `auction.is_cancelled = true`, everyone (including non-revealers) gets full refund:
```rust
let refund_amount = if auction.is_cancelled {
    bid.deposit_locked  // Refund all
} else if !bid.is_revealed {
    0  // Forfeit
} else if auction.highest_bidder == Some(ctx.accounts.bidder.key()) {
    bid.deposit_locked.saturating_sub(auction.highest_bid)  // Winner
} else {
    bid.deposit_locked  // Loser
};
```

---

## 🧪 Testing Strategy (Day 2 Afternoon)

### Unit Tests (minimum 10)
```rust
#[tokio::test]
async fn test_submit_bid_locks_deposit() { }

#[tokio::test]
async fn test_reveal_bid_verifies_commitment() { }

#[tokio::test]
async fn test_reveal_bid_invalid_commitment() { }

#[tokio::test]
async fn test_reveal_bid_updates_highest() { }

#[tokio::test]
async fn test_tiebreak_first_bidder_wins() { }

#[tokio::test]
async fn test_settle_auction_reserve_met() { }

#[tokio::test]
async fn test_settle_auction_reserve_failed() { }

#[tokio::test]
async fn test_claim_deposit_winner_refund() { }

#[tokio::test]
async fn test_claim_deposit_loser_refund() { }

#[tokio::test]
async fn test_claim_deposit_non_revealer_forfeit() { }
```

### Integration Test
```rust
#[tokio::test]
async fn test_full_auction_flow() {
    // 1. Create auction
    // 2. 5 bids submitted + locked
    // 3. 3 bids revealed (amounts: 100, 150, 150)
    // 4. Settle auction (150 to seller, other 2 refunded)
    // 5. Claim deposits
    // 6. Verify balances
}
```

---

## ⚠️ Critical Implementation Notes

### 1. PDA Signer for Escrow Transfers
```rust
// When Auction PDA needs to sign (e.g., transfer out of escrow):
let seeds = &[
    b"auction".as_ref(),
    auction.auction_id.to_le_bytes().as_ref(),
    &[ctx.bumps.auction],  // bump from context
];
let signer = &[&seeds[..]];

let cpi_ctx = CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info(),
    Transfer { /* ... */ },
    signer,
);
token::transfer(cpi_ctx, amount)?;
```

### 2. Commitment Hash Byte Order
**EXACT ORDER REQUIRED:**
```rust
hasher.update(amount.to_le_bytes());    // amount as 8 little-endian bytes
hasher.update(&nonce);                   // nonce as 32 bytes
hasher.update(bidder.key().as_ref());    // pubkey as 32 bytes (no conversion)
```

### 3. Clock & Timestamps
```rust
let now = Clock::get()?.unix_timestamp as u64;
require!(now >= auction.end_time, AuctionError::AuctionStillActive);
```

### 4. Saturation Arithmetic
```rust
// Prevents underflow panic:
bid.deposit_locked.saturating_sub(auction.highest_bid)
```

---

## 📌 Checklist (Check Off as You Go)

### Submit Bid Implementation
- [ ] Deposit transfer working (CPI to spl-token)
- [ ] Escrow receives funds
- [ ] first_bidder recorded on first bid
- [ ] Auction updated with first_bidder
- [ ] Tests pass (deposit locked scenario)

### Reveal Bid Implementation
- [ ] SHA-256 commitment computation correct
- [ ] Hash verification passes for valid commitment
- [ ] Hash verification rejects invalid commitment
- [ ] highest_bid updated correctly
- [ ] Tie-breaking logic works
- [ ] Tests pass (5+ test cases)

### Settle Auction Implementation
- [ ] Timing check (auction.end_time)
- [ ] Reserve check (highest_bid >= reserve_price)
- [ ] Transfer logic working (reserve met)
- [ ] Cancellation flag set (reserve failed)
- [ ] Permissionless execution verified
- [ ] Tests pass (reserve met + reserve failed)

### Claim Deposit Implementation
- [ ] Non-revealer refund = 0 (correct)
- [ ] Winner refund = deposit - highest_bid
- [ ] Loser refund = full deposit
- [ ] Cancelled auction: full refund for all
- [ ] Double-claim prevention (claim_processed flag)
- [ ] Tests pass (all 3 cases)

---

## 📊 Time Budget Breakdown

| Task | Time | Status |
|------|------|--------|
| Token transfers (submit, settle, claim) | 2h | ⏳ |
| Commitment verification | 1.5h | ⏳ |
| Settlement logic | 1h | ⏳ |
| Claim deposit logic | 1h | ⏳ |
| Unit tests (10+) | 1.5h | ⏳ |
| Integration test | 1h | ⏳ |
| **Total** | **8h** | **Planned** |

---

## 🚨 If You Get Stuck

**>1 hour stuck?**
1. Search forum: https://agents.colosseum.com/api/forum/search
2. Post question (be specific)
3. Make a decision (implement workaround or escalate)
4. Report to #log with decision

**Common Issues:**
- CPI authority constraints → Check PDA signer setup
- Commitment hash mismatch → Verify byte ordering (LE bytes)
- Timing issues → Use `Clock::get()?.unix_timestamp as u64`

---

## 📝 Reporting (Every 30 min)

**Format:**
```
[HH:MM] Task: Status (blockers?)
```

**Example:**
```
[10:00] Token transfers: Complete, testing now
[10:30] Commitment hash: 90% (byte ordering verified)
[11:00] Settlement logic: Starting, no blockers
```

---

**Start Time:** When ready
**Report Frequency:** Every 30 minutes
**Checkpoint:** By end of Day 2 = Logic 75%+ complete
**Hard Deadline:** Feb 12, 12:00 PM EST
