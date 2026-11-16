import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('playmat exposes the required UI boundaries', async () => {
  const playmat = await source('src/components/field/Playmat.tsx');

  for (const component of ['Playmat', 'Zone', 'PlayerHUD', 'InteractionOverlay']) {
    assert.match(playmat, new RegExp(`export const ${component}`));
  }
});

test('game board composes the modular playmat without replacing server state', async () => {
  const game = await source('src/components/pages/VanguardGame.tsx');

  assert.match(game, /<Playmat/);
  assert.match(game, /<PlayerHUD/);
  assert.match(game, /<Zone/);
  assert.match(game, /<InteractionOverlay/);
  assert.match(game, /playerState=\{myState\}/);
  assert.match(game, /playerState=\{opponentState\}/);
});

test('card rotation happens inside a stable slot transform layer', async () => {
  const cardSlot = await source('src/components/field/FieldCircle.tsx');
  const cardSlotCss = await source('src/components/field/FieldCircle.css');

  assert.match(cardSlot, /export const CardSlot/);
  assert.match(cardSlot, /field-circle__card-transform/);
  assert.match(cardSlotCss, /\.field-circle__card-transform/);
  assert.match(cardSlotCss, /\.field-circle__card-transform--rested/);
  assert.doesNotMatch(cardSlotCss, /\.field-circle--drag-over\s+\.field-circle__empty[^}]*transform:/s);
});

test('responsive playmat preserves ratio and reduced-motion behavior', async () => {
  const playmatCss = await source('src/components/field/Playmat.css');
  const gameCss = await source('src/components/pages/VanguardGame.css');

  assert.match(playmatCss, /aspect-ratio:/);
  assert.match(playmatCss, /@media\s*\(max-width:/);
  assert.match(playmatCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(playmatCss, /\.interaction-overlay\s*\{[^}]*min-height:\s*0/s);
  assert.match(gameCss, /\.interaction-overlay\s+\.vg-game__side-zone\s*\{[^}]*height:/s);

  const playmat = await source('src/components/field/Playmat.tsx');
  assert.doesNotMatch(playmat, /actionSpace/);
});

test('battle coordinates compensate for the scaled playmat surface', async () => {
  const arrow = await source('src/components/battle/BattleArrow.tsx');

  assert.match(arrow, /boardEl\.clientWidth\s*\/\s*boardRect\.width/);
  assert.match(arrow, /new ResizeObserver\(updatePoints\)/);
});

test('soul is rendered as an anchored stack rather than a detached counter', async () => {
  const soul = await source('src/components/field/SoulViewer.tsx');
  const soulCss = await source('src/components/field/SoulViewer.css');

  assert.match(soul, /soul-viewer__stack/);
  assert.match(soul, /soul-viewer__stack-card/);
  assert.match(soulCss, /\.soul-viewer__stack-card/);
  assert.match(soulCss, /position:\s*absolute/);
});

test('trigger reveal uses Vanguard trigger color semantics', async () => {
  const triggerCss = await source('src/components/battle/TriggerReveal.css');

  assert.match(triggerCss, /card-frame--critical[^}]*rgba\(255,\s*214,\s*67/s);
  assert.match(triggerCss, /card-frame--draw[^}]*rgba\(255,\s*79,\s*94/s);
  assert.match(triggerCss, /card-frame--heal[^}]*rgba\(50,\s*220,\s*100/s);
  assert.match(triggerCss, /card-frame--front[^}]*rgba\(255,\s*85,\s*184/s);
});

test('animated interaction layers honor reduced motion preferences', async () => {
  const actionCss = await source('src/components/battle/ActionPanel.css');
  const triggerCss = await source('src/components/battle/TriggerReveal.css');
  const gameCss = await source('src/components/pages/VanguardGame.css');

  for (const css of [actionCss, triggerCss, gameCss]) {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  }
});

test('Dear Days phase display shows the current phase and numbered turn', async () => {
  const phaseBar = await source('src/components/ui/PhaseBar.tsx');
  const phaseCss = await source('src/components/ui/PhaseBar.css');
  const game = await source('src/components/pages/VanguardGame.tsx');

  assert.match(phaseBar, /turnNumber:\s*number/);
  assert.match(phaseBar, /phase-bar__current-phase/);
  assert.match(phaseBar, /phase-bar__turn-number/);
  assert.match(phaseCss, /skewX\(-/);
  assert.match(phaseCss, /\.phase-bar__turn-indicator\s*\{[^}]*line-height:\s*1/s);
  assert.match(game, /turnNumber=\{gameState\.turnNumber\}/);
});

test('Dear Days HUD and commands live inside the playmat instead of a side rail', async () => {
  const game = await source('src/components/pages/VanguardGame.tsx');
  const gameCss = await source('src/components/pages/VanguardGame.css');
  const playmatCss = await source('src/components/field/Playmat.css');
  const playmat = await source('src/components/field/Playmat.tsx');
  const hud = await source('src/components/field/Playmat.tsx');
  const action = await source('src/components/battle/ActionPanel.tsx');

  const playmatStart = game.indexOf('<Playmat');
  const playmatEnd = game.indexOf('</Playmat>');
  const actionArea = game.indexOf('vg-game__action-area');
  assert.ok(playmatStart >= 0 && actionArea > playmatStart && actionArea < playmatEnd);
  assert.match(gameCss, /\.vg-game__action-area\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0/s);
  assert.doesNotMatch(playmat, /actionSpace/);
  assert.match(hud, /player-hud__avatar/);
  assert.match(hud, /avatarImage\?:\s*string/);
  assert.match(hud, /player-hud__avatar-image/);
  assert.match(playmatCss, /\.player-hud__avatar\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(game, /avatarImage=\{/);
  assert.match(action, /action-panel__information-label/);
  assert.match(action, /action-panel__commands/);
});

test('Dear Days battlefield uses a black cyan arena and mechanical circle plates', async () => {
  const playmatCss = await source('src/components/field/Playmat.css');
  const circleCss = await source('src/components/field/FieldCircle.css');

  assert.match(playmatCss, /--dd2-cyan:/);
  assert.match(playmatCss, /--dd2-ink:/);
  assert.match(playmatCss, /radial-gradient\(circle at 50% 50%/);
  assert.match(circleCss, /\.field-circle::before/);
  assert.match(circleCss, /\.field-circle__telemetry::before/);
});

test('hand cards are fanned from the bottom edge using per-card offsets', async () => {
  const hand = await source('src/components/cards/HandArea.tsx');
  const handCss = await source('src/components/cards/HandArea.css');

  assert.match(hand, /--hand-angle/);
  assert.match(hand, /--hand-lift/);
  assert.match(handCss, /rotate\(var\(--hand-angle\)\)/);
  assert.match(handCss, /translateY\(var\(--hand-lift\)\)/);
});

test('Dear Days board fills large desktop viewports and anchors phase HUD top-left', async () => {
  const playmat = await source('src/components/field/Playmat.tsx');
  const playmatCss = await source('src/components/field/Playmat.css');
  const gameCss = await source('src/components/pages/VanguardGame.css');

  assert.match(playmat, /Math\.min\(availableWidth\s*\/\s*1280,\s*availableHeight\s*\/\s*720,\s*1\.5\)/);
  assert.match(playmatCss, /\.playmat\s*\{[^}]*overflow:\s*clip/s);
  assert.match(gameCss, /\.vg-game__header\s*\{[^}]*align-items:\s*flex-start/s);
});
