"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RotateCcw, Shield, Star } from "lucide-react";
import {
  AUDIO,
  getWorldData,
  type LessonContent,
  type World1BookPage,
} from "@/data/game-config";
import {
  getStoredFloorProgress,
  saveFloorProgress,
} from "@/lib/floor-progress";
import {
  playAppAudio,
  preloadAppAudioList,
  stopAllAppAudio,
} from "@/lib/app-audio";
import { PrimaryButton } from "@/components/common/primary-button";
import { GameBubblePop } from "./game-bubble-pop";
import { GameMemoryFlip } from "./game-memory-flip";
import { GameAnimalFeed } from "./game-animal-feed";
import { GameDiacriticBuild } from "./game-diacritic-build";
import { LessonInterface } from "./lesson-interface";

type WheelSegmentKind =
  | "MYSTERY"
  | "GAME_EASY"
  | "HEART_PLUS_1"
  | "STAR_MINUS_1"
  | "TRACING_ALPHA"
  | "STAR_PLUS_2"
  | "GAME_MEDIUM"
  | "STAR_X2_NEXT"
  | "STAR_PLUS_1"
  | "TRACING_VOCAB"
  | "GAME_HARD"
  | "STAR_PLUS_3";

type GameDifficulty = "easy" | "medium" | "hard";
type ForcedLevelId = "easy" | "normal" | "hard";
type MiniGameLessonKind =
  | "bubble_pop_challenge"
  | "memory_flip_challenge"
  | "animal_feed_challenge"
  | "diacritic_build_challenge";

interface WheelSegment {
  kind: WheelSegmentKind;
  icon: string;
  color: string;
  glow: string;
}

interface WheelState {
  hearts: number;
  stars: number;
  shieldHeart: boolean;
  shieldStar: boolean;
  x2Next: boolean;
}

type MysteryRewardKind =
  | "SHIELD_STAR"
  | "SHIELD_HEART"
  | "STAR_PLUS_1"
  | "STAR_PLUS_2"
  | "X2_NEXT";

type MysteryGiftStage = "closed" | "opening";

type RewardFlightVisual = "star" | "heart" | "shieldHeart" | "shieldStar" | "x2";
type RewardFlightTarget =
  | "starBar"
  | "heartBar"
  | "heartShield"
  | "starShield"
  | "x2Badge";

interface RewardFlightToken {
  id: number;
  visual: RewardFlightVisual;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delayMs: number;
  durationMs: number;
}

interface Point2D {
  x: number;
  y: number;
}

interface MysteryGiftState {
  reward: MysteryRewardKind;
  stage: MysteryGiftStage;
}

interface SegmentSettleOptions {
  skipRewardFlights?: boolean;
  skipMysteryPopup?: boolean;
}

interface ScheduledAction {
  id: number;
  remainingMs: number;
  callback: () => void;
}

interface ChallengeLessonSource {
  kind: MiniGameLessonKind | "letter_trace_practice" | "vocab_trace_practice";
  lesson: LessonContent;
  towerId: number;
  floorId: number;
  floorName: string;
  floorMaxStars: number;
}

type EmbeddedChallenge =
  | {
      runId: number;
      type: "game";
      source: ChallengeLessonSource;
      difficulty: GameDifficulty;
    }
  | {
      runId: number;
      type: "tracing";
      source: ChallengeLessonSource;
      tracingMode: "alpha" | "vocab";
    };

interface GameMysteryWheelProps {
  worldId: number;
  world1BookPage?: World1BookPage;
  towerId: number;
  floorId: number;
  floorMaxStars: number;
  onBack: () => void;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

const MAX_HEARTS = 5;
const START_HEARTS = 3;
const TARGET_STARS = 10;
const HOLD_TO_MAX_MS = 1500;
const SEGMENT_ANGLE = 360 / 16;
const RESULT_NOTICE_MS = 1300;
const MYSTERY_GIFT_POPUP_MS = 260;

const INITIAL_WHEEL_STATE: WheelState = {
  hearts: START_HEARTS,
  stars: 0,
  shieldHeart: false,
  shieldStar: false,
  x2Next: false,
};

const GAME_PASS_RATE_FALLBACK: Record<GameDifficulty, number> = {
  easy: 0.78,
  medium: 0.64,
  hard: 0.5,
};

const WHEEL_SEGMENTS: WheelSegment[] = [
  {
    kind: "MYSTERY",
    icon: "❓",
    color: "#7c3aed",
    glow: "rgba(139,92,246,0.55)",
  },
  {
    kind: "GAME_EASY",
    icon: "🎮",
    color: "#10b981",
    glow: "rgba(52,211,153,0.5)",
  },
  {
    kind: "HEART_PLUS_1",
    icon: "❤️",
    color: "#f43f5e",
    glow: "rgba(251,113,133,0.55)",
  },
  {
    kind: "STAR_MINUS_1",
    icon: "💫",
    color: "#3b82f6",
    glow: "rgba(96,165,250,0.5)",
  },
  {
    kind: "TRACING_ALPHA",
    icon: "✍️",
    color: "#0ea5e9",
    glow: "rgba(56,189,248,0.5)",
  },
  {
    kind: "STAR_PLUS_2",
    icon: "✨",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.55)",
  },
  {
    kind: "MYSTERY",
    icon: "❓",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.55)",
  },
  {
    kind: "GAME_MEDIUM",
    icon: "🕹️",
    color: "#f97316",
    glow: "rgba(251,146,60,0.5)",
  },
  {
    kind: "STAR_MINUS_1",
    icon: "💫",
    color: "#6366f1",
    glow: "rgba(129,140,248,0.5)",
  },
  {
    kind: "STAR_X2_NEXT",
    icon: "2️⃣",
    color: "#06b6d4",
    glow: "rgba(34,211,238,0.55)",
  },
  {
    kind: "STAR_PLUS_1",
    icon: "⭐",
    color: "#eab308",
    glow: "rgba(250,204,21,0.55)",
  },
  {
    kind: "MYSTERY",
    icon: "❓",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.55)",
  },
  {
    kind: "TRACING_VOCAB",
    icon: "📘",
    color: "#14b8a6",
    glow: "rgba(45,212,191,0.5)",
  },
  {
    kind: "STAR_MINUS_1",
    icon: "💫",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.5)",
  },
  {
    kind: "GAME_HARD",
    icon: "👾",
    color: "#ef4444",
    glow: "rgba(248,113,113,0.55)",
  },
  {
    kind: "STAR_PLUS_3",
    icon: "🌟",
    color: "#fbbf24",
    glow: "rgba(250,204,21,0.6)",
  },
];

const SEGMENT_RESULT_TEXT: Record<
  WheelSegmentKind,
  {
    title: string;
    subtitle: string;
  }
> = {
  MYSTERY: {
    title: "Ô bí ẩn",
    subtitle: "Chạm hộp quà để mở thưởng",
  },
  GAME_EASY: {
    title: "Thử thách dễ",
    subtitle: "Vượt mini game để nhận sao",
  },
  HEART_PLUS_1: {
    title: "+1 tim",
    subtitle: "Thêm 1 mạng cho bé",
  },
  STAR_MINUS_1: {
    title: "-1 sao",
    subtitle: "Mất 1 sao nếu không có khiên",
  },
  TRACING_ALPHA: {
    title: "Nét chữ cái",
    subtitle: "Hoàn thành thử thách viết",
  },
  STAR_PLUS_2: {
    title: "+2 sao",
    subtitle: "Nhận thêm 2 sao",
  },
  GAME_MEDIUM: {
    title: "Thử thách vừa",
    subtitle: "Mini game mức trung bình",
  },
  STAR_X2_NEXT: {
    title: "x2 lượt kế",
    subtitle: "Lần nhận sao kế tiếp sẽ nhân đôi",
  },
  STAR_PLUS_1: {
    title: "+1 sao",
    subtitle: "Nhận thêm 1 sao",
  },
  TRACING_VOCAB: {
    title: "Nét từ vựng",
    subtitle: "Viết từ để nhận thưởng",
  },
  GAME_HARD: {
    title: "Thử thách khó",
    subtitle: "Mini game khó, thưởng cao",
  },
  STAR_PLUS_3: {
    title: "+3 sao",
    subtitle: "Nhận thêm 3 sao",
  },
};

const MYSTERY_REWARD_TEXT: Record<
  MysteryRewardKind,
  {
    icon: string;
    title: string;
    subtitle: string;
    visual: RewardFlightVisual;
    target: RewardFlightTarget;
  }
> = {
  SHIELD_STAR: {
    icon: "🛡️⭐",
    title: "Khiên sao",
    subtitle: "Chặn 1 lần trừ sao",
    visual: "shieldStar",
    target: "starShield",
  },
  SHIELD_HEART: {
    icon: "🛡️❤️",
    title: "Khiên tim",
    subtitle: "Chặn 1 lần mất tim",
    visual: "shieldHeart",
    target: "heartShield",
  },
  STAR_PLUS_1: {
    icon: "⭐",
    title: "+1 sao",
    subtitle: "Bé nhận thêm 1 sao",
    visual: "star",
    target: "starBar",
  },
  STAR_PLUS_2: {
    icon: "✨",
    title: "+2 sao",
    subtitle: "Bé nhận thêm 2 sao",
    visual: "star",
    target: "starBar",
  },
  X2_NEXT: {
    icon: "x2",
    title: "Thưởng x2",
    subtitle: "Lượt sao kế tiếp được nhân đôi",
    visual: "x2",
    target: "x2Badge",
  },
};

function pickMysteryReward(): MysteryRewardKind {
  const randomValue = Math.random() * 100;
  if (randomValue < 30) return "X2_NEXT";
  if (randomValue < 55) return "SHIELD_HEART";
  if (randomValue < 80) return "SHIELD_STAR";
  if (randomValue < 94) return "STAR_PLUS_1";
  return "STAR_PLUS_2";
}

