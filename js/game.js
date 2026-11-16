'use strict';
const T = 32;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let VW, VH;
function resize() {
  // visible height, not 100vh: on phones 100vh runs under the browser toolbars and hides bottom buttons
  const w = innerWidth, h = Math.round(visualViewport?.height || innerHeight);
  document.documentElement.style.setProperty('--vh', h + 'px');
  const s = Math.max(Math.min(w, h) < 500 ? 2 : 1, Math.round(Math.min(w, h) / 380));   // phones get 2x so people are not tiny
  VW = cv.width = Math.ceil(w / s); VH = cv.height = Math.ceil(h / s);
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize); visualViewport?.addEventListener('resize', resize); resize();
// phones: first tap goes fullscreen and locks landscape where the browser allows it (Android); iPhone relies on the rotate screen
// on pointerup, after the tap's click has landed: going fullscreen moves the page, and on pointerdown the tap then missed its button
if (matchMedia('(pointer:coarse)').matches) addEventListener('pointerup', () => setTimeout(() => {
  const d = document.documentElement; if (document.fullscreenElement || !d.requestFullscreen) return;
  d.requestFullscreen().then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
}, 0), { once: true });

// ================= drawing primitives (g = current target) =================
let g = ctx;
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
// willReadFrequently keeps these canvases in CPU memory: thousands of GPU-backed sprite canvases make Chrome drop big ones (the town ground went blank)
const ctx2d = c => c.getContext('2d', { willReadFrequently: true });
function onCanvas(c, fn) { const p = g; g = ctx2d(c); try { fn(); } finally { g = p; } return c; }
function R(c, x, y, w = 1, h = 1) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function disc(cx, cy, r, c, sy = 1) {
  g.fillStyle = c;
  for (let dy = -r; dy <= r; dy++) { const hw = Math.round(Math.sqrt(r * r - dy * dy)); g.fillRect(cx - hw, cy + Math.round(dy * sy), hw * 2, 1); }
}
function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, v + a));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function outline(c, col = '#2a1a2e') {
  const x = c.getContext('2d'), W = c.width, H = c.height, a = x.getImageData(0, 0, W, H).data, out = [];
  const on = (i, j) => i >= 0 && j >= 0 && i < W && j < H && a[(j * W + i) * 4 + 3] > 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++)
    if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) out.push(i, j);
  x.fillStyle = col; for (let k = 0; k < out.length; k += 2) x.fillRect(out[k], out[k + 1], 1, 1);
  return c;
}
function flipC(c) { const n = mk(c.width, c.height), x = ctx2d(n); x.scale(-1, 1); x.drawImage(c, -c.width, 0); return n; }
const now = () => performance.now();

// 3x5 pixel font for signs and floating numbers
const GL = { A: '010101111101101', C: '011100100100011', E: '111100110100111', F: '111100110100100', H: '101101111101101',
  I: '111010010010111', K: '101101110101101', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', R: '110101110101101', T: '111010010010010', U: '101101101101111', X: '101101010101101',
  Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111',
  4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001010010', 8: '111101111101111',
  9: '111101111001111', '+': '000010111010000', '-': '000000111000000' };
const ptw = (s, sc = 1) => String(s).length * 4 * sc - sc;
function ptext(s, x, y, col, sc = 1, sh = '#2a1a2e') {
  for (const [c, dx] of sh ? [[sh, 1], [col, 0]] : [[col, 0]]) {
    let cx = x;
    for (const ch of String(s).toUpperCase()) {
      const gl = GL[ch];
      if (gl) for (let i = 0; i < 15; i++) if (gl[i] === '1') R(c, cx + (i % 3) * sc + dx, y + ((i / 3) | 0) * sc + dx, sc, sc);
      cx += 4 * sc;
    }
  }
}

// ================= 32x32 characters =================
const SK0 = '#f7cfa6', SKD0 = '#e2a882';
const CHARS = [
  { n: 'ต้น', style: 'short', h: '#a0582e', H: '#6e3519', L: '#c8804e', c: '#c8402e', C: '#8a2a1e', a: '#6ad0e8', p: '#3b2a3e', f: '#2a1a1e', e: '#3a2418' },
  { n: 'มิ้นท์', style: 'swept', h: '#c4ecbc', H: '#88c08a', L: '#f0fff0', c: '#58c47a', C: '#2f7a48', a: '#245a34', p: '#24402c', f: '#18281c', e: '#2a6a3a' },
  { n: 'พิงค์', style: 'bob', clip: 1, skirt: 1, h: '#f070b0', H: '#c04a8a', L: '#ffb0d8', c: '#9a48a8', C: '#6e2c7c', a: '#ff8ac8', p: '#f2d44a', f: '#e0a040', e: '#6a2a5a' },
  { n: 'ฟ้า', style: 'long', h: '#3f74e8', H: '#2648b0', L: '#8ab0ff', c: '#58c8ec', C: '#3a8cc4', a: '#2648b0', p: '#2c3c9c', f: '#1c2468', e: '#1c2c7a' },
];
const OUTFITS = [{}, { c: '#f4f4f4', C: '#c8c8d4', a: '#3a5ad8' }, { c: '#3a3a4a', C: '#24242e', a: '#e85a5a' },
  { c: '#f2c84a', C: '#c8982a', a: '#ffffff' }, { c: '#e87a9a', C: '#b8506e', a: '#fff0f4' }, { c: '#5a8ad8', C: '#3a5aa8', a: '#ffe14a' }];
// charCanvas / sheet live in wearart.js (24x40 sprites, 7 frames per direction)
// cat 16x9 (b body, d stripe, w white, e eye, n nose)
const CAT = ['...........b..b.', '...........bbbb.', 'b.........bebbeb', 'b.........bbnbbb', '.b........wbbbb.',
  '.bbbdbdbbbbb....', '..bbbdbdbbbbb...', '..bwbbbbbbbwb...'];
const CAT_LEGS = ['..b.b.....b.b...', '...b.b...b.b....'];
const CATPAL = { b: '#f0a050', d: '#c87830', w: '#fff4e0', e: '#2a1a2e', n: '#ff8aa0' };
const catSpr = CAT_LEGS.map(l => {
  const c = outline(onCanvas(mk(18, 11), () => CAT.concat(l).forEach((r, y) => [...r].forEach((ch, x) => ch !== '.' && R(CATPAL[ch], x + 1, y + 1)))));
  return [flipC(c), c];
});

// ================= game data =================
const ITEMS = {
  rice: { n: 'ข้าวสาร', p: 10, ic: '🍚', k: 'ing' }, egg: { n: 'ไข่', p: 8, ic: '🥚', k: 'ing' }, veg: { n: 'ผัก', p: 12, ic: '🥬', k: 'ing' },
  meat: { n: 'เนื้อ', p: 25, ic: '🥩', k: 'ing' }, milk: { n: 'นม', p: 10, ic: '🥛', k: 'ing', food: 8 }, flour: { n: 'แป้ง', p: 10, ic: '🌾', k: 'ing' },
  fruit: { n: 'ผลไม้', p: 15, ic: '🍓', k: 'ing', food: 10, mood: 2 },
  bread: { n: 'ขนมปัง', p: 30, ic: '🍞', k: 'food', food: 25 }, coffee: { n: 'กาแฟกระป๋อง', p: 25, ic: '☕', k: 'food', energy: 15, food: 2 },
  choco: { n: 'ช็อกโกแลต', p: 40, ic: '🍫', k: 'gift', food: 8, mood: 6 }, flower: { n: 'ดอกไม้', p: 30, ic: '🌷', k: 'gift' },
  bouquet: { n: 'ช่อดอกไม้ใหญ่', p: 150, ic: '💐', k: 'gift' }, plush: { n: 'ตุ๊กตาหมี', p: 80, ic: '🧸', k: 'gift' },
  book: { n: 'หนังสือนิยาย', p: 60, ic: '📕', k: 'gift' }, painting: { n: 'ภาพวาดของฉัน', ic: '🖼️', k: 'gift' },
  omelet: { n: 'ไข่เจียว', ic: '🍳', k: 'dish', food: 35, mood: 3 }, salad: { n: 'สลัดผัก', ic: '🥗', k: 'dish', food: 25, mood: 6 },
  krapow: { n: 'ผัดกะเพรา', ic: '🍛', k: 'dish', food: 55, mood: 6 }, pancake: { n: 'แพนเค้ก', ic: '🥞', k: 'dish', food: 35, mood: 15 },
  tomyum: { n: 'ต้มยำ', ic: '🍲', k: 'dish', food: 60, mood: 10 }, steak: { n: 'สเต๊ก', ic: '🍖', k: 'dish', food: 75, mood: 15 },
  cake: { n: 'เค้กผลไม้', ic: '🍰', k: 'dish', food: 40, mood: 30 },
};
const MART_STOCK = ['rice', 'egg', 'veg', 'meat', 'milk', 'flour', 'fruit', 'bread', 'coffee', 'choco', 'flower', 'bouquet', 'plush', 'book'];
const RECIPES = [
  { id: 'omelet', lv: 0, need: { egg: 1, rice: 1 }, t: 20 }, { id: 'salad', lv: 0, need: { veg: 2 }, t: 15 },
  { id: 'krapow', lv: 2, need: { meat: 1, veg: 1, rice: 1 }, t: 30 }, { id: 'pancake', lv: 3, need: { flour: 1, egg: 1, milk: 1 }, t: 30 },
  { id: 'tomyum', lv: 4, need: { meat: 1, veg: 2 }, t: 40 }, { id: 'steak', lv: 6, need: { meat: 2, veg: 1 }, t: 40 },
  { id: 'cake', lv: 8, need: { flour: 1, egg: 1, milk: 1, fruit: 1 }, t: 60 },
];
const SKILLS = { cook: ['ทำอาหาร', '🍳', 'สูตรใหม่ อาหารอิ่มขึ้น เลื่อนขั้นบาริสต้า'], logic: ['ตรรกะ', '🧠', 'งานฟรีแลนซ์ได้มากขึ้น เลื่อนขั้นออฟฟิศ'],
  charm: ['เสน่ห์', '💬', 'สนิทกับคนเร็วขึ้น เลื่อนขั้นร้านค้า'], fit: ['ฟิตเนส', '💪', 'เหนื่อยช้าลง'], art: ['ศิลปะ', '🎨', 'ภาพวาดขายได้แพงขึ้น'],
  fish: ['ตกปลา', '🎣', 'ปลาหายากมีโอกาสมากขึ้น'], garden: ['ทำสวน', '🌱', 'เลเวล 3+ เก็บเกี่ยวได้ผลผลิตเพิ่ม'] };
const CORE_SKILLS = ['cook', 'logic', 'charm', 'fit', 'art'];
const JOBS = {
  office: { n: 'พนักงานออฟฟิศ', at: 'ออฟฟิศ', start: 9, end: 17, weekdays: 1, skill: 'logic', titles: ['เด็กฝึกงาน', 'พนักงาน', 'หัวหน้าทีม', 'ผู้จัดการ', 'ผู้บริหาร'], pay: [120, 180, 260, 360, 500], req: [0, 2, 4, 6, 8], tasks: ['พิมพ์รายงาน', 'นำเสนองาน', 'ตอบอีเมลลูกค้า'] },
  barista: { n: 'บาริสต้า', at: 'คาเฟ่', start: 7, end: 15, skill: 'cook', titles: ['ผู้ช่วยในร้าน', 'บาริสต้า', 'หัวหน้าบาริสต้า', 'ผู้จัดการร้าน', 'เชฟเจ้าของร้าน'], pay: [90, 140, 210, 300, 420], req: [0, 2, 4, 6, 8], tasks: ['ชงลาเต้', 'ตีฟองนม', 'เสิร์ฟลูกค้า'] },
  clerk: { n: 'พนักงานร้านค้า', at: 'มินิมาร์ท', start: 14, end: 22, skill: 'charm', titles: ['พาร์ทไทม์', 'พนักงานประจำ', 'หัวหน้ากะ', 'ผู้จัดการสาขา', 'เจ้าของแฟรนไชส์'], pay: [80, 130, 190, 270, 380], req: [0, 2, 4, 6, 8], tasks: ['คิดเงินลูกค้า', 'จัดชั้นสินค้า', 'เช็คสต็อก'] },
};
const FURN = {
  bed1: { n: 'เตียงธรรมดา', w: 2, h: 2, price: 0, cf: 2, cat: 'bed', c: '#5a8ad8', fr: '#7a4a28' },
  bed2: { n: 'เตียงนุ่มฟู', w: 2, h: 2, price: 600, cf: 6, cat: 'bed', tier: 2, c: '#e87a9a', fr: '#f0ece4' },
  bed3: { n: 'เตียงหรูคิงไซซ์', w: 2, h: 2, price: 1800, cf: 12, cat: 'bed', tier: 3, c: '#8a3ac8', fr: '#3a2a22', gold: 1 },
  fridge: { n: 'ตู้เย็น', price: 300, cat: 'fridge' },
  stove1: { n: 'เตาธรรมดา', price: 0, cat: 'stove' }, stove2: { n: 'เตาเชฟมืออาชีพ', price: 900, cf: 1, cat: 'stove', tier: 2, chrome: 1 },
  sink: { n: 'อ่างล้างจาน', price: 200, cat: 'sink' },
  shelf1: { n: 'ชั้นหนังสือ', price: 0, cf: 1, cat: 'shelf' }, shelf2: { n: 'ห้องสมุดมินิ', w: 2, price: 700, cf: 4, cat: 'shelf', tier: 2 },
  tv1: { n: 'ทีวี', w: 2, price: 0, cf: 2, cat: 'tv' }, tv2: { n: 'ทีวีจอยักษ์', w: 2, price: 1200, cf: 6, cat: 'tv', tier: 2, big: 1 },
  pc1: { n: 'คอมพิวเตอร์', w: 2, price: 0, cat: 'pc' }, pc2: { n: 'คอมเกมมิ่ง RGB', w: 2, price: 1500, cf: 3, cat: 'pc', tier: 2, gaming: 1 },
  sofa1: { n: 'โซฟา', w: 2, price: 0, cf: 3, cat: 'sofa', c: '#c05a4a' }, sofa2: { n: 'โซฟาหนังพรีเมียม', w: 2, price: 800, cf: 7, cat: 'sofa', tier: 2, c: '#7a4a2a' },
  wardrobe: { n: 'ตู้เสื้อผ้า', price: 300, cf: 1, cat: 'wardrobe' }, tub: { n: 'อ่างน้ำอุ่น', w: 2, price: 500, cf: 2, cat: 'tub' },
  plant: { n: 'ต้นไม้กระถาง', price: 100, cf: 2, cat: 'plant' }, lamp: { n: 'โคมไฟตั้งพื้น', price: 120, cf: 3, cat: 'decor', d: 'lamp' },
  easel: { n: 'ขาตั้งวาดรูป', price: 300, cf: 2, cat: 'easel' }, treadmill: { n: 'ลู่วิ่ง', price: 700, cat: 'gym' },
  mirror: { n: 'กระจกบานใหญ่', price: 250, cf: 1, cat: 'mirror' }, piano: { n: 'เปียโน', w: 2, price: 2500, cf: 10, cat: 'piano' },
  aquarium: { n: 'ตู้ปลา', w: 2, price: 900, cf: 8, cat: 'aquarium' }, fern: { n: 'เฟิร์นใบใหญ่', price: 150, cf: 3, cat: 'decor', d: 'fern' },
  cactus: { n: 'แคคตัส', price: 80, cf: 2, cat: 'decor', d: 'cactus' }, teddy: { n: 'ตุ๊กตาหมียักษ์', price: 250, cf: 4, cat: 'decor', d: 'teddy' },
  rug: { n: 'พรมลายไทย', w: 4, h: 2, price: 200, cf: 4, cat: 'decor', d: 'rug', floor: 1 },
  rug2: { n: 'พรมกลมสีฟ้า', w: 3, h: 2, price: 350, cf: 5, cat: 'decor', d: 'rug2', floor: 1 },
};
for (const k in FURN) FURN[k] = { w: 1, h: 1, cf: 0, tier: 1, d: FURN[k].cat, ...FURN[k] };
const CATDESC = { bed: 'นอนฟื้นพลัง เกรดสูงได้ความสุขมากขึ้น', fridge: 'เก็บและกินอาหาร', stove: 'ทำอาหาร เกรดสูงได้ประสบการณ์ ×1.5 และอาหารอิ่มขึ้น', sink: 'ล้างหน้าสดชื่น',
  shelf: 'อ่านหนังสือฝึกตรรกะ', tv: 'ดูทีวีเพิ่มความสุข', pc: 'ฟรีแลนซ์ เล่นเกม เรียนออนไลน์ ขายภาพ', sofa: 'นั่งพักฟื้นพลัง', wardrobe: 'เปลี่ยนชุด',
  tub: 'แช่น้ำอุ่นคลายเครียด', plant: 'รดน้ำทุกวันจนออกดอก', easel: 'วาดภาพ ฝึกศิลปะ', gym: 'วิ่งฝึกฟิตเนส', mirror: 'ฝึกพูด เพิ่มเสน่ห์', piano: 'เล่นเปียโน ฝึกศิลปะ+เสน่ห์',
  aquarium: 'ดูปลาผ่อนคลาย', decor: 'ของตกแต่ง' };
