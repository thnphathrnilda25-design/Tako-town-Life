'use strict';
// Real NPC movement (A* around buildings) and real NPC lives: they age, change jobs, marry, have children, retire and pass away.
function findPath(sx, sy, tx, ty) {          // pixel coords -> pixel waypoints, or null when blocked
  const W = town.W, H = town.H, s = Math.floor(sy / T) * W + Math.floor(sx / T), t = Math.floor(ty / T) * W + Math.floor(tx / T);
  if (s === t) return [];
  const g = new Float32Array(W * H).fill(1e9), from = new Int32Array(W * H).fill(-1), closed = new Uint8Array(W * H), open = [s];
  g[s] = 0; const hf = i => Math.abs(i % W - t % W) + Math.abs(Math.floor(i / W) - Math.floor(t / W));
  while (open.length) {                                    // shortcut: linear-scan open list, fine for a 40x30 grid
    let bi = 0; for (let k = 1; k < open.length; k++) if (g[open[k]] + hf(open[k]) < g[open[bi]] + hf(open[bi])) bi = k;
    const c = open.splice(bi, 1)[0]; if (c === t) break; if (closed[c]) continue; closed[c] = 1;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = c % W + dx, y = Math.floor(c / W) + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const n = y * W + x, cost = g[c] + (town.tile[n] === 1 ? 4 : 1); if (town.solid[n] && n !== t) continue;
      if (cost < g[n]) { g[n] = cost; from[n] = c; open.push(n); }
    }
  }
  if (from[t] < 0) return null;
  const path = []; for (let n = t; n !== s; n = from[n]) path.push({ x: n % W * T + 16, y: Math.floor(n / W) * T + 24 }); return path.reverse();
}
// ---- personal lives: each townsperson has slightly different hours and a favourite hangout ----
const ACT_IDX = {}; BUILDINGS.forEach((b, i) => { if (b.act) ACT_IDX[b.act] = i; });
const doorAt = i => { const b = BUILDINGS[i] || BUILDINGS[0]; return { x: b.ix, y: b.iy + 2 }; };
const FAVS = { student: ['park', 'library', 'plaza', 'pond', 'cafe'], adult: ['park', 'plaza', 'cafe', 'mart', 'pond', 'flower', 'salon', 'library'] };
function schedOf(o) {
  const role = o.role || 'worker';
  if (o._sched && o._schedRole === role) return o._sched;
  const base = SCHED[role] || SCHED.worker, k = o.k ?? 0;
  const sh = ((k * 7) % 5 - 2) * 0.12;                       // +/- ~15 minutes, so the town never moves in lockstep
  const pool = role === 'student' ? FAVS.student : FAVS.adult;
  let stop = 0;
  const s = base.map(([t, w]) => {
    let place = w;
    if (t >= 10 && (w === 'park' || w === 'plaza')) place = pool[(k + stop++) % pool.length];   // two different favourite haunts
    return [Math.max(0, +(t + sh).toFixed(2)), place];
  });
  o._schedRole = role; o._sched = s; return s;
}
function placeBuilding(p, place) {
  if (place === 'in' || place === 'home') return p.home;
  return ACT_IDX[place] === undefined ? -1 : ACT_IDX[place];
}
function goesInside(p, place) {                              // most workers enter; a third stay outside on a break
  if (place === 'in' || place === 'home') return true;
  if (placeBuilding(p, place) < 0) return false;
  if (place === 'school') return p.k % 4 !== 0;               // a few students stay out in the schoolyard
  return p.k % 2 === 0;                                       // half the workers are inside, half on a break outside
}
function updateProp(p) {
  if (wet()) p.prop = 'umbrella';
  else if (p.slot === 'cafe') p.prop = 'cup';
  else if (p.slot === 'mart') p.prop = 'bag';
  else if (p.slot === 'office') p.prop = 'folder';
  else if (p.slot === 'park' && p.k % 3 === 0) p.prop = 'book';
  else if (p.slot === 'plaza' && p.k % 4 === 0) p.prop = 'phone';
  else p.prop = null;
}
function idlePerson(p, dt) {
  if (p.chatWith) {
    const o = people.find(q => q.id === p.chatWith);
    if (o && !o.hidden && !o.talking && Math.hypot(o.x - p.x, o.y - p.y) < 80) { p.dir = faceTo(p, o); animate(p, false, dt); return; }
    p.chatWith = null;
  }
  p.chatT = (p.chatT ?? 2) - dt;
  if (p.chatT <= 0) {                                        // sometimes strike up a chat with a neighbour
    p.chatT = 6 + (p.k % 7);
    const o = people.find(q => q !== p && !q.hidden && !q.talking && !q.chatWith && q.slot === p.slot
      && Math.abs(q.x - p.x) < 72 && Math.abs(q.y - p.y) < 60);
    if (o && (p.k * 3 + o.k + day()) % 3 === 0) { p.chatWith = o.id; o.chatWith = p.id; o.chatT = 7; p.chatT = 7; }
  }
  updateProp(p); animate(p, false, dt);
  if (player && scene === town && Math.hypot(player.x - p.x, player.y - p.y) < 50) p.dir = faceTo(p, player);
}
updatePerson = (p, dt) => {
  if (p.visiting) return;                                  // stays in the room while you are visiting their home
  if (p.talking) { animate(p, false, dt); if (player) p.dir = faceTo(p, player); return; }   // stand still while someone is talking to you
  const s = slotOf(p);
  if (s !== p.slot) {
    p.slot = s; p.path = null; p.pathFor = s; p.doorT = 0; p.stuck = 0; p.chatWith = null;
    if (p.hidden) { const d = doorAt(p.insideB ?? p.home); p.x = d.x; p.y = d.y; p.hidden = false; p.alpha = 0; }   // step out of the door, then walk
  }
  if (p.hidden) return;
  p.alpha = Math.min(1, (p.alpha ?? 1) + dt * 3);
  const inside = goesInside(p, s), b = placeBuilding(p, s);
  const t = inside ? doorAt(b) : targetOf(p, s), left = Math.hypot(t.x - p.x, t.y - p.y);
  if (left < 3) {
    if (inside) {                                             // real entry: reach the door, fade through it, stay inside
      p.doorT = (p.doorT || 0) + dt; animate(p, false, dt); p.alpha = Math.max(0, 1 - p.doorT / .45);
      if (p.doorT > .45) { p.hidden = true; p.alpha = 0; p.insideB = b; p.doorT = 0; p.prop = null; p.chatWith = null; }
      return;
    }
    idlePerson(p, dt);
    return;
  }
  p.alpha = 1;
  if (!p.path || p.pathFor !== s) { p.path = findPath(p.x, p.y, t.x, t.y); p.pathFor = s; }
  if (!p.path) { p.stuck = (p.stuck || 0) + dt; if (p.stuck > 4) { p.x = t.x; p.y = t.y; p.stuck = 0; } animate(p, false, dt); return; }
  const w = p.path[0] || t, dx = w.x - p.x, dy = w.y - p.y, d = Math.hypot(dx, dy);
  if (d < 2) { p.path.shift(); return; }
  const sp = Math.min(d, (p.flee || p.rush ? 70 : 45) * dt), ox = p.x, oy = p.y;   // rush: running for cover in the rain
  move(town, p, dx / d * sp, 0); move(town, p, 0, dy / d * sp);
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
  const moved = Math.hypot(p.x - ox, p.y - oy) > .01; animate(p, moved, dt);
  if (!moved && (p.stuck += dt) > 1.5) { p.path = null; if (p.stuck > 3) { p.x = t.x; p.y = t.y; } } else if (moved) p.stuck = 0;
};
// small held objects and chat bubbles make the crowd read at a glance
function drawPersonProp(e) {
  const x = Math.round(e.x), y = Math.round(e.y), k = e.k || 0;
  if (e.prop === 'umbrella') {
    R('#2a1a2e', x + 10, y - 32, 2, 16);
    for (let dy = 0; dy < 4; dy++) {
      const w = 16 - dy * 4;
      for (let dx = 0; dx < w; dx += 4) R((dx / 4 + dy) % 2 ? '#fff4e8' : '#e85a5a', x + 2 + dx, y - 36 + dy, 4, 1);
    }
    R('#2a1a2e', x + 12, y - 18, 3, 2);
  } else if (e.prop === 'cup') { R('#fff4e8', x + 9, y - 19, 4, 5); R('#8a5a34', x + 10, y - 20, 3, 1); R('#2a1a2e', x + 13, y - 18, 1, 2); }
  else if (e.prop === 'bag') { R('#8a5a34', x + 9, y - 17, 7, 7); R('#c08a4a', x + 10, y - 15, 5, 4); R('#2a1a2e', x + 11, y - 19, 3, 2); }
  else if (e.prop === 'book') { R('#2a1a2e', x + 8, y - 18, 8, 6); R('#fff4e8', x + 9, y - 17, 3, 4); R('#fff4e8', x + 12, y - 17, 3, 4); }
  else if (e.prop === 'folder') { R('#3a5ad8', x + 9, y - 17, 7, 6); R('#fff4e8', x + 10, y - 16, 5, 2); }
  else if (e.prop === 'phone') { R('#2a1a2e', x + 10, y - 17, 4, 7); R('#9ad4f0', x + 11, y - 16, 2, 4); }
  if (e.chatWith && !e.saying && ((now() / 450 | 0) + k) % 2 === 0) {   // townlife.js shows real words instead of dots near you
    R('#2a1a2e', x + 7, y - 43, 13, 10); R('#fffdf4', x + 8, y - 42, 11, 8);
    for (let i = 0; i < 3; i++) R('#6a5a7a', x + 10 + i * 3, y - 39, 2, 2);
  }
}

