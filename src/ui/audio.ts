let ctx: AudioContext | null = null;

/** One shared audio context for sound effects and music. Created on first use, which must follow a tap or click. */
export function audioCtx(): AudioContext | null {
  try {
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function peekCtx(): AudioContext | null {
  return ctx;
}
