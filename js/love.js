'use strict';
// Love and family: propose, wedding at the chapel, spouse moves in, babies that inherit from both of you,
// children who grow up, and "pass the torch" to play as your grown-up child.
Object.assign(ITEMS, { ring: { n: 'แหวนเพชร', p: 800, ic: '💍', k: 'gift' } });
const KID_NAMES = { f: ['อาเรีย', 'เบลล่า', 'คลีโอ', 'ดานา', 'เอลซ่า', 'เจเจ', 'จีจี้', 'โฮป'], m: ['อเล็ก', 'เบรนท์', 'โคดี้', 'ดรูว์', 'อีวาน', 'เกบ', 'ฮีธ', 'ไอแวน'] };
const kidAge = k => Math.floor((day() - k.born) / YEAR);
const spouseP = () => st.spouse && people.find(p => p.id === st.spouse);
const lookOf = p => p.look || { g: p.g, style: p.pal.style, hair: Math.max(0, HAIR.findIndex(h => h[0] === p.pal.h)), skin: 1, eye: 0, shirt: 0, skirt: !!p.pal.skirt };
const kidName = (g, taken) => KID_NAMES[g].find(n => !taken.includes(n)) || KID_NAMES[g][0];
const takenNames = () => [...PEOPLE.map(p => p.n), ...PARENT_NAMES, st.name, ...(st.kids || []).map(k => k.n)];

// ---- proposal, chapel, wedding ----
const _slotOf2 = slotOf; slotOf = p => st.gone?.[p.id] ? 'in' : _slotOf2(p);
const _po3 = personOpts;
personOpts = p => {
  if (p.fam === 'spouse') return spouseOpts(p); if (p.fam === 'kid') return kidOpts(p);
  const o = _po3(p);
  if (!p.fam && p.id === st.partner && !st.spouse) o.push(['ขอแต่งงาน 💍 (ต้องมีแหวน)', () => propose(p)], ['เลิกกัน 💔', () => breakUp(p)]);
  return o;
};
function propose(p) {
  const r = relOf(p.id);
  if (st.engaged === p.id) return say(`${p.n}: "เราหมั้นกันแล้วนะ! ไปจัดงานแต่งที่โบสถ์กันเถอะ"`);
  if (age() < 18 || p.age < 18) return say('คุณยังเด็กเกินไปที่จะหมั้น');
  if (r.f < 95) return say(`${p.n}: "เรารักเธอนะ แต่ขอเวลาอีกนิด…" (ความสนิท 95+)`);
  if (!have('ring')) return say('ต้องมีแหวนเพชร 💍 — ร้านดอกไม้ขายอยู่');
  addItem('ring', -1); st.engaged = p.id; fx({ mood: 30 }); r.f = 100; toast(`💍 ${p.n} ตอบตกลง! ไปจองงานแต่งที่โบสถ์`); say(`${p.n}: "ตกลง!! ตกลงเป็นพันครั้งเลย!"`);
}
function breakUp(p) { st.partner = null; st.engaged = null; relOf(p.id).f = Math.max(0, relOf(p.id).f - 35); fx({ mood: -25 }); say(`คุณกับ ${p.n} เลิกกัน…`); }
function attachSpouse() {
  const p = spouseP(); if (!p) return;
  p.fam = 'spouse'; p.home = typeof myDoorB === 'function' ? myDoorB() : 0; p.spots = {};
  p.h = { id: p.id, n: p.n, p, label: 'คู่สมรส', spr: p.spr, x: 7 * T + 16, y: 7 * T + 16, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0, get age() { return p.age; } };
  if (!fam.includes(p)) fam.push(p);
}
function wedding() {
  const p = PEOPLE.find(q => q.id === st.engaged); if (!p) return;
  if (st.money < 500) return say('งานแต่งราคา ฿500');
  fade(() => {
    st.money -= 500; st.spouse = p.id; st.partner = p.id; st.engaged = null; st.wedDay = day(); attachSpouse();
    const guests = PEOPLE.filter(q => q.id !== p.id && (st.rel[q.id]?.f || 0) >= 30), gifts = guests.reduce((a, q) => a + 40 + Math.floor(st.rel[q.id].f), 0);
    st.money += gifts; fx({ mood: 50 }); relOf(p.id).f = 100; tick(240);
    toast(`💒 ${st.name} กับ ${p.n} แต่งงานกันแล้ว! แขก ${guests.length} คนให้ของขวัญ ฿${gifts}`); say(`${p.n} ย้ายมาอยู่บ้านคุณแล้ว 💕`); save();
  }, 900);
}
town.targets.push({ x: bld('chapel').ix, y: bld('chapel').iy, name: 'โบสถ์', get opts() {
  return [...(st.engaged && !st.spouse ? [['จัดงานแต่ง ฿500 💒', wedding]] : []), ['สวดมนต์เงียบ ๆ 🙏', () => { fx({ mood: 8 }); tick(15); say('ช่วงเวลาสงบสุข'); }],
    ...(st.spouse ? [['ต่อสัญญารัก ฿100', () => { if (st.money < 100) return say('เงินไม่พอ'); fx({ money: -100, mood: 20 }); relOf(st.spouse).f = Math.min(100, relOf(st.spouse).f + 5); tick(60); say('คุณต่อสัญญารักกัน 💕'); }]] : [])];
} });

