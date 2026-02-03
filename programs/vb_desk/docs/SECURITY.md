# VB Desk - Security & Threat Analysis

## Executive Summary

VB Desk is a sealed-bid auction system on Solana using cryptographic hash commitments. The primary security focus is on **contract correctness** (no reentrancy, overflow, hash collisions) and **honest reveal incentives**.

**Security Posture:** Medium (suitable for hackathon; requires full audit before mainnet production use)

---

## Threat Analysis by Component

### 1. Hash Commitment Scheme

**Threat:** Bidder tries to change their bid after seeing others' commitments

**Mitigation:**
- Commitment is `Keccak256(bid_value || nonce || bidder)`
- Once submitted, commitment is immutable (on-chain)
- To change bid, must submit new commitment (different nonce)
- Only one bid per (auction, bidder) pair allowed
- **Impact:** HIGH security - requires Keccak256 preimage resistance

**Test Cases:**
```
1. Submit commitment C1 with bid=100
2. Attempt reveal with bid=200 (same nonce)
   → Expect: HashMismatch error ✅
   
3. Submit commitment C1 with bid=100, nonce=N1
4. Attempt reveal with bid=100, nonce=N2
   → Expect: HashMismatch error ✅
   
5. Submit two commitments from same bidder
   → Expect: BidAlreadySubmitted or second overwrites first
   → TBD: spec clarification needed
```

---

### 2. Arithmetic & Overflow

**Threat:** Bidder submits bid > u64::MAX or deposit exceeds balance

**Vulnerability:** Rust u64 overflow → silently wraps (e.g., u64::MAX + 1 = 0)

**Mitigation:**
- Use Anchor's checked arithmetic (default in newer versions)
- All operations: `checked_add()`, `checked_mul()`, `checked_sub()`
- Reject operations that would overflow

**Critical Paths:**
```rust
// Deposit sum for single auction
let mut total_deposits: u64 = 0;
for bid in all_bids {
    total_deposits = total_deposits
        .checked_add(bid.deposit_amount)
        .ok_or(OverflowError)?;
}

// Winning bid amount
let winner_payment = winning_bid_value  // Already u64, safe
    .checked_add(protocol_fee)
    .ok_or(OverflowError)?;
```

**Test Cases:**
```
1. Submit bid with value = u64::MAX (18,446,744,073,709,551,615)
   → Should accept without overflow ✅
   
2. Submit bid with value = u64::MAX + 1 (or greater)
   → Expect: InvalidBidAmount error ✅
   
3. Create 1,000,000 bids, each with deposit = 1,000,000 lamports
   → Total = 1 trillion lamports
   → Should handle correctly without overflow ✅
   
4. Settle auction, transfer winning bid to seller
   → Verify balance updated correctly ✅
```

---

### 3. Reentrancy

**Threat:** Malicious bidder embeds code to re-enter contract during settlement

**Example Attack:**
```
Bidder creates ProgramA that:
1. Calls settle_auction()
2. During authority check, ProgramA intercepts
3. ProgramA calls settle_auction() again
4. First settlement gets result, then second settle runs
5. Bidder exploits inconsistent state
```

**Mitigation (Anchor):**
- Anchor uses CPIs (Cross-Program Invocations) with explicit signer checks
- `require_signer!(account)` validates signature before state modification
- State updates marked as "modify" (prevents re-entry reads)
- Bid marked as `claimed` immediately (prevent re-claim)

**Test Cases:**
```
1. Create malicious program that calls settle_auction twice in one tx
   → Expect: Second call fails (auction already settled) ✅
   
2. Create malicious program that calls claim_deposit twice in one tx
   → Expect: Second call fails (already claimed) ✅
   
3. Malicious bidder tries to drain escrow via reentrancy
   → Expect: Escrow balance protected, only valid transfers allowed ✅
```

---

### 4. PDA Authority & Signature Validation

**Threat:** Non-bidder tries to reveal another's bid or claim their deposit

**Mitigation:**
- All instructions require signer validation
- `reveal_bid` → signer must == bid.bidder
- `claim_deposit` → signer must == bid.bidder
- PDAs derived from (auction_id, bidder) → can't forge

**Test Cases:**
```
1. bidder_1 submits bid, bidder_2 attempts reveal
   → Expect: Signer mismatch error ✅
   
2. bidder_1 submits bid, bidder_2 claims deposit
   → Expect: Unauthorized error ✅
   
3. Attempt instruction without wallet signature
   → Expect: MissingSignature error ✅
```

---

### 5. Deposit Escrow Security

