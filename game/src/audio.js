// Synthesised kitchen sounds, WebAudio only, no audio files: a chop, a sizzle tick,
// a bell ding, a coin chirp, an error buzz and a short serve jingle. The context is
// created on the first gesture, so a headless screenshot run stays silent and never
// throws; every call is guarded.

let ctx = null;
let master = null;
let muted = false;

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.4;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.value = value ? 0 : 0.4;
}

export function isMuted() {
  return muted;
}

function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
  if (muted) return;
  const c = ensure();
  if (!c || !master) return;
  try {
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    // Sound never blocks play.
  }
}

function noiseBurst(dur, vol, freq) {
  if (muted) return;
  const c = ensure();
  if (!c || !master) return;
  try {
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, len, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  } catch {
    // Sound never blocks play.
  }
}

export function playChop() {
  noiseBurst(0.07, 0.5, 1800);
  tone(180, 0.06, 'triangle', 0.15, 0, 90);
}

export function playPop() {
  tone(520, 0.07, 'sine', 0.25, 0, 760);
}

export function playSizzleTick() {
  noiseBurst(0.12, 0.12, 5200);
}

export function playDing() {
  tone(1318, 0.5, 'sine', 0.3);
  tone(1760, 0.4, 'sine', 0.18, 0.02);
}

export function playCoin() {
  tone(988, 0.09, 'square', 0.12);
  tone(1319, 0.16, 'square', 0.12, 0.08);
}

export function playError() {
  tone(160, 0.22, 'sawtooth', 0.16, 0, 110);
}

export function playJingle() {
  tone(523, 0.12, 'triangle', 0.22);
  tone(659, 0.12, 'triangle', 0.22, 0.1);
  tone(784, 0.2, 'triangle', 0.22, 0.2);
  tone(1047, 0.3, 'triangle', 0.2, 0.3);
}

export function playClick() {
  tone(700, 0.04, 'sine', 0.12);
}
