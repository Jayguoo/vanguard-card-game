// ============================================
// ABILITY ENGINE
// ============================================
// Core logic for checking, queuing, and resolving
// card abilities at runtime.
// ============================================

import {
  VanguardGameState,
  CardInstance,
  FieldPosition,
  RearGuardPosition,
  GamePhase,
  FRONT_ROW_POSITIONS,
  BACK_ROW_POSITIONS,
} from '../../shared/types';
import { getCardDefinition } from '../../shared/cardDatabase';
import {
  AbilityDef,
  AbilityTriggerEvent,
  AbilityCost,
  AbilityCondition,
  AbilityEffect,
  getAbilitiesForCard,
} from '../../shared/abilityDefinitions';
import { getCard, getUnitAt, getOpponentId } from './validation';

// ---- Logging helper ----

function addLog(
  state: VanguardGameState,
  playerId: string,
  message: string,
  type: 'phase' | 'action' | 'trigger' | 'damage' | 'system' | 'ability' = 'ability',
): void {
  state.actionLog.push({ timestamp: Date.now(), playerId, message, type });
}

// ============================================
// CONTEXT — passed to ability checks
// ============================================

export interface AbilityContext {
  event: AbilityTriggerEvent;
  /** The card instance whose ability might trigger */
  cardInstanceId?: string;
  /** Player who owns the triggering card (or the turn player for events) */
  playerId?: string;
  /** For onDriveCheckReveal: the revealed card */
  revealedCardId?: string;
  /** For onBoost: the unit being boosted */
  boostedUnitId?: string;
  /** For onAttackHitsRG: whether the attack hit a rear-guard */
  hitRearGuard?: boolean;
  /** For onBoostedAttackHits: the booster instanceId */
  boosterInstanceId?: string;
  /** For onPlaceVC/RC: the card that was just placed */
  placedCardId?: string;
}

// ============================================
// CHECK ABILITIES FOR EVENT
// ============================================
// Scans the field for abilities matching an event.
// Simple ones auto-resolve; complex ones get queued.

export function checkAbilitiesForEvent(
  state: VanguardGameState,
  context: AbilityContext,
): void {
  const { event, playerId } = context;
  if (!playerId) return;

  // For certain events, only the specific card should be checked (not all field units)
  // - Placement events: only the placed card
  // - onAttack: only the attacking unit
  // - onBoost: only the boosting unit
  // - onAttackHitsRG: only the attacking unit
  const isSingleCardEvent =
    event === 'onPlaceVC' || event === 'onPlaceRC' || event === 'onPlaceVCorRC' ||
    event === 'onAttack' || event === 'onBoost' ||
    event === 'onAttackHitsRG' || event === 'onBoostedAttackHits';

  // Gather all units on the field for the relevant player(s)
  const playerIds = getPlayersToCheck(state, event, playerId);

  for (const pid of playerIds) {
    const units = getFieldUnits(state, pid);

    for (const { instanceId, position } of units) {
      // For single-card events, only the specific card should be checked
      if (isSingleCardEvent && instanceId !== context.cardInstanceId) continue;

      const card = state.allCards[instanceId];
      const abilities = getAbilitiesForCard(card.cardId);

      for (let i = 0; i < abilities.length; i++) {
        const ability = abilities[i];

        // Check if this ability matches the event
        if (ability.triggerEvent !== event) continue;

        // Check location restriction
        if (!checkLocation(ability, position)) continue;

        // Check if conditions are met
        if (!checkConditions(state, pid, instanceId, ability.conditions, context)) continue;

        // This ability should fire!
        resolveOrQueueAbility(state, pid, instanceId, ability, context);
      }
    }

    // For 'onOpponentRGRetired', also check hand for Yaksha
    if (event === 'onOpponentRGRetired') {
      checkHandAbilitiesForEvent(state, pid, context);
    }
  }
}

/**
 * Check hand for abilities that trigger from hand (like Yaksha).
 */
function checkHandAbilitiesForEvent(
  state: VanguardGameState,
  playerId: string,
  context: AbilityContext,
): void {
  const player = state.players[playerId];

  for (const instanceId of player.hand) {
    const card = state.allCards[instanceId];
    const abilities = getAbilitiesForCard(card.cardId);

    for (const ability of abilities) {
      if (ability.triggerEvent !== context.event) continue;
      if (ability.location !== 'hand') continue;
      if (!checkConditions(state, playerId, instanceId, ability.conditions, context)) continue;

      resolveOrQueueAbility(state, playerId, instanceId, ability, context);
    }
  }
}

/**
 * Determine which players' units to scan for a given event.
 */
