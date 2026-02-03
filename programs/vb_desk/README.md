# VB Desk - Sealed-Bid Auction Smart Contract

## Overview
A sealed-bid auction system on Solana (Devnet) using the Anchor framework. Implements cryptographic commitments to hide bids until reveal phase.

## Spec (LOCKED)
- **5 Instructions**: `create_auction`, `submit_bid`, `reveal_bid`, `settle_auction`, `claim_deposit`
- **Sealed-bid**: Bids hidden with SHA-256 commitments
- **Commitment**: `SHA256(amount || nonce || bidder_address)`
- **Deposit**: Fixed + equal amount for privacy
- **Settlement**: Permissionless (anyone can settle)
- **Tie-breaker**: First bid submitted wins
- **Non-revealer**: Loses deposit (goes to seller)
- **Reserve failure**: Auction cancelled, deposits refunded
- **PDAs**: `["auction", auction_id]`, `["bid", auction_id, bidder]`, `["escrow", auction_id]`

## Project Structure
```
vb-desk/
├── programs/vb-desk/          # Smart contract (Anchor/Rust)
│   └── src/lib.rs             # Main contract logic
├── app/                        # (Frontend placeholder)
├── tests/                      # Unit tests
├── docs/                       # Documentation
├── scripts/                    # Deployment scripts
└── Anchor.toml                # Anchor configuration
```

## Build
```bash
cd vb-desk
anchor build
```

## Test
```bash
anchor test
```

## Deploy (Devnet)
```bash
anchor deploy
```

## Timeline
- **Day 1 (2h)**: Project init + skeleton ✅
- **Days 2-3**: Full instruction logic + unit tests
- **Day 4**: Bug fixes + final review
- **Deadline**: Feb 12, 12:00 PM EST (hard stop)

## Progress
- [x] Anchor project scaffolded
- [x] GitHub repo structure created
- [x] PDA structs defined (Auction, Bid)
- [x] 5 instruction skeletons completed
- [ ] Full logic implementation
- [ ] Unit tests
- [ ] Integration tests
