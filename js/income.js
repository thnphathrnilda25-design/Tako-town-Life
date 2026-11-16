'use strict';
// Extra money-making channels: a daily side-job board, online freelance offers, a tiny
// investment market and a daily check-in. Existing jobs, gigs, business, collecting and
// events keep working unchanged; this module only adds more ways to earn.
function incState() {
  if (!st.income) st.income = {};
  const I = st.income;
  if (!I.side || !I.side.done) I.side = { d: 0, done: {}, bonus: false };
  if (!I.free || !I.free.done) I.free = { d: 0, done: {} };
  if (!I.invest) I.invest = { hold: {}, basis: {} };
  if (!I.daily) I.daily = { d: 0, streak: 0 };
  if (!I.invest.hold) I.invest.hold = {};
  if (!I.invest.basis) I.invest.basis = {};
  return I;
}
const incCash = () => typeof cashOwn === 'function' ? cashOwn() : st.money;
const incPay = n => { n = Math.max(0, Math.round(n)); if (typeof walletPayOwn === 'function' && walletPayOwn) walletPayOwn(n); else st.money -= n; float('-฿' + n, COL.money); };
const incEarn = n => { n = Math.max(0, Math.round(n)); st.money += n; float('+฿' + n, COL.money); };
const incStat = k => st.stats?.[k] || 0;
const incBump = k => { if (!st.stats) st.stats = {}; st.stats[k] = (st.stats[k] || 0) + 1; };

