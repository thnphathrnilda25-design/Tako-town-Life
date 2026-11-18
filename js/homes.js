'use strict';
// Neighbours and their homes. Knock on a door, walk in, meet whoever is home, and browse the
// whole town's relationships in the phone's new "ความสัมพันธ์" app.

const NROOM_W = 10, NROOM_H = 8;
const nRoom = makeScene(NROOM_W, NROOM_H);
nRoom.bg = '#241c30'; nRoom.name = 'บ้านเพื่อนบ้าน';
let visit = null;

const homeResidents = bi => people.filter(p => p.home === bi && !p.fam && !st.gone?.[p.id]);
const homeLead = bi => {
  const rs = homeResidents(bi), adults = rs.filter(p => (p.age || 0) >= 25 && (p.age || 0) < 60);
  return (adults.length ? adults : rs).slice().sort((a, b) => (b.age || 0) - (a.age || 0))[0];
};
const isAtHome = p => !!p && !!p.hidden && (p.slot === 'in' || p.slot === 'home') && (p.insideB === undefined || p.insideB === p.home);
const homeStatus = bi => { const rs = homeResidents(bi); return { rs, ins: rs.filter(isAtHome) }; };
function homeLabel(bi) {
  const b = BUILDINGS[bi] || BUILDINGS[0], rs = homeResidents(bi), lead = homeLead(bi);
  return b.n || (lead ? `บ้านของ ${lead.n}` : rs.length ? `บ้านของ ${rs[0].n}` : 'บ้านว่าง');
}
const nRoomDoor = () => ({ x: nRoom.W / 2 * T, y: (nRoom.H - 1) * T + 22 });
const visitEnts = () => visit ? visit.ents : [];

const TRAIT_TH = { cheerful: 'ร่าเริง', shy: 'ขี้อาย', grumpy: 'ขี้บ่น', smart: 'ฉลาด', lazy: 'ขี้เกียจ', kind: 'ใจดี' };
const relScore = p => st.rel[p.id]?.f || 0;
const relBucket = id => {
  if (isKin(id)) return 'fam';
  if (st.partner === id || st.spouse === id) return 'love';
  return relScore({ id }) >= 40 ? 'friend' : 'other';
};
const relIcon = p => p.fam === 'spouse' ? '💕' : p.fam ? '👪' : p.age < 13 ? '🧒' : p.age >= 60 ? '🧓' : '🙂';

