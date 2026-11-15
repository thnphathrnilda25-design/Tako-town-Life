'use strict';
// Your own business: rent the lot, pick a cafe / boutique / market, stock shelves, set prices, hire townsfolk, upgrade, serve the counter.
// Customers are simulated each night from reputation, price fairness, stock, weather, events and staff.
const LOT = BUILDINGS.find(b => b.act === 'lot');
ANCHORS.shop = [29, 16];
const BIZ = {
  cafe: { n: 'คาเฟ่', sign: 'CAFE', roof: '#6a3e2a', wall: '#e0b890', awn: ['#c8402e', '#fff8e8'], sell: ['omelet', 'salad', 'krapow', 'pancake', 'tomyum', 'steak', 'cake', 'coffee', 'bread'], value: { omelet: 35, salad: 30, krapow: 60, pancake: 50, tomyum: 80, steak: 120, cake: 100 }, note: 'ขายอาหารที่ทำเอง (และขนมปัง/กาแฟ)' },
  boutique: { n: 'บูติก', sign: 'PETIT', roof: '#a84a7a', wall: '#f8d0e0', awn: ['#a84a7a', '#fff0f8'], sell: ['flower', 'bouquet', 'plush', 'robot', 'puzzle', 'kite', 'choco', 'cropflower', 'book'], value: {}, note: 'ของขวัญและดอกไม้ — สั่งขายส่งได้' },
  market: { n: 'ตลาดสด', sign: 'MARKET', roof: '#3a9a5a', wall: '#f4f4f0', awn: ['#3a9a5a', '#ffffff'], sell: ['rice', 'egg', 'veg', 'meat', 'milk', 'flour', 'fruit', 'bread', 'coffee', 'choco', 'cropveg', 'cropberry'], value: {}, note: 'ของชำ — สั่งขายส่งและตั้งราคาถูกกว่ามินิมาร์ท' },
};
const worth = id => ITEMS[id].p || BIZ[st.biz.type].value[id] || ITEMS[id].sell || 30;
const bz = () => st.biz;
function applyLook() {
  const b = bz(), B = b && BIZ[b.type]; if (!B) return;
  Object.assign(LOT, { sign: B.sign, roof: B.roof, wall: B.wall, awn: B.awn, door: '#9a5a34', n: `${B.n} (ของคุณ)` });
}
const stars = r => '⭐'.repeat(Math.max(0, Math.round(r / 20))) || '—';
const WX_MUL = { sun: 1, cloud: .9, rain: .6, storm: .3, snow: .6 };
function simDay(d) {
  const b = bz(); if (!b || !b.open) return null;
  const staff = b.staff.filter(id => !st.gone?.[id]).length, cap = 10 + b.equip * 6 + staff * 8 + (b.counter === d ? 6 : 0);
  let n = (6 + b.equip * 2 + staff * 4) * (.6 + b.rep / 60) * (1 + (b.ad ? .25 : 0)) * (WX_MUL[weatherOf(d)] || 1) * (festival(d) ? 1.5 : 1) * ((d - 1) % 7 >= 5 ? 1.3 : 1) * (b.counter === d ? 1.3 : 1) * (typeof civicBizBoost === 'function' ? civicBizBoost(d) : 1);
  n = Math.min(cap, Math.round(n * (.85 + Math.random() * .3)));
  let rev = 0, sold = 0, miss = 0, fair = 0;
  for (let i = 0; i < n; i++) {
    const have2 = Object.keys(b.stock).filter(id => b.stock[id] > 0 && b.price[id]); if (!have2.length) { miss++; continue; }
    const wts = have2.map(id => Math.pow(worth(id) / b.price[id], 1.5)), tot = wts.reduce((a, w) => a + w, 0); let r = Math.random() * tot, id = have2[0]; for (let k = 0; k < have2.length; k++) if ((r -= wts[k]) < 0) { id = have2[k]; break; }
    if (b.price[id] > worth(id) * 1.6) { fair--; continue; }
    b.stock[id]--; rev += b.price[id]; sold++; fair += b.price[id] <= worth(id) * 1.2 ? 1 : 0;
  }
  const wages = staff * 45, upkeep = 40, ad = b.ad ? 60 : 0, profit = rev - wages - upkeep - ad;
  b.rep = Math.max(0, Math.min(100, b.rep + sold * .25 + fair * .05 + b.decor * .3 - miss * .6 - (b.price && Object.values(b.price).some((p, i) => p > 400) ? 0 : 0)));
  b.cash += Math.max(0, rev); st.money -= Math.min(st.money, wages + upkeep + ad); b.hist.push({ d, rev, profit, sold, miss }); if (b.hist.length > 7) b.hist.shift(); b.life = (b.life || 0) + rev;
  return { n, sold, miss, rev, profit };
}
function bizDaily() {
  const b = bz(); if (!b) return; if (b.sday === undefined) b.sday = day();
  while (b.sday < day() && b.sday >= day() - 7) { const r = simDay(b.sday); if (r && b.sday === day() - 1) toast(`🏪 ${BIZ[b.type].n} เมื่อวาน: ขายได้ ${r.sold} ชิ้น รายได้ ฿${r.rev} กำไร ฿${r.profit}${r.miss ? ` · ลูกค้า ${r.miss} คนไม่ได้ของ` : ''}`); b.sday++; }
  b.sday = day(); applyLook(); b.counterDone = false; bizOrderToday();
}
// A daily bulk order: a small premium over market price, paid into the shop drawer.
function bizOrderToday() {
  const b = bz(); if (!b || !b.open) return null;
  if (b.orderDone === day()) return null;
  if (b.order && b.order.d === day()) return b.order;
  const sell = BIZ[b.type].sell.filter(id => ITEMS[id]);
  const id = sell[Math.floor(hash01(day() * 13 + b.type.length * 7) * sell.length)];
  const n = 4 + Math.floor(hash01(day() * 29 + id.length) * 5);
  b.order = { id, n, pay: Math.round(worth(id) * n * 1.4), d: day() };
  return b.order;
}
function deliverOrder(o) {
  const b = bz(); if (!b || !b.order || b.order.d !== day()) return;
  if ((b.stock[o.id] || 0) < o.n) return say('ของในสต็อกไม่พอ');
  b.stock[o.id] -= o.n; b.cash += o.pay; b.rep = Math.min(100, b.rep + 3);
  b.orders = (b.orders || 0) + 1; b.orderDone = day(); b.order = null;
  toast(`📦 ส่งออร์เดอร์แล้ว! รับ ฿${o.pay} เข้าลิ้นชัก · ชื่อเสียง +3`);
  refreshPanel(); save(); checkAch();
}
const _slotOf10 = slotOf; slotOf = p => bz()?.open && bz().staff.includes(p.id) && hour() >= 9 && hour() < 18 ? 'shop' : _slotOf10(p);
const _sT10 = seasonTick; seasonTick = () => { _sT10(); bizDaily(); };