// ---- daily side jobs at the plaza board ----
const SIDE_POOL = [
  { id: 'park_clean', n: 'เก็บขยะรอบสวนสาธารณะ', ic: '🧹', at: 'สวนสาธารณะ', skill: 'fit', mins: 45, base: 45, energy: 10, mood: 2 },
  { id: 'parcel', n: 'ช่วยส่งพัสดุให้ร้านค้า', ic: '📦', at: 'มินิมาร์ท', skill: 'fit', mins: 60, base: 60, energy: 12, mood: 2 },
  { id: 'dogwalk', n: 'พาสุนัขเพื่อนบ้านเดินเล่น', ic: '🐕', at: 'สวนสาธารณะ', skill: 'charm', mins: 50, base: 52, energy: 8, mood: 6 },
  { id: 'bouquet', n: 'ช่วยจัดช่อดอกไม้', ic: '💐', at: 'ร้านดอกไม้', skill: 'art', mins: 50, base: 55, energy: 6, mood: 4 },
  { id: 'dishes', n: 'ล้างจานที่คาเฟ่', ic: '🍽️', at: 'คาเฟ่', skill: 'cook', mins: 60, base: 62, energy: 12, mood: 1 },
  { id: 'stock', n: 'จัดชั้นสินค้าที่มินิมาร์ท', ic: '🛒', at: 'มินิมาร์ท', skill: 'logic', mins: 60, base: 58, energy: 10, mood: 1 },
  { id: 'flyer', n: 'แจกใบปลิวหน้าร้าน', ic: '📄', at: 'ลานเมือง', skill: 'charm', mins: 45, base: 48, energy: 8, mood: 2 },
  { id: 'photo', n: 'ถ่ายรูปสินค้าให้ร้านเฟอร์นิเจอร์', ic: '📷', at: 'ร้านเฟอร์นิเจอร์', skill: 'art', mins: 60, base: 68, energy: 6, mood: 3 },
  { id: 'repair', n: 'ซ่อมของเล็ก ๆ น้อย ๆ', ic: '🔧', at: 'ร้านเฟอร์นิเจอร์', skill: 'logic', mins: 60, base: 65, energy: 10, mood: 2 },
  { id: 'garden', n: 'ช่วยรดน้ำแปลงผักชุมชน', ic: '🌱', at: 'แปลงผัก', skill: 'cook', mins: 45, base: 44, energy: 10, mood: 4 },
];
const sideJobsToday = () => {
  const d = day(), out = [], used = new Set();
  for (let k = 0; out.length < 3 && k < 40; k++) {
    const j = SIDE_POOL[Math.floor(hash01(d * 41 + k * 23) * SIDE_POOL.length)];
    if (used.has(j.id)) continue;
    used.add(j.id); out.push(j);
  }
  return out;
};
const sideDone = j => { const s = incState().side; return s.d === day() && !!s.done[j.id]; };
const sideAllDone = () => { const s = incState().side, jobs = sideJobsToday(); return s.d === day() && jobs.every(j => s.done[j.id]); };
function sideMini(j) {
  if (j.skill === 'logic') return ['quiz', { title: `📋 ${j.n}`, n: 3 }];
  if (j.skill === 'art') return ['simon', { title: `🎨 ${j.n}`, len: 3, items: [['แดง', '#c8402e'], ['น้ำเงิน', '#3a6ad8'], ['เหลือง', '#c8a020'], ['เขียว', '#3a9a4a']] }];
  return ['bar', { title: `📋 ${j.n}`, steps: [['เตรียมของ', j.ic], ['ลงมือทำ', j.ic], ['เก็บงาน', '✅']], speed: .92, w: .24 }];
}
function startSide(j) {
  if (!sideJobsToday().some(x => x.id === j.id)) return say('งานนี้ไม่อยู่ในกระดานวันนี้แล้ว — ดูงานใหม่ที่กระดาน');
  if (sideDone(j)) return say('งานนี้ทำวันนี้แล้ว พรุ่งนี้มีงานใหม่');
  if (st.energy < j.energy) return say(`เหนื่อยเกินไป ต้องใช้แรง ${j.energy} — ไปพักก่อน`);
  closePanel();
  const [mini, cfg] = sideMini(j);
  startMini(mini, cfg, s => {
    const pay = Math.round((j.base + lv(j.skill) * 10) * (.75 + .45 * s) * (st.mood >= 70 ? 1.1 : 1) * (typeof civicJobPayMult === 'function' ? civicJobPayMult() : 1));
    const I = incState(), d = day();
    if (I.side.d !== d) { I.side.d = d; I.side.done = {}; I.side.bonus = false; }
    I.side.done[j.id] = 1;
    const all = sideJobsToday().every(x => I.side.done[x.id]);
    fx({ money: pay, energy: -j.energy, mood: j.mood || 2 }); xp(j.skill, 10 + Math.round(8 * s)); tick(j.mins);
    if (all && !I.side.bonus) {
      I.side.bonus = true; fx({ money: 60, mood: 5 }); addItem('coffee');
      toast('🎉 ทำงานด่วนครบ 3 งาน! โบนัส ฿60 + กาแฟ');
    }
    incBump('side');
    say(`งานด่วนเสร็จ! ได้ ฿${pay} · ${SKILLS[j.skill][0]} +ประสบการณ์`);
    toast('📋 งานด่วนสำเร็จ'); checkAch(); save(); refreshPanel();
  });
}
function dailyCheckIn() {
  const D = incState().daily, d = day();
  if (D.d === d) return say('วันนี้เช็คอินแล้ว กลับมาพรุ่งนี้นะ');
  D.streak = D.d === d - 1 ? (D.streak || 0) + 1 : 1;
  D.d = d;
  const pay = 20 + Math.min(6, D.streak) * 5;
  fx({ money: pay, mood: 3 });
  say(`เช็คอินวันที่ ${D.streak} ติดต่อกัน! ได้ ฿${pay}`);
  toast('📅 เช็คอินรายวันสำเร็จ'); save(); refreshPanel();
}
function sideBody() {
  const I = incState(), jobs = sideJobsToday(), done = I.side.d === day() ? I.side.done : {}, n = jobs.filter(j => done[j.id]).length;
  const out = [money(), el('div', { className: 'sub' }, 'งานด่วนเปลี่ยนทุกวัน — ทำได้วันละ 1 ครั้งต่องาน ไม่ต้องสมัครงานประจำ'),
    el('div', { className: 'sec' }, `งานวันนี้ (${n}/3)`)];
  for (const j of jobs) out.push(row(j.ic, j.n, `${j.at} · ${j.mins} นาที · ใช้แรง ${j.energy} · ฿${j.base}+`, done[j.id] ? el('span', { className: 'sub' }, 'เสร็จแล้ว ✅') : btn('ทำเลย', () => startSide(j), st.energy < j.energy)));
  if (sideAllDone()) out.push(el('div', { className: 'sub' }, 'วันนี้ทำงานครบ 3 งานแล้ว! โบนัสเข้ากระเป๋าเรียบร้อย 🎉'));
  else out.push(el('div', { className: 'sub' }, 'ทำครบ 3 งานวันนี้รับโบนัส ฿60 + กาแฟฟรี'));
  const D = I.daily, claimed = D.d === day(), last = claimed ? D.streak : (D.d === day() - 1 ? D.streak : 0), nextStreak = Math.min(6, last + 1), nextPay = 20 + nextStreak * 5;
  out.push(el('div', { className: 'sec' }, 'เช็คอินรายวัน'));
  out.push(row('📅', `สตรีค ${D.d === day() - 1 || claimed ? D.streak : 0} วัน`, claimed ? 'วันนี้เช็คอินแล้ว ✅' : `เช็คอินวันนี้รับ ฿${nextPay}`,
    claimed ? el('span', { className: 'sub' }, '✅') : btn(`รับ ฿${nextPay}`, dailyCheckIn)));
  return out;
}
const sidePanel = () => openPanel('📋 กระดานงานด่วน', sideBody);

