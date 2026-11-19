'use strict';
// The family food stall: cook at home, then carry the dishes to a little stall on the town plaza and
// sell them to townsfolk. A family member can work the counter with you — better prices, more
// customers, and a 20% cut for them. Customers are limited per day, so a session is short:
// cook a batch, walk to the plaza, sell it, go home. All state lives in `st.famShop` (lazy, so old
// saves keep working) and the 👪 app shows today's tally.

const FS = { x: 20 * T + 16, y: 8 * T + 22, name: '🧺 ซุ้มอาหารครอบครัว' };
const FS_OPEN = [9, 21];                                   // the stall trades 09:00–21:00
const fsIsFamily = id => !!id && (id === 'dad' || id === 'mom' || id === 'spouse' || /^sib\d+$/.test(id));
const fsState = () => (st.famShop || (st.famShop = { d: 0, sold: 0, today: 0, total: 0, best: 0, days: 0, rep: 0, helper: '', helpEarn: 0, helpedDay: 0 }));
function fsToday() {
  const S = fsState();
  if (S.d !== day()) {
    if (S.sold > 0) { S.days = (S.days || 0) + 1; if (S.today > (S.best || 0)) S.best = S.today; }
    S.d = day(); S.sold = 0; S.today = 0;
  }
  return S;
}
const fsOpen = () => hour() >= FS_OPEN[0] && hour() < FS_OPEN[1];
const fsMembers = () => (typeof swMembers === 'function' ? swMembers() : []).filter(m => m.id !== 'me' && fsIsFamily(m.id));
const fsHelper = () => { const S = fsToday(); return S.helper ? fsMembers().find(m => m.id === S.helper) || null : null; };
function fsBonus() {
  const m = fsHelper();
  if (!m) return { cap: 0, mul: 1, busy: false };
  if (!fsFree(m.id)) return { cap: 0, mul: 1, busy: true };      // at work or at school: no counter bonus
  if (m.id === 'mom' || m.id === 'spouse') return { cap: 1, mul: 1.12, busy: false };   // knows the kitchen
  if (m.id === 'dad') return { cap: 1, mul: 1.06, busy: false };
  if ((m.age || 0) < 18) return { cap: 2, mul: 1.04, busy: false };                    // runs around for customers
  return { cap: 2, mul: 1.08, busy: false };
}
// A helper can only stand at the stall when their own day allows it — home, the plaza or the park.
// Uses the person's schedule rather than the on-screen entity, so it is right from any scene.
function fsFree(id) {
  const e = typeof fam !== 'undefined' && fam.find(p => p.id === id);
  return !!e && ['in', 'home', 'plaza', 'park'].includes(typeof slotOf === 'function' ? slotOf(e) : e.slot);
}
const fsOnDuty = () => { const h = st.famShop && st.famShop.helper; return !!h && fsFree(h); };
function fsCap() {
  const S = fsToday();
  let n = 4 + Math.floor(lv('charm') / 2) + fsBonus().cap + Math.floor((S.rep || 0) / 20);
  if (typeof wet === 'function' && wet()) n -= 2;                          // rain keeps the plaza quiet
  if (typeof festOn === 'function' && festOn()) n += 2;                    // festivals are gold
  return Math.max(2, Math.min(12, n));
}
const fsLeft = () => Math.max(0, fsCap() - (fsToday().sold || 0));
function fsPrice(id) {
  const base = (typeof BIZ !== 'undefined' && BIZ.cafe.value[id]) || (ITEMS[id] && ITEMS[id].sell) || 30;
  const S = fsToday();
  const q = 1 + Math.min(.3, lv('cook') * .03) + Math.min(.1, (S.rep || 0) / 500);
  return Math.max(5, Math.round(base * q * fsBonus().mul));
}