// ---- aging ----
const yearsPassed = () => Math.floor((day() - 1) / YEAR);
const AGE_ROLES = ['worker', 'worker', 'barista', 'clerk', 'freelance', 'athlete', 'shopkeeper', 'worker'];
function liveFields(o, base, idx) {          // define age / role / schedule as live getters on a PEOPLE record or entity
  const born = base.born ?? -(base.age0 ?? 0);
  Object.defineProperties(o, {
    age: { get: () => yearsPassed() - born, configurable: true, enumerable: true },
    role: { get: () => { const a = yearsPassed() - born; return a < 18 ? 'student' : a >= 60 ? 'retiree' : (base.adultRole || AGE_ROLES[idx % AGE_ROLES.length]); }, configurable: true, enumerable: true },
    sched: { get: () => schedOf(o), configurable: true, enumerable: true },
    date: { get: () => { const a = yearsPassed() - born; return a >= 18 && a <= 45 && !o.mate && !st.gone?.[o.id] ? 1 : 0; }, configurable: true, enumerable: true },
  });
}
PEOPLE.forEach((p, i) => { p.age0 = p.age; p.adultRole = p.role === 'worker' || p.role === 'barista' || p.role === 'clerk' || p.role === 'freelance' || p.role === 'athlete' || p.role === 'shopkeeper' ? p.role : AGE_ROLES[i % 8]; liveFields(p, p, i); });

