'use strict';
// Town life: townsfolk keep real hours (home by dark, lights out once asleep), feel hunger, tiredness and boredom,
// staff the shops in shifts (a shop with nobody working is closed), react to weather, walk with friends and dates,
// chat out loud, notice how you look and act, fall in love with each other, and text you on their own.
// Everything newsworthy also lands in the phone's 📰 news app.
const TL = { greetAt: {}, lit: {}, litAt: 0, open: {}, bub: 0, loveMap: null };
const clamp100 = v => Math.max(0, Math.min(100, v));
const nameOf = id => PEOPLE.find(p => p.id === id)?.n || id;

// ---- town news feed ----
var townNews = t => { const N = st.news || (st.news = []); if (N[0]?.t === t) return; N.unshift({ d: day(), h: Math.floor(hour()), t }); if (N.length > 40) N.length = 40; };
const _toastTL = toast;
toast = t => { _toastTL(t); const m = /^📰 ข่าวเมือง: (.*)$/su.exec(t); if (m) townNews(m[1]); else if (/^(🗣️|😤|🕊️|🕯️|💒|👶|👮|🚨|💕|💔|💍)/u.test(t)) townNews(t); };
APPS.push(['news', '📰', 'ข่าวเมือง']);
APP.news = () => { const N = st.news || []; return [el('div', { className: 'sec' }, '📰 ข่าวในเมือง'), ...(N.length ? N.map(n => row('🗞️', n.t, `วันที่ ${n.d} · ${String(n.h).padStart(2, '0')}:00`)) : [el('div', { className: 'sub' }, 'ยังไม่มีข่าว — ลองออกไปใช้ชีวิตในเมืองดูสิ')])]; };

// ---- real hours: everyone heads home in the evening; the town sleeps after 23:30 ----
Object.assign(SCHED, {
  student: [[6, 'home'], [7.5, 'school'], [12, 'plaza'], [13, 'school'], [15.5, 'park'], [17.5, 'home'], [19, 'in']],
  worker: [[6.5, 'home'], [7.5, 'cafe'], [8.5, 'office'], [12, 'plaza'], [13, 'office'], [17, 'home'], [18, 'mart'], [19.5, 'home'], [21, 'in']],
  barista: [[6, 'home'], [6.5, 'cafe'], [12, 'plaza'], [12.5, 'cafe'], [20.5, 'home'], [21.5, 'in']],
  clerk: [[7, 'home'], [8, 'mart'], [13, 'plaza'], [13.5, 'mart'], [21.5, 'home'], [22.5, 'in']],
  freelance: [[8, 'home'], [9.5, 'cafe'], [12.5, 'plaza'], [14, 'park'], [17.5, 'cafe'], [20, 'home'], [21.5, 'in']],
  athlete: [[5, 'park'], [8, 'home'], [10, 'park'], [14, 'plaza'], [17, 'park'], [19.5, 'home'], [21, 'in']],
  shopkeeper: [[7, 'home'], [8.5, 'furni'], [12.5, 'plaza'], [13, 'furni'], [19.5, 'home'], [20.5, 'in']],
  retiree: [[6, 'park'], [9, 'cafe'], [11, 'home'], [14, 'park'], [16, 'plaza'], [17.5, 'home'], [19, 'in']],
});
const WORKS = { student: 'school', worker: 'office', barista: 'cafe', clerk: 'mart', shopkeeper: 'furni' };
const FUN = ['park', 'plaza', 'pond', 'library', 'cinema', 'flower'];
const isOwl = p => !p.fam && p.age >= 18 && p.age < 60 && (p.k % 6 === 1 || (p.trait === 'lazy' && p.k % 2 === 0));   // night owls stay out late
const nightClerk = p => p.role === 'clerk' && p.id === TL.nightId;   // one clerk works the 24-hour mart's night shift (set each second in update)

