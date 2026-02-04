# VB Desk User Guide

## What is VB Desk?

VB Desk is a **decentralized OTC (over-the-counter) trading platform** using sealed-bid auctions on Solana. Unlike traditional order books where everyone sees your bids, VB Desk hides your bid until the reveal phase, protecting you from front-running and copy-trading.

## Key Features

✅ **Sealed-Bid Auctions** - Bids are hidden via cryptographic commitments (SHA-256)  
✅ **MEV Protection** - No one can see your bid before the reveal window  
✅ **Non-Custodial** - You always control your funds via Solana PDAs  
✅ **Fair Price Discovery** - Winner determined after all bids are locked in  
✅ **Deposit-Based Security** - Bidders commit SOL deposit to discourage spam  

---

## How Sealed-Bid Auctions Work

### Traditional Auction Problem

In a normal auction, everyone sees your bid immediately:
1. You bid 100 USDC for 10 SOL
2. Competitor sees your bid in mempool
3. Competitor bids 101 USDC and wins
4. **You lose due to information asymmetry**

### VB Desk Solution: Commit-Reveal

VB Desk uses a **two-phase auction**:

#### Phase 1: Commit (Bidding Window)
- You submit a **commitment** (SHA-256 hash of your bid + secret salt)
- Nobody can see your actual bid amount
- Multiple bidders submit commitments simultaneously
- All bids are hidden until Phase 2

#### Phase 2: Reveal (After Commit Window Closes)
- Commit window closes (e.g., after 1 hour)
- All bidders reveal their original bids + salts
- Smart contract verifies each reveal matches the original commitment
- Highest valid bid wins
- **Too late for front-running** - all bids are already locked in!

---

## Creating an Auction

### Prerequisites
- Phantom or Solflare wallet with SOL for fees
- Tokens you want to sell (e.g., SOL, USDC)

### Steps

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Approve connection in your wallet

2. **Fill Auction Details**
   - **Selling:** Token you're selling + amount (e.g., 10 SOL)
   - **Buying:** Token you want to receive (e.g., USDC)
   - **Reserve Price:** Minimum acceptable bid (e.g., 1000 USDC)
   - **Commit Duration:** How long bidders can submit bids (e.g., 1 hour)
   - **Reveal Duration:** How long bidders have to reveal (e.g., 30 minutes)
   - **Minimum Deposit:** SOL deposit required from bidders (e.g., 0.1 SOL)

3. **Create Auction**
   - Review details
   - Click "Create Auction"
   - Approve transaction in wallet
   - Auction is now live!

### After Creation

- Share auction link with potential buyers
- Bids will come in during commit phase (hidden)
- After commit phase ends, bidders reveal
- After reveal phase ends, you can settle the auction

---

## Placing a Bid

### Prerequisites
- Phantom or Solflare wallet
- SOL for the required deposit + fees
- Understanding that **you MUST save your nonce** (explained below)

### Steps

1. **Find an Auction**
   - Browse active auctions
   - Click on auction to see details

2. **Enter Your Bid**
   - **Bid Amount:** How much you're willing to pay (e.g., 1050 USDC)
   - **Deposit:** Required SOL deposit (auto-calculated)
   - System generates a random **nonce (salt)** for you

3. **⚠️ CRITICAL: Save Your Nonce**

   ```
   🚨 YOU MUST SAVE THIS NONCE! 🚨
   
   Nonce: a7f3d9e2b8c1f4e6...
   
   Without this nonce, you CANNOT reveal your bid!
   You will LOSE your deposit if you don't reveal!
   
   Save it in:
   ✅ Password manager (1Password, LastPass)
   ✅ Encrypted note
   ✅ Offline backup
   
   DO NOT:
   ❌ Rely on browser storage (can be cleared)
   ❌ Screenshot only (phone can break)
   ❌ Trust your memory
   ```

4. **Submit Commitment**
   - Click "Place Bid"
   - Approve transaction
   - Your bid is now committed (hidden from everyone)

### After Bidding

- Wait for commit phase to end
- **Do not lose your nonce!**
- When reveal phase starts, come back to reveal your bid

---

## Revealing Your Bid

### When to Reveal
- After commit phase ends
- Before reveal phase deadline
- You'll be notified via the UI

### Steps

1. **Navigate to Auction**
   - Go to "My Bids"
   - Find the auction you bid on

