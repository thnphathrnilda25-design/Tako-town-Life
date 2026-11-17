'use strict';
// Night life (night market, the café turning into a bar, fireflies, stargazing), weekly town events and four more
// festivals (Valentine's, summer music fest, Loy Krathong on the river, Christmas), police patrols with a wanted level,
// night pickpockets, and nicer weather: slanted rain with splashes, lightning bolts, fog, cloud shadows, sun rays.
Object.assign(ITEMS, { krathong: { n: 'กระทง', ic: '🪷', k: 'gift', p: 30, sell: 10 }, bracelet: { n: 'กำไลแฮนด์เมด', ic: '📿', k: 'gift', p: 60, sell: 30 } });
if (typeof MOODLETS !== 'undefined') MOODLETS.tipsy = ['🥴', 'มึนเล็กน้อย', 1, 3];
const crowdAt = (place, n) => people.filter(p => p.slot === place && !p.hidden).forEach(p => { const r = relOf(p.id); r.f = Math.min(100, r.f + n); });
const buyFx = (price, d, mins, text) => () => { if (st.money < price) return say('เงินไม่พอ'); fx({ money: -price, ...d }); tick(mins); say(text); };

// ---- night market: the market road fills with lantern-lit stalls 18:00–00:30 ----
const nightMarket = () => { const h = hour(); return (h >= 18 || h < .5) && !wet() && weatherOf() !== 'snow'; };
const NIGHT_STALLS = [...MARKET, ...[19, 28, 17, 30].map(tx => ({ x: tx * T + 16, y: 6 * T + 26 })).filter(s => !blocked(town, s.x, s.y) && !blocked(town, s.x, s.y + 6))].slice(0, 4).map((s, i) => ({ x: s.x, y: s.y, i }));
const NM = [
  ['🍢 ร้านปิ้งย่าง', () => [['ไก่ย่าง + ข้าวเหนียว ฿35', buyFx(35, { food: 35, mood: 6 }, 10, 'ไก่ย่างหอมกรุ่น อร่อยมาก 🍗')], ['หมึกย่าง ฿45', buyFx(45, { food: 25, mood: 10 }, 10, 'หมึกย่างจิ้มซีฟู้ด เด็ดสุดๆ 🦑')]]],
  ['🎯 ซุ้มเกม', () => [['ปาลูกโป่ง ฿20', () => { if (st.money < 20) return say('เงินไม่พอ'); fx({ money: -20, mood: 6 }); tick(10); if (Math.random() < .4) { addItem('plush'); say('แตกสามลูก! ได้ตุ๊กตา 🧸'); } else say('เกือบแล้ว! ลองอีกที'); }],
    ['ตักปลาทอง ฿15', () => { if (st.money < 15) return say('เงินไม่พอ'); fx({ money: -15, mood: 8 }); tick(10); say(Math.random() < .3 ? 'ตักได้หนึ่งตัว! ปล่อยคืนบ่อให้แล้ว 🐟' : 'กระดาษขาดซะก่อน ฮ่าๆ'); }]]],
  ['🥭 ของหวาน & เครื่องดื่ม', () => [['ข้าวเหนียวมะม่วง ฿40', buyFx(40, { food: 30, mood: 12 }, 10, 'หวานมันกำลังดี 🥭')], ['ชาไทยเย็น ฿20', buyFx(20, { energy: 10, mood: 4 }, 5, 'ชาไทยเย็นชื่นใจ 🧋')], ['โรตีกล้วย ฿25', buyFx(25, { food: 20, mood: 8 }, 8, 'โรตีกรอบนอกนุ่มใน 🍌')]]],
  ['📿 ของทำมือ', () => [['กำไลแฮนด์เมด ฿60', () => { if (st.money < 60) return say('เงินไม่พอ'); fx({ money: -60 }); addItem('bracelet'); say('ได้กำไลสวยๆ เอาไว้ให้คนพิเศษ 📿'); }], ['กระทงใบตอง ฿30', () => { if (st.money < 30) return say('เงินไม่พอ'); fx({ money: -30 }); addItem('krathong'); say('ได้กระทงสวยๆ 🪷'); }]]],
];
function drawNightStall(s) {
  drawStall(s, s.i % 2); const t = now() / 500;
  for (let dx = -14; dx <= 14; dx += 7) { const y = s.y - 30 + Math.abs(dx) / 4; R('#3a2a22', s.x + dx, y - 3, 1, 3); R(['#e84a4a', '#ffb04a', '#ffd54a'][((dx + 14) / 7 + (t | 0)) % 3], s.x + dx - 2, y, 5, 5); }
  if (s.i >= 2) drawVendor(s.x + 2, s.y - 2);
}
NIGHT_STALLS.forEach(s => {
  town.statics.push({ k: s.y + 1, f: () => { if (nightMarket()) drawNightStall(s); } });
  town.targets.push({ x: s.x, y: s.y + 8, get name() { return nightMarket() ? `ตลาดกลางคืน: ${NM[s.i][0]}` : 'ลานตลาด'; }, get opts() { return nightMarket() ? NM[s.i][1]() : []; } });
});

