import './styles.css';
import { LEVELS } from './core/levels';
import { withKit } from './core/kit';
import { loadSave, resetSave, writeSave } from './core/storage';
import type { SaveData } from './core/storage';
import { skillProgress } from './core/skills';
import { STOPS } from './core/stops';
import type { Stop } from './core/stops';
import { LevelView, SKILL_ICON } from './ui/level';
import { animateMap, currentLevel, isUnlocked, mapSvg, scrollMapToProgress } from './ui/map';
import { icon } from './ui/icons';
import { showCredits } from './ui/credits';
import { playLaunch } from './ui/cutscene';
import { music } from './ui/music';
import { FEATURES } from './ui/planets';
import { showPrep } from './ui/prep';
import { setSoundEnabled, sfx } from './ui/sound';
import { bindNameForm, certificateHtml, nameFormHtml, printCertificate } from './ui/certificate';
import { setVoice, voiceSupported } from './ui/voice';
import { activeHelmet, totalStars as avatarTotal } from './core/avatar';
import { heroHtml } from './ui/hero';
import { showHowTo } from './ui/howto';
import logoMark from './assets/logo-mark.svg?raw';
import { avatarSvg, bindAvatarSheet, openAvatarSheetHtml } from './ui/avatar';
import type { IconName } from './ui/icons';

const root = document.getElementById('app') as HTMLElement;
const params = new URLSearchParams(location.search);
const unlockAll = params.has('unlock');
let save: SaveData = loadSave();
setSoundEnabled(save.sound);
music.setEnabled(save.music);
setVoice(save.voice);
let view: LevelView | null = null;
let currentWorld: 'moon' | 'mars' = 'moon';
let gesture = false;

function playMusic(): void {
  if (gesture) music.play(currentWorld);
}

document.addEventListener('pointerdown', () => {
  gesture = true;
  playMusic();
}, { once: true });
document.addEventListener('keydown', () => {
  gesture = true;
  playMusic();
}, { once: true });

function toggleMusic(): boolean {
  save.music = !save.music;
  music.setEnabled(save.music);
  writeSave(save);
  if (save.music) playMusic();
  return save.music;
}

function skillsHtml(): string {
  const rows = skillProgress(save.stars)
    .map((p) => {
      const pct = p.max ? Math.round((p.earned / p.max) * 100) : 0;
      return `<li><div class="row"><span>${icon(SKILL_ICON[p.skill.id])} <b>${p.skill.name}</b></span><span class="chip">${p.tier}</span></div><div class="bar"><div style="background:var(--acc,#1aa58a);width:${pct}%"></div></div><div class="note">${p.skill.blurb}</div><div class="note">Real world: ${p.skill.real} Trained in levels ${p.levels.join(', ')}.</div></li>`;
    })
    .join('');
  return `<div class="ov"><div class="box wide"><h2>Your skills</h2><div class="note">Every mission builds real skills. The stars you earn add up here.</div><ul class="skill-list">${rows}</ul><button class="btn primary" id="skills-close">Close</button></div></div>`;
}

function stopHtml(s: Stop): string {
  const done = save.stops.includes(s.id);
  const opts = s.options.map((o, i) => `<button class="btn quizopt" data-opt="${i}">${o}</button>`).join('');
  return `<div class="ov"><div class="box wide">${heroHtml('trip', { size: 'sm' })}<div class="note">Learning stop · ${s.route === 'earth-moon' ? 'Earth to the Moon' : 'The Moon to Mars'}</div><h2>${s.title}</h2><p>${s.kid}</p><div class="factcard">${icon('bulb')}<div><b>In real life.</b> ${s.real}</div></div><div class="quiz"><div class="quizq">Quick question: ${s.question}</div><div class="quizopts">${opts}</div><div class="quizres" aria-live="polite">${done ? `You already know this one. ${s.explain}` : ''}</div></div><button class="btn primary" id="stop-close" style="margin-top:10px">Close</button></div></div>`;
}

function featureHtml(id: string): string {
  const f = FEATURES.find((x) => x.id === id);
  if (!f) return '';
  const kind = f.kind === 'basin' ? 'Basin' : f.kind === 'volcano' ? 'Volcano' : f.kind === 'plain' ? 'Dark plain' : 'Crater';
  return `<div class="ov"><div class="box">${heroHtml(f.body === 'moon' ? 'moon' : 'mars', { size: 'sm', ic: 'planet' })}<div class="note">${f.body === 'moon' ? 'On the Moon' : 'On Mars'} · ${kind}</div><h2>${f.name}</h2><p>${f.fact}</p><div class="note">Place on the map is real (latitude ${f.lat}°, longitude ${f.lon}°). Sizes are drawn bigger than they are, so they are easy to see.</div><button class="btn primary" id="feat-close" style="margin-top:10px">Close</button></div></div>`;
}

