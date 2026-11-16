import React, { useRef, useState, useEffect } from 'react';
import { PublicCardInstance, FieldPosition } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
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
  underlay?: React.ReactNode;
  onClick?: () => void;
  onCardClick?: (card: PublicCardInstance) => void;
  onCardRightClick?: (card: PublicCardInstance, e: React.MouseEvent) => void;
  onCardHover?: (card: PublicCardInstance | null) => void;
  onDrop?: (position: FieldPosition) => void;
}

export const CardSlot = React.memo<FieldCircleProps>(({
  card,
  label,
  position,
  isOpponent = false,
  isHighlighted = false,
  isSelected = false,
  hasAbilityGlow = false,
  isDropTarget = false,
  powerOverride,
  underlay,
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

  const cardDefinition = card ? CARD_DATABASE[card.cardId] : undefined;
  const displayedPower = card && cardDefinition
    ? powerOverride ?? cardDefinition.power
      + card.turnPowerModifier
      + card.battlePowerModifier
      + card.continuousPowerModifier
    : 0;
  const powerDelta = cardDefinition ? displayedPower - cardDefinition.power : 0;
  const transformClasses = [
    'field-circle__card-transform',
    isOpponent ? 'field-circle__card-transform--opponent' : '',
    card?.isRested ? 'field-circle__card-transform--rested' : '',
  ].filter(Boolean).join(' ');

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
      {underlay && <div className="field-circle__underlay">{underlay}</div>}
      {card ? (
        <>
          <div className={transformClasses}>
            <VanguardCard
              card={card}
              size="medium"
              selected={isSelected}
              highlighted={isHighlighted}
              abilityGlow={hasAbilityGlow}
              showPowerOverlay={false}
              rotateWithState={false}
              onMouseEnter={onCardHover ? () => onCardHover(card) : undefined}
              onMouseLeave={onCardHover ? () => onCardHover(null) : undefined}
            />
          </div>
          <div className="field-circle__telemetry" aria-label={`${card.isRested ? 'Rest' : 'Stand'}, ${displayedPower} power`}>
            <span className={`field-circle__state field-circle__state--${card.isRested ? 'rest' : 'stand'}`}>
              {card.isRested ? 'REST' : 'STAND'}
            </span>
            <strong>{displayedPower}</strong>
            {powerDelta !== 0 && (
              <span className={powerDelta > 0 ? 'field-circle__delta--positive' : 'field-circle__delta--negative'}>
                {powerDelta > 0 ? '+' : ''}{powerDelta}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="field-circle__empty">
          <span className="field-circle__label">{label}</span>
        </div>
      )}
    </div>
  );
});
CardSlot.displayName = 'CardSlot';

export const FieldCircle = CardSlot;
