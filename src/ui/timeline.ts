import { dayDelta, dayTrace, stormFor } from '../core/rules';
import type { Action, LevelConfig, Plan, SimState, Verdict } from '../core/types';
import { icon } from './icons';
import type { IconName } from './icons';

export const VERDICT_COLOR: Record<Verdict, string> = { good: '#2fa36b', ok: '#e0a31a', bad: '#d9475f' };
const FACE: Record<Verdict, IconName> = { good: 'moodSmile', ok: 'moodNeutral', bad: 'moodSad' };
const TITLE: Record<Verdict, string> = { good: 'a great day!', ok: 'an okay day', bad: 'a rough day' };
const NOTE: Record<Verdict, string> = {
  good: 'You gained more than you spent. Nice planning.',
  ok: 'Not bad. Could you do a bit better?',
  bad: 'Things got worse today. Want to try this day again?',
};

const SERIES = [
  { key: 'p', color: '#e8a317', name: 'Power', ic: 'bolt' as IconName },
  { key: 'w', color: '#3b9be8', name: 'Water', ic: 'droplet' as IconName },
  { key: 's', color: '#8b5cf6', name: 'Science', ic: 'flask' as IconName },
] as const;

type P = [number, number];

/** A soft curve through the points that never swings past them. */
function smooth(pts: P[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const lo = Math.min(p1[1], p2[1]);
    const hi = Math.max(p1[1], p2[1]);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, Math.max(lo, Math.min(hi, p1[1] + (p2[1] - p0[1]) / 6))];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, Math.max(lo, Math.min(hi, p2[1] - (p3[1] - p1[1]) / 6))];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function ghostLine(level: LevelConfig, ghost: SimState, i: number, now: { ds: number; g: number }): string {
  const g = dayDelta(level, ghost, i);
  const diff = (a: number, b: number) => (Math.round(a - b) === 0 ? 'same' : Math.round(a - b) > 0 ? `+${Math.round(a - b)}` : `${Math.round(a - b)}`);
  return `<div class="dl ghostcmp">${icon('ghost')} <span class="note">Last try, day ${i}: science ${g.ds >= 0 ? '+' : ''}${Math.round(g.ds)}, radiation +${Math.round(g.g)}. Now vs then: science ${diff(now.ds, g.ds)}, radiation ${diff(now.g, g.g)}.</span></div>`;
}

export interface TimelineInput {
  level: LevelConfig;
  plan: Plan;
  today: Action[];
  S: SimState;
  live: SimState;
  sel: number;
  over: boolean;
  carried: number;
  dose: number;
  px: number;
  /** The state of the previous attempt, drawn as a faint ghost line to compare with. */
  ghost?: SimState | null;
}

/**
 * One picture for the whole mission: a day header (with a face for how the day went), a soft graph of
 * power, water and science that flows through the days, and a radiation row that only ever grows.
 */
