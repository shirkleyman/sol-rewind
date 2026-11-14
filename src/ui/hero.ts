import { icon } from './icons';
import type { IconName } from './icons';
import './hero.css';

export type HeroKind =
  | 'moon' | 'mars' | 'storm' | 'dust' | 'power' | 'water' | 'shield' | 'plants' | 'rocks' | 'sensor'
  | 'rest' | 'repair' | 'radio' | 'meteor' | 'rover' | 'win' | 'fail' | 'trip' | 'brief';

interface Look {
  a: string;
  b: string;
  ic: IconName;
  /** Which little animation floats around the picture. */
  fx: 'stars' | 'rays' | 'drops' | 'drift' | 'ring' | 'sparks' | 'rise' | 'fall';
  /** Dark background, so the icon is drawn in white. */
  dark?: boolean;
}

const LOOK: Record<HeroKind, Look> = {
  moon: { a: '#1b2a52', b: '#52669e', ic: 'moon', fx: 'stars', dark: true },
  mars: { a: '#8f3d2a', b: '#e59a6b', ic: 'planet', fx: 'drift', dark: true },
  storm: { a: '#2b1d57', b: '#e0693a', ic: 'bolt', fx: 'rays', dark: true },
  dust: { a: '#f2c498', b: '#d9965f', ic: 'sun', fx: 'drift' },
  power: { a: '#fff0b8', b: '#f0b73a', ic: 'batteryCharging', fx: 'rays' },
  water: { a: '#cfeaff', b: '#5aaae8', ic: 'droplet', fx: 'drops' },
  shield: { a: '#ffd5dc', b: '#e46a80', ic: 'shield', fx: 'ring' },
  plants: { a: '#d2f2da', b: '#52c58a', ic: 'seedling', fx: 'rise' },
  rocks: { a: '#e1d6ff', b: '#9a7cf5', ic: 'flask', fx: 'sparks' },
  sensor: { a: '#fff3c4', b: '#f0b73a', ic: 'bulb', fx: 'sparks' },
  rest: { a: '#d4f5e0', b: '#62cc94', ic: 'heart', fx: 'ring' },
  repair: { a: '#dde4f2', b: '#8493b3', ic: 'tool', fx: 'sparks' },
  radio: { a: '#cfe0ff', b: '#5b86d6', ic: 'speakerphone', fx: 'ring' },
  meteor: { a: '#1b2347', b: '#5a4aa0', ic: 'planet', fx: 'fall', dark: true },
  rover: { a: '#2a3560', b: '#6f86c8', ic: 'satellite', fx: 'stars', dark: true },
  win: { a: '#ffe9a6', b: '#f2b53d', ic: 'trophy', fx: 'sparks' },
  fail: { a: '#ffd9d4', b: '#e9837a', ic: 'alert', fx: 'ring' },
  trip: { a: '#1b2a52', b: '#4b69b8', ic: 'rocket', fx: 'stars', dark: true },
  brief: { a: '#dbe8ff', b: '#7aa2ee', ic: 'rocket', fx: 'stars' },
};

/**
 * A friendly picture header for a card: a soft gradient, a few things floating around and one big symbol.
 * Use it so a card tells its story with a picture first and only a little text.
 * With `photo` the real NASA photo fills the header and the symbol becomes a small badge.
 */
export function heroHtml(kind: HeroKind, opts: { photo?: string; label?: string; ic?: IconName; size?: 'sm' | 'md' } = {}): string {
  const l = LOOK[kind];
  const bits = Array.from({ length: 7 }, (_, i) => `<i style="--i:${i}"></i>`).join('');
  const photo = opts.photo ? `<div class="hero-photo" style="background-image:url(${opts.photo})"></div>` : '';
  const label = opts.label ? `<span class="hero-label">${opts.label}</span>` : '';
  return `<div class="hero h-${kind} fx-${l.fx} ${l.dark ? 'dark' : ''} ${opts.photo ? 'has-photo' : ''} ${opts.size === 'sm' ? 'sm' : ''}" style="--a:${l.a};--b:${l.b}" aria-hidden="true">${photo}<div class="hero-fx">${bits}</div><div class="hero-ic">${icon(opts.ic ?? l.ic)}</div>${label}</div>`;
}
