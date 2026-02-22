import React, { useState, useEffect, useMemo } from 'react';
import { RoomResponse, RoomVisibility, PublicRoomListItem, AuthUser, FriendInfo } from '../shared/types';
import { SavedDeck } from '../hooks/useSavedDecks';
import { FriendsPanel } from './FriendsPanel';
import './Lobby.css';

interface LobbyProps {
  isConnected: boolean;
  publicRooms: PublicRoomListItem[];
  onCreateRoom: (name: string, options: { visibility: RoomVisibility; password?: string }) => Promise<RoomResponse>;
  onJoinRoom: (roomId: string, name: string, password: string | null) => Promise<RoomResponse>;
  onFetchRoomList: () => void;
  savedDecks: SavedDeck[];
  onOpenBuilder: () => void;
  onEditDeck: (deck: SavedDeck) => void;
  onDeleteDeck: (id: string) => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  friendActions: {
    listFriends: () => Promise<FriendInfo[]>;
    addFriend: (username: string) => Promise<{ success: boolean; error?: string }>;
    removeFriend: (friendUserId: string) => Promise<{ success: boolean; error?: string }>;
  } | null;
}

type LobbyTab = 'create' | 'join' | 'decks';

export const Lobby: React.FC<LobbyProps> = ({
  isConnected,
  publicRooms,
  onCreateRoom,
  onJoinRoom,
  onFetchRoomList,
  savedDecks,
  onOpenBuilder,
  onEditDeck,
  onDeleteDeck,
  authUser,
  onLogout,
  friendActions,
}) => {
  const [activeTab, setActiveTab] = useState<LobbyTab>('create');
  const [playerName, setPlayerName] = useState(authUser?.fighterName ?? '');
  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [showFriends, setShowFriends] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch room list when switching to join tab
  useEffect(() => {
    if (activeTab === 'join' && isConnected) {
      onFetchRoomList();
    }
  }, [activeTab, isConnected, onFetchRoomList]);

  // Filter rooms by search query
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return publicRooms;
    const q = searchQuery.toLowerCase();
    return publicRooms.filter(room =>
      room.hostName.toLowerCase().includes(q)
    );
  }, [publicRooms, searchQuery]);

  const getName = () => authUser?.fighterName ?? playerName.trim();

  const handleCreate = async () => {
    const name = getName();
    if (!name) {
      setError('Please enter your name');
      return;
    }
    if (visibility === 'private' && !roomPassword.trim()) {
      setError('Please enter a password for the private room');
      return;
    }
    setIsLoading(true);
    setError(null);
    const options: { visibility: RoomVisibility; password?: string } = { visibility };
    if (visibility === 'private') options.password = roomPassword.trim();
    const response = await onCreateRoom(name, options);
    setIsLoading(false);
    if (!response.success) {
      setError(response.error || 'Failed to create room');
    }
  };

  const handleJoinPublic = async (roomId: string) => {
    const name = getName();
    if (!name) {
      setError('Please enter your name');
      return;
    }
    setIsLoading(true);
    setError(null);
    const response = await onJoinRoom(roomId, name, null);
    setIsLoading(false);
    if (!response.success) {
      setError(response.error || 'Failed to join room');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && activeTab === 'create') {
      handleCreate();
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

        {/* Auth bar: logged-in fighter name + logout + friends, or guest name input */}
        {authUser ? (
          <div className="lobby-auth-bar">
            <span className="lobby-auth-bar__name">Playing as <strong>{authUser.fighterName}</strong></span>
            <div className="lobby-auth-bar__actions">
              <button className="lobby-friends-btn" onClick={() => setShowFriends(true)}>
                Friends
              </button>
              <button className="lobby-logout-btn" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        ) : activeTab !== 'decks' ? (
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
        ) : null}

        {error && <div className="error-message">{error}</div>}

        {/* Tab switcher */}
        <div className="lobby-tabs">
          <button
            className={`lobby-tab ${activeTab === 'create' ? 'lobby-tab--active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Room
          </button>
          <button
            className={`lobby-tab ${activeTab === 'join' ? 'lobby-tab--active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Room
          </button>
          <button
            className={`lobby-tab ${activeTab === 'decks' ? 'lobby-tab--active' : ''}`}
            onClick={() => setActiveTab('decks')}
          >
            Build Deck
          </button>
        </div>

        {/* Create Room Tab */}
        {activeTab === 'create' && (
          <div className="lobby-tab-content">
            {/* Visibility toggle */}
            <div className="form-group">
              <label>Room Type</label>
              <div className="visibility-toggle">
                <button
                  className={`visibility-btn ${visibility === 'public' ? 'visibility-btn--active' : ''}`}
                  onClick={() => { setVisibility('public'); setRoomPassword(''); }}
                  disabled={!isConnected || isLoading}
                >
                  Public
                </button>
                <button
                  className={`visibility-btn ${visibility === 'private' ? 'visibility-btn--active' : ''}`}
                  onClick={() => setVisibility('private')}
                  disabled={!isConnected || isLoading}
                >
                  Private
                </button>
              </div>
            </div>

            {/* Password field for private rooms */}
            {visibility === 'private' && (
              <div className="form-group">
                <label htmlFor="roomPassword">Room Password</label>
                <input
                  id="roomPassword"
                  type="text"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Set a password"
                  maxLength={20}
                  disabled={!isConnected || isLoading}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={!isConnected || isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        )}

        {/* Join Room Tab */}
        {activeTab === 'join' && (
          <div className="lobby-tab-content">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by player name..."
              className="room-search-input"
              disabled={!isConnected}
            />

            <div className="room-list">
              {filteredRooms.length === 0 ? (
                <div className="room-list__empty">
                  {publicRooms.length === 0
                    ? 'No public rooms available. Create one!'
                    : 'No rooms match your search.'}
                </div>
              ) : (
                filteredRooms.map(room => (
                  <div key={room.id} className="room-list__item">
                    <div className="room-list__info">
                      <span className="room-list__host">{room.hostName}</span>
                      <span className="room-list__code">{room.id}</span>
                    </div>
                    <span className="room-list__players">
                      {room.playerCount}/{room.maxPlayers}
                    </span>
                    <button
                      className="btn btn-secondary room-list__join-btn"
                      onClick={() => handleJoinPublic(room.id)}
                      disabled={!isConnected || isLoading}
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Build Deck Tab */}
        {activeTab === 'decks' && (
          <div className="lobby-tab-content">
            <button
              className="btn btn-primary"
              onClick={onOpenBuilder}
            >
              Create New Deck
            </button>

            {savedDecks.length === 0 ? (
              <div className="deck-list__empty">
                No saved decks yet. Create one to get started!
              </div>
            ) : (
              <div className="deck-list">
                {savedDecks.map(deck => (
                  <div key={deck.id} className="deck-list__item">
                    <div className="deck-list__info">
                      <span className="deck-list__name">{deck.name}</span>
                      <span className="deck-list__count">
                        {Object.values(deck.composition).reduce((sum, n) => sum + n, 0)} cards
                      </span>
                    </div>
                    <div className="deck-list__actions">
                      <button
                        className="btn btn-secondary deck-list__btn"
                        onClick={() => onEditDeck(deck)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger deck-list__btn"
                        onClick={() => onDeleteDeck(deck.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showFriends && friendActions && (
        <FriendsPanel
          onClose={() => setShowFriends(false)}
          listFriends={friendActions.listFriends}
          addFriend={friendActions.addFriend}
          removeFriend={friendActions.removeFriend}
        />
      )}
    </div>
  );
};
