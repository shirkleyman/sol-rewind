import { canDo, evaluate, liveState, stormFor } from './rules';
import { mulberry32 } from './rng';
import type { Action, LevelConfig, Plan, StationId } from './types';

export interface SolveResult {
  episodes: number;
  finished: number;
  stars: [number, number, number, number];
  best: { stars: number; sci: number; dose: number; plan: Plan } | null;
}

/** Randomised play with a mild "sensible player" bias. m is the mini game yield every action gets. */
export function sample(level: LevelConfig, m: number, episodes: number, seed = 7): SolveResult {
  const rnd = mulberry32(seed);
  const res: SolveResult = { episodes, finished: 0, stars: [0, 0, 0, 0], best: null };
  for (let n = 0; n < episodes; n++) {
    const plan: Plan = [];
    let dead = false;
    for (let d = 1; d <= level.days && !dead; d++) {
      const acts: Action[] = [];
      for (let a = 0; a < level.actions; a++) {
        const S = liveState(level, plan, acts);
        const opts = level.stations.filter((k) => canDo(level, S, k, d) === null);
        if (!opts.length || (a > 0 && rnd() < 0.08)) break;
        const prefer: StationId[] = [];
        if (S.p < 35 && opts.includes('power')) prefer.push('power');
        if (S.w < 30 && opts.includes('water')) prefer.push('water');
        if (S.broken && opts.includes('repair')) prefer.push('repair');
        if (stormFor(level, d) && !acts.some((x) => x.k === 'shield') && opts.includes('shield')) prefer.push('shield');
        if (S.e < 40 && opts.includes('rest')) prefer.push('rest');
        const k = prefer.length && rnd() < 0.7 ? prefer[Math.floor(rnd() * prefer.length)] : opts[Math.floor(rnd() * opts.length)];
        acts.push({ k, m });
      }
      if (!acts.length) {
        dead = true;
        break;
      }
      plan.push(acts);
      if (evaluate(level, plan, 0).failed) dead = true;
    }
    const ev = evaluate(level, plan, 0);
    if (ev.finished) {
      res.finished++;
      res.stars[ev.stars]++;
      if (!res.best || ev.stars > res.best.stars || (ev.stars === res.best.stars && ev.S.s > res.best.sci)) {
        res.best = { stars: ev.stars, sci: ev.S.s, dose: ev.dose, plan };
      }
    }
  }
  return res;
}
