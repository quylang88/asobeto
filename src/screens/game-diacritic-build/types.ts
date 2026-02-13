import type { DiacriticBuildLevelId } from "@/data/game-config";

export type ChallengePhase = "select" | "countdown" | "playing" | "result";
export type FallingKind = "marker" | "debris";
export type TutorialCue = "drop" | "tap" | "drag" | "fly";

export interface FallingEntity {
  id: number;
  lane: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  kind: FallingKind;
  symbol: string;
}

export interface FlyingMarker {
  id: number;
  startX: number;
  startY: number;
  midX: number;
  midY: number;
  endX: number;
  endY: number;
  durationMs: number;
  symbol: string;
}

export interface TutorialState {
  hasSeen: boolean;
  failedAttemptsSinceTutorial: number;
}

export interface AxisBounds {
  min: number;
  max: number;
}

export interface PlayfieldMetrics {
  width: number;
  height: number;
  fallZoneHeight: number;
  slotCenterX: number;
  slotCenterY: number;
}

export interface TutorialHandMotion {
  x: number | number[];
  y: number | number[];
}

export interface LevelStars {
  easy: number;
  normal: number;
  hard: number;
}

export type LevelStarsById = Record<DiacriticBuildLevelId, number>;
