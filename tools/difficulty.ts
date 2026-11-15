/**
 * A difficulty model for the mini games and the levels. Run with: npx vite-node tools/difficulty.ts
 *
 * The numbers for how kids play are ASSUMPTIONS, not measurements. "average" stands for a 8 to 9 year old,
 * "good" for a confident 11 to 12 year old. Replace the numbers in SKILL with what real kids do when you test.
 */
import { LEVELS } from '../src/core/levels';
import { canDo, evaluate, expForDay, liveState, starsFromScore, STAR_YIELD, stormFor } from '../src/core/rules';
import { mulberry32 } from '../src/core/rng';
import { withKit } from '../src/core/kit';
import { P } from '../src/minigames/params';
import type { Action, LevelConfig, Plan, StationId } from '../src/core/types';

type Skill = 'average' | 'good';

const SKILL = {
  average: { timingSd: 0.13, tapRate: 4.2, tapSd: 0.6, clogCost: 0.9, shieldTau: 0.45, memoryFactor: 2.0, span: 5.0, spanSd: 1.2, rt: 0.42, rtSd: 0.08, falseStart: 0.08, beatSd: 0.11, repairRt: 0.55 },
  good: { timingSd: 0.08, tapRate: 5.5, tapSd: 0.6, clogCost: 0.6, shieldTau: 0.3, memoryFactor: 1.5, span: 6.2, spanSd: 1.2, rt: 0.32, rtSd: 0.05, falseStart: 0.03, beatSd: 0.07, repairRt: 0.4 },
};

