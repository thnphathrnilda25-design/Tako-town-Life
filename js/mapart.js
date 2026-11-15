'use strict';
// Map art and layout: the town keeps every building where it was, and grows south by 12 rows:
// a cliff-lined river with three wooden bridges, a flower meadow and a forest edge. Roads become cobblestone,
// pavements become dirt paths, buildings get gable tile roofs / timber or brick walls, new trees and scenery.
// Tile types: 0 grass, 1 cobblestone road, 2 dirt path, 3 meadow, 4 water, 5 bridge, 6 cliff, 7 forest path.
{
  const W = town.W, OH = town.H, NH = 42, ot = town.tile, os = town.solid;
  town.H = NH; town.tile = new Uint8Array(W * NH); town.solid = new Uint8Array(W * NH);
  town.tile.set(ot); town.solid.set(os);
  const ROADX = [6, 7, 20, 21, 34, 35];
  for (let y = OH; y < NH; y++) for (let x = 0; x < W; x++) {
    const road = ROADX.includes(x); let t;
    if (y === 30) t = 1; else if (y === 31) t = 2;
    else if (y === 32 || y === 36) t = road ? 5 : 6;
    else if (y >= 33 && y <= 35) t = road ? 5 : 4;
    else t = road ? 7 : (x >= 24 && x <= 31 && y >= 37 && y <= 38) ? 3 : 0;
    town.tile[y * W + x] = t; if (t === 4 || t === 6) town.solid[y * W + x] = 1;
  }
}
const isGrassT = t => t === 0 || t === 3;
// south forest edge and scattered trees
for (let y = 37; y < 42; y++) for (let x = 0; x < town.W; x++) {
  const t = town.tile[y * town.W + x]; if (!isGrassT(t) || town.solid[y * town.W + x]) continue;
  const dense = y >= 40 ? .85 : y === 39 ? .5 : .12;
  if (Math.abs(x - 28) <= 3 && y <= 38) continue;                  // keep the meadow open
  if (rnd() < dense) { const tr = [x, y]; TREES.push(tr); setSolid(town, x, y); town.statics.push({ k: y * T + 28, f: () => drawTree(tr) }); }
}
// a forest band above the top edge, visible when the camera reaches the top of town
for (let x = -1; x <= town.W; x += 2) { const tr = [x, -1]; town.statics.push({ k: -4, f: () => drawTree(tr) }); }
CARS.length = 3;                                                     // old town: fewer cars
for (const b of BUILDINGS) if (!b.glass && !b.awn) b.roof = ['#e8762e', '#d8503a', '#e08a3a', '#c8583a', '#d86a2e'][BUILDINGS.indexOf(b) % 5];
// ---- ground textures ----
const hsh = (x, y, i) => { const v = Math.sin(x * 127.1 + y * 311.7 + i * 74.7) * 43758.5453; return v - Math.floor(v); };
function paintTown() {
  town.ground = onCanvas(mk(town.W * T, town.H * T), () => {
    const { W, H, tile } = town, tt = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 0 : tile[y * W + x];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = tile[y * W + x], X = x * T, Y = y * T, h = i => hsh(x, y, i);
      if (isGrassT(t)) {
        R(t === 3 ? '#8cd65a' : '#7ec850', X, Y, T, T);
        for (let i = 0; i < 4; i++) R('#86d05a', X + (h(i) * 24 | 0), Y + (h(i + 9) * 24 | 0), 8, 6);
        for (let i = 0; i < 9; i++) { const a = X + (h(i + 20) * 29 | 0), b = Y + (h(i + 40) * 28 | 0), c = h(i + 60) < .55 ? '#5aa83c' : '#a6dc6a'; R(c, a, b, 1, 2); R(c, a + 2, b + 1, 1, 2); }
        const fl = t === 3 ? 4 : h(80) < .14 ? 2 : 0;
        for (let i = 0; i < fl; i++) { const a = X + 3 + (h(i + 90) * 24 | 0), b = Y + 3 + (h(i + 99) * 24 | 0), c = ['#ff8ab8', '#fff4f0', '#ffe14a', '#a8b8ff'][h(i + 70) * 4 | 0]; R(c, a, b + 1, 3, 1); R(c, a + 1, b, 1, 3); R('#ffd54a', a + 1, b + 1); }
      } else if (t === 1) {
        R('#8c7f6a', X, Y, T, T);
        for (let r = 0; r < 4; r++) for (let c = -1; c < 4; c++) {
          const sx = X + c * 8 + (r % 2) * 4, sy = Y + r * 8, v = h(r * 5 + c);
          R(v < .3 ? '#b8aa90' : v < .7 ? '#c4b69c' : '#ad9f86', sx + 1, sy + 1, 6, 6); R('#d8ccb2', sx + 2, sy + 1, 4, 1); R('#7a6e5c', sx + 1, sy + 6, 6, 1);
          if (v > .93) R('#7aa05a', sx + 2, sy + 5, 2, 1);
        }
      } else if (t === 2 || t === 7) {
        R('#d9b97e', X, Y, T, T);
        for (let i = 0; i < 7; i++) R(h(i) < .5 ? '#c6a066' : '#ead2a0', X + (h(i + 10) * 30 | 0), Y + (h(i + 30) * 30 | 0), 2, 1);
        const g = (dx, dy) => isGrassT(tt(x + dx, y + dy));
        for (let i = 0; i < 32; i += 3) {
          const j = 2 + (h(i + 50) * 3 | 0);
          if (g(0, -1)) { R('#7ec850', X + i, Y, 3, j); R('#5aa83c', X + i, Y + j, 3, 1); }
          if (g(0, 1)) { R('#7ec850', X + i, Y + T - j, 3, j); R('#c6a066', X + i, Y + T - j - 1, 3, 1); }
          if (g(-1, 0)) { R('#7ec850', X, Y + i, j, 3); R('#5aa83c', X + j, Y + i, 1, 3); }
          if (g(1, 0)) { R('#7ec850', X + T - j, Y + i, j, 3); R('#5aa83c', X + T - j - 1, Y + i, 1, 3); }
        }
      } else if (t === 4) {
        R('#4aa6de', X, Y, T, T); R('#56b2e6', X, Y + 8, T, 10);
        for (let i = 0; i < 3; i++) R('#8ad4f8', X + (h(i) * 24 | 0), Y + (h(i + 5) * 28 | 0), 4 + (h(i + 7) * 5 | 0), 1);
        if (tt(x, y - 1) !== 4) { R('#2f80b8', X, Y, T, 4); R('#d4f0ff', X, Y + 4, T, 1); }
        if (tt(x - 1, y) !== 4 && tt(x - 1, y) !== 5) R('#d4f0ff', X, Y, 2, T); if (tt(x + 1, y) !== 4 && tt(x + 1, y) !== 5) R('#d4f0ff', X + T - 2, Y, 2, T);
        if (tt(x, y + 1) !== 4) R('#d4f0ff', X, Y + T - 2, T, 2);
      } else if (t === 5) {
        R('#5aa0d4', X, Y, T, T);
        R('#b8803e', X + 2, Y, T - 4, T); for (let i = 3; i < 32; i += 6) { R('#d49a54', X + 2, Y + i - 2, T - 4, 3); R('#8a5a2a', X + 2, Y + i + 1, T - 4, 1); }
        R('#6a4220', X + 2, Y, 2, T); R('#6a4220', X + T - 4, Y, 2, T);
      } else if (t === 6) {
        const south = tt(x, y - 1) === 4;                               // cliff on the river's south bank faces north
        R('#9a8670', X, Y, T, T);
        for (let i = 0; i < 6; i++) { const a = X + (h(i) * 26 | 0), b = Y + 8 + (h(i + 3) * 18 | 0); R('#b09c84', a, b, 6, 4); R('#c4b298', a, b, 6, 1); R('#6e5e4e', a, b + 4, 6, 1); }
        if (!south) { R('#7ec850', X, Y, T, 8); for (let i = 0; i < 32; i += 4) R('#5aa83c', X + i, Y + 7 + (h(i) * 3 | 0), 4, 2); R('#4a3e34', X, Y + T - 4, T, 4); }
        else { R('#7ec850', X, Y + T - 6, T, 6); R('#4a3e34', X, Y, T, 3); }
      }
    }
  });
}
paintTown();
town.bg = '#3f8a3a';
// ---- animated water sparkles, bridge rails, river fishing ----
town.statics.push({ k: -1e5, f() {
  const t = now() / 600 | 0;
  for (let i = 0; i < 26; i++) { const x = ((i * 157 + t * 13) % (town.W * T)), y = 33 * T + ((i * 41 + t * 7) % (3 * T)); if (town.tile[Math.floor(y / T) * town.W + Math.floor(x / T)] === 4) R('#ffffffcc', x, y, 3, 1); }
} });
for (const bx of [6, 20, 34]) for (const side of [0, 2]) { const X = (bx + side) * T - (side ? 4 : 0);
  town.statics.push({ k: 36 * T + 30, f() { for (let y = 32 * T; y < 37 * T; y += 16) { R('#6a4220', X, y - 10, 4, 14); R('#8a5a2a', X, y - 10, 4, 2); } R('#8a5a2a', X, 32 * T - 8, 4, 5 * T); } }); }
