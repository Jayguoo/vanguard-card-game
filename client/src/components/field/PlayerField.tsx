import React from 'react';
import {
  PublicPlayerState,
  MyPlayerState,
  PublicCardInstance,
  FieldPosition,
} from '../../shared/types';
import { FieldCircle } from './FieldCircle';
import './PlayerField.css';

interface PlayerFieldProps {
  playerState: PublicPlayerState | MyPlayerState;
  isOpponent: boolean;
  onCircleClick?: (position: FieldPosition) => void;
  onCardClick?: (position: FieldPosition, card: PublicCardInstance) => void;
  onCardRightClick?: (position: FieldPosition, card: PublicCardInstance, e: React.MouseEvent) => void;
  highlightedPositions?: FieldPosition[];
  selectedPosition?: FieldPosition | null;
  powerOverrides?: Partial<Record<FieldPosition, number>>;
}

const POSITION_LABELS: Record<FieldPosition, string> = {
  'front-left': 'FL',
  'vanguard': 'VG',
  'front-right': 'FR',
  'back-left': 'BL',
  'back-center': 'BC',
  'back-right': 'BR',
};

export const PlayerField: React.FC<PlayerFieldProps> = ({
  playerState,
  isOpponent,
  onCircleClick,
  onCardClick,
  onCardRightClick,
  highlightedPositions = [],
  selectedPosition = null,
  powerOverrides = {},
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
    <FieldCircle
      key={position}
      card={getCard(position)}
      label={POSITION_LABELS[position]}
      position={position}
      isOpponent={isOpponent}
      isHighlighted={isHighlighted(position)}
      isSelected={selectedPosition === position}
      powerOverride={powerOverrides[position]}
      onClick={() => handleCircleClick(position)}
      onCardClick={(card) => handleCardClick(position, card)}
      onCardRightClick={onCardRightClick ? (card, e) => onCardRightClick(position, card, e) : undefined}
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
};
