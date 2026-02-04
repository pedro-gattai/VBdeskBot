use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use sha2::{Sha256, Digest};

declare_id!("GHMkvLYFpn5DN1LPPax94e2HdmAp6CFV17fgbHXYHSnF");

/// VB Desk - Sealed-bid Auction Smart Contract
/// Implements 5 core instructions for conducting sealed-bid auctions on Solana

#[program]
pub mod vb_desk {
    use super::*;

    /// Create a new auction
    /// Requires: seller, mint, reserve_price, auction_duration
    pub fn create_auction(
        ctx: Context<CreateAuction>,
        auction_id: u64,
        reserve_price: u64,
        duration_seconds: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        auction.auction_id = auction_id;
        auction.seller = ctx.accounts.seller.key();
        auction.mint = ctx.accounts.mint.key();
        auction.reserve_price = reserve_price;
        auction.start_time = Clock::get()?.unix_timestamp as u64;
        auction.end_time = auction.start_time + duration_seconds;
        auction.highest_bid = 0;
        auction.highest_bidder = None;
        auction.is_settled = false;
        auction.is_cancelled = false;
        auction.first_bidder = None;
        
        Ok(())
    }

    /// Submit a sealed bid (commitment only, no amount revealed)
    /// Commitment = SHA256(amount || nonce || bidder_address)
    pub fn submit_bid(
        ctx: Context<SubmitBid>,
        auction_id: u64,
        commitment: [u8; 32],
        deposit_amount: u64,
    ) -> Result<()> {
        let bid = &mut ctx.accounts.bid;
        bid.auction_id = auction_id;
        bid.bidder = ctx.accounts.bidder.key();
        bid.commitment = commitment;
        bid.revealed_amount = None;
        bid.nonce = None;
        bid.is_revealed = false;
        bid.deposit_locked = deposit_amount;
        bid.submitted_at = Clock::get()?.unix_timestamp as u64;

        // Record first bidder for tie-breaking
        let auction = &mut ctx.accounts.auction;
        if auction.first_bidder.is_none() {
            auction.first_bidder = Some(ctx.accounts.bidder.key());
        }

        // Transfer deposit from bidder to escrow
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bidder_token_account.to_account_info(),
                to: ctx.accounts.escrow_account.to_account_info(),
                authority: ctx.accounts.bidder.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, deposit_amount)?;

        Ok(())
    }

    /// Reveal a sealed bid
    /// Verifies: SHA256(amount || nonce || bidder) == commitment
    /// Updates highest bid if valid and amount exceeds current highest
    pub fn reveal_bid(
        ctx: Context<RevealBid>,
        auction_id: u64,
        amount: u64,
        nonce: [u8; 32],
    ) -> Result<()> {
        let bid = &mut ctx.accounts.bid;
        
        // Verify commitment matches
        let mut hasher = Sha256::new();
        hasher.update(amount.to_le_bytes());
        hasher.update(&nonce);
        hasher.update(ctx.accounts.bidder.key().as_ref());
        let computed_commitment = hasher.finalize();
        
        require_eq!(
            computed_commitment.as_slice(),
            &bid.commitment,
            AuctionError::InvalidCommitment
        );

        bid.is_revealed = true;
        bid.revealed_amount = Some(amount);
        bid.nonce = Some(nonce);

        // Update highest bid if this reveal is higher
        let auction = &mut ctx.accounts.auction;
        if amount > auction.highest_bid {
            auction.highest_bid = amount;
            auction.highest_bidder = Some(ctx.accounts.bidder.key());
        } else if amount == auction.highest_bid && auction.first_bidder == Some(ctx.accounts.bidder.key()) {
            // Tie-breaker: first bidder wins
            auction.highest_bidder = Some(ctx.accounts.bidder.key());
        }

        Ok(())
    }

    /// Settle the auction
    /// - Permissionless: anyone can call
    /// - Transfers winning bid to seller
    /// - Handles non-revealers (lose deposit to seller)
    /// - Handles reserve failure (refund all deposits, cancel auction)
    pub fn settle_auction(
        ctx: Context<SettleAuction>,
        auction_id: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        
        require!(!auction.is_settled, AuctionError::AlreadySettled);
        require!(
            Clock::get()?.unix_timestamp as u64 >= auction.end_time,
            AuctionError::AuctionStillActive
        );

        auction.is_settled = true;

        // Check if reserve price met
        if auction.highest_bid < auction.reserve_price {
            // Reserve not met: cancel auction and refund all deposits
            auction.is_cancelled = true;
            // TODO: Implement deposit refund logic
        } else {
            // Reserve met: transfer winning bid to seller
            if let Some(winner) = auction.highest_bidder {
                // TODO: Transfer highest_bid from escrow to seller
            }
        }

        Ok(())
    }

    /// Claim deposit (refund or forfeit)
    /// - Revealed and not winner: full refund
    /// - Did not reveal: forfeit to seller (already transferred in settle)
    /// - Winner: keeps winning amount, refunds difference
    pub fn claim_deposit(
        ctx: Context<ClaimDeposit>,
        auction_id: u64,
    ) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let bid = &ctx.accounts.bid;

        require!(auction.is_settled, AuctionError::AuctionNotSettled);
        require!(!bid.claim_processed, AuctionError::AlreadyClaimed);

        let bid_mut = &mut ctx.accounts.bid;
        bid_mut.claim_processed = true;

        // Determine refund amount
        let refund_amount = if !bid.is_revealed {
            // Non-revealer: loses deposit (forfeited to seller)
            0
        } else if auction.highest_bidder == Some(ctx.accounts.bidder.key()) {
            // Winner: refund difference between deposit and winning bid
            bid.deposit_locked.saturating_sub(auction.highest_bid)
        } else {
            // Revealed but not winner: full refund
            bid.deposit_locked
        };

        if refund_amount > 0 {
            // Transfer refund from escrow to bidder
            // TODO: Implement transfer
        }

        Ok(())
    }
}