function getPlayersToCheck(
  state: VanguardGameState,
  event: AbilityTriggerEvent,
  playerId: string,
): string[] {
  // Most events only check the owning player's field
  switch (event) {
    case 'onDriveCheckReveal':
      // Only the turn player's units check for drive reveal abilities
      return [state.turnPlayerId];
    case 'onOpponentRGRetired':
      // The turn player's units check when opponent RG retired
      return [state.turnPlayerId];
    case 'onBoostedAttackHits':
      // The turn player's booster checks
      return [state.turnPlayerId];
    default:
      return [playerId];
  }
}

// ============================================
// FIELD UNIT ENUMERATION
// ============================================

interface FieldUnit {
  instanceId: string;
  position: FieldPosition;
}

function getFieldUnits(state: VanguardGameState, playerId: string): FieldUnit[] {
  const player = state.players[playerId];
  const units: FieldUnit[] = [];

  if (player.vanguardCircle) {
    units.push({ instanceId: player.vanguardCircle, position: 'vanguard' });
  }

  for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS]) {
    const unitId = player.rearGuards[pos];
    if (unitId) {
      units.push({ instanceId: unitId, position: pos });
    }
  }

  return units;
}

// ============================================
// LOCATION CHECK
// ============================================

function checkLocation(ability: AbilityDef, position: FieldPosition): boolean {
  switch (ability.location) {
    case 'VC':
      return position === 'vanguard';
    case 'RC':
      return position !== 'vanguard';
    case 'VCorRC':
      return true; // any field position
    case 'hand':
      return false; // hand abilities are checked separately
    default:
      return false;
  }
}

// ============================================
// CONDITION CHECKING
// ============================================

function checkConditions(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  conditions: AbilityCondition[],
  context: AbilityContext,
): boolean {
  for (const cond of conditions) {
    if (!checkSingleCondition(state, playerId, instanceId, cond, context)) {
      return false;
    }
  }
  return true;
}

function checkSingleCondition(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  condition: AbilityCondition,
  context: AbilityContext,
): boolean {
  const player = state.players[playerId];

  switch (condition.type) {
    case 'soulContainsName': {
      return player.soul.some(id => {
        const card = state.allCards[id];
        const def = getCardDefinition(card.cardId);
        return def.name === condition.name;
      });
    }

    case 'vanguardClan': {
      if (!player.vanguardCircle) return false;
      const vg = state.allCards[player.vanguardCircle];
      const vgDef = getCardDefinition(vg.cardId);
      return vgDef.clan === condition.clan;
    }

    case 'handSizeGreaterThanOpponent': {
      const opponentId = getOpponentId(state, playerId);
      const opponent = state.players[opponentId];
      return player.hand.length > opponent.hand.length;
    }

    case 'driveCheckGradeAndClan': {
      if (!context.revealedCardId) return false;
      const revealed = state.allCards[context.revealedCardId];
      const revealedDef = getCardDefinition(revealed.cardId);
      return revealedDef.grade === condition.grade && revealedDef.clan === condition.clan;
    }

    case 'noOtherClanUnits': {
      // "If you do not have another <clan> vanguard or rear-guard"
      // Means: no OTHER units of that clan on the field (the unit itself is excluded)
      const units = getFieldUnits(state, playerId);
      for (const u of units) {
        if (u.instanceId === instanceId) continue; // skip self
        const card = state.allCards[u.instanceId];
        const def = getCardDefinition(card.cardId);
        if (def.clan === condition.clan) return false;
      }
      return true;
    }

    case 'boostedUnitNamed': {
      if (!context.boostedUnitId) return false;
      const boosted = state.allCards[context.boostedUnitId];
      const boostedDef = getCardDefinition(boosted.cardId);
      return boostedDef.name === condition.name;
    }

    case 'vanguardGrade': {
      if (!player.vanguardCircle) return false;
      const vg = state.allCards[player.vanguardCircle];
      const vgDef = getCardDefinition(vg.cardId);
      return vgDef.grade === condition.grade;
    }

    default:
      return true;
  }
}

// ============================================
// RESOLVE OR QUEUE
// ============================================

function resolveOrQueueAbility(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  ability: AbilityDef,
  context: AbilityContext,
): void {
  const card = state.allCards[instanceId];

  // Check if we can auto-resolve (no cost, no targeting, not optional)
  if (canAutoResolve(ability)) {
    autoResolveAbility(state, playerId, instanceId, ability, context);
    return;
  }

  // Queue the ability for player interaction
  state.abilityQueue.push({
    abilityId: ability.abilityId,
    cardInstanceId: instanceId,
    cardId: card.cardId,
    playerId,
    context: { ...context },
  });
}

/**
 * Check if an ability can be auto-resolved without player input.
 * Must have no cost, no targeting effects, and be non-optional.
 */
