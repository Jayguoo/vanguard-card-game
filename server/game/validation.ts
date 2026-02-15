import {
  VanguardGameState,
  FieldPosition,
  RearGuardPosition,
  FRONT_ROW_POSITIONS,
  BACK_ROW_POSITIONS,
  BOOST_COLUMN_REVERSE,
  CardInstance,
} from '../../shared/types';
import { getCardDefinition } from '../../shared/cardDatabase';
import { getAbilitiesForCard } from '../../shared/abilityDefinitions';

// Helper to get a card instance
export function getCard(state: VanguardGameState, instanceId: string): CardInstance {
  const card = state.allCards[instanceId];
  if (!card) throw new Error(`Card instance not found: ${instanceId}`);
  return card;
}

// Helper to get the unit at a field position for a player
export function getUnitAt(
  state: VanguardGameState,
  playerId: string,
  position: FieldPosition,
): string | null {
  const player = state.players[playerId];
  if (position === 'vanguard') return player.vanguardCircle;
  return player.rearGuards[position];
}

// Helper to get the opponent's ID
export function getOpponentId(state: VanguardGameState, playerId: string): string {
  return state.playerIds.find((id: string) => id !== playerId)!;
}

// Get the current vanguard's grade for a player
export function getVanguardGrade(state: VanguardGameState, playerId: string): number {
  const player = state.players[playerId];
  if (!player.vanguardCircle) return -1;
  const vgCard = getCard(state, player.vanguardCircle);
  const def = getCardDefinition(vgCard.cardId);
  return def.grade;
}

// Can the player ride a specific card?
export function canRide(
  state: VanguardGameState,
  playerId: string,
  cardInstanceId: string,
): boolean {
  const player = state.players[playerId];
  if (player.hasRiddenThisTurn) return false;
  if (!player.hand.includes(cardInstanceId)) return false;

  const card = getCard(state, cardInstanceId);
  const cardDef = getCardDefinition(card.cardId);
  const currentGrade = getVanguardGrade(state, playerId);

  // Can ride same grade or +1
  return cardDef.grade === currentGrade || cardDef.grade === currentGrade + 1;
}

// Can the player call a card to a specific RC position?
export function canCall(
  state: VanguardGameState,
  playerId: string,
  cardInstanceId: string,
  position: RearGuardPosition,
): boolean {
  const player = state.players[playerId];
  if (!player.hand.includes(cardInstanceId)) return false;

  const card = getCard(state, cardInstanceId);
  const cardDef = getCardDefinition(card.cardId);
  const vgGrade = getVanguardGrade(state, playerId);

  // Card grade must be <= VG grade
  if (cardDef.grade > vgGrade) return false;

  // Grade 0 non-trigger can be called to back row only (trigger G0s can't be called normally)
  // Actually in Vanguard, Grade 0 units generally cannot be called from hand
  // except through specific card effects. Trigger units definitely can't be normal called.
  if (cardDef.grade === 0) return false;

  // Check position validity: Grade 1 can go anywhere, Grade 2 can go anywhere, Grade 3 technically
  // can only be on VC but CAN be called to RC if grade <= VG grade (which it is for G3 VG)
  // Actually any grade can go to any RC as long as grade <= VG grade
  return true;
}

// Can a unit at a position attack a target?
export function canAttack(
  state: VanguardGameState,
  playerId: string,
  attackerPosition: FieldPosition,
  targetPosition: FieldPosition,
): boolean {
  const player = state.players[playerId];
  const opponentId = getOpponentId(state, playerId);

  // Get attacker
  const attackerInstanceId = getUnitAt(state, playerId, attackerPosition);
  if (!attackerInstanceId) return false;

  const attacker = getCard(state, attackerInstanceId);
  if (attacker.isRested) return false; // must be standing

  // Attacker must be in front row or VG
  if (attackerPosition !== 'vanguard' && !FRONT_ROW_POSITIONS.includes(attackerPosition as RearGuardPosition)) {
    return false; // back row can't attack
  }

  // Target must exist
  const targetInstanceId = getUnitAt(state, opponentId, targetPosition);
  if (!targetInstanceId) return false;

  // Target must be VG or front row RC — unless attacker has canAttackBackRow
  if (targetPosition !== 'vanguard' && !FRONT_ROW_POSITIONS.includes(targetPosition as RearGuardPosition)) {
    // Check if attacker has Tejas-style back-row targeting ability
    const attackerCard = getCard(state, attackerInstanceId);
    const abilities = getAbilitiesForCard(attackerCard.cardId);
    const hasBackRowAbility = abilities.some(a =>
      a.effects.some(e => e.type === 'canAttackBackRow')
    );

    if (!hasBackRowAbility) {
      return false; // can't attack back row without ability
    }

    // Tejas can only target the same column's back row
    const sameColumnOnly = abilities.some(a =>
      a.effects.some(e => e.type === 'canAttackBackRow' && e.sameColumn)
    );

    if (sameColumnOnly) {
      // Check column mapping: front-left -> back-left, vanguard -> back-center, front-right -> back-right
      const columnMap: Record<string, string> = {
        'front-left': 'back-left',
        'vanguard': 'back-center',
        'front-right': 'back-right',
      };
      const expectedBackRow = columnMap[attackerPosition];
      if (targetPosition !== expectedBackRow) {
        return false;
      }
    }
  }

  return true;
}

