import gsap from 'gsap';
import { LEVELS } from '../core/levels';
import { mulberry32 } from '../core/rng';
import { siteFor } from '../core/sites';
import { STOPS } from '../core/stops';
import { astroInner, star } from './art';
import { earthGroup, israelPoint, marsGroup, moonGroup } from './planets';

/** Everything is drawn bottom to top: Earth, a long trip, the Moon, a longer trip, Mars. */
export const MAP_H = 1900;
const EARTH = { cx: 340, cy: 2000, r: 300 };
const MOON = { cx: 340, cy: 1130, r: 190 };
const MARS = { cx: 340, cy: 255, r: 245 };

const NODE: Record<number, [number, number]> = {
  1: [340, 1270], 2: [448, 1205], 3: [335, 1135], 4: [235, 1070], 5: [340, 1005],
  6: [340, 440], 7: [460, 380], 8: [335, 322], 9: [220, 266], 10: [335, 208], 11: [455, 150], 12: [335, 92],
};

const STOP_POS: Record<string, [number, number]> = {
  orbit: [350, 1610], magnetic: [318, 1510], distance: [352, 1410],
  deep: [328, 850], trip: [354, 720], delay: [320, 590],
};

export function prepPoint(): [number, number] {
  return israelPoint(EARTH.cx, EARTH.cy, EARTH.r);
}

export function isUnlocked(stars: number[], id: number, all: boolean): boolean {
  if (all || id === 0) return true;
  if (id === 1) return stars[0] > 0;
  return stars[id - 1] > 0;
}

export function currentLevel(stars: number[], all: boolean): number {
  if (!all && stars[0] === 0) return 0;
  for (const l of LEVELS) if (isUnlocked(stars, l.id, all) && stars[l.id] === 0) return l.id;
  return LEVELS.length;
}

type P = [number, number];

