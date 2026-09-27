// The googly: a glossy jelly bean with wobbly googly eyes — students, teachers, the principal, the coach, lunch staff and the janitor.
import * as THREE from 'three';

export const SCALE = 1.2;
const std = (color, rough = 0.6, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
export function textSprite(text, { size = 44, color = '#fff', bg = 'rgba(0,0,0,.55)', border = null, pad = 12 } = {}) {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const font = `900 ${size}px "Avenir Next", system-ui, sans-serif`;
  g.font = font;
  const w = g.measureText(text).width + pad * 2, h = size * 1.25 + pad * 2;
  c.width = Math.ceil(w); c.height = Math.ceil(h);
  g.font = font;
  if (bg) { g.fillStyle = bg; rr(g, 0, 0, c.width, c.height, 16); g.fill(); }
  if (border) { g.strokeStyle = border; g.lineWidth = 5; rr(g, 3, 3, c.width - 6, c.height - 6, 14); g.stroke(); }
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, c.width / 2, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, transparent: true }));
  s.scale.set(c.width / 200, c.height / 200, 1); s.renderOrder = 10;
  return s;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x, y, r); g.closePath(); }

// ------------------------------------------------------------------ skins (picked on the title screen)
export const SKINS = [
  { id: 'none', name: 'Classic', price: 0, dot: c => c },
  { id: 'polka', name: 'Polka Dots', price: 100, dot: c => `radial-gradient(circle at 30% 30%, #fff 18%, transparent 20%), radial-gradient(circle at 70% 65%, #fff 16%, ${c} 18%)` },
  { id: 'camo', name: 'Camo', price: 150, dot: () => 'radial-gradient(#6b7a3a 30%, #3a2e1c 60%)' },
  { id: 'zebra', name: 'Zebra', price: 200, dot: () => 'repeating-linear-gradient(70deg,#f4f4f4 0 5px,#141414 5px 9px)' },
  { id: 'tiger', name: 'Tiger', price: 250, dot: () => 'repeating-linear-gradient(60deg,#ff8a1c 0 5px,#1a1008 5px 8px)' },
  { id: 'cookie', name: 'Cookie', price: 300, dot: () => 'radial-gradient(circle at 35% 35%, #3a2010 12%, transparent 14%), radial-gradient(circle at 65% 60%, #3a2010 10%, #c98a4a 12%)' },
  { id: 'denim', name: 'Denim', price: 350, dot: () => 'repeating-linear-gradient(45deg,#3a5f9a 0 2px,#2c4a7a 2px 4px)' },
  { id: 'galaxy', name: 'Galaxy', price: 500, dot: () => 'radial-gradient(#ff4fd8, #3a0a6a 50%, #001a3a)' },
  { id: 'chrome', name: 'Chrome', price: 700, dot: () => 'linear-gradient(135deg,#fff,#8a96a8,#fff)' },
  { id: 'rainbow', name: 'Rainbow', price: 900, dot: () => 'linear-gradient(90deg,#ff2d55,#ffd60a,#34c759,#0a84ff,#bf5af2)' },
  { id: 'lava', name: 'Lava', price: 1100, dot: () => 'radial-gradient(#ff5a00 20%, #1a0a06 70%)' },
  { id: 'gold', name: 'Solid Gold', price: 1500, dot: () => 'linear-gradient(135deg,#fff3b0,#d4a52a,#fff3b0)' },
];
const skinCache = new Map();
function skinTex(id, color) {
  const key = id + color;
  if (skinCache.has(key)) return skinCache.get(key);
  const base = new THREE.Color(color), hex = '#' + base.getHexString();
  const dk = '#' + base.clone().multiplyScalar(0.45).getHexString(), lt = '#' + base.clone().lerp(new THREE.Color('#fff'), 0.35).getHexString();
  let t = null;
  if (id === 'camo') t = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#6b7a3a'; g.fillRect(0, 0, w, w);
    for (const [c, n] of [['#4a5a2a', 26], ['#3a2e1c', 18], ['#8f9a5a', 16], [hex, 8]]) for (let i = 0; i < n; i++) {
      g.fillStyle = c; g.beginPath(); const x = Math.random() * w, y = Math.random() * w;
      for (let k = 0; k < 9; k++) { const a = k / 9 * 6.28, r = 12 + Math.random() * 22; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7); }
      g.fill();
    }
  });
  if (id === 'polka') t = canvasTex(256, 256, (g, w) => {
    g.fillStyle = hex; g.fillRect(0, 0, w, w); g.fillStyle = '#fff';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.beginPath(); g.arc(x * 32 + (y % 2) * 16 + 8, y * 32 + 16, 7, 0, 7); g.fill(); }
  });
  if (id === 'zebra') t = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#f2f2f0'; g.fillRect(0, 0, w, w); g.fillStyle = '#141414';
    for (let i = 0; i < 12; i++) { const y = i * 22 + Math.random() * 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(70, y - 16, 120, y + 20, 256, y + 4); g.lineTo(256, y + 11); g.bezierCurveTo(120, y + 26, 70, y - 6, 0, y + 9); g.fill(); }
  });
  if (id === 'tiger') t = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#ff8a1c'; g.fillRect(0, 0, w, w); g.fillStyle = '#1a1008';
    for (let i = 0; i < 14; i++) { const y = i * 19 + Math.random() * 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(60, y - 12, 100, y + 18, 140 + Math.random() * 60, y + 3); g.lineTo(130, y + 8); g.bezierCurveTo(90, y + 16, 50, y + 2, 0, y + 9); g.fill(); }
  });
  if (id === 'cookie') t = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#c98a4a'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? '#b0763a44' : '#e0a86044'; g.fillRect(Math.random() * w, Math.random() * w, 4, 4); }
    g.fillStyle = '#3a2010'; for (let i = 0; i < 26; i++) { const x = Math.random() * w, y = Math.random() * w; g.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = 5 + Math.random() * 6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
  });
  if (id === 'denim') t = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#34588f'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < w * 2; i += 3) { g.strokeStyle = i % 2 ? '#2a4674' : '#4a6fa8'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(i, 0); g.lineTo(i - w, w); g.stroke(); }
    g.strokeStyle = '#e8a33a'; g.setLineDash([6, 5]); g.lineWidth = 2.5; for (const y of [60, 196]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  });
  if (id === 'galaxy') t = canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#12002e'); gr.addColorStop(0.5, '#3a0a6a'); gr.addColorStop(1, '#001a3a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) { const x = Math.random() * w, y = Math.random() * h, r = 40 + Math.random() * 70; const n = g.createRadialGradient(x, y, 0, x, y, r); n.addColorStop(0, ['#ff4fd8aa', '#4fc3ffaa', '#b388ffaa'][i % 3]); n.addColorStop(1, '#0000'); g.fillStyle = n; g.fillRect(0, 0, w, h); }
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(255,255,255,${Math.random()})`; g.fillRect(Math.random() * w, Math.random() * h, Math.random() < 0.1 ? 2 : 1, 1); }
  });
  if (id === 'rainbow') t = canvasTex(512, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); ['#ff2d55', '#ff9500', '#ffd60a', '#34c759', '#0a84ff', '#5e5ce6', '#bf5af2', '#ff2d55'].forEach((c, i, a) => gr.addColorStop(i / (a.length - 1), c)); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  if (id === 'lava') t = canvasTex(256, 256, (g, w) => {
    g.fillStyle = '#1a0a06'; g.fillRect(0, 0, w, w); g.strokeStyle = '#ff5a00'; g.lineCap = 'round';
    for (let i = 0; i < 26; i++) { g.lineWidth = 1 + Math.random() * 4; g.beginPath(); let x = Math.random() * w, y = Math.random() * w; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 50; y += (Math.random() - 0.5) * 50; g.lineTo(x, y); } g.stroke(); }
  });
  if (id === 'none') t = canvasTex(128, 128, (g, w) => { g.fillStyle = hex; g.fillRect(0, 0, w, w); for (let i = 0; i < 600; i++) { g.fillStyle = Math.random() < 0.5 ? lt + '18' : dk + '18'; g.fillRect(Math.random() * w, Math.random() * w, 3, 3); } });
  skinCache.set(key, t);
  return t;
}
function skinMaterial(id, color) {
  const c = new THREE.Color(color);
  switch (id) {
    case 'gold': return new THREE.MeshPhysicalMaterial({ color: 0xffc83a, metalness: 1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 });
    case 'chrome': return new THREE.MeshPhysicalMaterial({ color: 0xe8eef5, metalness: 1, roughness: 0.08, clearcoat: 1 });
    case 'lava': return new THREE.MeshPhysicalMaterial({ map: skinTex('lava', color), emissive: 0xff4a00, emissiveMap: skinTex('lava', color), emissiveIntensity: 1.8, roughness: 0.5 });
    case 'galaxy': return new THREE.MeshPhysicalMaterial({ map: skinTex('galaxy', color), emissive: 0xffffff, emissiveMap: skinTex('galaxy', color), emissiveIntensity: 0.35, roughness: 0.25, clearcoat: 1 });
    case 'camo': case 'tiger': case 'rainbow': case 'polka': case 'zebra': case 'cookie': case 'denim':
      return new THREE.MeshPhysicalMaterial({ map: skinTex(id, color), roughness: id === 'camo' || id === 'denim' || id === 'cookie' ? 0.75 : 0.35, clearcoat: id === 'camo' || id === 'denim' || id === 'cookie' ? 0 : 0.6 });
    default: return new THREE.MeshPhysicalMaterial({ color: c, map: skinTex('none', color), roughness: 0.28, clearcoat: 0.7, clearcoatRoughness: 0.2, sheen: 0.4, sheenColor: c.clone().lerp(new THREE.Color('#fff'), 0.5) });
  }
}

// ------------------------------------------------------------------ clothes, hats and things to hold
const M = {
  black: std(0x121316, 0.55), white: std(0xfafafa, 0.6), gold: std(0xffc83a, 0.3, 1), steel: std(0x9aa4b4, 0.35, 0.9),
  suit: std(0x2a2e38, 0.6), shirt: std(0xf2f2f2, 0.6), red: std(0xc01818, 0.5), navy: std(0x1e2c4a, 0.7), brown: std(0x6a4a2a, 0.7),
  apron: std(0xf4f4f0, 0.8), net: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.9, transparent: true, opacity: 0.55 }),
  overall: std(0x2e4a7a, 0.85), scrubs: std(0x2a8a8a, 0.8), wood: std(0x8a5a2a, 0.6), mophead: std(0xd8d0b8, 1), paper: std(0xf6f2e6, 0.9),
  track: std(0xb8202a, 0.55), stripe: std(0xf4f4f4, 0.5), tray: std(0x8aa0a8, 0.4, 0.2), glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, roughness: 0.05, transparent: true, opacity: 0.25, clearcoat: 1 }),
};
const matCache = new Map();
const cloth = (hex, rough = 0.78) => { const k = hex + ':' + rough; if (!matCache.has(k)) matCache.set(k, std(new THREE.Color(hex), rough)); return matCache.get(k); };
function cyl(rt, rb, h, mat, y, open = false, seg = 24) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat); m.position.y = y; m.castShadow = true; return m; }
function box(w, h, d, mat, x, y, z) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; return m; }
function labelTex(text, bg, fg, w = 256, h = 64) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = `900 ${h * 0.62}px "Arial Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const labMats = new Map();
function labelMat(text, bg, fg) { const k = text + bg + fg; if (!labMats.has(k)) labMats.set(k, new THREE.MeshStandardMaterial({ map: labelTex(text, bg, fg), roughness: 0.7 })); return labMats.get(k); }
// a shell that hugs the jelly-bean body from y0 to y1 (so shirts look worn, not like a tube)
const shellCache = new Map();
function bodyShell(y0, y1, off = 0.014, flare = 0) {
  const key = [y0, y1, off, flare].join();
  if (shellCache.has(key)) return shellCache.get(key);
  const pts = [], N = 22;
  for (let i = 0; i <= N; i++) {
    const y = y0 + (y1 - y0) * i / N;
    let r = 0.3; if (y < 0.21) r = Math.sqrt(Math.max(0.0004, 0.09 - (0.21 - y) ** 2)); if (y > 0.59) r = Math.sqrt(Math.max(0.0004, 0.09 - (y - 0.59) ** 2));
    pts.push(new THREE.Vector2(r + off + flare * Math.max(0, (0.18 - y)) * 2, y));
  }
  const g = new THREE.LatheGeometry(pts, 32); shellCache.set(key, g); return g;
}
function shell(mat, y0, y1, off, flare) { const m = new THREE.Mesh(bodyShell(y0, y1, off, flare), mat); m.castShadow = true; return m; }
function glasses(G, round = true, sun = false) {
  const fr = sun ? M.black : std(0x2a1a10, 0.4);
  for (const x of [-0.125, 0.125]) {
    const r = new THREE.Mesh(round ? new THREE.TorusGeometry(0.14, 0.013, 6, 24) : new THREE.TorusGeometry(0.145, 0.016, 4, 4), fr); r.position.set(x, 0.66, 0.305); r.rotation.y = x * 2.2; if (!round) r.rotation.z = Math.PI / 4; G.add(r);
    if (sun) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.135, 20), new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.82 })); l.position.set(x, 0.66, 0.31); l.rotation.y = x * 2.2; G.add(l); }
  }
  G.add(box(0.05, 0.015, 0.015, fr, 0, 0.7, 0.325));
}
export const HATS = ['none', 'cap', 'backcap', 'beanie', 'headphones', 'bow', 'glasses', 'shades'];
function hat(kind, color, G) {
  const c = new THREE.Color(color);
  if (kind === 'cap' || kind === 'backcap') {
    const m = std(c, 0.7), H = new THREE.Group();
    const cr = new THREE.Mesh(new THREE.SphereGeometry(0.312, 24, 10, 0, Math.PI * 2, 0, 1.0), m); cr.position.y = 0.6; H.add(cr);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 20, 1, false, -Math.PI / 2, Math.PI), m); b.position.set(0, 0.84, 0.22); b.rotation.x = 0.15; H.add(b);
    const bt = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), m); bt.position.y = 0.915; H.add(bt);
    if (kind === 'backcap') H.rotation.y = Math.PI;
    G.add(H);
  }
  if (kind === 'beanie') { const m = std(c, 0.95); const b = new THREE.Mesh(new THREE.SphereGeometry(0.318, 20, 10, 0, Math.PI * 2, 0, 1.1), m); b.position.y = 0.62; G.add(b); G.add(cyl(0.305, 0.305, 0.09, m, 0.8)); const p = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), m); p.position.y = 0.95; G.add(p); }
  if (kind === 'headphones') {
    const m = std(c, 0.35, 0.2), d = std(0x1a1a1e, 0.5);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 8, 24, Math.PI), m); band.position.y = 0.6; G.add(band);
    for (const x of [-1, 1]) { const cup = cyl(0.09, 0.09, 0.07, d, 0); cup.rotation.z = Math.PI / 2; cup.position.set(x * 0.33, 0.6, 0); G.add(cup); const ring = cyl(0.095, 0.095, 0.02, m, 0); ring.rotation.z = Math.PI / 2; ring.position.set(x * 0.37, 0.6, 0); G.add(ring); }
  }
  if (kind === 'bow') { const m = std(c, 0.45); for (const x of [-1, 1]) { const k = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 14), m); k.rotation.z = x * Math.PI / 2; k.position.set(0.13 + x * 0.1, 0.86, 0.1); G.add(k); } const n = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), m); n.position.set(0.13, 0.86, 0.1); G.add(n); }
  if (kind === 'glasses') glasses(G, false);
  if (kind === 'shades') glasses(G, true, true);
}
export const TOPS = ['tee', 'hoodie', 'polo', 'jersey', 'sweater'];
export const PANTS = ['#2e4a7a', '#3a3a3e', '#b8a078', '#5a6a4a', '#1e2230', '#7a8aa8'];
/** Everything worn: role gear or a student's own clothes. */
function outfit(role, o, googly) {
  const G = new THREE.Group(), add = x => { G.add(x); return x; };
  const sleeves = [];
  const tie = (mat = M.red) => { add(box(0.05, 0.18, 0.02, mat, 0, 0.25, 0.318)); add(box(0.07, 0.04, 0.025, mat, 0, 0.35, 0.314)); };
  const collar = mat => { for (const x of [-1, 1]) { const c = add(box(0.1, 0.03, 0.06, mat, x * 0.06, 0.38, 0.29)); c.rotation.set(0.4, 0, x * 0.5); } };
  const badge = (text, bg = '#fff', fg = '#1e2c4a') => { const b = add(new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.05), labelMat(text, bg, fg))); b.position.set(-0.14, 0.38, 0.297); b.rotation.y = -0.45; };
  switch (role) {
    case 'student': {
      const top = cloth(o.top || '#d8403a'), acc = cloth(new THREE.Color(o.top || '#d8403a').offsetHSL(0, 0, -0.18).getStyle());
      const style = o.style || 'tee';
      add(shell(top, -0.04, style === 'hoodie' || style === 'sweater' ? 0.4 : 0.37, 0.014));
      if (style === 'hoodie') { const h = add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 8, 16, Math.PI), top)); h.position.set(0, 0.42, -0.24); h.rotation.set(-0.9, 0, 0); add(box(0.26, 0.1, 0.03, acc, 0, 0.08, 0.305)); for (const x of [-0.05, 0.05]) add(box(0.012, 0.12, 0.012, M.white, x, 0.33, 0.31)); }
      if (style === 'polo') { collar(top); add(box(0.04, 0.1, 0.01, acc, 0, 0.32, 0.315)); }
      if (style === 'jersey') { const n = add(new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.16), labelMat(String(o.num ?? 7), o.top || '#d8403a', '#fff'))); n.position.set(0, 0.2, 0.318); const nb = n.clone(); nb.position.z = -0.318; nb.rotation.y = Math.PI; add(nb); }
      if (style === 'sweater') { for (let i = 0; i < 3; i++) { const s = add(new THREE.Mesh(new THREE.TorusGeometry(0.316, 0.008, 4, 32), acc)); s.rotation.x = Math.PI / 2; s.position.y = 0.12 + i * 0.1; } }
      sleeves.push([top, style === 'hoodie' || style === 'sweater' ? 0.85 : 0.35]);
      if (o.pack !== false) {
        const pk = cloth(o.pack || '#2a3a5a', 0.85);
        const bp = add(new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.2, 4, 10), pk)); bp.scale.set(1.25, 1, 0.62); bp.position.set(0, 0.32, -0.36);
        add(box(0.2, 0.14, 0.06, pk, 0, 0.18, -0.46));
        for (const x of [-0.14, 0.14]) { const st = add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 4, 12, Math.PI * 0.9), M.black)); st.position.set(x, 0.32, -0.02); st.rotation.set(0, Math.PI / 2, Math.PI * 0.55); }
        googly.pack = bp;
      }
      break;
    }
    case 'teacher': {
      const sh = cloth(o.top || '#c8d8f0', 0.7); add(shell(sh, -0.04, 0.39, 0.014)); collar(sh); tie(cloth(o.tie || '#8a1a2a', 0.5));
      if (o.cardigan) { add(shell(cloth(o.cardigan, 0.9), -0.02, 0.36, 0.03)); }
      glasses(G, o.round !== false); sleeves.push([sh, 0.8]); badge('STAFF'); break;
    }
    case 'principal': add(shell(M.suit, -0.06, 0.39, 0.02)); add(box(0.15, 0.16, 0.01, M.shirt, 0, 0.31, 0.318)); tie(M.red); glasses(G, false); sleeves.push([M.suit, 0.85]); badge('PRINCIPAL', '#ffd23a', '#2a1a00'); break;
    case 'coach': {
      add(shell(M.track, -0.04, 0.4, 0.016)); for (const x of [-1, 1]) add(box(0.02, 0.5, 0.012, M.stripe, x * 0.2, 0.22, 0.3)).rotation.y = x * -0.6;
      const w = add(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.006, 4, 20), M.black)); w.position.set(0, 0.42, 0.14); w.rotation.x = 1.25;
      add(box(0.05, 0.03, 0.06, M.steel, 0, 0.26, 0.32)); sleeves.push([M.track, 0.85]); hat('cap', '#b8202a', G); break;
    }
    case 'lunch': add(shell(cloth('#e8e0d0'), -0.04, 0.38, 0.014)); add(shell(M.apron, -0.06, 0.34, 0.03)); { const n = new THREE.Mesh(new THREE.SphereGeometry(0.33, 20, 10, 0, Math.PI * 2, 0, 1.15), M.net); n.position.y = 0.6; add(n); } sleeves.push([cloth('#e8e0d0'), 0.35]); badge('CAFETERIA', '#fff', '#8a1a1a'); break;
    case 'janitor': add(shell(cloth('#8a8a80'), -0.04, 0.38, 0.012)); add(shell(M.overall, -0.06, 0.3, 0.024)); for (const x of [-0.13, 0.13]) add(box(0.06, 0.1, 0.012, M.overall, x, 0.34, 0.3)); sleeves.push([cloth('#8a8a80'), 0.4]); hat('cap', '#2e4a7a', G); badge('MAINT.'); break;
    case 'librarian': { const cd = cloth(o.top || '#7a5a8a', 0.9); add(shell(cd, -0.04, 0.39, 0.018)); for (let i = 0; i < 4; i++) add(new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), M.white)).position.set(0, 0.1 + i * 0.1, 0.32); glasses(G, true); sleeves.push([cd, 0.85]); break; }
    case 'nurse': add(shell(M.scrubs, -0.04, 0.38, 0.016)); sleeves.push([M.scrubs, 0.35]); badge('NURSE', '#fff', '#c01818'); break;
    case 'secretary': { const b = cloth(o.top || '#d88aa0', 0.7); add(shell(b, -0.04, 0.38, 0.014)); collar(b); glasses(G, true); sleeves.push([b, 0.4]); break; }
  }
  // formal wear and gowns on top of anything (prom / graduation)
  if (o.formal) { add(shell(M.suit, -0.02, 0.39, 0.03)); add(box(0.16, 0.14, 0.01, M.shirt, 0, 0.31, 0.334)); for (const x of [-1, 1]) { const k = add(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.07, 3), M.black)); k.rotation.z = x * Math.PI / 2; k.position.set(x * 0.035, 0.36, 0.34); } const fl = add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), cloth(o.flower || '#ff5a8a', 0.5))); fl.position.set(-0.15, 0.4, 0.3); sleeves.length = 0; sleeves.push([M.suit, 0.85]); }
  if (o.gown) {
    const gm = cloth(o.gown, 0.6); add(shell(gm, -0.14, 0.4, 0.03, 0.35)); sleeves.length = 0; sleeves.push([gm, 0.9]);
    const cap = new THREE.Group(); cap.position.y = 0.86; add(cap);
    cap.add(cyl(0.26, 0.28, 0.12, gm, 0)); const board = box(0.62, 0.025, 0.62, gm, 0, 0.07, 0); board.rotation.y = Math.PI / 4; cap.add(board);
    const tas = box(0.012, 0.18, 0.012, M.gold, 0.26, -0.02, 0.08); cap.add(tas); cap.add(new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), M.gold)).position.set(0, 0.09, 0);
    googly.gradCap = cap;
  }
  if (o.crown) { const cr = new THREE.Group(); cr.position.y = 0.88; cr.add(cyl(0.2, 0.2, 0.08, M.gold, 0, true)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, p = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), M.gold); p.position.set(Math.cos(a) * 0.2, 0.08, Math.sin(a) * 0.2); cr.add(p); const gem = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), std(i % 2 ? 0xff2a4a : 0x2a8aff, 0.1, 0.3)); gem.position.set(Math.cos(a) * 0.205, 0.0, Math.sin(a) * 0.205); cr.add(gem); } add(cr); }
  if (!o.gown && o.hat && o.hat !== 'none') hat(o.hat, o.hatColor || o.top || '#3a6ad8', G);
  G.traverse(x => { if (x.isMesh) x.castShadow = true; });
  return { G, sleeves };
}
/** Things a googly can hold in its right hand. */
function makeProp(kind) {
  const G = new THREE.Group();
  if (kind === 'book') { G.add(box(0.2, 0.26, 0.05, cloth('#2a5a9a', 0.6), 0, 0, 0)); G.add(box(0.19, 0.25, 0.045, M.paper, 0.006, 0, 0)); }
  if (kind === 'clipboard') { G.add(box(0.2, 0.28, 0.015, M.wood, 0, 0, 0)); G.add(box(0.17, 0.22, 0.017, M.paper, 0, -0.01, 0)); G.add(box(0.08, 0.03, 0.02, M.steel, 0, 0.13, 0)); }
  if (kind === 'tray') { G.add(box(0.42, 0.02, 0.3, M.tray, 0, 0, 0.12)); G.add(box(0.12, 0.03, 0.1, cloth('#e8b040', 0.7), -0.08, 0.025, 0.12)); G.add(box(0.07, 0.1, 0.07, cloth('#ffffff', 0.4), 0.12, 0.06, 0.1)); G.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), cloth('#d83a2a', 0.4))).position.set(0.05, 0.04, 0.2); }
  if (kind === 'mop') { const s = cyl(0.015, 0.015, 1.4, M.wood, 0); s.position.set(0, 0.1, 0.1); G.add(s); const h = cyl(0.12, 0.16, 0.14, M.mophead, -0.62); h.position.z = 0.1; G.add(h); G.rotation.x = 0.35; }
  if (kind === 'phone') G.add(box(0.07, 0.13, 0.012, new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x3a7aff, emissiveIntensity: 0.5 }), 0, 0.05, 0));
  if (kind === 'pencil') { const p = cyl(0.008, 0.008, 0.16, cloth('#ffcc2a', 0.5), 0); p.rotation.x = 1.2; G.add(p); }
  if (kind === 'diploma') { const d = cyl(0.03, 0.03, 0.3, M.paper, 0); d.rotation.z = Math.PI / 2; G.add(d); const r = cyl(0.033, 0.033, 0.04, M.red, 0); r.rotation.z = Math.PI / 2; G.add(r); }
  if (kind === 'mic') { G.add(cyl(0.018, 0.012, 0.18, M.black, 0)); G.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), M.steel)).position.y = 0.1; }
  if (kind === 'ball') G.add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), cloth('#e86a1a', 0.7)));
  if (kind === 'trophy') { G.add(cyl(0.05, 0.08, 0.05, M.black, -0.05)); G.add(cyl(0.02, 0.02, 0.08, M.gold, 0.02)); G.add(cyl(0.09, 0.03, 0.12, M.gold, 0.12)); }
  if (kind === 'food') G.add(box(0.1, 0.03, 0.12, cloth('#e8b040', 0.7), 0, 0, 0));
  if (kind === 'can') G.add(cyl(0.03, 0.03, 0.12, cloth('#d8202a', 0.3), 0));
  G.traverse(x => { if (x.isMesh) x.castShadow = true; });
  return G;
}

