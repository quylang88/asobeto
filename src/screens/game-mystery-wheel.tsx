"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RotateCcw, Shield, Sparkles, Star } from "lucide-react";
import {
  AUDIO,
  getWorldData,
  type LessonContent,
  type World1BookPage,
} from "@/data/game-config";
import { getStoredFloorProgress, saveFloorProgress } from "@/lib/floor-progress";
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
  extraSpin: number;
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
const HOLD_TO_MAX_MS = 5000;
const SEGMENT_ANGLE = 360 / 16;

const INITIAL_WHEEL_STATE: WheelState = {
  hearts: START_HEARTS,
  stars: 0,
  shieldHeart: false,
  shieldStar: false,
  x2Next: false,
  extraSpin: 0,
};

const GAME_PASS_RATE_FALLBACK: Record<GameDifficulty, number> = {
  easy: 0.78,
  medium: 0.64,
  hard: 0.5,
};

const WHEEL_SEGMENTS: WheelSegment[] = [
  { kind: "MYSTERY", icon: "❓", color: "#7c3aed", glow: "rgba(139,92,246,0.55)" },
  { kind: "GAME_EASY", icon: "🎮", color: "#10b981", glow: "rgba(52,211,153,0.5)" },
  { kind: "HEART_PLUS_1", icon: "❤️", color: "#f43f5e", glow: "rgba(251,113,133,0.55)" },
  { kind: "STAR_MINUS_1", icon: "💫", color: "#3b82f6", glow: "rgba(96,165,250,0.5)" },
  { kind: "TRACING_ALPHA", icon: "✍️", color: "#0ea5e9", glow: "rgba(56,189,248,0.5)" },
  { kind: "STAR_PLUS_2", icon: "✨", color: "#f59e0b", glow: "rgba(245,158,11,0.55)" },
  { kind: "MYSTERY", icon: "❓", color: "#8b5cf6", glow: "rgba(139,92,246,0.55)" },
  { kind: "GAME_MEDIUM", icon: "🕹️", color: "#f97316", glow: "rgba(251,146,60,0.5)" },
  { kind: "STAR_MINUS_1", icon: "💫", color: "#6366f1", glow: "rgba(129,140,248,0.5)" },
  { kind: "STAR_X2_NEXT", icon: "2️⃣", color: "#06b6d4", glow: "rgba(34,211,238,0.55)" },
  { kind: "STAR_PLUS_1", icon: "⭐", color: "#eab308", glow: "rgba(250,204,21,0.55)" },
  { kind: "MYSTERY", icon: "❓", color: "#a855f7", glow: "rgba(168,85,247,0.55)" },
  { kind: "TRACING_VOCAB", icon: "📘", color: "#14b8a6", glow: "rgba(45,212,191,0.5)" },
  { kind: "STAR_MINUS_1", icon: "💫", color: "#8b5cf6", glow: "rgba(139,92,246,0.5)" },
  { kind: "GAME_HARD", icon: "👾", color: "#ef4444", glow: "rgba(248,113,113,0.55)" },
  { kind: "STAR_PLUS_3", icon: "🌟", color: "#fbbf24", glow: "rgba(250,204,21,0.6)" },
];

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function normalizeDegree(value: number): number {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
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
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(
    null,
  );
  const [landedIcon, setLandedIcon] = useState<string | null>(null);
  const [embeddedChallenge, setEmbeddedChallenge] =
    useState<EmbeddedChallenge | null>(null);
  const [starFlyTokens, setStarFlyTokens] = useState<number[]>([]);
  const [heartLossPulseTick, setHeartLossPulseTick] = useState(0);
  const [shieldHeartPulseTick, setShieldHeartPulseTick] = useState(0);
  const [shieldStarPulseTick, setShieldStarPulseTick] = useState(0);
  const [spinAgainPulseTick, setSpinAgainPulseTick] = useState(0);
  const [confettiTick, setConfettiTick] = useState(0);

  const wheelStateRef = useRef(wheelState);
  const wheelRotationRef = useRef(wheelRotation);
  const holdStartRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const spinTargetIndexRef = useRef<number | null>(null);
  const scheduledActionsRef = useRef<ScheduledAction[]>([]);
  const scheduledActionIdRef = useRef(1);
  const spinResolveActionIdRef = useRef<number | null>(null);
  const spinSettleActionIdRef = useRef<number | null>(null);
  const starFlyIdRef = useRef(1);
  const challengeRunIdRef = useRef(0);
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
        regularFloors.map(async ({ towerId: challengeTowerId, floorId: challengeFloorId, maxStars }) => {
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
        }),
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
        const floorName = floor.nameUnlocked || floor.nameLocked || `Tầng ${floor.id}`;
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
      tracingAlphaLearned.length > 0
        ? tracingAlphaLearned
        : tracingAlphaUnlocked.length > 0
          ? tracingAlphaUnlocked
          : tracingAlphaAll;
    const tracingVocab =
      tracingVocabLearned.length > 0
        ? tracingVocabLearned
        : tracingVocabUnlocked.length > 0
          ? tracingVocabUnlocked
          : tracingVocabAll;

    return {
      miniGames,
      tracingAlpha,
      tracingVocab,
    };
  }, [learnedFloorKeys, world1BookPage, worldId]);

  const wheelScaleShake = isHolding && holdMs >= HOLD_TO_MAX_MS * 0.9;
  const powerRatio = clampNumber(holdMs / HOLD_TO_MAX_MS, 0, 1);
  const starsProgressRatio = clampNumber(wheelState.stars / TARGET_STARS, 0, 1);

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

  const scheduleAction = useCallback((delayMs: number, callback: () => void) => {
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
  }, []);

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
    spinResolveActionIdRef.current = null;
    spinSettleActionIdRef.current = null;
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

  const pushFlyingStars = useCallback(
    (count: number) => {
      const nextTokens = Array.from({ length: Math.max(1, count) }, () => {
        const nextId = starFlyIdRef.current;
        starFlyIdRef.current += 1;
        return nextId;
      });
      setStarFlyTokens((previous) => [...previous, ...nextTokens]);
      nextTokens.forEach((tokenId) => {
        scheduleAction(900, () => {
          setStarFlyTokens((previous) =>
            previous.filter((item) => item !== tokenId),
          );
        });
      });
    },
    [scheduleAction],
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
    (baseStars: number) => {
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
        pushFlyingStars(Math.min(3, gainedStars));
        playSuccessAnswer();
      }
    },
    [playSuccessAnswer, pushFlyingStars, updateWheelState],
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

  const grantShieldReward = useCallback(
    (shieldType: "heart" | "star") => {
      let fallbackStars = 0;
      updateWheelState((previous) => {
        const hasSameShield =
          shieldType === "heart" ? previous.shieldHeart : previous.shieldStar;
        if (!hasSameShield) {
          return {
            ...previous,
            shieldHeart:
              shieldType === "heart" ? true : previous.shieldHeart,
            shieldStar: shieldType === "star" ? true : previous.shieldStar,
          };
        }

        if (previous.hearts < MAX_HEARTS && Math.random() < 0.7) {
          return {
            ...previous,
            hearts: Math.min(MAX_HEARTS, previous.hearts + 1),
          };
        }

        fallbackStars = 1;
        return previous;
      });

      if (fallbackStars > 0) {
        awardStars(fallbackStars);
      }
    },
    [awardStars, updateWheelState],
  );

  const resolveChallengeRun = useCallback(
    (runId: number): boolean => {
      if (runId !== challengeRunIdRef.current) return false;
      challengeRunIdRef.current += 1;
      setEmbeddedChallenge(null);
      return true;
    },
    [],
  );

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
        const fallbackPass = Math.random() < GAME_PASS_RATE_FALLBACK[difficulty];
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
      const source = pickRandomItem(
        mode === "alpha" ? challengePools.tracingAlpha : challengePools.tracingVocab,
      );

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

  const resolveMystery = useCallback(() => {
    const randomValue = Math.random() * 100;
    if (randomValue < 35) {
      updateWheelState((previous) => ({
        ...previous,
        extraSpin: previous.extraSpin + 1,
      }));
      setSpinAgainPulseTick((tick) => tick + 1);
      finalizeTurn();
      return;
    }

    if (randomValue < 60) {
      grantShieldReward("heart");
      finalizeTurn();
      return;
    }

    if (randomValue < 85) {
      grantShieldReward("star");
      finalizeTurn();
      return;
    }

    if (randomValue < 95) {
      awardStars(1);
      finalizeTurn();
      return;
    }

    awardStars(2);
    finalizeTurn();
  }, [awardStars, finalizeTurn, grantShieldReward, updateWheelState]);

  const settleSegment = useCallback(
    (segmentIndex: number) => {
      const segment = WHEEL_SEGMENTS[segmentIndex];
      switch (segment.kind) {
        case "STAR_PLUS_1":
          awardStars(1);
          finalizeTurn();
          break;
        case "STAR_PLUS_2":
          awardStars(2);
          finalizeTurn();
          break;
        case "STAR_PLUS_3":
          awardStars(3);
          finalizeTurn();
          break;
        case "STAR_MINUS_1":
          applyStarMinus();
          finalizeTurn();
          break;
        case "HEART_PLUS_1":
          updateWheelState((previous) => ({
            ...previous,
            hearts: Math.min(MAX_HEARTS, previous.hearts + 1),
          }));
          finalizeTurn();
          break;
        case "STAR_X2_NEXT":
          updateWheelState((previous) => ({
            ...previous,
            x2Next: true,
          }));
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
          resolveMystery();
          break;
        default:
          finalizeTurn();
          break;
      }
    },
    [
      applyStarMinus,
      awardStars,
      finalizeTurn,
      launchGameChallenge,
      launchTracingChallenge,
      resolveMystery,
      updateWheelState,
    ],
  );

  const triggerSpin = useCallback(
    (power: number) => {
      if (gameStatus !== "playing") return;
      if (isSpinning || embeddedChallenge) return;

      updateWheelState((previous) => ({
        ...previous,
        extraSpin: previous.extraSpin > 0 ? previous.extraSpin - 1 : 0,
      }));
      setLandedIcon(null);
      setActiveSegmentIndex(null);
      clearVisualEffectQueue();

      const randomIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
      spinTargetIndexRef.current = randomIndex;

      const currentRotation = normalizeDegree(wheelRotationRef.current);
      const targetRotation = normalizeDegree(360 - randomIndex * SEGMENT_ANGLE);
      const delta = normalizeDegree(targetRotation - currentRotation);
      const loops = Math.round(3 + power * 5 + Math.random() * 1.1);
      const duration = Math.round(2200 + (1 - power) * 1250 + Math.random() * 260);

      setSpinDurationMs(duration);
      setIsSpinning(true);
      setWheelRotation((previous) => previous + loops * 360 + delta);

      spinResolveActionIdRef.current = scheduleAction(duration + 20, () => {
        spinResolveActionIdRef.current = null;
        setIsSpinning(false);

        const landedSegment = spinTargetIndexRef.current;
        if (landedSegment === null) return;
        setActiveSegmentIndex(landedSegment);
        setLandedIcon(WHEEL_SEGMENTS[landedSegment]?.icon ?? null);

        spinSettleActionIdRef.current = scheduleAction(280, () => {
          spinSettleActionIdRef.current = null;
          settleSegment(landedSegment);
        });
      });
    },
    [
      clearVisualEffectQueue,
      embeddedChallenge,
      gameStatus,
      isSpinning,
      scheduleAction,
      settleSegment,
      updateWheelState,
    ],
  );

  const stopHolding = useCallback(() => {
    if (!isHolding) return;
    if (holdRafRef.current !== null) {
      window.cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    holdStartRef.current = null;
    setIsHolding(false);
    const capturedPower = clampNumber(holdMs / HOLD_TO_MAX_MS, 0, 1);
    setHoldMs(0);
    triggerSpin(capturedPower);
  }, [holdMs, isHolding, triggerSpin]);

  const beginHolding = useCallback(() => {
    if (gameStatus !== "playing" || isSpinning || embeddedChallenge) return;
    if (isHolding) return;

    if (holdRafRef.current !== null) {
      window.cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    setIsHolding(true);
    setHoldMs(0);
    holdStartRef.current = performance.now();

    const tick = (timestamp: number) => {
      if (holdStartRef.current === null) return;
      const elapsedMs = Math.min(HOLD_TO_MAX_MS, timestamp - holdStartRef.current);
      setHoldMs(elapsedMs);
      holdRafRef.current = window.requestAnimationFrame(tick);
    };

    holdRafRef.current = window.requestAnimationFrame(tick);
  }, [embeddedChallenge, gameStatus, isHolding, isSpinning]);

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
    setActiveSegmentIndex(null);
    setLandedIcon(null);
    setEmbeddedChallenge(null);
    setStarFlyTokens([]);
  }, [clearVisualEffectQueue]);

  useEffect(() => {
    wheelStateRef.current = wheelState;
  }, [wheelState]);

  useEffect(() => {
    wheelRotationRef.current = wheelRotation;
  }, [wheelRotation]);

  useEffect(() => {
    preloadAppAudioList([AUDIO.FEEDBACK.SUCCESS_ANSWER, AUDIO.FEEDBACK.WRONG_ANSWER]);
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
        activeIndex !== null ? WHEEL_SEGMENTS[activeIndex]?.kind ?? null : null;
      return JSON.stringify({
        mode: gameStatus,
        coordinateSystem:
          "wheel index 0 starts at top pointer, then clockwise to index 15",
        isHolding,
        holdPower: Number(powerRatio.toFixed(3)),
        isSpinning,
        wheelRotation: Number(normalizeDegree(wheelRotationRef.current).toFixed(2)),
        activeSegmentIndex: activeIndex,
        activeSegmentKind: activeKind,
        hearts: wheelStateRef.current.hearts,
        stars: wheelStateRef.current.stars,
        shieldHeart: wheelStateRef.current.shieldHeart,
        shieldStar: wheelStateRef.current.shieldStar,
        x2Next: wheelStateRef.current.x2Next,
        extraSpin: wheelStateRef.current.extraSpin,
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

  const canSpin =
    gameStatus === "playing" && !isSpinning && !isHolding && !embeddedChallenge;

  return (
    <div className="relative h-dvh w-full overflow-hidden text-white">
      {/* Deep mystery gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1e1b4b_0%,#0f0a2e_40%,#070318_100%)]" />

      {/* Animated floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }, (_, i) => {
          const size = 2 + (i % 4) * 1.5;
          const left = (i * 5.89) % 100;
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
              animate={{
                y: [0, -60 - i * 4, 0],
                opacity: [opacity, opacity * 1.8, opacity],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: animDuration,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
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
            <motion.div whileTap={{ scale: 0.94 }}>
              <PrimaryButton
                onClick={onBack}
                className="rounded-2xl"
                frontClassName="h-12 w-12"
                aria-label="Quay lại"
              >
                <ChevronLeft className="h-6 w-6" />
              </PrimaryButton>
            </motion.div>
            <div className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, -8, 8, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-2xl"
              >
                🔮
              </motion.span>
              <h1 className="font-hp-special text-2xl text-amber-200 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)] md:text-3xl">
                Vòng quay bí ẩn
              </h1>
            </div>
          </div>

          {/* --- HUD Panel --- */}
          <div className="mt-3 overflow-hidden rounded-2xl border border-violet-400/25 bg-violet-950/60 shadow-[0_8px_32px_rgba(88,28,135,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
            <div className="flex items-center gap-3 px-3.5 py-2.5">
              {/* Hearts */}
              <div className="relative flex items-center gap-0.5 rounded-xl bg-violet-900/50 px-2 py-1.5">
                {Array.from({ length: MAX_HEARTS }, (_, index) => {
                  const filled = index < wheelState.hearts;
                  return (
                    <motion.span
                      key={index}
                      animate={
                        filled
                          ? { scale: [1, 1.15, 1] }
                          : {}
                      }
                      transition={{ duration: 0.8, delay: index * 0.08, repeat: Infinity, repeatDelay: 3 }}
                      className={`text-base ${filled ? "drop-shadow-[0_0_4px_rgba(239,68,68,0.6)]" : "opacity-20 grayscale"}`}
                    >
                      ❤️
                    </motion.span>
                  );
                })}
                {wheelState.shieldHeart && (
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
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #f59e0b, #fbbf24, #fde047)",
                      boxShadow: "0 0 16px rgba(251,191,36,0.6), inset 0 1px 2px rgba(255,255,255,0.3)",
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
                      {wheelState.stars}/{TARGET_STARS}
                    </span>
                  </div>
                </div>
              </div>

              {/* x2 & shield star badge */}
              <div className="relative flex items-center gap-1 rounded-xl bg-violet-900/50 px-2 py-1.5">
                <span className="text-base">⭐</span>
                {wheelState.x2Next && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0.7 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ duration: 0.65, repeat: Infinity }}
                    className="rounded-md bg-amber-400 px-1 text-[10px] font-black leading-tight text-violet-950 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  >
                    x2
                  </motion.span>
                )}
                {wheelState.shieldStar && (
                  <motion.div
                    key={shieldStarPulseTick}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-violet-400 p-0.5 shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                  >
                    <Shield className="h-3 w-3 fill-violet-950 text-violet-950" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Extra spin indicator */}
            {wheelState.extraSpin > 0 && (
              <motion.div
                key={spinAgainPulseTick}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-violet-400/15 px-3.5 py-1.5"
              >
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                  <span>{"Quay thêm: "}</span>
                  <span className="tabular-nums">{wheelState.extraSpin}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* --- Wheel Area --- */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
            {/* Outer glow ring - magical aura */}
            <motion.div
              className="absolute inset-[-20px] rounded-full"
              animate={
                isSpinning
                  ? { rotate: 360 }
                  : wheelScaleShake
                    ? { rotate: [-1.5, 1.5, -1, 1, 0] }
                    : { rotate: 0 }
              }
              transition={
                isSpinning
                  ? { duration: 2, repeat: Infinity, ease: "linear" }
                  : { duration: 0.35, repeat: wheelScaleShake ? Infinity : 0 }
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
                background: "radial-gradient(circle, transparent 55%, rgba(88,28,135,0.2) 100%)",
              }}
            />

            {/* The Wheel */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Vòng quay may mắn"
              className="relative h-full w-full cursor-pointer rounded-full touch-none select-none"
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
                transform: `rotate(${wheelRotation}deg)`,
                transition: isSpinning
                  ? `transform ${spinDurationMs}ms cubic-bezier(0.12, 0.8, 0.18, 1)`
                  : undefined,
              }}
            >
              <svg
                viewBox="0 0 400 400"
                className="h-full w-full"
                style={{
                  filter: "drop-shadow(0 12px 24px rgba(7,3,24,0.7)) drop-shadow(0 0 40px rgba(88,28,135,0.25))",
                }}
              >
                <defs>
                  <radialGradient id="mysteryWheelCenter" cx="50%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="60%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </radialGradient>
                  <radialGradient id="mysteryWheelBg" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#0f0a2e" />
                  </radialGradient>
                  <filter id="segGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </filter>
                </defs>

                {/* Outer ring of wheel */}
                <circle cx="200" cy="200" r="196" fill="none" stroke="url(#mysteryWheelBg)" strokeWidth="6" />
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
                  const iconPoint = polarToCartesian(200, 200, 130, centerAngle);
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
                  const divAngle = -90 + index * SEGMENT_ANGLE - SEGMENT_ANGLE / 2;
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
                  style={{ filter: "drop-shadow(0 2px 6px rgba(120,53,15,0.5))" }}
                >
                  🔮
                </text>
              </svg>
            </div>

            {/* Pointer arrow */}
            <div className="pointer-events-none absolute -top-7 left-1/2 z-20 -translate-x-1/2">
              <motion.div
                animate={
                  canSpin
                    ? { y: [0, -3, 0] }
                    : {}
                }
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg width="36" height="40" viewBox="0 0 36 40" fill="none">
                  <defs>
                    <linearGradient id="pointerGrad" x1="18" y1="0" x2="18" y2="40" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <filter id="pointerGlow">
                      <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fbbf24" floodOpacity="0.7" />
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
            <AnimatePresence>
              {canSpin && !activeSegmentIndex && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: [0.5, 1, 0.5], y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-800/60 px-4 py-1.5 text-xs font-bold text-violet-200 shadow-lg backdrop-blur-sm"
                >
                  {"Nhấn giữ & thả để quay"}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Power bar indicator (below wheel when holding) */}
            <AnimatePresence>
              {isHolding && (
                <motion.div
                  initial={{ opacity: 0, scaleX: 0.5 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0.5 }}
                  className="absolute -bottom-10 left-1/2 h-3 w-3/4 -translate-x-1/2 overflow-hidden rounded-full border border-violet-400/30 bg-violet-950/70"
                >
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
                    animate={
                      powerRatio > 0.9
                        ? { opacity: [1, 0.8, 1] }
                        : {}
                    }
                    transition={{ duration: 0.3, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Landed icon popup */}
            <AnimatePresence>
              {landedIcon && !isSpinning && (
                <motion.div
                  key={`${landedIcon}-${activeSegmentIndex}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: [1, 1.2, 1] }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-violet-300/30 bg-violet-900/70 px-6 py-4 text-5xl shadow-[0_0_40px_rgba(168,85,247,0.4)] backdrop-blur-md"
                >
                  {landedIcon}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Flying stars */}
            {starFlyTokens.map((token) => (
              <motion.div
                key={token}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: "30vw", y: "-40vh", scale: 0.3, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 text-3xl drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
              >
                ⭐
              </motion.div>
            ))}

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
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
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
