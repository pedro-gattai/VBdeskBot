# VB Desk - Next Tasks for Gemini Workers

**Status:** Ready to spawn parallel workers  
**Prerequisites:** Program must be deployed to devnet first

---

## 🚀 IMMEDIATE: Deploy to Devnet

**Owner:** Main agent or human  
**Priority:** CRITICAL (blocks all other tasks)

```bash
# Get SOL from web faucet
# Visit: https://faucet.solana.com
# Wallet: JC2hzCcPdJ1C8fqj7TXHr6esHQDpA4QTdHNDF5fau7jL

# Then deploy
cd ~/VBdeskBot/programs/vb_desk
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
source ~/.cargo/env
anchor deploy --provider.cluster devnet

# Update declare_id!() in lib.rs with new program ID
# Rebuild and redeploy
```

---

## 📋 Task 1: Frontend Development

**Worker:** Gemini Flash 2.0  
**Label:** `gemini-frontend-vbdesk`  
**Estimated Time:** 2-3 hours  
**Priority:** HIGH

### Context
Build a complete web UI for the VB Desk sealed-bid auction platform using Next.js 14, TypeScript, and Tailwind CSS.

### Requirements

1. **Project Setup**
   ```bash
   cd ~/VBdeskBot
   npx create-next-app@latest app --typescript --tailwind --app-router
   cd app
   npm install @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react
   ```

2. **Core Components**
   - `AuctionList.tsx` - Display all active auctions
   - `CreateAuction.tsx` - Form to create new auction
   - `BidForm.tsx` - Sealed bid submission with client-side commitment generation
   - `RevealBid.tsx` - Reveal interface (user must remember nonce!)
   - `AuctionDetails.tsx` - Show auction state, bids, winner

3. **Features**
   - Wallet connection (Phantom, Solflare support)
   - Real-time auction status updates
   - Commitment generation (SHA256 in browser)
   - Nonce storage warning (localStorage with big red warning about losing nonce)
   - Transaction status tracking
   - Error handling for all edge cases

4. **Design**
   - Clean, modern UI (Tailwind)
   - Responsive (mobile-first)
   - Dark mode support
   - Loading states and skeletons
   - Toast notifications for tx results

5. **Deliverables**
   - `app/` directory with all components
   - `lib/anchor-client.ts` - Program interaction helpers
   - `hooks/useAuction.ts` - React hooks for auction data
   - `README.md` in app/ with setup instructions

---

## 📋 Task 2: Test Suite

**Worker:** Gemini Flash 2.0  
**Label:** `gemini-tests-vbdesk`  
**Estimated Time:** 1-2 hours  
**Priority:** HIGH

### Context
Write comprehensive integration tests for all VB Desk smart contract instructions using Anchor's testing framework.

### Requirements

1. **Test Setup**
   ```typescript
   // tests/vb_desk.ts
   import * as anchor from "@coral-xyz/anchor";
   import { Program } from "@coral-xyz/anchor";
   import { VbDesk } from "../target/types/vb_desk";
   import { expect } from "chai";
   ```

2. **Test Cases**

   **Happy Path:**
   - ✅ Create auction with valid parameters
   - ✅ Submit multiple sealed bids
   - ✅ Reveal bids correctly
   - ✅ Settle auction and declare winner
   - ✅ Winner gets tokens, seller gets SOL
   - ✅ Losing bidders claim refunds

   **Edge Cases:**
   - ⚠️ Create auction with reserve price = 0 (should fail)
   - ⚠️ Submit bid below reserve (should fail)
   - ⚠️ Reveal with wrong nonce (should fail)
   - ⚠️ Try to reveal before commit period ends (should fail)
   - ⚠️ Try to settle before reveal period ends (should fail)
   - ⚠️ Non-revealer loses deposit (should forfeit)
   - ⚠️ Tie-breaker test (first bidder wins)
   - ⚠️ Auction cancelled (no valid bids)

   **Attack Vectors:**
   - 🔒 Try to claim winning bid before settlement
   - 🔒 Try to withdraw winning bid (should fail)
   - 🔒 Try to settle auction twice
   - 🔒 Try to claim deposit twice

3. **Test Utilities**
   - Helper functions for creating test accounts
   - SPL token mint creation
   - Commitment generation helpers
   - Time manipulation (clock advance)

4. **Deliverables**
   - `tests/vb_desk.ts` - Complete test suite
   - `tests/utils/` - Helper functions
   - Test coverage report (aim for >90%)
   - CI/CD integration (GitHub Actions workflow)

---

## 📋 Task 3: Documentation

**Worker:** Gemini Flash 2.0  
**Label:** `gemini-docs-vbdesk`  
**Estimated Time:** 1 hour  
**Priority:** MEDIUM

### Context
Create comprehensive documentation for users, developers, and auditors.

