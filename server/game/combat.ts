import {
  VanguardGameState,
  BattleState,
  FieldPosition,
  RearGuardPosition,
  BOOST_COLUMN_REVERSE,
  FRONT_ROW_POSITIONS,
  BACK_ROW_POSITIONS,
} from '../../shared/types';
import { getCardDefinition } from '../../shared/cardDatabase';
import { getAbilitiesForCard } from '../../shared/abilityDefinitions';
import { getCard, getUnitAt, getOpponentId } from './validation';
import { reshuffleDeck } from './deckBuilder';
import { performTriggerCheck, recalculateBattlePowers, resolveRevealedCard } from './triggers';
import {
  checkAbilitiesForEvent,
  clearBattleModifiers,
  recalculateContinuousAbilities,
  processAbilityQueue,
} from './abilities';

function addLog(
  state: VanguardGameState,
  playerId: string,
  message: string,
  type: 'phase' | 'action' | 'trigger' | 'damage' | 'system' = 'action',
): void {
  state.actionLog.push({ timestamp: Date.now(), playerId, message, type });
}

/**
 * Create initial battle state and begin an attack.
 */
export function declareAttack(
  state: VanguardGameState,
  playerId: string,
  attackerPosition: FieldPosition,
  targetPosition: FieldPosition,
): void {
  const opponentId = getOpponentId(state, playerId);

  const attackerInstanceId = getUnitAt(state, playerId, attackerPosition)!;
  const targetInstanceId = getUnitAt(state, opponentId, targetPosition)!;

  const attacker = getCard(state, attackerInstanceId);
  const attackerDef = getCardDefinition(attacker.cardId);
  const targetDef = getCardDefinition(getCard(state, targetInstanceId).cardId);

  // Rest the attacker
  attacker.isRested = true;

  // Determine drive check count
  let driveChecks = 0;
  if (attackerPosition === 'vanguard') {
    if (attackerDef.grade >= 3) {
      driveChecks = attacker.lostTwinDrive ? 1 : 2; // Twin Drive (or 1 if lostTwinDrive)
    } else {
      driveChecks = 1; // Single drive for G1/G2 VG
    }
  }
  // RC attacks have 0 drive checks

  state.battle = {
    attackingUnit: attackerInstanceId,
    attackingPosition: attackerPosition,
    boostingUnit: null,
    boostingPosition: null,
    targetUnit: targetInstanceId,
    targetPosition: targetPosition,
    attackPower: attackerDef.power + attacker.turnPowerModifier + attacker.battlePowerModifier + attacker.continuousPowerModifier,
    defendPower: targetDef.power + getCard(state, targetInstanceId).turnPowerModifier + getCard(state, targetInstanceId).battlePowerModifier + getCard(state, targetInstanceId).continuousPowerModifier,
    guardians: [],
    driveChecksRemaining: driveChecks,
    driveCheckResults: [],
    damageCheckResult: null,
    damageToApply: 0,
    damageApplied: 0,
    triggerToAssign: null,
    triggerContext: null,
    attackerCritical: 1 + attacker.turnCriticalModifier + attacker.battleCriticalModifier + attacker.continuousCriticalModifier,
    healDamageChoicePending: false,
    nullified: false,
  };

  addLog(state, playerId, `${attackerDef.name} attacks ${targetDef.name}!`, 'action');

  // Hook: onAttack abilities (e.g., Bors +3000, Randolf +3000 if hand > opp)
  checkAbilitiesForEvent(state, {
    event: 'onAttack',
    playerId,
    cardInstanceId: attackerInstanceId,
  });

  // Recalculate powers after ability modifiers
  recalculateBattlePowers(state);

  state.phase = 'battle-boost-step';
}

/**
 * Declare a boost for the current attack.
 */
