/**
 * A simple model of Earth and Mars going around the Sun, to show why the distance between them changes.
 * Earth is drawn on a circle. Mars is on a slightly squashed circle (an ellipse), as it is in real life.
 * Distances are in million kilometers. Numbers are the well known orbit values (1 AU = 149.6 million km).
 */
export const AU_MKM = 149.598;
export const C_MKM_PER_S = 0.299792458; // speed of light in million km per second

const MARS_A = 1.523679; // AU
const MARS_E = 0.0934;
const MARS_PERI_DEG = 336.04; // direction of Mars' closest point to the Sun
const D2R = Math.PI / 180;

/** Days since the year 2000 started to the start of the animation (about mid November 2026). */
export const START_DAYS = 9817;

function marsPos(d: number): { x: number; y: number } {
  const L = (355.45 + 0.5240208 * d) * D2R; // mean longitude
  const M = L - MARS_PERI_DEG * D2R;
  let E = M;
  for (let i = 0; i < 6; i++) E = E - (E - MARS_E * Math.sin(E) - M) / (1 - MARS_E * Math.cos(E));
  const b = MARS_A * Math.sqrt(1 - MARS_E * MARS_E);
  const px = MARS_A * (Math.cos(E) - MARS_E);
  const py = b * Math.sin(E);
  const w = MARS_PERI_DEG * D2R;
  return { x: px * Math.cos(w) - py * Math.sin(w), y: px * Math.sin(w) + py * Math.cos(w) };
}

function earthPos(d: number): { x: number; y: number } {
  const L = (100.46 + 0.9856474 * d) * D2R;
  return { x: Math.cos(L), y: Math.sin(L) };
}

export interface OrbitState {
  earth: { x: number; y: number };
  mars: { x: number; y: number };
  /** Distance between Earth and Mars in million km. */
  mkm: number;
  /** Minutes a radio message needs to cross that distance. */
  minutes: number;
}

export function orbitAt(d: number): OrbitState {
  const earth = earthPos(d);
  const mars = marsPos(d);
  const mkm = Math.hypot(earth.x - mars.x, earth.y - mars.y) * AU_MKM;
  return { earth, mars, mkm, minutes: mkm / C_MKM_PER_S / 60 };
}

/** Points of the Mars orbit, for drawing it. */
export function marsOrbitPoints(n = 90): { x: number; y: number }[] {
  const b = MARS_A * Math.sqrt(1 - MARS_E * MARS_E);
  const w = MARS_PERI_DEG * D2R;
  return Array.from({ length: n + 1 }, (_, i) => {
    const E = (i / n) * 2 * Math.PI;
    const px = MARS_A * (Math.cos(E) - MARS_E);
    const py = b * Math.sin(E);
    return { x: px * Math.cos(w) - py * Math.sin(w), y: px * Math.sin(w) + py * Math.cos(w) };
  });
}

/** The closest and the farthest Earth and Mars get from each other, found by looking at 40 years. */
export function distanceRange(): { min: number; max: number } {
  let min = Infinity;
  let max = 0;
  for (let d = 0; d < 365.25 * 40; d += 1) {
    const m = orbitAt(d).mkm;
    min = Math.min(min, m);
    max = Math.max(max, m);
  }
  return { min, max };
}
