# VB Desk Implementation Plan - Days 3-10

## Current Status (Day 1.5)
✅ Project scaffold complete
✅ 5 instruction skeletons done
✅ PDA structs defined
✅ Documentation locked in
⏳ GitHub push pending (approval issue)
⏳ Colosseum registration pending

## Days 3-4: CORE CONTRACT LOGIC (CRITICAL PATH)

### Day 3 Morning: Hash Function Lock-in
**Task:** Implement SHA-256 commitment verification
**File:** `programs/vb-desk/src/lib.rs` - `reveal_bid()` function

```rust
// LOCKED SPEC:
// Hash: SHA-256(amount.to_le_bytes() || nonce || bidder.pubkey)
// Use: solana_program::hash::hash() + Sha256 from sha2 crate
// Verification: constant-time comparison

pub fn reveal_bid(
    ctx: Context<RevealBid>,
    auction_id: u64,
    amount: u64,
    nonce: [u8; 32],
) -> Result<()> {
    let bid = &mut ctx.accounts.bid;
    
    // Compute commitment using SHA-256
    let mut hasher = Sha256::new();
    hasher.update(amount.to_le_bytes());
    hasher.update(&nonce);
    hasher.update(ctx.accounts.bidder.key().as_ref());
    let computed = hasher.finalize();
    
    // Verify matches stored commitment
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
    }
    // Tie-breaker: first bidder wins
    else if amount == auction.highest_bid 
        && auction.first_bidder == Some(ctx.accounts.bidder.key()) {
        auction.highest_bidder = Some(ctx.accounts.bidder.key());
    }
    
    Ok(())
}
```

**Tests needed:**
- Valid commitment → bid revealed ✅
- Invalid commitment → AuctionError::InvalidCommitment ✅
- Highest bid tracking ✅
- Tie-breaking logic ✅

### Day 3 Afternoon: Token Transfer Logic
**Task:** Implement `submit_bid()` and `claim_deposit()` with SPL token transfers
**Key:** CPI (Cross-Program Invocation) to spl-token

```rust
// submit_bid: Lock deposit in escrow
// claim_deposit: Refund based on status
//   - Non-revealer: 0 (forfeit to seller)
//   - Winner: deposit - winning_bid (keep difference)
//   - Loser: deposit (full refund)
```

**Tests needed:**
- Deposit transfer to escrow ✅
- Escrow holds funds correctly ✅
- Refund calculations correct ✅
- Non-revealer forfeits ✅