export function declareBoost(
  state: VanguardGameState,
  playerId: string,
  boosterPosition: RearGuardPosition,
): void {
  const battle = state.battle!;
  const player = state.players[playerId];

  const boosterInstanceId = player.rearGuards[boosterPosition]!;
  const booster = getCard(state, boosterInstanceId);
  const boosterDef = getCardDefinition(booster.cardId);

  // Rest the booster
  booster.isRested = true;

  battle.boostingUnit = boosterInstanceId;
  battle.boostingPosition = boosterPosition;

  // Hook: onBoost abilities (e.g., Wingal +4000 to Blaster Blade, Jarran +4000 to Tejas)
  checkAbilitiesForEvent(state, {
    event: 'onBoost',
    playerId,
    cardInstanceId: boosterInstanceId,
    boostedUnitId: battle.attackingUnit!,
  });

  recalculateBattlePowers(state);

  addLog(state, playerId, `Boosted by ${boosterDef.name} (+${boosterDef.power})`, 'action');

  // Move to guard step
  state.phase = 'battle-guard-step';
}

/**
 * Decline to boost - proceed to guard step.
 */
export function declineBoost(state: VanguardGameState): void {
  state.phase = 'battle-guard-step';
}

/**
 * Add a guardian from hand to the guardian circle.
 */
export function addGuardian(
  state: VanguardGameState,
  playerId: string,
  cardInstanceId: string,
): void {
  const player = state.players[playerId];
  const battle = state.battle!;

  // Remove from hand
  const idx = player.hand.indexOf(cardInstanceId);
  if (idx === -1) return;
  player.hand.splice(idx, 1);

  // Move to guardian circle
  const card = getCard(state, cardInstanceId);
  card.zone = 'guardian-circle';
  player.guardianCircle.push(cardInstanceId);
  battle.guardians.push(cardInstanceId);

  const def = getCardDefinition(card.cardId);
  addLog(state, playerId, `Guarded with ${def.name} (Shield: ${def.shield})`, 'action');

  recalculateBattlePowers(state);
}

/**
 * Intercept with a front-row Grade 2 rear-guard.
 */
export function performIntercept(
  state: VanguardGameState,
  playerId: string,
  position: RearGuardPosition,
): void {
  const player = state.players[playerId];
  const battle = state.battle!;

  const unitId = player.rearGuards[position]!;
  const card = getCard(state, unitId);
  const def = getCardDefinition(card.cardId);

  // Remove from RC
  player.rearGuards[position] = null;
  card.zone = 'guardian-circle';
  card.position = undefined;

  // Add to guardian circle
  player.guardianCircle.push(unitId);
  battle.guardians.push(unitId);

  // Check for intercept shield boost abilities (e.g., NGM Prototype)
  let bonusShield = 0;
  const abilities = getAbilitiesForCard(card.cardId);
  for (const ability of abilities) {
    for (const effect of ability.effects) {
      if (effect.type === 'interceptShieldBoost') {
        // Check conditions (e.g., vanguardClan)
        let conditionsMet = true;
        for (const cond of ability.conditions) {
          if (cond.type === 'vanguardClan') {
            const vgId = player.vanguardCircle;
            if (!vgId) { conditionsMet = false; break; }
            const vgCard = getCard(state, vgId);
            const vgDef = getCardDefinition(vgCard.cardId);
            if (vgDef.clan !== cond.clan) { conditionsMet = false; break; }
          }
        }
        if (conditionsMet) {
          bonusShield += effect.amount;
          (card as any)._interceptShieldBonus = effect.amount;
        }
      }
    }
  }

  const totalShield = def.shield + bonusShield;
  addLog(state, playerId, `Intercepted with ${def.name} (Shield: ${totalShield})`, 'action');

  recalculateBattlePowers(state);
}

/**
 * Finish guarding - proceed to drive check or damage step.
 */
export function finishGuarding(state: VanguardGameState): void {
  const battle = state.battle!;

  if (battle.driveChecksRemaining > 0) {
    // VG is attacking - do drive check first
    state.phase = 'battle-drive-check';
  } else {
    // RC attack - go straight to damage step
    state.phase = 'battle-damage-step';
  }
}

/**
 * Execute a drive check.
 * Returns: 'trigger' if trigger found (needs player assignment),
 *          'reveal' if non-trigger (card in triggerZone for client display),
 *          'deckout' if deck empty.
 */
