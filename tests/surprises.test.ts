import { describe, expect, it } from 'vitest';
import { MISSION_CONTROL, isSurpriseSlot, surpriseFor } from '../src/core/surprises';
import type { SurpriseCtx } from '../src/core/surprises';

const calm = (days: number): SurpriseCtx => ({ stormToday: false, dustToday: false, brokenToday: false, days });

describe('surprise events', () => {
  it('is deterministic', () => {
    for (let lvl = 1; lvl <= 12; lvl++) {
      for (let day = 1; day <= 6; day++) {
        const w = lvl <= 5 ? 'moon' : 'mars';
        expect(surpriseFor(lvl, w, day, 2, calm(6))).toEqual(surpriseFor(lvl, w, day, 2, calm(6)));
      }
    }
  });

  it('gives a control hello on day 1 of levels 1 and 6', () => {
    const a = surpriseFor(1, 'moon', 1, 0, calm(4));
    const b = surpriseFor(6, 'mars', 1, 3, calm(4));
    expect(a?.kind).toBe('control');
    expect(b?.kind).toBe('control');
    expect(a?.delayText).toContain('1.3 seconds');
    expect(b?.delayText).toContain('minutes');
  });

  it('never puts surprise slots on two days in a row', () => {
    for (let lvl = 1; lvl <= 12; lvl++) {
      for (let variant = 0; variant < 20; variant++) {
        for (let day = 2; day <= 10; day++) {
          expect(isSurpriseSlot(lvl, day, variant) && isSurpriseSlot(lvl, day - 1, variant)).toBe(false);
        }
      }
    }
  });

  it('has about one surprise every 2 to 3 days', () => {
    let slots = 0;
    let total = 0;
    for (let lvl = 1; lvl <= 12; lvl++) {
      for (let variant = 0; variant < 40; variant++) {
        for (let day = 2; day <= 6; day++) {
          total++;
          if (isSurpriseSlot(lvl, day, variant)) slots++;
        }
      }
    }
    const rate = slots / total;
    expect(rate).toBeGreaterThan(0.25);
    expect(rate).toBeLessThan(0.5);
  });

  it('gives no surprise on storm, dust or failure days', () => {
    for (let lvl = 1; lvl <= 12; lvl++) {
      for (let variant = 0; variant < 10; variant++) {
        for (let day = 1; day <= 8; day++) {
          const w = lvl <= 5 ? 'moon' : 'mars';
          for (const k of ['stormToday', 'dustToday', 'brokenToday'] as const) {
            expect(surpriseFor(lvl, w, day, variant, { ...calm(8), [k]: true })).toBeNull();
          }
        }
      }
    }
  });

  it('keeps the last day clear and uses only valid kinds per world', () => {
    const seen = new Set<string>();
    for (let lvl = 1; lvl <= 12; lvl++) {
      for (let variant = 0; variant < 30; variant++) {
        const w = lvl <= 5 ? 'moon' : 'mars';
        expect(surpriseFor(lvl, w, 5, variant, calm(5))).toBeNull();
        for (let day = 1; day <= 4; day++) {
          const s = surpriseFor(lvl, w, day, variant, calm(5));
          if (!s) continue;
          seen.add(`${w}:${s.kind}`);
          if (w === 'moon') expect(s.kind).not.toBe('dustpass');
          expect(s.fact.length).toBeGreaterThan(10);
        }
      }
    }
    expect(seen.has('moon:meteors')).toBe(true);
    expect(seen.has('mars:dustpass')).toBe(true);
    expect(seen.has('mars:control')).toBe(true);
  });

  it('control messages have a fact and an https source', () => {
    for (const w of ['moon', 'mars'] as const) {
      expect(MISSION_CONTROL[w].length).toBeGreaterThanOrEqual(4);
      for (const m of MISSION_CONTROL[w]) {
        expect(m.text.startsWith('Hello from home')).toBe(true);
        expect(m.fact.length).toBeGreaterThan(20);
        expect(m.source.url.startsWith('https://')).toBe(true);
        expect(m.text + m.fact).not.toContain('—');
      }
    }
  });

  it('meteor surprises ask for a positive number of rocks', () => {
    for (let variant = 0; variant < 50; variant++) {
      const s = surpriseFor(2, 'moon', 2, variant, calm(6)) ?? surpriseFor(2, 'moon', 3, variant, calm(6));
      if (s?.kind === 'meteors') expect(s.rocks).toBeGreaterThan(0);
    }
  });
});
