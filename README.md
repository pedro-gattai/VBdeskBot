# 🚀 VB Desk: The Future of Private OTC Trading on Solana

**Stop losing to front-runners. Start winning with privacy.**

VB Desk is the first decentralized, sealed-bid auction platform on Solana - bringing institutional-grade privacy to DeFi OTC trading.

## 💔 The Problem with Current OTC Solutions

### Traditional DEXs (Jupiter, Raydium)
- ❌ Public orderbooks = front-running paradise
- ❌ Large trades suffer massive slippage
- ❌ MEV bots sandwich your transactions
- ❌ Your strategy is exposed to competitors

### Centralized OTC Desks
- ❌ KYC requirements and trust dependency
- ❌ High fees and opaque pricing
- ❌ Counterparty risk
- ❌ You never know if you got the best deal

### P2P Trading
- ❌ Scams and no settlement guarantees
- ❌ Manual coordination, slow and risky
- ❌ No price discovery mechanism

## ✨ The VB Desk Solution

### Sealed-Bid Auctions = True Privacy + Fair Price Discovery

```
1. CREATE    → Seller creates auction with token amount
2. COMMIT    → Bidders submit encrypted bids (SHA-256 hash)
3. REVEAL    → Bidders prove their bids (cryptographic reveal)
4. FINALIZE  → Highest bid wins, instant settlement
5. SETTLE    → Trustless PDA escrow transfers tokens
```

### Why VB Desk Wins

🔒 **Absolute Privacy**
- SHA-256 commitments hide your bids until reveal
- No front-running, no MEV extraction
- Your trading strategy stays secret

⚡ **Lightning-Fast Settlement**
- Built on Solana for instant finality
- Trustless PDA escrow (no intermediaries)
- Direct token transfer on settlement

💰 **True Price Discovery**
- Competitive sealed-bid auction
- Fair market value emerges organically
- No manipulation, no hidden fees

🛡️ **Production-Ready Security**
- Battle-tested Anchor framework
- Comprehensive security audit checklist
- 8 instructions, full lifecycle coverage

## 🏗️ Tech Stack

**Smart Contract**
- Language: Rust
- Framework: Anchor 0.32.1
- Chain: Solana (Devnet → Mainnet ready)
- Deployment: Program ID `AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf`

**Frontend**
- Framework: React + TypeScript + Vite
- Wallet: Solana Wallet Adapter
- Styling: Modern, responsive UI

**Cryptography**
- Commitment: SHA-256 hash(price || nonce)
- Privacy: Bidders choose random nonces
- Security: Cryptographic proofs for reveal

## 📦 Quick Start

### Prerequisites
```bash
# Required tools
- Rust 1.70+
- Node.js 18+
- Anchor CLI
- Solana CLI
```

### Installation

```bash
# Clone the repository
git clone https://github.com/pedro-gattai/VBdeskBot
cd VBdeskBot

# Install dependencies
npm install

# Build smart contract
anchor build

# Deploy to devnet
anchor deploy

# Start frontend
cd frontend
npm install
npm run dev
```

### Testing

```bash
# Run smart contract tests
anchor test

# Run integration tests
npm test
```

## 📊 Project Status

✅ **Completed**
- Smart contract deployed to Devnet
- 8 instructions fully implemented
- Commit-reveal cryptography working
- Frontend components built
- Comprehensive documentation

🔄 **In Progress**
- Integration testing
- UI/UX polish
- Security audit
- Community engagement

🎯 **Next Steps**
- Mainnet deployment
- Partnership integrations
- Advanced features (multi-token, batch auctions)

## 🏆 Colosseum Agent Hackathon

**Competing for $100,000 USDC Prize**

- **Event**: Colosseum Agent Hackathon 2026
- **Project**: VB Desk (ID: 89)
- **Innovation**: First sealed-bid OTC platform on Solana
- **Status**: Production-ready smart contract, active development

**Why We'll Win:**
- Novel use case (sealed-bid privacy)
- Production-quality code
- Clear market need
- Active community engagement
- Path to mainnet and adoption

## 🔗 Links

- **Project Page**: https://agents.colosseum.com/agent-hackathon/projects/vb-desk
- **GitHub**: https://github.com/pedro-gattai/VBdeskBot
- **Forum**: https://agents.colosseum.com/forum/172
- **Smart Contract**: [Solana Explorer](https://explorer.solana.com/address/AQN8iwxj5s9cupFA4bhaK7ccuCyN2fD7EH3ari3T3uXf?cluster=devnet)

## 📚 Documentation

- [User Guide](./docs/USER_GUIDE.md) - How to create auctions and place bids
- [Developer Guide](./docs/DEVELOPER.md) - Technical architecture and integration
- [Security](./docs/SECURITY.md) - Security considerations and audit checklist
- [FAQ](./docs/FAQ.md) - Common questions and answers

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

---

**VB Desk: Private OTC trading for everyone.** 🗳️

Built with ❤️ by the VB Desk team during the Colosseum Agent Hackathon.

*Trade privately. Trade fairly. Trade on VB Desk.*
