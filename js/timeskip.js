'use strict';
// Sleeping through time: the bed gains "🌌 นอนข้ามเวลา" so you can sleep for whole years, not just
// hours. The skip is simulated one birthday at a time, so aging, parents, town news, money, inflation
// and story deadlines all keep moving while you sleep. One summary panel reports what changed.

const TS_SPANS = [1, 2, 3, 5, 10];
const TS_LIVE = 6;                        // living cost per skipped day, paid by grown-ups
const TS_DREAMS = [
  'ฝันว่าปีนบันไดที่ไม่มีวันสิ้นสุด แล้วเจอประตูบานหนึ่งที่เปิดออกสู่ทะเล',
  'ฝันว่ากลับไปเป็นเด็กอีกครั้ง นั่งกินข้าวกับพ่อแม่ในครัวหลังเก่า',
  'ฝันว่าเมืองทั้งเมืองเงียบสนิท มีเพียงเสียงฝนและตะเกียงดวงเดียว',
  'ฝันว่าเดินอยู่บนถนนที่ปูด้วยปฏิทินเก่า ๆ ทุกก้าวคือหนึ่งวัน',
  'ฝันว่ามีคนเอามือมาจับแก้ม แล้วบอกว่า "ตื่นได้แล้วนะ"',
  'ฝันว่าบินอยู่เหนือหลังคาบ้าน เห็นไฟทุกดวงในเมืองสว่างพร้อมกัน',
  'ฝันถึงกลิ่นกาแฟกับเสียงหัวเราะของคนที่ยังไม่เจอ',
  'ฝันว่าตัวเองแก่ลงทีละนิด แต่ใจยังเบาเหมือนเดิม',
];
let TS_RUN = false, TS_DEAD = false, TS_NOTES = [], TS_TOAST = null, TS_AFTER = null;

const tsState = () => (st.ts || (st.ts = { ver: 1, n: 0, years: 0, last: 0, sum: null }));
const tsBday = (d, n) => (Math.floor((d - 1) / YEAR) + n) * YEAR + 1;   // day number of the n-th birthday after d
const tsRent = () => {
  const h = H();
  return h.kind === 'own' ? (h.weeksLeft > 0 ? (h.weekly || 0) : 0) : h.kind === 'parents' ? 0 : (h.rent || 0);
};
const tsCost = days => {
  const from = day(), end = from + days;
  const d18 = Math.max(1, (12 - (st.ageShift || 0)) * YEAR + 1);   // the day you turn 18
  const adult = Math.max(0, end - Math.max(from, d18));            // grown-up days only: parents pay before that
  return adult ? Math.round(adult * TS_LIVE + Math.ceil(adult / 7) * tsRent()) : 0;
};

// Waking up rested, but the body still has the limits of its age.
function tsNeeds() {
  const cap = age() >= 50 ? Math.max(25, 100 - (age() - 50) * 1.2) : 100;
  st.energy = Math.min(cap, 92);
  st.food = Math.max(st.food, 70);
  st.mood = Math.max(st.mood, 60);
}

// A long sleep would otherwise fire dozens of toasts at once; collect them for the summary instead.
function tsQuiet(on) {
  if (on) { if (!TS_TOAST) TS_TOAST = toast; toast = t => { if (TS_NOTES.length < 90) TS_NOTES.push(String(t)); }; }
  else if (TS_TOAST) { toast = TS_TOAST; TS_TOAST = null; }
}

function timeSkipMenu() {
  if (TS_RUN) return say('กำลังหลับอยู่…');
  if (st.preg) {
    const left = Math.max(0, st.preg.due - day());
    return say(left ? `🤰 อีก ${left} วันจะคลอด — พักรอคลอดก่อนนะ` : '🤰 ใกล้คลอดแล้ว — คลอดก่อนแล้วค่อยนอนยาว');
  }
  const S = tsState();
  openMenu(`🌌 นอนข้ามเวลา — อายุ ${age()} ปี`, [
    ...TS_SPANS.map(n => {
      const days = n * YEAR, cost = tsCost(days), poor = cost > st.money;
      return [`${n} ปี → อายุ ${age() + n} ปี · ${days} วัน · ${cost ? `฿${cost}` : 'พ่อแม่เลี้ยงดู'}${poor ? ' — เงินไม่พอ' : ''}`,
        () => (poor ? say(`ต้องมีเงินอย่างน้อย ฿${cost} สำหรับค่าครองชีพ ${days} วัน`) : tsConfirm(n, cost))];
    }),
    ...(S.sum ? [['📜 สรุปการนอนครั้งล่าสุด', tsSummaryPanel]] : []),
    ['◀ กลับ', () => 0],
  ]);
}

