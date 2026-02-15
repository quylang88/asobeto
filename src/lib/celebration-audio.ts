"use client";

import { playAppAudio, preloadAppAudio } from "@/lib/app-audio";

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

export function preloadCelebrationAudio(src: string): void {
  if (!canUseAudio()) return;
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;

  preloadAppAudio(normalizedSource);
}

export function playCelebrationAudio(
  src: string,
  options: PlayCelebrationAudioOptions = {},
): void {
  if (!canUseAudio()) return;
  const normalizedSource = normalizeSource(src);
  if (!normalizedSource) return;

  playAppAudio(normalizedSource, {
    allowOverlap: false,
    dedupeWindowMs: Math.max(0, options.dedupeWindowMs ?? 900),
    retries: Math.max(0, options.retries ?? 1),
    retryDelayMs: Math.max(40, options.retryDelayMs ?? 120),
  });
}
