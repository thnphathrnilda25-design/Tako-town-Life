'use strict';
// Character sprites: 24x40 px, big-head proportions, 7 frames per direction (0 idle, 1-6 smooth walk cycle).
// Body, hair and every wardrobe layer are drawn from code so colours, hairstyles and the 138 clothing items keep working.
// Palette fields: h/H/L hair, c/C/a top, p pants, f shoes, sk/skd skin, e eyes, style, clip, skirt,
// hx (hair extra), topS, botS, shoeS, hatS+hatC, glS, accS+accC. Missing fields draw nothing.
const RED = '#e84a4a', SW = 24, SH = 40;
const LASH = '#2a1a2e';
function capRows(c, r = 7, cy = 8, top = 1) { for (let y = top; y <= cy; y++) { const hw = Math.max(1, Math.round(Math.sqrt(Math.max(0, r * r - (y - cy) ** 2)))); R(c, 12 - hw, y, hw * 2, 1); } }
function charCanvas(p, view, frame) {
  return onCanvas(mk(SW, SH), () => {
    const SK = p.sk || SK0, SKD = p.skd || SKD0, side = view === 'side', back = view === 'back';
    const walk = frame > 0, t = walk ? (frame - 1) / 6 * Math.PI * 2 : 0, s = walk ? Math.sin(t) : 0;
    const bob = walk && Math.abs(s) > .7 ? 1 : 0, sw = walk ? Math.round(s * 1.5) : 0;
    // legs (no bob: feet stay planted)
    let legs;
    const c = walk ? Math.cos(t) : 0;
    if (side) { const d = Math.round(s * 3.5); legs = [{ x: 11 - d, lift: Math.round(Math.max(0, -c) * 2), sx: 11 - d, back: 1 }, { x: 11 + d, lift: Math.round(Math.max(0, c) * 2), sx: 11 + d }]; }
    else legs = [{ x: 8, lift: Math.round(Math.max(0, s) * 2), sx: 7 }, { x: 13, lift: Math.round(Math.max(0, -s) * 2), sx: 13 }];
    if (p.style === 'long' && !back) { R(p.H, 6, 10, 12, 13); }                        // long hair behind the body
    for (const L of legs) {
      const pc = L.back ? shade(p.p, -30) : p.p;
      R(p.skirt ? (L.back ? SKD : SK) : pc, L.x, 27, 3, 8 - L.lift);
      R(L.back ? shade(p.f, -25) : p.f, L.sx, 35 - L.lift, 4, 2); R(shade(p.f, -45), L.sx, 37 - L.lift, 4, 1);
    }
    wearLegs(p, view, side, legs, SK);
    g.save(); g.translate(0, bob);
    if (side) { const fx2 = 12 + Math.round(s * 2.5); R(shade(p.C, -25), fx2, 18, 3, 6); R(SKD, fx2, 24, 3, 2); }   // far arm, behind the body
    // torso
    if (side) { R(p.c, 8, 17, 8, 10); R(p.C, 8, 17, 2, 10); R(p.C, 8, 26, 8, 1); R(p.a, 15, 17, 1, 3); }
    else { R(p.c, 7, 17, 10, 10); R(p.C, 15, 17, 2, 10); R(p.C, 7, 26, 10, 1); R(shade(p.c, 18), 8, 18, 1, 6); if (!back) { R(SKD, 10, 17, 4, 1); R(SKD, 11, 18, 2, 1); R(p.C, 9, 17, 1, 1); R(p.C, 14, 17, 1, 1); } }   // plain crew neck: no tie on every shirt
    if (p.skirt && (!p.botS || p.botS === 'skirt' || p.botS === 'plaidskirt' || p.botS === 'tennisskirt')) { const x0 = side ? 7 : 6, w = side ? 10 : 12; R(p.p, x0, 25, w, 5); R(shade(p.p, -35), x0, 29, w, 1); for (let i = x0 + 2; i < x0 + w; i += 3) R(shade(p.p, -20), i, 26, 1, 3); }
    // arms
    if (side) { const ax = 11 - Math.round(s * 2.5); R(p.c, ax, 18, 3, 7); R(p.C, ax, 18, 1, 7); R(shade(p.c, 25), ax + 2, 18, 1, 5); R(SK, ax, 25, 3, 2); }   // sleeve reads as a sleeve, not a zipper
    else { R(p.c, 5, 18 + sw, 2, 7); R(SK, 5, 25 + sw, 2, 2); R(p.C, 17, 18 - sw, 2, 7); R(SKD, 17, 25 - sw, 2, 2); }
    R(SKD, 10, 16, 4, 1);
    wearBody(p, view, side, SK);
    if (p.bust && !back) { if (side) { R(p.c, 16, 19, 1, 2); R('#00000030', 15, 21, 2, 1); } else { R('#ffffff2a', 8, 19, 3, 1); R('#ffffff2a', 13, 19, 3, 1); R('#00000030', 8, 21, 3, 1); R('#00000030', 13, 21, 3, 1); } }   // adult women only: a soft chest curve, shading over any top
    // head
    if (back) {
      capRows(p.h); R(p.h, 5, 7, 14, 9); R(p.H, 5, 14, 14, 2); R(p.L, 9, 3, 5, 1); R(p.L, 8, 4, 2, 1);
      if (p.style === 'bob') { R(p.h, 4, 7, 16, 11); R(p.H, 4, 16, 16, 2); }
      if (p.style === 'long') { R(p.h, 6, 14, 12, 9); R(p.H, 6, 21, 12, 2); R(p.H, 11, 15, 1, 6); }
    } else if (side) {
      R(SK, 10, 6, 7, 10); R(SK, 9, 7, 9, 8); R(SK, 18, 11, 1, 2);
      capRows(p.h); R(p.h, 5, 6, 6, 10); R(p.H, 5, 13, 6, 3); R(p.h, 10, 7, 8, 2); for (const x of [11, 14]) R(p.h, x, 9, 2, 1);
      if (p.style === 'bob') R(p.h, 4, 7, 6, 10); if (p.style === 'long') R(p.h, 4, 7, 6, 16); if (p.style === 'swept') R(p.h, 10, 9, 4, 2);
      R(SKD, 9, 10, 2, 3); R(LASH, 14, 10, 2, 1); R(p.e, 14, 11, 2, 2); R('#fff', 14, 11, 1, 1); R('#f2a0a0', 15, 13, 2, 1); R('#b0584a', 16, 14, 1, 1);
      R(p.L, 9, 3, 5, 1);
    } else {
      R(SK, 7, 6, 10, 10); R(SK, 6, 7, 12, 8); R(SKD, 5, 10, 1, 3); R(SKD, 18, 10, 1, 3);
      capRows(p.h); R(p.h, 6, 7, 12, 2); for (const x of [6, 9, 13, 16]) R(p.h, x, 9, 2, 1);
      R(p.h, 5, 7, 2, 7); R(p.H, 17, 7, 2, 7); R(p.H, 10, 5, 1, 4); R(p.H, 14, 6, 1, 3); R(p.L, 7, 5, 1, 2);   // strand lines so hair is not one flat blob
      if (p.style === 'swept') { R(p.h, 6, 9, 6, 2); R(p.h, 6, 11, 3, 1); }
      if (p.style === 'bob') { R(p.h, 4, 7, 3, 10); R(p.H, 17, 7, 3, 10); }
      if (p.style === 'long') { R(p.h, 4, 7, 3, 16); R(p.H, 17, 7, 3, 16); }
      R(p.L, 9, 3, 5, 1); R(p.L, 8, 4, 2, 1);
      for (const x of [8, 14]) { R(LASH, x, 10, 2, 1); R(p.e, x, 11, 2, 2); R('#fff', x, 11, 1, 1); }
      R('#f2a0a0', 7, 13, 2, 1); R('#f2a0a0', 15, 13, 2, 1); R('#b0584a', 11, 14, 2, 1);
      if (p.clip) { R('#ffe14a', 7, 4, 1, 3); R('#ffe14a', 6, 5, 3, 1); }
    }
    wearHead(p, view, side);
    g.restore();
  });
}
// sprites[dir][frame]: dir 0 down, 1 up, 2 left, 3 right; frame 0 idle, 1-6 walk
function sheet(p) {
  const v = view => [0, 1, 2, 3, 4, 5, 6].map(f => outline(charCanvas(p, view, f)));
  const right = v('side');
  return [v('front'), v('back'), right.map(flipC), right];
}
const HX = {   // hair extras: (p, view, side)
  spiky: p => { for (const [x, h] of [[6, 3], [9, 4], [12, 5], [15, 4], [18, 3]]) R(p.h, x - 1, 5 - h, 2, h + 1); R(p.L, 12, 1, 1, 2); },
  bun: p => { disc(12, 2, 3, p.h); R(p.L, 11, 0, 2, 1); R(p.H, 9, 4, 6, 1); },
  spacebuns: p => { for (const x of [6, 18]) { disc(x, 3, 3, p.h); R(p.L, x - 1, 1, 1, 1); } },
  topknot: p => { R(p.h, 10, 0, 4, 3); R(RED, 10, 2, 4, 1); },
  ponytail: (p, v, s) => { if (v === 'back') { R(p.h, 10, 12, 4, 12); R(p.H, 10, 22, 4, 2); R(RED, 10, 11, 4, 1); } else if (s) { R(p.h, 3, 8, 3, 13); R(p.H, 3, 19, 3, 2); R(RED, 3, 8, 3, 1); } else { R(p.h, 18, 8, 3, 12); R(p.H, 18, 18, 3, 2); R(RED, 18, 8, 3, 1); } },
  twintails: (p, v, s) => { if (s) { R(p.h, 3, 9, 4, 13); R(p.H, 3, 20, 4, 2); } else for (const x of [2, 19]) { R(p.h, x, 9, 3, 13); R(p.H, x, 20, 3, 2); R(RED, x, 8, 3, 1); } },
  pigtails: (p, v, s) => { if (s) R(p.h, 3, 9, 4, 7); else for (const x of [2, 19]) { R(p.h, x, 9, 3, 7); R(p.H, x, 14, 3, 2); R(RED, x, 8, 3, 1); } },
  braid: (p, v, s) => { const x = v === 'back' ? 10 : s ? 4 : 18; for (let i = 0; i < 6; i++) R(i % 2 ? p.H : p.h, x, 12 + i * 2, 3, 2); R(RED, x, 24, 3, 1); },
  afro: p => { for (let y = 0; y <= 8; y++) { const hw = Math.min(11, Math.round(Math.sqrt(Math.max(0, 110 - (y - 8) ** 2)))); R(p.h, 12 - hw, y, hw * 2, 1); } R(p.h, 1, 8, 5, 8); R(p.h, 18, 8, 5, 8); R(p.H, 1, 14, 5, 2); R(p.H, 18, 14, 5, 2); R(p.L, 7, 2, 4, 1); },
  curly: p => { for (let i = 0; i < 8; i++) disc(5 + i * 2, 3 + (i % 2) * 2, 2, i % 2 ? p.h : p.H); R(p.L, 11, 1, 2, 1); },
  mohawk: p => { R(p.h, 10, 0, 4, 7); R(p.H, 10, 5, 4, 2); R(p.L, 11, 1, 1, 3); },
  sidepart: p => { R(p.L, 7, 4, 6, 1); R(p.H, 12, 4, 1, 4); R(p.h, 6, 8, 7, 2); },
  bowl: p => { R(p.h, 5, 7, 14, 3); R(p.H, 5, 9, 14, 1); },
  fringe: (p, v) => { if (v === 'back') return; R(p.h, 6, 8, 12, 3); for (const x of [7, 10, 13, 16]) R(p.H, x, 10, 2, 1); },
  pixie: p => { R(p.h, 5, 8, 2, 5); R(p.h, 17, 8, 2, 5); R(p.h, 9, 8, 6, 2); },
  wavy: (p, v, s) => { for (let y = 9; y < 23; y++) { const o = y % 4 < 2 ? 0 : 1; if (s) R(p.h, 3 + o, y, 3, 1); else { R(p.h, 3 + o, y, 3, 1); R(p.h, 18 - o, y, 3, 1); } } },
  messy: p => { for (const [x, y, w] of [[5, 2, 3], [9, 0, 3], [14, 1, 3], [17, 2, 3], [7, 5, 2], [16, 4, 2]]) R(p.h, x, y, w, 3); R(p.L, 10, 1, 1, 1); },
  slick: p => { R(p.L, 7, 3, 9, 1); R(p.H, 6, 7, 12, 1); },
};
const TOPFX = {   // overlays on the torso box (x0..x0+w, y 17..26)
  tank: (p, x, w, v, SK) => { R(SK, 5, 18, 2, 7); R(SK, 17, 18, 2, 7); R(SK, x, 17, 2, 1); R(SK, x + w - 2, 17, 2, 1); },
  hoodie: (p, x, w) => { R(p.C, x + 1, 16, w - 2, 2); R(p.C, x + 2, 22, w - 4, 3); R('#fff', 10, 18, 1, 3); R('#fff', 13, 18, 1, 3); },
  stripes: (p, x, w) => { for (let y = 18; y < 26; y += 2) R(p.a, x, y, w, 1); },
  jacket: (p, x, w) => { R('#f4f4f4', 11, 17, 2, 9); R(p.C, x, 17, 3, 10); R(p.C, x + w - 3, 17, 3, 10); R('#2a2a3a', 11, 17, 1, 9); },
  suit: (p, x, w) => { R('#fff', 10, 17, 4, 2); R(RED, 11, 18, 2, 6); R(p.C, x, 17, 2, 10); R(p.C, x + w - 2, 17, 2, 10); },
  tux: (p, x, w) => { R('#fff', 9, 17, 6, 7); R('#111', 11, 17, 2, 2); R(p.C, x, 17, 2, 10); R(p.C, x + w - 2, 17, 2, 10); },
  dress: (p, x, w) => { R(p.c, 6, 26, 12, 6); R(p.C, 6, 31, 12, 1); R(p.a, x, 22, w, 1); },
  sweater: (p, x, w) => { for (let i = x + 1; i < x + w; i += 2) R(p.C, i, 18, 1, 7); R(p.C, x, 17, w, 1); },
  vest: (p, x, w) => { R(p.a, x, 17, 3, 10); R(p.a, x + w - 3, 17, 3, 10); R('#f4f4f4', 11, 17, 2, 8); },
  overalls: (p, x, w) => { R(p.a, x + 1, 17, 2, 10); R(p.a, x + w - 3, 17, 2, 10); R(p.a, x + 2, 21, w - 4, 6); R('#ffd54a', x + 2, 21, 1, 1); R('#ffd54a', x + w - 3, 21, 1, 1); },
  polo: p => { R('#fff', 9, 17, 6, 1); R(p.C, 11, 18, 2, 3); R('#fff', 11, 19, 1, 1); },
  jersey: (p, x, w) => { R('#fff', x, 17, 1, 10); R('#fff', x + w - 1, 17, 1, 10); R('#fff', 10, 19, 4, 1); R('#fff', 11, 20, 2, 4); },
  coat: (p, x, w) => { R(p.c, 7, 26, 10, 6); R(p.C, 11, 17, 2, 15); R(p.C, x, 17, 3, 3); R(p.C, x + w - 3, 17, 3, 3); R(p.a, 11, 20, 2, 1); },
  pajamas: (p, x) => { for (const [dx, dy] of [[1, 1], [5, 3], [8, 1], [3, 6], [7, 7]]) R(p.a, x + dx, 17 + dy, 1, 1); },
  cardigan: () => { R('#f4f4f4', 10, 17, 4, 10); for (const y of [19, 22, 25]) R('#ffd54a', 12, y, 1, 1); },
  raincoat: (p, x, w) => { R(p.C, x, 16, w, 2); R(p.a, 11, 18, 2, 8); for (const y of [20, 23]) R('#fff', 12, y, 1, 1); R(p.c, 7, 26, 10, 3); },
  kimono: (p, x, w) => { for (let i = 0; i < 7; i++) R(p.C, x + 1 + i, 17 + i, 2, 1); R(p.a, x, 22, w, 3); },
  uniform: (p, x, w) => { R('#fff', 9, 17, 6, 2); R(p.a, 11, 18, 2, 4); R(p.C, x, 17, w, 1); R('#ffd54a', 15, 20, 1, 1); },
};
function wearLegs(p, v, side, legs, SK) {
  if (p.botS === 'longskirt') { R(p.p, 6, 25, 12, 10); R(shade(p.p, -35), 6, 34, 12, 1); for (let i = 8; i < 17; i += 3) R(shade(p.p, -20), i, 27, 1, 6); }
  for (const L of legs) {
    const yb = 35 - L.lift;
    if (p.botS === 'shorts') R(SK, L.x, 31, 3, yb - 31);
    if (p.botS === 'cargo') R(shade(p.p, -30), L.x, 29, 3, 2);
    if (p.botS === 'leggings') R(shade(p.p, 40), L.x, 27, 1, yb - 27);
    if (p.botS === 'slacks') R(shade(p.p, 25), L.x + 1, 27, 1, yb - 27);
    const sh = p.shoeS;
    if (sh === 'sneakers') { R('#fff', L.sx, yb + 2, 4, 1); R('#fff', L.sx + 1, yb, 1, 1); }
    if (sh === 'boots') R(p.f, L.x, yb - 3, 3, 3);
    if (sh === 'sandals') R(SK, L.sx + 1, yb, 2, 1);
    if (sh === 'heels') R(RED, L.sx + 3, yb + 2, 1, 1);
    if (sh === 'slippers') { R('#ffb0d0', L.sx, yb, 4, 2); R('#fff', L.sx, yb, 4, 1); }
  }
}
const SIDE_OK = ['stripes', 'sweater', 'dress', 'coat', 'pajamas', 'kimono', 'overalls', 'tank'];   // front details (zips, ties, strings) look wrong in profile
function wearBody(p, v, side, SK) { const x = side ? 8 : 7, w = side ? 8 : 10; if (side && !SIDE_OK.includes(p.topS)) return; (TOPFX[p.topS] || (() => 0))(p, x, w, v, SK); }
const HATFX = {
  cap: (p, v, s) => { R(p.hatC, 6, 2, 12, 4); R(shade(p.hatC, -30), 6, 5, 12, 1); if (v !== 'back') R(shade(p.hatC, -30), s ? 12 : 4, 6, 8, 1); },
  beanie: p => { R(p.hatC, 5, 1, 14, 6); R(shade(p.hatC, -30), 5, 5, 14, 2); disc(12, 0, 2, '#fff'); },
  sunhat: p => { R(p.hatC, 1, 6, 22, 2); R(p.hatC, 6, 1, 12, 6); R(RED, 6, 5, 12, 1); },
  beret: p => { R(p.hatC, 5, 2, 13, 4); R(p.hatC, 7, 1, 10, 1); R(shade(p.hatC, -30), 11, 0, 2, 1); },
  crown: p => { R('#ffd54a', 7, 2, 10, 3); for (const x of [7, 10, 13, 16]) R('#ffd54a', x, 0, 1, 3); R(RED, 11, 2, 2, 2); },
  catears: p => { for (const x of [6, 15]) { R(p.hatC, x, 0, 3, 3); R('#ffb0c8', x + 1, 1, 1, 2); } },
  party: p => { for (let i = 0; i < 6; i++) R(i % 2 ? '#ffd54a' : p.hatC, 12 - Math.ceil(i / 2), 5 - i, 1 + Math.ceil(i / 2) * 2, 1); },
  helmet: p => { R(p.hatC, 5, 1, 14, 7); R('#ffffff60', 7, 2, 4, 1); R(shade(p.hatC, -40), 5, 7, 14, 1); },
  headband: p => { R(p.hatC, 5, 6, 14, 2); },
  wizard: p => { R(p.hatC, 2, 6, 20, 2); R(p.hatC, 7, 2, 10, 4); R(p.hatC, 10, 0, 4, 3); R('#ffd54a', 7, 5, 10, 1); },
  bow: p => { R(p.hatC, 7, 1, 4, 3); R(p.hatC, 13, 1, 4, 3); R(shade(p.hatC, -30), 11, 2, 2, 2); },
  flowers: p => { for (const x of [6, 9, 13, 16]) { R(p.hatC, x, 4, 2, 2); R('#ffd54a', x, 5, 1, 1); } },
};
const GLFX = {    // eyes are at y 10..12, x 8 and 14 (front) or 14 (side)
  round: (p, s) => frame2(s, '#2a2a3a'), square: (p, s) => frame2(s, '#c8402e'),
  sun: (p, s) => { for (const x of s ? [13] : [7, 13]) R('#14141e', x, 9, 4, 3); if (!s) R('#14141e', 11, 10, 2, 1); R('#ffffff50', s ? 14 : 8, 9, 2, 1); },
  heart: (p, s) => { for (const x of s ? [13] : [7, 13]) { R('#ff5a9a', x, 9, 4, 2); R('#ff5a9a', x + 1, 11, 2, 1); } if (!s) R('#ff5a9a', 11, 10, 2, 1); },
  monocle: () => { R('#ffd54a', 13, 9, 4, 1); R('#ffd54a', 13, 12, 4, 1); R('#ffd54a', 13, 9, 1, 4); R('#ffd54a', 16, 9, 1, 4); R('#ffd54a', 16, 13, 1, 4); },
  vr: () => { R('#3a3a48', 6, 8, 12, 5); R('#8ad0f0', 8, 9, 3, 2); R('#8ad0f0', 13, 9, 3, 2); },
};
function frame2(s, c) { for (const x of s ? [13] : [7, 13]) { R(c, x, 9, 4, 1); R(c, x, 12, 4, 1); R(c, x, 9, 1, 4); R(c, x + 3, 9, 1, 4); } if (!s) R(c, 11, 10, 2, 1); }
const ACCFX = {
  scarf: (p, v) => { R(p.accC, 7, 16, 10, 2); if (v !== 'back') { R(p.accC, 8, 18, 3, 5); R(shade(p.accC, -30), 8, 22, 3, 1); } },
  necklace: (p, v) => { if (v === 'back') return; for (const x of [8, 10, 13, 15]) R('#ffd54a', x, 17, 1, 1); R('#ff5a9a', 11, 18, 2, 2); },
  bowtie: (p, v) => { if (v === 'back') return; R(p.accC, 8, 16, 3, 2); R(p.accC, 13, 16, 3, 2); R('#2a2a3a', 11, 16, 2, 2); },
  backpack: (p, v, s) => { if (v === 'back') { R(p.accC, 7, 17, 10, 9); R(shade(p.accC, -30), 7, 21, 10, 1); R('#ffd54a', 11, 19, 2, 1); } else if (s) R(p.accC, 5, 17, 3, 9); else { R(p.accC, 7, 17, 1, 7); R(p.accC, 16, 17, 1, 7); } },
  headphones: p => { R('#2a2a3a', 5, 2, 14, 1); R('#2a2a3a', 5, 3, 1, 7); R('#2a2a3a', 18, 3, 1, 7); R(p.accC, 4, 9, 3, 4); R(p.accC, 17, 9, 3, 4); },
  mask: (p, v, s) => { if (v === 'back') return; R('#f4f8fa', s ? 13 : 8, 13, s ? 5 : 8, 3); R('#c8d0d8', s ? 13 : 8, 15, s ? 5 : 8, 1); },
  wings: p => { for (const x of [0, 19]) { R(p.accC, x, 17, 5, 7); R('#ffffff80', x + 1, 18, 3, 2); R(p.accC, x + (x < 10 ? 0 : 1), 24, 4, 3); } },
  earrings: (p, v) => { if (v === 'back') return; R('#ffd54a', 5, 13, 1, 2); R('#ffd54a', 18, 13, 1, 2); },
  cape: (p, v) => { if (v === 'back') { R(p.accC, 6, 17, 12, 14); R(shade(p.accC, -30), 6, 29, 12, 2); } else { R(p.accC, 6, 17, 1, 12); R(p.accC, 17, 17, 1, 12); } },
};
function wearHead(p, v, side) {
  if (p.hx && HX[p.hx]) HX[p.hx](p, v, side);
  if (v !== 'back' && p.glS && GLFX[p.glS]) GLFX[p.glS](p, side);
  if (p.accS && ACCFX[p.accS]) ACCFX[p.accS](p, v, side);
  if (p.hatS && HATFX[p.hatS]) HATFX[p.hatS](p, v, side);
}
console.assert(Object.keys(HX).length >= 18, 'hair extras');

// pixel font: the letters game.js did not define, so every shop sign reads properly
Object.assign(GL, { S: '111100111001111', L: '100100100100111', W: '101101111111101', Y: '101101010010010', B: '110101110101110', D: '110101101101110', G: '011100101101011', V: '101101101101010', J: '001001001101010', Q: '010101101111011' });
