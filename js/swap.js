'use strict';
// Family life swapping: open the 👪 app to play as any member of the household, warp home from
// anywhere, and let the family members you are not playing go to work and bring a paycheck home.
// The household wallet, house, furniture and relationships stay shared; skills, inventory, outfit
// and job travel with the body, so each person keeps their own life.

const SW_FIELDS = ['name', 'look', 'ageShift', 'lastAge', 'sk', 'inv', 'wear', 'outfit', 'char', 'job',
  'energy', 'food', 'mood', 'body', 'sick', 'payMod', 'school', 'grad'];

const swState = () => (st.famSw || (st.famSw = { ver: 1, cur: 'me', rec: {}, pay: {}, earned: 0, last: null, swaps: 0 }));
const swClone = v => v == null ? v : JSON.parse(JSON.stringify(v));
const swAge = shift => 6 + Math.floor((day() - 1) / YEAR) + (shift | 0);
const swShiftFor = a => a - (6 + Math.floor((day() - 1) / YEAR));
const swBlankSk = () => ({ cook: 0, logic: 0, charm: 0, fit: 0, art: 0, fish: 0, garden: 0 });

// ---- who is in the house ----
function swMembers() {
  const S = swState(), out = [];
  const meJob = S.cur === 'me' ? st.job : (S.rec.me && S.rec.me.job);
  out.push({ id: 'me', icon: '🧑', n: S.cur === 'me' ? st.name : ((S.rec.me && S.rec.me.name) || st.name),
    g: (S.cur === 'me' ? st.look?.g : (S.rec.me && S.rec.me.look && S.rec.me.look.g)) || 'm',
    age: S.cur === 'me' ? age() : swAge(S.rec.me ? S.rec.me.ageShift : 0), role: 'ชีวิตหลัก', job: meJob || null });
  const P = st.parents;
  if (P && P.dad && !P.dad.dead) out.push({ id: 'dad', icon: '👨', n: P.dad.n, g: 'm', age: parentAge(P.dad), role: 'พ่อ · ทำงานที่ออฟฟิศ' });
  if (P && P.mom && !P.mom.dead) out.push({ id: 'mom', icon: '👩', n: P.mom.n, g: 'f', age: parentAge(P.mom), role: 'แม่ · ทำงานที่คาเฟ่' });
  const sp = typeof spouseP === 'function' ? spouseP() : null;
  if (sp) out.push({ id: 'spouse', icon: '💍', n: sp.n, g: sp.g, age: sp.age, role: 'คู่สมรส' });
  (st.kids || []).forEach((k, i) => {
    if (!k.n) return;
    const a = kidAge(k);
    out.push({ id: 'kid' + i, icon: k.g === 'f' ? '👧' : '👦', n: k.n, g: k.g, age: a, kid: k,
      role: `${k.g === 'f' ? 'ลูกสาว' : 'ลูกชาย'} · ${a < 6 ? 'ยังเล็ก' : a < 18 ? 'นักเรียน' : 'วัยทำงาน'}` });
  });
  return out;
}

// ---- wages: family NPCs keep their own jobs while you are somebody else ----
function swWage(m) {
  const infl = st.infl || 1;
  if (m.id === 'dad') return Math.round(165 * infl);
  if (m.id === 'mom') return Math.round(120 * infl);
  if (m.id === 'spouse') { const p = typeof spouseP === 'function' ? spouseP() : null; return (p && typeof SPOUSE_WAGE !== 'undefined' && SPOUSE_WAGE[p.role]) || 90; }
  if (m.id.startsWith('kid')) return m.age >= 18 ? Math.round(100 * infl) : m.age >= 16 ? Math.round(55 * infl) : 0;
  return 0;
}
const swLookOf = id => {
  if ((id === 'dad' || id === 'mom') && st.parents && st.parents[id]) return st.parents[id].look;
  if (id === 'spouse') { const p = spouseP(); return p ? lookOf(p) : null; }
  if (id.startsWith('kid')) { const k = (st.kids || [])[+id.slice(3)]; return k ? k.look : null; }
  return st.look;
};

