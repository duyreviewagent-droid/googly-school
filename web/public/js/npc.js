// The people of Googly High: 36 students (the cast from events.js plus everyone else), the teachers, the principal,
// the coach, the lunch lady, the janitor, the librarian, the nurse and the secretary.
// Students follow the bell schedule: bus → lockers → class → hallway → class → lunch → class → home, clubs or the gym.
import * as THREE from 'three';
import { Googly, TOPS, HATS, PANTS, textSprite } from './googly.js';
import { ROOMS, HALL, classSeats, PLAYER_SEAT, TABLES, tableSeats, roomAt, gymSpots, COACH_SPOT, FRONT_DOOR, BUS_STOP, SUBJECT_ROOM, STAGE, BLEACHERS, PRINCIPAL_SEAT, OFFICE_CHAIR } from './school.js';
import { CAST } from './events.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const COLORS = ['#ff5a5a', '#ff9a3a', '#ffd23a', '#9ae83a', '#3ad8a0', '#3ab8ff', '#5a7aff', '#a85aff', '#ff5ad8', '#e8e8e8', '#8a6a4a', '#3a3a44', '#ff7a8a', '#6ae8e8', '#c8a0ff', '#f4c890'];
const NAMES = ['Ava', 'Leo', 'Zoe', 'Max', 'Ivy', 'Kai', 'Nia', 'Eli', 'Ruby', 'Omar', 'Lily', 'Finn', 'Maya', 'Theo', 'Isla', 'Jax', 'Nora', 'Sam', 'Aria', 'Ben', 'Cleo', 'Dev', 'Emi', 'Gus', 'Hana', 'Ike', 'June', 'Kip'];
const CLIQUES = ['jocks', 'popular', 'nerds', 'artsy', 'gamers', 'band', 'friends'];
const CAST_CLIQUE = { friend: 'friends', crush: 'friends', bully: 'jocks', nerd: 'nerds', queen: 'popular', jock: 'jocks', artsy: 'artsy', gamer: 'gamers' };
export const OPEN = new Set(['hall', 'lobby', 'outside', 'cafeteria', 'gym', 'lounge']);

/** The waypoints from inside a region out to the hallway (the hallway is the hub of the whole school). */
function portalsOut(region, nearX = 0) {
  if (region === 'hall') return [];
  if (region === 'outside') return [{ x: FRONT_DOOR.x, z: 17.5 }, { x: FRONT_DOOR.x, z: 13.6 }, ...portalsOut('lobby')];
  const r = ROOMS[region]; if (!r) return [];
  if (r.doors) { const d = r.doors.reduce((a, b) => Math.abs(b - nearX) < Math.abs(a - nearX) ? b : a); return [{ x: d, z: 4.4 }, { x: d, z: 1.6 }]; }
  return [r.in, r.hall];
}
export function route(fx, fz, tx, tz) {
  const rf = roomAt(fx, fz), rt = roomAt(tx, tz);
  if (rf === rt) return [];
  if ((rf === 'hall' && rt !== 'outside') || (rt === 'hall' && rf !== 'outside') || true) {
    const out = portalsOut(rf, tx), inn = portalsOut(rt, fx).slice().reverse();
    return [...out, ...inn];
  }
}