// ---- UI ----
let bTab = 'over';
function bizPanel() {
  openPanel(`🏪 ${BIZ[bz().type].n} — ${stars(bz().rep)}`, () => {
    const b = bz(), B = BIZ[b.type], tabs = [['over', 'ภาพรวม'], ['price', 'ราคา'], ['stock', 'สต็อก'], ['staff', 'พนักงาน'], ['up', 'อัปเกรด']];
    const bar = el('div', { className: 'tabs' }, ...tabs.map(([k, n]) => el('button', { className: k === bTab ? 'on' : '', textContent: n, onclick: () => { bTab = k; refreshPanel(); } })));
    let body = [];
    if (bTab === 'over') {
      const order = bizOrderToday();
      body = [row('💰', `เงินในลิ้นชัก: ฿${b.cash}`, `ยอดขายสะสม ฿${b.life || 0}`, btn('เก็บเงิน', () => { st.money += b.cash; b.cash = 0; refreshPanel(); save(); }, !b.cash)), row('⭐', `ชื่อเสียง ${Math.round(b.rep)}/100`, 'เพิ่มเมื่อขายดี ตั้งราคายุติธรรม และตกแต่งร้าน — ลดเมื่อของหมด'),
        row(b.open ? '🟢' : '🔴', b.open ? 'เปิดร้านอยู่' : 'ปิดร้าน', 'ค่าใช้จ่าย: ค่าเช่า ฿40/วัน + ค่าจ้าง + ค่าโฆษณา', btn(b.open ? 'ปิดร้าน' : 'เปิดร้าน', () => { b.open = !b.open; refreshPanel(); }))];
      if (order) body.push(row('📦', `ออร์เดอร์วันนี้: ${ITEMS[order.id].n} ×${order.n}`, `รับ ฿${order.pay} · ในสต็อก ${b.stock[order.id] || 0}/${order.n}${(b.stock[order.id] || 0) >= order.n ? ' · พร้อมส่ง!' : ''}`, btn('ส่งมอบ', () => deliverOrder(order), (b.stock[order.id] || 0) < order.n)));
      body.push(el('div', { className: 'sec' }, '7 วันล่าสุด'), ...(b.hist.length ? b.hist.slice().reverse().map(h => el('div', { className: 'sub' }, `วันที่ ${h.d}: ขาย ${h.sold} ชิ้น · รายได้ ฿${h.rev} · กำไร ${h.profit >= 0 ? '+' : ''}฿${h.profit}${h.miss ? ` · พลาด ${h.miss} คน` : ''}`)) : [el('div', { className: 'sub' }, 'ยังไม่มียอดขาย — เติมของบนชั้นก่อน!')]));
    }
    if (bTab === 'price') body = [el('div', { className: 'sub' }, B.note + ' · ราคาตลาดแสดงไว้ ตั้งไม่เกิน 120% ถือว่ายุติธรรม เกิน 160% ลูกค้าจะหนี'), ...B.sell.map(id => { const w = worth(id), p = b.price[id] || w; return row(ITEMS[id].ic, ITEMS[id].n, `ราคาตลาด ฿${w} · สต็อก ${b.stock[id] || 0}`, btn('−5', () => { b.price[id] = Math.max(5, p - 5); refreshPanel(); }), el('span', { style: 'margin:0 6px' }, `฿${p}`), btn('+5', () => { b.price[id] = p + 5; refreshPanel(); })); })];
    if (bTab === 'stock') body = [money(), el('div', { className: 'sec' }, 'ย้ายของจากกระเป๋า'), ...B.sell.filter(id => have(id)).map(id => row(ITEMS[id].ic, ITEMS[id].n, `กระเป๋า ${have(id)} · ชั้นวาง ${b.stock[id] || 0}`, btn('+1', () => move1(id, 1)), btn('ทั้งหมด', () => move1(id, have(id))))),
      el('div', { className: 'sec' }, 'สั่งขายส่ง (70% ของราคาตลาด)'), ...B.sell.filter(id => ITEMS[id].p).map(id => { const c = Math.round(ITEMS[id].p * .7); return row(ITEMS[id].ic, ITEMS[id].n, `฿${c} ต่อชิ้น · ชั้นวาง ${b.stock[id] || 0}`, btn('×5', () => whole(id, 5, c), st.money < c * 5)); })];
    if (bTab === 'staff') {
      const hireable = PEOPLE.filter(p => !st.gone?.[p.id] && p.age >= 16 && p.age < 65 && !b.staff.includes(p.id) && (st.rel[p.id]?.f || 0) >= 15 && !hated(p));
      body = [el('div', { className: 'sub' }, 'พนักงานทำงาน 09:00–18:00 ช่วยเพิ่มความจุและลูกค้า (฿45/วัน ต่อคน สูงสุด 3 คน)'), ...b.staff.map(id => { const p = PEOPLE.find(q => q.id === id); return row('👤', p.n, 'ทำงานที่นี่', btn('เลิกจ้าง', () => { b.staff = b.staff.filter(x => x !== id); refreshPanel(); })); }),
        el('div', { className: 'sec' }, 'เพื่อนที่จ้างได้'), ...(hireable.length ? hireable.map(p => row('🙂', `${p.n} (อายุ ${p.age})`, relName(p.id, st.rel[p.id].f), btn('จ้าง', () => { if (b.staff.length >= 3) return say('จ้างได้สูงสุด 3 คน'); b.staff.push(p.id); toast(`🤝 ${p.n} มาทำงานที่ร้านคุณแล้ว`); refreshPanel(); }))) : [el('div', { className: 'sub' }, 'สนิทกับผู้คน (ความสนิท 15+) ก่อนจึงจะจ้างได้')])];
    }
    if (bTab === 'up') body = [money(), ...[['decor', '🪴 ของตกแต่ง', 500, 'ชื่อเสียงเพิ่มเร็วขึ้น'], ['equip', '⚙️ อุปกรณ์', 700, 'ลูกค้ามากขึ้นต่อวัน']].map(([k, n, c, d]) => row(n.split(' ')[0], `${n} เลเวล ${b[k]}/5`, d, btn(b[k] >= 5 ? 'สูงสุด' : `฿${c * (b[k] + 1)}`, () => { const cost = c * (b[k] + 1); if (st.money < cost) return say('เงินไม่พอ'); st.money -= cost; b[k]++; refreshPanel(); save(); }, b[k] >= 5 || st.money < c * (b[k] + 1)))),
      row('📣', 'โฆษณา', '฿60/วัน · ลูกค้า +25%', btn(b.ad ? 'เปิด' : 'ปิด', () => { b.ad = !b.ad; refreshPanel(); }))];
    return [bar, ...body];
  });
}
function move1(id, n) { const b = bz(); addItem(id, -n); b.stock[id] = (b.stock[id] || 0) + n; if (!b.price[id]) b.price[id] = worth(id); refreshPanel(); }
function whole(id, n, c) { const b = bz(); st.money -= c * n; b.stock[id] = (b.stock[id] || 0) + n; if (!b.price[id]) b.price[id] = ITEMS[id].p; refreshPanel(); save(); }
function openShop(type) {
  if (st.money < 5000) return say('ที่ดินราคา ฿5,000 สำหรับเริ่มธุรกิจ'); if (age() < 18) return say('ต้องอายุ 18 ปีขึ้นไปจึงจะเปิดธุรกิจได้');
  st.money -= 5000; st.biz = { type, rep: 30, cash: 0, stock: {}, price: {}, staff: [], decor: 0, equip: 0, ad: false, open: true, hist: [], sday: day(), order: null, orderDone: 0, orders: 0 }; applyLook(); bizOrderToday(); toast(`🏪 ${BIZ[type].n} ของคุณเปิดทำการแล้ว!`); save();
}
town.targets.push({ x: LOT.ix, y: LOT.iy, name: 'ที่ดินให้เช่า', get opts() {
  if (!st.biz) return [['เริ่มธุรกิจที่นี่ ฿5,000', () => openMenu('จะเปิดร้านอะไรดี?', Object.entries(BIZ).map(([k, B]) => [`${B.n} — ${B.note}`, () => openShop(k)]))]];
  return [['จัดการร้าน', bizPanel], ['ทำงานหน้าเคาน์เตอร์ 🧾', () => {
    const b = bz(); if (hour() < 9 || hour() >= 19) return say('กะหน้าเคาน์เตอร์ 09:00–19:00'); if (b.counter === day()) return say('วันนี้ทำกะหน้าเคาน์เตอร์แล้ว'); if (st.energy < 20) return say('เหนื่อยเกินไป');
    startMini('bar', { title: '🧾 บริการลูกค้า', steps: [1, 2, 3, 4, 5].map(i => [`ลูกค้าคนที่ ${i}`, '🧾']), speed: 1.2, w: .24 }, s => doAct('talk', () => { b.counter = day(); const tips = Math.round(s * 40); b.cash += tips; fx({ energy: -15 }); xp('charm', Math.round(10 + 15 * s)); tick(120); say(`จบกะ! ทิป ฿${tips} เข้าลิ้นชัก วันพรุ่งนี้น่าจะคึกคักขึ้น`); }));
  }], ['เก็บเงินในลิ้นชัก 💰', () => { st.money += bz().cash; say(`เก็บเงิน ฿${bz().cash}`); bz().cash = 0; }]];
} });
ACH.push(['owner', '🏪 เจ้าของกิจการ', 'เปิดร้านของตัวเอง', () => !!st.biz], ['tycoon', '💼 เจ้าสัวน้อย', 'ทำรายได้รวม ฿10,000 จากร้าน', () => (st.biz?.life || 0) >= 10000], ['famous', '🌟 ร้านดาวห้า', 'ชื่อเสียงร้านถึง 90', () => (st.biz?.rep || 0) >= 90],
  ['order1', '📦 ออร์เดอร์แรก', 'ส่งออร์เดอร์พิเศษให้ลูกค้า 1 ครั้ง', () => (st.biz?.orders || 0) >= 1], ['order10', '📦 คู่ค้าประจำ', 'ส่งออร์เดอร์ครบ 10 ครั้ง', () => (st.biz?.orders || 0) >= 10]);
console.assert(Object.values(BIZ).every(B => B.sell.every(id => ITEMS[id])), 'business products exist');
console.assert(LOT && LOT.act === 'lot', 'lot building');
