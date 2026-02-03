# VB Desk - Testing Checklist

## Overview

This document tracks all tests required before submission. Tests will be implemented as code lands (Days 3-7).

**Target:** 100% instruction coverage + fuzz testing + security audit

---

## Unit Tests (Contract Logic)

### CreateAuction Instruction

- [ ] **Happy Path:** Seller creates auction with valid params
  - Verify PDA created with correct seed
  - Verify auction state = ACTIVE
  - Verify seller is marked as owner
  
- [ ] **Deadline Validation:**
  - [ ] Reject if bidding_deadline > reveal_deadline
  - [ ] Reject if bidding_deadline in past
  - [ ] Reject if reveal_deadline in past
  - [ ] Accept if both deadlines in future
  
- [ ] **Reserve Price Validation:**
  - [ ] Reject if reserve_price == 0
  - [ ] Reject if reserve_price < 0 (should be unsigned, not possible)
  - [ ] Accept if reserve_price > 0
  - [ ] Accept if reserve_price == u64::MAX (no overflow)
  
- [ ] **Asset Handling:**
  - [ ] Reject if seller doesn't have asset
  - [ ] Reject if asset mint is invalid
  - [ ] Verify asset escrow created correctly
  - [ ] Verify asset locked in contract custody
  
- [ ] **Auction ID Assignment:**
  - [ ] First auction gets ID 1
  - [ ] Second auction gets ID 2
  - [ ] IDs increment sequentially
  - [ ] No ID collisions
  
- [ ] **Authority Validation:**
  - [ ] Reject if non-seller signs
  - [ ] Reject if seller doesn't provide signature
  
- [ ] **Event Emission:**
  - [ ] Verify AuctionCreatedEvent emitted
  - [ ] Verify event contains correct seller, asset, reserve, deadlines

---

### SubmitBid Instruction

- [ ] **Happy Path:** Bidder submits valid commitment + deposit
  - Verify Bid PDA created
  - Verify commitment hash stored
  - Verify deposit escrow locked
  - Verify bid counter incremented
  
- [ ] **Auction Validation:**
  - [ ] Reject if auction_id doesn't exist
  - [ ] Reject if auction already settled
  - [ ] Reject if bidding_deadline passed
  - [ ] Accept if bidding_deadline in future
  
- [ ] **Deposit Validation:**
  - [ ] Reject if deposit < minimum (e.g., 1000 lamports)
  - [ ] Reject if bidder doesn't have balance for deposit
  - [ ] Accept if deposit >= minimum
  - [ ] Accept if deposit == u64::MAX (no overflow)
  
- [ ] **Commitment Hash Validation:**
  - [ ] Accept any 32-byte hash (no validation at submit time)
  - [ ] Verify hash stored exactly as provided
  - [ ] Verify no modification/corruption of hash
  
- [ ] **Bid Collision:**
  - [ ] Reject if same bidder already bid on auction (OR allow update?)
  - [ ] Allow different bidders to bid on same auction
  - [ ] Allow same bidder to bid on different auctions
  
- [ ] **Escrow Creation:**
  - [ ] Verify deposit transferred to Escrow PDA
  - [ ] Verify Escrow balance correct
  - [ ] Verify Escrow locked (not transferable until claim)
  
- [ ] **Concurrent Submissions:**
  - [ ] Accept 3+ bids in rapid succession
  - [ ] Verify all recorded without loss
  - [ ] Verify order preserved (if deterministic)
  
- [ ] **Authority Validation:**
  - [ ] Reject if signer != bidder
  - [ ] Verify signature required

---

### RevealBid Instruction

- [ ] **Happy Path:** Bidder reveals with correct bid & nonce
  - Verify commitment hash matches
  - Verify revealed_value stored
  - Verify bid counter incremented
  
- [ ] **Hash Verification:**
  - [ ] Accept if Keccak256(bid_value || nonce || bidder) == commitment
  - [ ] Reject if bid_value doesn't match
  - [ ] Reject if nonce doesn't match
  - [ ] Reject if bidder pubkey doesn't match
  - [ ] Verify no off-by-one errors in hash computation
  
