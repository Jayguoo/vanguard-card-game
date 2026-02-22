import React from 'react';
import { PublicCardInstance } from '../../shared/types';
import { VanguardCard } from '../cards/VanguardCard';
import './DropZone.css';

interface DropZoneProps {
  cards: PublicCardInstance[];
  label: string;
  isOpponent?: boolean;
  onClick?: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ cards, label, isOpponent = false, onClick }) => {
  const count = cards.length;
  const topCard = count > 0 ? cards[count - 1] : null;

  return (
    <div className="drop-zone" onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="drop-zone__pile">
        {topCard ? (
          <div className={`drop-zone__top-card ${isOpponent ? 'drop-zone__top-card--opponent' : ''}`}>
            <VanguardCard
              card={topCard}
              size="medium"
              showPowerOverlay={false}
            />
            {count > 1 && (
              <div className="drop-zone__count-overlay">{count}</div>
            )}
          </div>
        ) : (
          <div className="drop-zone__empty">
            <span className="drop-zone__empty-text">{label}</span>
          </div>
        )}
      </div>
    </div>
  );
};
