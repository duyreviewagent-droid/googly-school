// Autoplay: open the game with auto=1 (walks to every objective and picks random choices) and report state every few seconds.
// node test/auto.mjs "query" seconds
import { spawn } from 'node:child_process';
const [query = 'new=1&auto=1&speed=4&lq=1', secs = '120'] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500), url = `http://localhost:${process.env.PORT || 8141}/?shim=1&${query}`;
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ch = spawn(CH, ['--headless=new', '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/claude-501/auto-${port}`, '--window-size=800,500', url], { stdio: 'ignore' });
const done = c => { try { ch.kill('SIGKILL'); } catch { } process.exit(c); };
let list = null;
for (let i = 0; i < 100 && !list; i++) { await new Promise(r => setTimeout(r, 200)); try { const l = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); list = l.find(t => t.type === 'page'); } catch { } }
const ws = new WebSocket(list.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', ev => { const d = JSON.parse(ev.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') console.log('PAGE ERROR', JSON.stringify(d.params.exceptionDetails).slice(0, 900)); if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) console.log('console.' + d.params.type, d.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 400)); });
const call = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await call('Runtime.enable');
const t0 = Date.now();
while (Date.now() - t0 < +secs * 1000) {
  await new Promise(r => setTimeout(r, 6000));
  const r = await call('Runtime.evaluate', { expression: `(() => { const s = window.__gs, G = s?.G; if (!G) return 'no game'; const t = G.tally(); return JSON.stringify({ y: G.year, d: G.day, ph: G.phase.id, pt: +G.pt.toFixed(1), x: +s.P.x.toFixed(1), z: +s.P.z.toFixed(1), seat: !!s.P.seat, gpa: +G.gpaExact().toFixed(2), pop: G.pop, cond: G.conduct, en: Math.round(G.energy), $: G.money, det: G.det, best: t.best, worst: t.worst, log: G.log.length, card: document.getElementById('card').classList.contains('hidden') ? '' : document.getElementById('card-text').textContent.slice(0, 50), over: !document.getElementById('scr-over').classList.contains('hidden'), end: !document.getElementById('scr-end').classList.contains('hidden') }); })()`, returnByValue: true });
  console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', r.result?.result?.value ?? JSON.stringify(r.result).slice(0, 300));
}
done(0);
