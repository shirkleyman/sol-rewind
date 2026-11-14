export type World = 'moon' | 'mars';
export type StationId = 'exp' | 'water' | 'power' | 'shield' | 'rest' | 'repair';
export type ExpId = 'plants' | 'rocks' | 'sensor';
export type SkillId = 'power' | 'life' | 'radiation' | 'systems' | 'crew' | 'adapt';

export interface Cost {
  p?: number;
  w?: number;
  e?: number;
}

export interface StormDay {
  day: number;
  intensity: number;
  label: string;
  id: string;
  band?: string;
  pick?: number;
}

export interface GameEvent {
  day: number;
  type: 'dust' | 'failure';
  station?: StationId;
}

export interface Structure {
  t: 'dome' | 'panels' | 'antenna' | 'dish' | 'module' | 'rover' | 'tower' | 'flag' | 'greenhouse';
  x: number;
  s?: number;
}

/** The look of one level. Every level gets its own place, light and mood. */
export interface Theme {
  setting: string;
  sky: string;
  skyLow?: string;
  ground: string;
  mid: string;
  far: string;
  deck: string;
  accent: string;
  stars: boolean;
  earth: 'big' | 'small' | 'none';
  sun?: { x: number; y: number; r: number; c: string };
  haze?: string;
  ambient: 'stars' | 'dust' | 'sparks' | 'storm' | 'flare' | 'glow';
  structures: Structure[];
  seed: number;
}

export interface LevelConfig {
  id: number;
  world: World;
  title: string;
  blurb: string;
  days: number;
  actions: number;
  stations: StationId[];
  exps: ExpId[];
  stormDays: StormDay[];
  events: GameEvent[];
  sun: number;
  costMult: number;
  crewWater: number;
  lifeSupport: number;
  goal: number;
  lowDose: number;
  difficulty: number;
  start: { p: number; w: number; e: number };
  theme: Theme;
  kit?: { p: number; w: number; s: number; doseCut: number };
  skills: SkillId[];
  learn: string[];
  fact: string;
}

export interface Action {
  k: StationId;
  m: number;
}

export type Plan = Action[][];

export interface DayRecord {
  p: number;
  w: number;
  e: number;
  s: number;
  g: number;
}

export interface SimState {
  p: number;
  w: number;
  e: number;
  s: number;
  g: number[];
  h: DayRecord[];
  prot: number;
  failed: boolean;
  broken: StationId | null;
  dust: boolean;
}

export interface Evaluation {
  S: SimState;
  dose: number;
  failed: boolean;
  finished: boolean;
  stars: number;
}

export type Verdict = 'good' | 'ok' | 'bad';
