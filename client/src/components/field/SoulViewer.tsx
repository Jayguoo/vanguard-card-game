import React from 'react';
import { PublicCardInstance } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import './SoulViewer.css';

interface SoulViewerProps {
  count: number;
  cards?: PublicCardInstance[];
  isOpponent?: boolean;
}

export const SoulViewer = React.memo<SoulViewerProps>(({ count, cards, isOpponent = false }) => {
  const visibleCards = Array.from({ length: Math.min(count, 3) }, (_, index) => {
    const card = cards?.[Math.max(0, cards.length - 3) + index];
    const definition = card ? CARD_DATABASE[card.cardId] : undefined;
    return {
      key: card?.instanceId ?? `hidden-soul-${index}`,
      imagePath: definition?.imagePath ?? '/cards/card-back.webp',
      name: definition?.name ?? 'Hidden soul card',
    };
  });

  return (
    <div className={`soul-viewer ${isOpponent ? 'soul-viewer--opponent' : ''}`} aria-label={`Soul, ${count} cards`}>
      <div className="soul-viewer__stack" aria-hidden="true">
        {visibleCards.map((card, index) => (
          <img
            key={card.key}
            className="soul-viewer__stack-card"
            src={card.imagePath}
            alt=""
            style={{ '--soul-index': index } as React.CSSProperties}
            draggable={false}
          />
        ))}
      </div>
      <span className="soul-viewer__counter">
        <span>SOUL</span>
        <strong>{count}</strong>
      </span>
    </div>
  );
});
SoulViewer.displayName = 'SoulViewer';
