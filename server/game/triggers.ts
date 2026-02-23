import {
  VanguardGameState,
  CardInstance,
  GamePhase,
} from '../../shared/types';
import { getCardDefinition } from '../../shared/cardDatabase';
import { getCard, getOpponentId } from './validation';
import { checkAbilitiesForEvent } from './abilities';

export interface TriggerCheckResult {
  revealedCard: CardInstance;
  hasTrigger: boolean;
  triggerType?: string;
  needsAssignment: boolean; // true if player must assign power
  autoEffectApplied?: string; // description of auto effect (draw, heal)
}

/**
 * Perform a trigger check (drive check or damage check).
 * Reveals the top card of the player's deck, checks for trigger,
 * and applies immediate effects (draw, heal).
 * Returns info about whether power assignment is needed.
 */
export function performTriggerCheck(
  state: VanguardGameState,
  playerId: string,
  context: 'drive' | 'damage',
): TriggerCheckResult | null {
  const player = state.players[playerId];

  if (player.deck.length === 0) {
    // Deck out - player loses
    state.winner = getOpponentId(state, playerId);
    state.phase = 'game-over';
    return null;
  }

  // Reveal top card
  const topCardId = player.deck.shift()!;
  const card = getCard(state, topCardId);
  const def = getCardDefinition(card.cardId);

  // Move to trigger zone
  card.zone = 'trigger-zone';
  card.isFaceUp = true;
  player.triggerZone = topCardId;

  // Hook: onDriveCheckReveal — fires for ALL drive checks
  // (Brigitte, Tristan: +5000 if G3 RP revealed; Goku: retire G1-or-less if G3 Kagero)
  if (context === 'drive') {
    checkAbilitiesForEvent(state, {
      event: 'onDriveCheckReveal',
      playerId,
      revealedCardId: topCardId,
    });
  }

  if (def.triggerType) {
    // Trigger detected!
    let autoEffectApplied: string | undefined;

    switch (def.triggerType) {
      case 'draw':
        // Draw 1 card immediately
        if (player.deck.length > 0) {
          const drawnCardId = player.deck.shift()!;
          const drawnCard = getCard(state, drawnCardId);
          drawnCard.zone = 'hand';
          drawnCard.isFaceUp = true;
          player.hand.push(drawnCardId);
          autoEffectApplied = 'Drew 1 card';
        }
        break;

      case 'heal': {
        // Heal 1 damage only if the player has equal or more damage than the opponent
        const opponentId = getOpponentId(state, playerId);
        const opponent = state.players[opponentId];
        if (player.damageZone.length > 0 && player.damageZone.length >= opponent.damageZone.length) {
          // Mark that heal choice is pending — player picks during trigger assign
          state.battle!.healDamageChoicePending = true;
          autoEffectApplied = 'Choose a damage card to heal';
        }
        break;
      }

      case 'critical':
        // Critical bonus assigned during trigger assignment
        break;

      case 'stand':
        // Stand effect assigned during trigger assignment
        break;
    }

    // Player needs to assign +5000 power to a unit
    state.battle!.triggerToAssign = topCardId;
    state.battle!.triggerContext = context;

    addLogEntry(state, playerId, `Trigger check: ${def.triggerType.toUpperCase()} Trigger! (${def.name})`, 'trigger');
    if (autoEffectApplied) {
      addLogEntry(state, playerId, autoEffectApplied, 'trigger');
    }

    return {
      revealedCard: card,
      hasTrigger: true,
      triggerType: def.triggerType,
      needsAssignment: true,
      autoEffectApplied,
    };
  } else {
    // No trigger - keep card in trigger zone for reveal display
    // It will be moved to hand/damage by resolveRevealedCard()
    addLogEntry(state, playerId,
      context === 'drive'
        ? `Drive check: ${def.name} (no trigger)`
        : `Damage check: ${def.name} (no trigger)`,
      context === 'drive' ? 'action' : 'damage');

    return {
      revealedCard: card,
      hasTrigger: false,
      needsAssignment: false,
    };
  }
}

/**
 * Move a non-trigger card from the trigger zone to its final destination (hand or damage zone).
 * Called after a brief reveal pause.
 */
export function resolveRevealedCard(
  state: VanguardGameState,
  playerId: string,
  context: 'drive' | 'damage',
): void {
  const player = state.players[playerId];
  if (!player.triggerZone) return;

  const cardId = player.triggerZone;
  const card = getCard(state, cardId);

  player.triggerZone = null;

  if (context === 'drive') {
    card.zone = 'hand';
    card.isFaceUp = true;
    player.hand.push(cardId);
  } else {
    card.zone = 'damage-zone';
    card.isFaceUp = true;
    player.damageZone.push(cardId);
  }
}

/**
 * Assign trigger power (+5000) and trigger-specific effects to a target unit.
 * For critical/stand triggers, effectTargetInstanceId can specify a different unit
 * to receive the special effect (critical +1 or stand), while targetInstanceId gets the power.
 */
