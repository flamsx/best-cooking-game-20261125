// Screenshot scenes behind ?shot=start|play|serve|end. Each one stages a real
// game state through the same transitions the player uses (orders, plate, grill),
// freezes the timers, and lets the renderer draw the frame — so every screenshot
// is a real render of the game's own code, and the same seed always gives the
// same frame.

import { GRILL, RECIPES } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, recipePrice } from './state.js';
import { spawnSparkle } from './particles.js';

function makeOrder(recipeId, customer, patienceFrac, elapsed) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  const patienceMax = 50;
  return {
    id: recipeId + '-' + customer,
    customer,
    recipe,
    patience: patienceMax * patienceFrac,
    patienceMax,
    price: recipePrice(recipe),
    born: elapsed,
  };
}

/**
 * Stage `name` on a fresh state and return the screen to draw. The state is
 * frozen afterwards: timers, patience and the grill do not advance, so the
 * captured frame is the staged one.
 */
export function stageShot(name, state) {
  state.screen = SCREEN_TITLE;
  state.elapsed = 0;
  state.remaining = 180;
  state.coins = 0;
  state.served = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.hearts = 3;
  state.orders = [];
  state.plate = [];
  state.grill = Array.from({ length: GRILL.slots }, () => ({ state: 'empty', t: 0 }));
  state.toast = '';
  state.toastT = 0;
  state.shakeT = 0;
  state.servePulse = 0;
  state.best = 212;
  state.stars = 3;
  state.chefX = 596;
  state.chefTargetX = 596;

  if (name === 'start') {
    state.screen = SCREEN_TITLE;
    state.best = 0;
    state.orders = [
      makeOrder('classic', 'Mara', 0.8, 0),
      makeOrder('garden', 'Juno', 0.55, 0),
    ];
    state.grill[0] = { state: 'cooking', t: 2.0 };
    state.frozen = true;
    return { screen: SCREEN_TITLE };
  }
  if (name === 'serve') {
    state.screen = SCREEN_PLAY;
    state.elapsed = 132;
    state.remaining = 48;
    state.coins = 86;
    state.served = 9;
    state.combo = 3;
    state.bestCombo = 4;
    state.orders = [makeOrder('garden', 'Lena', 0.7, 132)];
    state.plate = ['bun', 'patty', 'lettuce', 'tomato'];
    state.grill[0] = { state: 'cooking', t: 3.1 };
    state.servePulse = 0.6;
    state.toast = 'Perfect match — ring the bell to serve!';
    state.toastT = 99;
    state.toastKind = 'good';
    if (state.particles) spawnSparkle(state.particles, 1068, 300);
    state.frozen = true;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'end') {
    state.screen = SCREEN_OVER;
    state.elapsed = 180;
    state.remaining = 0;
    state.coins = 212;
    state.served = 14;
    state.combo = 0;
    state.bestCombo = 5;
    state.hearts = 1;
    state.stars = 3;
    state.best = 212;
    state.frozen = true;
    return { screen: SCREEN_OVER };
  }
  // play: mid-shift, dish mid-assembly, a patty on the grill, tickets draining.
  state.screen = SCREEN_PLAY;
  state.elapsed = 89;
  state.remaining = 91;
  state.coins = 48;
  state.served = 6;
  state.combo = 2;
  state.bestCombo = 3;
  state.orders = [
    makeOrder('classic', 'Mara', 0.62, 89),
    makeOrder('garden', 'Theo', 0.35, 89),
  ];
  state.plate = ['bun', 'patty'];
  state.grill[0] = { state: 'cooking', t: 2.4 };
  state.grill[1] = { state: 'ready', t: 4.2 };
  state.chefTargetX = 596;
  state.frozen = true;
  return { screen: SCREEN_PLAY };
}
