'use strict';
// Collecting (12 fish, 8 bugs, 6 fossils, paintings), the museum with milestone rewards, and seasonal sports contests.
const FISHES = [['minnow', 'ปลาซิว', 60, [0, 1, 2, 3], 15, '🐟'], ['carp', 'ปลาไน', 30, [0, 1, 2, 3], 40, '🐟'], ['sardine', 'ปลาซาร์ดีน', 30, [0], 25, '🐟'], ['trout', 'ปลาเทราต์', 25, [0, 2], 55, '🐟'], ['bass', 'ปลากะพง', 25, [1], 60, '🐟'],
  ['catfish', 'ปลาดุก', 15, [1], 80, '🐟'], ['eel', 'ปลาไหล', 8, [1, 2], 110, '🐍'], ['salmon', 'แซลมอน', 20, [2], 70, '🍣'], ['smelt', 'ปลาสเมลต์', 40, [3], 35, '🐟'], ['pufferfish', 'ปลาปักเป้า', 4, [1], 150, '🐡'],
  ['koi', 'ปลาโคอิ', 9, [0, 1, 2, 3], 120, '🎏'], ['goldfish', 'ปลาทอง', 1, [0, 1, 2, 3], 300, '🐠']];
const BUGS = [['ladybug', 'เต่าทอง', 40, [0, 1], 20, '🐞'], ['butterfly', 'ผีเสื้อ', 25, [0, 1, 2], 35, '🦋'], ['beetle', 'ด้วง', 20, [1], 45, '🪲'], ['bee', 'ผึ้ง', 25, [0, 1], 30, '🐝'], ['ant', 'มด', 40, [0, 1, 2], 10, '🐜'],
  ['cricket', 'จิ้งหรีด', 25, [2], 40, '🦗'], ['snail', 'หอยทาก', 25, [0, 2], 25, '🐌'], ['firefly', 'หิ่งห้อย', 5, [1], 140, '✨']];
