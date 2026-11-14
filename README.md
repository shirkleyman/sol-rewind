# Sol Rewind

> Every day counts. Even the ones you undo.

<p align="center"><img src="public/logo.svg" alt="Sol Rewind logo" width="360" /></p>

**Sol Rewind** is a browser game for kids (7 to 12) about running a small base on the Moon and on Mars.
It was made for the NASA Space Apps Challenge 2026, challenge **Build a Junior Astronaut Mission Trainer**.

## The idea

You plan each day of a mission: pick tasks at the base, play a small game for every task, and watch water, power and science change.
A day went badly? **Rewind it and play it again.** Power, water and science come back.

**But radiation never goes back.** Every storm leaves a mark on the crew, just like in real space, and every try adds a little more.
To earn 3 stars you have to plan smart: shield the crew before a solar storm, and keep the total dose low.

That one rule turns the game into a puzzle about planning, and teaches real ideas about life in space.

## What is inside

- **12 missions, 3 to 4 days each.** The Moon (5 missions) is the training ground. Mars (7 missions) is the harder test. Each mission is set at a real place, with a real NASA photo, and builds six skills: power budgeting, life support, radiation safety, systems thinking, crew care and adapting to change.
- **8 mini games**, one per station (the experiment station has three kinds). They get harder as the missions go on, with more to do and not only faster, and they feel different on the Moon and on Mars.
- **One timeline per mission** with a face for how each day went, a graph of power, water and science, and a radiation row that only grows. A ghost of your previous try helps you see what changed.
- **Real NASA data.** Storm days use real solar storms from NASA DONKI. The radiation scale uses real dose rates from NASA OSDR RadLab.
- **Journey map** that starts at the bottom: Earth, a long trip with learning stops, the Moon, a longer trip, then Mars. Earth shows its real continents, and the Moon and Mars show real craters and features at their real positions.
- **Earth mission prep:** pack cargo within a mass limit for a head start, then watch an animated launch.
- **Real rover friends:** Buggy (the Apollo Lunar Roving Vehicle) on the Moon and Curio (the Curiosity rover) on Mars give tips and real facts.
- **Surprises:** a meteor shower to tap, a dust cloud passing by, and radio messages from mission control (with the real radio delay).
- **Keepsakes:** a postcard with the real NASA photo after each mission, a printable certificate with the child's name, helmet colors and mission badges earned with stars.
- **For young players:** a short "How to play" story, picture-first cards, optional read aloud (Web Speech), big touch targets and a layout that works on phones.
- **Original music and sounds** generated live in the browser. There are no audio files.
- **Sources and credits** screen with every link.

## Play it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # rules, level balance and module tests
npm run build      # production build in dist/
```

Add `?unlock` to the address to open every level while testing.

## How it is organised

| Folder | What lives there |
|---|---|
| `src/core` | Game rules as pure functions (`rules.ts`), level data loading, save data, rovers, surprises, avatar, a sampling solver |
| `src/data` | `levels.json`, `storms.json`, `radiation.json`, `sites.json`, `earth.json` (small JSON made from the NASA downloads) |
| `src/minigames` | One module per mini game, all following the contract in `types.ts`, and every difficulty number in `params.ts` |
| `src/ui` | Journey map, level screen, timeline, cards, sound and music, certificate, postcard |
| `tools` | Data and balance tools (see below) |
| `tests` | Rules, level balance and module tests |
| `public` | Logo, icons and the web app manifest |

### Add a level
Edit `src/data/levels.json`. Storms refer to real events by band and index (`"band": "strong", "pick": 3`).
Then run `npx vite-node tools/balance.ts` and `npm test` to check that the level can be finished.

### Add a mini game
Create a module that exports a `MiniGame` (see `src/minigames/types.ts`): draw into the given element, play for a few
seconds, then call `done(score)` once with a score from 0 to 1. Put its difficulty numbers in `params.ts` and register it in `src/minigames/index.ts`.

### Difficulty
`DIFFICULTY.md` explains how the levels were tuned with a simple model of a young player (`tools/difficulty.ts`).
The skill numbers in that model are assumptions, not measurements, so they should be checked with real players.

## Real data and sources

See `DATA_SOURCES.md` for every source, what was downloaded and when, and which facts still need checking.
Photo credits are in `PHOTOS.md` and in the game's Sources and credits screen.
The raw NASA downloads are not stored in this repository, only the small JSON files the game uses.
To rebuild them: `python tools/fetch_donki.py OUT_DIR/donki` (needs a free `NASA_API_KEY` environment variable from https://api.nasa.gov/),
`python tools/fetch_radlab.py OUT_DIR/radlab`, then `SOL_DATA_DIR=OUT_DIR npm run data`.

## Publish on GitHub Pages

Build with `npm run build` and publish the `dist` folder (the build uses a relative base path, so it works from any repository name).
This repository is published from its `gh-pages` branch: in the repository settings, **Pages, Source: Deploy from a branch, `gh-pages`**.
To publish automatically on every push to `main` instead, copy `tools/deploy.yml.example` to `.github/workflows/deploy.yml` and set **Pages, Source: GitHub Actions**.

## Privacy

Progress and settings are stored only in the browser (`localStorage`). There are no accounts, no tracking and no data sent anywhere.
The child's first name, if given, is used only on the certificate and stays on the device.

## Logo and icons

The symbol is a sun (Sol) inside a rewind arrow. Files are in `public/`. `tools/make-icons.mjs` makes the PNG icons from the SVG files (run `npm i --no-save sharp` first).

## License and credits

The original code, text, drawings and logo are licensed under the **Apache License 2.0** (see `LICENSE`).
Third-party material (NASA data and images, icons, libraries) keeps its own terms. See `NOTICE`.
This is an independent project. NASA does not endorse it, and it does not use the NASA logo.
