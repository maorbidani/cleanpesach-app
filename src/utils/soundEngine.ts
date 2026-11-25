// Web Audio API micro-sounds and ambient background music / focus soundscapes (zero external assets)

let audioCtx: AudioContext | null = null;
let globalMuted = false;
let ambientVolume = 0.55; // 0..1 user-controlled volume

export type AmbientSoundscapeType = 'spring' | 'piano' | 'rain' | 'harmonic';
export type BackgroundMusicTrack = 'none' | 'spring' | 'piano' | 'rain';

interface ActiveSoundscape {
  type: AmbientSoundscapeType;
  setVolume: (vol: number) => void;
  stop: (immediate?: boolean) => void;
}

let activeSoundscape: ActiveSoundscape | null = null;
const soundscapeListeners = new Set<
  (type: AmbientSoundscapeType | null) => void
>();

function notifySoundscapeListeners() {
  const current = activeSoundscape?.type ?? null;
  soundscapeListeners.forEach((listener) => {
    try {
      listener(current);
    } catch {
      // Ignore listener errors
    }
  });
}

export function subscribeToSoundscapeChange(
  listener: (type: AmbientSoundscapeType | null) => void
): () => void {
  soundscapeListeners.add(listener);
  return () => {
    soundscapeListeners.delete(listener);
  };
}

export function getActiveSoundscapeType(): AmbientSoundscapeType | null {
  return activeSoundscape?.type ?? null;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;

  if (!audioCtx) {
    audioCtx = new Ctor();
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume();
  }
  return audioCtx;
}

export function setSoundMuted(muted: boolean) {
  globalMuted = muted;
  if (muted) {
    stopAmbientSoundscape();
  }
}

export function isSoundMuted(): boolean {
  return globalMuted;
}

export function getAmbientVolume(): number {
  return ambientVolume;
}

export function setAmbientVolume(volume0to1: number) {
  const clamped = Number.isFinite(volume0to1)
    ? Math.max(0, Math.min(1, volume0to1))
    : 0.55;
  ambientVolume = clamped;
  activeSoundscape?.setVolume(clamped);
}

/**
 * Plays a gentle ascending two-note bell/sparkle sound when a task is completed.
 */
export function playTaskCompleteChime() {
  if (globalMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [659.25, 880]; // E5 -> A5 warm chime

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.085;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.11, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.46);
  });
}

/**
 * Plays a warm celebratory spring arpeggio when a room is locked as chametz-free.
 */