// ---- needs: hunger, energy, fun; low needs pull people to food, bed or fun in their free time ----
const NEEDS = () => st.npcN || (st.npcN = {});
const needOf = p => NEEDS()[p.id] || (NEEDS()[p.id] = { h: 55 + hash01(p.k + 1) * 45, e: 60 + hash01(p.k + 2) * 40, f: 45 + hash01(p.k + 3) * 55 });
const _tickTL = tick;
tick = m => {
  _tickTL(m); if (!people.length || m <= 0) return;
  for (const p of people) {
    if (p.fam || p.visiting) continue; const n = needOf(p), s = p.slot, asleep = s === 'in' && p.hidden;
    n.h = clamp100(n.h - m * .05 + (p.hidden && (s === 'cafe' || s === 'home') ? m * .5 : 0) + (asleep ? m * .02 : 0));
    n.e = clamp100(n.e + (asleep ? m * .22 : p.hidden && s === 'home' ? m * .06 : -m * .045));
    n.f = clamp100(n.f - m * .035 + (FUN.includes(s) || p.chatWith ? m * .3 : 0));
  }
};
function needSlot(p, base, h) {
  if (h < 7 || h >= 21 || WORKS[p.role] === base || base === 'in') { p.needGo = null; return null; }
  const n = needOf(p);
  if ((p.needGo === 'h' && n.h > 75) || (p.needGo === 'e' && n.e > 70) || (p.needGo === 'f' && n.f > 75)) p.needGo = null;
  if (!p.needGo) p.needGo = n.e < 18 ? 'e' : n.h < 25 ? 'h' : n.f < 20 ? 'f' : null;
  return p.needGo === 'e' ? 'home' : p.needGo === 'h' ? (TL.open.cafe ? 'cafe' : 'mart') : p.needGo === 'f' ? FUN[(p.k + day()) % FUN.length] : null;
}
const _slotTL = slotOf;
slotOf = p => {
  const base = _slotTL(p); if (p.fam) return base;
  const h = hour(), m = ph().meet;
  if (m && m.id === p.id && day() === m.d && h >= m.hour - .5 && h < m.hour + 2) return base;   // a date with you wins
  if (festOn() && h >= 17) return base;                                                           // festival evenings at the plaza
  if (nightClerk(p)) return h >= 21 || h < 7 ? 'mart' : h < 15 ? 'in' : h < 17.5 ? FUN[p.k % FUN.length] : 'home';
  if (h >= 23.5 || h < 5) return 'in';
  if (isOwl(p) && h >= 19.5 && !wet() && WORKS[p.role] !== base) return h < 21.5 ? 'plaza' : 'cafe';
  const ev = typeof weeklyEvent === 'function' ? weeklyEvent() : null;
  if (ev && WORKS[p.role] !== base && base !== 'in' && (p.k % 3 === 0 || isOwl(p))) return ev.place;
  const need = needSlot(p, base, h); if (need) return need;
  if (weatherOf() === 'sun' && seasonOf().i === 1 && (base === 'plaza' || base === 'park') && p.k % 2) return 'pond';   // hot sunny days: down by the water
  return base;
};

// ---- shifts: a shop is open only while someone who works there is in ----
const SHOPS = { cafe: ['คาเฟ่', 'barista'], mart: ['มินิมาร์ท', 'clerk'], furni: ['ร้านเฟอร์นิเจอร์', 'shopkeeper'] };
const staffOf = act => people.filter(p => !p.fam && alive(p) && p.role === SHOPS[act][1] && p.slot === act);
const shopOpen = act => TL.open[act] !== false;
const hoursText = act => act === 'mart' ? (people.some(nightClerk) ? 'เปิด 24 ชั่วโมง' : 'เปิด 08:00–21:30') : act === 'cafe' ? 'เปิด 06:30–20:30' : 'เปิด 08:30–19:30';
for (const [act, [name]] of Object.entries(SHOPS)) for (const t of town.targets.filter(t => t.name === name)) {
  const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { configurable: true, get() {
    const o = base.call(t);
    if (shopOpen(act)) { const s = staffOf(act)[0]; return s ? [[`👋 คุยกับ${s.n} (${ROLE_NAME[s.role] || 'พนักงาน'})`, () => talk(s)], ...o] : o; }
    return [[`🔒 ${name}ปิดแล้ว`, () => say(`${name}ปิดแล้ว พนักงานกลับบ้านกันหมด · ${hoursText(act)}`)], ...o.filter(([l]) => /งาน|กะ/.test(l))];
  } });
}