// ---- spouse ----
const dayOnce = (r, key, msg) => r[key] === day() ? (say(msg), false) : (r[key] = day(), true);
function spouseOpts(p) {
  const r = relOf(p.id);
  return [['คุย', () => talk(p)],
    ['กอดและหอมแก้ม 💋', () => { if (!dayOnce(r, 'hug', 'วันนี้แสดงความรักกันเต็มที่แล้ว')) return; r.f = Math.min(100, r.f + 3); fx({ mood: 15 }); tick(5); say(`${p.n} ยิ้มอย่างอบอุ่น`); }],
    ['ทำอาหารเย็นด้วยกัน 🍲', () => { if (have('egg') < 1 || have('rice') < 1) return say('ต้องมีไข่ 1 ฟอง และข้าว 1 ที่'); if (!dayOnce(r, 'cook', 'วันนี้ทำอาหารด้วยกันแล้ว')) return; addItem('egg', -1); addItem('rice', -1); fx({ food: 45, mood: 15 }); xp('cook', 15); r.f = Math.min(100, r.f + 2); tick(40); say('มื้อเย็นสำหรับสองคน 🍲'); }],
    ['ออกเดท ฿100', () => { if (st.money < 100) return say('เงินไม่พอ'); if (!dayOnce(r, 'date', 'วันนี้ไปเดทกันแล้ว')) return; fx({ money: -100, mood: 30, food: 25 }); r.f = Math.min(100, r.f + 4); tick(120); say('ค่ำคืนแสนโรแมนติก 💕'); }],
    ['ลองมีลูก 👶', () => tryBaby(p)], ['ให้ของขวัญ', () => giftPanel(p)],
    ['หย่า 💔', () => openMenu('หย่าจริง ๆ ใช่ไหม?', [['ใช่ หย่าเลย', () => divorce(p)]])]];
}
function tryBaby(p) {
  if (st.preg) return say(`${p.n} กำลังตั้งครรภ์อยู่! กำหนดคลอดวันที่ ${st.preg.due}`);
  if (age() < 20) return say('คุณยังเด็กเกินไปที่จะมีลูก');
  if (day() - st.wedDay < 3) return say(`${p.n}: "ขอใช้ชีวิตคู่ใหม่ ๆ อีกสักหน่อยนะ"`);
  if ((st.kids || []).length >= 3) return say('บ้านคุณเต็มไปด้วยเด็ก ๆ แล้ว!');
  if (relOf(p.id).f < 80) return say(`${p.n}: "อยากให้เราใกล้ชิดกันกว่านี้ก่อน"`);
  st.preg = { due: day() + 7 }; fx({ mood: 25 }); toast(`👶 ${p.n} ตั้งครรภ์! อีก 7 วันจะคลอด`);
}
function divorce(p) { st.spouse = st.partner = null; p.fam = undefined; p.home = HOMES[p.k % HOMES.length]; fam = fam.filter(q => q !== p); relOf(p.id).f = 10; fx({ mood: -40 }); say(`คุณกับ ${p.n} หย่ากัน…`); }

