"use client";

export interface PlayAppAudioOptions {
  allowOverlap?: boolean;
  dedupeWindowMs?: number;
  playbackRate?: number;
  retries?: number;
  retryDelayMs?: number;
  volume?: number;
}

export interface PlayManagedAppAudioOptions {
  onEnded?: () => void;
  onError?: () => void;
  playbackRate?: number;
  retries?: number;
  retryDelayMs?: number;
  volume?: number;
}

export interface PlayCelebrationAudioOptions {
  retries?: number;
  retryDelayMs?: number;
  dedupeWindowMs?: number;
}

export interface ManagedAudioPlayback {
  stop: () => void;
}

interface WindowWithWebkitAudioContext extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const baseAudioCache = new Map<string, HTMLAudioElement>();
const oneShotPoolCache = new Map<string, HTMLAudioElement[]>();
const decodedBufferCache = new Map<string, AudioBuffer>();
const decodePromiseCache = new Map<string, Promise<AudioBuffer | null>>();
const lastPlayedAtCache = new Map<string, number>();
const activeManagedPlaybacks = new Set<ManagedAudioPlayback>();
const activeOneShotAudioElements = new Set<HTMLAudioElement>();

let audioContext: AudioContext | null = null;
let unlockListenersRegistered = false;

function normalizeSource(src: string): string {
  return src.trim();
}

