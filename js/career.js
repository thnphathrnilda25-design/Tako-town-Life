'use strict';
// Careers and odd jobs. The phone's new "งาน" app shows your job, the promotion ladder and
// two paid odd jobs each day. Odd jobs are accepted in the app and worked at the workplace.

const GIG_POOL = [
  { id: 'cafe_prep', place: 'cafe', at: 'คาเฟ่', start: 8, end: 15, skill: 'cook', min: 14, base: 55, n: 'ช่วยเตรียมของในคาเฟ่' },
  { id: 'cafe_serve', place: 'cafe', at: 'คาเฟ่', start: 10, end: 18, skill: 'charm', min: 14, base: 65, n: 'เสิร์ฟลูกค้าช่วงเที่ยง' },
  { id: 'mart_stock', place: 'mart', at: 'มินิมาร์ท', start: 9, end: 20, skill: 'charm', min: 14, base: 60, n: 'จัดชั้นสินค้า' },
  { id: 'mart_check', place: 'mart', at: 'มินิมาร์ท', start: 13, end: 21, skill: 'logic', min: 14, base: 70, n: 'ช่วยเช็คสต็อก' },
  { id: 'office_file', place: 'office', at: 'ออฟฟิศ', start: 10, end: 16, skill: 'logic', min: 16, base: 80, n: 'เรียงเอกสารให้ออฟฟิศ' },
  { id: 'office_guest', place: 'office', at: 'ออฟฟิศ', start: 9, end: 15, skill: 'charm', min: 16, base: 75, n: 'ต้อนรับแขกที่ออฟฟิศ' },
];
const GIG_JOB = { barista: 'cafe', clerk: 'mart', office: 'office' };
const gigById = id => GIG_POOL.find(g => g.id === id);
const gigToday = () => st.gig && st.gig.d === day() ? st.gig : null;
const gigActive = g => { const m = gigToday(); return !!m && m.id === g.id; };
function gigsToday() {
  const d = day(), out = [], used = new Set();
  for (let k = 0; out.length < 2 && k < 16; k++) {
    const g = GIG_POOL[Math.floor(hash01(d * 37 + k * 101) * GIG_POOL.length)];
    if (used.has(g.place)) continue;
    used.add(g.place); out.push(g);
  }
  if (out.length < 2) for (const g of GIG_POOL) {
    if (used.has(g.place)) continue;
    used.add(g.place); out.push(g);
    if (out.length === 2) break;
  }
  return out;
}

