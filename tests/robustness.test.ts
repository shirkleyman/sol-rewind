import { describe, expect, it } from 'vitest';
import { LEVELS, STORMS, rerollStorms } from '../src/core/levels';
import { rewindTo, simulate } from '../src/core/rules';
import { sanitizeSave } from '../src/core/storage';
import { kitEffects } from '../src/core/kit';
import { skillById } from '../src/core/skills';
import type { Plan } from '../src/core/types';

describe('saved games', () => {
  it('rebuilds a partial save without NaN', () => {
    const s = sanitizeSave({ v: 1, stars: [0, 1, 2] as number[], kit: { battery: 2 } as never });
    expect(s.stars).toHaveLength(16);
    const fx = kitEffects(s.kit);
    expect(Object.values(fx).every(Number.isFinite)).toBe(true);
    expect(s.lessons).toEqual([]);
    expect(s.helmet).toBe('white');
  });

  it('survives wrong types', () => {
    const s = sanitizeSave({ v: 1, stars: ['a', null, 9, -4, 2.6] as never, kit: null as never, best: null as never, stops: 'x' as never, lessons: 5 as never, name: 7 as never, rocks: 'many' as never, helmet: 3 as never });
    expect(s.stars.slice(0, 5)).toEqual([0, 0, 3, 0, 3]);
    expect(s.best).toEqual({});
    expect(s.stops).toEqual([]);
    expect(s.name).toBe('');
    expect(s.rocks).toBe(0);
  });

  it('cleans a name and keeps valid data', () => {
    const s = sanitizeSave({ v: 1, stars: Array(16).fill(1), name: '  <b>Ma\'ayan</b> & "Co"  ', best: { 3: { sci: 12, dose: 8 }, x: { sci: 1, dose: 1 } } as never, kit: { battery: 9, water: 1, shield: 0, science: 0 }, stops: ['orbit', 4] as never });
    expect(s.name).toBe("bMa'ayan/b Co");
    expect(s.best).toEqual({ 3: { sci: 12, dose: 8 } });
    expect(s.kit.battery).toBe(3);
    expect(s.stops).toEqual(['orbit']);
  });
});

describe('level data', () => {
  it('has real storms in every band the levels use', () => {
    for (const l of LEVELS) for (const s of l.stormDays) expect(STORMS.some((x) => x.band === s.band)).toBe(true);
  });

  it('keeps storms, events and stations inside each level', () => {
    for (const l of LEVELS) {
      for (const s of l.stormDays) expect(s.day).toBeGreaterThanOrEqual(1), expect(s.day).toBeLessThanOrEqual(l.days);
      for (const e of l.events) {
        expect(e.day).toBeGreaterThanOrEqual(1);
        expect(e.day).toBeLessThanOrEqual(l.days);
        if (e.type === 'failure' && e.station && e.station !== 'exp') expect(l.stations).toContain(e.station);
      }
      if (l.stormDays.length) expect(l.stations).toContain('shield');
      for (const id of l.skills) expect(skillById(id)).toBeTruthy();
      expect(l.fact.length).toBeGreaterThan(10);
    }
  });

  it('gives a different set of storms on every replay variant', () => {
    const l = LEVELS.find((x) => x.stormDays.length >= 2)!;
    const seen = new Set<string>();
    for (let v = 0; v <= 7; v++) seen.add(rerollStorms(l, v).stormDays.map((s) => s.id).join(','));
    expect(seen.size).toBe(8);
    expect(() => rerollStorms(l, -3)).not.toThrow();
  });
});

describe('rewind', () => {
  it('never rewinds before day 1', () => {
    const l = LEVELS[2];
    const plan: Plan = [[{ k: 'power', m: 1 }], [{ k: 'water', m: 1 }]];
    const out = rewindTo(l, plan, 0, 0);
    expect(out.plan).toHaveLength(0);
    expect(out.carried).toBeCloseTo(simulate(l, plan).g.reduce((a, b) => a + b, 0));
  });

  it('can rewind to the day after the last one without losing anything', () => {
    const l = LEVELS[2];
    const plan: Plan = [[{ k: 'power', m: 1 }]];
    const out = rewindTo(l, plan, 99, 5);
    expect(out.plan).toHaveLength(1);
    expect(out.carried).toBe(5);
  });
});
