'use strict';
// Online careers and the online job board. Five remote career tracks (programmer, game
// developer, content creator, streamer, designer) work from the home PC, and a daily
// board posts four paid online gigs. Existing local jobs keep working unchanged.

const TECH_JOBS = {
  programmer: { n: 'โปรแกรมเมอร์', icon: '⌨️', at: 'ที่บ้าน (คอมพิวเตอร์)', start: 8, end: 22, skill: 'logic', remote: 1,
    titles: ['จูเนียร์โปรแกรมเมอร์', 'โปรแกรมเมอร์', 'ซีเนียร์โปรแกรมเมอร์', 'หัวหน้าทีมวิศวกร', 'สถาปนิกระบบ'],
    pay: [150, 220, 320, 450, 650], req: [0, 2, 4, 6, 8], tasks: ['เขียนโค้ดฟีเจอร์ใหม่', 'แก้บั๊กที่ค้างอยู่', 'รีวิวโค้ดของทีม'] },
  gamedev: { n: 'นักพัฒนาเกม', icon: '🎮', at: 'ที่บ้าน (คอมพิวเตอร์)', start: 9, end: 23, skill: 'logic', remote: 2,
    titles: ['เด็กฝึกทีมเกม', 'นักพัฒนาเกม', 'นักพัฒนาเกมอาวุโส', 'หัวหน้าทีมเกม', 'ผู้อำนวยการสร้าง'],
    pay: [170, 250, 360, 500, 720], req: [0, 2, 4, 6, 8], tasks: ['ประกอบฉากเกม', 'ปรับบาลานซ์เกม', 'ทดสอบและปล่อยอัปเดต'] },
  creator: { n: 'ครีเอเตอร์ยูทูป', icon: '🎬', at: 'ที่บ้าน (คอมพิวเตอร์)', start: 7, end: 23, skill: 'art', remote: 1,
    titles: ['ช่องใหม่ป้ายแดง', 'ครีเอเตอร์', 'ครีเอเตอร์ยอดนิยม', 'ครีเอเตอร์ระดับท็อป', 'เจ้าพ่อคอนเทนต์'],
    pay: [120, 190, 280, 400, 600], req: [0, 2, 4, 6, 8], tasks: ['เขียนสคริปต์คลิป', 'ตัดต่อคลิปใหม่', 'ถ่ายคลิปและลงช่อง'] },
  streamer: { n: 'สตรีมเมอร์', icon: '📺', at: 'ที่บ้าน (คอมพิวเตอร์)', start: 10, end: 23, skill: 'charm', remote: 1,
    titles: ['สตรีมเมอร์มือใหม่', 'สตรีมเมอร์ขาประจำ', 'สตรีมเมอร์ยอดนิยม', 'พาร์ทเนอร์ช่องใหญ่', 'ตำนานไลฟ์'],
    pay: [110, 180, 270, 390, 580], req: [0, 2, 4, 6, 8], tasks: ['เปิดไลฟ์พูดคุย', 'เล่นเกมกับคนดู', 'จัดกิจกรรมแจกของ'] },
  designer: { n: 'นักออกแบบกราฟิก', icon: '🎨', at: 'ที่บ้าน (คอมพิวเตอร์)', start: 8, end: 22, skill: 'art', remote: 1,
    titles: ['เด็กฝึกออกแบบ', 'นักออกแบบ', 'นักออกแบบอาวุโส', 'ผู้อำนวยการศิลป์', 'หัวหน้าสตูดิโอ'],
    pay: [140, 210, 300, 430, 620], req: [0, 2, 4, 6, 8], tasks: ['ร่างแบบโลโก้', 'ทำชุดภาพประกอบ', 'นำเสนองานให้ลูกค้า'] },
};
for (const [id, J] of Object.entries(TECH_JOBS)) JOBS[id] = J;

const techState = () => st.tech || (st.tech = { gigs: { d: 0, done: {} }, rep: 0, shifts: 0 });
const techRank = () => {
  const r = techState().rep;
  return r >= 60 ? '🌟 ตำนานฟรีแลนซ์' : r >= 40 ? '🏆 ท็อปฟรีแลนซ์' : r >= 24 ? '🔥 มืออาชีพ' : r >= 12 ? '💼 ฟรีแลนซ์เต็มตัว' : r >= 4 ? '🌱 เริ่มมีผลงาน' : '🐣 มือใหม่';
};
const techFans = () => techState().rep * 15;

