'use strict';
// Cinematic lighting: time-of-day colour grading, cached lamp glow sprites, lit-window spill,
// street-lamp cones, car head/tail lights, wet-road reflections and warm room light.
// Presentation only: no save state, no gameplay rules, and every entry point degrades to the
// old flat overlay if something is missing.

// ---------- small helpers ----------
const LT_SMOOTH = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const LT_MIX = (a, b, t) => a + (b - a) * t;
const LT_RGB = a => `${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])}`;
const LT_MIXC = (a, b, t) => [LT_MIX(a[0], b[0], t), LT_MIX(a[1], b[1], t), LT_MIX(a[2], b[2], t)];
const LT_VIS = (x, y, pad, cx, cy) => x > cx - pad && y > cy - pad && x < cx + VW + pad && y < cy + VH + pad;

// ---------- cached light sprites ----------
const LT_SPR = new Map();
function ltSprite(rgb, r) {
  r = Math.max(6, Math.min(96, Math.round(r / 2) * 2));
  const key = rgb + '|' + r;
  let c = LT_SPR.get(key);
  if (c) return c;
  c = mk(r * 2, r * 2);
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(r, r, 0, r, r, r);
  gr.addColorStop(0, `rgba(${rgb},.95)`);
  gr.addColorStop(.22, `rgba(${rgb},.55)`);
  gr.addColorStop(.58, `rgba(${rgb},.15)`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, r * 2, r * 2);
  LT_SPR.set(key, c);
  return c;
}
function ltGlow(x, y, r, rgb, a, sx = 1, sy = 1) {
  if (a <= .003) return;
  ctx.globalAlpha = Math.min(1, a);
  ctx.drawImage(ltSprite(rgb, r), x - r * sx, y - r * sy, r * 2 * sx, r * 2 * sy);
  ctx.globalAlpha = 1;
}

const LT_CONE = new Map();
function ltCone(rgb, spread, len) {
  spread = Math.max(10, Math.round(spread / 4) * 4); len = Math.max(16, Math.round(len / 8) * 8);
  const key = rgb + '|' + spread + '|' + len;
  let c = LT_CONE.get(key);
  if (c) return c;
  c = mk(spread * 2, len);
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, len);
  gr.addColorStop(0, `rgba(${rgb},.34)`); gr.addColorStop(.45, `rgba(${rgb},.17)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = gr;
  x.beginPath(); x.moveTo(spread - 3, 0); x.lineTo(spread + 3, 0); x.lineTo(spread * 2, len); x.lineTo(0, len); x.closePath(); x.fill();
  const core = x.createLinearGradient(0, 0, 0, len);
  core.addColorStop(0, `rgba(${rgb},.22)`); core.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = core;
  x.beginPath(); x.moveTo(spread - 8, 0); x.lineTo(spread + 8, 0); x.lineTo(spread * 1.5, len); x.lineTo(spread * .5, len); x.closePath(); x.fill();
  LT_CONE.set(key, c);
  return c;
}
const LT_CONE_H = new Map();
function ltConeH(rgb, len, spread) {
  len = Math.max(16, Math.round(len / 8) * 8); spread = Math.max(10, Math.round(spread / 4) * 4);
  const key = rgb + '|' + len + '|' + spread;
  let c = LT_CONE_H.get(key);
  if (c) return c;
  c = mk(len, spread);
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, len, 0);
  gr.addColorStop(0, `rgba(${rgb},.34)`); gr.addColorStop(.55, `rgba(${rgb},.13)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  x.fillStyle = gr;
  x.beginPath(); x.moveTo(0, spread / 2 - 3); x.lineTo(0, spread / 2 + 3); x.lineTo(len, spread); x.lineTo(len, 0); x.closePath(); x.fill();
  LT_CONE_H.set(key, c);
  return c;
}