**Threat:** Bidder's deposit lost or stolen

**Mitigation:**
- Deposits stored in separate `Escrow` PDA account
- Only released by explicit `claim_deposit` call
- Non-transferable to other addresses
- Refundable if auction canceled

**Questions (SPEC DEPENDENT):**
- If bidder never reveals: Deposit refunded or forfeited?
- If bidder is winner: Deposit offset from payment owed, or refunded separately?
- Can seller cancel auction early?

**Test Cases (once spec clarified):**
```
1. bidder_1 submits 50 SOL deposit, loses bid
   → Claim deposit, receive 50 SOL refund ✅
   
2. bidder_1 submits 50 SOL, wins with bid=1000 SOL
   → Claim deposit: receive 50 SOL back OR 50 SOL offset from payment?
   → TBD: spec clarification
   
3. Auction canceled before settlement
   → Verify all deposits released ✅
```

---

### 6. Timestamp Validation

**Threat:** Validator manipulates block timestamp to extend bidding deadline

**Reality:** Solana validators can manipulate clock by ~25 seconds

**Mitigation:**
- Use comparisons: `clock.unix_timestamp < deadline` (not <=)
- Set long deadline windows (hours, not minutes)
- Ensure deadlines are hard constraints, not soft

**Risk Assessment:** LOW for hackathon (deadlines >> 25 seconds)

**Test Cases:**
```
1. Set bidding_deadline = now + 1 second
2. Attempt bid at now + 0.5 seconds
   → Should succeed ✅
   
3. Attempt bid at now + 1.5 seconds
   → Should fail (deadline passed) ✅
   
4. Validator can tweak by 25 seconds
   → Still acceptable (reveals 1+ hour window)
```

---

### 7. Hash Collision Resistance

**Threat:** Two different (bid_value, nonce, bidder) tuples produce same commitment hash

**Reality:** Keccak256 has negligible collision probability

**Mitigation:**
- Use industry-standard Keccak256 (same as Ethereum)
- No custom hash functions
- Fuzz test with 1,000,000+ random inputs to verify no collisions

**Test Cases:**
```
1. Generate 1,000,000 random (value, nonce, bidder) tuples
2. Compute Keccak256 for each
3. Verify no duplicates
   → Should have ZERO collisions ✅
   
4. Deliberately try to find collision (birthday attack)
   → Will take ~2^128 computations (infeasible)
   → Consider non-threat for hackathon
```

---

### 8. Frontend Security

**Threat:** Malicious frontend steals private keys or manipulates transactions

**Mitigation (User Level):**
- Use official Phantom/Solflare wallets
- Verify transaction details before signing
- Never paste seed phrases into web browser

**Mitigation (Code Level):**
- No private key handling in frontend code
- All transactions signed by wallet (not in-app)
- Commitment hash computed client-side (not sent to backend)
- Nonce generated securely (crypto.getRandomValues)

**Test Cases:**
```
1. Verify commitment hash generated client-side
   → Matches contract hash verification ✅
   
2. Verify nonce uses secure randomness
   → No guessable patterns ✅
   
3. Verify transaction details displayed to user
   → Recipient, amount correct before sign ✅
```

---

### 9. Smart Contract Upgrade Path

**Threat:** Malicious upgrade changes logic after launch

**Mitigation (MVP):**
- Smart contract is immutable (no upgrade authority)
- Reduces risk but locks in any bugs

**Mitigation (Future):**
- Use Anchor upgrade authority with timelock
- Multi-sig approval for upgrades
- Transparent upgrade process

---

## Critical Sections to Audit

### 1. Hash Verification (`reveal_bid`)

```rust
// CRITICAL: Exact match required
pub fn verify_commitment(
    bid_value: u64,
    nonce: &[u8; 32],
    bidder: &Pubkey,
    claimed_commitment: &[u8; 32],
) -> Result<()> {
    let mut hasher = keccak::Hasher::default();
    hasher.hash(&bid_value.to_le_bytes());  // ← Correct endianness?
    hasher.hash(nonce);
    hasher.hash(bidder.as_ref());
    let computed = hasher.finalize();
    
    if computed.0 != *claimed_commitment {
        return Err(VBDeskError::HashMismatch.into());
    }
    Ok(())
}
```

**Review Checklist:**
- [ ] Byte order consistent (little-endian throughout)
- [ ] Hash includes all three fields (value, nonce, bidder)
- [ ] No extra fields included
- [ ] Exact equality check (not prefix match)

### 2. Winner Determination (`settle_auction`)

