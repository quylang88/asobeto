"use client";

import { useEffect, useState } from "react";
import { audioManager } from "@/lib/audio-manager";

export function AudioContextInitializer() {
  const [isResumed, setIsResumed] = useState(false);

  useEffect(() => {
    if (isResumed) return;

    const resumeAudio = () => {
      audioManager.resume().then(() => {
        setIsResumed(true);
        window.removeEventListener("touchstart", resumeAudio);
        window.removeEventListener("click", resumeAudio);
        window.removeEventListener("keydown", resumeAudio);
      });
    };

    window.addEventListener("touchstart", resumeAudio, { passive: true });
    window.addEventListener("click", resumeAudio);
    window.addEventListener("keydown", resumeAudio);

    return () => {
      window.removeEventListener("touchstart", resumeAudio);
      window.removeEventListener("click", resumeAudio);
      window.removeEventListener("keydown", resumeAudio);
    };
  }, [isResumed]);

  return null;
}