- [ ] **Bid Amount Validation:**
  - [ ] Accept bid_value == 0 (valid, just won't win)
  - [ ] Accept bid_value == u64::MAX (no overflow)
  - [ ] Accept any value in [0, u64::MAX]
  
- [ ] **Nonce Validation:**
  - [ ] Verify nonce is exactly 32 bytes
  - [ ] Reject if nonce is shorter/longer
  - [ ] Accept any 32-byte value
  
- [ ] **State Validation:**
  - [ ] Reject if Bid doesn't exist
  - [ ] Reject if already revealed (idempotent or error?)
  - [ ] Accept if in ACTIVE or REVEALING state
  - [ ] Reject if auction settled
  
- [ ] **Deadline Validation:**
  - [ ] Reject if current_time > reveal_deadline
  - [ ] Accept if current_time < reveal_deadline
  - [ ] Accept at exactly reveal_deadline? (TBD: < or <=)
  
- [ ] **Double-Reveal Protection:**
  - [ ] Prevent second reveal from same bidder
  - [ ] Return error or skip idempotently?
  
- [ ] **Authority Validation:**
  - [ ] Reject if signer != bidder
  - [ ] Verify signature required
  
- [ ] **Hash Edge Cases:**
  - [ ] Keccak256(0 || nonce || bidder) - zero bid
  - [ ] Keccak256(u64::MAX || nonce || bidder) - max bid
  - [ ] Keccak256(value || [0; 32] || bidder) - zero nonce
  - [ ] Verify no collisions between these cases

---

### SettleAuction Instruction

- [ ] **Happy Path (Winner Exists):**
  - Create auction
  - Submit 2 bids (100, 150)
  - Reveal both
  - Settle
  - Verify highest (150) is winner
  - Verify asset transferred to winner
  - Verify payment (150) transferred to seller
  
- [ ] **Happy Path (No Valid Bids):**
  - Create auction with reserve=1000
  - Submit bid, reveal with value=500 (below reserve)
  - Settle
  - Verify auction marked CANCELLED
  - Verify asset returned to seller
  - Verify deposits refundable
  
- [ ] **Timing Validation:**
  - [ ] Reject if current_time < reveal_deadline
  - [ ] Accept if current_time > reveal_deadline
  - [ ] Accept at exactly reveal_deadline? (TBD: < or <=)
  
- [ ] **State Validation:**
  - [ ] Reject if auction_id doesn't exist
  - [ ] Reject if already settled (or allow idempotent re-settle?)
  - [ ] Accept if auction is ACTIVE or REVEALING
  
- [ ] **Winner Determination:**
  - [ ] Scan ALL bids, not just first N
  - [ ] Find max(revealed_value) across all
  - [ ] Handle ties (use first or last encountered?)
  - [ ] Handle no reveals (return error or cancel?)
  
- [ ] **Reserve Price Check:**
  - [ ] If max_bid >= reserve_price: mark as winner
  - [ ] If max_bid < reserve_price: cancel auction
  - [ ] Handle reserve_price == 0 (always has winner)
  
- [ ] **Asset Transfer:**
  - [ ] Verify asset transferred to winner's account
  - [ ] Verify asset no longer in escrow
  - [ ] Verify correct amount transferred (100% of asset)
  
- [ ] **Payment Transfer:**
  - [ ] Verify winning_bid amount transferred to seller
  - [ ] Verify transferred in correct token (SOL or SPL)
  - [ ] Verify no overflow in total amount
  
- [ ] **State Updates:**
  - [ ] Verify auction marked SETTLED
  - [ ] Verify winner set correctly
  - [ ] Verify winning_bid set correctly
  - [ ] Verify bid counters updated
  
- [ ] **Concurrent Bids:**
  - [ ] Settle with 100+ concurrent bids
  - [ ] Verify all scanned, winner correct
  - [ ] Verify no performance degradation (< 400K CU)
  
- [ ] **Edge Cases:**
  - [ ] 1 bid: should win if >= reserve
  - [ ] 2 bids, same value: which wins (first or last)?
  - [ ] All bids below reserve: auction fails
  - [ ] No bids at all: auction fails
  - [ ] Mix of revealed + non-revealed: ignore non-revealed
  
- [ ] **Authority:**
  - [ ] Anyone can call settle (not just seller/winner)
  - [ ] No signature required? (TBD: spec)

---

### ClaimDeposit Instruction

- [ ] **Happy Path (Loser):**
  - Lose auction, deposit forfeited or refunded?
  - Call claim_deposit
  - Verify deposit transferred back to bidder
  
- [ ] **Happy Path (Winner):**
  - Win auction
  - Call claim_deposit
  - Verify deposit applied to payment or refunded?
  
- [ ] **State Validation:**
  - [ ] Reject if auction_id doesn't exist
  - [ ] Reject if auction not yet settled
  - [ ] Reject if bid doesn't exist for (auction, bidder)
  
- [ ] **Claim Conditions:**
  - [ ] Only bidder can claim their own deposit
  - [ ] Prevent double-claim (already claimed?)
  - [ ] Verify auction is SETTLED before allowing
  
- [ ] **Deposit Mechanics (SPEC DEPENDENT):**
  - [ ] Loser (revealed): Receive full deposit refund
  - [ ] Winner: Deposit offset from payment OR refunded separately?
  - [ ] Non-revealer: Refund OR forfeit? (TBD)
  
- [ ] **Transfer Correctness:**
  - [ ] Correct amount transferred (exact escrow balance)
  - [ ] Transferred to claimer's account
  - [ ] No partial transfers or rounding errors
  - [ ] Verify no overflow
  
- [ ] **Multiple Claims:**
  - [ ] 1st claim: succeeds
  - [ ] 2nd claim: fails (AlreadyClaimed)
  - [ ] Prevent double-withdrawal
  
- [ ] **Authority Validation:**
  - [ ] Signer must == bidder
  - [ ] Non-bidder attempt: rejected
  - [ ] Signature required
  
- [ ] **Edge Cases:**
  - [ ] Claim as winner with deposit=0 (no-op?)
  - [ ] Claim as non-revealer (spec TBD)
  - [ ] Claim auction with no bids (still refundable?)

---

## Integration Tests (Full Workflows)

### Complete Auction Lifecycle

- [ ] **Test 1: Happy Path**
  ```
  1. Seller creates auction
  2. Bidder1 submits bid (value=150, deposit=50)
  3. Bidder2 submits bid (value=120, deposit=50)
  4. Bidder1 reveals (150 wins, >= reserve)
  5. Bidder2 reveals (120)
  6. Settle auction (Bidder1 wins)
  7. Seller claims 150
  8. Bidder1 claims deposit
  9. Bidder2 claims deposit
  
  Verify final state:
  - Bidder1 has asset
  - Seller has 150
  - Bidder1 has 50 back (or offset)
  - Bidder2 has 50 back
  ```

- [ ] **Test 2: No Reserve Met**
  ```
  1. Create auction (reserve=1000)
  2. Bidder1 submits & reveals bid=500 (below reserve)
  3. Settle (no winner)
  4. Seller claims asset back
  5. Bidder1 claims deposit
  
  Verify:
  - Auction marked CANCELLED
  - Asset in seller's account
  - Deposits refunded
  ```

- [ ] **Test 3: Multiple Auctions Concurrent**
  ```
  1. Seller1 creates auction A
  2. Seller2 creates auction B
  3. Bidder1 submits to both
  4. Bidder2 submits to A only
  5. Reveal all in random order
  6. Settle both
  
  Verify:
  - No cross-auction interference
  - Winners determined independently
  - Deposits claimed independently
  ```

- [ ] **Test 4: Bid Revision (if allowed)**
  ```
  1. Bidder1 submits commitment C1
  2. Bidder1 submits commitment C2 (overwrites C1)
  3. Attempt reveal with C1 → should fail
  4. Reveal with C2 → should succeed
  
  OR if not allowed:
  1. Bidder1 submits commitment C1
  2. Bidder1 attempts commitment C2 → should fail
  ```

- [ ] **Test 5: Reveal After Deadline**
  ```
  1. Create auction with reveal_deadline = now + 1 second
  2. Wait for deadline
  3. Attempt reveal → should fail
  ```

---

## Security & Fuzzing Tests

### Reentrancy Tests

- [ ] **Malicious Program Attempts Re-enter settle_auction**
  - Create program that calls settle() twice in one tx
  - Verify 2nd call fails (already settled)
  
- [ ] **Malicious Program Attempts Re-enter claim_deposit**
  - Create program that calls claim() twice
  - Verify 2nd call fails (already claimed)
  
- [ ] **Nested CPI Attacks**
  - Program A calls settle → Program B calls settle
  - Verify both fail or handle gracefully

### Arithmetic Overflow Tests

- [ ] **u64 Overflow on Bid Value**
  - Bid value = u64::MAX
  - Verify no overflow in storage or comparisons
  
- [ ] **u64 Overflow on Deposit Sum**
  - Create 1M bids, each deposit = 1 lamport
  - Total = 1M lamports (< u64::MAX, safe)
  
- [ ] **u64 Overflow on Payment**
  - Bid value = u64::MAX
  - Seller receives exactly u64::MAX (no overflow)
  
- [ ] **Checked Arithmetic Throughout**
  - Verify all arithmetic operations use checked_* variants
  - No unchecked additions/multiplications

### Hash Security Tests

- [ ] **Hash Collision Fuzzing (1M inputs)**
  - Generate 1M random (value, nonce, bidder) tuples
  - Compute Keccak256 for each
  - Verify ZERO collisions
  
- [ ] **Hash Preimage Resistance**
  - Commitment = Keccak256(100 || N1 || B1)
  - Attempt reveal with (200, N1, B1) → fail
  - Attempt reveal with (100, N2, B1) → fail
  - Attempt reveal with (100, N1, B2) → fail
  - Only exact match succeeds
  
- [ ] **Hash Endianness**
  - Bid 0x0102030405060708
  - Verify little-endian vs big-endian consistency
  - Client & contract must agree
  
- [ ] **Nonce Edge Cases**
  - Nonce = [0; 32] (all zeros) → accept, no collision with other nonces
  - Nonce = [255; 32] (all ones) → accept
  - Nonce = random() → accept (1000+ random nonces)

### PDA & Authority Tests

- [ ] **PDA Derivation Consistency**
  - Create auction A with ID=1
  - Derive PDA: seed=["auction", seller, 1]
  - Verify same address returned on subsequent calls
  
- [ ] **PDA Isolation**
  - Auction 1 & Auction 2 have different PDAs
  - Bidder can't confuse/collide PDAs
  
- [ ] **Signer Validation**
  - Non-seller attempts create_auction → fail
  - Non-bidder attempts reveal_bid → fail
  - Non-bidder attempts claim_deposit → fail
  - Anyone can settle (no check needed)

### Edge Case Tests

- [ ] **No Bids**
  - Create auction, never submit bids
  - Settle after deadline
  - Verify auction canceled, asset returned
  
- [ ] **Single Bid**
  - Create auction, 1 bid >= reserve
  - Settle, verify bid wins
  
- [ ] **All Bids Below Reserve**
  - Auction reserve=1000
  - All bids in [1, 999]
  - Settle, verify auction fails
  
- [ ] **Tie Bids**
  - Bidder1 bids 150, Bidder2 bids 150
  - Reveal both
  - Settle, verify one wins (first? last? TBD)
  
- [ ] **Non-Revealer**
  - Bidder1 submits commitment, never reveals
  - Settle
  - Verify Bidder1 can claim deposit (or forfeits? TBD)
  
- [ ] **Zero Bid**
  - Bidder submits bid=0
  - Reveal with 0
  - Verify hash matches, bid stored as 0
  - If reserve > 0, doesn't win

---

## Frontend Tests

### Hash Generation

- [ ] **Client-Side Keccak256 Matches Contract**
  - Generate commitment client-side: `Keccak256(100 || nonce || bidder)`
  - Submit to contract
  - Reveal with same (value, nonce, bidder)
  - Verify contract accepts
  
- [ ] **Nonce Randomness**
  - Generate 1000 nonces
  - Verify no duplicates
  - Verify uses crypto.getRandomValues()

### UI Form Validation

- [ ] **CreateAuction Form**
  - [ ] Reject zero reserve price
  - [ ] Reject past deadlines
  - [ ] Reject bidding_deadline > reveal_deadline
  - [ ] Auto-populate dates as "now + 24h", "now + 48h"
  - [ ] Show deposit requirement before submit
  
- [ ] **SubmitBid Form**
  - [ ] Require commitment hash (auto-generated)
  - [ ] Require deposit amount > 0
  - [ ] Show nonce saved locally for later reveal
  - [ ] Warn if closing browser (lose nonce!)
  
- [ ] **RevealBid Form**
  - [ ] Auto-populate nonce from localStorage
  - [ ] Require bid amount > 0
  - [ ] Warn if nonce not found
  - [ ] Hash preview (compute locally, show match/mismatch)
  
- [ ] **Auction Browse Page**
  - [ ] Fetch all auctions from RPC
  - [ ] Sort by deadline (nearest first)
  - [ ] Show status: ACTIVE, REVEALING, SETTLED
  - [ ] Pagination for 100+ auctions

### Transaction Flow

- [ ] **Create Auction**
  - [ ] User clicks "Create", signs tx
  - [ ] Show pending status
  - [ ] Poll for confirmation
  - [ ] Redirect to auction detail
  - [ ] Show success message
  
- [ ] **Submit Bid**
  - [ ] User fills bid form
  - [ ] Show commitment hash (auto-generated)
  - [ ] Show nonce saved message
  - [ ] Sign and submit
  - [ ] Poll for confirmation
  
- [ ] **Reveal Bid**
  - [ ] Load nonce from localStorage
  - [ ] User enters bid amount
  - [ ] Show hash preview ("matches!" or "mismatch!")
  - [ ] Sign and submit
  - [ ] Poll for confirmation

### Error Handling

- [ ] **Insufficient Balance**
  - Attempt deposit > balance
  - Show: "Insufficient SOL/tokens"
  
- [ ] **Auction Closed**
  - Try to bid after deadline
  - Show: "Bidding closed for this auction"
  
- [ ] **Invalid Nonce**
  - Attempt reveal with wrong nonce
  - Show: "Hash mismatch, did you save the nonce?"
  
- [ ] **Network Errors**
  - RPC timeout
  - Show retry button
  - Don't submit duplicate txs

### Mobile Responsiveness

- [ ] **iPhone 12 (375px)**
  - [ ] All forms readable
  - [ ] Buttons clickable (>44px height)
  - [ ] No horizontal scroll
  - [ ] Amounts readable (not truncated)
  
- [ ] **iPad (768px)**
  - [ ] Layout adapts to wider screen
  - [ ] Forms still usable

### Cross-Browser Compatibility

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)