// ---------- time-of-day ambient ----------
// [hour, colour at the top of the screen, colour near the bottom, opacity]
// Top is the far side of town, bottom is the near pavement; the gradient gives depth instead
// of the old single flat blue rectangle.
const LT_AMB = [
  [0, [7, 11, 37], [23, 17, 47], .52],
  [4.4, [8, 13, 42], [27, 19, 50], .51],
  [5.4, [33, 27, 72], [83, 48, 67], .39],
  [6.3, [96, 62, 96], [246, 151, 112], .19],
  [7.2, [0, 0, 0], [0, 0, 0], .015],
  [8, [0, 0, 0], [0, 0, 0], 0],
  [16.4, [0, 0, 0], [0, 0, 0], 0],
  [17.4, [255, 172, 96], [255, 133, 84], .09],
  [18.3, [255, 124, 72], [132, 73, 104], .19],
  [19.2, [65, 55, 120], [102, 67, 112], .29],
  [20.4, [14, 20, 60], [39, 27, 69], .45],
  [21.6, [7, 11, 37], [23, 17, 47], .52],
  [24, [7, 11, 37], [23, 17, 47], .52],
];
function ltAmbientAt(h) {
  h = ((h % 24) + 24) % 24;
  let a = LT_AMB[0], b = LT_AMB[LT_AMB.length - 1];
  for (let i = 0; i < LT_AMB.length - 1; i++) if (h >= LT_AMB[i][0] && h <= LT_AMB[i + 1][0]) { a = LT_AMB[i]; b = LT_AMB[i + 1]; break; }
  const t = b[0] === a[0] ? 0 : (h - a[0]) / (b[0] - a[0]);
  return { top: LT_MIXC(a[1], b[1], t), bot: LT_MIXC(a[2], b[2], t), a: LT_MIX(a[3], b[3], t) };
}

