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
  { kind: "MYSTERY", icon: "❓", color: "#fde68a", glow: "rgba(251,191,36,0.46)" },
  { kind: "GAME_EASY", icon: "🎮", color: "#bbf7d0", glow: "rgba(74,222,128,0.46)" },
  { kind: "HEART_PLUS_1", icon: "❤️", color: "#fecdd3", glow: "rgba(251,113,133,0.48)" },
  { kind: "STAR_MINUS_1", icon: "⭐", color: "#dbeafe", glow: "rgba(59,130,246,0.44)" },
  { kind: "TRACING_ALPHA", icon: "✍️", color: "#bae6fd", glow: "rgba(14,165,233,0.48)" },
  { kind: "STAR_PLUS_2", icon: "✨", color: "#fde68a", glow: "rgba(234,179,8,0.46)" },
  { kind: "MYSTERY", icon: "❓", color: "#fef08a", glow: "rgba(251,191,36,0.46)" },
  { kind: "GAME_MEDIUM", icon: "🕹️", color: "#fed7aa", glow: "rgba(251,146,60,0.46)" },
  { kind: "STAR_MINUS_1", icon: "⭐", color: "#cbd5e1", glow: "rgba(100,116,139,0.44)" },
  { kind: "STAR_X2_NEXT", icon: "2️⃣", color: "#a5f3fc", glow: "rgba(34,211,238,0.48)" },
  { kind: "STAR_PLUS_1", icon: "⭐", color: "#fde68a", glow: "rgba(245,158,11,0.45)" },
  { kind: "MYSTERY", icon: "❓", color: "#fef08a", glow: "rgba(251,191,36,0.46)" },
  { kind: "TRACING_VOCAB", icon: "📘", color: "#99f6e4", glow: "rgba(45,212,191,0.46)" },
  { kind: "STAR_MINUS_1", icon: "⭐", color: "#cbd5e1", glow: "rgba(148,163,184,0.45)" },
  { kind: "GAME_HARD", icon: "👾", color: "#fdba74", glow: "rgba(251,113,133,0.47)" },
  { kind: "STAR_PLUS_3", icon: "🌟", color: "#fcd34d", glow: "rgba(250,204,21,0.48)" },
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

  const wheelSize = "min(74vw, 430px)";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-linear-to-b from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-16 top-24 h-72 w-72 rounded-full bg-fuchsia-400/18 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-3xl flex-col px-4 pb-safe pt-safe">
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
            <h1 className="font-hp-special text-3xl text-amber-100 md:text-4xl">
              Vòng quay bí ẩn
            </h1>
          </div>

          <div className="mt-4 rounded-3xl border border-white/20 bg-slate-900/55 px-4 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.45)] backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="relative rounded-2xl bg-slate-800/90 px-2 py-1">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: MAX_HEARTS }, (_, index) => {
                    const filled = index < wheelState.hearts;
                    return (
                      <span
                        key={index}
                        className={`text-lg ${
                          filled ? "opacity-100" : "opacity-25 grayscale"
                        }`}
                      >
                        ❤️
                      </span>
                    );
                  })}
                </div>
                {wheelState.shieldHeart && (
                  <motion.div
                    key={shieldHeartPulseTick}
                    initial={{ scale: 0.8, opacity: 0.9 }}
                    animate={{ scale: [1, 1.24, 1], opacity: [0.95, 1, 0.95] }}
                    transition={{ duration: 0.6 }}
                    className="absolute -right-2 -top-2 rounded-full bg-sky-300 p-1 text-slate-900 shadow-lg"
                  >
                    <Shield className="h-3.5 w-3.5 fill-slate-900" />
                  </motion.div>
                )}
              </div>

              <div className="flex-1">
                <div className="relative h-5 overflow-hidden rounded-full border border-cyan-200/45 bg-slate-700/80">
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-yellow-300 via-amber-300 to-orange-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]"
                    animate={{ width: `${starsProgressRatio * 100}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                  <div className="pointer-events-none absolute inset-0 opacity-35 bg-[radial-gradient(rgba(255,255,255,0.75)_1px,transparent_1px)] bg-size-[12px_12px]" />
                </div>
                <div className="mt-1.5 flex items-center justify-end gap-1 text-sm text-amber-100">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  <span className="font-bold tabular-nums">
                    {wheelState.stars}/{TARGET_STARS}
                  </span>
                </div>
              </div>

              <div className="relative rounded-2xl bg-slate-800/90 px-2.5 py-1.5 text-right">
                <div className="flex items-center gap-1 text-lg">
                  <span>⭐</span>
                  {wheelState.x2Next && (
                    <motion.span
                      key={`${wheelState.x2Next}`}
                      initial={{ scale: 0.8, opacity: 0.7 }}
                      animate={{ scale: [1, 1.15, 1], opacity: 1 }}
                      transition={{ duration: 0.7, repeat: Infinity }}
                      className="rounded-md bg-cyan-300 px-1 text-xs font-black text-slate-900"
                    >
                      x2
                    </motion.span>
                  )}
                </div>
                {wheelState.shieldStar && (
                  <motion.div
                    key={shieldStarPulseTick}
                    initial={{ scale: 0.82, opacity: 0.9 }}
                    animate={{ scale: [1, 1.24, 1], opacity: [0.95, 1, 0.95] }}
                    transition={{ duration: 0.6 }}
                    className="absolute -right-2 -top-2 rounded-full bg-violet-300 p-1 text-slate-900 shadow-lg"
                  >
                    <Shield className="h-3.5 w-3.5 fill-slate-900" />
                  </motion.div>
                )}
              </div>
            </div>
            {wheelState.extraSpin > 0 && (
              <motion.div
                key={spinAgainPulseTick}
                initial={{ opacity: 0.72, scale: 0.86 }}
                animate={{ opacity: 1, scale: [1, 1.06, 1] }}
                transition={{ duration: 0.55 }}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-300/90 px-2.5 py-1 text-xs font-black text-slate-900"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="tabular-nums">{wheelState.extraSpin}</span>
              </motion.div>
            )}
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
            <motion.div
              className="absolute inset-[-16px] rounded-full"
              animate={
                wheelScaleShake
                  ? { rotate: [-1.2, 1.2, -0.8, 0.8, 0] }
                  : { rotate: 0 }
              }
              transition={{ duration: 0.35, repeat: wheelScaleShake ? Infinity : 0 }}
              style={{
                background: `conic-gradient(from -90deg, rgba(34,211,238,0.9) ${powerRatio * 360}deg, rgba(148,163,184,0.25) ${powerRatio * 360}deg 360deg)`,
                boxShadow:
                  powerRatio > 0.92
                    ? "0 0 26px rgba(34,211,238,0.75)"
                    : "0 0 14px rgba(34,211,238,0.3)",
              }}
            />

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
              <svg viewBox="0 0 400 400" className="h-full w-full drop-shadow-[0_16px_30px_rgba(2,6,23,0.6)]">
                <defs>
                  <radialGradient id="wheelCenter" cx="50%" cy="50%" r="52%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </radialGradient>
                </defs>
                <circle cx="200" cy="200" r="194" fill="#0f172a" />
                {WHEEL_SEGMENTS.map((segment, index) => {
                  const path = buildSegmentPath(index, 186, 64, 200);
                  const centerAngle = -90 + index * SEGMENT_ANGLE;
                  const iconPoint = polarToCartesian(200, 200, 130, centerAngle);
                  const highlighted = index === activeSegmentIndex;
                  return (
                    <g key={`${segment.kind}-${index}`}>
                      <path
                        d={path}
                        fill={segment.color}
                        stroke={highlighted ? "#fef08a" : "rgba(15,23,42,0.45)"}
                        strokeWidth={highlighted ? 4 : 2}
                        style={{
                          filter: highlighted
                            ? `drop-shadow(0 0 14px ${segment.glow})`
                            : undefined,
                        }}
                      />
                      <text
                        x={iconPoint.x}
                        y={iconPoint.y + 7}
                        textAnchor="middle"
                        fontSize={highlighted ? 28 : 25}
                        style={{
                          filter: highlighted
                            ? "drop-shadow(0 0 8px rgba(255,255,255,0.82))"
                            : undefined,
                        }}
                      >
                        {segment.icon}
                      </text>
                    </g>
                  );
                })}
                <circle
                  cx="200"
                  cy="200"
                  r="58"
                  fill="url(#wheelCenter)"
                  stroke="#fff7ed"
                  strokeWidth={4}
                />
                <text
                  x="200"
                  y="209"
                  textAnchor="middle"
                  fontSize="32"
                  style={{ filter: "drop-shadow(0 2px 4px rgba(15,23,42,0.35))" }}
                >
                  ✨
                </text>
              </svg>
            </div>

            <div className="pointer-events-none absolute -top-6 left-1/2 z-20 -translate-x-1/2">
              <div
                className="h-0 w-0 border-x-[16px] border-b-[30px] border-x-transparent border-b-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                style={{ transform: "translateY(2px)" }}
              />
            </div>

            <AnimatePresence>
              {landedIcon && !isSpinning && (
                <motion.div
                  key={`${landedIcon}-${activeSegmentIndex}`}
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: [1, 1.18, 1], y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white/20 px-5 py-3 text-4xl shadow-[0_0_25px_rgba(255,255,255,0.35)] backdrop-blur-sm"
                >
                  {landedIcon}
                </motion.div>
              )}
            </AnimatePresence>

            {starFlyTokens.map((token) => (
              <motion.div
                key={token}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: "32vw", y: "-42vh", scale: 0.35, opacity: 0 }}
                transition={{ duration: 0.86, ease: "easeInOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 text-3xl"
              >
                ⭐
              </motion.div>
            ))}

            <AnimatePresence>
              {heartLossPulseTick > 0 && (
                <motion.div
                  key={heartLossPulseTick}
                  initial={{ opacity: 0.95, scale: 1.04, y: 0 }}
                  animate={{ opacity: 0, scale: 0.72, y: -46 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.72 }}
                  className="pointer-events-none absolute left-[11%] top-[8%] text-3xl"
                >
                  💔
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameStatus !== "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
          >
            {gameStatus === "win" && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {Array.from({ length: 24 }, (_, index) => {
                  const left = ((index * 37) % 100) + 0.5;
                  const duration = 2.4 + (index % 5) * 0.22;
                  const delay = (index % 8) * 0.08;
                  const symbol = index % 2 === 0 ? "✨" : "🎉";
                  return (
                    <motion.div
                      key={`${confettiTick}-${index}`}
                      initial={{ y: -40, opacity: 0 }}
                      animate={{ y: "112vh", opacity: [0, 1, 1, 0] }}
                      transition={{ duration, delay, ease: "linear" }}
                      className="absolute text-2xl"
                      style={{ left: `${left}%` }}
                    >
                      {symbol}
                    </motion.div>
                  );
                })}
              </div>
            )}
            <motion.div
              initial={{ scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative z-10 flex flex-col items-center gap-4 rounded-[2rem] border border-white/30 bg-white/15 px-8 py-7 shadow-2xl backdrop-blur-md"
            >
              <div className="text-7xl">{gameStatus === "win" ? "🏆" : "🥺"}</div>
              <motion.div whileTap={{ scale: 0.92 }}>
                <PrimaryButton
                  onClick={restartGame}
                  className="rounded-3xl"
                  frontClassName="h-14 w-14"
                  aria-label="Chơi lại"
                >
                  <RotateCcw className="h-6 w-6" />
                </PrimaryButton>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
