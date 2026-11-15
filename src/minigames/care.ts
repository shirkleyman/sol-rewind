import { sfx } from '../ui/sound';
import { P } from './params';
import { avg, later, once, q } from './types';
import type { MiniGame } from './types';

export const rest: MiniGame = {
  id: 'rest',
  title: 'Steady breathing',
  help: 'Tap each time the circle pulses. Find the rhythm.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const { interval, beats } = P.rest(d);
    const lead = 1200;
    const t0 = performance.now() + lead;
    const used = new Set<number>();
    const scores: number[] = [];
    el.innerHTML = `<div class="beatwrap"><div class="beat" id="bt"></div></div><button class="btn big-btn" id="tap">Tap on the beat</button><div class="note" id="tx" aria-live="polite">Breathe with the pulse...</div>`;
    const bt = q(el, '#bt');
    for (let i = 0; i < beats; i++) {
      later(() => {
        bt.classList.remove('pulse');
        void bt.offsetWidth;
        bt.classList.add('pulse', 'flash');
        later(() => bt.classList.remove('flash'), 260, ctx.signal);
      }, lead + i * interval, ctx.signal);
    }
    q(el, '#tap').onclick = () => {
      const now = performance.now();
      const j = Math.round((now - t0) / interval);
      if (j < 0 || j >= beats || used.has(j)) {
        sfx.bad();
        return;
      }
      used.add(j);
      const delta = Math.abs(now - (t0 + j * interval));
      const s = delta <= 120 ? 1 : delta <= 250 ? 0.5 : 0;
      scores.push(s);
      s ? sfx.good() : sfx.bad();
    };
    later(() => finish((scores.reduce((x, y) => x + y, 0)) / beats), lead + beats * interval + 400, ctx.signal);
    void avg;
  },
};

export const repair: MiniGame = {
  id: 'repair',
  title: 'Fix the wiring',
  help: 'Tap each glowing red panel before it burns out. On a keyboard, press the number on the panel.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const { total, gap, ttl } = P.repair(d);
    let spawned = 0;
    let fixed = 0;
    el.innerHTML = `<div class="tiles">${Array.from({ length: 9 }, (_, i) => `<button class="btn tile" data-i="${i}" aria-label="Panel ${i + 1}"></button>`).join('')}</div><div class="note" id="fx" aria-live="polite">Fixed 0</div>`;
    const tiles = [...el.querySelectorAll<HTMLButtonElement>('.tile')];
    const stamp = new Map<HTMLButtonElement, number>();
    const setHot = (t: HTMLButtonElement, on: boolean): void => {
      t.classList.toggle('hot', on);
      t.setAttribute('aria-label', `Panel ${tiles.indexOf(t) + 1}${on ? ', broken, fix it now' : ''}`);
    };
    const press = (t: HTMLButtonElement): void => {
      if (!t.classList.contains('hot')) {
        sfx.bad();
        return;
      }
      setHot(t, false);
      fixed++;
      q(el, '#fx').textContent = `Fixed ${fixed}`;
      sfx.good();
    };
    el.addEventListener('keydown', (e) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 9) press(tiles[n - 1]);
    });
    tiles.forEach((t, i) => {
      t.textContent = String(i + 1);
      t.onclick = () => {
        if (!t.classList.contains('hot')) {
          sfx.bad();
          return;
        }
        setHot(t, false);
        fixed++;
        q(el, '#fx').textContent = `Fixed ${fixed}`;
        sfx.good();
      };
    });
    const spawn = () => {
      if (ctx.signal.aborted) return;
      if (spawned >= total) {
        later(() => finish(fixed / total), ttl + 100, ctx.signal);
        return;
      }
      spawned++;
      const idle = tiles.filter((t) => !t.classList.contains('hot'));
      const t = idle[Math.floor(Math.random() * idle.length)];
      setHot(t, true);
      const mine = (stamp.get(t) ?? 0) + 1;
      stamp.set(t, mine);
      later(() => {
        if (stamp.get(t) === mine) setHot(t, false);
      }, ttl, ctx.signal);
      later(spawn, gap, ctx.signal);
    };
    later(spawn, 500, ctx.signal);
  },
};
