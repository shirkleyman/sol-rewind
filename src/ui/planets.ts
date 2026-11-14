import earth from '../data/earth.json';

export interface Feature {
  id: string;
  body: 'moon' | 'mars';
  name: string;
  kind: 'crater' | 'basin' | 'volcano' | 'plain';
  lat: number;
  lon: number;
  sizeKm: number;
  fact: string;
}

/** Real places worth knowing. Positions are real. Sizes are real but drawn exaggerated, so the artwork is not to scale. */
export const FEATURES: Feature[] = [
  { id: 'tycho', body: 'moon', name: 'Tycho', kind: 'crater', lat: -43.3, lon: -11.4, sizeKm: 85, fact: 'Tycho is a young crater with long bright rays that stretch across the Moon.' },
  { id: 'copernicus', body: 'moon', name: 'Copernicus', kind: 'crater', lat: 9.7, lon: -20.1, sizeKm: 93, fact: 'Copernicus is a famous bright crater with a ring of terraced walls.' },
  { id: 'kepler', body: 'moon', name: 'Kepler', kind: 'crater', lat: 8.1, lon: -38.0, sizeKm: 32, fact: 'Kepler is a bright crater with rays on the Moon’s near side.' },
  { id: 'aristarchus', body: 'moon', name: 'Aristarchus', kind: 'crater', lat: 23.7, lon: -47.4, sizeKm: 40, fact: 'Aristarchus is one of the brightest craters on the Moon.' },
  { id: 'plato', body: 'moon', name: 'Plato', kind: 'crater', lat: 51.6, lon: -9.4, sizeKm: 101, fact: 'Plato is a crater with a dark, flat floor.' },
  { id: 'grimaldi', body: 'moon', name: 'Grimaldi', kind: 'crater', lat: -5.2, lon: -68.3, sizeKm: 172, fact: 'Grimaldi is a huge crater with a dark floor, near the western edge of the Moon you see from Earth.' },
  { id: 'hellas', body: 'mars', name: 'Hellas', kind: 'basin', lat: -42.7, lon: 70, sizeKm: 2300, fact: 'Hellas is one of the biggest impact basins in the solar system.' },
  { id: 'syrtis', body: 'mars', name: 'Syrtis Major', kind: 'plain', lat: 8, lon: 69, sizeKm: 1000, fact: 'Syrtis Major is a dark region that astronomers saw on Mars long before spacecraft got there.' },
  { id: 'jezero', body: 'mars', name: 'Jezero', kind: 'crater', lat: 18.4, lon: 77.5, sizeKm: 45, fact: 'Jezero is the crater where the Perseverance rover landed.' },
  { id: 'gale', body: 'mars', name: 'Gale', kind: 'crater', lat: -4.6, lon: 137.4, sizeKm: 154, fact: 'Gale is the crater where the Curiosity rover landed.' },
  { id: 'elysium', body: 'mars', name: 'Elysium Mons', kind: 'volcano', lat: 25, lon: 147.2, sizeKm: 400, fact: 'Elysium Mons is a volcano on Mars.' },
];

const rad = (d: number) => (d * Math.PI) / 180;
let uid = 0;

interface Pt {
  x: number;
  y: number;
  c: number;
}

/** Orthographic projection: where a lat/lon lands on a disc centred on (lat0, lon0). c is the cosine of the angle from the centre (above 0 means visible). */
function proj(lat: number, lon: number, lat0: number, lon0: number, cx: number, cy: number, r: number): Pt {
  const p = rad(lat), p0 = rad(lat0), dl = rad(lon - lon0);
  const x = Math.cos(p) * Math.sin(dl);
  const y = Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(dl);
  const c = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(dl);
  return { x: cx + r * x, y: cy - r * y, c };
}

