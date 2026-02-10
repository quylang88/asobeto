"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Lock, Medal } from "lucide-react";
import type { TowerBadgeRecord } from "@/lib/tower-badges";

const BADGE_PALETTES = [
  {
    surface: "from-orange-200 via-amber-100 to-rose-200",
    border: "border-orange-300",
    glow: "bg-orange-300/60",
    icon: "text-orange-700",
  },
  {
    surface: "from-cyan-200 via-sky-100 to-indigo-200",
    border: "border-sky-300",
    glow: "bg-sky-300/60",
    icon: "text-sky-700",
  },
  {
    surface: "from-emerald-200 via-lime-100 to-teal-200",
    border: "border-emerald-300",
    glow: "bg-emerald-300/60",
    icon: "text-emerald-700",
  },
  {
    surface: "from-fuchsia-200 via-pink-100 to-rose-200",
    border: "border-pink-300",
    glow: "bg-pink-300/60",
    icon: "text-pink-700",
  },
  {
    surface: "from-violet-200 via-indigo-100 to-purple-200",
    border: "border-violet-300",
    glow: "bg-violet-300/60",
    icon: "text-violet-700",
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
  frameInset: string;
  imageRadius: string;
  icon: string;
  lock: string;
} {
  if (size === "sm") {
    return {
      wrapper: "h-20 w-20 rounded-[1.2rem]",
      frameInset: "inset-1.5 rounded-[0.95rem]",
      imageRadius: "rounded-[0.8rem]",
      icon: "h-8 w-8",
      lock: "h-10 w-10",
    };
  }
  if (size === "lg") {
    return {
      wrapper: "h-52 w-52 rounded-[2.4rem]",
      frameInset: "inset-2.5 rounded-[2.05rem]",
      imageRadius: "rounded-[1.8rem]",
      icon: "h-16 w-16",
      lock: "h-[4.5rem] w-[4.5rem]",
    };
  }
  return {
    wrapper: "h-[8.5rem] w-[8.5rem] rounded-[1.9rem]",
    frameInset: "inset-2 rounded-[1.55rem]",
    imageRadius: "rounded-[1.35rem]",
    icon: "h-12 w-12",
    lock: "h-14 w-14",
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
        className={`relative flex h-full w-full items-center justify-center overflow-hidden border-[3px] shadow-xl ${
          badge.unlocked
            ? `bg-linear-to-br ${palette.surface} ${palette.border}`
            : "border-slate-300 bg-slate-200 grayscale"
        } ${badgeSize.wrapper}`}
        animate={badge.unlocked ? { rotate: [0, -1, 1, 0] } : { rotate: 0 }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div
          className={`pointer-events-none absolute ${badgeSize.frameInset} border border-white/70`}
        />
        <div className="relative z-10 flex h-full w-full items-center justify-center p-2">
          {badge.unlocked ? (
            badge.badgeImageSrc ? (
              <div
                className={`relative h-full w-full overflow-hidden ${badgeSize.imageRadius} border-2 border-white/70 shadow-md`}
              >
                <Image
                  src={badge.badgeImageSrc}
                  alt={`Huy hiệu tháp ${badge.towerName}`}
                  fill
                  sizes={size === "lg" ? "208px" : size === "md" ? "136px" : "80px"}
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className={`flex items-center justify-center rounded-full bg-white/72 shadow-md ${badgeSize.icon}`}
              >
                <Medal
                  className={`${badgeSize.icon} ${palette.icon}`}
                  strokeWidth={2.2}
                />
              </div>
            )
          ) : (
            <Lock className={`${badgeSize.lock} text-slate-600`} strokeWidth={2.4} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