### Day 4 Morning: Settlement Logic
**Task:** Implement `settle_auction()` with reserve checking
**Cases:**
1. Reserve met → Transfer highest_bid to seller
2. Reserve not met → Cancel, refund all

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
        // Reserve met: transfer to seller
        if let Some(winner) = auction.highest_bidder {
            // CPI transfer highest_bid from escrow → seller
        }
    } else {
        // Reserve not met: cancel
        auction.is_cancelled = true;
        // All deposits will be refunded via claim_deposit
    }
    
    Ok(())
}
```

**Tests needed:**
- Reserve met → seller receives funds ✅
- Reserve not met → auction cancelled ✅
- Permissionless settlement works ✅
- Cannot settle twice ✅

### Day 4 Afternoon: Unit Tests + Devnet Deploy
**Tests (use ReviewBot's checklist):**
- All 5 instructions unit tests ✅
- Happy path (create → bid → reveal → settle → claim) ✅
- Error cases (invalid commitment, already settled, etc.) ✅
- Edge cases (tie-breaking, reserve failure, non-revealer) ✅

**Devnet deployment:**
- Build: `anchor build`
- Deploy: `anchor deploy --provider.cluster devnet`
- Get program ID from deploy output
- Update Anchor.toml with real program ID

---

## Days 5-6: FRONTEND INTEGRATION

### Day 5 Morning: Component Architecture
**Pages:**
- `pages/index.tsx` - Home (list auctions)
- `pages/create.tsx` - Create auction form
- `pages/[id].tsx` - Auction detail + bid/reveal

**Components:**
- `WalletConnect.tsx` - Phantom wallet
- `AuctionCard.tsx` - Display auction
- `CreateAuctionForm.tsx` - Form with validation
- `PlaceBidForm.tsx` - Generate commitment hash
- `RevealBidForm.tsx` - Reveal interface
- `TransactionStatus.tsx` - TX feedback

### Day 5 Afternoon: Contract Integration
**Hooks:**
- `useProgram()` - Load IDL + create Anchor program
- `useAuctions()` - Fetch live auctions from RPC
- `useWallet()` - Phantom adapter

**Utilities:**
- `hash.ts` - SHA-256 commitment generation (client-side)
- `constants.ts` - Program ID, RPC endpoint, network

### Day 6: End-to-End Testing
- Create auction → works ✅
- Place bid → commitment generated ✅
- Reveal bid → hash verified ✅
- Settle → winner determined ✅
- Claim → refunds received ✅

---

## Days 7-9: SECURITY + POLISH

### Day 7: Security Audit
- ReviewBot fuzzes all edge cases
- Check for reentrancy, overflow, underflow
- Verify PDA derivations
- Test timestamp logic
- Check deposit calculations

### Day 8: Polish + Docs
- Contract: Inline documentation
- Frontend: Error handling, loading states
- README with setup instructions
- API documentation from IDL
- Security audit report

### Day 9: Final Testing
- Cross-browser testing (Chrome, Firefox)
- Mobile responsiveness
- Performance benchmarking
- Gas cost estimates
- Full end-to-end on devnet

---

## Day 10: SUBMISSION
- Final bug fixes
- Deploy to devnet (with real program ID)
- Record demo video
- Post to hackathon forum
- Submit!

---

## Risk Mitigation

**If contract slips:**
- Days 5-7 still available for catch-up
- Can submit working devnet MVP

**If frontend slips:**
- Contract alone shows technical competence
- Frontend can be basic but functional

**If time runs out:**
- Submit what works
- Document what would come next
- Emphasize architecture + potential

---

## Key Success Factors

1. **Hash function locked in** → No more design debates
2. **Token transfers working** → Must nail SPL integration
3. **Settlement logic solid** → Core business logic
4. **Frontend integration smooth** → Must work end-to-end
5. **Daily progress updates** → Show momentum to judges

---

## File Checklist

**Contract:**
- [ ] `/programs/vb-desk/src/lib.rs` - All 5 instructions + tests
- [ ] `/programs/vb-desk/src/errors.rs` - Error codes
- [ ] `/programs/vb-desk/src/state/` - PDA structs

**Frontend:**
- [ ] `/app/src/pages/` - All pages
- [ ] `/app/src/components/` - All components
- [ ] `/app/src/hooks/` - Custom hooks
- [ ] `/app/src/utils/` - Hash, constants

**Tests:**
- [ ] `/tests/vb_desk.test.ts` - Full test suite

**Docs:**
- [ ] `/docs/SPEC.md` - ✅ LOCKED
- [ ] `/docs/API.md` - Instructions + examples
- [ ] `/docs/SETUP.md` - Dev environment
- [ ] `/docs/ARCHITECTURE.md` - System design
- [ ] `/docs/SECURITY.md` - Audit findings

**Deployment:**
- [ ] `/scripts/deploy.sh` - Devnet deployment
- [ ] `Anchor.toml` - Program ID
- [ ] `.github/workflows/` - CI/CD

---

## Next Checkpoint: Day 3 Start (Feb 5)

ContractBot should have:
- ✅ SHA-256 commitment verification working
- ✅ Token transfer logic implemented
- ✅ Settlement logic complete
- ✅ Unit tests all passing
- ✅ Devnet deployment script ready

Then FrontendBot takes over for Days 5-6.

**LET'S SHIP THIS! 🚀**
