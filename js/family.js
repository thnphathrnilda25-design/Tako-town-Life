'use strict';
// Family life: a dining table for family dinners and parties, birthdays, wedding anniversaries,
// a family hour on the sofa, the spouse's daily paycheck and family summaries in the journal/phone.

const SPOUSE_WAGE = { worker: 140, barista: 95, clerk: 85, freelance: 120, athlete: 130, shopkeeper: 150, retiree: 55, student: 40 };
const famKids = () => st.kids || [];
const famCount = () => famKids().length + (st.spouse ? 1 : 0);
const kidHasBday = k => !!k.n && day() > k.born && (day() - k.born) % YEAR === 0;
const annivToday = () => !!st.spouse && !!st.wedDay && day() > st.wedDay && (day() - st.wedDay) % YEAR === 0;
const myBdayToday = () => day() > 1 && (day() - 1) % YEAR === 0;
const annivYears = () => st.wedDay ? Math.floor((day() - st.wedDay) / YEAR) : 0;
const daysTo = base => {
  if (!base) return '—';
  const d = day();
  if (d === base) return `อีก ${YEAR} วัน`;
  const k = Math.ceil((d - base) / YEAR), n = base + k * YEAR - d;
  return n <= 0 ? 'วันนี้! 🎉' : `อีก ${n} วัน`;
};
function familyEvents() {
  const out = [];
  if (annivToday()) out.push({ ic: '💐', label: `ครบรอบแต่งงาน ${annivYears()} ปี`, key: 'anniv' });
  for (const k of famKids().filter(kidHasBday)) out.push({ ic: '🎂', label: `วันเกิด ${k.n}`, key: 'kid' });
  if (myBdayToday()) out.push({ ic: '🎉', label: 'วันเกิดของคุณ', key: 'me' });
  return out;
}

// ---- dining table furniture ----
FURN.table = { n: 'โต๊ะอาหาร', w: 2, h: 1, price: 450, cf: 4, cat: 'table', tier: 1, d: 'table' };
CATDESC.table = 'มื้อค่ำครอบครัว วันเกิด และครบรอบแต่งงาน';
DRAW.table = (X, b, F) => {
  const W = F.w * T;
  R('#0002', X + 3, b - 4, W - 6, 4);
  R('#6a4224', X + 5, b - 20, 4, 18); R('#6a4224', X + W - 9, b - 20, 4, 18);
  R('#8a5a34', X + 2, b - 28, W - 4, 9); R('#a87048', X + 2, b - 28, W - 4, 2);
  R('#f4ece0', X + 8, b - 30, W - 16, 2);
  R('#f8f8f8', X + 10, b - 33, 7, 3); R('#f8f8f8', X + W - 17, b - 33, 7, 3);
  R('#8ac0f0', X + W / 2 - 3, b - 36, 6, 6); R('#5aaa5a', X + W / 2 - 1, b - 40, 2, 5); R('#ff7ab0', X + W / 2 - 3, b - 40, 3, 3);
};
const _rebuildHomeFam = rebuildHome;
rebuildHome = () => {
  _rebuildHomeFam();
  const f = st.furn.find(f => f.id === 'table');
  if (!f) return;
  const F = FURN.table, X = f.x * T, base = (f.y + F.h) * T;
  home.targets.push({ x: X + F.w * T / 2, y: base + 12, name: 'โต๊ะอาหาร', get opts() { return tableOpts(); } });
};
function tableOpts() {
  const ev = familyEvents(), o = [];
  if (ev.length) o.push([`${ev[0].ic} ${ev[0].label} — จัดปาร์ตี้`, familyParty]);
  else o.push(['🎂 ปาร์ตี้ครอบครัว', familyParty]);
  o.push(['🍲 มื้อค่ำครอบครัว', familyDinner]);
  if (famKids().some(k => kidAge(k) >= 6)) o.push(['📖 ช่วยการบ้านลูก', helpKid]);
  return o;
}

