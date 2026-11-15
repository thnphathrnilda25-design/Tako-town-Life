'use strict';
// Pets (starter cat, adoptable dog and kitten) and the community vegetable garden.
SKILLS.garden = ['การทำสวน', '🌿', 'เก็บเกี่ยวได้มากขึ้น'];
const PET_DEFS = {
  cat: { n: 'โมจิ', pal: CATPAL, price: 0 },
  dog: { n: 'บิสกิต', pal: { b: '#a8683a', d: '#7a4a28', w: '#f4e8d0', e: '#2a1a2e', n: '#2a1a2e' }, price: 300 },
  kitten: { n: 'ลูน่า', pal: { b: '#9aa0b0', d: '#6a7080', w: '#ffffff', e: '#2a1a2e', n: '#ff8aa0' }, price: 200 },
};
const makePetSpr = pal => CAT_LEGS.map(l => {
  const c = outline(onCanvas(mk(18, 11), () => CAT.concat(l).forEach((r, y) => [...r].forEach((ch, x) => ch !== '.' && R(pal[ch], x + 1, y + 1)))));
  return [flipC(c), c];
});
let petEntities = {};
function makePets() {
  st.pets = st.pets || { cat: { hunger: 70, happy: 70 } }; petEntities = {};
  for (const id in st.pets) petEntities[id] = { id, n: PET_DEFS[id].n, cat: 1, sprs: makePetSpr(PET_DEFS[id].pal), x: (3 + Object.keys(petEntities).length) * T, y: 5 * T, dir: 3, frame: 0, at: 0, vx: 0, vy: 0, t: 0, where: home };
}
const petEnts = sc => Object.values(petEntities).filter(p => sc === home || (sc === town && p.id === 'dog'));
function petUpdate(dt) {
  for (const p of Object.values(petEntities)) {
    if (p.id === 'dog' && scene === town) {                                   // the dog trots after you outside
      if (p.where !== town) { p.where = town; p.x = player.x - 16; p.y = player.y; }
      const dx = player.x - 18 - p.x, dy = player.y - p.y, d = Math.hypot(dx, dy);
      if (d > 14) { move(town, p, dx / d * 80 * dt, dy / d * 80 * dt); p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : p.dir; } animate(p, d > 14, dt);
    } else { if (p.where !== home) { p.where = home; p.x = 3 * T; p.y = 5 * T; } wander(home, p, 28, dt); }
  }
}
const petOpts = id => {
  const S = st.pets[id], n = PET_DEFS[id].n;
  return [['ลูบหัวกอดสัตว์เลี้ยง', () => { fx({ mood: 6 }); S.happy = Math.min(100, S.happy + 10); tick(5); say(`${n} ชอบที่ได้ความสนใจ`); }],
    ['ให้อาหาร (อาหารสัตว์)', () => { if (!have('petfood')) return say('ไม่มีอาหารสัตว์ — ซื้อได้ที่ร้านสัตว์เลี้ยง'); addItem('petfood', -1); S.hunger = Math.min(100, S.hunger + 50); S.happy = Math.min(100, S.happy + 5); tick(5); say(`${n} กินอย่างมีความสุข`); }],
    ['เล่นด้วย 20 นาที', () => { if (st.energy < 10) return say('เหนื่อยเกินไป'); fx({ mood: 8, energy: -5 }); S.happy = Math.min(100, S.happy + 25); tick(20); say(`คุณเล่นกับ ${n}`); }],
    ...(id === 'dog' ? [['พาสุนัขไปเดินเล่น 40 นาที', () => { if (scene !== town) return say('พาสุนัขออกไปข้างนอกก่อน'); fx({ mood: 10, energy: -6 }); S.happy = Math.min(100, S.happy + 30); xp('fit', 14); tick(40); say('เดินเล่นสบาย ๆ'); }]] : [])];
};
const adopt = id => () => {
  if (st.pets[id]) return say(`${PET_DEFS[id].n} อยู่กับคุณแล้ว`);
  if (st.money < PET_DEFS[id].price) return say('เงินไม่พอ');
  fx({ money: -PET_DEFS[id].price }); st.pets[id] = { hunger: 70, happy: 70 }; makePets(); toast(`🐾 ${PET_DEFS[id].n} มาเป็นสมาชิกครอบครัวแล้ว!`);
};
town.targets.push({ ...(b => ({ x: b.ix, y: b.iy }))(bld('pet')), name: 'ร้านสัตว์เลี้ยง', get opts() {
  return [['ของใช้ (อาหาร, เบ็ดตกปลา)', () => shopPanel('🐾 ร้านสัตว์เลี้ยง', ['petfood', 'rod', 'net', 'shovel'])], ...Object.keys(PET_DEFS).filter(id => id !== 'cat' && !st.pets?.[id]).map(id => [`รับเลี้ยง ${PET_DEFS[id].n} ฿${PET_DEFS[id].price}`, adopt(id)])];
} });
function petRows() {
  return Object.entries(st.pets).map(([id, S]) => row(id === 'dog' ? '🐶' : '🐱', PET_DEFS[id].n, `ความอิ่ม ${Math.round(S.hunger)} · ความสุข ${Math.round(S.happy)} — ควรรักษาทั้งสองอย่างให้เกิน 40 เพื่อรับโบนัสความสุขรายวัน`))
    .concat(el('div', { className: 'sub' }, 'สัตว์เลี้ยงจะหิวทุกวัน ซื้ออาหารสัตว์ได้ที่ร้านสัตว์เลี้ยง'));
}
// ---- garden ----
const CROPS = { seedveg: { crop: 'cropveg', days: 4, n: [2, 4], col: '#e8802a' }, seedflower: { crop: 'cropflower', days: 5, n: [1, 3], col: '#ffd54a' }, seedberry: { crop: 'cropberry', days: 6, n: [2, 5], col: '#e84a4a' } };
const plotOf = (tx, ty) => (st.garden || (st.garden = {}))[`${tx},${ty}`];
const ready = c => c.grow >= CROPS[c.seed].days;
town.statics.push({ k: 0, f() {
  for (const [tx, ty] of GARDEN) {
    const X = tx * T, Y = ty * T, c = plotOf(tx, ty);
    R('#6a4a2e', X + 2, Y + 2, 28, 28); R('#5a3e26', X + 2, Y + 8, 28, 2); R('#5a3e26', X + 2, Y + 18, 28, 2); R('#8a6a46', X, Y, 32, 2); R('#8a6a46', X, Y + 30, 32, 2);
    if (!c) continue;
    const k = Math.min(1, c.grow / CROPS[c.seed].days);
    for (const dx of [8, 16, 24]) { R('#3f9a46', X + dx, Y + 24 - Math.round(4 + k * 12), 2, Math.round(4 + k * 12)); if (k < 1) R('#5cb85a', X + dx - 2, Y + 22 - Math.round(k * 10), 6, 3); else disc(X + dx + 1, Y + 11, 3, CROPS[c.seed].col); }
    if (c.wet === day()) R('#4a8ac8', X + 4, Y + 27, 4, 2);
  }
} });
town.targets.push(...GARDEN.map(([tx, ty]) => ({ x: tx * T + 16, y: ty * T + 22, name: 'แปลงผัก', get opts() {
  const c = plotOf(tx, ty);
  if (!c) { const seeds = Object.keys(CROPS).filter(id => have(id)); return seeds.length ? seeds.map(id => [`ปลูก${ITEMS[id].n}`, () => { addItem(id, -1); st.garden[`${tx},${ty}`] = { seed: id, grow: 0, wet: 0 }; fx({ energy: -2 }); tick(10); say(`ปลูกแล้ว! รดน้ำทุกวัน (ฝนช่วยได้) จะโตใน ${CROPS[id].days} วัน ฤดูหนาวพืชไม่โต`); }]) : [['แปลงว่าง — ซื้อเมล็ดที่ร้านดอกไม้', () => say('เมล็ดพันธุ์ขายที่ร้านดอกไม้ 🌼')]]; }
  if (ready(c)) return [['เก็บเกี่ยว 🧺', () => {
    const C = CROPS[c.seed], n = C.n[0] + Math.floor(Math.random() * (C.n[1] - C.n[0] + 1)) + (lv('garden') >= 3 ? 1 : 0);
    addItem(C.crop, n); delete st.garden[`${tx},${ty}`]; fx({ energy: -4 }); xp('garden', 25); tick(15); say(`เก็บเกี่ยวได้ ${n} × ${ITEMS[C.crop].ic} ${ITEMS[C.crop].n}`);
  }]];
  return [['รดน้ำต้นไม้ 💧', () => { if (c.wet === day()) return say('วันนี้รดน้ำแล้ว'); c.wet = day(); fx({ energy: -2 }); xp('garden', 5); tick(5); say('กำลังโตงาม'); }],
    [`ขุดทิ้ง (${c.grow}/${CROPS[c.seed].days} วัน)`, () => { delete st.garden[`${tx},${ty}`]; say('เคลียร์แปลงแล้ว'); }]];
} })));
function petDaily() {
  if (st.pday === undefined) st.pday = day();
  if (st.pday === day()) return;
  const gone = day() - st.pday; st.pday = day();
  for (const [id, S] of Object.entries(st.pets || {})) {
    S.hunger = Math.max(0, S.hunger - 30 * gone); S.happy = Math.max(0, S.happy - (15 + (S.hunger <= 0 ? 25 : 0)) * gone);
    if (S.hunger > 40 && S.happy > 40) { fx({ mood: 3 }); } else if (S.hunger <= 0) toast(`😿 ${PET_DEFS[id].n} หิวจะแย่แล้ว! ให้อาหารด้วย`);
  }
  for (let d = day() - gone; d < day(); d++) for (const c of Object.values(st.garden || {})) if (!ready(c) && seasonOf(d).i !== 3 && (c.wet === d || ['rain', 'storm'].includes(weatherOf(d)))) c.grow++;
}
const _seasonTick = seasonTick; seasonTick = () => { _seasonTick(); petDaily(); };
ACH.push(['farmer', '🌻 มือทอง', 'ทักษะทำสวน เลเวล 3', () => lv('garden') >= 3], ['petlover', '🐾 คนรักสัตว์', 'เลี้ยงสัตว์ 2 ตัว', () => Object.keys(st.pets || {}).length >= 2]);
console.assert(Object.keys(CROPS).every(id => ITEMS[id] && ITEMS[CROPS[id].crop]), 'crop table');
console.assert(GARDEN.every(([x, y]) => !solidAt(town, x * T + 16, y * T + 22)), 'garden plots must be walkable');
