import React, { useState } from 'react';
import { Card as CardType, PublicGameRoom, PublicPlayer } from '../shared/types';
import { Card, CardBack } from './Card';
import './GameRoom.css';

interface GameRoomProps {
  room: PublicGameRoom;
  myHand: CardType[];
  myId: string | null;
  isMyTurn: boolean;
  error: string | null;
  onStartGame: () => void;
  onPlayCard: (cardId: string) => void;
  onDrawCard: () => void;
  onEndTurn: () => void;
  onLeaveRoom: () => void;
}

export const GameRoom: React.FC<GameRoomProps> = ({
  room,
  myHand,
  myId,
  isMyTurn,
  error,
  onStartGame,
  onPlayCard,
  onDrawCard,
  onEndTurn,
  onLeaveRoom,
}) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const isHost = room.players.find((p) => p.id === myId)?.isHost || false;
  const isWaiting = room.gameState === 'waiting';
  const isPlaying = room.gameState === 'playing';
  const isFinished = room.gameState === 'finished';
  const topCard = room.discardPile[room.discardPile.length - 1];
  const currentPlayer = room.players.find((p) => p.id === room.currentPlayerId);
  const winner = isFinished ? room.players.find((p) => p.cardCount === 0) : null;

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || !isPlaying) return;

    if (selectedCard === cardId) {
      // Play the selected card
      onPlayCard(cardId);
      setSelectedCard(null);
    } else {
      // Select the card
      setSelectedCard(cardId);
    }
  };

  const canPlayCard = (card: CardType): boolean => {
    if (!topCard) return true;
    return card.suit === topCard.suit || card.value === topCard.value;
  };

  return (
    <div className="game-room">
      {/* Header */}
      <div className="game-header">
        <button className="btn-leave" onClick={onLeaveRoom}>
          ← Leave
        </button>
        <div className="room-info">
          <span className="room-code">Room: {room.id}</span>
          <span className="player-count">
            {room.players.length}/{room.maxPlayers} players
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && <div className="game-error">{error}</div>}

      {/* Waiting room */}
      {isWaiting && (
        <div className="waiting-room">
          <h2>Waiting for Players</h2>
          <div className="players-list">
            {room.players.map((player) => (
              <div key={player.id} className="player-item">
                <span className="player-name">
                  {player.name}
                  {player.isHost && <span className="host-badge">HOST</span>}
                  {player.id === myId && <span className="you-badge">YOU</span>}
                </span>
                <span
                  className={`player-status ${player.isConnected ? 'online' : 'offline'}`}
                >
                  {player.isConnected ? '●' : '○'}
                </span>
              </div>
            ))}
          </div>

          <div className="share-code">
            <p>Share this code with friends:</p>
            <div className="code-display">{room.id}</div>
          </div>

          {isHost ? (
            <button
              className="btn btn-start"
              onClick={onStartGame}
              disabled={room.players.length < 2}
            >
              {room.players.length < 2 ? 'Need 2+ players' : 'Start Game'}
            </button>
          ) : (
            <p className="waiting-text">Waiting for host to start...</p>
          )}
        </div>
      )}

      {/* Active game */}
      {isPlaying && (
        <div className="game-board">
          {/* Other players */}
          <div className="other-players">
            {room.players
              .filter((p) => p.id !== myId)
              .map((player) => (
                <OtherPlayer
                  key={player.id}
                  player={player}
                  isCurrentTurn={room.currentPlayerId === player.id}
                />
              ))}
          </div>

          {/* Center area */}
          <div className="center-area">
            <div className="deck-area">
              <div className="deck" onClick={isMyTurn ? onDrawCard : undefined}>
                <CardBack />
                <span className="deck-count">{room.deckCount}</span>
              </div>
            </div>

            <div className="discard-area">
              {topCard && <Card card={topCard} disabled />}
              <span className="discard-label">Discard</span>
            </div>
          </div>

          {/* Turn indicator */}
          <div className={`turn-indicator ${isMyTurn ? 'your-turn' : ''}`}>
            {isMyTurn ? "Your Turn!" : `${currentPlayer?.name}'s turn`}
          </div>

          {/* My hand */}
          <div className="my-hand-area">
            <div className="my-hand">
              {myHand.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card.id)}
                  disabled={!isMyTurn || !canPlayCard(card)}
                  selected={selectedCard === card.id}
                />
              ))}
            </div>
            {isMyTurn && (
              <div className="hand-actions">
                <button className="btn btn-draw" onClick={onDrawCard}>
                  Draw Card
                </button>
                <button className="btn btn-end-turn" onClick={onEndTurn}>
                  End Turn
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game over */}
      {isFinished && (
        <div className="game-over">
          <h2>🎉 Game Over!</h2>
          {winner && (
            <p className="winner-text">
              {winner.id === myId ? 'You won!' : `${winner.name} wins!`}
            </p>
          )}
          <button className="btn btn-primary" onClick={onLeaveRoom}>
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
};

// Sub-component for other players
const OtherPlayer: React.FC<{ player: PublicPlayer; isCurrentTurn: boolean }> = ({
  player,
  isCurrentTurn,
}) => {
  return (
    <div className={`other-player ${isCurrentTurn ? 'current-turn' : ''}`}>
      <div className="other-player-info">
        <span className="other-player-name">{player.name}</span>
        {player.isHost && <span className="host-badge small">HOST</span>}
      </div>
      <div className="other-player-hand">
        {Array.from({ length: Math.min(player.cardCount, 7) }).map((_, i) => (
          <div key={i} className="mini-card" />
        ))}
        {player.cardCount > 7 && <span className="more-cards">+{player.cardCount - 7}</span>}
      </div>
      <span className="card-count">{player.cardCount} cards</span>
    </div>
  );
};