// ---- moving a life in and out of `st` ----
const swGrab = () => { const o = {}; for (const k of SW_FIELDS) o[k] = swClone(st[k]); return o; };
function swDefault(id, m) {
  return {
    name: m.n, look: swLookOf(id) || st.look, ageShift: swShiftFor(m.age), lastAge: m.age,
    sk: swBlankSk(), inv: {}, wear: swBaseWear(id), wearSet: true, outfit: 0, char: 0,
    job: id === 'dad' ? { id: 'office', lv: 2, perf: 0, day: 0 } : id === 'mom' ? { id: 'barista', lv: 1, perf: 0, day: 0 } : null,
    energy: 85, food: 75, mood: 70, body: { stress: 15, kg: id.startsWith('kid') ? 30 : 62, awake: 0, injured: 0 },
    sick: null, payMod: null, school: null, grad: m.age >= 18 ? 1 : 0,
  };
}
function swApply(s) {
  for (const k of SW_FIELDS) st[k] = swClone(s[k] === undefined ? null : s[k]);
  st.sk = { ...swBlankSk(), ...(st.sk || {}) };
  st.inv = st.inv || {}; st.wear = st.wear || {};
  if (!st.look) st.look = swLookOf('me') || st.look;
  if (st.job && !JOBS[st.job.id]) st.job = null;      // a job removed by an update must not crash the HUD
}

let meEntCache = null;
function swMeEnt() {
  const S = swState();
  if (S.cur === 'me') return null;
  const r = S.rec && S.rec.me; if (!r) return null;
  if (!meEntCache) {
    const look = r.look || st.look;
    const p = { id: 'me', n: r.name, g: (look && look.g) || 'm', fam: 1, trait: (st.parents && st.parents.trait) || 'kind', look };
    meEntCache = {
      id: 'me', n: r.name, p, label: `ตัวคุณเอง · ${sexFull(p.g)}`,
      spr: sheet(swPal(look, r.wearSet ? (r.wear || {}) : {}, r.outfit || 0, swAge((r.ageShift | 0)))),
      x: 3 * T + 16, y: 5 * T + 16, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0,
      get age() { return swAge((r.ageShift | 0)); },
    };
  }
  return meEntCache;
}

// ---- appearance: a haircut or outfit you change while playing a body stays on that body ----
const swAgeOf = id => {
  if (id === 'me') { const S = swState(); return S.cur === 'me' ? age() : swAge((S.rec.me && S.rec.me.ageShift) | 0); }
  if (id === 'dad' || id === 'mom') return st.parents && st.parents[id] ? parentAge(st.parents[id]) : 0;
  if (id === 'spouse') { const p = spouseP(); return p ? p.age : 0; }
  if (id.startsWith('kid')) { const k = (st.kids || [])[+id.slice(3)]; return k ? kidAge(k) : 0; }
  return 0;
};
const swBaseWear = id => {          // the clothing an NPC already wears, so a repaint does not strip it
  if (id === 'dad' || id === 'mom') { const f = fam.find(x => x.id === id); return f ? npcWear(f, fam.indexOf(f) + 11) : {}; }
  if (id === 'spouse') { const p = spouseP(); return p ? npcWear(p, people.indexOf(p)) : {}; }
  if (id.startsWith('kid')) { const i = +id.slice(3), k = (st.kids || [])[i]; return k ? npcWear({ id: 'kid' + i, g: k.g, age: kidAge(k) }, 300 + i) : {}; }
  return {};
};
function swPal(look, wear, outfit, a, base) {
  const keep = st.wear; st.wear = wear || {};
  const pal = { ...palOf(look || st.look), ...(base || {}), ...(OUTFITS[outfit | 0] || {}), ...wearPal(), bust: (look || st.look).g === 'f' && a >= 18 };
  st.wear = keep;
  return pal;
}
const swEntOf = id => {
  if (id === 'dad' || id === 'mom') return fam.find(x => x.id === id) || null;
  if (id === 'spouse') { const p = spouseP(); return p && p.h ? p : null; }
  if (id.startsWith('kid')) { const k = (st.kids || [])[+id.slice(3)]; return k && typeof kidEnt !== 'undefined' ? kidEnt(k) : null; }
  return null;
};
function swSyncHouse(id) {          // keep the household record in step so portraits and new saves match
  const r = swState().rec[id]; if (!r || !r.look) return;
  const look = swClone(r.look);
  if ((id === 'dad' || id === 'mom') && st.parents && st.parents[id]) st.parents[id].look = look;
  else if (id === 'spouse') { const p = spouseP(); if (p) p.look = look; }
  else if (id.startsWith('kid')) { const k = (st.kids || [])[+id.slice(3)]; if (k) k.look = look; }
}
function swRepaint(id) {
  const r = swState().rec[id]; if (!r) return;
  if (id === 'me') { meEntCache = null; return; }
  const ent = swEntOf(id); if (!ent) return;
  const wear = r.wearSet ? (r.wear || {}) : swBaseWear(id);
  const spr = sheet(swPal(r.look || swLookOf(id), wear, r.outfit || 0, swAgeOf(id)));
  ent.spr = spr;
  if (ent.h) ent.h.spr = spr;
}
function swRepaintAll() {
  const S = swState();
  for (const id of Object.keys(S.rec || {})) if (id !== S.cur) swRepaint(id);
}
const _rebuildSw = rebuildHome;
rebuildHome = () => { _rebuildSw(); swRepaintAll(); };