export function executeDriveCheck(state: VanguardGameState): 'trigger' | 'reveal' | 'deckout' {
  const battle = state.battle!;
  const turnPlayerId = state.turnPlayerId;

  const result = performTriggerCheck(state, turnPlayerId, 'drive');
  if (!result) return 'deckout';

  battle.driveChecksRemaining--;

  if (result.hasTrigger) {
    state.phase = 'battle-drive-trigger-assign';
    return 'trigger';
  }

  // Non-trigger: leave card in triggerZone so the client can display it.
  // The server will resolve it after a brief delay via resolveNonTriggerDrive().
  return 'reveal';
}

/**
 * Resolve a non-trigger drive check after the reveal pause.
 * Moves the card from triggerZone to hand and advances the phase.
 */
export function resolveNonTriggerDrive(state: VanguardGameState): void {
  const battle = state.battle!;
  const turnPlayerId = state.turnPlayerId;

  resolveRevealedCard(state, turnPlayerId, 'drive');

  if (battle.driveChecksRemaining > 0) {
    state.phase = 'battle-drive-check';
  } else {
    state.phase = 'battle-damage-step';
  }
}

/**
 * After trigger assignment during drive check, continue.
 */
export function afterDriveTriggerAssign(state: VanguardGameState): void {
  const battle = state.battle!;

  if (battle.driveChecksRemaining > 0) {
    state.phase = 'battle-drive-check';
  } else {
    state.phase = 'battle-damage-step';
  }
}

/**
 * Resolve the damage step - compare powers and deal damage.
 */
export function resolveDamage(state: VanguardGameState): void {
  const battle = state.battle!;
  const opponentId = getOpponentId(state, state.turnPlayerId);

  recalculateBattlePowers(state);

  // Check if attack was nullified by Perfect Guard (sentinel)
  if (battle.nullified) {
    addLog(state, state.turnPlayerId,
      'Attack nullified by Perfect Guard!',
      'action');
    state.phase = 'battle-close-step';
    return;
  }

  if (battle.attackPower >= battle.defendPower) {
    // Attack hits!
    const attackerDef = getCardDefinition(getCard(state, battle.attackingUnit!).cardId);
    const targetDef = getCardDefinition(getCard(state, battle.targetUnit!).cardId);

    addLog(state, state.turnPlayerId,
      `Attack hits! (${battle.attackPower} vs ${battle.defendPower})`,
      'damage');

    // Check if attacking a rear-guard
    if (battle.targetPosition !== 'vanguard') {
      // Retire the rear-guard
      retireUnit(state, opponentId, battle.targetPosition as RearGuardPosition);
      addLog(state, state.turnPlayerId, `${targetDef.name} retired!`, 'damage');

      // Hook: onAttackHitsRG (e.g., Dragonic Overlord re-stand)
      if (battle.attackingUnit) {
        checkAbilitiesForEvent(state, {
          event: 'onAttackHitsRG',
          playerId: state.turnPlayerId,
          cardInstanceId: battle.attackingUnit,
          hitRearGuard: true,
        });
      }

      // Hook: onAttackHits (e.g., Apollon — triggers on any hit, VG or RG)
      if (battle.attackingUnit) {
        checkAbilitiesForEvent(state, {
          event: 'onAttackHits',
          playerId: state.turnPlayerId,
          cardInstanceId: battle.attackingUnit,
        });
      }

      // Hook: onBoostedAttackHits (e.g., Aermo)
      if (battle.boostingUnit) {
        checkAbilitiesForEvent(state, {
          event: 'onBoostedAttackHits',
          playerId: state.turnPlayerId,
          cardInstanceId: battle.boostingUnit,
          boosterInstanceId: battle.boostingUnit,
        });
      }

      // If abilities were queued, process them
      if (state.abilityQueue.length > 0) {
        // Store the current phase target so we return to close-step
        state.phase = 'battle-close-step';
        processAbilityQueue(state);
        return;
      }

      // Move to close step (no damage check for RG hits)
      state.phase = 'battle-close-step';
      return;
    }

    // Hook: onAttackHitsVG (e.g., Gold Rutile's CB(2) stand, Storm unflip)
    if (battle.attackingUnit) {
      checkAbilitiesForEvent(state, {
        event: 'onAttackHitsVG',
        playerId: state.turnPlayerId,
        cardInstanceId: battle.attackingUnit,
        hitVanguard: true,
      });
    }

    // Hook: onAttackHits (e.g., Apollon — triggers on any hit, VG or RG)
    if (battle.attackingUnit) {
      checkAbilitiesForEvent(state, {
        event: 'onAttackHits',
        playerId: state.turnPlayerId,
        cardInstanceId: battle.attackingUnit,
      });
    }

    // Hook: onAllyRGHitsVG — when a rear-guard hits the opponent's VG (Gold Rutile first ability)
    if (battle.attackingPosition !== 'vanguard' && battle.attackingUnit) {
      checkAbilitiesForEvent(state, {
        event: 'onAllyRGHitsVG',
        playerId: state.turnPlayerId,
        attackingUnitId: battle.attackingUnit,
      });
    }

    // Hook: onBoostedAttackHits for VG hit too (e.g., Aermo)
    if (battle.boostingUnit) {
      checkAbilitiesForEvent(state, {
        event: 'onBoostedAttackHits',
        playerId: state.turnPlayerId,
        cardInstanceId: battle.boostingUnit,
        boosterInstanceId: battle.boostingUnit,
      });
    }

    // Attacking VG - deal damage equal to critical
    battle.damageToApply = battle.attackerCritical;
    battle.damageApplied = 0;

    // If abilities were queued (like Aermo), process them before damage
    if (state.abilityQueue.length > 0) {
      state.phase = 'battle-damage-check';
      processAbilityQueue(state);
      return;
    }

    // Start damage check sequence
    state.phase = 'battle-damage-check';
  } else {
    // Attack misses
    addLog(state, state.turnPlayerId,
      `Attack blocked! (${battle.attackPower} vs ${battle.defendPower})`,
      'action');
    state.phase = 'battle-close-step';
  }
}