// ---- weather: one in three has no umbrella and runs for cover with a newspaper over their head ----
const _propTL = updateProp; updateProp = p => { _propTL(p); if (wet() && p.k % 3 === 0) p.prop = 'paper'; };
const _dppTL = drawPersonProp;
drawPersonProp = e => {
  if (e.prop === 'paper') { const x = Math.round(e.x), y = Math.round(e.y); R('#2a1a2e', x - 10, y - 42, 20, 4); R('#f4f0e4', x - 9, y - 41, 18, 2); R('#a8a090', x - 6, y - 41, 8, 1); }
  e.saying = !!(e.chatWith && TL.bub < 6 && player && Math.hypot(player.x - e.x, player.y - e.y) < 300);
  _dppTL(e);
};

// ---- chatter you can read, greetings, and remarks about you ----
function speech(x, y, text, bg = '#fffdf4') {
  g.font = '600 9px Mitr, "Leelawadee UI", Tahoma, sans-serif'; const w = Math.ceil(g.measureText(text).width) + 10, bx = Math.round(x - w / 2), by = Math.round(y);
  R('#2a1a2e', bx - 1, by - 1, w + 2, 16); R(bg, bx, by, w, 14); R(bg, x - 2, by + 14, 4, 2); R('#2a1a2e', x - 1, by + 16, 2, 1);
  g.fillStyle = '#3a2a3e'; g.textBaseline = 'middle'; g.textAlign = 'center'; g.fillText(text, x, by + 7.5); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}
function chatLine(p, o, n) {
  const L = [wet() ? 'ฝนตกทั้งวันเลยเนอะ' : weatherOf() === 'snow' ? 'หนาวจนมือชาเลย' : 'อากาศดีจังวันนี้', 'เมื่อวานไปดูหนังมา สนุกมาก', 'คาเฟ่มีเมนูใหม่นะ', 'ช่วงนี้งานยุ่งสุดๆ', 'วันหยุดไปไหนกันดี?', `${o.n} ตัดผมใหม่เหรอ?`, 'แมวที่สวนน่ารักมาก'];
  if (festOn()) L.push(`ไป${festOn().n}กันไหม?`);
  const ev = typeof weeklyEvent === 'function' ? weeklyEvent() : null; if (ev) L.push(`คืนนี้มี${ev.n}นะ`);
  const nw = st.news?.[0]; if (nw && day() - nw.d < 3) L.push('ได้ข่าวไหม? ' + nw.t.replace(/^\S+\s/u, ''));
  const rep = townRep(); L.push(`รู้จัก${st.name}ไหม? ${rep >= 20 ? 'คนดีมากเลย' : rep <= -10 ? 'ได้ยินแต่เรื่องไม่ดี' : 'เห็นบ่อยๆ นะ'}`);
  if (loveOf(p) === o.id) L.push('คิดถึงจัง 💕', 'คืนนี้ไปเดทที่ไหนดี?', 'อยู่ด้วยกันแบบนี้มีความสุขจัง');
  const nd = needOf(p); if (nd.h < 35) L.push('ท้องร้องแล้ว ไปกินข้าวกัน'); if (nd.e < 30) L.push('ง่วงมากเลย…'); if (nd.f < 30) L.push('เบื่อจัง หาอะไรทำกัน');
  const s = L[Math.floor(hash01(n * 7.31 + p.k * 1.7) * L.length)];
  return s.length > 30 ? s.slice(0, 29) + '…' : s;
}
const lookNow = () => typeof LOOKS !== 'undefined' ? LOOKS.find(L => lookIds(L, st.look.g).every(id => Object.values(st.wear || {}).includes(id))) : null;
function noticeLine(p) {
  const r = relOf(p.id), rep = townRep(), Lk = lookNow(), b = typeof B === 'function' ? B() : {}, wanted = st.wanted?.lv || 0;
  if (wanted) return ['นั่นคนที่ตำรวจตามตัวอยู่นี่! 😨', 'scared'];
  if ((r.h || 0) >= 40) return ['…หึ', 'angry'];
  if (b.injured > day()) return ['เจ็บตรงไหนรึเปล่า? ดูแลตัวเองด้วยนะ', 'care'];
  if (st.energy < 20) return ['ดูเหนื่อยๆ นะ พักผ่อนบ้าง', 'care'];
  if (Lk && hash01(p.k + day()) < .6) return [`ลุค${Lk.n.replace(/^\S+\s/u, '')}เท่มาก! 😍`, 'compliment'];
  if (festOn()) return [`สุขสันต์${festOn().n}! ${festOn().ic}`, 'warm'];
  if (r.f >= 40 || p.id === st.partner || p.id === st.spouse) return [p.id === st.partner || p.id === st.spouse ? `${st.name}! คิดถึงจัง 💕` : `เฮ้ ${st.name}! สบายดีไหม?`, 'warm'];
  if (rep >= 30) return [`สวัสดี${st.name}! 😊`, 'warm'];
  if (rep <= -20) return ['…', 'cold'];
  return hash01(p.k * 3 + day()) < .35 ? [p.g === 'f' ? 'สวัสดีค่ะ' : 'สวัสดีครับ', 'warm'] : null;
}
const _chTL = chatHook;
chatHook = (p, title, opts) => {
  _chTL(p, title, opts);
  const n = !p.fam && Math.random() < .3 ? noticeLine(p) : null;
  if (n && TK && n[1] !== 'warm') { const o = TK.opts; line(`${p.n}: "${n[0]}"`, n[1] === 'compliment' || n[1] === 'care' ? 'happy' : n[1] === 'disgust' || n[1] === 'cold' ? 'sad' : 'angry'); TK.opts = o; render2(); }
};

