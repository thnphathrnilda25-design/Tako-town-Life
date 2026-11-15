'use strict';
// Life layer: character creator, genetics, aging. Loaded after game.js, so it can use everything game.js defines.
const SKINS = [['#fde0c0', '#e8b890'], ['#f7cfa6', '#e2a882'], ['#e0ac7a', '#c08858'], ['#b8814e', '#946236'], ['#7a5030', '#5e3a20']];
const EYES = ['#3a2418', '#2a6a3a', '#3a6ad8', '#6a4a8a', '#8a5a2a', '#4a4a54'];
const STYLES = { m: ['short', 'swept', 'long'], f: ['bob', 'long', 'swept', 'short'] };
const CREATOR_HAIR = [
  ['short', 'สั้น', ''], ['swept', 'ปัดข้าง', ''], ['long', 'ยาว', ''], ['bob', 'บ๊อบ', ''],
  ['spiky', 'ตั้งแหลม', 'spiky'], ['bun', 'เกล้ามวย', 'bun'], ['spacebuns', 'มวยคู่', 'spacebuns'], ['topknot', 'ปมสูง', 'topknot'],
  ['ponytail', 'หางม้า', 'ponytail'], ['twintails', 'ทวินเทล', 'twintails'], ['pigtails', 'เปียคู่', 'pigtails'], ['braid', 'เปียข้าง', 'braid'],
  ['afro', 'แอโฟร', 'afro'], ['curly', 'หยิก', 'curly'], ['mohawk', 'โมฮอว์ก', 'mohawk'], ['sidepart', 'แสกข้าง', 'sidepart'],
  ['bowl', 'ทรงชาม', 'bowl'], ['fringe', 'หน้าม้ายาว', 'fringe'], ['pixie', 'พิกซี่', 'pixie'], ['wavy', 'ลอน', 'wavy'],
  ['messy', 'ยุ่ง', 'messy'], ['slick', 'แสกหลัง', 'slick'],
].map(([id, n, hx]) => ({ id, n, style: hx ? ({ bun: 'long', spacebuns: 'bob', ponytail: 'swept', twintails: 'bob', pigtails: 'bob', braid: 'long', wavy: 'long' }[hx] || 'short') : id, hx }));
const CREATOR_TOPS = [['tee', 'ยืด'], ['hoodie', 'ฮู้ดดี้'], ['jacket', 'แจ็คเก็ต'], ['sweater', 'สเวตเตอร์'], ['overalls', 'เอี๊ยม'], ['dress', 'เดรส']];
const CREATOR_BOTTOMS = [['jeans', 'ยีนส์'], ['shorts', 'ขาสั้น'], ['cargo', 'คาร์โก้'], ['leggings', 'เลกกิ้ง'], ['longskirt', 'กระโปรงยาว']];
const CREATOR_SHOES = [['plain', 'ธรรมดา'], ['sneakers', 'ผ้าใบ'], ['boots', 'บูท'], ['sandals', 'แตะรัดส้น']];
const PARENT_NAMES = ['แดเนียล', 'ซาร่า'];          // reserved: no townsfolk or player may share these
const palOf = l => {
  const h = HAIR[l.hair], c = SHIRT[l.shirt], k = SKINS[l.skin];
  return { style: l.style, hx: l.hx || '', topS: l.topS || 'tee', botS: l.botS || 'jeans', shoeS: l.shoeS || 'plain', clip: l.g === 'f' && l.style === 'bob' ? 1 : 0, skirt: l.g === 'f' && l.skirt ? 1 : 0, h: h[0], H: h[1], L: h[2],
    c: c[0], C: c[1], a: c[2], p: PANTS[0][0], f: PANTS[0][1], sk: k[0], skd: k[1], e: EYES[l.eye] };
};
const ri = n => Math.random() * n | 0;
const randomLook = g => {
  const bottoms = CREATOR_BOTTOMS.filter(([id]) => g === 'f' || id !== 'longskirt'), bot = bottoms[ri(bottoms.length)][0];
  return { g, style: STYLES[g][ri(STYLES[g].length)], hx: '', hair: ri(HAIR.length), skin: ri(SKINS.length), eye: ri(EYES.length), shirt: ri(SHIRT.length), topS: CREATOR_TOPS[ri(CREATOR_TOPS.length)][0], botS: bot, shoeS: CREATOR_SHOES[ri(CREATOR_SHOES.length)][0], skirt: g === 'f' && bot === 'longskirt' };
};

