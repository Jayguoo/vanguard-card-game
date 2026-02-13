import React from 'react';
import { GamePhase } from '../../shared/types';
import './PhaseBar.css';

interface PhaseBarProps {
  phase: GamePhase;
  isMyTurn: boolean;
  turnPlayerName: string;
}

type DisplayPhase = 'Stand' | 'Draw' | 'Ride' | 'Main' | 'Battle' | 'End';

const DISPLAY_PHASES: DisplayPhase[] = ['Stand', 'Draw', 'Ride', 'Main', 'Battle', 'End'];

function mapToDisplayPhase(phase: GamePhase): DisplayPhase | null {
  if (phase.startsWith('setup')) return null;
  if (phase === 'game-over') return null;
  if (phase === 'stand-phase') return 'Stand';
  if (phase === 'draw-phase') return 'Draw';
  if (phase === 'ride-phase') return 'Ride';
  if (phase === 'main-phase') return 'Main';
  if (phase.startsWith('battle')) return 'Battle';
  if (phase === 'end-phase') return 'End';
  return null;
}

export const PhaseBar: React.FC<PhaseBarProps> = ({ phase, isMyTurn, turnPlayerName }) => {
  const currentDisplay = mapToDisplayPhase(phase);
  const isSetup = phase.startsWith('setup');
  const isGameOver = phase === 'game-over';

  return (
    <div className={`phase-bar ${isMyTurn ? 'phase-bar--my-turn' : 'phase-bar--opp-turn'}`}>
      <div className="phase-bar__turn-indicator">
        <div className={`phase-bar__turn-dot ${isMyTurn ? 'phase-bar__turn-dot--mine' : ''}`} />
        <span className="phase-bar__turn-name">
          {isMyTurn ? 'Your Turn' : `${turnPlayerName}'s Turn`}
        </span>
      </div>

      <div className="phase-bar__phases">
        {isSetup ? (
          <div className="phase-bar__phase phase-bar__phase--active phase-bar__phase--setup">
            Setup
          </div>
        ) : isGameOver ? (
          <div className="phase-bar__phase phase-bar__phase--active phase-bar__phase--game-over">
            Game Over
          </div>
        ) : (
          DISPLAY_PHASES.map((dp) => {
            const isActive = dp === currentDisplay;
            const dpIndex = DISPLAY_PHASES.indexOf(dp);
            const currentIndex = currentDisplay ? DISPLAY_PHASES.indexOf(currentDisplay) : -1;
            const isPast = currentIndex >= 0 && dpIndex < currentIndex;

            return (
              <div
                key={dp}
                className={[
                  'phase-bar__phase',
                  isActive ? 'phase-bar__phase--active' : '',
                  isPast ? 'phase-bar__phase--past' : '',
                ].filter(Boolean).join(' ')}
              >
                {dp}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