2. **Enter Reveal Details**
   - **Original Bid Amount:** The amount you bid (e.g., 1050 USDC)
   - **Nonce:** The secret nonce you saved earlier

3. **Reveal**
   - Click "Reveal Bid"
   - Approve transaction
   - Smart contract verifies your reveal matches your commitment

### If You Win
- After reveal phase ends, you can claim your tokens
- Pay the bid amount, receive the auctioned tokens
- Get your deposit back

### If You Lose
- After reveal phase ends, claim your deposit refund
- No penalty for losing (you get your deposit back)

### If You Don't Reveal
- **You forfeit your deposit** as penalty
- This prevents griefing attacks (fake bids)

---

## Settling an Auction (Seller)

After the reveal phase ends:

1. **Navigate to Your Auction**
   - Go to "My Auctions"
   - Click on the completed auction

2. **View Results**
   - See all revealed bids
   - Highest valid bid is highlighted

3. **Complete Trade**
   - Click "Complete Trade"
   - Highest bidder's payment is transferred to you
   - Your tokens are transferred to winner
   - Transaction is final

---

## Security Best Practices

### Protect Your Nonce
- **Never share your nonce** with anyone
- Store it securely (password manager recommended)
- Back it up in multiple places
- Without it, you cannot reveal and **will lose your deposit**

### Verify Auction Details
- Check seller's reputation (if available via AgentList integration)
- Verify token contract addresses
- Confirm reserve price is reasonable
- Check commit/reveal durations

### Deposit Management
- Only bid on auctions where you can afford to lose the deposit
- If unsure about revealing, don't bid
- Deposits are returned to non-winners who reveal properly

### Transaction Safety
- Always review transactions in your wallet before approving
- Confirm you're interacting with the official VB Desk program
- Check Solana Explorer for transaction details

---

## FAQ

### What happens if I forget my nonce?
**You cannot reveal your bid and will forfeit your deposit.** There is no recovery mechanism - this is by design to prevent griefing attacks.

### Can I cancel my bid after committing?
**No.** Once you commit a bid, you must either:
1. Reveal it (get your deposit back whether you win or lose)
2. Don't reveal (forfeit deposit)

### What if nobody reveals their bids?
The auction fails, and the seller can cancel it. All deposits are forfeited by non-revealing bidders.

### Can the seller see my bid during commit phase?
**No.** The seller only sees a cryptographic hash (SHA-256 commitment). Your bid amount is completely hidden until you reveal it.

### What prevents the seller from front-running after reveals?
By the time reveals happen, **all bids are already locked in** on-chain. The seller cannot change the auction or place a last-minute bid.

### How is the winner determined in case of a tie?
The **first revealed bid** (by timestamp) wins. This incentivizes early revealing once the reveal phase starts.

### Can I bid multiple times on the same auction?
**Yes**, but each bid requires its own deposit. You must reveal all your bids or forfeit all deposits.

### What tokens are supported?
Currently, VB Desk supports:
- SOL
- USDC
- USDT
- Any SPL token (via custom input)

---

## Troubleshooting

### "Transaction failed: insufficient funds"
- Ensure you have enough SOL for:
  1. Bid deposit
  2. Transaction fees (~0.00005 SOL)
  3. Rent exemption for accounts

### "Commitment verification failed"
- Double-check your bid amount and nonce
- Make sure you're entering the **exact** values from your original bid
- Nonce is case-sensitive

### "Auction already finalized"
- You missed the reveal deadline
- Your deposit is forfeited
- Set calendar reminders for future auctions

### "Invalid PDA derivation"
- Clear your browser cache
- Refresh the page
- Try a different RPC endpoint (Settings menu)

---

## Support

- **Discord:** [Join VB Desk Discord](#)
- **GitHub Issues:** [Report bugs](https://github.com/pedro-gattai/VBdeskBot/issues)
- **Email:** support@vbdesk.xyz (if available)

---

## Legal Disclaimer

VB Desk is experimental software. Use at your own risk. Always:
- Test with small amounts first
- Verify smart contract code
- Understand the risks of sealed-bid auctions
- Never bid more than you can afford to lose

**You are responsible for:**
- Keeping your wallet secure
- Saving your nonces
- Understanding auction mechanics
- Transaction fees and deposits

No warranties are provided. See LICENSE for full terms.