const HOME_SIZES = [[12, 9, 0], [16, 9, 3000], [16, 12, 8000]];
const DEFAULT_FURN = [['fridge', 0, 2], ['stove1', 1, 2], ['sink', 2, 2], ['shelf1', 4, 2], ['tv1', 5, 2], ['plant', 7, 2], ['wardrobe', 9, 2],
  ['bed1', 10, 2], ['rug', 4, 3], ['sofa1', 5, 5], ['pc1', 0, 6], ['tub', 10, 7], ['lamp', 11, 5]];
const WEEK = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

// ================= state =================
function newState() {
  return { v: 3, name: 'Player', look: null, parents: null, lastAge: 6, money: 300, famMoney: 700, energy: 80, food: 70, mood: 70, min: 8 * 60, char: 0, outfit: 0, plant: 0, watered: 0,
    sk: { cook: 0, logic: 0, charm: 0, fit: 0, art: 0, fish: 0 }, inv: { egg: 2, rice: 2, veg: 2 }, store: {}, homeLv: 0,
    furn: DEFAULT_FURN.map(([id, x, y]) => ({ id, x, y })), job: null, rel: {}, partner: null, ach: {},
    stats: { shifts: 0, promos: 0, cooked: 0, furnBought: 0, gifts: 0, dates: 0, paintings: 0 } };
}
let st = newState();
const hour = () => (st.min % 1440) / 60;
const day = () => Math.floor(st.min / 1440) + 1;
const YEAR = 28;                                   // days per game year
const age = () => 6 + Math.floor((day() - 1) / YEAR) + (st.ageShift || 0);   // ageShift: set when you take over as your grown-up child
const stage = a => a < 13 ? 'child' : a < 18 ? 'teen' : a < 60 ? 'adult' : 'elder';
const weekday = () => (day() - 1) % 7;
const isNight = () => { const h = hour(); return h >= 18.5 || h < 6; };
const lv = s => Math.min(10, Math.floor(Math.sqrt((st.sk[s] || 0) / 40)));
const xpAt = l => 40 * l * l;
const have = id => st.inv[id] || 0;
function addItem(id, n = 1) { st.inv[id] = have(id) + n; if (st.inv[id] <= 0) delete st.inv[id]; }

// ================= scenes =================
function makeScene(W, H) { return { W, H, tile: new Uint8Array(W * H), solid: new Uint8Array(W * H), statics: [], targets: [], ents: [] }; }
const town = makeScene(40, 44), home = makeScene(12, 9);   // taller map: the southern residential lane (Phase 3)
function solidAt(sc, x, y) { const tx = Math.floor(x / T), ty = Math.floor(y / T); return tx < 0 || ty < 0 || tx >= sc.W || ty >= sc.H || sc.solid[ty * sc.W + tx] === 1; }
function blocked(sc, x, y, avoidRoad) {
  for (const [a, b] of [[x - 8, y - 6], [x + 8, y - 6], [x - 8, y], [x + 8, y]])
    if (solidAt(sc, a, b) || (avoidRoad && sc.tile[Math.floor(b / T) * sc.W + Math.floor(a / T)] === 1)) return true;
  return false;
}
function move(sc, e, dx, dy, avoidRoad) {
  let hit = false;
  if (dx) { if (!blocked(sc, e.x + dx, e.y, avoidRoad)) e.x += dx; else hit = true; }
  if (dy) { if (!blocked(sc, e.x, e.y + dy, avoidRoad)) e.y += dy; else hit = true; }
  return hit;
}
const setSolid = (sc, x, y, w = 1, h = 1) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) sc.solid[j * sc.W + i] = 1; };
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ===== town =====
{
  const { W, H, tile } = town;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const rx = x % 14, ry = y % 12;
    tile[y * W + x] = (rx === 6 || rx === 7 || ry === 5 || ry === 6) ? 1 : (rx === 5 || rx === 8 || ry === 4 || ry === 7) ? 2
      : (x >= 12 && x <= 15 && y >= 23 && y <= 25) ? 4 : (x >= 9 && x <= 18 && y >= 20 && y <= 27) ? 3 : 0;
  }
  setSolid(town, 12, 23, 4, 3);
}
const BUILDINGS = [
  { n: 'บ้านของฉัน', x: 10, y: 9, w: 4, h: 3, wh: 62, wall: '#f3e2c0', roof: '#c0504a', curtain: '#e87a8a', box: 1, chimney: 1, act: 'home' },
  { n: 'มินิมาร์ท', x: 15, y: 9, w: 4, h: 3, wh: 58, wall: '#f4f4f0', roof: '#3a9a5a', awn: ['#3a9a5a', '#ffffff'], sign: 'MART', act: 'mart', door: '#5aa0c8' },
  { x: 0, y: 9, w: 4, h: 3, wh: 58, wall: '#d8e8c8', roof: '#7a5a9a', curtain: '#9a7ad8', chimney: 1 },
  { n: 'คาเฟ่', x: 23, y: 9, w: 4, h: 3, wh: 58, wall: '#e0b890', roof: '#6a3e2a', awn: ['#c8402e', '#fff8e8'], sign: 'CAFE', act: 'cafe', curtain: '#f0e0b0' },
  { n: 'ออฟฟิศ', x: 28, y: 8, w: 5, h: 4, wh: 124, wall: '#8aa4c0', roof: '#5a6878', glass: 1, sign: 'OFFICE', act: 'office' },
  { n: 'ร้านเฟอร์นิเจอร์', x: 37, y: 9, w: 3, h: 3, wh: 58, wall: '#f8e8a0', roof: '#c07040', awn: ['#c07040', '#fff4d0'], sign: 'FURNI', act: 'furni', door: '#7a5a9a' },
  { x: 10, y: 1, w: 4, h: 3, wh: 60, wall: '#e8d0d0', roof: '#8a4a5a', curtain: '#f0f0f0', chimney: 1 },
  { n: 'ศาลากลาง', x: 24, y: 1, w: 6, h: 3, wh: 96, wall: '#c0d0e0', roof: '#4a5a6a', glass: 1, sign: 'TOWN HALL', act: 'hall' },
  { x: 23, y: 20, w: 4, h: 4, wh: 104, wall: '#d8c0e0', roof: '#6a4a82', curtain: '#ffd0e0', box: 1 },
  { x: 28, y: 21, w: 4, h: 3, wh: 58, wall: '#f0d0b8', roof: '#4a7ab0', curtain: '#a0d8a0', chimney: 1 },
  { x: 0, y: 21, w: 4, h: 3, wh: 58, wall: '#c8e0f0', roof: '#3a7a6a', curtain: '#f0c0a0', box: 1 },
  { n: 'พิพิธภัณฑ์', x: 37, y: 21, w: 3, h: 3, wh: 70, wall: '#e8e0d0', roof: '#8a5a3a', sign: 'MUSEUM', act: 'museum', door: '#4a3a2a', curtain: '#fff' },
  // civic buildings and shops (appended so earlier indices stay stable)
  { n: 'โรงเรียน', x: 14, y: 1, w: 5, h: 3, wh: 88, wall: '#f2d890', roof: '#b04a3a', sign: 'SCHOOL', act: 'school' },
  { n: 'ห้องสมุด', x: 30, y: 1, w: 3, h: 3, wh: 70, wall: '#d8c8b0', roof: '#5a4a6a', sign: 'BOOKS', act: 'library', curtain: '#8a6ad8' },
  { n: 'โรงหนัง', x: 37, y: 1, w: 3, h: 3, wh: 76, wall: '#3a3050', roof: '#2a2038', sign: 'CINEMA', act: 'cinema', door: '#c8402e' },
  { n: 'ร้านดอกไม้', x: 0, y: 1, w: 4, h: 3, wh: 60, wall: '#fbe0e8', roof: '#e87a9a', awn: ['#e87a9a', '#ffffff'], sign: 'FLOWER', act: 'flower' },
  { n: 'คลินิก', x: 0, y: 25, w: 4, h: 3, wh: 64, wall: '#f4f8fa', roof: '#4a8ac8', sign: 'CLINIC', act: 'clinic', door: '#5aa0c8' },
  { n: 'ฟิตเนส', x: 28, y: 25, w: 4, h: 3, wh: 62, wall: '#c8c8d4', roof: '#3a3a48', sign: 'GYM', act: 'gym', glass: 1 },
  { n: 'ร้านสัตว์เลี้ยง', x: 23, y: 25, w: 4, h: 3, wh: 60, wall: '#f8e8c0', roof: '#6a9a4a', awn: ['#6a9a4a', '#fff4d0'], sign: 'PETS', act: 'pet' },
  { n: 'ร้านของเล่น', x: 37, y: 25, w: 3, h: 3, wh: 60, wall: '#d8f0f8', roof: '#e8884a', awn: ['#e8884a', '#ffffff'], sign: 'TOYS', act: 'toy' },
  { n: 'ร้านเสื้อผ้า', x: 37, y: 13, w: 3, h: 3, wh: 62, wall: '#f8d0e0', roof: '#a84a7a', awn: ['#a84a7a', '#fff0f8'], sign: 'FASHION', act: 'fashion' },
  { n: 'โบสถ์', x: 14, y: 13, w: 4, h: 3, wh: 92, wall: '#f4f0e8', roof: '#8a8a9a', sign: 'CHAPEL', act: 'chapel', door: '#8a5a34', curtain: '#8ab0e8' },
  { n: 'ที่ดินให้เช่า', x: 28, y: 13, w: 4, h: 3, wh: 58, wall: '#c8c4b8', roof: '#8a8a92', sign: 'FOR RENT', act: 'lot', door: '#6a6a72' },
  { n: 'ร้านทำผม', x: 0, y: 13, w: 4, h: 3, wh: 60, wall: '#e8e0f8', roof: '#6a4aa8', sign: 'SALON', act: 'salon', door: '#d84a8a' },
  // southern residential lane (Phase 3): five more family homes, appended so old indices stay stable
  { x: 0, y: 33, w: 4, h: 3, wh: 58, wall: '#e8d8f0', roof: '#7a4a8a', curtain: '#d0b0e8', chimney: 1 },
  { x: 9, y: 33, w: 4, h: 3, wh: 58, wall: '#f0e0c8', roof: '#4a7a5a', curtain: '#a8d8b8', box: 1 },
  { x: 15, y: 33, w: 4, h: 3, wh: 58, wall: '#d8e8f0', roof: '#b05a3a', curtain: '#f0c8a0' },
  { x: 23, y: 33, w: 4, h: 3, wh: 58, wall: '#f8e0a8', roof: '#5a5a9a', curtain: '#c8c8f0', chimney: 1 },
  { x: 28, y: 33, w: 4, h: 3, wh: 58, wall: '#f0c8d0', roof: '#3a7a7a', curtain: '#a8e0d8', box: 1 },
];
for (const b of BUILDINGS) {
  setSolid(town, b.x, b.y, b.w, b.h);
  const X = b.x * T, w = b.w * T, bot = (b.y + b.h) * T, top = bot - b.wh;
  b.dx = X + w / 2; b.ix = b.dx; b.iy = bot + 12;
  const ww = b.glass ? 12 : 16, gx = b.glass ? 18 : 28, gy = b.glass ? 24 : 30;
  const n = Math.floor((w - 16 + gx - ww) / gx), ox = X + Math.round((w - (n * gx - (gx - ww))) / 2);
  b.win = [];
  for (let wy = top + (b.sign ? 28 : 12); wy + 16 < bot - 8; wy += gy)
    for (let i = 0; i < n; i++) {
      const wx = ox + i * gx;
      if (Math.abs(wx + ww / 2 - b.dx) < ww / 2 + 14 && wy + 16 > bot - 36) continue;
      if (b.awn && wy + 16 > bot - 48) continue;
      b.win.push([wx, wy]);
    }
  town.statics.push({ k: bot, f: () => drawBuilding(b) });
}
function drawWindow(b, wx, wy, night) {
  const ww = b.glass ? 12 : 16, wh = 16;
  if (!b.glass) R('#f4efe6', wx - 2, wy - 2, ww + 4, wh + 4); else R('#4a5a70', wx - 1, wy - 1, ww + 2, wh + 2);
  R(night ? '#ffd870' : '#8fd0f0', wx, wy, ww, wh);
  if (night) R('#fff0b0', wx + 3, wy + 3, ww - 6, wh - 6);
  else { R('#d6f2ff', wx + 2, wy + 2, 3, 2); R('#d6f2ff', wx + 2, wy + 4, 2, 2); R('#d6f2ff', wx + ww - 5, wy + wh - 4, 2, 2); }
  if (b.glass) return;
  R('#f4efe6', wx + ww / 2 - 1, wy, 2, wh); R('#f4efe6', wx, wy + wh / 2 - 1, ww, 2);
  if (b.curtain) { R(b.curtain, wx, wy, 3, wh); R(b.curtain, wx + ww - 3, wy, 3, wh); }
  R(shade(b.wall, -50), wx - 3, wy + wh + 2, ww + 6, 2);
  if (b.box) { R('#8a5a3a', wx - 1, wy + wh + 4, ww + 2, 4); for (let i = 0; i < ww; i += 4) R(i % 8 ? '#ff7ab0' : '#ffe14a', wx + i + 1, wy + wh + 2, 2, 2); }
}
function drawBuilding(b) {
  const X = b.x * T, w = b.w * T, bot = (b.y + b.h) * T, top = bot - b.wh, rh = b.h * T, rt = top - rh, night = isNight();
  R('#0003', X + w, top + 8, 10, b.wh - 2); R('#0002', X, bot, w + 10, 6);
  R(b.wall, X, top, w, b.wh);
  if (b.glass) for (let y = top + 4; y < bot - 4; y += 4) R(shade(b.wall, 8), X, y, w, 1);
  else for (let y = top + 4; y < bot - 6; y += 6) R(shade(b.wall, -10), X, y, w, 1);
  R(shade(b.wall, -28), X + w - 4, top, 4, b.wh); R(shade(b.wall, -45), X, bot - 6, w, 6);
  for (const [wx, wy] of b.win) drawWindow(b, wx, wy, night);
  if (b.awn) {
    const ay = bot - 46;
    for (let i = 0; i < w; i += 8) { const c = i % 16 ? b.awn[1] : b.awn[0]; R(c, X + i, ay, 8, 10); R(c, X + i + 2, ay + 10, 4, 2); }
    R('#0002', X, ay + 12, w, 3);
  }
  if (b.sign) {
    const tw = ptw(b.sign, 2) + 10, sx = Math.round(b.dx - tw / 2), sy = top + 6;
    R('#3a2a22', sx, sy, tw, 16); R('#5a4232', sx + 1, sy + 1, tw - 2, 14); ptext(b.sign, sx + 5, sy + 3, '#ffe9a0', 2);
  }
  const d = b.door || '#9a5a34';
  R('#4a3022', b.dx - 11, bot - 32, 22, 32); R(d, b.dx - 9, bot - 30, 18, 30);
  if (b.glass) { R('#9ad4f0', b.dx - 7, bot - 28, 6, 26); R('#9ad4f0', b.dx + 1, bot - 28, 6, 26); }
  else for (const [ox, oy] of [[-7, -27], [1, -27], [-7, -14], [1, -14]]) R(shade(d, -25), b.dx + ox, bot + oy, 6, 10);
  R('#ffd54a', b.dx + 4, bot - 16, 2, 2); R('#a8a090', b.dx - 13, bot - 2, 26, 4);
  if (b.glass) {
    R(b.roof, X - 2, rt, w + 4, rh); R(shade(b.roof, 25), X - 2, rt, w + 4, 3); R(shade(b.roof, -40), X - 2, top - 4, w + 4, 4);
    R('#c8ccd0', X + 10, rt + 10, 22, 14); R('#9aa0a8', X + 12, rt + 13, 18, 2); R('#9aa0a8', X + 12, rt + 18, 18, 2);
  } else {
    R(b.roof, X - 3, rt, w + 6, rh);
    for (let y = rt + 6, r = 0; y < top - 4; y += 6, r++) {
      R(shade(b.roof, -20), X - 3, y, w + 6, 1);
      for (let x = X - 3 + (r % 2) * 6; x < X + w + 3; x += 12) R(shade(b.roof, -20), x, y - 5, 1, 5);
    }
    R(shade(b.roof, 28), X - 3, rt, w + 6, 3); R(shade(b.roof, -55), X - 5, top - 5, w + 10, 5);
    if (b.chimney) { R('#9a5a4a', X + w - 26, rt - 14, 12, 20); R('#6a3a2a', X + w - 28, rt - 16, 16, 4); }
  }
}
const TREES = [[9, 20], [11, 20], [14, 20], [18, 20], [9, 23], [18, 24], [9, 27], [13, 27], [16, 27], [18, 27]];
const LAMPS = [[9, 15], [18, 15], [23, 15], [32, 15], [17, 25], [23, 27], [32, 27], [36, 15], [4, 15], [5, 36], [14, 36], [33, 36]];
const BENCHES = [[15, 21], [10, 25]];
const TABLES = [[23, 13], [26, 13]];
const GARDEN = [[11, 14], [12, 14], [13, 14], [11, 15], [12, 15], [13, 15]];   // community vegetable plots
const MAILBOX = [10, 12];
const nearB = (x, y) => BUILDINGS.some(b => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h + 1);
const taken = (x, y) => town.solid[y * town.W + x] || [...LAMPS, ...TABLES, ...GARDEN, MAILBOX].some(([a, b]) => Math.abs(a - x) <= 1 && Math.abs(b - y) <= 1)
  || BENCHES.some(([a, b]) => y >= b - 1 && y <= b + 1 && x >= a - 1 && x <= a + 2);