// ---- daily online gig board ----
const ONLINE_POOL = [
  { id: 'clip', n: 'ตัดต่อคลิป YouTube', ic: '🎬', skill: 'art', req: 0, base: 80, mins: 60, energy: 10, at: 'ช่องยูทูป' },
  { id: 'thumb', n: 'ทำปกคลิปให้ช่องเกม', ic: '🖼️', skill: 'art', req: 0, base: 60, mins: 45, energy: 8, at: 'ช่องเกม' },
  { id: 'script', n: 'เขียนสคริปต์คลิป 10 นาที', ic: '📝', skill: 'logic', req: 0, base: 70, mins: 60, energy: 9, at: 'ช่องยูทูป' },
  { id: 'roblox', n: 'สร้างเกมเล็กใน Roblox Studio', ic: '🧱', skill: 'logic', req: 1, base: 130, mins: 120, energy: 15, at: 'ทีมเกม indie' },
  { id: 'bugfix', n: 'แก้บั๊กให้เกมอินดี้', ic: '🐛', skill: 'logic', req: 1, base: 105, mins: 90, energy: 13, at: 'ทีมเกม indie' },
  { id: 'website', n: 'เขียนเว็บให้ร้านค้าในเมือง', ic: '🌐', skill: 'logic', req: 2, base: 150, mins: 120, energy: 14, at: 'ร้านค้าในเมือง' },
  { id: 'logo', n: 'ออกแบบโลโก้ให้สตรีมเมอร์', ic: '🎨', skill: 'art', req: 1, base: 95, mins: 75, energy: 10, at: 'สตรีมเมอร์' },
  { id: 'voice', n: 'พากย์เสียงโฆษณาสั้น', ic: '🎙️', skill: 'charm', req: 0, base: 85, mins: 60, energy: 9, at: 'สตูดิโอโฆษณา' },
  { id: 'stream', n: 'ช่วยสตรีมเปิดตัวเกม', ic: '📺', skill: 'charm', req: 1, base: 120, mins: 90, energy: 12, at: 'ทีมเกม indie' },
  { id: 'music', n: 'ทำเพลงประกอบเกม', ic: '🎵', skill: 'art', req: 2, base: 160, mins: 120, energy: 12, at: 'ทีมเกม indie' },
  { id: 'translate', n: 'แปลบทความเกมเป็นไทย', ic: '🌏', skill: 'logic', req: 0, base: 75, mins: 70, energy: 8, at: 'นิตยสารเกม' },
  { id: 'qa', n: 'ทดสอบเกมก่อนเปิดตัว', ic: '🕹️', skill: 'logic', req: 0, base: 65, mins: 55, energy: 9, at: 'ทีมเกม indie' },
  { id: 'montage', n: 'ทำไฮไลต์สตรีม 3 นาที', ic: '✂️', skill: 'art', req: 1, base: 100, mins: 80, energy: 10, at: 'สตรีมเมอร์' },
  { id: 'coach', n: 'สอนเล่นเกมให้มือใหม่', ic: '🎓', skill: 'charm', req: 0, base: 70, mins: 60, energy: 8, at: 'คอมมูนิตี้เกม' },
];
function onlineToday() {
  const d = day(), out = [], used = new Set();
  for (let k = 0; out.length < 4 && k < 60; k++) {
    const g = ONLINE_POOL[Math.floor(hash01(d * 83 + k * 41) * ONLINE_POOL.length)];
    if (used.has(g.id)) continue;
    used.add(g.id); out.push(g);
  }
  return out;
}
const onlineDone = g => { const T = techState(); return T.gigs.d === day() && !!T.gigs.done[g.id]; };
function onlineMini(g) {
  if (g.skill === 'logic') return ['quiz', { title: `${g.ic} ${g.n}`, n: 3 }];
  if (g.skill === 'art') return ['simon', { title: `${g.ic} ${g.n}`, len: 3 + Math.floor(lv('art') / 4), items: [['แดง', '#c8402e'], ['น้ำเงิน', '#3a6ad8'], ['เหลือง', '#c8a020'], ['เขียว', '#3a9a4a']] }];
  return ['bar', { title: `${g.ic} ${g.n}`, steps: [['รับบรีฟ', '💬'], ['ลงมือทำ', g.ic], ['ส่งงาน', '✅']], speed: .95, w: .24 }];
}
function startOnline(g) {
  if (!onlineToday().some(x => x.id === g.id)) return say('งานนี้ออกจากกระดานแล้ว — ดูงานใหม่พรุ่งนี้');
  if (onlineDone(g)) return say('งานนี้ส่งวันนี้แล้ว พรุ่งนี้มีงานใหม่');
  if (lv(g.skill) < g.req) return say(`ต้องมีทักษะ${SKILLS[g.skill][0]} เลเวล ${g.req} ขึ้นไป`);
  if (st.energy < g.energy) return say(`เหนื่อยเกินไป ต้องใช้แรง ${g.energy} — ไปพักก่อน`);
  closePanel();
  const [mini, cfg] = onlineMini(g);
  startMini(mini, cfg, s => {
    const pay = Math.round((g.base + lv(g.skill) * 14) * (.72 + .5 * s) * (st.mood >= 70 ? 1.12 : 1) * (typeof civicJobPayMult === 'function' ? civicJobPayMult() : 1));
    const T = techState(), d = day();
    if (T.gigs.d !== d) { T.gigs.d = d; T.gigs.done = {}; }
    T.gigs.done[g.id] = 1; T.rep += 1 + (g.req >= 2 ? 1 : 0);
    fx({ money: pay, energy: -g.energy, mood: s >= .7 ? 5 : 2 }); xp(g.skill, 12 + Math.round(10 * s)); tick(g.mins);
    st.stats.onlineGigs = (st.stats.onlineGigs || 0) + 1;
    say(`ส่งงานออนไลน์แล้ว! ได้ ฿${pay} · ${SKILLS[g.skill][0]} +ประสบการณ์`);
    toast(`🌐 งานออนไลน์สำเร็จ · ผลงาน +${g.req >= 2 ? 2 : 1}`);
    checkAch(); save(); refreshPanel();
  });
}
function techBody() {
  const T = techState(), out = [money(),
    row('🏅', `ผลงาน ${T.rep} ชิ้น`, `${techRank()} · ผู้ติดตาม ${techFans()} คน`),
    el('div', { className: 'sub' }, 'งานออนไลน์เปลี่ยนทุกวัน — ส่งงานได้วันละ 1 ครั้งต่องาน ทำจากที่ไหนก็ได้')];
  const d = day(); if (T.gigs.d !== d) { T.gigs.d = d; T.gigs.done = {}; }
  const list = onlineToday();
  out.push(el('div', { className: 'sec' }, `งานวันนี้ (${list.filter(g => T.gigs.done[g.id]).length}/4)`));
  for (const g of list) {
    const done = !!T.gigs.done[g.id], locked = lv(g.skill) < g.req;
    const b = btn(locked ? `ต้อง ${SKILLS[g.skill][0]} Lv.${g.req}` : 'รับงาน', () => startOnline(g), locked || st.energy < g.energy);
    b.dataset.gig = g.id;
    out.push(row(g.ic, g.n, `${g.at} · ${SKILLS[g.skill][1]} · ${g.mins} นาที · ใช้แรง ${g.energy} · ฿${g.base}+${g.req ? ` · ต้อง Lv.${g.req}` : ''}`,
      done ? el('span', { className: 'sub' }, 'ส่งแล้ว ✅') : b));
  }
  out.push(el('div', { className: 'sec' }, 'อาชีพสายออนไลน์'));
  const J = st.job && JOBS[st.job.id];
  if (J?.remote) out.push(row(J.icon || '💻', `ปัจจุบัน: ${J.titles[st.job.lv]}`, `ผลงานกะนี้ ${st.job.perf.toFixed(1)}/${perfNeed(st.job.lv)} · ฿${J.pay[st.job.lv]}/กะ · ทำงานที่คอมในบ้าน`));
  else out.push(el('div', { className: 'sub' }, 'ยังไม่มีงานสายออนไลน์ — เลือกสมัครด้านล่าง แล้วไปทำงานที่คอมพิวเตอร์ในบ้าน'));
  for (const [id, J2] of Object.entries(TECH_JOBS)) {
    if (st.job?.id === id) continue;
    const b = btn('สมัคร', () => applyCareer(id), age() < 16); b.dataset.job = id;
    out.push(row(J2.icon, J2.n, `${J2.titles[0]} → ${J2.titles[4]} · ${SKILLS[J2.skill][0]} · เริ่ม ฿${J2.pay[0]}/กะ`, b));
  }
  out.push(el('div', { className: 'sub' }, 'สมัครแล้วกลับบ้าน ใช้คอมพิวเตอร์เลือก "เริ่มกะงานออนไลน์" · ยิ่งผลงานเยอะ ยิ่งได้ค่าจ้างและผู้ติดตามเพิ่ม'));
  return out;
}
const onlinePanel = () => openPanel('🌐 งานออนไลน์', techBody);

