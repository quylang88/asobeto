"use client";

import React, { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Star, Lock, Crown, Sparkles } from "lucide-react";
import { Mascot } from "../../components/beto-mascot";
import { getWorldData } from "../../data/game-config";
import type { Floor } from "../../data/game-config";
import { hydrateFloorsWithStoredProgress } from "@/lib/floor-progress";
import { TowerBadgeAwardOverlay } from "@/components/badges";
import {
  createTowerBadgeRecord,
  type TowerBadgeRecord,
  unlockTowerBadge,
} from "@/lib/tower-badges";
import { PrimaryButton } from "@/components/common/primary-button";
import { LetterBlock } from "@/components/common/letter-block";
import { AwnSvg, CasSvg, SvgWrapper } from "./components";

interface FloorSelectionProps {
  worldId: number;
  towerId: number;
  towerName: string;
  onSelectFloor: (floorId: number) => void;
  onBack: () => void;
}

// Standard Floor Card Component
function StandardFloorCard({
  floor,
  index,
  onSelect,
}: {
  floor: Floor;
  index: number;
  onSelect: () => void;
}) {
  const colorMap: Record<string, string> = {
    "bg-blue-soft": "#60A5FA",
    "bg-green-bright": "#4ADE80",
    "bg-orange-bright": "#FB923C",
    "bg-pink-soft": "#F472B6",
  };

  const blockColor = (floor.bgColor && colorMap[floor.bgColor]) || "#60A5FA";

  // Extract border color class from bgColor or default to gray
  // Assuming naming convention bg-X -> border-X
  const borderColorClass =
    (floor.unlocked || floor.completed) && floor.borderColor
      ? floor.borderColor
      : "border-gray-200";

  return (
    <motion.button
      onClick={() => floor.unlocked && onSelect()}
      disabled={!floor.unlocked}
      className={`relative group ios-button w-full ${!floor.unlocked ? "cursor-not-allowed" : ""}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, type: "spring", stiffness: 100 }}
      whileTap={floor.unlocked ? { scale: 0.97 } : {}}
    >
      {/* Breathing animation for unlocked floors */}
      <motion.div
        className="relative"
        animate={
          floor.unlocked
            ? {
                scale: [1, 1.015, 1],
              }
            : {}
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.3,
        }}
      >
        {/* Floor number on ladder */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <div className="w-7 h-7 bg-amber-100 border-2 border-amber-400 rounded-lg flex items-center justify-center font-bold text-amber-700 text-sm shadow-sm">
            {floor.id}
          </div>
        </div>

        {/* Floor card - Cute room style */}
        <div
          className={`relative rounded-3xl p-4 shadow-lg transition-all duration-200 ${
            floor.unlocked ? "bg-white hover:shadow-xl" : "bg-gray-50"
          } border-3 ${borderColorClass}`}
        >
          {/* Room interior decoration - top border */}
          <div
            className={`absolute top-0 left-4 right-4 h-1.5 rounded-b-full ${
              floor.unlocked ? (floor.bgColor ?? "bg-gray-200") : "bg-gray-200"
            }`}
          />

          <div className="flex items-center gap-4">
            {/* 3D Letter Block Icon */}
            <div className="relative">
              {floor.unlocked ? (
                floor.selectionIcon === "cas-svg" ? (
                  <SvgWrapper>
                    <CasSvg />
                  </SvgWrapper>
                ) : floor.selectionIcon === "awn-svg" ? (
                  <SvgWrapper>
                    <AwnSvg />
                  </SvgWrapper>
                ) : (
                  <LetterBlock
                    letter={floor.letter || "?"}
                    color={blockColor}
                  />
                )
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gray-200 flex items-center justify-center shadow-inner">
                  <Lock className="w-7 h-7 text-gray-400" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <h3
                className={`text-lg font-bold ${
                  floor.unlocked ? "text-foreground" : "text-gray-400"
                }`}
              >
                {floor.unlocked
                  ? floor.nameUnlocked
                  : (floor.nameLocked ?? "Bí Ẩn")}
              </h3>
              <p
                className={`text-xs ${
                  floor.unlocked ? "text-muted-foreground" : "text-gray-400"
                }`}
              >
                {floor.unlocked
                  ? floor.descriptionUnlocked
                  : (floor.descriptionLocked ?? "Bí mật")}
              </p>

              {/* Stars */}
              {floor.unlocked && (
                <div className="flex gap-0.5 mt-1.5">
                  {[...Array(Math.max(1, floor.maxStars ?? 3))].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < floor.stars
                          ? "text-yellow-bright fill-yellow-bright"
                          : "text-gray-300 fill-gray-100"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
}

// Boss Floor - The Grand Finale "Royal Penthouse"
function BossFloorCard({
  floor,
  onSelect,
  totalFloors,
}: {
  floor: Floor;
  onSelect: () => void;
  totalFloors: number;
}) {
  const isLocked = !floor.unlocked;

  return (
    <motion.button
      onClick={() => floor.unlocked && onSelect()}
      disabled={isLocked}
      className={`relative ios-button w-full ${isLocked ? "cursor-not-allowed" : ""}`}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: totalFloors * 0.12 + 0.2,
        type: "spring",
        stiffness: 80,
      }}
      whileTap={floor.unlocked ? { scale: 0.97 } : {}}
    >
      {/* Pulsing glow effect behind */}
      <motion.div
        className={`absolute -inset-3 rounded-4xl ${
          isLocked
            ? "bg-purple-900/20"
            : "bg-linear-to-r from-amber-400 via-orange-500 to-amber-400"
        }`}
        animate={
          !isLocked
            ? {
                opacity: [0.4, 0.7, 0.4],
                scale: [1, 1.02, 1],
              }
            : {}
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ filter: "blur(8px)" }}
      />

      {/* Shimmer effect for unlocked boss */}
      {!isLocked && (
        <motion.div
          className="absolute inset-0 rounded-4xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              repeatDelay: 3,
              ease: "easeInOut",
            }}
            style={{ width: "50%" }}
          />
        </motion.div>
      )}

      {/* Main card */}
      <div className="relative">
        {/* Decorative archway roof */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32">
          <svg viewBox="0 0 100 30" className="w-full">
            <defs>
              <linearGradient
                id="roofGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor={isLocked ? "#6B7280" : "#F59E0B"}
                />
                <stop
                  offset="50%"
                  stopColor={isLocked ? "#9CA3AF" : "#FBBF24"}
                />
                <stop
                  offset="100%"
                  stopColor={isLocked ? "#6B7280" : "#F59E0B"}
                />
              </linearGradient>
            </defs>
            {/* Crown-like roof */}
            <path
              d="M5 30 L15 10 L30 20 L50 5 L70 20 L85 10 L95 30 Z"
              fill="url(#roofGradient)"
            />
            {/* Jewels on crown */}
            <circle
              cx="50"
              cy="12"
              r="4"
              fill={isLocked ? "#4B5563" : "#EF4444"}
            />
            <circle
              cx="30"
              cy="18"
              r="2.5"
              fill={isLocked ? "#4B5563" : "#3B82F6"}
            />
            <circle
              cx="70"
              cy="18"
              r="2.5"
              fill={isLocked ? "#4B5563" : "#10B981"}
            />
          </svg>
        </div>

        {/* The card itself */}
        <div
          className={`relative rounded-3xl p-5 shadow-2xl border-4 overflow-hidden ${
            isLocked
              ? "bg-linear-to-br from-slate-700 via-slate-800 to-slate-900 border-slate-600"
              : "bg-linear-to-br from-amber-500 via-orange-500 to-amber-600 border-amber-300"
          }`}
        >
          {/* Force field effect for locked state */}
          {isLocked && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Hexagonal pattern overlay */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              {/* Animated energy lines */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)",
                }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-4 relative z-10">
            {/* Icon area */}
            <div className="relative">
              {isLocked ? (
                // Mysterious treasure chest silhouette
                <div className="w-16 h-16 rounded-2xl bg-slate-600/50 flex items-center justify-center relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-purple-500/20"
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <svg viewBox="0 0 40 40" className="w-10 h-10 opacity-60">
                    {/* Treasure chest silhouette */}
                    <rect
                      x="5"
                      y="18"
                      width="30"
                      height="18"
                      rx="3"
                      fill="#374151"
                    />
                    <path d="M5 18 Q20 10 35 18" fill="#374151" />
                    <rect
                      x="17"
                      y="22"
                      width="6"
                      height="8"
                      rx="1"
                      fill="#1F2937"
                    />
                    <circle cx="20" cy="25" r="2" fill="#6B7280" />
                  </svg>
                  {/* Chain overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-slate-400" />
                  </div>
                </div>
              ) : (
                // Golden trophy/crown icon
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-linear-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-lg"
                  animate={{
                    rotate: [0, -3, 3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Crown className="w-9 h-9 text-amber-900" />
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300" />
                </motion.div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-left">
              <h3
                className={`text-xl font-bold ${isLocked ? "text-slate-300" : "text-white"}`}
              >
                {isLocked ? (floor.nameLocked ?? "Bí Ẩn") : floor.nameUnlocked}
              </h3>
              <p
                className={`text-sm ${isLocked ? "text-slate-400" : "text-amber-100"}`}
              >
                {isLocked
                  ? (floor.descriptionLocked ??
                    "Hoàn thành các tầng để mở khóa!")
                  : floor.descriptionUnlocked}
              </p>

              {/* Stars for boss level */}
              {!isLocked && (
                <div className="flex gap-1 mt-2">
                  {[...Array(Math.max(1, floor.maxStars ?? 3))].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < floor.stars
                          ? "text-yellow-200 fill-yellow-200"
                          : "text-amber-700 fill-amber-800"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// Ladder/Vine connector between floors
function FloorConnector({ index }: { index: number }) {
  // Removed condition "if (index === 0) return null;" as we control rendering in parent loop

  return (
    <div className="relative h-6 flex justify-center">
      {/* Vine/ladder connector */}
      <svg viewBox="0 0 40 24" className="w-10 h-6">
        <defs>
          <linearGradient
            id={`vineGrad-${index}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        {/* Main vine */}
        <path
          d="M20 0 Q15 8 20 12 Q25 16 20 24"
          stroke={`url(#vineGrad-${index})`}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Leaves */}
        <ellipse
          cx="12"
          cy="8"
          rx="5"
          ry="3"
          fill="#86EFAC"
          transform="rotate(-20 12 8)"
        />
        <ellipse
          cx="28"
          cy="16"
          rx="5"
          ry="3"
          fill="#86EFAC"
          transform="rotate(20 28 16)"
        />
      </svg>
    </div>
  );
}

