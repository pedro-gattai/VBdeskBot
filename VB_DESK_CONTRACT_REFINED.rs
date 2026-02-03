// VB Desk - Sealed-Bid Auction Smart Contract (REFINED)
// Days 3-4 Implementation Guide
// Use this as the core for programs/vb-desk/src/lib.rs

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use sha2::{Sha256, Digest};

declare_id!("PLACEHOLDER_PROGRAM_ID");

#[program]
pub mod vb_desk {
    use super::*;

    // ========================================================================
    // INSTRUCTION 1: CREATE AUCTION
    // ========================================================================
    
    pub fn create_auction(
        ctx: Context<CreateAuction>,
        auction_id: u64,
        reserve_price: u64,
        duration_seconds: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let clock = Clock::get()?;
        
        auction.auction_id = auction_id;
        auction.seller = ctx.accounts.seller.key();
        auction.mint = ctx.accounts.mint.key();
        auction.reserve_price = reserve_price;
        auction.start_time = clock.unix_timestamp as u64;
        auction.end_time = auction.start_time + duration_seconds;
        auction.highest_bid = 0;
        auction.highest_bidder = None;
        auction.is_settled = false;
        auction.is_cancelled = false;
        auction.first_bidder = None;
        
        msg!("Auction created: {}", auction_id);
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION 2: SUBMIT BID
    // ========================================================================
    
    pub fn submit_bid(
        ctx: Context<SubmitBid>,
        auction_id: u64,
        commitment: [u8; 32],
        deposit_amount: u64,
    ) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp as u64;
        
        // Validate auction is active
        require!(
            current_time < auction.end_time,
            AuctionError::AuctionEnded
        );
        
        let bid = &mut ctx.accounts.bid;
        bid.auction_id = auction_id;
        bid.bidder = ctx.accounts.bidder.key();
        bid.commitment = commitment;
        bid.revealed_amount = None;
        bid.nonce = None;
        bid.is_revealed = false;
        bid.deposit_locked = deposit_amount;
        bid.submitted_at = current_time;
        bid.claim_processed = false;
        
        // Record first bidder for tie-breaking
        let auction_mut = &mut ctx.accounts.auction;
        if auction_mut.first_bidder.is_none() {
            auction_mut.first_bidder = Some(ctx.accounts.bidder.key());
        }
        
        // Transfer deposit from bidder to escrow
        let transfer_cpi = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bidder_token_account.to_account_info(),
                to: ctx.accounts.escrow_account.to_account_info(),
                authority: ctx.accounts.bidder.to_account_info(),
            },
        );
        token::transfer(transfer_cpi, deposit_amount)?;
        
        msg!("Bid submitted for auction {} by {}", auction_id, ctx.accounts.bidder.key());
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION 3: REVEAL BID
    // ========================================================================
    
    pub fn reveal_bid(
        ctx: Context<RevealBid>,
        auction_id: u64,
        amount: u64,
        nonce: [u8; 32],
    ) -> Result<()> {
        let bid = &mut ctx.accounts.bid;
        let clock = Clock::get()?;
        
        // Verify commitment matches (SHA-256)
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
        
        // Mark as revealed
        bid.is_revealed = true;
        bid.revealed_amount = Some(amount);
        bid.nonce = Some(nonce);
        
        // Update highest bid if this bid is higher
        let auction = &mut ctx.accounts.auction;
        
        if amount > auction.highest_bid {
            // New highest bid
            auction.highest_bid = amount;
            auction.highest_bidder = Some(ctx.accounts.bidder.key());
            msg!("New highest bid: {}", amount);
        } else if amount == auction.highest_bid 
            && auction.first_bidder == Some(ctx.accounts.bidder.key()) {
            // Tie-breaker: first bidder wins
            auction.highest_bidder = Some(ctx.accounts.bidder.key());
            msg!("Tie-breaker: first bidder wins with amount {}", amount);
        } else {
            msg!("Bid revealed: {} (current highest: {})", amount, auction.highest_bid);
        }
        
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION 4: SETTLE AUCTION
    // ========================================================================
    
    pub fn settle_auction(
        ctx: Context<SettleAuction>,
        auction_id: u64,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp as u64;
        
        // Validate auction has ended
        require!(
            current_time >= auction.end_time,
            AuctionError::AuctionStillActive
        );
        
        // Validate not already settled
        require!(
            !auction.is_settled,
            AuctionError::AlreadySettled
        );
        
        auction.is_settled = true;
        
        // Case 1: Reserve price met
        if auction.highest_bid >= auction.reserve_price {
            if let Some(winner) = auction.highest_bidder {
                // Transfer winning bid from escrow to seller
                let escrow_signer_seeds: &[&[&[u8]]] = &[
                    &[b"escrow", auction_id.to_le_bytes().as_ref(), &[ctx.bumps.escrow_account]],
                ];
                
                let transfer_cpi = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_account.to_account_info(),
                        to: ctx.accounts.seller_token_account.to_account_info(),
                        authority: ctx.accounts.escrow_account.to_account_info(),
                    },
                    escrow_signer_seeds,
                );
                token::transfer(transfer_cpi, auction.highest_bid)?;
                
                msg!("Auction settled: winner {} receives bid amount {}", winner, auction.highest_bid);
            }
        } else {
            // Case 2: Reserve price NOT met - cancel auction
            auction.is_cancelled = true;
            msg!("Auction cancelled: reserve price not met (highest bid: {}, reserve: {})", 
                auction.highest_bid, auction.reserve_price);
            // All deposits stay in escrow and will be refunded via claim_deposit
        }
        
        Ok(())
    }

    // ========================================================================
    // INSTRUCTION 5: CLAIM DEPOSIT
    // ========================================================================
    
    pub fn claim_deposit(
        ctx: Context<ClaimDeposit>,
        auction_id: u64,
    ) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let bid = &ctx.accounts.bid;
        
        // Validate auction is settled
        require!(
            auction.is_settled,
            AuctionError::AuctionNotSettled
        );
        
        // Validate not already claimed
        require!(
            !bid.claim_processed,
            AuctionError::AlreadyClaimed
        );
        
        let bid_mut = &mut ctx.accounts.bid;
        bid_mut.claim_processed = true;
        
        // Calculate refund amount based on status
        let refund_amount = if !bid.is_revealed {
            // Non-revealer: loses deposit (forfeited to seller)
            0
        } else if auction.is_cancelled {
            // Auction cancelled: refund full deposit
            bid.deposit_locked
        } else if auction.highest_bidder == Some(ctx.accounts.bidder.key()) {
            // Winner: refund difference between deposit and winning bid
            bid.deposit_locked.saturating_sub(auction.highest_bid)
        } else {
            // Revealed but not winner: refund full deposit
            bid.deposit_locked
        };
        
        if refund_amount > 0 {
            // Transfer refund from escrow to bidder
            let escrow_signer_seeds: &[&[&[u8]]] = &[
                &[b"escrow", auction_id.to_le_bytes().as_ref(), &[ctx.bumps.escrow_account]],
            ];
            
            let transfer_cpi = CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.escrow_account.to_account_info(),
                    to: ctx.accounts.bidder_token_account.to_account_info(),
                    authority: ctx.accounts.escrow_account.to_account_info(),
                },
                escrow_signer_seeds,
            );
            token::transfer(transfer_cpi, refund_amount)?;
            
            msg!("Deposit claimed: bidder {} refunded {}", ctx.accounts.bidder.key(), refund_amount);
        } else {
            msg!("Deposit forfeited: non-revealer {} forfeits {}", ctx.accounts.bidder.key(), bid.deposit_locked);
        }
        
        Ok(())
    }
}

// ============================================================================
// ACCOUNT CONTEXTS
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

    #[account(mut)]
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
    
    #[account(mut)]
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

    #[account(mut)]
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

    #[account(
        mut,
        seeds = [b"escrow", auction_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    #[account(mut)]
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

    #[account(
        mut,
        seeds = [b"escrow", auction_id.to_le_bytes().as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bidder_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub bidder: Signer<'info>,

    pub token_program: Program<'info, Token>,
}

// ============================================================================
// STATE STRUCTURES (PDAs)
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

// ============================================================================
// ERROR CODES
// ============================================================================

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
    
    #[msg("Deposit already claimed")]
    AlreadyClaimed,
    
    #[msg("Auction has ended")]
    AuctionEnded,
}
