'use strict';
// Phase 3: living households, NPC migration, family routines and per-home interiors.
// Loaded after npcdeep and before nightlife. The module keeps `p.home` as the building index
// (so paths, doors and the existing home system keep working) and stores the authoritative
// household assignment in st.npcMove.home. That makes migration save-safe and lets old saves
// adopt the new ten-home town without changing their furniture or relationships.

const NM_MAX = 6, NM_MOVE_EVERY = 2, NM_RECENT = 3;
const NM_HOUSE_NO = bi => HOMES.indexOf(bi) + 1;
const NM_ROUTINE = {
  dinner: { ic: '🍲', n: 'มื้อค่ำครอบครัว', at: [18, 19.5] },
  chores: { ic: '🧹', n: 'งานบ้าน', at: [10, 12] },
  childcare: { ic: '👶', n: 'ดูแลเด็ก', at: [15.5, 17.5] },
  party: { ic: '🎉', n: 'ฉลองครอบครัว', at: [17.5, 20.5] },
  free: { ic: '☕', n: 'วันสบาย ๆ', at: null },
};
const NM_KIND = {
  couple: { ic: '💕', label: 'คู่รักย้ายมาอยู่ด้วยกัน' },
  teen: { ic: '🎒', label: 'เด็กที่โตแล้วย้ายออก' },
  elder: { ic: '🧓', label: 'ผู้สูงอายุย้ายไปอยู่กับครอบครัว' },
  split: { ic: '🏘️', label: 'ครัวเรือนใหญ่แยกบ้าน' },
};

// The ten households. Building indices are stable (five old homes + five new homes at 24-28);
// editing this table only changes the starting cast, never pathing.
const NM_ROSTER = {
  2: ['theo', 'zoe', 'liam', 'emma', 'noah', 'olivia', 'ethan'],
  6: ['finn', 'nora', 'sophia', 'jack', 'mia'],
  8: ['ryan', 'ivy', 'leo', 'cora'],
  9: ['sam', 'luna', 'chloe', 'max', 'lily', 'oscar', 'grace'],
  10: ['eli', 'maya', 'violet', 'dean'],
  24: ['caleb', 'daisy'],
  25: ['walt', 'stella', 'arlo', 'penny', 'gus'],
  26: ['jasper', 'jade', 'henry', 'owen', 'ella', 'felix'],
  27: ['colin', 'ruby', 'hannah', 'alice', 'hugo', 'claire'],
  28: ['ben', 'rose', 'miles', 'hazel'],
};
const NM_PAIRS = [
  ['theo', 'zoe'], ['finn', 'nora'], ['ryan', 'ivy'], ['sam', 'luna'], ['eli', 'maya'],
  ['caleb', 'daisy'], ['jasper', 'jade'], ['hugo', 'claire'], ['ben', 'rose'], ['miles', 'hazel'],
  ['walt', 'stella'], ['dean', 'violet'], ['owen', 'ella'], ['henry', 'hannah'],
];
const NM_WED_RAW = {
  'theo|zoe': { d: 15, y: 6 }, 'finn|nora': { d: 19, y: 3 }, 'ryan|ivy': { d: 23, y: 10 },
  'sam|luna': { d: 4, y: 12 }, 'eli|maya': { d: 26, y: 4 }, 'caleb|daisy': { d: 11, y: 2 },
  'jasper|jade': { d: 8, y: 9 }, 'hugo|claire': { d: 21, y: 16 }, 'ben|rose': { d: 6, y: 1 },
  'miles|hazel': { d: 18, y: 2 }, 'walt|stella': { d: 13, y: 28 }, 'dean|violet': { d: 25, y: 22 },
  'owen|ella': { d: 9, y: 1 }, 'henry|hannah': { d: 16, y: 1 },
};
const NM_BDAYS = { liam: 16, grace: 17, zoe: 15, ben: 21, cora: 25, emma: 20, oscar: 24, penny: 12 };

const NM_VER = 2;
const nmMoveState = () => st.npcMove || (st.npcMove = {
  v: NM_VER, home: {}, moves: [], wed: {}, bday: {}, routine: { d: 0, byHome: {} },
  last: 0, cycle: 0, helped: {}, farewell: {}, visited: {}, stats: { moves: 0, helped: 0, farewells: 0, visits: 0 }, intro: 0, seeded: 0,
});
const nmPairKey = (a, b) => [a, b].sort().join('|');
const NM_WED = Object.fromEntries(Object.entries(NM_WED_RAW).map(([k, v]) => [nmPairKey(...k.split('|')), v]));
const nmDoy = d => ((d - 1) % YEAR + YEAR) % YEAR + 1;
const nmPartnerOf = p => {
  if (!p || !p.mate) return null;
  const q = people.find(x => x.id === p.mate);
  return q && q.mate === p.id ? q : null;
};
const nmDaysToBday = id => {
  const M = nmMoveState(), b = M.bday[id]; if (!b) return null;
  return (b - nmDoy(day()) + YEAR) % YEAR;
};
const nmDaysToAnniv = (a, b) => {
  const w = nmMoveState().wed[nmPairKey(a, b)]; if (!w) return null;
  const d = typeof w === 'number' ? w : w.d; if (!d) return null;
  return (d - nmDoy(day()) + YEAR) % YEAR;
};
const nmWedYears = (a, b) => {
  const w = nmMoveState().wed[nmPairKey(a, b)];
  return w && typeof w === 'object' ? (w.y || 1) : 1;
};
const nmAge = p => p && p.age || 0;
const nmMinor = p => nmAge(p) < 18;
const nmElder = p => nmAge(p) >= 65;

