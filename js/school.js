'use strict';
// School years 6–17 (grades 1–12): classes, homework, a seasonal exam, report cards, graduation. Plus age gates for jobs and dating.
const SCH = BUILDINGS.find(b => b.act === 'school');
const SUBJECTS = [['คณิต', 'logic'], ['ศิลปะ', 'art'], ['พละ', 'fit'], ['วิทย์', 'logic'], ['อ่าน', 'charm']];
const sch = () => st.school || (st.school = { hw: 0, done: 0, missed: 0, pts: 0, att: 0, absent: 0, exams: [] });
const gradeLevel = () => age() - 5;
const inSchool = () => age() >= 6 && age() < 18;
const letter = s => s >= 85 ? 'A' : s >= 70 ? 'B' : s >= 55 ? 'C' : s >= 40 ? 'D' : 'F';
const REWARD = { A: 200, B: 100, C: 50, D: 0, F: 0 };

function attend() {
  const S = sch(), h = hour();
  if (weekday() >= 5) return say('วันหยุดเสาร์-อาทิตย์ ไม่มีเรียน');
  if (S.att === day()) return say('วันนี้เข้าเรียนแล้ว');
  if (h < 7 || h >= 11) return say('คาบเรียนเริ่มระหว่าง 07:00–11:00');
  if (st.energy < 20) return say('เหนื่อยเกินไปสำหรับเรียน — พักก่อน');
  const [subj, skill] = SUBJECTS[weekday()], left = 15 * 60 - (st.min % 1440);
  fade(() => {
    if (S.hw) { S.missed++; fx({ mood: -5 }); toast('📝 ครู: ยังไม่ได้ส่งการบ้านเลยนะ!'); }
    S.att = day(); S.pts++; S.hw = 1;
    tick(Math.max(60, left)); fx({ energy: -10, food: 25, mood: 2 }); xp(skill, 22);
    say(`เรียน${subj}จบแล้ว ได้การบ้านใหม่! (ทำที่โต๊ะหรือชั้นหนังสือ)`);
    save();
  }, 700);
}
function takeExam(q) {   // q = quiz score 0..1 once the exam quiz is done
  const S = sch(), h = hour();
  if (seasonOf().d !== 7) return say('สอบจะจัดในวันสุดท้ายของแต่ละฤดู');
  if (S.examDay === day()) return say('วันนี้สอบแล้ว');
  if (h < 8 || h >= 15) return say('ห้องสอบเปิด 08:00–15:00');
  if (q === undefined) return startMini('quiz', { n: 5, title: '📄 สอบประจำฤดู' }, s => takeExam(s));
  fade(() => {
    const score = Math.max(0, Math.min(100, Math.round(40 + lv('logic') * 5 + S.pts * 2 + S.done * 3 - S.missed * 5 - S.absent * 4 + q * 15)));
    const g = letter(score), pay = REWARD[g];
    S.examDay = day(); S.exams.push({ day: day(), score, g, grade: gradeLevel() }); S.pts = S.missed = S.done = S.absent = 0;
    tick(120); fx({ energy: -10, mood: g === 'F' ? -20 : g === 'D' ? -5 : 10 });
    if (pay) { fx({ money: pay }); toast(`🏅 ผลการเรียน: ${g} (${score}) — พ่อกับแม่ให้เงิน ฿${pay}`); }
    else toast(`📄 ผลการเรียน: ${g} (${score}) — ${g === 'F' ? 'ต้องตั้งใจเรียนมากกว่านี้!' : 'ผ่านแบบเฉียดฉิว'}`);
    save();
  }, 700);
}
function homework() {
  const S = sch();
  if (!S.hw) return say('ตอนนี้ไม่มีการบ้าน 🎉');
  S.hw = 0; S.done++; fx({ energy: -6, mood: -2 }); xp('logic', 15); tick(45); say('ทำการบ้านเสร็จแล้ว ✅');
}
town.targets.push({ x: SCH.ix, y: SCH.iy, name: 'โรงเรียน', get opts() {
  if (inSchool()) return [['เข้าเรียน (เริ่ม 07:00–11:00)', attend], ['สอบประจำฤดู', takeExam],
    ['เล่นช่วงพัก', () => { if (hour() < 9 || hour() >= 15) return say('พักกลางวันอยู่ในเวลาเรียน'); fx({ mood: 12, energy: -3 }); xp('fit', 6); xp('charm', 8); tick(30); say('เล่นไล่จับกับเพื่อน ๆ!'); }]];
  return [['เรียนภาคค่ำ ฿80 (18:00–21:00)', () => { if (hour() < 18 || hour() >= 21) return say('เรียนภาคค่ำ 18:00–21:00'); if (st.money < 80) return say('เงินไม่พอ'); fx({ money: -80, energy: -8 }); xp('logic', 40); tick(120); say('ได้เรียนรู้สิ่งใหม่'); }]];
} });

