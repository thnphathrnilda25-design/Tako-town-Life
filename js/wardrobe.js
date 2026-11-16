'use strict';
// Wardrobe: 130+ clothing items, 22 hairstyles, 22 hair dyes, the closet at home, a fashion shop and a salon.
const COLS = [['ขาว', '#f4f4f4', '#c8c8d4'], ['ดำ', '#3a3a4a', '#24242e'], ['แดง', '#c8402e', '#8a2a1e'], ['น้ำเงิน', '#4a7ad8', '#2a4aa0'], ['เขียว', '#58c47a', '#2f7a48'],
  ['เหลือง', '#f2c84a', '#c8982a'], ['ชมพู', '#e87a9a', '#b8506e'], ['ม่วง', '#9a58c8', '#6a3a98'], ['ส้ม', '#e8884a', '#b8602a'], ['เขียวน้ำทะเล', '#4ac8c0', '#2a8a88']];
const TOPS = [['tee', 'เสื้อยืด', 60], ['tank', 'เสื้อกล้าม', 50], ['hoodie', 'ฮู้ดดี้', 120], ['stripes', 'เสื้อยืดลายทาง', 80], ['jacket', 'แจ็คเก็ต', 150], ['suit', 'สูท', 260], ['dress', 'เดรส', 140],
  ['sweater', 'สเวตเตอร์', 110], ['vest', 'เสื้อกั๊ก', 90], ['overalls', 'ชุดเอี๊ยม', 100], ['polo', 'เสื้อโปโล', 90], ['jersey', 'เสื้อกีฬา', 90], ['coat', 'โค้ทตัวยาว', 220], ['pajamas', 'ชุดนอน', 70],
  ['cardigan', 'คาร์ดิแกน', 120], ['raincoat', 'เสื้อกันฝน', 130], ['kimono', 'กิโมโน', 200], ['uniform', 'ชุดนักเรียน', 100], ['tux', 'ทักซิโด้', 350]];
const BOTTOMS = [['jeans', 'กางเกงยีนส์', 80], ['shorts', 'กางเกงขาสั้น', 60], ['skirt', 'กระโปรงสั้น', 70], ['longskirt', 'กระโปรงยาว', 90], ['cargo', 'กางเกงคาร์โก้', 100], ['leggings', 'เลกกิ้ง', 70], ['slacks', 'กางเกงสแล็ค', 110]];
const SHOES = [['sneakers', 'รองเท้าผ้าใบ', 70], ['boots', 'บูท', 130], ['sandals', 'รองเท้าแตะรัดส้น', 50], ['heels', 'ส้นสูง', 120], ['slippers', 'รองเท้าแตะ', 40], ['plain', 'รองเท้า', 60]];
const HATS = [['cap', 'หมวกแก๊ป', 50], ['beanie', 'หมวกไหมพรม', 60], ['sunhat', 'หมวกกันแดด', 80], ['beret', 'หมวกเบเรต์', 70], ['crown', 'มงกุฎ', 400], ['catears', 'หูแมว', 90], ['party', 'หมวกปาร์ตี้', 40], ['helmet', 'หมวกกันน็อก', 100],
  ['headband', 'ผ้าคาดหัว', 30], ['wizard', 'หมวกพ่อมด', 180], ['bow', 'โบว์ผม', 40], ['flowers', 'มงกุฎดอกไม้', 90]];
const GLASSES = [['round', 'แว่นกลม', 90], ['square', 'แว่นเหลี่ยม', 90], ['sun', 'แว่นกันแดด', 110], ['heart', 'แว่นหัวใจ', 100], ['monocle', 'แว่นตาข้างเดียว', 150], ['vr', 'แว่นเสมือนจริง', 300]];
const EXTRAS = [['scarf', 'ผ้าพันคอ', 70], ['necklace', 'สร้อยคอ', 120], ['bowtie', 'หูกระต่าย', 60], ['backpack', 'กระเป๋าเป้', 110], ['headphones', 'หูฟัง', 150], ['mask', 'หน้ากากอนามัย', 20], ['wings', 'ปีกนางฟ้า', 350],
  ['earrings', 'ต่างหู', 100], ['cape', 'ผ้าคลุมฮีโร่', 160]];
