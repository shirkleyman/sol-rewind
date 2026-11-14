import { sfx } from '../ui/sound';
import { P } from './params';
import { later, once, q } from './types';
import type { MiniGame } from './types';

export const water: MiniGame = {
  id: 'water',
  title: 'Pump the water',
  help: 'Tap Pump as fast as you can for 6 seconds.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const { target, clogs } = P.water(d);
    let taps = 0;
    let left = 6;
    let clogged = false;
    el.innerHTML = `<div class="pumprow"><div class="livetank" aria-hidden="true"><div class="livefill" id="lf"></div></div><div class="big" id="pc" aria-live="polite">0</div></div><div class="clogrow" id="cg"></div><button class="btn big-btn pump" id="pp">Pump!</button><div class="note">Time left: <span id="tl">6</span>s${clogs ? '. Clear clogs by tapping them.' : ''}</div>`;
    const pc = q(el, '#pc');
    const cg = q(el, '#cg');
    const pp = q(el, '#pp');
    pp.onclick = () => {
      if (clogged) {
        sfx.bad();
        return;
      }
      taps++;
      pc.textContent = String(taps);
      q(el, '#lf').style.height = `${Math.min(100, (taps / target) * 100)}%`;
      sfx.tap();
    };
    const spawnClog = () => {
      if (!clogs || left <= 1 || clogged) return;
      clogged = true;
      pp.classList.add('blocked');
      cg.innerHTML = '<button class="btn clog" id="cl">Clog! Tap to clear</button>';
      q(el, '#cl').onclick = () => {
        clogged = false;
        pp.classList.remove('blocked');
        cg.innerHTML = '';
        sfx.good();
        later(spawnClog, 1400 + Math.random() * 900, ctx.signal);
      };
    };
    if (clogs) later(spawnClog, 1500, ctx.signal);
    const iv = window.setInterval(() => {
      if (ctx.signal.aborted) {
        clearInterval(iv);
        return;
      }
      left--;
      q(el, '#tl').textContent = String(left);
      if (left <= 0) {
        clearInterval(iv);
        pp.onclick = null;
        finish(taps / target);
      }
    }, 1000);
  },
};
