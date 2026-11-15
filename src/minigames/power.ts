import { sfx } from '../ui/sound';
import { P } from './params';
import { avg, once, q } from './types';
import type { MiniGame } from './types';

export const power: MiniGame = {
  id: 'power',
  title: 'Aim the solar panel',
  help: 'Press Stop when the sun is inside the green zone. A few tries, each a bit faster.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const { half, speed, drifts, rounds } = P.power(d);
    const scores: number[] = [];
    let tries = 0;
    let pos = 0.5;
    let center = 0.5;
    el.innerHTML = `<div class="bar2" aria-hidden="true"><div class="haze ${ctx.world === 'mars' && d > 0.4 ? 'on' : ''}"></div><div class="zone" id="zn"></div><div class="sun" id="sn"></div></div><button class="btn big-btn" id="stp">Stop</button><div class="note" id="rd">Try 1 of ${rounds}${drifts ? '. The zone drifts, watch it.' : ''}</div>`;
    const sn = q(el, '#sn');
    const zn = q(el, '#zn');
    const rd = q(el, '#rd');
    let last = performance.now();
    let phase = 0;
    let clock = 0;
    const frame = (t: number) => {
      if (ctx.signal.aborted || !el.isConnected) return;
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
      last = t;
      phase += dt * (speed + tries * 0.35);
      clock += dt;
      pos = 0.5 + 0.5 * Math.sin(phase);
      center = drifts ? 0.5 + 0.18 * Math.sin(clock * 0.9) : 0.5;
      sn.style.left = `${pos * 100}%`;
      zn.style.left = `${(center - half) * 100}%`;
      zn.style.width = `${half * 200}%`;
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    q(el, '#stp').onclick = () => {
      const dist = Math.abs(pos - center);
      scores.push(dist <= half ? 1 : Math.max(0, 1 - (dist - half) / 0.3));
      dist <= half ? sfx.good() : sfx.tap();
      tries++;
      if (tries >= rounds) finish(avg(scores));
      else rd.textContent = `Try ${tries + 1} of ${rounds}, a little faster now`;
    };
  },
};
