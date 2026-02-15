"use client";

import { useCallback, useEffect, useRef } from "react";
import { audioManager } from "@/lib/audio-manager";

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
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const stopAudio = useCallback(() => {
    if (currentSourceRef.current) {
      audioManager.stop(currentSourceRef.current);
      currentSourceRef.current = null;
    }
  }, []);

  const playAudio = useCallback(
    (src: string) => {
      stopAudio();
      audioManager
        .load(src)
        .then(() => {
          // If the user stopped audio while loading, don't play.
          // But currentSourceRef might be null if stopped.
          // However, simpler is just to play, and if stopped immediately, the handle is lost?
          // No, we need to track if we should still play.
          // For manual play, we assume we want to play.
          const source = audioManager.play(src, {
            onEnded: () => {
              if (currentSourceRef.current === source) {
                currentSourceRef.current = null;
              }
            },
          });
          if (source) {
            currentSourceRef.current = source;
          }
        })
        .catch(() => {});
    },
    [stopAudio],
  );

  const playOneShotAudio = useCallback((src: string) => {
    audioManager.play(src);
  }, []);

  // Auto-play intro audio first, then main lesson audio.
  useEffect(() => {
    if (!currentLessonId) return;

    const introAudio = currentLessonIntroVoice?.trim();
    const mainAudio = currentLessonMainAudio;
    if (!introAudio && !mainAudio) return;

    let isCancelled = false;

    stopAudio();

    const playMainAudioPart = async () => {
      if (!mainAudio) return;
      try {
        await audioManager.load(mainAudio);
        if (isCancelled) return;
        const source = audioManager.play(mainAudio, {
          onEnded: () => {
            if (currentSourceRef.current === source) {
              currentSourceRef.current = null;
            }
          },
        });
        if (source) {
          currentSourceRef.current = source;
        }
      } catch (err) {
        console.error("Failed to play main audio", err);
      }
    };

    const playSequence = async () => {
      if (introAudio) {
        try {
          await audioManager.load(introAudio);
          if (isCancelled) return;

          const shouldChainMainAudio =
            Boolean(mainAudio) && introAudio !== mainAudio;

          const source = audioManager.play(introAudio, {
            onEnded: () => {
              if (currentSourceRef.current === source) {
                currentSourceRef.current = null;
              }
              if (shouldChainMainAudio && !isCancelled) {
                playMainAudioPart();
              }
            },
          });
          if (source) {
            currentSourceRef.current = source;
          }
        } catch (err) {
          console.error("Failed to play intro audio", err);
          // If intro fails, try main immediately
          if (!isCancelled && mainAudio) {
            playMainAudioPart();
          }
        }
      } else if (mainAudio) {
        playMainAudioPart();
      }
    };

    playSequence();

    return () => {
      isCancelled = true;
      stopAudio();
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
