'use strict';
// Birth status and social class. Every life starts somewhere: the family you are born into sets
// your starting money, home, furniture, education and how townsfolk treat you. Status can rise or
// fall later with what you build, and the town tracks the class mix of all its residents.
//
// Layers:
//   - 5 classes: ยากจน / พออยู่พอกิน / ชั้นกลาง / มีฐานะ / ร่ำรวย
//   - player: birth class picked in the creator, current class recomputed daily from assets
//   - NPC: deterministic class from role plus a stable per-person roll
//   - town: class distribution, inequality index and an equality city stat for mayor.js

const CLS = [
  { id: 0, key: 'poor', n: 'ยากจน', ic: '🥣', col: '#c88a4a', cash: 120, fam: 0, home: 0, furn: 'poor', rel: -5, xp: .12, pay: 0, tag: 'เริ่มด้วยเงินน้อย แต่ได้แรงฮึดและค่าครองชีพถูก' },
  { id: 1, key: 'low', n: 'พออยู่พอกิน', ic: '🪙', col: '#a8b06a', cash: 650, fam: 250, home: 0, furn: 'basic', rel: -2, xp: .06, pay: 0, tag: 'ชีวิตเรียบง่าย ต้องประหยัดและวางแผน' },
  { id: 2, key: 'mid', n: 'ชั้นกลาง', ic: '🏠', col: '#7ab0d8', cash: 1400, fam: 900, home: 0, furn: 'basic', rel: 0, xp: 0, pay: 0, tag: 'สมดุลระหว่างโอกาสและความมั่นคง' },
  { id: 3, key: 'high', n: 'มีฐานะ', ic: '🏡', col: '#9a7ae0', cash: 3200, fam: 2000, home: 1, furn: 'good', rel: 4, xp: -.04, pay: .03, tag: 'บ้านใหญ่ขึ้นและของดีขึ้น แต่ค่าครองชีพสูง' },
  { id: 4, key: 'rich', n: 'ร่ำรวย', ic: '💎', col: '#e8c85a', cash: 8500, fam: 5500, home: 2, furn: 'lux', rel: 8, xp: -.08, pay: .06, tag: 'เริ่มด้วยทุนมหาศาล แต่คนคาดหวังสูงและใช้จ่ายแพง' },
];
const CLS_SHIFT_UP = [4000, 12000, 30000, 60000];       // net assets above the starting point needed for +1..+4 steps
const CLS_SHIFT_DOWN = [-3000, -10000, -25000];         // and below the starting point for -1..-3 steps

const clsClamp = v => Math.max(0, Math.min(4, v | 0));
const clsOf = id => CLS[clsClamp(id)];
const clsHash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h / 9973; };
const npcClassId = p => {
  const base = { student: 2, worker: 2, barista: 1, clerk: 1, freelance: 2, athlete: 2, shopkeeper: 4, retiree: 1 }[p.role] ?? 2;
  const h = clsHash(String(p.id || p.n || 'x'));
  return clsClamp(base + (h < .2 ? -1 : h > .84 ? 1 : 0));
};
const npcClass = p => clsOf(npcClassId(p));
const npcBornId = p => { const h = clsHash('b' + (p.id || p.n || 'x')); return h < .2 ? 0 : h < .5 ? 1 : h < .8 ? 2 : h < .95 ? 3 : 4; };
const npcBorn = p => clsOf(npcBornId(p));

