// Turns the raw NASA downloads (DONKI + RadLab) into the small JSON files the game bundles.
// Usage: npm run data   (set SOL_DATA_DIR to the folder that holds donki/ and radlab/)
import fs from 'node:fs';
import path from 'node:path';

const DATA = process.env.SOL_DATA_DIR || 'G:/My Drive/University/Space/SpaceApps/Sol_Rewind/data';
const OUT = path.resolve('src/data');
fs.mkdirSync(OUT, { recursive: true });

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(DATA, 'donki', f), 'utf8'));
const analyses = readJson('donki_CMEAnalysis_2010-2026.json');
const gst = readJson('donki_GST_2010-2026.json');
const sep = readJson('donki_SEP_2010-2026.json');
const downloaded = JSON.parse(fs.readFileSync(path.join(DATA, 'donki', '_download_summary.json'), 'utf8')).downloaded_utc;

const day = (iso) => Date.parse(iso.slice(0, 10));
const DAY_MS = 86400000;
const kpOf = (g) => Math.max(0, ...g.allKpIndex.map((k) => k.kpIndex));

const best = new Map();
for (const a of analyses) {
  if (!a.speed || !a.associatedCMEID || !a.time21_5) continue;
  const cur = best.get(a.associatedCMEID);
  if (!cur || a.speed > cur.speed) best.set(a.associatedCMEID, a);
}

const events = [...best.values()].map((a) => {
  const t = day(a.time21_5);
  const kp = Math.max(0, ...gst.filter((g) => { const d = day(g.startTime); return d >= t && d <= t + 5 * DAY_MS; }).map(kpOf));
  const hasSep = sep.some((s) => { const d = day(s.eventTime); return d >= t && d <= t + 3 * DAY_MS; });
  return {
    id: a.associatedCMEID,
    date: a.time21_5.slice(0, 10),
    speed: Math.round(a.speed),
    type: a.type,
    kp: Math.round(kp * 10) / 10,
    sep: hasSep,
  };
});

const bands = [
  { name: 'mild', min: 600, max: 900, take: 8 },
  { name: 'medium', min: 900, max: 1400, take: 8 },
  { name: 'strong', min: 1400, max: 2200, take: 8 },
  { name: 'extreme', min: 2200, max: 99999, take: 8 },
];

const picked = [];
for (const b of bands) {
  const pool = events.filter((e) => e.speed >= b.min && e.speed < b.max && e.kp > 0).sort((x, y) => x.date.localeCompare(y.date));
  const n = Math.min(b.take, pool.length);
  for (let i = 0; i < n; i++) picked.push({ ...pool[Math.floor((i * pool.length) / n)], band: b.name });
}

const storms = picked.map((e) => {
  const intensity = Math.max(0.1, Math.min(1, (e.speed - 400) / 2600));
  return { ...e, intensity: Math.round(intensity * 100) / 100, label: `CME ${e.date}, ${e.speed} km/s` + (e.kp ? `, Kp ${e.kp}` : '') };
});

fs.writeFileSync(path.join(OUT, 'storms.json'), JSON.stringify({ source: 'NASA DONKI via api.nasa.gov', downloaded, storms }, null, 1));

function csvStats(file) {
  const lines = fs.readFileSync(path.join(DATA, 'radlab', file), 'utf8').trim().split(/\r?\n/);
  const head = lines[0].split(',');
  const i = head.indexOf('absorbed_dose_rate');
  const vals = lines.slice(1).map((l) => parseFloat(l.split(',')[i])).filter((v) => !Number.isNaN(v)).sort((a, b) => a - b);
  const sum = vals.reduce((x, y) => x + y, 0);
  return { rows: vals.length, mean: +(sum / vals.length).toFixed(2), median: +vals[Math.floor(vals.length / 2)].toFixed(2), max: +vals[vals.length - 1].toFixed(2) };
}

const radiation = {
  source: 'NASA OSDR RadLab',
  window: '2024-05-08 to 2024-05-15',
  unit: 'absorbed dose rate in microgray per hour',
  note: 'Different instruments and orbits, so compare only roughly.',
  sources: [
    { id: 'iss', label: 'International Space Station', instrument: 'DosTel', ...csvStats('radlab_iss_2024-05-08_to_15.csv') },
    { id: 'moon', label: 'Lunar orbit (LRO)', instrument: 'CRaTER', ...csvStats('radlab_moon_2024-05-08_to_15.csv') },
    { id: 'mars', label: 'Mars surface (Curiosity)', instrument: 'MSL-RAD', ...csvStats('radlab_mars_2024-05-08_to_15.csv') },
  ],
};
fs.writeFileSync(path.join(OUT, 'radiation.json'), JSON.stringify(radiation, null, 1));

console.log(`storms: ${storms.length}`, bands.map((b) => `${b.name}=${storms.filter((s) => s.band === b.name).length}`).join(' '));
console.log('radiation sources:', radiation.sources.map((s) => `${s.id} mean ${s.mean}`).join(', '));
