import './prep.css';
import gsap from 'gsap';
import { astroInner } from './art';
import { sfx } from './sound';

export interface LaunchOptions {
  onDone: () => void;
}

let stop: (() => void) | null = null;

const ROCKET_X = 520;
const GROUND_Y = 350;

function svgScene(): string {
  const stars = Array.from({ length: 60 }, (_, i) => {
    const x = (i * 97) % 760;
    const y = (i * 53) % 330;
    return `<circle cx="${x}" cy="${y}" r="${0.7 + (i % 3) * 0.5}" fill="#e6ecff"/>`;
  }).join('');
  return `<svg viewBox="0 0 760 440" role="img" aria-label="An astronaut walks to a rocket on the coast of Israel, and the rocket flies to the Moon">
  <defs>
    <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f4f9a"/><stop offset="0.6" stop-color="#d98a7a"/><stop offset="1" stop-color="#ffc58a"/></linearGradient>
    <linearGradient id="lsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d7fb8"/><stop offset="1" stop-color="#2a5f96"/></linearGradient>
  </defs>
  <rect width="760" height="440" fill="url(#lsky)"/>
  <rect id="night" width="760" height="440" fill="#04050d" opacity="0"/>
  <g id="stars" opacity="0">${stars}</g>
  <g id="space" opacity="0">
    <g id="earthG"><circle cx="0" cy="0" r="430" fill="#3b82c4"/><path d="M-130 -340 q60 -40 130 -10 q50 22 90 -4 q60 -20 80 20 l-40 40 q-60 14 -120 4 q-80 -14 -140 -50Z" fill="#6fb872"/><path d="M-250 -300 q30 -20 60 -4 q10 20 -20 30 q-30 4 -40 -26Z" fill="#6fb872"/><circle cx="0" cy="0" r="436" fill="none" stroke="#a9d1f5" stroke-width="6" opacity="0.8"/></g>
    <g id="moon" opacity="0"><circle cx="620" cy="110" r="60" fill="#dde2ec"/><circle cx="600" cy="95" r="10" fill="#c7cedd"/><circle cx="640" cy="130" r="14" fill="#c7cedd"/><circle cx="625" cy="80" r="6" fill="#c7cedd"/></g>
  </g>
  <g id="sun"><circle cx="150" cy="300" r="44" fill="#ffe0a0" opacity="0.85"/><circle cx="150" cy="300" r="26" fill="#fff3d2"/></g>
  <g id="ground">
    <rect y="296" width="760" height="64" fill="url(#lsea)"/>
    <path d="M0 316 q60 -6 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t60 0" fill="none" stroke="#ffffff55" stroke-width="2"/>
    <path d="M0 360 L760 346 L760 440 L0 440Z" fill="#e4cf9f"/>
    <path d="M0 400 L760 392 L760 440 L0 440Z" fill="#d7bf8a"/>
    <g id="tower"><rect x="60" y="270" width="18" height="86" fill="#f4f1ea" stroke="#c9c2b2"/><rect x="58" y="262" width="22" height="10" fill="#d9475f"/><rect x="64" y="248" width="10" height="14" fill="#ffe9a8"/><path d="M62 248 l6 -12 l6 12Z" fill="#8a97b5"/></g>
    <rect x="440" y="342" width="160" height="14" rx="3" fill="#7b869f"/>
    <rect x="452" y="354" width="136" height="8" fill="#5f6a84"/>
    <path d="M580 342 v-120 h10 v120" fill="none" stroke="#8a97b5" stroke-width="4"/>
    <g id="smoke" opacity="1"><circle cx="${ROCKET_X - 20}" cy="${GROUND_Y - 4}" r="2" fill="#f3efe8" opacity="0"/><circle cx="${ROCKET_X}" cy="${GROUND_Y - 2}" r="2" fill="#f3efe8" opacity="0"/><circle cx="${ROCKET_X + 20}" cy="${GROUND_Y - 4}" r="2" fill="#f3efe8" opacity="0"/><circle cx="${ROCKET_X - 36}" cy="${GROUND_Y}" r="2" fill="#f3efe8" opacity="0"/><circle cx="${ROCKET_X + 36}" cy="${GROUND_Y}" r="2" fill="#f3efe8" opacity="0"/></g>
  </g>
  <g id="rocket" transform="translate(${ROCKET_X} ${GROUND_Y})">
    <g id="flame" opacity="0"><path d="M-12 0 Q0 70 12 0 Z" fill="#ff9d3a"/><path d="M-7 0 Q0 44 7 0 Z" fill="#ffe27a"/></g>
    <path d="M-16 -8 L-30 12 L-16 4 Z" fill="#d9475f"/><path d="M16 -8 L30 12 L16 4 Z" fill="#d9475f"/>
    <path d="M-17 0 L-17 -90 Q-17 -128 0 -148 Q17 -128 17 -90 L17 0 Z" fill="#f4f6fb" stroke="#aab6cf" stroke-width="2"/>
    <path d="M-17 -92 Q-17 -128 0 -148 Q17 -128 17 -92 Z" fill="#e0693a"/>
    <circle cx="0" cy="-78" r="9" fill="#2a4a7a" stroke="#fff" stroke-width="3"/><circle cx="-3" cy="-81" r="3" fill="#7fb2ee"/>
    <rect x="-17" y="-30" width="34" height="6" fill="#d9475f"/>
  </g>
  <g id="astro"><g id="astroBob"><svg x="0" y="0" width="30" height="42" viewBox="0 0 40 56">${astroInner('#e0693a')}</svg></g></g>
  <text id="count" x="380" y="130" text-anchor="middle" font-size="96" font-weight="700" fill="#fff" stroke="#14264d" stroke-width="4" paint-order="stroke" opacity="0" font-family="system-ui, sans-serif">3</text>
</svg>`;
}