// Each inherited gene (hair colour, skin, eyes, personality) comes from one parent, so the child always resembles a parent.
function makeParents(look) {
  const dad = randomLook('m'), mom = randomLook('f'), dt = TRAITS[ri(TRAITS.length)], mt = TRAITS[ri(TRAITS.length)], from = {};
  for (const gene of ['hair', 'skin', 'eye']) { const d = Math.random() < .5; (d ? dad : mom)[gene] = look[gene]; from[gene] = d ? 'พ่อ' : 'แม่'; }
  const tFromDad = Math.random() < .5;
  return { dad: { n: PARENT_NAMES[0], g: 'm', age0: 30 + ri(8), look: dad, trait: dt }, mom: { n: PARENT_NAMES[1], g: 'f', age0: 28 + ri(8), look: mom, trait: mt },
    from, trait: tFromDad ? dt : mt, traitFrom: tFromDad ? 'พ่อ' : 'แม่' };
}
const parentAge = p => p.age0 + age() - 6;

function lifeTick() {
  if (age() <= st.lastAge) return;
  const from = stage(st.lastAge); st.lastAge = age();
  toast(`🎂 สุขสันต์วันเกิด ${st.name}! ตอนนี้อายุ ${age()} ปีแล้ว`); fx({ mood: 10 });
  if (age() < 18) { fx({ money: 100 }); toast('🎁 พ่อกับแม่ให้เงิน ฿100'); }
  if (stage(age()) !== from) toast(`🌱 ตอนนี้เข้าสู่วัย${{ teen: 'รุ่น', adult: 'ผู้ใหญ่', elder: 'สูงวัย' }[stage(age())]}แล้ว!`);
  save();
}

// ---- family: parents live in the house, work in town, and pass on looks and a trait ----
const TRAIT_FX = { smart: 'ทักษะเพิ่มเร็วขึ้น 15%', cheerful: 'ความสุขลดช้าลง 30%', kind: 'มิตรภาพเพิ่มเร็วขึ้น', shy: 'ทักษะศิลปะเพิ่มเร็วขึ้น 20%', grumpy: 'ได้ค่าจ้างเพิ่ม 8% ต่อกะ', lazy: 'การนอนฟื้นความสุขเพิ่ม' };
var xpMul = s => (st.parents?.trait === 'smart' ? 1.15 : 1) * (st.parents?.trait === 'shy' && s === 'art' ? 1.2 : 1);
const moodDrain = () => st.parents?.trait === 'cheerful' ? .7 : 1;
const kindBonus = () => st.parents?.trait === 'kind' ? 1 : 0;
const payMul = () => st.parents?.trait === 'grumpy' ? 1.08 : 1;
const restBonus = () => st.parents?.trait === 'lazy' ? 5 : 0;
let fam = [];
var homeFamily = () => [...fam.filter(p => p.slot === 'in').map(p => p.h), ...(typeof kidEnts === 'function' ? kidEnts() : [])];
function makeFamily() {
  const P = st.parents; fam = [];
  for (const [id, q, sched] of [['dad', P.dad, [[6, 'in'], [8, 'office'], [17, 'plaza'], [19, 'in']]], ['mom', P.mom, [[6, 'in'], [9, 'cafe'], [15, 'park'], [18, 'in']]]]) {
    const p = { id, n: q.n, fam: 1, g: q.g, trait: q.trait, date: 0, love: [], like: [], hate: [], sched, home: 0, spots: {}, k: id === 'dad' ? 60 : 61, person: 1, slot: 'in',
      stuck: 0, x: 0, y: 0, dir: 0, frame: 0, at: 0, spr: sheet(palOf(q.look)), says: [TRAIT_SAYS[q.trait], 'กินข้าวหรือยังลูก?', 'พ่อ/แม่ภูมิใจในตัวลูกมากนะ', 'ตั้งใจเรียนและใจดีกับทุกคนด้วยนะ'],
      get age() { return parentAge(q); } };
    p.h = { id, n: q.n, p, spr: p.spr, x: 7 * T + 16, y: 7 * T + 16, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0, get age() { return p.age; } };
    const r = relOf(id); if (!r.f) r.f = 60;        // family starts close
    fam.push(p);
  }
  people.push(...fam);
}
const _personOpts = personOpts;
personOpts = p => p.fam ? familyOpts(p) : _personOpts(p);
function familyOpts(p) {
  const r = relOf(p.id), who = p.id === 'dad' ? 'พ่อ' : 'แม่', a = age(), kid = a < 18;
  return [['คุยด้วย', () => talk(p)],
    ['กอด', () => { if (r.hug === day()) return say(`${who}: "จะกอดอีกแล้วเหรอ? มานี่มา!"`); r.hug = day(); r.f = Math.min(100, r.f + 2); fx({ mood: 10 }); tick(5); say(`${who} กอดคุณแน่นเลย 🤗`); }],
    ['ขอเงินพ่อแม่', () => {
      if (!kid) return say(`${who}: "โตแล้วนะ ถึงเวลาหาเงินเองแล้วลูก"`);
      if (r.ask === day()) return say(`${who}: "วันนี้ขอแล้วนะลูก รอพรุ่งนี้ก่อน"`);
      r.ask = day();
      const rel = r.f || 0, grumpy = p.trait === 'grumpy';
      if (Math.random() < (grumpy ? .28 : .1) + (rel < 40 ? .18 : 0)) {
        fx({ mood: -3 }); return say(`${who}: "ช่วงนี้เงินตึงมืออยู่... ไว้ก่อนนะลูก"`);
      }
      const amt = 20 + Math.floor(rel / 6) + (a >= 13 ? 20 : 0);
      fx({ money: amt, mood: 2 }); say(`${who} ให้เงินใช้จ่าย ฿${amt} — เก็บไว้ใช้เองนะ`);
    }],
    ['กินข้าวเย็นด้วยกัน', () => {
      const h = hour(); if (h < 17 || h >= 21) return say('มื้อเย็นคือ 17:00–21:00');
      if (r.din === day()) return say('วันนี้กินข้าวเย็นด้วยกันแล้ว');
      if (!homeFamily().length) return say('ตอนนี้ไม่มีใครอยู่บ้าน');
      r.din = day(); r.f = Math.min(100, r.f + 3); fx({ food: 60, mood: 12 }); tick(45); say('มื้อเย็นอบอุ่นของครอบครัว ทุกคนยิ้มแย้ม 🍲');
    }],
    ['ให้ของขวัญ', () => giftPanel(p)]];
}
function thumb(spr) { const c = el('canvas', { width: 24, height: 40 }); c.getContext('2d').drawImage(spr[0][0], 0, 0); c.style.cssText = 'width:24px;height:40px;image-rendering:pixelated'; return c; }
function familyRows() {
  const P = st.parents, you = sheet(playerPal());
  const gene = k => `${k === 'hair' ? 'สีผม' : k === 'skin' ? 'สีผิว' : 'สีตา'}จาก${P.from[k]}`;
  return [row(thumb(you), `${st.name} (คุณ, อายุ ${age()})`, `ได้รับ: ${['hair', 'skin', 'eye'].map(gene).join(' · ')}`),
    row('🧬', `นิสัยที่ได้รับ: ${P.trait} (จาก${P.traitFrom})`, TRAIT_FX[P.trait]),
    ...fam.filter(p => p.id === 'dad' || p.id === 'mom').map(p => row(thumb(p.spr), `${p.id === 'dad' ? 'พ่อ' : 'แม่'} ${p.n} (อายุ ${p.age})`, `${p.trait} · ${TRAIT_FX[p.trait]} · ความสนิท ${Math.floor(relOf(p.id).f)}/100`))];
}
console.assert(true, 'family loaded');

