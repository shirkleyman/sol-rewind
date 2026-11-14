import { mulberry32 } from './rng';

export type SurpriseKind = 'meteors' | 'dustpass' | 'control';

export interface SurpriseSource {
  label: string;
  url: string;
}

export interface Surprise {
  kind: SurpriseKind;
  /** Stable id for this exact surprise, handy for "seen" sets. */
  id: string;
  world: 'moon' | 'mars';
  day: number;
  title: string;
  /** Main line shown on the card. */
  text: string;
  /** One short real fact (shown under the main line). */
  fact: string;
  /** How the message reached you (control only). */
  delayText: string;
  source: SurpriseSource | null;
  /** Meteors only: how many rocks fall. */
  rocks: number;
}

export interface SurpriseCtx {
  stormToday: boolean;
  dustToday: boolean;
  brokenToday: boolean;
  days: number;
}

export interface ControlMessage {
  text: string;
  fact: string;
  source: SurpriseSource;
}

/**
 * Radio messages from mission control. Each carries one short real fact and the page it came from.
 * Source status (see surprises report): the 1.3 second figure comes from ESA and IEEE Spectrum pages, the Mars delay range
 * and sol length come from secondary pages. The team should check them against NASA pages before submission.
 */
export const MISSION_CONTROL: Record<'moon' | 'mars', ControlMessage[]> = {
  moon: [
    {
      text: 'Hello from home! Everyone at mission control is cheering for you.',
      fact: 'Radio waves travel at the speed of light, so a message takes only about 1.3 seconds to cross from Earth to the Moon.',
      source: { label: 'ESA: communication beyond low Earth orbit', url: 'https://nebula.esa.int/4000136202' },
    },
    {
      text: 'Hello from home! We can see your base on our screens.',
      fact: 'Apollo astronauts said fresh Moon dust smelled like spent gunpowder. Nobody is sure why.',
      source: { label: 'Space.com: The Moon smells', url: 'https://www.space.com/26932-moon-smell-apollo-lunar-aroma.html' },
    },
    {
      text: 'Hello from home! Great work out there. Keep the power up.',
      fact: 'On most of the Moon, about two weeks of sunlight are followed by about two weeks of darkness.',
      source: { label: 'ScienceBlog: Moon day and night', url: 'https://scienceblog.com/t-mars-sol-moon-two-week-day-night-cycle/' },
    },
    {
      text: 'Hello from home! Drink some water and take a break if you need one.',
      fact: 'The Moon has no air to slow tiny space rocks down, so they can hit the surface very fast.',
      source: { label: 'NASA: Meteoroids at the Moon (NTRS)', url: 'https://ntrs.nasa.gov/api/citations/20210011054/downloads/Kuchner_Meteoroids%20at%20the%20Moon%20Orbital.pdf' },
    },
  ],
  mars: [
    {
      text: 'Hello from home! We hope the dust is not too bad today.',
      fact: 'A radio message needs about 3 to 22 minutes to reach Mars, depending on where the two planets are.',
      source: { label: 'Mars to Earth radio delay', url: 'https://spacedaily.com/t-earth-mars-radio-delay-44-minutes-solar-conjunction/' },
    },
    {
      text: 'Hello from home! You are doing great. Look after each other.',
      fact: 'A day on Mars, called a sol, lasts about 24 hours and 39 minutes. That is a little longer than an Earth day.',
      source: { label: 'Mars sol', url: 'https://en.wikipedia.org/wiki/Mars_sol' },
    },
    {
      text: 'Hello from home! We are proud of the whole crew.',
      fact: 'Whirlwinds called dust devils cleaned dust off the solar panels of the rovers Spirit and Opportunity.',
      source: { label: 'NASA: InSight dust cleanings', url: 'https://www.nasa.gov/missions/insight/for-insight-dust-cleanings-will-yield-new-science/' },
    },
    {
      text: 'Hello from home! Remember, we cannot answer right away, so trust your plan.',
      fact: 'In 2018 a planet-wide dust storm hid the Sun from the rover Opportunity, and it stopped talking to Earth.',
      source: { label: 'Smithsonian: Martian dust storms', url: 'https://airandspace.si.edu/air-and-space-quarterly/spring-2022/attack-martian-dust-storms' },
    },
  ],
};

