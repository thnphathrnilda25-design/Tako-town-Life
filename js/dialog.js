'use strict';
// Conversations with real choices. Kind words build friendship; insults and threats build hatred (rel.h), which makes people
// avoid you, refuse gifts and romance, shout at you, and spread rumours that hurt your other friendships.
const PREF = { cheerful: { c: 1, j: 2, a: 1, d: 0, g: 1, t: 0 }, shy: { c: 0, j: -1, a: 1, d: 1, g: -1, t: -2 }, grumpy: { c: -1, j: -1, a: 0, d: -1, g: 1, t: -1 },
  smart: { c: 1, j: 0, a: 2, d: -1, g: -1, t: -1 }, lazy: { c: 1, j: 1, a: 0, d: -2, g: 1, t: 0 }, kind: { c: 2, j: 1, a: 1, d: 1, g: -2, t: -1 } };
const LINES2 = {
  c: [['"โอ๊ย หยุดเลย เขินนะเนี่ย!"', '"…ขอบใจนะ"', '"คำชมแบบนี้ไม่ทำให้อะไรดีขึ้นหรอก"']],
  j: [['"ฮ่า! อันนี้ตลกจริง!"', '"หืม ตลกดี"', '"ไม่ตลกเลยสักนิด"']],
  a: [['"ขอบคุณที่ถามนะ — ขอเล่าเรื่องวันนี้ให้ฟังหน่อย!"', '"อ้อ ก็เรื่อย ๆ นะ"', '"ถามทำไม?"']],
  d: [['"จริงด้วย คำแนะนำดีมากเลย"', '"จะลองคิดดูนะ"', '"ใครถามเธอ?"']],
  g: [['"โอ๊ะ เล่าต่อสิ! 🤭"', '"หืม เราไม่ชอบนินทาคนอื่นนะ"', '"พูดแบบนี้กับคนอื่นมันแย่นะ"']],
  t: [['"เฮ้! กวนนะเนี่ย (หัวเราะ)"', '"…แรงไปหน่อยนะ"', '"ไม่ตลกนะ หยุดเลย"']],
};
var lastV = 0, chatHook = null;            // lastV: mood of the last reply (-2..2) so the talk box can pick a portrait expression
const talkMenu = (p, t, o) => chatHook ? chatHook(p, t, o) : openMenu(t, o);
const hatOf = id => st.rel[id]?.h || 0;
const hated = p => hatOf(p.id) >= 50;
const _relName = relName; relName = (id, f) => hatOf(id) >= 80 ? 'ศัตรู 😡' : hatOf(id) >= 50 ? 'ไม่ชอบคุณ 😠' : _relName(id, f);
function react(p, key) {
  const r = relOf(p.id), tr = p.trait || 'kind'; let v = PREF[tr]?.[key] ?? 0; if (Math.random() < .25) v += Math.random() < .5 ? -1 : 1; if (lv('charm') >= 5 && v < 0 && Math.random() < .4) v++;
  v = Math.max(-2, Math.min(2, v)); lastV = v; const L = LINES2[key][0];
  if (st.clean < 25) v = Math.min(v, -1);
  if (v > 0) { r.f = Math.min(100, r.f + 3 * v + lv('charm') * .4); fx({ mood: 2 + v }); }
  else if (v === 0) r.f = Math.min(100, r.f + 1);
  else { r.f = Math.max(0, r.f + 4 * v); r.h = Math.min(100, hatOf(p.id) + 8 * -v); fx({ mood: -2 }); }
  return `${p.n}: ${v > 0 ? L[0] : v === 0 ? L[1] : L[2]}`;
}
function talk(p) {
  const r = relOf(p.id); p.dir = faceTo(p, player);
  if (hated(p)) return talkMenu(p, `${p.n} จ้องเขม็งใส่คุณ`, [['ขอโทษอย่างจริงใจ', () => apologize(p, false)], ['ขอโทษพร้อมของขวัญ 🎁', () => apologize(p, true)]]);
  if (r.tk !== day()) { r.tk = day(); r.tn = 0; }
  if (r.tn >= 4) return say(`${p.n}: "พรุ่งนี้ค่อยคุยกันใหม่นะ เรามีธุระต้องทำ"`);
  const go = key => () => { r.tn++; const line = react(p, key); xp('charm', 4); tick(5); say(line); afterTalk(p); };
  talkMenu(p, `คุยกับ ${p.n} (วันนี้เหลือ ${4 - r.tn} ครั้ง)`, [['😊 ชมพวกเขา', go('c')], ['😂 เล่าเรื่องตลก', go('j')], ['💬 ถามเรื่องวันนี้', () => { r.tn++; asking(p); }], ['🧠 ให้คำแนะนำ', go('d')], ['🤭 แชร์ข่าวลือ', go('g')], ['😜 แหย่เล่น', go('t')],
    ['😠 ด่าพวกเขา', () => { r.tn++; insult(p, 20, 15, `${p.n}: "กล้าดียังไง!"`); }], ['😈 ข่มขู่', () => { r.tn++; threaten(p); }]]);
}
function asking(p) {
  lastV = 1; const r = relOf(p.id); r.f = Math.min(100, r.f + 3 + lv('charm') * .5); fx({ mood: 4 }); xp('charm', 6); tick(8);
  let line = (p.says || ['สวัสดี!'])[ri(p.says.length)];
  if (r.f >= 40 && Math.random() < .4) { const secret = [...p.love, ...p.like].find(i => !r.known.includes(i)); if (secret) { line = `ระหว่างเรานะ… เราชอบ ${ITEMS[secret].n} มากเลย`; r.known.push(secret); } }
  if (r.f >= 70 && p.like.length && day() - r.bf >= 3) { r.bf = day(); const g = p.like[ri(p.like.length)]; addItem(g); setTimeout(() => toast(`🎁 ${p.n} ให้ ${ITEMS[g].ic} ${ITEMS[g].n} กับคุณ`), 500); }
  say(`${p.n}: "${line}"`); afterTalk(p);
}
function insult(p, h, f, line) { lastV = -2; const r = relOf(p.id); r.h = Math.min(100, hatOf(p.id) + h); r.f = Math.max(0, r.f - f); fx({ mood: -4 }); tick(5); say(line); afterTalk(p); }
function threaten(p) {
  if (lv('fit') >= 3 || Math.random() < .5) insult(p, 35, 25, `${p.n} ถอยหลังด้วยความกลัว "อย่าเข้ามาใกล้ฉัน!"`);
  else { fx({ energy: -10, mood: -12 }); insult(p, 35, 25, `${p.n} ผลักคุณล้ม! "ลองอีกสิ กล้าไหม!"`); }
}
function afterTalk(p) { const r = relOf(p.id); if (hatOf(p.id) >= 80 && !r.rumor) { r.rumor = 1; rumor(p); } }
function rumor(p) {
  const pals = PEOPLE.filter(x => x.id !== p.id && !st.gone?.[x.id] && (st.rel[x.id]?.f || 0) >= 20).sort(() => Math.random() - .5).slice(0, 3);
  pals.forEach(x => { st.rel[x.id].f = Math.max(0, st.rel[x.id].f - 8); });
  if (pals.length) toast(`🗣️ ${p.n} กำลังนินทาคุณ! ${pals.map(x => x.n).join(', ')} มองคุณแย่ลง`);
}
function apologize(p, gift) {
  const r = relOf(p.id); if (r.ap === day()) return say(`${p.n}: "บอกแล้วไงว่าขอเวลา"`); r.ap = day();
  if (gift) {
    const id = Object.keys(st.inv).find(i => ITEMS[i].k === 'gift' || ITEMS[i].k === 'dish'); if (!id) { r.ap = 0; return say('ต้องมีของขวัญหรืออาหารในกระเป๋า'); }
    addItem(id, -1); const love = p.love.includes(id) ? 30 : p.like.includes(id) ? 20 : p.hate.includes(id) ? 0 : 12; r.h = Math.max(0, hatOf(p.id) - love); say(`${p.n}: ${love ? '"…โอเค ขอบใจนะ เราจะคิดดู"' : '"คิดว่าของขวัญจะแก้เรื่องนี้ได้เหรอ?!"'}`);
  } else if (Math.random() < .3 + lv('charm') * .06) { r.h = Math.max(0, hatOf(p.id) - 15); say(`${p.n}: "…เรารู้สึกได้ว่าคุณพูดจริง"`); } else { r.h = Math.min(100, hatOf(p.id) + 5); say(`${p.n}: "เก็บคำพูดไว้เถอะ เราไม่เชื่อหรอก"`); }
  tick(10);
}
// hatred shapes the rest of the game
const _po6 = personOpts;
personOpts = p => { const o = _po6(p); if (p.fam) return o; if (hated(p)) return o.filter(x => x[0] === 'คุยด้วย' || /คุย/.test(x[0])); return hatOf(p.id) >= 20 ? o.filter(x => !/เดท|สารภาพ|ขอแต่งงาน/.test(x[0])) : o; };
const _up6 = updatePerson;
updatePerson = (p, dt) => {
  if (!p.fam && hated(p) && scene === town && player && p.slot !== 'in') {      // flee when the player is near
    const d = Math.hypot(player.x - p.x, player.y - p.y);
    if (d < 90) { p.flee = true; const dx = (p.x - player.x) / d, dy = (p.y - player.y) / d; move(town, p, dx * 60 * dt, dy * 60 * dt); p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0); animate(p, true, dt); p.path = null;
      if (hatOf(p.id) >= 80 && d < 40 && relOf(p.id).yell !== day()) { relOf(p.id).yell = day(); fx({ mood: -8 }); toast(`😡 ${p.n} ตะโกนด่าคุณกลางถนน!`); } return; }
    p.flee = false;
  }
  _up6(p, dt);
};
function hateDaily() {
  if (st.hday === day()) return; st.hday = day();
  for (const id in st.rel) { const r = st.rel[id]; if (r.h) { r.h = Math.max(0, r.h - (r.h >= 50 ? .5 : 1)); if (r.h < 70) r.rumor = 0; } }
}
const _sT6 = seasonTick; seasonTick = () => { _sT6(); hateDaily(); };
ACH.push(['bully', '😈 นักแกล้ง', 'ทำให้ใครสักคนเกลียดคุณ', () => Object.values(st.rel).some(r => (r.h || 0) >= 50)], ['peace', '🕊️ คืนดีแล้ว', 'ได้รับการให้อภัยหลังถูกเกลียด (ขอโทษ)', () => Object.values(st.rel).some(r => r.ap && (r.h || 0) < 30 && r.f > 20)]);
console.assert(Object.keys(PREF).every(t => TRAIT_SAYS[t]) && Object.keys(LINES2).length === 6, 'dialogue tables');
