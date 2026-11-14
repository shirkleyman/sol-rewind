export const astroInner = (accent: string, helmet = '#fff'): string =>
  `<rect x="4" y="18" width="9" height="22" rx="3" fill="#c9d6ee"/><rect x="10" y="20" width="22" height="24" rx="8" fill="#fff" stroke="#9fb0d8" stroke-width="1.5"/><rect class="leg l" x="13" y="44" width="7" height="10" rx="3" fill="#fff" stroke="#9fb0d8" stroke-width="1.5"/><rect class="leg r" x="23" y="44" width="7" height="10" rx="3" fill="#fff" stroke="#9fb0d8" stroke-width="1.5"/><rect x="13" y="51" width="7" height="4" rx="2" fill="${accent}"/><rect x="23" y="51" width="7" height="4" rx="2" fill="${accent}"/><circle cx="22" cy="14" r="12" fill="${helmet}" stroke="#9fb0d8" stroke-width="1.5"/><ellipse cx="24" cy="15" rx="8" ry="6.5" fill="#2a4a7a"/><ellipse cx="26" cy="13" rx="2.5" ry="1.6" fill="#7fb2ee"/><rect x="26" y="26" width="9" height="5" rx="2.5" fill="#fff" stroke="#9fb0d8" stroke-width="1.5"/><rect x="16" y="29" width="6" height="4" rx="2" fill="${accent}"/>`;

export const astro = (accent: string, helmet = '#fff'): string => `<svg viewBox="0 0 40 56" width="100%" height="100%" aria-hidden="true">${astroInner(accent, helmet)}</svg>`;

export const star = (filled: boolean, x: number, y: number, s: number): string =>
  `<path transform="translate(${x},${y}) scale(${s})" d="M0,-6 L1.76,-1.8 L6.4,-1.5 L2.9,1.5 L4,6 L0,3.6 L-4,6 L-2.9,1.5 L-6.4,-1.5 L-1.76,-1.8Z" fill="${filled ? '#f5b301' : '#dbe3f3'}" stroke="${filled ? '#c98a00' : '#c3cfe6'}" stroke-width=".8"/>`;

export const starRow = (n: number, w = 120): string =>
  `<svg viewBox="0 0 80 24" width="${w}" role="img" aria-label="${n} of 3 stars">${star(n > 0, 12, 12, 1.8)}${star(n > 1, 40, 12, 1.8)}${star(n > 2, 68, 12, 1.8)}</svg>`;

export const windowSky = (world: 'moon' | 'mars', sky: string, ground: string): string =>
  `<svg viewBox="0 0 230 92" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="230" height="92" fill="${sky}"/><circle cx="30" cy="20" r="1.4" fill="#dfe6f6"/><circle cx="90" cy="35" r="1.2" fill="#dfe6f6"/><circle cx="170" cy="14" r="1.4" fill="#dfe6f6"/>${
    world === 'moon' ? '<circle cx="185" cy="30" r="12" fill="#3b82c4"/><circle cx="181" cy="26" r="5" fill="#6fb0e8"/>' : '<circle cx="185" cy="30" r="3" fill="#a9c8ee"/>'
  }<path d="M0 68 Q60 56 120 66 T230 62 V92 H0Z" fill="${ground}"/></svg>`;
