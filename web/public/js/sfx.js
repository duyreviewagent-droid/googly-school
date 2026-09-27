// Every sound and every note of music in Googly School is synthesised live with WebAudio — nothing to download.
// Instruments: plucked guitars, piano, pads, brass, organ, bells, kalimba, marimba, synths and kits (plus a marching drumline).
// Songs: the theme, the hallway, class, pop quiz, the cafeteria, after school, the principal's office, the homecoming
// dance, prom, the big game, graduation and night-time at home. Stingers for the best and the worst decisions.
let ctx = null, master = null, comp = null, sfxBus = null, musicBus = null, ambBus = null, ambFilter = null, verb = null, verbIn = null;
const VOL = { music: 0.36, sfx: 1, amb: 0.8 };
let musicOn = true, sfxOn = true;
try {
  musicOn = localStorage.getItem('gs.music') !== '0'; sfxOn = localStorage.getItem('gs.sfx') !== '0';
  for (const k of ['music', 'sfx', 'amb']) { const v = localStorage.getItem('gs.vol.' + k); if (v !== null) VOL[k] = Math.max(0, Math.min(1, +v)); }
} catch { }

function buildGraph(c) {
  ctx = c;
  comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
  // a brick-wall limiter and a soft clipper at the very end: nothing can ever get painfully loud
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.1;
  const clip = ctx.createWaveShaper(), curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(x * 1.2) / Math.tanh(1.2); } clip.curve = curve;
  comp.connect(lim); lim.connect(clip); clip.connect(ctx.destination);
  master = ctx.createGain(); master.gain.value = 0.85; master.connect(comp);
  sfxBus = ctx.createGain(); sfxBus.gain.value = sfxOn ? VOL.sfx : 0; sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = musicOn ? VOL.music : 0; musicBus.connect(master);
  // ambience goes through a filter so the outdoors sounds muffled from inside
  ambFilter = ctx.createBiquadFilter(); ambFilter.type = 'lowpass'; ambFilter.frequency.value = 18000; ambFilter.connect(master);
  ambBus = ctx.createGain(); ambBus.gain.value = sfxOn ? VOL.amb : 0; ambBus.connect(ambFilter);
  // an outdoor reverb: a long, soft noise tail
  verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 400 ? i / 400 : 1); }
  verb.buffer = ir; verbIn = ctx.createGain(); verbIn.gain.value = 1; verbIn.connect(verb);
  const vg = ctx.createGain(); vg.gain.value = 0.32; verb.connect(vg); vg.connect(master);
  noiseBuf = null; ksCache.clear();
}
export function unlockAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try { buildGraph(new (window.AudioContext || window.webkitAudioContext)()); } catch { return; }
  music.start();
  ambience.start();
}
export const audioReady = () => !!ctx && ctx.state === 'running';
export function setMusic(on) { musicOn = on; try { localStorage.setItem('gs.music', on ? '1' : '0'); } catch { } if (musicBus) musicBus.gain.setTargetAtTime(on ? VOL.music : 0, ctx.currentTime, 0.1); }
export function setSfx(on) { sfxOn = on; try { localStorage.setItem('gs.sfx', on ? '1' : '0'); } catch { } if (sfxBus) { sfxBus.gain.setTargetAtTime(on ? VOL.sfx : 0, ctx.currentTime, 0.05); ambBus.gain.setTargetAtTime(on ? VOL.amb : 0, ctx.currentTime, 0.05); } }
export function setVolume(kind, v) {
  VOL[kind] = Math.max(0, Math.min(1, v)); try { localStorage.setItem('gs.vol.' + kind, String(VOL[kind])); } catch { }
  if (!ctx) return;
  if (kind === 'music') musicBus.gain.setTargetAtTime(musicOn ? VOL.music : 0, ctx.currentTime, 0.05);
  if (kind === 'sfx') sfxBus.gain.setTargetAtTime(sfxOn ? VOL.sfx : 0, ctx.currentTime, 0.05);
  if (kind === 'amb') ambBus.gain.setTargetAtTime(sfxOn ? VOL.amb : 0, ctx.currentTime, 0.05);
}
export const audioState = () => ({ music: musicOn, sfx: sfxOn, vol: { ...VOL } });
const now = () => ctx ? ctx.currentTime : 0;
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a, b) => a + Math.random() * (b - a);

// ------------------------------------------------------------------ building blocks
let noiseBuf = null;
function nb() { if (!noiseBuf) { const n = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, n, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; } return noiseBuf; }
function env(g, t0, vol, attack, dur, curve = 'exp') {
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack);
  if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0005, t0 + dur); else { g.gain.setValueAtTime(vol, t0 + dur * 0.7); g.gain.linearRampToValueAtTime(0, t0 + dur); }
}
function sendTo(node, amt) { if (!amt) return; const s = ctx.createGain(); s.gain.value = amt; node.connect(s); s.connect(verbIn); }
function tone(f, t0, dur, { type = 'sine', vol = 0.3, attack = 0.004, slide = 0, out = sfxBus, send = 0, vib = 0, vibRate = 6, detune = 0, curve = 'exp' } = {}) {
  if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0); o.detune.value = detune;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f * slide), t0 + dur);
  if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vibRate; lg.gain.setValueAtTime(0, t0); lg.gain.linearRampToValueAtTime(f * vib, t0 + Math.min(0.25, dur * 0.4)); l.connect(lg); lg.connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
  env(g, t0, vol, attack, dur, curve);
  o.connect(g); g.connect(out); sendTo(g, send);
  o.start(t0); o.stop(t0 + dur + 0.05);
  return o;
}
function noise(t0, dur, { vol = 0.3, f = 2000, q = 1, type = 'bandpass', slide = 0, out = sfxBus, attack = 0.002, send = 0, rate = 1, curve = 'exp' } = {}) {
  if (!ctx) return;
  const s = ctx.createBufferSource(); s.buffer = nb(); s.playbackRate.value = rate * (0.85 + Math.random() * 0.3);
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t0); fl.Q.value = q;
  if (slide) fl.frequency.exponentialRampToValueAtTime(Math.max(40, f * slide), t0 + dur);
  const g = ctx.createGain(); env(g, t0, vol, attack, dur, curve);
  s.connect(fl); fl.connect(g); g.connect(out); sendTo(g, send);
  s.start(t0, Math.random() * 1.5); s.stop(t0 + dur + 0.05);
}
// Karplus-Strong plucked string, cached per note
const ksCache = new Map();
function ksBuffer(m, bright = 0.5, dur = 1.6) {
  const key = m + ':' + bright + ':' + dur;
  if (ksCache.has(key)) return ksCache.get(key);
  const sr = ctx.sampleRate, n = Math.floor(sr * dur), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
  const f = midi(m), N = Math.max(2, Math.round(sr / f)), ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = (Math.random() * 2 - 1) * (1 - bright * 0.5) + (i < N / 2 ? bright : -bright) * 0.5;
  const decay = 0.996 - (1 - bright) * 0.004 + Math.min(0.003, f / 200000);
  let p = 0, last = 0;
  for (let i = 0; i < n; i++) { const cur = ring[p], nxt = ring[(p + 1) % N]; const v = (cur + nxt) * 0.5 * decay; ring[p] = v; d[i] = cur; last = v; p = (p + 1) % N; }
  void last;
  ksCache.set(key, buf);
  return buf;
}
function pluck(m, t, { vol = 0.3, out = sfxBus, bright = 0.5, dur = 1.6, send = 0.2, bend = 0 } = {}) {
  if (!ctx) return;
  const s = ctx.createBufferSource(); s.buffer = ksBuffer(Math.round(m), bright, dur);
  if (bend) { s.playbackRate.setValueAtTime(Math.pow(2, -bend / 12), t); s.playbackRate.exponentialRampToValueAtTime(1, t + 0.12); }
  const g = ctx.createGain(); g.gain.value = vol;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
  s.connect(hp); hp.connect(g); g.connect(out); sendTo(g, send);
  s.start(t); s.stop(t + dur);
}
// positional: a gain/pan/lowpass chain for a world position relative to the listener
let listener = { x: 0, y: 0, z: 0, rx: 1, rz: 0 };
export function setListener(x, y, z, yaw) { listener = { x, y, z, rx: Math.cos(yaw), rz: -Math.sin(yaw) }; }
function at(pos, base = 1, reach = 7, bus = sfxBus) {
  if (!ctx) return null;
  if (!pos) { if (base === 1) return bus; const g = ctx.createGain(); g.gain.value = base; g.connect(bus); setTimeout(() => { try { g.disconnect(); } catch { } }, 4000); return g; }
  const dx = pos[0] - listener.x, dy = pos[1] - listener.y, dz = pos[2] - listener.z, d = Math.hypot(dx, dy, dz);
  const g = ctx.createGain(); g.gain.value = base / (1 + d / reach);
  const p = ctx.createStereoPanner(); p.pan.value = d > 0.1 ? Math.max(-1, Math.min(1, (dx * listener.rx + dz * listener.rz) / d)) * 0.9 : 0;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 18000 / (1 + d / 12);
  g.connect(lp); lp.connect(p); p.connect(bus);
  setTimeout(() => { try { g.disconnect(); lp.disconnect(); p.disconnect(); } catch { } }, 4000);
  return g;
}
const distTo = pos => pos ? Math.hypot(pos[0] - listener.x, pos[2] - listener.z) : 0;

