import test from 'node:test';
import assert from 'node:assert/strict';
import { GameActionCoordinator } from '../../client/src/hooks/gameActionCoordinator';
import { ActionResult } from '../../shared/types';

test('serializes game actions until the authoritative state update arrives', async () => {
  const coordinator = new GameActionCoordinator();
  let acknowledge!: (result: ActionResult) => void;

  const firstAction = coordinator.dispatch(callback => {
    acknowledge = callback;
  });
  const duplicate = await coordinator.dispatch(() => {
    assert.fail('Duplicate action must not be emitted');
  });

  assert.deepEqual(duplicate, { success: false, error: 'Action already in progress' });

  let firstSettled = false;
  void firstAction.then(() => {
    firstSettled = true;
  });
  acknowledge({ success: true });
  await Promise.resolve();
  assert.equal(firstSettled, false);

  coordinator.onStateUpdate();
  assert.deepEqual(await firstAction, { success: true });
});

test('failed game actions unlock without waiting for a state update', async () => {
  const coordinator = new GameActionCoordinator();

  const failed = await coordinator.dispatch(callback => {
    callback({ success: false, error: 'Invalid action' });
  });

  assert.deepEqual(failed, { success: false, error: 'Invalid action' });

  let acknowledge!: (result: ActionResult) => void;
  const nextAction = coordinator.dispatch(callback => {
    acknowledge = callback;
  });
  acknowledge({ success: true });
  coordinator.onStateUpdate();

  assert.deepEqual(await nextAction, { success: true });
});

test('cancel releases a pending action when the socket disconnects', async () => {
  const coordinator = new GameActionCoordinator();
  let settledResult: ActionResult | undefined;
  const action = coordinator.dispatch(() => {});
  void action.then(result => {
    settledResult = result;
  });

  coordinator.cancel('Disconnected');
  await Promise.resolve();

  assert.deepEqual(settledResult, { success: false, error: 'Disconnected' });
});
