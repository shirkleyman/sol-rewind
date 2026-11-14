import { DATA_DOWNLOADED } from '../core/levels';
import { SITES } from '../core/sites';
import { EDU } from '../core/edu';
import { ROVERS } from '../core/rovers';
import { icon } from './icons';
import { sfx } from './sound';

const a = (href: string, text: string): string => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

const downloaded = (): string => new Date(DATA_DOWNLOADED).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const GLOSSARY: [string, string][] = [
  ['Sol', 'A day on Mars. It is a little longer than a day on Earth.'],
  ['Solar storm', 'A burst of fast particles from the Sun. NASA records them in a database called DONKI.'],
  ['Coronal mass ejection (CME)', 'A huge cloud of particles thrown out by the Sun. Some are fast and strong, and they can cause solar storms.'],
  ['Radiation dose', 'How much radiation a body has absorbed. In this game it adds up and never goes down.'],
  ['Microgravity', 'The floating feeling in orbit, where gravity seems very weak.'],
  ['Lander and rover', 'A lander stays where it touches down. A rover drives around to explore.'],
  ['Crater', 'A bowl-shaped hole made when something hits a planet or a moon.'],
];

function section(title: string, body: string): string {
  return `<section class="card cred"><h3>${title}</h3>${body}</section>`;
}

export function creditsHtml(): string {
  const photos = SITES.map(
    (s) => `<li><b>Level ${s.level}: ${s.name}</b>, ${s.place}. ${a(s.photo.page, `NASA image ${s.photo.nasaId}`)}. Credit: ${s.photo.credit}. <span class="note">Coordinates: ${s.coords.text} (${s.coords.source}).</span></li>`,
  ).join('');
  const research = (EDU.rest.research ?? []).map((r) => `<li>${a(r.url, r.id)}: ${r.title}</li>`).join('');
  const words = GLOSSARY.map(([w, d]) => `<li><b>${w}.</b> ${d}</li>`).join('');

  return `<div class="frame credits">
    <div class="row"><button class="btn small" id="cred-back">${icon('arrowLeft')} Back to the map</button><span class="title" style="font-size:18px">Sources and credits</span></div>
    ${section('Where the facts come from', `<p>${icon('database')} <b>Solar storms come from real NASA DONKI events and radiation from NASA RadLab. Progress is saved only in this browser.</b></p><p class="note">The game uses a saved copy of the data, downloaded on ${downloaded()}. It does not call NASA while you play. Costs, rewards and the size of each storm effect are game numbers, not NASA measurements.</p>`)}
    ${section('NASA data', `<ul class="srclist">
      <li><b>Space weather (solar storms):</b> NASA DONKI, ${a('https://ccmc.gsfc.nasa.gov/tools/DONKI/', 'ccmc.gsfc.nasa.gov/tools/DONKI')}, through the NASA Open APIs, ${a('https://api.nasa.gov/', 'api.nasa.gov')}. Used for the real storm on each storm day and its strength (coronal mass ejection speed).</li>
      <li><b>Radiation measured in space:</b> NASA Open Science Data Repository RadLab, ${a('https://visualization.osdr.nasa.gov/radlab/gui/data-api/', 'RadLab data API')}. Dose rates measured during the May 2024 storm near the International Space Station, in lunar orbit and on the surface of Mars.</li>
      <li><b>Research on astronaut health:</b> NASA Open Science Data Repository, ${a('https://osdr.nasa.gov/bio/repo/', 'osdr.nasa.gov')}. Examples shown in the game:<ul>${research}</ul></li>
      <li><b>Photos:</b> NASA Image and Video Library, ${a('https://images.nasa.gov/', 'images.nasa.gov')}. See the list below.</li>
      <li><b>Landing site positions:</b> NASA NSSDCA, ${a('https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html', 'Apollo landing site coordinates')} and the NSSDCA pages of each Mars mission (listed with each photo).</li>
    </ul>`)}
    ${section('Real photos of every place', `<ul class="srclist">${photos}</ul><p class="note">NASA images are generally free to use with credit. ${a('https://www.nasa.gov/nasa-brand-center/images-and-media/', 'NASA image and media usage guidelines')}.</p>`)}
    ${section('Your rover friends', `<ul class="srclist">${ROVERS.map((r) => `<li><b>${r.nickname}</b> (${r.name}). Photo: ${a(r.photo.page, `NASA image ${r.photo.nasaId}`)}, credit ${r.photo.credit}. Sources: ${r.sources.map((x) => a(x.url, x.label)).join(', ')}.</li>`).join('')}</ul><p class="note">The rover drawings are simple cartoons made for the game. The facts come from the NASA pages above.</p>`)}
    ${section('Maps of Earth, the Moon and Mars', `<ul class="srclist"><li>Earth coastlines: ${a('https://www.naturalearthdata.com/', 'Natural Earth')} (public domain), through the ${a('https://github.com/topojson/world-atlas', 'world-atlas')} package.</li><li>Moon and Mars craters, maria and landing places are drawn at their real latitude and longitude. Their sizes are not to scale.</li></ul>`)}
    ${section('Words to know', `<ul class="srclist">${words}</ul>`)}
    ${section('Tools and sounds', `<ul class="srclist">
      <li>Icons: ${a('https://tabler.io/icons', 'Tabler Icons')} (MIT license).</li>
      <li>Animation: ${a('https://gsap.com/', 'GSAP')} (${a('https://gsap.com/standard-license/', 'standard license')}). Built with ${a('https://vite.dev/', 'Vite')} (MIT license).</li>
      <li>Music and sound effects are made live in your browser with the Web Audio API. The music is an original composition, so there are no audio files and nothing was copied.</li>
    </ul>`)}
    ${section('About this project', `<p>Sol Rewind is a project for the ${a('https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/', 'NASA Space Apps Challenge 2026: Build a Junior Astronaut Mission Trainer')}. It is an independent project. It uses NASA data and images, but NASA does not endorse it.</p><p class="note">Privacy: there are no accounts and no tracking. Your progress and settings stay in this browser only. Use <i>Reset progress</i> on the map to clear them.</p>`)}
    <div class="row" style="margin-top:8px"><button class="btn small" id="cred-back2">${icon('arrowLeft')} Back to the map</button></div>
  </div>`;
}

export function showCredits(root: HTMLElement, opts: { onBack: () => void }): void {
  root.innerHTML = creditsHtml();
  const back = (): void => {
    sfx.click();
    opts.onBack();
  };
  root.querySelector<HTMLButtonElement>('#cred-back')!.onclick = back;
  root.querySelector<HTMLButtonElement>('#cred-back2')!.onclick = back;
  window.scrollTo(0, 0);
}
