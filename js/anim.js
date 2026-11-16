'use strict';
// Activity animations: while a short action plays the player faces the camera, props animate in their hands and a progress bar fills.
// doAct(kind, fn) locks input, plays the animation, then runs fn (the original action) so game logic is unchanged.
const ACT_DUR = { cook: 1800, wash: 1100, read: 1700, tv: 1700, type: 1700, sit: 1300, bath: 1900, water: 1300, paint: 2200, run: 1900, piano: 2000, lift: 1900, dig: 1300, sleep: 2200, talk: 1300, eat: 1200 };
const ACT_NAME = { cook: 'กำลังทำอาหาร', wash: 'ล้างจาน', read: 'กำลังอ่าน', tv: 'ดูทีวี', type: 'ใช้คอมพิวเตอร์', sit: 'นั่งพัก', bath: 'แช่น้ำอุ่น', water: 'รดน้ำ', paint: 'วาดรูป', run: 'วิ่ง', piano: 'เล่นเปียโน', lift: 'ยกเวท', dig: 'ขุด', sleep: 'นอนหลับ', talk: 'พูดคุย', eat: 'กิน' };
let ACT = null;
const progEl = el('div', { id: 'prog', className: 'panel', hidden: true, style: 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);padding:8px 14px;min-width:200px;text-align:center;font-size:14px;z-index:2' },
  el('div', { id: 'progL' }), el('div', { className: 'bar', style: 'height:9px;margin:5px 0 0' }, el('i', { id: 'progF', style: 'width:0;background:#7ee07e' })));
document.body.append(progEl);
function doAct(kind, fn, label = '') {
  if (ACT || busy || !ACT_DUR[kind]) return ACT || busy ? undefined : fn();
  keys.clear(); player.dir = 0; ACT = { kind, t: 0, dur: ACT_DUR[kind] / 1000, fn };   // table is in ms, timers in seconds
  document.getElementById('progL').textContent = label.replace(/\s*฿\d+|\s*\(.*\)|\s*\d+(\.\d)? ?(นาที|min|ชม\.|h)\b.*/g, '').trim() || ACT_NAME[kind] || kind;
  progEl.hidden = false; busy = true;
}
function actTick(dt) {
  ACT.t += dt; const k = ACT.kind;
  if (['run', 'type', 'piano', 'lift'].includes(k)) animate(player, true, dt * (k === 'run' ? 2.2 : 1)); else player.frame = 0;
  document.getElementById('progF').style.width = Math.min(100, ACT.t / ACT.dur * 100) + '%';
  if (ACT.t < ACT.dur) return;
  const f = ACT.fn; ACT = null; busy = false; progEl.hidden = true; player.frame = 0; f();
}
const _update = update;
update = dt => { if (ACT) actTick(dt); _update(dt); };

