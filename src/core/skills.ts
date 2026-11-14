import { LEVELS } from './levels';
import type { SkillId } from './types';

export interface SkillDef {
  id: SkillId;
  name: string;
  blurb: string;
  real: string;
}

/** The skills the game builds. They follow what the challenge asks kids to understand: power, life support, radiation and compounding trade-offs. */
export const SKILLS: SkillDef[] = [
  { id: 'power', name: 'Power budgeting', blurb: 'Split limited power between the battery, life support and science.', real: 'Every spacecraft has a power budget.' },
  { id: 'life', name: 'Life support', blurb: 'Keep water flowing. The crew uses some every day, so it must be recycled.', real: 'The International Space Station recycles most of its water.' },
  { id: 'radiation', name: 'Radiation safety', blurb: 'Spot solar storms and shield the crew. Dose adds up and never goes back.', real: 'NASA tracks solar storms in the DONKI database.' },
  { id: 'systems', name: 'Systems thinking', blurb: 'Read the graph. A choice today changes tomorrow, so plan ahead.', real: 'Planners test what-if plans before a mission flies.' },
  { id: 'crew', name: 'Crew care', blurb: 'Astronauts get tired. Rest is part of the mission plan.', real: 'NASA studies astronaut health and performance.' },
  { id: 'adapt', name: 'Adapting to change', blurb: 'Weather changes and things break. Fix problems and adjust the plan.', real: 'Mars rovers and crews must cope far from help.' },
];

export const skillById = (id: SkillId): SkillDef => SKILLS.find((s) => s.id === id)!;

export interface SkillProgress {
  skill: SkillDef;
  earned: number;
  max: number;
  tier: string;
  levels: number[];
}

export function tierName(earned: number, max: number): string {
  if (earned <= 0) return 'Not started';
  const f = earned / max;
  return f >= 1 ? 'Expert' : f >= 0.5 ? 'Specialist' : 'Cadet';
}

/** Stars from the levels that train a skill add up to its progress. */
export function skillProgress(stars: number[]): SkillProgress[] {
  return SKILLS.map((skill) => {
    const lv = LEVELS.filter((l) => l.skills.includes(skill.id));
    const earned = lv.reduce((a, l) => a + (stars[l.id] ?? 0), 0);
    const max = lv.length * 3;
    return { skill, earned, max, tier: tierName(earned, max), levels: lv.map((l) => l.id) };
  });
}
