import { FC, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { verifyCommitment, retrieveNonce } from '../utils/commit-reveal';

interface RevealFormProps {
  auctionPublicKey: PublicKey;
  auctionId: string;
  bidPublicKey: PublicKey;
  storedCommitment: Buffer;
  onSuccess?: () => void;
}

export const RevealForm: FC<RevealFormProps> = ({
  auctionPublicKey,
  auctionId,
  bidPublicKey,
  storedCommitment,
  onSuccess,
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [bidAmount, setBidAmount] = useState('');
  const [nonce, setNonce] = useState('');
  const [autoFillAttempted, setAutoFillAttempted] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'valid' | 'invalid'>('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to auto-fill nonce from localStorage
  useState(() => {
    if (!autoFillAttempted) {
      const savedNonce = retrieveNonce(auctionId);
      if (savedNonce) {
        setNonce(savedNonce);
        setAutoFillAttempted(true);
      }
    }
  });

  function handleVerify() {
    if (!bidAmount || !nonce) {
      setError('Please enter both bid amount and nonce');
      return;
    }

    try {
      const bidAmountBN = new BN(parseFloat(bidAmount) * 1e9);
      const isValid = verifyCommitment(
        BigInt(bidAmountBN.toString()),
        nonce,
        storedCommitment
      );

      setVerificationStatus(isValid ? 'valid' : 'invalid');
      
      if (!isValid) {
        setError('❌ Verification failed: Your bid/nonce does not match the original commitment');
      } else {
        setError(null);
      }
    } catch (err: any) {
      setError('Invalid input: ' + err.message);
      setVerificationStatus('invalid');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (verificationStatus !== 'valid') {
      setError('Please verify your bid first (click Verify button)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const bidAmountBN = new BN(parseFloat(bidAmount) * 1e9);
      const nonceBytes = Buffer.from(nonce, 'hex');

      // TODO: Submit reveal transaction after deployment
      // const program = await getProgram(wallet);
      // const tx = await program.methods
      //   .revealBid(
      //     bidAmountBN,
      //     Array.from(nonceBytes)
      //   )
      //   .accounts({
      //     bidder: publicKey,
      //     auction: auctionPublicKey,
      //     bid: bidPublicKey,
      //   })
      //   .rpc();

      console.log('Revealing bid:', {
        amount: bidAmountBN.toString(),
        noncePreview: nonce.slice(0, 16) + '...',
      });

      alert('Bid reveal will be available after contract deployment');
      
      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error('Failed to reveal bid:', err);
      setError(err.message || 'Failed to reveal bid');
    } finally {
      setLoading(false);
    }
  }

  if (!publicKey) {
    return (
      <div className="reveal-form">
        <div className="warning-box">
          <p>⚠️ Please connect your wallet to reveal your bid</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal-form">
      <h2>Reveal Your Bid</h2>

      <div className="info-box">
        <p>ℹ️ <strong>Reveal Phase:</strong></p>
        <p>
          The commit phase has ended. Now you must reveal your original bid amount and nonce 
          to prove your bid is valid. If you don't reveal before the deadline, you will forfeit your deposit.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="bidAmount">
            Original Bid Amount
            <span className="required">*</span>
          </label>
          <input
            id="bidAmount"
            type="number"
            step="0.000000001"
            placeholder="Enter your original bid amount"
            value={bidAmount}
            onChange={(e) => {
              setBidAmount(e.target.value);
              setVerificationStatus('pending');
            }}
            required
          />
          <small>Must match exactly what you bid during commit phase</small>
        </div>

        <div className="form-group">
          <label htmlFor="nonce">
            Secret Nonce
            <span className="required">*</span>
          </label>
          <textarea
            id="nonce"
            rows={3}
            placeholder="Paste your 64-character nonce here"
            value={nonce}
            onChange={(e) => {
              setNonce(e.target.value);
              setVerificationStatus('pending');
            }}
            required
            className="nonce-input"
          />
          {autoFillAttempted && nonce && (
            <small className="success-text">
              ✅ Nonce auto-filled from localStorage backup
            </small>
          )}
          {!nonce && (
            <small className="warning-text">
              ⚠️ No nonce found in localStorage. You must have saved it elsewhere.
            </small>
          )}
        </div>

        <div className="verification-section">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleVerify}
            disabled={!bidAmount || !nonce}
          >
            🔍 Verify Before Submitting
          </button>

          {verificationStatus === 'valid' && (
            <div className="success-box">
              <p>✅ <strong>Verification Successful!</strong></p>
              <p>Your bid and nonce match the original commitment. You can now submit.</p>
            </div>
          )}

          {verificationStatus === 'invalid' && (
            <div className="error-box">
              <p>❌ <strong>Verification Failed!</strong></p>
              <p>Your bid amount or nonce does not match the original commitment.</p>
              <p><strong>Double-check:</strong></p>
              <ul>
                <li>Bid amount is exact (no rounding errors)</li>
                <li>Nonce is complete (64 hex characters)</li>
                <li>No extra spaces or line breaks</li>
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div className="error-box">
            <p>❌ {error}</p>
          </div>
        )}

        <div className="warning-box">
          <p><strong>⚠️ Before Revealing:</strong></p>
          <ul>
            <li>Verify your bid/nonce match (click Verify button above)</li>
            <li>Make sure you have enough SOL for transaction fees (~0.00005 SOL)</li>
            <li>Reveal before the deadline or lose your deposit</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn-primary btn-large"
            disabled={verificationStatus !== 'valid' || loading}
          >
            {loading ? 'Revealing Bid...' : '👁️ Reveal Bid'}
          </button>
        </div>

        <div className="help-text">
          <p><strong>After revealing:</strong></p>
          <ul>
            <li>Your bid becomes public (visible to everyone)</li>
            <li>Wait for all bidders to reveal</li>
            <li>After reveal deadline, auction will be finalized</li>
            <li>Highest revealed bid wins</li>
            <li>You can withdraw your deposit if you don't win</li>
          </ul>
        </div>
      </form>

      <div className="troubleshooting">
        <details>
          <summary>🆘 Troubleshooting</summary>
          <div className="troubleshooting-content">
            <h4>Problem: \"Verification failed\"</h4>
            <ul>
              <li><strong>Check decimals:</strong> If you bid 10.5, enter exactly 10.5 (not 10.50 or 10.500000000)</li>
              <li><strong>Check nonce format:</strong> Should be 64 hexadecimal characters (0-9, a-f)</li>
              <li><strong>Remove whitespace:</strong> No spaces, line breaks, or tabs in nonce</li>
            </ul>

            <h4>Problem: \"I lost my nonce\"</h4>
            <p>Unfortunately, there is no way to recover it. The nonce is not stored on-chain. 
            You will forfeit your deposit. This is by design to prevent spam bids.</p>

            <h4>Problem: \"Transaction failed\"</h4>
            <ul>
              <li>Check you have SOL for fees</li>
              <li>Try refreshing the page</li>
              <li>Switch to a different RPC endpoint in settings</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};
