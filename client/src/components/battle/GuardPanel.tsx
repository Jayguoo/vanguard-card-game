import React, { useRef, useState, useEffect } from 'react';
import { PublicBattleState } from '../../shared/types';
import { CARD_DATABASE } from '../../shared/cardDatabase';
import { VanguardCard } from '../cards/VanguardCard';
import './GuardPanel.css';

interface GuardPanelProps {
  battle: PublicBattleState;
  isDefender: boolean;
}

export const GuardPanel: React.FC<GuardPanelProps> = ({ battle, isDefender }) => {
  const attackerDef = battle.attackingUnit ? CARD_DATABASE[battle.attackingUnit.cardId] : null;
  const targetDef = battle.targetUnit ? CARD_DATABASE[battle.targetUnit.cardId] : null;

  const attackHitsTarget = battle.attackPower >= battle.defendPower;

  // Track power changes for pulse animation
  const prevAttackPowerRef = useRef(battle.attackPower);
  const prevDefendPowerRef = useRef(battle.defendPower);
  const [attackPulse, setAttackPulse] = useState(false);
  const [defendPulse, setDefendPulse] = useState(false);

  useEffect(() => {
    if (battle.attackPower !== prevAttackPowerRef.current) {
      prevAttackPowerRef.current = battle.attackPower;
      setAttackPulse(true);
      const timer = setTimeout(() => setAttackPulse(false), 400);
      return () => clearTimeout(timer);
    }
  }, [battle.attackPower]);

  useEffect(() => {
    if (battle.defendPower !== prevDefendPowerRef.current) {
      prevDefendPowerRef.current = battle.defendPower;
      setDefendPulse(true);
      const timer = setTimeout(() => setDefendPulse(false), 400);
      return () => clearTimeout(timer);
    }
  }, [battle.defendPower]);

  return (
    <div className="guard-panel">
      <div className="guard-panel__header">Battle</div>

      <div className="guard-panel__combat">
        {/* Attacker side */}
        <div className="guard-panel__side guard-panel__side--attacker">
          <div className="guard-panel__side-label">Attack</div>
          <div className={`guard-panel__power guard-panel__power--attack ${attackPulse ? 'guard-panel__power--pulse' : ''}`}>
            {battle.attackPower}
          </div>
          {attackerDef && (
            <div className="guard-panel__unit-name">{attackerDef.name}</div>
          )}
          {battle.boostingUnit && (
            <div className="guard-panel__boost-info">
              + {CARD_DATABASE[battle.boostingUnit.cardId]?.name ?? 'Boost'}
            </div>
          )}
        </div>

        {/* VS indicator */}
        <div className="guard-panel__vs">
          <div className={`guard-panel__vs-icon ${attackHitsTarget ? 'guard-panel__vs-icon--hit' : 'guard-panel__vs-icon--block'}`}>
            VS
          </div>
          <div className={`guard-panel__result ${attackHitsTarget ? 'guard-panel__result--hit' : 'guard-panel__result--block'}`}>
            {attackHitsTarget ? 'HIT' : 'GUARD'}
          </div>
        </div>

        {/* Defender side */}
        <div className="guard-panel__side guard-panel__side--defender">
          <div className="guard-panel__side-label">Defense</div>
          <div className={`guard-panel__power guard-panel__power--defend ${defendPulse ? 'guard-panel__power--pulse' : ''}`}>
            {battle.defendPower}
          </div>
          {targetDef && (
            <div className="guard-panel__unit-name">{targetDef.name}</div>
          )}
        </div>
      </div>

      {/* Guardian Circle */}
      {battle.guardians.length > 0 && (
        <div className="guard-panel__guardians">
          <div className="guard-panel__guardians-label">
            Guardian Circle ({battle.guardians.length})
          </div>
          <div className="guard-panel__guardians-list">
            {battle.guardians.map((guardian) => {
              const gDef = CARD_DATABASE[guardian.cardId];
              return (
                <div key={guardian.instanceId} className="guard-panel__guardian-item">
                  <VanguardCard card={guardian} size="small" showPowerOverlay={false} />
                  {gDef && (
                    <div className="guard-panel__guardian-shield">
                      Shield: {gDef.shield}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {battle.guardians.length === 0 && isDefender && (
        <div className="guard-panel__no-guardians">
          No guardians placed yet. Select cards from your hand to guard.
        </div>
      )}
    </div>
  );
};
