# VB Desk - Development Setup Guide

## Prerequisites

- **Rust 1.75+** (stable or nightly)
- **Node.js 18+** and npm/yarn
- **Solana CLI 1.18+**
- **Anchor 0.29.0**
- **Git**

## Quick Start (5 minutes)

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"
export PATH="/root/.local/share/solana/install/active_release/bin:$PATH"
solana --version
```

### 2. Install Anchor

```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.29.0
avm use 0.29.0
anchor --version
```

### 3. Clone & Setup

```bash
git clone https://github.com/your-org/vb-desk.git
cd vb-desk
```

### 4. Build Contract

```bash
cd programs/vb_desk
cargo build
cd ../..
```

### 5. Setup Frontend

```bash
cd app
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`.

---

## Local Development (Solana Test Ledger)

### Start Local Validator

```bash
solana-test-validator --reset
```

In a new terminal, configure Solana to use local RPC:

```bash
solana config set --url http://localhost:8899
```

### Airdrop SOL to Your Wallet

```bash
solana airdrop 100 <YOUR_WALLET_ADDRESS>
solana balance
```

### Deploy Contract Locally

```bash
anchor deploy
```

This will:
1. Build the contract
2. Deploy to local validator
3. Print program ID (save this!)

### Run Tests Locally

```bash
# Contract tests
anchor test

# Frontend tests (if using Jest)
cd app
npm test
```

---

## Devnet Deployment

### 1. Create Devnet Wallet

```bash
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json
export KEYPAIR_PATH=~/.config/solana/devnet-wallet.json
solana config set --keypair $KEYPAIR_PATH
solana config set --url https://api.devnet.solana.com
```

### 2. Airdrop SOL (Devnet)

```bash
solana airdrop 2 <YOUR_DEVNET_ADDRESS>
solana balance
```

### 3. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 4. Update IDL & Frontend

The IDL (Interface Description Language) is auto-generated:

```bash
cp target/idl/vb_desk.json app/src/idl/vb_desk.json
```

Update `app/src/config.ts` with devnet program ID:

```typescript
export const VB_DESK_PROGRAM_ID = new PublicKey("YOUR_DEVNET_PROGRAM_ID");
export const VB_DESK_RPC_URL = "https://api.devnet.solana.com";
```

### 5. Test Frontend on Devnet

```bash
cd app
npm run build
npm run dev
```

Then:
1. Connect Phantom wallet to Devnet
2. Airdrop 1-2 SOL to your wallet
3. Create an auction in the UI
4. Submit and reveal bids

---

## Running Tests

### Contract Unit Tests

```bash
cd programs/vb_desk
cargo test --release -- --nocapture
```

### Integration Tests (Full Workflow)

Requires local validator running:

```bash
solana-test-validator --reset &
cd tests
cargo test --release -- --nocapture
```

### Frontend Tests

```bash
cd app
npm test
```

### Security Audits

```bash
# Check for known vulnerabilities
cargo audit

# Run clippy (Rust linter)
cargo clippy --all-targets -- -D warnings

# Check formatting
cargo fmt -- --check
```

---

## Troubleshooting

### "anchor not found"
- Ensure Anchor is installed: `avm install 0.29.0 && avm use 0.29.0`
- Verify PATH: `echo $PATH | grep cargo`

### "Failed to fetch IDL"
- Contract may not be deployed to the cluster you're targeting
- Check Solana config: `solana config get`
- Verify program ID in `Anchor.toml`

### "Insufficient balance for account"
- Airdrop SOL: `solana airdrop 2 <YOUR_ADDRESS>`
- Devnet airdrop rate limit: max 2 SOL per 24h, try Phantom's faucet

### "Transaction timeout"
- Local validator too slow? Restart: `solana-test-validator --reset`
- Network congestion? Try again in a few minutes

### "Cannot find module '@project-serum/anchor'"
- Reinstall frontend dependencies: `cd app && npm install`

---

## Environment Variables

Create `.env.local` in the `app/` directory:

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_VB_DESK_PROGRAM_ID=<YOUR_PROGRAM_ID>
NEXT_PUBLIC_NETWORK=devnet
```

For production (mainnet):

```
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_VB_DESK_PROGRAM_ID=<MAINNET_PROGRAM_ID>
NEXT_PUBLIC_NETWORK=mainnet-beta
```

---

## Project Structure

```
vb-desk/
├── programs/vb_desk/           # Smart contract
│   ├── src/
│   │   ├── lib.rs              # Entry point, instruction router
│   │   ├── instructions/        # Instruction implementations
│   │   ├── state/               # Account data structures
│   │   └── errors.rs            # Custom error codes
│   └── Cargo.toml
│
├── app/                         # Frontend (Next.js + React)
│   ├── src/
│   │   ├── pages/               # Routes
│   │   ├── components/          # UI components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── utils/               # Utility functions (hashing, etc)
│   │   └── idl/                 # Contract IDL
│   ├── package.json
│   └── next.config.js
│
├── tests/                       # Integration tests
│   ├── vb_desk.test.ts
│   ├── test-wallets.json
│   └── Cargo.toml
│
├── docs/                        # Documentation
│   ├── SETUP.md (this file)
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   └── DEPLOYMENT.md
│
└── .github/workflows/
    └── test.yml                 # CI/CD pipeline
```

---

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make changes** (contract or frontend)

3. **Run tests locally**
   ```bash
   anchor test  # or npm test for frontend
   ```

4. **Format code**
   ```bash
   cargo fmt
   ```

5. **Commit and push**
   ```bash
   git commit -m "feat: add my-feature"
   git push origin feat/my-feature
   ```

6. **Open PR** - CI/CD will run automatically

---

## Next Steps

- Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Read [API.md](./API.md) for contract instruction reference
- Read [SECURITY.md](./SECURITY.md) for security assumptions & risks
- Check GitHub Issues for open tasks

---

**Last Updated:** 2026-02-03  
**Maintainer:** ReviewBot
