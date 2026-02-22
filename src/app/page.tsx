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
import {
  worlds,
  getWorldData,
  type LessonContent,
  createBossFloor1Lessons,
  type World1BookPage,
  WORLD1_BOOK_TOTAL_PAGES,
  getWorld1BookPageWorldId,
} from "@/data/game-config";
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

const WORLD1_ID = 1;
const FIRST_WORLD1_PAGE: World1BookPage = 1;
const LAST_WORLD1_PAGE: World1BookPage = WORLD1_BOOK_TOTAL_PAGES;

function clampWorld1Page(page: number): World1BookPage {
  return Math.max(FIRST_WORLD1_PAGE, Math.min(LAST_WORLD1_PAGE, page)) as World1BookPage;
}

function resolveDataWorldId(
  selectedWorld: number | null,
  world1BookPage: World1BookPage,
): number | null {
  if (selectedWorld === null) return null;
  if (selectedWorld === WORLD1_ID) {
    return getWorld1BookPageWorldId(world1BookPage);
  }
  return selectedWorld;
}

function resolveBossEntryFloorId(worldId: number, towerId: number): number | null {
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
  return reviewFloor?.id ?? null;
}

export default function AsobetoApp() {
  const [gameState, setGameState] = useState<GameState>({
    currentScreen: "welcome",
    selectedWorld: null,
    selectedTower: null,
    selectedFloor: null,
  });
  const [world1BookPage, setWorld1BookPage] =
    useState<World1BookPage>(FIRST_WORLD1_PAGE);
  const [towerPageFlipDirection, setTowerPageFlipDirection] = useState<1 | -1>(
    1,
  );
  const [bossReviewLessons, setBossReviewLessons] = useState<
    LessonContent[] | null
  >(null);

  const handleStart = () => {
    setGameState({ ...gameState, currentScreen: "worldMap" });
  };

  const handleSelectWorld = (worldId: number) => {
    const isWorld1 = worldId === WORLD1_ID;
    setWorld1BookPage(FIRST_WORLD1_PAGE);
    setTowerPageFlipDirection(1);
    setGameState({
      ...gameState,
      currentScreen: "towerSelection",
      selectedWorld: worldId,
      selectedTower: null,
      selectedFloor: null,
    });
    if (!isWorld1) {
      setTowerPageFlipDirection(1);
    }
  };

  const handleWorld1PageNavigate = (direction: 1 | -1) => {
    if (gameState.selectedWorld !== WORLD1_ID) return;
    const nextPage = clampWorld1Page(world1BookPage + direction);
    if (nextPage === world1BookPage) return;

    setTowerPageFlipDirection(direction);
    setWorld1BookPage(nextPage);
    setBossReviewLessons(null);
    setGameState({
      ...gameState,
      currentScreen: "towerSelection",
      selectedTower: null,
      selectedFloor: null,
    });
  };

  const handleSelectTower = (towerId: number) => {
    const dataWorldId = resolveDataWorldId(gameState.selectedWorld, world1BookPage);
    if (dataWorldId === null) return;

    const worldData = getWorldData(dataWorldId);
    const selectedTower = worldData.towers.find((tower) => tower.id === towerId);

    if (selectedTower?.isBoss) {
      const autoFloorId = resolveBossEntryFloorId(dataWorldId, towerId);
      if (autoFloorId !== null) {
        // Mỗi lần vào lại BOSS floor 1 đều sinh bộ đề mới.
        setBossReviewLessons(
          autoFloorId === 1 ? createBossFloor1Lessons() : null,
        );
        setGameState({
          ...gameState,
          currentScreen: "lesson",
          selectedTower: towerId,
          selectedFloor: autoFloorId,
        });
        return;
      }
    }

    setBossReviewLessons(null);
    setGameState({
      ...gameState,
      currentScreen: "floorSelection",
      selectedTower: towerId,
      selectedFloor: null,
    });
  };

  const handleSelectFloor = (floorId: number) => {
    setBossReviewLessons(null);
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
      setWorld1BookPage(FIRST_WORLD1_PAGE);
    } else if (toScreen === "worldMap") {
      newState.selectedTower = null;
      newState.selectedFloor = null;
      setWorld1BookPage(FIRST_WORLD1_PAGE);
    } else if (toScreen === "towerSelection") {
      newState.selectedFloor = null;
    }

    setGameState(newState);
  };

  const handleLessonComplete = () => {
    const dataWorldId = resolveDataWorldId(gameState.selectedWorld, world1BookPage);
    const selectedTowerId = gameState.selectedTower;

    if (dataWorldId !== null && selectedTowerId !== null) {
      const worldData = getWorldData(dataWorldId);
      const selectedTower = worldData.towers.find(
        (tower) => tower.id === selectedTowerId,
      );

      if (selectedTower?.isBoss) {
        setBossReviewLessons(null);
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
          worldId={
            resolveDataWorldId(gameState.selectedWorld, world1BookPage) ??
            WORLD1_ID
          }
          worldName={selectedWorld?.name || "Unknown World"}
          currentPage={gameState.selectedWorld === WORLD1_ID ? world1BookPage : 1}
          totalPages={
            gameState.selectedWorld === WORLD1_ID ? WORLD1_BOOK_TOTAL_PAGES : 1
          }
          pageFlipDirection={
            gameState.selectedWorld === WORLD1_ID ? towerPageFlipDirection : 1
          }
          onPreviousPage={() => handleWorld1PageNavigate(-1)}
          onNextPage={() => handleWorld1PageNavigate(1)}
          onSelectTower={handleSelectTower}
          onBack={() => handleBack("worldMap")}
        />
      );
    }

    case "floorSelection": {
      const dataWorldId =
        resolveDataWorldId(gameState.selectedWorld, world1BookPage) ?? WORLD1_ID;
      const worldData = getWorldData(dataWorldId);
      const selectedTower = worldData.towers.find(
        (t) => t.id === gameState.selectedTower!,
      );
      return (
        <FloorSelection
          worldId={dataWorldId}
          towerId={gameState.selectedTower!}
          towerName={selectedTower?.name || "Unknown Tower"}
          onSelectFloor={handleSelectFloor}
          onBack={() => handleBack("towerSelection")}
        />
      );
    }

    case "lesson": {
      const dataWorldId =
        resolveDataWorldId(gameState.selectedWorld, world1BookPage) ?? WORLD1_ID;
      const worldData = getWorldData(dataWorldId);
      const selectedTower = worldData.towers.find(
        (t) => t.id === gameState.selectedTower!,
      );
      const selectedFloor = selectedTower?.floors?.find(
        (f) => f.id === gameState.selectedFloor!,
      );
      const isBossReviewFloor = Boolean(
        selectedTower?.isBoss && selectedFloor?.id === 1,
      );
      const currentLessons = isBossReviewFloor
        ? (bossReviewLessons ?? createBossFloor1Lessons())
        : (selectedFloor?.content ?? []);
      const shouldSkipFloorSelection = Boolean(selectedTower?.isBoss);
      const lessonBackScreen: Screen = shouldSkipFloorSelection
        ? "towerSelection"
        : "floorSelection";
      const diacriticChallengeLesson = currentLessons.find(
        (lesson) => lesson.lessonKind === "diacritic_build_challenge",
      );
      const bubbleChallengeLesson = currentLessons.find(
        (lesson) => lesson.lessonKind === "bubble_pop_challenge",
      );
      const memoryFlipChallengeLesson = currentLessons.find(
        (lesson) => lesson.lessonKind === "memory_flip_challenge",
      );
      const animalFeedChallengeLesson = currentLessons.find(
        (lesson) => lesson.lessonKind === "animal_feed_challenge",
      );

      if (diacriticChallengeLesson) {
        return (
          <GameDiacriticBuild
            worldId={dataWorldId}
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
            worldId={dataWorldId}
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
            worldId={dataWorldId}
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
            worldId={dataWorldId}
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
          key={`${dataWorldId}-${gameState.selectedTower}-${gameState.selectedFloor}`}
          worldId={dataWorldId}
          towerId={gameState.selectedTower!}
          floorId={gameState.selectedFloor!}
          floorName={selectedFloor?.nameUnlocked || "Unknown Floor"}
          floorMaxStars={selectedFloor?.maxStars ?? 3}
          lessons={currentLessons}
          onComplete={handleLessonComplete}
          onBossFloorSelect={(targetFloorId) => {
            if (targetFloorId === 1) {
              // Khi bé chọn ôn lại floor 1 ở màn BOSS review,
              // tạo lại bộ lesson để tránh lặp đề cũ.
              setBossReviewLessons(createBossFloor1Lessons());
            }
            setGameState((prev) => ({
              ...prev,
              currentScreen: "lesson",
              selectedFloor: targetFloorId,
            }));
          }}
          onBack={() => handleBack(lessonBackScreen)}
        />
      );
    }

    default:
      return <WelcomeScreen onStart={handleStart} />;
  }
}
