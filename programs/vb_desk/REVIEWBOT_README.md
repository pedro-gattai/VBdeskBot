# ReviewBot - Testing & Security Responsibilities

## Mission

ReviewBot is responsible for:
1. **Testing Infrastructure** - Setup test framework, CI/CD, test wallets
2. **Test Implementation** - Write and execute unit + integration tests as code lands
3. **Security Audit** - Fuzz testing, reentrancy checks, arithmetic validation (Day 7)
4. **Documentation** - Maintain API, architecture, setup, security docs
5. **Code Review** - Approve PRs, verify no bugs leak through
6. **Progress Reporting** - Post status to Discord every 30 min

---

## Timeline

### Days 1-2 (NOW) ✅ COMPLETE
- ✅ Test framework setup (Cargo.toml, test-wallets.json)
- ✅ GitHub CI/CD workflows
- ✅ Documentation (SETUP, ARCHITECTURE, API, SECURITY)
- ✅ Testing checklist (100+ test cases defined)
- ✅ Discord post

### Days 3-4
- Monitor ContractBot PRs
- Implement unit tests as instructions land
- Verify all tests passing locally
- Catch bugs early

### Days 5-6
- Monitor FrontendBot + frontend tests
- Verify contract-frontend integration works
- Run end-to-end flows

### Day 7 (SECURITY FOCUSED)
- Run fuzz tests (1M+ random inputs)
- Reentrancy testing
- Arithmetic overflow/underflow
- Hash collision verification
- Manual code audit (critical sections)

### Days 8-9
- Final performance benchmarking
- Cross-browser + mobile testing
- Fix any remaining bugs

### Day 10
- Final submission test
- Demo video walkthrough
- Post "READY" approval

---

## Key Files

| File | Purpose | Status |
|------|---------|--------|
| `tests/vb_desk.test.ts` | Test stubs (to be filled in) | ✅ Created |
| `tests/test-wallets.json` | Test wallets + scenarios | ✅ Created |
| `tests/Cargo.toml` | Test dependencies | ✅ Created |
| `.github/workflows/test.yml` | CI/CD pipeline | ✅ Created |
| `docs/SETUP.md` | Dev environment guide | ✅ Created |
| `docs/ARCHITECTURE.md` | System design | ✅ Created |
| `docs/API.md` | Instruction reference | ✅ Created |
| `docs/SECURITY.md` | Security analysis + audit checklist | ✅ Created |
| `TESTING_CHECKLIST.md` | 100+ test cases | ✅ Created |

---

## Security Audit Checklist (Day 7)

### Critical Sections to Focus On

1. **Hash Verification (reveal_bid)**
   - Must match exactly: `Keccak256(value || nonce || bidder)`
   - Test with 1M+ random inputs
   - Verify no collisions

2. **Highest Bidder Determination (settle_auction)**
   - Scan ALL bids, not just first N
   - Find true max value
   - Handle ties, zero bids, non-reveals

3. **Reentrancy Protection**
   - Bid marked `claimed` immediately
   - No state mutation after transfer
   - CPI guards in place

4. **Deposit Escrow Security**
   - Only claimer can extract
   - Can't claim twice
   - Correct amounts only

5. **PDA Authority**
   - Signer validation on sensitive ops
   - No account confusion between auctions
   - Consistent derivation

### Fuzz Test Plan

```bash
# Day 7: Run these tests
cargo test --release fuzz_hash -- --nocapture
  → Test 1M random (value, nonce, bidder) tuples
  → Verify zero collisions

cargo test --release fuzz_arithmetic -- --nocapture
  → Test overflow/underflow with extreme values
  → u64::MAX bids, max deposits, etc.

cargo test --release fuzz_state -- --nocapture
  → Random instruction ordering
  → Unexpected states, race conditions
```

---

## PR Review Checklist

When ContractBot/FrontendBot submit PRs, verify:

- [ ] Builds without errors
- [ ] All new tests passing
- [ ] No hardcoded secrets/keys
- [ ] Comments on complex logic
- [ ] No debug output (console.log, println!, etc)
- [ ] Clippy warnings resolved
- [ ] Code formatted (cargo fmt)

---

## Testing Results Template

Post daily to Discord:

```
🧪 **ReviewBot Daily Test Report**

**Date:** [DATE]
**Pass Rate:** [X]% ([Y passing] / [Z total])
**New Tests:** [count]
**Bugs Found:** [count]
**Blockers:** [list or "none"]

Top 3 Coverage Gaps:
1. [Instruction or scenario]
2. [Instruction or scenario]
3. [Instruction or scenario]

Next 24h: [plan]
```

---

## Critical Paths & Blockers

**Unblock Frontend (Day 5):**
- All 5 instructions must compile & have tests
- IDL generated and exported
- No critical bugs

**Unblock Submission (Day 10):**
- Zero panic/crash paths
- All error cases handled
- Performance within targets
- Security audit passed

---

## Escalation Protocol

If critical bug found:
1. Post in Discord #blockers with details
2. Tag OrchestratorBot
3. Include: bug description, PoC, severity, ETA to fix
4. Example: "Reentrancy vulnerability in settle_auction, affects payment transfer"

---

## Notes for Future Sessions

- **Specification Decisions (TBD):**
  - Non-revealer deposit: refund or forfeit?
  - Winner's deposit: offset from payment or refund?
  - Bid updates: allow or reject?
  - Tie-breaking: first or last bidder wins?
  - Idempotent settle: allow re-settle or reject?

- **Performance Optimization Opportunities:**
  - Cache highest bid during reveal phase (avoid full scan at settle)
  - Index bids by auction_id for faster lookup
  - Batch multiple claims in single instruction

- **Known Limitations:**
  - No upgrade path (immutable for hackathon)
  - 25-second timestamp window (acceptable for long deadlines)
  - RPC rate limits (use local validator for testing)

---

**Version:** 1.0 | **Date:** 2026-02-03 | **Status:** ACTIVE  
**Next Update:** Daily sync (every 12 hours)
**Critical Deadline:** Day 4 all unit tests must pass
