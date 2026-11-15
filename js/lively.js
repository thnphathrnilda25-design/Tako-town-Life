'use strict';
// Small signs of life: birds overhead, butterflies and stray cats, a morning market and an evening street musician,
// plus quiet ambience (birds by day, crickets at night, a murmur near the plaza).
const LIFE = { last: 0, birds: [], flies: [], cats: [] };
const freeNear = (ax, ay, r) => {
  const out = [];
  for (let y = ay - r; y <= ay + r; y++) for (let x = ax - r; x <= ax + r; x++) {
    if (x < 0 || y < 0 || x >= town.W || y >= town.H) continue;
    const i = y * town.W + x;
    if (town.solid[i] || town.tile[i] === 1 || town.tile[i] === 4 || nearB(x, y)) continue;
    out.push({ x, y });
  }
  return out;
};
// the open east-west road north of the buildings is the only square with clear sightlines
const MARKET = [{ x: 22 * T + 16, y: 6 * T + 26, i: 0 }, { x: 25 * T + 16, y: 6 * T + 26, i: 1 }];
const MUSIC = { x: 21, y: 6 };

const marketOpen = () => hour() >= 6 && hour() < 11 && !wet();
const musicOpen = () => hour() >= 17.5 && hour() < 21 && !wet();

function drawStall(s, i) {
  const x = s.x, y = s.y, a = i ? '#3a9a5a' : '#c8402e', b = '#fff4e8';
  R('#0003', x - 15, y - 2, 30, 5);
  for (let dx = -14; dx < 14; dx += 8) { R(dx < 0 ? a : b, x + dx, y - 26, 8, 9); R(dx < 0 ? b : a, x + dx, y - 17, 8, 2); }
  R('#8a5a3a', x - 13, y - 15, 26, 13); R('#a8744a', x - 12, y - 14, 24, 3); R('#6a3a24', x - 13, y - 4, 26, 2);
  for (let k = 0; k < 4; k++) R(i ? '#ffe14a' : '#e87a3a', x - 10 + k * 6, y - 10, 4, 3);
  R('#5a3a24', x - 15, y - 28, 2, 26); R('#5a3a24', x + 13, y - 28, 2, 26);
}
function drawVendor(x, y) {
  R('#2a1a2e', x - 4, y - 17, 8, 11); R('#f2c84a', x - 4, y - 17, 8, 4); R('#3a2a22', x - 3, y - 6, 3, 6); R('#3a2a22', x + 1, y - 6, 3, 6);
  disc(x, y - 21, 4, '#f7cfa6'); R('#5a3a24', x - 4, y - 24, 8, 2);
}
function drawMusic(x, y) {
  R('#2a1a2e', x - 4, y - 18, 8, 12); R('#5a8ad8', x - 4, y - 18, 8, 5); R('#3a2a22', x - 3, y - 6, 3, 6); R('#3a2a22', x + 1, y - 6, 3, 6);
  disc(x, y - 22, 4, '#e2a882'); R('#3a3a4a', x - 5, y - 26, 10, 2); R('#3a3a4a', x - 3, y - 29, 6, 3);
  R('#c08a4a', x + 3, y - 16, 4, 9); R('#6a3a24', x + 4, y - 15, 2, 7);
  const t = now() / 600;
  for (let i = 0; i < 3; i++) {
    const yy = y - 26 - ((t * 8 + i * 9) % 22), xx = x + 9 + Math.sin(t + i) * 4;
    R('#ffe9a0', xx, yy, 1, 4); R('#ffe9a0', xx - 2, yy + 3, 5, 1);
  }
}
function drawAmbient() {
  const t = now() / 1000, camX = typeof cam !== 'undefined' ? cam.x : 0, camY = typeof cam !== 'undefined' ? cam.y : 0;
  if (hour() >= 6 && hour() < 18) {                              // birds stay on screen, high above the town
    for (const b of LIFE.birds) {
      const x = camX - 30 + ((b.x0 + t * b.sp) % (VW + 60)), y = camY + b.y + Math.sin(t * 2 + b.ph) * 3;
      const up = Math.sin(t * 9 + b.ph) > 0;
      R('#3a3a4a', x - 3, y + (up ? -1 : 0), 3, 1); R('#3a3a4a', x + 1, y + (up ? -1 : 0), 3, 1); R('#2a2a3a', x, y + 1, 1, 1);
    }
  }
  if (hour() >= 7 && hour() < 18) {                              // butterflies over the park
    for (const f of LIFE.flies) {
      const x = f.x + Math.sin(t * .9 + f.ph) * 18, y = f.y + Math.sin(t * 1.7 + f.ph) * 9;
      const open = Math.sin(t * 8 + f.ph) > 0;
      R(f.c, x - (open ? 3 : 1), y, 2, 2); R(f.c, x + 1, y, 2, 2); R('#3a2a22', x, y, 1, 2);
    }
  }
  for (const c of LIFE.cats) g.drawImage(catSpr[c.frame ? 1 : 0][c.dir === 2 ? 0 : 1], Math.round(c.x - 9), Math.round(c.y - 11));
}

