'use strict';
// Random life events (good and bad, with choices), illness, bills and tax. Difficulty setting scales how often bad things happen.
const evQueue = [];
const EVENTS = [
  { id: 'flu', bad: 1, w: 5, ok: () => !st.sick, run() { st.sick = { until: day() + 3 }; toast('🤒 คุณเป็นไข้! กินวิตามินหรือไปคลินิก หรือพัก 3 วัน'); } },
  { id: 'bill', bad: 1, w: 4, ok: () => st.money > 100, run() { const c = 40 + comfort * 2; openMenu(`⚡ ค่าน้ำค่าไฟ ฿${c}`, [[`จ่ายตอนนี้ (฿${c})`, () => { st.money = Math.max(0, st.money - c); say('จ่ายบิลแล้ว') }], ['ปล่อยไว้ (ความสุข −10, ค่าปรับ ฿' + Math.round(c * 1.5) + ' พรุ่งนี้)', () => { fx({ mood: -10 }); st.debt = (st.debt || 0) + Math.round(c * 1.5); toast('📮 ถูกเพิ่มค่าปรับ'); }]]); } },
  { id: 'thief', bad: 1, w: 3, ok: () => st.money > 300, run() { const loss = Math.min(st.money, 60 + (rnd() * 120 | 0)); openMenu(`🦹 ขโมยฉวยกระเป๋าสตางค์คุณ! (฿${loss})`, [['ไล่จับขโมย', () => { if (lv('fit') >= 2 || Math.random() < .4) { fx({ energy: -10 }); toast('🏃 คุณจับขโมยได้และได้เงินคืน!'); } else { st.money -= loss; fx({ energy: -15, mood: -10 }); toast(`💸 ขโมยหนีไปพร้อม ฿${loss}`); } }], ['ปล่อยเขาไป', () => { st.money -= loss; fx({ mood: -8 }); }]]); } },
  { id: 'leak', bad: 1, w: 3, ok: () => true, run() { openMenu('💧 หลังคารั่ว!', [['ซ่อม (฿120)', () => { if (st.money < 120) return say('เงินไม่พอ — ความชื้นทำให้ความสุขลดลง'), fx({ mood: -12 }); st.money -= 120; toast('🔧 ซ่อมแล้ว'); }], ['วางถังรองน้ำ (ความสุข −8)', () => fx({ mood: -8 })]]); } },
  { id: 'pests', bad: 1, w: 2, ok: () => Object.keys(st.garden || {}).length > 0, run() { for (const c of Object.values(st.garden)) c.grow = Math.max(0, c.grow - 2); toast('🐛 แมลงกัดกินสวนของคุณ! พืชโตช้าลง'); } },
  { id: 'cut', bad: 1, w: 2, ok: () => !!st.job, run() { st.payMod = { until: day() + 3 }; toast('📉 เจ้านายลดชั่วโมงงาน — ค่าจ้าง −30% เป็นเวลา 3 วัน'); } },
  { id: 'pet', bad: 1, w: 2, ok: () => Object.keys(st.pets || {}).length > 0, run() { const id = Object.keys(st.pets)[0]; st.pets[id].happy = Math.max(0, st.pets[id].happy - 25); toast(`😿 ${PET_DEFS[id].n} ไม่ยอมกินข้าวและงอนทั้งคืน`); } },
  { id: 'found', w: 5, ok: () => true, run() { const m = 20 + (rnd() * 100 | 0); st.money += m; toast(`🪙 คุณเก็บเงินได้ ฿${m} บนถนน`); } },
  { id: 'lottery', w: 1, ok: () => true, run() { st.money += 500; toast('🎰 คุณถูกรางวัลบัตรขูด ฿500!'); } },
  { id: 'visit', w: 4, ok: () => PEOPLE.some(p => (st.rel[p.id]?.f || 0) >= 30 && !st.gone?.[p.id]), run() { const f = PEOPLE.filter(p => (st.rel[p.id]?.f || 0) >= 30 && !st.gone?.[p.id]); const p = f[ri(f.length)], g = p.like[0]; addItem(g); relOf(p.id).f = Math.min(100, relOf(p.id).f + 3); toast(`🎁 ${p.n} แวะมาหาพร้อม ${ITEMS[g].ic} ${ITEMS[g].n}!`); } },
  { id: 'scholar', w: 3, ok: () => age() >= 10 && age() < 18 && (st.school?.exams || []).some(e => e.g === 'A'), run() { st.money += 200; toast('🎓 ได้ทุนการศึกษา! รับเงิน ฿200'); } },
  { id: 'extra', w: 3, ok: () => !!st.job && st.energy > 40, run() { openMenu('💼 เจ้านายเสนอกะพิเศษวันนี้', [['รับงาน (฿120, พลังงาน −20)', () => { fx({ money: 120, energy: -20 }); }], ['ปฏิเสธ', () => 0]]); } },
  { id: 'stray', w: 2, ok: () => !(st.pets?.kitten), run() { openMenu('🐈 ลูกแมวจรเดินตามคุณกลับบ้าน', [['รับเลี้ยง', () => { st.pets.kitten = { hunger: 60, happy: 70 }; makePets(); toast('🐾 ลูน่ามาเป็นสมาชิกครอบครัวแล้ว!'); }], ['ไล่ไป', () => 0]]); } },
];
function rollEvents() {
  const k = { easy: .5, normal: 1, hard: 1.6 }[CFG.diff] || 1;
  if (Math.random() > .55 * k) return;
  const pool = EVENTS.filter(e => e.ok()).map(e => [e, e.w * (e.bad ? dm() : 1)]), tot = pool.reduce((a, [, w]) => a + w, 0); let r = Math.random() * tot;
  for (const [e, w] of pool) if ((r -= w) < 0) { evQueue.push(e); break; }
}
function eventsDaily() {
  if (st.evDay === day()) return; st.evDay = day();
  if (st.sick && day() > st.sick.until) { st.sick = null; toast('😊 หายจากไข้แล้ว'); }
  if (st.debt) { const d = Math.min(st.money, st.debt); st.money -= d; st.debt -= d; if (d) toast(`📮 จ่ายค่าปรับ ฿${d} แล้ว`); }
  const s = seasonOf(); if (s.d === 7 && st.money > 1000) { const tax = Math.floor((st.money - 1000) * .05); st.money -= tax; toast(`🏛️ ภาษีประจำฤดู: ฿${tax} (5% ของเงินสดที่เกิน ฿1,000 — ฝากเงินในธนาคารไว้นะ!)`); }
  if (day() > 3) rollEvents();
}
const _lt7 = lifeTick;
lifeTick = () => { _lt7(); eventsDaily(); if (evQueue.length && !overlayOpen() && scene && player) evQueue.shift().run(); };
const _eat7 = eat; eat = id => { if (id === 'medicine' && st.sick) { st.sick = null; toast('💊 วิตามินรักษาไข้ให้คุณแล้ว!'); } _eat7(id); };
{
  const t = town.targets.find(t => t.name === 'คลินิก'), base = Object.getOwnPropertyDescriptor(t, 'opts').value;
  Object.defineProperty(t, 'opts', { get: () => [...(st.sick ? [['รักษาไข้ ฿60 🤒', () => { if (st.money < 60) return say('เงินไม่พอ'); st.money -= 60; st.sick = null; fx({ energy: 20 }); tick(30); toast('🩺 หายเป็นปกติแล้ว!'); }]] : []), ...base], configurable: true });
}
console.assert(EVENTS.every(e => e.id && typeof e.run === 'function'), 'event table');