// ---- the café is a small bar after dark ----
const barOn = () => { const h = hour(); return h >= 19 || h < 1; };
function barOpts() {
  return [['🍹 ม็อกเทล ฿40', buyFx(40, { mood: 6, energy: 4 }, 15, 'ม็อกเทลผลไม้สดชื่น 🍹')],
    ...(age() >= 18 ? [['🍸 ค็อกเทล ฿80', () => {
      if (st.money < 80) return say('เงินไม่พอ'); st.drinks = (st.drinks || 0) + 1; fx({ money: -80, mood: 10, energy: -4 }); if (typeof stressAdd === 'function') stressAdd(-8); tick(20);
      if (st.drinks >= 3 && typeof addMood === 'function') { addMood('tipsy'); say('มึนนิดๆ แล้ว… พอก่อนดีกว่า 🥴'); } else say('ค็อกเทลหวานซ่า ผ่อนคลายสุดๆ');
    }]] : []),
    ['🎤 ร้องคาราโอเกะ', () => { if (st.karaoke === day()) return say('คืนนี้ร้องไปแล้ว เสียงจะหมดแล้ว!'); startMini('dance', { title: '🎤 คาราโอเกะ' }, s => { st.karaoke = day(); fx({ mood: Math.round(10 + s * 20) }); xp('charm', Math.round(8 + s * 15)); crowdAt('cafe', 1); tick(30); say(s > .7 ? 'ทั้งร้านปรบมือให้! 👏' : 'ร้องเพี้ยนนิดหน่อย แต่สนุกมาก!'); }); }],
    ['🎸 ฟังดนตรีสด', () => { fx({ mood: 10 }); if (typeof stressAdd === 'function') stressAdd(-5); tick(40); say('วงดนตรีเล่นเพลงช้าๆ บรรยากาศดีมาก 🎶'); }]];
}
for (const t of town.targets.filter(t => t.name === 'คาเฟ่')) {
  const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { configurable: true, get() { const o = base.call(t); return barOn() ? [['🌙 บาร์ยามค่ำ 19:00–01:00', () => say('ยามค่ำคาเฟ่กลายเป็นบาร์เล็กๆ มีดนตรีสดและคาราโอเกะ')], ...barOpts(), ...o.filter(([l]) => /งาน|กะ/.test(l))] : o; } });
}

// ---- stargazing on the park bench ----
{ const sp = spotFor('bench', 0); town.targets.push({ x: sp.x, y: sp.y, name: 'ม้านั่งในสวน', get opts() {
  const h = hour(); if (!(h >= 20 || h < 4) || wet() || ['cloud', 'fog'].includes(weatherOf())) return [];
  return [['🌌 นอนดูดาว', () => { tick(40); fx({ mood: 12 }); xp('art', 8); if (typeof stressAdd === 'function') stressAdd(-6);
    if (Math.random() < .2) { fx({ mood: 15 }); toast('🌠 ดาวตก! คุณรีบอธิษฐาน…'); townNews(`🌠 มีคนเห็นดาวตกเหนือสวนสาธารณะคืนนี้`); } else say('ดาวเต็มฟ้า… ใจสงบขึ้นเยอะ ✨'); }]];
} }); }

// ---- weekly events (0 = Monday) ----
const WEEKLY = {
  2: { id: 'quiz', n: 'ควิซไนท์ที่ห้องสมุด', ic: '🧠', from: 19, to: 22, place: 'library' },
  4: { id: 'movie', n: 'คืนหนังกลางแปลง', ic: '🎬', from: 19, to: 23, place: 'plaza' },
  5: { id: 'farm', n: 'ตลาดนัดเกษตรกร', ic: '🥕', from: 8, to: 12, place: 'plaza' },
  6: { id: 'concert', n: 'คอนเสิร์ตในสวน', ic: '🎶', from: 17, to: 21, place: 'park' },
};
var weeklyEvent = () => { const E = WEEKLY[weekday()], h = hour(); return E && !festival() && h >= E.from - .5 && h < E.to ? E : null; };
const evOn = id => { const E = weeklyEvent(); return E && E.id === id && hour() >= E.from; };
function sellCrops() {
  const ids = Object.keys(st.inv).filter(id => ITEMS[id]?.k === 'crop'); if (!ids.length) return say('ไม่มีผลผลิตจากสวนให้ขาย — ลองปลูกผักที่บ้านดูสิ');
  let total = 0; for (const id of ids) { total += Math.round((ITEMS[id].sell || 20) * 1.3) * have(id); addItem(id, -have(id)); }
  fx({ money: total, mood: 6 }); xp('garden', 6); tick(20); say(`ขายผลผลิตได้ ฿${total} (ราคาพิเศษ +30%) 🥕`);
}
const EV_OPTS = {
  quiz: () => [['🧠 แข่งควิซ ฿20', () => { if (st.quizDay === day()) return say('คืนนี้แข่งไปแล้ว'); if (st.money < 20) return say('เงินไม่พอ'); st.money -= 20; st.quizDay = day();
    startMini('quiz', { n: 5, title: '🧠 ควิซไนท์' }, s => { const prize = Math.round(s * 300); st.money += prize; xp('logic', Math.round(10 + s * 20)); fx({ mood: Math.round(8 + s * 10) }); tick(60); say(`ได้คะแนน ${Math.round(s * 100)}%${prize ? ` ได้รางวัล ฿${prize} 🏆` : ''}`); }); }]],
  movie: () => [['🎬 ดูหนังกลางแปลง', () => { if (st.movieDay === day()) return say('คืนนี้ดูไปแล้ว'); st.movieDay = day(); fade(() => { tick(100); fx({ mood: 18 }); if (typeof stressAdd === 'function') stressAdd(-8); const pt = st.spouse || st.partner; if (pt) relOf(pt).f = Math.min(100, relOf(pt).f + 4); crowdAt('plaza', 1); say(pt ? `ดูหนังกับ${nameOf(pt)} โรแมนติกมาก 💕` : 'หนังสนุกมาก ทั้งลานหัวเราะพร้อมกัน 🍿'); }, 600); }],
    ['🍿 ป๊อปคอร์น ฿25', buyFx(25, { food: 15, mood: 6 }, 5, 'ป๊อปคอร์นหอมกรุ่น 🍿')]],
  farm: () => [['🥕 ขายผลผลิต (ราคาพิเศษ +30%)', sellCrops], ['🍯 น้ำผึ้งป่า ฿40', buyFx(40, { food: 10, mood: 6, energy: 8 }, 5, 'น้ำผึ้งแท้จากสวน หวานหอม 🍯')], ['🥬 ผักออร์แกนิก ฿15', () => { if (st.money < 15) return say('เงินไม่พอ'); fx({ money: -15 }); addItem('veg'); say('ผักสดจากไร่ 🥬'); }]],
  concert: () => [['🎶 ฟังคอนเสิร์ต', () => { fx({ mood: 15 }); if (typeof stressAdd === 'function') stressAdd(-6); crowdAt('park', 1); tick(40); say('เสียงเพลงลอยไปทั่วสวน ทุกคนโยกตามจังหวะ 🎶'); }],
    ['💃 เต้นหน้าเวที', () => startMini('dance', { title: '💃 เต้นหน้าเวที' }, s => { fx({ mood: Math.round(10 + s * 15), energy: -8 }); xp('fit', 8); xp('charm', Math.round(5 + s * 10)); tick(30); say(s > .7 ? 'เต้นจนคนหันมามอง! 🔥' : 'เต้นสนุกจนเหงื่อท่วม'); })]],
};
for (const [w, E] of Object.entries(WEEKLY)) { const sp = spotFor(E.place, 6 + +w); town.targets.push({ x: sp.x, y: sp.y, name: `${E.ic} ${E.n}`, get opts() { return evOn(E.id) ? EV_OPTS[E.id]() : []; } }); }
town.statics.push({ k: 7 * T + 30, f() {     // movie screen and farmers' crates at the plaza
  const t = now() / 1000;
  if (evOn('movie')) { const x = 20 * T + 16, y = 6 * T + 30; R('#3a2a22', x - 36, y - 52, 3, 52); R('#3a2a22', x + 33, y - 52, 3, 52); R('#f4f4f0', x - 33, y - 50, 66, 36);
    R(['#6a8ad8', '#e8a04a', '#5ab06a', '#c85a8a'][(t / 2 | 0) % 4], x - 30, y - 47, 60, 30); R('#fff8', x - 30 + ((t * 20) % 50), y - 40, 8, 14); }
  if (evOn('farm')) for (let i = 0; i < 4; i++) { const x = (18 + i) * T + 10, y = 8 * T + 20; R('#8a5a34', x, y - 10, 18, 10); R('#a8744a', x, y - 10, 18, 2); for (let k = 0; k < 4; k++) R(['#e8742a', '#5ab05a', '#e84a4a', '#ffd54a'][(i + k) % 4], x + 2 + k * 4, y - 13, 3, 3); }
} });
town.statics.push({ k: 21 * T + 30, f() {    // concert stage in the park
  if (!evOn('concert')) return; const x = 13 * T + 16, y = 21 * T + 20, t = now() / 1000;
  R('#5a3a24', x - 40, y - 12, 80, 12); R('#7a5a3a', x - 40, y - 12, 80, 3); R('#2a2a38', x - 44, y - 40, 8, 28); R('#2a2a38', x + 36, y - 40, 8, 28);
  for (let i = 0; i < 5; i++) R(['#e84a4a', '#ffd54a', '#5ac8e8', '#c84ae8', '#5ae86a'][(i + (t * 3 | 0)) % 5], x - 34 + i * 16, y - 46, 6, 4);
  drawMusic(x - 12, y - 12); drawMusic(x + 14, y - 12);
} });

