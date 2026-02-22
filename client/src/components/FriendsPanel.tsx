import { useState, useEffect, useCallback } from 'react';
import { FriendInfo } from '../shared/types';
import './FriendsPanel.css';

interface FriendsPanelProps {
  onClose: () => void;
  listFriends: () => Promise<FriendInfo[]>;
  addFriend: (username: string) => Promise<{ success: boolean; error?: string }>;
  removeFriend: (friendUserId: string) => Promise<{ success: boolean; error?: string }>;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({
  onClose,
  listFriends,
  addFriend,
  removeFriend,
}) => {
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [addUsername, setAddUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFriends = useCallback(async () => {
    const list = await listFriends();
    // Sort: online first, then alphabetical
    list.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return a.fighterName.localeCompare(b.fighterName);
    });
    setFriends(list);
  }, [listFriends]);

  useEffect(() => {
    fetchFriends();
    // Poll for updates every 5 seconds (for status changes)
    const interval = setInterval(fetchFriends, 5000);
    return () => clearInterval(interval);
  }, [fetchFriends]);

  const handleAdd = async () => {
    if (!addUsername.trim()) return;
    setIsLoading(true);
    setError(null);
    const result = await addFriend(addUsername.trim());
    setIsLoading(false);
    if (result.success) {
      setAddUsername('');
      fetchFriends();
    } else {
      setError(result.error || 'Failed to add friend');
    }
  };

  const handleRemove = async (friendUserId: string) => {
    const result = await removeFriend(friendUserId);
    if (result.success) {
      fetchFriends();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className="friends-overlay" onClick={onClose}>
      <div className="friends-panel" onClick={(e) => e.stopPropagation()}>
        <div className="friends-header">
          <h3>Friends</h3>
          <button className="friends-close" onClick={onClose}>&times;</button>
        </div>

        {error && <div className="friends-error">{error}</div>}

        <div className="friends-add">
          <input
            type="text"
            value={addUsername}
            onChange={(e) => setAddUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add by username..."
            maxLength={20}
            disabled={isLoading}
          />
          <button
            className="btn btn-secondary"
            onClick={handleAdd}
            disabled={isLoading || !addUsername.trim()}
          >
            Add
          </button>
        </div>

        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="friends-empty">
              No friends yet. Add someone by their username!
            </div>
          ) : (
            friends.map(friend => (
              <div key={friend.userId} className="friends-item">
                <span className={`status-dot ${friend.isOnline ? 'connected' : 'disconnected'}`} />
                <div className="friends-item__info">
                  <span className="friends-item__name">{friend.fighterName}</span>
                  <span className="friends-item__username">@{friend.username}</span>
                </div>
                <button
                  className="friends-item__remove"
                  onClick={() => handleRemove(friend.userId)}
                  title="Remove friend"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