/** An ellipse that is foreshortened along the direction from the disc centre, like a real round feature seen on a sphere. */
function patch(pt: Pt, cx: number, cy: number, ang: number, r: number, fill: string, opacity = 1): string {
  const rx = ang * r;
  const ry = Math.max(0.25, pt.c) * rx;
  const deg = (Math.atan2(pt.y - cy, pt.x - cx) * 180) / Math.PI;
  return `<ellipse cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" rx="${ry.toFixed(1)}" ry="${rx.toFixed(1)}" transform="rotate(${(deg - 90 + 90).toFixed(1)} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)})" fill="${fill}" opacity="${opacity}"/>`;
}

function feat(f: Feature, pt: Pt, ringR: number, ring: string, fillInside: string, labelDx: number): string {
  const label = `<text class="featlabel" x="${(pt.x + labelDx).toFixed(1)}" y="${(pt.y + 4).toFixed(1)}" text-anchor="${labelDx < 0 ? 'end' : 'start'}" font-size="11" fill="#14264d" paint-order="stroke" stroke="#ffffffd9" stroke-width="3" stroke-linejoin="round">${f.name}</text>`;
  return `<g class="feat" data-feat="${f.id}" tabindex="0" role="button" aria-label="${f.name}"><circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${Math.max(16, ringR + 8).toFixed(1)}" fill="transparent"/><circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${ringR.toFixed(1)}" fill="${fillInside}" stroke="${ring}" stroke-width="1.8"/>${label}</g>`;
}

const VISIBLE = 0.12;
/** Which side of its ring each Moon label sits on, chosen so neighbouring labels do not collide. */
const MOON_SIDE: Record<string, 1 | -1> = { tycho: 1, copernicus: 1, kepler: -1, aristarchus: -1, plato: 1, grimaldi: 1 };

export function israelPoint(cx: number, cy: number, r: number): [number, number] {
  const k = r / earth.r;
  return [cx - r + earth.israel[0] * k, cy - r + earth.israel[1] * k];
}

/** Earth with real continents. Meant to be placed low on the map with only its top cap showing: Israel is near the top. */
export function earthGroup(cx: number, cy: number, r: number): string {
  const id = `earth${uid++}`;
  const k = r / earth.r;
  const [ix, iy] = israelPoint(cx, cy, r);
  const sand = (earth.sand as number[][]).map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#d8cf94" opacity=".4"/>`).join('');
  const clouds = [[-0.5, 0.1, 0.2, 0.05], [0.45, 0.3, 0.24, 0.05], [-0.1, 0.55, 0.2, 0.05], [0.55, -0.1, 0.12, 0.04]]
    .map(([dx, dy, w, h]) => `<ellipse cx="${(cx + dx * r).toFixed(1)}" cy="${(cy + dy * r).toFixed(1)}" rx="${(w * r).toFixed(1)}" ry="${(h * r).toFixed(1)}" fill="#fff" opacity=".45"/>`)
    .join('');
  return `<g class="planet"><defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath><clipPath id="${id}land"><path transform="translate(${cx - r} ${cy - r}) scale(${k})" d="${earth.land}"/></clipPath></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="#4b8fd6"/><g clip-path="url(#${id})"><path transform="translate(${cx - r} ${cy - r}) scale(${k})" d="${earth.land}" fill="#62b56e" stroke="#4a9a58" stroke-width="${(1 / k).toFixed(2)}"/><g clip-path="url(#${id}land)"><g transform="translate(${cx - r} ${cy - r}) scale(${k})">${sand}</g></g>${clouds}</g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#a9d1f5" stroke-width="${Math.max(4, r * 0.03).toFixed(1)}"/><g class="israel"><circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="14" fill="#ff5a3c" opacity=".25"/><circle cx="${ix.toFixed(1)}" cy="${iy.toFixed(1)}" r="6" fill="#ff5a3c" stroke="#fff" stroke-width="2"/><text x="${(ix + 14).toFixed(1)}" y="${(iy - 8).toFixed(1)}" font-size="12" font-weight="600" fill="#14264d" paint-order="stroke" stroke="#ffffffd9" stroke-width="3" stroke-linejoin="round">Israel: launch site</text></g></g>`;
}