// ---- four more festivals ----
Object.assign(FESTIVALS, { '0:2': { id: 'valentine', n: 'วันวาเลนไทน์', ic: '💝' }, '1:3': { id: 'musicfest', n: 'เทศกาลดนตรีฤดูร้อน', ic: '🎸' }, '2:3': { id: 'loy', n: 'ลอยกระทง', ic: '🪷' }, '3:3': { id: 'xmas', n: 'คริสต์มาส', ic: '🎄' } });
const bandTee = () => typeof FX_ID !== 'undefined' && FX_ID['เสื้อวงดนตรี'];
Object.assign(FEST_ACTS, {
  valentine: () => [['ซื้อกุหลาบ ฿30 🌹', festAct('rose', 30, () => { addItem('flower'); fx({ mood: 6 }); say('ได้กุหลาบแดงสวยๆ เอาไว้ให้คนพิเศษ 🌹'); })],
    ['เดทวันวาเลนไทน์ 💕', festAct('date', 0, () => { const pt = st.spouse || st.partner; if (!pt) { fx({ mood: 4 }); return say('ยังไม่มีแฟน… ไม่เป็นไร รักตัวเองก่อน 💪'); } relOf(pt).f = Math.min(100, relOf(pt).f + 10); fx({ mood: 25 }); tick(90); say(`เดทวาเลนไทน์กับ${nameOf(pt)} หวานที่สุดในปี 💕`); })],
    ['แจกช็อกโกแลตให้เพื่อน ฿40 🍫', festAct('choco', 40, () => { crowdBond(3); fx({ mood: 10 }); tick(30); say('ทุกคนยิ้มรับช็อกโกแลต 🍫'); })],
    ['เขียนการ์ดบอกรัก 💌', festAct('card', 0, () => { addItem('wishcard'); fx({ mood: 8 }); tick(20); say('เขียนการ์ดเสร็จแล้ว 💌'); })]],
  musicfest: () => [['ดูวงดนตรีบนเวที 🎸', festAct('show', 0, () => { fx({ mood: 20 }); crowdBond(2); tick(60); say('เสียงกีตาร์ดังสนั่น ทั้งลานกระโดดตามจังหวะ! 🤘'); })],
    ['ประกวดร้องเพลง 🎤', festAct('sing', 0, () => startMini('dance', { title: '🎤 ประกวดร้องเพลง' }, s => { const prize = s > .8 ? 500 : s > .6 ? 200 : 0; fx({ mood: 15, money: prize }); xp('charm', 20); say(prize ? `ได้รางวัล ฿${prize}! 🏆` : 'ร้องได้ดี แต่ยังไม่ติดอันดับ'); }))],
    ['ซื้อเสื้อวง ฿150 👕', festAct('tee', 150, () => { const id = bandTee(); if (id) { (st.owned || (st.owned = {}))[id] = 1; say('ได้เสื้อวงแล้ว! ใส่ได้ที่ตู้เสื้อผ้า 👕'); } else say('ได้เสื้อวงเป็นที่ระลึก'); })],
    ['เต้นหน้าเวที 💃', festAct('dance', 0, () => { fx({ mood: 15, energy: -10 }); xp('fit', 10); crowdBond(1); tick(40); say('เต้นจนเหงื่อท่วม สนุกสุดๆ!'); })]],
  loy: () => [['ซื้อกระทง ฿30 🪷', festAct('buy', 30, () => { addItem('krathong'); say('ได้กระทงแล้ว เอาไปลอยที่สะพานริมแม่น้ำนะ 🪷'); })],
    ['ประดิษฐ์กระทงเอง 🍃', festAct('craft', 0, () => { addItem('krathong'); xp('art', 15); tick(40); say('ทำกระทงใบตองเองสวยมาก! 🍃'); })],
    ['ชมประกวดนางนพมาศ 👑', festAct('show', 0, () => { fx({ mood: 15 }); crowdBond(2); tick(40); say('ชุดไทยสวยงามมาก ทุกคนปรบมือ 👏'); })],
    ['จุดเทียนอธิษฐาน 🕯️', festAct('wish', 0, () => { fx({ mood: 12 }); if (typeof stressAdd === 'function') stressAdd(-10); tick(20); say('อธิษฐานขอให้ปีหน้าดีกว่าเดิม 🕯️'); })]],
  xmas: () => [['แลกของขวัญ 🎁', festAct('swap', 0, () => { const g = ['plush', 'choco', 'book', 'kite', 'puzzle'].filter(id => ITEMS[id]); addItem(g[ri(g.length)]); crowdBond(2); fx({ mood: 15 }); say('ได้ของขวัญเซอร์ไพรส์! 🎁'); })],
    ['ร้องเพลงคริสต์มาส 🎶', festAct('carol', 0, () => { fx({ mood: 15 }); crowdBond(2); tick(30); say('Jingle bells~ ทุกคนร้องพร้อมกัน 🎶'); })],
    ['ประดับต้นคริสต์มาส 🎄', festAct('tree', 0, () => { xp('art', 15); fx({ mood: 10 }); tick(30); say('ต้นคริสต์มาสสวยขึ้นเยอะ ✨'); })],
    ...(age() < 13 ? [['รับของขวัญจากซานต้า 🎅', festAct('santa', 0, () => { addItem('robot'); fx({ mood: 30 }); say('ซานต้าให้หุ่นยนต์ของเล่น! 🤖'); })]] : [])],
});
// floating krathongs on the river; yours joins them
const KR = [];
const krathongs = () => {
  if (festival()?.id !== 'loy' || hour() < 17) return [];
  const t = now() / 1000, W = town.W * T, out = [];
  for (let i = 0; i < 14; i++) out.push({ x: ((i * 173 + t * (6 + i % 3)) % (W + 40)) - 20, y: (33 + i % 3) * T + 14 + Math.sin(t + i) * 2, c: i % 3 });
  for (const k of KR) out.push({ x: Math.min(W + 30, k.x + (now() - k.at) / 1000 * 7), y: k.y, c: 3 });
  return out;
};
function drawKrathong(k) {
  const x = Math.round(k.x), y = Math.round(k.y), fl = (now() / 120 | 0) % 2;
  R('#2f7d3a', x - 7, y - 2, 14, 4); R('#4aa84e', x - 6, y - 3, 12, 2);
  for (const dx of [-5, -2, 1, 4]) R(['#f080b0', '#ffd54a', '#ff9ad0', '#fff4f8'][k.c], x + dx, y - 6, 2, 3);
  R('#fff4d8', x - 1, y - 11, 2, 5); R(fl ? '#ffb04a' : '#ffe08a', x - 1, y - 13, 2, 2);
}
town.statics.push({ k: 33 * T, f: () => { for (const k of krathongs()) drawKrathong(k); } });
for (const t of town.targets.filter(t => t.name === 'สะพานข้ามแม่น้ำ')) {
  const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { configurable: true, get() { const o = base.call(t); return festival()?.id === 'loy' && hour() >= 17 ? [['🪷 ลอยกระทง', () => {
    if (!have('krathong')) return say('ต้องมีกระทงก่อน — ซื้อหรือทำได้ที่ลานเมือง');
    addItem('krathong', -1); KR.push({ x: t.x, y: 33 * T + 14, at: now() }); fx({ mood: 25 }); xp('charm', 10); if (typeof stressAdd === 'function') stressAdd(-12); tick(20);
    const pt = st.spouse || st.partner; if (pt) relOf(pt).f = Math.min(100, relOf(pt).f + 5); say(pt ? `ลอยกระทงคู่กับ${nameOf(pt)} ขอให้รักกันนานๆ 🪷💕` : 'ลอยกระทงแล้ว ขอให้สิ่งไม่ดีลอยไปกับสายน้ำ 🪷');
  }], ...o] : o; } });
}
town.statics.push({ k: 8 * T + 30, f() {     // plaza decorations: Christmas tree, Valentine hearts, festival stage
  const f = festOn(); if (!f) return; const t = now() / 1000;
  if (f.id === 'xmas') { const x = 21 * T + 24, y = 8 * T + 26; R('#5a3a24', x - 3, y - 8, 6, 8);
    for (let r = 0; r < 6; r++) R(r % 2 ? '#2f7d3a' : '#3f9a46', x - 6 - r * 3, y - 14 - (5 - r) * 7, 12 + r * 6, 8);
    R('#ffd54a', x - 3, y - 62, 6, 6); for (let i = 0; i < 12; i++) if ((i + (t * 2 | 0)) % 3) R(['#e84a4a', '#5ac8e8', '#ffd54a'][i % 3], x - 16 + (i * 7) % 32, y - 52 + (i * 11) % 42, 2, 2); }
  if (f.id === 'valentine') for (let i = 0; i < 5; i++) { const x = 18 * T + i * 40, y = 8 * T + 4 + Math.sin(t * 2 + i) * 3; R('#3a2a22', x + 3, y + 6, 1, 14); R('#e84a6a', x, y, 3, 3); R('#e84a6a', x + 4, y, 3, 3); R('#e84a6a', x, y + 2, 7, 3); R('#e84a6a', x + 2, y + 5, 3, 1); }
  if (f.id === 'musicfest') { const x = 23 * T, y = 8 * T + 20; R('#4a3a5a', x - 44, y - 12, 88, 12); R('#2a2a38', x - 48, y - 46, 8, 34); R('#2a2a38', x + 40, y - 46, 8, 34); for (let i = 0; i < 6; i++) R(['#e84a4a', '#ffd54a', '#5ac8e8'][(i + (t * 4 | 0)) % 3], x - 40 + i * 15, y - 52, 6, 4); drawMusic(x - 10, y - 12); drawMusic(x + 14, y - 12); }
} });

