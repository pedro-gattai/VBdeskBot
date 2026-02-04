# VB Desk Quick Start Guide

Get your sealed-bid auction platform running in 5 minutes.

## 🚀 Prerequisites

```bash
# Solana CLI
solana --version  # Should be >= 1.17

# Anchor
anchor --version  # Should be >= 0.29.0

# Node.js
node --version    # Should be >= 18.0

# Yarn or npm
yarn --version
```

### Install Missing Tools

```bash
# Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Node.js
# Visit https://nodejs.org/ or use nvm
```

## 📦 Project Setup

### 1. Initialize Anchor Project (if not already done)

```bash
cd ~/VBdeskBot

# If starting fresh:
anchor init vb_desk_project --javascript
cd vb_desk_project

# Copy the program files
cp ~/VBdeskBot/programs/vb_desk/src/lib.rs programs/vb_desk/src/
cp ~/VBdeskBot/programs/vb_desk/Cargo.toml programs/vb_desk/
```

### 2. Configure Anchor.toml

```toml
[features]
seeds = false
skip-lint = false

[programs.localnet]
vb_desk = "VBDesk11111111111111111111111111111111111111"

[programs.devnet]
vb_desk = "VBDesk11111111111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### 3. Update Cargo.toml (workspace level if using workspace)

If you have a workspace root Cargo.toml:

```toml
[workspace]
members = [
    "programs/vb_desk"
]

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
```

## 🔨 Build & Test

### 1. Build the Program

```bash
anchor build
```

**Troubleshooting**:
- If you get dependency errors: `cargo clean && anchor build`
- If Anchor version mismatch: `avm use latest`
- If Solana version issues: Update `Cargo.toml` to match your `solana --version`

### 2. Get the Program ID

```bash
anchor keys list
```

Copy the program ID and update:
1. `declare_id!()` in `programs/vb_desk/src/lib.rs`
2. `Anchor.toml` under `[programs.localnet]` and `[programs.devnet]`

Then rebuild:
```bash
anchor build
```

### 3. Run Local Validator

```bash
# Terminal 1
solana-test-validator
```

### 4. Deploy Locally

```bash
# Terminal 2
anchor deploy
```

### 5. Run Tests

Create a basic test file `tests/vb_desk.ts`:

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VbDesk } from "../target/types/vb_desk";
import { assert } from "chai";

describe("vb_desk", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.VbDesk as Program<VbDesk>;

  it("Program initialized", () => {
    assert.ok(program.programId);
    console.log("Program ID:", program.programId.toBase58());
  });
});
```

Run tests:
```bash
anchor test
```

## 🌐 Deploy to Devnet

### 1. Configure for Devnet

```bash
solana config set --url devnet
```

### 2. Airdrop SOL (Devnet only)

```bash
solana airdrop 2
solana balance
```

### 3. Deploy

```bash
anchor deploy --provider.cluster devnet
```

### 4. Verify Deployment

```bash
solana program show <PROGRAM_ID> --url devnet
```

## 🎯 Create Your First Auction

### Using the Client Library

```typescript
import { VBDeskClient } from "./client-example";
import * as anchor from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.VbDesk;
const client = new VBDeskClient(program, provider);

// Your token mint (create one first or use existing)
const tokenMint = new PublicKey("YOUR_TOKEN_MINT");

// Seller keypair (use your wallet)
const seller = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("seller-key.json", "utf-8")))
);

// Create auction
const now = Math.floor(Date.now() / 1000);
const auctionPDA = await client.createAuction(
  seller,
  tokenMint,
  1000,              // Selling 1000 tokens
  50_000_000,        // Minimum price: 0.05 SOL
  now + 3600,        // Commit ends in 1 hour
  now + 7200         // Reveal ends in 2 hours
);

console.log("Auction created:", auctionPDA.toBase58());
```

### Using CLI (Manual)

```bash
# 1. Create token (if you don't have one)
spl-token create-token
# Note the token mint address

# 2. Create token account
spl-token create-account <TOKEN_MINT>

# 3. Mint some tokens
spl-token mint <TOKEN_MINT> 1000

# 4. Use Anchor client or build custom CLI
```

## 📖 Full Workflow Example

### Phase 1: Seller Creates Auction

```typescript
const auctionPDA = await client.createAuction(
  sellerKeypair,
  tokenMint,
  1000,
  50_000_000,
  commitEndTime,
  revealEndTime
);
```

### Phase 2: Bidders Place Sealed Bids

