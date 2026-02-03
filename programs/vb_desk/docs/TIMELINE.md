# VB Desk - 4-Day Build Timeline

## Hard Deadline: Feb 12, 2026 - 12:00 PM EST

### Day 1 (2 hours) - PROJECT SKELETON ✅
- [x] Initialize Anchor project (`anchor init vb-desk`)
- [x] Create GitHub repo structure (programs/, app/, tests/, docs/, scripts/)
- [x] Define PDA structs: Auction, Bid
- [x] Write skeleton for all 5 instructions
- [x] Post code to Discord #contract-dev

**Status:** COMPLETE

### Day 2 (8 hours) - CORE LOGIC
- [ ] Full `create_auction` implementation
- [ ] Full `submit_bid` implementation + deposit locking
- [ ] Full `reveal_bid` implementation + commitment verification
- [ ] Full `settle_auction` implementation (reserve check + tie-breaking)
- [ ] Full `claim_deposit` implementation (refund logic)
- [ ] Comprehensive unit tests for each instruction
- [ ] Post progress every 30 min to Discord

**Checklist:**
- Token transfers working (CPI to spl-token)
- Commitment SHA-256 verification working
- PDA authority constraints correct
- All error codes tested
- Mock bidding scenario (5 bids, 3 reveals, settlement, refunds)

### Day 3 (8 hours) - INTEGRATION & EDGE CASES
- [ ] Integration tests (full auction lifecycle)
- [ ] Edge cases:
  - [ ] Multiple bidders same amount (tie-breaking logic)
  - [ ] Non-revealer deposit loss
  - [ ] Reserve price failure → refund all
  - [ ] Permissionless settlement (anyone calls)
  - [ ] Double-claim prevention
- [ ] Gas optimization
- [ ] Error message clarity
- [ ] Post progress every 30 min to Discord

### Day 4 (4 hours) - FINAL REVIEW & DEPLOYMENT
- [ ] Code audit (security check)
- [ ] Deploy to Devnet
- [ ] Final test run on live network
- [ ] Documentation update
- [ ] GitHub push with release notes
- [ ] Post final status to Discord #contract-dev

---

## Reporting
**Every 30 minutes:**
- Discord #contract-dev: Brief update (1-2 sentences)
- Format: `[HH:MM] Task: Status (blockers if any)`

**Example:**
```
[14:30] Reveal bid instruction: 90% complete (commitment hash working, need to test tie-breaker)
[15:00] Settle auction: Starting implementation, no blockers
```

**If stuck >1 hour:**
1. Search forum: https://agents.colosseum.com/api/forum/search
2. Post question to forum
3. Make decision (implement workaround or escalate)
4. Report to #log with decision

---

## Success Criteria
- All 5 instructions compile without warnings
- All error cases return correct error codes
- Sealed-bid commitments cannot be reversed (SHA-256)
- Deposits locked until claim (no escape hatches)
- Permissionless settlement works
- Tie-breaking logic correct
- Non-revealer loses deposit
- Reserve failure refunds all
- Zero security issues (basic audit)
- Devnet deployment successful

---

## Links
- **Anchor Docs**: https://www.anchor-lang.com/
- **Solana Cookbook**: https://solanacookbook.com/
- **Forum**: https://agents.colosseum.com/api/forum/search
- **GitHub**: TBD (initialize after skeleton complete)
