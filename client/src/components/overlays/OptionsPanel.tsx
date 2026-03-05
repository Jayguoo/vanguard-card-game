import { useState } from 'react';
import { AuthUser } from '../../shared/types';
import './OptionsPanel.css';

interface OptionsPanelProps {
  onClose: () => void;
  authUser: AuthUser | null;
  onLogout: () => void;
  updateFighterName: ((name: string) => Promise<{ success: boolean; error?: string }>) | null;
  latencyMs: number | null;
  isConnected: boolean;
}

type OptionsTab = 'account' | 'game' | 'about';

export const OptionsPanel: React.FC<OptionsPanelProps> = ({
  onClose,
  authUser,
  onLogout,
  updateFighterName,
  latencyMs,
  isConnected,
}) => {
  const [activeTab, setActiveTab] = useState<OptionsTab>('account');
  const [fighterName, setFighterName] = useState(authUser?.fighterName ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vanguard-theme') as 'light' | 'dark') || 'light';
  });

  const handleSaveName = async () => {
    if (!updateFighterName) return;
    const trimmed = fighterName.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty');
      return;
    }
    if (trimmed === authUser?.fighterName) return;

    setIsSaving(true);
    setNameError(null);
    setNameSuccess(false);
    const result = await updateFighterName(trimmed);
    setIsSaving(false);
    if (result.success) {
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 2000);
    } else {
      setNameError(result.error || 'Failed to update name');
    }
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  const handleThemeToggle = (newTheme: 'light' | 'dark') => {
    if (newTheme === theme) return;
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('vanguard-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('vanguard-theme');
    }
  };

  const pingText = latencyMs !== null ? `${latencyMs}ms` : '--';

  return (
    <div className="options-overlay" onClick={onClose}>
      <div className="options-panel" onClick={(e) => e.stopPropagation()}>
        <div className="options-header">
          <h3>Options</h3>
          <button className="options-close" onClick={onClose}>&times;</button>
        </div>

        {/* Theme toggle — always visible */}
        <div className="options-theme-row">
          <label className="options-theme-row__label">Theme</label>
          <div className="options-theme-toggle">
            <button
              className={`options-theme-btn ${theme === 'light' ? 'options-theme-btn--active' : ''}`}
              onClick={() => handleThemeToggle('light')}
            >Light</button>
            <button
              className={`options-theme-btn ${theme === 'dark' ? 'options-theme-btn--active' : ''}`}
              onClick={() => handleThemeToggle('dark')}
            >Dark</button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="options-tabs">
          <button
            className={`options-tab ${activeTab === 'account' ? 'options-tab--active' : ''}`}
            onClick={() => setActiveTab('account')}
          >Account</button>
          <button
            className={`options-tab ${activeTab === 'game' ? 'options-tab--active' : ''}`}
            onClick={() => setActiveTab('game')}
          >Game</button>
          <button
            className={`options-tab ${activeTab === 'about' ? 'options-tab--active' : ''}`}
            onClick={() => setActiveTab('about')}
          >About</button>
        </div>

        {/* Tab content */}
        <div className="options-content">
          {activeTab === 'account' && (
            authUser ? (
              <div className="options-account">
                <div className="options-field">
                  <label className="options-label">Username</label>
                  <div className="options-value">@{authUser.username}</div>
                </div>

                <div className="options-field">
                  <label className="options-label">Fighter Name</label>
                  <div className="options-name-row">
                    <input
                      className="options-input"
                      type="text"
                      value={fighterName}
                      onChange={(e) => { setFighterName(e.target.value); setNameError(null); setNameSuccess(false); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                      maxLength={20}
                      disabled={isSaving}
                    />
                    <button
                      className="options-save-btn"
                      onClick={handleSaveName}
                      disabled={isSaving || fighterName.trim() === authUser.fighterName}
                    >
                      {isSaving ? '...' : 'Save'}
                    </button>
                  </div>
                  {nameError && <div className="options-field-error">{nameError}</div>}
                  {nameSuccess && <div className="options-field-success">Name updated!</div>}
                </div>

                <button className="options-logout-btn" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            ) : (
              <div className="options-guest">Log in to manage your account.</div>
            )
          )}

          {activeTab === 'game' && (
            <div className="options-game">
              <div className="options-field">
                <label className="options-label">Ping</label>
                <div className="options-value options-value--mono">{pingText}</div>
              </div>

              <div className="options-field">
                <label className="options-label">Connection</label>
                <div className="options-connection">
                  <span className={`options-dot ${isConnected ? 'options-dot--online' : 'options-dot--offline'}`} />
                  <span className="options-value">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>

              <div className="options-field">
                <label className="options-label">Server</label>
                <div className="options-value options-value--mono options-value--small">
                  {window.location.origin}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'about' && (
            <div className="options-about">
              <div className="options-about__title">Vanguard Card Fighter</div>
              <div className="options-about__version">v1.0</div>
              <div className="options-about__credits">
                A multiplayer card fighting game inspired by Cardfight!! Vanguard.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