// ---- selling ----
function fsSell(id, want) {
  if (!fsOpen()) return say(`ซุ้มเปิด ${FS_OPEN[0]}:00–${FS_OPEN[1]}:00 น. — ตอนนี้ปิดอยู่`);
  if (!ITEMS[id] || ITEMS[id].k !== 'dish') return;
  const S = fsToday(), left = fsLeft();
  if (left <= 0) return say('ลูกค้าวันนี้ครบแล้ว — พรุ่งนี้เปิดซุ้มใหม่นะ');
  const n = Math.min(want | 0, have(id), left);
  if (n <= 0) return say('ไม่มีจานนี้ให้ขายแล้ว');
  const price = fsPrice(id), gross = price * n, cut = Math.round(gross * .2);
  const h = fsBonus().busy ? null : fsHelper();
  addItem(id, -n);
  fx({ money: gross - cut, energy: -n, mood: Math.min(8, 2 * n) });
  xp('charm', 2 * n);
  tick(6 * n);
  S.sold += n; S.today += gross; S.total += gross; S.rep = Math.min(100, (S.rep || 0) + n);
  if (h) {
    S.helpEarn = (S.helpEarn || 0) + cut;
    const r = relOf(h.id); r.f = Math.min(100, (r.f || 0) + n);
    if (S.helpedDay !== day()) { S.helpedDay = day(); if (typeof remember === 'function') remember(h.id, 'stall', 1, 'ช่วยขายที่ซุ้มอาหาร'); }
  }
  const pool = (typeof PEOPLE !== 'undefined' ? PEOPLE : []).filter(p => p && p.n);
  const c = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  const praise = n > 1 ? ['ยกนิ้วให้เลย!', 'อร่อยจนต้องสั่งเพิ่ม', 'กลิ่นหอมลอยไปทั้งลาน'][Math.floor(Math.random() * 3)] : 'ยิ้มแล้วเดินจากไป';
  say(`${c ? c.n : 'ลูกค้า'} สั่ง ${ITEMS[id].n} ×${n} — ${praise} ได้ ฿${gross - cut}${h ? ` (แบ่งให้ ${h.n} ฿${cut})` : ''} 🧺`);
  if (typeof drawHud === 'function') drawHud();
  save(); refreshPanel();
}

// ---- panels ----
function fsHelperPanel() {
  const S = fsToday();
  openPanel('🤝 ชวนใครมาช่วยซุ้ม', () => {
    const mem = fsMembers();
    return [el('div', { className: 'sub' }, 'คนช่วยทำให้ขายได้ราคาดีขึ้นและมีลูกค้าเพิ่ม แต่จะได้ส่วนแบ่ง 20% ของยอดขาย'),
      ...(mem.length ? mem.map(m => row(m.icon, m.n, `${m.role || 'ครอบครัว'}${S.helper === m.id ? ' · กำลังช่วยอยู่' : ''} · ${fsFree(m.id) ? 'ว่าง' : 'ทำงานอยู่'}`,
        btn(S.helper === m.id ? 'คนนี้อยู่' : 'ให้ช่วย', () => { S.helper = m.id; save(); toast(`${m.n} มาช่วยที่ซุ้มแล้ว 🧺`); fsPanel(); }, S.helper === m.id))) : [el('div', { className: 'sub' }, 'ไม่มีคนในบ้านที่ว่างพอจะมาช่วย')]),
      row('🧍', 'ขายคนเดียว', 'ไม่มีส่วนแบ่ง แต่ราคาและจำนวนลูกค้าจะน้อยกว่า', btn('เลือก', () => { S.helper = ''; save(); fsPanel(); }))];
  });
}
function fsPanel() {
  openPanel(FS.name, () => {
    const S = fsToday(), B = fsBonus(), cap = fsCap(), left = fsLeft(), h = fsHelper();
    const dishes = Object.keys(st.inv || {}).filter(id => ITEMS[id] && ITEMS[id].k === 'dish' && have(id) > 0);
    return [
      el('div', { className: 'sub' }, `ทำอาหารที่เตาในบ้านก่อน แล้วเอามาขายที่นี่ — เปิด ${FS_OPEN[0]}:00–${FS_OPEN[1]}:00 น. ลูกค้าวันละจำกัด`),
      el('div', { className: 'money' }, `วันนี้ ฿${S.today} · ขาย ${S.sold} จาน · ลูกค้าเหลือ ${left}/${cap}`),
      el('div', { className: 'sec' }, '🤝 คนช่วย'),
      row(h ? h.icon : '🧍', h ? `${h.n} · ${(h.role || 'ครอบครัว').split(' · ')[0]}` : 'ยังไม่มีคนช่วย',
        !h ? 'ชวนคนในบ้านมาช่วย — ขายได้ราคาดีกว่าและมีลูกค้าเพิ่ม'
          : B.busy ? 'กำลังทำงานอยู่ — โบนัสคนช่วยจะกลับมาตอนเย็นหรือวันหยุด'
            : `ราคา +${Math.round((B.mul - 1) * 100)}% · ลูกค้า +${B.cap} · แบ่งยอดขาย 20%`,
        btn(h ? 'เปลี่ยน' : 'ชวนคนในบ้าน', fsHelperPanel)),
      el('div', { className: 'sec' }, '🍱 อาหารในกระเป๋า'),
      ...(dishes.length ? dishes.map(id => {
        const p = fsPrice(id), n = have(id), can = Math.min(n, left);
        return row(ITEMS[id].ic, ITEMS[id].n, `฿${p}/จาน · มี ${n} จาน · ขายได้อีก ${can} จาน`,
          btn('ขาย 1', () => fsSell(id, 1), !can), btn('ขายหมด', () => fsSell(id, n), !can));
      }) : [el('div', { className: 'sub' }, 'ยังไม่มีอาหารที่ทำเอง — กลับไปทำที่เตาก่อน แล้วค่อยกลับมา')]),
      btn('🏠 กลับบ้านไปทำอาหาร', () => { closePanel(); goHome(); }),
      el('div', { className: 'sec' }, '📊 สรุปซุ้ม'),
      el('div', { className: 'sub' }, `ขายดีที่สุด ฿${S.best || 0} · เปิดซุ้ม ${S.days || 0} วัน · ชื่อเสียง ${S.rep || 0}/100`),
      el('div', { className: 'sub' }, `รวมทั้งหมด ฿${S.total || 0} · แบ่งให้ครอบครัวแล้ว ฿${S.helpEarn || 0}`),
    ];
  });
}

