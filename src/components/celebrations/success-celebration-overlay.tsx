"use client";

import { motion } from "framer-motion";

const CONFETTI_COLORS = ["#22c55e", "#f59e0b", "#38bdf8", "#fb7185", "#f97316"];

const CONFETTI_PIECES = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: (index * 17) % 100,
  delay: (index % 7) * 0.07,
  duration: 1.4 + (index % 5) * 0.32,
  xDrift: (index % 2 === 0 ? 1 : -1) * (12 + (index % 4) * 8),
  rotate: (index * 43) % 360,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));

export function SuccessCelebrationOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-radial-[circle_at_center] from-yellow-bright/35 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />
      {CONFETTI_PIECES.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute top-0 h-3 w-2 rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotate}deg)`,
          }}
          initial={{ y: -16, opacity: 0, scale: 0.85 }}
          animate={{
            y: "110vh",
            opacity: [0, 1, 1, 0],
            x: [0, piece.xDrift, piece.xDrift * 0.4],
            rotate: [piece.rotate, piece.rotate + 180],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
