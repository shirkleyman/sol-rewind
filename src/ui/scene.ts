import { mulberry32 } from '../core/rng';
import type { Structure, Theme } from '../core/types';

const BASE = 205;

function ridge(rnd: () => number, baseY: number, amp: number, color: string, step = 38): string {
  let d = `M0 ${baseY + 40} L0 ${baseY}`;
  for (let x = step; x <= 760 + step; x += step) d += ` L${x} ${(baseY - amp * (0.25 + 0.75 * rnd())).toFixed(1)}`;
  return `<path d="${d} L${760 + step} ${baseY + 40} Z" fill="${color}"/>`;
}

function draw(s: Structure, accent: string): string {
  const k = s.s ?? 1;
  const x = s.x;
  switch (s.t) {
    case 'dome': {
      const r = 46 * k;
      return `<g><path d="M${x - r} ${BASE} a${r} ${r} 0 0 1 ${2 * r} 0 Z" fill="#eef2fa" stroke="#b6c3dc" stroke-width="2"/><rect class="win-glow" x="${x - 14 * k}" y="${BASE - 30 * k}" width="${28 * k}" height="${16 * k}" rx="4" fill="#ffe9a8" opacity=".85"/><rect x="${x - 7 * k}" y="${BASE - 14 * k}" width="${14 * k}" height="${14 * k}" fill="#c9d4ea"/></g>`;
    }
    case 'panels': {
      const w = 64 * k;
      return `<g><line x1="${x}" y1="${BASE}" x2="${x}" y2="${BASE - 22 * k}" stroke="#8c98b2" stroke-width="3"/><polygon points="${x - w / 2},${BASE - 22 * k} ${x + w / 2},${BASE - 30 * k} ${x + w / 2},${BASE - 52 * k} ${x - w / 2},${BASE - 44 * k}" fill="#2b5fb0" stroke="#9fb8e8" stroke-width="1.5"/><line x1="${x}" y1="${BASE - 22 * k - 4}" x2="${x}" y2="${BASE - 48 * k}" stroke="#9fb8e8" stroke-width="1"/></g>`;
    }
    case 'antenna':
      return `<g><line x1="${x}" y1="${BASE}" x2="${x}" y2="${BASE - 74 * k}" stroke="#b8c2d8" stroke-width="3"/><circle class="blink" cx="${x}" cy="${BASE - 78 * k}" r="4" fill="${accent}"/><path d="M${x - 14 * k} ${BASE - 60 * k} q${14 * k} -10 ${28 * k} 0" fill="none" stroke="#b8c2d8" stroke-width="2"/></g>`;
    case 'dish': {
      const r = 38 * k;
      return `<g><line x1="${x}" y1="${BASE}" x2="${x}" y2="${BASE - 40 * k}" stroke="#aab6cf" stroke-width="4"/><path d="M${x - r} ${BASE - 70 * k} q${r} ${50 * k} ${2 * r} 0 Z" fill="#e3eaf6" stroke="#9fb0d0" stroke-width="2" transform="rotate(-18 ${x} ${BASE - 55 * k})"/><circle class="blink" cx="${x + 20 * k}" cy="${BASE - 92 * k}" r="3.5" fill="${accent}"/></g>`;
    }
    case 'module':
      return `<g><rect x="${x - 38 * k}" y="${BASE - 40 * k}" width="${76 * k}" height="${40 * k}" rx="6" fill="#e3e9f5" stroke="#a9b6d0" stroke-width="2"/><rect class="win-glow" x="${x - 28 * k}" y="${BASE - 30 * k}" width="${14 * k}" height="${12 * k}" rx="3" fill="#ffe9a8"/><rect x="${x - 6 * k}" y="${BASE - 30 * k}" width="${14 * k}" height="${12 * k}" rx="3" fill="#bcd0ee"/><rect x="${x + 14 * k}" y="${BASE - 30 * k}" width="${14 * k}" height="${12 * k}" rx="3" fill="#bcd0ee"/></g>`;
    case 'rover':
      return `<g><rect x="${x - 26 * k}" y="${BASE - 22 * k}" width="${52 * k}" height="${14 * k}" rx="4" fill="#d9e0ee" stroke="#9fb0d0" stroke-width="1.5"/><line x1="${x + 14 * k}" y1="${BASE - 22 * k}" x2="${x + 14 * k}" y2="${BASE - 40 * k}" stroke="#9fb0d0" stroke-width="2"/><rect x="${x + 9 * k}" y="${BASE - 46 * k}" width="${12 * k}" height="${7 * k}" rx="2" fill="#9fb0d0"/><circle cx="${x - 16 * k}" cy="${BASE - 6 * k}" r="${7 * k}" fill="#4a5470"/><circle cx="${x}" cy="${BASE - 6 * k}" r="${7 * k}" fill="#4a5470"/><circle cx="${x + 16 * k}" cy="${BASE - 6 * k}" r="${7 * k}" fill="#4a5470"/></g>`;
    case 'tower':
      return `<g><polygon points="${x - 18 * k},${BASE} ${x + 18 * k},${BASE} ${x},${BASE - 96 * k}" fill="none" stroke="#b8c2d8" stroke-width="3"/><line x1="${x - 11 * k}" y1="${BASE - 30 * k}" x2="${x + 11 * k}" y2="${BASE - 30 * k}" stroke="#b8c2d8" stroke-width="2"/><line x1="${x - 6 * k}" y1="${BASE - 62 * k}" x2="${x + 6 * k}" y2="${BASE - 62 * k}" stroke="#b8c2d8" stroke-width="2"/><circle class="blink" cx="${x}" cy="${BASE - 100 * k}" r="4.5" fill="${accent}"/></g>`;
    case 'flag':
      return `<g><line x1="${x}" y1="${BASE}" x2="${x}" y2="${BASE - 46}" stroke="#d9dff0" stroke-width="2"/><rect x="${x}" y="${BASE - 46}" width="22" height="13" fill="${accent}"/></g>`;
    case 'greenhouse': {
      const r = 40 * k;
      return `<g><path d="M${x - r} ${BASE} a${r} ${r * 0.8} 0 0 1 ${2 * r} 0 Z" fill="#cfeedd" fill-opacity=".85" stroke="#7fbf9f" stroke-width="2"/><path d="M${x - 14} ${BASE} q-2 -18 6 -26 M${x + 8} ${BASE} q4 -16 -2 -28 M${x + 22} ${BASE} q-2 -12 4 -20" fill="none" stroke="#3a9a62" stroke-width="3" stroke-linecap="round"/></g>`;
    }
  }
}