function gigInfo(g) {
  openPanel(`📋 ${g.n}`, () => [
    row(SKILLS[g.skill][1], g.n, `${g.at} · ${g.start}:00–${g.end}:00`),
    el('div', { className: 'sub' }, `ค่าจ้างพื้นฐาน ฿${g.base} + โบนัสตามทักษะ${SKILLS[g.skill][0]} · ใช้เวลา 1 ชม. · เหนื่อย 15`),
    el('div', { className: 'sub' }, `รับได้ตั้งแต่อายุ ${g.min} ปี · วันละ 1 งาน`),
    btn('รับงานนี้', () => { closePanel(); acceptGig(g); }, age() < g.min),
  ]);
}
function acceptGig(g) {
  if (age() < g.min) return say(`งานนี้ต้องอายุ ${g.min} ปีขึ้นไป`);
  if (gigToday()) return say(st.gig.done ? 'วันนี้ทำงานพิเศษแล้ว พรุ่งนี้ค่อยมาใหม่' : 'วันนี้รับงานพิเศษไว้แล้ว');
  st.gig = { id: g.id, d: day(), done: false };
  toast(`🧰 รับงานพิเศษ: ${g.n} · ไปที่${g.at} ${g.start}:00–${g.end}:00`);
  save(); refreshPanel();
}
function startGig(g) {
  if (!gigActive(g)) return say('ยังไม่ได้ลงทะเบียนงานนี้');
  if (st.gig.done) return say('งานนี้ทำเสร็จแล้ว');
  if (hour() < g.start) return say(`งานนี้เริ่ม ${g.start}:00`);
  if (hour() >= g.end) return say('งานนี้เลยเวลาทำแล้ว');
  if (st.energy < 15) return say('เหนื่อยเกินไป ไปพักก่อน');
  closePanel();
  startMini('bar', { title: `🧰 ${g.n}`, steps: [1, 2, 3].map(i => [`ขั้นที่ ${i}`, '🧰']), speed: .95, w: .24 + lv(g.skill) * .02 }, s => {
    const pay = Math.round((g.base + lv(g.skill) * 10) * (.75 + .45 * s) * (st.mood >= 70 ? 1.1 : 1) * (typeof civicJobPayMult === 'function' ? civicJobPayMult() : 1));
    fx({ money: pay, energy: -15, mood: 2 }); xp(g.skill, 16 + 4 * lv(g.skill)); tick(60);
    const m = gigToday(); if (m && m.id === g.id) m.done = true;   // the day may roll over during the mini-game
    st.stats.gigs = (st.stats.gigs || 0) + 1;
    say(`งานพิเศษเสร็จ! ได้ ฿${pay} · ${SKILLS[g.skill][0]} +XP`);
    toast('🧰 งานพิเศษสำเร็จ'); checkAch(); save();
  });
}
function gigOpts(jid) {
  const g = gigsToday().find(x => x.place === GIG_JOB[jid]);
  if (!g) return [];
  const mine = gigToday();
  if (mine && mine.id === g.id) {
    if (mine.done) return [['✅ งานพิเศษวันนี้เสร็จแล้ว', () => say('วันนี้ทำงานพิเศษแล้ว พรุ่งนี้มีงานใหม่')]];
    if (hour() < g.start) return [[`⌛ งานพิเศษเริ่ม ${g.start}:00`, () => say(`งานนี้เริ่ม ${g.start}:00–${g.end}:00`)]];
    if (hour() >= g.end) return [[`⌛ งานพิเศษเลยเวลา (${g.start}:00–${g.end}:00)`, () => say('งานนี้เลยเวลาทำแล้ว พรุ่งนี้มาดูงานใหม่')]];
    return [[`🧰 ทำงานพิเศษ: ${g.n}`, () => startGig(g)]];
  }
  if (mine) return [];
  return [[`📋 งานพิเศษวันนี้: ${g.n}`, () => gigInfo(g)]];
}
// add odd-job options to the existing workplace menus without touching their job options
const _jobOptsCareer = jobOpts;
jobOpts = jid => {
  const base = _jobOptsCareer(jid), gigs = gigOpts(jid);
  const mine = st.gig && st.gig.d === day() && !st.gig.done, g = mine && gigById(st.gig.id);
  const ready = g && hour() >= g.start && hour() < g.end;
  return ready && gigs.length ? [...gigs, ...base] : [...base, ...gigs];
};