// ---- meals and parties ----
const dishId = () => Object.keys(st.inv).find(id => ITEMS[id]?.k === 'dish');
function familyDinner() {
  if (st.famDinner === day()) return say('วันนี้กินมื้อค่ำด้วยกันแล้ว พรุ่งนี้ค่อยจัดใหม่');
  if (!famCount()) return say('ยังไม่มีครอบครัวที่บ้าน — แต่งงานหรือมีลูกก่อนนะ');
  const d = dishId();
  if (!d) return say('ต้องมีอาหารที่ปรุงเองอย่างน้อย 1 อย่าง (ทำที่เตา)');
  addItem(d, -1); st.famDinner = day();
  const kids = famKids().length;
  fx({ food: 55, mood: 18 + 3 * kids });
  if (st.spouse) relOf(st.spouse).f = Math.min(100, relOf(st.spouse).f + 3);
  for (const k of famKids()) k.bond = Math.min(100, (k.bond || 0) + 4);
  xp('cook', 12); tick(50);
  st.stats.famDinners = (st.stats.famDinners || 0) + 1;
  say(`มื้อค่ำอบอุ่นกับครอบครัว ${famCount() + 1} คน 🍲 (${ITEMS[d].n})`);
  checkAch(); save();
}
function familyParty() {
  if (!famCount()) return say('ยังไม่มีครอบครัวที่บ้าน — แต่งงานหรือมีลูกก่อนนะ');
  const ev = familyEvents();
  if (!ev.length) return say('วันนี้ยังไม่มีโอกาสพิเศษ — วันเกิดและครบรอบแต่งงานดูได้ในสมุดบันทึก (แท็บครอบครัว)');
  if (st.partyDay === day()) return say('วันนี้จัดปาร์ตี้แล้ว');
  const cake = have('cake') > 0 ? 'cake' : dishId();
  if (!cake) return say('ต้องมีเค้กหรืออาหารที่ปรุงเองอย่างน้อย 1 อย่าง');
  addItem(cake, -1); st.partyDay = day();
  const lines = [], gifts = [];
  if (ev.some(e => e.key === 'anniv')) {
    st.annivParties = (st.annivParties || 0) + 1;
    relOf(st.spouse).f = Math.min(100, relOf(st.spouse).f + 12);
    const gid = ['flower', 'choco', 'bouquet', 'plush'][Math.floor(hash01(day() * 7 + 3) * 4)];
    addItem(gid); gifts.push(`${ITEMS[gid].ic}${ITEMS[gid].n}`);
    fx({ mood: 35 }); lines.push(`ครบรอบแต่งงาน ${annivYears()} ปี 💐`);
  }
  if (ev.some(e => e.key === 'kid')) {
    st.kidParties = (st.kidParties || 0) + 1;
    const ks = famKids().filter(kidHasBday);
    for (const k of ks) k.bond = Math.min(100, (k.bond || 0) + 15);
    fx({ mood: 25 + 5 * ks.length }); lines.push(`วันเกิด ${ks.map(k => k.n).join(' และ ')} 🎂`);
  }
  if (ev.some(e => e.key === 'me')) {
    const gift = 60 + 25 * famKids().length + (st.spouse ? 60 : 0);
    fx({ money: gift, mood: 22 }); lines.push(`วันเกิดของคุณ (ของขวัญ ฿${gift})`);
  }
  st.parties = (st.parties || 0) + 1;
  xp('charm', 10); tick(60);
  say(`🎉 ปาร์ตี้ครอบครัว: ${lines.join(' · ')}${gifts.length ? ` — ได้ ${gifts.join(', ')}` : ''}`);
  toast('🎉 ปาร์ตี้ครอบครัวสำเร็จ');
  checkAch(); save();
}
function helpKid() {
  if (st.helpKid === day()) return say('วันนี้ช่วยการบ้านลูกแล้ว');
  const k = famKids().filter(k => kidAge(k) >= 6 && kidAge(k) < 18).sort((a, b) => kidAge(b) - kidAge(a))[0];
  if (!k) return say('ยังไม่มีลูกวัยเรียนให้ช่วยการบ้าน');
  st.helpKid = day(); k.bond = Math.min(100, (k.bond || 0) + 5);
  fx({ mood: 8, energy: -4 }); xp('logic', 12); tick(30);
  say(`ช่วย ${k.n} ทำการบ้าน — เก่งขึ้นเยอะเลย 📖`);
  save();
}

// ---- family hour on the sofa ----
const _sofaActs = FURN_ACTS.sofa;
FURN_ACTS.sofa = F => [..._sofaActs(F), ['👨‍👩‍👧 ใช้เวลากับครอบครัว 1 ชม.', familyTime]];
function familyTime() {
  if (!famCount()) return say('ยังไม่มีครอบครัวที่บ้าน — แต่งงานหรือมีลูกก่อนนะ');
  if (st.famTime === day()) return say('วันนี้ใช้เวลากับครอบครัวแล้ว');
  st.famTime = day();
  fx({ mood: 10, energy: -3 });
  if (st.spouse) relOf(st.spouse).f = Math.min(100, relOf(st.spouse).f + 2);
  for (const k of famKids()) k.bond = Math.min(100, (k.bond || 0) + 3);
  tick(60); say('นั่งเล่นด้วยกัน เล่าเรื่องตลกในวันนี้ 👨‍👩‍👧');
  save();
}

