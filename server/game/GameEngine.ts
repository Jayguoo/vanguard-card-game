import {
  VanguardGameState,
  GameAction,
  ActionResult,
  PublicVanguardGameState,
  DeckId,
  GamePhase,
  RearGuardPosition,
  FieldPosition,
  RPSChoice,
  BOOST_COLUMN_REVERSE,
  FRONT_ROW_POSITIONS,
  BACK_ROW_POSITIONS,
} from '../../shared/types';
import { getCardDefinition } from '../../shared/cardDatabase';
import { buildDeck, createInitialPlayerState, reshuffleDeck } from './deckBuilder';
import {
  canRide, canCall, canAttack, canBoost, canGuard, canIntercept,
  canMoveRearGuard, getCard, getUnitAt, getOpponentId, getVanguardGrade,
  hasValidBoostOption, getValidAttackers,
} from './validation';
import {
  declareAttack, declareBoost, declineBoost, addGuardian, performIntercept,
  finishGuarding, executeDriveCheck, resolveNonTriggerDrive, afterDriveTriggerAssign,
  resolveDamage, executeDamageCheck, resolveNonTriggerDamage, afterDamageTriggerAssign,
  closeBattle, retireUnit,
} from './combat';
import { assignTriggerEffects, recalculateBattlePowers } from './triggers';
import { getStateForPlayer } from './stateProjection';
import {
  checkAbilitiesForEvent,
  processAbilityQueue,
  resolvePlayerAbilityChoice,
  recalculateContinuousAbilities,
  clearBattleModifiers,
  activateACTAbility,
  canActivateACT,
  canAttackBackRow,
  getBackRowTargetForTejas,
  executeSuperiorRide,
  AbilityContext,
} from './abilities';

export class GameEngine {
  private state: VanguardGameState;

  constructor(
    player1Id: string,
    player1Name: string,
    player1DeckId: DeckId,
    player2Id: string,
    player2Name: string,
    player2DeckId: DeckId,
  ) {
    // Build decks
    const deck1 = buildDeck(player1DeckId, player1Id);
    const deck2 = buildDeck(player2DeckId, player2Id);

    // First player will be determined by RPS — use player1 as temporary placeholder
    const firstPlayerId = player1Id;

    // Create all card instances registry
    const allCards: Record<string, any> = {};
    for (const card of [...deck1.allCards, ...deck2.allCards]) {
      allCards[card.instanceId] = card;
    }

    // Create player states
    const player1State = createInitialPlayerState(player1Id, player1Name, player1DeckId, deck1);
    const player2State = createInitialPlayerState(player2Id, player2Name, player2DeckId, deck2);

    this.state = {
      phase: 'setup-rps',
      turnPlayerId: firstPlayerId,
      turnNumber: 1,
      firstPlayerId,
      playerIds: [player1Id, player2Id],
      players: {
        [player1Id]: player1State,
        [player2Id]: player2State,
      },
      allCards,
      battle: null,
      rps: {
        choices: { [player1Id]: null, [player2Id]: null },
        result: null,
        winnerId: null,
        round: 1,
      },
      winner: null,
      actionLog: [],
      abilityPending: null,
      abilityQueue: [],
    };

    this.addLog('system', 'Rock, Paper, Scissors to decide who goes first!', 'system');
  }

  /**
   * Handle a game action from a player.
   */
  handleAction(playerId: string, action: GameAction): ActionResult {
    try {
      // Verify player is in this game
      if (!this.state.players[playerId]) {
        return { success: false, error: 'Player not in this game' };
      }

      // Check game isn't over
      if (this.state.phase === 'game-over') {
        return { success: false, error: 'Game is over' };
      }

      const result = this.processAction(playerId, action);

      // Auto-advance through automatic phases
      if (result.success) {
        this.autoAdvance();
      }

      return result;
    } catch (err: any) {
      console.error('GameEngine error:', err);
      return { success: false, error: err.message || 'Internal error' };
    }
  }

  /**
   * Get the game state from a specific player's perspective.
   */
  getStateForPlayer(playerId: string): PublicVanguardGameState {
    return getStateForPlayer(this.state, playerId);
  }

  /**
   * Get both player IDs.
   */
  getPlayerIds(): string[] {
    return this.state.playerIds;
  }

  /**
   * Check if game is over.
   */
  isGameOver(): boolean {
    return this.state.phase === 'game-over';
  }

  /**
   * Get current phase.
   */
  getPhase(): GamePhase {
    return this.state.phase;
  }

  /**
   * Check if there's a non-trigger card in triggerZone awaiting reveal resolution.
   * This happens when a drive/damage check reveals a non-trigger card.
   */
  hasPendingReveal(): boolean {
    const phase = this.state.phase;
    if (phase !== 'battle-drive-check' && phase !== 'battle-damage-check') return false;
    // Check if any player has a card in triggerZone
    for (const pid of this.state.playerIds) {
      if (this.state.players[pid].triggerZone) return true;
    }
    return false;
  }

