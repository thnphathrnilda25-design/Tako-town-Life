'use strict';
// Seasons (7 days each, 28-day year), daily weather, festivals and the screen-space effects that show them.
const SEASONS = [['ฤดูใบไม้ผลิ', '🌸'], ['ฤดูร้อน', '☀️'], ['ฤดูใบไม้ร่วง', '🍂'], ['ฤดูหนาว', '❄️']];
const WX_ICON = { sun: '☀️', cloud: '☁️', rain: '🌧️', storm: '⛈️', snow: '❄️' };
const WX_ODDS = [[['sun', .5], ['cloud', .2], ['rain', .3]], [['sun', .55], ['cloud', .1], ['rain', .2], ['storm', .15]],
  [['sun', .4], ['cloud', .35], ['rain', .25]], [['sun', .3], ['cloud', .3], ['snow', .4]]];
const TREE_COLS = [['#4aa84e', '#66c068', '#f4b8d0'], ['#2f7d3a', '#3f9a46', '#5cb85a'], ['#c8602a', '#e08a2a', '#f0b84a'], ['#b8c8d4', '#dce6ee', '#ffffff']];
const seasonOf = (d = day()) => ({ i: Math.floor(((d - 1) % YEAR) / 7), d: (d - 1) % 7 + 1 });
const hash01 = n => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
function weatherOf(d = day()) { let r = hash01(d), acc = 0; for (const [w, p] of WX_ODDS[seasonOf(d).i]) if (r < (acc += p)) return w; return 'sun'; }
const seasonTag = () => SEASONS[seasonOf().i][1] + WX_ICON[weatherOf()];
const wet = () => ['rain', 'storm'].includes(weatherOf());
const FESTIVALS = { '0:5': { id: 'water', n: 'เทศกาลสงกรานต์', ic: '💦' }, '1:6': { id: 'fair', n: 'งานฤดูร้อน', ic: '🎡' }, '2:5': { id: 'lantern', n: 'คืนโคมไฟ', ic: '🏮' },
  '2:7': { id: 'spooky', n: 'คืนฮาโลวีน', ic: '🎃' }, '3:7': { id: 'newyear', n: 'นับถอยหลังปีใหม่', ic: '🎆' } };
Object.assign(ITEMS, {
  garland: { n: 'พวงมาลัยสงกรานต์', ic: '🏵️', k: 'gift', sell: 40 }, ferrispic: { n: 'รูปชิงช้าสวรรค์', ic: '🎡', k: 'gift', sell: 60 },
  skylantern: { n: 'โคมลอย', ic: '🏮', k: 'gift', sell: 80 }, pumpkin: { n: 'ฟักทองแกะสลัก', ic: '🎃', k: 'gift', sell: 50 },
  firework: { n: 'ดอกไม้ไฟ', ic: '🎆', k: 'gift', sell: 70 }, wishcard: { n: 'การ์ดอวยพร', ic: '🎴', k: 'gift', sell: 30 },
});
const festival = (d = day()) => { const s = seasonOf(d); return FESTIVALS[`${s.i}:${s.d}`] || null; };
const festOn = () => { const f = festival(), h = hour(); return f && h >= 10 && h < 24 ? f : null; };

// NPCs avoid bad weather and gather at the plaza on festival evenings
const _slotOf = slotOf;
slotOf = p => festOn() && hour() >= 17 && !p.fam ? 'plaza' : wet() || weatherOf() === 'snow' ? (p.k % 3 ? 'in' : _slotOf(p)) : _slotOf(p);

let lastFest = 0;
function seasonTick() {
  treeCol = TREE_COLS[seasonOf().i];
  if (st.fday !== day()) {
    st.fday = day();
    const s = seasonOf(), f = festival();
    if (s.d === 1) toast(`${SEASONS[s.i][1]} เข้าสู่${SEASONS[s.i][0]}แล้ว!`);
    if (f) toast(`${f.ic} วันนี้มี ${f.n} ที่ลานเมือง (10:00–24:00)`);
    if (weatherOf() === 'storm') toast('⛈️ พายุกำลังมา — ระวังตัวด้วย!');
  }
  if (scene === town && wet() && !have('umbrella')) { st.clean = Math.max(0, st.clean - .6); st.mood = Math.max(0, st.mood - .15); }
}

