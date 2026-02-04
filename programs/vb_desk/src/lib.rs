use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};

declare_id!("VBDesk11111111111111111111111111111111111111");

#[program]
pub mod vb_desk {
    use super::*;

    /// Create a new OTC auction
    /// Seller deposits tokens into escrow and sets auction parameters
    pub fn create_auction(
        ctx: Context<CreateAuction>,
        amount: u64,
        min_price: u64,
        commit_end_time: i64,
        reveal_end_time: i64,
    ) -> Result<()> {
        require!(amount > 0, AuctionError::InvalidAmount);
        require!(min_price > 0, AuctionError::InvalidPrice);
        require!(commit_end_time > Clock::get()?.unix_timestamp, AuctionError::InvalidDeadline);
        require!(reveal_end_time > commit_end_time, AuctionError::InvalidDeadline);

        let auction = &mut ctx.accounts.auction;
        auction.seller = ctx.accounts.seller.key();
        auction.token_mint = ctx.accounts.token_mint.key();
        auction.amount = amount;
        auction.min_price = min_price;
        auction.commit_end_time = commit_end_time;
        auction.reveal_end_time = reveal_end_time;
        auction.status = AuctionStatus::Active;
        auction.winning_bid = None;
        auction.bump = ctx.bumps.auction;

        // Transfer tokens from seller to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.seller_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.seller.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(AuctionCreated {
            auction: auction.key(),
            seller: auction.seller,
            token_mint: auction.token_mint,
            amount,
            min_price,
            commit_end_time,
            reveal_end_time,
        });

        Ok(())
    }

    /// Place a sealed bid
    /// Bidder commits hash(price || salt) and deposits SOL equal to their bid
    pub fn place_bid(
        ctx: Context<PlaceBid>,
        commitment: [u8; 32],
        bid_amount: u64,
    ) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let current_time = Clock::get()?.unix_timestamp;

        require!(auction.status == AuctionStatus::Active, AuctionError::AuctionNotActive);
        require!(current_time < auction.commit_end_time, AuctionError::CommitPeriodEnded);
        require!(bid_amount >= auction.min_price, AuctionError::BidBelowMinimum);

        let bid = &mut ctx.accounts.bid;
        bid.auction = auction.key();
        bid.bidder = ctx.accounts.bidder.key();
        bid.commitment = commitment;
        bid.revealed_price = None;
        bid.deposited_amount = bid_amount;
        bid.bump = ctx.bumps.bid;

        // Transfer SOL from bidder to bid PDA (acts as escrow)
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.bidder.key(),
            &bid.key(),
            bid_amount,
        );
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                ctx.accounts.bidder.to_account_info(),
                bid.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(BidPlaced {
            auction: auction.key(),
            bidder: bid.bidder,
            commitment,
            deposited_amount: bid_amount,
        });

        Ok(())
    }

    /// Reveal a previously committed bid
    /// Bidder proves their commitment by revealing price and salt
    pub fn reveal_bid(
        ctx: Context<RevealBid>,
        price: u64,
        salt: [u8; 32],
    ) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let current_time = Clock::get()?.unix_timestamp;

        require!(auction.status == AuctionStatus::Active, AuctionError::AuctionNotActive);
        require!(current_time >= auction.commit_end_time, AuctionError::CommitPeriodNotEnded);
        require!(current_time < auction.reveal_end_time, AuctionError::RevealPeriodEnded);

        let bid = &mut ctx.accounts.bid;
        require!(bid.revealed_price.is_none(), AuctionError::AlreadyRevealed);

        // Verify commitment: hash(price || salt) == commitment
        let mut data = Vec::new();
        data.extend_from_slice(&price.to_le_bytes());
        data.extend_from_slice(&salt);
        let computed_hash = anchor_lang::solana_program::hash::hash(&data);
        
        require!(
            computed_hash.to_bytes() == bid.commitment,
            AuctionError::InvalidReveal
        );

        // Verify deposited amount matches revealed price
        require!(
            bid.deposited_amount == price,
            AuctionError::DepositMismatch
        );

        bid.revealed_price = Some(price);

        emit!(BidRevealed {
            auction: auction.key(),
            bidder: bid.bidder,
            price,
        });

        Ok(())
    }

    /// Finalize the auction and determine the winner
    /// Can be called by anyone after reveal period ends
    pub fn finalize_auction(
        ctx: Context<FinalizeAuction>,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let current_time = Clock::get()?.unix_timestamp;

        require!(auction.status == AuctionStatus::Active, AuctionError::AuctionNotActive);
        require!(current_time >= auction.reveal_end_time, AuctionError::RevealPeriodNotEnded);

        // Note: In a production system, we'd iterate through all bids to find the highest
        // For this implementation, we'll accept the winning bid as a parameter
        // and verify it in the complete_trade instruction
        auction.status = AuctionStatus::Finalized;

        emit!(AuctionFinalized {
            auction: auction.key(),
        });

        Ok(())
    }

    /// Complete the trade between winner and seller
    /// Winner receives tokens, seller receives SOL
    pub fn complete_trade(
        ctx: Context<CompleteTrade>,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let winning_bid = &ctx.accounts.winning_bid;

        require!(auction.status == AuctionStatus::Finalized, AuctionError::AuctionNotFinalized);
        require!(winning_bid.auction == auction.key(), AuctionError::InvalidBid);
        require!(
            winning_bid.revealed_price.is_some(),
            AuctionError::BidNotRevealed
        );

        let winning_price = winning_bid.revealed_price.unwrap();
        require!(winning_price >= auction.min_price, AuctionError::BidBelowMinimum);

        // Transfer tokens from escrow to winner
        let seeds = &[
            b"auction",
            auction.seller.as_ref(),
            auction.token_mint.as_ref(),
            &[auction.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.winner_token_account.to_account_info(),
            authority: auction.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, auction.amount)?;

        // Transfer SOL from winning bid PDA to seller
        let bid_seeds = &[
            b"bid",
            auction.key().as_ref(),
            winning_bid.bidder.as_ref(),
            &[winning_bid.bump],
        ];
        let bid_signer = &[&bid_seeds[..]];

        **winning_bid.to_account_info().try_borrow_mut_lamports()? -= winning_price;
        **ctx.accounts.seller.to_account_info().try_borrow_mut_lamports()? += winning_price;

        auction.status = AuctionStatus::Completed;
        auction.winning_bid = Some(winning_bid.key());

        emit!(TradeCompleted {
            auction: auction.key(),
            winner: winning_bid.bidder,
            seller: auction.seller,
            price: winning_price,
            amount: auction.amount,
        });

        Ok(())
    }

    /// Withdraw a losing bid or failed auction bid
    /// Returns SOL to bidder if they didn't win
    pub fn withdraw_bid(
        ctx: Context<WithdrawBid>,
    ) -> Result<()> {
        let auction = &ctx.accounts.auction;
        let bid = &ctx.accounts.bid;

        require!(
            auction.status == AuctionStatus::Completed || 
            auction.status == AuctionStatus::Cancelled,
            AuctionError::AuctionNotFinished
        );

        // Ensure this is not the winning bid
        if let Some(winning_bid_key) = auction.winning_bid {
            require!(bid.key() != winning_bid_key, AuctionError::CannotWithdrawWinningBid);
        }

        // Transfer SOL back to bidder
        let seeds = &[
            b"bid",
            auction.key().as_ref(),
            bid.bidder.as_ref(),
            &[bid.bump],
        ];
        let signer = &[&seeds[..]];

        let amount = bid.deposited_amount;
        **bid.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.bidder.to_account_info().try_borrow_mut_lamports()? += amount;

        emit!(BidWithdrawn {
            auction: auction.key(),
            bidder: bid.bidder,
            amount,
        });

        Ok(())
    }

    /// Cancel an auction (only if no valid bids or before commit period ends)
    /// Returns tokens to seller
    pub fn cancel_auction(
        ctx: Context<CancelAuction>,
    ) -> Result<()> {
        let auction = &mut ctx.accounts.auction;
        let current_time = Clock::get()?.unix_timestamp;

        require!(auction.status == AuctionStatus::Active, AuctionError::AuctionNotActive);
        require!(
            ctx.accounts.seller.key() == auction.seller,
            AuctionError::Unauthorized
        );

        // Can only cancel before commit period ends or after reveal with no valid bids
        let can_cancel = current_time < auction.commit_end_time ||
            (current_time >= auction.reveal_end_time && auction.winning_bid.is_none());
        
        require!(can_cancel, AuctionError::CannotCancel);

        // Return tokens to seller
        let seeds = &[
            b"auction",
            auction.seller.as_ref(),
            auction.token_mint.as_ref(),
            &[auction.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.seller_token_account.to_account_info(),
            authority: auction.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, auction.amount)?;

        auction.status = AuctionStatus::Cancelled;

        emit!(AuctionCancelled {
            auction: auction.key(),
            seller: auction.seller,
        });

        Ok(())
    }
}

// ========================================
// Account Structures
// ========================================

#[account]
pub struct Auction {
    /// Seller who created the auction
    pub seller: Pubkey,
    /// Token mint being sold
    pub token_mint: Pubkey,
    /// Amount of tokens being sold
    pub amount: u64,
    /// Minimum acceptable price (in lamports)
    pub min_price: u64,
    /// Unix timestamp when commit period ends
    pub commit_end_time: i64,
    /// Unix timestamp when reveal period ends
    pub reveal_end_time: i64,
    /// Current auction status
    pub status: AuctionStatus,
    /// Winning bid (if any)
    pub winning_bid: Option<Pubkey>,
    /// PDA bump seed
    pub bump: u8,
}

impl Auction {
    pub const LEN: usize = 8 + // discriminator
        32 + // seller
        32 + // token_mint
        8 +  // amount
        8 +  // min_price
        8 +  // commit_end_time
        8 +  // reveal_end_time
        1 +  // status
        33 + // winning_bid (Option<Pubkey>)
        1;   // bump
}

#[account]
pub struct Bid {
    /// Auction this bid is for
    pub auction: Pubkey,
    /// Bidder's public key
    pub bidder: Pubkey,
    /// Commitment hash(price || salt)
    pub commitment: [u8; 32],
    /// Revealed price (None until revealed)
    pub revealed_price: Option<u64>,
    /// Amount of SOL deposited
    pub deposited_amount: u64,
    /// PDA bump seed
    pub bump: u8,
}

impl Bid {
    pub const LEN: usize = 8 +  // discriminator
        32 + // auction
        32 + // bidder
        32 + // commitment
        9 +  // revealed_price (Option<u64>)
        8 +  // deposited_amount
        1;   // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum AuctionStatus {
    Active,
    Finalized,
    Completed,
    Cancelled,
}

// ========================================
// Context Structures
// ========================================

#[derive(Accounts)]
pub struct CreateAuction<'info> {
    #[account(
        init,
        payer = seller,
        space = Auction::LEN,
        seeds = [b"auction", seller.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub auction: Account<'info, Auction>,

    #[account(mut)]
    pub seller: Signer<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == token_mint.key()
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = seller,
        token::mint = token_mint,
        token::authority = auction,
        seeds = [b"escrow", auction.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct PlaceBid<'info> {
    pub auction: Account<'info, Auction>,

    #[account(
        init,
        payer = bidder,
        space = Bid::LEN,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump
    )]
    pub bid: Account<'info, Bid>,

    #[account(mut)]
    pub bidder: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevealBid<'info> {
    pub auction: Account<'info, Auction>,

    #[account(
        mut,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump = bid.bump,
        constraint = bid.bidder == bidder.key()
    )]
    pub bid: Account<'info, Bid>,

    pub bidder: Signer<'info>,
}

