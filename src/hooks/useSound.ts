import { useCallback, useRef, useState } from 'react';

export type SoundName = 'tick' | 'siren' | 'stamp' | 'success' | 'error';

const MUTE_KEY = 'delulu:v1:muted';

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const win = window as typeof window & { webkitAudioContext?: AudioContextConstructor };
  return win.AudioContext ?? win.webkitAudioContext ?? null;
}

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeMuted(value: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, String(value));
  } catch {
    // Storage unavailable; mute still works for this session.
  }
}

function blip(
  ctx: AudioContext,
  options: {
    frequency: number;
    endFrequency?: number;
    duration: number;
    type?: OscillatorType;
    volume?: number;
    delay?: number;
  }
): void {
  const start = ctx.currentTime + (options.delay ?? 0);
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  const volume = options.volume ?? 0.05;

  oscillator.type = options.type ?? 'sine';
  oscillator.frequency.setValueAtTime(options.frequency, start);
  if (options.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, options.endFrequency), start + options.duration);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + options.duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + options.duration + 0.02);
}

export function useSound() {
  const [muted, setMuted] = useState<boolean>(readMuted);
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureAudio = useCallback((): AudioContext | null => {
    const Constructor = getAudioContextConstructor();
    if (!Constructor) {
      return null;
    }
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = new Constructor();
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (muted) {
        return;
      }
      const ctx = ensureAudio();
      if (!ctx) {
        return;
      }

      switch (name) {
        case 'tick':
          blip(ctx, { frequency: 880, duration: 0.035, type: 'square', volume: 0.025 });
          break;
        case 'siren':
          blip(ctx, { frequency: 620, endFrequency: 940, duration: 0.22, type: 'sawtooth', volume: 0.03 });
          blip(ctx, {
            frequency: 940,
            endFrequency: 620,
            duration: 0.22,
            type: 'sawtooth',
            volume: 0.03,
            delay: 0.22,
          });
          break;
        case 'stamp':
          blip(ctx, { frequency: 120, endFrequency: 42, duration: 0.22, type: 'sine', volume: 0.22 });
          blip(ctx, { frequency: 240, endFrequency: 80, duration: 0.08, type: 'triangle', volume: 0.08 });
          break;
        case 'success':
          [523.25, 659.25, 783.99].forEach((frequency, index) => {
            blip(ctx, {
              frequency,
              duration: 0.16,
              type: 'triangle',
              volume: 0.045,
              delay: index * 0.09,
            });
          });
          break;
        case 'error':
          blip(ctx, { frequency: 320, endFrequency: 150, duration: 0.3, type: 'square', volume: 0.035 });
          break;
        default:
          break;
      }
    },
    [ensureAudio, muted]
  );

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      writeMuted(next);
      return next;
    });
  }, []);

  return { muted, toggleMuted, play, ensureAudio };
}
