'use strict';
// Civic simulation: a town budget, approval, elections, active policies, and projects built over several days.
const HALL = BUILDINGS.find(b => b.act === 'hall');
const T0 = () => {
  const t = st.town || (st.town = {});
  if (!Number.isFinite(t.funds)) t.funds = 800;
  if (!Number.isFinite(t.tax)) t.tax = 1;
  t.tax = Math.max(0, Math.min(2, t.tax | 0));
  t.built ||= {}; t.policies ||= {}; t.mayor ||= 'npc';
  if (!Array.isArray(t.log)) t.log = [];
  if (!Array.isArray(t.budgetLog)) t.budgetLog = [];
  if (!Number.isFinite(t.debt)) t.debt = 0;
  if (!Number.isFinite(t.approval)) t.approval = 50;
  if (t.project && !PROJECTS[t.project.id]) t.project = null;
  return t;
};

const PROJECTS = {
  lights: { n: '💡 ไฟถนน', cost: 600, days: 3, effects: { safety: 10 } },
  police: { n: '👮 สถานีตำรวจ', cost: 1500, days: 6, effects: { safety: 14 } },
  school: { n: '🏫 ปรับปรุงโรงเรียน', cost: 1200, days: 5, effects: { education: 12 } },
  library: { n: '📚 งบห้องสมุดประชาชน', cost: 800, days: 4, effects: { education: 7, happiness: 2 } },
  park: { n: '🌳 ปรับปรุงสวนสาธารณะ', cost: 900, days: 4, effects: { happiness: 8, environment: 5 } },
  recycle: { n: '♻️ โครงการรีไซเคิล', cost: 700, days: 3, effects: { environment: 12 } },
  clinic: { n: '🏥 งบคลินิก', cost: 1000, days: 5, effects: { happiness: 4, safety: 3, environment: 3 } },
  market: { n: '🎪 งบงานตลาดนัด', cost: 800, days: 3, effects: { happiness: 6, economy: 4 } },
  bus: { n: '🚌 ขนส่งสาธารณะ', cost: 1800, days: 7, effects: { economy: 10, environment: 3 } },
  fountain: { n: '⛲ น้ำพุกลางลานเมือง', cost: 1100, days: 5, effects: { happiness: 7 } },
  wifi: { n: '📶 ไวไฟเมืองฟรี', cost: 900, days: 4, effects: { economy: 6, education: 4 } },
};
const TAX = [['ต่ำ', .5, 6, -4], ['กลาง', 1, 0, 0], ['สูง', 1.6, -8, 6]];
const STATS = { happiness: '😊 ความสุข', economy: '💹 เศรษฐกิจ', safety: '🛡️ ความปลอดภัย', education: '🎓 การศึกษา', environment: '🌿 สิ่งแวดล้อม' };
const POLICIES = {
  market: [
    { id: 'smallbiz', n: 'กองทุนร้านเล็ก', cost: 450, upkeep: 18, effects: { economy: 5 }, demand: .18, desc: 'เพิ่มลูกค้าให้ธุรกิจในเมือง' },
    { id: 'nightmarket', n: 'ตลาดเย็นชุมชน', cost: 650, upkeep: 26, effects: { economy: 8, happiness: 2 }, demand: .28, desc: 'ลูกค้าเพิ่มมาก แต่ใช้งบดูแลสูง' },
  ],
  jobs: [
    { id: 'training', n: 'ฝึกทักษะอาชีพ', cost: 500, upkeep: 16, effects: { education: 6 }, wage: .12, desc: 'ค่าจ้างงานประจำและงานพิเศษ +12%' },
    { id: 'livingwage', n: 'ค่าแรงเป็นธรรม', cost: 700, upkeep: 28, effects: { happiness: 5, economy: 2 }, wage: .2, desc: 'ค่าจ้าง +20% แต่ใช้งบมาก' },
  ],
  green: [
    { id: 'greentransit', n: 'รถรับส่งสีเขียว', cost: 600, upkeep: 20, effects: { environment: 8, economy: 2 }, demand: .06, desc: 'เมืองสะอาดขึ้นและเดินทางง่าย' },
    { id: 'streetlights', n: 'ถนนปลอดภัยยามค่ำ', cost: 500, upkeep: 18, effects: { safety: 6 }, desc: 'เพิ่มความปลอดภัยในชุมชน' },
  ],
  community: [
    { id: 'festivalfund', n: 'งบเทศกาลชุมชน', cost: 550, upkeep: 22, effects: { happiness: 6 }, festival: true, desc: 'ร่วมกิจกรรมเทศกาลแล้วได้ความสุขและสนิทเพิ่ม' },
    { id: 'communitycare', n: 'กองทุนดูแลชุมชน', cost: 750, upkeep: 25, effects: { happiness: 8, safety: 2 }, desc: 'เพิ่มความสุขและความปลอดภัยของเมือง' },
  ],
};
const POLICY_GROUPS = { market: 'เศรษฐกิจและร้านค้า', jobs: 'งานและค่าแรง', green: 'โครงสร้างพื้นฐาน', community: 'ชุมชนและกิจกรรม' };
const policyById = id => Object.values(POLICIES).flat().find(p => p.id === id);
const activePolicies = () => Object.values(T0().policies).map(policyById).filter(Boolean);
const citizens = () => PEOPLE.filter(p => !st.gone?.[p.id]).length;
const townClamp = n => Math.max(0, Math.min(100, Math.round(n)));

