import React from "react";
import { motion } from "framer-motion";

const TONE_STYLES = {
  orange: "border-orange-300 bg-linear-to-br from-orange-200 to-amber-300",
  green: "border-green-300 bg-linear-to-br from-green-200 to-emerald-300",
} as const;

export function SvgWrapper({
  children,
  tone = "orange",
}: {
  children: React.ReactNode;
  tone?: keyof typeof TONE_STYLES;
}) {
  return (
    <motion.div
      className={`relative h-14 w-14 overflow-hidden rounded-xl border-2 shadow-lg ${TONE_STYLES[tone]}`}
      animate={{ y: [0, -1.5, 0], rotate: [0, -2, 2, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-1 rounded-lg bg-white/26" />
      {children}
      <span className="pointer-events-none absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-white/70" />
      <span className="pointer-events-none absolute right-2 top-3 h-1 w-1 rounded-full bg-white/60" />
    </motion.div>
  );
}
