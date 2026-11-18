'use strict';
// Small, low-pressure ways to build a relationship before the existing romance milestones.
const datingStage = p => {
  const score = Math.round(relOf(p.id).f || 0);
  if (st.spouse === p.id) return { name: 'คู่ชีวิต', next: 100, hint: 'ดูแลความสัมพันธ์และใช้เวลาด้วยกัน' };
  if (st.partner === p.id) return { name: 'คนรัก', next: 95, hint: 'สนิทถึง 95 และมีแหวนเพชรเพื่อขอแต่งงาน' };
  if (!romanceable(p)) return { name: 'เพื่อน', next: 10, hint: 'จีบได้เฉพาะชาวเมืองที่เป็นผู้ใหญ่ (18+) และยังอยู่ในเมือง' };
  if (score >= 20) return { name: 'พร้อมเป็นแฟน', next: 20, hint: 'เลือก “สารภาพรัก” ได้เลย — ไม่ต้องใช้ดอกไม้หรือของขวัญ' };
  if (score >= 10) return { name: 'เดตได้แล้ว', next: 20, hint: 'ชวนเดตฟรี หรือคุยอีกครั้งแล้วสารภาพรัก' };
  return { name: 'คนรู้จัก', next: 10, hint: 'คุยอีก 1 ครั้งก็ชวนเดตได้แล้ว' };
};

function datingProgressPanel(p) {
  const r = relOf(p.id), score = Math.max(0, Math.min(100, Math.round(r.f || 0)));
  const stage = datingStage(p);
  const eligible = romanceable(p);
  const nextHint = !eligible
    ? (p.age < 18 ? 'ต้องเป็นผู้ใหญ่ 18+ ทั้งสองฝ่าย' : 'คนนี้ยังไม่พร้อมเปิดใจ')
    : stage.hint;
  const progress = el('div', { style: 'height:10px;background:rgba(120,150,160,.22);border-radius:99px;overflow:hidden;margin:8px 0 4px' },
    el('div', { style: `height:100%;width:${score}%;background:linear-gradient(90deg,#68b8a7,#f08db6);border-radius:99px;transition:width .3s` }));
  openPanel(`💞 ความสัมพันธ์กับ${p.n}`, () => [
    el('div', { className: 'sec' }, stage.name),
    el('div', { className: 'sub' }, `ความสนิท ${score}/100`), progress,
    el('div', { className: 'sub' }, `ขั้นต่อไป: ${nextHint}`),
    eligible && (!st.partner || st.partner === p.id) && score >= 10 ? btn('ชวนไปเดตฟรี 💕', () => { closePanel(); date(p); }) : null,
    eligible && !st.partner && score >= 20 ? btn('สารภาพรัก 💘', () => { closePanel(); confess(p); }) : null,
    eligible && p.mate ? el('div', { className: 'sub' }, `ตอนนี้ ${p.n} มีคู่แล้ว — ถ้าสารภาพรัก ความสัมพันธ์เดิมจะจบลง`) : null,
    !eligible ? el('div', { className: 'sub' }, 'ตัวเลือกความรักจะปลดล็อกสำหรับ NPC ผู้ใหญ่') : null,
  ]);
}

function casualWalkDate(p) {
  const r = relOf(p.id);
  if (r.casualWalkDay === day()) return say(`วันนี้เดินเล่นกับ${p.n}แล้ว ไว้ชวนกันใหม่พรุ่งนี้นะ`);
  r.casualWalkDay = day();
  const before = r.f || 0;
  r.f = Math.min(100, before + 8);
  fx({ mood: 10, energy: -2 });
  tick(30);
  if (typeof remember === 'function') remember(p.id, 'walk', 1, 'เดินเล่นด้วยกัน');
  say(`${p.n}: “เดินเล่นด้วยกันเพลินดีนะ ไว้ไปอีก!” · ความสนิท +${r.f - before}`);
  if (typeof save === 'function') save();
}

const _personOptsDating = personOpts;
personOpts = p => {
  const opts = _personOptsDating(p);
  if (!p || p.fam || p.id === st.partner || p.id === st.spouse || st.gone?.[p.id]) return opts;
  opts.push(['💞 ดูความสัมพันธ์และขั้นต่อไป', () => datingProgressPanel(p)]);
  opts.push([relOf(p.id).casualWalkDay === day() ? '🚶 เดินเล่นแล้ววันนี้' : '🚶 เดินเล่นด้วยกันฟรี', () => casualWalkDate(p)]);
  return opts;
};

console.assert(typeof datingProgressPanel === 'function' && typeof casualWalkDate === 'function', 'dating helper ready');
