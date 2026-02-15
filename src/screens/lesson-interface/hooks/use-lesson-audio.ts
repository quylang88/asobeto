"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  playAppAudio,
  playManagedAppAudio,
  preloadAppAudioList,
  stopAllAppAudio,
  type ManagedAudioPlayback,
} from "@/lib/app-audio";

interface UseLessonAudioParams {
  currentStep: number;
  currentLessonId: string | undefined;
  currentLessonIntroVoice: string | undefined;
  currentLessonMainAudio: string | undefined;
}

export function useLessonAudio({
  currentStep,
  currentLessonId,
  currentLessonIntroVoice,
  currentLessonMainAudio,
}: UseLessonAudioParams) {
  const audioRef = useRef<ManagedAudioPlayback | null>(null);

  const stopAudio = useCallback(() => {
    audioRef.current?.stop();
    audioRef.current = null;
    stopAllAppAudio();
  }, []);

  const playAudio = useCallback(
    (src: string) => {
      stopAudio();
      const playback = playManagedAppAudio(src, {
        retries: 2,
        retryDelayMs: 120,
      });
      audioRef.current = playback;
    },
    [stopAudio],
  );

  const playOneShotAudio = useCallback((src: string) => {
    playAppAudio(src, {
      allowOverlap: true,
      retries: 1,
      retryDelayMs: 80,
    });
  }, []);

  // Auto-play intro audio first, then main lesson audio.
  useEffect(() => {
    if (!currentLessonId) return;

    const introAudio = currentLessonIntroVoice?.trim();
    const mainAudio = currentLessonMainAudio;
    if (!introAudio && !mainAudio) return;

    preloadAppAudioList([introAudio, mainAudio]);

    let isCancelled = false;
    let primaryAudio: ManagedAudioPlayback | null = null;
    let followUpAudio: ManagedAudioPlayback | null = null;
    let autoplayTimeoutId: number | null = null;

    stopAudio();

    autoplayTimeoutId = window.setTimeout(() => {
      if (isCancelled) return;

      const playMainAudio = () => {
        if (isCancelled || !mainAudio) {
          return;
        }
        followUpAudio = playManagedAppAudio(mainAudio, {
          retries: 2,
          retryDelayMs: 120,
        });
        audioRef.current = followUpAudio;
      };

      if (introAudio) {
        const shouldChainMainAudio =
          Boolean(mainAudio) && introAudio !== mainAudio;
        primaryAudio = playManagedAppAudio(introAudio, {
          retries: 2,
          retryDelayMs: 120,
          onEnded: shouldChainMainAudio ? playMainAudio : undefined,
          onError: shouldChainMainAudio ? playMainAudio : undefined,
        });
        audioRef.current = primaryAudio;
      } else if (mainAudio) {
        primaryAudio = playManagedAppAudio(mainAudio, {
          retries: 2,
          retryDelayMs: 120,
        });
        audioRef.current = primaryAudio;
      }
    }, 0);

    return () => {
      isCancelled = true;
      if (autoplayTimeoutId !== null) {
        window.clearTimeout(autoplayTimeoutId);
      }
      primaryAudio?.stop();
      followUpAudio?.stop();
    };
  }, [
    currentStep,
    currentLessonId,
    currentLessonIntroVoice,
    currentLessonMainAudio,
    stopAudio,
  ]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return {
    playAudio,
    playOneShotAudio,
    stopAudio,
  };
}