// ---- one-time household seeding (also upgrades an old 5-home save) ---------------------------------
function nmEnsureRoster() {
  const M = nmMoveState(), valid = new Set(HOMES);
  if ((M.v || 1) < NM_VER) {                       // house numbering changed: rebuild households once
    M.home = {}; M.seeded = 0; M.last = 0; M.moves = []; M.intro = 1;
    M.helped = {}; M.farewell = {}; M.visited = {};
  }
  if (!M.seeded || !M.home || !Object.keys(M.home).length) {
    if (!M.home) M.home = {};
    for (const bi in NM_ROSTER) for (const id of NM_ROSTER[bi])
      if (PEOPLE.some(p => p.id === id) && M.home[id] == null) M.home[id] = Number(bi);
    M.last = M.last || day();
    M.intro = 1;
    M.cycle = M.cycle || 0;
    M.seeded = 1;
  }
  for (const p of PEOPLE) {
    if (p.fam || p.id === st.spouse || p.id === st.partner || p.id === st.cohab || p.id === st.engaged) continue;
    if (M.home[p.id] == null || !valid.has(M.home[p.id])) {
      const old = people.find(e => e.id === p.id)?.home;
      M.home[p.id] = valid.has(old) ? old : HOMES[(p.k ?? PEOPLE.indexOf(p)) % HOMES.length];
    }
  }
  // NPC couples are real households now: seed mutual mates and wedding dates once.
  for (const [a, b] of NM_PAIRS) {
    const A = PEOPLE.find(p => p.id === a), B = PEOPLE.find(p => p.id === b);
    if (!A || !B || A.fam || B.fam || st.solo?.[a] || st.solo?.[b] || st.gone?.[a] || st.gone?.[b]) continue;
    if ([a, b].includes(st.spouse) || [a, b].includes(st.partner) || [a, b].includes(st.cohab) || [a, b].includes(st.engaged)) continue;
    if (!A.mate && !B.mate) { A.mate = b; B.mate = a; }
    const ea = people.find(p => p.id === a), eb = people.find(p => p.id === b);
    if (ea && eb && ea.mate == null && eb.mate == null) { ea.mate = b; eb.mate = a; }
  }
  if (!M.wed) M.wed = {};
  for (const [a, b] of NM_PAIRS) {
    const key = nmPairKey(a, b);
    if (!M.wed[key]) M.wed[key] = NM_WED[key] || { d: 1 + (hash01(a.charCodeAt(0) * 31 + b.charCodeAt(0) * 17) * YEAR | 0), y: 1 + (hash01(a.charCodeAt(1) * 13 + b.charCodeAt(1) * 7) * 12 | 0) };
  }
  if (!M.bday) M.bday = {};
  for (const p of PEOPLE) {
    if (M.bday[p.id] == null) M.bday[p.id] = NM_BDAYS[p.id] || (1 + (hash01(PEOPLE.indexOf(p) * 71 + p.id.length * 19) * YEAR | 0));
  }
  M.v = NM_VER;
  nmApplyRoster();
}

function nmApplyRoster() {
  const M = nmMoveState();
  for (const p of people) {
    if (p.fam || st.gone?.[p.id]) continue;
    const bi = M.home[p.id];
    if (bi == null || !HOMES.includes(bi) || p.home === bi) continue;
    p.home = bi; p.spots = {}; p.path = null; p.pathFor = null;
    if (p.hidden) p.insideB = bi;
  }
}
const nmHouseholds = () => {
  const out = {};
  for (const p of people) if (!p.fam && !st.gone?.[p.id]) (out[p.home] || (out[p.home] = [])).push(p);
  return out;
};
const nmCap = bi => homeResidents(bi).length;
const nmLowHomes = (max, ...exclude) => HOMES.filter(bi => !exclude.includes(bi) && nmCap(bi) <= max)
  .sort((a, b) => nmCap(a) - nmCap(b) || NM_HOUSE_NO(a) - NM_HOUSE_NO(b));
const nmHomeTag = bi => `${homeLabel(bi)} (หลัง ${NM_HOUSE_NO(bi)}/${HOMES.length})`;
const nmLabel = bi => `${NM_ROUTINE[nmRoutineFor(bi)?.k]?.ic || '🏠'} ${homeLabel(bi)}`;

