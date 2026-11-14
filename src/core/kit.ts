import type { LevelConfig } from './types';

/** What the player packs on Earth before the mission. It gives a small head start in every level. */
export interface Kit {
  battery: number;
  water: number;
  shield: number;
  science: number;
}

export interface KitEffects {
  p: number;
  w: number;
  s: number;
  doseCut: number;
}

export interface KitItem {
  id: keyof Kit;
  name: string;
  mass: number;
  max: number;
  effect: string;
  why: string;
}

export const CAPACITY = 60;

export const ITEMS: KitItem[] = [
  { id: 'battery', name: 'Battery pack', mass: 10, max: 3, effect: '+10 power at the start of every mission', why: 'Batteries store solar power for the dark.' },
  { id: 'water', name: 'Water tank', mass: 10, max: 3, effect: '+10 water at the start of every mission', why: 'Every kilogram you launch costs fuel, so water is precious.' },
  { id: 'shield', name: 'Shielding plates', mass: 14, max: 3, effect: '8% less radiation from every storm', why: 'Dense material blocks some of the fast particles from the Sun.' },
  { id: 'science', name: 'Science kit', mass: 12, max: 2, effect: '+5 science points to start with', why: 'Instruments let the crew do research from day one.' },
];

export const emptyKit = (): Kit => ({ battery: 0, water: 0, shield: 0, science: 0 });

export const kitMass = (k: Kit): number => ITEMS.reduce((a, it) => a + it.mass * k[it.id], 0);

export function kitEffects(k: Kit): KitEffects {
  return { p: k.battery * 10, w: k.water * 10, s: k.science * 5, doseCut: Math.min(0.24, k.shield * 0.08) };
}

/** 0 when the cargo is empty or too heavy, 1 to 3 stars for a balanced load. */
export function kitStars(k: Kit): number {
  const mass = kitMass(k);
  if (mass === 0 || mass > CAPACITY) return 0;
  const kinds = ITEMS.filter((it) => k[it.id] > 0).length;
  if (kinds >= 4 && mass >= CAPACITY * 0.85) return 3;
  if (kinds >= 3) return 2;
  return 1;
}

export function withKit(level: LevelConfig, k: Kit | null | undefined): LevelConfig {
  return k ? { ...level, kit: kitEffects(k) } : level;
}
