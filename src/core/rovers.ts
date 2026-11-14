export type RoverId = 'buggy' | 'curio';
export type RoverSkill = 'power' | 'life' | 'radiation' | 'systems' | 'crew' | 'adapt';
export type LineKey = 'welcome' | 'storm' | 'lowPower' | 'lowWater' | 'tired' | 'broken' | 'dust' | 'goodDay' | 'roughDay' | 'win';

export interface Fact {
  title: string;
  text: string;
  /** Which idea of the game this fact connects to. */
  skill?: RoverSkill;
  link?: string;
}

export interface Rover {
  id: RoverId;
  world: 'moon' | 'mars';
  name: string;
  nickname: string;
  tagline: string;
  photo: { file: string; nasaId: string; title: string; credit: string; page: string };
  facts: Fact[];
  sources: { label: string; url: string }[];
  lines: Record<LineKey, string>;
}

/**
 * Real rovers that keep the astronaut company: the Apollo Lunar Roving Vehicle on the Moon and Curiosity on Mars.
 * Facts are written from NASA material (see `sources`). Check them against those pages before the final submission.
 */
export const ROVERS: Rover[] = [
  {
    id: 'buggy',
    world: 'moon',
    name: 'Lunar Roving Vehicle',
    nickname: 'Buggy',
    tagline: 'The Moon buggy that real astronauts drove on Apollo 15, 16 and 17.',
    photo: {
      file: 'buggy.jpg',
      nasaId: 'as15-86-11603',
      title: 'Astronaut James Irwin works at Lunar Roving Vehicle during Apollo 15 EVA',
      credit: 'NASA',
      page: 'https://images.nasa.gov/details/as15-86-11603',
    },
    facts: [
      { title: 'Three of us, still on the Moon', text: 'Three Moon buggies were driven on the Moon, on Apollo 15, 16 and 17 in 1971 and 1972. All three are still there.' },
      { title: 'Two batteries', text: 'I run on two 36-volt batteries. Either one could power everything if the other failed, and neither could be recharged.', skill: 'power' },
      { title: 'Wheels made of wire', text: 'My wheels are woven wire mesh with titanium treads, and every wheel has its own electric motor.', skill: 'adapt' },
      { title: 'Folded up for the trip', text: 'I weigh about 210 kilograms on Earth. I folded up to fit inside the lunar module, then unfolded on the Moon.', skill: 'systems' },
      { title: 'Room for two', text: 'I carried two astronauts and their tools, so they could go much farther than they could walk.', skill: 'crew' },
      { title: 'How fast?', text: 'I was designed for about 13 kilometers per hour. On Apollo 17, Gene Cernan reached about 18, an unofficial Moon speed record.' },
      { title: 'The duct tape fix', text: 'On Apollo 17 a fender extension broke. The crew made a new one from four stiff Moon maps and duct tape, clamped it on, and it held for the rest of the mission. Fenders keep Moon dust from flying up.', skill: 'adapt' },
      { title: 'How far we drove', text: 'The three of us drove about 28 kilometers (Apollo 15), 27 (Apollo 16) and 36 (Apollo 17).', skill: 'systems' },
    ],
    sources: [
      { label: 'NASA Apollo Lunar Surface Journal', url: 'https://www.nasa.gov/history/alsj/' },
      { label: 'Apollo 17: the new fender (NASA)', url: 'https://www.nasa.gov/history/alsj/a17/A17NewFender.html' },
      { label: 'NASA Science: Moondust and Duct Tape (2008, web archive)', url: 'https://webarchive.library.unt.edu/eot2008/20090511175459/http://science.nasa.gov/headlines/y2008/21apr_ducttape.htm' },
      { label: 'Smithsonian Air and Space: Duct Tape Auto Repair on the Moon', url: 'https://airandspace.si.edu/stories/editorial/duct-tape-auto-repair-moon' },
    ],
    lines: {
      welcome: "Hi, I'm Buggy, a real rover that drove on the Moon! Let's explore.",
      storm: 'A solar storm! The Moon has no air to protect us, so use the shield.',
      lowPower: 'My batteries could not be recharged, but your base can. Charge up!',
      lowWater: 'Water is running low. Recycle it before the crew gets thirsty.',
      tired: 'Your astronaut looks tired. Even Moon drivers need a rest.',
      broken: 'Something broke! On Apollo 17 the crew fixed my fender with duct tape and maps. Use the repair bay!',
      dust: 'Moon dust gets everywhere. My fenders keep it off the astronauts.',
      goodDay: 'Great day! That was smooth driving.',
      roughDay: 'Rough day. Tap it in the timeline and try again.',
      win: 'Mission complete! We went far, just like on Apollo.',
    },
  },
  {
    id: 'curio',
    world: 'mars',
    name: 'Curiosity rover',
    nickname: 'Curio',
    tagline: "NASA's Curiosity rover, exploring Gale Crater on Mars since 2012.",
    photo: {
      file: 'curio.jpg',
      nasaId: 'PIA19142',
      title: 'Curiosity Self-Portrait at Mojave Site on Mount Sharp',
      credit: 'NASA/JPL-Caltech/MSSS',
      page: 'https://images.nasa.gov/details/PIA19142',
    },
    facts: [
      { title: 'Touchdown on Mars', text: 'I landed in Gale Crater on 6 August 2012 (5 August in California).' },
      { title: 'Small car size', text: 'I am about the size of a small car and weigh about 900 kilograms. I roll on six wheels.', skill: 'systems' },
      { title: 'A nuclear battery', text: 'My power comes from a nuclear battery that turns heat from radioactive material into electricity, about 100 watts. It does not need sunlight.', skill: 'power' },
      { title: 'My big question', text: 'My main job is to find out if Gale Crater could have supported tiny life long ago.' },
      { title: 'A huge crater', text: 'Gale Crater is about as big as Connecticut and Rhode Island put together.' },
      { title: 'A mountain made with water', text: 'Mount Sharp, the layered mountain inside Gale, has minerals that form in water.' },
      { title: 'Mars selfies', text: 'I take selfies by stitching many pictures from a camera on my arm.' },
      { title: 'I measure radiation', text: 'I carry a radiation detector called RAD. The Mars radiation numbers in the Look outside window come from it.', skill: 'radiation' },
    ],
    sources: [
      { label: 'NASA Curiosity poster', url: 'https://mars.nasa.gov/files/mep/CuriosityPoster-small.pdf' },
      { label: 'NASA MMRTG fact sheet', url: 'https://science.nasa.gov/wp-content/uploads/2024/02/mmrtg-factsheet-updated-5-18-20-1.pdf' },
      { label: 'NASA MSL fact sheet', url: 'https://solarsystem.nasa.gov/docs/MSL%20Fact%20Sheet%20REV-141119.pdf' },
    ],
    lines: {
      welcome: "Hi, I'm Curio, a real rover on Mars! I explore Gale Crater.",
      storm: 'Solar storm warning! Mars has little protection, so shield the crew.',
      lowPower: 'I run on a nuclear battery, but your base needs sunlight. Charge the battery!',
      lowWater: 'Water is running low. Recycle every drop.',
      tired: 'Your astronaut is tired. A short rest helps.',
      broken: "Something broke. There is no repair shop on Mars, so use the repair bay.",
      dust: "Dust storm! Sunlight is blocked. My nuclear battery doesn't need the Sun, but your solar panels do.",
      goodDay: 'Nice day! The science points are rolling in.',
      roughDay: 'A tough day. Look at the timeline and try again.',
      win: 'Mission complete! Another Mars mission done.',
    },
  },
];

export const roverFor = (world: 'moon' | 'mars'): Rover => ROVERS.find((r) => r.world === world)!;

export const roverById = (id: RoverId): Rover => ROVERS.find((r) => r.id === id)!;
