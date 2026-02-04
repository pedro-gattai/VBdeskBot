import type { FC } from 'react';
import { Features } from './Features';
import { Stats } from './Stats';
import './LandingPage.css';

export const LandingPage: FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Private OTC Trading
            <span className="gradient-text">for Everyone</span>
          </h1>
          <p className="hero-subtitle">
            Every OTC trade on Solana exposes your strategy to the world. 
            Front-runners watch your wallet. MEV bots extract your alpha. 
            Competitors copy your moves.
          </p>
          <p className="hero-tagline">
            <strong>VB Desk changes that.</strong> Sealed-bid auctions with cryptographic commitments. 
            Your strategy stays secret until everyone commits.
          </p>
          <div className="hero-cta">
            <p className="cta-text">
              🔒 Connect your wallet to start trading privately →
            </p>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card">
            <div className="card-icon">🔐</div>
            <div className="card-content">
              <h3>SHA-256 Commitments</h3>
              <p>Your bid stays hidden until reveal</p>
            </div>
          </div>
          <div className="floating-card">
            <div className="card-icon">⚡</div>
            <div className="card-content">
              <h3>Instant Settlement</h3>
              <p>On-chain execution in seconds</p>
            </div>
          </div>
          <div className="floating-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Fair Discovery</h3>
              <p>True market price, no manipulation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <Stats />

      {/* Problem/Solution Section */}
      <section className="problem-solution">
        <div className="section-header">
          <h2>Why Current Solutions Fail</h2>
          <p>Traditional OTC, DEXs, and P2P trading all leak information</p>
        </div>
        
        <div className="comparison-grid">
          <div className="comparison-card bad">
            <h3>❌ Traditional OTC Desks</h3>
            <ul>
              <li>Centralized - requires trust</li>
              <li>High fees (often 1-3%)</li>
              <li>Opaque pricing</li>
              <li>You never know if you got the best deal</li>
            </ul>
          </div>

          <div className="comparison-card bad">
            <h3>❌ DEXs (Jupiter, Raydium)</h3>
            <ul>
              <li>Public orderbooks = front-running paradise</li>
              <li>Large trades suffer massive slippage</li>
              <li>MEV bots sandwich your transactions</li>
              <li>Everyone sees your strategy</li>
            </ul>
          </div>

          <div className="comparison-card bad">
            <h3>❌ P2P Trading</h3>
            <ul>
              <li>Counterparty risk - scams are common</li>
              <li>No price discovery</li>
              <li>Manual coordination (slow & risky)</li>
              <li>No guarantees or recourse</li>
            </ul>
          </div>

          <div className="comparison-card good">
            <h3>✅ VB Desk Solution</h3>
            <ul>
              <li><strong>Privacy:</strong> SHA-256 commitments hide bids</li>
              <li><strong>Speed:</strong> On-chain settlement in seconds</li>
              <li><strong>Best Price:</strong> Competitive sealed bidding</li>
              <li><strong>Security:</strong> Trustless escrow, no counterparty risk</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <Features />

      {/* How It Works */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How Sealed-Bid Auctions Work</h2>
          <p>Three-phase process ensures privacy and fairness</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>🔒 Commit Phase</h3>
              <p><strong>Bidders submit encrypted bids</strong></p>
              <ul>
                <li>Generate a random 32-byte nonce (secret salt)</li>
                <li>Create commitment: <code>SHA256(price || nonce)</code></li>
                <li>Submit commitment + deposit to blockchain</li>
                <li><strong>Nobody can see your actual bid price yet!</strong></li>
              </ul>
              <div className="step-warning">
                ⚠️ <strong>Critical:</strong> Save your nonce! You'll need it for the reveal phase. 
                If you lose it, you forfeit your deposit.
              </div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>👁️ Reveal Phase</h3>
              <p><strong>Bidders reveal their actual bids</strong></p>
              <ul>
                <li>Submit your actual price + nonce</li>
                <li>Smart contract verifies: <code>SHA256(price || nonce) == commitment</code></li>
                <li>If it matches, your bid is accepted</li>
                <li>If not, you're disqualified (prevents cheating)</li>
              </ul>
              <div className="step-info">
                💡 This is why sealed-bid auctions are fair: you can't change your bid after 
                seeing others' bids, and you can't lie about what you bid.
              </div>
            </div>
          </div>

          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>✅ Settlement</h3>
              <p><strong>Automatic winner selection & payment</strong></p>
              <ul>
                <li>Highest bidder wins the auction</li>
                <li><strong>Winner pays the second-highest price</strong> (Vickrey auction)</li>
                <li>Tokens automatically transferred via escrow PDA</li>
                <li>Losing bidders' deposits refunded</li>
              </ul>
              <div className="step-success">
                ✨ <strong>Why second-price?</strong> Incentive-compatible design. 
                Bidders are encouraged to bid their true valuation, 
                not try to guess what others will bid.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-section">
        <div className="section-header">
          <h2>Built with Battle-Tested Tech</h2>
        </div>
        <div className="trust-grid">
          <div className="trust-item">
            <div className="trust-icon">🏆</div>
            <h3>3x Hackathon Winners</h3>
            <p>Stellar, TON, Stacks - proven track record</p>
          </div>
          <div className="trust-item">
            <div className="trust-icon">⚙️</div>
            <h3>Anchor Framework</h3>
            <p>Battle-tested Solana smart contract framework</p>
          </div>
          <div className="trust-item">
            <div className="trust-icon">🔐</div>
            <h3>Proven Cryptography</h3>
            <p>SHA-256 commitments used in production systems</p>
          </div>
          <div className="trust-item">
            <div className="trust-icon">🤖</div>
            <h3>Agent-Ready</h3>
            <p>AgentList reputation & Sipher privacy integrations</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to Trade Privately?</h2>
          <p>
            OTC trading deserves the same privacy as cash. 
            <strong>VB Desk brings it to Solana.</strong>
          </p>
          <div className="cta-button-group">
            <p className="cta-instruction">
              Connect your wallet above to get started 👆
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
