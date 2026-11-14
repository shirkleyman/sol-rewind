import { icon } from '../ui/icons';
import type { IconName } from '../ui/icons';
import { sfx } from '../ui/sound';
import { P } from './params';
import { avg, clamp, later, once, q } from './types';
import type { MiniGame } from './types';

const FACES: IconName[] = ['seedling', 'droplet', 'sun', 'leaf', 'flask', 'bulb', 'heart', 'bolt'];

export const plants: MiniGame = {
  id: 'plants',
  title: 'Match the plant cards',
  help: 'Find every pair in as few moves as you can.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const { pairs, flip, peek } = P.plants(d);
    const faces = FACES.slice(0, pairs);
    const cards = [...faces, ...faces].sort(() => Math.random() - 0.5);
    let open: number[] = [];
    let found = 0;
    let moves = 0;
    let lock = false;
    const cols = pairs <= 3 ? 3 : 4;
    el.innerHTML = `<div class="mg" style="grid-template-columns:repeat(${cols},${pairs > 6 ? 56 : 64}px)">${cards
      .map((_, i) => `<button class="btn cd" data-i="${i}" aria-label="Card ${i + 1}">?</button>`)
      .join('')}</div><div class="note" id="pk">${pairs} pairs${peek ? '. Look first, then they flip back.' : ''} Moves: <span id="mv">0</span></div>`;
    const btns = [...el.querySelectorAll<HTMLButtonElement>('.cd')];
    if (peek) {
      lock = true;
      btns.forEach((b, i) => {
        b.classList.add('up');
        b.innerHTML = icon(cards[i]);
      });
      later(() => {
        btns.forEach((b) => {
          b.classList.remove('up');
          b.textContent = '?';
        });
        lock = false;
      }, peek, ctx.signal);
    }
    btns.forEach((b) => {
      b.onclick = () => {
        const i = Number(b.dataset.i);
        if (lock || b.classList.contains('up')) return;
        b.classList.add('up');
        b.innerHTML = icon(cards[i]);
        sfx.tap();
        open.push(i);
        if (open.length < 2) return;
        moves++;
        q(el, '#mv').textContent = String(moves);
        const [a, c] = open;
        open = [];
        if (cards[a] === cards[c]) {
          found++;
          sfx.good();
          if (found === pairs) later(() => finish(P.plantsScore(moves, pairs)), 400, ctx.signal);
        } else {
          lock = true;
          later(() => {
            [a, c].forEach((j) => {
              btns[j].classList.remove('up');
              btns[j].textContent = '?';
            });
            lock = false;
          }, flip, ctx.signal);
        }
      };
    });
  },
};

export const rocks: MiniGame = {
  id: 'rocks',
  title: 'Copy the sample pattern',
  help: 'Watch the lights, then repeat them in the same order.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const { len, nColors, step } = P.rocks(d);
    const colors = ['#e0693a', '#1aa58a', '#3b82c4', '#d8920a', '#8b5cf6'].slice(0, nColors);
    const seq = Array.from({ length: len }, () => Math.floor(Math.random() * colors.length));
    let pos = 0;
    let ok = 0;
    let wait = true;
    el.innerHTML = `<div class="note" id="sm" aria-live="polite">Watch the lights...</div><div class="sb">${colors
      .map((c, i) => `<button class="btn sbt" data-c="${i}" style="background:${c}" aria-label="Sample ${i + 1}"></button>`)
      .join('')}</div>`;
    const bs = [...el.querySelectorAll<HTMLButtonElement>('.sbt')];
    seq.forEach((s, i) => {
      later(() => {
        bs[s].classList.add('lit');
        sfx.tap();
      }, 500 + i * step, ctx.signal);
      later(() => bs[s].classList.remove('lit'), 500 + i * step + step * 0.6, ctx.signal);
    });
    later(() => {
      wait = false;
      q(el, '#sm').textContent = 'Your turn: repeat the pattern';
    }, 500 + len * step, ctx.signal);
    bs.forEach((b) => {
      b.onclick = () => {
        if (wait) return;
        const c = Number(b.dataset.c);
        if (c === seq[pos]) {
          ok++;
          sfx.good();
        } else {
          sfx.bad();
          wait = true;
        }
        pos++;
        if (pos >= seq.length || wait) {
          wait = true;
          finish(ok / seq.length);
        }
      };
    });
  },
};

export const sensor: MiniGame = {
  id: 'sensor',
  title: 'Dust sensor',
  help: 'Tap the instant the light turns green. Do not tap early, and ignore the amber flash.',
  start(el, d, done, ctx) {
    const finish = once(done);
    const sp = P.sensor(d);
    const rounds = sp.rounds;
    const scores: number[] = [];
    let state: 'idle' | 'wait' | 'go' = 'idle';
    let t0 = 0;
    let round = 0;
    el.innerHTML = `<div class="light" id="lt" aria-hidden="true"></div><div class="note" id="tx" aria-live="polite"></div><button class="btn big-btn" id="tap">Tap</button>`;
    const lt = q(el, '#lt');
    const tx = q(el, '#tx');
    const arm = () => {
      lt.className = 'light go';
      state = 'go';
      t0 = performance.now();
    };
    const next = () => {
      state = 'wait';
      lt.className = 'light';
      tx.textContent = `Round ${round + 1} of ${rounds}: wait for green...`;
      const decoy = Math.random() < sp.decoyChance;
      later(() => {
        if (state !== 'wait') return;
        if (decoy) {
          lt.className = 'light amber';
          later(() => {
            if (state !== 'wait') return;
            lt.className = 'light';
            later(arm, 500, ctx.signal);
          }, 500, ctx.signal);
        } else arm();
      }, 1200 + Math.random() * 2000, ctx.signal);
    };
    const advance = () => {
      round++;
      if (round >= rounds) finish(avg(scores));
      else next();
    };
    q(el, '#tap').onclick = () => {
      if (state === 'wait') {
        state = 'idle';
        scores.push(0);
        tx.textContent = 'Too early!';
        sfx.bad();
        later(advance, 800, ctx.signal);
      } else if (state === 'go') {
        state = 'idle';
        const rt = performance.now() - t0;
        const { best, worst } = sp;
        scores.push(clamp(1 - (rt - best) / (worst - best)));
        tx.textContent = `${Math.round(rt)} ms`;
        lt.className = 'light';
        sfx.good();
        later(advance, 800, ctx.signal);
      }
    };
    next();
  },
};