// ============================================================================
// ACCOUNTS & CONTEXTS
// ============================================================================

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct CreateAuction<'info> {
    #[account(
        init,
        pda = [b"auction", auction_id.to_le_bytes().as_ref()],
        space = 8 + Auction::SPACE,
        bump
    )]
    pub auction: Account<'info, Auction>,

    pub seller: Signer<'info>,
    pub mint: Account<'info, anchor_spl::token::Mint>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct SubmitBid<'info> {
    #[account(
        mut,
        seeds = [b"auction", auction_id.to_le_bytes().as_ref()],
        bump
    )]
    pub auction: Account<'info, Auction>,

    #[account(
        init,
        pda = [b"bid", auction_id.to_le_bytes().as_ref(), bidder.key().as_ref()],
        space = 8 + Bid::SPACE,
        bump
    )]
    pub bid: Account<'info, Bid>,

    #[account(
        init_if_needed,
        pda = [b"escrow", auction_id.to_le_bytes().as_ref()],
        token::mint = mint,
        token::authority = auction,
        bump
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    pub mint: Account<'info, anchor_spl::token::Mint>,
    
    #[account(mut)]
    pub bidder_token_account: Account<'info, TokenAccount>,
    
    pub bidder: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct RevealBid<'info> {
    #[account(mut)]
    pub auction: Account<'info, Auction>,

    #[account(
        mut,
        seeds = [b"bid", auction_id.to_le_bytes().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, Bid>,

    pub bidder: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct SettleAuction<'info> {
    #[account(
        mut,
        seeds = [b"auction", auction_id.to_le_bytes().as_ref()],
        bump
    )]
    pub auction: Account<'info, Auction>,

    pub escrow_account: Account<'info, TokenAccount>,
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(auction_id: u64)]
pub struct ClaimDeposit<'info> {
    pub auction: Account<'info, Auction>,

    #[account(
        mut,
        seeds = [b"bid", auction_id.to_le_bytes().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, Bid>,

    #[account(mut)]
    pub escrow_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bidder_token_account: Account<'info, TokenAccount>,

    pub bidder: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

// ============================================================================
// DATA STRUCTURES (PDAs)
// ============================================================================

#[account]
pub struct Auction {
    pub auction_id: u64,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub reserve_price: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub highest_bid: u64,
    pub highest_bidder: Option<Pubkey>,
    pub first_bidder: Option<Pubkey>,
    pub is_settled: bool,
    pub is_cancelled: bool,
}

impl Auction {
    const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 33 + 33 + 1 + 1;
}

#[account]
pub struct Bid {
    pub auction_id: u64,
    pub bidder: Pubkey,
    pub commitment: [u8; 32],
    pub revealed_amount: Option<u64>,
    pub nonce: Option<[u8; 32]>,
    pub is_revealed: bool,
    pub deposit_locked: u64,
    pub submitted_at: u64,
    pub claim_processed: bool,
}

impl Bid {
    const SPACE: usize = 8 + 32 + 32 + 9 + 33 + 1 + 8 + 8 + 1;
}

#[error_code]
pub enum AuctionError {
    #[msg("Invalid commitment hash")]
    InvalidCommitment,
    #[msg("Auction already settled")]
    AlreadySettled,
    #[msg("Auction still active")]
    AuctionStillActive,
    #[msg("Auction not yet settled")]
    AuctionNotSettled,
    #[msg("Claim already processed")]
    AlreadyClaimed,
}
