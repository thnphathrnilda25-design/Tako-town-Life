'use strict';
// NPC depth: trust, weighted memories, secrets, grudges and crushes.
// Loaded after npclife so it can extend the existing memory/social systems without replacing them.
// Trust is separate from friendship (rel.f): favours and kept promises raise it; broken promises,
// leaked secrets and violence lower it. Secrets leak through friends, grudges change where NPCs go,
// and the relationship profile shows the history behind both. Old saves get lazy defaults.

// ---- constants --------------------------------------------------------------------------------------
const ND_SECRET_KINDS = ['debt', 'fear', 'dream', 'crush', 'family', 'mistake', 'lonely'];
const ND_AVOID = {
  plaza: ['library', 'park'], park: ['home', 'pond'], cafe: ['park', 'library'], library: ['home', 'cafe'],
  pond: ['home', 'park'], mart: ['plaza', 'home'], furni: ['cafe', 'park'], cinema: ['park', 'plaza'],
  flower: ['park', 'cafe'], gym: ['home', 'park'],
};
const ND_MEM_W = {
  gift: 0, favor: 2, theft: 2, insult: 1, slap: 2, push: 1, argue: 1, sorry: 1, secret: 4, leak: 4,
  kept: 3, meet: 2, miss: 2, date: 2, confess: 3, broke: 3, reconcile: 2, heard: 1,
};
const ND_TRUST_OF_MEM = {
  gift: v => v > 0 ? 2 : -4, favor: () => 9, insult: () => -9, theft: () => -18,
  hug: v => v > 0 ? 2 : -4, high5: () => 1, hold: v => v > 0 ? 1 : -3, kiss: v => v > 0 ? 4 : -16,
  comfort: () => 2, cry: v => v > 0 ? 1 : 0, tickle: v => v > 0 ? 1 : -3, dance: () => 1,
  snack: () => 2, eat: () => 2, walk: () => 1, prank: v => v > 0 ? 1 : -4,
  argue: () => -5, push: () => -9, slap: () => -17, sorry: () => 5,
  date: () => 4, confess: () => 10, leak: () => -18, kept: () => 6, reconcile: () => 5,
};
const ND_TRUST_WHY = {
  gift: 'ของขวัญ', favor: 'ช่วยเหลือ', insult: 'คำด่า', theft: 'ขโมย', slap: 'ทำร้าย', push: 'ผลัก',
  argue: 'ทะเลาะ', sorry: 'คำขอโทษ', hug: 'กอด', kiss: 'จูบ', date: 'เดท', confess: 'ความรัก',
  leak: 'ความลับรั่ว', kept: 'เก็บความลับ', reconcile: 'คืนดี', prank: 'แกล้ง', tickle: 'จั๊กจี้',
};

const NDS = () => st.npcSecret || (st.npcSecret = {});
const NDG = () => st.npcGrudge || (st.npcGrudge = {});
const NDC = () => st.npcCrush || (st.npcCrush = {});
const ND = { g: null };   // transient per-NPC grudge lookup, rebuilt when grudges change

// ---- trust -------------------------------------------------------------------------------------------
function ndTrustOf(p) {
  if (!p) return 0;
  const T = st.npcTrust || (st.npcTrust = {});
  let v = T[p.id];
  if (v == null) {
    const f = st.rel?.[p.id]?.f || 0;
    v = 20 + Math.round(f * .45 + hash01(p.k * 61 + 7) * 12);
    T[p.id] = Math.max(15, Math.min(85, v));
  }
  return T[p.id];
}
function ndTrustAdj(p, d, why) {
  if (!p || p.fam || st.gone?.[p.id] || !d) return ndTrustOf(p);
  const T = st.npcTrust || (st.npcTrust = {});
  const before = ndTrustOf(p), after = Math.max(0, Math.min(100, before + d));
  T[p.id] = after;
  if (after === before) return after;
  const cross = (before < 50 && after >= 50) || (before >= 50 && after < 50);
  if (Math.abs(d) >= 10 || cross) toast(`🤝 ${p.n}: ${d > 0 ? 'ไว้ใจคุณมากขึ้น' : 'เริ่มระแวงคุณ'}${why ? ` (${why})` : ''}`);
  return after;
}
const ndTrustLabel = v => v >= 80 ? 'ไว้ใจสุด ๆ' : v >= 60 ? 'ไว้ใจ' : v >= 40 ? 'เริ่มไว้ใจ' : v >= 25 ? 'ยังไม่สนิทใจ' : 'ระแวง';