const HAIRSTYLES = [['short', 'สั้น'], ['swept', 'ปัดข้าง'], ['bob', 'บ๊อบ'], ['long', 'ยาว']].map(([s, n]) => ({ id: s, n, style: s, hx: '', price: 0 }))
  .concat([['spiky', 'short', 'ตั้งแหลม'], ['bun', 'long', 'เกล้ามวยสูง'], ['spacebuns', 'bob', 'มวยคู่'], ['topknot', 'short', 'ปมสูง'], ['ponytail', 'swept', 'หางม้า'], ['twintails', 'bob', 'ทวินเทล'],
    ['pigtails', 'bob', 'หางเปียคู่'], ['braid', 'long', 'เปียข้าง'], ['afro', 'short', 'แอโฟร'], ['curly', 'short', 'หยิก'], ['mohawk', 'short', 'โมฮอว์ก'], ['sidepart', 'short', 'แสกข้าง'], ['bowl', 'short', 'ทรงชาม'],
    ['fringe', 'bob', 'ผมหน้าม้ายาว'], ['pixie', 'short', 'พิกซี่'], ['wavy', 'long', 'ลอน'], ['messy', 'short', 'ยุ่ง'], ['slick', 'short', 'แสกหลัง']].map(([hx, style, n]) => ({ id: hx, n, style, hx, price: 120 })));
const DYES = HAIR.concat([['#ff3a3a', '#b01a1a', '#ff9a9a'], ['#ff8a2a', '#c05a10', '#ffc080'], ['#ffe14a', '#c8a820', '#fff4a0'], ['#4aff8a', '#20a850', '#a0ffc8'], ['#3ae8e8', '#1aa0a8', '#a0ffff'],
  ['#4a4aff', '#2a2ac0', '#a0a0ff'], ['#c04aff', '#8020c0', '#e0a0ff'], ['#ff4ac8', '#b01a90', '#ffa0e8'], ['#ffffff', '#c0c0d0', '#ffffff'], ['#8a8a98', '#5a5a68', '#c0c0d0'],
  ['#1a1a24', '#0a0a10', '#3a3a4a'], ['#7a3a1a', '#4a200a', '#b07040']]);
const WITEM = {}, WLIST = { top: [], bottom: [], shoes: [], hat: [], gl: [], acc: [] };
function addItems(slot, table, ncol) {
  table.forEach(([style, n, price], i) => {
    const cols = ncol ? [0, 1, 2].map(k => (i * 3 + k * 3 + (i % 2)) % COLS.length).slice(0, ncol) : [0];
    cols.forEach(ci => { const id = `${slot}:${style}:${ci}`, C = COLS[ci]; WITEM[id] = { id, slot, style, ci, n: ncol ? `${C[0]} ${n}` : n, price, c: C[1], C: C[2], a: COLS[(ci + 5) % COLS.length][1] }; WLIST[slot].push(id); });
  });
}
addItems('top', TOPS, 3); addItems('bottom', BOTTOMS, 3); addItems('shoes', SHOES, 2); addItems('hat', HATS, 2); addItems('gl', GLASSES, 0); addItems('acc', EXTRAS, 2);
const TABS = { look: 'ลุคแฟชั่น', hair: 'ทรงผม', dye: 'สีย้อมผม', top: 'เสื้อ', bottom: 'กระโปรง/กางเกง', shoes: 'รองเท้า', hat: 'หมวก', gl: 'แว่นตา', acc: 'เครื่องประดับ' };

