import type { Action, Cost, DayRecord, Evaluation, ExpId, LevelConfig, Plan, SimState, StationId, Verdict } from './types';

export const BASE_DOSE = 4;
export const STORM_MAX = 40;
export const DOSE_LIMIT = 100;
export const STAR_YIELD = [0, 0.5, 0.8, 1] as const;

export interface ExpDef {
  name: string;
  cost: Cost;
  sci: number;
  blurb: string;
}

export const EXP_DEFS: Record<ExpId, ExpDef> = {
  plants: { name: 'Grow plants', cost: { w: 10, e: 15 }, sci: 10, blurb: 'Seeds need water and a steady hand. Fresh food gives the astronaut a little energy back.' },
  rocks: { name: 'Rock scan', cost: { p: 20, e: 20 }, sci: 12, blurb: 'Copy the sample pattern from the scanner.' },
  sensor: { name: 'Dust sensor', cost: { p: 10, e: 15 }, sci: 9, blurb: 'Tap the instant the sensor light turns green.' },
};

const scale = (c: Cost, m: number): Cost => ({
  p: c.p ? Math.round(c.p * m) : 0,
  w: c.w ? Math.round(c.w * m) : 0,
  e: c.e ? Math.round(c.e * m) : 0,
});

export function expForDay(level: LevelConfig, day: number): ExpId {
  return level.exps[(day - 1) % level.exps.length];
}

export function costOf(level: LevelConfig, k: StationId, day: number): Cost {
  const m = level.costMult;
  switch (k) {
    case 'water':
      return scale({ p: 10, e: 10 }, m);
    case 'power':
      return scale({ e: 10 }, m);
    case 'shield':
      return scale({ p: 15, e: 10 }, m);
    case 'rest':
      return scale({ p: 5 }, m);
    case 'repair':
      return scale({ p: 10, e: 10 }, m);
    default:
      return scale(EXP_DEFS[expForDay(level, day)].cost, m);
  }
}

export function stationLabel(level: LevelConfig, k: StationId, day: number): string {
  switch (k) {
    case 'exp':
      return EXP_DEFS[expForDay(level, day)].name;
    case 'water':
      return 'Water recycler';
    case 'power':
      return 'Solar charger';
    case 'shield':
      return 'Radiation shield';
    case 'rest':
      return 'Rest pod';
    case 'repair':
      return 'Repair bay';
  }
}

export function costText(c: Cost): string {
  const parts: string[] = [];
  if (c.p) parts.push(`-${c.p} power`);
  if (c.w) parts.push(`-${c.w} water`);
  if (c.e) parts.push(`-${c.e} energy`);
  return parts.join(', ') || 'free';
}

export function stormFor(level: LevelConfig, day: number) {
  return level.stormDays.find((s) => s.day === day) ?? null;
}

export function newState(level: LevelConfig): SimState {
  const k = level.kit;
  return { p: Math.min(100, level.start.p + (k?.p ?? 0)), w: Math.min(100, level.start.w + (k?.w ?? 0)), e: level.start.e, s: k?.s ?? 0, g: [], h: [], prot: 0, failed: false, broken: null, dust: false };
}

export function startDay(level: LevelConfig, S: SimState, day: number): void {
  S.prot = 0;
  S.dust = level.events.some((ev) => ev.day === day && ev.type === 'dust');
  const f = level.events.find((ev) => ev.day === day && ev.type === 'failure');
  S.broken = f?.station ?? null;
}

export function yieldAmount(level: LevelConfig, S: SimState, k: StationId, m: number, day: number): number {
  switch (k) {
    case 'power':
      return 30 * m * level.sun * (S.dust ? 0.5 : 1);
    case 'water':
      return 25 * m;
    case 'rest':
      return 35 * m;
    case 'shield':
      return m;
    case 'exp':
      return EXP_DEFS[expForDay(level, day)].sci * m;
    default:
      return m >= 0.5 ? 1 : 0;
  }
}

export function applyAction(level: LevelConfig, S: SimState, a: Action, day: number): void {
  const c = costOf(level, a.k, day);
  S.p -= c.p ?? 0;
  S.w -= c.w ?? 0;
  S.e -= c.e ?? 0;
  const y = yieldAmount(level, S, a.k, a.m, day);
  switch (a.k) {
    case 'power':
      S.p = Math.min(100, S.p + y);
      break;
    case 'water':
      S.w = Math.min(100, S.w + y);
      break;
    case 'rest':
      S.e = Math.min(100, S.e + y);
      break;
    case 'shield':
      S.prot = Math.max(S.prot, y);
      break;
    case 'exp':
      S.s += y;
      if (expForDay(level, day) === 'plants') S.e = Math.min(100, S.e + 6 * a.m);
      break;
    case 'repair':
      if (y > 0) S.broken = null;
      break;
  }
}