function drawActProps(x, y) {
  const t = ACT.t, k = ACT.kind, ph = (t * 3) % 1, s = Math.sin(t * 9), c = Math.cos(t * 9);
  const drops = (cx, y0, n, col) => { for (let i = 0; i < n; i++) { const f = (t * 2.2 + i / n) % 1; R(col, Math.round(cx + (i % 2 ? 2 : -2)), Math.round(y0 + f * 14), 1, 2); } };
  if (k === 'cook') {
    R('#5a3a22', x + 3, y - 10 + Math.round(s), 6, 2); R('#2a2a30', x + 8, y - 13 + Math.round(s), 11, 4); R('#4a4a52', x + 8, y - 13 + Math.round(s), 11, 1);
    for (let i = 0; i < 3; i++) R(i % 2 ? '#ffb04a' : '#ff6a2a', x + 9 + i * 3, y - 8 + (Math.floor(t * 12 + i) % 2), 2, 2 + (Math.floor(t * 9 + i) % 2));
    for (let i = 0; i < 3; i++) { const f = (t * 1.2 + i / 3) % 1; disc(Math.round(x + 13 + Math.sin(t * 4 + i) * 3), Math.round(y - 20 - f * 18), 2, `rgba(255,255,255,${.7 - f * .6})`); }
    R('#e8884a', x + 11, y - 15 + Math.round(Math.abs(s) * -3), 2, 2);
  } else if (k === 'wash') { R('#8ad0f0', x - 3, y - 23, 6, 1); drops(x, y - 22, 6, '#8ad0f0'); drops(x + 5, y - 20, 4, '#c8ecfa');
  } else if (k === 'read') { R('#8a5a34', x - 9, y - 14, 18, 9); R('#f4efe6', x - 8, y - 13, 8, 7); R('#f4efe6', x + 1, y - 13, 7, 7); R('#8a8478', x - 7, y - 11, 5, 1); R('#8a8478', x - 7, y - 9, 5, 1); R('#8a8478', x + 2, y - 11, 4, 1);
    if (ph > .6) R('#f4efe6', x - Math.round((ph - .6) * 20) + 4, y - 14, 4, 8);
  } else if (k === 'tv') { R('#6ab8ff30', x - 12, y - 31, 24, 31); R(['#3a8ae8', '#e84a8a', '#5ac87a'][Math.floor(t * 4) % 3] + '40', x - 12, y - 31, 24, 31); R('#2a2a32', x + 7, y - 10, 4, 7); R(RED, x + 8, y - 9, 2, 1);
  } else if (k === 'type') { R('#3a3a48', x - 10, y - 12, 20, 3); R('#9aa0a8', x - 9, y - 13, 18, 1); for (let i = 0; i < 4; i++) if (Math.floor(t * 10) % 4 === i) R('#ffd54a', x - 8 + i * 5, y - 14, 2, 1);
  } else if (k === 'sit') { R('#0003', x - 11, y - 1, 22, 3); R('#c05a4a', x - 10, y - 3, 20, 4); R('#d8705a', x - 10, y - 3, 20, 1);
  } else if (k === 'bath') { R('#8ad0f0', x - 13, y - 14, 26, 14); R('#f4f8fa', x - 14, y - 15, 28, 2); R('#f4f8fa', x - 14, y - 2, 28, 3); for (let i = 0; i < 7; i++) disc(Math.round(x - 11 + i * 3.6), Math.round(y - 15 - Math.abs(Math.sin(t * 3 + i)) * 3), 2, '#fff');
    R('#ffd54a', x + 9, y - 18 + Math.round(s), 5, 3); R('#e8884a', x + 13, y - 18 + Math.round(s), 2, 1);
  } else if (k === 'water') { const tilt = Math.round(Math.min(1, t * 2) * 3); R('#4a8ac8', x + 4, y - 14 - tilt, 9, 6); R('#6aa8e8', x + 4, y - 14 - tilt, 9, 1); R('#4a8ac8', x + 13, y - 12 - tilt, 5, 2); R('#4a8ac8', x + 2, y - 13 - tilt, 2, 4); drops(x + 17, y - 11, 4, '#8ad0f0');
  } else if (k === 'paint') { R('#f8f4ec', x + 7, y - 28, 15, 17); R('#8a5a34', x + 14, y - 11, 2, 11); const n = Math.floor(t / ACT.dur * 9);
    for (let i = 0; i < n; i++) R(['#e84a4a', '#3a8ae8', '#ffd54a', '#5ac87a'][i % 4], x + 9 + (i * 5) % 11, y - 26 + Math.floor(i / 2) * 3, 4, 2);
    R('#8a5a34', x + 4 + Math.round(s * 2), y - 14 + Math.round(c * 2), 2, 6); R('#e84a4a', x + 4 + Math.round(s * 2), y - 15 + Math.round(c * 2), 2, 2);
  } else if (k === 'run') { for (let i = 0; i < 4; i++) R('#ffffff90', Math.round(x - 20 - ((t * 60 + i * 9) % 14)), y - 8 - i * 5, 6, 1);
    for (let i = 0; i < 3; i++) R('#8ad0f0', Math.round(x + 9 + i * 3), Math.round(y - 30 + ((t * 20 + i * 4) % 8)), 1, 2);
    R('#3a3a48', x - 12, y - 2, 24, 3); R('#5a5a68', x - 12 + Math.round((t * 30) % 4) * 6, y - 2, 3, 1);
  } else if (k === 'piano') { for (let i = 0; i < 3; i++) { const f = (t * .9 + i / 3) % 1, nx = Math.round(x + 10 + Math.sin(f * 6 + i) * 6), ny = Math.round(y - 26 - f * 22); R(['#ffd54a', '#8ad0f0', '#ff7ab0'][i], nx, ny, 3, 2); R(['#ffd54a', '#8ad0f0', '#ff7ab0'][i], nx + 2, ny - 4, 1, 5); }
  } else if (k === 'lift') { const up = Math.round(Math.abs(Math.sin(t * 4)) * 9); R('#6a6a78', x - 13, y - 22 - up, 26, 2); R('#3a3a48', x - 15, y - 25 - up, 3, 8); R('#3a3a48', x + 12, y - 25 - up, 3, 8); R('#5a5a68', x - 12, y - 24 - up, 1, 6);
    R('#c8402e', x - 8, y - 21 - up, 2, up + 5); R('#c8402e', x + 6, y - 21 - up, 2, up + 5);
  } else if (k === 'dig') { const d = Math.round(Math.abs(Math.sin(t * 6)) * 5); R('#8a5a34', x + 8, y - 22 + d, 2, 17); R('#aab0b8', x + 6, y - 6 + d, 6, 4); for (let i = 0; i < 4; i++) R('#6a4a2e', Math.round(x - 8 + i * 5 + Math.sin(t * 8 + i) * 2), Math.round(y - 2 - Math.abs(Math.sin(t * 6 + i)) * 7), 2, 2);
  } else if (k === 'talk') { R('#fff', x + 8, y - 36, 14, 9); R('#fff', x + 10, y - 28, 3, 3); for (let i = 0; i < 3; i++) R('#2a2a3a', x + 10 + i * 4, y - 33, 2, 1 + (Math.floor(t * 8 + i) % 2));
  } else if (k === 'eat') { const f = (t / ACT.dur); R('#e8884a', x + Math.round(8 - f * 8), y - 10 - Math.round(f * 14), 4, 4); R('#c8402e', x + Math.round(8 - f * 8), y - 11 - Math.round(f * 14), 4, 1);
  }
}
function drawSleep(x, y) {
  g.save(); g.translate(x, y - 8); g.rotate(Math.PI / 2); g.drawImage(player.spr[0][0], -12, -20); g.restore();
  R('#5a8ad8', x - 14, y - 15, 19, 11); R('#7aa4ec', x - 14, y - 15, 19, 2); R('#fff', x + 5, y - 16, 8, 6);
  for (let i = 0; i < 3; i++) { const f = (ACT.t * .9 + i / 3) % 1; ptext('Z', Math.round(x + 10 + i * 4), Math.round(y - 24 - f * 20), '#fff', 1 + (i > 0), '#2a1a2e'); }
}
// game.js hands us the player's feet position
const _drawEnt = drawEnt;
drawEnt = e => { if (e === player && ACT) { const x = Math.round(e.x), y = Math.round(e.y); if (ACT.kind === 'sleep') return drawSleep(x, y); _drawEnt(e); return drawActProps(x, y - 8); } _drawEnt(e); };
// fishing shows the rod
const _drawEnt2 = drawEnt;
drawEnt = e => { _drawEnt2(e); if (e === player && mg?.fish) { const x = Math.round(e.x), y = Math.round(e.y) - 8, b = mg.phase === 'bite' ? Math.round(Math.sin(now() / 40) * 2) : 0;
  R('#8a5a34', x + 6, y - 20, 1, 14); R('#8a5a34', x + 7, y - 24, 12, 1); R('#ffffff90', x + 19, y - 24, 1, 20 + b); R(mg.phase === 'bite' ? RED : '#fff', x + 18, y - 4 + b, 3, 3); } };