for (const bx of [6, 20, 34]) town.targets.push({ x: (bx + 1) * T, y: 34 * T + 16, name: 'สะพานข้ามแม่น้ำ', opts: [['🎣 ตกปลาในแม่น้ำ', () => startFishing()], ['🌅 ยืนชมวิว', () => { fx({ mood: 6 }); tick(15); say('เสียงน้ำไหลฟังสบายใจ'); }]] });
// ---- scenery: bushes, rocks, flowers, stumps, tall grass (walk-through) ----
const DECOR = [];
for (let i = 0; i < 700 && DECOR.length < 110; i++) {
  const x = rnd() * town.W | 0, y = rnd() * town.H | 0, t = town.tile[y * town.W + x];
  if (!isGrassT(t) || town.solid[y * town.W + x] || nearB(x, y) || taken(x, y) || town.targets.some(g => Math.abs(g.x - x * T - 16) < 40 && Math.abs(g.y - y * T - 16) < 40)) continue;
  DECOR.push({ x: x * T + 4 + (rnd() * 24 | 0), y: y * T + 8 + (rnd() * 20 | 0), k: ['bush', 'rock', 'flowers', 'grass', 'grass', 'stump', 'flowers', 'mush'][rnd() * 8 | 0] });
}
function drawDecor(d) {
  const x = d.x, y = d.y;
  if (d.k === 'bush') { disc(x, y, 8, '#0002', .35); disc(x - 4, y - 6, 6, shade(treeCol[0], -10)); disc(x + 4, y - 6, 6, treeCol[0]); disc(x, y - 9, 6, treeCol[1]); R(treeCol[2], x - 2, y - 13, 3, 2); R('#e84a6a', x + 3, y - 8, 2, 2); R('#e84a6a', x - 5, y - 5, 2, 2); }
  else if (d.k === 'rock') { disc(x, y, 7, '#0002', .35); disc(x, y - 4, 6, '#9a948a', .8); R('#b8b2a8', x - 3, y - 8, 4, 2); R('#7a746a', x - 5, y - 1, 10, 1); }
  else if (d.k === 'flowers') { for (let i = 0; i < 5; i++) { const a = x - 6 + i * 3, b = y - 3 - (i % 2) * 3, c = ['#ff6a9a', '#ffe14a', '#fff', '#b88aff', '#ff9a4a'][(x + i) % 5]; R('#3f8a3a', a, b + 2, 1, 3); R(c, a - 1, b, 3, 2); R('#ffd54a', a, b, 1, 1); } }
  else if (d.k === 'grass') { for (let i = 0; i < 6; i++) R(i % 2 ? '#5aa83c' : '#3f8a3a', x - 6 + i * 2, y - 6 - (i % 3), 1, 6 + (i % 3)); }
  else if (d.k === 'stump') { disc(x, y, 7, '#0002', .35); R('#7a4a2a', x - 5, y - 6, 10, 6); R('#c89a5a', x - 5, y - 8, 10, 3); R('#a8783a', x - 2, y - 7, 4, 1); }
  else { R('#f4ece0', x - 1, y - 3, 2, 3); R('#e84a4a', x - 3, y - 6, 6, 3); R('#fff', x - 1, y - 5, 1, 1); }
}
for (const d of DECOR) town.statics.push({ k: d.y, f: () => drawDecor(d) });
// ---- trees, lamps, buildings redrawn ----
function drawTree([tx, ty]) {
  const cx = tx * T + 16, base = ty * T + 28, [c0, c1, c2] = treeCol, dark = shade(c0, -28);
  disc(cx, base, 15, '#0003', .32);
  if ((tx * 7 + ty * 13) % 3 === 0) {
    R('#6b4226', cx - 3, base - 10, 6, 10);
    const pc = ['#2a6a3a', '#357a44', '#4a9a52'], snow = seasonOf().i === 3;
    for (let i = 0; i < 3; i++) { const w = 18 - i * 5, y0 = base - 10 - i * 12;
      for (let r = 0; r < 15; r++) { const hw = Math.max(1, Math.round(w * r / 15)); R(pc[i % 2], cx - hw, y0 - 15 + r, hw * 2, 1); R(pc[2], cx - hw, y0 - 15 + r, Math.min(3, hw), 1); R('#1f5030', cx + hw - 2, y0 - 15 + r, 2, 1); }
      if (snow) R('#f4f8ff', cx - w / 3, y0 - 14, w * 2 / 3, 2); }
    return;
  }
  R('#7a4a2a', cx - 3, base - 18, 6, 18); R('#5a3418', cx + 1, base - 18, 2, 18); R('#7a4a2a', cx - 6, base - 3, 12, 3);
  disc(cx, base - 28, 15, dark); disc(cx - 8, base - 33, 10, c0); disc(cx + 8, base - 32, 10, c0); disc(cx, base - 39, 12, c1); disc(cx - 5, base - 44, 7, c2);
  for (let k = 0; k < 9; k++) { R(dark, cx - 12 + (k * 37 + tx * 11) % 24, base - 46 + (k * 53 + ty * 7) % 26, 2, 2); R(c2, cx - 10 + (k * 29 + ty * 5) % 18, base - 48 + (k * 17 + tx * 3) % 14, 2, 1); }
}
function drawLamp([tx, ty]) {
  const cx = tx * T + 16, base = ty * T + 26, on = isNight();
  disc(cx, base, 5, '#0003', .4);
  R('#5a3a22', cx - 1, base - 42, 3, 42); R('#4a2e18', cx - 3, base - 4, 7, 4); R('#5a3a22', cx - 1, base - 42, 9, 2);
  R('#3a2a1a', cx + 4, base - 40, 7, 9); R(on ? '#ffe080' : '#f4e8c0', cx + 5, base - 38, 5, 5); R('#3a2a1a', cx + 4, base - 41, 7, 1);
}
function drawBuilding(b) {
  const X = b.x * T, w = b.w * T, bot = (b.y + b.h) * T, top = bot - b.wh, rh = b.h * T, rt = top - rh, night = isNight();
  R('#0003', X + w, top + 8, 8, b.wh - 2); R('#0002', X, bot, w + 8, 5);
  if (b.glass) {
    R('#b8684e', X, top, w, b.wh);
    for (let y = top + 3, r = 0; y < bot - 6; y += 4, r++) { R('#8a4a36', X, y, w, 1); for (let x = X + (r % 2) * 4; x < X + w; x += 8) R('#8a4a36', x, y - 3, 1, 3); }
    R('#d8d0c0', X, top, w, 3); R('#9a948a', X, bot - 6, w, 6); R('#7a746a', X, bot - 1, w, 1);
  } else {
    R(b.wall, X, top, w, b.wh);
    for (let i = 0; i < 12; i++) R(shade(b.wall, -8), X + (hsh(b.x, i, 3) * (w - 2) | 0), top + (hsh(b.y, i, 4) * (b.wh - 8) | 0), 2, 1);
    R('#8a5a34', X, top, 3, b.wh); R('#8a5a34', X + w - 3, top, 3, b.wh); R('#8a5a34', X, top, w, 3);
    for (let x = X + 32; x < X + w - 8; x += 32) R('#9a6a40', x, top + 3, 2, b.wh - 9);
    R('#9a948a', X, bot - 6, w, 6); for (let x = X + (b.x % 2) * 5; x < X + w; x += 10) R('#7a746a', x, bot - 6, 1, 6); R('#b8b2a8', X, bot - 6, w, 1);
  }
  R(shade(b.glass ? '#b8684e' : b.wall, -25), X + w - 4, top, 4, b.wh - 6);
  for (const [wx, wy] of b.win) { drawWindow(b, wx, wy, night); if (!b.glass) { const sc = b.curtain ? shade(b.curtain, -60) : '#4a7a5a'; R(sc, wx - 6, wy - 2, 3, 20); R(sc, wx + 19, wy - 2, 3, 20); } }
  if (b.awn) { const ay = bot - 46; for (let i = 0; i < w; i += 8) { const c = i % 16 ? b.awn[1] : b.awn[0]; R(c, X + i, ay, 8, 10); R(c, X + i + 2, ay + 10, 4, 2); } R('#0002', X, ay + 12, w, 3); }
  if (b.sign) { const tw = ptw(b.sign, 2) + 10, sx = Math.round(b.dx - tw / 2), sy = top + 6; R('#3a2a22', sx, sy, tw, 16); R('#6a4a32', sx + 1, sy + 1, tw - 2, 14); ptext(b.sign, sx + 5, sy + 3, '#ffe9a0', 2); }
  const d = b.door || '#8a5430';
  R('#4a3022', b.dx - 11, bot - 32, 22, 32); R(d, b.dx - 9, bot - 30, 18, 30);
  if (b.glass) { R('#9ad4f0', b.dx - 7, bot - 28, 6, 26); R('#9ad4f0', b.dx + 1, bot - 28, 6, 26); }
  else { for (let y = bot - 28; y < bot - 2; y += 5) R(shade(d, -22), b.dx - 9, y, 18, 1); R(shade(b.roof, -30), b.dx - 14, bot - 38, 28, 5); R(shade(b.roof, 10), b.dx - 14, bot - 38, 28, 1); }
  R('#ffd54a', b.dx + 4, bot - 16, 2, 2); R('#a8a090', b.dx - 13, bot - 2, 26, 4);
  if (b.glass) {
    R('#7a7e86', X - 2, rt, w + 4, rh); R('#a8acb4', X - 2, rt, w + 4, 3); R('#5a5e66', X - 2, top - 4, w + 4, 4);
    for (let i = 0; i < 20; i++) R('#8a8e96', X + (hsh(b.x, i, 7) * w | 0), rt + 4 + (hsh(b.y, i, 8) * (rh - 8) | 0), 2, 1);
    R('#c8ccd0', X + 10, rt + 10, 22, 14); R('#9aa0a8', X + 12, rt + 13, 18, 2); R('#9aa0a8', X + 12, rt + 18, 18, 2);
    return;
  }
  const ridge = rt + Math.round(rh * .42), rf = b.roof;
  R(shade(rf, 22), X - 4, rt, w + 8, ridge - rt); R(rf, X - 4, ridge, w + 8, top - ridge);
  for (let y = rt + 4, r = 0; y < top - 2; y += 5, r++) for (let x = X - 4 + (r % 2) * 4; x < X + w + 4; x += 8) {
    const up = y < ridge; R(shade(rf, up ? 6 : -24), x, y, 7, 1); R(shade(rf, up ? 40 : 14), x + 1, y - 2, 5, 1);
  }
  R(shade(rf, -38), X - 4, ridge - 2, w + 8, 3); R(shade(rf, 34), X - 4, ridge - 3, w + 8, 1);
  R(shade(rf, -46), X - 5, rt, 2, top - rt); R(shade(rf, -46), X + w + 3, rt, 2, top - rt);
  R(shade(rf, -58), X - 6, top - 4, w + 12, 4);
  if (b.chimney) {
    const cx = X + w - 24; R('#8a847a', cx, rt - 12, 11, 18); R('#a8a298', cx, rt - 12, 11, 2); R('#5a544e', cx - 1, rt - 14, 13, 3);
    const t = now() / 900; for (let i = 0; i < 3; i++) { const f = (t + i / 3) % 1; disc(cx + 5 + Math.round(Math.sin(t * 3 + i) * 3), rt - 18 - Math.round(f * 18), 2 + Math.round(f * 2), `rgba(230,230,235,${.6 - f * .5})`); }
  }
}
console.assert(town.H === 42 && town.tile[34 * town.W + 20] === 5 && town.solid[34 * town.W + 10] === 1, 'river and bridges laid out');
console.assert(!blocked(town, 21 * T, 34 * T + 16), 'bridge is walkable');