for (let i = 0; i < 500 && TREES.length < 42; i++) {
  const x = Math.floor(rnd() * town.W), y = Math.floor(rnd() * town.H);
  if (town.tile[y * town.W + x] === 0 && !nearB(x, y) && !taken(x, y)) TREES.push([x, y]);
}
let treeCol = ['#2f7d3a', '#3f9a46', '#5cb85a'];   // seasons.js recolours the leaves
function drawTree([tx, ty]) {
  const cx = tx * T + 16, base = ty * T + 28;
  disc(cx, base, 14, '#0003', .35);
  if ((tx * 7 + ty * 13) % 3 === 0) {
    R('#6b4226', cx - 3, base - 12, 6, 12);
    for (let i = 0; i < 3; i++) {
      const w = 20 - i * 5, y0 = base - 12 - i * 13;
      for (let r = 0; r < 16; r++) { const hw = Math.round(w * r / 16); R(i % 2 ? '#2e7a4a' : '#3a8a52', cx - hw, y0 - 16 + r, hw * 2, 1); R('#5aaa6a', cx - hw, y0 - 16 + r, Math.min(2, hw), 1); }
    }
    return;
  }
  R('#6b4226', cx - 3, base - 18, 6, 18); R('#4e2e18', cx + 1, base - 18, 2, 18);
  disc(cx, base - 32, 15, treeCol[0]); disc(cx - 3, base - 36, 11, treeCol[1]); disc(cx - 6, base - 40, 6, treeCol[2]);
  for (let k = 0; k < 10; k++) R('#286a32', cx - 12 + (k * 37 + tx * 11) % 24, base - 44 + (k * 53 + ty * 7) % 24, 2, 2);
}
function drawLamp([tx, ty]) {
  const cx = tx * T + 16, base = ty * T + 26;
  disc(cx, base, 5, '#0003', .4);
  R('#3a3a48', cx - 1, base - 44, 3, 44); R('#3a3a48', cx - 3, base - 4, 7, 4);
  R('#3a3a48', cx - 5, base - 50, 11, 4); R(isNight() ? '#fff2a0' : '#d8d8c8', cx - 4, base - 46, 9, 3);
}
function drawBench([tx, ty]) {
  const X = tx * T + 2, Y = ty * T + 8;
  R('#0003', X, Y + 18, 60, 4); R('#5a3a20', X + 4, Y + 10, 3, 10); R('#5a3a20', X + 53, Y + 10, 3, 10);
  R('#a8683a', X, Y, 60, 4); R('#a8683a', X, Y + 6, 60, 4); R('#c8844a', X, Y + 10, 60, 3); R('#7a4a28', X, Y + 13, 60, 1);
}
function drawTable([tx, ty]) {
  const cx = tx * T + 16, base = ty * T + 26;
  disc(cx, base, 10, '#0003', .4);
  R('#6a4a34', cx - 1, base - 34, 2, 34); R('#d8d0c0', cx - 8, base - 12, 16, 3); R('#8a6a4a', cx - 1, base - 12, 2, 12);
  disc(cx, base - 38, 16, '#c8402e', .35); for (let i = -14; i < 14; i += 8) R('#fff8e8', cx + i, base - 41, 4, 4);
  R('#b0e0f0', cx - 4, base - 15, 3, 3); R('#fff', cx + 2, base - 15, 3, 3);
}
function drawMailbox([tx, ty]) {
  const cx = tx * T + 16, base = ty * T + 26;
  R('#5a3a20', cx - 1, base - 16, 3, 16); R('#3a6ad8', cx - 6, base - 26, 12, 10); R('#2a4ab0', cx - 6, base - 18, 12, 2); R('#e84a4a', cx + 6, base - 26, 2, 6);
}
for (const t of TREES) { setSolid(town, ...t); town.statics.push({ k: t[1] * T + 28, f: () => drawTree(t) }); }
for (const l of LAMPS) { setSolid(town, ...l); town.statics.push({ k: l[1] * T + 26, f: () => drawLamp(l) }); }
for (const b of BENCHES) { setSolid(town, b[0], b[1], 2); town.statics.push({ k: b[1] * T + 26, f: () => drawBench(b) }); }
for (const t of TABLES) { setSolid(town, ...t); town.statics.push({ k: t[1] * T + 26, f: () => drawTable(t) }); }
setSolid(town, ...MAILBOX); town.statics.push({ k: MAILBOX[1] * T + 26, f: () => drawMailbox(MAILBOX) });
town.ground = onCanvas(mk(town.W * T, town.H * T), () => {
  const { W, tile } = town;
  for (let y = 0; y < town.H; y++) for (let x = 0; x < W; x++) {
    const t = tile[y * W + x], X = x * T, Y = y * T, rx = x % 14, ry = y % 12;
    if (t === 0 || t === 3) {
      R(t ? '#6cbf55' : '#62b04e', X, Y, T, T);
      for (let i = 0; i < 6; i++) { const a = X + (rnd() * 28 | 0), b = Y + (rnd() * 28 | 0), c = rnd() < .5 ? '#4f9a40' : '#7cc864'; R(c, a, b, 1, 2); R(c, a + 2, b, 1, 2); R(c, a + 1, b + 1, 1, 2); }
      if (rnd() < (t ? .5 : .12)) { const a = X + (rnd() * 26 | 0), b = Y + (rnd() * 26 | 0), c = ['#ff8ab8', '#ffe14a', '#fff', '#a8b8ff'][rnd() * 4 | 0]; R(c, a, b + 1, 3, 1); R(c, a + 1, b, 1, 3); R('#ffd54a', a + 1, b + 1); }
    } else if (t === 1) {
      R('#50505e', X, Y, T, T);
      for (let i = 0; i < 8; i++) R(rnd() < .5 ? '#5a5a6a' : '#46465a', X + (rnd() * 31 | 0), Y + (rnd() * 31 | 0), 2, 1);
      const vert = rx === 6 || rx === 7, hor = ry === 5 || ry === 6;
      if (rx === 6 && !hor && y % 2 === 0) R('#e8d860', X + 31, Y + 8, 2, 16);
      if (ry === 5 && !vert && x % 2 === 0) R('#e8d860', X + 8, Y + 31, 16, 2);
      if (vert && !hor && (ry === 4 || ry === 7)) for (let i = 2; i < 32; i += 8) R('#e8e8f0', X + 2, Y + i, 28, 4);
      if (hor && !vert && (rx === 5 || rx === 8)) for (let i = 2; i < 32; i += 8) R('#e8e8f0', X + i, Y + 2, 4, 28);
    } else if (t === 2) {
      R('#cfc6b4', X, Y, T, T);
      for (let r = 0; r < 4; r++) { R('#b8ae9a', X, Y + r * 8, T, 1); for (let i = (r % 2) * 8; i < 32; i += 16) R('#b8ae9a', X + i, Y + r * 8, 1, 8); }
      const nb = (dx, dy) => tile[(y + dy) * W + x + dx] === 1;
      if (x > 0 && nb(-1, 0)) R('#8a8478', X, Y, 3, T); if (x < W - 1 && nb(1, 0)) R('#8a8478', X + 29, Y, 3, T);
      if (y > 0 && nb(0, -1)) R('#8a8478', X, Y, T, 3); if (y < town.H - 1 && nb(0, 1)) R('#8a8478', X, Y + 29, T, 3);
    } else {
      R('#4a9ad8', X, Y, T, T);
      for (let i = 0; i < 3; i++) R('#6ab8ec', X + (rnd() * 24 | 0), Y + (rnd() * 28 | 0), 6, 1);
      const nb = (dx, dy) => tile[(y + dy) * W + x + dx] !== 4;
      if (nb(-1, 0)) R('#a8a090', X, Y, 4, T); if (nb(1, 0)) R('#a8a090', X + 28, Y, 4, T);
      if (nb(0, -1)) { R('#a8a090', X, Y, T, 4); R('#3a7ab8', X, Y + 4, T, 3); } if (nb(0, 1)) R('#a8a090', X, Y + 28, T, 4);
    }
  }
});
town.bg = '#62b04e'; town.top = -80; town.name = 'ในเมือง';
const CARS = [];
for (const [row, dir] of [[5, -1], [6, 1], [17, -1], [18, 1]])
  for (let i = 0; i < 2; i++) CARS.push({ x: rnd() * town.W * T, y: row * T + 26, dir, c: ['#e84a4a', '#3a8ae8', '#f2c84a', '#f4f4f4', '#5ac87a'][rnd() * 5 | 0], v: 55 + rnd() * 30 });
function drawCar(c) {
  const x = Math.round(c.x), y = c.y, L = (col, ox, oy, w, h) => R(col, c.dir > 0 ? x + ox : x - ox - w, y + oy, w, h);
  R('#0003', x - 24, y - 2, 48, 5);
  L(shade(c.c, -50), -24, -16, 48, 13); L(c.c, -24, -18, 48, 12); L(shade(c.c, 30), -24, -18, 48, 2);
  L(shade(c.c, -20), -12, -28, 28, 11); L('#9ad4f0', -9, -26, 10, 7); L('#9ad4f0', 3, -26, 10, 7); L('#d6f2ff', -9, -26, 3, 2);
  L('#222', -18, -6, 9, 6); L('#222', 10, -6, 9, 6); L('#888', -15, -4, 3, 2); L('#888', 13, -4, 3, 2);
  L('#fff6a0', 21, -14, 3, 4); L('#e83a3a', -24, -14, 2, 4);
}