// ---- online freelance offers ----
const FREE_POOL = [
  { id: 'logo', n: 'ออกแบบโลโก้ร้านกาแฟ', ic: '🎨', skill: 'art', req: 0, base: 90, mins: 90 },
  { id: 'website', n: 'ซ่อมเว็บไซต์ร้านค้า', ic: '💻', skill: 'logic', req: 1, base: 120, mins: 120 },
  { id: 'menu', n: 'เขียนเมนูสองภาษา', ic: '📝', skill: 'logic', req: 0, base: 80, mins: 75 },
  { id: 'product', n: 'ถ่ายรูปสินค้าให้บูติก', ic: '📷', skill: 'art', req: 0, base: 85, mins: 80 },
  { id: 'song', n: 'แต่งเพลงโฆษณาสั้น ๆ', ic: '🎵', skill: 'art', req: 2, base: 140, mins: 120 },
  { id: 'data', n: 'กรอกข้อมูลร้านมินิมาร์ท', ic: '🗂️', skill: 'logic', req: 0, base: 75, mins: 70 },
  { id: 'party', n: 'จัดปาร์ตี้วันเกิดเล็ก ๆ', ic: '🎉', skill: 'charm', req: 1, base: 110, mins: 100 },
  { id: 'tour', n: 'พาเที่ยวชมเมืองครึ่งวัน', ic: '🗺️', skill: 'charm', req: 0, base: 95, mins: 90 },
];
const freeToday = () => {
  const d = day(), out = [], used = new Set();
  for (let k = 0; out.length < 3 && k < 40; k++) {
    const o = FREE_POOL[Math.floor(hash01(d * 67 + k * 31) * FREE_POOL.length)];
    if (used.has(o.id)) continue;
    used.add(o.id); out.push(o);
  }
  return out;
};
const freeDone = o => { const f = incState().free; return f.d === day() && !!f.done[o.id]; };
function freeMini(o) {
  if (o.skill === 'logic') return ['quiz', { title: `💻 ${o.n}`, n: 3 }];
  if (o.skill === 'art') return ['simon', { title: `🎨 ${o.n}`, len: 3 + Math.floor(lv('art') / 3), items: [['แดง', '#c8402e'], ['น้ำเงิน', '#3a6ad8'], ['เหลือง', '#c8a020'], ['เขียว', '#3a9a4a']] }];
  return ['bar', { title: `💻 ${o.n}`, steps: [['คุยกับลูกค้า', '💬'], ['ทำงาน', '⌨️'], ['ส่งงาน', '✅']], speed: .95, w: .24 }];
}
function startFree(o) {
  if (!freeToday().some(x => x.id === o.id)) return say('งานนี้ออกจากกระดานแล้ว — ดูงานใหม่พรุ่งนี้');
  if (freeDone(o)) return say('งานนี้ส่งวันนี้แล้ว พรุ่งนี้มีงานใหม่');
  if (lv(o.skill) < o.req) return say(`ต้องมีทักษะ${SKILLS[o.skill][0]} เลเวล ${o.req} ขึ้นไป`);
  if (st.energy < 15) return say('เหนื่อยเกินไป พักก่อนแล้วค่อยรับงาน');
  closePanel();
  const [mini, cfg] = freeMini(o);
  startMini(mini, cfg, s => {
    const pay = Math.round((o.base + lv(o.skill) * 18) * (.7 + .55 * s) * (st.mood >= 70 ? 1.15 : 1) * (typeof civicJobPayMult === 'function' ? civicJobPayMult() : 1));
    const I = incState(), d = day();
    if (I.free.d !== d) { I.free.d = d; I.free.done = {}; }
    I.free.done[o.id] = 1;
    fx({ money: pay, energy: -15, mood: s >= .7 ? 5 : 2 }); xp(o.skill, 14 + Math.round(12 * s)); tick(o.mins);
    incBump('free');
    say(`ส่งงานออนไลน์แล้ว! ได้ ฿${pay} · ${SKILLS[o.skill][0]} +ประสบการณ์`);
    toast('💻 งานฟรีแลนซ์สำเร็จ'); checkAch(); save(); refreshPanel();
  });
}
function freeBody() {
  const I = incState(), out = [money(), el('div', { className: 'sub' }, 'งานออนไลน์ 3 งานต่อวัน — ทำจากที่ไหนก็ได้ ไม่ต้องเดินทาง')];
  for (const o of freeToday()) {
    const done = I.free.d === day() && I.free.done[o.id], locked = lv(o.skill) < o.req;
    out.push(row(o.ic, o.n, `${SKILLS[o.skill][1]} · ${o.mins} นาที · ใช้แรง 15 · ฿${o.base}+${o.req ? ` · ต้องเลเวล ${o.req}` : ''}`,
      done ? el('span', { className: 'sub' }, 'ส่งแล้ว ✅') : btn(locked ? `ต้อง ${SKILLS[o.skill][0]} Lv.${o.req}` : 'รับงาน', () => startFree(o), locked || st.energy < 15)));
  }
  out.push(el('div', { className: 'sub' }, 'ยิ่งทักษะสูง ค่าจ้างยิ่งเพิ่ม · งานจะเปลี่ยนทุกวัน'));
  return out;
}
const freePanel = () => openPanel('💻 งานฟรีแลนซ์', freeBody);

