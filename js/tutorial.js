'use strict';
// Guided tutorial: a short quest chain for the new online-work loop. Each step has a live
// check, a world marker/compass drawn on the canvas, a phone-app highlight, and a small
// tracker panel. The state lives in st.tut so save/load keeps the exact step.

const TUT_LEN = 9;
const TUT_STEPS = [
  { id: 'move', icon: '🚶', t: 'เดินสำรวจบ้าน', d: 'ใช้จอยซ้ายล่าง (มือถือ) หรือ WASD/ลูกศร เดินไปรอบ ๆ ห้องสักหน่อย',
    done: () => scene !== home || Math.hypot(player.x - st.tut.sx, player.y - st.tut.sy) > 90 },
  { id: 'hud', icon: '📊', t: 'เปิดแผงสถานะ', d: 'แตะแถบชื่อมุมซ้ายบนเพื่อกางแผง พลังงาน ความอิ่ม และความสุขจะโผล่ขึ้นมา',
    ui: '#hud', done: () => hudExpanded },
  { id: 'phone', icon: '📱', t: 'หยิบโทรศัพท์ขึ้นมา', d: 'แตะปุ่ม 📱 มุมขวาล่าง (หรือกด P) โทรศัพท์คือศูนย์กลางทุกอย่างในเกมนี้',
    ui: () => panelOpen ? null : '#bPhone', done: () => !!st.tut.flags.phone },
  { id: 'online', icon: '🌐', t: 'เปิดแอปงานออนไลน์', d: 'ในหน้าโทรศัพท์ แตะไอคอน 🌐 งานออนไลน์ — ที่นี่มีทั้งงานรายวันและอาชีพสายเทค',
    ui: () => !panelOpen ? '#bPhone' : (typeof pApp !== 'undefined' && pApp ? null : '[data-app="online"]'),
    done: () => !!st.tut.flags.online },
  { id: 'apply', icon: '💼', t: 'สมัครอาชีพสายออนไลน์', d: 'เลือกสายที่ชอบ เช่น โปรแกรมเมอร์ นักพัฒนาเกม หรือครีเอเตอร์ แล้วกด “สมัคร” ทำงานจากคอมที่บ้านได้เลย',
    ui: () => tutBoardOpen() ? '[data-job]' : null,
    done: () => !!(st.job && JOBS[st.job.id]?.remote) },
  { id: 'shift', icon: '💻', t: 'ทำงานกะแรกจากบ้าน', d: 'กลับบ้าน ไปที่คอมพิวเตอร์ แล้วเลือก “เริ่มกะงานออนไลน์” — ทำมินิเกมให้ดีจะได้ผลงานเพิ่ม',
    target: () => tutHomePoint('pc', 'คอมพิวเตอร์'),
    act: () => scene !== home ? { label: '🏠 พากลับบ้าน', fn: goHome } : null,
    note: () => { const J = st.job && JOBS[st.job.id]; if (!J?.remote) return 'ยังไม่มีอาชีพสายออนไลน์ — กลับไปสมัครในโทรศัพท์ก่อน'; const h = hour(); return h < J.start || h >= J.end - 1 ? `เลยเวลาเข้างานแล้ว (${J.start}:00–${J.end - 1}:00) — ไปนอนที่เตียงเพื่อข้ามไปพรุ่งนี้` : `เข้างานได้ถึง ${J.end - 1}:00 น.`; },
    done: () => (st.stats.techShifts || 0) > (st.tut.base || st.tut.at).shifts },
  { id: 'gig', icon: '🎬', t: 'ส่งงานออนไลน์ชิ้นแรก', d: 'เปิดโทรศัพท์ → งานออนไลน์ → เลือกงานที่ทำได้ กด “รับงาน” แล้วเล่นมินิเกมให้จบ งานใหม่มาใหม่ทุกวัน',
    ui: () => tutBoardOpen() ? '[data-gig]' : null,
    done: () => (st.stats.onlineGigs || 0) > (st.tut.base || st.tut.at).gigs },
  { id: 'sleep', icon: '🛏️', t: 'นอนพักผ่อน', d: 'กลับบ้าน ไปที่เตียง แล้วนอน 8 ชั่วโมง — การนอนข้ามคืนคือวิธีขึ้นวันใหม่',
    target: () => tutHomePoint('bed', 'เตียง'),
    act: () => scene !== home ? { label: '🏠 พากลับบ้าน', fn: goHome } : null,
    done: () => st.min - (st.tut.base || st.tut.at).min >= 420 },
  { id: 'save', icon: '💾', t: 'บันทึกความคืบหน้า', d: 'เปิดเมนู ⚙️ แล้วกด “บันทึกเกม” หรือกดปุ่มด้านล่าง — เกมเซฟอัตโนมัติทุก 10 วินาทีด้วย',
    ui: '#bMenu', act: () => ({ label: '💾 บันทึกเลย', fn: () => { save(); tutSeen('saved'); say('บันทึกเกมแล้ว 💾'); } }),
    done: () => !!st.tut.flags.saved },
];

