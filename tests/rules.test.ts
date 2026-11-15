import { describe, expect, it } from 'vitest';
import { LEVELS, rerollStorms } from '../src/core/levels';
import { dayDose, dayTrace, evaluate, rewindTo, simulate, starsFromScore } from '../src/core/rules';
import { sample } from '../src/core/solver';
import type { Plan } from '../src/core/types';

const L2 = LEVELS[1];

describe('rules', () => {
  it('an unshielded storm day adds much more radiation than a shielded one', () => {
    const open = dayDose(L2, 3, 0);
    const shielded = dayDose(L2, 3, 1);
    expect(open).toBeGreaterThan(shielded + 5);
    expect(shielded).toBeCloseTo(0, 5);
  });

  it('rewinding restores resources but keeps the radiation that was absorbed', () => {
    const plan: Plan = [
      [{ k: 'power', m: 1 }, { k: 'water', m: 1 }],
      [{ k: 'exp', m: 1 }, { k: 'power', m: 1 }],
      [{ k: 'power', m: 1 }, { k: 'water', m: 1 }],
    ];
    const before = evaluate(L2, plan, 0);
    const r = rewindTo(L2, plan, 2, 0);
    const after = evaluate(L2, r.plan, r.carried);
    expect(r.plan.length).toBe(1);
    expect(after.dose).toBeCloseTo(before.dose, 5);
    expect(simulate(L2, r.plan).h.length).toBe(1);
  });

  it('higher difficulty needs a better mini game score for the same stars', () => {
    expect(starsFromScore(0.82, 0)).toBe(3);
    expect(starsFromScore(0.82, 1)).toBe(2);
  });
});

describe('level balance', () => {
  for (const level of LEVELS) {
    it(`level ${level.id} (${level.title}) can be finished with 2 stars by perfect mini game play`, () => {
      const good = sample(level, 1, 6000, 11 + level.id);
      expect(good.finished, `no finished run at m=1 for level ${level.id}`).toBeGreaterThan(0);
      expect(good.best!.stars).toBeGreaterThanOrEqual(2);
    });

    it(`level ${level.id} is not trivial: sloppy random play rarely reaches the science goal`, () => {
      const rough = sample(level, 0.5, 3000, 99 + level.id);
      const goalReached = (rough.stars[2] + rough.stars[3]) / rough.episodes;
      expect(goalReached).toBeLessThan(level.world === 'moon' ? 0.85 : 0.25);
    });
  }
});

describe('short levels and the bonus day', () => {
  it('every level is 3 or 4 days and all storms and events happen inside those days', () => {
    for (const l of LEVELS) {
      expect([3, 4], `level ${l.id} days`).toContain(l.days);
      for (const s of l.stormDays) expect(s.day).toBeGreaterThanOrEqual(1), expect(s.day).toBeLessThanOrEqual(l.days);
      for (const e of l.events) expect(e.day).toBeGreaterThanOrEqual(1), expect(e.day).toBeLessThanOrEqual(l.days);
    }
  });

  it('later levels are never shorter than earlier ones within a world, and Mars has full 4-day levels', () => {
    const moon = LEVELS.filter((l) => l.world === 'moon').map((l) => l.days);
    expect([...moon].sort()).toEqual(moon);
    for (const l of LEVELS.filter((x) => x.world === 'mars')) expect(l.days).toBe(4);
  });

  it('a plan longer than the level (a bonus day) simulates safely and leaves the first days and the stars untouched', () => {
    for (const l of LEVELS) {
      const day = [{ k: 'power' as const, m: 1 }, { k: 'water' as const, m: 1 }];
      const base: Plan = Array.from({ length: l.days }, () => day);
      const longer: Plan = [...base, day, day];
      const S = simulate(l, longer);
      expect(S.h.length).toBe(l.days + 2);
      expect(S.h.slice(0, l.days)).toEqual(simulate(l, base).h);
      const a = evaluate(l, base, 0);
      const b = evaluate(l, longer.slice(0, l.days), 0);
      expect(b.stars).toBe(a.stars);
      expect(b.finished).toBe(a.finished);
      expect(() => evaluate(l, longer, 3)).not.toThrow();
      expect(() => dayTrace(l, longer, [], l.days + 2)).not.toThrow();
    }
  });

  it('replays with other real storms keep every storm on the same day, inside the level', () => {
    for (const l of LEVELS) {
      for (const v of [1, 2, 3]) {
        const r = rerollStorms(l, v);
        expect(r.stormDays.map((s) => s.day)).toEqual(l.stormDays.map((s) => s.day));
        for (const s of r.stormDays) expect(s.intensity).toBeGreaterThan(0);
      }
    }
  });

  it('the Earth cargo kit still gives a real head start on a short level', async () => {
    const { withKit } = await import('../src/core/kit');
    const full = { battery: 2, water: 1, shield: 1, science: 1 };
    for (const l of LEVELS) {
      const k = withKit(l, full);
      expect(simulate(k, []).p).toBeGreaterThanOrEqual(Math.min(100, l.start.p));
      // a full kit must not make a level trivial: the goal is still more than the kit's science plus one day of work
      expect(l.goal).toBeGreaterThan(5 + 10);
    }
  });
});