// ------------------------------------------------------------------ the googly
const UP = new THREE.Vector3(0, 1, 0);
export class Googly {
  /** role: 'student' | 'teacher' | 'principal' | 'coach' | 'lunch' | 'janitor' | 'librarian' | 'nurse' | 'secretary'
   *  look: { top, style, pack, hat, hatColor, pants, num, tie, cardigan, formal, gown, crown } */
  constructor({ color = '#3a8aff', name = '', skin = 'none', local = false, role = 'student', look = {}, tagColor = null, size = 1 } = {}) {
    this.group = new THREE.Group();
    this.root = new THREE.Group(); this.root.scale.setScalar(SCALE * size); this.group.add(this.root);
    this.color = color; this.local = local; this.role = role; this.tagColor = tagColor; this.look = { ...look };
    this.pelvis = new THREE.Group(); this.pelvis.position.y = 0.5; this.root.add(this.pelvis);
    this.body = new THREE.Group(); this.pelvis.add(this.body);
    this.bodyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.38, 10, 24), std(0xffffff));
    this.bodyMesh.position.y = 0.4; this.bodyMesh.castShadow = true; this.bodyMesh.receiveShadow = true; this.body.add(this.bodyMesh);
    this.belly = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), std(0xffffff));
    this.belly.scale.set(1, 1.3, 0.4); this.belly.position.set(0, 0.25, 0.19); this.body.add(this.belly);
    this.eyes = [];
    for (const side of [-1, 1]) {
      const e = new THREE.Group();
      e.position.set(side * 0.125, 0.66, 0.27); e.rotation.set(-0.08, side * 0.28, 0);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.134, 0.134, 0.03, 28), std(0x15151a, 0.5)); rim.rotation.x = Math.PI / 2; e.add(rim);
      const white = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.036, 28), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, clearcoat: 1 })); white.rotation.x = Math.PI / 2; e.add(white);
      const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.012, 20), std(0x050505, 0.2)); pupil.rotation.x = Math.PI / 2; pupil.position.set(0, -0.03, 0.022); e.add(pupil);
      const lid = new THREE.Mesh(new THREE.SphereGeometry(0.136, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0xffffff, 0.5)); lid.rotation.x = Math.PI / 2; lid.scale.set(1, 0.5, 1); lid.position.z = 0.0; lid.visible = false; e.add(lid);
      this.body.add(e);
      this.eyes.push({ node: e, pupil, lid, p: new THREE.Vector2(0, -0.03), v: new THREE.Vector2(), last: null, lastV: new THREE.Vector3() });
    }
    this.brows = new THREE.Group(); this.body.add(this.brows);
    for (const side of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.03), std(0x15151a, 0.5)); b.position.set(side * 0.13, 0.83, 0.25); b.rotation.z = side * 0.35; this.brows.add(b); }
    this.brows.visible = role === 'principal' || !!look.brows;
    this.mouth = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 16, Math.PI), std(0x2a0c12, 0.4));
    this.mouth.position.set(0, 0.49, 0.29); this.mouth.rotation.z = Math.PI; this.body.add(this.mouth);
    this.arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 1, 4, 8), std(0xffffff)); arm.castShadow = true;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), std(0xffffff, 0.5)); hand.castShadow = true;
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.075, 1, 10, 1, true), std(0xffffff)); sleeve.visible = false; sleeve.castShadow = true; arm.add(sleeve);
      this.body.add(arm); this.body.add(hand);
      this.arms.push({ arm, hand, sleeve, side, sh: new THREE.Vector3(side * 0.29, 0.44, 0), cur: new THREE.Vector3(side * 0.36, 0.1, 0.05) });
    }
    this.hips = []; this.knees = []; this.legMeshes = []; this.shoes = [];
    for (const side of [-1, 1]) {
      const hp = new THREE.Group(); hp.position.set(side * 0.13, 0.02, 0); this.pelvis.add(hp);
      const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.17, 4, 8), std(0xffffff)); th.position.y = -0.12; hp.add(th);
      const kn = new THREE.Group(); kn.position.y = -0.23; hp.add(kn);
      const sn = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.17, 4, 8), std(0xffffff)); sn.position.y = -0.11; kn.add(sn);
      const sh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), std(0xffffff)); sh.scale.set(0.85, 0.55, 1.45); sh.position.set(0, -0.24, 0.06); kn.add(sh);
      th.castShadow = sn.castShadow = sh.castShadow = true;
      this.hips.push(hp); this.knees.push(kn); this.legMeshes.push(th, sn); this.shoes.push(sh);
    }
    this.gearG = null; this.propG = null; this.propKind = null;
    this.phase = 0; this.gait = 0; this.t = Math.random() * 10; this.hurtT = 0; this.reachT = 0; this.shoutT = 0; this.spinT = 0; this.sitK = 0; this.lieK = 0; this.talkT = 0; this.jumpT = 0; this.blinkT = 2 + Math.random() * 3;
    this.lastSide = 0; this.onStep = null;
    this.setLook(color, skin);
    this.dress(look);
    if (name) this.setName(name);
  }
  setLook(color, skin) {
    const key = color + skin;
    if (key === this.lookKey) return;
    this.lookKey = key; this.color = color; this.skin = skin;
    const mat = skinMaterial(skin, color);
    const c = new THREE.Color(color);
    const bel = skin === 'none' ? std(c.clone().lerp(new THREE.Color('#fff'), 0.2), 0.4) : mat;
    this.bodyMesh.material = mat; this.belly.material = bel;
    for (const a of this.arms) { a.arm.material = mat; a.hand.material = skin === 'none' ? bel : mat; }
    for (const e of this.eyes) e.lid.material = mat;
    this.paintLegs();
    if (this.name) this.setName(this.name);
  }
  paintLegs() {
    const L = this.look || {}, r = this.role;
    const pants = L.gown ? cloth(L.gown, 0.6) : L.formal ? M.black : r === 'principal' ? M.suit : r === 'coach' ? M.track : r === 'janitor' ? M.overall : r === 'nurse' ? M.scrubs : r === 'lunch' ? cloth('#3a3a3e') : r === 'teacher' ? cloth(L.pants || '#4a4a52') : cloth(L.pants || '#2e4a7a', 0.85);
    for (const l of this.legMeshes) l.material = pants;
    const shoe = L.formal || r === 'principal' || r === 'teacher' ? new THREE.MeshPhysicalMaterial({ color: 0x1a1210, roughness: 0.3, clearcoat: 0.9 }) : cloth(L.shoes || (r === 'student' ? '#f2f2f2' : '#2a2a2e'), 0.5);
    for (const s of this.shoes) s.material = shoe;
  }
  /** Change clothes (the player dresses up for prom and graduation). */
  dress(look) {
    this.look = { ...look };
    if (this.gearG) this.body.remove(this.gearG);
    this.pack = null; this.gradCap = null;
    const { G, sleeves } = outfit(this.role, this.look, this);
    this.gearG = G; this.body.add(G);
    this.belly.visible = false;
    const [mat, len] = sleeves[0] || [null, 0];
    for (const a of this.arms) { a.sleeve.visible = !!mat; if (mat) { a.sleeve.material = mat; a.sleeve.scale.set(1, len, 1); a.sleeve.position.y = 0.5 - len / 2; } }
    this.paintLegs();
  }
  setName(name) {
    this.name = name;
    if (this.tag) this.group.remove(this.tag);
    this.tag = null;
    if (this.local || !name || this.noTag) return;
    this.tag = textSprite(name, { size: 30, border: this.tagColor || this.color });
    this.tag.position.y = 2.1; this.tag.visible = false; this.group.add(this.tag);
  }
  hold(kind) {
    if (kind === this.propKind) return;
    if (this.propG) this.arms[1].hand.remove(this.propG);
    this.propKind = kind; this.propG = null;
    if (kind) { this.propG = makeProp(kind); this.arms[1].hand.add(this.propG); }
  }
  reach() { this.reachT = 0.4; }
  shout() { this.shoutT = 0.9; }
  talk(s = 1.2) { this.talkT = Math.max(this.talkT, s); }
  hit() { this.hurtT = 0.3; }
  spin() { this.spinT = 0.8; }
  hop() { this.jumpT = 0.5; }
  /**
   * speed: ground speed; seat: sitting on a chair; pose: 'idle' | 'raise' | 'write' | 'sleep' | 'cheer' | 'sad' | 'dance' | 'talk' | 'eat'
   *  | 'phone' | 'clap' | 'point' | 'mop' | 'wave' | 'hold' | 'lie' | 'shock' | 'think' | 'slow'
   */
  update(dt, { speed = 0, onGround = true, pose = 'idle', seat = false } = {}) {
    this.t += dt;
    const dancing = pose === 'dance';
    this.gait += (Math.min(1, speed / 3.5) - this.gait) * (1 - Math.exp(-8 * dt));
    const run = Math.min(1, Math.max(0, (speed - 4.6) / 1.6));
    this.phase += (dancing ? 2.2 : speed / (1.25 + run * 0.35)) * Math.PI * 2 * dt;
    const sit = seat || pose === 'sleep' || pose === 'write';
    const lie = pose === 'lie';
    this.sitK += ((sit ? 1 : 0) - this.sitK) * (1 - Math.exp(-7 * dt));
    this.lieK += ((lie ? 1 : 0) - this.lieK) * (1 - Math.exp(-6 * dt));
    for (const k of ['hurtT', 'reachT', 'shoutT', 'spinT', 'talkT', 'jumpT']) this[k] = Math.max(0, this[k] - dt);
    const g = (dancing ? 0.45 : this.gait) * (1 - this.sitK) * (1 - this.lieK), s = Math.sin(this.phase), c = Math.cos(this.phase);
    const sk = this.sitK;
    for (let i = 0; i < 2; i++) {
      const ph = this.phase + (i ? Math.PI : 0), swing = Math.max(0, Math.cos(ph));
      const air = onGround ? 0 : (i ? 0.5 : -0.3);
      this.hips[i].rotation.set((-(0.7 + run * 0.25) * Math.sin(ph) * g + air) * (1 - sk) - sk * 1.5, 0, (i ? 1 : -1) * (0.07 + sk * 0.06));
      this.knees[i].rotation.x = ((1.3 + run * 0.4) * Math.pow(swing, 1.3) * g + 0.08 + (onGround ? 0 : 0.6)) * (1 - sk) + sk * 1.45;
    }
    const side = s > 0 ? 0 : 1;
    if (side !== this.lastSide && g > 0.3 && onGround && !dancing) this.onStep?.(side === 0 ? 1 : 0.7);
    this.lastSide = side;
    const hop = this.jumpT > 0 ? Math.sin(this.jumpT / 0.5 * Math.PI) * 0.35 : 0;
    this.pelvis.position.y = 0.5 + (0.06 * Math.max(0, s) + 0.02 * Math.abs(c)) * g * (1 + run * 0.6) - sk * 0.36 + hop + (dancing ? Math.abs(s) * 0.06 : 0);
    const hurt = Math.sin(this.hurtT / 0.35 * Math.PI) * 0.35;
    const lean = (0.1 + run * 0.18) * g - hurt + (pose === 'sad' ? 0.25 : 0) + (pose === 'sleep' ? 0.95 : 0) + (pose === 'write' ? 0.28 : 0) + (pose === 'mop' ? 0.2 : 0) - (this.shoutT > 0 ? 0.12 : 0) + (pose === 'slow' ? 0.3 : 0);
    this.body.rotation.set(lean, 0.12 * c * g + (dancing ? Math.sin(this.t * 4.4) * 0.4 : 0) + (pose === 'mop' ? Math.sin(this.t * 2) * 0.3 : 0), 0.09 * s * g + Math.sin(this.t * 0.9) * 0.02 + (pose === 'think' ? 0.15 : 0));
    this.root.rotation.y = this.spinT > 0 ? (1 - this.spinT / 0.8) * Math.PI * 4 : 0;
    this.root.rotation.x = -this.lieK * 1.5; this.root.position.y = this.lieK * 0.3;
    const breath = 1 + Math.sin(this.t * (pose === 'sleep' ? 1.2 : 2.2)) * (pose === 'sleep' ? 0.03 : 0.012) + this.hurtT * 0.2 + (this.shoutT > 0 ? Math.abs(Math.sin(this.t * 14)) * 0.04 : 0);
    this.bodyMesh.scale.set(1 / Math.sqrt(breath), breath, 1 / Math.sqrt(breath));
    for (const a of this.arms) {
      const sd = a.side, sw = Math.sin(this.phase + (sd > 0 ? 0 : Math.PI)) * g, R = sd > 0;
      let tx = sd * (0.36 + run * 0.04), ty = 0.1 + Math.abs(sw) * 0.08 * (1 + run), tz = 0.05 + sw * (0.26 + run * 0.12);
      if (sit) { tx = sd * 0.26; ty = 0.14; tz = 0.34; }
      if (this.pack && !sit && pose === 'idle' && g < 0.3) { tx = sd * 0.25; ty = 0.5; tz = 0.12; }            // thumbs under the straps
      switch (pose) {
        case 'raise': if (R) { tx = 0.34; ty = 1.12 + Math.sin(this.t * 7) * 0.03; tz = 0.1; } break;
        case 'write': if (R) { tx = 0.12 + Math.sin(this.t * 9) * 0.03; ty = 0.1 + Math.cos(this.t * 13) * 0.015; tz = 0.44; } else { tx = -0.2; ty = 0.1; tz = 0.4; } break;
        case 'sleep': tx = sd * 0.16; ty = 0.64; tz = 0.4; break;
        case 'cheer': tx = sd * 0.42; ty = 0.95 + Math.sin(this.t * 9 + sd) * 0.08; tz = 0.08; break;
        case 'sad': tx = sd * 0.24; ty = -0.05; tz = 0.12; break;
        case 'dance': { const k = Math.sin(this.t * 4.4 + (R ? 0 : Math.PI)); tx = sd * (0.36 + 0.1 * k); ty = 0.4 + 0.5 * Math.max(0, k); tz = 0.2; break; }
        case 'talk': tx = sd * (0.36 + Math.sin(this.t * 3 + sd) * 0.08); ty = 0.32 + Math.sin(this.t * 4.2 + sd * 2) * 0.08; tz = 0.34; break;
        case 'eat': if (R) { const k = Math.max(0, Math.sin(this.t * 2.5)); tx = 0.2 - k * 0.12; ty = 0.18 + k * 0.32; tz = 0.4; } break;
        case 'phone': if (!R) { tx = -0.14; ty = 0.34; tz = 0.4; } if (R) { tx = 0.1; ty = 0.3; tz = 0.42; } break;
        case 'clap': { const k = Math.abs(Math.sin(this.t * 9)); tx = sd * (0.04 + k * 0.16); ty = 0.4; tz = 0.4; break; }
        case 'point': if (R) { tx = 0.2; ty = 0.5; tz = 0.75; } break;
        case 'mop': tx = sd * 0.1 + 0.05; ty = sd > 0 ? 0.3 : 0.12; tz = 0.4; break;
        case 'wave': if (R) { tx = 0.42 + Math.sin(this.t * 10) * 0.08; ty = 0.98; tz = 0.12; } break;
        case 'hold': if (R) { tx = 0.2; ty = 0.22; tz = 0.4; } break;
        case 'shock': tx = sd * 0.42; ty = 0.7; tz = 0.25; break;
        case 'think': if (R) { tx = 0.1; ty = 0.46; tz = 0.4; } break;
      }
      if (lie) { tx = sd * 0.45; ty = 0.5; tz = -0.1; }
      if (this.shoutT > 0 && pose !== 'raise') { tx = sd * 0.4; ty = 0.5; tz = 0.35; }
      if (this.reachT > 0) { const k = Math.sin(this.reachT / 0.4 * Math.PI); tx = sd * 0.16; ty = 0.38 + k * 0.05; tz = 0.3 + k * 0.42; }
      a.cur.lerp(V.set(tx, ty, tz), 1 - Math.exp(-(this.reachT > 0 ? 30 : 14) * dt));
      const d = V2.copy(a.cur).sub(a.sh), L = d.length();
      a.arm.position.copy(a.sh).addScaledVector(d, 0.5);
      a.arm.quaternion.setFromUnitVectors(UP, d.normalize());
      a.arm.scale.set(1, Math.max(0.05, (L - 0.1) / 1.1), 1);
      a.hand.position.copy(a.cur);
    }
    if (pose === 'phone') this.hold('phone'); else if (this.propKind === 'phone') this.hold(this.baseProp || null);
    if (this.propG) this.propG.rotation.x = pose === 'phone' ? -0.4 : 0;
    const shocked = this.hurtT > 0 || this.spinT > 0 || lie || pose === 'shock' || pose === 'sad';
    const talking = this.talkT > 0 || pose === 'talk';
    this.mouth.rotation.z = shocked ? 0 : Math.PI;
    this.mouth.position.y = shocked ? 0.45 : 0.49;
    const open = this.shoutT > 0 ? 1.6 : talking ? 1 + Math.abs(Math.sin(this.t * 17)) * 0.5 : pose === 'cheer' || dancing ? 1.35 : 1;
    this.mouth.scale.set(open, talking ? open * 1.3 : open, 1);
    // blinking, and sleepy half-shut eyes
    this.blinkT -= dt; if (this.blinkT < -0.12) this.blinkT = 2 + Math.random() * 4;
    const lidOn = pose === 'sleep' || this.blinkT < 0 || pose === 'slow';
    for (const e of this.eyes) { e.lid.visible = lidOn; e.lid.scale.y = pose === 'slow' ? 0.35 : 0.5; }
    if (this.gradCap) this.gradCap.rotation.y = Math.sin(this.t * 0.7) * 0.05;
    // googly eyes: pupils rattle around under gravity and head motion
    this.root.updateMatrixWorld(true);
    for (const e of this.eyes) {
      e.node.getWorldPosition(E); e.node.getWorldQuaternion(Qt);
      UX.set(1, 0, 0).applyQuaternion(Qt); UY.set(0, 1, 0).applyQuaternion(Qt);
      if (!e.last) { e.last = E.clone(); e.lastV.set(0, 0, 0); }
      const ve = V.copy(E).sub(e.last).divideScalar(Math.max(dt, 1e-3));
      const ae = V2.copy(ve).sub(e.lastV).divideScalar(Math.max(dt, 1e-3)); if (ae.length() > 250) ae.setLength(250);
      e.last.copy(E); e.lastV.copy(ve);
      const a3 = V3.set(0, -22, 0).sub(ae), ax = a3.dot(UX), ay = a3.dot(UY);
      for (let k = 0; k < 3; k++) {
        const h = dt / 3;
        e.v.x += ax * h; e.v.y += ay * h; e.v.multiplyScalar(1 - 1.6 * h);
        e.p.x += e.v.x * h; e.p.y += e.v.y * h;
        const maxD = 0.061, dd = e.p.length();
        if (dd > maxD) { const nx = e.p.x / dd, ny = e.p.y / dd; e.p.set(nx * maxD, ny * maxD); const vn = e.v.x * nx + e.v.y * ny; if (vn > 0) { e.v.x -= nx * vn * 1.55; e.v.y -= ny * vn * 1.55; } }
      }
      e.pupil.position.set(e.p.x, e.p.y, 0.022);
    }
  }
  /** Seated googlies sit this far above the floor under them (the chair seat height minus the jelly's bottom). */
  static seatOffset(seatH = 0.46) { return seatH - 0.07; }
}
const V = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), E = new THREE.Vector3(), UX = new THREE.Vector3(), UY = new THREE.Vector3(), Qt = new THREE.Quaternion();
