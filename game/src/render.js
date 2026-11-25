// Every pixel of the kitchen, drawn on one canvas: the tiled wall, the order
// board, the grill, the plate mid-assembly, the serve window, the ingredient bins
// and the chef. The same draw path renders the live game and the screenshot
// scenes, so a screenshot is always a real frame of the game. Click zones are
// rebuilt here every frame and stored on state.zones for the input layer.

import {
  FIELD, FONT, INGREDIENTS, INGREDIENT_ORDER, LAYOUT, PALETTE, RECIPES,
} from './config.js';
import { SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, matchingOrder } from './state.js';
import { drawParticles } from './particles.js';
import { isMuted } from './audio.js';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 700, align = 'left', baseline = 'alphabetic') {
  ctx.font = weight + ' ' + size + 'px ' + FONT;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}

function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** One ingredient, drawn at (x, y) centre, about `s` pixels across. */
export function drawIngredient(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(x, y);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 2, s * 0.52, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-s * 0.52, 2, s * 1.04, s * 0.16);
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-0.22, -0.28], [0.05, -0.38], [0.28, -0.22], [-0.02, -0.14]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.05, s * 0.03, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    rr(ctx, -s * 0.55, -s * 0.22, s * 1.1, s * 0.44, s * 0.18);
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = Math.max(2, s * 0.05);
    for (const dx of [-0.3, 0, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(dx * s, -s * 0.18);
      ctx.lineTo(dx * s, s * 0.18);
      ctx.stroke();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f28b7a';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe9c4';
    for (const [dx, dy] of [[-0.14, -0.08], [0.14, -0.08], [0, 0.16]]) {
      ctx.beginPath();
      ctx.ellipse(dx * s, dy * s, s * 0.06, s * 0.1, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      ctx.arc(Math.cos(a) * s * 0.26, Math.sin(a) * s * 0.22, s * 0.26, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = Math.max(2, s * 0.05);
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, 0);
    ctx.quadraticCurveTo(0, s * 0.18, s * 0.4, 0);
    ctx.stroke();
  } else if (id === 'cheese') {
    ctx.save();
    ctx.rotate(-0.06);
    ctx.fillStyle = ing.color;
    rr(ctx, -s * 0.5, -s * 0.4, s, s * 0.72, s * 0.08);
    ctx.fill();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.3);
    ctx.lineTo(-s * 0.18, s * 0.52);
    ctx.lineTo(-s * 0.06, s * 0.3);
    ctx.moveTo(s * 0.18, s * 0.3);
    ctx.lineTo(s * 0.3, s * 0.48);
    ctx.lineTo(s * 0.42, s * 0.3);
    ctx.fill();
    ctx.restore();
  } else if (id === 'sauce') {
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = Math.max(3, s * 0.09);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.15);
    ctx.lineTo(-s * 0.22, s * 0.18);
    ctx.lineTo(0, -s * 0.15);
    ctx.lineTo(s * 0.22, s * 0.18);
    ctx.lineTo(s * 0.45, -s * 0.15);
    ctx.stroke();
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.28, s * 0.14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(ctx, x, y, r, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** The kitchen's static shell, painted once to an offscreen canvas and blitted
 * every frame: wall, board, station panels, counter. Only the living parts
 * (tickets, grill, plate, bell, chef, bins) are redrawn per frame, which keeps
 * the frame cheap on a software renderer. */
let bgCache = null;
function background() {
  if (bgCache) return bgCache;
  bgCache = document.createElement('canvas');
  bgCache.width = FIELD.width;
  bgCache.height = FIELD.height;
  const b = bgCache.getContext('2d');
  b.fillStyle = PALETTE.wallTop;
  b.fillRect(0, 0, FIELD.width, FIELD.height);
  drawWall(b, 0);
  // Order board shell.
  const bd = LAYOUT.board;
  b.fillStyle = PALETTE.board;
  b.fillRect(bd.x, bd.y, bd.w, bd.h);
  text(b, 'ORDER BOARD', 24, 82, 11, PALETTE.boardLabel, 800);
  // Rush panel shell.
  const r = LAYOUT.rush;
  b.fillStyle = '#241a12';
  rr(b, r.x, r.y, r.w, r.h, 12);
  b.fill();
  b.strokeStyle = '#5d4037';
  b.lineWidth = 1;
  rr(b, r.x, r.y, r.w, r.h, 12);
  b.stroke();
  // Grill shell.
  const g = LAYOUT.grill;
  b.fillStyle = '#4a2c1a';
  rr(b, g.x, g.y, g.w, g.h, 14);
  b.fill();
  text(b, 'GRILL', g.x + 16, g.y + 26, 13, '#f2c94c', 800);
  // Plate panel shell.
  const p = LAYOUT.plate;
  b.fillStyle = '#fbf3df';
  rr(b, p.x, p.y, p.w, p.h, 14);
  b.fill();
  b.strokeStyle = '#e3c98f';
  b.lineWidth = 2;
  rr(b, p.x, p.y, p.w, p.h, 14);
  b.stroke();
  text(b, 'YOUR PLATE', p.x + 18, p.y + 26, 13, '#8a6d3b', 800);
  // Serve window shell: panel, label, warm pass, brass bell.
  const s = LAYOUT.serve;
  b.fillStyle = '#fbf3df';
  rr(b, s.x, s.y, s.w, s.h, 14);
  b.fill();
  b.strokeStyle = '#e3c98f';
  b.lineWidth = 2;
  rr(b, s.x, s.y, s.w, s.h, 14);
  b.stroke();
  text(b, 'SERVE WINDOW', s.x + 18, s.y + 26, 13, '#8a6d3b', 800);
  b.fillStyle = '#7a4a21';
  rr(b, s.x + 18, s.y + 40, s.w - 36, 110, 10);
  b.fill();
  b.fillStyle = '#ffd98a';
  rr(b, s.x + 26, s.y + 48, s.w - 52, 94, 8);
  b.fill();
  const bellX = s.x + s.w - 78;
  const bellY = s.y + 122;
  b.fillStyle = '#c9973f';
  b.beginPath();
  b.arc(bellX, bellY, 26, Math.PI, 0);
  b.closePath();
  b.fill();
  b.fillRect(bellX - 30, bellY - 2, 60, 6);
  b.fillStyle = '#8a6d3b';
  b.beginPath();
  b.arc(bellX, bellY - 28, 6, 0, Math.PI * 2);
  b.fill();
  // The wooden counter front.
  b.fillStyle = PALETTE.counterTop;
  rr(b, 12, 560, 1256, 112, 16);
  b.fill();
  b.fillStyle = PALETTE.counterFront;
  rr(b, 12, 640, 1256, 32, 8);
  b.fill();
  return bgCache;
}

function drawWall(ctx, now) {
  const g = ctx.createLinearGradient(0, 196, 0, 576);
  g.addColorStop(0, PALETTE.wallTop);
  g.addColorStop(1, PALETTE.wallBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 196, FIELD.width, 380);
  // Tile courses.
  ctx.strokeStyle = PALETTE.tileLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (let y = 216; y < 560; y += 34) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(FIELD.width, y);
    ctx.stroke();
  }
  for (let x = 0; x < FIELD.width; x += 68) {
    ctx.beginPath();
    ctx.moveTo(x, 196);
    ctx.lineTo(x, 560);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Window with a sunny street, left of the plate.
  ctx.fillStyle = '#8ecae6';
  rr(ctx, 336, 216, 118, 92, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(420, 244, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7ba05b';
  ctx.beginPath();
  ctx.moveTo(336, 308);
  ctx.lineTo(380, 268);
  ctx.lineTo(424, 308);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3d2b1f';
  ctx.lineWidth = 5;
  rr(ctx, 336, 216, 118, 92, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(395, 216);
  ctx.lineTo(395, 308);
  ctx.stroke();
  // Hanging pans above the serve window.
  for (let i = 0; i < 3; i += 1) {
    const x = 920 + i * 110;
    ctx.strokeStyle = '#3d2b1f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 200);
    ctx.lineTo(x, 216);
    ctx.stroke();
    ctx.fillStyle = i === 1 ? '#b08968' : '#6c757d';
    ctx.beginPath();
    ctx.arc(x, 238, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.arc(x, 238, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Floor strip behind the counter.
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 560, FIELD.width, 16);
  ctx.fillStyle = PALETTE.floorLine;
  ctx.fillRect(0, 572, FIELD.width, 4);
}

function drawHeader(ctx, state, now) {
  const h = LAYOUT.header;
  ctx.fillStyle = PALETTE.header;
  ctx.fillRect(h.x, h.y, h.w, h.h);
  text(ctx, 'EMBER & THYME', 24, 26, 24, PALETTE.headerText, 800);
  text(ctx, 'RUSH HOUR KITCHEN', 24, 48, 12, '#d9a441', 700);
  // Shift timer, centre: big clock + draining bar.
  const remain = state.remaining;
  const urgent = remain <= 30 && state.screen === SCREEN_PLAY;
  const timerColor = urgent ? '#ff8a80' : PALETTE.headerText;
  const pulse = urgent ? 1 + Math.sin(now * 6) * 0.06 : 1;
  ctx.save();
  ctx.translate(640, 30);
  ctx.scale(pulse, pulse);
  text(ctx, '⏱ ' + mmss(remain), 0, 0, 30, timerColor, 800, 'center', 'middle');
  ctx.restore();
  ctx.fillStyle = '#5d4037';
  rr(ctx, 520, 48, 240, 6, 3);
  ctx.fill();
  ctx.fillStyle = urgent ? PALETTE.danger : PALETTE.gold;
  rr(ctx, 520, 48, 240 * (remain / 180), 6, 3);
  ctx.fill();
  text(ctx, 'SHIFT', 520, 40, 11, '#bcaaa4', 700, 'left', 'middle');
  // Coins, hearts, score, right.
  text(ctx, '🪙 $' + state.coins, 1000, 24, 22, PALETTE.gold, 800, 'right');
  let hx = 1024;
  for (let i = 0; i < 3; i += 1) {
    text(ctx, i < state.hearts ? '❤' : '🖤', hx, 24, 20, '#ffffff', 400, 'left', 'middle');
    hx += 26;
  }
  text(ctx, 'SCORE ' + (state.coins + state.served * 5), 1256, 48, 12, '#bcaaa4', 700, 'right');
  // Pause + mute buttons.
  state.zones.push({ x: 1108, y: 8, w: 34, h: 34, action: 'pause' });
  ctx.fillStyle = '#5d4037';
  rr(ctx, 1108, 8, 34, 34, 8);
  ctx.fill();
  text(ctx, 'II', 1125, 26, 15, '#ffe9c4', 800, 'center', 'middle');
  state.zones.push({ x: 1148, y: 8, w: 34, h: 34, action: 'mute' });
  ctx.fillStyle = '#5d4037';
  rr(ctx, 1148, 8, 34, 34, 8);
  ctx.fill();
  text(ctx, isMuted() ? '✕' : '♪', 1165, 26, 16, '#ffe9c4', 800, 'center', 'middle');
}

function drawTicket(ctx, state, order, rect, now) {
  const ready = matchingOrder(state) === order;
  ctx.fillStyle = PALETTE.ticket;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = ready ? PALETTE.buttonReady : PALETTE.ticketEdge;
  ctx.lineWidth = ready ? 3 : 2;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.stroke();
  // Ticket stub edge.
  ctx.fillStyle = ready ? '#e8f5e9' : '#f3e5c3';
  rr(ctx, rect.x, rect.y, 8, rect.h, 4);
  ctx.fill();
  text(ctx, order.customer.toUpperCase(), rect.x + 20, rect.y + 24, 13, PALETTE.muted, 800);
  text(ctx, order.recipe.name, rect.x + 20, rect.y + 46, 19, PALETTE.ticketText, 800);
  // Recipe icons in order.
  let ix = rect.x + 22;
  for (const id of order.recipe.needs) {
    drawIngredient(ctx, id, ix + 13, rect.y + 74, 24);
    ix += 30;
  }
  // Patience bar.
  const frac = Math.max(0, order.patience / order.patienceMax);
  const barColor = frac > 0.5 ? PALETTE.sage : frac > 0.25 ? '#e8a13c' : PALETTE.danger;
  ctx.fillStyle = '#e8dcc3';
  rr(ctx, rect.x + 20, rect.y + 88, rect.w - 90, 8, 4);
  ctx.fill();
  ctx.fillStyle = barColor;
  rr(ctx, rect.x + 20, rect.y + 88, (rect.w - 90) * frac, 8, 4);
  ctx.fill();
  text(ctx, '$' + order.price, rect.x + rect.w - 16, rect.y + 46, 20, '#2e7d32', 800, 'right');
  if (ready) {
    ctx.fillStyle = PALETTE.buttonReady;
    rr(ctx, rect.x + rect.w - 92, rect.y + 58, 76, 24, 12);
    ctx.fill();
    text(ctx, 'READY ✓', rect.x + rect.w - 54, rect.y + 74, 12, '#ffffff', 800, 'center', 'middle');
  } else {
    text(ctx, Math.ceil(order.patience) + 's', rect.x + rect.w - 16, rect.y + 74, 12, barColor, 800, 'right');
  }
}

function drawBoard(ctx, state, now) {
  for (let i = 0; i < LAYOUT.tickets.length; i += 1) {
    const rect = LAYOUT.tickets[i];
    const order = state.orders[i];
    if (order) drawTicket(ctx, state, order, rect, now);
    else {
      ctx.strokeStyle = '#5d4037';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for orders…', rect.x + rect.w / 2, rect.y + rect.h / 2, 13, '#8d7b68', 600, 'center', 'middle');
    }
  }
  // Rush panel: served count, combo, next unlock.
  const r = LAYOUT.rush;
  text(ctx, 'RUSH', r.x + 16, r.y + 24, 11, PALETTE.boardLabel, 800);
  text(ctx, 'Served ' + state.served + '  ·  Combo x' + state.combo, r.x + 16, r.y + 48, 15, '#ffe9c4', 700);
  const next = RECIPES.find((rec) => state.elapsed < rec.unlockAt);
  if (next) {
    text(ctx, 'Unlocks at ' + mmss(next.unlockAt - state.elapsed) + ': ' + next.name, r.x + 16, r.y + 74, 13, '#bcaaa4', 600);
    let ix = r.x + 18;
    for (const id of next.needs) {
      drawIngredient(ctx, id, ix + 10, r.y + 88, 16);
      ix += 24;
    }
  } else {
    text(ctx, 'Full menu unlocked — keep the rush going!', r.x + 16, r.y + 74, 13, '#bcaaa4', 600);
  }
}

function drawGrill(ctx, state, now) {
  const g = LAYOUT.grill;
  for (let i = 0; i < LAYOUT.grillSlots.length; i += 1) {
    const slot = LAYOUT.grillSlots[i];
    const s = state.grill[i];
    state.zones.push({ x: slot.x - slot.r, y: slot.y - slot.r, w: slot.r * 2, h: slot.r * 2, action: 'grill', slot: i });
    ctx.fillStyle = PALETTE.grill;
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, slot.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#23272e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, slot.r, 0, Math.PI * 2);
    ctx.stroke();
    // Grill bars.
    ctx.strokeStyle = '#23272e';
    ctx.lineWidth = 3;
    for (let k = -1; k <= 1; k += 1) {
      ctx.beginPath();
      ctx.moveTo(slot.x - 44, slot.y + k * 20);
      ctx.lineTo(slot.x + 44, slot.y + k * 20);
      ctx.stroke();
    }
    if (s.state === 'cooking' || s.state === 'ready' || s.state === 'burnt') {
      const frac = s.state === 'cooking' ? s.t / 4 : 1;
      ctx.fillStyle = s.state === 'burnt' ? '#1c1c1c' : '#8a5a34';
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, 34, 0, Math.PI * 2);
      ctx.fill();
      if (s.state !== 'burnt') {
        ctx.strokeStyle = '#5f3a1e';
        ctx.lineWidth = 3;
        for (const dx of [-14, 0, 14]) {
          ctx.beginPath();
          ctx.moveTo(slot.x + dx, slot.y - 22);
          ctx.lineTo(slot.x + dx, slot.y + 22);
          ctx.stroke();
        }
      }
      // Progress ring.
      ctx.strokeStyle = s.state === 'burnt' ? PALETTE.danger : s.state === 'ready' ? '#43a047' : '#f2c94c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(slot.x, slot.y, slot.r - 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
      ctx.stroke();
      if (s.state === 'ready') {
        const pulse = 1 + Math.sin(now * 6) * 0.08;
        ctx.save();
        ctx.translate(slot.x, slot.y + 62);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#43a047';
        rr(ctx, -34, -13, 68, 26, 13);
        ctx.fill();
        text(ctx, 'READY!', 0, 4, 13, '#ffffff', 800, 'center', 'middle');
        ctx.restore();
      }
      if (s.state === 'burnt') {
        text(ctx, 'BURNT', slot.x, slot.y + 52, 13, '#ff8a80', 800, 'center', 'middle');
      }
    } else {
      text(ctx, 'empty', slot.x, slot.y, 13, '#8b93a3', 600, 'center', 'middle');
    }
  }
  text(ctx, 'click a patty slot to collect  ·  G works too', g.x + 16, g.y + g.h - 12, 11, '#d7c4a5', 600);
}

function drawPlate(ctx, state, now) {
  const p = LAYOUT.plate;
  const match = matchingOrder(state);
  if (match) {
    ctx.fillStyle = PALETTE.buttonReady;
    rr(ctx, p.x + p.w - 168, p.y + 10, 150, 26, 13);
    ctx.fill();
    text(ctx, '✓ MATCHES ' + match.customer.toUpperCase(), p.x + p.w - 93, p.y + 27, 12, '#ffffff', 800, 'center', 'middle');
  } else if (state.plate.length > 0) {
    text(ctx, 'building…', p.x + p.w - 18, p.y + 26, 13, '#8a6d3b', 600, 'right');
  }
  // The plate itself, with the dish stacked on it.
  const { cx, cy } = p;
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 150, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plateEdge;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 150, 44, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e9e2cf';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 108, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.plate.length === 0) {
    text(ctx, 'add ingredients from the counter below', cx, cy - 8, 14, '#a89a80', 600, 'center', 'middle');
  } else {
    // Stack bottom-to-top: first added at the bottom, each layer peeking out.
    for (let i = 0; i < state.plate.length; i += 1) {
      const id = state.plate[i];
      const y = cy - 6 - i * 20;
      drawIngredient(ctx, id, cx + (i % 2 === 0 ? -8 : 8), y, 88);
    }
  }
  // Plate contents as chips, so the recipe is readable at a glance.
  let chipX = p.x + 18;
  for (const id of state.plate) {
    const label = INGREDIENTS[id].name;
    ctx.font = '700 12px ' + FONT;
    const w = ctx.measureText(label).width + 34;
    ctx.fillStyle = '#efe3c2';
    rr(ctx, chipX, p.y + p.h - 34, w, 22, 11);
    ctx.fill();
    drawIngredient(ctx, id, chipX + 13, p.y + p.h - 23, 16);
    text(ctx, label, chipX + 24, p.y + p.h - 19, 12, '#3d2b1f', 700);
    chipX += w + 6;
  }
}

function drawServe(ctx, state, now) {
  const s = LAYOUT.serve;
  // Served stack: a neat pile of clean plates in the pass window.
  for (let i = 0; i < Math.min(state.served, 5); i += 1) {
    ctx.fillStyle = '#fdfdf8';
    ctx.beginPath();
    ctx.ellipse(s.x + 64, s.y + 134 - i * 5, 24, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plateEdge;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(s.x + 64, s.y + 134 - i * 5, 24, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Brass bell lives in the cached background; the served stack draws here.
  text(ctx, 'served: ' + state.served, s.x + s.w - 18, s.y + 26, 14, '#3d2b1f', 700, 'right');
  // SERVE button: green and pulsing only when the plate matches a ticket.
  const ready = matchingOrder(state) !== null;
  const btn = LAYOUT.serveButton;
  state.zones.push({ x: btn.x, y: btn.y, w: btn.w, h: btn.h, action: 'serve' });
  const pulse = ready ? 1 + Math.sin(now * 6) * 0.04 : 1;
  ctx.save();
  ctx.translate(btn.x + btn.w / 2, btn.y + btn.h / 2);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = ready ? PALETTE.buttonReady : '#9e9e8e';
  rr(ctx, -btn.w / 2, -btn.h / 2, btn.w, btn.h, 14);
  ctx.fill();
  ctx.strokeStyle = ready ? '#2e7d32' : '#7a7a6e';
  ctx.lineWidth = 2;
  rr(ctx, -btn.w / 2, -btn.h / 2, btn.w, btn.h, 14);
  ctx.stroke();
  text(ctx, ready ? '🔔 SERVE IT!  (Enter)' : 'SERVE  (Enter)', 0, 7, 22, '#ffffff', 800, 'center', 'middle');
  ctx.restore();
  if (ready) {
    text(ctx, 'plate is ready to serve!', s.x + s.w / 2, s.y + s.h - 10, 14, '#2e7d32', 800, 'center', 'middle');
  } else {
    text(ctx, 'match a ticket to light the bell', s.x + s.w / 2, s.y + s.h - 10, 13, '#8a7a66', 600, 'center', 'middle');
  }
}

function drawBins(ctx, state, now) {
  for (let i = 0; i < LAYOUT.bins.length; i += 1) {
    const rect = LAYOUT.bins[i];
    const id = INGREDIENT_ORDER[i];
    const ing = INGREDIENTS[id];
    const hover = state.hoverBin === i;
    state.zones.push({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, action: 'bin', ingredient: id });
    ctx.fillStyle = hover ? '#fff3d6' : '#fff8e7';
    rr(ctx, rect.x, rect.y + (hover ? -4 : 0), rect.w, rect.h, 12);
    ctx.fill();
    ctx.strokeStyle = hover ? '#f2c94c' : '#e3c98f';
    ctx.lineWidth = hover ? 3 : 2;
    rr(ctx, rect.x, rect.y + (hover ? -4 : 0), rect.w, rect.h, 12);
    ctx.stroke();
    drawIngredient(ctx, id, rect.x + 34, rect.y + 42, 52);
    text(ctx, ing.name, rect.x + 66, rect.y + 36, 17, '#3d2b1f', 800);
    text(ctx, '$' + ing.price + '  ·  key ' + ing.key, rect.x + 66, rect.y + 58, 12, '#8a7a66', 600);
    ctx.fillStyle = '#3d2b1f';
    ctx.beginPath();
    ctx.arc(rect.x + rect.w - 20, rect.y + 20, 13, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ing.key, rect.x + rect.w - 20, rect.y + 25, 13, '#ffffff', 800, 'center', 'middle');
  }
  // Trash can: clears the plate.
  const t = LAYOUT.trash;
  state.zones.push({ x: t.x, y: t.y, w: t.w, h: t.h, action: 'trash' });
  ctx.fillStyle = '#ece5d3';
  rr(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#d8c9a3';
  ctx.lineWidth = 2;
  rr(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.stroke();
  text(ctx, '🗑', t.x + t.w / 2, t.y + 40, 26, '#3d2b1f', 400, 'center', 'middle');
  text(ctx, 'BIN IT (T)', t.x + t.w / 2, t.y + 68, 11, '#3d2b1f', 800, 'center', 'middle');
}

function drawChef(ctx, state, now) {
  const x = state.chefX;
  const bob = Math.sin(now * 2.2) * 2;
  const y = 556 + bob;
  // Body: white coat, sage neckerchief, apron strings.
  ctx.fillStyle = '#fdfdf8';
  rr(ctx, x - 34, y - 66, 68, 78, 18);
  ctx.fill();
  ctx.fillStyle = PALETTE.sage;
  ctx.beginPath();
  ctx.moveTo(x - 14, y - 66);
  ctx.lineTo(x + 14, y - 66);
  ctx.lineTo(x, y - 44);
  ctx.closePath();
  ctx.fill();
  // Arms reaching toward the counter.
  ctx.strokeStyle = '#fdfdf8';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 30, y - 44);
  ctx.lineTo(x - 48, y - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 30, y - 44);
  ctx.lineTo(x + 48, y - 8);
  ctx.stroke();
  // Head + toque.
  ctx.fillStyle = '#f2c08a';
  ctx.beginPath();
  ctx.arc(x, y - 84, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 16, y - 102, 13, 0, Math.PI * 2);
  ctx.arc(x, y - 108, 15, 0, Math.PI * 2);
  ctx.arc(x + 16, y - 102, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 26, y - 104, 52, 10);
  ctx.fillStyle = '#3d2b1f';
  ctx.beginPath();
  ctx.arc(x - 9, y - 86, 2.5, 0, Math.PI * 2);
  ctx.arc(x + 9, y - 86, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3d2b1f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 78, 8, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

function drawHints(ctx, state) {
  text(ctx, '1–6 pick ingredients  ·  click the grill to collect a patty  ·  Enter serves  ·  T bins the plate  ·  P pause  ·  M mute', 24, 700, 14, '#6d5c48', 600);
  text(ctx, 'Best shift: $' + (state.best || 0), 1256, 700, 14, '#6d5c48', 700, 'right');
  if (state.toast && state.toastT > 0) {
    const colors = { good: '#2e7d32', bad: PALETTE.danger, warn: '#b26a00', info: '#5d4037' };
    const color = colors[state.toastKind] || '#5d4037';
    ctx.font = '700 16px ' + FONT;
    const w = ctx.measureText(state.toast).width + 36;
    ctx.globalAlpha = Math.min(1, state.toastT);
    ctx.fillStyle = '#fff8e7';
    rr(ctx, 640 - w / 2, 716, w, 36, 18);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    rr(ctx, 640 - w / 2, 716, w, 36, 18);
    ctx.stroke();
    text(ctx, state.toast, 640, 739, 16, color, 700, 'center', 'middle');
    ctx.globalAlpha = 1;
  }
  if (state.combo >= 2) {
    text(ctx, '🔥 COMBO x' + state.combo, 640, 786, 16, '#d64541', 800, 'center', 'middle');
  }
}

function drawTitle(ctx, state, now) {
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const panel = { x: 290, y: 190, w: 700, h: 420 };
  ctx.fillStyle = '#fff8e7';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 20);
  ctx.fill();
  ctx.strokeStyle = '#e3c98f';
  ctx.lineWidth = 3;
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 20);
  ctx.stroke();
  text(ctx, '🍳 EMBER & THYME', 640, 258, 52, '#3d2b1f', 800, 'center', 'middle');
  text(ctx, 'RUSH HOUR KITCHEN', 640, 292, 20, '#b26a00', 800, 'center', 'middle');
  text(ctx, 'Tickets roll in on the order board. Build each dish on your plate,', 640, 340, 16, '#5d4037', 600, 'center', 'middle');
  text(ctx, 'mind the grill — a patty burns if you forget it — and ring the bell', 640, 364, 16, '#5d4037', 600, 'center', 'middle');
  text(ctx, 'to serve before patience runs out. Three hearts. One shift. 3:00 on the clock.', 640, 388, 16, '#5d4037', 600, 'center', 'middle');
  // Mini recipe key.
  let ix = 640 - 3 * 34;
  for (const id of ['bun', 'patty', 'tomato', 'lettuce', 'cheese', 'sauce']) {
    drawIngredient(ctx, id, ix + 17, 428, 34);
    ix += 68;
  }
  text(ctx, 'keys 1–6 or click  ·  Enter serves  ·  P pauses', 640, 462, 14, '#8a7a66', 600, 'center', 'middle');
  const pulse = 1 + Math.sin(now * 4) * 0.04;
  ctx.save();
  ctx.translate(640, 528);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = PALETTE.button;
  rr(ctx, -150, -28, 300, 56, 16);
  ctx.fill();
  text(ctx, 'START SHIFT  ▶', 0, 8, 22, '#ffffff', 800, 'center', 'middle');
  ctx.restore();
  state.zones.push({ x: 490, y: 500, w: 300, h: 56, action: 'start' });
  text(ctx, 'Best shift: $' + (state.best || 0), 640, 592, 14, '#8a7a66', 700, 'center', 'middle');
}

function drawResults(ctx, state, now) {
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  const panel = { x: 340, y: 150, w: 600, h: 480 };
  ctx.fillStyle = '#fff8e7';
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 20);
  ctx.fill();
  ctx.strokeStyle = '#e3c98f';
  ctx.lineWidth = 3;
  rr(ctx, panel.x, panel.y, panel.w, panel.h, 20);
  ctx.stroke();
  text(ctx, 'SHIFT OVER!', 640, 212, 40, '#3d2b1f', 800, 'center', 'middle');
  for (let i = 0; i < 3; i += 1) {
    drawStar(ctx, 560 + i * 80, 258, 30, i < state.stars ? PALETTE.gold : '#d8cdb4');
  }
  const rows = [
    ['Dishes served', String(state.served)],
    ['Coins earned', '$' + state.coins],
    ['Best combo', 'x' + state.bestCombo],
    ['Hearts left', '♥'.repeat(Math.max(0, state.hearts)) || '—'],
    ['Best shift', '$' + state.best],
  ];
  let y = 318;
  for (const [label, value] of rows) {
    text(ctx, label, 420, y, 18, '#5d4037', 600);
    text(ctx, value, 860, y, 18, '#3d2b1f', 800, 'right');
    y += 36;
  }
  const pulse = 1 + Math.sin(now * 4) * 0.04;
  ctx.save();
  ctx.translate(640, 548);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = PALETTE.button;
  rr(ctx, -150, -28, 300, 56, 16);
  ctx.fill();
  text(ctx, 'COOK AGAIN  (R)', 0, 8, 22, '#ffffff', 800, 'center', 'middle');
  ctx.restore();
  state.zones.push({ x: 490, y: 520, w: 300, h: 54, action: 'restart' });
  text(ctx, 'A full menu, a hot grill and a bell that never lies.', 640, 612, 13, '#8a7a66', 600, 'center', 'middle');
}

function drawPause(ctx, state) {
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  text(ctx, 'PAUSED', 640, 360, 56, '#fff8e7', 800, 'center', 'middle');
  text(ctx, 'The tickets wait for no one — except now. Press P or click to resume.', 640, 404, 16, '#ffe9c4', 600, 'center', 'middle');
  ctx.fillStyle = PALETTE.button;
  rr(ctx, 540, 440, 200, 52, 14);
  ctx.fill();
  text(ctx, 'RESUME  ▶', 640, 473, 20, '#ffffff', 800, 'center', 'middle');
  state.zones.push({ x: 540, y: 440, w: 200, h: 52, action: 'resume' });
}

/** Draw one frame. `now` is wall seconds, used only for pulses and bobbing. */
export function draw(ctx, state, now) {
  state.zones = [];
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  ctx.save();
  if (state.shakeT > 0) {
    const mag = state.shakeT * 14;
    ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
  }
  // Kitchen base, always visible behind every screen: the cached static shell.
  ctx.drawImage(background(), 0, 0);
  drawHeader(ctx, state, now);
  drawBoard(ctx, state, now);
  drawGrill(ctx, state, now);
  drawPlate(ctx, state, now);
  drawServe(ctx, state, now);
  drawChef(ctx, state, now);
  drawBins(ctx, state, now);
  drawHints(ctx, state);
  if (state.particles) drawParticles(ctx, state.particles);
  ctx.restore();
  if (state.screen === SCREEN_TITLE) drawTitle(ctx, state, now);
  else if (state.screen === SCREEN_OVER) drawResults(ctx, state, now);
  else if (state.screen === SCREEN_PAUSE) drawPause(ctx, state);
}