```typescript
// Bidder 1
const { salt: salt1 } = await client.placeBid(
  bidder1Keypair,
  auctionPDA,
  60_000_000  // 0.06 SOL
);
// ⚠️ SAVE salt1 securely!

// Bidder 2
const { salt: salt2 } = await client.placeBid(
  bidder2Keypair,
  auctionPDA,
  75_000_000  // 0.075 SOL
);
// ⚠️ SAVE salt2 securely!
```

### Phase 3: Wait for Commit Period to End

```typescript
// Check current time vs auction deadlines
const auction = await client.getAuction(auctionPDA);
const now = Math.floor(Date.now() / 1000);

if (now < auction.commitEndTime.toNumber()) {
  console.log("Still in commit period, waiting...");
  // Wait...
}
```

### Phase 4: Bidders Reveal

```typescript
// Bidder 1 reveals
await client.revealBid(
  bidder1Keypair,
  auctionPDA,
  60_000_000,
  salt1  // Must use same salt from phase 2!
);

// Bidder 2 reveals
await client.revealBid(
  bidder2Keypair,
  auctionPDA,
  75_000_000,
  salt2
);
```

### Phase 5: Finalize

```typescript
await client.finalizeAuction(auctionPDA);
```

### Phase 6: Determine Winner & Complete Trade

```typescript
// Find winner (off-chain)
const winningBidPDA = await client.findWinningBid(auctionPDA);

// Get winner's info
const winningBid = await client.getBid(winningBidPDA);
const winnerTokenAccount = await getAssociatedTokenAddress(
  tokenMint,
  winningBid.bidder
);

// Complete trade
await client.completeTrade(
  auctionPDA,
  winningBidPDA,
  winnerTokenAccount,
  sellerKeypair.publicKey
);
```

### Phase 7: Losers Withdraw

```typescript
// Non-winner withdraws their deposit
await client.withdrawBid(loserKeypair, auctionPDA);
```

## 🐛 Common Issues

### "Program ID mismatch"
**Solution**: Rebuild after updating `declare_id!()` in lib.rs

### "Insufficient funds"
**Solution**: Airdrop more SOL or check wallet balance
```bash
solana balance
solana airdrop 1
```

### "Transaction simulation failed"
**Solution**: Check logs for specific error
```bash
anchor test --skip-local-validator  # Shows detailed logs
```

### "Account not found"
**Solution**: Ensure accounts exist and PDAs are derived correctly

### "Invalid commitment"
**Solution**: Verify salt is saved correctly and matches the reveal

## 📊 Monitoring

### View Auction State

```typescript
const auction = await client.getAuction(auctionPDA);
console.log("Status:", auction.status);
console.log("Commit ends:", new Date(auction.commitEndTime.toNumber() * 1000));
console.log("Reveal ends:", new Date(auction.revealEndTime.toNumber() * 1000));
```

### View All Bids

```typescript
const allBids = await client.getAllBids(auctionPDA);
console.log("Total bids:", allBids.length);

for (const bidAccount of allBids) {
  const bid = bidAccount.account;
  console.log("Bidder:", bid.bidder.toBase58());
  console.log("Revealed:", bid.revealedPrice?.toNumber() || "Not yet");
}
```

### View Program Logs

```bash
solana logs <PROGRAM_ID>
```

## 🎓 Next Steps

1. **Read the full documentation**: `README.md` and `SECURITY_AUDIT.md`
2. **Customize the program**: Add features like partial fills, multiple winners, etc.
3. **Build a UI**: Create frontend with React/Next.js
4. **Add tests**: Comprehensive test suite for all edge cases
5. **Security audit**: Before mainnet deployment
6. **Deploy to mainnet**: After thorough testing

## 📞 Support

- **Documentation**: See README.md
- **Security**: See SECURITY_AUDIT.md  
- **Examples**: See client-example.ts
- **Issues**: Open GitHub issues (if applicable)

## ⚡ Quick Commands Reference

```bash
# Build
anchor build

# Test
anchor test

# Deploy locally
anchor deploy

# Deploy to devnet
anchor deploy --provider.cluster devnet

# View program
solana program show <PROGRAM_ID>

# View logs
solana logs <PROGRAM_ID>

# Generate TypeScript types
anchor build  # Types auto-generated in target/types/

# Clean build
anchor clean
cargo clean
```

---

**Ready to launch your OTC trading platform!** 🚀

Remember: This is a foundational implementation. Before mainnet deployment:
- Complete security audit
- Comprehensive testing
- Gradual rollout
- Monitoring systems in place

Good luck! 🎯
