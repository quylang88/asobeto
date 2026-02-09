"use client";

import { useCallback, useEffect, useRef } from "react";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
  }, []);

  const playAudio = useCallback(
    (src: string) => {
      stopAudio();
      const audio = new Audio(src);
      audioRef.current = audio;
      audio.play().catch((err) => console.log("Audio play failed:", err));
    },
    [stopAudio],
  );

  const playOneShotAudio = useCallback((src: string) => {
    const audio = new Audio(src);
    audio.play().catch((err) => console.log("Audio play failed:", err));
  }, []);

  // Auto-play intro audio first, then main lesson audio.
  useEffect(() => {
    if (!currentLessonId) return;

    const introAudio = currentLessonIntroVoice?.trim();
    const mainAudio = currentLessonMainAudio;
    if (!introAudio && !mainAudio) return;

    let isCancelled = false;
    let primaryAudio: HTMLAudioElement | null = null;
    let followUpAudio: HTMLAudioElement | null = null;

    stopAudio();

    const playAudioSource = (
      src: string,
      onEnded?: () => void,
    ): HTMLAudioElement => {
      const audio = new Audio(src);
      audioRef.current = audio;
      if (onEnded) {
        audio.addEventListener("ended", onEnded, { once: true });
        audio.addEventListener("error", onEnded, { once: true });
      }
      audio.play().catch((err) => console.log("Audio play failed:", err));
      return audio;
    };

    const playMainAudio = () => {
      if (isCancelled || !mainAudio) {
        return;
      }
      followUpAudio = playAudioSource(mainAudio);
    };

    if (introAudio) {
      const shouldChainMainAudio =
        Boolean(mainAudio) && introAudio !== mainAudio;
      primaryAudio = playAudioSource(
        introAudio,
        shouldChainMainAudio ? playMainAudio : undefined,
      );
    } else if (mainAudio) {
      primaryAudio = playAudioSource(mainAudio);
    }

    return () => {
      isCancelled = true;
      if (primaryAudio) {
        primaryAudio.pause();
        primaryAudio.currentTime = 0;
      }
      if (followUpAudio) {
        followUpAudio.pause();
        followUpAudio.currentTime = 0;
      }
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
