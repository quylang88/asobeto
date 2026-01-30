"use client";

import React from "react";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  Ear,
  Pencil,
  Puzzle,
  Gamepad2,
  Star,
  Lock,
} from "lucide-react";
import { Mascot } from "../components/beto-mascot";

interface Floor {
  id: number;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  completed: boolean;
  unlocked: boolean;
  stars: number;
}

const floors: Floor[] = [
  {
    id: 1,
    name: "Listening & Phonics",
    description: "Learn how letters sound",
    icon: <Ear className="w-8 h-8" />,
    color: "text-blue-soft",
    bgColor: "bg-blue-soft",
    completed: true,
    unlocked: true,
    stars: 3,
  },
  {
    id: 2,
    name: "Tracing & Writing",
    description: "Practice writing letters",
    icon: <Pencil className="w-8 h-8" />,
    color: "text-green-bright",
    bgColor: "bg-green-bright",
    completed: true,
    unlocked: true,
    stars: 2,
  },
  {
    id: 3,
    name: "Combining Rhymes",
    description: "Put sounds together",
    icon: <Puzzle className="w-8 h-8" />,
    color: "text-orange-bright",
    bgColor: "bg-orange-bright",
    completed: false,
    unlocked: true,
    stars: 0,
  },
  {
    id: 4,
    name: "Mini-Game Boss",
    description: "Challenge yourself!",
    icon: <Gamepad2 className="w-8 h-8" />,
    color: "text-pink-soft",
    bgColor: "bg-pink-soft",
    completed: false,
    unlocked: false,
    stars: 0,
  },
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
    <div className="h-screen flex flex-col bg-linear-to-b from-orange-bright/20 via-background to-green-bright/10 overflow-hidden">
      {/* Header - iOS safe area */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-md pt-safe">
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

      {/* Tower cutaway view - Scrollable area */}
      <div className="flex-1 p-6 md:p-12 max-w-lg mx-auto app-scroll pb-safe">
        {/* Tower frame */}
        <div className="relative">
          {/* Left wall */}
          <div className="absolute left-0 top-0 bottom-0 w-4 bg-green-bright/40 rounded-l-3xl" />
          {/* Right wall */}
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-green-bright/40 rounded-r-3xl" />

          {/* Floors */}
          <div className="flex flex-col-reverse gap-4 py-8 px-6">
            {floors.map((floor, index) => (
              <motion.button
                key={floor.id}
                onClick={() => floor.unlocked && onSelectFloor(floor.id)}
                disabled={!floor.unlocked}
                className={`relative group ios-button ${!floor.unlocked ? "cursor-not-allowed" : ""}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                whileTap={floor.unlocked ? { scale: 0.95 } : {}}
              >
                {/* Floor number indicator */}
                <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center font-bold text-foreground">
                  {floor.id}
                </div>

                {/* Floor card */}
                <div
                  className={`relative rounded-3xl p-5 shadow-lg ${
                    floor.unlocked ? "bg-white" : "bg-gray-100"
                  } border-4 ${
                    floor.completed
                      ? "border-green-bright"
                      : floor.unlocked
                        ? "border-orange-bright/50"
                        : "border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                        floor.unlocked ? floor.bgColor : "bg-gray-300"
                      }`}
                    >
                      {floor.unlocked ? (
                        <div className="text-white">{floor.icon}</div>
                      ) : (
                        <Lock className="w-8 h-8 text-gray-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <h3
                        className={`text-lg font-bold ${
                          floor.unlocked ? "text-foreground" : "text-gray-400"
                        }`}
                      >
                        {floor.name}
                      </h3>
                      <p
                        className={`text-sm ${
                          floor.unlocked
                            ? "text-muted-foreground"
                            : "text-gray-400"
                        }`}
                      >
                        {floor.description}
                      </p>

                      {/* Stars */}
                      {floor.unlocked && (
                        <div className="flex gap-1 mt-2">
                          {[...Array(3)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-5 h-5 ${
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
                    {floor.completed && (
                      <motion.div
                        className="w-10 h-10 bg-green-bright rounded-full flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      >
                        <svg
                          className="w-6 h-6 text-white"
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
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1 h-4 bg-orange-bright/50" />
                )}
              </motion.button>
            ))}
          </div>

          {/* Roof */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <svg width="120" height="40" viewBox="0 0 120 40">
              <polygon points="60,0 0,40 120,40" fill="#FB923C" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
