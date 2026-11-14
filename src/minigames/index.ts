import { expForDay } from '../core/rules';
import type { LevelConfig, StationId } from '../core/types';
import { repair, rest } from './care';
import { plants, rocks, sensor } from './experiments';
import { power } from './power';
import { shield } from './shield';
import type { MiniGame } from './types';
import { water } from './water';

export const GAMES: Record<string, MiniGame> = { power, water, shield, plants, rocks, sensor, rest, repair };

export function gameFor(level: LevelConfig, station: StationId, day: number): MiniGame {
  if (station === 'exp') return GAMES[expForDay(level, day)];
  return GAMES[station];
}

export type { MiniGame, GameCtx } from './types';
