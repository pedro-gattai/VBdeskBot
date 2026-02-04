/**
 * VB Desk Client Example
 * 
 * Demonstrates how to interact with the sealed-bid auction program
 * Includes commitment generation, bid placement, and reveal logic
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { createHash, randomBytes } from "crypto";
import { VbDesk } from "./target/types/vb_desk";

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a commitment hash for a sealed bid
 * @param price Bid amount in lamports
 * @param salt Random 32 bytes for privacy
 * @returns 32-byte commitment hash
 */
function generateCommitment(price: anchor.BN, salt: Buffer): Buffer {
  // Commitment = SHA256(price || salt)
  const priceBytes = Buffer.allocUnsafe(8);
  priceBytes.writeBigUInt64LE(BigInt(price.toString()));
  
  const data = Buffer.concat([priceBytes, salt]);
  return createHash('sha256').update(data).digest();
}

/**
 * Generate random salt for bid privacy
 * @returns 32 random bytes
 */
function generateSalt(): Buffer {
  return randomBytes(32);
}

/**
 * Convert Buffer to number array for Anchor
 */
function bufferToArray(buf: Buffer): number[] {
  return Array.from(buf);
}

// ============================================
// PDA Derivation Functions
// ============================================

async function getAuctionPDA(
  program: Program<VbDesk>,
  seller: PublicKey,
  tokenMint: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("auction"),
      seller.toBuffer(),
      tokenMint.toBuffer()
    ],
    program.programId
  );
}

async function getBidPDA(
  program: Program<VbDesk>,
  auction: PublicKey,
  bidder: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("bid"),
      auction.toBuffer(),
      bidder.toBuffer()
    ],
    program.programId
  );
}

async function getEscrowPDA(
  program: Program<VbDesk>,
  auction: PublicKey
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("escrow"),
      auction.toBuffer()
    ],
    program.programId
  );
}

// ============================================
// Main Client Functions
// ============================================

export class VBDeskClient {
  constructor(
    private program: Program<VbDesk>,
    private provider: anchor.AnchorProvider
  ) {}

  /**
   * Create a new OTC auction
   */
  async createAuction(
    seller: Keypair,
    tokenMint: PublicKey,
    amount: number,
    minPrice: number,
    commitEndTime: number,
    revealEndTime: number
  ): Promise<PublicKey> {
    const [auctionPDA] = await getAuctionPDA(
      this.program,
      seller.publicKey,
      tokenMint
    );

    const [escrowPDA] = await getEscrowPDA(this.program, auctionPDA);

    const sellerTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      seller.publicKey
    );

