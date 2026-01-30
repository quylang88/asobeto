"use client";

import { useState } from "react";
import { WelcomeScreen } from "@/screens/welcome";
import { WorldMap } from "@/screens/world-map";
import { TowerSelection } from "@/screens/tower-map";
import { FloorSelection } from "@/screens/floor-selection";
import { LessonInterface } from "@/screens/lesson-interface";

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

const worldNames: Record<number, string> = {
  1: "Đảo Chữ Cái",
  2: "Thung Lũng Thanh Điệu",
  3: "Rừng Vần Điệu",
  4: "Xứ Sở Từ Vựng",
};

const towerNames: Record<number, string> = {
  1: "A-D",
  2: "E-H",
  3: "I-L",
  4: "M-P",
  5: "Q-T",
};

const floorNames: Record<number, string> = {
  1: "Nghe & Phát Âm",
  2: "Tập Viết",
  3: "Ghép Vần",
  4: "Trò Chơi Trùm",
};

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

    case "towerSelection":
      return (
        <TowerSelection
          worldId={gameState.selectedWorld!}
          worldName={worldNames[gameState.selectedWorld!]}
          onSelectTower={handleSelectTower}
          onBack={() => handleBack("worldMap")}
        />
      );

    case "floorSelection":
      return (
        <FloorSelection
          towerId={gameState.selectedTower!}
          towerName={towerNames[gameState.selectedTower!]}
          onSelectFloor={handleSelectFloor}
          onBack={() => handleBack("towerSelection")}
        />
      );

    case "lesson":
      return (
        <LessonInterface
          floorId={gameState.selectedFloor!}
          floorName={floorNames[gameState.selectedFloor!]}
          onComplete={handleLessonComplete}
          onBack={() => handleBack("floorSelection")}
        />
      );

    default:
      return <WelcomeScreen onStart={handleStart} />;
  }
}
