import { START_DAYS, marsOrbitPoints, orbitAt } from '../core/orbits';
import { heroHtml } from './hero';
import { icon } from './icons';
import './orbits.css';

const S = 120; // pixels per AU in the drawing
const P = (v: number): string => (v * S).toFixed(1);
const reduced = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A card that explains, with a small moving picture, why the Earth to Mars distance changes. */
export function orbitsHtml(): string {
  const path = marsOrbitPoints()
    .map((p, i) => `${i ? 'L' : 'M'}${P(p.x)} ${P(-p.y)}`)
    .join(' ');
  return `<div class="ov"><div class="box orbit-box">${heroHtml('mars', { size: 'sm', ic: 'planet' })}
    <h2>Why does the distance to Mars change?</h2>
    <svg class="orbit-svg" viewBox="-205 -205 410 410" role="img" aria-label="Earth and Mars going around the Sun at different speeds. The line between them gets longer and shorter.">
      <circle r="${P(1)}" class="o-earth-path"/><path d="${path}Z" class="o-mars-path"/>
      <line id="o-line" x1="0" y1="0" x2="0" y2="0" class="o-line"/>
      <circle r="13" class="o-sun"/>
      <circle id="o-e" r="8" class="o-earth"/><text id="o-et" class="o-lbl" text-anchor="middle">Earth</text>
      <circle id="o-m" r="6.5" class="o-mars"/><text id="o-mt" class="o-lbl" text-anchor="middle">Mars</text>
    </svg>
    <div class="orbit-read"><div><b id="o-km">0</b> million km</div><div class="o-sub" id="o-min"></div><div class="o-bar"><i id="o-barfill"></i></div><div class="o-ends"><span>closest 55</span><span>farthest 400</span></div></div>
    <ul class="orbit-why">
      <li>Earth and Mars both go around the Sun, but Earth is faster.</li>
      <li>Sometimes they are on the same side of the Sun. They are close, about 55 million km.</li>
      <li>Sometimes the Sun is between them. They are far, about 400 million km.</li>
      <li>The orbit of Mars is a bit squashed, so some close passes are closer than others.</li>
    </ul>
    <div class="orbit-ctl"><button class="btn" id="o-play" aria-pressed="true">${icon('history')} Pause</button><label class="o-time">Time <input id="o-range" type="range" min="0" max="1000" value="0" aria-label="Move time forward"></label></div>
    <button class="btn primary" id="orb-close" style="margin-top:10px">Got it</button></div></div>`;
}

/** Starts the animation inside the card. It stops by itself when the card is removed. */
export function bindOrbits(root: HTMLElement): void {
  const $ = <T extends Element>(id: string): T => root.querySelector<T>(id)!;
  const line = $<SVGLineElement>('#o-line');
  const e = $<SVGCircleElement>('#o-e');
  const m = $<SVGCircleElement>('#o-m');
  const et = $<SVGTextElement>('#o-et');
  const mt = $<SVGTextElement>('#o-mt');
  const km = $<HTMLElement>('#o-km');
  const mins = $<HTMLElement>('#o-min');
  const fill = $<HTMLElement>('#o-barfill');
  const play = $<HTMLButtonElement>('#o-play');
  const range = $<HTMLInputElement>('#o-range');
  const SPAN = 800; // days the slider covers: a bit more than one full cycle of close and far
  let t = 0;
  let running = !reduced();
  let last = performance.now();

  const draw = (): void => {
    const s = orbitAt(START_DAYS + t);
    e.setAttribute('cx', P(s.earth.x));
    e.setAttribute('cy', P(-s.earth.y));
    m.setAttribute('cx', P(s.mars.x));
    m.setAttribute('cy', P(-s.mars.y));
    et.setAttribute('x', P(s.earth.x));
    et.setAttribute('y', P(-s.earth.y - 0.13));
    mt.setAttribute('x', P(s.mars.x));
    mt.setAttribute('y', P(-s.mars.y - 0.13));
    line.setAttribute('x1', P(s.earth.x));
    line.setAttribute('y1', P(-s.earth.y));
    line.setAttribute('x2', P(s.mars.x));
    line.setAttribute('y2', P(-s.mars.y));
    const f = Math.max(0, Math.min(1, (s.mkm - 55) / 345));
    const color = `hsl(${Math.round(130 - 130 * f)} 70% 45%)`;
    line.style.stroke = color;
    km.textContent = String(Math.round(s.mkm));
    const mm = s.minutes;
    mins.textContent = `A radio message takes about ${mm < 10 ? mm.toFixed(1) : Math.round(mm)} minutes to cross it.`;
    fill.style.width = `${Math.round(f * 100)}%`;
    fill.style.background = color;
    range.value = String(Math.round(((t % SPAN) / SPAN) * 1000));
  };

  const tick = (now: number): void => {
    if (!root.isConnected) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (running) {
      t += dt * 38; // about 9 seconds for one Earth year
      draw();
    }
    requestAnimationFrame(tick);
  };
  const setRunning = (on: boolean): void => {
    running = on;
    play.setAttribute('aria-pressed', String(on));
    play.innerHTML = on ? `${icon('history')} Pause` : `${icon('rocket')} Play`;
  };
  play.onclick = () => setRunning(!running);
  range.oninput = () => {
    setRunning(false);
    t = (Number(range.value) / 1000) * SPAN;
    draw();
  };
  setRunning(running);
  draw();
  requestAnimationFrame(tick);
}
