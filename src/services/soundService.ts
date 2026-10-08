export type AppSound =
  | "tap"
  | "open"
  | "save"
  | "paid"
  | "delete"
  | "undo"
  | "notification"
  | "reminder";

let audioContext: AudioContext | null = null;
let unlocked = false;
let unlockListenersInstalled = false;
const SOUND_PREFS_KEY = "mmv_hub_sound_preferences_v1";

export type SoundPreference = "actions" | "alerts";

export function isSoundEnabled(preference: SoundPreference): boolean {
  try {
    const saved = JSON.parse(localStorage.getItem(SOUND_PREFS_KEY) || "{}");
    return saved[preference] !== false;
  } catch {
    return true;
  }
}

export function setSoundEnabled(preference: SoundPreference, enabled: boolean) {
  try {
    const saved = JSON.parse(localStorage.getItem(SOUND_PREFS_KEY) || "{}");
    localStorage.setItem(SOUND_PREFS_KEY, JSON.stringify({ ...saved, [preference]: enabled }));
  } catch {
    // Audio preference is optional when storage is unavailable.
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  audioContext ||= new AudioContextCtor();
  return audioContext;
}

export function initializeAppSounds() {
  if (typeof window === "undefined" || unlockListenersInstalled) return;
  unlockListenersInstalled = true;

  const unlock = () => {
    const context = getAudioContext();
    if (!context) return;
    context.resume().catch(() => {});
    unlocked = true;
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    unlockListenersInstalled = false;
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}

export function playAppSound(sound: AppSound) {
  const preference = sound === "notification" || sound === "reminder" ? "alerts" : "actions";
  if (!isSoundEnabled(preference) || !unlocked) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state !== "running") {
    context.resume().then(() => {
      if (context.state === "running") playAppSound(sound);
    }).catch(() => {});
    return;
  }

  const now = context.currentTime;
  const main = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(sound === "delete" ? 680 : 2400, now);
  main.gain.setValueAtTime(0.0001, now);
  main.connect(filter);
  filter.connect(context.destination);

  const steps = soundSteps[sound];
  steps.forEach((step) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + step.delay;
    const end = start + step.duration;
    oscillator.type = step.type || "sine";
    oscillator.frequency.setValueAtTime(step.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(step.volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(main);
    oscillator.start(start);
    oscillator.stop(end + 0.02);

  });
  const lastEnd = Math.max(...steps.map((step) => now + step.delay + step.duration));
  main.gain.exponentialRampToValueAtTime(0.95, now + 0.01);
  main.gain.exponentialRampToValueAtTime(0.0001, lastEnd + 0.06);
}

const soundSteps: Record<AppSound, Array<{ frequency: number; duration: number; delay: number; volume: number; type?: OscillatorType }>> = {
  tap: [
    { frequency: 620, duration: 0.035, delay: 0, volume: 0.045, type: "triangle" },
  ],
  open: [
    { frequency: 520, duration: 0.045, delay: 0, volume: 0.04, type: "sine" },
    { frequency: 740, duration: 0.055, delay: 0.035, volume: 0.034, type: "sine" },
  ],
  save: [
    { frequency: 660, duration: 0.06, delay: 0, volume: 0.045, type: "sine" },
    { frequency: 920, duration: 0.08, delay: 0.055, volume: 0.04, type: "sine" },
  ],
  paid: [
    { frequency: 540, duration: 0.055, delay: 0, volume: 0.04, type: "triangle" },
    { frequency: 760, duration: 0.07, delay: 0.045, volume: 0.042, type: "triangle" },
    { frequency: 1080, duration: 0.09, delay: 0.105, volume: 0.034, type: "sine" },
  ],
  delete: [
    { frequency: 320, duration: 0.075, delay: 0, volume: 0.052, type: "sawtooth" },
    { frequency: 220, duration: 0.09, delay: 0.055, volume: 0.04, type: "triangle" },
  ],
  undo: [
    { frequency: 460, duration: 0.06, delay: 0, volume: 0.04, type: "triangle" },
    { frequency: 620, duration: 0.07, delay: 0.05, volume: 0.038, type: "triangle" },
  ],
  notification: [
    { frequency: 880, duration: 0.055, delay: 0, volume: 0.04, type: "sine" },
    { frequency: 1175, duration: 0.105, delay: 0.07, volume: 0.034, type: "sine" },
  ],
  reminder: [
    { frequency: 740, duration: 0.085, delay: 0, volume: 0.046, type: "triangle" },
    { frequency: 988, duration: 0.085, delay: 0.09, volume: 0.042, type: "triangle" },
    { frequency: 740, duration: 0.12, delay: 0.19, volume: 0.034, type: "sine" },
  ],
};
