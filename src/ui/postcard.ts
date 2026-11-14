import { photoUrl } from '../core/sites';
import type { Site } from '../core/sites';
import { starRow } from './art';
import { cleanName, escapeHtml } from './certificate';
import './postcard.css';

export interface PostcardOpts {
  site: Site;
  levelId: number;
  levelTitle: string;
  stars: number;
  name: string;
}

/** Short handwritten message. Pure, so it can be tested and reused by the canvas version. */
export function postcardMessage(o: PostcardOpts): string {
  const who = cleanName(o.name) || 'your astronaut';
  const lines = [
    `Dear Earth, I reached ${o.site.name}. It was a tough mission, but I did it!`,
    `Dear Earth, I am at ${o.site.name} and the crew is safe. Good job on the plan!`,
    `Dear Earth, I made it to ${o.site.name} with a perfect plan. Wish you were here!`,
  ];
  return `${lines[Math.max(0, Math.min(2, o.stars - 1))]} Love, ${who}`;
}

export const postcardFileName = (o: PostcardOpts): string => `postcard-level-${o.levelId}-${o.site.id}.png`;

/** Inner HTML for an overlay box. Buttons: [data-act="postcard-save"] and [data-act="postcard-close"]. */
export function postcardHtml(o: PostcardOpts): string {
  const s = o.site;
  const url = photoUrl(s.photo.file);
  return `<div class="pc-wrap">
    <h2>Postcard from ${escapeHtml(s.name)}</h2>
    <div class="pc" role="group" aria-label="Postcard from ${escapeHtml(s.place)}">
      <div class="pc-photo"><img src="${url}" alt="${escapeHtml(s.photo.caption)}" /></div>
      <div class="pc-side">
        <div class="pc-stamp"><small>LEVEL ${o.levelId}</small>${starRow(o.stars, 60)}</div>
        <p class="pc-greet">Greetings from ${escapeHtml(s.place)}!</p>
        <p class="pc-msg">${escapeHtml(postcardMessage(o))}</p>
        <div class="pc-meta"><span><b>Date of the photo:</b> ${escapeHtml(s.when)}</span><span><b>${escapeHtml(s.coords.note)}:</b> ${escapeHtml(s.coords.text)}</span></div>
      </div>
    </div>
    <p class="pc-credit">Photo credit: ${escapeHtml(s.photo.credit)}. NASA image <a href="${s.photo.page}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.photo.nasaId)}</a>.</p>
    <div class="pc-actions"><button class="btn primary" data-act="postcard-save">Save postcard</button><button class="btn" data-act="postcard-close">Close</button></div>
    <div class="pc-status" role="status" aria-live="polite"></div>
  </div>`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('photo failed to load'));
    im.src = src;
  });
}

function starPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  ctx.closePath();
}

/** Draws the postcard (1200 by 800) and downloads it as a PNG. */
export async function downloadPostcardPng(o: PostcardOpts): Promise<void> {
  const s = o.site;
  const W = 1200;
  const H = 800;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('canvas not available');
  const img = await loadImage(photoUrl(s.photo.file));
  ctx.fillStyle = '#fffdf6';
  ctx.fillRect(0, 0, W, H);
  // photo, cropped to fill the left half
  const px = 24;
  const py = 24;
  const pw = 640;
  const ph = H - 48;
  const k = Math.max(pw / img.width, ph / img.height);
  const sw = pw / k;
  const sh = ph / k;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, px, py, pw, ph);
  ctx.restore();
  // divider
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = '#d9d1bd';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(px + pw + 24, py);
  ctx.lineTo(px + pw + 24, py + ph);
  ctx.stroke();
  ctx.setLineDash([]);
  const tx = px + pw + 52;
  const tw = W - tx - 36;
  const script = "'Segoe Print','Bradley Hand','Comic Sans MS',cursive";
  // stamp
  ctx.save();
  ctx.translate(W - 120, 90);
  ctx.rotate(0.05);
  ctx.fillStyle = '#fff8e1';
  ctx.strokeStyle = '#c9962e';
  ctx.setLineDash([3, 6]);
  ctx.lineWidth = 4;
  ctx.fillRect(-64, -58, 128, 116);
  ctx.strokeRect(-64, -58, 128, 116);
  ctx.setLineDash([]);
  ctx.fillStyle = '#8a6a12';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`LEVEL ${o.levelId}`, 0, -30);
  for (let i = 0; i < 3; i++) {
    starPath(ctx, -38 + i * 38, 14, 16);
    ctx.fillStyle = i < o.stars ? '#e8b84a' : '#e5dcc4';
    ctx.fill();
    ctx.strokeStyle = '#c9962e';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // greeting
  ctx.fillStyle = '#14264d';
  ctx.font = `bold 42px ${script}`;
  let y = 150;
  for (const l of wrap(ctx, `Greetings from ${s.place}!`, tw - 150)) {
    ctx.fillText(l, tx, y);
    y += 50;
  }
  // message
  ctx.fillStyle = '#2b3f6b';
  ctx.font = `30px ${script}`;
  y += 20;
  for (const l of wrap(ctx, postcardMessage(o), tw)) {
    ctx.fillText(l, tx, y);
    y += 42;
  }
  // meta and credit
  ctx.fillStyle = '#5a6b92';
  ctx.font = '22px system-ui, sans-serif';
  let my = H - 150;
  ctx.strokeStyle = '#e6dfcc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx, my - 28);
  ctx.lineTo(tx + tw, my - 28);
  ctx.stroke();
  for (const t of [`Date of the photo: ${s.when}`, `${s.coords.note}: ${s.coords.text}`]) {
    for (const l of wrap(ctx, t, tw)) {
      ctx.fillText(l, tx, my);
      my += 28;
    }
  }
  ctx.font = '18px system-ui, sans-serif';
  const credit = `Photo credit: ${s.photo.credit}. NASA image ${s.photo.nasaId}. Made in the Sol Rewind game.`;
  let cy = H - 64;
  for (const l of wrap(ctx, credit, tw)) {
    ctx.fillText(l, tx, cy);
    cy += 24;
  }
  // frame
  ctx.strokeStyle = '#d9d1bd';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('could not make the picture');
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = postcardFileName(o);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(href), 4000);
}

/** Wires the save button inside `root`. Shows a short status line under the postcard. */
export function bindPostcard(root: HTMLElement, o: PostcardOpts): void {
  const btn = root.querySelector<HTMLButtonElement>('[data-act="postcard-save"]');
  const status = root.querySelector<HTMLElement>('.pc-status');
  btn?.addEventListener('click', () => {
    if (status) status.textContent = 'Saving...';
    downloadPostcardPng(o).then(
      () => {
        if (status) status.textContent = 'Saved to your downloads.';
      },
      () => {
        if (status) status.textContent = 'Sorry, saving did not work. You can take a screenshot instead.';
      },
    );
  });
}
