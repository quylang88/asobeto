"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { FlyingStarProps } from "../types";

export function FlyingStar({
  startX,
  startY,
  midX,
  midY,
  endX,
  endY,
  delay,
  duration,
}: FlyingStarProps) {
  return (
    <motion.div
      className="fixed left-0 top-0 z-50 pointer-events-none"
      initial={{ x: startX, y: startY, scale: 0.84, opacity: 0 }}
      animate={{
        x: [startX, midX, endX],
        y: [startY, midY, endY],
        scale: [0.84, 1.1, 0.96],
        rotate: [0, 200, 360],
        opacity: [0, 1, 1],
      }}
      transition={{
        x: { duration, delay, ease: "linear", times: [0, 0.48, 1] },
        y: { duration, delay, ease: "linear", times: [0, 0.48, 1] },
        rotate: { duration, delay, ease: "linear", times: [0, 0.48, 1] },
        scale: { duration, delay, ease: "easeOut", times: [0, 0.48, 1] },
        opacity: { duration, delay, ease: "linear", times: [0, 0.2, 1] },
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          boxShadow:
            "0 0 0 5px rgba(251,191,36,0.34), 0 0 26px rgba(245,158,11,0.72)",
        }}
      />
      <Star
        className="relative h-10 w-10 text-amber-900 fill-yellow-300"
        strokeWidth={2.4}
        style={{
          filter:
            "drop-shadow(0 0 8px rgba(251,191,36,0.95)) drop-shadow(0 0 2px rgba(255,255,255,0.95))",
        }}
      />
    </motion.div>
  );
}
