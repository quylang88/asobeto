"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { SparkleStars } from "./sparkle-stars";

export interface FloorCardProps {
  id: number;
  label: string;
  subLabel: string;
  type: "letter" | "boss";
  stars: number;
  maxStars: number;
  unlocked: boolean;
  starsNeededToUnlock?: number;
  onClick: () => void;
  index: number;
}

export function FloorCard({
  id,
  label,
  subLabel,
  type,
  stars,
  maxStars,
  unlocked,
  starsNeededToUnlock,
  onClick,
  index,
}: FloorCardProps) {
  const isBoss = type === "boss";
  const isPerfect = stars === maxStars && maxStars === 4;

  return (
    <motion.button
      onClick={unlocked ? onClick : undefined}
      disabled={!unlocked}
      className={`relative w-full ios-button ${
        !unlocked ? "cursor-not-allowed" : ""
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
      whileTap={unlocked ? { scale: 0.97 } : {}}
    >
      <div
        className={`relative rounded-3xl p-5 md:p-6 shadow-lg transition-all ${
          isBoss
            ? unlocked
              ? "bg-gradient-to-br from-yellow-300 via-yellow-200 to-amber-300"
              : "bg-gradient-to-br from-gray-300 to-gray-400"
            : unlocked
              ? "bg-white"
              : "bg-gray-100"
        } border-4 ${
          isBoss
            ? unlocked
              ? "border-yellow-500"
              : "border-gray-400"
            : unlocked
              ? stars === maxStars
                ? "border-green-bright"
                : "border-orange-bright/50"
              : "border-gray-300"
        }`}
      >
        <div className="flex items-center gap-4 md:gap-6">
          {/* Large Letter Icon */}
          <div
            className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center font-bold text-4xl md:text-5xl transition-all ${
              isBoss
                ? unlocked
                  ? "bg-white/80 text-yellow-600"
                  : "bg-gray-300 text-gray-500"
                : unlocked
                  ? "bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-lg"
                  : "bg-gray-300 text-gray-500"
            }`}
          >
            {unlocked ? (
              <span>{label}</span>
            ) : (
              <Lock className="w-10 h-10 md:w-12 md:h-12" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 text-left">
            {/* Title */}
            <h3
              className={`text-lg md:text-xl font-bold ${
                unlocked
                  ? isBoss
                    ? "text-yellow-900"
                    : "text-foreground"
                  : "text-gray-400"
              }`}
            >
              {isBoss ? "Ôn Tập" : label}
            </h3>

            {/* Subtitle */}
            <p
              className={`text-xs md:text-sm ${
                unlocked
                  ? isBoss
                    ? "text-yellow-800"
                    : "text-muted-foreground"
                  : "text-gray-400"
              }`}
            >
              {subLabel}
            </p>

            {/* Stars or Lock Message */}
            <div className="mt-2 md:mt-3">
              {unlocked ? (
                <SparkleStars
                  stars={stars}
                  maxStars={maxStars}
                  size="md"
                />
              ) : isBoss ? (
                <div
                  className={`text-xs md:text-sm font-semibold ${
                    starsNeededToUnlock
                      ? "text-yellow-800"
                      : "text-gray-500"
                  }`}
                >
                  {starsNeededToUnlock && starsNeededToUnlock > 0
                    ? `${starsNeededToUnlock} ⭐ needed`
                    : "Locked"}
                </div>
              ) : (
                <div className="text-xs text-gray-400">Complete previous</div>
              )}
            </div>
          </div>

          {/* Completion Badge or Boss Icon */}
          {unlocked && stars === maxStars && !isBoss && (
            <motion.div
              className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-green-bright rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <svg
                className="w-6 h-6 md:w-7 md:h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          )}

          {/* Boss Crown Icon */}
          {isBoss && unlocked && (
            <motion.div
              className="flex-shrink-0 text-3xl md:text-4xl"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              👑
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
