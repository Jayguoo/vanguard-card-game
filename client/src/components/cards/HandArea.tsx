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
  onCardHover?: (card: PublicCardInstance | null) => void;
  onDragStart?: (card: PublicCardInstance) => void;
  onDragEnd?: () => void;
}

export const HandArea: React.FC<HandAreaProps> = ({
  cards,
  selectedCardId,
  highlightedCardIds = [],
  onCardClick,
  onCardRightClick,
  onCardHover,
  onDragStart,
  onDragEnd,
}) => {
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

  // Flat hand layout — no curve, no rotation
  const getCardStyle = (index: number): React.CSSProperties => {
    const isSelected = cards[index] && cards[index].instanceId === selectedCardId;

    return {
      transform: isSelected ? 'translateY(-16px)' : undefined,
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
          const isDraggable = isHighlighted && !!onDragStart;

          return (
            <div
              key={card.instanceId}
              className={[
                'hand-area__card-wrapper',
                isSelected ? 'hand-area__card-wrapper--selected' : '',
                isEntering ? 'hand-area__card-wrapper--entering' : '',
                isDraggable ? 'hand-area__card-wrapper--draggable' : '',
              ].filter(Boolean).join(' ')}
              style={getCardStyle(index)}
              draggable={isDraggable}
              onDragStart={isDraggable ? (e) => {
                e.dataTransfer.setData('text/plain', card.instanceId);
                e.dataTransfer.effectAllowed = 'move';
                onDragStart(card);
              } : undefined}
              onDragEnd={onDragEnd}
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
                onMouseEnter={onCardHover ? () => onCardHover(card) : undefined}
                onMouseLeave={onCardHover ? () => onCardHover(null) : undefined}
                showPowerOverlay={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
