import { LEVELS } from '../src/core/levels';
import { sample } from '../src/core/solver';

const ms = [0.5, 0.8, 1];
console.log('level | m   | finished% | 1* | 2* | 3* | best(stars/sci/dose)');
for (const L of LEVELS) {
  for (const m of ms) {
    const r = sample(L, m, 4000, 5 + L.id);
    const pct = ((r.finished / r.episodes) * 100).toFixed(1).padStart(5);
    const b = r.best ? `${r.best.stars}/${Math.round(r.best.sci)}/${Math.round(r.best.dose)}` : '-';
    console.log(`${String(L.id).padStart(5)} | ${m.toFixed(1)} | ${pct}%    | ${String(r.stars[1]).padStart(4)} | ${String(r.stars[2]).padStart(4)} | ${String(r.stars[3]).padStart(4)} | ${b}  (goal ${L.goal}, low ${L.lowDose})`);
  }
}
