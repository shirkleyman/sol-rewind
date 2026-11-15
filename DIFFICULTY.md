# Difficulty check (14 November 2026)

Run `npx vite-node tools/difficulty.ts` to repeat it. All difficulty numbers of the mini games are in `src/minigames/params.ts`,
and the level goals and radiation limits are in `src/data/levels.json`.

**Important:** the numbers for how kids play (tap speed, reaction time, memory span) are assumptions, not measurements.
"Average" stands for an 8 to 9 year old, "good" for a confident 11 to 12 year old. Replace them in `tools/difficulty.ts`
with what real kids do when you test the game.

## What the check found, and what was changed

- Several mini games were too harsh for an average kid at higher levels: the water pump target, the particle shield speed,
  the plant card scoring, long rock patterns and the repair timer. Their numbers were softened, and the star thresholds were lowered a little.
- The Moon levels were far too easy (almost 100% of plays got 3 stars). The science goals and radiation limits were raised
  so that stars mean something, while Moon stays a gentle training ground.
- Mars was a cliff: from level 7 an average kid almost never reached 2 stars. It now declines step by step.

## Short levels (14 November 2026, evening)

Every level is now 3 or 4 days so a child can finish one in a few minutes, with an optional "one more day" after the mission (built in the level screen).
Moon 1 to 3 are 3 days, Moon 4 and 5 and all of Mars (6 to 12) are 4 days. Storms and events moved so each lesson shows up early:
a storm on day 3 in level 2, a water failure on day 3 in levels 5 and 8, dust on days 2 and 3 in level 7, a broken shield on day 3 in levels 10 and 11,
and the boss (12) has dust on day 2 and the experiment bench failing on day 3. Science goals and the 3-star radiation limits were rescaled and re-checked with `tools/difficulty.ts`
(run `LEVELS_ONLY=1 npx vite-node tools/difficulty.ts`, add `KIT=1` to see a player who packed a full Earth cargo kit, `DBG=1` to print failed runs).
Because there are fewer days, levels 10 to 12 start with more power (65 to 85 instead of 50) and levels 11 and 12 have costs x1.2 instead of x1.3,
otherwise even a careful player ran out of power on the dust day. Remember that the kid skill numbers are still assumptions.

## Result for a sensible player (percent of plays, 400 plays per cell)

"2+ stars" means the science goal was reached, "3 stars" also means radiation stayed under the limit. Everyone can finish every level.

| Level | Days | Goal | 3-star limit | Average kid, 2+ stars | Average kid, 3 stars | Good kid, 2+ stars | Good kid, 3 stars |
|---|---|---|---|---|---|---|---|
| 1 (Moon) | 3 | 22 | 16 | 98 | 98 | 100 | 100 |
| 2 | 3 | 24 | 15 | 94 | 94 | 99 | 99 |
| 3 | 3 | 33 | 15 | 83 | 83 | 99 | 99 |
| 4 | 4 | 36 | 20 | 91 | 91 | 100 | 99 |
| 5 | 4 | 38 | 20 | 93 | 93 | 94 | 94 |
| 6 (Mars) | 4 | 33 | 17 | 74 | 64 | 99 | 93 |
| 7 | 4 | 25 | 18 | 46 | 37 | 95 | 87 |
| 8 | 4 | 20 | 19 | 61 | 46 | 74 | 66 |
| 9 | 4 | 25 | 20 | 53 | 35 | 84 | 69 |
| 10 | 4 | 31 | 24 | 58 | 37 | 95 | 76 |
| 11 | 4 | 27 | 27 | 51 | 23 | 87 | 57 |
| 12 (boss) | 4 | 27 | 25 | 44 | 18 | 81 | 50 |

Compared with the earlier 5 to 8 day levels, Mars is a little easier for an average kid (the boss was 20 / 1 percent before) and a little harder for a good kid at level 8 to 12.
Level 8 is flat because the water failure limits how much science anybody can do; it can be tuned after real playtests.
With a full Earth cargo kit (battery 2, water 1, shield 2, science 1) the same players reach 2+ stars almost always and 3 stars in 47 to 100 percent of plays, so the kit stays a real reward but does not remove the challenge of the boss.

## Earlier result (5 to 8 day levels, kept for reference)

| Level | Average kid, 2+ stars | Average kid, 3 stars | Good kid, 2+ stars | Good kid, 3 stars |
|---|---|---|---|---|
| 1 to 5 (Moon) | 81 to 99 | 80 to 99 | 93 to 100 | 93 to 100 |
| 6 | 78 | 69 | 100 | 95 |
| 7 | 61 | 54 | 96 | 91 |
| 8 | 45 | 35 | 99 | 87 |
| 9 | 43 | 28 | 98 | 82 |
| 10 | 37 | 25 | 100 | 88 |
| 11 | 43 | 17 | 100 | 64 |
| 12 (boss) | 20 | 1 | 98 | 14 |

Every level can be finished by everyone (a mission only fails if power or water run out).

## Mini games now grow with the level (2026-11-14, night)

Every mini game scales its amount of work with the difficulty `d` (0 to 1), not only its speed. All numbers are in `src/minigames/params.ts`.

| Game | d = 0 (Moon 1) | d = 0.5 | d = 1 |
|---|---|---|---|
| Plants (pairs) | 3, cards shown first for 1.5 s | 6 | 8, cards flip back faster |
| Rock scan (pattern length, colors) | 3, 3 colors | 6, 4 colors | 8, 5 colors |
| Solar panel (tries) | 2 | 4 | 5 |
| Dust sensor (rounds) | 3 | 5 | 6, amber decoys |
| Rest pod (beats) | 4 | 7 | 9 |
| Repair bay (breakdowns) | 6 | 9 | 12 |

Goals of levels 7, 9, 11 and 12 were re-tuned with `tools/difficulty.ts` after this change. The kid skill numbers are still assumptions, so tune again after real playtests.

## Help for children who find a game hard (kids-improvements)

After two rough runs (1 star) in a row, the same mini game gets a little easier (difficulty lowered by 0.25) and shows a "Helper mode" chip. After four it gets easier again, up to two steps. The help stays for the rest of the mission and never takes stars away. Every rough run also shows one short tip for that game (`src/core/assist.ts`). The first mission also teaches the rewind rule with a short guided moment after day 1.
