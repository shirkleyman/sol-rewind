import { BADGES, HELMETS, activeHelmet, cleanName, earnedBadges, totalStars } from '../core/avatar';
import type { AvatarSave } from '../core/avatar';
import { astro } from './art';
import { icon } from './icons';
import './avatar.css';

/** The parts of the save that the avatar screens read. SaveData fits. */
export interface AvatarView extends AvatarSave {
  name: string;
  helmet: string;
}

export interface AvatarPatch {
  helmet?: string;
  name?: string;
}

const ACCENT = '#1aa58a';

/** A small astronaut wearing the chosen helmet. */
export function avatarSvg(helmetId: string, total: number): string {
  return astro(ACCENT, activeHelmet(helmetId, total).color);
}

/** Small widget for the top of the map: the astronaut, the name and a Customize button. */
export function avatarChipHtml(save: AvatarView): string {
  const total = totalStars(save.stars);
  const n = earnedBadges(save).length;
  const who = save.name ? cleanName(save.name) : 'Astronaut';
  return `<div class="av-chip"><div class="av-mini" aria-hidden="true">${avatarSvg(save.helmet, total)}</div><div class="av-who"><b>${who}</b><span>${n} of ${BADGES.length} badges</span></div><button class="btn small av-open" data-avatar="open" aria-label="Customize your astronaut">Customize</button></div>`;
}

function swatches(total: number, chosen: string): string {
  return HELMETS.map((h) => {
    const open = total >= h.need;
    const left = h.need - total;
    const more = `${left} more ${left === 1 ? 'star' : 'stars'}`;
    const label = open ? h.name : `${h.name}, locked. ${more} to unlock`;
    return `<button type="button" class="av-sw ${open ? '' : 'locked'} ${h.id === chosen ? 'on' : ''}" role="radio" aria-checked="${h.id === chosen}" aria-disabled="${!open}" tabindex="${h.id === chosen ? 0 : -1}" data-helmet="${h.id}" aria-label="${label}"><span class="av-dot" style="background:${h.color}">${open ? '' : icon('lock')}</span><span class="av-sn">${open ? h.name : more}</span></button>`;
  }).join('');
}

function badgeShelf(save: AvatarView): string {
  return BADGES.map((b) => {
    const got = b.earned(save);
    return `<li class="av-badge ${got ? 'got' : ''}" data-badge="${b.id}" aria-label="${b.name}. ${got ? 'Earned' : `Not yet. ${b.how}`}"><span class="av-bi" aria-hidden="true">${icon(got ? b.icon : 'lock')}</span><span class="av-bn">${b.name}</span><span class="av-bh">${got ? 'Earned!' : b.how}</span></li>`;
  }).join('');
}

/** Inner HTML for an overlay box: preview, helmet colors, name and badges. Call bindAvatarSheet afterwards. */
export function openAvatarSheetHtml(save: AvatarView): string {
  const total = totalStars(save.stars);
  const chosen = activeHelmet(save.helmet, total).id;
  const earned = earnedBadges(save).length;
  return `<div class="av-sheet" data-av-sheet>
    <h2 class="av-title">Your astronaut</h2>
    <div class="av-cols"><div class="av-left"><div class="av-top"><div class="av-big" id="av-big" aria-hidden="true">${avatarSvg(chosen, total)}</div>
      <div class="av-name"><label for="av-name">First name (for your certificate)</label><input id="av-name" type="text" maxlength="20" autocomplete="off" autocapitalize="words" spellcheck="false" value="${cleanName(save.name)}" placeholder="Your name" /></div></div>
    </div><div class="av-right"><h3 class="av-h first">Helmet color</h3>
    <div class="av-note">You have ${total} of 36 stars. More stars unlock more colors.</div>
    <div class="av-grid" role="radiogroup" aria-label="Helmet color">${swatches(total, chosen)}</div>
    <h3 class="av-h">Mission badges <span class="av-count">${earned} of ${BADGES.length}</span></h3>
    <ul class="av-shelf">${badgeShelf(save)}</ul></div></div>
  </div>`;
}

/**
 * Wires the sheet inside `root`. It never saves anything: it calls `onChange` and updates the picture on screen.
 * The caller stores the patch (helmet id and name) in the save.
 */
export function bindAvatarSheet(root: HTMLElement, save: AvatarView, onChange: (patch: AvatarPatch) => void): void {
  const sheet = root.querySelector<HTMLElement>('[data-av-sheet]');
  if (!sheet) return;
  const total = totalStars(save.stars);
  const grid = sheet.querySelector<HTMLElement>('.av-grid');
  const big = sheet.querySelector<HTMLElement>('#av-big');
  const input = sheet.querySelector<HTMLInputElement>('#av-name');
  const buttons = (): HTMLButtonElement[] => Array.from(sheet.querySelectorAll<HTMLButtonElement>('.av-sw'));
  const isLocked = (b: HTMLElement): boolean => b.getAttribute('aria-disabled') === 'true';

  const pick = (btn: HTMLButtonElement): void => {
    if (isLocked(btn)) return;
    const id = btn.dataset.helmet ?? 'white';
    buttons().forEach((b) => {
      const on = b === btn;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (big) big.innerHTML = avatarSvg(id, total);
    onChange({ helmet: id });
  };

  grid?.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.av-sw');
    if (!b) return;
    if (isLocked(b)) {
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
      return;
    }
    pick(b);
  });

  grid?.addEventListener('keydown', (e) => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const open = buttons().filter((b) => !isLocked(b));
    const cur = Math.max(0, open.findIndex((b) => b === document.activeElement));
    let next = cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (cur + 1) % open.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (cur - 1 + open.length) % open.length;
    else if (e.key === 'Home') next = 0;
    else next = open.length - 1;
    e.preventDefault();
    open[next].focus();
    pick(open[next]);
  });

  input?.addEventListener('input', () => onChange({ name: cleanName(input.value) }));
  input?.addEventListener('blur', () => {
    input.value = cleanName(input.value);
  });
}