// Can a unit boost the current attacker?
export function canBoost(
  state: VanguardGameState,
  playerId: string,
  boosterPosition: RearGuardPosition,
): boolean {
  if (!state.battle || !state.battle.attackingPosition) return false;

  const player = state.players[playerId];

  // Booster must be in back row
  if (!BACK_ROW_POSITIONS.includes(boosterPosition)) return false;

  // Must be directly behind the attacker
  const expectedBoostPos = BOOST_COLUMN_REVERSE[state.battle.attackingPosition];
  if (boosterPosition !== expectedBoostPos) return false;

  // Booster must exist and be standing
  const boosterInstanceId = player.rearGuards[boosterPosition];
  if (!boosterInstanceId) return false;

  const booster = getCard(state, boosterInstanceId);
  if (booster.isRested) return false;

  // Must be Grade 0 or 1
  const def = getCardDefinition(booster.cardId);
  if (def.grade > 1) return false;

  return true;
}

// Can a card be used as a guardian from hand?
export function canGuard(
  state: VanguardGameState,
  playerId: string,
  cardInstanceId: string,
): boolean {
  const player = state.players[playerId];
  if (!player.hand.includes(cardInstanceId)) return false;

  const card = getCard(state, cardInstanceId);
  const def = getCardDefinition(card.cardId);

  // Grade 3 cannot guard from hand (0 shield)
  if (def.shield <= 0) return false;

  return true;
}

// Can a front-row Grade 2 RC intercept?
export function canIntercept(
  state: VanguardGameState,
  playerId: string,
  position: RearGuardPosition,
): boolean {
  if (!FRONT_ROW_POSITIONS.includes(position)) return false;

  const player = state.players[playerId];
  const unitId = player.rearGuards[position];
  if (!unitId) return false;

  const unit = getCard(state, unitId);
  const def = getCardDefinition(unit.cardId);

  // Must be Grade 2
  if (def.grade !== 2) return false;

  // Must be standing (some interpretations allow rested intercept, but standard requires standing)
  // Actually in standard Vanguard, rested units CAN intercept
  return true;
}

// Can a unit move from one RC to another?
export function canMoveRearGuard(
  state: VanguardGameState,
  playerId: string,
  from: RearGuardPosition,
  to: RearGuardPosition,
): boolean {
  const player = state.players[playerId];
  // Source must have a unit
  if (!player.rearGuards[from]) return false;
  // Destination must be empty
  if (player.rearGuards[to]) return false;
  // Can only move within the same row
  const fromIsBackRow = BACK_ROW_POSITIONS.includes(from);
  const toIsBackRow = BACK_ROW_POSITIONS.includes(to);
  // Actually in Vanguard, you can move units between any empty RC positions
  // during main phase (same or different row)
  return true;
}

// Check if there's a valid boost position for the current attacker
export function hasValidBoostOption(
  state: VanguardGameState,
  playerId: string,
): boolean {
  if (!state.battle || !state.battle.attackingPosition) return false;
  const expectedBoostPos = BOOST_COLUMN_REVERSE[state.battle.attackingPosition];
  if (!expectedBoostPos) return false;
  return canBoost(state, playerId, expectedBoostPos);
}

// Get all valid attack targets for a given attacker position
export function getValidAttackTargets(
  state: VanguardGameState,
  playerId: string,
  attackerPosition: FieldPosition,
): FieldPosition[] {
  const targets: FieldPosition[] = [];
  const opponentId = getOpponentId(state, playerId);

  // Can always attack VG if it exists
  if (getUnitAt(state, opponentId, 'vanguard')) {
    targets.push('vanguard');
  }

  // Can attack front row RCs
  for (const pos of FRONT_ROW_POSITIONS) {
    if (getUnitAt(state, opponentId, pos)) {
      targets.push(pos);
    }
  }

  // Check for Tejas-style back row targeting
  const attackerInstanceId = getUnitAt(state, playerId, attackerPosition);
  if (attackerInstanceId) {
    const attackerCard = getCard(state, attackerInstanceId);
    const abilities = getAbilitiesForCard(attackerCard.cardId);
    const hasBackRowAbility = abilities.some(a =>
      a.effects.some(e => e.type === 'canAttackBackRow')
    );

    if (hasBackRowAbility) {
      const columnMap: Record<string, RearGuardPosition> = {
        'front-left': 'back-left',
        'vanguard': 'back-center',
        'front-right': 'back-right',
      };
      const backRowTarget = columnMap[attackerPosition];
      if (backRowTarget && getUnitAt(state, opponentId, backRowTarget)) {
        targets.push(backRowTarget);
      }
    }
  }

  return targets;
}

// Get all positions with standing attackers
export function getValidAttackers(
  state: VanguardGameState,
  playerId: string,
): FieldPosition[] {
  const attackers: FieldPosition[] = [];
  const player = state.players[playerId];

  // Check VG
  if (player.vanguardCircle) {
    const vg = getCard(state, player.vanguardCircle);
    if (!vg.isRested) attackers.push('vanguard');
  }

  // Check front row RCs
  for (const pos of FRONT_ROW_POSITIONS) {
    const unitId = player.rearGuards[pos];
    if (unitId) {
      const unit = getCard(state, unitId);
      if (!unit.isRested) attackers.push(pos);
    }
  }

  return attackers;
}