const swEntIsActive = (e, cur) => {
  if (!e) return false;
  if (cur === 'dad' || cur === 'mom') return e.id === cur;
  if (cur === 'spouse') return !!st.spouse && e.id === st.spouse;
  if (cur.indexOf('kid') === 0) { const k = (st.kids || [])[+cur.slice(3)]; return !!(e.p && e.p.kid) && !!k && e.p.kid === k; }
  return false;
};

// keep the body you are not playing inside the house; the rest of the family stays as usual
const _hfSw = homeFamily;
homeFamily = () => {
  const cur = swState().cur, out = _hfSw().filter(e => !swEntIsActive(e, cur)), me = swMeEnt();
  if (me) out.push(me);
  return out;
};

// the parked body is a person you can walk up to and switch back with
const _poSw = personOpts;
personOpts = p => p.id === 'me'
  ? [['🔄 สลับกลับมาเป็นตัวเอง', () => swSwitch('me')],
    ['💬 คุยด้วย', () => { say(`${p.n}: "เป็นไงบ้าง? ฉันรออยู่บ้านนะ"`); tick(5); }]]
  : _poSw(p);

// ---- switching ----
function swSwitch(id) {
  if (typeof TS_RUN !== 'undefined' && TS_RUN) return say('กำลังหลับอยู่…');
  if (busy || mg || (typeof ACT !== 'undefined' && ACT)) return say('รอสักครู่นะ');
  const S = swState();
  if (S.cur === id) return say('คุณกำลังเล่นเป็นคนนี้อยู่');
  const m = swMembers().find(x => x.id === id);
  if (!m) return say('สลับเป็นคนนี้ไม่ได้');
  const wasPanel = panelOpen, leaving = S.cur;
  S.rec[S.cur] = swGrab();
  S.rec[S.cur].wearSet = true;
  if (!S.rec[id]) S.rec[id] = swDefault(id, m);
  swApply(S.rec[id]);
  // one household purse: when an adult body is active the parents' share must stay in the wallet
  if (age() >= 18 && (st.famMoney || 0) > 0) { const f = st.famMoney; st.famMoney = 0; st.money += f; }
  S.cur = id; S.swaps = (S.swaps || 0) + 1;
  swSyncHouse(leaving); swRepaint(leaving);      // the body you leave keeps the haircut/outfit you gave it
  meEntCache = null;
  if (typeof kidEnt !== 'undefined') kidEnt.cache = {};
  closeMenu(); closePanel();
  dressPlayer(); drawHud();
  toast(`🔄 ตอนนี้คุณคือ ${m.n} (${sexFull(m.g)} · ${age()} ปี)`);
  say(`สลับชีวิตเป็น ${m.n} (${sexFull(m.g)}) แล้ว — เปิด 👪 ครอบครัว ในมือถือเพื่อสลับกลับ`);
  save();
  if (wasPanel && typeof phonePanel === 'function') { phonePanel(); pApp = 'fam'; refreshPanel(); }
}

