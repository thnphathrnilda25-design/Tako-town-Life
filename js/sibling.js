'use strict';
// Siblings: a new life rolls 0–2 older/younger brothers or sisters at the start. They live in
// the same house, inherit the same genes as you (hair colour, skin, eyes from พ่อ/แม่), keep
// their own schedule, and can be played or gifted like the rest of the family.

const SIB_CLONE = v => v == null ? v : JSON.parse(JSON.stringify(v));
const sibAge = s => (s.age0 | 0) + Math.floor((day() - 1) / YEAR);
const sibOf = id => (st.sibs || []).find(s => s.id === id) || null;
const sibLabel = s => `${s.older ? 'พี่' : 'น้อง'}${s.g === 'f' ? 'สาว' : 'ชาย'}`;
const sibSched = a => a < 6 ? [[0, 'in']] : a < 18 ? SCHED.student : SCHED.worker;

function sibCount() { const r = Math.random(); return r < .22 ? 0 : r < .68 ? 1 : 2; }
function makeSibs() {
  const P = st.parents; if (!P) return [];
  const myAge = 6 + (st.ageShift0 ?? st.ageShift ?? 0), n = sibCount(), out = [], used = [];
  for (let i = 0; i < n; i++) {
    const older = Math.random() < .45, g = Math.random() < .5 ? 'm' : 'f';
    const age0 = Math.max(1, myAge + (older ? 2 + ri(5) : -(1 + ri(4))));
    const from = {}, gene = key => { const d = Math.random() < .5; from[key] = d ? 'พ่อ' : 'แม่'; return SIB_CLONE((d ? P.dad : P.mom).look[key]); };
    const hair = hairPick(g);
    const look = normalizeLook({ g, style: hair.style, hx: hair.hx, hair: gene('hair'), skin: gene('skin'), eye: gene('eye'),
      shirt: ri(SHIRT.length), topS: CREATOR_TOPS[ri(CREATOR_TOPS.length)][0], botS: g === 'f' && Math.random() < .3 ? 'longskirt' : CREATOR_BOTTOMS[ri(CREATOR_BOTTOMS.length)][0],
      shoeS: CREATOR_SHOES[ri(CREATOR_SHOES.length)][0] });
    const n2 = kidName(g, [...takenNames(), ...used]);
    used.push(n2);
    out.push({ id: 'sib' + i, n: n2, g, age0, older, trait: TRAITS[ri(TRAITS.length)], look, from });
  }
  return out;
}

function syncSibs() {
  people = people.filter(p => p.fam !== 'sib');
  fam = fam.filter(p => p.fam !== 'sib');
  (st.sibs || []).forEach((s, i) => {
    s.id = 'sib' + i;
    const a = sibAge(s);
    bakeLook(s.look, { id: s.id, g: s.g, age: a }, 700 + i);
    const p = { id: s.id, n: s.n, fam: 'sib', g: s.g, trait: s.trait, role: a < 18 ? 'student' : 'worker', date: 0, love: [], like: [], hate: [], sched: sibSched(a), home: 0, spots: {}, k: 70 + i, person: 1, slot: 'in',
      stuck: 0, x: (5 + i) * T + 16, y: 8 * T + 16, dir: 0, frame: 0, at: 0, spr: sheet({ ...palOf(s.look), bust: s.g === 'f' && a >= 18 }),
      says: [TRAIT_SAYS[s.trait], 'มาเล่นด้วยกันไหม?', 'บ้านเราสนุกดีนะ'], get age() { return sibAge(s); } };
    if (a < 6) { p._sched = [[0, 'in']]; p._schedRole = 'student'; }   // toddlers stay home all day
    p.h = { id: s.id, n: s.n, p, label: sibLabel(s), spr: p.spr, x: p.x, y: p.y, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0, get age() { return p.age; } };
    const r = relOf(s.id); if (!r.f) r.f = 75;
    fam.push(p); people.push(p);
  });
}
function ensureSibs() {
  if (!st.parents) return;
  if (!Array.isArray(st.sibs)) st.sibs = makeSibs();
  st.sibs.forEach(s => normalizeLook(s.look));
  syncSibs();
}

// siblings are people: talk, hug, play and give gifts
function sibOpts(p) {
  const r = relOf(p.id), s = sibOf(p.id) || {}, a = s ? sibAge(s) : 0;
  return [['คุยด้วย', () => talk(p)],
    ['กอด', () => { if (r.hug === day()) return say(`${p.n}: "วันนี้กอดไปแล้วนะ!"`); r.hug = day(); r.f = Math.min(100, r.f + 3); fx({ mood: 8 }); tick(4); say(`${p.n} กอดคุณกลับแน่นเลย 🤗`); }],
    ['เล่นด้วยกัน', () => { if (r.play === day()) return say(`${p.n}: "วันนี้เล่นกันเยอะแล้ว ขอพักก่อนนะ"`); r.play = day(); r.f = Math.min(100, r.f + 2); fx({ mood: 7, energy: -4 }); tick(20); say(`เล่นกับ ${p.n} จนหัวเราะท้องแข็ง 🎮`); }],
    ...(s.older && a >= 18 ? [['ขอเงินพี่', () => {
      if (r.ask === day()) return say(`${p.n}: "ขออีกแล้วเหรอ? พรุ่งนี้ก่อนนะ"`); r.ask = day();
      if ((r.f || 0) < 50) return say(`${p.n}: "พี่เองก็เงินไม่ค่อยมี…"`);
      const amt = 30 + Math.floor(r.f / 4); fx({ money: amt, mood: 2 }); say(`${p.n} ให้เงิน ฿${amt} — "เอาไปใช้ให้ดีนะ"`);
    }]] : []),
    ['ให้ของขวัญ', () => giftPanel(p)]];
}

const _poSib = personOpts;
personOpts = p => p.fam === 'sib' ? sibOpts(p) : _poSib(p);

const _frSib = familyRows;
familyRows = () => [..._frSib(),
  ...(st.sibs || []).map(s => row(thumb(sheet(palOf(s.look))), `${s.n} (${sibLabel(s)}, อายุ ${sibAge(s)})`,
    `${s.g === 'f' ? 'หญิง' : 'ชาย'} · 🧬 ${dnaLine(s.from)} · นิสัย ${TRAIT_TH[s.trait] || s.trait} · ความสนิท ${Math.floor(relOf(s.id).f)}/100`))];

// rebuild household entities whenever the family is rebuilt (start, new generation, moving)
const _mfSib = makeFamily;
makeFamily = () => { _mfSib(); ensureSibs(); };
const _ptSib = passTorch;
passTorch = k => { st.sibs = undefined; _ptSib(k); ensureSibs(); };
const _startSib = start;
start = saved => { _startSib(saved); ensureSibs(); };

console.assert(typeof ensureSibs === 'function', 'siblings ready');
