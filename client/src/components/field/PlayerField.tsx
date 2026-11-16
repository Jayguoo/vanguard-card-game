import React from 'react';
import {
  PublicPlayerState,
  MyPlayerState,
  PublicCardInstance,
  FieldPosition,
} from '../../shared/types';
import { CardSlot } from './FieldCircle';
import { SoulViewer } from './SoulViewer';
import './PlayerField.css';

interface PlayerFieldProps {
  playerState: PublicPlayerState | MyPlayerState;
  isOpponent: boolean;
  onCircleClick?: (position: FieldPosition) => void;
  onCardClick?: (position: FieldPosition, card: PublicCardInstance) => void;
  onCardRightClick?: (position: FieldPosition, card: PublicCardInstance, e: React.MouseEvent) => void;
  onCardHover?: (card: PublicCardInstance | null) => void;
  highlightedPositions?: FieldPosition[];
  abilityGlowPositions?: FieldPosition[];
  selectedPosition?: FieldPosition | null;
  powerOverrides?: Partial<Record<FieldPosition, number>>;
  dropTargetPositions?: FieldPosition[];
  onDrop?: (position: FieldPosition) => void;
}

const POSITION_LABELS: Record<FieldPosition, string> = {
  'front-left': 'R',
  'vanguard': 'V',
  'front-right': 'R',
  'back-left': 'R',
  'back-center': 'R',
  'back-right': 'R',
};

export const PlayerField = React.memo<PlayerFieldProps>(({
  playerState,
  isOpponent,
  onCircleClick,
  onCardClick,
  onCardRightClick,
  onCardHover,
  highlightedPositions = [],
  abilityGlowPositions = [],
  selectedPosition = null,
  powerOverrides = {},
  dropTargetPositions = [],
  onDrop,
}) => {
  const getCard = (position: FieldPosition): PublicCardInstance | null => {
    if (position === 'vanguard') {
      return playerState.vanguardCircle;
    }
    return playerState.rearGuards[position as keyof typeof playerState.rearGuards] ?? null;
  };

  const isHighlighted = (position: FieldPosition): boolean => {
    return highlightedPositions.includes(position);
  };

  const hasAbilityGlow = (position: FieldPosition): boolean => {
    return abilityGlowPositions.includes(position);
  };

  const handleCircleClick = (position: FieldPosition) => {
    if (onCircleClick) {
      onCircleClick(position);
    }
  };

  const handleCardClick = (position: FieldPosition, card: PublicCardInstance) => {
    if (onCardClick) {
      onCardClick(position, card);
    }
  };

  const renderCircle = (position: FieldPosition) => (
    <CardSlot
      key={position}
      card={getCard(position)}
      label={POSITION_LABELS[position]}
      position={position}
      isOpponent={isOpponent}
      isHighlighted={isHighlighted(position)}
      isSelected={selectedPosition === position}
      hasAbilityGlow={hasAbilityGlow(position)}
      isDropTarget={dropTargetPositions.includes(position)}
      powerOverride={powerOverrides[position]}
      onClick={() => handleCircleClick(position)}
      onCardClick={(card) => handleCardClick(position, card)}
      onCardRightClick={onCardRightClick ? (card, e) => onCardRightClick(position, card, e) : undefined}
      onCardHover={onCardHover}
      onDrop={onDrop}
      underlay={position === 'vanguard' ? (
        <SoulViewer
          count={playerState.soulCount}
          cards={'soul' in playerState ? playerState.soul : undefined}
          isOpponent={isOpponent}
        />
      ) : undefined}
    />
  );

  const backRow = (
    <div className="player-field__row player-field__row--back">
      {renderCircle('back-left')}
      {renderCircle('back-center')}
      {renderCircle('back-right')}
    </div>
  );

  const frontRow = (
    <div className="player-field__row player-field__row--front">
      {renderCircle('front-left')}
      {renderCircle('vanguard')}
      {renderCircle('front-right')}
    </div>
  );

  const classes = [
    'player-field',
    isOpponent ? 'player-field--opponent' : 'player-field--self',
  ].join(' ');

  return (
    <div className={classes}>
      {isOpponent ? (
        <>
          {backRow}
          {frontRow}
        </>
      ) : (
        <>
          {backRow}
          {frontRow}
        </>
      )}
    </div>
  );
});
PlayerField.displayName = 'PlayerField';