function smooth(pts: P[]): string {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function mapSvg(stars: number[], all: boolean, stopsDone: string[]): string {
  const rnd = mulberry32(5);
  const israel = prepPoint();
  let s = `<svg id="map" viewBox="0 0 680 ${MAP_H}" width="100%" role="img" aria-label="Journey map from Earth at the bottom, a long trip with three learning stops, five Moon training levels, another long trip with three learning stops, and seven Mars levels at the top">`;
  s += `<rect width="680" height="${MAP_H}" rx="14" fill="#eaf1ff"/>`;
  for (let i = 0; i < 60; i++) s += `<circle class="twinkle" cx="${(rnd() * 680).toFixed(0)}" cy="${(rnd() * (MAP_H - 220)).toFixed(0)}" r="${(1.3 + rnd() * 1.5).toFixed(1)}" fill="#b9c9ea"/>`;
  s += marsGroup(MARS.cx, MARS.cy, MARS.r);
  s += moonGroup(MOON.cx, MOON.cy, MOON.r);
  s += earthGroup(EARTH.cx, EARTH.cy, EARTH.r);

  const route: P[] = [
    israel, STOP_POS.orbit, STOP_POS.magnetic, STOP_POS.distance,
    ...[1, 2, 3, 4, 5].map((i) => NODE[i]),
    STOP_POS.deep, STOP_POS.trip, STOP_POS.delay,
    ...[6, 7, 8, 9, 10, 11, 12].map((i) => NODE[i]),
  ];
  const d = smooth(route);
  s += `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#9bb0d8" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`;

  s += `<rect x="14" y="30" width="250" height="34" rx="17" fill="#e0693a"/><text class="pilltxt" x="139" y="53" text-anchor="middle" fill="#fff" font-size="15" font-weight="600">Mars: the real test</text>`;
  s += `<rect x="14" y="950" width="230" height="34" rx="17" fill="#1aa58a"/><text class="pilltxt" x="129" y="973" text-anchor="middle" fill="#fff" font-size="15" font-weight="600">Moon: training</text>`;
  s += `<rect x="14" y="1700" width="150" height="34" rx="17" fill="#3b82c4"/><text class="pilltxt" x="89" y="1723" text-anchor="middle" fill="#fff" font-size="15" font-weight="600">Earth: launch</text>`;
  s += `<text class="maptxt" x="16" y="1480" fill="#5a6b92" font-size="13">Earth to the Moon:</text><text class="maptxt" x="16" y="1500" fill="#5a6b92" font-size="13">about 384,000 km</text><text class="maptxt" x="16" y="1520" fill="#5a6b92" font-size="12">three learning stops</text>`;
  s += `<text class="maptxt" x="16" y="680" fill="#5a6b92" font-size="13">The Moon to Mars:</text><text class="maptxt" x="16" y="700" fill="#5a6b92" font-size="13">a very long trip</text><text class="maptxt" x="16" y="720" fill="#5a6b92" font-size="12">three learning stops</text>`;

  for (const st of STOPS) {
    const [x, y] = STOP_POS[st.id];
    const done = stopsDone.includes(st.id);
    s += `<g class="stop" data-stop="${st.id}" tabindex="0" role="button" aria-label="Learning stop: ${st.title}${done ? ', done' : ''}"><circle cx="${x}" cy="${y}" r="26" fill="transparent"/><circle cx="${x}" cy="${y + 3}" r="17" fill="#00000020"/><circle cx="${x}" cy="${y}" r="17" fill="${done ? '#d9f5e4' : '#fff'}" stroke="${done ? '#2fa36b' : '#3b82c4'}" stroke-width="3"/>${done ? `<path d="M${x - 6} ${y} l4 5 l8 -10" fill="none" stroke="#2fa36b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` : `<text x="${x}" y="${y + 6}" text-anchor="middle" font-size="17" font-weight="700" fill="#3b82c4">i</text>`}<text class="sitelabel" x="${x + 26}" y="${y + 4}" font-size="12" font-weight="600">${st.title}</text></g>`;
  }

  const cur = currentLevel(stars, all);
  const nodeSvg = (id: number, x: number, y: number, col: string, label: string, caption: string | null, starsN: number, u: boolean): string => {
    const done = starsN > 0;
    const isCur = id === cur && u && !done;
    let g = `<g class="node ${u ? '' : 'locked'}" data-i="${id}" ${u ? 'tabindex="0" role="button"' : ''} aria-label="${caption ?? `Level ${id}`}${u ? '' : ' (locked)'}, ${starsN} of 3 stars">`;
    if (isCur) g += `<circle class="pulse" cx="${x}" cy="${y}" r="26" fill="none" stroke="${col}" stroke-width="4"/>`;
    g += `<circle cx="${x}" cy="${y + 4}" r="26" fill="#00000022"/><circle cx="${x}" cy="${y}" r="26" fill="${!u ? '#cdd6e8' : done ? col : '#fff'}" stroke="${!u ? '#b0bcd8' : col}" stroke-width="4"/>`;
    if (u) g += id === 0
      ? `<path d="M${x} ${y - 13} q7 8 5 20 l-5 3 l-5 -3 q-2 -12 5 -20Z" fill="${done ? '#fff' : col}"/><circle cx="${x}" cy="${y - 3}" r="2.6" fill="${done ? col : '#fff'}"/>`
      : `<text x="${x}" y="${y + 7}" text-anchor="middle" font-size="20" font-weight="600" fill="${done ? '#fff' : col}">${label}</text>`;
    else g += `<rect x="${x - 7}" y="${y - 3}" width="14" height="11" rx="2" fill="#8a97b5"/><path d="M${x - 4},${y - 3} v-3 a4,4 0 0 1 8,0 v3" fill="none" stroke="#8a97b5" stroke-width="2"/>`;
    for (let k = 0; k < 3; k++) g += star(k < starsN, x - 16 + k * 16, y + 40, 1.1);
    if (caption && u) {
      const left = id === 0 ? false : x < 340;
      g += `<text class="sitelabel" x="${left ? x - 36 : x + 36}" y="${y + 5}" text-anchor="${left ? 'end' : 'start'}" font-size="13" font-weight="600">${caption}</text>`;
    }
    g += '</g>';
    if (isCur) {
      const side = x < 340 ? -1 : 1;
      const ax = id === 0 ? x - 18 : x + side * 48 - 18;
      const ay = id === 0 ? y - 86 : y - 34;
      g += `<svg class="hop" x="${ax}" y="${ay}" width="36" height="52" viewBox="0 0 40 56" aria-hidden="true">${astroInner(col)}</svg>`;
    }
    return g;
  };

  s += nodeSvg(0, israel[0] + 90, israel[1] - 40, '#d8643a', '', 'Mission prep', stars[0], true);
  for (const l of LEVELS) {
    const [x, y] = NODE[l.id];
    const col = l.world === 'moon' ? '#1aa58a' : '#e0693a';
    s += nodeSvg(l.id, x, y, col, String(l.id), siteFor(l.id)?.name ?? null, stars[l.id], isUnlocked(stars, l.id, all));
  }
  return s + '</svg>';
}

/** Small entrance animation so the map feels alive. */
export function animateMap(root: HTMLElement, focusLevel: number | null): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const planets = root.querySelectorAll('.planet');
  const marks = root.querySelectorAll('.node, .stop');
  gsap.from(planets, { opacity: 0, scale: 0.94, transformOrigin: '50% 50%', duration: 0.6, stagger: 0.12, ease: 'power2.out' });
  gsap.from(marks, { opacity: 0, y: 8, duration: 0.35, stagger: 0.03, delay: 0.2, ease: 'back.out(2)' });
  window.setTimeout(() => {
    gsap.killTweensOf([...planets, ...marks]);
    gsap.set([...planets, ...marks], { opacity: 1, clearProps: 'transform' });
  }, 3500);
  root.querySelectorAll<SVGElement>('.twinkle').forEach((el, i) => {
    gsap.to(el, { opacity: 0.25, duration: 1.4 + (i % 4) * 0.3, repeat: -1, yoyo: true, delay: (i % 5) * 0.2, ease: 'sine.inOut' });
  });
  if (focusLevel !== null) {
    const el = root.querySelector<SVGElement>(`.node[data-i="${focusLevel}"]`);
    if (el) gsap.fromTo(el, { scale: 1.25, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.5)', delay: 0.5 });
  }
}

/** Opens the map at the bottom (Earth and part of the Moon), or centred on the current level. */
export function scrollMapToProgress(root: HTMLElement, cur: number, fresh: boolean): void {
  const svg = root.querySelector<SVGElement>('#map');
  if (!svg) return;
  if (fresh) {
    const bottom = svg.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: Math.max(0, bottom - window.innerHeight + 16), behavior: 'auto' });
    return;
  }
  const el = svg.querySelector<SVGElement>(`.node[data-i="${cur}"]`);
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.scrollBy({ top: r.top + r.height / 2 - window.innerHeight / 2, behavior: 'auto' });
}