const wearOf = () => st.wear || (st.wear = {});
const owned = id => !!(st.owned && st.owned[id]);
function wearPal() {
  const w = wearOf(), o = {}, it = id => id && WITEM[id];
  const t = it(w.top), b = it(w.bottom), s = it(w.shoes), h = it(w.hat), g = it(w.gl), a = it(w.acc), hs = HAIRSTYLES.find(x => x.id === w.hair), dy = DYES[w.dye];
  if (t) Object.assign(o, { topS: t.style, c: t.c, C: t.C, a: t.a });
  if (b) Object.assign(o, { botS: b.style, p: b.c, skirt: b.style === 'skirt' ? 1 : 0 });
  if (s) Object.assign(o, { shoeS: s.style, f: shade(s.c, -40) });
  if (h) Object.assign(o, { hatS: h.style, hatC: h.c });
  if (g) o.glS = g.style;
  if (a) Object.assign(o, { accS: a.style, accC: a.c });
  if (hs) Object.assign(o, { style: hs.style, hx: hs.hx, clip: 0 });
  if (dy) Object.assign(o, { h: dy[0], H: dy[1], L: dy[2] });
  return o;
}
const playerPal = () => ({ ...palOf(st.look), ...OUTFITS[st.outfit], ...wearPal(), bust: st.look.g === 'f' && age() >= 18 });
dressPlayer = () => { player.spr = sheet(playerPal()); };
function previewOf(item) {     // little thumbnail of the player wearing one item
  const w = { ...wearOf() }, probe = item.slot ? { ...w, [item.slot]: item.id } : item.hx !== undefined ? { ...w, hair: item.id } : { ...w, dye: item.idx };
  const keep = st.wear; st.wear = probe; const c = outline(charCanvas({ ...palOf(st.look), ...wearPal() }, 'front', 0)); st.wear = keep;   // one frame only: a full sheet per row is slow
  c.style.cssText = 'width:24px;height:40px;image-rendering:pixelated'; return c;
}
let wTab = 'top';
function wardrobePanel(mode) {
  const tabs = mode === 'salon' ? ['hair', 'dye'] : mode === 'fashion' ? ['look', 'top', 'bottom', 'shoes', 'hat', 'gl', 'acc'] : Object.keys(TABS);
  if (!tabs.includes(wTab)) wTab = tabs[0];
  openPanel(mode === 'salon' ? '💇 ร้านทำผม' : mode === 'fashion' ? '👗 ร้านเสื้อผ้า' : '👚 ตู้เสื้อผ้า', () => {
    const pv = el('canvas', { width: 24, height: 40 }); pv.getContext('2d').drawImage(sheet(playerPal())[0][0], 0, 0); pv.style.cssText = 'width:72px;height:120px;image-rendering:pixelated;align-self:center;background:#ffffff14;border-radius:10px';
    const bar = el('div', { className: 'tabs' }, ...tabs.map(k => el('button', { className: k === wTab ? 'on' : '', textContent: TABS[k], onclick: () => { wTab = k; refreshPanel(); } })));
    const shop = mode !== 'closet', w = wearOf(), rows = [];
    const action = (id, price, isOn, equip, unequip) => {
      if (shop && !owned(id)) return btn(`฿${price}`, () => { if (st.money < price) return say('เงินไม่พอ'); st.money -= price; (st.owned || (st.owned = {}))[id] = 1; say('ซื้อแล้ว! ใส่ได้ที่ตู้เสื้อผ้าหรือที่นี่เลย'); equip(); dressPlayer(); refreshPanel(); save(); }, st.money < price);
      return isOn ? btn('ถอด', () => { unequip(); dressPlayer(); refreshPanel(); save(); }) : btn('ใส่', () => { equip(); dressPlayer(); refreshPanel(); save(); });
    };
    if (wTab === 'hair') for (const hs of HAIRSTYLES) { const id = 'hair:' + hs.id, own = hs.price === 0 || owned(id), on = w.hair === hs.id || (!w.hair && (hs.id === st.look.hx || (!st.look.hx && hs.id === st.look.style)));
      rows.push(row(previewOf(hs), hs.n, hs.price ? (own ? 'มีแล้ว' : `฿${hs.price}`) : 'ฟรี', action(id, hs.price, on, () => { w.hair = hs.id; }, () => { delete w.hair; }))); }
    else if (wTab === 'look') rows.push(...lookRows(shop));
    else if (wTab === 'dye') DYES.forEach((d, i) => rows.push(row(previewOf({ idx: i, hx: undefined }), `สีที่ ${i + 1}`, i < HAIR.length ? 'สีธรรมชาติ' : 'สีแฟนตาซี', action('dye:' + i, i < HAIR.length ? 0 : 60, w.dye === i, () => { w.dye = i; }, () => { delete w.dye; }))));
    else for (const id of WLIST[wTab]) { const it = WITEM[id]; if (!shop && !owned(id)) continue; rows.push(row(previewOf(it), it.n, shop && !owned(id) ? '' : '', action(id, it.price, w[wTab] === id, () => { w[wTab] = id; }, () => { delete w[wTab]; }))); }
    if (!rows.length) rows.push(el('div', { className: 'sub' }, 'ยังไม่มีอะไรเลย — ไปซื้อเสื้อผ้าที่ร้านเสื้อผ้า 👗'));
    return [pv, shop ? money() : null, bar, ...rows];
  });
}
// the shop rows show a free "Take off"-style action for dyes/hair that cost 0
FURN_ACTS.wardrobe = () => [['เปิดตู้เสื้อผ้า', () => wardrobePanel('closet')]];
town.targets.push({ x: bld('fashion').ix, y: bld('fashion').iy, name: 'ร้านเสื้อผ้า', opts: [['เลือกดูเสื้อผ้า', () => wardrobePanel('fashion')]] },
  { x: bld('salon').ix, y: bld('salon').iy, name: 'ร้านทำผม', opts: [['เปลี่ยนทรงผม / สีย้อม', () => wardrobePanel('salon')]] });