function showMap(focus: number | null = null, keepScroll = false): void {
  const y = window.scrollY;
  currentWorld = 'moon';
  playMusic();
  view?.destroy();
  view = null;
  const total = save.stars.slice(0, LEVELS.length + 1).reduce((a, b) => a + b, 0);
  root.innerHTML = `<div class="frame mapscreen"><div class="map-bar" role="toolbar" aria-label="Menu"><button class="mb-brand" id="brand" aria-label="Sol Rewind. Tap to see how to play"><span class="mb-logo" aria-hidden="true">${logoMark}</span><div class="mb-title"><span class="title">Sol <b>Rewind</b></span><span class="note mb-tag">Every day counts. Even the ones you undo.</span></div></button><div class="mb-right"><span class="chip" aria-label="Stars ${total} of ${(LEVELS.length + 1) * 3}">★ ${total} / ${(LEVELS.length + 1) * 3}</span><button class="btn small" id="skills" aria-label="Skills">${icon('bulb')}<span class="lbl"> Skills</span></button><button class="btn small" id="settings" aria-label="Settings">${icon('settings')}<span class="lbl"> Settings</span></button></div></div><div class="map-wrap">${mapSvg(save.stars, unlockAll, save.stops)}</div></div>`;

  const activate = (el: Element, fn: () => void): void => {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        fn();
      }
    });
  };
  root.querySelectorAll<SVGElement>('.node:not(.locked)').forEach((n) => activate(n, () => (Number(n.dataset.i) === 0 ? openPrep() : startLevel(Number(n.dataset.i)))));
  root.querySelectorAll<SVGElement>('.stop').forEach((n) => activate(n, () => openStop(n.dataset.stop!)));
  root.querySelectorAll<SVGElement>('.feat').forEach((n) => activate(n, () => openOverlay(featureHtml(n.dataset.feat!), '#feat-close')));

  const openCredits = () => {
    sfx.click();
    showCredits(root, { onBack: () => showMap(null, true) });
  };
  const openAvatar = (): void => {
    const ov = openOverlay(`<div class="ov"><div class="box avbox">${openAvatarSheetHtml(save)}<button class="btn primary" data-act="av-close" style="margin-top:10px">Done</button></div></div>`, '[data-act="av-close"]');
    bindAvatarSheet(ov, save, (patch) => {
      if (patch.helmet) save.helmet = patch.helmet;
      if (patch.name !== undefined) save.name = patch.name;
      writeSave(save);
    });
    ov.querySelector('[data-act="av-close"]')?.addEventListener('click', () => openSettings());
  };
  const openCert = (): void => {
    const done = save.stars.slice(1, LEVELS.length + 1).filter((x) => x > 0).length;
    if (done < LEVELS.length) {
      openOverlay(`<div class="ov"><div class="box"><h2>Journey certificate</h2><p>Finish all ${LEVELS.length} missions to get the big certificate. You have finished ${done} of ${LEVELS.length}.</p><p class="note">Every mission also has its own certificate and postcard on its finish card.</p><button class="btn primary" data-act="cert-x" style="margin-top:8px">OK</button></div></div>`, '[data-act="cert-x"]');
      return;
    }
    if (!save.name) {
      const ov = openOverlay(`<div class="ov"><div class="box">${nameFormHtml(save.name)}<button class="btn" data-act="cert-x" style="margin-top:8px">Not now</button></div></div>`, '[data-act="cert-x"]');
      bindNameForm(ov, (n) => {
        save.name = n;
        writeSave(save);
        openCert();
      });
      return;
    }
    const html = certificateHtml({ name: save.name, kind: 'full', stars: 0, totalStars: avatarTotal(save.stars), maxStars: 36, date: new Date() });
    const ov = openOverlay(`<div class="ov"><div class="box">${html}<div class="row" style="justify-content:center;margin-top:10px"><button class="btn primary" data-act="cert-print">Print</button><button class="btn" data-act="cert-x">Close</button></div></div></div>`, '[data-act="cert-x"]');
    ov.querySelector('[data-act="cert-print"]')?.addEventListener('click', () => printCertificate(ov.querySelector('.cert')!.outerHTML));
  };
  const openSettings = (): void => {
    const total = avatarTotal(save.stars);
    const hel = activeHelmet(save.helmet, total);
    const sw = (id: string, label: string, ic: IconName, on: boolean): string =>
      `<div class="st-row"><span class="st-ic">${icon(ic)}</span><span class="st-lb">${label}</span><button class="switch ${on ? 'on' : ''}" id="${id}" role="switch" aria-checked="${on}" aria-label="${label}"><i></i></button></div>`;
    const go = (id: string, label: string, sub: string, lead: string): string =>
      `<button class="st-row st-btn" id="${id}"><span class="st-ic">${lead}</span><span class="st-lb">${label}<small>${sub}</small></span><span class="st-go">${icon('chevronRight')}</span></button>`;
    const ov = openOverlay(`<div class="ov"><div class="box set-box">${heroHtml('brief', { size: 'sm', ic: 'settings' })}<h2>Settings</h2>
      <div class="st-group">${go('set-how', 'How to play', 'You can rewind a day, but radiation stays', icon('history'))}${go('set-av', 'Your astronaut', save.name ? `${save.name}. Helmet and badges` : 'Helmet, name and badges', `<span class="st-av">${avatarSvg(hel.id, total)}</span>`)}${go('set-cert', 'Certificate', 'Print your certificate', icon('trophy'))}${go('set-src', 'Sources and credits', 'Where the real NASA data comes from', icon('infoCircle'))}</div>
      <div class="st-group">${sw('set-mus', 'Music', save.music ? 'music' : 'musicOff', save.music)}${sw('set-snd', 'Sound effects', save.sound ? 'volume' : 'volumeOff', save.sound)}${voiceSupported() ? sw('set-vox', 'Read aloud', 'speakerphone', save.voice) : ''}</div>
      <div class="st-how"><b>How the stars work</b><ul><li>${icon('star')} 1 star: finish the mission.</li><li>${icon('star')}${icon('star')} 2 stars: reach the science goal.</li><li>${icon('star')}${icon('star')}${icon('star')} 3 stars: also keep radiation low.</li></ul><p>Tap the small i circles to learn on the way, and tap craters to meet them.</p></div>
      <div class="note st-data">${icon('database')} Solar storms come from real NASA DONKI events and radiation from NASA RadLab. Progress is saved only in this browser.</div>
      <div class="row" style="justify-content:space-between;margin-top:10px"><button class="btn danger" id="set-reset">Reset progress</button><button class="btn primary" id="set-close">Done</button></div></div></div>`, '#set-close');
    const flip = (id: string, on: boolean): void => {
      const b = ov.querySelector<HTMLElement>(id);
      b?.classList.toggle('on', on);
      b?.setAttribute('aria-checked', String(on));
    };
    ov.querySelector<HTMLElement>('#set-how')!.onclick = () => showHowTo(root, { onDone: () => showMap(null, true) });
    ov.querySelector<HTMLElement>('#set-av')!.onclick = openAvatar;
    ov.querySelector<HTMLElement>('#set-cert')!.onclick = openCert;
    ov.querySelector<HTMLElement>('#set-src')!.onclick = openCredits;
    ov.querySelector<HTMLElement>('#set-mus')!.onclick = () => flip('#set-mus', toggleMusic());
    ov.querySelector<HTMLElement>('#set-snd')!.onclick = () => {
      save.sound = !save.sound;
      setSoundEnabled(save.sound);
      writeSave(save);
      flip('#set-snd', save.sound);
    };
    const vox = ov.querySelector<HTMLElement>('#set-vox');
    if (vox) {
      vox.onclick = () => {
        save.voice = !save.voice;
        setVoice(save.voice);
        writeSave(save);
        flip('#set-vox', save.voice);
      };
    }
    ov.querySelector<HTMLElement>('#set-reset')!.onclick = () => {
      if (confirm('Reset all progress on this device?')) {
        save = resetSave();
        showMap();
      }
    };
  };
  root.querySelector<HTMLButtonElement>('#settings')!.onclick = openSettings;
  root.querySelector<HTMLButtonElement>('#brand')!.onclick = () => {
    sfx.click();
    showHowTo(root, { onDone: () => showMap(null, true) });
  };
  root.querySelector<HTMLButtonElement>('#skills')!.onclick = () => openOverlay(skillsHtml(), '#skills-close');
  const cur = currentLevel(save.stars, unlockAll);
  const fresh = !unlockAll && save.stars.every((s) => s === 0);
  animateMap(root, focus ?? cur);
  if (keepScroll) window.scrollTo(0, y);
  else scrollMapToProgress(root, focus ?? cur, fresh);
}