```rust
// CRITICAL: Must find true maximum
pub fn find_winner(auction_id: u64, bids: &[Bid]) -> Result<(Pubkey, u64)> {
    let mut max_value = 0u64;
    let mut winner = None;
    
    for bid in bids {
        if bid.auction_id != auction_id {
            continue;  // Wrong auction
        }
        if bid.revealed_value.is_none() {
            continue;  // Not revealed yet
        }
        let value = bid.revealed_value.unwrap();
        
        // ← Correct comparison logic?
        if value > max_value {
            max_value = value;
            winner = Some(bid.bidder);
        }
    }
    
    winner.ok_or(VBDeskError::NoValidBids.into())
}
```

**Review Checklist:**
- [ ] Scans ALL bids, not just first N
- [ ] Skips non-revealed bids
- [ ] Uses `>` not `>=` (no ties)
- [ ] Handles zero bids correctly
- [ ] No off-by-one errors

### 3. Deposit Refund (`claim_deposit`)

```rust
// CRITICAL: Only valid claimers can extract deposits
pub fn claim_deposit(
    auction_id: u64,
    claimer: &Pubkey,
    auction: &Auction,
    bid: &mut Bid,
    escrow: &mut Escrow,
) -> Result<()> {
    // ← Correct owner check?
    if bid.bidder != *claimer {
        return Err(VBDeskError::Unauthorized.into());
    }
    
    // ← Already claimed?
    if bid.claimed {
        return Err(VBDeskError::AlreadyClaimed.into());
    }
    
    // ← Auction settled?
    if auction.state != AuctionState::Settled {
        return Err(VBDeskError::AuctionNotSettled.into());
    }
    
    // ← Transfer tokens correctly?
    bid.claimed = true;  // Set BEFORE transfer (reentrancy guard)
    transfer_escrow(escrow, claimer)?;
    
    Ok(())
}
```

**Review Checklist:**
- [ ] Only claimer can claim their own deposit
- [ ] Auction must be settled first
- [ ] Claimed flag set before transfer (reentrancy guard)
- [ ] Correct amount transferred
- [ ] No double-claims possible

---

## Known Limitations & Risks

| Risk | Severity | Mitigation | Timeline |
|------|----------|-----------|----------|
| **Spec ambiguity on non-reveals** | MEDIUM | Document decision, implement tests | Day 3 |
| **No formal verification** | MEDIUM | Manual audit, fuzz testing | Days 7-8 |
| **Anchor version lock** | LOW | Pin Cargo.toml, test on each release | Ongoing |
| **Timestamp manipulation (25s)** | LOW | Use long deadline windows (1+ hour) | Design |
| **RPC rate limits** | LOW | Use local validator for testing | Dev setup |
| **Frontend key compromise** | MEDIUM | User education, Phantom best practices | N/A |
| **No upgrade path** | LOW | Immutable MVP, plan for v2 multisig | Post-launch |

---

## Audit Checklist (Day 7)

### Code Review
- [ ] No `unsafe` blocks (or all justified)
- [ ] All error paths return proper errors
- [ ] No panics in production code
- [ ] All comments accurate and updated

### Testing
- [ ] 100% instruction coverage (all 5 endpoints)
- [ ] All error cases tested
- [ ] Fuzz test with 1M+ random inputs
- [ ] Stress test: 10+ concurrent auctions

### Security
- [ ] No reentrancy vectors identified
- [ ] No arithmetic overflow risks
- [ ] Hash verification works exactly
- [ ] Deposit escrow is safe
- [ ] PDA authority correctly enforced

### Performance
- [ ] All instructions under 400K CU
- [ ] settle_auction optimized for 100+ bids
- [ ] No unnecessary account reads

### Documentation
- [ ] README complete
- [ ] ARCHITECTURE.md matches code
- [ ] API.md covers all instructions
- [ ] Security assumptions documented

---

## Responsible Disclosure

If vulnerabilities are found:

1. **Do NOT** post to public forums
2. **DO** report to maintainer (via private Discord message)
3. **DO** allow 7 days for patch before public disclosure
4. **DO** provide clear PoC (proof of concept)

---

## Security Lessons Learned (Post-Mortem)

**To be filled after completion:**
- [ ] What vulnerabilities did we miss?
- [ ] What tests would have caught them?
- [ ] How do we prevent recurrence?

---

**Version:** 1.0 | **Date:** 2026-02-03 | **Status:** DRAFT  
**Next Review:** During Day 3 code walkthrough | **Audit Scheduled:** Day 7
