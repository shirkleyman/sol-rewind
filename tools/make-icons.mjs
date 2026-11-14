// Makes the PNG icons from the SVG logo files in public/. Needs: npm i --no-save sharp
// Run: node tools/make-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = (f) => readFileSync(new URL(`../public/${f}`, import.meta.url));
const jobs = [
  ['icon-rounded.svg', 'icon-192.png', 192, 192],
  ['icon-rounded.svg', 'icon-512.png', 512, 512],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512, 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180, 180],
  ['og-image.svg', 'og-image.png', 1200, 630],
];
for (const [src, out, w, h] of jobs) {
  await sharp(svg(src), { density: 384 }).resize(w, h).png().toFile(new URL(`../public/${out}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  console.log('wrote', out);
}