// ---- warp home ----
function warpHome() {
  if (typeof TS_RUN !== 'undefined' && TS_RUN) return say('กำลังหลับอยู่…');
  if (busy || mg || (typeof ACT !== 'undefined' && ACT)) return say('รอสักครู่นะ');
  if (scene === home) { closePanel(); return say('คุณอยู่ที่บ้านแล้ว 🏠'); }
  closePanel(); closeMenu();
  goHome();
  say('🏠 วาปกลับบ้านแล้ว');
  toast('🏠 กลับถึงบ้านในพริบตา');
}

// ---- family paychecks at 18:00 (the spouse is already paid by family.js) ----
function swIncomeTick() {
  if (hour() < 18) return;
  const S = swState(), items = [];
  for (const m of swMembers()) {
    if (m.id === 'me' || m.id === S.cur || m.id === 'spouse') continue;
    const w = swWage(m); if (!w) continue;
    if (S.pay[m.id] === day()) continue;
    S.pay[m.id] = day();
    items.push({ id: m.id, n: m.n, pay: w });
  }
  if (!items.length) return;
  const total = items.reduce((a, i) => a + i.pay, 0);
  fx({ money: total });
  S.earned = (S.earned || 0) + total;
  S.last = { d: day(), total, items };
  toast(`🏠 ครอบครัวกลับจากทำงาน — ${items.map(i => `${i.n} ฿${i.pay}`).join(' · ')}`);
  save();
}
const _seasonSw = seasonTick;
seasonTick = () => {
  // playing as the spouse replaces their NPC paycheck with actually working shifts
  if (swState().cur === 'spouse' && st.spouse) st.spousePay = day();
  _seasonSw(); swGuard() && save(); swIncomeTick();
};

// if the body you were playing is gone (died, moved out, save moved on) fall back to your own life
function swGuard() {
  const S = swState();
  if (S.cur === 'me' || swMembers().some(m => m.id === S.cur)) return false;
  S.cur = 'me';
  if (S.rec.me) swApply(S.rec.me);
  meEntCache = null; dressPlayer();
  if (typeof drawHud === 'function') drawHud();
  toast('🔄 กลับมาเป็นตัวเองแล้ว');
  return true;
}

