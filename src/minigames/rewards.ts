import type { GameCtx } from './types';

/**
 * A small animated picture shown with the result of each mini game, so a good run is something you can see:
 * a battery that fills, a tank that fills with water, a shield dome that glows, plants that grow,
 * and a scan that reveals the real NASA photo of the place you are at.
 */
export function rewardHtml(game: string, stars: number, ctx: Pick<GameCtx, 'photo' | 'world'>): string {
  const lvl = [0, 35, 68, 100][stars];
  switch (game) {
    case 'power':
      return `<div class="rw"><div class="rw-batt" role="img" aria-label="Battery charged ${lvl} percent"><div class="rw-battfill" style="--lvl:${lvl}%"></div><span class="rw-bolt">+</span></div></div>`;
    case 'water':
      return `<div class="rw"><div class="rw-tank" role="img" aria-label="Water tank filled ${lvl} percent"><div class="rw-water" style="--lvl:${lvl}%"></div></div></div>`;
    case 'shield':
      return `<div class="rw"><div class="rw-dome" role="img" aria-label="Shield strength ${stars} of 3"><i class="r1 ${stars >= 1 ? 'on' : ''}"></i><i class="r2 ${stars >= 2 ? 'on' : ''}"></i><i class="r3 ${stars >= 3 ? 'on' : ''}"></i><b></b></div></div>`;
    case 'plants':
      return `<div class="rw rw-plants" role="img" aria-label="Plants grew to stage ${stars} of 3">${[1, 2, 3].map((n) => `<div class="rw-pot"><span class="stem ${n <= stars ? 'grow' : ''}" style="--h:${n <= stars ? 26 + stars * 10 : 8}px"></span><span class="leaf l1 ${n <= stars ? 'grow' : ''}"></span><span class="leaf l2 ${n <= stars ? 'grow' : ''}"></span></div>`).join('')}</div>`;
    case 'rocks':
      return ctx.photo
        ? `<div class="rw"><div class="rw-scan" role="img" aria-label="Scan revealed ${lvl} percent of the real photo"><div class="rw-photo" style="background-image:url(${ctx.photo});--rev:${lvl}%"></div><div class="rw-line" style="--rev:${lvl}%"></div><span class="rw-pct">${lvl}% scanned</span></div></div>`
        : '';
    case 'sensor':
      return `<div class="rw"><div class="rw-ring ${stars >= 3 ? 'great' : stars === 2 ? 'ok' : ''}"><i></i></div></div>`;
    case 'rest':
      return `<div class="rw"><div class="rw-calm s${stars}"><i></i><i></i><i></i></div></div>`;
    case 'repair':
      return `<div class="rw"><div class="rw-wire s${stars}"><i></i><i></i><i></i></div></div>`;
  }
  return '';
}
