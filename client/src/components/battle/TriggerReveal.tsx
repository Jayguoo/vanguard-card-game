import React from 'react';
import { PublicCardInstance } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import './TriggerReveal.css';

interface TriggerRevealProps {
  card: PublicCardInstance | null;
  triggerContext: 'drive' | 'damage' | null;
  isExiting?: boolean;
}

export const TriggerReveal: React.FC<TriggerRevealProps> = ({
  card,
  triggerContext,
  isExiting = false,
}) => {
  if (!card) return null;

  const def = CARD_DATABASE[card.cardId];
  if (!def) return null;

  const triggerType = def.triggerType;
  const triggerLabel = triggerType ? getTriggerLabel(triggerType) : null;
  const contextLabel = triggerContext === 'drive' ? 'Drive Check' : triggerContext === 'damage' ? 'Damage Check' : 'Check';

  return (
    <div className={`trigger-reveal-overlay ${isExiting ? 'trigger-reveal-overlay--exiting' : ''}`}>
      <div className={`trigger-reveal ${isExiting ? 'trigger-reveal--exiting' : ''}`}>
        <div className="trigger-reveal__context">{contextLabel}</div>

        <div className={`trigger-reveal__card-frame ${triggerType ? `trigger-reveal__card-frame--${triggerType}` : ''}`}>
          <img
            src={def.imagePath}
            alt={def.name}
            className="trigger-reveal__card-image"
            draggable={false}
          />
        </div>

        <div className="trigger-reveal__info">
          <div className="trigger-reveal__name">{def.name}</div>
          {triggerLabel && (
            <div className={`trigger-reveal__trigger-badge trigger-reveal__trigger-badge--${triggerType}`}>
              {triggerLabel} Trigger
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getTriggerLabel(type: string): string {
  switch (type) {
    case 'critical': return 'Critical';
    case 'draw': return 'Draw';
    case 'stand': return 'Stand';
    case 'heal': return 'Heal';
    default: return type;
  }
}