// ---- weighted memories ------------------------------------------------------------------------------
const ndWeight = (kind, v) => Math.max(1, Math.min(9, Math.round(1 + Math.abs(v || 0) * 1.6 + (ND_MEM_W[kind] || 0))));
const ndMemories = p => (MEM()[p.id] || []).filter(m => m.d < day() && day() - m.d <= YEAR * 2);
const ndAllMemories = p => (MEM()[p.id] || []).filter(m => day() - m.d <= YEAR * 2);   // profile includes today
const ndSalience = m => {
  const age = Math.max(0, day() - m.d);
  return (m.w || ndWeight(m.k, m.v)) * Math.max(.18, 1 - age / (YEAR * 1.6));
};
const ndTopMemory = p => {
  const L = ndMemories(p);
  return L.length ? L.slice().sort((a, b) => ndSalience(b) - ndSalience(a))[0] : null;
};
function ndMemoryText(p, m) {
  if (m.k === 'heard') return [`ได้ยินมาว่า${m.t}… จริงเหรอ?`, m.v < 0 ? 'angry' : 'happy'];
  if (m.k === 'leak') return ['ยังจำได้นะ ที่เธอเอาความลับของฉันไปบอกคนอื่น', 'angry'];
  if (m.k === 'secret') return [`ขอบคุณที่รับฟังความลับของฉันเมื่อ${daysAgo(m.d)}นะ`, 'happy'];
  if (m.k === 'kept') return ['ขอบคุณที่เก็บความลับให้ฉันมาตลอดเลย', 'happy'];
  if (m.k === 'promise') return ['เธอเคยสัญญาว่าจะเก็บความลับให้ฉันนะ', 'neutral'];
  if (m.k === 'meet') return [`ดีใจที่เธอมาหาฉันตามนัดเมื่อ${daysAgo(m.d)}`, 'happy'];
  if (m.k === 'miss') return [`ยังเสียใจอยู่นะ ที่เธอไม่มาหาฉันเมื่อ${daysAgo(m.d)}`, 'sad'];
  if (m.k === 'date') return [`ยังคิดถึงวันที่เราไปเที่ยวด้วยกันเมื่อ${daysAgo(m.d)}อยู่เลย`, 'happy'];
  if (m.k === 'confess') return ['จำวันนั้นได้ไหม ที่เราเริ่มคบกัน…', 'happy'];
  if (m.k === 'reconcile') return [`ขอบคุณที่ช่วยให้ฉันคืนดีกับเพื่อนเมื่อ${daysAgo(m.d)}`, 'happy'];
  return m.v < 0 ? [`ยังจำได้นะ ที่เธอ${m.t}เมื่อ${daysAgo(m.d)}`, 'angry'] : [`ยังจำตอนที่เรา${m.t}เมื่อ${daysAgo(m.d)}ได้เลย 😊`, 'happy'];
}

