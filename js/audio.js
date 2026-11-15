'use strict';
// Synthesised sound: no audio files. Procedural chiptune music that follows place, time, season and weather, plus effects and rain.
const AU = { ctx: null };
function audioInit() {
  if (AU.ctx) { AU.ctx.state === 'suspended' && AU.ctx.resume(); return; }
  try {
    const c = AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
    AU.mus = c.createGain(); AU.sfx = c.createGain(); AU.amb = c.createGain(); [AU.mus, AU.sfx, AU.amb].forEach(g => g.connect(c.destination)); audioApply();
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    AU.rain = c.createBufferSource(); AU.rain.buffer = buf; AU.rain.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; AU.rainG = c.createGain(); AU.rainG.gain.value = 0; AU.rain.connect(f); f.connect(AU.rainG); AU.rainG.connect(AU.amb); AU.rain.start();
    AU.next = c.currentTime + .1; AU.step = 0; setInterval(musicTick, 120);
  } catch (e) { AU.ctx = null; AU.dead = true; }   // no audio support: the game stays silent
}
function audioApply() { if (!AU.ctx) return; AU.mus.gain.value = (CFG.music / 100) * .25; AU.sfx.gain.value = (CFG.sfx / 100) * .5; AU.amb.gain.value = (CFG.sfx / 100) * .6; }
for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { if (!AU.dead) audioInit(); }, { passive: true });
const hz = n => 440 * Math.pow(2, (n - 69) / 12);
function note(n, t, dur, type, vol, dest) {
  const c = AU.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = hz(n); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + .05);
}
const SFX = { coin: [[88, 0, .08], [95, .07, .18]], ok: [[72, 0, .1], [76, .09, .1], [79, .18, .2]], bad: [[55, 0, .15], [50, .13, .25]], click: [[84, 0, .04]], pop: [[79, 0, .06], [86, .05, .08]], level: [[72, 0, .1], [76, .1, .1], [79, .2, .1], [84, .3, .3]], door: [[60, 0, .08], [55, .08, .12]], hit: [[48, 0, .1]], boom: [[40, 0, .25]] };
function sfx(name) { if (!AU.ctx || !SFX[name]) return; const t = AU.ctx.currentTime; for (const [n, dt, d] of SFX[name]) note(n, t + dt, d, name === 'bad' || name === 'hit' || name === 'boom' ? 'square' : 'triangle', .35, AU.sfx); }
// ---- music ----
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];                      // major pentatonic over two octaves
const TRACKS = {
  day: { bpm: 100, wave: 'triangle', mel: [[0, 2, 4, 2, 5, 4, 2, 0], [4, 5, 4, 2, 0, 2, 4, 7], [2, 4, 5, 7, 5, 4, 2, 4]], bass: [0, 4, 3, 4] },
  home: { bpm: 72, wave: 'sine', mel: [[0, null, 2, null, 4, null, 2, null], [4, null, 5, null, 4, null, 2, null]], bass: [0, 3, 4, 3] },
  night: { bpm: 60, wave: 'sine', mel: [[0, null, null, 2, null, null, 4, null], [2, null, null, 0, null, null, 3, null]], bass: [0, 2, 0, 3] },
  rain: { bpm: 66, wave: 'sine', mel: [[4, null, 2, null, 0, null, 2, null], [5, null, 4, null, 2, null, 0, null]], bass: [0, 2, 3, 2] },
  game: { bpm: 132, wave: 'square', mel: [[0, 4, 2, 5, 4, 7, 5, 4], [7, 5, 4, 2, 4, 5, 7, 5]], bass: [0, 0, 3, 4] },
  fest: { bpm: 120, wave: 'triangle', mel: [[4, 5, 7, 5, 4, 2, 4, 5], [7, 7, 5, 4, 5, 4, 2, 0]], bass: [0, 4, 0, 4] },
};
const ROOT = [60, 62, 57, 55];                                  // spring, summer, autumn, winter
function trackNow() {
  if (mg) return 'game'; if (scene === home || (typeof nRoom !== 'undefined' && scene === nRoom)) return 'home'; if (festOn()) return 'fest'; if (wet() || weatherOf() === 'snow') return 'rain'; return isNight() ? 'night' : 'day';
}
function musicTick() {
  const c = AU.ctx; if (!c || c.state !== 'running' || typeof player === 'undefined' || !player) return;
  const tk = TRACKS[trackNow()], beat = 60 / tk.bpm / 2, root = ROOT[seasonOf().i];
  while (AU.next < c.currentTime + .3) {
    const s = AU.step++, bar = Math.floor(s / 8), mel = tk.mel[bar % tk.mel.length], d = mel[s % 8];
    if (d !== null && d !== undefined) note(root + SCALE[d] + 12, AU.next, beat * 1.6, tk.wave, .5, AU.mus);
    if (s % 4 === 0) note(root + SCALE[tk.bass[(s / 4 | 0) % 4]] - 12, AU.next, beat * 3, 'triangle', .7, AU.mus);
    AU.next += beat;
  }
  AU.rainG.gain.setTargetAtTime(scene === town && wet() ? .12 : 0, c.currentTime, .5);
}
// ---- hooks ----
const _fx8 = fx; fx = d => { _fx8(d); if (d.money > 0) sfx('coin'); else if ((d.mood || 0) <= -8) sfx('bad'); };
const _toast8 = toast; toast = t => { _toast8(t); sfx(/level|🏆|🎉|💒|🎂/i.test(t) ? 'level' : 'pop'); };
const _openMenu8 = openMenu; openMenu = (n, o) => { sfx('click'); _openMenu8(n, o); };
const _openPanel8 = openPanel; openPanel = (t, b) => { sfx('click'); _openPanel8(t, b); };
const _end8 = endMini; endMini = s => { sfx(s >= .5 ? 'ok' : 'bad'); _end8(s); };
const _enter8 = enter; enter = (a, b, c, d) => { _enter8(a, b, c, d); sfx('door'); };
console.assert(Object.keys(TRACKS).every(k => TRACKS[k].mel.every(m => m.length === 8)), 'tracks are 8 steps per bar');