// ---- daily family routine and events ---------------------------------------------------------------
function nmTodayEvents(bi) {
  const rs = homeResidents(bi), out = [];
  for (const p of rs) if (nmDaysToBday(p.id) === 0) out.push({ ic: '🎂', label: `วันเกิด ${p.n}`, ids: [p.id] });
  const seen = new Set();
  for (const p of rs) {
    const q = nmPartnerOf(p); if (!q || !rs.includes(q)) continue;
    const key = nmPairKey(p.id, q.id); if (seen.has(key)) continue; seen.add(key);
    if (nmDaysToAnniv(p.id, q.id) === 0) out.push({ ic: '💐', label: `ครบรอบแต่งงาน ${nmWedYears(p.id, q.id)} ปีของ ${p.n} และ ${q.n}`, ids: [p.id, q.id] });
  }
  return out;
}
function nmBuildRoutines() {
  const M = nmMoveState(), by = {};
  for (const bi of HOMES) {
    const rs = homeResidents(bi);
    if (!rs.length) { by[bi] = { k: 'free', who: [] }; continue; }
    const ev = nmTodayEvents(bi);
    if (ev.length) { by[bi] = { k: 'party', who: rs.map(p => p.id), at: NM_ROUTINE.party.at, ev }; continue; }
    const kids = rs.filter(p => nmAge(p) < 13), teens = rs.filter(p => nmAge(p) >= 13 && nmAge(p) < 18), adults = rs.filter(p => nmAge(p) >= 18 && nmAge(p) < 65);
    const pick = hash01(day() * 31 + bi * 17 + 7), lead = homeLead(bi) || rs[0];
    let k = 'free', who = [], at = null;
    if (kids.length && adults.length) {
      if (pick < .42) { k = 'childcare'; who = [adults[0].id, ...kids.slice(0, 3).map(p => p.id)]; at = NM_ROUTINE.childcare.at; }
      else if (pick < .78) { k = 'dinner'; who = [...adults.slice(0, 2).map(p => p.id), ...kids.slice(0, 1).map(p => p.id)]; at = NM_ROUTINE.dinner.at; }
      else { k = 'chores'; who = [adults[0].id, ...kids.slice(0, 1).map(p => p.id)]; at = NM_ROUTINE.chores.at; }
    } else if (adults.length) {
      if (pick < .5) { k = 'dinner'; who = adults.slice(0, 2).map(p => p.id); at = NM_ROUTINE.dinner.at; }
      else if (pick < .76) { k = 'chores'; who = [adults[0].id]; at = NM_ROUTINE.chores.at; }
      else if (teens.length) { k = 'childcare'; who = [adults[0].id, ...teens.slice(0, 2).map(p => p.id)]; at = NM_ROUTINE.childcare.at; }
    } else if (teens.length) {
      k = pick < .5 ? 'chores' : 'dinner';
      who = teens.slice(0, k === 'dinner' ? 2 : 1).map(p => p.id); at = NM_ROUTINE[k].at;
    } else if (rs.length) {
      k = pick < .6 ? 'dinner' : 'chores'; who = rs.slice(0, k === 'dinner' ? 2 : 1).map(p => p.id); at = NM_ROUTINE[k].at;
    }
    if (lead && k === 'free') who = [lead.id];
    by[bi] = { k, who, at };
  }
  M.routine = { d: day(), byHome: by };
}
function nmRoutineFor(bi) {
  const M = nmMoveState();
  if (!M.routine || M.routine.d !== day() || !M.routine.byHome) nmBuildRoutines();
  return M.routine.byHome[bi] || null;
}
const nmRoutineOn = r => !!(r && r.at && hour() >= r.at[0] && hour() < r.at[1]);
const nmHM = h => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
const nmRoutineText = r => r ? `${NM_ROUTINE[r.k]?.ic || '🏠'} ${NM_ROUTINE[r.k]?.n || 'วันสบาย ๆ'}${r.at ? ` · ${nmHM(r.at[0])}–${nmHM(r.at[1])}` : ''}` : '—';

const _slotMove = slotOf;
slotOf = p => {
  const base = _slotMove(p);
  if (p.fam || p.visiting || st.gone?.[p.id] || base === 'in') return base;
  if (typeof festOn === 'function' && festOn()) return base;
  if (typeof nightClerk === 'function' && nightClerk(p)) return base;
  const meet = typeof ph === 'function' ? ph().meet : null;
  if (meet && meet.id === p.id && day() === meet.d && hour() >= meet.hour - .5 && hour() < meet.hour + 2) return base;
  const r = nmRoutineFor(p.home);
  if (r && r.who.includes(p.id) && nmRoutineOn(r)) return 'home';
  return base;
};

