import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ROVERS, roverFor } from '../src/core/rovers';

const LINE_KEYS = ['welcome', 'storm', 'lowPower', 'lowWater', 'tired', 'broken', 'dust', 'goodDay', 'roughDay', 'win'] as const;

describe('rover companions', () => {
  it('has Buggy for the Moon and Curio for Mars', () => {
    expect(ROVERS.length).toBe(2);
    expect(roverFor('moon').nickname).toBe('Buggy');
    expect(roverFor('mars').nickname).toBe('Curio');
  });

  for (const r of ROVERS) {
    it(`${r.nickname} has 8 facts with text`, () => {
      expect(r.facts.length).toBe(8);
      for (const f of r.facts) {
        expect(f.title.length).toBeGreaterThan(2);
        expect(f.text.length).toBeGreaterThan(20);
      }
    });

    it(`${r.nickname} has at least two https sources`, () => {
      expect(r.sources.length).toBeGreaterThanOrEqual(2);
      for (const s of r.sources) expect(s.url.startsWith('https://')).toBe(true);
    });

    it(`${r.nickname} has a credited photo that exists in the project`, () => {
      expect(existsSync(`src/assets/rovers/${r.photo.file}`)).toBe(true);
      expect(r.photo.credit.startsWith('NASA')).toBe(true);
      expect(r.photo.page.startsWith('https://images.nasa.gov/details/')).toBe(true);
    });

    it(`${r.nickname} has every voice line`, () => {
      for (const k of LINE_KEYS) expect(r.lines[k].length, `${r.id}.${k}`).toBeGreaterThan(10);
    });
  }
});
