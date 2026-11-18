'use strict';
// Fun times: invite a partner, spouse, parent, child or close friend out for something nice.
// Every activity plays a short two-person animation, gives real rewards, can be done once a day
// (some once a week) and leaves a keepsake photo in the phone album. Nothing here is required to
// progress — it is purely for fun, so it never touches the story chapters or the money balance.

const funState = () => (st.fun || (st.fun = { log: [], total: 0, count: 0, day: 0, streak: 0, streakDay: 0, last: {} }));
const atHome = () => typeof scene !== 'undefined' && (scene === home || (typeof parentsHome !== 'undefined' && scene === parentsHome));
const isLove = p => !!p && (p.id === st.partner || p.id === st.spouse || p.id === st.cohab);
const isParent = p => !!p && (p.id === 'dad' || p.id === 'mom');
const isKid = p => !!p && p.fam === 'kid';
const funWho = p => (isKid(p) && p.kid?.n) || p.n;
const funWhere = p => isLove(p) ? 'คนรัก' : isParent(p) ? (p.id === 'dad' ? 'พ่อ' : 'แม่') : isKid(p) ? funWho(p) : 'กัน';

// ---- the activities ----------------------------------------------------------------------------
// where: 'home' (your home or your parents'), 'town' (outside) or 'any'
// hours: [from, to] in game hours, a wrap-around window is fine (19 -> 2)
const INVITES = [
  { id: 'picnic', ic: '🧺', n: 'ปิกนิกในสวน', where: 'town', hours: [9, 17], cost: 60, anim: 'sit', fxk: 'spark', dur: 1.9, mins: 90,
    fx: { mood: 22, food: 25, energy: -5 }, rel: 5, skill: ['charm', 8],
    reply: 'ลมเย็น ๆ กับข้าวกล่อง homemade… วันนี้ดีจังเลยนะ' },
  { id: 'movie', ic: '🍿', n: 'ดูหนังด้วยกัน', where: 'home', hours: [0, 24], cost: 0, anim: 'sit', fxk: 'love', dur: 1.8, mins: 120,
    fx: { mood: 20, energy: -4 }, rel: 4, skill: ['charm', 5],
    reply: 'ตอนจบเขาเศร้าอะ… แต่มีเธอนั่งข้าง ๆ ก็โอเค' },
  { id: 'cook', ic: '🍳', n: 'ทำอาหารด้วยกัน', where: 'home', hours: [6, 22], cost: 40, anim: 'sit', fxk: 'spark', dur: 2.0, mins: 60,
    fx: { mood: 16, food: 45, energy: -6 }, rel: 4, skill: ['cook', 18],
    reply: 'ครั้งหน้าฉันจะไม่ลืมปิดไฟก่อนตอกไข่แล้วล่ะ!' },
  { id: 'stars', ic: '🌌', n: 'นั่งดูดาว', where: 'any', hours: [19, 2], cost: 0, anim: 'sit', fxk: 'star', dur: 2.1, mins: 60,
    fx: { mood: 24, energy: -2 }, rel: 6, skill: ['charm', 6],
    reply: 'ดาวดวงนั้นสว่างจัง… เหมือนที่เธอเป็นเลย' },
  { id: 'photo', ic: '📸', n: 'ถ่ายรูปคู่', where: 'any', hours: [0, 24], cost: 0, anim: 'hug', fxk: 'spark', dur: 1.3, mins: 10,
    fx: { mood: 12 }, rel: 3, skill: ['charm', 4],
    reply: 'ขอดูรูปหน่อย! โอ๊ย ยิ้มกว้างเกินไปแล้ว เก็บไว้นะ' },
  { id: 'market', ic: '🏮', n: 'เดินตลาดกลางคืน', where: 'town', hours: [17, 23], cost: 120, anim: 'walk', fxk: 'note', dur: 1.9, mins: 90,
    fx: { mood: 28, food: 20, energy: -8 }, rel: 5, skill: ['charm', 9],
    reply: 'ซื้อลูกชิ้นมาสองไม้ กินไปเดินไปแบบนี้แหละดีที่สุด' },
  { id: 'spa', ic: '♨️', n: 'แช่น้ำอุ่นด้วยกัน', where: 'home', hours: [16, 2], cost: 0, anim: 'sit', fxk: 'love', dur: 2.0, mins: 60,
    fx: { mood: 26, energy: 20 }, rel: 5, skill: ['charm', 5],
    reply: 'ตัวเราเปื่อยไปหมดแล้ว… แต่ใจฟูมากเลยนะ' },
  { id: 'karaoke', ic: '🎤', n: 'ร้องคาราโอเกะ', where: 'any', hours: [10, 23], cost: 80, anim: 'dance', fxk: 'note', dur: 2.0, mins: 60,
    fx: { mood: 25, energy: -10 }, rel: 4, skill: ['charm', 10],
    reply: 'เสียงเพี้ยนแต่สนุกสุด ๆ! เอาอีกเพลงไหม?' },
  { id: 'bike', ic: '🚲', n: 'ปั่นจักรยานชมเมือง', where: 'town', hours: [7, 18], cost: 0, anim: 'walk', fxk: 'spark', dur: 1.8, mins: 60,
    fx: { mood: 16, energy: -12 }, rel: 3, skill: ['fit', 12],
    reply: 'ปั่นไปเรื่อย ๆ ไม่ต้องมีจุดหมาย… แบบนี้ก็ดีนะ' },
  { id: 'ice', ic: '🍦', n: 'กินไอศกรีม', where: 'town', hours: [10, 20], cost: 50, anim: 'sit', fxk: 'spark', dur: 1.3, mins: 20,
    fx: { mood: 15, food: 12 }, rel: 3, skill: ['charm', 3],
    reply: 'รสวานิลลาของโปรดเลย! อ้ากินไหม?' },
  { id: 'beach', ic: '🏖️', n: 'ทริปทะเลหนึ่งวัน', where: 'town', hours: [7, 12], cost: 650, anim: 'walk', fxk: 'star', dur: 2.5, mins: 300, days: 7,
    fx: { mood: 46, energy: -25, food: 15 }, rel: 10, skill: ['charm', 16],
    reply: 'วันเดียวก็คุ้มแล้ว… ทรายติดเท้าแต่ยิ้มไม่หยุดเลย' },
  { id: 'candle', ic: '🕯️', n: 'ดินเนอร์ใต้แสงเทียน', where: 'home', hours: [18, 23], cost: 200, anim: 'sit', fxk: 'love', dur: 2.1, mins: 90, love: 1,
    fx: { mood: 32, food: 40, energy: -3 }, rel: 8, skill: ['cook', 6],
    reply: 'แสงเทียนนิดเดียว แต่ใจฉันสว่างไปทั้งดวงเลย' },
  // ---- family moments ----
  { id: 'dinner', ic: '🍲', n: 'กินข้าวเย็นพร้อมหน้า', where: 'home', hours: [17, 21], cost: 0, anim: 'sit', fxk: 'spark', dur: 1.9, mins: 60, fam: 1,
    fx: { mood: 22, food: 35 }, rel: 5, reply: 'กับข้าววันนี้ฝีมือใครน่ะ? อร่อยจนต้องตักเพิ่ม' },
  { id: 'chores', ic: '🧹', n: 'ช่วยกันทำงานบ้าน', where: 'home', hours: [8, 21], cost: 0, anim: 'sit', fxk: 'spark', dur: 1.6, mins: 60, fam: 1,
    fx: { mood: 12, energy: -10 }, rel: 6, reply: 'บ้านสะอาดแล้ว! นั่งพักกินน้ำด้วยกันก่อน' },
  { id: 'longtalk', ic: '☕', n: 'นั่งคุยกันยาว ๆ', where: 'any', hours: [6, 23], cost: 0, anim: 'sit', fxk: 'note', dur: 1.7, mins: 45, fam: 1,
    fx: { mood: 15 }, rel: 5, reply: 'เรื่องเก่า ๆ ที่เล่ากันกี่ครั้งก็ยังขำอยู่เลย' },
  { id: 'story', ic: '📖', n: 'เล่านิทานก่อนนอน', where: 'home', hours: [18, 2], cost: 0, anim: 'sit', fxk: 'star', dur: 1.7, mins: 30, kid: 1,
    fx: { mood: 10, energy: -3 }, rel: 6, reply: 'ตรงนั้นอีก! เล่าเรื่องมังกรอีกตอนได้ไหม?' },
];

