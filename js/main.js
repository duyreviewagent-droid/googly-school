// Googly School: the page. Title screen, your googly, walking around the school, the bell schedule, classes,
// decisions, the HUD and minimap, overlays (nights, report cards, the principal's office) and the yearbook ending.
import * as THREE from 'three';
import { World } from './world.js';
import { Googly, TOPS, HATS, textSprite } from './googly.js';
import { Crowd, OPEN } from './npc.js';
import { Game, PHASES, DAYS, YEARS, YEAR_NAME, EVENT_NAME, letter, fmtClock, fmtLeft, DAY_LEN } from './game.js';
import { ROOMS, HALL, wallPieces, furnitureBoxes, WALL_T, classSeats, PLAYER_SEAT, SPOTS, TABLES, tableSeats, roomAt, SUBJECT_ROOM, SUBJECT_NAME, SUBJECTS, FRONT_DOOR, BOUNDS, gymSpots, STAGE, BLEACHERS, OFFICE_CHAIR, H } from './school.js';
import { HALL as HALL_EVENTS, TABLE_EVENTS, CLASS_TEMPT, ART_PROMPTS, PE_PROMPTS, NIGHT, OFFICE, SPECIAL, LUNCH_MENU, CAST } from './events.js';
import { QUESTIONS, LESSONS } from './questions.js';
import { unlockAudio, music, ambience, sfx, setMusic, setSfx, setVolume, audioState, setListener } from './sfx.js';

const Q = new URLSearchParams(location.search);
if (Q.has('shim')) window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16);
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const isMac = !!window.webkit?.messageHandlers?.gp;
const store = { get(k, d) { try { const v = localStorage.getItem('gs.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set(k, v) { try { localStorage.setItem('gs.' + k, JSON.stringify(v)); } catch { } }, del(k) { try { localStorage.removeItem('gs.' + k); } catch { } } };
const SPEED = +(Q.get('speed') || 1);
const AUTO = Q.get('auto') === '1';

// ------------------------------------------------------------------ the world, the people, you
const world = new World($('view'));
const crowd = new Crowd(world);
const COLORS = ['#ff6ab4', '#ff5a5a', '#ff9a3a', '#ffd23a', '#9ae83a', '#3ad8a0', '#3ab8ff', '#5a7aff', '#a85aff', '#e8e8e8', '#8a6a4a', '#3a3a44'];
const prof = { gender: store.get('gender', 'girl'), name: store.get('name', ''), color: store.get('color', '#ff6ab4'), top: store.get('top', 'tee'), hat: store.get('hat', 'bow'), sens: store.get('sens', 1) };
const topColor = c => new THREE.Color(c).offsetHSL(0.45, 0, 0.05).getStyle();
function myLook(extra = {}) { return { top: prof.top === 'jersey' ? '#1f4fa8' : topColor(prof.color), style: prof.top, hat: prof.hat, hatColor: prof.hat === 'bow' ? '#ff2a8a' : prof.gender === 'boy' ? '#1f4fa8' : '#ffffff', pants: '#2e4a7a', pack: '#ffd23a', num: 1, ...extra }; }
let me = new Googly({ color: prof.color, role: 'student', local: true, look: myLook() });
world.actors.add(me.group);
const P = { x: FRONT_DOOR.x, z: 26, y: 0, vy: 0, yaw: Math.PI, onGround: true, seat: null, pose: 'idle', speed: 0, run: false };
const cam = { yaw: Math.PI, pitch: 0.18, dist: 3.4, x: 0, z: 0 };
me.onStep = v => sfx.step([P.x, 0, P.z], v * 0.8, surfaceAt(P.x, P.z));
function surfaceAt(x, z) { const r = roomAt(x, z); if (r === 'outside') return Math.abs(z - 34) < 4.5 || (x > 4 && x < 44 && z > 18 && z < 30) ? 'asphalt' : 'grass'; if (r === 'gym') return 'wood'; if (r === 'library' || r === 'office') return 'carpet'; if (r === 'restroom') return 'tile'; return 'lino'; }

// ------------------------------------------------------------------ collisions: walls, lockers and furniture as boxes in a grid
const boxes = [];
for (const p of wallPieces()) { const t = WALL_T / 2 + 0.02; boxes.push(p.horiz ? [p.x0, p.z0 - t, p.x1, p.z0 + t] : [p.x0 - t, p.z0, p.x0 + t, p.z1]); }
for (const b of furnitureBoxes()) boxes.push(b);
for (const b of world.boxes) boxes.push(b);
const GRID = new Map(), CELL = 4;
for (const b of boxes) for (let cx = Math.floor(b[0] / CELL); cx <= Math.floor(b[2] / CELL); cx++) for (let cz = Math.floor(b[1] / CELL); cz <= Math.floor(b[3] / CELL); cz++) { const k = cx + ',' + cz; if (!GRID.has(k)) GRID.set(k, []); GRID.get(k).push(b); }
function nearBoxes(x, z) { const out = new Set(); for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const b of GRID.get((Math.floor(x / CELL) + dx) + ',' + (Math.floor(z / CELL) + dz)) || []) out.add(b); return out; }
function collide(x, z, r = 0.32) {
  for (let it = 0; it < 3; it++) for (const b of nearBoxes(x, z)) {
    const cx = clamp(x, b[0], b[2]), cz = clamp(z, b[1], b[3]), dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (r - d) / d; x += dx * k; z += dz * k; }
    else { const o = [x - b[0] + r, b[2] - x + r, z - b[1] + r, b[3] - z + r], m = Math.min(...o); if (m === o[0]) x = b[0] - r; else if (m === o[1]) x = b[2] + r; else if (m === o[2]) z = b[1] - r; else z = b[3] + r; }
  }
  return [clamp(x, BOUNDS.x0, BOUNDS.x1), clamp(z, BOUNDS.z0, BOUNDS.z1)];
}
/** Does the straight line from a to b cross a wall? (for the camera, and for the principal seeing you) */
function blocked(ax, az, bx, bz, walls = true) {
  const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.25);
  for (let i = 1; i < n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; for (const b of nearBoxes(x, z)) if (x > b[0] && x < b[2] && z > b[1] && z < b[3]) return i / n; }
  return 0;
}

// ------------------------------------------------------------------ input
const keys = new Set(); const look = { dx: 0, dy: 0 };
let locked = false, macLocked = false, screen = 'scr-title', paused = false, card = null, overlay = false, typing = false;
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  unlockAudio();
  if (e.code === 'Tab') e.preventDefault();
  if (card && /^Digit[1-9]$/.test(e.code)) { const i = +e.code.slice(5) - 1; const b = $('card-choices').children[i]; if (b && !b.disabled) b.click(); return; }
  if (card && /^Numpad[1-9]$/.test(e.code)) { const b = $('card-choices').children[+e.code.slice(6) - 1]; if (b && !b.disabled) b.click(); return; }
  if (overlay && (e.code === 'Enter' || e.code === 'Space')) { const b = document.querySelector('#over-card button.primary'); if (b) { b.click(); return; } }
  keys.add(e.code);
  if (!G || screen !== null) { if (e.code === 'Escape' && screen === 'scr-pause') resume(); return; }
  if (e.code === 'KeyE') interact();
  if (e.code === 'Space') jump();
  if (e.code === 'Tab') showReport(false);
  if (e.code === 'Escape') { if (macLocked) unlock(); pause(); }
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const canvas = $('view');
let drag = null;
canvas.addEventListener('mousedown', e => { unlockAudio(); if (!G || screen) return; if (!locked && !macLocked && wantsLock()) { askLock(); return; } drag = { x: e.clientX, y: e.clientY }; });
addEventListener('mousemove', e => { if (locked) { look.dx += e.movementX; look.dy += e.movementY; } else if (drag) { look.dx += (e.clientX - drag.x) * 1.2; look.dy += (e.clientY - drag.y) * 1.2; drag = { x: e.clientX, y: e.clientY }; } });
addEventListener('mouseup', () => drag = null);
addEventListener('wheel', e => { cam.dist = clamp(cam.dist + e.deltaY * 0.003, 1.8, 6); }, { passive: true });
addEventListener('contextmenu', e => { if (G) e.preventDefault(); });
window.__look = (dx, dy) => { if (macLocked) { look.dx += dx; look.dy += dy; } };
window.__unlocked = () => { if (macLocked) { macLocked = false; if (G && !screen && !card && !overlay) pause(); } };
window.__mouse = () => { };
const wantsLock = () => G && !screen && !card && !overlay && !P.seat && !scene;
function askLock() {
  if (!wantsLock()) return;
  if (isMac) { window.webkit.messageHandlers.gp.postMessage('lock'); macLocked = true; $('clickto').classList.add('hidden'); return; }
  canvas.requestPointerLock?.();
}
$('clickto').onclick = () => { unlockAudio(); askLock(); };
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === canvas;
  if (locked) $('clickto').classList.add('hidden');
  else if (G && !screen && !card && !overlay && !intentionalUnlock) pause();
  intentionalUnlock = false;
});
let intentionalUnlock = false;
function unlock() { if (document.pointerLockElement) { intentionalUnlock = true; document.exitPointerLock(); } if (macLocked) { macLocked = false; window.webkit?.messageHandlers?.gp?.postMessage('unlock'); } }

