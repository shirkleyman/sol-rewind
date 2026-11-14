import { describe, expect, it } from 'vitest';
import { NAME_MAX, certificateHtml, cleanName, escapeHtml, formatDate, rankFor } from '../src/ui/certificate';

describe('rankFor', () => {
  it('starts as a cadet', () => {
    expect(rankFor(0, 36).id).toBe('cadet');
    expect(rankFor(0, 0).id).toBe('cadet');
  });
  it('rises with stars', () => {
    expect(rankFor(6, 36).id).toBe('moon');
    expect(rankFor(15, 36).id).toBe('mars');
    expect(rankFor(27, 36).id).toBe('commander');
    expect(rankFor(36, 36).id).toBe('commander');
  });
  it('clamps odd input', () => {
    expect(rankFor(99, 36).id).toBe('commander');
    expect(rankFor(-5, 36).id).toBe('cadet');
  });
});

describe('name helpers', () => {
  it('trims, collapses and cuts', () => {
    expect(cleanName('  Noa   Levi ')).toBe('Noa Levi');
    expect(cleanName('x'.repeat(50)).length).toBe(NAME_MAX);
  });
  it('removes angle brackets and escapes html', () => {
    expect(cleanName('<b>Dan</b>')).toBe('bDan/b');
    expect(escapeHtml('<a href="x">&')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;');
  });
});

describe('certificateHtml', () => {
  const base = { name: 'Noa', kind: 'level' as const, levelId: 3, levelTitle: 'Dust & Shine', stars: 2, totalStars: 10, maxStars: 36, date: new Date(2026, 10, 14) };
  it('contains the name, rank and the not-official line', () => {
    const h = certificateHtml(base);
    expect(h).toContain('Noa');
    expect(h).toContain('Moon Explorer');
    expect(h).toContain('Not an official NASA document');
    expect(h).toContain('Dust &amp; Shine');
  });
  it('never injects markup from the name', () => {
    expect(certificateHtml({ ...base, name: '<img src=x onerror=1>' })).not.toContain('<img');
  });
  it('falls back when there is no name and formats the date', () => {
    expect(certificateHtml({ ...base, name: '  ' })).toContain('Young Astronaut');
    expect(formatDate(new Date(2026, 10, 14))).toBe('14 November 2026');
  });
});
