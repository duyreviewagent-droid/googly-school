// Googly High School: the floor plan. Pure data, shared by the renderer (world.js), collisions, the minimap and the NPC routes.
// x runs east, z runs south (the front of the school faces +z). One long hallway, classrooms north, the cafeteria,
// lobby, office, library and nurse south, the gym at the east end, and the football field out the west exit.
export const H = 3.4;                 // ceiling height
export const HALL = { x0: -44, x1: 44, z0: -3, z1: 3 };
export const BOUNDS = { x0: -125, x1: 95, z0: -55, z1: 55 };

// rooms: door = where the doorway is in the room's hallway wall; in = a point just inside; hall = the hallway spot outside it
export const ROOMS = {
  math:      { name: 'Math', label: 'ROOM 101 · MATH', x0: -44, x1: -30, z0: -13, z1: -3, door: -37, floor: 'lino', kind: 'class', teacher: 'Mr. Numbers', color: '#2a6ad8' },
  english:   { name: 'English', label: 'ROOM 102 · ENGLISH', x0: -30, x1: -16, z0: -13, z1: -3, door: -23, floor: 'lino', kind: 'class', teacher: 'Ms. Prose', color: '#8a3ab8' },
  science:   { name: 'Science', label: 'ROOM 103 · SCIENCE LAB', x0: -16, x1: -2, z0: -13, z1: -3, door: -9, floor: 'lino', kind: 'lab', teacher: 'Dr. Beaker', color: '#1f9a5a' },
  history:   { name: 'History', label: 'ROOM 104 · HISTORY', x0: -2, x1: 12, z0: -13, z1: -3, door: 5, floor: 'lino', kind: 'class', teacher: 'Mrs. Olden', color: '#b8601a' },
  art:       { name: 'Art', label: 'ROOM 105 · ART', x0: 12, x1: 26, z0: -13, z1: -3, door: 19, floor: 'lino', kind: 'art', teacher: 'Mx. Palette', color: '#e84a8a' },
  detention: { name: 'Detention', label: 'ROOM 106 · DETENTION', x0: 26, x1: 34, z0: -13, z1: -3, door: 30, floor: 'lino', kind: 'detention', color: '#6a6a6a' },
  restroom:  { name: 'Restroom', label: 'RESTROOMS', x0: 34, x1: 44, z0: -13, z1: -3, door: 39, floor: 'bath', kind: 'restroom', color: '#4a9ab8' },
  cafeteria: { name: 'Cafeteria', label: 'CAFETERIA', x0: -44, x1: -18, z0: 3, z1: 21, door: -31, doors: [-38, -24], dw: 3, floor: 'caf', kind: 'cafeteria', color: '#e8a020' },
  lobby:     { name: 'Lobby', label: 'MAIN LOBBY', x0: -18, x1: -6, z0: 3, z1: 15, door: -12, dw: 6, floor: 'terrazzo', kind: 'lobby', color: '#2a6ad8' },
  office:    { name: 'Office', label: "PRINCIPAL'S OFFICE", x0: -6, x1: 6, z0: 3, z1: 12, door: 0, floor: 'carpet', kind: 'office', color: '#ffd23a' },
  library:   { name: 'Library', label: 'LIBRARY', x0: 6, x1: 26, z0: 3, z1: 17, door: 16, dw: 2.4, floor: 'carpetG', kind: 'library', color: '#3a8a5a' },
  nurse:     { name: 'Nurse', label: "NURSE'S OFFICE", x0: 26, x1: 34, z0: 3, z1: 10, door: 30, floor: 'lino', kind: 'nurse', color: '#e84a4a' },
  lounge:    { name: 'Vending', label: 'STUDENT LOUNGE', x0: 34, x1: 44, z0: 3, z1: 9, door: 39, dw: 8, floor: 'lino', kind: 'lounge', color: '#4ab8e8' },
  gym:       { name: 'Gym', label: 'GYMNASIUM', x0: 44, x1: 76, z0: -15, z1: 15, door: 0, dw: 4, floor: 'wood', kind: 'gym', teacher: 'Coach Whistle', color: '#d83a2a' },
};
for (const [id, r] of Object.entries(ROOMS)) {
  r.id = id; r.cx = (r.x0 + r.x1) / 2; r.cz = (r.z0 + r.z1) / 2; r.dw = r.dw || 1.6;
  if (id === 'gym') { r.hall = { x: 42.5, z: 0 }; r.in = { x: 46, z: 0 }; }
  else if (r.z1 <= -3) { r.hall = { x: r.door, z: -1.6 }; r.in = { x: r.door, z: -4.4 }; }
  else { r.hall = { x: r.door, z: 1.6 }; r.in = { x: r.door, z: 4.4 }; }
}
export const SUBJECTS = ['math', 'english', 'science', 'history', 'art', 'pe'];
export const SUBJECT_ROOM = { math: 'math', english: 'english', science: 'science', history: 'history', art: 'art', pe: 'gym' };
export const SUBJECT_NAME = { math: 'Math', english: 'English', science: 'Science', history: 'History', art: 'Art', pe: 'P.E.' };

