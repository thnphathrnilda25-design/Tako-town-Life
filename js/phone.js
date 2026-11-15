'use strict';
// Phone: Messages (invites become real meet-ups), Camera + Gallery, Shop delivery, Bank savings, Map, Calendar, Games.
ANCHORS.cinema = [38, 4];
const ph = () => st.phone || (st.phone = { msgs: {}, photos: [], orders: [], meet: null, meets: 0, day: 0, bank: { saved: 0, hist: [], start: st.money, sday: 0 }, g: 0, gday: 0 });
const contacts = () => [...PEOPLE.filter(p => !st.gone?.[p.id] && ((st.rel[p.id]?.f || 0) >= 20 || p.id === st.partner || p.id === st.spouse)),
  ...(st.parents ? [st.parents.dad, st.parents.mom].map((q, i) => ({ id: i ? 'mom' : 'dad', n: q.n + (i ? ' (แม่)' : ' (พ่อ)'), trait: q.trait, fam: 1, age: 40 })) : [])];
const unread = () => Object.values(ph().msgs).reduce((a, l) => a + l.filter(m => m.t === 'in' && m.unread).length, 0) + ph().orders.filter(o => o.arrived && !o.seen).length;
const TONE = { cheerful: 'เยี่ยมเลย! 😄', shy: '…โอเคนะ 😳', grumpy: 'อืม', smart: 'แผนน่าสนใจดี', lazy: 'zzz… โอเค', kind: 'ได้เลยจ้า 💕' };
const PLACES = { cafe: ['คาเฟ่', 15], park: ['สวนสาธารณะ', 17], cinema: ['โรงหนัง', 19] };
const push = (id, m) => { (ph().msgs[id] || (ph().msgs[id] = [])).push({ d: day(), unread: m.t === 'in', ...m }); };
const nm = id => contacts().find(c => c.id === id)?.n || id;

// ---- daily texts and meet-ups ----
function phoneDaily() {
  const P = ph(); if (P.day === day()) return; P.day = day();
  const list = contacts(), out = [];
  for (let k = 0; k < Math.min(2, list.length); k++) {
    const c = list[Math.floor(hash01(day() * 7 + k * 13) * list.length)]; if (out.includes(c.id)) continue; out.push(c.id);
    if (c.fam) push(c.id, { t: 'in', kind: 'hello', text: ['อรุณสวัสดิ์จ้ะลูก กินข้าวหรือยัง?', 'วันนี้ตั้งใจเรียนนะ!', 'มีอะไรก็โทรหาพ่อแม่ได้เสมอ'][day() % 3] });
    else if (hash01(day() + k) < .5 && (st.rel[c.id]?.f || 0) >= 30) { const pl = Object.keys(PLACES)[day() % 3]; push(c.id, { t: 'in', kind: 'invite', place: pl, hour: PLACES[pl][1], text: `วันนี้ว่างไหม? ไปเจอกันที่${PLACES[pl][0]}ช่วง ${PLACES[pl][1]}:00 กัน` }); }
    else push(c.id, { t: 'in', kind: 'hello', text: `อรุณสวัสดิ์! ${TRAIT_SAYS[c.trait]}` });
  }
  if (out.length) toast(`💬 มีข้อความใหม่ ${out.length} ข้อความ`);
  const B = P.bank; if (B.saved > 0) B.saved += Math.floor(B.saved * .01);
  B.hist.push(st.money - B.start); if (B.hist.length > 7) B.hist.shift(); B.start = st.money;
  for (const o of P.orders) if (!o.arrived && day() >= o.due) { o.arrived = true; addItem(o.id, o.n); toast(`📦 สิ่งที่สั่งมาถึงแล้ว: ${ITEMS[o.id].ic} ${ITEMS[o.id].n} ×${o.n}`); }
  P.orders = P.orders.filter(o => !o.seen || day() - o.due < 2);
}
const _slotOf3 = slotOf;
slotOf = p => { const m = ph().meet; return m && m.id === p.id && day() === m.d && hour() >= m.hour - .5 && hour() < m.hour + 2 ? m.place : _slotOf3(p); };
function phoneTick() {
  const m = ph().meet; if (!m) return;
  const p = people.find(q => q.id === m.id);
  if (day() === m.d && hour() >= m.hour && hour() < m.hour + 2 && scene === town && p && p.slot === m.place && Math.hypot(player.x - p.x, player.y - p.y) < 70) {
    relOf(m.id).f = Math.min(100, relOf(m.id).f + 8); fx({ mood: 12 }); xp('charm', 10); ph().meet = null; ph().meets = (ph().meets || 0) + 1; toast(`🤝 คุณได้เจอ ${p.n} ที่${PLACES[m.place][0]}! (ความสนิท +8)`);
  } else if (day() > m.d || (day() === m.d && hour() >= m.hour + 2)) { relOf(m.id).f = Math.max(0, relOf(m.id).f - 5); push(m.id, { t: 'in', kind: 'sulk', text: 'คุณไม่มาเลยนะ… 😞' }); ph().meet = null; toast(`😞 คุณพลาดนัดกับ ${nm(m.id)}`); }
}
const _seasonTick2 = seasonTick; seasonTick = () => { _seasonTick2(); phoneDaily(); phoneTick(); badge(); };