function tsConfirm(years, cost) {
  const a = age(), days = years * YEAR, risky = a + years >= 65;
  openMenu(`😴 หลับ ${years} ปี (${days} วัน) · ฿${cost}${risky ? ' · ⚠️ อายุมากแล้ว' : ''}`, [
    [`ใช่ — ตื่นมาอายุ ${a + years} ปี`, () => tsSleep(years, cost)],
    ['ไม่เอา', () => 0],
  ]);
}

function tsSleep(years, cost) {
  if (TS_RUN || busy) return say('รอสักครู่นะ');
  const S = tsState();
  const snap = {
    d0: day(), a0: age(), m0: st.money, house: H().kind,
    dead0: { dad: !!(st.parents?.dad?.dead), mom: !!(st.parents?.mom?.dead) },
    miss0: ST_ARCS.reduce((n, a) => n + (stA(a.id).missed || 0), 0),
    kids0: (st.kids || []).length,
  };
  TS_RUN = true; TS_DEAD = false; TS_NOTES = []; tsQuiet(true);
  fade(() => {
    let died = false;
    try {
      const d1 = snap.d0 + years * YEAR;
      for (let i = 1; ; i++) {                       // stand on every birthday inside the skip
        const b = tsBday(snap.d0, i); if (b > d1) break;
        st.min = (b - 1) * 1440 + 7 * 60;
        tsNeeds(); st.dyCheck = 0;
        dieCheck();
        if (TS_DEAD) { died = true; break; }
        yearlyWorld();
        st.mDay = 0; dailyMoney();
      }
      if (!died) {
        st.min = (d1 - 1) * 1440 + 7 * 60;
        tsNeeds(); st.dyCheck = 0; dailyMoney();

        st.money = Math.max(0, st.money - Math.min(st.money, cost));
        st.sick = null; st.payMod = null;
        if (st.body) { st.body.injured = 0; st.body.stress = Math.max(0, Math.min(40, (st.body.stress || 0) - 20)); }
        H().missed = 0;
        if (st.moveDue && st.moveDue < day()) st.moveDue = day() + 7;
        if (ph().meet) { ph().meet = null; TS_NOTES.push('🤝 นัดที่ค้างไว้ผ่านไปแล้ว'); }
        for (const id in ph().msgs) ph().msgs[id] = ph().msgs[id].slice(-4);
        st.schChk = day(); st.evDay = day();          // a quiet first morning: no truancy, no random event
        lifeTick(); seasonTick();
        if (TS_DEAD) died = true;                       // old age can still catch up during the settle
        else {
          S.n++; S.years = (S.years || 0) + years; S.last = day();
          S.sum = tsBuild(snap, years, cost);
        }
      }
      save();
    } finally {
      TS_RUN = false; tsQuiet(false); TS_DEAD = false;
      if (!died) {
        if (panelOpen) TS_AFTER = () => { TS_AFTER = null; tsSummaryPanel(); };
        else tsSummaryPanel();
      }
    }
  }, 900);
}