// outside
export const FRONT_DOOR = { x: -12, z: 15, w: 3 };
export const BACK_DOOR = { x: -44, z: 0, w: 2 };
export const GYM_DOOR = { x: 48, z: 15, w: 3 };
export const BUS_STOP = { x: -12, z: 31 };
export const FLAG = { x: -4, z: 22 };
export const FIELD = { x0: -112, x1: -56, z0: -26, z1: 26 };

// walls: [x0, z0, x1, z1, gaps: [[centre, width], ...]] (each is horizontal or vertical)
const northDoors = ['math', 'english', 'science', 'history', 'art', 'detention', 'restroom'].map(k => [ROOMS[k].door, ROOMS[k].dw]);
export const WALLS = [
  // the hallway
  [-44, -3, 44, -3, northDoors, 'hall'],
  [-44, 3, 44, 3, [[-38, 3], [-24, 3], [-12, 6], [0, 1.6], [16, 2.4], [30, 1.6], [39, 8]], 'hall'],
  // north classrooms
  [-44, -13, 44, -13, [], 'ext'],
  ...[-30, -16, -2, 12, 26, 34].map(x => [x, -13, x, -3, [], 'int']),
  // west end: the back exit to the field
  [-44, -13, -44, 21, [[0, 2]], 'ext'],
  // the gym
  [44, -15, 44, -13, [], 'ext'], [44, -13, 44, 9, [[0, 4]], 'gym'], [44, 9, 44, 15, [], 'ext'], [44, -15, 76, -15, [], 'ext'], [44, 15, 76, 15, [[48, 3]], 'ext'], [76, -15, 76, 15, [], 'ext'],
  // cafeteria, lobby, office, library, nurse, lounge
  [-44, 21, -18, 21, [], 'ext'], [-18, 3, -18, 15, [], 'int'], [-18, 15, -18, 21, [], 'ext'],
  [-18, 15, -6, 15, [[-12, 3]], 'ext'], [-6, 3, -6, 12, [], 'int'], [-6, 12, -6, 15, [], 'ext'],
  [-6, 12, 6, 12, [], 'ext'], [-6, 8, 6, 8, [[3.6, 1.3]], 'int'],
  [6, 3, 6, 12, [], 'int'], [6, 12, 6, 17, [], 'ext'], [6, 17, 26, 17, [], 'ext'], [26, 3, 26, 10, [], 'int'], [26, 10, 26, 17, [], 'ext'],
  [26, 10, 34, 10, [], 'ext'], [34, 3, 34, 9, [], 'int'], [34, 9, 34, 10, [], 'ext'],
  [34, 9, 44, 9, [], 'ext'],
  // restroom stalls divider
  [36.5, -13, 36.5, -9, [], 'stall'],
];
export const WALL_T = 0.24;
/** Axis-aligned wall pieces (with the gaps cut out) as {x0,z0,x1,z1,kind}. */
export function wallPieces() {
  const out = [];
  for (const [x0, z0, x1, z1, gaps, kind] of WALLS) {
    const horiz = z0 === z1, a0 = horiz ? x0 : z0, a1 = horiz ? x1 : z1;
    const cuts = gaps.map(([c, w]) => [c - w / 2, c + w / 2]).sort((p, q) => p[0] - q[0]);
    let s = a0;
    for (const [c0, c1] of cuts) { if (c0 > s) out.push(horiz ? { x0: s, z0, x1: c0, z1, kind, horiz } : { x0, z0: s, x1, z1: c0, kind, horiz }); s = c1; }
    if (s < a1) out.push(horiz ? { x0: s, z0, x1: a1, z1, kind, horiz } : { x0, z0: s, x1, z1: a1, kind, horiz });
  }
  return out;
}

