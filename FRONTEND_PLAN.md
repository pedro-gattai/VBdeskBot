# VB Desk Frontend Plan

## Tech Stack (Per Pedro's Instructions)
- **Framework:** Vite + React
- **Blockchain:** Anchor client for Solana
- **Deployment:** Cloudflare (auto-deploy on git push)

## MVP Features (Priority Order)

### P0 - Core Auction Flow
1. **Wallet Connection**
   - Phantom/Solflare wallet adapter
   - Connection status display

2. **Create Auction Interface**
   - Token pair selection (selling/buying)
   - Amount input
   - Duration/deadline picker
   - Min bid deposit input
   - Create button → calls `create_auction` instruction

3. **View Auctions List**
   - Active auctions display
   - Auction details (token pair, amounts, deadline)
   - Filter by status (active/finalized/completed)

4. **Place Bid Interface**
   - Price input (hidden via commit-reveal)
   - Salt generation (random 32-byte value)
   - Bid deposit (SOL)
   - Commit button → calls `place_bid` with SHA-256(price || salt)

5. **Reveal Bid Interface**
   - After commit phase ends
   - Input original price + salt
   - Reveal button → calls `reveal_bid`

6. **Settlement Interface**
   - View winning bid
   - Complete trade button (winner only)
   - Withdraw button (losers)

### P1 - UX Improvements
- Transaction status notifications
- Loading states
- Error handling
- Wallet balance display
- Transaction history

### P2 - Polish
- Auction countdown timers
- Responsive design
- Dark mode
- Better token selection UX

## File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   ├── CreateAuction.tsx
│   │   ├── AuctionList.tsx
│   │   ├── PlaceBid.tsx
│   │   ├── RevealBid.tsx
│   │   └── Settlement.tsx
│   ├── hooks/
│   │   ├── useAnchor.ts
│   │   ├── useAuction.ts
│   │   └── useBid.ts
│   ├── utils/
│   │   ├── anchor.ts (program interaction)
│   │   ├── commit-reveal.ts (SHA-256 hashing)
│   │   └── types.ts
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Dependencies
```json
{
  "@coral-xyz/anchor": "^0.32.1",
  "@solana/web3.js": "^1.95.0",
  "@solana/wallet-adapter-react": "^0.15.35",
  "@solana/wallet-adapter-wallets": "^0.19.32",
  "react": "^18.3.1",
  "vite": "^5.4.0"
}
```

## Implementation Steps

### Step 1: Scaffold (After Devnet Deployment)
```bash
cd ~/VBdeskBot
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets
```

### Step 2: Anchor Integration
- Copy IDL from `target/idl/vb_desk.json`
- Update program ID from devnet deployment
- Create Anchor provider hook

### Step 3: Core Components
- Build WalletConnect first (foundation)
- Then CreateAuction (sellers start auctions)
- Then AuctionList (visibility)
- Then PlaceBid (buyers participate)
- Finally RevealBid & Settlement (completion)

### Step 4: Cloudflare Deployment
- Push to GitHub → auto-deploys
- Check CI status for deployment confirmation

## Commit-Reveal Implementation
```typescript
// commit-reveal.ts
import { createHash } from 'crypto';

export function generateSalt(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function commitBid(price: number, salt: string): string {
  const priceBuffer = Buffer.from(price.toString());
  const saltBuffer = Buffer.from(salt, 'hex');
  const combined = Buffer.concat([priceBuffer, saltBuffer]);
  return createHash('sha256').update(combined).digest('hex');
}
```

## Testing Strategy
1. Local devnet testing first
2. Manual E2E auction flow
3. Error case handling (insufficient balance, wrong reveal, etc.)
4. Responsive design check
5. Deploy to Cloudflare staging

## Timeline (After Contract Deployed)
- Scaffold + dependencies: 30 min
- Wallet connection: 30 min
- CreateAuction component: 1 hour
- AuctionList component: 1 hour
- PlaceBid + RevealBid: 1.5 hours
- Settlement: 1 hour
- Testing + bug fixes: 1 hour
- **Total: ~6-7 hours for MVP**

## Notes
- Keep it simple for MVP - no fancy animations
- Focus on functionality over aesthetics
- Test on devnet extensively before mainnet
- Commit after each working component