const DUST_FACTS: ControlMessage[] = MISSION_CONTROL.mars.filter((m) => /dust/i.test(m.fact));

const METEOR_FACTS: Record<'moon' | 'mars', string[]> = {
  moon: [
    'The Moon has no air, so tiny space rocks hit its surface at very high speed.',
    'Every crater you see on the Moon was made by a space rock hitting it.',
  ],
  mars: [
    'Mars has a thin air that burns up small space rocks, but bigger ones still make craters.',
    'Rocks from space have been hitting Mars for billions of years.',
  ],
};

const seedOf = (levelId: number, day: number, variant: number, salt: number): number =>
  (levelId * 7919 + day * 104729 + variant * 1299709 + salt * 15485863) >>> 0;

const rollRaw = (levelId: number, day: number, variant: number): boolean => mulberry32(seedOf(levelId, day, variant, 1))() < 0.42;

/** A hello from home on the first day of the first level on the Moon and on Mars. */
const isHelloDay = (levelId: number, day: number): boolean => day === 1 && (levelId === 1 || levelId === 6);

/**
 * Is there a surprise slot on this day? It depends only on the level, day and variant, never on the simulation.
 * A slot is never next to another slot, so surprises are never on two days in a row.
 */
export function isSurpriseSlot(levelId: number, day: number, variant: number): boolean {
  if (day < 1) return false;
  if (isHelloDay(levelId, day)) return true;
  if (isHelloDay(levelId, day - 1)) return false;
  if (!rollRaw(levelId, day, variant)) return false;
  return !isSurpriseSlot(levelId, day - 1, variant);
}

function pickKind(world: 'moon' | 'mars', r: number): SurpriseKind {
  if (world === 'moon') return r < 0.62 ? 'meteors' : 'control';
  return r < 0.45 ? 'dustpass' : r < 0.77 ? 'control' : 'meteors';
}

/**
 * The surprise for a day, or null. Same inputs always give the same answer.
 * Surprises are for fun and learning only: they never change power, water, energy, science or radiation.
 */
export function surpriseFor(levelId: number, world: 'moon' | 'mars', day: number, variant: number, ctx: SurpriseCtx): Surprise | null {
  if (!isSurpriseSlot(levelId, day, variant)) return null;
  if (ctx.stormToday || ctx.dustToday || ctx.brokenToday) return null;
  const hello = isHelloDay(levelId, day);
  if (!hello && ctx.days > 2 && day >= ctx.days) return null;
  const rnd = mulberry32(seedOf(levelId, day, variant, 2));
  const kind: SurpriseKind = hello ? 'control' : pickKind(world, rnd());
  const id = `${kind}-${levelId}-${day}-${variant}`;
  const base = { kind, id, world, day, delayText: '', source: null as SurpriseSource | null, rocks: 0 };
  if (kind === 'meteors') {
    const facts = METEOR_FACTS[world];
    return { ...base, title: 'Meteor shower!', text: 'Space rocks are falling near the base. Tap the rocks to collect them!', fact: facts[Math.floor(rnd() * facts.length)], rocks: world === 'moon' ? 8 : 6 };
  }
  if (kind === 'dustpass') {
    const m = DUST_FACTS[Math.floor(rnd() * DUST_FACTS.length)] ?? MISSION_CONTROL.mars[2];
    return { ...base, title: 'A dust cloud passes by', text: 'A cloud of Martian dust is drifting past the base. It will not hurt anything today.', fact: m.fact, source: m.source };
  }
  const pool = MISSION_CONTROL[world];
  const m = hello ? pool[0] : pool[Math.floor(rnd() * pool.length)];
  const delayText =
    world === 'moon'
      ? 'This message took about 1.3 seconds to reach you from Earth.'
      : 'This message was sent minutes ago. Mars is far away, so a message takes about 3 to 22 minutes. Mission control cannot hear your answer right away.';
  return { ...base, title: world === 'moon' ? 'Message from Earth' : 'Message from Earth (a few minutes old)', text: m.text, fact: m.fact, delayText, source: m.source };
}
