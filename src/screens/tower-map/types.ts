import type { Tower, TowerConnection } from "@/data/game-config";

export interface TowerSelectionProps {
  worldId: number;
  worldName: string;
  onSelectTower: (towerId: number) => void;
  onBack: () => void;
}

export interface FlyingStarData {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  duration: number;
}

export interface FlyingStarProps extends Omit<FlyingStarData, "id"> {
  delay: number;
}

export interface TowerNodeProps {
  tower: Tower;
  totalStars: number;
  requiredStars: number;
  canBossUnlock: boolean;
  onSelect: (id: number) => void;
  onBossUnlock: () => void;
}

export interface ConnectionLinesSVGProps {
  towers: Tower[];
  connections: TowerConnection[];
  mapHeightPx: number;
  mapWidthPx: number;
}