// ---- migration -------------------------------------------------------------------------------------
function nmMoveMembers(ids, to) {
  const M = nmMoveState();
  const from = [];
  for (const id of ids) {
    const p = people.find(q => q.id === id);
    if (!p || p.fam || st.gone?.[id] || p.home === to) continue;
    if (!from.includes(p.home)) from.push(p.home);
    M.home[id] = to; p.home = to; p.spots = {}; p.path = null; p.pathFor = null;
    if (p.hidden) p.insideB = to;
  }
  return from;
}
function nmTryCouple() {
  const done = new Set();
  for (const p of people) {
    if (p.fam || st.gone?.[p.id] || !p.mate) continue;
    const q = nmPartnerOf(p); if (!q || q.fam || q.home === p.home) continue;
    const key = nmPairKey(p.id, q.id); if (done.has(key)) continue; done.add(key);
    if (homeResidents(p.home).some(x => nmAge(x) < 13) || homeResidents(q.home).some(x => nmAge(x) < 13)) continue;
    const target = nmLowHomes(NM_MAX - 2, p.home, q.home).find(bi => nmCap(bi) + 2 <= NM_MAX);
    if (target != null) {
      const from = nmMoveMembers([p.id, q.id], target);
      return { k: 'couple', ids: [p.id, q.id], from, to: target, news: `${NM_KIND.couple.ic} ${p.n} กับ ${q.n} ย้ายมาอยู่ด้วยกันที่${homeLabel(target)}` };
    }
    const into = nmCap(p.home) < NM_MAX ? p.home : nmCap(q.home) < NM_MAX ? q.home : null;
    if (into != null) {
      const mover = into === p.home ? q : p, stay = into === p.home ? p : q;
      const from = nmMoveMembers([mover.id], into);
      return { k: 'couple', ids: [mover.id, stay.id], from, to: into, news: `${NM_KIND.couple.ic} ${mover.n} ย้ายไปอยู่กับ ${stay.n} ที่${homeLabel(into)}` };
    }
  }
  return null;
}
function nmTryTeen() {
  const cands = people.filter(p => !p.fam && !p.mate && !st.gone?.[p.id] && nmAge(p) >= 16 && nmAge(p) < 20 && nmCap(p.home) >= 5)
    .sort((a, b) => nmAge(b) - nmAge(a) || a.id.localeCompare(b.id));
  for (const p of cands) {
    const target = nmLowHomes(4, p.home).find(bi => nmCap(bi) < 5 && homeResidents(bi).some(x => nmAge(x) >= 18));
    if (target == null) continue;
    const from = nmMoveMembers([p.id], target);
    return { k: 'teen', ids: [p.id], from, to: target, news: `${NM_KIND.teen.ic} ${p.n} โตแล้ว ย้ายออกไปเช่าห้องอยู่ที่${homeLabel(target)}` };
  }
  return null;
}
function nmTryElder() {
  const cands = people.filter(p => !p.fam && !p.mate && !st.gone?.[p.id] && nmElder(p) && !homeResidents(p.home).some(x => nmAge(x) < 18))
    .sort((a, b) => nmAge(b) - nmAge(a));
  for (const p of cands) {
    const target = nmLowHomes(5, p.home).find(bi => nmCap(bi) < NM_MAX && homeResidents(bi).some(x => nmMinor(x)));
    if (target == null) continue;
    const from = nmMoveMembers([p.id], target);
    return { k: 'elder', ids: [p.id], from, to: target, news: `${NM_KIND.elder.ic} ${p.n} ย้ายไปอยู่กับครอบครัวที่${homeLabel(target)}` };
  }
  return null;
}
function nmTrySplit() {
  const homes = HOMES.filter(bi => nmCap(bi) > 6).sort((a, b) => nmCap(b) - nmCap(a));
  const stranded = (rs, ids) => {
    const left = rs.filter(p => !ids.includes(p.id));
    return left.some(nmMinor) && !left.some(p => nmAge(p) >= 18);
  };
  for (const bi of homes) {
    const rs = homeResidents(bi), free = nmLowHomes(4, bi);
    if (!free.length) continue;
    const couple = rs.find(p => p.mate && rs.some(q => q.id === p.mate));
    if (couple) {
      const q = rs.find(x => x.id === couple.mate);
      const target = free.find(x => nmCap(x) + 2 <= NM_MAX);
      if (target != null && !stranded(rs, [couple.id, q.id])) {
        const from = nmMoveMembers([couple.id, q.id], target);
        return { k: 'split', ids: [couple.id, q.id], from, to: target, news: `${NM_KIND.split.ic} บ้านใหญ่แยกออก — ${couple.n} กับ ${q.n} ย้ายไป${homeLabel(target)}` };
      }
    }
    const mover = rs.filter(p => !p.mate && nmAge(p) >= 16).sort((a, b) => nmAge(b) - nmAge(a))[0]
      || rs.filter(p => nmAge(p) < 13).sort((a, b) => nmAge(a) - nmAge(b))[0];
    if (!mover || stranded(rs, [mover.id])) continue;
    const target = free.find(x => homeResidents(x).some(y => nmAge(y) >= 25));
    if (target == null) continue;
    const from = nmMoveMembers([mover.id], target);
    return { k: 'split', ids: [mover.id], from, to: target, news: `${NM_KIND.split.ic} ครัวเรือนที่${homeLabel(bi)} แยกบ้าน — ${mover.n} ย้ายไปอยู่กับญาติที่${homeLabel(target)}` };
  }
  return null;
}
function nmRunMigration(force) {
  if (typeof visit !== 'undefined' && visit) return null;
  nmApplyRoster();
  const M = nmMoveState(), kinds = ['couple', 'teen', 'elder', 'split'];
  const fn = { couple: nmTryCouple, teen: nmTryTeen, elder: nmTryElder, split: nmTrySplit };
  if (force && fn[force]) {
    const r = fn[force]();
    if (r) { M.cycle = (kinds.indexOf(force) + 1) % kinds.length; nmAfterMove(r); }
    return r;
  }
  for (let i = 0; i < kinds.length; i++) {
    const k = kinds[(M.cycle + i) % kinds.length];
    const r = fn[k]();
    if (r) { M.cycle = (kinds.indexOf(k) + 1) % kinds.length; nmAfterMove(r); return r; }
  }
  return null;
}
function nmAfterMove(r) {
  const M = nmMoveState();
  M.stats.moves = (M.stats.moves || 0) + 1;
  M.moves.unshift({ d: day(), h: Math.floor(hour()), k: r.k, ids: r.ids, from: r.from, to: r.to, key: `${day()}-${r.ids.join('-')}-${r.to}` });
  if (M.moves.length > 40) M.moves.length = 40;
  M.routine.d = 0;
  townNews(r.news);
  toast(r.news);
  save();
}
const nmRecentMove = (bi, dir) => {
  const M = nmMoveState();
  return M.moves.find(m => day() - m.d <= NM_RECENT && (dir === 'in' ? m.to === bi : m.from.includes(bi))) || null;
};

