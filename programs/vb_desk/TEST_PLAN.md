# VB Desk Test Plan

Comprehensive test coverage for the sealed-bid auction smart contract.

## Test Environment Setup

```bash
# Prerequisites
anchor --version  # 0.29.0+
solana --version  # 1.17+

# Setup
solana-test-validator &  # Local validator
anchor test              # Run all tests
```

## Unit Tests

### 1. Auction Creation

#### Test: `test_create_auction_success`
```typescript
✓ Create auction with valid parameters
✓ Verify auction state initialized correctly
✓ Verify tokens transferred to escrow
✓ Verify AuctionCreated event emitted
```

#### Test: `test_create_auction_invalid_deadlines`
```typescript
✗ Commit deadline in past → InvalidDeadline
✗ Reveal deadline before commit → InvalidDeadline
✗ Reveal deadline in past → InvalidDeadline
```

#### Test: `test_create_auction_invalid_amounts`
```typescript
✗ Zero token amount → InvalidAmount
✗ Zero min price → InvalidPrice
```

### 2. Place Bid

#### Test: `test_place_bid_success`
```typescript
✓ Place bid with valid commitment
✓ Verify bid state initialized
✓ Verify SOL transferred to bid PDA
✓ Verify BidPlaced event emitted
```

#### Test: `test_place_bid_before_auction`
```typescript
✓ Multiple bidders can place bids
✓ Each bidder creates separate bid PDA
```

#### Test: `test_place_bid_timing_checks`
```typescript
✗ Bid after commit_end_time → CommitPeriodEnded
✗ Bid on cancelled auction → AuctionNotActive
```

#### Test: `test_place_bid_below_minimum`
```typescript
✗ Bid amount < min_price → BidBelowMinimum
```

### 3. Reveal Bid

#### Test: `test_reveal_bid_success`
```typescript
✓ Reveal with correct price and salt
✓ Verify revealed_price set correctly
✓ Verify BidRevealed event emitted
```

#### Test: `test_reveal_bid_timing`
```typescript
✗ Reveal before commit_end_time → CommitPeriodNotEnded
✗ Reveal after reveal_end_time → RevealPeriodEnded
```

#### Test: `test_reveal_bid_invalid_commitment`
```typescript
✗ Wrong price → InvalidReveal
✗ Wrong salt → InvalidReveal
✗ Tampered commitment → InvalidReveal
```

#### Test: `test_reveal_bid_deposit_mismatch`
```typescript
✗ Deposited amount ≠ revealed price → DepositMismatch
```

#### Test: `test_reveal_bid_already_revealed`
```typescript
✗ Reveal same bid twice → AlreadyRevealed
```

### 4. Finalize Auction

#### Test: `test_finalize_success`
```typescript
✓ Finalize after reveal period ends
✓ Verify status → Finalized
✓ Verify AuctionFinalized event
```

#### Test: `test_finalize_timing`
```typescript
✗ Finalize before reveal_end_time → RevealPeriodNotEnded
✗ Finalize cancelled auction → AuctionNotActive
```

### 5. Complete Trade

#### Test: `test_complete_trade_success`
```typescript
✓ Complete with highest revealed bid
✓ Verify tokens: escrow → winner
✓ Verify SOL: winning bid → seller
✓ Verify status → Completed
✓ Verify TradeCompleted event
```

#### Test: `test_complete_trade_checks`
```typescript
✗ Complete before finalized → AuctionNotFinalized
✗ Complete with unrevealed bid → BidNotRevealed
✗ Complete with bid below min_price → BidBelowMinimum
```

### 6. Withdraw Bid

#### Test: `test_withdraw_losing_bid`
```typescript
✓ Non-winner withdraws after completion
✓ Verify SOL returned to bidder
✓ Verify BidWithdrawn event
```

#### Test: `test_withdraw_checks`
```typescript
✗ Withdraw before auction complete → AuctionNotFinished
✗ Withdraw winning bid → CannotWithdrawWinningBid
```

### 7. Cancel Auction

#### Test: `test_cancel_before_commit`
```typescript
✓ Seller cancels before commit_end_time
✓ Verify tokens returned to seller
✓ Verify status → Cancelled
✓ Verify AuctionCancelled event
```

#### Test: `test_cancel_after_reveal_no_bids`
```typescript
✓ Cancel after reveal_end_time with no valid bids
✓ Verify tokens returned
```

#### Test: `test_cancel_checks`
```typescript
✗ Non-seller tries to cancel → Unauthorized
✗ Cancel during commit period with bids → CannotCancel
✗ Cancel during reveal period → CannotCancel
✗ Cancel after valid bids exist → CannotCancel
```

## Integration Tests

### Scenario 1: Successful Auction (Happy Path)