function clsState() {
  if (!st.cls) {
    // Old saves: treat the current assets as the starting point so nobody is punished by the update.
    const base = classAssets(), born = base >= 20000 ? 4 : base >= 10000 ? 3 : base >= 3500 ? 2 : base >= 900 ? 1 : 0;
    st.cls = { born, id: born, best: born, base, since: day(), d: 0, hist: [], met: {}, line: 0 };
  }
  const C = st.cls;
  if (!Number.isFinite(C.base)) C.base = classAssets();
  if (!Number.isFinite(C.born)) C.born = 2;
  if (!Number.isFinite(C.id)) C.id = C.born;
  if (!Number.isFinite(C.best)) C.best = C.id;
  if (!Number.isFinite(C.since)) C.since = day();
  if (!Number.isFinite(C.d)) C.d = 0;
  if (!Array.isArray(C.hist)) C.hist = [];
  if (!C.met) C.met = {};
  if (!Number.isFinite(C.line)) C.line = 0;
  return C;
}
const homeValue = () => HOME_SIZES[st.homeLv] ? HOME_SIZES[st.homeLv][2] : 0;
const furnValue = () => st.furn.reduce((n, f) => n + (FURN[f.id]?.price || 0), 0);
const skillValue = () => Object.values(st.sk || {}).reduce((a, b) => a + b, 0);
function classAssets() {
  const cash = typeof cashOwn === 'function' ? cashOwn() : st.money;
  return Math.max(0, Math.round(cash + (typeof famMoney === 'function' ? famMoney() : 0) + homeValue() + furnValue() * .5 + skillValue() * .5));
}
function clsShift(delta) {
  if (delta < 0) return delta <= CLS_SHIFT_DOWN[2] ? -3 : delta <= CLS_SHIFT_DOWN[1] ? -2 : delta <= CLS_SHIFT_DOWN[0] ? -1 : 0;
  let s = 0; for (let i = 0; i < CLS_SHIFT_UP.length; i++) if (delta >= CLS_SHIFT_UP[i]) s = i + 1;
  return s;
}
function classNow() { const C = clsState(); return clsOf(C.born + clsShift(classAssets() - C.base)); }
const classDelta = () => classAssets() - clsState().base;

// ---- furniture sets: same layout as DEFAULT_FURN, upgraded in place so nothing overlaps ----------
function classFurn(kind) {
  const out = DEFAULT_FURN.map(([id, x, y]) => ({ id, x, y }));
  const swap = (a, b) => { const f = out.find(f => f.id === a); if (f) f.id = b; };
  const drop = id => { const i = out.findIndex(f => f.id === id); if (i >= 0) out.splice(i, 1); };
  const add = (id, x, y) => out.push({ id, x, y });
  if (kind === 'poor') { drop('tv1'); drop('plant'); drop('rug'); drop('lamp'); drop('tub'); }
  if (kind === 'good' || kind === 'lux') { swap('bed1', 'bed2'); swap('sofa1', 'sofa2'); add('lamp', 3, 4); add('fern', 2, 7); }
  if (kind === 'lux') { swap('bed2', 'bed3'); swap('tv1', 'tv2'); swap('pc1', 'pc2'); swap('stove1', 'stove2'); add('piano', 2, 6); add('aquarium', 7, 6); add('teddy', 0, 4); }
  return out;
}
function clsApplyBirth(id) {
  const c = clsOf(id);
  st.money = c.cash; st.famMoney = c.fam;
  st.homeLv = c.home; st.furn = classFurn(c.furn);
  st.inv = { egg: 2, rice: 2, veg: 2 };
  if (c.id >= 3) { st.inv.coffee = 2; st.sk.logic = 20; }
  if (c.id >= 4) { st.inv.cake = 1; st.sk.logic = 40; st.sk.art = 20; }
  if (c.id <= 1) st.sk.fit = 20;                       // grit: harder start, stronger body
  st.cls = { born: c.id, id: c.id, best: c.id, base: 0, since: day(), d: 0, hist: [], met: {}, line: 0, upkeep: 0, welfare: 0 };
  st.cls.base = classAssets();
  return c;
}
var BIRTH_PICK = 2;

// ---- daily status movement ------------------------------------------------------------------------
function clsDaily() {
  const C = clsState(); if (C.d === day()) return; C.d = day();
  // lifestyle costs and the welfare safety net (Phase 7 crossover)
  const upkeep = [0, 0, 0, 25, 70][C.id] || 0;
  if (upkeep) { const paid = Math.min(st.money, upkeep); st.money -= paid; C.upkeep = (C.upkeep || 0) + paid; }
  if (C.id <= 1 && activePolicies().some(p => p.id === 'welfare')) { st.money += 15; C.welfare = (C.welfare || 0) + 15; }
  const now = classNow();
  if (now.id === C.id) return;
  const up = now.id > C.id, from = C.id;
  C.id = now.id; C.best = Math.max(C.best, now.id); C.since = day();
  C.hist.unshift({ d: day(), from, to: now.id });
  if (C.hist.length > 10) C.hist.length = 10;
  fx({ mood: up ? 8 : -8 });
  toast(up ? `🏅 ฐานะของคุณขยับขึ้นเป็น ${now.ic} ${now.n}!` : `📉 ฐานะของคุณลดลงเป็น ${now.ic} ${now.n}`);
  if (typeof townNews === 'function') townNews(up ? `🏅 ${st.name} ขยับฐานะขึ้นเป็น${now.n}` : `📉 ฐานะของ ${st.name} ลดลง`);
  save();
}

