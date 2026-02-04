# VB Desk - Sealed-Bid Auction Smart Contract

A trustless OTC trading platform on Solana using sealed-bid auctions for fair price discovery.

## 🏗️ Architecture

### Core Accounts

#### Auction
- **PDA Seeds**: `["auction", seller_pubkey, token_mint]`
- **Purpose**: Main auction state, holds configuration and status
- **Key Fields**:
  - `seller`: Auction creator
  - `token_mint`: SPL token being sold
  - `amount`: Number of tokens
  - `min_price`: Minimum acceptable bid (lamports)
  - `commit_end_time`: Deadline for placing bids
  - `reveal_end_time`: Deadline for revealing bids
  - `status`: Active | Finalized | Completed | Cancelled
  - `winning_bid`: Reference to winning bid (if any)

#### Bid
- **PDA Seeds**: `["bid", auction_pubkey, bidder_pubkey]`
- **Purpose**: Stores individual sealed bids
- **Key Fields**:
  - `commitment`: Hash of (price || salt) for privacy
  - `revealed_price`: Actual bid price (revealed later)
  - `deposited_amount`: SOL locked as proof of funds

#### Escrow Token Account
- **PDA Seeds**: `["escrow", auction_pubkey]`
- **Purpose**: Holds seller's tokens during auction
- **Authority**: Auction PDA

## 🔄 Auction Flow

### Phase 1: Creation
```
Seller → create_auction(amount, min_price, deadlines)
  ├─ Tokens transferred to escrow
  └─ Auction state initialized
```

### Phase 2: Commit Period
```
Bidders → place_bid(hash(price || salt), price)
  ├─ Commitment hash stored
  ├─ SOL deposited to Bid PDA
  └─ Bid amount remains private
```

**Privacy**: Only the hash is visible on-chain. No one knows actual bid amounts.

### Phase 3: Reveal Period
```
Bidders → reveal_bid(price, salt)
  ├─ Verify: hash(price || salt) == commitment
  ├─ Verify: deposited_amount == price
  └─ Store revealed_price
```

**Trust**: Math proves bidders committed to this price earlier.

### Phase 4: Finalization
```
Anyone → finalize_auction()
  └─ Marks auction as ready for trade
```

### Phase 5: Settlement
```
Winner → complete_trade()
  ├─ Tokens: escrow → winner
  ├─ SOL: winning bid → seller
  └─ Status → Completed

Losers → withdraw_bid()
  └─ SOL: bid PDA → bidder
```

### Edge Case: Cancellation
```
Seller → cancel_auction()
  ├─ Before commit_end OR
  ├─ After reveal_end with no valid bids
  └─ Tokens returned to seller
```

## 🔒 Security Features

### 1. Commitment Scheme
- **Privacy**: Bid amounts hidden during commit phase
- **Binding**: Cannot change bid after committing
- **Verifiable**: Cryptographic proof via hash verification

### 2. Time-Based Controls
```
Time: ───────────────────────────────────────►
      │  Commit   │  Reveal   │  Finalize
      └───────────┴───────────┴───────────►
      
✓ Bids only during commit period
✓ Reveals only during reveal period  
✓ Finalize only after reveal period
```

### 3. Financial Security
- **Escrow**: Tokens locked in PDA, not custodial wallet
- **Proof of Funds**: SOL deposited must match revealed bid
- **Atomic Settlement**: Winner gets tokens ↔ Seller gets SOL
- **Safe Withdrawals**: Losers can reclaim funds

### 4. Access Controls
- Only seller can cancel
- Only bidder can reveal their own bid
- Winning bid cannot be withdrawn
- Constraints verify account ownership

### 5. State Machine Protection
```
Active → Finalized → Completed
  ↓
Cancelled

✓ Each instruction checks valid state
✓ Prevents replay or out-of-order execution
```

## 📋 Instructions

### `create_auction`
**Who**: Seller  
**When**: Any time  
**Does**: 
- Initialize auction state
- Transfer tokens to escrow
- Set bid deadlines

**Parameters**:
- `amount`: Token quantity
- `min_price`: Minimum bid (lamports)
- `commit_end_time`: Unix timestamp
- `reveal_end_time`: Unix timestamp

### `place_bid`
**Who**: Any bidder  
**When**: Before `commit_end_time`  
**Does**:
- Store commitment hash
- Lock SOL in Bid PDA

**Parameters**:
- `commitment`: sha256(price || salt)
- `bid_amount`: SOL to deposit

**Client-side**:
```javascript
const salt = randomBytes(32);
const data = Buffer.concat([
  Buffer.from(price.toArray('le', 8)),
  salt
]);
const commitment = sha256(data);
```

### `reveal_bid`
**Who**: Bidder who placed this bid  
**When**: Between `commit_end_time` and `reveal_end_time`  
**Does**:
- Verify commitment matches hash(price || salt)
- Verify deposited amount matches price
- Store revealed price

**Parameters**:
- `price`: Actual bid amount
- `salt`: Random 32 bytes from commit phase

### `finalize_auction`
**Who**: Anyone  
**When**: After `reveal_end_time`  
**Does**:
- Change status to Finalized
- Enable trade completion