// ---- secrets -----------------------------------------------------------------------------------------
function ndCrushOf(p) {
  const C = NDC(), c = C[p.id];
  if (!c) return null;
  if (c.to === 'player') {
    if (p.fam || st.gone?.[p.id] || p.mate || loveOf(p)) { delete C[p.id]; return null; }
    return c;
  }
  const q = people.find(x => x.id === c.to);
  if (!q || q.fam || q.mate || st.gone?.[q.id] || loveOf(p)) { delete C[p.id]; return null; }
  return c;
}
function ndSecretText(p, k) {
  const c = ndCrushOf(p), cn = c ? (c.to === 'player' ? 'คุณ' : nameOf(c.to)) : null;
  switch (k) {
    case 'debt': return `ฉันติดหนี้อยู่ ฿${(p.k % 6 + 3) * 500} แต่ไม่กล้าให้ใครรู้`;
    case 'fear': return ['จริง ๆ แล้วฉันกลัวการอยู่คนเดียวมาก', 'ฉันกลัวว่าสักวันคนจะลืมฉัน', 'ฉันกลัวความมืดจนนอนไม่หลับ'][p.k % 3];
    case 'dream': return `ฉันอยาก${dreamOf(p)} แต่ไม่กล้าบอกใคร`;
    case 'crush': return cn ? `ฉันแอบชอบ${cn}อยู่ ไม่รู้จะทำยังไง` : 'ฉันแอบชอบใครบางคนในเมืองนี้ แต่ไม่กล้าบอก';
    case 'family': return 'ที่บ้านมีเรื่องไม่สบายใจ ฉันไม่กล้าเล่าให้ใครฟัง';
    case 'mistake': return 'เมื่อก่อนฉันเคยทำเรื่องผิดพลาดครั้งใหญ่ และยังให้อภัยตัวเองไม่ได้';
    case 'lonely': return 'บางทีฉันก็เหงามาก ทั้งที่อยู่ท่ามกลางผู้คน';
    default: return 'ฉันมีเรื่องในใจที่ยังไม่กล้าบอกใคร';
  }
}
function ndSecretOf(p) {
  if (!p || p.fam || st.gone?.[p.id]) return null;
  const S = NDS();
  let s = S[p.id];
  if (!s) {
    const k = ND_SECRET_KINDS[Math.floor(hash01(p.k * 53 + 17) * ND_SECRET_KINDS.length)];
    s = S[p.id] = { k, t: ndSecretText(p, k), d: day(), told: 0, promise: 0, leaked: 0, found: 0, kept: 0, spread: 0, known: [], via: null, leakDay: 0, foundDay: 0 };
  }
  if (s.k === 'crush' && !s.told) s.t = ndSecretText(p, 'crush');
  return s;
}
function ndKnownSecrets() {
  const out = [];
  for (const [id, s] of Object.entries(NDS())) {
    if (!s.told || s.leaked || s.found) continue;
    const owner = people.find(p => p.id === id && !p.fam && !st.gone?.[id]);
    if (owner) out.push([id, s]);
  }
  return out.sort((a, b) => (b[1].told || 0) - (a[1].told || 0));
}
function ndTellSecret(p, s) {
  s.told = day();
  ndTrustAdj(p, 5, 'รับฟังความลับ');
  remember(p.id, 'secret', 2, 'รับฟังความลับ');
  lastV = 1;
  toast(`🤫 ${p.n} ไว้ใจคุณพอจะเล่าความลับ`);
  line(`${p.n}: "${s.t} …ช่วยเก็บเป็นความลับนะ"`, 'sad', () => cont(p));
}
function ndPromise(p, s) {
  s.promise = day();
  ndTrustAdj(p, 3, 'ให้สัญญา');
  remember(p.id, 'promise', 1, 'สัญญาจะเก็บความลับ');
  line(`${p.n}: "ขอบคุณนะ ฉันจะจำคำสัญญาของเธอไว้"`, 'happy', () => cont(p));
}
function ndLeakSecret(listener, ownerId, s) {
  const owner = people.find(q => q.id === ownerId);
  if (!owner) return;
  s.leaked = day(); s.leakDay = day(); s.via = listener.id;
  s.known = [...new Set([...(s.known || []), listener.id])];
  s.foundDay = day() + 1 + (hash01(owner.k * 13 + day() * 7) < .5 ? 0 : 1);
  const ro = relOf(owner.id); ro.f = Math.max(0, ro.f - 12); ro.h = Math.min(100, (ro.h || 0) + 12);
  if (s.promise) remember(owner.id, 'broke', -3, 'ผิดสัญญาเรื่องความลับ');
  remember(owner.id, 'leak', -3, 'เอาความลับของฉันไปบอกคนอื่น');
  relOf(listener.id).f = Math.min(100, relOf(listener.id).f + 3);
  townNews(`🗣️ ความลับของ ${owner.n} เริ่มแพร่กระจายในเมือง`);
  lastV = -1;
  line(`${listener.n}: "จริงเหรอ? …วางใจได้ ฉันไม่บอกใครหรอก"`, 'neutral', () => cont(listener));
}
function ndSecretDaily() {
  const d = day();
  for (const [id, s] of Object.entries(NDS())) {
    if (!s.told) continue;
    const owner = people.find(p => p.id === id && !p.fam && !st.gone?.[id]);
    if (!owner) continue;
    if (!s.leaked && !s.kept && !s.found && d - s.told >= 7) {
      s.kept = 1;
      remember(owner.id, 'kept', 2, 'เก็บความลับให้');
      push(owner.id, { t: 'in', kind: 'chat', replied: true, text: 'ขอบคุณที่เก็บความลับให้ฉันนะ 🤫' });
    }
    if (!s.leaked || s.found) continue;
    const via = people.find(p => p.id === s.via && !p.fam && !st.gone?.[p.id]);
    if (via && (s.spread || 0) < 4 && d - s.leakDay <= 5 && hash01(owner.k * 31 + d * 7) < .7) {
      const pals = people.filter(q => !q.fam && !st.gone?.[q.id] && q.id !== owner.id && q.id !== via.id && !(s.known || []).includes(q.id) && aff(via, q) >= 1).slice(0, 2);
      for (const q of pals) {
        s.known.push(q.id);
        (MEM()[q.id] || (MEM()[q.id] = [])).push({ d, k: 'heard', v: 0, t: `ความลับของ${owner.n}`, spread: 1, w: 3 });
      }
      if (pals.length) townNews(`🗣️ ความลับของ ${owner.n} ถูกพูดถึงมากขึ้น`);
      s.spread = (s.spread || 0) + 1;
    }
    if (d >= s.foundDay) {
      s.found = d;
      ndTrustAdj(owner, -10, 'รู้ว่าความลับรั่ว');
      const r = relOf(owner.id); r.f = Math.max(0, r.f - 8); r.h = Math.min(100, (r.h || 0) + 10);
      push(owner.id, { t: 'in', kind: 'chat', replied: true, text: `ฉันรู้แล้วนะว่าเธอเอาความลับของฉันไปบอก${s.via ? nameOf(s.via) : 'คนอื่น'}…` });
      townNews(`💔 ${owner.n} รู้ว่าความลับของตัวเองรั่วไหล`);
    }
  }
}