// ---- styles ----
document.head.append(el('style', { textContent: `
#tut{position:fixed;top:calc(52px + var(--st));right:calc(10px + var(--sr));width:min(292px,46vw);padding:8px 10px;font-size:13px;line-height:1.35;z-index:2}
#tut .th{display:flex;align-items:center;justify-content:space-between;gap:6px;color:var(--gold);font-weight:600;font-size:12px}
#tut .th b{font-size:14px}
#tut .tt{font-weight:600;color:var(--gold);font-size:14.5px;margin-top:2px;display:flex;gap:5px;align-items:center}
#tut .td{opacity:.92;font-size:12.5px;margin-top:2px}
#tut .tn{color:#ffb0a0;font-size:12px;margin-top:3px}
#tut .tb{height:5px;background:#0007;border-radius:3px;overflow:hidden;margin:6px 0 4px}#tut .tb i{display:block;height:100%;background:#ffe08a;box-shadow:inset 0 1px #fff8}
#tut .ta{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px}
#tut button{font-size:11.5px;padding:3px 8px;min-height:0;border-radius:6px}
#tut button.go{background:#4a3c7a;border-color:#ffe08a}
#tut .tg{font-size:11px;opacity:.75;margin-top:3px}
.tut-note{background:#ffe08a1c;border:2px solid #ffe08a77;border-radius:8px;padding:6px 8px;font-size:12.5px;line-height:1.4;color:var(--gold);flex-shrink:0}
.tut-pulse{outline:3px solid #ffe08a!important;outline-offset:2px;box-shadow:0 0 0 5px #ffe08a33,0 0 20px #ffe08a99!important;position:relative;z-index:2;animation:tutp 1s ease-in-out infinite}
@keyframes tutp{50%{outline-color:#fff6c8;box-shadow:0 0 0 8px #ffe08a22,0 0 26px #ffe08acc}}
@media (max-width:640px){#tut{width:min(246px,50vw);font-size:12px;padding:6px 8px}#tut .td{font-size:11.5px}#tut .tt{font-size:13px}}
@media (pointer:coarse) and (max-height:500px){#tut{top:calc(8px + var(--st));right:calc(8px + var(--sr));width:min(252px,40vw);padding:5px 7px}#tut .ta button{padding:2px 6px}}
@media (prefers-reduced-motion:reduce){.tut-pulse{animation:none}}
` }));

const tutEl = el('div', { id: 'tut', className: 'panel', hidden: true, role: 'status' });
document.body.append(tutEl);

const tutNow = () => st.tut && st.tut.on && st.tut.step < TUT_LEN ? st.tut : null;
const tutBoardOpen = () => panelOpen && ((typeof pApp !== 'undefined' && pApp === 'online') || /งานออนไลน์/.test(panelEl.querySelector('h3')?.textContent || ''));
const tutRec = () => ({ day: day(), min: st.min, shifts: st.stats.techShifts || 0, gigs: st.stats.onlineGigs || 0 });
function tutSeen(k) { const T = tutNow(); if (T && k) T.flags[k] = 1; }

function tutHomePoint(cat, label) {
  if (scene === home) {
    const f = st.furn.find(f => FURN[f.id]?.cat === cat);
    if (f) { const F = FURN[f.id]; return { x: f.x * T + F.w * T / 2, y: (f.y + F.h) * T - 6, name: label }; }
  }
  return { x: HOME_DOOR.ix, y: HOME_DOOR.iy + 10, name: 'บ้านของฉัน' };
}

// ---- step flow ----
function tutStart() {
  st.tut = { on: 1, step: 0, sx: player?.x ?? 0, sy: player?.y ?? 0, at: tutRec(), base: tutRec(), flags: {}, claimed: st.tut?.claimed || 0 };
  tutUIKey = ''; save(); tutRefresh(); toast('🧭 เริ่มบทสอนใหม่ — ทำตามลูกศรทองคำ');
}
function tutClose() {
  const T = st.tut; if (!T) return;
  T.on = 0; closePanel(); save(); tutUIKey = ''; tutRefresh();
  toast('ปิดบทสอนแล้ว — เปิดใหม่ได้ที่โทรศัพท์ → 🧭 บทสอน');
}
function tutSkip() { const T = tutNow(); if (!T) return; tutAdvance(true); }
function tutAdvance(skipped) {
  const T = tutNow(); if (!T) return;
  const S = TUT_STEPS[T.step];
  T.step++;
  T.at = tutRec(); T.sx = player.x; T.sy = player.y;
  if (T.step >= TUT_LEN) {
    T.on = 0; T.finished = day();
    if (!T.claimed) { T.claimed = 1; fx({ money: 300, mood: 12 }); xp('logic', 60); toast('🎉 ผ่านบทสอนครบทุกขั้น! รับรางวัล ฿300'); }
    else toast('🎉 เล่นจบบทสอนอีกครั้งแล้ว!');
    checkAch();
  } else toast(`✅ ${S.t} สำเร็จ! ต่อไป: ${TUT_STEPS[T.step].t}`);
  tutUIKey = ''; save(); tutRefresh();
}

