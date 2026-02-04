import { useState } from 'react';
import type { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';

interface CreateAuctionFormProps {
  onSuccess: () => void;
}

interface FormErrors {
  sellingToken?: string;
  buyingToken?: string;
  sellingAmount?: string;
  reservePrice?: string;
  commitDuration?: string;
  revealDuration?: string;
}

export const CreateAuctionForm: FC<CreateAuctionFormProps> = ({ onSuccess }) => {
  const { publicKey } = useWallet();
  const [sellingToken, setSellingToken] = useState('');
  const [buyingToken, setBuyingToken] = useState('');
  const [sellingAmount, setSellingAmount] = useState('');
  const [reservePrice, setReservePrice] = useState('');
  const [commitDuration, setCommitDuration] = useState('24');
  const [revealDuration, setRevealDuration] = useState('24');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate token addresses (basic Solana pubkey format)
    const pubkeyRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    
    if (!sellingToken) {
      newErrors.sellingToken = 'Selling token address is required';
    } else if (!pubkeyRegex.test(sellingToken)) {
      newErrors.sellingToken = 'Invalid Solana token address';
    }

    if (!buyingToken) {
      newErrors.buyingToken = 'Buying token address is required';
    } else if (!pubkeyRegex.test(buyingToken)) {
      newErrors.buyingToken = 'Invalid Solana token address';
    }

    if (sellingToken === buyingToken) {
      newErrors.buyingToken = 'Selling and buying tokens must be different';
    }

    // Validate amounts
    const sellingAmountNum = parseFloat(sellingAmount);
    if (!sellingAmount) {
      newErrors.sellingAmount = 'Selling amount is required';
    } else if (isNaN(sellingAmountNum) || sellingAmountNum <= 0) {
      newErrors.sellingAmount = 'Selling amount must be greater than 0';
    }

    const reservePriceNum = parseFloat(reservePrice);
    if (!reservePrice) {
      newErrors.reservePrice = 'Reserve price is required';
    } else if (isNaN(reservePriceNum) || reservePriceNum <= 0) {
      newErrors.reservePrice = 'Reserve price must be greater than 0';
    }

    // Validate durations
    const commitDurationNum = parseInt(commitDuration);
    if (!commitDuration) {
      newErrors.commitDuration = 'Commit duration is required';
    } else if (isNaN(commitDurationNum) || commitDurationNum < 1) {
      newErrors.commitDuration = 'Commit duration must be at least 1 hour';
    } else if (commitDurationNum > 168) {
      newErrors.commitDuration = 'Commit duration cannot exceed 7 days (168 hours)';
    }

    const revealDurationNum = parseInt(revealDuration);
    if (!revealDuration) {
      newErrors.revealDuration = 'Reveal duration is required';
    } else if (isNaN(revealDurationNum) || revealDurationNum < 1) {
      newErrors.revealDuration = 'Reveal duration must be at least 1 hour';
    } else if (revealDurationNum > 168) {
      newErrors.revealDuration = 'Reveal duration cannot exceed 7 days (168 hours)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating auction...');

    try {
      // TODO: Create auction on chain
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Creating auction:', {
        sellingToken,
        buyingToken,
        sellingAmount,
        reservePrice,
        commitDuration,
        revealDuration,
      });

      toast.update(toastId, {
        render: '🎉 Auction created successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 5000,
      });

      // Reset form
      setSellingToken('');
      setBuyingToken('');
      setSellingAmount('');
      setReservePrice('');
      setCommitDuration('24');
      setRevealDuration('24');
      setErrors({});

      // Wait a moment before redirecting
      setTimeout(() => onSuccess(), 1000);

    } catch (error: any) {
      console.error('Failed to create auction:', error);
      toast.update(toastId, {
        render: `❌ Failed to create auction: ${error.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Create New Auction</h2>
      
      <div className="alert alert-info">
        <p><strong>ℹ️ How it works:</strong></p>
        <p>You're creating a sealed-bid Vickrey-Boneh auction. Bidders will submit encrypted bids during the commit phase, then reveal them later. The highest bidder wins but pays the second-highest price!</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sellingToken">
            Selling Token Address
            <span className="required">*</span>
          </label>
          <input
            id="sellingToken"
            type="text"
            value={sellingToken}
            onChange={(e) => {
              setSellingToken(e.target.value);
              if (errors.sellingToken) {
                setErrors(prev => ({ ...prev, sellingToken: undefined }));
              }
            }}
            placeholder="e.g., So11111111111111111111111111111111111111112 (SOL)"
            disabled={loading}
          />
          {errors.sellingToken && (
            <div className="form-error">❌ {errors.sellingToken}</div>
          )}
          <small>The token you're selling (SPL token mint address)</small>
        </div>

        <div className="form-group">
          <label htmlFor="buyingToken">
            Buying Token Address
            <span className="required">*</span>
          </label>
          <input
            id="buyingToken"
            type="text"
            value={buyingToken}
            onChange={(e) => {
              setBuyingToken(e.target.value);
              if (errors.buyingToken) {
                setErrors(prev => ({ ...prev, buyingToken: undefined }));
              }
            }}
            placeholder="e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (USDC)"
            disabled={loading}
          />
          {errors.buyingToken && (
            <div className="form-error">❌ {errors.buyingToken}</div>
          )}
          <small>The token bidders will use to bid (SPL token mint address)</small>
        </div>

        <div className="form-group">
          <label htmlFor="sellingAmount">
            Selling Amount
            <span className="required">*</span>
          </label>
          <input
            id="sellingAmount"
            type="number"
            value={sellingAmount}
            onChange={(e) => {
              setSellingAmount(e.target.value);
              if (errors.sellingAmount) {
                setErrors(prev => ({ ...prev, sellingAmount: undefined }));
              }
            }}
            placeholder="e.g., 100"
            min="0"
            step="any"
            disabled={loading}
          />
          {errors.sellingAmount && (
            <div className="form-error">❌ {errors.sellingAmount}</div>
          )}
          <small>How many tokens are you selling?</small>
        </div>

        <div className="form-group">
          <label htmlFor="reservePrice">
            Reserve Price
            <span className="required">*</span>
          </label>
          <input
            id="reservePrice"
            type="number"
            value={reservePrice}
            onChange={(e) => {
              setReservePrice(e.target.value);
              if (errors.reservePrice) {
                setErrors(prev => ({ ...prev, reservePrice: undefined }));
              }
            }}
            placeholder="e.g., 50"
            min="0"
            step="any"
            disabled={loading}
          />
          {errors.reservePrice && (
            <div className="form-error">❌ {errors.reservePrice}</div>
          )}
          <small>Minimum acceptable price per token (in buying token). Bids below this will be rejected.</small>
        </div>

        <div className="form-group">
          <label htmlFor="commitDuration">
            Commit Phase Duration (hours)
            <span className="required">*</span>
          </label>
          <input
            id="commitDuration"
            type="number"
            value={commitDuration}
            onChange={(e) => {
              setCommitDuration(e.target.value);
              if (errors.commitDuration) {
                setErrors(prev => ({ ...prev, commitDuration: undefined }));
              }
            }}
            min="1"
            max="168"
            disabled={loading}
          />
          {errors.commitDuration && (
            <div className="form-error">❌ {errors.commitDuration}</div>
          )}
          <small>How long bidders have to submit sealed bids (1-168 hours)</small>
        </div>

        <div className="form-group">
          <label htmlFor="revealDuration">
            Reveal Phase Duration (hours)
            <span className="required">*</span>
          </label>
          <input
            id="revealDuration"
            type="number"
            value={revealDuration}
            onChange={(e) => {
              setRevealDuration(e.target.value);
              if (errors.revealDuration) {
                setErrors(prev => ({ ...prev, revealDuration: undefined }));
              }
            }}
            min="1"
            max="168"
            disabled={loading}
          />
          {errors.revealDuration && (
            <div className="form-error">❌ {errors.revealDuration}</div>
          )}
          <small>How long bidders have to reveal their bids (1-168 hours)</small>
        </div>

        <div className="alert alert-warning">
          <p><strong>⚠️ Important:</strong></p>
          <ul>
            <li>Make sure you have the selling tokens in your wallet</li>
            <li>Tokens will be locked until the auction completes</li>
            <li>You cannot cancel the auction once created</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !publicKey}
            className={`btn-primary btn-large ${loading ? 'btn-loading' : ''}`}
          >
            {loading ? 'Creating Auction...' : '✨ Create Auction'}
          </button>
        </div>
      </form>
    </div>
  );
};