// homework can be done at the bookshelf or the PC
for (const k of ['shelf', 'pc']) { const f = FURN_ACTS[k]; FURN_ACTS[k] = F => [...f(F), ...(inSchool() ? [['ทำการบ้าน', homework]] : [])]; }
// age gates: no freelancing under 13, no jobs under 16, romance only between adults
const _pc = FURN_ACTS.pc; FURN_ACTS.pc = F => _pc(F).filter(o => !(age() < 13 && o[0].includes('ฟรีแลนซ์')));
const _jobOpts = jobOpts; jobOpts = jid => age() < 16 ? [['อายุยังน้อย (ต้อง 16+)', () => say('ต้องอายุ 16 ปีขึ้นไปจึงจะทำงานได้')]] : _jobOpts(jid);
const _po = personOpts;
personOpts = p => _po(p).filter(o => !/เดท|สารภาพ/.test(o[0]) || (age() >= 18 && p.age >= 18 && Math.abs(p.age - age()) <= 10));

const _lifeTick = lifeTick;
lifeTick = () => {
  _lifeTick();
  const S = sch();
  if (inSchool() && hour() >= 16 && st.schChk !== day()) {
    st.schChk = day();
    if (weekday() < 5 && S.att !== day()) { S.absent++; fx({ mood: -8 }); toast('📞 โรงเรียนโทรหาพ่อแม่ — คุณโดดเรียน!'); }
    if (seasonOf().d === 7 && S.examDay !== day()) { S.exams.push({ day: day(), score: 0, g: 'F', grade: gradeLevel() }); S.pts = S.missed = S.done = 0; fx({ mood: -20 }); toast('📄 คุณพลาดการสอบ: F'); }
  }
  if (age() >= 18 && !st.grad) { st.grad = 1; fx({ money: 500, mood: 30 }); toast('🎓 จบการศึกษาแล้ว! พ่อกับแม่ให้เงิน ฿500 ถึงเวลาเริ่มชีวิตผู้ใหญ่!'); }
};
ACH.push(['grad', '🎓 จบการศึกษา', 'เรียนจบตอนอายุ 18', () => !!st.grad], ['honor', '🏅 นักเรียนดีเด่น', 'สอบได้เกรด A', () => (st.school?.exams || []).some(e => e.g === 'A')]);

function schoolRows() {
  const S = sch();
  if (!inSchool()) return [row('🎓', st.grad ? 'จบการศึกษาแล้ว!' : 'ไม่ได้อยู่ในโรงเรียน', st.grad ? 'โรงเรียนเปิดเรียนภาคค่ำ' : 'เริ่มเรียนตอนอายุ 6 ขวบ')];
  return [row('🏫', `ชั้น ${gradeLevel()} (อายุ ${age()})`, `${SUBJECTS.map(s => s[0]).join(' · ')} จ–ศ`),
    row(S.hw ? '📝' : '✅', S.hw ? 'มีการบ้านต้องส่ง!' : 'ไม่มีการบ้าน', S.hw ? 'ส่งในคาบถัดไป — ทำที่โต๊ะหรือชั้นหนังสือ' : 'เก่งมาก'),
    row('📈', `เทอมนี้: เรียน ${S.pts} · การบ้าน ${S.done} · ไม่ส่ง ${S.missed} · ขาดเรียน ${S.absent}`, 'สอบวันสุดท้ายของทุกฤดู'),
    el('div', { className: 'sec' }, 'ผลการเรียน'), ...(S.exams.length ? S.exams.slice(-6).reverse().map(e => row(e.g === 'A' ? '🏅' : e.g === 'F' ? '❌' : '📄', `ชั้น ${e.grade}: ${e.g} (${e.score})`, `วันที่ ${e.day}`)) : [el('div', { className: 'sub' }, 'ยังไม่มีผลสอบ')])];
}
console.assert(SCH && SUBJECTS.length === 5, 'school building and subjects exist');