// ---- working a remote shift from the home PC ----
function techShift() {
  const J = st.job && JOBS[st.job.id];
  if (!J?.remote) return say('ยังไม่มีงานสายออนไลน์ — เปิดแอปงานออนไลน์เพื่อสมัครก่อน');
  if (age() < 16) return say('ต้องอายุ 16 ปีขึ้นไปจึงจะทำงานได้');
  if (hour() < J.start || hour() >= J.end - 1) return say(`เข้ากะได้ ${J.start}:00–${J.end - 1}:00`);
  if (st.job.day === day()) return say('วันนี้ทำงานไปแล้ว พรุ่งนี้ค่อยมาใหม่');
  if (st.energy < 25) return say('เหนื่อยเกินไป ไปพักก่อน');
  closePanel(); tryShift();
}
const _finishTechShift = finishShift;
finishShift = () => {
  const J = st.job && JOBS[st.job.id];
  _finishTechShift();
  if (J?.remote && st.job) {
    const T = techState();
    T.rep += 1 + (J.remote === 2 ? 1 : 0); T.shifts++;
    st.stats.techShifts = (st.stats.techShifts || 0) + 1;
    setTimeout(() => toast(`🌐 ผลงานออนไลน์ +${1 + (J.remote === 2 ? 1 : 0)} · ${techRank()}`), 700);
    checkAch(); save();
  }
};

