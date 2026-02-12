// Dữ liệu nội dung game với vị trí tháp cho bản đồ dạng cây phân nhánh

export interface TowerPosition {
  x: number; // tỷ lệ phần trăm 0-100
  y: number; // tỷ lệ phần trăm 0-100
}

export type LessonType = "passive" | "active";
export type LessonKind =
  | "letter_listen"
  | "letter_quiz"
  | "letter_trace_demo"
  | "letter_trace_practice"
  | "vocab_listen_look"
  | "vocab_listen_repeat"
  | "vocab_word_build"
  | "vocab_trace_practice"
  | "bubble_pop_challenge";
export type ScoringMetric =
  | "none"
  | "correct_answer"
  | "speech_similarity"
  | "trace_accuracy"
  | "word_assembly_accuracy";

export interface LessonGating {
  requiredAudioPlays?: number;
  requireAnimationComplete?: boolean;
}

export interface LessonScoring {
  metric: ScoringMetric;
  passPolicy: "always" | "threshold";
  passThreshold?: number;
  starThresholds?: {
    oneStar?: number;
    twoStars?: number;
  };
  maxStars: number;
}

export interface WordToken {
  id: string;
  text: string;
  kind: "letter" | "tone";
}

export type BubblePopLevelId = "easy" | "normal" | "hard";

export interface BubblePassStarRule {
  stars: 1 | 2 | 3;
  minLivesLost?: number;
  maxLivesLost?: number;
  minTimeLeftExclusive?: number;
  maxTimeLeftInclusive?: number;
}

export interface BubblePopLevelConfig {
  id: BubblePopLevelId;
  label: string;
  starsReward: 1 | 2 | 3;
  passStarRules?: BubblePassStarRule[];
  durationSeconds: number;
  targetScore: number;
  minLivesToPass: number;
  targetBubbleRatio: number;
  emptyBubbleRatio: number;
  bubbleSize: number;
  spawnIntervalMs: {
    min: number;
    max: number;
  };
  speedRange: {
    min: number;
    max: number;
  };
  allowPairSpawn?: boolean;
  pairSpawnChance?: number;
}

export interface BubblePopGameConfig {
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules: string[];
  rulesAudioText: string;
  introAudio?: string;
  rulesAudio?: string;
  targetAudioByLetter?: Record<string, string>;
  startLives: number;
  targetLetters: [string, string];
  laneCount: number;
  minSpawnVerticalGap: number;
  levels: BubblePopLevelConfig[];
}

export interface LessonAnswer {
  id: string;
  text?: string;
  image?: string;
  audio?: string;
  isCorrect: boolean;
}

export type FloorSelectionIcon = "letter_block" | "cas-svg" | "awn-svg";
export type FloorType = "letter_learning" | "vocabulary_learning" | "game";

export interface LessonContent {
  id: string;
  type: LessonType;
  lessonKind?: LessonKind;

  // Display Data
  mainImage?: string;
  mainAudio?: string;
  title?: string;
  instruction?: string;
  introVoice?: string;

  // Active Data
  question?: string;
  answers?: LessonAnswer[];
  targetText?: string;
  targetLetter?: string;
  targetTokens?: WordToken[];
  tokenPool?: WordToken[];
  relatedLetters?: string[];
  bubblePopGame?: BubblePopGameConfig;
  gating?: LessonGating;
  scoring?: LessonScoring;

  // Legacy support/Optional extra fields if needed
  pronunciation?: string;
  // Deprecated fields kept for reference during migration if strictly needed, but I will remove them as per plan.
}

export interface Floor {
  id: number;
  floorType: FloorType;
  nameUnlocked: string;
  nameLocked?: string;
  descriptionUnlocked: string;
  descriptionLocked?: string;
  letter?: string;
  selectionIcon?: FloorSelectionIcon;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  completed: boolean;
  unlocked: boolean;
  stars: number;
  maxStars?: number;
  content?: LessonContent[];
}