// ---- police: two officers patrol (one on nights); crimes raise a wanted level and they will come for you ----
const WANT = () => st.wanted || (st.wanted = { lv: 0, day: 0, why: '' });
let cops = [], thief = null, THIEF_SPR = null;
const COP_NAMES = ['ผู้หมวดนารี', 'จ่าสมชาย'];
function makeCops() {
  cops = [0, 1].map(i => { const a = CHARS[(i + 1) % CHARS.length], sp = spotFor('plaza', 30 + i * 7);
    return { id: 'cop' + i, n: COP_NAMES[i], x: sp.x, y: sp.y, dir: 0, frame: 0, at: 0, path: null, wait: 1 + i, cop: 1,
      spr: sheet({ ...a, style: i ? 'short' : 'bob', clip: 0, skirt: 0, c: '#2a3a6a', C: '#1a2448', a: '#e8c060', p: '#1e2238', f: '#2a2a38', topS: 'uniform', hatS: 'cap', hatC: '#1e2a5a', bust: !i }) }; });
}
const _startNL = start; start = s => { _startNL(s); makeCops(); };
var townExtras = () => [...cops.filter(c => !c.off), ...(thief ? [thief] : [])];
const copNear = r => cops.some(c => !c.off && Math.hypot(c.x - player.x, c.y - player.y) < r);
const clampX = x => Math.max(40, Math.min(town.W * T - 40, x)), clampY = y => Math.max(40, Math.min(town.H * T - 40, y));
function walkTo(e, tx, ty, sp, dt) {
  tx = clampX(tx); ty = clampY(ty); e.repath = (e.repath || 0) - dt;
  if (!e.path || e.repath <= 0 || !e.goal || Math.hypot(e.goal.x - tx, e.goal.y - ty) > 48) { e.path = findPath(e.x, e.y, tx, ty) || []; e.goal = { x: tx, y: ty }; e.repath = 1.2; }
  const w = e.path[0] || { x: tx, y: ty }, dx = w.x - e.x, dy = w.y - e.y, d = Math.hypot(dx, dy);
  if (d < 3) { if (e.path.length) { e.path.shift(); return false; } animate(e, false, dt); return true; }
  const s = Math.min(d, sp * dt); move(town, e, dx / d * s, 0); move(town, e, 0, dy / d * s);
  e.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); animate(e, true, dt); return false;
}
function pickPatrol(c) {
  for (let k = 0; k < 30; k++) { const tx = Math.floor(c.x / T + (Math.random() - .5) * 20), ty = Math.floor(c.y / T + (Math.random() - .5) * 16), i = ty * town.W + tx;
    if (tx > 0 && ty > 0 && tx < town.W - 1 && ty < town.H - 1 && town.tile[i] === 2 && !town.solid[i]) return { x: tx * T + 16, y: ty * T + 24 }; }
  return spotFor('plaza', 30);
}
function crime(why, lv = 1) { const w = WANT(); w.lv = Math.min(3, w.lv + lv); w.why = why; w.day = day(); toast(`🚨 ${why} — ตำรวจตามตัว ${'⭐'.repeat(w.lv)}`); }
const fineOf = () => Math.round(150 * Math.max(1, WANT().lv) * (st.infl || 1));
const clearWanted = () => { const w = WANT(); w.lv = 0; w.why = ''; };
function jail(why) {
  fade(() => { st.min = nextHour(8); const b = bld('hall'); enter(town, b.ix, b.iy + 30, 0); fx({ mood: -20 }); if (typeof addMood === 'function') addMood('shame'); clearWanted();
    townNews(`👮 ${st.name} ถูกกักตัวที่สถานีตำรวจ 1 คืน`); say(`${why ? why + ' — ' : ''}ถูกกักตัวทั้งคืน… ได้ออกมาตอนเช้า 08:00`); }, 700);
}
function arrest(c, surrender) {
  if (busy || menuOpen || panelOpen || (c && now() < (c.arrestAt || 0))) return; if (c) c.arrestAt = now() + 5000;
  const fine = fineOf();
  openMenu(surrender ? '🙇 มอบตัวกับตำรวจ' : `👮 ${c ? c.n : 'ตำรวจ'}: "หยุดนะ! คุณถูกจับ"`, [
    [`จ่ายค่าปรับ ฿${fine}`, () => { if (st.money < fine) return jail('เงินไม่พอจ่ายค่าปรับ'); st.money -= fine; clearWanted(); fx({ mood: -6 }); say('จ่ายค่าปรับแล้ว ครั้งหน้าอย่าทำอีกนะ'); save(); }],
    ['ยอมถูกกักตัว 1 คืน', () => jail()]]);
}
function catchThief(c) {
  if (!thief) return; if (thief.loot) { st.money += thief.loot; toast(`👮 ${c.n} จับขโมยได้! ได้เงินคืน ฿${thief.loot}`); } else toast(`👮 ${c.n} จับคนน่าสงสัยได้ในย่านตลาด`);
  thief = null; c.alert = false;
}
const tipLine = () => { const E = WEEKLY[weekday()], f = festival(), h = hour();
  return f ? `วันนี้มี${f.n} ไปเที่ยวได้เลย แต่ระวังกระเป๋าด้วยนะ` : E && h < E.to ? `วันนี้มี${E.n} ${E.from}:00–${E.to}:00` : h >= 20 || h < 5 ? 'ดึกแล้ว ระวังพวกล้วงกระเป๋าแถวตลาดด้วยนะ' : 'ถ้าเห็นคนน่าสงสัยมาแจ้งได้เลย'; };