// ---- character creator ----
document.head.append(el('style', { textContent: `.sw{width:26px;height:26px;border-radius:6px;border:2px solid #fff4;padding:0}.sw.on{border-color:var(--gold);box-shadow:0 0 0 2px #0008}
#creator{display:flex;gap:18px;flex-wrap:wrap;justify-content:center;align-items:flex-start;max-width:min(720px,94vw);text-align:left}#creator .pv{text-align:center}
#creator .frm{display:flex;flex-direction:column;gap:6px;min-width:min(320px,86vw);max-height:calc(100dvh - 36px);overflow-y:auto;padding-right:4px}#creator .frm .cont{align-self:flex-start;margin-top:10px}
#creator canvas{width:108px;height:180px;image-rendering:pixelated;background:#ffffff14;border-radius:12px}#creator label{display:block;margin:8px 0 3px;color:var(--gold);font-size:14px}
#creator .sws,#creator .opts{display:flex;gap:4px;flex-wrap:wrap;max-width:300px}#creator input{font:inherit;font-size:16px;padding:6px 10px;border-radius:8px;border:2px solid var(--btnb);background:#1b1530;color:var(--ink);width:200px;user-select:text;-webkit-user-select:text}
#creator .opts button{padding:4px 10px;font-size:14px}#creator .opts button.on{border-color:var(--gold);background:#4a3c7a}#creator .err{color:#ff8a8a;font-size:13px;min-height:18px}
@media(max-width:480px){#creator{flex-direction:column;align-items:center;gap:8px;max-width:96vw}#creator .frm{min-width:0;width:100%}#creator input{width:100%;box-sizing:border-box}#creator .sws,#creator .opts{max-width:none}#creator .frm .cont{align-self:stretch;text-align:center;font-size:17px;padding:10px}#select h1{font-size:34px}}` }));

