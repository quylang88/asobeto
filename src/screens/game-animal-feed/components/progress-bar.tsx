"use client";

import { motion } from "framer-motion";

interface FeedProgressSegment {
  id: string;
  label: string;
  requiredHits: number;
}

interface FeedProgressBarProps {
  segments: FeedProgressSegment[];
  hits: number[];
  pingIndex: number | null;
}

export function FeedProgressBar({
  segments,
  hits,
  pingIndex,
}: FeedProgressBarProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border-[3px] border-emerald-200 bg-white/90 px-3 py-3 shadow-[0_12px_24px_rgba(4,120,87,0.14)] backdrop-blur-sm">
      <div className="grid grid-cols-3 gap-2">
        {segments.map((segment, index) => {
          const required = Math.max(1, segment.requiredHits);
          const current = Math.min(required, hits[index] ?? 0);
          const completed = current >= required;
          const isPing = pingIndex === index;

          return (
            <motion.div
              key={segment.id}
              initial={false}
              animate={
                isPing
                  ? { scale: [1, 1.06, 1], y: [0, -2, 0] }
                  : { scale: 1, y: 0 }
              }
              transition={{ duration: 0.45, ease: "easeOut" }}
              className={`relative h-18 overflow-hidden rounded-xl border-2 pl-2 pr-8 ${
                completed
                  ? "border-emerald-300 bg-linear-to-b from-lime-100 via-emerald-100 to-cyan-100 shadow-[0_0_12px_rgba(16,185,129,0.28)]"
                  : "border-slate-200 bg-slate-100/85 opacity-60"
              }`}
            >
              {completed && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: [0.08, 0.26, 0.08], scale: [0.8, 1.1, 1] }}
                  transition={{ duration: 0.85, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-tr from-yellow-100/50 via-transparent to-emerald-100/40"
                />
              )}
              <span
                className={`absolute bottom-1.5 left-2 right-8 text-center font-hp-special text-[1.95rem] font-black lowercase leading-none ${
                  completed ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {segment.label.toLocaleLowerCase("vi-VN")}
              </span>
              <span className="absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-1.5">
                {[...Array(required)].map((_, dotIndex) => (
                  <span
                    key={`${segment.id}-dot-${dotIndex}`}
                    className={`h-1.5 w-2.5 rounded-full ${
                      dotIndex < current ? "bg-emerald-500" : "bg-slate-300/85"
                    }`}
                  />
                ))}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