/** The launch scene: a short animation of the astronaut leaving from Israel for the Moon. */
export function playLaunch(root: HTMLElement, opts: LaunchOptions): void {
  stop?.();
  let finished = false;
  let tl: gsap.core.Timeline | null = null;

  root.innerHTML = `<div class="frame launch"><div class="stage">${svgScene()}</div><div class="caption" id="cap" role="status" aria-live="polite">Launch site: Israel</div><div class="controls"><button class="btn" id="skip" aria-label="Skip the launch scene">Skip</button><button class="btn primary" id="cont" hidden>Continue</button></div></div>`;

  const q = <T extends Element>(sel: string): T => root.querySelector(sel) as T;
  const cap = q<HTMLElement>('#cap');
  const cont = q<HTMLButtonElement>('#cont');
  const skip = q<HTMLButtonElement>('#skip');
  const setCap = (t: string) => {
    cap.textContent = t;
  };

  const cleanup = () => {
    tl?.kill();
    tl = null;
    if (stop === cleanup) stop = null;
  };
  stop = cleanup;

  const done = () => {
    if (finished) return;
    finished = true;
    sfx.click();
    cleanup();
    opts.onDone();
  };
  skip.onclick = done;
  cont.onclick = done;

  const showEnd = () => {
    setCap('Next stop: the Moon');
    cont.hidden = false;
    skip.hidden = true;
    cont.focus({ preventScroll: true });
  };

  const sel = (s: string) => q<SVGElement>(s);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.set(sel('#astro'), { opacity: 0 });
    gsap.set(sel('#night'), { opacity: 1 });
    gsap.set(sel('#stars'), { opacity: 1 });
    gsap.set(sel('#space'), { opacity: 1 });
    gsap.set(sel('#moon'), { opacity: 1 });
    gsap.set(sel('#ground'), { opacity: 0 });
    gsap.set(sel('#sun'), { opacity: 0 });
    gsap.set(sel('#rocket'), { x: 540, y: 250, scale: 0.5, svgOrigin: '0 0' });
    gsap.set(sel('#earthG'), { x: 110, y: 360, scale: 70 / 430, svgOrigin: '0 0' });
    showEnd();
    return;
  }

  const rocket = sel('#rocket');
  const flame = sel('#flame');
  const astro = sel('#astro');
  const bob = sel('#astroBob');
  const smoke = [...root.querySelectorAll<SVGCircleElement>('#smoke circle')];
  const count = sel('#count');

  gsap.set(astro, { x: 90, y: GROUND_Y - 42 + 6 });
  gsap.set(count, { svgOrigin: '380 100' });

  tl = gsap.timeline({ onComplete: showEnd });
  tl.call(() => setCap('Launch site: Israel'), [], 0);
  tl.to(astro, { x: 470, duration: 2.6, ease: 'none' }, 0.3);
  tl.to(bob, { y: -3, duration: 0.18, repeat: 13, yoyo: true, ease: 'sine.inOut' }, 0.3);
  tl.call(() => setCap('The astronaut waves goodbye'), [], 3);
  tl.to(bob, { y: -10, duration: 0.2, repeat: 5, yoyo: true, ease: 'sine.out' }, 3);
  tl.to(astro, { opacity: 0, duration: 0.4 }, 4.2);
  tl.call(() => setCap('3... 2... 1...'), [], 4.6);
  [3, 2, 1].forEach((n, i) => {
    const t = 4.6 + i * 0.9;
    tl!.call(() => {
      count.textContent = String(n);
    }, [], t);
    tl!.fromTo(count, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' }, t);
    tl!.to(count, { opacity: 0, duration: 0.3 }, t + 0.6);
  });
  const lift = 7.4;
  tl.call(() => setCap('Liftoff!'), [], lift);
  tl.to(flame, { opacity: 1, duration: 0.2 }, lift - 0.2);
  tl.to(flame, { scaleY: 1.4, duration: 0.1, repeat: 40, yoyo: true, transformOrigin: '50% 0%' }, lift - 0.2);
  tl.fromTo(rocket, { x: ROCKET_X }, { x: ROCKET_X + 2, duration: 0.05, repeat: 16, yoyo: true }, lift - 0.4);
  smoke.forEach((c, i) => {
    tl!.fromTo(c, { opacity: 0.9, attr: { r: 6 } }, { opacity: 0, attr: { r: 40 + i * 8 }, duration: 2.6, ease: 'power1.out' }, lift + i * 0.08);
  });
  tl.to(rocket, { y: GROUND_Y - 200, duration: 3.2, ease: 'power2.in' }, lift + 0.4);
  tl.to(sel('#ground'), { y: 260, duration: 3.4, ease: 'power2.in' }, lift + 0.4);
  tl.to(sel('#sun'), { y: 200, opacity: 0, duration: 2.6 }, lift + 0.4);
  tl.to(sel('#night'), { opacity: 1, duration: 3.6, ease: 'power1.in' }, lift + 0.6);
  tl.to(sel('#stars'), { opacity: 1, duration: 2.4 }, lift + 2.4);
  tl.call(() => setCap('Leaving Earth'), [], lift + 3);
  tl.to(sel('#space'), { opacity: 1, duration: 1.2 }, lift + 2.6);
  tl.fromTo(sel('#earthG'), { x: 380, y: 900, scale: 1, svgOrigin: '0 0' }, { x: 380, y: 610, duration: 2.2, ease: 'power1.out' }, lift + 2.6);
  tl.to(sel('#earthG'), { x: 110, y: 360, scale: 70 / 430, duration: 2.4, ease: 'power2.inOut' }, lift + 5);
  tl.to(rocket, { x: 540, y: 250, scale: 0.5, svgOrigin: '0 0', duration: 2.6, ease: 'power1.inOut' }, lift + 5);
  tl.to(flame, { opacity: 0.6, duration: 0.5 }, lift + 5);
  tl.fromTo(sel('#moon'), { opacity: 0, scale: 0.2, svgOrigin: '620 110' }, { opacity: 1, scale: 1, duration: 2.6, ease: 'power2.out' }, lift + 5);
}
