# 🔗 Anchor Smart Contract Integration Guide

**Status**: Ready to implement once IDL provided  
**Target**: Wire useAuction hook to VB Desk contract  
**Timeline**: 1-2 days once IDL arrives  

---

## 📋 Pre-Integration Checklist

Before I can wire the contract, I need from you:

```json
{
  "required": {
    "idl_file": "programs/vb_desk/target/idl/vb_desk.json",
    "program_id": "DevnetProgramIdHere...",
    "pda_seeds": {
      "auction": "['auction', auction_id]",
      "bid": "['bid', auction_id, bidder_pubkey]",
      "escrow": "['escrow', auction_id]"
    },
    "hash_function": "SHA-256 (confirmed)",
    "network": "devnet (only)"
  },
  "optional_but_helpful": {
    "example_tx": "One successful transaction from your tests",
    "account_structure": "Account discriminators or field ordering",
    "instruction_params": "Exact parameter types for each instruction"
  }
}
```

---

## 🔧 Integration Steps (When IDL Ready)

### Step 1: Setup Anchor SDK (5 min)

```bash
cd app
npm install @project-serum/anchor @solana/spl-token
npm install --save-dev @types/bn.js
```

### Step 2: Place IDL Files (1 min)

Copy from your contract build:
```
app/idl/
├── vb_desk.json          # From: programs/vb_desk/target/idl/vb_desk.json
└── types.ts              # Generated: npx anchor idl parse ...
```

### Step 3: Create Program Client (10 min)

**File**: `app/lib/program.ts`

```typescript
import { Program, AnchorProvider } from '@project-serum/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import IDL from '@/idl/vb_desk.json';

const PROGRAM_ID = new PublicKey('YOUR_PROGRAM_ID_HERE');

export const getProgram = (connection: Connection, provider?: AnchorProvider) => {
  return new Program(IDL as any, PROGRAM_ID, provider);
};

// PDA helpers
export const getPDAs = (auctionId: string, bidderPubkey?: PublicKey) => {
  const auctionPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('auction'), Buffer.from(auctionId)],
    PROGRAM_ID
  );
  
  const bidPDA = bidderPubkey ? PublicKey.findProgramAddressSync(
    [Buffer.from('bid'), Buffer.from(auctionId), bidderPubkey.toBuffer()],
    PROGRAM_ID
  ) : null;

  const escrowPDA = PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), Buffer.from(auctionId)],
    PROGRAM_ID
  );

  return { auctionPDA, bidPDA, escrowPDA };
};
```

### Step 4: Wire useAuction Hook (30 min)

**File**: `app/hooks/useAuction.ts` (update)

Replace the mock implementations:

```typescript
import { useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program } from '@project-serum/anchor';
import { getProgram, getPDAs } from '@/lib/program';

export const useAuction = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Get program instance
  const getAnchorProgram = useCallback(() => {
    if (!wallet.publicKey) throw new Error('Wallet not connected');
    const provider = new AnchorProvider(connection, wallet as any, {
      commitment: 'processed',
    });
    return getProgram(connection, provider);
  }, [connection, wallet]);

  // Place sealed bid
  const placeBid = useCallback(
    async (auctionId: string, hashedBid: string, amount: number): Promise<string> => {
      const program = getAnchorProgram();
      const { bidPDA, escrowPDA } = getPDAs(auctionId, wallet.publicKey!);

      const tx = await program.methods
        .submitBid(auctionId, hashedBid, new BN(amount * 1e9))
        .accounts({
          bidAccount: bidPDA[0],
          escrow: escrowPDA[0],
          bidder: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [getAnchorProgram, wallet.publicKey]
  );

  // Reveal bid
  const revealBid = useCallback(
    async (auctionId: string, amount: number, nonce: string): Promise<string> => {
      const program = getAnchorProgram();
      const { bidPDA } = getPDAs(auctionId, wallet.publicKey!);

      const tx = await program.methods
        .revealBid(auctionId, new BN(amount * 1e9), nonce)
        .accounts({
          bidAccount: bidPDA[0],
          bidder: wallet.publicKey,
        })
        .rpc();

      return tx;
    },
    [getAnchorProgram, wallet.publicKey]
  );

  // Create auction
  const createAuction = useCallback(
    async (
      title: string,
      description: string,
      startingBid: number,
      durationHours: number
    ): Promise<string> => {
      const program = getAnchorProgram();
      const auctionId = Date.now().toString(); // or use incrementing ID from contract
      const { auctionPDA, escrowPDA } = getPDAs(auctionId);

      const tx = await program.methods
        .createAuction(title, description, new BN(startingBid * 1e9), durationHours)
        .accounts({
          auction: auctionPDA[0],
          escrow: escrowPDA[0],
          seller: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return tx;
    },
    [getAnchorProgram, wallet.publicKey]
  );

  // Fetch auctions
  const getAuctions = useCallback(async () => {
    const program = getAnchorProgram();
    const auctions = await program.account.auction.all();
    return auctions.map((a) => ({
      id: a.account.auctionId,
      title: a.account.title,
      description: a.account.description,
      // ... map remaining fields
    }));
  }, [getAnchorProgram]);

  // ... similar for other methods
};
```

