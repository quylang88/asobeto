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
  | "vocab_image_quiz"
  | "pronunciation_practice"
  | "vocab_word_build"
  | "vocab_trace_practice"
  | "animal_feed_challenge"
  | "bubble_pop_challenge"
  | "diacritic_build_challenge"
  | "memory_flip_challenge";
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

export type LessonScoringProgressMode = "stars" | "pass_count";

export interface LessonScoring {
  metric: ScoringMetric;
  passPolicy: "always" | "threshold";
  passThreshold?: number;
  starThresholds?: {
    oneStar?: number;
    twoStars?: number;
  };
  maxStars: number;
  progressMode?: LessonScoringProgressMode;
}

export interface WordToken {
  id: string;
  text: string;
  kind: "letter" | "tone";
}

export type BubblePopLevelId = "easy" | "normal" | "hard";

export interface ChallengePassStarRule {
  stars: 1 | 2 | 3;
  minLivesLost?: number;
  maxLivesLost?: number;
  minTimeLeftExclusive?: number;
  maxTimeLeftInclusive?: number;
}

export type BubblePassStarRule = ChallengePassStarRule;

export interface BubblePopLevelConfig {
  id: BubblePopLevelId;
  label: string;
  starsReward: 1 | 2 | 3;
  passStarRules?: ChallengePassStarRule[];
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

export type AnimalFeedLevelId = "easy" | "normal" | "hard";
export type AnimalFeedRoundSide = "left" | "right";

export interface AnimalFeedProgressSegment {
  id: string;
  label: string;
  requiredHits: number;
}

export interface AnimalFeedLevelConfig {
  id: AnimalFeedLevelId;
  label: string;
  starsReward: 1 | 2 | 3;
  roundDurationSeconds: number;
  startLives: number;
  progressSegments: AnimalFeedProgressSegment[];
  easyHintSecondsLeft?: number;
}

export interface AnimalFeedTutorialConfig {
  enabledLevelId: AnimalFeedLevelId;
  durationMs: number;
  replayAfterFailCount: number;
}

export interface AnimalFeedGameConfig {
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules: string[];
  animalIconId: string;
  foodVisualId: string;
  progressSentence: string;
  sentenceTokens: string[];
  correctWord: string;
  distractorWords: [string, string, string];
  antiRepeatMaxDistractorStreak: number;
  antiRepeatMaxCorrectSideStreak: number;
  timeoutRevealMs: number;
  correctResolveMs: number;
  wrongResolveMs: number;
  timeoutResolveMs: number;
  sentenceCelebrateMs: number;
  animalChewMs: number;
  animalSadMs: number;
  tutorial: AnimalFeedTutorialConfig;
  levels: AnimalFeedLevelConfig[];
}

export type DiacriticBuildLevelId = "easy" | "normal" | "hard";

export type DiacriticBuildInteractionMode = "tap" | "catcher_drag";

export interface DiacriticBuildLevelConfig {
  id: DiacriticBuildLevelId;
  label: string;
  starsReward: 1 | 2 | 3;
  passStarRules?: ChallengePassStarRule[];
  durationSeconds: number;
  targetCompletions: number;
  startLives: number;
  correctSpawnRatioRange: {
    min: number;
    max: number;
  };
  spawnIntervalMs: {
    min: number;
    max: number;
  };
  fallDurationSeconds: {
    min: number;
    max: number;
  };
  objectSize: {
    min: number;
    max: number;
  };
  maxConsecutiveDebris: number;
  slotFlightMs: {
    min: number;
    max: number;
  };
  morphResetDelayMs: {
    min: number;
    max: number;
  };
}

export interface DiacriticBuildTutorialConfig {
  enabledLevelId: DiacriticBuildLevelId;
  durationMs: number;
  replayAfterFailCount: number;
}

export interface DiacriticBuildGameConfig {
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules: string[];
  rulesAudioText?: string;
  countdownHintText?: string;
  interactionMode?: DiacriticBuildInteractionMode;
  targetLetter: string;
  baseLetter: string;
  markerSymbol: string;
  debrisSymbols: string[];
  catcherHitboxScale?: number;
  laneCount: number;
  minSpawnVerticalGap: number;
  playfieldFooterRatio: number;
  playfieldHeightVh?: number;
  hitboxScale: number;
  tutorial?: DiacriticBuildTutorialConfig;
  levels: DiacriticBuildLevelConfig[];
}

export type MemoryFlipLevelId = "easy" | "normal" | "hard";

export interface MemoryFlipMoveStarRule {
  stars: 1 | 2 | 3;
  minMovesInclusive?: number;
  maxMovesInclusive?: number;
}

export type MemoryFlipCardTokenKind = "letter" | "word";

export interface MemoryFlipCardToken {
  id: string;
  text: string;
  kind: MemoryFlipCardTokenKind;
}

export type MemoryFlipCardBackIcon = "diamond" | "star" | "sparkle";

export interface MemoryFlipCardBackOption {
  id: string;
  label: string;
  icon: MemoryFlipCardBackIcon;
  gradientFrom: string;
  gradientTo: string;
  stripeColor: string;
  iconColor: string;
  ringColor: string;
}

export interface MemoryFlipLevelConfig {
  id: MemoryFlipLevelId;
  label: string;
  starsReward: 1 | 2 | 3;
  pairTarget: number;
  grid: {
    columns: number;
    rows: number;
  };
  moveLimit: number;
  passStarRules?: MemoryFlipMoveStarRule[];
}

export interface MemoryFlipTutorialConfig {
  enabledLevelId: MemoryFlipLevelId;
  replayAfterFailCount: number;
  mismatchFlipBackDelayMs: {
    min: number;
    max: number;
  };
}

export interface MemoryFlipGameConfig {
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules: string[];
  grid: {
    columns: number;
    rows: number;
  };
  pairTarget: number;
  tutorial: MemoryFlipTutorialConfig;
  levelTokenPools: Record<MemoryFlipLevelId, MemoryFlipCardToken[]>;
  levels: MemoryFlipLevelConfig[];
  cardBackOptions: MemoryFlipCardBackOption[];
  audio: {
    flip: string;
    match: string;
    mismatch: string;
  };
}

export interface LessonAnswer {
  id: string;
  text?: string;
  image?: string;
  wordAssetKey?: string;
  audio?: string;
  isCorrect: boolean;
}

export type FloorSelectionIcon =
  | "letter_block"
  | "cas-svg"
  | "awn-svg"
  | "cor-svg"
  | "bof-svg"
  | "boos-svg"
  | "mej-svg";
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
  introVoiceOptions?: string[];
  disableIntro?: boolean;
  fogMode?: "erasable" | "locked";

  // Active Data
  question?: string;
  answers?: LessonAnswer[];
  targetText?: string;
  targetLetter?: string;
  targetTokens?: WordToken[];
  tokenPool?: WordToken[];
  relatedLetters?: string[];
  animalFeedGame?: AnimalFeedGameConfig;
  bubblePopGame?: BubblePopGameConfig;
  diacriticBuildGame?: DiacriticBuildGameConfig;
  memoryFlipGame?: MemoryFlipGameConfig;
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
import { towerBossFloors } from "./tower-boss-1";

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
    name: "ô",
    letters: "ô, b",
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
    letters: "o",
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
    name: "e",
    letters: "e, m",
    stars: 0,
    maxStars: 12,
    completed: false,
    unlocked: true,
    position: { x: 75, y: 62 },
    parentIds: [3],
    floors: tower5Floors,
  },
  {
    id: 6,
    name: "BOSS",
    letters: "Thử Thách",
    stars: 0,
    maxStars: 2,
    completed: false,
    unlocked: false,
    position: { x: 50, y: 85 },
    parentIds: [4, 5],
    isBoss: true,
    floors: towerBossFloors,
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
  const allUnlocked = regularTowers.every((t) => t.unlocked);
  if (allUnlocked) {
    return true;
  }
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
