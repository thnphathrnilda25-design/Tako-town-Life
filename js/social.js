'use strict';
// Social actions between you and a townsperson, each with a short two-person animation:
// hug, high five, hold hands, kiss, comfort, cry on a shoulder, tickle, dance, share a snack, eat out, walk,
// compliment, ask advice, rock-paper-scissors, prank, argue, push, slap, apologise.
// Plus "private time" with a live-in partner: adults only, consent can be refused, the scene fades to black.
let PA = null;                                          // { p, kind, t, dur, fn, fx }
const FX_OF = { love: '#ff7ab8', star: '#ffd54a', tear: '#7ac8ff', anger: '#e84a4a', note: '#b89aff', sweat: '#8ad0f0', spark: '#fff6a0' };
function pairAct(p, kind, fxKind, dur, fn) {
  if (PA || busy) return; const e = p.h && scene !== town ? p.h : p;   // family members are drawn by their home entity indoors
  PA = { p, e, kind, fx: fxKind, t: 0, dur, fn, px: player.x, py: player.y };
  p.talking = true; if (p.h) p.h.talking = true; busy = true; keys.clear();
  const side = player.x < e.x ? -1 : 1, close = { hug: 9, kiss: 9, hold: 12, cry: 10, comfort: 11, slap: 16, push: 16, dance: 14 }[kind] || 18;
  player.x = e.x + side * close; player.y = e.y; player.dir = side < 0 ? 3 : 2; e.dir = side < 0 ? 2 : 3;
}
function paTick(dt) {
  PA.t += dt; const k = PA.kind;
  if (k === 'dance' || k === 'walk') { player.at += dt; player.frame = 1 + Math.floor(player.at / .1) % 6; PA.e.frame = 1 + Math.floor((player.at + .3) / .1) % 6; }
  if ((k === 'push' || k === 'slap') && PA.t < .2) PA.e.x += (PA.e.x > player.x ? 1 : -1) * 40 * dt;
  if (PA.t < PA.dur) return;
  const a = PA; PA = null; busy = false; player.frame = 0; a.e.frame = 0; a.p.talking = false; if (a.p.h) a.p.h.talking = false; a.fn();
}
const _upd16 = update; update = dt => { if (PA) paTick(dt); _upd16(dt); };
const _de16 = drawEnt;
drawEnt = e => {
  _de16(e);
  if (!PA || e !== PA.e) return;
  const mx = Math.round((player.x + e.x) / 2), my = Math.round(Math.min(player.y, e.y)) - 44, t = PA.t, c = FX_OF[PA.fx];
  for (let i = 0; i < 4; i++) {
    const f = (t * 1.3 + i / 4) % 1, x = mx + Math.round(Math.sin(t * 5 + i * 2) * 8), y = my - Math.round(f * 18);
    if (PA.fx === 'love') { R(c, x - 2, y, 2, 2); R(c, x + 1, y, 2, 2); R(c, x - 2, y + 2, 5, 1); R(c, x - 1, y + 3, 3, 1); R(c, x, y + 4, 1, 1); }
    else if (PA.fx === 'star') { R(c, x, y - 2, 1, 5); R(c, x - 2, y, 5, 1); }
    else if (PA.fx === 'tear') R(c, x, y + Math.round(f * 30), 1, 3);
    else if (PA.fx === 'anger') { if (i < 2) { R(c, x - 3, y, 2, 2); R(c, x + 1, y, 2, 2); R(c, x - 3, y + 3, 2, 2); R(c, x + 1, y + 3, 2, 2); } }
    else if (PA.fx === 'note') { R(c, x, y, 3, 2); R(c, x + 2, y - 4, 1, 5); }
    else R(c, x, y, 2, 2);
  }
  if (PA.kind === 'slap' && t < .25) { R('#fff', e.x - 6, e.y - 30, 12, 2); R('#fff', e.x - 4, e.y - 34, 8, 2); }
};
// ---- outcomes ----
const relF = (p, d) => { const r = relOf(p.id); r.f = Math.max(0, Math.min(100, r.f + d)); return r; };
const relH = (p, d) => { const r = relOf(p.id); r.h = Math.max(0, Math.min(100, (r.h || 0) + d)); return r; };
const mem = (p, kind, v, text) => typeof remember === 'function' && remember(p.id, kind, v, text);
function npcReply(p, text, expr) { talk(p); setTimeout(() => line(`${p.n}: "${text}"`, expr, () => cont(p)), 30); }
const partnerOf = p => p.id === st.partner || p.id === st.spouse || p.id === st.cohab;
const ACTS16 = [
  ['hug', '🤗 กอด', 'love', 1.4, p => { const ok = partnerOf(p) || relOf(p.id).f >= 30; relF(p, ok ? 4 : -2); fx({ mood: ok ? 8 : -2 }); mem(p, 'hug', ok ? 1 : -1, ok ? 'กอดกัน' : 'กอดโดยไม่ทันตั้งตัว'); npcReply(p, ok ? 'อบอุ่นจัง~' : 'เอ่อ… เรายังไม่สนิทขนาดนั้นนะ', ok ? 'happy' : 'sad'); }],
  ['high5', '✋ ไฮไฟว์', 'star', 1, p => { relF(p, 2); fx({ mood: 4 }); mem(p, 'high5', 1, 'ไฮไฟว์'); npcReply(p, 'เย้! 🙌', 'happy'); }],
  ['hold', '🤝 จับมือ', 'love', 1.4, p => { const ok = partnerOf(p) || relOf(p.id).f >= 70; relF(p, ok ? 3 : -3); fx({ mood: ok ? 6 : -2 }); mem(p, 'hold', ok ? 1 : -1, 'จับมือ'); npcReply(p, ok ? 'มืออุ่นจัง' : 'ขอโทษนะ… ไม่ค่อยสะดวก', ok ? 'happy' : 'sad'); }],
  ['kiss', '💋 หอมแก้ม / จูบ', 'love', 1.6, p => {
    if (age() < 18 || p.age < 18) return say('ทำไม่ได้: ต้องเป็นผู้ใหญ่ทั้งสองคน');
    if (partnerOf(p)) { relF(p, 5); fx({ mood: 15 }); mem(p, 'kiss', 2, 'จูบ'); return npcReply(p, 'รักนะ 💕', 'happy'); }
    if (relOf(p.id).f >= 85 && p.date && !st.partner) { st.partner = p.id; relF(p, 5); fx({ mood: 25 }); toast(`💕 ${p.n} ตอบรับ! เป็นแฟนกันแล้ว`); mem(p, 'kiss', 2, 'จูบแรก'); return npcReply(p, 'จริงๆ ฉันก็รอให้เธอทำแบบนี้อยู่นะ…', 'happy'); }
    relH(p, 15); relF(p, -12); fx({ mood: -10 }); mem(p, 'kiss', -2, 'จูบโดยไม่ยินยอม'); npcReply(p, 'ทำอะไรน่ะ! อย่ามาทำแบบนี้!', 'angry');
  }],
  ['comfort', '🫂 ปลอบใจ', 'tear', 1.4, p => { const sad = mindOf(p)[2] === 'sad'; relF(p, sad ? 6 : 1); fx({ mood: 4 }); mem(p, 'comfort', 1, 'ปลอบใจ'); npcReply(p, sad ? 'ขอบคุณนะ… รู้สึกดีขึ้นเยอะเลย' : 'ฉันโอเคนะ แต่ขอบคุณที่เป็นห่วง', sad ? 'happy' : 'neutral'); }],
  ['cry', '😢 ร้องไห้ระบาย', 'tear', 1.8, p => { const ok = relOf(p.id).f >= 40; fx({ mood: ok ? 15 : 3 }); if (typeof stressAdd === 'function') stressAdd(ok ? -15 : -3); relF(p, ok ? 3 : -1); mem(p, 'cry', ok ? 1 : 0, 'ร้องไห้ให้ฟัง'); npcReply(p, ok ? 'ไม่เป็นไรนะ ฉันอยู่ตรงนี้' : 'เอ่อ… ไม่เป็นไรใช่ไหม?', ok ? 'sad' : 'neutral'); }],
  ['tickle', '😆 จั๊กจี้', 'spark', 1.2, p => { const ok = relOf(p.id).f >= 40; relF(p, ok ? 3 : -4); fx({ mood: ok ? 6 : -2 }); npcReply(p, ok ? 'ฮ่าๆๆ พอแล้ว!' : 'หยุดนะ ไม่ตลก', ok ? 'happy' : 'angry'); }],
  ['dance', '💃 ชวนเต้นรำ', 'note', 2, p => { const ok = relOf(p.id).f >= 20; relF(p, ok ? 3 : 0); fx({ mood: ok ? 10 : 2, energy: -4 }); tick(20); mem(p, 'dance', ok ? 1 : 0, 'เต้นรำด้วยกัน'); npcReply(p, ok ? 'สนุกจัง! เต้นเก่งนะเนี่ย' : 'อ่า… ฉันเต้นไม่เป็นหรอก', ok ? 'happy' : 'neutral'); }],
  ['snack', '🍪 แบ่งขนม', 'spark', 1, p => { const id = Object.keys(st.inv).find(i => ITEMS[i].food); if (!id) return say('ไม่มีของกินในกระเป๋า'); addItem(id, -1); const liked = p.love?.includes(id) || p.like?.includes(id); relF(p, liked ? 7 : 4); mem(p, 'snack', 1, `แบ่ง${ITEMS[id].n}ให้`); npcReply(p, liked ? `${ITEMS[id].n}! ของโปรดเลย ขอบคุณ!` : 'ขอบคุณนะ อร่อยดี', 'happy'); }],
  ['eat', '🍜 ชวนไปกินข้าว ฿80', 'spark', 1.6, p => { if (st.money < 80) return say('เงินไม่พอ'); fade(() => { st.money -= 80; relF(p, 5); fx({ food: 40, mood: 10 }); tick(60); mem(p, 'eat', 1, 'กินข้าวด้วยกัน'); npcReply(p, 'อิ่มอร่อยมาก ไว้ไปอีกนะ!', 'happy'); }, 600); }],
  ['walk', '🚶 ชวนเดินเล่น', 'spark', 1.8, p => { relF(p, 3); fx({ mood: 5, energy: -3 }); tick(30); mem(p, 'walk', 1, 'เดินเล่นด้วยกัน'); npcReply(p, 'อากาศดีเนอะ เดินคุยกันแบบนี้ชอบจัง', 'happy'); }],
  ['outfit', '👗 ชมชุดที่ใส่', 'spark', 1, p => { const ok = (p.trait !== 'grumpy'); relF(p, ok ? 3 : 0); xp('charm', 5); npcReply(p, ok ? 'จริงเหรอ! เพิ่งซื้อมาเลย' : 'ก็แค่ชุดธรรมดา', ok ? 'happy' : 'neutral'); }],
  ['advice', '🗣️ ขอคำปรึกษา', 'spark', 1.2, p => { if (typeof stressAdd === 'function') stressAdd(-8); relF(p, 2); tick(20); npcReply(p, ['ลองพักผ่อนให้พอ แล้วค่อยคิดใหม่นะ', 'ทำทีละอย่าง ไม่ต้องรีบ', 'ถ้าเหนื่อยก็คุยกับเพื่อนบ้างนะ', 'เก็บเงินไว้บ้าง อนาคตจะได้สบาย'][(p.k + day()) % 4], 'neutral'); }],
  ['rps', '✊ เป่ายิ้งฉุบ', 'star', .8, p => { const w = Math.random(); relF(p, 1); fx({ mood: 3 }); npcReply(p, w < .33 ? 'ฉันชนะ! 😜' : w < .66 ? 'เสมอ! อีกรอบ!' : 'โอ๊ย แพ้ซะได้', w < .66 ? 'happy' : 'sad'); }],
  ['prank', '👻 แกล้งหลอก', 'sweat', 1, p => { const ok = p.trait === 'cheerful' || relOf(p.id).f >= 60; relF(p, ok ? 3 : -5); if (!ok) relH(p, 5); mem(p, 'prank', ok ? 1 : -1, 'โดนแกล้ง'); npcReply(p, ok ? 'ว้าย! ฮ่าๆ แสบนัก!' : 'ไม่ตลกเลยนะ!', ok ? 'happy' : 'angry'); }],
  ['argue', '😤 ทะเลาะ', 'anger', 1.4, p => { relF(p, -6); relH(p, 8); fx({ mood: -6 }); if (typeof stressAdd === 'function') stressAdd(6); mem(p, 'argue', -1, 'ทะเลาะกัน'); npcReply(p, 'เธอนี่มันไม่มีเหตุผลเลย!', 'angry'); }],
  ['push', '🫸 ผลัก', 'anger', 1, p => { relF(p, -12); relH(p, 18); fx({ mood: -4 }); mem(p, 'push', -2, 'ผลัก'); npcReply(p, 'ผลักทำไม! อย่ามายุ่งกับฉัน!', 'angry'); }],
  ['slap', '👋 ตบ', 'anger', 1, p => {
    relF(p, -20); relH(p, 30); mem(p, 'slap', -3, 'ตบหน้า');
    if (Math.random() < .5) { fx({ mood: -12, energy: -5 }); toast(`💥 ${p.n} ตบกลับ!`); } else fx({ mood: -6 });
    npcReply(p, 'เธอกล้าดียังไง!!', 'angry');
  }],
  ['sorry', '🙏 ขอโทษ', 'tear', 1.2, p => { const r = relOf(p.id); if (!(r.h > 0)) return npcReply(p, 'ขอโทษเรื่องอะไรเหรอ?', 'neutral'); const d = 6 + lv('charm') * 2; relH(p, -d); mem(p, 'sorry', 1, 'ขอโทษ'); npcReply(p, r.h < 30 ? 'ไม่เป็นไรแล้ว ลืมๆ ไปเถอะ' : 'ฉันยังโกรธอยู่นะ… แต่จะลองคิดดู', r.h < 30 ? 'happy' : 'sad'); }],
];
function actMenu(p) {
  line(`${p.n}: "หืม? จะทำอะไรเหรอ"`, 'neutral');
  TK.opts = ACTS16.map(([k, label, fxk, dur, fn]) => [label, () => { closeTalk(); pairAct(p, k, fxk, dur, () => fn(p)); }]).concat([['◀ กลับ', () => cont(p)]]);
  render2();
}
const _ch16 = chatHook;
chatHook = (p, title, opts) => _ch16(p, title, hated(p) ? opts : [['🤝 ทำท่าทาง…', () => actMenu(p)], ...opts]);
// ---- private time (adults, live-in partner, consent, fade to black) ----
function privateTime(p) {
  if (age() < 18 || p.age < 18) return say('เฉพาะผู้ใหญ่เท่านั้น');
  if (scene !== home) return say('ต้องอยู่ที่บ้านของคุณเอง');
  const h = hour(); if (h < 20 && h >= 2) return say('ไว้ช่วงกลางคืนนะ');
  const r = relOf(p.id);
  if (r.priv === day()) return npcReply(p, 'วันนี้พอแล้วนะ พักผ่อนกันเถอะ', 'neutral');
  if (r.f < 80 || (r.h || 0) > 0 || Math.random() < .15) { mem(p, 'decline', 0, 'ปฏิเสธเวลาส่วนตัว'); return npcReply(p, 'วันนี้ไม่ค่อยมีอารมณ์เลย ขอนอนกอดกันเฉยๆ ได้ไหม?', 'neutral'); }
  openMenu(`💞 ใช้เวลาส่วนตัวกับ ${p.n}`, [['ใช้การป้องกัน', () => intimate(p, true)], ['ไม่ป้องกัน (พร้อมมีลูก)', () => intimate(p, false)]]);
}
function intimate(p, safe) {
  const r = relOf(p.id); r.priv = day();
  fade(() => {
    r.f = Math.min(100, r.f + 5); fx({ mood: 30, energy: -10 }); if (typeof stressAdd === 'function') stressAdd(-20); tick(60); mem(p, 'intimate', 2, 'คืนพิเศษ');
    if (!safe && !st.preg && (st.kids || []).length < 3 && age() >= 20 && age() <= 45 && Math.random() < .35) { st.preg = { due: day() + 7 }; setTimeout(() => toast(`👶 ข่าวดี! กำลังจะมีเจ้าตัวเล็ก (อีก 7 วัน)`), 1500); }
    say('💞 คืนนี้เป็นคืนที่อบอุ่น…');
  }, 1600);
}
const _so16 = spouseOpts;
spouseOpts = p => [..._so16(p), ['💞 ใช้เวลาส่วนตัว', () => privateTime(p)]];
console.assert(ACTS16.length >= 18 && ACTS16.every(a => FX_OF[a[2]]), 'social action table');
