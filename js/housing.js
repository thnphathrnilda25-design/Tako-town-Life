'use strict';
// Moving out: at 18 you have 7 days to rent a room, an apartment or a house, or buy one with a mortgage.
// Rent is paid every Monday; three missed payments mean eviction. Your partner can move in with you.
// The parents keep their own house (parentsHome) and you can visit them.
const HOUSING = [
  { id: 'studio', n: 'ห้องเช่าสตูดิโอ', b: 8, size: [10, 7], rent: 180, deposit: 180, layout: [['fridge', 0, 2], ['stove1', 1, 2], ['sink', 2, 2], ['wardrobe', 6, 2], ['bed1', 8, 2], ['tub', 8, 5], ['pc1', 0, 4]] },
  { id: 'apt', n: 'อพาร์ตเมนต์ 1 ห้องนอน', b: 8, size: [12, 9], rent: 380, deposit: 380, layout: null },
  { id: 'house', n: 'บ้านเช่าหลังเล็ก', b: 9, size: [16, 9], rent: 700, deposit: 700, layout: null },
  { id: 'buy', n: 'ซื้อบ้านเดี่ยว (ผ่อน 40 สัปดาห์)', b: 6, size: [16, 12], price: 18000, down: 3600, weekly: 420, weeks: 40, layout: null },
];
HOME_SIZES.push([10, 7, 0]);                                       // index for the studio
const H = () => st.house || (st.house = { kind: 'parents' });
const movedOut = () => H().kind !== 'parents';
const myDoorB = () => movedOut() ? HOUSING.find(h => h.id === (H().kind === 'own' ? 'buy' : H().kind)).b : 0;
const myDoor = () => { const b = BUILDINGS[myDoorB()]; return movedOut() ? { x: b.ix + 28, y: b.iy } : { x: b.ix, y: b.iy }; };   // own entrance beside the shared door
// ---- parents' house as its own scene ----
const parentsHome = makeScene(12, 9); parentsHome.name = 'บ้านพ่อแม่'; parentsHome.bg = home.bg;
function buildParents() {
  const keep = { furn: st.furn, lv: st.homeLv };
  st.furn = DEFAULT_FURN.map(([id, x, y]) => ({ id, x, y })); st.homeLv = 0; rebuildHome();
  Object.assign(parentsHome, { W: home.W, H: home.H, tile: home.tile, solid: home.solid, statics: home.statics, targets: home.targets, ground: home.ground });
  st.furn = keep.furn; st.homeLv = keep.lv; rebuildHome();
}
parentsHome.drawBg = () => { const s = { W: home.W, H: home.H, ground: home.ground }; Object.assign(home, { W: parentsHome.W, H: parentsHome.H, ground: parentsHome.ground }); home.drawBg(); Object.assign(home, s); };
var famScene = () => scene === parentsHome ? parentsHome : home;
const _hf15 = homeFamily;
homeFamily = () => {
  const all = _hf15(); if (!movedOut()) return all;
  const isParent = e => e.id === 'dad' || e.id === 'mom';
  return scene === parentsHome ? all.filter(isParent) : all.filter(e => !isParent(e));
};
goTown = () => fade(() => { const d = scene === parentsHome ? { x: BUILDINGS[0].ix, y: BUILDINGS[0].iy } : myDoor(); enter(town, d.x, d.y + 4, 0); });
const goParents = () => fade(() => { enter(parentsHome, parentsHome.W / 2 * T, (parentsHome.H - 1) * T + 14, 1); });
const _save15 = save;
save = () => { if (scene === parentsHome && player) { const px = player.x, py = player.y; scene = town; player.x = BUILDINGS[0].ix; player.y = BUILDINGS[0].iy + 4; _save15(); scene = parentsHome; player.x = px; player.y = py; } else _save15(); };
// ---- doors in town ----
{
  const t = town.targets.find(t => t.name === 'บ้านของฉัน');
  Object.defineProperty(t, 'name', { get: () => movedOut() ? 'บ้านพ่อแม่' : 'บ้านของฉัน', configurable: true });
  Object.defineProperty(t, 'opts', { get: () => movedOut() ? [['ไปเยี่ยมพ่อแม่', goParents]] : [['เข้าบ้าน', () => goHome()]], configurable: true });
}
town.targets.push({ get x() { return myDoor().x; }, get y() { return myDoor().y; }, get name() { return 'ที่พักของฉัน'; }, get opts() { return movedOut() ? [['เข้าบ้าน', () => goHome()]] : []; } });
// ---- moving ----
function moveTo(h) {
  const kind = h.id === 'buy' ? 'own' : h.id;
  const bought = st.furn.filter(f => FURN[f.id].price > 0 && !DEFAULT_FURN.some(([id]) => id === f.id));
  for (const f of bought) st.store[f.id] = (st.store[f.id] || 0) + 1;     // furniture you paid for comes with you
  st.house = { kind, rent: h.rent || 0, missed: 0, weeksLeft: h.weeks || 0, weekly: h.weekly || 0, since: day() };
  const idx = HOME_SIZES.findIndex(s => s[0] === h.size[0] && s[1] === h.size[1]); st.homeLv = Math.max(0, idx);
  st.furn = (h.layout || DEFAULT_FURN).map(([id, x, y]) => ({ id, x, y }));
  st.moveDue = null; rebuildHome(); buildParents();
  const sp = spouseP?.() || (st.cohab && people.find(p => p.id === st.cohab)); if (sp) { sp.home = myDoorB(); sp.spots = {}; }
  fade(() => { const d = homeDoor(); enter(home, d.x, d.y - 8, 1); toast(`🏠 ย้ายเข้า${h.n}แล้ว! กด 🛠️ เพื่อจัดบ้าน (ของที่ซื้อไว้อยู่ในคลัง)`); });
  save();
}
function housingPanel() {
  openPanel('🏘️ หาที่อยู่', () => [money(), el('div', { className: 'sub' }, age() < 18 ? 'ต้องอายุ 18 ปีขึ้นไปถึงจะเช่าหรือซื้อบ้านได้' : 'ค่าเช่าจ่ายทุกวันจันทร์ ค้าง 3 ครั้งโดนไล่ออก · บ้านที่ซื้อผ่อนรายสัปดาห์จนครบแล้วเป็นของคุณ'),
    ...HOUSING.map(h => row(h.id === 'buy' ? '🏡' : '🔑', h.n, h.price ? `ราคา ฿${h.price} · ดาวน์ ฿${h.down} · ผ่อน ฿${h.weekly}/สัปดาห์ · ${h.size[0]}×${h.size[1]} ช่อง` : `ค่าเช่า ฿${h.rent}/สัปดาห์ · มัดจำ ฿${h.deposit} · ${h.size[0]}×${h.size[1]} ช่อง`,
      btn(h.price ? `ดาวน์ ฿${h.down}` : `เช่า ฿${h.deposit + h.rent}`, () => {
        const cost = h.price ? h.down : h.deposit + h.rent; if (age() < 18) return say('ต้องอายุ 18 ปีก่อน'); if (st.money < cost) return say('เงินไม่พอ');
        st.money -= cost; closePanel(); moveTo(h);
      }, age() < 18 || st.money < (h.price ? h.down : h.deposit + h.rent)))),
    ...(movedOut() ? [row('📦', 'ย้ายกลับไปอยู่กับพ่อแม่', 'ยกเลิกสัญญาเช่า (ไม่คืนมัดจำ)', btn('ย้ายกลับ', () => { st.house = { kind: 'parents' }; st.homeLv = 0; st.furn = DEFAULT_FURN.map(([id, x, y]) => ({ id, x, y })); st.moveDue = age() >= 18 ? day() + 7 : null; rebuildHome(); closePanel(); goTown(); }))] : [])]);
}
town.targets.push({ x: bld('furni').ix + 28, y: bld('furni').iy, name: 'สำนักงานอสังหาฯ', opts: [['ดูห้องเช่า / บ้าน', housingPanel]] });
// ---- weekly rent / mortgage, the 18th birthday deadline ----
function housingDaily() {
  const h = H(); if (st.hDay === day()) return; st.hDay = day();
  if (h.kind === 'parents' && age() >= 18 && !st.moveDue) { st.moveDue = day() + 7; toast('🎓 อายุ 18 แล้ว! พ่อแม่ให้เวลา 7 วันหาที่อยู่เอง (สำนักงานอสังหาฯ ข้างร้านเฟอร์นิเจอร์)'); }
  if (h.kind === 'parents' && st.moveDue && day() >= st.moveDue) {
    const s = HOUSING[0]; toast('📦 ครบกำหนดแล้ว พ่อแม่พาไปเช่าห้องสตูดิโอให้ (ค่ามัดจำติดหนี้ไว้)'); st.debt = (st.debt || 0) + s.deposit; moveTo(s); return;
  }
  if (h.kind === 'parents' || weekday() !== 0 || h.paidDay === day()) return;
  h.paidDay = day();
  if (h.kind === 'own' && !h.weekly) return;                 // fully paid house: nothing due
  const due = h.weekly || h.rent;
  if (st.money >= due) { st.money -= due; h.missed = 0; toast(`🏠 จ่าย${h.weekly ? 'ค่างวดบ้าน' : 'ค่าเช่า'} ฿${due}`); if (h.weekly && --h.weeksLeft <= 0) { h.weekly = 0; h.rent = 0; toast('🎉 ผ่อนบ้านครบแล้ว! บ้านเป็นของคุณ'); } }
  else { h.missed++; fx({ mood: -10 }); toast(`⚠️ จ่าย${h.weekly ? 'ค่างวด' : 'ค่าเช่า'}ไม่ไหว (ค้าง ${h.missed}/3)`); if (h.missed >= 3) { toast('🚪 โดนไล่ออกจากที่พัก! กลับไปอยู่บ้านพ่อแม่ชั่วคราว 7 วัน'); st.house = { kind: 'parents' }; st.homeLv = 0; st.furn = DEFAULT_FURN.map(([id, x, y]) => ({ id, x, y })); st.moveDue = day() + 7; rebuildHome(); if (scene === home) goTown(); } }
}
const _sT15 = seasonTick; seasonTick = () => { _sT15(); housingDaily(); };
// ---- partner moves in ----
function attachCohab() {
  const p = st.cohab && people.find(q => q.id === st.cohab); if (!p || p.fam) return;
  p.fam = 'spouse'; p.home = myDoorB(); p.spots = {};
  p.h = { id: p.id, n: p.n, p, label: 'แฟน', spr: p.spr, x: 6 * T + 16, y: 5 * T + 16, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0, get age() { return p.age; } };
  if (!fam.includes(p)) fam.push(p);
}
const _po15 = personOpts;
personOpts = p => {
  const o = _po15(p);
  if (!p.fam && p.id === st.partner && !st.spouse && !st.cohab && movedOut()) o.push(['ชวนมาอยู่ด้วยกัน 🏠', () => {
    const r = relOf(p.id); if (r.f < 85) return say(`${p.n}: "ยังเร็วไปหน่อยนะ ขอให้เราสนิทกันกว่านี้ก่อน" (ต้องการความสนิท 85)`);
    st.cohab = p.id; attachCohab(); fx({ mood: 25 }); toast(`💕 ${p.n} ย้ายมาอยู่ด้วยกันแล้ว!`); save();
  }]);
  return o;
};
const _mf15 = makeFamily; makeFamily = () => { _mf15(); if (st.cohab && !st.spouse) attachCohab(); const sp = typeof spouseP === 'function' && spouseP(); if (sp) sp.home = myDoorB(); };
const _start15 = start; start = saved => { _start15(saved); if (movedOut()) buildParents(); };
ACH.push(['movedout', '🏠 เป็นผู้ใหญ่แล้ว', 'ย้ายออกมาอยู่เอง', () => movedOut()], ['homeowner', '🏡 เจ้าของบ้าน', 'ผ่อนบ้านครบ', () => H().kind === 'own' && !H().weekly]);
console.assert(HOUSING.every(h => BUILDINGS[h.b]), 'housing buildings exist');
console.assert(HOUSING[0].layout.every(([id]) => FURN[id]), 'studio furniture exists');
