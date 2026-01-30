"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Mascot } from "../components/beto-mascot";
import { FloorCard, FloorCardProps } from "../components/floor-card";
import {
  getFloorProgress,
  updateFloorProgress,
  initializeFloorProgress,
  FloorProgress,
} from "../lib/supabase";

interface FloorSelectionProps {
  towerId: number;
  towerName: string;
  onSelectFloor: (floorId: number) => void;
  onBack: () => void;
}

interface FloorData {
  id: number;
  type: "letter" | "boss";
  label: string;
  subLabel: string;
  stars: number;
  maxStars: number;
  isLocked: boolean;
}

export function FloorSelection({
  towerId,
  towerName,
  onSelectFloor,
  onBack,
}: FloorSelectionProps) {
  const [floors, setFloors] = useState<FloorData[]>([
    {
      id: 1,
      type: "letter",
      label: "A",
      subLabel: "Con Cá",
      stars: 0,
      maxStars: 4,
      isLocked: false,
    },
    {
      id: 2,
      type: "letter",
      label: "Ă",
      subLabel: "Mặt Trăng",
      stars: 0,
      maxStars: 4,
      isLocked: true,
    },
    {
      id: 3,
      type: "letter",
      label: "Â",
      subLabel: "Cái Cân",
      stars: 0,
      maxStars: 4,
      isLocked: true,
    },
    {
      id: 4,
      type: "boss",
      label: "BOSS",
      subLabel: "Tổng hợp A-Ă-Â",
      stars: 0,
      maxStars: 4,
      isLocked: true,
    },
  ]);

  const [showMagicUnlock, setShowMagicUnlock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getTotalStars = useCallback((): number => {
    return floors
      .filter((f) => f.type === "letter")
      .reduce((sum, floor) => sum + floor.stars, 0);
  }, [floors]);

  const canUnlockBoss = useCallback((): boolean => {
    const totalStars = getTotalStars();
    return totalStars >= 10;
  }, [getTotalStars]);

  const loadFloorProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      let progress = await getFloorProgress(towerId);

      if (progress.length === 0) {
        await initializeFloorProgress(towerId);
        progress = await getFloorProgress(towerId);
      }

      const updatedFloors = [...floors];

      progress.forEach((p: FloorProgress) => {
        const floorIndex = updatedFloors.findIndex((f) => f.id === p.floor_id);
        if (floorIndex !== -1) {
          updatedFloors[floorIndex].stars = p.stars;
          updatedFloors[floorIndex].isLocked = p.unlocked ? false : true;
        }
      });

      setFloors(updatedFloors);
    } catch (error) {
      console.error("Error loading floor progress:", error);
    } finally {
      setIsLoading(false);
    }
  }, [towerId, floors]);

  useEffect(() => {
    loadFloorProgress();
  }, [towerId]);

  const handleFloorClick = useCallback(
    async (floorId: number) => {
      const floor = floors.find((f) => f.id === floorId);
      if (!floor) return;

      if (floor.isLocked) {
        if (floor.type === "boss" && canUnlockBoss()) {
          setShowMagicUnlock(true);
          setTimeout(() => {
            setShowMagicUnlock(false);
            onSelectFloor(floorId);
          }, 2000);
        }
        return;
      }

      onSelectFloor(floorId);
    },
    [floors, canUnlockBoss, onSelectFloor]
  );

  const handleFloorComplete = useCallback(
    async (floorId: number, earnedStars: number) => {
      const floorIndex = floors.findIndex((f) => f.id === floorId);
      if (floorIndex === -1) return;

      const updatedFloors = [...floors];
      updatedFloors[floorIndex].stars = Math.max(
        updatedFloors[floorIndex].stars,
        earnedStars
      );

      if (floorId < 4) {
        updatedFloors[floorIndex + 1].isLocked = false;
      }

      setFloors(updatedFloors);

      await updateFloorProgress(towerId, floorId, {
        stars: earnedStars,
        completed: earnedStars === 4,
      });

      if (floorId < 4) {
        await updateFloorProgress(towerId, floorId + 1, {
          unlocked: true,
        });
      }

      if (canUnlockBoss()) {
        await updateFloorProgress(towerId, 4, {
          unlocked: true,
        });
      }
    },
    [floors, towerId, canUnlockBoss]
  );

  const totalStars = getTotalStars();
  const bossFloor = floors.find((f) => f.type === "boss");
  const starsNeededForBoss = bossFloor ? 10 - totalStars : 0;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-orange-bright/20 via-background to-green-bright/10 overflow-hidden">
      {/* Header - iOS safe area */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-md pt-safe px-4 py-4">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="p-3 bg-green-bright text-white rounded-2xl shadow-lg ios-button flex-shrink-0"
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Tower {towerName}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {totalStars}/12 Stars
            </p>
          </div>
          <div className="flex-shrink-0">
            <Mascot size="sm" emotion="thinking" />
          </div>
        </div>
      </div>

      {/* Tower Floors - Bottom-up view */}
      <div className="flex-1 flex flex-col-reverse justify-between p-4 md:p-6 pb-safe overflow-hidden">
        <AnimatePresence>
          {!isLoading && (
            <div className="flex flex-col gap-3 md:gap-4 justify-end">
              {floors.map((floor, index) => (
                <FloorCard
                  key={floor.id}
                  id={floor.id}
                  label={floor.label}
                  subLabel={floor.subLabel}
                  type={floor.type}
                  stars={floor.stars}
                  maxStars={floor.maxStars}
                  unlocked={!floor.isLocked}
                  starsNeededToUnlock={
                    floor.type === "boss" ? starsNeededForBoss : undefined
                  }
                  onClick={() => handleFloorClick(floor.id)}
                  index={index}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Magic Unlock Animation Overlay */}
      <AnimatePresence>
        {showMagicUnlock && (
          <motion.div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                <div className="text-6xl mb-4">✨</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Boss Unlocked!
                </h2>
                <p className="text-white/90">
                  You've collected {totalStars} stars!
                </p>
              </motion.div>

              {/* Floating stars animation */}
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="fixed text-3xl"
                  initial={{
                    x: Math.random() * 200 - 100,
                    y: window.innerHeight / 2,
                    opacity: 1,
                  }}
                  animate={{
                    x: Math.random() * 400 - 200,
                    y: -100,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                  }}
                >
                  ⭐
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-12 h-12 border-4 border-orange-bright/30 border-t-orange-bright rounded-full" />
          </motion.div>
        </div>
      )}
    </div>
  );
}
