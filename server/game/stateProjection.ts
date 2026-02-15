import {
  VanguardGameState,
  PublicVanguardGameState,
  PublicPlayerState,
  MyPlayerState,
  PublicCardInstance,
  PublicBattleState,
  PublicRPSState,
  PublicAbilityPendingState,
  CardInstance,
  RearGuardPosition,
} from '../../shared/types';

function toPublicCard(card: CardInstance): PublicCardInstance {
  return {
    instanceId: card.instanceId,
    cardId: card.cardId,
    ownerId: card.ownerId,
    zone: card.zone,
    position: card.position,
    isRested: card.isRested,
    isFaceUp: card.isFaceUp,
    turnPowerModifier: card.turnPowerModifier,
    turnCriticalModifier: card.turnCriticalModifier,
    battlePowerModifier: card.battlePowerModifier,
    battleCriticalModifier: card.battleCriticalModifier,
    continuousPowerModifier: card.continuousPowerModifier,
    lostTwinDrive: card.lostTwinDrive,
  };
}

function resolveCard(state: VanguardGameState, instanceId: string | null): PublicCardInstance | null {
  if (!instanceId) return null;
  const card = state.allCards[instanceId];
  if (!card) return null;
  return toPublicCard(card);
}

function resolveCards(state: VanguardGameState, instanceIds: string[]): PublicCardInstance[] {
  return instanceIds.map(id => toPublicCard(state.allCards[id]));
}

function buildPublicPlayerState(
  state: VanguardGameState,
  playerId: string,
): PublicPlayerState {
  const player = state.players[playerId];

  const rearGuards: Record<RearGuardPosition, PublicCardInstance | null> = {
    'front-left': resolveCard(state, player.rearGuards['front-left']),
    'front-right': resolveCard(state, player.rearGuards['front-right']),
    'back-left': resolveCard(state, player.rearGuards['back-left']),
    'back-center': resolveCard(state, player.rearGuards['back-center']),
    'back-right': resolveCard(state, player.rearGuards['back-right']),
  };

  return {
    id: player.id,
    name: player.name,
    deckId: player.deckId,
    deckCount: player.deck.length,
    handCount: player.hand.length,
    damageZone: resolveCards(state, player.damageZone),
    dropZone: resolveCards(state, player.dropZone),
    soulCount: player.soul.length,
    vanguardCircle: resolveCard(state, player.vanguardCircle),
    rearGuards,
    guardianCircle: resolveCards(state, player.guardianCircle),
    triggerZone: resolveCard(state, player.triggerZone),
    damageCount: player.damageZone.length,
    mulliganComplete: player.mulliganComplete,
    hasRiddenThisTurn: player.hasRiddenThisTurn,
  };
}

function buildMyPlayerState(
  state: VanguardGameState,
  playerId: string,
): MyPlayerState {
  const player = state.players[playerId];
  const publicState = buildPublicPlayerState(state, playerId);

  return {
    ...publicState,
    hand: resolveCards(state, player.hand),
    soul: resolveCards(state, player.soul),
    deck: resolveCards(state, player.deck),
  };
}

function buildPublicBattleState(
  state: VanguardGameState,
): PublicBattleState | null {
  const battle = state.battle;
  if (!battle) return null;

  return {
    attackingUnit: resolveCard(state, battle.attackingUnit),
    attackingPosition: battle.attackingPosition,
    boostingUnit: resolveCard(state, battle.boostingUnit),
    boostingPosition: battle.boostingPosition,
    targetUnit: resolveCard(state, battle.targetUnit),
    targetPosition: battle.targetPosition,
    attackPower: battle.attackPower,
    defendPower: battle.defendPower,
    guardians: resolveCards(state, battle.guardians),
    driveChecksRemaining: battle.driveChecksRemaining,
    driveCheckResults: resolveCards(state, battle.driveCheckResults),
    damageToApply: battle.damageToApply,
    damageApplied: battle.damageApplied,
    triggerToAssign: resolveCard(state, battle.triggerToAssign),
    triggerContext: battle.triggerContext,
    attackerCritical: battle.attackerCritical,
    healDamageChoicePending: battle.healDamageChoicePending,
  };
}

function buildPublicRPSState(
  state: VanguardGameState,
  playerId: string,
): PublicRPSState | null {
  const rps = state.rps;
  if (!rps) return null;

  const opponentId = state.playerIds.find((id: string) => id !== playerId)!;
  const bothChosen = rps.choices[playerId] !== null && rps.choices[opponentId] !== null;

  return {
    myChoice: rps.choices[playerId],
    opponentHasChosen: rps.choices[opponentId] !== null,
    myResult: bothChosen
      ? (rps.result === 'draw'
          ? 'draw'
          : rps.winnerId === playerId ? 'win' : 'lose')
      : null,
    opponentChoice: bothChosen ? rps.choices[opponentId] : null,
    round: rps.round,
  };
}

/**
 * Build the game state view for a specific player.
 * Shows the player's own hand and soul, but hides opponent's.
 */
export function getStateForPlayer(
  state: VanguardGameState,
  playerId: string,
): PublicVanguardGameState {
  const opponentId = state.playerIds.find((id: string) => id !== playerId)!;

  return {
    phase: state.phase,
    turnPlayerId: state.turnPlayerId,
    turnNumber: state.turnNumber,
    firstPlayerId: state.firstPlayerId,
    myState: buildMyPlayerState(state, playerId),
    opponentState: buildPublicPlayerState(state, opponentId),
    battle: buildPublicBattleState(state),
    rps: buildPublicRPSState(state, playerId),
    winner: state.winner,
    actionLog: state.actionLog.slice(-50), // last 50 entries
    abilityPending: buildPublicAbilityPending(state),
  };
}

function buildPublicAbilityPending(
  state: VanguardGameState,
): PublicAbilityPendingState | null {
  const pending = state.abilityPending;
  if (!pending) return null;

  return {
    abilityId: pending.abilityId,
    cardInstanceId: pending.cardInstanceId,
    cardId: pending.cardId,
    playerId: pending.playerId,
    type: pending.type,
    description: pending.description,
    optional: pending.optional,
    validTargets: pending.validTargets
      ? pending.validTargets
          .filter(id => state.allCards[id]) // Filter out pseudo-targets like position strings
          .map(id => toPublicCard(state.allCards[id]))
      : undefined,
    // Pass raw target strings for position-based selections (e.g., callSelfToRC empty RC)
    validTargetPositions: pending.validTargets
      ? pending.validTargets.filter(id => !state.allCards[id])
      : undefined,
    searchResults: pending.searchResults
      ? pending.searchResults.map(id => toPublicCard(state.allCards[id]))
      : undefined,
    minSelections: pending.minSelections,
    maxSelections: pending.maxSelections,
    costDescription: pending.costDescription,
  };
}
