import type { IconName } from '../ui/icons';

/** What the badge rules need. A SaveData fits, and so does a small test object. */
export interface AvatarSave {
  /** Index 0 is the Earth mission prep, 1 to 12 are the levels. */
  stars: number[];
  stops: string[];
  rocks: number;
  kit?: { battery: number; water: number; shield: number; science: number };
  best?: Record<number, { sci: number; dose: number }>;
}

export interface Helmet {
  id: string;
  name: string;
  color: string;
  /** Total level stars (levels 1 to 12) needed to unlock it. */
  need: number;
}

export const MAX_STARS = 36;

export const HELMETS: Helmet[] = [
  { id: 'white', name: 'White', color: '#ffffff', need: 0 },
  { id: 'sky', name: 'Sky blue', color: '#a9d8ff', need: 3 },
  { id: 'mint', name: 'Mint', color: '#aeeacb', need: 6 },
  { id: 'sun', name: 'Sunny yellow', color: '#ffe27a', need: 10 },
  { id: 'coral', name: 'Mars coral', color: '#ff9f8a', need: 15 },
  { id: 'violet', name: 'Nebula violet', color: '#c5adff', need: 22 },
  { id: 'gold', name: 'Gold', color: '#f2c14e', need: 30 },
];

export interface Badge {
  id: string;
  name: string;
  icon: IconName;
  how: string;
  earned: (s: AvatarSave) => boolean;
}

const lvl = (s: AvatarSave, id: number): number => s.stars[id] ?? 0;
const range = (a: number, b: number): number[] => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const BADGES: Badge[] = [
  { id: 'prep', name: 'Ready for launch', icon: 'rocket', how: 'Pack your cargo in Mission prep.', earned: (s) => (s.stars[0] ?? 0) > 0 || (s.kit ? s.kit.battery + s.kit.water + s.kit.shield + s.kit.science > 0 : false) },
  { id: 'moon1', name: 'First Moon day', icon: 'moon', how: 'Finish a Moon level.', earned: (s) => range(1, 5).some((i) => lvl(s, i) > 0) },
  { id: 'moonAll', name: 'Moon explorer', icon: 'planet', how: 'Finish all 5 Moon levels.', earned: (s) => range(1, 5).every((i) => lvl(s, i) > 0) },
  { id: 'mars1', name: 'First Mars sol', icon: 'sun', how: 'Finish a Mars level.', earned: (s) => range(6, 12).some((i) => lvl(s, i) > 0) },
  { id: 'marsAll', name: 'Mars pioneer', icon: 'satellite', how: 'Finish all 7 Mars levels.', earned: (s) => range(6, 12).every((i) => lvl(s, i) > 0) },
  { id: 'star3', name: 'Three stars', icon: 'bolt', how: 'Get 3 stars on any level.', earned: (s) => range(1, 12).some((i) => lvl(s, i) >= 3) },
  { id: 'stops', name: 'Curious traveler', icon: 'bulb', how: 'Visit 3 learning stops on the trip.', earned: (s) => s.stops.length >= 3 },
  { id: 'rocks', name: 'Rock collector', icon: 'flask', how: 'Collect 10 space rocks in surprise events.', earned: (s) => s.rocks >= 10 },
];

/** Stars that count for helmets: levels 1 to 12 only, at most 3 each. */
export function totalStars(stars: number[]): number {
  return range(1, 12).reduce((a, i) => a + Math.max(0, Math.min(3, stars[i] ?? 0)), 0);
}

export const unlockedHelmets = (total: number): Helmet[] => HELMETS.filter((h) => total >= h.need);

export const earnedBadges = (s: AvatarSave): Badge[] => BADGES.filter((b) => b.earned(s));

export const helmetById = (id: string): Helmet => HELMETS.find((h) => h.id === id) ?? HELMETS[0];

/** Color for a helmet id. Unknown ids fall back to white. */
export const helmetColor = (id: string): string => helmetById(id).color;

/** The helmet to show: the chosen one if it is unlocked, else white. */
export function activeHelmet(id: string, total: number): Helmet {
  const h = helmetById(id);
  return total >= h.need ? h : HELMETS[0];
}

export const cleanName = (raw: string): string => raw.replace(/[<>&"`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);