function roomLayout(bi, rs) {
  const lead = homeLead(bi) || rs[0] || {};
  const out = [['rug', 3, 4], [lead.role === 'shopkeeper' ? 'bed2' : 'bed1', 7, 5], ['shelf1', 1, 2],
    ['tv1', 3, 2], ['sofa1', 4, 5], ['plant', 9, 3], ['lamp', 6, 3]];
  if (lead.role === 'freelance') out.push(['pc1', 1, 5]);
  else if (lead.trait === 'shy') out.push(['easel', 1, 5]);
  else if (lead.trait === 'cheerful') out.push(['teddy', 9, 5]);
  else if (lead.trait === 'kind') out.push(['fern', 9, 2]);
  else if (lead.trait === 'grumpy') out.push(['cactus', 9, 5]);
  else if (lead.trait === 'smart') out.push(['shelf1', 8, 2]);
  return out;
}
function drawNpcRoomBg(bi) {
  const W = nRoom.W * T, H = nRoom.H * T;
  R('#5a3a2a', -6, -6, W + 12, H + 12);
  R('#c89058', 0, 2 * T, W, H - 2 * T);
  for (let y = 2 * T; y < H; y += 8) { R('#b07a48', 0, y, W, 1); for (let x = ((y / 8) % 2) * 24; x < W; x += 48) R('#b07a48', x, y, 1, 8); }
  for (let i = 0; i < 60; i++) R('#d49a62', rnd() * W | 0, 2 * T + (rnd() * (H - 2 * T) | 0), 3, 1);
  const wall = ['#f2dcc4', '#e8d8c0', '#d8e8d0', '#e8d0d8', '#d8e0f2'][Math.max(0, bi) % 5];
  R(wall, 0, 0, W, 2 * T);
  for (let x = 0; x < W; x += 8) R(shade(wall, -10), x, 0, 3, 2 * T);
  R('#8a5a34', 0, 2 * T - 6, W, 6); R('#a87048', 0, 2 * T - 6, W, 1);
  drawWallWindow(W - 4 * T + 6, 10, 52, 36);
  const accent = { cheerful: '#e8a04a', shy: '#8a7ac8', grumpy: '#8a4a5a', smart: '#5a7ab0', lazy: '#9a8a5a', kind: '#5a9a6a' }[homeLead(bi)?.trait] || '#5a7ab0';
  R('#3a2a22', 20, 18, 34, 28); R(accent, 23, 21, 28, 22); R('#f4e8c8', 28, 26, 18, 3); R('#f4e8c8', 28, 32, 12, 3);
  R('#3a2a22', 64, 22, 28, 22); R(accent, 67, 25, 22, 16); R('#2a1a2e', 74, 31, 8, 8);
  const dm = (nRoom.W / 2 - 1) * T;
  R('#8a6a4a', dm + 4, (nRoom.H - 1) * T + 16, 56, 14);
  for (let x = dm + 8; x < dm + 60; x += 6) R('#6a4a34', x, (nRoom.H - 1) * T + 18, 2, 10);
}
function buildNpcRoom(bi, rs) {
  Object.assign(nRoom, { W: NROOM_W, H: NROOM_H, tile: new Uint8Array(NROOM_W * NROOM_H), solid: new Uint8Array(NROOM_W * NROOM_H), statics: [], targets: [], lamps: [] });
  setSolid(nRoom, 0, 0, NROOM_W, 2);
  for (const [id, x, y] of roomLayout(bi, rs)) {
    const F = FURN[id], X = x * T, base = (y + F.h) * T;
    if (F.floor) { nRoom.statics.push({ k: -1e6 + y, f: () => DRAW[F.d](X, base, F) }); continue; }
    setSolid(nRoom, x, y, F.w, F.h);
    nRoom.statics.push({ k: base, f: () => DRAW[F.d](X, base, F) });
    if (F.d === 'lamp') nRoom.lamps.push({ id, x, y });
  }
  const d = nRoomDoor();
  nRoom.targets.push({ x: d.x, y: d.y, name: 'ประตูบ้าน', opts: [['ออกจากบ้าน', () => leaveNpcHome()]] });
  nRoom.targets.push({ x: 5 * T, y: 6 * T + 12, name: 'โซฟา', opts: [['🛋️ นั่งพัก 30 นาที', () => {
    fx({ energy: 10, mood: 6 }); tick(30); say('นั่งเล่นในบ้านอุ่น ๆ กลิ่นไม้และแสงไฟนุ่ม ๆ');
  }]] });
  nRoom.targets.push({ x: 4 * T, y: 3 * T + 12, name: 'ทีวี', get opts() {
    const host = visit?.ents[0];
    return [['📺 ดูทีวีด้วยกัน 1 ชม.', () => {
      fx({ mood: 12, energy: -4 }); tick(60);
      say(host ? `ดูรายการโปรดกับ${host.n} หัวเราะกันเบา ๆ 📺` : 'เปิดทีวีดูคนเดียว เงียบดีนะ');
    }]];
  } });
  nRoom.name = homeLabel(bi);
  nRoom.drawBg = () => drawNpcRoomBg(bi);
}

function enterNpcHome(bi) {
  const { rs, ins } = homeStatus(bi);
  if (!rs.length) return say('บ้านนี้ว่างอยู่ ไม่มีใครอาศัยแล้ว');
  if (!ins.length) {
    const names = rs.slice(0, 3).map(p => p.n).join(', ');
    return say(`ยังไม่มีใครอยู่บ้าน — ${names}${rs.length > 3 ? ` และอีก ${rs.length - 3} คน` : ''} ออกไปข้างนอก ลองมาใหม่ตอนเย็น`);
  }
  buildNpcRoom(bi, rs);
  for (const p of ins) p.visiting = bi;                    // residents stay in while you are inside
  const V = st.homesVisited || (st.homesVisited = []), first = !V.includes(bi);
  if (first) V.push(bi);
  const spots = [[3, 4], [6, 4], [5, 6], [2, 3], [8, 3], [4, 6]];
  visit = { home: bi, name: homeLabel(bi), ents: ins.slice(0, 4).map((p, i) => ({
    id: p.id, n: p.n, p, spr: p.spr, k: p.k, person: 1, get age() { return p.age; },
    x: spots[i][0] * T + 16, y: spots[i][1] * T + 24, dir: 0, frame: 0, at: 0, vx: 0, vy: 0, t: 0,
  })) };
  fade(() => { const d = nRoomDoor(); enter(nRoom, d.x, d.y - 10, 1); toast(`🏠 ${visit.name} · มี ${ins.length} คนอยู่บ้าน${first ? ' · ครั้งแรก!' : ''}`); });
}
function clearVisit() {
  if (visit) for (const p of people) if (p.visiting) p.visiting = false;
  visit = null;
}
function leaveNpcHome() {
  const bi = visit?.home;
  const b = BUILDINGS[bi] || BUILDINGS[0];
  fade(() => enter(town, b.ix, b.iy + 4, 0));
}
// any exit from a visited room (door, fainting, menu teleport) must unfreeze the residents
const _enterVisit = enter;
enter = (sc, x, y, dir) => {
  if (typeof nRoom !== 'undefined' && scene === nRoom && sc !== nRoom) clearVisit();
  _enterVisit(sc, x, y, dir);
};
function updateVisit(dt) {
  if (!visit) return;
  for (const e of visit.ents) {
    if (e.p.talking) { animate(e, false, dt); e.dir = faceTo(e, player); }
    else wander(nRoom, e, 22, dt);
  }
}
function visitOpts(p) {
  const r = relOf(p.id);
  return [['🏠 ชมบ้าน', () => {
    if (r.homePraise === day()) return say(`${p.n}: "ขอบคุณอีกครั้งนะ!"`);
    r.homePraise = day(); r.f = Math.min(100, r.f + 3); fx({ mood: 8 }); tick(10);
    say(`${p.n} ดีใจที่คุณชอบบ้านของเขา 💕 (ความสนิท +3)`);
  }], ['👪 ถามเรื่องครอบครัว', () => {
    const mates = homeResidents(p.home).filter(q => q.id !== p.id);
    const mate = p.mate ? people.find(q => q.id === p.mate) : null;
    say(`${p.n}: "${mates.length ? `อยู่กับ ${mates.slice(0, 3).map(q => q.n).join(', ')}` : 'อยู่คนเดียว'}${mate ? ` · คนรู้ใจคือ ${mate.n}` : ''}"`);
  }], ...personOpts(p)];
}