const invWindow = (h, [a, b]) => (a <= b ? h >= a && h < b : h >= a || h < b);
function invReason(p, a) {
  if (a.love && !isLove(p)) return 'สำหรับคนรักเท่านั้น';
  if (a.kid && !isKid(p)) return 'สำหรับลูกเท่านั้น';
  if (a.fam && !(isParent(p) || isKid(p) || p.fam)) return 'สำหรับคนในครอบครัว';
  if (a.where === 'home' && !atHome()) return 'ต้องอยู่ที่บ้าน';
  if (a.where === 'town' && atHome()) return 'ต้องออกไปข้างนอก';
  if (a.cost && st.money < a.cost) return 'เงินไม่พอ';
  if (!invWindow(hour(), a.hours)) return `ชวนได้ ${a.hours[0]}:00–${a.hours[1]}:00`;
  const F = funState(), key = `${p.id}.${a.id}`;
  if (F.last[key] === day()) return 'วันนี้แล้ว';
  if (a.days && (F.last[key + '.w'] || 0) > day() - a.days) return `ทำได้ทุก ${a.days} วัน`;
  return '';
}

function funReward(p, n) {
  if (isKid(p)) { const k = p.kid; if (k) k.bond = Math.min(100, (k.bond || 0) + n); return; }
  const r = relOf(p.id); r.f = Math.max(0, Math.min(100, (r.f || 0) + n));
}