// townsfolk and parents get random outfits so the crowd looks varied
const TOPKEYS = Object.keys(TOPFX), HATKEYS = Object.keys(HATFX), GLKEYS = Object.keys(GLFX), HAIRX = HAIRSTYLES.filter(h => h.hx);
const pickOf = (a, k) => a[(k * 7 + 3) % a.length];
const randomWear = (p, k) => ({ ...(k % 2 ? { hx: pickOf(HAIRX, k).hx, style: pickOf(HAIRX, k).style, clip: 0 } : {}), ...(k % 3 ? { topS: pickOf(TOPKEYS, k) } : {}),
  ...(k % 4 === 1 ? { botS: pickOf(['shorts', 'cargo', 'slacks', 'leggings'], k) } : {}), ...(k % 5 === 2 ? { hatS: pickOf(HATKEYS, k), hatC: COLS[k % 10][1] } : {}), ...(k % 6 === 3 ? { glS: pickOf(GLKEYS, k) } : {}), ...(k % 7 === 4 ? { accS: 'scarf', accC: COLS[(k + 2) % 10][1] } : {}) });
var npcWear = randomWear;   // fashion.js swaps in style-themed outfits
const _makePeople = makePeople;
makePeople = () => {
  _makePeople();
  people.forEach((p, k) => { p.spr = sheet({ ...p.pal, ...npcWear(p, k), bust: p.g === 'f' && p.age >= 18 }); });
  folks.forEach((f, i) => {                                  // six ambient wanderers share the same outfit pool
    const a = CHARS[i % 4], b = CHARS[(i * 3 + 1) % 4], o = OUTFITS[(i + 2) % OUTFITS.length];
    f.spr = sheet({ ...a, c: o.c || b.c, C: o.C || b.C, a: o.a || b.a, p: b.p, ...npcWear({ id: 'folk' + i, g: i % 2 ? 'f' : 'm', age: 20 + (i * 7) % 40 }, 400 + i) });
  });
};
const _makeFamily = makeFamily;
makeFamily = () => { _makeFamily(); fam.forEach((p, k) => { p.spr = sheet({ ...palOf(st.parents[p.id].look), ...npcWear(p, k + 11), bust: st.parents[p.id].g === 'f' }); p.h.spr = p.spr; }); };
ACH.push(['closet', '👗 แฟชั่นนิสต้า', 'เป็นเจ้าของเสื้อผ้า 20 ชิ้น', () => Object.keys(st.owned || {}).length >= 20], ['restyle', '💇 ลุคใหม่', 'เปลี่ยนทรงผมที่ร้านเสริมสวย', () => !!st.wear?.hair]);
console.assert(Object.keys(WITEM).length >= 100, 'at least 100 clothing items');
console.assert(HAIRSTYLES.length >= 20 && DYES.length >= 20, 'hair choices');
console.assert(Object.values(WITEM).every(i => i.c && TOPFX[i.style] || HATFX[i.style] || GLFX[i.style] || ACCFX[i.style] || ['jeans', 'shorts', 'skirt', 'longskirt', 'cargo', 'leggings', 'slacks', 'sneakers', 'boots', 'sandals', 'heels', 'slippers', 'plain', 'tee'].includes(i.style)), 'every item style is drawable');