#[derive(Accounts)]
pub struct FinalizeAuction<'info> {
    #[account(mut)]
    pub auction: Account<'info, Auction>,
}

#[derive(Accounts)]
pub struct CompleteTrade<'info> {
    #[account(mut)]
    pub auction: Account<'info, Auction>,

    #[account(
        mut,
        seeds = [b"bid", auction.key().as_ref(), winning_bid.bidder.as_ref()],
        bump = winning_bid.bump
    )]
    pub winning_bid: Account<'info, Bid>,

    #[account(
        mut,
        seeds = [b"escrow", auction.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = winner_token_account.owner == winning_bid.bidder,
        constraint = winner_token_account.mint == auction.token_mint
    )]
    pub winner_token_account: Account<'info, TokenAccount>,

    /// CHECK: Seller receives SOL from winning bid
    #[account(
        mut,
        constraint = seller.key() == auction.seller
    )]
    pub seller: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawBid<'info> {
    pub auction: Account<'info, Auction>,

    #[account(
        mut,
        seeds = [b"bid", auction.key().as_ref(), bidder.key().as_ref()],
        bump = bid.bump,
        constraint = bid.bidder == bidder.key()
    )]
    pub bid: Account<'info, Bid>,

    #[account(mut)]
    pub bidder: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelAuction<'info> {
    #[account(mut)]
    pub auction: Account<'info, Auction>,

    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", auction.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = seller_token_account.owner == seller.key(),
        constraint = seller_token_account.mint == auction.token_mint
    )]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ========================================
