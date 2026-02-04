import type { FC } from 'react';
import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { toast } from 'react-toastify';
import { generateNonce, createCommitment, storeNonce } from '../utils/commit-reveal';
import { Tooltip } from './Tooltip';

interface BidFormProps {
  auctionPublicKey: PublicKey;
  auctionId: string;
  reservePrice: number;
  minDeposit: number;
  onSuccess?: () => void;
}

/**
 * Component for placing a sealed bid in an auction.
 */
export const BidForm: FC<BidFormProps> = ({
  auctionPublicKey,
  auctionId,
  reservePrice,
  minDeposit,
  onSuccess,
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  // State variables for form inputs and UI
  const [bidAmount, setBidAmount] = useState('');
  const [nonce, setNonce] = useState<string>('');
  const [showNonceWarning, setShowNonceWarning] = useState(false);
  const [nonceConfirmed, setNonceConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generates a new random nonce.
   */
  function handleGenerateNonce() {
    const newNonce = generateNonce();
    setNonce(newNonce);
    setShowNonceWarning(true);
  }

  /**
   * Copies the nonce to the clipboard.
   */
  function handleCopyNonce() {
    navigator.clipboard.writeText(nonce);
    toast.success('✅ Nonce copied! Save it in your password manager NOW.', {
      autoClose: 7000,
    });
  }

  /**
   * Handles form submission.
   * @param e Form event
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!nonceConfirmed) {
      toast.error('You must confirm you saved your nonce');
      return;
    }

    setLoading(true);
    setError(null);
    const toastId = toast.loading('Placing your sealed bid...');

    try {
      const bidAmountFloat = parseFloat(bidAmount);
      
      // Validate bid amount
      if (isNaN(bidAmountFloat) || bidAmountFloat <= 0) {
        throw new Error('Bid amount must be a positive number');
      }

      if (bidAmountFloat < reservePrice) {
        throw new Error(`Bid must be at least ${reservePrice} (reserve price)`);
      }

      // Convert to lamports (assuming 9 decimals)
      const bidAmountBN = new BN(bidAmountFloat * 1e9);

      // Create commitment
      const commitment = createCommitment(BigInt(bidAmountBN.toString()), nonce);

      // Store nonce in localStorage as backup (with warnings)
      storeNonce(auctionId, nonce);

      // TODO: Submit bid transaction after deployment
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // const program = await getProgram(wallet);
      // const tx = await program.methods
      //   .placeBid(Array.from(commitment))
      //   .accounts({
      //     bidder: publicKey,
      //     auction: auctionPublicKey,
      //     // ... other accounts
      //   })
      //   .rpc();

      console.log('Placing bid:', {
        amount: bidAmountBN.toString(),
        commitment: commitment.toString('hex'),
        nonce: nonce.slice(0, 16) + '...',
      });

      toast.update(toastId, {
        render: '🔒 Sealed bid placed successfully! Remember to reveal during reveal phase.',
        type: 'success',
        isLoading: false,
        autoClose: 7000,
      });
      
      // Reset form
      setBidAmount('');
      setNonce('');
      setNonceConfirmed(false);
      setShowNonceWarning(false);
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }

    } catch (err: any) {
      console.error('Failed to place bid:', err);
      const errorMsg = err.message || 'Failed to place bid';
      setError(errorMsg);
      toast.update(toastId, {
        render: `❌ ${errorMsg}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  if (!publicKey) {
    return (
      <div className="bid-form">
        <div className="warning-box">
          <p>⚠️ Please connect your wallet to place a bid</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bid-form">
      <h2>Place Sealed Bid</h2>

      <div className="info-box">
        <p>ℹ️ <strong>How Sealed Bids Work:</strong></p>
        <ol>
          <li>Enter your bid amount (hidden from others)</li>
          <li>Generate a random <Tooltip content="A random 32-byte secret that makes your commitment unique">nonce</Tooltip> (secret key)</li>
          <li>Submit a cryptographic <Tooltip content="SHA-256 hash of your bid + nonce. Proves you made a bid without revealing the amount.">commitment</Tooltip> (SHA-256 hash)</li>
          <li>After commit phase ends, reveal your bid using the nonce</li>
        </ol>
        <p><strong>Nobody can see your bid amount until reveal phase!</strong></p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="bidAmount">
            Your Bid Amount
            <span className="required">*</span>
          </label>
          <input
            id="bidAmount"
            type="number"
            step="0.000000001"
            placeholder={`Minimum: ${reservePrice}`}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
            disabled={!nonce}
          />
          <small>
            Reserve price: {reservePrice} | Your bid will be hidden until reveal
          </small>
        </div>

        {!nonce ? (
          <div className="nonce-generation">
            <button
              type="button"
              className="btn-secondary btn-large"
              onClick={handleGenerateNonce}
            >
              🎲 Generate Secret Nonce
            </button>
            <p className="help-text">
              Click to generate a random 32-byte nonce (required for commitment)
            </p>
          </div>
        ) : (
          <>
            <div className="nonce-display danger-zone">
              <h3>🚨 CRITICAL: Save Your Nonce</h3>
              
              <div className="nonce-box">
                <code>{nonce}</code>
                <button
                  type="button"
                  onClick={handleCopyNonce}
                  className="btn-ghost btn-small"
                >
                  📋 Copy
                </button>
              </div>

              <div className="warning-box critical">
                <p><strong>⚠️ YOU MUST SAVE THIS NONCE!</strong></p>
                <p>Without this nonce, you CANNOT reveal your bid and will LOSE your {minDeposit} SOL deposit.</p>
                
                <p><strong>Save it in:</strong></p>
                <ul>
                  <li>✅ Password manager (1Password, LastPass, Bitwarden)</li>
                  <li>✅ Encrypted note app</li>
                  <li>✅ Offline backup (USB drive, paper)</li>
                </ul>

                <p><strong>DO NOT:</strong></p>
                <ul>
                  <li>❌ Rely on browser storage only (can be cleared)</li>
                  <li>❌ Only screenshot (phone can break)</li>
                  <li>❌ Trust your memory</li>
                </ul>

                <p className="emphasis">
                  This is a ONE-TIME display. Once you submit, you cannot retrieve this nonce from the blockchain.
                </p>
              </div>

              <div className="confirmation-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={nonceConfirmed}
                    onChange={(e) => setNonceConfirmed(e.target.checked)}
                  />
                  <strong>
                    I have saved my nonce in a secure location and understand I will lose my deposit if I lose it
                  </strong>
                </label>
              </div>
            </div>

            {showNonceWarning && (
              <div className="info-box">
                <p><strong>Why do I need a nonce?</strong></p>
                <p>
                  The nonce is part of the cryptographic commitment that hides your bid. 
                  Without it, you cannot prove what your original bid was during the reveal phase.
                </p>
                <p>
                  Think of it like a key to a safe deposit box: the commitment is the box number (public), 
                  and the nonce is the key (private).
                </p>
              </div>
            )}
          </>
        )}

        <div className="deposit-info">
          <p><strong>Required Deposit:</strong> {minDeposit} SOL</p>
          <ul>
            <li>Returned if you reveal your bid (win or lose)</li>
            <li>Forfeited if you don't reveal (anti-spam measure)</li>
          </ul>
        </div>

        {error && (
          <div className="error-box">
            <p>❌ {error}</p>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className={`btn-primary btn-large ${loading ? 'btn-loading' : ''}`}
            disabled={!nonce || !nonceConfirmed || !bidAmount || loading}
          >
            {loading ? 'Submitting Bid...' : '🔒 Submit Sealed Bid'}
          </button>
        </div>

        <div className="help-text">
          <p>After submitting:</p>
          <ul>
            <li>Your bid is hidden (only commitment hash is visible)</li>
            <li>Wait for commit phase to end</li>
            <li>Return during reveal phase with your nonce</li>
            <li>Reveal your bid to compete for winning</li>
          </ul>
        </div>
      </form>
    </div>
  );
};