class Person {
  constructor(crowd, opts) {
    Object.assign(this, { x: 0, z: 0, yaw: 0, path: [], plan: [], speed: 1.6, pose: 'idle', seat: false, seatH: 0.46, wait: 0, ry: null, vis: true, region: 'hall', regionT: 0, shadow: true, busy: false, hide: false }, opts);
    this.g = new Googly({ color: opts.color, role: opts.role, look: opts.look || {}, name: opts.tag ? opts.name : '', tagColor: opts.tagColor, size: opts.size || 1, skin: opts.skin || 'none' });
    if (opts.prop) { this.g.hold(opts.prop); this.g.baseProp = opts.prop; }
    this.g.onStep = v => { if (this.near && crowd.onStep) crowd.onStep(this, v); };
    crowd.world.actors.add(this.g.group);
  }
  /** Walk to (x, z): through the doors if it's another room. via: extra waypoints inside the room (aisles). */
  goTo(x, z, { ry = null, sit = false, pose = 'idle', via = [], seatH = 0.46, speed = null } = {}) {
    this.path = [...route(this.x, this.z, via[0]?.x ?? x, via[0]?.z ?? z), ...via, { x, z }];
    this.ry = ry; this.sitAt = sit; this.poseAt = pose; this.seat = false; this.pose = 'idle'; this.seatH = seatH;
    if (speed) this.speed = speed;
  }
  place(x, z, { ry = null, sit = false, pose = 'idle', seatH = 0.46 } = {}) { this.x = x; this.z = z; this.path = []; this.plan = []; this.seat = sit; this.pose = pose; this.seatH = seatH; if (ry !== null) this.yaw = ry; this.ry = ry; this.region = roomAt(x, z); }
  /** A queue of steps: {x, z, ...goTo options, wait} */
  doPlan(steps) { this.plan = steps.slice(); this.nextStep(); }
  nextStep() { const s = this.plan.shift(); if (!s) return; if (s.place) { this.place(s.x, s.z, s); this.wait = s.wait || 0; return; } this.goTo(s.x, s.z, s); this.stepWait = s.wait || 0; }
  update(dt) {
    if (this.wait > 0) { this.wait -= dt; if (this.wait <= 0) this.nextStep(); }
    let speed = 0;
    if (this.path.length) {
      const p = this.path[0], dx = p.x - this.x, dz = p.z - this.z, d = Math.hypot(dx, dz);
      const step = this.speed * dt;
      if (d <= step) { this.x = p.x; this.z = p.z; this.path.shift(); if (!this.path.length) this.arrive(); }
      else { this.x += dx / d * step; this.z += dz / d * step; speed = this.speed; const want = Math.atan2(dx, dz); let dy = want - this.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; this.yaw += dy * Math.min(1, dt * 8); }
    } else if (this.ry !== null && this.ry !== undefined) { let dy = this.ry - this.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; this.yaw += dy * Math.min(1, dt * 6); }
    if (this.face) { const want = Math.atan2(this.face.x - this.x, this.face.z - this.z); let dy = want - this.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2; if (!this.path.length) this.yaw += dy * Math.min(1, dt * 6); }
    this.speedNow = speed;
    this.regionT -= dt; if (this.regionT <= 0) { this.regionT = 0.4; this.region = roomAt(this.x, this.z); }
    const G = this.g.group;
    G.position.set(this.x, this.seat ? Googly.seatOffset(this.seatH) : 0, this.z); G.rotation.y = this.yaw;
    G.visible = this.vis && !this.hide;
    if (G.visible) this.g.update(dt, { speed, pose: this.pose, seat: this.seat });
  }
  arrive() {
    if (this.sitAt) this.seat = true;
    this.pose = this.poseAt || 'idle';
    if (this.stepWait !== undefined) { this.wait = this.stepWait || 0.01; this.stepWait = undefined; }
    if (this.onArrive) { const f = this.onArrive; this.onArrive = null; f(this); }
  }
  setShadow(on) { if (on === this.shadow) return; this.shadow = on; this.g.group.traverse(o => { if (o.isMesh) o.castShadow = on; }); }
}