const MARIA: [number, number, number][] = [
  [32.8, -15.6, 0.17], [28, 17.5, 0.2], [8.5, 31.4, 0.2], [17, 59, 0.15], [18, -57, 0.42], [-21, -16, 0.2], [-24, -39, 0.12], [-7.8, 51, 0.18],
];

/** Near side of the Moon (centred on lat 0, lon 0). Maria are approximate shapes. Crater sizes are not to scale: they are drawn bigger so you can see and tap them. */
export function moonGroup(cx: number, cy: number, r: number): string {
  const id = `moon${uid++}`;
  const maria = MARIA.map(([lat, lon, a]) => {
    const p = proj(lat, lon, 0, 0, cx, cy, r);
    return p.c > 0.05 ? patch(p, cx, cy, a, r, '#aeb5c4', 0.85) : '';
  }).join('');
  let s = `<g class="planet"><defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="#dde2ec"/><g clip-path="url(#${id})">${maria}`;
  const tycho = proj(-43.3, -11.4, 0, 0, cx, cy, r);
  if (tycho.c > VISIBLE) {
    for (const a of [-60, -20, 15, 45, 80, 120, 160, 200, 250, 290]) {
      const len = r * (0.25 + 0.12 * Math.abs(Math.sin(rad(a * 2.3))));
      s += `<line x1="${tycho.x.toFixed(1)}" y1="${tycho.y.toFixed(1)}" x2="${(tycho.x + Math.cos(rad(a)) * len).toFixed(1)}" y2="${(tycho.y + Math.sin(rad(a)) * len).toFixed(1)}" stroke="#fff" stroke-width="1.6" opacity=".7"/>`;
    }
  }
  s += '</g>';
  for (const f of FEATURES.filter((x) => x.body === 'moon')) {
    const p = proj(f.lat, f.lon, 0, 0, cx, cy, r);
    if (p.c <= VISIBLE) continue;
    s += feat(f, p, r * (0.012 + f.sizeKm / (1737 * 2) * 1.5), '#6f7890', '#cfd5e2', (MOON_SIDE[f.id] ?? 1) * 12);
  }
  return `${s}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c0c8d9" stroke-width="3"/></g>`;
}

/** Mars centred on lat 5S, lon 110E, where Hellas, Syrtis Major, Jezero, Gale and Elysium Mons are all on view. Shapes and sizes are approximate. */
export function marsGroup(cx: number, cy: number, r: number): string {
  const id = `mars${uid++}`;
  const lat0 = -5, lon0 = 110;
  const P = (lat: number, lon: number) => proj(lat, lon, lat0, lon0, cx, cy, r);
  const f = (name: string) => FEATURES.find((x) => x.id === name)!;
  let s = `<g class="planet"><defs><clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="#eb9468"/><g clip-path="url(#${id})">`;
  s += patch(P(8, 69), cx, cy, 0.2, r, '#b9603b', 0.8);
  s += patch(P(-42.7, 70), cx, cy, 0.32, r, '#f3c3a1', 0.95);
  const pole = P(90, 0);
  s += `<ellipse cx="${pole.x.toFixed(1)}" cy="${pole.y.toFixed(1)}" rx="${(r * 0.3).toFixed(1)}" ry="${(r * 0.12).toFixed(1)}" fill="#fff" opacity=".85"/></g>`;
  const spec: [string, number, string, string, number][] = [
    ['hellas', 0, '#d9895f', 'none', 1], ['syrtis', 0, '#8d4528', 'none', 1], ['jezero', 6, '#7a3a22', '#f7d8bf', 1], ['gale', 7, '#7a3a22', '#f7d8bf', 1], ['elysium', 8, '#7a3a22', '#c77a50', 1],
  ];
  for (const [name, ringR, ring, fill, dir] of spec) {
    const ft = f(name);
    const p = P(ft.lat, ft.lon);
    if (p.c <= VISIBLE) continue;
    s += feat(ft, p, ringR, ring, fill, dir * 12);
  }
  return `${s}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#d4825a" stroke-width="4"/></g>`;
}