// ---- daily events, spouse paycheck ----
function familyTick() {
  if (st.famDay !== day()) {
    st.famDay = day();
    const ev = familyEvents();
    if (ev.length) toast(`${ev.map(e => `${e.ic} ${e.label}`).join(' · ')} — จัดปาร์ตี้ที่โต๊ะอาหารได้!`);
  }
  if (st.spousePay === undefined) st.spousePay = day() - 1;
  if (st.spouse && st.spousePay !== day()) {
    const late = day() - st.spousePay > 1 && hour() < 18;
    if (hour() >= 18 || late) {
      st.spousePay = day();
      const p = spouseP(); if (!p) return;
      const pay = SPOUSE_WAGE[p.role] || 90;
      fx({ money: pay });
      toast(`💼 ${p.n} ${late ? 'เก็บเงินเดือนที่ค้างไว้' : 'กลับจากที่ทำงาน'} — ได้ ฿${pay}`);
    }
  }
}
const _seasonTickFam = seasonTick;
seasonTick = () => { _seasonTickFam(); familyTick(); };

// ---- family rows in the journal ----
const _familyRowsFam = familyRows;
familyRows = () => {
  const sp = spouseP();
  if (!sp && !famKids().length) return _familyRowsFam();
  const ev = familyEvents();
  return [..._familyRowsFam(),
    el('div', { className: 'sec' }, 'กิจกรรมครอบครัว'),
    ...(ev.length ? ev.map(e => row(e.ic, `วันนี้: ${e.label}`, 'จัดปาร์ตี้ได้ที่โต๊ะอาหาร 🎂')) : [el('div', { className: 'sub' }, 'วันนี้ไม่มีโอกาสพิเศษ')]),
    ...famKids().map(k => row('🎂', `วันเกิด ${k.n}`, `${daysTo(k.born)} · ความผูกพัน ${Math.floor(k.bond || 0)}/100`)),
    ...(sp ? [row('💐', 'ครบรอบแต่งงาน', `${daysTo(st.wedDay)} (แต่งงานวันที่ ${st.wedDay})`),
      row('💼', `เงินเดือนคู่สมรส ฿${SPOUSE_WAGE[sp.role] || 90}/วัน`, 'เข้าตอน 18:00 ถ้าไม่ได้เล่นตอนนั้นจะเก็บไว้ให้')] : []),
    row('🍲', `มื้อค่ำครอบครัว ${st.stats?.famDinners || 0} ครั้ง`, st.famDinner === day() ? 'วันนี้กินแล้ว ✅' : 'ต้องมีอาหารที่ปรุงเอง 1 อย่าง'),
    row('🎉', `ปาร์ตี้ครอบครัว ${st.parties || 0} ครั้ง`, `วันเกิดคุณ ${daysTo(1)}`),
    row('🪑', 'โต๊ะอาหาร', st.furn.some(f => f.id === 'table') ? 'มีแล้ว — ใช้จัดมื้อค่ำ/ปาร์ตี้' : 'ซื้อได้ที่ร้านเฟอร์นิเจอร์ ฿450')];
};

// ---- family section in the relationship app ----
const _relAppFam = APP.rel;
APP.rel = () => {
  const out = _relAppFam();
  if (typeof pRel !== 'undefined' && pRel) return out;
  const sp = spouseP(), kids = famKids(), extra = [];
  if (sp) extra.push(row('💕', `คู่สมรส: ${sp.n}`, `${sp.age} ปี · ความสนิท ${Math.floor(relOf(sp.id).f)}/100 · อยู่บ้านเดียวกับคุณ`));
  for (const k of kids) extra.push(row('🧒', `${k.n} (ลูก)`, `อายุ ${kidAge(k)} ปี · ความผูกพัน ${Math.floor(k.bond || 0)}/100${k.trait ? ` · ${TRAIT_TH[k.trait] || k.trait}` : ''}`));
  if (!extra.length) return out;
  return [out[0], el('div', { className: 'sec' }, 'ครอบครัวที่บ้าน'), ...extra, ...out.slice(1)];
};

ACH.push(['famdinner', '🍲 ครอบครัวอบอุ่น', 'กินมื้อค่ำกับครอบครัวครบ 5 ครั้ง', () => (st.stats?.famDinners || 0) >= 5],
  ['anniv1', '💐 ครบรอบแต่งงาน', 'ฉลองครบรอบแต่งงานครั้งแรก', () => (st.annivParties || 0) >= 1],
  ['bday1', '🎂 ปาร์ตี้วันเกิด', 'จัดวันเกิดให้ลูก', () => (st.kidParties || 0) >= 1]);

console.assert(FURN.table.price > 0 && DRAW.table && CATDESC.table, 'dining table is sellable and drawable');
