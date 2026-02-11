"use client";

const audioCache = new Map<string, HTMLAudioElement>();
const lastPlayAtCache = new Map<string, number>();

interface PlayCelebrationAudioOptions {
  retries?: number;
  retryDelayMs?: number;
  dedupeWindowMs?: number;
}

function normalizeSource(src: string): string {
  return src.trim();
}

function canUseAudio(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function getCachedAudio(src: string): HTMLAudioElement {
  const normalizedSource = normalizeSource(src);
  const existing = audioCache.get(normalizedSource);
  if (existing) {
    return existing;
  }

  const audio = new Audio(normalizedSource);
  audio.preload = "auto";
  audioCache.set(normalizedSource, audio);
  return audio;
}

export function preloadCelebrationAudio(src: string): void {
  if (!canUseAudio()) return;
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;

  const audio = getCachedAudio(normalizedSource);
  if (!audio.paused) {
    // Never force a reload while this source is already playing.
    return;
  }
  if (audio.readyState === 0) {
    audio.load();
  }
}

export function playCelebrationAudio(
  src: string,
  options: PlayCelebrationAudioOptions = {},
): void {
  if (!canUseAudio()) return;
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;

  const retries = Math.max(0, options.retries ?? 1);
  const retryDelayMs = Math.max(40, options.retryDelayMs ?? 120);
  const dedupeWindowMs = Math.max(0, options.dedupeWindowMs ?? 900);
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const lastPlayedAt = lastPlayAtCache.get(normalizedSource);
  if (
    typeof lastPlayedAt === "number" &&
    dedupeWindowMs > 0 &&
    now - lastPlayedAt < dedupeWindowMs
  ) {
    return;
  }
  lastPlayAtCache.set(normalizedSource, now);
  const audio = getCachedAudio(normalizedSource);
  if (!audio.paused && !audio.ended) {
    return;
  }

  const attemptPlay = (remainingRetries: number) => {
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (!playPromise) return;
      playPromise.catch(() => {
        if (remainingRetries <= 0) return;
        window.setTimeout(() => {
          attemptPlay(remainingRetries - 1);
        }, retryDelayMs);
      });
    } catch {
      if (remainingRetries <= 0) return;
      window.setTimeout(() => {
        attemptPlay(remainingRetries - 1);
      }, retryDelayMs);
    }
  };

  attemptPlay(retries);
}
