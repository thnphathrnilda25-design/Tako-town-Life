'use strict';
// Mini-games: timing bar (cooking, gym), quiz (homework, exams), Simon (painting, piano), dodge runner (running),
// memory cards, dance. All share the mg panel; each finishes with a 0..1 score that the caller turns into rewards.
const MINI = {};
function startMini(name, cfg, done) {
  if (mg) return; mg = { mini: name, done, t: 0, ...cfg }; MINI[name].init(mg); MINI[name].view(mg); mgEl.hidden = false; keys.clear();
}
function endMini(s) { const d = mg.done; mg = null; mgEl.hidden = true; d(Math.max(0, Math.min(1, s))); }
const mgKey = k => mg?.mini && MINI[mg.mini].key?.(mg, k);
const _mgPress2 = mgPress, _mgUpdate2 = mgUpdate;
mgPress = () => mg?.mini ? MINI[mg.mini].press?.(mg) : _mgPress2();
mgUpdate = dt => mg.mini ? MINI[mg.mini].update?.(mg, dt) : _mgUpdate2(dt);
const shell = (title, ...kids) => mgEl.replaceChildren(el('h3', { textContent: title }), ...kids, el('div', {}, el('button', { style: 'margin-top:8px;font-size:13px;padding:3px 14px', textContent: 'ออก (ไม่ได้รางวัล)', onclick: () => { mg = null; mgEl.hidden = true; } })));
const pad = (label, fn, extra = '') => el('button', { textContent: label, style: `font-size:18px;padding:8px 14px;margin:3px;${extra}`, onpointerdown: e => { e.preventDefault(); fn(); } });
const shuffle = a => a.map(v => [rnd(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

MINI.bar = {   // stop the marker inside the green zone, once per step
  init(m) { Object.assign(m, { i: 0, score: 0, pos: 0, dir: 1, wait: 0, fb: '' }); m.z = .05 + rnd() * (.9 - m.w); },
  view(m) {
    m.mark = el('div', { className: 'mark', style: `left:${m.pos * 100}%` }); m.fbEl = el('div', { className: 'fb', textContent: m.fb });
    shell(m.title, el('div', {}, `${m.steps[Math.min(m.i, m.steps.length - 1)][1]} ${m.steps[Math.min(m.i, m.steps.length - 1)][0]} (${Math.min(m.i + 1, m.steps.length)}/${m.steps.length})`),
      el('div', { className: 'track' }, el('div', { className: 'zone', style: `left:${m.z * 100}%;width:${m.w * 100}%` }, el('i')), m.mark), m.fbEl, el('button', { textContent: 'ตอนนี้! (E / สเปซบาร์)', onpointerdown: e => { e.preventDefault(); mgPress(); } }));
  },
  update(m, dt) {
    if (m.wait > 0) { if ((m.wait -= dt) <= 0) { if (m.i >= m.steps.length) return endMini(m.score / m.steps.length); m.fb = ''; m.z = .05 + rnd() * (.9 - m.w); this.view(m); } return; }
    m.pos += m.dir * m.speed * dt; if (m.pos > 1) { m.pos = 1; m.dir = -1; } if (m.pos < 0) { m.pos = 0; m.dir = 1; } m.mark.style.left = m.pos * 100 + '%';
  },
  press(m) {
    if (m.wait > 0) return; const d = Math.abs(m.pos - (m.z + m.w / 2)), p = d < m.w * .15 ? 1 : d < m.w / 2 ? .6 : 0;
    m.score += p; m.fb = p === 1 ? '✨ สมบูรณ์แบบ!' : p ? '👍 ดี' : '💦 พลาด'; m.i++; m.wait = .6; m.fbEl.textContent = m.fb;
  },
};
MINI.quiz = {   // arithmetic multiple choice, difficulty from Logic level and age
  init(m) { Object.assign(m, { i: 0, right: 0, fb: '', ft: 0 }); m.q = this.make(); },
  make() {
    const L = Math.min(10, lv('logic') + (age() > 8 ? 2 : 0)); let a, b, ans, txt;
    if (L < 2) { a = 1 + rnd() * 12 | 0; b = 1 + rnd() * 9 | 0; const plus = rnd() < .6; ans = plus ? a + b : a + b - b; if (!plus) { ans = a; a = a + b; } txt = plus ? `${a} + ${b}` : `${a} − ${b}`; }
    else if (L < 5) { a = 2 + rnd() * 9 | 0; b = 2 + rnd() * 8 | 0; if (rnd() < .5) { ans = a * b; txt = `${a} × ${b}`; } else { a = 10 + rnd() * 80 | 0; b = 5 + rnd() * 40 | 0; ans = a + b; txt = `${a} + ${b}`; } }
    else { a = 3 + rnd() * 12 | 0; b = 3 + rnd() * 12 | 0; if (rnd() < .5) { ans = a * b; txt = `${a} × ${b}`; } else { ans = a; txt = `${a * b} ÷ ${b}`; } }
    const opts = new Set([ans]); while (opts.size < 4) { const w = ans + ((rnd() * 10 | 0) + 1) * (rnd() < .5 ? -1 : 1); if (w >= 0) opts.add(w); }
    return { txt, ans, opts: shuffle([...opts]) };
  },
  view(m) {
    m.fbEl = el('div', { className: 'fb', textContent: m.fb });
    shell(m.title, el('div', {}, `คำถาม ${m.i + 1}/${m.n}`), el('div', { style: 'font-size:30px;margin:10px 0' }, `${m.q.txt} = ?`),
      el('div', {}, ...m.q.opts.map((o, k) => pad(`${k + 1}. ${o}`, () => this.pick(m, k)))), m.fbEl);
  },
  pick(m, k) { if (m.ft > 0) return; const ok = m.q.opts[k] === m.q.ans; if (ok) m.right++; m.fb = ok ? '✅ ถูกต้อง!' : `❌ คำตอบคือ ${m.q.ans}`; m.fbEl.textContent = m.fb; m.ft = .8; },
  key(m, k) { if (/^[1-4]$/.test(k)) this.pick(m, +k - 1); },
  update(m, dt) { if (m.ft > 0 && (m.ft -= dt) <= 0) { if (++m.i >= m.n) return endMini(m.right / m.n); m.fb = ''; m.q = this.make(); this.view(m); } },
};
MINI.simon = {  // watch the sequence, repeat it
  init(m) { m.seq = Array.from({ length: m.len }, () => rnd() * m.items.length | 0); Object.assign(m, { phase: 'show', pos: 0, ok: 0, lit: -1 }); },
  view(m) {
    m.btns = m.items.map((it, i) => pad(`${i + 1} ${it[0]}`, () => this.pick(m, i), `background:${it[1]};color:#fff;min-width:70px`));
    m.msg = el('div', { className: 'fb', textContent: 'ดูให้ดี…' }); shell(m.title, m.msg, el('div', {}, ...m.btns));
  },
  update(m, dt) {
    if (m.phase !== 'show') return; m.t += dt + 0; const i = Math.floor((m.t - .6) / .7), on = i >= 0 && i < m.seq.length && ((m.t - .6) % .7) < .5 ? m.seq[i] : -1;
    m.btns.forEach((b, k) => { b.style.filter = on === k ? 'brightness(1.8)' : 'brightness(.6)'; b.style.transform = on === k ? 'scale(1.12)' : ''; });
    if (i >= m.seq.length) { m.phase = 'play'; m.msg.textContent = 'ตาคุณแล้ว!'; m.btns.forEach(b => { b.style.filter = ''; b.style.transform = ''; }); }
  },
  pick(m, i) { if (m.phase !== 'play') return; if (i === m.seq[m.pos]) { m.ok++; if (++m.pos >= m.len) endMini(1); } else endMini(m.ok / m.len); },
  key(m, k) { if (/^[1-9]$/.test(k) && +k <= m.items.length) this.pick(m, +k - 1); },
};
MINI.dodge = {  // lane runner: up/down to dodge obstacles
  init(m) { Object.assign(m, { lane: 1, obs: [], hits: 0, sp: 0, dur: 12, cv: el('canvas', { width: 320, height: 120, style: 'width:100%;image-rendering:pixelated;border-radius:6px;background:#4a4a5a' }) }); },
  view(m) { shell(m.title, m.cv, el('div', {}, pad('▲', () => this.key(m, 'w')), pad('▼', () => this.key(m, 's')))); },
  key(m, k) { if (k === 'arrowup' || k === 'w') m.lane = Math.max(0, m.lane - 1); if (k === 'arrowdown' || k === 's') m.lane = Math.min(2, m.lane + 1); },
  update(m, dt) {
    m.t += dt; if ((m.sp -= dt) <= 0) { m.sp = .65 + rnd() * .5; m.obs.push({ x: 330, lane: rnd() * 3 | 0, k: rnd() < .5 }); }
    for (const o of m.obs) { o.x -= 130 * dt; if (!o.hit && o.x < 52 && o.x > 14 && o.lane === m.lane) { o.hit = 1; m.hits++; } } m.obs = m.obs.filter(o => o.x > -20);
    const c = m.cv.getContext('2d'), Y = l => 36 + l * 34; c.imageSmoothingEnabled = false; c.fillStyle = '#4a4a5a'; c.fillRect(0, 0, 320, 120);
    for (let l = 0; l < 3; l++) { c.fillStyle = '#e8d86050'; for (let x = -((m.t * 130) % 24); x < 320; x += 24) c.fillRect(x, Y(l) + 6, 12, 2); }
    for (const o of m.obs) { c.fillStyle = o.hit ? '#888' : o.k ? '#c8402e' : '#6a4a2e'; c.fillRect(o.x, Y(o.lane) - 10, 10, 16); c.fillStyle = '#fff6'; c.fillRect(o.x, Y(o.lane) - 10, 10, 2); }
    c.drawImage(player.spr[3][1 + Math.floor(m.t * 12) % 6], 18, Y(m.lane) - 34);
    c.fillStyle = '#fff'; c.font = '10px sans-serif'; c.fillText(`${Math.ceil(m.dur - m.t)} วิ ชน ${m.hits}`, 6, 12);
    if (m.t >= m.dur) endMini(1 - m.hits * .15);
  },
};
MINI.memory = {  // flip pairs
  init(m) { const em = ['🍎', '🍌', '🍇', '🍓', '🥕', '🌽']; Object.assign(m, { cards: shuffle([...em, ...em]).map(e => ({ e, open: 0, done: 0 })), first: -1, moves: 0, lock: 0, cur: 0 }); },
  view(m) {
    m.cells = m.cards.map((c, i) => el('button', { style: 'width:62px;height:62px;font-size:26px;margin:3px', onpointerdown: e => { e.preventDefault(); this.flip(m, i); } }));
    this.paint(m); shell(m.title, el('div', {}, 'จับคู่ให้ครบ — เปิดน้อยครั้งกว่าดีกว่า'), el('div', { style: 'max-width:300px;margin:0 auto' }, ...m.cells));
  },
  paint(m) { m.cells.forEach((b, i) => { const c = m.cards[i]; b.textContent = c.open || c.done ? c.e : '❓'; b.style.opacity = c.done ? .45 : 1; b.style.borderColor = i === m.cur ? '#ffe08a' : ''; }); },
  flip(m, i) {
    const c = m.cards[i]; if (m.lock > 0 || c.open || c.done) return; c.open = 1;
    if (m.first < 0) m.first = i; else {
      m.moves++; const a = m.cards[m.first];
      if (a.e === c.e) { a.done = c.done = 1; a.open = c.open = 0; m.first = -1; if (m.cards.every(x => x.done)) { this.paint(m); return endMini(1 - (m.moves - 6) / 12 + .2); } } else { m.lock = .8; m.pair = [m.first, i]; m.first = -1; }
    } this.paint(m);
  },
  press(m) { this.flip(m, m.cur); },
  key(m, k) { const d = { arrowleft: -1, a: -1, arrowright: 1, d: 1, arrowup: -4, w: -4, arrowdown: 4, s: 4 }[k]; if (d) { m.cur = (m.cur + d + 12) % 12; this.paint(m); } },
  update(m, dt) { if (m.lock > 0 && (m.lock -= dt) <= 0) { m.pair.forEach(i => m.cards[i].open = 0); this.paint(m); } },
};
MINI.dance = {  // press the arrow when it reaches the line
  init(m) { Object.assign(m, { notes: [], total: 16, spawned: 0, sp: .6, hits: 0, cv: el('canvas', { width: 240, height: 150, style: 'width:80%;image-rendering:pixelated;border-radius:6px;background:#2a2050' }) }); },
  view(m) { shell(m.title, m.cv, el('div', {}, ...['◀', '▼', '▲', '▶'].map((a, i) => pad(a, () => this.hit(m, i))))); },
  hit(m, lane) { const n = m.notes.find(n => n.lane === lane && !n.done && Math.abs(n.y - 120) < 16); if (n) { n.done = 1; m.hits++; m.flash = lane; m.ft = .15; } },
  key(m, k) { const l = { arrowleft: 0, a: 0, arrowdown: 1, s: 1, arrowup: 2, w: 2, arrowright: 3, d: 3 }[k]; if (l !== undefined) this.hit(m, l); },
  update(m, dt) {
    m.t += dt; if (m.spawned < m.total && (m.sp -= dt) <= 0) { m.sp = .55 + rnd() * .3; m.spawned++; m.notes.push({ lane: rnd() * 4 | 0, y: -10 }); }
    for (const n of m.notes) n.y += 95 * dt; const c = m.cv.getContext('2d'); c.clearRect(0, 0, 240, 150); c.fillStyle = '#2a2050'; c.fillRect(0, 0, 240, 150);
    for (let l = 0; l < 4; l++) { c.fillStyle = m.flash === l && m.ft > 0 ? '#ffe08a80' : '#ffffff18'; c.fillRect(l * 60 + 6, 0, 48, 150); c.fillStyle = '#ffffff60'; c.fillRect(l * 60 + 6, 118, 48, 3); }
    c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; for (const n of m.notes) if (!n.done) { c.fillStyle = ['#ff7ab0', '#5ac8ff', '#7ee07e', '#ffd54a'][n.lane]; c.fillText('◀▼▲▶'[n.lane], n.lane * 60 + 30, n.y + 8); }
    m.ft -= dt; c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.textAlign = 'left'; c.fillText(`ถูก ${m.hits}/${m.total}`, 6, 144);
    if (m.spawned >= m.total && m.notes.every(n => n.done || n.y > 150)) endMini(m.hits / m.total);
  },
};

// ---- wire mini-games into the activities ----
const done = (kind, apply) => s => doAct(kind, () => apply(s));
function cookDish(r, tier) {
  closePanel(); const I = ITEMS[r.id], L = lv('cook');
  startMini('bar', { title: `🍳 กำลังทำ ${I.n}`, steps: [['หั่น', '🔪'], ['ทอด', '🔥'], ['ปรุงรส', '🧂']], speed: .85 + L * .08 + r.lv * .03, w: Math.max(.14, .3 - L * .012) }, done('cook', s => {
    for (const [k, n] of Object.entries(r.need)) addItem(k, -n);
    addItem(r.id); if (s >= .95) { addItem(r.id); toast(`⭐ ${I.n} สมบูรณ์แบบ! ได้เพิ่มอีกจาน`); } st.stats.cooked++;
    xp('cook', Math.round((18 + r.lv * 4) * (tier > 1 ? 1.5 : 1) * (.6 + .8 * s))); fx({ mood: s < .3 ? -3 : 2 + Math.round(6 * s) }); tick(r.t);
    say(s < .3 ? `${I.n} ไหม้ไปหน่อย…` : `${I.n} เสร็จแล้ว! เก็บไว้ในกระเป๋า`); refreshPanel?.(); save();
  }));
}
homework = () => {
  const S = sch(); if (!S.hw) return say('ตอนนี้ไม่มีการบ้าน 🎉');
  startMini('quiz', { n: 3, title: '📝 การบ้าน' }, done('read', s => { S.hw = 0; S.done += .5 + s * .5; fx({ energy: -6, mood: s < .5 ? -3 : 2 }); xp('logic', Math.round(8 + 20 * s)); tick(45); say(`ทำการบ้านเสร็จ: ถูก ${Math.round(s * 3)}/3`); }));
};
const MG = '🎮 ';
const addOpts = (k, f) => { const base = FURN_ACTS[k]; FURN_ACTS[k] = F => [...base(F).filter(o => !f.drop?.(o[0])), ...f.add(F)]; };
addOpts('easel', { drop: () => true, add: () => [[MG + 'วาดรูป (เกมความจำ)', () => {
  if (st.energy < 15) return say('เหนื่อยเกินไปที่จะวาดรูป');
  startMini('simon', { title: '🎨 ผสมสี', len: 3 + Math.floor(lv('art') / 2), items: [['แดง', '#c8402e'], ['น้ำเงิน', '#3a6ad8'], ['เหลือง', '#c8a020'], ['เขียว', '#3a9a4a']] }, done('paint', s => {
    fx({ energy: -10, mood: 4 + Math.round(6 * s) }); xp('art', Math.round(12 + 26 * s)); addItem('painting', s >= .8 ? 2 : 1); st.stats.paintings++; tick(90);
    say(s >= .8 ? 'ได้ภาพสวย ๆ สองภาพ!' : `วาดเสร็จแล้ว (${Math.round(s * 100)}%)`);
  }));
}]] });
addOpts('piano', { drop: () => true, add: () => [[MG + 'เล่นเปียโน (เล่นตามทำนอง)', () => {
  startMini('simon', { title: '🎹 เล่นตาม', len: 4 + Math.floor(lv('art') / 2), items: [['โด', '#5a6ad8'], ['เร', '#3a9a6a'], ['มี', '#c89a20'], ['ซอล', '#c8503a']] }, done('piano', s => { fx({ mood: 4 + Math.round(10 * s), energy: -5 }); xp('art', Math.round(6 + 14 * s)); xp('charm', Math.round(8 * s)); tick(60); say(s >= .99 ? 'เล่นได้ไม่มีที่ติ ♪' : 'เล่นได้เพราะ ♪'); }));
}]] });
addOpts('gym', { drop: () => true, add: () => [[MG + 'วิ่งลู่วิ่ง (หลบสิ่งกีดขวาง)', () => {
  if (st.energy < 20) return say('เหนื่อยเกินไป');
  startMini('dodge', { title: '🏃 วิ่งลู่วิ่ง' }, done('run', s => { fx({ energy: -15, mood: 3 + Math.round(4 * s) }); xp('fit', Math.round(15 + 25 * s)); tick(60); say(`วิ่งได้เยี่ยม! คะแนน ${Math.round(s * 100)}%`); }));
}]] });
const tvDance = () => startMini('dance', { title: '💃 ปาร์ตี้เต้นรำ' }, done('talk', s => { fx({ mood: 8 + Math.round(14 * s), energy: -6 }); xp('fit', Math.round(8 + 14 * s)); xp('charm', Math.round(8 + 16 * s)); tick(30); say(`เต้นได้ ${Math.round(s * 16)}/16 จังหวะ`); }));
const memoryGame = () => startMini('memory', { title: '🃏 เกมการ์ดความจำ' }, done('sit', s => { fx({ mood: 5 + Math.round(10 * s) }); xp('logic', Math.round(10 + 20 * s)); tick(30); say(`เปิดการ์ดครบแล้ว (${Math.round(s * 100)}%)`); }));
addOpts('tv', { add: () => [[MG + 'เต้นตามเพลง', tvDance], [MG + 'เล่นการ์ดความจำ', memoryGame]] });
addOpts('mirror', { add: () => [[MG + 'ซ้อมเต้น', tvDance]] });
addOpts('sofa', { add: () => [[MG + 'เล่นการ์ดความจำ', memoryGame]] });
{
  const t = town.targets.find(t => t.name === 'ฟิตเนส'), base = Object.getOwnPropertyDescriptor(t, 'opts').value;
  t.opts = [[MG + 'ออกกำลังกาย ฿30 (จับจังหวะ)', () => {
    if (st.energy < 20) return say('เหนื่อยเกินไป'); if (st.money < 30) return say('เงินไม่พอ');
    startMini('bar', { title: '💪 วิดพื้น', steps: [['ครั้งที่ 1', '🏋️'], ['ครั้งที่ 2', '🏋️'], ['ครั้งที่ 3', '🏋️'], ['ครั้งที่ 4', '🏋️'], ['ครั้งที่ 5', '🏋️']], speed: 1 + lv('fit') * .1, w: .24 }, done('lift', s => { fx({ money: -30, energy: -15, mood: 3 }); xp('fit', Math.round(25 + 40 * s)); tick(60); say(`ออกกำลังกายเสร็จ: ทำได้ครบ ${Math.round(s * 5)}/5 ครั้ง`); }));
  }], base[1]];
}
{
  for (const bt of town.targets.filter(b => b.name === 'ม้านั่งในสวน')) bt.opts = bt.opts.map(([l, fn]) => /วิ่ง/.test(l) ? [MG + 'วิ่งออกกำลังกาย (หลบสิ่งกีดขวาง)', () => { if (st.energy < 20) return say('เหนื่อยเกินไป'); startMini('dodge', { title: '🏃 วิ่งในสวน' }, done('run', s => { fx({ energy: -15, mood: 4 + Math.round(5 * s) }); xp('fit', Math.round(15 + 20 * s)); tick(60); say('วิ่งรอบสวนจนเหงื่อซึม'); })); }] : [l, fn]);
}
console.assert(['bar', 'quiz', 'simon', 'dodge', 'memory', 'dance'].every(k => MINI[k] && MINI[k].init && MINI[k].view), 'mini-game table');
