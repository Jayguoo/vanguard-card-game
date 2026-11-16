import React from 'react';
import { GamePhase } from '../../shared/types';
import './PhaseBar.css';

interface PhaseBarProps {
  phase: GamePhase;
  isMyTurn: boolean;
  turnPlayerName: string;
  turnNumber: number;
}

type DisplayPhase = 'Stand' | 'Draw' | 'Ride' | 'Main' | 'Battle' | 'End';

function mapToDisplayPhase(phase: GamePhase): DisplayPhase | null {
  if (phase.startsWith('setup')) return null;
  if (phase === 'game-over') return null;
  if (phase === 'stand-phase') return 'Stand';
  if (phase === 'draw-phase') return 'Draw';
  if (phase === 'ride-phase') return 'Ride';
  if (phase === 'main-phase') return 'Main';
  if (phase.startsWith('battle')) return 'Battle';
  if (phase === 'end-phase') return 'End';
  if (phase === 'ability-pending') return 'Main'; // Abilities mostly fire during or near main phase
  return null;
}

export const PhaseBar: React.FC<PhaseBarProps> = ({ phase, isMyTurn, turnPlayerName, turnNumber }) => {
  const currentDisplay = mapToDisplayPhase(phase);
  const isSetup = phase.startsWith('setup');
  const isGameOver = phase === 'game-over';
  const phaseLabel = isSetup ? 'Setup' : isGameOver ? 'Game Over' : currentDisplay ?? 'Stand';

  return (
    <div className={`phase-bar ${isMyTurn ? 'phase-bar--my-turn' : 'phase-bar--opp-turn'}`}>
      <div className="phase-bar__turn-indicator">
        <span className="phase-bar__turn-name">
          {isMyTurn ? 'Your Turn' : `${turnPlayerName}'s Turn`}
        </span>
        <strong className="phase-bar__turn-number">{turnNumber}</strong>
      </div>
      <div className="phase-bar__current-phase">{phaseLabel}</div>
      <div className="phase-bar__phase-line" aria-hidden="true" />
    </div>
  );
};