export function FloorSelection({
  worldId,
  towerId,
  towerName,
  onSelectFloor,
  onBack,
}: FloorSelectionProps) {
  const worldData = getWorldData(worldId);
  const currentTower = worldData.towers.find((t) => t.id === towerId);
  const [earnedBadge, setEarnedBadge] = useState<TowerBadgeRecord | null>(null);
  const floors = useMemo(
    () =>
      hydrateFloorsWithStoredProgress({
        worldId,
        towerId,
        floors: currentTower?.floors ?? [],
      }),
    [currentTower?.floors, towerId, worldId],
  );

  useEffect(() => {
    if (!currentTower || currentTower.isBoss || floors.length === 0) {
      return;
    }

    const isTowerAtFullStars = floors.every((floor) => {
      const maxStars = floor.maxStars ?? 3;
      return (floor.stars ?? 0) >= maxStars;
    });
    if (!isTowerAtFullStars) {
      return;
    }

    const unlockResult = unlockTowerBadge({ worldId, towerId });
    if (!unlockResult.newlyUnlocked) {
      return;
    }

    queueMicrotask(() => {
      setEarnedBadge(
        createTowerBadgeRecord({
          worldId,
          tower: currentTower,
          unlockedAt: unlockResult.unlockedAt,
        }),
      );
    });
  }, [currentTower, floors, towerId, worldId]);

  return (
    <div className="relative w-full h-dvh flex flex-col bg-linear-to-b from-sky-100 via-sky-50 to-emerald-50 overflow-hidden">
      {/* Header - iOS safe area */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md shadow-sm pt-safe">
        <div className="p-4 flex items-center gap-4">
          <motion.div whileTap={{ scale: 0.95 }}>
            <PrimaryButton
              onClick={onBack}
              className="rounded-2xl shadow-lg"
              frontClassName="p-3"
            >
              <ChevronLeft className="w-6 h-6" />
            </PrimaryButton>
          </motion.div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground font-hp-special">
              Tháp {towerName}
            </h1>
            <p className="text-xs text-muted-foreground">
              Leo lên đỉnh tháp nào!
            </p>
          </div>
          <Mascot size="sm" emotion="thinking" />
        </div>
      </div>

      {/* Tower view with perspective */}
      <div className="flex-1 app-scroll pb-safe overflow-y-auto">
        <div
          className="relative max-w-sm mx-auto px-8 py-6"
          style={{
            perspective: "800px",
          }}
        >
          {/* Tower structure with slight tilt */}
          <motion.div
            className="relative"
            // 3D transform removed to fix clickability issues on some devices/tests
            // style={{
            //   transformStyle: "preserve-3d",
            //   transform: "rotateX(2deg)",
            // }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Left decorative vine */}
            <div className="absolute -left-4 top-0 bottom-0 w-3">
              <svg
                viewBox="0 0 12 400"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                <path
                  d="M6 0 Q2 50 6 100 Q10 150 6 200 Q2 250 6 300 Q10 350 6 400"
                  stroke="#4ADE80"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                {/* Leaves along the vine */}
                {[0, 1, 2, 3].map((i) => (
                  <ellipse
                    key={i}
                    cx={i % 2 === 0 ? 2 : 10}
                    cy={50 + i * 100}
                    rx="4"
                    ry="6"
                    fill="#86EFAC"
                    transform={`rotate(${i % 2 === 0 ? -30 : 30} ${i % 2 === 0 ? 2 : 10} ${50 + i * 100})`}
                  />
                ))}
              </svg>
            </div>

            {/* Right decorative ladder */}
            <div className="absolute -right-4 top-0 bottom-0 w-4">
              <svg
                viewBox="0 0 16 400"
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Ladder rails */}
                <line
                  x1="3"
                  y1="0"
                  x2="3"
                  y2="400"
                  stroke="#D97706"
                  strokeWidth="2"
                />
                <line
                  x1="13"
                  y1="0"
                  x2="13"
                  y2="400"
                  stroke="#D97706"
                  strokeWidth="2"
                />
                {/* Rungs */}
                {[...Array(12)].map((_, i) => (
                  <line
                    key={i}
                    x1="3"
                    y1={20 + i * 32}
                    x2="13"
                    y2={20 + i * 32}
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ))}
              </svg>
            </div>

            {/* Floors - stacked from bottom to top */}
            <div className="flex flex-col-reverse gap-0">
              {floors.map((floor, index) => {
                const isBoss = floor.floorType === "game";

                return (
                  <React.Fragment key={floor.id}>
                    {isBoss ? (
                      <BossFloorCard
                        floor={floor}
                        onSelect={() => onSelectFloor(floor.id)}
                        totalFloors={floors.length}
                      />
                    ) : (
                      <StandardFloorCard
                        floor={floor}
                        index={index}
                        onSelect={() => onSelectFloor(floor.id)}
                      />
                    )}

                    {/* Add connector if this is NOT the last item in the list (which is the TOP item visually) */}
                    {index < floors.length - 1 && (
                      <FloorConnector index={index} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Ground decoration */}
            <div className="mt-4 flex justify-center">
              <svg viewBox="0 0 200 30" className="w-48 h-8">
                {/* Grass */}
                <ellipse cx="100" cy="25" rx="90" ry="8" fill="#86EFAC" />
                <ellipse cx="100" cy="22" rx="70" ry="5" fill="#4ADE80" />
                {/* Flowers */}
                <circle cx="30" cy="18" r="4" fill="#F472B6" />
                <circle cx="170" cy="18" r="4" fill="#FBBF24" />
                <circle cx="100" cy="15" r="5" fill="#60A5FA" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {earnedBadge && (
          <TowerBadgeAwardOverlay
            badge={earnedBadge}
            onDismiss={() => setEarnedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