### Step 5: Update Components (15 min)

**BidForm.tsx**: Hook into real contract calls
```typescript
import { useAuction } from '@/hooks/useAuction';
import { generateBidHash } from '@/utils/crypto';

export function BidForm({ auctionId }: { auctionId: string }) {
  const { placeBid, loading, error } = useAuction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate bid hash locally
    const hashedBid = generateBidHash(bidAmount, nonce);
    
    // Submit to contract
    const tx = await placeBid(auctionId, hashedBid, parseFloat(bidAmount));
    
    // Show success
    setMessage(`✅ Bid submitted: ${tx.slice(0, 8)}...`);
  };
  
  // ... rest of form
}
```

### Step 6: Test Locally (30 min)

```bash
# Start dev server
npm run dev

# Test workflow:
# 1. Connect Phantom wallet (devnet)
# 2. Create auction
# 3. Place bid with nonce
# 4. Reveal bid
# 5. Check transaction on explorer
```

---

## 🎯 Key Integration Points

### Hash Commitment (Sealed Bid Protocol)

1. **Frontend** generates hash client-side:
   ```typescript
   hash = SHA256(amount || nonce)
   ```

2. **Submit phase** sends only hash to contract:
   ```typescript
   submitBid(auctionId, hash, deposit)
   ```

3. **Reveal phase** proves knowledge of amount:
   ```typescript
   revealBid(auctionId, amount, nonce)
   // Contract verifies: SHA256(amount || nonce) == stored_hash
   ```

### PDA Structure

Matches your contract spec:
- `[auction]` → Auction state (title, reserve, deadline, highest_bid)
- `[bid, auctionId, bidder]` → Individual bid (hash, revealed_amount, nonce)
- `[escrow, auctionId]` → SPL token vault (holds deposits)

### Deposit & Settlement

Per your spec:
- Bidder sends fixed amount (equal to others)
- Non-revealer loses deposit → goes to seller
- Settlement: anyone can call (permissionless)
- Tie-breaker: first bid submitted wins

---

## 📊 Testing Checklist

Once integrated:

- [ ] **Create auction** → Check explorer, verify PDA created
- [ ] **Place bid** → Hash stored, deposit transferred
- [ ] **Reveal bid** → Amount verified, state updated
- [ ] **Settlement** → Winner determined, deposits handled correctly
- [ ] **Edge cases**:
  - [ ] No bids → Auction cancelled, seller refunded
  - [ ] Non-revealer → Loses deposit (goes to seller)
  - [ ] Tie → First bidder wins
  - [ ] Reserve not met → Auction cancelled

---

## 🚀 Deployment Path

### Local Development
1. Use devnet RPC
2. Test with Phantom (connected to devnet)
3. Use explorer: https://explorer.solana.com/?cluster=devnet

### Frontend Deployment
1. Deploy to Cloudflare Pages (already configured)
2. Set env var: `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com`

### Contract Deployment
Once tested:
1. Deploy contract to devnet
2. Update PROGRAM_ID in `app/lib/program.ts`
3. Redeploy frontend
4. Done!

---

## ⏱ Timeline

- **When you provide IDL**: Start integration
- **Hour 1**: Setup + Program client
- **Hour 2**: Wire useAuction + Components
- **Hour 3**: Local testing
- **Hour 4**: Fix bugs + polish

**Total**: 4 hours to working MVP

---

## 📝 IDL Format Expected

Your IDL should look like:
```json
{
  "version": "0.1.0",
  "name": "vb_desk",
  "instructions": [
    {
      "name": "createAuction",
      "accounts": [...],
      "args": [
        { "name": "auctionId", "type": "string" },
        { "name": "title", "type": "string" },
        ...
      ]
    },
    {
      "name": "submitBid",
      "accounts": [...],
      "args": [
        { "name": "auctionId", "type": "string" },
        { "name": "hashedBid", "type": "string" },
        { "name": "amount", "type": "u64" }
      ]
    },
    ...
  ],
  "accounts": [
    {
      "name": "Auction",
      "type": { "kind": "struct", "fields": [...] }
    },
    ...
  ]
}
```

---

## 🆘 When IDL Arrives

Just:
1. Paste the JSON at `app/idl/vb_desk.json`
2. Update PROGRAM_ID in `app/lib/program.ts`
3. I'll wire the rest in under 2 hours

**You**: Provide IDL  
**Me**: Integrate + test  
**Result**: Working MVP by end of day

---

**Ready. Waiting for IDL. 🚀**