// ------------------------------------------------------------------ instruments (used by the music and a few stingers)
const INST = {
  guitar(m, t, d, v, out) { pluck(m, t, { vol: v * 1.1, out, bright: 0.45, dur: Math.max(1, d + 0.6), send: 0.25 }); },
  oud(m, t, d, v, out) { pluck(m, t, { vol: v * 1.2, out, bright: 0.75, dur: 1.2, send: 0.3, bend: Math.random() < 0.3 ? 1 : 0 }); },
  harp(m, t, d, v, out) { pluck(m, t, { vol: v, out, bright: 0.3, dur: 2.4, send: 0.5 }); },
  flute(m, t, d, v, out) {
    const f = midi(m);
    tone(f, t, d + 0.12, { type: 'sine', vol: v * 0.8, attack: 0.06, out, send: 0.45, vib: 0.012, vibRate: 5.2, curve: 'lin' });
    tone(f * 2, t, d + 0.1, { type: 'sine', vol: v * 0.12, attack: 0.07, out, curve: 'lin' });
    noise(t, Math.min(0.25, d), { f: f * 2, q: 4, vol: v * 0.18, out, attack: 0.03 });
  },
  whistle(m, t, d, v, out) { tone(midi(m), t, d + 0.08, { type: 'sine', vol: v * 0.7, attack: 0.03, out, send: 0.35, vib: 0.02, vibRate: 6.5, curve: 'lin' }); },
  horn(m, t, d, v, out) {
    const f = midi(m), o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = o2.type = 'sawtooth'; o1.frequency.value = f; o2.frequency.value = f; o2.detune.value = 7;
    fl.type = 'lowpass'; fl.Q.value = 1.5; fl.frequency.setValueAtTime(f * 1.2, t); fl.frequency.linearRampToValueAtTime(f * 4, t + 0.08); fl.frequency.exponentialRampToValueAtTime(f * 2.2, t + d);
    env(g, t, v * 0.35, 0.05, d + 0.15, 'lin');
    o1.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out); sendTo(g, 0.4);
    for (const o of [o1, o2]) { o.start(t); o.stop(t + d + 0.2); }
  },
  pad(m, t, d, v, out) {
    const f = midi(m), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = 'lowpass'; fl.frequency.value = Math.min(2400, f * 5); fl.Q.value = 0.5;
    env(g, t, v * 0.16, Math.min(0.8, d * 0.4), d + 0.6, 'lin');
    fl.connect(g); g.connect(out); sendTo(g, 0.6);
    for (const dt of [-9, 0, 8]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; o.connect(fl); o.start(t); o.stop(t + d + 0.7); }
  },
  piano(m, t, d, v, out) {
    const f = midi(m), g = ctx.createGain(); g.connect(out); sendTo(g, 0.35);
    g.gain.value = 1;
    [[1, 1, 1.6], [2, 0.4, 0.9], [3, 0.18, 0.6], [4.01, 0.08, 0.35]].forEach(([k, a, dd]) => tone(f * k, t, Math.max(0.4, dd * (1.4 - m / 120)), { type: 'sine', vol: v * a * 0.5, out: g, attack: 0.003 }));
    noise(t, 0.02, { f: 2500, q: 1, vol: v * 0.08, out: g });
  },
  marimba(m, t, d, v, out) { const f = midi(m); tone(f, t, 0.5, { type: 'sine', vol: v * 0.7, out, send: 0.3 }); tone(f * 4, t, 0.06, { type: 'sine', vol: v * 0.2, out }); tone(f * 10, t, 0.02, { type: 'sine', vol: v * 0.05, out }); },
  kalimba(m, t, d, v, out) { const f = midi(m); tone(f, t, 1.1, { type: 'sine', vol: v * 0.6, out, send: 0.5 }); tone(f * 5.95, t, 0.12, { type: 'sine', vol: v * 0.12, out }); },
  bell(m, t, d, v, out) { const f = midi(m); tone(f, t, 2.2, { type: 'sine', vol: v * 0.45, out, send: 0.7 }); tone(f * 2.76, t, 1.1, { type: 'sine', vol: v * 0.12, out, send: 0.6 }); tone(f * 5.4, t, 0.5, { type: 'sine', vol: v * 0.05, out }); },
  pizz(m, t, d, v, out) { pluck(m, t, { vol: v, out, bright: 0.2, dur: 0.6, send: 0.3 }); },
  bass(m, t, d, v, out) {
    const f = midi(m), o = ctx.createOscillator(), o2 = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f / 2;
    fl.type = 'lowpass'; fl.frequency.setValueAtTime(900, t); fl.frequency.exponentialRampToValueAtTime(200, t + d);
    env(g, t, v * 0.5, 0.008, d + 0.1);
    o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out);
    for (const x of [o, o2]) { x.start(t); x.stop(t + d + 0.15); }
  },
  synthbass(m, t, d, v, out) {
    const f = midi(m), o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.Q.value = 7; fl.frequency.setValueAtTime(1400, t); fl.frequency.exponentialRampToValueAtTime(160, t + d);
    env(g, t, v * 0.32, 0.005, d + 0.05); o.connect(fl); fl.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.1);
  },
  brass(m, t, d, v, out) { INST.horn(m, t, d, v * 1.2, out); INST.horn(m + 12, t, d, v * 0.4, out); },
};
// drums
const DRUM = {
  k(t, v, out) { tone(150, t, 0.28, { vol: v * 0.9, slide: 0.3, out }); noise(t, 0.012, { f: 3500, vol: v * 0.15, out }); },
  s(t, v, out) { noise(t, 0.16, { f: 1900, q: 0.7, vol: v * 0.45, out, send: 0.25 }); tone(200, t, 0.08, { vol: v * 0.22, type: 'triangle', out }); },
  brush(t, v, out) { noise(t, 0.12, { f: 4200, q: 0.6, vol: v * 0.2, out, attack: 0.02 }); },
  h(t, v, out) { noise(t, 0.03, { f: 9000, type: 'highpass', vol: v * 0.12, out }); },
  o(t, v, out) { noise(t, 0.18, { f: 8000, type: 'highpass', vol: v * 0.1, out }); },
  sh(t, v, out) { noise(t, 0.06, { f: 6500, q: 1.2, vol: v * 0.12, out, attack: 0.015 }); },
  dum(t, v, out) { tone(110, t, 0.35, { vol: v * 0.8, slide: 0.55, out, send: 0.2 }); noise(t, 0.05, { f: 400, vol: v * 0.2, out }); },
  tek(t, v, out) { noise(t, 0.05, { f: 3200, q: 3, vol: v * 0.35, out, send: 0.15 }); tone(620, t, 0.04, { vol: v * 0.12, out }); },
  taiko(t, v, out) { tone(95, t, 0.9, { vol: v * 1.1, slide: 0.45, out, send: 0.55 }); noise(t, 0.25, { f: 180, type: 'lowpass', vol: v * 0.5, out }); },
  rim(t, v, out) { noise(t, 0.02, { f: 2600, q: 8, vol: v * 0.3, out }); tone(1700, t, 0.02, { vol: v * 0.1, out }); },
  tim(t, v, out) { tone(82, t, 1.1, { vol: v * 0.7, slide: 0.9, out, send: 0.5 }); noise(t, 0.3, { f: 200, type: 'lowpass', vol: v * 0.25, out }); },
  clap(t, v, out) { for (let i = 0; i < 3; i++) noise(t + i * 0.011, 0.09, { f: 1400, q: 1, vol: v * 0.3, out, send: 0.3 }); },
};

