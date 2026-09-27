// Draws Googly High School: painted-block hallways lined with lockers, waxed tile floors, six classrooms, the cafeteria,
// the lobby and trophy case, the principal's office, the library, the nurse, the restrooms, the lounge, the gym with its
// bleachers and stage, and outside the flagpole, the bus loop, the parking lot and the football field.
// Every texture is painted on a canvas at load time — nothing to download.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { H, HALL, ROOMS, WALL_T, wallPieces, classSeats, TABLES, tableSeats, LUNCH_LINE, BLEACHERS, STAGE, FRONT_DOOR, BACK_DOOR, GYM_DOOR, FLAG, FIELD, BUS_STOP, inside, SPOTS } from './school.js';
import { textSprite } from './googly.js';

const std = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const phys = o => new THREE.MeshPhysicalMaterial(o);
const rnd = (a, b) => a + Math.random() * (b - a);
function seeded(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const texCache = new Map();
function tex(key, w, h, draw, srgb = true) {
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); let hs = 7; for (const ch of key) hs = (hs * 31 + ch.charCodeAt(0)) >>> 0; draw(g, w, h, seeded(hs));
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  texCache.set(key, t);
  return t;
}
const speck = (g, w, h, n, cols, s = 2, r = Math.random) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(r() * w, r() * h, s, s); } };
function wrapText(g, text, x, y, maxW, lh) { const words = String(text).split(' '); let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); line = w; y += lh; } else line = t; } if (line) g.fillText(line, x, y); return y + lh; }
const SCHOOL_BLUE = '#1f4fa8', SCHOOL_GOLD = '#f2b820';

// ------------------------------------------------------------------ textures (u/v in metres: see uvBox)
const TX = {
  // painted cinder block, 2 m x 2 m: 5 blocks across, 10 courses
  block: (base = '#e9e3d3', key = 'a') => tex('block' + base + key, 512, 512, (g, w, h, r) => {
    g.fillStyle = '#cbc4b2'; g.fillRect(0, 0, w, h);
    const bw = w / 5, bh = h / 10;
    const c = new THREE.Color(base);
    for (let row = 0; row < 10; row++) for (let i = -1; i < 6; i++) {
      const x = i * bw + (row % 2) * bw / 2, y = row * bh, k = 0.97 + r() * 0.05;
      g.fillStyle = `rgb(${c.r * 255 * k | 0},${c.g * 255 * k | 0},${c.b * 255 * k | 0})`; g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      const gr = g.createLinearGradient(0, y, 0, y + bh); gr.addColorStop(0, '#ffffff18'); gr.addColorStop(1, '#0000000c'); g.fillStyle = gr; g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    }
    speck(g, w, h, 9000, ['#0000000c', '#ffffff12', '#00000006'], 2, r);
  }),
  brick: () => tex('brick', 512, 512, (g, w, h, r) => {
    g.fillStyle = '#8a8076'; g.fillRect(0, 0, w, h);
    for (let y = 0, row = 0; y < h; y += 16, row++) for (let x = (row % 2) * -24; x < w; x += 48) { const t = 105 + r() * 45; g.fillStyle = `rgb(${t + 58},${t * 0.52},${t * 0.4})`; g.fillRect(x + 1.5, y + 1.5, 45, 13); }
    speck(g, w, h, 7000, ['#00000018', '#ffffff10', '#3a1a1010'], 2, r);
  }),
  // vinyl composition tile (the classic school floor): 30 cm squares, speckled cream with a few blue ones
  lino: (accent = SCHOOL_BLUE) => tex('lino' + accent, 512, 512, (g, w, h, r) => {
    const n = 8, s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const blue = (x + y * 3) % 7 === 0 && accent;
      g.fillStyle = blue ? accent : ((x + y) % 2 ? '#ddd6c4' : '#e6e0d0'); g.fillRect(x * s, y * s, s, s);
      speck(g, s, s, 0, []);
      for (let i = 0; i < 140; i++) { g.fillStyle = blue ? (r() < 0.5 ? '#ffffff30' : '#00000022') : ['#8a7a6a55', '#ffffff66', '#b0a08a55', '#6a6a7a40'][i % 4]; g.fillRect(x * s + r() * s, y * s + r() * s, 1 + r() * 3, 1 + r() * 2); }
    }
    g.strokeStyle = '#9a927e88'; g.lineWidth = 1.2; for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke(); }
  }),
  quarry: () => tex('quarry', 512, 512, (g, w, h, r) => { const n = 6, s = w / n; g.fillStyle = '#6a5a4a'; g.fillRect(0, 0, w, h); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const t = 150 + r() * 30; g.fillStyle = `rgb(${t + 40},${t * 0.6},${t * 0.42})`; g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6); } speck(g, w, h, 6000, ['#00000014', '#ffffff10'], 2, r); }),
  terrazzo: () => tex('terrazzo', 512, 512, (g, w, h, r) => { g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = ['#8a8070', '#f4f0e8', '#6a6a6a', '#b89a7a', '#2a4a8a'][i % 5]; const s = 1 + r() * 4; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.5 + r() * 0.5), r() * 3, 0, 7); g.fill(); } g.strokeStyle = '#a89a80'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }),
  bath: () => tex('bath', 256, 256, (g, w, h, r) => { g.fillStyle = '#9aa4a8'; g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x * 7 + y * 3) % 11 === 0 ? '#4a9ab8' : '#eef2f2'; g.fillRect(x * 32 + 1.5, y * 32 + 1.5, 29, 29); } speck(g, w, h, 900, ['#00000010'], 2, r); }),
  carpet: (col = '#3a4a6a', key = 'b') => tex('carpet' + col + key, 256, 256, (g, w, h, r) => { g.fillStyle = col; g.fillRect(0, 0, w, h); const c = new THREE.Color(col); const a = '#' + c.clone().multiplyScalar(0.8).getHexString(), b = '#' + c.clone().lerp(new THREE.Color('#fff'), 0.12).getHexString(); speck(g, w, h, 16000, [a, b, col], 2, r); }),
  wood: () => tex('gymwood', 512, 512, (g, w, h, r) => { for (let y = 0; y < h; y += 16) for (let x = -(y * 7 % 256); x < w; x += 256) { const t = 175 + r() * 35; g.fillStyle = `rgb(${t + 35},${t * 0.78},${t * 0.48})`; g.fillRect(x, y, 254, 15); for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(90,50,20,.13)'; g.beginPath(); const yy = y + r() * 15; g.moveTo(x, yy); g.lineTo(x + 254, yy + r() * 2); g.stroke(); } } }),
  ceiling: () => tex('ceiltile', 256, 256, (g, w, h, r) => { g.fillStyle = '#eceae4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.fillStyle = r() < 0.7 ? '#c8c4ba' : '#d8d4ca'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1); } g.fillStyle = '#b8b6b0'; g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 4, h); g.fillRect(0, 126, w, 4); g.fillRect(126, 0, 4, h); }),
  // four lockers (1.6 m wide, 2 m tall): louvres, handle, number plate
  lockers: (col = '#2a5ab0') => tex('lockers' + col, 512, 640, (g, w, h, r) => {
    const lw = w / 4, c = new THREE.Color(col), dk = '#' + c.clone().multiplyScalar(0.6).getHexString(), lt = '#' + c.clone().lerp(new THREE.Color('#fff'), 0.25).getHexString();
    g.fillStyle = dk; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x = i * lw + 4, ww = lw - 8;
      const gr = g.createLinearGradient(x, 0, x + ww, 0); gr.addColorStop(0, lt); gr.addColorStop(0.15, col); gr.addColorStop(1, dk); g.fillStyle = gr; g.fillRect(x, 20, ww, h - 60);
      for (const y0 of [40, h - 150]) for (let k = 0; k < 6; k++) { g.fillStyle = '#10182a'; g.fillRect(x + 22, y0 + k * 14, ww - 44, 6); g.fillStyle = lt + '88'; g.fillRect(x + 22, y0 + k * 14 + 6, ww - 44, 2); }
      g.fillStyle = '#c8ccd4'; g.fillRect(x + ww - 30, h * 0.47, 14, 56); g.fillStyle = '#6a707a'; g.fillRect(x + ww - 27, h * 0.47 + 6, 8, 44);
      g.fillStyle = '#d8dce2'; g.fillRect(x + 36, 142, 56, 22); g.fillStyle = '#2a2a2a'; g.font = 'bold 16px monospace'; g.textAlign = 'center'; g.fillText(String(100 + Math.floor(r() * 800)), x + 64, 159);
      for (let s = 0; s < 3; s++) { g.strokeStyle = '#00000030'; g.beginPath(); const sx = x + r() * ww, sy = 200 + r() * 300; g.moveTo(sx, sy); g.lineTo(sx + r() * 20, sy + r() * 6); g.stroke(); }
    }
    g.fillStyle = '#1a1a1e'; g.fillRect(0, h - 40, w, 40);
  }),
  grass: () => tex('grass', 512, 512, (g, w, h, r) => { g.fillStyle = '#4a7a2e'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40000; i++) { g.fillStyle = ['#3e6a26', '#5a8a36', '#4a7a2e', '#6a9a3e', '#35601f'][i % 5]; g.fillRect(r() * w, r() * h, 1, 2 + r() * 3); } }),
  turf: () => tex('turf', 512, 512, (g, w, h, r) => { for (let x = 0; x < 8; x++) { g.fillStyle = x % 2 ? '#3f8a34' : '#46963a'; g.fillRect(x * 64, 0, 64, h); } for (let i = 0; i < 20000; i++) { g.fillStyle = r() < 0.5 ? '#ffffff0c' : '#0000000e'; g.fillRect(r() * w, r() * h, 1, 2); } }),
  asphalt: () => tex('asphalt', 512, 512, (g, w, h, r) => { g.fillStyle = '#3a3a3c'; g.fillRect(0, 0, w, h); speck(g, w, h, 40000, ['#2e2e30', '#48484a', '#343436', '#525254'], 2, r); for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.08})`; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 30, r() * 3, 0, 7); g.fill(); } }),
  sidewalk: () => tex('sidewalk', 256, 256, (g, w, h, r) => { g.fillStyle = '#b8b2a8'; g.fillRect(0, 0, w, h); speck(g, w, h, 9000, ['#a09a90', '#c4beb4', '#8a847a'], 2, r); g.strokeStyle = '#7a746a'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }),
  track: () => tex('track', 256, 256, (g, w, h, r) => { g.fillStyle = '#a8442e'; g.fillRect(0, 0, w, h); speck(g, w, h, 12000, ['#983a26', '#b85036', '#8a3420'], 2, r); }),
  roof: () => tex('roof', 256, 256, (g, w, h, r) => { g.fillStyle = '#6a6a66'; g.fillRect(0, 0, w, h); speck(g, w, h, 14000, ['#5a5a56', '#7a7a74', '#4a4a48', '#8a8a84'], 2, r); }),
  books: () => tex('books', 512, 1024, (g, w, h, r) => {
    g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, h);
    const shelves = 5, sh = h / shelves;
    for (let s = 0; s < shelves; s++) {
      g.fillStyle = '#3a2412'; g.fillRect(0, s * sh, w, sh);
      let x = 6; while (x < w - 10) { const bw = 12 + r() * 18, bh = sh * (0.62 + r() * 0.3); if (r() < 0.06) { x += 20; continue; } const cols = ['#8a1a1a', '#1a3a7a', '#1a5a2a', '#c8a030', '#5a2a6a', '#2a2a2a', '#d86a1a', '#e8e0c8', '#2a7a8a', '#7a4a2a']; g.fillStyle = cols[Math.floor(r() * cols.length)]; g.fillRect(x, (s + 1) * sh - 14 - bh, bw - 1.5, bh); g.fillStyle = '#ffffff40'; g.fillRect(x + 2, (s + 1) * sh - 14 - bh * 0.8, bw - 5, 3); g.fillRect(x + 2, (s + 1) * sh - 14 - bh * 0.25, bw - 5, 2); x += bw; }
      g.fillStyle = '#8a5a30'; g.fillRect(0, (s + 1) * sh - 14, w, 14);
    }
  }),
  bleach: () => tex('bleach', 256, 256, (g, w, h, r) => { for (let y = 0; y < h; y += 32) { const t = 160 + r() * 30; g.fillStyle = `rgb(${t + 40},${t * 0.75},${t * 0.45})`; g.fillRect(0, y, w, 30); g.fillStyle = '#00000030'; g.fillRect(0, y + 30, w, 2); } }),
  sign: (text, bg, fg, w = 1024, h = 160, font = '"Arial Black", sans-serif', key = '') => tex('sign' + text + bg + fg + w + key, w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); let fs = Math.floor(h * 0.56); g.font = `900 ${fs}px ${font}`; const tw = g.measureText(text).width; if (tw > w * 0.9) fs = Math.floor(fs * w * 0.9 / tw); g.font = `900 ${fs}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(text, w / 2, h / 2 + 2); }),
  poster: (kind) => tex('poster' + kind, 256, 352, (g, w, h, r) => {
    const P = {
      math: ['#1f4fa8', 'MATH', 'is googly', 'π ≈ 3.14159', '#fff'], read: ['#8a3ab8', 'READ', 'every day', '📚', '#fff'], atom: ['#1f9a5a', 'SCIENCE', 'stay curious', '⚛', '#fff'],
      history: ['#b8601a', 'HISTORY', "don't repeat it", '🏛', '#fff'], art: ['#e84a8a', 'CREATE', 'something', '🎨', '#fff'], be: ['#f2b820', 'BE KIND', 'be googly', '♥', '#1a1a1a'],
      go: [SCHOOL_BLUE, 'GO', 'GOOGLIES!', '👀', '#f2b820'], quiet: ['#3a8a5a', 'QUIET', 'please', '🤫', '#fff'], food: ['#e8a020', 'EAT', 'your greens', '🥦', '#1a1a1a'],
      vote: ['#d83a2a', 'VOTE', 'class council', '🗳', '#fff'], dance: ['#6a2ab8', 'HOMECOMING', 'dance · gym', '🪩', '#ffd23a'], nosmoke: ['#2a2a2a', 'NO RUNNING', 'in the halls', '🚫', '#fff'],
    }[kind] || ['#444', kind.toUpperCase(), '', '', '#fff'];
    g.fillStyle = P[0]; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff22'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(r() * w, r() * h, 20 + r() * 50, 0, 7); g.fill(); }
    g.fillStyle = P[4]; g.textAlign = 'center'; g.font = '900 46px "Arial Black", sans-serif'; let fs = 46; while (g.measureText(P[1]).width > w - 20) { fs -= 2; g.font = `900 ${fs}px "Arial Black", sans-serif`; } g.fillText(P[1], w / 2, 80);
    g.font = '800 24px "Avenir Next", sans-serif'; g.fillText(P[2], w / 2, 116); g.font = '110px serif'; g.fillText(P[3], w / 2, 270);
    g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  }),
  periodic: () => tex('periodic', 1024, 560, (g, w, h) => {
    g.fillStyle = '#f4f2ea'; g.fillRect(0, 0, w, h); g.fillStyle = '#1a1a1a'; g.font = '900 34px sans-serif'; g.textAlign = 'center'; g.fillText('PERIODIC TABLE OF THE ELEMENTS', w / 2, 44);
    const cols = ['#ff8a8a', '#ffc08a', '#fff08a', '#b8f08a', '#8ae8f0', '#a8b8ff', '#e0a8ff'];
    const lay = [[1, 18], [1, 2, 13, 14, 15, 16, 17, 18], [1, 2, 13, 14, 15, 16, 17, 18]]; const sy = ['H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar']; let n = 0;
    for (let p = 0; p < 7; p++) for (let gg = 1; gg <= 18; gg++) {
      if (p < 3 && !lay[p].includes(gg)) continue; const x = 20 + (gg - 1) * 54.7, y = 64 + p * 66;
      g.fillStyle = cols[(gg + p) % 7]; g.fillRect(x, y, 51, 62); g.fillStyle = '#1a1a1a'; g.font = 'bold 24px sans-serif'; g.fillText(sy[n] || ['K', 'Ca', 'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Hg', 'Pb', 'U'][n % 10], x + 25, y + 40); g.font = '11px sans-serif'; g.fillText(String(n + 1), x + 25, y + 14); n++;
    }
  }),
  worldmap: () => tex('worldmap', 1024, 560, (g, w, h, r) => {
    g.fillStyle = '#7ab0d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8d8a0';
    const blobs = [[230, 170, 150, 110], [300, 360, 70, 120], [520, 150, 80, 60], [560, 320, 90, 130], [740, 180, 190, 110], [860, 400, 70, 45], [380, 90, 40, 30]];
    for (const [x, y, rx, ry] of blobs) { g.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * 6.28, rr = 0.75 + r() * 0.35; g.lineTo(x + Math.cos(a) * rx * rr, y + Math.sin(a) * ry * rr); } g.fill(); }
    g.strokeStyle = '#ffffff55'; g.lineWidth = 1; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#5a3a1a'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10);
  }),
  colorwheel: () => tex('colorwheel', 512, 512, (g, w) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, w); for (let i = 0; i < 12; i++) { g.fillStyle = `hsl(${i * 30},85%,55%)`; g.beginPath(); g.moveTo(256, 256); g.arc(256, 256, 220, i / 12 * 6.283, (i + 1) / 12 * 6.283); g.fill(); } g.fillStyle = '#fff'; g.beginPath(); g.arc(256, 256, 80, 0, 7); g.fill(); g.fillStyle = '#222'; g.font = 'bold 34px sans-serif'; g.textAlign = 'center'; g.fillText('COLOR', 256, 250); g.fillText('WHEEL', 256, 286); }),
  clock: () => tex('clock', 256, 256, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 10; g.stroke(); g.fillStyle = '#222'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.fillRect(128 + Math.sin(a) * 100 - 3, 128 - Math.cos(a) * 100 - 8, 6, 16); } g.font = 'bold 18px sans-serif'; g.textAlign = 'center'; g.fillText('GOOGLY', 128, 90); }),
  vending: (kind) => tex('vending' + kind, 512, 1024, (g, w, h, r) => {
    const col = kind ? '#c8202a' : '#1f4fa8'; g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.fillStyle = '#10141c'; g.fillRect(24, 24, 330, 760); g.fillStyle = '#1a2230'; g.fillRect(30, 30, 318, 748);
    for (let row = 0; row < 6; row++) { for (let i = 0; i < 5; i++) { const x = 40 + i * 62, y = 50 + row * 122; const c = ['#ff3a3a', '#ffd23a', '#3ad85a', '#3a8aff', '#ff8a1a', '#e84ae8', '#fafafa'][Math.floor(r() * 7)]; g.fillStyle = c; if (kind) { g.fillRect(x + 12, y + 10, 32, 80); g.fillStyle = '#ffffff55'; g.fillRect(x + 16, y + 14, 6, 70); } else { g.fillRect(x + 4, y + 20, 50, 66); g.fillStyle = '#0003'; g.fillRect(x + 4, y + 60, 50, 26); } } g.fillStyle = '#8a929c'; g.fillRect(34, 50 + row * 122 + 96, 310, 8); g.fillStyle = '#fff'; g.font = 'bold 13px monospace'; for (let i = 0; i < 5; i++) g.fillText('$1.' + (25 + i * 25 % 75), 44 + i * 62, 50 + row * 122 + 118); }
    g.fillStyle = '#0a0a0a'; g.fillRect(370, 90, 118, 60); g.fillStyle = '#3aff6a'; g.font = 'bold 30px monospace'; g.fillText('$1.50', 378, 130);
    g.fillStyle = '#d8dce2'; for (let i = 0; i < 12; i++) g.fillRect(382 + (i % 3) * 34, 190 + Math.floor(i / 3) * 42, 26, 32);
    g.fillStyle = '#10141c'; g.fillRect(40, 820, 300, 120); g.fillStyle = '#fff'; g.font = '900 64px "Arial Black", sans-serif'; g.fillText(kind ? 'COLD DRINKS' : 'SNACKS', kind ? 26 : 90, 1000); g.fillStyle = '#ffffff30'; g.fillRect(24, 24, 60, 760);
  }),
  menu: () => tex('menuboard', 1024, 400, (g, w, h) => { g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, w, h); g.strokeStyle = SCHOOL_GOLD; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = SCHOOL_GOLD; g.font = '900 56px "Arial Black", sans-serif'; g.textAlign = 'center'; g.fillText("TODAY'S LUNCH", w / 2, 76); g.fillStyle = '#fff'; g.font = '800 40px "Avenir Next", sans-serif'; g.textAlign = 'left'; [['Pizza', '$3'], ['Chicken Tacos', '$3'], ['Garden Salad', '$2'], ['Mystery Meat', '$1']].forEach(([a, b], i) => { g.fillText(a, 70, 150 + i * 60); g.fillText(b, 820, 150 + i * 60); }); }),
  bulletin: () => tex('bulletin', 768, 512, (g, w, h, r) => { g.fillStyle = '#b88a5a'; g.fillRect(0, 0, w, h); speck(g, w, h, 8000, ['#a07848', '#c89a6a', '#906838'], 3, r); g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, w, 16); g.fillRect(0, h - 16, w, 16); g.fillRect(0, 0, 16, h); g.fillRect(w - 16, 0, 16, h);
    const notes = [['CLUB SIGN-UPS', '#fff8a0'], ['BASKETBALL TRYOUTS', '#a0e0ff'], ['ART CLUB', '#ffb0d0'], ['DRAMA · TALENT SHOW', '#c0ffb0'], ['CHESS CLUB', '#ffffff'], ['LOST: 1 GOOGLY EYE', '#ffd0a0']];
    notes.forEach(([t, c], i) => { const x = 40 + (i % 3) * 240, y = 40 + Math.floor(i / 3) * 230; g.save(); g.translate(x + 100, y + 90); g.rotate((r() - 0.5) * 0.12); g.fillStyle = c; g.fillRect(-100, -90, 200, 180); g.fillStyle = '#222'; g.font = '900 20px sans-serif'; g.textAlign = 'center'; wrapText(g, t, 0, -50, 180, 26); g.fillStyle = '#555'; for (let k = 0; k < 4; k++) g.fillRect(-70, 10 + k * 16, 140, 3); g.fillStyle = '#d82a2a'; g.beginPath(); g.arc(0, -80, 7, 0, 7); g.fill(); g.restore(); }); }),
  court: () => tex('courtlines', 2048, 1920, (g, w, h) => {
    // the gym floor is 32 x 30 m: 64 px a metre. Court: x 46..74 (28 m), z -7.5..7.5 (15 m) centred at x 60
    const px = x => (x - 44) * 64, pz = z => (z + 15) * 64;
    g.clearRect(0, 0, w, h);
    g.fillStyle = 'rgba(31,79,168,.55)'; g.fillRect(px(46), pz(-7.5), 28 * 64, 15 * 64);
    g.fillStyle = 'rgba(214,160,90,.0)';
    for (const sx of [-1, 1]) { const bx = sx < 0 ? 46 : 74; g.fillStyle = 'rgba(242,184,32,.55)'; g.fillRect(sx < 0 ? px(46) : px(74 - 5.8), pz(-2.45), 5.8 * 64, 4.9 * 64); void bx; }
    g.strokeStyle = '#f8f8f0'; g.lineWidth = 7;
    g.strokeRect(px(46), pz(-7.5), 28 * 64, 15 * 64);
    g.beginPath(); g.moveTo(px(60), pz(-7.5)); g.lineTo(px(60), pz(7.5)); g.stroke();
    g.beginPath(); g.arc(px(60), pz(0), 1.8 * 64, 0, 7); g.stroke();
    for (const sx of [-1, 1]) {
      const bx = sx < 0 ? 46 : 74, hx = bx - sx * -1.6;
      g.strokeRect(sx < 0 ? px(46) : px(74 - 5.8), pz(-2.45), 5.8 * 64, 4.9 * 64);
      g.beginPath(); g.arc(px(bx + (sx < 0 ? 5.8 : -5.8)), pz(0), 1.8 * 64, sx < 0 ? -Math.PI / 2 : Math.PI / 2, sx < 0 ? Math.PI / 2 : Math.PI * 1.5); g.stroke();
      g.beginPath(); g.arc(px(bx + (sx < 0 ? 1.6 : -1.6)), pz(0), 6.75 * 64, sx < 0 ? -1.35 : Math.PI - 1.35 + 0.0, sx < 0 ? 1.35 : Math.PI + 1.35); g.stroke();
      void hx;
    }
    g.fillStyle = 'rgba(31,79,168,.9)'; g.beginPath(); g.arc(px(60), pz(0), 1.75 * 64, 0, 7); g.fill();
    g.fillStyle = SCHOOL_GOLD; g.font = '900 90px "Arial Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('👀', px(60), pz(0));
    g.save(); g.translate(px(60), pz(-10.5)); g.fillStyle = 'rgba(31,79,168,.75)'; g.font = '900 150px "Arial Black", sans-serif'; g.fillText('GOOGLIES', 0, 0); g.restore();
  }),
};
/** Rewrite a box's UVs in metres so textures tile at a real-world size (u: along the face; v: height). */
function uvBox(geo, w, h, d, U = 2, V = 2) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) { const [a, b] = dims[f]; for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * a / U, f === 2 || f === 3 ? uv.getY(k) * b / U : uv.getY(k) * b / V); } }
  uv.needsUpdate = true;
  return geo;
}
function floorUV(geo, w, d, U, x0 = 0, z0 = 0) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w + x0) / U, (uv.getY(i) * d - z0) / U); uv.needsUpdate = true; return geo; }