// ---- NPC first impressions: people notice class ---------------------------------------------
function clsMeet(p) {
  const C = clsState(); if (C.met[p.id]) return; C.met[p.id] = 1;
  const gap = C.id - npcClassId(p), r = relOf(p.id);
  if (gap >= 2) { r.f = Math.max(0, r.f - 2); r.h = Math.min(100, (r.h || 0) + 2); }      // old money looks down
  else if (gap <= -2) r.f = Math.min(100, r.f + 3);                                        // solidarity
  else if (gap === 0) r.f = Math.min(100, r.f + 1);                                        // same class
}
const _poCls = personOpts;
personOpts = p => {
  const out = _poCls(p);
  if (p.fam || st.gone?.[p.id]) return out;
  return out.map(o => o[0] === 'คุยด้วย' ? [o[0], () => { clsMeet(p); o[1](); }, ...o.slice(2)] : o);
};

// ---- town-wide class picture ------------------------------------------------------------------
function clsSplit() {
  const split = [0, 0, 0, 0, 0];
  for (const p of PEOPLE) if (!st.gone?.[p.id]) split[npcClassId(p)]++;
  if (st.look) split[clsState().id]++;
  return split;
}
function inequality() {
  const vals = [];
  for (const p of PEOPLE) if (!st.gone?.[p.id]) vals.push([120, 900, 2200, 6000, 16000][npcClassId(p)]);
  vals.push(Math.max(50, classAssets()));
  if (vals.length < 2) return 0;
  vals.sort((a, b) => a - b);
  const n = vals.length, sum = vals.reduce((a, b) => a + b, 0);
  if (!sum) return 0;
  let g = 0; for (let i = 0; i < n; i++) g += (2 * (i + 1) - n - 1) * vals[i];
  return Math.max(0, Math.min(100, Math.round(g / (n * sum) * 100)));
}
function equalityScore() {
  const base = typeof stat === 'function' ? _statCls('equality') : 40;   // civic effects only
  return townClamp(base + 24 - inequality() * .32);
}
const _statCls = stat;
stat = k => k === 'equality' ? equalityScore() : _statCls(k);
STATS.equality = '⚖️ ความเท่าเทียม';

// equality projects and policies (Phase 7 crossover)
PROJECTS.housing = { n: '🏘️ บ้านจัดสรรราคาถูก', cost: 1400, days: 6, effects: { equality: 14, happiness: 4 } };
POLICIES.community.push({ id: 'welfare', n: 'สวัสดิการชุมชน', cost: 600, upkeep: 30, effects: { equality: 12, happiness: 3 }, desc: 'ลดช่องว่างทางฐานะของชาวเมือง' });

// class changes the player's long-term multipliers
const _xpCls = xpMul; xpMul = s => _xpCls(s) * (1 + clsOf(clsState().id).xp);
const clsPayMul = () => 1 + clsOf(clsState().id).pay;

// ---- UI: creator picker, profile rows, hall section, phone app -------------------------------------
{
  const frm = document.querySelector('#creator .frm');
  if (frm) {
    const desc = el('div', { className: 'sub', style: 'min-height:18px;font-size:13px;line-height:1.4' });
    const opts = el('div', { className: 'opts' });
    const paint = () => {
      [...opts.children].forEach((b, i) => { b.className = i === BIRTH_PICK ? 'on' : ''; b.style.borderColor = i === BIRTH_PICK ? CLS[i].col : ''; });
      desc.textContent = `${CLS[BIRTH_PICK].tag} · เริ่มต้น ฿${CLS[BIRTH_PICK].cash.toLocaleString()}${CLS[BIRTH_PICK].home ? ' · บ้านใหญ่ขึ้น' : ''}`;
    };
    CLS.forEach((c, i) => opts.append(el('button', { textContent: `${c.ic} ${c.n}`, onclick: () => { BIRTH_PICK = i; paint(); } })));
    paint();
    const anchor = frm.querySelector('.err') || null;
    frm.insertBefore(el('label', {}, 'ฐานะครอบครัวตอนเกิด'), anchor);
    frm.insertBefore(opts, anchor);
    frm.insertBefore(desc, anchor);
  }
}