function getElementCenter(
  element: HTMLElement | null,
  fallback: Point2D,
): Point2D {
  if (!element) return fallback;
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function RewardFlightIcon({ visual }: { visual: RewardFlightVisual }) {
  if (visual === "star") {
    return (
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-amber-300/25 shadow-[0_0_24px_rgba(251,191,36,0.65)]">
        <span className="text-3xl">⭐</span>
      </div>
    );
  }

  if (visual === "heart") {
    return (
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-rose-300/25 shadow-[0_0_24px_rgba(244,63,94,0.6)]">
        <span className="text-3xl">❤️</span>
      </div>
    );
  }

  if (visual === "x2") {
    return (
      <div className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-amber-100/90 bg-amber-400 px-2 text-base font-black text-violet-950 shadow-[0_0_20px_rgba(251,191,36,0.55)]">
        x2
      </div>
    );
  }

  return (
    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-cyan-300/25 shadow-[0_0_24px_rgba(34,211,238,0.55)]">
      <Shield className="h-8 w-8 fill-cyan-200 text-cyan-100" />
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-violet-950/85 px-1 text-[11px]">
        {visual === "shieldHeart" ? "❤️" : "⭐"}
      </span>
    </div>
  );
}

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeDegree(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function buildSpinProfile(power: number): {
  loops: number;
  durationMs: number;
} {
  const clampedPower = clampNumber(power, 0, 1);
  // Stronger holds spin faster and keep spinning longer.
  const shapedPower = clampedPower ** 1.35;
  // Must be an integer so the wheel lands exactly on the intended segment.
  const loops = Math.round(1 + shapedPower * 11);
  const durationMs = Math.round(2200 + shapedPower * 2300);

  return { loops, durationMs };
}

function getPowerTierLabel(
  powerRatio: number,
): "Nhẹ" | "Vừa" | "Mạnh" | "Cực mạnh" {
  if (powerRatio < 0.2) return "Nhẹ";
  if (powerRatio < 0.5) return "Vừa";
  if (powerRatio < 0.85) return "Mạnh";
  return "Cực mạnh";
}

function polarToCartesian(cx: number, cy: number, radius: number, deg: number) {
  const radians = (deg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function buildSegmentPath(
  index: number,
  radiusOuter: number,
  radiusInner: number,
  center: number,
): string {
  const centerAngle = -90 + index * SEGMENT_ANGLE;
  const startAngle = centerAngle - SEGMENT_ANGLE / 2;
  const endAngle = centerAngle + SEGMENT_ANGLE / 2;

  const outerStart = polarToCartesian(center, center, radiusOuter, startAngle);
  const outerEnd = polarToCartesian(center, center, radiusOuter, endAngle);
  const innerStart = polarToCartesian(center, center, radiusInner, startAngle);
  const innerEnd = polarToCartesian(center, center, radiusInner, endAngle);

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${radiusOuter} ${radiusOuter} 0 0 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${radiusInner} ${radiusInner} 0 0 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function pickRandomItem<T>(items: T[]): T | null {
  if (!items.length) return null;
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex] ?? items[0] ?? null;
}

function buildChallengeSourceKey(source: ChallengeLessonSource): string {
  return `${source.towerId}:${source.floorId}:${source.lesson.id}:${source.kind}`;
}

function toForcedLevelId(difficulty: GameDifficulty): ForcedLevelId {
  if (difficulty === "medium") return "normal";
  return difficulty;
}

function isMiniGameLessonKind(
  kind: LessonContent["lessonKind"],
): kind is MiniGameLessonKind {
  return (
    kind === "bubble_pop_challenge" ||
    kind === "memory_flip_challenge" ||
    kind === "animal_feed_challenge" ||
    kind === "diacritic_build_challenge"
  );
}

export function GameMysteryWheel({
  worldId,
  world1BookPage = 1,
  towerId,
  floorId,
  floorMaxStars,
  onBack,
}: GameMysteryWheelProps) {
  const [wheelState, setWheelState] = useState<WheelState>(INITIAL_WHEEL_STATE);
  const [gameStatus, setGameStatus] = useState<"playing" | "win" | "lose">(
    "playing",
  );
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinDurationMs, setSpinDurationMs] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [holdMs, setHoldMs] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinHintDismissed, setSpinHintDismissed] = useState(false);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null,
  );
  const [mysteryGift, setMysteryGift] = useState<MysteryGiftState | null>(null);
  const [embeddedChallenge, setEmbeddedChallenge] =
    useState<EmbeddedChallenge | null>(null);
  const [rewardFlights, setRewardFlights] = useState<RewardFlightToken[]>([]);
  const [heartLossPulseTick, setHeartLossPulseTick] = useState(0);
  const [shieldHeartPulseTick, setShieldHeartPulseTick] = useState(0);
  const [shieldStarPulseTick, setShieldStarPulseTick] = useState(0);
  const [spinResultPulseTick, setSpinResultPulseTick] = useState(0);
  const [confettiTick, setConfettiTick] = useState(0);
  const [pendingStarReveal, setPendingStarReveal] = useState(0);
  const [pendingHeartReveal, setPendingHeartReveal] = useState(0);
  const [pendingShieldHeartReveal, setPendingShieldHeartReveal] = useState(0);
  const [pendingShieldStarReveal, setPendingShieldStarReveal] = useState(0);
  const [pendingX2Reveal, setPendingX2Reveal] = useState(0);

  const wheelStateRef = useRef(wheelState);
  const wheelRotationRef = useRef(wheelRotation);
  const holdStartRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const spinTargetIndexRef = useRef<number | null>(null);
  const scheduledActionsRef = useRef<ScheduledAction[]>([]);
  const scheduledActionIdRef = useRef(1);
  const spinResolveActionIdRef = useRef<number | null>(null);
  const spinSettleActionIdRef = useRef<number | null>(null);
  const pendingSettleSegmentRef = useRef<number | null>(null);
  const mysteryResolveActionIdRef = useRef<number | null>(null);
  const rewardFlightIdRef = useRef(1);
  const challengeRunIdRef = useRef(0);
  const lastTracingAlphaSourceKeyRef = useRef<string | null>(null);
  const lastTracingVocabSourceKeyRef = useRef<string | null>(null);
  const wheelCenterRef = useRef<HTMLDivElement | null>(null);
  const starBarTargetRef = useRef<HTMLDivElement | null>(null);
  const heartBarTargetRef = useRef<HTMLDivElement | null>(null);
  const shieldHeartTargetRef = useRef<HTMLDivElement | null>(null);
  const shieldStarTargetRef = useRef<HTMLDivElement | null>(null);
  const x2TargetRef = useRef<HTMLDivElement | null>(null);
  const mysteryGiftBoxRef = useRef<HTMLButtonElement | null>(null);
  const [learnedFloorKeys, setLearnedFloorKeys] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    let cancelled = false;
    const worldData = getWorldData(worldId, { world1BookPage });
    const regularFloors = worldData.towers.flatMap((tower) => {
      if (tower.isBoss) return [];
      return (tower.floors ?? []).map((floor) => ({
        towerId: tower.id,
        floorId: floor.id,
        maxStars: floor.maxStars ?? 3,
      }));
    });

    void (async () => {
      const learnedKeys = await Promise.all(
        regularFloors.map(
          async ({
            towerId: challengeTowerId,
            floorId: challengeFloorId,
            maxStars,
          }) => {
            const stored = await getStoredFloorProgress(
              {
                worldId,
                world1BookPage,
                towerId: challengeTowerId,
                floorId: challengeFloorId,
              },
              maxStars,
            );
            if (!stored) return null;

            const hasLearnedProgress =
              stored.completed ||
              stored.stars > 0 ||
              (stored.passCount ?? 0) > 0 ||
              Object.values(stored.lessonStars).some((stars) => stars > 0);

            if (!hasLearnedProgress) return null;
            return `${challengeTowerId}:${challengeFloorId}`;
          },
        ),
      );

      if (cancelled) return;
      setLearnedFloorKeys(
        new Set(
          learnedKeys.filter(
            (floorKey): floorKey is string => typeof floorKey === "string",
          ),
        ),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [world1BookPage, worldId]);

  const challengePools = useMemo(() => {
    const worldData = getWorldData(worldId, { world1BookPage });

    const miniGameAll: ChallengeLessonSource[] = [];
    const miniGameUnlocked: ChallengeLessonSource[] = [];
    const miniGameLearned: ChallengeLessonSource[] = [];
    const tracingAlphaAll: ChallengeLessonSource[] = [];
    const tracingAlphaUnlocked: ChallengeLessonSource[] = [];
    const tracingAlphaLearned: ChallengeLessonSource[] = [];
    const tracingVocabAll: ChallengeLessonSource[] = [];
    const tracingVocabUnlocked: ChallengeLessonSource[] = [];
    const tracingVocabLearned: ChallengeLessonSource[] = [];

    worldData.towers.forEach((tower) => {
      if (tower.isBoss) return;
      const towerUnlocked = tower.unlocked !== false;
      tower.floors?.forEach((floor) => {
        const floorUnlocked = towerUnlocked && floor.unlocked !== false;
        const floorLearned = learnedFloorKeys.has(`${tower.id}:${floor.id}`);
        const floorName =
          floor.nameUnlocked || floor.nameLocked || `Tầng ${floor.id}`;
        floor.content?.forEach((lesson) => {
          if (lesson.type !== "active") return;

          const source: ChallengeLessonSource = {
            kind:
              lesson.lessonKind === "letter_trace_practice"
                ? "letter_trace_practice"
                : lesson.lessonKind === "vocab_trace_practice"
                  ? "vocab_trace_practice"
                  : (lesson.lessonKind as MiniGameLessonKind),
            lesson,
            towerId: tower.id,
            floorId: floor.id,
            floorName,
            floorMaxStars: floor.maxStars ?? 3,
          };

          if (isMiniGameLessonKind(lesson.lessonKind)) {
            miniGameAll.push(source);
            if (floorUnlocked) {
              miniGameUnlocked.push(source);
            }
            if (floorLearned) {
              miniGameLearned.push(source);
            }
            return;
          }

          if (lesson.lessonKind === "letter_trace_practice") {
            tracingAlphaAll.push(source);
            if (floorUnlocked) {
              tracingAlphaUnlocked.push(source);
            }
            if (floorLearned) {
              tracingAlphaLearned.push(source);
            }
            return;
          }

          if (lesson.lessonKind === "vocab_trace_practice") {
            tracingVocabAll.push(source);
            if (floorUnlocked) {
              tracingVocabUnlocked.push(source);
            }
            if (floorLearned) {
              tracingVocabLearned.push(source);
            }
          }
        });
      });
    });

    const miniGames =
      miniGameLearned.length > 0
        ? miniGameLearned
        : miniGameUnlocked.length > 0
          ? miniGameUnlocked
          : miniGameAll;
    const tracingAlpha =
      tracingAlphaUnlocked.length > 0 ? tracingAlphaUnlocked : tracingAlphaAll;
    const tracingVocab =
      tracingVocabUnlocked.length > 0 ? tracingVocabUnlocked : tracingVocabAll;

    return {
      miniGames,
      tracingAlpha,
      tracingVocab,
    };
  }, [learnedFloorKeys, world1BookPage, worldId]);

  const wheelScaleShake = isHolding && holdMs >= HOLD_TO_MAX_MS * 0.88;
  const powerRatio = clampNumber(holdMs / HOLD_TO_MAX_MS, 0, 1);
  const powerPercent = Math.round(powerRatio * 100);
  const powerTierLabel = getPowerTierLabel(powerRatio);
  const displayedHearts = Math.max(0, wheelState.hearts - pendingHeartReveal);
  const displayedStars = Math.max(0, wheelState.stars - pendingStarReveal);
  const showShieldHeartBadge =
    wheelState.shieldHeart && pendingShieldHeartReveal === 0;
  const showShieldStarBadge = wheelState.shieldStar && pendingShieldStarReveal === 0;
  const showX2Badge = wheelState.x2Next && pendingX2Reveal === 0;
  const hasRewardFlightActive = rewardFlights.length > 0;
  const starsProgressRatio = clampNumber(displayedStars / TARGET_STARS, 0, 1);
  const reduceAmbientMotion = isSpinning || isHolding;

  const updateWheelState = useCallback(
    (updater: (previous: WheelState) => WheelState): WheelState => {
      const next = updater(wheelStateRef.current);
      wheelStateRef.current = next;
      setWheelState(next);
      return next;
    },
    [],
  );

  const clearScheduledAction = useCallback((actionId: number | null) => {
    if (actionId === null) return;
    scheduledActionsRef.current = scheduledActionsRef.current.filter(
      (action) => action.id !== actionId,
    );
  }, []);

  const scheduleAction = useCallback(
    (delayMs: number, callback: () => void) => {
      const actionId = scheduledActionIdRef.current;
      scheduledActionIdRef.current += 1;
      scheduledActionsRef.current = [
        ...scheduledActionsRef.current,
        {
          id: actionId,
          remainingMs: Math.max(0, delayMs),
          callback,
        },
      ];
      return actionId;
    },
    [],
  );

  const flushScheduledActions = useCallback((deltaMs: number) => {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    const dueCallbacks: Array<() => void> = [];
    const remaining: ScheduledAction[] = [];
    for (const action of scheduledActionsRef.current) {
      const remainingMs = action.remainingMs - deltaMs;
      if (remainingMs <= 0) {
        dueCallbacks.push(action.callback);
      } else {
        remaining.push({
          ...action,
          remainingMs,
        });
      }
    }
    scheduledActionsRef.current = remaining;
    dueCallbacks.forEach((callback) => callback());
  }, []);

  const advanceScheduledTime = useCallback(
    (ms: number) => {
      if (!Number.isFinite(ms) || ms <= 0) return;
      let remainingMs = ms;
      while (remainingMs > 0) {
        const stepMs = Math.min(48, remainingMs);
        flushScheduledActions(stepMs);
        remainingMs -= stepMs;
      }
    },
    [flushScheduledActions],
  );

  const clearVisualEffectQueue = useCallback(() => {
    clearScheduledAction(spinResolveActionIdRef.current);
    clearScheduledAction(spinSettleActionIdRef.current);
    clearScheduledAction(mysteryResolveActionIdRef.current);
    spinResolveActionIdRef.current = null;
    spinSettleActionIdRef.current = null;
    pendingSettleSegmentRef.current = null;
    mysteryResolveActionIdRef.current = null;
  }, [clearScheduledAction]);

  const playSuccessAnswer = useCallback(() => {
    playAppAudio(AUDIO.FEEDBACK.SUCCESS_ANSWER, {
      allowOverlap: true,
      retries: 1,
      retryDelayMs: 80,
    });
  }, []);

  const playWrongAnswer = useCallback(() => {
    playAppAudio(AUDIO.FEEDBACK.WRONG_ANSWER, {
      allowOverlap: true,
      retries: 1,
      retryDelayMs: 80,
    });
  }, []);

  const getScreenCenterPoint = useCallback((): Point2D => {
    if (typeof window === "undefined") {
      return { x: 0, y: 0 };
    }
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
  }, []);

  const getWheelCenterPoint = useCallback((): Point2D => {
    return getElementCenter(wheelCenterRef.current, getScreenCenterPoint());
  }, [getScreenCenterPoint]);

  const getRewardTargetPoint = useCallback(
    (target: RewardFlightTarget): Point2D => {
      const fallback = getWheelCenterPoint();
      if (target === "starBar") {
        return getElementCenter(starBarTargetRef.current, fallback);
      }
      if (target === "heartBar") {
        return getElementCenter(heartBarTargetRef.current, fallback);
      }
      if (target === "heartShield") {
        return getElementCenter(shieldHeartTargetRef.current, fallback);
      }
      if (target === "starShield") {
        return getElementCenter(shieldStarTargetRef.current, fallback);
      }
      return getElementCenter(x2TargetRef.current, fallback);
    },
    [getWheelCenterPoint],
  );

  const spawnRewardFlights = useCallback(
    ({
      visual,
      target,
      count = 1,
      origin,
    }: {
      visual: RewardFlightVisual;
      target: RewardFlightTarget;
      count?: number;
      origin?: Point2D;
    }): number => {
      const safeCount = Math.max(1, count);
      const startPoint = origin ?? getWheelCenterPoint();
      const endPoint = getRewardTargetPoint(target);
      const nextFlights = Array.from({ length: safeCount }, (_, index) => {
        const id = rewardFlightIdRef.current;
        rewardFlightIdRef.current += 1;
        const spreadX = (index - (safeCount - 1) / 2) * 8;
        const spreadY = index % 2 === 0 ? -4 : 2;
        const distanceX = Math.abs(startPoint.x - endPoint.x);
        const distanceY = Math.abs(startPoint.y - endPoint.y);
        const travelDistance = Math.hypot(distanceX, distanceY);
        return {
          id,
          visual,
          startX: startPoint.x + spreadX,
          startY: startPoint.y + spreadY,
          endX: endPoint.x,
          endY: endPoint.y,
          delayMs: index * 42,
          durationMs: Math.round(620 + Math.min(280, travelDistance * 0.26)),
        } satisfies RewardFlightToken;
      });

      setRewardFlights((previous) => [...previous, ...nextFlights]);
      let maxFlightEndMs = 0;
      nextFlights.forEach((flight) => {
        const flightEndMs = flight.delayMs + flight.durationMs + 120;
        maxFlightEndMs = Math.max(maxFlightEndMs, flightEndMs);
        scheduleAction(flightEndMs, () => {
          setRewardFlights((previous) =>
            previous.filter((item) => item.id !== flight.id),
          );
        });
      });
      return maxFlightEndMs;
    },
    [getRewardTargetPoint, getWheelCenterPoint, scheduleAction],
  );

  const finalizeTurn = useCallback(() => {
    const snapshot = wheelStateRef.current;
    if (snapshot.stars >= TARGET_STARS) {
      setGameStatus("win");
      setConfettiTick((tick) => tick + 1);
      return;
    }
    if (snapshot.hearts <= 0) {
      setGameStatus("lose");
    }
  }, []);

  const awardStars = useCallback(
    (
      baseStars: number,
      options?: { origin?: Point2D; skipFlight?: boolean },
    ) => {
      if (baseStars <= 0) return;
      let gainedStars = 0;
      updateWheelState((previous) => {
        let reward = baseStars;
        let nextX2 = previous.x2Next;
        if (previous.x2Next) {
          reward *= 2;
          nextX2 = false;
        }
        const nextStars = Math.min(TARGET_STARS, previous.stars + reward);
        gainedStars = nextStars - previous.stars;
        return {
          ...previous,
          stars: nextStars,
          x2Next: nextX2,
        };
      });

      if (gainedStars > 0) {
        if (!options?.skipFlight) {
          setPendingStarReveal((previous) => previous + gainedStars);
          const revealDelayMs = spawnRewardFlights({
            visual: "star",
            target: "starBar",
            count: Math.min(3, gainedStars),
            origin: options?.origin,
          });
          scheduleAction(revealDelayMs, () => {
            setPendingStarReveal((previous) =>
              Math.max(0, previous - gainedStars),
            );
          });
        }
        playSuccessAnswer();
      }
    },
    [playSuccessAnswer, scheduleAction, spawnRewardFlights, updateWheelState],
  );

  const applyHeartLoss = useCallback(() => {
    let usedShield = false;
    let lostHeart = false;
    updateWheelState((previous) => {
      if (previous.shieldHeart) {
        usedShield = true;
        return {
          ...previous,
          shieldHeart: false,
        };
      }
      const nextHearts = Math.max(0, previous.hearts - 1);
      lostHeart = nextHearts < previous.hearts;
      return {
        ...previous,
        hearts: nextHearts,
      };
    });

    if (usedShield) {
      setShieldHeartPulseTick((tick) => tick + 1);
      return;
    }

    if (lostHeart) {
      setHeartLossPulseTick((tick) => tick + 1);
      playWrongAnswer();
    }
  }, [playWrongAnswer, updateWheelState]);

  const applyStarMinus = useCallback(() => {
    let usedShield = false;
    updateWheelState((previous) => {
      if (previous.shieldStar) {
        usedShield = true;
        return {
          ...previous,
          shieldStar: false,
        };
      }

      return {
        ...previous,
        stars: Math.max(0, previous.stars - 1),
      };
    });

    if (usedShield) {
      setShieldStarPulseTick((tick) => tick + 1);
    }
  }, [updateWheelState]);

  const grantX2Reward = useCallback(
    (options?: { origin?: Point2D; skipFlight?: boolean }) => {
      let granted = false;
      updateWheelState((previous) => {
        if (previous.x2Next) {
          return previous;
        }
        granted = true;
        return {
          ...previous,
          x2Next: true,
        };
      });

      if (granted) {
        if (!options?.skipFlight) {
          setPendingX2Reveal((previous) => previous + 1);
          const revealDelayMs = spawnRewardFlights({
            visual: "x2",
            target: "x2Badge",
            origin: options?.origin,
          });
          scheduleAction(revealDelayMs, () => {
            setPendingX2Reveal((previous) => Math.max(0, previous - 1));
          });
        }
        playSuccessAnswer();
        return;
      }

      awardStars(1, {
        origin: options?.origin,
        skipFlight: options?.skipFlight,
      });
    },
    [
      awardStars,
      playSuccessAnswer,
      scheduleAction,
      spawnRewardFlights,
      updateWheelState,
    ],
  );

  const grantShieldReward = useCallback(
    (
      shieldType: "heart" | "star",
      options?: {
        origin?: Point2D;
        alwaysShowVisual?: boolean;
        skipFlight?: boolean;
      },
    ) => {
      let fallbackStars = 0;
      let grantedShield = false;
      let gainedHeart = false;
      updateWheelState((previous) => {
        const hasSameShield =
          shieldType === "heart" ? previous.shieldHeart : previous.shieldStar;
        if (!hasSameShield) {
          grantedShield = true;
          return {
            ...previous,
            shieldHeart: shieldType === "heart" ? true : previous.shieldHeart,
            shieldStar: shieldType === "star" ? true : previous.shieldStar,
          };
        }

        if (previous.hearts < MAX_HEARTS && Math.random() < 0.7) {
          gainedHeart = true;
          return {
            ...previous,
            hearts: Math.min(MAX_HEARTS, previous.hearts + 1),
          };
        }

        fallbackStars = 1;
        return previous;
      });

      if (grantedShield) {
        if (!options?.skipFlight) {
          const setPendingReveal =
            shieldType === "heart"
              ? setPendingShieldHeartReveal
              : setPendingShieldStarReveal;
          setPendingReveal((previous) => previous + 1);
          const revealDelayMs = spawnRewardFlights({
            visual: shieldType === "heart" ? "shieldHeart" : "shieldStar",
            target: shieldType === "heart" ? "heartShield" : "starShield",
            origin: options?.origin,
          });
          scheduleAction(revealDelayMs, () => {
            setPendingReveal((previous) => Math.max(0, previous - 1));
          });
        }
        playSuccessAnswer();
        return;
      }

      if (options?.alwaysShowVisual && !options.skipFlight) {
        spawnRewardFlights({
          visual: shieldType === "heart" ? "shieldHeart" : "shieldStar",
          target: shieldType === "heart" ? "heartShield" : "starShield",
          origin: options.origin,
        });
      }

      if (gainedHeart) {
        playSuccessAnswer();
      }

      if (fallbackStars > 0) {
        awardStars(fallbackStars, {
          origin: options?.origin,
          skipFlight: options?.skipFlight,
        });
      }
    },
    [
      awardStars,
      playSuccessAnswer,
      scheduleAction,
      spawnRewardFlights,
      updateWheelState,
    ],
  );

  const resolveChallengeRun = useCallback((runId: number): boolean => {
    if (runId !== challengeRunIdRef.current) return false;
    challengeRunIdRef.current += 1;
    setEmbeddedChallenge(null);
    setActiveSegmentIndex(null);
    setMysteryGift(null);
    return true;
  }, []);

  const resolveEmbeddedGameChallenge = useCallback(
    (runId: number, difficulty: GameDifficulty, passed: boolean) => {
      if (!resolveChallengeRun(runId)) return;
      if (passed) {
        awardStars(difficulty === "hard" ? 2 : 1);
      } else {
        applyHeartLoss();
      }
      finalizeTurn();
    },
    [applyHeartLoss, awardStars, finalizeTurn, resolveChallengeRun],
  );

  const resolveEmbeddedTracingChallenge = useCallback(
    (runId: number, passed: boolean) => {
      if (!resolveChallengeRun(runId)) return;
      if (passed) {
        awardStars(1);
      } else {
        applyHeartLoss();
      }
      finalizeTurn();
    },
    [applyHeartLoss, awardStars, finalizeTurn, resolveChallengeRun],
  );

  const launchGameChallenge = useCallback(
    (difficulty: GameDifficulty) => {
      const source = pickRandomItem(challengePools.miniGames);
      if (!source) {
        const fallbackPass =
          Math.random() < GAME_PASS_RATE_FALLBACK[difficulty];
        if (fallbackPass) {
          awardStars(difficulty === "hard" ? 2 : 1);
        } else {
          applyHeartLoss();
        }
        finalizeTurn();
        return;
      }

      challengeRunIdRef.current += 1;
      const runId = challengeRunIdRef.current;
      setEmbeddedChallenge({
        runId,
        type: "game",
        source,
        difficulty,
      });
    },
    [applyHeartLoss, awardStars, challengePools.miniGames, finalizeTurn],
  );

  const launchTracingChallenge = useCallback(
    (mode: "alpha" | "vocab") => {
      const pool =
        mode === "alpha" ? challengePools.tracingAlpha : challengePools.tracingVocab;
      const lastSourceKeyRef =
        mode === "alpha"
          ? lastTracingAlphaSourceKeyRef
          : lastTracingVocabSourceKeyRef;
      const previousSourceKey = lastSourceKeyRef.current;
      const eligiblePool =
        previousSourceKey && pool.length > 1
          ? pool.filter(
              (candidate) => buildChallengeSourceKey(candidate) !== previousSourceKey,
            )
          : pool;
      const source = pickRandomItem(eligiblePool.length > 0 ? eligiblePool : pool);

      if (!source) {
        const fallbackPass = Math.random() < 0.68;
        if (fallbackPass) {
          awardStars(1);
        } else {
          applyHeartLoss();
        }
        finalizeTurn();
        return;
      }

      challengeRunIdRef.current += 1;
      const runId = challengeRunIdRef.current;
      lastSourceKeyRef.current = buildChallengeSourceKey(source);
      setEmbeddedChallenge({
        runId,
        type: "tracing",
        source,
        tracingMode: mode,
      });
    },
    [
      applyHeartLoss,
      awardStars,
      challengePools.tracingAlpha,
      challengePools.tracingVocab,
      finalizeTurn,
    ],
  );

  const applyMysteryReward = useCallback(
    (
      rewardKind: MysteryRewardKind,
      origin: Point2D,
      options?: { skipFlight?: boolean },
    ) => {
      if (rewardKind === "SHIELD_HEART") {
        grantShieldReward("heart", {
          origin,
          alwaysShowVisual: true,
          skipFlight: options?.skipFlight,
        });
        return;
      }
      if (rewardKind === "SHIELD_STAR") {
        grantShieldReward("star", {
          origin,
          alwaysShowVisual: true,
          skipFlight: options?.skipFlight,
        });
        return;
      }
      if (rewardKind === "STAR_PLUS_1") {
        awardStars(1, { origin, skipFlight: options?.skipFlight });
        return;
      }
      if (rewardKind === "STAR_PLUS_2") {
        awardStars(2, { origin, skipFlight: options?.skipFlight });
        return;
      }
      grantX2Reward({ origin, skipFlight: options?.skipFlight });
    },
    [awardStars, grantShieldReward, grantX2Reward],
  );

  const resolveMystery = useCallback(() => {
    setMysteryGift({
      reward: pickMysteryReward(),
      stage: "closed",
    });
  }, []);

  const openMysteryGift = useCallback(() => {
    if (!mysteryGift || mysteryGift.stage !== "closed") return;
    const rewardKind = mysteryGift.reward;
    const rewardOrigin = getElementCenter(
      mysteryGiftBoxRef.current,
      getWheelCenterPoint(),
    );
    setMysteryGift((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        stage: "opening",
      };
    });

    clearScheduledAction(mysteryResolveActionIdRef.current);
    mysteryResolveActionIdRef.current = scheduleAction(620, () => {
      mysteryResolveActionIdRef.current = null;
      applyMysteryReward(rewardKind, rewardOrigin);
      setMysteryGift(null);
      finalizeTurn();
    });
  }, [
    applyMysteryReward,
    clearScheduledAction,
    finalizeTurn,
    getWheelCenterPoint,
    mysteryGift,
    scheduleAction,
  ]);

  const settleSegment = useCallback(
    (segmentIndex: number, options?: SegmentSettleOptions) => {
      const segment = WHEEL_SEGMENTS[segmentIndex];
      switch (segment.kind) {
        case "STAR_PLUS_1":
          awardStars(1, { skipFlight: options?.skipRewardFlights });
          finalizeTurn();
          break;
        case "STAR_PLUS_2":
          awardStars(2, { skipFlight: options?.skipRewardFlights });
          finalizeTurn();
          break;
        case "STAR_PLUS_3":
          awardStars(3, { skipFlight: options?.skipRewardFlights });
          finalizeTurn();
          break;
        case "STAR_MINUS_1":
          applyStarMinus();
          finalizeTurn();
          break;
        case "HEART_PLUS_1":
          let gainedHearts = 0;
          updateWheelState((previous) => {
            const nextHearts = Math.min(MAX_HEARTS, previous.hearts + 1);
            gainedHearts = nextHearts - previous.hearts;
            return {
              ...previous,
              hearts: nextHearts,
            };
          });
          if (gainedHearts > 0) {
            if (options?.skipRewardFlights) {
              playSuccessAnswer();
            } else {
              setPendingHeartReveal((previous) => previous + gainedHearts);
              const revealDelayMs = spawnRewardFlights({
                visual: "heart",
                target: "heartBar",
                count: gainedHearts,
              });
              scheduleAction(revealDelayMs, () => {
                setPendingHeartReveal((previous) =>
                  Math.max(0, previous - gainedHearts),
                );
              });
              playSuccessAnswer();
            }
          }
          finalizeTurn();
          break;
        case "STAR_X2_NEXT":
          grantX2Reward({ skipFlight: options?.skipRewardFlights });
          finalizeTurn();
          break;
        case "GAME_EASY":
          launchGameChallenge("easy");
          break;
        case "GAME_MEDIUM":
          launchGameChallenge("medium");
          break;
        case "GAME_HARD":
          launchGameChallenge("hard");
          break;
        case "TRACING_ALPHA":
          launchTracingChallenge("alpha");
          break;
        case "TRACING_VOCAB":
          launchTracingChallenge("vocab");
          break;
        case "MYSTERY":
          if (options?.skipMysteryPopup) {
            const mysteryReward = pickMysteryReward();
            applyMysteryReward(mysteryReward, getWheelCenterPoint(), {
              skipFlight: options.skipRewardFlights,
            });
            finalizeTurn();
            break;
          }
          resolveMystery();
          break;
        default:
          finalizeTurn();
          break;
      }
    },
    [
      applyMysteryReward,
      applyStarMinus,
      awardStars,
      finalizeTurn,
      grantX2Reward,
      getWheelCenterPoint,
      launchGameChallenge,
      launchTracingChallenge,
      playSuccessAnswer,
      resolveMystery,
      scheduleAction,
      spawnRewardFlights,
      updateWheelState,
    ],
  );

  const triggerSpin = useCallback(
    (power: number) => {
      if (gameStatus !== "playing") return;
      if (isSpinning || embeddedChallenge || mysteryGift || hasRewardFlightActive)
        return;

      if (
        spinSettleActionIdRef.current !== null &&
        pendingSettleSegmentRef.current !== null
      ) {
        const pendingSegment = pendingSettleSegmentRef.current;
        clearScheduledAction(spinSettleActionIdRef.current);
        spinSettleActionIdRef.current = null;
        pendingSettleSegmentRef.current = null;
        settleSegment(pendingSegment, {
          skipRewardFlights: true,
          skipMysteryPopup: true,
        });
        const pendingKind = WHEEL_SEGMENTS[pendingSegment]?.kind;
        if (
          pendingKind === "GAME_EASY" ||
          pendingKind === "GAME_MEDIUM" ||
          pendingKind === "GAME_HARD" ||
          pendingKind === "TRACING_ALPHA" ||
          pendingKind === "TRACING_VOCAB"
        ) {
          return;
        }
      }

      setMysteryGift(null);
      setActiveSegmentIndex(null);
      clearVisualEffectQueue();

      const randomIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
      spinTargetIndexRef.current = randomIndex;

      const currentRotation = normalizeDegree(wheelRotationRef.current);
      const targetRotation = normalizeDegree(360 - randomIndex * SEGMENT_ANGLE);
      const delta = normalizeDegree(targetRotation - currentRotation);
      const { loops, durationMs } = buildSpinProfile(power);

      setSpinDurationMs(durationMs);
      setIsSpinning(true);
      setWheelRotation((previous) => previous + loops * 360 + delta);

      spinResolveActionIdRef.current = scheduleAction(durationMs + 20, () => {
        spinResolveActionIdRef.current = null;
        setIsSpinning(false);
        setWheelRotation((previous) => {
          const normalized = normalizeDegree(previous);
          wheelRotationRef.current = normalized;
          return normalized;
        });

        const landedSegment = spinTargetIndexRef.current;
        if (landedSegment === null) return;
        setActiveSegmentIndex(landedSegment);
        setSpinResultPulseTick((tick) => tick + 1);
        const landedKind = WHEEL_SEGMENTS[landedSegment]?.kind;
        const settleDelayMs =
          landedKind === "MYSTERY" ? MYSTERY_GIFT_POPUP_MS : RESULT_NOTICE_MS;
        pendingSettleSegmentRef.current = landedSegment;

        spinSettleActionIdRef.current = scheduleAction(settleDelayMs, () => {
          spinSettleActionIdRef.current = null;
          pendingSettleSegmentRef.current = null;
          settleSegment(landedSegment);
        });
      });
    },
    [
      clearScheduledAction,
      clearVisualEffectQueue,
      embeddedChallenge,
      gameStatus,
      hasRewardFlightActive,
      isSpinning,
      mysteryGift,
      scheduleAction,
      settleSegment,
    ],
  );

  const stopHolding = useCallback(() => {
    if (!isHolding) return;
    const elapsedMs =
      holdStartRef.current === null
        ? holdMs
        : Math.min(HOLD_TO_MAX_MS, performance.now() - holdStartRef.current);
    if (holdRafRef.current !== null) {
      window.cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    holdStartRef.current = null;
    setIsHolding(false);
    const capturedPower = clampNumber(elapsedMs / HOLD_TO_MAX_MS, 0, 1);
    setHoldMs(0);
    triggerSpin(capturedPower);
  }, [holdMs, isHolding, triggerSpin]);

  const beginHolding = useCallback(() => {
    if (
      gameStatus !== "playing" ||
      isSpinning ||
      embeddedChallenge ||
      mysteryGift ||
      hasRewardFlightActive
    )
      return;
    if (isHolding) return;

    if (holdRafRef.current !== null) {
      window.cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    setSpinHintDismissed(true);
    setIsHolding(true);
    setHoldMs(0);
    holdStartRef.current = performance.now();

    const tick = (timestamp: number) => {
      if (holdStartRef.current === null) return;
      const elapsedMs = Math.min(
        HOLD_TO_MAX_MS,
        timestamp - holdStartRef.current,
      );
      setHoldMs(elapsedMs);
      if (elapsedMs >= HOLD_TO_MAX_MS) {
        holdRafRef.current = null;
        return;
      }
      holdRafRef.current = window.requestAnimationFrame(tick);
    };

    holdRafRef.current = window.requestAnimationFrame(tick);
  }, [
    embeddedChallenge,
    gameStatus,
    hasRewardFlightActive,
    isHolding,
    isSpinning,
    mysteryGift,
  ]);

  const handleWheelPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      beginHolding();
    },
    [beginHolding],
  );

  const restartGame = useCallback(() => {
    clearVisualEffectQueue();
    setWheelState(INITIAL_WHEEL_STATE);
    wheelStateRef.current = INITIAL_WHEEL_STATE;
    setGameStatus("playing");
    setWheelRotation(0);
    wheelRotationRef.current = 0;
    setSpinDurationMs(0);
    setIsHolding(false);
    setHoldMs(0);
    setIsSpinning(false);
    setSpinHintDismissed(false);
    setActiveSegmentIndex(null);
    setMysteryGift(null);
    setEmbeddedChallenge(null);
    setRewardFlights([]);
    setPendingStarReveal(0);
    setPendingHeartReveal(0);
    setPendingShieldHeartReveal(0);
    setPendingShieldStarReveal(0);
    setPendingX2Reveal(0);
  }, [clearVisualEffectQueue]);

  useEffect(() => {
    wheelStateRef.current = wheelState;
  }, [wheelState]);

  useEffect(() => {
    wheelRotationRef.current = wheelRotation;
  }, [wheelRotation]);

  useEffect(() => {
    preloadAppAudioList([
      AUDIO.FEEDBACK.SUCCESS_ANSWER,
      AUDIO.FEEDBACK.WRONG_ANSWER,
    ]);
  }, []);

  useEffect(() => {
    let frameId = 0;
    let lastTimestamp = performance.now();
    const loop = (timestamp: number) => {
      const deltaMs = Math.min(64, timestamp - lastTimestamp);
      lastTimestamp = timestamp;
      flushScheduledActions(deltaMs);
      frameId = window.requestAnimationFrame(loop);
    };

    frameId = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [flushScheduledActions]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.render_game_to_text = () => {
      const activeIndex = activeSegmentIndex;
      const activeKind =
        activeIndex !== null
          ? (WHEEL_SEGMENTS[activeIndex]?.kind ?? null)
          : null;
      return JSON.stringify({
        mode: gameStatus,
        coordinateSystem:
          "wheel index 0 starts at top pointer, then clockwise to index 15",
        isHolding,
        holdPower: Number(powerRatio.toFixed(3)),
        isSpinning,
        wheelRotation: Number(
          normalizeDegree(wheelRotationRef.current).toFixed(2),
        ),
        activeSegmentIndex: activeIndex,
        activeSegmentKind: activeKind,
        hearts: wheelStateRef.current.hearts,
        stars: wheelStateRef.current.stars,
        shieldHeart: wheelStateRef.current.shieldHeart,
        shieldStar: wheelStateRef.current.shieldStar,
        x2Next: wheelStateRef.current.x2Next,
        mysteryGift: mysteryGift
          ? {
              stage: mysteryGift.stage,
              reward: mysteryGift.reward,
            }
          : null,
        activeMission: embeddedChallenge
          ? {
              type: embeddedChallenge.type,
              runId: embeddedChallenge.runId,
              lessonKind: embeddedChallenge.source.kind,
              level:
                embeddedChallenge.type === "game"
                  ? toForcedLevelId(embeddedChallenge.difficulty)
                  : embeddedChallenge.tracingMode,
            }
          : null,
      });
    };

    window.advanceTime = (ms: number) => {
      advanceScheduledTime(ms);
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    activeSegmentIndex,
    advanceScheduledTime,
    embeddedChallenge,
    gameStatus,
    isHolding,
    isSpinning,
    mysteryGift,
    powerRatio,
  ]);

  useEffect(() => {
    void saveFloorProgress({
      worldId,
      world1BookPage,
      towerId,
      floorId,
      floorStars: wheelState.stars,
      maxStars: floorMaxStars,
      completed: wheelState.stars > 0,
      lessonStars: {},
    });
  }, [
    floorId,
    floorMaxStars,
    towerId,
    wheelState.stars,
    world1BookPage,
    worldId,
  ]);

  useEffect(() => {
    return () => {
      if (holdRafRef.current !== null) {
        window.cancelAnimationFrame(holdRafRef.current);
      }
      clearVisualEffectQueue();
      stopAllAppAudio();
    };
  }, [clearVisualEffectQueue]);

  if (embeddedChallenge?.type === "game") {
    const forcedLevelId = toForcedLevelId(embeddedChallenge.difficulty);
    const { runId, source, difficulty } = embeddedChallenge;

    if (source.kind === "bubble_pop_challenge") {
      return (
        <GameBubblePop
          key={`mystery-game-${runId}`}
          worldId={worldId}
          world1BookPage={world1BookPage}
          towerId={source.towerId}
          floorId={source.floorId}
          floorName={source.floorName}
          floorMaxStars={source.floorMaxStars}
          lesson={source.lesson}
          forcedLevelId={forcedLevelId}
          onMysteryRoundResolved={({ passed }) =>
            resolveEmbeddedGameChallenge(runId, difficulty, passed)
          }
          onComplete={() => {}}
          onBack={() => resolveEmbeddedGameChallenge(runId, difficulty, false)}
        />
      );
    }

    if (source.kind === "memory_flip_challenge") {
      return (
        <GameMemoryFlip
          key={`mystery-game-${runId}`}
          worldId={worldId}
          world1BookPage={world1BookPage}
          towerId={source.towerId}
          floorId={source.floorId}
          floorName={source.floorName}
          floorMaxStars={source.floorMaxStars}
          lesson={source.lesson}
          forcedLevelId={forcedLevelId}
          onMysteryRoundResolved={({ passed }) =>
            resolveEmbeddedGameChallenge(runId, difficulty, passed)
          }
          onComplete={() => {}}
          onBack={() => resolveEmbeddedGameChallenge(runId, difficulty, false)}
        />
      );
    }

    if (source.kind === "animal_feed_challenge") {
      return (
        <GameAnimalFeed
          key={`mystery-game-${runId}`}
          worldId={worldId}
          world1BookPage={world1BookPage}
          towerId={source.towerId}
          floorId={source.floorId}
          floorName={source.floorName}
          floorMaxStars={source.floorMaxStars}
          lesson={source.lesson}
          forcedLevelId={forcedLevelId}
          onMysteryRoundResolved={({ passed }) =>
            resolveEmbeddedGameChallenge(runId, difficulty, passed)
          }
          onComplete={() => {}}
          onBack={() => resolveEmbeddedGameChallenge(runId, difficulty, false)}
        />
      );
    }

    return (
      <GameDiacriticBuild
        key={`mystery-game-${runId}`}
        worldId={worldId}
        world1BookPage={world1BookPage}
        towerId={source.towerId}
        floorId={source.floorId}
        floorName={source.floorName}
        floorMaxStars={source.floorMaxStars}
        lesson={source.lesson}
        forcedLevelId={forcedLevelId}
        onMysteryRoundResolved={({ passed }) =>
          resolveEmbeddedGameChallenge(runId, difficulty, passed)
        }
        onComplete={() => {}}
        onBack={() => resolveEmbeddedGameChallenge(runId, difficulty, false)}
      />
    );
  }

  if (embeddedChallenge?.type === "tracing") {
    const { runId, source } = embeddedChallenge;
    return (
      <LessonInterface
        key={`mystery-tracing-${runId}`}
        worldId={worldId}
        world1BookPage={world1BookPage}
        towerId={source.towerId}
        floorId={source.floorId}
        floorName={source.floorName}
        floorMaxStars={source.floorMaxStars}
        lessons={[source.lesson]}
        autoResolveCompletion
        onMysteryLessonResolved={({ passed }) =>
          resolveEmbeddedTracingChallenge(runId, passed)
        }
        onComplete={() => {}}
        onBack={() => resolveEmbeddedTracingChallenge(runId, false)}
      />
    );
  }

  const wheelSize = "min(72vw, 400px)";
  const activeSegment =
    activeSegmentIndex !== null ? (WHEEL_SEGMENTS[activeSegmentIndex] ?? null) : null;
  const activeSegmentText = activeSegment
    ? SEGMENT_RESULT_TEXT[activeSegment.kind]
    : null;
  const mysteryRewardText = mysteryGift
    ? MYSTERY_REWARD_TEXT[mysteryGift.reward]
    : null;
  const showSpinResultCard =
    !!activeSegment &&
    activeSegment.kind !== "MYSTERY" &&
    !isSpinning &&
    !mysteryGift;

  const canSpin =
    gameStatus === "playing" &&
    !isSpinning &&
    !isHolding &&
    !embeddedChallenge &&
    !mysteryGift &&
    !hasRewardFlightActive;
  const showHoldHint =
    canSpin && activeSegmentIndex === null && !spinHintDismissed;

  return (
    <div className="relative h-dvh w-full overflow-hidden text-white">
      {/* Deep mystery gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0f0a2e_40%,#070318_100%)]" />

      {/* Animated floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 12 }, (_, i) => {
          const size = 2 + (i % 4) * 1.5;
          const left = (i * 8.4) % 100;
          const animDuration = 6 + (i % 5) * 2;
          const delay = (i % 7) * 0.9;
          const opacity = 0.15 + (i % 3) * 0.15;
          return (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                left: `${left}%`,
                top: `${50 + (i % 2 === 0 ? -20 : 20)}%`,
                background:
                  i % 3 === 0
                    ? "rgba(168,85,247,0.7)"
                    : i % 3 === 1
                      ? "rgba(251,191,36,0.7)"
                      : "rgba(56,189,248,0.7)",
              }}
              animate={
                reduceAmbientMotion
                  ? { y: 0, opacity: opacity * 0.85, scale: 1 }
                  : {
                      y: [0, -60 - i * 4, 0],
                      opacity: [opacity, opacity * 1.8, opacity],
                      scale: [1, 1.3, 1],
                    }
              }
              transition={
                reduceAmbientMotion
                  ? { duration: 0.2, ease: "linear" }
                  : {
                      duration: animDuration,
                      delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
            />
          );
        })}
        {/* Ambient glows */}
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-violet-600/15 blur-[80px]" />
        <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-amber-500/12 blur-[70px]" />
        <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[60px]" />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col px-4 pb-safe pt-safe">
        {/* --- Header --- */}
        <div className="pt-3">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              onClick={onBack}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Quay lại"
              className="group relative h-12 w-12 rounded-2xl p-[1px] shadow-[0_8px_22px_rgba(15,23,42,0.55),0_0_22px_rgba(168,85,247,0.35)]"
            >
              <span className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_200deg_at_50%_50%,#fde68a,#a855f7,#1d4ed8,#fde68a)] opacity-90" />
              <span className="absolute inset-[1px] rounded-[15px] bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.6),rgba(30,27,75,0.96)_55%,rgba(9,6,30,0.98)_100%)]" />
              <span className="relative z-10 flex h-full w-full items-center justify-center text-amber-200 transition-colors duration-150 group-hover:text-amber-100">
                <ChevronLeft className="h-6 w-6 drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]" />
              </span>
            </motion.button>
            <h1 className="font-hp-special text-2xl text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)] md:text-3xl">
              Vòng quay bí ẩn
            </h1>
            <motion.span
              animate={{ rotate: [0, -8, 8, -4, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="ml-auto text-2xl"
            >
              🔮
            </motion.span>
          </div>

          {/* --- HUD Panel --- */}
          <div className="relative mt-3">
            <div className="overflow-hidden rounded-2xl border border-violet-400/25 bg-violet-950/60 shadow-[0_8px_32px_rgba(88,28,135,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
              <div className="flex items-center gap-3 px-3.5 py-2.5">
              {/* Hearts */}
              <div className="relative flex items-center gap-0.5 rounded-xl bg-violet-900/50 px-2 py-1.5">
                <span
                  ref={shieldHeartTargetRef}
                  className="pointer-events-none absolute -right-1.5 -top-1.5 h-4 w-4 opacity-0"
                />
                <span
                  ref={heartBarTargetRef}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 opacity-0"
                />
                {Array.from({ length: MAX_HEARTS }, (_, index) => {
                  const filled = index < displayedHearts;
                  return (
                    <motion.span
                      key={index}
                      animate={filled ? { scale: [1, 1.15, 1] } : {}}
                      transition={{
                        duration: 0.8,
                        delay: index * 0.08,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                      className={`text-base ${filled ? "drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]" : "opacity-20 grayscale"}`}
                    >
                      ❤️
                    </motion.span>
                  );
                })}
                {showShieldHeartBadge && (
                  <motion.div
                    key={shieldHeartPulseTick}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-cyan-400 p-0.5 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                  >
                    <Shield className="h-3 w-3 fill-violet-950 text-violet-950" />
                  </motion.div>
                )}
              </div>

              {/* Star progress bar */}
              <div className="flex-1">
                <div className="relative h-6 overflow-hidden rounded-full border border-amber-300/30 bg-violet-900/60">
                  <span
                    ref={starBarTargetRef}
                    className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 opacity-0"
                  />
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #f59e0b, #fbbf24, #fde047)",
                      boxShadow:
                        "0 0 16px rgba(251,191,36,0.6), inset 0 1px 2px rgba(255,255,255,0.3)",
                    }}
                    animate={{ width: `${starsProgressRatio * 100}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                  {/* Sparkle dots overlay */}
                  <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[8px_8px]" />
                  {/* Star counter inside */}
                  <div className="absolute inset-0 flex items-center justify-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-white text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
                    <span className="text-xs font-black tabular-nums text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {displayedStars}/{TARGET_STARS}
                    </span>
                  </div>
                </div>
              </div>

            </div>
            </div>

            <div className="pointer-events-none absolute -top-2 right-3 z-10 h-6 w-[3.6rem]">
              <span
                ref={shieldStarTargetRef}
                className="absolute left-0 top-0 h-6 w-6 opacity-0"
              />
              <span
                ref={x2TargetRef}
                className="absolute right-0 top-0 h-6 w-6 opacity-0"
              />
            </div>

            {/* Floating x2 / shield indicators (no layout shift) */}
            <AnimatePresence>
              {(showX2Badge || showShieldStarBadge) && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="pointer-events-none absolute -top-2 right-3 z-20 flex h-6 w-[3.6rem] items-center justify-between"
                >
                  {showShieldStarBadge && (
                    <motion.div
                      key={`shield-star-${shieldStarPulseTick}`}
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="rounded-full bg-violet-400 p-1 shadow-[0_0_10px_rgba(168,85,247,0.55)]"
                    >
                      <Shield className="h-3.5 w-3.5 fill-violet-950 text-violet-950" />
                    </motion.div>
                  )}
                  {showX2Badge && (
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 0.85, repeat: Infinity }}
                      className="inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-amber-200/70 bg-amber-400 px-1.5 text-[10px] font-black leading-none text-violet-950 shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                    >
                      x2
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* --- Wheel Area --- */}
        <div className="relative flex flex-1 items-center justify-center">
          <div
            ref={wheelCenterRef}
            className="relative"
            style={{ width: wheelSize, height: wheelSize }}
          >
            {/* Outer glow ring - magical aura */}
            <motion.div
              className="absolute inset-[-20px] rounded-full transform-gpu will-change-transform"
              animate={
                isSpinning
                  ? { scale: 1, opacity: 0.9 }
                  : wheelScaleShake
                    ? { rotate: [-1.2, 1.2, -0.8, 0.8, 0], scale: [1, 1.01, 1] }
                    : { rotate: 0, scale: 1, opacity: 1 }
              }
              transition={
                isSpinning
                  ? { duration: 0.2, ease: "linear" }
                  : { duration: 0.32, repeat: wheelScaleShake ? Infinity : 0 }
              }
              style={{
                background: isHolding
                  ? `conic-gradient(from -90deg, rgba(168,85,247,0.9) ${powerRatio * 360}deg, rgba(88,28,135,0.2) ${powerRatio * 360}deg 360deg)`
                  : "conic-gradient(from 0deg, rgba(168,85,247,0.25), rgba(251,191,36,0.25), rgba(56,189,248,0.25), rgba(168,85,247,0.25))",
                boxShadow: isHolding
                  ? powerRatio > 0.9
                    ? "0 0 40px rgba(168,85,247,0.7), 0 0 80px rgba(168,85,247,0.3)"
                    : `0 0 ${14 + powerRatio * 26}px rgba(168,85,247,${0.3 + powerRatio * 0.4})`
                  : isSpinning
                    ? "0 0 40px rgba(168,85,247,0.5), 0 0 80px rgba(168,85,247,0.2)"
                    : "0 0 20px rgba(168,85,247,0.15)",
              }}
            />

            {/* Decorative ring markers */}
            <div
              className="absolute inset-[-8px] rounded-full border-2 border-violet-400/20"
              style={{
                background:
                  "radial-gradient(circle, transparent 55%, rgba(88,28,135,0.2) 100%)",
              }}
            />

            {/* The Wheel */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Vòng quay may mắn"
              className="relative h-full w-full cursor-pointer rounded-full touch-none select-none transform-gpu"
              onPointerDown={handleWheelPointerDown}
              onPointerUp={stopHolding}
              onPointerCancel={stopHolding}
              onPointerLeave={stopHolding}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  if (!isHolding) {
                    beginHolding();
                  } else {
                    stopHolding();
                  }
                }
              }}
              style={{
                transform: `translate3d(0,0,0) rotate(${wheelRotation}deg)`,
                willChange: isSpinning ? "transform" : undefined,
                backfaceVisibility: "hidden",
                transition: isSpinning
                  ? `transform ${spinDurationMs}ms cubic-bezier(0.2, 0.68, 0.2, 1)`
                  : undefined,
              }}
            >
              <svg
                viewBox="0 0 400 400"
                className="h-full w-full"
                style={{
                  filter: isSpinning
                    ? "none"
                    : "drop-shadow(0 12px 24px rgba(7,3,24,0.7)) drop-shadow(0 0 40px rgba(88,28,135,0.25))",
                }}
              >
                <defs>
                  <radialGradient
                    id="mysteryWheelCenter"
                    cx="50%"
                    cy="50%"
                    r="55%"
                  >
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </radialGradient>
                  <radialGradient id="mysteryWheelBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#0f0a2e" />
                  </radialGradient>
                  <filter
                    id="segGlow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                </defs>

                {/* Outer ring of wheel */}
                <circle
                  cx="200"
                  cy="200"
                  r="196"
                  fill="none"
                  stroke="url(#mysteryWheelBg)"
                  strokeWidth="6"
                />
                <circle cx="200" cy="200" r="194" fill="#1e1145" />

                {/* Segment dividers background glow */}
                {WHEEL_SEGMENTS.map((segment, index) => {
                  const path = buildSegmentPath(index, 188, 62, 200);
                  const highlighted = index === activeSegmentIndex;
                  return (
                    <g key={`seg-${index}`}>
                      <path
                        d={path}
                        fill={segment.color}
                        stroke={highlighted ? "#fde047" : "rgba(30,17,69,0.7)"}
                        strokeWidth={highlighted ? 3 : 1.5}
                        opacity={highlighted ? 1 : 0.88}
                        style={{
                          filter: highlighted
                            ? `drop-shadow(0 0 16px ${segment.glow})`
                            : undefined,
                        }}
                      />
                      {/* Subtle inner gradient per segment */}
                      <path
                        d={path}
                        fill="url(#mysteryWheelBg)"
                        opacity={0.12}
                      />
                    </g>
                  );
                })}

                {/* Icons on segments */}
                {WHEEL_SEGMENTS.map((segment, index) => {
                  const centerAngle = -90 + index * SEGMENT_ANGLE;
                  const iconPoint = polarToCartesian(
                    200,
                    200,
                    130,
                    centerAngle,
                  );
                  const highlighted = index === activeSegmentIndex;
                  return (
                    <text
                      key={`icon-${index}`}
                      x={iconPoint.x}
                      y={iconPoint.y + 7}
                      textAnchor="middle"
                      fontSize={highlighted ? 28 : 24}
                      style={{
                        filter: highlighted
                          ? "drop-shadow(0 0 10px rgba(255,255,255,0.9))"
                          : "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                      }}
                    >
                      {segment.icon}
                    </text>
                  );
                })}

                {/* Decorative dots between segments */}
                {WHEEL_SEGMENTS.map((_, index) => {
                  const divAngle =
                    -90 + index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
                  const dot = polarToCartesian(200, 200, 192, divAngle);
                  return (
                    <circle
                      key={`dot-${index}`}
                      cx={dot.x}
                      cy={dot.y}
                      r={3}
                      fill="#fbbf24"
                      opacity={0.7}
                    />
                  );
                })}

                {/* Center hub */}
                <circle
                  cx="200"
                  cy="200"
                  r="56"
                  fill="url(#mysteryWheelCenter)"
                  stroke="#fcd34d"
                  strokeWidth={3}
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(245,158,11,0.5))",
                  }}
                />
                {/* Inner ring detail */}
                <circle
                  cx="200"
                  cy="200"
                  r="48"
                  fill="none"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1.5}
                />
                <text
                  x="200"
                  y="210"
                  textAnchor="middle"
                  fontSize="34"
                  style={{
                    filter: "drop-shadow(0 2px 6px rgba(120,53,15,0.5))",
                  }}
                >
                  🔮
                </text>
              </svg>
            </div>

            {/* Pointer arrow */}
            <div className="pointer-events-none absolute -top-7 left-1/2 z-20 -translate-x-1/2">
              <motion.div
                animate={canSpin ? { y: [0, -3, 0] } : {}}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg width="36" height="40" viewBox="0 0 36 40" fill="none">
                  <defs>
                    <linearGradient
                      id="pointerGrad"
                      x1="18"
                      y1="0"
                      x2="18"
                      y2="40"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="pointerGlow">
                      <feDropShadow
                        dx="0"
                        dy="0"
                        stdDeviation="4"
                        floodColor="#fbbf24"
                        floodOpacity="0.7"
                      />
                    </filter>
                  </defs>
                  <polygon
                    points="18,38 2,4 18,12 34,4"
                    fill="url(#pointerGrad)"
                    stroke="#d97706"
                    strokeWidth="1.5"
                    filter="url(#pointerGlow)"
                  />
                </svg>
              </motion.div>
            </div>

            {/* "Hold to spin" hint */}
            {showHoldHint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0.45, 1, 0.45], y: [0, -1, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="pointer-events-none absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-800/60 px-4 py-1.5 text-xs font-bold text-violet-200 shadow-lg backdrop-blur-sm"
              >
                {"Nhấn giữ & thả để quay"}
              </motion.div>
            )}

            {/* Power bar indicator (below wheel when holding) */}
            <AnimatePresence>
              {isHolding && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.5 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.5 }}
                  className="absolute -bottom-[3.35rem] left-1/2 w-3/4 -translate-x-1/2"
                >
                  <div className="pointer-events-none mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.08em] text-violet-200/90">
                    <span>{"Lực quay"}</span>
                    <span>{`${powerTierLabel} • ${powerPercent}%`}</span>
                  </div>
                  <motion.div className="h-3 overflow-hidden rounded-full border border-violet-400/30 bg-violet-950/70">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${powerRatio * 100}%`,
                        background:
                          powerRatio > 0.9
                            ? "linear-gradient(90deg, #a855f7, #f43f5e, #fbbf24)"
                            : powerRatio > 0.5
                              ? "linear-gradient(90deg, #a855f7, #c084fc)"
                              : "linear-gradient(90deg, #7c3aed, #a855f7)",
                        boxShadow:
                          powerRatio > 0.9
                            ? "0 0 12px rgba(168,85,247,0.8)"
                            : `0 0 ${4 + powerRatio * 8}px rgba(168,85,247,${0.3 + powerRatio * 0.4})`,
                      }}
                      animate={powerRatio > 0.9 ? { opacity: [1, 0.8, 1] } : {}}
                      transition={{ duration: 0.3, repeat: Infinity }}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected segment feedback */}
            <AnimatePresence>
              {showSpinResultCard && activeSegment && activeSegmentText && (
                <motion.div
                  key={`${activeSegment.kind}-${spinResultPulseTick}`}
                  initial={{ opacity: 0, y: 10, scale: 0.88 }}
                  animate={{ opacity: 1, y: 0, scale: [1, 1.04, 1] }}
                  exit={{ opacity: 0, y: 8, scale: 0.9 }}
                  transition={{ duration: 0.42, ease: "easeOut" }}
                  className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-[78%] max-w-[19rem] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-200/45 bg-[radial-gradient(circle_at_25%_15%,rgba(251,191,36,0.22),rgba(76,29,149,0.9)_70%)] px-4 py-3 text-white shadow-[0_0_36px_rgba(168,85,247,0.4)] backdrop-blur-md"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-4xl">{activeSegment.icon}</span>
                    <div className="min-w-0">
                      <div className="font-hp-special text-xl leading-none text-amber-200">
                        {activeSegmentText.title}
                      </div>
                      <div className="mt-1 text-xs text-violet-100/90">
                        {activeSegmentText.subtitle}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mystery gift popup */}
            <AnimatePresence>
              {mysteryGift && mysteryRewardText && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex items-center justify-center bg-violet-950/45 backdrop-blur-[1.5px]"
                >
                  <motion.div
                    initial={{ scale: 0.78, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, ease: "easeOut" }}
                    className="mx-4 w-full max-w-[19rem] rounded-3xl border border-violet-200/35 bg-[radial-gradient(circle_at_30%_12%,rgba(251,191,36,0.26),rgba(59,7,100,0.95)_74%)] px-4 py-5 text-center shadow-[0_0_36px_rgba(139,92,246,0.45)]"
                  >
                    <p className="font-hp-special text-2xl text-amber-200">
                      Ô bí ẩn!
                    </p>
                    <p className="mt-1 text-sm text-violet-100/90">
                      Chạm hộp quà để mở phần thưởng
                    </p>
                    <motion.button
                      ref={mysteryGiftBoxRef}
                      type="button"
                      onClick={openMysteryGift}
                      disabled={mysteryGift.stage !== "closed"}
                      whileTap={
                        mysteryGift.stage === "closed"
                          ? { scale: 0.92 }
                          : undefined
                      }
                      animate={
                        mysteryGift.stage === "closed"
                          ? { y: [0, -4, 0], rotate: [0, -3, 3, 0] }
                          : { scale: [1, 1.16, 0.98], rotate: [0, -6, 8, 0] }
                      }
                      transition={{
                        duration: mysteryGift.stage === "closed" ? 1.15 : 0.55,
                        repeat: mysteryGift.stage === "closed" ? Infinity : 0,
                        ease: "easeInOut",
                      }}
                      className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-2xl border border-amber-200/60 bg-[radial-gradient(circle_at_30%_20%,rgba(254,240,138,0.9),rgba(234,179,8,0.85)_45%,rgba(180,83,9,0.9)_100%)] text-5xl shadow-[0_12px_28px_rgba(120,53,15,0.45)]"
                    >
                      {mysteryGift.stage === "opening" ? "🎉" : "🎁"}
                    </motion.button>

                    <AnimatePresence>
                      {mysteryGift.stage === "opening" && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.82 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="mt-3 rounded-2xl border border-violet-100/30 bg-violet-900/60 px-3 py-2"
                        >
                          <div className="text-3xl">{mysteryRewardText.icon}</div>
                          <p className="mt-1 font-hp-special text-xl text-amber-200">
                            {mysteryRewardText.title}
                          </p>
                          <p className="text-xs text-violet-100/90">
                            {mysteryRewardText.subtitle}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Heart loss effect */}
            <AnimatePresence>
              {heartLossPulseTick > 0 && (
                <motion.div
                  key={heartLossPulseTick}
                  initial={{ opacity: 1, scale: 1.2, y: 0 }}
                  animate={{ opacity: 0, scale: 0.5, y: -50 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.65 }}
                  className="pointer-events-none absolute left-[15%] top-[10%] text-4xl drop-shadow-[0_0_10px_rgba(239,68,68,0.7)]"
                >
                  💔
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {rewardFlights.map((flight) => (
        <motion.div
          key={flight.id}
          className="pointer-events-none fixed left-0 top-0 z-30 -translate-x-1/2 -translate-y-1/2"
          initial={{
            x: flight.startX,
            y: flight.startY,
            scale: 0.9,
            opacity: 0,
            rotate: -6,
          }}
          animate={{
            x: flight.endX,
            y: flight.endY,
            scale: 0.96,
            rotate: 0,
            opacity: [0, 1, 0.98],
          }}
          transition={{
            x: {
              delay: flight.delayMs / 1000,
              duration: flight.durationMs / 1000,
              ease: [0.22, 1, 0.36, 1],
            },
            y: {
              delay: flight.delayMs / 1000,
              duration: flight.durationMs / 1000,
              ease: [0.22, 1, 0.36, 1],
            },
            scale: {
              delay: flight.delayMs / 1000,
              duration: flight.durationMs / 1000,
              ease: "easeOut",
            },
            rotate: {
              delay: flight.delayMs / 1000,
              duration: flight.durationMs / 1000,
              ease: "easeOut",
            },
            opacity: {
              delay: flight.delayMs / 1000,
              duration: flight.durationMs / 1000,
              ease: "linear",
              times: [0, 0.2, 1],
            },
          }}
        >
          <RewardFlightIcon visual={flight.visual} />
        </motion.div>
      ))}

      {/* ===== Win / Lose Overlay ===== */}
      <AnimatePresence>
        {gameStatus !== "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,17,69,0.85)_0%,rgba(7,3,24,0.95)_100%)] backdrop-blur-md" />

            {/* Win confetti */}
            {gameStatus === "win" && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {Array.from({ length: 36 }, (_, index) => {
                  const left = ((index * 29.3) % 100) + 0.5;
                  const duration = 2.2 + (index % 6) * 0.3;
                  const delay = (index % 10) * 0.12;
                  const symbols = ["✨", "🌟", "⭐", "🎉", "🎊", "💜"];
                  const symbol = symbols[index % symbols.length];
                  const size = 18 + (index % 4) * 6;
                  return (
                    <motion.div
                      key={`${confettiTick}-${index}`}
                      initial={{ y: -50, opacity: 0, rotate: 0 }}
                      animate={{
                        y: "115vh",
                        opacity: [0, 1, 1, 0],
                        rotate: index % 2 === 0 ? 360 : -360,
                      }}
                      transition={{ duration, delay, ease: "linear" }}
                      className="absolute"
                      style={{ left: `${left}%`, fontSize: size }}
                    >
                      {symbol}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Result card */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "backOut" }}
              className="relative z-10 mx-6 flex w-full max-w-xs flex-col items-center gap-3 overflow-hidden rounded-3xl border border-violet-300/20 bg-violet-950/80 px-6 py-8 shadow-[0_0_60px_rgba(139,92,246,0.3)] backdrop-blur-xl"
            >
              {/* Decorative top bar */}
              <div
                className="absolute left-0 right-0 top-0 h-1.5"
                style={{
                  background:
                    gameStatus === "win"
                      ? "linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)"
                      : "linear-gradient(90deg, #7c3aed, #a855f7, #7c3aed)",
                }}
              />

              {gameStatus === "win" ? (
                <>
                  <motion.div
                    animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-7xl drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]"
                  >
                    🏆
                  </motion.div>
                  <h2 className="font-hp-special text-2xl text-amber-300">
                    Tuyệt vời!
                  </h2>
                  <p className="text-center text-sm text-violet-200/80">
                    {"Bạn đã thu thập đủ "}
                    {TARGET_STARS}
                    {" ngôi sao!"}
                  </p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="text-7xl"
                  >
                    😢
                  </motion.div>
                  <h2 className="font-hp-special text-2xl text-violet-300">
                    Hết mạng rồi!
                  </h2>
                  <p className="text-center text-sm text-violet-200/70">
                    Đừng buồn, thử lại lần nữa nhé!
                  </p>
                </>
              )}

              <motion.div whileTap={{ scale: 0.92 }} className="mt-2">
                <PrimaryButton
                  onClick={restartGame}
                  className="rounded-2xl"
                  frontClassName="h-12 gap-2 px-6"
                  aria-label="Chơi lại"
                >
                  <RotateCcw className="h-5 w-5" />
                  <span className="font-hp-special text-base">Chơi lại</span>
                </PrimaryButton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