function canAutoResolve(ability: AbilityDef): boolean {
  // If optional, player must confirm
  if (ability.optional) return false;

  // If has a cost, player must confirm
  if (ability.cost) return false;

  // Check if any effect requires targeting
  for (const effect of ability.effects) {
    if (effect.type === 'retireOpponentRG') return false;
    if (effect.type === 'chooseAllyPowerUp') return false;
    if (effect.type === 'searchDeckForName') return false;
    if (effect.type === 'superiorRideFromHand') return false;
  }

  return true;
}

// ============================================
// AUTO-RESOLVE (simple abilities)
// ============================================

function autoResolveAbility(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  ability: AbilityDef,
  context: AbilityContext,
): void {
  for (const effect of ability.effects) {
    applyEffect(state, playerId, instanceId, effect, context);
  }
  addLog(state, playerId, ability.description, 'ability');
}

// ============================================
// PROCESS ABILITY QUEUE
// ============================================
// Pops next ability from queue, sets abilityPending, changes phase.

export function processAbilityQueue(state: VanguardGameState): boolean {
  if (state.abilityQueue.length === 0) return false;

  const queued = state.abilityQueue.shift()!;
  const card = state.allCards[queued.cardInstanceId];
  const abilities = getAbilitiesForCard(card.cardId);
  const ability = abilities.find(a => a.abilityId === queued.abilityId);

  if (!ability) return false;

  // Determine the pending type based on the ability
  const pendingType = getPendingType(ability);

  // Calculate valid targets if needed
  let validTargets: string[] | undefined;
  let searchResults: string[] | undefined;

  if (pendingType === 'select-target') {
    validTargets = getValidTargets(state, queued.playerId, ability);
    if (validTargets.length === 0) {
      // No valid targets — skip this ability
      addLog(state, queued.playerId, `${ability.description} — no valid targets`, 'ability');
      return processAbilityQueue(state); // try next in queue
    }
  }

  if (pendingType === 'search-select') {
    searchResults = getSearchResults(state, queued.playerId, ability);
    // Search can find 0 results — player must still "confirm" with nothing
  }

  // Store the previous phase so we can return to it
  const previousPhase = state.phase;

  state.abilityPending = {
    abilityId: ability.abilityId,
    cardInstanceId: queued.cardInstanceId,
    cardId: queued.cardId,
    playerId: queued.playerId,
    type: pendingType,
    description: ability.description,
    optional: ability.optional,
    validTargets,
    searchResults,
    minSelections: pendingType === 'select-discard' ? getDiscardAmount(ability) : undefined,
    maxSelections: pendingType === 'select-discard' ? getDiscardAmount(ability) : undefined,
    costDescription: ability.cost ? formatCost(ability.cost) : undefined,
    previousPhase,
  };

  state.phase = 'ability-pending';
  return true;
}

function getPendingType(ability: AbilityDef): 'may-activate' | 'select-target' | 'select-discard' | 'search-select' {
  // If optional and has cost → may-activate first (player must accept/decline)
  if (ability.optional && ability.cost) return 'may-activate';

  // Check effects for targeting needs
  for (const effect of ability.effects) {
    if (effect.type === 'retireOpponentRG') return 'select-target';
    if (effect.type === 'chooseAllyPowerUp') return 'select-target';
    if (effect.type === 'searchDeckForName') return 'search-select';
    if (effect.type === 'superiorRideFromHand') return 'may-activate';
  }

  // ACT abilities with cost that need discard
  if (ability.cost) {
    const needsDiscard = costNeedsDiscard(ability.cost);
    if (needsDiscard) return 'select-discard';
  }

  // Optional ability with no cost (e.g., Bors)
  if (ability.optional) return 'may-activate';

  return 'may-activate';
}

function costNeedsDiscard(cost: AbilityCost): boolean {
  if (cost.type === 'discardFromHand') return true;
  if (cost.type === 'compound') {
    return cost.costs.some(c => costNeedsDiscard(c));
  }
  return false;
}

function getDiscardAmount(ability: AbilityDef): number {
  if (!ability.cost) return 0;
  return getDiscardAmountFromCost(ability.cost);
}

function getDiscardAmountFromCost(cost: AbilityCost): number {
  if (cost.type === 'discardFromHand') return cost.amount;
  if (cost.type === 'compound') {
    for (const c of cost.costs) {
      const amt = getDiscardAmountFromCost(c);
      if (amt > 0) return amt;
    }
  }
  return 0;
}

// ============================================
// RESOLVE PLAYER ABILITY CHOICE
// ============================================