// ---- friends and couples walk together ----
function leaderFor(p, s) {
  const lo = loveOf(p);
  return people.find(q => q !== p && !q.hidden && q.slot === s && q.pathFor === s && q.path && q.path.length > 2 && Math.hypot(q.x - p.x, q.y - p.y) < 90
    && (lo === q.id || q.mate === p.id || aff(p, q) >= 1));
}
const _upTL = updatePerson;
updatePerson = (p, dt) => {
  if (!p.fam && !p.visiting && !p.talking && !p.hidden) {
    const s = slotOf(p);
    if (s !== p.slot) { const L = leaderFor(p, s); if (L) { Object.assign(p, { slot: s, chatWith: null, doorT: 0, stuck: 0, pathFor: s, group: L.id }); p.path = L.path.map(w => ({ x: w.x + 12, y: w.y + 2 })); } else p.group = null; }
  }
  p.rush = wet() && p.k % 3 === 0;
  _upTL(p, dt);
};

// ---- NPC romance: dating, break-ups, engagements and weddings that move them in together ----
const NPC_LOVE = () => st.npcLove || (st.npcLove = {});
var loveOf = p => {
  if (!TL.loveMap) { TL.loveMap = {}; for (const c of Object.values(NPC_LOVE())) { TL.loveMap[c.a] = c.b; TL.loveMap[c.b] = c.a; } }
  return TL.loveMap[p.id] || null;
};
function romanceDaily() {
  const L = NPC_LOVE(), you = [st.partner, st.spouse, st.engaged, st.cohab];
  const singles = people.filter(p => !p.fam && alive(p) && !p.mate && p.age >= 18 && p.age <= 50 && !loveOf(p) && !you.includes(p.id));
  for (let i = 0; i < 3 && singles.length > 1; i++) {
    const a = singles[ri(singles.length)], b = singles.find(b => b !== a && b.g !== a.g && Math.abs(b.age - a.age) <= 10 && (aff(a, b) >= 1 || hash01(a.k * 13 + b.k + day()) < .12));
    if (b) { L[pairKey(a, b)] = { a: a.id, b: b.id, since: day() }; TL.loveMap = null; townNews(`💕 ${a.n} กับ ${b.n} เริ่มคบกันแล้ว`); break; }
  }
  for (const [k, c] of Object.entries(L)) {
    const A = PEOPLE.find(p => p.id === c.a), Bp = PEOPLE.find(p => p.id === c.b);
    if (!A || !Bp || !alive(A) || !alive(Bp) || A.mate || Bp.mate) { delete L[k]; continue; }
    if (aff(A, Bp) <= -1 || Math.random() < .03) { delete L[k]; A2()[k] = (A2()[k] || 0) - 1; townNews(`💔 ${A.n} กับ ${Bp.n} เลิกกันแล้ว`); }
    else if (!c.eng && day() - c.since >= 8 && Math.random() < .15) { c.eng = day(); townNews(`💍 ${A.n} ขอ ${Bp.n} แต่งงาน! เธอตอบตกลง`); }
    else if (c.eng && day() - c.eng >= 4) {
      const e = { t: 'marry', a: A.id, b: Bp.id, y: yearsPassed() }; world().ev.push(e); applyEvent(e, true); delete L[k];
      townNews(`💒 ${A.n} กับ ${Bp.n} แต่งงานกันแล้ว! ย้ายมาอยู่บ้านเดียวกัน`);
      if ((st.rel[A.id]?.f || 0) >= 30) push(A.id, { t: 'in', kind: 'chat', replied: true, text: 'เราแต่งงานแล้วนะ! ขอบคุณที่เป็นเพื่อนที่ดีมาตลอด 💒' });
    }
  }
  TL.loveMap = null;
}
const _poTL = personOpts;
personOpts = p => {
  let o = _poTL(p); const lo = !p.fam && loveOf(p);
  if (lo) o = [...o.filter(x => !/เดท|สารภาพ|ขอแต่งงาน|จีบ/.test(x[0])), [`💑 กำลังคบกับ${nameOf(lo)}`, () => say(`${p.n} มีแฟนแล้ว (${nameOf(lo)}) — ความรักของคนอื่นต้องเคารพนะ`)]];
  const F = st.favor; if (F && F.id === p.id && have(F.item)) o = [[`🎁 ส่ง${ITEMS[F.item].n}ที่ขอไว้`, () => {
    addItem(F.item, -1); st.money += F.pay; const r = relOf(p.id); r.f = Math.min(100, r.f + 8); if (typeof remember === 'function') remember(p.id, 'favor', 2, 'ช่วยหาของให้');
    st.favor = null; say(`${p.n}: "ขอบคุณมากเลย! นี่ค่าของ ฿${F.pay} นะ" (ความสนิท +8)`); save();
  }], ...o];
  return o;
};