// ---- children ----
function birth() {
  const sp = spouseP() || (st.cohab && people.find(q => q.id === st.cohab)); if (!sp) { st.preg = null; return; }
  const g = Math.random() < .5 ? 'm' : 'f', a = st.look, b = lookOf(sp), from = {}, gene = k => { const me = Math.random() < .5; from[k] = me ? st.name : sp.n; return (me ? a : b)[k]; };
  const tMe = Math.random() < .5, k = { g, n: '', born: day(), bond: 50, trait: tMe ? st.parents.trait : sp.trait, traitFrom: tMe ? st.name : sp.n,
    look: { g, style: STYLES[g][ri(STYLES[g].length)], hair: gene('hair'), skin: gene('skin'), eye: gene('eye'), shirt: ri(SHIRT.length), skirt: g === 'f' && Math.random() < .5 }, from };
  k.n = kidName(g, takenNames()); st.kids.push(k); st.preg = null; kidEnt.cache = {};
  toast(`👶 ${g === 'f' ? 'ลูกสาว' : 'ลูกชาย'}เกิดแล้ว!`); nameKid(k);
}
function nameKid(k) {
  const inp = el('input', { maxLength: 12, value: k.n, style: 'font:inherit;font-size:16px;padding:6px 10px;border-radius:8px;border:2px solid var(--btnb);background:#1b1530;color:var(--ink);user-select:text;-webkit-user-select:text' });
  const err = el('div', { className: 'no' });
  inp.oninput = () => { inp.value = inp.value.replace(/[^\u0E00-\u0E7FA-Za-z0-9 ]/g, ''); };
  openPanel('👶 ตั้งชื่อลูก', () => [el('div', {}, 'พิมพ์ชื่อได้ทั้งภาษาไทยและอังกฤษ'), inp, err, btn('ยืนยัน', () => {
    const n = inp.value.trim(), taken = takenNames().filter(x => x !== k.n).map(x => x.toLowerCase());
    if (!n) return err.textContent = 'กรุณาพิมพ์ชื่อ'; if (taken.includes(n.toLowerCase())) return err.textContent = 'ชื่อนี้ถูกใช้แล้ว';
    k.n = n; closePanel(); save(); say(`ยินดีต้อนรับสู่ครอบครัวนะ ${n}!`);
  })]);
}
const kidEnt = k => {
  const c = kidEnt.cache || (kidEnt.cache = {}), key = k.n + k.born;
  if (!c[key]) { const p = { id: 'kid' + st.kids.indexOf(k), fam: 'kid', kid: k }; const kidAgeNow = kidAge(k); c[key] = { id: p.id, n: k.n, p, spr: sheet({ ...palOf(k.look), ...npcWear({ id: p.id, g: k.g, age: kidAgeNow }, 300 + st.kids.indexOf(k)), bust: k.g === 'f' && kidAgeNow >= 18 }), x: 4 * T + 16, y: 6 * T + 16, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0, get label() { const a = kidAge(k); return a < 3 ? 'ทารก' : k.g === 'f' ? 'ลูกสาว' : 'ลูกชาย'; }, get age() { return kidAge(k); } }; }
  return c[key];
};
function kidEnts() {
  const w = weekday(), h = hour();
  return (st.kids || []).filter(k => k.n && !(kidAge(k) >= 6 && kidAge(k) < 18 && w < 5 && h >= 8 && h < 15)).map(kidEnt);
}
function kidOpts(p) {
  const k = p.kid, a = kidAge(k), baby = a < 3, o = [];
  const once = key => k['d' + key] === day() ? (say(`${k.n} ทำแบบนั้นวันนี้แล้ว`), false) : (k['d' + key] = day(), true);
  o.push(['เล่นด้วยกัน', () => { if (!once('play')) return; k.bond = Math.min(100, k.bond + 4); fx({ mood: 8, energy: -4 }); tick(20); say(`${k.n} หัวเราะอย่างมีความสุข`); }]);
  if (baby) o.push(['ป้อนนม 🍼', () => { if (!have('milk')) return say('ต้องมีนม — ซื้อได้ที่มินิมาร์ท'); if (!once('feed')) return; addItem('milk', -1); k.bond += 3; fx({ mood: 5 }); tick(10); say(`${k.n} ดื่มนมอย่างเอร็ดอร่อย`); }],
    ['กล่อมนอน', () => { if (!once('rock')) return; k.bond += 3; fx({ mood: 6, energy: -3 }); tick(20); say(`${k.n} หลับปุ๋ย 💤`); }]);
  else o.push(['อ่านนิทาน 📖', () => { if (!once('story')) return; k.bond = Math.min(100, k.bond + 4); fx({ mood: 8 }); xp('charm', 6); tick(25); say(`${k.n} ฟังตากว้างด้วยความสนใจ`); }],
    ['ทำอาหารให้กิน', () => { const d = Object.keys(st.inv).find(id => ITEMS[id].k === 'dish'); if (!d) return say('ต้องมีอาหารที่ปรุงแล้วในกระเป๋า'); if (!once('meal')) return; addItem(d, -1); k.bond = Math.min(100, k.bond + 5); fx({ mood: 6 }); tick(15); say(`${k.n} ชอบ ${ITEMS[d].n} มาก!`); }]);
  o.push(['กอด', () => { if (!once('hug')) return; k.bond = Math.min(100, k.bond + 2); fx({ mood: 10 }); tick(3); say(`${k.n} กอดตอบ`); }]);
  if (a >= 18 && age() >= 40) o.push([`ส่งไม้ต่อให้ ${k.n} 🔥`, () => openMenu(`เล่นเป็น ${k.n}?`, [[`ใช่ — กลายเป็น ${k.n} (อายุ ${a})`, () => passTorch(k)]])]);
  return o;
}
function passTorch(k) {
  st.torched = 1;
  const sp = spouseP(), old = { n: st.name, g: st.look.g, a: age(), look: st.look, trait: st.parents.trait }, partner = sp ? { n: sp.n, g: sp.g, a: sp.age, look: lookOf(sp), trait: sp.trait } : { n: 'อเล็กซ์', g: old.g === 'm' ? 'f' : 'm', a: old.a, look: randomLook(old.g === 'm' ? 'f' : 'm'), trait: TRAITS[ri(TRAITS.length)] };
  const [dad, mom] = old.g === 'f' && partner.g === 'm' ? [partner, old] : [old, partner], newAge = kidAge(k);
  const mkP = q => ({ n: q.n, g: q.g, age0: q.a - (newAge - 6), look: q.look, trait: q.trait });
  const from = {}; for (const g of ['hair', 'skin', 'eye']) from[g] = k.look[g] === dad.look[g] ? 'พ่อ' : 'แม่';
  st.ageShift = newAge - (6 + Math.floor((day() - 1) / YEAR)); st.name = k.n; st.look = k.look; st.parents = { dad: mkP(dad), mom: mkP(mom), from, trait: k.trait, traitFrom: k.traitFrom || 'พ่อแม่' };
  if (sp) (st.gone || (st.gone = {}))[sp.id] = 1;
  Object.assign(st, { lastAge: age(), job: null, partner: null, spouse: null, engaged: null, preg: null, kids: [], wear: {}, outfit: 0, school: null, grad: age() >= 18 ? 1 : 0 });
  for (const s in st.sk) st.sk[s] = Math.round(st.sk[s] * .3);
  for (const id in st.rel) st.rel[id].f = Math.round(st.rel[id].f * .5);
  people = people.filter(p => !p.fam); fam = []; kidEnt.cache = {}; makeFamily(); dressPlayer();
  toast(`🔥 คนรุ่นใหม่: ตอนนี้คุณคือ ${k.n} อายุ ${age()} พ่อแม่ของคุณคือ ${old.n} และ ${partner.n}`); save();
}
const _fr = familyRows;
familyRows = () => [..._fr(), ...(st.engaged ? [row('💍', `หมั้นกับ ${PEOPLE.find(p => p.id === st.engaged)?.n}`, 'จัดงานแต่งที่โบสถ์ (฿500)')] : []),
  ...(st.spouse ? [row(thumb(spouseP().spr), `คู่สมรส: ${spouseP().n} (อายุ ${spouseP().age})`, `แต่งงานวันที่ ${st.wedDay} · ความสนิท ${Math.floor(relOf(st.spouse).f)}/100`)] : []),
  ...(st.preg ? [row('🤰', 'กำลังตั้งครรภ์', `กำหนดคลอดวันที่ ${st.preg.due}`)] : []),
  ...(st.kids || []).map(k => row(thumb(kidEnt(k).spr), `${k.n} (${k.g === 'f' ? 'ลูกสาว' : 'ลูกชาย'}, อายุ ${kidAge(k)})`, `หน้าตาจาก ${Object.values(k.from).join('/')} · นิสัย ${k.trait} (${k.traitFrom}) · ความสนิท ${Math.floor(k.bond)}`))];
const _lt3 = lifeTick;
lifeTick = () => { _lt3(); if (st.preg && day() >= st.preg.due && hour() >= 7 && !panelOpen) birth(); };
const _mf3 = makeFamily; makeFamily = () => { _mf3(); st.kids = st.kids || []; if (st.spouse) attachSpouse(); kidEnt.cache = {}; };
ACH.push(['engaged', '💍 หมั้นแล้ว', 'ตกลงหมั้นกัน', () => !!st.engaged || !!st.spouse], ['married', '💒 แต่งงาน', 'แต่งงานที่โบสถ์', () => !!st.spouse], ['parent', '👶 คุณพ่อคุณแม่มือใหม่', 'มีลูกคนแรก', () => (st.kids || []).length > 0],
  ['torch', '🔥 คนรุ่นใหม่', 'สวมบทเป็นลูกที่โตแล้ว', () => !!st.torched]);
console.assert(Object.keys(KID_NAMES).every(g => KID_NAMES[g].every(n => !PEOPLE.some(p => p.n === n))), 'kid names clash with townsfolk');