export function resolvePlayerAbilityChoice(
  state: VanguardGameState,
  playerId: string,
  choice: {
    type: 'confirm' | 'decline' | 'selectTarget' | 'selectDiscard' | 'searchSelect';
    targetInstanceId?: string;
    cardInstanceIds?: string[];
  },
): boolean {
  const pending = state.abilityPending;
  if (!pending) return false;
  if (pending.playerId !== playerId) return false;

  const card = state.allCards[pending.cardInstanceId];
  const abilities = getAbilitiesForCard(card.cardId);
  const ability = abilities.find(a => a.abilityId === pending.abilityId);
  if (!ability) return false;

  switch (choice.type) {
    case 'decline': {
      addLog(state, playerId, `Declined: ${ability.description}`, 'ability');
      finishAbilityPending(state);
      return true;
    }

    case 'confirm': {
      // For may-activate: pay cost and resolve
      if (ability.cost && !canPayCost(state, playerId, ability.cost, pending.cardInstanceId)) {
        // Can't pay cost — auto-decline
        addLog(state, playerId, `Cannot pay cost for ${ability.description}`, 'ability');
        finishAbilityPending(state);
        return true;
      }

      // Check if the cost requires discard selection from the player
      const needsDiscardSelection = ability.cost && costNeedsDiscard(ability.cost);

      if (needsDiscardSelection) {
        // Pay non-discard parts of the cost now (e.g., putSelfToSoul, counterBlast)
        if (ability.cost) {
          payNonDiscardCosts(state, playerId, ability.cost, pending.cardInstanceId);
        }
        // Transition to discard selection
        const discardAmount = getDiscardAmount(ability);
        pending.type = 'select-discard';
        pending.minSelections = discardAmount;
        pending.maxSelections = discardAmount;
        pending.nonDiscardCostsPaid = true; // Mark so selectDiscard doesn't double-pay
        return true;
      }

      // Pay the full cost (no discard involved)
      if (ability.cost) {
        payCost(state, playerId, ability.cost, pending.cardInstanceId);
      }

      // Check if after confirming, we need target selection
      const needsTarget = ability.effects.some(e =>
        e.type === 'retireOpponentRG' || e.type === 'chooseAllyPowerUp'
      );
      const needsSearch = ability.effects.some(e => e.type === 'searchDeckForName');

      if (needsTarget) {
        // Transition to target selection
        const validTargets = getValidTargets(state, playerId, ability);
        if (validTargets.length === 0) {
          addLog(state, playerId, `${ability.description} — no valid targets`, 'ability');
          finishAbilityPending(state);
          return true;
        }
        pending.type = 'select-target';
        pending.validTargets = validTargets;
        return true;
      }

      if (needsSearch) {
        const searchResults = getSearchResults(state, playerId, ability);
        if (searchResults.length === 0) {
          addLog(state, playerId, `${ability.description} — card not found in deck`, 'ability');
          // Shuffle deck even if nothing found (per Vanguard rules)
          shuffleDeck(state, playerId);
          finishAbilityPending(state);
          return true;
        }
        pending.type = 'search-select';
        pending.searchResults = searchResults;
        return true;
      }

      // No targeting needed — just resolve effects
      for (const effect of ability.effects) {
        applyEffect(state, playerId, pending.cardInstanceId, effect, {
          event: ability.triggerEvent,
          playerId,
        });
      }
      addLog(state, playerId, ability.description, 'ability');
      finishAbilityPending(state);
      return true;
    }

    case 'selectTarget': {
      if (!choice.targetInstanceId) return false;

      // Validate target
      if (pending.validTargets && !pending.validTargets.includes(choice.targetInstanceId)) {
        return false;
      }

      // Apply the targeting effect
      for (const effect of ability.effects) {
        applyTargetedEffect(state, playerId, pending.cardInstanceId, effect, choice.targetInstanceId);
      }
      addLog(state, playerId, ability.description, 'ability');
      finishAbilityPending(state);
      return true;
    }

    case 'selectDiscard': {
      if (!choice.cardInstanceIds || choice.cardInstanceIds.length === 0) return false;

      const player = state.players[playerId];
      // Validate all cards are in hand
      for (const cid of choice.cardInstanceIds) {
        if (!player.hand.includes(cid)) return false;
      }

      // Pay cost (discard the selected cards)
      for (const cid of choice.cardInstanceIds) {
        discardFromHand(state, playerId, cid);
      }

      // Pay any non-discard parts of the cost ONLY if we came directly to select-discard
      // (not via may-activate → confirm → select-discard, where non-discard costs are already paid)
      if (ability.cost && !pending.nonDiscardCostsPaid) {
        payNonDiscardCosts(state, playerId, ability.cost, pending.cardInstanceId);
      }

      // Apply effects
      for (const effect of ability.effects) {
        applyEffect(state, playerId, pending.cardInstanceId, effect, {
          event: ability.triggerEvent,
          playerId,
        });
      }
      addLog(state, playerId, ability.description, 'ability');
      finishAbilityPending(state);
      return true;
    }

    case 'searchSelect': {
      if (!choice.targetInstanceId) {
        // Player chose not to add anything (or nothing found)
        shuffleDeck(state, playerId);
        addLog(state, playerId, `${ability.description} — chose not to take`, 'ability');
        finishAbilityPending(state);
        return true;
      }

      // Validate target is in search results
      if (pending.searchResults && !pending.searchResults.includes(choice.targetInstanceId)) {
        return false;
      }

      // Move the selected card from deck to hand
      const player = state.players[playerId];
      const idx = player.deck.indexOf(choice.targetInstanceId);
      if (idx !== -1) {
        player.deck.splice(idx, 1);
        const searchedCard = state.allCards[choice.targetInstanceId];
        searchedCard.zone = 'hand';
        searchedCard.isFaceUp = true;
        player.hand.push(choice.targetInstanceId);

        const def = getCardDefinition(searchedCard.cardId);
        addLog(state, playerId, `Added ${def.name} from deck to hand`, 'ability');
      }

      shuffleDeck(state, playerId);
      finishAbilityPending(state);
      return true;
    }

    default:
      return false;
  }
}