function ambientPass(sc, d, cx, cy) {
  if (!ctx) return;
  g = ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const h = hour(), w = typeof weatherOf === 'function' ? weatherOf() : 'sun';
  if (sc === town) {
    const A = ltAmbientAt(h);
    let top = A.top, bot = A.bot, a = A.a;
    if (w === 'cloud') { top = LT_MIXC(top, [74, 84, 108], .16); bot = LT_MIXC(bot, [74, 84, 108], .16); a += .018; }
    else if (w === 'rain') { top = LT_MIXC(top, [46, 58, 90], .18); bot = LT_MIXC(bot, [46, 58, 90], .18); a += .015; }
    else if (w === 'storm') { top = LT_MIXC(top, [26, 32, 58], .24); bot = LT_MIXC(bot, [26, 32, 58], .24); a += .035; }
    else if (w === 'fog') { top = LT_MIXC(top, [160, 170, 184], .22); bot = LT_MIXC(bot, [160, 170, 184], .22); a += .01; }
    else if (w === 'snow') { top = LT_MIXC(top, [150, 165, 195], .12); bot = LT_MIXC(bot, [150, 165, 195], .12); }
    if (a > .012) {
      const gr = ctx.createLinearGradient(0, 0, 0, VH);
      gr.addColorStop(0, `rgba(${LT_RGB(top)},${a.toFixed(3)})`);
      gr.addColorStop(.52, `rgba(${LT_RGB(LT_MIXC(top, bot, .5))},${(a * .96).toFixed(3)})`);
      gr.addColorStop(1, `rgba(${LT_RGB(bot)},${(a * .88).toFixed(3)})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    }
    // daylight: a faint warm sun wash up top and a cool bounce along the pavement
    if (A.a < .02 && w === 'sun') {
      const gr = ctx.createLinearGradient(0, 0, 0, VH);
      gr.addColorStop(0, 'rgba(255,241,194,.055)');
      gr.addColorStop(.6, 'rgba(255,236,205,.018)');
      gr.addColorStop(1, 'rgba(78,116,152,.035)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    }
    // warm horizon bloom around sunrise and sunset
    const dawn = h > 5 && h < 7.4, dusk = h > 16.6 && h < 19.6;
    if (dawn || dusk) {
      const k = dawn ? Math.sin((h - 5) / 2.4 * Math.PI) : Math.sin((h - 16.6) / 3 * Math.PI);
      const gr = ctx.createRadialGradient(VW * .5, VH * 1.04, 10, VW * .5, VH * 1.04, VH * .85);
      gr.addColorStop(0, `rgba(255,158,92,${(.13 * k).toFixed(3)})`);
      gr.addColorStop(.55, `rgba(255,130,96,${(.05 * k).toFixed(3)})`);
      gr.addColorStop(1, 'rgba(255,120,90,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    }
  } else if (typeof mine !== 'undefined' && sc === mine) {
    R('rgba(7,9,24,.16)', 0, 0, VW, VH);
  } else {
    const k = Math.min(1, d / .203);
    if (k > .01) {
      const gr = ctx.createLinearGradient(0, 0, 0, VH);
      gr.addColorStop(0, `rgba(40,22,44,${(.20 * k).toFixed(3)})`);
      gr.addColorStop(.55, `rgba(30,16,34,${(.29 * k).toFixed(3)})`);
      gr.addColorStop(1, `rgba(17,9,23,${(.40 * k).toFixed(3)})`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
    } else R('rgba(255,228,176,.028)', 0, 0, VW, VH);
  }
}

// Smooth dusk/dawn curve; replaces the old hard step at 17:00 and 20:00.
function darkness(h) {
  const night = .58;
  if (h >= 7 && h < 16.5) return 0;
  if (h < 7) return night * (1 - LT_SMOOTH((7 - h) / 2.5));
  return night * LT_SMOOTH((h - 16.5) / 5);
}

// ---------- town light sources ----------
const LT_NEON = {
  mart: '94,232,142', cafe: '255,170,92', furni: '255,193,124', office: '142,190,255', hall: '174,212,255',
  school: '255,220,122', library: '192,164,255', cinema: '255,96,96', flower: '255,143,182', clinic: '150,230,255',
  gym: '162,255,184', pet: '255,211,122', toy: '255,172,92', fashion: '255,143,202', chapel: '202,212,255',
  salon: '255,132,220', museum: '255,210,160',
};
function ltWindowLit(b, i, h) {
  if (!isNight()) return false;
  if (!b.act) return !!(typeof TL !== 'undefined' && TL.lit && TL.lit[i]) && h < 23.5;
  if (typeof SHOPS !== 'undefined' && SHOPS[b.act]) return typeof shopOpen === 'function' ? shopOpen(b.act) : true;
  return true;
}

function townLights(cx, cy, d, t, h) {
  const lvl = Math.min(1, Math.max(0, (d - .015) / .36));
  if (lvl <= .01) return;
  const w = typeof weatherOf === 'function' ? weatherOf() : 'sun';
  const haze = w === 'fog' ? 1.42 : w === 'snow' ? 1.25 : w === 'rain' ? 1.12 : w === 'storm' ? 1.2 : 1;
  const wetRoad = typeof wet === 'function' && wet();
  const night = isNight();
  ctx.globalCompositeOperation = 'lighter';

  // street lamps: head bloom, a soft cone and an elliptical pool, plus a wet-road streak
  for (const [tx, ty] of LAMPS) {
    const X = tx * T + 16, Y = ty * T - 20, G = ty * T + 26;
    if (!LT_VIS(X, G, 100 + 70 * haze, cx, cy)) continue;
    let fl = .92 + .08 * Math.sin(t * 2.3 + tx * 1.7 + ty * .9);
    if (w === 'storm' && hash01(tx * 7 + ty * 13) > .72) fl *= Math.sin(t * 15 + tx) > .2 ? 1 : .35;
    const a = .36 * lvl * fl;
    ltGlow(X, Y, 17 * haze, '255,196,112', a * .95, 1, .82);
    ctx.globalAlpha = Math.min(1, .68 * lvl * fl);
    const len = Math.max(24, G - Y + 4);
    ctx.drawImage(ltCone('255,192,106', 38, len), X - 38, Y, 76, len);
    ctx.globalAlpha = 1;
    ltGlow(X, G + 3, 42, '255,188,98', .30 * lvl * fl, 1.28, .30);
    if (wetRoad) ltGlow(X, G + 17, 12, '255,190,104', .30 * lvl * fl, .55, 2.5);
  }

  // lit windows and the warm spill they throw on the wall and pavement
  if (night) for (let i = 0; i < BUILDINGS.length; i++) {
    const b = BUILDINGS[i];
    if (!ltWindowLit(b, i, h)) continue;
    const bot = (b.y + b.h) * T;
    for (const [wx, wy] of b.win) {
      if (!LT_VIS(wx, wy, 72, cx, cy)) continue;
      const fl = .92 + .08 * Math.sin(t * 2.4 + wx * .13 + wy * .07);
      ltGlow(wx + 8, wy + 8, 20, '255,206,126', .24 * lvl * fl, 1.12, .92);
      ltGlow(wx + 8, wy + 17, 13, '255,190,106', .13 * lvl * fl, .78, 1.8);
      if (wy > bot - 68) ltGlow(wx + 8, bot + 4, 22, '255,186,100', .095 * lvl, 1.22, .32);
    }
    // porch light above a lit home or open shop
    if (LT_VIS(b.dx, bot, 64, cx, cy)) {
      ltGlow(b.dx, bot - 38, 11, '255,214,146', .22 * lvl, 1, .9);
      ltGlow(b.dx, bot + 6, 17, '255,196,116', .11 * lvl, 1.3, .30);
      if (wetRoad) ltGlow(b.dx, bot + 14, 7, '255,200,130', .12 * lvl, .55, 1.9);
    }
  }

  // neon / painted shop signs at night
  if (night) for (let i = 0; i < BUILDINGS.length; i++) {
    const b = BUILDINGS[i];
    if (!b.act || !b.sign) continue;
    const top = (b.y + b.h) * T - b.wh;
    if (!LT_VIS(b.dx, top, 90, cx, cy)) continue;
    const col = LT_NEON[b.act] || '255,220,160';
    let fl = .88 + .12 * Math.sin(t * 3.2 + i * 2.1);
    if (i % 5 === 0 && hash01(Math.floor(t * 6) + i * 3.7) > .9) fl *= .3;
    ltGlow(b.dx, top + 14, 24, col, .15 * lvl * fl, 1.15, .62);
    if (wetRoad) ltGlow(b.dx, (b.y + b.h) * T + 12, 15, col, .11 * lvl * fl, .55, 2.2);
  }

  // cars: headlight cone, road pool, red tail light and wet streaks
  for (const c of CARS) {
    if (!LT_VIS(c.x, c.y, 110, cx, cy)) continue;
    const fx = c.x + c.dir * 22, fy = c.y - 12;
    const a = .55 * lvl;
    ctx.save(); ctx.translate(fx, fy); ctx.scale(c.dir, 1);
    ctx.globalAlpha = a;
    ctx.drawImage(ltConeH('255,238,192', 62, 32), 0, -16, 62, 32);
    ctx.restore(); ctx.globalAlpha = 1;
    ltGlow(fx, fy, 8, '255,246,206', .52 * lvl, 1, .82);
    ltGlow(c.x + c.dir * 10, c.y + 4, 25, '255,232,184', .10 * lvl, 1.45, .28);
    ltGlow(c.x - c.dir * 24, fy, 6, '255,66,54', .40 * lvl, 1, .8);
    if (wetRoad) {
      ltGlow(fx, c.y + 13, 9, '255,228,178', .17 * lvl, .5, 2.1);
      ltGlow(c.x - c.dir * 24, c.y + 12, 5, '255,70,58', .18 * lvl, .5, 1.8);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- interiors and the mine ----------
function roomLamps(sc) {
  if (sc === home || (typeof parentsHome !== 'undefined' && sc === parentsHome)) {
    if (sc === home && Array.isArray(st.furn)) return st.furn.filter(f => FURN[f.id] && FURN[f.id].d === 'lamp');
    return [];
  }
  if (typeof nRoom !== 'undefined' && sc === nRoom) return Array.isArray(nRoom.lamps) ? nRoom.lamps : [];
  return [];
}
function roomTV(sc) {
  if (sc === home && Array.isArray(st.furn)) {
    const f = st.furn.find(f => FURN[f.id] && FURN[f.id].cat === 'tv');
    if (f) { const F = FURN[f.id]; return { x: f.x * T + F.w * T / 2, y: (f.y + F.h) * T - 42 }; }
  }
  if (typeof nRoom !== 'undefined' && sc === nRoom && typeof visit !== 'undefined' && visit && typeof roomLayout === 'function') {
    const rs = typeof homeResidents === 'function' ? homeResidents(visit.home) : [];
    const f = roomLayout(visit.home, rs).find(([id]) => FURN[id] && FURN[id].cat === 'tv');
    if (f) { const F = FURN[f[0]]; return { x: f[1] * T + F.w * T / 2, y: (f[2] + F.h) * T - 42 }; }
  }
  return null;
}
function roomLights(sc, cx, cy, d, t, h) {
  const night = isNight();
  const dark = Math.min(1, d / .203);
  if (!night && d < .02) {
    // daylight through the two front windows of the players' house
    if (sc === home || (typeof parentsHome !== 'undefined' && sc === parentsHome)) {
      const W = home.W, H = home.H, wins = [[(W - 5) * T + 6, 10, 52, 36], [(W - 2) * T + 6, 8, 52, 30]];
      ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, w, h] of wins) {
        if (!LT_VIS(x, y, 120, cx, cy)) continue;
        const gr = ctx.createLinearGradient(0, y + h, 0, H * T);
        gr.addColorStop(0, 'rgba(255,236,186,.13)'); gr.addColorStop(.55, 'rgba(255,228,176,.05)'); gr.addColorStop(1, 'rgba(255,222,168,0)');
        ctx.fillStyle = gr; ctx.beginPath();
        ctx.moveTo(x + 4, y + h); ctx.lineTo(x + w - 4, y + h);
        ctx.lineTo(x + w - 84, H * T); ctx.lineTo(x - 76, H * T); ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    return;
  }
  if (!night) return;
  ctx.globalCompositeOperation = 'lighter';
  const lamps = roomLamps(sc);
  for (const l of lamps) {
    const X = l.x * T + 16, Y = l.y * T - 18, G = (l.y + 1) * T;
    if (!LT_VIS(X, G, 90, cx, cy)) continue;
    const fl = .93 + .07 * Math.sin(t * 2.7 + l.x * 2.1 + l.y);
    ltGlow(X, Y, 16, '255,206,136', .40 * fl, 1, .9);
    ctx.globalAlpha = Math.min(1, .62 * fl);
    const len = Math.max(24, G - Y + 2);
    ctx.drawImage(ltCone('255,192,112', 30, len), X - 30, Y, 60, len);
    ctx.globalAlpha = 1;
    ltGlow(X, G + 2, 34, '255,188,104', .28 * fl, 1.25, .32);
    ltGlow(X, Y + 8, 58, '255,180,100', .07 * fl, 1.2, 1);
  }
  // TV: cold flickering screen light, strongest while actually watching
  const tv = roomTV(sc);
  if (tv && LT_VIS(tv.x, tv.y, 90, cx, cy)) {
    const col = ['146,198,255', '196,164,255', '154,246,208'][Math.floor(t * .8) % 3];
    let pulse = .085 + .035 * Math.sin(t * 11) + .02 * Math.sin(t * 23);
    if (typeof watching !== 'undefined' && watching) pulse *= 1.8;
    ltGlow(tv.x, tv.y, 46, col, pulse, 1.25, .9);
    ltGlow(tv.x, tv.y + 48, 34, col, pulse * .45, 1.4, .32);
  }
  // moonlight through the front windows at night
  if (sc === home || (typeof parentsHome !== 'undefined' && sc === parentsHome)) {
    const W = home.W, H = home.H, wins = [[(W - 5) * T + 6, 10, 52, 36], [(W - 2) * T + 6, 8, 52, 30]];
    for (const [x, y, w, h] of wins) {
      if (!LT_VIS(x, y, 120, cx, cy)) continue;
      const gr = ctx.createLinearGradient(0, y + h, 0, H * T);
      gr.addColorStop(0, 'rgba(172,198,255,.105)'); gr.addColorStop(.6, 'rgba(160,186,255,.038)'); gr.addColorStop(1, 'rgba(150,178,255,0)');
      ctx.fillStyle = gr; ctx.beginPath();
      ctx.moveTo(x + 4, y + h); ctx.lineTo(x + w - 4, y + h);
      ctx.lineTo(x + w - 84, H * T); ctx.lineTo(x - 76, H * T); ctx.closePath(); ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
}

function mineLights(cx, cy, d, t) {
  if (!player) return;
  ctx.globalCompositeOperation = 'lighter';
  const X = player.x, Y = player.y - 10;
  const fl = .86 + .14 * Math.sin(t * 7.5) * Math.sin(t * 2.1);
  ltGlow(X, Y, 96, '255,184,104', .13 * fl, 1.1, .85);
  ltGlow(X, Y, 30, '255,218,154', .14 * fl, 1, .9);
  ctx.globalCompositeOperation = 'source-over';
}

function lightPass(sc, cx, cy, d) {
  g = ctx; ctx.setTransform(1, 0, 0, 1, -cx, -cy);
  const t = now() / 1000, h = hour();
  if (sc === town) townLights(cx, cy, d, t, h);
  else if (typeof mine !== 'undefined' && sc === mine) mineLights(cx, cy, d, t);
  else roomLights(sc, cx, cy, d, t, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // a little extra edge falloff: room vignette, cave vignette, and a soft town edge only at deep night
  let vgA = 0;
  if (sc === town) vgA = d > .42 ? .13 : 0;
  else if (typeof mine !== 'undefined' && sc === mine) vgA = .55;
  else vgA = .26 * Math.min(1, d / .203);
  if (vgA > .01) {
    const vg = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .40, VW / 2, VH / 2, Math.max(VW, VH) * .74);
    vg.addColorStop(0, 'rgba(4,6,20,0)'); vg.addColorStop(1, `rgba(4,6,20,${vgA.toFixed(3)})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH);
  }
}