// ------------------------------------------------------------------ seats
/** Desks in a classroom: 4 columns × 4 rows facing the board on the north wall. The player's seat is index 6. */
export function classSeats(room) {
  const r = ROOMS[room], out = [];
  if (!r) return out;
  if (room === 'detention') { for (const z of [-9.5, -7.4, -5.3]) for (const dx of [-1.6, 1.6]) out.push({ x: r.cx + dx, z, ry: Math.PI }); return out; }
  for (const z of [-10.2, -8.6, -7.0, -5.4]) for (const dx of [-4.2, -1.4, 1.4, 4.2]) out.push({ x: r.cx + dx, z, ry: Math.PI });
  return out;
}
export const PLAYER_SEAT = 9;          // third row, second from the right of the aisle
/** Where people line up for P.E. in the gym (facing the coach). */
export function gymSpots() { const out = []; for (let i = 0; i < 18; i++) out.push({ x: 52 + (i % 6) * 2.4, z: -4 + Math.floor(i / 6) * 2.4, ry: Math.PI / 2 }); return out; }
export const COACH_SPOT = { x: 49, z: -1.6, ry: -Math.PI / 2 };

// cafeteria tables (each seats 8: four each side). The cliques always sit at the same table.
export const TABLES = [
  { id: 'jocks', name: 'Jocks', x: -37.5, z: 8 }, { id: 'popular', name: 'Popular Kids', x: -27.5, z: 8 },
  { id: 'nerds', name: 'Nerds', x: -37.5, z: 12 }, { id: 'artsy', name: 'Art Kids', x: -27.5, z: 12 },
  { id: 'gamers', name: 'Gamers', x: -37.5, z: 16 }, { id: 'band', name: 'Band Kids', x: -27.5, z: 16 },
  { id: 'friends', name: 'Your Friends', x: -22.5, z: 19 }, { id: 'empty', name: 'Empty Table', x: -32.5, z: 19.2 },
];
export function tableSeats(t) { const out = []; for (const dx of [-1.5, -0.5, 0.5, 1.5]) for (const s of [-1, 1]) out.push({ x: t.x + dx, z: t.z + s * 0.85, ry: s > 0 ? Math.PI : 0 }); return out; }
export const LUNCH_LINE = { x: -41.2, z0: 5, z1: 13 };
export const BLEACHERS = { x0: 48, x1: 72, z0: -14.6, z1: -10.6 };
export const STAGE = { x0: 52, x1: 68, z0: 11, z1: 15, h: 0.9 };
export const OFFICE_CHAIR = { x: -1, z: 9.3, ry: Math.PI };
export const PRINCIPAL_SEAT = { x: 0, z: 11.2, ry: 0 };