function finishAbilityPending(state: VanguardGameState): void {
  const previousPhase = state.abilityPending?.previousPhase;
  state.abilityPending = null;

  // Check if there are more abilities in the queue
  if (state.abilityQueue.length > 0) {
    processAbilityQueue(state);
    return;
  }

  // Return to previous phase
  if (previousPhase) {
    state.phase = previousPhase;
  }
}

// ============================================
// COST CHECKING AND PAYMENT
// ============================================

export function canPayCost(
  state: VanguardGameState,
  playerId: string,
  cost: AbilityCost,
  instanceId?: string,
): boolean {
  switch (cost.type) {
    case 'counterBlast': {
      const player = state.players[playerId];
      const faceUpDamage = player.damageZone.filter(id => state.allCards[id].isFaceUp).length;
      return faceUpDamage >= cost.amount;
    }

    case 'discardFromHand': {
      const player = state.players[playerId];
      return player.hand.length >= cost.amount;
    }

    case 'putSelfToSoul': {
      // The unit must be on RC
      if (!instanceId) return false;
      const card = state.allCards[instanceId];
      return card.zone !== 'vanguard-circle';
    }

    case 'compound': {
      return cost.costs.every(c => canPayCost(state, playerId, c, instanceId));
    }

    default:
      return true;
  }
}

export function payCost(
  state: VanguardGameState,
  playerId: string,
  cost: AbilityCost,
  instanceId?: string,
): void {
  switch (cost.type) {
    case 'counterBlast': {
      const player = state.players[playerId];
      let remaining = cost.amount;
      for (const dmgId of player.damageZone) {
        if (remaining <= 0) break;
        const card = state.allCards[dmgId];
        if (card.isFaceUp) {
          card.isFaceUp = false;
          remaining--;
        }
      }
      addLog(state, playerId, `Counter Blast (${cost.amount})`, 'ability');
      break;
    }

    case 'discardFromHand': {
      // Discard is handled separately (player selects which cards)
      // This is a no-op here — discard happens in selectDiscard flow
      break;
    }

    case 'putSelfToSoul': {
      if (!instanceId) break;
      putUnitToSoul(state, playerId, instanceId);
      break;
    }

    case 'compound': {
      for (const c of cost.costs) {
        payCost(state, playerId, c, instanceId);
      }
      break;
    }
  }
}

/**
 * Pay non-discard parts of a cost (used when discard is handled separately).
 */
function payNonDiscardCosts(
  state: VanguardGameState,
  playerId: string,
  cost: AbilityCost,
  instanceId?: string,
): void {
  switch (cost.type) {
    case 'counterBlast':
      payCost(state, playerId, cost, instanceId);
      break;
    case 'putSelfToSoul':
      payCost(state, playerId, cost, instanceId);
      break;
    case 'compound':
      for (const c of cost.costs) {
        if (c.type !== 'discardFromHand') {
          payCost(state, playerId, c, instanceId);
        }
      }
      break;
    default:
      break;
  }
}

// ============================================
// EFFECT APPLICATION
// ============================================

