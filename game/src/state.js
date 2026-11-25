// The kitchen's single source of truth: one state object, and the pure-ish
// transitions that move it (spawn an order, add an ingredient, collect the grill,
// serve a plate). The renderer only reads it; the input layer only calls these.

import {
  CUSTOMERS, GRILL, HEARTS, INGREDIENTS, MAX_PLATE, MAX_TICKETS, PATIENCE,
  RECIPES, SHIFT_SECONDS, SPAWN, STARS,
} from './config.js';
import { pick } from './rng.js';
import {
  playChop, playCoin, playDing, playError, playJingle, playPop,
} from './audio.js';
import { spawnFloatText, spawnPoof, spawnSparkle } from './particles.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';

export function recipePrice(recipe) {
  return recipe.needs.reduce((sum, id) => sum + INGREDIENTS[id].price, 0) + 4;
}

export function unlockedRecipes(elapsed) {
  return RECIPES.filter((r) => elapsed >= r.unlockAt);
}

export function createState(rng) {
  return {
    rng,
    screen: SCREEN_TITLE,
    elapsed: 0,
    remaining: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    orders: [],
    plate: [],
    grill: Array.from({ length: GRILL.slots }, () => ({ state: 'empty', t: 0 })),
    spawnIn: SPAWN.first,
    toast: '',
    toastT: 0,
    toastKind: 'info',
    chefX: 640,
    chefTargetX: 640,
    hoverBin: -1,
    mouse: { x: -1, y: -1 },
    shakeT: 0,
    servePulse: 0,
    sizzleT: 0,
    best: 0,
    stars: 0,
    frozen: false,
    particles: null,
    servedTotal: 0,
  };
}

function nextOrderId(state) {
  state.servedTotal += 1;
  return state.servedTotal;
}

export function spawnOrder(state) {
  const unlocked = unlockedRecipes(state.elapsed);
  const recipe = pick(state.rng, unlocked);
  const patienceMax = Math.max(PATIENCE.min, PATIENCE.base - state.elapsed * PATIENCE.shrinkPerSecond);
  state.orders.push({
    id: nextOrderId(state),
    customer: pick(state.rng, CUSTOMERS),
    recipe,
    patience: patienceMax,
    patienceMax,
    price: recipePrice(recipe),
    born: state.elapsed,
  });
}

export function setToast(state, text, kind = 'info') {
  state.toast = text;
  state.toastT = 2.2;
  state.toastKind = kind;
}

/** Same multiset, any order: a plate matches when it holds exactly the recipe. */
export function plateMatches(plate, needs) {
  if (plate.length !== needs.length) return false;
  const have = {};
  for (const id of plate) have[id] = (have[id] || 0) + 1;
  for (const id of needs) {
    if (!have[id]) return false;
    have[id] -= 1;
  }
  return true;
}

export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatches(state.plate, order.recipe.needs)) return order;
  }
  return null;
}

/** Click a bin (or press its key): patty goes to the grill, the rest to the plate. */
export function addIngredient(state, id) {
  if (state.screen !== SCREEN_PLAY) return false;
  if (id === 'patty') {
    const slot = state.grill.find((g) => g.state === 'empty');
    if (!slot) {
      setToast(state, 'Grill is full — collect a patty first!', 'warn');
      playError();
      return false;
    }
    slot.state = 'cooking';
    slot.t = 0;
    state.chefTargetX = 165;
    playPop();
    return true;
  }
  if (state.plate.length >= MAX_PLATE) {
    setToast(state, 'Plate is full — serve it or bin it!', 'warn');
    playError();
    return false;
  }
  state.plate.push(id);
  state.chefTargetX = 596;
  if (id === 'tomato' || id === 'lettuce') playChop();
  else playPop();
  return true;
}

/** Click a grill slot: collect a ready patty onto the plate, or bin a burnt one. */
export function collectGrill(state, slotIndex) {
  if (state.screen !== SCREEN_PLAY) return false;
  const slot = state.grill[slotIndex];
  if (!slot || slot.state === 'empty') return false;
  if (slot.state === 'burnt') {
    slot.state = 'empty';
    slot.t = 0;
    if (state.particles) spawnPoof(state.particles, 165, 300);
    setToast(state, 'Burnt patty binned. Watch the grill!', 'warn');
    playError();
    return true;
  }
  if (slot.state === 'cooking') {
    setToast(state, 'Still sizzling… wait for the ding!', 'info');
    return false;
  }
  if (state.plate.length >= MAX_PLATE) {
    setToast(state, 'Plate is full — serve it or bin it!', 'warn');
    playError();
    return false;
  }
  slot.state = 'empty';
  slot.t = 0;
  state.plate.push('patty');
  state.chefTargetX = 596;
  playPop();
  return true;
}

