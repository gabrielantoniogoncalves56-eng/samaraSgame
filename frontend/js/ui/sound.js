/**
 * sound.js
 * Sistema de áudio modular usando Web Audio API — sem depender de
 * arquivos de áudio externos. Gera tons simples para cada evento.
 */
import { getState, setState } from '../core/state.js';

let ctx = null;
function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, durationMs, type = 'sine', gainValue = 0.08, delayMs = 0) {
  if (!getState().soundOn) return;
  try {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = gainValue;
    osc.connect(gain).connect(c.destination);
    const start = c.currentTime + delayMs / 1000;
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationMs / 1000);
    osc.start(start);
    osc.stop(start + durationMs / 1000 + 0.02);
  } catch (e) { /* áudio indisponível — ignora */ }
}

export const sfx = {
  click: () => tone(520, 70, 'triangle', 0.06),
  questionStart: () => { tone(440, 120, 'sine'); tone(660, 160, 'sine', 0.08, 120); },
  tick: () => tone(880, 40, 'square', 0.03),
  correct: () => { tone(660, 90, 'triangle', 0.09); tone(880, 140, 'triangle', 0.09, 90); },
  wrong: () => { tone(220, 220, 'sawtooth', 0.07); },
  ranking: () => { tone(523, 100, 'sine', 0.07); tone(659, 100, 'sine', 0.07, 100); tone(784, 160, 'sine', 0.08, 200); },
  victory: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 220, 'triangle', 0.09, i * 130));
  },
};

export function toggleSound() {
  const on = !getState().soundOn;
  setState({ soundOn: on });
  localStorage.setItem('gb_sound', on ? 'on' : 'off');
  if (on) sfx.click();
  return on;
}
