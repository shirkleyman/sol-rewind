import { audioCtx, peekCtx } from './audio';

type World = 'moon' | 'mars';

interface Mood {
  chords: number[][];
  scale: number[];
  cutoff: number;
  chordMs: number;
  arpGap: [number, number];
  arpVol: number;
  drone: number;
}

/**
 * Original ambient music made live in the browser: slow warm pads, a deep drone and soft bell-like notes
 * in a long echo. The Moon is calm and bright, Mars is lower and a little more mysterious.
 * It is generated with the Web Audio API, so there are no audio files to download.
 */
const MOODS: Record<World, Mood> = {
  moon: {
    chords: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]],
    scale: [74, 76, 78, 81, 83, 86],
    cutoff: 950,
    chordMs: 9000,
    arpGap: [1100, 2300],
    arpVol: 0.045,
    drone: 38,
  },
  mars: {
    chords: [[50, 57, 60, 65], [46, 53, 58, 62], [53, 60, 65, 69], [48, 55, 60, 64]],
    scale: [62, 65, 67, 69, 72, 74],
    cutoff: 680,
    chordMs: 10500,
    arpGap: [1500, 3000],
    arpVol: 0.04,
    drone: 38,
  },
};

const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const MASTER = 0.2;

class Engine {
  private out: GainNode;
  private bus: GainNode;
  private timers: number[] = [];
  private nodes: AudioNode[] = [];
  private alive = true;
  private idx = 0;

  constructor(private ctx: AudioContext, private mood: Mood) {
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(ctx.destination);
    this.bus = ctx.createGain();
    const dry = ctx.createGain();
    dry.gain.value = 0.75;
    const wet = ctx.createGain();
    wet.gain.value = 0.6;
    const conv = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 3.2);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
    conv.buffer = buf;
    this.bus.connect(dry).connect(this.out);
    this.bus.connect(conv).connect(wet).connect(this.out);
    this.nodes.push(this.out, this.bus, dry, wet, conv);
  }

  start(): void {
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(0, t);
    this.out.gain.linearRampToValueAtTime(MASTER, t + 4);
    this.droneNote();
    this.nextChord();
    this.later(() => this.arp(), 2500);
  }

  private later(fn: () => void, ms: number): void {
    this.timers.push(window.setTimeout(() => this.alive && fn(), ms));
  }

  private droneNote(): void {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = hz(this.mood.drone);
    g.gain.setValueAtTime(0, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.09, this.ctx.currentTime + 6);
    o.connect(g).connect(this.bus);
    o.start();
    this.nodes.push(o, g);
  }

  private nextChord(): void {
    const chord = this.mood.chords[this.idx++ % this.mood.chords.length];
    const t = this.ctx.currentTime;
    const dur = this.mood.chordMs / 1000 + 4;
    chord.forEach((n) => this.pad(n, t, dur));
    this.later(() => this.nextChord(), this.mood.chordMs);
  }

  private pad(note: number, t: number, dur: number): void {
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = this.mood.cutoff;
    f.Q.value = 0.6;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + 3);
    g.gain.setValueAtTime(0.045, t + dur - 4);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(this.bus);
    [-7, 7].forEach((det) => {
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = hz(note);
      o.detune.value = det;
      o.connect(f);
      o.start(t);
      o.stop(t + dur + 0.1);
    });
  }

  private arp(): void {
    if (Math.random() < 0.8) this.pluck(this.mood.scale[Math.floor(Math.random() * this.mood.scale.length)]);
    this.later(() => this.arp(), rand(this.mood.arpGap[0], this.mood.arpGap[1]));
  }

  private pluck(note: number): void {
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(this.mood.arpVol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    g.connect(this.bus);
    [1, 2].forEach((mult, i) => {
      const o = this.ctx.createOscillator();
      o.type = i === 0 ? 'triangle' : 'sine';
      o.frequency.value = hz(note) * mult;
      const og = this.ctx.createGain();
      og.gain.value = i === 0 ? 1 : 0.25;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 2.7);
    });
  }

  stop(fade = 2): void {
    this.alive = false;
    this.timers.forEach((t) => clearTimeout(t));
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t);
    this.out.gain.setValueAtTime(this.out.gain.value, t);
    this.out.gain.linearRampToValueAtTime(0, t + fade);
    window.setTimeout(() => this.nodes.forEach((n) => {
      try {
        n.disconnect();
      } catch {
        /* already disconnected */
      }
    }), fade * 1000 + 6000);
  }
}

let engine: Engine | null = null;
let current: World | null = null;
let enabled = true;

export const music = {
  setEnabled(on: boolean): void {
    enabled = on;
    if (!on) this.stop();
  },
  /** Starts the music for a world, or fades to the other mood. Needs a user tap first (browser rule). */
  play(world: World): void {
    if (!enabled) return;
    if (current === world && engine) return;
    const ctx = audioCtx();
    if (!ctx) return;
    engine?.stop(2.5);
    engine = new Engine(ctx, MOODS[world]);
    engine.start();
    current = world;
  },
  stop(): void {
    engine?.stop(1.5);
    engine = null;
    current = null;
  },
  isPlaying: () => engine !== null,
};

document.addEventListener('visibilitychange', () => {
  const ctx = peekCtx();
  if (!ctx) return;
  if (document.hidden) void ctx.suspend();
  else if (enabled) void ctx.resume();
});