### Requirements

1. **User Guide** (`docs/USER_GUIDE.md`)
   - What is sealed-bid auction?
   - How to create an auction
   - How to place a bid (with commitment explanation)
   - **CRITICAL:** How to safely store nonce (HUGE WARNING)
   - How to reveal your bid
   - How to claim refunds
   - Common pitfalls and FAQs

2. **Developer Guide** (`docs/DEVELOPER.md`)
   - Architecture overview
   - Smart contract structure
   - PDA derivation schemes
   - Instruction accounts
   - Integration examples
   - Client SDK usage
   - Testing guide

3. **API Reference** (`docs/API.md`)
   - All 5 instructions documented
   - Account structures
   - Error codes
   - Events
   - TypeScript type definitions

4. **Deployment Guide** (`docs/DEPLOYMENT.md`)
   - Building from source
   - Deploying to devnet
   - Deploying to mainnet
   - Verifying on-chain program
   - Upgrade procedures

5. **Security Document** (`docs/SECURITY.md`)
   - Threat model
   - Commitment scheme security
   - Known limitations
   - Audit checklist
   - Responsible disclosure policy

6. **Main README** (update `README.md`)
   - Project overview
   - Quick start
   - Features list
   - Links to detailed docs
   - License and credits

7. **Deliverables**
   - All markdown files in `docs/` directory
   - Diagrams (Mermaid or ASCII art)
   - Architecture diagram
   - Sequence diagrams for each instruction
   - Updated root README.md

---

## 📋 Task 4: Security Audit Prep

**Worker:** Gemini Flash 2.0  
**Label:** `gemini-security-vbdesk`  
**Estimated Time:** 1 hour  
**Priority:** MEDIUM

### Context
Prepare materials for security audit and document security assumptions.

### Requirements

1. **Security Checklist** (`security/audit-checklist.md`)
   - [ ] Integer overflow checks
   - [ ] Access control verification
   - [ ] PDA seed collision analysis
   - [ ] Reentrancy analysis
   - [ ] Commitment scheme review
   - [ ] Time manipulation resistance
   - [ ] Front-running analysis
   - [ ] DoS vector analysis

2. **Threat Model** (`security/THREAT_MODEL.md`)
   - Attacker profiles
   - Attack surfaces
   - Asset at risk analysis
   - Mitigation strategies

3. **Known Issues** (`security/KNOWN_ISSUES.md`)
   - Limitations of current implementation
   - Non-revealer penalty (is it fair?)
   - Auction griefing scenarios
   - Front-running concerns

4. **Formal Verification Prep** (`security/invariants.md`)
   - Contract invariants
   - State transition rules
   - Properties to verify

5. **Deliverables**
   - All files in `security/` directory
   - Audit request template
   - Bug bounty program draft

---

## 🎯 Task Spawning Command Template

```bash
# After deployment succeeds, spawn workers:

# Frontend
/spawn label:gemini-frontend-vbdesk model:gemini-2.0-flash-exp \
  "You are building the frontend for VB Desk. Read BUILD_SUCCESS.md and \
   NEXT_TASKS.md Task 1. Create a complete Next.js app in ~/VBdeskBot/app/ \
   with all components listed. Use the deployed program ID from deploy output."

# Tests  
/spawn label:gemini-tests-vbdesk model:gemini-2.0-flash-exp \
  "You are writing tests for VB Desk. Read BUILD_SUCCESS.md and \
   NEXT_TASKS.md Task 2. Create comprehensive tests in ~/VBdeskBot/tests/ \
   covering all instructions and edge cases."

# Docs
/spawn label:gemini-docs-vbdesk model:gemini-2.0-flash-exp \
  "You are documenting VB Desk. Read BUILD_SUCCESS.md and NEXT_TASKS.md Task 3. \
   Create all documentation files in ~/VBdeskBot/docs/ and update README.md."

# Security
/spawn label:gemini-security-vbdesk model:gemini-2.0-flash-exp \
  "You are preparing VB Desk for security audit. Read BUILD_SUCCESS.md and \
   NEXT_TASKS.md Task 4. Create security documentation in ~/VBdeskBot/security/."
```

---

## 🔄 Progress Tracking

Create `~/VBdeskBot/PROGRESS.md` to track completion:

```markdown
# VB Desk Development Progress

- [x] Smart contract build (Orchestrator)
- [ ] Deployed to devnet
- [ ] Frontend (Gemini Worker 1)
- [ ] Tests (Gemini Worker 2)
- [ ] Documentation (Gemini Worker 3)
- [ ] Security audit prep (Gemini Worker 4)
- [ ] Code review
- [ ] Mainnet deployment
```

---

**Note to Main Agent:** Once deployment succeeds, spawn all 4 Gemini workers in parallel. They can work independently. Monitor their progress and merge their work when complete.
