/**
 * Gentle help for children who find a mini game hard.
 * After rough runs in a row the same game gets easier, with no penalty. Stars are never taken away.
 */
export const ASSIST_EASE = 0.25;
export const MAX_ASSIST = 2;

/** How many rough runs (1 star) in a row. A good run starts the count again. */
export function nextStreak(streak: number, stars: number): number {
  return stars <= 1 ? streak + 1 : 0;
}

/** Two rough runs in a row give help level 1, four give level 2. Help never goes away within a mission. */
export function assistLevel(streak: number, current: number): number {
  return Math.max(current, Math.min(MAX_ASSIST, Math.floor(streak / 2)));
}

/** The difficulty the game really gets, a little lower for every help level. */
export function easedDifficulty(d: number, level: number): number {
  return Math.max(0, d - ASSIST_EASE * level);
}

/** One short, friendly hint for every mini game. */
export const GAME_TIPS: Record<string, string> = {
  power: 'Watch the sun and press Stop when it is inside the green zone.',
  water: 'Tap Pump fast, and tap a clog to clear it.',
  shield: 'Slide the shield under the purple dots. Let the green ones pass.',
  plants: 'Look carefully at the cards first, then find the pairs.',
  rocks: 'Watch the lights and say the colors in your head. Then repeat them.',
  sensor: 'Tap only when the light turns green. Wait out the amber flash.',
  rest: 'Breathe with the circle and tap each time it pulses.',
  repair: 'Tap each broken part as soon as it appears.',
};
