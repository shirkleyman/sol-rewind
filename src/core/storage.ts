const KEY = 'solRewind.v1';

import { emptyKit } from './kit';
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
}

const fresh = (): SaveData => ({ v: 1, stars: Array(16).fill(0), best: {}, sound: true, music: true, briefed: false, kit: emptyKit(), stops: [], name: '', helmet: 'white', rocks: 0, voice: false });

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const d = JSON.parse(raw) as Partial<SaveData>;
    if (d.v !== 1 || !Array.isArray(d.stars)) return fresh();
    return { ...fresh(), ...d, stars: [...d.stars, ...Array(16).fill(0)].slice(0, 16) } as SaveData;
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