  /**
   * Resolve a non-trigger reveal (after the client has had time to display it).
   * Moves the card from triggerZone to its destination and continues the battle.
   */
  resolveNonTriggerReveal(): void {
    const phase = this.state.phase;
    if (phase === 'battle-drive-check') {
      resolveNonTriggerDrive(this.state);
    } else if (phase === 'battle-damage-check') {
      resolveNonTriggerDamage(this.state);
    }
    this.autoAdvance();
  }


  // =============================================
  // PRIVATE METHODS
  // =============================================

  private processAction(playerId: string, action: GameAction): ActionResult {
    switch (action.type) {
      case 'setup:rpsChoice':
        return this.handleRPSChoice(playerId, action.choice);

      case 'setup:confirmStartingVanguard':
        return this.handleConfirmStartingVG(playerId);

      case 'setup:submitMulligan':
        return this.handleSubmitMulligan(playerId, action.cardIds);

      case 'phase:endPhase':
        return this.handleEndPhase(playerId);

      case 'ride':
        return this.handleRide(playerId, action.cardInstanceId);

      case 'call':
        return this.handleCall(playerId, action.cardInstanceId, action.position);

      case 'moveRearGuard':
        return this.handleMoveRearGuard(playerId, action.from, action.to);

      case 'swapRearGuards':
        return this.handleSwapRearGuards(playerId, action.posA, action.posB);

      case 'retireRearGuard':
        return this.handleRetireRearGuard(playerId, action.position);

      case 'attack:declare':
        return this.handleDeclareAttack(playerId, action.attackerPosition, action.targetPosition);

      case 'boost:declare':
        return this.handleDeclareBoost(playerId, action.boosterPosition);

      case 'boost:decline':
        return this.handleDeclineBoost(playerId);

      case 'guard:addGuardian':
        return this.handleAddGuardian(playerId, action.cardInstanceId);

      case 'guard:intercept':
        return this.handleIntercept(playerId, action.position);

      case 'guard:done':
      case 'guard:noGuard':
        return this.handleFinishGuard(playerId);

      case 'trigger:assignPower':
        return this.handleTriggerAssign(playerId, action.targetInstanceId, action.effectTargetInstanceId);

      case 'trigger:chooseHealDamage':
        return this.handleChooseHealDamage(playerId, action.damageInstanceId);

      case 'endBattle':
        return this.handleEndBattle(playerId);

      case 'endTurn':
        return this.handleEndTurn(playerId);

      // Ability actions
      case 'ability:activate':
        return this.handleAbilityActivate(playerId, action.instanceId, action.abilityIndex);

      case 'ability:selectTarget':
        return this.handleAbilitySelectTarget(playerId, action.targetInstanceId);

      case 'ability:selectDiscard':
        return this.handleAbilitySelectDiscard(playerId, action.cardInstanceIds);

      case 'ability:searchSelect':
        return this.handleAbilitySearchSelect(playerId, action.cardInstanceId);

      case 'ability:confirm':
        return this.handleAbilityConfirm(playerId);

      case 'ability:decline':
        return this.handleAbilityDecline(playerId);

      default:
        return { success: false, error: 'Unknown action type' };
    }
  }

  // ---------- SETUP HANDLERS ----------

  // ---------- RPS HANDLERS ----------

  private handleRPSChoice(playerId: string, choice: RPSChoice): ActionResult {
    if (this.state.phase !== 'setup-rps') {
      return { success: false, error: 'Not in RPS phase' };
    }

    const rps = this.state.rps!;
    if (rps.choices[playerId] !== null) {
      return { success: false, error: 'Already made a choice' };
    }

    rps.choices[playerId] = choice;

    const playerName = this.state.players[playerId].name;
    this.addLog(playerId, `${playerName} has chosen!`, 'action');

    // Check if both players have chosen
    const allChosen = this.state.playerIds.every(
      (pid: string) => rps.choices[pid] !== null
    );

    if (allChosen) {
      this.resolveRPS();
    }

    return { success: true };
  }

  private resolveRPS(): void {
    const rps = this.state.rps!;
    const [p1Id, p2Id] = this.state.playerIds;
    const c1 = rps.choices[p1Id]!;
    const c2 = rps.choices[p2Id]!;

    if (c1 === c2) {
      rps.result = 'draw';
      rps.winnerId = null;
      this.state.phase = 'setup-rps-result';
      this.addLog('system', `Draw! Both chose ${c1}. Play again!`, 'system');
      return;
    }

    const p1Wins =
      (c1 === 'rock' && c2 === 'scissors') ||
      (c1 === 'paper' && c2 === 'rock') ||
      (c1 === 'scissors' && c2 === 'paper');

    const winnerId = p1Wins ? p1Id : p2Id;
    rps.result = 'win';
    rps.winnerId = winnerId;

    // Set the first player based on RPS winner
    this.state.firstPlayerId = winnerId;
    this.state.turnPlayerId = winnerId;

    for (const pid of this.state.playerIds) {
      this.state.players[pid].isFirstTurn = pid === winnerId;
    }

    const winnerName = this.state.players[winnerId].name;
    this.addLog('system', `${winnerName} wins and goes first!`, 'system');

    this.state.phase = 'setup-rps-result';
  }