// things you can use with E
export const SPOTS = [
  { id: 'locker', name: 'your locker', x: -8, z: -2.6, r: 1.3 },
  { id: 'alarm', name: 'the fire alarm', x: -16.6, z: -2.75, r: 1.2 },
  { id: 'alarm', name: 'the fire alarm', x: 24, z: 2.75, r: 1.2 },
  { id: 'fountain', name: 'the water fountain', x: 10, z: 2.7, r: 1.2 },
  { id: 'vending', name: 'the vending machine', x: 37, z: 8.2, r: 1.4 },
  { id: 'vending', name: 'the vending machine', x: 39.2, z: 8.2, r: 1.4 },
  { id: 'lunch', name: 'the lunch line', x: -40.6, z: 9, r: 2.8 },
  { id: 'nurse', name: 'the nurse', x: 30, z: 7.2, r: 1.8 },
  { id: 'study', name: 'a study table', x: 10, z: 7, r: 2.2 },
  { id: 'board', name: 'the club sign-up board', x: -3, z: 2.75, r: 1.3 },
  { id: 'trophy', name: 'the trophy case', x: -17.5, z: 9, r: 1.6 },
  { id: 'mirror', name: 'the mirror', x: 43.6, z: -6, r: 1.3 },
  { id: 'backdoor', name: 'the back exit', x: -43.2, z: 0, r: 1.6 },
  { id: 'frontdoor', name: 'the front doors', x: -12, z: 14.2, r: 1.8 },
  { id: 'bleachers', name: 'the bleachers', x: 60, z: -10.2, r: 3 },
  { id: 'secretary', name: 'the front desk', x: -1, z: 4.8, r: 1.6 },
];
/** Which room a point is in (or 'hall' / 'outside'). */
export function roomAt(x, z) {
  if (x >= HALL.x0 && x <= HALL.x1 && z >= HALL.z0 && z <= HALL.z1) return 'hall';
  for (const [id, r] of Object.entries(ROOMS)) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return id;
  return 'outside';
}
export const inside = (x, z) => roomAt(x, z) !== 'outside';

// ------------------------------------------------------------------ solid furniture for collisions: [x0, z0, x1, z1]
export function furnitureBoxes() {
  const B = [];
  for (const k of ['math', 'english', 'science', 'history', 'art', 'detention']) {
    const r = ROOMS[k];
    for (const s of classSeats(k)) B.push([s.x - 0.42, s.z - 0.62, s.x + 0.42, s.z - 0.08]);
    if (k !== 'detention') B.push([r.cx - 1.1, -12.0, r.cx + 1.1, -11.2]);
    else B.push([r.cx - 0.9, -12.3, r.cx + 0.9, -11.6]);
  }
  for (const t of TABLES) B.push([t.x - 2, t.z - 0.45, t.x + 2, t.z + 0.45]);
  B.push([-43.8, 5, -41.8, 13]);                                  // serving counter
  B.push([-5.2, 5.2, 2.6, 5.9]);                                   // office counter
  B.push([-1.2, 10.2, 1.2, 11]);                                   // principal's desk
  for (let i = 0; i < 4; i++) B.push([12 + i * 3.4, 11.5, 13 + i * 3.4, 16.6]);  // library shelves
  for (const x of [9, 13]) B.push([x - 0.9, 6.3, x + 0.9, 7.7]);   // study tables
  B.push([36.2, 8.2, 40, 9]);                                      // vending machines
  B.push([27, 5.6, 29.2, 6.6]);                                    // nurse's bed
  B.push([-17.95, 6.5, -17.3, 11.5]);                              // trophy case
  B.push([BLEACHERS.x0, BLEACHERS.z0, BLEACHERS.x1, BLEACHERS.z1 - 0.1]);
  B.push([STAGE.x0, STAGE.z0, STAGE.x1, STAGE.z1]);
  B.push([34.2, -13, 36.4, -9.2]); B.push([36.6, -13, 38.8, -9.2]);  // stalls
  B.push([41.5, -8.5, 43.8, -3.6]);                                // sinks
  // outside: the flagpole, the bus, the field bleachers
  B.push([FLAG.x - 0.25, FLAG.z - 0.25, FLAG.x + 0.25, FLAG.z + 0.25]);
  B.push([-26, 32.4, -12.4, 35]);
  B.push([-100, -34, -68, -29]);
  return B;
}
