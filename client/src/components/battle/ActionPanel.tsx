import React from 'react';
import {
  PublicVanguardGameState,
  FieldPosition,
  GameAction,
  GamePhase,
} from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import './ActionPanel.css';

interface ActionPanelProps {
  gameState: PublicVanguardGameState;
  myId: string;
  selectedCardId: string | null;
  selectedPosition: FieldPosition | null;
  onAction: (action: GameAction) => Promise<void>;
  pendingAction: { action: GameAction; description: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
  triggerEffectTarget?: string | null;
}

export const ActionPanel: React.FC<ActionPanelProps> = ({
  gameState,
  myId,
  selectedCardId,
  selectedPosition,
  onAction,
  pendingAction,
  onConfirm,
  onCancel,
  triggerEffectTarget,
}) => {
  const { phase, turnPlayerId } = gameState;
  const isMyTurn = turnPlayerId === myId;
  const isDefender = !isMyTurn;

  const renderPhaseActions = (): React.ReactNode => {
    // Show confirmation prompt when an action is pending
    if (pendingAction) {
      return (
        <div className="action-panel__group">
          <p className="action-panel__hint action-panel__hint--confirm">
            {pendingAction.description}
          </p>
          <button
            className="action-panel__btn action-panel__btn--primary"
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            className="action-panel__btn action-panel__btn--secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      );
    }

    switch (phase) {
      case 'setup-rps':
      case 'setup-rps-result':
        return null;

      case 'setup-mulligan':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Select cards to exchange, then confirm. You can only exchange once.
            </p>
            <button
              className="action-panel__btn action-panel__btn--primary"
              onClick={() => onAction({ type: 'setup:submitMulligan', cardIds: ['__exchange__'] })}
            >
              Exchange
            </button>
            <button
              className="action-panel__btn action-panel__btn--secondary"
              onClick={() => onAction({ type: 'setup:submitMulligan', cardIds: [] })}
            >
              Keep Hand
            </button>
          </div>
        );

      case 'ride-phase':
        return isMyTurn ? (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              {selectedCardId
                ? 'Ride the selected card onto your Vanguard Circle.'
                : 'Select a card from your hand to ride, or skip.'}
            </p>
            {selectedCardId && (
              <button
                className="action-panel__btn action-panel__btn--primary"
                onClick={() => onAction({ type: 'ride', cardInstanceId: selectedCardId })}
              >
                Ride
              </button>
            )}
            <button
              className="action-panel__btn action-panel__btn--secondary"
              onClick={() => onAction({ type: 'phase:endPhase' })}
            >
              Skip Ride
            </button>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--waiting">
              Opponent is choosing a unit to ride...
            </p>
          </div>
        );

      case 'main-phase':
        return isMyTurn ? (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              {selectedCardId && selectedPosition
                ? 'Call the selected card to the chosen position.'
                : selectedCardId
                  ? 'Now select a rear-guard circle to call to.'
                  : 'Select a card to call, or proceed to battle.'}
            </p>
            {selectedCardId && selectedPosition && selectedPosition !== 'vanguard' && (
              <button
                className="action-panel__btn action-panel__btn--primary"
                onClick={() =>
                  onAction({
                    type: 'call',
                    cardInstanceId: selectedCardId,
                    position: selectedPosition,
                  })
                }
              >
                Call
              </button>
            )}
            <button
              className="action-panel__btn action-panel__btn--accent"
              onClick={() => onAction({ type: 'phase:endPhase' })}
            >
              Move to Battle
            </button>
            <button
              className="action-panel__btn action-panel__btn--secondary"
              onClick={() => onAction({ type: 'endTurn' })}
            >
              End Turn
            </button>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--waiting">
              Opponent is calling units...
            </p>
          </div>
        );

      case 'battle-phase':
        return isMyTurn ? (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Click a standing unit to declare an attack.
            </p>
            <button
              className="action-panel__btn action-panel__btn--accent"
              onClick={() => onAction({ type: 'endBattle' })}
            >
              End Battle
            </button>
            <button
              className="action-panel__btn action-panel__btn--secondary"
              onClick={() => onAction({ type: 'endTurn' })}
            >
              End Turn
            </button>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--waiting">
              Opponent is selecting an attacker...
            </p>
          </div>
        );

      case 'battle-attack-step':
        return isMyTurn ? (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Click an opponent's unit to select an attack target.
            </p>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--warning">
              Opponent is declaring an attack target...
            </p>
          </div>
        );

      case 'battle-boost-step':
        return isMyTurn ? (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Choose a unit in the back row to boost, or decline.
            </p>
            <button
              className="action-panel__btn action-panel__btn--primary"
              onClick={() => onAction({ type: 'boost:decline' })}
            >
              No Boost
            </button>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--waiting">
              Opponent is choosing whether to boost...
            </p>
          </div>
        );

      case 'battle-guard-step':
        return isDefender ? (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Select cards from hand to guard, or let the attack through.
            </p>
            <button
              className="action-panel__btn action-panel__btn--primary"
              onClick={() => onAction({ type: 'guard:done' })}
            >
              Done Guarding
            </button>
            <button
              className="action-panel__btn action-panel__btn--danger"
              onClick={() => onAction({ type: 'guard:noGuard' })}
            >
              No Guard
            </button>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--waiting">
              Opponent is choosing guardians...
            </p>
          </div>
        );

      case 'battle-drive-check':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--trigger">
              Drive Check in progress...
            </p>
          </div>
        );

      case 'battle-drive-trigger-assign': {
        const driveTriggerDef = gameState.battle?.triggerToAssign ? CARD_DATABASE[gameState.battle.triggerToAssign.cardId] : null;
        const driveTriggerType = driveTriggerDef?.triggerType;
        const driveIsSplittable = driveTriggerType === 'critical' || driveTriggerType === 'stand';
        const driveEffectLabel = driveTriggerType === 'critical' ? 'Critical' : 'Stand';
        const driveHealPending = gameState.battle?.healDamageChoicePending;
        return isMyTurn ? (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--trigger">
              {driveHealPending
                ? 'Pick a damage card to heal!'
                : driveIsSplittable
                  ? (triggerEffectTarget
                      ? 'Now pick a unit for +5000 power'
                      : `Pick a unit for the ${driveEffectLabel} effect`)
                  : 'Pick a unit to give +5000 power to!'}
            </p>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--waiting">
              Opponent is assigning trigger effects...
            </p>
          </div>
        );
      }

      case 'battle-damage-step':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Resolving battle damage...
            </p>
          </div>
        );

      case 'battle-damage-check':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--trigger">
              Damage Check in progress...
            </p>
          </div>
        );