  public advanceFromRPSResult(): void {
    if (this.state.phase !== 'setup-rps-result') return;
    const rps = this.state.rps!;

    if (rps.result === 'draw') {
      // Reset for next round
      rps.choices[this.state.playerIds[0]] = null;
      rps.choices[this.state.playerIds[1]] = null;
      rps.result = null;
      rps.round++;
      this.state.phase = 'setup-rps';
      this.addLog('system', `Round ${rps.round} — choose again!`, 'system');
    } else {
      // Winner determined — move to normal setup
      this.state.rps = null;
      this.state.phase = 'setup-choose-vanguard';
      this.addLog('system', 'Game starting! Place your starting Vanguard.', 'system');
      this.autoAdvance();
    }
  }

  // ---------- SETUP HANDLERS ----------

  private handleConfirmStartingVG(playerId: string): ActionResult {
    if (this.state.phase !== 'setup-choose-vanguard') {
      return { success: false, error: 'Not in setup phase' };
    }

    // For trial decks, the starter VG is already placed.
    // Just mark this player as ready.
    const player = this.state.players[playerId];
    if (!player.vanguardCircle) {
      return { success: false, error: 'No starting vanguard' };
    }

    // Auto-advance since trial decks have fixed starters
    return { success: true };
  }

  private handleSubmitMulligan(playerId: string, cardIds: string[]): ActionResult {
    if (this.state.phase !== 'setup-mulligan') {
      return { success: false, error: 'Not in exchange phase' };
    }

    const player = this.state.players[playerId];
    if (player.mulliganComplete) {
      return { success: false, error: 'Already completed exchange' };
    }

    // Validate all cards are in hand
    for (const id of cardIds) {
      if (!player.hand.includes(id)) {
        return { success: false, error: 'Card not in hand' };
      }
    }

    if (cardIds.length > 0) {
      // Return selected cards to deck
      for (const id of cardIds) {
        const idx = player.hand.indexOf(id);
        player.hand.splice(idx, 1);
        const card = this.state.allCards[id];
        card.zone = 'deck';
        player.deck.push(id);
      }

      // Shuffle deck
      player.deck = reshuffleDeck(player.deck);

      // Draw same number of cards
      for (let i = 0; i < cardIds.length; i++) {
        this.drawCard(playerId);
      }
    }

    player.mulliganComplete = true;

    const playerName = player.name;
    this.addLog(playerId, cardIds.length > 0 ? `${playerName} exchanged ${cardIds.length} cards` : `${playerName} kept their hand`, 'action');

    return { success: true };
  }

  // ---------- PHASE HANDLERS ----------

  private handleEndPhase(playerId: string): ActionResult {
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }

    const phase = this.state.phase;

