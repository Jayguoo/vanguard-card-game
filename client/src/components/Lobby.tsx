import React, { useState } from 'react';
import { RoomResponse } from '../shared/types';
import './Lobby.css';

interface LobbyProps {
  isConnected: boolean;
  onCreateRoom: (name: string) => Promise<RoomResponse>;
  onJoinRoom: (roomId: string, name: string) => Promise<RoomResponse>;
}

export const Lobby: React.FC<LobbyProps> = ({
  isConnected,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setIsLoading(true);
    setError(null);
    const response = await onCreateRoom(playerName.trim());
    setIsLoading(false);
    if (!response.success) {
      setError(response.error || 'Failed to create room');
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setIsLoading(true);
    setError(null);
    const response = await onJoinRoom(roomCode.trim(), playerName.trim());
    setIsLoading(false);
    if (!response.success) {
      setError(response.error || 'Failed to join room');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (roomCode.trim()) handleJoin();
      else handleCreate();
    }
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="lobby-title">
          <h1>CARDFIGHT!!</h1>
          <h2>VANGUARD</h2>
          <p className="subtitle">Online Card Battle</p>
        </div>

        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected to Server' : 'Connecting...'}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label htmlFor="playerName">Fighter Name</label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your name"
            maxLength={20}
            disabled={!isConnected || isLoading}
          />
        </div>

        <div className="lobby-actions">
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!isConnected || isLoading}
          >
            {isLoading ? 'Creating...' : 'Create Room'}
          </button>

          <div className="divider">
            <span>or join a fight</span>
          </div>

          <div className="join-section">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="Room Code"
              maxLength={6}
              className="room-code-input"
              disabled={!isConnected || isLoading}
            />
            <button
              className="btn btn-secondary"
              onClick={handleJoin}
              disabled={!isConnected || isLoading}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