// ------------------------------------------------------------------ googly voices: little formant squeaks
function voice(pos, pitch, pattern, vol = 0.12) {
  if (!ctx) return; const t = now(), o = at(pos, vol * 10, 8);
  for (const [dt, f0, f1, dur, vowel] of pattern) {
    const osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0 * pitch, t + dt); osc.frequency.exponentialRampToValueAtTime(f1 * pitch, t + dt + dur);
    const formants = { a: [800, 1200], e: [500, 1900], i: [300, 2300], o: [500, 900], u: [350, 700] }[vowel || 'a'];
    env(g, t + dt, 0.45, 0.015, dur);
    osc.connect(g);
    for (const ff of formants) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff * (0.9 + pitch * 0.1); bp.Q.value = 6; g.connect(bp); bp.connect(o); }
    osc.start(t + dt); osc.stop(t + dt + dur + 0.05);
  }
}
const pitchOf = id => 0.85 + ((id * 37) % 10) / 20;

// ------------------------------------------------------------------ sound effects

// ------------------------------------------------------------------ more instruments
INST.vibes = (m, t, d, v, out) => { const f = midi(m); tone(f, t, 1.6, { type: 'sine', vol: v * 0.55, out, send: 0.45, vib: 0.004, vibRate: 5.5 }); tone(f * 4, t, 0.3, { type: 'sine', vol: v * 0.08, out, send: 0.3 }); tone(f * 10.2, t, 0.05, { type: 'sine', vol: v * 0.03, out }); };
INST.mute = (m, t, d, v, out) => {
  const f = midi(m), o = ctx.createOscillator(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(f * 0.985, t); o.frequency.linearRampToValueAtTime(f, t + 0.05);
  bp.type = 'bandpass'; bp.frequency.value = f * 2.2; bp.Q.value = 2.2;
  env(g, t, v * 0.42, 0.03, d + 0.1, 'lin'); o.connect(bp); bp.connect(g); g.connect(out); sendTo(g, 0.35); o.start(t); o.stop(t + d + 0.15);
};
INST.stab = (m, t, d, v, out) => { for (const iv of [0, 7, 12, 15]) INST.horn(m + iv, t, Math.min(0.18, d), v * 0.7, out); };
INST.organ = (m, t, d, v, out) => { const f = midi(m); for (const [k, a] of [[1, 0.5], [2, 0.3], [3, 0.15], [4, 0.1]]) tone(f * k, t, d + 0.05, { type: 'sine', vol: v * a * 0.35, out, attack: 0.01, curve: 'lin', send: 0.25 }); };
INST.saw = (m, t, d, v, out) => {
  const f = midi(m), fl = ctx.createBiquadFilter(), g = ctx.createGain();
  fl.type = 'lowpass'; fl.Q.value = 2; fl.frequency.setValueAtTime(f * 6, t); fl.frequency.exponentialRampToValueAtTime(f * 2.5, t + d + 0.1);
  env(g, t, v * 0.22, 0.01, d + 0.08, 'lin'); fl.connect(g); g.connect(out); sendTo(g, 0.35);
  for (const dt of [-8, 8]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; o.connect(fl); o.start(t); o.stop(t + d + 0.15); }
};
INST.rhodes = (m, t, d, v, out) => { const f = midi(m); tone(f, t, Math.max(0.8, d + 0.4), { type: 'sine', vol: v * 0.6, out, send: 0.3, vib: 0.003, vibRate: 4.5 }); tone(f * 2, t, 0.35, { type: 'sine', vol: v * 0.14, out }); tone(f * 7.1, t, 0.04, { type: 'sine', vol: v * 0.05, out }); };
INST.glock = (m, t, d, v, out) => { const f = midi(m); tone(f, t, 0.9, { type: 'sine', vol: v * 0.5, out, send: 0.4 }); tone(f * 2.76, t, 0.25, { type: 'sine', vol: v * 0.12, out }); tone(f * 5.4, t, 0.08, { type: 'sine', vol: v * 0.05, out }); };
INST.arpsynth = (m, t, d, v, out) => { const f = midi(m), o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 8, t); fl.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.15); env(g, t, v * 0.12, 0.004, Math.max(0.12, d)); o.connect(fl); fl.connect(g); g.connect(out); sendTo(g, 0.3); o.start(t); o.stop(t + d + 0.2); };
DRUM.r = (t, v, out) => { for (let i = 0; i < 3; i++) noise(t + i * 0.028, 0.05, { f: 2600, q: 0.8, vol: v * 0.3, out }); };
DRUM.sn = (t, v, out) => { noise(t, 0.12, { f: 2800, q: 0.9, vol: v * 0.5, out, send: 0.2 }); tone(240, t, 0.05, { vol: v * 0.2, type: 'triangle', out }); };
DRUM.tick = (t, v, out) => { tone(3100, t, 0.015, { type: 'square', vol: v * 0.03, out }); };

