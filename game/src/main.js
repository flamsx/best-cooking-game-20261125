// Ember & Thyme — Kitchen Rush: boot, fixed-step loop, input wiring and the
// deterministic screenshot scenes. The canvas is a fixed 1280x800 logical area
// scaled to the window; the game never fetches, never opens a socket and never
// loads anything outside game/.

import { FIELD, GRILL, LAYOUT, STEP } from './config.js';
import { makeRng } from './rng.js';
import { createParticles, spawnSteam, updateParticles } from './particles.js';
import { createState, update } from './state.js';
import { handleClick, handleKey, handleMouseMove } from './input.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { playSizzleTick } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || 1);

const rng = makeRng(Number.isFinite(seed) ? seed : 1);
const state = createState(rng);
state.particles = createParticles();
window.__game = state;

if (shotName) stageShot(shotName, state);

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = Math.floor(FIELD.width * scale) + 'px';
  canvas.style.height = Math.floor(FIELD.height * scale) + 'px';
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function toLogical(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * FIELD.width,
    y: ((event.clientY - rect.top) / rect.height) * FIELD.height,
  };
}

canvas.addEventListener('click', (event) => {
  const p = toLogical(event);
  handleClick(state, p.x, p.y);
});
canvas.addEventListener('mousemove', (event) => {
  const p = toLogical(event);
  handleMouseMove(state, p.x, p.y);
});
window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
  handleKey(state, event.key);
});

let last = performance.now();
let acc = 0;
let frames = 0;
let steamT = 0;

function frame(nowMs) {
  const now = nowMs / 1000;
  let dt = (nowMs - last) / 1000;
  last = nowMs;
  if (!(dt > 0)) dt = 0.016;
  // Slow frames still advance the shift (capped per frame so a long tab-sleep
  // cannot jump the clock), instead of dropping the time entirely.
  acc += Math.min(dt, 0.25);
  while (acc >= STEP) {
    update(state, STEP);
    updateParticles(state.particles, STEP);
    acc -= STEP;
  }
  // Grill sizzle: steam puffs and a soft tick while a patty cooks.
  steamT -= dt;
  const cooking = state.grill.some((g) => g.state === 'cooking');
  if (cooking && steamT <= 0 && !state.frozen) {
    steamT = 0.35;
    const slot = state.grill.findIndex((g) => g.state === 'cooking');
    const pos = LAYOUT.grillSlots[slot];
    spawnSteam(state.particles, pos.x, pos.y - 30);
    playSizzleTick();
  }
  // Keep the grill's progress honest: a patty left past its burn time is caught
  // by update(); this only feeds the sizzle clock.
  if (state.screen === 'play' && !state.frozen) {
    const anyCooking = state.grill.some((g) => g.state === 'cooking');
    if (!anyCooking) steamT = 0;
  }
  draw(ctx, state, now);
  frames += 1;
  if (shotName && frames >= 2) window.__shotReady = true;
  if (statusEl) {
    statusEl.textContent = state.screen === 'play'
      ? 'Playing: ' + state.served + ' served, $' + state.coins + ', ' + Math.ceil(state.remaining) + ' seconds left.'
      : state.screen === 'over'
        ? 'Shift over: ' + state.served + ' served, $' + state.coins + '.'
        : 'Ember and Thyme Kitchen Rush. Press Enter to start.';
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
