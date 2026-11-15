import levelsJson from '../data/levels.json';
import stormsJson from '../data/storms.json';
import type { ExpId, GameEvent, LevelConfig, SkillId, StationId, StormDay, Theme, World } from './types';

interface RawLevel {
  id: number;
  world: string;
  title: string;
  blurb: string;
  days: number;
  actions: number;
  stations: string[];
  exps: string[];
  storms: { day: number; band: string; pick: number }[];
  events: { day: number; type: string; station?: string }[];
  sun: number;
  costMult: number;
  crewWater: number;
  lifeSupport: number;
  goal: number;
  lowDose: number;
  difficulty: number;
  start: { p: number; w: number; e: number };
  skills: string[];
  learn: string[];
  fact: string;
  theme: unknown;
}

export interface StormRecord {
  id: string;
  date: string;
  speed: number;
  type: string;
  kp: number;
  sep: boolean;
  intensity: number;
  band: string;
  label: string;
}

export const STORMS = stormsJson.storms as StormRecord[];

function pickStorm(band: string, pick: number): StormRecord {
  const pool = STORMS.filter((s) => s.band === band);
  if (!pool.length) throw new Error(`No real storms in band "${band}"`);
  return pool[((pick % pool.length) + pool.length) % pool.length];
}

export function resolveLevels(raw: RawLevel[] = levelsJson.levels as unknown as RawLevel[]): LevelConfig[] {
  return raw.map((r) => {
    const stormDays: StormDay[] = r.storms.map((s) => {
      const st = pickStorm(s.band, s.pick);
      return { day: s.day, intensity: st.intensity, label: st.label, id: st.id, band: s.band, pick: s.pick };
    });
    return {
      id: r.id,
      world: r.world as World,
      title: r.title,
      blurb: r.blurb,
      days: r.days,
      actions: r.actions,
      stations: r.stations as StationId[],
      exps: r.exps as ExpId[],
      stormDays,
      events: r.events as GameEvent[],
      sun: r.sun,
      costMult: r.costMult,
      crewWater: r.crewWater,
      lifeSupport: r.lifeSupport,
      goal: r.goal,
      lowDose: r.lowDose,
      difficulty: r.difficulty,
      start: r.start,
      theme: r.theme as Theme,
      skills: r.skills as SkillId[],
      learn: r.learn,
      fact: r.fact,
    };
  });
}

/** The same level with other real storms of the same strength, so replays feel different. */
export function rerollStorms(level: LevelConfig, variant: number): LevelConfig {
  if (variant === 0) return level;
  // 3, 6, 9 ... up to 21 steps along each storm list: never 0 or a multiple of the list size, so a replay never repeats the first storms.
  const step = ((((Math.trunc(variant) % 7) + 7) % 7) + 1) * 3;
  return {
    ...level,
    stormDays: level.stormDays.map((s) => {
      const st = pickStorm(s.band ?? 'mild', (s.pick ?? 0) + step);
      return { ...s, intensity: st.intensity, label: st.label, id: st.id };
    }),
  };
}

export const LEVELS: LevelConfig[] = resolveLevels();
export const DATA_DOWNLOADED: string = stormsJson.downloaded;
