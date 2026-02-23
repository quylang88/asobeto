"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Mascot } from "@/components/beto-mascot";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  canUnlockBoss,
  getTotalStars,
  getWorldData,
  getWorldTheme,
  type World1BookPage,
} from "@/data/game-config";
import { hydrateTowersWithStoredProgress } from "@/lib/floor-progress";
import { ConnectionLinesSVG, FlyingStar, TowerNode } from "./components";
import type { FlyingStarData, TowerSelectionProps } from "./types";

const pageFlipVariants = {
  enter: (direction: 1 | -1) => ({
    opacity: 0,
    rotateY: direction > 0 ? -24 : 24,
    x: direction > 0 ? 72 : -72,
    scale: 0.97,
    filter: "blur(1px)",
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    rotateY: direction > 0 ? 24 : -24,
    x: direction > 0 ? -72 : 72,
    scale: 0.97,
    filter: "blur(1px)",
  }),
} as const;

export function TowerSelection({
  worldId,
  worldName,
  currentPage,
  totalPages,
  pageFlipDirection,
  onPreviousPage,
  onNextPage,
  onSelectTower,
  onBack,
}: TowerSelectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const world1BookPage: World1BookPage =
    currentPage === 2 || currentPage === 3 ? currentPage : 1;
  const worldData = getWorldData(worldId, { world1BookPage });
  const worldTheme = getWorldTheme(worldId, world1BookPage).towerMap;
  const towerState = useMemo(
    () =>
      hydrateTowersWithStoredProgress({
        worldId,
        world1BookPage,
        towers: worldData.towers,
      }),
    [world1BookPage, worldId, worldData.towers],
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
  const canGoPreviousPage = currentPage > 1;
  const canGoNextPage = currentPage < totalPages;
  const isPageSwitchDisabled = isUnlocking || showFlash || flyingStars.length > 0;

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
  }, [worldId, world1BookPage]);

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
    <div className="relative h-dvh w-full overflow-hidden">
      <AnimatePresence custom={pageFlipDirection} mode="wait">
        <motion.section
          key={`${worldId}-${world1BookPage}`}
          custom={pageFlipDirection}
          variants={pageFlipVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{
            transformPerspective: 1400,
            transformOrigin:
              pageFlipDirection > 0 ? "left center" : "right center",
          }}
          className={`absolute inset-0 flex h-dvh w-full flex-col overflow-hidden ${worldTheme.backgroundClass}`}
        >
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
                <p className="text-xs text-muted-foreground">
                  Chọn Tháp Để Học Nha Bé
                </p>
              </div>

              <div
                id="star-counter"
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${worldTheme.starCounterClass}`}
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
                theme={worldTheme}
              />

              {towerState.map((tower) => (
                <div key={tower.id} className="contents">
                  <TowerNode
                    tower={tower}
                    theme={worldTheme}
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

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-4 pt-2">
            <div className="flex items-center justify-between pb-safe">
              <div className="pointer-events-auto">
                {canGoPreviousPage && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={onPreviousPage}
                    disabled={isPageSwitchDisabled}
                    aria-label="Trang trước"
                    className="ios-button flex items-center justify-center rounded-2xl bg-white/90 p-3 text-foreground shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
              <div className="pointer-events-auto">
                {canGoNextPage && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={onNextPage}
                    disabled={isPageSwitchDisabled}
                    aria-label="Trang sau"
                    className="ios-button flex items-center justify-center rounded-2xl bg-white/90 p-3 text-foreground shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

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
