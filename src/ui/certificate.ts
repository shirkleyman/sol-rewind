import certCss from './certificate.css?inline';
import './certificate.css';

export interface CertOpts {
  name: string;
  kind: 'level' | 'full';
  levelId?: number;
  levelTitle?: string;
  /** Stars earned in this level (kind "level"). Ignored for "full". */
  stars: number;
  totalStars: number;
  maxStars: number;
  date: Date;
}

export interface Rank {
  id: 'cadet' | 'moon' | 'mars' | 'commander';
  title: string;
  /** Smallest share of all stars (0 to 1) that earns this rank. */
  from: number;
}

export const RANKS: Rank[] = [
  { id: 'cadet', title: 'Space Cadet', from: 0 },
  { id: 'moon', title: 'Moon Explorer', from: 0.15 },
  { id: 'mars', title: 'Mars Pioneer', from: 0.4 },
  { id: 'commander', title: 'Mission Commander', from: 0.75 },
];

/** Kid friendly rank from the share of all stars earned. */
export function rankFor(totalStars: number, maxStars: number): Rank {
  const share = maxStars > 0 ? Math.max(0, Math.min(1, totalStars / maxStars)) : 0;
  let best = RANKS[0];
  for (const r of RANKS) if (share >= r.from) best = r;
  return best;
}

export const NAME_MAX = 20;

/** Trims, collapses spaces, removes angle brackets and cuts to NAME_MAX characters. */
export function cleanName(raw: string): string {
  return raw.replace(/[<>&"`]/g, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX).trim();
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

const starsHtml = (n: number): string =>
  [1, 2, 3].map((i) => `<span class="${i <= n ? 'on' : 'off'}" aria-hidden="true">&#9733;</span>`).join('');

/** The certificate itself, ready to drop into an overlay box or to print. */
export function certificateHtml(o: CertOpts): string {
  const name = escapeHtml(cleanName(o.name) || 'Young Astronaut');
  const rank = rankFor(o.totalStars, o.maxStars);
  const full = o.kind === 'full';
  const what = full
    ? 'has trained as an astronaut and finished the whole journey from Earth to the Moon and Mars.'
    : `has finished Level ${o.levelId ?? ''}${o.levelTitle ? `: ${escapeHtml(o.levelTitle)}` : ''}, planned every day and looked after the crew.`;
  const stars = full ? '' : `<div class="cert-stars" role="img" aria-label="${o.stars} of 3 stars">${starsHtml(o.stars)}</div>`;
  return `<div class="cert" role="img" aria-label="Astronaut certificate for ${name}, rank ${rank.title}"><div class="cert-in">
    <div class="cert-top">Sol Rewind Space Academy</div>
    <h1>Certificate of Achievement</h1>
    <p class="cert-sub">This is to say that</p>
    <div class="cert-name">${name}</div>
    <p class="cert-line">${what}</p>
    ${stars}
    <div class="cert-rank">Rank: ${rank.title} &middot; ${o.totalStars} of ${o.maxStars} stars</div>
    <div class="cert-foot"><div><small>Date</small><b>${formatDate(o.date)}</b></div><p class="cert-note">Made in the Sol Rewind game.<br>Not an official NASA document.</p></div>
  </div></div>`;
}

const PRINT_CSS = `@page { size: A4 landscape; margin: 8mm; }
html, body { margin: 0; background: #fff; }
body { display: flex; align-items: center; justify-content: center; min-height: 100vh; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.cert { max-width: none; width: 100%; }`;

/** Prints only the certificate, using a hidden frame so the rest of the page stays out of the printout. */
export function printCertificate(html: string): void {
  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>Astronaut certificate</title><style>${certCss}${PRINT_CSS}</style></head><body>${html}</body></html>`;
  const cleanup = (): void => {
    window.setTimeout(() => frame.remove(), 500);
  };
  frame.onload = () => {
    const w = frame.contentWindow;
    if (!w) {
      cleanup();
      return;
    }
    w.addEventListener('afterprint', cleanup);
    w.focus();
    w.print();
    window.setTimeout(cleanup, 60000);
  };
  document.body.appendChild(frame);
}

/** Small form that asks for the child's first name. Wire it with bindNameForm. */
export function nameFormHtml(current: string): string {
  return `<form class="nm-form" data-nm-form novalidate>
    <label for="nm-input">What is your first name?</label>
    <input id="nm-input" name="name" type="text" maxlength="${NAME_MAX}" autocomplete="off" autocapitalize="words" spellcheck="false" value="${escapeHtml(cleanName(current))}" aria-describedby="nm-hint nm-err" />
    <div class="nm-hint" id="nm-hint">It goes on your certificate. It stays on this device and is never sent anywhere.</div>
    <div class="nm-err" id="nm-err" role="alert"></div>
    <button type="submit" class="btn primary" data-act="name-save">Save my name</button>
  </form>`;
}

export function bindNameForm(root: HTMLElement, onSave: (name: string) => void): void {
  const form = root.querySelector<HTMLFormElement>('[data-nm-form]');
  if (!form) return;
  const input = form.querySelector<HTMLInputElement>('#nm-input');
  const err = form.querySelector<HTMLElement>('#nm-err');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = cleanName(input?.value ?? '');
    if (!name) {
      if (err) err.textContent = 'Please type your name first.';
      input?.focus();
      return;
    }
    if (err) err.textContent = '';
    onSave(name);
  });
  input?.focus({ preventScroll: true });
}