// ---- home doors in town ----
for (const bi of HOMES) {
  const b = BUILDINGS[bi];
  town.targets.push({ x: b.ix, y: b.iy + 4, get name() { return `🏠 ${homeLabel(bi)}`; }, get opts() {
    const { rs, ins } = homeStatus(bi);
    if (!rs.length) return [['ดูบ้าน', () => say('บ้านนี้ว่างอยู่')]];
    return [['🚪 เยี่ยมบ้าน', () => enterNpcHome(bi)],
      ['👀 ดูว่าใครอยู่', () => openPanel(`🏠 ${homeLabel(bi)}`, () => [
        el('div', { className: 'sub' }, ins.length ? `อยู่บ้าน ${ins.length} คน` : 'ยังไม่มีใครอยู่บ้าน — ลองมาใหม่ตอนเย็น'),
        row('👥', 'สมาชิก', rs.slice(0, 6).map(p => p.n).join(', ')),
        ...rs.map(p => row(relIcon(p), p.n, `${relName(p.id, relOf(p.id).f)} · ${isAtHome(p) ? 'อยู่บ้าน' : 'ออกไปข้างนอก'}`, btn('โปรไฟล์', () => {
          phonePanel(); pApp = 'rel'; pRel = p.id; refreshPanel();
        }))),
      ])]];
  } });
}

// ---- phone app: town relationships ----
let pRel = null, pRelFilter = 'all';
const REL_FILTERS = [['all', 'ทั้งหมด'], ['fam', 'ครอบครัว'], ['friend', 'เพื่อน'], ['love', 'คนรู้ใจ'], ['other', 'คนรู้จัก']];
const townPeople = () => [...people].filter((p, i, a) => !p.fam || p.fam === 'spouse' || p.id === 'dad' || p.id === 'mom')
  .filter((p, i, a) => a.findIndex(q => q.id === p.id) === i).filter(p => !st.gone?.[p.id]);
