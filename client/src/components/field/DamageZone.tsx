import React from 'react';
import { PublicCardInstance } from '../../shared/types';
import { VanguardCard } from '../cards/VanguardCard';
import './DamageZone.css';

interface DamageZoneProps {
  cards: PublicCardInstance[];
  label: string;
  onClick?: () => void;
}

export const DamageZone: React.FC<DamageZoneProps> = ({ cards, label, onClick }) => {
  const count = cards.length;
  const isDanger = count >= 6;

  const classes = [
    'damage-zone',
    isDanger ? 'damage-zone--danger' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="damage-zone__count-badge">
        <span className="damage-zone__count">{count}</span>
      </div>
      <div
        className="damage-zone__stack"
        style={cards.length > 1 ? { height: `${80 + (cards.length - 1) * 25}px` } : undefined}
      >
        {cards.length === 0 ? (
          <div className="damage-zone__empty">{label}</div>
        ) : (
          cards.map((card, index) => (
            <div
              key={card.instanceId}
              className="damage-zone__card"
              style={{ top: `${index * 25}px`, zIndex: index }}
            >
              <VanguardCard
                card={card}
                size="medium"
                showPowerOverlay={false}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
