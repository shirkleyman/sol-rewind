export interface GameCtx {
  /** Aborted when the player leaves the mini game, so timers must stop. */
  signal: AbortSignal;
  /** 0..1 intensity of the real solar storm today (0 when there is none). */
  storm: number;
  /** Where the mission is, so a game can feel different on the Moon and on Mars. */
  world: 'moon' | 'mars';
  /** Url of the real NASA photo of this level's place (used by the rock scan reward). */
  photo: string;
}

/**
 * Every mini game follows this contract:
 *  - start() draws into `el`, plays for a few seconds, then calls done(score) once with a score from 0 to 1.
 *  - `d` is the difficulty from 0 (gentle) to 1 (hard). The game decides what that means for speed, size and count.
 */
export interface MiniGame {
  id: string;
  title: string;
  help: string;
  start(el: HTMLElement, d: number, done: (score: number) => void, ctx: GameCtx): void;
}

export const clamp = (v: number, lo = 0, hi = 1): number => Math.max(lo, Math.min(hi, v));
export const avg = (a: number[]): number => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

export function once(done: (s: number) => void): (s: number) => void {
  let fired = false;
  return (s: number) => {
    if (fired) return;
    fired = true;
    done(clamp(s));
  };
}

/** setTimeout that is cancelled automatically when the signal aborts. */
export function later(fn: () => void, ms: number, signal: AbortSignal): void {
  const t = window.setTimeout(() => {
    if (!signal.aborted) fn();
  }, ms);
  signal.addEventListener('abort', () => clearTimeout(t), { once: true });
}

export function q<T extends HTMLElement>(el: HTMLElement, sel: string): T {
  const x = el.querySelector<T>(sel);
  if (!x) throw new Error(`missing ${sel}`);
  return x;
}