// ---- career app ----
function applyCareer(jid) {
  const J = JOBS[jid];
  if (age() < 16) return say('ต้องอายุ 16 ปีขึ้นไปจึงจะสมัครงานประจำได้');
  if (st.job?.id === jid) return say('คุณทำงานนี้อยู่แล้ว');
  const set = () => {
    st.job = { id: jid, lv: 0, perf: 0, day: 0 };
    toast(`💼 เริ่มงานเป็น${J.titles[0]} ที่${J.at}`); save(); refreshPanel();
  };
  if (st.job) openMenu(`ลาออกจาก${JOBS[st.job.id].n} แล้วสมัครเป็น${J.n}?`, [['ยืนยัน', set]]);
  else set();
}
function quitCareer() {
  if (!st.job) return;
  const J = JOBS[st.job.id];
  openMenu(`ลาออกจาก${J.n}?`, [['ยืนยันลาออก', () => { st.job = null; toast(`📝 ลาออกจาก${J.n} แล้ว`); save(); }]]);
}
function careerApp() {
  const out = [el('div', { className: 'sub' }, 'ศูนย์อาชีพ — งานประจำ งานพิเศษ และเส้นทางเลื่อนขั้น')];
  const J = st.job && JOBS[st.job.id];
  if (J) {
    const L = st.job.lv, worked = st.job.day === day(), inWindow = hour() >= J.start && hour() < J.end - 1;
    out.push(row('💼', J.titles[L], `${J.n} @${J.at} · ฿${J.pay[L]}/กะ`));
    out.push(el('div', { className: 'sub' }, `กะ ${J.start}:00–${J.end}:00${J.weekdays ? ' (จ-ศ)' : ' (ทุกวัน)'} · ${worked ? 'วันนี้ทำงานแล้ว ✅' : inWindow ? 'เข้ากะได้เลย!' : 'ยังไม่ถึงเวลา/เลยกะแล้ว'}`));
    if (L < 4) {
      const need = perfNeed(L), ok = lv(J.skill) >= J.req[L + 1];
      out.push(row('📈', `ผลงาน ${st.job.perf.toFixed(1)} / ${need}`,
        el('div', {}, el('div', { className: 'bar' }, el('i', { style: `width:${Math.min(100, st.job.perf / need * 100)}%;background:#7ee07e` })),
          `${SKILLS[J.skill][0]} Lv ${lv(J.skill)}/${J.req[L + 1]}${ok ? ' ✅' : ' ⬜'}`)));
    } else out.push(row('👑', 'ตำแหน่งสูงสุดแล้ว', 'ยังทำงานต่อได้เรื่อย ๆ'));
    out.push(el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' },
      btn('📖 เส้นทางอาชีพ', () => { closePanel(); journal('career'); }),
      btn('📝 ลาออก', quitCareer)));
  } else {
    out.push(el('div', { className: 'sub' }, 'ยังไม่มีงานประจำ — รับงานพิเศษก่อนก็ได้ หรือสมัครงานด้านล่าง'));
  }
  out.push(el('div', { className: 'sec' }, 'งานพิเศษวันนี้'));
  const mine = gigToday();
  for (const g of gigsToday()) {
    const isMine = !!mine && mine.id === g.id;
    const status = isMine ? (mine.done ? 'เสร็จแล้ว ✅' : `รับไว้ · ${g.at} ${g.start}:00–${g.end}:00`) : `${g.at} · ${g.start}:00–${g.end}:00`;
    out.push(row(SKILLS[g.skill][1], g.n, `${status} · ฿${g.base}+`, isMine ? null : btn('รับงาน', () => acceptGig(g), !!mine || age() < g.min)));
  }
  if (mine && !mine.done) { const g = gigById(mine.id); out.push(el('div', { className: 'sub' }, `➡️ ไปที่${g.at} แล้วเลือก "งานพิเศษ" ที่ป้ายร้าน`)); }
  if (mine?.done) out.push(el('div', { className: 'sub' }, 'วันนี้ทำงานพิเศษแล้ว — พรุ่งนี้มีงานใหม่'));
  out.push(el('div', { className: 'sec' }, st.job ? 'เปลี่ยนสายงาน' : 'สมัครงานประจำ'));
  const canWork = age() >= 16;
  if (!canWork) out.push(el('div', { className: 'sub' }, 'ต้องอายุ 16 ปีขึ้นไปจึงจะสมัครงานประจำได้ — ระหว่างนี้เรียนหนังสือหรือรับงานพิเศษก่อน'));
  for (const [jid, JJ] of Object.entries(JOBS)) {
    if (st.job?.id === jid) continue;
    out.push(row('💼', JJ.n, `${JJ.at} · ${JJ.start}:00–${JJ.end}:00 · เริ่ม ฿${JJ.pay[0]}/กะ · ${SKILLS[JJ.skill][0]}`, btn('สมัคร', () => applyCareer(jid), !canWork)));
  }
  return out;
}
APP.work = careerApp;
APPS.push(['work', '💼', 'งาน']);

// clear yesterday's accepted gig
function careerDaily() { if (st.gig && st.gig.d !== day()) st.gig = null; }
const _seasonTickCareer = seasonTick;
seasonTick = () => { _seasonTickCareer(); careerDaily(); };

ACH.push(['gig1', '🧰 งานพิเศษแรก', 'ทำงานพิเศษ 1 ครั้ง', () => (st.stats.gigs || 0) >= 1],
  ['gig10', '🧰 มือรับจ้าง', 'ทำงานพิเศษครบ 10 ครั้ง', () => (st.stats.gigs || 0) >= 10]);

console.assert(GIG_POOL.every(g => ['cafe', 'mart', 'office'].includes(g.place) && SKILLS[g.skill] && g.start < g.end), 'gig data valid');
console.assert(Object.values(GIG_JOB).every(pl => GIG_POOL.some(g => g.place === pl)), 'every job workplace has a gig');