function runInvite(p, a) {
  const bad = invReason(p, a); if (bad) return say(bad);
  if (busy || (typeof PA !== 'undefined' && PA)) return say('รอสักครู่นะ');
  const F = funState(), key = `${p.id}.${a.id}`;
  F.last[key] = day(); if (a.days) F.last[key + '.w'] = day();
  closeMenu();
  const gains = { ...a.fx }; if (a.cost) gains.money = -a.cost;
  pairAct(p, a.anim, a.fxk, a.dur, () => {
    fx(gains); tick(a.mins || 45);
    if (a.skill) xp(a.skill[0], a.skill[1]);
    funReward(p, a.rel || 3);
    if (typeof remember === 'function') remember(p.id, 'fun', 1, a.n);
    if (F.day !== day()) {
      F.day = day(); F.count = 0;
      F.streak = F.streakDay === day() - 1 ? (F.streak || 0) + 1 : 1;
      F.streakDay = day();
    }
    F.count++; F.total = (F.total || 0) + 1;
    F.log.unshift({ d: day(), ic: a.ic, n: a.n, who: funWho(p) }); F.log = F.log.slice(0, 24);
    if (typeof snap === 'function') { try { snap(`${a.n} · ${funWho(p)}`); } catch (e) { /* the album is a bonus */ } }
    say(`${funWho(p)}: "${a.reply}"`);
    toast(`${a.ic} ${a.n} · ความสนิท +${a.rel || 3}`);
    if (F.count === 3) { fx({ mood: 8 }); toast('🌟 ครบ 3 กิจกรรมวันนี้! หัวใจพองโต'); }
    if (F.streak === 3) { fx({ mood: 10 }); toast('🔥 ใช้เวลาด้วยกันต่อเนื่อง 3 วันแล้ว'); }
  });
}

function funAlbum() {
  const F = funState();
  openPanel('🖼️ อัลบั้มโมเมนต์', () => [
    el('div', { className: 'sub' }, `เก็บไว้ ${F.log.length} โมเมนต์ · ทำกิจกรรมมาแล้ว ${F.total || 0} ครั้ง${F.streak ? ` · ต่อเนื่อง ${F.streak} วัน` : ''}`),
    ...(F.log.length ? F.log.map(m => row(m.ic, m.n, `กับ ${m.who} · วันที่ ${m.d}`))
      : [el('div', { className: 'sub' }, 'ยังไม่มีโมเมนต์ — ชวนคนใกล้ตัวไปทำอะไรสนุก ๆ กันเถอะ')]),
    el('div', { className: 'sub' }, 'กิจกรรมเดิมทำได้วันละครั้ง · รูปถูกเก็บไว้ในมือถือ แอปกล้อง → อัลบั้มด้วย'),
  ]);
}

function invitePanel(p) {
  if (hated(p)) return say(`${p.n}: "ไม่ต้องมาชวนอะไรทั้งนั้น"`);
  const list = INVITES.filter(a => (!a.love || isLove(p)) && (!a.kid || isKid(p)) && (!a.fam || isParent(p) || isKid(p) || !!p.fam));
  openMenu(`🎈 ชวน${funWhere(p)}ทำอะไรดี?`, [
    ...list.map(a => {
      const bad = invReason(p, a), cost = a.cost ? ` ฿${a.cost}` : '';
      return [`${a.ic} ${a.n}${cost}${bad ? ` — ${bad}` : ''}`, () => (bad ? say(bad) : runInvite(p, a))];
    }),
    ['🖼️ อัลบั้มโมเมนต์', funAlbum],
    ['◀ กลับ', () => { }],
  ]);
}

// only people you are actually close to get the invitation (partner, family, or a good friend)
const canInvite = p => !!p && !st.gone?.[p.id] && !hated(p) && (isLove(p) || !!p.fam || (relOf(p.id).f || 0) >= 40);
const _poFun = personOpts;
personOpts = p => {
  const o = _poFun(p);
  if (!canInvite(p) || TK) return o;
  const entry = ['🎈 ชวนทำกิจกรรมด้วยกัน', () => invitePanel(p)];
  const end = o.findIndex(x => /หย่า|เลิกกัน/.test(x[0]));   // keep "break up" as the last choice
  if (end < 0) o.push(entry); else o.splice(end, 0, entry);
  return o;
};

console.assert(typeof INVITES === 'object' && typeof invitePanel === 'function', 'fun times ready');
