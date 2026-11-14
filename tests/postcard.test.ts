import { describe, expect, it } from 'vitest';
import { SITES } from '../src/core/sites';
import { postcardFileName, postcardMessage } from '../src/ui/postcard';

const site = SITES[0];
const base = { site, levelId: 1, levelTitle: 'First day', stars: 3, name: 'Noa' };

describe('postcard text', () => {
  it('mentions the place and the child', () => {
    const m = postcardMessage(base);
    expect(m).toContain(site.name);
    expect(m).toContain('Noa');
  });
  it('changes with the stars and handles missing names', () => {
    expect(postcardMessage({ ...base, stars: 1 })).not.toBe(postcardMessage(base));
    expect(postcardMessage({ ...base, name: '' })).toContain('your astronaut');
    expect(postcardMessage({ ...base, stars: 0 })).toContain(site.name);
  });
  it('makes a safe file name', () => {
    expect(postcardFileName(base)).toBe(`postcard-level-1-${site.id}.png`);
  });
});
