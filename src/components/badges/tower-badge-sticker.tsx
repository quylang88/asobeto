"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, Star } from "lucide-react";
import type { TowerBadgeRecord } from "@/lib/tower-badges";

const BADGE_PALETTES = [
  {
    surface: "from-amber-100 via-orange-100 to-rose-200",
    border: "border-orange-300",
    glow: "bg-orange-300/55",
    chip: "bg-orange-500 text-white",
    text: "text-orange-900",
  },
  {
    surface: "from-cyan-100 via-sky-100 to-indigo-200",
    border: "border-sky-300",
    glow: "bg-sky-300/55",
    chip: "bg-sky-500 text-white",
    text: "text-sky-900",
  },
  {
    surface: "from-emerald-100 via-teal-100 to-lime-200",
    border: "border-emerald-300",
    glow: "bg-emerald-300/55",
    chip: "bg-emerald-500 text-white",
    text: "text-emerald-900",
  },
  {
    surface: "from-fuchsia-100 via-pink-100 to-rose-200",
    border: "border-pink-300",
    glow: "bg-pink-300/55",
    chip: "bg-pink-500 text-white",
    text: "text-pink-900",
  },
  {
    surface: "from-violet-100 via-indigo-100 to-purple-200",
    border: "border-violet-300",
    glow: "bg-violet-300/55",
    chip: "bg-violet-500 text-white",
    text: "text-violet-900",
  },
];

interface TowerBadgeStickerProps {
  badge: TowerBadgeRecord;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
  className?: string;
}

function getBadgeSizeClasses(size: "sm" | "md" | "lg"): {
  wrapper: string;
  title: string;
  subtitle: string;
  icon: string;
} {
  if (size === "sm") {
    return {
      wrapper: "h-28 w-28 rounded-[1.35rem]",
      title: "text-base",
      subtitle: "text-[0.62rem]",
      icon: "h-4 w-4",
    };
  }
  if (size === "lg") {
    return {
      wrapper: "h-52 w-52 rounded-[2.4rem]",
      title: "text-3xl",
      subtitle: "text-xs",
      icon: "h-6 w-6",
    };
  }
  return {
    wrapper: "h-40 w-40 rounded-[2rem]",
    title: "text-2xl",
    subtitle: "text-[0.68rem]",
    icon: "h-5 w-5",
  };
}

export function TowerBadgeSticker({
  badge,
  size = "md",
  highlight = false,
  className,
}: TowerBadgeStickerProps) {
  const palette = BADGE_PALETTES[badge.paletteIndex % BADGE_PALETTES.length];
  const badgeSize = getBadgeSizeClasses(size);
  const showGlow = highlight && badge.unlocked;

  return (
    <div
      className={`relative flex items-center justify-center ${badgeSize.wrapper} ${className ?? ""}`}
    >
      {showGlow && (
        <motion.div
          className={`pointer-events-none absolute -inset-6 rounded-full blur-2xl ${palette.glow}`}
          animate={{ opacity: [0.34, 0.84, 0.34], scale: [0.96, 1.08, 0.96] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <motion.div
        className={`relative flex h-full w-full flex-col items-center justify-between overflow-hidden border-4 p-3 shadow-xl ${
          badge.unlocked
            ? `bg-linear-to-br ${palette.surface} ${palette.border}`
            : "border-slate-300 bg-slate-200 grayscale"
        } ${badgeSize.wrapper}`}
        animate={badge.unlocked ? { rotate: [0, -1, 1, 0] } : { rotate: 0 }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="pointer-events-none absolute inset-2 rounded-[inherit] border border-white/65" />

        <div className="relative mt-1 flex w-full items-center justify-between">
          <span
            className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${
              badge.unlocked ? palette.chip : "bg-slate-300 text-slate-600"
            }`}
          >
            Huy Hiệu
          </span>
          <Sparkles
            className={`${badgeSize.icon} ${badge.unlocked ? "text-amber-500" : "text-slate-500"}`}
          />
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center">
          <p
            className={`font-hp-special font-black leading-none ${badgeSize.title} ${
              badge.unlocked ? palette.text : "text-slate-600"
            }`}
          >
            {badge.towerName}
          </p>
          <p
            className={`mt-1 text-center font-semibold uppercase tracking-[0.12em] ${badgeSize.subtitle} ${
              badge.unlocked ? "text-slate-700" : "text-slate-500"
            }`}
          >
            {badge.towerLetters}
          </p>
        </div>

        <div className="relative mb-1">
          {badge.unlocked ? (
            <Star className={`${badgeSize.icon} fill-yellow-300 text-yellow-500`} />
          ) : (
            <Lock className={`${badgeSize.icon} text-slate-600`} />
          )}
        </div>

        {!badge.unlocked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/26">
            <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-semibold text-slate-700">
              Chưa mở
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
