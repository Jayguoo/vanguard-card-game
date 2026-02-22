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
  hasAbilityGlow?: boolean;
  isDropTarget?: boolean;
  powerOverride?: number;
  onClick?: () => void;
  onCardClick?: (card: PublicCardInstance) => void;
  onCardRightClick?: (card: PublicCardInstance, e: React.MouseEvent) => void;
  onCardHover?: (card: PublicCardInstance | null) => void;
  onDrop?: (position: FieldPosition) => void;
}

export const FieldCircle: React.FC<FieldCircleProps> = ({
  card,
  label,
  position,
  isOpponent = false,
  isHighlighted = false,
  isSelected = false,
  hasAbilityGlow = false,
  isDropTarget = false,
  powerOverride,
  onClick,
  onCardClick,
  onCardRightClick,
  onCardHover,
  onDrop,
}) => {
  // Track card entry for animation
  const prevCardIdRef = useRef<string | null>(null);
  const [isCardEntering, setIsCardEntering] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDropTarget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isDropTarget && onDrop) {
      onDrop(position);
    }
  };

  const classes = [
    'field-circle',
    `field-circle--${position}`,
    isHighlighted ? 'field-circle--highlighted' : '',
    isSelected ? 'field-circle--selected' : '',
    (onClick || (card && onCardClick)) ? 'field-circle--clickable' : '',
    isCardEntering ? 'field-circle--card-entering' : '',
    isDropTarget ? 'field-circle--drop-target' : '',
    isDragOver ? 'field-circle--drag-over' : '',
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {card ? (
        <VanguardCard
          card={card}
          size="medium"
          selected={isSelected}
          highlighted={isHighlighted}
          abilityGlow={hasAbilityGlow}
          showPowerOverlay={true}
          powerOverride={powerOverride}
          onMouseEnter={onCardHover ? () => onCardHover(card) : undefined}
          onMouseLeave={onCardHover ? () => onCardHover(null) : undefined}
        />
      ) : (
        <div className="field-circle__empty">
          <span className="field-circle__label">{label}</span>
        </div>
      )}
    </div>
  );
};
