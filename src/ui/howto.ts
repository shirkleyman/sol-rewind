import { icon } from './icons';
import type { IconName } from './icons';
import { sfx } from './sound';
import './howto.css';

interface Slide {
  title: string;
  lines: string[];
  art: () => string;
  /** Starts a small looping animation inside the picture. Returns a stop function. */
  run?: (art: HTMLElement) => () => void;
  tone: string;
}

const dot = (ic: IconName, color: string, delay: number): string =>
  `<span class="ht-st" style="--c:${color};--d:${delay}s">${icon(ic)}</span>`;

const day = (n: number, ok: boolean, delay: number): string =>
  `<span class="ht-day ${ok ? 'ok' : 'bad'}" style="--d:${delay}s">${icon(ok ? 'moodSmile' : 'moodSad')}<b>Day ${n}</b></span>`;

const bar = (id: string, label: string, ic: IconName, color: string): string =>
  `<div class="ht-bar" id="${id}"><span class="ht-bl">${icon(ic)} ${label}</span><span class="ht-track"><i style="background:${color}"></i></span></div>`;

const SLIDES: Slide[] = [
  {
    title: 'Run your Moon and Mars base',
    lines: ['Each day, pick tasks at the stations.', 'Play a small game to do each task.'],
    tone: '#dbe8ff',
    art: () => `<div class="ht-row">${dot('droplet', '#3b9be8', 0)}${dot('batteryCharging', '#e8a317', 0.25)}${dot('flask', '#8b5cf6', 0.5)}</div><div class="ht-cap">Water, power and science</div>`,
  },
  {
    title: 'Every day counts',
    lines: ['Your days appear in a strip.', 'A smile means a good day.'],
    tone: '#d9f4e4',
    art: () => `<div class="ht-row">${day(1, true, 0)}${day(2, true, 0.35)}${day(3, false, 0.7)}</div><div class="ht-cap">Day 3 went badly</div>`,
  },
  {
    title: 'Rewind!',
    lines: ['A rough day? Go back and try it again.', 'Power, water and science come back.'],
    tone: '#fff0c9',
    art: () => `<div class="ht-demo" id="ht-d3">${bar('b-p', 'Power', 'bolt', '#e8a317')}${bar('b-w', 'Water', 'droplet', '#3b9be8')}<div class="ht-rew" id="ht-rew">${icon('history')}</div></div><div class="ht-cap" id="ht-c3">&nbsp;</div>`,
    run: (art) => demo(art, false),
  },
  {
    title: 'But radiation never goes back',
    lines: ['Radiation stays with the crew, just like in real space.', 'Every try adds a little more.'],
    tone: '#f1e4ff',
    art: () => `<div class="ht-demo" id="ht-d4">${bar('b-p', 'Power', 'bolt', '#e8a317')}${bar('b-w', 'Water', 'droplet', '#3b9be8')}${bar('b-r', 'Radiation', 'shield', '#d9475f')}<div class="ht-lock" id="ht-lock">${icon('lock')}</div></div><div class="ht-cap" id="ht-c4">&nbsp;</div>`,
    run: (art) => demo(art, true),
  },
  {
    title: 'Plan smart for 3 stars',
    lines: ['Shield the crew before a solar storm.', 'Keep radiation low. Your last try shows up as a ghost to compare.'],
    tone: '#ffe0e6',
    art: () => `<div class="ht-row">${dot('shield', '#d9475f', 0)}${dot('ghost', '#7a86b0', 0.25)}<span class="ht-stars" style="--d:.5s">${icon('star')}${icon('star')}${icon('star')}</span></div><div class="ht-cap">Good plans win</div>`,
  },
];