// stray cats need their own little update loop; everything else is drawn from the clock
function lifeLoop(t) {
  const dt = Math.min(0.05, (t - LIFE.last) / 1000 || 0); LIFE.last = t;
  if (player && scene === town) for (const c of LIFE.cats) {
    c.at += dt; c.frame = c.vx || c.vy ? 1 - c.frame : 0;
    if (c.at > 1 + (c.k % 3)) { c.at = 0; const d = Math.floor(Math.random() * 5); c.vx = [0, 0, -1, 1, 0][d] * 18; c.vy = [1, -1, 0, 0, 0][d] * 18; }
    if (c.vx || c.vy) { move(town, c, c.vx * dt, c.vy * dt, true); c.dir = c.vx < 0 ? 2 : c.vx > 0 ? 3 : c.dir; }
  }
  requestAnimationFrame(lifeLoop);
}
function seedLife() {
  LIFE.birds = Array.from({ length: 5 }, (_, i) => ({ x0: i * 260 + 40, y: 26 + i * 17, sp: 12 + i * 4, ph: i * 1.7 }));
  LIFE.flies = Array.from({ length: 4 }, (_, i) => ({ x: 13 * T + 16 + (i - 1.5) * 26, y: 23 * T + 20 + (i % 2) * 30, ph: i * 2.1, c: ['#ffd54a', '#8ac8f0', '#f0a0d0', '#a0e0a0'][i] }));
  LIFE.cats = [{ x: 15 * T, y: 22 * T, dir: 3, frame: 0, vx: 0, vy: 0, at: 0, k: 1 }, { x: 21 * T, y: 9 * T, dir: 2, frame: 0, vx: 0, vy: 0, at: 0, k: 2 }];
}
seedLife();
MARKET.forEach((s, i) => town.statics.push({ k: s.y, f: () => { if (marketOpen()) drawStall(s, i); } }));
if (MARKET[0]) town.statics.push({ k: MARKET[0].y, f: () => { if (marketOpen()) drawVendor(MARKET[0].x + 2, MARKET[0].y - 2); } });
town.statics.push({ k: MUSIC.y * T + 26, f: () => { if (musicOpen()) drawMusic(MUSIC.x * T + 16, MUSIC.y * T + 26); } });
town.statics.push({ k: 999999, f: drawAmbient });

// ---- interaction: buy something at the morning market, listen to the musician ----
function stallOpts() {
  if (!marketOpen() || !MARKET.length) return [];
  return [['ซื้อขนมปังสด ฿20', () => { if (st.money < 20) return say('เงินไม่พอ'); fx({ money: -20 }); addItem('bread'); say('ได้ขนมปังหอมกรุ่นจากเตา 🍞'); }],
    ['ซื้อผลไม้ ฿12', () => { if (st.money < 12) return say('เงินไม่พอ'); fx({ money: -12 }); addItem('fruit'); say('ผลไม้สด ๆ จากสวน 🍓'); }]];
}
MARKET.forEach(s => town.targets.push({ x: s.x, y: s.y, name: 'แผงตลาดเช้า', get opts() { return stallOpts(); } }));
town.targets.push({ x: MUSIC.x * T + 16, y: MUSIC.y * T + 26, name: 'นักดนตรีข้างถนน', get opts() {
  if (!musicOpen()) return [];
  return [['ฟังเพลง 20 นาที', () => {
    if (st.musicDay === day()) return say('วันนี้ฟังแล้ว มีแรงใจเต็มที่!');
    st.musicDay = day(); fx({ mood: 12 }); tick(20); sfx('ok'); say('เสียงกีตาร์เพราะมาก ผู้คนหยุดฟังกัน 🎸');
  }]];
} });

// ---- kids playing in the park ----
const _startLively = start;
start = saved => {
  _startLively(saved);
  const pals = ['#c8402e', '#58c47a', '#9a48a8'];
  for (let i = 0; i < 3; i++) {
    const base = CHARS[i % 4];
    folks.push({ x: (10 + i * 2) * T + 16, y: (21 + (i % 2)) * T + 24, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0, talked: 0, age: 8,
      spr: sheet({ ...base, style: i % 2 ? 'bob' : 'short', clip: 0, skirt: i % 2, c: pals[i], C: shade(pals[i], -40), a: '#fff4e8' }) });
  }
};

// ---- quiet ambience ----
function chirp() {
  const t = AU.ctx.currentTime, n = 84 + (Math.random() * 5 | 0);
  note(n, t, .07, 'sine', .16, AU.amb); note(n + 3, t + .1, .09, 'sine', .12, AU.amb);
}
function cricket() {
  const t = AU.ctx.currentTime;
  for (let i = 0; i < 3; i++) note(96, t + i * .07, .03, 'sine', .07, AU.amb);
}
function murmur() { note(45, AU.ctx.currentTime, .5, 'triangle', .05, AU.amb); }
setInterval(() => {
  if (!AU.ctx || AU.ctx.state !== 'running' || !player || scene !== town || overlayOpen()) return;
  const h = hour();
  if (wet()) return;
  if (h >= 6 && h < 18 && Math.random() < .22) chirp();
  else if ((h >= 18 || h < 6) && Math.random() < .16) cricket();
  if (marketOpen() && Math.random() < .2) murmur();
}, 1400);

requestAnimationFrame(lifeLoop);
console.assert(MARKET.length >= 0 && LIFE.birds.length === 5, 'town life seeded');