function stat(k) {
  const t = T0(); let v = 40 + (k === 'happiness' ? TAX[t.tax][2] : k === 'economy' ? TAX[t.tax][3] : 0);
  for (const [id, built] of Object.entries(t.built)) if (built && PROJECTS[id]) v += PROJECTS[id].effects[k] || 0;
  for (const p of activePolicies()) v += p.effects[k] || 0;
  if (k === 'economy' && st.biz) v += Math.min(8, (st.biz.rep || 0) / 12);
  return townClamp(v);
}
const townScore = () => Math.round(Object.keys(STATS).reduce((a, k) => a + stat(k), 0) / 5);
function civicBizBoost(d = day()) {
  const t = T0(); let boost = activePolicies().reduce((n, p) => n + (p.demand || 0), 0);
  if (t.built.market) boost += .08;
  if (t.built.bus) boost += .05;
  return 1 + boost;
}
function civicJobPayMult() { return 1 + activePolicies().reduce((n, p) => n + (p.wage || 0), 0); }
function civicFestivalBonus() {
  if (!activePolicies().some(p => p.festival)) return;
  fx({ mood: 4 });
  if (typeof crowdBond === 'function') crowdBond(1);
  const t = T0(); t.approval = Math.min(100, t.approval + .2);
}

const _xpMulCivic = xpMul; xpMul = s => _xpMulCivic(s) * (1 + stat('education') / 400);
const evW = (id, mul) => { const e = EVENTS.find(e => e.id === id); if (e) e.w = e.base * mul; };
for (const e of EVENTS) e.base = e.w;

function civicLog(text) {
  const t = T0(); t.log.unshift({ d: day(), text }); if (t.log.length > 12) t.log.length = 12;
}
function startProject(id, sponsor = 'player') {
  const t = T0(), p = PROJECTS[id];
  if (!p || t.built[id]) return false;
  if (t.project) { if (sponsor === 'player') say('กำลังก่อสร้างโครงการอื่นอยู่'); return false; }
  if (t.funds < p.cost) { if (sponsor === 'player') say('กองทุนเมืองมีไม่พอ'); return false; }
  t.funds -= p.cost;
  t.project = { id, progress: 0, days: p.days, sponsor, started: day() };
  civicLog(`เริ่มโครงการ ${p.n.replace(/^\S+\s/, '')} · ${p.days} วัน`);
  toast(`🏗️ เริ่ม ${p.n} — ใช้เวลาประมาณ ${p.days} วัน`);
  save();
  return true;
}
function finishProject(t) {
  const p = t.project, def = p && PROJECTS[p.id]; if (!def) { t.project = null; return; }
  t.built[p.id] = 1; t.project = null; t.approval = Math.min(100, t.approval + 3);
  civicLog(`เปิดใช้ ${def.n.replace(/^\S+\s/, '')}`);
  toast(`🏙️ ${def.n} สร้างเสร็จแล้ว! เมืองได้รับผลดี`);
  save();
}
function enactPolicy(id) {
  const t = T0(), p = policyById(id); if (!p) return;
  const group = Object.keys(POLICIES).find(k => POLICIES[k].some(x => x.id === id));
  if (t.policies[group] === id) return say('นโยบายนี้กำลังใช้อยู่แล้ว');
  if (t.funds < p.cost) return say('กองทุนเมืองมีงบไม่พอสำหรับนโยบายนี้');
  const prior = policyById(t.policies[group]);
  t.funds -= p.cost; t.policies[group] = id;
  t.approval = townClamp(t.approval + (p.effects.happiness || p.effects.economy ? 2 : 1));
  civicLog(`${prior ? 'เปลี่ยนนโยบาย' : 'ประกาศนโยบาย'} ${p.n}`);
  toast(`📜 เริ่มนโยบาย ${p.n} · ดูแลงบ ฿${p.upkeep}/วัน`);
  save(); refreshPanel();
}
function changeTax(i) {
  const t = T0(); if (!TAX[i] || t.tax === i) return;
  const before = TAX[t.tax], after = TAX[i];
  t.tax = i; t.approval = townClamp(t.approval + (after[2] - before[2]) * .45);
  civicLog(`ปรับภาษีเป็น${after[0]}`); save(); refreshPanel();
}