function tsBuild(snap, years, cost) {
  const S = tsState(), a1 = age(), d1 = day(), rows = [];
  rows.push(`🗓️ ผ่านไป ${years} ปี (${years * YEAR} วัน) · วันที่ ${snap.d0} → ${d1}`);
  rows.push(`🎂 อายุ ${snap.a0} → ${a1} ปี`);
  if (cost) rows.push(`💸 ค่าครองชีพ ฿${Math.min(snap.m0, cost)}${cost > snap.m0 ? ' (ใช้จนหมด)' : ''}`);
  if (st.money !== snap.m0) rows.push(`💰 เงิน ฿${snap.m0} → ฿${st.money}`);
  for (const k of ['dad', 'mom']) {
    if (!snap.dead0[k] && st.parents?.[k]?.dead) rows.push(`🕯️ ${k === 'dad' ? 'พ่อ' : 'แม่'}จากไปอย่างสงบ`);
  }
  const alive = ['dad', 'mom'].filter(k => st.parents?.[k] && !st.parents[k].dead);
  if (alive.length) rows.push(`👵 พ่อแม่อายุ ${alive.map(k => `${Math.round(parentAge(st.parents[k]))} ปี`).join(' · ')}`);
  const kids = (st.kids || []).filter(k => k.n);
  if (kids.length) rows.push(`👨‍👩‍👧 ลูก ${kids.length} คน: ${kids.map(k => `${k.n} (${kidAge(k)} ปี)`).join(' · ')}`);
  if ((st.kids || []).length > snap.kids0) rows.push('👶 มีสมาชิกใหม่เกิดระหว่างการนอน');
  if (H().kind !== snap.house) rows.push(`🏠 ที่อยู่เปลี่ยนเป็น ${H().kind === 'parents' ? 'บ้านพ่อแม่' : H().kind === 'own' ? 'บ้านของตัวเอง' : 'ที่เช่า'}`);
  if (H().kind === 'parents' && a1 >= 18 && st.moveDue) rows.push('🎓 อายุ 18 แล้ว — พ่อแม่ให้เวลา 7 วันหาที่อยู่เอง');
  if (snap.a0 < 18 && a1 >= 18 && st.grad) rows.push('🎓 จบการศึกษาแล้ว');
  const miss1 = ST_ARCS.reduce((n, a) => n + (stA(a.id).missed || 0), 0);
  if (miss1 > snap.miss0) rows.push(`📖 พลาดบทของเรื่องราว ${miss1 - snap.miss0} บท`);
  if ((st.infl || 1) > 1.005) rows.push(`📈 เงินเฟ้อสะสม ${Math.round(((st.infl || 1) - 1) * 100)}%`);
  const un = typeof unread === 'function' ? unread() : 0;
  if (un) rows.push(`💬 ข้อความใหม่ ${un} ข้อความ`);
  if (S.n === 1) rows.push('🌌 นี่เป็นการนอนข้ามปีครั้งแรกของคุณ');

  const notes = [...new Set(TS_NOTES.filter(n => /🕯️|👶|🎓|🏆|📉|⚠️|📈|🏠|📦|💼|📰/.test(n)))].slice(-6);
  return {
    head: `ผ่านไป ${years} ปี — ${st.name} อายุ ${a1} ปี`,
    rows, notes, day: d1,
    dream: TS_DREAMS[Math.floor(Math.random() * TS_DREAMS.length)],
  };
}

function tsSummaryPanel() {
  const S = tsState().sum;
  if (!S) return say('ยังไม่มีการนอนยาว');
  openPanel('🌅 ตื่นขึ้นมา', () => [
    el('div', { className: 'sub' }, S.head),
    ...S.rows.map(t => el('div', {}, t)),
    ...(S.notes.length ? [el('div', { className: 'sec' }, 'เรื่องที่เกิดขึ้น'), ...S.notes.map(t => el('div', { className: 'sub' }, t))] : []),
    el('div', { className: 'sec' }, 'ความฝันระหว่างหลับ'),
    el('div', { className: 'sub' }, `“${S.dream}”`),
    btn('ลุกขึ้น', () => { closePanel(); save(); }),
  ]);
}

// if a birth/event panel opened while settling, show the summary after the player closes it
const _closePanelTS = closePanel;
closePanel = () => {
  _closePanelTS();
  if (TS_AFTER) setTimeout(() => { const f = TS_AFTER; TS_AFTER = null; if (f) f(); }, 150);
};

// keep the normal death panel, but stop the skip when old age catches up mid-sleep
const _tsDies = playerDies;
playerDies = () => { if (TS_RUN) TS_DEAD = true; _tsDies(); };

const _bedTS = FURN_ACTS.bed;
FURN_ACTS.bed = F => [..._bedTS(F), ['🌌 นอนข้ามเวลา (ข้ามได้หลายปี)', timeSkipMenu]];

ACH.push(['longsleep', '🌌 หลับข้ามปี', 'นอนข้ามเวลารวม 5 ปีขึ้นไป', () => (tsState().years || 0) >= 5]);

console.assert(typeof tsSleep === 'function' && typeof timeSkipMenu === 'function', 'time skip ready');