export function assignTriggerEffects(
  state: VanguardGameState,
  playerId: string,
  targetInstanceId: string,
  effectTargetInstanceId?: string,
): void {
  const player = state.players[playerId];
  const battle = state.battle!;

  if (!battle.triggerToAssign) return;

  const triggerCard = getCard(state, battle.triggerToAssign);
  const triggerDef = getCardDefinition(triggerCard.cardId);
  const targetCard = getCard(state, targetInstanceId);
  const context = battle.triggerContext!;

  // Apply +5000 power to the power target
  targetCard.turnPowerModifier += (triggerDef.triggerPower || 5000);
  const powerTargetName = getCardDefinition(targetCard.cardId).name;

  // Determine the effect target (defaults to same as power target)
  const effectId = effectTargetInstanceId ?? targetInstanceId;
  const effectCard = getCard(state, effectId);
  const effectTargetName = getCardDefinition(effectCard.cardId).name;
  const isSplit = effectId !== targetInstanceId;

  // Apply trigger-specific effects
  if (triggerDef.triggerType === 'critical') {
    // +1 critical to the effect target
    effectCard.turnCriticalModifier += 1;
    // Update battle attacker critical if the effect target is the attacker
    if (battle.attackingUnit && effectId === battle.attackingUnit) {
      battle.attackerCritical = 1 + effectCard.turnCriticalModifier;
    }
    if (isSplit) {
      addLogEntry(state, playerId, `Assigned Critical +1 to ${effectTargetName} and Power +5000 to ${powerTargetName}`, 'trigger');
    } else {
      addLogEntry(state, playerId, `Assigned Critical +1 and Power +5000 to ${powerTargetName}`, 'trigger');
    }
  } else if (triggerDef.triggerType === 'stand') {
    // Stand the effect target (any rested unit including vanguard)
    if (effectCard.isRested) {
      effectCard.isRested = false;
      if (isSplit) {
        addLogEntry(state, playerId, `Stood ${effectTargetName} and assigned Power +5000 to ${powerTargetName}`, 'trigger');
      } else {
        addLogEntry(state, playerId, `Stood ${effectTargetName} and assigned Power +5000`, 'trigger');
      }
    } else {
      addLogEntry(state, playerId, `Assigned Power +5000 to ${powerTargetName}`, 'trigger');
    }
  } else {
    addLogEntry(state, playerId, `Assigned Power +5000 to ${powerTargetName}`, 'trigger');
  }

  // Recalculate battle powers if in battle
  recalculateBattlePowers(state);

  // Move trigger card to its final destination
  player.triggerZone = null;

  if (context === 'drive') {
    triggerCard.zone = 'hand';
    player.hand.push(battle.triggerToAssign);
  } else {
    triggerCard.zone = 'damage-zone';
    triggerCard.isFaceUp = true;
    player.damageZone.push(battle.triggerToAssign);
  }

  // Clear trigger assignment state
  battle.triggerToAssign = null;
  battle.triggerContext = null;
}

/**
 * Recalculate attack and defend powers based on current modifiers.
 */
export function recalculateBattlePowers(state: VanguardGameState): void {
  const battle = state.battle;
  if (!battle || !battle.attackingUnit || !battle.targetUnit) return;

  const attacker = getCard(state, battle.attackingUnit);
  const attackerDef = getCardDefinition(attacker.cardId);

  let attackPower = attackerDef.power
    + attacker.turnPowerModifier
    + attacker.battlePowerModifier
    + attacker.continuousPowerModifier;

  // Add boost power
  if (battle.boostingUnit) {
    const booster = getCard(state, battle.boostingUnit);
    const boosterDef = getCardDefinition(booster.cardId);
    attackPower += boosterDef.power
      + booster.turnPowerModifier
      + booster.battlePowerModifier
      + booster.continuousPowerModifier;
  }

  battle.attackPower = attackPower;

  // Update attacker critical to include all modifiers
  battle.attackerCritical = 1
    + attacker.turnCriticalModifier
    + attacker.battleCriticalModifier;

  // Defend power
  const target = getCard(state, battle.targetUnit);
  const targetDef = getCardDefinition(target.cardId);
  let defendPower = targetDef.power
    + target.turnPowerModifier
    + target.battlePowerModifier
    + target.continuousPowerModifier;

  // Add guardian shield values
  for (const guardianId of battle.guardians) {
    const guardian = getCard(state, guardianId);
    const guardianDef = getCardDefinition(guardian.cardId);
    defendPower += guardianDef.shield + ((guardian as any)._interceptShieldBonus || 0);
  }

  battle.defendPower = defendPower;
}

function addLogEntry(
  state: VanguardGameState,
  playerId: string,
  message: string,
  type: 'phase' | 'action' | 'trigger' | 'damage' | 'system',
): void {
  state.actionLog.push({
    timestamp: Date.now(),
    playerId,
    message,
    type,
  });
}
