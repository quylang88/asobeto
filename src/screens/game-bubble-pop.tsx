"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import type {
  BubblePassStarRule,
  BubblePopLevelConfig,
  BubblePopLevelId,
  LessonContent,
} from "@/data/game-config";
import {
  getStoredFloorProgress,
  saveFloorProgress,
} from "@/lib/floor-progress";
import {
  BrokenHeartCelebration,
  StarCelebration,
  SuccessCelebrationOverlay,
} from "@/components/celebrations";
import { LessonCompletionView } from "@/components/completion";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  MiniGameCountdown,
  MiniGameLevelSelectPanel,
  MiniGameRulesModal,
  MiniGameTopHud,
} from "@/components/minigame";

const LEVEL_ORDER: BubblePopLevelId[] = ["easy", "normal", "hard"];
const LEVEL_LABEL: Record<BubblePopLevelId, string> = {
  easy: "Dễ",
  normal: "Vừa",
  hard: "Khó",
};
const PASS_EFFECT_HOLD_MS = 2200;
const FAIL_EFFECT_HOLD_MS = 2200;
const TARGET_BUBBLE_HIT_AUDIO = "/assets/audio/game/common/pop.mp3";
const WRONG_BUBBLE_HIT_AUDIO = "/assets/audio/feedback/wrong-answer.mp3";

type BubbleKind = "target" | "wrong" | "empty";
type BubbleLetter = string;
type ChallengePhase = "select" | "countdown" | "playing" | "result";

interface BubbleEntity {
  id: number;
  lane: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  kind: BubbleKind;
  letter: BubbleLetter;
}

interface HitPopup {
  id: number;
  x: number;
  y: number;
  label: string;
  tone: "good" | "bad";
}

