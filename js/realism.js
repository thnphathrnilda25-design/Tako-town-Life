'use strict';
// Realism: stress, sleep debt, weight, injuries, food poisoning and colds, mood buffs/debuffs (moodlets);
// money: loans with a credit score, utility bills from what you actually use, yearly inflation.
const B = () => st.body || (st.body = { stress: 15, kg: 55, awake: 0, injured: 0 });
const ML = () => st.moodlets || (st.moodlets = []);
// ---- moodlets ----
const MOODLETS = {
  warm: ['🤗', 'อบอุ่นใจ', 4, 3], love: ['💕', 'หัวใจพองโต', 6, 6], sweet: ['💞', 'คืนแสนหวาน', 6, 10], angry: ['💢', 'โกรธจัด', -6, 3], hurt: ['💔', 'เสียใจ', -5, 6],
  rested: ['😌', 'นอนอิ่ม', 3, 6], tired: ['🥱', 'อดนอน', -4, 0], hungry: ['😠', 'หิวจนหงุดหงิด', -5, 0],
  stressed: ['😰', 'เครียดมาก', -5, 0], injured: ['🩹', 'บาดเจ็บ', -3, 0], grief: ['🖤', 'เศร้าโศก', -6, 72], broke: ['💸', 'กังวลเรื่องเงิน', -4, 24], heavy: ['🍩', 'น้ำหนักเกิน', -2, 0], fun: ['🎉', 'สนุกสุดๆ', 5, 4],
};
function addMood(id, hours) { const M = MOODLETS[id]; if (!M) return; const L = ML(), until = st.min + (hours ?? M[3]) * 60, m = L.find(x => x.id === id); if (m) m.until = Math.max(m.until, until); else L.push({ id, until }); }
const hasMood = id => ML().some(m => m.id === id);
var stressAdd = n => { const b = B(); b.stress = Math.max(0, Math.min(100, b.stress + n)); };
function needMoods() {   // condition-based moodlets live while the condition holds
  const b = B(), set = (id, on) => { const L = ML(), i = L.findIndex(m => m.id === id); if (on && i < 0) L.push({ id, until: Infinity }); if (!on && i >= 0 && L[i].until === Infinity) L.splice(i, 1); };
  set('tired', b.awake > 20 * 60); set('hungry', st.food < 15); set('stressed', b.stress >= 70); set('injured', b.injured > day()); set('heavy', b.kg > 90);
}
// ---- per-minute body simulation ----
const _tick17 = tick;
tick = m => {
  _tick17(m); const b = B();
  b.awake += m;
  b.stress += m * (st.mood < 40 ? .012 : st.mood > 75 ? -.012 : 0) + (b.awake > 20 * 60 ? m * .01 : 0);
  if (b.awake > 20 * 60) st.energy -= m * .03;
  b.stress = Math.max(0, Math.min(100, b.stress)); b.kg = Math.max(35, Math.min(140, b.kg - m * .0001));
  if (b.injured > day()) st.energy = Math.min(st.energy, 70);
  let dm2 = 0; for (const x of ML()) dm2 += MOODLETS[x.id][2]; st.mood += dm2 * m / 60;
  const L = ML(); for (let i = L.length - 1; i >= 0; i--) if (L[i].until < st.min) L.splice(i, 1);
  needMoods(); clamp();
};
const _sleep17 = sleepNow;
sleepNow = (h, tier) => { _sleep17(h, tier); const b = B(); b.awake = 0; stressAdd(-(h >= 8 ? 20 : 6)); if (h >= 8) addMood('rested'); };
const _fx17 = fx;
fx = d => { _fx17(d); if (d.money > 0 && d.energy < 0) stressAdd(5); if ((d.mood || 0) > 0) stressAdd(-d.mood * .25); if (d.food > 0) B().kg += d.food * .012; };
const _xp17 = xp; xp = (s, n) => { _xp17(s, n); if (s === 'fit') B().kg -= n * .01; };
const _eat17 = eat;
eat = id => {
  if ((id === 'meat' || id === 'egg') && Math.random() < .25 && !st.sick) { st.sick = { until: day() + 1, kind: 'อาหารเป็นพิษ' }; toast('🤢 กินของดิบเข้าไป อาหารเป็นพิษ! (วิตามินหรือคลินิกช่วยได้)'); }
  _eat17(id);
};
// ---- clinic, stress relief and injuries ----
{ const t = town.targets.find(t => t.name === 'คลินิก'); if (t) { const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { get: () => [...(B().injured > day() ? [['🩹 รักษาแผล ฿80', () => { if (st.money < 80) return say('เงินไม่พอ'); st.money -= 80; B().injured = 0; tick(40); toast('🩹 แผลหายดีแล้ว'); }]] : []), ['🧠 ปรึกษานักจิตวิทยา ฿120', () => { if (st.money < 120) return say('เงินไม่พอ'); st.money -= 120; stressAdd(-35); tick(60); say('ได้ระบายแล้ว เครียดลดลงเยอะ'); }], ...base.call(t)], configurable: true }); } }
// colds in the rain, injuries from fights, the mine and contests
const _sT17 = seasonTick;
seasonTick = () => { _sT17(); if (scene === town && wet() && !have('umbrella') && !st.sick && B().stress > 50 && Math.random() < .002) { st.sick = { until: day() + 2, kind: 'หวัด' }; toast('🤧 ตากฝนจนเป็นหวัด'); } dailyMoney(); };
var injure = (days, why) => { B().injured = Math.max(B().injured, day() + days); toast(`🩹 ${why} — บาดเจ็บ ${days} วัน (พลังงานสูงสุด 70)`); };
const _r17 = typeof remember === 'function' ? remember : null;
// ---- money: loans, credit, utilities, inflation ----
const LOAN = () => st.loan || (st.loan = { bal: 0, credit: 650, used: 0, missed: 0, last: 0 });
var countUse = () => { st.util = (st.util || 0) + 1; };
if (typeof doAct === 'function') { const _da17 = doAct; doAct = (k, fn, l) => { if (scene === home) countUse(); return _da17(k, fn, l); }; }
function dailyMoney() {
  if (st.mDay === day()) return; st.mDay = day(); const L = LOAN(), d = weekday();
  if (d === 0 && L.bal > 0) {
    L.bal = Math.round(L.bal * 1.02); const pay = Math.min(L.bal, Math.max(100, Math.round(L.bal * .1)));
    if (st.money >= pay) { st.money -= pay; L.bal -= pay; L.credit = Math.min(850, L.credit + 8); toast(`🏦 ผ่อนเงินกู้ ฿${pay} (คงเหลือ ฿${L.bal})`); }
    else { L.missed++; L.credit = Math.max(300, L.credit - 40); addMood('broke'); toast('⚠️ จ่ายค่างวดเงินกู้ไม่ได้! เครดิตลดลง'); }
  }
  if (d === 6 && (st.house?.kind || 'parents') !== 'parents') {
    const units = st.util || 0, bill = Math.round((40 + units * 5) * (st.infl || 1)); st.util = 0;
    if (st.money >= bill) { st.money -= bill; toast(`⚡ ค่าน้ำค่าไฟสัปดาห์นี้ ฿${bill} (ใช้ ${units} หน่วย)`); } else { st.debt = (st.debt || 0) + bill; addMood('broke'); toast(`⚡ ค่าน้ำค่าไฟ ฿${bill} ค้างจ่าย`); }
  }
  const y = Math.floor((day() - 1) / YEAR);
  if ((st.inflY ?? 0) < y) {
    st.inflY = y; st.infl = (st.infl || 1) * 1.03;
    for (const id in ITEMS) { const I = ITEMS[id]; if (I.p) { I.p0 = I.p0 || I.p; I.p = Math.round(I.p0 * st.infl); } }
    for (const J of Object.values(JOBS)) { J.pay0 = J.pay0 || [...J.pay]; J.pay = J.pay0.map(v => Math.round(v * st.infl)); }
    if (st.house?.rent) st.house.rent = Math.round(st.house.rent * 1.03);
    toast(`📈 ปีใหม่ ราคาของขึ้น 3% (เงินเฟ้อสะสม ${Math.round((st.infl - 1) * 100)}%) · ค่าจ้างก็ขึ้นตาม`);
  }
}
function applyInflation() { if (!st.infl) return; for (const id in ITEMS) { const I = ITEMS[id]; if (I.p) { I.p0 = I.p0 || I.p; I.p = Math.round(I.p0 * st.infl); } } }
const _start17 = start; start = s => { _start17(s); applyInflation(); };
const maxLoan = () => Math.max(0, Math.round((LOAN().credit - 500) * 30));
if (typeof APP !== 'undefined' && APP.bank) {
  const _bank17 = APP.bank;
  APP.bank = () => { const L = LOAN(); return [..._bank17(), el('div', { className: 'sec' }, `เงินกู้ · เครดิต ${L.credit}`),
    row('💳', `ยอดหนี้ ฿${L.bal}`, `ดอกเบี้ย 2%/สัปดาห์ · ผ่อนขั้นต่ำ 10% ทุกวันจันทร์ · กู้ได้สูงสุด ฿${maxLoan()}`),
    el('div', {}, ...[1000, 3000, 5000].map(n => btn(`กู้ ฿${n}`, () => { if (L.bal + n > maxLoan()) return say('เครดิตไม่พอสำหรับวงเงินนี้'); if (age() < 18) return say('ต้องอายุ 18 ปีขึ้นไป'); L.bal += n; L.used = 1; st.money += n; refreshPanel(); save(); }))),
    el('div', {}, btn('ปิดหนี้ทั้งหมด', () => { if (st.money < L.bal) return say('เงินไม่พอ'); st.money -= L.bal; L.bal = 0; L.credit = Math.min(850, L.credit + 20); refreshPanel(); save(); }, !L.bal || st.money < L.bal))];
  };
}
// ---- HUD line ----
const _hud17 = drawHud;
drawHud = () => {
  _hud17(); const b = B(), icons = ML().map(m => MOODLETS[m.id][0]).join(''), d = hud.querySelector('.details');
  if (d) d.insertAdjacentHTML('beforeend', `<div class="row" style="font-size:12px"><span>😰 เครียด ${Math.round(b.stress)} · ⚖️ ${b.kg.toFixed(1)}กก.</span><span>${icons}${st.sick ? ' 🤒' + (st.sick.kind || '') : ''}</span></div>`);
};
ACH.push(['zen', '🧘 ใจเย็น', 'ความเครียดเหลือ 0', () => B().stress <= 0], ['debtfree', '💳 หนี้หมด', 'ปิดเงินกู้ครบ', () => LOAN().used && !LOAN().bal]);
console.assert(Object.values(MOODLETS).every(m => m.length === 4), 'moodlet table');
