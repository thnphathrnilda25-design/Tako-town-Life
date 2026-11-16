'use strict';
// NPC life core: long and short-term goals, six needs (hunger, energy, fun, loneliness, stress, privacy),
// event-driven schedules, weekly routines, personal hobbies, life-stage flavour, personal events and
// NPC-to-NPC relationship labels. Loaded after townlife so it can wrap slotOf/tick/seasonTick without
// replacing the existing walk, shop and romance systems.

// ---- persistent, lazily created state -------------------------------------------------------------
const NL = () => st.npcLife || (st.npcLife = {});
const NL_HB = {
  fish: { n: 'ตกปลา', ic: '🎣', slot: 'pond' },
  read: { n: 'อ่านหนังสือ', ic: '📚', slot: 'library' },
  garden: { n: 'ทำสวน', ic: '🌱', slot: 'park' },
  dance: { n: 'เต้นรำ', ic: '💃', slot: 'plaza' },
  collect: { n: 'สะสมของ', ic: '🔍', slot: 'pond' },
  game: { n: 'เล่นเกม', ic: '🎮', slot: 'home' },
  cook: { n: 'ทำอาหาร', ic: '🍳', slot: 'home' },
  music: { n: 'เล่นดนตรี', ic: '🎵', slot: 'park' },
  sport: { n: 'วิ่งออกกำลังกาย', ic: '🏃', slot: 'park' },
};
const NL_GOAL = {
  study: { n: 'เรียนให้จบ', d: 'ตั้งใจเรียนและสอบให้ผ่าน', done: 'เรียนจบแล้ว', ic: '📘', a: 'study' },
  club: { n: 'สร้างผลงานให้ชมรม', d: 'ทำงานศิลปะกับเพื่อนในชมรม', done: 'ผลงานชมรมเสร็จแล้ว', ic: '🎨', a: 'social' },
  promo: { n: 'ได้เลื่อนตำแหน่ง', d: 'ทำงานให้ดีขึ้นและเรียนรู้งานใหม่', done: 'ได้เลื่อนตำแหน่ง', ic: '📈', a: 'work' },
  save: { n: 'เก็บเงินซื้อบ้าน', d: 'ออมเงินจากค่าจ้าง', done: 'เก็บเงินครบแล้ว', ic: '💰', a: 'work' },
  balance: { n: 'มีเวลาพักผ่อนมากขึ้น', d: 'หาเวลาออกไปพักผ่อนบ้าง', done: 'ชีวิตสมดุลขึ้นแล้ว', ic: '🌤️', a: 'rest' },
  cafe: { n: 'เปิดคาเฟ่ของตัวเอง', d: 'เก็บเงินและฝึกฝีมือกาแฟ', done: 'เปิดคาเฟ่ของตัวเองแล้ว', ic: '☕', a: 'cook' },
  latte: { n: 'ชนะประกวดลาเต้อาร์ต', d: 'ฝึกศิลปะลาเต้ทุกวัน', done: 'ชนะประกวดลาเต้อาร์ต', ic: '🥛', a: 'cook' },
  book: { n: 'ตีพิมพ์หนังสือของตัวเอง', d: 'เขียนงานทุกวัน', done: 'ตีพิมพ์หนังสือได้แล้ว', ic: '📖', a: 'book' },
  client: { n: 'มีลูกค้าประจำ', d: 'ส่งงานตรงเวลาและรักษาคุณภาพ', done: 'มีลูกค้าประจำแล้ว', ic: '🤝', a: 'work' },
  marathon: { n: 'วิ่งมาราธอนให้จบ', d: 'ซ้อมวิ่งทุกวัน', done: 'วิ่งมาราธอนจบแล้ว', ic: '🏅', a: 'health' },
  trophy: { n: 'คว้าแชมป์เมือง', d: 'ฝึกซ้อมและแข่งขัน', done: 'คว้าแชมป์เมืองได้แล้ว', ic: '🏆', a: 'health' },
  expand: { n: 'ขยายร้านเฟอร์นิเจอร์', d: 'ขายของและเก็บกำไร', done: 'ขยายร้านสำเร็จ', ic: '🛋️', a: 'work' },
  design: { n: 'ออกแบบโซฟาที่ดีที่สุด', d: 'ทำงานออกแบบทุกวัน', done: 'ออกแบบโซฟาต้นแบบได้แล้ว', ic: '✏️', a: 'design' },
  garden: { n: 'ทำสวนให้เสร็จ', d: 'ดูแลต้นไม้ทุกวัน', done: 'สวนสวยเสร็จแล้ว', ic: '🌷', a: 'garden' },
  story: { n: 'เล่าเรื่องเมืองให้คนรุ่นใหม่ฟัง', d: 'หาเพื่อนคุยและเล่าความหลัง', done: 'เรื่องเล่าของเมืองถูกบันทึกไว้', ic: '🗣️', a: 'story' },
  social: { n: 'มีเพื่อนสนิทในเมือง', d: 'ใช้เวลากับผู้คนและดูแลมิตรภาพ', done: 'มีเพื่อนสนิทแล้ว', ic: '🫂', a: 'social' },
  family: { n: 'มีเวลาอยู่กับครอบครัว', d: 'กลับบ้านและใช้เวลาด้วยกัน', done: 'ครอบครัวอบอุ่นขึ้น', ic: '👪', a: 'family' },
  health: { n: 'ดูแลสุขภาพให้แข็งแรง', d: 'ออกกำลังกายและพักผ่อน', done: 'สุขภาพดีขึ้น', ic: '💪', a: 'health' },
};
const NL_POOL = {
  student: ['study', 'club', 'social'], worker: ['promo', 'save', 'balance'], barista: ['cafe', 'latte', 'social'],
  clerk: ['promo', 'save', 'balance'], freelance: ['book', 'client', 'balance'], athlete: ['marathon', 'trophy', 'health'],
  shopkeeper: ['expand', 'design', 'save'], retiree: ['garden', 'story', 'family'],
};
const NL_FALLBACK = ['save', 'balance', 'social'];
const NL_HOBBIES = {
  student: ['game', 'read', 'collect', 'music'], worker: ['read', 'game', 'cook', 'music'], barista: ['cook', 'music', 'read'],
  clerk: ['game', 'read', 'collect'], freelance: ['read', 'music', 'collect'], athlete: ['sport', 'read', 'music'],
  shopkeeper: ['garden', 'cook', 'read'], retiree: ['garden', 'fish', 'read', 'collect'],
};
const NL_TRAIT_HB = { lazy: ['game', 'cook'], kind: ['garden', 'fish'], smart: ['read', 'collect'], cheerful: ['dance', 'music'], shy: ['read', 'game'], grumpy: ['fish', 'garden'] };
const NL_SHORT = {
  food: { n: 'หาอะไรอร่อยกิน', ic: '🍜', a: 'food' }, social: { n: 'ไปคุยกับเพื่อน', ic: '💬', a: 'social' },
  rest: { n: 'พักผ่อนให้เต็มที่', ic: '🌤️', a: 'rest' }, hobby: { n: 'ทำงานอดิเรก', ic: '🎨', a: 'hobby' },
  errand: { n: 'ซื้อของใช้ในบ้าน', ic: '🛒', a: 'shop' }, health: { n: 'ออกกำลังกาย', ic: '🏃', a: 'health' },
  family: { n: 'ใช้เวลากับครอบครัว', ic: '👪', a: 'family' },
};
const NL_ROUTINES = [
  { k: 'laundry', n: 'ซักผ้า', ic: '🧺', slot: 'home', h: [9, 12] },
  { k: 'groceries', n: 'ซื้อของเข้าบ้าน', ic: '🛒', slot: 'mart', h: [16, 19] },
  { k: 'family', n: 'เยี่ยมครอบครัว', ic: '👪', slot: 'home', h: [17, 20] },
  { k: 'chapel', n: 'ไปโบสถ์', ic: '⛪', slot: 'chapel', h: [9, 11] },
  { k: 'sport', n: 'เล่นกีฬา', ic: '⚽', slot: 'park', h: [16, 18] },
  { k: 'friends', n: 'นัดเพื่อน', ic: '☕', slot: 'cafe', h: [18, 20] },
  { k: 'rest', n: 'พักผ่อน', ic: '🌤️', slot: 'park', h: [14, 17] },
];
const NL_HISTORY = ['เคยเห็นเมืองนี้ตอนยังเป็นทุ่งนา', 'เคยเป็นช่างไม้สร้างบ้านหลังแรกของเมือง', 'เคยสอนหนังสือให้เด็กทั้งเมือง', 'เคยเปิดร้านกาแฟเล็ก ๆ ริมถนน', 'เคยช่วยงานเทศกาลทุกปีจนกลายเป็นประเพณี'];
const NL_PLACE = { home: 'บ้าน', pond: 'บ่อปลา', library: 'ห้องสมุด', park: 'สวนสาธารณะ', plaza: 'ลานเมือง', mart: 'มินิมาร์ท', cafe: 'คาเฟ่', furni: 'ร้านเฟอร์นิเจอร์', school: 'โรงเรียน', office: 'ออฟฟิศ', clinic: 'คลินิก', chapel: 'โบสถ์', gym: 'ฟิตเนส', flower: 'ร้านดอกไม้', cinema: 'โรงหนัง' };
ANCHORS.clinic = ANCHORS.clinic || [2, 28];
const NL_EVENTS = [
  { k: 'sick', n: 'ป่วยหนัก', ic: '🤒', days: 2, w: 2, can: p => p.age >= 6, news: p => `🤒 ${p.n} ป่วยหนัก ต้องพักรักษาตัวอยู่บ้าน` },
  { k: 'jobloss', n: 'ตกงาน', ic: '📉', days: 3, w: 1, can: p => p.age >= 18 && p.age < 60 && !['retiree', 'student'].includes(p.role), news: p => `📉 ${p.n} ตกงาน กำลังหางานใหม่` },
  { k: 'interview', n: 'วันสัมภาษณ์งาน', ic: '💼', days: 1, w: 1, can: p => p.age >= 18 && p.age < 60, news: () => null },
  { k: 'exam', n: 'ช่วงสอบ', ic: '📚', days: 1, w: 1, can: p => p.age >= 6 && p.age < 18, news: () => null },
  { k: 'fight', n: 'ทะเลาะกับเพื่อน', ic: '😤', days: 2, w: 1, can: p => p.age >= 6 && !!rivalOf(p), news: p => { const r = rivalOf(p); return `😤 ${p.n} กับ ${r?.n || 'เพื่อน'} ทะเลาะกัน`; } },
  { k: 'goodnews', n: 'ข่าวดี', ic: '🎉', days: 1, w: 2, can: () => true, news: p => `🎉 ${p.n} มีข่าวดี เล่าให้ใครต่อใครฟังอย่างมีความสุข` },
  { k: 'family', n: 'ญาติมาเยี่ยม', ic: '👪', days: 2, w: 1, can: p => p.age >= 18, news: () => null },
];