/** Shows a card above the map. It is added to the frame so it sits on top of the current screen. */
function openOverlay(html: string, closeSel: string): HTMLElement {
  sfx.click();
  const frame = root.querySelector<HTMLElement>('.frame')!;
  frame.querySelector(':scope > .ov')?.remove();
  frame.insertAdjacentHTML('beforeend', html);
  const ov = frame.querySelector<HTMLElement>(':scope > .ov')!;
  ov.querySelector<HTMLButtonElement>(closeSel)!.onclick = () => ov.remove();
  ov.style.position = 'fixed';
  ov.style.zIndex = '30';
  return ov;
}

function openStop(id: string): void {
  const s = STOPS.find((x) => x.id === id);
  if (!s) return;
  const ov = openOverlay(stopHtml(s), '#stop-close');
  const res = ov.querySelector<HTMLElement>('.quizres')!;
  ov.querySelectorAll<HTMLButtonElement>('.quizopt').forEach((b) => {
    b.onclick = () => {
      const i = Number(b.dataset.opt);
      if (i === s.answer) {
        sfx.good();
        res.innerHTML = `<b class="ok">Correct!</b> ${s.explain}`;
        b.classList.add('right');
        if (!save.stops.includes(s.id)) {
          save.stops.push(s.id);
          writeSave(save);
        }
      } else {
        sfx.bad();
        res.innerHTML = `<b class="no">Not quite.</b> Try again.`;
        b.classList.add('wrong');
      }
    };
  });
  ov.querySelector<HTMLButtonElement>('#stop-close')!.addEventListener('click', () => showMap(null, true));
}

