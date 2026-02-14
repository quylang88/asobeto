"use client";

import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Heart, Lock, LockOpen, Sparkles, Star } from "lucide-react";
import { PrimaryButton } from "@/components/common/primary-button";

interface LevelTheme {
  cardGradient: string;
  iconGradient: string;
  iconColor: string;
}

export interface MiniGameLevelCard {
  id: string;
  label: string;
  subtitle: string;
  starsReward: number;
  earnedStars: number;
  unlocked: boolean;
  pendingUnlock?: boolean;
  actionLabel?: string;
}

interface MiniGameLevelSelectPanelProps {
  title: string;
  description: string;
  levels: MiniGameLevelCard[];
  recentlyUnlockedLevelId?: string | null;
  onSelectLevel: (levelId: string) => void;
  onUnlockLevel?: (levelId: string) => void;
  rulesActionLabel?: string;
  rulesActionIcon?: ReactNode;
  onRulesAction: () => void;
}

const DEFAULT_THEME: LevelTheme = {
  cardGradient: "from-cyan-200 to-blue-200",
  iconGradient: "from-cyan-100 to-blue-100",
  iconColor: "text-cyan-700",
};

const LEVEL_THEME: Record<string, LevelTheme> = {
  easy: {
    cardGradient: "from-emerald-200 to-cyan-200",
    iconGradient: "from-emerald-100 to-cyan-100",
    iconColor: "text-emerald-700",
  },
  normal: {
    cardGradient: "from-amber-200 to-orange-200",
    iconGradient: "from-amber-100 to-orange-100",
    iconColor: "text-orange-700",
  },
  hard: {
    cardGradient: "from-rose-200 to-fuchsia-200",
    iconGradient: "from-rose-100 to-fuchsia-100",
    iconColor: "text-rose-700",
  },
};

function getTheme(levelId: string): LevelTheme {
  return LEVEL_THEME[levelId] ?? DEFAULT_THEME;
}

function DifficultyIcon({ levelId }: { levelId: string }) {
  if (levelId === "easy") {
    return <Heart className="h-5 w-5 fill-current" />;
  }
  if (levelId === "normal") {
    return <Sparkles className="h-5 w-5" />;
  }
  if (levelId === "hard") {
    return <Flame className="h-5 w-5" />;
  }
  return <Sparkles className="h-5 w-5" />;
}

export function MiniGameLevelSelectPanel({
  title,
  description,
  levels,
  recentlyUnlockedLevelId,
  onSelectLevel,
  onUnlockLevel,
  rulesActionLabel = "Xem luật chơi",
  rulesActionIcon,
  onRulesAction,
}: MiniGameLevelSelectPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 pb-6">
      <motion.div
        className="relative overflow-hidden rounded-4xl border-4 border-cyan-200 bg-linear-to-b from-cyan-50 via-white to-emerald-50 p-5 shadow-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <motion.div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-200/70"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <p className="relative mb-1 text-2xl font-black text-foreground font-hp-special">
          {title}
        </p>
        <p className="relative text-sm text-muted-foreground">{description}</p>

        <div className="relative mt-3">
          <PrimaryButton
            onClick={onRulesAction}
            className="rounded-2xl"
            frontClassName="px-4 py-2 text-sm flex items-center gap-2"
          >
            {rulesActionIcon}
            {rulesActionLabel}
          </PrimaryButton>
        </div>
      </motion.div>

      <div className="space-y-3">
        {levels.map((level, levelIndex) => {
          const theme = getTheme(level.id);
          const isRecentlyUnlocked = recentlyUnlockedLevelId === level.id;
          const isPendingUnlock = Boolean(level.pendingUnlock);
          const isLocked = !level.unlocked && !isPendingUnlock;
          const canUnlock = isPendingUnlock && Boolean(onUnlockLevel);

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.08 + levelIndex * 0.06,
                ease: "easeOut",
              }}
            >
              <motion.button
                onClick={() => {
                  if (isPendingUnlock) {
                    onUnlockLevel?.(level.id);
                    return;
                  }
                  onSelectLevel(level.id);
                }}
                disabled={isLocked || (isPendingUnlock && !canUnlock)}
                initial={false}
                animate={
                  isRecentlyUnlocked
                    ? { scale: [1, 1.03, 1], y: [0, -2, 0] }
                    : { scale: 1, y: 0 }
                }
                transition={{
                  duration: isRecentlyUnlocked ? 0.68 : 0.2,
                  ease: "easeOut",
                }}
                className={`relative w-full overflow-hidden rounded-[1.75rem] border-2 p-1.5 text-left ios-button ${
                  level.unlocked
                    ? "border-cyan-300 bg-white shadow-lg"
                    : isPendingUnlock
                      ? "border-slate-300 bg-slate-200 text-slate-600"
                      : "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500 grayscale"
                }`}
                whileTap={!isLocked ? { scale: 0.96 } : {}}
              >
                <span
                  className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-r ${
                    level.unlocked
                      ? theme.cardGradient
                      : "from-slate-300 to-slate-400"
                  } opacity-25`}
                />

                <span className="relative flex items-center gap-3 rounded-[22px] px-4 py-3">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 ${
                      level.unlocked
                        ? "border-white/80 bg-white/80"
                        : "border-slate-300 bg-slate-300"
                    }`}
                  >
                    {level.unlocked ? (
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${theme.iconGradient} ${theme.iconColor}`}
                      >
                        <DifficultyIcon levelId={level.id} />
                      </span>
                    ) : isPendingUnlock ? (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <LockOpen className="h-5 w-5" />
                      </span>
                    ) : (
                      <Lock className="h-5 w-5 text-slate-600" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-base font-bold ${
                        level.unlocked ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      Mức {level.label}
                    </span>
                    <span
                      className={`block text-xs ${
                        level.unlocked ? "text-slate-600" : "text-slate-500"
                      }`}
                    >
                      {level.subtitle}
                    </span>
                    <span className="mt-1.5 flex gap-0.5">
                      {[...Array(level.starsReward)].map((_, starIndex) => (
                        <Star
                          key={`${level.id}-star-${starIndex}`}
                          className={`h-3.5 w-3.5 ${
                            starIndex < level.earnedStars
                              ? "fill-yellow-300 text-yellow-300"
                              : "fill-slate-200 text-slate-300"
                          }`}
                        />
                      ))}
                    </span>
                  </span>

                  <span className="shrink-0">
                    {level.unlocked ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {level.actionLabel ?? "Chơi"}
                      </span>
                    ) : isPendingUnlock ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Chạm mở
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
                        Khóa
                      </span>
                    )}
                  </span>
                </span>

                <AnimatePresence>
                  {isRecentlyUnlocked && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-400/25"
                    >
                      <motion.span
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-emerald-700 shadow-lg"
                      >
                        <Sparkles className="h-4 w-4" />
                        Mở khóa!
                      </motion.span>
                    </motion.span>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isPendingUnlock && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      className="pointer-events-none absolute inset-0 flex items-center justify-center"
                    >
                      <motion.span
                        animate={{
                          y: [0, -1, 0],
                          rotate: [0, -2, 2, -2, 0],
                          scale: [1, 1.04, 1],
                        }}
                        transition={{
                          duration: 0.95,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="rounded-full border-2 border-emerald-300 bg-white/95 px-4 py-2 text-sm font-black text-emerald-700 shadow-lg"
                      >
                        Mở khóa
                      </motion.span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
