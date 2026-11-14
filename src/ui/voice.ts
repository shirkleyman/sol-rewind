/**
 * Read aloud with the browser's built-in Web Speech API (no audio files, nothing is sent by the game).
 * It is off by default. Kids can also tap a small speaker button to hear one text.
 */
let enabled = false;
let lastKey = '';

export const voiceSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export function setVoice(on: boolean): void {
  enabled = on;
  if (!on) stopSpeaking();
}

export const voiceOn = (): boolean => enabled && voiceSupported();

/** Plain text for speech: no tags, short pauses between lines. */
export function plain(html: string): string {
  const el = document.createElement('div');
  el.innerHTML = html.replace(/<(br|\/p|\/li|\/h2|\/div)\s*\/?>/gi, '. ');
  return (el.textContent ?? '').replace(/\s+/g, ' ').replace(/\.\s*\./g, '.').trim();
}

export function stopSpeaking(): void {
  if (voiceSupported()) window.speechSynthesis.cancel();
}

/** Speak a text. `force` is for a button the child pressed, even when read aloud is off. */
export function speak(text: string, force = false): void {
  if (!voiceSupported() || (!enabled && !force) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.slice(0, 600));
  u.lang = 'en-US';
  u.rate = 0.92;
  u.pitch = 1.05;
  window.speechSynthesis.speak(u);
}

/** Speak automatically, but only once per key, so a screen that redraws does not repeat itself. */
export function speakOnce(key: string, text: string): void {
  if (!voiceOn() || key === lastKey) return;
  lastKey = key;
  speak(text);
}

export function resetSpoken(): void {
  lastKey = '';
}
