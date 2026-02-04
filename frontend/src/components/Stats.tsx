import type { FC } from 'react';
import './Stats.css';

interface Stat {
  value: string;
  label: string;
  icon: string;
}

const stats: Stat[] = [
  {
    value: '0',
    label: 'Active Auctions',
    icon: '🎯'
  },
  {
    value: '0 SOL',
    label: 'Total Volume',
    icon: '💰'
  },
  {
    value: '0',
    label: 'Total Bids',
    icon: '📊'
  },
  {
    value: '100%',
    label: 'Privacy Guaranteed',
    icon: '🔒'
  }
];

export const Stats: FC = () => {
  return (
    <section className="stats-section">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
