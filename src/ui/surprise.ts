import type { Surprise } from '../core/surprises';
import { heroHtml } from './hero';
import { icon } from './icons';
import { sfx } from './sound';
import './surprise.css';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const reducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const sourceHtml = (s: Surprise): string =>
  s.source ? `<div class="sp-src">Source: <a href="${esc(s.source.url)}" target="_blank" rel="noopener noreferrer">${esc(s.source.label)}</a></div>` : '';

function shell(s: Surprise, body: string, art: string): string {
  return `<div class="sp-ov" role="dialog" aria-modal="true" aria-label="${esc(s.title)}"><div class="sp-card sp-${s.kind}">${art}<h2 class="sp-title">${esc(s.title)}</h2>${body}</div></div>`;
}

/**
 * Plays one surprise event on top of `host` and calls done({rocks}) once when the player finishes or skips.
 * Surprises never change the game rules. `rocks` is only a collection counter. Aborting the signal removes the card without calling done.
 * `host` should be the scene or the level frame. It becomes position:relative if it is static.
 */
export function runSurprise(host: HTMLElement, s: Surprise, done: (res: { rocks: number }) => void, signal: AbortSignal): void {
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const wrap = document.createElement('div');
  host.appendChild(wrap);
  let finished = false;
  const timers: number[] = [];
  const cleanup = (): void => {
    timers.forEach((t) => window.clearTimeout(t));
    wrap.remove();
  };
  const finish = (rocks: number): void => {
    if (finished) return;
    finished = true;
    cleanup();
    done({ rocks });
  };
  signal.addEventListener(
    'abort',
    () => {
      finished = true;
      cleanup();
    },
    { once: true },
  );
  if (signal.aborted) {
    finished = true;
    cleanup();
    return;
  }
  const later = (fn: () => void, ms: number): void => {
    timers.push(window.setTimeout(() => !finished && fn(), ms));
  };

  if (s.kind === 'control') {
    wrap.innerHTML = shell(
      s,
      `<p class="sp-text">${esc(s.text)}</p><p class="sp-delay">${esc(s.delayText)}</p><div class="sp-fact">${icon('bulb')}<span>${esc(s.fact)}</span></div>${sourceHtml(s)}<button class="btn primary sp-btn" id="sp-ok">Got it</button>`,
      heroHtml('radio'),
    );
    sfx.good();
    const ok = wrap.querySelector<HTMLButtonElement>('#sp-ok');
    ok?.addEventListener('click', () => {
      sfx.click();
      finish(0);
    });
    ok?.focus({ preventScroll: true });
    return;
  }

  if (s.kind === 'dustpass') {
    wrap.innerHTML = shell(
      s,
      `<p class="sp-text">${esc(s.text)}</p><div class="sp-fact">${icon('bulb')}<span>${esc(s.fact)}</span></div>${sourceHtml(s)}<button class="btn primary sp-btn" id="sp-ok">Got it</button>`,
      heroHtml('dust'),
    );
    sfx.click();
    const ok = wrap.querySelector<HTMLButtonElement>('#sp-ok');
    ok?.addEventListener('click', () => {
      sfx.click();
      finish(0);
    });
    ok?.focus({ preventScroll: true });
    return;
  }

  // Meteor shower: tap the falling rocks. No penalty, a few seconds long, always skippable.
  const total = Math.max(3, s.rocks);
  const still = reducedMotion();
  wrap.innerHTML = shell(
    s,
    `<p class="sp-text">${esc(s.text)}</p><div class="sp-arena${still ? ' still' : ''}" id="sp-arena" role="group" aria-label="Rocks to tap"></div><div class="sp-count" id="sp-count" aria-live="polite">Rocks 0 / ${total}</div><div class="sp-fact">${icon('bulb')}<span>${esc(s.fact)}</span></div><div class="sp-row"><button class="btn sp-btn" id="sp-skip">Skip</button></div>`,
    heroHtml('meteor', { size: 'sm' }),
  );
  const arena = wrap.querySelector<HTMLElement>('#sp-arena');
  const count = wrap.querySelector<HTMLElement>('#sp-count');
  const skip = wrap.querySelector<HTMLButtonElement>('#sp-skip');
  if (!arena || !count || !skip) return;
  let caught = 0;
  let gone = 0;
  let over = false;

  const end = (): void => {
    if (over) return;
    over = true;
    arena.querySelectorAll('.sp-rock').forEach((r) => r.remove());
    count.textContent = caught > 0 ? `You collected ${caught} rock${caught === 1 ? '' : 's'}!` : 'No rocks this time. That is fine!';
    skip.textContent = 'Done';
    skip.classList.add('primary');
    if (caught >= Math.ceil(total / 2)) sfx.perfect();
    else if (caught > 0) sfx.good();
    skip.focus({ preventScroll: true });
  };
  // Skip keeps what you already caught. After the shower it turns into Done.
  skip.addEventListener('click', () => {
    sfx.click();
    finish(caught);
  });

  const resolveRock = (): void => {
    gone++;
    if (gone >= total) later(end, 250);
  };

  const makeRock = (i: number): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sp-rock';
    b.setAttribute('aria-label', 'Rock. Tap to collect.');
    b.innerHTML = '<i></i>';
    const slot = still ? (i + 0.5) / total : 0.08 + ((i * 0.37 + 0.13) % 0.84);
    b.style.left = `${Math.round(slot * 100)}%`;
    b.style.setProperty('--sz', `${52 + (i % 3) * 6}px`);
    let taken = false;
    const take = (): void => {
      if (taken || over) return;
      taken = true;
      caught++;
      sfx.tap();
      b.classList.add('got');
      count.textContent = `Rocks ${caught} / ${total}`;
      window.setTimeout(() => b.remove(), 220);
      resolveRock();
    };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      take();
    });
    b.addEventListener('click', take);
    b.addEventListener('animationend', () => {
      if (taken || over) return;
      taken = true;
      b.remove();
      resolveRock();
    });
    return b;
  };

  if (still) {
    for (let i = 0; i < total; i++) arena.appendChild(makeRock(i));
    later(end, 20000);
  } else {
    const gap = 520;
    for (let i = 0; i < total; i++) {
      later(() => {
        const r = makeRock(i);
        r.style.animationDuration = '2.1s';
        arena.appendChild(r);
      }, 250 + i * gap);
    }
    later(end, 250 + total * gap + 3200);
  }
  sfx.alarm();
}
