import React, { useRef, useState, useEffect } from 'react';
import { PublicCardInstance, FieldPosition } from '../../shared/types';
import { VanguardCard } from '../cards/VanguardCard';
import './FieldCircle.css';

interface FieldCircleProps {
  card: PublicCardInstance | null;
  label: string;
  position: FieldPosition;
  isOpponent?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  powerOverride?: number;
  onClick?: () => void;
  onCardClick?: (card: PublicCardInstance) => void;
  onCardRightClick?: (card: PublicCardInstance, e: React.MouseEvent) => void;
}

export const FieldCircle: React.FC<FieldCircleProps> = ({
  card,
  label,
  position,
  isOpponent = false,
  isHighlighted = false,
  isSelected = false,
  powerOverride,
  onClick,
  onCardClick,
  onCardRightClick,
}) => {
  // Track card entry for animation
  const prevCardIdRef = useRef<string | null>(null);
  const [isCardEntering, setIsCardEntering] = useState(false);

  useEffect(() => {
    const currentId = card?.instanceId || null;
    const prevId = prevCardIdRef.current;

    // New card appeared (was null or different card)
    if (currentId && currentId !== prevId) {
      setIsCardEntering(true);
      const timer = setTimeout(() => setIsCardEntering(false), 300);
      prevCardIdRef.current = currentId;
      return () => clearTimeout(timer);
    }

    if (!currentId) {
      prevCardIdRef.current = null;
    }
  }, [card]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (card && onCardClick) {
      onCardClick(card);
    }
  };

  const classes = [
    'field-circle',
    `field-circle--${position}`,
    isHighlighted ? 'field-circle--highlighted' : '',
    isSelected ? 'field-circle--selected' : '',
    (onClick || (card && onCardClick)) ? 'field-circle--clickable' : '',
    isCardEntering ? 'field-circle--card-entering' : '',
  ].filter(Boolean).join(' ');

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (card && onCardRightClick) {
      onCardRightClick(card, e);
    }
  };

  return (
    <div
      className={classes}
      data-position={position}
      data-owner={isOpponent ? 'opponent' : 'self'}
      onClick={handleClick}
      onContextMenu={handleRightClick}
    >
      {card ? (
        <VanguardCard
          card={card}
          size="medium"
          selected={isSelected}
          highlighted={isHighlighted}
          showPowerOverlay={true}
          powerOverride={powerOverride}
        />
      ) : (
        <div className="field-circle__empty">
          <span className="field-circle__label">{label}</span>
        </div>
      )}
    </div>
  );
};
