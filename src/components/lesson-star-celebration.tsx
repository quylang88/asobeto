"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface LessonStarCelebrationProps {
  stars: number;
}

const LIGHT_RAYS = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  rotate: index * 30,
  delay: (index % 4) * 0.12,
  duration: 1.8 + (index % 3) * 0.35,
}));

const GLINT_POINTS = [
  { id: 1, x: -130, y: -52, delay: 0.05 },
  { id: 2, x: -92, y: -106, delay: 0.16 },
  { id: 3, x: -30, y: -132, delay: 0.08 },
  { id: 4, x: 40, y: -128, delay: 0.22 },
  { id: 5, x: 98, y: -100, delay: 0.12 },
  { id: 6, x: 132, y: -44, delay: 0.2 },
  { id: 7, x: 126, y: 24, delay: 0.1 },
  { id: 8, x: 66, y: 88, delay: 0.18 },
  { id: 9, x: -74, y: 90, delay: 0.14 },
  { id: 10, x: -126, y: 26, delay: 0.24 },
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
        animate={{ scale: [0.86, 1.05, 0.9], opacity: [0.32, 0.66, 0.38] }}
        exit={{ opacity: 0, scale: 0.82 }}
        transition={{ duration: 1.45, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-[34%] h-[16.5rem] w-[16.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(254,240,138,0.74),rgba(254,240,138,0.25),transparent_72%)]"
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: [0.84, 1.08, 0.9], opacity: [0.6, 0.98, 0.66] }}
        exit={{ opacity: 0, scale: 0.84 }}
        transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-[34%] h-[21rem] w-[21rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,rgba(254,249,195,0),rgba(254,249,195,0.42),rgba(254,249,195,0))]"
        initial={{ rotate: 0, opacity: 0 }}
        animate={{ rotate: 360, opacity: [0.18, 0.4, 0.18] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 5.6, repeat: Infinity, ease: "linear" }}
      />

      {LIGHT_RAYS.map((ray) => (
        <motion.div
          key={`lesson-star-ray-${ray.id}`}
          className="absolute left-1/2 top-[34%]"
          initial={{
            opacity: 0,
            scaleY: 0.6,
            scaleX: 0.9,
            rotate: ray.rotate,
          }}
          animate={{
            opacity: [0.15, 0.52, 0.2],
            scaleY: [0.7, 1.16, 0.74],
            scaleX: [0.88, 1.05, 0.88],
            rotate: [ray.rotate - 2, ray.rotate + 2, ray.rotate - 2],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: ray.duration,
            delay: ray.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="h-36 w-2 -translate-y-28 rounded-full bg-linear-to-b from-yellow-100/0 via-yellow-100/85 to-yellow-100/0 blur-[1.5px]" />
        </motion.div>
      ))}

      {GLINT_POINTS.map((glint) => (
        <motion.div
          key={`lesson-star-glint-${glint.id}`}
          className="absolute left-1/2 top-[34%]"
          initial={{ opacity: 0, x: glint.x, y: glint.y, scale: 0.4 }}
          animate={{
            opacity: [0.2, 0.95, 0.24],
            scale: [0.45, 1.08, 0.5],
            x: [glint.x - 3, glint.x + 4, glint.x - 3],
            y: [glint.y + 2, glint.y - 4, glint.y + 2],
          }}
          exit={{ opacity: 0, scale: 0.2 }}
          transition={{
            duration: 1.55,
            delay: glint.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="h-4 w-4 rotate-45 rounded-[2px] bg-yellow-100 shadow-[0_0_20px_rgba(254,240,138,0.95)]" />
        </motion.div>
      ))}

      {starOffsets.map((offsetX, index) => (
        <motion.div
          key={`lesson-earned-star-${index}`}
          className="absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2"
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
            className="absolute left-1/2 top-1/2 h-[6.5rem] w-[6.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-100/72 blur-2xl"
            animate={{ opacity: [0.52, 0.9, 0.58], scale: [0.9, 1.12, 0.95] }}
            transition={{ duration: 1.38, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 0.97, 1.06, 1],
              rotate: [-4, 6, -4, 5, -4],
            }}
            transition={{
              duration: 1.62,
              delay: 0.95 + index * 0.1,
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