// ---- grudges and reconciliation ----------------------------------------------------------------------
function ndGrudgeRebuild() {
  ND.g = {};
  const d = day();
  for (const g of Object.values(NDG())) if (g.until >= d) { ND.g[g.a] = g; ND.g[g.b] = g; }
}
function ndGrudgeOf(p) {
  if (!ND.g) ndGrudgeRebuild();
  return p ? ND.g[p.id] || null : null;
}
function ndGrudgeBetween(a, b) {
  const g = NDG()[pairKey(a, b)];
  return g && g.until >= day() ? g : null;
}
function ndGrudgeAdd(a, b, why, days, quiet) {
  if (!a || !b || a === b || a.fam || b.fam || st.gone?.[a.id] || st.gone?.[b.id]) return null;
  const key = pairKey(a, b), old = NDG()[key];
  if (old && old.until >= day()) return old;
  const g = NDG()[key] = { a: a.id, b: b.id, d: day(), until: day() + Math.max(1, days || 4), why: why || 'ทะเลาะกัน', seed: a.k * 31 + b.k * 7 };
  if (!quiet) townNews(`⚔️ ${a.n} กับ ${b.n} ยังไม่คืนดีกัน`);
  ndGrudgeRebuild();
  return g;
}
function ndReconcile(A, B, key, news) {
  delete NDG()[key];
  const k = pairKey(A, B); A2()[k] = Math.min(3, (A2()[k] || 0) + 1.5);
  ndGrudgeRebuild();
  if (news) townNews(`🕊️ ${A.n} กับ ${B.n} คืนดีกันแล้ว`);
  if ((st.rel[A.id]?.f || 0) >= 30) push(A.id, { t: 'in', kind: 'chat', replied: true, text: `เรากับ ${B.n} คืนดีกันแล้วนะ 🕊️` });
}
function ndGrudgeDaily() {
  const d = day(), ps = people.filter(p => !p.fam && !st.gone?.[p.id]), ids = new Set(ps.map(p => p.id));
  for (const [key, g] of Object.entries(NDG())) {
    if (!ids.has(g.a) || !ids.has(g.b)) { delete NDG()[key]; continue; }
    const A = ps.find(p => p.id === g.a), B = ps.find(p => p.id === g.b);
    if (!A || !B) { delete NDG()[key]; continue; }
    const expired = d > g.until, early = !expired && d - g.d >= 3 && hash01(g.seed + d * 11) < .16;
    if (expired || early) ndReconcile(A, B, key, true);
  }
  for (const p of ps) {
    const ev = st.npcLife?.[p.id]?.ev;
    if (ev?.k === 'fight' && ev.with) {
      const q = ps.find(x => x.id === ev.with);
      if (q) ndGrudgeAdd(p, q, 'ทะเลาะกัน', Math.max(4, (ev.until || d) - d + 3), true);
    }
  }
  if (Object.keys(NDG()).length < 6) {
    let announced = false;
    for (let i = 0; i < 3 && ps.length > 1; i++) {
      const a = ps[ri(ps.length)];
      if (ndGrudgeOf(a)) continue;
      const cands = ps.filter(q => q !== a && !ndGrudgeOf(q) && aff(a, q) <= -2);
      if (!cands.length) continue;
      const q = cands[ri(cands.length)];
      if (hash01(a.k * 31 + q.k * 7 + d) < .14) {
        ndGrudgeAdd(a, q, 'เข้ากันไม่ค่อยได้', 3 + Math.floor(hash01(a.k + q.k + d) * 3), announced);
        announced = true;
      }
    }
  }
  ndGrudgeRebuild();
}
function ndMediate(p, g) {
  const other = people.find(q => q.id === (g.a === p.id ? g.b : g.a));
  if (!other) return;
  const chance = Math.max(.25, Math.min(.85, .35 + lv('charm') * .05 + ndTrustOf(p) / 300));
  if (Math.random() < chance) {
    const key = pairKey(p, other);
    ndReconcile(p, other, key, false);
    remember(p.id, 'reconcile', 2, `ช่วยให้คืนดีกับ${other.n}`);
    townNews(`🕊️ ${p.n} กับ ${other.n} คืนดีกันแล้ว หลังคุณช่วยไกล่เกลี่ย`);
    line(`${p.n}: "…ก็ได้นะ ฉันจะลองคุยกับ${other.n}ดู ขอบคุณที่ช่วย"`, 'happy', () => cont(p));
    if ((st.rel[other.id]?.f || 0) >= 20) push(other.id, { t: 'in', kind: 'chat', replied: true, text: `${p.n} มาขอโทษฉันแล้วนะ ขอบคุณที่ช่วยไกล่เกลี่ย 🕊️` });
  } else line(`${p.n}: "ยังไม่พร้อม… ขอเวลาหน่อยนะ"`, 'sad', () => cont(p));
}