// ===== home interior: rebuilt from st.furn whenever it changes =====
const BOOKS = ['#e84a4a', '#3a8ae8', '#f2c84a', '#5ac87a', '#9a48a8', '#f4f4f4', '#e8884a'];
const DRAW = {
  bed(X, b, F) {
    R('#0002', X + 2, b - 4, 62, 5); R(F.fr, X + 2, b - 70, 60, 18); R(shade(F.fr, 25), X + 4, b - 68, 56, 4);
    if (F.gold) { R('#ffd54a', X + 2, b - 70, 60, 2); R('#ffd54a', X + 29, b - 66, 6, 6); }
    R('#f4f0e8', X + 4, b - 54, 56, 48); R('#ffffff', X + 8, b - 52, 22, 10); R('#ffffff', X + 34, b - 52, 22, 10);
    R(F.c, X + 4, b - 38, 56, 32); R(shade(F.c, 30), X + 4, b - 38, 56, 4); for (let i = 8; i < 56; i += 12) R(shade(F.c, -20), X + 4 + i, b - 30, 6, 6);
    R(F.fr, X + 2, b - 8, 60, 6);
  },
  fridge(X, b) {
    R('#0002', X + 2, b - 3, 28, 4); R('#dfe8ee', X + 3, b - 60, 26, 58); R('#c4cfd6', X + 25, b - 60, 4, 58);
    R('#b0bcc4', X + 3, b - 36, 26, 2); R('#8a96a0', X + 6, b - 56, 2, 14); R('#8a96a0', X + 6, b - 32, 2, 18);
    R('#e85a5a', X + 16, b - 52, 3, 3); R('#ffd54a', X + 12, b - 46, 3, 3); R('#5ac87a', X + 19, b - 44, 3, 3);
  },
  stove(X, b, F) {
    const body = F.chrome ? '#c8d0d8' : '#ececec';
    if (F.chrome) { R('#9aa0a8', X + 4, b - 64, 24, 10); R('#7a8088', X + 2, b - 56, 28, 3); }
    R(body, X + 1, b - 34, 30, 32); R('#3a3a42', X + 1, b - 38, 30, 6); R('#6a6a72', X + 5, b - 37, 8, 3); R('#6a6a72', X + 19, b - 37, 8, 3);
    R('#2a2a30', X + 5, b - 26, 22, 14); R(F.chrome ? '#e8884a' : '#6a4a3a', X + 7, b - 24, 18, 8);
    for (const k of [6, 14, 22]) R('#9a9aa0', X + k, b - 31, 3, 2);
    R('#c0c4c8', X + 18, b - 44, 10, 7); R('#9aa0a8', X + 16, b - 44, 14, 2);
  },
  sink(X, b) {
    R('#b07a48', X + 1, b - 32, 30, 30); R('#8a5a34', X + 15, b - 28, 1, 24); R('#ffd54a', X + 11, b - 20, 2, 3); R('#ffd54a', X + 19, b - 20, 2, 3);
    R('#e0e0e0', X, b - 36, 32, 5); R('#a8b8c0', X + 8, b - 35, 16, 3); R('#c0c8d0', X + 15, b - 44, 2, 8); R('#c0c8d0', X + 15, b - 44, 6, 2);
  },
  shelf(X, b, F) {
    const W = F.w * T;
    R('#8a5a34', X + 1, b - 62, W - 2, 60); R('#5a3a22', X + 4, b - 58, W - 8, 54);
    for (let i = 0; i < 4; i++) {
      const sy = b - 58 + i * 14;
      for (let k = 0, x = X + 5; x < X + W - 6; k++) { const bw = 3 + (k + i) % 2; R(BOOKS[(k * 3 + i) % BOOKS.length], x, sy + 2 + (k % 3 === 0 ? 1 : 0), bw, 10 - (k % 3 === 0 ? 1 : 0)); x += bw + 1; }
      R('#8a5a34', X + 4, sy + 12, W - 8, 2);
    }
  },
  tv(X, b, F) {
    R('#6a4a34', X + 4, b - 20, 56, 18); R('#4a3022', X + 4, b - 4, 56, 2); R('#8a6a4a', X + 8, b - 16, 20, 10); R('#8a6a4a', X + 36, b - 16, 20, 10);
    const [x, y, w, h] = F.big ? [4, -64, 56, 42] : [10, -56, 44, 32];
    R('#2a2a32', X + x, b + y, w, h);
    R(watching ? ['#3a8ae8', '#e84a8a', '#5ac87a'][Math.floor(now() / 400) % 3] : '#203040', X + x + 3, b + y + 3, w - 6, h - 8);
    R('#ffffff30', X + x + 5, b + y + 5, 10, 2); R('#2a2a32', X + 29, b - 24, 6, 4);
  },
  plant(X, b) {
    const s = st.plant;
    R('#0002', X + 8, b - 3, 16, 3); R('#c0603a', X + 10, b - 14, 12, 12); R('#d8784a', X + 9, b - 16, 14, 3);
    R('#3a8a3a', X + 15, b - 22 - s * 3, 2, 8 + s * 3);
    disc(X + 12, b - 22 - s * 3, 3 + s, '#3f9a46'); disc(X + 20, b - 24 - s * 3, 3 + s, '#5cb85a');
    if (s >= 4) { R('#ff7ab0', X + 14, b - 40, 4, 4); R('#ffe14a', X + 15, b - 39, 2, 2); R('#ff7ab0', X + 8, b - 32, 3, 3); }
  },
  wardrobe(X, b) {
    R('#7a4a28', X, b - 66, 32, 4); R('#a0683e', X + 1, b - 62, 30, 60); R('#b87a4a', X + 3, b - 59, 12, 54); R('#b87a4a', X + 17, b - 59, 12, 54);
    R('#ffd54a', X + 13, b - 34, 2, 4); R('#ffd54a', X + 17, b - 34, 2, 4); R('#8a5a34', X + 3, b - 5, 26, 3);
  },
  sofa(X, b, F) {
    R('#0002', X + 2, b - 3, 62, 4); R(F.c, X + 2, b - 28, 60, 24); R(shade(F.c, 22), X + 2, b - 28, 60, 4);
    R(shade(F.c, -30), X, b - 22, 6, 20); R(shade(F.c, -30), X + 58, b - 22, 6, 20); R(shade(F.c, -45), X + 31, b - 24, 2, 20);
    if (F.tier > 1) { R('#f2c84a', X + 10, b - 32, 10, 8); R('#5ac8a8', X + 44, b - 32, 10, 8); }
  },
  pc(X, b, F) {
    R('#0002', X + 2, b - 3, 60, 4); R('#8a5a34', X + 4, b - 26, 4, 24); R('#8a5a34', X + 56, b - 26, 4, 24);
    R(F.gaming ? '#2a2a32' : '#b07a48', X + 2, b - 30, 60, 6);
    if (F.gaming) {
      R(['#e84a4a', '#5ac87a', '#3a8ae8', '#e84ad8'][Math.floor(now() / 300) % 4], X + 2, b - 25, 60, 1);
      R('#2a2a32', X + 6, b - 52, 24, 18); R('#3a2a6a', X + 8, b - 50, 20, 13); R('#2a2a32', X + 34, b - 52, 24, 18); R('#e84a8a', X + 36, b - 50, 20, 13);
      R('#3a3a48', X + 50, b - 22, 10, 20); R('#5ac87a', X + 52, b - 18, 6, 1);
    } else { R('#2a2a32', X + 20, b - 54, 26, 20); R('#4ac0e8', X + 22, b - 52, 22, 15); R('#ffffff60', X + 24, b - 50, 8, 2); }
    R('#2a2a32', X + 31, b - 34, 4, 4); R('#dcdcdc', X + 22, b - 29, 20, 3); R('#f4f4f4', X + 46, b - 29, 4, 3);
  },
  tub(X, b) {
    R('#0002', X + 2, b - 3, 62, 4); R('#f4f8fa', X + 2, b - 28, 60, 26); R('#dfe8ee', X + 2, b - 6, 60, 4);
    R('#8ad0f0', X + 6, b - 25, 52, 10); R('#c8ecfa', X + 10, b - 23, 12, 2); R('#c0c8d0', X + 52, b - 34, 3, 8); R('#c0c8d0', X + 48, b - 34, 7, 2);
    R('#c0c8d0', X + 6, b - 3, 4, 3); R('#c0c8d0', X + 54, b - 3, 4, 3);
  },
  lamp(X, b) {
    R('#0002', X + 10, b - 3, 12, 3); R('#3a3a48', X + 15, b - 44, 2, 42); R('#3a3a48', X + 11, b - 4, 10, 2);
    R(isNight() ? '#ffe9a0' : '#f4e8d0', X + 8, b - 56, 16, 12); R('#d8c8a8', X + 8, b - 46, 16, 2);
  },
  easel(X, b) {
    R('#8a5a34', X + 7, b - 40, 2, 38); R('#8a5a34', X + 23, b - 40, 2, 38); R('#8a5a34', X + 15, b - 48, 2, 46);
    R('#f8f4ec', X + 5, b - 46, 22, 18); R('#8ad0f0', X + 7, b - 44, 18, 8); R('#5ac87a', X + 7, b - 36, 18, 6); R('#ffe14a', X + 20, b - 43, 3, 3);
    R('#8a5a34', X + 5, b - 26, 22, 2); R('#e84a4a', X + 8, b - 28, 2, 2); R('#3a8ae8', X + 12, b - 28, 2, 2);
  },
  gym(X, b) {
    R('#0002', X + 2, b - 3, 28, 3); R('#3a3a48', X + 2, b - 12, 28, 10); R('#2a2a30', X + 4, b - 11, 24, 6);
    R('#5a5a68', X + 4, b - 36, 2, 26); R('#5a5a68', X + 26, b - 36, 2, 26); R('#5a5a68', X + 4, b - 38, 24, 4); R('#5ac87a', X + 12, b - 37, 8, 2);
  },
  mirror(X, b) {
    R('#c8a050', X + 6, b - 62, 20, 60); R('#b8e0f0', X + 8, b - 60, 16, 54); R('#e8f8ff', X + 10, b - 56, 3, 20); R('#e8f8ff', X + 14, b - 52, 2, 8);
    R('#c8a050', X + 4, b - 4, 24, 3);
  },
  piano(X, b) {
    R('#0002', X + 2, b - 3, 62, 4); R('#2a2a32', X + 2, b - 46, 60, 44); R('#3a3a48', X + 2, b - 48, 60, 4);
    R('#f4f4f4', X + 6, b - 28, 52, 7); for (let i = 3; i < 50; i += 5) if (i % 15 !== 13) R('#2a2a32', X + 6 + i, b - 28, 2, 4);
    R('#f8f4ec', X + 24, b - 44, 16, 10); R('#2a2a32', X + 27, b - 41, 10, 1); R('#2a2a32', X + 27, b - 38, 8, 1);
    R('#2a2a32', X + 6, b - 20, 3, 18); R('#2a2a32', X + 55, b - 20, 3, 18);
  },
  aquarium(X, b) {
    R('#6a4a34', X + 4, b - 18, 56, 16); R('#3a3a48', X + 4, b - 52, 56, 34); R('#5ab0e8', X + 6, b - 48, 52, 28);
    R('#d8c8a0', X + 6, b - 23, 52, 3); R('#3f9a46', X + 12, b - 34, 2, 11); R('#3f9a46', X + 15, b - 30, 2, 7); R('#3f9a46', X + 48, b - 36, 2, 13);
    const t = now() / 40;
    for (const [i, c] of [[0, '#ff8a3a'], [1, '#ffe14a'], [2, '#e84a8a']]) { const fx = (t * (0.6 + i * 0.3) + i * 30) % 90; const x = fx < 45 ? fx : 90 - fx; R(c, X + 8 + x, b - 44 + i * 7, 5, 3); }
    R('#ffffff80', X + 8, b - 46, 8, 1);
  },
  fern(X, b) {
    R('#0002', X + 8, b - 3, 16, 3); R('#5a6a7a', X + 9, b - 14, 14, 12); R('#7a8a9a', X + 8, b - 16, 16, 3);
    disc(X + 16, b - 26, 10, '#2f7d3a'); disc(X + 12, b - 30, 6, '#3f9a46'); disc(X + 21, b - 28, 6, '#5cb85a');
  },
  cactus(X, b) {
    R('#0002', X + 10, b - 3, 12, 3); R('#d8784a', X + 10, b - 12, 12, 10); R('#5aaa5a', X + 13, b - 34, 6, 22);
    R('#5aaa5a', X + 8, b - 26, 5, 3); R('#5aaa5a', X + 8, b - 30, 3, 5); R('#5aaa5a', X + 19, b - 22, 5, 3); R('#5aaa5a', X + 21, b - 27, 3, 6); R('#ff7ab0', X + 14, b - 37, 4, 3);
  },
  teddy(X, b) {
    R('#0002', X + 4, b - 3, 24, 3);
    disc(X + 16, b - 12, 10, '#a8683a'); disc(X + 16, b - 28, 8, '#a8683a'); disc(X + 10, b - 35, 3, '#a8683a'); disc(X + 22, b - 35, 3, '#a8683a');
    disc(X + 16, b - 12, 5, '#d8a070'); R('#2a1a2e', X + 13, b - 30, 2, 2); R('#2a1a2e', X + 18, b - 30, 2, 2); R('#2a1a2e', X + 15, b - 26, 3, 2); R('#e84a4a', X + 12, b - 21, 8, 2);
  },
  rug(X, b, F) {
    const W = F.w * T, H = F.h * T, Y = b - H;
    R('#d86a5a', X + 6, Y + 4, W - 12, H - 8); R('#f0c060', X + 10, Y + 8, W - 20, H - 16); R('#d86a5a', X + 14, Y + 12, W - 28, H - 24);
    for (let x = X + 18; x < X + W - 18; x += 10) R('#f0c060', x, Y + H / 2 - 2, 4, 4);
  },
  rug2(X, b, F) { const W = F.w * T, H = F.h * T; g.save(); disc(X + W / 2, b - H / 2, W / 2 - 6, '#5a9ad8', (H - 10) / (W - 12)); disc(X + W / 2, b - H / 2, W / 2 - 16, '#8ac0f0', (H - 10) / (W - 12)); g.restore(); },
};
let watching = false, comfort = 0;
const HOME_FLOOR = new Set();
function homeDoor() { return { x: home.W / 2 * T, y: (home.H - 1) * T + 22 }; }
function rebuildHome() {
  const [W, H] = HOME_SIZES[st.homeLv];
  Object.assign(home, { W, H, tile: new Uint8Array(W * H), solid: new Uint8Array(W * H), statics: [], targets: [] });
  setSolid(home, 0, 0, W, 2);
  comfort = 0;
  for (const f of st.furn) {
    const F = FURN[f.id], X = f.x * T, base = (f.y + F.h) * T;
    comfort += F.cf;
    if (F.floor) { home.statics.push({ k: -1e6 + f.y, f: () => DRAW[F.d](X, base, F) }); continue; }
    setSolid(home, f.x, f.y, F.w, F.h);
    home.statics.push({ k: base, f: () => DRAW[F.d](X, base, F) });
    const opts = FURN_ACTS[F.cat]?.(F);
    if (opts) home.targets.push({ x: X + F.w * T / 2, y: base + 12, name: F.n, opts });
  }
  const d = homeDoor();
  home.targets.push({ x: d.x, y: d.y, name: 'ประตู', opts: [['ออกจากบ้าน', () => goTown()]] });
  home.ground = onCanvas(mk(W * T, H * T), () => {
    const PW = W * T;
    R('#c89058', 0, 2 * T, PW, (H - 2) * T);
    for (let j = 0, y = 2 * T; y < H * T; y += 8, j++) { R('#b07a48', 0, y, PW, 1); for (let x = (j % 2) * 24; x < PW; x += 48) R('#b07a48', x, y, 1, 8); }
    for (let i = 0; i < 80; i++) R('#d49a62', rnd() * PW | 0, 2 * T + (rnd() * (H - 2) * T | 0), 3, 1);
    for (let y = 2 * T; y < 5 * T; y += 16) for (let x = 0; x < 4 * T; x += 16) R(((x + y) / 16) % 2 ? '#e8e0d0' : '#d4ccbc', x, y, 16, 16);
    for (const f of st.furn) if (FURN[f.id].cat === 'tub') {          // bathroom tiles around the tub
      const F = FURN[f.id], x0 = Math.max(0, f.x - 1) * T, x1 = Math.min(W, f.x + F.w + 1) * T, y0 = Math.max(2, f.y - 1) * T, y1 = Math.min(H, f.y + F.h + 1) * T;
      for (let y = y0; y < y1; y += 16) for (let x = x0; x < x1; x += 16) R(((x + y) / 16) % 2 ? '#c8e8f4' : '#a8d4e6', x, y, 16, 16);
    }
    const dm = (W / 2 - 1) * T;
    R('#8a6a4a', dm + 4, (H - 1) * T + 16, 56, 14); for (let x = dm + 8; x < dm + 60; x += 6) R('#6a4a34', x, (H - 1) * T + 18, 2, 10);
    R('#f2dcc4', 0, 0, PW, 2 * T); for (let x = 0; x < PW; x += 8) R('#ead0b4', x, 4, 3, 2 * T - 4);
    R('#c8a888', 0, 0, PW, 4); R('#8a5a34', 0, 2 * T - 6, PW, 6); R('#a87048', 0, 2 * T - 6, PW, 1);
    R('#f4f4f4', 0, 30, 3 * T, 30); for (let x = 0; x < 3 * T; x += 8) for (let y = 30; y < 60; y += 8) { R('#dcdcdc', x, y, 8, 1); R('#dcdcdc', x, y, 1, 8); }
    R('#b07a48', 2, 4, 3 * T - 4, 22); R('#8a5a34', 2, 24, 3 * T - 4, 2); for (let x = 2; x < 3 * T; x += 23) { R('#8a5a34', x, 4, 1, 20); R('#ffd54a', x + 18, 14, 2, 3); }
  });
}
function drawWallWindow(x, y, w, h) {
  const hr = hour();
  const sky = hr >= 6 && hr < 17 ? '#9ad8f8' : hr >= 17 && hr < 19 ? '#f8a868' : hr >= 5 && hr < 6 ? '#c8a0d8' : '#1a2a5a';
  R('#f4efe6', x - 3, y - 3, w + 6, h + 6); R(sky, x, y, w, h);
  if (sky === '#1a2a5a') { disc(x + w - 10, y + 9, 4, '#fff6c8'); R('#fff', x + 6, y + 6); R('#fff', x + 14, y + 16); R('#fff', x + 30, y + 5); }
  else if (sky === '#9ad8f8') { R('#fff', x + 6, y + 8, 12, 4); R('#fff', x + 9, y + 6, 6, 2); }
  R('#f4efe6', x + w / 2 - 1, y, 2, h); R('#f4efe6', x, y + h / 2 - 1, w, 2);
  R('#e87a8a', x - 6, y - 4, 7, h + 10); R('#e87a8a', x + w - 1, y - 4, 7, h + 10); R('#c05a6a', x - 8, y - 6, w + 16, 3);
}
home.drawBg = () => {
  R('#5a3a2a', -6, -6, home.W * T + 12, home.H * T + 12);
  g.drawImage(home.ground, 0, 0);
  drawWallWindow((home.W - 5) * T + 6, 10, 52, 36); drawWallWindow((home.W - 2) * T + 6, 8, 52, 30);
  const cx = home.W / 2 * T; disc(cx, 18, 7, '#fff8ec'); R('#3a2a22', cx, 13, 1, 6); R('#3a2a22', cx, 18, 4, 1);
  R('#3a2a22', 5 * T - 20, 10, 18, 14); R('#8ac8f0', 5 * T - 18, 12, 14, 10); R('#5ab05a', 5 * T - 18, 18, 14, 4);
};
home.bg = '#241c30'; home.name = 'บ้าน';

// ================= people =================
const ANCHORS = { cafe: [24, 12], office: [29, 12], mart: [16, 12], furni: [38, 12], plaza: [20, 7], school: [16, 4], park: [13, 22],
  pond: [14, 26], library: [31, 4], salon: [1, 15], flower: [1, 4], chapel: [15, 15], bench: [16, 22] };