export class Crowd {
  constructor(world) {
    this.world = world; this.people = []; this.students = []; this.staff = {}; this.cast = {};
    // the cast
    for (const [key, c] of Object.entries(CAST)) {
      const p = new Person(this, { name: c.name, color: c.color, role: 'student', look: { ...c.look, brows: c.brows }, size: c.size, key, clique: CAST_CLIQUE[key], tag: true, speed: rnd(1.5, 1.9) });
      this.cast[key] = p; this.students.push(p);
    }
    // everyone else
    for (let i = 0; this.students.length < 36; i++) {
      const color = pick(COLORS), top = pick(COLORS);
      const p = new Person(this, { name: NAMES[i % NAMES.length], color, role: 'student', look: { top, style: pick(TOPS), hat: Math.random() < 0.45 ? pick(HATS.slice(1)) : 'none', hatColor: pick(COLORS), pants: pick(PANTS), pack: Math.random() < 0.85 ? pick(['#2a3a5a', '#8a1a2a', '#1a1a1e', '#2a6a3a', '#e8a020', '#6a3ab8']) : false, num: 1 + Math.floor(Math.random() * 40) }, clique: CLIQUES[i % CLIQUES.length], speed: rnd(1.4, 1.9), size: rnd(0.92, 1.05) });
      this.students.push(p);
    }
    // staff
    const staff = (id, o) => { const p = new Person(this, { staff: true, tag: true, ...o }); this.staff[id] = p; return p; };
    const T = { math: ['#5a8aff', { top: '#c8d8f0', tie: '#1a3a9a' }], english: ['#c88aff', { top: '#f0e0f0', tie: '#6a1a8a', cardigan: '#8a6a9a' }], science: ['#8aff9a', { top: '#ffffff', tie: '#1a7a3a' }], history: ['#ffb07a', { top: '#e8d8b8', tie: '#8a4a1a', cardigan: '#6a5040' }], art: ['#ff8ab8', { top: '#ffe8a0', tie: '#e84a8a' }] };
    for (const [k, [c, look]] of Object.entries(T)) staff(k, { name: ROOMS[k].teacher, color: c, role: 'teacher', look, speed: 1.2, tagColor: ROOMS[k].color, prop: k === 'history' ? 'book' : null });
    staff('pe', { name: 'Coach Whistle', color: '#e8b070', role: 'coach', speed: 1.8, prop: 'clipboard' });
    staff('principal', { name: 'Principal Googlesworth', color: '#8a8aa0', role: 'principal', speed: 1.5, size: 1.12, prop: 'clipboard' });
    staff('lunch', { name: 'Miss Gloop', color: '#f4a8a0', role: 'lunch', speed: 1.1 });
    staff('janitor', { name: 'Mr. Mop', color: '#7aa0c8', role: 'janitor', speed: 0.8, prop: 'mop' });
    staff('librarian', { name: 'Mrs. Shush', color: '#b8e0a0', role: 'librarian', speed: 1 });
    staff('nurse', { name: 'Nurse Bandage', color: '#ffc8d8', role: 'nurse', speed: 1 });
    staff('secretary', { name: 'Ms. Stamp', color: '#e0c890', role: 'secretary', speed: 1, look: { top: '#d88aa0' } });
    this.people = [...this.students, ...Object.values(this.staff)];
    this.bang = new Map();
    this.homeStaff();
    this.phase = null; this.t = 0;
  }
  // ------------------------------------------------------------------ where the staff live
  homeStaff() {
    const S = this.staff;
    const at = (p, x, z, o = {}) => { p.home = { x, z, ...o }; p.place(x, z, o); };
    for (const k of ['math', 'english', 'science', 'history', 'art']) at(S[k], ROOMS[k].cx - 1.6, -11.4, { ry: 0 });
    at(S.pe, COACH_SPOT.x, COACH_SPOT.z, { ry: Math.PI / 2 });
    at(S.principal, 0, PRINCIPAL_SEAT.z, { ry: 0, sit: true });
    at(S.lunch, -43.4, 9, { ry: Math.PI / 2 });
    at(S.janitor, -20, 0.5, { ry: Math.PI / 2, pose: 'mop' });
    at(S.librarian, 21, 4.1, { ry: 0 });
    at(S.nurse, 31.6, 6.4, { ry: -Math.PI / 2 });
    at(S.secretary, -3, 7.5, { ry: Math.PI, sit: true });
  }
  /** Who is in which class this year: the player's classmates are mostly the cast (their friend always). */
  assign(year, playerSubjects) {
    const rooms = ['math', 'english', 'science', 'history', 'art', 'gym'];
    this.sched = { A: [], B: [] };
    for (const day of ['A', 'B']) for (let slot = 0; slot < 3; slot++) {
      const mine = SUBJECT_ROOM[playerSubjects[day][slot]], by = new Map(rooms.map(r => [r, []]));
      const pool = this.students.slice();
      const take = p => { pool.splice(pool.indexOf(p), 1); by.get(mine).push(p); };
      take(this.cast.friend);
      for (const k of ['crush', 'bully', 'nerd', 'queen', 'jock', 'artsy', 'gamer']) if (Math.random() < (k === 'crush' ? 0.65 : 0.45)) take(this.cast[k]);
      while (by.get(mine).length < 10) take(pick(pool.filter(p => !p.key)));
      const others = rooms.filter(r => r !== mine);
      pool.forEach((p, i) => by.get(others[i % others.length]).push(p));
      const table = new Map();
      for (const [room, ps] of by) {
        if (room === 'gym') { const spots = gymSpots(); ps.forEach((p, i) => table.set(p, { room, ...spots[(i + 1) % spots.length] })); continue; }
        const seats = classSeats(room).map((s, i) => ({ ...s, i })).filter(s => s.i !== PLAYER_SEAT);
        seats.sort(() => Math.random() - 0.5);
        // the cast likes the seats near you
        const near = [8, 10, 5, 13, 6, 12, 4, 14];
        ps.sort((a, b) => (b.key ? 1 : 0) - (a.key ? 1 : 0));
        let ni = 0;
        for (const p of ps) { let s = null; if (p.key && room === mine && ni < near.length) { const want = near[ni++]; s = seats.find(q => q.i === want); } if (!s) s = seats.find(q => !q.taken); if (!s) continue; s.taken = true; table.set(p, { room, ...s }); }
      }
      this.sched[day][slot] = table;
    }
    // lunch seats by clique
    this.lunchSeat = new Map();
    const byTable = new Map(TABLES.map(t => [t.id, tableSeats(t).map(s => ({ ...s, t }))]));
    for (const p of this.students) { const seats = byTable.get(p.clique) || byTable.get('band'); const s = seats.shift() || byTable.get('empty').shift(); if (s) this.lunchSeat.set(p, s); }
  }
  seatPlan(s) {
    const r = ROOMS[s.room];
    if (s.room === 'gym') return { x: s.x, z: s.z, ry: s.ry };
    const lane = s.z + 0.72;
    return { x: s.x, z: s.z + 0.18, ry: Math.PI, sit: true, via: [{ x: r.cx, z: lane }, { x: s.x, z: lane }] };
  }
  lunchPlan(s) { const out = s.ry === 0 ? -1 : 1; const az = s.z + out * 0.75; return { x: s.x, z: s.z, ry: s.ry, sit: true, seatH: 0.46, pose: Math.random() < 0.5 ? 'eat' : 'talk', via: [{ x: -32.5, z: 5.6 }, { x: -32.5, z: az }, { x: s.x, z: az }] }; }
  // ------------------------------------------------------------------ the bell schedule
  /** phase: 'arrive' | 'class' | 'pass' | 'lunch' | 'after' | 'dance' | 'prom' | 'talent' | 'election' | 'grad' | 'game' | 'evac'; slot: the class period (0..2) */
  setPhase(phase, { day = 'A', slot = 0, visibleTest = () => false, team = [] } = {}) {
    this.phase = phase; this.slot = slot; this.day = day;
    const S = this.staff;
    for (const p of this.students) {
      if (p.busy) continue;
      p.hide = false; p.face = null;
      const cls = n => { const s = this.sched[day][n].get(p); return s ? this.seatPlan(s) : null; };
      if (phase === 'arrive') {
        const sp = { x: FRONT_DOOR.x + rnd(-9, 9), z: rnd(26, 31.5) };
        p.place(sp.x, sp.z, { ry: Math.PI });
        const lockerZ = Math.random() < 0.5 ? -1.9 : 1.9, lx = rnd(-40, 40), c = cls(0);
        p.doPlan([{ x: lx, z: lockerZ, ry: lockerZ < 0 ? Math.PI : 0, pose: Math.random() < 0.3 ? 'phone' : 'idle', wait: rnd(2, 7) }, ...(c ? [{ ...c, pose: 'idle' }] : [])]);
        p.speed = rnd(1.6, 2.1);
      } else if (phase === 'class') {
        const c = cls(slot); if (!c) continue;
        const far = Math.hypot(p.x - c.x, p.z - c.z) > 3;
        if (far && !visibleTest(p)) p.place(c.x, c.z, { ry: c.ry, sit: c.sit, pose: 'idle' });
        else if (far) p.goTo(c.x, c.z, { ...c, speed: 2.6 });
        else p.place(c.x, c.z, { ry: c.ry, sit: c.sit });
        p.pose = Math.random() < 0.3 ? 'write' : 'idle';
        if (this.sched[day][slot].get(p)?.room === 'gym') p.pose = 'idle';
      } else if (phase === 'pass') {
        const c = cls(slot + 1); if (!c) continue;
        const hx = Math.max(-40, Math.min(40, (p.x + c.x) / 2 + rnd(-6, 6)));
        p.doPlan([{ x: hx, z: rnd(-1.6, 1.6), wait: rnd(0.5, 4), pose: Math.random() < 0.35 ? 'talk' : Math.random() < 0.3 ? 'phone' : 'idle' }, c]);
        p.speed = rnd(1.8, 2.3);
      } else if (phase === 'lunch') {
        const s = this.lunchSeat.get(p);
        if (s) p.doPlan([{ x: rnd(-40, -20), z: rnd(-1.5, 1.5), wait: rnd(0, 2) }, ...(Math.random() < 0.5 ? [{ x: -40.6, z: rnd(6, 12), ry: -Math.PI / 2, wait: rnd(1, 3), via: [{ x: -38, z: 5.2 }] }] : []), this.lunchPlan(s)]);
        p.speed = rnd(1.7, 2.2);
      } else if (phase === 'after') {
        const r = Math.random();
        if (team.includes(p) || (p.clique === 'jocks' && r < 0.7)) { const sp = gymSpots()[Math.floor(Math.random() * 18)]; p.doPlan([{ x: sp.x + rnd(-2, 2), z: sp.z + rnd(-3, 3), pose: 'idle' }]); }
        else if (p.clique === 'nerds' && r < 0.6) p.doPlan([{ x: rnd(8, 14), z: rnd(8, 10), pose: 'think' }]);
        else if (r < 0.2) p.doPlan([{ x: rnd(-30, 30), z: rnd(-1.6, 1.6), pose: 'talk', wait: rnd(4, 10) }, { x: FRONT_DOOR.x + rnd(-6, 6), z: 30.5 }]);
        else p.doPlan([{ x: FRONT_DOOR.x + rnd(-8, 8), z: rnd(29, 31), pose: Math.random() < 0.3 ? 'phone' : 'idle', ry: Math.PI }]);
      } else if (phase === 'dance' || phase === 'prom') {
        const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 7;
        const x = 60 + Math.cos(a) * r * 1.3, z = Math.sin(a) * r * 0.8;
        if (!visibleTest(p)) p.place(x, z, { pose: Math.random() < 0.8 ? 'dance' : 'talk', ry: rnd(-3, 3) }); else p.goTo(x, z, { pose: 'dance' });
      } else if (phase === 'talent' || phase === 'election' || phase === 'grad') {
        const i = this.students.indexOf(p), row = Math.floor(i / 12), col = i % 12;
        const x = 53.4 + col * 1.2, z = 1 - row * 1.8;
        const o = { ry: Math.PI, sit: true, pose: 'idle' };
        if (!visibleTest(p)) p.place(x, z, o); else p.goTo(x, z, { ...o, via: [{ x, z: -10 }] });
      } else if (phase === 'game') {
        const i = this.students.indexOf(p), tier = i % 5, x = BLEACHERS.x0 + 1 + (i * 1.37) % (BLEACHERS.x1 - BLEACHERS.x0 - 2);
        const z = BLEACHERS.z1 - 0.4 - tier * 0.8, h = 0.45 + tier * 0.45;
        if (team.includes(p)) { p.place(52 + Math.random() * 16, rnd(-5, 5), { pose: 'idle' }); continue; }
        p.place(x, z, { ry: 0, sit: true, seatH: h, pose: 'cheer' });
      } else if (phase === 'evac') {
        p.goTo(rnd(-30, 4), rnd(22, 28), { ry: Math.PI, pose: Math.random() < 0.5 ? 'talk' : 'idle', speed: 2.4 });
      }
    }
    // staff behaviour
    this.homeStaff();
    if (phase === 'class' || phase === 'arrive' || phase === 'pass' || phase === 'after') { S.principal.place(-10, 0, { ry: Math.PI / 2 }); this.patrol(); }
    if (phase === 'lunch') { S.principal.place(-32.5, 5, { ry: 0 }); S.principal.pose = 'idle'; }
    if (['dance', 'prom', 'talent', 'election', 'grad', 'game'].includes(phase)) {
      S.principal.place(phase === 'grad' || phase === 'talent' || phase === 'election' ? 62.5 : 46, phase === 'game' ? -6 : 11.6, { ry: Math.PI, pose: 'idle' });
      S.pe.place(phase === 'game' ? 48 : 50, phase === 'game' ? 6 : 8, { ry: Math.PI / 2, pose: phase === 'game' ? 'point' : 'clap' });
      for (const [i, k] of ['math', 'english', 'science', 'history', 'art'].entries()) S[k].place(46 + i * 0.9, 12.2, { ry: -2.6, pose: 'idle' });
    }
    if (phase === 'evac') for (const s of Object.values(S)) s.goTo(rnd(-30, 4), rnd(22, 28), { ry: Math.PI, speed: 2.2 });
  }
  patrol() {
    const P = this.staff.principal;
    const loop = () => P.doPlan([{ x: rnd(-40, 40), z: rnd(-1, 1), wait: rnd(2, 6), pose: 'idle' }, { x: rnd(-40, 40), z: rnd(-1, 1), wait: rnd(2, 6), pose: 'idle' }]);
    loop(); this.patrolT = 16;
    const J = this.staff.janitor; J.doPlan([{ x: rnd(-38, 38), z: rnd(-1, 1), pose: 'mop', wait: 12 }]);
  }
  /** A student in the class you're in (for events and paper-ball targets). */
  classmates(slot = this.slot) { const t = this.sched?.[this.day]?.[slot]; return t ? [...t.keys()] : []; }
  roomOf(p, slot = this.slot) { return this.sched?.[this.day]?.[slot]?.get(p)?.room; }
  /** Send someone to walk up to you. They stop about 1.6 m away and call back. */
  summon(p, target, onArrive) {
    p.busy = true; p.face = target; p.speed = 2.2;
    p.summonTarget = target; p.summonCb = onArrive; p.summonT = 0;
    p.path = []; p.plan = []; p.seat = false; p.pose = 'idle';
    this.bang.set(p, textSprite('!', { size: 64, color: '#1a1a1a', bg: '#ffd23a', pad: 10 }));
    const b = this.bang.get(p); b.position.y = 2.25; p.g.group.add(b);
  }
  /** After a chat, send someone back to what they were doing. */
  resume(p) {
    this.release(p);
    if (p.staff) { const h = p.home; if (h) p.goTo(h.x, h.z, { ry: h.ry, sit: h.sit, pose: h.pose }); return; }
    const ph = this.phase;
    const seatFor = n => { const s = this.sched?.[this.day]?.[n]?.get(p); return s ? this.seatPlan(s) : null; };
    if (ph === 'arrive') { const c = seatFor(0); if (c) p.goTo(c.x, c.z, c); }
    else if (ph === 'pass') { const c = seatFor(this.slot + 1); if (c) p.goTo(c.x, c.z, c); }
    else if (ph === 'class') { const c = seatFor(this.slot); if (c) p.goTo(c.x, c.z, c); }
    else if (ph === 'lunch') { const s = this.lunchSeat.get(p); if (s) { const l = this.lunchPlan(s); p.goTo(l.x, l.z, l); } }
    else p.goTo(FRONT_DOOR.x + rnd(-8, 8), rnd(29, 31), { ry: Math.PI });
  }
  release(p) { p.busy = false; p.face = null; p.summonTarget = null; const b = this.bang.get(p); if (b) { p.g.group.remove(b); this.bang.delete(p); } }
  update(dt, player, pRegion, cam) {
    this.t += dt;
    if (this.patrolT !== undefined) { this.patrolT -= dt; const P = this.staff.principal; if (this.patrolT <= 0 && !P.plan.length && !P.path.length && ['class', 'arrive', 'pass', 'after'].includes(this.phase)) { this.patrolT = 12; P.doPlan([{ x: rnd(-40, 40), z: rnd(-1, 1), wait: rnd(2, 5) }, { x: rnd(-40, 40), z: rnd(-1, 1), wait: rnd(2, 5) }]); } }
    let near = 0;
    for (const p of this.people) {
      // walking up to the player
      if (p.summonTarget) {
        const t = p.summonTarget, d = Math.hypot(t.x - p.x, t.z - p.z);
        p.summonT += dt;
        if (d > 1.7 && p.summonT < 14) { p.summonRe = (p.summonRe || 0) - dt; if (p.summonRe <= 0 || !p.path.length) { p.summonRe = 0.8; const a = Math.atan2(p.x - t.x, p.z - t.z); p.goTo(t.x + Math.sin(a) * 1.5, t.z + Math.cos(a) * 1.5, { speed: 2.4 }); } }
        else { p.path = []; const cb = p.summonCb; p.summonCb = null; p.summonTarget = null; p.face = t; if (cb) cb(p); }
      }
      if (p.face && p.face.x === undefined) p.face = null;
      // only draw the people you could possibly see
      const d = Math.hypot(p.x - cam.x, p.z - cam.z);
      p.vis = d < 42 && (p.region === pRegion || d < 12 || (OPEN.has(p.region) && OPEN.has(pRegion)));
      p.near = d < 14;
      p.setShadow(d < 16);
      if (p.g.tag) p.g.tag.visible = d < 9 && p.vis && !p.seat && !this.hideTags;
      if (p.vis && d < 12 && p.role === 'student') near++;
      p.update(dt);
      // keep people out of your body
      if (player && !p.seat) { const dx = p.x - player.x, dz = p.z - player.z, dd = Math.hypot(dx, dz); if (dd < 0.7 && dd > 0.001) { const k = (0.7 - dd) / dd * 0.5; p.x += dx * k; p.z += dz * k; } }
    }
    this.nearCount = near;
  }
}