// wrap every home furniture action and a few town spots
const FURN_KIND = { sink: 'wash', shelf: 'read', tv: 'tv', pc: 'type', sofa: 'sit', tub: 'bath', plant: 'water', easel: 'paint', gym: 'run', mirror: 'talk', piano: 'piano', aquarium: 'sit', bed: 'sleep' };
for (const k in FURN_KIND) { const base = FURN_ACTS[k]; if (base) FURN_ACTS[k] = F => base(F).map(([l, fn]) => l.startsWith('🎮') ? [l, fn] : [l, () => doAct(/homework|การบ้าน/i.test(l) ? 'read' : FURN_KIND[k], fn, l)]); }
function animTarget(name, pick) {
  const t = town.targets.find(t => t.name === name); if (!t) return;
  const d = Object.getOwnPropertyDescriptor(t, 'opts'), base = d.get ? d.get : () => d.value;
  Object.defineProperty(t, 'opts', { get: () => base.call(t).map(([l, fn]) => { const kind = pick(l); return kind ? [l, () => doAct(kind, fn, l)] : [l, fn]; }), configurable: true });
}
animTarget('ฟิตเนส', () => 'lift'); animTarget('ห้องสมุด', l => /อ่าน|Read/.test(l) ? 'read' : /homework|การบ้าน/i.test(l) ? 'read' : null); animTarget('โรงหนัง', () => 'sit');
animTarget('ม้านั่งในสวน', l => /นั่ง/.test(l) ? 'sit' : /วิ่ง/.test(l) ? 'run' : 'paint');
for (const t of town.targets) if (t.name === 'แปลงผัก') { const d = Object.getOwnPropertyDescriptor(t, 'opts'); Object.defineProperty(t, 'opts', { get: () => d.get.call(t).map(([l, fn]) => /รดน้ำ|Water/.test(l) ? [l, () => doAct('water', fn, l)] : /ปลูก|เก็บเกี่ยว|ขุด|Plant|Harvest|Dig/.test(l) ? [l, () => doAct('dig', fn, l)] : [l, fn]), configurable: true }); }
console.assert(Object.keys(FURN_KIND).every(k => ACT_DUR[FURN_KIND[k]] || FURN_KIND[k] === 'sleep'), 'every furniture anim has a duration');