### `complete_trade`
**Who**: Winner (or anyone with winning bid reference)  
**When**: After finalized  
**Does**:
- Transfer tokens: escrow → winner
- Transfer SOL: winning bid → seller
- Mark auction completed

**Accounts**:
- Must provide the actual winning bid account
- Program verifies it has highest revealed price ≥ min_price

### `withdraw_bid`
**Who**: Non-winning bidder  
**When**: After auction completed/cancelled  
**Does**:
- Return SOL to bidder
- Cannot withdraw winning bid

### `cancel_auction`
**Who**: Seller only  
**When**: Before `commit_end_time` OR after `reveal_end_time` with no valid bids  
**Does**:
- Return tokens to seller
- Mark auction cancelled

## 🎯 Design Decisions

### Why Commit-Reveal?
**Problem**: On-chain bids are public → sniping/manipulation  
**Solution**: Two-phase commitment ensures privacy during bidding

### Why Hash(price || salt)?
- **Price alone**: Vulnerable to dictionary attack (limited price range)
- **Salt alone**: Doesn't bind to price
- **Together**: Cryptographically secure commitment

### Why Deposit Required?
Prevents spam bids and ensures winner can pay. Deposit = revealed price proves solvency.

### Winner Selection
Current implementation requires client to identify winner and provide winning bid account. 

**Future Enhancement**: 
- Store bid count on auction
- Iterate through all bids in `finalize_auction`
- Automatically determine highest valid bid

**Trade-off**: More compute units vs. simplicity

### PDA Design
- **Auction PDA**: Deterministic from seller + token mint (one auction per token per seller)
- **Bid PDA**: Deterministic from auction + bidder (one bid per auction per bidder)
- **Escrow PDA**: Deterministic from auction (owned by auction PDA)

## 🚨 Known Limitations

### 1. Winner Identification
Manual: Client must scan all bids off-chain to find winner.  
**Mitigation**: Add on-chain bid registry or iteration in future version.

### 2. One Bid Per Bidder
Current PDA seeds allow only one bid per auction per bidder.  
**Mitigation**: Add nonce to seeds for multiple bids.

### 3. No Bid Ranking On-Chain
Auction doesn't store sorted bids or runner-up.  
**Mitigation**: Fine for single-winner auctions; could add leaderboard.

### 4. No Partial Fills
Winner must buy entire amount at winning price.  
**Mitigation**: Add quantity parameter to bids for partial matching.

### 5. No Automatic Refunds
Losers must call `withdraw_bid()` themselves.  
**Mitigation**: Acceptable (standard practice), or add sweep function.

## 🛠️ Usage Example

```bash
# 1. Seller creates auction
anchor run create-auction \
  --amount 1000 \
  --min-price 50000000 \
  --commit-end $(($(date +%s) + 3600)) \
  --reveal-end $(($(date +%s) + 7200))

# 2. Bidder places sealed bid
# (Client computes commitment off-chain)
anchor run place-bid \
  --commitment <hash> \
  --bid-amount 60000000

# 3. After commit period, bidder reveals
anchor run reveal-bid \
  --price 60000000 \
  --salt <original_salt>

# 4. After reveal period, finalize
anchor run finalize-auction

# 5. Complete trade with winner
anchor run complete-trade \
  --winning-bid <winner_bid_pubkey>

# 6. Losers withdraw
anchor run withdraw-bid
```

## 🧪 Testing Checklist

- [ ] Create auction with valid parameters
- [ ] Reject auction with invalid deadlines (reveal < commit)
- [ ] Place bid during commit period
- [ ] Reject bid after commit period ends
- [ ] Reject bid below minimum price
- [ ] Reveal bid with correct price + salt
- [ ] Reject reveal with wrong salt (invalid commitment)
- [ ] Reject reveal with mismatched deposit amount
- [ ] Reject reveal before commit period ends
- [ ] Reject reveal after reveal period ends
- [ ] Finalize auction after reveal period
- [ ] Complete trade with valid winning bid
- [ ] Reject complete trade with unrevealed bid
- [ ] Reject complete trade before finalized
- [ ] Withdraw losing bid after completion
- [ ] Reject withdraw of winning bid
- [ ] Cancel auction before commit period
- [ ] Cancel auction after reveal with no bids
- [ ] Reject cancel during commit/reveal with valid bids
- [ ] Reject unauthorized cancellation (non-seller)

## 📚 Further Reading

- [Anchor Book](https://book.anchor-lang.com/)
- [Sealed-Bid Auctions](https://en.wikipedia.org/wiki/Vickrey_auction)
- [Commit-Reveal Schemes](https://en.wikipedia.org/wiki/Commitment_scheme)
- [Solana Program Security](https://docs.solana.com/developing/programming-model/overview)

## 🤝 Contributing

This is the foundational implementation. Potential enhancements:

1. **On-chain winner selection**: Iterate bids in finalize instruction
2. **Bid registry**: Track all bids on auction account
3. **Multiple bids per user**: Add nonce to PDA seeds
4. **Partial fills**: Allow quantity-based matching
5. **Reserve price**: Different from minimum (seller keeps secret)
6. **Automatic refunds**: Sweep function for batch withdrawals
7. **Time extensions**: Anti-sniping (extend if bid in last minute)
8. **Dutch auction variant**: Descending price with commit-reveal

## 📄 License

MIT (or specify your license)
