'use strict';
// Family help gigs: walk up to a family member where they actually are — their workplace, the school
// yard or home in the evening — and help them for a while. You get a share of their wage, a closer
// bond, a little skill, and the person remembers it. One gig per person per day, free of charge.
// State lives in `st.fgig` and is created lazily, so old saves keep working.

const FG_PLACE = { office: 'ที่ออฟฟิศ', cafe: 'ที่คาเฟ่', mart: 'ที่มินิมาร์ท', furni: 'ที่ร้านเฟอร์นิเจอร์', school: 'ที่โรงเรียน',
  plaza: 'ที่ลานกลางเมือง', park: 'ที่สวนสาธารณะ', shop: 'ที่ร้านของครอบครัว', home: 'ที่บ้าน', in: 'ที่บ้าน' };
const fgState = () => (st.fgig || (st.fgig = { log: {}, total: 0, count: 0, d: 0 }));
const fgToday = () => { const S = fgState(); if (S.d !== day()) { S.d = day(); S.log = {}; } return S; };
const fgDone = id => fgToday().log[id] === day();
const fgIsFamily = id => !!id && (id === 'dad' || id === 'mom' || id === 'spouse' || /^sib\d+$/.test(id));
const fgMember = id => (typeof swMembers === 'function' ? swMembers().find(m => m.id === id) : null);
const fgName = s => (SKILLS[s] ? SKILLS[s][0] : 'สกิล');
const fgSkillOf = (id, m) => id === 'dad' ? 'logic'
  : id === 'mom' || id === 'spouse' ? 'charm'
    : !m ? 'charm' : m.age < 6 ? 'art' : m.age < 18 ? 'logic' : 'cook';

// one option per person, only while they are reachable and only once a day
function fgOption(p) {
  const id = p && p.id;
  if (!fgIsFamily(id) || fgDone(id)) return null;
  const m = fgMember(id); if (!m) return null;
  const ent = (typeof fam !== 'undefined' && fam.find(x => x.id === id)) || p;
  const slot = (ent && ent.slot) || 'in', out = slot !== 'in' && slot !== 'home';
  const place = FG_PLACE[out ? slot : 'home'] || 'บ้าน';
  const wage = typeof swWage === 'function' ? swWage(m) : 0;
  const young = m.age < 6, school = slot === 'school';
  const mins = out && !school ? 45 : 20;
  const amt = young || school ? 0 : out ? Math.round(wage * .45) : Math.round(15 + wage * .18);
  const skill = fgSkillOf(id, m);
  const label = young ? `ช่วยดูน้อง (${mins} นาที · +ความสนิท)`
    : school ? `ช่วยงาน${place} (${mins} นาที · +${fgName(skill)})`
      : `ช่วยงาน${place} (${mins} นาที · +฿${amt})`;
  return [label, () => fgDo(id, m, { place, amt, mins, skill, young, school })];
}

function fgDo(id, m, o) {
  if (fgDone(id)) return say('วันนี้ช่วยงานเขาแล้ว — พรุ่งนี้ค่อยช่วยใหม่นะ');
  const S = fgToday();
  tick(o.mins);
  fx({ energy: -6, food: -3, mood: 5 });
  const r = relOf(id); r.f = Math.min(100, (r.f || 0) + 4);
  xp(o.skill, 8);
  const tip = o.young || o.school || Math.random() >= .28 ? 0 : 10 + Math.floor(Math.random() * 16);
  if (o.amt + tip > 0) fx({ money: o.amt + tip });
  S.log[id] = day(); S.total = (S.total || 0) + o.amt + tip; S.count = (S.count || 0) + 1;
  if (typeof remember === 'function') remember(id, 'help', 1, `ช่วยงาน${o.place}`);
  if (typeof drawHud === 'function') drawHud();
  say(o.young ? `ช่วยดูแล ${m.n} จนหลับ 😴 — สนิทกันขึ้นเยอะเลย`
    : o.school ? `ช่วย ${m.n} ทำการบ้าน${o.place} 📚 — เขาดีใจมาก`
      : `ช่วย ${m.n} ทำงาน${o.place}${o.amt ? ` ได้ ฿${o.amt}` : ''}${tip ? ` + ทิป ฿${tip}` : ''} 💪`);
}

