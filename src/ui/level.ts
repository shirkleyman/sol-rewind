import {
  STAR_YIELD, canDo, costOf, costText, evaluate, liveState, rewindTo, simulate, stationLabel, stormFor, yieldAmount, starsFromScore,
} from '../core/rules';
import { EDU } from '../core/edu';
import { rerollStorms } from '../core/levels';
import { photoUrl, siteFor } from '../core/sites';
import type { Site } from '../core/sites';
import type { EduKey } from '../core/edu';
import { expForDay } from '../core/rules';
import { skillById, tierName } from '../core/skills';
import type { Action, LevelConfig, Plan, StationId } from '../core/types';
import { LEVELS } from '../core/levels';
import { gameFor } from '../minigames';
import { rewardHtml } from '../minigames/rewards';
import radiation from '../data/radiation.json';
import { astro, starRow } from './art';
import { pickTip } from './coach';
import type { Tip } from './coach';
import { roverFor } from '../core/rovers';
import { bindRoverCard, roverCardHtml, roverSvg } from './companion';
import { icon } from './icons';
import type { IconName } from './icons';
import { sceneSvg } from './scene';
import { sfx } from './sound';
import { timelineHtml } from './timeline';
import { bindPostcard, postcardHtml } from './postcard';
import { bindNameForm, certificateHtml, nameFormHtml, printCertificate } from './certificate';
import { surpriseFor } from '../core/surprises';
import { runSurprise } from './surprise';
import { heroHtml } from './hero';
import type { HeroKind } from './hero';
import { plain, speak, speakOnce, stopSpeaking, voiceSupported } from './voice';

export interface LevelHooks {
  onExit: () => void;
  onFinish: (stars: number, sci: number, dose: number) => void;
  onNext: (() => void) | null;
  onToggleSound: () => boolean;
  onToggleMusic: () => boolean;
  onToggleVoice: () => boolean;
  voiceOn: boolean;
  helmet: string;
  getName: () => string;
  setName: (n: string) => void;
  getTotalStars: () => number;
  addRocks: (n: number) => void;
  musicOn: boolean;
  getStars: () => number[];
  soundOn: boolean;
}

const ST_STYLE: Record<StationId, { ic: IconName; color: string }> = {
  exp: { ic: 'flask', color: '#7c5cff' },
  water: { ic: 'droplet', color: '#1f8fe0' },
  power: { ic: 'batteryCharging', color: '#d8920a' },
  shield: { ic: 'shield', color: '#d9475f' },
  rest: { ic: 'heart', color: '#3dbf7f' },
  repair: { ic: 'tool', color: '#6b7a99' },
};

