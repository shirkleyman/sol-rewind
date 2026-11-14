import './prep.css';
import { CAPACITY, ITEMS, kitEffects, kitMass, kitStars } from '../core/kit';
import type { Kit } from '../core/kit';
import { starRow } from './art';
import { icon } from './icons';
import type { IconName } from './icons';
import { sfx } from './sound';

export interface PrepOptions {
  kit: Kit;
  onLaunch: (kit: Kit, stars: number) => void;
  onBack: () => void;
  onSkip: () => void;
}

const ITEM_STYLE: Record<keyof Kit, { ic: IconName; color: string }> = {
  battery: { ic: 'batteryCharging', color: '#d8920a' },
  water: { ic: 'droplet', color: '#1f8fe0' },
  shield: { ic: 'shield', color: '#d9475f' },
  science: { ic: 'flask', color: '#7c5cff' },
};

/** Earth prep level: pack a cargo kit inside a mass budget. The kit gives a small head start in every mission. */
export function showPrep(root: HTMLElement, opts: PrepOptions): void {
  const kit: Kit = { ...opts.kit };
  let msg = '';
  let focus = '';

  const render = (): void => {
    const mass = kitMass(kit);
    const over = mass > CAPACITY;
    const fx = kitEffects(kit);
    const stars = kitStars(kit);
    const pct = Math.min(100, (mass / CAPACITY) * 100);

    const items = ITEMS.map((it) => {
      const st = ITEM_STYLE[it.id];
      const n = kit[it.id];
      return `<div class="item"><div class="pic" style="background:${st.color}">${icon(st.ic)}</div><div><div class="nm">${it.name}</div><div class="meta">${it.effect}</div><div class="why">${it.why}</div><div class="meta">Mass: ${it.mass} each (max ${it.max})</div></div><div class="counter"><button class="btn" data-act="minus" data-id="${it.id}" aria-label="Take one ${it.name} out">&minus;</button><span class="num" aria-live="polite" aria-label="${it.name} count">${n}</span><button class="btn" data-act="plus" data-id="${it.id}" aria-label="Pack one more ${it.name}">+</button></div></div>`;
    }).join('');

    const get = (ic: IconName, label: string, value: string, zero: boolean) => `<li class="${zero ? 'zero' : ''}">${icon(ic)} ${label}: <b>${value}</b></li>`;
    const gets =
      get('bolt', 'Start power', `+${fx.p}`, fx.p === 0) +
      get('droplet', 'Start water', `+${fx.w}`, fx.w === 0) +
      get('shield', 'Radiation cut', `${Math.round(fx.doseCut * 100)}%`, fx.doseCut === 0) +
      get('flask', 'Start science', `+${fx.s}`, fx.s === 0);

    root.innerHTML = `<div class="frame prep">
      <div class="topline"><button class="btn small" data-act="back" aria-label="Back to the map">${icon('arrowLeft')} Back to the map</button></div>
      <h1>Earth: Mission prep</h1>
      <div class="where">${icon('rocket')} Launch site: Israel (Mediterranean coast)</div>
      <p class="intro">Every kilogram you launch costs fuel, so the rocket can only carry so much. Pick what to pack. Your cargo gives you a head start in every mission. The numbers are game numbers.</p>
      <div class="items">${items}</div>
      <div class="massbox">
        <div class="massrow ${over ? 'over' : ''}"><span>Cargo mass</span><span><b>${mass}</b> / ${CAPACITY}</span></div>
        <div class="massbar ${over ? 'over' : ''}" role="img" aria-label="Cargo mass ${mass} of ${CAPACITY}"><div style="width:${pct}%"></div></div>
        ${over ? '<div class="hint" style="color:#b4483a">Too heavy! Take something out.</div>' : ''}
        <div class="note" style="margin-top:6px"><b>What you get</b></div>
        <ul class="gets">${gets}</ul>
        <div class="starsrow">${starRow(stars, 100)}<span class="hint">Pack all 4 kinds of items and fill at least 85% of the space for 3 stars.</span></div>
      </div>
      <div class="msg" role="status" aria-live="polite">${msg}</div>
      <div class="actions"><button class="btn" data-act="skip">Skip prep</button><span class="spacer"></span><button class="btn primary" data-act="launch">${icon('rocket')} Launch!</button></div>
    </div>`;

    const frame = root.querySelector<HTMLElement>('.prep')!;
    frame.querySelectorAll<HTMLButtonElement>('button[data-act]').forEach((b) => {
      b.onclick = () => {
        const act = b.dataset.act;
        const id = b.dataset.id as keyof Kit | undefined;
        if ((act === 'plus' || act === 'minus') && id) {
          const it = ITEMS.find((x) => x.id === id)!;
          if (act === 'plus') {
            if (kit[id] >= it.max) msg = `You can only take ${it.max} ${it.name.toLowerCase()}s.`;
            else {
              kit[id]++;
              msg = '';
            }
          } else if (kit[id] > 0) {
            kit[id]--;
            msg = '';
          }
          sfx.tap();
          focus = `${act}-${id}`;
          render();
        } else if (act === 'back') {
          sfx.click();
          opts.onBack();
        } else if (act === 'skip') {
          sfx.click();
          opts.onSkip();
        } else if (act === 'launch') {
          const m = kitMass(kit);
          if (m === 0) {
            msg = 'The cargo bay is empty. Pack something first!';
            sfx.bad();
            focus = 'launch';
            render();
          } else if (m > CAPACITY) {
            msg = 'The rocket is too heavy to lift off. Take something out.';
            sfx.bad();
            focus = 'launch';
            render();
          } else {
            sfx.click();
            opts.onLaunch({ ...kit }, kitStars(kit));
          }
        }
      };
    });
    if (focus) {
      const [act, id] = focus.split('-');
      const sel = id ? `button[data-act="${act}"][data-id="${id}"]` : `button[data-act="${act}"]`;
      frame.querySelector<HTMLButtonElement>(sel)?.focus({ preventScroll: true });
      focus = '';
    }
  };

  render();
}
