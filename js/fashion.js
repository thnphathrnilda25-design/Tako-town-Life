'use strict';
// Fashion styles: drip, old money, kid, jacket, vintage, minimal and emo. New hairstyles, new clothing drawn in code,
// curated-colour items, ready-made "looks" sold as a set, and townsfolk dressed in these styles.
const SKC = p => p.sk || SK0;
const _rgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const _lum = h => { const [r, g, b] = _rgb(h); return .299 * r + .587 * g + .114 * b; };
const _cdist = (a, b) => { const A = _rgb(a), B = _rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
const _shiftHex = (h, d) => { const [r, g, b] = _rgb(h), f = v => Math.max(0, Math.min(255, Math.round(v + d))); return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join(''); };
// ---- hairstyles ----
Object.assign(HX, {
  emo: (p, v, s) => { if (v === 'back') { R(p.h, 5, 14, 14, 3); for (const x of [6, 10, 14]) R(p.H, x, 17, 2, 1); return; }
    if (s) { R(p.h, 11, 7, 6, 3); R(p.h, 4, 11, 5, 4); return; }
    R(p.h, 6, 7, 7, 2); R(p.H, 8, 9, 2, 1); R(p.h, 4, 11, 2, 4); R(p.H, 18, 11, 2, 4); R(p.L, 8, 5, 3, 1); },
  wolf: (p, v, s) => { if (v === 'back') { R(p.h, 5, 14, 14, 4); R(p.H, 4, 17, 3, 2); R(p.H, 17, 17, 3, 2); return; }
    if (s) { R(p.h, 4, 12, 5, 6); R(p.H, 3, 17, 3, 2); R(p.h, 12, 7, 3, 2); return; }
    R(p.h, 4, 9, 2, 7); R(p.H, 18, 9, 2, 7); R(p.h, 3, 15, 2, 2); R(p.H, 19, 15, 2, 2); for (const x of [7, 11, 15]) R(p.h, x, 8, 2, 2); },
  curtain: (p, v, s) => { if (v === 'back' || s) return; R(SKC(p), 10, 8, 4, 2); R(p.H, 11, 3, 2, 5); R(p.h, 6, 9, 3, 1); R(p.h, 15, 9, 3, 1); R(p.h, 9, 8, 1, 1); R(p.h, 14, 8, 1, 1); },
  oldmoney: (p, v, s) => { if (v === 'back') { R(p.L, 9, 4, 6, 1); return; } if (s) { R(p.L, 10, 4, 4, 1); return; }
    R(SKC(p), 7, 8, 10, 2); R(p.h, 6, 7, 12, 1); R(p.L, 8, 4, 3, 1); R(p.L, 12, 3, 3, 1); R(p.H, 10, 5, 4, 1); },
  mullet: (p, v, s) => { if (v === 'back') { R(p.h, 6, 14, 12, 5); R(p.H, 6, 18, 12, 1); } else if (s) R(p.h, 4, 13, 5, 6); else { R(p.h, 4, 12, 2, 6); R(p.H, 18, 12, 2, 6); } },
  hime: (p, v, s) => { if (v === 'back') return; if (s) { R(p.h, 10, 8, 7, 2); return; } R(p.h, 6, 8, 12, 2); R(p.H, 6, 9, 12, 1); R(p.h, 5, 10, 2, 6); R(p.H, 17, 10, 2, 6); R(p.H, 5, 15, 2, 1); },
  halfup: (p, v) => { disc(12, v === 'back' ? 4 : 2, 2, p.h); R(p.L, 11, v === 'back' ? 3 : 1, 2, 1); R('#f4f4f4', 10, v === 'back' ? 6 : 4, 4, 1); },
  locs: (p, v, s) => { const xs = v === 'back' ? [6, 8, 10, 12, 14, 16] : s ? [3, 5, 7] : [3, 5, 17, 19];
    xs.forEach((x, i) => { R(i % 2 ? p.H : p.h, x, v === 'back' ? 12 : 8, 2, 12); R('#ffd54a', x, 16 + (i % 2) * 2, 2, 1); }); },
  highpony: (p, v, s) => { if (v === 'back') { R(p.h, 10, 1, 4, 3); R(RED, 10, 3, 4, 1); R(p.h, 10, 4, 4, 14); R(p.H, 11, 6, 1, 10); }
    else if (s) { R(p.h, 3, 3, 3, 15); R(p.H, 3, 16, 3, 2); R(RED, 4, 2, 2, 2); } else { R(p.h, 18, 3, 2, 13); R(p.H, 19, 5, 1, 9); R(RED, 18, 2, 2, 1); } },
  curlybob: (p, v, s) => { for (const y of [8, 11, 14, 17]) { if (s) disc(6, y, 2, y % 2 ? p.h : p.H); else { disc(5, y, 2, p.h); disc(19, y, 2, p.H); } } if (v === 'back') R(p.h, 5, 12, 14, 7); },
  manbun: (p, v, s) => { if (v === 'back') { disc(12, 6, 2, p.h); R(p.L, 11, 5, 1, 1); } else if (s) disc(5, 4, 2, p.h); else disc(12, 1, 2, p.h); },
  midlong: (p, v, s) => { if (v === 'back' || s) return; R(SKC(p), 10, 8, 4, 2); R(p.H, 11, 2, 2, 6); },
  twoblock: (p, v, s) => { if (v === 'back') { R(p.H, 6, 14, 12, 1); return; } if (s) { R(p.h, 11, 8, 6, 2); R(shade(p.H, -20), 6, 11, 3, 4); return; }
    R(p.h, 6, 8, 12, 2); R(shade(p.H, -20), 5, 10, 2, 4); R(shade(p.H, -20), 17, 10, 2, 4); },
});
HAIRSTYLES.push(...[['emo', 'short', 'อีโมหน้าม้าปัด'], ['wolf', 'short', 'วูล์ฟคัท'], ['curtain', 'short', 'แสกกลางม่านหน้าม้า'], ['oldmoney', 'short', 'หวีเสยผู้ดี'], ['mullet', 'short', 'มัลเล็ต'],
  ['hime', 'long', 'ฮิเมะคัท'], ['halfup', 'long', 'เกล้าครึ่งหัว'], ['locs', 'short', 'เดรดล็อก'], ['highpony', 'short', 'หางม้าสูง'], ['curlybob', 'bob', 'บ๊อบลอนหยิก'],
  ['manbun', 'short', 'แมนบัน'], ['midlong', 'long', 'แสกกลางยาว'], ['twoblock', 'short', 'ทูบล็อก']].map(([hx, style, n]) => ({ id: hx, n, style, hx, price: 150 })));
// ---- tops (x0..x0+w on y 17..26; w 8 = side view) ----
const ARMS = c => { R(c, 5, 19, 2, 5); R(shade(c, -25), 17, 19, 2, 5); };   // rows 19-23 stay inside the swinging front arms
Object.assign(TOPFX, {
  puffer: (p, x, w, v) => { R(p.C, x, 16, w, 2); for (let y = 19; y < 26; y += 3) R(p.C, x, y, w, 1); R(shade(p.c, 25), x + 1, 17, 2, 1); if (w > 8 && v !== 'back') R(p.a, 11, 18, 1, 8); },
  graphic: (p, x, w) => { R(p.c, x, 26, w, 2); R(p.C, x, 27, w, 1); if (w > 8) { R(p.a, 10, 19, 4, 4); R('#fff', 11, 20, 2, 2); R(p.a, 9, 24, 6, 1); } },
  tracksuit: (p, x, w) => { R('#fff', x, 17, 1, 10); R('#fff', x + w - 1, 17, 1, 10); R('#fff', 11, 17, 1, 10); R(p.C, 9, 16, 6, 1); },
  cableknit: (p, x, w) => { for (const cx of [8, 11, 14]) for (let y = 18; y < 25; y += 2) R(p.C, cx + (y % 4 ? 1 : 0), y, 1, 1); R(p.C, x, 25, w, 2); R(p.C, 9, 16, 6, 1); },
  sweaterdrape: (p, x, w) => { R('#fff', 9, 16, 2, 2); R('#fff', 13, 16, 2, 2); R(p.a, x - 1, 17, w + 2, 2); R(p.a, 10, 19, 4, 2); R(shade(p.a, -20), 9, 21, 2, 3); R(shade(p.a, -20), 13, 21, 2, 3); },
  blazer: (p, x, w) => { R('#fff', 11, 17, 2, 7); R(p.C, 10, 17, 1, 5); R(p.C, 13, 17, 1, 5); R(p.a, 10, 22, 1, 1); R(p.a, 10, 24, 1, 1); R(p.a, 14, 19, 1, 1); R(p.C, x, 17, 1, 10); },
  oxford: p => { R(shade(p.c, 30), 9, 17, 2, 2); R(shade(p.c, 30), 13, 17, 2, 2); R(p.C, 11, 18, 1, 8); for (const y of [20, 23]) R(p.a, 11, y, 1, 1); },
  dino: (p, x, w, v) => { if (v === 'back') { for (let y = 16; y < 26; y += 3) { R(p.a, 11, y, 2, 2); } return; } R(shade(p.c, 35), 9, 20, 6, 5); R(p.C, 10, 26, 4, 1); },
  rainbow: (p, x, w) => { ['#e84a4a', '#f2a03a', '#f2d44a', '#5ac46a', '#4a8ae8'].forEach((c, i) => R(c, x, 19 + i, w, 1)); },
  bomber: (p, x, w) => { R(p.a, x, 16, w, 2); R(p.a, x, 25, w, 2); R(shade(p.a, -30), x, 26, w, 1); if (w > 8) { R(shade(p.c, -40), 11, 18, 1, 7); R(p.a, 15, 19, 1, 2); } },
  denim: (p, x, w) => { R(p.C, 9, 16, 2, 2); R(p.C, 13, 16, 2, 2); R(p.C, 8, 19, 3, 2); R(p.C, 13, 19, 3, 2); R(p.a, 9, 20, 1, 1); R(p.a, 14, 20, 1, 1); R(p.C, 11, 17, 1, 10); R(p.C, x, 25, w, 1); },
  varsity: (p, x, w, v) => { ARMS(p.a); R(p.a, x, 25, w, 1); R(p.a, 9, 16, 6, 1); if (v === 'back') return; R(p.a, 9, 19, 3, 1); R(p.a, 10, 20, 1, 3); for (const y of [19, 22]) R('#fff', 13, y, 1, 1); },
  leather: (p, x, w) => { R(p.C, 8, 17, 2, 3); R(p.C, 14, 17, 2, 3); R(p.a, 13, 17, 1, 3); R(p.a, 12, 20, 1, 3); R(p.a, 11, 23, 1, 3); R(p.C, x, 25, w, 1); R(shade(p.c, 30), 8, 21, 1, 3); },
  bowling: (p, x, w) => { R(p.a, 9, 17, 2, 10); R(p.a, 13, 17, 2, 10); R('#fff', 9, 17, 2, 1); R('#fff', 13, 17, 2, 1); },
  polka: (p, x, w) => { for (let r = 0; r < 4; r++) for (let i = 0; i < w; i += 3) R(p.a, x + 1 + i + (r % 2), 18 + r * 2, 1, 1); },
  flannel: (p, x, w) => { for (let i = 1; i < w; i += 3) R(p.C, x + i, 17, 1, 10); for (const y of [19, 22, 25]) R(p.C, x, y, w, 1); for (let i = 1; i < w; i += 3) for (const y of [19, 22, 25]) R(p.a, x + i, y, 1, 1); },
  retrostripe: (p, x, w) => { R(p.a, x, 20, w, 2); R('#fff', x, 22, w, 1); R(p.a, 9, 16, 6, 1); },
  turtleneck: p => { R(p.c, 10, 17, 4, 2); R(p.C, 9, 16, 6, 1); },
  linen: (p, x, w, v, SK) => { R(SK, 11, 17, 2, 3); R(shade(p.c, 25), 9, 17, 2, 2); R(shade(p.c, 25), 13, 17, 2, 2); R(p.C, 11, 20, 1, 6); },
  knitvest: (p, x, w) => { R(p.a, x, 19, w, 7); R(p.a, x, 18, 3, 1); R(p.a, x + w - 3, 18, 3, 1); R(shade(p.a, -25), 11, 21, 2, 2); R(shade(p.a, -25), 10, 22, 4, 1); R('#fff', 9, 17, 2, 1); R('#fff', 13, 17, 2, 1); },
  bandtee: p => { R('#f4f4f4', 10, 19, 4, 3); R('#14141e', 10, 20, 1, 1); R('#14141e', 13, 20, 1, 1); R('#f4f4f4', 11, 22, 2, 1); R(p.a, 9, 24, 6, 1); },
  emohoodie: (p, x, w) => { R(p.C, x + 1, 16, w - 2, 2); for (let i = 0; i < 6; i++) { R(i % 2 ? '#fff' : '#14141e', 9 + i, 23, 1, 1); R(i % 2 ? '#14141e' : '#fff', 9 + i, 24, 1, 1); } R('#fff', 10, 18, 1, 3); R('#fff', 13, 18, 1, 3); },
  stripesleeve: p => { for (const y of [19, 21, 23]) { R(p.a, 5, y, 2, 1); R(p.a, 17, y, 2, 1); } R(p.a, 10, 19, 4, 2); R('#fff', 11, 19, 2, 1); },
});
SIDE_OK.push('puffer', 'cableknit', 'rainbow', 'polka', 'flannel', 'retrostripe', 'graphic');
// ---- bottoms, shoes ----
const SKIRT_B = ['skirt', 'plaidskirt', 'tennisskirt'];
const _wl = wearLegs;
wearLegs = (p, v, side, legs, SK) => {
  _wl(p, v, side, legs, SK);
  for (const L of legs) {
    const yb = 35 - L.lift, b = p.botS, s = p.shoeS;
    if (b === 'baggy') { R(p.p, L.x - 1, 28, 5, yb - 28); R(shade(p.p, -25), L.x - 1, yb - 1, 5, 1); }
    if (b === 'pleated') R(shade(p.p, 25), L.x + 1, 27, 1, yb - 27);
    if (b === 'ripped') { R(SK, L.x + 1, 30, 1, 1); R('#f4f4f4', L.x, 30, 1, 1); R(SK, L.x, 33 - L.lift, 1, 1); }
    if (b === 'flare') R(p.p, L.x - 1, yb - 3, 5, 3);
    if (b === 'joggers') { R(shade(p.p, -30), L.x, yb - 1, 3, 1); R('#f4f4f4', L.x + 2, 27, 1, yb - 28); }
    if (s === 'loafers') { R('#5a3420', L.sx, yb, 4, 2); R('#2a1a10', L.sx, yb + 2, 4, 1); R('#e8c060', L.sx + 1, yb, 2, 1); }
    if (s === 'chunky') { R('#f4f4f4', L.sx - 1, yb, 5, 2); R('#c8c8d4', L.sx - 1, yb + 2, 5, 1); R(p.f, L.sx + 1, yb + 1, 2, 1); }
    if (s === 'combat') { R('#1a1a22', L.x, yb - 4, 3, 4); R('#8a8a98', L.x + 1, yb - 3, 1, 1); R('#8a8a98', L.x + 1, yb - 1, 1, 1); R('#1a1a22', L.sx, yb, 4, 2); R('#0a0a10', L.sx, yb + 2, 4, 1); }
    if (s === 'maryjane') { R('#f4f4f4', L.x, yb - 2, 3, 2); R('#14141e', L.sx, yb, 4, 2); R('#3a3a48', L.sx + 1, yb, 2, 1); }
    if (s === 'lightup') R(['#ff5a5a', '#5ad0ff', '#ffe14a'][(L.x + L.lift) % 3], L.sx, yb + 2, 4, 1);
    if (s === 'hightop') { R(p.f, L.x, yb - 2, 3, 2); R('#fff', L.sx, yb + 2, 4, 1); R('#fff', L.x + 1, yb - 2, 1, 2); }
  }
};
const _wb = wearBody;
wearBody = (p, v, side, SK) => {
  _wb(p, v, side, SK);
  if (p.skirt && (p.botS === 'plaidskirt' || p.botS === 'tennisskirt')) {
    const x0 = side ? 7 : 6, w = side ? 10 : 12;
    if (p.botS === 'plaidskirt') { for (let i = x0 + 1; i < x0 + w; i += 3) R('#14141e80', i, 25, 1, 5); R('#14141e80', x0, 27, w, 1); R('#b8963a', x0, 28, w, 1); }
    else for (let i = x0 + 1; i < x0 + w; i += 2) R('#d0d0dc', i, 26, 1, 4);
  }
};
// ---- hats, glasses, accessories ----
Object.assign(HATFX, {
  bucket: p => { R(p.hatC, 6, 1, 12, 5); R(p.hatC, 4, 5, 16, 2); R(shade(p.hatC, -30), 4, 6, 16, 1); },
  newsboy: (p, v, s) => { R(p.hatC, 5, 2, 14, 4); R(shade(p.hatC, -25), 5, 5, 14, 1); R(shade(p.hatC, 30), 11, 1, 2, 1); if (v !== 'back') R(shade(p.hatC, -35), s ? 12 : 6, 6, s ? 6 : 12, 1); },
  pearlband: () => { R('#f4f0e8', 6, 5, 12, 1); for (let x = 7; x < 18; x += 2) R('#c8c0b0', x, 5, 1, 1); },
  propeller: p => { R(p.hatC, 5, 2, 14, 5); R('#ffd54a', 5, 4, 14, 1); R('#e84a4a', 11, 0, 2, 2); R('#4a8ae8', 7, 0, 4, 1); R('#4ae86a', 13, 0, 4, 1); },
  fedora: p => { R(p.hatC, 3, 5, 18, 2); R(p.hatC, 7, 1, 10, 4); R('#14141e', 7, 4, 10, 1); R(shade(p.hatC, -25), 11, 1, 2, 1); },
});
Object.assign(GLFX, {
  cateye: (p, s) => { for (const x of s ? [13] : [7, 13]) { R('#14141e', x, 9, 4, 1); R('#8a5a6a', x, 10, 1, 2); R('#8a5a6a', x + 3, 10, 1, 2); R('#8a5a6a', x, 12, 4, 1); } R('#14141e', s ? 16 : 6, 8, 1, 1); if (!s) R('#14141e', 17, 8, 1, 1); },
  shield: (p, s) => { R('#3a3a5a', s ? 13 : 6, 9, s ? 5 : 12, 3); R('#8ae0ff', s ? 14 : 7, 9, s ? 3 : 10, 1); },
  thin: (p, s) => { for (const x of s ? [13] : [7, 13]) R('#c8c8d4', x, 12, 4, 1); if (!s) R('#c8c8d4', 11, 10, 2, 1); },
});
Object.assign(ACCFX, {
  chain: (p, v) => { if (v === 'back') return; R('#c0c0c8', 9, 17, 1, 2); R('#c0c0c8', 14, 17, 1, 2); R('#e8e8f0', 10, 19, 4, 1); R('#ffd54a', 11, 20, 2, 2); },
  pearls: (p, v) => { if (v === 'back') return; R('#f4f0e8', 9, 17, 1, 1); R('#f4f0e8', 10, 18, 4, 1); R('#f4f0e8', 14, 17, 1, 1); },
  studbelt: (p, v, s) => { if (s) { R('#14141e', 8, 26, 8, 1); return; } R('#14141e', 7, 26, 10, 1); for (const x of [8, 10, 13, 15]) R('#d8d8e0', x, 26, 1, 1); if (v !== 'back') R('#d8d8e0', 11, 26, 2, 1); },
  crossbody: (p, v, s) => { if (s) { R(p.accC, 9, 23, 3, 3); return; } for (let i = 0; i < 7; i++) R('#3a3a4a', 8 + i, 17 + i, 1, 1); if (v !== 'back') { R(p.accC, 14, 23, 3, 3); R(shade(p.accC, -30), 14, 25, 3, 1); } },
});
// ---- curated items: fixed colours that suit each style ----
const FIXED = {
  top: [['puffer', 'แจ็คเก็ตพัฟเฟอร์ดำ', 380, '#2a2a34', '#16161e', '#e84a4a'], ['puffer', 'พัฟเฟอร์สีเงิน', 380, '#c8ccd8', '#9a9eb0', '#4a4a5a'],
    ['graphic', 'เสื้อโอเวอร์ไซซ์สกรีนลาย', 180, '#f4f4f4', '#c8c8d4', '#e84a4a'], ['graphic', 'โอเวอร์ไซซ์ดำลายทอง', 180, '#2a2a34', '#16161e', '#f2c84a'],
    ['tracksuit', 'ชุดวอร์มสตรีท', 220, '#3a4ad8', '#2a2aa0', '#ffffff'], ['cableknit', 'สเวตเตอร์ถักเกลียว', 260, '#f0e6d0', '#d4c4a4', '#a08a64'],
    ['sweaterdrape', 'เชิ้ตคลุมไหล่สเวตเตอร์', 320, '#bcd4ec', '#90aed0', '#f0e6d0'], ['blazer', 'เบลเซอร์กรมท่า', 420, '#2a3458', '#1a2040', '#e8c060'],
    ['oxford', 'เชิ้ตอ็อกซ์ฟอร์ด', 200, '#f4f4f4', '#d0d4e0', '#4a7ad8'], ['dino', 'ฮู้ดไดโนเสาร์', 150, '#6ac46a', '#3a8a48', '#f2c84a'],
    ['rainbow', 'เสื้อยืดสายรุ้ง', 100, '#f4f4f4', '#d0d0dc', '#e84a4a'], ['overalls', 'เอี๊ยมยีนส์เด็ก', 160, '#f2c84a', '#c8982a', '#5a84c8'],
    ['bomber', 'แจ็คเก็ตบอมเบอร์', 300, '#5a6a3a', '#3a4a24', '#e8884a'], ['denim', 'แจ็คเก็ตยีนส์', 280, '#5a84c8', '#3a5a98', '#e8c060'],
    ['varsity', 'แจ็คเก็ตวาร์ซิตี้', 340, '#8a2a2e', '#5a1a1e', '#f0e6d0'], ['leather', 'แจ็คเก็ตหนัง', 450, '#24242c', '#121218', '#c0c0c8'],
    ['coat', 'เทรนช์โค้ท', 380, '#c8a878', '#9a7a50', '#6a4a2a'], ['bowling', 'เสื้อโบว์ลิ่งเรโทร', 200, '#e8d8b0', '#c0a880', '#8a2a2e'],
    ['polka', 'เสื้อลายจุด', 160, '#c8402e', '#8a2a1e', '#f4f4f4'], ['flannel', 'เชิ้ตลายสก๊อต', 190, '#b83a2e', '#6a1a14', '#24242c'],
    ['retrostripe', 'เสื้อยืดแถบเรโทร', 140, '#f0e6d0', '#c8b890', '#e8884a'], ['turtleneck', 'เสื้อคอเต่าดำ', 220, '#24242c', '#121218', '#24242c'],
    ['turtleneck', 'เสื้อคอเต่าครีม', 220, '#e8e0d0', '#c8c0b0', '#e8e0d0'], ['linen', 'เชิ้ตลินิน', 210, '#f4f0e8', '#d8d0c0', '#c8b890'],
    ['knitvest', 'เสื้อกั๊กไหมพรม', 230, '#f4f4f4', '#d0d4e0', '#6a7a5a'], ['bandtee', 'เสื้อวงดนตรี', 150, '#1e1e26', '#0e0e14', '#c8402e'],
    ['emohoodie', 'ฮู้ดดี้ลายตาราง', 200, '#1e1e26', '#0e0e14', '#f4f4f4'], ['stripesleeve', 'เสื้อแขนยาวลายทาง', 160, '#1e1e26', '#0e0e14', '#c8402e']],
  bottom: [['baggy', 'ยีนส์ทรงหลวม', 220, '#5a84c8'], ['baggy', 'กางเกงบากี้ดำ', 220, '#2a2a34'], ['pleated', 'กางเกงจีบหน้าสีครีม', 260, '#d8c8a8'],
    ['pleated', 'กางเกงจีบหน้าสีเทา', 260, '#8a8a98'], ['ripped', 'สกินนี่ขาดสีดำ', 180, '#24242c'], ['ripped', 'สกินนี่ขาดสีฟ้า', 180, '#4a6aa8'],
    ['flare', 'กางเกงขาม้า', 200, '#5a84c8'], ['joggers', 'จ็อกเกอร์', 150, '#6a6a78'], ['plaidskirt', 'กระโปรงพลีทลายสก๊อต', 200, '#8a2a2e'],
    ['tennisskirt', 'กระโปรงเทนนิส', 190, '#f4f4f4'], ['shorts', 'ขาสั้นยีนส์', 120, '#5a84c8']],
  shoes: [['loafers', 'โลฟเฟอร์หนัง', 260, '#8a5a3a'], ['chunky', 'สนีกเกอร์พื้นหนา', 320, '#e84a4a'], ['combat', 'บูทคอมแบท', 300, '#3a3a48'],
    ['maryjane', 'รองเท้าแมรี่เจน', 220, '#3a3a48'], ['lightup', 'รองเท้ามีไฟ', 150, '#6a9aff'], ['hightop', 'ผ้าใบหุ้มข้อ', 180, '#ff6a5a'], ['sneakers', 'ผ้าใบขาวมินิมอล', 160, '#ffffff']],
  hat: [['bucket', 'หมวกบักเก็ตดำ', 150, '#24242c'], ['bucket', 'หมวกบักเก็ตครีม', 150, '#e8dcc0'], ['newsboy', 'หมวกนิวส์บอย', 180, '#8a6a4a'],
    ['pearlband', 'ที่คาดผมมุก', 200, '#f4f0e8'], ['propeller', 'หมวกใบพัด', 90, '#4a8ae8'], ['fedora', 'หมวกเฟดอร่า', 240, '#5a4a3a']],
  gl: [['cateye', 'แว่นแคทอาย', 160, '#14141e'], ['shield', 'แว่นชิลด์', 220, '#3a3a5a'], ['thin', 'แว่นไร้กรอบ', 180, '#c8c8d4']],
  acc: [['chain', 'สร้อยโซ่เงิน', 260, '#c0c0c8'], ['pearls', 'สร้อยมุก', 300, '#f4f0e8'], ['studbelt', 'เข็มขัดหมุด', 140, '#14141e'], ['crossbody', 'กระเป๋าคาดตัว', 200, '#d8c8a8']],
};
const FX_ID = {};   // `${style}|${name}` -> item id, so looks can name their pieces
for (const [slot, list] of Object.entries(FIXED)) list.forEach(([style, n, price, c, C, a], k) => {
  const id = `${slot}:${style}:x${k}`; WITEM[id] = { id, slot, style, n, price, c, C: C || shade(c, -30), a: a || shade(c, 30) }; WLIST[slot].unshift(id); FX_ID[n] = id;
});
for (const s of ['puffer', 'graphic', 'tracksuit', 'cableknit', 'sweaterdrape', 'blazer', 'oxford', 'dino', 'rainbow', 'bomber', 'denim', 'varsity', 'leather', 'bowling', 'polka', 'flannel', 'retrostripe', 'turtleneck', 'linen', 'knitvest', 'bandtee', 'emohoodie', 'stripesleeve']) TOPKEYS.push(s);
HATKEYS.push('bucket', 'newsboy', 'fedora'); GLKEYS.push('cateye', 'thin');
// skirts from the new items need the skirt flag so bare legs show under them
const _wp = wearPal; wearPal = () => { const o = _wp(); if (SKIRT_B.includes(o.botS)) o.skirt = 1; return o; };
// ---- ready-made looks ----
const LOOKS = [
  { id: 'drip', n: '💧 สายดริป', m: ['แจ็คเก็ตพัฟเฟอร์ดำ', 'ยีนส์ทรงหลวม', 'สนีกเกอร์พื้นหนา', 'หมวกบักเก็ตดำ', 'สร้อยโซ่เงิน'], f: ['เสื้อโอเวอร์ไซซ์สกรีนลาย', 'กางเกงบากี้ดำ', 'สนีกเกอร์พื้นหนา', 'แว่นชิลด์', 'สร้อยโซ่เงิน'], hair: { m: 'wolf', f: 'highpony' } },
  { id: 'oldmoney', n: '🎩 โอลด์มันนี่', m: ['เชิ้ตคลุมไหล่สเวตเตอร์', 'กางเกงจีบหน้าสีครีม', 'โลฟเฟอร์หนัง'], f: ['สเวตเตอร์ถักเกลียว', 'กระโปรงเทนนิส', 'โลฟเฟอร์หนัง', 'ที่คาดผมมุก', 'สร้อยมุก'], hair: { m: 'oldmoney', f: 'halfup' } },
  { id: 'kid', n: '🧸 สไตล์เด็กน่ารัก', m: ['ฮู้ดไดโนเสาร์', 'จ็อกเกอร์', 'รองเท้ามีไฟ', 'หมวกใบพัด'], f: ['เสื้อยืดสายรุ้ง', 'ขาสั้นยีนส์', 'รองเท้ามีไฟ'], hair: { m: 'bowl', f: 'spacebuns' } },
  { id: 'jacket', n: '🧥 สายแจ็คเก็ต', m: ['แจ็คเก็ตวาร์ซิตี้', 'กางเกงบากี้ดำ', 'ผ้าใบหุ้มข้อ'], f: ['แจ็คเก็ตหนัง', 'สกินนี่ขาดสีดำ', 'บูทคอมแบท'], hair: { m: 'twoblock', f: 'wolf' } },
  { id: 'vintage', n: '📻 วินเทจ', m: ['เสื้อโบว์ลิ่งเรโทร', 'กางเกงขาม้า', 'โลฟเฟอร์หนัง', 'หมวกนิวส์บอย'], f: ['เสื้อลายจุด', 'กางเกงขาม้า', 'รองเท้าแมรี่เจน', 'แว่นแคทอาย'], hair: { m: 'sidepart', f: 'curlybob' } },
  { id: 'minimal', n: '🤍 มินิมอล', m: ['เสื้อคอเต่าดำ', 'กางเกงจีบหน้าสีเทา', 'ผ้าใบขาวมินิมอล', 'กระเป๋าคาดตัว'], f: ['เชิ้ตลินิน', 'กางเกงจีบหน้าสีครีม', 'ผ้าใบขาวมินิมอล', 'กระเป๋าคาดตัว', 'แว่นไร้กรอบ'], hair: { m: 'curtain', f: 'midlong' } },
  { id: 'emo', n: '🖤 อีโม', m: ['เสื้อวงดนตรี', 'สกินนี่ขาดสีดำ', 'บูทคอมแบท', 'เข็มขัดหมุด'], f: ['เสื้อแขนยาวลายทาง', 'กระโปรงพลีทลายสก๊อต', 'บูทคอมแบท', 'เข็มขัดหมุด'], hair: { m: 'emo', f: 'emo' } },
];
const lookIds = (L, g) => L[g === 'f' ? 'f' : 'm'].map(n => FX_ID[n]);
const lookPrice = ids => Math.round(ids.reduce((a, id) => a + WITEM[id].price, 0) * .85);
const wearLook = (L, g) => { const w = {}; for (const id of lookIds(L, g)) w[WITEM[id].slot] = id; w.hair = L.hair[g === 'f' ? 'f' : 'm']; return w; };
function lookPreview(L) {
  const keep = st.wear; st.wear = { ...wearLook(L, st.look.g), dye: keep?.dye }; const c = outline(charCanvas(playerPal(), 'front', 0)); st.wear = keep;
  c.style.cssText = 'width:24px;height:40px;image-rendering:pixelated'; return c;
}
function lookRows(shop) {
  const g = st.look.g, w = wearOf();
  return LOOKS.map(L => {
    const ids = lookIds(L, g), hairId = 'hair:' + L.hair[g === 'f' ? 'f' : 'm'], miss = ids.filter(id => !owned(id)), price = lookPrice(miss.length ? miss : []), on = ids.every(id => w[WITEM[id].slot] === id);
    const put = () => { Object.assign(w, wearLook(L, g)); (st.owned || (st.owned = {}))[hairId] = 1; dressPlayer(); refreshPanel(); save(); };
    const act = miss.length ? (shop ? btn(`ซื้อทั้งชุด ฿${price}`, () => { if (st.money < price) return say('เงินไม่พอ'); st.money -= price; for (const id of miss) (st.owned || (st.owned = {}))[id] = 1; put(); say('ได้ลุคใหม่แล้ว! (ลด 15% เมื่อซื้อทั้งชุด)'); }, st.money < price) : el('span', { className: 'sub' }, 'ยังไม่ครบชุด'))
      : btn(on ? 'ใส่อยู่' : 'ใส่ทั้งชุด', put, on);
    return row(lookPreview(L), L.n, ids.map(id => WITEM[id].n).join(' · '), act);
  });
}
// ---- townsfolk wear unique outfits drawn from every wardrobe category ----
// Deterministic per-person picks; a shared signature table means no two NPCs wear the
// same full outfit until their demographic pool is exhausted (in practice: never).
const nwKey = (p, k) => p.id != null ? 'id:' + p.id : 'npc:' + k;
const nwGroup = p => p.age != null && p.age < 13 ? (p.g === 'f' ? 'girl' : 'boy')
  : p.age != null && p.age >= 60 ? (p.g === 'f' ? 'elderF' : 'elderM') : (p.g === 'f' ? 'woman' : 'man');
const NW_TOP = ['tee', 'tank', 'hoodie', 'stripes', 'jacket', 'suit', 'dress', 'sweater', 'vest', 'overalls', 'polo', 'jersey', 'coat', 'pajamas', 'cardigan', 'raincoat', 'kimono', 'uniform', 'tux', 'dino',
  'puffer', 'graphic', 'tracksuit', 'cableknit', 'sweaterdrape', 'blazer', 'oxford', 'rainbow', 'bomber', 'denim', 'varsity', 'leather', 'bowling', 'polka', 'flannel', 'retrostripe', 'turtleneck', 'linen', 'knitvest', 'bandtee', 'emohoodie', 'stripesleeve'];
const NW_BOT = ['jeans', 'shorts', 'skirt', 'longskirt', 'cargo', 'leggings', 'slacks', 'baggy', 'pleated', 'ripped', 'flare', 'joggers', 'plaidskirt', 'tennisskirt'];
const NW_SHOE = ['sneakers', 'boots', 'sandals', 'heels', 'slippers', 'plain', 'loafers', 'chunky', 'combat', 'maryjane', 'lightup', 'hightop'];
const NW_HAT = ['cap', 'beanie', 'sunhat', 'beret', 'crown', 'catears', 'party', 'helmet', 'headband', 'wizard', 'bow', 'flowers', 'bucket', 'newsboy', 'pearlband', 'propeller', 'fedora'];
const NW_GL = ['round', 'square', 'sun', 'heart', 'monocle', 'vr', 'cateye', 'shield', 'thin'];
const NW_ACC = ['scarf', 'necklace', 'bowtie', 'backpack', 'headphones', 'mask', 'wings', 'earrings', 'cape', 'chain', 'pearls', 'studbelt', 'crossbody'];
const nwNo = (a, ...drop) => { const d = new Set(drop); return a.filter(x => !d.has(x)); };
const NW_SKIRT = new Set(['skirt', 'plaidskirt', 'tennisskirt']);
const NW_CFG = {
  boy: { top: nwNo(NW_TOP, 'dress'), bottom: nwNo(NW_BOT, 'skirt', 'longskirt', 'plaidskirt', 'tennisskirt'), shoes: nwNo(NW_SHOE, 'heels', 'maryjane'), hat: NW_HAT, gl: NW_GL, acc: NW_ACC },
  girl: { top: NW_TOP, bottom: NW_BOT, shoes: nwNo(NW_SHOE, 'heels'), hat: NW_HAT, gl: NW_GL, acc: NW_ACC },
  man: { top: nwNo(NW_TOP, 'dress'), bottom: nwNo(NW_BOT, 'skirt', 'longskirt', 'plaidskirt', 'tennisskirt'), shoes: nwNo(NW_SHOE, 'heels', 'maryjane'), hat: NW_HAT, gl: NW_GL, acc: NW_ACC },
  woman: { top: NW_TOP, bottom: NW_BOT, shoes: NW_SHOE, hat: NW_HAT, gl: NW_GL, acc: NW_ACC },
  elderM: { top: nwNo(NW_TOP, 'dress', 'tracksuit', 'bandtee', 'emohoodie', 'rainbow'), bottom: nwNo(NW_BOT, 'skirt', 'longskirt', 'plaidskirt', 'tennisskirt', 'ripped'), shoes: nwNo(NW_SHOE, 'heels', 'maryjane', 'combat'), hat: NW_HAT, gl: NW_GL, acc: NW_ACC },
  elderF: { top: nwNo(NW_TOP, 'tracksuit', 'bandtee', 'emohoodie', 'rainbow'), bottom: nwNo(NW_BOT, 'ripped'), shoes: NW_SHOE, hat: NW_HAT, gl: NW_GL, acc: NW_ACC },
};
const NW_SLOTS = ['top', 'bottom', 'shoes', 'hat', 'gl', 'acc'];
const NW_POOL = {}, NW_ORDER = {}, NW_POS = {}, NW_CACHE = new Map(), NW_USED = new Set(), NW_USED_CORE = new Set();
const nwHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const nwRng = seed => { let s = seed >>> 0 || 0x9e3779b9; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; };
function nwPool(group, slot) {
  const key = group + '|' + slot; if (NW_POOL[key]) return NW_POOL[key];
  const styles = new Set(NW_CFG[group][slot]);
  let ids = WLIST[slot].filter(id => styles.has(WITEM[id].style));
  if (!ids.length) ids = WLIST[slot].slice();
  return NW_POOL[key] = ids;
}
function nwOrder(group, slot) {
  const key = group + '|' + slot;
  if (!NW_ORDER[key]) {
    const a = nwPool(group, slot).slice(), r = nwRng(nwHash(key));
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    NW_ORDER[key] = a; NW_POS[key] = 0;
  }
  return NW_ORDER[key];
}
const nwDraw = (group, slot, attempt) => { const a = nwOrder(group, slot); return a[(NW_POS[group + '|' + slot] + attempt) % a.length]; };
const nwWears = (p, k, slot) => nwRng(nwHash(nwKey(p, k) + '|' + slot))() < ({ hat: .62, gl: .34, acc: .58 }[slot] || 0);
function nwCandidate(p, k, group, attempt) {
  const w = {};
  for (const slot of NW_SLOTS) w[slot] = (slot === 'top' || slot === 'bottom' || slot === 'shoes' || nwWears(p, k, slot)) ? nwDraw(group, slot, attempt) : null;
  return w;
}
const nwSig = w => NW_SLOTS.map(s => w[s] || '-').join('|');
const nwCore = w => [w.top, w.bottom, w.shoes].map(s => s || '-').join('|');
function nwHair(p, k) {
  const hs = HAIRSTYLES[Math.floor(nwRng(nwHash(nwKey(p, k) + '|hair'))() * HAIRSTYLES.length)];
  return { hx: hs.hx || '', style: hs.style, clip: p.g === 'f' && nwRng(nwHash(nwKey(p, k) + '|clip'))() < .28 ? 1 : 0 };
}
function nwPalette(p, k, w) {
  const o = {}, it = id => id && WITEM[id];
  const t = it(w.top), b = it(w.bottom), s = it(w.shoes), h = it(w.hat), g = it(w.gl), a = it(w.acc);
  if (t) Object.assign(o, { topS: t.style, c: t.c, C: t.C, a: t.a });
  if (b) Object.assign(o, { botS: b.style, p: b.c, skirt: NW_SKIRT.has(b.style) ? 1 : 0 }); else o.skirt = 0;
  if (s) Object.assign(o, { shoeS: s.style, f: shade(s.c, -40) });
  if (h) Object.assign(o, { hatS: h.style, hatC: h.c });
  if (g) o.glS = g.style;
  if (a) Object.assign(o, { accS: a.style, accC: a.c });
  if (t && p.pal && p.pal.h && p.pal.H && p.pal.L && _cdist(p.pal.h, t.c) < 45) {   // hair + top nearly the same colour: nudge the hair so the layers still read
    const d = _lum(t.c) < 110 ? 35 : -35;
    Object.assign(o, { h: _shiftHex(p.pal.h, d), H: _shiftHex(p.pal.H, d), L: _shiftHex(p.pal.L, d) });
  }
  return Object.assign(o, nwHair(p, k));
}
function npcWear(p, k) {
  const group = nwGroup(p), key = nwKey(p, k) + '|' + group;
  if (NW_CACHE.has(key)) return NW_CACHE.get(key);
  let w = null, sig = '', core = '';
  const accept = (c, advance) => {
    w = c; sig = nwSig(c); core = nwCore(c);
    for (const slot of NW_SLOTS) if (c[slot]) { const sk = group + '|' + slot; NW_POS[sk] = (NW_POS[sk] + advance) % NW_ORDER[sk].length; }
  };
  for (let attempt = 0; attempt < 512; attempt++) {
    const c = nwCandidate(p, k, group, attempt);              // prefer a fresh full outfit and fresh core clothes
    if (NW_USED.has(nwSig(c)) || NW_USED_CORE.has(nwCore(c))) continue;
    accept(c, attempt + 1); break;
  }
  if (!w) for (let attempt = 0; attempt < 512; attempt++) {   // core combinations ran out: keep outfits distinct via extras
    const c = nwCandidate(p, k, group, attempt);
    if (NW_USED.has(nwSig(c))) continue;
    accept(c, attempt + 1); break;
  }
  if (!w) accept(nwCandidate(p, k, group, 0), 1);              // every combination worn: allow a repeat
  const o = nwPalette(p, k, w);
  NW_CACHE.set(key, o); NW_USED.add(sig); NW_USED_CORE.add(core);
  return o;
}
console.assert(LOOKS.every(L => [...lookIds(L, 'm'), ...lookIds(L, 'f')].every(id => WITEM[id]) && HX[L.hair.m] && HX[L.hair.f]), 'every look piece exists');
console.assert(Object.values(WITEM).every(i => i.slot !== 'top' || i.style === 'tee' || TOPFX[i.style]), 'every top is drawable');
