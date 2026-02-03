# VB Desk Unit & Integration Tests

Tests for the sealed-bid auction smart contract.

## Test Cases (To Implement)

### Unit Tests
- [x] Skeleton created
- [ ] CreateAuction: Valid auction creation
- [ ] SubmitBid: Deposit locking works
- [ ] SubmitBid: Cannot submit same bidder twice
- [ ] RevealBid: Commitment verification (valid)
- [ ] RevealBid: Commitment verification (invalid) → AuctionError::InvalidCommitment
- [ ] RevealBid: Highest bid tracking
- [ ] RevealBid: Tie-breaking (first bidder wins)
- [ ] SettleAuction: Permissionless execution
- [ ] SettleAuction: Reserve met → transfer to seller
- [ ] SettleAuction: Reserve not met → cancel auction
- [ ] ClaimDeposit: Winner refund calculation
- [ ] ClaimDeposit: Loser refund (full)
- [ ] ClaimDeposit: Non-revealer (forfeits deposit)
- [ ] ClaimDeposit: Cannot claim twice

### Integration Tests
- [ ] Full auction flow (5 bidders, 3 reveals, settlement, refunds)
- [ ] Tie scenario (2 bids same amount, first wins)
- [ ] Reserve price failure (all deposits refunded)
- [ ] Auction expired without settlement (can still settle)

## Running Tests
```bash
anchor test
```
