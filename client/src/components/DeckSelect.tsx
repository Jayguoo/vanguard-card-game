import React from 'react';
import { PublicGameRoom, DeckId } from '../shared/types';
import { DECK_COMPOSITIONS, CARD_DATABASE } from '../shared/cardDatabase';
import './DeckSelect.css';

interface DeckSelectProps {
  room: PublicGameRoom;
  myId: string;
  onSelectDeck: (deckId: DeckId) => void;
  onReady: () => void;
  onStartGame: () => void;
  onLeave: () => void;
}

const DECK_IDS: DeckId[] = ['td01-blaster-blade', 'td02-dragonic-overlord'];

export const DeckSelect: React.FC<DeckSelectProps> = ({
  room,
  myId,
  onSelectDeck,
  onReady,
  onStartGame,
  onLeave,
}) => {
  const myPlayer = room.players.find((p) => p.id === myId);
  const isHost = myPlayer?.isHost ?? false;
  const myDeckId = myPlayer?.deckId ?? null;
  const isReady = myPlayer?.isReady ?? false;
  const allReady = room.players.length === 2 && room.players.every((p) => p.isReady);

  // Determine which decks are already taken by the opponent
  const takenDeckIds = new Set<DeckId>();
  for (const player of room.players) {
    if (player.id !== myId && player.deckId) {
      takenDeckIds.add(player.deckId);
    }
  }

  return (
    <div className="deck-select">
      <div className="deck-select__header">
        <button className="deck-select__leave-btn" onClick={onLeave}>
          Leave Room
        </button>
        <div className="deck-select__title">Choose Your Deck</div>
        <div className="deck-select__room-code">Room: {room.id}</div>
      </div>

      <div className="deck-select__content">
        {/* Player status */}
        <div className="deck-select__players">
          {room.players.map((player) => (
            <div
              key={player.id}
              className={`deck-select__player ${player.isReady ? 'deck-select__player--ready' : ''}`}
            >
              <span className="deck-select__player-name">
                {player.name}
                {player.id === myId && ' (You)'}
                {player.isHost && ' [Host]'}
              </span>
              <span className="deck-select__player-status">
                {player.isReady
                  ? 'Ready'
                  : player.deckId
                    ? 'Deck Selected'
                    : 'Choosing...'}
              </span>
            </div>
          ))}
          {room.players.length < 2 && (
            <div className="deck-select__player deck-select__player--empty">
              Waiting for opponent...
            </div>
          )}
        </div>

        {/* Deck options */}
        <div className="deck-select__decks">
          {DECK_IDS.map((deckId) => {
            const comp = DECK_COMPOSITIONS[deckId];
            const coverCard = CARD_DATABASE[comp.coverCardId];
            const isSelected = myDeckId === deckId;
            const isTaken = takenDeckIds.has(deckId);
            const isDisabled = isTaken || isReady;
            const clanClass = comp.clan === 'royal-paladin' ? 'royal-paladin' : 'kagero';

            return (
              <div
                key={deckId}
                className={[
                  'deck-select__deck',
                  `deck-select__deck--${clanClass}`,
                  isSelected ? 'deck-select__deck--selected' : '',
                  isTaken ? 'deck-select__deck--taken' : '',
                  isDisabled ? 'deck-select__deck--disabled' : '',
                ].filter(Boolean).join(' ')}
                onClick={isDisabled ? undefined : () => onSelectDeck(deckId)}
              >
                {/* Cover card image */}
                <div className="deck-select__deck-image-wrapper">
                  {coverCard && (
                    <img
                      src={coverCard.imagePath}
                      alt={coverCard.name}
                      className="deck-select__deck-image"
                      draggable={false}
                    />
                  )}
                  {isTaken && (
                    <div className="deck-select__deck-taken-overlay">
                      Taken by Opponent
                    </div>
                  )}
                  {isSelected && (
                    <div className="deck-select__deck-selected-badge">
                      Selected
                    </div>
                  )}
                </div>

                {/* Deck info */}
                <div className="deck-select__deck-info">
                  <div className="deck-select__deck-name">{comp.name}</div>
                  <div className="deck-select__deck-clan">{comp.clanDisplay}</div>
                  <div className="deck-select__deck-description">{comp.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="deck-select__actions">
          {!isReady && myDeckId && (
            <button
              className="deck-select__btn deck-select__btn--ready"
              onClick={onReady}
            >
              Ready
            </button>
          )}

          {isReady && !allReady && (
            <div className="deck-select__waiting-text">
              Waiting for opponent to ready up...
            </div>
          )}

          {isHost && allReady && (
            <button
              className="deck-select__btn deck-select__btn--start"
              onClick={onStartGame}
            >
              Start Game
            </button>
          )}

          {!isHost && allReady && (
            <div className="deck-select__waiting-text">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