// ---- phone app ----
const swMemberLook = (S, m) => {
  if (m.id === 'me') return (S.cur === 'me' ? st.look : (S.rec.me && S.rec.me.look)) || st.look;
  return swLookOf(m.id) || st.look;
};
const swMemberIcon = (S, m) => {
  try {
    const r = S.rec[m.id], on = m.id === S.cur;
    const wear = on ? st.wear : (r && r.wearSet ? r.wear : swBaseWear(m.id));
    const outfit = on ? st.outfit : (r && r.outfit);
    return thumb(sheet(swPal(swMemberLook(S, m), wear, outfit, m.age)));
  } catch (e) { return m.icon; }
};
function famApp() {
  const S = swState(), out = [], mem = swMembers();
  const atHome = homeFamily().map(e => e.n).filter(Boolean);
  out.push(el('div', { className: 'sub' }, `ตอนนี้คุณคือ ${st.name} · ${sexFull(st.look?.g)} · อายุ ${age()} ปี · เงินบ้าน ฿${st.money}`));
  out.push(el('div', { className: 'sub' }, `🏠 อยู่บ้านตอนนี้: ${atHome.length ? atHome.join(', ') : 'ไม่มีใครอยู่'} · สมาชิก ${mem.length} คน`));
  out.push(el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' },
    btn('🏠 วาปกลับบ้าน (ฟรี)', warpHome),
    btn('👚 เปลี่ยนชุด/ทรงผม', () => {
      if (scene !== home) return say('กลับบ้านก่อนแล้วเปิดตู้เสื้อผ้าได้เลย — วาปกลับบ้านฟรี');
      closePanel(); wardrobePanel('closet');
    }),
    ...(S.cur !== 'me' ? [btn('🔄 กลับมาเป็นตัวเอง', () => swSwitch('me'))] : [])));
  out.push(el('div', { className: 'sec' }, '👪 สลับชีวิต'));
  for (const m of mem) {
    const on = m.id === S.cur, w = swWage(m);
    const job = m.id === 'me' && m.job ? ` · ${JOBS[m.job.id] ? JOBS[m.job.id].titles[(m.job.lv | 0)] : 'งาน'}` : '';
    const sub = `${m.role}${w ? ` · ฿${w}/วัน` : job}${on ? ' · กำลังเล่นอยู่' : ''}`;
    out.push(row(swMemberIcon(S, m), `${m.n} · ${sexIcon(m.g)} ${sexFull(m.g)} · ${m.age} ปี`, sub, btn(on ? 'กำลังเล่น' : 'สลับเป็น', () => swSwitch(m.id), on)));
  }
  out.push(el('div', { className: 'sec' }, '💼 รายได้ครอบครัว'));
  out.push(el('div', { className: 'sub' }, S.last
    ? `ครั้งล่าสุด วันที่ ${S.last.d} · +฿${S.last.total} (${S.last.items.map(i => i.n).join(', ')})`
    : 'ยังไม่มีรายได้ — คนที่คุณไม่ได้เล่นจะกลับบ้านตอน 18:00'));
  out.push(el('div', { className: 'sub' }, `รวมที่ครอบครัวหาได้ ฿${S.earned || 0} · เงินทุกคนเข้ากระเป๋าบ้านเดียวกัน`));
  out.push(el('div', { className: 'sub' }, 'สกิล กระเป๋าของ และชุดแยกกันตามคน — สลับแล้วได้ของใช้ของคนนั้น'));
  out.push(el('div', { className: 'sub' }, '💇 ทรงผม ชุด และสีย้อมจะติดอยู่กับคนนั้น — สลับกลับมาหรือโหลดเซฟใหม่ก็ยังเหมือนเดิม'));
  if (S.cur !== 'me') out.push(el('div', { className: 'sub' }, 'ตัวละครเดิมของคุณรออยู่ที่บ้าน — เดินไปคุยหรือสลับกลับได้ตลอด'));
  return out;
}
APP.fam = famApp;
APPS.push(['fam', '👪', 'ครอบครัว']);

// ---- start hook, torch, achievements ----
const _startSw = start;
start = saved => {
  _startSw(saved);
  if (st.ageShift0 == null) st.ageShift0 = st.ageShift;
  const S = swState(); if (!S.rec) S.rec = {};
  meEntCache = null;
  if (typeof kidEnt !== 'undefined') kidEnt.cache = {};
  swGuard();
  swRepaintAll();
  dressPlayer(); if (typeof drawHud === 'function') drawHud();
};
const _torchSw = passTorch;
passTorch = k => {
  if (swState().cur !== 'me') return say('สลับกลับมาเป็นตัวเองก่อน แล้วค่อยส่งไม้ต่อให้คนรุ่นใหม่');
  _torchSw(k);
  st.famSw = null; st.ageShift0 = st.ageShift; meEntCache = null;
};

ACH.push(['swap', '👪 ชีวิตเดียวกัน', 'สลับชีวิตเป็นคนในครอบครัวครั้งแรก', () => (swState().swaps || 0) > 0]);

console.assert(typeof swSwitch === 'function' && typeof warpHome === 'function' && swMembers().length >= 1, 'family swap ready');
