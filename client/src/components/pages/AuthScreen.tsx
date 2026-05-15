import { useEffect, useState } from 'react';
import { AuthResponse } from '../../shared/types';
import './AuthScreen.css';

interface AuthScreenProps {
  isConnected: boolean;
  onRegister: (username: string, password: string, fighterName: string) => Promise<AuthResponse>;
  onLogin: (username: string, password: string) => Promise<AuthResponse>;
  onPlayAsGuest: () => void;
}

type Stage = 'title' | 'menu' | 'login' | 'register';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  isConnected,
  onRegister,
  onLogin,
  onPlayAsGuest,
}) => {
  const [stage, setStage] = useState<Stage>('title');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fighterName, setFighterName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // "Press any button" advances title → menu
  useEffect(() => {
    if (stage !== 'title') return;
    const advance = () => setStage('menu');
    window.addEventListener('keydown', advance, { once: true });
    window.addEventListener('mousedown', advance, { once: true });
    return () => {
      window.removeEventListener('keydown', advance);
      window.removeEventListener('mousedown', advance);
    };
  }, [stage]);

  const handleSubmit = async () => {
    setError(null);
    if (!username.trim()) return setError('Please enter a username');
    if (!password) return setError('Please enter a password');
    if (stage === 'register' && !fighterName.trim()) return setError('Please enter a fighter name');

    setIsLoading(true);
    const response = stage === 'register'
      ? await onRegister(username.trim(), password, fighterName.trim())
      : await onLogin(username.trim(), password);
    setIsLoading(false);

    if (!response.success) setError(response.error || 'Something went wrong');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const goToMenu = () => {
    setError(null);
    setStage('menu');
  };

  const showMenu = stage === 'menu';
  const showForm = stage === 'login' || stage === 'register';

  return (
    <div className={`title-screen title-screen--${stage}`}>
      {/* Full-bleed background art (the "menu" version is dimmer for legibility) */}
      <div className="title-screen__bg" aria-hidden />
      <div className="title-screen__vignette" aria-hidden />

      {/* Centered Cardfight!! Vanguard logo on top of the spinning sigil */}
      <img
        className="title-logo"
        src="/title/season1-logo.png?v=3"
        alt="Cardfight!! Vanguard"
        aria-hidden
      />

      {/* Bottom-left copyright stamp */}
      <div className="title-screen__credit">
        Cardfight!! Vanguard fan project · UI inspired by VANGUARD Dear Days
      </div>

      {/* Bottom-right version + connection */}
      <div className="title-screen__version">
        <span className={`title-screen__dot ${isConnected ? 'is-on' : 'is-off'}`} />
        {isConnected ? 'Online' : 'Connecting...'}
        <span className="title-screen__ver">ver. 0.1</span>
      </div>

      {/* "PRESS ANY BUTTON" overlay during title stage */}
      {stage === 'title' && (
        <div className="title-screen__press">PRESS ANY BUTTON</div>
      )}

      {/* Right-side menu buttons (slides in after the press) */}
      {showMenu && (
        <nav className="title-menu">
          <button
            className="title-btn"
            onClick={() => setStage('register')}
            disabled={!isConnected}
          >
            <span>SIGN UP</span>
          </button>
          <button
            className="title-btn title-btn--primary"
            onClick={() => setStage('login')}
            disabled={!isConnected}
            autoFocus
          >
            <span>LOGIN</span>
          </button>
          <button
            className="title-btn"
            onClick={onPlayAsGuest}
            disabled={!isConnected}
          >
            <span>GUEST</span>
          </button>
        </nav>
      )}

      {/* Login / Register form panel */}
      {showForm && (
        <div className="title-form-wrap" onClick={goToMenu}>
          <div className="title-form" onClick={(e) => e.stopPropagation()}>
            <div className="title-form__head">
              <button className="title-form__back" onClick={goToMenu} aria-label="Back">
                ◀ BACK
              </button>
              <h2>{stage === 'login' ? 'LOGIN' : 'SIGN UP'}</h2>
              <span className="title-form__sub">
                {stage === 'login' ? 'Sign in to your fighter' : 'Create a new fighter'}
              </span>
            </div>

            {error && <div className="title-form__error">{error}</div>}

            <div className="title-form__field">
              <label htmlFor="username">USERNAME</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="username"
                maxLength={20}
                disabled={!isConnected || isLoading}
                autoFocus
              />
            </div>

            <div className="title-form__field">
              <label htmlFor="password">PASSWORD</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••"
                maxLength={50}
                disabled={!isConnected || isLoading}
              />
            </div>

            {stage === 'register' && (
              <div className="title-form__field">
                <label htmlFor="fighterName">FIGHTER NAME</label>
                <input
                  id="fighterName"
                  type="text"
                  value={fighterName}
                  onChange={(e) => setFighterName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Your battle alias"
                  maxLength={20}
                  disabled={!isConnected || isLoading}
                />
              </div>
            )}

            <button
              className="title-btn title-btn--primary title-btn--wide"
              onClick={handleSubmit}
              disabled={!isConnected || isLoading}
            >
              <span>
                {isLoading
                  ? (stage === 'login' ? 'LOGGING IN...' : 'CREATING...')
                  : (stage === 'login' ? 'CONFIRM' : 'CREATE')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
