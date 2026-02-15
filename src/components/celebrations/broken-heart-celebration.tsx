"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import {
  playCelebrationAudio,
  preloadCelebrationAudio,
} from "@/lib/app-audio";

const DEFAULT_BROKEN_HEART_SOUND = "/assets/audio/feedback/wrong-answer.mp3";

const SHARDS = [
  { id: 1, x: -126, y: -76, delay: 0.06, duration: 1.2 },
  { id: 2, x: -92, y: -124, delay: 0.12, duration: 1.26 },
  { id: 3, x: -30, y: -138, delay: 0.09, duration: 1.16 },
  { id: 4, x: 58, y: -130, delay: 0.18, duration: 1.28 },
  { id: 5, x: 114, y: -86, delay: 0.14, duration: 1.2 },
  { id: 6, x: 136, y: -26, delay: 0.24, duration: 1.34 },
  { id: 7, x: 104, y: 58, delay: 0.16, duration: 1.22 },
  { id: 8, x: 28, y: 108, delay: 0.2, duration: 1.3 },
  { id: 9, x: -68, y: 100, delay: 0.18, duration: 1.24 },
  { id: 10, x: -130, y: 46, delay: 0.28, duration: 1.32 },
];

interface BrokenHeartCelebrationProps {
  muteSound?: boolean;
  soundSrc?: string;
}

export function BrokenHeartCelebration({
  muteSound = false,
  soundSrc = DEFAULT_BROKEN_HEART_SOUND,
}: BrokenHeartCelebrationProps) {
  useEffect(() => {
    if (muteSound || typeof window === "undefined") return;
    preloadCelebrationAudio(soundSrc);
    playCelebrationAudio(soundSrc, { retries: 2, retryDelayMs: 140 });
  }, [muteSound, soundSrc]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 bg-radial-[circle_at_center] from-rose-400/25 via-rose-900/25 to-slate-900/38"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      <motion.div
        className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0.68, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ duration: 0.44, ease: [0.2, 0.85, 0.2, 1] }}
      >
        <div className="relative h-32 w-32">
          <motion.span
            className="absolute inset-0"
            initial={{ x: 0, y: 0, rotate: 0 }}
            animate={{ x: -18, y: 6, rotate: -14 }}
            transition={{ duration: 0.46, ease: "easeOut", delay: 0.14 }}
            style={{
              clipPath:
                "polygon(0 0, 62% 0, 57% 13%, 64% 24%, 53% 39%, 60% 52%, 49% 68%, 55% 82%, 50% 100%, 0 100%)",
            }}
          >
            <Heart className="h-32 w-32 fill-rose-500 text-rose-100 drop-shadow-[0_0_44px_rgba(251,113,133,0.9)]" />
          </motion.span>
          <motion.span
            className="absolute inset-0"
            initial={{ x: 0, y: 0, rotate: 0 }}
            animate={{ x: 18, y: 8, rotate: 12 }}
            transition={{ duration: 0.46, ease: "easeOut", delay: 0.14 }}
            style={{
              clipPath:
                "polygon(62% 0, 100% 0, 100% 100%, 50% 100%, 44% 82%, 51% 68%, 40% 52%, 47% 39%, 36% 24%, 43% 13%)",
            }}
          >
            <Heart className="h-32 w-32 fill-rose-500 text-rose-100 drop-shadow-[0_0_44px_rgba(251,113,133,0.9)]" />
          </motion.span>
        </div>
      </motion.div>

      {SHARDS.map((shard) => (
        <motion.div
          key={`broken-heart-shard-${shard.id}`}
          className="absolute left-1/2 top-[35%]"
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.35, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, shard.x],
            y: [0, shard.y + 28],
            scale: [0.35, 0.66, 0.24],
            rotate: [0, shard.x > 0 ? 54 : -54],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shard.duration,
            delay: shard.delay,
            ease: "easeOut",
          }}
        >
          <Heart className="h-6 w-6 fill-rose-300 text-rose-100/90" />
        </motion.div>
      ))}
    </motion.div>
  );
}