// ---- helpers ---------------------------------------------------------------------------------------
const nlPick = (arr, n) => arr[Math.floor(hash01(n) * arr.length)] || arr[0];
const nlClamp = v => Math.max(0, Math.min(100, v));
function nplOf(p) {
  const M = NL();
  let L = M[p.id];
  if (!L) {
    const pool = NL_POOL[p.role] || NL_FALLBACK;
    const g = nlPick(pool, p.k * 11 + 5);
    const roleHb = NL_HOBBIES[p.role] || NL_HOBBIES.worker, traitHb = NL_TRAIT_HB[p.trait];
    const hbPool = traitHb && hash01(p.k * 7 + 1) < .45 ? traitHb : roleHb;
    L = M[p.id] = { g, gp: 8 + Math.floor(hash01(p.k * 17 + 7) * 25), hb: nlPick(hbPool, p.k * 13 + 3),
      q: nlPick(Object.keys(NL_SHORT), p.k * 19 + 1), qp: 0, qd: 0, ev: null, gc: 0, gd: 0, grad: 0 };
  }
  if (!NL_GOAL[L.g]) L.g = nlPick(NL_POOL[p.role] || NL_FALLBACK, p.k * 11 + 5);
  if (!NL_HB[L.hb]) L.hb = nlPick(NL_HOBBIES[p.role] || NL_HOBBIES.worker, p.k * 13 + 3);
  if (L.q != null && !NL_SHORT[L.q]) L.q = nlPick(Object.keys(NL_SHORT), p.k * 19 + 1);
  return L;
}
const goalOf = p => NL_GOAL[nplOf(p).g] || NL_GOAL.balance;
const hobbyOf = p => NL_HB[nplOf(p).hb] || NL_HB.read;
function lifeNeed(p) {
  const n = needOf(p);
  if (n.lo === undefined) n.lo = 35 + hash01(p.k * 23 + 9) * 45;
  if (n.sx === undefined) n.sx = 15 + hash01(p.k * 29 + 4) * 35;
  if (n.pv === undefined) n.pv = 30 + hash01(p.k * 31 + 6) * 45;
  return n;
}
const stageOfNpc = p => p.age < 13 ? 'child' : p.age < 18 ? 'teen' : p.age < 60 ? 'adult' : 'elder';
function stageLine(p) {
  const s = stageOfNpc(p);
  return s === 'child' ? 'วัยเด็ก · กำลังเรียนรู้โลกและหาเพื่อนใหม่' : s === 'teen' ? 'วัยรุ่น · กำลังค้นหาความสนใจของตัวเอง'
    : s === 'adult' ? 'วัยทำงาน · แบ่งเวลาให้งาน ครอบครัว และความฝัน' : `วัยเกษียณ · ${NL_HISTORY[p.k % NL_HISTORY.length]}`;
}
const routineOf = p => NL_ROUTINES[((p.k * 3 + weekday()) % 7 + 7) % 7];
function rivalOf(p) {
  let worst = null, v = -1;
  for (const q of people) {
    if (q === p || q.fam || st.gone?.[q.id]) continue;
    const a = aff(p, q); if (a < v) { v = a; worst = q; }
  }
  return worst;
}
function bondLabel(p, q) {
  if (p.mate === q.id) return 'คู่ชีวิต';
  const a = aff(p, q);
  if (a >= 2) return 'เพื่อนสนิท';
  if (a >= 1) return 'เพื่อน';
  if (a <= -2) return 'คนที่ไม่ถูกกัน';
  if (a <= -1) return 'ไม่ค่อยถูกกัน';
  if (q.home === p.home) return 'คนในบ้าน';
  return 'คนรู้จัก';
}
function bondsOf(p) {
  const list = people.filter(q => q !== p && !q.fam && !st.gone?.[q.id]).map(q => ({ q, v: aff(p, q) + (p.mate === q.id ? 4 : 0) + (q.home === p.home ? .4 : 0) }));
  return { best: list.filter(x => x.v >= .5).sort((a, b) => b.v - a.v).slice(0, 3), worst: list.filter(x => x.v <= -1).sort((a, b) => a.v - b.v).slice(0, 1) };
}
function goalActive(p, a) {
  const s = p.slot, h = hour();
  switch (a) {
    case 'study': return s === 'school' || s === 'library';
    case 'work': return WORKS[p.role] === s;
    case 'social': return !!p.chatWith || s === 'plaza' || s === 'cafe';
    case 'health': return s === 'park' || s === 'pond' || s === 'gym';
    case 'hobby': return s === hobbyOf(p).slot;
    case 'shop': return s === 'mart' || s === 'furni';
    case 'family': return s === 'home' && (h >= 17 || !!p.mate);
    case 'rest': return s === 'home' || s === 'park' || s === 'library';
    case 'cook': return s === 'cafe' || s === 'home';
    case 'book': return s === 'library' || s === 'home';
    case 'design': return s === 'furni' || s === 'home';
    case 'garden': return s === 'park' || s === 'home';
    case 'story': return s === 'plaza' || s === 'cafe' || s === 'park';
    case 'food': return s === 'cafe' || s === 'mart' || s === 'home';
    default: return false;
  }
}
function nextGoal(p, cur, L) {
  let pool = (NL_POOL[p.role] || NL_FALLBACK).filter(k => k !== cur);
  if (p.role === 'student' && L.grad) pool = pool.filter(k => k !== 'study');
  if (!pool.length) pool = NL_FALLBACK.filter(k => k !== cur);
  return nlPick(pool, p.k * 23 + day() * 7 + 11) || cur;
}
function completeGoal(p, L, g) {
  const d = day();
  L.gp = 0; L.gc = (L.gc || 0) + 1; L.gd = d;
  townNews(`🎯 ${p.n} ทำสำเร็จ: ${g.done}`);
  if (p.role === 'student' && L.g === 'study') {
    L.grad = 1;
    L.ev = { k: 'graduate', n: 'เพิ่งเรียนจบ', ic: '🎓', until: d, with: null, withName: null };
    townNews(`🎓 ${p.n} เรียนจบแล้ว!`);
  }
  if ((st.rel[p.id]?.f || 0) >= 30 && typeof push === 'function') push(p.id, { t: 'in', kind: 'chat', replied: true, text: `เป้าหมายของฉันสำเร็จแล้ว! ${g.done} 🎉` });
  L.g = nextGoal(p, L.g, L);
}
function progressLife(p, L, n, m) {
  const g = NL_GOAL[L.g] || NL_GOAL.balance;
  if (goalActive(p, g.a)) L.gp = Math.min(100, L.gp + m * .026);
  if (L.gp >= 100) completeGoal(p, L, g);
  const q = L.q && NL_SHORT[L.q];
  if (q && goalActive(p, q.a)) L.qp = Math.min(100, L.qp + m * .32);
  if (q && L.qp >= 100) { L.qp = 0; L.q = null; L.qDone = day(); n.sx = Math.max(0, n.sx - 6); n.lo = Math.max(0, n.lo - 4); }
}