const relHome = p => p.fam ? 'บ้านของคุณ' : homeLabel(p.home);
function relProfileView(id) {
  const p = people.find(q => q.id === id);
  const backRel = btn('◀ ความสัมพันธ์', () => { pRel = null; pApp = 'rel'; refreshPanel(); });
  if (!p) return [backRel, el('div', { className: 'sub' }, 'ไม่พบข้อมูลคนนี้')];
  const r = relOf(id), mates = p.fam ? [] : homeResidents(p.home).filter(q => q.id !== id), mate = p.mate && people.find(q => q.id === p.mate);
  const lead = p.fam ? null : homeLead(p.home), mateList = mates.length ? mates.slice(0, 4).map(q => q.n).join(', ') + (mates.length > 4 ? ` และอีก ${mates.length - 4} คน` : '') : '';
  const isContact = contacts().some(c => c.id === id);
  return [backRel,
    row(relIcon(p), `${p.n}${p.id === st.partner ? ' 💕' : ''}`, `${sexFull(p.g)} · ${p.age} ปี · ${p.fam ? 'ครอบครัว' : ROLE_NAME[p.role] || 'ชาวเมือง'} · ${TRAIT_TH[p.trait] || p.trait}`),
    el('div', { className: 'sub' }, `ความสนิท: ${relName(id, r.f)} (${Math.round(r.f || 0)}/100)`),
    row('🏠', relHome(p), p.fam ? 'คุณอยู่ด้วยกัน' : `สมาชิกในบ้าน ${homeResidents(p.home).length} คน`),
    lead && lead.id !== p.id ? row('⭐', 'หัวหน้าบ้าน', lead.n) : null,
    mates.length ? row('👥', 'อยู่บ้านเดียวกับ', mateList) : null,
    mate ? row('💕', 'คนรู้ใจ', mate.n) : null,
    row('🎁', 'ของที่ชอบ', [...(p.love || []), ...(p.like || [])].slice(0, 5).map(i => `${ITEMS[i]?.ic || ''}${ITEMS[i]?.n || i}`).join(' · ') || '—'),
    row('💬', 'ความสัมพันธ์', `คุย ${r.talk || 0} ครั้ง · ให้ของขวัญ ${r.gift || 0} ชิ้น`),
    row('📱', 'การติดต่อ', isContact ? 'มีเบอร์แล้ว · ส่งข้อความได้' : 'ยังไม่มีเบอร์ · สนิท 20+ เพื่อแลกเบอร์'),
    el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap' },
      btn('📨 ส่งข้อความ', () => { if (!isContact) return say('ยังไม่ได้เบอร์โทร — ต้องสนิท 20+'); pChat = id; pApp = 'msg'; pRel = null; refreshPanel(); }, !isContact),
      btn('📌 ปักหมุดบ้าน', () => { ph().pin = id; toast(`📌 ปักหมุด ${relHome(p)} แล้ว`); refreshPanel(); }, !!p.fam),
      btn('🗺️ ดูในแผนที่', () => { pApp = 'map'; pRel = null; refreshPanel(); })),
  ];
}
APP.rel = () => {
  if (pRel) return relProfileView(pRel);
  const list = townPeople().sort((a, b) => relScore(b) - relScore(a));
  const cnt = { fam: 0, friend: 0, love: 0, other: 0 };
  for (const p of list) cnt[relBucket(p.id)] = (cnt[relBucket(p.id)] || 0) + 1;
  const family = [st.parents && `👨 ${st.parents.dad.n}`, st.parents && `👩 ${st.parents.mom.n}`,
    st.spouse && people.find(p => p.id === st.spouse) && `💕 ${people.find(p => p.id === st.spouse).n}`,
    ...(st.kids || []).map(k => `🧒 ${k.n}`)].filter(Boolean);
  return [
    el('div', { className: 'sub' }, 'ความสัมพันธ์ในเมือง — กดชื่อเพื่อดูโปรไฟล์และปักหมุดบ้าน'),
    row('🏡', 'ครอบครัวของคุณ', family.length ? family.join(' · ') : 'อยู่คนเดียว'),
    el('div', { className: 'tabs' }, ...REL_FILTERS.map(([k, n]) =>
      el('button', { className: pRelFilter === k ? 'on' : '', textContent: `${n} ${k === 'all' ? list.length : cnt[k] || 0}`, onclick: () => { pRelFilter = k; refreshPanel(); } }))),
    ...list.filter(p => pRelFilter === 'all' || relBucket(p.id) === pRelFilter).map(p => row(relIcon(p),
      `${p.n}${p.fam === 'spouse' ? ' 💕' : ''}`,
      `${relName(p.id, relScore(p))} · ${sexWord(p.g)} · ${p.fam ? 'ครอบครัว' : ROLE_NAME[p.role] || 'ชาวเมือง'} · ${relHome(p)}`,
      btn('ดู', () => { pRel = p.id; refreshPanel(); }))),
  ];
};
APPS.push(['rel', '💞', 'ความสัมพันธ์']);

// pinned home on the map
const _mapAppHome = APP.map;
APP.map = () => {
  const out = _mapAppHome();
  const c = out[0], pin = ph().pin, p = pin && people.find(q => q.id === pin);
  if (c && p && !p.fam) {
    const x = c.getContext('2d'), b = BUILDINGS[p.home], px = b.x * 4 + b.w * 2 - 2, py = b.y * 4 - 2;
    x.fillStyle = '#ff7ab8';
    x.fillRect(px, py + 2, 2, 2); x.fillRect(px + 3, py + 2, 2, 2); x.fillRect(px, py + 4, 5, 2); x.fillRect(px + 1, py + 6, 3, 1); x.fillRect(px + 2, py + 7, 1, 1);
    out.push(el('div', { className: 'sub' }, `📌 ปักหมุด: ${homeLabel(p.home)} (${p.n})`));
  } else if (c && pin) out.push(el('div', { className: 'sub' }, '📌 ปักหมุดบ้านไว้แล้ว'));
  return out;
};

console.assert(typeof homeLabel(HOMES[0]) === 'string', 'home labels resolve');
ACH.push(['neighbor5', '🏠 เพื่อนบ้านที่ดี', `เยี่ยมบ้านเพื่อนบ้านครบ ${HOMES.length} หลัง`, () => (st.homesVisited || []).length >= HOMES.length]);