// ---- townsfolk contact you: birthday wishes, favours, good-night texts, night-market invites ----
PLACES.plaza = ['ตลาดกลางคืน', 20];
function tlDaily() {
  if (st.tlDay === day()) return; st.tlDay = day();
  romanceDaily();
  const friends = contacts().filter(c => !c.fam);
  if ((day() - 1) % YEAR === 0 && day() > 1) {
    const fs = friends.filter(c => (st.rel[c.id]?.f || 0) >= 40).slice(0, 4);
    for (const c of fs) { push(c.id, { t: 'in', kind: 'chat', replied: true, text: 'สุขสันต์วันเกิดนะ! 🎂 ขอให้มีความสุขมากๆ' }); const gift = c.like?.[0]; if (gift && ITEMS[gift] && Math.random() < .5) { addItem(gift); toast(`🎁 ${c.n} ส่ง ${ITEMS[gift].ic} ${ITEMS[gift].n} มาให้เป็นของขวัญวันเกิด`); } }
    if (fs.length) toast(`🎂 เพื่อน ${fs.length} คนส่งคำอวยพรวันเกิดมา`);
  }
  const F = st.favor;
  if (F && day() > F.due) { relOf(F.id).f = Math.max(0, relOf(F.id).f - 4); push(F.id, { t: 'in', kind: 'chat', replied: true, text: 'ไม่เป็นไร… เดี๋ยวหาเองก็ได้ 😕' }); st.favor = null; }
  if (!st.favor && Math.random() < .35) {
    const pool = friends.filter(c => (st.rel[c.id]?.f || 0) >= 25), c = pool[ri(pool.length)];
    const item = MART_STOCK[ri(MART_STOCK.length)];
    if (c && ITEMS[item]?.p) { st.favor = { id: c.id, item, pay: ITEMS[item].p * 2 + 20, due: day() + 2 }; push(c.id, { t: 'in', kind: 'chat', replied: true, text: `ช่วยซื้อ${ITEMS[item].n}มาให้หน่อยได้ไหม? เดี๋ยวให้ ฿${st.favor.pay} 🙏 (เอามาให้ภายใน 2 วันนะ)` }); toast(`🙏 ${c.n} ขอให้ช่วยหา${ITEMS[item].n}`); }
  }
  const owl = friends.map(c => people.find(e => e.id === c.id)).find(e => e && isOwl(e) && (st.rel[e.id]?.f || 0) >= 30);   // contacts are records; isOwl needs the live entity's index
  if (owl && !ph().meet && Math.random() < .3) push(owl.id, { t: 'in', kind: 'invite', place: 'plaza', hour: 20, text: 'คืนนี้ไปเดินตลาดกลางคืนกันไหม? เจอกัน 20:00 ที่ลานเมือง 🏮' });
}
function tlTick() {
  const h = hour(), love = st.spouse || st.partner;
  if (love && h >= 21.5 && h < 23 && st.gnDay !== day()) { st.gnDay = day(); push(love, { t: 'in', kind: 'chat', replied: true, text: ['ฝันดีนะ 💕 พรุ่งนี้เจอกัน', 'วันนี้เหนื่อยไหม? พักผ่อนเยอะๆ นะ', 'คิดถึงจัง นอนหลับฝันดีนะ 🌙'][day() % 3] }); toast(`💬 ${nameOf(love)} ส่งข้อความมา`); }
}
const _sTTL = seasonTick; seasonTick = () => { _sTTL(); if (player) { tlDaily(); tlTick(); } };