const HOMES = BUILDINGS.map((b, i) => i).filter(i => i && !BUILDINGS[i].act);
// shortcut: spiral search without pathfinding; many people can crowd one anchor, upgrade to real slots if it looks messy
function spotFor(place, k) {
  const [ax, ay] = ANCHORS[place]; let n = 0;
  for (let r = 0; r < 9; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = ax + dx, y = ay + dy, i = y * town.W + x;
    if (x < 0 || y < 0 || x >= town.W || y >= town.H || town.solid[i] || town.tile[i] === 1 || town.tile[i] === 4) continue;
    if (n++ === k) return { x: x * T + 16, y: y * T + 24 };
  }
  return { x: ax * T + 16, y: ay * T + 24 };
}
let player, scene = town, folks = [], people = [], cat;
const relOf = id => st.rel[id] || (st.rel[id] = { f: 0, talk: 0, gift: 0, date: 0, bf: 0, known: [] });
const isKin = id => id === 'dad' || id === 'mom' || /^kid\d+$/.test(id) || st.spouse === id || st.partner === id;   // family is not "a friend" for achievements
const friendBest = (min) => Object.entries(st.rel).some(([id, r]) => !isKin(id) && (r.f || 0) >= min);
var relName = (id, f) => st.partner === id ? 'แฟน 💕' : f >= 70 ? 'เพื่อนสนิท' : f >= 40 ? 'เพื่อน' : f >= 20 ? 'คนรู้จัก' : 'คนแปลกหน้า';
function slotOf(p) { const h = hour(); let s = 'in'; for (const [t, where] of p.sched) if (h >= t) s = where; return s; }
function targetOf(p, s) { if (s === 'home') { const b = BUILDINGS[p.home]; return { x: b.ix, y: b.iy + 4 }; } return p.spots[s] || (p.spots[s] = spotFor(s, p.k)); }
function makePeople() {
  people = PEOPLE.map((p, k) => ({ ...p, k, home: homeIdx(p, k), spots: {}, x: 0, y: 0, dir: 0, frame: 0, at: 0, spr: sheet(p.pal), slot: 'in', stuck: 0, person: 1,
    hidden: false, alpha: 1, doorT: 0, chatT: 0, chatWith: null, prop: null }));
  folks = [];
  for (let i = 0; i < 6; i++) {
    const a = CHARS[i % 4], b = CHARS[(i * 3 + 1) % 4], o = OUTFITS[(i + 2) % OUTFITS.length];
    let x, y;
    do { x = Math.floor(rnd() * town.W); y = Math.floor(rnd() * town.H); } while (town.tile[y * town.W + x] !== 2 || town.solid[y * town.W + x]);
    folks.push({ x: x * T + 16, y: y * T + 24, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0, talked: 0,
      spr: sheet({ ...a, style: b.style, clip: 0, skirt: 0, c: o.c || b.c, C: o.C || b.C, a: o.a || b.a, p: b.p }) });
  }
  cat = { x: 3 * T, y: 5 * T, dir: 3, frame: 0, at: 0, vx: 0, vy: 0, t: 0, cat: 1 };
}
function updatePerson(p, dt) {
  const s = slotOf(p);
  if (s !== p.slot) {                               // schedule changed
    if (p.slot === 'in' && s !== 'in') { const t = targetOf(p, 'home'); p.x = t.x; p.y = t.y; }
    p.slot = s;
  }
  if (s === 'in') return;
  const t = targetOf(p, s), ddx = t.x - p.x, ddy = t.y - p.y;
  if (Math.abs(ddx) < 2 && Math.abs(ddy) < 2) {
    animate(p, false, dt);
    if (player && scene === town && Math.hypot(player.x - p.x, player.y - p.y) < 50) p.dir = faceTo(p, player);
    return;
  }
  const sp = 45 * dt, tryX = () => Math.abs(ddx) >= 2 && !move(town, p, Math.sign(ddx) * Math.min(sp, Math.abs(ddx)), 0) && (p.dir = ddx < 0 ? 2 : 3, true);
  const tryY = () => Math.abs(ddy) >= 2 && !move(town, p, 0, Math.sign(ddy) * Math.min(sp, Math.abs(ddy))) && (p.dir = ddy < 0 ? 1 : 0, true);
  const moved = Math.abs(ddx) > Math.abs(ddy) ? (tryX() || tryY()) : (tryY() || tryX());
  if (moved) p.stuck = 0; else if ((p.stuck += dt) > 1.2) { p.x = t.x; p.y = t.y; p.stuck = 0; }   // shortcut: no pathfinding, snap when stuck
  animate(p, moved, dt);
}
const faceTo = (a, b) => Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? (b.x < a.x ? 2 : 3) : (b.y < a.y ? 1 : 0);
function wander(sc, n, speed, dt, avoidRoad) {
  n.t -= dt;
  if (n.t <= 0) { if (rnd() < .35) n.vx = n.vy = 0; else [n.vx, n.vy] = [[0, 1], [0, -1], [-1, 0], [1, 0]][rnd() * 4 | 0]; n.t = 1 + rnd() * 3; }
  if (n.vx || n.vy) { if (move(sc, n, n.vx * speed * dt, n.vy * speed * dt, avoidRoad)) n.t = 0; n.dir = n.vx < 0 ? 2 : n.vx > 0 ? 3 : n.vy < 0 ? 1 : 0; }
  animate(n, n.vx || n.vy, dt);
}
function animate(e, moving, dt) { if (!moving) { e.frame = 0; return; } e.at += dt; e.frame = 1 + (Math.floor(e.at / 0.085) % 6); }
function drawEnt(e) {
  const x = Math.round(e.x), y = Math.round(e.y);
  if (e.cat) { disc(x, y, 7, '#0003', .4); g.drawImage((e.sprs || catSpr)[e.frame ? 1 : 0][e.dir === 2 ? 0 : 1], x - 9, y - 11); return; }
  const a = e === player ? age() : e.age, k = a === undefined ? 1 : a < 3 ? .5 : a < 13 ? .72 + (a - 6) * .025 : a < 18 ? .92 : 1;   // kids are drawn smaller
  const al = Math.max(0, Math.min(1, e.alpha === undefined ? 1 : e.alpha));
  if (al < 1) g.globalAlpha = al;
  disc(x, y, Math.round(9 * k), '#0004', .4);
  g.drawImage(e.spr[e.dir][e.frame] || e.spr[e.dir][0], Math.round(x - 12 * k), Math.round(y - 38 * k), Math.round(24 * k), Math.round(40 * k));
  g.globalAlpha = 1;
  if (typeof drawPersonProp === 'function' && e.person) drawPersonProp(e);
  const romanceMark = e.person && (st.partner === e.id || (!st.partner && e.date));
  if (romanceMark) {
    R('#ff7ab8', x - 4, y - 51, 3, 2); R('#ff7ab8', x + 1, y - 51, 3, 2);
    R('#ff7ab8', x - 5, y - 49, 10, 3); R('#ff7ab8', x - 4, y - 46, 8, 2);
    R('#ff7ab8', x - 2, y - 44, 4, 2); R('#ff7ab8', x - 1, y - 42, 2, 1);
    R('#ffe4ef', x - 2, y - 42, 2, 1);
  }
}

