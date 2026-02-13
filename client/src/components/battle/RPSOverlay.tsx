import React from 'react';
import { PublicVanguardGameState, GameAction, RPSChoice } from '../../shared/types';
import './RPSOverlay.css';

interface RPSOverlayProps {
  gameState: PublicVanguardGameState;
  onAction: (action: GameAction) => Promise<void>;
}

const RockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 44c-2-3-3-7-3-11 0-4 1-7 3-9l2-2c1-1 3-2 5-2 1 0 2 0 3 1l1-3c1-2 3-3 5-3s4 1 5 3l1 2c1-1 2-1 3-1 3 0 5 2 6 5l1 4c0 1 1 2 1 3v6c0 4-1 8-4 11l-3 3c-3 3-7 4-11 4-5 0-9-2-12-5l-3-3z"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M27 22v-6c0-2 2-4 4-4s4 2 4 4v10M35 20v-4c0-2 2-4 4-4s4 2 4 4v8M22 33v-9c0-2 2-4 4-4s4 2 4 4"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const PaperIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 50V18c0-3 2-6 6-6h16c3 0 6 3 6 6v32c0 3-3 6-6 6H24c-4 0-6-3-6-6z"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M26 22h12M26 30h12M26 38h8"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ScissorsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="46" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <circle cx="20" cy="18" r="6" stroke="currentColor" strokeWidth="2.5" fill="none"/>
    <line x1="25" y1="42" x2="48" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="25" y1="22" x2="48" y2="42" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const choiceConfig: { key: RPSChoice; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { key: 'rock', label: 'Rock', Icon: RockIcon },
  { key: 'paper', label: 'Paper', Icon: PaperIcon },
  { key: 'scissors', label: 'Scissors', Icon: ScissorsIcon },
];

function getChoiceIcon(choice: RPSChoice | null) {
  const cfg = choiceConfig.find(c => c.key === choice);
  if (!cfg) return null;
  return <cfg.Icon className="rps-overlay__icon" />;
}

export const RPSOverlay: React.FC<RPSOverlayProps> = ({ gameState, onAction }) => {
  const { phase, rps } = gameState;

  if (phase !== 'setup-rps' && phase !== 'setup-rps-result') return null;
  if (!rps) return null;

  const hasChosen = rps.myChoice != null;

  // ── Result phase ──
  if (phase === 'setup-rps-result') {
    const resultClass =
      rps.myResult === 'win' ? 'rps-overlay__result-text--win'
        : rps.myResult === 'lose' ? 'rps-overlay__result-text--lose'
          : 'rps-overlay__result-text--draw';

    const resultText =
      rps.myResult === 'win' ? 'You go first!'
        : rps.myResult === 'lose' ? 'Opponent goes first'
          : 'Draw! Again...';

    return (
      <div className="rps-overlay">
        <div className="rps-overlay__diamond">
          <div className="rps-overlay__content">
            <div className="rps-overlay__title">Result</div>
            <div className="rps-overlay__result">
              <div className="rps-overlay__result-matchup">
                <div className="rps-overlay__result-side">
                  <span className="rps-overlay__result-side-label">You</span>
                  <div className="rps-overlay__result-choice">
                    {getChoiceIcon(rps.myChoice)}
                    <span className="rps-overlay__result-choice-label">{rps.myChoice}</span>
                  </div>
                </div>
                <span className="rps-overlay__result-vs">VS</span>
                <div className="rps-overlay__result-side">
                  <span className="rps-overlay__result-side-label">Opponent</span>
                  <div className="rps-overlay__result-choice">
                    {getChoiceIcon(rps.opponentChoice)}
                    <span className="rps-overlay__result-choice-label">{rps.opponentChoice}</span>
                  </div>
                </div>
              </div>
              <div className={`rps-overlay__result-text ${resultClass}`}>
                {resultText}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Choice phase ──
  return (
    <div className="rps-overlay">
      <div className="rps-overlay__diamond">
        <div className="rps-overlay__content">
          <div className="rps-overlay__title">Determining who is going first</div>
          {rps.round > 1 && (
            <div className="rps-overlay__round">Round {rps.round}</div>
          )}
          <div className="rps-overlay__choices">
            {choiceConfig.map(({ key, label, Icon }) => {
              const isSelected = hasChosen && rps.myChoice === key;
              const isDisabled = hasChosen && rps.myChoice !== key;
              const classes = [
                'rps-overlay__choice',
                isSelected ? 'rps-overlay__choice--selected' : '',
                isDisabled ? 'rps-overlay__choice--disabled' : '',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={key}
                  className={classes}
                  onClick={hasChosen ? undefined : () => onAction({ type: 'setup:rpsChoice', choice: key })}
                >
                  <Icon className="rps-overlay__icon" />
                  <span className="rps-overlay__label">{label}</span>
                </div>
              );
            })}
          </div>
          {hasChosen && (
            <div className="rps-overlay__waiting">
              {rps.opponentHasChosen ? 'Resolving...' : 'Waiting for opponent...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