    const tx = await this.program.methods
      .createAuction(
        new anchor.BN(amount),
        new anchor.BN(minPrice),
        new anchor.BN(commitEndTime),
        new anchor.BN(revealEndTime)
      )
      .accounts({
        auction: auctionPDA,
        seller: seller.publicKey,
        tokenMint: tokenMint,
        sellerTokenAccount: sellerTokenAccount,
        escrowTokenAccount: escrowPDA,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([seller])
      .rpc();

    console.log("✅ Auction created:", auctionPDA.toBase58());
    console.log("📝 Transaction:", tx);

    return auctionPDA;
  }

  /**
   * Place a sealed bid
   * Returns salt - CRITICAL: Bidder must save this to reveal later!
   */
  async placeBid(
    bidder: Keypair,
    auctionPDA: PublicKey,
    bidAmount: number
  ): Promise<{ bidPDA: PublicKey; salt: Buffer; commitment: Buffer }> {
    // Generate random salt (MUST BE SAVED!)
    const salt = generateSalt();
    
    // Generate commitment
    const commitment = generateCommitment(new anchor.BN(bidAmount), salt);

    const [bidPDA] = await getBidPDA(
      this.program,
      auctionPDA,
      bidder.publicKey
    );

    const tx = await this.program.methods
      .placeBid(
        bufferToArray(commitment),
        new anchor.BN(bidAmount)
      )
      .accounts({
        auction: auctionPDA,
        bid: bidPDA,
        bidder: bidder.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([bidder])
      .rpc();

    console.log("✅ Bid placed:", bidPDA.toBase58());
    console.log("🔒 Commitment:", commitment.toString('hex'));
    console.log("⚠️  SAVE THIS SALT:", salt.toString('hex'));
    console.log("📝 Transaction:", tx);

    return { bidPDA, salt, commitment };
  }

  /**
   * Reveal a previously committed bid
   */
  async revealBid(
    bidder: Keypair,
    auctionPDA: PublicKey,
    price: number,
    salt: Buffer
  ): Promise<void> {
    const [bidPDA] = await getBidPDA(
      this.program,
      auctionPDA,
      bidder.publicKey
    );

    const tx = await this.program.methods
      .revealBid(
        new anchor.BN(price),
        bufferToArray(salt)
      )
      .accounts({
        auction: auctionPDA,
        bid: bidPDA,
        bidder: bidder.publicKey,
      })
      .signers([bidder])
      .rpc();

    console.log("✅ Bid revealed");
    console.log("💰 Price:", price, "lamports");
    console.log("📝 Transaction:", tx);
  }

  /**
   * Finalize the auction (anyone can call)
   */
  async finalizeAuction(auctionPDA: PublicKey): Promise<void> {
    const tx = await this.program.methods
      .finalizeAuction()
      .accounts({
        auction: auctionPDA,
      })
      .rpc();

    console.log("✅ Auction finalized");
    console.log("📝 Transaction:", tx);
  }

  /**
   * Complete trade (transfer tokens and SOL)
   */
  async completeTrade(
    auctionPDA: PublicKey,
    winningBidPDA: PublicKey,
    winnerTokenAccount: PublicKey,
    sellerPubkey: PublicKey
  ): Promise<void> {
    const [escrowPDA] = await getEscrowPDA(this.program, auctionPDA);

    const tx = await this.program.methods
      .completeTrade()
      .accounts({
        auction: auctionPDA,
        winningBid: winningBidPDA,
        escrowTokenAccount: escrowPDA,
        winnerTokenAccount: winnerTokenAccount,
        seller: sellerPubkey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✅ Trade completed");
    console.log("📝 Transaction:", tx);
  }

  /**
   * Withdraw a losing bid
   */
  async withdrawBid(
    bidder: Keypair,
    auctionPDA: PublicKey
  ): Promise<void> {
    const [bidPDA] = await getBidPDA(
      this.program,
      auctionPDA,
      bidder.publicKey
    );

    const tx = await this.program.methods
      .withdrawBid()
      .accounts({
        auction: auctionPDA,
        bid: bidPDA,
        bidder: bidder.publicKey,
      })
      .signers([bidder])
      .rpc();

    console.log("✅ Bid withdrawn");
    console.log("📝 Transaction:", tx);
  }

  /**
   * Cancel an auction
   */
  async cancelAuction(
    seller: Keypair,
    auctionPDA: PublicKey,
    tokenMint: PublicKey
  ): Promise<void> {
    const [escrowPDA] = await getEscrowPDA(this.program, auctionPDA);

    const sellerTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      seller.publicKey
    );

    const tx = await this.program.methods
      .cancelAuction()
      .accounts({
        auction: auctionPDA,
        seller: seller.publicKey,
        escrowTokenAccount: escrowPDA,
        sellerTokenAccount: sellerTokenAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([seller])
      .rpc();

    console.log("✅ Auction cancelled");
    console.log("📝 Transaction:", tx);
  }

  /**
   * Fetch auction data
   */
  async getAuction(auctionPDA: PublicKey) {
    return await this.program.account.auction.fetch(auctionPDA);
  }

  /**
   * Fetch bid data
   */
  async getBid(bidPDA: PublicKey) {
    return await this.program.account.bid.fetch(bidPDA);
  }

  /**
   * Find all bids for an auction (off-chain analysis)
   */
  async getAllBids(auctionPDA: PublicKey) {
    const bids = await this.program.account.bid.all([
      {
        memcmp: {
          offset: 8, // After discriminator
          bytes: auctionPDA.toBase58(),
        }
      }
    ]);

    return bids;
  }

  /**
   * Find the winning bid (highest revealed price >= min_price)
   */
  async findWinningBid(auctionPDA: PublicKey): Promise<PublicKey | null> {
    const auction = await this.getAuction(auctionPDA);
    const allBids = await this.getAllBids(auctionPDA);

    let winningBid: { pubkey: PublicKey; price: number } | null = null;

    for (const bidAccount of allBids) {
      const bid = bidAccount.account;
      
      // Only consider revealed bids
      if (bid.revealedPrice) {
        const price = bid.revealedPrice.toNumber();
        
        // Must meet minimum price
        if (price >= auction.minPrice.toNumber()) {
          if (!winningBid || price > winningBid.price) {
            winningBid = { pubkey: bidAccount.publicKey, price };
          }
        }
      }
    }

    if (winningBid) {
      console.log("🏆 Winner:", winningBid.pubkey.toBase58());
      console.log("💰 Winning price:", winningBid.price);
      return winningBid.pubkey;
    }

    console.log("❌ No valid winning bid found");
    return null;
  }
}

// ============================================
// Example Usage
// ============================================

async function example() {
  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.VbDesk as Program<VbDesk>;
  const client = new VBDeskClient(program, provider);

  // Participants
  const seller = Keypair.generate();
  const bidder1 = Keypair.generate();
  const bidder2 = Keypair.generate();
  
  // Airdrop SOL for testing
  await provider.connection.requestAirdrop(seller.publicKey, 5_000_000_000);
  await provider.connection.requestAirdrop(bidder1.publicKey, 5_000_000_000);
  await provider.connection.requestAirdrop(bidder2.publicKey, 5_000_000_000);

  // Assume you have a token mint
  const tokenMint = new PublicKey("YOUR_TOKEN_MINT_HERE");

  // Timeframes
  const now = Math.floor(Date.now() / 1000);
  const commitEnd = now + 3600; // 1 hour from now
  const revealEnd = commitEnd + 3600; // 1 hour after commit

  // 1. Create auction
  console.log("\n📢 Creating auction...");
  const auctionPDA = await client.createAuction(
    seller,
    tokenMint,
    1000, // amount
    50_000_000, // min price (0.05 SOL)
    commitEnd,
    revealEnd
  );

  // 2. Place sealed bids
  console.log("\n🔒 Placing sealed bids...");
  const { salt: salt1 } = await client.placeBid(
    bidder1,
    auctionPDA,
    60_000_000 // 0.06 SOL
  );

  const { salt: salt2 } = await client.placeBid(
    bidder2,
    auctionPDA,
    75_000_000 // 0.075 SOL
  );

  // CRITICAL: In production, bidders must save their salt!
  // Store in database, local storage, etc.
  console.log("\n⚠️  Bidders MUST save their salt values!");

  // 3. Wait for commit period to end...
  console.log("\n⏳ Waiting for commit period to end...");
  // In production, wait for actual time

  // 4. Reveal bids
  console.log("\n🔓 Revealing bids...");
  await client.revealBid(bidder1, auctionPDA, 60_000_000, salt1);
  await client.revealBid(bidder2, auctionPDA, 75_000_000, salt2);

  // 5. Wait for reveal period to end...
  console.log("\n⏳ Waiting for reveal period to end...");

  // 6. Finalize auction
  console.log("\n🎯 Finalizing auction...");
  await client.finalizeAuction(auctionPDA);

  // 7. Find winner
  console.log("\n🔍 Finding winner...");
  const winningBidPDA = await client.findWinningBid(auctionPDA);

  if (winningBidPDA) {
    // 8. Complete trade
    console.log("\n💱 Completing trade...");
    const winnerBid = await client.getBid(winningBidPDA);
    const winnerTokenAccount = await getAssociatedTokenAddress(
      tokenMint,
      winnerBid.bidder
    );

    await client.completeTrade(
      auctionPDA,
      winningBidPDA,
      winnerTokenAccount,
      seller.publicKey
    );

    // 9. Loser withdraws
    console.log("\n💸 Loser withdrawing bid...");
    const loser = winnerBid.bidder.equals(bidder1.publicKey) ? bidder2 : bidder1;
    await client.withdrawBid(loser, auctionPDA);
  }

  console.log("\n✅ Auction complete!");
}

// Run if called directly
if (require.main === module) {
  example().catch(console.error);
}

export { generateCommitment, generateSalt, bufferToArray };