const FOSSILS = [['trilobite', 'ไทรโลไบต์', 30, 60, '🪨'], ['ammonite', 'แอมโมไนต์', 25, 80, '🐚'], ['amber', 'อำพัน', 15, 120, '🔶'], ['dinotooth', 'ฟันไดโนเสาร์', 12, 150, '🦷'], ['fern', 'ใบเฟิร์นดึกดำบรรพ์', 20, 70, '🍃'], ['dinobone', 'กระดูกไดโนเสาร์', 6, 220, '🦴']];
for (const [id, n, , , sell, ic] of FISHES) ITEMS[id] = ITEMS[id] || { n, ic, k: 'fish', food: 12, sell, wing: 'fish' };
for (const [id, n, , , sell, ic] of BUGS) ITEMS[id] = { n, ic, k: 'bug', sell, wing: 'bug' };
for (const [id, n, , sell, ic] of FOSSILS) ITEMS[id] = { n, ic, k: 'fossil', sell, wing: 'fossil' };
Object.assign(ITEMS, { net: { n: 'อวนจับแมลง', p: 80, ic: '🥅', k: 'tool' }, shovel: { n: 'พลั่ว', p: 100, ic: '⛏️', k: 'tool' } });
for (const id of ['minnow', 'carp', 'koi', 'goldfish']) ITEMS[id].wing = 'fish';
ITEMS.painting.wing = 'art';
FISH_ODDS = () => { const L = lv('fish'), s = seasonOf().i; return FISHES.filter(f => f[3].includes(s)).map(f => [f[0], f[2] * (f[2] < 12 ? 1 + L * .25 : 1)]); };
const WINGS = { fish: ['🐟 ตู้ปลา', FISHES.map(f => f[0])], bug: ['🦋 ห้องแมลง', BUGS.map(b => b[0])], fossil: ['🦴 ฟอสซิล', FOSSILS.map(f => f[0])], art: ['🖼️ ห้องภาพ', ['painting']] };
const mus = () => st.mus || (st.mus = {});
const donated = w => WINGS[w][1].filter(id => mus()[id]).length;
// ---- gathering ----
const gather = (title, steps, ok) => startMini('bar', { title, steps, speed: 1.1, w: .26 }, s => doAct('dig', () => ok(s)));
function catchBug() {
  if (!have('net')) return say('ต้องมีอวนจับแมลง 🥅 (ร้านสัตว์เลี้ยง)'); if (st.energy < 8) return say('เหนื่อยเกินไป');
  const s = seasonOf().i, pool = BUGS.filter(b => b[3].includes(s) && (b[0] !== 'firefly' || isNight())); if (!pool.length) return say('ฤดูนี้ไม่มีแมลง — ลองฤดูใบไม้ผลิถึงใบไม้ร่วง');
  gather('🥅 จับแมลง!', [['กวาดอวน', '🥅']], q => { fx({ energy: -4 }); tick(15); if (q < .5 || (wet() && Math.random() < .5)) return say('มันบินหนีไป!'); const tot = pool.reduce((a, b) => a + b[2], 0); let r = Math.random() * tot, id = pool[0][0]; for (const b of pool) if ((r -= b[2]) < 0) { id = b[0]; break; } addItem(id); say(`จับได้ ${ITEMS[id].ic} ${ITEMS[id].n}!`); });
}
function digFossil() {
  if (!have('shovel')) return say('ต้องมีพลั่ว ⛏️ (ร้านสัตว์เลี้ยง)'); if (st.energy < 12) return say('เหนื่อยเกินไป');
  gather('⛏️ ขุดฟอสซิล!', [['ขุด', '⛏️'], ['ปัดฝุ่น', '🖌️']], q => { fx({ energy: -8 }); tick(30); if (q < .4) return say('เจอแต่ดินกับก้อนหิน…'); const tot = FOSSILS.reduce((a, f) => a + f[2], 0); let r = Math.random() * tot, id = FOSSILS[0][0]; for (const f of FOSSILS) if ((r -= f[2]) < 0) { id = f[0]; break; } addItem(id); say(`ขุดได้ ${ITEMS[id].ic} ${ITEMS[id].n}!`); });
}
for (const t of town.targets.filter(t => t.name === 'ม้านั่งในสวน')) {     // other modules defined opts as a getter: wrap it
  const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { get: () => [...base.call(t), ['🎮 จับแมลง 🥅', catchBug], ['🎮 ขุดฟอสซิล ⛏️', digFossil]], configurable: true });
}
// ---- museum ----
let wTab2 = 'fish';
function museumPanel() {
  openPanel('🏛️ พิพิธภัณฑ์', () => {
    const tabs = el('div', { className: 'tabs' }, ...Object.entries(WINGS).map(([k, [n]]) => el('button', { className: k === wTab2 ? 'on' : '', textContent: `${n} ${donated(k)}/${WINGS[k][1].length}`, onclick: () => { wTab2 = k; refreshPanel(); } })));
    const [, ids] = WINGS[wTab2];
    return [tabs, ...ids.map(id => { const I = ITEMS[id], has = mus()[id]; return row(has ? I.ic : '❔', has ? I.n : '???', has ? 'จัดแสดงอยู่ ✅' : have(id) ? `คุณมี ${have(id)}` : 'ยังไม่ได้บริจาค', !has && have(id) ? btn('บริจาค', () => donate(id)) : null); }),
      el('div', { className: 'sub' }, `เป้าหมาย: ${[3, 6, 12].map(m => `${m} ชิ้น ${st.musR?.[m] ? '✅' : ''}`).join(' · ')} — บริจาคแล้วทั้งหมด ${total()}`)];
  });
}
const total = () => Object.keys(mus()).length;
function donate(id) {
  addItem(id, -1); mus()[id] = 1; toast(`🏛️ บริจาค ${ITEMS[id].ic} ${ITEMS[id].n} ให้พิพิธภัณฑ์แล้ว`); xp('charm', 8);
  const R2 = st.musR || (st.musR = {}); for (const [m, pay] of [[3, 100], [6, 300], [12, 800], [20, 1500]]) if (total() >= m && !R2[m]) { R2[m] = 1; st.money += pay; setTimeout(() => toast(`🏅 ครบ ${m} ชิ้น! ได้เงินสนับสนุน ฿${pay}`), 600); }
  for (const w in WINGS) if (donated(w) === WINGS[w][1].length && !st['mw' + w]) { st['mw' + w] = 1; st.money += 400; setTimeout(() => toast(`🏆 ${WINGS[w][0]}ครบแล้ว! โบนัส ฿400`), 1200); }
  refreshPanel(); save();
}
town.targets.push({ x: BUILDINGS.find(b => b.act === 'museum').ix, y: BUILDINGS.find(b => b.act === 'museum').iy, name: 'พิพิธภัณฑ์', opts: [['เข้าชมและบริจาค', museumPanel], ['เดินชมนิทรรศการ 🖼️', () => { fx({ mood: 8 }); xp('art', 8); tick(45); say('ประวัติศาสตร์มากมายในอาคารเดียว!'); }]] });
// ---- sports & contests: one per season day 3–6 at the contest board ----
const CONTESTS = { 3: ['run', '🏃 วิ่งสนุก', 'dodge', { title: '🏃 วิ่งสนุก' }, 'fit'], 4: ['cook', '🍳 แข่งทำอาหาร', 'bar', { title: '🍳 แข่งทำอาหาร', steps: [['หั่น', '🔪'], ['ทอด', '🔥'], ['ปรุงรส', '🧂'], ['จัดจาน', '🍽️']], speed: 1.2, w: .22 }, 'cook'],
  5: ['kick', '⚽ แข่งยิงจุดโทษ', 'bar', { title: '⚽ ยิงจุดโทษ', steps: [1, 2, 3, 4, 5].map(i => [`ยิงครั้งที่ ${i}`, '⚽']), speed: 1.3, w: .22 }, 'fit'], 6: ['dance', '💃 แข่งเต้น', 'dance', { title: '💃 แข่งเต้น' }, 'charm'] };
