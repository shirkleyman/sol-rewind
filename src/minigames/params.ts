import { clamp } from './types';

/**
 * Every difficulty number of every mini game lives here, so the games and the difficulty model
 * (tools/difficulty.ts) always use the same values. d goes from 0 (gentle) to 1 (hard).
 */
export const P = {
  power: (d: number) => ({ half: 0.125 - 0.05 * d, speed: 1.4 + 0.9 * d, drifts: d > 0.6, rounds: 2 + Math.round(3 * d) }),
  water: (d: number) => ({ target: 16 + 12 * d, clogs: d >= 0.55 }),
  shield: (d: number, storm: number) => ({ total: 8 + Math.round(8 * d) + Math.round(5 * storm), fall: 2.4 - 0.7 * d, gap: 750 - 180 * d, decoy: 0.22 * d }),
  plants: (d: number) => ({ pairs: 3 + Math.round(5 * d), flip: Math.round(800 - 350 * d), peek: d < 0.3 ? 1500 : 0 }),
  plantsScore: (moves: number, pairs: number) => clamp(1 - (moves - pairs) / (pairs * 3), 0.2, 1),
  rocks: (d: number) => ({ len: 3 + Math.round(5 * d), nColors: d < 0.35 ? 3 : d < 0.75 ? 4 : 5, step: 650 - 200 * d }),
  sensor: (d: number) => ({ rounds: 3 + Math.round(3 * d), best: 370 - 80 * d, worst: 950 - 200 * d, decoyChance: d > 0.5 ? 0.5 * d : 0 }),
  rest: (d: number) => ({ beats: 4 + Math.round(5 * d), interval: 900 - 250 * d }),
  repair: (d: number) => ({ total: 6 + Math.round(6 * d), gap: 850 - 200 * d, ttl: 1500 - 400 * d }),
};
