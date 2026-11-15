'use strict';
// Story-style conversations: wooden dialogue box with a typewriter text, a portrait panel with expressions and a name plate,
// choices above the box, and the speaker stands still. Townsfolk also have minds: thoughts, dreams and opinions of each other.
// ---- minds ----
const DREAMS = { worker: ['ได้เป็นผู้จัดการ', 'เก็บเงินซื้อบ้าน', 'ได้เที่ยวรอบโลก'], barista: ['เปิดคาเฟ่ของตัวเอง', 'ชนะประกวดลาเต้อาร์ต'], clerk: ['มีมินิมาร์ทที่ใหญ่ที่สุดในเมือง'], freelance: ['ตีพิมพ์หนังสือของตัวเอง', 'วาดภาพระดับมาสเตอร์พีซ'],
  athlete: ['ชนะงาน Fun Run', 'วิ่งมาราธอนสักครั้ง'], shopkeeper: ['ออกแบบโซฟาที่นุ่มที่สุด'], student: ['เป็นนักวิทยาศาสตร์', 'เป็นนักร้องชื่อดัง', 'ได้บินไปดวงจันทร์', 'สร้างหุ่นยนต์'], retiree: ['ทำสวนให้เสร็จ', 'ได้เห็นหลานโตขึ้น'] };
