'use strict';
// Quests: a daily bounty board, personal favours from friends, and the main story "The Secret of Pixel Town".
Object.assign(ITEMS, { frag1: { n: 'เศษหินชิ้นที่ 1', ic: '🪨', k: 'quest' }, frag2: { n: 'เศษเงินชิ้นที่ 2', ic: '🔘', k: 'quest' }, frag3: { n: 'เศษทองชิ้นที่ 3', ic: '🟡', k: 'quest' }, crown: { n: 'มงกุฎโบราณ', ic: '👑', k: 'gift', sell: 2000, wing: 'art' } });
const Q = () => st.q || (st.q = { board: { d: 0, list: [] }, done: 0, fav: {}, story: 0, ending: null });
const addTo = (name, fn) => { for (const t of town.targets.filter(t => t.name === name)) { const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value; Object.defineProperty(t, 'opts', { get: () => [...base.call(t), ...fn()], configurable: true }); } };
function read(title, paras, after) { openPanel(title, () => [...paras.map(p => el('div', { style: 'line-height:1.5' }, p)), btn('ต่อไป', () => { closePanel(); after && after(); })]); }

// ---- bounty board ----
const FETCH = ['egg', 'veg', 'fruit', 'milk', 'flour', 'cropveg', 'carp', 'minnow', 'omelet', 'salad', 'bread', 'flower'];
function boardList() {
  const B = Q().board; if (B.d !== day()) { B.d = day(); B.list = []; for (let i = 0; i < 3; i++) { const id = FETCH[(day() * 3 + i * 5) % FETCH.length], n = 1 + (day() + i) % 3, v = (ITEMS[id].p || ITEMS[id].sell || 20) * n; B.list.push({ id, n, pay: Math.round(v * 1.8 + 20), done: 0 }); } }
  return B.list;
}
town.targets.push({ x: 17 * T + 16, y: 7 * T + 16, name: 'กระดานประกาศ', get opts() {
  return boardList().map(b => [`${b.done ? '✅' : '📌'} ส่ง ${b.n}× ${ITEMS[b.id].ic} ${ITEMS[b.id].n} → ฿${b.pay}`, () => { if (b.done) return say('วันนี้ส่งครบแล้ว'); if (have(b.id) < b.n) return say(`ต้องใช้ ${b.n}× ${ITEMS[b.id].n}`); addItem(b.id, -b.n); b.done = 1; fx({ money: b.pay }); Q().done++; xp('charm', 8); toast(`📌 ส่งของครบแล้ว! +฿${b.pay}`); tick(10); }]);
} });
// ---- friends' favours ----
const _po11 = personOpts;
personOpts = p => {
  const o = _po11(p); if (p.fam || hated(p)) return o; const r = relOf(p.id), F = Q().fav, f = F[p.id];
  if (f && !f.done) o.push([`งานฝาก: หา ${f.n}× ${ITEMS[f.id].ic} ${ITEMS[f.id].n}`, () => { if (have(f.id) < f.n) return say(`${p.n}: "เรายังต้องการ ${f.n}× ${ITEMS[f.id].n} นะ"`); addItem(f.id, -f.n); f.done = 1; r.f = Math.min(100, r.f + 10); fx({ money: f.pay, mood: 10 }); Q().done++; toast(`🤝 ${p.n} ดีใจมาก! +฿${f.pay}, ความสนิท +10`); }]);
  else if (!f && r.f >= 40) o.push(['ถามว่ามีอะไรให้ช่วยไหม 🙋', () => { const id = p.love[0], n = 1 + (p.k % 2); F[p.id] = { id, n, pay: Math.round((ITEMS[id].p || ITEMS[id].sell || 40) * n * 1.5 + 60), done: 0 }; say(`${p.n}: "จริง ๆ แล้ว… ช่วยหา ${n}× ${ITEMS[id].n} ให้หน่อยได้ไหม? เราจะขอบคุณมากเลย!"`); }]);
  if (Q().story === 2 && p.id === elderP()?.id) o.push(['ให้ดูเศษหิน 🪨', () => storyStep(2)]);
  if (Q().story === 3 && p.id === Q().elder) o.push(['ถามเรื่องตำนานเก่า 📜', () => storyStep(3)]);
  return o;
};
// ---- main story ----
const elderP = () => PEOPLE.filter(p => !st.gone?.[p.id]).sort((a, b) => b.age - a.age)[0];
const STORY = ['ตามหาจดหมายลึกลับ', 'ค้นหาที่สระน้ำ', 'คุยกับผู้ใหญ่หมู่บ้าน', 'ไขปริศนาหอจดหมายเหตุ', 'ตรวจสอบตู้แสดงในพิพิธภัณฑ์', 'เปิดห้องใต้ดิน'];
function storyActive() { return day() >= 6 && Q().story < 7; }
function storyStep(n) {
  const S = Q(); if (S.story !== n) return;
  if (n === 0) return read('✉️ จดหมายประหลาด', ['ซองจดหมายที่ไม่ติดแสตมป์ ข้างในเขียนด้วยลายมือสั่น ๆ:', '"ที่ที่ปลาคาร์ปหลับใหล หินก้อนแรกจะรออยู่ อย่าไว้ใจทุกคน — เพื่อนคนหนึ่ง"'], () => { S.story = 1; toast('📖 เนื้อเรื่องใหม่: ความลับแห่งเมืองพิกเซล'); });
  if (n === 1) return read('🎣 สระน้ำ', ['คุณคุ้ยกอหญ้าที่ขอบสระ นิ้วสัมผัสของเย็นเยือก — เศษหินแกะสลักชิ้นหนึ่ง!', 'มันแสดงครึ่งหนึ่งของตราประทับเก่า… พร้อมตัวอักษร "II"'], () => { addItem('frag1'); S.story = 2; S.elder = elderP().id; toast('🪨 พบเศษหินชิ้นที่ 1!'); });
  if (n === 2) { const e = elderP(); if ((st.rel[e.id]?.f || 0) < 20) return say(`ชาวบ้านบอกว่า ${e.n} รู้เรื่องเล่าเก่า ๆ… แต่ต้องสนิทก่อน (ความสนิท 20)`); S.elder = e.id; return read(`🧓 ${e.n}`, [`"${e.n}: เธอพบหินก้อนแรกแล้วสินะ… ฉันคิดว่าตำนานเป็นแค่เรื่องเล่า"`, '"เศษสามชิ้นเปิดห้องใต้ดินใต้โบสถ์ ชิ้นที่สองซ่อนในหอจดหมายเหตุของห้องสมุด มีปริศนากันอยู่ ส่วนชิ้นที่สามอยู่ใต้กระจกในพิพิธภัณฑ์"'], () => { S.story = 3; toast('📜 รู้ตำนานแล้ว ต่อไป: หอจดหมายเหตุห้องสมุด'); }); }
  if (n === 3) return read(`📜 ตำนาน`, [`${PEOPLE.find(p => p.id === S.elder).n} เล่าตำนานของผู้ก่อตั้งให้ฟัง…`, '"ไปที่หอจดหมายเหตุห้องสมุด ปริศนาที่นั่นทดสอบสติปัญญา — เลขคณิตซะด้วย!"'], () => { S.story = 4; toast('📚 ไปที่หอจดหมายเหตุห้องสมุด'); });
}
addTo('ห้องสมุด', () => Q().story === 4 ? [['ค้นหาหอจดหมายเหตุ 📚 (ปริศนา)', () => startMini('quiz', { n: 3, title: '📚 ปริศนาแห่งหอจดหมายเหตุ' }, s => { if (s < .66) return say('กลอนล็อกไม่ขยับ… ลองใหม่ตอนหัวใส ๆ'); read('🔘 หอจดหมายเหตุเปิดออก', ['ลิ้นชักลับเลื่อนออกมา ข้างในมีเศษเงินสลักตัวอักษร "II" — พร้อมแผนที่ที่มีกากบาทตรงพิพิธภัณฑ์'], () => { addItem('frag2'); Q().story = 5; toast('🔘 พบเศษเงินชิ้นที่ 2!'); }); })]] : []);
addTo('พิพิธภัณฑ์', () => Q().story === 5 ? [['ตรวจสอบตู้แสดงเก่า 🔍', () => { if (total() < 3) return say('ภัณฑารักษ์บอกว่า: "ตู้พิเศษจะเปิดเมื่อพิพิธภัณฑ์มีของแสดง 3 ชิ้น บริจาคของที่พบมาหน่อยนะ!"'); read('🟡 หลังกระจก', ['ภัณฑารักษ์ไขตู้แสดงเก่า ใต้ผ้าซีด ๆ มีเศษทองวางอยู่ — "III"'], () => { addItem('frag3'); Q().story = 6; toast('🟡 พบเศษทองชิ้นที่ 3! เอาทั้งสามชิ้นไปที่โบสถ์'); }); }]] : []);
addTo('โบสถ์', () => Q().story === 6 ? [['เปิดห้องใต้ดิน 🗝️', () => {
  if (!have('frag1') || !have('frag2') || !have('frag3')) return say('ต้องมีเศษครบทั้งสามชิ้น');
  read('🗝️ ห้องใต้ดิน', ['เศษทั้งสามประกอบเข้าด้วยกันเป็นกุญแจ บันไดลับนำลงไปสู่ห้องนิรภัยที่เต็มไปด้วยฝุ่น: สมบัติของผู้ก่อตั้ง — มงกุฎทองคำและสมุดบัญชีประวัติศาสตร์ที่แท้จริงของเมือง', 'มันพิสูจน์ว่าเมืองนี้สร้างขึ้นโดยทุกคนร่วมกัน จะทำอย่างไรดี?'], () => openMenu('ความลับของผู้ก่อตั้ง', [['เปิดเผยให้ทั้งเมืองรู้ 📣', () => ending('reveal')], ['เก็บเป็นความลับ 🤫', () => ending('secret')]]));
}]] : []);
town.targets.push({ x: 10 * T + 16, y: 13 * T + 6, name: 'ตู้จดหมาย', get opts() { return Q().story === 0 && storyActive() ? [['เปิดตู้จดหมาย ✉️', () => storyStep(0)]] : [['เปิดตู้จดหมาย ✉️', () => say('วันนี้มีแต่จดหมายขยะ')]]; } });
town.targets.push({ x: 13 * T + 16, y: 22 * T + 20, name: 'ขอบสระ', get opts() { return Q().story === 1 ? [['คุ้ยกอหญ้าที่สระ 🌾', () => storyStep(1)]] : []; } });
function ending(kind) {
  const S = Q(); S.ending = kind; S.story = 7; for (const id of ['frag1', 'frag2', 'frag3']) addItem(id, -have(id));
  if (kind === 'reveal') { st.money += 2000; addItem('crown'); PEOPLE.forEach(p => { if (st.rel[p.id]) st.rel[p.id].f = Math.min(100, st.rel[p.id].f + 6); }); toast('📣 เมืองฉลองประวัติศาสตร์ที่แท้จริง! ทุกคนชอบคุณมากขึ้นอีกนิด +฿2,000 และมงกุฎโบราณ'); }
  else { st.money += 3500; fx({ mood: 25 }); toast('🤫 คุณเก็บความลับไว้ ทองในห้องนิรภัยเป็นของคุณ: +฿3,500'); }
  save();
}
function questRows() {
  const S = Q(), rows = [row('📖', 'ความลับแห่งเมืองพิกเซล', S.story >= 7 ? `จบแล้ว — ตอนจบ: ${S.ending === 'reveal' ? 'เปิดเผย' : 'เก็บเป็นความลับ'}` : storyActive() ? STORY[Math.min(S.story, 5)] : 'เริ่มราววันที่ 6', null)];
  rows.push(row('📌', 'ภารกิจวันนี้', boardList().map(b => `${b.done ? '✅' : '⬜'} ${b.n}× ${ITEMS[b.id].n}`).join(' · '), null));
  for (const [id, f] of Object.entries(S.fav)) rows.push(row(f.done ? '✅' : '🙋', `งานฝากของ ${PEOPLE.find(p => p.id === id)?.n}`, `${f.n}× ${ITEMS[f.id].n} → ฿${f.pay}`, null));
  return [...rows, el('div', { className: 'sub' }, `ทำภารกิจแล้ว: ${S.done}`)];
}
const _lt11 = lifeTick; lifeTick = () => { _lt11(); if (storyActive() && Q().story === 0 && !Q().hinted) { Q().hinted = 1; toast('✉️ ได้ยินเสียงตู้จดหมายดัง… ลองไปดูใกล้ ๆ บ้าน'); } if (Q().story === 2 && !Q().elderHint) { Q().elderHint = 1; toast('🧓 สนิทกับผู้สูงอายุที่สุดในเมืองเพื่อรู้เพิ่มเติม'); } };
ACH.push(['detective', '🔍 นักสืบ', 'ไขปริศนาเมือง', () => Q().story >= 7], ['helper', '🤝 ผู้ช่วยเหลือ', 'ทำภารกิจครบ 10 ครั้ง', () => Q().done >= 10]);
console.assert(FETCH.every(id => ITEMS[id]), 'bounty items exist');
