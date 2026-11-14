import { audioCtx } from './audio';

let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

function audio(): AudioContext | null {
  return enabled ? audioCtx() : null;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, delay = 0): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => tone(520, 0.07, 'triangle'),
  tap: () => tone(680, 0.05, 'square', 0.04),
  good: () => [523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, i * 0.09)),
  perfect: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.09, i * 0.09)),
  bad: () => [300, 220].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.06, i * 0.12)),
  alarm: () => [880, 660, 880].forEach((f, i) => tone(f, 0.12, 'square', 0.05, i * 0.14)),
  step: () => tone(240, 0.05, 'triangle', 0.03),
  win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.1)),
};
