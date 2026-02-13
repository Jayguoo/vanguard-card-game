import React, { useEffect, useRef } from 'react';
import { GameLogEntry } from '../../shared/types';
import './GameLog.css';

interface GameLogProps {
  entries: GameLogEntry[];
  players: Record<string, string>;
}

export const GameLog: React.FC<GameLogProps> = ({ entries, players }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const getPlayerName = (playerId: string): string => {
    return players[playerId] ?? 'Unknown';
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="game-log">
      <div className="game-log__header">Game Log</div>
      <div className="game-log__entries" ref={scrollRef}>
        {entries.length === 0 && (
          <div className="game-log__empty">No events yet.</div>
        )}
        {entries.map((entry, index) => (
          <div
            key={index}
            className={`game-log__entry game-log__entry--${entry.type}`}
          >
            <span className="game-log__time">{formatTime(entry.timestamp)}</span>
            <span className="game-log__icon">{getTypeIcon(entry.type)}</span>
            <span className="game-log__message">
              {formatMessage(entry, getPlayerName)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

function getTypeIcon(type: GameLogEntry['type']): string {
  switch (type) {
    case 'phase': return '>';
    case 'action': return '*';
    case 'trigger': return '!';
    case 'damage': return 'x';
    case 'system': return '#';
    default: return '-';
  }
}

function formatMessage(
  entry: GameLogEntry,
  getPlayerName: (id: string) => string,
): string {
  let msg = entry.message;
  // Replace player IDs with names if the message contains them
  if (entry.playerId) {
    const name = getPlayerName(entry.playerId);
    msg = msg.replace(entry.playerId, name);
  }
  return msg;
}
