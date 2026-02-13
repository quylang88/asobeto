"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Hand, Heart, Sparkles, Volume2 } from "lucide-react";
import type {
  ChallengePassStarRule,
  DiacriticBuildLevelConfig,
  DiacriticBuildLevelId,
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
import { PrimaryButton } from "@/components/common/primary-button";
import { MiniGameLevelSelectPanel } from "@/components/minigame/level-select-panel";
import { MiniGameCountdown } from "@/components/minigame/shared-countdown";

const LEVEL_ORDER: DiacriticBuildLevelId[] = ["easy", "normal", "hard"];
const LEVEL_LABEL: Record<DiacriticBuildLevelId, string> = {
  easy: "Dễ",
  normal: "Vừa",
  hard: "Khó",
};
const PASS_EFFECT_HOLD_MS = 2200;
const FAIL_EFFECT_HOLD_MS = 2200;
const CORRECT_TAP_AUDIO = "/assets/audio/game/bubble-pop/pop.mp3";
const WRONG_TAP_AUDIO = "/assets/audio/feedback/wrong-answer.mp3";
const PASS_AUDIO = "/assets/audio/feedback/success-answer.mp3";
const FAIL_AUDIO = "/assets/audio/feedback/wrong-answer.mp3";

type ChallengePhase = "select" | "countdown" | "playing" | "result";
type FallingKind = "marker" | "debris";
type TutorialCue = "drop" | "tap" | "fly";

interface FallingEntity {
  id: number;
  lane: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  kind: FallingKind;
  symbol: string;
}

interface FlyingMarker {
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

interface Floor4DiacriticBuildChallengeProps {
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

interface TutorialState {
  hasSeen: boolean;
  failedAttemptsSinceTutorial: number;
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
  rule: ChallengePassStarRule;
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

function getLevelStorageKey(
  lessonId: string,
  levelId: DiacriticBuildLevelId,
): string {
  return `${lessonId}:${levelId}`;
}

function getTutorialStorageKey(lessonId: string): string {
  return `${lessonId}:tutorial`;
}

function sumStars(stars: Record<DiacriticBuildLevelId, number>): number {
  return stars.easy + stars.normal + stars.hard;
}

function getNextLevelId(
  levelId: DiacriticBuildLevelId,
): DiacriticBuildLevelId | null {
  const levelIndex = LEVEL_ORDER.indexOf(levelId);
  if (levelIndex < 0 || levelIndex >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[levelIndex + 1];
}

function isLevelUnlockedByStars(
  levelId: DiacriticBuildLevelId,
  stars: Record<DiacriticBuildLevelId, number>,
): boolean {
  if (levelId === "easy") return true;
  if (levelId === "normal") return stars.easy > 0;
  return stars.normal > 0;
}

function readTutorialState(lessonId: string): TutorialState {
  if (typeof window === "undefined") {
    return {
      hasSeen: false,
      failedAttemptsSinceTutorial: 0,
    };
  }

  const raw = window.localStorage.getItem(getTutorialStorageKey(lessonId));
  if (!raw) {
    return {
      hasSeen: false,
      failedAttemptsSinceTutorial: 0,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TutorialState>;
    return {
      hasSeen: Boolean(parsed.hasSeen),
      failedAttemptsSinceTutorial: clampInteger(
        parsed.failedAttemptsSinceTutorial ?? 0,
        0,
        1000,
      ),
    };
  } catch {
    return {
      hasSeen: false,
      failedAttemptsSinceTutorial: 0,
    };
  }
}

function writeTutorialState(lessonId: string, state: TutorialState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getTutorialStorageKey(lessonId),
    JSON.stringify(state),
  );
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
}): Record<DiacriticBuildLevelId, number> {
  const emptyStars: Record<DiacriticBuildLevelId, number> = {
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

function playAudio(src: string): void {
  const audio = new Audio(src);
  audio.play().catch(() => undefined);
}

function speakRulesText(text: string): void {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "vi-VN";
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function Floor4DiacriticBuildChallenge({
  worldId,
  towerId,
  floorId,
  floorName,
  floorMaxStars,
  lesson,
  onBack,
}: Floor4DiacriticBuildChallengeProps) {
  const diacriticConfig = lesson.diacriticBuildGame;
  const levelList = useMemo(
    () => diacriticConfig?.levels ?? [],
    [diacriticConfig],
  );
  const levelMap = useMemo(
    () => new Map(levelList.map((level) => [level.id, level])),
    [levelList],
  );
  const footerRatio = diacriticConfig?.playfieldFooterRatio ?? 0.24;
  const footerPercent = Math.round(footerRatio * 100);

  const [phase, setPhase] = useState<ChallengePhase>("select");
  const [selectedLevelId, setSelectedLevelId] =
    useState<DiacriticBuildLevelId | null>("easy");
  const [countdownValue, setCountdownValue] = useState(3);
  const [progressCount, setProgressCount] = useState(0);
  const [lives, setLives] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [fallingEntities, setFallingEntities] = useState<FallingEntity[]>([]);
  const [flyingMarkers, setFlyingMarkers] = useState<FlyingMarker[]>([]);
  const [displayLetter, setDisplayLetter] = useState(
    diacriticConfig?.baseLetter ?? "a",
  );
  const [didPass, setDidPass] = useState<boolean | null>(null);
  const [lastEarnedStars, setLastEarnedStars] = useState(0);
  const [passCelebrationStars, setPassCelebrationStars] = useState(0);
  const [showFailCelebration, setShowFailCelebration] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialCue, setTutorialCue] = useState<TutorialCue>("drop");
  const [showDamageFlash, setShowDamageFlash] = useState(false);
  const [showSlotPulse, setShowSlotPulse] = useState(false);
  const [showSparkleBurst, setShowSparkleBurst] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [letterPulseKey, setLetterPulseKey] = useState(0);
  const [playfieldMetrics, setPlayfieldMetrics] = useState({
    width: 360,
    height: 520,
    fallZoneHeight: 380,
    slotCenterX: 180,
    slotCenterY: 420,
  });
  const [recentlyUnlockedLevelId, setRecentlyUnlockedLevelId] =
    useState<DiacriticBuildLevelId | null>(null);
  const [pendingUnlockLevelId, setPendingUnlockLevelId] =
    useState<DiacriticBuildLevelId | null>(null);
  const [levelStars, setLevelStars] = useState<
    Record<DiacriticBuildLevelId, number>
  >(() =>
    getInitialLevelStars({
      worldId,
      towerId,
      floorId,
      floorMaxStars,
      lessonId: lesson.id,
    }),
  );

  const selectedLevel = selectedLevelId
    ? (levelMap.get(selectedLevelId) ?? null)
    : null;
  const challengeHeaderTitle = diacriticConfig?.headerTitle?.trim() || floorName;

  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const slotRef = useRef<HTMLDivElement | null>(null);
  const playfieldSizeRef = useRef({ width: 360, height: 520 });
  const fallZoneHeightRef = useRef(380);
  const animationFrameRef = useRef<number | null>(null);
  const frameLoopRef = useRef<(timestamp: number) => void>(() => {});
  const lastFrameAtRef = useRef(0);
  const runningRef = useRef(false);
  const passSequenceRef = useRef(false);
  const spawnCooldownMsRef = useRef(0);
  const entityIdRef = useRef(1);
  const flightIdRef = useRef(1);
  const fallingEntitiesRef = useRef<FallingEntity[]>([]);
  const progressRef = useRef(0);
  const livesRef = useRef(0);
  const timeLeftRef = useRef(0);
  const currentLevelRef = useRef<DiacriticBuildLevelConfig | null>(null);
  const consecutiveDebrisRef = useRef(0);
  const tutorialActiveRef = useRef(false);

  const passCelebrationTimeoutRef = useRef<number | null>(null);
  const morphResetTimeoutRef = useRef<number | null>(null);
  const unlockAnimationTimeoutRef = useRef<number | null>(null);
  const damageFlashTimeoutRef = useRef<number | null>(null);
  const slotPulseTimeoutRef = useRef<number | null>(null);
  const sparkleTimeoutRef = useRef<number | null>(null);
  const shakeTimeoutRef = useRef<number | null>(null);
  const tutorialTimeoutsRef = useRef<number[]>([]);

  const isLevelUnlocked = useCallback(
    (levelId: DiacriticBuildLevelId) => {
      if (levelId === "easy") return true;
      if (levelId === "normal") return levelStars.easy > 0;
      return levelStars.normal > 0;
    },
    [levelStars.easy, levelStars.normal],
  );

  const clearTimeoutRef = useCallback((ref: { current: number | null }) => {
    if (ref.current === null) return;
    window.clearTimeout(ref.current);
    ref.current = null;
  }, []);

  const resetVisualFeedback = useCallback(() => {
    clearTimeoutRef(damageFlashTimeoutRef);
    clearTimeoutRef(slotPulseTimeoutRef);
    clearTimeoutRef(sparkleTimeoutRef);
    clearTimeoutRef(shakeTimeoutRef);
    setShowDamageFlash(false);
    setShowSlotPulse(false);
    setShowSparkleBurst(false);
    setIsShaking(false);
  }, [clearTimeoutRef]);

  const clearTutorialSequence = useCallback(() => {
    tutorialTimeoutsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    tutorialTimeoutsRef.current = [];
    tutorialActiveRef.current = false;
    setTutorialActive(false);
    setTutorialCue("drop");
  }, []);

  const stopGameLoop = useCallback(() => {
    runningRef.current = false;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastFrameAtRef.current = 0;
  }, []);

  const clearCelebrations = useCallback(() => {
    passSequenceRef.current = false;
    setPassCelebrationStars(0);
    setShowFailCelebration(false);
    clearTimeoutRef(passCelebrationTimeoutRef);
  }, [clearTimeoutRef]);

  const persistProgress = useCallback(
    (nextLevelStars: Record<DiacriticBuildLevelId, number>) => {
      const normalized: Record<DiacriticBuildLevelId, number> = {
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

  const updateTutorialFailState = useCallback(
    (levelId: DiacriticBuildLevelId, passed: boolean) => {
      if (!diacriticConfig?.tutorial) return;
      if (levelId !== diacriticConfig.tutorial.enabledLevelId) return;

      const current = readTutorialState(lesson.id);
      writeTutorialState(lesson.id, {
        hasSeen: true,
        failedAttemptsSinceTutorial: passed
          ? 0
          : current.failedAttemptsSinceTutorial + 1,
      });
    },
    [diacriticConfig, lesson.id],
  );

  const getEarnedStarsOnPass = useCallback(
    (level: DiacriticBuildLevelConfig): number => {
      if (!level.passStarRules?.length) return level.starsReward;
      const livesLost = Math.max(0, level.startLives - livesRef.current);
      const timeLeft = timeLeftRef.current;

      for (const rule of level.passStarRules) {
        if (!doesPassStarRuleMatch({ rule, livesLost, timeLeft })) continue;
        return clampInteger(rule.stars, 1, level.starsReward);
      }

      return level.starsReward;
    },
    [],
  );

  const finalizeLevel = useCallback(
    (
      passed: boolean,
      level: DiacriticBuildLevelConfig,
      computedStars?: number,
    ) => {
      clearCelebrations();
      stopGameLoop();
      setPhase("result");
      setDidPass(passed);
      const earnedStars = passed
        ? clampInteger(computedStars ?? level.starsReward, 1, level.starsReward)
        : 0;
      setLastEarnedStars(earnedStars);
      setFallingEntities([]);
      fallingEntitiesRef.current = [];
      setFlyingMarkers([]);
      clearTimeoutRef(morphResetTimeoutRef);
      setDisplayLetter(diacriticConfig?.baseLetter ?? "a");
      updateTutorialFailState(level.id, passed);

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
    [
      clearCelebrations,
      clearTimeoutRef,
      diacriticConfig?.baseLetter,
      persistProgress,
      stopGameLoop,
      updateTutorialFailState,
    ],
  );

  const triggerLevelPass = useCallback(
    (level: DiacriticBuildLevelConfig) => {
      if (passSequenceRef.current) return;
      passSequenceRef.current = true;
      const earnedStars = getEarnedStarsOnPass(level);
      stopGameLoop();
      playAudio(PASS_AUDIO);
      setShowFailCelebration(false);
      setPassCelebrationStars(earnedStars);

      clearTimeoutRef(passCelebrationTimeoutRef);
      passCelebrationTimeoutRef.current = window.setTimeout(() => {
        passCelebrationTimeoutRef.current = null;
        setPassCelebrationStars(0);
        passSequenceRef.current = false;
        finalizeLevel(true, level, earnedStars);
      }, PASS_EFFECT_HOLD_MS);
    },
    [clearTimeoutRef, finalizeLevel, getEarnedStarsOnPass, stopGameLoop],
  );

  const triggerLevelFail = useCallback(
    (level: DiacriticBuildLevelConfig) => {
      if (passSequenceRef.current) return;
      passSequenceRef.current = true;
      stopGameLoop();
      playAudio(FAIL_AUDIO);
      setPassCelebrationStars(0);
      setShowFailCelebration(true);

      clearTimeoutRef(passCelebrationTimeoutRef);
      passCelebrationTimeoutRef.current = window.setTimeout(() => {
        passCelebrationTimeoutRef.current = null;
        setShowFailCelebration(false);
        passSequenceRef.current = false;
        finalizeLevel(false, level);
      }, FAIL_EFFECT_HOLD_MS);
    },
    [clearTimeoutRef, finalizeLevel, stopGameLoop],
  );

  const getSlotCenter = useCallback((): { x: number; y: number } => {
    const playfield = playfieldRef.current;
    const slot = slotRef.current;
    if (playfield && slot) {
      const playfieldRect = playfield.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      return {
        x: slotRect.left - playfieldRect.left + slotRect.width / 2,
        y: slotRect.top - playfieldRect.top + slotRect.height / 2,
      };
    }

    const width = playfieldSizeRef.current.width;
    const height = playfieldSizeRef.current.height;
    const fallZoneHeight = fallZoneHeightRef.current;
    return {
      x: width / 2,
      y: fallZoneHeight + (height - fallZoneHeight) * 0.24,
    };
  }, []);

  const createFallingEntity = useCallback(
    (level: DiacriticBuildLevelConfig): FallingEntity | null => {
      if (!diacriticConfig) return null;

      const laneCount = Math.max(1, diacriticConfig.laneCount);
      const lane = Math.floor(Math.random() * laneCount);
      const laneWidth = playfieldSizeRef.current.width / laneCount;
      const x = laneWidth * lane + laneWidth / 2;
      const size = Math.round(
        randomBetween(level.objectSize.min, level.objectSize.max),
      );
      const forceMarker =
        consecutiveDebrisRef.current >= level.maxConsecutiveDebris;
      const targetRatio = randomBetween(
        level.correctSpawnRatioRange.min,
        level.correctSpawnRatioRange.max,
      );
      const isMarker = forceMarker || Math.random() <= targetRatio;
      const debrisSymbols = diacriticConfig.debrisSymbols.length
        ? diacriticConfig.debrisSymbols
        : ["★"];
      const symbol = isMarker
        ? diacriticConfig.markerSymbol
        : debrisSymbols[Math.floor(Math.random() * debrisSymbols.length)];

      if (isMarker) {
        consecutiveDebrisRef.current = 0;
      } else {
        consecutiveDebrisRef.current += 1;
      }

      const fallDistance = fallZoneHeightRef.current + size * 1.4;
      const fallDuration = randomBetween(
        level.fallDurationSeconds.min,
        level.fallDurationSeconds.max,
      );
      const speed = fallDistance / Math.max(0.2, fallDuration);

      const entity: FallingEntity = {
        id: entityIdRef.current,
        lane,
        x,
        y: -size * 0.5,
        size,
        speed,
        kind: isMarker ? "marker" : "debris",
        symbol,
      };
      entityIdRef.current += 1;
      return entity;
    },
    [diacriticConfig],
  );

  const spawnEntity = useCallback(
    (level: DiacriticBuildLevelConfig) => {
      const entity = createFallingEntity(level);
      if (!entity) return;
      fallingEntitiesRef.current = [...fallingEntitiesRef.current, entity];
    },
    [createFallingEntity],
  );

  const runGameStep = useCallback(
    (deltaMs: number): boolean => {
      const level = currentLevelRef.current;
      if (!level) return true;
      if (tutorialActiveRef.current) return false;

      const deltaSeconds = deltaMs / 1000;
      timeLeftRef.current = Math.max(0, timeLeftRef.current - deltaSeconds);

      spawnCooldownMsRef.current -= deltaMs;
      while (spawnCooldownMsRef.current <= 0) {
        spawnEntity(level);
        spawnCooldownMsRef.current += randomBetween(
          level.spawnIntervalMs.min,
          level.spawnIntervalMs.max,
        );
      }

      const escapedThreshold = fallZoneHeightRef.current;
      const nextEntities: FallingEntity[] = [];

      for (const entity of fallingEntitiesRef.current) {
        const nextY = entity.y + entity.speed * deltaSeconds;
        const escaped = nextY - entity.size / 2 > escapedThreshold;
        if (escaped) {
          continue;
        }
        nextEntities.push({ ...entity, y: nextY });
      }
      fallingEntitiesRef.current = nextEntities;

      if (livesRef.current <= 0) {
        triggerLevelFail(level);
        return true;
      }

      if (progressRef.current >= level.targetCompletions) {
        triggerLevelPass(level);
        return true;
      }

      if (timeLeftRef.current <= 0) {
        triggerLevelFail(level);
        return true;
      }

      return false;
    },
    [spawnEntity, triggerLevelFail, triggerLevelPass],
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
      setFallingEntities([...fallingEntitiesRef.current]);
      setProgressCount(progressRef.current);
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

  const beginLiveRound = useCallback((level: DiacriticBuildLevelConfig) => {
    currentLevelRef.current = level;
    runningRef.current = true;
    spawnCooldownMsRef.current = 220;
    animationFrameRef.current = window.requestAnimationFrame(frameLoopRef.current);
  }, []);

  const triggerCaptureFeedback = useCallback(
    (level: DiacriticBuildLevelConfig) => {
      setShowSlotPulse(true);
      clearTimeoutRef(slotPulseTimeoutRef);
      slotPulseTimeoutRef.current = window.setTimeout(() => {
        slotPulseTimeoutRef.current = null;
        setShowSlotPulse(false);
      }, 220);

      setDisplayLetter(diacriticConfig?.targetLetter ?? "ă");
      setLetterPulseKey((key) => key + 1);
      setShowSparkleBurst(true);
      clearTimeoutRef(sparkleTimeoutRef);
      sparkleTimeoutRef.current = window.setTimeout(() => {
        sparkleTimeoutRef.current = null;
        setShowSparkleBurst(false);
      }, 520);

      clearTimeoutRef(morphResetTimeoutRef);
      morphResetTimeoutRef.current = window.setTimeout(() => {
        morphResetTimeoutRef.current = null;
        setDisplayLetter(diacriticConfig?.baseLetter ?? "a");
      }, randomBetween(level.morphResetDelayMs.min, level.morphResetDelayMs.max));
    },
    [clearTimeoutRef, diacriticConfig?.baseLetter, diacriticConfig?.targetLetter],
  );

  const handleMarkerCaptured = useCallback(() => {
    const level = currentLevelRef.current;
    if (!level) return;

    triggerCaptureFeedback(level);
    progressRef.current += 1;
    setProgressCount(progressRef.current);

    if (progressRef.current >= level.targetCompletions) {
      triggerLevelPass(level);
    }
  }, [triggerCaptureFeedback, triggerLevelPass]);

  const launchMarkerToSlot = useCallback(
    (entity: FallingEntity) => {
      const level = currentLevelRef.current;
      if (!level) return;
      const slotCenter = getSlotCenter();
      const startX = entity.x;
      const startY = entity.y;
      const endX = slotCenter.x;
      const endY = slotCenter.y;
      const midX = (startX + endX) / 2 + (startX > endX ? 20 : -20);
      const midY = Math.min(startY, endY) - 56;
      const flight: FlyingMarker = {
        id: flightIdRef.current,
        startX,
        startY,
        midX,
        midY,
        endX,
        endY,
        durationMs: randomBetween(level.slotFlightMs.min, level.slotFlightMs.max),
        symbol: entity.symbol,
      };
      flightIdRef.current += 1;
      setFlyingMarkers((current) => [...current, flight]);
    },
    [getSlotCenter],
  );

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

  const handleEntityTap = useCallback(
    (entityId: number) => {
      if (phase !== "playing") return;
      if (tutorialActiveRef.current) return;
      if (!runningRef.current) return;

      const entityIndex = fallingEntitiesRef.current.findIndex(
        (entity) => entity.id === entityId,
      );
      if (entityIndex < 0) return;

      const [entity] = fallingEntitiesRef.current.splice(entityIndex, 1);
      if (!entity) return;

      setFallingEntities([...fallingEntitiesRef.current]);

      if (entity.kind === "marker") {
        playAudio(CORRECT_TAP_AUDIO);
        launchMarkerToSlot(entity);
        return;
      }

      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      playAudio(WRONG_TAP_AUDIO);

      if ("vibrate" in navigator) {
        navigator.vibrate(45);
      }

      triggerDamageFeedback();
      const level = currentLevelRef.current;
      if (level && livesRef.current <= 0) {
        triggerLevelFail(level);
      }
    },
    [launchMarkerToSlot, phase, triggerDamageFeedback, triggerLevelFail],
  );

  const handleFlightComplete = useCallback(
    (flightId: number) => {
      setFlyingMarkers((current) => current.filter((flight) => flight.id !== flightId));
      handleMarkerCaptured();
    },
    [handleMarkerCaptured],
  );

  const shouldShowTutorialForLevel = useCallback(
    (levelId: DiacriticBuildLevelId): boolean => {
      if (!diacriticConfig?.tutorial) return false;
      if (levelId !== diacriticConfig.tutorial.enabledLevelId) return false;
      const tutorialState = readTutorialState(lesson.id);
      if (!tutorialState.hasSeen) return true;
      return (
        tutorialState.failedAttemptsSinceTutorial >=
        diacriticConfig.tutorial.replayAfterFailCount
      );
    },
    [diacriticConfig, lesson.id],
  );

  const markTutorialShown = useCallback(() => {
    if (!diacriticConfig?.tutorial) return;
    const current = readTutorialState(lesson.id);
    writeTutorialState(lesson.id, {
      hasSeen: true,
      failedAttemptsSinceTutorial: current.failedAttemptsSinceTutorial >=
        diacriticConfig.tutorial.replayAfterFailCount
        ? 0
        : current.failedAttemptsSinceTutorial,
    });
  }, [diacriticConfig, lesson.id]);

  const runTutorialSequence = useCallback(
    (level: DiacriticBuildLevelConfig) => {
      if (!diacriticConfig?.tutorial) {
        beginLiveRound(level);
        return;
      }

      clearTutorialSequence();
      tutorialActiveRef.current = true;
      setTutorialActive(true);
      setTutorialCue("drop");
      markTutorialShown();

      const tapTimeout = window.setTimeout(() => {
        setTutorialCue("tap");
      }, 1200);
      const flyTimeout = window.setTimeout(() => {
        setTutorialCue("fly");
      }, 1800);
      const morphTimeout = window.setTimeout(() => {
        triggerCaptureFeedback(level);
      }, 2200);
      const endTimeout = window.setTimeout(() => {
        tutorialActiveRef.current = false;
        setTutorialActive(false);
        setTutorialCue("drop");
        setShowSlotPulse(false);
        setShowSparkleBurst(false);
        setDisplayLetter(diacriticConfig.baseLetter);
        beginLiveRound(level);
      }, diacriticConfig.tutorial.durationMs);

      tutorialTimeoutsRef.current = [
        tapTimeout,
        flyTimeout,
        morphTimeout,
        endTimeout,
      ];
    },
    [
      beginLiveRound,
      clearTutorialSequence,
      diacriticConfig,
      markTutorialShown,
      triggerCaptureFeedback,
    ],
  );

  const startLevel = useCallback(
    (levelId: DiacriticBuildLevelId) => {
      if (!isLevelUnlocked(levelId)) return;
      const level = levelMap.get(levelId);
      if (!level || !diacriticConfig) return;

      stopGameLoop();
      clearCelebrations();
      clearTutorialSequence();
      resetVisualFeedback();
      clearTimeoutRef(morphResetTimeoutRef);

      setPhase("playing");
      setSelectedLevelId(level.id);
      setDidPass(null);
      setLastEarnedStars(0);
      setFlyingMarkers([]);
      setProgressCount(0);
      setLives(level.startLives);
      setTimeLeft(level.durationSeconds);
      setDisplayLetter(diacriticConfig.baseLetter);
      setLetterPulseKey((key) => key + 1);

      currentLevelRef.current = level;
      progressRef.current = 0;
      livesRef.current = level.startLives;
      timeLeftRef.current = level.durationSeconds;
      spawnCooldownMsRef.current = 220;
      entityIdRef.current = 1;
      flightIdRef.current = 1;
      consecutiveDebrisRef.current = 0;
      fallingEntitiesRef.current = [];
      setFallingEntities([]);

      if (shouldShowTutorialForLevel(level.id)) {
        runTutorialSequence(level);
      } else {
        beginLiveRound(level);
      }
    },
    [
      beginLiveRound,
      clearCelebrations,
      clearTimeoutRef,
      clearTutorialSequence,
      diacriticConfig,
      isLevelUnlocked,
      levelMap,
      resetVisualFeedback,
      runTutorialSequence,
      shouldShowTutorialForLevel,
      stopGameLoop,
    ],
  );

  const startLevelCountdown = useCallback(
    (levelId: DiacriticBuildLevelId) => {
      if (!isLevelUnlocked(levelId)) return;
      const level = levelMap.get(levelId);
      if (!level || !diacriticConfig) return;

      stopGameLoop();
      clearCelebrations();
      clearTutorialSequence();
      resetVisualFeedback();
      clearTimeoutRef(morphResetTimeoutRef);

      setSelectedLevelId(level.id);
      setDidPass(null);
      setLastEarnedStars(0);
      setCountdownValue(3);
      setFlyingMarkers([]);
      setFallingEntities([]);
      setProgressCount(0);
      setLives(level.startLives);
      setTimeLeft(level.durationSeconds);
      setDisplayLetter(diacriticConfig.baseLetter);
      setPhase("countdown");
    },
    [
      clearCelebrations,
      clearTimeoutRef,
      clearTutorialSequence,
      diacriticConfig,
      isLevelUnlocked,
      levelMap,
      resetVisualFeedback,
      stopGameLoop,
    ],
  );

  const startLevelWithUnlockAnimation = useCallback(
    (levelId: DiacriticBuildLevelId) => {
      if (!isLevelUnlocked(levelId)) return;
      if (pendingUnlockLevelId === levelId) {
        setRecentlyUnlockedLevelId(levelId);
        setPendingUnlockLevelId(null);
        clearTimeoutRef(unlockAnimationTimeoutRef);
        unlockAnimationTimeoutRef.current = window.setTimeout(() => {
          unlockAnimationTimeoutRef.current = null;
          setRecentlyUnlockedLevelId(null);
          startLevelCountdown(levelId);
        }, 880);
        return;
      }
      startLevelCountdown(levelId);
    },
    [
      clearTimeoutRef,
      isLevelUnlocked,
      pendingUnlockLevelId,
      startLevelCountdown,
    ],
  );

  useEffect(() => {
    if (phase !== "countdown") return;
    if (!selectedLevelId) return;

    const timeout = window.setTimeout(() => {
      if (countdownValue <= 1) {
        startLevel(selectedLevelId);
        return;
      }
      setCountdownValue((current) => current - 1);
    }, 900);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [countdownValue, phase, selectedLevelId, startLevel]);

  useEffect(() => {
    const playfield = playfieldRef.current;
    if (!playfield) return;

    const updateSize = () => {
      const rect = playfield.getBoundingClientRect();
      const fallZoneHeight = rect.height * (1 - footerRatio);
      const slotRect = slotRef.current?.getBoundingClientRect();
      const slotCenterX =
        slotRect && playfield
          ? slotRect.left - rect.left + slotRect.width / 2
          : rect.width / 2;
      const slotCenterY =
        slotRect && playfield
          ? slotRect.top - rect.top + slotRect.height / 2
          : fallZoneHeight + (rect.height - fallZoneHeight) * 0.24;
      playfieldSizeRef.current = {
        width: rect.width,
        height: rect.height,
      };
      fallZoneHeightRef.current = fallZoneHeight;
      setPlayfieldMetrics({
        width: rect.width,
        height: rect.height,
        fallZoneHeight,
        slotCenterX,
        slotCenterY,
      });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(playfield);
    return () => {
      observer.disconnect();
    };
  }, [footerRatio]);

  const tutorialMarkerMotion = useMemo(() => {
    const centerX = playfieldMetrics.width / 2;
    const midY = playfieldMetrics.fallZoneHeight * 0.36;
    const markerSize = 60;

    if (tutorialCue === "fly") {
      return {
        x: [
          centerX - markerSize / 2,
          centerX - markerSize / 2 - 12,
          playfieldMetrics.slotCenterX - 24,
        ],
        y: [midY, midY - 56, playfieldMetrics.slotCenterY - 18],
      };
    }

    return {
      x: centerX - markerSize / 2,
      y: midY,
    };
  }, [
    playfieldMetrics.fallZoneHeight,
    playfieldMetrics.slotCenterX,
    playfieldMetrics.slotCenterY,
    playfieldMetrics.width,
    tutorialCue,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.render_game_to_text = () => {
      const payload = {
        mode: phase,
        coordinateSystem:
          "origin at top-left; x increases to the right; y increases downward",
        targetLetter: diacriticConfig?.targetLetter ?? "",
        baseLetter: diacriticConfig?.baseLetter ?? "",
        markerSymbol: diacriticConfig?.markerSymbol ?? "",
        displayLetter,
        level: currentLevelRef.current?.id ?? selectedLevelId,
        progress: progressRef.current,
        targetCompletions: currentLevelRef.current?.targetCompletions ?? 0,
        lives: livesRef.current,
        timeLeft: Number(timeLeftRef.current.toFixed(2)),
        tutorialActive,
        passCelebration: passCelebrationStars > 0,
        failCelebration: showFailCelebration,
        fallingEntities: fallingEntitiesRef.current.map((entity) => ({
          id: entity.id,
          x: Number(entity.x.toFixed(1)),
          y: Number(entity.y.toFixed(1)),
          size: Number(entity.size.toFixed(1)),
          lane: entity.lane,
          kind: entity.kind,
          symbol: entity.symbol,
        })),
        flyingMarkers: flyingMarkers.length,
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
      setFallingEntities([...fallingEntitiesRef.current]);
      setProgressCount(progressRef.current);
      setLives(livesRef.current);
      setTimeLeft(timeLeftRef.current);
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    diacriticConfig?.baseLetter,
    diacriticConfig?.markerSymbol,
    diacriticConfig?.targetLetter,
    displayLetter,
    flyingMarkers.length,
    passCelebrationStars,
    phase,
    runGameStep,
    selectedLevelId,
    showFailCelebration,
    tutorialActive,
  ]);

  useEffect(() => {
    return () => {
      stopGameLoop();
      clearCelebrations();
      clearTutorialSequence();
      resetVisualFeedback();
      clearTimeoutRef(morphResetTimeoutRef);
      clearTimeoutRef(unlockAnimationTimeoutRef);
    };
  }, [
    clearCelebrations,
    clearTimeoutRef,
    clearTutorialSequence,
    resetVisualFeedback,
    stopGameLoop,
  ]);

  const replayRulesAudio = useCallback(() => {
    const rulesText =
      diacriticConfig?.rulesAudioText?.trim() ||
      diacriticConfig?.rules.join(" ").trim() ||
      "";
    if (!rulesText) return;
    speakRulesText(rulesText);
  }, [diacriticConfig?.rules, diacriticConfig?.rulesAudioText]);

  if (!diacriticConfig || levelList.length === 0) {
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
        score={progressCount}
        activeLessonsCount={selectedLevel.targetCompletions}
        activeLessonsTotalStars={selectedLevel.starsReward}
        floorMaxStars={selectedLevel.starsReward}
        successSummary={`Bé đã tạo đủ ${selectedLevel.targetCompletions} chữ ${diacriticConfig.targetLetter}!`}
        failSummary={`Bé tạo được ${progressCount}/${selectedLevel.targetCompletions} chữ ${diacriticConfig.targetLetter}. Mình thử lại nhé!`}
        onComplete={() => {
          setDidPass(null);
          setPhase("select");
        }}
      />
    );
  }

  const selectedTarget = selectedLevel?.targetCompletions ?? 0;
  const levelSelectCards = LEVEL_ORDER.map((levelId) => {
    const level = levelMap.get(levelId);
    if (!level) return null;
    return {
      id: level.id,
      label: LEVEL_LABEL[level.id],
      subtitle: `${level.durationSeconds}s • Tạo ${level.targetCompletions} chữ`,
      starsReward: level.starsReward,
      earnedStars: levelStars[level.id],
      unlocked: isLevelUnlocked(level.id),
    };
  }).filter((level): level is NonNullable<typeof level> => level !== null);
  const countdownHintText =
    diacriticConfig.countdownHintText?.trim() || diacriticConfig.targetLetter;

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
          <MiniGameLevelSelectPanel
            title={diacriticConfig.title ?? "Chọn mức độ"}
            description={diacriticConfig.instruction ?? ""}
            levels={levelSelectCards}
            recentlyUnlockedLevelId={recentlyUnlockedLevelId}
            onSelectLevel={(levelId) =>
              startLevelWithUnlockAnimation(levelId as DiacriticBuildLevelId)
            }
            rulesActionLabel="Nghe luật chơi"
            rulesActionIcon={<Volume2 className="h-4 w-4" />}
            onRulesAction={replayRulesAudio}
          />
        )}

        {phase === "countdown" && (
          <MiniGameCountdown
            value={countdownValue}
            hint={
              <span className="font-hp-special text-[4.2rem] font-black lowercase leading-none text-emerald-700">
                {countdownHintText}
              </span>
            }
          />
        )}

        {phase === "playing" && selectedLevel && (
          <div className="mx-auto flex w-full max-w-md flex-col pb-6">
            <motion.div
              animate={isShaking ? { x: [0, -6, 6, -4, 0] } : { x: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
            >
              <div className="relative overflow-hidden rounded-[30px] border-4 border-cyan-200 bg-linear-to-b from-cyan-100 via-sky-100 to-blue-200 shadow-xl">
                <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-3 pt-4">
                  <div className="flex items-center gap-1.5">
                    {[...Array(selectedLevel.startLives)].map((_, lifeIndex) => (
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
                  <div className="flex items-end gap-2 rounded-2xl bg-white/60 px-3 py-1.5 shadow-sm">
                    <p className="font-hp-special text-[2.75rem] font-black leading-none text-emerald-700">
                      {diacriticConfig.targetLetter.toLocaleLowerCase("vi-VN")}
                    </p>
                    <p className="pb-1 text-base font-bold text-slate-700">
                      {progressCount}/{selectedTarget}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/70 px-3 py-2 text-lg font-black text-slate-800 shadow-sm">
                    {Math.max(0, Math.ceil(timeLeft))}s
                  </div>
                </div>

                <div
                  ref={playfieldRef}
                  className="relative w-full overflow-hidden rounded-t-3xl"
                  style={{
                    height: `${diacriticConfig.playfieldHeightVh ?? 62}dvh`,
                    minHeight: "540px",
                  }}
                >
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-12 right-2 h-32 w-32 rounded-full bg-white/35 blur-2xl" />
                    <div className="absolute left-2 top-24 h-28 w-28 rounded-full bg-cyan-200/40 blur-xl" />
                    <div className="absolute bottom-20 left-10 h-24 w-24 rounded-full bg-emerald-200/35 blur-xl" />
                  </div>

                  <div
                    className="absolute inset-x-0 top-0"
                    style={{ bottom: `${footerPercent}%` }}
                  >
                    {[...Array(Math.max(0, diacriticConfig.laneCount - 1))].map(
                      (_, laneIndex) => (
                        <div
                          key={`lane-${laneIndex}`}
                          className="pointer-events-none absolute inset-y-0 w-px bg-white/55"
                          style={{
                            left: `${((laneIndex + 1) / diacriticConfig.laneCount) * 100}%`,
                          }}
                        />
                      ),
                    )}
                  </div>

                  {fallingEntities.map((entity) => {
                    const hitboxSize = entity.size * diacriticConfig.hitboxScale;
                    const isMarker = entity.kind === "marker";
                    return (
                      <button
                        key={entity.id}
                        onClick={() => handleEntityTap(entity.id)}
                        className="absolute flex items-center justify-center rounded-full active:scale-95"
                        style={{
                          width: hitboxSize,
                          height: hitboxSize,
                          left: entity.x - hitboxSize / 2,
                          top: entity.y - hitboxSize / 2,
                        }}
                        aria-label={
                          isMarker
                            ? `Dấu đúng ${entity.symbol}`
                            : `Vật cản ${entity.symbol}`
                        }
                      >
                        <span
                          className={`relative flex items-center justify-center rounded-full border-2 shadow-md ${
                            isMarker
                              ? "border-emerald-500 bg-linear-to-b from-emerald-100 via-emerald-200 to-emerald-400 text-emerald-900"
                              : "border-orange-500 bg-linear-to-b from-orange-100 via-orange-200 to-orange-400 text-orange-900"
                          }`}
                          style={{
                            width: entity.size,
                            height: entity.size,
                          }}
                        >
                          <span className="pointer-events-none absolute left-[28%] top-[20%] h-[20%] w-[28%] rounded-full bg-white/70 blur-[0.3px]" />
                          {isMarker ? (
                            <span
                              className="font-black leading-none text-[2.2rem]"
                              style={{
                                fontFamily: "Noto Sans, Arial, sans-serif",
                                transform: "translateY(-1px)",
                              }}
                            >
                              {entity.symbol}
                            </span>
                          ) : (
                            <span className="font-hp-special text-[1.7rem] font-black leading-none">
                              {entity.symbol}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}

                  {flyingMarkers.map((flight) => (
                    <motion.div
                      key={flight.id}
                      initial={{
                        x: flight.startX - 18,
                        y: flight.startY - 18,
                        scale: 1,
                        opacity: 1,
                      }}
                      animate={{
                        x: [flight.startX - 18, flight.midX - 18, flight.endX - 16],
                        y: [flight.startY - 18, flight.midY - 18, flight.endY - 16],
                        scale: [1, 1.04, 0.86],
                        opacity: [1, 1, 0.9],
                      }}
                      transition={{
                        duration: flight.durationMs / 1000,
                        ease: "easeInOut",
                      }}
                      className="pointer-events-none absolute z-40 flex h-9 w-9 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-100 text-emerald-900 shadow"
                      onAnimationComplete={() => handleFlightComplete(flight.id)}
                    >
                      <span
                        className="font-black leading-none text-[1.35rem]"
                        style={{
                          fontFamily: "Noto Sans, Arial, sans-serif",
                          transform: "translateY(-1px)",
                        }}
                      >
                        {flight.symbol}
                      </span>
                    </motion.div>
                  ))}

                  <AnimatePresence>
                    {tutorialActive && (
                      <motion.div
                        key="tutorial-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-0 z-50"
                      >
                        <motion.div
                          initial={{
                            x: playfieldMetrics.width / 2 - 30,
                            y: -40,
                          }}
                          animate={tutorialMarkerMotion}
                          transition={{
                            duration: tutorialCue === "fly" ? 0.45 : 1.1,
                            ease: tutorialCue === "fly" ? "easeInOut" : "easeOut",
                          }}
                          className="absolute flex h-15 w-15 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-100 text-emerald-900 shadow-[0_0_24px_rgba(16,185,129,0.55)]"
                        >
                          <span
                            className="font-black leading-none text-[2.05rem]"
                            style={{
                              fontFamily: "Noto Sans, Arial, sans-serif",
                              transform: "translateY(-1px)",
                            }}
                          >
                            {diacriticConfig.markerSymbol}
                          </span>
                        </motion.div>

                        <AnimatePresence>
                          {tutorialCue === "tap" && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.75 }}
                              animate={{ opacity: 1, scale: [1, 0.88, 1] }}
                              exit={{ opacity: 0, scale: 0.75 }}
                              transition={{
                                duration: 0.7,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="absolute left-1/2 top-[35%] -translate-x-[22%] rounded-full bg-white/95 p-2 text-cyan-700 shadow-lg"
                            >
                              <Hand className="h-6 w-6" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    className="absolute inset-x-0 bottom-0 border-t border-white/70 bg-linear-to-b from-white/80 via-cyan-50/80 to-cyan-100/90"
                    style={{
                      height: `${footerPercent}%`,
                      minHeight: "138px",
                      maxHeight: "160px",
                    }}
                  >
                    <div className="relative flex h-full items-center justify-center">
                      <div
                        ref={slotRef}
                        className="pointer-events-none absolute left-1/2 top-5 h-1 w-1 -translate-x-1/2 opacity-0"
                      />

                      <motion.span
                        key={`${displayLetter}-${letterPulseKey}`}
                        initial={{ scale: 0.92 }}
                        animate={{ scale: [1, 1.14, 1] }}
                        transition={{ duration: 0.34, ease: "easeOut" }}
                        className={`font-hp-special text-[4.5rem] font-black leading-none text-emerald-700 ${
                          showSlotPulse
                            ? "drop-shadow-[0_0_12px_rgba(16,185,129,0.55)]"
                            : ""
                        }`}
                      >
                        {displayLetter}
                      </motion.span>

                      <AnimatePresence>
                        {showSparkleBurst && (
                          <motion.div
                            key="sparkle"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.06 }}
                            className="pointer-events-none absolute bottom-10 left-1/2 z-30 -translate-x-1/2"
                          >
                            <Sparkles className="h-8 w-8 text-yellow-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.65)]" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showDamageFlash && (
                      <motion.div
                        key="damage-flash"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="pointer-events-none absolute inset-0 bg-rose-400/20"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