// ---- the stall in the plaza ----
function fsDraw() {
  const x = FS.x, y = FS.y, open = fsOpen(), a = '#e8a03a', b = '#fff4e8', t = now() / 700;
  R('#0003', x - 16, y - 2, 32, 5);
  for (let dx = -16; dx < 16; dx += 8) {
    R(dx < 0 ? a : b, x + dx, y - 28, 8, 9);
    R(dx < 0 ? b : a, x + dx, y - 19, 8, 2);
  }
  R('#8a5a3a', x - 14, y - 17, 28, 14); R('#a8744a', x - 13, y - 16, 26, 3); R('#6a3a24', x - 14, y - 5, 28, 2);
  R('#5a3a24', x - 16, y - 30, 2, 28); R('#5a3a24', x + 14, y - 30, 2, 28);
  R('#f4e0a0', x - 9, y - 35, 18, 7); R('#8a5a3a', x - 9, y - 29, 18, 1); R('#c8402e', x - 5, y - 33, 10, 3);
  for (let k = 0; k < 4; k++) R(['#e87a3a', '#ffe14a', '#7ee07e', '#e87a9a'][k], x - 11 + k * 6, y - 11, 4, 3);
  if (!open) return;
  if (fsOnDuty()) {                                    // your helper works the counter
    const hx = x + 2;
    R('#3a2a3a', hx - 4, y - 22, 8, 11); R('#f2c84a', hx - 4, y - 22, 8, 3); R('#3a2a22', hx - 3, y - 11, 3, 6); R('#3a2a22', hx + 1, y - 11, 3, 6);
    disc(hx, y - 26, 4, '#f7cfa6'); R('#4a2a1e', hx - 5, y - 29, 10, 2);
  }
  for (let i = 0; i < 3; i++) {                         // steam from the pots
    const yy = y - 22 - ((t * 6 + i * 7) % 14);
    R('#ffffff55', x - 7 + i * 6, yy, 2, 3);
  }
}

// The plaza stall: sell dishes during opening hours.
town.targets.push({
  x: FS.x, y: FS.y, name: FS.name,
  get opts() {
    return [[fsOpen() ? '🧺 เปิดซุ้มขายอาหาร' : `⏰ ซุ้มปิด (เปิด ${FS_OPEN[0]}:00–${FS_OPEN[1]}:00)`,
      () => fsOpen() ? fsPanel() : say(`ซุ้มเปิด ${FS_OPEN[0]}:00–${FS_OPEN[1]}:00 น. — ตอนนี้ยังปิดอยู่`) ]];
  },
});
town.statics.push({ k: FS.y, f: fsDraw });

// cooking now feeds the stall: mention it in the stove panel, before the recipe list
const _cookPanelFS = cookPanel;
cookPanel = tier => {
  _cookPanelFS(tier);
  const body = panelEl.querySelector('.body');
  if (body) body.append(el('div', { className: 'sub' }, '🍱 ทำเสร็จแล้วเอาไปขายที่ซุ้มอาหารกลางลานเมืองได้ — ลูกค้าจ่ายมากกว่าขายในกระเป๋า'));
};