    switch (phase) {
      case 'ride-phase':
        this.state.phase = 'main-phase';
        this.addLog(playerId, 'Main Phase', 'phase');
        return { success: true };

      case 'main-phase': {
        const player = this.state.players[playerId];
        if (player.isFirstTurn) {
          // First player can't attack on first turn
          this.state.phase = 'end-phase';
          this.processEndPhase();
          return { success: true };
        }
        this.state.phase = 'battle-phase';
        this.addLog(playerId, 'Battle Phase', 'phase');
        return { success: true };
      }

      default:
        return { success: false, error: `Cannot end phase during ${phase}` };
    }
  }

  // ---------- RIDE ----------

  private handleRide(playerId: string, cardInstanceId: string): ActionResult {
    if (this.state.phase !== 'ride-phase') {
      return { success: false, error: 'Not in ride phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }
    if (!canRide(this.state, playerId, cardInstanceId)) {
      return { success: false, error: 'Cannot ride this card' };
    }

    const player = this.state.players[playerId];
    const card = getCard(this.state, cardInstanceId);
    const cardDef = getCardDefinition(card.cardId);

    // Remove from hand
    const idx = player.hand.indexOf(cardInstanceId);
    player.hand.splice(idx, 1);

    // Move current VG to soul — save reference for onRiddenOver hook
    const oldVgInstanceId = player.vanguardCircle;
    if (player.vanguardCircle) {
      const oldVg = getCard(this.state, player.vanguardCircle);
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
    player.hasRiddenThisTurn = true;

    this.addLog(playerId, `Rode ${cardDef.name}!`, 'action');

    // Recalculate continuous abilities (e.g., Gancelot +5000 if BB in soul)
    recalculateContinuousAbilities(this.state);

    // Hook: onRiddenOver — the old VG was just ridden over (now in soul)
    // e.g., Battleraizer FVG: can call itself to RC when ridden over by Nova Grappler
    if (oldVgInstanceId) {
      checkAbilitiesForEvent(this.state, {
        event: 'onRiddenOver',
        playerId,
        cardInstanceId: oldVgInstanceId,
        ridingClan: cardDef.clan,
      });
    }

    // Check for onPlaceVC abilities (e.g., Gancelot search)
    checkAbilitiesForEvent(this.state, {
      event: 'onPlaceVC',
      playerId,
      placedCardId: cardInstanceId,
      cardInstanceId,
    });

    // Also check onPlaceVCorRC
    checkAbilitiesForEvent(this.state, {
      event: 'onPlaceVCorRC',
      playerId,
      placedCardId: cardInstanceId,
      cardInstanceId,
    });

    // If abilities were queued, process them before moving to main phase
    if (this.state.abilityQueue.length > 0) {
      processAbilityQueue(this.state);
      // Phase may now be 'ability-pending' — main phase resumes after resolution
      const currentPhase = this.state.phase as GamePhase;
      if (currentPhase === 'ability-pending' && this.state.abilityPending) {
        this.state.abilityPending.previousPhase = 'main-phase';
      }
    } else {
      // Auto-advance to main phase after riding
      this.state.phase = 'main-phase';
      this.addLog(playerId, 'Main Phase', 'phase');
    }

    return { success: true };
  }

  // ---------- CALL ----------

  private handleCall(playerId: string, cardInstanceId: string, position: RearGuardPosition): ActionResult {
    if (this.state.phase !== 'main-phase') {
      return { success: false, error: 'Not in main phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }
    if (!canCall(this.state, playerId, cardInstanceId, position)) {
      return { success: false, error: 'Cannot call this card here' };
    }

    const player = this.state.players[playerId];
    const card = getCard(this.state, cardInstanceId);
    const cardDef = getCardDefinition(card.cardId);

    // If a unit already exists at the position, retire it
    if (player.rearGuards[position]) {
      retireUnit(this.state, playerId, position);
    }

    // Remove from hand
    const idx = player.hand.indexOf(cardInstanceId);
    player.hand.splice(idx, 1);

    // Place on RC
    card.zone = `${position.replace('front-', 'front-').replace('back-', 'back-')}-rc` as any;
    card.position = position;
    card.isFaceUp = true;
    card.isRested = false;
    player.rearGuards[position] = cardInstanceId;

    this.addLog(playerId, `Called ${cardDef.name} to ${formatPosition(position)}`, 'action');

    // Recalculate continuous abilities
    recalculateContinuousAbilities(this.state);

    // Check for onPlaceRC abilities (e.g., Starlight Unicorn)
    checkAbilitiesForEvent(this.state, {
      event: 'onPlaceRC',
      playerId,
      placedCardId: cardInstanceId,
      cardInstanceId,
    });

    // Also check onPlaceVCorRC (e.g., Blaster Blade, Berserk Dragon)
    checkAbilitiesForEvent(this.state, {
      event: 'onPlaceVCorRC',
      playerId,
      placedCardId: cardInstanceId,
      cardInstanceId,
    });

    // If abilities were queued, process them
    if (this.state.abilityQueue.length > 0) {
      processAbilityQueue(this.state);
    }

    return { success: true };
  }

  // ---------- MOVE REAR GUARD ----------

  private handleMoveRearGuard(playerId: string, from: RearGuardPosition, to: RearGuardPosition): ActionResult {
    if (this.state.phase !== 'main-phase') {
      return { success: false, error: 'Not in main phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }
    if (!canMoveRearGuard(this.state, playerId, from, to)) {
      return { success: false, error: 'Cannot move unit here' };
    }

    const player = this.state.players[playerId];
    const unitId = player.rearGuards[from]!;
    const card = getCard(this.state, unitId);

    player.rearGuards[from] = null;
    player.rearGuards[to] = unitId;
    card.position = to;

    const cardDef = getCardDefinition(card.cardId);
    this.addLog(playerId, `Moved ${cardDef.name} to ${formatPosition(to)}`, 'action');

    return { success: true };
  }

  // ---------- SWAP REAR GUARDS ----------

  private handleSwapRearGuards(playerId: string, posA: RearGuardPosition, posB: RearGuardPosition): ActionResult {
    if (this.state.phase !== 'main-phase') {
      return { success: false, error: 'Not in main phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }

    const player = this.state.players[playerId];
    const unitA = player.rearGuards[posA];
    const unitB = player.rearGuards[posB];

    if (!unitA || !unitB) {
      return { success: false, error: 'Both positions must have units' };
    }

    // Swap the two units
    player.rearGuards[posA] = unitB;
    player.rearGuards[posB] = unitA;

    const cardA = getCard(this.state, unitA);
    const cardB = getCard(this.state, unitB);
    cardA.position = posB;
    cardB.position = posA;

    const defA = getCardDefinition(cardA.cardId);
    const defB = getCardDefinition(cardB.cardId);
    this.addLog(playerId, `Swapped ${defA.name} and ${defB.name}`, 'action');

    return { success: true };
  }

  // ---------- RETIRE ----------

  private handleRetireRearGuard(playerId: string, position: RearGuardPosition): ActionResult {
    if (this.state.phase !== 'main-phase') {
      return { success: false, error: 'Not in main phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }

    const player = this.state.players[playerId];
    if (!player.rearGuards[position]) {
      return { success: false, error: 'No unit at that position' };
    }

    const card = getCard(this.state, player.rearGuards[position]!);
    const cardDef = getCardDefinition(card.cardId);

    retireUnit(this.state, playerId, position);
    this.addLog(playerId, `Retired ${cardDef.name}`, 'action');

    return { success: true };
  }

  // ---------- ATTACK ----------

  private handleDeclareAttack(
    playerId: string,
    attackerPosition: FieldPosition,
    targetPosition: FieldPosition,
  ): ActionResult {
    if (this.state.phase !== 'battle-phase') {
      return { success: false, error: 'Not in battle phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }
    if (!canAttack(this.state, playerId, attackerPosition, targetPosition)) {
      return { success: false, error: 'Invalid attack' };
    }

    declareAttack(this.state, playerId, attackerPosition, targetPosition);
    // Phase is now 'battle-boost-step'

    // Auto-skip boost if no valid boost option
    if (!hasValidBoostOption(this.state, playerId)) {
      declineBoost(this.state);
      // Phase is now 'battle-guard-step'
    }

    return { success: true };
  }

  // ---------- BOOST ----------

  private handleDeclareBoost(playerId: string, boosterPosition: RearGuardPosition): ActionResult {
    if (this.state.phase !== 'battle-boost-step') {
      return { success: false, error: 'Not in boost step' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }
    if (!canBoost(this.state, playerId, boosterPosition)) {
      return { success: false, error: 'Cannot boost with this unit' };
    }

    declareBoost(this.state, playerId, boosterPosition);
    return { success: true };
  }

  private handleDeclineBoost(playerId: string): ActionResult {
    if (this.state.phase !== 'battle-boost-step') {
      return { success: false, error: 'Not in boost step' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }

    declineBoost(this.state);
    return { success: true };
  }

  // ---------- GUARD ----------

  private handleAddGuardian(playerId: string, cardInstanceId: string): ActionResult {
    if (this.state.phase !== 'battle-guard-step') {
      return { success: false, error: 'Not in guard step' };
    }

    // Guarding player is the defender (opponent of turn player)
    const defenderId = getOpponentId(this.state, this.state.turnPlayerId);
    if (playerId !== defenderId) {
      return { success: false, error: 'Only the defender can guard' };
    }

    if (!canGuard(this.state, playerId, cardInstanceId)) {
      return { success: false, error: 'Cannot guard with this card' };
    }

    addGuardian(this.state, playerId, cardInstanceId);
    return { success: true };
  }

  private handleIntercept(playerId: string, position: RearGuardPosition): ActionResult {
    if (this.state.phase !== 'battle-guard-step') {
      return { success: false, error: 'Not in guard step' };
    }

    const defenderId = getOpponentId(this.state, this.state.turnPlayerId);
    if (playerId !== defenderId) {
      return { success: false, error: 'Only the defender can intercept' };
    }

    if (!canIntercept(this.state, playerId, position)) {
      return { success: false, error: 'Cannot intercept with this unit' };
    }

    performIntercept(this.state, playerId, position);
    return { success: true };
  }

  private handleFinishGuard(playerId: string): ActionResult {
    if (this.state.phase !== 'battle-guard-step') {
      return { success: false, error: 'Not in guard step' };
    }

    const defenderId = getOpponentId(this.state, this.state.turnPlayerId);
    if (playerId !== defenderId) {
      return { success: false, error: 'Only the defender can finish guarding' };
    }

    finishGuarding(this.state);
    // Phase is now either 'battle-drive-check' or 'battle-damage-step'
    // handleAction will call autoAdvance() after this returns

    return { success: true };
  }

  // ---------- TRIGGER ASSIGN ----------

  private handleTriggerAssign(playerId: string, targetInstanceId: string, effectTargetInstanceId?: string): ActionResult {
    const phase = this.state.phase;
    if (phase !== 'battle-drive-trigger-assign' && phase !== 'battle-damage-trigger-assign') {
      return { success: false, error: 'Not in trigger assignment phase' };
    }

    // Determine who should be assigning
    let expectedPlayerId: string;
    if (phase === 'battle-drive-trigger-assign') {
      expectedPlayerId = this.state.turnPlayerId; // attacker assigns during drive
    } else {
      expectedPlayerId = getOpponentId(this.state, this.state.turnPlayerId); // defender assigns during damage
    }

    if (playerId !== expectedPlayerId) {
      return { success: false, error: 'Not your trigger to assign' };
    }

    // Must choose heal damage first if pending
    if (this.state.battle?.healDamageChoicePending) {
      return { success: false, error: 'Choose a damage card to heal first' };
    }

    // Validate power target is one of the player's units on the field
    const targetCard = this.state.allCards[targetInstanceId];
    if (!targetCard || targetCard.ownerId !== playerId) {
      return { success: false, error: 'Invalid target' };
    }
    if (targetCard.zone !== 'vanguard-circle' &&
        !targetCard.zone.endsWith('-rc')) {
      return { success: false, error: 'Target must be a unit on the field' };
    }

    // Validate effect target if provided
    if (effectTargetInstanceId) {
      const effectCard = this.state.allCards[effectTargetInstanceId];
      if (!effectCard || effectCard.ownerId !== playerId) {
        return { success: false, error: 'Invalid effect target' };
      }
      if (effectCard.zone !== 'vanguard-circle' &&
          !effectCard.zone.endsWith('-rc')) {
        return { success: false, error: 'Effect target must be a unit on the field' };
      }
    }

    assignTriggerEffects(this.state, playerId, targetInstanceId, effectTargetInstanceId);

    // Continue the battle flow
    if (phase === 'battle-drive-trigger-assign') {
      afterDriveTriggerAssign(this.state);
    } else {
      afterDamageTriggerAssign(this.state);
    }

    // handleAction will call autoAdvance() after this returns

    return { success: true };
  }

  // ---------- HEAL DAMAGE CHOICE ----------

  private handleChooseHealDamage(playerId: string, damageInstanceId: string): ActionResult {
    const phase = this.state.phase;
    if (phase !== 'battle-drive-trigger-assign' && phase !== 'battle-damage-trigger-assign') {
      return { success: false, error: 'Not in trigger assignment phase' };
    }

    const battle = this.state.battle;
    if (!battle || !battle.healDamageChoicePending) {
      return { success: false, error: 'No heal damage choice pending' };
    }

    // Determine who should be choosing
    let expectedPlayerId: string;
    if (phase === 'battle-drive-trigger-assign') {
      expectedPlayerId = this.state.turnPlayerId;
    } else {
      expectedPlayerId = getOpponentId(this.state, this.state.turnPlayerId);
    }

    if (playerId !== expectedPlayerId) {
      return { success: false, error: 'Not your trigger to assign' };
    }

    // Validate the chosen card is in the player's damage zone
    const player = this.state.players[playerId];
    const idx = player.damageZone.indexOf(damageInstanceId);
    if (idx === -1) {
      return { success: false, error: 'Card not in damage zone' };
    }

    // Move the chosen damage card to the drop zone
    player.damageZone.splice(idx, 1);
    const healedCard = this.state.allCards[damageInstanceId];
    healedCard.zone = 'drop-zone';
    player.dropZone.push(damageInstanceId);

    const healedDef = getCardDefinition(healedCard.cardId);
    this.addLog(playerId, `Healed ${healedDef.name} from damage zone`, 'trigger');

    // Clear the pending flag
    battle.healDamageChoicePending = false;

    // Player still needs to assign +5000 power — stay in same phase
    return { success: true };
  }

  // ---------- ABILITY HANDLERS ----------

  private handleAbilityActivate(playerId: string, instanceId: string, abilityIndex: number): ActionResult {
    if (this.state.phase !== 'main-phase') {
      return { success: false, error: 'Can only activate abilities during main phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }

    const result = activateACTAbility(this.state, playerId, instanceId, abilityIndex);
    if (!result) {
      return { success: false, error: 'Cannot activate this ability' };
    }
    return { success: true };
  }

  private handleAbilitySelectTarget(playerId: string, targetInstanceId: string): ActionResult {
    if (this.state.phase !== 'ability-pending') {
      return { success: false, error: 'No ability pending' };
    }

    const result = resolvePlayerAbilityChoice(this.state, playerId, {
      type: 'selectTarget',
      targetInstanceId,
    });
    return result ? { success: true } : { success: false, error: 'Invalid target' };
  }

  private handleAbilitySelectDiscard(playerId: string, cardInstanceIds: string[]): ActionResult {
    if (this.state.phase !== 'ability-pending') {
      return { success: false, error: 'No ability pending' };
    }

    const result = resolvePlayerAbilityChoice(this.state, playerId, {
      type: 'selectDiscard',
      cardInstanceIds,
    });
    return result ? { success: true } : { success: false, error: 'Invalid discard selection' };
  }

  private handleAbilitySearchSelect(playerId: string, cardInstanceId: string): ActionResult {
    if (this.state.phase !== 'ability-pending') {
      return { success: false, error: 'No ability pending' };
    }

    const result = resolvePlayerAbilityChoice(this.state, playerId, {
      type: 'searchSelect',
      targetInstanceId: cardInstanceId,
    });
    return result ? { success: true } : { success: false, error: 'Invalid selection' };
  }

  private handleAbilityConfirm(playerId: string): ActionResult {
    if (this.state.phase !== 'ability-pending') {
      return { success: false, error: 'No ability pending' };
    }

    const result = resolvePlayerAbilityChoice(this.state, playerId, {
      type: 'confirm',
    });
    return result ? { success: true } : { success: false, error: 'Cannot confirm' };
  }

  private handleAbilityDecline(playerId: string): ActionResult {
    if (this.state.phase !== 'ability-pending') {
      return { success: false, error: 'No ability pending' };
    }

    const result = resolvePlayerAbilityChoice(this.state, playerId, {
      type: 'decline',
    });
    return result ? { success: true } : { success: false, error: 'Cannot decline' };
  }

  // ---------- END BATTLE / END TURN ----------

  private handleEndBattle(playerId: string): ActionResult {
    if (this.state.phase !== 'battle-phase') {
      return { success: false, error: 'Not in battle phase' };
    }
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }

    this.state.phase = 'end-phase';
    this.processEndPhase();
    return { success: true };
  }

  private handleEndTurn(playerId: string): ActionResult {
    if (playerId !== this.state.turnPlayerId) {
      return { success: false, error: 'Not your turn' };
    }

    // Can end turn from main phase or battle phase
    if (this.state.phase !== 'main-phase' && this.state.phase !== 'battle-phase') {
      return { success: false, error: 'Cannot end turn right now' };
    }

    this.state.phase = 'end-phase';
    this.processEndPhase();
    return { success: true };
  }

  // =============================================
  // AUTO-ADVANCE LOGIC
  // =============================================

  private autoAdvance(): void {
    // Loop through auto-advancing phases
    let safety = 0;
    while (safety++ < 20) {
      const phase = this.state.phase;

      if (phase === 'game-over') break;
      if (phase === 'ability-pending') break; // Wait for player to resolve ability

      // RPS phases — wait for player input or timer
      if (phase === 'setup-rps') break;
      if (phase === 'setup-rps-result') break;

      // Setup auto-advances
      if (phase === 'setup-choose-vanguard') {
        // Trial decks have fixed starters - auto advance
        // Flip VGs face up is done in stand-up
        this.state.phase = 'setup-draw-hand';
        this.addLog('system', 'Drawing starting hands...', 'system');
        continue;
      }

      if (phase === 'setup-draw-hand') {
        // Draw 5 cards for each player
        for (const pid of this.state.playerIds) {
          for (let i = 0; i < 5; i++) {
            this.drawCard(pid);
          }
        }
        this.state.phase = 'setup-mulligan';
        this.addLog('system', 'Select cards to exchange or keep your hand', 'system');
        break; // Wait for player input
      }

      if (phase === 'setup-mulligan') {
        // Check if both players have completed exchange
        const allComplete = this.state.playerIds.every(
          (pid: string) => this.state.players[pid].mulliganComplete
        );
        if (allComplete) {
          this.state.phase = 'setup-stand-up';
          continue;
        }
        break; // Wait for player input
      }

      if (phase === 'setup-stand-up') {
        // Flip starting VGs face up
        for (const pid of this.state.playerIds) {
          const player = this.state.players[pid];
          if (player.vanguardCircle) {
            const vg = this.state.allCards[player.vanguardCircle];
            vg.isFaceUp = true;
            const vgDef = getCardDefinition(vg.cardId);
            this.addLog(pid, `Stand up, Vanguard! ${vgDef.name}!`, 'system');
          }
        }

        // Start the first turn
        this.state.phase = 'stand-phase';
        this.addLog(this.state.turnPlayerId, 'Turn 1 begins!', 'phase');
        continue;
      }

      // Stand phase - automatic
      if (phase === 'stand-phase') {
        this.processStandPhase();
        this.state.phase = 'draw-phase';
        continue;
      }

      // Draw phase - automatic
      if (phase === 'draw-phase') {
        this.processDrawPhase();
        this.state.phase = 'ride-phase';
        this.addLog(this.state.turnPlayerId, 'Ride Phase', 'phase');
        break; // Wait for player input (ride or skip)
      }

      // Drive check - automatic
      if (phase === 'battle-drive-check') {
        // If there's already a card in the trigger zone (from a previous drive check
        // that was interrupted by ability resolution), don't do another check — just
        // wait for the reveal timer to resolve it.
        const turnPlayer = this.state.players[this.state.turnPlayerId];
        if (turnPlayer.triggerZone) {
          break; // Card already revealed, wait for reveal timer
        }

        const result = executeDriveCheck(this.state);
        if (result === 'trigger') break; // Wait for trigger assignment
        if (result === 'reveal') {
          // Check if abilities were queued during the drive check (e.g., Goku retire)
          if (this.state.abilityQueue.length > 0) {
            processAbilityQueue(this.state);
            // Phase is now 'ability-pending' — loop will break on next iteration
            continue;
          }
          break; // Wait for reveal pause (server will resolve after delay)
        }
        // 'deckout' — loop continues
        continue;
      }

      // Damage step - automatic
      if (phase === 'battle-damage-step') {
        resolveDamage(this.state);
        // Phase should now be damage-check, close-step, or game-over
        continue;
      }

      // Damage check - automatic
      if (phase === 'battle-damage-check') {
        // If there's already a card in the opponent's trigger zone (from a previous
        // damage check interrupted by ability resolution), wait for reveal timer.
        const oppId = getOpponentId(this.state, this.state.turnPlayerId);
        if (this.state.players[oppId].triggerZone) {
          break; // Card already revealed, wait for reveal timer
        }

        const result = executeDamageCheck(this.state);
        if (result === 'trigger') break; // Wait for trigger assignment
        if (result === 'reveal') break; // Wait for reveal pause (server will resolve after delay)
        // 'deckout' — loop continues
        continue;
      }

      // Close step - automatic
      if (phase === 'battle-close-step') {
        closeBattle(this.state);
        // Phase is now 'battle-phase' - wait for player input
        break;
      }

      // All other phases wait for player input
      break;
    }
  }

  // =============================================
  // PHASE PROCESSING
  // =============================================

  private processStandPhase(): void {
    const playerId = this.state.turnPlayerId;
    const player = this.state.players[playerId];

    // Stand all rested units
    if (player.vanguardCircle) {
      this.state.allCards[player.vanguardCircle].isRested = false;
    }

    for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS]) {
      const unitId = player.rearGuards[pos];
      if (unitId) {
        this.state.allCards[unitId].isRested = false;
      }
    }

    // Reset turn power/critical modifiers for ALL units on this player's field
    this.resetTurnModifiers(playerId);

    // Reset lostTwinDrive flag (Dragonic Overlord)
    if (player.vanguardCircle) {
      this.state.allCards[player.vanguardCircle].lostTwinDrive = false;
    }
    for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS]) {
      const unitId = player.rearGuards[pos];
      if (unitId) {
        this.state.allCards[unitId].lostTwinDrive = false;
      }
    }

    // Recalculate continuous abilities
    recalculateContinuousAbilities(this.state);

    this.addLog(playerId, 'Stand Phase - All units stand!', 'phase');
  }

  private processDrawPhase(): void {
    const playerId = this.state.turnPlayerId;
    this.drawCard(playerId);
    this.addLog(playerId, 'Draw Phase - Drew 1 card', 'phase');
  }

  private processEndPhase(): void {
    const playerId = this.state.turnPlayerId;
    const player = this.state.players[playerId];

    // Clear first turn flag
    player.isFirstTurn = false;
    player.hasRiddenThisTurn = false;

    // Reset power/critical modifiers for both players at end of turn
    this.resetTurnModifiers(playerId);
    const opponentId = getOpponentId(this.state, playerId);
    this.resetTurnModifiers(opponentId);

    this.addLog(playerId, 'End Phase', 'phase');

    // Switch turn
    this.state.turnPlayerId = opponentId;
    this.state.turnNumber++;

    this.state.phase = 'stand-phase';

    this.addLog(opponentId, `Turn ${this.state.turnNumber} - ${this.state.players[opponentId].name}'s turn`, 'phase');

    // handleAction will call autoAdvance() after this returns
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  private drawCard(playerId: string): boolean {
    const player = this.state.players[playerId];
    if (player.deck.length === 0) {
      // Deck out - player loses
      this.state.winner = getOpponentId(this.state, playerId);
      this.state.phase = 'game-over';
      this.addLog(playerId, `${player.name} has no cards left in deck! Game over!`, 'system');
      return false;
    }

    const cardId = player.deck.shift()!;
    const card = this.state.allCards[cardId];
    card.zone = 'hand';
    card.isFaceUp = true;
    player.hand.push(cardId);
    return true;
  }

  private resetTurnModifiers(playerId: string): void {
    const player = this.state.players[playerId];

    // Reset VG modifiers
    if (player.vanguardCircle) {
      const vg = this.state.allCards[player.vanguardCircle];
      vg.turnPowerModifier = 0;
      vg.turnCriticalModifier = 0;
    }

    // Reset all RG modifiers
    for (const pos of [...FRONT_ROW_POSITIONS, ...BACK_ROW_POSITIONS]) {
      const unitId = player.rearGuards[pos];
      if (unitId) {
        const unit = this.state.allCards[unitId];
        unit.turnPowerModifier = 0;
        unit.turnCriticalModifier = 0;
      }
    }
  }

  private addLog(
    playerId: string,
    message: string,
    type: 'phase' | 'action' | 'trigger' | 'damage' | 'system' | 'ability',
  ): void {
    this.state.actionLog.push({
      timestamp: Date.now(),
      playerId,
      message,
      type,
    });
  }
}

// Helper for display
function formatPosition(pos: RearGuardPosition): string {
  return pos.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
