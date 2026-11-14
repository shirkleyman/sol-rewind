import { describe, expect, it } from 'vitest';
import { BADGES, HELMETS, MAX_STARS, activeHelmet, cleanName, earnedBadges, helmetColor, totalStars, unlockedHelmets } from '../src/core/avatar';
import type { AvatarSave } from '../src/core/avatar';

const blank = (): AvatarSave => ({ stars: Array(16).fill(0), stops: [], rocks: 0 });

describe('helmets', () => {
  it('starts with white for free and unlocks in order', () => {
    expect(HELMETS[0].id).toBe('white');
    expect(HELMETS[0].need).toBe(0);
    const needs = HELMETS.map((h) => h.need);
    expect([...needs].sort((a, b) => a - b)).toEqual(needs);
    expect(needs[needs.length - 1]).toBeLessThanOrEqual(MAX_STARS);
    expect(new Set(HELMETS.map((h) => h.id)).size).toBe(HELMETS.length);
  });
  it('unlocks by total stars', () => {
    expect(unlockedHelmets(0).map((h) => h.id)).toEqual(['white']);
    expect(unlockedHelmets(MAX_STARS).length).toBe(HELMETS.length);
    expect(unlockedHelmets(6).length).toBe(3);
  });
  it('falls back to white for unknown or locked helmets', () => {
    expect(helmetColor('nope')).toBe('#ffffff');
    expect(activeHelmet('gold', 5).id).toBe('white');
    expect(activeHelmet('gold', 36).id).toBe('gold');
  });
  it('counts only level stars, capped at 3 each', () => {
    const s = blank().stars;
    s[0] = 3;
    s[1] = 3;
    s[2] = 9;
    expect(totalStars(s)).toBe(6);
    expect(totalStars(Array(16).fill(3))).toBe(MAX_STARS);
  });
});

describe('badges', () => {
  it('earns none on a fresh save and all on a full one', () => {
    expect(earnedBadges(blank()).length).toBe(0);
    const full: AvatarSave = { stars: Array(16).fill(3), stops: ['a', 'b', 'c'], rocks: 12, kit: { battery: 1, water: 0, shield: 0, science: 0 } };
    expect(earnedBadges(full).length).toBe(BADGES.length);
  });
  it('moon and mars badges follow the right levels', () => {
    const s = blank();
    s.stars[1] = 1;
    let ids = earnedBadges(s).map((b) => b.id);
    expect(ids).toContain('moon1');
    expect(ids).not.toContain('moonAll');
    expect(ids).not.toContain('mars1');
    for (let i = 1; i <= 5; i++) s.stars[i] = 1;
    s.stars[6] = 2;
    ids = earnedBadges(s).map((b) => b.id);
    expect(ids).toContain('moonAll');
    expect(ids).toContain('mars1');
    expect(ids).not.toContain('marsAll');
    expect(ids).not.toContain('star3');
  });
  it('prep, stops and rocks thresholds', () => {
    const s = blank();
    s.stops = ['a', 'b'];
    s.rocks = 9;
    expect(earnedBadges(s).length).toBe(0);
    s.stops.push('c');
    s.rocks = 10;
    s.kit = { battery: 0, water: 2, shield: 0, science: 0 };
    expect(earnedBadges(s).map((b) => b.id).sort()).toEqual(['prep', 'rocks', 'stops']);
  });
  it('every badge has text and a unique id', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    for (const b of BADGES) {
      expect(b.name.length).toBeGreaterThan(2);
      expect(b.how.length).toBeGreaterThan(5);
      expect(b.how).not.toContain('—');
    }
  });
});

describe('cleanName', () => {
  it('trims, limits and removes markup characters', () => {
    expect(cleanName('  Noa  ')).toBe('Noa');
    expect(cleanName('<b>Dan</b>')).toBe('bDan/b');
    expect(cleanName('Tom & "Jo"')).toBe('Tom Jo');
    expect(cleanName('a'.repeat(40)).length).toBe(20);
    expect(cleanName('Ann   Lee')).toBe('Ann Lee');
  });
});