const rnd = mulberry32(2024);
const normal = (m: number, sd: number): number => {
  const u = Math.max(1e-9, rnd());
  const v = rnd();
  return m + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

/** One play of a mini game: returns a score from 0 to 1 for a kid of the given skill at difficulty d. */
function play(game: string, d: number, storm: number, k: Skill): number {
  const s = SKILL[k];
  switch (game) {
    case 'power': {
      const { half, speed, rounds } = P.power(d);
      const scores = Array.from({ length: rounds }, (_, t) => {
        const omega = speed + t * 0.35;
        const dist = Math.abs(normal(0, 0.5 * omega * s.timingSd));
        return dist <= half ? 1 : Math.max(0, 1 - (dist - half) / 0.3);
      });
      return avg(scores);
    }
    case 'water': {
      const { target, clogs } = P.water(d);
      const lost = clogs ? 2 * s.clogCost : 0;
      return Math.min(1, (normal(s.tapRate, s.tapSd) * (6 - lost)) / target);
    }
    case 'shield': {
      const { total, fall, gap, decoy } = P.shield(d, storm);
      const lambda = 1000 / gap;
      const rho = lambda * s.shieldTau;
      const pHit = clamp((fall - 0.35 - 0.4 * rho) / fall, 0.15, 0.97);
      let real = 0;
      let blocked = 0;
      let penalty = 0;
      for (let i = 0; i < total; i++) {
        if (rnd() < decoy) {
          if (rnd() < 0.15) penalty++;
        } else {
          real++;
          if (rnd() < pHit) blocked++;
        }
      }
      return real ? Math.max(0, blocked - penalty) / real : 1;
    }
    case 'plants': {
      const { pairs } = P.plants(d);
      const moves = Math.max(pairs, Math.round(pairs * normal(s.memoryFactor, 0.25)));
      return P.plantsScore(moves, pairs);
    }
    case 'rocks': {
      const { len, nColors, step } = P.rocks(d);
      const span = normal(s.span - (nColors - 3) * 0.5 - 0.8 * d * (650 - step) / 250, s.spanSd);
      let ok = 0;
      for (let i = 0; i < len; i++) {
        if (i < span && rnd() > 0.04) ok++;
        else break;
      }
      return ok / len;
    }
    case 'sensor': {
      const { rounds, best, worst, decoyChance } = P.sensor(d);
      const out: number[] = [];
      for (let r = 0; r < rounds; r++) {
        const decoy = rnd() < decoyChance;
        if (rnd() < s.falseStart + (decoy ? 0.08 : 0)) {
          out.push(0);
          continue;
        }
        const rt = normal(s.rt, s.rtSd) * 1000;
        out.push(clamp(1 - (rt - best) / (worst - best)));
      }
      return avg(out);
    }
    case 'rest': {
      const { beats } = P.rest(d);
      const out: number[] = [];
      for (let i = 0; i < beats; i++) {
        if (rnd() < 0.05) {
          out.push(0);
          continue;
        }
        const e = Math.abs(normal(0, s.beatSd));
        out.push(e <= 0.12 ? 1 : e <= 0.25 ? 0.5 : 0);
      }
      return avg(out);
    }
    case 'repair': {
      const { total, gap, ttl } = P.repair(d);
      const conc = ttl / gap;
      const pHit = clamp((ttl / 1000 - s.repairRt - 0.15 * (conc - 1)) / (ttl / 1000) + 0.1, 0.15, 0.97);
      let fixed = 0;
      for (let i = 0; i < total; i++) if (rnd() < pHit) fixed++;
      return fixed / total;
    }
  }
  return 0.5;
}

function starProbs(game: string, d: number, storm: number, k: Skill, n = 3000): [number, number, number] {
  const c = [0, 0, 0];
  for (let i = 0; i < n; i++) c[starsFromScore(play(game, d, storm, k), d) - 1]++;
  return [c[0] / n, c[1] / n, c[2] / n];
}

const GAMES = ['power', 'water', 'shield', 'plants', 'rocks', 'sensor', 'rest', 'repair'];

function reportGames(): void {
  console.log('MINI GAMES: chance of 1 / 2 / 3 stars (percent) at difficulty d');
  for (const k of ['average', 'good'] as Skill[]) {
    console.log(`\n${k} kid`);
    console.log('game      | d=0.0        | d=0.25       | d=0.5        | d=0.75       | d=1.0');
    for (const g of GAMES) {
      const cells = [0, 0.25, 0.5, 0.75, 1].map((d) => starProbs(g, d, 0.5, k).map((x) => String(Math.round(x * 100)).padStart(2)).join('/'));
      console.log(`${g.padEnd(9)} | ${cells.map((c) => c.padEnd(12)).join(' | ')}`);
    }
  }
}

/** A sensible player: fixes what is broken, shields storms, then keeps power, water and energy healthy. */
function policy(level: LevelConfig, plan: Plan, today: Action[], day: number): StationId | null {
  const S = liveState(level, plan, today);
  const ok = (k: StationId) => level.stations.includes(k) && canDo(level, S, k, day) === null;
  const storm = stormFor(level, day);
  if (S.broken && ok('repair')) return 'repair';
  if (storm && !today.some((a) => a.k === 'shield') && ok('shield')) return 'shield';
  if (S.p < 35 && ok('power')) return 'power';
  if (S.w < 28 && ok('water')) return 'water';
  if (S.e < 35 && ok('rest')) return 'rest';
  if (ok('exp')) return 'exp';
  if (S.p <= S.w && ok('power')) return 'power';
  if (ok('water')) return 'water';
  if (ok('power')) return 'power';
  return null;
}

function runLevel(level: LevelConfig, k: Skill, episodes = 400): { finish: number; ge2: number; ge3: number; stars: number; sci: number; dose: number } {
  let fin = 0;
  let g2 = 0;
  let g3 = 0;
  let st = 0;
  let sci = 0;
  let dose = 0;
  for (let n = 0; n < episodes; n++) {
    const plan: Plan = [];
    for (let day = 1; day <= level.days; day++) {
      const d = Math.min(1, level.difficulty + 0.04 * (day - 1));
      const acts: Action[] = [];
      for (let a = 0; a < level.actions; a++) {
        const pick = policy(level, plan, acts, day);
        if (!pick) break;
        const game = pick === 'exp' ? expForDay(level, day) : pick;
        const stars = starsFromScore(play(game, d, stormFor(level, day)?.intensity ?? 0, k), d);
        acts.push({ k: pick, m: STAR_YIELD[stars] });
      }
      plan.push(acts);
      if (evaluate(level, plan, 0).failed) break;
    }
    const ev = evaluate(level, plan, 0);
    if (process.env.DBG && !ev.finished && n < 3) console.log('FAIL', level.id, k, 'days', plan.length, 'p', ev.S.p, 'w', ev.S.w, 'dose', ev.dose.toFixed(0), JSON.stringify(plan.map((d) => d.map((a) => a.k + a.m))));
    if (ev.finished) {
      fin++;
      st += ev.stars;
      if (ev.stars >= 2) g2++;
      if (ev.stars >= 3) g3++;
      sci += ev.S.s;
      dose += ev.dose;
    }
  }
  const f = Math.max(1, fin);
  return { finish: fin / episodes, ge2: g2 / episodes, ge3: g3 / episodes, stars: st / f, sci: sci / f, dose: dose / f };
}

function reportLevels(): void {
  console.log('\nLEVELS (a sensible player, 400 plays each): finished / 2+ stars / 3 stars, average science and radiation');
  console.log('lvl | world | goal low | average kid                              | good kid');
  const kit = process.env.KIT ? { battery: 2, water: 1, shield: 1, science: 1 } : null;
  if (kit) console.log('(with a full Earth cargo kit: battery 2, water 1, shield 2, science 1)');
  for (const L0 of LEVELS) {
    const L = kit ? withKit(L0, kit) : L0;
    const a = runLevel(L, 'average');
    const g = runLevel(L, 'good');
    const f = (r: ReturnType<typeof runLevel>) => `${String(Math.round(r.finish * 100)).padStart(3)}% / ${String(Math.round(r.ge2 * 100)).padStart(3)}% / ${String(Math.round(r.ge3 * 100)).padStart(3)}%  sci ${r.sci.toFixed(0).padStart(2)} dose ${r.dose.toFixed(0).padStart(2)}`;
    console.log(`${String(L.id).padStart(3)} | ${L.world.padEnd(5)} | ${String(L.goal).padStart(3)} ${String(L.lowDose).padStart(3)} | ${f(a)} | ${f(g)}`);
  }
}

if (!process.env.LEVELS_ONLY) reportGames();
reportLevels();