function canUseAudio(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function nowMs(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function stopAndResetAudioElement(audio: HTMLAudioElement): void {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // Ignore when currentTime is not seekable.
  }
}

function registerManagedPlayback(stopImpl: () => void): {
  playback: ManagedAudioPlayback;
  release: () => void;
} {
  let released = false;
  const playback: ManagedAudioPlayback = {
    stop: () => {
      if (released) return;
      released = true;
      activeManagedPlaybacks.delete(playback);
      stopImpl();
    },
  };

  const release = () => {
    if (released) return;
    released = true;
    activeManagedPlaybacks.delete(playback);
  };

  activeManagedPlaybacks.add(playback);
  return { playback, release };
}

function trackOneShotAudioElement(audio: HTMLAudioElement): void {
  activeOneShotAudioElements.add(audio);

  const clearTracking = () => {
    activeOneShotAudioElements.delete(audio);
  };

  audio.addEventListener("ended", clearTracking, { once: true });
  audio.addEventListener("error", clearTracking, { once: true });
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (audioContext && audioContext.state !== "closed") {
    return audioContext;
  }

  const audioContextConstructor =
    window.AudioContext ||
    (window as WindowWithWebkitAudioContext).webkitAudioContext;
  if (!audioContextConstructor) return null;

  audioContext = new audioContextConstructor();
  return audioContext;
}

async function resumeAudioContext(): Promise<void> {
  const context = getAudioContext();
  if (!context || context.state !== "suspended") return;
  try {
    await context.resume();
  } catch {
    // Ignore resume failures before user interaction.
  }
}

function registerUnlockListeners(): void {
  if (unlockListenersRegistered || typeof window === "undefined") return;
  unlockListenersRegistered = true;

  const unlock = () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
    void resumeAudioContext();
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}

function getBaseAudio(src: string): HTMLAudioElement {
  const normalizedSource = normalizeSource(src);
  const cachedAudio = baseAudioCache.get(normalizedSource);
  if (cachedAudio) {
    return cachedAudio;
  }

  const audio = new Audio(normalizedSource);
  audio.preload = "auto";
  baseAudioCache.set(normalizedSource, audio);
  return audio;
}

function ensureAudioElementPreloaded(audio: HTMLAudioElement): void {
  if (audio.readyState === 0) {
    audio.load();
  }
}

function decodeAudioBuffer(src: string): Promise<AudioBuffer | null> {
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return Promise.resolve(null);

  const cachedBuffer = decodedBufferCache.get(normalizedSource);
  if (cachedBuffer) {
    return Promise.resolve(cachedBuffer);
  }

  const pendingDecode = decodePromiseCache.get(normalizedSource);
  if (pendingDecode) {
    return pendingDecode;
  }

  const context = getAudioContext();
  if (!context || typeof fetch === "undefined") {
    return Promise.resolve(null);
  }

  const decodePromise = fetch(normalizedSource, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Audio request failed with status ${response.status}`);
      }
      return response.arrayBuffer();
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer.slice(0)))
    .then((decodedBuffer) => {
      decodedBufferCache.set(normalizedSource, decodedBuffer);
      return decodedBuffer;
    })
    .catch(() => null)
    .finally(() => {
      decodePromiseCache.delete(normalizedSource);
    });

  decodePromiseCache.set(normalizedSource, decodePromise);
  return decodePromise;
}

function attemptHtmlAudioPlay(
  audio: HTMLAudioElement,
  retries: number,
  retryDelayMs: number,
  onFailure?: () => void,
): void {
  const playOnce = (remainingRetries: number) => {
    try {
      const playPromise = audio.play();
      if (!playPromise) return;
      playPromise.catch(() => {
        if (remainingRetries <= 0) {
          onFailure?.();
          return;
        }
        window.setTimeout(() => {
          playOnce(remainingRetries - 1);
        }, retryDelayMs);
      });
    } catch {
      if (remainingRetries <= 0) {
        onFailure?.();
        return;
      }
      window.setTimeout(() => {
        playOnce(remainingRetries - 1);
      }, retryDelayMs);
    }
  };

  playOnce(retries);
}

function getOneShotAudioElement(src: string, allowOverlap: boolean): HTMLAudioElement {
  const normalizedSource = normalizeSource(src);
  let pool = oneShotPoolCache.get(normalizedSource);

  if (!pool) {
    pool = [getBaseAudio(normalizedSource)];
    oneShotPoolCache.set(normalizedSource, pool);
  }

  if (!allowOverlap) {
    return pool[0];
  }

  const availableAudio = pool.find((audio) => audio.paused || audio.ended);
  if (availableAudio) {
    return availableAudio;
  }

  const clonedAudio = getBaseAudio(normalizedSource).cloneNode(
    true,
  ) as HTMLAudioElement;
  clonedAudio.preload = "auto";
  pool.push(clonedAudio);
  return clonedAudio;
}

function tryPlayDecodedBuffer(
  src: string,
  options: {
    playbackRate: number;
    volume: number;
    onEnded?: () => void;
    onError?: () => void;
  },
): ManagedAudioPlayback | null {
  const normalizedSource = normalizeSource(src);
  const decodedBuffer = decodedBufferCache.get(normalizedSource);
  if (!decodedBuffer) return null;

  const context = getAudioContext();
  if (!context) return null;

  const source = context.createBufferSource();
  source.buffer = decodedBuffer;
  source.playbackRate.value = options.playbackRate;

  const gainNode = context.createGain();
  gainNode.gain.value = options.volume;
  source.connect(gainNode);
  gainNode.connect(context.destination);

  let stopped = false;
  const cleanup = () => {
    source.onended = null;
    source.disconnect();
    gainNode.disconnect();
  };

  source.onended = () => {
    if (stopped) return;
    stopped = true;
    cleanup();
    options.onEnded?.();
  };

  try {
    source.start(0);
  } catch {
    cleanup();
    options.onError?.();
    return null;
  }

  return {
    stop: () => {
      if (stopped) return;
      stopped = true;
      try {
        source.stop(0);
      } catch {
        // Ignore when already stopped.
      }
      cleanup();
    },
  };
}

export function preloadAppAudio(src: string): void {
  if (!canUseAudio()) return;
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;

  registerUnlockListeners();

  const audio = getBaseAudio(normalizedSource);
  ensureAudioElementPreloaded(audio);
  void decodeAudioBuffer(normalizedSource);
}

export function preloadAppAudioList(
  sources: Array<string | null | undefined>,
): void {
  if (!canUseAudio()) return;

  const uniqueSources = new Set<string>();
  sources.forEach((source) => {
    const normalizedSource = normalizeSource(source ?? "");
    if (!normalizedSource) return;
    uniqueSources.add(normalizedSource);
  });

  uniqueSources.forEach((source) => {
    preloadAppAudio(source);
  });
}

export function playAppAudio(
  src: string,
  options: PlayAppAudioOptions = {},
): void {
  if (!canUseAudio()) return;
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;

  const dedupeWindowMs = Math.max(0, options.dedupeWindowMs ?? 0);
  if (dedupeWindowMs > 0) {
    const now = nowMs();
    const lastPlayedAt = lastPlayedAtCache.get(normalizedSource);
    if (
      typeof lastPlayedAt === "number" &&
      now - lastPlayedAt < dedupeWindowMs
    ) {
      return;
    }
    lastPlayedAtCache.set(normalizedSource, now);
  }

  const retries = Math.max(0, options.retries ?? 1);
  const retryDelayMs = Math.max(40, options.retryDelayMs ?? 120);
  const playbackRate = clampNumber(options.playbackRate ?? 1, 0.25, 4);
  const volume = clampNumber(options.volume ?? 1, 0, 1.25);
  const allowOverlap = options.allowOverlap ?? true;

  preloadAppAudio(normalizedSource);
  void resumeAudioContext();

  let releaseDecodedPlayback = () => {};
  const decodedPlayback = tryPlayDecodedBuffer(normalizedSource, {
    playbackRate,
    volume,
    onEnded: () => {
      releaseDecodedPlayback();
    },
    onError: () => {
      releaseDecodedPlayback();
    },
  });
  if (decodedPlayback) {
    const trackedPlayback = registerManagedPlayback(() => decodedPlayback.stop());
    releaseDecodedPlayback = trackedPlayback.release;
    return;
  }

  const audio = getOneShotAudioElement(normalizedSource, allowOverlap);
  ensureAudioElementPreloaded(audio);
  audio.playbackRate = playbackRate;
  audio.volume = volume;

  if (!allowOverlap) {
    audio.currentTime = 0;
  } else if (audio.paused || audio.ended) {
    audio.currentTime = 0;
  }

  trackOneShotAudioElement(audio);
  attemptHtmlAudioPlay(audio, retries, retryDelayMs, () => {
    activeOneShotAudioElements.delete(audio);
  });
}

export function playManagedAppAudio(
  src: string,
  options: PlayManagedAppAudioOptions = {},
): ManagedAudioPlayback | null {
  if (!canUseAudio()) return null;
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return null;

  const retries = Math.max(0, options.retries ?? 1);
  const retryDelayMs = Math.max(40, options.retryDelayMs ?? 120);
  const playbackRate = clampNumber(options.playbackRate ?? 1, 0.25, 4);
  const volume = clampNumber(options.volume ?? 1, 0, 1.25);

  preloadAppAudio(normalizedSource);
  void resumeAudioContext();

  let releaseDecodedPlayback = () => {};
  const decodedPlayback = tryPlayDecodedBuffer(normalizedSource, {
    playbackRate,
    volume,
    onEnded: () => {
      releaseDecodedPlayback();
      options.onEnded?.();
    },
    onError: () => {
      releaseDecodedPlayback();
      options.onError?.();
    },
  });

  if (decodedPlayback) {
    const trackedPlayback = registerManagedPlayback(() => decodedPlayback.stop());
    releaseDecodedPlayback = trackedPlayback.release;
    return trackedPlayback.playback;
  }

  const audio = getBaseAudio(normalizedSource).cloneNode(true) as HTMLAudioElement;
  audio.preload = "auto";
  audio.playbackRate = playbackRate;
  audio.volume = volume;
  audio.currentTime = 0;
  ensureAudioElementPreloaded(audio);

  let stopped = false;
  const trackedPlayback = registerManagedPlayback(() => {
    if (stopped) return;
    stopped = true;
    audio.onended = null;
    audio.onerror = null;
    stopAndResetAudioElement(audio);
  });

  audio.onended = () => {
    if (stopped) return;
    stopped = true;
    audio.onended = null;
    audio.onerror = null;
    trackedPlayback.release();
    options.onEnded?.();
  };

  audio.onerror = () => {
    if (stopped) return;
    stopped = true;
    audio.onended = null;
    audio.onerror = null;
    trackedPlayback.release();
    options.onError?.();
  };

  attemptHtmlAudioPlay(audio, retries, retryDelayMs, () => {
    if (stopped) return;
    stopped = true;
    audio.onended = null;
    audio.onerror = null;
    trackedPlayback.release();
    options.onError?.();
  });

  return trackedPlayback.playback;
}

export function stopAllAppAudio(): void {
  const managedPlaybacks = [...activeManagedPlaybacks];
  managedPlaybacks.forEach((playback) => {
    playback.stop();
  });

  const oneShotAudios = [...activeOneShotAudioElements];
  oneShotAudios.forEach((audio) => {
    stopAndResetAudioElement(audio);
  });
  activeOneShotAudioElements.clear();

  baseAudioCache.forEach((audio) => {
    stopAndResetAudioElement(audio);
  });

  oneShotPoolCache.forEach((audioPool) => {
    audioPool.forEach((audio) => {
      stopAndResetAudioElement(audio);
    });
  });

  lastPlayedAtCache.clear();
}

export function preloadCelebrationAudio(src: string): void {
  preloadAppAudio(src);
}

export function playCelebrationAudio(
  src: string,
  options: PlayCelebrationAudioOptions = {},
): void {
  playAppAudio(src, {
    allowOverlap: false,
    dedupeWindowMs: Math.max(0, options.dedupeWindowMs ?? 900),
    retries: Math.max(0, options.retries ?? 1),
    retryDelayMs: Math.max(40, options.retryDelayMs ?? 120),
  });
}