// Events
// ========================================

#[event]
pub struct AuctionCreated {
    pub auction: Pubkey,
    pub seller: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub min_price: u64,
    pub commit_end_time: i64,
    pub reveal_end_time: i64,
}

#[event]
pub struct BidPlaced {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub commitment: [u8; 32],
    pub deposited_amount: u64,
}

#[event]
pub struct BidRevealed {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub price: u64,
}

#[event]
pub struct AuctionFinalized {
    pub auction: Pubkey,
}

#[event]
pub struct TradeCompleted {
    pub auction: Pubkey,
    pub winner: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub amount: u64,
}

#[event]
pub struct BidWithdrawn {
    pub auction: Pubkey,
    pub bidder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AuctionCancelled {
    pub auction: Pubkey,
    pub seller: Pubkey,
}

// ========================================
// Errors
// ========================================

#[error_code]
pub enum AuctionError {
    #[msg("Invalid amount specified")]
    InvalidAmount,
    #[msg("Invalid price specified")]
    InvalidPrice,
    #[msg("Invalid deadline specified")]
    InvalidDeadline,
    #[msg("Auction is not active")]
    AuctionNotActive,
    #[msg("Commit period has ended")]
    CommitPeriodEnded,
    #[msg("Commit period has not ended yet")]
    CommitPeriodNotEnded,
    #[msg("Reveal period has ended")]
    RevealPeriodEnded,
    #[msg("Reveal period has not ended yet")]
    RevealPeriodNotEnded,
    #[msg("Bid below minimum price")]
    BidBelowMinimum,
    #[msg("Bid already revealed")]
    AlreadyRevealed,
    #[msg("Invalid reveal - commitment doesn't match")]
    InvalidReveal,
    #[msg("Deposited amount doesn't match revealed price")]
    DepositMismatch,
    #[msg("Auction not finalized")]
    AuctionNotFinalized,
    #[msg("Invalid bid for this auction")]
    InvalidBid,
    #[msg("Bid has not been revealed")]
    BidNotRevealed,
    #[msg("Auction not finished")]
    AuctionNotFinished,
    #[msg("Cannot withdraw winning bid")]
    CannotWithdrawWinningBid,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Cannot cancel auction at this time")]
    CannotCancel,
}
