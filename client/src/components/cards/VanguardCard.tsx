import React from 'react';
import { PublicCardInstance } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import './VanguardCard.css';

interface VanguardCardProps {
  card: PublicCardInstance | null;
  faceDown?: boolean;
  rested?: boolean;
  selected?: boolean;
  highlighted?: boolean;
  abilityGlow?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRightClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  size?: 'tiny' | 'small' | 'medium' | 'large';
  showPowerOverlay?: boolean;
  showShieldOverlay?: boolean;
  powerOverride?: number;
  className?: string;
}

export const VanguardCard: React.FC<VanguardCardProps> = ({
  card,
  faceDown = false,
  rested = false,
  selected = false,
  highlighted = false,
  abilityGlow = false,
  disabled = false,
  onClick,
  onRightClick,
  onMouseEnter,
  onMouseLeave,
  size = 'medium',
  showPowerOverlay = true,
  showShieldOverlay = false,
  powerOverride,
  className = '',
}) => {
  if (!card) return null;

  const def = CARD_DATABASE[card.cardId];
  if (!def) return null;

  const showFaceDown = faceDown || !card.isFaceUp;
  const isRested = rested || card.isRested;
  const basePower = def.power + card.turnPowerModifier;
  const totalPower = powerOverride ?? basePower;
  const hasPowerBuff = totalPower > basePower || card.turnPowerModifier > 0;

  const classes = [
    'vg-card',
    `vg-card--${size}`,
    isRested ? 'vg-card--rested' : '',
    selected ? 'vg-card--selected' : '',
    highlighted ? 'vg-card--highlighted' : '',
    abilityGlow ? 'vg-card--ability-glow' : '',
    disabled ? 'vg-card--disabled' : '',
    onClick ? 'vg-card--clickable' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onClick={disabled ? undefined : onClick}
      onContextMenu={onRightClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {showFaceDown ? (
        <img
          src="/cards/card-back.webp"
          alt="Card Back"
          className="vg-card__image"
          draggable={false}
        />
      ) : (
        <>
          <img
            src={def.imagePath}
            alt={def.name}
            className="vg-card__image"
            draggable={false}
          />
          {showPowerOverlay && (
            <div className={`vg-card__power ${hasPowerBuff ? 'vg-card__power--buffed' : ''}`}>
              {totalPower}
            </div>
          )}
          {showShieldOverlay && def.shield > 0 && (
            <div className="vg-card__shield">
              {def.shield}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const CardBack: React.FC<{ size?: 'tiny' | 'small' | 'medium' | 'large'; count?: number; onClick?: () => void; isOpponent?: boolean }> = ({
  size = 'medium',
  count,
  onClick,
  isOpponent,
}) => {
  return (
    <div className={`vg-card vg-card--${size} ${onClick ? 'vg-card--clickable' : ''}`} onClick={onClick}>
      <img
        src="/cards/card-back.webp"
        alt="Card Back"
        className="vg-card__image"
        draggable={false}
        style={isOpponent ? { transform: 'rotate(180deg)' } : undefined}
      />
      {count !== undefined && (
        <div className="vg-card__count">{count}</div>
      )}
    </div>
  );
};

