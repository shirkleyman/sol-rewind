import { roverById } from '../core/rovers';
import type { RoverId } from '../core/rovers';
import { skillById } from '../core/skills';
import './companion.css';

const photos = import.meta.glob('../assets/rovers/*.jpg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const photoUrl = (file: string): string => photos[`../assets/rovers/${file}`] ?? '';

const mesh = (cx: number, cy: number, r: number): string => {
  const lines = [0, 45, 90, 135]
    .map((a) => {
      const rad = (a * Math.PI) / 180;
      const dx = Math.cos(rad) * r;
      const dy = Math.sin(rad) * r;
      return `<line x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}"/>`;
    })
    .join('');
  return `<g class="rv-wheel"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#3b4256"/><circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="none" stroke="#9aa6c0" stroke-width="1.2"/><g stroke="#9aa6c0" stroke-width="1">${lines}</g><circle cx="${cx}" cy="${cy}" r="2" fill="#dfe5f0"/></g>`;
};

const buggySvg = (): string =>
  `<ellipse cx="60" cy="74" rx="46" ry="4" fill="#0000001a"/>` +
  mesh(38, 57, 9) +
  mesh(94, 57, 9) +
  `<rect x="22" y="44" width="78" height="7" rx="3" fill="#dfe5f0" stroke="#b7c1d6"/>` +
  `<rect x="40" y="39" width="18" height="5" rx="2" fill="#fff" stroke="#b7c1d6"/><rect x="46" y="25" width="8" height="15" rx="3" fill="#fff" stroke="#b7c1d6"/>` +
  `<rect x="62" y="39" width="18" height="5" rx="2" fill="#fff" stroke="#b7c1d6"/><rect x="68" y="25" width="8" height="15" rx="3" fill="#fff" stroke="#b7c1d6"/>` +
  `<rect x="24" y="31" width="4" height="14" fill="#b7c1d6"/><rect x="15" y="25" width="20" height="11" rx="4" fill="#fff" stroke="#b7c1d6"/>` +
  `<circle cx="22" cy="30" r="2.8" fill="#fff" stroke="#8e9ab4"/><circle cx="22.6" cy="30.4" r="1.2" fill="#14264d"/><circle cx="29" cy="30" r="2.8" fill="#fff" stroke="#8e9ab4"/><circle cx="29.6" cy="30.4" r="1.2" fill="#14264d"/><path d="M21 34 q4 3 8 0" fill="none" stroke="#14264d" stroke-width="1.2" stroke-linecap="round"/>` +
  `<line x1="100" y1="46" x2="100" y2="14" stroke="#b7c1d6" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="100" cy="12" rx="12" ry="5" fill="#e8b84a" stroke="#c9962e" transform="rotate(-18 100 12)"/><line x1="100" y1="12" x2="106" y2="6" stroke="#c9962e" stroke-width="1.5"/>` +
  mesh(30, 62, 12) +
  mesh(90, 62, 12) +
  `<path d="M16 59 Q30 42 44 59" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M76 59 Q90 42 104 59" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>`;

const curioSvg = (): string =>
  `<ellipse cx="60" cy="75" rx="50" ry="4" fill="#0000001a"/>` +
  mesh(44, 56, 8) +
  mesh(68, 56, 8) +
  mesh(92, 56, 8) +
  `<path d="M26 63 L46 51 H80 L100 63" fill="none" stroke="#8e9ab4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<rect x="94" y="36" width="22" height="10" rx="5" fill="#3b4256"/><g stroke="#9aa6c0" stroke-width="1.4"><line x1="100" y1="36" x2="100" y2="46"/><line x1="105" y1="36" x2="105" y2="46"/><line x1="110" y1="36" x2="110" y2="46"/></g>` +
  `<rect x="28" y="33" width="66" height="18" rx="5" fill="#e9edf5" stroke="#b7c1d6"/><rect x="34" y="37" width="20" height="10" rx="2.5" fill="#e8b84a" stroke="#c9962e"/><rect x="60" y="37" width="26" height="10" rx="2.5" fill="#fff" stroke="#c9d2e4"/>` +
  `<rect x="30" y="28" width="60" height="6" rx="3" fill="#fff" stroke="#b7c1d6"/>` +
  `<rect x="66" y="16" width="3.5" height="13" fill="#b7c1d6"/>` +
  `<g class="rv-head"><rect x="56" y="5" width="26" height="12" rx="4" fill="#fff" stroke="#b7c1d6"/><circle cx="63" cy="11" r="3.4" fill="#3b4256"/><circle cx="62" cy="10" r="1" fill="#fff"/><circle cx="75" cy="11" r="3.4" fill="#3b4256"/><circle cx="74" cy="10" r="1" fill="#fff"/><path d="M66 14.5 q3 2 6 0" fill="none" stroke="#8e9ab4" stroke-width="1" stroke-linecap="round"/></g>` +
  `<polyline points="32,41 16,48 9,58" fill="none" stroke="#8e9ab4" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="60" r="4.2" fill="#e8b84a" stroke="#c9962e"/>` +
  mesh(26, 64, 11) +
  mesh(60, 64, 11) +
  mesh(94, 64, 11);

/** A flat, friendly drawing of the rover. Put the class `moving` on a parent to spin the wheels. */
export function roverSvg(id: RoverId, opts?: { cls?: string }): string {
  const r = roverById(id);
  return `<svg class="rv-svg ${opts?.cls ?? ''}" viewBox="0 0 120 80" role="img" aria-label="Drawing of ${r.nickname}, the ${r.name}">${id === 'buggy' ? buggySvg() : curioSvg()}</svg>`;
}

function cardInner(id: RoverId, index: number): string {
  const r = roverById(id);
  const n = r.facts.length;
  const i = ((index % n) + n) % n;
  const f = r.facts[i];
  const skill = f.skill ? `<span class="rv-chip">Connects to: ${skillById(f.skill).name}</span>` : '';
  const sources = r.sources.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a>`).join(' · ');
  return `<h2 class="rv-title">Meet ${r.nickname}</h2><div class="rv-tag">${r.tagline}</div>
    <figure class="rv-photo"><img src="${photoUrl(r.photo.file)}" alt="${r.photo.title}" loading="lazy" /><figcaption>Photo: ${r.photo.title}. Credit: ${r.photo.credit}. <a href="${r.photo.page}" target="_blank" rel="noopener noreferrer">NASA image ${r.photo.nasaId}</a></figcaption></figure>
    <div class="rv-fact" aria-live="polite"><div class="rv-count">Fact ${i + 1} of ${n}</div><div class="rv-ftitle">${f.title}</div><p>${f.text}</p>${skill}</div>
    <div class="rv-nav"><button class="btn rv-btn" data-rover="prev" aria-label="Previous fact">Previous</button><button class="btn primary rv-btn" data-rover="next" aria-label="Next fact">Next fact</button></div>
    <div class="rv-src">Sources: ${sources}</div>`;
}

/** Inner HTML for an overlay box. Call bindRoverCard on the container afterwards. */
export function roverCardHtml(id: RoverId, factIndex = 0): string {
  return `<div class="rv-card" data-rv-id="${id}" data-rv-index="${factIndex}">${cardInner(id, factIndex)}</div>`;
}

/** Wires Previous and Next inside `root`. The card re-draws itself in place. */
export function bindRoverCard(root: HTMLElement, id: RoverId, start = 0): void {
  const card = root.querySelector<HTMLElement>(`.rv-card[data-rv-id="${id}"]`);
  if (!card) return;
  let i = start;
  card.innerHTML = cardInner(id, i);
  card.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-rover]');
    if (!b) return;
    i += b.dataset.rover === 'prev' ? -1 : 1;
    const n = roverById(id).facts.length;
    i = ((i % n) + n) % n;
    card.dataset.rvIndex = String(i);
    card.innerHTML = cardInner(id, i);
    card.querySelector<HTMLElement>(`[data-rover="${b.dataset.rover}"]`)?.focus();
  });
}

/** A short welcome card for the first level of a world. */
export function roverIntroHtml(id: RoverId): string {
  const r = roverById(id);
  const intro =
    id === 'buggy'
      ? "I'm a real rover that drove on the Moon during Apollo 15, 16 and 17. Real astronauts rode on me, and we are still there today."
      : "I'm a real rover that is driving on Mars right now. I landed in Gale Crater in 2012 to find out if tiny life could have lived there long ago.";
  const f = r.facts[0];
  return `<div class="rv-intro"><div class="rv-intro-art moving">${roverSvg(id)}</div><div class="rv-speech"><b>Hi, I'm ${r.nickname}!</b><p>${intro}</p><p class="rv-first"><b>${f.title}.</b> ${f.text}</p><p class="rv-note">I'll give you tips while you play.</p></div></div>`;
}
