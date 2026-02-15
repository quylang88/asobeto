"use client";

import { audioManager } from "@/lib/audio-manager";

const lastPlayAtCache = new Map<string, number>();

interface PlayCelebrationAudioOptions {
  dedupeWindowMs?: number;
  volume?: number;
}

function normalizeSource(src: string): string {
  return src.trim();
}

export function preloadCelebrationAudio(src: string): void {
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;
  audioManager.preload([normalizedSource]);
}

export function playCelebrationAudio(
  src: string,
  options: PlayCelebrationAudioOptions = {},
): void {
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;

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

  // Use a slightly lower volume for celebration effects if not specified
  const volume = options.volume ?? 0.8;

  audioManager.play(normalizedSource, { volume });
}