function copOpts(c) {
  const o = [], h = hour();
  if (WANT().lv) o.push([`🙇 มอบตัว (ค่าปรับ ฿${fineOf()})`, () => arrest(null, true)]);
  if (thief) o.push(['🚨 แจ้งว่ามีขโมย!', () => { c.alert = true; say(`${c.n}: "รับทราบ! เดี๋ยวจัดการเอง"`); }]);
  o.push(['👋 ทักทาย', () => { c.dir = faceTo(c, player); if (st.copHi !== day()) { st.copHi = day(); fx({ mood: 2 }); } say(`${c.n}: "${h >= 20 || h < 6 ? 'ดึกแล้ว กลับบ้านปลอดภัยนะ' : 'สวัสดี! วันนี้เมืองสงบดี'}"`); }],
    ['💡 ถามเรื่องในเมือง', () => say(`${c.n}: "${tipLine()}"`)]);
  return o;
}
[0, 1].forEach(i => town.targets.push({ get x() { return cops[i] && !cops[i].off ? cops[i].x : -9999; }, get y() { return cops[i] && !cops[i].off ? cops[i].y : -9999; },
  get name() { return `👮 ${COP_NAMES[i]}`; }, get opts() { return cops[i] && !cops[i].off ? copOpts(cops[i]) : []; } }));