export function timelineHtml(o: TimelineInput): string {
  const { level, plan, today, S, live, sel, over, carried, dose, ghost } = o;
  const n = level.days;
  const W = Math.max(300, Math.round(o.px));
  const cw = W / n;
  const H = 168;
  const top = 12;
  const plotH = H - top - 10;
  const y = (v: number) => top + (1 - Math.max(0, Math.min(100, v)) / 100) * plotH;
  const val = (r: { p: number; w: number; s: number }, k: 'p' | 'w' | 's') => (k === 's' ? Math.min(100, (r.s / level.goal) * 100) : r[k]);
  const slots = level.actions + 1;

  const done: { day: number; pts: P[]; raw: { p: number; w: number; s: number }[] }[] = [];
  for (let i = 1; i <= S.h.length; i++) {
    const tr = dayTrace(level, plan, today, i);
    const m = tr.length;
    done.push({ day: i, raw: tr, pts: tr.map((_, k) => [(i - 1) * cw + cw * (0.1 + (0.8 * k) / Math.max(1, m - 1)), 0] as P) });
  }
  const showToday = !over && today.length > 0;
  const trToday = showToday ? dayTrace(level, plan, today, S.h.length + 1) : [];
  const nowX = (k: number) => S.h.length * cw + cw * (0.1 + (0.8 * k) / slots);

  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Graph of power, water and science through the days">`;
  for (let i = 1; i <= n; i++) {
    const isSel = sel === i;
    const isNow = i === S.h.length + 1 && !over;
    svg += `<rect x="${(i - 1) * cw}" y="0" width="${cw}" height="${H}" fill="${isSel ? '#e3efff' : i % 2 ? '#f7faff' : '#ffffff'}"/>`;
    if (isNow) svg += `<rect x="${(i - 1) * cw + 2}" y="2" width="${cw - 4}" height="${H - 4}" rx="10" fill="none" stroke="var(--acc)" stroke-width="2" stroke-dasharray="5 4"/>`;
    if (i < n) svg += `<line x1="${i * cw}" y1="6" x2="${i * cw}" y2="${H - 6}" stroke="#e3eaf7" stroke-dasharray="2 4"/>`;
  }
  svg += `<rect x="0" y="${y(20)}" width="${W}" height="${y(0) - y(20)}" fill="#ffe7e3" opacity=".75"/><text x="6" y="${y(0) - 4}" font-size="12" fill="#c0554a">low!</text>`;
  svg += `<line x1="0" x2="${W}" y1="${y(100)}" y2="${y(100)}" stroke="#8b5cf6" stroke-opacity=".35" stroke-dasharray="4 5"/><text x="${W - 6}" y="${y(100) + 14}" text-anchor="end" font-size="12" fill="#7c5cd6">science goal</text>`;

  if (ghost && ghost.h.length) {
    SERIES.forEach(({ key, color }) => {
      const gp: P[] = ghost.h.slice(0, n).map((r, i) => [i * cw + cw * 0.9, y(val(r, key))] as P);
      if (gp.length >= 2) svg += `<polyline fill="none" stroke="${color}" stroke-opacity=".38" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" points="${gp.map((p) => p.join(',')).join(' ')}"/>`;
      gp.forEach(([x, yy]) => {
        svg += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="2.6" fill="#fff" stroke="${color}" stroke-opacity=".5"/>`;
      });
    });
  }
  SERIES.forEach(({ key, color }) => {
    const pts: P[] = [];
    done.forEach((d) => d.raw.forEach((r, k) => pts.push([d.pts[k][0], y(val(r, key))])));
    if (pts.length >= 2) {
      const path = smooth(pts);
      svg += `<path d="${path} L${pts[pts.length - 1][0]} ${y(0)} L${pts[0][0]} ${y(0)} Z" fill="${color}" opacity=".08"/>`;
      svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    pts.forEach(([x, yy]) => {
      svg += `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="3.6" fill="${color}" stroke="#fff" stroke-width="1.6"/>`;
    });
    if (showToday) {
      const last = pts[pts.length - 1];
      const start: P = last ?? [nowX(0), y(val(trToday[0], key))];
      const live2: P[] = trToday.map((r, k) => [nowX(k), y(val(r, key))] as P);
      svg += `<polyline fill="none" stroke="${color}" stroke-width="2.6" stroke-dasharray="5 5" stroke-linecap="round" points="${[start, ...live2].map((p) => p.join(',')).join(' ')}"/>`;
      live2.forEach(([x, yy]) => {
        svg += `<circle cx="${x}" cy="${yy}" r="4.4" fill="#fff" stroke="${color}" stroke-width="2.2"/>`;
      });
    }
  });
  void live;
  svg += '</svg>';

  let head = `<div class="tl-row" style="--n:${n}">`;
  for (let i = 1; i <= n; i++) {
    const storm = stormFor(level, i);
    const ev = level.events.filter((e) => e.day === i);
    const badges =
      (storm ? `<span class="tb storm" title="Solar storm">${icon('bolt')}</span>` : '') +
      ev.map((e) => `<span class="tb ${e.type}" title="${e.type === 'dust' ? 'Dust storm' : 'Something breaks'}">${icon(e.type === 'dust' ? 'sun' : 'tool')}</span>`).join('');
    if (i <= S.h.length) {
      const d = dayDelta(level, S, i);
      head += `<button class="tday done ${sel === i ? 'sel' : ''}" data-d="${i}" style="--v:${VERDICT_COLOR[d.v]}" aria-label="Day ${i}: ${TITLE[d.v]} Tap to look closer."><span class="face">${icon(FACE[d.v])}</span><span class="dn">Day ${i}</span><span class="tbs">${badges}</span></button>`;
    } else if (i === S.h.length + 1 && !over) {
      head += `<div class="tday now" aria-label="Today, day ${i}"><span class="face">${icon('rocket')}</span><span class="dn">Today</span><span class="tbs">${badges}</span></div>`;
    } else {
      head += `<div class="tday fut" aria-label="Day ${i}, coming up"><span class="face dim">${icon('moon')}</span><span class="dn">Day ${i}</span><span class="tbs">${badges}</span></div>`;
    }
  }
  head += '</div>';

  let rad = `<div class="tl-rad-head"><span>${icon('lock')} Radiation <span class="note">only goes up</span></span><span class="chip">Total ${Math.round(dose)} / 100</span>${carried > 0 ? `<span class="chip carried" title="Radiation kept from days you replayed">kept from replays +${Math.round(carried)}</span>` : ''}<span class="chip lim">3-star limit ${level.lowDose}</span></div><div class="tl-row rads" style="--n:${n}">`;
  for (let i = 1; i <= n; i++) {
    const g = i <= S.g.length ? S.g[i - 1] : 0;
    const high = g >= 18;
    rad += `<div class="rcell ${i <= S.g.length ? '' : 'empty'}"><div class="rtrack"><div class="rfill ${high ? 'high' : ''}" style="height:${Math.min(100, (g / 40) * 100)}%"></div></div><span class="rn">${i <= S.g.length ? '+' + Math.round(g) : ''}</span></div>`;
  }
  rad += '</div>';

  let detail = `<div class="tl-detail hint"><span class="face dim">${icon('bulb')}</span><div>Play a day and the picture fills in. Each face shows how that day went, and you can tap a finished day to look closer.</div></div>`;
  if (sel >= 1 && sel <= S.h.length) {
    const d = dayDelta(level, S, sel);
    const lost = S.g.slice(sel - 1).reduce((x, y2) => x + y2, 0);
    const chip = (v: number, label: string, ic: IconName) => {
      const r = Math.round(v);
      return `<span class="dchip ${r >= 0 ? 'up' : 'down'}">${icon(ic)} ${label} ${r >= 0 ? '+' : ''}${r}</span>`;
    };
    detail = `<div class="tl-detail" style="--v:${VERDICT_COLOR[d.v]}"><span class="face big">${icon(FACE[d.v])}</span><div class="td-main"><div class="td-title">Day ${sel} was ${TITLE[d.v]}</div><div class="note">${d.g >= 18 ? 'A storm hit and the crew was not well shielded.' : NOTE[d.v]}</div><div class="dl">${chip(d.dp, 'Power', 'bolt')}${chip(d.dw, 'Water', 'droplet')}${chip(d.ds, 'Science', 'flask')}<span class="dchip rad">${icon('arrowUp')} Radiation +${Math.round(d.g)}</span></div>${ghost && sel <= ghost.h.length ? ghostLine(level, ghost, sel, d) : ''}</div><div class="td-act"><button class="btn primary" id="rw">${icon('history')} Try day ${sel} again</button><div class="note">Radiation +${Math.round(lost)} stays</div></div></div>`;
  }

  const legend = SERIES.map((s) => `<span class="lgd"><i style="background:${s.color}"></i>${icon(s.ic)} ${s.name}</span>`).join('') + (ghost && ghost.h.length ? `<span class="lgd ghostlg">${icon('ghost')} Last try (dots)</span>` : '');
  return `<div class="timeline"><div class="tl-title"><span class="tl-h">Your mission so far</span><span class="lg2">${legend}</span></div>${head}<div class="tl-plot">${svg}</div>${rad}${detail}</div>`;
}