function mayorDaily() {
  const t = T0(); if (t.day === day()) return; t.day = day();
  const revenue = Math.round(citizens() * 8 * TAX[t.tax][1]);
  const maintenance = Object.keys(t.built).filter(id => t.built[id] && PROJECTS[id]).length * 20;
  const policyCost = activePolicies().reduce((n, p) => n + p.upkeep, 0);
  const expenses = maintenance + policyCost, operating = revenue - expenses;
  t.funds += operating;
  if (t.funds < 0) { t.debt += -t.funds; t.funds = 0; }
  const debtPaid = operating > 0 ? Math.min(t.debt, Math.floor(operating * .25), t.funds) : 0;
  t.debt -= debtPaid; t.funds -= debtPaid;
  t.lastBudget = { d: day(), revenue, maintenance, policyCost, operating, debtPaid };
  t.budgetLog.unshift(t.lastBudget); if (t.budgetLog.length > 7) t.budgetLog.length = 7;

  if (t.project) { t.project.progress++; if (t.project.progress >= t.project.days) finishProject(t); }
  const targetApproval = townScore();
  t.approval = townClamp(t.approval + Math.max(-.45, Math.min(.45, (targetApproval - t.approval) * .035)) + (operating < 0 ? -.3 : .03));
  evW('thief', 1 - (stat('safety') - 40) / 100);
  evW('flu', 1 - (stat('environment') - 40) / 120);
  evW('found', 1 + (stat('economy') - 40) / 100);
  if (stat('happiness') >= 60 && Math.random() < .5) fx({ mood: 2 });
  if (t.mayor === 'player') st.money += 100;

  const s = seasonOf();
  if (s.d === 7 && t.mayor !== 'player' && !t.project) {
    const options = Object.keys(PROJECTS).filter(id => !t.built[id] && PROJECTS[id].cost <= t.funds);
    if (options.length) startProject(options[Math.floor(Math.random() * options.length)], 'council');
  }
  const y = yearsPassed(); if (t.term !== y) { t.term = y; election(); }
}
function election() {
  const t = T0(), alive = PEOPLE.filter(p => !st.gone?.[p.id]);
  const cands = alive.filter(p => p.age >= 25 && p.age < 70).sort(() => Math.random() - .5).slice(0, 2).map(p => ({ id: p.id, n: p.n, sup: .25 + Math.random() * .3 }));
  if (t.runs) {
    const avg = alive.reduce((a, p) => a + (st.rel[p.id]?.f || 0) / 100 - (st.rel[p.id]?.h || 0) / 80, 0) / Math.max(1, alive.length);
    cands.push({ id: 'player', n: st.name, sup: avg * .9 + lv('charm') * .03 + t.campaign / 4000 + (townScore() - 50) / 200 + (t.approval - 50) / 180 });
  }
  cands.sort((a, b) => b.sup - a.sup); const w = cands[0];
  t.mayor = w.id === 'player' ? 'player' : 'npc'; t.mayorId = w.id; t.runs = false; t.campaign = 0;
  civicLog(`${w.n} ชนะการเลือกตั้งเป็นนายกเทศมนตรี`);
  toast(w.id === 'player' ? '🗳️ คุณชนะการเลือกตั้ง! คุณคือนายกเทศมนตรีคนใหม่ของเมืองพิกเซล!' : `🗳️ ${w.n} คือนายกเทศมนตรีคนใหม่${cands.some(c => c.id === 'player') ? ' — คุณแพ้การเลือกตั้ง' : ''}`);
  save();
}
const _sTCivic = seasonTick; seasonTick = () => { _sTCivic(); mayorDaily(); };