export function dayDose(level: LevelConfig, day: number, prot: number): number {
  const st = stormFor(level, day);
  const raw = BASE_DOSE + (st ? STORM_MAX * st.intensity : 0);
  return raw * (1 - prot) * (1 - (level.kit?.doseCut ?? 0));
}

export function endDay(level: LevelConfig, S: SimState, day: number): void {
  S.g.push(dayDose(level, day, S.prot));
  S.p -= level.lifeSupport;
  S.w -= level.crewWater;
  if (S.p < 0 || S.w < 0) S.failed = true;
  S.p = Math.max(0, S.p);
  S.w = Math.max(0, S.w);
  S.e = Math.min(100, Math.max(0, S.e) + 30);
  const rec: DayRecord = { p: S.p, w: S.w, e: S.e, s: S.s, g: S.g[S.g.length - 1] };
  S.h.push(rec);
}

export function simulate(level: LevelConfig, plan: Plan): SimState {
  const S = newState(level);
  plan.forEach((acts, i) => {
    startDay(level, S, i + 1);
    acts.forEach((a) => applyAction(level, S, a, i + 1));
    endDay(level, S, i + 1);
  });
  return S;
}

export function liveState(level: LevelConfig, plan: Plan, today: Action[]): SimState {
  const S = simulate(level, plan);
  const day = plan.length + 1;
  startDay(level, S, day);
  today.forEach((a) => applyAction(level, S, a, day));
  return S;
}

export function canDo(level: LevelConfig, S: SimState, k: StationId, day: number): string | null {
  if (S.broken === k) return 'That station is out of order today. Use the repair bay.';
  if (k === 'repair' && !S.broken) return 'Nothing needs repairing today.';
  const c = costOf(level, k, day);
  if (S.p < (c.p ?? 0)) return 'Not enough power for that. Charge the battery first.';
  if (S.w < (c.w ?? 0)) return 'Not enough water for that. Use the water recycler first.';
  if (S.e < (c.e ?? 0)) return 'The astronaut is too tired. Try the rest pod or end the day.';
  return null;
}

export function evaluate(level: LevelConfig, plan: Plan, carried: number): Evaluation {
  const S = simulate(level, plan);
  const dose = carried + S.g.reduce((x, y) => x + y, 0);
  const failed = S.failed || dose >= DOSE_LIMIT;
  const finished = !failed && plan.length >= level.days;
  let stars = 0;
  if (finished) stars = S.s >= level.goal ? (dose <= level.lowDose ? 3 : 2) : 1;
  return { S, dose, failed, finished, stars };
}

export function rewindTo(level: LevelConfig, plan: Plan, kIn: number, carried: number): { plan: Plan; carried: number; lost: number } {
  const k = Math.max(1, Math.min(Math.trunc(kIn) || 1, plan.length + 1));
  const S = simulate(level, plan);
  const lost = S.g.slice(k - 1).reduce((x, y) => x + y, 0);
  return { plan: plan.slice(0, k - 1), carried: carried + lost, lost };
}

export interface TracePoint {
  p: number;
  w: number;
  e: number;
  s: number;
  label: string;
}

/** The state after each part of one day: the start, after every task, and the end of the day. Used for the small graphs in the day strip. */
export function dayTrace(level: LevelConfig, plan: Plan, today: Action[], dayIndex: number): TracePoint[] {
  const done = plan.slice(0, dayIndex - 1);
  const S = simulate(level, done);
  const acts = dayIndex <= plan.length ? plan[dayIndex - 1] : today;
  const day = dayIndex;
  startDay(level, S, day);
  const pts: TracePoint[] = [{ p: S.p, w: S.w, e: S.e, s: S.s, label: 'Morning' }];
  acts.forEach((a) => {
    applyAction(level, S, a, day);
    pts.push({ p: S.p, w: S.w, e: S.e, s: S.s, label: stationLabel(level, a.k, day) });
  });
  if (dayIndex <= plan.length) {
    endDay(level, S, day);
    pts.push({ p: S.p, w: S.w, e: S.e, s: S.s, label: 'Night' });
  }
  return pts;
}

export function dayDelta(level: LevelConfig, S: SimState, i: number) {
  const a = S.h[i - 1];
  const b = i > 1 ? S.h[i - 2] : { p: Math.min(100, level.start.p + (level.kit?.p ?? 0)), w: Math.min(100, level.start.w + (level.kit?.w ?? 0)), s: level.kit?.s ?? 0 };
  const dp = a.p - b.p;
  const dw = a.w - b.w;
  const ds = a.s - b.s;
  const g = a.g;
  const score = (dp + dw) * 0.5 + ds * 2 - g;
  const v: Verdict = score >= 10 ? 'good' : score < 0 ? 'bad' : 'ok';
  return { dp, dw, ds, g, v };
}

export function starsFromScore(score: number, difficulty: number): number {
  const t3 = 0.75 + 0.07 * difficulty;
  const t2 = 0.45 + 0.05 * difficulty;
  return score >= t3 ? 3 : score >= t2 ? 2 : 1;
}