// ---- panel ----
let pApp = null, pChat = null;
const back = () => btn('◀ หน้าแรก', () => { pApp = pChat = null; refreshPanel(); });
const APPS = [['msg', '💬', 'ข้อความ'], ['cam', '📷', 'กล้อง'], ['gal', '🖼️', 'อัลบั้ม'], ['shop', '🛒', 'ร้านค้า'], ['bank', '🏦', 'ธนาคาร'], ['map', '🗺️', 'แผนที่'], ['cal', '📅', 'ปฏิทิน'], ['game', '🎮', 'เกม']];
function phonePanel() {
  if (busy || mg || ACT) return; pApp = null; pChat = null;
  openPanel('📱 โทรศัพท์', () => {
    if (!pApp) return [el('div', { style: 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px' }, ...APPS.map(([k, ic, n]) => el('button', { style: 'font-size:30px;padding:10px 4px;position:relative', onclick: () => { pApp = k; if (k === 'rel' && typeof pRel !== 'undefined') pRel = null; tick(1); refreshPanel(); } }, ic, el('div', { style: 'font-size:12px' }, n),
      k === 'msg' && unread() ? el('span', { style: 'position:absolute;top:2px;right:6px;background:#e84a4a;border-radius:9px;font-size:11px;padding:0 6px' }, String(unread())) : null)))];
    return [back(), ...APP[pApp]()];
  });
}
const APP = {};
APP.msg = () => {
  const P = ph();
  if (pChat) {
    const id = pChat, p = PEOPLE.find(q => q.id === id), msgs = P.msgs[id] || [], last = msgs.filter(m => m.t === 'in' && !m.replied).pop(); msgs.forEach(m => m.unread = false);
    const rs = last ? (last.kind === 'invite' ? [['ได้เลย เจอกันนะ! 😊', () => accept(id, last)], ['ขอโทษนะ เราติดธุระ', () => reply(id, last, 'ขอโทษนะ เราติดธุระ', 0)]] : last.kind === 'hello' ? [['อรุณสวัสดิ์! 😊', () => reply(id, last, 'อรุณสวัสดิ์! 😊', 4)], ['สวัสดี', () => reply(id, last, 'สวัสดี', 1)]] : [['ขอโทษจริง ๆ นะ!', () => reply(id, last, 'ขอโทษจริง ๆ นะ!', 2)]]) : [];
    const hang = p ? Object.entries(PLACES).map(([pl, [n, h]]) => [`ชวนไป${n}ตอน ${h}:00`, () => invite(id, pl)]) : [];
    return [el('div', { className: 'sec' }, nm(id)), ...msgs.slice(-8).map(m => el('div', { className: 'item', style: `grid-template-columns:1fr;${m.t === 'out' ? 'background:#3a5a8a55' : ''}` }, `${m.t === 'out' ? 'คุณ' : nm(id)}: ${m.text}`)),
      ...rs.map(([t, f]) => btn(t, f)), ...(p ? [btn('ทักทาย 👋', () => hi(id))] : []), ...hang.map(([t, f]) => btn(t, f)), btn('◀ แชท', () => { pChat = null; refreshPanel(); })];
  }
  const cs = contacts();
  return [el('div', { className: 'sec' }, 'แชท'), ...(P.meet ? [row('🤝', `นัดเจอ: ${nm(P.meet.id)}`, `${PLACES[P.meet.place][0]} เวลา ${P.meet.hour}:00 วันที่ ${P.meet.d}`)] : []),
    ...(cs.length ? cs.map(c => { const u = (P.msgs[c.id] || []).filter(m => m.t === 'in' && m.unread).length; return row(c.fam ? '👪' : '🙂', c.n, `${relName(c.id, st.rel[c.id]?.f || 0)}${u ? ` · ใหม่ ${u}` : ''}`, btn('เปิด', () => { pChat = c.id; refreshPanel(); })); }) : [el('div', { className: 'sub' }, 'สร้างมิตรภาพ (ความสนิท 20+) เพื่อขอเบอร์โทร')])];
};
function reply(id, m, text, gain) { m.replied = true; push(id, { t: 'out', text }); const r = relOf(id); if (r) r.f = Math.min(100, r.f + gain); push(id, { t: 'in', kind: 'chat', replied: true, unread: false, text: TONE[contacts().find(c => c.id === id)?.trait] || 'อิอิ' }); tick(2); refreshPanel(); }
function accept(id, m) {
  const P = ph(); if (P.meet) return say('คุณมีนัดอยู่แล้ว');
  m.replied = true; P.meet = { id, place: m.place, hour: m.hour, d: day() }; push(id, { t: 'out', text: 'ได้เลย เจอกันนะ! 😊' }); push(id, { t: 'in', replied: true, kind: 'chat', unread: false, text: 'เย้! เจอกันเร็ว ๆ นะ 💕' }); toast(`🤝 เจอ ${nm(id)} ที่${PLACES[m.place][0]} เวลา ${m.hour}:00`); refreshPanel();
}
function hi(id) { const r = relOf(id); if (r.hi === day()) return say('วันนี้ทักไปแล้ว'); r.hi = day(); r.f = Math.min(100, r.f + 2); push(id, { t: 'out', text: 'สวัสดี! สบายดีไหม? 👋' }); push(id, { t: 'in', kind: 'chat', replied: true, unread: false, text: TONE[PEOPLE.find(p => p.id === id)?.trait] || 'สวัสดี!' }); tick(2); refreshPanel(); }
function invite(id, pl) {
  const P = ph(), r = relOf(id), h = PLACES[pl][1]; if (P.meet) return say('คุณมีนัดอยู่แล้ว'); if (age() < 13) return say('ขออนุญาตพ่อแม่ก่อนนะ!');
  push(id, { t: 'out', text: `วันนี้ไป${PLACES[pl][0]}ตอน ${h}:00 กันไหม?` });
  if (r.f < 30 || hour() >= h) push(id, { t: 'in', kind: 'chat', replied: true, unread: false, text: r.f < 30 ? 'ขอโทษนะ เรายังไม่สนิทกันเท่าไร…' : 'วันนี้มันสายเกินไปแล้วล่ะ!' });
  else { P.meet = { id, place: pl, hour: h, d: day() }; push(id, { t: 'in', kind: 'chat', replied: true, unread: false, text: 'ได้เลย! เจอกันนะ 😊' }); toast(`🤝 เจอ ${nm(id)} ที่${PLACES[pl][0]} เวลา ${h}:00`); }
  tick(2); refreshPanel();
}
function snap(label) {
  const c = document.createElement('canvas'); c.width = 192; c.height = 108; c.getContext('2d').drawImage(cv, 0, 0, 192, 108);
  const P = ph(); P.photos.unshift({ img: c.toDataURL('image/jpeg', .6), d: day(), label }); P.photos = P.photos.slice(0, 18); save();
}
APP.cam = () => {
  const inNpc = typeof nRoom !== 'undefined' && scene === nRoom;
  const near = scene === town ? people.find(p => p.slot !== 'in' && Math.hypot(player.x - p.x, player.y - p.y) < 90)
    : inNpc ? (visitEnts().find(e => Math.hypot(player.x - e.x, player.y - e.y) < 90)?.p || null) : null;
  const scName = scene === home || inNpc ? 'บ้าน' : 'เมือง';
  return [el('div', { className: 'sub' }, `ฉาก: ${scName}${near ? ` · ${near.n} อยู่ใกล้ ๆ` : ''}`), btn('📸 ถ่ายรูป', () => { snap(`${scName} · ${seasonTag()}`); fx({ mood: 4 }); tick(3); say('แชะ! เก็บไว้ในอัลบั้มแล้ว'); }),
    ...(near ? [btn(`🤳 เซลฟี่กับ ${near.n}`, () => { snap(`กับ ${near.n}`); relOf(near.id).f = Math.min(100, relOf(near.id).f + 4); fx({ mood: 8 }); tick(3); say(`${near.n} ชอบรูปนี้มาก!`); })] : []), el('div', { className: 'sub' }, 'รูปจะเก็บสิ่งที่เห็นบนหน้าจอ อัลบั้มเก็บได้ 18 รูปล่าสุด')];
};
APP.gal = () => { const ps = ph().photos; return ps.length ? [el('div', { style: 'display:grid;grid-template-columns:repeat(2,1fr);gap:8px' }, ...ps.map((p, i) => el('div', {}, el('img', { src: p.img, style: 'width:100%;border-radius:6px;image-rendering:pixelated' }), el('div', { className: 'sub' }, `วันที่ ${p.d} · ${p.label}`), btn('ลบ', () => { ph().photos.splice(i, 1); refreshPanel(); }))))] : [el('div', { className: 'sub' }, 'ยังไม่มีรูป — ลองใช้กล้องสิ!')]; };
APP.shop = () => {
  const ids = [...MART_STOCK, 'ring', 'robot', 'puzzle', 'kite', 'petfood', 'medicine'].filter(id => ITEMS[id]?.p);
  return [money(), el('div', { className: 'sub' }, 'ค่าส่ง ฿20 ต่อออเดอร์ — ของถึงเช้าวันพรุ่งนี้'), ...ids.map(id => row(ITEMS[id].ic, ITEMS[id].n, `฿${ITEMS[id].p} + ค่าส่ง ฿20`, btn('สั่ง', () => { const c = ITEMS[id].p + 20; if (st.money < c) return say('เงินไม่พอ'); st.money -= c; ph().orders.push({ id, n: 1, due: day() + 1 }); say('สั่งแล้ว! 📦 ของถึงพรุ่งนี้'); refreshPanel(); save(); }, st.money < ITEMS[id].p + 20))),
    ...(ph().orders.length ? [el('div', { className: 'sec' }, 'ออเดอร์'), ...ph().orders.map(o => row('📦', `${ITEMS[o.id].n}`, o.arrived ? 'ส่งถึงแล้ว' : `ถึงวันที่ ${o.due}`))] : [])];
};
APP.bank = () => {
  const B = ph().bank, dep = n => () => {
    const avail = typeof cashOwn === 'function' ? cashOwn() : st.money;
    const a = n === 'all' ? avail : n; if (a <= 0 || avail < a) return say('เงินสดตัวเองไม่พอ');
    if (typeof walletPayOwn === 'function' && walletPayOwn) walletPayOwn(a); else st.money -= a;
    B.saved += a; refreshPanel(); save();
  }, wd = n => () => { const a = n === 'all' ? B.saved : n; if (a <= 0 || B.saved < a) return say('เงินออมไม่พอ'); B.saved -= a; st.money += a; refreshPanel(); save(); };
  const max = Math.max(50, ...B.hist.map(Math.abs));
  return [money(), row('🏦', `เงินออม: ฿${B.saved}`, 'ได้ดอกเบี้ย 1% ทุกวัน'), el('div', {}, ...[100, 500, 'all'].map(n => btn(`ฝาก ${n === 'all' ? 'ทั้งหมด' : '฿' + n}`, dep(n)))), el('div', {}, ...[100, 500, 'all'].map(n => btn(`ถอน ${n === 'all' ? 'ทั้งหมด' : '฿' + n}`, wd(n)))),
    el('div', { className: 'sec' }, 'รายรับสุทธิรายวัน (7 วันล่าสุด)'), ...(B.hist.length ? B.hist.map((h, i) => el('div', { className: 'sub' }, `${h >= 0 ? '🟢' : '🔴'} ${'█'.repeat(Math.max(1, Math.round(Math.abs(h) / max * 12)))} ${h >= 0 ? '+' : ''}฿${h}`)) : [el('div', { className: 'sub' }, 'ยังไม่มีข้อมูล — พรุ่งนี้มาดูใหม่')])];
};
APP.map = () => {
  const c = el('canvas', { width: town.W * 4, height: town.H * 4, style: 'width:100%;image-rendering:pixelated;border-radius:8px' }), x = c.getContext('2d');
  const col = ['#62b04e', '#50505e', '#cfc6b4', '#6cbf55', '#4a9ad8'];
  for (let j = 0; j < town.H; j++) for (let i = 0; i < town.W; i++) { x.fillStyle = col[town.tile[j * town.W + i]]; x.fillRect(i * 4, j * 4, 4, 4); }
  for (const b of BUILDINGS) { x.fillStyle = b.roof; x.fillRect(b.x * 4, b.y * 4, b.w * 4, b.h * 4); }
  for (const p of people) if (p.slot !== 'in' && (st.rel[p.id]?.f || 0) >= 20) { x.fillStyle = '#ffd54a'; x.fillRect(p.x / T * 4 - 1, p.y / T * 4 - 1, 3, 3); }
  if (scene === town) { x.fillStyle = '#fff'; x.fillRect(player.x / T * 4 - 2, player.y / T * 4 - 2, 5, 5); x.fillStyle = '#e84a4a'; x.fillRect(player.x / T * 4 - 1, player.y / T * 4 - 1, 3, 3); }
  return [c, el('div', { className: 'sub' }, '⚪ คุณ · 🟡 เพื่อน (ความสนิท 20+) ที่ออกมาข้างนอก'), ...BUILDINGS.filter(b => b.n).map(b => row('📍', b.n, `ช่อง ${b.x},${b.y}${b.act ? '' : ' · บ้าน'}`))];
};
APP.cal = () => {
  const s = seasonOf(), cells = [], fest = [];
  for (let d = 1; d <= 7; d++) { const gd = Math.floor((day() - 1) / 7) * 7 + d, f = festival(gd), hit = gd === day();
    cells.push(row(hit ? '👉' : '📆', `${SEASONS[s.i][0]} วันที่ ${d} (วันที่ ${gd})${f ? ` — ${f.ic} ${f.n}` : ''}`, `${WX_ICON[weatherOf(gd)]} ${weatherOf(gd)}${d === 7 ? ' · 📄 วันสอบ' : ''}${(gd - 1) % YEAR === 0 ? ' · 🎂 วันเกิด' : ''}${ph().meet && ph().meet.d === gd ? ' · 🤝 นัดเจอ' : ''}`)); }
  return [el('div', { className: 'sec' }, `${SEASONS[s.i][1]} ${SEASONS[s.i][0]} — ปีที่ ${Math.floor((day() - 1) / YEAR) + 1}`), ...cells];
};
APP.game = () => {
  const P = ph(); if (P.gday !== day()) { P.gday = day(); P.g = 0; }
  const reward = (mood, label) => s => { P.g++; if (P.g <= 3) { fx({ mood: Math.round(mood * (.4 + s)) }); } tick(20); say(`${label}: ${Math.round(s * 100)}%${P.g > 3 ? ' (เล่นมือถือมากเกินไปวันนี้ — ไม่ได้โบนัสอารมณ์)' : ''}`); };
  const play = (name, cfg, r) => () => { closePanel(); startMini(name, cfg, r); };
  return [el('div', { className: 'sub' }, `เกมในมือถือวันนี้: ${P.g}/3 (โบนัสอารมณ์เฉพาะ 3 ครั้งแรก)`),
    btn('🃏 จับคู่การ์ด', play('memory', { title: '🃏 จับคู่การ์ด' }, reward(8, 'การ์ด'))), btn('🧠 ควิซสมอง', play('quiz', { n: 4, title: '🧠 ควิซสมอง' }, reward(8, 'ควิซ'))),
    btn('🏃 วิ่งไม่รู้จบ', play('dodge', { title: '🏃 วิ่งไม่รู้จบ' }, reward(8, 'วิ่ง'))), btn('🎨 ความจำสี', play('simon', { title: '🎨 ความจำสี', len: 5, items: [['แดง', '#c8402e'], ['น้ำเงิน', '#3a6ad8'], ['เหลือง', '#c8a020'], ['เขียว', '#3a9a4a']] }, reward(8, 'สี'))),
    btn('💃 จังหวะ', play('dance', { title: '💃 จังหวะ' }, reward(10, 'จังหวะ')))];
};
const bPhone = el('button', { id: 'bPhone', title: 'โทรศัพท์ (P)', ariaLabel: 'โทรศัพท์', style: 'position:relative' }, '📱', el('span', { id: 'pBadge', hidden: true, style: 'position:absolute;top:-4px;right:-4px;background:#e84a4a;border-radius:9px;font-size:11px;padding:0 5px' }));
bPhone.onclick = () => player && !panelOpen && phonePanel(); $('dock').prepend(bPhone);
function badge() { const n = unread(), b = $('pBadge'); b.hidden = !n; b.textContent = n; }
addEventListener('keydown', e => { if (keyOf(e) === 'p' && player && !busy && !mg && !menuOpen && !ACT && !deco.on) { if (panelOpen) closePanel(); else phonePanel(); } });
ACH.push(['photo', '📷 ช่างภาพ', 'ถ่ายรูป 10 รูป', () => ph().photos.length >= 10], ['saver', '🏦 นักออม', 'ออมเงินในธนาคาร ฿1,000', () => ph().bank.saved >= 1000], ['social2', '☕ นักนัดพบ', 'นัดเจอเพื่อนครบ 5 ครั้ง', () => (ph().meets || 0) >= 5]);
console.assert(Object.keys(APP).length === APPS.length, 'every phone app has a screen');
