'use strict';
// New shops, civic buildings, fishing and selling. Items are added to the shared ITEMS table.
Object.assign(ITEMS, {
  seedveg: { n: 'เมล็ดผัก', p: 20, ic: '🌱', k: 'seed' }, seedflower: { n: 'เมล็ดดอกไม้', p: 25, ic: '🌼', k: 'seed' }, seedberry: { n: 'เมล็ดสตรอว์เบอร์รี', p: 35, ic: '🫘', k: 'seed' },
  cropveg: { n: 'แครอท', ic: '🥕', k: 'crop', food: 12, sell: 28 }, cropflower: { n: 'ทานตะวัน', ic: '🌻', k: 'crop', sell: 40 }, cropberry: { n: 'สตรอว์เบอร์รี', ic: '🍓', k: 'crop', food: 14, mood: 3, sell: 45 },
  rod: { n: 'เบ็ดตกปลา', p: 120, ic: '🎣', k: 'tool' }, umbrella: { n: 'ร่ม', p: 100, ic: '☂️', k: 'tool' }, petfood: { n: 'อาหารสัตว์เลี้ยง', p: 15, ic: '🦴', k: 'ing' },
  robot: { n: 'หุ่นยนต์ของเล่น', p: 90, ic: '🤖', k: 'gift' }, puzzle: { n: 'จิ๊กซอว์', p: 60, ic: '🧩', k: 'gift' }, kite: { n: 'ว่าว', p: 50, ic: '🪁', k: 'gift' },
  medicine: { n: 'วิตามิน', p: 40, ic: '💊', k: 'food', energy: 20, mood: 3 },
  minnow: { n: 'ปลาซิว', ic: '🐟', k: 'fish', food: 10, sell: 15 }, carp: { n: 'ปลาไน', ic: '🐟', k: 'fish', food: 18, sell: 40 },
  koi: { n: 'ปลาโคอิ', ic: '🎏', k: 'fish', food: 20, sell: 120 }, goldfish: { n: 'ปลาทอง', ic: '🐠', k: 'fish', food: 25, sell: 300 },
});
MART_STOCK.push('umbrella');
SKILLS.fish = ['การตกปลา', '🎣', 'ปลาหายากจะกัดบ่อยขึ้น'];
const bld = act => BUILDINGS.find(b => b.act === act);
function shopPanel(title, ids) {
  openPanel(title, () => [money(), ...ids.map(id => row(ITEMS[id].ic, ITEMS[id].n, `฿${ITEMS[id].p} · มี ${have(id)}`, btn('ซื้อ', () => buyItem(id), st.money < ITEMS[id].p)))]);
}
function sellPanel() {
  openPanel('💰 ขายปลาและพืชผล', () => {
    const ids = Object.keys(st.inv).filter(id => ITEMS[id].sell);
    return [money(), ...(ids.length ? ids.map(id => row(ITEMS[id].ic, ITEMS[id].n, `฿${ITEMS[id].sell} ต่อชิ้น · มี ${have(id)}`,
      btn('ขาย 1', () => { addItem(id, -1); st.money += ITEMS[id].sell; refreshPanel(); save(); }), btn('ขายทั้งหมด', () => { st.money += ITEMS[id].sell * have(id); delete st.inv[id]; refreshPanel(); save(); }))) : [el('div', { className: 'sub' }, 'ไม่มีของขาย — ไปตกปลาหรือปลูกผักก่อน')])];
  });
}
const pay = (price, d, mins, text) => () => { if (st.money < price) return say('เงินไม่พอ'); fx({ money: -price, ...d }); tick(mins); say(text); };
const spot = b => ({ x: b.ix, y: b.iy });
town.targets.push(
  { ...spot(bld('flower')), name: 'ร้านดอกไม้', opts: [['ร้านค้า', () => shopPanel('🌷 ร้านดอกไม้', ['flower', 'bouquet', 'ring', 'seedflower', 'seedveg', 'seedberry'])]] },
  { ...spot(bld('toy')), name: 'ร้านของเล่น', opts: [['ร้านค้า', () => shopPanel('🧸 ร้านของเล่น', ['plush', 'robot', 'puzzle', 'kite'])]] },
  { ...spot(bld('clinic')), name: 'คลินิก', opts: [['วิตามินและของใช้', () => shopPanel('🏥 คลินิก', ['medicine'])], ['ตรวจสุขภาพ ฿50', pay(50, { energy: 30, mood: 5 }, 60, 'หมอบอกว่าคุณแข็งแรงดี!')],
    ['นอนพักที่คลินิก ฿40', pay(40, { energy: 50, clean: 10 }, 180, 'ได้พักผ่อนเต็มที่')]] },
  { ...spot(bld('gym')), name: 'ฟิตเนส', opts: [['ออกกำลังกาย ฿30', () => { if (st.energy < 20) return say('เหนื่อยเกินไป'); pay(30, { energy: -15, clean: -15, mood: 3 }, 60, 'ออกกำลังกายสนุกมาก!')(); xp('fit', 45); }],
    ['เทรนเนอร์ส่วนตัว ฿100', () => { if (st.energy < 25) return say('เหนื่อยเกินไป'); pay(100, { energy: -20, clean: -18 }, 90, 'เทรนเนอร์ฝึกคุณหนักมาก!')(); xp('fit', 130); }]] },
  { ...spot(bld('library')), name: 'ห้องสมุด', get opts() { return [['อ่านหนังสือเงียบ ๆ 2 ชม.', () => { fx({ energy: -4, mood: 3 }); xp('logic', 30); tick(120); say('ที่นี่สงบจริง ๆ'); }],
    ['อ่านการ์ตูน', () => { fx({ mood: 10, energy: -2 }); tick(45); say('ฮ่า ๆ ตลกดี!'); }], ...(inSchool() ? [['ทำการบ้านที่นี่', homework]] : [])]; } },
  { ...spot(bld('cinema')), name: 'โรงหนัง', get opts() {
    const ok = () => hour() >= 10 && hour() < 23 || say('รอบหนัง 10:00–23:00');
    const films = ['หนังผจญภัย 🏔️', 'หนังตลก 😂', 'หนังสืบสวน 🔍', 'หนังโรแมนซ์ 💕', 'หนังอวกาศ 🚀'];
    return [['ดูหนัง ฿60', () => ok() === true && pay(60, { mood: 25, energy: -3 }, 120, `คุณได้ดู${films[day() % 5]}`)()],
      ...(st.partner ? [['เดทกลางคืนกับแฟน ฿140', () => { if (ok() !== true) return; const r = relOf(st.partner); pay(140, { mood: 40 }, 150, 'คืนเดทที่สมบูรณ์แบบ 💕')(); r.f = Math.min(100, r.f + 6); }]] : [])];
  } },
);
// extend existing targets: mart sells produce, pond has fishing
function extend(name, extra) {
  const t = town.targets.find(t => t.name === name), d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { get: () => [...base.call(t), ...extra()], configurable: true });
}
extend('มินิมาร์ท', () => [['ขายปลาและพืชผล', sellPanel]]);
extend('บ่อปลา', () => [['ตกปลาด้วยเบ็ด 🎣', startFishing]]);

