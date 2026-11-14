# Real NASA photos in the game

Each level is set at a real place, and the "Look outside" window shows a real NASA photo from there.
Photos were found with the NASA Image and Video Library (https://images.nasa.gov, API https://images-api.nasa.gov) on 14 November 2026
and are stored in `src/assets/sites/` (about 3 MB in total). The data lives in `src/data/sites.json`, built by `tools/make-sites.py`.

NASA media is generally free to use with credit. Before the final submission, check NASA's media usage guidelines once more
(https://www.nasa.gov/nasa-brand-center/images-and-media/) and keep the credit line that the game shows under every photo.

| Level | Place | Photo (NASA image ID) | Credit | Coordinates source |
|---|---|---|---|---|
| 1 | Apollo 11, Tranquility Base | KSC-as11-40-5964 | NASA | NASA NSSDCA Apollo landing site coordinates |
| 2 | Apollo 12, Ocean of Storms | AS12-48-7134 | NASA | same |
| 3 | Apollo 15, Hadley Rille | as15-85-11425 | NASA | same |
| 4 | Apollo 16, Descartes highlands | as16-107-17436 | NASA | same |
| 5 | Apollo 17, Taurus-Littrow valley | as17-140-21497 | NASA | same |
| 6 | Viking 1, Chryse Planitia | PIA00563 | NASA/JPL | NASA NSSDCA, Viking 1 Lander |
| 7 | Opportunity, Perseverance Valley | PIA22909 | NASA/JPL-Caltech/Cornell/ASU | NASA NSSDCA, Mars Exploration Rover B (landing site) |
| 8 | Spirit, Troy in Gusev Crater | PIA12203 | NASA/JPL-Caltech/Cornell University | NASA NSSDCA, Mars Exploration Rover A (landing site) |
| 9 | InSight, western Elysium Planitia | PIA25287 | NASA/JPL-Caltech | Golombek et al., LPSC 2019 (not a NASA page) |
| 10 | Curiosity, Gale Crater | PIA16032 | NASA/JPL-Caltech/MSSS | Vasavada et al., JGR 2014 (not a NASA page) |
| 11 | Mars Pathfinder, Ares Vallis | PIA01551 | NASA/JPL | NASA NSSDCA, Mars Pathfinder |
| 12 | Perseverance, Jezero Crater floor | PIA24744 | NASA/JPL-Caltech | Region only, from NASA NSSDCA. Exact coordinates still to add |

## How exact is the location?

- **Moon:** the Apollo photos were taken by the astronauts at the landing site. The coordinates are the lunar module position
  (NASA NSSDCA, determined from Lunar Reconnaissance Orbiter images).
- **Mars landers (Viking 1, Pathfinder, InSight):** the photo was taken at the landing site, so the landing coordinates are the photo location.
- **Mars rovers (Opportunity, Spirit, Curiosity, Perseverance):** rovers drive, so the game shows the landing coordinates and
  says so. The place where the photo was taken comes from the NASA caption (Perseverance Valley, Troy, Gale Crater, Jezero floor).
  Opportunity's and Spirit's photos were taken years after landing, far from the landing site.

## Still to check

- Add NASA-sourced coordinates for Perseverance, InSight and Curiosity (two of them come from scientific papers, one is region only).
- The Opportunity panorama is small (900 by 201 pixels). It is shown as a slowly moving strip. Replace it if a larger true-color version is found.
- Photo dates in `sites.json` come from NASA captions. Where the caption gives only a year, the game shows only the year.

## Rover companions

| Rover | Image | Credit | Facts from |
|---|---|---|---|
| Buggy (Apollo Lunar Roving Vehicle) | as15-86-11603 | NASA | NASA Apollo Lunar Surface Journal, Smithsonian Air and Space, NASA Science 2008 "Moondust and Duct Tape" (archive) |
| Curio (Curiosity rover) | PIA19142 | NASA/JPL-Caltech/MSSS | NASA Mars Science Laboratory pages (see `src/core/rovers.ts`) |

Still to check: read every rover fact against its source page. The Apollo 17 fender page on nasa.gov and the archived NASA Science page could not be read in full while writing.