function openCreator() {
  const look = randomLook('f'); let name = '', startAge = 16;
  const pv = el('canvas', { width: 24, height: 40 }), err = el('div', { className: 'err' }), input = el('input', { maxLength: 12, placeholder: 'ชื่อของคุณ', autocomplete: 'off' });
  const go = el('button', { className: 'cont' });
  const reserved = () => [...PEOPLE.map(p => p.n), ...PARENT_NAMES].map(n => n.toLowerCase());
  const controls = el('div');
  function check() {
    const n = name.trim();
    err.textContent = !n ? 'ใส่ชื่อก่อนเริ่มชีวิต' : reserved().includes(n.toLowerCase()) ? `"${n}" ซ้ำกับชาวเมือง — เปลี่ยนชื่อหน่อย` : '';
    go.disabled = !!err.textContent;
  }
  function draw() {
    const c = pv.getContext('2d'); c.clearRect(0, 0, 24, 40); c.drawImage(sheet(palOf(look))[0][0], 0, 0);
    const sw = (key, list, col) => el('div', { className: 'sws' }, ...list.map((v, i) => el('button', { className: 'sw' + (look[key] === i ? ' on' : ''), style: `background:${col(v)}`, ariaLabel: `${key} ${i + 1}`, onclick: () => { look[key] = i; draw(); } })));
    const opt = (items, on) => el('div', { className: 'opts' }, ...items.map(([t, active, fn]) => el('button', { className: active ? 'on' : '', textContent: t, onclick: fn })));
    go.textContent = startAge === 16 ? 'เริ่มชีวิตตอนอายุ 16' : 'เริ่มชีวิตตอนอายุ 6 ขวบ';
    controls.replaceChildren(
      el('label', {}, 'ชื่อ'), input,
      el('label', {}, 'เริ่มตอนอายุ'), el('div', { className: 'opts' }, el('button', { className: startAge === 16 ? 'on' : '', textContent: '16 ปี (แนะนำ)', onclick: () => { startAge = 16; draw(); } }), el('button', { className: startAge === 6 ? 'on' : '', textContent: '6 ขวบ (เล่นวัยเด็ก)', onclick: () => { startAge = 6; draw(); } })),
      el('label', {}, 'เพศ'), opt([['ผู้ชาย', look.g === 'm', () => { Object.assign(look, { g: 'm', style: STYLES.m[0], hx: '', skirt: false }); draw(); }], ['ผู้หญิง', look.g === 'f', () => { Object.assign(look, { g: 'f', style: STYLES.f[0], hx: '' }); draw(); }]]),
      el('label', {}, 'ทรงผม'), opt(CREATOR_HAIR.map(h => [h.n, (look.hx || look.style) === h.id, () => { look.style = h.style; look.hx = h.hx; draw(); }])),
      el('label', {}, 'สีผม'), sw('hair', HAIR, v => v[0]),
      el('label', {}, 'สีผิว'), sw('skin', SKINS, v => v[0]),
      el('label', {}, 'สีตา'), sw('eye', EYES, v => v),
      el('label', {}, 'เสื้อ'), sw('shirt', SHIRT, v => v[0]),
      el('label', {}, 'แบบเสื้อ'), opt(CREATOR_TOPS.map(([id, n]) => [n, (look.topS || 'tee') === id, () => { look.topS = id; draw(); }])),
      el('label', {}, 'กางเกง / กระโปรง'), opt(CREATOR_BOTTOMS.map(([id, n]) => [n, (look.botS || 'jeans') === id, () => { look.botS = id; look.skirt = id === 'longskirt' || id === 'skirt'; draw(); }])),
      el('label', {}, 'รองเท้า'), opt(CREATOR_SHOES.map(([id, n]) => [n, (look.shoeS || 'plain') === id, () => { look.shoeS = id; draw(); }])));
    input.value = name; check();
  }
  input.oninput = () => { name = input.value = input.value.replace(/[^\u0E00-\u0E7FA-Za-z0-9 ]/g, ''); check(); };
  go.onclick = () => { st = newState(); st.name = name.trim(); st.look = look; st.parents = makeParents(look); st.ageShift = startAge - 6; st.lastAge = startAge; start(); };
  const dice = el('button', { textContent: '🎲 สุ่มหน้าตา', onclick: () => { Object.assign(look, randomLook(look.g)); draw(); } });
  draw();
  $('select').querySelector('div').textContent = 'สร้างตัวละคร';
  $('pick').replaceWith(el('div', { id: 'creator' }, el('div', { className: 'pv' }, pv, el('div', {}, dice)), el('div', { className: 'frm' }, controls, err, go)));
}
{
  const saved = load();
  $('select').querySelector('div').textContent = 'ชีวิตใหม่กำลังเริ่ม';
  openCreator();
  if (saved) $('select').append(el('button', { className: 'cont', textContent: `เล่นต่อ (วันที่ ${Math.floor(saved.st.min / 1440) + 1})`, onclick: () => start(saved) }));
}
console.assert(PARENT_NAMES.every(n => !PEOPLE.some(p => p.n === n)), 'parent names must not clash with townsfolk');
console.assert(palOf(randomLook('f')).h, 'palOf returns a palette');
