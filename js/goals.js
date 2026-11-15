'use strict';
// First-day checklist: four small goals shown inside the HUD on day one only.
// They teach movement, eating, talking and the journal without a wall of tutorial text.
const GOAL_DEFS = () => [
  ['eat', '🍙 กินอะไรสักอย่าง'],
  ['family', '👪 คุยกับพ่อหรือแม่'],
  ['town', '🚪 ออกไปเดินในเมือง'],
  ['journal', '📖 เปิดสมุดบันทึก (J)'],
];
const GO = () => st.goals || (st.goals = { d: 0, done: {} });
function goalsForToday() {
  const g = GO(); if (g.d !== day()) { g.d = day(); g.done = {}; }
  return g;
}
const goalsActive = () => !!player && day() === 1 && Object.keys(goalsForToday().done).length < GOAL_DEFS().length;
function goalDone(id) {
  const g = goalsForToday();
  if (!goalsActive() || g.done[id]) return;
  g.done[id] = 1; save();
  const left = GOAL_DEFS().length - Object.keys(g.done).length;
  const label = (GOAL_DEFS().find(x => x[0] === id) || [, id])[1];
  toast(left ? `✅ ${label} · เหลืออีก ${left}` : '🎉 ครบทุกเป้าหมายวันนี้แล้ว!');
}
function dayGoalsMarkup() {
  if (!goalsActive()) return '';
  const g = goalsForToday();
  return `<div class="goals"><div class="gh">เป้าหมายวันแรก</div>${GOAL_DEFS().map(([id, t]) => `<div class="${g.done[id] ? 'go' : 'gn'}">${g.done[id] ? '✅' : '⬜'} ${t}</div>`).join('')}</div>`;
}
const _eatGoal = eat; eat = id => { _eatGoal(id); goalDone('eat'); };
const _talkGoal = talk; talk = (p, ...a) => { _talkGoal(p, ...a); if (p && p.fam) goalDone('family'); };
const _journalGoal = journal; journal = (tab) => { goalDone('journal'); _journalGoal(tab); };
const _enterGoal = enter; enter = (sc, ...a) => { _enterGoal(sc, ...a); if (sc === town) goalDone('town'); };
const _startGoal = start;
start = saved => {
  if (!saved) st.goals = { d: day(), done: {} };
  _startGoal(saved);
};
console.assert(GOAL_DEFS().length === 4, 'four first-day goals');