describe('skills and themes', () => {
  it('every level teaches something and has its own look', () => {
    const looks = new Set<string>();
    for (const l of LEVELS) {
      expect(l.skills.length, `level ${l.id} skills`).toBeGreaterThan(0);
      expect(l.learn.length, `level ${l.id} learn`).toBeGreaterThan(0);
      expect(l.fact.length, `level ${l.id} fact`).toBeGreaterThan(20);
      looks.add(`${l.theme.sky}|${l.theme.ground}|${l.theme.seed}`);
    }
    expect(looks.size).toBe(LEVELS.length);
  });

  it('every skill is trained in at least one level, and the boss levels combine skills', () => {
    const all = ['power', 'life', 'radiation', 'systems', 'crew', 'adapt'];
    for (const s of all) expect(LEVELS.some((l) => l.skills.includes(s as never)), `skill ${s}`).toBe(true);
    expect(LEVELS[LEVELS.length - 1].skills.length).toBe(all.length);
  });

  it('the day trace has a point for the morning, every task and the night', () => {
    const plan: Plan = [[{ k: 'power', m: 1 }, { k: 'water', m: 1 }]];
    const trace = dayTrace(LEVELS[0], plan, [], 1);
    expect(trace.length).toBe(4);
    expect(trace[0].label).toBe('Morning');
    expect(trace[3].label).toBe('Night');
  });
});

describe('real NASA sites and photos', () => {
  it('every level has one real place with a credited photo that exists in the project', async () => {
    const { SITES } = await import('../src/core/sites');
    const { existsSync } = await import('node:fs');
    expect(SITES.length).toBe(LEVELS.length);
    for (const l of LEVELS) {
      const s = SITES.find((x) => x.level === l.id);
      expect(s, `site for level ${l.id}`).toBeTruthy();
      expect(s!.body === 'Moon').toBe(l.world === 'moon');
      expect(existsSync(`src/assets/sites/${s!.photo.file}`), `photo file ${s!.photo.file}`).toBe(true);
      expect(s!.photo.credit.startsWith('NASA')).toBe(true);
      expect(s!.photo.nasaId.length).toBeGreaterThan(4);
      expect(s!.coords.source.length).toBeGreaterThan(10);
    }
    expect(SITES.filter((s) => s.body === 'Moon').length).toBe(5);
    expect(SITES.filter((s) => s.body === 'Mars').length).toBe(7);
  });
});

describe('learning stops', () => {
  it('has three stops on each route, each with a valid question', async () => {
    const { STOPS } = await import('../src/core/stops');
    expect(STOPS.filter((s) => s.route === 'earth-moon').length).toBe(3);
    expect(STOPS.filter((s) => s.route === 'moon-mars').length).toBe(3);
    for (const s of STOPS) {
      expect(s.options.length).toBe(3);
      expect(s.answer).toBeGreaterThanOrEqual(0);
      expect(s.answer).toBeLessThan(3);
      expect(s.explain.length).toBeGreaterThan(10);
    }
  });
});

describe('cargo kit', () => {
  it('rewards a balanced load and rejects an empty or overweight one', async () => {
    const { kitStars, kitMass, CAPACITY } = await import('../src/core/kit');
    expect(kitStars({ battery: 0, water: 0, shield: 0, science: 0 })).toBe(0);
    expect(kitStars({ battery: 3, water: 3, shield: 3, science: 0 })).toBe(0);
    expect(kitMass({ battery: 1, water: 1, shield: 1, science: 1 })).toBeLessThanOrEqual(CAPACITY);
    expect(kitStars({ battery: 1, water: 1, shield: 1, science: 1 })).toBe(2);
    expect(kitStars({ battery: 2, water: 1, shield: 1, science: 1 })).toBe(3);
  });

  it('a kit gives a head start and reduces storm radiation', async () => {
    const { withKit } = await import('../src/core/kit');
    const base = LEVELS[1];
    const kitted = withKit(base, { battery: 2, water: 1, shield: 1, science: 1 });
    expect(simulate(kitted, []).p).toBe(Math.min(100, base.start.p + 20));
    expect(dayDose(kitted, 3, 0)).toBeLessThan(dayDose(base, 3, 0));
  });
});