export function playRoomLockFanfare() {
  if (globalMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6

  notes.forEach((freq, idx) => {
    const start = now + idx * 0.095;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx === notes.length - 1 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.1, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(start);
    osc.stop(start + 0.76);
  });
}

function getTargetMasterGain(type: AmbientSoundscapeType, volume: number): number {
  const baseScale =
    type === 'rain'
      ? 0.28
      : type === 'spring'
      ? 0.24
      : type === 'piano'
      ? 0.28
      : 0.22;
  return Math.max(0.0001, volume * baseScale);
}

/**
 * Starts a clean, loop-controlled ambient music track or focus soundscape.
 */
export function startAmbientSoundscape(type: AmbientSoundscapeType = 'rain') {
  stopAmbientSoundscape(false, true);
  if (globalMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  masterGain.gain.linearRampToValueAtTime(
    getTargetMasterGain(type, ambientVolume),
    ctx.currentTime + 0.45
  );
  masterGain.connect(ctx.destination);

  const cleanupNodes: Array<{ stop?: () => void; disconnect: () => void }> = [];
  const intervalIds: number[] = [];
  let stopped = false;

  if (type === 'rain') {
    // Soft pink noise buffer -> gentle lowpass filter -> subtle breathing LFO
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(920, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.11, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(240, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noiseSource.connect(filter);
    filter.connect(masterGain);

    noiseSource.start();
    lfo.start();
    cleanupNodes.push(noiseSource, lfo, filter, lfoGain);
  } else if (type === 'spring') {
    // Rhythmic upbeat gentle spring melody (warm marimba/kalimba-like arpeggios)
    const melodyPattern = [
      523.25, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 783.99,
      698.46, 880.0, 1046.5, 880.0, 783.99, 659.25, 587.33, 659.25,
    ];
    const bassPattern = [130.81, 130.81, 174.61, 196.0]; // C3, C3, F3, G3
    let step = 0;

    const playSpringStep = () => {
      if (stopped || globalMuted) return;
      const now = ctx.currentTime;
      const freq = melodyPattern[step % melodyPattern.length];

      // Pluck lead voice
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.32, now + 0.015);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.38);

      // Gentle bass pulse on every 4th eighth-note
      if (step % 4 === 0) {
        const bassFreq = bassPattern[Math.floor(step / 4) % bassPattern.length];
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq, now);

        bassGain.gain.setValueAtTime(0.0001, now);
        bassGain.gain.exponentialRampToValueAtTime(0.28, now + 0.025);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.72);

        bassOsc.connect(bassGain);
        bassGain.connect(masterGain);
        bassOsc.start(now);
        bassOsc.stop(now + 0.76);
      }

      step += 1;
    };

    playSpringStep();
    const id = window.setInterval(playSpringStep, 270);
    intervalIds.push(id);
  } else if (type === 'piano') {
    // Calm soft felt-piano chord progression: Cmaj7 -> Am7 -> Fmaj7 -> G6
    const progressions: number[][] = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 329.63], // G6
    ];
    let chordIndex = 0;

    const playPianoChord = () => {
      if (stopped || globalMuted) return;
      const now = ctx.currentTime;
      const notes = progressions[chordIndex % progressions.length];

      notes.forEach((freq, idx) => {
        const start = now + idx * 0.09; // gentle rolled piano chord
        const fundamental = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const env = ctx.createGain();

        fundamental.type = 'sine';
        fundamental.frequency.setValueAtTime(freq, start);

        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2, start);

        const overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(0.14, start);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, start);
        filter.frequency.exponentialRampToValueAtTime(420, start + 2.2);

        env.gain.setValueAtTime(0.0001, start);
        env.gain.linearRampToValueAtTime(0.18, start + 0.04);
        env.gain.exponentialRampToValueAtTime(0.0001, start + 2.5);

        fundamental.connect(filter);
        overtone.connect(overtoneGain);
        overtoneGain.connect(filter);
        filter.connect(env);
        env.connect(masterGain);

        fundamental.start(start);
        overtone.start(start);
        fundamental.stop(start + 2.55);
        overtone.stop(start + 2.55);
      });

      chordIndex += 1;
    };

    playPianoChord();
    const id = window.setInterval(playPianoChord, 2200);
    intervalIds.push(id);
  } else {
    // Harmonic warm focus pad (174 Hz + 261.63 Hz + 329.63 Hz soft sine tones)
    const freqs = [174, 261.63, 329.63];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      oscGain.gain.setValueAtTime(idx === 0 ? 0.25 : 0.14, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      cleanupNodes.push(osc, oscGain);
    });
  }

  let cleanupTimeoutId: number | null = null;

  activeSoundscape = {
    type,
    setVolume: (vol: number) => {
      if (stopped) return;
      const liveCtx = getAudioContext();
      if (!liveCtx) return;
      try {
        masterGain.gain.setTargetAtTime(
          getTargetMasterGain(type, vol),
          liveCtx.currentTime,
          0.06
        );
      } catch {
        // Ignore gain automation errors
      }
    },
    stop: (immediate = false) => {
      if (stopped) return;
      stopped = true;
      intervalIds.forEach((id) => window.clearInterval(id));
      if (cleanupTimeoutId !== null) {
        window.clearTimeout(cleanupTimeoutId);
        cleanupTimeoutId = null;
      }

      const disconnectAll = () => {
        cleanupNodes.forEach((node) => {
          try {
            node.stop?.();
          } catch {
            // Ignore stop errors
          }
          try {
            node.disconnect();
          } catch {
            // Ignore disconnect errors
          }
        });
        try {
          masterGain.disconnect();
        } catch {
          // Ignore disconnect errors
        }
      };

      if (immediate) {
        disconnectAll();
        return;
      }

      const stopCtx = getAudioContext();
      if (stopCtx) {
        const now = stopCtx.currentTime;
        try {
          masterGain.gain.cancelScheduledValues(now);
          masterGain.gain.setValueAtTime(masterGain.gain.value, now);
          masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
        } catch {
          // Ignore ramp errors
        }
      }

      cleanupTimeoutId = window.setTimeout(() => {
        cleanupTimeoutId = null;
        disconnectAll();
      }, 280);
    },
  };

  notifySoundscapeListeners();
}

export function stopAmbientSoundscape(notify = true, immediate = false) {
  if (activeSoundscape) {
    activeSoundscape.stop(immediate);
    activeSoundscape = null;
    if (notify) {
      notifySoundscapeListeners();
    }
  }
}