```typescript
describe("Full Auction Flow", () => {
  it("should complete end-to-end auction", async () => {
    // 1. Seller creates auction
    const auction = await createAuction({
      amount: 1000,
      minPrice: 50_000_000,
      commitEnd: now + 3600,
      revealEnd: now + 7200
    });

    // 2. Multiple bidders place sealed bids
    const bidder1Salt = generateSalt();
    const bid1 = await placeBid(bidder1, {
      auction,
      price: 60_000_000,
      salt: bidder1Salt
    });

    const bidder2Salt = generateSalt();
    const bid2 = await placeBid(bidder2, {
      auction,
      price: 75_000_000,
      salt: bidder2Salt
    });

    const bidder3Salt = generateSalt();
    const bid3 = await placeBid(bidder3, {
      auction,
      price: 55_000_000,
      salt: bidder3Salt
    });

    // 3. Advance time to reveal period
    await advanceTime(3601);

    // 4. Bidders reveal
    await revealBid(bidder1, { price: 60_000_000, salt: bidder1Salt });
    await revealBid(bidder2, { price: 75_000_000, salt: bidder2Salt });
    await revealBid(bidder3, { price: 55_000_000, salt: bidder3Salt });

    // 5. Advance time past reveal period
    await advanceTime(7201);

    // 6. Finalize
    await finalizeAuction(auction);

    // 7. Complete trade with winner (bidder2 - highest bid)
    await completeTrade(auction, bid2);

    // 8. Losers withdraw
    await withdrawBid(bidder1, auction);
    await withdrawBid(bidder3, auction);

    // Verify final state
    const auctionState = await program.account.auction.fetch(auction);
    assert.equal(auctionState.status, AuctionStatus.Completed);
    assert.equal(auctionState.winningBid, bid2.publicKey);
  });
});
```

### Scenario 2: No Valid Bids

```typescript
it("should handle auction with no valid bids", async () => {
  // 1. Create auction
  const auction = await createAuction({
    amount: 1000,
    minPrice: 100_000_000,
    commitEnd: now + 1800,
    revealEnd: now + 3600
  });

  // 2. Bidder places bid below minimum
  const bidderSalt = generateSalt();
  await placeBid(bidder1, {
    auction,
    price: 50_000_000, // Below min_price
    salt: bidderSalt
  });

  // 3. Advance to reveal period
  await advanceTime(1801);

  // 4. Bidder reveals (will be valid reveal but invalid bid)
  await revealBid(bidder1, { price: 50_000_000, salt: bidderSalt });

  // 5. Advance past reveal
  await advanceTime(3601);

  // 6. Finalize
  await finalizeAuction(auction);

  // 7. Seller cancels (no valid bids)
  await cancelAuction(seller, auction);

  // 8. Bidder withdraws
  await withdrawBid(bidder1, auction);

  // Verify
  const auctionState = await program.account.auction.fetch(auction);
  assert.equal(auctionState.status, AuctionStatus.Cancelled);
});
```

### Scenario 3: Partial Reveals

```typescript
it("should handle some bidders not revealing", async () => {
  // 1. Create auction
  const auction = await createAuction({
    amount: 1000,
    minPrice: 50_000_000,
    commitEnd: now + 1800,
    revealEnd: now + 3600
  });

  // 2. Three bidders place bids
  const bid1Salt = generateSalt();
  await placeBid(bidder1, { auction, price: 60_000_000, salt: bid1Salt });
  
  const bid2Salt = generateSalt();
  await placeBid(bidder2, { auction, price: 75_000_000, salt: bid2Salt });
  
  const bid3Salt = generateSalt();
  await placeBid(bidder3, { auction, price: 70_000_000, salt: bid3Salt });

  // 3. Advance to reveal period
  await advanceTime(1801);

  // 4. Only bidder1 and bidder2 reveal (bidder3 doesn't)
  await revealBid(bidder1, { price: 60_000_000, salt: bid1Salt });
  await revealBid(bidder2, { price: 75_000_000, salt: bid2Salt });
  // bidder3 never reveals

  // 5. Advance past reveal
  await advanceTime(3601);

  // 6. Finalize and complete with bidder2 (highest revealed)
  await finalizeAuction(auction);
  await completeTrade(auction, bid2);

  // 7. Withdrawals
  await withdrawBid(bidder1, auction); // Loser withdraws
  await withdrawBid(bidder3, auction); // Non-revealer withdraws

  // Verify
  const auctionState = await program.account.auction.fetch(auction);
  assert.equal(auctionState.winningBid, bid2.publicKey);
});
```

## Security Tests

### Attack Vector 1: Front-Running Reveals

```typescript
it("should prevent front-running during reveal period", async () => {
  // Attacker sees revealed bids on-chain
  // Tries to place a higher bid during reveal period
  
  const auction = await createAuction({...});
  const bid1 = await placeBid(bidder1, { price: 60_000_000, ... });
  
  await advanceTime(1801); // Enter reveal period
  await revealBid(bidder1, { price: 60_000_000, ... });
  
  // Attacker tries to place new bid during reveal (should fail)
  await expect(
    placeBid(attacker, { auction, price: 70_000_000, ... })
  ).to.be.rejectedWith(/CommitPeriodEnded/);
});
```

### Attack Vector 2: Commitment Manipulation