// ---- crushes ----------------------------------------------------------------------------------------
function ndCrushDaily() {
  const ps = people.filter(p => !p.fam && !st.gone?.[p.id] && p.age >= 13 && !p.mate && !loveOf(p));
  let made = 0;
  for (const p of ps) {
    if (made >= 2) break;
    if (ndCrushOf(p) || hash01(p.k * 41 + day() * 13 + 3) > .025) continue;
    const cands = ps.filter(q => q !== p && q.g !== p.g && Math.abs(q.age - p.age) <= 10 && !loveOf(q));
    if (!cands.length) continue;
    const q = cands[Math.floor(hash01(p.k * 19 + day() * 7 + 5) * cands.length)];
    NDC()[p.id] = { to: q.id, d: day() }; made++;
    if (hash01(p.k * 9 + day() * 3) < .35) townNews(`💗 มีข่าวลือว่า ${p.n} แอบชอบ ${q.n} อยู่`);
  }
  if (made < 2) for (const p of ps) {
    if (ndCrushOf(p) || !p.date || ndTrustOf(p) < 55) continue;
    if (hash01(p.k * 71 + day() * 17) < .012) { NDC()[p.id] = { to: 'player', d: day() }; break; }
  }
}
function ndCrushTalk(p, c) {
  const name = c.to === 'player' ? 'คุณ' : nameOf(c.to);
  line(`${p.n}: "คือ… ฉันแอบชอบ${name}อยู่ ไม่รู้จะทำยังไงดี"`, 'sad');
  TK.opts = [
    ['เชียร์ให้บอกรัก', () => {
      ndTrustAdj(p, 3, 'ให้กำลังใจ');
      if (c.to !== 'player') { const q = people.find(x => x.id === c.to); if (q) { const k = pairKey(p, q); A2()[k] = Math.min(3, (A2()[k] || 0) + .5); } }
      line(`${p.n}: "จริงเหรอ… งั้นฉันจะลองดู ขอบคุณนะ!"`, 'happy', () => cont(p));
    }],
    ['บอกให้รอจังหวะ', () => { ndTrustAdj(p, 1, 'ให้คำปรึกษา'); line(`${p.n}: "อือ… เธอคิดถูก ฉันควรใจเย็นกว่านี้"`, 'neutral', () => cont(p)); }],
    ['◀ กลับ', () => cont(p)],
  ];
  render2();
}

// ---- daily rollover ----------------------------------------------------------------------------------
function ndDaily() {
  if (!people.length || st.npcDeepDay === day()) return;
  st.npcDeepDay = day();
  ndSecretDaily();
  ndGrudgeDaily();
  ndCrushDaily();
  const d = day(), C = st.npcChatDay || {};
  for (const k in C) if (d - C[k] > 7) delete C[k];
}