/** A tiny story with real timing: a bad day, a rewind, then radiation that stays. */
function demo(art: HTMLElement, withRadiation: boolean): () => void {
  const set = (id: string, v: number): void => {
    const i = art.querySelector<HTMLElement>(`#${id} .ht-track i`);
    if (i) i.style.width = `${v}%`;
  };
  const cap = art.querySelector<HTMLElement>(withRadiation ? '#ht-c4' : '#ht-c3');
  const rew = art.querySelector<HTMLElement>('#ht-rew');
  const lock = art.querySelector<HTMLElement>('#ht-lock');
  const say = (t: string): void => {
    if (cap) cap.textContent = t;
  };
  let rad = 18;
  const steps: (() => void)[] = [
    () => {
      set('b-p', 82);
      set('b-w', 82);
      set('b-r', rad);
      say('A good start');
      rew?.classList.remove('on');
      lock?.classList.remove('on');
    },
    () => {
      set('b-p', 22);
      set('b-w', 30);
      rad = Math.min(92, rad + 26);
      set('b-r', rad);
      say('A rough day: a storm hits');
    },
    () => {
      rew?.classList.add('on');
      set('b-p', 82);
      set('b-w', 82);
      say(withRadiation ? 'Rewind: power and water come back' : 'Rewind: power and water come back!');
    },
    () => {
      rew?.classList.remove('on');
      lock?.classList.add('on');
      say(withRadiation ? 'Radiation does not come back' : 'Now try the day again, better');
    },
    () => {
      lock?.classList.remove('on');
      rad = Math.min(92, rad + 6);
      set('b-r', rad);
      say(withRadiation ? 'Even a better try adds a bit' : 'Better!');
    },
  ];
  let i = 0;
  const tick = (): void => {
    steps[i % steps.length]();
    i++;
    if (i % steps.length === 0 && rad >= 70) {
      rad = 18;
    }
  };
  tick();
  const t = window.setInterval(tick, 2100);
  return () => window.clearInterval(t);
}

/**
 * The "How Sol Rewind works" screen: a few picture slides that explain the idea of the game.
 * You can rewind a rough day and play it again, but radiation never goes back.
 */
export function showHowTo(root: HTMLElement, hooks: { onDone: () => void }): void {
  let idx = 0;
  let stop: (() => void) | null = null;
  let touchX = 0;

  const draw = (): void => {
    stop?.();
    stop = null;
    const s = SLIDES[idx];
    const last = idx === SLIDES.length - 1;
    root.innerHTML = `<div class="frame howto" role="region" aria-label="How Sol Rewind works">
      <div class="ht-top"><span class="ht-step">${idx + 1} of ${SLIDES.length}</span><button class="btn small" id="ht-skip">${last ? 'Close' : 'Skip'}</button></div>
      <div class="ht-card"><div class="ht-art" style="--tone:${s.tone}">${s.art()}</div>
        <h1 class="ht-title">${s.title}</h1>
        <div class="ht-lines" aria-live="polite">${s.lines.map((l) => `<p>${l}</p>`).join('')}</div>
      </div>
      <div class="ht-dots" role="tablist" aria-label="Slides">${SLIDES.map((_, i) => `<button class="ht-dot ${i === idx ? 'on' : ''}" role="tab" aria-selected="${i === idx}" aria-label="Slide ${i + 1}" data-i="${i}"></button>`).join('')}</div>
      <div class="ht-nav"><button class="btn" id="ht-back" ${idx === 0 ? 'disabled' : ''}>Back</button><button class="btn primary big-btn" id="ht-next">${last ? "Let's play!" : 'Next'}</button></div>
    </div>`;
    const art = root.querySelector<HTMLElement>('.ht-art')!;
    if (s.run) stop = s.run(art);
    const go = (n: number): void => {
      if (n < 0) return;
      if (n >= SLIDES.length) {
        finish();
        return;
      }
      idx = n;
      sfx.click();
      draw();
    };
    root.querySelector<HTMLElement>('#ht-next')!.onclick = () => go(idx + 1);
    root.querySelector<HTMLElement>('#ht-back')!.onclick = () => go(idx - 1);
    root.querySelector<HTMLElement>('#ht-skip')!.onclick = () => finish();
    root.querySelectorAll<HTMLElement>('.ht-dot').forEach((d) => (d.onclick = () => go(Number(d.dataset.i))));
    const card = root.querySelector<HTMLElement>('.howto')!;
    card.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
    card.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) go(idx + (dx < 0 ? 1 : -1));
    });
    root.querySelector<HTMLElement>('#ht-next')!.focus({ preventScroll: true });
  };

  const onKey = (e: KeyboardEvent): void => {
    if (!root.querySelector('.howto')) {
      document.removeEventListener('keydown', onKey);
      return;
    }
    if (e.key === 'ArrowRight') root.querySelector<HTMLElement>('#ht-next')?.click();
    if (e.key === 'ArrowLeft') root.querySelector<HTMLElement>('#ht-back')?.click();
  };
  const finish = (): void => {
    stop?.();
    document.removeEventListener('keydown', onKey);
    hooks.onDone();
  };
  document.addEventListener('keydown', onKey);
  draw();
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.scrollTo(0, 0));
}
