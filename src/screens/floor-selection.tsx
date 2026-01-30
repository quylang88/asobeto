"use client";

import React from "react";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  Gamepad2,
  Star,
  Lock,
} from "lucide-react";
import { Mascot } from "../components/beto-mascot";

interface Floor {
  id: number;
  type: 'letter' | 'boss';
  label: string; // "A", "Ă", "Â", "Review"
  subLabel: string; // "Con Cá", "Mặt Trăng"...
  description: string;

  // Progression
  isLocked: boolean;
  isCompleted: boolean;
  stars: number; // Current stars earned
  maxStars: number;   // Changed from 3 to 4
  progress: number; // 0-100% (based on stars or lesson completion)

  // Unlock Requirements
  minStarsToUnlock?: number; // Only for Boss floor
}

const floors: Floor[] = [
  // Top Floor (Boss) - Renders at the top
  {
    id: 4,
    type: 'boss',
    label: "ÔN TẬP",
    subLabel: "Thử Thách Cuối",
    description: "Tổng hợp kiến thức tháp A",
    isLocked: true,
    isCompleted: false,
    stars: 0,
    maxStars: 4,
    progress: 0,
    minStarsToUnlock: 10 // Requires 10/12 stars from previous floors
  },
  // Floor 3
  {
    id: 3,
    type: 'letter',
    label: "Â",
    subLabel: "Cái Cân",
    description: "Bài học chữ Â",
    isLocked: true,
    isCompleted: false,
    stars: 0,
    maxStars: 4,
    progress: 0
  },
  // Floor 2
  {
    id: 2,
    type: 'letter',
    label: "Ă",
    subLabel: "Mặt Trăng",
    description: "Bài học chữ Ă",
    isLocked: true,
    isCompleted: false,
    stars: 0,
    maxStars: 4,
    progress: 0
  },
  // Floor 1 (Bottom) - Starts Unlocked
  {
    id: 1,
    type: 'letter',
    label: "A",
    subLabel: "Con Cá",
    description: "Bài học chữ A",
    isLocked: false,
    isCompleted: false,
    stars: 2, // Example: User played a bit
    maxStars: 4,
    progress: 50
  }
];

interface FloorSelectionProps {
  towerId: number;
  towerName: string;
  onSelectFloor: (floorId: number) => void;
  onBack: () => void;
}

export function FloorSelection({
  towerName,
  onSelectFloor,
  onBack,
}: FloorSelectionProps) {
  return (
    <div className="h-screen flex flex-col bg-linear-to-b from-orange-bright/20 via-background to-green-bright/10 overflow-hidden touch-none">
      {/* Header - iOS safe area */}
      <div className="shrink-0 bg-white/95 backdrop-blur-sm shadow-md pt-safe">
        <div className="p-4 flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="p-3 bg-green-bright text-white rounded-2xl shadow-lg ios-button"
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Tower {towerName}
            </h1>
            <p className="text-sm text-muted-foreground">Choose a Floor</p>
          </div>
          <div className="ml-auto">
            <Mascot size="sm" emotion="thinking" />
          </div>
        </div>
      </div>

      {/* Tower cutaway view - Full height no scroll */}
      <div className="flex-1 p-4 md:p-8 max-w-lg mx-auto w-full h-full relative flex flex-col justify-center overflow-hidden">
        {/* Tower frame */}
        <div className="relative h-full flex flex-col justify-center">
          {/* Left wall */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-green-bright/40 rounded-l-3xl" />
          {/* Right wall */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-green-bright/40 rounded-r-3xl" />

          {/* Floors Container - Render top to bottom */}
          <div className="flex flex-col h-full justify-between py-4 pl-10 pr-4 gap-2 md:gap-4 overflow-hidden">
            {floors.map((floor, index) => (
              <motion.button
                key={floor.id}
                onClick={() => !floor.isLocked && onSelectFloor(floor.id)}
                disabled={floor.isLocked}
                className={`relative group w-full flex items-center justify-center ios-button ${floor.isLocked ? "cursor-not-allowed opacity-80" : ""}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                whileTap={!floor.isLocked ? { scale: 0.95 } : {}}
              >
                {/* Floor number indicator */}
                <div className="absolute -left-10 md:-left-12 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-white rounded-full shadow-md flex items-center justify-center font-bold text-foreground z-10 text-sm md:text-base">
                  {floor.id}
                </div>

                {/* Floor card */}
                <div
                  className={`relative rounded-3xl p-3 md:p-4 shadow-lg w-full transition-colors ${
                    !floor.isLocked ? "bg-white" : "bg-gray-100"
                  } border-4 ${
                    floor.isCompleted
                      ? "border-green-bright"
                      : !floor.isLocked
                        ? "border-orange-bright/50"
                        : "border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Icon */}
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                        !floor.isLocked ? (floor.type === 'boss' ? "bg-pink-soft" : "bg-blue-soft") : "bg-gray-300"
                      }`}
                    >
                      {!floor.isLocked ? (
                        floor.type === 'boss' ? (
                          <div className="text-white">
                            <Gamepad2 className="w-8 h-8 md:w-10 md:h-10" />
                          </div>
                        ) : (
                          <div className="text-white font-bold text-3xl md:text-4xl pb-1">
                            {floor.label.toLowerCase()}
                          </div>
                        )
                      ) : (
                        <Lock className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <h3
                        className={`text-lg md:text-xl font-bold truncate ${
                          !floor.isLocked ? "text-foreground" : "text-gray-400"
                        }`}
                      >
                        {floor.label}
                      </h3>
                      <p
                        className={`text-sm font-medium truncate -mt-1 ${
                          !floor.isLocked ? "text-orange-bright" : "text-gray-400"
                        }`}
                      >
                        {floor.subLabel}
                      </p>

                      <p
                        className={`text-xs md:text-sm truncate mt-1 ${
                          !floor.isLocked
                            ? "text-muted-foreground"
                            : "text-gray-400"
                        }`}
                      >
                        {floor.description}
                      </p>

                      {/* Stars */}
                      {!floor.isLocked && (
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(floor.maxStars)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 md:w-5 md:h-5 ${
                                i < floor.stars
                                  ? "text-yellow-bright fill-yellow-bright"
                                  : "text-gray-300 fill-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Completion badge */}
                    {floor.isCompleted && (
                      <motion.div
                        className="w-8 h-8 md:w-10 md:h-10 bg-green-bright rounded-full flex items-center justify-center shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      >
                        <svg
                          className="w-5 h-5 md:w-6 md:h-6 text-white"
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
                  </div>
                </div>

                {/* Ladder between floors */}
                {index < floors.length - 1 && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1.5 h-8 bg-orange-bright/50 z-0" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Roof */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
            <svg width="120" height="40" viewBox="0 0 120 40">
              <polygon points="60,0 0,40 120,40" fill="#FB923C" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