/**
 * Execute a damage check for the defending player.
 * Returns: 'trigger' if trigger found (needs player assignment),
 *          'reveal' if non-trigger (card in triggerZone for client display),
 *          'deckout' if deck empty.
 */
export function executeDamageCheck(state: VanguardGameState): 'trigger' | 'reveal' | 'deckout' {
  const battle = state.battle!;
  const opponentId = getOpponentId(state, state.turnPlayerId);

  const result = performTriggerCheck(state, opponentId, 'damage');
  if (!result) return 'deckout';

  battle.damageApplied++;

  if (result.hasTrigger) {
    state.phase = 'battle-damage-trigger-assign';
    return 'trigger';
  }

  // Non-trigger: leave card in triggerZone so the client can display it.
  // The server will resolve it after a brief delay via resolveNonTriggerDamage().
  return 'reveal';
}

/**
 * Resolve a non-trigger damage check after the reveal pause.
 * Moves the card from triggerZone to damage zone and advances the phase.
 */
export function resolveNonTriggerDamage(state: VanguardGameState): void {
  const battle = state.battle!;
  const opponentId = getOpponentId(state, state.turnPlayerId);

  resolveRevealedCard(state, opponentId, 'damage');

  // Check for 6 damage
  const opponent = state.players[opponentId];
  if (opponent.damageZone.length >= 6) {
    state.winner = state.turnPlayerId;
    state.phase = 'game-over';
    addLog(state, state.turnPlayerId, `${opponent.name} has taken 6 damage! Game over!`, 'system');
    return;
  }

  // More damage to apply?
  if (battle.damageApplied < battle.damageToApply) {
    state.phase = 'battle-damage-check';
  } else {
    state.phase = 'battle-close-step';
  }
}

/**
 * After trigger assignment during damage check, continue.
 */