function budgetRows(t) {
  const b = t.lastBudget;
  if (!b) return [el('div', { className: 'sub' }, 'งบประมาณรายวันจะแสดงหลังผ่านเวลาในเกม')];
  return [row('📥', `รายรับวันนี้ ฿${b.revenue}`, `ภาษี${TAX[t.tax][0]} · ประชาชน ${citizens()} คน`),
    row('📤', `รายจ่ายวันนี้ ฿${b.maintenance + b.policyCost}`, `ดูแลเมือง ฿${b.maintenance} · นโยบาย ฿${b.policyCost}`),
    row(b.operating >= 0 ? '📈' : '📉', `ดุลดำเนินงาน ${b.operating >= 0 ? '+' : ''}฿${b.operating}`, `ชำระหนี้ ฿${b.debtPaid} · หนี้คงเหลือ ฿${Math.round(t.debt)}`)];
}
function hallPanel() {
  openPanel('🏛️ ศาลากลาง', () => {
    const t = T0(), mayor = t.mayor === 'player' ? 'คุณ' : PEOPLE.find(p => p.id === t.mayorId)?.n || 'สภาเมือง';
    const rows = [row('🏙️', `เมืองพิกเซล — คะแนน ${townScore()}/100`, `นายกฯ: ${mayor} · ประชาชน ${citizens()} · คลัง ฿${Math.round(t.funds)} · ความนิยม ${Math.round(t.approval)}%`),
      ...Object.entries(STATS).map(([k, n]) => row('', n, el('div', { className: 'bar', style: 'width:140px' }, el('i', { style: `width:${stat(k)}%;background:#7ee07e` })), el('span', {}, String(stat(k))))),
      el('div', { className: 'sec' }, 'งบประมาณเมือง — 7 วันล่าสุด'), ...budgetRows(t),
      ...(t.budgetLog.length > 1 ? t.budgetLog.slice(1).map(b => row('🗓️', `วันที่ ${b.d}: ${b.operating >= 0 ? '+' : ''}฿${b.operating}`, `รายรับ ฿${b.revenue} · รายจ่าย ฿${b.maintenance + b.policyCost}`)) : []),
      row('💝', 'บริจาคเข้ากองทุนเมือง', 'ช่วยให้สภามีงบทำโครงการ', ...[100, 500].map(n => btn(`฿${n}`, () => { if (st.money < n) return say('เงินไม่พอ'); st.money -= n; t.funds += n; st.civic = (st.civic || 0) + n; fx({ mood: 4 }); save(); refreshPanel(); }, st.money < n)))];

    if (t.project) {
      const p = PROJECTS[t.project.id], pct = Math.min(100, Math.round(t.project.progress / t.project.days * 100));
      rows.push(el('div', { className: 'sec' }, '🚧 กำลังก่อสร้าง'), row('🏗️', p.n, `ความคืบหน้า ${t.project.progress}/${t.project.days} วัน · ${t.project.sponsor === 'player' ? 'โครงการนายกฯ' : 'โครงการสภาเมือง'}`,
        el('div', { className: 'bar', style: 'width:150px' }, el('i', { style: `width:${pct}%;background:#ffe08a` }))));
    }
    if (t.log.length) rows.push(el('div', { className: 'sec' }, 'บันทึกการเมือง'), ...t.log.slice(0, 4).map(x => row('📜', x.text, `วันที่ ${x.d}`)));

    if (t.mayor === 'player') {
      rows.push(el('div', { className: 'sec' }, `ห้องทำงานนายกฯ — ภาษี: ${TAX[t.tax][0]} (รายได้ ×${TAX[t.tax][1]})`),
        row('📊', 'อัตราภาษี', 'ภาษีสูงเพิ่มรายรับ แต่กดความสุขประชาชน', ...TAX.map((x, i) => el('button', { style: t.tax === i ? 'border-color:var(--gold)' : '', textContent: x[0], onclick: () => changeTax(i) }))));

      rows.push(el('div', { className: 'sec' }, '📜 นโยบาย — เลือกได้หมวดละ 1 นโยบาย'));
      for (const [group, title] of Object.entries(POLICY_GROUPS)) {
        const current = policyById(t.policies[group]);
        rows.push(el('div', { className: 'sub' }, `${title}${current ? ` · ใช้อยู่: ${current.n}` : ' · ยังไม่มีนโยบาย'}`));
        for (const p of POLICIES[group]) {
          const effects = Object.entries(p.effects).map(([k, v]) => `${STATS[k].split(' ')[1]} +${v}`).join(' · ');
          rows.push(row(p.id === t.policies[group] ? '✅' : '📜', p.n, `${p.desc} · ${effects} · ฿${p.upkeep}/วัน`,
            p.id === t.policies[group] ? el('span', {}, 'ใช้อยู่') : btn(`ประกาศ ฿${p.cost}`, () => enactPolicy(p.id), t.funds < p.cost)));
        }
      }

      rows.push(el('div', { className: 'sec' }, '🏗️ โครงการเมือง — ใช้เวลาหลายวันกว่าจะเปิดใช้'));
      for (const [id, p] of Object.entries(PROJECTS)) {
        const effects = Object.entries(p.effects).map(([k, v]) => `${STATS[k].split(' ')[1]} +${v}`).join(' · ');
        rows.push(row(p.n.split(' ')[0], p.n.split(' ').slice(1).join(' '), `${effects} · ${p.days} วัน · ดูแล ฿20/วัน`,
          t.built[id] ? el('span', {}, '✅ สร้างแล้ว') : btn(`เริ่ม ฿${p.cost}`, () => { if (startProject(id)) refreshPanel(); }, !!t.project || t.funds < p.cost)));
      }
    } else {
      const yrLeft = YEAR - ((day() - 1) % YEAR);
      rows.push(el('div', { className: 'sec' }, '🗳️ การเลือกตั้ง'), row('🏛️', 'ลงสมัครนายกฯ', `เปิดรับใน 7 วันสุดท้ายของปี (เหลือ ${yrLeft} วัน) · อายุ 25+ · ความนิยมเมือง ${Math.round(t.approval)}% มีผลต่อคะแนนเสียง`,
        btn(t.runs ? 'หาเสียง ฿300' : 'สมัคร ฿200', () => { if (age() < 25) return say('ต้องอายุ 25 ปีขึ้นไป'); if (yrLeft > 7 && !t.runs) return say('เปิดรับสมัครใน 7 วันสุดท้ายของปี'); const c = t.runs ? 300 : 200; if (st.money < c) return say('เงินไม่พอ'); st.money -= c; if (t.runs) { t.campaign += c; xp('charm', 12); } t.runs = true; save(); refreshPanel(); }, st.money < (t.runs ? 300 : 200))));
    }
    return rows;
  });
}
town.targets.push({ x: HALL.ix, y: HALL.iy, name: 'ศาลากลาง', opts: [['รายงานเมืองและรัฐบาล', hallPanel]] });
ACH.push(['mayor', '🏛️ นายกเทศมนตรี', 'ชนะการเลือกตั้ง', () => T0().mayor === 'player' || T0().mayorId === 'player'], ['civic', '💝 พลเมืองใจดี', 'บริจาค ฿1,000 ให้เมือง', () => (st.civic || 0) >= 1000], ['utopia', '🏙️ เมืองในฝัน', 'คะแนนเมือง 80+', () => townScore() >= 80]);
console.assert(Object.values(PROJECTS).every(p => p.days > 0 && Object.keys(p.effects).every(k => STATS[k])), 'project data valid');
console.assert(Object.values(POLICIES).flat().every(p => p.cost > 0 && p.upkeep >= 0 && Object.keys(p.effects).every(k => STATS[k])), 'policy data valid');
console.assert(HALL, 'town hall building');
