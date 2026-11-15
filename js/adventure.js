'use strict';
// The mine: procedurally generated cave floors, ores and gems to mine, monsters to fight in real time, a blacksmith, and elevators every 5 floors.
Object.assign(ITEMS, {
  gel: { n: 'เจลสไลม์', ic: '🟢', k: 'loot', sell: 12 }, wing: { n: 'ปีกค้างคาว', ic: '🦇', k: 'loot', sell: 18 }, fang: { n: 'เขี้ยวกอบลิน', ic: '🦷', k: 'loot', sell: 40 }, essence: { n: 'วิญญาณผี', ic: '👻', k: 'loot', sell: 90 },
  coal: { n: 'ถ่านหิน', ic: '⚫', k: 'ore', sell: 8 }, copper: { n: 'แร่ทองแดง', ic: '🟤', k: 'ore', sell: 15 }, iron: { n: 'แร่เหล็ก', ic: '⚪', k: 'ore', sell: 30 }, silver: { n: 'แร่เงิน', ic: '🔘', k: 'ore', sell: 60 }, goldore: { n: 'แร่ทอง', ic: '🟡', k: 'ore', sell: 120 },
  ruby: { n: 'ทับทิม', ic: '🔴', k: 'gem', sell: 200, wing: 'gem' }, sapphire: { n: 'แซฟไฟร์', ic: '🔵', k: 'gem', sell: 220, wing: 'gem' }, emerald: { n: 'มรกต', ic: '🟩', k: 'gem', sell: 260, wing: 'gem' }, diamond: { n: 'เพชร', ic: '💎', k: 'gem', sell: 500, wing: 'gem' },
  potion: { n: 'ยาฟื้นพลัง', p: 50, ic: '🧪', k: 'tool' },
  slimecrown: { n: 'มงกุฎราชาสไลม์', ic: '👑', k: 'gem', sell: 400, wing: 'gem' }, golemcore: { n: 'แกนโกเลม', ic: '🪨', k: 'gem', sell: 900, wing: 'gem' }, mineheart: { n: 'หัวใจเหมือง', ic: '💜', k: 'quest', sell: 3000 },
});
const BOSSES = {
  10: { n: 'ราชาสไลม์', col: '#3f9a46', hp: 260, dmg: 12, sp: 26, drop: 'slimecrown' },
  20: { n: 'โกเลมหินผา', col: '#8a8a9a', hp: 520, dmg: 18, sp: 20, drop: 'golemcore' },
  30: { n: 'ราชาแห่งเหมือง', col: '#b48aff', hp: 900, dmg: 26, sp: 24, drop: 'mineheart' },
};
WINGS.gem = ['💎 อัญมณี', ['ruby', 'sapphire', 'emerald', 'diamond']];
const MW = 30, MH = 20, mine = makeScene(MW, MH); mine.name = 'เหมือง'; mine.bg = '#14101c';
const ENTRANCE = { x: 4 * T + 16, y: 22 * T + 16 };
const gear = () => st.gear || (st.gear = { sword: 0, armor: 0, pick: 0, deep: 1, kills: 0 });
const maxHp = () => 100 + lv('fit') * 6 + gear().armor * 15 + (gear().heart ? 20 : 0);
const SWORDS = [['ดาบไม้', 8], ['ดาบทองแดง', 12], ['ดาบเหล็ก', 18], ['ดาบเงิน', 26], ['ดาบทอง', 38]];
const BOSS_MAX = 30;
let floorNo = 1, swingCd = 0, swingT = 0, hurtT = 0, hp = 100, ore = {}, stairs = null, exitP = null;
const ORES = [['coal', 0, 40, '#2a2a32'], ['copper', 0, 30, '#c87a3a'], ['iron', 3, 22, '#d8dce8'], ['silver', 6, 14, '#b0b8d0'], ['goldore', 9, 8, '#ffd54a'], ['ruby', 5, 4, '#ff4a6a'], ['sapphire', 5, 4, '#4a8aff'], ['emerald', 7, 3, '#4aff8a'], ['diamond', 10, 2, '#a0f0ff']];
const MONS = [['slime', 0, 24, 5, 26, '#5ac85a', 'gel'], ['bat', 2, 14, 4, 52, '#6a4a8a', 'wing'], ['goblin', 4, 42, 9, 34, '#6a9a3a', 'fang'], ['ghost', 8, 55, 12, 40, '#c8d0ff', 'essence']];
function genFloor(f) {
  floorNo = Math.max(1, Math.min(BOSS_MAX, f)); f = floorNo;
  mine.solid.fill(1); mine.statics = []; mine.ents = []; ore = {};
  const carve = (cx, cy, r = 1) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const x = cx + i, y = cy + j; if (x > 0 && y > 0 && x < MW - 1 && y < MH - 1) mine.solid[y * MW + x] = 0; } };
  let x = 2, y = MH >> 1; carve(x, y); const start = { x, y }; let last = start;
  for (let k = 0; k < 5; k++) { const tx = 4 + (rnd() * (MW - 8) | 0), ty = 3 + (rnd() * (MH - 6) | 0); while (x !== tx || y !== ty) { if (rnd() < .6) x += Math.sign(tx - x); else y += Math.sign(ty - y); if (rnd() < .15) y += rnd() < .5 ? -1 : 1; x = Math.max(2, Math.min(MW - 3, x)); y = Math.max(2, Math.min(MH - 3, y)); carve(x, y); } last = { x, y }; }
  exitP = { x: start.x * T + 16, y: start.y * T + 24 }; stairs = { x: last.x * T + 16, y: last.y * T + 24 };
  const boss = f === BOSS_MAX && gear().cleared ? null : BOSSES[f];
  if (boss) carve(last.x, last.y, 3);            // wide arena for the floor boss
  const floorTiles = []; for (let j = 1; j < MH - 1; j++) for (let i = 1; i < MW - 1; i++) if (!mine.solid[j * MW + i]) floorTiles.push([i, j]);
  const pool = ORES.filter(o => f >= o[1]), tot = pool.reduce((a, o) => a + o[2], 0);
  for (let j = 1; j < MH - 1; j++) for (let i = 1; i < MW - 1; i++) if (mine.solid[j * MW + i] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !mine.solid[(j + dy) * MW + i + dx]) && rnd() < .09) {
    let r = rnd() * tot, o = pool[0]; for (const p of pool) if ((r -= p[2]) < 0) { o = p; break; } ore[j * MW + i] = { id: o[0], col: o[3], hits: 2 + (o[1] > 4 ? 2 : 0), i, j };
  }
  const mpool = MONS.filter(m => f >= m[1]);
  for (let k = 0; k < 3 + f && floorTiles.length; k++) { const [i, j] = floorTiles[rnd() * floorTiles.length | 0]; if (Math.hypot(i - start.x, j - start.y) < 7) continue; if (boss && Math.hypot(i - last.x, j - last.y) < 7) continue; const m = mpool[rnd() * mpool.length | 0]; mine.ents.push({ mon: m[0], x: i * T + 16, y: j * T + 24, hp: m[2] + f * 2, max: m[2] + f * 2, dmg: m[3] + (f >> 1), sp: m[4], col: m[5], drop: m[6], dir: 0, frame: 0, at: 0, cd: 0, t: 0 }); }
  if (boss) mine.ents.push({ boss: 1, floor: f, name: boss.n, x: last.x * T + 16, y: (last.y - 2) * T + 24, hp: boss.hp, max: boss.hp, dmg: boss.dmg, sp: boss.sp, col: boss.col, drop: boss.drop, dir: 0, frame: 0, at: 0, cd: 0, t: 0 });
  mine.ground = onCanvas(mk(MW * T, MH * T), () => {
    for (let j = 0; j < MH; j++) for (let i = 0; i < MW; i++) {
      const s = mine.solid[j * MW + i], X = i * T, Y = j * T; R(s ? '#2f2a3a' : '#5d5468', X, Y, T, T);
      for (let k = 0; k < 6; k++) R(s ? '#3a3448' : '#6a6074', X + (rnd() * 28 | 0), Y + (rnd() * 28 | 0), 3, 2);
      if (s && j + 1 < MH && !mine.solid[(j + 1) * MW + i]) { R('#4a4258', X, Y + 26, T, 6); R('#1a1622', X, Y + 31, T, 1); }
    }
  });
  for (const k in ore) { const o = ore[k]; mine.statics.push({ k: o.j * T + 30, o, f: () => { const X = o.i * T, Y = o.j * T; R('#3a3448', X, Y, T, T); for (const [dx, dy, w] of [[6, 8, 7], [16, 5, 6], [12, 17, 8], [22, 14, 6]]) { R(o.col, X + dx, Y + dy, w, w - 1); R('#ffffff70', X + dx, Y + dy, 2, 2); } } }); }
  mine.statics.push({ k: stairs.y, f: () => { R('#0a0810', stairs.x - 14, stairs.y - 18, 28, 20); for (let s = 0; s < 4; s++) R(['#6a6074', '#5a5064', '#4a4054', '#3a3044'][s], stairs.x - 14 + s * 2, stairs.y - 18 + s * 5, 28 - s * 4, 5); } },
    { k: exitP.y, f: () => { R('#8a5a34', exitP.x - 8, exitP.y - 30, 3, 30); R('#8a5a34', exitP.x + 5, exitP.y - 30, 3, 30); for (let y = exitP.y - 26; y < exitP.y; y += 7) R('#a8703e', exitP.x - 8, y, 16, 2); } });
}
function enterMine(f) {
  f = Math.max(1, Math.min(BOSS_MAX, f | 0)); genFloor(f); hp = Math.min(hp || 1, maxHp()); gear().deep = Math.max(gear().deep, f); st.hp = hp;
  fade(() => { enter(mine, exitP.x + 20, exitP.y, 3); if (f > 1) toast(`⛏️ เหมืองชั้น ${f}`); if (BOSSES[f] && !(f === BOSS_MAX && gear().cleared)) toast(`👑 ${BOSSES[f].n} เฝ้าทางลงอยู่!`); }, 400);
}
const outMine = () => fade(() => { enter(town, ENTRANCE.x + 20, ENTRANCE.y + 8, 0); }, 400);
// ---- combat & mining ----
const swordDmg = () => SWORDS[gear().sword][1] + lv('fit');
function bossDefeated(m) {
  const B = BOSSES[m.floor]; if (!B) return;
  const G = gear(); G.bossKills = G.bossKills || {};
  const first = !G.bossKills[m.floor]; G.bossKills[m.floor] = 1;
  xp('fit', 60); fx({ mood: 30 });
  if (!first) { toast(`👑 ปราบ ${B.n} อีกครั้ง`); return; }
  addItem(B.drop); const prize = { 10: 300, 20: 800, 30: 3000 }[m.floor] || 0; st.money += prize;
  toast(`👑 ปราบ ${B.n}! ได้ ${ITEMS[B.drop].ic} ${ITEMS[B.drop].n} + ฿${prize}`); save();
  if (m.floor >= BOSS_MAX) mineClear();
  else say(`${B.n} พ่ายแพ้! ทางลงชั้น ${m.floor + 1} เปิดแล้ว`);
}
function mineClear() {
  const G = gear(); if (G.cleared) return outMine();
  G.cleared = 1; G.clearDay = day(); G.heart = 1; hp = maxHp(); st.hp = hp; st.money += 5000;
  toast('🏆 พิชิตเหมืองครบ 30 ชั้น!'); say('คุณคือวีรบุรุษแห่งเหมือง! ได้หัวใจเหมือง พลังชีวิตสูงสุด +20 และเงินรางวัล ฿5,000');
  save(); fade(() => enter(town, ENTRANCE.x + 20, ENTRANCE.y + 8, 0), 1400);
}
function swing() {
  if (swingCd > 0 || busy) return; swingCd = .4; swingT = .18; const dx = [0, 0, -1, 1][player.dir], dy = [1, -1, 0, 0][player.dir], hx = player.x + dx * 22, hy = player.y - 8 + dy * 22;
  if (Math.hypot(player.x - stairs.x, player.y - stairs.y) < 28) { const guard = mine.ents.find(e => e.boss); if (guard) return say(`👑 ต้องปราบ ${guard.name} ก่อน`); return floorNo >= BOSS_MAX ? mineClear() : enterMine(floorNo + 1); }
  if (Math.hypot(player.x - exitP.x, player.y - exitP.y) < 28) return outMine();
  let hit = false;
  for (const m of mine.ents) if (Math.hypot(m.x - hx, m.y - 8 - hy) < (m.boss ? 40 : 30)) { m.hp -= swordDmg(); m.kx = dx * (m.boss ? 24 : 140); m.ky = dy * (m.boss ? 24 : 140); hit = true; sfx('hit'); if (m.hp <= 0) { m.dead = 1; gear().kills++; if (m.boss) bossDefeated(m); else { if (Math.random() < .6) addItem(m.drop); float(`+${ITEMS[m.drop].ic}`, '#fff'); xp('fit', 6); } } }
  mine.ents = mine.ents.filter(m => !m.dead);
  if (hit) return;
  const tx = Math.floor(hx / T), ty = Math.floor(hy / T), o = ore[ty * MW + tx];
  if (o) { st.energy = Math.max(0, st.energy - .6); o.hits -= 1 + gear().pick; sfx('hit'); if (o.hits <= 0) { delete ore[ty * MW + tx]; mine.solid[ty * MW + tx] = 0; mine.statics = mine.statics.filter(s => s.o !== o); addItem(o.id); if (Math.random() < .3 && gear().pick > 1) addItem(o.id); float(`+${ITEMS[o.id].ic}`, '#fff'); xp('fit', 3); } }
}
const _interact = interact; interact = () => scene === mine ? swing() : _interact();
function mineUpdate(dt) {
  swingCd -= dt; swingT -= dt; hurtT -= dt; if (hp < maxHp() && Math.random() < dt * .05) hp++;
  for (const m of mine.ents) {
    const d = Math.hypot(player.x - m.x, player.y - m.y); m.cd -= dt;
    if (m.kx || m.ky) { move(mine, m, m.kx * dt, m.ky * dt); m.kx *= m.boss ? .9 : .85; m.ky *= m.boss ? .9 : .85; if (Math.abs(m.kx) + Math.abs(m.ky) < 8) m.kx = m.ky = 0; }
    else if (d < (m.boss ? 240 : 140)) { const sp = m.sp * dt * (m.mon === 'bat' ? 1 + Math.sin(now() / 120) * .6 : 1); move(mine, m, (player.x - m.x) / d * sp, 0); move(mine, m, 0, (player.y - m.y) / d * sp); m.dir = Math.abs(player.x - m.x) > Math.abs(player.y - m.y) ? (player.x < m.x ? 2 : 3) : 0; m.at += dt; }
    if (d < (m.boss ? 32 : 20) && m.cd <= 0) { m.cd = m.boss ? 1.1 : 1; const dmg = Math.max(1, m.dmg - gear().armor * 2); hp -= dmg; hurtT = .3; sfx('bad'); float(`-${dmg}`, '#ff6a6a'); if (hp < maxHp() * .3 && have('potion')) { addItem('potion', -1); hp = Math.min(maxHp(), hp + 60); toast('🧪 ดื่มยาฟื้นพลังแล้ว'); } }
  }
  st.hp = hp; if (hp <= 0) { hp = Math.round(maxHp() * .5); st.money = Math.max(0, st.money - 60); st.energy = Math.min(st.energy, 30); fade(() => { enter(town, ENTRANCE.x + 20, ENTRANCE.y + 8, 0); toast('💫 คุณหมดสติในเหมืองและถูกหามออกมา เสียเงิน ฿60'); }, 600); }
}
const _update12 = update; update = dt => { _update12(dt); if (scene === mine && !busy) mineUpdate(dt); };
// ---- drawing ----
const _drawEnt12 = drawEnt;
function drawBoss(e) {
  const x = Math.round(e.x), y = Math.round(e.y), t = now() / 1000 + e.x / 40, wob = Math.round(Math.sin(t * 2.4) * 2);
  disc(x, y, 20, '#0005', .5);
  if (e.floor === 10) {                              // slime king
    disc(x, y - 14 + wob, 18, e.col, .95); disc(x, y - 21 + wob, 12, '#7ee07e');
    R('#1a3a1a', x - 8, y - 21 + wob, 4, 4); R('#1a3a1a', x + 4, y - 21 + wob, 4, 4); R('#2a4a2a', x - 3, y - 12 + wob, 7, 2);
    R('#ffd54a', x - 12, y - 36 + wob, 24, 5); R('#ffe08a', x - 12, y - 42 + wob, 4, 7); R('#ffe08a', x - 2, y - 44 + wob, 4, 9); R('#ffe08a', x + 8, y - 42 + wob, 4, 7); R('#ff4a6a', x - 1, y - 38 + wob, 3, 2);
  } else if (e.floor === 20) {                       // stone golem
    R('#4a4a5a', x - 16, y - 16, 32, 16); R(e.col, x - 14, y - 38, 28, 24); R('#6a6a7a', x - 19, y - 34, 6, 18); R('#6a6a7a', x + 13, y - 34, 6, 18);
    R('#4a4a5a', x - 10, y - 42, 20, 4); R('#ffd54a', x - 8, y - 32, 5, 4); R('#ffd54a', x + 3, y - 32, 5, 4);
    R('#8a8aff', x - 5, y - 23, 10, 8); R('#d8d8ff', x - 2, y - 21, 4, 4); R('#3a3a4a', x - 12, y - 14, 24, 3);
    for (let k = 0; k < 3; k++) R('#6a6a7a', x - 12 + k * 10, y - 38 + (k % 2) * 3, 5, 3);
  } else {                                           // king of the mine
    R('#2a1a4a', x - 16, y - 18, 32, 18); R('#3a2a5a', x - 14, y - 42, 28, 28); R('#c8a0ff', x - 10, y - 46, 20, 5);
    R('#ffd54a', x - 12, y - 54, 24, 5); R('#ffe08a', x - 12, y - 60, 4, 7); R('#ffe08a', x - 2, y - 62, 4, 9); R('#ffe08a', x + 8, y - 60, 4, 7);
    R('#ff5a8a', x - 8, y - 36, 4, 4); R('#ff5a8a', x + 4, y - 36, 4, 4);
    R('#b48aff', x - 5, y - 24, 10, 10); R('#f0e0ff', x - 2, y - 21, 4, 4);
    R('#8a5a34', x + 18, y - 34, 3, 26); R('#c8d0e0', x + 12, y - 36, 9, 4); R('#c8d0e0', x + 18, y - 40, 4, 8);
  }
  const bw = e.floor === 30 ? 56 : 46;
  R('#000a', x - bw / 2 - 1, y - (e.floor === 30 ? 70 : 56), bw + 2, 5);
  R('#e84a4a', x - bw / 2, y - (e.floor === 30 ? 69 : 55), Math.max(0, Math.round(bw * e.hp / e.max)), 3);
}
drawEnt = e => {
  if (e.boss) { drawBoss(e); return; }
  if (e.mon) {
    const x = Math.round(e.x), y = Math.round(e.y), w = Math.round(Math.abs(Math.sin(now() / 220 + x)) * 2); disc(x, y, 8, '#0004', .4);
    if (e.mon === 'bat') { R(e.col, x - 6, y - 18 + w, 12, 7); R(e.col, x - 14, y - 20 - w, 8, 4); R(e.col, x + 6, y - 20 - w, 8, 4); R('#ff4a4a', x - 3, y - 16 + w, 2, 2); R('#ff4a4a', x + 2, y - 16 + w, 2, 2); }
    else if (e.mon === 'ghost') { disc(x, y - 16, 8, e.col + 'cc'); R(e.col + 'cc', x - 8, y - 16, 16, 10); R('#2a2a40', x - 4, y - 18, 3, 4); R('#2a2a40', x + 2, y - 18, 3, 4); }
    else if (e.mon === 'goblin') { R(e.col, x - 6, y - 22, 12, 12); R(e.col, x - 9, y - 20, 3, 5); R(e.col, x + 6, y - 20, 3, 5); R('#c8402e', x - 4, y - 18, 2, 2); R('#c8402e', x + 2, y - 18, 2, 2); R('#5a3a22', x - 5, y - 10, 10, 8); R('#8a8a98', x + 7, y - 16, 2, 10); }
    else { disc(x, y - 7, 8, e.col, .8); R('#fff8', x - 4, y - 12, 3, 2); R('#2a3a2a', x - 3, y - 8, 2, 2); R('#2a3a2a', x + 2, y - 8, 2, 2); }
    if (e.hp < e.max) { R('#000a', x - 10, y - 28, 20, 3); R('#e84a4a', x - 10, y - 28, Math.max(0, Math.round(20 * e.hp / e.max)), 3); } return;
  }
  _drawEnt12(e);
  if (e === player && scene === mine && swingT > 0) { const dx = [0, 0, -1, 1][player.dir], dy = [1, -1, 0, 0][player.dir], x = Math.round(e.x), y = Math.round(e.y) - 10; for (let k = -2; k <= 2; k++) R('#fff', x + dx * 18 + (dy ? k * 4 : 0), y + dy * 18 + (dx ? k * 4 : 0), 4, 4); if (hurtT > 0) R('#ff000050', x - 10, y - 16, 20, 30); }
};
const _ov12 = overlayFx;
overlayFx = sc => {
  _ov12(sc); if (sc !== mine) return; g = ctx; ctx.setTransform(1, 0, 0, 1, 0, 0);
  const gr = ctx.createRadialGradient(VW / 2, VH / 2, 40, VW / 2, VH / 2, Math.max(VW, VH) * .55); gr.addColorStop(0, 'rgba(10,8,20,0)'); gr.addColorStop(1, 'rgba(10,8,20,.85)'); ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
  const w = 120; R('#000a', VW / 2 - w / 2 - 2, 8, w + 4, 10); R('#e84a4a', VW / 2 - w / 2, 10, Math.max(0, Math.round(w * hp / maxHp())), 6); ptext(`F${floorNo}`, VW / 2 - 4, 22, '#ffe08a', 1);
  const boss = mine.ents.find(e => e.boss);
  if (boss) {
    const bw = Math.min(360, VW - 300), bx = VW - 16 - bw, by = 34, cx = bx + bw / 2;
    ctx.save(); ctx.textAlign = 'center'; ctx.font = '600 14px Mitr,"Leelawadee UI",sans-serif';
    ctx.lineWidth = 3; ctx.strokeStyle = '#2a1020'; ctx.fillStyle = '#ffe0e8';
    const label = `👑 ${boss.name}  ${Math.max(0, Math.ceil(boss.hp))}/${boss.max}`;
    ctx.strokeText(label, cx, by); ctx.fillText(label, cx, by); ctx.restore();
    R('#000a', bx - 2, by + 5, bw + 4, 12); R('#5a1020', bx, by + 7, bw, 8);
    R('#ff5a6a', bx, by + 7, Math.max(0, Math.round(bw * boss.hp / boss.max)), 8); R('#ffffff40', bx, by + 7, Math.max(0, Math.round(bw * boss.hp / boss.max)), 2);
  }
};
const _save12 = save; save = () => { if (scene === mine && player) { const px = player.x, py = player.y; scene = town; player.x = ENTRANCE.x + 20; player.y = ENTRANCE.y + 8; _save12(); scene = mine; player.x = px; player.y = py; } else _save12(); };
// ---- entrance + blacksmith ----
town.statics.push({ k: 21 * T + 20, f() { const X = 4 * T, Y = 21 * T; R('#5a5a64', X - 2, Y + 4, 36, 30); R('#7a7a84', X - 2, Y + 4, 36, 3); R('#0a0810', X + 6, Y + 12, 20, 22); R('#8a5a34', X + 4, Y + 10, 3, 24); R('#8a5a34', X + 25, Y + 10, 3, 24); R('#8a5a34', X + 4, Y + 8, 24, 4); } });
const GEARUP = { sword: [['copper', 5, 200], ['iron', 5, 400], ['silver', 5, 800], ['goldore', 5, 1500]], armor: [['copper', 4, 150], ['iron', 4, 350], ['silver', 4, 700], ['goldore', 4, 1300]], pick: [['copper', 3, 150], ['iron', 3, 350], ['silver', 3, 700]] };
const upgrade = k => () => { const G = gear(), lvl = G[k], need = GEARUP[k][lvl]; if (!need) return say('อัปเกรดสูงสุดแล้ว!'); const [id, n, cost] = need; if (have(id) < n || st.money < cost) return say(`ต้องใช้ ${n}× ${ITEMS[id].n} และ ฿${cost}`); addItem(id, -n); st.money -= cost; G[k]++; toast(`🔨 อัปเกรด${{ sword: SWORDS[G.sword]?.[0], armor: `เกราะ เลเวล ${G.armor}`, pick: `อีเต้อ เลเวล ${G.pick}` }[k]} สำเร็จ!`); };
town.targets.push({ x: ENTRANCE.x, y: ENTRANCE.y, name: 'ทางเข้าเหมือง', get opts() {
  const G = gear(), o = [[`ลงเหมือง (ชั้น 1)`, () => { if (age() < 14) return say('ต้องอายุ 14 ปีขึ้นไปจึงจะลงเหมืองได้'); if (st.energy < 25) return say('เหนื่อยเกินไปสำหรับการลงเหมือง'); hp = maxHp(); enterMine(1); }]];
  for (let f = 5; f <= G.deep; f += 5) o.push([`ลิฟต์ไปชั้น ${f} 🛗`, () => { if (st.energy < 25) return say('เหนื่อยเกินไป'); hp = maxHp(); enterMine(f); }]);
  o.push([`⚔️ ดาบ: ${SWORDS[G.sword][0]} (พลังโจมตี ${SWORDS[G.sword][1]}) → ${GEARUP.sword[G.sword] ? `${GEARUP.sword[G.sword][1]}× ${ITEMS[GEARUP.sword[G.sword][0]].n} ฿${GEARUP.sword[G.sword][2]}` : 'สูงสุด'}`, upgrade('sword')],
    [`🛡️ เกราะ เลเวล ${G.armor} → ${GEARUP.armor[G.armor] ? `${GEARUP.armor[G.armor][1]}× ${ITEMS[GEARUP.armor[G.armor][0]].n} ฿${GEARUP.armor[G.armor][2]}` : 'สูงสุด'}`, upgrade('armor')],
    [`⛏️ อีเต้อ เลเวล ${G.pick} → ${GEARUP.pick[G.pick] ? `${GEARUP.pick[G.pick][1]}× ${ITEMS[GEARUP.pick[G.pick][0]].n} ฿${GEARUP.pick[G.pick][2]}` : 'สูงสุด'}`, upgrade('pick')],
    ['🧪 ยาฟื้นพลัง ฿50', () => { if (st.money < 50) return say('เงินไม่พอ'); st.money -= 50; addItem('potion'); say('ใส่ยาฟื้นพลังในกระเป๋าแล้ว (ดื่มอัตโนมัติเมื่อพลังใกล้หมด)'); }]);
  if (G.cleared) o.push(['🏆 เหมืองถูกพิชิตแล้ว', () => say('คุณพิชิตเหมืองครบ 30 ชั้นแล้ว! ราชาแห่งเหมืองพ่ายแพ้ และหัวใจเหมืองเป็นของคุณ')]);
  return o;
} });
ACH.push(['miner', '⛏️ นักขุดแร่', 'ลงเหมืองถึงชั้น 5', () => (st.gear?.deep || 0) >= 5], ['deep', '🕳️ นักสำรวจใต้ดิน', 'ลงเหมืองถึงชั้น 10', () => (st.gear?.deep || 0) >= 10], ['slayer', '⚔️ ผู้ปราบมอนสเตอร์', 'กำจัดมอนสเตอร์ 50 ตัว', () => (st.gear?.kills || 0) >= 50],
  ['boss10', '👑 ผู้ปราบราชาสไลม์', 'เอาชนะราชาสไลม์ชั้น 10', () => !!st.gear?.bossKills?.[10]], ['boss20', '🗿 ผู้ทลายโกเลม', 'เอาชนะโกเลมหินผาชั้น 20', () => !!st.gear?.bossKills?.[20]], ['minehero', '💜 วีรบุรุษเหมือง', 'พิชิตเหมืองครบ 30 ชั้น', () => !!st.gear?.cleared]);
console.assert(ORES.every(o => ITEMS[o[0]]) && MONS.every(m => ITEMS[m[6]]), 'mine items exist');
console.assert(!blocked(town, ENTRANCE.x, ENTRANCE.y), 'mine entrance reachable');
