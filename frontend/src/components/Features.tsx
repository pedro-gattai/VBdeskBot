import type { FC } from 'react';
import './Features.css';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: '🔒',
    title: 'Privacy-Preserving',
    description: 'Bids are cryptographically sealed using SHA-256 commitments. No one can see your bid until reveal phase.'
  },
  {
    icon: '⚖️',
    title: 'Fair Pricing',
    description: 'Winner pays second-highest price (Vickrey auction). Incentivizes truthful bidding without strategic games.'
  },
  {
    icon: '⛓️',
    title: 'Trustless & Transparent',
    description: 'All logic enforced by Solana smart contracts. No centralized authority can manipulate outcomes.'
  },
  {
    icon: '⚡',
    title: 'Fast & Low-Cost',
    description: 'Built on Solana for sub-second finality and minimal transaction fees (<$0.01 per action).'
  },
  {
    icon: '🔐',
    title: 'Secure Commitments',
    description: 'Uses Boneh commitment scheme with cryptographic proofs. Impossible to change bid after submission.'
  },
  {
    icon: '💎',
    title: 'Real Value',
    description: 'Perfect for NFT auctions, token sales, or any asset where strategic bidding undermines fair pricing.'
  }
];

export const Features: FC = () => {
  return (
    <section className="features-section">
      <div className="features-header">
        <h2>Why Sealed-Bid Auctions?</h2>
        <p className="features-subtitle">
          Traditional auctions suffer from strategic bidding, front-running, and winner's curse. 
          VB Desk solves this with cryptographic commitments and Vickrey pricing.
        </p>
      </div>
      
      <div className="features-grid">
        {features.map((feature, index) => (
          <div key={index} className="feature-card">
            <div className="feature-icon">{feature.icon}</div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="features-cta">
        <h3>Ready to experience fair auctions?</h3>
        <p>Connect your wallet and browse active auctions, or create your own.</p>
      </div>
    </section>
  );
};