interface BubbleBurst {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface GameBubblePopProps {
  worldId: number;
  towerId: number;
  floorId: number;
  floorName: string;
  floorMaxStars: number;
  lesson: LessonContent;
  onComplete: () => void;
  onBack: () => void;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function doesPassStarRuleMatch({
  rule,
  livesLost,
  timeLeft,
}: {
  rule: BubblePassStarRule;
  livesLost: number;
  timeLeft: number;
}): boolean {
  if (typeof rule.minLivesLost === "number" && livesLost < rule.minLivesLost) {
    return false;
  }
  if (typeof rule.maxLivesLost === "number" && livesLost > rule.maxLivesLost) {
    return false;
  }
  if (
    typeof rule.minTimeLeftExclusive === "number" &&
    timeLeft <= rule.minTimeLeftExclusive
  ) {
    return false;
  }
  if (
    typeof rule.maxTimeLeftInclusive === "number" &&
    timeLeft > rule.maxTimeLeftInclusive
  ) {
    return false;
  }
  return true;
}

function sumStars(stars: Record<BubblePopLevelId, number>): number {
  return stars.easy + stars.normal + stars.hard;
}

function getNextLevelId(levelId: BubblePopLevelId): BubblePopLevelId | null {
  const levelIndex = LEVEL_ORDER.indexOf(levelId);
  if (levelIndex < 0 || levelIndex >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[levelIndex + 1];
}

function isLevelUnlockedByStars(
  levelId: BubblePopLevelId,
  stars: Record<BubblePopLevelId, number>,
): boolean {
  if (levelId === "easy") return true;
  if (levelId === "normal") return stars.easy > 0;
  return stars.normal > 0;
}

function getLevelStorageKey(
  lessonId: string,
  levelId: BubblePopLevelId,
): string {
  return `${lessonId}:${levelId}`;
}

function getInitialLevelStars({
  worldId,
  towerId,
  floorId,
  floorMaxStars,
  lessonId,
}: {
  worldId: number;
  towerId: number;
  floorId: number;
  floorMaxStars: number;
  lessonId: string;
}): Record<BubblePopLevelId, number> {
  const emptyStars: Record<BubblePopLevelId, number> = {
    easy: 0,
    normal: 0,
    hard: 0,
  };
  if (typeof window === "undefined") return emptyStars;

  const stored = getStoredFloorProgress(
    {
      worldId,
      towerId,
      floorId,
    },
    floorMaxStars,
  );
  if (!stored) return emptyStars;

  const easyStored =
    stored.lessonStars[getLevelStorageKey(lessonId, "easy")] ?? 0;
  const normalStored =
    stored.lessonStars[getLevelStorageKey(lessonId, "normal")] ?? 0;
  const hardStored =
    stored.lessonStars[getLevelStorageKey(lessonId, "hard")] ?? 0;
  const hasPerLevelData = easyStored > 0 || normalStored > 0 || hardStored > 0;
  const fallbackStars = stored.stars;

  if (hasPerLevelData) {
    return {
      easy: clampInteger(easyStored, 0, 1),
      normal: clampInteger(normalStored, 0, 2),
      hard: clampInteger(hardStored, 0, 3),
    };
  }

  return {
    easy: fallbackStars >= 1 ? 1 : 0,
    normal: fallbackStars >= 3 ? 2 : 0,
    hard: fallbackStars >= 6 ? 3 : 0,
  };
}

export function GameBubblePop({
  worldId,
  towerId,
  floorId,
  floorName,
  floorMaxStars,
  lesson,
  onBack,
}: GameBubblePopProps) {
  const bubbleConfig = lesson.bubblePopGame;
  const levelList = useMemo(() => bubbleConfig?.levels ?? [], [bubbleConfig]);
  const levelMap = useMemo(
    () => new Map(levelList.map((level) => [level.id, level])),
    [levelList],
  );
  const targetLetters = useMemo<[string, string]>(() => {
    if (!bubbleConfig) return ["a", "c"];

    const normalizedLetters = bubbleConfig.targetLetters
      .map((letter) => letter.trim().toLocaleLowerCase("vi-VN"))
      .filter((letter) => letter.length > 0);
    const first = normalizedLetters[0] ?? "a";
    const second =
      normalizedLetters.find((letter) => letter !== first) ??
      (first === "a" ? "c" : "a");
    return [first, second];
  }, [bubbleConfig]);

  const [phase, setPhase] = useState<ChallengePhase>("select");
  const [selectedLevelId, setSelectedLevelId] =
    useState<BubblePopLevelId | null>("easy");
  const [targetLetter, setTargetLetter] = useState<string>(targetLetters[0]);
  const [countdownValue, setCountdownValue] = useState(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bubbles, setBubbles] = useState<BubbleEntity[]>([]);
  const [floatingPopups, setFloatingPopups] = useState<HitPopup[]>([]);
  const [bubbleBursts, setBubbleBursts] = useState<BubbleBurst[]>([]);
  const [didPass, setDidPass] = useState<boolean | null>(null);
  const [lastEarnedStars, setLastEarnedStars] = useState(0);
  const [passCelebrationStars, setPassCelebrationStars] = useState(0);
  const [showFailCelebration, setShowFailCelebration] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [recentlyUnlockedLevelId, setRecentlyUnlockedLevelId] =
    useState<BubblePopLevelId | null>(null);
  const [pendingUnlockLevelId, setPendingUnlockLevelId] =
    useState<BubblePopLevelId | null>(null);
  const [levelStars, setLevelStars] = useState<
    Record<BubblePopLevelId, number>
  >(() =>
    getInitialLevelStars({
      worldId,
      towerId,
      floorId,
      floorMaxStars,
      lessonId: lesson.id,
    }),
  );

  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const playfieldSizeRef = useRef({ width: 360, height: 520 });
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frameLoopRef = useRef<(timestamp: number) => void>(() => {});
  const lastFrameAtRef = useRef(0);
  const narrationSequenceIdRef = useRef(0);
  const hasPlayedSelectIntroRef = useRef(false);
  const spawnCooldownMsRef = useRef(0);
  const passCelebrationTimeoutRef = useRef<number | null>(null);
  const unlockAnimationTimeoutRef = useRef<number | null>(null);
  const damageFlashTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const passSequenceRef = useRef(false);
  const runningRef = useRef(false);
  const bubbleIdRef = useRef(1);
  const popupIdRef = useRef(1);
  const burstIdRef = useRef(1);
  const bubblesRef = useRef<BubbleEntity[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const timeLeftRef = useRef(0);
  const currentLevelRef = useRef<BubblePopLevelConfig | null>(null);
  const targetLetterRef = useRef<string>(targetLetters[0]);

  const selectedLevel = selectedLevelId
    ? (levelMap.get(selectedLevelId) ?? null)
    : null;
  const challengeHeaderTitle = bubbleConfig?.headerTitle?.trim() || floorName;

  useEffect(() => {
    const [firstLetter] = targetLetters;
    targetLetterRef.current = firstLetter;
  }, [targetLetters]);

  const isLevelUnlocked = useCallback(
    (levelId: BubblePopLevelId) => {
      if (pendingUnlockLevelId === levelId) return false;
      if (levelId === "easy") return true;
      if (levelId === "normal") return levelStars.easy > 0;
      return levelStars.normal > 0;
    },
    [levelStars.easy, levelStars.normal, pendingUnlockLevelId],
  );

  const clearTimeoutRef = useCallback((ref: { current: number | null }) => {
    if (ref.current === null) return;
    window.clearTimeout(ref.current);
    ref.current = null;
  }, []);

  const resetVisualFeedback = useCallback(() => {
    clearTimeoutRef(damageFlashTimeoutRef);
    clearTimeoutRef(shakeTimeoutRef);
    setShowDamageFlash(false);
    setIsShaking(false);
    setBubbleBursts([]);
  }, [clearTimeoutRef]);

  const stopGameLoop = useCallback(() => {
    runningRef.current = false;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastFrameAtRef.current = 0;
  }, []);

  const stopNarration = useCallback(() => {
    narrationSequenceIdRef.current += 1;
    if (!narrationAudioRef.current) return;
    narrationAudioRef.current.pause();
    narrationAudioRef.current.currentTime = 0;
    narrationAudioRef.current = null;
  }, []);

  const clearCelebrations = useCallback(() => {
    passSequenceRef.current = false;
    setPassCelebrationStars(0);
    setShowFailCelebration(false);
    if (passCelebrationTimeoutRef.current !== null) {
      window.clearTimeout(passCelebrationTimeoutRef.current);
      passCelebrationTimeoutRef.current = null;
    }
  }, []);

  const playNarration = useCallback(
    (audioSrc?: string | null) => {
      const src = audioSrc?.trim();
      if (!src) return;
      stopNarration();
      const audio = new Audio(src);
      narrationAudioRef.current = audio;
      audio.play().catch(() => undefined);
    },
    [stopNarration],
  );

  const playTapFeedbackAudio = useCallback((kind: "target" | "wrong") => {
    const src =
      kind === "target" ? TARGET_BUBBLE_HIT_AUDIO : WRONG_BUBBLE_HIT_AUDIO;
    const audio = new Audio(src);
    audio.play().catch(() => undefined);
  }, []);

  const enqueuePopup = useCallback(
    (x: number, y: number, label: string, tone: "good" | "bad") => {
      const popupId = popupIdRef.current;
      popupIdRef.current += 1;
      setFloatingPopups((current) => [
        ...current,
        { id: popupId, x, y, label, tone },
      ]);
      window.setTimeout(() => {
        setFloatingPopups((current) =>
          current.filter((popup) => popup.id !== popupId),
        );
      }, 780);
    },
    [],
  );

  const enqueueBurst = useCallback((x: number, y: number, size: number) => {
    const burstId = burstIdRef.current;
    burstIdRef.current += 1;
    setBubbleBursts((current) => [
      ...current,
      { id: burstId, x, y, size },
    ]);
    window.setTimeout(() => {
      setBubbleBursts((current) =>
        current.filter((burst) => burst.id !== burstId),
      );
    }, 420);
  }, []);

  const triggerDamageFeedback = useCallback(() => {
    setShowDamageFlash(true);
    clearTimeoutRef(damageFlashTimeoutRef);
    damageFlashTimeoutRef.current = window.setTimeout(() => {
      damageFlashTimeoutRef.current = null;
      setShowDamageFlash(false);
    }, 130);

    setIsShaking(false);
    clearTimeoutRef(shakeTimeoutRef);
    window.requestAnimationFrame(() => {
      setIsShaking(true);
      shakeTimeoutRef.current = window.setTimeout(() => {
        shakeTimeoutRef.current = null;
        setIsShaking(false);
      }, 230);
    });
  }, [clearTimeoutRef]);

  const persistProgress = useCallback(
    (nextLevelStars: Record<BubblePopLevelId, number>) => {
      const normalized: Record<BubblePopLevelId, number> = {
        easy: clampInteger(nextLevelStars.easy, 0, 1),
        normal: clampInteger(nextLevelStars.normal, 0, 2),
        hard: clampInteger(nextLevelStars.hard, 0, 3),
      };
      const mergedStars = Math.min(floorMaxStars, sumStars(normalized));
      saveFloorProgress({
        worldId,
        towerId,
        floorId,
        floorStars: mergedStars,
        maxStars: floorMaxStars,
        completed: mergedStars > 0,
        lessonStars: {
          [getLevelStorageKey(lesson.id, "easy")]: normalized.easy,
          [getLevelStorageKey(lesson.id, "normal")]: normalized.normal,
          [getLevelStorageKey(lesson.id, "hard")]: normalized.hard,
        },
      });
    },
    [floorId, floorMaxStars, lesson.id, towerId, worldId],
  );

  const getEarnedStarsOnPass = useCallback(
    (level: BubblePopLevelConfig): number => {
      if (!bubbleConfig) return level.starsReward;
      if (!level.passStarRules?.length) return level.starsReward;

      const livesLost = Math.max(0, bubbleConfig.startLives - livesRef.current);
      const timeLeft = timeLeftRef.current;
      for (const rule of level.passStarRules) {
        if (!doesPassStarRuleMatch({ rule, livesLost, timeLeft })) continue;
        return clampInteger(rule.stars, 1, level.starsReward);
      }

      return level.starsReward;
    },
    [bubbleConfig],
  );

  const finalizeLevel = useCallback(
    (passed: boolean, level: BubblePopLevelConfig, computedStars?: number) => {
      clearCelebrations();
      stopGameLoop();
      setPhase("result");
      setDidPass(passed);
      const earnedStars = passed
        ? clampInteger(computedStars ?? level.starsReward, 1, level.starsReward)
        : 0;
      setLastEarnedStars(earnedStars);
      setBubbles([]);
      bubblesRef.current = [];

      if (!passed) return;

      setLevelStars((previous) => {
        const next = {
          ...previous,
          [level.id]: Math.max(previous[level.id], earnedStars),
        };
        const nextLevelId = getNextLevelId(level.id);
        if (
          nextLevelId &&
          !isLevelUnlockedByStars(nextLevelId, previous) &&
          isLevelUnlockedByStars(nextLevelId, next)
        ) {
          setPendingUnlockLevelId(nextLevelId);
        }
        persistProgress(next);
        return next;
      });
    },
    [clearCelebrations, persistProgress, stopGameLoop],
  );

  const triggerLevelPass = useCallback(
    (level: BubblePopLevelConfig) => {
      if (passSequenceRef.current) return;
      passSequenceRef.current = true;
      const earnedStars = getEarnedStarsOnPass(level);
      stopGameLoop();
      setShowFailCelebration(false);
      setPassCelebrationStars(earnedStars);

      if (passCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(passCelebrationTimeoutRef.current);
      }
      passCelebrationTimeoutRef.current = window.setTimeout(() => {
        passCelebrationTimeoutRef.current = null;
        setPassCelebrationStars(0);
        passSequenceRef.current = false;
        finalizeLevel(true, level, earnedStars);
      }, PASS_EFFECT_HOLD_MS);
    },
    [finalizeLevel, getEarnedStarsOnPass, stopGameLoop],
  );

  const triggerLevelFail = useCallback(
    (level: BubblePopLevelConfig) => {
      if (passSequenceRef.current) return;
      passSequenceRef.current = true;
      stopGameLoop();
      setPassCelebrationStars(0);
      setShowFailCelebration(true);

      if (passCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(passCelebrationTimeoutRef.current);
      }
      passCelebrationTimeoutRef.current = window.setTimeout(() => {
        passCelebrationTimeoutRef.current = null;
        setShowFailCelebration(false);
        passSequenceRef.current = false;
        finalizeLevel(false, level);
      }, FAIL_EFFECT_HOLD_MS);
    },
    [finalizeLevel, stopGameLoop],
  );

  const pickRandomTargetLetter = useCallback((): string => {
    const [first, second] = targetLetters;
    return Math.random() < 0.5 ? first : second;
  }, [targetLetters]);

  const getLaneCenterX = useCallback(
    (lane: number) => {
      if (!bubbleConfig) return playfieldSizeRef.current.width / 2;
      const laneWidth = playfieldSizeRef.current.width / bubbleConfig.laneCount;
      return laneWidth * lane + laneWidth / 2;
    },
    [bubbleConfig],
  );

  const pickSpawnLane = useCallback(
    (size: number) => {
      if (!bubbleConfig) return 0;
      const laneCount = bubbleConfig.laneCount;
      const lanes = Array.from({ length: laneCount }, (_, lane) => lane);
      const shuffledLanes = [...lanes];
      for (let index = shuffledLanes.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledLanes[index], shuffledLanes[randomIndex]] = [
          shuffledLanes[randomIndex],
          shuffledLanes[index],
        ];
      }

      const playfieldHeight = playfieldSizeRef.current.height;
      const minGap = bubbleConfig.minSpawnVerticalGap;
      for (const lane of shuffledLanes) {
        let isBlocked = false;
        for (const bubble of bubblesRef.current) {
          const nearBottom =
            bubble.y > playfieldHeight - (minGap + bubble.size * 0.35);
          if (!nearBottom) continue;
          if (bubble.lane === lane) {
            isBlocked = true;
            break;
          }
          const nearAdjacentLane = Math.abs(bubble.lane - lane) === 1;
          const closeVertically = Math.abs(bubble.y - playfieldHeight) < minGap;
          if (nearAdjacentLane && closeVertically && size >= 82) {
            isBlocked = true;
            break;
          }
        }
        if (!isBlocked) {
          return lane;
        }
      }

      // Fallback: chọn lane ít bong bóng ở nửa dưới màn để giảm chạm nhầm.
      let bestLane = 0;
      let bestLaneCount = Number.POSITIVE_INFINITY;
      for (const lane of lanes) {
        const laneCountNearBottom = bubblesRef.current.filter(
          (bubble) =>
            bubble.lane === lane &&
            bubble.y > playfieldHeight - bubbleConfig.minSpawnVerticalGap * 1.5,
        ).length;
        if (laneCountNearBottom < bestLaneCount) {
          bestLane = lane;
          bestLaneCount = laneCountNearBottom;
        }
      }
      return bestLane;
    },
    [bubbleConfig],
  );

  const createBubble = useCallback(
    (level: BubblePopLevelConfig, forcedLane?: number): BubbleEntity | null => {
      if (!bubbleConfig) return null;

      const bubbleSize = Math.round(
        level.bubbleSize * randomBetween(0.94, 1.06),
      );
      const lane = forcedLane ?? pickSpawnLane(bubbleSize);
      const target = targetLetterRef.current;
      const [firstLetter, secondLetter] = targetLetters;
      const wrong =
        target === firstLetter
          ? secondLetter
          : target === secondLetter
            ? firstLetter
            : secondLetter;
      const roll = Math.random();
      let kind: BubbleKind = "wrong";
      if (roll <= level.emptyBubbleRatio) {
        kind = "empty";
      } else if (roll <= level.emptyBubbleRatio + level.targetBubbleRatio) {
        kind = "target";
      }

      const bubble: BubbleEntity = {
        id: bubbleIdRef.current,
        lane,
        x: getLaneCenterX(lane),
        y:
          playfieldSizeRef.current.height +
          bubbleSize * randomBetween(0.35, 1.05),
        size: bubbleSize,
        speed: randomBetween(level.speedRange.min, level.speedRange.max),
        kind,
        letter: kind === "empty" ? "" : kind === "target" ? target : wrong,
      };
      bubbleIdRef.current += 1;
      return bubble;
    },
    [bubbleConfig, getLaneCenterX, pickSpawnLane, targetLetters],
  );

  const spawnWave = useCallback(
    (level: BubblePopLevelConfig) => {
      if (!bubbleConfig) return;
      const firstBubble = createBubble(level);
      if (!firstBubble) return;
      bubblesRef.current = [...bubblesRef.current, firstBubble];

      if (!level.allowPairSpawn) return;
      const pairChance = level.pairSpawnChance ?? 0;
      if (Math.random() > pairChance) return;

      const adjacentLaneCandidates = [
        firstBubble.lane - 1,
        firstBubble.lane + 1,
      ].filter((lane) => lane >= 0 && lane < bubbleConfig.laneCount);
      if (!adjacentLaneCandidates.length) return;

      const lane =
        adjacentLaneCandidates[
          Math.floor(Math.random() * adjacentLaneCandidates.length)
        ];
      const secondBubble = createBubble(level, lane);
      if (!secondBubble) return;
      secondBubble.y += randomBetween(-16, 16);
      bubblesRef.current = [...bubblesRef.current, secondBubble];
    },
    [bubbleConfig, createBubble],
  );

  const runGameStep = useCallback(
    (deltaMs: number): boolean => {
      const level = currentLevelRef.current;
      if (!level) return true;

      const deltaSeconds = deltaMs / 1000;
      timeLeftRef.current = Math.max(0, timeLeftRef.current - deltaSeconds);

      spawnCooldownMsRef.current -= deltaMs;
      while (spawnCooldownMsRef.current <= 0) {
        spawnWave(level);
        spawnCooldownMsRef.current += randomBetween(
          level.spawnIntervalMs.min,
          level.spawnIntervalMs.max,
        );
      }

      const nextBubbles: BubbleEntity[] = [];
      for (const bubble of bubblesRef.current) {
        const nextY = bubble.y - bubble.speed * deltaSeconds;
        const escaped = nextY + bubble.size < 0;
        if (escaped) {
          if (bubble.kind === "target") {
            if (level.id === "hard") {
              scoreRef.current = Math.max(0, scoreRef.current - 1);
              enqueuePopup(bubble.x, 32, "-1", "bad");
            }
          }
          continue;
        }
        nextBubbles.push({ ...bubble, y: nextY });
      }
      bubblesRef.current = nextBubbles;

      if (livesRef.current <= 0) {
        triggerLevelFail(level);
        return true;
      }

      if (scoreRef.current >= level.targetScore) {
        triggerLevelPass(level);
        return true;
      }

      if (timeLeftRef.current <= 0) {
        triggerLevelFail(level);
        return true;
      }

      return false;
    },
    [enqueuePopup, spawnWave, triggerLevelFail, triggerLevelPass],
  );

  const frameLoop = useCallback(
    (timestamp: number) => {
      if (!runningRef.current) return;
      if (lastFrameAtRef.current === 0) {
        lastFrameAtRef.current = timestamp;
      }
      const deltaMs = Math.min(80, timestamp - lastFrameAtRef.current);
      lastFrameAtRef.current = timestamp;

      const ended = runGameStep(deltaMs);
      setBubbles([...bubblesRef.current]);
      setScore(scoreRef.current);
      setLives(livesRef.current);
      setTimeLeft(timeLeftRef.current);

      if (ended) return;
      animationFrameRef.current = window.requestAnimationFrame(
        frameLoopRef.current,
      );
    },
    [runGameStep],
  );

  useEffect(() => {
    frameLoopRef.current = frameLoop;
  }, [frameLoop]);

  const startGameplay = useCallback(() => {
    if (!bubbleConfig || !selectedLevel) return;
    stopNarration();
    stopGameLoop();
    clearCelebrations();
    resetVisualFeedback();
    setPhase("playing");
    setFloatingPopups([]);
    setBubbleBursts([]);
    setDidPass(null);
    setLastEarnedStars(0);

    currentLevelRef.current = selectedLevel;
    targetLetterRef.current = targetLetter;
    scoreRef.current = 0;
    livesRef.current = bubbleConfig.startLives;
    timeLeftRef.current = selectedLevel.durationSeconds;
    bubblesRef.current = [];
    bubbleIdRef.current = 1;
    spawnCooldownMsRef.current = 240;
    runningRef.current = true;

    setScore(0);
    setLives(bubbleConfig.startLives);
    setTimeLeft(selectedLevel.durationSeconds);
    setBubbles([]);
    setBubbleBursts([]);

    animationFrameRef.current = window.requestAnimationFrame(
      frameLoopRef.current,
    );
  }, [
    bubbleConfig,
    clearCelebrations,
    resetVisualFeedback,
    selectedLevel,
    stopGameLoop,
    stopNarration,
    targetLetter,
  ]);

  const startLevelCountdown = useCallback(
    (levelId: BubblePopLevelId) => {
      if (!isLevelUnlocked(levelId)) return;
      const level = levelMap.get(levelId);
      if (!level) return;
      stopGameLoop();
      clearCelebrations();
      resetVisualFeedback();
      const nextTargetLetter = pickRandomTargetLetter();
      setSelectedLevelId(levelId);
      setTargetLetter(nextTargetLetter);
      setDidPass(null);
      setLastEarnedStars(0);
      setFloatingPopups([]);
      setBubbleBursts([]);
      setCountdownValue(3);
      targetLetterRef.current = nextTargetLetter;
      const targetAudioKey = nextTargetLetter.toLocaleLowerCase("vi-VN");
      playNarration(bubbleConfig?.targetAudioByLetter?.[targetAudioKey]);
      setPhase("countdown");
    },
    [
      clearCelebrations,
      isLevelUnlocked,
      levelMap,
      pickRandomTargetLetter,
      playNarration,
      resetVisualFeedback,
      stopGameLoop,
      bubbleConfig,
    ],
  );

  const handleUnlockLevel = useCallback(
    (levelId: BubblePopLevelId) => {
      if (pendingUnlockLevelId !== levelId) return;
      setPendingUnlockLevelId(null);
      setRecentlyUnlockedLevelId(levelId);
      if (unlockAnimationTimeoutRef.current !== null) {
        window.clearTimeout(unlockAnimationTimeoutRef.current);
      }
      unlockAnimationTimeoutRef.current = window.setTimeout(() => {
        unlockAnimationTimeoutRef.current = null;
        setRecentlyUnlockedLevelId(null);
      }, 900);
    },
    [pendingUnlockLevelId],
  );

  const handleBubbleTap = useCallback(
    (bubbleId: number) => {
      if (phase !== "playing" || !runningRef.current) return;

      const bubbleIndex = bubblesRef.current.findIndex(
        (bubble) => bubble.id === bubbleId,
      );
      if (bubbleIndex < 0) return;

      const [bubble] = bubblesRef.current.splice(bubbleIndex, 1);
      if (!bubble) return;

      if (bubble.kind === "target") {
        scoreRef.current += 1;
        playTapFeedbackAudio("target");
        enqueueBurst(bubble.x, bubble.y, bubble.size);
        enqueuePopup(bubble.x, bubble.y, "+1", "good");
      } else if (bubble.kind === "wrong") {
        livesRef.current = Math.max(0, livesRef.current - 1);
        playTapFeedbackAudio("wrong");
        enqueuePopup(bubble.x, bubble.y, "-1❤", "bad");
        triggerDamageFeedback();
        if ("vibrate" in navigator) {
          navigator.vibrate(45);
        }
      }

      setBubbles([...bubblesRef.current]);
      setScore(scoreRef.current);
      setLives(livesRef.current);

      const level = currentLevelRef.current;
      if (level && livesRef.current <= 0) {
        triggerLevelFail(level);
        return;
      }

      if (level && scoreRef.current >= level.targetScore) {
        triggerLevelPass(level);
      }
    },
    [
      enqueueBurst,
      enqueuePopup,
      phase,
      playTapFeedbackAudio,
      triggerDamageFeedback,
      triggerLevelFail,
      triggerLevelPass,
    ],
  );

  useEffect(() => {
    const playfield = playfieldRef.current;
    if (!playfield) return;

    const updateSize = () => {
      const rect = playfield.getBoundingClientRect();
      playfieldSizeRef.current = {
        width: rect.width,
        height: rect.height,
      };
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(playfield);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (phase !== "countdown") return;
    const timeout = window.setTimeout(() => {
      if (countdownValue <= 1) {
        startGameplay();
        return;
      }
      setCountdownValue((current) => current - 1);
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [countdownValue, phase, startGameplay]);

  useEffect(() => {
    if (!bubbleConfig) return;
    if (phase !== "select") return;
    if (hasPlayedSelectIntroRef.current) return;
    hasPlayedSelectIntroRef.current = true;
    playNarration(bubbleConfig.introAudio);
  }, [bubbleConfig, phase, playNarration]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.render_game_to_text = () => {
      const payload = {
        mode: phase,
        coordinateSystem:
          "origin at top-left; x increases to the right; y increases downward",
        targetLetter: targetLetterRef.current,
        level: currentLevelRef.current?.id ?? selectedLevelId,
        score: scoreRef.current,
        lives: livesRef.current,
        timeLeft: Number(timeLeftRef.current.toFixed(2)),
        passCelebration: passCelebrationStars > 0,
        failCelebration: showFailCelebration,
        bubbles: bubblesRef.current.map((bubble) => ({
          id: bubble.id,
          x: Number(bubble.x.toFixed(1)),
          y: Number(bubble.y.toFixed(1)),
          size: Number(bubble.size.toFixed(1)),
          lane: bubble.lane,
          kind: bubble.kind,
          letter: bubble.letter,
        })),
      };
      return JSON.stringify(payload);
    };

    window.advanceTime = (ms: number) => {
      if (!runningRef.current) return;
      const stepCount = Math.max(1, Math.round(ms / (1000 / 60)));
      const stepMs = ms / stepCount;
      for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
        const ended = runGameStep(stepMs);
        if (ended) break;
      }
      setBubbles([...bubblesRef.current]);
      setScore(scoreRef.current);
      setLives(livesRef.current);
      setTimeLeft(timeLeftRef.current);
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    passCelebrationStars,
    phase,
    runGameStep,
    selectedLevelId,
    showFailCelebration,
  ]);

  useEffect(() => {
    return () => {
      stopGameLoop();
      stopNarration();
      resetVisualFeedback();
      if (passCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(passCelebrationTimeoutRef.current);
        passCelebrationTimeoutRef.current = null;
      }
      if (unlockAnimationTimeoutRef.current !== null) {
        window.clearTimeout(unlockAnimationTimeoutRef.current);
        unlockAnimationTimeoutRef.current = null;
      }
    };
  }, [resetVisualFeedback, stopGameLoop, stopNarration]);

  if (!bubbleConfig || levelList.length === 0) {
    return (
      <div className="relative flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-center text-foreground">
          Chưa có dữ liệu mini game cho tầng này.
        </p>
        <PrimaryButton
          onClick={onBack}
          className="rounded-2xl"
          frontClassName="px-5 py-2 text-sm"
        >
          Quay Lại
        </PrimaryButton>
      </div>
    );
  }

  if (phase === "result" && selectedLevel && didPass !== null) {
    return (
      <LessonCompletionView
        stars={lastEarnedStars}
        score={score}
        activeLessonsCount={selectedLevel.targetScore}
        activeLessonsTotalStars={selectedLevel.starsReward}
        floorMaxStars={selectedLevel.starsReward}
        successSummary={`Bé đã hoàn thành mức ${LEVEL_LABEL[selectedLevel.id]} với ${score} điểm!`}
        failSummary={`Bé đạt ${score}/${selectedLevel.targetScore} điểm. Mình thử lại mức ${LEVEL_LABEL[selectedLevel.id]} nhé!`}
        onComplete={() => {
          setDidPass(null);
          setPhase("select");
        }}
      />
    );
  }

  const levelSelectCards = LEVEL_ORDER.map((levelId) => {
    const level = levelMap.get(levelId);
    if (!level) return null;
    return {
      id: level.id,
      label: LEVEL_LABEL[level.id],
      subtitle: `${level.durationSeconds}s • ${level.targetScore} điểm`,
      starsReward: level.starsReward,
      earnedStars: levelStars[level.id],
      unlocked: isLevelUnlocked(level.id),
      pendingUnlock: pendingUnlockLevelId === level.id,
      actionLabel: "Chơi",
    };
  }).filter((level): level is NonNullable<typeof level> => level !== null);
  const hudTargetScore = selectedLevel?.targetScore ?? 0;
  const hudTimeSeconds =
    phase === "playing"
      ? Math.max(0, Math.ceil(timeLeft))
      : (selectedLevel?.durationSeconds ?? 0);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-linear-to-b from-sky-100 via-cyan-50 to-emerald-100">
      <AnimatePresence>
        {passCelebrationStars > 0 && <SuccessCelebrationOverlay />}
      </AnimatePresence>
      <AnimatePresence>
        {passCelebrationStars > 0 && (
          <StarCelebration stars={passCelebrationStars} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFailCelebration && <BrokenHeartCelebration />}
      </AnimatePresence>

      <MiniGameTopHud
        mode={phase === "select" ? "simple" : "stats"}
        title={challengeHeaderTitle}
        onBack={onBack}
        mascotEmotion={
          phase === "playing"
            ? "excited"
            : didPass === false
              ? "thinking"
              : "happy"
        }
        leftValue={`${score}/${hudTargetScore || "--"}`}
        centerHighlightText={phase === "select" ? undefined : targetLetter}
        rightValue={`${hudTimeSeconds}s`}
        leftToneClassName="bg-cyan-100/90 text-cyan-700"
        rightToneClassName="bg-amber-100/90 text-amber-700"
      />

      <div className="flex-1 app-scroll overflow-y-auto px-4 pb-safe pt-4">
        {phase === "select" && (
          <MiniGameLevelSelectPanel
            title={bubbleConfig.title ?? "Chọn mức độ"}
            description={bubbleConfig.instruction ?? ""}
            levels={levelSelectCards}
            recentlyUnlockedLevelId={recentlyUnlockedLevelId}
            onSelectLevel={(levelId) =>
              startLevelCountdown(levelId as BubblePopLevelId)
            }
            onUnlockLevel={(levelId) =>
              handleUnlockLevel(levelId as BubblePopLevelId)
            }
            onRulesAction={() => setShowRulesModal(true)}
          />
        )}

        {phase === "countdown" && (
          <MiniGameCountdown
            value={countdownValue}
            hint={
              <p className="text-lg font-semibold text-foreground">
                Hãy chạm vào bóng bay chữ{" "}
                <span className="font-hp-special text-3xl font-black lowercase text-emerald-600">
                  &quot;{targetLetter}&quot;
                </span>
              </p>
            }
          />
        )}

        {phase === "playing" && selectedLevel && (
          <div className="mx-auto flex w-full max-w-md flex-col pb-6">
            <motion.div
              animate={isShaking ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <div
                ref={playfieldRef}
                className="relative h-[58dvh] min-h-105 w-full overflow-hidden rounded-3xl border-4 border-cyan-200 bg-linear-to-b from-cyan-100 via-sky-100 to-blue-200 shadow-lg"
              >
                <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-2xl bg-white/65 px-2.5 py-1.5 shadow-sm">
                  {[...Array(bubbleConfig.startLives)].map((_, lifeIndex) => (
                    <Heart
                      key={`life-${lifeIndex}`}
                      className={`h-5 w-5 ${
                        lifeIndex < lives
                          ? "fill-rose-400 text-rose-400"
                          : "fill-slate-200 text-slate-300"
                      }`}
                    />
                  ))}
                </div>

                {[...Array(Math.max(0, bubbleConfig.laneCount - 1))].map(
                  (_, laneIndex) => (
                    <div
                      key={`lane-${laneIndex}`}
                      className="pointer-events-none absolute inset-y-0 w-px bg-white/50"
                      style={{
                        left: `${((laneIndex + 1) / bubbleConfig.laneCount) * 100}%`,
                      }}
                    />
                  ),
                )}

                {bubbles.map((bubble) => {
                  const isTarget = bubble.kind === "target";
                  const isWrong = bubble.kind === "wrong";
                  const letterFontSize = Math.max(
                    30,
                    Math.round(bubble.size * 0.38),
                  );
                  return (
                    <motion.button
                      key={bubble.id}
                      onClick={() => handleBubbleTap(bubble.id)}
                      className={`absolute flex items-center justify-center overflow-visible rounded-full border-2 shadow-md transition active:scale-95 ${
                        isTarget
                          ? "border-emerald-500 bg-linear-to-b from-emerald-200 via-emerald-300 to-emerald-500 text-emerald-950"
                          : isWrong
                            ? "border-orange-500 bg-linear-to-b from-amber-200 via-orange-300 to-orange-500 text-orange-950"
                            : "border-cyan-400 bg-linear-to-b from-white via-cyan-50 to-cyan-200 text-cyan-700"
                      }`}
                      style={{
                        width: bubble.size,
                        height: bubble.size,
                        left: bubble.x - bubble.size / 2,
                        top: bubble.y - bubble.size / 2,
                      }}
                      aria-label={
                        bubble.letter
                          ? `Bóng bay chữ ${bubble.letter}`
                          : "Bóng bay trống"
                      }
                    >
                    <span className="pointer-events-none absolute left-[26%] top-[16%] h-[22%] w-[28%] rounded-full bg-white/65 blur-[0.3px]" />
                    <span
                      className={`pointer-events-none absolute left-1/2 top-[95%] h-[14%] w-[12%] -translate-x-1/2 rotate-45 rounded-[3px] ${
                        isTarget
                          ? "bg-emerald-700/55"
                          : isWrong
                            ? "bg-orange-700/55"
                            : "bg-cyan-700/45"
                      }`}
                    />
                    <span className="pointer-events-none absolute left-1/2 top-[108%] h-[25%] w-px -translate-x-1/2 bg-slate-500/60" />
                    <span
                      className="relative translate-y-[8%] select-none font-hp-special font-black lowercase leading-[1.08]"
                      style={{ fontSize: letterFontSize }}
                    >
                      {bubble.letter}
                    </span>
                  </motion.button>
                );
              })}

                <AnimatePresence>
                  {bubbleBursts.map((burst) => (
                    <div key={burst.id} className="pointer-events-none absolute inset-0">
                      <motion.span
                        initial={{ opacity: 0.88, scale: 1 }}
                        animate={{ opacity: 0, scale: 0.24 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: "easeIn" }}
                        className="absolute rounded-full border-[3px] border-emerald-500/75 bg-emerald-300/60"
                        style={{
                          width: burst.size,
                          height: burst.size,
                          left: burst.x - burst.size / 2,
                          top: burst.y - burst.size / 2,
                        }}
                      />
                      <motion.span
                        initial={{ opacity: 0.9, scale: 0.75 }}
                        animate={{ opacity: 0, scale: 1.45 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.34, ease: "easeOut" }}
                        className="absolute rounded-full border-[3px] border-emerald-300/85 bg-white/25"
                        style={{
                          width: burst.size * 0.95,
                          height: burst.size * 0.95,
                          left: burst.x - (burst.size * 0.95) / 2,
                          top: burst.y - (burst.size * 0.95) / 2,
                        }}
                      />
                      <motion.span
                        initial={{ opacity: 0.85, scale: 0.25 }}
                        animate={{ opacity: 0, scale: 1.1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        className="absolute rounded-full bg-white/95"
                        style={{
                          width: burst.size * 0.28,
                          height: burst.size * 0.28,
                          left: burst.x - (burst.size * 0.28) / 2,
                          top: burst.y - (burst.size * 0.28) / 2,
                        }}
                      />
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((shardIndex) => {
                        const angle = (Math.PI * 2 * shardIndex) / 10;
                        const distanceFactor = 0.32 + (shardIndex % 3) * 0.08;
                        const dx = Math.cos(angle) * (burst.size * distanceFactor);
                        const dy = Math.sin(angle) * (burst.size * distanceFactor);
                        const shardWidth = shardIndex % 2 === 0 ? 3.2 : 2.4;
                        const shardHeight = shardIndex % 2 === 0 ? 10 : 7;
                        return (
                          <motion.span
                            key={`${burst.id}-shard-${shardIndex}`}
                            initial={{
                              opacity: 0.95,
                              x: burst.x,
                              y: burst.y,
                              scale: 0.9,
                              rotate: (angle * 180) / Math.PI,
                            }}
                            animate={{
                              opacity: 0,
                              x: burst.x + dx,
                              y: burst.y + dy,
                              scale: 0.15,
                              rotate: (angle * 180) / Math.PI + 28,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.32, ease: "easeOut" }}
                            className="absolute border border-emerald-500/70 bg-emerald-200/95 shadow-[0_0_6px_rgba(167,243,208,0.8)]"
                            style={{
                              width: shardWidth,
                              height: shardHeight,
                              borderRadius: "70% 70% 55% 55%",
                              transform: "translate(-50%, -50%)",
                            }}
                          />
                        );
                      })}
                      <motion.span
                        initial={{
                          opacity: 0.95,
                          x: burst.x,
                          y: burst.y + burst.size * 0.15,
                          scale: 1,
                        }}
                        animate={{
                          opacity: 0,
                          x: burst.x + burst.size * 0.04,
                          y: burst.y + burst.size * 0.4,
                          scale: 0.6,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.32, ease: "easeOut" }}
                        className="absolute rounded-lg border border-emerald-600/70 bg-emerald-500/90"
                        style={{
                          width: burst.size * 0.12,
                          height: burst.size * 0.08,
                          transform: "translate(-50%, -50%) rotate(25deg)",
                        }}
                      />
                    </div>
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {floatingPopups.map((popup) => (
                    <motion.span
                      key={popup.id}
                      initial={{ opacity: 1, y: 0, scale: 0.9 }}
                      animate={{ opacity: 0, y: -26, scale: 1.1 }}
                      exit={{ opacity: 0 }}
                      className={`pointer-events-none absolute text-lg font-bold ${
                        popup.tone === "good"
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                      style={{ left: popup.x - 16, top: popup.y - 16 }}
                    >
                      {popup.label}
                    </motion.span>
                  ))}
                </AnimatePresence>

                <AnimatePresence>
                  {showDamageFlash && (
                    <motion.div
                      key="bubble-damage-flash"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute inset-0 bg-rose-400/20"
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      <MiniGameRulesModal
        open={showRulesModal}
        rules={bubbleConfig.rules}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}