const league = () => st.league || (st.league = { run: 0, cook: 0, kick: 0, dance: 0 });
function contestToday() { const s = seasonOf(); const c = CONTESTS[s.d]; return c && hour() >= 10 && hour() < 18 ? c : null; }
function enterContest(c) {
  const [id, name, game, cfg, skill] = c, S = st.contestDay === day();
  if (S) return say('วันนี้แข่งแล้ว'); if (age() < 10) return say('ต้องอายุ 10 ปีขึ้นไปจึงจะแข่งได้'); if (st.energy < 25) return say('เหนื่อยเกินไปจะแข่ง');
  startMini(game, { ...cfg }, s => doAct(id === 'run' || id === 'kick' ? 'run' : 'dance' === id ? 'talk' : 'cook', () => {
    st.contestDay = day(); const me = .55 * s + .05 * lv(skill) + Math.random() * .1, rivals = Array.from({ length: 5 }, () => .35 + Math.random() * .4 + (CFG.diff === 'hard' ? .1 : 0)), rank = 1 + rivals.filter(r => r > me).length;
    const prize = [0, 400, 250, 120][rank] || 0, pts = [0, 10, 6, 3][rank] || 1; league()[id] += pts; fx({ energy: -15, mood: rank <= 3 ? 20 : -3 }); xp(skill, 20 + 15 * (4 - Math.min(rank, 4))); tick(90);
    if (prize) { fx({ money: prize }); (st.trophies || (st.trophies = [])).push({ n: name, rank, d: day() }); toast(`${['', '🥇', '🥈', '🥉'][rank]} ${name}: ได้อันดับ ${rank} และรับ ฿${prize}!`); } else say(`${name}: อันดับ ${rank} จาก 6 — ครั้งหน้าสู้ใหม่!`);
    save();
  }));
}
town.targets.push({ x: 22 * T + 16, y: 7 * T + 16, name: 'ป้ายการแข่งขัน', get opts() { const c = contestToday(); return c ? [[`สมัคร: ${c[1]}`, () => enterContest(c)]] : [['ดูตารางแข่ง', () => say('การแข่ง: วันที่ 3 วิ่งสนุก · 4 แข่งทำอาหาร · 5 ยิงจุดโทษ · 6 แข่งเต้น — ทุกฤดู 10:00–18:00')]]; } });
function trophyRows() { return [...Object.entries(league()).map(([k, v]) => row({ run: '🏃', cook: '🍳', kick: '⚽', dance: '💃' }[k], `ลีก${{ run: 'วิ่ง', cook: 'ทำอาหาร', kick: 'ฟุตบอล', dance: 'เต้น' }[k]}`, `${v} คะแนน`)), ...(st.trophies || []).slice(-8).reverse().map(t => row(['', '🥇', '🥈', '🥉'][t.rank], t.n, `วันที่ ${t.d}`))]; }
ACH.push(['curator', '🏛️ ภัณฑารักษ์', 'บริจาคของสะสม 12 ชิ้น', () => total() >= 12], ['champ', '🥇 แชมป์', 'ชนะการแข่งขัน', () => (st.trophies || []).some(t => t.rank === 1)], ['bugs', '🦋 นักจับแมลง', 'บริจาคแมลงครบทุกชนิด', () => donated('bug') === BUGS.length]);
console.assert(Object.values(WINGS).every(([, ids]) => ids.every(id => ITEMS[id])), 'museum items exist');
console.assert(FISHES.every(f => ITEMS[f[0]]), 'fish items');