// ---- per-home interiors ----------------------------------------------------------------------------
const _roomLayoutMove = roomLayout;
roomLayout = (bi, rs) => {
  const out = _roomLayoutMove(bi, rs).slice();
  const kids = rs.filter(p => nmAge(p) < 13), teens = rs.filter(p => nmAge(p) >= 13 && nmAge(p) < 18), elders = rs.filter(nmElder);
  const grid = Array.from({ length: 9 }, () => Array(11).fill(0));
  for (const [id, x, y] of out) {
    const F = FURN[id]; if (!F || F.floor) continue;
    for (let yy = y; yy < y + F.h; yy++) for (let xx = x; xx < x + F.w; xx++) if (grid[yy] && grid[yy][xx] != null) grid[yy][xx] = 1;
  }
  const add = (id, x, y) => {
    const F = FURN[id]; if (!F || x < 0 || y < 2 || x + F.w > NROOM_W || y + F.h > NROOM_H) return false;
    for (let yy = y; yy < y + F.h; yy++) for (let xx = x; xx < x + F.w; xx++) if (grid[yy][xx]) return false;
    for (let yy = y; yy < y + F.h; yy++) for (let xx = x; xx < x + F.w; xx++) grid[yy][xx] = 1;
    out.push([id, x, y]);
    return true;
  };
  if (rs.some(p => !!p.mate) || rs.length >= 4) add('table', 2, 3);
  if (kids.length) { add('bed1', 0, 6); if (!add('teddy', 9, 5)) add('teddy', 0, 5); }
  if (teens.length) { add('pc1', 0, 6); add('shelf1', 8, 2); }
  if (elders.length) add('plant', 0, 2);
  if (rs.length >= 5) add('shelf1', 8, 2);
  return out;
};
const _drawRoomMove = drawNpcRoomBg;
drawNpcRoomBg = bi => {
  _drawRoomMove(bi);
  const rs = homeResidents(bi), lead = homeLead(bi);
  const W = nRoom.W * T;
  const shadow = '#3a2a22', frame = '#f4e8c8';
  // family portrait on the wall: one little head per resident, hearts for couples
  const px = 108, py = 10, pw = 52, ph = 34;
  R(shadow, px - 2, py - 2, pw + 4, ph + 4); R(frame, px, py, pw, ph); R('#6a8ab0', px + 3, py + 3, pw - 6, ph - 6);
  for (let i = 0; i < rs.length; i++) {
    const x = px + 7 + (i % 4) * 11, y = py + 9 + Math.floor(i / 4) * 11, col = i % 2 ? '#f0c8b0' : '#e8b898';
    R(col, x, y, 6, 5); R(i % 3 ? '#5a4232' : '#3a2a22', x, y - 2, 6, 2); R('#2a1a2e', x + 2, y + 2, 1, 1); R('#2a1a2e', x + 4, y + 2, 1, 1);
  }
  if (rs.some(p => !!p.mate)) { R('#e84a6a', px + pw - 12, py + 5, 2, 2); R('#e84a6a', px + pw - 9, py + 5, 2, 2); R('#e84a6a', px + pw - 11, py + 7, 6, 2); }
  // crayon drawings from the children, stacked in the gap before the window
  if (rs.some(p => nmAge(p) < 13)) {
    for (let i = 0; i < 3; i++) { R('#fff', 168, 8 + i * 16, 14, 12); R(['#e84a4a', '#3a8ae8', '#5ac87a'][i], 171, 12 + i * 16, 8, 1); R(['#e84a4a', '#3a8ae8', '#5ac87a'][i], 173, 15 + i * 16, 4, 4); }
  }
  ptext(`HOME ${NM_HOUSE_NO(bi)}`, W - 4 * T + 62, 12, '#3a2414', 1);
  if (lead) ptext(lead.id.toUpperCase(), W - 4 * T + 62, 24, '#6a4a2e', 1);
  ptext(`${rs.length}P`, W - 4 * T + 62, 36, '#6a4a2e', 1);
};
const _buildRoomMove = buildNpcRoom;
buildNpcRoom = (bi, rs) => {
  _buildRoomMove(bi, rs);
  const hasTable = roomLayout(bi, rs).some(([id]) => id === 'table');
  if (hasTable) nRoom.targets.push({ x: 3 * T, y: 4 * T + 12, name: 'โต๊ะอาหาร', get opts() { return nmTableOpts(bi); } });
};
function nmAward(ids, amount, trust = 0) {
  for (const id of ids) {
    const p = people.find(q => q.id === id); if (!p) continue;
    if (!p.fam) relOf(id).f = Math.max(0, Math.min(100, relOf(id).f + amount));
    if (trust && typeof ndTrustAdj === 'function') ndTrustAdj(p, trust, 'ครอบครัว');
  }
}
function nmTableOpts(bi) {
  const rs = homeResidents(bi), ev = nmTodayEvents(bi), r = nmRoutineFor(bi);
  const o = [];
  if (ev.length && rs.length) o.push([`${ev[0].ic} ${ev[0].label} — อวยพร`, () => {
    if (st.nmBdayWish === day()) return say('วันนี้ฉลองให้ครอบครัวนี้แล้ว');
    st.nmBdayWish = day(); nmAward(ev.flatMap(e => e.ids), 5, 3); fx({ mood: 10 }); tick(20);
    say(`${ev[0].label} — ทุกคนยิ้มแย้ม ${ev[0].ic}`); save();
  }]);
  if ((r.k === 'dinner' || r.k === 'party' || r.k === 'childcare') && rs.length) o.push([`${NM_ROUTINE[r.k].ic} ${r.k === 'childcare' ? 'ช่วยดูแลเด็ก' : 'ทานมื้อเย็นด้วยกัน'}`, () => {
    if (st.nmGuestMeal === day()) return say('วันนี้ร่วมโต๊ะกับครอบครัวนี้แล้ว');
    st.nmGuestMeal = day(); nmAward(rs.map(p => p.id), 2, 3); fx({ food: 40, mood: 12, energy: 2 }); tick(40);
    say(`นั่งกินข้าวกับ ${rs.slice(0, 3).map(p => p.n).join(', ')} — บรรยากาศอบอุ่นมาก ${NM_ROUTINE[r.k].ic}`); save();
  }]);
  o.push(['🧹 ช่วยงานบ้าน', () => {
    if (st.nmChore === day()) return say('วันนี้ช่วยงานบ้านไปแล้ว');
    if (st.energy < 8) return say('เหนื่อยเกินไปแล้ว');
    st.nmChore = day(); nmAward([homeLead(bi)?.id], 3, 5); fx({ energy: -7, mood: 5 }); tick(25);
    say('ช่วยกวาดบ้านและล้างจาน — บ้านสะอาดขึ้นเยอะ ✨'); save();
  }]);
  if (rs.some(p => nmAge(p) < 13)) o.push(['👶 ช่วยดูแลเด็ก', () => {
    if (st.nmKids === day()) return say('วันนี้เล่นกับเด็ก ๆ แล้ว');
    st.nmKids = day(); nmAward(rs.filter(p => nmAge(p) < 13).map(p => p.id), 3, 2); fx({ mood: 10, energy: -4 }); tick(25);
    say('เล่นกับเด็ก ๆ ในบ้าน เสียงหัวเราะดังไปทั่ว 🧸'); save();
  }]);
  return o;
}