function copsUpdate(dt) {
  const h = hour(), want = WANT().lv;
  cops.forEach((c, i) => {
    c.off = i === 1 && (h >= 23 || h < 6); if (c.off) return;
    if (thief && (c.alert || Math.hypot(thief.x - c.x, thief.y - c.y) < 160)) { if (Math.hypot(thief.x - c.x, thief.y - c.y) < 18) catchThief(c); else walkTo(c, thief.x, thief.y, 82, dt); return; }
    const pd = Math.hypot(player.x - c.x, player.y - c.y);
    if (want && scene === town && pd < 320 && !busy && !menuOpen && !panelOpen) { if (pd < 20) arrest(c); else walkTo(c, player.x, player.y, 78, dt); return; }
    if (c.wait > 0) { c.wait -= dt; animate(c, false, dt); if (scene === town && pd < 50) c.dir = faceTo(c, player); return; }
    if (!c.patrol) c.patrol = pickPatrol(c);
    if (walkTo(c, c.patrol.x, c.patrol.y, 38, dt)) { c.patrol = null; c.wait = 2 + Math.random() * 4; }
  });
}
// shoplifting at the mart, and hitting people in front of an officer, are crimes
for (const t of town.targets.filter(t => t.name === 'มินิมาร์ท')) {
  const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { configurable: true, get() { const o = base.call(t); return shopOpen('mart') ? [...o, ['🤫 แอบหยิบของ', shoplift]] : o; } });
}
function shoplift() {
  const id = MART_STOCK[ri(MART_STOCK.length)], I = ITEMS[id], s = staffOf('mart')[0], risk = .3 + (copNear(240) ? .4 : 0) - lv('charm') * .02;
  tick(5);
  if (Math.random() < risk) {
    const fine = I.p * 3; st.money = Math.max(0, st.money - fine);
    if (s) { const r = relOf(s.id); r.h = Math.min(100, (r.h || 0) + 15); if (typeof remember === 'function') remember(s.id, 'theft', -2, 'ขโมยของในร้าน'); }
    fx({ mood: -10 }); crime('ขโมยของในมินิมาร์ท', 1); say(`โดนจับได้คาหนังคาเขา! ${s ? s.n + ' ' : ''}ปรับ ฿${fine} และแจ้งตำรวจแล้ว`);
  } else { addItem(id); fx({ mood: -3 }); if (typeof stressAdd === 'function') stressAdd(8); say(`หยิบ${I.n}ออกมาได้… ใจเต้นแรงมาก 😰`); if (Math.random() < .25) crime('กล้องวงจรปิดจับภาพคนขโมยของได้', 1); }
}
for (const a of ACTS16) if (a[0] === 'slap' || a[0] === 'push') { const f = a[4]; a[4] = p => { f(p); if (copNear(260)) crime(a[0] === 'slap' ? 'ทำร้ายร่างกาย (ตบ)' : 'ทำร้ายร่างกาย (ผลัก)', 1); }; }