const _famRowsCls = familyRows;
familyRows = () => {
  const C = clsState(), born = clsOf(C.born), now = clsOf(C.id);
  return [..._famRowsCls(), row(born.ic, `ฐานะครอบครัว: ${born.n}`, `ปัจจุบัน ${now.ic} ${now.n} · ${born.tag}`)];
};
const _relCls = relProfileView;
relProfileView = id => {
  const out = _relCls(id), p = people.find(q => q.id === id);
  if (!p || p.fam || st.gone?.[id]) return out;
  const c = npcClass(p), born = npcBorn(p), mine = clsOf(clsState().id);
  const move = c.id > born.id ? 'ขยับขึ้น' : c.id < born.id ? 'ตกต่ำลง' : 'เท่าเดิม';
  return [...out, row(c.ic, `ฐานะปัจจุบัน: ${c.n}`, `เกิดในครอบครัว${born.n} · ${move} · ฐานะของคุณ: ${mine.n}`)];
};
function clsMobility() {
  let up = 0, down = 0;
  for (const p of PEOPLE) if (!st.gone?.[p.id]) { const d = npcClassId(p) - npcBornId(p); if (d > 0) up++; else if (d < 0) down++; }
  return { up, down };
}
function clsHallRows() {
  const split = clsSplit(), total = split.reduce((a, b) => a + b, 0) || 1, mob = clsMobility();
  return [el('div', { className: 'sec' }, '👥 ชนชั้นทางสังคม'),
    ...CLS.map(c => row(c.ic, `${c.n} — ${split[c.id]} คน`, `${Math.round(split[c.id] / total * 100)}% ของเมือง`,
      el('div', { className: 'bar', style: 'width:120px' }, el('i', { style: `width:${split[c.id] / total * 100}%;background:${c.col}` })))),
    row('🪜', 'การขยับชนชั้นของ NPC', `สูงกว่ากำเนิด ${mob.up} คน · ต่ำกว่ากำเนิด ${mob.down} คน`),
    row('⚖️', 'ความเท่าเทียม', `ดัชนี ${stat('equality')}/100 · ช่องว่างฐานะ ${inequality()}/100`)];
}

const clsBar = (pct, col) => el('div', { className: 'bar', style: 'width:150px' }, el('i', { style: `width:${Math.max(0, Math.min(100, pct))}%;background:${col}` }));
APP.cls = () => {
  const C = clsState(), now = clsOf(C.id), born = clsOf(C.born), delta = classDelta();
  const shift = clsShift(delta), maxed = now.id >= 4 || shift >= 4;
  const nextTarget = maxed ? null : CLS_SHIFT_UP[Math.max(0, shift)];
  const pct = maxed ? 100 : Math.max(0, Math.min(100, delta / nextTarget * 100));
  const rows = [
    el('div', { className: 'sec' }, '🏅 สถานะของคุณ'),
    row(born.ic, `เกิดในครอบครัว${born.n}`, `${born.tag}`),
    row(now.ic, `สถานะปัจจุบัน: ${now.n}`, now.id > C.born ? `ขยับขึ้นจากกำเนิด ${now.id - C.born} ระดับ · ตั้งแต่ দিন ${C.since}` : now.id < C.born ? `ตกต่ำลง ${C.born - now.id} ระดับ · ตั้งแต่ দিন ${C.since}` : `เท่ากับกำเนิด · ตั้งแต่เริ่มชีวิต`),
    maxed ? row('✅', 'ถึงระดับสูงสุดแล้ว', 'รักษาทรัพย์สินและชื่อเสียงไว้') :
      row('📈', `อีก ฿${Math.max(0, nextTarget - delta).toLocaleString()} สู่ ${CLS[now.id + 1] ? CLS[now.id + 1].n : 'ระดับถัดไป'}`, `สินทรัพย์สุทธิเทียบจุดเริ่มต้น ${delta >= 0 ? '+' : ''}฿${delta.toLocaleString()}`, clsBar(pct, now.col)),
    el('div', { className: 'sec' }, '💰 สินทรัพย์ที่นับเข้าฐานะ'),
    row('💵', 'เงินสด', `฿${(typeof cashOwn === 'function' ? cashOwn() : st.money).toLocaleString()}${typeof famMoney === 'function' && famMoney() ? ` · ครอบครัว ฿${famMoney().toLocaleString()}` : ''}`),
    row('🏡', 'บ้าน', HOME_SIZES[st.homeLv] ? `ระดับ ${st.homeLv + 1} · มูลค่า ฿${homeValue().toLocaleString()}` : '—'),
    row('🛋️', 'เฟอร์นิเจอร์', `มูลค่า ฿${furnValue().toLocaleString()} (นับ 50%)`),
    row('🎓', 'ทักษะรวม', `${Math.round(skillValue())} แต้ม (นับ 50%)`),
    el('div', { className: 'sec' }, '✨ ผลของชนชั้น'),
    row('📚', 'การเรียนรู้', now.xp >= 0 ? `XP +${Math.round(now.xp * 100)}% จากความมานะ` : `XP ${Math.round(now.xp * 100)}% เพราะชีวิตสบายเกินไป`),
    row('💼', 'เส้นสายและค่าจ้าง', now.pay > 0 ? `ค่าจ้าง +${Math.round(now.pay * 100)}% จากคอนเน็กชัน` : 'ค่าจ้างปกติ'),
    row('🏠', 'ค่าครองชีพ', now.id >= 3 ? `฿${[0, 0, 0, 25, 70][now.id]}/วัน · จ่ายไปแล้ว ฿${(C.upkeep || 0).toLocaleString()}` : 'ไม่มีค่าครองชีพพิเศษ'),
    ...(now.id <= 1 && activePolicies().some(p => p.id === 'welfare') ? [row('🤝', 'สวัสดิการชุมชน', `+฿15/วัน · รับไปแล้ว ฿${(C.welfare || 0).toLocaleString()}`)] : []),
    el('div', { className: 'sec' }, '🏙️ เมืองและชนชั้น'),
    ...CLS.map(c => row(c.ic, `${c.n} — ${clsSplit()[c.id]} คน`, `${Math.round(clsSplit()[c.id] / Math.max(1, clsSplit().reduce((a, b) => a + b, 0)) * 100)}% ของประชากร`)),
    row('⚖️', 'ความเท่าเทียม', `${stat('equality')}/100 · ช่องว่างฐานะ ${inequality()}/100`),
  ];
  if (C.hist.length) rows.push(el('div', { className: 'sec' }, '📜 ประวัติการขยับชนชั้น'), ...C.hist.slice(0, 6).map(h => row('•', `วันที่ ${h.d}`, `${clsOf(h.from).n} → ${clsOf(h.to).n}`)));
  rows.push(row('🏛️', 'รายงานเมืองฉบับเต็ม', 'ดูโครงการ นโยบาย และงบประมาณ', btn('เปิดศาลากลาง', () => hallPanel())));
  return rows;
};
APPS.push(['cls', '🏅', 'สถานะ']);

