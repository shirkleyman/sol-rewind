import { sfx } from '../ui/sound';
import { P } from './params';
import { later, once, q } from './types';
import type { MiniGame } from './types';

interface Particle {
  el: HTMLElement;
  x: number;
  y: number;
  decoy: boolean;
  phase: number;
}

/**
 * Drag the shield left and right (finger, mouse or arrow keys) to catch the storm particles.
 * On the Moon they drift sideways in a floaty way (low gravity feel). On Mars gusts of wind push them around.
 */
export const shield: MiniGame = {
  id: 'shield',
  title: 'Catch the storm particles',
  help: 'Drag the shield with your finger or mouse (or use the arrow keys). Catch the purple particles and let the green ones pass.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const { total, fall, gap, decoy: decoyChance } = P.shield(d, ctx.storm);
    const moon = ctx.world === 'moon';
    const windy = ctx.world === 'mars' && d > 0.3;
    el.innerHTML = `<div class="arena drag" id="ar" tabindex="0" role="application" aria-label="Move the shield left and right"><div class="haze ${ctx.world === 'mars' ? 'on' : ''}"></div><div class="baseline"></div><div class="shieldbar" id="sb"></div></div><div class="note" id="bl" aria-live="polite">Caught 0</div>`;
    const ar = q(el, '#ar');
    const sb = q(el, '#sb');
    const bl = q(el, '#bl');
    const H = Math.max(180, ar.clientHeight);
    const groundY = H - 38;
    const widthFrac = 0.34 - 0.12 * d;
    sb.style.width = `${widthFrac * 100}%`;
    let shieldX = 0.5;
    const place = () => {
      sb.style.left = `${(shieldX - widthFrac / 2) * 100}%`;
    };
    place();
    const moveTo = (clientX: number) => {
      const r = ar.getBoundingClientRect();
      shieldX = Math.max(widthFrac / 2, Math.min(1 - widthFrac / 2, (clientX - r.left) / r.width));
      place();
    };
    ar.addEventListener('pointerdown', (e) => {
      ar.setPointerCapture?.(e.pointerId);
      moveTo(e.clientX);
    });
    ar.addEventListener('pointermove', (e) => moveTo(e.clientX));
    ar.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') shieldX = Math.max(widthFrac / 2, shieldX - 0.06);
      if (e.key === 'ArrowRight') shieldX = Math.min(1 - widthFrac / 2, shieldX + 0.06);
      place();
    });
    ar.focus({ preventScroll: true });

    const parts: Particle[] = [];
    let spawned = 0;
    let real = 0;
    let caught = 0;
    let penalty = 0;
    const speed = groundY / fall;
    const spawn = () => {
      if (ctx.signal.aborted || spawned >= total) return;
      spawned++;
      const decoy = Math.random() < decoyChance;
      if (!decoy) real++;
      const p = document.createElement('div');
      p.className = decoy ? 'pt2 decoy' : 'pt2';
      p.setAttribute('aria-hidden', 'true');
      ar.appendChild(p);
      parts.push({ el: p, x: 0.08 + Math.random() * 0.84, y: -20, decoy, phase: Math.random() * 6 });
      later(spawn, gap, ctx.signal);
    };
    spawn();

    let last = performance.now();
    const loop = (now: number) => {
      if (ctx.signal.aborted || !document.contains(ar)) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.y += speed * dt;
        if (moon) p.x += Math.sin(now / 520 + p.phase) * 0.06 * dt;
        if (windy) p.x += Math.sin(now / 900) * 0.07 * dt * (0.4 + d);
        p.x = Math.max(0.03, Math.min(0.97, p.x));
        p.el.style.left = `${p.x * 100}%`;
        p.el.style.transform = `translate(-12px, ${p.y}px)`;
        if (p.y >= groundY) {
          const hit = Math.abs(p.x - shieldX) <= widthFrac / 2 + 0.015;
          if (hit) {
            if (p.decoy) {
              penalty++;
              sfx.bad();
              ar.classList.add('flashbad');
            } else {
              caught++;
              sfx.tap();
              ar.classList.add('flashok');
            }
          } else if (!p.decoy) {
            ar.classList.add('flashbad');
          }
          window.setTimeout(() => ar.classList.remove('flashok', 'flashbad'), 160);
          p.el.remove();
          parts.splice(i, 1);
          bl.textContent = `Caught ${caught}`;
        }
      }
      if (spawned >= total && parts.length === 0) {
        finish(real ? Math.max(0, caught - penalty) / real : 1);
        return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
};