// ---- memory and social actions feed trust ------------------------------------------------------------
const _rememberDeep = remember;
remember = (id, kind, v, text) => {
  _rememberDeep(id, kind, v, text);
  const L = MEM()[id]; if (!L || !L.length) return;
  const m = L[L.length - 1];
  if (m.w == null) m.w = ndWeight(kind, v);
  const p = people.find(q => q.id === id);
  if (!p || p.fam || st.gone?.[id]) return;
  const f = ND_TRUST_OF_MEM[kind];
  if (f) { const d = typeof f === 'function' ? f(v) : f; if (d) ndTrustAdj(p, d, ND_TRUST_WHY[kind]); }
};
const _memoryLineDeep = memoryLine;
memoryLine = p => {
  const L = ndMemories(p);
  if (!L.length) return _memoryLineDeep(p);
  const fresh = L.filter(m => m.said !== day());
  if (!fresh.length || hash01(p.k * 13.7 + day() * 5.1) < .2) return null;
  const top = fresh.sort((a, b) => ndSalience(b) - ndSalience(a)).slice(0, 3);
  const m = top[Math.floor(hash01(p.k * 7.3 + day() * 11.9 + top.length) * top.length)] || top[0];
  m.said = day();
  return ndMemoryText(p, m);
};

// Existing actions that did not leave a memory before Phase 2
const _apologizeDeep = apologize;
apologize = (p, gift) => {
  const before = relOf(p.id).h || 0, out = _apologizeDeep(p, gift);
  if ((relOf(p.id).h || 0) < before) remember(p.id, 'sorry', 1, 'ขอโทษอย่างจริงใจ');
  return out;
};
const _dateDeep = date;
date = (p, ...a) => {
  const r = relOf(p.id), before = r.date, out = _dateDeep(p, ...a);
  if (r.date !== before && r.date === day()) remember(p.id, 'date', 2, 'ไปเดทด้วยกัน');
  return out;
};
const _confessDeep = confess;
confess = p => {
  const before = st.partner, out = _confessDeep(p);
  if (st.partner === p.id && before !== p.id) remember(p.id, 'confess', 3, 'สารภาพรัก');
  return out;
};

// ---- schedules: an unresolved grudge changes free-time venues, never work or festivals -----------------
const _slotDeep = slotOf;
slotOf = p => {
  const base = _slotDeep(p);
  if (!p || p.fam || p.visiting || st.gone?.[p.id] || base === 'in' || base === 'home') return base;
  if (typeof festOn === 'function' && festOn() && hour() >= 17) return base;
  if (typeof nightClerk === 'function' && nightClerk(p)) return base;
  const ev = typeof weeklyEvent === 'function' ? weeklyEvent() : null;
  if (ev && base === ev.place) return base;
  if (WORKS[p.role] === base) return base;
  const life = st.npcLife?.[p.id];
  if (life?.ev && life.ev.until >= day()) return base;
  const h = hour(); if (h < 7 || h >= 22) return base;
  const g = ndGrudgeOf(p); if (!g) return base;
  const other = people.find(q => q.id === (g.a === p.id ? g.b : g.a));
  if (!other || other.slot === 'in' || other.slot === 'home' || other.slot !== base) return base;
  const alts = ND_AVOID[base];
  return alts && hash01(p.k * 7 + day() * 3) < .72 ? alts[p.k % alts.length] : base;
};

// ---- day boundary ------------------------------------------------------------------------------------
const _seasonDeep = seasonTick;
seasonTick = () => {
  const meet = typeof ph === 'function' && ph().meet ? { ...ph().meet } : null;
  _seasonDeep();
  if (!player) return;
  if (meet && !ph().meet) {
    const p = people.find(q => q.id === meet.id);
    if (p && !st.gone?.[p.id]) {
      const onTime = day() === meet.d && hour() >= meet.hour && hour() < meet.hour + 2;
      if (onTime) { ndTrustAdj(p, 6, 'มาหาตามนัด'); remember(p.id, 'meet', 2, 'มาหาตามนัด'); }
      else { ndTrustAdj(p, -8, 'ผิดนัด'); remember(p.id, 'miss', -2, 'ไม่มาหาตามนัด'); }
    }
  }
  ndDaily();
};

