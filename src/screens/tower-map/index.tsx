"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Star } from "lucide-react";
import { Mascot } from "@/components/beto-mascot";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  canUnlockBoss,
  getTotalStars,
  getWorldData,
} from "@/data/game-config";
import { hydrateTowersWithStoredProgress } from "@/lib/floor-progress";
import { ConnectionLinesSVG, FlyingStar, TowerNode } from "./components";
import type { FlyingStarData, TowerSelectionProps } from "./types";

export function TowerSelection({
  worldId,
  worldName,
  onSelectTower,
  onBack,
}: TowerSelectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const worldData = getWorldData(worldId);
  const towerState = useMemo(
    () =>
      hydrateTowersWithStoredProgress({
        worldId,
        towers: worldData.towers,
      }),
    [worldId, worldData.towers],
  );
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [flyingStars, setFlyingStars] = useState<FlyingStarData[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({
    width: 0,
    height: 0,
  });

  const regularTowers = towerState.filter((tower) => !tower.isBoss);
  const totalStars = getTotalStars(regularTowers);
  const requiredStars = regularTowers.length;
  const bossUnlockProgress = regularTowers.filter(
    (tower) => tower.unlocked,
  ).length;
  const isBossUnlockable = canUnlockBoss(towerState, requiredStars);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();
      setMapDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(element);

    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      observer.disconnect();
    };
  }, []);

  const handleBossUnlock = useCallback(() => {
    if (isUnlocking) return;
    setIsUnlocking(true);

    const starCounterRect = document
      .getElementById("star-counter")
      ?.getBoundingClientRect();
    const bossTowerRect = document
      .getElementById("boss-tower-target")
      ?.getBoundingClientRect();
    const fallbackBossTowerRect = document
      .getElementById("boss-tower")
      ?.getBoundingClientRect();

    const finalBossRect = bossTowerRect ?? fallbackBossTowerRect;

    if (!starCounterRect || !finalBossRect) {
      setTimeout(() => {
        setIsUnlocking(false);
        onSelectTower(6);
      }, 500);
      return;
    }

    const startCenterX = starCounterRect.left + starCounterRect.width / 2;
    const startCenterY = starCounterRect.top + starCounterRect.height / 2;
    const endCenterX = finalBossRect.left + finalBossRect.width / 2;
    const endCenterY = finalBossRect.top + finalBossRect.height / 2;
    const flightDistanceY = Math.abs(startCenterY - endCenterY);
    const arcLift = Math.min(120, Math.max(34, flightDistanceY * 0.2));

    const stars: FlyingStarData[] = Array.from({ length: 8 }, (_, i) => {
      const startX = startCenterX + (Math.random() - 0.5) * 22;
      const startY = startCenterY + (Math.random() - 0.5) * 16;
      const endX = endCenterX + (Math.random() - 0.5) * 6;
      const endY = endCenterY + (Math.random() - 0.5) * 6;
      const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 20;
      const midY =
        startY + (endY - startY) * (0.44 + Math.random() * 0.06) - arcLift;

      return {
        id: i,
        startX,
        startY,
        midX,
        midY,
        endX,
        endY,
        duration: 1.06 + Math.random() * 0.12,
      };
    });

    setFlyingStars(stars);

    const latestArrivalMs = stars.reduce((maxDelay, star, index) => {
      const starEndMs = index * 70 + star.duration * 1000;
      return Math.max(maxDelay, starEndMs);
    }, 0);

    setTimeout(() => {
      setShowFlash(true);
    }, Math.max(620, latestArrivalMs - 120));

    setTimeout(() => {
      setFlyingStars([]);
      setIsUnlocking(false);
      onSelectTower(6);
    }, latestArrivalMs + 320);
  }, [isUnlocking, onSelectTower]);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-linear-to-b from-green-bright/20 via-background to-blue-soft/20">
      <div className="sticky top-0 z-20 bg-white/95 pt-safe shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-3 p-4">
          <motion.div whileTap={{ scale: 0.95 }}>
            <PrimaryButton
              onClick={onBack}
              className="rounded-2xl shadow-lg"
              frontClassName="p-3"
            >
              <ChevronLeft className="h-6 w-6" />
            </PrimaryButton>
          </motion.div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              {worldName}
            </h1>
            <p className="text-xs text-muted-foreground">Chọn Tháp Để Học Nha Bé</p>
          </div>

          <div
            id="star-counter"
            className="flex items-center gap-2 rounded-2xl bg-yellow-bright/20 px-3 py-2"
          >
            <Star className="h-5 w-5 fill-yellow-bright text-yellow-bright" />
            <span className="font-bold text-foreground">{totalStars}</span>
          </div>
          <Mascot size="sm" emotion="happy" />
        </div>
      </div>

      <div ref={mapRef} className="relative flex-1 overflow-hidden pb-safe">
        <div className="relative h-full w-full">
          <ConnectionLinesSVG
            towers={towerState}
            connections={worldData.towerConnections}
            mapHeightPx={mapDimensions.height}
            mapWidthPx={mapDimensions.width}
          />

          {towerState.map((tower) => (
            <div key={tower.id} className="contents">
              <TowerNode
                tower={tower}
                totalStars={bossUnlockProgress}
                requiredStars={requiredStars}
                canBossUnlock={isBossUnlockable}
                onSelect={onSelectTower}
                onBossUnlock={handleBossUnlock}
              />
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {flyingStars.map((star, index) => (
          <FlyingStar
            key={star.id}
            startX={star.startX}
            startY={star.startY}
            endX={star.endX}
            endY={star.endY}
            midX={star.midX}
            midY={star.midY}
            duration={star.duration}
            delay={index * 0.06}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 bg-yellow-bright/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setShowFlash(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
