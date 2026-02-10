"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  Flame,
  Heart,
  Lock,
  Sparkles,
  Star,
  Volume2,
} from "lucide-react";
import type {
  BubblePopLevelConfig,
  BubblePopLevelId,
  LessonContent,
} from "@/data/game-config";
import {
  getStoredFloorProgress,
  saveFloorProgress,
} from "@/lib/floor-progress";
import { Mascot } from "@/components/beto-mascot";
import {
  BrokenHeartCelebration,
  StarCelebration,
  SuccessCelebrationOverlay,
} from "@/components/celebrations";
import { LessonCompletionView } from "@/components/completion";
import { GameButton } from "@/screens/lesson-interface/components";

const LEVEL_ORDER: BubblePopLevelId[] = ["easy", "normal", "hard"];
const LEVEL_LABEL: Record<BubblePopLevelId, string> = {
  easy: "Dễ",
  normal: "Vừa",
  hard: "Khó",
};
const LEVEL_COLOR: Record<BubblePopLevelId, string> = {
  easy: "from-emerald-300 to-emerald-500",
  normal: "from-amber-300 to-orange-500",
  hard: "from-rose-300 to-rose-500",
};
const LEVEL_ICON_BG: Record<BubblePopLevelId, string> = {
  easy: "from-emerald-100 to-cyan-100",
  normal: "from-amber-100 to-orange-100",
  hard: "from-rose-100 to-fuchsia-100",
};
const LEVEL_ICON_COLOR: Record<BubblePopLevelId, string> = {
  easy: "text-emerald-700",
  normal: "text-orange-700",
  hard: "text-rose-700",
};
const PASS_EFFECT_HOLD_MS = 2200;
const FAIL_EFFECT_HOLD_MS = 2200;
const TARGET_BUBBLE_HIT_AUDIO = "/assets/audio/game/bubble-pop/pop.mp3";
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