// ------------------------------------------------------------------ screens
function show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id); screen = id; if (id) unlock(); }
function pause() { if (!G || screen || overlay) return; keys.clear(); paused = true; show('scr-pause'); }
function resume() { paused = false; show(null); sfx.click(); if (wantsLock()) { if (isMac) askLock(); else canvas.requestPointerLock?.(); } }
$('p-resume').onclick = resume;
$('p-title').onclick = () => { saveNow(); location.href = location.pathname; };
$('p-restart').onclick = () => { if (confirm('Start high school over? Your save will be erased.')) { store.del('save'); location.href = location.pathname; } };
for (const k of ['music', 'sfx', 'amb']) { const el = $('vol-' + k); el.value = audioState().vol[k]; el.oninput = () => { setVolume(k, +el.value); if (k === 'sfx') sfx.click(); }; }
$('sens').value = prof.sens; $('sens').oninput = () => { prof.sens = +$('sens').value; store.set('sens', prof.sens); };
for (const b of document.querySelectorAll('.back')) b.onclick = () => { sfx.click(); show(G ? 'scr-pause' : 'scr-title'); };
$('b-help').onclick = () => { sfx.click(); show('scr-help'); };
$('b-fs').onclick = () => { sfx.click(); if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); };
const syncAudioBtns = () => { const a = audioState(); $('b-music').textContent = a.music ? '♪ Music' : '♪ Music off'; $('b-sfx').textContent = a.sfx ? '🔊 Sound' : '🔇 Sound off'; };
$('b-music').onclick = () => { unlockAudio(); setMusic(!audioState().music); syncAudioBtns(); };
$('b-sfx').onclick = () => { unlockAudio(); setSfx(!audioState().sfx); syncAudioBtns(); sfx.click(); };
syncAudioBtns();
// title: name, colour, outfit, extra
$('nm').value = prof.name;
$('nm').oninput = () => { prof.name = $('nm').value.replace(/[<>&"]/g, '').slice(0, 14); store.set('name', prof.name); };
for (const c of COLORS) { const d = document.createElement('div'); d.style.background = c; d.className = c === prof.color ? 'on' : ''; d.onclick = () => { prof.color = c; store.set('color', c); for (const x of $('swatches').children) x.className = ''; d.className = 'on'; restyle(); sfx.click(); }; $('swatches').appendChild(d); }
const TOP_LABEL = { tee: 'T-shirt', hoodie: 'Hoodie', polo: 'Polo', jersey: 'Jersey', sweater: 'Sweater' };
const HAT_LABEL = { none: 'None', cap: 'Cap', backcap: 'Backwards', beanie: 'Beanie', headphones: 'Headphones', bow: 'Bow', glasses: 'Glasses', shades: 'Shades' };
function segButtons(el, list, labels, key) { el.innerHTML = ''; for (const v of list) { const b = document.createElement('button'); b.textContent = labels[v]; b.className = prof[key] === v ? 'on' : ''; b.onclick = () => { prof[key] = v; store.set(key, v); for (const x of el.children) x.className = ''; b.className = 'on'; restyle(); sfx.click(); }; el.appendChild(b); } }
segButtons($('tops'), TOPS, TOP_LABEL, 'top'); segButtons($('hats'), HATS, HAT_LABEL, 'hat');
function syncGender() { for (const b of $('gender').children) b.className = b.dataset.v === prof.gender ? 'on' : ''; }
for (const b of $('gender').children) b.onclick = () => {
  const g = b.dataset.v; if (g === prof.gender) return;
  prof.gender = g; store.set('gender', g);
  // swap the defaults that go with it (only if you haven't picked your own)
  if (g === 'boy') { if (prof.hat === 'bow') prof.hat = 'backcap'; if (prof.color === '#ff6ab4') prof.color = '#3ab8ff'; if (prof.top === 'tee') prof.top = 'hoodie'; }
  else { if (prof.hat === 'backcap' || prof.hat === 'cap') prof.hat = 'bow'; if (prof.color === '#3ab8ff') prof.color = '#ff6ab4'; if (prof.top === 'hoodie') prof.top = 'tee'; }
  for (const k of ['hat', 'color', 'top']) store.set(k, prof[k]);
  segButtons($('tops'), TOPS, TOP_LABEL, 'top'); segButtons($('hats'), HATS, HAT_LABEL, 'hat');
  for (const x of $('swatches').children) x.className = x.style.background && new THREE.Color(x.style.background).getHexString() === new THREE.Color(prof.color).getHexString() ? 'on' : '';
  syncGender(); restyle(); sfx.click();
};
syncGender();
function restyle(extra = {}) { me.setLook(prof.color, 'none'); me.dress(myLook(extra)); }

// ------------------------------------------------------------------ decisions
let G = null;
function fill(s = '', extra = {}) {
  const map = { me: G?.name || prof.name || 'You', friend: CAST.friend.name, crush: CAST.crush.name, bully: CAST.bully.name, nerd: CAST.nerd.name, queen: CAST.queen.name, jock: CAST.jock.name, artsy: CAST.artsy.name, gamer: CAST.gamer.name, teacher: extra.teacher || 'The teacher', ...extra };
  return String(s).replace(/\{(\w+)\}/g, (m, k) => map[k] ?? m);
}
const cardQueue = [];
/** Show a decision. dec: { text, choices: [{t, g, e, r, ...}] }. opts: { who, color, where, subject, timed, kind: 'decision'|'question'|'night'|'plain', teacher }. Resolves with { choice, i, caught }. */
function decide(dec, opts = {}) {
  return new Promise(res => { cardQueue.push({ dec, opts, res }); if (!card) nextCard(); });
}
function nextCard() {
  const q = cardQueue.shift(); if (!q) { card = null; $('card').classList.add('hidden'); if (wantsLock() && (locked || macLocked || AUTO)) { } return; }
  const { dec, opts } = q;
  opts.dec = dec; if (opts.neutral === undefined) { let bi = 0; dec.choices.forEach((c, i) => { if (Math.abs(c.g ?? 0) < Math.abs(dec.choices[bi].g ?? 0)) bi = i; }); opts.neutral = bi; }
  card = { ...q, t0: performance.now(), timed: opts.timed || 0, left: opts.timed || 0, done: false };
  if (!P.seat) unlock();
  const el = $('card'); el.className = opts.kind === 'question' ? 'q' : opts.kind === 'night' ? 'night' : '';
  $('card-who').textContent = fill(opts.who || '');
  $('card-dot').style.background = opts.color || '#ffd23a'; $('card-dot').style.display = opts.who ? '' : 'none';
  $('card-where').textContent = opts.where || '';
  $('card-text').textContent = fill(dec.text, opts);
  const box = $('card-choices'); box.innerHTML = '';
  box.classList.toggle('one', dec.choices.length > 4 && opts.kind === 'night' ? false : dec.choices.some(c => fill(c.t).length > 44));
  dec.choices.forEach((c, i) => {
    const b = document.createElement('button');
    b.innerHTML = `<span class="n">${i + 1}</span><span></span>`; b.lastChild.textContent = fill(c.t, opts);
    if (c.cost && G && G.money < c.cost) b.disabled = true;
    b.onclick = () => choose(i);
    b.onmouseenter = () => sfx.hover();
    box.appendChild(b);
  });
  $('card-timer').style.display = card.timed ? '' : 'none';
  el.classList.remove('hidden');
  sfx.panel(true);
  if (AUTO) setTimeout(() => { if (card && card.dec === dec && !card.done) { const ok = [...box.children].map((b, i) => b.disabled ? -1 : i).filter(i => i >= 0); choose(pick(ok)); } }, 600 / SPEED + 200);
}
function choose(i, timedOut = false) {
  if (!card || card.done) return;
  card.done = true;
  const { dec, opts, res } = card;
  sfx.click();
  $('card').classList.add('hidden');
  let out;
  if (opts.kind === 'question') out = { i, timedOut };
  else out = resolveChoice(dec.choices[i], opts, timedOut);
  res(out);
  card = null;
  setTimeout(() => { if (!card) nextCard(); }, cardQueue.length ? 350 : 0);
  if (!cardQueue.length && wantsLock() && !isMac && !AUTO) canvas.requestPointerLock?.();
  if (!cardQueue.length && wantsLock() && isMac && !AUTO) askLock();
}
function resolveChoice(c, opts, timedOut) {
  if (timedOut) { const n = opts.neutral ?? 0; c = opts.dec?.choices?.[n] || c; }
  let e = { ...(c.e || {}) }, r = c.r, det = c.det || 0, caught = false, failed = false;
  if (c.need) { const ok = Object.entries(c.need).every(([k, v]) => (G.rel[k] ?? G.grades[k] ?? G[k] ?? 0) >= v); if (!ok) { failed = true; e = { ...c.fail.e }; r = c.fail.r; } }
  if (c.shoot !== undefined) { const p = c.shoot + (G.grades.pe - 75) / 200; if (Math.random() > p) { failed = true; e = { ...c.fail.e }; r = c.fail.r; } }
  if (c.risk && !failed) { const near = crowd.staff.principal && Math.hypot(crowd.staff.principal.x - P.x, crowd.staff.principal.z - P.z) < 9 ? 0.15 : 0; if (Math.random() < c.risk.p + near) { caught = true; for (const [k, v] of Object.entries(c.risk.e || {})) e[k] = (e[k] || 0) + v; r = c.risk.r; det += c.risk.det || 0; } }
  if (c.cost) e.money = (e.money || 0) - c.cost;
  if (G.flags.fries && c.cost && opts.lunch) e.money += c.cost;
  const deltas = G.apply(e, opts.subject);
  if (c.flags && !failed) for (const [k, v] of Object.entries(c.flags)) G.flags[k] = typeof v === 'number' ? (G.flags[k] || 0) + v : v;
  G.addDetention(det);
  if (opts.kind !== 'plain') G.record(fill(c.t, opts), c.g, opts.where || '');
  showResult(c.g, (timedOut ? 'You took too long… ' : '') + fill(r, opts), deltas, det, opts.kind === 'plain');
  return { choice: c, caught, failed, det, i: opts.dec?.choices?.indexOf(c) };
}
const GRADE_TXT = { 2: ['BEST DECISION!', 'best'], 1: ['GOOD CHOICE', 'good'], 0: ['OKAY…', 'meh'], '-1': ['BAD DECISION', 'bad'], '-2': ['WORST DECISION!', 'worst'] };
let resultT = 0;
function showResult(g, text, deltas = [], det = 0, plain = false) {
  const [label, cls] = GRADE_TXT[clamp(g, -2, 2)];
  $('r-grade').textContent = plain ? '' : label; $('r-grade').className = cls;
  $('r-text').textContent = text; $('r-text').style.display = text ? '' : 'none';
  const dl = $('r-deltas'); dl.innerHTML = '';
  for (const d of deltas) { const s = document.createElement('span'); const good = d.key === 'bully' ? d.d < 0 : d.d > 0; s.className = good ? 'up' : 'dn'; s.textContent = `${d.d > 0 ? '+' : ''}${d.key === 'money' ? '$' : ''}${d.d} ${d.key === 'money' ? '' : d.label}`; dl.appendChild(s); }
  if (det) { const s = document.createElement('span'); s.className = 'dn'; s.textContent = `🚨 +${det} detention${det > 1 ? 's' : ''}`; dl.appendChild(s); }
  const el = $('result'); el.classList.remove('hidden'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  resultT = 3.6 + text.length / 60;
  if (!plain) { if (g >= 2) sfx.best(); else if (g === 1) sfx.good(); else if (g === 0) sfx.meh(); else if (g === -1) sfx.bad(); else sfx.worst(); }
  updateHUD(true);
}
/** A question from the teacher. Resolves with true/false (or 'cheat' when you peeked). */
async function askQuestion(subject, { test = false, n = 0, teacher = '' } = {}) {
  const bank = QUESTIONS[subject] || [];
  let pool = bank.filter(q => q.y === G.year && !G.usedQ.includes(q.q));
  if (!pool.length) pool = bank.filter(q => !G.usedQ.includes(q.q));
  if (!pool.length) { G.usedQ = G.usedQ.filter(x => !bank.some(q => q.q === x)); pool = bank.slice(); }
  const q = pick(pool); G.usedQ.push(q.q);
  const order = q.a.map((a, i) => ({ a, ok: i === 0 })).sort(() => Math.random() - 0.5);
  const choices = order.map((o, i) => ({ t: `${'ABCD'[i]}) ${o.a}` }));
  const cheat = test && Math.random() < 0.6;
  if (cheat) choices.push({ t: `👀 Peek at ${CAST.nerd.name}'s paper` });
  else if (!test && Math.random() < 0.25) choices.push({ t: '🤪 Shout "PIZZA!" instead' });
  const res = await decide({ text: test ? `TEST · Question ${n + 1} of 3 — ${q.q}` : `${teacher}: "${q.q}"`, choices }, { who: test ? `${SUBJECT_NAME[subject].toUpperCase()} TEST` : teacher, color: ROOMS[SUBJECT_ROOM[subject]]?.color, where: test ? 'NO TALKING' : 'IN CLASS', kind: 'question', timed: test ? 9 : 9 });
  if (res.timedOut) { sfx.wrong(); showResult(0, `Time's up! (It was "${q.a[0]}")`, [], 0, true); return false; }
  const c = choices[res.i];
  if (c.t.startsWith('👀')) {
    if (Math.random() < 0.35) { const d = G.apply({ [subject]: -12, conduct: -12 }); G.addDetention(1); G.record(`Cheated on the ${SUBJECT_NAME[subject]} test`, -2, 'Test'); showResult(-2, `${teacher || 'The teacher'} catches you looking at ${CAST.nerd.name}'s paper. ZERO on the test — and detention.`, d, 1); return 'caught'; }
    G.record(`Cheated on the ${SUBJECT_NAME[subject]} test`, -1, 'Test'); showResult(-1, `You copy ${CAST.nerd.name}'s answer. Nobody saw… this time.`, [], 0); return 'cheat';
  }
  if (c.t.startsWith('🤪')) { const d = G.apply({ pop: 3, conduct: -4, [subject]: -2 }); G.record('Shouted "PIZZA!" instead of answering', -1, 'Class'); sfx.laugh(6); showResult(-1, 'The whole class cracks up. The teacher does not.', d); return false; }
  const ok = order[res.i].ok;
  if (ok) { sfx.correct(); if (!test) { const d = G.apply({ [subject]: 4 }); showResult(1, 'Correct!', d, 0, true); } else showResult(1, 'You write it down confidently.', [], 0, true); }
  else { sfx.wrong(); if (!test) { const d = G.apply({ [subject]: -2 }); showResult(0, `Not quite — it's "${q.a[0]}".`, d, 0, true); } else showResult(0, 'You write something down. Hmm.', [], 0, true); }
  return ok;
}

// ------------------------------------------------------------------ the school day
let cls = null, phaseS = {}, scene = null, alarm = null, busAnim = null, lastPhaseKey = '';
const sleep = s => new Promise(r => setTimeout(r, s * 1000 / SPEED));
const MUSIC_FOR = { free: 'hall', class: 'class', lunch: 'lunch', after: 'after' };
function toast(t, s = 3) { const el = $('toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toast.t); toast.t = setTimeout(() => el.style.opacity = 0, s * 1000); }
function center(big, small = '', s = 2.6, color = '#fff') { const el = $('center'); el.innerHTML = ''; el.style.color = color; el.append(big); if (small) { const sm = document.createElement('small'); sm.textContent = small; el.append(sm); } el.style.opacity = 1; clearTimeout(center.t); center.t = setTimeout(() => el.style.opacity = 0, s * 1000); }
async function fade(fn) { $('fade').style.opacity = 1; await new Promise(r => setTimeout(r, 480)); await fn?.(); $('fade').style.opacity = 0; }
const teacherOf = subj => subj === 'pe' ? crowd.staff.pe : crowd.staff[subj];
const lessonFor = subj => { const L = LESSONS[subj]?.[G.year - 1] || []; return L[(G.day - 1 + (subj.length * 3)) % Math.max(1, L.length)] || SUBJECT_NAME[subj]; };
function nextClassSlot() { const p = G.phase; if (p.kind === 'free') return p.next; return null; }
function placePlayer(x, z, yaw = null) { P.x = x; P.z = z; P.y = 0; P.vy = 0; if (yaw !== null) { P.yaw = yaw; cam.yaw = yaw; } }
function standUp() { if (!P.seat) return; const s = P.seat; P.seat = null; me.hold(null); if (!s.stand) { const [x, z] = collide(s.x + 0.75, s.z + 0.3); placePlayer(x, z); } P.pose = 'idle'; }
function sitAt(x, z, ry, { stand = false, seatH = 0.46, pose = 'idle', camMode = 'seat', board = null } = {}) {
  P.seat = { x, z, ry, stand, seatH, board, camMode }; P.x = x; P.z = z; P.yaw = ry; P.pose = pose; cam.syaw = 0; cam.spitch = 0;
  unlock();
}
function beginPhase() {
  const p = G.phase, sp = G.special;
  phaseS = { t: 0, key: `${G.year}-${G.day}-${G.pi}` };
  world.setTime(clamp(G.dayK(), 0, 1));
  if (!scene || scene === 'event') { world.setEvent(null); }
  standUp(); scene = null; cls = null;
  if (p.id !== 'arrive') sfx.bell();
  if (p.kind === 'free') {
    if (p.id === 'arrive') {
      placePlayer(FRONT_DOOR.x + rnd(-2, 2), 30.4, Math.PI);
      busAnim = { t: 0 }; world.bus.position.x = -80;
      crowd.setPhase('arrive', { day: G.dayType });
      restyle();
      if (sp.news === 'election') phaseS.news = 3;
      if (sp.morning) phaseS.forced = sp.morning;
      center(`${YEAR_NAME[G.year].split(' · ')[0].toUpperCase()} · DAY ${G.day}`, `${G.dayType}-Day: ${[0, 1, 2].map(i => SUBJECT_NAME[G.subjectFor(i)]).join(' · ')}${sp.tests ? ' · TEST DAY' : ''}${sp.after ? ' · Tonight: ' + EVENT_NAME[sp.after] : ''}`, 4);
    } else crowd.setPhase('pass', { day: G.dayType, slot: p.next - 1 });
    phaseS.hallAt = Math.random() < 0.8 ? rnd(2.5, 7) : null;
    if (phaseS.forced) phaseS.hallAt = 2;
    music.play('hall');
  } else if (p.kind === 'class') startClass(p.slot);
  else if (p.kind === 'lunch') { crowd.setPhase('lunch', { day: G.dayType }); music.play('lunch'); phaseS.hallAt = null; center('LUNCH', 'Get food in the cafeteria, then pick a table', 2.4); }
  else if (p.kind === 'after') {
    center('SCHOOL\'S OUT!', G.det > 0 ? `You have DETENTION (Room 106)` : sp.after ? `Tonight: ${EVENT_NAME[sp.after]}` : 'Clubs, the gym, the library — or head home', 3);
    crowd.setPhase('after', { day: G.dayType, team: G.flags.team ? [crowd.cast.jock] : [] });
    busAnim = { t: 0, leave: true };
    music.play('after');
    if (sp.after && !(sp.after === 'grad' && false)) { phaseS.eventAt = 2.2; phaseS.event = sp.after; }
    else phaseS.hallAt = Math.random() < 0.45 && G.det === 0 ? rnd(3, 9) : null;
  }
  updateHUD(true);
}
function endPhase() {
  const p = G.phase;
  if (p.kind === 'class' && cls) {
    if (!cls.attended && cls.excused) { const d = G.apply({ [cls.subject]: -3 }); showResult(0, `Excused from ${SUBJECT_NAME[cls.subject]} ("sick").`, d, 0, true); }
    else if (!cls.attended) { G.skips++; G.attended[cls.slot] = 'skip'; const d = G.apply({ [cls.subject]: cls.test ? -14 : -6 }); G.record(`Skipped ${SUBJECT_NAME[cls.subject]}${cls.test ? ' on test day' : ''}`, -2, 'Class'); showResult(-2, `You skipped ${SUBJECT_NAME[cls.subject]}${cls.test ? ' — and missed the test!' : '.'}`, d); }
    else if (cls.test) finishTest();
  }
  if (p.kind === 'lunch') { if (!phaseS.ate) { G.apply({ energy: -8 }); toast('You skipped lunch. Your stomach growls. (−8 energy)'); } me.hold(null); }
  if (p.kind === 'after' && !phaseS.event) {
    if (G.det > 0 && !phaseS.detDone) { G.det += 1; G.detTotal += 1; const d = G.apply({ conduct: -8 }); G.record('Skipped detention', -2, 'Detention'); showResult(-2, 'You skipped detention! Now you have another one.', d, 1); }
  }
  cls = null; standUp(); scene = scene === 'office' ? scene : null;
}
// ------------------------------------------------------------------ class
function startClass(slot) {
  const subject = G.subjectFor(slot), room = SUBJECT_ROOM[subject], test = G.isTest(slot);
  cls = { slot, subject, room, test, attended: false, idx: 0, correct: 0, asked: 0, prompts: test ? [2, 10.5, 19] : [3.5, 13, 22.5], late: false, caughtSkipping: false, used: [] };
  crowd.setPhase('class', { day: G.dayType, slot, visibleTest: p => p.vis });
  if (room !== 'gym') world.drawBoard(room, test ? `${SUBJECT_NAME[subject]} TEST` : lessonFor(subject), test ? 'Eyes on your own paper. Phones away. Good luck!' : `Year ${G.year} · Day ${G.day}`, test ? [] : boardLines(subject));
  const T = teacherOf(subject); if (T) { T.pose = 'talk'; T.g.talk(3); }
  if (roomAt(P.x, P.z) === room || (room === 'gym' && roomAt(P.x, P.z) === 'gym')) sitInClass(false);
  else { center('TARDY BELL!', `You're late for ${SUBJECT_NAME[subject]} — ${ROOMS[room].label}`, 2.6, '#ff9a8a'); sfx.tardy(); music.play('hall'); }
}
function boardLines(subject) { return { math: ['y = mx + b', 'Show your work!'], english: ['Theme · Tone · Mood', 'Essay due Friday'], science: ['Hypothesis → Test → Result', 'Goggles ON'], history: ['Know your dates!', 'Chapter review p. 212'], art: ['Warm vs cool', 'Clean your brushes!'] }[subject] || []; }
function sitInClass(late) {
  const room = cls.room;
  cls.attended = true; G.attended[cls.slot] = late ? 'late' : 'on';
  if (late && !cls.alarmReturn) { G.tardies++; const d = G.apply({ conduct: -2 }); G.record(`Late to ${SUBJECT_NAME[cls.subject]}`, -1, 'Class'); showResult(-1, `${teacherOf(cls.subject)?.name}: "Nice of you to join us."`, d); }
  if (room === 'gym') { const s = gymSpots()[0]; sitAt(s.x, s.z, s.ry, { stand: true, camMode: 'gym' }); }
  else { const s = classSeats(room)[PLAYER_SEAT]; sitAt(s.x, s.z + 0.18, Math.PI, { board: room }); me.hold('pencil'); }
  music.play(cls.test ? 'test' : 'class');
  $('classbar').classList.remove('hidden');
  $('cb-sub').textContent = `${SUBJECT_NAME[cls.subject].toUpperCase()} · ${ROOMS[room].label.split(' · ')[0]}`;
  $('cb-lesson').textContent = cls.test ? `${SUBJECT_NAME[cls.subject]} TEST` : lessonFor(cls.subject);
  $('cb-teacher').textContent = teacherOf(cls.subject)?.name || '';
}
function updateClass(dt) {
  if (!cls) return;
  if (!cls.attended) {
    const r = roomAt(P.x, P.z);
    if (r === cls.room && G.pt < G.phase.dur - 3) { sitInClass(true); return; }
    // skipping: don't let the principal see you
    const pr = crowd.staff.principal;
    if (!cls.caughtSkipping && !scene && G.pt > 3 && pr && Math.hypot(pr.x - P.x, pr.z - P.z) < 7.5 && OPEN.has(r) && !blocked(pr.x, pr.z, P.x, P.z)) {
      cls.caughtSkipping = true; officeScene(`caught you wandering the halls during ${SUBJECT_NAME[cls.subject]}`, 1, 'Caught skipping class');
    }
    return;
  }
  if (card || alarm) return;
  if (cls.idx < cls.prompts.length && G.pt >= cls.prompts[cls.idx]) { const k = cls.idx++; classPrompt(k); }
}
async function classPrompt(k) {
  const c = cls; if (!c) return;
  const T = teacherOf(c.subject), tname = T?.name || 'The teacher', subj = c.subject;
  if (T) { T.pose = k % 2 ? 'point' : 'talk'; T.face = P; T.g.talk(1.5); sfx.talk([T.x, 1.5, T.z], 0.8, 6); }
  const where = `${SUBJECT_NAME[subj].toUpperCase()} · PERIOD ${c.slot + 1}`;
  if (c.test) { const r = await askQuestion(subj, { test: true, n: k, teacher: tname }); if (r === true || r === 'cheat') c.correct++; if (r === 'caught') c.zero = true; c.asked++; return; }
  let tempt = null;
  if (subj === 'pe') tempt = pickUnused(PE_PROMPTS, c);
  else if (subj === 'art') tempt = k === 1 ? pickUnused(CLASS_TEMPT.filter(t => !t.quiz), c) : pickUnused(ART_PROMPTS, c);
  else if (k === 1 || (k === 2 && Math.random() < 0.35)) tempt = G.energy < 15 ? CLASS_TEMPT[2] : pickUnused(CLASS_TEMPT, c);
  if (!tempt) { await askQuestion(subj, { teacher: tname }); return; }
  if (tempt.quiz) { center('POP QUIZ!', '', 1.6, '#ffe07a'); sfx.page(); const r = await askQuestion(subj, { teacher: tname }); G.apply({ [subj]: r === true ? 3 : -3 }); return; }
  const res = await decide(tempt, { who: tempt.text.startsWith('Coach') ? 'Coach Whistle' : tempt.text.startsWith('Mx.') ? 'Mx. Palette' : 'IN CLASS', color: ROOMS[c.room]?.color, where, subject: subj, teacher: tname, timed: 12 });
  const ch = res.choice;
  if (ch.throwIt) { const a = new THREE.Vector3(P.x, 1.3, P.z), b = c.room === 'gym' ? new THREE.Vector3(crowd.staff.pe.x, 1.4, crowd.staff.pe.z) : new THREE.Vector3(ROOMS[c.room].cx + rnd(-1, 1), 1.7, -12.7); world.throwAt(subj === 'art' ? 'food' : 'paper', a, b, 0.8, () => { sfx.splat([b.x, b.y, b.z]); sfx.laugh(4); }); sfx.whoosh([P.x, 1.3, P.z]); me.reach(); }
  if (ch.sleep) { P.pose = 'sleep'; sfx.snore(); setTimeout(() => { if (P.pose === 'sleep') P.pose = 'idle'; }, 4500 / SPEED); }
  if (ch.raise) { P.pose = 'raise'; setTimeout(() => { if (P.pose === 'raise') P.pose = 'idle'; }, 2000 / SPEED); }
  if (res.caught && T) { T.pose = 'point'; T.g.shout(); sfx.talk([T.x, 1.5, T.z], 0.7, 8); }
  if (res.det) sfx.stamp();
}
function pickUnused(list, c) { const pool = list.filter(t => !c.used.includes(t) && !(G.usedTempt || []).includes(list.indexOf(t) + ':' + G.day)); const t = pick(pool.length ? pool : list); c.used.push(t); return t; }
function finishTest() {
  const c = cls; if (!c.asked && !c.zero) return;
  const score = c.zero ? 0 : c.correct, pct = Math.round(score / 3 * 100);
  const change = c.zero ? -18 : [-14, -6, 5, 12][score];
  const d = G.apply({ [c.subject]: change });
  const L = c.zero ? 'F' : letter(pct >= 99 ? 100 : pct >= 66 ? 84 : pct >= 33 ? 64 : 40);
  showResult(score >= 2 ? 1 : score === 1 ? 0 : -1, `${SUBJECT_NAME[c.subject]} test: ${score}/3 — grade ${L}`, d, 0, true);
  sfx.page();
}
// ------------------------------------------------------------------ hallway moments
function personFor(who, ev) {
  if (CAST[who]) return crowd.cast[who];
  if (who === 'teacher') return ev.id === 'college_talk' ? crowd.staff.english : crowd.staff.history;
  if (who === 'janitor') return crowd.staff.janitor;
  const near = crowd.students.filter(p => !p.key && !p.busy && !p.seat && Math.hypot(p.x - P.x, p.z - P.z) < 28 && p.vis).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z));
  return near[0] || null;
}
function hallEvent(forced = null) {
  if (scene || P.seat || card) return;
  let ev = forced ? HALL_EVENTS.find(e => e.id === forced) : null;
  if (forced === 'college') { collegeEvent(); return; }
  if (!ev) { const pool = HALL_EVENTS.filter(e => !G.used.includes(e.id) && (!e.years || e.years.includes(G.year))); if (!pool.length) return; ev = pick(pool); }
  const person = personFor(ev.who, ev);
  if (!person || person.busy) return;
  G.used.push(ev.id);
  if (person.seat) person.seat = false;
  crowd.summon(person, P, async () => {
    if (!G) return;
    person.pose = 'talk'; person.g.talk(2); sfx.talk([person.x, 1.4, person.z], person.g.root.scale.x > 1.3 ? 0.7 : 1.1, 7);
    const res = await decide(ev, { who: person.name, color: person.color, where: G.phase.kind === 'after' ? 'AFTER SCHOOL' : 'HALLWAY' });
    person.pose = res.choice.g >= 1 ? 'cheer' : res.choice.g <= -1 ? 'sad' : 'idle';
    setTimeout(() => crowd.resume(person), 1800);
    afterChoice(res, ev.id);
  });
}
async function collegeEvent() {
  const res = await decide(SPECIAL.college, { who: 'Ms. Stamp (Guidance)', color: '#e0c890', where: 'SENIOR YEAR' });
  afterChoice(res, 'college');
}
function afterChoice(res, id) {
  const f = res.choice.flags || {};
  if (f.skipNext && !res.caught) { fade(() => { placePlayer(-58, rnd(-4, 4), -Math.PI / 2); }); toast('You slip out the back exit…'); }
  if (f.alarm) fireAlarm(true, true);
  else if ((res.det || 0) >= 2) setTimeout(() => officeScene('wants to see you. NOW.', 0, null), 2500);
  if (f.foodfight) foodFight();
}
// ------------------------------------------------------------------ the principal's office
async function officeScene(why, det, what) {
  if (scene === 'office') return;
  scene = 'office';
  standUp();
  if (det) G.addDetention(det);
  if (what) G.record(what, -2, 'Principal');
  center('PRINCIPAL\'S OFFICE', `Principal Googlesworth ${why}`, 2.4, '#ff9a8a');
  await sleep(1.4);
  const pr = crowd.staff.principal, pp = { x: pr.x, z: pr.z };
  await fade(() => { sitAt(OFFICE_CHAIR.x, OFFICE_CHAIR.z, 0, { camMode: 'office' }); pr.place(0, 11.2, { ry: Math.PI, sit: true }); pr.pose = 'talk'; });
  music.play('trouble'); pr.g.talk(3); sfx.talk([0, 1.4, 11], 0.7, 10);
  const res = await decide(OFFICE, { who: 'Principal Googlesworth', color: '#8a8aa0', where: "PRINCIPAL'S OFFICE" });
  if (res.choice.soften && G.det > 1) { G.det--; toast('He takes one detention off for your honesty.'); }
  if (G.det > 0) sfx.stamp();
  await sleep(3);
  await fade(() => { P.seat = null; placePlayer(0, 1.4, Math.PI); pr.place(pp.x, pp.z, { ry: 0 }); if (cls || G.phase.kind === 'class') crowd.patrol(); });
  scene = null;
  music.play(MUSIC_FOR[G.phase.kind] || 'hall');
}
// ------------------------------------------------------------------ the fire alarm
function fireAlarm(byPlayer, forced = false) {
  if (alarm) return;
  const pr = crowd.staff.principal, seen = pr && Math.hypot(pr.x - P.x, pr.z - P.z) < 12;
  alarm = { t: 20, byPlayer, caught: byPlayer && (forced || Math.random() < (seen ? 0.9 : 0.55)), wasSeated: !!P.seat };
  world.setAlarm(true); standUp(); crowd.setPhase('evac');
  center('🚨 FIRE ALARM! 🚨', 'Everybody out to the front lawn!', 3, '#ff5a5a');
  sfx.gasp();
  if (byPlayer) { G.flags.prank = (G.flags.prank || 0) + 1; }
}
function endAlarm() {
  const a = alarm; alarm = null; world.setAlarm(false);
  const p = G.phase;
  if (p.kind === 'class') { crowd.setPhase('class', { day: G.dayType, slot: p.slot, visibleTest: () => true }); if (cls) { cls.attended = false; cls.alarmReturn = true; } }
  else if (p.kind === 'lunch') crowd.setPhase('lunch', { day: G.dayType });
  else if (p.kind === 'after') crowd.setPhase('after', { day: G.dayType });
  else crowd.setPhase('pass', { day: G.dayType, slot: Math.max(0, (p.next ?? 1) - 1) });
  toast('False alarm! Everyone back inside.');
  if (a.byPlayer && a.caught) officeScene('knows it was you who pulled the fire alarm', 2, 'Pulled the fire alarm');
}
function foodFight() {
  sfx.cheer(2); let n = 0;
  const iv = setInterval(() => {
    if (!G || n++ > 30) return clearInterval(iv);
    const a = pick(TABLES), b = pick(TABLES);
    world.throwAt('food', new THREE.Vector3(a.x + rnd(-2, 2), 1.2, a.z + rnd(-1, 1)), new THREE.Vector3(b.x + rnd(-2, 2), rnd(0.8, 1.6), b.z + rnd(-1, 1)), rnd(0.5, 0.9), p => sfx.splat([p.x, p.y, p.z]));
  }, 180);
}

// ------------------------------------------------------------------ things you can use (E)
const TABLE_WHO = { jocks: 'jock', popular: 'queen', nerds: 'nerd', artsy: 'artsy', gamers: 'gamer', friends: 'friend' };
function nearestUse() {
  if (!G || P.seat || scene || card) return null;
  const k = G.phase.kind;
  if (k === 'lunch' && roomAt(P.x, P.z) === 'cafeteria' && !phaseS.sat) {
    let best = null, bd = 2.7; for (const t of TABLES) { const d = Math.hypot(Math.max(0, Math.abs(P.x - t.x) - 2), P.z - t.z); if (d < bd) { bd = d; best = t; } }
    if (best && Math.hypot(P.x - -40.6, P.z - 9) > 2.4) return { id: 'table', t: best, label: `Sit with the <b>${best.name}</b>` };
  }
  let best = null, bd = 1e9;
  for (const s of SPOTS) { const d = Math.hypot(P.x - s.x, P.z - s.z); if (d < s.r && d < bd) { bd = d; best = s; } }
  if (!best) return null;
  const L = { locker: 'Open your locker', alarm: '<b style="color:#ff8a7a">Pull the fire alarm?</b>', fountain: 'Drink water', vending: 'Buy something', lunch: phaseS.ate ? 'You already got lunch' : 'Get lunch', nurse: 'Talk to the nurse', study: 'Study', board: 'Check the club sign-ups', trophy: 'Look at the trophies', mirror: 'Look in the mirror', backdoor: 'Back exit (to the field)', frontdoor: k === 'after' ? 'Go home for the day' : 'Leave school?', bleachers: 'Sit on the bleachers', secretary: 'Talk to Ms. Stamp' }[best.id];
  if (best.id === 'backdoor' || (best.id === 'lunch' && k !== 'lunch')) return null;
  return { id: best.id, s: best, label: L };
}
async function interact() {
  if (P.seat && !scene && (G.phase.kind === 'lunch' || P.seat.camMode === 'bleach')) { standUp(); return; }
  const u = nearestUse(); if (!u) return;
  const k = G.phase.kind;
  switch (u.id) {
    case 'table': {
      const t = u.t, taken = new Set([...crowd.lunchSeat.values()].map(s => s.x + ',' + s.z));
      const seat = tableSeats(t).find(s => !taken.has(s.x + ',' + s.z)) || tableSeats(t)[0];
      phaseS.sat = t.id; sitAt(seat.x, seat.z, seat.ry, { camMode: 'lunch' }); P.pose = phaseS.ate ? 'eat' : 'idle';
      if (!phaseS.ate) me.hold(null); else me.hold('food');
      const ev = pick(TABLE_EVENTS[t.id] || TABLE_EVENTS.empty), who = crowd.cast[TABLE_WHO[t.id]];
      if (t.id === 'friends') G.apply({ friend: 2 }); if (t.id === 'popular') G.apply({ pop: 1 });
      await sleep(1.2);
      const res = await decide(ev, { who: who ? who.name : t.name, color: who ? who.color : '#ffd23a', where: `LUNCH · ${t.name.toUpperCase()} TABLE` });
      afterChoice(res, 'table');
      break;
    }
    case 'lunch': {
      if (phaseS.ate) { toast('You already have lunch!'); return; }
      const lady = crowd.staff.lunch; lady.g.talk(1.5); sfx.talk([lady.x, 1.4, lady.z], 1.2, 5);
      const res = await decide(LUNCH_MENU, { who: 'Miss Gloop', color: '#f4a8a0', where: 'LUNCH LINE', lunch: true });
      if (res.choice.cost || res.choice.food) { phaseS.ate = true; me.hold('tray'); sfx.tray([P.x, 1, P.z]); sfx.register(); }
      break;
    }
    case 'locker': {
      if (phaseS.locker) { sfx.locker(true, [P.x, 1, P.z]); toast('SLAM! Very satisfying.'); return; }
      phaseS.locker = true; sfx.locker(false, [P.x, 1, P.z]);
      const res = await decide({ text: 'Your locker. Stickers of googly eyes everywhere. Your books are in there somewhere.', choices: [
        { t: 'Grab your books for class', g: 1, e: { grades: 1 }, r: 'Prepared. Nice.' },
        { t: 'Grab a snack you hid in there', g: 0, e: { energy: 6 }, r: 'Crunchy crackers from… last month?' },
        { t: 'Slam it as loud as you can', g: -1, e: { pop: 1, conduct: -2 }, r: 'SLAM! Everyone in the hallway jumps.' },
      ] }, { who: 'YOUR LOCKER', where: 'HALLWAY', kind: 'plain' });
      if (res.choice.t.startsWith('Slam')) sfx.locker(true, [P.x, 1, P.z]);
      break;
    }
    case 'alarm': {
      const res = await decide({ text: 'A red fire alarm. "PULL IN CASE OF FIRE." There is no fire.', choices: [
        { t: 'PULL IT', g: -2, e: { pop: 6, conduct: -20 }, r: 'BRRRRRING!!! Oh no. Oh no no no.' },
        { t: 'Walk away', g: 2, e: {}, r: 'Good call. That thing is for real emergencies.' },
      ] }, { who: 'FIRE ALARM', color: '#ff3a3a', where: 'HALLWAY' });
      if (res.i === 0) { sfx.alarmPull(); fireAlarm(true); }
      break;
    }
    case 'fountain': { if (phaseS.drank) { toast('You\'re not thirsty anymore.'); return; } phaseS.drank = true; sfx.water([P.x, 1, P.z]); const d = G.apply({ energy: 4 }); showResult(0, 'Cold, refreshing water.', d, 0, true); break; }
    case 'vending': {
      const res = await decide({ text: 'The vending machine hums. Everything costs $2.', choices: [
        { t: 'Chips ($2)', g: 0, cost: 2, e: { energy: 8 }, r: 'Crunch.' },
        { t: 'Soda ($2)', g: -1, cost: 2, e: { energy: 12 }, r: 'Sugar rush incoming.' },
        { t: 'Water ($2)', g: 1, cost: 2, e: { energy: 6 }, r: 'Healthy!' },
        { t: 'Kick it for free stuff', g: -2, e: { conduct: -5 }, risk: { p: 0.5, e: { conduct: -5 }, det: 1, r: 'Mr. Mop saw that. Detention.' }, r: 'A bag of pretzels falls out. Crime pays?' },
      ] }, { who: 'VENDING MACHINE', color: '#3a8aff', where: 'STUDENT LOUNGE' });
      if (res.i !== undefined && res.i < 3) { sfx.vend([P.x, 1, P.z]); if (res.i === 1) setTimeout(() => sfx.canOpen(), 1200); }
      break;
    }
    case 'nurse': {
      const nu = crowd.staff.nurse; nu.g.talk(1.5); sfx.talk([nu.x, 1.4, nu.z], 1.1, 5);
      const res = await decide({ text: 'Nurse Bandage: "What seems to be the problem, sweetie?"', choices: [
        { t: G.energy < 35 ? 'I\'m exhausted, can I lie down?' : 'I feel fine, just saying hi', g: 1, e: G.energy < 35 ? { energy: 18 } : { conduct: 1 }, r: G.energy < 35 ? 'You nap for ten minutes on the crinkly paper bed.' : '"Well aren\'t you sweet!"' },
        { t: 'Fake a stomach ache to skip class', g: -2, e: { energy: 8 }, risk: { p: 0.5, e: { conduct: -6 }, r: '"Your temperature is perfect and you\'re eating a granola bar." Back to class.' }, r: 'You get to lie down. You are officially "sick."', flags: { sickPass: 1 } },
        { t: 'Never mind', g: 0, e: {}, r: 'You back out slowly.' },
      ] }, { who: 'Nurse Bandage', color: '#ffc8d8', where: "NURSE'S OFFICE" });
      if (res.choice.flags?.sickPass && !res.caught) { G.flags.excused = `${G.year}-${G.day}`; toast('You\'re excused from the rest of today\'s classes. (Your grades won\'t like it.)'); }
      break;
    }
    case 'study': {
      if (phaseS.studied) { toast('You already studied this period.'); return; }
      phaseS.studied = true;
      const res = await decide({ text: 'A quiet table in the library. Mrs. Shush watches over her glasses.', choices: [
        { t: 'Study hard for an hour', g: 2, e: { grades: 3, energy: -6 }, r: 'Your brain grows three sizes.' },
        { t: 'Read comics', g: 0, e: { energy: 4, english: 1 }, r: 'Technically reading.' },
        { t: 'Nap on a pile of books', g: -1, e: { energy: 12 }, r: 'Mrs. Shush: "SHHH." (You were snoring.)' },
        { t: 'Build a book fort', g: -1, e: { pop: 2, conduct: -3 }, r: 'It\'s magnificent. Mrs. Shush is furious.' },
      ] }, { who: 'LIBRARY', color: '#3a8a5a', where: 'LIBRARY' });
      if (res.i === 0) sfx.write();
      break;
    }
    case 'board': {
      const opts = [];
      if (!G.flags.team) opts.push({ t: '🏀 Join the basketball team', g: 1, e: { pe: 3, pop: 3 }, flags: { team: 1 }, r: 'You write your name down. Coach Whistle will be in touch.' });
      if (!G.flags.artclub) opts.push({ t: '🎨 Join art club', g: 1, e: { art: 4 }, flags: { artclub: 1, artshow: 1 }, r: 'Art club meets Thursdays. Snacks provided.' });
      if (!G.flags.chess) opts.push({ t: '♟ Join chess club', g: 1, e: { math: 3 }, flags: { chess: 1 }, r: 'Milo does a little dance when he sees your name.' });
      if (!G.flags.drama) opts.push({ t: '🎭 Join drama club', g: 1, e: { english: 2, pop: 2 }, flags: { drama: 1 }, r: 'You\'ll be great in the talent show.' });
      opts.push({ t: 'Draw a mustache on the flyers', g: -1, e: { pop: 1, conduct: -2 }, r: 'Every flyer now has a mustache.' });
      opts.push({ t: 'Walk away', g: 0, e: {}, r: 'Maybe later.' });
      await decide({ text: 'The club sign-up board. Colorful flyers everywhere.', choices: opts.slice(0, 4).concat(opts.length > 4 ? [opts[opts.length - 1]] : []) }, { who: 'CLUB SIGN-UPS', where: 'HALLWAY' });
      break;
    }
    case 'trophy': toast('State Champs 2019! Regional Champs 2022! A dusty trophy for "Best Googly Eyes, 1987".', 4); break;
    case 'mirror': { const d = phaseS.mirror ? [] : G.apply({ pop: 1 }); phaseS.mirror = true; showResult(0, `Looking good, ${G.name}. Your googly eyes are extra googly today.`, d, 0, true); break; }
    case 'secretary': toast(k === 'class' ? 'Ms. Stamp: "Shouldn\'t you be in class?"' : 'Ms. Stamp: "Need a late pass? No? Then shoo!"', 3); break;
    case 'bleachers': sitAt(P.x, -10.9, 0, { seatH: 0.45, camMode: 'bleach' }); break;
    case 'frontdoor': {
      if (k === 'after') { const res = await decide({ text: 'Head home for the day?', choices: [{ t: 'Go home', g: 0, e: {}, r: 'See you tomorrow, Googly High.' }, { t: 'Stay a bit longer', g: 0, e: {}, r: '' }] }, { who: 'FRONT DOORS', kind: 'plain' }); if (res.i === 0) { phaseS.wentHome = true; G.pt = G.phase.dur; } return; }
      const res = await decide({ text: 'The front doors. Sunshine. Freedom. Nobody would notice… right?', choices: [
        { t: 'Leave school (skip the rest of today)', g: -2, e: { pop: 3, energy: 10 }, risk: { p: 0.4, e: { conduct: -10 }, det: 1, r: 'Ms. Stamp sees you through the office window. Detention.' }, r: 'You walk right out the front door.' },
        { t: 'Stay', g: 1, e: {}, r: 'Responsible. Boring. Correct.' },
      ] }, { who: 'FRONT DOORS', where: 'LOBBY' });
      if (res.i === 0) { phaseS.wentHome = true; G.flags.leftEarly = `${G.year}-${G.day}`; await fade(() => placePlayer(FRONT_DOOR.x, 32, 0)); }
      break;
    }
  }
}
function jump() { if (P.seat || scene || !P.onGround) return; P.vy = 4.6; P.onGround = false; sfx.jump([P.x, 0, P.z]); me.hop(); }

// ------------------------------------------------------------------ the big nights (in the gym)
const EVENT_TITLE = { dance: '🪩 HOMECOMING DANCE', election: '🗳 CLASS ELECTION', talent: '⭐ TALENT SHOW', game: '🏀 CHAMPIONSHIP GAME', prom: '✨ PROM NIGHT', grad: '🎓 GRADUATION' };
async function startEvent(kind) {
  scene = 'event'; phaseS.event = kind;
  const onTeam = !!G.flags.team;
  center(EVENT_TITLE[kind], kind === 'grad' ? 'The Class of Googly High' : 'That evening…', 2.6, '#ffe07a');
  await fade(() => {
    standUp();
    world.setEvent(kind === 'game' ? null : kind === 'election' ? 'election' : kind);
    world.setTime(0.95);
    crowd.setPhase(kind, { team: onTeam ? [crowd.cast.jock] : [], visibleTest: () => false });
    if (kind === 'prom') restyle({ formal: true, flower: '#ff5a8a' });
    if (kind === 'grad') { restyle({ gown: '#1f4fa8' }); for (const p of crowd.students) p.g.dress({ ...p.g.look, gown: '#1f4fa8' }); }
    if (kind === 'dance' || kind === 'prom') { placePlayer(60, 4, Math.PI); P.pose = 'idle'; }
    if (kind === 'election' || kind === 'talent') { sitAt(60, 12.4, Math.PI, { stand: true, camMode: 'stage' }); P.y = STAGE.h; }
    if (kind === 'game') { if (onTeam) sitAt(60, 0, -Math.PI / 2, { stand: true, camMode: 'court' }); else sitAt(60, -10.9, 0, { seatH: 0.45, camMode: 'bleach' }); world.setScore(48, 48, 'GOOGLIES', 'EYEBALLS', '0:10'); }
    if (kind === 'grad') { sitAt(53.4 + 5 * 1.2, 1, Math.PI, { camMode: 'grad' }); }
  });
  music.play(kind === 'election' ? 'after' : kind === 'talent' ? 'menu' : kind);
  if (kind === 'game') sfx.cheer(2);
  await sleep(1.6);
  if (kind === 'grad') return graduation();
  let dec = SPECIAL[kind];
  if (kind === 'game' && !onTeam) dec = { text: 'THE CHAMPIONSHIP GAME. You\'re in the stands. Googlies vs. the Eastside Eyeballs, tied at 48.', choices: SPECIAL.game.watch };
  const res = await decide(dec, { who: EVENT_TITLE[kind], color: '#ffd23a', where: `YEAR ${G.year} · DAY ${G.day}` });
  const ch = res.choice;
  if (kind === 'dance' || kind === 'prom') {
    if (ch.dance && !res.failed) { P.pose = 'dance'; if (ch.t.includes('{crush}') || ch.t.includes(CAST.crush.name)) { const c = crowd.cast.crush; c.goTo(P.x + 0.9, P.z - 0.4, { pose: 'dance', ry: -Math.PI / 2 }); } if (ch.t.includes('friends')) { const f = crowd.cast.friend; f.goTo(P.x - 0.9, P.z, { pose: 'dance' }); } }
    if (ch.det) { world.burst('confetti', new THREE.Vector3(P.x, 3, P.z), 80); sfx.gasp(); }
    if (kind === 'prom') { await sleep(6); await crowning(); }
  }
  if (kind === 'election') {
    const votes = G.pop * (ch.vote || 1) + rnd(0, 25) + (G.flags.hero ? 8 : 0);
    G.flags.president = votes >= 62 ? 1 : 0; G.flags.electionDone = 1;
    ch.g >= 1 ? sfx.applause(3) : ch.g < 0 ? sfx.boo() : sfx.applause(1);
  }
  if (kind === 'talent') {
    if (ch.perform === 'sing') { me.hold('mic'); P.pose = 'talk'; } else if (ch.perform === 'eyes') { me.spin(); P.pose = 'cheer'; } else if (ch.perform === 'joke') { P.pose = 'talk'; setTimeout(() => sfx.laugh(10), 900); }
    await sleep(2);
    const win = ch.perform && !res.failed && G.pop + rnd(0, 40) > 70;
    if (win) { G.flags.talentWin = 1; center('🏆 WINNER!', `${G.name} wins the Googly Talent Show!`, 3.5, '#ffe07a'); sfx.cheer(2); world.burst('confetti', new THREE.Vector3(60, 5, 12), 120); }
    else if (ch.perform) { sfx.applause(2); toast('You came in 3rd place. Not bad!'); }
  }
  if (kind === 'game') {
    const won = onTeam ? !res.failed : Math.random() < 0.6;
    await sleep(1.4);
    if (won) { G.flags.champ = onTeam ? 1 : G.flags.champ; world.setScore(onTeam && ch.t.startsWith('Take') ? 50 : onTeam && ch.t.includes('half') ? 51 : 50, 48, 'GOOGLIES', 'EYEBALLS', 'FINAL'); sfx.swish(); setTimeout(() => sfx.cheer(3), 300); world.burst('confetti', new THREE.Vector3(60, 6, 0), 150); center('GOOGLIES WIN!', 'CHAMPIONS!', 3.5, '#ffe07a'); for (const p of crowd.students) p.pose = 'cheer'; }
    else { world.setScore(48, 50, 'GOOGLIES', 'EYEBALLS', 'FINAL'); sfx.boo(); center('EYEBALLS WIN', 'So close…', 3, '#ff9a8a'); for (const p of crowd.students) p.pose = 'sad'; }
  }
  afterChoice(res, kind);
}
async function crowning() {
  const score = G.pop + (G.flags.royalty ? 15 : 0) + rnd(0, 20) + (G.rel.crush > 70 ? 5 : 0);
  center(`AND YOUR PROM ${G.gender === 'boy' ? 'KING' : 'QUEEN'} IS…`, '', 2.4, '#ffe07a'); sfx.pa();
  await sleep(2.6);
  if (score >= 88) { G.flags.royalty = 2; restyle({ formal: true, crown: true, flower: '#ff5a8a' }); center(`👑 ${G.name.toUpperCase()}! 👑`, 'The whole gym goes wild!', 4, '#ffe07a'); sfx.cheer(3); world.burst('confetti', new THREE.Vector3(P.x, 4, P.z), 120); G.record(`Crowned Prom ${G.gender === 'boy' ? 'King' : 'Queen'}`, 2, 'Prom'); }
  else { center(`👑 ${CAST.queen.name.toUpperCase()}! 👑`, 'Everybody claps. You clap too.', 3.5, '#ffe07a'); sfx.applause(2); }
}
async function graduation() {
  const end = G.ending(false);
  const pr = crowd.staff.principal; pr.place(62.5, 12.2, { ry: Math.PI, pose: 'talk' });
  pr.g.talk(4); sfx.talk([62.5, 2, 12], 0.7, 12);
  center('CLASS OF GOOGLY HIGH', 'Principal Googlesworth reads the names…', 3.5, '#ffe07a');
  await sleep(4);
  if (!end.graduated) {
    center('Your name isn\'t called…', `GPA ${end.gpa.toFixed(2)} — not enough for a diploma.`, 5, '#ff9a8a'); music.play('sad'); P.pose = 'sad';
    await sleep(5); return finishGame(end);
  }
  center(`"…${G.name.toUpperCase()}!"`, 'Walk the stage!', 2.6, '#ffe07a'); sfx.cheer(2);
  P.seat = null; scene = 'walk';
  P.auto = [{ x: 58.2, z: 3 }, { x: 58.2, z: 9.6 }, { x: 60, z: 9.9 }, { x: 60, z: 11.3, y: STAGE.h }, { x: 61.6, z: 12.2, y: STAGE.h }];
  await new Promise(r => { P.autoDone = r; });
  P.yaw = Math.PI / 2; me.hold('diploma'); sfx.flash(); world.burst('sparkle', new THREE.Vector3(P.x, 2, P.z), 30);
  const res = await decide({ text: 'Principal Googlesworth hands you your diploma. The whole school is watching.', choices: [
    { t: 'Shake his hand and smile for the photo', g: 2, e: {}, r: 'Click! A perfect photo for the yearbook.' },
    { t: 'Dab', g: 0, e: { pop: 3 }, r: 'The crowd laughs. Your mom cringes. Classic.' },
    { t: 'Give a surprise thank-you speech', g: 1, e: { pop: 4 }, r: `You thank ${CAST.friend.name}, your teachers, and even Mr. Mop. People cry.` },
    { t: 'Moonwalk off the stage', g: -1, e: { pop: 5 }, r: 'You moonwalk right off the edge. You\'re fine. Everyone saw.' },
  ] }, { who: '🎓 GRADUATION', color: '#ffd23a', where: 'YOUR BIG MOMENT' });
  sfx.flash();
  if (res.i === 1) me.spin(); if (res.i === 3) P.y = 0;
  await sleep(2.5);
  center('🎓 CONGRATULATIONS, GRADUATES! 🎓', 'Throw your caps!', 4, '#ffe07a');
  world.burst('caps', new THREE.Vector3(58, 1.8, -2), 40); world.burst('confetti', new THREE.Vector3(60, 6, 0), 160); sfx.capToss();
  for (const p of crowd.students) { p.seat = false; p.pose = 'cheer'; p.g.hop(); }
  P.pose = 'cheer';
  await sleep(5);
  finishGame(G.ending(false));
}

// ------------------------------------------------------------------ nights, report cards, suspensions
function overlayCard(html, buttons) {
  overlay = true; unlock();
  const c = $('over-card'); c.innerHTML = html;
  const row = document.createElement('div'); row.className = 'row';
  return new Promise(res => {
    buttons.forEach(([label, cls, v], i) => { const b = document.createElement('button'); b.className = `big ${cls}${i === 0 ? ' primary' : ''}`; b.textContent = label; b.onclick = () => { sfx.click(); $('scr-over').classList.add('hidden'); overlay = false; res(v); }; row.appendChild(b); });
    c.appendChild(row); $('scr-over').classList.remove('hidden');
    if (AUTO) setTimeout(() => row.firstChild?.click(), 700 / SPEED + 300);
  });
}
async function endOfDay() {
  if (G.phase.kind === 'after') endPhase();
  scene = null; standUp(); world.setEvent(null); restyle();
  for (const p of crowd.students) if (p.g.look.gown) p.g.dress({ ...p.g.look, gown: undefined });
  overlay = true; unlock(); music.play('night');
  $('fade').style.opacity = 0.85;
  G.apply({ energy: 14, money: 5 });
  const res = await decide(NIGHT, { who: '🌙 TONIGHT AT HOME', color: '#8a9aff', where: `YEAR ${G.year} · DAY ${G.day}`, kind: 'night' });
  await sleep(2.6);
  $('fade').style.opacity = 0; overlay = false;
  // too many detentions: suspended for a day
  let suspended = false;
  if (G.det >= 3) {
    suspended = true; G.suspensions++; G.det = 0;
    G.apply({ grades: -4, energy: 10 });
    G.record('Got suspended', -2, 'Principal');
    if (G.suspensions >= 3) { music.play('sad'); await overlayCard(`<div class="bigemoji">🚫</div><h2>EXPELLED</h2><p class="sub">That was your third suspension. Principal Googlesworth calls your parents. Your locker is cleaned out.</p>`, [['SEE YOUR YEARBOOK', 'red', 1]]); return finishGame(G.ending(true)); }
    music.play('sad');
    await overlayCard(`<div class="bigemoji">🏠</div><h2>SUSPENDED</h2><p class="sub">Three detentions = one suspension. You spend tomorrow at home with no phone while your mom gives you The Look.</p><p><b>Suspension ${G.suspensions} of 3.</b> One more… and one more after that… and you're expelled.</p>`, [['OKAY…', 'red', 1]]);
  }
  let r = G.nextDay();
  if (suspended) { if (r === 'year') await reportCard(G.year - 1); const r2 = G.nextDay(); if (r2 === 'year') r = 'year'; else if (r !== 'year') r = r2; }
  if (r === 'year') await reportCard(G.year - 1);
  if (G.year > YEARS) return finishGame(G.ending(false));
  if (r === 'year') crowd.assign(G.year, { A: ['math', 'english', 'science'], B: ['history', 'art', 'pe'] });
  saveNow();
  beginPhase();
}
async function reportCard(year) {
  music.play('menu');
  const rows = SUBJECTS.map(s => { const v = G.grades[s], L = letter(v); return `<tr><td>${SUBJECT_NAME[s]}</td><td><div class="bar"><div><i style="width:${v}%;background:${v >= 80 ? '#7dff9a' : v >= 70 ? '#ffe07a' : '#ff7a7a'}"></i></div></div></td><td class="pct">${Math.round(v)}%</td><td class="L ${L}">${L}</td></tr>`; }).join('');
  const t = G.tally(), yl = G.log.filter(e => e.y === year), yb = yl.filter(e => e.g >= 2).length, yw = yl.filter(e => e.g <= -2).length;
  G.history.push({ year, gpa: G.gpaExact(), pop: G.pop });
  return overlayCard(`<div class="bigemoji">📬</div><h2>YEAR ${year} REPORT CARD</h2>
    <table class="rc"><tr><th>SUBJECT</th><th></th><th></th><th>GRADE</th></tr>${rows}</table>
    <div class="rcsum"><div><b>${G.gpaExact().toFixed(2)}</b>GPA</div><div><b>${G.popLabel()}</b>Popularity</div><div><b>${G.tardies}</b>Tardies</div><div><b>${G.skips}</b>Skipped</div><div><b>${G.detTotal}</b>Detentions</div><div><b class="gd">${yb}</b>Best this year</div><div><b class="bd">${yw}</b>Worst this year</div></div>
    <p class="sub">${year < YEARS ? `Summer vacation! See you in ${YEAR_NAME[year + 1]}.` : ''}</p>`, [[year < YEARS ? `START YEAR ${year + 1}` : 'CONTINUE', 'green', 1]]);
}
function showReport() {
  if (card || overlay) return;
  const rows = SUBJECTS.map(s => { const v = G.grades[s], L = letter(v); return `<tr><td>${SUBJECT_NAME[s]}</td><td class="pct">${Math.round(v)}%</td><td class="L ${L}">${L}</td></tr>`; }).join('');
  const t = G.tally();
  paused = true;
  overlayCard(`<h2>${G.name.toUpperCase()} · ${YEAR_NAME[G.year].toUpperCase()}</h2><table class="rc">${rows}</table>
    <div class="rcsum"><div><b>${G.gpaExact().toFixed(2)}</b>GPA</div><div><b>${G.popLabel()}</b>Popularity</div><div><b>${Math.round(G.conduct)}</b>Conduct</div><div><b>${G.det}</b>Detentions owed</div><div><b>${G.suspensions}/3</b>Suspensions</div><div><b class="gd">${t.best}</b>Best decisions</div><div><b class="bd">${t.worst}</b>Worst decisions</div></div>
    <p class="tiny">${CAST.friend.name}: ${friendWord(G.rel.friend)} · ${CAST.crush.name}: ${crushWord(G.rel.crush)} · ${CAST.bully.name}: ${bullyWord(G.rel.bully)}</p>`, [['BACK TO SCHOOL', 'green', 1]]).then(() => { paused = false; if (wantsLock()) askLock(); });
}
const friendWord = v => v >= 85 ? 'best friends forever' : v >= 65 ? 'close friends' : v >= 40 ? 'friends' : v >= 20 ? 'drifting apart' : 'not talking to you';
const crushWord = v => v >= 80 ? 'totally into you' : v >= 55 ? 'likes you' : v >= 35 ? 'thinks you\'re nice' : v >= 15 ? 'barely knows you' : 'avoiding you';
const bullyWord = v => v >= 70 ? 'out to get you' : v >= 40 ? 'annoyed by you' : v >= 15 ? 'leaves you alone' : 'sort of a friend';
// ------------------------------------------------------------------ the yearbook
async function finishGame(end) {
  scene = 'end'; overlay = true; cls = null; card = null; cardQueue.length = 0;
  store.del('save');
  music.play(end.sad ? 'sad' : 'grad');
  // a yearbook photo: your googly, up close
  const photo = snapPhoto(end.sad);
  $('yb-photo').src = photo;
  $('yb-name').textContent = G.name;
  $('yb-super').textContent = `"${end.superl}"`;
  $('yb-future').textContent = `Where are they now? ${end.future}`;
  $('yb-title').textContent = end.title; $('yb-title').className = end.sad ? 'sad' : '';
  $('yb-sub').textContent = end.sub;
  const stats = [['GPA', end.gpa.toFixed(2)], ['Popularity', G.popLabel()], ['Decision grade', end.dgrade], ['Best', end.tally.best], ['Worst', end.tally.worst], ['Detentions', G.detTotal], ['College', end.college]];
  $('yb-stats').innerHTML = stats.map(([a, b]) => `<div><b>${b}</b>${a}</div>`).join('');
  $('yb-awards').innerHTML = end.awards.map(([e, t, s]) => `<div class="award">${e} ${t}<small>${s}</small></div>`).join('') || '<div class="award">🙂 Survived high school<small>That counts!</small></div>';
  const decs = (list, empty) => list.length ? list.map(e => `<div class="dec">${e.text}<small>Year ${e.y}, Day ${e.d} · ${e.where}</small></div>`).join('') : `<div class="dec">${empty}</div>`;
  $('yb-best').innerHTML = decs(end.best, 'None! Not a single best decision.');
  $('yb-worst').innerHTML = decs(end.worst, 'None! A perfect angel.');
  show('scr-end'); $('hud').classList.add('hidden'); $('result').classList.add('hidden'); $('card').classList.add('hidden'); resultT = 0;
  if (!end.sad) sfx.cheer(1);
}
function snapPhoto(sad) {
  // a school-picture-day photo: you, in front of the lockers
  const c = world.camera, old = { p: c.position.clone(), q: c.quaternion.clone(), fov: c.fov, asp: c.aspect };
  const hidden = []; for (const o of world.actors.children) if (o !== me.group && o.visible) { o.visible = false; hidden.push(o); }
  const mp = me.group.position.clone(), mr = me.group.rotation.y;
  me.group.position.set(-2, 0, -1.4); me.group.rotation.y = 0; marker.visible = false;
  for (let i = 0; i < 20; i++) me.update(0.03, { pose: sad ? 'sad' : 'idle' });
  c.position.set(-2, 1.3, 1.5); c.lookAt(-2, 1.05, -1.4); c.fov = 34; c.aspect = 1; c.updateProjectionMatrix();
  world.update(0.016, T, c);
  const r = world.renderer, size = r.getSize(new THREE.Vector2()), s = Math.min(size.x, size.y);
  r.setViewport((size.x - s) / 2, (size.y - s) / 2, s, s); world.render();
  const tmp = document.createElement('canvas'); tmp.width = tmp.height = 512;
  const dpr = r.getPixelRatio(); tmp.getContext('2d').drawImage(r.domElement, (size.x - s) / 2 * dpr, (size.y - s) / 2 * dpr, s * dpr, s * dpr, 0, 0, 512, 512);
  r.setViewport(0, 0, size.x, size.y); c.position.copy(old.p); c.quaternion.copy(old.q); c.fov = old.fov; c.aspect = old.asp; c.updateProjectionMatrix();
  me.group.position.copy(mp); me.group.rotation.y = mr; for (const o of hidden) o.visible = true;
  return tmp.toDataURL('image/jpeg', 0.9);
}
$('yb-again').onclick = () => { location.href = location.pathname + '?new=1'; };
$('yb-title-b').onclick = () => { location.href = location.pathname; };

// ------------------------------------------------------------------ saving (every 30 seconds)
let saveT = 30;
function saveNow() { if (!G || scene === 'end') return; try { store.set('save', G.save()); } catch { } const s = $('saved'); s.style.opacity = 1; setTimeout(() => s.style.opacity = 0, 1300); }

// ------------------------------------------------------------------ what to do now, and where
function objective() {
  const p = G.phase, sp = G.special;
  if (scene === 'office') return { text: 'In the <b>principal\'s office</b>…' };
  if (alarm) return { text: '🚨 <b>Fire alarm!</b> Get out to the front lawn.', target: { x: -12, z: 24 } };
  if (scene === 'event' || scene === 'walk') return { text: `<b>${EVENT_TITLE[phaseS.event] || ''}</b>` };
  if (p.kind === 'free') {
    const subj = G.subjectFor(p.next), r = ROOMS[SUBJECT_ROOM[subj]];
    const t = p.dur - G.pt;
    return { text: `Get to <b>${SUBJECT_NAME[subj]}</b> — ${r.label.split(' · ')[0]}<br><small>Bell in ${Math.ceil(t)}s</small>`, target: r.in };
  }
  if (p.kind === 'class' && cls) {
    const r = ROOMS[cls.room];
    if (cls.attended) return { text: `In <b>${SUBJECT_NAME[cls.subject]}</b>${cls.test ? ' — <b style="color:#ff9a8a">TEST</b>' : ''}` };
    return { text: `<b style="color:#ff9a8a">You're LATE for ${SUBJECT_NAME[cls.subject]}!</b><br><small>${r.label} · or skip it (don't get caught)</small>`, target: r.in, late: true };
  }
  if (p.kind === 'lunch') {
    if (!phaseS.ate) return { text: '<b>Lunch</b>: get food from the lunch line', target: { x: -40.6, z: 9 } };
    if (!phaseS.sat) return { text: '<b>Lunch</b>: pick a table to sit at', target: AUTO ? { x: -35.2, z: 13.9 } : { x: -32.5, z: 12 } };
    return { text: `Eating lunch with the <b>${TABLES.find(t => t.id === phaseS.sat)?.name}</b> <small>(E to get up)</small>` };
  }
  if (p.kind === 'after') {
    if (G.det > 0 && !phaseS.detDone) return { text: `<b style="color:#ff9a8a">DETENTION</b> — Room 106<br><small>Skip it and you get another one</small>`, target: ROOMS.detention.in };
    if (phaseS.detIn) return { text: 'Serving <b>detention</b>. Tick… tock…' };
    return { text: '<b>After school</b>: clubs (sign-up board), the library, the gym — or go home', target: null };
  }
  return { text: '' };
}
// the gold marker floating over where you need to go
const marker = textSprite('▼', { size: 90, color: '#ffd23a', bg: null, pad: 4 });
marker.material.depthTest = false; marker.renderOrder = 20; marker.scale.multiplyScalar(0.8); world.scene.add(marker);
let hudT = 0;
function updateHUD(force = false) {
  if (!G) return;
  hudT -= 1; if (hudT > 0 && !force) return; hudT = 6;
  const p = G.phase;
  $('c-year').textContent = `${YEAR_NAME[G.year].toUpperCase()} · DAY ${G.day}/${DAYS}`;
  $('c-time').textContent = fmtClock(G.clockMinutes());
  const ph = p.kind === 'class' ? `${p.label.toUpperCase()} · ${SUBJECT_NAME[G.subjectFor(p.slot)].toUpperCase()}${G.isTest(p.slot) ? ' TEST' : ''}` : p.label.toUpperCase();
  $('c-phase').textContent = ph;
  const o = objective();
  $('c-phase').className = o.late ? 'late' : '';
  $('c-left').textContent = `HIGH SCHOOL LEFT ${fmtLeft(G.timeLeft())}`;
  $('o-text').innerHTML = o.text;
  const sched = [0, 1, 2].map(i => { const st = G.attended[i], cur = p.kind === 'class' && p.slot === i; return `<div class="${st === 'skip' ? 'skip' : st === 'late' ? 'late' : st ? 'done' : cur ? 'now' : ''}">${st === 'skip' ? '✗' : st ? '✓' : cur ? '▶' : '·'} P${i + 1} ${SUBJECT_NAME[G.subjectFor(i)]}${G.isTest(i) ? ' (test)' : ''}</div>`; });
  sched.splice(2, 0, `<div class="${G.pi > 4 ? 'done' : G.pi === 4 ? 'now' : ''}">${G.pi > 4 ? '✓' : G.pi === 4 ? '▶' : '·'} Lunch</div>`);
  if (G.special.after) sched.push(`<div class="${G.pi === 7 ? 'now' : ''}">★ ${EVENT_NAME[G.special.after]}</div>`);
  $('o-sched').innerHTML = sched.join('');
  $('s-gpa').textContent = G.gpaExact().toFixed(2); $('s-money').textContent = '$' + G.money;
  const bar = (id, v) => { const el = $(id); el.querySelector('i').style.width = v + '%'; el.querySelector('b').textContent = Math.round(v); el.classList.toggle('low', v < 20); };
  bar('b-pop', G.pop); bar('b-conduct', G.conduct); bar('b-energy', G.energy);
  $('s-det').textContent = G.det ? `🚨 ${G.det} detention${G.det > 1 ? 's' : ''} owed${G.suspensions ? ` · ${G.suspensions}/3 suspensions` : ''}` : G.suspensions ? `${G.suspensions}/3 suspensions` : '';
  const t = G.tally(); $('t-best').textContent = t.best; $('t-worst').textContent = t.worst;
  if (!(P.seat && !P.seat.stand) && !$('classbar').classList.contains('hidden') && !(cls && cls.attended)) $('classbar').classList.add('hidden');
  if (!cls || !cls.attended) $('classbar').classList.add('hidden');
  marker.visible = !!o.target && !scene;
  if (o.target) marker.position.set(o.target.x, 2.7, o.target.z);
  const u = nearestUse();
  $('prompt').innerHTML = u && !card ? `<span class="k">E</span> ${u.label}` : P.seat && G.phase.kind === 'lunch' && !card ? '<small>Press E to get up</small>' : '';
  drawMinimap(o.target);
}
// ------------------------------------------------------------------ the minimap
const MM = { x0: -47, z0: -17, s: 2.72 }, mmCanvas = $('mm'), mmg = mmCanvas.getContext('2d');
const mmBg = (() => {
  const c = document.createElement('canvas'); c.width = 340; c.height = 150; const g = c.getContext('2d');
  const X = x => (x - MM.x0) * MM.s, Z = z => (z - MM.z0) * MM.s;
  g.fillStyle = '#2a4a2acc'; g.fillRect(0, 0, 340, 150);
  g.fillStyle = '#3a3a3ecc'; g.fillRect(X(-47), Z(30), 340, 8 * MM.s);
  g.fillStyle = '#b8b2a8aa'; g.fillRect(X(-14), Z(15), 4 * MM.s, 15 * MM.s);
  g.fillStyle = '#d8d4c8'; g.fillRect(X(HALL.x0), Z(HALL.z0), (HALL.x1 - HALL.x0) * MM.s, 6 * MM.s);
  g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const r of Object.values(ROOMS)) {
    g.fillStyle = r.color + 'cc'; g.fillRect(X(r.x0) + 0.5, Z(r.z0) + 0.5, (r.x1 - r.x0) * MM.s - 1, (r.z1 - r.z0) * MM.s - 1);
    g.fillStyle = '#fff'; g.fillText(r.name.toUpperCase(), X(r.cx), Z(r.cz));
  }
  g.fillStyle = '#1a1a1a'; g.fillText('HALLWAY', X(0), Z(0));
  return c;
})();
function drawMinimap(target) {
  const g = mmg, X = x => (x - MM.x0) * MM.s, Z = z => (z - MM.z0) * MM.s;
  g.clearRect(0, 0, 340, 150); g.drawImage(mmBg, 0, 0);
  const dot = (x, z, col, r = 3) => { g.fillStyle = col; g.beginPath(); g.arc(clamp(X(x), 3, 337), clamp(Z(z), 3, 147), r, 0, 7); g.fill(); };
  const pr = crowd.staff.principal; dot(pr.x, pr.z, '#ff3a3a', 3.4);
  const f = crowd.cast.friend; dot(f.x, f.z, '#ffb02a', 2.6);
  if (target) { const t = performance.now() / 300; g.strokeStyle = '#ffd23a'; g.lineWidth = 2; g.beginPath(); g.arc(clamp(X(target.x), 4, 336), clamp(Z(target.z), 4, 146), 5 + Math.sin(t) * 1.5, 0, 7); g.stroke(); }
  g.save(); g.translate(clamp(X(P.x), 4, 336), clamp(Z(P.z), 4, 146)); g.rotate(-P.yaw + Math.PI); g.fillStyle = '#fff'; g.strokeStyle = '#000'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -6); g.lineTo(4.5, 5); g.lineTo(-4.5, 5); g.closePath(); g.fill(); g.stroke(); g.restore();
}

// ------------------------------------------------------------------ detention
const DETENTION = { text: 'Detention. Room 106. The clock on the wall ticks very, very slowly.', choices: [
  { t: 'Do your homework quietly', g: 2, e: { grades: 2 }, r: 'You finish everything. Detention is weirdly productive.' },
  { t: 'Write "I will behave" 100 times', g: 1, e: { conduct: 5 }, r: 'Your hand hurts. Principal Googlesworth nods approvingly.' },
  { t: 'Sneak out the window', g: -2, e: { pop: 3 }, escape: true, risk: { p: 0.5, e: { conduct: -10 }, det: 2, r: 'You get stuck halfway through the window. Two more detentions.' }, r: 'You squeeze out and run. Freedom!' },
  { t: 'Doodle googly eyes on the desk', g: -1, e: { art: 1, conduct: -3 }, r: 'Very artistic. Very against the rules.' },
] };
async function detention() {
  phaseS.detIn = true;
  const s = classSeats('detention')[2];
  await fade(() => sitAt(s.x, s.z + 0.18, Math.PI, { board: 'detention' }));
  music.play('trouble');
  await sleep(2.5);
  const res = await decide(DETENTION, { who: 'DETENTION', color: '#6a6a6a', where: 'ROOM 106' });
  if (res.choice.escape) { if (!res.caught) { phaseS.detDone = true; G.det = Math.max(0, G.det - 1); } await fade(() => { standUp(); placePlayer(30, 1.6, Math.PI); }); phaseS.detIn = false; music.play('after'); }
}

// ------------------------------------------------------------------ you: walking, the camera
function updatePlayer(dt) {
  let speed = 0;
  if (P.auto && P.auto.length) {
    const w = P.auto[0], dx = w.x - P.x, dz = w.z - P.z, d = Math.hypot(dx, dz), st = 2.2 * dt;
    if (w.y !== undefined) P.y += (w.y - P.y) * Math.min(1, dt * 6);
    if (d <= st) { P.x = w.x; P.z = w.z; P.auto.shift(); if (!P.auto.length) { P.auto = null; P.autoDone?.(); } }
    else { P.x += dx / d * st; P.z += dz / d * st; P.yaw = Math.atan2(dx, dz); speed = 2.2; }
  } else if (P.seat) { P.x = P.seat.x; P.z = P.seat.z; P.yaw = P.seat.ry; }
  else if (G && !['office', 'walk', 'end'].includes(scene) && !overlay) {
    let mx = 0, mz = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1; if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mx += 1; if (keys.has('KeyD') || keys.has('ArrowRight')) mx -= 1;
    if (AUTO && !card) { const a = autopilot(); if (a) { mx = a[0]; mz = a[1]; } }
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight') || AUTO;
    const tired = G.energy < 20;
    const top = run ? (tired ? 4.6 : 6.8) : (tired ? 3.1 : 4.2);
    const fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    let vx = fx * mz + rx * mx, vz = fz * mz + rz * mx; const l = Math.hypot(vx, vz);
    if (l > 0 && !card) { vx /= l; vz /= l; P.speed += (top - P.speed) * Math.min(1, dt * 8); const want = Math.atan2(vx, vz); let dy = want - P.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; P.yaw += dy * Math.min(1, dt * 12); }
    else { P.speed *= Math.max(0, 1 - dt * 12); }
    const sp = l > 0 && !card ? P.speed : P.speed * 0.5;
    const [nx, nz] = collide(P.x + Math.sin(P.yaw) * sp * dt * (l > 0 && !card ? 1 : 0), P.z + Math.cos(P.yaw) * sp * dt * (l > 0 && !card ? 1 : 0));
    speed = Math.hypot(nx - P.x, nz - P.z) / Math.max(dt, 1e-4); P.x = nx; P.z = nz;
    if (run && l > 0) G.energy = Math.max(0, G.energy - dt * 0.12);
    // jumping
    if (!P.onGround) { P.vy -= 13 * dt; P.y += P.vy * dt; if (P.y <= 0) { P.y = 0; P.vy = 0; P.onGround = true; sfx.land(0.7, [P.x, 0, P.z]); } }
  }
  me.group.position.set(P.x, P.seat && !P.seat.stand ? Googly.seatOffset(P.seat.seatH) : P.y, P.z);
  me.group.rotation.y = P.yaw;
  me.update(dt, { speed, onGround: P.onGround, pose: P.pose !== 'idle' ? P.pose : G && G.energy < 15 && !speed ? 'slow' : 'idle', seat: !!(P.seat && !P.seat.stand) });
  P.speedNow = speed;
}
let autoPath = [], autoT = 0, autoUseT = 1;
function autopilot() {
  const o = objective(); if (!o.target) return null;
  autoT -= 1 / 60; if (autoT <= 0 || !autoPath.length) { autoT = 1; autoPath = [...routeTo(o.target.x, o.target.z)]; }
  const thr = Math.max(0.6, P.speed * (1 / 60) * SPEED * 1.6);
  while (autoPath.length && Math.hypot(autoPath[0].x - P.x, autoPath[0].z - P.z) < thr) autoPath.shift();
  if (autoPath.length === 1 && Math.hypot(autoPath[0].x - P.x, autoPath[0].z - P.z) < thr * 1.5) { P.x = autoPath[0].x; P.z = autoPath[0].z; autoPath.shift(); }
  autoUseT -= 1 / 60; if (autoUseT <= 0) { autoUseT = 1; const u = nearestUse(); if (u && ['lunch', 'table'].includes(u.id)) interact(); }
  const w = autoPath[0]; if (!w) return null;
  const dx = w.x - P.x, dz = w.z - P.z, fx = Math.sin(cam.yaw), fz = Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw), l = Math.hypot(dx, dz) || 1;
  return [(dx * rx + dz * rz) / l, (dx * fx + dz * fz) / l];
}
import { route } from './npc.js';
function routeTo(x, z) { return [...route(P.x, P.z, x, z), { x, z }]; }
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCamera(dt) {
  const c = world.camera, sens = 0.0024 * prof.sens;
  if (P.seat || scene === 'office') { cam.syaw = clamp((cam.syaw || 0) - look.dx * sens, -1.1, 1.1); cam.spitch = clamp((cam.spitch || 0) - look.dy * sens, -0.5, 0.5); }
  else { cam.yaw -= look.dx * sens; cam.pitch = clamp(cam.pitch + look.dy * sens, -0.5, 1.1); }
  look.dx = look.dy = 0;
  const mode = P.seat?.camMode || (scene === 'walk' ? 'grad' : null);
  let pos, tgt;
  if (mode === 'seat') { const r = ROOMS[P.seat.board]; pos = new THREE.Vector3(P.x + 0.75, 2.12, P.z + 1.75); tgt = new THREE.Vector3(r ? r.cx : P.x, 1.35, -12.6); }
  else if (mode === 'gym') { pos = new THREE.Vector3(P.x + 3.2, 2.3, P.z + 1.8); tgt = new THREE.Vector3(49, 1.1, -1.6); }
  else if (mode === 'lunch') { const f = new THREE.Vector3(Math.sin(P.yaw), 0, Math.cos(P.yaw)); pos = new THREE.Vector3(P.x, 1.75, P.z).addScaledVector(f, -1.9); tgt = new THREE.Vector3(P.x, 0.95, P.z).addScaledVector(f, 1.6); }
  else if (mode === 'office') { pos = new THREE.Vector3(2.6, 1.85, 7.3); tgt = new THREE.Vector3(-0.3, 0.95, 10.2); }
  else if (mode === 'stage') { pos = new THREE.Vector3(60, 2.1, 4.5); tgt = new THREE.Vector3(60, 1.9, 12.4); }
  else if (mode === 'court') { pos = new THREE.Vector3(53, 2.8, 7); tgt = new THREE.Vector3(P.x, 1, P.z); }
  else if (mode === 'bleach') { pos = new THREE.Vector3(P.x, 2.9, P.z - 2.4); tgt = new THREE.Vector3(P.x, 0.8, P.z + 8); }
  else if (mode === 'grad') { pos = new THREE.Vector3(60, 3.2, -7); tgt = scene === 'walk' ? new THREE.Vector3(P.x, 1.2, P.z) : new THREE.Vector3(60, 1.6, 10); }
  if (pos) {
    if (mode === 'seat' || mode === 'lunch' || mode === 'office') { const d = tgt.clone().sub(pos), yaw = Math.atan2(d.x, d.z) + cam.syaw, dist = d.length(), p0 = Math.asin(clamp(d.y / dist, -1, 1)) - cam.spitch; tgt = pos.clone().add(new THREE.Vector3(Math.sin(yaw) * Math.cos(p0), Math.sin(p0), Math.cos(yaw) * Math.cos(p0)).multiplyScalar(dist)); }
    camPos.lerp(pos, 1 - Math.exp(-6 * dt)); camLook.lerp(tgt, 1 - Math.exp(-6 * dt));
    if (camPos.distanceTo(pos) > 12) { camPos.copy(pos); camLook.copy(tgt); }
  } else {
    const tgt2 = new THREE.Vector3(P.x, P.y + 1.5, P.z);
    const cp = Math.cos(cam.pitch), back = new THREE.Vector3(-Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), -Math.cos(cam.yaw) * cp);
    let dist = cam.dist;
    const want = tgt2.clone().addScaledVector(back, dist);
    const b = blocked(tgt2.x, tgt2.z, want.x, want.z); if (b) dist = Math.max(0.5, dist * b - 0.25);
    const p = tgt2.clone().addScaledVector(back, dist);
    const r = roomAt(P.x, P.z); if (r !== 'outside') p.y = Math.min(p.y, (r === 'gym' ? 6.6 : H) - 0.3);
    p.y = Math.max(0.4, p.y);
    camPos.lerp(p, 1 - Math.exp(-14 * dt)); camLook.copy(tgt2);
    if (camPos.distanceTo(p) > 6) camPos.copy(p);
  }
  c.position.copy(camPos); c.lookAt(camLook);
  setListener(c.position.x, c.position.y, c.position.z, Math.atan2(camLook.x - camPos.x, camLook.z - camPos.z) + Math.PI);
}

