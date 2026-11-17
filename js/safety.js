'use strict';
// Phase 7 — safety and quality of life. The town's safety stat used to be a number on the hall
// panel; now it varies by place and hour, changes night crime, warns the player, and feeds a
// city panel with projects, policies and the class picture.

// ---- where and when it is safe ------------------------------------------------------------------
const safeNear = (k, r) => { const a = ANCHORS[k]; return a && Math.hypot(player.x - a[0] * T, player.y - a[1] * T) < r; };
function safetyAt(x = player?.x || 0, y = player?.y || 0) {
  let v = stat('safety');
  const h = hour(), night = h >= 19 || h < 6;
  const near = (k, r) => { const a = ANCHORS[k]; return a && Math.hypot(x - a[0] * T, y - a[1] * T) < r; };
  if (night) {
    v -= 16;
    if (near('plaza', 300)) v += 12;                 // lanterns and people around the square
    if (near('cafe', 240)) v += 7;
    if (near('mart', 240)) v += 5;
    if (near('park', 300)) v -= 10;                  // dark trees by the pond
    if (near('school', 260) || near('library', 260)) v -= 5;
  } else v += 6;
  if (player && typeof copNear === 'function' && copNear(240)) v += 22;
  if (typeof WANT === 'function' && WANT().lv) v -= 10;   // you are the one being watched
  return Math.max(0, Math.min(100, Math.round(v)));
}
const safetyLabel = v => v < 25 ? 'อันตราย' : v < 45 ? 'ระวังตัว' : v < 65 ? 'พอใช้' : 'ปลอดภัย';
const nightRiskMul = () => {
  const s = safetyAt();
  return Math.max(.15, Math.min(2.4, 1.7 - s / 65));
};

// ---- safety projects and policies ---------------------------------------------------------------
PROJECTS.cctv = { n: '📹 กล้องวงจรปิด', cost: 700, days: 3, effects: { safety: 8, equality: 2 } };
POLICIES.community.push({ id: 'patrol', n: 'ลาดตระเวนชุมชน', cost: 450, upkeep: 16, effects: { safety: 7 }, desc: 'เพิ่มความปลอดภัยยามค่ำคืน' });

// ---- moodlet and nightly warning ------------------------------------------------------------------
MOODLETS.uneasy = ['🌙', 'ระวังตัวยามค่ำ', -3, 6];
const _updSafe = update;
update = dt => {
  _updSafe(dt);
  if (!player || scene !== town || busy || menuOpen || panelOpen || mg) return;
  const h = hour(); if (!(h >= 21 || h < 5)) return;
  if (st.safeNight === day()) return;
  const v = safetyAt();
  if (v < 35) {
    st.safeNight = day();
    addMood('uneasy', 6);
    if (typeof stressAdd === 'function') stressAdd(4);
    toast('🌙 ถนนสายนี้มืดและเงียบ… ระวังตัวด้วย');
  }
};
const _hudSafe = drawHud;
drawHud = () => {
  _hudSafe();
  if (!player || scene !== town) return;
  const d = hud.querySelector('.details'); if (!d) return;
  const h = hour(), v = safetyAt(), night = h >= 19 || h < 6;
  d.insertAdjacentHTML('beforeend', `<div class="row" style="font-size:12px"><span>🛡️ ความปลอดภัย</span><span>${night ? '🌙 ' : ''}${v} · ${safetyLabel(v)}</span></div>`);
};

// ---- daily town mood ----------------------------------------------------------------------------
function safetyDaily() {
  if (st.safeDay === day()) return; st.safeDay = day();
  const s = stat('safety');
  if (s < 35) townNews('🌙 คืนนี้ย่านตลาดเงียบผิดปกติ มีคนถูกสะกดรอย…');
  else if (s >= 70 && day() % 5 === 0) townNews('🛡️ เมืองปลอดภัยขึ้น ชาวบ้านออกมาเดินเล่นยามค่ำ');
}
const _seasonSafe = seasonTick; seasonTick = () => { _seasonSafe(); safetyDaily(); };