```typescript
it("should reject tampered commitments", async () => {
  const auction = await createAuction({...});
  
  const originalPrice = 60_000_000;
  const tamperedPrice = 70_000_000;
  const salt = generateSalt();
  
  // Commit with original price
  const commitment = generateCommitment(originalPrice, salt);
  await placeBid(bidder, { auction, commitment, deposit: originalPrice });
  
  await advanceTime(1801);
  
  // Try to reveal with different price (should fail)
  await expect(
    revealBid(bidder, { price: tamperedPrice, salt })
  ).to.be.rejectedWith(/InvalidReveal/);
});
```

### Attack Vector 3: Deposit Mismatch Exploit

```typescript
it("should prevent bid/deposit mismatch", async () => {
  const auction = await createAuction({...});
  
  const claimedPrice = 100_000_000;
  const actualDeposit = 50_000_000;
  const salt = generateSalt();
  
  const commitment = generateCommitment(claimedPrice, salt);
  
  // Bid claims high price but deposits low amount
  await placeBid(bidder, { 
    auction, 
    commitment, 
    deposit: actualDeposit 
  });
  
  await advanceTime(1801);
  
  // Reveal should fail (deposited ≠ revealed)
  await expect(
    revealBid(bidder, { price: claimedPrice, salt })
  ).to.be.rejectedWith(/DepositMismatch/);
});
```

### Attack Vector 4: Seller Cancellation Abuse

```typescript
it("should prevent seller from canceling with active bids", async () => {
  const auction = await createAuction({...});
  await placeBid(bidder, { auction, price: 60_000_000, ... });
  
  // Seller tries to cancel during commit period (should fail)
  await expect(
    cancelAuction(seller, auction)
  ).to.be.rejectedWith(/CannotCancel/);
  
  await advanceTime(1801); // Enter reveal period
  
  // Still can't cancel during reveal
  await expect(
    cancelAuction(seller, auction)
  ).to.be.rejectedWith(/CannotCancel/);
});
```

## Fuzzing Tests

### Fuzz Test 1: Random Commitments

```typescript
it("should handle random commitment values", async () => {
  const auction = await createAuction({...});
  
  for (let i = 0; i < 100; i++) {
    const randomCommitment = randomBytes(32);
    const randomDeposit = Math.floor(Math.random() * 1_000_000_000);
    
    try {
      await placeBid(bidder, { 
        auction, 
        commitment: randomCommitment, 
        deposit: randomDeposit 
      });
      
      // If bid succeeds, reveal should fail (invalid commitment)
      await advanceTime(1801);
      await expect(
        revealBid(bidder, { 
          price: randomDeposit, 
          salt: randomBytes(32) 
        })
      ).to.be.rejected;
    } catch (e) {
      // Expected - invalid parameters rejected
    }
  }
});
```

### Fuzz Test 2: Timing Edge Cases

```typescript
it("should handle edge-case timestamps", async () => {
  // Test boundary conditions around deadlines
  const now = Math.floor(Date.now() / 1000);
  
  // Exactly at commit deadline
  const auction = await createAuction({
    commitEnd: now + 1,
    revealEnd: now + 2,
    ...
  });
  
  await advanceTime(1); // Exactly at commit_end_time
  
  // Should fail (>= deadline)
  await expect(
    placeBid(bidder, { auction, ... })
  ).to.be.rejectedWith(/CommitPeriodEnded/);
});
```

## Performance Tests

### Load Test: Many Concurrent Bids

```typescript
it("should handle 100 concurrent bidders", async () => {
  const auction = await createAuction({...});
  const bidders = Array.from({ length: 100 }, () => Keypair.generate());
  
  // Airdrop SOL to all bidders
  await Promise.all(
    bidders.map(b => airdrop(b.publicKey, 1_000_000_000))
  );
  
  // All place bids concurrently
  await Promise.all(
    bidders.map(b => placeBid(b, { 
      auction, 
      price: Math.random() * 100_000_000 + 50_000_000,
      salt: generateSalt()
    }))
  );
  
  // Verify all bids recorded
  const allBids = await program.account.bid.all([
    { memcmp: { offset: 8, bytes: auction.toBase58() } }
  ]);
  
  assert.equal(allBids.length, 100);
});
```

## Test Coverage Goals

- **Instruction Coverage**: 100% (all 8 instructions tested)
- **Branch Coverage**: >95% (all error paths covered)
- **Security Coverage**: All attack vectors from SECURITY_AUDIT.md tested
- **Integration Coverage**: All user flows covered

## Running Tests

```bash
# Run all tests
anchor test

# Run specific test file
anchor test tests/create-auction.ts

# Run with verbose logging
ANCHOR_LOG=true anchor test

# Run on devnet
anchor test --provider.cluster devnet
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - uses: actions/setup-node@v3
      - run: npm install
      - run: anchor test
```

## Next Steps

1. ✅ Write test specifications (this document)
2. ⏳ Implement unit tests in `tests/vb_desk.ts`
3. ⏳ Implement integration tests
4. ⏳ Implement security tests
5. ⏳ Add fuzzing tests
6. ⏳ Achieve 100% coverage
7. ⏳ Run on CI/CD

---

**Status**: Test plan complete, awaiting build environment for implementation.