// ------------------------------------------------------------------ every frame
let last = performance.now(), T = 0, dayEnding = false;
function gameUpdate(dt) {
  if (card?.timed && !card.done) { card.left -= dt; $('card-timer').firstChild.style.width = clamp(card.left / card.timed * 100, 0, 100) + '%'; if (card.left <= 0) choose(card.opts.kind === 'question' ? -1 : card.opts.neutral, true); }
  if (resultT > 0) { resultT -= dt; if (resultT <= 0) $('result').classList.add('hidden'); }
  if (overlay || dayEnding || scene === 'end') return;
  const clockRuns = !(card && !P.seat && G.phase.kind !== 'class') && scene !== 'office' && scene !== 'walk';
  phaseS.t += dt;
  if (clockRuns) {
    const before = G.pi, r = G.tick(dt);
    if (r === 'phase') { const now = G.pi; G.pi = before; endPhase(); G.pi = now; beginPhase(); return; }
    if (r === 'day') { dayEnding = true; endOfDay().finally(() => { dayEnding = false; }); return; }
  }
  const k = G.phase.kind;
  if ((k === 'free' || k === 'after') && phaseS.hallAt !== null && phaseS.hallAt !== undefined && phaseS.t >= phaseS.hallAt) { phaseS.hallAt = null; hallEvent(phaseS.forced === 'college' ? 'college' : phaseS.forced || null); }
  if (phaseS.news && phaseS.t >= phaseS.news) { phaseS.news = null; sfx.pa(); center('📢 ANNOUNCEMENT', `"Your new class president is… ${G.flags.president ? G.name.toUpperCase() + '!' : CAST.queen.name.toUpperCase() + '!'}"`, 4.5, '#ffe07a'); if (G.flags.president) { sfx.cheer(2); G.record('Won the class election', 2, 'Election'); } }
  if (k === 'class') updateClass(dt);
  if (k === 'class' && cls && G.flags.excused === `${G.year}-${G.day}`) cls.excused = true;
  if (k === 'after') {
    if (phaseS.eventAt && phaseS.t >= phaseS.eventAt) { phaseS.eventAt = null; startEvent(phaseS.event); }
    if (G.det > 0 && !phaseS.detIn && !phaseS.detDone && !phaseS.event && roomAt(P.x, P.z) === 'detention') detention();
    if (phaseS.detIn && G.pt >= G.phase.dur - 0.3 && !phaseS.detDone) { phaseS.detDone = true; G.det = Math.max(0, G.det - 1); toast('Detention served.'); }
  }
  if (alarm) { alarm.t -= dt; if (alarm.t <= 0) endAlarm(); }
  G.energy = Math.max(0, G.energy - dt * 0.04);
  saveT -= dt; if (saveT <= 0) { saveT = 30; saveNow(); }
  world.setTime(clamp(G.dayK(), 0, 1));
  updateHUD();
}
function updateBus(dt) {
  if (!busAnim) return;
  busAnim.t += dt;
  const b = world.bus;
  if (!busAnim.leave) { const k = Math.min(1, busAnim.t / 4); b.position.x = -80 + (1 - Math.pow(1 - k, 3)) * 61; if (k >= 1 && !busAnim.door) { busAnim.door = true; sfx.busDoor(); } if (busAnim.t > 7) busAnim = null; }
  else if (busAnim.t > 18) { b.position.x += dt * Math.min(14, (busAnim.t - 18) * 4); if (b.position.x > 80) { b.position.x = 80; busAnim = null; } }
}
function titleUpdate(dt) {
  const c = world.camera, t = T * 0.06;
  c.position.set(-9 + Math.sin(t) * 3, 1.9, 30.2 + Math.cos(t) * 0.6); c.lookAt(-10.5 + Math.sin(t) * 1.5, 1.7, 20);
  P.x = -6.6; P.z = 27; P.yaw = -0.5; P.pose = 'wave';
  me.group.position.set(P.x, 0, P.z); me.group.rotation.y = P.yaw; me.update(dt, { pose: 'wave' });
  setListener(c.position.x, c.position.y, c.position.z, 0);
}
function frame(now) {
  const rdt = Math.min(0.05, (now - last) / 1000); last = now;
  const dt = rdt * (G ? SPEED : 1); T += dt;
  if (G && !paused && !screen) { gameUpdate(dt); updatePlayer(dt); updateCamera(rdt); }
  else if (!G) titleUpdate(dt);
  else if (G && (overlay || screen)) { updateCamera(rdt); }
  updateBus(dt);
  const pr = roomAt(P.x, P.z);
  crowd.hideTags = !!(P.seat && G); crowd.update(paused || screen === 'scr-pause' ? 0 : dt, G ? P : null, G ? pr : 'outside', world.camera.position);
  world.update(rdt, T, world.camera);
  const where = !G ? 'menu' : P.seat?.camMode === 'seat' ? 'class' : pr === 'hall' || pr === 'lobby' || pr === 'lounge' ? 'hall' : pr === 'outside' ? 'outside' : pr === 'gym' ? 'gym' : pr === 'cafeteria' ? 'cafeteria' : 'class';
  ambience.update(rdt, { where, people: crowd.nearCount, alarm: !!alarm, crowd: scene === 'event' ? (phaseS.event === 'grad' || phaseS.event === 'game' ? 0.8 : 0.5) : 0, bus: Math.max(0, 1 - Math.hypot(world.bus.position.x - world.camera.position.x, world.bus.position.z - world.camera.position.z) / 50), busRev: busAnim && (busAnim.leave ? busAnim.t > 18 : busAnim.t < 4) ? 1 : 0 });
  world.render();
  if (G && !screen && !overlay && !card && !P.seat && !scene && !locked && !macLocked && !isMac && !AUTO && !Q.has('shot')) $('clickto').classList.remove('hidden'); else $('clickto').classList.add('hidden');
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ title and starting
crowd.assign(1, { A: ['math', 'english', 'science'], B: ['history', 'art', 'pe'] });
crowd.setPhase('after', { day: 'A' });
for (const p of crowd.students) { if (Math.random() < 0.5) p.place(FRONT_DOOR.x + rnd(-14, 14), rnd(18, 29), { ry: rnd(-3, 3), pose: pick(['talk', 'phone', 'idle', 'wave']) }); }
music.play('menu');
function refreshContinue() {
  const s = store.get('save', null);
  if (!s) { $('b-continue').classList.add('hidden'); return; }
  try { const g = Game.load(s); $('b-continue').classList.remove('hidden'); $('continue-sub').textContent = `${g.name} · ${YEAR_NAME[g.year]} · Day ${g.day} · GPA ${g.gpaExact().toFixed(2)}`; } catch { $('b-continue').classList.add('hidden'); }
}
refreshContinue();
$('b-start').onclick = () => {
  unlockAudio(); sfx.click();
  if (store.get('save', null) && !confirm('Start high school over? Your saved game will be erased.')) return;
  store.del('save'); newGame();
};
$('b-continue').onclick = () => { unlockAudio(); sfx.click(); const g = Game.load(store.get('save')); g.pt = 0; G = g; prof.name = g.name; startPlaying(false); };
function newGame(at = {}) {
  G = new Game({ name: prof.name || 'Googly', color: prof.color, look: myLook() }); G.gender = prof.gender;
  if (at.y) G.year = at.y; if (at.d) G.day = at.d; if (at.p !== undefined) G.pi = at.p;
  if (Q.has('rich')) { G.money = 200; G.pop = 90; for (const s of SUBJECTS) G.grades[s] = 95; G.rel.crush = 90; G.flags.team = 1; }
  if (Q.has('det')) G.det = +Q.get('det');
  startPlaying(!at.y);
}
async function startPlaying(fresh) {
  P.pose = 'idle';
  show(null); $('hud').classList.remove('hidden');
  restyle();
  crowd.assign(G.year, { A: ['math', 'english', 'science'], B: ['history', 'art', 'pe'] });
  music.play('hall');
  beginPhase();
  if (fresh && G.year === 1 && G.day === 1 && G.pi === 0) {
    await overlayCard(`<div class="bigemoji">🏫👀</div><h2>WELCOME TO GOOGLY HIGH, ${G.name.toUpperCase()}!</h2>
      <p class="sub">High school lasts <b>3 years</b> — about <b>one hour</b>. Every choice you make is graded: the <b class="gd">BEST</b> decisions and the <b class="bd">WORST</b> ones all end up in your yearbook.</p>
      <p>🔔 Get to class before the bell · 🍕 lunch in the cafeteria · 🚨 don't get caught by Principal Googlesworth<br>📖 Answer questions in class · 🎓 Graduate (or don't)</p>
      <p class="tiny kbonly">WASD walk · Shift run · Mouse look · E use / talk · 1–4 choose · Tab report card · Esc pause</p>`, [['LET\'S GO!', 'green', 1]]);
    center('YEAR 1 · DAY 1', 'First day of high school. Your first class is Math — Room 101.', 4);
  }
  if (wantsLock() && isMac) askLock();
}
if (Q.has('y') || Q.has('d') || Q.has('p')) setTimeout(() => newGame({ y: +(Q.get('y') || 1), d: +(Q.get('d') || 1), p: +(Q.get('p') || 0) }), 300);
else if (Q.has('new')) setTimeout(() => newGame(), 300);
window.__gs = { get G() { return G; }, P, crowd, world, cam, sfx, music, decide, hallEvent, fireAlarm, startEvent, officeScene, finishGame, endOfDay };
requestAnimationFrame(frame);