// ---- small investment market ----
const INV_ASSETS = [
  { id: 'cafe', n: 'หุ้นคาเฟ่เมือง', ic: '☕', base: 120, vol: .12 },
  { id: 'mart', n: 'หุ้นมินิมาร์ท', ic: '🛒', base: 80, vol: .08 },
  { id: 'mine', n: 'หุ้นเหมืองผลึก', ic: '💎', base: 180, vol: .19 },
  { id: 'fund', n: 'กองทุนเมืองมั่นคง', ic: '🏦', base: 250, vol: .04 },
];
function invPrice(a, d = day()) {
  d = Math.max(1, d);
  const wave = Math.sin((d + a.base) * .57) * a.vol, slow = Math.sin((d * 1.7 + a.base * .31) * .19) * .035;
  const noise = (hash01(d * 131 + a.base) - .5) * a.vol * .9;
  return Math.max(15, Math.round(a.base * (1 + wave + slow + noise)));
}
const invSpark = a => {
  const ps = Array.from({ length: 7 }, (_, i) => invPrice(a, day() - 6 + i)), mn = Math.min(...ps), mx = Math.max(...ps);
  return ps.map(p => '▁▂▃▄▅▆▇█'[Math.min(7, Math.floor((p - mn) / (mx - mn || 1) * 7))]).join('');
};
const invHold = id => incState().invest.hold[id] || 0;
const invBasis = id => incState().invest.basis[id] || 0;
function invBuy(a, n = 1) {
  const p = invPrice(a), cost = p * n;
  if (incCash() < cost) return say('เงินสดของคุณไม่พอ');
  incPay(cost);
  const I = incState().invest, old = I.hold[a.id] || 0;
  I.basis[a.id] = Math.round(((I.basis[a.id] || 0) * old + cost) / (old + n));
  I.hold[a.id] = old + n;
  incBump('investBuys');
  toast(`📈 ซื้อ ${a.n} จำนวน ${n} หน่วยที่ ฿${p} รวม ฿${cost}`); checkAch(); save(); refreshPanel();
}
function invSell(a, n = 1) {
  const hold = invHold(a.id); const qty = n === 'all' ? hold : Math.min(n, hold);
  if (qty <= 0) return say('ยังไม่มีหุ้นตัวนี้');
  const p = invPrice(a), proceeds = p * qty, gain = (p - invBasis(a.id)) * qty;
  incEarn(proceeds);
  const I = incState().invest;
  I.hold[a.id] = hold - qty; if (!I.hold[a.id]) { delete I.hold[a.id]; delete I.basis[a.id]; }
  if (!st.stats) st.stats = {};
  st.stats.investProfit = (st.stats.investProfit || 0) + gain;
  const result = gain > 0 ? `กำไร ฿${Math.round(gain)}` : gain < 0 ? `ขาดทุน ฿${Math.abs(Math.round(gain))}` : 'เสมอตัว';
  toast(`📉 ขาย ${a.n} จำนวน ${qty} หน่วยที่ ฿${p} · ${result}`);
  say(gain > 0 ? `ขายทำกำไร ฿${Math.round(gain)}!` : gain < 0 ? `ขายขาดทุน ฿${Math.abs(Math.round(gain))} — ครั้งหน้าลองดูจังหวะใหม่` : `ขายคืนแล้ว ได้เงินคืน ฿${proceeds} (เสมอตัว)`); save(); refreshPanel();
}
function investBody() {
  const I = incState().invest, out = [money(), el('div', { className: 'sub' }, 'ราคาเปลี่ยนทุกวัน · ซื้อขายด้วยเงินสดของคุณเอง · ไม่มีค่าธรรมเนียม')];
  let value = 0, basis = 0;
  for (const a of INV_ASSETS) {
    const p = invPrice(a), y = invPrice(a, day() - 1), ch = p - y, pct = y ? Math.round(ch / y * 100) : 0, hold = I.hold[a.id] || 0;
    value += hold * p; basis += hold * (I.basis[a.id] || 0);
    out.push(row(a.ic, a.n, `${invSpark(a)} · ฿${p} (${ch >= 0 ? '+' : ''}${ch}, ${pct >= 0 ? '+' : ''}${pct}%)${hold ? ` · ถือ ${hold} หุ้น · ทุน ฿${I.basis[a.id]}` : ''}`,
      btn('ซื้อ 1', () => invBuy(a, 1), incCash() < p),
      ...(hold ? [btn('ขาย 1', () => invSell(a, 1)), btn('ขายหมด', () => invSell(a, 'all'))] : [])));
  }
  const gain = value - basis;
  out.push(el('div', { className: 'sec' }, `พอร์ตวันนี้ ฿${value}`));
  out.push(el('div', { className: 'sub' }, `ต้นทุน ฿${basis} · ${gain > 0 ? `กำไร +฿${gain}` : gain < 0 ? `ขาดทุน −฿${Math.abs(gain)}` : 'เสมอตัว'}`));
  out.push(el('div', { className: 'sub' }, 'ซื้อถูกขายแพงตามจังหวะตลาด — ราคาใหม่ทุกวันหลังตื่นนอน'));
  return out;
}
const investPanel = () => openPanel('📈 ลงทุน', investBody);