// ---- needs: loneliness, stress and privacy join hunger, energy and fun -------------------------------
const _tickNPL = tick;
tick = m => {
  _tickNPL(m); if (!people.length || m <= 0) return;
  for (const p of people) {
    if (p.fam || p.visiting || st.gone?.[p.id]) continue;
    const n = lifeNeed(p), s = p.slot, L = nplOf(p), asleep = s === 'in' && p.hidden;
    const social = !!(p.chatWith || s === 'plaza' || s === 'cafe' || s === 'school' || s === 'office');
    const working = WORKS[p.role] === s, relaxing = s === 'home' || s === 'park' || s === 'pond' || s === 'library' || hobbyOf(p).slot === s;
    n.lo = nlClamp(n.lo + (asleep ? -m * .01 : social ? -m * .055 : m * .022));
    n.sx = nlClamp(n.sx + (asleep ? -m * .04 : working ? m * .018 : relaxing ? -m * .028 : m * .004)
      + (n.h < 20 || n.e < 15 ? m * .02 : 0) + (L.ev && (L.ev.k === 'sick' || L.ev.k === 'fight' || L.ev.k === 'jobloss') ? m * .03 : 0));
    n.pv = nlClamp(n.pv + (asleep || s === 'home' ? -m * .035 : social ? m * .018 : m * .006));
    progressLife(p, L, n, m);
  }
};

