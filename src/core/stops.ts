/**
 * Learning stops on the way between Earth, the Moon and Mars.
 * Short, kid-friendly facts with one quick question each. Check the facts against NASA pages before the final submission.
 */
export interface Stop {
  id: string;
  route: 'earth-moon' | 'moon-mars';
  title: string;
  kid: string;
  real: string;
  question: string;
  options: string[];
  answer: number;
  explain: string;
}

export const STOPS: Stop[] = [
  {
    id: 'orbit',
    route: 'earth-moon',
    title: 'Low Earth orbit',
    kid: 'The first part of the trip is straight up. About 400 kilometers above the ground, the air is almost gone. This is where the International Space Station circles Earth.',
    real: 'The International Space Station flies about 400 kilometers above Earth.',
    question: 'About how high is the International Space Station?',
    options: ['40 kilometers', '400 kilometers', '4,000 kilometers'],
    answer: 1,
    explain: 'About 400 kilometers. That is like driving from Tel Aviv to Eilat, but straight up.',
  },
  {
    id: 'magnetic',
    route: 'earth-moon',
    title: "Earth's magnetic shield",
    kid: "Earth has an invisible magnetic field. It traps many fast particles from the Sun in huge rings called the Van Allen radiation belts, and it keeps the air from being blown away. Beyond it, the crew has less protection.",
    real: "Earth's magnetic field and atmosphere protect us from much of the radiation from space.",
    question: 'What helps protect Earth from fast particles from the Sun?',
    options: ['Clouds', "Earth's magnetic field", 'The Moon'],
    answer: 1,
    explain: "Earth's magnetic field. The Moon has no global magnetic field like that, which is why bases need shields.",
  },
  {
    id: 'distance',
    route: 'earth-moon',
    title: 'The long road to the Moon',
    kid: 'The Moon is about 384,000 kilometers away. Radio signals travel at the speed of light, so a message takes only about one and a third seconds. The Apollo crews needed about three days to fly there.',
    real: 'The Moon is about 384,000 kilometers from Earth, and a radio signal takes about 1.3 seconds to cross that distance.',
    question: 'About how long does a radio message take to reach the Moon?',
    options: ['1.3 seconds', '13 minutes', '3 days'],
    answer: 0,
    explain: 'About 1.3 seconds. That is almost like a normal phone call, with a tiny delay.',
  },
  {
    id: 'deep',
    route: 'moon-mars',
    title: 'Deep space radiation',
    kid: "Between the Moon and Mars there is no planet's magnetic field nearby to help. Radiation from the Sun and from faraway stars is stronger out here, so spacecraft need shielding and crews need a shelter for solar storms.",
    real: 'Crews traveling to Mars will be exposed to more radiation than people living on Earth, so protection and storm shelters are part of mission planning.',
    question: 'Why is radiation stronger in deep space?',
    options: ["Earth's magnetic field is far away", 'Space is hotter', 'The stars are closer'],
    answer: 0,
    explain: "Because Earth's magnetic field and air are far behind. That is why Sol Rewind makes you plan your shield.",
  },
  {
    id: 'trip',
    route: 'moon-mars',
    title: 'A very long trip',
    kid: 'Mars is much farther than the Moon. The distance changes as the planets move around the Sun. With today\'s rockets, a trip takes around seven months.',
    real: 'A trip to Mars with current rockets takes roughly six to nine months, depending on when you leave.',
    question: 'About how long does a trip to Mars take with today\'s rockets?',
    options: ['3 days', 'About 7 months', '20 years'],
    answer: 1,
    explain: 'About seven months. The crew needs enough power, water, food and rest for the whole trip.',
  },
  {
    id: 'delay',
    route: 'moon-mars',
    title: 'Mission control is far away',
    kid: 'A radio message between Mars and Earth takes between about 3 and 22 minutes each way. Imagine asking a question and waiting up to 44 minutes for the answer. The crew must be able to decide on its own.',
    real: 'The one-way radio delay between Earth and Mars is roughly 3 to 22 minutes, depending on where the planets are.',
    question: 'Can mission control answer an emergency on Mars right away?',
    options: ['Yes, instantly', 'No, messages take minutes', 'Only at night'],
    answer: 1,
    explain: 'No. Messages take minutes, so Mars crews need training, good plans and spare parts.',
  },
];

export const stopById = (id: string): Stop | undefined => STOPS.find((s) => s.id === id);
