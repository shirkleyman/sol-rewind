// Builds src/data/earth.json: real continents (Natural Earth 110m via world-atlas) in an orthographic view of Earth.
// The disc has radius 200 and is centred at (200,200). The view is tilted so that Israel sits about 50 degrees of arc
// above the disc centre: when only the top cap of the disc is shown on the map, the Mediterranean, Africa, Europe and
// the Arabian Peninsula are in that cap.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { geoOrthographic, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/land-110m.json');
const land = feature(topo, topo.objects.land);

const R = 200;
const CENTER_LON = 30;
const CENTER_LAT = -14;
const projection = geoOrthographic()
  .rotate([-CENTER_LON, -CENTER_LAT])
  .translate([R, R])
  .scale(R)
  .clipAngle(90)
  .precision(0.3);

const path = geoPath(projection).digits(1);
const d = path(land);
const israel = projection([34.75, 31.9]).map((v) => Math.round(v * 10) / 10);

// Rough centres of the big deserts (Sahara, Arabian Peninsula) so the game can tint them sandy.
const sand = [[24, 14, 0.12], [22, 45, 0.1], [29, 3, 0.07]].map(([lat, lon, rad]) => {
  const [x, y] = projection([lon, lat]).map((v) => Math.round(v * 10) / 10);
  return [x, y, Math.round(rad * R)];
});

fs.writeFileSync('src/data/earth.json', JSON.stringify({ r: R, israel, sand, land: d }));
console.log('land path chars:', d.length, 'israel:', israel, 'center lon/lat:', CENTER_LON, CENTER_LAT);