let tutT = 0, tutUIKey = '', tutPulseEl = null;
function tutTick(dt) {
  if (!player) return;
  if ((tutT += dt) < .25) return; tutT = 0;
  const T = st.tut;
  if (panelOpen) {
    const h = panelEl.querySelector('h3')?.textContent || '';
    if (T?.on) { if (h.includes('งานออนไลน์') || (typeof pApp !== 'undefined' && pApp === 'online')) T.flags.online = 1; if (h.includes('โทรศัพท์')) T.flags.phone = 1; }
  }
  tutPulse();
  const A = tutNow();
  if (A) { const S = TUT_STEPS[A.step]; if (S.done()) tutAdvance(false); }
  const key = `${st.tut?.on ? 1 : 0}|${st.tut?.step ?? -1}|${panelOpen}|${menuOpen}|${mg ? 1 : 0}|${busy ? 1 : 0}`;
  if (key !== tutUIKey) { tutUIKey = key; tutRefresh(); }
}
function tutPulse() {
  const T = tutNow();
  let sel = null;
  if (T) {
    const S = TUT_STEPS[T.step];
    sel = typeof S.ui === 'function' ? S.ui() : (S.ui || null);
    if (!sel && panelOpen) {
      if (T.step === 4) sel = '[data-job]';
      else if (T.step === 6) sel = '[data-gig]';
    }
  }
  let node = null;
  if (sel) {
    try { node = [...document.querySelectorAll(sel)].find(b => !b.disabled && b.isConnected) || null; } catch (e) { node = null; }
  }
  if (tutPulseEl !== node) {
    if (tutPulseEl) tutPulseEl.classList.remove('tut-pulse');
    tutPulseEl = node;
    if (tutPulseEl) tutPulseEl.classList.add('tut-pulse');
  }
}
function tutNote() {
  const T = tutNow(); if (!T || !panelOpen) return;
  const body = panelEl.querySelector('.body'); if (!body) return;
  const S = TUT_STEPS[T.step];
  let n = body.querySelector('.tut-note');
  if (!n) { n = el('div', { className: 'tut-note' }); body.prepend(n); }
  n.textContent = `🧭 ${T.step + 1}/${TUT_LEN} · ${S.t} — ${S.d}`;
}
function tutRefresh() {
  const T = tutNow(), open = !!(T || (st.tut && !st.tut.on && panelOpen));
  tutEl.hidden = !T || panelOpen || menuOpen || !!mg || busy;
  if (open && panelOpen) tutNote();
  if (!T || tutEl.hidden) return;
  const i = T.step, S = TUT_STEPS[i];
  let act = null;
  if (S.act) { try { act = S.act(); } catch (e) { act = null; } }
  const note = S.note ? S.note() : '';
  const kids = [
    el('div', { className: 'th' }, el('b', {}, `🧭 บทสอน ${i + 1}/${TUT_LEN}`), el('span', {}, `${Math.round(T.step / TUT_LEN * 100)}%`)),
    el('div', { className: 'tt' }, `${S.icon} ${S.t}`),
    el('div', { className: 'td' }, S.d),
    note ? el('div', { className: 'tn' }, `⚠️ ${note}`) : null,
    el('div', { className: 'tb' }, el('i', { style: `width:${T.step / TUT_LEN * 100}%` })),
    el('div', { className: 'ta' },
      act ? btn(act.label, act.fn) : null,
      btn('ข้ามขั้น', tutSkip), btn('ปิด', tutClose)),
  ].filter(Boolean);
  tutEl.replaceChildren(...kids);
}

