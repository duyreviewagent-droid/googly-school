// ?icon=1 — draws the app icon: a pink googly girl with a bow and a backpack walking to school on a sunny morning,
// the brick school and its big front doors behind her. Screenshot the 1024x1024 canvas for mac/icon-1024.png.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Googly } from './googly.js';

export function renderIcon() {
  document.body.innerHTML = '';
  document.body.style.background = '#000';
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024; cv.style.cssText = 'position:fixed;left:0;top:0;width:1024px;height:1024px';
  document.body.appendChild(cv);
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(1024, 1024, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.6;
  // a bright morning sky with a couple of clouds
  const bg = document.createElement('canvas'); bg.width = bg.height = 512; const g = bg.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#3a8ae8'); gr.addColorStop(0.7, '#9ad0ff'); gr.addColorStop(1, '#dff0ff'); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  g.fillStyle = '#ffffffdd'; for (const [x, y, s] of [[90, 90, 1], [400, 60, 0.8], [300, 150, 0.6]]) for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + i * 22 * s, y + Math.sin(i * 2) * 8 * s, (26 - Math.abs(i - 2) * 5) * s, 0, 7); g.fill(); }
  const sunG = g.createRadialGradient(440, 110, 0, 440, 110, 120); sunG.addColorStop(0, '#fff8d0'); sunG.addColorStop(0.25, '#fff2a0aa'); sunG.addColorStop(1, '#fff2a000'); g.fillStyle = sunG; g.fillRect(0, 0, 512, 512);
  const bt = new THREE.CanvasTexture(bg); bt.colorSpace = THREE.SRGBColorSpace; scene.background = bt;
  const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 100); cam.position.set(0.5, 1.75, 7.2); cam.lookAt(0, 1.85, 0);
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x5a7a3a, 1.1));
  const key = new THREE.DirectionalLight(0xfff2dc, 2.6); key.position.set(4, 7, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key);
  const rim = new THREE.PointLight(0xffb0e0, 18, 10); rim.position.set(-2.4, 2.6, -0.4); scene.add(rim);
  // the school: red brick, white trim, big glass doors, a gold sign
  const bc = document.createElement('canvas'); bc.width = bc.height = 256; const b = bc.getContext('2d'); b.fillStyle = '#8a7a70'; b.fillRect(0, 0, 256, 256);
  for (let y = 0, row = 0; y < 256; y += 16, row++) for (let x = (row % 2) * -16; x < 256; x += 32) { const t = 110 + Math.random() * 40; b.fillStyle = `rgb(${t + 60},${t * 0.5},${t * 0.4})`; b.fillRect(x + 1, y + 1, 30, 14); }
  const btx = new THREE.CanvasTexture(bc); btx.colorSpace = THREE.SRGBColorSpace; btx.wrapS = btx.wrapT = THREE.RepeatWrapping; btx.repeat.set(4, 2.5);
  const brick = new THREE.MeshStandardMaterial({ map: btx, roughness: 0.9 });
  const wall = new THREE.Mesh(new THREE.BoxGeometry(12, 5.2, 0.4), brick); wall.position.set(0, 2.6, -3); wall.receiveShadow = true; scene.add(wall);
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.5 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.9, 0.1), white); frame.position.set(0, 1.45, -2.75); scene.add(frame);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.7), new THREE.MeshStandardMaterial({ color: 0x9ac8e8, emissive: 0x5a8ab8, emissiveIntensity: 0.4, roughness: 0.05, metalness: 0.4 })); glass.position.set(0, 1.4, -2.69); scene.add(glass);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.7, 0.06), white); bar.position.set(0, 1.4, -2.66); scene.add(bar);
  for (const x of [-3.8, 3.8]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshStandardMaterial({ color: 0xbfe0ff, emissive: 0x6a9ac8, emissiveIntensity: 0.35, roughness: 0.05 })); w.position.set(x, 2.3, -2.79); scene.add(w); const fr = new THREE.Mesh(new THREE.BoxGeometry(2, 1.7, 0.06), white); fr.position.set(x, 2.3, -2.82); scene.add(fr); }
  const sc = document.createElement('canvas'); sc.width = 1024; sc.height = 180; const s = sc.getContext('2d'); s.fillStyle = '#1f4fa8'; s.fillRect(0, 0, 1024, 180); s.font = '900 120px Futura, "Arial Black", sans-serif'; s.textAlign = 'center'; s.textBaseline = 'middle'; s.fillStyle = '#ffd23a'; s.fillText('SCHOOL', 512, 96);
  const st = new THREE.CanvasTexture(sc); st.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.74), new THREE.MeshStandardMaterial({ map: st, roughness: 0.4 })); sign.position.set(0, 3.6, -2.75); scene.add(sign);
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 6, 10), new THREE.MeshStandardMaterial({ color: 0xdde4ec, metalness: 1, roughness: 0.2 })); flagPole.position.set(3.1, 3, -1.6); scene.add(flagPole);
  // grass, and a path to the doors
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x5a9a3a, roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.receiveShadow = true; scene.add(grass);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 14), new THREE.MeshStandardMaterial({ color: 0xc8c2b8, roughness: 0.9 })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.01, 3.5); path.receiveShadow = true; scene.add(path);
  for (const x of [-2.4, 2.4, -4.4, 4.4]) { const bu = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), new THREE.MeshStandardMaterial({ color: 0x3a7a2a, roughness: 0.9 })); bu.position.set(x, 0.4, -2.3); bu.scale.y = 0.75; bu.castShadow = true; scene.add(bu); }
  // her: a pink googly with a big bow, a sweater, a backpack and a book, walking to school
  const girl = new Googly({ color: '#ff6ab4', local: true, role: 'student', look: { top: '#fff4fa', style: 'sweater', hat: 'bow', hatColor: '#ff2a8a', pants: '#6a3ab8', pack: '#ffd23a', shoes: '#ffffff' } });
  girl.hold('book');
  girl.group.position.set(-0.1, 0, 1.3); girl.group.rotation.y = 0.55; girl.group.scale.setScalar(1.55);
  scene.add(girl.group);
  for (let i = 0; i < 70; i++) girl.update(1 / 60, { speed: 2.4, pose: 'idle' });
  girl.phase = 1.1; girl.update(0.001, { speed: 2.4, pose: 'idle' });
  // a bigger bow so it reads at small sizes
  girl.gearG.traverse(o => { if (o.isMesh && (o.geometry.type === 'ConeGeometry' || (o.geometry.type === 'SphereGeometry' && o.position.y > 0.8))) o.scale.multiplyScalar(1.35); });
  r.render(scene, cam);
  document.title = 'ICON READY';
}
