import React from 'react';
import { Card as CardType } from '../shared/types';
import './Card.css';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: '#e53935',
  diamonds: '#e53935',
  clubs: '#212121',
  spades: '#212121',
};

export const Card: React.FC<CardProps> = ({ card, onClick, disabled, selected }) => {
  const symbol = SUIT_SYMBOLS[card.suit];
  const color = SUIT_COLORS[card.suit];

  return (
    <div
      className={`card ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={{ color }}
    >
      <div className="card-corner top-left">
        <span className="card-value">{card.value}</span>
        <span className="card-suit">{symbol}</span>
      </div>
      <div className="card-center">
        <span className="card-suit-large">{symbol}</span>
      </div>
      <div className="card-corner bottom-right">
        <span className="card-value">{card.value}</span>
        <span className="card-suit">{symbol}</span>
      </div>
    </div>
  );
};

export const CardBack: React.FC = () => {
  return (
    <div className="card card-back">
      <div className="card-back-pattern">🂠</div>
    </div>
  );
};