export function clearPlate(state) {
  if (state.screen !== SCREEN_PLAY || state.plate.length === 0) return false;
  state.plate.length = 0;
  if (state.particles) spawnPoof(state.particles, 596, 372);
  setToast(state, 'Plate cleared.', 'info');
  playPop();
  return true;
}

/** Serve the plate: a match pays price + patience tip (combo boosts it); a miss
 * costs a heart and the plate. */
export function tryServe(state) {
  if (state.screen !== SCREEN_PLAY) return false;
  if (state.plate.length === 0) {
    setToast(state, 'Nothing on the plate yet!', 'info');
    return false;
  }
  const order = matchingOrder(state);
  if (!order) {
    state.hearts -= 1;
    state.combo = 0;
    state.plate.length = 0;
    state.shakeT = 0.45;
    playError();
    setToast(state, 'Wrong order! The customer walks out.', 'bad');
    if (state.hearts <= 0) endShift(state);
    return false;
  }
  const tip = Math.round(order.price * 0.5 * (order.patience / order.patienceMax));
  const comboBoost = 1 + 0.1 * Math.min(state.combo, 5);
  const earned = Math.round((order.price + tip) * comboBoost);
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o !== order);
  state.plate.length = 0;
  state.servePulse = 0.6;
  if (state.particles) {
    spawnSparkle(state.particles, 1068, 300);
    spawnFloatText(state.particles, 1068, 260, '+$' + earned, '#f2c94c');
    if (state.combo >= 2) spawnFloatText(state.particles, 1068, 300, 'Combo x' + state.combo + '!', '#ffffff');
  }
  if (state.combo >= 3) playJingle();
  else playCoin();
  setToast(state, order.customer + ' loved the ' + order.recipe.name + '! +$' + earned, 'good');
  return true;
}

export function endShift(state) {
  state.screen = SCREEN_OVER;
  state.stars = state.coins >= STARS.three ? 3 : state.coins >= STARS.two ? 2 : 1;
  try {
    const prev = Number(window.localStorage.getItem('ember-thyme.best.coins') || 0);
    if (state.coins > prev) window.localStorage.setItem('ember-thyme.best.coins', String(state.coins));
    state.best = Math.max(prev, state.coins);
  } catch {
    state.best = state.coins;
  }
  playJingle();
}

export function startShift(state) {
  state.screen = SCREEN_PLAY;
  state.elapsed = 0;
  state.remaining = SHIFT_SECONDS;
  state.coins = 0;
  state.served = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.hearts = HEARTS;
  state.orders = [];
  state.plate = [];
  state.grill = Array.from({ length: GRILL.slots }, () => ({ state: 'empty', t: 0 }));
  state.spawnIn = SPAWN.first;
  state.toast = '';
  state.toastT = 0;
  state.chefX = 640;
  state.chefTargetX = 640;
  try {
    state.best = Number(window.localStorage.getItem('ember-thyme.best.coins') || 0);
  } catch {
    state.best = 0;
  }
}

/** One fixed step of the shift: timers, patience, spawns, grill, expiry. */
export function update(state, dt) {
  if (state.frozen) return;
  if (state.toastT > 0) state.toastT -= dt;
  if (state.shakeT > 0) state.shakeT -= dt;
  if (state.servePulse > 0) state.servePulse -= dt;
  // The chef slides toward the station he is working at.
  const dx = state.chefTargetX - state.chefX;
  state.chefX += dx * Math.min(1, dt * 6);
  if (state.screen !== SCREEN_PLAY) return;
  state.elapsed += dt;
  state.remaining = Math.max(0, SHIFT_SECONDS - state.elapsed);
  // Grill: cook, ding when ready, burn if forgotten.
  for (const slot of state.grill) {
    if (slot.state === 'empty') continue;
    const wasCooking = slot.state === 'cooking';
    slot.t += dt;
    if (wasCooking && slot.t >= GRILL.cookSeconds) {
      slot.state = 'ready';
      playDing();
    } else if (slot.state === 'ready' && slot.t >= GRILL.burnSeconds) {
      slot.state = 'burnt';
      setToast(state, 'A patty burnt on the grill!', 'warn');
      playError();
    }
  }
  state.sizzleT -= dt;
  // Orders: patience drains; a ticket that runs out walks out angry.
  for (let i = state.orders.length - 1; i >= 0; i -= 1) {
    const order = state.orders[i];
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders.splice(i, 1);
      state.hearts -= 1;
      state.combo = 0;
      state.shakeT = 0.45;
      playError();
      setToast(state, order.customer + ' waited too long and left!', 'bad');
      if (state.hearts <= 0) {
        endShift(state);
        return;
      }
    }
  }
  // Spawn the next ticket.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0 && state.orders.length < MAX_TICKETS) {
    spawnOrder(state);
    state.spawnIn = Math.max(SPAWN.min, SPAWN.start - state.elapsed * SPAWN.shrinkPerSecond);
  }
  if (state.remaining <= 0) endShift(state);
}