// ---- PC menu and career app integration ----
const _pcTech = FURN_ACTS.pc;
FURN_ACTS.pc = F => {
  const J = st.job && JOBS[st.job.id], out = [..._pcTech(F)];
  if (J?.remote) out.unshift([`${J.icon || '💻'} เริ่มกะ ${J.titles[st.job.lv]}`, techShift]);
  out.push(['🌐 เปิดกระดานงานออนไลน์', onlinePanel]);
  return out;
};
const _workTech = APP.work;
APP.work = () => {
  const out = _workTech();
  out.push(el('div', { className: 'sec' }, 'อาชีพสายออนไลน์ · ทำงานจากบ้าน'),
    el('div', { className: 'sub' }, `ผลงาน ${techState().rep} ชิ้น · ${techRank()} · ผู้ติดตาม ${techFans()} คน`),
    btn('🌐 เปิดกระดานงานออนไลน์', onlinePanel));
  return out;
};
APP.online = techBody;
APPS.push(['online', '🌐', 'งานออนไลน์']);

// Remote jobs are listed in the online section, not the local job list.
const _jobOptsTech = jobOpts;
jobOpts = jid => JOBS[jid]?.remote ? [] : _jobOptsTech(jid);

ACH.push(
  ['online1', '🌐 งานออนไลน์แรก', 'ส่งงานออนไลน์ 1 ครั้ง', () => (st.stats.onlineGigs || 0) >= 1],
  ['online10', '🌐 ฟรีแลนซ์ขาประจำ', 'ส่งงานออนไลน์ครบ 10 ครั้ง', () => (st.stats.onlineGigs || 0) >= 10],
  ['techshift', '💻 คนทำงานรีโมต', 'ทำงานสายออนไลน์ครบ 1 กะ', () => (st.stats.techShifts || 0) >= 1],
  ['techpro', '🏆 มืออาชีพตัวจริง', 'มีผลงานออนไลน์ 40 ชิ้น', () => techState().rep >= 40],
);

console.assert(Object.values(TECH_JOBS).every(J => J.titles.length === 5 && J.pay.length === 5 && J.req.length === 5 && SKILLS[J.skill]), 'tech career data valid');
console.assert(ONLINE_POOL.every(g => SKILLS[g.skill] && g.base > 0 && g.mins > 0), 'online gig data valid');