export class World {
  constructor(canvas) {
    const Q = new URLSearchParams(location.search);
    this.lq = Q.get('lq') === '1';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.lq, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') || Q.has('icon') });
    this.maxDpr = this.lq ? 0.6 : Math.min(devicePixelRatio, 1.5); this.dpr = this.maxDpr; this.renderer.setPixelRatio(this.dpr);
    this.renderer.shadowMap.enabled = !this.lq;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.5;
    this.scene.fog = new THREE.Fog(0xcfdcea, 90, 320);
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.08, 800);
    this.canvas = canvas;
    this.hemi = new THREE.HemisphereLight(0xeef4ff, 0x8a7a64, 1.25); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2dc, 2.4);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 260;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.04;
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    this.sunDir = new THREE.Vector3(0.3, 1, 0.25).normalize();
    this.makeSky();
    this.parts = []; this.focus = new THREE.Vector3(); this.boxes = []; this.fixtures = []; this.boards = {}; this.lights = []; this.eventMode = null; this.alarmT = 0;
    this.resize();
    addEventListener('resize', () => this.resize());
    this.build();
  }
  resize() {
    const w = this.canvas.clientWidth || innerWidth, h = this.canvas.clientHeight || innerHeight;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  makeSky() {
    this.skyU = { top: { value: new THREE.Color('#4f8fd8') }, bot: { value: new THREE.Color('#dfe8f0') }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunCol: { value: new THREE.Color('#fff4e0') } };
    const sky = new THREE.Mesh(new THREE.SphereGeometry(700, 32, 16), new THREE.ShaderMaterial({
      uniforms: this.skyU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vd; void main(){ vd = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vd;
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1,0)),f.x), mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x), f.y); }
        void main(){ float h = clamp(vd.y*1.3+0.04,0.0,1.0); vec3 c = mix(bot, top, pow(h,0.6));
          float s = max(dot(vd, sunDir),0.0); c += sunCol * (pow(s, 900.0)*4.0 + pow(s, 12.0)*0.3);
          if (vd.y > 0.02) { vec2 uv = vd.xz / (vd.y + 0.15) * 1.6; float cl = n2(uv)*0.55 + n2(uv*2.3)*0.3 + n2(uv*5.1)*0.15; cl = smoothstep(0.52, 0.8, cl) * smoothstep(0.02, 0.2, vd.y); c = mix(c, vec3(1.0,0.99,0.97), cl*0.85); }
          gl_FragColor = vec4(c,1.0); }`,
    }));
    sky.renderOrder = -10; this.sky = sky; this.scene.add(sky);
  }
  mesh(parent, geo, mat, x, y, z, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
  box(parent, w, h, d, mat, x, y, z, U = 2, V = 2, cast = true) { return this.mesh(parent, uvBox(new THREE.BoxGeometry(w, h, d), w, h, d, U, V), mat, x, y, z, cast); }
  /** A box sitting on the floor at (x, z) whose bottom is at y. */
  boxOn(parent, w, h, d, mat, x, y, z, U, V, cast) { return this.box(parent, w, h, d, mat, x, y + h / 2, z, U, V, cast); }
  floor(parent, x0, z0, x1, z1, mat, U = 2, y = 0.01) {
    const w = x1 - x0, d = z1 - z0, g = floorUV(new THREE.PlaneGeometry(w, d), w, d, U, x0, z0); g.rotateX(-Math.PI / 2);
    const m = this.mesh(parent, g, mat, (x0 + x1) / 2, y, (z0 + z1) / 2, false); return m;
  }
  ceiling(parent, x0, z0, x1, z1, y, mat, U = 1.2) {
    const w = x1 - x0, d = z1 - z0, g = floorUV(new THREE.PlaneGeometry(w, d), w, d, U, x0, z0); g.rotateX(Math.PI / 2);
    const m = this.mesh(parent, g, mat, (x0 + x1) / 2, y, (z0 + z1) / 2, false); m.receiveShadow = false; return m;
  }
  plane(parent, w, h, mat, x, y, z, ry = 0) { const m = this.mesh(parent, new THREE.PlaneGeometry(w, h), mat, x, y, z, false); m.rotation.y = ry; return m; }
  solid(x0, z0, x1, z1) { this.boxes.push([x0, z0, x1, z1]); }
  troffer(parent, x, z, y = H - 0.02, rot = 0) {
    const M = this.M;
    const f = this.mesh(parent, new THREE.BoxGeometry(rot ? 1.2 : 0.62, 0.05, rot ? 0.62 : 1.2), M.trim, x, y, z, false);
    const l = this.mesh(parent, new THREE.BoxGeometry(rot ? 1.1 : 0.52, 0.02, rot ? 0.52 : 1.1), M.lamp, x, y - 0.03, z, false);
    f.receiveShadow = l.receiveShadow = false;
    this.fixtures.push(new THREE.Vector3(x, y - 0.3, z));
  }

  // ------------------------------------------------------------------ the whole campus
  build() {
    const M = this.M = {
      hall: std(0xffffff, 0.85, 0, { map: TX.block('#ece6d6') }), room: std(0xffffff, 0.85, 0, { map: TX.block('#eee9dc', 'r') }), gymwall: std(0xffffff, 0.85, 0, { map: TX.block('#dfe6ee', 'g') }),
      cafwall: std(0xffffff, 0.85, 0, { map: TX.block('#f2e6c8', 'c') }), libwall: std(0xffffff, 0.85, 0, { map: TX.block('#e6ecdc', 'l') }),
      brick: std(0xffffff, 0.92, 0, { map: TX.brick() }),
      lino: phys({ map: TX.lino(), roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.12 }), linoRoom: phys({ map: TX.lino(null), roughness: 0.36, clearcoat: 0.45, clearcoatRoughness: 0.15 }),
      quarry: std(0xffffff, 0.55, 0, { map: TX.quarry() }), terrazzo: phys({ map: TX.terrazzo(), roughness: 0.18, clearcoat: 0.8, clearcoatRoughness: 0.06 }), bath: std(0xffffff, 0.3, 0, { map: TX.bath() }),
      carpet: std(0xffffff, 1, 0, { map: TX.carpet('#3a4a6a') }), carpetG: std(0xffffff, 1, 0, { map: TX.carpet('#3a5a44', 'g') }),
      gymfloor: phys({ map: TX.wood(), roughness: 0.28, clearcoat: 0.85, clearcoatRoughness: 0.08 }),
      court: new THREE.MeshStandardMaterial({ map: TX.court(), transparent: true, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }),
      ceil: std(0xffffff, 0.95, 0, { map: TX.ceiling() }), lockers: std(0xffffff, 0.42, 0.55, { map: TX.lockers() }), lockersG: std(0xffffff, 0.42, 0.55, { map: TX.lockers('#c89a1a') }),
      grass: std(0xffffff, 1, 0, { map: TX.grass() }), turf: std(0xffffff, 0.95, 0, { map: TX.turf() }), asphalt: std(0xffffff, 0.92, 0, { map: TX.asphalt() }), sidewalk: std(0xffffff, 0.9, 0, { map: TX.sidewalk() }), track: std(0xffffff, 0.9, 0, { map: TX.track() }), roof: std(0xffffff, 0.95, 0, { map: TX.roof() }),
      books: std(0xffffff, 0.8, 0, { map: TX.books() }), bleach: std(0xffffff, 0.6, 0, { map: TX.bleach() }),
      trim: std(0x5a5e66, 0.5, 0.3), base: std(0x1e1e22, 0.7), door: std(0x9a7048, 0.55), metal: std(0x8a9098, 0.4, 0.7), chrome: std(0xd8dee6, 0.15, 1), white: std(0xf4f4f0, 0.55), black: std(0x151518, 0.5),
      lamp: new THREE.MeshStandardMaterial({ color: 0xf6f8ff, emissive: 0xf2f6ff, emissiveIntensity: 1.6 }),
      glass: phys({ color: 0xb8d4e8, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, envMapIntensity: 1.5 }),
      deskTop: std(0xd8c8a0, 0.45), deskLeg: std(0x3a3e44, 0.4, 0.7), chair: std(0x2a5ab0, 0.45), chairR: std(0xc83a2a, 0.45), labTop: std(0x1a1a1c, 0.3), wood: std(0x8a5a30, 0.55), darkwood: std(0x4a2e1a, 0.5),
      whiteboard: std(0xf8f8f8, 0.2), chalk: std(0x2a3a30, 0.9), red: std(0xb8202a, 0.6), blue: std(0x1f4fa8, 0.6), gold: phys({ color: 0xffc83a, metalness: 1, roughness: 0.2, clearcoat: 0.6 }),
      bench: std(0x1f4fa8, 0.5), tableTop: std(0xe8e4d8, 0.35), steel: std(0xc0c6cc, 0.3, 0.8), food1: std(0xe8b040, 0.7), food2: std(0x6aa83a, 0.8), food3: std(0xc84a2a, 0.6),
      curtain: std(0x8a1020, 0.85), yellow: std(0xf2b418, 0.45, 0.1), tire: std(0x1a1a1a, 0.9), bark: std(0x5a4030, 0.95), leaf: std(0x3a6a2a, 0.9), leaf2: std(0x4a7a30, 0.9), leaf3: std(0x2e5a24, 0.9),
      sheet: std(0xf4f6f8, 0.9), porcelain: phys({ color: 0xf8f8f8, roughness: 0.15, clearcoat: 1 }), mirror: std(0xdfe8f0, 0.02, 1), stall: std(0x6a8aa8, 0.5, 0.3), plant: std(0x2a6a2a, 0.8), pot: std(0x8a5a3a, 0.7),
      paper: std(0xf6f2e6, 0.9), screen: new THREE.MeshStandardMaterial({ color: 0x0a1a2a, emissive: 0x2a6aa8, emissiveIntensity: 0.6 }), couch: std(0x6a3a2a, 0.9),
    };
    const L = this.level = new THREE.Group(); this.scene.add(L);
    this.fx = new THREE.Group(); L.add(this.fx);
    this.actors = new THREE.Group(); L.add(this.actors);
    this.dyn = new THREE.Group(); L.add(this.dyn);
    this.dynamic = new Set([this.fx, this.actors, this.dyn]);
    this.glassGeos = [];
    this.floors(L); this.walls(L); this.hallway(L); this.classrooms(L); this.cafeteria(L); this.lobby(L); this.office(L); this.library(L); this.smallRooms(L); this.gym(L); this.outside(L);
    // all the window glass as a single mesh
    if (this.glassGeos.length) { const gm = new THREE.Mesh(mergeGeometries(this.glassGeos), M.glass); gm.renderOrder = 2; L.add(gm); }
    L.traverse(o => { if (o.isMesh && o.receiveShadow === undefined) o.receiveShadow = true; });
    this.mergeStatic(L);
    this.lightPool();
    this.setTime(0.2);
  }
  mergeStatic(L) {
    const groups = new Map(), drop = [];
    L.updateMatrixWorld(true);
    const visit = o => {
      if (this.dynamic.has(o) || o.userData.dynamic) return;
      if (o.isMesh && !o.isInstancedMesh && o.visible && !Array.isArray(o.material) && !o.material.transparent && !o.userData.keep) {
        const key = o.material.uuid + (o.castShadow ? 'c' : '') + (o.receiveShadow ? 'r' : '');
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
        for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n);
        if (g.attributes.uv) {
          g.applyMatrix4(o.matrixWorld);
          if (!groups.has(key)) groups.set(key, { mat: o.material, cast: o.castShadow, recv: o.receiveShadow, geos: [] });
          groups.get(key).geos.push(g); drop.push(o);
        }
      }
      for (const c of [...o.children]) visit(c);
    };
    for (const c of [...L.children]) visit(c);
    for (const o of drop) o.parent.remove(o);
    for (const { mat, cast, recv, geos } of groups.values()) {
      for (let i = 0; i < geos.length; i += 500) {
        const m = new THREE.Mesh(mergeGeometries(geos.slice(i, i + 500)), mat); m.castShadow = cast; m.receiveShadow = recv; m.matrixAutoUpdate = false; L.add(m);
      }
    }
  }
  floors(L) {
    const M = this.M, FL = { lino: M.linoRoom, caf: M.quarry, terrazzo: M.terrazzo, carpet: M.carpet, carpetG: M.carpetG, bath: M.bath, wood: M.gymfloor };
    this.floor(L, HALL.x0, HALL.z0, HALL.x1, HALL.z1, M.lino, 2.4);
    for (const r of Object.values(ROOMS)) {
      this.floor(L, r.x0, r.z0, r.x1, r.z1, FL[r.floor] || M.linoRoom, r.floor === 'wood' ? 4 : r.floor === 'carpet' || r.floor === 'carpetG' ? 2 : 2.4);
      const top = r.id === 'gym' ? 7 : H;
      this.ceiling(L, r.x0, r.z0, r.x1, r.z1, top, r.id === 'gym' ? M.roof : M.ceil, r.id === 'gym' ? 4 : 1.2);
    }
    // the doorway thresholds (so there's no grass showing under the gaps)
    for (const p of wallPieces()) void p;
    this.floor(L, -44.3, -1.2, -43.7, 1.2, M.lino, 2.4, 0.012);
    this.floor(L, 43.7, -2.2, 44.3, 2.2, M.lino, 2.4, 0.012);
    this.ceiling(L, HALL.x0, HALL.z0, HALL.x1, HALL.z1, H, M.ceil);
    for (let x = -42; x <= 42; x += 4) this.troffer(L, x, 0, H - 0.02, 1);
    // roofs (they don't cast shadows: the sun lights the school from above like skylights)
    const roof = (x0, z0, x1, z1, y) => { const m = this.floor(L, x0 - 0.3, z0 - 0.3, x1 + 0.3, z1 + 0.3, M.roof, 4, y); m.castShadow = false; m.receiveShadow = false; };
    roof(-44, -13, 44, 3, H + 0.55); roof(-44, 3, -18, 21, H + 0.55); roof(-18, 3, -6, 15, H + 0.55); roof(-6, 3, 6, 12, H + 0.55); roof(6, 3, 26, 17, H + 0.55); roof(26, 3, 34, 10, H + 0.55); roof(34, 3, 44, 9, H + 0.55); roof(44, -15, 76, 15, 7.55);
  }
  walls(L) {
    const M = this.M;
    const matFor = (kind, x, z) => {
      const r = ROOMS[(() => { for (const [id, q] of Object.entries(ROOMS)) if (x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) return id; return 'hall'; })()];
      if (!r) return M.hall; if (r.id === 'gym') return M.gymwall; if (r.id === 'cafeteria') return M.cafwall; if (r.id === 'library') return M.libwall; if (r.id === 'restroom') return M.bath; return M.room;
    };
    for (const p of wallPieces()) {
      const gymSide = Math.min(p.x0, p.x1) >= 43.9, hgt = gymSide ? 7.2 : H + (p.kind === 'ext' ? 0.6 : 0.05);
      const len = p.horiz ? p.x1 - p.x0 : p.z1 - p.z0; if (len < 0.01) continue;
      const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
      // which side is inside: sample both sides
      const s0 = p.horiz ? [cx, cz - 0.5] : [cx - 0.5, cz], s1 = p.horiz ? [cx, cz + 0.5] : [cx + 0.5, cz];
      const in0 = inside(...s0), in1 = inside(...s1);
      const T = WALL_T;
      const place = (a0, a1, y0, y1, off, thick, mat) => {
        const l = a1 - a0, h = y1 - y0; if (l <= 0.001 || h <= 0.001) return;
        const c = (a0 + a1) / 2;
        if (p.horiz) this.box(L, l, h, thick, mat, c, y0 + h / 2, p.z0 + off);
        else this.box(L, thick, h, l, mat, p.x0 + off, y0 + h / 2, c);
      };
      const a0 = p.horiz ? p.x0 : p.z0, a1 = p.horiz ? p.x1 : p.z1;
      const halves = [];
      if (p.kind === 'ext' || in0 !== in1) {
        // inner painted block + outer brick
        const innerOff = in0 ? -T / 4 : T / 4, outerOff = -innerOff;
        const innerMat = matFor(p.kind, ...(in0 ? s0 : s1));
        halves.push([innerOff, T / 2, innerMat], [outerOff, T / 2, (in0 && in1) ? matFor(p.kind, ...s1) : M.brick]);
      } else {
        const m0 = matFor(p.kind, ...s0), m1 = matFor(p.kind, ...s1);
        if (m0 === m1) halves.push([0, T, m0]); else halves.push([-T / 4, T / 2, m0], [T / 4, T / 2, m1]);
      }
      // windows on outside walls
      const wins = [];
      if (p.kind === 'ext' && len > 2.6) {
        const n = Math.floor((len - 0.8) / 3.4); const start = a0 + (len - n * 3.4) / 2;
        for (let i = 0; i < n; i++) { const c = start + i * 3.4 + 1.7; if (Math.abs(c - FRONT_DOOR.x) < 3 && Math.abs(p.z0 - 15) < 0.1) continue; wins.push([c - 0.95, c + 0.95]); }
      }
      const wy0 = gymSide ? 4.6 : 0.95, wy1 = gymSide ? 6.4 : 2.45;
      for (const [off, thick, mat] of halves) {
        if (!wins.length) { place(a0, a1, 0, hgt, off, thick, mat); continue; }
        place(a0, a1, 0, wy0, off, thick, mat); place(a0, a1, wy1, hgt, off, thick, mat);
        let s = a0; for (const [w0, w1] of wins) { place(s, w0, wy0, wy1, off, thick, mat); s = w1; } place(s, a1, wy0, wy1, off, thick, mat);
      }
      for (const [w0, w1] of wins) {
        const c = (w0 + w1) / 2, wl = w1 - w0, gg = new THREE.BoxGeometry(p.horiz ? wl : 0.03, wy1 - wy0, p.horiz ? 0.03 : wl);
        gg.translate(p.horiz ? c : p.x0, (wy0 + wy1) / 2, p.horiz ? p.z0 : c); this.glassGeos.push(gg);
        // frame, mullion, sill
        if (p.horiz) { this.box(L, wl, 0.06, T + 0.1, M.trim, c, wy0 + 0.03, p.z0); this.box(L, 0.05, wy1 - wy0, 0.06, M.trim, c, (wy0 + wy1) / 2, p.z0); this.box(L, wl, 0.05, 0.08, M.trim, c, wy1 - 0.02, p.z0); }
        else { this.box(L, T + 0.1, 0.06, wl, M.trim, p.x0, wy0 + 0.03, c); this.box(L, 0.06, wy1 - wy0, 0.05, M.trim, p.x0, (wy0 + wy1) / 2, c); this.box(L, 0.08, 0.05, wl, M.trim, p.x0, wy1 - 0.02, c); }
      }
      // skirting
      if (p.horiz) this.box(L, len, 0.1, T + 0.03, M.base, cx, 0.05, p.z0, 2, 2, false); else this.box(L, T + 0.03, 0.1, len, M.base, p.x0, 0.05, cz, 2, 2, false);
    }
    // lintels and frames over every gap
    const lint = (horiz, c, w, at, y0, y1, frame = true) => {
      if (horiz) this.box(L, w, y1 - y0, WALL_T, M.hall, c, (y0 + y1) / 2, at); else this.box(L, WALL_T, y1 - y0, w, M.hall, at, (y0 + y1) / 2, c);
      if (!frame) return;
      for (const s of [-1, 1]) { if (horiz) this.box(L, 0.08, y0, WALL_T + 0.06, M.trim, c + s * (w / 2 - 0.04), y0 / 2, at); else this.box(L, WALL_T + 0.06, y0, 0.08, M.trim, at, y0 / 2, c + s * (w / 2 - 0.04)); }
      if (horiz) this.box(L, w, 0.08, WALL_T + 0.06, M.trim, c, y0 - 0.04, at); else this.box(L, WALL_T + 0.06, 0.08, w, M.trim, at, y0 - 0.04, c);
    };
    for (const r of Object.values(ROOMS)) {
      if (r.id === 'gym') continue;
      const north = r.z1 <= -3, at = north ? -3 : 3;
      for (const d of r.doors || [r.door]) {
        lint(true, d, r.dw, at, r.dw > 3 ? 2.8 : 2.25, H + 0.05, r.dw <= 3);
        // the open door leaf, swung back flat against the classroom wall
        if (r.dw <= 2.4) { const lx = d + r.dw / 2 + 0.45; this.box(L, 0.9, 2.15, 0.05, M.door, lx, 1.08, north ? -3.2 : 3.2); this.box(L, 0.25, 0.4, 0.06, M.glass.clone ? M.trim : M.trim, lx - 0.1, 1.6, north ? -3.23 : 3.23); }
        // the room sign over the door
        const sm = new THREE.MeshStandardMaterial({ map: TX.sign(r.label, '#1a1c22', '#ffffff', 1024, 128), roughness: 0.5 });
        const sg = this.plane(L, r.dw > 3 ? 3.2 : 2.2, 0.28, sm, d, 2.55, at + (north ? 0.14 : -0.14), north ? 0 : Math.PI);
        sg.position.y = r.dw > 3 ? 3.05 : 2.55;
        const stripe = this.plane(L, 0.1, 0.28, new THREE.MeshStandardMaterial({ color: r.color, roughness: 0.5 }), d - (r.dw > 3 ? 1.65 : 1.15) * (north ? 1 : -1), sg.position.y, at + (north ? 0.14 : -0.14), north ? 0 : Math.PI);
        void stripe;
      }
    }
    lint(false, 0, 4, 44, 3.0, 7.2, true);                                 // gym doors
    lint(false, 0, 2, -44, 2.3, H + 0.6, true);                             // back exit
    lint(true, FRONT_DOOR.x, FRONT_DOOR.w, 15, 2.5, H + 0.6, true);         // front doors
    lint(true, GYM_DOOR.x, GYM_DOOR.w, 15, 2.5, 7.2, true);
    lint(true, 3.6, 1.3, 8, 2.2, H + 0.05, true);                            // principal's inner door
    // glass entrance doors, propped open
    for (const s of [-1, 1]) { const g = new THREE.BoxGeometry(0.05, 2.3, 1.4); g.translate(FRONT_DOOR.x + s * 1.55, 1.15, 15.75); this.glassGeos.push(g); this.box(L, 0.07, 2.3, 0.07, M.trim, FRONT_DOOR.x + s * 1.55, 1.15, 16.45); }
    const eg = new THREE.MeshStandardMaterial({ map: TX.sign('EXIT', '#10141a', '#ff3a2a', 256, 96), emissive: 0xffffff, emissiveMap: TX.sign('EXIT', '#10141a', '#ff3a2a', 256, 96), emissiveIntensity: 0.9 });
    const ex = this.plane(L, 0.5, 0.19, eg, -43.85, 2.5, 0, Math.PI / 2); ex.userData.keep = true;
    const ex2 = this.plane(L, 0.5, 0.19, eg, FRONT_DOOR.x, 2.62, 14.85, Math.PI); ex2.userData.keep = true;
  }
  hallway(L) {
    const M = this.M;
    // lockers along both walls, with gaps for doors and fittings
    const skips = { '-3': [[-16.6, 0.8], [-8, 0]], '3': [[10, 0.9], [-3, 1.8], [24, 0.8]] };
    for (const side of [-1, 1]) {
      const z = side * 3, face = z - side * (WALL_T / 2 + 0.23);
      const cuts = [];
      for (const p of wallPieces()) if (p.horiz && Math.abs(p.z0 - z) < 0.01 && p.kind === 'hall') cuts.push([p.x0 + 0.5, p.x1 - 0.5]);
      for (const [a, b] of cuts) {
        let segs = [[a, b]];
        for (const [c, w] of skips[String(z)]) if (w) segs = segs.flatMap(([s0, s1]) => c + w / 2 <= s0 || c - w / 2 >= s1 ? [[s0, s1]] : [[s0, c - w / 2], [c + w / 2, s1]]);
        for (const [s0, s1] of segs) {
          let l = s1 - s0; l = Math.floor(l / 0.4) * 0.4; if (l < 0.8) continue;
          const cx = (s0 + s1) / 2, mat = Math.abs(cx) > 30 ? M.lockersG : M.lockers;
          const g = uvBox(new THREE.BoxGeometry(l, 1.95, 0.46), l, 1.95, 0.46, 1.6, 2.0);
          const m = this.mesh(L, g, mat, cx, 0.975 + 0.1, face);
          if (side > 0) m.rotation.y = Math.PI;
          this.box(L, l, 0.1, 0.5, M.base, cx, 0.05, face, 2, 2, false);
          this.box(L, l, 0.06, 0.5, M.trim, cx, 2.1, face);
          this.solid(s0, Math.min(face, z) - 0.25, s1, Math.max(face, z) + 0.25);
        }
      }
    }
    // your locker: a little sticker and a note so you can find it
    const mine = this.plane(L, 0.22, 0.22, new THREE.MeshStandardMaterial({ map: TX.sign('👀', SCHOOL_GOLD, '#1a1a1a', 128, 128), roughness: 0.5 }), -8, 1.55, -2.5);
    mine.userData.keep = true;
    // fire alarms (red pull boxes with strobes), a water fountain, the club board, trash cans, a clock, banners
    this.alarmLights = [];
    for (const s of SPOTS.filter(s => s.id === 'alarm')) {
      const north = s.z < 0, fz = north ? -2.86 : 2.86;
      this.box(L, 0.16, 0.22, 0.08, M.red, s.x, 1.25, fz);
      this.box(L, 0.1, 0.05, 0.04, M.white, s.x, 1.27, fz + (north ? 0.05 : -0.05));
      const st = this.mesh(L, new THREE.BoxGeometry(0.18, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xff2020, emissiveIntensity: 0 }), s.x, 2.3, fz);
      st.userData.keep = true; this.alarmLights.push(st);
      const lab = this.plane(L, 0.3, 0.08, new THREE.MeshStandardMaterial({ map: TX.sign('PULL IN CASE OF FIRE', '#b8202a', '#fff', 512, 128) }), s.x, 1.5, fz + (north ? 0.045 : -0.045), north ? 0 : Math.PI);
      void lab;
    }
    { const f = SPOTS.find(s => s.id === 'fountain'); this.box(L, 0.5, 0.35, 0.4, M.steel, f.x, 0.9, 2.62); this.box(L, 0.4, 0.05, 0.3, M.chrome, f.x, 1.08, 2.6); }
    { const b = SPOTS.find(s => s.id === 'board'); this.plane(L, 1.6, 1.05, new THREE.MeshStandardMaterial({ map: TX.bulletin(), roughness: 0.9 }), b.x, 1.55, 2.86, Math.PI); }
    for (const x of [-33, -5, 21, 36]) { const tc = this.mesh(L, new THREE.CylinderGeometry(0.26, 0.23, 0.8, 16), M.blue, x, 0.4, -2.2); void tc; this.solid(x - 0.3, -2.5, x + 0.3, -1.9); }
    const clockM = new THREE.MeshStandardMaterial({ map: TX.clock(), roughness: 0.4 });
    for (const x of [-26, 10, 34]) { const c = this.mesh(L, new THREE.CircleGeometry(0.22, 24), clockM, x, 2.6, 2.86, false); c.rotation.y = Math.PI; }
    const posters = ['go', 'be', 'nosmoke', 'vote', 'dance', 'food', 'go', 'be'];
    [-41, -30.5, -19.5, -1, 8.5, 22.5, 33, 42].forEach((x, i) => { if (Math.abs(x - -16.6) < 1) return; this.plane(L, 0.55, 0.75, new THREE.MeshStandardMaterial({ map: TX.poster(posters[i]), roughness: 0.8 }), x, 2.45, -2.86); });
    // a long banner down the hall
    const ban = this.plane(L, 6, 0.8, new THREE.MeshStandardMaterial({ map: TX.sign('GO GOOGLIES! 👀', SCHOOL_BLUE, SCHOOL_GOLD, 1536, 200), side: THREE.DoubleSide, roughness: 0.8 }), 20, 2.9, 0, 0);
    ban.material.side = THREE.DoubleSide;
    const ban2 = this.plane(L, 6, 0.8, new THREE.MeshStandardMaterial({ map: TX.sign('WELCOME TO GOOGLY HIGH', SCHOOL_GOLD, SCHOOL_BLUE, 1536, 200), side: THREE.DoubleSide, roughness: 0.8 }), -24, 2.9, 0, 0);
    void ban2;
  }
  // ------------------------------------------------------------------ classrooms
  classrooms(L) {
    const M = this.M;
    for (const k of ['math', 'english', 'science', 'history', 'art', 'detention']) {
      const r = ROOMS[k], cx = r.cx;
      // lights
      for (const x of k === 'detention' ? [cx] : [cx - 3.5, cx + 3.5]) for (const z of [-10.5, -6.2]) this.troffer(L, x, z);
      // the board
      const chalky = k === 'english' || k === 'history';
      const bw = k === 'detention' ? 3 : 5.2, bh = 1.3;
      this.box(L, bw + 0.14, bh + 0.14, 0.05, M.trim, cx, 1.65, -12.85);
      const c = document.createElement('canvas'); c.width = 1024; c.height = Math.round(1024 * bh / bw);
      const bt = new THREE.CanvasTexture(c); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 8;
      const bm = new THREE.MeshStandardMaterial({ map: bt, roughness: chalky ? 0.9 : 0.18 });
      const board = this.plane(L, bw, bh, bm, cx, 1.65, -12.81); board.userData.keep = true;
      this.box(L, bw, 0.05, 0.1, M.trim, cx, 0.99, -12.78);
      this.boards[k] = { c, g: c.getContext('2d'), tex: bt, chalky };
      this.drawBoard(k, k === 'detention' ? 'DETENTION' : ROOMS[k].name, k === 'detention' ? 'Sit quietly. No phones.' : 'Welcome!');
      // teacher's desk and chair
      if (k !== 'detention') {
        this.boxOn(L, 2.2, 0.06, 0.8, M.wood, cx, 0.74, -11.6); this.boxOn(L, 0.06, 0.74, 0.76, M.darkwood, cx - 1.05, 0, -11.6); this.boxOn(L, 0.5, 0.7, 0.76, M.darkwood, cx + 0.8, 0, -11.6);
        this.boxOn(L, 0.35, 0.25, 0.25, M.paper, cx - 0.6, 0.8, -11.7); const apple = this.mesh(L, new THREE.SphereGeometry(0.06, 12, 8), M.red, cx + 0.5, 0.86, -11.4); void apple;
        const mon = this.boxOn(L, 0.5, 0.32, 0.03, M.black, cx + 0.1, 0.9, -11.85); void mon;
      } else this.boxOn(L, 1.8, 0.06, 0.7, M.wood, cx, 0.74, -11.95);
      // student desks
      const seats = classSeats(k);
      for (const s of seats) this.desk(L, s.x, s.z, k === 'science' ? 'lab' : k === 'art' ? 'art' : 'desk');
      // posters, flag, clock, windows already in the outside wall
      const clockM = new THREE.MeshStandardMaterial({ map: TX.clock(), roughness: 0.4 });
      this.mesh(L, new THREE.CircleGeometry(0.2, 24), clockM, cx - 3.8, 2.75, -12.85, false);
      const ps = { math: ['math', 'be'], english: ['read', 'be'], science: ['atom', 'be'], history: ['history', 'vote'], art: ['art', 'be'], detention: ['be', 'nosmoke'] }[k];
      this.plane(L, 0.6, 0.82, new THREE.MeshStandardMaterial({ map: TX.poster(ps[0]), roughness: 0.8 }), r.x0 + 0.14, 1.9, -7.5, Math.PI / 2);
      this.plane(L, 0.6, 0.82, new THREE.MeshStandardMaterial({ map: TX.poster(ps[1]), roughness: 0.8 }), r.x1 - 0.14, 1.9, -7.5, -Math.PI / 2);
      if (k === 'science') { this.plane(L, 2.6, 1.42, new THREE.MeshStandardMaterial({ map: TX.periodic(), roughness: 0.8 }), r.x1 - 0.14, 1.8, -10.5, -Math.PI / 2); this.boxOn(L, 1.4, 0.9, 0.7, M.labTop, r.x0 + 0.5, 0, -11.2); this.box(L, 1.2, 1.1, 0.7, M.glass.clone(), r.x0 + 0.5, 1.5, -11.2); for (let i = 0; i < 4; i++) { const b = this.mesh(L, new THREE.CylinderGeometry(0.05, 0.07, 0.2, 10), new THREE.MeshStandardMaterial({ color: ['#3ad85a', '#3a8aff', '#ff6a3a', '#e84ae8'][i], transparent: true, opacity: 0.7, roughness: 0.1 }), r.x0 + 0.2 + i * 0.2, 1.0, -11.1); b.userData.keep = true; } }
      if (k === 'history') { this.plane(L, 2.6, 1.42, new THREE.MeshStandardMaterial({ map: TX.worldmap(), roughness: 0.8 }), r.x1 - 0.14, 1.8, -10.5, -Math.PI / 2); const gl = this.mesh(L, new THREE.SphereGeometry(0.2, 20, 14), new THREE.MeshStandardMaterial({ map: TX.worldmap(), roughness: 0.5 }), cx - 0.6, 1.02, -11.5); gl.userData.keep = true; this.globe = gl; }
      if (k === 'art') { this.plane(L, 1.2, 1.2, new THREE.MeshStandardMaterial({ map: TX.colorwheel(), roughness: 0.8 }), r.x1 - 0.14, 1.8, -10.5, -Math.PI / 2); for (let i = 0; i < 3; i++) this.easel(L, r.x0 + 1, -11.8 + i * 1.4); }
      if (k === 'math') { this.plane(L, 1.2, 0.8, new THREE.MeshStandardMaterial({ map: TX.sign('π  √  ∑  ∞', '#1f4fa8', '#fff', 512, 320, 'serif'), roughness: 0.8 }), r.x1 - 0.14, 1.9, -10.5, -Math.PI / 2); }
      if (k === 'english') { for (let i = 0; i < 2; i++) this.box(L, 0.4, 1.8, 1.8, M.books, r.x1 - 0.35, 0.9, -10.8 + i * 1.9, 1, 2); }
      // cubbies / bookshelf by the door
      this.boxOn(L, 2.4, 0.9, 0.4, M.wood, r.x0 + 1.5, 0, -3.35);
    }
  }
  desk(L, x, z, kind = 'desk') {
    const M = this.M;
    if (kind === 'lab') { this.boxOn(L, 1.0, 0.05, 0.62, M.labTop, x, 0.86, z - 0.33); this.boxOn(L, 0.9, 0.84, 0.5, M.white, x, 0, z - 0.33); this.stool(L, x, z + 0.18); return; }
    if (kind === 'art') { this.boxOn(L, 1.0, 0.05, 0.66, M.wood, x, 0.74, z - 0.33); for (const dx of [-0.45, 0.45]) for (const dz of [-0.6, -0.06]) this.boxOn(L, 0.05, 0.74, 0.05, M.deskLeg, x + dx, 0, z + dz); this.stool(L, x, z + 0.18); const pal = this.mesh(L, new THREE.CylinderGeometry(0.1, 0.1, 0.01, 12), M.white, x + 0.25, 0.8, z - 0.4); void pal; return; }
    // the classic combo: a laminate top on a steel frame, a blue plastic chair
    this.boxOn(L, 0.75, 0.04, 0.52, M.deskTop, x, 0.72, z - 0.35);
    this.boxOn(L, 0.66, 0.1, 0.44, M.deskLeg, x, 0.6, z - 0.37);
    for (const dx of [-0.32, 0.32]) for (const dz of [-0.56, -0.14]) this.boxOn(L, 0.035, 0.72, 0.035, M.deskLeg, x + dx, 0, z + dz);
    this.chairAt(L, x, z + 0.18);
  }
  chairAt(L, x, z, mat = this.M.chair, ry = 0) {
    const M = this.M, G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; L.add(G);
    this.boxOn(G, 0.42, 0.04, 0.4, mat, 0, 0.44, 0);
    this.box(G, 0.42, 0.34, 0.04, mat, 0, 0.72, 0.2).rotation.x = -0.08;
    for (const dx of [-0.18, 0.18]) for (const dz of [-0.16, 0.16]) this.boxOn(G, 0.025, 0.44, 0.025, M.deskLeg, dx, 0, dz);
  }
  stool(L, x, z) { const M = this.M; this.mesh(L, new THREE.CylinderGeometry(0.17, 0.17, 0.05, 14), M.chair, x, 0.62, z); for (let i = 0; i < 3; i++) { const a = i / 3 * 6.28; const l = this.box(L, 0.03, 0.62, 0.03, M.deskLeg, x + Math.cos(a) * 0.12, 0.31, z + Math.sin(a) * 0.12); l.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12); } }
  easel(L, x, z) { const M = this.M; for (const dx of [-0.25, 0.25]) { const l = this.box(L, 0.04, 1.6, 0.04, M.wood, x + dx, 0.8, z); l.rotation.z = dx * 0.3; } this.box(L, 0.6, 0.5, 0.03, M.paper, x, 1.2, z + 0.05); const pm = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.55), roughness: 0.8 }); this.box(L, 0.3, 0.2, 0.01, pm, x, 1.25, z + 0.07); }
  drawBoard(k, title, sub = '', lines = []) {
    const b = this.boards[k]; if (!b) return;
    const g = b.g, w = b.c.width, h = b.c.height;
    if (b.chalky) { g.fillStyle = '#2c3e32'; g.fillRect(0, 0, w, h); for (let i = 0; i < 70; i++) { g.fillStyle = 'rgba(255,255,255,.03)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 40 + Math.random() * 90, 10 + Math.random() * 20, Math.random(), 0, 7); g.fill(); } }
    else { g.fillStyle = '#f7f8f8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(120,140,170,.05)'; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 60 + Math.random() * 90, 8 + Math.random() * 16, Math.random(), 0, 7); g.fill(); } }
    const ink = b.chalky ? '#f2f2ea' : { math: '#1a3a9a', science: '#1a7a3a', art: '#c8206a', detention: '#b8202a' }[k] || '#1a1a1a';
    g.fillStyle = ink; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    const font = b.chalky ? '"Chalkboard SE", "Comic Sans MS", cursive' : '"Marker Felt", "Comic Sans MS", cursive';
    g.font = `700 ${Math.round(h * 0.16)}px ${font}`; g.fillText(title, 40, h * 0.24);
    g.fillRect(40, h * 0.28, Math.min(w - 80, g.measureText(title).width), 4);
    g.font = `600 ${Math.round(h * 0.1)}px ${font}`; let y = h * 0.42; if (sub) y = wrapText(g, sub, 40, y, w - 80, h * 0.12);
    g.font = `500 ${Math.round(h * 0.085)}px ${font}`; for (const l of lines) { g.fillText(l, 60, y); y += h * 0.11; }
    g.fillStyle = b.chalky ? '#f2f2ea88' : '#b8202a88'; g.font = `600 ${Math.round(h * 0.07)}px ${font}`; g.textAlign = 'right'; g.fillText(ROOMS[k]?.teacher || '', w - 30, h - 24);
    b.tex.needsUpdate = true;
  }
  cafeteria(L) {
    const M = this.M, r = ROOMS.cafeteria;
    for (let x = -41; x <= -20; x += 4) for (const z of [6, 11, 16]) this.troffer(L, x, z);
    for (const t of TABLES) {
      this.boxOn(L, 4, 0.05, 0.9, M.tableTop, t.x, 0.74, t.z); this.boxOn(L, 3.8, 0.04, 0.3, M.steel, t.x, 0.42, t.z - 0.85); this.boxOn(L, 3.8, 0.04, 0.3, M.steel, t.x, 0.42, t.z + 0.85);
      for (const s of [-0.85, 0.85]) this.boxOn(L, 3.8, 0.05, 0.32, M.bench, t.x, 0.42, t.z + s);
      for (const dx of [-1.6, 1.6]) { this.boxOn(L, 0.06, 0.72, 0.06, M.deskLeg, t.x + dx, 0, t.z); this.boxOn(L, 0.06, 0.06, 1.9, M.deskLeg, t.x + dx, 0.36, t.z); }
      // lunch trays left on the tables
      for (let i = 0; i < 3; i++) { if (t.id === 'empty') break; const tx = t.x - 1.2 + i * 1.1 + Math.random() * 0.2, tz = t.z + (i % 2 ? 0.22 : -0.22); this.boxOn(L, 0.4, 0.02, 0.3, M.steel, tx, 0.79, tz); this.boxOn(L, 0.12, 0.03, 0.1, [M.food1, M.food2, M.food3][i], tx - 0.08, 0.81, tz); }
      const tag = this.plane(L, 1.3, 0.26, new THREE.MeshStandardMaterial({ map: TX.sign(t.name.toUpperCase(), '#ffffffdd', '#1a1a1a', 512, 100), transparent: true }), t.x, 2.6, t.z, 0);
      tag.userData.keep = true; (this.tableTags ||= []).push(tag);
    }
    // the serving line: counter, sneeze guard, trays of food, and the menu board
    this.boxOn(L, 1.5, 0.92, 8, M.steel, -42.8, 0, 9); this.boxOn(L, 1.5, 0.04, 8, M.chrome, -42.8, 0.92, 9);
    this.boxOn(L, 0.45, 0.04, 8, M.chrome, -41.85, 0.86, 9);
    const sg = new THREE.BoxGeometry(0.04, 0.5, 7.6); sg.translate(-42.2, 1.45, 9); this.glassGeos.push(sg);
    for (let i = 0; i < 7; i++) { const f = [M.food1, M.food2, M.food3, M.food1, M.white, M.food2, M.food3][i]; this.boxOn(L, 0.55, 0.08, 0.9, M.steel, -42.8, 0.94, 5.8 + i * 1.08); this.boxOn(L, 0.5, 0.06, 0.8, f, -42.8, 0.97, 5.8 + i * 1.08); }
    for (let i = 0; i < 8; i++) this.boxOn(L, 0.42, 0.02, 0.32, M.tray || M.steel, -41.9, 0.9 + i * 0.022, 4.3);
    this.plane(L, 3.2, 1.25, new THREE.MeshStandardMaterial({ map: TX.menu(), roughness: 0.5, emissive: 0xffffff, emissiveMap: TX.menu(), emissiveIntensity: 0.25 }), -43.85, 2.4, 9, Math.PI / 2);
    this.boxOn(L, 1.4, 2.4, 3, M.steel, -43.2, 0, 16.5); // kitchen doors / fridge wall
    for (const x of [-20, -33]) { this.mesh(L, new THREE.CylinderGeometry(0.3, 0.27, 0.95, 16), M.black, x, 0.47, 4.2); this.solid(x - 0.32, 3.9, x + 0.32, 4.5); }
    this.plane(L, 0.6, 0.82, new THREE.MeshStandardMaterial({ map: TX.poster('food'), roughness: 0.8 }), -18.15, 1.9, 12, -Math.PI / 2);
  }
  lobby(L) {
    const M = this.M;
    for (const z of [6, 11]) for (const x of [-15, -9]) this.troffer(L, x, z);
    // trophy case against the cafeteria wall
    this.boxOn(L, 0.6, 0.9, 5, M.darkwood, -17.6, 0, 9); this.boxOn(L, 0.6, 0.1, 5, M.darkwood, -17.6, 2.3, 9);
    const tg = new THREE.BoxGeometry(0.03, 1.4, 5); tg.translate(-17.3, 1.6, 9); this.glassGeos.push(tg);
    for (let i = 0; i < 9; i++) { const G = new THREE.Group(); G.position.set(-17.65, 0.9 + (i % 2) * 0.7, 6.9 + i * 0.5); L.add(G); this.mesh(G, new THREE.CylinderGeometry(0.06, 0.08, 0.06, 12), M.black, 0, 0.03, 0); this.mesh(G, new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), M.gold, 0, 0.12, 0); this.mesh(G, new THREE.CylinderGeometry(0.09, 0.03, 0.14 + (i % 3) * 0.06, 14), M.gold, 0, 0.26, 0); }
    this.boxOn(L, 0.5, 0.02, 4.8, M.darkwood, -17.6, 1.55, 9);
    // the school seal on the floor
    const seal = this.mesh(L, new THREE.CircleGeometry(2.2, 48), new THREE.MeshStandardMaterial({ map: TX.sign('👀 GOOGLY HIGH 👀', SCHOOL_BLUE, SCHOOL_GOLD, 1024, 1024, '"Arial Black"', 'seal'), roughness: 0.2, polygonOffset: true, polygonOffsetFactor: -1 }), -12, 0.013, 9, false);
    seal.rotation.x = -Math.PI / 2;
    for (const z of [5.5, 12.5]) { this.boxOn(L, 2, 0.45, 0.5, M.darkwood, -7, 0, z); this.solid(-8, z - 0.25, -6, z + 0.25); }
    for (const [x, z] of [[-16.8, 14.2], [-7.2, 14.2]]) { this.mesh(L, new THREE.CylinderGeometry(0.25, 0.2, 0.45, 12), M.pot, x, 0.22, z); this.mesh(L, new THREE.IcosahedronGeometry(0.5, 1), M.plant, x, 0.9, z); this.solid(x - 0.3, z - 0.3, x + 0.3, z + 0.3); }
    this.plane(L, 4, 0.55, new THREE.MeshStandardMaterial({ map: TX.sign('HOME OF THE GOOGLIES', SCHOOL_BLUE, SCHOOL_GOLD, 1536, 200), roughness: 0.6 }), -12, 2.95, 14.85, Math.PI);
  }
  office(L) {
    const M = this.M;
    for (const x of [-3, 3]) { this.troffer(L, x, 5.5); this.troffer(L, x, 10); }
    // front counter + secretary desk
    this.boxOn(L, 7.8, 1.1, 0.7, M.wood, -1.3, 0, 5.55); this.boxOn(L, 7.9, 0.05, 0.8, M.tableTop, -1.3, 1.1, 5.55);
    this.boxOn(L, 1.8, 0.75, 0.8, M.darkwood, -3, 0, 6.9); this.boxOn(L, 0.5, 0.35, 0.05, M.black, -3, 0.78, 7.1); this.chairAt(L, -3, 7.5, M.black, Math.PI);
    this.boxOn(L, 1.2, 1.8, 0.45, M.metal, 5.2, 0, 4.4); // filing cabinet
    // the principal's room: big desk, flag, bookshelf, diplomas and the dreaded chairs
    this.boxOn(L, 2.4, 0.78, 0.9, M.darkwood, 0, 0, 10.6); this.boxOn(L, 2.5, 0.05, 1, M.wood, 0, 0.78, 10.6);
    this.boxOn(L, 0.6, 0.15, 0.1, M.gold, 0, 0.83, 10.15);
    this.chairAt(L, 0, 11.4, M.black, Math.PI); this.chairAt(L, -1, 9.3, M.chairR, 0); this.chairAt(L, 1, 9.3, M.chairR, 0);
    this.box(L, 2.4, 1.8, 0.4, M.books, -3.8, 0.9, 11.7, 1, 2);
    const pole = this.mesh(L, new THREE.CylinderGeometry(0.02, 0.02, 2.4, 8), M.gold, 4.6, 1.2, 11.4); void pole;
    this.plane(L, 0.9, 0.6, new THREE.MeshStandardMaterial({ map: TX.sign('★ GOOGLY ★', SCHOOL_BLUE, '#fff', 300, 200), side: THREE.DoubleSide }), 5.1, 2.0, 11.4, Math.PI / 2);
    for (const x of [-2, 2]) this.plane(L, 0.5, 0.4, new THREE.MeshStandardMaterial({ map: TX.sign('DIPLOMA', '#f4ecd4', '#6a4a2a', 256, 200), roughness: 0.6 }), x, 2.0, 11.86, Math.PI);
    this.plane(L, 1.6, 0.3, new THREE.MeshStandardMaterial({ map: TX.sign('PRINCIPAL GOOGLESWORTH', '#1a1c22', SCHOOL_GOLD, 1024, 160) }), 3.6, 2.5, 7.86, 0);
  }
  library(L) {
    const M = this.M;
    for (const x of [9, 15, 21]) for (const z of [6, 12]) this.troffer(L, x, z);
    for (let i = 0; i < 4; i++) { const x = 12.5 + i * 3.4; this.box(L, 1, 2.1, 5.1, M.books, x, 1.05, 14.05, 1, 2.1); }
    this.box(L, 12, 2.1, 0.5, M.books, 16, 1.05, 16.65, 1, 2.1);
    for (const x of [9, 13]) { this.boxOn(L, 1.8, 0.05, 1.4, M.wood, x, 0.74, 7); for (const dx of [-0.8, 0.8]) this.boxOn(L, 0.06, 0.74, 1.2, M.darkwood, x + dx, 0, 7); for (const s of [-1, 1]) { this.chairAt(L, x - 0.45, 7 + s * 1.0, M.chair, s > 0 ? 0 : Math.PI); this.chairAt(L, x + 0.45, 7 + s * 1.0, M.chair, s > 0 ? 0 : Math.PI); } this.boxOn(L, 0.25, 0.08, 0.3, M.books, x, 0.79, 7); }
    // circulation desk + computers
    this.boxOn(L, 3, 1, 0.8, M.darkwood, 21, 0, 5); this.boxOn(L, 3.1, 0.05, 0.9, M.wood, 21, 1, 5); this.solid(19.5, 4.6, 22.5, 5.4);
    for (let i = 0; i < 3; i++) { this.boxOn(L, 1, 0.75, 0.6, M.white, 24.8, 0, 8 + i * 1.4); const s = this.boxOn(L, 0.05, 0.36, 0.55, M.screen, 24.9, 0.9, 8 + i * 1.4); s.userData.keep = true; this.solid(24.3, 7.7 + i * 1.4, 25.4, 8.3 + i * 1.4); }
    this.plane(L, 0.6, 0.82, new THREE.MeshStandardMaterial({ map: TX.poster('quiet'), roughness: 0.8 }), 6.15, 1.9, 9, Math.PI / 2);
    this.plane(L, 0.6, 0.82, new THREE.MeshStandardMaterial({ map: TX.poster('read'), roughness: 0.8 }), 25.85, 1.9, 13, -Math.PI / 2);
  }
  smallRooms(L) {
    const M = this.M;
    // nurse
    this.troffer(L, 30, 6.5);
    this.boxOn(L, 2.1, 0.55, 0.9, M.metal, 28.1, 0, 6.1); this.boxOn(L, 2, 0.14, 0.85, M.sheet, 28.1, 0.55, 6.1); this.boxOn(L, 0.5, 0.12, 0.7, M.white, 27.3, 0.69, 6.1);
    this.boxOn(L, 1.2, 1.9, 0.45, M.white, 32.8, 0, 9.5); this.plane(L, 0.3, 0.3, new THREE.MeshStandardMaterial({ map: TX.sign('✚', '#fff', '#d82a2a', 128, 128) }), 32.8, 1.5, 9.26, Math.PI);
    this.solid(32.2, 9.2, 33.4, 9.9);
    // restrooms: stalls, sinks, mirrors, a hand dryer
    this.troffer(L, 38, -9); this.troffer(L, 41, -6);
    for (const x of [35.3, 37.7]) { this.boxOn(L, 0.05, 1.9, 3.8, M.stall, x + 1.15, 0.1, -11.1); this.boxOn(L, 2.2, 1.9, 0.05, M.stall, x, 0.1, -9.25); const tb = this.mesh(L, new THREE.CylinderGeometry(0.2, 0.17, 0.42, 14), M.porcelain, x, 0.21, -12.4); void tb; this.boxOn(L, 0.4, 0.4, 0.2, M.porcelain, x, 0.3, -12.8); }
    this.boxOn(L, 0.05, 1.9, 3.8, M.stall, 34.2, 0.1, -11.1);
    for (let i = 0; i < 3; i++) { const z = -8 + i * 1.5; this.boxOn(L, 0.6, 0.18, 0.5, M.porcelain, 43.5, 0.82, z); this.mesh(L, new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), M.chrome, 43.7, 1.1, z); }
    this.boxOn(L, 0.1, 0.1, 0.1, M.chrome, 43.8, 1.0, -8.5);
    const mir = this.plane(L, 0.02 + 4.4, 1, M.mirror, 43.86, 1.65, -6.5, -Math.PI / 2); void mir;
    this.boxOn(L, 0.3, 0.35, 0.25, M.white, 41, 1.2, -12.85);
    // lounge: vending machines, a couch, a bulletin board
    this.troffer(L, 37, 6); this.troffer(L, 41.5, 6);
    for (const [x, k] of [[37, 0], [39.2, 1]]) { this.boxOn(L, 1.05, 1.95, 0.85, M.black, x, 0, 8.45); const f = this.plane(L, 1.0, 1.9, new THREE.MeshStandardMaterial({ map: TX.vending(k), emissive: 0xffffff, emissiveMap: TX.vending(k), emissiveIntensity: 0.45, roughness: 0.25 }), x, 1.0, 8.0, Math.PI); f.userData.keep = true; }
    this.boxOn(L, 2.4, 0.45, 0.9, M.couch, 42, 0, 7.8); this.boxOn(L, 2.4, 0.5, 0.2, M.couch, 42, 0.45, 8.3); this.solid(40.8, 7.3, 43.2, 8.7);
  }
  gym(L) {
    const M = this.M, r = ROOMS.gym;
    this.floor(L, r.x0, r.z0, r.x1, r.z1, M.court, 1, 0.014).geometry = (() => { const g = new THREE.PlaneGeometry(32, 30); g.rotateX(-Math.PI / 2); return g; })();
    // high bay lights
    for (let x = 48; x <= 72; x += 6) for (const z of [-8, 0, 8]) { const l = this.mesh(L, new THREE.CylinderGeometry(0.35, 0.5, 0.35, 16, 1, true), M.metal, x, 6.6, z, false); l.material.side = THREE.DoubleSide; const b = this.mesh(L, new THREE.CircleGeometry(0.48, 16), M.lamp, x, 6.43, z, false); b.rotation.x = Math.PI / 2; this.fixtures.push(new THREE.Vector3(x, 6, z)); }
    // bleachers along the north wall
    for (let i = 0; i < 5; i++) { const d = 0.8, z = BLEACHERS.z1 - 0.4 - i * d, h = 0.45 + i * 0.45; this.boxOn(L, BLEACHERS.x1 - BLEACHERS.x0, h, d, M.bleach, (BLEACHERS.x0 + BLEACHERS.x1) / 2, 0, z, 2, 2); }
    for (const x of [BLEACHERS.x0, BLEACHERS.x1]) this.boxOn(L, 0.06, 1, 4, M.metal, x, 2.25, -12.6);
    // hoops at both ends of the court
    for (const [x, s] of [[45.2, 1], [74.8, -1]]) {
      this.boxOn(L, 0.12, 4.8, 0.12, M.metal, x - s * 0.5, 0, 0);
      this.box(L, 1.4, 0.12, 0.12, M.metal, x, 3.85, 0).rotation.y = Math.PI / 2;
      this.box(L, 0.05, 1.05, 1.8, M.white, x + s * 0.6, 3.5, 0);
      this.box(L, 0.055, 0.45, 0.6, M.red, x + s * 0.6, 3.3, 0);
      const rim = this.mesh(L, new THREE.TorusGeometry(0.23, 0.018, 8, 24), new THREE.MeshStandardMaterial({ color: 0xff5a1a, roughness: 0.4, metalness: 0.5 }), x + s * 0.88, 3.05, 0); rim.rotation.x = Math.PI / 2;
      const net = this.mesh(L, new THREE.CylinderGeometry(0.23, 0.15, 0.4, 12, 3, true), new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true }), x + s * 0.88, 2.84, 0, false); net.userData.keep = true;
    }
    // the stage (for dances, the talent show and graduation), curtains, banners and a scoreboard
    this.boxOn(L, STAGE.x1 - STAGE.x0, STAGE.h, STAGE.z1 - STAGE.z0, M.darkwood, (STAGE.x0 + STAGE.x1) / 2, 0, (STAGE.z0 + STAGE.z1) / 2);
    for (let i = 0; i < 3; i++) this.boxOn(L, 2.2, (i + 1) * 0.3, 0.4, M.darkwood, 60, 0, STAGE.z0 - 0.2 - (2 - i) * 0.4);
    this.box(L, STAGE.x1 - STAGE.x0 + 1, 0.9, 0.2, M.curtain, (STAGE.x0 + STAGE.x1) / 2, 6.2, STAGE.z0 + 0.2);
    for (const x of [STAGE.x0 + 0.8, STAGE.x1 - 0.8]) this.box(L, 1.6, 5.2, 0.25, M.curtain, x, STAGE.h + 2.6, STAGE.z0 + 0.3);
    this.box(L, STAGE.x1 - STAGE.x0, 5.2, 0.1, M.curtain, (STAGE.x0 + STAGE.x1) / 2, STAGE.h + 2.6, STAGE.z1 - 0.3);
    this.plane(L, 9, 1.2, new THREE.MeshStandardMaterial({ map: TX.sign('GOOGLY HIGH GOOGLIES', SCHOOL_BLUE, SCHOOL_GOLD, 1536, 200), roughness: 0.7 }), 60, 5.4, -14.85);
    for (const [x, t] of [[48, 'STATE CHAMPS 2019'], [72, 'REGIONAL CHAMPS 2022']]) this.plane(L, 2.6, 1.3, new THREE.MeshStandardMaterial({ map: TX.sign(t, SCHOOL_GOLD, SCHOOL_BLUE, 768, 380), roughness: 0.7 }), x, 5.3, -14.85);
    const sb = this.boxOn(L, 3.4, 1.5, 0.3, M.black, 75.7, 4, 0); sb.rotation.y = Math.PI / 2;
    this.scoreTex = document.createElement('canvas'); this.scoreTex.width = 512; this.scoreTex.height = 224;
    this.scoreMap = new THREE.CanvasTexture(this.scoreTex); this.scoreMap.colorSpace = THREE.SRGBColorSpace;
    const sp = this.plane(L, 3.2, 1.4, new THREE.MeshStandardMaterial({ map: this.scoreMap, emissive: 0xffffff, emissiveMap: this.scoreMap, emissiveIntensity: 0.9 }), 75.5, 4.75, 0, -Math.PI / 2); sp.userData.keep = true;
    this.setScore(0, 0, 'HOME', 'AWAY');
    // the event decorations live in their own group: switched on for dances, the talent show, the big game and graduation
    this.eventG = new THREE.Group(); this.eventG.visible = false; this.dyn.add(this.eventG);
  }
  setScore(a, b, ha = 'GOOGLIES', aw = 'VISITORS', clock = '') {
    const g = this.scoreTex.getContext('2d'), w = 512, h = 224;
    g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd23a'; g.font = 'bold 26px monospace'; g.textAlign = 'center'; g.fillText(ha, 128, 40); g.fillText(aw, 384, 40);
    g.fillStyle = '#ff3a2a'; g.font = 'bold 110px monospace'; g.fillText(String(a).padStart(2, '0'), 128, 150); g.fillText(String(b).padStart(2, '0'), 384, 150);
    g.fillStyle = '#3aff6a'; g.font = 'bold 36px monospace'; g.fillText(clock, 256, 205); this.scoreMap.needsUpdate = true;
  }
  // ------------------------------------------------------------------ outside: lawn, flagpole, bus loop, parking lot, football field, trees
  outside(L) {
    const M = this.M;
    const g = new THREE.PlaneGeometry(460, 360); g.rotateX(-Math.PI / 2); floorUV(g, 1, 1, 1);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 460 / 6, uv.getY(i) * 360 / 6);
    this.mesh(L, g, M.grass, -15, -0.01, 0, false);
    // front walk, bus loop and parking lot
    this.floor(L, FRONT_DOOR.x - 2, 15, FRONT_DOOR.x + 2, 30, M.sidewalk, 1.5, 0.02);
    this.floor(L, -60, 30, 44, 38, M.asphalt, 6, 0.015);
    this.floor(L, -60, 29.3, 44, 30, M.sidewalk, 1.5, 0.03);
    for (let x = -58; x < 42; x += 4) this.boxOn(L, 2, 0.02, 0.15, M.yellow, x, 0.016, 34, 1, 1, false);
    this.floor(L, 4, 18, 44, 29.3, M.asphalt, 6, 0.016);
    for (let x = 6; x < 44; x += 3) for (const z of [20.5, 26.5]) this.boxOn(L, 0.12, 0.02, 4.4, M.white, x, 0.017, z, 1, 1, false);
    const carCols = [0xc8202a, 0x2a4a8a, 0xe8e8e8, 0x1a1a1a, 0x8a8a90, 0x2a6a3a, 0xd8a820];
    for (let i = 0; i < 16; i++) { if (Math.random() < 0.3) continue; const x = 7.5 + (i % 8) * 4.5, z = i < 8 ? 20.5 : 26.5; this.car(L, x, z, carCols[i % carCols.length], i < 8 ? 0 : Math.PI); }
    this.floor(L, -6, 15, 6, 18, M.sidewalk, 1.5, 0.02); this.floor(L, 46, 15, 50, 30, M.sidewalk, 1.5, 0.02); this.floor(L, -60, -1.5, -44, 1.5, M.sidewalk, 1.5, 0.02);
    // flagpole with a waving flag
    this.boxOn(L, 1.6, 0.3, 1.6, M.sidewalk, FLAG.x, 0, FLAG.z);
    this.mesh(L, new THREE.CylinderGeometry(0.06, 0.1, 11, 10), M.chrome, FLAG.x, 5.5, FLAG.z); this.mesh(L, new THREE.SphereGeometry(0.14, 10, 8), M.gold, FLAG.x, 11.05, FLAG.z);
    const fg = new THREE.PlaneGeometry(2.6, 1.6, 20, 10); fg.translate(1.3, 0, 0);
    const flagTex = tex('flag', 512, 320, (g2, w, h) => { g2.fillStyle = SCHOOL_BLUE; g2.fillRect(0, 0, w, h); g2.fillStyle = SCHOOL_GOLD; g2.fillRect(0, h * 0.4, w, h * 0.2); g2.beginPath(); g2.arc(w * 0.3, h * 0.5, h * 0.28, 0, 7); g2.fill(); g2.fillStyle = '#fff'; g2.beginPath(); g2.arc(w * 0.26, h * 0.48, h * 0.1, 0, 7); g2.arc(w * 0.36, h * 0.48, h * 0.1, 0, 7); g2.fill(); g2.fillStyle = '#000'; g2.beginPath(); g2.arc(w * 0.27, h * 0.52, h * 0.045, 0, 7); g2.arc(w * 0.37, h * 0.52, h * 0.045, 0, 7); g2.fill(); });
    this.flag = this.mesh(this.dyn, fg, new THREE.MeshStandardMaterial({ map: flagTex, side: THREE.DoubleSide, roughness: 0.8 }), FLAG.x + 0.05, 10.1, FLAG.z);
    this.flagBase = fg.attributes.position.array.slice();
    // the monument sign on the front lawn, big letters over the doors
    this.boxOn(L, 5, 0.6, 0.8, M.brick, -26, 0, 25); this.boxOn(L, 4.6, 1.3, 0.3, M.white, -26, 0.6, 25);
    this.plane(L, 4.4, 1.2, new THREE.MeshStandardMaterial({ map: TX.sign('GOOGLY HIGH SCHOOL', '#fafafa', SCHOOL_BLUE, 1536, 400), roughness: 0.6 }), -26, 1.25, 25.16);
    this.plane(L, 4.4, 1.2, new THREE.MeshStandardMaterial({ map: TX.sign('HOME OF THE GOOGLIES', '#fafafa', SCHOOL_BLUE, 1536, 400), roughness: 0.6 }), -26, 1.25, 24.84, Math.PI);
    this.solid(-28.6, 24.5, -23.4, 25.5);
    const bigSign = this.plane(L, 9, 0.9, new THREE.MeshStandardMaterial({ map: TX.sign('GOOGLY HIGH SCHOOL', '#00000000', '#f2c030', 2048, 200, 'Futura, "Arial Black"', 'big'), transparent: true, roughness: 0.3, metalness: 0.6 }), -12, 3.35, 15.14);
    bigSign.userData.keep = true;
    // bushes along the front, trees around campus
    for (let x = -43; x < -18; x += 2.2) this.bush(L, x, 21.9);
    for (let x = -17; x < -14; x += 2) this.bush(L, x, 15.9); for (let x = -9.5; x < -6; x += 2) this.bush(L, x, 15.9);
    for (let x = 7; x < 26; x += 2.4) this.bush(L, x, 17.9);
    const trees = [[-50, 25], [-56, 34], [-35, 45], [-5, 44], [20, 45], [48, 25], [60, 40], [82, 20], [85, -5], [84, -28], [60, -26], [30, -24], [0, -26], [-25, -25], [-48, -30], [-118, -40], [-120, 0], [-118, 36], [-60, 46], [-80, 42], [70, -40], [-20, -44], [38, -40], [90, 42]];
    for (const [x, z] of trees) this.tree(L, x, z, 0.8 + Math.random() * 0.5);
    // the football field and track behind the school (out the back exit)
    const F = FIELD;
    this.floor(L, F.x0 - 5, F.z0 - 5, F.x1 + 5, F.z1 + 5, M.track, 3, 0.012);
    this.floor(L, F.x0, F.z0, F.x1, F.z1, M.turf, 8, 0.02);
    for (let x = F.x0 + 3; x <= F.x1 - 3; x += 5) this.boxOn(L, 0.15, 0.01, F.z1 - F.z0 - 2, M.white, x, 0.021, 0, 1, 1, false);
    for (const s of [-1, 1]) this.boxOn(L, F.x1 - F.x0, 0.01, 0.2, M.white, (F.x0 + F.x1) / 2, 0.021, s * (F.z1 - 0.6), 1, 1, false);
    for (const x of [F.x0 + 1, F.x1 - 1]) { const Y = std(0xffd23a, 0.4, 0.3); this.boxOn(L, 0.15, 3, 0.15, Y, x, 0, 0); this.box(L, 0.15, 0.15, 5.6, Y, x, 3, 0); for (const z of [-2.8, 2.8]) this.boxOn(L, 0.12, 5, 0.12, Y, x, 3, z); }
    for (let i = 0; i < 6; i++) this.boxOn(L, 32, 0.4 + i * 0.4, 0.8, M.bleach, -84, 0, -29.4 - i * 0.8, 2, 2);
    this.plane(L, 10, 1.5, new THREE.MeshStandardMaterial({ map: TX.sign('GOOGLIES FIELD', SCHOOL_BLUE, SCHOOL_GOLD, 1536, 230), roughness: 0.7, side: THREE.DoubleSide }), -84, 4.2, -34.2);
    // chain-link fence around the field
    const fence = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.6, roughness: 0.4, wireframe: true });
    for (const [x0, z0, x1, z1] of [[-122, -36, -50, -36], [-122, 36, -50, 36], [-122, -36, -122, 36]]) { const l = Math.hypot(x1 - x0, z1 - z0); const f = this.mesh(L, new THREE.PlaneGeometry(l, 2, Math.round(l * 3), 6), fence, (x0 + x1) / 2, 1, (z0 + z1) / 2, false); f.rotation.y = x0 === x1 ? Math.PI / 2 : 0; f.userData.keep = true; }
    // the school bus: parked in the loop, drives in each morning (dynamic)
    this.bus = this.makeBus(); this.bus.position.set(-19, 0, 33.7); this.dyn.add(this.bus);
  }
  car(L, x, z, col, ry) {
    const M = this.M, G = new THREE.Group(); G.position.set(x, 0, z); G.rotation.y = ry; L.add(G);
    const paint = phys({ color: col, roughness: 0.25, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.05 });
    this.boxOn(G, 1.8, 0.7, 4.2, paint, 0, 0.3, 0); this.boxOn(G, 1.6, 0.55, 2.2, paint, 0, 1.0, -0.2);
    this.boxOn(G, 1.62, 0.45, 2.1, std(0x1a2230, 0.1, 0.5), 0, 1.03, -0.2);
    for (const dx of [-0.85, 0.85]) for (const dz of [-1.35, 1.35]) { const w = this.mesh(G, new THREE.CylinderGeometry(0.34, 0.34, 0.25, 14), M.tire, dx, 0.34, dz); w.rotation.z = Math.PI / 2; }
    this.solid(x - 1.1, z - 2.2, x + 1.1, z + 2.2);
  }
  makeBus() {
    const M = this.M, G = new THREE.Group();
    const body = new THREE.Group(); G.add(body);
    this.boxOn(body, 11, 2.3, 2.5, M.yellow, 0, 0.55, 0); this.boxOn(body, 1.4, 1.2, 2.4, M.yellow, 6.1, 0.55, 0);
    this.box(body, 9.6, 0.8, 2.52, std(0x1a1e24, 0.1, 0.4), -0.6, 2.2, 0);
    this.box(body, 11, 0.08, 2.52, M.black, 0, 1.45, 0); this.box(body, 11, 0.08, 2.52, M.black, 0, 1.1, 0);
    this.box(body, 0.1, 1.0, 2.2, std(0x1a1e24, 0.1, 0.4), 5.52, 2.2, 0);
    const sign = this.plane(body, 3, 0.4, new THREE.MeshStandardMaterial({ map: TX.sign('SCHOOL BUS', M.yellow.color.getStyle(), '#111', 768, 100) }), 0, 2.72, 1.26); sign.position.y = 2.72;
    const sign2 = sign.clone(); sign2.position.z = -1.26; sign2.rotation.y = Math.PI; body.add(sign2);
    for (const x of [-3.6, 4.2]) for (const z of [-1.1, 1.1]) { const w = this.mesh(body, new THREE.CylinderGeometry(0.52, 0.52, 0.35, 16), M.tire, x, 0.52, z); w.rotation.x = Math.PI / 2; }
    this.boxOn(body, 0.2, 0.3, 2.3, M.black, 6.85, 0.5, 0);
    for (const z of [-0.8, 0.8]) { const hl = this.mesh(body, new THREE.CircleGeometry(0.14, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4c0, emissiveIntensity: 1 }), 6.81, 1.05, z, false); hl.rotation.y = Math.PI / 2; }
    this.busDoor = this.box(body, 0.9, 1.9, 0.06, std(0x1a1e24, 0.1, 0.4), 4.9, 1.5, 1.27);
    const stop = this.mesh(body, new THREE.CircleGeometry(0.28, 8), new THREE.MeshStandardMaterial({ map: TX.sign('STOP', '#c8202a', '#fff', 256, 256) }), 3.8, 1.9, -1.3, false); stop.rotation.y = Math.PI;
    G.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    return G;
  }
  bush(L, x, z) { const M = this.M; for (let i = 0; i < 3; i++) { const b = this.mesh(L, new THREE.IcosahedronGeometry(0.55 + Math.random() * 0.25, 1), [M.leaf, M.leaf2, M.leaf3][i], x + (i - 1) * 0.5, 0.45, z + Math.random() * 0.3); b.scale.y = 0.75; } }
  tree(L, x, z, s = 1) {
    const M = this.M;
    this.mesh(L, new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 3.6 * s, 10), M.bark, x, 1.8 * s, z);
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, r = 1.1 * s; this.mesh(L, new THREE.IcosahedronGeometry((1.3 + Math.random() * 0.6) * s, 1), [M.leaf, M.leaf2, M.leaf3][i % 3], x + Math.cos(a) * r, (4.2 + Math.random() * 1.4) * s, z + Math.sin(a) * r); }
    this.mesh(L, new THREE.IcosahedronGeometry(1.7 * s, 1), M.leaf2, x, 5.8 * s, z);
    this.solid(x - 0.35 * s, z - 0.35 * s, x + 0.35 * s, z + 0.35 * s);
  }
  // ------------------------------------------------------------------ lights: a small pool of point lights that follow you between the ceiling fixtures
  lightPool() {
    this.pool = [];
    const n = this.lq ? 2 : 6;
    for (let i = 0; i < n; i++) { const l = new THREE.PointLight(0xf4f6ff, 5, 9, 1.6); l.position.set(0, -50, 0); this.scene.add(l); this.pool.push(l); }
    this.poolT = 0;
  }
  updatePool(cam) {
    this.poolT -= 1; if (this.poolT > 0) return; this.poolT = 20;
    const p = cam.position, fwd = new THREE.Vector3(); cam.getWorldDirection(fwd);
    const ranked = this.fixtures.map(f => { const d = f.distanceTo(p) - Math.max(0, fwd.dot(f.clone().sub(p))) * 0.3; return [d, f]; }).sort((a, b) => a[0] - b[0]);
    const gymK = this.eventMode ? 0.35 : 1;
    this.pool.forEach((l, i) => { const f = ranked[i]?.[1]; if (f) { l.position.copy(f); const gymL = f.y > 5; l.distance = gymL ? 18 : 9; l.intensity = (gymL ? 22 : 5) * (gymL ? gymK : 1); } });
  }
  /** k: 0 = 7:30am … 1 = 3:30pm. The sun climbs, peaks around lunch and drifts west. */
  setTime(k) {
    this.timeK = k;
    const az = -1.2 + k * 2.4, el = 0.85 + Math.sin(k * Math.PI) * 0.5;
    this.sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el) * 0.6 + 0.2).normalize();
    this.skyU.sunDir.value.copy(this.sunDir);
    const warm = 1 - Math.sin(k * Math.PI);
    this.sun.color.setHSL(0.1, 0.5 + warm * 0.3, 0.9 - warm * 0.08);
    this.sun.intensity = 2.2 + Math.sin(k * Math.PI) * 0.6;
  }
  // ------------------------------------------------------------------ special events in the gym
  setEvent(kind) {
    if (kind === this.eventMode) return;
    this.eventMode = kind;
    const G = this.eventG; for (const c of [...G.children]) G.remove(c);
    G.visible = !!kind; this.discoLights = []; this.balloons = [];
    this.hemi.intensity = kind === 'dance' || kind === 'prom' ? 0.35 : 1.25;
    this.poolT = 0;
    if (!kind) return;
    const M = this.M;
    if (kind === 'dance' || kind === 'prom') {
      const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 2), phys({ color: 0xffffff, metalness: 1, roughness: 0.05, flatShading: true })); ball.position.set(60, 5.6, 0); G.add(ball); this.discoBall = ball;
      const cols = kind === 'prom' ? [0xff8ad8, 0xa88aff, 0xffd8a0, 0x8ad8ff] : [0xff2a6a, 0x2aff8a, 0x2a8aff, 0xffd23a];
      for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(cols[i], 30, 22, 1.4); l.position.set(52 + i * 5.3, 5, (i % 2 ? -1 : 1) * 5); G.add(l); this.discoLights.push(l); }
      // light beams (additive cones)
      for (let i = 0; i < 6; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.4, 6.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: cols[i % 4], transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); c.position.set(50 + i * 4, 3.4, 0); G.add(c); this.discoLights.push({ beam: c, i }); }
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.2), new THREE.MeshStandardMaterial({ map: TX.sign(kind === 'prom' ? '✨ PROM NIGHT: A NIGHT IN PARIS ✨' : '🪩 HOMECOMING DANCE 🪩', kind === 'prom' ? '#2a1a4a' : '#1a1a4a', '#ffd23a', 1536, 180), emissive: 0xffffff, emissiveMap: TX.sign(kind === 'prom' ? '✨ PROM NIGHT: A NIGHT IN PARIS ✨' : '🪩 HOMECOMING DANCE 🪩', kind === 'prom' ? '#2a1a4a' : '#1a1a4a', '#ffd23a', 1536, 180), emissiveIntensity: 0.6 }));
      banner.position.set(60, 4.6, STAGE.z0 + 0.05); banner.rotation.y = Math.PI; G.add(banner);
    }
    if (kind === 'talent' || kind === 'grad' || kind === 'election') {
      const sp = new THREE.PointLight(0xfff0d8, 40, 14, 1.4); sp.position.set(60, 5, 10); G.add(sp);
      const title = { talent: '⭐ GOOGLY GOT TALENT ⭐', grad: '🎓 CONGRATULATIONS, GRADUATES! 🎓', election: '🗳 CLASS PRESIDENT DEBATE 🗳' }[kind];
      const bt = TX.sign(title, SCHOOL_BLUE, SCHOOL_GOLD, 1536, 180);
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.2), new THREE.MeshStandardMaterial({ map: bt, emissive: 0xffffff, emissiveMap: bt, emissiveIntensity: 0.4 }));
      banner.position.set(60, 4.6, STAGE.z0 + 0.05); banner.rotation.y = Math.PI; G.add(banner);
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.6), M.darkwood); pod.position.set(62.5, STAGE.h + 0.6, 12.2); pod.castShadow = true; G.add(pod);
      // rows of folding chairs on the court
      if (kind !== 'talent' || true) for (let row = 0; row < 5; row++) for (let i = 0; i < 12; i++) { const c = new THREE.Group(); c.position.set(53.4 + i * 1.2, 0, 1 + row * -1.8); G.add(c); const s = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.4), kind === 'grad' ? M.white : M.metal); s.position.y = 0.46; c.add(s); const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.04), kind === 'grad' ? M.white : M.metal); b.position.set(0, 0.7, -0.2); c.add(b); for (const dx of [-0.18, 0.18]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.46, 0.02), M.deskLeg); l.position.set(dx, 0.23, 0); c.add(l); } c.rotation.y = 0; }
    }
    // balloons everywhere
    const bc = kind === 'grad' ? [SCHOOL_BLUE, SCHOOL_GOLD, '#ffffff'] : kind === 'prom' ? ['#ff8ad8', '#a88aff', '#ffffff', '#ffd23a'] : ['#ff2a6a', '#2a8aff', '#ffd23a', '#2aff8a', '#ffffff'];
    for (let i = 0; i < 40; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), phys({ color: new THREE.Color(bc[i % bc.length]), roughness: 0.2, clearcoat: 1 })); b.scale.y = 1.2; const side = i % 4; b.position.set(side < 2 ? 45 + Math.random() * 30 : side === 2 ? 44.6 : 75.4, side < 2 ? 6.2 + Math.random() * 0.6 : 1 + Math.random() * 3, side === 0 ? -14.6 : side === 1 ? 14.4 : -12 + Math.random() * 24); G.add(b); this.balloons.push({ m: b, y: b.position.y, t: Math.random() * 6 }); }
  }
  setAlarm(on) { this.alarmOn = on; if (!on) for (const l of this.alarmLights) l.material.emissiveIntensity = 0; }
  // ------------------------------------------------------------------ effects
  /** kind: 'food' | 'paper' | 'confetti' | 'sparkle' | 'splash' | 'caps' */
  burst(kind, pos, n = 12, dir = null) {
    const cols = { food: [0xe8b040, 0x6aa83a, 0xc84a2a, 0xf4f0e0, 0x8a4a1a], paper: [0xf6f2e6], confetti: [0xff2a6a, 0x2a8aff, 0xffd23a, 0x2aff8a, 0xffffff], sparkle: [0xfff0a0], splash: [0x8ac8ff], caps: [0x1f4fa8] }[kind] || [0xffffff];
    for (let i = 0; i < n; i++) {
      const geo = kind === 'confetti' ? new THREE.PlaneGeometry(0.06, 0.1) : kind === 'caps' ? new THREE.BoxGeometry(0.4, 0.03, 0.4) : new THREE.SphereGeometry(kind === 'paper' ? 0.07 : kind === 'sparkle' ? 0.03 : 0.05 + Math.random() * 0.04, 6, 5);
      const mat = kind === 'sparkle' ? new THREE.MeshBasicMaterial({ color: cols[0], transparent: true }) : new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.6, side: THREE.DoubleSide, transparent: true });
      const m = new THREE.Mesh(geo, mat); m.position.copy(pos); m.castShadow = kind !== 'sparkle'; this.fx.add(m);
      const v = dir ? dir.clone().multiplyScalar(0.8 + Math.random() * 0.4).add(new THREE.Vector3(rnd(-1, 1), rnd(0, 1.5), rnd(-1, 1))) : new THREE.Vector3(rnd(-2.5, 2.5), rnd(2, 5.5), rnd(-2.5, 2.5));
      if (kind === 'caps') v.set(rnd(-1.5, 1.5), rnd(7, 10), rnd(-1.5, 1.5));
      this.parts.push({ m, v, life: kind === 'confetti' || kind === 'caps' ? 4 : kind === 'sparkle' ? 1 : 2.5, spin: new THREE.Vector3(rnd(-8, 8), rnd(-8, 8), rnd(-8, 8)), kind, grav: kind === 'confetti' ? 2 : kind === 'sparkle' ? -1 : 9.8, drag: kind === 'confetti' ? 1.6 : 0.2 });
    }
  }
  /** A thrown thing (paper ball, food) flying from a to b over t seconds. */
  throwAt(kind, a, b, t = 0.7, onHit = null) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(kind === 'paper' ? 0.08 : 0.07, 8, 6), new THREE.MeshStandardMaterial({ color: kind === 'paper' ? 0xf6f2e6 : [0xe8b040, 0x6aa83a, 0xc84a2a][Math.random() * 3 | 0], roughness: 0.7 }));
    m.position.copy(a); m.castShadow = true; this.fx.add(m);
    const v = b.clone().sub(a).divideScalar(t); v.y += 4.9 * t;
    this.parts.push({ m, v, life: t, grav: 9.8, drag: 0, spin: new THREE.Vector3(6, 4, 0), onHit, end: b.clone(), kind });
  }
  update(dt, t, cam) {
    const f = this.focus.copy(cam.position);
    this.sun.position.copy(f).addScaledVector(this.sunDir, 120); this.sun.target.position.copy(f);
    this.sky.position.copy(cam.position);
    this.updatePool(cam);
    // the flag waves
    if (this.flag) { const p = this.flag.geometry.attributes.position, b = this.flagBase; for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setZ(i, Math.sin(x * 2.2 - t * 5) * 0.14 * x / 2.6 + Math.sin(y * 3 + t * 3) * 0.03 * x / 2.6); } p.needsUpdate = true; this.flag.geometry.computeVertexNormals(); }
    if (this.globe) this.globe.rotation.y += dt * 0.2;
    // particles
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i]; q.life -= dt;
      q.v.y -= q.grav * dt; q.v.multiplyScalar(1 - q.drag * dt); q.m.position.addScaledVector(q.v, dt);
      if (q.spin) { q.m.rotation.x += q.spin.x * dt; q.m.rotation.y += q.spin.y * dt; }
      if (q.m.position.y < 0.03 && !q.end) { q.m.position.y = 0.03; q.v.set(0, 0, 0); q.spin = null; }
      if (q.life < 0.5 && !q.end) q.m.material.opacity = Math.max(0, q.life * 2);
      if (q.life <= 0) { if (q.onHit) q.onHit(q.m.position.clone()); if (q.end && q.kind === 'food') this.burst('food', q.m.position, 8); this.fx.remove(q.m); q.m.geometry.dispose(); q.m.material.dispose(); this.parts.splice(i, 1); }
    }
    // event lights
    if (this.eventMode && this.discoBall) {
      this.discoBall.rotation.y += dt * 0.8;
      for (const d of this.discoLights) { if (d.beam) { d.beam.rotation.z = Math.sin(t * 0.9 + d.i) * 0.5; d.beam.rotation.x = Math.cos(t * 0.7 + d.i * 1.3) * 0.4; } else d.intensity = 18 + Math.sin(t * 6 + d.position.x) * 14; }
    }
    if (this.balloons) for (const b of this.balloons) b.m.position.y = b.y + Math.sin(t * 1.2 + b.t) * 0.08;
    if (this.alarmOn) { const on = Math.floor(t * 3) % 2 === 0; for (const l of this.alarmLights) l.material.emissiveIntensity = on ? 6 : 0; }
    this.adapt(dt);
  }
  adapt(dt) {
    this.ft = (this.ft ?? 1 / 60) * 0.95 + dt * 0.05; this.adT = (this.adT || 0) + dt;
    if (this.adT < 2 || this.lq) return;
    const fps = 1 / this.ft;
    let d = this.dpr;
    if (fps < 45 && d > 0.7) d = Math.max(0.7, d - 0.15);
    else if (fps > 58 && d < this.maxDpr) d = Math.min(this.maxDpr, d + 0.1);
    if (d !== this.dpr) { this.dpr = d; this.renderer.setPixelRatio(d); this.resize(); this.adT = 0; } else this.adT = 1.2;
  }
  render() { this.renderer.render(this.scene, this.camera); }
}
