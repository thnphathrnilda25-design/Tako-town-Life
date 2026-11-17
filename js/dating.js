'use strict';
// Small, low-pressure ways to build a relationship before the existing romance milestones.
const datingStage = p => {
  const score = Math.round(relOf(p.id).f || 0);
  if (st.spouse === p.id) return { name: 'คู่ชีวิต', next: 100, hint: 'ดูแลความสัมพันธ์และใช้เวลาด้วยกัน' };
  if (st.partner === p.id) return { name: 'คนรัก', next: 95, hint: 'สนิทถึง 95 และมีแหวนเพชรเพื่อขอแต่งงาน' };
  if (!p.date) return { name: score >= 40 ? 'เพื่อนสนิท' : score >= 20 ? 'เพื่อน' : 'คนรู้จัก', next: score < 20 ? 20 : score < 40 ? 40 : 60, hint: 'สร้างมิตรภาพต่อไปด้วยการคุยและให้ของขวัญ' };
  if (score >= 90) return { name: 'พร้อมสารภาพรัก', next: 90, hint: 'ซื้อช่อดอกไม้ใหญ่แล้วเลือก “สารภาพรัก”' };
  if (score >= 60) return { name: 'กำลังศึกษาดูใจ', next: 90, hint: 'ชวนเดตและทำกิจกรรมด้วยกัน จากนั้นค่อยสารภาพรัก' };
  return { name: score >= 40 ? 'เพื่อนสนิท' : score >= 20 ? 'เพื่อน' : 'คนรู้จัก', next: 60, hint: 'คุยและให้ของขวัญเพื่อสนิทถึง 60 แล้วชวนเดตได้' };
};

function datingProgressPanel(p) {
  const r = relOf(p.id), score = Math.max(0, Math.min(100, Math.round(r.f || 0)));
  const stage = datingStage(p);
  const eligible = !!p.date && age() >= 18 && p.age >= 18 && !p.fam;
  const nextHint = !eligible && p.date
    ? 'การเริ่มความสัมพันธ์แบบคนรักต้องเป็นผู้ใหญ่ทั้งสองฝ่าย'
    : stage.hint;
  const progress = el('div', { style: 'height:10px;background:rgba(120,150,160,.22);border-radius:99px;overflow:hidden;margin:8px 0 4px' },
    el('div', { style: `height:100%;width:${score}%;background:linear-gradient(90deg,#68b8a7,#f08db6);border-radius:99px;transition:width .3s` }));
  openPanel(`💞 ความสัมพันธ์กับ${p.n}`, () => [
    el('div', { className: 'sec' }, stage.name),
    el('div', { className: 'sub' }, `ความสนิท ${score}/100`), progress,
    el('div', { className: 'sub' }, `ขั้นต่อไป: ${nextHint}`),
    p.date && !st.partner && score >= 60 ? btn('ชวนไปเดต ฿80', () => { closePanel(); date(p); }, st.money < 80) : null,
    !p.date ? el('div', { className: 'sub' }, 'ตัวเลือกความรักจะปลดล็อกสำหรับ NPC ผู้ใหญ่') : null,
  ]);
}

function casualWalkDate(p) {
  const r = relOf(p.id);
  if (r.casualWalkDay === day()) return say(`วันนี้เดินเล่นกับ${p.n}แล้ว ไว้ชวนกันใหม่พรุ่งนี้นะ`);
  r.casualWalkDay = day();
  const before = r.f || 0;
  r.f = Math.min(100, before + 3);
  fx({ mood: 8, energy: -2 });
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
