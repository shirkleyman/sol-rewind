export type EduKey = 'power' | 'water' | 'shield' | 'rest' | 'repair' | 'plants' | 'rocks' | 'sensor' | 'dust';

export interface Research {
  id: string;
  title: string;
  url: string;
}

export interface Edu {
  title: string;
  kid: string;
  real: string;
  game: string;
  research?: Research[];
}

/**
 * Short, kid-friendly explanations of the systems the astronaut deals with.
 * They are general facts. Check them against NASA pages before the final submission (see DATA_SOURCES.md).
 */
export const EDU: Record<EduKey, Edu> = {
  power: {
    title: 'Power: the base needs energy',
    kid: 'Solar panels turn sunlight into electricity. A battery stores it so the base keeps running when it is dark. Every machine uses some power, so you decide where it goes.',
    real: 'The International Space Station has huge solar arrays and batteries, and engineers write a power budget for every spacecraft.',
    game: 'Charging fills the battery. Water recycling, the shield and some experiments use power.',
  },
  water: {
    title: 'Water: use it again',
    kid: 'People drink, wash and need water every day. In space there is no tap to turn on, so water is cleaned and used again and again.',
    real: 'On the International Space Station, astronauts recycle water, including from moisture in the air, so less has to be launched from Earth.',
    game: 'The crew uses water every day. The recycler makes more, but it needs power.',
  },
  shield: {
    title: 'Radiation: invisible particles',
    kid: 'Sometimes the Sun throws out bursts of fast particles called solar storms. On Earth the air and our magnetic field protect us. On the Moon and Mars, a base needs its own shield. You cannot see radiation, but it adds up.',
    real: 'NASA tracks solar storms and records them in a database called DONKI. Crews plan missions around space weather and use shelters.',
    game: 'A good shield run lowers the radiation the crew gets, most of all on storm days. Radiation never goes back down.',
  },
  rest: {
    title: 'Rest: astronauts are people too',
    kid: 'Sleep, food and exercise keep astronauts healthy and thinking clearly. A tired crew makes mistakes.',
    real: "NASA's Human Research Program studies how space travel affects astronaut health and performance.",
    game: 'Resting gives energy back, so you can do more tasks in a day.',
    research: [
      { id: 'OSD-342', title: 'Muscle and bone loss during spaceflight (mice on the International Space Station)', url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-342' },
      { id: 'OSD-417', title: 'Bone loss during spaceflight (mice on the International Space Station)', url: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-417' },
    ],
  },
  repair: {
    title: 'Repairs: fixing things far from home',
    kid: 'Machines break, and the nearest repair shop is very far away. Crews carry spare parts and practice fixing things before they fly.',
    real: 'Spacecraft and bases are designed so parts can be replaced, and astronauts train for repairs.',
    game: 'A broken station cannot be used until you fix it at the repair bay.',
  },
  plants: {
    title: 'Plants: growing food',
    kid: 'Fresh food helps astronauts stay healthy, and plants freshen the air. Growing them in space is tricky.',
    real: 'Astronauts have grown lettuce and other plants on the International Space Station.',
    game: 'Growing plants uses water and energy, and gives science points. Fresh food also gives the astronaut a little energy back.',
  },
  rocks: {
    title: 'Rocks: reading planet history',
    kid: 'Rocks tell stories about how a planet formed. Scanners can read what a rock is made of without carrying it home.',
    real: "Rovers on Mars carry instruments that study rocks to learn about the planet's past.",
    game: 'Copy the scan pattern correctly to get good data.',
  },
  sensor: {
    title: 'Dust sensor: dust is sneaky',
    kid: 'Dust sticks to machines and can block sunlight from solar panels. Sensors help crews know when to clean or wait.',
    real: 'Dust storms on Mars can reduce the sunlight that reaches solar panels.',
    game: 'Fast, careful taps give more science.',
  },
  dust: {
    title: 'Dust storms on Mars',
    kid: 'Mars has dust storms. The dust floats in the air and hides the Sun, so solar panels make less power.',
    real: 'Dust storms on Mars can block much of the sunlight that solar-powered missions rely on.',
    game: 'On dust days, solar charging gives half as much power.',
  },
};
