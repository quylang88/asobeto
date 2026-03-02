"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface MiniGameCountdownProps {
  value: number;
  hint?: ReactNode;
}

export function MiniGameCountdown({ value, hint }: MiniGameCountdownProps) {
  return (
    <div className="mx-auto flex h-[62dvh] w-full max-w-md flex-col items-center justify-center">
      <motion.div
        key={value}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.2, opacity: 0 }}
        className="font-hp-special text-[7rem] font-black leading-none text-emerald-500"
      >
        {value}
      </motion.div>
      {hint ? <div className="mt-3 text-center">{hint}</div> : null}
    </div>
  );
}
