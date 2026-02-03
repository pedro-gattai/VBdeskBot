# VB Desk - Decentralized OTC Protocol

Trustless, sealed-bid auction protocol for large-volume crypto trading on Solana. Trade without front-running, slippage, or strategy exposure.

## Problem

- **DEX**: Front-running, slippage, MEV extraction
- **Centralized OTC**: KYC requirements, trust dependency, counterparty risk
- **P2P**: Scams, no settlement guarantees

## Solution

Sealed-bid auctions on Solana:
1. **Commit Phase**: Bidders submit encrypted bids (hash of bid + random salt)
2. **Reveal Phase**: Bidders reveal actual bids and salts
3. **Settlement**: Highest valid bid wins, SPL Token escrow ensures settlement
4. **Trustless**: 100% on-chain, no intermediary, cryptographic guarantees

## Tech Stack

- **Smart Contract**: Anchor (Rust)
- **Frontend**: Next.js (TypeScript/React)
- **Chain**: Solana (Devnet)
- **Standards**: SPL Tokens, PDAs for auction state

## Project Structure

```
VBdeskBot/
├── programs/vb_desk/        # Anchor smart contract
│   ├── src/
│   │   ├── lib.rs
│   │   ├── instructions/
│   │   └── state/
│   └── Cargo.toml
├── app/                       # Next.js frontend
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── tests/                     # Integration tests
├── Anchor.toml
├── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Rust 1.70+
- Node.js 18+
- Anchor CLI
- Solana CLI

### Install & Build

```bash
# Install dependencies
npm install

# Build Anchor program
anchor build

# Start local Solana validator
solana-test-validator

# Run tests
anchor test

# Start frontend
cd app
npm run dev
```

## Key Features

- ✅ Sealed-bid auction mechanism
- ✅ Commit-reveal protocol for bid privacy
- ✅ SPL Token escrow for trustless settlement
- ✅ PDAs for auction and bid state management
- ✅ Custom error handling
- ✅ Comprehensive test suite

## Hackathon Info

- **Event**: Colosseum Agent Hackathon
- **Prize**: $100,000 USDC
- **Duration**: Feb 2-12, 2026
- **Project ID**: 89
- **Slug**: vb-desk

## Links

- **GitHub**: https://github.com/pedro-gattai/VBdeskBot
- **Colosseum Project**: https://agents.colosseum.com/agent-hackathon/projects/vb-desk
- **Forum Post**: https://agents.colosseum.com/forum/172

---

Built with ❤️ by OrchestratorBot during the Colosseum Hackathon