function applyEffect(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  effect: AbilityEffect,
  context: AbilityContext,
): void {
  switch (effect.type) {
    case 'selfPowerUp': {
      const card = state.allCards[instanceId];
      if (effect.scope === 'battle') {
        card.battlePowerModifier += effect.amount;
      } else {
        card.turnPowerModifier += effect.amount;
      }
      break;
    }

    case 'selfCriticalUp': {
      const card = state.allCards[instanceId];
      if (effect.scope === 'battle') {
        card.battleCriticalModifier += effect.amount;
      } else {
        card.turnCriticalModifier += effect.amount;
      }
      break;
    }

    case 'boostedUnitPowerUp': {
      // Find the unit being boosted (from the battle state)
      const boostedId = context.boostedUnitId || state.battle?.attackingUnit;
      if (!boostedId) break;
      const boosted = state.allCards[boostedId];
      if (effect.scope === 'battle') {
        boosted.battlePowerModifier += effect.amount;
      } else {
        boosted.turnPowerModifier += effect.amount;
      }
      break;
    }

    case 'draw': {
      const player = state.players[playerId];
      for (let i = 0; i < effect.amount; i++) {
        if (player.deck.length === 0) break;
        const cardId = player.deck.shift()!;
        const drawn = state.allCards[cardId];
        drawn.zone = 'hand';
        drawn.isFaceUp = true;
        player.hand.push(cardId);
      }
      break;
    }

    case 'standSelf': {
      const card = state.allCards[instanceId];
      card.isRested = false;
      if (effect.loseTwinDrive) {
        card.lostTwinDrive = true;
      }
      break;
    }

    case 'superiorRideFromHand': {
      // Yaksha: ride the card that has this ability from hand
      executeSuperiorRide(state, playerId, instanceId);
      break;
    }

    case 'continuousPowerUp': {
      // Handled by recalculateContinuousAbilities
      break;
    }

    case 'canAttackBackRow': {
      // Handled by validation logic
      break;
    }

    // These require targeting — handled via applyTargetedEffect
    case 'retireOpponentRG':
    case 'chooseAllyPowerUp':
    case 'searchDeckForName':
      break;
  }
}

function applyTargetedEffect(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  effect: AbilityEffect,
  targetInstanceId: string,
): void {
  switch (effect.type) {
    case 'retireOpponentRG': {
      const opponentId = getOpponentId(state, playerId);
      const targetCard = state.allCards[targetInstanceId];
      if (!targetCard.position || targetCard.position === 'vanguard') break;

      const targetDef = getCardDefinition(targetCard.cardId);
      retireUnitByInstanceId(state, opponentId, targetInstanceId);
      addLog(state, playerId, `Retired ${targetDef.name}!`, 'ability');
      break;
    }

    case 'chooseAllyPowerUp': {
      const target = state.allCards[targetInstanceId];
      if (effect.scope === 'battle') {
        target.battlePowerModifier += effect.amount;
      } else {
        target.turnPowerModifier += effect.amount;
      }
      const targetDef = getCardDefinition(target.cardId);
      addLog(state, playerId, `${targetDef.name} gets +${effect.amount} power!`, 'ability');
      break;
    }

    default:
      break;
  }
}

// ============================================
// VALID TARGETS
// ============================================

export function getValidTargets(
  state: VanguardGameState,
  playerId: string,
  ability: AbilityDef,
): string[] {
  const targets: string[] = [];

  for (const effect of ability.effects) {
    switch (effect.type) {
      case 'retireOpponentRG': {
        const opponentId = getOpponentId(state, playerId);
        const opponentUnits = getFieldUnits(state, opponentId);

        for (const u of opponentUnits) {
          if (u.position === 'vanguard') continue; // Can't retire VG
          const card = state.allCards[u.instanceId];
          const def = getCardDefinition(card.cardId);

          switch (effect.gradeCondition) {
            case 'gte2':
              if (def.grade >= 2) targets.push(u.instanceId);
              break;
            case 'lte1':
              if (def.grade <= 1) targets.push(u.instanceId);
              break;
            case 'lte2':
              if (def.grade <= 2) targets.push(u.instanceId);
              break;
            case 'any':
              targets.push(u.instanceId);
              break;
          }
        }
        break;
      }

      case 'chooseAllyPowerUp': {
        const myUnits = getFieldUnits(state, playerId);
        for (const u of myUnits) {
          // Check excludeSelf
          if (effect.excludeSelf && u.instanceId === ability.abilityId.split('-')[0]) continue;
          // Actually, we need to compare with the actual ability source instanceId
          // We can check by the pending state
          const pending = state.abilityPending;
          if (effect.excludeSelf && pending && u.instanceId === pending.cardInstanceId) continue;

          // Check clan restriction
          if (effect.clanRestriction) {
            const card = state.allCards[u.instanceId];
            const def = getCardDefinition(card.cardId);
            if (def.clan !== effect.clanRestriction) continue;
          }

          targets.push(u.instanceId);
        }
        break;
      }
    }
  }

  return targets;
}

