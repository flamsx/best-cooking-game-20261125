// One pooled particle list for every effect in the kitchen: grill steam, serve
// sparkles, plate poofs and floating coin text. Pre-allocated shape, hard cap, no
// allocation inside the frame loop beyond the small spawn calls, and a reset that is
// safe to call twice.

export const PARTICLE_CAP = 240;

export function createParticles() {
  return { list: [], time: 0 };
}

function spawn(pool, p) {
  if (pool.list.length >= PARTICLE_CAP) pool.list.shift();
  pool.list.push(p);
}

export function spawnSteam(pool, x, y) {
  spawn(pool, {
    kind: 'steam', x: x + (Math.random() * 24 - 12), y,
    vx: Math.random() * 8 - 4, vy: -26 - Math.random() * 14,
    life: 0, max: 0.9 + Math.random() * 0.5, size: 7 + Math.random() * 7,
  });
}

export function spawnSparkle(pool, x, y) {
  for (let i = 0; i < 14; i += 1) {
    const a = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 60 + Math.random() * 120;
    spawn(pool, {
      kind: 'spark', x, y,
      vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 40,
      life: 0, max: 0.55 + Math.random() * 0.35, size: 3 + Math.random() * 3,
    });
  }
}

export function spawnPoof(pool, x, y) {
  for (let i = 0; i < 10; i += 1) {
    spawn(pool, {
      kind: 'poof', x: x + (Math.random() * 30 - 15), y: y + (Math.random() * 12 - 6),
      vx: Math.random() * 20 - 10, vy: -8 - Math.random() * 10,
      life: 0, max: 0.5 + Math.random() * 0.3, size: 8 + Math.random() * 8,
    });
  }
}

export function spawnFloatText(pool, x, y, text, color) {
  spawn(pool, { kind: 'text', x, y, vx: 0, vy: -42, life: 0, max: 1.1, size: 22, text, color });
}

export function updateParticles(pool, dt) {
  pool.time += dt;
  const list = pool.list;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const p = list[i];
    p.life += dt;
    if (p.life >= p.max) {
      list.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'spark') p.vy += 260 * dt;
    if (p.kind === 'steam') {
      p.vx += Math.sin((pool.time + p.life) * 6) * 6 * dt;
      p.size += 14 * dt;
    }
  }
}

export function drawParticles(ctx, pool) {
  for (const p of pool.list) {
    const t = p.life / p.max;
    const alpha = 1 - t;
    if (p.kind === 'steam') {
      ctx.globalAlpha = alpha * 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'spark') {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#f2c94c';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'poof') {
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = '#cbb89a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'text') {
      ctx.globalAlpha = Math.min(1, alpha * 1.6);
      ctx.font = '800 22px ' + 'system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(43,33,24,0.85)';
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
  }
  ctx.globalAlpha = 1;
}

export function resetParticles(pool) {
  pool.list.length = 0;
  pool.time = 0;
}
