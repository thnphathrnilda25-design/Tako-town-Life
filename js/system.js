'use strict';
// Title screen with 3 save slots, pause menu and settings. CFG lives in its own localStorage key so it survives deleting saves.
const CFG = (() => { const d = { music: 60, sfx: 80, diff: 'normal', autosave: true, thoughts: true }; try { return { ...d, ...JSON.parse(localStorage.getItem('pt-cfg')) }; } catch (e) { return d; } })();
const cfgSave = () => { try { localStorage.setItem('pt-cfg', JSON.stringify(CFG)); } catch (e) { /* settings just will not persist */ } };
var dm = () => ({ easy: .75, normal: 1, hard: 1.35 }[CFG.diff] || 1);      // difficulty multiplier for drains and bad events

// ---- title screen: slots ----
{
  const sel = $('select'), creator = $('creator');
  [...sel.children].filter(c => c.classList.contains('cont')).forEach(c => c.remove());       // life.js's single "Continue"
  creator.hidden = true; sel.querySelector('div').textContent = 'เลือกเซฟ';
  const slots = el('div', { id: 'slots', style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center' });
  const back = el('button', { className: 'cont', textContent: '◀ กลับไปเลือกเซฟ', hidden: true, onclick: () => { creator.hidden = true; back.hidden = true; slots.hidden = false; } });
  function drawSlots() {
    slots.replaceChildren(...[1, 2, 3].map(n => {
      const s = load(n), card = el('div', { style: 'background:#ffffff14;border:3px solid #ffffff30;border-radius:14px;padding:12px;width:190px;text-align:left' }, el('div', { style: 'color:var(--gold)' }, `เซฟ ${n}`));
      if (s) {
        const a = 6 + Math.floor((Math.floor(s.st.min / 1440)) / YEAR) + (s.st.ageShift || 0);
        card.append(el('div', {}, `${s.st.name}, อายุ ${a}`), el('div', { className: 'sub' }, `วันที่ ${Math.floor(s.st.min / 1440) + 1} · ฿${s.st.money}${s.st.spouse ? ' · 💍' : ''}${(s.st.kids || []).length ? ` · 👶×${s.st.kids.length}` : ''}`),
          el('div', { style: 'margin-top:8px;display:flex;gap:6px' }, btn('เล่น', () => { SLOT = n; start(s); }), btn('ลบ', () => { if (confirm(`ลบเซฟ ${n}?`)) { localStorage.removeItem(slotKey(n)); if (n === 1) localStorage.removeItem('pixeltown32-v3'); drawSlots(); } })));
      } else card.append(el('div', { className: 'sub' }, 'ว่าง'), el('div', { style: 'margin-top:8px' }, btn('เริ่มใหม่', () => { SLOT = n; slots.hidden = true; creator.hidden = false; back.hidden = false; $('select').querySelector('div').textContent = 'สร้างตัวละคร'; })));
      return card;
    }));
  }
  drawSlots(); sel.insertBefore(slots, creator); sel.append(back);
}

// ---- pause menu + settings ----
const overlayOpen = () => menuOpen || panelOpen || mg || busy || ACT || deco.on || (typeof TK !== 'undefined' && !!TK);
let escOK = false;
addEventListener('keydown', e => { escOK = e.code === 'Escape' && !!player && !overlayOpen() && performance.now() - escSkip > 100; }, true);   // capture: state before the game's own Esc handling
addEventListener('keydown', e => { if (escOK) { escOK = false; pauseMenu(); } });
function pauseMenu() {
  if (typeof TK !== 'undefined' && TK) return;   // never stack the pause menu over a conversation
  openMenu('⏸ เมนู', [['เล่นต่อ', () => 0], ['บันทึกเกม', () => { save(); say('บันทึกแล้ว 💾'); }], ['ตั้งค่า', settingsPanel],
    ['บันทึกแล้วกลับไปหน้าแรก', () => { save(); location.reload(); }]]);
}
function settingsPanel() {
  const slider = (key, label) => row('🔊', `${label}: ${CFG[key]}%`, '', el('input', { type: 'range', min: 0, max: 100, value: CFG[key], style: 'width:120px', oninput: e => { CFG[key] = +e.target.value; cfgSave(); if (typeof audioApply === 'function') audioApply(); e.target.closest('.item').children[1].firstChild.textContent = `${label}: ${CFG[key]}%`; } }));
  openPanel('⚙️ ตั้งค่า', () => [slider('music', 'เพลง'), slider('sfx', 'เสียงเอฟเฟกต์'),
    row('🎚️', 'ความยาก', 'ยาก: ความต้องการลดเร็วขึ้นและมีเหตุร้ายบ่อยขึ้น', ...['easy', 'normal', 'hard'].map(d => el('button', { className: CFG.diff === d ? 'on' : '', style: CFG.diff === d ? 'border-color:var(--gold)' : '', textContent: { easy: 'ง่าย', normal: 'ปกติ', hard: 'ยาก' }[d], onclick: () => { CFG.diff = d; cfgSave(); refreshPanel(); } }))),
    row('💾', 'บันทึกอัตโนมัติทุก 10 วินาที', '', btn(CFG.autosave ? 'เปิด' : 'ปิด', () => { CFG.autosave = !CFG.autosave; cfgSave(); refreshPanel(); })),
    row('💭', 'ฟองความคิดของชาวเมือง', 'ปิดถ้ารู้สึกว่ารกจอ', btn(CFG.thoughts !== false ? 'เปิด' : 'ปิด', () => { CFG.thoughts = CFG.thoughts === false; cfgSave(); refreshPanel(); })),
    row('📱', 'ปุ่มควบคุม', matchMedia('(pointer:coarse)').matches ? 'จอยซ้ายล่างเดิน · ปุ่ม A ทำกิจกรรม · ปุ่มขวาล่างเปิดเมนู/กระเป๋า/สมุด · ✕ หรือแตะข้างนอกหรือปุ่มย้อนกลับเพื่อปิด' : 'WASD/ลูกศร เดิน · E ทำกิจกรรม · I กระเป๋า · J สมุด · P โทรศัพท์ · B แต่งบ้าน · Esc เมนู', null)]);
}
const bMenu = el('button', { id: 'bMenu', title: 'เมนู (Esc)', ariaLabel: 'เมนู', textContent: '⚙️', onclick: () => player && !overlayOpen() && pauseMenu() }); $('dock').prepend(bMenu);
console.assert(typeof dm() === 'number' && load(1) !== undefined, 'system ready');