// ---- every frame: shop status, lit windows, strangers going home, greetings ----
const _updTL = update;
update = dt => {
  _updTL(dt); if (!player) return; TL.bub = 0;
  const h = hour(), t = now();
  if ((TL.litAt += dt) > 1) {
    TL.litAt = 0;
    const clerks = people.filter(p => !p.fam && alive(p) && p.role === 'clerk'); TL.nightId = clerks.length > 1 ? clerks[clerks.length - 1].id : null;
    for (const act in SHOPS) TL.open[act] = staffOf(act).length > 0 || !people.some(p => !p.fam && alive(p) && p.role === SHOPS[act][1]);
    TL.lit = {}; for (const p of people) if (p.hidden && (p.slot === 'home' || (p.slot === 'in' && h >= 18 && h < 22 + (p.k % 3) * .5))) TL.lit[p.home] = 1;   // staggered bedtimes
    for (const f of folks) f.away = !festOn() && (h >= (f.age ? 18 : f === folks[0] ? 23 : 20.5) || h < 6.5);
  }
  if (scene !== town || menuOpen || panelOpen || busy) return;
  for (const p of people) {
    if (p.hidden || p.talking || p.chatWith || p.fam || Math.hypot(player.x - p.x, player.y - p.y) > 46 || t < (TL.greetAt[p.id] || 0)) continue;
    TL.greetAt[p.id] = t + 90000; const n = noticeLine(p); if (!n) continue;
    p.sayT = { s: n[0], until: t + 3200, bg: n[1] === 'warm' || n[1] === 'compliment' ? '#fffdf4' : n[1] === 'cold' || n[1] === 'angry' ? '#e8e0e8' : '#fff4d8' };
    if (n[1] === 'compliment' && st.complDay !== day()) { st.complDay = day(); fx({ mood: 4 }); }
    if (n[1] === 'disgust') { const r = relOf(p.id); r.f = Math.max(0, r.f - 1); }
    break;   // one remark at a time
  }
};
// lit windows: a home glows at night only while someone inside is still awake
const _dwTL = drawWindow;
drawWindow = (b, wx, wy, night) => {
  if (night && !b.act) { const i = BUILDINGS.indexOf(b); night = !!TL.lit[i] && hour() < 23.5; }
  else if (night && SHOPS[b.act]) night = shopOpen(b.act);
  _dwTL(b, wx, wy, night);
};
// bubbles: chat lines, remarks, low needs, couples' hearts
const _deTL = drawEnt;
drawEnt = e => {
  _deTL(e);
  if (!e.person || e.fam || scene !== town || !player || (typeof CFG !== 'undefined' && CFG.thoughts === false)) return;
  const t = now(), x = Math.round(e.x), y = Math.round(e.y), near = Math.hypot(player.x - e.x, player.y - e.y) < 300;
  if (!near) return;
  if (e.sayT && t < e.sayT.until) { speech(x, y - 62, e.sayT.s, e.sayT.bg); return; }
  if (e.chatWith && e.saying && TL.bub < 6) {
    const o = people.find(q => q.id === e.chatWith); if (!o) return; const n = Math.floor(t / 2600), speaker = (n % 2) ? (e.k < o.k ? e : o) : (e.k < o.k ? o : e);
    if (speaker === e) { TL.bub++; speech(x, y - 60, chatLine(e, o, n)); }
    return;
  }
  const lo = loveOf(e), mate = lo ? people.find(q => q.id === lo) : null;
  if (mate && !mate.hidden && Math.hypot(mate.x - e.x, mate.y - e.y) < 44 && e.k < mate.k && (t / 900 | 0) % 3 === 0) { const hx = (x + Math.round(mate.x)) >> 1; R('#e84a6a', hx - 3, y - 50, 2, 2); R('#e84a6a', hx + 1, y - 50, 2, 2); R('#e84a6a', hx - 4, y - 49, 8, 2); R('#e84a6a', hx - 3, y - 47, 6, 1); R('#e84a6a', hx - 1, y - 46, 2, 1); }
  const nd = needOf(e);
  if (nd.h < 20 || nd.e < 15) { g.font = '9px sans-serif'; g.textAlign = 'center'; g.fillText(nd.e < 15 ? '💤' : '🍔', x + 10, y - 44); g.textAlign = 'left'; }
};
const _mindTL = mindOf;
mindOf = p => {
  if (p.fam) return _mindTL(p); const n = needOf(p), c = [];
  if (n.h < 25) c.push(['🍔', 'หิวจนท้องร้องแล้ว ไปหาอะไรกินก่อนดีกว่า', 'sad']);
  if (n.e < 20) c.push(['🥱', 'ง่วงมาก… อยากกลับบ้านไปนอน', 'sad']);
  if (n.f < 20) c.push(['😑', 'เบื่อจัง หาอะไรสนุกๆ ทำดีกว่า', 'sad']);
  const lo = loveOf(p); if (lo) c.push(['💕', `คิดถึง${nameOf(lo)}จัง`, 'happy']);
  if (weatherOf() === 'snow') c.push(['🥶', 'หนาวจนมือชาเลย', 'sad']);
  if (hour() >= 21) c.push(['🌙', 'ดึกแล้ว ได้เวลากลับบ้านนอน', 'neutral']);
  return c.length && hash01(p.k + Math.floor(now() / 9000)) < .6 ? c[0] : _mindTL(p);
};
console.assert(Object.values(SCHED).every(s => s[s.length - 1][1] === 'in'), 'every schedule ends in bed');
console.assert(typeof APP.news === 'function' && APPS.some(a => a[0] === 'news'), 'news app registered');