export interface Tower {
  id: number;
  name: string;
  letters: string;
  stars: number;
  maxStars: number;
  completed: boolean;
  unlocked: boolean;
  position: TowerPosition;
  parentIds: number[]; // ID của các tháp mở khóa tháp này
  isBoss?: boolean;
  floors?: Floor[];
}

import { tower1Floors } from "./tower-1";
import { tower2Floors } from "./tower-2";
import { tower3Floors } from "./tower-3";
import { tower4Floors } from "./tower-4";
import { tower5Floors } from "./tower-5";

export interface TowerConnection {
  from: number;
  to: number;
}

// Cấu trúc cây tháp:
//          T1 (gốc)
//         /  \
//       T2    T3
//       |      |
//      T4     T5
//        \   /
//       Tháp Boss

export const towers: Tower[] = [
  {
    id: 1,
    name: "a",
    letters: "a, c",
    stars: 3,
    maxStars: 12,
    completed: true,
    unlocked: true,
    position: { x: 50, y: 15 },
    parentIds: [],
    floors: tower1Floors,
  },
  {
    id: 2,
    name: "ă",
    letters: "ă, n",
    stars: 2,
    maxStars: 12,
    completed: true,
    unlocked: true,
    position: { x: 25, y: 38 },
    parentIds: [1],
    floors: tower2Floors,
  },
  {
    id: 3,
    name: "e",
    letters: "e, m",
    stars: 3,
    maxStars: 12,
    completed: true,
    unlocked: true,
    position: { x: 75, y: 38 },
    parentIds: [1],
    floors: tower3Floors,
  },
  {
    id: 4,
    name: "o",
    letters: "o, b",
    stars: 0,
    maxStars: 12,
    completed: false,
    unlocked: true,
    position: { x: 25, y: 62 },
    parentIds: [2],
    floors: tower4Floors,
  },
  {
    id: 5,
    name: "ô",
    letters: "ô, b",
    stars: 0,
    maxStars: 12,
    completed: false,
    unlocked: false,
    position: { x: 75, y: 62 },
    parentIds: [3],
    floors: tower5Floors,
  },
  {
    id: 6,
    name: "BOSS!!!!",
    letters: "Thử Thách",
    stars: 0,
    maxStars: 5,
    completed: false,
    unlocked: false,
    position: { x: 50, y: 85 },
    parentIds: [4, 5],
    isBoss: true,
  },
];

// Định nghĩa các kết nối giữa các tháp
export const towerConnections: TowerConnection[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
];

// Tính tổng số sao đạt được
export function getTotalStars(towerList: Tower[]): number {
  return towerList.reduce((sum, tower) => sum + tower.stars, 0);
}

// Tính tổng số sao tối đa
export function getMaxStars(towerList: Tower[]): number {
  return towerList.reduce((sum, tower) => sum + tower.maxStars, 0);
}

// Kiểm tra xem tháp boss có thể mở khóa không
export function canUnlockBoss(
  towerList: Tower[],
  requiredStars: number = 15,
): boolean {
  const regularTowers = towerList.filter((t) => !t.isBoss);
  const allCompleted = regularTowers.every((t) => t.completed);
  const totalStars = getTotalStars(regularTowers);
  return allCompleted && totalStars >= requiredStars;
}

// Kiểm tra xem một tháp có nên được mở khóa dựa trên việc hoàn thành tháp cha
export function shouldTowerBeUnlocked(
  tower: Tower,
  allTowers: Tower[],
): boolean {
  if (tower.parentIds.length === 0) return true; // Tháp gốc luôn mở

  if (tower.isBoss) {
    // Boss yêu cầu TẤT CẢ các tháp cha phải hoàn thành
    return tower.parentIds.every((parentId) => {
      const parent = allTowers.find((t) => t.id === parentId);
      return parent?.completed;
    });
  }

  // Tháp thường mở khi BẤT KỲ tháp cha nào hoàn thành
  return tower.parentIds.some((parentId) => {
    const parent = allTowers.find((t) => t.id === parentId);
    return parent?.completed;
  });
}
