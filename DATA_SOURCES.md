# Data sources

Sol Rewind uses open NASA data. Numbers for costs and rewards in the game are game design values, not NASA measurements.

| What | How it is used in the game | Source |
|---|---|---|
| Coronal mass ejections (CME) and CME analyses | Real solar storms on certain days. Storm strength comes from the measured CME speed | NASA DONKI, https://ccmc.gsfc.nasa.gov/tools/DONKI/ via https://api.nasa.gov/ |
| Solar energetic particle events and geomagnetic storms | Used to label storms (Kp index) | NASA DONKI |
| Radiation dose rates (ISS, lunar orbit, Mars surface), 8 to 15 May 2024 | The "Look outside" panel in each level | NASA OSDR RadLab, https://visualization.osdr.nasa.gov/radlab/gui/data-api/ |

## Notes

- Downloaded on 14 November 2026 (DONKI between 22:38 and 23:00, RadLab at 22:38, after the hackathon started at 09:00; DONKI download time is recorded in `src/data/storms.json`). A first download made on the evening of 13 November was replaced by this one. The new DONKI download has 5 more CME events and 3 more CME analyses than the first (events from 13 and 14 November); the 32 storms used by the game did not change. RadLab data was identical. The game ships a fixed, trimmed copy (`src/data/storms.json`, `src/data/radiation.json`). It does not call NASA at run time, and says so.
- RadLab values come from different instruments and places (a spacecraft in lunar orbit, a rover on Mars, the ISS), so they are only compared roughly.
- Storm strength in the game is a simple scale from CME speed, not a physical dose model.
- Ideas for the experiments (growing plants, rock scan, dust sensor) are inspired by real NASA and partner missions, but their numbers are invented for gameplay.

## Real surface photos (now used in the game, see PHOTOS.md)

Checked on 14 November 2026. The challenge Resources tab has the same 5 NASA and 2 CSA entries as on 13 November, so nothing new was added there.

| Source | What it has | Status |
|---|---|---|
| NASA Image and Video Library, https://images.nasa.gov (API: https://images-api.nasa.gov/search) | Apollo lunar surface photos (for example Apollo 17, center JSC) and Curiosity Mars surface panoramas (center JPL) | Works without a key. Listed in the api.nasa.gov catalog, but not on the challenge Resources tab |
| Mars Rover Photos API (named in the Resources text under NASA Open APIs) | Raw rover photos | Returned HTTP 404 for Curiosity and Perseverance on 14 November 2026, and is not in the api.nasa.gov catalog |
| Mars Trek, https://trek.nasa.gov/mars/ | Mars imagery, elevation and terrain, described on the Resources tab as surface imagery from Curiosity and Perseverance | Reachable. Not used |

Before using any photo, check NASA's media usage guidelines and credit the source (for example "NASA/JPL-Caltech" or "NASA/JSC").

## Facts to verify before the final submission

The info cards (`src/core/edu.ts`) and level facts (`src/data/levels.json`) are general knowledge written for kids. Check each against a NASA page and add the link here:

- The International Space Station recycles water, including from moisture in the air.
- Astronauts have grown lettuce and other plants on the International Space Station.
- Mars gets less sunlight than the Moon, and dust storms on Mars can block much of the sunlight.
- The Moon has nights that last about two weeks.
- NASA's Human Research Program studies astronaut health and performance.
- Space weather forecasts and storm shelters protect crews from solar storms.

## Maps and learning stops (added 14 November 2026)

- Earth coastlines: Natural Earth 110m land (public domain) through the `world-atlas` package, projected in `tools/make-earth.mjs`.
- Moon and Mars crater, mare and basin positions in `src/ui/planets.ts` were written from general knowledge and are NOT source-checked yet.
  Check each against the USGS Gazetteer of Planetary Nomenclature (https://planetarynames.wr.usgs.gov) or a NASA page.
- Research examples on the crew-care card come from NASA OSDR (OSD-342, OSD-417). The study pages respond (checked 14 November 2026).
- The six learning stops (`src/core/stops.ts`) are general facts. Verify each with a NASA page and add the link here:
  - The International Space Station orbits about 400 km above Earth.
  - Earth's magnetic field and the Van Allen radiation belts trap many fast particles.
  - The Moon is about 384,000 km away, and a radio signal takes about 1.3 seconds.
  - Radiation is stronger in deep space because Earth's magnetic field is far away.
  - A trip to Mars takes roughly 6 to 9 months with current rockets.
  - A one-way radio message between Mars and Earth takes roughly 3 to 22 minutes.
