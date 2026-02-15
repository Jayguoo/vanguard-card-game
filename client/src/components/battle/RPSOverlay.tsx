import React from 'react';
import { PublicVanguardGameState, GameAction, RPSChoice } from '../../shared/types';
import './RPSOverlay.css';

interface RPSOverlayProps {
  gameState: PublicVanguardGameState;
  onAction: (action: GameAction) => Promise<void>;
}

const choiceConfig: { key: RPSChoice; emoji: string; label: string }[] = [
  { key: 'rock', emoji: '✊', label: 'Rock' },
  { key: 'paper', emoji: '🖐️', label: 'Paper' },
  { key: 'scissors', emoji: '✌️', label: 'Scissors' },
];

function getChoiceEmoji(choice: RPSChoice | null): string {
  return choiceConfig.find(c => c.key === choice)?.emoji ?? '❓';
}

export const RPSOverlay: React.FC<RPSOverlayProps> = ({ gameState, onAction }) => {
  const { phase, rps } = gameState;

  if (phase !== 'setup-rps' && phase !== 'setup-rps-result') return null;
  if (!rps) return null;

  const hasChosen = rps.myChoice != null;

  // ── Result phase ──
  if (phase === 'setup-rps-result') {
    const resultClass =
      rps.myResult === 'win' ? 'rps__result-text--win'
        : rps.myResult === 'lose' ? 'rps__result-text--lose'
          : 'rps__result-text--draw';

    const resultText =
      rps.myResult === 'win' ? 'You go first!'
        : rps.myResult === 'lose' ? 'Opponent goes first'
          : 'Draw! Again...';

    return (
      <div className="rps">
        <div className="rps__backdrop" />
        <div className="rps__card rps__card--result">
          <div className="rps__header">
            <div className="rps__header-line" />
            <span className="rps__header-text">Result</span>
            <div className="rps__header-line" />
          </div>

          <div className="rps__matchup">
            <div className="rps__matchup-side">
              <span className="rps__matchup-label">You</span>
              <div className="rps__matchup-emoji">
                {getChoiceEmoji(rps.myChoice)}
              </div>
              <span className="rps__matchup-choice">{rps.myChoice}</span>
            </div>

            <div className="rps__vs">
              <span className="rps__vs-text">VS</span>
            </div>

            <div className="rps__matchup-side">
              <span className="rps__matchup-label">Opponent</span>
              <div className="rps__matchup-emoji">
                {getChoiceEmoji(rps.opponentChoice)}
              </div>
              <span className="rps__matchup-choice">{rps.opponentChoice}</span>
            </div>
          </div>

          <div className={`rps__result-text ${resultClass}`}>
            {resultText}
          </div>
        </div>
      </div>
    );
  }

  // ── Choice phase ──
  return (
    <div className="rps">
      <div className="rps__backdrop" />
      <div className="rps__card">
        <div className="rps__header">
          <div className="rps__header-line" />
          <span className="rps__header-text">Who goes first?</span>
          <div className="rps__header-line" />
        </div>
        {rps.round > 1 && (
          <div className="rps__round">Round {rps.round}</div>
        )}
        <div className="rps__choices">
          {choiceConfig.map(({ key, emoji, label }) => {
            const isSelected = hasChosen && rps.myChoice === key;
            const isDisabled = hasChosen && rps.myChoice !== key;

            return (
              <button
                key={key}
                className={[
                  'rps__choice',
                  isSelected ? 'rps__choice--selected' : '',
                  isDisabled ? 'rps__choice--disabled' : '',
                ].filter(Boolean).join(' ')}
                onClick={hasChosen ? undefined : () => onAction({ type: 'setup:rpsChoice', choice: key })}
                disabled={hasChosen}
              >
                <span className="rps__choice-emoji">{emoji}</span>
                <span className="rps__choice-label">{label}</span>
                {isSelected && <div className="rps__choice-check">✓</div>}
              </button>
            );
          })}
        </div>
        {hasChosen && (
          <div className="rps__waiting">
            <div className="rps__waiting-dots">
              <span /><span /><span />
            </div>
            <span>{rps.opponentHasChosen ? 'Resolving...' : 'Waiting for opponent...'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
