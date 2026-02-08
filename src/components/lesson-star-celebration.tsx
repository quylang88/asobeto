"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface LessonStarCelebrationProps {
  stars: number;
}

const STAR_SPARKLES = [
  { id: 1, x: -62, y: -38, delay: 0.05 },
  { id: 2, x: -34, y: -74, delay: 0.14 },
  { id: 3, x: 0, y: -90, delay: 0.21 },
  { id: 4, x: 34, y: -74, delay: 0.12 },
  { id: 5, x: 62, y: -38, delay: 0.18 },
  { id: 6, x: -48, y: 12, delay: 0.09 },
  { id: 7, x: 48, y: 12, delay: 0.16 },
];

function getStarOffsets(stars: number): number[] {
  const normalizedStars = Math.max(1, Math.min(3, Math.round(stars)));
  if (normalizedStars === 1) return [0];
  if (normalizedStars === 2) return [-68, 68];
  return [-112, 0, 112];
}

export function LessonStarCelebration({ stars }: LessonStarCelebrationProps) {
  const starOffsets = getStarOffsets(stars);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      aria-hidden
    >
      <motion.div
        className="absolute left-1/2 top-[34%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/22 backdrop-blur-xs"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: [0.88, 1.02, 0.92], opacity: [0.36, 0.62, 0.44] }}
        exit={{ opacity: 0, scale: 0.82 }}
        transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-[34%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(254,240,138,0.55),rgba(254,240,138,0.18),transparent_74%)]"
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: [0.86, 1.03, 0.94], opacity: [0.54, 0.92, 0.62] }}
        exit={{ opacity: 0, scale: 0.84 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-[34%] h-82 w-82 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,rgba(254,249,195,0),rgba(254,249,195,0.32),rgba(254,249,195,0))]"
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: [0.2, 0.36, 0.2] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      {STAR_SPARKLES.map((sparkle) => (
        <motion.div
          key={`lesson-star-sparkle-${sparkle.id}`}
          className="absolute left-1/2 top-[34%]"
          initial={{
            opacity: 0,
            scale: 0.35,
            x: sparkle.x,
            y: sparkle.y + 8,
          }}
          animate={{
            opacity: [0.24, 0.9, 0.28],
            scale: [0.44, 1, 0.54],
            x: [sparkle.x - 4, sparkle.x + 4, sparkle.x - 4],
            y: [sparkle.y + 6, sparkle.y - 8, sparkle.y + 6],
            rotate: [-10, 8, -10],
          }}
          exit={{ opacity: 0, scale: 0.2 }}
          transition={{
            duration: 1.8,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Star className="h-7 w-7 fill-yellow-200 text-yellow-50 drop-shadow-[0_0_24px_rgba(250,204,21,0.95)]" />
        </motion.div>
      ))}

      {starOffsets.map((offsetX, index) => (
        <motion.div
          key={`lesson-earned-star-${index}`}
          className="absolute left-1/2 top-[34%]"
          initial={{ opacity: 0, x: 0, y: 280, scale: 0.4, rotate: 0 }}
          animate={{ opacity: 1, x: offsetX, y: 0, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.86 }}
          transition={{
            duration: 1.05,
            delay: index * 0.08,
            ease: [0.2, 0.85, 0.2, 1],
          }}
        >
          <motion.div
            className="absolute left-1/2 top-1/2 h-26 w-26 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-100/72 blur-2xl"
            animate={{ opacity: [0.5, 0.88, 0.56], scale: [0.92, 1.08, 0.96] }}
            transition={{ duration: 1.32, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            animate={{
              scale: [1, 1.07, 0.98, 1.03, 1],
              rotate: [-5, 5, -4, 4, -5],
            }}
            transition={{
              duration: 1.68,
              delay: 1 + index * 0.12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Star
              className="h-24 w-24 fill-yellow-bright text-yellow-50 drop-shadow-[0_0_44px_rgba(250,204,21,0.95)]"
              strokeWidth={2.4}
            />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}