// ---- schedules: events, routines and hobbies override free time, never the job itself ----------------
function nplSlot(p, base) {
  const h = hour(), n = lifeNeed(p), L = nplOf(p), ev = L.ev, work = WORKS[p.role] === base;
  if (typeof festOn === 'function' && festOn() && h >= 17) return base;                 // festival evenings belong to the plaza
  if (typeof nightClerk === 'function' && nightClerk(p)) return base;                   // the 24-hour mart keeps its night shift
  const weekly = typeof weeklyEvent === 'function' ? weeklyEvent() : null;
  if (weekly && base === weekly.place) return base;                                     // weekly event gathering wins
  if (ev) {
    if (ev.k === 'sick') return h >= 9 && h < 18 && p.k % 3 === 0 ? 'clinic' : 'home';
    if (ev.k === 'jobloss' && work) return h < 12 ? 'home' : 'library';
    if (ev.k === 'interview' && h >= 9 && h < 12) return 'office';
    if (ev.k === 'exam' && h >= 8 && h < 15) return 'school';
    if (ev.k === 'fight' && h >= 17 && h < 21) return 'home';
    if (ev.k === 'goodnews' && h >= 16 && h < 21) return 'cafe';
    if (ev.k === 'family' && h >= 10 && h < 20 && !work) return 'home';
    if (ev.k === 'graduate' && h >= 16 && h < 21) return 'plaza';
  }
  if (work) return base;
  if (n.h < 22 || n.e < 18) return base;
  if (n.sx > 78) return h >= 18 ? 'home' : (h < 12 ? 'library' : 'park');
  if (n.lo > 78) return h >= 18 ? 'plaza' : 'cafe';
  if (n.pv > 78) return 'home';
  if (p.age < 13 && h >= 19) return 'home';
  if (p.mate && h >= 20 && h < 22.5) return 'home';
  const rt = routineOf(p);
  if (rt && h >= rt.h[0] && h < rt.h[1] && rt.slot !== base) return rt.slot;
  const hb = hobbyOf(p);
  if (hb && h >= 9 && h < 20.5 && base !== hb.slot && (base === 'home' ? h < 19.5 : true) && hash01(p.k * 7 + day() * 3) < .55) return hb.slot;
  return base;
}
const _slotNPL = slotOf;
slotOf = p => {
  const base = _slotNPL(p);
  if (p.fam || p.visiting || st.gone?.[p.id] || base === 'in') return base;
  return nplSlot(p, base);
};