---

## Performance & Benchmarks

### Compute Unit Targets

- [ ] **create_auction**: < 200K CU
- [ ] **submit_bid**: < 150K CU (Keccak is expensive)
- [ ] **reveal_bid**: < 200K CU (hash verification)
- [ ] **settle_auction**: < 500K CU (+ 50K per bid)
- [ ] **claim_deposit**: < 100K CU

### Stress Tests

- [ ] **10 Concurrent Auctions**
  - Create 10 auctions simultaneously
  - Verify all succeed without interference
  
- [ ] **100 Bids Per Auction**
  - Create 1 auction
  - Submit 100 bids
  - Settle (should complete in 1 tx, < 500K CU)
  - Verify winner correct
  
- [ ] **Page Load Time**
  - Fetch 100 auctions from RPC
  - Load in < 2 seconds
  - Implement pagination if needed

---

## Pre-Submission Checklist

### Code Quality

- [ ] All tests passing locally (100% pass rate)
- [ ] All Clippy warnings resolved
- [ ] All code formatted (`cargo fmt`)
- [ ] No `unsafe` code (or justified + documented)
- [ ] Comments on all non-obvious logic
- [ ] Error messages are clear and actionable

### Documentation

- [ ] README.md complete
- [ ] SETUP.md tested (step-by-step works)
- [ ] ARCHITECTURE.md matches implementation
- [ ] API.md accurate and complete
- [ ] SECURITY.md thoroughly reviewed
- [ ] Inline code comments explain intent

### Deployment

- [ ] Compiled without warnings
- [ ] Deployed to devnet successfully
- [ ] IDL generated and exported
- [ ] Frontend can fetch IDL and call contract
- [ ] Demo video recorded (< 5 min)
  - Create auction
  - Bid
  - Reveal
  - Settle
  - Claim
  
- [ ] GitHub repo public and linked

### Final Testing

- [ ] Full end-to-end test on devnet (all 5 instructions)
- [ ] Multiple concurrent auctions working
- [ ] All error paths tested
- [ ] Performance within targets
- [ ] No obvious security issues

---

**Version:** 1.0 | **Date:** 2026-02-03 | **Status:** ACTIVE  
**Progress:** Will update daily  
**Critical Path:** All Day 4 tests must pass before Day 5 frontend integration