// ------------------------------------------------------------------ the songs
// chords: one per bar as [root semitone, quality]; mel: 8 notes a bar (semitones above root+24, '.' rest, '-' hold);
// drum patterns are 16 steps a bar; form plays the sections in order and loops.
const Q = { M: [0, 4, 7], m: [0, 3, 7], M7: [0, 4, 7, 11], m7: [0, 3, 7, 10], D7: [0, 4, 7, 10], s4: [0, 5, 7], m6: [0, 3, 7, 9], dim: [0, 3, 6, 9], M9: [0, 4, 7, 14], add9: [0, 4, 7, 14], M6: [0, 4, 7, 9] };
const mel = s => s.trim().split(/\s+/).map(x => x === '.' ? null : x === '-' ? '-' : +x);
const SONGS = {
  // the theme: bright pop-rock, strummed guitars, a glockenspiel hook
  menu: {
    bpm: 116, root: 43, swing: 0, lead: 'glock', comp: 'guitar', bass: 'bass', bassPat: 'eight', kit: { k: 'x.....x.x.......', sn: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, comp_pat: 'strum', form: 'AABA',
    A: { chords: [[0, 'M'], [7, 'M'], [9, 'm'], [5, 'M']], mel: mel('7 - 9 7 4 - 2 4  7 - 11 12 14 - 12 .  16 - 14 12 11 - 9 -  12 - 9 7 5 - . .') },
    B: { chords: [[5, 'M'], [7, 'M'], [4, 'm'], [9, 'm']], mel: mel('9 - 12 - 17 - 16 14  14 - 12 11 - 7 - .  11 - 12 14 - 16 - 12  16 - - - 14 - 11 -') },
  },
  // the hallway: a lo-fi boom-bap shuffle with a warm electric piano
  hall: {
    bpm: 88, root: 41, swing: 0.2, lead: 'mute', comp: 'rhodes', bass: 'bass', bassPat: 'hop', kit: { k: 'x.......x.x.....', sn: '....x.......x...', h: 'x.x.x.x.x.x.x.x.', sh: '..x...x...x...x.' }, comp_pat: 'block', form: 'AB',
    A: { chords: [[2, 'm7'], [7, 'D7'], [0, 'M7'], [9, 'm7']], mel: mel('14 . 12 . 9 - . .  . . 10 12 14 - 12 .  11 - . . 7 . 9 .  12 - - - . . . .') },
    B: { chords: [[5, 'M7'], [4, 'm7'], [2, 'm7'], [7, 'D7']], mel: mel('9 - 12 - 16 . 14 .  12 - . . 11 12 14 .  16 - 14 - 12 . 9 .  11 - - - 7 . . .') },
  },
  // in class: soft and thinking, a kalimba over a pad
  class: {
    bpm: 72, root: 45, swing: 0, lead: 'kalimba', comp: 'piano', bass: 'bass', bassPat: 'whole', pad: true, kit: { brush: '....x.......x...', tick: 'x.x.x.x.x.x.x.x.' }, comp_pat: 'arp', form: 'AB',
    A: { chords: [[0, 'M7'], [5, 'M7'], [2, 'm7'], [7, 's4']], mel: mel('16 . . . 12 . . .  . . 14 . . . 9 .  12 . . . . . 14 .  11 . . . . . . .') },
    B: { chords: [[9, 'm7'], [5, 'M7'], [0, 'M7'], [7, 'M']], mel: mel('. . 12 . 16 . . .  17 . . . 16 . 12 .  14 . . . 12 . . .  11 . . . . . . .') },
  },
  // tests and pop quizzes: a ticking, nervous string ostinato
  test: {
    bpm: 104, root: 38, swing: 0, lead: 'flute', comp: 'pizz', bass: 'bass', bassPat: 'whole', kit: { tick: 'x.x.x.x.x.x.x.x.', k: 'x.......x.......' }, comp_pat: 'ostinato', form: 'A',
    A: { chords: [[0, 'm'], [-2, 'M'], [-4, 'M'], [-5, 'D7']], mel: mel('. . . . 12 - 15 -  14 - . . . . . .  . . . . 8 - 10 -  11 - - - . . . .') },
  },
  // lunch: cafeteria funk — slap-ish synth bass, claps and horn stabs
  lunch: {
    bpm: 108, root: 40, swing: 0.08, lead: 'brass', comp: 'rhodes', bass: 'synthbass', bassPat: 'sixteen', kit: { k: 'x..x..x...x..x..', clap: '....x.......x...', h: 'xxxxxxxxxxxxxxxx' }, comp_pat: 'stabs', form: 'AB',
    A: { chords: [[0, 'm7'], [0, 'm7'], [5, 'D7'], [5, 'D7']], mel: mel('12 . 15 . 17 . 15 12  . . 10 12 - . . .  17 . 19 . 17 15 12 .  10 - 12 - . . . .') },
    B: { chords: [[3, 'M7'], [5, 'D7'], [7, 'm7'], [10, 'D7']], mel: mel('19 - 17 - 15 - 12 -  15 - - - . 12 15 17  19 . 22 . 19 . 17 .  15 - - - 12 - - -') },
  },
  // after school: easy guitar and a whistled tune
  after: {
    bpm: 92, root: 43, swing: 0.12, lead: 'whistle', comp: 'guitar', bass: 'bass', bassPat: 'walk2', kit: { k: 'x.......x.......', brush: '....x.......x...', sh: 'x.x.x.x.x.x.x.x.' }, comp_pat: 'strum', form: 'AB',
    A: { chords: [[0, 'M7'], [4, 'm7'], [9, 'm7'], [5, 'M7']], mel: mel('11 - 12 - 14 - 16 -  14 - - - 11 - . .  12 - 9 - 7 - 9 -  12 - - - . . . .') },
    B: { chords: [[5, 'M7'], [7, 'D7'], [4, 'm7'], [9, 'm7']], mel: mel('9 - 12 - 17 - 16 -  14 - 12 - 11 - . .  11 - 12 - 14 - 12 -  16 - - - . . . .') },
  },
  // the principal's office: slow, low and ominous
  trouble: {
    bpm: 64, root: 36, swing: 0, lead: 'horn', comp: 'piano', bass: 'bass', bassPat: 'whole', kit: { tim: 'x...............', tick: 'x...x...x...x...' }, comp_pat: 'block', form: 'A',
    A: { chords: [[0, 'm'], [8, 'M'], [5, 'm'], [7, 'D7']], mel: mel('12 - - - 11 - - -  12 - - - 15 - - -  17 - - - 15 - 12 -  11 - - - - - . .') },
  },
  // the homecoming dance: four-on-the-floor synth-pop
  dance: {
    bpm: 124, root: 45, swing: 0, lead: 'saw', comp: 'arpsynth', bass: 'synthbass', bassPat: 'octave', kit: { k: 'x...x...x...x...', clap: '....x.......x...', o: '..x...x...x...x.', h: 'x.x.x.x.x.x.x.x.' }, comp_pat: 'arp16', pad: true, form: 'AABB',
    A: { chords: [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], mel: mel('12 . 12 . 15 . 12 .  17 - 15 - 12 . 10 .  12 . 12 . 15 . 17 .  19 - 17 - 15 - . .') },
    B: { chords: [[5, 'm'], [3, 'M'], [8, 'M'], [10, 'M']], mel: mel('20 - 19 - 17 - 15 -  15 - 17 - 19 - . .  20 - 22 - 24 - 22 -  19 - - - 17 - . .') },
  },
  // prom: a slow dance
  prom: {
    bpm: 68, root: 41, swing: 0, lead: 'bell', comp: 'piano', bass: 'bass', bassPat: 'whole', pad: true, kit: { k: 'x.......x.......', brush: '....x.......x...' }, comp_pat: 'arp', form: 'AB',
    A: { chords: [[0, 'M7'], [9, 'm7'], [2, 'm7'], [7, 'D7']], mel: mel('16 - - - 14 - 12 -  12 - - - 9 - - -  14 - - - 12 - 10 -  11 - - - - - . .') },
    B: { chords: [[5, 'M7'], [4, 'm7'], [2, 'm7'], [7, 's4']], mel: mel('17 - - - 16 - 14 -  16 - - - 12 - - -  14 - 16 - 17 - 19 -  19 - - - - - . .') },
  },
  // the big game: a marching band drumline and a fight song
  game: {
    bpm: 132, root: 46, swing: 0, lead: 'brass', comp: 'brass', bass: 'bass', bassPat: 'four', kit: { k: 'x...x...x...x...', sn: 'x.x.x.xxx.x.x.x.', r: '..............x.', clap: '....x.......x...' }, comp_pat: 'stabs', form: 'AB',
    A: { chords: [[0, 'M'], [5, 'M'], [7, 'D7'], [0, 'M']], mel: mel('12 - 12 - 16 - 19 -  17 - 16 - 14 - . .  14 - 14 - 17 - 19 -  19 - 16 - 12 - . .') },
    B: { chords: [[5, 'M'], [0, 'M'], [2, 'm'], [7, 'D7']], mel: mel('17 - - - 21 - 19 17  16 - - - 19 - 16 12  14 - 16 - 17 - 19 -  21 - - - 19 - . .') },
  },
  // graduation: a slow, proud processional with organ and brass
  grad: {
    bpm: 66, root: 43, swing: 0, lead: 'brass', comp: 'organ', bass: 'bass', bassPat: 'whole', pad: true, kit: { tim: 'x.......x.......' }, comp_pat: 'block', form: 'AAB',
    A: { chords: [[0, 'M'], [5, 'M'], [7, 'M'], [0, 'M']], mel: mel('16 - - 14 12 - 14 -  17 - - - 16 - - -  14 - - 12 11 - 12 -  12 - - - - - . .') },
    B: { chords: [[9, 'm'], [4, 'm'], [5, 'M'], [7, 'D7']], mel: mel('19 - - 17 16 - 14 -  16 - - - 12 - - -  17 - 16 - 14 - 12 -  14 - - - - - . .') },
  },
  // night at home: a music box
  night: {
    bpm: 80, root: 48, swing: 0, lead: 'kalimba', comp: 'glock', bass: 'bass', bassPat: 'whole', pad: true, kit: {}, comp_pat: 'arp', form: 'A',
    A: { chords: [[0, 'M'], [9, 'm'], [5, 'M'], [7, 'M']], mel: mel('12 - 16 - 19 - 16 -  12 - 16 - 21 - - -  17 - 16 - 14 - 12 -  11 - 14 - 19 - - -') },
  },
  // sad: expelled / didn't graduate
  sad: {
    bpm: 60, root: 38, swing: 0, lead: 'piano', comp: 'piano', bass: 'bass', bassPat: 'whole', pad: true, kit: {}, comp_pat: 'block', form: 'A',
    A: { chords: [[0, 'm'], [-4, 'M'], [-7, 'M'], [-5, 'D7']], mel: mel('15 - - - 14 - 12 -  12 - - - 10 - - -  8 - - - 7 - 5 -  7 - - - - - . .') },
  },
};
const VOICE_VOL = { mute: 0.22, vibes: 0.26, bell: 0.26, piano: 0.3, brass: 0.14, horn: 0.2, glock: 0.3, whistle: 0.2, kalimba: 0.32, saw: 0.22, flute: 0.26 };
export const SONG_NAMES = Object.keys(SONGS);

export const music = {
  song: 'menu', step: 0, next: 0, gain: null, started: false, duck: 1,
  start() { if (this.started) return; this.started = true; this.newGain(0.4); this.tick(); },
  newGain(fade) {
    const g = ctx.createGain(); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(1, ctx.currentTime + fade); g.connect(musicBus);
    if (this.gain) { const old = this.gain; old.gain.cancelScheduledValues(ctx.currentTime); old.gain.setValueAtTime(old.gain.value, ctx.currentTime); old.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.4); setTimeout(() => { try { old.disconnect(); } catch { } }, 2500); }
    this.gain = g;
  },
  play(name) {
    if (this.song === name) return;
    this.song = name; this.step = 0;
    if (ctx && this.started) { this.newGain(['test', 'trouble', 'game', 'dance'].includes(name) ? 0.5 : 1.6); this.next = ctx.currentTime + 0.1; }
  },
  tick() { if (!ctx) return; if (ctx.state === 'running') this.fill(ctx.currentTime + 0.2); setTimeout(() => this.tick(), 50); },
  fill(until) {
    const S = SONGS[this.song] || SONGS.menu, spb = 60 / S.bpm / 4, out = this.gain;
    if (this.next < ctx.currentTime - 0.5) this.next = ctx.currentTime + 0.05;
    while (this.next < until) {
      const step = this.step, s = step % 16, bar = Math.floor(step / 16), secIdx = Math.floor(bar / 4) % S.form.length, sec = S[S.form[secIdx]], b4 = bar % 4;
      const [cr, cq] = sec.chords[b4], chord = Q[cq], root = S.root + cr;
      const t = this.next + (s % 2 ? spb * S.swing : 0);
      for (const k in S.kit) { const p = S.kit[k]; if (p[s] === 'x') DRUM[k](t, (s % 4 === 0 ? 1 : 0.72) * (0.9 + Math.random() * 0.2), out); }
      // bass
      const B = INST[S.bass], bp = S.bassPat;
      if (bp === 'walk') { if (s % 4 === 0) { const seq = [0, chord[1], chord[2], (chord[3] ?? 12) - 1]; B(root - 12 + seq[s / 4], t, spb * 3.6, 0.8, out); } }
      else if (bp === 'walk2') { if (s % 8 === 0) B(root - 12 + (s ? chord[2] : 0), t, spb * 7, 0.8, out); }
      else if (bp === 'sixteen') { if (s % 2 === 0) B(root - 12 + (s % 8 === 6 ? 12 : s === 14 ? 7 : 0), t, spb * 1.6, s % 4 === 0 ? 0.9 : 0.6, out); }
      else if (bp === 'eight') { if (s % 2 === 0) B(root - 12 + (s === 14 ? 7 : 0), t, spb * 1.8, s % 4 === 0 ? 0.85 : 0.6, out); }
      else if (bp === 'octave') { if (s % 2 === 0) B(root - 12 + (s % 4 === 2 ? 12 : 0), t, spb * 1.6, 0.75, out); }
      else if (bp === 'four') { if (s % 4 === 0) B(root - 12 + (s === 8 ? 7 : 0), t, spb * 3.4, 0.85, out); }
      else if (bp === 'whole') { if (s === 0) B(root - 12, t, spb * 15, 0.8, out); }
      else if (bp === 'hop') { if (s === 0 || s === 7 || s === 10) B(root - 12 + (s === 10 ? 7 : 0), t, spb * (s === 0 ? 6 : 3), s === 0 ? 0.9 : 0.6, out); }
      const pat = S.comp_pat, comp = S.comp;
      if (pat === 'ostinato' && s % 2 === 0) { const seq = [0, 0, 7, 0, 3, 0, 7, 12]; INST.pizz(root + seq[(s / 2) % 8], t, spb * 2, 0.32, out); }
      if (pat === 'block' && (s === 0 || s === 10)) chord.forEach((iv, i) => INST[comp](root + 12 + iv, t + i * 0.015, spb * 6, 0.09, out));
      if (pat === 'stabs' && (s === 3 || s === 6 || s === 11) && bar % 2 === 0) chord.forEach(iv => INST[comp === 'brass' ? 'horn' : comp](root + 12 + iv, t, spb * 1.5, comp === 'brass' ? 0.16 : 0.1, out));
      if (pat === 'strum' && (s === 0 || s === 3 || s === 6 || s === 10 || s === 12)) chord.forEach((iv, i) => INST[comp](root + 12 + iv, t + i * 0.012, spb * 3, s === 0 ? 0.12 : 0.08, out));
      if (pat === 'arp' && s % 2 === 0) { const seq = [0, 1, 2, 1, 3 % chord.length, 2, 1, 2]; INST[comp](root + 12 + chord[seq[(s / 2) % 8] % chord.length] + (s >= 8 ? 12 : 0), t, spb * 2, 0.12, out); }
      if (pat === 'arp16') { const seq = [0, 1, 2, 1]; INST[comp](root + 24 + chord[seq[s % 4]] + (s % 8 >= 4 ? 12 : 0), t, spb * 0.9, 0.5, out); }
      if (S.pad && s === 0) chord.forEach(iv => INST.pad(root + 12 + iv, t, spb * 16, 0.26, out));
      if (s % 2 === 0) {
        const mi = b4 * 8 + s / 2, note = sec.mel[mi];
        if (note !== null && note !== '-' && note !== undefined) {
          let len = 1; while (sec.mel[mi + len] === '-' && (mi + len) % 8 !== 0) len++;
          INST[S.lead](S.root + 24 + note, t, spb * 2 * len - 0.02, VOICE_VOL[S.lead] || 0.22, out);
        }
      }
      this.next += spb; this.step++;
    }
  },
};

