import React, { useState, useEffect, useMemo } from 'react';
import { RoomResponse, RoomVisibility, PublicRoomListItem, AuthUser, UserStats, FriendInfo } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import { SavedDeck } from '../../hooks/useSavedDecks';
import { StatsPanel } from '../overlays/StatsPanel';
import { OptionsPanel } from '../overlays/OptionsPanel';
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
  latencyMs: number | null;
  updateFighterName: ((name: string) => Promise<{ success: boolean; error?: string }>) | null;
  statsActions: {
    getStats: () => Promise<UserStats | null>;
  } | null;
  friendActions: {
    listFriends: () => Promise<FriendInfo[]>;
    addFriend: (username: string) => Promise<{ success: boolean; error?: string }>;
    removeFriend: (friendUserId: string) => Promise<{ success: boolean; error?: string }>;
  } | null;
}

type SubView = 'main' | 'fight';
type MenuButton = 'fight' | 'deck' | 'stats' | 'options';

const MENU_DESCRIPTIONS: Record<MenuButton, string> = {
  fight: 'Create or join a room to battle against other fighters.',
  deck: 'Build and customize your card decks.',
  stats: 'View your battle record and win rate.',
  options: 'Change settings and manage your account.',
};

export const Lobby: React.FC<LobbyProps> = ({
  isConnected,
  publicRooms,
  onCreateRoom,
  onJoinRoom,
  onFetchRoomList,
  onOpenBuilder,
  authUser,
  onLogout,
  latencyMs,
  updateFighterName,
  statsActions,
  friendActions,
}) => {
  const [subView, setSubView] = useState<SubView>('main');
  const [hoveredButton, setHoveredButton] = useState<MenuButton | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState(authUser?.fighterName ?? '');
  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [showStats, setShowStats] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Friends sidebar state
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [friendError, setFriendError] = useState<string | null>(null);

  // Pick a random Grade 3 card for display
  const randomCard = useMemo(() => {
    const allCards = Object.values(CARD_DATABASE);
    const grade3Cards = allCards.filter(c => c.grade === 3);
    const pool = grade3Cards.length > 0 ? grade3Cards : allCards;
    return pool[Math.floor(Math.random() * pool.length)];
  }, []);

  // Load friends on mount
  useEffect(() => {
    if (!friendActions) return;
    friendActions.listFriends().then(setFriends);
  }, [friendActions]);

  // Fetch room list when switching to fight view join tab
  useEffect(() => {
    if (subView === 'fight' && activeTab === 'join' && isConnected) {
      onFetchRoomList();
    }
  }, [subView, activeTab, isConnected, onFetchRoomList]);

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
    if (e.key === 'Enter') {
      handleCreate();
    }
  };

  const handleAddFriend = async () => {
    if (!friendActions || !friendSearch.trim()) return;
    setFriendError(null);
    const result = await friendActions.addFriend(friendSearch.trim());
    if (result.success) {
      setFriendSearch('');
      const updated = await friendActions.listFriends();
      setFriends(updated);
    } else {
      setFriendError(result.error || 'Failed to add friend');
    }
  };

  const handleRemoveFriend = async (friendUserId: string) => {
    if (!friendActions) return;
    const result = await friendActions.removeFriend(friendUserId);
    if (result.success) {
      const updated = await friendActions.listFriends();
      setFriends(updated);
    }
  };

  const handleMenuClick = (btn: MenuButton) => {
    switch (btn) {
      case 'fight':
        setSubView('fight');
        setError(null);
        break;
      case 'deck':
        onOpenBuilder();
        break;
      case 'stats':
        setShowStats(true);
        break;
      case 'options':
        setShowOptions(true);
        break;
    }
  };

  const displayDescription = hoveredButton
    ? MENU_DESCRIPTIONS[hoveredButton]
    : randomCard?.abilityText || `Grade ${randomCard?.grade} | ${randomCard?.clan}`;

  const displayTitle = hoveredButton
    ? { fight: 'Fight', deck: 'Edit Deck', stats: 'Stats', options: 'Options' }[hoveredButton]
    : randomCard?.name || '';

  return (
    <div className="lobby">
      {/* Blue accent corners */}
      <div className="accent-top-left" />
      <div className="accent-bottom-right" />

      <div className="lobby-container">
        {/* Header */}
        <div className="lobby-header">
          <h1 className="main-menu-title">MAIN MENU</h1>
          <div className="vanguard-logo">Vanguard</div>
        </div>

        <div className="lobby-body">
          {/* Friends sidebar (left) */}
          <div className="lobby-friends">
            <h4 className="lobby-friends__title">Friends</h4>
            {friendActions ? (
              <>
                <div className="lobby-friends__search">
                  <input
                    type="text"
                    className="lobby-friends__input"
                    placeholder="Add by username..."
                    value={friendSearch}
                    onChange={(e) => { setFriendSearch(e.target.value); setFriendError(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
                  />
                  <button
                    className="lobby-friends__add-btn"
                    onClick={handleAddFriend}
                    disabled={!friendSearch.trim()}
                  >+</button>
                </div>
                {friendError && <div className="lobby-friends__error">{friendError}</div>}
                {friends.length === 0 ? (
                  <div className="lobby-friends__empty">No friends yet.</div>
                ) : (
                  <ul className="lobby-friends__list">
                    {friends.map(f => (
                      <li key={f.userId} className="lobby-friends__item">
                        <span className={`lobby-friends__dot ${f.isOnline ? 'lobby-friends__dot--online' : ''}`} />
                        <div className="lobby-friends__info">
                          <span className="lobby-friends__name">{f.fighterName}</span>
                          <span className="lobby-friends__username">@{f.username}</span>
                        </div>
                        <button
                          className="lobby-friends__remove"
                          onClick={() => handleRemoveFriend(f.userId)}
                          title="Remove"
                        >&times;</button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="lobby-friends__empty">Log in to add friends.</div>
            )}
          </div>

          {/* Center column — menu / fight */}
          <div className="lobby-center">
            {subView === 'main' ? (
              <>
                <div className="menu-grid">
                  <button
                    className={`menu-btn ${hoveredButton === 'fight' ? 'menu-btn--hover' : ''}`}
                    onMouseEnter={() => setHoveredButton('fight')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => handleMenuClick('fight')}
                  >
                    <span className="menu-btn__title">FIGHT</span>
                  </button>

                  <button
                    className={`menu-btn ${hoveredButton === 'deck' ? 'menu-btn--hover' : ''}`}
                    onMouseEnter={() => setHoveredButton('deck')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => handleMenuClick('deck')}
                  >
                    <span className="menu-btn__title">EDIT DECK</span>
                  </button>

                  <button
                    className={`menu-btn ${hoveredButton === 'stats' ? 'menu-btn--hover' : ''}`}
                    onMouseEnter={() => setHoveredButton('stats')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => handleMenuClick('stats')}
                  >
                    <span className="menu-btn__title">STATS</span>
                  </button>

                  <button
                    className={`menu-btn ${hoveredButton === 'options' ? 'menu-btn--hover' : ''}`}
                    onMouseEnter={() => setHoveredButton('options')}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => handleMenuClick('options')}
                  >
                    <span className="menu-btn__title">OPTIONS</span>
                  </button>
                </div>

                {/* Status bar */}
                <div className="lobby-status-bar">
                  <div className="connection-status">
                    <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
                    {isConnected ? 'Online' : 'Connecting...'}
                  </div>
                  {authUser ? (
                    <span className="player-info">Fighter: <strong>{authUser.fighterName}</strong></span>
                  ) : (
                    <div className="guest-name-inline">
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter fighter name"
                        maxLength={20}
                        className="guest-name-input"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Fight sub-view */
              <div className="fight-view">
                <button className="back-btn" onClick={() => { setSubView('main'); setError(null); }}>
                  &larr; Back
                </button>

                {!authUser && (
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
                )}

                {error && <div className="error-message">{error}</div>}

                {/* Create / Join tabs */}
                <div className="fight-tabs">
                  <button
                    className={`fight-tab ${activeTab === 'create' ? 'fight-tab--active' : ''}`}
                    onClick={() => setActiveTab('create')}
                  >
                    Create Room
                  </button>
                  <button
                    className={`fight-tab ${activeTab === 'join' ? 'fight-tab--active' : ''}`}
                    onClick={() => setActiveTab('join')}
                  >
                    Join Room
                  </button>
                </div>

                {activeTab === 'create' && (
                  <div className="fight-content">
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

                {activeTab === 'join' && (
                  <div className="fight-content">
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
              </div>
            )}
          </div>

          {/* Right column — card display */}
          <div className="lobby-right">
            <div className="card-display">
              <div className="card-display__frame">
                {randomCard && (
                  <img
                    src={randomCard.imagePath}
                    alt={randomCard.name}
                    className="card-display__image"
                  />
                )}
              </div>
              <div className="card-display__info">
                <h3 className="card-display__name">{displayTitle}</h3>
                <p className="card-display__description">{displayDescription}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStats && (
        <StatsPanel
          onClose={() => setShowStats(false)}
          getStats={statsActions ? statsActions.getStats : null}
        />
      )}

      {showOptions && (
        <OptionsPanel
          onClose={() => setShowOptions(false)}
          authUser={authUser}
          onLogout={onLogout}
          updateFighterName={updateFighterName}
          latencyMs={latencyMs}
          isConnected={isConnected}
        />
      )}
    </div>
  );
};
