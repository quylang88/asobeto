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
import { GameCowGrassFeed } from "@/screens/game-cow-grass-feed";
import { worlds, getWorldData } from "@/data/game-config";

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
    setGameState({
      ...gameState,
      currentScreen: "floorSelection",
      selectedTower: towerId,
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
      const diacriticChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "diacritic_build_challenge",
      );
      const bubbleChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "bubble_pop_challenge",
      );
      const memoryFlipChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "memory_flip_challenge",
      );
      const cowGrassChallengeLesson = selectedFloor?.content?.find(
        (lesson) => lesson.lessonKind === "cow_grass_feed_challenge",
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
            onBack={() => handleBack("floorSelection")}
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
            onBack={() => handleBack("floorSelection")}
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
            onBack={() => handleBack("floorSelection")}
          />
        );
      }

      if (cowGrassChallengeLesson) {
        return (
          <GameCowGrassFeed
            worldId={gameState.selectedWorld!}
            towerId={gameState.selectedTower!}
            floorId={gameState.selectedFloor!}
            floorName={selectedFloor?.nameUnlocked || "Unknown Floor"}
            floorMaxStars={selectedFloor?.maxStars ?? 3}
            lesson={cowGrassChallengeLesson}
            onComplete={handleLessonComplete}
            onBack={() => handleBack("floorSelection")}
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
          onBack={() => handleBack("floorSelection")}
        />
      );
    }

    default:
      return <WelcomeScreen onStart={handleStart} />;
  }
}
