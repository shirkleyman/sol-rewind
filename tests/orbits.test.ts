import { describe, expect, it } from 'vitest';
import { distanceRange, marsOrbitPoints, orbitAt, START_DAYS } from '../src/core/orbits';

describe('Earth and Mars distance', () => {
  it('stays inside the well known range of about 55 to 400 million km', () => {
    const { min, max } = distanceRange();
    expect(min).toBeGreaterThan(52);
    expect(min).toBeLessThan(68);
    expect(max).toBeGreaterThan(385);
    expect(max).toBeLessThan(405);
  });

  it('gives a radio delay of about 3 to 22 minutes', () => {
    const { min, max } = distanceRange();
    const t = (m: number) => m / 0.299792458 / 60;
    expect(t(min)).toBeGreaterThan(2.8);
    expect(t(max)).toBeLessThan(23);
  });

  it('is finite at the start and the orbit is a closed loop', () => {
    expect(Number.isFinite(orbitAt(START_DAYS).mkm)).toBe(true);
    const pts = marsOrbitPoints(60);
    expect(pts[0].x).toBeCloseTo(pts[60].x);
    expect(pts[0].y).toBeCloseTo(pts[60].y);
  });
});