export function afterDamageTriggerAssign(state: VanguardGameState): void {
  const battle = state.battle!;
  const opponentId = getOpponentId(state, state.turnPlayerId);
  const opponent = state.players[opponentId];

  // Check if defender has reached 6 damage
  if (opponent.damageZone.length >= 6) {
    state.winner = state.turnPlayerId;
    state.phase = 'game-over';
    addLog(state, state.turnPlayerId, `${opponent.name} has taken 6 damage! Game over!`, 'system');
    return;
  }

  // More damage to apply?
  if (battle.damageApplied < battle.damageToApply) {
    state.phase = 'battle-damage-check';
  } else {
    state.phase = 'battle-close-step';
  }
}

/**
 * Close the current battle - cleanup guardians, reset battle state.
 */
export function closeBattle(state: VanguardGameState): void {
  const battle = state.battle!;
  const turnPlayerId = state.turnPlayerId;
  const opponentId = getOpponentId(state, turnPlayerId);
  const opponent = state.players[opponentId];

  // Move all guardians to drop zone
  for (const guardianId of opponent.guardianCircle) {
    const guardian = getCard(state, guardianId);
    guardian.zone = 'drop-zone';
    guardian.position = undefined;
    opponent.dropZone.push(guardianId);
  }
  opponent.guardianCircle = [];

  // Handle _returnToDeckAfterBattle (Battleraizer boost ability)
  // Check all units on the turn player's field for this flag
  const turnPlayer = state.players[turnPlayerId];
  const allPositions = [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[];
  for (const pos of allPositions) {
    const unitId = turnPlayer.rearGuards[pos];
    if (!unitId) continue;
    const card = state.allCards[unitId];
    if ((card as any)._returnToDeckAfterBattle) {
      // Remove the flag
      delete (card as any)._returnToDeckAfterBattle;

      // Return to bottom of deck
      turnPlayer.rearGuards[pos] = null;
      card.zone = 'deck';
      card.position = undefined;
      card.isRested = false;
      card.turnPowerModifier = 0;
      card.turnCriticalModifier = 0;
      card.battlePowerModifier = 0;
      card.battleCriticalModifier = 0;
      turnPlayer.deck.push(unitId);
      turnPlayer.deck = reshuffleDeck(turnPlayer.deck);

      const cardDef = getCardDefinition(card.cardId);
      state.actionLog.push({
        timestamp: Date.now(),
        playerId: turnPlayerId,
        message: `${cardDef.name} returned to deck (deck shuffled)`,
        type: 'ability',
      });
    }
  }

  // Clear battle-scoped modifiers on all cards
  clearBattleModifiers(state);

  // Reset battle state but keep it for reference
  state.battle = null;

  // Return to battle phase (player can declare more attacks or end)
  state.phase = 'battle-phase';
}

/**
 * Retire a rear-guard to the drop zone.
 */
export function retireUnit(
  state: VanguardGameState,
  playerId: string,
  position: RearGuardPosition,
): void {
  const player = state.players[playerId];
  const unitId = player.rearGuards[position];
  if (!unitId) return;

  const card = getCard(state, unitId);
  card.zone = 'drop-zone';
  card.position = undefined;
  card.isRested = false;
  card.turnPowerModifier = 0;
  card.turnCriticalModifier = 0;
  card.battlePowerModifier = 0;
  card.battleCriticalModifier = 0;

  player.rearGuards[position] = null;
  player.dropZone.push(unitId);

  // Hook: onOpponentRGRetired — check during main phase only
  // Yaksha (superior ride from hand), Joka/Rakshasa (+3000)
  const turnPlayerId = state.turnPlayerId;
  const opponentOfRetiredUnit = getOpponentId(state, playerId);
  const isMainPhaseRetire = state.phase === 'main-phase' || state.phase === 'ability-pending';

  if (isMainPhaseRetire && opponentOfRetiredUnit === turnPlayerId) {
    checkAbilitiesForEvent(state, {
      event: 'onOpponentRGRetired',
      playerId: turnPlayerId,
    });
  }
}