// ================= core systems =================
const BARS = ['energy', 'food', 'mood'];
const clamp = () => { for (const k of BARS) st[k] = Math.max(0, Math.min(100, st[k])); };
const COL = { money: '#7ee07e', energy: '#ffd54a', food: '#ff9a4a', mood: '#ff7ab8', xp: '#b89aff' };
let floats = [];
function float(s, c) { floats.push({ x: player.x, y: player.y - 40 - floats.filter(f => f.t > 1.2).length * 8, t: 1.4, s, c }); }
function fx(d) { for (const k in d) { st[k] += d[k]; float((d[k] > 0 ? '+' : '') + Math.round(d[k]), COL[k]); } clamp(); }
function xp(s, n) {
  const before = lv(s), amt = Math.round(n * (st.mood >= 70 ? 1.2 : 1) * xpMul(s));
  st.sk[s] = (st.sk[s] || 0) + amt; float('+' + amt + 'XP', COL.xp);
  const after = lv(s);
  if (after > before) {
    toast(`⬆️ เลเวลอัป! ${SKILLS[s][1]} ${SKILLS[s][0]} เลเวล ${after}`);
    if (s === 'cook') for (const r of RECIPES) if (r.lv === after) toast(`📜 ปลดล็อกสูตร ${ITEMS[r.id].ic} ${ITEMS[r.id].n}`);
  }
}
function tick(m) {
  st.min += m;
  st.energy -= m * 0.05 * (1 - lv('fit') * 0.04) * dm() * (st.sick ? 1.5 : 1); st.food -= m * 0.07 * dm();
  if (st.food < 20 || st.energy < 20) st.mood -= m * 0.06 * moodDrain();
  else if (scene === home) st.mood += m * comfort * 0.0012;      // a cosy home lifts mood
  else if (typeof nRoom !== 'undefined' && scene === nRoom) st.mood += m * 0.002;
  if (st.food <= 0) st.energy -= m * 0.05;
  clamp();
  if (st.energy <= 0) faint();
}
function nextHour(h) { let t = Math.floor(st.min / 1440) * 1440 + h * 60; if (t <= st.min) t += 1440; return t; }
const WXN = { sun: 'แดดออก', cloud: 'มีเมฆ', rain: 'ฝนตก', storm: 'พายุฝน', snow: 'หิมะ' };
function morningNote() {
  const bits = [];
  if (typeof weatherOf === 'function') bits.push(`${WX_ICON[weatherOf()] || ''}${WXN[weatherOf()] || ''}`);
  if (typeof festival === 'function' && festival()) bits.push(`${festival().ic} ${festival().n}`);
  if (age() >= 6 && age() < 18 && typeof seasonOf === 'function' && seasonOf().d === 7) bits.push('📄 วันสอบ');
  if ((day() - 1) % YEAR === 0) bits.push('🎂 วันเกิด');
  return bits.filter(Boolean).join(' · ');
}
const clockText = () => { const h = Math.floor(hour()), m = Math.floor((hour() - h) * 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
function sleepNow(h, tier) {
  const d0 = day(), bonus = (tier - 1) * 3 + Math.round(comfort / 8) + restBonus();
  fade(() => {
    st.min += h * 60;
    st.food -= h * 2.2;
    let gain, mood, msg;
    if (h === 2) { gain = 25 + bonus; mood = 2; msg = 'งีบสั้น ๆ สดชื่นขึ้น'; }
    else if (h === 4) { gain = 58 + bonus; mood = 5; msg = 'นอนครึ่งคืน ตื่นมาหัวโล่ง'; }
    else if (h === 8) { gain = 100; mood = 8 + restBonus(); msg = 'หลับเต็มอิ่ม 8 ชั่วโมง'; }
    else { gain = 100; mood = 12 + restBonus(); msg = 'นอนยาว 10 ชั่วโมง'; }
    st.energy = Math.min(100, st.energy + gain);
    st.mood += mood; clamp();
    const note = day() !== d0 ? morningNote() : '';
    say(`${msg} · ตื่นเวลา ${clockText()}${note ? ` · ${note}` : ''}`);
    if (note) toast(`📰 ${note}`);
    if (h >= 8 && hour() >= 9) toast('🌤️ ตื่นสายแล้ว — วันนี้เริ่มช้า');
    if (h >= 8 && day() !== d0) partnerMorning();
    save();
  }, 700);
}
function skipToBirthday() {
  const a = age(); if (a >= 18) return say('โตเป็นผู้ใหญ่แล้ว');
  const d = day(), next = (Math.floor((d - 1) / YEAR) + 1) * YEAR + 1, days = next - d;
  openMenu(`⏭️ ข้ามถึงวันเกิด (${days} วัน)`, [[`ใช่ — โตขึ้นเป็น ${a + 1} ปี`, () => {
    fade(() => {
      st.min = (next - 1) * 1440 + 7 * 60;
      st.energy = 100; st.food = Math.max(st.food, 55); st.mood = Math.max(st.mood, 55); clamp();
      save(); say(`ข้าม ${days} วัน — ตอนนี้อายุ ${age()} ปี`);
    }, 650);
  }], ['ไม่ข้าม', () => 0]]);
}
function partnerMorning() {
  if (!st.partner) return;
  const p = PEOPLE.find(q => q.id === st.partner);
  st.mood = Math.min(100, st.mood + 8);
  setTimeout(() => toast(`💌 ${p.n} ส่งข้อความ: "อรุณสวัสดิ์นะ วันนี้สู้ๆ!"`), 900);
}
function faint() {
  st.money = Math.max(0, st.money - 80); st.min = nextHour(8); st.energy = 60; st.mood -= 15; clamp();
  const d = homeDoor(); enter(home, d.x, d.y - 8, 1);
  say('หมดแรงเป็นลม! หมอพากลับบ้าน ค่ารักษา ฿80');
}
function eat(id) {
  const I = ITEMS[id]; if (!have(id)) return;
  addItem(id, -1); const d = {};
  for (const k of ['food', 'mood', 'energy']) if (I[k]) d[k] = I[k] + (I.k === 'dish' && k === 'food' ? lv('cook') * 2 : 0);
  fx(d); tick(10); say(`กิน${I.n} ${I.ic}`);
}
const edible = id => ITEMS[id].food || ITEMS[id].energy;

// ---- furniture actions ----
const FURN_ACTS = {
  bed: F => [['😴 งีบ 2 ชม.', () => sleepNow(2, F.tier)], ['🌙 นอน 4 ชม.', () => sleepNow(4, F.tier)],
    ['🛌 นอน 8 ชม.', () => sleepNow(8, F.tier)], ['💤 นอน 10 ชม.', () => sleepNow(10, F.tier)],
    ...(age() < 18 ? [['⏭️ ข้ามถึงวันเกิด (โตขึ้น 1 ปี)', skipToBirthday]] : [])],
  fridge: () => [['กินอาหาร', () => eatPanel()], ['ดูของในกระเป๋า', () => invPanel()]],
  stove: F => [['ทำอาหาร', () => cookPanel(F.tier)]],
  sink: () => [['ล้างหน้าสดชื่น', () => { fx({ mood: 2 }); tick(5); say('สดชื่น!'); }]],
  shelf: F => [['อ่านหนังสือ 1 ชม.', () => { fx({ energy: -4 }); xp('logic', 18 * F.tier); tick(60); say('ได้ความรู้ใหม่'); }]],
  tv: F => [['ดูการ์ตูน 1 ชม.', () => watch(() => { fx({ mood: 10 + F.tier * 5 }); tick(60); say('ตลกมาก ฮ่าๆ'); })],
    ['ดูข่าว 1 ชม.', () => watch(() => { fx({ mood: 2 }); xp('logic', 10); tick(60); say('รู้ทันข่าวสาร'); })]],
  pc: F => [['ทำงานฟรีแลนซ์ 2 ชม.', () => {
      if (st.energy < 15) return say('เหนื่อยเกินไป ไปพักก่อน');
      fx({ money: Math.round((60 + lv('logic') * 15) * (F.tier > 1 ? 1.4 : 1)), energy: -12, mood: -3 }); xp('logic', 12); tick(120); say('ส่งงานลูกค้าเรียบร้อย');
    }],
    ['เล่นเกม 1 ชม.', () => { fx({ mood: 12 + F.tier * 4, energy: -5 }); tick(60); say('ชนะติดๆ กัน สนุกมาก!'); }],
    ['เรียนคอร์สออนไลน์ ฿40', () => { if (st.money < 40) return say('เงินไม่พอ'); fx({ money: -40, energy: -8 }); xp('logic', 35); tick(90); say('เรียนจบบทเรียน'); }],
    ['ขายภาพวาดออนไลน์', () => {
      if (!have('painting')) return say('ยังไม่มีภาพวาด ลองวาดที่ขาตั้งวาดรูปก่อน');
      const p = 40 + lv('art') * 30; addItem('painting', -1); fx({ money: p }); tick(20); say(`ขายภาพได้ ฿${p}`);
    }]],
  sofa: F => [['นั่งพัก 30 นาที', () => { fx({ energy: 6 * F.tier + 4, mood: 3 * F.tier }); tick(30); say('นั่งพักสบายๆ'); }]],
  wardrobe: () => [['เปลี่ยนชุด', () => { st.outfit = (st.outfit + 1) % OUTFITS.length; dressPlayer(); tick(5); fx({ mood: 3 }); say('ชุดใหม่ ดูดีมาก!'); }]],
  tub: () => [['แช่น้ำอุ่นคลายเครียด 30 นาที', () => { fx({ mood: 8, energy: 2 }); if (typeof stressAdd === 'function') stressAdd(-10); tick(30); say('แช่น้ำอุ่นสบาย ผ่อนคลายสุด ๆ'); }]],
  plant: () => [['รดน้ำต้นไม้', () => {
    if (st.watered === day()) return say('วันนี้รดน้ำแล้ว พรุ่งนี้ค่อยรดใหม่');
    st.watered = day(); st.plant = Math.min(4, st.plant + 1); fx({ mood: st.plant >= 4 ? 15 : 5 }); tick(5);
    say(st.plant >= 4 ? 'ต้นไม้ออกดอกแล้ว!' : 'ต้นไม้โตขึ้นนิดนึง');
  }]],
  easel: () => [['วาดภาพ 1.5 ชม.', () => {
    if (st.energy < 15) return say('เหนื่อยเกินไป');
    fade(() => { fx({ energy: -10, mood: 6 }); xp('art', 28); addItem('painting'); st.stats.paintings++; tick(90); say(`วาดภาพเสร็จ! ขายได้ราว ฿${40 + lv('art') * 30}`); }, 500);
  }]],
  gym: () => [['วิ่งบนลู่ 1 ชม.', () => { if (st.energy < 20) return say('เหนื่อยเกินไป'); fx({ energy: -15, mood: 4 }); xp('fit', 30); tick(60); say('เหงื่อท่วมตัว แต่แข็งแรงขึ้น!'); }]],
  mirror: () => [['ฝึกพูดหน้ากระจก', () => { fx({ energy: -3 }); xp('charm', 22); tick(45); say('มั่นใจขึ้นเยอะเลย'); }]],
  piano: () => [['เล่นเปียโน 1 ชม.', () => { fx({ mood: 10, energy: -5 }); xp('art', 15); xp('charm', 10); tick(60); say('เพลงไพเราะมาก ♪'); }]],
  aquarium: () => [['นั่งดูปลา', () => { fx({ mood: 8, energy: 3 }); tick(20); say('ปลาว่ายไปมา ผ่อนคลายจัง'); }]],
};
function watch(fn) { watching = true; fade(() => { fn(); watching = false; }); }

// ---- careers ----
let mg = null;
function jobOpts(jid) {
  const J = JOBS[jid];
  if (st.job?.id === jid) return [[`เริ่มกะทำงาน (${J.start}:00–${J.end}:00)`, () => tryShift()], ['ดูสถานะงาน', () => journal('career')]];
  return [[`สมัครงาน: ${J.n}`, () => openMenu(`สมัครเป็น${J.n}?`, [[st.job ? `ยืนยัน (ลาออกจาก${JOBS[st.job.id].n})` : `ยืนยัน เริ่มเป็น${J.titles[0]}`, () => {
    st.job = { id: jid, lv: 0, perf: 0, day: 0 }; toast(`💼 ได้งานแล้ว! ${J.titles[0]} ที่${J.at}`); save();
  }]])]];
}
function tryShift() {
  const J = JOBS[st.job.id], h = hour();
  if (age() < 16) return say('ต้องอายุ 16 ปีขึ้นไปถึงจะทำงานได้');
  if (J.weekdays && weekday() >= 5) return say('วันหยุดเสาร์-อาทิตย์ ออฟฟิศปิด');
  if (h < J.start || h >= J.end - 1) return say(`เข้ากะได้ ${J.start}:00–${J.end - 1}:00`);
  if (st.job.day === day()) return say('วันนี้ทำงานไปแล้ว พรุ่งนี้ค่อยมาใหม่');
  if (st.energy < 25) return say('เหนื่อยเกินไป ไปพักก่อน');
  const L = st.job.lv;
  mg = { round: 0, score: 0, pos: 0, dir: 1, speed: 0.9 + L * 0.2, w: Math.max(0.12, 0.3 - L * 0.04), wait: 0, fb: '' };
  mgZone(); drawMg();
}
function mgZone() { mg.z = 0.05 + rnd() * (0.9 - mg.w); mg.task = JOBS[st.job.id].tasks[mg.round % 3]; }
function mgPress() {
  if (!mg || mg.wait > 0) return;
  const d = Math.abs(mg.pos - (mg.z + mg.w / 2)), pts = d < mg.w * 0.15 ? 1 : d < mg.w / 2 ? 0.6 : 0;
  mg.score += pts; mg.fb = pts === 1 ? '✨ เพอร์เฟกต์!' : pts ? '👍 ดี!' : '💦 พลาด...';
  mg.round++; mg.wait = 0.7; drawMg();
}
function mgUpdate(dt) {
  if (mg.wait > 0) { if ((mg.wait -= dt) <= 0) { if (mg.round >= 3) return finishShift(); mg.fb = ''; mgZone(); drawMg(); } return; }
  mg.pos += mg.dir * mg.speed * dt;
  if (mg.pos > 1) { mg.pos = 1; mg.dir = -1; } if (mg.pos < 0) { mg.pos = 0; mg.dir = 1; }
  const m = mgEl.querySelector('.mark'); if (m) m.style.left = (mg.pos * 100) + '%';
}
function finishShift() {
  const score = mg.score; mg = null; mgEl.hidden = true;
  const J = JOBS[st.job.id], L = st.job.lv;
  fade(() => {
    const pay = Math.round(J.pay[L] * payMul() * (st.payMod && day() <= st.payMod.until ? .7 : 1) * (0.7 + 0.2 * score) * (st.mood >= 70 ? 1.1 : 1) * (typeof civicJobPayMult === 'function' ? civicJobPayMult() : 1));
    st.job.perf += score + (st.mood >= 70 ? 0.5 : 0) - (st.mood < 30 ? 1 : 0); st.job.day = day(); st.stats.shifts++;
    fx({ money: pay, energy: -20, mood: -4 }); xp(J.skill, 15 + 5 * L); tick(6 * 60);
    say(`เลิกงาน! คะแนน ${score.toFixed(1)}/3 ได้ค่าจ้าง ฿${pay}`);
    checkPromo(); save();
  }, 600);
}
const perfNeed = l => 5 + l * 3;
function checkPromo() {
  const J = JOBS[st.job.id], L = st.job.lv;
  if (L >= 4 || st.job.perf < perfNeed(L)) return;
  if (lv(J.skill) < J.req[L + 1]) return setTimeout(() => toast(`📋 ผลงานพร้อมเลื่อนขั้น แต่ต้องมี ${SKILLS[J.skill][0]} เลเวล ${J.req[L + 1]}`), 900);
  st.job.lv++; st.job.perf = 0; st.stats.promos++;
  setTimeout(() => toast(`🎉 เลื่อนขั้นเป็น ${J.titles[st.job.lv]}! ค่าจ้าง ฿${J.pay[st.job.lv]}/กะ`), 900);
}

// ---- relationships ----
function personOpts(p) {
  const r = relOf(p.id), o = [['คุยด้วย', () => talk(p)], ['ให้ของขวัญ', () => giftPanel(p)]];
  if (p.date && r.f >= 60 && (!st.partner || st.partner === p.id)) o.push(['ชวนไปเดท ฿80', () => date(p)]);
  if (p.date && r.f >= 90 && !st.partner) o.push(['สารภาพรัก 💐', () => confess(p)]);
  return o;
}
function talk(p) {
  const r = relOf(p.id); p.dir = faceTo(p, player);
  if (r.talk === day()) return say(`${p.n}: "วันนี้คุยกันแล้วน้า ไว้พรุ่งนี้นะ"`);
  r.talk = day();
  const gain = 3 + kindBonus() + lv('charm') * 0.6 + (st.partner === p.id ? 3 : 0);
  r.f = Math.max(0, Math.min(100, r.f + gain)); fx({ mood: st.partner === p.id ? 10 : 5 }); xp('charm', 10); tick(10);
  let line;
  if (r.f >= 60 && rnd() < .35) {
    line = 'แกดูสดใสจัง วันนี้มีอะไรดี ๆ เกิดขึ้นเหรอ';
  } else if (r.f < 20) line = 'สวัสดี... เราเพิ่งรู้จักกันเนอะ';
  else if (r.f >= 40 && rnd() < .4) {
    const secret = [...p.love, ...p.like].find(i => !r.known.includes(i));
    line = secret ? `บอกความลับนะ ฉันชอบ${ITEMS[secret].n}มากเลย` : p.says[rnd() * p.says.length | 0];
    if (secret) r.known.push(secret);
  } else line = p.says[rnd() * p.says.length | 0];
  if (r.f >= 70 && day() - r.bf >= 3) {
    r.bf = day(); const gift = p.like[rnd() * p.like.length | 0]; addItem(gift);
    setTimeout(() => toast(`🎁 ${p.n} ให้${ITEMS[gift].n} ${ITEMS[gift].ic} เป็นของขวัญ`), 600);
  }
  say(`${p.n}: "${line}"`);
}
function giveGift(p, id) {
  const r = relOf(p.id);
  if (r.gift === day()) return say(`ให้ของ${p.n}ไปแล้ววันนี้`);
  r.gift = day(); addItem(id, -1); st.stats.gifts++;
  const love = p.love.includes(id), like = p.like.includes(id), hate = p.hate.includes(id);
  const d = love ? 15 : like ? 8 : hate ? -8 : 3;
  r.f = Math.max(0, Math.min(100, r.f + d + (d > 0 ? lv('charm') * 0.5 : 0)));
  if (!r.known.includes(id) && (love || like || hate)) r.known.push(id);
  xp('charm', 5); closePanel();
  say(`${p.n}: "${love ? 'ว้าว! ของที่ชอบที่สุดเลย ขอบคุณมาก!!' : like ? 'น่ารักจัง ขอบคุณนะ' : hate ? 'เอ่อ... ไม่ค่อยชอบเท่าไหร่' : 'ขอบคุณนะ'}"`);
}
function date(p) {
  const r = relOf(p.id);
  if (r.date === day()) return say('วันนี้เดทไปแล้ว');
  if (st.money < 80) return say('เงินไม่พอ');
  fade(() => { r.date = day(); r.f = Math.min(100, r.f + 6); st.stats.dates++; fx({ money: -80, mood: 25, food: 30 }); tick(120); say(`ไปเดทที่คาเฟ่กับ${p.n} หัวเราะกันทั้งวัน 💕`); save(); }, 700);
}
function confess(p) {
  if (!have('bouquet')) return say('ต้องมีช่อดอกไม้ใหญ่ 💐 (ซื้อที่มินิมาร์ท)');
  addItem('bouquet', -1); st.partner = p.id; fx({ mood: 40 });
  toast(`💕 ${p.n} ตอบตกลง! ตอนนี้เป็นแฟนกันแล้ว`); say(`${p.n}: "จริงๆ ฉันก็รอให้เธอพูดอยู่นะ..."`); save();
}

// ---- achievements ----
const ACH = [
  ['first_pay', '💵 เงินเดือนแรก', 'ทำงานครบ 1 กะ', () => st.stats.shifts >= 1],
  ['rich1', '💰 มีเงิน ฿1,000', 'เก็บเงินตัวเองให้ได้ ฿1,000', () => (typeof cashOwn === 'function' ? cashOwn() : st.money) >= 1000],
  ['rich2', '🏦 เศรษฐีน้อย', 'มีเงินตัวเอง ฿10,000', () => (typeof cashOwn === 'function' ? cashOwn() : st.money) >= 10000],
  ['promo', '📈 เลื่อนขั้นครั้งแรก', 'ได้เลื่อนขั้นครั้งแรก', () => st.stats.promos >= 1],
  ['top', '👑 สุดยอดอาชีพ', 'ถึงตำแหน่งสูงสุด', () => st.job?.lv >= 4],
  ['friend', '🤝 มีเพื่อนคนแรก', 'ความสนิท 40+', () => friendBest(40)],
  ['bff', '💛 เพื่อนสนิท', 'ความสนิท 70+', () => friendBest(70)],
  ['social', '🌟 ขวัญใจชาวเมือง', 'รู้จัก 10 คน (20+)', () => PEOPLE.filter(p => (st.rel[p.id]?.f || 0) >= 20).length >= 10],
  ['love', '💕 มีแฟนแล้ว', 'มีคนตอบรับเป็นแฟน', () => !!st.partner],
  ['chef', '👨‍🍳 เชฟมือใหม่', 'ทำอาหาร 10 จาน', () => st.stats.cooked >= 10],
  ['allrec', '📜 ปลดล็อกทุกสูตร', 'ทำอาหาร เลเวล 8', () => lv('cook') >= 8],
  ['skill5', '🎯 เก่งจริง', 'ทักษะใดก็ได้ เลเวล 5', () => Object.keys(SKILLS).some(s => lv(s) >= 5)],
  ['allskill', '🌈 รอบด้าน', 'ทุกทักษะหลัก เลเวล 3', () => CORE_SKILLS.every(s => lv(s) >= 3)],
  ['artist', '🎨 ศิลปิน', 'วาดภาพ 5 ภาพ', () => st.stats.paintings >= 5],
  ['decor', '🛋️ นักแต่งบ้าน', 'ซื้อเฟอร์นิเจอร์ 5 ชิ้น', () => st.stats.furnBought >= 5],
  ['comfy', '🏡 บ้านอบอุ่น', 'ความน่าอยู่ 50', () => comfort >= 50],
  ['bighouse', '🏠 บ้านหลังใหญ่', 'ขยายบ้าน', () => st.homeLv >= 1],
  ['bloom', '🌸 นักปลูก', 'ต้นไม้ออกดอก', () => st.plant >= 4],
  ['day30', '📅 ชาวเมืองตัวจริง', 'ใช้ชีวิตครบ 30 วัน', () => day() >= 30],
];
function checkAch() { for (const [id, n, , cond] of ACH) if (!st.ach[id] && cond()) { st.ach[id] = day(); toast(`🏆 ความสำเร็จ: ${n}`); save(); } }

// ================= scene switching / save =================
const fadeEl = document.getElementById('fade');
let busy = false;
function fade(fn, hold = 320) { busy = true; keys.clear(); fadeEl.style.opacity = 1; setTimeout(() => { fn(); fadeEl.style.opacity = 0; busy = false; }, hold); }
function enter(sc, x, y, dir) { scene = sc; player.x = x; player.y = y; player.dir = dir; bDeco.hidden = sc !== home; save(); }
const HOME_DOOR = BUILDINGS[0];
function goHome() { fade(() => { const d = homeDoor(); enter(home, d.x, d.y - 8, 1); }); }
function goTown() { fade(() => enter(town, HOME_DOOR.ix, HOME_DOOR.iy + 4, 0)); }
let SLOT = 1;                                      // three save slots; slot 1 also adopts the old single-slot save
const slotKey = n => `pixeltown32-v3-s${n}`;
function save() {
  if (!player) return;
  let sc = scene === home ? 'home' : 'town', x = player.x, y = player.y;
  if (typeof nRoom !== 'undefined' && scene === nRoom && typeof visit !== 'undefined' && visit) {
    const b = BUILDINGS[visit.home] || BUILDINGS[0]; x = b.ix; y = b.iy + 4;
  }
  try { localStorage.setItem(slotKey(SLOT), JSON.stringify({ st, scene: sc, x, y, at: Date.now() })); } catch (e) { /* storage blocked: play without saving */ }
}
function load(n = SLOT) { try { const s = JSON.parse(localStorage.getItem(slotKey(n)) || (n === 1 ? localStorage.getItem('pixeltown32-v3') : null)); return s?.st?.v === 3 ? s : null; } catch (e) { return null; } }

// ================= UI =================
const $ = id => document.getElementById(id);
const hud = $('hud'), hintEl = $('hint'), msgEl = $('msg'), menuEl = $('menu'), panelEl = $('panel'), mgEl = $('mg'), decoEl = $('deco'), bDeco = $('bDeco');
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const k in props) { if (k === 'style') e.style.cssText = props[k]; else e[k] = props[k]; }
  e.append(...kids.flat().filter(k => k != null && k !== false));
  return e;
}
let msgT = 0, menuOpen = false, panelOpen = false, panelBuild = null, target = null;
let hudExpanded = false;
function toggleHud() { hudExpanded = !hudExpanded; drawHud(); }
function say(t) { msgEl.textContent = t; msgEl.hidden = false; msgT = 3.4; }
let toastLive = 0; const toastQ = [];
function toast(t) {
  if (toastLive >= 2) { if (toastQ.length < 8) toastQ.push(t); return; }
  toastLive++; const d = el('div', { className: 'panel' }, t); $('toasts').append(d);
  setTimeout(() => { d.remove(); toastLive--; if (toastQ.length) toast(toastQ.shift()); }, 3500);
}
const bar = (icon, label, v, c) => `<div class="row"><span>${icon} ${label}</span><span>${Math.round(v)}</span></div><div class="bar"><i style="width:${v}%;background:${c}"></i></div>`;
function drawHud() {
  const h = hour(), hh = String(Math.floor(h)).padStart(2, '0'), mm = String(Math.floor(st.min % 60)).padStart(2, '0');
  const job = (st.job ? `${JOBS[st.job.id].titles[st.job.lv]}` : 'ว่างงาน') + (st.sick ? ' 🤒' : '');
  const details = `<div class="top"><span>${st.name} · ${age()} ปี</span><span>${WEEK[weekday()]} ${day()} ${seasonTag()}</span></div><div class="row"><span></span><span>${hh}:${mm} ${isNight() ? '🌙' : '☀️'}</span></div>
    <div class="row"><span>📍 ${scene.name}</span><span style="color:${COL.money}">฿${st.money}${age() < 18 && st.famMoney ? ' 👪' : ''}</span></div>
    <div class="row"><span>💼 ${job}</span>${scene === home ? `<span>🏡 ${comfort}</span>` : (typeof nRoom !== 'undefined' && scene === nRoom && typeof visit !== 'undefined' && visit) ? `<span>🏠 ${visit.name}</span>` : ''}</div>` +
    bar('⚡', 'พลังงาน', st.energy, COL.energy) + bar('🍙', 'ความอิ่ม', st.food, COL.food) +
    bar('💗', 'ความสุข', st.mood, COL.mood) +
    (typeof dayGoalsMarkup === 'function' ? dayGoalsMarkup() : '');
  hud.innerHTML = `<button class="fold" onclick="toggleHud()" aria-expanded="${hudExpanded}" title="${hudExpanded ? 'ย่อแผงสถานะ' : 'ขยายแผงสถานะ'}"><span>👤 ${st.name} · ${age()} ปี　${WEEK[weekday()]} ${day()}</span><span>${hh}:${mm} · ฿${st.money} ${hudExpanded ? '▴' : '▾'}</span></button>${hudExpanded ? `<div class="details">${details}</div>` : ''}`;
}
function openMenu(name, opts) {
  closePanel();
  menuEl.replaceChildren(el('h3', { textContent: name }, el('button', { className: 'x', textContent: '✕', title: 'ปิด', onclick: closeMenu })),
    ...opts.map(([t, fn], i) => el('button', { textContent: `${i + 1}. ${t}`, onclick: () => { closeMenu(); fn(); } })),
    el('button', { className: 'close', textContent: matchMedia('(pointer:coarse)').matches ? 'ปิด' : 'ปิด (Esc)', onclick: closeMenu }));
  menuEl.hidden = false; menuOpen = true; keys.clear(); menuEl.querySelector('button').focus();
}
function closeMenu() { menuEl.hidden = true; menuOpen = false; }
function openPanel(title, build) { closeMenu(); panelBuild = () => { panelEl.replaceChildren(el('h3', { textContent: title }, el('button', { className: 'x', textContent: '✕', title: 'ปิด', onclick: closePanel })), el('div', { className: 'body' }, build()), el('button', { className: 'close', textContent: matchMedia('(pointer:coarse)').matches ? 'ปิด' : 'ปิด (Esc)', onclick: closePanel })); }; panelBuild(); panelEl.hidden = false; panelOpen = true; keys.clear(); }
function refreshPanel() { if (panelOpen) { const sc = panelEl.querySelector('.body')?.scrollTop; panelBuild(); const b = panelEl.querySelector('.body'); if (b) b.scrollTop = sc; } }
function closePanel() { panelEl.hidden = true; panelOpen = false; }
const row = (ic, name, sub, ...right) => el('div', { className: 'item' }, el('div', { className: 'ic' }, ic), el('div', {}, el('div', {}, name), sub ? el('div', { className: 'sub' }, sub) : null), el('div', {}, ...right));
const btn = (t, fn, dis) => el('button', { textContent: t, disabled: !!dis, onclick: fn });
const money = () => el('div', { className: 'money' }, age() < 18 && st.famMoney
  ? `ใช้ได้ ฿${st.money} · ตัวเอง ฿${typeof cashOwn === 'function' ? cashOwn() : st.money} · ครอบครัว ฿${Math.round(st.famMoney)}`
  : `เงิน ฿${st.money}`);