// ---- door hooks, household panel, profile and phone integration ------------------------------------
function nmDoorOpts(bi) {
  const o = [['👪 ครอบครัวนี้', () => nmHouseholdPanel(bi)]];
  const inMove = nmRecentMove(bi, 'in'), outMove = nmRecentMove(bi, 'out');
  if (inMove) o.push(['📦 ช่วยขนของ', () => nmHelpMove(bi)]);
  if (outMove) o.push([`🎉 งานเลี้ยงส่ง`, () => nmFarewell(bi)]);
  return o;
}
function nmHouseholdPanel(bi) {
  openPanel(`🏠 ${homeLabel(bi)}`, () => {
    const rs = homeResidents(bi), lead = homeLead(bi), r = nmRoutineFor(bi), ev = nmTodayEvents(bi);
    const inMove = nmRecentMove(bi, 'in'), outMove = nmRecentMove(bi, 'out');
    return [
      row('🔢', 'บ้านหลังที่', `${NM_HOUSE_NO(bi)}/${HOMES.length} · ${rs.length} คน · ${rs.length >= 6 ? 'ค่อนข้างแออัด' : rs.length <= 2 ? 'บ้านเงียบ' : 'กำลังพอดี'}`),
      lead ? row('⭐', 'หัวหน้าบ้าน', `${lead.n} (${lead.age} ปี)`) : null,
      row('🗓️', 'กิจวัตรวันนี้', nmRoutineText(r)),
      ...ev.map(e => row(e.ic, e.label, 'ฉลองได้ที่โต๊ะอาหาร')),
      el('div', { className: 'sec' }, 'สมาชิกในบ้าน'),
      ...rs.map(p => row(relIcon(p), p.n, `${p.age} ปี · ${ROLE_NAME[p.role] || 'ชาวเมือง'} · ${isAtHome(p) ? 'อยู่บ้าน' : 'ออกไปข้างนอก'}`, btn('โปรไฟล์', () => {
        phonePanel(); pApp = 'rel'; pRel = p.id; refreshPanel();
      }))),
      ...(inMove ? [row('📦', 'เพิ่งย้ายเข้า', `${day() - inMove.d} วันที่แล้ว · ช่วยขนของได้`, btn('ช่วย', () => nmHelpMove(bi)))] : []),
      ...(outMove ? [row('🎉', 'เพิ่งมีคนย้ายออก', `${day() - outMove.d} วันที่แล้ว · จัดงานเลี้ยงส่งได้`, btn('จัด', () => nmFarewell(bi)))] : []),
      btn('🚪 เยี่ยมบ้าน', () => { closePanel(); enterNpcHome(bi); }),
    ];
  });
}
function nmHelpMove(bi) {
  const r = nmRecentMove(bi, 'in'); if (!r) return say('บ้านนี้ไม่มีการย้ายเข้าเร็ว ๆ นี้');
  const M = nmMoveState();
  if (M.helped[r.key] === day()) return say('วันนี้ช่วยขนของบ้านนี้แล้ว');
  if (st.energy < 10) return say('เหนื่อยเกินไป — พักก่อนแล้วค่อยช่วย');
  M.helped[r.key] = day(); M.stats.helped = (M.stats.helped || 0) + 1;
  nmAward(r.ids, 4, 7); fx({ energy: -10, mood: 8, money: 80 }); tick(45);
  toast('📦 ช่วยขนของเสร็จแล้ว — ได้ค่าขนม ฿80');
  say(`ช่วย ${r.ids.map(id => people.find(p => p.id === id)?.n).filter(Boolean).join(', ')} ขนกล่องเข้าบ้านใหม่ — ครัวเรือนนี้ขอบคุณมาก 📦`);
  checkAch(); save();
}
function nmFarewell(bi) {
  const r = nmRecentMove(bi, 'out'); if (!r) return say('บ้านนี้ไม่มีการย้ายออกเร็ว ๆ นี้');
  const M = nmMoveState();
  if (M.farewell[r.key] === day()) return say('วันนี้จัดงานเลี้ยงส่งบ้านนี้แล้ว');
  const dish = have('cake') ? 'cake' : Object.keys(st.inv).find(id => ITEMS[id]?.k === 'dish');
  if (!dish) return say('ต้องมีเค้กหรืออาหารที่ปรุงเองอย่างน้อย 1 อย่าง');
  addItem(dish, -1); M.farewell[r.key] = day(); M.stats.farewells = (M.stats.farewells || 0) + 1;
  const here = homeResidents(bi).map(p => p.id);
  nmAward([...r.ids, ...here], 5, 6); fx({ mood: 18, food: 30 }); tick(60);
  townNews(`🎉 ${st.name} จัดงานเลี้ยงส่งให้ ${r.ids.map(id => people.find(p => p.id === id)?.n).filter(Boolean).join(', ')} ที่${homeLabel(bi)}`);
  say('งานเลี้ยงส่งอบอุ่น มีทั้งอาหาร คำอวยพร และน้ำตาแห่งความสุข 🎉');
  checkAch(); save();
}
const _enterMove = enterNpcHome;
enterNpcHome = bi => {
  const r = nmRecentMove(bi, 'in');
  _enterMove(bi);
  if (!r || !visit || visit.home !== bi) return;
  const M = nmMoveState();
  if (M.visited[r.key] === day()) return;
  M.visited[r.key] = day(); M.stats.visits = (M.stats.visits || 0) + 1;
  setTimeout(() => { if (scene === nRoom) { fx({ mood: 9 }); toast('🏠 เยี่ยมบ้านใหม่แล้ว — ครัวเรือนนี้ดีใจที่คุณมา'); } }, 700);
  save();
};
function nmWrapHomeDoors() {
  for (const bi of HOMES) {
    const b = BUILDINGS[bi];
    const t = town.targets.find(t => Math.abs(t.x - b.ix) < 1 && Math.abs(t.y - (b.iy + 4)) < 1 && /บ้าน|🏠/.test(t.name));
    if (!t || t._nmHome != null) continue;
    t._nmHome = bi;
    const d = Object.getOwnPropertyDescriptor(t, 'opts');
    const base = d && d.get ? d.get : () => (d && d.value) || [];
    Object.defineProperty(t, 'opts', { configurable: true, get() { return [...nmDoorOpts(bi), ...base.call(t)]; } });
    const nd = Object.getOwnPropertyDescriptor(t, 'name');
    if (nd && nd.get) Object.defineProperty(t, 'name', { configurable: true, get() {
      const r = nmRoutineFor(bi), on = nmRoutineOn(r);
      return `🏠 ${homeLabel(bi)}${on ? ` ${NM_ROUTINE[r.k]?.ic || ''}` : ''}`;
    } });
  }
}
const _profileMove = relProfileView;
relProfileView = id => {
  const out = _profileMove(id), p = people.find(q => q.id === id);
  if (!p || p.fam) return out;
  const rs = homeResidents(p.home), r = nmRoutineFor(p.home), mate = nmPartnerOf(p);
  const moves = nmMoveState().moves.filter(m => m.ids.includes(id)).slice(0, 2);
  const extra = [
    row('🏘️', 'ครัวเรือน', `${nmHomeTag(p.home)} · ${rs.length} คน`),
    row('🗓️', 'กิจวัตรวันนี้', nmRoutineText(r)),
    nmDaysToBday(id) != null ? row('🎂', 'วันเกิดอีก', `${nmDaysToBday(id)} วัน`) : null,
    mate ? row('💐', 'ครบรอบแต่งงาน', `${nmDaysToAnniv(id, mate.id) ?? '—'} วัน · ${nmWedYears(id, mate.id)} ปี`) : null,
    ...moves.map(m => row(NM_KIND[m.k]?.ic || '📦', `ย้ายล่าสุด (${day() - m.d} วันก่อน)`, `${m.k === 'couple' ? 'ย้ายมาอยู่ด้วยกัน' : NM_KIND[m.k]?.label || 'ย้ายบ้าน'} · ${homeLabel(m.to)}`)),
  ];
  return [...out.slice(0, -1), ...extra, out[out.length - 1]];
};
const _relMove = APP.rel;
APP.rel = () => {
  const out = _relMove();
  if (pRel) return out;
  const M = nmMoveState(), moves = M.moves.slice(0, 3);
  return [out[0],
    el('div', { className: 'sec' }, 'ครัวเรือนและข่าวการย้าย'),
    row('🏘️', 'บ้านในเมือง', `${HOMES.length} หลัง · ${people.filter(p => !p.fam && !st.gone?.[p.id]).length} คน`),
    ...(moves.length ? moves.map(m => row(NM_KIND[m.k]?.ic || '📦', `${m.ids.map(id => people.find(p => p.id === id)?.n).filter(Boolean).join(', ')}`, `${day() - m.d} วันก่อน · ${NM_KIND[m.k]?.label || 'ย้ายบ้าน'} → ${homeLabel(m.to)}`)) :
      [el('div', { className: 'sub' }, 'ยังไม่มีข่าวการย้าย — ครัวเรือนจะเริ่มเปลี่ยนเมื่อเวลาผ่านไป')]),
    ...out.slice(1),
  ];
};

