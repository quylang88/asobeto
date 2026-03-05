"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface BossUnlockBurstProps {
  /** Center X of the boss tower in viewport px */
  centerX: number;
  /** Center Y of the boss tower in viewport px */
  centerY: number;
  /** Called once the entire burst sequence finishes */
  onComplete?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Radial spark particles that fly outward from the impact point      */
/* ------------------------------------------------------------------ */
const SPARK_COUNT = 14;
const SPARKS = Array.from({ length: SPARK_COUNT }, (_, i) => {
  const angle = (i / SPARK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
  const distance = 50 + Math.random() * 70;
  return {
    id: i,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    size: 3 + Math.random() * 4,
    delay: Math.random() * 0.06,
    duration: 0.45 + Math.random() * 0.25,
  };
});

/* Mini‑star fragments that scatter after the shockwave */
const STAR_FRAGMENT_COUNT = 6;
const STAR_FRAGMENTS = Array.from({ length: STAR_FRAGMENT_COUNT }, (_, i) => {
  const angle =
    (i / STAR_FRAGMENT_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
  const distance = 32 + Math.random() * 48;
  return {
    id: i,
    dx: Math.cos(angle) * distance,
    dy: Math.sin(angle) * distance,
    rotate: Math.random() * 360,
    delay: 0.08 + Math.random() * 0.1,
    duration: 0.55 + Math.random() * 0.2,
  };
});

function BossUnlockBurstInner({
  centerX,
  centerY,
  onComplete,
}: BossUnlockBurstProps) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden
      style={{ willChange: "transform" }}
    >
      {/* ---- Shockwave ring ---- */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: centerX,
          top: centerY,
          translateX: "-50%",
          translateY: "-50%",
          border: "3px solid rgba(253,224,71,0.7)",
          width: 0,
          height: 0,
        }}
        animate={{
          width: [0, 160, 240],
          height: [0, 160, 240],
          opacity: [0.9, 0.5, 0],
          borderWidth: ["3px", "2px", "1px"],
        }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      />

      {/* ---- Second ring, slightly delayed ---- */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: centerX,
          top: centerY,
          translateX: "-50%",
          translateY: "-50%",
          border: "2px solid rgba(251,191,36,0.5)",
          width: 0,
          height: 0,
        }}
        animate={{
          width: [0, 120, 200],
          height: [0, 120, 200],
          opacity: [0.7, 0.35, 0],
        }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.06 }}
      />

      {/* ---- Central flash ---- */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: centerX,
          top: centerY,
          translateX: "-50%",
          translateY: "-50%",
          width: 60,
          height: 60,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(253,224,71,0.8) 40%, rgba(251,191,36,0.3) 70%, transparent 100%)",
        }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{
          scale: [0.2, 2.2, 0],
          opacity: [0, 1, 0],
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* ---- Radial spark particles ---- */}
      {SPARKS.map((spark) => (
        <motion.div
          key={`spark-${spark.id}`}
          className="absolute rounded-full"
          style={{
            left: centerX,
            top: centerY,
            translateX: "-50%",
            translateY: "-50%",
            width: spark.size,
            height: spark.size,
            background:
              "radial-gradient(circle, #FDE047 0%, #FBBF24 60%, transparent 100%)",
            boxShadow: "0 0 4px 1px rgba(251,191,36,0.6)",
          }}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: spark.dx,
            y: spark.dy,
            scale: [1, 0.8, 0],
            opacity: [1, 0.7, 0],
          }}
          transition={{
            duration: spark.duration,
            delay: spark.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* ---- Mini star fragments ---- */}
      {STAR_FRAGMENTS.map((frag) => (
        <motion.div
          key={`frag-${frag.id}`}
          className="absolute"
          style={{
            left: centerX,
            top: centerY,
            translateX: "-50%",
            translateY: "-50%",
          }}
          initial={{ x: 0, y: 0, scale: 0.6, opacity: 1, rotate: 0 }}
          animate={{
            x: frag.dx,
            y: frag.dy,
            scale: [0.6, 0.8, 0],
            opacity: [1, 0.8, 0],
            rotate: frag.rotate,
          }}
          transition={{
            duration: frag.duration,
            delay: frag.delay,
            ease: "easeOut",
          }}
        >
          <Star
            className="h-4 w-4 fill-yellow-300 text-amber-600"
            strokeWidth={2}
            style={{
              filter: "drop-shadow(0 0 4px rgba(253,224,71,0.8))",
            }}
          />
        </motion.div>
      ))}

      {/* ---- Soft golden overlay flash (replaces the old harsh full‑screen flash) ---- */}
      <motion.div
        className="fixed inset-0"
        style={{
          background:
            "radial-gradient(circle at var(--cx) var(--cy), rgba(253,224,71,0.45) 0%, rgba(253,224,71,0.12) 35%, transparent 65%)",
          ["--cx" as string]: `${centerX}px`,
          ["--cy" as string]: `${centerY}px`,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.02 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

export const BossUnlockBurst = memo(BossUnlockBurstInner);