// ---- phone: city and quality of life ------------------------------------------------------------
APP.city = () => {
  const t = T0(), mayor = t.mayor === 'player' ? 'คุณ' : (PEOPLE.find(p => p.id === t.mayorId)?.n || 'สภาเมือง');
  const h = hour(), night = h >= 19 || h < 6, v = safetyAt();
  const built = Object.entries(t.built).filter(([, b]) => b).map(([id]) => PROJECTS[id]?.n).filter(Boolean);
  const policies = activePolicies().map(p => p.n);
  const rows = [
    el('div', { className: 'sec' }, '🏙️ ภาพรวมเมือง'),
    row('🏛️', `เมืองพิกเซล — คะแนน ${townScore()}/100`, `นายกฯ: ${mayor} · ประชาชน ${citizens()} · คลัง ฿${Math.round(t.funds)} · ความนิยม ${Math.round(t.approval)}%`),
    ...Object.entries(STATS).map(([k, n]) => row('', n, el('div', { className: 'bar', style: 'width:120px' }, el('i', { style: `width:${stat(k)}%;background:#7ee07e` })), el('span', {}, String(stat(k))))),
    el('div', { className: 'sec' }, '🛡️ ความปลอดภัยคืนนี้'),
    row(night ? '🌙' : '☀️', `จุดที่คุณอยู่: ${v}/100 — ${safetyLabel(v)}`, night ? 'กลางคืนอันตรายกว่าเดิม ยิ่งแถวสวนสาธารณะ' : 'กลางวันผู้คนเยอะ ความเสี่ยงต่ำ'),
    row('🚔', 'ปัจจัย', `สถานะเมือง ${stat('safety')}/100${player && typeof copNear === 'function' && copNear(240) ? ' · มีตำรวจอยู่ใกล้' : ' · ไม่มีตำรวจใกล้'} · อาชญากรรมกลางคืน ×${nightRiskMul().toFixed(2)}`),
    row('🌳', 'พื้นที่เสี่ยง', 'สวนสาธารณะและถนนบ้านนอกตอนกลางคืน · ลานเมือง/คาเฟ่ปลอดภัยกว่า'),
  ];
  if (typeof clsSplit === 'function') {
    const split = clsSplit(), total = split.reduce((a, b) => a + b, 0) || 1;
    rows.push(el('div', { className: 'sec' }, '👥 ชนชั้นทางสังคม'));
    rows.push(...CLS.map(c => row(c.ic, `${c.n} — ${split[c.id]} คน`, `${Math.round(split[c.id] / total * 100)}% ของเมือง`)));
    rows.push(row('⚖️', 'ความเท่าเทียม', `${stat('equality')}/100 · ช่องว่างฐานะ ${inequality()}/100`));
  }
  if (t.project) {
    const p = PROJECTS[t.project.id], pct = Math.min(100, Math.round(t.project.progress / t.project.days * 100));
    rows.push(el('div', { className: 'sec' }, '🚧 กำลังก่อสร้าง'), row('🏗️', p.n, `${t.project.progress}/${t.project.days} วัน`, el('div', { className: 'bar', style: 'width:120px' }, el('i', { style: `width:${pct}%;background:#ffe08a` }))));
  }
  rows.push(row('🏗️', 'สิ่งที่สร้างแล้ว', built.length ? built.join(' · ') : 'ยังไม่มีโครงการที่สร้างเสร็จ'));
  rows.push(row('📜', 'นโยบายที่ใช้อยู่', policies.length ? policies.join(' · ') : 'ยังไม่มีนโยบาย'));
  rows.push(el('div', { className: 'sec' }, '🧰 คุณภาพชีวิต'));
  rows.push(row('🏠', 'เดินกลับบ้านอย่างปลอดภัย', 'กลับถึงบ้านทันที ใช้เวลา 10 นาที', btn('กลับบ้าน', () => {
    closePanel();
    fade(() => { tick(10); enter(home, homeDoor().x, homeDoor().y - 40, 0); say('กลับถึงบ้านอย่างปลอดภัย 🏠'); }, 500);
  }, scene !== town)));
  rows.push(row('🏛️', 'รายงานเมืองฉบับเต็ม', 'งบประมาณ โครงการ และนโยบาย', btn('เปิดศาลากลาง', () => hallPanel())));
  return rows;
};
APPS.push(['city', '🏙️', 'เมือง']);

ACH.push(['nightowl', '🌙 ระวังตัวยามค่ำ', 'เดินกลางคืนในย่านที่ความปลอดภัยต่ำกว่า 35', () => !!st.safeNight]);

// ---- self-check ---------------------------------------------------------------------------------
console.assert(typeof safetyAt === 'function' && safetyAt() >= 0 && safetyAt() <= 100, 'safety index in range');
console.assert(typeof nightRiskMul() === 'number' && nightRiskMul() > 0, 'night risk multiplier valid');
