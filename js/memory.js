'use strict';
// NPC memory and the life cycle: people remember what you did and bring it up, news spreads through their friends,
// townsfolk make friends and enemies among themselves, and everyone (you and your parents too) ages and can die.
const MEM = () => st.mem || (st.mem = {});
const MOOD_OF = { hug: 'warm', kiss: 'love', intimate: 'sweet', slap: 'angry', push: 'angry', argue: 'angry', dance: 'fun', walk: 'warm', eat: 'fun' };
var remember = (id, kind, v, text) => {
  const L = MEM()[id] || (MEM()[id] = []); L.push({ d: day(), k: kind, v, t: text, spread: 0 }); if (L.length > 12) L.shift();
  if (typeof addMood === 'function' && MOOD_OF[kind]) addMood(MOOD_OF[kind]);
};
// existing interactions also leave memories
{
  const _gg = giveGift; giveGift = (p, id) => { _gg(p, id); remember(p.id, 'gift', p.hate.includes(id) ? -1 : p.love.includes(id) ? 2 : 1, `ให้${ITEMS[id].n}`); };
  const _ins = insult; insult = (p, h, f, l) => { _ins(p, h, f, l); remember(p.id, 'insult', -2, 'ด่าว่า'); };
}
const daysAgo = d => { const n = day() - d; return n === 0 ? 'เมื่อกี้' : n === 1 ? 'เมื่อวาน' : n < 7 ? `${n} วันก่อน` : n < YEAR ? `${Math.floor(n / 7)} สัปดาห์ก่อน` : `${Math.floor(n / YEAR)} ปีก่อน`; };
function memoryLine(p) {
  const L = (MEM()[p.id] || []).filter(m => day() - m.d <= YEAR * 2 && m.d < day()); if (!L.length || Math.random() < .4) return null;
  const m = L.reduce((a, b) => Math.abs(b.v) > Math.abs(a.v) ? b : a);
  if (m.k === 'heard') return [`ได้ยินมาว่า${m.t}… จริงเหรอ?`, m.v < 0 ? 'angry' : 'happy'];
  return m.v < 0 ? [`ยังจำได้นะ ที่เธอ${m.t}เมื่อ${daysAgo(m.d)}`, 'angry'] : [`ยังจำตอนที่เรา${m.t}เมื่อ${daysAgo(m.d)}ได้เลย 😊`, 'happy'];
}
const _ch18 = chatHook;
chatHook = (p, title, opts) => { _ch18(p, title, opts); const ml = !p.fam && memoryLine(p); if (ml && TK) { const o = TK.opts; line(`${p.n}: "${ml[0]}"`, ml[1]); TK.opts = o; render2(); } };
// ---- npc-to-npc relationships evolve; gossip spreads through friends ----
const A2 = () => st.aff2 || (st.aff2 = {});
const pairKey = (a, b) => a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
const _aff18 = aff; aff = (a, b) => Math.max(-2, Math.min(2, _aff18(a, b) + (A2()[pairKey(a, b)] || 0)));
const alive2 = () => people.filter(p => !p.fam && !st.gone?.[p.id]);
function socialDaily() {
  if (st.socDay === day()) return; st.socDay = day(); const ps = alive2(), news = [];
  for (let i = 0; i < 6 && ps.length > 1; i++) {                      // a few chance meetings per day
    const a = ps[ri(ps.length)], b = ps[ri(ps.length)]; if (a === b) continue;
    const before = aff(a, b), d = a.trait === b.trait ? 1 : Math.random() < .5 ? 1 : -1, k = pairKey(a, b); A2()[k] = Math.max(-3, Math.min(3, (A2()[k] || 0) + d * .5));
    const after = aff(a, b);
    if (before > -2 && after <= -2) news.push(`😤 ${a.n} กับ ${b.n} ทะเลาะกันกลางเมือง`); if (before < 2 && after >= 2) news.push(`🤝 ${a.n} กับ ${b.n} กลายเป็นเพื่อนสนิทกัน`);
    if (before <= -2 && Math.random() < .3) { A2()[k] += 1.5; news.push(`🕊️ ${a.n} กับ ${b.n} คืนดีกันแล้ว`); }
  }
  for (const [id, L] of Object.entries(MEM())) {                      // gossip: strong memories reach the teller's friends
    const teller = ps.find(p => p.id === id); if (!teller) continue;
    for (const m of L) {
      if (m.spread || Math.abs(m.v) < 2 || day() - m.d > 5 || m.k === 'heard') continue; m.spread = 1;
      const pals = ps.filter(x => x !== teller && aff(teller, x) >= 1).slice(0, 3);
      for (const x of pals) { const r = relOf(x.id); if (m.v < 0) r.h = Math.min(100, (r.h || 0) + 6); else r.f = Math.min(100, r.f + 2); (MEM()[x.id] || (MEM()[x.id] = [])).push({ d: day(), k: 'heard', v: m.v / 2, t: `เธอ${m.t}${teller.n}`, spread: 1 }); }
      if (pals.length && m.v < 0) news.push(`🗣️ ${teller.n} เล่าให้ ${pals.map(x => x.n).join(', ')} ฟังว่าคุณ${m.t}`);
    }
  }
  news.slice(0, 2).forEach((t, i) => setTimeout(() => toast(t), 700 * (i + 1)));
}
var townRep = () => { const ps = alive2(); if (!ps.length) return 0; return Math.round(ps.reduce((a, p) => a + (st.rel[p.id]?.f || 0) - (st.rel[p.id]?.h || 0) * 1.5, 0) / ps.length); };
// ---- aging and death: you and your parents ----
function dieCheck() {
  if (st.dyCheck === day()) return; st.dyCheck = day(); const a = age(), fit = lv('fit'), b = st.body || {};
  if ((day() - 1) % YEAR === 0) {                                       // once a year, on the birthday
    if (a >= 70 && Math.random() < Math.max(.01, (a - 69) * .04 - fit * .01 + ((b.stress || 0) > 70 ? .05 : 0))) return playerDies();
    for (const k of ['dad', 'mom']) { const P = st.parents?.[k]; if (!P || P.dead) continue; const pa = parentAge(P); if (pa >= 70 && Math.random() < (pa - 69) * .06) parentDies(k); }
  }
  if (a >= 50) st.energy = Math.min(st.energy, 100 - (a - 50) * 1.2);   // the body slows down with age
}
function parentDies(k) {
  const P = st.parents[k]; P.dead = day(); const gift = 1500 + Math.round(Math.random() * 2500);
  st.money += gift; if (typeof addMood === 'function') addMood('grief');
  const e = fam.find(f => f.id === k); if (e) { fam.splice(fam.indexOf(e), 1); const i = people.indexOf(e); if (i >= 0) people.splice(i, 1); }
  toast(`🕯️ ${k === 'dad' ? 'พ่อ' : 'แม่'} (${P.n}) เสียชีวิตอย่างสงบ ได้รับมรดก ฿${gift}`); st.funeral = { who: P.n, until: day() + 3 }; save();
}
{ const t = town.targets.find(t => t.name === 'โบสถ์'); if (t) { const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { get: () => [...(st.funeral && day() <= st.funeral.until ? [[`🕯️ ไปงานศพของ ${st.funeral.who}`, () => { st.funeral = null; st.moodlets = (st.moodlets || []).filter(m => m.id !== 'grief'); fx({ mood: 10 }); tick(120); say('ได้บอกลาเป็นครั้งสุดท้าย ใจสงบขึ้น'); }]] : []), ...base.call(t)], configurable: true }); } }
const _mf18 = makeFamily; makeFamily = () => { _mf18(); for (const k of ['dad', 'mom']) if (st.parents?.[k]?.dead) { const e = fam.find(f => f.id === k); if (e) { fam.splice(fam.indexOf(e), 1); const i = people.indexOf(e); if (i >= 0) people.splice(i, 1); } } };
function playerDies() {
  const kids = (st.kids || []).filter(k => k.n);
  const summary = [`อายุ ${age()} ปี`, `เงิน ฿${st.money}`, st.spouse ? `คู่ชีวิต: ${PEOPLE.find(p => p.id === st.spouse)?.n}` : 'ไม่ได้แต่งงาน', `ลูก ${kids.length} คน`, `ความสำเร็จ ${Object.keys(st.ach || {}).length}`, `ชื่อเสียงในเมือง ${townRep()}`];
  openPanel(`🕯️ ${st.name} จากไปอย่างสงบ`, () => [el('div', { className: 'sub' }, 'ชีวิตหนึ่งจบลงแล้ว'), ...summary.map(s => el('div', {}, '· ' + s)),
    ...(kids.length ? kids.map(k => btn(`เล่นต่อเป็น ${k.n} (อายุ ${Math.floor((day() - k.born) / YEAR)})`, () => { closePanel(); passTorch(k); toast('🔥 รุ่นต่อไปรับมรดกทั้งหมด'); })) : [el('div', {}, 'ไม่มีทายาท')]),
    btn('เริ่มชีวิตใหม่ (ลบเซฟช่องนี้)', () => { localStorage.removeItem(slotKey(SLOT)); location.reload(); })]);
}
const _sT18 = seasonTick; seasonTick = () => { _sT18(); socialDaily(); dieCheck(); };
const _hud18 = drawHud; drawHud = () => { _hud18(); hud.insertAdjacentHTML('beforeend', `<div class="row" style="font-size:12px"><span>🏙️ ชื่อเสียงในเมือง</span><span>${townRep()}</span></div>`); };
ACH.push(['beloved', '🌟 ที่รักของเมือง', 'ชื่อเสียงในเมือง 40+', () => townRep() >= 40], ['legacy', '🕯️ มรดก', 'ตัวละครเสียชีวิตและส่งต่อรุ่น', () => !!st.torched]);
console.assert(typeof remember === 'function' && typeof aff === 'function', 'memory ready');
