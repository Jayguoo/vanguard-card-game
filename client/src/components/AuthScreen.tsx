import { useState } from 'react';
import { AuthResponse } from '../shared/types';
import './AuthScreen.css';

interface AuthScreenProps {
  isConnected: boolean;
  onRegister: (username: string, password: string, fighterName: string) => Promise<AuthResponse>;
  onLogin: (username: string, password: string) => Promise<AuthResponse>;
  onPlayAsGuest: () => void;
}

type AuthMode = 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  isConnected,
  onRegister,
  onLogin,
  onPlayAsGuest,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fighterName, setFighterName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (mode === 'register' && !fighterName.trim()) {
      setError('Please enter a fighter name');
      return;
    }

    setIsLoading(true);
    const response = mode === 'register'
      ? await onRegister(username.trim(), password, fighterName.trim())
      : await onLogin(username.trim(), password);
    setIsLoading(false);

    if (!response.success) {
      setError(response.error || 'Something went wrong');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-title">
          <h1>CARDFIGHT!!</h1>
          <h2>VANGUARD</h2>
          <p className="auth-subtitle">Online Card Battle</p>
        </div>

        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected to Server' : 'Connecting...'}
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Mode toggle */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${mode === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('login'); setError(null); }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${mode === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setMode('register'); setError(null); }}
          >
            Register
          </button>
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter username"
              maxLength={20}
              disabled={!isConnected || isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter password"
              maxLength={50}
              disabled={!isConnected || isLoading}
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="fighterName">Fighter Name</label>
              <input
                id="fighterName"
                type="text"
                value={fighterName}
                onChange={(e) => setFighterName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Your display name in battles"
                maxLength={20}
                disabled={!isConnected || isLoading}
              />
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!isConnected || isLoading}
          >
            {isLoading ? (mode === 'login' ? 'Logging in...' : 'Creating account...') : (mode === 'login' ? 'Login' : 'Create Account')}
          </button>
        </div>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="btn btn-guest"
          onClick={onPlayAsGuest}
          disabled={!isConnected}
        >
          Play as Guest
        </button>
      </div>
    </div>
  );
};
