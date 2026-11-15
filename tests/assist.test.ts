import { describe, expect, it } from 'vitest';
import { assistLevel, easedDifficulty, GAME_TIPS, nextStreak } from '../src/core/assist';

describe('assist', () => {
  it('counts rough runs in a row and resets on a good run', () => {
    expect(nextStreak(0, 1)).toBe(1);
    expect(nextStreak(1, 1)).toBe(2);
    expect(nextStreak(3, 2)).toBe(0);
    expect(nextStreak(3, 3)).toBe(0);
  });

  it('gives help after two and four rough runs and never takes it away', () => {
    expect(assistLevel(1, 0)).toBe(0);
    expect(assistLevel(2, 0)).toBe(1);
    expect(assistLevel(4, 1)).toBe(2);
    expect(assistLevel(9, 0)).toBe(2);
    expect(assistLevel(0, 2)).toBe(2);
  });

  it('lowers the difficulty but never below zero', () => {
    expect(easedDifficulty(0.8, 0)).toBe(0.8);
    expect(easedDifficulty(0.8, 1)).toBeCloseTo(0.55);
    expect(easedDifficulty(0.8, 2)).toBeCloseTo(0.3);
    expect(easedDifficulty(0.1, 2)).toBe(0);
  });

  it('has a tip for every mini game', () => {
    for (const id of ['power', 'water', 'shield', 'plants', 'rocks', 'sensor', 'rest', 'repair']) expect(GAME_TIPS[id]).toBeTruthy();
  });
});
