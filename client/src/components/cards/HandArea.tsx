import React, { useRef, useState, useEffect } from 'react';
import { PublicCardInstance } from '../../shared/types';
import { VanguardCard } from './VanguardCard';
import './HandArea.css';

interface HandAreaProps {
  cards: PublicCardInstance[];
  selectedCardId: string | null;
  highlightedCardIds?: string[];
  onCardClick?: (card: PublicCardInstance) => void;
  onCardRightClick?: (card: PublicCardInstance, event: React.MouseEvent) => void;
}

export const HandArea: React.FC<HandAreaProps> = ({
  cards,
  selectedCardId,
  highlightedCardIds = [],
  onCardClick,
  onCardRightClick,
}) => {
  const cardCount = cards.length;

  // Track entering cards for draw animation
  const prevCardIdsRef = useRef<Set<string>>(new Set());
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(cards.map(c => c.instanceId));
    const prevIds = prevCardIdsRef.current;
    const newIds = new Set<string>();

    currentIds.forEach(id => {
      if (!prevIds.has(id)) {
        newIds.add(id);
      }
    });

    prevCardIdsRef.current = currentIds;

    if (newIds.size > 0) {
      setEnteringIds(newIds);
      const timer = setTimeout(() => setEnteringIds(new Set()), 400);
      return () => clearTimeout(timer);
    }
  }, [cards]);

  // Fan layout calculations
  const getCardStyle = (index: number): React.CSSProperties => {
    if (cardCount <= 1) {
      return {};
    }

    // Maximum fan spread and rotation
    const maxTotalAngle = Math.min(cardCount * 3, 30); // degrees total spread
    const maxTotalOffset = Math.min(cardCount * 2, 20); // px vertical arc

    const normalizedPos = cardCount > 1 ? (index / (cardCount - 1)) * 2 - 1 : 0; // -1 to 1
    const angle = normalizedPos * (maxTotalAngle / 2);
    const verticalOffset = Math.abs(normalizedPos) * maxTotalOffset;

    // Overlap: shift each card to the left for tighter spacing
    const overlapOffset = (index - (cardCount - 1) / 2) * 48;

    const isSelected = cards[index] && cards[index].instanceId === selectedCardId;

    return {
      transform: `translateX(${overlapOffset}px) translateY(${isSelected ? -16 + verticalOffset : verticalOffset}px) rotate(${angle}deg)`,
      zIndex: index,
    };
  };

  return (
    <div className="hand-area">
      <div className="hand-area__cards">
        {cards.map((card, index) => {
          const isSelected = card.instanceId === selectedCardId;
          const isHighlighted = highlightedCardIds.includes(card.instanceId);
          const isEntering = enteringIds.has(card.instanceId);

          return (
            <div
              key={card.instanceId}
              className={[
                'hand-area__card-wrapper',
                isSelected ? 'hand-area__card-wrapper--selected' : '',
                isEntering ? 'hand-area__card-wrapper--entering' : '',
              ].filter(Boolean).join(' ')}
              style={getCardStyle(index)}
            >
              <VanguardCard
                card={card}
                size="medium"
                selected={isSelected}
                highlighted={isHighlighted}
                onClick={onCardClick ? () => onCardClick(card) : undefined}
                onRightClick={
                  onCardRightClick
                    ? (e) => {
                        e.preventDefault();
                        onCardRightClick(card, e);
                      }
                    : undefined
                }
                showPowerOverlay={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
