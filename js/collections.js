'use strict';
// Hobbies and collections: records every fish, bug, fossil and cooked recipe, tracks personal-best
// fish sizes, adds the phone collection app, quick museum donations and milestone rewards.

const FISH_SIZE = { minnow: [6, 14], carp: [25, 55], sardine: [10, 20], trout: [25, 60], bass: [20, 50], catfish: [30, 80],
  eel: [40, 110], salmon: [40, 90], smelt: [10, 22], pufferfish: [15, 40], koi: [30, 70], goldfish: [8, 22] };
const finds = () => st.finds || (st.finds = {});
const records = () => st.rec || (st.rec = {});
const recipes = () => st.recipes || (st.recipes = {});
const countOf = id => finds()[id] || 0;
const bestOf = id => records()[id] || 0;
const distinct = list => list.filter(([id]) => countOf(id) > 0).length;
const recipeCount = () => Object.keys(recipes()).length;
const ALL_COLLECT = [...FISHES, ...BUGS, ...FOSSILS];
const foundTotal = () => ALL_COLLECT.filter(([id]) => countOf(id) > 0).length;

function seedCollection() {
  if (st.colSeeded) return; st.colSeeded = 1;
  const F = finds();
  for (const id in st.inv) {
    const k = ITEMS[id]?.k;
    if ((k === 'fish' || k === 'bug' || k === 'fossil') && !F[id]) F[id] = st.inv[id];
  }
  for (const id in mus()) if (!F[id]) F[id] = 1;
}
function recordFish(id) {
  const [a, b] = FISH_SIZE[id] || [10, 40];
  const cm = Math.round((a + Math.random() * (b - a)) * (1 + lv('fish') * .01) * 10) / 10;
  const R = records();
  if (!R[id] || cm > R[id]) { R[id] = cm; return { cm, best: true }; }
  return { cm, best: false };
}

// record every item that reaches the bag (only gains, never sales or donations)
const _addItemCol = addItem;
addItem = (id, n = 1) => {
  _addItemCol(id, n);
  if (n <= 0) return;
  const I = ITEMS[id]; if (!I) return;
  let fresh = false;
  if (I.k === 'dish') { const R = recipes(), before = R[id] || 0; R[id] = before + n; if (!before) fresh = true; }
  else if (I.k === 'fish' || I.k === 'bug' || I.k === 'fossil') {
    const F = finds(), before = F[id] || 0; F[id] = before + n; if (!before) fresh = true;
    if (I.k === 'fish') { const r = recordFish(id); if (r.best) { fresh = true; if (r.cm >= 50) toast(`📏 สถิติใหม่! ${I.n} ${r.cm} ซม.`); } }
  }
  collectionCheck();
  if (fresh) checkAch();
};

// ---- milestone rewards ----
const CREWARDS = [
  { k: 'fish6', n: 'จับปลาได้ครบ 6 ชนิด', pay: 200, ok: () => distinct(FISHES) >= 6 },
  { k: 'bugs8', n: 'เก็บแมลงครบ 8 ชนิด', pay: 500, ok: () => distinct(BUGS) >= BUGS.length },
  { k: 'foss6', n: 'ขุดฟอสซิลครบ 6 ชนิด', pay: 600, ok: () => distinct(FOSSILS) >= FOSSILS.length },
  { k: 'rec7', n: 'ทำอาหารครบ 7 สูตร', pay: 1200, ok: () => recipeCount() >= RECIPES.length },
];
function collectionCheck() {
  const C = st.crewards || (st.crewards = {});
  for (const r of CREWARDS) if (!C[r.k] && r.ok()) {
    C[r.k] = 1; fx({ money: r.pay });
    setTimeout(() => toast(`🏅 ${r.n}! ได้รางวัล ฿${r.pay}`), 400);
  }
}

// ---- phone app: collections ----
let cTab = 'fish';
const CTABS = [['fish', '🐟 ปลา'], ['bug', '🦋 แมลง'], ['fossil', '🦴 ฟอสซิล'], ['recipe', '🍳 สูตรอาหาร']];
function collectionApp() {
  seedCollection();
  const out = [], R = recipes();
  out.push(el('div', { className: 'sub' }, `ค้นพบ ${foundTotal()}/${ALL_COLLECT.length} ชนิด · บริจาคพิพิธภัณฑ์ ${total()} ชิ้น · สูตรอาหาร ${recipeCount()}/${RECIPES.length}`));
  out.push(el('div', { className: 'tabs' }, ...CTABS.map(([k, n]) => el('button', { className: k === cTab ? 'on' : '', textContent: n, onclick: () => { cTab = k; refreshPanel(); } }))));
  if (cTab === 'recipe') {
    for (const r of RECIPES) {
      const I = ITEMS[r.id], n = R[r.id] || 0, locked = lv('cook') < r.lv;
      out.push(row(n ? I.ic : locked ? '🔒' : '🍳', n ? I.n : `${I.n} (ยังไม่เคยทำ)`,
        `ทำแล้ว ${n} ครั้ง${locked ? ` · ปลดล็อกที่ Lv ${r.lv}` : ''} · ขายได้ราว ฿${I.sell || 30} · วัตถุดิบ ${Object.entries(r.need).map(([k, v]) => `${ITEMS[k].ic}${v}`).join(' ')}`));
    }
  } else {
    const list = cTab === 'fish' ? FISHES : cTab === 'bug' ? BUGS : FOSSILS;
    for (const [id, n, , , sell, ic] of list) {
      const c = countOf(id), m = mus()[id];
      const extra = cTab === 'fish' && bestOf(id) ? ` · สถิติ ${bestOf(id)} ซม.` : '';
      out.push(row(c ? ic : '❔', c ? n : '???',
        c ? `เก็บได้ ${c} ครั้ง${extra} · ขายได้ ฿${sell}${m ? ' · 🏛️ จัดแสดงแล้ว' : ''}` : 'ยังไม่เคยเจอ',
        !m && have(id) ? btn('บริจาค', () => { donate(id); refreshPanel(); }) : null));
    }
  }
  const C = st.crewards || {};
  out.push(el('div', { className: 'sec' }, 'รางวัลสะสม'));
  out.push(...CREWARDS.map(r => row(C[r.k] ? '✅' : '🏅', r.n, `${C[r.k] ? 'รับแล้ว' : 'รางวัล'} ฿${r.pay}`)));
  return out;
}
APP.collect = collectionApp;
APPS.push(['collect', '🏆', 'คอลเลกชัน']);

ACH.push(['hobbyist', '🔍 นักสะสมมือใหม่', 'ค้นพบของสะสมครบ 10 ชนิด', () => foundTotal() >= 10],
  ['bigcatch', '📏 ปลาตัวใหญ่', 'จับปลาได้ 60 ซม. ขึ้นไป', () => Object.values(records()).some(v => v >= 60)],
  ['chefbook', '📖 ตำราอาหาร', 'ทำอาหารครบทั้ง 7 สูตร', () => recipeCount() >= RECIPES.length]);

console.assert(Object.keys(FISH_SIZE).length === FISHES.length, 'every fish has a size range');
console.assert(RECIPES.every(r => ITEMS[r.id] && ITEMS[r.id].k === 'dish'), 'all recipes produce dishes');