// ---- draw routine icons over NPCs in town ----------------------------------------------------------
const _drawEntMove = drawEnt;
drawEnt = e => {
  _drawEntMove(e);
  if (!e || !e.person || e.fam || e.hidden || scene !== town || !player) return;
  const r = nmRoutineFor(e.home);
  if (!r || !nmRoutineOn(r) || !r.who.includes(e.id)) return;
  if (Math.hypot(player.x - e.x, player.y - e.y) > 320) return;
  if (typeof CFG !== 'undefined' && CFG.thoughts === false) return;
  const ic = NM_ROUTINE[r.k]?.ic; if (!ic) return;
  const bx = Math.round(e.x), by = Math.round(e.y) - 48;
  R('#f4e8c8', bx - 9, by - 10, 18, 15); R('#c8a878', bx - 9, by - 10, 18, 1); R('#c8a878', bx - 9, by + 4, 18, 1); R('#8a6a4a', bx - 1, by + 5, 2, 2);
  g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillText(ic, bx, by + 2); g.textAlign = 'left';
};

// ---- daily rollover and save-safe wrappers ---------------------------------------------------------
function nmDaily() {
  const M = nmMoveState();
  if (!M.home || !Object.keys(M.home).length) nmEnsureRoster();
  if (!M.routine || M.routine.d !== day()) nmBuildRoutines();
  if (!M.last) M.last = day();
  if (day() >= M.last + NM_MOVE_EVERY && !panelOpen && !busy && !(typeof visit !== 'undefined' && visit)) {
    M.last = day();
    nmRunMigration();
    nmBuildRoutines();
  }
}
const _seasonMove = seasonTick;
seasonTick = () => { _seasonMove(); nmDaily(); };