// ---- fishing: wait for the bite, then reel in during the short window ----
var FISH_ODDS = () => { const l = lv('fish'), w = seasonOf().i === 3 ? .6 : 1; return [['minnow', 60 * w], ['carp', 30], ['koi', 9 + l * 2], ['goldfish', 1 + l * .8]]; };
function startFishing() {
  if (!have('rod')) return say('ต้องมีเบ็ดตกปลา 🎣 — ซื้อได้ที่ร้านสัตว์เลี้ยง');
  if (st.energy < 10) return say('เหนื่อยเกินไปจะตกปลา');
  mg = { fish: true, phase: 'wait', t: 1.5 + Math.random() * 3.5, msg: 'รอปลากัดเบ็ด…' }; fishUI();
}
function fishUI() {
  mgEl.replaceChildren(el('h3', { textContent: '🎣 ตกปลา' }), el('div', { className: 'fb', style: 'font-size:22px;height:40px', textContent: mg.msg }),
    el('button', { textContent: 'สาวเบ็ด! (E / สเปซบาร์)', onpointerdown: e => { e.preventDefault(); mgPress(); } }), el('div', {}, el('button', { style: 'margin-top:8px;font-size:14px;padding:4px 16px', textContent: 'เลิกตกปลา', onclick: () => { mg = null; mgEl.hidden = true; } })));
  mgEl.hidden = false;
}
function fishTick(dt) {
  if (mg.phase === 'done') { if ((mg.t -= dt) <= 0) { mg = null; mgEl.hidden = true; } return; }
  if ((mg.t -= dt) > 0) return;
  if (mg.phase === 'wait') { mg.phase = 'bite'; mg.t = .9; mg.msg = '❗ กัดแล้ว! สาวเบ็ดเลย!'; fishUI(); }
  else { mg.phase = 'wait'; mg.t = 1.5 + Math.random() * 3.5; mg.msg = 'ปลาหนีไปแล้ว… รอใหม่'; fishUI(); }
}
function fishReel() {
  if (mg.phase === 'done') return;
  if (mg.phase === 'wait') { mg.t = 1.5 + Math.random() * 3.5; mg.msg = 'เร็วเกินไป! ปลาตกใจหนี'; return fishUI(); }
  const odds = FISH_ODDS(), tot = odds.reduce((a, [, w]) => a + w, 0); let r = Math.random() * tot, id = odds[0][0];
  for (const [f, w] of odds) { if ((r -= w) < 0) { id = f; break; } }
  addItem(id); if (id === 'goldfish') st.stats.goldfish = (st.stats.goldfish || 0) + 1; fx({ mood: 4, energy: -3 }); xp('fish', 12 + (ITEMS[id].sell > 100 ? 20 : 0)); tick(20);
  mg.phase = 'done'; mg.t = 1.4; mg.msg = `จับได้ ${ITEMS[id].ic} ${ITEMS[id].n}!`; fishUI();
}
const _mgPress = mgPress, _mgUpdate = mgUpdate;
mgPress = () => mg?.fish ? fishReel() : _mgPress();
mgUpdate = dt => mg.fish ? fishTick(dt) : _mgUpdate(dt);
ACH.push(['fisher', '🎣 นักตกปลา', 'จับปลาทองได้', () => have('goldfish') > 0 || (st.stats.goldfish || 0) > 0]);
console.assert(Object.values(ITEMS).every(I => I.ic && I.n), 'items need icon and name');
console.assert(['flower', 'toy', 'clinic', 'gym', 'library', 'cinema', 'pet'].every(a => bld(a)), 'all new buildings exist');