      case 'battle-damage-trigger-assign': {
        const dmgTriggerDef = gameState.battle?.triggerToAssign ? CARD_DATABASE[gameState.battle.triggerToAssign.cardId] : null;
        const dmgTriggerType = dmgTriggerDef?.triggerType;
        const dmgIsSplittable = dmgTriggerType === 'critical' || dmgTriggerType === 'stand';
        const dmgEffectLabel = dmgTriggerType === 'critical' ? 'Critical' : 'Stand';
        const dmgHealPending = gameState.battle?.healDamageChoicePending;
        return isDefender ? (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--trigger">
              {dmgHealPending
                ? 'Pick a damage card to heal!'
                : dmgIsSplittable
                  ? (triggerEffectTarget
                      ? 'Now pick a unit for +5000 power'
                      : `Pick a unit for the ${dmgEffectLabel} effect`)
                  : 'Pick a unit to give +5000 power to!'}
            </p>
          </div>
        ) : (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--waiting">
              Opponent is assigning damage trigger effects...
            </p>
          </div>
        );
      }

      case 'battle-close-step':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Closing the current battle...
            </p>
          </div>
        );

      case 'stand-phase':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              {isMyTurn ? 'Standing all your units...' : "Opponent's units are standing..."}
            </p>
          </div>
        );

      case 'draw-phase':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              {isMyTurn ? 'Drawing a card...' : 'Opponent is drawing a card...'}
            </p>
          </div>
        );

      case 'end-phase':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Ending the turn...
            </p>
          </div>
        );

      case 'setup-choose-vanguard':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Setting up starting vanguard...
            </p>
          </div>
        );

      case 'setup-draw-hand':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              Drawing opening hand...
            </p>
          </div>
        );

      case 'setup-stand-up':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--trigger">
              Stand up, Vanguard!
            </p>
          </div>
        );

      case 'game-over':
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint action-panel__hint--trigger">
              {gameState.winner === myId ? 'Victory!' : 'Defeat...'}
            </p>
          </div>
        );

      default:
        return (
          <div className="action-panel__group">
            <p className="action-panel__hint">
              {getPhaseLabel(phase)}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="action-panel">
      <div className="action-panel__phase-label">{getPhaseLabel(phase)}</div>
      {renderPhaseActions()}
    </div>
  );
};

function getPhaseLabel(phase: GamePhase): string {
  const labels: Partial<Record<GamePhase, string>> = {
    'setup-rps': 'Rock Paper Scissors',
    'setup-rps-result': 'Rock Paper Scissors',
    'setup-choose-vanguard': 'Setup',
    'setup-draw-hand': 'Setup',
    'setup-mulligan': 'Exchange',
    'setup-stand-up': 'Stand Up!',
    'stand-phase': 'Stand Phase',
    'draw-phase': 'Draw Phase',
    'ride-phase': 'Ride Phase',
    'main-phase': 'Main Phase',
    'battle-phase': 'Battle Phase',
    'battle-attack-step': 'Attack Step',
    'battle-boost-step': 'Boost Step',
    'battle-guard-step': 'Guard Step',
    'battle-drive-check': 'Drive Check',
    'battle-drive-trigger-assign': 'Trigger Assign',
    'battle-damage-step': 'Damage Step',
    'battle-damage-check': 'Damage Check',
    'battle-damage-trigger-assign': 'Trigger Assign',
    'battle-close-step': 'Close Step',
    'end-phase': 'End Phase',
    'game-over': 'Game Over',
  };
  return labels[phase] ?? phase;
}