// ---- world marker + screen-edge compass ----
function tutMarker() {
  const T = tutNow(); if (!T || panelOpen || menuOpen || mg || busy || !player) return;
  const S = TUT_STEPS[T.step]; if (!S.target) return;
  let P; try { P = S.target(); } catch (e) { return; }
  if (!P) return;
  const dist = Math.hypot(P.x - player.x, P.y - player.y);
  const x = P.x - cam.x, y = P.y - cam.y, t = now() / 1000;
  const inside = x > 16 && x < VW - 16 && y > 16 && y < VH - 16;
  if (inside) {
    const bob = Math.sin(t * 4) * 3;
    ctx.strokeStyle = 'rgba(255,224,138,.85)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 9 + Math.sin(t * 4) * 3, (9 + Math.sin(t * 4) * 3) * .5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.save(); ctx.translate(x, y - 38 + bob); ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-7, 8); ctx.lineTo(-7, -8); ctx.closePath(); ctx.fillStyle = '#ffe08a'; ctx.fill(); ctx.strokeStyle = '#2a1a2e'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    const label = `${Math.max(1, Math.round(dist / T))}M`; ptext(label, Math.round(x - ptw(label) / 2), Math.round(y - 60 + bob), '#ffe08a');
  } else {
    const cx = VW / 2, cy = VH / 2, dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx);
    const k = Math.min((VW / 2 - 30) / Math.max(1, Math.abs(dx)), (VH / 2 - 30) / Math.max(1, Math.abs(dy)));
    const ex = cx + dx * k, ey = cy + dy * k;
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-9, 11); ctx.lineTo(-9, -11); ctx.closePath(); ctx.fillStyle = '#ffe08a'; ctx.fill(); ctx.strokeStyle = '#2a1a2e'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    const label = `${Math.max(1, Math.round(dist / T))}M`; ptext(label, Math.round(ex - ptw(label) / 2), Math.round(ey + 16), '#ffe08a');
  }
}

// ---- phone app ----
function tutApp() {
  const T = st.tut || { step: 0, on: 0 };
  const at = T.on ? Math.min(T.step, TUT_LEN) : T.step, legacy = !!T.legacy && !T.finished;
  return [
    el('div', { className: 'sub' }, 'บทสอนพาไปทีละขั้น: เดิน – เปิดแผงสถานะ – โทรศัพท์ – สมัครงานออนไลน์ – ทำงานกะแรก – ส่งงานออนไลน์ – นอน – เซฟ'),
    ...(legacy ? [el('div', { className: 'sub' }, 'เซฟนี้เริ่มมาก่อนมีบทสอน — กดเริ่มสอนใหม่เพื่อเล่นบทสอนได้เลย')] : []),
    ...TUT_STEPS.map((S, i) => row(!legacy && i < at ? '✅' : i === at && T.on ? '👉' : '⬜', `${i + 1}. ${S.t}`, S.d)),
    T.on ? btn('⏸ ปิดบทสอน', tutClose) : btn('▶ เริ่มบทสอน', () => { closePanel(); tutStart(); }),
    btn('🔄 เริ่มสอนใหม่ตั้งแต่ต้น', () => { closePanel(); tutStart(); }),
  ];
}
APP.tut = tutApp; APPS.push(['tut', '🧭', 'บทสอน']);

// ---- integration: mark UI steps and keep the tracker in sync ----
const _openPanelTut = openPanel;
openPanel = (title, build) => { _openPanelTut(title, build); if (tutNow()) { tutUIKey = ''; tutNote(); } };
const _refreshTut = refreshPanel;
refreshPanel = () => { _refreshTut(); if (tutNow()) tutNote(); };
const _phoneTut = phonePanel;
phonePanel = () => { _phoneTut(); if (panelOpen) tutSeen('phone'); };
const _overlayTut = overlayFx;
overlayFx = sc => { _overlayTut(sc); tutMarker(); };
const _updateTut = update;
update = dt => { _updateTut(dt); tutTick(dt); };
const _startTut = start;
start = saved => {
  _startTut(saved);
  const had = !!(saved && saved.st && saved.st.tut);
  if (!saved) st.tut = { on: 1, step: 0, sx: player.x, sy: player.y, at: tutRec(), base: tutRec(), flags: {}, claimed: 0 };
  else if (!had) st.tut = { on: 0, step: TUT_LEN, flags: {}, claimed: 0, legacy: 1 };   // old saves stay clean, but can still earn the reward once
  tutUIKey = ''; save(); tutRefresh();
};

// the pause menu's own save button completes the save step
addEventListener('click', e => {
  const b = e.target?.closest?.('button'); if (!b) return;
  if (menuOpen && /บันทึกเกม/.test(b.textContent)) tutSeen('saved');
}, true);

ACH.push(['tutorial', '🧭 นักเรียนชีวิต', 'ผ่านบทสอนเล่นครบทุกขั้น', () => !!st.tut?.finished]);

console.assert(TUT_STEPS.length === TUT_LEN, 'tutorial steps match length');
console.assert(TUT_STEPS.every(S => S.id && S.t && S.d && typeof S.done === 'function'), 'tutorial steps valid');