ACH.push(['selfmade', '🏅 สร้างตัวเอง', 'ขยับชนชั้นขึ้น 2 ระดับจากกำเนิด', () => clsState().best - clsState().born >= 2],
  ['equal', '⚖️ เมืองเท่าเทียม', 'ดัชนีความเท่าเทียม 65+', () => stat('equality') >= 65]);

// ---- hooks -------------------------------------------------------------------------------------
const _seasonCls = seasonTick; seasonTick = () => { _seasonCls(); clsDaily(); };
const _passCls = passTorch;
passTorch = k => {
  const inherited = classNow().id;
  _passCls(k);
  const c = clsOf(inherited);
  st.cls = { born: c.id, id: c.id, best: c.id, base: 0, since: day(), d: 0, hist: [], met: {}, line: (st.cls?.line || 0) + 1 };
  st.cls.base = classAssets();
  toast(`🏅 รุ่นใหม่เกิดในครอบครัว${c.n} — ฐานะที่ส่งต่อมาคือ ${c.ic}`);
};

// ---- self-checks -------------------------------------------------------------------------------
{
  const overlap = (a, b) => a.x < b.x + FURN[b.id].w && b.x < a.x + FURN[a.id].w && a.y < b.y + FURN[b.id].h && b.y < a.y + FURN[a.id].h;
  for (const kind of ['poor', 'basic', 'good', 'lux']) {
    const fs = kind === 'basic' ? DEFAULT_FURN.map(([id, x, y]) => ({ id, x, y })) : classFurn(kind);
    console.assert(fs.every(f => FURN[f.id]), 'class furniture ids valid', kind);
    for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) {
      const a = fs[i], b = fs[j], A = FURN[a.id], B = FURN[b.id];
      console.assert(!!A.floor !== !!B.floor || !overlap(a, b), 'class furniture overlap', kind, a.id, b.id);
    }
  }
  console.assert(CLS.length === 5 && CLS.every((c, i) => c.id === i), 'five ordered classes');
  console.assert(Object.keys(STATS).includes('equality'), 'equality city stat');
}
