# AI usage

NASA Space Apps asks teams to describe how AI tools were used. This file says it plainly: what the AI did, what the team did, and when.

## Tool

**Claude (Anthropic), through Claude Code** (the Claude desktop app, model Claude Sonnet 5.5). In some parts Claude used helper agents, which are extra copies of itself working on a separate piece: the planet artwork, the cargo prep and launch screens, the rover companions, the postcard and certificate, the helmet and badge screen, the surprise events, and the level data for 3 to 4 day missions.

## How the work was done

**Shir led the development** in one long conversation with Claude Code, in Hebrew. She set the goals, described what she wanted the game to feel like, saw Claude's reasoning and its suggestions for the game, the design and the changes that make it suitable for children, chose between the options, asked for changes, and looked at the results in the browser after each step.

**Claude wrote almost all of the code, the text in the game and the drawings.** Claude also looked up NASA pages, wrote the tests and the documentation, and ran the checks.

## Timeline

| When | What |
|---|---|
| 13 Nov 2026, before the hackathon started | An early conversation with Claude about the challenges, ideas for a game, a name, four picture mockups (not playable) and a technical plan. NASA resource pages were read, and NASA data (DONKI, RadLab) was downloaded a first time. **No game code was written.** |
| 14 Nov 2026, from 09:02 | The project was created and **all of the game code was written, after the hackathon started at 09:00.** First playable version in the first hours, then many rounds of changes. |
| 14 Nov 2026, evening | The NASA data was downloaded again, after 09:00, with the scripts in `tools/`. The game's data files were rebuilt from the new download. See `DATA_SOURCES.md`. |

## What Claude did

- Game rules, levels, 8 mini games, the journey map, the level screen, the timeline and its graph, sounds and music, saving progress.
- The visual design: scenes, planets with real continents and craters, rovers, the logo and icons.
- Features added during the day: real NASA photos for each level, Earth mission prep and launch, learning stops with quizzes, rover friends, surprise events, ghost of the previous try, postcards, certificate, helmet colors and badges, read aloud, a "How to play" story, settings, a floating menu, phone layout.
- A difficulty model of a young player (`tools/difficulty.ts`), used to tune the levels. **Its skill numbers are assumptions, not measurements.**
- Looking up facts from NASA pages and writing them in kid-friendly words.
- Tests (76 automated tests) and browser checks of the screens on desktop and phone sizes.

## What the team did

- **Shir** led the development: she decided what to build, saw and judged Claude's reasoning and suggestions for the game, the design and the adaptations for children, picked among options, requested changes, and reviewed the result at every step.
- The team is responsible for the final choices, the submission page, the video and checking the facts (see below).

## What is not checked yet

- **The game was not tested with real children yet.** Level difficulty is based on the model above.
- **Facts must be checked against their sources before submission.** The lists are in `DATA_SOURCES.md` and `PHOTOS.md`. In particular the rover facts and the surprise events (mission control radio, dust and meteor facts), because some NASA pages could be read only partly.
- Exact coordinates for some places (see `PHOTOS.md`).
- Printing the certificate on paper, sound on real devices and real touch screens were not tried.

## Data and assets

- Real data: see `DATA_SOURCES.md`.
- Photos: real NASA images from the NASA Image and Video Library, credited in the game and in `PHOTOS.md`. Claude helped search, check captions and wire them in.
- Icons: Tabler Icons (MIT license). Animation: GSAP.
- Sounds and music are generated live in the browser with the Web Audio API (`src/ui/sound.ts`, `src/ui/music.ts`). The music is an original, simple composition written with Claude's help. There are no audio files and nothing was copied from a film or game.
- Rover companions (Buggy, the Apollo Lunar Roving Vehicle, and Curio, the Curiosity rover): the short facts were written with NASA pages as sources, and the cartoon rovers were drawn as SVG by Claude.
- Logo and app icons (a sun inside a rewind arrow): drawn as SVG by Claude. The PNG icons are made by `tools/make-icons.mjs`.
- No NASA logo or insignia is used anywhere.