// ------------------------------------------------------------------ ambience: hallway chatter, the fluorescent hum, birds and
// wind outside, cafeteria clatter, the gym, the fire alarm and the bus. Persistent nodes (no feedback anywhere).
function loopNoise(f, q, type = 'bandpass', rate = 1) {
  const s = ctx.createBufferSource(); s.buffer = nb(); s.loop = true; s.playbackRate.value = rate;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); s.start();
  return { s, fl, g };
}
function voiceTo(out, pitch, pattern, vol) {
  const t = now();
  for (const [dt, f0, f1, dur, vowel] of pattern) {
    const osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f0 * pitch, t + dt); osc.frequency.exponentialRampToValueAtTime(f1 * pitch, t + dt + dur);
    const formants = { a: [800, 1200], e: [500, 1900], i: [300, 2300], o: [500, 900], u: [350, 700] }[vowel || 'a'];
    env(g, t + dt, vol * 3, 0.015, dur); osc.connect(g);
    for (const ff of formants) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = 6; g.connect(bp); bp.connect(out); }
    osc.start(t + dt); osc.stop(t + dt + dur + 0.05);
  }
}
const babble = (n, base = 240) => { const pat = [], vs = 'aeiou'; let tt = 0; for (let i = 0; i < n; i++) { const f = rnd(base * 0.8, base * 1.3), d = rnd(0.07, 0.14); pat.push([tt, f, f * rnd(0.8, 1.2), d, vs[Math.random() * 5 | 0]]); tt += d + rnd(0.01, 0.06); } return pat; };
export const ambience = {
  loops: null, babbleT: 1, birdT: 2, clatterT: 1, squeakT: 2, alarmT: 0, crowdT: 0,
  start() {
    if (!ctx || this.loops) return;
    const L = this.loops = {};
    L.murmur = loopNoise(480, 0.9); L.murmur.g.connect(ambBus);
    L.room = loopNoise(300, 0.5, 'lowpass', 0.6); L.room.g.connect(ambBus);
    L.wind = loopNoise(260, 0.4, 'lowpass', 0.5); L.wind.g.connect(ambBus);
    L.hum = ctx.createGain(); L.hum.gain.value = 0; L.hum.connect(ambBus);
    for (const [f, a] of [[120, 1], [240, 0.35], [360, 0.12]]) { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = a * 0.012; o.connect(g); g.connect(L.hum); o.start(); }
    L.crowd = loopNoise(700, 0.6); L.crowd.g.connect(ambBus);
    // the bus engine: a low diesel rumble
    L.busG = ctx.createGain(); L.busG.gain.value = 0; L.busG.connect(ambBus);
    const bo = ctx.createOscillator(); bo.type = 'sawtooth'; bo.frequency.value = 38; const bf = ctx.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = 180; bo.connect(bf); bf.connect(L.busG); bo.start(); L.busOsc = bo;
    const bn = loopNoise(120, 0.8, 'lowpass', 0.6); bn.g.gain.value = 0.6; bn.g.connect(L.busG);
  },
  /** s: { where: 'hall'|'class'|'cafeteria'|'gym'|'outside'|'library'|'office'|'menu', people (nearby), crowd 0..1, alarm, bus 0..1 (loudness), busRev } */
  update(dt, s) {
    if (!ctx || !this.loops) return;
    const L = this.loops, t = ctx.currentTime, set = (g, v, k = 0.4) => g.gain.setTargetAtTime(v, t, k);
    const w = s.where, indoor = w !== 'outside' && w !== 'menu';
    const busy = Math.min(1, (s.people || 0) / 14);
    set(L.murmur.g, w === 'menu' ? 0.015 : w === 'cafeteria' ? 0.05 + busy * 0.07 : w === 'hall' ? 0.02 + busy * 0.07 : w === 'gym' ? 0.02 + busy * 0.05 : w === 'class' ? 0.006 : w === 'outside' ? 0.01 + busy * 0.02 : 0.005);
    L.murmur.fl.frequency.setTargetAtTime(w === 'gym' ? 620 : 480, t, 0.5);
    set(L.room.g, indoor ? 0.02 : 0);
    set(L.hum, indoor && w !== 'gym' ? 1 : 0.2);
    set(L.wind.g, w === 'outside' || w === 'menu' ? 0.05 : 0.008);
    ambFilter.frequency.setTargetAtTime(indoor ? 9000 : 18000, t, 0.3);
    set(L.crowd.g, (s.crowd || 0) * 0.12, 0.6);
    set(L.busG, Math.min(0.3, (s.bus || 0) * 0.3), 0.3);
    L.busOsc.frequency.setTargetAtTime(34 + (s.busRev || 0) * 26, t, 0.3);
    // chatter: little googly voices all around
    this.babbleT -= dt;
    if (this.babbleT <= 0 && (s.people || 0) > 1 && w !== 'class' && !s.alarm) {
      this.babbleT = rnd(0.3, 1.6) / (0.4 + busy);
      const pan = ctx.createStereoPanner(); pan.pan.value = rnd(-0.9, 0.9); const g = ctx.createGain(); g.gain.value = w === 'cafeteria' ? 0.4 : 0.28; g.connect(pan); pan.connect(ambBus);
      voiceTo(g, rnd(0.8, 1.35), babble(3 + Math.floor(Math.random() * 6)), 0.04);
      if (Math.random() < 0.05) { const g2 = ctx.createGain(); g2.gain.value = 0.3; g2.connect(ambBus); laughTo(g2, rnd(0.9, 1.3)); }
    }
    this.birdT -= dt;
    if ((w === 'outside' || w === 'menu') && this.birdT <= 0) { this.birdT = rnd(1.2, 4); const pan = ctx.createStereoPanner(); pan.pan.value = rnd(-0.9, 0.9); pan.connect(ambBus); const f = rnd(2600, 4200), n = 2 + Math.floor(Math.random() * 4); for (let i = 0; i < n; i++) tone(f * rnd(0.9, 1.15), t + i * 0.11, 0.08, { vol: 0.02, slide: rnd(0.7, 1.4), out: pan }); }
    this.clatterT -= dt;
    if (w === 'cafeteria' && this.clatterT <= 0) { this.clatterT = rnd(0.4, 1.8); const pan = ctx.createStereoPanner(); pan.pan.value = rnd(-0.9, 0.9); pan.connect(ambBus); tone(rnd(1800, 3200), t, 0.12, { type: 'triangle', vol: 0.02, out: pan }); noise(t, 0.04, { f: 4000, q: 2, vol: 0.03, out: pan }); }
    this.squeakT -= dt;
    if (w === 'gym' && (s.people || 0) > 3 && this.squeakT <= 0) { this.squeakT = rnd(0.3, 1.4); const pan = ctx.createStereoPanner(); pan.pan.value = rnd(-0.9, 0.9); pan.connect(ambBus); if (Math.random() < 0.5) tone(rnd(1800, 2600), t, 0.07, { type: 'sawtooth', vol: 0.012, slide: 1.3, out: pan }); else { const o = pan; tone(140, t, 0.1, { vol: 0.06, slide: 0.6, out: o }); noise(t, 0.03, { f: 900, vol: 0.03, out: o, send: 0.3 }); } }
    // the fire alarm: a loud horn in threes, with the strobes
    if (s.alarm) {
      this.alarmT = Math.max(this.alarmT, t);
      while (this.alarmT < t + 0.2) { const cyc = Math.floor((this.alarmT * 2) % 4); if (cyc < 3) { tone(3100, this.alarmT, 0.35, { type: 'square', vol: 0.018, out: ambBus, curve: 'lin' }); tone(1550, this.alarmT, 0.35, { type: 'square', vol: 0.02, out: ambBus, curve: 'lin' }); } this.alarmT += 0.5; }
    }
    if (s.crowd > 0.5) { this.crowdT -= dt; if (this.crowdT <= 0) { this.crowdT = rnd(0.2, 0.7); const g = ctx.createGain(); g.gain.value = 0.25; const pan = ctx.createStereoPanner(); pan.pan.value = rnd(-0.9, 0.9); g.connect(pan); pan.connect(ambBus); voiceTo(g, rnd(0.9, 1.4), [[0, 300, 420, 0.3, 'e'], [0.3, 420, 380, 0.3, 'o']], 0.04); } }
  },
};
function laughTo(out, p = 1) { const pat = []; for (let i = 0; i < 5; i++) pat.push([i * 0.12, 330 - i * 12, 300 - i * 12, 0.08, i % 2 ? 'a' : 'e']); voiceTo(out, p, pat, 0.05); }