interface Floor4BubbleChallengeProps {
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

export function Floor4BubbleChallenge({
  worldId,
  towerId,
  floorId,
  floorName,
  floorMaxStars,
  lesson,
  onBack,
}: Floor4BubbleChallengeProps) {
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
  const [didPass, setDidPass] = useState<boolean | null>(null);
  const [lastEarnedStars, setLastEarnedStars] = useState(0);
  const [passCelebrationStars, setPassCelebrationStars] = useState(0);
  const [showFailCelebration, setShowFailCelebration] = useState(false);
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
  const passSequenceRef = useRef(false);
  const runningRef = useRef(false);
  const bubbleIdRef = useRef(1);
  const popupIdRef = useRef(1);
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
      if (levelId === "easy") return true;
      if (levelId === "normal") return levelStars.easy > 0;
      return levelStars.normal > 0;
    },
    [levelStars.easy, levelStars.normal],
  );

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

  const finalizeLevel = useCallback(
    (passed: boolean, level: BubblePopLevelConfig) => {
      clearCelebrations();
      stopGameLoop();
      setPhase("result");
      setDidPass(passed);
      const earnedStars = passed ? level.starsReward : 0;
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
      stopGameLoop();
      setShowFailCelebration(false);
      setPassCelebrationStars(level.starsReward);

      if (passCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(passCelebrationTimeoutRef.current);
      }
      passCelebrationTimeoutRef.current = window.setTimeout(() => {
        passCelebrationTimeoutRef.current = null;
        setPassCelebrationStars(0);
        passSequenceRef.current = false;
        finalizeLevel(true, level);
      }, PASS_EFFECT_HOLD_MS);
    },
    [finalizeLevel, stopGameLoop],
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
            scoreRef.current = Math.max(0, scoreRef.current - 1);
            enqueuePopup(bubble.x, 32, "-1", "bad");
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
    setPhase("playing");
    setFloatingPopups([]);
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

    animationFrameRef.current = window.requestAnimationFrame(
      frameLoopRef.current,
    );
  }, [
    bubbleConfig,
    clearCelebrations,
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
      const beginCountdown = () => {
        stopGameLoop();
        clearCelebrations();
        const nextTargetLetter = pickRandomTargetLetter();
        setSelectedLevelId(levelId);
        setTargetLetter(nextTargetLetter);
        setDidPass(null);
        setLastEarnedStars(0);
        setCountdownValue(3);
        targetLetterRef.current = nextTargetLetter;
        const targetAudioKey = nextTargetLetter.toLocaleLowerCase("vi-VN");
        playNarration(bubbleConfig?.targetAudioByLetter?.[targetAudioKey]);
        setPhase("countdown");
      };

      if (pendingUnlockLevelId === levelId) {
        setRecentlyUnlockedLevelId(levelId);
        setPendingUnlockLevelId(null);
        if (unlockAnimationTimeoutRef.current !== null) {
          window.clearTimeout(unlockAnimationTimeoutRef.current);
        }
        unlockAnimationTimeoutRef.current = window.setTimeout(() => {
          unlockAnimationTimeoutRef.current = null;
          setRecentlyUnlockedLevelId(null);
          beginCountdown();
        }, 920);
        return;
      }

      beginCountdown();
    },
    [
      clearCelebrations,
      isLevelUnlocked,
      levelMap,
      pendingUnlockLevelId,
      pickRandomTargetLetter,
      playNarration,
      stopGameLoop,
      bubbleConfig,
    ],
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
        enqueuePopup(bubble.x, bubble.y, "+1", "good");
      } else if (bubble.kind === "wrong") {
        livesRef.current = Math.max(0, livesRef.current - 1);
        playTapFeedbackAudio("wrong");
        enqueuePopup(bubble.x, bubble.y, "-1❤", "bad");
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
      enqueuePopup,
      phase,
      playTapFeedbackAudio,
      triggerLevelFail,
      triggerLevelPass,
    ],
  );

  const replayRulesAudio = useCallback(() => {
    if (!bubbleConfig) return;
    playNarration(bubbleConfig.rulesAudio);
  }, [bubbleConfig, playNarration]);

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
      if (passCelebrationTimeoutRef.current !== null) {
        window.clearTimeout(passCelebrationTimeoutRef.current);
        passCelebrationTimeoutRef.current = null;
      }
      if (unlockAnimationTimeoutRef.current !== null) {
        window.clearTimeout(unlockAnimationTimeoutRef.current);
        unlockAnimationTimeoutRef.current = null;
      }
    };
  }, [stopGameLoop, stopNarration]);

  if (!bubbleConfig || levelList.length === 0) {
    return (
      <div className="relative flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-center text-foreground">
          Chưa có dữ liệu mini game cho tầng này.
        </p>
        <GameButton
          onClick={onBack}
          className="rounded-2xl"
          frontClassName="px-5 py-2 text-sm"
        >
          Quay Lại
        </GameButton>
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

      <div className="sticky top-0 z-20 bg-white/90 shadow-sm backdrop-blur-md pt-safe pl-safe pr-safe">
        <div className="flex items-center gap-3 px-4 pb-4 pt-3">
          <motion.button
            onClick={onBack}
            className="rounded-2xl bg-green-bright p-3 text-white shadow-lg ios-button"
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            whileTap={{ scale: 0.95 }}
            aria-label="Quay lại chọn tầng"
          >
            <ChevronLeft className="h-6 w-6" />
          </motion.button>
          <motion.div
            className="min-w-0 flex-1 pr-1"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut", delay: 0.06 }}
          >
            <h1 className="text-[1.7rem] font-bold leading-[1.3] text-foreground font-hp-special">
              {challengeHeaderTitle}
            </h1>
          </motion.div>
          <motion.div
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: "easeOut", delay: 0.1 }}
          >
            <Mascot
              size="sm"
              emotion={
                phase === "playing"
                  ? "excited"
                  : didPass === false
                    ? "thinking"
                    : "happy"
              }
            />
          </motion.div>
        </div>
      </div>

      <div className="flex-1 app-scroll overflow-y-auto px-4 pb-safe pt-4">
        {phase === "select" && (
          <div className="mx-auto flex w-full max-w-md flex-col gap-4 pb-6">
            <motion.div
              className="relative overflow-hidden rounded-4xl border-4 border-cyan-200 bg-linear-to-b from-cyan-50 via-white to-emerald-50 p-5 shadow-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            >
              <motion.div
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-200/70"
                animate={{ y: [0, -6, 0] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="pointer-events-none absolute bottom-3 right-8 h-10 w-10 rounded-full bg-pink-200/70"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="pointer-events-none absolute -bottom-9 -left-7 h-24 w-24 rounded-full bg-emerald-200/70"
                animate={{ y: [0, -5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              />
              <p className="relative mb-1 text-2xl font-black text-foreground font-hp-special">
                {bubbleConfig.title ?? "Chọn mức độ"}
              </p>
              <p className="relative text-sm text-muted-foreground">
                {bubbleConfig.instruction}
              </p>
              <div className="relative mt-3">
                <GameButton
                  onClick={replayRulesAudio}
                  className="rounded-2xl"
                  frontClassName="px-4 py-2 text-sm flex items-center gap-2"
                >
                  <Volume2 className="h-4 w-4" /> Nghe Luật
                </GameButton>
              </div>
            </motion.div>

            <div className="relative space-y-3">
              <motion.span
                className="pointer-events-none absolute -left-2 top-4 h-6 w-6 rounded-full bg-cyan-200/60"
                animate={{ y: [0, -4, 0], x: [0, 2, 0] }}
                transition={{
                  duration: 2.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.span
                className="pointer-events-none absolute right-1 top-20 h-5 w-5 rounded-full bg-amber-200/70"
                animate={{ y: [0, -3, 0], x: [0, -2, 0] }}
                transition={{
                  duration: 2.7,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {LEVEL_ORDER.map((levelId, levelIndex) => {
                const level = levelMap.get(levelId);
                if (!level) return null;
                const unlocked = isLevelUnlocked(levelId);
                const earnedStars = levelStars[levelId];
                const isRecentlyUnlocked = recentlyUnlockedLevelId === level.id;

                return (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.32,
                      ease: "easeOut",
                      delay: 0.1 + levelIndex * 0.08,
                    }}
                  >
                    <motion.button
                      onClick={() => startLevelCountdown(level.id)}
                      disabled={!unlocked}
                      initial={false}
                      animate={
                        isRecentlyUnlocked
                          ? { scale: [1, 1.03, 1], y: [0, -2, 0] }
                          : { scale: 1, y: 0 }
                      }
                      transition={{
                        duration: isRecentlyUnlocked ? 0.7 : 0.2,
                        ease: "easeOut",
                      }}
                      className={`relative w-full overflow-hidden rounded-[1.75rem] border-2 p-1.5 text-left ios-button ${
                        unlocked
                          ? "border-cyan-300 bg-white shadow-lg"
                          : "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-500 grayscale"
                      }`}
                      whileTap={unlocked ? { scale: 0.95 } : {}}
                    >
                      <span
                        className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-r ${
                          unlocked
                            ? LEVEL_COLOR[level.id]
                            : "from-slate-300 to-slate-400"
                        } opacity-25`}
                      ></span>
                      <span className="relative flex items-center gap-3 rounded-[22px] px-4 py-3">
                        <span
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 ${
                            unlocked
                              ? "border-white/80 bg-white/80"
                              : "border-slate-300 bg-slate-300"
                          }`}
                        >
                          {unlocked ? (
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${LEVEL_ICON_BG[level.id]} ${LEVEL_ICON_COLOR[level.id]}`}
                            >
                              {level.id === "easy" ? (
                                <Heart className="h-5 w-5 fill-current" />
                              ) : level.id === "normal" ? (
                                <Sparkles className="h-5 w-5" />
                              ) : (
                                <Flame className="h-5 w-5" />
                              )}
                            </span>
                          ) : (
                            <Lock className="h-5 w-5 text-slate-600" />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-base font-bold ${
                              unlocked ? "text-slate-900" : "text-slate-500"
                            }`}
                          >
                            Mức {LEVEL_LABEL[level.id]}
                          </span>
                          <span
                            className={`block text-xs ${
                              unlocked ? "text-slate-600" : "text-slate-500"
                            }`}
                          >
                            {level.durationSeconds}s • {level.targetScore} điểm
                          </span>
                          <span className="mt-1.5 flex gap-0.5">
                            {[...Array(level.starsReward)].map(
                              (_, starIndex) => (
                                <Star
                                  key={`${level.id}-star-${starIndex}`}
                                  className={`h-3.5 w-3.5 ${
                                    starIndex < earnedStars
                                      ? "fill-yellow-300 text-yellow-300"
                                      : "fill-slate-200 text-slate-300"
                                  }`}
                                />
                              ),
                            )}
                          </span>
                        </span>

                        <span className="shrink-0">
                          {unlocked ? (
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Chơi
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-300 px-3 py-1 text-xs font-semibold text-slate-600">
                              Khóa
                            </span>
                          )}
                        </span>
                      </span>

                      <AnimatePresence>
                        {isRecentlyUnlocked && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.85 }}
                            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-400/25"
                          >
                            <motion.span
                              initial={{ y: 8, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -8, opacity: 0 }}
                              className="flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-emerald-700 shadow-lg"
                            >
                              <Sparkles className="h-4 w-4" />
                              Mở khóa!
                            </motion.span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {phase === "countdown" && (
          <div className="mx-auto flex h-[62dvh] w-full max-w-md flex-col items-center justify-center">
            <motion.div
              key={countdownValue}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="text-[7rem] font-black leading-none text-emerald-500"
            >
              {countdownValue}
            </motion.div>
            <p className="mt-3 text-lg font-semibold text-foreground">
              Hãy chạm vào bóng bay chữ{" "}
              <span className="font-hp-special text-3xl font-black lowercase text-emerald-600">
                &quot;{targetLetter}&quot;
              </span>
            </p>
          </div>
        )}

        {phase === "playing" && selectedLevel && (
          <div className="mx-auto flex w-full max-w-md flex-col pb-6">
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl border-2 border-sky-200 bg-white/90 p-3 shadow-sm">
              <div>
                <p className="text-xs text-muted-foreground">Yêu cầu</p>
                <p className="text-sm font-semibold text-foreground">
                  Chạm vào bóng bay{" "}
                  <span className="font-hp-special text-3xl font-black lowercase leading-none text-emerald-600">
                    &quot;{targetLetter}&quot;
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Điểm</p>
                <p className="text-base font-bold text-foreground">
                  {score}/{selectedLevel.targetScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tim</p>
                <div className="mt-1 flex items-center gap-1">
                  {[...Array(bubbleConfig.startLives)].map((_, lifeIndex) => (
                    <Heart
                      key={`life-${lifeIndex}`}
                      className={`h-5 w-5 ${
                        lifeIndex < lives
                          ? "fill-rose-400 text-rose-400"
                          : "fill-gray-200 text-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Thời gian</p>
                <p className="text-base font-bold text-foreground">
                  {Math.max(0, Math.ceil(timeLeft))}s
                </p>
              </div>
            </div>

            <div
              ref={playfieldRef}
              className="relative h-[58dvh] min-h-105 w-full overflow-hidden rounded-3xl border-4 border-cyan-200 bg-linear-to-b from-cyan-100 via-sky-100 to-blue-200 shadow-lg"
            >
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
                      className="relative select-none font-hp-special font-black lowercase leading-none"
                      style={{ fontSize: letterFontSize }}
                    >
                      {bubble.letter}
                    </span>
                  </motion.button>
                );
              })}

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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