// ---- phone apps, PC shortcut and the physical board ----
APP.hustle = sideBody;
APP.free = freeBody;
APP.invest = investBody;
APPS.push(['hustle', '📋', 'งานด่วน'], ['free', '💻', 'ฟรีแลนซ์'], ['invest', '📈', 'ลงทุน']);

town.targets.push({ x: 18 * T + 16, y: 8 * T + 16, name: '📋 กระดานงานด่วน', opts: [['ดูงานวันนี้', sidePanel], ['เช็คอินรายวัน', dailyCheckIn]] });
town.statics.push({ k: 8 * T + 16, f() {
  const x = 18 * T + 8, y = 8 * T + 18;
  R('#5a3a24', x, y - 22, 2, 22); R('#5a3a24', x + 22, y - 22, 2, 22);
  R('#8a5a34', x - 4, y - 32, 30, 18); R('#c8a878', x - 2, y - 30, 26, 14);
  R('#f4efe6', x + 1, y - 28, 9, 7); R('#f4efe6', x + 13, y - 28, 9, 7);
  R('#e84a4a', x + 2, y - 26, 6, 1); R('#4a7ad8', x + 2, y - 24, 7, 1); R('#58c47a', x + 14, y - 26, 5, 1); R('#f2c84a', x + 14, y - 24, 6, 1);
  R('#f2c84a', x + 8, y - 38, 10, 6); R('#3a3a48', x + 10, y - 36, 6, 1);
} });

const _pcInc = FURN_ACTS.pc;
FURN_ACTS.pc = F => [..._pcInc(F), ['💻 เปิดกระดานงานฟรีแลนซ์', freePanel]];

function incomeDaily() {
  const I = incState(), d = day();
  if (I.side.d !== d) { I.side.d = d; I.side.done = {}; I.side.bonus = false; }
  if (I.free.d !== d) { I.free.d = d; I.free.done = {}; }
}
const _sTInc = seasonTick;
seasonTick = () => { _sTInc(); incomeDaily(); };

ACH.push(['oddjob1', '📋 งานด่วนแรก', 'ทำงานด่วน 1 ครั้ง', () => incStat('side') >= 1],
  ['oddjob15', '📋 มืออเนกประสงค์', 'ทำงานด่วนครบ 15 ครั้ง', () => incStat('side') >= 15],
  ['free5', '💻 ฟรีแลนซ์ตัวจริง', 'ส่งงานออนไลน์ครบ 5 ครั้ง', () => incStat('free') >= 5],
  ['invest1', '📈 นักลงทุนหน้าใหม่', 'ซื้อสินทรัพย์ครั้งแรก', () => incStat('investBuys') >= 1 || Object.keys(incState().invest.hold).length > 0]);

console.assert(SIDE_POOL.length >= 6 && FREE_POOL.length >= 6, 'income pools');
console.assert(INV_ASSETS.every(a => invPrice(a) > 0), 'investment prices');