// ------------------------------------------------------------------ googly voices: little formant squeaks
export function talk(pos, pitch = 1, n = 6, vol = 0.12) { if (!ctx) return; const o = at(pos, vol * 8, 8); if (!o) return; voiceTo(o, pitch, babble(n, 260), 0.08); }

// ------------------------------------------------------------------ sound effects
const STEP_SURF = { lino: [2200, 0.13, 0.05], wood: [1500, 0.15, 0.05], carpet: [700, 0.06, 0.07], grass: [900, 0.05, 0.08], asphalt: [1500, 0.1, 0.05], tile: [2600, 0.14, 0.04] };
export const sfx = {
  click() { if (!ctx) return; const t = now(); tone(1800, t, 0.03, { vol: 0.07 }); noise(t, 0.012, { f: 4000, q: 2, vol: 0.05 }); },
  hover() { if (!ctx) return; tone(1400, now(), 0.02, { vol: 0.025 }); },
  nope() { if (!ctx) return; const t = now(); tone(220, t, 0.12, { type: 'square', vol: 0.07 }); tone(180, t + 0.12, 0.2, { type: 'square', vol: 0.07 }); },
  panel(open = true) { if (!ctx) return; noise(now(), 0.18, { f: open ? 900 : 2200, q: 0.8, vol: 0.1, slide: open ? 2.4 : 0.4, attack: 0.03 }); },
  step(pos, v = 1, surf = 'lino') {
    if (!ctx) return; const t = now(), o = at(pos, 0.7 * v, 6), [f, vol, d] = STEP_SURF[surf] || STEP_SURF.lino;
    noise(t, d, { f: f * rnd(0.85, 1.15), q: 1.4, vol: vol * v, out: o, send: surf === 'lino' || surf === 'tile' || surf === 'wood' ? 0.15 : 0.02 }); tone(rnd(90, 130), t, 0.05, { vol: 0.07 * v, out: o });
    if (surf === 'wood' && Math.random() < 0.08) tone(rnd(1900, 2600), t, 0.06, { type: 'sawtooth', vol: 0.01, slide: 1.3, out: o });
  },
  jump(pos) { if (!ctx) return; noise(now(), 0.1, { f: 1400, q: 1, vol: 0.08, out: at(pos, 0.8), slide: 1.6 }); },
  land(v = 1, pos) { if (!ctx) return; const t = now(), o = at(pos, 1); tone(90, t, 0.14, { vol: 0.25 * v, slide: 0.5, out: o }); noise(t, 0.1, { f: 700, vol: 0.18 * v, out: o }); },
  // the school bell: an electric bell hammering away for two seconds
  bell(dur = 2.2, vol = 1) { if (!ctx) return; const t0 = now(); for (let t = t0; t < t0 + dur; t += 0.045) { const v = 0.035 * vol * (t > t0 + dur - 0.3 ? (t0 + dur - t) / 0.3 : 1); tone(1480, t, 0.07, { type: 'triangle', vol: v, send: 0.25 }); tone(2410, t, 0.05, { type: 'sine', vol: v * 0.7 }); tone(3920, t, 0.03, { type: 'sine', vol: v * 0.35 }); noise(t, 0.008, { f: 5200, q: 3, vol: v * 0.6 }); } },
  tardy() { if (!ctx) return; const t = now(); tone(180, t, 0.5, { type: 'square', vol: 0.06 }); tone(185, t, 0.5, { type: 'sawtooth', vol: 0.04 }); },
  pa() { if (!ctx) return; const t = now(); [72, 76, 79].forEach((m, i) => INST.bell(m, t + i * 0.28, 0.4, 0.4, sfxBus)); },
  locker(slam = false, pos) { if (!ctx) return; const t = now(), o = at(pos, 1, 6); if (slam) { noise(t, 0.25, { f: 900, q: 0.8, vol: 0.4, out: o, send: 0.4 }); tone(160, t, 0.3, { type: 'square', vol: 0.06, slide: 0.7, out: o }); tone(620, t, 0.4, { type: 'triangle', vol: 0.05, out: o, send: 0.4 }); } else { noise(t, 0.05, { f: 3200, q: 3, vol: 0.12, out: o }); tone(480, t + 0.06, 0.2, { type: 'triangle', vol: 0.04, out: o }); noise(t + 0.08, 0.2, { f: 1400, q: 1, vol: 0.06, out: o, slide: 0.6 }); } },
  // how a decision lands
  best() { if (!ctx) return; const t = now(); [72, 76, 79, 84, 88].forEach((m, i) => INST.glock(m, t + i * 0.07, 0.3, 0.55, sfxBus)); for (let i = 0; i < 8; i++) tone(rnd(3000, 6000), t + 0.3 + i * 0.04, 0.1, { vol: 0.015, send: 0.5 }); },
  good() { if (!ctx) return; const t = now(); [76, 81].forEach((m, i) => INST.glock(m, t + i * 0.09, 0.3, 0.45, sfxBus)); },
  meh() { if (!ctx) return; const t = now(); INST.marimba(67, t, 0.2, 0.4, sfxBus); INST.marimba(67, t + 0.15, 0.2, 0.3, sfxBus); },
  bad() { if (!ctx) return; const t = now(); tone(midi(58), t, 0.18, { type: 'sawtooth', vol: 0.05 }); tone(midi(55), t + 0.2, 0.35, { type: 'sawtooth', vol: 0.05, slide: 0.97 }); },
  // the sad trombone: wah, wah, wah, waaaah
  worst() {
    if (!ctx) return; const t = now();
    [[63, 0, 0.3], [62, 0.34, 0.3], [61, 0.68, 0.3], [60, 1.02, 1.1]].forEach(([m, dt, d]) => {
      const f = midi(m - 12), o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t + dt);
      if (d > 0.5) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 6; lg.gain.value = f * 0.03; l.connect(lg); lg.connect(o.frequency); l.start(t + dt); l.stop(t + dt + d + 0.1); }
      fl.type = 'lowpass'; fl.Q.value = 4; fl.frequency.setValueAtTime(300, t + dt); fl.frequency.linearRampToValueAtTime(1300, t + dt + 0.12); fl.frequency.linearRampToValueAtTime(500, t + dt + d);
      env(g, t + dt, 0.12, 0.03, d, 'lin'); o.connect(fl); fl.connect(g); g.connect(sfxBus); sendTo(g, 0.2); o.start(t + dt); o.stop(t + dt + d + 0.1);
    });
  },
  correct() { if (!ctx) return; const t = now(); tone(midi(84), t, 0.12, { type: 'sine', vol: 0.12 }); tone(midi(91), t + 0.1, 0.35, { type: 'sine', vol: 0.12, send: 0.3 }); },
  wrong() { if (!ctx) return; const t = now(); tone(140, t, 0.4, { type: 'square', vol: 0.05 }); tone(146, t, 0.4, { type: 'square', vol: 0.04 }); },
  statUp() { if (!ctx) return; tone(midi(88), now(), 0.08, { type: 'square', vol: 0.02 }); },
  statDown() { if (!ctx) return; tone(midi(64), now(), 0.1, { type: 'square', vol: 0.02, slide: 0.8 }); },
  tick() { if (!ctx) return; tone(2600, now(), 0.015, { type: 'square', vol: 0.03 }); },
  chalk() { if (!ctx) return; const t = now(); for (let i = 0; i < 4; i++) noise(t + i * 0.12, 0.09, { f: rnd(3000, 5000), q: 6, vol: 0.02, attack: 0.02 }); },
  write() { if (!ctx) return; const t = now(); for (let i = 0; i < 6; i++) noise(t + i * 0.07, 0.05, { f: rnd(5000, 7000), q: 3, vol: 0.012, attack: 0.01 }); },
  paper() { if (!ctx) return; const t = now(); for (let i = 0; i < 8; i++) noise(t + i * 0.025, 0.04, { f: rnd(2000, 6000), q: 1, vol: 0.04 }); },
  whoosh(pos) { if (!ctx) return; noise(now(), 0.3, { f: 600, q: 0.8, vol: 0.12, slide: 3, out: at(pos, 1) }); },
  splat(pos) { if (!ctx) return; const t = now(), o = at(pos, 1, 6); noise(t, 0.18, { f: 500, q: 0.7, vol: 0.35, out: o, slide: 0.4 }); tone(120, t, 0.12, { vol: 0.15, slide: 0.5, out: o }); },
  tray(pos) { if (!ctx) return; const t = now(), o = at(pos, 1, 6); tone(1900, t, 0.25, { type: 'triangle', vol: 0.05, out: o, send: 0.3 }); tone(2800, t + 0.02, 0.2, { type: 'triangle', vol: 0.03, out: o }); noise(t, 0.06, { f: 3500, q: 2, vol: 0.08, out: o }); },
  vend(pos) { if (!ctx) return; const t = now(), o = at(pos, 1, 6); tone(90, t, 0.8, { type: 'sawtooth', vol: 0.03, out: o, curve: 'lin' }); noise(t + 0.9, 0.12, { f: 400, vol: 0.4, out: o }); tone(180, t + 0.9, 0.2, { vol: 0.12, slide: 0.5, out: o }); },
  canOpen() { if (!ctx) return; const t = now(); noise(t, 0.04, { f: 3000, q: 3, vol: 0.12 }); noise(t + 0.03, 0.4, { f: 6000, type: 'highpass', vol: 0.06, attack: 0.02 }); },
  register() { if (!ctx) return; const t = now(); noise(t, 0.05, { f: 3000, q: 2, vol: 0.12 }); tone(midi(96), t + 0.08, 0.5, { type: 'sine', vol: 0.06, send: 0.4 }); },
  whistle(pos) { if (!ctx) return; const t = now(), o = at(pos, 1, 12); const f = 2900; tone(f, t, 0.5, { type: 'sine', vol: 0.12, vib: 0.03, vibRate: 32, out: o, curve: 'lin' }); noise(t, 0.5, { f, q: 8, vol: 0.05, out: o, curve: 'lin' }); },
  cheer(big = 1) { if (!ctx) return; const t = now(); for (let i = 0; i < 14 * big; i++) { const g = ctx.createGain(); g.gain.value = 0.3; const p = ctx.createStereoPanner(); p.pan.value = rnd(-1, 1); g.connect(p); p.connect(sfxBus); setTimeout(() => ctx && voiceTo(g, rnd(0.9, 1.5), [[0, 330, 520, 0.4, 'e'], [0.4, 520, 460, 0.4, 'o']], 0.05), i * 40); } noise(t, 1.8, { f: 1200, q: 0.4, vol: 0.12 * big, attack: 0.1, curve: 'lin' }); },
  applause(dur = 2.5) { if (!ctx) return; const t0 = now(); for (let t = t0; t < t0 + dur; t += 0.012) noise(t + rnd(0, 0.01), 0.02, { f: rnd(1500, 3500), q: 1, vol: 0.05 * (1 - (t - t0) / dur * 0.7) }); },
  boo() { if (!ctx) return; for (let i = 0; i < 8; i++) { const g = ctx.createGain(); g.gain.value = 0.3; g.connect(sfxBus); setTimeout(() => ctx && voiceTo(g, rnd(0.6, 0.9), [[0, 200, 170, 0.9, 'u']], 0.05), i * 60); } },
  gasp() { if (!ctx) return; for (let i = 0; i < 6; i++) { const g = ctx.createGain(); g.gain.value = 0.3; g.connect(sfxBus); setTimeout(() => ctx && voiceTo(g, rnd(1, 1.5), [[0, 360, 520, 0.25, 'a']], 0.04), i * 30); } },
  laugh(n = 5) { if (!ctx) return; for (let i = 0; i < n; i++) { const g = ctx.createGain(); g.gain.value = 0.35; const p = ctx.createStereoPanner(); p.pan.value = rnd(-0.8, 0.8); g.connect(p); p.connect(sfxBus); setTimeout(() => ctx && laughTo(g, rnd(0.85, 1.4)), i * 90); } },
  snore() { if (!ctx) return; const t = now(); noise(t, 1.1, { f: 180, q: 3, vol: 0.2, attack: 0.5, curve: 'lin' }); tone(70, t, 1.1, { type: 'sawtooth', vol: 0.03, attack: 0.5, curve: 'lin' }); },
  buzz() { if (!ctx) return; const t = now(); for (let i = 0; i < 2; i++) tone(170, t + i * 0.3, 0.2, { type: 'square', vol: 0.04 }); },
  flush(pos) { if (!ctx) return; noise(now(), 2.2, { f: 700, q: 0.5, vol: 0.3, out: at(pos, 1), slide: 0.4, attack: 0.1, curve: 'lin' }); },
  water(pos) { if (!ctx) return; noise(now(), 1.2, { f: 2500, q: 0.6, vol: 0.12, out: at(pos, 1), attack: 0.05, curve: 'lin' }); },
  flash() { if (!ctx) return; const t = now(); noise(t, 0.05, { f: 5000, q: 1, vol: 0.2 }); tone(4000, t + 0.05, 0.4, { vol: 0.02, slide: 1.8 }); },
  pop() { if (!ctx) return; noise(now(), 0.05, { f: 1500, q: 0.8, vol: 0.4 }); },
  swish() { if (!ctx) return; noise(now(), 0.3, { f: 5000, type: 'highpass', vol: 0.12, attack: 0.05 }); },
  bounce(pos) { if (!ctx) return; const t = now(), o = at(pos, 1, 8); tone(130, t, 0.12, { vol: 0.2, slide: 0.6, out: o }); noise(t, 0.03, { f: 900, vol: 0.1, out: o, send: 0.3 }); },
  honk() { if (!ctx) return; const t = now(); tone(330, t, 0.5, { type: 'sawtooth', vol: 0.04 }); tone(415, t, 0.5, { type: 'sawtooth', vol: 0.04 }); },
  busDoor() { if (!ctx) return; noise(now(), 0.6, { f: 3000, q: 0.5, vol: 0.12, slide: 0.5 }); },
  stamp() { if (!ctx) return; const t = now(); tone(110, t, 0.12, { vol: 0.35, slide: 0.5 }); noise(t, 0.06, { f: 800, vol: 0.25 }); },
  page() { if (!ctx) return; noise(now(), 0.25, { f: 3500, q: 0.7, vol: 0.08, attack: 0.05 }); },
  alarmPull() { if (!ctx) return; const t = now(); noise(t, 0.05, { f: 1500, q: 2, vol: 0.2 }); tone(300, t, 0.1, { type: 'square', vol: 0.05 }); },
  eat() { if (!ctx) return; const t = now(); for (let i = 0; i < 3; i++) noise(t + i * 0.15, 0.06, { f: 1800, q: 1.5, vol: 0.12 }); },
  capToss() { if (!ctx) return; this.whoosh(); setTimeout(() => this.cheer(2), 150); },
  talk,
};