// ---- daily: fresh short-term goals, personal events, goal news ---------------------------------------
function pickEvent(p) {
  const pool = [];
  for (const e of NL_EVENTS) if ((!e.can || e.can(p)) && (e.k !== 'jobloss' || p.role !== 'retiree')) for (let i = 0; i < (e.w || 1); i++) pool.push(e);
  return pool.length ? nlPick(pool, p.k * 43 + day() * 17 + 5) : null;
}
function nplDaily() {
  const d = day();
  if (st.nplDay === d) return;
  st.nplDay = d;
  const ps = people.filter(p => !p.fam && !st.gone?.[p.id]);
  for (const p of ps) {
    const L = nplOf(p);
    if (L.qd !== d) { L.q = nlPick(Object.keys(NL_SHORT), p.k * 19 + d * 3 + 1); L.qp = 0; L.qd = d; L.qDone = 0; }
  }
  for (const p of ps) {
    const L = nplOf(p);
    if (!L.ev || d <= L.ev.until) continue;
    const e = L.ev; L.ev = null;
    if (e.k === 'fight') townNews(`🕊️ ${p.n} กับ ${e.withName || 'เพื่อน'} คืนดีกันแล้ว`);
    if (e.k === 'jobloss') townNews(`💼 ${p.n} ได้งานใหม่แล้ว`);
  }
  let started = 0;
  const offset = ps.length ? (d * 7) % ps.length : 0;
  for (let i = 0; i < ps.length; i++) {
    if (started >= 2) break;
    const p = ps[(offset + i) % ps.length];
    const L = nplOf(p); if (L.ev) continue;
    if (hash01(p.k * 37 + d * 13 + 7) > .055) continue;
    const ev = pickEvent(p); if (!ev) continue;
    const rival = ev.k === 'fight' ? rivalOf(p) : null;
    L.ev = { k: ev.k, n: ev.n, ic: ev.ic, until: d + ev.days - 1, with: rival?.id || null, withName: rival?.n || null };
    started++;
    const news = ev.news(p); if (news) townNews(news);
    const n = lifeNeed(p);
    if (ev.k === 'sick') n.sx = Math.min(100, n.sx + 15);
    if (ev.k === 'fight') n.sx = Math.min(100, n.sx + 20);
    if (ev.k === 'goodnews') { n.sx = Math.max(0, n.sx - 20); n.lo = Math.max(0, n.lo - 15); }
  }
}
const _seasonNPL = seasonTick;
seasonTick = () => { _seasonNPL(); if (player) nplDaily(); };