// ---- family app section ----
function fsRows() {
  const S = fsToday(), h = fsHelper(), B = fsBonus();
  return [
    el('div', { className: 'sec' }, '🧺 ซุ้มอาหารครอบครัว'),
    el('div', { className: 'sub' }, `ทำอาหารที่บ้าน → เอาไปขายที่ซุ้มกลางลานเมือง (${FS_OPEN[0]}:00–${FS_OPEN[1]}:00) ลูกค้าวันละจำกัด`),
    row('🤝', h ? `คนช่วย: ${h.n}` : 'คนช่วย: ยังไม่มี',
      !h ? 'ชวนคนในบ้านได้ที่ซุ้ม — ราคาดีขึ้น ลูกค้าเพิ่ม'
        : B.busy ? 'กำลังทำงาน — โบนัสกลับมาตอนเย็น/วันหยุด'
          : `ราคา +${Math.round((B.mul - 1) * 100)}% · ลูกค้า +${B.cap} · แบ่ง 20%`),
    row('💰', `วันนี้ ฿${S.today || 0}`, `ขาย ${S.sold || 0} จาน · ลูกค้าเหลือ ${fsLeft()}/${fsCap()}`),
    row('🏆', `ขายดีที่สุด ฿${S.best || 0}`, `เปิดซุ้ม ${S.days || 0} วัน · รวม ฿${S.total || 0} · ชื่อเสียง ${S.rep || 0}/100`),
  ];
}
const _appFamFS = APP.fam;
APP.fam = () => [..._appFamFS(), ...fsRows()];

// ---- new looks: an apron top plus one new cut for each gender ----
Object.assign(TOPFX, {
  apron: (p, x, w) => {                    // light bib apron with a pocket and shoulder straps
    R('#f4f8fa', x + 2, 18, w - 4, 8);
    R(shade(p.a, -10), x + 3, 21, w - 6, 3);
    R(p.a, 9, 16, 2, 3); R(p.a, 13, 16, 2, 3);
    R(p.a, x + 1, 25, w - 2, 1); R(p.C, 10, 24, 4, 1);
  },
});
addItems('top', [['apron', 'ผ้ากันเปื้อน', 80]], 3);

Object.assign(HX, {
  quiff: (p, v, s) => {                    // short: volume swept up and off the forehead
    if (v === 'back') { R(p.h, 6, 6, 12, 4); R(p.H, 6, 10, 12, 1); R(p.L, 8, 5, 6, 1); return; }
    if (s) { R(p.h, 7, 3, 8, 5); R(p.H, 5, 7, 4, 2); R(p.L, 9, 2, 5, 1); return; }
    R(p.h, 6, 4, 12, 4); R(p.H, 6, 8, 12, 1); R(p.L, 8, 3, 8, 1); R(p.h, 5, 7, 2, 3); R(p.h, 17, 7, 2, 3);
  },
  lowbun: (p, v, s) => {                   // long: knot gathered at the nape
    if (v === 'back') { disc(12, 15, 3, p.h); R(p.H, 10, 18, 4, 1); R(RED, 11, 13, 2, 1); return; }
    if (s) { disc(5, 14, 2, p.h); R(RED, 5, 12, 2, 1); R(p.h, 11, 8, 6, 2); return; }
    R(p.h, 4, 10, 2, 6); R(p.H, 17, 10, 2, 6); R(p.h, 17, 15, 3, 3); R(RED, 18, 14, 2, 1);
  },
});
HAIR_G.m.push('quiff'); HAIR_G.f.push('lowbun');
HAIR_SET.m.add('quiff'); HAIR_SET.f.add('lowbun');
HX_STYLE.quiff = 'short'; HX_STYLE.lowbun = 'long';
HAIRSTYLES.push(
  { id: 'quiff', n: 'เสยเปิดหน้าผาก', style: 'short', hx: 'quiff', price: 150 },
  { id: 'lowbun', n: 'เกล้าต่ำ', style: 'long', hx: 'lowbun', price: 150 });
CREATOR_HAIR.push({ id: 'quiff', n: 'เสยเปิดหน้าผาก', style: 'short', hx: 'quiff' }, { id: 'lowbun', n: 'เกล้าต่ำ', style: 'long', hx: 'lowbun' });
if (typeof HAIRX !== 'undefined') HAIRX.push(HAIRSTYLES[HAIRSTYLES.length - 2], HAIRSTYLES[HAIRSTYLES.length - 1]);

console.assert(typeof fsSell === 'function' && typeof fsPanel === 'function' && HAIR_G.m.includes('quiff'), 'family stall ready');