function getSearchResults(
  state: VanguardGameState,
  playerId: string,
  ability: AbilityDef,
): string[] {
  const results: string[] = [];
  const player = state.players[playerId];

  for (const effect of ability.effects) {
    if (effect.type === 'searchDeckForName') {
      for (const instanceId of player.deck) {
        const card = state.allCards[instanceId];
        const def = getCardDefinition(card.cardId);
        if (def.name === effect.name) {
          results.push(instanceId);
        }
      }
    }
  }

  return results;
}

// ============================================
// CONTINUOUS ABILITY RECALCULATION
// ============================================

export function recalculateContinuousAbilities(state: VanguardGameState): void {
  // Reset all continuous modifiers
  for (const instanceId of Object.keys(state.allCards)) {
    state.allCards[instanceId].continuousPowerModifier = 0;
  }

  // Recalculate for all units on the field
  for (const playerId of state.playerIds) {
    const units = getFieldUnits(state, playerId);

    for (const { instanceId, position } of units) {
      const card = state.allCards[instanceId];
      const abilities = getAbilitiesForCard(card.cardId);

      for (const ability of abilities) {
        if (ability.timing !== 'CONT') continue;
        if (!checkLocation(ability, position)) continue;

        // Check conditions
        if (!checkConditions(state, playerId, instanceId, ability.conditions, {
          event: 'continuous',
          playerId,
        })) continue;

        // Apply continuous effects
        for (const effect of ability.effects) {
          if (effect.type === 'continuousPowerUp') {
            card.continuousPowerModifier += effect.amount;
          }
        }
      }
    }
  }
}

// ============================================
// CLEAR BATTLE MODIFIERS
// ============================================

export function clearBattleModifiers(state: VanguardGameState): void {
  for (const instanceId of Object.keys(state.allCards)) {
    const card = state.allCards[instanceId];
    card.battlePowerModifier = 0;
    card.battleCriticalModifier = 0;
  }
}

// ============================================
// ACT ABILITY ACTIVATION
// ============================================

/**
 * Check if a specific unit can activate an ACT ability.
 */
export function canActivateACT(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  abilityIndex: number,
): boolean {
  if (state.phase !== 'main-phase') return false;
  if (state.turnPlayerId !== playerId) return false;

  const card = state.allCards[instanceId];
  const abilities = getAbilitiesForCard(card.cardId);
  if (abilityIndex >= abilities.length) return false;

  const ability = abilities[abilityIndex];
  if (ability.timing !== 'ACT') return false;

  // Check location
  const position = getCardPosition(state, playerId, instanceId);
  if (!position) return false;
  if (!checkLocation(ability, position)) return false;

  // Check conditions
  if (!checkConditions(state, playerId, instanceId, ability.conditions, {
    event: 'mainPhaseACT',
    playerId,
  })) return false;

  // Check cost
  if (ability.cost && !canPayCost(state, playerId, ability.cost, instanceId)) return false;

  return true;
}

/**
 * Start activating an ACT ability. Queues it for resolution.
 */
export function activateACTAbility(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
  abilityIndex: number,
): boolean {
  if (!canActivateACT(state, playerId, instanceId, abilityIndex)) return false;

  const card = state.allCards[instanceId];
  const abilities = getAbilitiesForCard(card.cardId);
  const ability = abilities[abilityIndex];

  // Queue it
  state.abilityQueue.push({
    abilityId: ability.abilityId,
    cardInstanceId: instanceId,
    cardId: card.cardId,
    playerId,
    context: { event: 'mainPhaseACT', playerId },
  });

  // Process immediately
  processAbilityQueue(state);
  return true;
}

// ============================================
// HELPER: Get card's field position
// ============================================

function getCardPosition(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
): FieldPosition | null {
  const player = state.players[playerId];

  if (player.vanguardCircle === instanceId) return 'vanguard';

  for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS]) {
    if (player.rearGuards[pos] === instanceId) return pos;
  }

  return null;
}

// ============================================
// HELPER: Retire unit by instanceId
// ============================================

function retireUnitByInstanceId(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
): void {
  const player = state.players[playerId];
  const card = state.allCards[instanceId];

  // Find the position
  for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
    if (player.rearGuards[pos] === instanceId) {
      card.zone = 'drop-zone';
      card.position = undefined;
      card.isRested = false;
      card.turnPowerModifier = 0;
      card.turnCriticalModifier = 0;
      card.battlePowerModifier = 0;
      card.battleCriticalModifier = 0;
      player.rearGuards[pos] = null;
      player.dropZone.push(instanceId);

      // Hook: onOpponentRGRetired — so Yaksha/Joka/Rakshasa can respond
      // Only fire during main-phase-like contexts (per Vanguard rules)
      const turnPlayerId = state.turnPlayerId;
      const opponentOfRetiredUnit = getOpponentId(state, playerId);
      const isMainPhaseContext = state.phase === 'main-phase' || state.phase === 'ability-pending';

      if (isMainPhaseContext && opponentOfRetiredUnit === turnPlayerId) {
        checkAbilitiesForEvent(state, {
          event: 'onOpponentRGRetired',
          playerId: turnPlayerId,
        });
      }

      return;
    }
  }
}