// ---- night pickpockets ----
function spawnThief() {
  THIEF_SPR = THIEF_SPR || sheet({ ...CHARS[3 % CHARS.length], style: 'short', clip: 0, skirt: 0, c: '#24242c', C: '#121218', a: '#3a3a48', p: '#1e1e26', f: '#14141e', topS: 'hoodie', accS: 'mask', accC: '#3a3a48' });
  for (let k = 0; k < 20; k++) { const an = Math.random() * 6.283, x = player.x + Math.cos(an) * 170, y = player.y + Math.sin(an) * 120;
    if (x < 40 || y < 40 || x > town.W * T - 40 || y > town.H * T - 40 || blocked(town, x, y)) continue;
    thief = { x, y, dir: 0, frame: 0, at: 0, mode: 'sneak', t: 0, loot: 0, spr: THIEF_SPR }; return; }
}
function thiefUpdate(dt) {
  if (!thief) { const h = hour(); if (scene === town && (h >= 21 || h < 4) && !overlayOpen() && st.money > 60 && !copNear(320) && Math.random() < dt * .005 * (typeof nightRiskMul === 'function' ? nightRiskMul() : 1)) spawnThief(); return; }
  thief.t += dt; if (scene !== town || thief.t > 45) { if (thief.loot) townNews(`🦹 ขโมยหนีไปได้พร้อมเงิน ฿${thief.loot}`); thief = null; return; }
  if (thief.mode === 'sneak') {
    if (Math.hypot(player.x - thief.x, player.y - thief.y) < 16 && !busy && !menuOpen && !panelOpen) { const loot = Math.min(st.money, 40 + ri(120)); st.money -= loot; thief.loot = loot; thief.mode = 'flee'; thief.t = 30; toast(`🦹 โดนล้วงกระเป๋า! เสีย ฿${loot} — รีบตามจับหรือแจ้งตำรวจ!`); }
    else walkTo(thief, player.x, player.y, 46, dt);
  } else walkTo(thief, thief.x + (thief.x - player.x) * 2, thief.y + (thief.y - player.y) * 2, 72, dt);
}
town.targets.push({ get x() { return thief ? thief.x : -9999; }, get y() { return thief ? thief.y : -9999; }, name: '🦹 คนน่าสงสัย', get opts() { return thief ? [['✊ จับตัวไว้!', tryCatch]] : []; } });
function tryCatch() {
  if (!thief) return;
  if (Math.random() < .35 + lv('fit') * .08) {
    st.money += thief.loot + 100; xp('fit', 10); fx({ mood: 15 }); toast(`🦸 จับขโมยได้! ได้เงินคืน${thief.loot ? ` ฿${thief.loot}` : ''} + รางวัลจากตำรวจ ฿100`); townNews(`🦸 ${st.name} จับขโมยได้กลางเมือง! ชาวเมืองชื่นชม`);
    for (const p of people) if (!p.hidden && Math.hypot(p.x - player.x, p.y - player.y) < 220) relOf(p.id).f = Math.min(100, relOf(p.id).f + 3);
    thief = null;
  } else { say('มันสะบัดหลุด! วิ่งหนีไปแล้ว'); thief.mode = 'flee'; thief.t = Math.max(thief.t, 30); fx({ mood: -4 }); }
}

// ---- hooks: per frame, daily, HUD ----
const _updNL = update;
update = dt => { _updNL(dt); if (!player || !cops.length) return; const paused = menuOpen || panelOpen || busy || mg; if (!paused) { copsUpdate(dt); thiefUpdate(dt); } };
const _sTNL = seasonTick;
seasonTick = () => {
  _sTNL(); if (!player || st.nlDay === day()) return; st.nlDay = day(); st.drinks = 0;
  const w = WANT(); if (w.lv && day() > w.day) { w.lv--; w.day = day(); if (!w.lv) toast('😮‍💨 ตำรวจเลิกตามตัวคุณแล้ว'); }
  const E = WEEKLY[weekday()]; if (E && !festival()) setTimeout(() => toast(`${E.ic} วันนี้มี${E.n} ${E.from}:00–${E.to}:00`), 1500);
};
const _hudNL = drawHud;
drawHud = () => { _hudNL(); const w = st.wanted?.lv, d = hud.querySelector('.details'); if (w && d) d.insertAdjacentHTML('beforeend', `<div class="row" style="font-size:12px;color:#ff9a9a"><span>🚨 ตำรวจตามตัว</span><span>${'⭐'.repeat(w)}</span></div>`); };