// ---- world decoration for festivals (drawn as sorted statics) ----
town.statics.push({ k: 7 * T + 40, f() {
  const f = festOn(); if (!f) return;
  const x0 = 17 * T, x1 = 23 * T, y0 = 7 * T - 10, t = now() / 1000;
  for (let x = x0; x <= x1; x += 8) { const y = y0 + Math.round(Math.sin((x - x0) / (x1 - x0) * Math.PI) * 10); R('#3a2a22', x, y, 8, 1); if ((x - x0) % 16 === 0) { R(['#e84a4a', '#ffd54a', '#5ac87a', '#3a8ae8'][((x - x0) / 16) % 4], x, y + 1, 7, 7); } }
  if (f.id === 'lantern' && hour() >= 18) for (let i = 0; i < 7; i++) {
    const x = 12 * T + 10 + ((i * 41 + t * 6) % 100), y = 23 * T + 14 + Math.sin(t + i) * 4 + i * 8 % 56;
    disc(Math.round(x), Math.round(y), 5, '#ffb04a'); disc(Math.round(x), Math.round(y), 3, '#fff0a0');
  }
  if (f.id === 'spooky') for (const px of [18, 22]) { const X = px * T + 16, Y = 7 * T + 26; disc(X, Y - 8, 9, '#e8802a', .85); R('#2a1a2e', X - 4, Y - 12, 3, 3); R('#2a1a2e', X + 2, Y - 12, 3, 3); R('#2a1a2e', X - 3, Y - 6, 7, 2); R('#3a8a3a', X - 1, Y - 18, 3, 3); }
  if (f.id === 'water') for (let i = 0; i < 6; i++) { const ph = (t * 1.5 + i * .7) % 1; disc(19 * T + i * 18 % 90, 8 * T - ph * 26, 2 + ph * 3, `rgba(120,200,255,${.8 - ph * .7})`); }
  if (f.id === 'fair') { const X = 22 * T + 16, Y = 8 * T; for (let a = 0; a < 8; a++) { const an = t + a * Math.PI / 4; disc(Math.round(X + Math.cos(an) * 26), Math.round(Y - 40 + Math.sin(an) * 26), 4, ['#e84a4a', '#ffd54a', '#5ac87a', '#3a8ae8'][a % 4]); } R('#6a4a34', X - 2, Y - 40, 4, 40); }
} });

// ---- screen-space weather / season particles ----
function overlayFx(sc) {
  g = ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const w = weatherOf(), si = seasonOf().i, t = now() / 1000, out = sc === town;
  if (out) {
    if (si === 2) R('rgba(255,150,40,.07)', 0, 0, VW, VH);
    if (si === 3) R('rgba(215,230,255,.12)', 0, 0, VW, VH);
    if (w === 'cloud' || w === 'rain' || w === 'storm') R(w === 'storm' ? 'rgba(20,24,50,.32)' : 'rgba(60,70,100,.14)', 0, 0, VW, VH);
    if (w === 'rain' || w === 'storm') for (let i = 0; i < (w === 'storm' ? 160 : 90); i++) R('#bcd4ff', ((i * 97) % VW + t * 40) % VW | 0, ((i * 61) % VH + t * 340) % VH | 0, 1, 6);
    if (w === 'storm' && t % 9 < .12) R('rgba(255,255,255,.35)', 0, 0, VW, VH);
    if (w === 'snow' || si === 3) for (let i = 0; i < 70; i++) R('#fff', (((i * 83) % VW + Math.sin(t + i) * 12) + VW) % VW | 0, ((i * 47) % VH + t * 28) % VH | 0, 2, 2);
    if (si === 2 && w !== 'rain') for (let i = 0; i < 22; i++) R(i % 2 ? '#e8802a' : '#f0b84a', ((i * 71) % VW + t * 22) % VW | 0, ((i * 53) % VH + t * 38 + Math.sin(t * 2 + i) * 6) % VH | 0, 3, 2);
    if (si === 0 && w === 'sun') for (let i = 0; i < 16; i++) R('#ffc8dc', ((i * 67) % VW + t * 14) % VW | 0, ((i * 59) % VH + t * 24) % VH | 0, 2, 2);
    const f = festOn();
    if (f?.id === 'newyear' && hour() >= 21) for (let b = 0; b < 3; b++) {
      const k = Math.floor(t / 1.6) * 3 + b, ph = (t % 1.6) / 1.6, cx = hash01(k) * VW, cy = 20 + hash01(k + 9) * VH * .35, col = ['255,120,120', '255,220,90', '120,200,255', '200,120,255'][k % 4];
      for (let a = 0; a < 14; a++) { const an = a / 14 * Math.PI * 2; R(`rgba(${col},${1 - ph})`, cx + Math.cos(an) * ph * 46 | 0, cy + Math.sin(an) * ph * 46 + ph * ph * 22 | 0, 2, 2); }
    }
  }
}
console.assert(['0:5', '1:6', '2:5', '2:7', '3:7'].every(k => FESTIVALS[k]), 'festival table');
console.assert([1, 2, 3, 10, 40].every(d => WX_ICON[weatherOf(d)]), 'weather lookup');