// ---- readable thoughts, chat lines and a profile section ---------------------------------------------
function nplChat(p) {
  const L = nplOf(p), g = goalOf(p), hb = hobbyOf(p), n = lifeNeed(p), rt = routineOf(p), pool = [
    `${g.n}คือเป้าหมายของฉัน ตอนนี้ ${Math.round(L.gp)}% แล้ว`,
    `วัน${WEEK[weekday()]} ฉันต้อง${rt.n}`,
    `งานอดิเรกของฉันคือ${hb.n} ${hb.ic}`,
  ];
  if (L.ev) pool.unshift(`${L.ev.ic} ${L.ev.n}…`);
  if (n.lo > 70) pool.push('ช่วงนี้เหงาจัง อยากมีเพื่อนคุยด้วย');
  if (n.sx > 70) pool.push('เครียดจัง งานเยอะเหลือเกิน');
  if (n.pv > 70) pool.push('ขอเวลาส่วนตัวสักหน่อยนะ');
  if (L.gp >= 70) pool.push(`ใกล้ถึงเป้าหมาย${g.n}แล้ว!`);
  return pool[Math.floor(hash01(p.k * 5.7 + day() * 2.3) * pool.length)];
}
const _chatNPL = chatLine;
chatLine = (p, o, n) => {
  if (p.fam || st.gone?.[p.id]) return _chatNPL(p, o, n);
  if (hash01(n * 5.7 + p.k) < .3) { const s = nplChat(p); return s.length > 30 ? s.slice(0, 29) + '…' : s; }
  return _chatNPL(p, o, n);
};
const _mindNPL = mindOf;
mindOf = p => {
  if (p.fam) return _mindNPL(p);
  const L = nplOf(p), g = goalOf(p), hb = hobbyOf(p), n = lifeNeed(p), c = [];
  if (L.ev) c.push([L.ev.ic, `ตอนนี้${L.ev.n}…`, L.ev.k === 'goodnews' ? 'happy' : L.ev.k === 'sick' || L.ev.k === 'jobloss' ? 'sad' : 'neutral']);
  if (n.lo > 70) c.push(['🫂', 'เหงาจัง อยากมีคนคุยด้วย', 'sad']);
  if (n.sx > 70) c.push(['😰', 'เครียดจนหัวจะระเบิด', 'sad']);
  if (n.pv > 70) c.push(['🤫', 'อยากอยู่คนเดียวสักพัก', 'neutral']);
  if (L.gp >= 75) c.push(['🎯', `อีกนิดเดียวก็${g.n}แล้ว!`, 'happy']);
  if (hour() >= 9 && hour() < 20 && p.slot === hb.slot) c.push([hb.ic, `${hb.n}นี่แหละความสุขของฉัน`, 'happy']);
  return c.length && hash01(p.k + Math.floor(now() / 9000)) < .65 ? c[0] : _mindNPL(p);
};
const _poNPL = personOpts;
personOpts = p => {
  const out = _poNPL(p);
  if (p.fam || st.gone?.[p.id]) return out;
  out.push([`🎯 เป้าหมายชีวิตของ${p.n}`, () => {
    const L = nplOf(p), g = goalOf(p), hb = hobbyOf(p), ev = L.ev ? ` · ตอนนี้${L.ev.n}` : '';
    say(`${p.n}: "เป้าหมายของฉันคือ${g.n} (${Math.round(L.gp)}%) · งานอดิเรก ${hb.ic}${hb.n}${ev}"`);
  }]);
  return out;
};
function nplProfile(p) {
  const L = nplOf(p), g = goalOf(p), hb = hobbyOf(p), n = lifeNeed(p), rt = routineOf(p), b = bondsOf(p);
  const out = [el('div', { className: 'sec' }, `🌱 ชีวิตของ ${p.n}`),
    row(g.ic, g.n, `เป้าหมายระยะยาว ${Math.round(L.gp)}% · ${g.d}`),
    row('📌', 'เป้าหมายวันนี้', L.q ? `${NL_SHORT[L.q].ic}${NL_SHORT[L.q].n} ${Math.round(L.qp)}%` : 'ทำสำเร็จแล้ววันนี้ 🎉'),
    row(hb.ic, 'งานอดิเรก', `${hb.n} · ช่วงที่ชอบทำ: ${NL_PLACE[hb.slot] || hb.slot}`),
    row(rt.ic, `วัน${WEEK[weekday()]}`, rt.n),
  ];
  if (L.grad) out.push(row('🎓', 'การศึกษา', 'เรียนจบแล้ว'));
  if (L.ev) out.push(row(L.ev.ic, 'เหตุการณ์ส่วนตัว', `${L.ev.n} · ถึงวันที่ ${L.ev.until}`));
  out.push(row('💗', 'ความต้องการ', `เหงา ${Math.round(n.lo)} · เครียด ${Math.round(n.sx)} · ต้องการส่วนตัว ${Math.round(n.pv)}`));
  out.push(row('🤝', 'คนที่สนิท', b.best.length ? b.best.map(x => `${x.q.n} (${bondLabel(p, x.q)})`).join(' · ') : 'ยังไม่มีคนสนิท'));
  if (b.worst.length) out.push(row('⚔️', 'คนที่ไม่ถูกกัน', `${b.worst[0].q.n} (${bondLabel(p, b.worst[0].q)})`));
  out.push(row('🌿', 'ช่วงวัย', stageLine(p)));
  return out;
}
const _relProfileNPL = relProfileView;
relProfileView = id => {
  const out = _relProfileNPL(id);
  const p = people.find(q => q.id === id);
  return p && !p.fam && !st.gone?.[id] ? [...out, ...nplProfile(p)] : out;
};
const _drawNPL = drawEnt;
drawEnt = e => {
  _drawNPL(e);
  if (!e.person || e.fam || scene !== town || !player) return;
  if (typeof CFG !== 'undefined' && CFG.thoughts === false) return;
  if (Math.hypot(player.x - e.x, player.y - e.y) > 280) return;
  const n = lifeNeed(e), L = nplOf(e);
  const ic = L.ev ? L.ev.ic : n.sx > 75 ? '😰' : n.lo > 75 ? '🫂' : n.pv > 75 ? '🤫' : null;
  if (!ic || n.h < 20 || n.e < 15) return;
  g.font = '9px sans-serif'; g.textAlign = 'center'; g.fillText(ic, Math.round(e.x) - 10, Math.round(e.y) - 44); g.textAlign = 'left';
};

// ---- data checks ------------------------------------------------------------------------------------
console.assert(Object.values(NL_POOL).every(pool => pool.every(k => NL_GOAL[k])), 'every NPC goal is defined');
console.assert(Object.keys(NL_SHORT).every(k => NL_SHORT[k].n && NL_SHORT[k].a), 'short-term goals are defined');
console.assert(NL_ROUTINES.length === 7 && NL_ROUTINES.every(r => r.n && r.slot), 'weekly routines cover seven days');
console.assert(Object.values(NL_HB).every(h => h.n && h.slot), 'hobbies have a place');
console.assert(NL_EVENTS.every(e => e.n && e.ic && e.days > 0), 'personal events are complete');