// ---- conversation: secrets, promises, mediation, crushes and trust -----------------------------------
function ndTrustLine(p) {
  const t = ndTrustOf(p), m = ndTopMemory(p);
  const l = t >= 75 ? 'ฉันไว้ใจเธอมากเลยนะ' : t >= 50 ? 'เราสองคนไว้ใจกันได้' : t >= 30 ? 'ยังไม่สนิทใจเท่าไร แต่ก็คุยได้' : 'ฉันระวังตัวกับคนแปลกหน้าอยู่';
  lastV = t >= 50 ? 1 : 0;
  line(`${p.n}: "${l} (ความไว้ใจ ${t}/100)${m ? ` · ยังจำเรื่อง${m.t}ได้` : ''}"`, t >= 50 ? 'happy' : t <= 25 ? 'sad' : 'neutral', () => cont(p));
}
const _chatDeep = chatHook;
chatHook = (p, title, opts) => {
  _chatDeep(p, title, opts);
  if (!TK || !p || p.fam || st.gone?.[p.id]) return;
  const extra = [];
  if (!hated(p)) {
    if ((st.npcChatDay?.[p.id] || 0) !== day()) {
      (st.npcChatDay || (st.npcChatDay = {}))[p.id] = day();
      ndTrustAdj(p, 1, 'คุยกัน');
    }
    const s = ndSecretOf(p);
    if (s && !s.told && ndTrustOf(p) >= 50) extra.push([`🤫 ฟังความลับของ${p.n}`, () => ndTellSecret(p, s)]);
    if (s && s.told && !s.promise && !s.leaked) extra.push(['🙏 สัญญาว่าจะเก็บความลับ', () => ndPromise(p, s)]);
    const known = ndKnownSecrets().filter(([id, x]) => id !== p.id && !(x.known || []).includes(p.id));
    for (const [id, x] of known.slice(0, 2)) extra.push([`🤫 เล่าความลับของ${nameOf(id)}`, () => ndLeakSecret(p, id, x)]);
    const g = ndGrudgeOf(p);
    if (g && ndTrustOf(p) >= 40) extra.push(['🕊️ ช่วยไกล่เกลี่ย', () => ndMediate(p, g)]);
    const c = ndCrushOf(p);
    if (c) extra.push(['💗 เรื่องหัวใจ', () => ndCrushTalk(p, c)]);
  }
  extra.push(['🤝 ความไว้ใจระหว่างเรา', () => ndTrustLine(p)]);
  const cur = TK.opts ? [...TK.opts] : [];
  const bye = cur.length && /ลาก่อน/.test(cur[cur.length - 1][0]) ? cur.pop() : null;
  TK.opts = [...cur, ...extra, ...(bye ? [bye] : [])];
  render2();
};

