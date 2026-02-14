"use client";

import { useState } from "react";
import { WelcomeScreen } from "@/screens/welcome";
import { WorldMap } from "@/screens/world-map";
import { TowerSelection } from "@/screens/tower-map";
import { FloorSelection } from "@/screens/floor-selection";
import { LessonInterface } from "@/screens/lesson-interface";
import { GameBubblePop } from "@/screens/game-bubble-pop";
import { GameDiacriticBuild } from "@/screens/game-diacritic-build";
import { GameMemoryFlip } from "@/screens/game-memory-flip";
import { GameAnimalFeed } from "@/screens/game-animal-feed";
import { worlds, getWorldData } from "@/data/game-config";
import { hydrateFloorsWithStoredProgress } from "@/lib/floor-progress";

type Screen =
  | "welcome"
  | "worldMap"
  | "towerSelection"
  | "floorSelection"
  | "lesson";

interface GameState {
  currentScreen: Screen;
  selectedWorld: number | null;
  selectedTower: number | null;
  selectedFloor: number | null;
}

const BOSS_REVIEW_PASS_THRESHOLD = 5;

function resolveBossAutoFloorId(worldId: number, towerId: number): number | null {
  const worldData = getWorldData(worldId);
  const bossTower = worldData.towers.find((tower) => tower.id === towerId);
  if (!bossTower?.isBoss || !bossTower.floors?.length) {
    return null;
  }

  const hydratedFloors = hydrateFloorsWithStoredProgress({
    worldId,
    towerId,
    floors: bossTower.floors,
  });
  const reviewFloor = hydratedFloors.find((floor) => floor.id === 1) ?? hydratedFloors[0];
  const mysteryFloor =
    hydratedFloors.find((floor) =>
      floor.content?.some((lesson) => lesson.lessonKind === "memory_flip_challenge"),
    ) ?? hydratedFloors[hydratedFloors.length - 1];

  if (!reviewFloor) {
    return mysteryFloor?.id ?? null;
  }

  const hasPassedReview = (reviewFloor.stars ?? 0) >= BOSS_REVIEW_PASS_THRESHOLD;
  if (hasPassedReview && mysteryFloor) {
    return mysteryFloor.id;
  }

  return reviewFloor.id;
}