// hook the talk menu: everyone keeps their normal options, family gets one more
const _poFG = personOpts;
personOpts = p => {
  const base = _poFG(p), g = fgOption(p);
  return g ? [...base, g] : base;
};

// Family members who are working inside a building are not walkable-up-to, so their workplace door
// offers the same gig: stand by the café / office / mart / furniture shop / school and help.
const FG_AT_WORK = ['cafe', 'mart', 'office', 'furni', 'school', 'shop'];
const FG_BLD = {};
for (const b of BUILDINGS) if (b.act) FG_BLD[b.act] = { x: b.ix, y: b.iy };
function fgWorkOptsAt(x, y) {
  const out = [];
  for (const ent of fam) {
    const id = ent.id;
    if (!fgIsFamily(id) || fgDone(id) || !FG_AT_WORK.includes(ent.slot)) continue;
    const b = FG_BLD[ent.slot];
    if (!b || Math.abs(b.x - x) > 4 || Math.abs(b.y - y) > 4) continue;
    const m = fgMember(id); if (!m) continue;
    const place = FG_PLACE[ent.slot] || 'ที่ทำงาน', school = ent.slot === 'school';
    const mins = school ? 20 : 45;
    const amt = school ? 0 : Math.round((typeof swWage === 'function' ? swWage(m) : 0) * .45);
    const skill = fgSkillOf(id, m);
    out.push([`ช่วยงาน${place}กับ ${m.n} (${mins} นาที · ${amt ? `+฿${amt}` : `+${fgName(skill)}`})`,
      () => fgDo(id, m, { place, amt, mins, skill, young: false, school })]);
  }
  return out;
}
function fgWrapTargets() {
  for (const t of town.targets) {
    const d = Object.getOwnPropertyDescriptor(t, 'opts');
    if (!d || !(d.get || Array.isArray(d.value))) continue;
    const base = d.get ? () => d.get.call(t) : () => d.value;
    Object.defineProperty(t, 'opts', {
      configurable: true, enumerable: true,
      get() { const b = base() || [], extra = fgWorkOptsAt(t.x, t.y); return extra.length ? [...b, ...extra] : b; },
    });
  }
}
fgWrapTargets();

// rows in the family app, so you can see who still needs a hand today
function fgRows() {
  const S = fgToday();
  const mem = (typeof swMembers === 'function' ? swMembers() : []).filter(m => fgIsFamily(m.id));
  if (!mem.length) return [];
  return [el('div', { className: 'sec' }, '🤝 ช่วยงานครอบครัว'),
    el('div', { className: 'sub' }, 'เดินไปหาคนในบ้านตอนเขาทำงานหรือตอนอยู่บ้าน แล้วเลือก “ช่วยงาน” — ได้ส่วนแบ่งค่าจ้าง สนิทกันขึ้น และได้สกิล วันละครั้งต่อคน'),
    ...mem.map(m => row(m.icon, `${m.n} · ${(m.role || '').split(' · ')[0] || 'ครอบครัว'}`,
      fgDone(m.id) ? 'วันนี้ช่วยแล้ว ✅' : 'วันนี้ยังไม่ได้ช่วย — ไปหาที่ทำงานหรือที่บ้าน')),
    el('div', { className: 'sub' }, `รวมที่ช่วยไป ฿${S.total || 0} · ${S.count || 0} ครั้ง · พรุ่งนี้เริ่มใหม่`)];
}
const _appFamFG = APP.fam;
APP.fam = () => [..._appFamFG(), ...fgRows()];

console.assert(typeof fgOption === 'function' && typeof fgDo === 'function', 'family gigs ready');