// ---- world events: replayable list stored in the save so the town history is reproduced exactly ----
const NPC_F = ['Anna', 'Bianca', 'Cara', 'Dora', 'Edie', 'Flora', 'Gina', 'Hana', 'Iris', 'Jenny', 'Karin', 'Lena', 'Mona', 'Nina', 'Opal', 'Pia', 'Quinn', 'Rita', 'Sara', 'Tina', 'Uma', 'Vera', 'Wendy', 'Xena', 'Yara', 'Cindy'];
const NPC_M = ['Adam', 'Bruno', 'Carl', 'Dylan', 'Eric', 'Frank', 'Greg', 'Hank', 'Ian', 'Joel', 'Kyle', 'Luke', 'Mark', 'Nick', 'Otto', 'Paul', 'Quentin', 'Ross', 'Seth', 'Tom', 'Uri', 'Vic', 'Will', 'Xavier', 'Yusuf', 'Zack'];
const NPC_F_TH = ['อันนา', 'เบียงก้า', 'คาร่า', 'ดอร่า', 'อีดี้', 'ฟลอร่า', 'จีน่า', 'ฮาน่า', 'ไอริส', 'เจนนี่', 'คาริน', 'ลีน่า', 'โมนา', 'นีน่า', 'โอปอล', 'ปิยะ', 'ควินน์', 'ริต้า', 'ซาร่า', 'ทีน่า', 'อุมา', 'เวร่า', 'เวนดี้', 'ซีน่า', 'ยาร่า', 'ซินดี้'];
const NPC_M_TH = ['อดัม', 'บรูโน่', 'คาร์ล', 'ไดแลน', 'อีริค', 'แฟรงค์', 'เกร็ก', 'แฮงค์', 'เอียน', 'โจเอล', 'ไคล์', 'ลุค', 'มาร์ค', 'นิก', 'อ็อตโต้', 'พอล', 'เควนติน', 'รอสส์', 'เซธ', 'ทอม', 'ยูริ', 'วิค', 'วิล', 'เซเวียร์', 'ยูซุฟ', 'แซ็ค'];
const world = () => st.world || (st.world = { ev: [], year: 0 });
const alive = p => !st.gone?.[p.id];
const homeIdx = (p, k) => { const b = p.homeOf ? PEOPLE.find(x => x.id === p.homeOf) || p : p; return HOMES[Math.max(0, PEOPLE.indexOf(b)) % HOMES.length]; };
function newbornRecord(e) {
  const A = PEOPLE.find(p => p.id === e.pa), B = PEOPLE.find(p => p.id === e.pb) || A, pick = (a, b) => (e.i % 2 ? a : b);
  const r = { id: e.id.toLowerCase(), n: e.n || e.id, g: e.g, born: e.y, role: 'student', trait: pick(A.trait, B.trait), pal: { ...A.pal, style: e.g === 'f' ? 'bob' : 'short', clip: 0, skirt: 0, h: pick(A.pal.h, B.pal.h), H: pick(A.pal.H, B.pal.H), L: pick(A.pal.L, B.pal.L), c: '#' + ((e.i * 2654435761 >>> 0) % 0xffffff).toString(16).padStart(6, '0') },
    love: [FOOD_POOL[e.i % 20]], like: [FOOD_POOL[(e.i + 5) % 20], FOOD_POOL[(e.i + 9) % 20]], hate: [FOOD_POOL[(e.i + 13) % 20]], says: [...ROLE_SAYS.student, TRAIT_SAYS[pick(A.trait, B.trait)]], parents: [e.pa, e.pb], homeOf: e.pa, adultRole: AGE_ROLES[e.i % 8] };
  r.pal.C = shade(r.pal.c, -40); liveFields(r, r, e.i + 50); return r;
}
function applyEvent(e, live) {
  if (e.t === 'marry') { const a = PEOPLE.find(p => p.id === e.a), b = PEOPLE.find(p => p.id === e.b); if (!a || !b) return; a.mate = b.id; b.mate = a.id; b.homeOf = a.id; if (live) { const eb = people.find(p => p.id === b.id); if (eb) { eb.mate = a.id; eb.home = homeIdx(b); } const ea = people.find(p => p.id === a.id); if (ea) ea.mate = b.id; } }
  if (e.t === 'die') { (st.gone || (st.gone = {}))[e.id] = 1; }
  if (e.t === 'birth' && !PEOPLE.some(p => p.id === e.id.toLowerCase())) {
    const r = newbornRecord(e); PEOPLE.push(r);
    if (live) { const k = PEOPLE.length - 1, ent = { ...r, k, home: homeIdx(r, k), spots: {}, x: 0, y: 0, dir: 0, frame: 0, at: 0, spr: sheet(r.pal), slot: 'in', stuck: 0, person: 1 }; liveFields(ent, r, k + 50); people.push(ent); }
  }
}
const replayWorld = () => { for (const e of world().ev) applyEvent(e, false); };
const _mp9 = makePeople;
makePeople = () => { replayWorld(); _mp9(); people.forEach((ent, k) => { if (PEOPLE[k]) { liveFields(ent, PEOPLE[k], k); if (PEOPLE[k].mate) ent.mate = PEOPLE[k].mate; } }); };
function yearlyWorld() {
  const W = world(), y = yearsPassed(); if (y <= W.year) return; W.year = y;
  const names = takenNames().concat(PEOPLE.map(p => p.n)), news = [];
  for (const p of PEOPLE.filter(alive)) {                       // passing away
    const a = p.age; if (a >= 78 && Math.random() < (a - 77) * .05) { const e = { t: 'die', id: p.id, y }; W.ev.push(e); applyEvent(e, true); news.push(`🕯️ ${p.n} เสียชีวิตด้วยวัย ${a} ปี`); if ((st.rel[p.id]?.f || 0) >= 40) fx({ mood: -15 }); }
  }
  const singles = PEOPLE.filter(p => alive(p) && !p.mate && p.age >= 20 && p.age <= 45 && p.id !== st.partner && p.id !== st.spouse && p.id !== st.engaged);
  for (const a of singles) {                                    // marriage
    if (a.mate || Math.random() > .3) continue; const b = singles.find(b => b !== a && !b.mate && b.g !== a.g && Math.abs(b.age - a.age) <= 8); if (!b) continue;
    const e = { t: 'marry', a: a.id, b: b.id, y }; W.ev.push(e); applyEvent(e, true); news.push(`💒 ${a.n} กับ ${b.n} แต่งงานกัน`);
  }
  for (const a of PEOPLE.filter(p => alive(p) && p.mate && p.g === 'f' && p.age <= 40)) {   // children
    const kids = PEOPLE.filter(c => c.parents?.includes(a.id)).length; if (kids >= 2 || Math.random() > .35) continue;
    const g = Math.random() < .5 ? 'f' : 'm', en = g === 'f' ? NPC_F : NPC_M, th = g === 'f' ? NPC_F_TH : NPC_M_TH;
    const idx = th.findIndex((n, k) => !names.includes(n) && !PEOPLE.some(p => p.id === en[k].toLowerCase())); if (idx < 0) continue;
    const n = th[idx], id = en[idx]; names.push(n); const e = { t: 'birth', id, n, g, pa: a.id, pb: a.mate, y, i: PEOPLE.length }; W.ev.push(e); applyEvent(e, true); news.push(`👶 ${a.n} มีลูกน้อยชื่อ ${n}`);
  }
  news.slice(0, 3).forEach((t, i) => setTimeout(() => toast(`📰 ข่าวเมือง: ${t}`), 900 * (i + 1))); if (news.length) save();
}
const _lt5 = lifeTick; lifeTick = () => { _lt5(); yearlyWorld(); };
const _po5 = personOpts; personOpts = p => { const o = _po5(p); return p.mate && !p.fam ? o.filter(x => !/เดท|สารภาพ|ขอแต่งงาน/.test(x[0])) : o; };
console.assert(findPath(10 * T, 12 * T, 20 * T, 14 * T) !== undefined, 'pathfinder runs');