// ---- festival activities at the plaza ----
const joinFee = (price, run) => () => { if (st.money < price) return say('เงินไม่พอ'); fx({ money: -price }); run(); };
const crowdBond = n => people.filter(p => p.slot === 'plaza').forEach(p => { const r = relOf(p.id); r.f = Math.min(100, r.f + n); });
const festAct = (key, cost, run) => () => {
  const F = st.fest || (st.fest = {}), k = `${festival()?.id || 'x'}:${key}`;
  if (F[k] === day()) return say('กิจกรรมนี้ทำไปแล้ววันนี้');
  if (cost && st.money < cost) return say('เงินไม่พอ');
  F[k] = day(); if (cost) fx({ money: -cost });
  if (typeof civicFestivalBonus === 'function') civicFestivalBonus();
  run();
};
const FEST_ACTS = {
  water: () => [
    ['เล่นสาดน้ำ 💦', festAct('splash', 0, () => { fx({ mood: 25, clean: -12, energy: -8 }); crowdBond(2); tick(60); say('เปียกโชกแต่หัวเราะกันสนุก!'); })],
    ['สรงน้ำพระ 🙏', festAct('pour', 20, () => { fx({ mood: 15, energy: -5 }); xp('charm', 15); tick(40); say('ได้ทำบุญสรงน้ำพระ ใจสงบขึ้น'); })],
    ['ก่อเจดีย์ทราย 🏖️', festAct('sand', 0, () => { fx({ mood: 12, energy: -12 }); xp('fit', 10); crowdBond(1); tick(45); say('เจดีย์ทรายสูงเท่าตัวเลย!'); })],
    ['ร้อยพวงมาลัย 🌼', festAct('garland', 30, () => { addItem('garland'); xp('charm', 12); fx({ mood: 8 }); tick(30); say('ได้พวงมาลัยหอม ๆ เป็นที่ระลึก'); })],
  ],
  fair: () => [
    ['เล่นเกมงานวัด ฿30', festAct('game', 30, () => { const win = Math.random() < .35; if (win) addItem('plush'); fx({ mood: win ? 20 : 8 }); tick(30); say(win ? 'คุณชนะตุ๊กตาหมี! 🧸' : 'เกือบแล้ว! ลองอีกครั้ง'); })],
    ['นั่งชิงช้าสวรรค์ ฿20', festAct('ferris', 20, () => { addItem('ferrispic'); fx({ mood: 25 }); crowdBond(1); tick(45); say('มองเมืองจากข้างบนสวยมาก! ได้รูปชิงช้าสวรรค์เป็นที่ระลึก'); })],
    ['กินของอร่อยงานวัด ฿40', festAct('food', 40, () => { fx({ food: 40, mood: 15 }); tick(40); say('อิ่มท้องและมีความสุข'); })],
    ['ดูโชว์กลางเวที 🎪', festAct('show', 0, () => { fx({ mood: 12 }); crowdBond(2); tick(30); say('โชว์สนุกจนปรบมือไม่หยุด'); })],
  ],
  lantern: () => [
    ['ลอยโคม ฿20 🏮', festAct('float', 20, () => { fx({ mood: 20 }); xp('charm', 20); crowdBond(1); tick(30); say('คุณอธิษฐานกับโคมลอยที่ลอยขึ้นฟ้า'); })],
    ['เขียนคำอวยพร 🎋', festAct('wish', 0, () => { addItem('wishcard'); fx({ mood: 10 }); tick(20); say('เขียนคำอวยพรแล้ว ได้การ์ดอวยพรเป็นที่ระลึก'); })],
    ['เดินชมขบวนโคมไฟ 🏮', festAct('parade', 0, () => { fx({ mood: 15 }); crowdBond(2); tick(35); say('ขบวนโคมไฟสวยจนต้องหยุดมอง'); })],
    ['ประดิษฐ์โคมไฟ ฿40', festAct('craft', 40, () => { addItem('skylantern'); xp('charm', 10); fx({ mood: 8 }); tick(30); say('ได้โคมลอยทำมือเป็นที่ระลึก'); })],
  ],
  spooky: () => [
    ['ขอขนม 🎃', festAct('candy', 0, () => { const n = age() < 13 ? 3 : 1; addItem('choco', n); fx({ mood: 15 }); tick(40); say(`ได้ช็อกโกแลต ${n} ชิ้น!`); })],
    ['บ้านผีสิง ฿30', festAct('haunt', 30, () => { fx({ mood: 20, energy: -10 }); xp('fit', 8); tick(30); say('ตกใจจนเกือบวิ่งหนี แต่สนุกมาก!'); })],
    ['ประกวดชุดแฟนซี', festAct('costume', 0, () => { addItem('pumpkin'); fx({ mood: 18 }); xp('charm', 15); crowdBond(2); tick(40); say('ทุกคนชอบชุดของคุณ! ได้ฟักทองแกะสลักเป็นที่ระลึก'); })],
    ['เล่าเรื่องผีรอบกองไฟ 🔥', festAct('story', 0, () => { fx({ mood: 12, energy: -5 }); crowdBond(2); tick(30); say('เรื่องผีทำให้ทุกคนขนลุกกันทั้งวง'); })],
  ],
  newyear: () => [
    ['ปาร์ตี้นับถอยหลัง 🎆', () => { if (hour() < 21) return say('การนับถอยหลังเริ่มตอน 21:00'); return festAct('count', 0, () => { fx({ mood: 35 }); crowdBond(3); tick(90); say('สวัสดีปีใหม่!! 🎉'); })(); }],
    ['เขียนคำอธิษฐานปีใหม่ 📝', festAct('resolve', 0, () => { addItem('wishcard'); fx({ mood: 10 }); tick(20); say('เขียนเป้าหมายปีใหม่แล้ว เก็บการ์ดอวยพรไว้เป็นที่ระลึก'); })],
    ['ซื้อดอกไม้ไฟ ฿50 🎆', festAct('firework', 50, () => { addItem('firework'); fx({ mood: 20 }); crowdBond(1); tick(25); say('ได้ดอกไม้ไฟสำหรับฉลองปีใหม่'); })],
    ['ปาร์ตี้กับเพื่อนบ้าน 🎉', festAct('party', 0, () => { fx({ mood: 15, food: 20 }); crowdBond(2); tick(45); say('กินเลี้ยงกับเพื่อนบ้านจนดึก'); })],
  ],
};
town.targets.push({ x: 19 * T + 16, y: 7 * T + 16, get name() { return festOn()?.n || 'ลานเมือง'; }, get opts() { const f = festOn(); return f ? FEST_ACTS[f.id]() : []; } });