export default function AsobetoApp() {
  const [gameState, setGameState] = useState<GameState>({
    currentScreen: "welcome",
    selectedWorld: null,
    selectedTower: null,
    selectedFloor: null,
  });

  const handleStart = () => {
    setGameState({ ...gameState, currentScreen: "worldMap" });
  };

  const handleSelectWorld = (worldId: number) => {
    setGameState({
      ...gameState,
      currentScreen: "towerSelection",
      selectedWorld: worldId,
    });
  };

  const handleSelectTower = (towerId: number) => {
    const selectedWorldId = gameState.selectedWorld;
    if (selectedWorldId === null) return;

    const worldData = getWorldData(selectedWorldId);
    const selectedTower = worldData.towers.find((tower) => tower.id === towerId);

    if (selectedTower?.isBoss) {
      const autoFloorId = resolveBossAutoFloorId(selectedWorldId, towerId);
      if (autoFloorId !== null) {
        setGameState({
          ...gameState,
          currentScreen: "lesson",
          selectedTower: towerId,
          selectedFloor: autoFloorId,
        });
        return;
      }
    }

    setGameState({
      ...gameState,
      currentScreen: "floorSelection",
      selectedTower: towerId,
      selectedFloor: null,
    });
  };

  const handleSelectFloor = (floorId: number) => {
    setGameState({
      ...gameState,
      currentScreen: "lesson",
      selectedFloor: floorId,
    });
  };

  const handleBack = (toScreen: Screen) => {
    const newState: GameState = { ...gameState, currentScreen: toScreen };

    if (toScreen === "welcome") {
      newState.selectedWorld = null;
      newState.selectedTower = null;
      newState.selectedFloor = null;
    } else if (toScreen === "worldMap") {
      newState.selectedTower = null;
      newState.selectedFloor = null;
    } else if (toScreen === "towerSelection") {
      newState.selectedFloor = null;
    }

    setGameState(newState);
  };

  const handleLessonComplete = () => {
    const selectedWorldId = gameState.selectedWorld;
    const selectedTowerId = gameState.selectedTower;

    if (selectedWorldId !== null && selectedTowerId !== null) {
      const worldData = getWorldData(selectedWorldId);
      const selectedTower = worldData.towers.find(
        (tower) => tower.id === selectedTowerId,
      );

      if (selectedTower?.isBoss) {
        const nextBossFloorId = resolveBossAutoFloorId(
          selectedWorldId,
          selectedTowerId,
        );

        if (
          nextBossFloorId !== null &&
          nextBossFloorId !== gameState.selectedFloor
        ) {
          setGameState({
            ...gameState,
            currentScreen: "lesson",
            selectedFloor: nextBossFloorId,
          });
          return;
        }

        setGameState({
          ...gameState,
          currentScreen: "towerSelection",
          selectedFloor: null,
        });
        return;
      }
    }

    setGameState({
      ...gameState,
      currentScreen: "floorSelection",
      selectedFloor: null,
    });
  };

  switch (gameState.currentScreen) {
    case "welcome":
      return <WelcomeScreen onStart={handleStart} />;

    case "worldMap":
      return (
        <WorldMap
          onSelectWorld={handleSelectWorld}
          onBack={() => handleBack("welcome")}
        />
      );

    case "towerSelection": {
      const selectedWorld = worlds.find(
        (w) => w.id === gameState.selectedWorld,
      );
      return (
        <TowerSelection
          worldId={gameState.selectedWorld!}
          worldName={selectedWorld?.name || "Unknown World"}
          onSelectTower={handleSelectTower}
          onBack={() => handleBack("worldMap")}
        />
      );
    }

    case "floorSelection": {
      const worldData = getWorldData(gameState.selectedWorld!);
      const selectedTower = worldData.towers.find(
        (t) => t.id === gameState.selectedTower!,
      );
      return (
        <FloorSelection
          worldId={gameState.selectedWorld!}
          towerId={gameState.selectedTower!}
          towerName={selectedTower?.name || "Unknown Tower"}
          onSelectFloor={handleSelectFloor}
          onBack={() => handleBack("towerSelection")}
        />
      );
    }

    case "lesson": {
      const worldData = getWorldData(gameState.selectedWorld!);
      const selectedTower = worldData.towers.find(
        (t) => t.id === gameState.selectedTower!,
      );
      const selectedFloor = selectedTower?.floors?.find(
        (f) => f.id === gameState.selectedFloor!,
      );
      const shouldSkipFloorSelection = Boolean(selectedTower?.isBoss);
      const lessonBackScreen: Screen = shouldSkipFloorSelection
        ? "towerSelection"
        : "floorSelection";
      const diacriticChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "diacritic_build_challenge",
      );
      const bubbleChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "bubble_pop_challenge",
      );
      const memoryFlipChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "memory_flip_challenge",
      );
      const animalFeedChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "animal_feed_challenge",
      );

      if (diacriticChallengeLesson) {
        return (
          <GameDiacriticBuild
            worldId={gameState.selectedWorld!}
            towerId={gameState.selectedTower!}
            floorId={gameState.selectedFloor!}
            floorName={selectedFloor?.nameUnlocked || "Unknown Floor"}
            floorMaxStars={selectedFloor?.maxStars ?? 3}
            lesson={diacriticChallengeLesson}
            onComplete={handleLessonComplete}
            onBack={() => handleBack(lessonBackScreen)}
          />
        );
      }

      if (bubbleChallengeLesson) {
        return (
          <GameBubblePop
            worldId={gameState.selectedWorld!}
            towerId={gameState.selectedTower!}
            floorId={gameState.selectedFloor!}
            floorName={selectedFloor?.nameUnlocked || "Unknown Floor"}
            floorMaxStars={selectedFloor?.maxStars ?? 3}
            lesson={bubbleChallengeLesson}
            onComplete={handleLessonComplete}
            onBack={() => handleBack(lessonBackScreen)}
          />
        );
      }

      if (memoryFlipChallengeLesson) {
        return (
          <GameMemoryFlip
            worldId={gameState.selectedWorld!}
            towerId={gameState.selectedTower!}
            floorId={gameState.selectedFloor!}
            floorName={selectedFloor?.nameUnlocked || "Unknown Floor"}
            floorMaxStars={selectedFloor?.maxStars ?? 3}
            lesson={memoryFlipChallengeLesson}
            onComplete={handleLessonComplete}
            onBack={() => handleBack(lessonBackScreen)}
          />
        );
      }

      if (animalFeedChallengeLesson) {
        return (
          <GameAnimalFeed
            worldId={gameState.selectedWorld!}
            towerId={gameState.selectedTower!}
            floorId={gameState.selectedFloor!}
            floorName={selectedFloor?.nameUnlocked || "Unknown Floor"}
            floorMaxStars={selectedFloor?.maxStars ?? 3}
            lesson={animalFeedChallengeLesson}
            onComplete={handleLessonComplete}
            onBack={() => handleBack(lessonBackScreen)}
          />
        );
      }

      return (
        <LessonInterface
          worldId={gameState.selectedWorld!}
          towerId={gameState.selectedTower!}
          floorId={gameState.selectedFloor!}
          floorName={selectedFloor?.nameUnlocked || "Unknown Floor"}
          floorMaxStars={selectedFloor?.maxStars ?? 3}
          lessons={selectedFloor?.content || []}
          onComplete={handleLessonComplete}
          onBack={() => handleBack(lessonBackScreen)}
        />
      );
    }

    default:
      return <WelcomeScreen onStart={handleStart} />;
  }
}
