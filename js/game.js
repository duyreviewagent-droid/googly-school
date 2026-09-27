// Googly School's rules: three years of six school days, each day a bell schedule of 200 seconds, so the whole of
// high school takes an hour. Grades, popularity, conduct, energy and money; detentions → suspensions → expulsion;
// every decision is logged so the yearbook can show your best and your worst.
import { SUBJECTS, SUBJECT_NAME } from './school.js';

export const YEARS = 3, DAYS = 6;
// one school day (seconds of real time) — adds up to 200 s
export const PHASES = [
  { id: 'arrive', kind: 'free', dur: 22, t0: 7 * 60 + 40, t1: 8 * 60, label: 'Before school', next: 0 },
  { id: 'class0', kind: 'class', slot: 0, dur: 30, t0: 8 * 60, t1: 9 * 60 + 30, label: 'Period 1' },
  { id: 'pass0', kind: 'free', dur: 16, t0: 9 * 60 + 30, t1: 9 * 60 + 40, label: 'Passing period', next: 1 },
  { id: 'class1', kind: 'class', slot: 1, dur: 30, t0: 9 * 60 + 40, t1: 11 * 60 + 10, label: 'Period 2' },
  { id: 'lunch', kind: 'lunch', dur: 32, t0: 11 * 60 + 10, t1: 12 * 60, label: 'Lunch' },
  { id: 'pass1', kind: 'free', dur: 15, t0: 12 * 60, t1: 12 * 60 + 10, label: 'Passing period', next: 2 },
  { id: 'class2', kind: 'class', slot: 2, dur: 30, t0: 12 * 60 + 10, t1: 13 * 60 + 40, label: 'Period 3' },
  { id: 'after', kind: 'after', dur: 25, t0: 13 * 60 + 40, t1: 15 * 60, label: 'After school' },
];
export const DAY_LEN = PHASES.reduce((a, p) => a + p.dur, 0);
export const SCHED = { A: ['math', 'english', 'science'], B: ['history', 'art', 'pe'] };
export const YEAR_NAME = ['', 'Year 1 · Sophomore', 'Year 2 · Junior', 'Year 3 · Senior'];
// what's special about each day: tests (by class period), the after-school event, things that happen in the morning
export const SPECIALS = {
  '1-1': { intro: true },
  '1-3': { tests: [0, 2] }, '1-4': { tests: [0] }, '1-5': { tests: [1], after: 'dance' },
  '2-2': { after: 'election' }, '2-3': { tests: [0, 2], news: 'election' }, '2-4': { tests: [0], after: 'talent' }, '2-5': { tests: [1] }, '2-6': { after: 'game' },
  '3-1': { morning: 'college' }, '3-3': { tests: [0, 2] }, '3-4': { tests: [0], morning: 'senior_prank' }, '3-5': { tests: [1], after: 'prom' }, '3-6': { after: 'grad' },
};
export const EVENT_NAME = { dance: 'the Homecoming Dance', election: 'the class president speeches', talent: 'the Talent Show', game: 'the Championship Game', prom: 'PROM', grad: 'GRADUATION' };
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
export const letter = s => s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F';
const POINTS = { A: 4, B: 3, C: 2, D: 1, F: 0 };
export const fmtClock = m => { const h = Math.floor(m / 60), mm = Math.floor(m % 60); return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
export const fmtLeft = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

export class Game {
  constructor(o = {}) {
    this.gender = o.gender || 'girl'; this.name = o.name || 'You'; this.color = o.color || '#ff6ab4'; this.look = o.look || {};
    this.year = 1; this.day = 1; this.pi = 0; this.pt = 0;
    this.grades = Object.fromEntries(SUBJECTS.map(s => [s, 78]));
    this.pop = 30; this.conduct = 80; this.energy = 85; this.money = 20;
    this.rel = { friend: 55, crush: 30, bully: 40 };
    this.det = 0; this.detTotal = 0; this.suspensions = 0; this.tardies = 0; this.skips = 0; this.caught = 0;
    this.flags = {}; this.used = []; this.usedQ = []; this.log = []; this.yearLog = []; this.history = [];
    this.attended = {};
  }
  get phase() { return PHASES[this.pi]; }
  get dayType() { return this.day % 2 === 1 ? 'A' : 'B'; }
  get special() { return SPECIALS[`${this.year}-${this.day}`] || {}; }
  subjectFor(slot, day = this.dayType) { return SCHED[day][slot]; }
  isTest(slot) { return (this.special.tests || []).includes(slot) && !['art', 'pe'].includes(this.subjectFor(slot)); }
  clockMinutes() { const p = this.phase; return p.t0 + (p.t1 - p.t0) * Math.min(1, this.pt / p.dur); }
  dayK() { return (this.clockMinutes() - 7 * 60 - 40) / (7 * 60 + 20); }
  /** Seconds of high school left. */
  timeLeft() { let s = 0; for (let i = this.pi; i < PHASES.length; i++) s += PHASES[i].dur; s -= this.pt; return s + ((YEARS - this.year) * DAYS + (DAYS - this.day)) * DAY_LEN; }
  gpa() { const v = SUBJECTS.map(s => POINTS[letter(this.grades[s])]); return v.reduce((a, b) => a + b, 0) / v.length; }
  gpaExact() { const v = SUBJECTS.map(s => Math.max(0, Math.min(4.3, (this.grades[s] - 50) / 10))); return Math.min(4, v.reduce((a, b) => a + b, 0) / v.length); }
  popLabel() { const p = this.pop; return p >= 85 ? 'School Legend' : p >= 65 ? 'Popular' : p >= 45 ? 'Well liked' : p >= 25 ? 'Known' : 'Invisible'; }
  /** Apply an effects object. S means "the subject of the class you're in". Returns the changes for the UI. */
  apply(e = {}, subject = null) {
    const out = [];
    const add = (label, key, v, get, set) => { if (!v) return; const before = get(); set(before + v); const d = Math.round(get() - before); if (d) out.push({ label, d, key }); };
    for (const [k, v] of Object.entries(e)) {
      if (k === 'S' && subject) add(SUBJECT_NAME[subject], subject, v, () => this.grades[subject], x => this.grades[subject] = clamp(x));
      else if (SUBJECTS.includes(k)) add(SUBJECT_NAME[k], k, v, () => this.grades[k], x => this.grades[k] = clamp(x));
      else if (k === 'grades') { for (const s of SUBJECTS) this.grades[s] = clamp(this.grades[s] + v); out.push({ label: 'All grades', d: v, key: 'grades' }); }
      else if (k === 'pop') add('Popularity', 'pop', v, () => this.pop, x => this.pop = clamp(x));
      else if (k === 'conduct') add('Conduct', 'conduct', v, () => this.conduct, x => this.conduct = clamp(x));
      else if (k === 'energy') add('Energy', 'energy', v, () => this.energy, x => this.energy = clamp(x));
      else if (k === 'money') add('Money', 'money', v, () => this.money, x => this.money = Math.max(0, Math.round(x)));
      else if (k in this.rel) add({ friend: 'Jojo', crush: 'Sky', bully: 'Brock (rivalry)' }[k], k, v, () => this.rel[k], x => this.rel[k] = clamp(x));
    }
    return out;
  }
  addDetention(n = 1) { if (!n) return; this.det += n; this.detTotal += n; this.caught++; }
  /** Record a decision for the yearbook. */
  record(text, g, where) { const e = { text, g, where, y: this.year, d: this.day }; this.log.push(e); if (this.log.length > 400) this.log.shift(); }
  tally() { let best = 0, worst = 0, good = 0, bad = 0; for (const e of this.log) { if (e.g >= 2) best++; else if (e.g === 1) good++; else if (e.g === -1) bad++; else if (e.g <= -2) worst++; } return { best, worst, good, bad }; }
  /** Move the clock on. Returns 'phase' when a new phase begins, 'day' at the end of the day. */
  tick(dt) {
    this.pt += dt;
    const p = this.phase;
    if (this.pt >= p.dur) { this.pt = 0; this.pi++; if (this.pi >= PHASES.length) { this.pi = PHASES.length - 1; this.pt = p.dur; return 'day'; } return 'phase'; }
    return null;
  }
  nextDay() {
    this.day++; this.pi = 0; this.pt = 0; this.attended = {};
    if (this.day > DAYS) { this.day = 1; this.year++; return 'year'; }
    return 'day';
  }
  save() { const o = {}; for (const k of Object.keys(this)) o[k] = this[k]; o.v = 1; return JSON.stringify(o); }
  static load(s) { const o = JSON.parse(s); const g = new Game(); Object.assign(g, o); return g; }

  // ------------------------------------------------------------------ the yearbook
  ending(expelled = false) {
    const gpa = this.gpaExact(), t = this.tally(), F = this.flags;
    const awards = [];
    if (gpa >= 3.8) awards.push(['🎓', 'Valedictorian', 'Top of the class']);
    else if (gpa >= 3.3) awards.push(['📜', 'Honor Roll', `${gpa.toFixed(2)} GPA`]);
    if (F.royalty === 2) awards.push(['👑', this.gender === 'boy' ? 'Prom King' : 'Prom Queen', 'Crowned at prom']);
    if (F.president) awards.push(['🗳', 'Class President', 'Won the election']);
    if (F.champ) awards.push(['🏆', 'Champion', 'Won the big game']);
    if (F.talentWin) awards.push(['⭐', 'Talent Show Winner', 'Brought the house down']);
    if (this.pop >= 85) awards.push(['🔥', 'Most Popular', 'Everybody knows you']);
    if (this.rel.friend >= 85) awards.push(['🤝', 'Best Friends Forever', 'You and Jojo']);
    if (this.rel.crush >= 80) awards.push(['💘', 'Cutest Couple', 'You and Sky']);
    if (this.skips === 0 && this.tardies === 0) awards.push(['⏰', 'Perfect Attendance', 'Never late, never skipped']);
    if ((F.prank || 0) + (F.foodfight || 0) >= 3) awards.push(['🤡', 'Class Clown', 'Pranks galore']);
    if (this.detTotal >= 6) awards.push(['🚨', 'Troublemaker', `${this.detTotal} detentions`]);
    if (F.bullyFriend) awards.push(['🕊', 'Peacemaker', 'Made friends with Brock']);
    if (t.best >= 30 && t.worst <= 5) awards.push(['😇', 'Angel', 'Almost always the best choice']);
    if (t.worst >= 25) awards.push(['😈', 'Chaos Agent', 'The worst decisions, on purpose']);
    const graduated = !expelled && gpa >= 1.2;
    let title, sub, sad = false;
    if (expelled) { title = 'EXPELLED'; sub = 'Principal Googlesworth has seen enough. You never walk the stage.'; sad = true; }
    else if (!graduated) { title = "DIDN'T GRADUATE"; sub = 'Your GPA was too low to get a diploma. Summer school it is.'; sad = true; }
    else if (gpa >= 3.5 && this.pop >= 75 && t.best > t.worst * 2) { title = 'LEGEND OF GOOGLY HIGH'; sub = 'Top grades, tons of friends, and good choices. They\'ll talk about you for years.'; }
    else if (gpa >= 3.8) { title = 'VALEDICTORIAN'; sub = 'You give the speech at graduation. Your googly eyes glisten.'; }
    else if (F.royalty === 2) { title = this.gender === 'boy' ? 'PROM KING' : 'PROM QUEEN'; sub = 'You graduate with a crown and a whole school cheering.'; }
    else if (F.president) { title = 'CLASS PRESIDENT'; sub = 'You led your class all the way to graduation.'; }
    else if (F.champ) { title = 'STAR ATHLETE'; sub = 'Champion. Scouts were in the stands.'; }
    else if (gpa >= 3.3) { title = 'HONOR GRADUATE'; sub = 'Honor roll, cords and everything.'; }
    else if ((F.prank || 0) + (F.foodfight || 0) >= 3) { title = 'CLASS CLOWN'; sub = 'You graduated. Somehow. Everyone will remember the pranks.'; }
    else if (gpa < 2) { title = 'BARELY GRADUATED'; sub = 'You made it across the stage by the skin of your googly eyes.'; }
    else { title = 'GRADUATE'; sub = 'You did it. Three years, done.'; }
    // college
    let college = 'No college plans';
    const a = F.apply;
    if (graduated) {
      if (a === 'top') college = gpa >= 3.6 && F.essays ? 'Accepted to GOOGLY UNIVERSITY! 🎉' : gpa >= 3.6 ? 'Waitlisted at Googly University (your essays were late)' : 'Rejected by Googly University. State college instead.';
      else if (a === 'state') college = gpa >= 2.2 ? 'Accepted to Googly State College' : 'Community college first, then State';
      else if (a === 'art') college = this.grades.art >= 85 ? 'Accepted to the Googly Art Institute! 🎨' : 'Art school said "keep practicing." Community college for now.';
      else college = gpa >= 3 ? 'Taking a gap year' : 'Working at the Googly Burger';
    }
    const top = Object.entries({ study: gpa * 25, social: this.pop, chaos: this.detTotal * 12 + (F.prank || 0) * 12, kind: t.best * 2, sport: (F.team ? 40 : 0) + this.grades.pe / 2, art: (F.artshow ? 30 : 0) + this.grades.art / 2 }).sort((x, y) => y[1] - x[1])[0][0];
    const superl = { study: 'Most likely to cure a disease', social: 'Most likely to be famous', chaos: 'Most likely to end up on the news', kind: 'Most likely to save the world', sport: 'Most likely to go pro', art: 'Most likely to have a painting in a museum' }[top];
    const future = expelled ? 'Now runs a very successful "How NOT to act in school" channel.' : !graduated ? 'Got their diploma the next summer. Better late than never!' : {
      study: 'Became a scientist and named a googly-eyed frog after Dr. Beaker.', social: 'Became an influencer with 10 million followers.', chaos: 'Became a stunt performer. Still pulls fire alarms (on movie sets).',
      kind: 'Became a teacher at Googly High. Nicest teacher ever.', sport: 'Plays professional basketball for the Googly Giants.', art: 'Became a famous artist. The clay on the art room ceiling is worth millions now.',
    }[top];
    const best = this.log.filter(e => e.g >= 2).slice(-40).sort(() => Math.random() - 0.5).slice(0, 3);
    const worst = this.log.filter(e => e.g <= -2).slice(-40).sort(() => Math.random() - 0.5).slice(0, 3);
    const avg = this.log.length ? this.log.reduce((s, e) => s + e.g, 0) / this.log.length : 0;
    const dgrade = avg >= 1.4 ? 'A+' : avg >= 1 ? 'A' : avg >= 0.6 ? 'B' : avg >= 0.2 ? 'C' : avg >= -0.3 ? 'D' : 'F';
    return { title, sub, sad, awards, college, superl, future, best, worst, gpa, dgrade, graduated, tally: t };
  }
}
