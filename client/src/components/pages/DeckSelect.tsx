import React from 'react';
import { PublicGameRoom, DeckId, CustomDeckComposition } from '../../shared/types';
import { DECK_COMPOSITIONS, CARD_DATABASE } from '../../shared/cardDatabase';
import { SavedDeck, MAX_CUSTOM_DECKS } from '../../hooks/useSavedDecks';
import './DeckSelect.css';

interface DeckSelectProps {
  room: PublicGameRoom;
  myId: string;
  onSelectDeck: (deckId: DeckId) => void;
  onSubmitCustomDeck: (deck: CustomDeckComposition) => Promise<{ success: boolean; error?: string }>;
  onReady: () => void;
  onStartGame: () => void;
  onLeave: () => void;
  savedDecks: SavedDeck[];
  onOpenBuilder: () => void;
  onEditDeck: (deck: SavedDeck) => void;
  onDeleteDeck: (id: string) => void;
}

const DECK_IDS: DeckId[] = ['td01-blaster-blade', 'td02-dragonic-overlord', 'td03-gold-rutile', 'td04-sakuya'];

export const DeckSelect: React.FC<DeckSelectProps> = ({
  room,
  myId,
  onSelectDeck,
  onSubmitCustomDeck,
  onReady,
  onStartGame,
  onLeave,
  savedDecks,
  onOpenBuilder,
  onEditDeck,
  onDeleteDeck,
}) => {
  const myPlayer = room.players.find((p) => p.id === myId);
  const isHost = myPlayer?.isHost ?? false;
  const myDeckId = myPlayer?.deckId ?? null;
  const hasCustomDeck = myPlayer?.customDeck !== null;
  const isReady = myPlayer?.isReady ?? false;
  const allReady = room.players.length === 2 && room.players.every((p) => p.isReady);

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
                  : player.deckId || player.customDeck
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
            const isDisabled = isReady;
            const clanClass = comp.clan === 'royal-paladin' ? 'royal-paladin'
              : comp.clan === 'kagero' ? 'kagero'
              : comp.clan === 'nova-grappler' ? 'nova-grappler'
              : 'oracle-think-tank';

            return (
              <div
                key={deckId}
                className={[
                  'deck-select__deck',
                  `deck-select__deck--${clanClass}`,
                  isSelected ? 'deck-select__deck--selected' : '',
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

          {/* Custom deck slots (always show 4) */}
          {Array.from({ length: MAX_CUSTOM_DECKS }).map((_, i) => {
            const saved = savedDecks[i] ?? null;

            if (saved) {
              const starterDef = CARD_DATABASE[saved.composition.starterVanguardId];
              const isSelected = hasCustomDeck && !myDeckId;
              const isDisabled = isReady;

              return (
                <div
                  key={saved.id}
                  className={[
                    'deck-select__deck',
                    'deck-select__deck--custom',
                    isSelected ? 'deck-select__deck--selected' : '',
                    isDisabled ? 'deck-select__deck--disabled' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={isDisabled ? undefined : () => onSubmitCustomDeck(saved.composition)}
                >
                  <div className="deck-select__deck-image-wrapper">
                    {starterDef && (
                      <img
                        src={starterDef.imagePath}
                        alt={starterDef.name}
                        className="deck-select__deck-image"
                        draggable={false}
                      />
                    )}
                  </div>
                  <div className="deck-select__deck-info">
                    <div className="deck-select__deck-name">{saved.name}</div>
                    <div className="deck-select__deck-clan deck-select__deck-clan--custom">Custom Deck</div>
                    <div className="deck-select__deck-custom-actions">
                      <button
                        className="deck-select__deck-edit-btn"
                        onClick={(e) => { e.stopPropagation(); onEditDeck(saved); }}
                      >
                        Edit
                      </button>
                      <button
                        className="deck-select__deck-delete-btn"
                        onClick={(e) => { e.stopPropagation(); onDeleteDeck(saved.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Empty slot
            return (
              <div
                key={`empty-${i}`}
                className={`deck-select__deck deck-select__deck--create ${isReady ? 'deck-select__deck--disabled' : ''}`}
                onClick={isReady ? undefined : onOpenBuilder}
              >
                <div className="deck-select__deck-image-wrapper deck-select__deck-create-icon">
                  <span>+</span>
                </div>
                <div className="deck-select__deck-info">
                  <div className="deck-select__deck-name">Custom Slot {i + 1}</div>
                  <div className="deck-select__deck-description">
                    Build a deck from all available cards
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="deck-select__actions">
          {!isReady && (myDeckId || hasCustomDeck) && (
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