function openPrep(): void {
  sfx.click();
  currentWorld = 'moon';
  playMusic();
  showPrep(root, {
    kit: save.kit,
    onBack: () => showMap(0),
    onSkip: () => {
      if (save.stars[0] === 0) save.stars[0] = 1;
      writeSave(save);
      showMap(1);
    },
    onLaunch: (kit, stars) => {
      save.kit = kit;
      save.stars[0] = Math.max(save.stars[0], stars, 1);
      writeSave(save);
      playLaunch(root, { onDone: () => showMap(1) });
    },
  });
  window.scrollTo(0, 0);
}

function startLevel(id: number): void {
  if (!isUnlocked(save.stars, id, unlockAll)) return;
  sfx.click();
  const level = withKit(LEVELS.find((l) => l.id === id)!, save.kit);
  currentWorld = level.world;
  playMusic();
  view?.destroy();
  view = new LevelView(root, level, {
    onExit: () => showMap(id),
    onFinish: (stars, sci, dose) => {
      if (stars > save.stars[id]) save.stars[id] = stars;
      const best = save.best[id];
      if (!best || sci > best.sci) save.best[id] = { sci: Math.round(sci), dose: Math.round(dose) };
      writeSave(save);
    },
    onNext: id < LEVELS.length ? () => startLevel(id + 1) : null,
    onToggleSound: () => {
      save.sound = !save.sound;
      setSoundEnabled(save.sound);
      writeSave(save);
      return save.sound;
    },
    onToggleMusic: toggleMusic,
    onToggleVoice: () => {
      save.voice = !save.voice;
      setVoice(save.voice);
      writeSave(save);
      return save.voice;
    },
    voiceOn: save.voice,
    getName: () => save.name,
    setName: (n) => {
      save.name = n;
      writeSave(save);
    },
    getTotalStars: () => avatarTotal(save.stars),
    addRocks: (n) => {
      save.rocks += n;
      writeSave(save);
    },
    helmet: activeHelmet(save.helmet, avatarTotal(save.stars)).color,
    musicOn: save.music,
    getStars: () => save.stars,
    soundOn: save.sound,
  });
  view.mount();
  window.scrollTo(0, 0);
}

if (!save.briefed && !unlockAll && save.stars.every((x) => x === 0)) {
  showHowTo(root, {
    onDone: () => {
      save.briefed = true;
      writeSave(save);
      showMap();
    },
  });
} else {
  showMap();
}
