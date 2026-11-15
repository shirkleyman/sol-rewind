const KEY = 'solRewind.v1';

import { ITEMS, emptyKit } from './kit';
import type { Kit } from './kit';

export interface SaveData {
  v: 1;
  stars: number[];
  best: Record<number, { sci: number; dose: number }>;
  sound: boolean;
  music: boolean;
  briefed: boolean;
  kit: Kit;
  stops: string[];
  /** Player's first name, used on the certificate. Empty until asked. */
  name: string;
  /** Id of the chosen helmet color (see core/avatar.ts). */
  helmet: string;
  /** Meteor rocks collected in surprise events. */
  rocks: number;
  /** Read text aloud (Web Speech). */
  voice: boolean;
  /** Short guided lessons the child has already seen (for example 'rewind'). */
  lessons: string[];
}

const fresh = (): SaveData => ({ v: 1, stars: Array(16).fill(0), best: {}, sound: true, music: true, briefed: false, kit: emptyKit(), stops: [], name: '', helmet: 'white', rocks: 0, voice: false, lessons: [] });

const int = (v: unknown, lo: number, hi: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : lo);
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const bool = (v: unknown, dflt: boolean): boolean => (typeof v === 'boolean' ? v : dflt);

/** Rebuilds every field of a saved game, so an old, partial or damaged save can never put NaN or the wrong type into the game. */
export function sanitizeSave(d: Partial<SaveData>): SaveData {
  const f = fresh();
  const stars = Array.isArray(d.stars) ? d.stars : [];
  const kitIn = d.kit && typeof d.kit === 'object' ? (d.kit as Partial<Kit>) : {};
  const kit = emptyKit();
  for (const it of ITEMS) kit[it.id] = int(kitIn[it.id], 0, it.max);
  const best: SaveData['best'] = {};
  if (d.best && typeof d.best === 'object') {
    for (const [k, v] of Object.entries(d.best)) {
      const n = Number(k);
      if (Number.isInteger(n) && v && typeof v.sci === 'number' && typeof v.dose === 'number' && Number.isFinite(v.sci) && Number.isFinite(v.dose)) best[n] = { sci: v.sci, dose: v.dose };
    }
  }
  return {
    v: 1,
    stars: Array.from({ length: 16 }, (_, i) => int(stars[i], 0, 3)),
    best,
    sound: bool(d.sound, f.sound),
    music: bool(d.music, f.music),
    briefed: bool(d.briefed, f.briefed),
    kit,
    stops: strings(d.stops),
    name: typeof d.name === 'string' ? d.name.replace(/[<>&"`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20) : '',
    helmet: typeof d.helmet === 'string' && d.helmet ? d.helmet.slice(0, 20) : f.helmet,
    rocks: int(d.rocks, 0, 100000),
    voice: bool(d.voice, f.voice),
    lessons: strings(d.lessons),
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const d = JSON.parse(raw) as Partial<SaveData> | null;
    if (!d || typeof d !== 'object' || d.v !== 1 || !Array.isArray(d.stars)) return fresh();
    return sanitizeSave(d);
  } catch {
    return fresh();
  }
}

export function writeSave(s: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode or full storage: the game still works, progress just is not kept */
  }
}

export function resetSave(): SaveData {
  const s = fresh();
  writeSave(s);
  return s;
}