var aff = (a, b) => { const h = Math.floor(hash01((a.k + 1) * 131 + (b.k + 1) * 17) * 5) - 2; return a.trait === b.trait ? Math.min(2, h + 1) : h; };   // -2 dislike … +2 adore
const dreamOf = p => { const l = DREAMS[p.role] || DREAMS.worker; return l[(p.k * 7 + 3) % l.length]; };
const pn = () => st.name;
function mindOf(p) {
  const r = st.rel[p.id] || { f: 0, h: 0 }, h = hour(), c = [], slot = p.slot;
  if ((r.h || 0) >= 50) c.push(['💢', `ฉันทน${pn()}ไม่ได้เลย หยาบคายจริงๆ!`, 'angry']);
  if (wet() && !p.fam) c.push(['☔', 'โอ๊ย ไม่ชอบเปียกฝนเลย ร่มอยู่ไหนนะ?', 'sad']);
  if (festOn()) c.push(['🎉', `เทศกาล${festOn().n}แล้ว! ชอบช่วงนี้ที่สุด`, 'happy']);
  if (slot === 'cafe') c.push(['☕', 'อยากได้กาแฟสักแก้วตอนนี้จัง', 'neutral']); if (slot === 'office') c.push(['💼', 'อีกไม่กี่ชั่วโมงก็ได้กลับบ้านแล้ว…', 'sad']);
  if (slot === 'school') c.push(['📚', 'หวังว่าครูจะไม่เรียกตอบนะ', 'sad']); if (slot === 'park') c.push(['🌳', 'ลมเย็นสบาย นั่งได้ทั้งวันเลย', 'happy']); if (slot === 'mart') c.push(['🛒', 'ต้องซื้อไข่ นม… แล้วลืมอะไรอีกนะ?', 'neutral']);
  if (h < 8) c.push(['😴', 'เช้าเกินไป… ขอนอนอีกหน่อย', 'sad']); if (h >= 20) c.push(['🌙', 'ดาวเต็มฟ้า เป็นค่ำคืนที่เงียบสงบจริงๆ', 'neutral']);
  if ((r.f || 0) >= 60 && !(r.h > 0)) c.push(['💕', `สงสัยจังว่า${pn()}อยากไปเที่ยวด้วยกันไหมนะ`, 'happy']);
  if (p.mate) c.push(['💑', `คู่ชีวิตของฉันคือสิ่งที่ดีที่สุดในชีวิต`, 'happy']);
  const ts = typeof townScore === 'function' ? townScore() : 50; if (ts < 45) c.push(['😟', 'เมืองนี้ไม่เหมือนเดิมแล้ว…', 'sad']); if (ts >= 60) c.push(['😊', 'เมืองพิกเซลดีขึ้นทุกปีเลย!', 'happy']);
  c.push(['✨', `ฉันยังฝันว่าสักวันจะ${dreamOf(p)}`, 'happy']);
  const o = people.filter(x => !x.fam && x !== p && !st.gone?.[x.id]); if (o.length) { const x = o[(p.k * 5 + Math.floor(day() / 2)) % o.length], a = aff(p, x); if (a >= 1) c.push(['🤔', `${x.n} เป็นคนน่ารักมากเลย`, 'happy']); if (a <= -1) c.push(['🤨', `ช่วงนี้${x.n}ทำฉันหงุดหงิดชะมัด`, 'angry']); }
  c.push(['💭', (p.says || ['อืม…'])[(p.k + day()) % (p.says || [1]).length], 'neutral']);
  return c[Math.floor(hash01(p.k * 17 + day() * 24 + h) * c.length)] ?? c[0];
}
// ---- portraits ----
function portrait(p, expr = 'neutral') {
  const c = el('canvas', { width: 72, height: 72, style: 'width:100%;height:100%;image-rendering:pixelated;display:block' }), x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const spr = p.spr?.[0]?.[0] || sheet(palOf(p.look || randomLook('f')))[0][0];
  const g1 = x.createLinearGradient(0, 0, 0, 72); g1.addColorStop(0, expr === 'angry' ? '#e8a0a0' : '#f8d8a8'); g1.addColorStop(1, expr === 'angry' ? '#c86a6a' : '#e8b878'); x.fillStyle = g1; x.fillRect(0, 0, 72, 72);
  x.drawImage(spr, 3, 0, 18, 18, 0, 0, 72, 72);   // head crop of the 24x40 sprite, 4x
  const sk = x.getImageData(26, 50, 1, 1).data, skin = `rgb(${sk[0]},${sk[1]},${sk[2]})`, R2 = (col, X, Y, w, h) => { x.fillStyle = col; x.fillRect(X, Y, w, h); }, D = '#3a2418';
  // face layout at 4x: eyes x 20 / 44, y 40-51; mouth x 32-39, y 56; cheeks y 52
  const eye = ex => ({ happy: () => { R2(skin, ex, 40, 8, 12); R2(D, ex, 46, 2, 2); R2(D, ex + 2, 44, 2, 2); R2(D, ex + 4, 44, 2, 2); R2(D, ex + 6, 46, 2, 2); },
    sad: () => { R2(D, ex + (ex < 32 ? 2 : 0), 36, 6, 2); R2(D, ex + (ex < 32 ? 0 : 6), 38, 2, 2); }, angry: () => { R2('#2a1a18', ex, 35, 8, 2); R2('#2a1a18', ex + (ex < 32 ? 6 : 0), 37, 2, 2); } }[expr] || (() => 0))();
  eye(20); eye(44);
  ({ happy: () => { R2(skin, 28, 54, 16, 8); R2('#7a2a2a', 30, 55, 12, 5); R2('#fff', 32, 55, 8, 2); R2('#f2a0a0', 14, 52, 8, 3); R2('#f2a0a0', 50, 52, 8, 3); },
    sad: () => { R2(skin, 28, 54, 16, 8); R2('#8a4a4a', 31, 57, 10, 2); R2('#8a4a4a', 29, 59, 2, 2); R2('#8a4a4a', 41, 59, 2, 2); R2('#7ac8ff', 22, 52, 3, 6); },
    angry: () => { R2(skin, 28, 54, 16, 8); R2('#7a2a2a', 30, 57, 12, 3); R2('#e86a6a40', 0, 0, 72, 72); } }[expr] || (() => 0))();
  return c;
}
// ---- box ----
document.head.append(el('style', { textContent: `#talk{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);width:min(760px,97vw);display:flex;z-index:5;font-family:Mitr,system-ui,sans-serif}
#talk .tx{flex:1;min-height:112px;background:#f9dc9e;border:6px solid #8a5a2a;border-right:none;border-radius:10px 0 0 10px;box-shadow:inset 0 0 0 3px #d49a52,0 6px 0 #0006;padding:12px 16px;color:#5a3a1a;font-size:17px;line-height:1.45;cursor:pointer;position:relative}
#talk .pt{width:136px;background:#f9dc9e;border:6px solid #8a5a2a;border-radius:0 10px 10px 0;box-shadow:inset 0 0 0 3px #d49a52,0 6px 0 #0006;padding:8px;display:flex;flex-direction:column;align-items:center;gap:6px}
#talk .fr{width:104px;height:104px;border:4px solid #8a5a2a;border-radius:6px;overflow:hidden;background:#fff}
#talk .nm{background:#8a5a2a;color:#fff3d8;border-radius:6px;padding:2px 14px;font-size:15px}
#talk .nx{position:absolute;right:12px;bottom:6px;color:#a06a2a;animation:bl .9s steps(2) infinite}@keyframes bl{50%{opacity:0}}
#talkc{position:fixed;right:max(12px,calc(50% - 380px));bottom:200px;display:flex;flex-direction:column;gap:4px;z-index:5;min-width:230px;max-width:min(380px,92vw);max-height:calc(100vh - 215px);overflow-y:auto;padding:2px 4px 6px 2px}
#talkc button{text-align:left;background:#f9dc9e;border:4px solid #8a5a2a;border-radius:8px;color:#5a3a1a;font:inherit;font-size:14px;padding:3px 10px;flex:0 0 auto;box-shadow:inset 0 0 0 2px #d49a52,0 3px 0 #0006;cursor:pointer}
#talkc button:hover,#talkc button:focus-visible{background:#ffe9b8;outline:none;border-color:#c0701e}` }));
const talkEl = el('div', { id: 'talk', hidden: true }), choiceEl = el('div', { id: 'talkc', hidden: true }); document.body.append(talkEl, choiceEl);
var escSkip = 0;   // system.js ignores an Esc that just closed the talk box
let TK = null;   // { p, full, shown, expr, after, opts, title }
const emoOf = v => v > 0 ? 'happy' : v < 0 ? 'angry' : 'neutral';
function render2() {
  if (!TK) return; const p = TK.p, nm = p.id === 'dad' ? 'พ่อ' : p.id === 'mom' ? 'แม่' : p.n;
  talkEl.replaceChildren(el('div', { className: 'tx', onclick: advance }, TK.text = el('span', {}, TK.full.slice(0, TK.shown)), TK.shown >= TK.full.length ? el('span', { className: 'nx' }, TK.opts ? '' : '▼') : null),
    el('div', { className: 'pt' }, el('div', { className: 'fr' }, portrait(p, TK.expr)), el('div', { className: 'nm' }, nm)));
  choiceEl.replaceChildren(...(TK.opts && TK.shown >= TK.full.length ? TK.opts.map(([t, f], i) => el('button', { textContent: `${i + 1}. ${t}`, onclick: () => pickOpt(i) })) : []));
  choiceEl.hidden = !choiceEl.children.length; talkEl.hidden = false;
}
function typeTick() {
  if (!TK || TK.shown >= TK.full.length) return; TK.shown = Math.min(TK.full.length, TK.shown + 1); if (TK.text) TK.text.textContent = TK.full.slice(0, TK.shown);
  if (TK.shown >= TK.full.length) render2();
}
setInterval(typeTick, 22);
function begin(p) {
  if (TK) return; TK = { p, full: '', shown: 0, expr: 'neutral' }; p.talking = true; if (p.h) p.h.talking = true; menuOpen = true; keys.clear();
}
function closeTalk() { if (!TK) return; TK.p.talking = false; if (TK.p.h) TK.p.h.talking = false; TK = null; talkEl.hidden = true; choiceEl.hidden = true; menuOpen = false; }
function line(text, expr, after) {
  if (!TK) return; const m = text.match(/^[^:]{1,20}:\s*"?(.*?)"?$/s); TK.full = (m ? m[1] : text).replace(/^"|"$/g, ''); TK.shown = 0; TK.expr = expr || TK.expr; TK.opts = null; TK.after = after || null; render2();
}
function advance() { if (!TK) return; if (TK.shown < TK.full.length) { TK.shown = TK.full.length; render2(); return; } if (TK.opts) return; const a = TK.after; TK.after = null; a ? a() : closeTalk(); }
function pickOpt(i) { if (!TK?.opts) return; const f = TK.opts[i][1]; TK.opts = null; choiceEl.hidden = true; f(); if (TK && !TK.full) closeTalk(); }
// ---- wiring ----
const _say14 = say; say = t => { if (TK) { line(t, emoOf(lastV), TK.noMore ? null : () => cont(TK.p)); lastV = 0; } else _say14(t); };
const _talk14 = talk;
function cont(p) {   // next round of a conversation, or the polite goodbye once today's chats are used up
  const r = relOf(p.id); if (!hated(p) && r.tk === day() && r.tn >= 4) { TK.noMore = true; return say(`${p.n}: "ไว้คุยกันพรุ่งนี้นะ เรายังมีธุระต้องทำ"`); }
  TK.noMore = false; _talk14(p);
}
chatHook = (p, title, opts) => {
  if (!TK) begin(p);
  const mind = mindOf(p), extra = [['💭 กำลังคิดอะไรอยู่?', () => { lastV = 0; line(`${p.n}: "${mind[1]}"`, mind[2], () => cont(p)); }],
    ['✨ ความฝันของคุณคืออะไร?', () => line(`${p.n}: "ฉันฝันว่าสักวันจะ${dreamOf(p)}"`, 'happy', () => cont(p))],
    ['👥 คุณคิดยังไงกับ…?', () => {
      const o = people.filter(x => !x.fam && x !== p && !st.gone?.[x.id]).sort((a, b) => hash01(a.k * 3 + p.k) - hash01(b.k * 3 + p.k)).slice(0, 3); line(`${p.n}: "หมายถึงใครเหรอ?"`, 'neutral');
      TK.opts = o.map(x => [x.n, () => { const a = aff(p, x); line(`${p.n}: "${a >= 1 ? `${x.n} เป็นคนดีมาก เราสนิทกันดี` : a <= -1 ? `${x.n}… เราเข้ากันไม่ค่อยได้` : `${x.n} ก็โอเคนะ`}."`, a > 0 ? 'happy' : a < 0 ? 'angry' : 'neutral', () => cont(p)); }]); render2();
    }]];
  const hat = hated(p), all = [...(hat ? [] : extra), ...opts, ['ลาก่อน 👋', () => closeTalk()]];
  line(`${p.n}: "${hat ? '…มีอะไร?' : /เหลือ.*ครั้ง|left today/.test(title) ? ['อ้าว หวัดดี!', 'สวัสดีจ้า!', 'ดีใจที่ได้เจอ', 'เฮ้! '][(p.k + day()) % 4] : '…'}"`, hat ? 'angry' : (st.rel[p.id]?.f || 0) >= 60 ? 'happy' : 'neutral');
  TK.opts = all; TK.title = title; render2();
};
talk = p => { if (!TK) begin(p); cont(p); };
addEventListener('keydown', e => {   // capture: runs before the game's own key handling
  if (!TK) return; const k = keyOf(e);
  if (['e', ' ', 'enter'].includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) advance(); }
  else if (k === 'escape') { e.stopImmediatePropagation(); escSkip = performance.now(); closeTalk(); }
  else if (/^[1-9]$/.test(k) && TK.opts) { e.stopImmediatePropagation(); if (+k <= TK.opts.length) pickOpt(+k - 1); }
}, true);
$('abtn').addEventListener('pointerdown', e => { if (TK) { e.preventDefault(); e.stopImmediatePropagation(); advance(); } }, true);
const _closeMenu14 = closeMenu; closeMenu = () => { _closeMenu14(); if (TK) { TK.p.talking = false; TK = null; talkEl.hidden = true; choiceEl.hidden = true; } };
const _up14 = updatePerson; updatePerson = (p, dt) => { if (p.talking) { animate(p, false, dt); if (player) p.dir = faceTo(p, player); return; } _up14(p, dt); };
const _wander14 = wander; wander = (sc, n, sp, dt, ar) => { if (n.talking) { animate(n, false, dt); return; } _wander14(sc, n, sp, dt, ar); };
// folks (ambient strangers) also stop and show a portrait when greeted
for (const t of town.targets) void t;
// ---- thought bubbles: one at a time, every ~10 s, never over the HUD or talk box ----
let bubbleP = null, bubbleTxt = '', bubbleUntil = 0, bubbleNext = 0;
const _update14 = update;
update = dt => {
  _update14(dt);
  if (!player || scene !== town || TK || menuOpen || panelOpen || busy || (typeof deco !== 'undefined' && deco.on)) return;
  if (typeof CFG !== 'undefined' && CFG.thoughts === false) return;
  if (now() < bubbleNext) return;
  let best = null, bd = 64;
  for (const p of people) { if (p.talking || p.slot === 'in') continue; const d = Math.hypot(player.x - p.x, player.y - p.y); if (d < bd) { bd = d; best = p; } }
  if (!best) return;
  bubbleP = best; bubbleTxt = mindOf(best)[0]; bubbleUntil = now() + 3000; bubbleNext = now() + 9000;
};
const _drawEnt14 = drawEnt;
drawEnt = e => {
  _drawEnt14(e);
  if (e === bubbleP && now() < bubbleUntil && !e.talking && scene === town) {
    const x = Math.round(e.x), y = Math.round(e.y) - 56 - Math.round(Math.sin(now() / 400) * 1.5);
    disc(x, y, 8, '#ffffffee'); disc(x - 6, y + 9, 2, '#ffffffee'); disc(x - 3, y + 13, 1, '#ffffffee');
    g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(bubbleTxt, x, y + 4); g.textAlign = 'left';
  }
};
console.assert(typeof mindOf === 'function' && Object.keys(DREAMS).length >= 8, 'minds ready');