/** The big backdrop of a level. Each theme has its own place, light and weather, with a little ambient motion. */
export function sceneSvg(t: Theme): string {
  const rnd = mulberry32(t.seed);
  let s = `<svg viewBox="0 0 760 420" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" aria-hidden="true">`;
  s += `<defs><linearGradient id="sky${t.seed}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.sky}"/><stop offset="1" stop-color="${t.skyLow ?? t.sky}"/></linearGradient></defs>`;
  s += `<rect width="760" height="420" fill="url(#sky${t.seed})"/>`;
  if (t.stars) {
    for (let i = 0; i < 46; i++) {
      const x = rnd() * 760;
      const y = rnd() * 170;
      s += `<circle class="tw" style="animation-delay:${(rnd() * 3).toFixed(1)}s" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.7 + rnd() * 1.1).toFixed(1)}" fill="#e6ecff" opacity=".8"/>`;
    }
  }
  if (t.earth === 'big') s += `<g><circle cx="630" cy="92" r="30" fill="#3b82c4"/><circle cx="620" cy="82" r="11" fill="#6fb0e8"/><path d="M640 98 q10 -6 16 4 q-6 10 -16 -4Z" fill="#62b56e"/></g>`;
  if (t.earth === 'small') s += `<g><circle cx="660" cy="74" r="14" fill="#3b82c4"/><circle cx="655" cy="69" r="5" fill="#6fb0e8"/></g>`;
  if (t.sun) {
    const u = t.sun;
    s += `<g><circle class="corona" cx="${u.x}" cy="${u.y}" r="${u.r * 1.7}" fill="${u.c}" opacity=".18"/>`;
    if (t.ambient === 'flare') {
      s += `<g class="rays" style="transform-origin:${u.x}px ${u.y}px">`;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        s += `<line x1="${(u.x + Math.cos(a) * (u.r + 6)).toFixed(1)}" y1="${(u.y + Math.sin(a) * (u.r + 6)).toFixed(1)}" x2="${(u.x + Math.cos(a) * (u.r + 26 + (i % 2) * 14)).toFixed(1)}" y2="${(u.y + Math.sin(a) * (u.r + 26 + (i % 2) * 14)).toFixed(1)}" stroke="${u.c}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`;
      }
      s += `</g>`;
    }
    s += `<circle cx="${u.x}" cy="${u.y}" r="${u.r}" fill="${u.c}"/></g>`;
  }
  s += ridge(rnd, BASE - 6, 62, t.far, 44);
  s += ridge(rnd, BASE + 6, 30, t.mid, 30);
  s += `<rect y="${BASE}" width="760" height="${420 - BASE}" fill="${t.ground}"/>`;
  for (let i = 0; i < 6; i++) s += `<ellipse cx="${(40 + rnd() * 680).toFixed(0)}" cy="${(BASE + 26 + rnd() * 90).toFixed(0)}" rx="${(18 + rnd() * 30).toFixed(0)}" ry="${(5 + rnd() * 7).toFixed(0)}" fill="${t.mid}" opacity=".55"/>`;
  s += `<g>${t.structures.map((st) => draw(st, t.accent)).join('')}</g>`;
  if (t.haze) s += `<rect class="haze" y="${BASE - 90}" width="900" height="150" fill="${t.haze}" opacity=".32"/>`;
  if (t.ambient === 'dust') {
    for (let i = 0; i < 26; i++) {
      s += `<circle class="dustp" style="animation-duration:${(7 + rnd() * 8).toFixed(1)}s;animation-delay:-${(rnd() * 10).toFixed(1)}s" cx="${(rnd() * 760).toFixed(0)}" cy="${(BASE - 70 + rnd() * 190).toFixed(0)}" r="${(1.2 + rnd() * 2).toFixed(1)}" fill="#f6d2b2" opacity=".6"/>`;
    }
  }
  if (t.ambient === 'sparks') {
    t.structures.slice(0, 3).forEach((st, i) => {
      s += `<g class="spark" style="animation-delay:${(i * 0.4).toFixed(1)}s"><circle cx="${st.x + 8}" cy="${BASE - 30}" r="2.4" fill="#ffd25a"/><circle cx="${st.x - 6}" cy="${BASE - 22}" r="1.8" fill="#ff9d3a"/><circle cx="${st.x + 14}" cy="${BASE - 16}" r="1.6" fill="#ffe9a8"/></g>`;
    });
  }
  if (t.ambient === 'storm') {
    s += `<g class="aurora"><rect x="-60" y="30" width="520" height="30" fill="#ff4d6d" opacity=".16" transform="rotate(-8 200 40)"/><rect x="220" y="70" width="620" height="26" fill="#8b5cf6" opacity=".16" transform="rotate(-8 500 80)"/></g>`;
    s += `<polyline class="bolt" points="560,0 548,60 566,64 540,140" fill="none" stroke="#ffd1d8" stroke-width="3" opacity="0"/>`;
  }
  if (t.ambient === 'glow') {
    s += `<circle class="glowp" cx="${t.structures.find((x) => x.t === 'dome')?.x ?? 360}" cy="${BASE - 24}" r="64" fill="#ffd48a" opacity=".22"/>`;
  }
  return s + '</svg>';
}
