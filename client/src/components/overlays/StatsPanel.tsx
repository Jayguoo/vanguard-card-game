import { useState, useEffect } from 'react';
import { UserStats } from '../../shared/types';
import './StatsPanel.css';

interface StatsPanelProps {
  onClose: () => void;
  getStats: (() => Promise<UserStats | null>) | null;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ onClose, getStats }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isGuest = !getStats;

  useEffect(() => {
    if (!getStats) {
      setIsLoading(false);
      return;
    }
    getStats().then(result => {
      setStats(result);
      setIsLoading(false);
    });
  }, [getStats]);

  const streakText = stats
    ? stats.currentStreak > 0
      ? `${stats.currentStreak}W`
      : stats.currentStreak < 0
        ? `${Math.abs(stats.currentStreak)}L`
        : '-'
    : '-';

  return (
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-panel" onClick={(e) => e.stopPropagation()}>
        <div className="stats-header">
          <h3>Fighter Stats</h3>
          <button className="stats-close" onClick={onClose}>&times;</button>
        </div>

        {isGuest ? (
          <div className="stats-empty">Log in to track your stats.</div>
        ) : isLoading ? (
          <div className="stats-loading">Loading stats...</div>
        ) : !stats ? (
          <div className="stats-empty">No stats available.</div>
        ) : (
          <div className="stats-grid">
            <div className="stats-card">
              <span className="stats-card__value">{stats.gamesPlayed}</span>
              <span className="stats-card__label">Games Played</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__value stats-card__value--win">{stats.wins}</span>
              <span className="stats-card__label">Wins</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__value stats-card__value--loss">{stats.losses}</span>
              <span className="stats-card__label">Losses</span>
            </div>
            <div className="stats-card">
              <span className="stats-card__value">{stats.winRate}%</span>
              <span className="stats-card__label">Win Rate</span>
            </div>
            <div className="stats-card stats-card--wide">
              <span className="stats-card__value">{streakText}</span>
              <span className="stats-card__label">Current Streak</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
