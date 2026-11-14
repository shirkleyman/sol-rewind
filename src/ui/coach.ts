import { dayDelta, stormFor } from '../core/rules';
import type { Evaluation, LevelConfig, SimState, SkillId } from '../core/types';

export interface Tip {
  key: string;
  skill: SkillId;
  text: string;
}

/**
 * Short, friendly hints that connect what just happened to a real skill.
 * Each tip appears once per mission, and only when it is useful.
 */
export function pickTip(level: LevelConfig, ev: Evaluation, live: SimState, day: number, seen: Set<string>): Tip | null {
  const cands: (Tip | null)[] = [];
  const last = ev.S.h.length;
  if (last >= 1) {
    const d = dayDelta(level, ev.S, last);
    if (d.g >= 18 && level.stations.includes('shield')) {
      cands.push({ key: 'storm-hit', skill: 'radiation', text: 'A storm hit while the crew was not well shielded. Radiation only adds up, so shield before the storm, not after.' });
    }
    if (d.v === 'bad') {
      cands.push({ key: 'rough-day', skill: 'systems', text: `Day ${last} was rough. Tap it in the day strip to see what changed, and replay it if you like.` });
    }
    if (d.v === 'good' && last >= 2) {
      cands.push({ key: 'good-day', skill: 'systems', text: `Nice. Day ${last} went well. Look at the graph: what did you do differently?` });
    }
  }
  if (live.p < 25) cands.push({ key: 'low-power', skill: 'power', text: 'Power is low. Charge the battery before big tasks, or the base cannot run.' });
  if (live.w < 18) cands.push({ key: 'low-water', skill: 'life', text: 'Water is running low. The crew uses water every day, so run the recycler.' });
  if (live.e < 30 && level.stations.includes('rest')) cands.push({ key: 'tired', skill: 'crew', text: 'The astronaut is getting tired. A rest pod now means more energy for later tasks.' });
  if (live.dust) cands.push({ key: 'dust', skill: 'adapt', text: 'A dust storm hides the sun, so solar charging gives half as much today. Adjust your plan.' });
  if (live.broken) cands.push({ key: 'broken', skill: 'adapt', text: 'A station broke. Fix it at the repair bay first, then use it.' });
  if (level.world === 'mars' && day === 1 && ev.S.h.length === 0) cands.push({ key: 'delay', skill: 'adapt', text: 'Messages between Mars and Earth take minutes each way (about 3 to 22 minutes). Mission control cannot answer in time, so the crew has to decide for itself.' });
  const storm = stormFor(level, day);
  if (storm && level.stations.includes('shield')) cands.push({ key: `storm-${day}`, skill: 'radiation', text: `A real solar storm is coming today (${storm.label}). The shield mini game decides how much protection you get.` });
  for (const c of cands) if (c && !seen.has(c.key)) return c;
  return null;
}