function buyItem(id) { const I = ITEMS[id]; if (st.money < I.p) return say('เงินไม่พอ'); st.money -= I.p; addItem(id); refreshPanel(); save(); }
function martPanel() {
  openPanel('🛒 มินิมาร์ท', () => [money(), el('div', { className: 'sec' }, 'วัตถุดิบ'),
    ...MART_STOCK.filter(id => ITEMS[id].k === 'ing').map(id => row(ITEMS[id].ic, ITEMS[id].n, `฿${ITEMS[id].p} · มี ${have(id)}`, btn('ซื้อ', () => buyItem(id), st.money < ITEMS[id].p))),
    el('div', { className: 'sec' }, 'ของกิน / ของขวัญ'),
    ...MART_STOCK.filter(id => ITEMS[id].k !== 'ing').map(id => row(ITEMS[id].ic, ITEMS[id].n, `฿${ITEMS[id].p} · มี ${have(id)}`, btn('ซื้อ', () => buyItem(id), st.money < ITEMS[id].p)))]);
}
function furniPanel() {
  openPanel('🛋️ ร้านเฟอร์นิเจอร์', () => {
    const next = HOME_SIZES[st.homeLv + 1];
    return [money(),
      next ? row('🏗️', `ขยายบ้านเป็น ${next[0]}×${next[1]} ช่อง`, 'มีพื้นที่วางของมากขึ้น', btn(`฿${next[2]}`, () => {
        if (st.money < next[2]) return say('เงินไม่พอ');
        st.money -= next[2]; st.homeLv++; rebuildHome(); toast('🏠 ขยายบ้านเรียบร้อย!'); refreshPanel(); save();
      }, st.money < next[2])) : el('div', { className: 'sub' }, 'บ้านขยายเต็มแล้ว'),
      el('div', { className: 'sec' }, 'สินค้า (ซื้อแล้วไปวางที่บ้านด้วยปุ่ม 🛠️)'),
      ...Object.entries(FURN).filter(([, F]) => F.price > 0).map(([id, F]) => row('🪑', F.n,
        `${CATDESC[F.cat]}${F.cf ? ` · ความน่าอยู่ +${F.cf}` : ''} · ${F.w}×${F.h} · มีในคลัง ${st.store[id] || 0}`,
        btn(`฿${F.price}`, () => {
          if (st.money < F.price) return say('เงินไม่พอ');
          st.money -= F.price; st.store[id] = (st.store[id] || 0) + 1; st.stats.furnBought++; say(`ซื้อ${F.n}แล้ว กด 🛠️ ที่บ้านเพื่อวาง`); refreshPanel(); save();
        }, st.money < F.price)))];
  });
}
function cookPanel(tier) {
  openPanel(`🍳 ทำอาหาร (ทักษะ เลเวล ${lv('cook')})`, () => RECIPES.map(r => {
    const I = ITEMS[r.id], locked = lv('cook') < r.lv, ok = Object.entries(r.need).every(([k, n]) => have(k) >= n);
    const need = el('span', {}, ...Object.entries(r.need).map(([k, n]) => el('span', { className: have(k) >= n ? 'ok' : 'no' }, `${ITEMS[k].ic}${have(k)}/${n} `)));
    return row(locked ? '🔒' : I.ic, locked ? `${I.n} (ปลดล็อกที่ เลเวล ${r.lv})` : I.n, need, btn('ทำ', () => cookDish(r, tier), locked || !ok));
  }));
}
function eatPanel() {
  openPanel('🍽️ กินอะไรดี', () => {
    const ids = Object.keys(st.inv).filter(edible);
    return ids.length ? ids.map(id => row(ITEMS[id].ic, ITEMS[id].n, `มี ${have(id)} · อิ่ม +${ITEMS[id].food || 0}${ITEMS[id].mood ? ` สุข +${ITEMS[id].mood}` : ''}${ITEMS[id].energy ? ` พลัง +${ITEMS[id].energy}` : ''}`, btn('กิน', () => { eat(id); refreshPanel(); })))
      : [el('div', { className: 'sub' }, 'ไม่มีของกิน ลองทำอาหารหรือไปซื้อที่มินิมาร์ท')];
  });
}
function invPanel() {
  openPanel('🎒 กระเป๋า', () => {
    const ids = Object.keys(st.inv);
    if (!ids.length) return [el('div', { className: 'sub' }, 'กระเป๋าว่างเปล่า')];
    const groups = [['quest', 'ของภารกิจ'], ['gem', 'อัญมณี'], ['ore', 'แร่'], ['loot', 'ของจากมอนสเตอร์'], ['dish', 'อาหารที่ทำ'], ['food', 'ของกิน'], ['fish', 'ปลา'], ['bug', 'แมลง'], ['fossil', 'ฟอสซิล'], ['crop', 'พืชผล'], ['ing', 'วัตถุดิบ'], ['seed', 'เมล็ดพันธุ์'], ['gift', 'ของขวัญ'], ['tool', 'เครื่องมือ']];
    return groups.flatMap(([k, t]) => {
      const list = ids.filter(id => ITEMS[id].k === k);
      return list.length ? [el('div', { className: 'sec' }, t), ...list.map(id => row(ITEMS[id].ic, ITEMS[id].n, `จำนวน ${have(id)}`, edible(id) ? btn('กิน', () => { eat(id); refreshPanel(); }) : null))] : [];
    });
  });
}
function giftPanel(p) {
  const r = relOf(p.id);
  openPanel(`🎁 ให้ของขวัญ${p.n}`, () => {
    const ids = Object.keys(st.inv);
    const tag = id => p.love.includes(id) && r.known.includes(id) ? ' ❤️' : p.like.includes(id) && r.known.includes(id) ? ' 👍' : p.hate.includes(id) && r.known.includes(id) ? ' 👎' : '';
    return [r.gift === day() ? el('div', { className: 'no' }, 'วันนี้ให้ของไปแล้ว') : null,
      ...(ids.length ? ids.map(id => row(ITEMS[id].ic, ITEMS[id].n + tag(id), `มี ${have(id)}`, btn('ให้', () => giveGift(p, id), r.gift === day()))) : [el('div', { className: 'sub' }, 'ไม่มีของในกระเป๋า')])];
  });
}
let jTab = 'skills';
function journal(tab = jTab) {
  jTab = tab;
  openPanel('📖 สมุดบันทึกชีวิต', () => {
    const tabs = el('div', { className: 'tabs' }, ...[['skills', 'ทักษะ'], ['career', 'อาชีพ'], ['family', 'ครอบครัว'], ['school', 'โรงเรียน'], ['pets', 'สัตว์เลี้ยง'], ['sports', 'กีฬา'], ['quests', 'ภารกิจ'], ['people', 'ผู้คน'], ['ach', 'ความสำเร็จ']]
      .map(([k, t]) => el('button', { className: k === jTab ? 'on' : '', textContent: t, onclick: () => { jTab = k; refreshPanel(); } })));
    let body = [];
    if (jTab === 'skills') body = Object.entries(SKILLS).map(([s, [n, ic, eff]]) => {
      const l = lv(s), cur = (st.sk[s] || 0) - xpAt(l), need = xpAt(l + 1) - xpAt(l);
      return row(ic, `${n} เลเวล ${l}`, el('div', {}, el('div', { className: 'bar' }, el('i', { style: `width:${l >= 10 ? 100 : cur / need * 100}%;background:${COL.xp}` })), `${l >= 10 ? 'เต็ม' : `${Math.floor(cur)}/${need} แต้ม`} · ${eff}`));
    });
    if (jTab === 'career') {
      if (!st.job) body = [el('div', { className: 'sub' }, 'ยังไม่มีงาน สมัครได้ที่ออฟฟิศ คาเฟ่ หรือมินิมาร์ท'),
        ...Object.values(JOBS).map(J => row('💼', `${J.n} @${J.at}`, `${J.start}:00–${J.end}:00${J.weekdays ? ' (จ-ศ)' : ' (ทุกวัน)'} · เริ่ม ฿${J.pay[0]}/กะ · ใช้ทักษะ${SKILLS[J.skill][0]}`))];
      else {
        const J = JOBS[st.job.id], L = st.job.lv;
        body = [row('💼', `${J.titles[L]} (${J.n})`, `ที่${J.at} · ${J.start}:00–${J.end}:00${J.weekdays ? ' จ-ศ' : ' ทุกวัน'} · ฿${J.pay[L]}/กะ`),
          L < 4 ? row('📈', `ผลงาน ${st.job.perf.toFixed(1)} / ${perfNeed(L)}`, el('div', {}, el('div', { className: 'bar' }, el('i', { style: `width:${Math.min(100, st.job.perf / perfNeed(L) * 100)}%;background:#7ee07e` })),
            el('span', { className: lv(J.skill) >= J.req[L + 1] ? 'ok' : 'no' }, `เลื่อนขั้นเป็น${J.titles[L + 1]} ต้องมี${SKILLS[J.skill][0]} เลเวล ${J.req[L + 1]} (ตอนนี้ ${lv(J.skill)})`)))
            : row('👑', 'ตำแหน่งสูงสุดแล้ว', ''),
          el('div', { className: 'sub' }, 'เคล็ดลับ: ความสุข 70+ ได้ค่าจ้างและผลงานเพิ่ม · ความสุขต่ำกว่า 30 ผลงานลด'),
          el('div', { className: 'sec' }, 'เส้นทางอาชีพ'), ...J.titles.map((t, i) => row(i <= L ? '✅' : '⬜', t, `฿${J.pay[i]}/กะ · ${SKILLS[J.skill][0]} เลเวล ${J.req[i]}`))];
      }
    }
    if (jTab === 'family') body = familyRows();
    if (jTab === 'school') body = schoolRows();
    if (jTab === 'pets') body = petRows();
    if (jTab === 'sports') body = trophyRows();
    if (jTab === 'quests') body = questRows();
    if (jTab === 'people') body = PEOPLE.map(p => {
      const r = relOf(p.id), hearts = '❤️'.repeat(Math.floor(r.f / 20)) + '🤍'.repeat(5 - Math.floor(r.f / 20));
      const known = k => p[k].map(id => r.known.includes(id) ? ITEMS[id].ic : '❓').join(' ');
      const role = ROLE_NAME[p.role] ? ROLE_NAME[p.role] + ' · ' : '';
      return row(p.date ? '💗' : '🙂', `${p.n} — ${relName(p.id, r.f)}`, `${role}${hearts} ${Math.floor(r.f)}/100 · ชอบมาก ${known('love')} · ชอบ ${known('like')} · ไม่ชอบ ${known('hate')}`);
    }).concat(el('div', { className: 'sub' }, 'คุยทุกวันเพื่อสนิทขึ้น · สนิท 40+ จะบอกของที่ชอบ · 60+ ชวนเดทได้ · 90+ สารภาพรักด้วยช่อดอกไม้ใหญ่'));
    if (jTab === 'ach') body = [el('div', { className: 'sub' }, `ปลดล็อก ${Object.keys(st.ach).length}/${ACH.length}`),
      ...ACH.map(([id, n, d]) => row(st.ach[id] ? '🏆' : '🔒', n, st.ach[id] ? `สำเร็จวันที่ ${st.ach[id]}` : d || 'ยังไม่ปลดล็อก'))];
    return [tabs, ...body];
  });
}
function drawMg() {
  const J = JOBS[st.job.id];
  mgEl.replaceChildren(el('h3', { textContent: `💼 ${J.titles[st.job.lv]} — กะทำงาน` }),
    el('div', {}, `รอบ ${Math.min(mg.round + 1, 3)}/3 : ${mg.task}`),
    el('div', { className: 'track' }, el('div', { className: 'zone', style: `left:${mg.z * 100}%;width:${mg.w * 100}%` }, el('i')), el('div', { className: 'mark', style: `left:${mg.pos * 100}%` })),
    el('div', { className: 'fb' }, mg.fb),
    el('button', { textContent: 'กด! (E / สเปซบาร์)', onpointerdown: e => { e.preventDefault(); mgPress(); } }));
  mgEl.hidden = false;
}

// ---- decorate mode ----
const deco = { on: false, sel: null, hover: null };
function decoToggle() {
  if (scene !== home) return say('แต่งบ้านได้เฉพาะในบ้าน');
  deco.on = !deco.on; deco.sel = null; decoEl.hidden = !deco.on; keys.clear(); if (deco.on) decoUI();
}
function decoUI() {
  const ids = Object.keys(st.store).filter(id => st.store[id] > 0);
  decoEl.replaceChildren(
    el('div', { style: 'display:flex;justify-content:space-between;gap:8px;align-items:center' },
      el('b', { style: 'color:var(--gold)' }, `🛠️ แต่งบ้าน · ความน่าอยู่ ${comfort}`), btn('เสร็จ', decoToggle)),
    el('div', { className: 'sub' }, deco.sel ? `แตะพื้นเพื่อวาง ${FURN[deco.sel].n}` : 'เลือกของจากคลังเพื่อวาง หรือแตะเฟอร์นิเจอร์ในบ้านเพื่อเก็บเข้าคลัง'),
    el('div', { className: 'list' }, ids.length ? ids.map(id => el('button', { className: deco.sel === id ? 'on' : '', textContent: `${FURN[id].n} ×${st.store[id]}`, onclick: () => { deco.sel = deco.sel === id ? null : id; decoUI(); } }))
      : el('span', { className: 'sub' }, 'คลังว่าง — ซื้อของที่ร้านเฟอร์นิเจอร์ในเมือง')));
}
function canPlace(id, x, y) {
  const F = FURN[id], { W, H } = home;
  if (x < 0 || y < 2 || x + F.w > W || y + F.h > H) return false;
  for (const f of st.furn) {
    const G = FURN[f.id];
    if (!!G.floor !== !!F.floor) continue;
    if (x < f.x + G.w && f.x < x + F.w && y < f.y + G.h && f.y < y + F.h) return false;
  }
  if (F.floor) return true;
  const px0 = Math.floor((player.x - 8) / T), px1 = Math.floor((player.x + 8) / T), py0 = Math.floor((player.y - 6) / T), py1 = Math.floor(player.y / T);
  const dx = W / 2;
  for (let j = y; j < y + F.h; j++) for (let i = x; i < x + F.w; i++) {
    if (j === H - 1 && (i === dx - 1 || i === dx)) return false;                  // keep the door clear
    if (i >= px0 && i <= px1 && j >= py0 && j <= py1) return false;
  }
  return true;
}
function decoTap(tx, ty) {
  if (deco.sel) {
    if (!canPlace(deco.sel, tx, ty)) return say('วางตรงนี้ไม่ได้');
    st.furn.push({ id: deco.sel, x: tx, y: ty }); if (--st.store[deco.sel] <= 0) { delete st.store[deco.sel]; deco.sel = null; }
  } else {
    const hit = f => tx >= f.x && tx < f.x + FURN[f.id].w && ty >= f.y && ty < f.y + FURN[f.id].h;
    const f = st.furn.find(f => !FURN[f.id].floor && hit(f)) || st.furn.find(hit);
    if (!f) return;
    st.furn.splice(st.furn.indexOf(f), 1); st.store[f.id] = (st.store[f.id] || 0) + 1; say(`เก็บ${FURN[f.id].n}เข้าคลัง`);
  }
  rebuildHome(); decoUI(); save();
}
let cam = { x: 0, y: 0 };
function toTile(e) { const r = cv.getBoundingClientRect(); return [Math.floor(((e.clientX - r.left) / r.width * cv.width + cam.x) / T), Math.floor(((e.clientY - r.top) / r.height * cv.height + cam.y) / T)]; }
cv.addEventListener('pointerdown', e => { if (panelOpen) return closePanel(); if (menuOpen && !(typeof TK !== 'undefined' && TK)) return closeMenu(); if (deco.on) decoTap(...toTile(e)); });   // tap outside a window closes it
cv.addEventListener('pointermove', e => { deco.hover = deco.on ? toTile(e) : null; });