// ============================================
// HELPER: Put unit to soul
// ============================================

function putUnitToSoul(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
): void {
  const player = state.players[playerId];
  const card = state.allCards[instanceId];

  // Find and remove from RC
  for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS] as RearGuardPosition[]) {
    if (player.rearGuards[pos] === instanceId) {
      player.rearGuards[pos] = null;
      break;
    }
  }

  card.zone = 'soul';
  card.position = undefined;
  card.isRested = false;
  card.turnPowerModifier = 0;
  card.turnCriticalModifier = 0;
  card.battlePowerModifier = 0;
  card.battleCriticalModifier = 0;
  player.soul.push(instanceId);

  const def = getCardDefinition(card.cardId);
  addLog(state, playerId, `Put ${def.name} into soul`, 'ability');
}

// ============================================
// HELPER: Discard from hand
// ============================================

function discardFromHand(
  state: VanguardGameState,
  playerId: string,
  instanceId: string,
): void {
  const player = state.players[playerId];
  const idx = player.hand.indexOf(instanceId);
  if (idx === -1) return;

  player.hand.splice(idx, 1);
  const card = state.allCards[instanceId];
  card.zone = 'drop-zone';
  player.dropZone.push(instanceId);

  const def = getCardDefinition(card.cardId);
  addLog(state, playerId, `Discarded ${def.name}`, 'ability');
}

// ============================================
// HELPER: Shuffle deck
// ============================================

function shuffleDeck(state: VanguardGameState, playerId: string): void {
  const player = state.players[playerId];
  // Fisher-Yates shuffle
  for (let i = player.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [player.deck[i], player.deck[j]] = [player.deck[j], player.deck[i]];
  }
}

// ============================================
// HELPER: Format cost for display
// ============================================

function formatCost(cost: AbilityCost): string {
  switch (cost.type) {
    case 'counterBlast':
      return `Counter Blast (${cost.amount})`;
    case 'discardFromHand':
      return `Discard ${cost.amount} from hand`;
    case 'putSelfToSoul':
      return 'Put this unit into soul';
    case 'compound':
      return cost.costs.map(c => formatCost(c)).join(' & ');
    default:
      return '';
  }
}

// ============================================
// SUPERIOR RIDE FROM HAND (Yaksha)
// ============================================

export function executeSuperiorRide(
  state: VanguardGameState,
  playerId: string,
  cardInstanceId: string,
): void {
  const player = state.players[playerId];
  const card = state.allCards[cardInstanceId];
  const cardDef = getCardDefinition(card.cardId);

  // Remove from hand
  const idx = player.hand.indexOf(cardInstanceId);
  if (idx === -1) return;
  player.hand.splice(idx, 1);

  // Move current VG to soul
  if (player.vanguardCircle) {
    const oldVg = state.allCards[player.vanguardCircle];
    oldVg.zone = 'soul';
    oldVg.position = undefined;
    oldVg.isRested = false;
    oldVg.turnPowerModifier = 0;
    oldVg.turnCriticalModifier = 0;
    player.soul.push(player.vanguardCircle);
  }

  // Place new card on VC
  card.zone = 'vanguard-circle';
  card.position = 'vanguard';
  card.isFaceUp = true;
  card.isRested = false;
  player.vanguardCircle = cardInstanceId;

  addLog(state, playerId, `Superior Ride! ${cardDef.name}!`, 'ability');

  // Recalculate continuous abilities after ride
  recalculateContinuousAbilities(state);
}

// ============================================
// TEJAS BACK-ROW TARGETING
// ============================================

/**
 * Check if a unit can attack the back row (Tejas ability).
 */
export function canAttackBackRow(
  state: VanguardGameState,
  playerId: string,
  attackerPosition: FieldPosition,
): boolean {
  const instanceId = getUnitAt(state, playerId, attackerPosition);
  if (!instanceId) return false;

  const card = state.allCards[instanceId];
  const abilities = getAbilitiesForCard(card.cardId);

  return abilities.some(a =>
    a.effects.some(e => e.type === 'canAttackBackRow')
  );
}

/**
 * Get the back-row position in the same column as the attacker.
 */
export function getBackRowTargetForTejas(
  attackerPosition: FieldPosition,
): RearGuardPosition | null {
  switch (attackerPosition) {
    case 'front-left': return 'back-left';
    case 'vanguard': return 'back-center';
    case 'front-right': return 'back-right';
    default: return null;
  }
}
