import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../game/GameEngine';
import { CardInstance, VanguardGameState } from '../../shared/types';

function getState(engine: GameEngine): VanguardGameState {
  return (engine as unknown as { state: VanguardGameState }).state;
}

function findCard(state: VanguardGameState, ownerId: string, cardId: string): CardInstance {
  const card = Object.values(state.allCards).find(
    candidate => candidate.ownerId === ownerId && candidate.cardId === cardId,
  );
  assert.ok(card, `Expected ${cardId} owned by ${ownerId}`);
  return card;
}

function removeFromDeck(state: VanguardGameState, playerId: string, instanceId: string): void {
  const player = state.players[playerId];
  const index = player.deck.indexOf(instanceId);
  assert.notEqual(index, -1, `Expected ${instanceId} in ${playerId}'s deck`);
  player.deck.splice(index, 1);
}

function addFaceUpDamage(state: VanguardGameState, playerId: string, excludedIds: string[] = []): void {
  const player = state.players[playerId];
  const instanceId = player.deck.find(id => !excludedIds.includes(id));
  assert.ok(instanceId, 'Expected a card to move to damage');
  removeFromDeck(state, playerId, instanceId);
  player.damageZone.push(instanceId);
  const card = state.allCards[instanceId];
  card.zone = 'damage-zone';
  card.isFaceUp = true;
}

function prepareBorsAttack(): { engine: GameEngine; state: VanguardGameState; bors: CardInstance } {
  const engine = new GameEngine(
    'p1',
    'Player 1',
    'td01-blaster-blade',
    'p2',
    'Player 2',
    'td01-blaster-blade',
  );
  const state = getState(engine);
  const bors = findCard(state, 'p1', 'TD01/002');

  removeFromDeck(state, 'p1', bors.instanceId);
  state.players.p1.rearGuards['front-left'] = bors.instanceId;
  bors.zone = 'front-left-rc';
  bors.position = 'front-left';
  bors.isRested = false;
  addFaceUpDamage(state, 'p1', [bors.instanceId]);
  state.phase = 'battle-phase';
  state.turnPlayerId = 'p1';

  return { engine, state, bors };
}

test('optional on-attack ability pauses combat for player input', () => {
  const { engine, state } = prepareBorsAttack();

  const result = engine.handleAction('p1', {
    type: 'attack:declare',
    attackerPosition: 'front-left',
    targetPosition: 'vanguard',
  });

  assert.equal(result.success, true);
  assert.equal(state.phase, 'ability-pending');
  assert.equal(state.abilityPending?.abilityId, 'TD01/002-0');
  assert.equal(state.abilityQueue.length, 0);
});

test('resolved on-attack power is reflected before guarding', () => {
  const { engine, state, bors } = prepareBorsAttack();
  engine.handleAction('p1', {
    type: 'attack:declare',
    attackerPosition: 'front-left',
    targetPosition: 'vanguard',
  });

  const result = engine.handleAction('p1', { type: 'ability:confirm' });

  assert.equal(result.success, true);
  assert.equal(state.phase, 'battle-guard-step');
  assert.equal(bors.battlePowerModifier, 3000);
  assert.equal(state.battle?.attackPower, 13000);
});

test('public state exposes only server-authorized ACT abilities', () => {
  const engine = new GameEngine(
    'p1',
    'Player 1',
    'td01-blaster-blade',
    'p2',
    'Player 2',
    'td01-blaster-blade',
  );
  const state = getState(engine);
  const gancelot = findCard(state, 'p1', 'TD01/003');
  const blasterBlade = findCard(state, 'p1', 'TD01/005');
  const oldVanguardId = state.players.p1.vanguardCircle!;

  removeFromDeck(state, 'p1', gancelot.instanceId);
  state.players.p1.vanguardCircle = gancelot.instanceId;
  gancelot.zone = 'vanguard-circle';
  gancelot.position = 'vanguard';
  state.players.p1.soul.push(oldVanguardId);
  state.allCards[oldVanguardId].zone = 'soul';
  state.allCards[oldVanguardId].position = undefined;
  addFaceUpDamage(state, 'p1', [blasterBlade.instanceId]);
  addFaceUpDamage(state, 'p1', [blasterBlade.instanceId]);
  state.phase = 'main-phase';
  state.turnPlayerId = 'p1';

  const withoutBlasterBlade = engine.getStateForPlayer('p1');
  assert.equal(withoutBlasterBlade.activatableACTAbilities[gancelot.instanceId], undefined);

  removeFromDeck(state, 'p1', blasterBlade.instanceId);
  state.players.p1.soul.push(blasterBlade.instanceId);
  blasterBlade.zone = 'soul';
  blasterBlade.position = undefined;

  const withBlasterBlade = engine.getStateForPlayer('p1');
  assert.deepEqual(withBlasterBlade.activatableACTAbilities[gancelot.instanceId], [0]);
});

test('public player state does not expose ordered deck contents', () => {
  const engine = new GameEngine(
    'p1',
    'Player 1',
    'td01-blaster-blade',
    'p2',
    'Player 2',
    'td01-blaster-blade',
  );

  const publicState = engine.getStateForPlayer('p1');

  assert.equal('deck' in publicState.myState, false);
  assert.equal(publicState.myState.deckCount, 49);
});