// ---- thoughts, chat lines and a profile section -------------------------------------------------------
const _mindDeep = mindOf;
mindOf = p => {
  if (!p || p.fam || st.gone?.[p.id]) return _mindDeep(p);
  const c = [], g = ndGrudgeOf(p);
  if (g) { const q = people.find(x => x.id === (g.a === p.id ? g.b : g.a)); if (q) c.push(['😤', `ยังไม่หายโกรธ ${q.n}`, 'angry']); }
  const s = ndSecretOf(p);
  if (s && s.found) c.push(['💔', `ผิดหวังที่ ${st.name} เอาความลับไปพูด`, 'sad']);
  else if (s && s.told && !s.leaked && !s.kept) c.push(['🤫', 'ความลับของฉันยังปลอดภัยดี', 'neutral']);
  const cr = ndCrushOf(p);
  if (cr) c.push(['💗', cr.to === 'player' ? 'มีคนที่แอบชอบอยู่…' : `แอบชอบ ${nameOf(cr.to)} อยู่`, 'happy']);
  const t = ndTrustOf(p);
  if (t >= 80) c.push(['🤝', `ไว้ใจ ${st.name} มาก`, 'happy']);
  else if (t <= 20) c.push(['🤨', 'ไม่รู้จะไว้ใจใครได้จริง ๆ', 'sad']);
  return c.length && hash01(p.k + Math.floor(now() / 9000)) < .62 ? c[0] : _mindDeep(p);
};
const _chatLineDeep = chatLine;
chatLine = (p, o, n) => {
  if (!p || p.fam || st.gone?.[p.id]) return _chatLineDeep(p, o, n);
  const pool = [], g = ndGrudgeOf(p);
  if (g) { const q = people.find(x => x.id === (g.a === p.id ? g.b : g.a)); if (q) pool.push(`ช่วงนี้ฉันเลี่ยง${q.n}อยู่`, `เรื่องกับ${q.n}ยังไม่จบ`); }
  const s = ndSecretOf(p);
  if (s && s.leaked && s.found) pool.push('ไม่อยากพูดเรื่องความลับอีกแล้ว');
  const c = ndCrushOf(p);
  if (c) pool.push(c.to === 'player' ? 'มีเรื่องอยากบอก แต่ไม่กล้า' : `แอบมอง${nameOf(c.to)}อยู่บ่อย ๆ`);
  const t = ndTrustOf(p);
  if (t >= 75) pool.push(`ฉันไว้ใจ${st.name}นะ`);
  else if (t <= 25) pool.push('ฉันยังไม่ค่อยไว้ใจใครง่าย ๆ');
  if (pool.length && hash01(p.k * 7.7 + n * 3.1) < .5) {
    const line2 = pool[Math.floor(hash01(p.k * 5.3 + n * 1.7) * pool.length)];
    return line2.length > 30 ? line2.slice(0, 29) + '…' : line2;
  }
  return _chatLineDeep(p, o, n);
};
const _poDeep = personOpts;
personOpts = p => {
  const out = _poDeep(p);
  if (!p || p.fam || st.gone?.[p.id]) return out;
  out.push(['🤝 ความไว้ใจ', () => {
    const t = ndTrustOf(p), s = ndSecretOf(p);
    const hint = s && s.told ? ' · เธอรู้ความลับของฉันแล้ว' : s && t >= 50 ? ' · ฉันมีเรื่องอยากเล่าให้ฟัง' : '';
    say(`${p.n}: "${t >= 60 ? 'ฉันไว้ใจเธอมาก' : t >= 35 ? 'เราค่อย ๆ รู้จักกันไปนะ' : 'ฉันยังไม่ค่อยไว้ใจใครง่าย ๆ'} (ความไว้ใจ ${t}/100)${hint}"`);
  }]);
  return out;
};
function ndProfile(p) {
  const t = ndTrustOf(p), out = [el('div', { className: 'sec' }, '🤝 ความไว้ใจและความจำ')];
  out.push(row('🤝', 'ความไว้ใจ', `${t}/100 · ${ndTrustLabel(t)}`,
    el('div', { className: 'bar', style: 'width:90px' }, el('i', { style: `width:${t}%;background:${t >= 60 ? '#7ee07e' : t >= 35 ? '#ffe08a' : '#e84a4a'}` }))));
  const mems = ndAllMemories(p).sort((a, b) => ndSalience(b) - ndSalience(a)).slice(0, 3);
  if (mems.length) {
    out.push(el('div', { className: 'sub' }, 'ความจำล่าสุด'));
    for (const m of mems) out.push(row(m.v < 0 ? '💔' : '💗', m.t, `${daysAgo(m.d)}${m.k === 'heard' ? ' · ได้ยินจากคนอื่น' : ''}`));
  } else out.push(row('🧠', 'ความจำ', 'ยังไม่มีเรื่องที่จำได้เป็นพิเศษ'));
  const s = ndSecretOf(p);
  if (s && s.told) {
    out.push(row('🤫', 'ความลับ', `${s.t} · ${s.leaked ? (s.found ? 'รั่วไหลและเจ้าตัวรู้แล้ว' : 'รั่วไหลแล้ว') : 'คุณเก็บไว้ได้'}`));
    if (s.leaked) out.push(row('🗣️', 'ต้นทางข่าว', `คุณเล่าให้ ${nameOf(s.via || '')} ฟัง · รู้กัน ${s.known?.length || 1} คน${s.found ? ' · เจ้าตัวรู้แล้ว' : ''}`));
  } else if (t >= 50) out.push(row('🤫', 'ความลับ', 'ไว้ใจคุณพอจะเล่าให้ฟังแล้ว'));
  const g = ndGrudgeOf(p);
  if (g) {
    const q = people.find(x => x.id === (g.a === p.id ? g.b : g.a));
    out.push(row('⚔️', 'ความแค้นที่ยังไม่จบ', `${q?.n || '?'} · ${g.why} · อีก ${Math.max(0, g.until - day() + 1)} วัน`));
  }
  const c = ndCrushOf(p);
  if (c) out.push(row('💗', 'แอบชอบ', c.to === 'player' ? 'คุณ — ยังไม่กล้าบอก' : nameOf(c.to)));
  return out;
}
const _relDeep = relProfileView;
relProfileView = id => {
  const out = _relDeep(id), p = people.find(q => q.id === id);
  return p && !p.fam && !st.gone?.[id] ? [...out, ...ndProfile(p)] : out;
};

// ---- data checks -------------------------------------------------------------------------------------
console.assert(Object.keys(ND_TRUST_OF_MEM).length >= 15, 'trust responds to the main interactions');
console.assert(ND_SECRET_KINDS.length >= 6 && ND_SECRET_KINDS.every(k => typeof k === 'string'), 'secret kinds are defined');
console.assert(typeof ndTrustOf === 'function' && typeof ndSecretOf === 'function' && typeof ndGrudgeOf === 'function', 'npc depth ready');