const _makePeopleMove = makePeople;
makePeople = () => { _makePeopleMove(); nmEnsureRoster(); nmApplyRoster(); };
const _applyEventMove = applyEvent;
applyEvent = (e, live) => {
  _applyEventMove(e, live);
  const M = nmMoveState();
  if (e.t === 'birth') {
    const id = e.id.toLowerCase(), pa = people.find(p => p.id === e.pa) || PEOPLE.find(p => p.id === e.pa);
    const bi = pa ? (M.home[pa.id] ?? pa.home) : HOMES[0];
    if (bi != null) {
      M.home[id] = bi;
      const np = people.find(p => p.id === id); if (np && !np.fam) np.home = bi;
    }
  } else if (e.t === 'marry') {
    const a = people.find(p => p.id === e.a) || PEOPLE.find(p => p.id === e.a);
    const b = people.find(p => p.id === e.b) || PEOPLE.find(p => p.id === e.b);
    if (a && b && !a.fam && !b.fam) {
      const bi = M.home[a.id] ?? a.home;
      if (bi != null) { M.home[b.id] = bi; const eb = people.find(p => p.id === b.id); if (eb && !eb.fam) eb.home = bi; }
    }
  } else if (e.t === 'die') {
    delete M.visited[e.id];
  }
};
const _divorceMove = divorce;
divorce = p => {
  _divorceMove(p);
  const M = nmMoveState();
  if (p && !p.fam && p.home != null) M.home[p.id] = p.home;
  M.routine.d = 0;
};
const _startMove = start;
start = saved => {
  _startMove(saved);
  nmEnsureRoster(); nmApplyRoster(); nmBuildRoutines(); nmWrapHomeDoors();
  const M = nmMoveState();
  if (M.intro) {
    M.intro = 0;
    setTimeout(() => { townNews('🏘️ เมืองขยายย่านที่อยู่อาศัยเป็น 10 หลัง — ครัวเรือนใหม่ย้ายเข้าบ้านกันแล้ว'); toast('🏘️ เมืองมี 10 ครัวเรือนแล้ว — เปิดแอปความสัมพันธ์ดูบ้านของทุกคนได้'); }, 1200);
  }
  save();
};

nmWrapHomeDoors();
ACH.push(['movedhelp', '📦 เพื่อนบ้านตัวจริง', 'ช่วยครอบครัวขนของครบ 3 ครั้ง', () => (nmMoveState().stats.helped || 0) >= 3],
  ['farewell2', '🎉 เจ้าภาพงานเลี้ยง', 'จัดงานเลี้ยงส่งครบ 2 ครั้ง', () => (nmMoveState().stats.farewells || 0) >= 2]);
console.assert(HOMES.length >= 8 && HOMES.length <= 12, 'Phase 3 needs 8-12 town homes');
console.assert(Object.keys(NM_ROSTER).reduce((n, k) => n + NM_ROSTER[k].length, 0) === 50, 'households cover all 50 townsfolk');
console.assert(Object.values(NM_ROUTINE).every(r => r.ic && r.n), 'family routines describe themselves');
