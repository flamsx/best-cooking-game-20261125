// Mouse and keyboard for the kitchen. Click zones are rebuilt by the renderer
// every frame (they live on state.zones); this module only dispatches them, so a
// button's hit area can never drift from its drawing.

import { INGREDIENT_ORDER, LAYOUT } from './config.js';
import { SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE } from './state.js';
import {
  addIngredient, clearPlate, collectGrill, startShift, tryServe,
} from './state.js';
import { playClick, setMuted, isMuted, unlockAudio } from './audio.js';

export function hitZone(zones, x, y) {
  for (const z of zones) {
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z;
  }
  return null;
}

export function handleClick(state, x, y) {
  unlockAudio();
  if (!state.zones) return;
  const zone = hitZone(state.zones, x, y);
  if (!zone) return;
  playClick();
  switch (zone.action) {
    case 'start':
      startShift(state);
      break;
    case 'restart':
      startShift(state);
      break;
    case 'pause':
      if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSE;
      break;
    case 'resume':
      if (state.screen === SCREEN_PAUSE) state.screen = SCREEN_PLAY;
      break;
    case 'mute':
      setMuted(!isMuted());
      break;
    case 'bin':
      addIngredient(state, zone.ingredient);
      break;
    case 'grill':
      collectGrill(state, zone.slot);
      break;
    case 'serve':
      tryServe(state);
      break;
    case 'trash':
      clearPlate(state);
      break;
    default:
      break;
  }
}

export function handleKey(state, key) {
  unlockAudio();
  const k = key.toLowerCase();
  if (state.screen === SCREEN_TITLE && (k === 'enter' || k === ' ')) {
    startShift(state);
    return;
  }
  if (state.screen === SCREEN_OVER && (k === 'r' || k === 'enter' || k === ' ')) {
    startShift(state);
    return;
  }
  if (k === 'p' || k === 'escape') {
    if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSE;
    else if (state.screen === SCREEN_PAUSE) state.screen = SCREEN_PLAY;
    return;
  }
  if (k === 'm') {
    setMuted(!isMuted());
    return;
  }
  if (state.screen !== SCREEN_PLAY) return;
  if (k === 'r') {
    startShift(state);
    return;
  }
  if (k === 'enter' || k === ' ') {
    tryServe(state);
    return;
  }
  if (k === 'backspace' || k === 'delete' || k === 't') {
    clearPlate(state);
    return;
  }
  const binIndex = INGREDIENT_ORDER.findIndex((id) => {
    const ing = { bun: '1', patty: '2', tomato: '3', lettuce: '4', cheese: '5', sauce: '6' }[id];
    return ing === k;
  });
  if (binIndex >= 0) {
    addIngredient(state, INGREDIENT_ORDER[binIndex]);
    return;
  }
  if (k === 'g') {
    const ready = state.grill.findIndex((g) => g.state === 'ready' || g.state === 'burnt');
    if (ready >= 0) collectGrill(state, ready);
  }
}

export function handleMouseMove(state, x, y) {
  state.mouse = { x, y };
  state.hoverBin = -1;
  if (!state.zones) return;
  const zone = hitZone(state.zones, x, y);
  if (zone && zone.action === 'bin') {
    const rect = LAYOUT.bins[INGREDIENT_ORDER.indexOf(zone.ingredient)];
    state.hoverBin = LAYOUT.bins.indexOf(rect);
  }
}