// ---- weather & light ----
WX_ODDS[2] = [['sun', .38], ['cloud', .27], ['fog', .1], ['rain', .25]]; WX_ODDS[3] = [['sun', .3], ['cloud', .2], ['fog', .1], ['snow', .4]];
WX_ICON.fog = '🌫️'; WXN.fog = 'หมอกลง';
overlayFx = sc => {
  g = ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (sc !== town) return;
  const w = weatherOf(), si = seasonOf().i, t = now() / 1000, h = hour(), dk = darkness(h), cx = cam.x, cy = cam.y;
  if (h >= 5 && h < 7) R(`rgba(255,150,170,${(.13 * (1 - Math.abs(h - 6))).toFixed(3)})`, 0, 0, VW, VH);   // dawn
  if (si === 2) R('rgba(255,150,40,.06)', 0, 0, VW, VH); if (si === 3) R('rgba(215,230,255,.10)', 0, 0, VW, VH);
  if ((w === 'sun' || w === 'cloud') && dk < .2) for (let i = 0; i < (w === 'cloud' ? 5 : 3); i++) {   // cloud shadows drift over the town
    const x = ((i * 331 + t * 10) % (VW + 360)) - 180, y = (i * 197 + 40) % VH, gr = ctx.createRadialGradient(x, y, 10, x, y, 120);
    gr.addColorStop(0, 'rgba(20,30,60,.13)'); gr.addColorStop(1, 'rgba(20,30,60,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 120, y - 120, 240, 240);
  }
  if (w === 'sun' && h >= 6.5 && h < 10) { ctx.fillStyle = 'rgba(255,240,190,.06)'; for (let i = 0; i < 4; i++) { const x0 = (i * VW / 3.2 + t * 4) % (VW + 200) - 100; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 40, 0); ctx.lineTo(x0 - 60, VH); ctx.lineTo(x0 - 130, VH); ctx.fill(); } }
  if (w === 'cloud' || w === 'rain' || w === 'storm') R(w === 'storm' ? 'rgba(20,24,50,.32)' : w === 'rain' ? 'rgba(50,60,95,.18)' : 'rgba(60,70,100,.10)', 0, 0, VW, VH);
  if (w === 'rain' || w === 'storm') {
    ctx.strokeStyle = 'rgba(190,212,255,.6)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < (w === 'storm' ? 220 : 120); i++) { const x = ((i * 97) % (VW + 40) + t * 140) % (VW + 40) - 20, y = ((i * 61) % VH + t * 430) % VH; ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 9); }
    ctx.stroke();
    for (let i = 0; i < 26; i++) { const k = Math.floor(t * 2.2 + i * .37), ph = (t * 2.2 + i * .37) % 1, x = hash01(k * 3.1 + i) * VW, y = hash01(k * 7.7 + i) * VH;
      ctx.strokeStyle = `rgba(210,225,255,${(.55 * (1 - ph)).toFixed(2)})`; ctx.beginPath(); ctx.ellipse(x, y, 1 + ph * 5, .5 + ph * 2, 0, 0, 6.283); ctx.stroke(); }
  }
  if (w === 'storm') { const ph = t % 7; if (ph < .3) { R(`rgba(255,255,255,${(.4 * (1 - ph / .3)).toFixed(2)})`, 0, 0, VW, VH); const k = Math.floor(t / 7); let x = hash01(k) * VW, y = 0;
    ctx.strokeStyle = 'rgba(255,255,240,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); while (y < VH * .6) { x += (hash01(k * 13 + y) - .5) * 30; y += 14 + hash01(y + k) * 10; ctx.lineTo(x, y); } ctx.stroke(); ctx.lineWidth = 1; } }
  if (w === 'fog') { const fogNight = dk > .3, fogCol = fogNight ? '120,132,158' : '230,235,240';
    R(fogNight ? `rgba(52,60,82,${(.12 + dk * .16).toFixed(2)})` : 'rgba(215,220,230,.22)', 0, 0, VW, VH);
    for (let i = 0; i < 4; i++) { const y = (i * VH / 4 + t * 6) % (VH + 60) - 30, gr = ctx.createLinearGradient(0, y - 30, 0, y + 30);
      gr.addColorStop(0, `rgba(${fogCol},0)`); gr.addColorStop(.5, `rgba(${fogCol},${fogNight ? .18 : .25})`); gr.addColorStop(1, `rgba(${fogCol},0)`); ctx.fillStyle = gr; ctx.fillRect(0, y - 30, VW, 60); } }
  if (w === 'snow' || si === 3) for (let i = 0; i < (w === 'snow' ? 120 : 45); i++) { const s = 1 + (i % 3), x = (((i * 83) % VW + Math.sin(t * .8 + i) * 14 + t * 8 * s) % VW + VW) % VW, y = ((i * 47) % VH + t * (18 + s * 10)) % VH; R(i % 5 ? '#fff' : '#e0ecff', x | 0, y | 0, s, s); }
  if (si === 2 && !wet()) for (let i = 0; i < 22; i++) R(i % 2 ? '#e8802a' : '#f0b84a', ((i * 71) % VW + t * 22) % VW | 0, ((i * 53) % VH + t * 38 + Math.sin(t * 2 + i) * 6) % VH | 0, 3, 2);
  if (si === 0 && w === 'sun') for (let i = 0; i < 16; i++) R('#ffc8dc', ((i * 67) % VW + t * 14) % VW | 0, ((i * 59) % VH + t * 24) % VH | 0, 2, 2);
  if (dk > .15) {                                                 // night: lantern and candle glow, fireflies, a soft vignette
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x, y, r, a, col = '255,200,110') => { const X = x - cx, Y = y - cy; if (X < -r || Y < -r || X > VW + r || Y > VH + r) return; const gr = ctx.createRadialGradient(X, Y, 0, X, Y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = gr; ctx.fillRect(X - r, Y - r, r * 2, r * 2); };
    if (nightMarket()) for (const s of NIGHT_STALLS) glow(s.x, s.y - 28, 46, .4);
    for (const k of krathongs()) glow(k.x, k.y - 10, 22, .55);
    if (si <= 1 && !wet()) for (let i = 0; i < 18; i++) {
      const bx = (i < 10 ? 13 : 14) * T + ((i * 53) % 140) - 50 + Math.sin(t * .7 + i) * 18, by = (i < 10 ? 22 : 26) * T + ((i * 37) % 70) - 30 + Math.cos(t * .9 + i * 2) * 10;
      if (Math.sin(t * 2.3 + i * 1.7) > .2) { glow(bx, by, 7, .7, '220,255,120'); R('#f8ffb0', bx - cx | 0, by - cy | 0, 1, 1); }
    }
    ctx.globalCompositeOperation = 'source-over';
    const vg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .35, VW / 2, VH / 2, Math.max(VW, VH) * .75);
    vg.addColorStop(0, 'rgba(5,5,25,0)'); vg.addColorStop(1, `rgba(5,5,25,${(dk * .6).toFixed(2)})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  }
  const f = festOn();
  if (f?.id === 'newyear' && h >= 21) for (let b = 0; b < 3; b++) {
    const k = Math.floor(t / 1.6) * 3 + b, ph = (t % 1.6) / 1.6, fx0 = hash01(k) * VW, fy0 = 20 + hash01(k + 9) * VH * .35, col = ['255,120,120', '255,220,90', '120,200,255', '200,120,255'][k % 4];
    for (let a = 0; a < 14; a++) { const an = a / 14 * Math.PI * 2; R(`rgba(${col},${1 - ph})`, fx0 + Math.cos(an) * ph * 46 | 0, fy0 + Math.sin(an) * ph * 46 + ph * ph * 22 | 0, 2, 2); }
  }
};
console.assert(NIGHT_STALLS.length >= 2 && NIGHT_STALLS.every(s => NM[s.i]), 'night market stalls');
console.assert(Object.values(WEEKLY).every(E => EV_OPTS[E.id] && ANCHORS[E.place]), 'weekly events');
console.assert(['valentine', 'musicfest', 'loy', 'xmas'].every(id => FEST_ACTS[id]), 'festival activities');