export const SKILL_ICON: Record<string, IconName> = { power: 'bolt', life: 'droplet', radiation: 'shield', systems: 'history', crew: 'heart', adapt: 'tool' };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class LevelView {
  private plan: Plan = [];
  private today: Action[] = [];
  private carried = 0;
  private rewinds = 0;
  private sel = 0;
  private msg = '';
  private busy = false;
  private briefing = true;
  private started = false;
  private reported = false;
  private alarmDay = 0;
  private info = false;
  private baseLevel: LevelConfig;
  private variant = 0;
  private charFrac = 0.5;
  private dir = 1;
  private eduKey: EduKey | null = null;
  private roverOpen = false;
  private roverFrac = 0.4;
  private seenFacts = new Set<string>();
  private tip: Tip | null = null;
  private seenTips = new Set<string>();
  private abort: AbortController | null = null;
  private resizeTimer = 0;
  private rvTimer = 0;
  /** The plan of the previous attempt. It shows up as a ghost to compare with. */
  private ghost: Plan | null = null;
  /** Extra days played after the mission was finished ("one more day"). */
  private bonus = 0;
  private seenSurprises = new Set<string>();
  private sAbort: AbortController | null = null;
  /** A sheet shown over the finish card: the postcard, the certificate, or the name form. */
  private sheet: 'postcard' | 'cert' | 'name' | null = null;

  constructor(private root: HTMLElement, private level: LevelConfig, private hooks: LevelHooks) {
    this.baseLevel = level;
  }

  private onResize = (): void => {
    if (this.busy) return;
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => {
      if (!this.busy) this.render();
    }, 200);
  };

  mount(): void {
    window.addEventListener('resize', this.onResize);
    this.render();
  }

  destroy(): void {
    stopSpeaking();
    this.sAbort?.abort();
    this.abort?.abort();
    window.removeEventListener('resize', this.onResize);
    window.clearTimeout(this.resizeTimer);
  }

  private dayDifficulty(day: number): number {
    return Math.min(1, this.level.difficulty + 0.04 * (day - 1));
  }

  private yieldLabel(k: StationId, m: number, day: number): string {
    const live = liveState(this.level, this.plan, this.today);
    const y = yieldAmount(this.level, live, k, m, day);
    switch (k) {
      case 'power': return `+${Math.round(y)} power`;
      case 'water': return `+${Math.round(y)} water`;
      case 'rest': return `+${Math.round(y)} energy`;
      case 'shield': return `Storm protection ${Math.round(y * 100)}%`;
      case 'exp': return `+${Math.round(y)} science`;
      default: return y > 0 ? 'Station repaired' : 'The repair did not hold';
    }
  }

  /** Stars and the mission result come only from the planned days. Bonus days are extra and never take stars away. */
  private status() {
    const L = this.level;
    const core = evaluate(L, this.plan.slice(0, L.days), this.carried);
    const ev = evaluate(L, this.plan, this.carried);
    const coreDone = core.finished;
    const inBonus = coreDone && this.plan.length < L.days + this.bonus && !ev.failed;
    const over = coreDone ? !inBonus : ev.finished || ev.failed;
    return { core, ev, coreDone, over };
  }

  private ghostState(): ReturnType<typeof simulate> | null {
    return this.ghost && this.ghost.length ? simulate(this.level, this.ghost.slice(0, this.level.days + 3)) : null;
  }

  private render(): void {
    const L = this.level;
    const T = L.theme;
    const { core, ev, coreDone, over } = this.status();
    const Ldays = L.days + this.bonus;
    const ghostS = this.ghostState();
    const day = this.plan.length + 1;
    const ghostToday = !over && this.ghost ? this.ghost[day - 1] ?? null : null;
    const live = liveState(L, this.plan, this.today);
    const storm = !over ? stormFor(L, day) : null;
    const dust = !over && live.dust;
    const broken = !over ? live.broken : null;
    if (this.plan.length === 0) this.sel = 0;
    else if (this.sel < 1 || this.sel > this.plan.length) this.sel = this.plan.length;
    if (coreDone && !this.reported) {
      this.reported = true;
      this.hooks.onFinish(core.stars, core.S.s, core.dose);
      sfx.win();
    }
    if (storm && this.alarmDay !== day && !this.briefing) {
      this.alarmDay = day;
      sfx.alarm();
    }
    if (!this.tip && !this.briefing && !this.info && !over && !this.busy) {
      const t = pickTip(L, ev, live, day, this.seenTips);
      if (t) {
        this.tip = t;
        this.seenTips.add(t.key);
      }
    }

    const meter = (label: string, ic: IconName, v: number, color: string) =>
      `<div class="mt"><div class="lb"><span>${icon(ic)} ${label}</span><span>${Math.round(v)}</span></div><div class="bar"><div style="background:${color};width:${Math.max(0, Math.min(100, v))}%"></div></div></div>`;

    const stations = L.stations
      .map((k) => {
        const st = ST_STYLE[k];
        const isBroken = broken === k;
        const c = costOf(L, k, day);
        return `<div class="stw"><button class="st ${isBroken ? 'broken' : ''}" data-t="${k}" aria-label="${stationLabel(L, k, day)}${isBroken ? ', out of order' : ''}">${ghostToday?.some((g) => g.k === k) ? `<span class="gbadge" title="Your last try used this today">${icon('ghost')}</span>` : ''}<div class="sic" style="background:${st.color}">${icon(st.ic)}</div>${stationLabel(L, k, day)}<small>${costText(c)}</small></button><button class="info" data-info="${this.eduFor(k, day)}" aria-label="How ${stationLabel(L, k, day)} works in real life">?</button></div>`;
      })
      .join('');

    let ov = '';
    if (this.briefing) ov = this.briefingHtml();
    else if (this.sheet && coreDone) ov = this.sheetHtml(core.stars);
    else if (this.roverOpen) ov = this.roverOverlay();
    else if (this.eduKey) ov = this.eduHtml(this.eduKey);
    else if (this.info) ov = this.infoHtml(storm?.label ?? null);
    else if (coreDone && over) ov = this.finishHtml(core.stars, core.S.s, core.dose, ev);
    else if (ev.failed && !coreDone) {
      ov = `<div class="ov"><div class="box">${heroHtml('fail', { size: 'sm' })}<h2>Mission failed</h2><div class="note" style="margin:6px 0 10px">${ev.S.failed ? 'Power or water ran out.' : 'Radiation got too high.'} Pick a day in the day strip and replay from there, or go back.</div><div class="row" style="justify-content:center"><button class="btn" data-act="dismiss">Look at the days</button><button class="btn" data-act="map">Back to the map</button></div></div></div>`;
    }

    const alerts =
      (storm ? `<div class="al">${icon('bolt')} Day ${day}: a real solar storm is coming (${storm.label}). A good shield run protects the crew. <button class="linkbtn" data-info="shield">Why does this matter?</button></div>` : '') +
      (dust ? `<div class="al dust">${icon('sun')} Day ${day}: a dust storm hides the sun. Solar charging gives half as much. <button class="linkbtn" data-info="dust">Learn about dust storms</button></div>` : '') +
      (broken ? `<div class="al">${icon('tool')} Equipment failure: the ${stationLabel(L, broken, day)} is out of order today. Fix it at the repair bay first. <button class="linkbtn" data-info="repair">Why do things break?</button></div>` : '');

    const coach = this.tip
      ? `<div class="coach" role="status">${icon(SKILL_ICON[this.tip.skill])}<div><div class="coach-skill">${roverFor(L.world).nickname} · ${skillById(this.tip.skill).name}</div>${this.tip.text}</div><button class="btn small" data-act="tip-ok">Got it</button></div>`
      : '';

    this.root.innerHTML = `<div class="frame lvl" style="--acc:${T.accent};--deck:${T.deck}">
      <div class="topbar"><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn small" id="back">${icon('arrowLeft')} Map</button><span class="chip">${L.world === 'moon' ? 'Moon' : 'Mars'} · level ${L.id}: ${L.title}</span><span class="chip">${over ? 'Finished' : `Day ${day} / ${Ldays} · task ${this.today.length + 1} of ${L.actions}`}</span></div><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn small" id="goals" aria-label="Mission goals and skills">${icon('bulb')} Skills</button><button class="btn small" id="mus" aria-label="Toggle music">${icon(this.hooks.musicOn ? 'music' : 'musicOff')}</button><button class="btn small" id="snd" aria-label="Toggle sound effects">${icon(this.hooks.soundOn ? 'volume' : 'volumeOff')}</button>${voiceSupported() ? `<button class="btn small ${this.hooks.voiceOn ? 'on' : ''}" id="vox" aria-pressed="${this.hooks.voiceOn}" aria-label="Read aloud">${icon('speakerphone')}</button>` : ''}</div></div>
      <div class="scene" id="scene"><div class="backdrop">${sceneSvg(T)}</div><div class="fx ${storm ? 'on' : ''}"></div>${dust ? '<div class="dust-fx"></div>' : ''}
        <div class="hud"><div class="meters">${meter('Power', 'bolt', live.p, '#e8a317')}${meter('Water', 'droplet', live.w, '#3b9be8')}${meter('Energy', 'heart', live.e, '#3dbf7f')}</div><div class="hud-side"><span class="chip">Science ${Math.round(live.s)} / ${L.goal}</span><span class="chip">Radiation ${Math.round(ev.dose)}</span><button class="btn small" id="win">${icon('infoCircle')} Look outside</button></div><div class="setting">${T.setting}</div></div>
        <div class="stations">${stations}</div><div class="floor" id="floor"><div class="rv-pal" id="rover" style="left:${this.roverPos() * 100}%;--dir:${this.dir}"><div class="flip">${roverSvg(roverFor(L.world).id)}</div></div><div class="ch idle" id="char" style="left:${this.charFrac * 100}%;--dir:${this.dir}"><div class="flip">${astro(T.accent, this.hooks.helmet)}</div></div></div>${ov}</div>
      ${coach}
      ${alerts}
      ${ghostToday ? `<div class="ghostrow">${icon('ghost')}<span><b>Ghost</b> (your last try) did on day ${day}: ${ghostToday.map((g) => stationLabel(L, g.k, day)).join(', ') || 'nothing'}</span></div>` : ''}
      <div class="row actions"><div class="note" style="flex:1;min-width:160px" aria-live="polite">${this.msg || this.roverSays(live, !!storm, dust, broken, ev.S.h.length)}</div><button class="btn" id="rvb">Ask ${roverFor(L.world).nickname}</button><button class="btn primary" id="end">End day</button></div>
      ${timelineHtml({ ghost: ghostS, level: { ...L, days: Ldays }, plan: this.plan, today: this.today, S: ev.S, live, sel: this.sel, over, carried: this.carried, dose: ev.dose, px: this.root.clientWidth - 44 })}
      <div class="note" style="margin-top:6px">${icon('database')} Storm days use real NASA DONKI events. Costs and rewards are game numbers.</div></div>`;

    this.bind(over);
    this.autoSpeak(over, coreDone, storm?.label ?? null);
    if (!over && !this.briefing && !this.busy && !this.sheet && !this.info && !this.eduKey && !this.roverOpen && this.today.length === 0) {
      const sp = surpriseFor(L.id, L.world, day, this.variant, { stormToday: !!storm, dustToday: dust, brokenToday: !!broken, days: Ldays });
      if (sp && !this.seenSurprises.has(`${this.variant}-${sp.id}`)) {
        this.seenSurprises.add(`${this.variant}-${sp.id}`);
        this.busy = true;
        this.sAbort?.abort();
        this.sAbort = new AbortController();
        stopSpeaking();
        if (sp.kind === 'control') speak(`${sp.title}. ${sp.text}`);
        runSurprise(this.root.querySelector<HTMLElement>('#scene')!, sp, (res) => {
          this.busy = false;
          if (res.rocks > 0) {
            this.hooks.addRocks(res.rocks);
            this.msg = `You collected ${res.rocks} space rock${res.rocks === 1 ? '' : 's'}. They go in your collection.`;
          }
          this.render();
        }, this.sAbort.signal);
      }
    }
  }

  /** When read aloud is on, speak what just appeared, once. */
  private autoSpeak(over: boolean, coreDone: boolean, storm: string | null): void {
    const R = roverFor(this.level.world);
    if (this.briefing) speakOnce(`brief-${this.level.id}-${this.variant}`, `Level ${this.level.id}. ${this.level.title}. ${plain(this.level.blurb)}`);
    else if (this.roverOpen || this.eduKey || this.info) return;
    else if (over && coreDone) speakOnce(`fin-${this.level.id}-${this.variant}-${this.bonus}`, `Mission complete! ${R.lines.win}`);
    else if (this.tip) speakOnce(`tip-${this.tip.key}`, this.tip.text);
    else if (storm && !this.today.length) speakOnce(`storm-${this.level.id}-${this.plan.length}`, `A solar storm is coming today. ${R.lines.storm}`);
  }

  private bind(over: boolean): void {
    const r = this.root;
    const on = (sel: string, fn: (e: Event) => void) => r.querySelectorAll<HTMLElement>(sel).forEach((el) => (el.onclick = fn));
    on('#back', () => this.exit());
    on('#snd', () => {
      this.hooks.soundOn = this.hooks.onToggleSound();
      this.render();
    });
    on('[data-info]', (e) => {
      if (this.busy) return;
      this.eduKey = (e.currentTarget as HTMLElement).dataset.info as EduKey;
      sfx.click();
      this.render();
    });
    on('[data-act="edu-close"]', () => {
      this.eduKey = null;
      this.render();
    });
    on('#mus', () => {
      this.hooks.musicOn = this.hooks.onToggleMusic();
      this.render();
    });
    on('#goals', () => {
      if (this.busy) return;
      this.briefing = true;
      sfx.click();
      this.render();
    });
    on('.st', (e) => void this.station((e.currentTarget as HTMLElement).dataset.t as StationId));
    on('.tday.done', (e) => {
      if (this.busy) return;
      this.sel = Number((e.currentTarget as HTMLElement).dataset.d);
      sfx.click();
      this.render();
    });
    on('#rw', () => {
      if (this.busy) return;
      this.ghost = this.plan.length ? this.plan.map((d) => d.slice()) : this.ghost;
      const out = rewindTo(this.level, this.plan, this.sel, this.carried);
      this.plan = out.plan;
      this.carried = out.carried;
      this.today = [];
      this.rewinds++;
      if (this.plan.length < this.level.days) this.bonus = 0;
      this.sel = this.plan.length;
      this.tip = null;
      this.msg = `Replaying from day ${this.plan.length + 1}. Power and water are restored, but +${Math.round(out.lost)} radiation stays with the crew.`;
      sfx.click();
      this.render();
    });
    on('#end', () => {
      if (this.busy || over) return;
      if (!this.today.length) {
        this.msg = 'Do at least one task first.';
        this.render();
        return;
      }
      this.endDay();
    });
    on('#vox', () => {
      this.hooks.voiceOn = this.hooks.onToggleVoice();
      if (this.hooks.voiceOn) speak('Read aloud is on.');
      this.render();
    });
    on('[data-say]', (e) => {
      const box = (e.currentTarget as HTMLElement).closest('.box');
      if (box) {
        const c = box.cloneNode(true) as HTMLElement;
        c.querySelectorAll('button,.credit,.radbox').forEach((n) => n.remove());
        speak(plain(c.innerHTML), true);
      }
    });
    on('[data-act="more"]', () => {
      if (this.bonus >= 3) return;
      this.bonus++;
      this.msg = 'One more day. Your stars are already saved, so this is just for fun.';
      sfx.click();
      this.render();
    });
    on('#rvb', () => {
      if (this.busy) return;
      this.roverOpen = true;
      sfx.click();
      this.render();
    });
    on('[data-act="rv-close"]', () => {
      this.roverOpen = false;
      this.render();
    });
    on('#win', () => {
      this.info = true;
      sfx.click();
      this.render();
    });
    on('[data-act="start"]', () => {
      this.briefing = false;
      this.started = true;
      sfx.click();
      this.render();
    });
    on('[data-act="close"]', () => {
      this.info = false;
      this.render();
    });
    on('[data-act="tip-ok"]', () => {
      this.tip = null;
      sfx.click();
      this.render();
    });
    on('[data-act="dismiss"]', () => {
      r.querySelector('.ov')?.remove();
    });
    on('[data-act="map"]', () => this.exit());
    on('[data-act="next"]', () => this.hooks.onNext?.());
    this.bindFollow();
    if (this.sheet) {
      const site = siteFor(this.level.id);
      const host = r.querySelector<HTMLElement>('.sheet-host');
      const stars = this.status().core.stars;
      if (host && this.sheet === 'postcard' && site) bindPostcard(host, { site, levelId: this.level.id, levelTitle: this.level.title, stars, name: this.hooks.getName() });
      if (host && this.sheet === 'name') {
        bindNameForm(host, (n) => {
          this.hooks.setName(n);
          this.sheet = 'cert';
          this.render();
        });
      }
      if (host && this.sheet === 'cert') host.querySelector('[data-act="cert-print"]')?.addEventListener('click', () => printCertificate(host.querySelector('.cert')!.outerHTML));
    }
    on('[data-act="sheet-postcard"]', () => {
      this.sheet = 'postcard';
      sfx.click();
      this.render();
    });
    on('[data-act="sheet-cert"]', () => {
      this.sheet = this.hooks.getName() ? 'cert' : 'name';
      sfx.click();
      this.render();
    });
    on('[data-act="sheet-name"]', () => {
      this.sheet = 'name';
      this.render();
    });
    on('[data-act="postcard-close"],[data-act="sheet-close"]', () => {
      this.sheet = null;
      this.render();
    });
    if (this.roverOpen) {
      const b = r.querySelector<HTMLElement>('.rv-host');
      if (b) bindRoverCard(b, roverFor(this.level.world).id);
    }
    on('[data-act="again"]', () => {
      this.ghost = this.plan.slice(0, this.level.days).map((d) => d.slice());
      this.bonus = 0;
      this.variant++;
      this.level = rerollStorms(this.baseLevel, this.variant);
      this.briefing = true;
      this.plan = [];
      this.today = [];
      this.carried = 0;
      this.rewinds = 0;
      this.sel = 0;
      this.msg = '';
      this.reported = false;
      this.alarmDay = 0;
      this.tip = null;
      this.seenTips.clear();
      this.render();
    });
  }

  /** The astronaut walks after the mouse or finger, and the scenery shifts a little for depth. */
  private bindFollow(): void {
    const scene = this.root.querySelector<HTMLElement>('#scene');
    const floor = this.root.querySelector<HTMLElement>('#floor');
    const ch = this.root.querySelector<HTMLElement>('#char');
    if (!scene || !floor || !ch) return;
    scene.style.setProperty('--par', String((this.charFrac - 0.5) * 2));
    let stepTimer = 0;
    const move = (e: PointerEvent): void => {
      if (this.busy || this.briefing || this.info || this.eduKey) return;
      if ((e.target as HTMLElement).closest('.ov,.gm')) return;
      const r = floor.getBoundingClientRect();
      const frac = Math.max(0.06, Math.min(0.94, (e.clientX - r.left) / r.width));
      if (Math.abs(frac - this.charFrac) > 0.003) this.dir = frac < this.charFrac ? -1 : 1;
      this.charFrac = frac;
      ch.classList.remove('idle');
      ch.classList.add('follow', 'step');
      ch.style.left = `${frac * 100}%`;
      ch.style.setProperty('--dir', String(this.dir));
      const rv = this.root.querySelector<HTMLElement>('#rover');
      if (rv) {
        rv.style.left = `${this.roverPos() * 100}%`;
        rv.style.setProperty('--dir', String(this.dir));
        rv.classList.add('moving');
        window.clearTimeout(this.rvTimer);
        this.rvTimer = window.setTimeout(() => rv.classList.remove('moving'), 1100);
      }
      scene.style.setProperty('--par', String((frac - 0.5) * 2));
      window.clearTimeout(stepTimer);
      stepTimer = window.setTimeout(() => {
        ch.classList.remove('step');
        ch.classList.add('idle');
      }, 220);
    };
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerdown', move);
  }

  private exit(): void {
    this.destroy();
    this.hooks.onExit();
  }

  private endDay(): void {
    this.plan.push(this.today.slice());
    this.today = [];
    this.sel = this.plan.length;
    this.msg = '';
    this.tip = null;
    sfx.click();
    this.render();
  }

  /** The rover trails a little behind the astronaut. */
  private roverPos(): number {
    return Math.max(0.07, Math.min(0.93, this.charFrac - 0.13 * this.dir));
  }

  private roverSays(live: { p: number; w: number; e: number; dust: boolean; broken: StationId | null }, storm: boolean, dust: boolean, broken: StationId | null, daysDone: number): string {
    const R = roverFor(this.level.world);
    let line = '';
    if (broken) line = R.lines.broken;
    else if (storm) line = R.lines.storm;
    else if (dust) line = R.lines.dust;
    else if (live.p < 25) line = R.lines.lowPower;
    else if (live.w < 18) line = R.lines.lowWater;
    else if (live.e < 30) line = R.lines.tired;
    else if (daysDone === 0 && this.today.length === 0) line = R.lines.welcome;
    return line ? `<b>${R.nickname}:</b> ${line}` : 'Tap a station. Each one opens a mini game. Better play, bigger reward.';
  }

  private sheetHtml(stars: number): string {
    const L = this.level;
    const site = siteFor(L.id);
    const name = this.hooks.getName();
    if (this.sheet === 'postcard' && site) return `<div class="ov"><div class="box sheet-host">${postcardHtml({ site, levelId: L.id, levelTitle: L.title, stars, name })}</div></div>`;
    if (this.sheet === 'name') return `<div class="ov"><div class="box sheet-host">${nameFormHtml(name)}</div></div>`;
    const cert = certificateHtml({ name, kind: 'level', levelId: L.id, levelTitle: L.title, stars, totalStars: this.hooks.getTotalStars(), maxStars: 36, date: new Date() });
    return `<div class="ov"><div class="box sheet-host">${cert}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="cert-print">${icon('check')} Print</button><button class="btn" data-act="sheet-name">Change name</button><button class="btn" data-act="sheet-close">Close</button></div></div></div>`;
  }

  private roverOverlay(): string {
    return `<div class="ov"><div class="box"><div class="rv-host">${roverCardHtml(roverFor(this.level.world).id)}</div><button class="btn primary" data-act="rv-close" style="margin-top:10px">Close</button></div></div>`;
  }

  private eduFor(k: StationId, day: number): EduKey {
    return k === 'exp' ? expForDay(this.level, day) : (k as EduKey);
  }

  private eduHtml(key: EduKey): string {
    const e = EDU[key];
    return `<div class="ov"><div class="box">${heroHtml(key as HeroKind, { size: 'sm' })}<h2>${e.title}</h2><p>${e.kid}</p><div class="factcard">${icon('bulb')}<div><b>In real life.</b> ${e.real}</div></div><div class="factcard game">${icon('infoCircle')}<div><b>In the game.</b> ${e.game}</div></div>${e.research ? `<div class="factcard research">${icon('database')}<div><b>Real NASA research (OSDR).</b><ul>${e.research.map((r) => `<li><a href="${r.url}" target="_blank" rel="noopener">${r.id}</a>: ${r.title}</li>`).join('')}</ul></div></div>` : ''}<button class="btn say" data-say aria-label="Read this aloud">${icon('speakerphone')}</button> <button class="btn primary" data-act="edu-close" style="margin-top:10px">Got it</button></div></div>`;
  }

  private learnHtml(): string {
    const L = this.level;
    const skills = L.skills.map((id) => `<span class="skill-pill">${icon(SKILL_ICON[id])} ${skillById(id).name}</span>`).join('');
    return `<div class="skills-row">${skills}</div><ul class="learn">${L.learn.map((t) => `<li>${t}</li>`).join('')}</ul>`;
  }

  private briefingHtml(): string {
    const L = this.level;
    const R = roverFor(L.world);
    const site = siteFor(L.id);
    const hero = heroHtml(L.world, { photo: site ? photoUrl(site.photo.file) : undefined, label: site ? site.name : L.theme.setting });
    const tl: { day: number; html: string }[] = [];
    const tiles = { push: (h: string) => tl.push({ day: Number(/Day (\d+)/.exec(h)?.[1] ?? 0), html: h }) };
    L.stormDays.forEach((s) => tiles.push(`<div class="bf-tile storm" title="Real solar storm: ${s.label}">${icon('bolt')}<b>Day ${s.day}</b><small>Solar storm</small></div>`));
    L.events.forEach((e) => tiles.push(`<div class="bf-tile ${e.type}">${icon(e.type === 'dust' ? 'sun' : 'tool')}<b>Day ${e.day}</b><small>${e.type === 'dust' ? 'Dust storm' : 'Something breaks'}</small></div>`));
    tl.sort((x, y) => x.day - y.day);
    const watch = tl.length ? `<div class="bf-watch"><div class="bf-cap">Watch out</div><div class="bf-tiles">${tl.map((t) => t.html).join('')}</div></div>` : '';
    const steps = L.id === 1
      ? `<div class="bf-steps"><span>${icon('flask')}<b>1</b> Tap a station</span><span>${icon('bolt')}<b>2</b> Play the game</span><span>${icon('moon')}<b>3</b> End the day</span></div>`
      : '';
    const rover = !this.started && (L.id === 1 || L.id === 6)
      ? `<div class="bf-rover"><div class="bf-rv moving">${roverSvg(R.id)}</div><div class="bf-bubble"><b>${R.nickname}</b> ${R.lines.welcome}</div></div>`
      : '';
    const details = `<details class="bf-more"><summary>More about this mission</summary><div class="note" style="margin:6px 0 4px">Skills you build:</div>${this.learnHtml()}${site ? `<div class="note" style="margin-top:6px">${site.place}</div>` : ''}${L.id === 1 ? '<div class="note" style="margin-top:6px">The better you play, the bigger the reward. You can replay from any day, but radiation never goes back.</div>' : ''}${L.stormDays.length ? `<ul class="bf-list">${L.stormDays.map((s) => `<li>${icon('bolt')} Day ${s.day}: real storm, ${s.label}</li>`).join('')}</ul>` : ''}</details>`;
    return `<div class="ov"><div class="box brief">${hero}<h2>Level ${L.id}: ${L.title}</h2><div class="bf-blurb">${L.blurb}</div><div class="bf-chips"><span class="bf-chip">${icon('calendar')} ${L.days} days</span><span class="bf-chip">${icon('rocket')} ${L.actions} tasks a day</span><span class="bf-chip">${icon('flask')} Goal ${L.goal}</span><span class="bf-chip">${icon('shield')} 3 stars: radiation under ${L.lowDose}</span></div>${watch}${steps}${rover}${details}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn say" data-say aria-label="Read this aloud">${icon('speakerphone')}</button><button class="btn primary big-btn" data-act="start">${this.started ? 'Continue' : 'Start mission'}</button></div></div></div>`;
  }

  private finishHtml(stars: number, sci: number, dose: number, full: { S: { s: number }; dose: number; failed: boolean }): string {
    const L = this.level;
    const all = this.hooks.getStars();
    const stormLabel = L.stormDays[0]?.label ?? 'a real solar storm';
    const fact = L.fact.replace('{storm}', stormLabel);
    const canMore = !full.failed && this.bonus < 3;
    const bonusNote = this.bonus > 0 ? `<div class="note" style="margin:4px 0">${icon('calendarPlus')} Bonus days: science +${Math.round(full.S.s - sci)}, radiation +${Math.round(full.dose - dose)}.${full.failed ? ' The last bonus day was too much for the crew, but your stars are saved.' : ''}</div>` : '';
    const gs = this.ghostState();
    const versus = gs ? `<div class="note" style="margin:4px 0">${icon('ghost')} Last try: science ${Math.round(gs.s)}, radiation ${Math.round(gs.g.reduce((a, b) => a + b, 0))}. This try: science ${Math.round(sci)}, radiation ${Math.round(dose)}.</div>` : '';
    const skills = L.skills
      .map((id) => {
        const lv = LEVELS.filter((l) => l.skills.includes(id));
        const earned = lv.reduce((a, l) => a + (all[l.id] ?? 0), 0);
        return `<li>${icon(SKILL_ICON[id])} <b>${skillById(id).name}</b>: ${tierName(earned, lv.length * 3)}</li>`;
      })
      .join('');
    return `<div class="ov"><div class="box">${heroHtml('win', { size: 'sm' })}<h2>Mission complete</h2>${starRow(stars)}<div class="note" style="margin:6px 0">Science ${Math.round(sci)} / ${L.goal} · Radiation ${Math.round(dose)} · Rewinds ${this.rewinds}</div><div class="note" style="margin-bottom:6px"><b>${roverFor(L.world).nickname}:</b> ${roverFor(L.world).lines.win}</div><div class="note">Skills you practiced</div><ul class="learn nobullet">${skills}</ul><div class="factcard">${icon('bulb')}<div>${fact}</div></div>${bonusNote}${versus}<div class="row" style="justify-content:center;margin-top:8px">${siteFor(L.id) ? `<button class="btn" data-act="sheet-postcard">${icon('photo')} Postcard</button>` : ''}<button class="btn" data-act="sheet-cert">${icon('trophy')} Certificate</button>${canMore ? `<button class="btn" data-act="more">${icon('calendarPlus')} One more day</button>` : ''}<button class="btn" data-act="again">Play again</button>${this.hooks.onNext ? '<button class="btn primary" data-act="next">Next level</button>' : ''}<button class="btn" data-act="map">Back to the map</button></div></div></div>`;
  }

  private photoHtml(site: Site): string {
    const url = photoUrl(site.photo.file);
    const wide = site.photo.w / site.photo.h > 2.2;
    const body = wide
      ? `<div class="pano" role="img" aria-label="${site.photo.caption}" style="background-image:url(${url});aspect-ratio:${Math.min(site.photo.w / site.photo.h, 3.2)}"></div>`
      : `<img class="sitepic" src="${url}" alt="${site.photo.caption}" loading="lazy" />`;
    return `<figure class="sitefig">${body}<figcaption>${site.photo.caption}</figcaption></figure>`;
  }

  private siteFacts(site: Site): string {
    return `<ul class="sitefacts"><li><b>Where:</b> ${site.place}</li><li><b>When:</b> ${site.when}</li><li><b>${site.coords.note}:</b> ${site.coords.text}</li></ul><div class="credit">Credit: ${site.photo.credit}. NASA image <a href="${site.photo.page}" target="_blank" rel="noopener">${site.photo.nasaId}</a>. Coordinates: ${site.coords.source}.</div>`;
  }

  private infoHtml(label: string | null): string {
    const site = siteFor(this.level.id);
    const body = radiation.sources.map((s) => `<li>${s.label}: about ${Math.round(s.mean * 10) / 10} µGy per hour on average (${s.instrument})</li>`).join('');
    const view = this.level.world === 'moon'
      ? 'Earth hangs in the sky. Without an atmosphere, the Moon gets the full force of solar storms.'
      : 'Mars has a thin atmosphere and no global magnetic field, so radiation still reaches the surface.';
    return `<div class="ov"><div class="box site"><h2>Look outside${site ? `: ${site.name}` : ''}</h2>${site ? `${this.photoHtml(site)}${this.siteFacts(site)}` : ''}<p class="note">${view}</p>${label ? `<p>Today's real storm: ${label}</p>` : ''}<details class="radbox"><summary>Real radiation measured in May 2024 (NASA RadLab)</summary><ul>${body}</ul><div class="note">${radiation.note}</div></details><button class="btn say" data-say aria-label="Read this aloud">${icon('speakerphone')}</button> <button class="btn primary" data-act="close" style="margin-top:8px">Close</button></div></div>`;
  }

  private async station(k: StationId): Promise<void> {
    const L = this.level;
    if (this.busy || this.briefing || this.info || this.eduKey) return;
    if (this.status().over) return;
    if (this.today.length >= L.actions) {
      this.msg = 'The day is full. Press End day.';
      this.render();
      return;
    }
    const day = this.plan.length + 1;
    const live = liveState(L, this.plan, this.today);
    const why = canDo(L, live, k, day);
    if (why) {
      this.msg = why;
      sfx.bad();
      this.render();
      return;
    }
    this.busy = true;
    const scene = this.root.querySelector<HTMLElement>('#scene')!;
    const floor = this.root.querySelector<HTMLElement>('#floor')!;
    const ch = this.root.querySelector<HTMLElement>('#char')!;
    const btn = this.root.querySelector<HTMLElement>(`.st[data-t="${k}"]`)!;
    const sr = floor.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    ch.classList.remove('idle', 'follow');
    this.charFrac = (br.left + br.width / 2 - sr.left) / sr.width;
    this.dir = this.charFrac * 100 < parseFloat(ch.style.left || '50') ? -1 : 1;
    ch.style.setProperty('--dir', String(this.dir));
    ch.style.left = `${br.left + br.width / 2 - sr.left}px`;
    sfx.step();
    await sleep(760);

    const game = gameFor(L, k, day);
    const ac = new AbortController();
    this.abort = ac;
    const storm = stormFor(L, day)?.intensity ?? 0;
    const gm = document.createElement('div');
    gm.className = 'gm';
    gm.innerHTML = `<div class="gt">${game.title}</div><div class="gh">${game.help}</div><div class="ga"></div>`;
    scene.appendChild(gm);
    const area = gm.querySelector<HTMLElement>('.ga')!;
    const d = this.dayDifficulty(day);
    const eduKey = this.eduFor(k, day);
    const factHtml = this.seenFacts.has(eduKey) ? '' : `<div class="factcard small">${icon('bulb')}<div>${EDU[eduKey].real}</div></div>`;
    this.seenFacts.add(eduKey);
    game.start(area, d, (score) => {
      const stars = starsFromScore(score, d);
      const m = STAR_YIELD[stars];
      stars === 3 ? sfx.perfect() : stars === 2 ? sfx.good() : sfx.bad();
      const gameId = k === 'exp' ? expForDay(L, day) : k;
      area.innerHTML = `${rewardHtml(gameId, stars, { photo: siteFor(L.id) ? photoUrl(siteFor(L.id)!.photo.file) : '', world: L.world })}${starRow(stars)}<div style="margin:6px 0;font-size:16px;font-weight:600">${this.yieldLabel(k, m, day)}</div><div class="note" style="margin-bottom:10px">${['', 'Rough run', 'Good run', 'Perfect run'][stars]}</div>${factHtml}<button class="btn primary" id="collect">Collect</button>`;
      area.querySelector<HTMLButtonElement>('#collect')!.onclick = async () => {
        const label = this.yieldLabel(k, m, day);
        gm.remove();
        ch.classList.add('work');
        const pop = document.createElement('div');
        pop.className = 'pop';
        pop.textContent = label;
        const sc = scene.getBoundingClientRect();
        pop.style.left = `${br.left + br.width / 2 - sc.left}px`;
        pop.style.top = `${br.top - sc.top + 6}px`;
        scene.appendChild(pop);
        await sleep(900);
        this.today.push({ k, m });
        this.busy = false;
        this.abort = null;
        if (this.today.length >= L.actions) {
          this.msg = 'The day is full, so it ends now.';
          this.endDay();
        } else {
          this.msg = '';
          this.render();
        }
      };
    }, { signal: ac.signal, storm, world: L.world, photo: siteFor(L.id) ? photoUrl(siteFor(L.id)!.photo.file) : '' });
  }
}
