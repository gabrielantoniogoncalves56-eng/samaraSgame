/**
 * sound.js — efeitos sonoros simples via Web Audio API (sem arquivos).
 */
let ctx = null;
let enabled = localStorage.getItem('rotas_sound') !== 'off';

function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, durationMs, type = 'sine', gain = 0.07, delayMs = 0) {
  if (!enabled) return;
  try {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type; osc.frequency.value = freq; g.gain.value = gain;
    osc.connect(g).connect(c.destination);
    const start = c.currentTime + delayMs / 1000;
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.start(start); osc.stop(start + durationMs / 1000 + 0.02);
  } catch (e) { /* ignora */ }
}
export const sfx = {
  click: () => tone(520, 60, 'triangle', 0.05),
  place: () => { tone(400, 70, 'triangle', 0.08); tone(600, 90, 'triangle', 0.06, 60); },
  draw: () => tone(720, 60, 'square', 0.04),
  turnStart: () => { tone(440, 100, 'sine'); tone(660, 140, 'sine', 0.06, 100); },
  correct: () => { tone(660, 90, 'triangle', 0.09); tone(880, 140, 'triangle', 0.09, 90); },
  wrong: () => tone(220, 220, 'sawtooth', 0.07),
  victory: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 220, 'triangle', 0.09, i * 130)),
};
export function isSoundOn() { return enabled; }
export function toggleSound() {
  enabled = !enabled;
  localStorage.setItem('rotas_sound', enabled ? 'on' : 'off');
  if (enabled) sfx.click();
  return enabled;
}