// ---- input ----
const keys = new Set(), touch = { x: 0, y: 0, on: false }, TOUCH = matchMedia('(pointer:coarse)').matches;
function interact() { if (!target) return; if (target.opts.length === 1) target.opts[0][1](); else openMenu(target.name, target.opts); }
// e.code, not e.key: a Thai keyboard layout turns WASD into Thai letters
const keyOf = e => /^Key[A-Z]$/.test(e.code) ? e.code[3].toLowerCase() : /^Digit\d$/.test(e.code) ? e.code[5] : e.code === 'Space' ? ' ' : e.code === 'NumpadEnter' ? 'enter' : e.code.toLowerCase();
addEventListener('keydown', e => {
  const k = keyOf(e);
  if (mg) { if (['e', ' ', 'enter'].includes(k)) { e.preventDefault(); if (!e.repeat) mgPress(); } else { if (k.startsWith('arrow')) e.preventDefault(); mgKey(k); } return; }
  if (menuOpen) {
    if (k === 'escape') closeMenu();
    const n = parseInt(k, 10), btns = menuEl.querySelectorAll('button');
    if (n >= 1 && n < btns.length) btns[n - 1].click();
    if (k === 'arrowdown' || k === 'arrowup') { e.preventDefault(); const i = [...btns].indexOf(document.activeElement); btns[(i + (k === 'arrowdown' ? 1 : btns.length - 1)) % btns.length].focus(); }
    return;
  }
  if (panelOpen) { if (k === 'escape' || k === 'i' || k === 'j') closePanel(); return; }
  if (!player || busy) return;
  if (deco.on && (k === 'escape' || k === 'b')) return decoToggle();
  if (k === 'i') return invPanel();
  if (k === 'j') return journal();
  if (k === 'b') return decoToggle();
  if (['e', ' ', 'enter'].includes(k)) { e.preventDefault(); if (!e.repeat && !deco.on) interact(); return; }
  if (k.startsWith('arrow')) e.preventDefault();
  keys.add(k);
});
addEventListener('keyup', e => keys.delete(keyOf(e)));
addEventListener('blur', () => keys.clear());
$('bInv').onclick = () => player && invPanel();
$('bJour').onclick = () => player && journal();
bDeco.onclick = () => player && decoToggle();
$('abtn').addEventListener('pointerdown', e => { e.preventDefault(); if (mg) mgPress(); else if (!menuOpen && !panelOpen && !busy && !deco.on) interact(); });
// Finger taps: press the button on pointerup ourselves, then swallow the browser's own click for a moment,
// so a tap works even when a phone browser drops or delays the synthesized click (and never fires twice).
{
  let down = null, fastAt = -1e9;
  addEventListener('pointerdown', e => { down = e.pointerType === 'touch' ? { x: e.clientX, y: e.clientY, t: e.target, at: performance.now() } : null; }, true);
  addEventListener('pointercancel', () => { down = null; }, true);   // the finger started scrolling
  addEventListener('pointerup', e => {
    const d = down; down = null; if (!d || e.pointerType !== 'touch') return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12 || performance.now() - d.at > 700) return;
    const b = d.t.closest?.('button:not(:disabled), #talk .tx, #err'); if (!b || b.id === 'abtn' || b.onpointerdown) return;
    fastAt = performance.now(); b.click();
  }, true);
  addEventListener('click', e => { if (e.isTrusted && performance.now() - fastAt < 650) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
}
// phone back button / back swipe closes the open window instead of leaving the game
if (TOUCH) {   // phones only: on a computer the browser's Back button should still leave
  history.pushState({ game: 1 }, '');
  addEventListener('popstate', () => {
    if (typeof TK !== 'undefined' && TK) closeTalk(); else if (panelOpen) closePanel(); else if (menuOpen) closeMenu(); else if (player && !mg && !busy && typeof pauseMenu === 'function') pauseMenu();
    history.pushState({ game: 1 }, '');
  });
}
{
  const stick = $('stick'), knob = $('knob');
  const set = e => {
    const r = stick.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy), m = r.width / 2;
    const k = Math.min(1, m / (d || 1)); knob.style.transform = `translate(${dx * k}px,${dy * k}px)`;
    touch.x = d > 12 ? dx / d : 0; touch.y = d > 12 ? dy / d : 0;
  };
  stick.addEventListener('pointerdown', e => { stick.setPointerCapture(e.pointerId); touch.on = true; set(e); });
  stick.addEventListener('pointermove', e => touch.on && set(e));
  const end = () => { touch.on = false; touch.x = touch.y = 0; knob.style.transform = ''; };
  stick.addEventListener('pointerup', end); stick.addEventListener('pointercancel', end);
}

// ---- targets ----
const BUY = (price, d, mins, text) => () => { if (st.money < price) return say('เงินไม่พอ'); fx({ money: -price, ...d }); tick(mins); say(text); };
town.targets.push(
  { ...pt(BUILDINGS[0]), name: 'บ้านของฉัน', opts: [['เข้าบ้าน', () => goHome()]] },
  { ...pt(BUILDINGS[1]), name: 'มินิมาร์ท', get opts() { return [['ซื้อของ', martPanel], ...jobOpts('clerk')]; } },
  { ...pt(BUILDINGS[3]), name: 'คาเฟ่', get opts() { return [['กาแฟ ฿25', BUY(25, { energy: 15, mood: 3 }, 15, 'ตาสว่างเลย')], ['ข้าวมันไก่ ฿60', BUY(60, { food: 50, mood: 5 }, 30, 'อิ่มอร่อย')], ['เค้กสตรอว์เบอร์รี ฿45', BUY(45, { food: 15, mood: 20 }, 20, 'หวานละมุน')], ...jobOpts('barista')]; } },
  { ...pt(BUILDINGS[4]), name: 'ออฟฟิศ', get opts() { return jobOpts('office'); } },
  { ...pt(BUILDINGS[5]), name: 'ร้านเฟอร์นิเจอร์', opts: [['ดูสินค้า / ขยายบ้าน', furniPanel]] },
  ...BENCHES.map(([x, y]) => ({ x: (x + 1) * T, y: (y + 1) * T + 12, name: 'ม้านั่งในสวน', opts: [
    ['นั่งพัก 1 ชม.', () => { fx({ mood: 15, energy: 8 }); tick(60); say('ลมเย็นสบาย'); }],
    ['วิ่งออกกำลังกาย 1 ชม.', () => { if (st.energy < 20) return say('เหนื่อยเกินไป'); fx({ energy: -15, mood: 5 }); xp('fit', 25); tick(60); say('วิ่งรอบสวนจนเหงื่อซึม'); }],
    ['สเก็ตช์ภาพวิว 1 ชม.', () => { fx({ mood: 6, energy: -5 }); xp('art', 15); tick(60); say('ได้ภาพสเก็ตช์สวยๆ'); }]] })),
  { x: 14 * T, y: 26 * T + 12, name: 'บ่อปลา', opts: [['ให้อาหารปลา', () => { fx({ mood: 6 }); tick(10); say('ปลาคาร์ปว่ายมากินเต็มเลย'); }]] },
);
function pt(b) { return { x: b.ix, y: b.iy }; }
function findTarget() {
  let best = null, bd = 22;
  const consider = t => { const d = Math.hypot(player.x - t.x, player.y - t.y); if (d < bd) { bd = d; best = t; } };
  scene.targets.forEach(t => t.opts.length && consider(t));
  if (scene === town) {
    for (const p of people) if (!p.hidden) consider({ x: p.x, y: p.y, name: `${p.n} (${relName(p.id, relOf(p.id).f)})`, get opts() { return personOpts(p); } });
    for (const n of folks) if (!n.away) consider({ x: n.x, y: n.y, name: 'ชาวเมือง', opts: [['ทักทาย', () => {
      n.dir = faceTo(n, player);
      if (n.talked !== day()) { n.talked = day(); fx({ mood: 3 }); xp('charm', 5); }
      say('"สวัสดีครับ/ค่ะ อากาศดีนะวันนี้"'); tick(5);
    }]] });
  } else if (typeof nRoom !== 'undefined' && scene === nRoom) {
    for (const e of visitEnts()) consider({ x: e.x, y: e.y, name: `${e.n} (${relName(e.id, relOf(e.id).f)})`, get opts() { return visitOpts(e.p); } });
  } else for (const f of homeFamily()) consider({ x: f.x, y: f.y, name: `${f.n} (${f.label || (f.id === 'dad' ? 'พ่อ' : 'แม่')})`, get opts() { return personOpts(f.p); } });
  if (typeof petEnts === 'function') for (const p of petEnts(scene)) consider({ x: p.x, y: p.y, name: p.n, get opts() { return petOpts(p.id); } });
  return best;
}

// ================= loop =================
let achT = 0, saveT = 0;
function update(dt) {
  const paused = menuOpen || panelOpen || busy || mg || deco.on;
  if (mg) mgUpdate(dt);
  if (!paused) {
    let dx = touch.x, dy = touch.y;
    if (keys.has('a') || keys.has('arrowleft')) dx--;
    if (keys.has('d') || keys.has('arrowright')) dx++;
    if (keys.has('w') || keys.has('arrowup')) dy--;
    if (keys.has('s') || keys.has('arrowdown')) dy++;
    const m = Math.hypot(dx, dy);
    if (m > 0.1) { const sp = 95 * dt / Math.max(1, m); move(scene, player, dx * sp, dy * sp); player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); }
    animate(player, m > 0.1, dt);
    tick(dt * 2);   // 1 real second = 2 game minutes
  }
  for (const p of people) updatePerson(p, dt);
  for (const n of folks) wander(town, n, 35, dt, true);
  petUpdate(dt); for (const f of homeFamily()) wander(typeof famScene === 'function' ? famScene() : home, f, 26, dt);
  if (typeof updateVisit === 'function') updateVisit(dt);
  for (const c of CARS) { c.x += c.dir * c.v * dt; const W = town.W * T; if (c.x > W + 60) c.x = -60; if (c.x < -60) c.x = W + 60; }
  floats = floats.filter(f => (f.t -= dt) > 0);
  target = paused ? null : findTarget();
  hintEl.hidden = !target; if (target) hintEl.textContent = `[${TOUCH ? 'A' : 'E'}] ${target.name}${target.opts.length === 1 ? ': ' + target.opts[0][0] : ''}`;
  if (msgT > 0 && (msgT -= dt) <= 0) msgEl.hidden = true;
  if ((achT += dt) > 1) { achT = 0; checkAch(); lifeTick(); seasonTick(); }
  if ((saveT += dt) > 10) { saveT = 0; if (CFG.autosave) save(); }
}
function darkness(h) { if (h >= 7 && h < 17) return 0; if (h >= 20 || h < 5) return .58; return h < 7 ? .58 * (7 - h) / 2 : .58 * (h - 17) / 3; }
function camera(size, view, pos, min = 0) { return size <= view ? Math.round((size - view) / 2) : Math.round(Math.max(min, Math.min(size - view, pos - view / 2))); }
function render() {
  const sc = scene, cx = camera(sc.W * T, VW, player.x), cy = camera(sc.H * T, VH, player.y, sc.top || 0);
  cam = { x: cx, y: cy }; g = ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); R(sc.bg, 0, 0, VW, VH);
  ctx.setTransform(1, 0, 0, 1, -cx, -cy);
  if (sc.drawBg) sc.drawBg(); else ctx.drawImage(sc.ground, 0, 0);
  if (sc === town) { const t = now() / 300 | 0; for (let i = 0; i < 4; i++) R('#e8f8ff', (12 * T + ((t * 7 + i * 37) % 120)) | 0, 23 * T + ((t * 13 + i * 23) % 88), 3, 1); }
  const ents = sc === town ? [player, ...folks.filter(f => !f.away), ...people.filter(p => !p.hidden), ...(typeof townExtras === 'function' ? townExtras() : [])] : typeof mine !== 'undefined' && sc === mine ? [player, ...mine.ents] : typeof nRoom !== 'undefined' && sc === nRoom ? [player, ...visitEnts()] : [player, ...petEnts(sc), ...homeFamily()];
  const list = sc.statics.concat(ents.map(e => ({ k: e.y, f: () => drawEnt(e) })));
  if (sc === town) for (const c of CARS) list.push({ k: c.y, f: () => drawCar(c) });
  list.sort((a, b) => a.k - b.k).forEach(d => d.f());
  if (deco.on && deco.sel && deco.hover) { const F = FURN[deco.sel], [x, y] = deco.hover; R(canPlace(deco.sel, x, y) ? '#5ac87a88' : '#e84a4a88', x * T, y * T, F.w * T, F.h * T); }
  for (const f of floats) ptext(f.s, Math.round(f.x - ptw(f.s) / 2), Math.round(f.y - (1.4 - f.t) * 18), f.c);
  const d = sc === town ? darkness(hour()) : darkness(hour()) * .35;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const h = hour();
  if (typeof ambientPass === 'function') ambientPass(sc, d, cx, cy);
  else {
    if (d) R(`rgba(18,20,64,${d})`, 0, 0, VW, VH);
    if (sc === town && h >= 16.5 && h < 19) R('rgba(255,130,60,0.10)', 0, 0, VW, VH);
    if (d > .15) {
      ctx.globalCompositeOperation = 'lighter';
      const glow = (x, y, r, a) => { const gr = ctx.createRadialGradient(x - cx, y - cy, 0, x - cx, y - cy, r); gr.addColorStop(0, `rgba(255,210,120,${a})`); gr.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = gr; ctx.fillRect(x - cx - r, y - cy - r, r * 2, r * 2); };
      if (sc === town) { for (const [tx, ty] of LAMPS) glow(tx * T + 16, ty * T - 20, 60, .35); for (const c of CARS) glow(c.x + c.dir * 26, c.y - 12, 26, .3); }
      else if (typeof nRoom !== 'undefined' && sc === nRoom) for (const l of nRoom.lamps) glow(l.x * T + 16, l.y * T - 18, 90, .3);
      else for (const f of st.furn) if (FURN[f.id].d === 'lamp') glow(f.x * T + 16, f.y * T - 18, 90, .3);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  if (typeof overlayFx === 'function') overlayFx(sc);
  if (typeof lightPass === 'function') lightPass(sc, cx, cy, d);
}
let last = 0;
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
  update(dt); render(); drawHud();
  requestAnimationFrame(loop);
}
function dressPlayer() { player.spr = sheet({ ...palOf(st.look), ...OUTFITS[st.outfit] }); }

// ================= self-check =================
rebuildHome();
console.assert(CAT.concat(CAT_LEGS).every(r => r.length === 16), 'cat rows must be 16 wide');
console.assert(st.furn.every(f => { const F = FURN[f.id]; return F && DRAW[F.d]; }), 'every furniture needs a catalog entry and draw fn');
for (const [i, a] of st.furn.entries()) for (const b of st.furn.slice(i + 1)) {
  const A = FURN[a.id], B = FURN[b.id];
  console.assert(!!A.floor !== !!B.floor || !(a.x < b.x + B.w && b.x < a.x + A.w && a.y < b.y + B.h && b.y < a.y + A.h), 'default furniture overlaps', a.id, b.id);
}
for (const sc of [town, home]) for (const t of sc.targets) console.assert(!blocked(sc, t.x, t.y), 'interaction point blocked:', t.name);
for (const k in ANCHORS) for (let i = 0; i < 50; i++) { const p = spotFor(k, i); console.assert(!blocked(town, p.x, p.y), 'NPC spot blocked:', k, i); }
for (const h of HOMES) console.assert(!blocked(town, BUILDINGS[h].ix, BUILDINGS[h].iy + 4), 'NPC home blocked:', h);
console.assert(Object.values(ITEMS).every(I => I.ic && I.n), 'items need icon and name');
console.assert(RECIPES.every(r => ITEMS[r.id] && Object.keys(r.need).every(k => ITEMS[k])), 'recipes reference unknown items');
console.assert(PEOPLE.every(p => [...p.love, ...p.like, ...p.hate].every(i => ITEMS[i])), 'people preferences reference unknown items');

// ================= start =================
function start(saved) {
  if (saved) st = Object.assign(newState(), saved.st);   // new games arrive with st prepared by the creator
  player = { x: 0, y: 0, dir: 0, frame: 0, at: 0 };
  dressPlayer(); makePeople(); makeFamily(); makePets(); rebuildHome();
  for (const p of people) { p.slot = slotOf(p); p.hidden = p.slot === 'in'; p.alpha = p.hidden ? 0 : 1; if (!p.hidden) Object.assign(p, targetOf(p, p.slot)); }
  if (saved) enter(saved.scene === 'home' ? home : town, saved.x, saved.y, 0);
  else { const d = homeDoor(); enter(home, d.x, d.y - 40, 0); }
  $('select').remove();
  say(saved ? 'ยินดีต้อนรับกลับ!' : age() >= 16 ? 'ยินดีต้อนรับสู่บ้านใหม่! เปิดสมุด 📖 (J) ดูเป้าหมาย แล้วออกไปหางานในเมืองกัน' : 'ยินดีต้อนรับสู่บ้านใหม่! เปิดสมุด 📖 (J) ดูเป้าหมาย แล้วไปโรงเรียนในเมืองกัน');
  requestAnimationFrame(loop);
}
