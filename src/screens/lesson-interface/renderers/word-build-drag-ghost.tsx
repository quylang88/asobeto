"use client";

import { type RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { WordBuildActiveDrag, WordBuildToken } from "../types";

interface WordBuildDragGhostProps {
  wordBuildActiveDrag: WordBuildActiveDrag | null;
  wordBuildDraggedToken: WordBuildToken | undefined;
  wordBuildDraggedTokenText: string;
  isWordBuildDraggedTone: boolean;
  isWordBuildDraggedSingleLetter: boolean;
  wordBuildGhostRef: RefObject<HTMLDivElement | null>;
}

export function WordBuildDragGhost({
  wordBuildActiveDrag,
  wordBuildDraggedToken,
  wordBuildDraggedTokenText,
  isWordBuildDraggedTone,
  isWordBuildDraggedSingleLetter,
  wordBuildGhostRef,
}: WordBuildDragGhostProps) {
  return (
    <AnimatePresence>
      {wordBuildActiveDrag && wordBuildDraggedToken && (
        <motion.div
          ref={wordBuildGhostRef}
          className="pointer-events-none fixed left-0 top-0 z-50 h-20 w-20"
          style={{
            transform: "translate3d(-9999px, -9999px, 0)",
          }}
          initial={{ opacity: 0.9, scale: 0.92 }}
          animate={{ opacity: 0.96, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          <div className="flex h-full w-full items-center justify-center rounded-2xl border-2 border-green-200 bg-green-bright text-white shadow-xl">
            <span
              className={`font-bold ${
                isWordBuildDraggedTone
                  ? "text-5xl leading-none"
                  : isWordBuildDraggedSingleLetter
                    ? "font-hp-special text-5xl leading-none"
                    : "text-xl leading-tight"
              }`}
            >
              {wordBuildDraggedTokenText}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
