"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Heart } from "lucide-react";
import type {
  AnimalFeedLevelConfig,
  AnimalFeedLevelId,
  AnimalFeedRoundSide,
  LessonContent,
} from "@/data/game-config";
import {
  getStoredFloorProgress,
  saveFloorProgress,
} from "@/lib/floor-progress";
import { LessonCompletionView } from "@/components/completion";
import { PrimaryButton } from "@/components/common/primary-button";
import { SuccessCelebrationOverlay } from "@/components/celebrations";
import {
  MiniGameCountdown,
  MiniGameLevelSelectPanel,
  MiniGameRulesModal,
  MiniGameTopHud,
} from "@/components/minigame";
import {
  FeedAnimalIcon,
  FeedFoodVisual,
  FeedProgressBar,
} from "./components/index";
import {
  playAppAudio,
  preloadAppAudioList,
  stopAllAppAudio,
} from "@/lib/app-audio";

const LEVEL_ORDER: AnimalFeedLevelId[] = ["easy", "normal", "hard"];
const MAX_FAIL_STREAK = 99;
const COW_OPEN_MOUTH_MS = 320;

type ChallengePhase =
  | "select"
  | "tutorial"
  | "countdown"
  | "playing"
  | "sentence_celebration"
  | "result";
type CowMood = "idle" | "open" | "chew" | "sad";
type RoundResolutionType = "correct" | "wrong" | "timeout";

interface BushChoice {
  id: string;
  side: AnimalFeedRoundSide;
  text: string;
  isCorrect: boolean;
}

interface RoundRuntime {
  id: number;
  choices: BushChoice[];
  correctChoiceId: string;
  selectedChoiceId: string | null;
  remainingSeconds: number;
  hintVisible: boolean;
  correctFlashVisible: boolean;
  resolutionType: RoundResolutionType | null;
  resolutionMsRemaining: number;
  timeoutPenaltyDelayMsRemaining: number;
  penaltyApplied: boolean;
  chewStarted: boolean;
}

interface FloatingText {
  id: number;
  side: AnimalFeedRoundSide;
  label: string;
  tone: "good" | "bad";
}

interface HeartDrop {
  id: number;
}

interface FlightOverlay {
  id: number;
  side: AnimalFeedRoundSide;
}

interface TutorialRuntime {
  levelId: AnimalFeedLevelId;
  durationMs: number;
  elapsedMs: number;
  choices: BushChoice[];
  correctChoiceId: string;
}

interface TutorialStorageState {
  hasSeen: boolean;
  failedAttemptsSinceTutorial: number;
}

interface PendingResult {
  passed: boolean;
  level: AnimalFeedLevelConfig;
}

interface GameAnimalFeedProps {
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

function sumStars(stars: Record<AnimalFeedLevelId, number>): number {
  return stars.easy + stars.normal + stars.hard;
}

function getNextLevelId(levelId: AnimalFeedLevelId): AnimalFeedLevelId | null {
  const levelIndex = LEVEL_ORDER.indexOf(levelId);
  if (levelIndex < 0 || levelIndex >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[levelIndex + 1];
}

function isLevelUnlockedByStars(
  levelId: AnimalFeedLevelId,
  stars: Record<AnimalFeedLevelId, number>,
): boolean {
  if (levelId === "easy") return true;
  if (levelId === "normal") return stars.easy > 0;
  return stars.normal > 0;
}

function getLevelStorageKey(
  lessonId: string,
  levelId: AnimalFeedLevelId,
): string {
  return `${lessonId}:${levelId}`;
}

function getTutorialStorageKey(lessonId: string): string {
  return `${lessonId}:cow-grass-tutorial`;
}

function readTutorialState(lessonId: string): TutorialStorageState {
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
    const parsed = JSON.parse(raw) as Partial<TutorialStorageState>;
    return {
      hasSeen: parsed.hasSeen === true,
      failedAttemptsSinceTutorial: clampInteger(
        Number(parsed.failedAttemptsSinceTutorial ?? 0),
        0,
        MAX_FAIL_STREAK,
      ),
    };
  } catch {
    return {
      hasSeen: false,
      failedAttemptsSinceTutorial: 0,
    };
  }
}

function writeTutorialState(
  lessonId: string,
  state: TutorialStorageState,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getTutorialStorageKey(lessonId), JSON.stringify(state));
}

function pickRandomItem<T>(list: readonly T[]): T {
  if (!list.length) {
    throw new Error("Cannot pick random item from empty list");
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index] ?? list[0];
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
}): Record<AnimalFeedLevelId, number> {
  const emptyStars: Record<AnimalFeedLevelId, number> = {
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

  const easyStored = stored.lessonStars[getLevelStorageKey(lessonId, "easy")] ?? 0;
  const normalStored =
    stored.lessonStars[getLevelStorageKey(lessonId, "normal")] ?? 0;
  const hardStored = stored.lessonStars[getLevelStorageKey(lessonId, "hard")] ?? 0;
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

function formatRoundTime(value: number): string {
  return `${Math.max(0, value).toFixed(1)}s`;
}

export function GameAnimalFeed({
  worldId,
  towerId,
  floorId,
  floorName,
  floorMaxStars,
  lesson,
  onBack,
}: GameAnimalFeedProps) {
  const cowGrassConfig = lesson.animalFeedGame;
  const levelList = useMemo(() => cowGrassConfig?.levels ?? [], [cowGrassConfig]);
  const levelMap = useMemo(
    () => new Map(levelList.map((level) => [level.id, level])),
    [levelList],
  );
  const [phase, setPhase] = useState<ChallengePhase>("select");
  const [selectedLevelId, setSelectedLevelId] =
    useState<AnimalFeedLevelId | null>("easy");
  const [countdownValue, setCountdownValue] = useState(3);
  const [pendingTutorial, setPendingTutorial] = useState(false);
  const [didPass, setDidPass] = useState<boolean | null>(null);
  const [lastEarnedStars, setLastEarnedStars] = useState(0);
  const [roundState, setRoundState] = useState<RoundRuntime | null>(null);
  const [lives, setLives] = useState(0);
  const [progressHits, setProgressHits] = useState<number[]>([]);
  const [cowMood, setCowMood] = useState<CowMood>("idle");
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [heartDrops, setHeartDrops] = useState<HeartDrop[]>([]);
  const [activeFlight, setActiveFlight] = useState<FlightOverlay | null>(null);
  const [progressPingIndex, setProgressPingIndex] = useState<number | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [recentlyUnlockedLevelId, setRecentlyUnlockedLevelId] =
    useState<AnimalFeedLevelId | null>(null);
  const [pendingUnlockLevelId, setPendingUnlockLevelId] =
    useState<AnimalFeedLevelId | null>(null);
  const [levelStars, setLevelStars] = useState<Record<AnimalFeedLevelId, number>>(
    () =>
      getInitialLevelStars({
        worldId,
        towerId,
        floorId,
        floorMaxStars,
        lessonId: lesson.id,
      }),
  );

  useEffect(() => {
    if (!cowGrassConfig) return;
    preloadAppAudioList([
      cowGrassConfig.audio.passFlyEffect,
      cowGrassConfig.audio.passProgressPing,
      cowGrassConfig.audio.lifeLoss,
      cowGrassConfig.audio.eatingGrass,
    ]);
  }, [cowGrassConfig]);

  const [tutorialElapsedMs, setTutorialElapsedMs] = useState(0);
  const [tutorialDurationMs, setTutorialDurationMs] = useState(0);
  const [tutorialChoices, setTutorialChoices] = useState<BushChoice[]>([]);
  const [tutorialCorrectChoiceId, setTutorialCorrectChoiceId] = useState<
    string | null
  >(null);

  const selectedLevel = selectedLevelId
    ? (levelMap.get(selectedLevelId) ?? null)
    : null;
  const challengeHeaderTitle = cowGrassConfig?.headerTitle?.trim() || floorName;
  const cowGrassAudio = cowGrassConfig?.audio;
  const sentenceText = (
    cowGrassConfig?.progressSentence ||
    cowGrassConfig?.sentenceTokens
      ?.map((token) => token.trim().toLocaleLowerCase("vi-VN"))
      .filter((token) => token.length > 0)
      .join(" ")
  )
    ?.trim()
    .toLocaleLowerCase("vi-VN") || "bò ăn cỏ";

  const runningRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const frameLoopRef = useRef<(timestamp: number) => void>(() => {});
  const lastFrameAtRef = useRef(0);
  const phaseRef = useRef<ChallengePhase>("select");
  const pendingTutorialRef = useRef(false);

  const roundRef = useRef<RoundRuntime | null>(null);
  const livesRef = useRef(0);
  const progressHitsRef = useRef<number[]>([]);
  const cowMoodRef = useRef<CowMood>("idle");
  const cowMoodMsRef = useRef(0);
  const currentLevelRef = useRef<AnimalFeedLevelConfig | null>(null);
  const roundIdRef = useRef(1);
  const floatingTextIdRef = useRef(1);
  const heartDropIdRef = useRef(1);
  const flightIdRef = useRef(1);
  const tutorialRuntimeRef = useRef<TutorialRuntime | null>(null);
  const tutorialDidTapRef = useRef(false);
  const tutorialDidFlyRef = useRef(false);
  const tutorialDidOpenRef = useRef(false);
  const tutorialDidChewRef = useRef(false);
  const sentenceCelebrateRemainingMsRef = useRef(0);
  const pendingResultRef = useRef<PendingResult | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const unlockAnimationTimeoutRef = useRef<number | null>(null);
  const distractorStreakRef = useRef<{ value: string | null; count: number }>({
    value: null,
    count: 0,
  });
  const sideStreakRef = useRef<{ value: AnimalFeedRoundSide | null; count: number }>({
    value: null,
    count: 0,
  });
  const startGameplayRef = useRef<() => void>(() => {});

  const clearTimeoutRef = useCallback((ref: { current: number | null }) => {
    if (ref.current === null) return;
    window.clearTimeout(ref.current);
    ref.current = null;
  }, []);

  const registerTimeout = useCallback((timeoutId: number) => {
    timeoutIdsRef.current = [...timeoutIdsRef.current, timeoutId];
  }, []);

  const playSfx = useCallback((src: string) => {
    playAppAudio(src, {
      allowOverlap: true,
      retries: 1,
      retryDelayMs: 80,
    });
  }, []);

  const updateCowMood = useCallback((nextMood: CowMood, holdMs: number) => {
    cowMoodRef.current = nextMood;
    setCowMood(nextMood);
    cowMoodMsRef.current = holdMs;
  }, []);

  const decayCowMood = useCallback((deltaMs: number) => {
    if (cowMoodMsRef.current <= 0) return;
    cowMoodMsRef.current = Math.max(0, cowMoodMsRef.current - deltaMs);
    if (cowMoodMsRef.current > 0) return;
    if (cowMoodRef.current === "idle") return;
    cowMoodRef.current = "idle";
    setCowMood("idle");
  }, []);

  const queueFloatingText = useCallback(
    (side: AnimalFeedRoundSide, label: string, tone: "good" | "bad") => {
      const id = floatingTextIdRef.current;
      floatingTextIdRef.current += 1;
      setFloatingTexts((current) => [...current, { id, side, label, tone }]);
      const timeoutId = window.setTimeout(() => {
        setFloatingTexts((current) => current.filter((item) => item.id !== id));
      }, 780);
      registerTimeout(timeoutId);
    },
    [registerTimeout],
  );

  const queueHeartDrop = useCallback(() => {
    const id = heartDropIdRef.current;
    heartDropIdRef.current += 1;
    setHeartDrops((current) => [...current, { id }]);
    const timeoutId = window.setTimeout(() => {
      setHeartDrops((current) => current.filter((item) => item.id !== id));
    }, 720);
    registerTimeout(timeoutId);
  }, [registerTimeout]);

  const clearRoundVisuals = useCallback(() => {
    setFloatingTexts([]);
    setHeartDrops([]);
    setActiveFlight(null);
    setProgressPingIndex(null);
  }, []);

  const stopGameLoop = useCallback(() => {
    runningRef.current = false;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    lastFrameAtRef.current = 0;
  }, []);

  const startGameLoop = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    lastFrameAtRef.current = 0;
    animationFrameRef.current = window.requestAnimationFrame(frameLoopRef.current);
  }, []);

  const syncRoundState = useCallback(() => {
    if (!roundRef.current) {
      setRoundState(null);
      return;
    }
    const next = { ...roundRef.current, choices: [...roundRef.current.choices] };
    setRoundState(next);
  }, []);

  const persistProgress = useCallback(
    (nextLevelStars: Record<AnimalFeedLevelId, number>) => {
      const normalized: Record<AnimalFeedLevelId, number> = {
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

  const isLevelUnlocked = useCallback(
    (levelId: AnimalFeedLevelId) => {
      if (pendingUnlockLevelId === levelId) return false;
      if (levelId === "easy") return true;
      if (levelId === "normal") return levelStars.easy > 0;
      return levelStars.normal > 0;
    },
    [levelStars.easy, levelStars.normal, pendingUnlockLevelId],
  );

  const getSegmentRequirements = useCallback(
    (level: AnimalFeedLevelConfig): number[] =>
      level.progressSegments.map((segment) =>
        clampInteger(segment.requiredHits, 1, 5),
      ),
    [],
  );

  const getTotalTargetHits = useCallback(
    (level: AnimalFeedLevelConfig): number =>
      getSegmentRequirements(level).reduce((sum, value) => sum + value, 0),
    [getSegmentRequirements],
  );

  const resetRoundAntiRepeatHistory = useCallback(() => {
    distractorStreakRef.current = { value: null, count: 0 };
    sideStreakRef.current = { value: null, count: 0 };
  }, []);

  const pickDistractorWord = useCallback((): string => {
    if (!cowGrassConfig) return "co";
    const distractorPool = cowGrassConfig.distractorWords;
    const streak = distractorStreakRef.current;
    const blockedWord =
      streak.value &&
      streak.count >= cowGrassConfig.antiRepeatMaxDistractorStreak
        ? streak.value
        : null;
    const candidates = blockedWord
      ? distractorPool.filter((word) => word !== blockedWord)
      : [...distractorPool];
    const selected = pickRandomItem(candidates.length ? candidates : distractorPool);
    if (streak.value === selected) {
      streak.count += 1;
    } else {
      streak.value = selected;
      streak.count = 1;
    }
    return selected;
  }, [cowGrassConfig]);

  const pickCorrectSide = useCallback((): AnimalFeedRoundSide => {
    if (!cowGrassConfig) return "left";
    const allSides: AnimalFeedRoundSide[] = ["left", "right"];
    const streak = sideStreakRef.current;
    const blockedSide =
      streak.value &&
      streak.count >= cowGrassConfig.antiRepeatMaxCorrectSideStreak
        ? streak.value
        : null;
    const candidates = blockedSide
      ? allSides.filter((side) => side !== blockedSide)
      : allSides;
    const selected = pickRandomItem(candidates.length ? candidates : allSides);
    if (streak.value === selected) {
      streak.count += 1;
    } else {
      streak.value = selected;
      streak.count = 1;
    }
    return selected;
  }, [cowGrassConfig]);

  const createRound = useCallback(
    (level: AnimalFeedLevelConfig): RoundRuntime => {
      const distractor = pickDistractorWord();
      const correctSide = pickCorrectSide();
      const leftChoice: BushChoice = {
        id: `round-${roundIdRef.current}-left`,
        side: "left",
        text: correctSide === "left" ? cowGrassConfig?.correctWord ?? "cỏ" : distractor,
        isCorrect: correctSide === "left",
      };
      const rightChoice: BushChoice = {
        id: `round-${roundIdRef.current}-right`,
        side: "right",
        text:
          correctSide === "right" ? cowGrassConfig?.correctWord ?? "cỏ" : distractor,
        isCorrect: correctSide === "right",
      };
      const created: RoundRuntime = {
        id: roundIdRef.current,
        choices: [leftChoice, rightChoice],
        correctChoiceId: correctSide === "left" ? leftChoice.id : rightChoice.id,
        selectedChoiceId: null,
        remainingSeconds: level.roundDurationSeconds,
        hintVisible: false,
        correctFlashVisible: false,
        resolutionType: null,
        resolutionMsRemaining: 0,
        timeoutPenaltyDelayMsRemaining: 0,
        penaltyApplied: false,
        chewStarted: false,
      };
      roundIdRef.current += 1;
      return created;
    },
    [cowGrassConfig?.correctWord, pickCorrectSide, pickDistractorWord],
  );

  const setupRound = useCallback(
    (level: AnimalFeedLevelConfig) => {
      roundRef.current = createRound(level);
      syncRoundState();
    },
    [createRound, syncRoundState],
  );

  const maybeMarkTutorialSeen = useCallback(() => {
    if (!cowGrassConfig) return;
    const state = readTutorialState(lesson.id);
    writeTutorialState(lesson.id, {
      hasSeen: true,
      failedAttemptsSinceTutorial:
        state.failedAttemptsSinceTutorial >=
        cowGrassConfig.tutorial.replayAfterFailCount
          ? 0
          : state.failedAttemptsSinceTutorial,
    });
  }, [cowGrassConfig, lesson.id]);

  const updateTutorialAttemptState = useCallback(
    (levelId: AnimalFeedLevelId, passed: boolean) => {
      if (!cowGrassConfig?.tutorial) return;
      if (levelId !== cowGrassConfig.tutorial.enabledLevelId) return;
      const current = readTutorialState(lesson.id);
      writeTutorialState(lesson.id, {
        hasSeen: current.hasSeen || passed,
        failedAttemptsSinceTutorial: passed
          ? 0
          : clampInteger(
              current.failedAttemptsSinceTutorial + 1,
              0,
              MAX_FAIL_STREAK,
            ),
      });
    },
    [cowGrassConfig, lesson.id],
  );

  const finalizeLevel = useCallback(
    (passed: boolean, level: AnimalFeedLevelConfig) => {
      stopGameLoop();
      phaseRef.current = "result";
      setPhase("result");
      setDidPass(passed);
      const earnedStars = passed ? level.starsReward : 0;
      setLastEarnedStars(earnedStars);
      setRoundState(null);
      roundRef.current = null;
      setActiveFlight(null);
      clearRoundVisuals();
      setCowMood("idle");
      cowMoodRef.current = "idle";
      cowMoodMsRef.current = 0;
      updateTutorialAttemptState(level.id, passed);

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
    [clearRoundVisuals, persistProgress, stopGameLoop, updateTutorialAttemptState],
  );

  const startSentenceCelebration = useCallback((level: AnimalFeedLevelConfig) => {
    if (!cowGrassConfig) return;
    pendingResultRef.current = { passed: true, level };
    sentenceCelebrateRemainingMsRef.current = cowGrassConfig.sentenceCelebrateMs;
    phaseRef.current = "sentence_celebration";
    setPhase("sentence_celebration");
    startGameLoop();
  }, [cowGrassConfig, startGameLoop]);

  const triggerLevelFail = useCallback(
    (level: AnimalFeedLevelConfig) => {
      pendingResultRef.current = null;
      sentenceCelebrateRemainingMsRef.current = 0;
      finalizeLevel(false, level);
    },
    [finalizeLevel],
  );

  const applyLifeLoss = useCallback(
    (from: "wrong" | "timeout", side: AnimalFeedRoundSide) => {
      if (!cowGrassConfig) return;
      livesRef.current = Math.max(0, livesRef.current - 1);
      setLives(livesRef.current);
      queueFloatingText(side, "-1 tim", "bad");
      queueHeartDrop();
      if (cowGrassAudio?.lifeLoss) {
        playSfx(cowGrassAudio.lifeLoss);
      }
      updateCowMood("sad", cowGrassConfig.animalSadMs);
      if (from === "wrong" && "vibrate" in navigator) {
        navigator.vibrate(40);
      }
      if (from === "timeout" && "vibrate" in navigator) {
        navigator.vibrate(25);
      }
    },
    [
      cowGrassAudio,
      cowGrassConfig,
      playSfx,
      queueFloatingText,
      queueHeartDrop,
      updateCowMood,
    ],
  );

  const applyProgressIncrement = useCallback(
    (level: AnimalFeedLevelConfig): boolean => {
      const requirements = getSegmentRequirements(level);
      const nextHits = [...progressHitsRef.current];
      let updatedIndex = -1;
      for (let index = 0; index < requirements.length; index += 1) {
        if ((nextHits[index] ?? 0) >= requirements[index]) continue;
        nextHits[index] = (nextHits[index] ?? 0) + 1;
        updatedIndex = index;
        break;
      }
      progressHitsRef.current = nextHits;
      setProgressHits(nextHits);
      if (updatedIndex >= 0) {
        setProgressPingIndex(updatedIndex);
        const timeoutId = window.setTimeout(() => {
          setProgressPingIndex((current) =>
            current === updatedIndex ? null : current,
          );
        }, 460);
        registerTimeout(timeoutId);
        if (cowGrassAudio?.passProgressPing) {
          playSfx(cowGrassAudio.passProgressPing);
        }
      }
      return requirements.every((required, index) => (nextHits[index] ?? 0) >= required);
    },
    [cowGrassAudio, getSegmentRequirements, playSfx, registerTimeout],
  );

  const startCorrectResolution = useCallback(
    (choice: BushChoice) => {
      if (!cowGrassConfig || !roundRef.current) return;
      roundRef.current = {
        ...roundRef.current,
        selectedChoiceId: choice.id,
        resolutionType: "correct",
        resolutionMsRemaining: cowGrassConfig.correctResolveMs,
        chewStarted: false,
      };
      syncRoundState();
      setActiveFlight({
        id: flightIdRef.current,
        side: choice.side,
      });
      flightIdRef.current += 1;
      queueFloatingText(choice.side, "+1", "good");
      if (cowGrassAudio?.passFlyEffect) {
        playSfx(cowGrassAudio.passFlyEffect);
      }
      updateCowMood("open", COW_OPEN_MOUTH_MS);
    },
    [
      cowGrassAudio,
      cowGrassConfig,
      playSfx,
      queueFloatingText,
      syncRoundState,
      updateCowMood,
    ],
  );

  const startWrongResolution = useCallback(
    (choice: BushChoice) => {
      if (!cowGrassConfig || !roundRef.current) return;
      applyLifeLoss("wrong", choice.side);
      roundRef.current = {
        ...roundRef.current,
        selectedChoiceId: choice.id,
        resolutionType: "wrong",
        resolutionMsRemaining: cowGrassConfig.wrongResolveMs,
        correctFlashVisible: true,
        hintVisible: false,
        chewStarted: true,
      };
      syncRoundState();
    },
    [applyLifeLoss, cowGrassConfig, syncRoundState],
  );

  const startTimeoutResolution = useCallback(() => {
    if (!cowGrassConfig || !roundRef.current) return;
    roundRef.current = {
      ...roundRef.current,
      resolutionType: "timeout",
      resolutionMsRemaining: cowGrassConfig.timeoutResolveMs,
      timeoutPenaltyDelayMsRemaining: cowGrassConfig.timeoutRevealMs,
      correctFlashVisible: true,
      hintVisible: false,
      chewStarted: true,
    };
    syncRoundState();
  }, [cowGrassConfig, syncRoundState]);

  const runTutorialStep = useCallback(
    (deltaMs: number) => {
      const tutorial = tutorialRuntimeRef.current;
      if (!tutorial || !cowGrassConfig) return;
      tutorial.elapsedMs = Math.min(tutorial.durationMs, tutorial.elapsedMs + deltaMs);
      setTutorialElapsedMs(tutorial.elapsedMs);

      const tapTriggerMs = tutorial.durationMs * 0.35;
      const flyTriggerMs = tutorial.durationMs * 0.5;
      const openTriggerMs = tutorial.durationMs * 0.56;
      const chewTriggerMs = tutorial.durationMs * 0.66;

      if (!tutorialDidTapRef.current && tutorial.elapsedMs >= tapTriggerMs) {
        tutorialDidTapRef.current = true;
      }

      if (!tutorialDidFlyRef.current && tutorial.elapsedMs >= flyTriggerMs) {
        const correctChoice = tutorial.choices.find(
          (choice) => choice.id === tutorial.correctChoiceId,
        );
        if (correctChoice) {
          setActiveFlight({
            id: flightIdRef.current,
            side: correctChoice.side,
          });
          flightIdRef.current += 1;
          if (cowGrassAudio?.passFlyEffect) {
            playSfx(cowGrassAudio.passFlyEffect);
          }
        }
        tutorialDidFlyRef.current = true;
      }

      if (
        tutorialDidFlyRef.current &&
        !tutorialDidOpenRef.current &&
        !tutorialDidChewRef.current &&
        tutorial.elapsedMs >= openTriggerMs
      ) {
        tutorialDidOpenRef.current = true;
        updateCowMood("open", COW_OPEN_MOUTH_MS);
      }

      if (!tutorialDidChewRef.current && tutorial.elapsedMs >= chewTriggerMs) {
        updateCowMood("chew", cowGrassConfig.animalChewMs);
        if (cowGrassAudio?.eatingGrass) {
          playSfx(cowGrassAudio.eatingGrass);
        }
        tutorialDidChewRef.current = true;
      }

      if (tutorial.elapsedMs < tutorial.durationMs) return;

      maybeMarkTutorialSeen();
      tutorialRuntimeRef.current = null;
      pendingTutorialRef.current = false;
      setPendingTutorial(false);
      setTutorialElapsedMs(0);
      setTutorialDurationMs(0);
      setTutorialChoices([]);
      setTutorialCorrectChoiceId(null);
      setActiveFlight(null);
      setCowMood("idle");
      cowMoodRef.current = "idle";
      cowMoodMsRef.current = 0;
      tutorialDidTapRef.current = false;
      tutorialDidFlyRef.current = false;
      tutorialDidOpenRef.current = false;
      tutorialDidChewRef.current = false;
      startGameplayRef.current();
    },
    [
      cowGrassAudio,
      cowGrassConfig,
      maybeMarkTutorialSeen,
      playSfx,
      updateCowMood,
    ],
  );

  const runPlayingStep = useCallback(
    (deltaMs: number) => {
      const level = currentLevelRef.current;
      const round = roundRef.current;
      if (!cowGrassConfig || !level || !round) return;

      if (!round.resolutionType) {
        round.remainingSeconds = Math.max(0, round.remainingSeconds - deltaMs / 1000);
        if (
          typeof level.easyHintSecondsLeft === "number" &&
          round.remainingSeconds <= level.easyHintSecondsLeft
        ) {
          round.hintVisible = true;
        }
        if (round.remainingSeconds <= 0) {
          startTimeoutResolution();
          return;
        }
        roundRef.current = round;
        syncRoundState();
        return;
      }

      round.resolutionMsRemaining = Math.max(0, round.resolutionMsRemaining - deltaMs);

      if (
        round.resolutionType === "correct" &&
        !round.chewStarted &&
        round.resolutionMsRemaining <=
          Math.max(
            cowGrassConfig.animalChewMs,
            cowGrassConfig.correctResolveMs - COW_OPEN_MOUTH_MS,
          )
      ) {
        round.chewStarted = true;
        updateCowMood("chew", cowGrassConfig.animalChewMs);
        if (cowGrassAudio?.eatingGrass) {
          playSfx(cowGrassAudio.eatingGrass);
        }
      }

      if (round.resolutionType === "timeout" && !round.penaltyApplied) {
        round.timeoutPenaltyDelayMsRemaining = Math.max(
          0,
          round.timeoutPenaltyDelayMsRemaining - deltaMs,
        );
        if (round.timeoutPenaltyDelayMsRemaining <= 0) {
          round.penaltyApplied = true;
          const correctChoice = round.choices.find(
            (choice) => choice.id === round.correctChoiceId,
          );
          applyLifeLoss("timeout", correctChoice?.side ?? "left");
        }
      }

      if (round.resolutionMsRemaining > 0) {
        roundRef.current = round;
        syncRoundState();
        return;
      }

      setActiveFlight(null);

      if (round.resolutionType === "correct") {
        const didComplete = applyProgressIncrement(level);
        if (didComplete) {
          const requirements = getSegmentRequirements(level);
          progressHitsRef.current = requirements;
          setProgressHits(requirements);
          startSentenceCelebration(level);
          return;
        }
        setupRound(level);
        return;
      }

      if (livesRef.current <= 0) {
        triggerLevelFail(level);
        return;
      }

      setupRound(level);
    },
    [
      applyLifeLoss,
      applyProgressIncrement,
      cowGrassAudio,
      cowGrassConfig,
      getSegmentRequirements,
      playSfx,
      setupRound,
      startSentenceCelebration,
      startTimeoutResolution,
      syncRoundState,
      triggerLevelFail,
      updateCowMood,
    ],
  );

  const runSentenceCelebrationStep = useCallback((deltaMs: number) => {
    sentenceCelebrateRemainingMsRef.current = Math.max(
      0,
      sentenceCelebrateRemainingMsRef.current - deltaMs,
    );
    if (sentenceCelebrateRemainingMsRef.current > 0) return;
    const pending = pendingResultRef.current;
    pendingResultRef.current = null;
    if (!pending || !pending.passed) return;
    finalizeLevel(true, pending.level);
  }, [finalizeLevel]);

  const runPhaseStep = useCallback(
    (deltaMs: number) => {
      decayCowMood(deltaMs);
      if (phaseRef.current === "tutorial") {
        runTutorialStep(deltaMs);
        return;
      }
      if (phaseRef.current === "playing") {
        runPlayingStep(deltaMs);
        return;
      }
      if (phaseRef.current === "sentence_celebration") {
        runSentenceCelebrationStep(deltaMs);
      }
    },
    [decayCowMood, runPlayingStep, runSentenceCelebrationStep, runTutorialStep],
  );

  const frameLoop = useCallback(
    (timestamp: number) => {
      if (!runningRef.current) return;
      if (lastFrameAtRef.current === 0) {
        lastFrameAtRef.current = timestamp;
      }
      const deltaMs = Math.min(80, timestamp - lastFrameAtRef.current);
      lastFrameAtRef.current = timestamp;
      runPhaseStep(deltaMs);
      if (!runningRef.current) return;
      animationFrameRef.current = window.requestAnimationFrame(frameLoopRef.current);
    },
    [runPhaseStep],
  );

  useEffect(() => {
    frameLoopRef.current = frameLoop;
  }, [frameLoop]);

  const shouldShowTutorialForLevel = useCallback(
    (levelId: AnimalFeedLevelId): boolean => {
      if (!cowGrassConfig?.tutorial) return false;
      if (levelId !== cowGrassConfig.tutorial.enabledLevelId) return false;
      const tutorialState = readTutorialState(lesson.id);
      if (!tutorialState.hasSeen) return true;
      return (
        tutorialState.failedAttemptsSinceTutorial >=
        cowGrassConfig.tutorial.replayAfterFailCount
      );
    },
    [cowGrassConfig, lesson.id],
  );

  const startTutorial = useCallback(
    (level: AnimalFeedLevelConfig) => {
      if (!cowGrassConfig) return;
      const distractor = pickDistractorWord();
      const correctSide = pickCorrectSide();
      const leftChoice: BushChoice = {
        id: "tutorial-left",
        side: "left",
        text: correctSide === "left" ? cowGrassConfig.correctWord : distractor,
        isCorrect: correctSide === "left",
      };
      const rightChoice: BushChoice = {
        id: "tutorial-right",
        side: "right",
        text: correctSide === "right" ? cowGrassConfig.correctWord : distractor,
        isCorrect: correctSide === "right",
      };
      const choices = [leftChoice, rightChoice];
      tutorialRuntimeRef.current = {
        levelId: level.id,
        durationMs: cowGrassConfig.tutorial.durationMs,
        elapsedMs: 0,
        choices,
        correctChoiceId: correctSide === "left" ? leftChoice.id : rightChoice.id,
      };
      tutorialDidTapRef.current = false;
      tutorialDidFlyRef.current = false;
      tutorialDidOpenRef.current = false;
      tutorialDidChewRef.current = false;
      setTutorialElapsedMs(0);
      setTutorialDurationMs(cowGrassConfig.tutorial.durationMs);
      setTutorialChoices(choices);
      setTutorialCorrectChoiceId(
        correctSide === "left" ? leftChoice.id : rightChoice.id,
      );
      livesRef.current = level.startLives;
      progressHitsRef.current = level.progressSegments.map(() => 0);
      setLives(level.startLives);
      setProgressHits(level.progressSegments.map(() => 0));
      setRoundState(null);
      roundRef.current = null;
      phaseRef.current = "tutorial";
      setPhase("tutorial");
      setActiveFlight(null);
      updateCowMood("idle", 0);
      clearRoundVisuals();
      startGameLoop();
    },
    [
      clearRoundVisuals,
      cowGrassConfig,
      pickCorrectSide,
      pickDistractorWord,
      startGameLoop,
      updateCowMood,
    ],
  );

  const startGameplay = useCallback(() => {
    if (!cowGrassConfig || !selectedLevel) return;
    stopGameLoop();
    clearRoundVisuals();
    resetRoundAntiRepeatHistory();
    tutorialRuntimeRef.current = null;
    tutorialDidTapRef.current = false;
    tutorialDidFlyRef.current = false;
    tutorialDidOpenRef.current = false;
    tutorialDidChewRef.current = false;
    setTutorialElapsedMs(0);
    setTutorialDurationMs(0);
    setTutorialChoices([]);
    setTutorialCorrectChoiceId(null);
    currentLevelRef.current = selectedLevel;
    livesRef.current = selectedLevel.startLives;
    progressHitsRef.current = selectedLevel.progressSegments.map(() => 0);
    setLives(selectedLevel.startLives);
    setProgressHits(selectedLevel.progressSegments.map(() => 0));
    setDidPass(null);
    setLastEarnedStars(0);
    phaseRef.current = "playing";
    setPhase("playing");
    setActiveFlight(null);
    updateCowMood("idle", 0);
    setupRound(selectedLevel);
    startGameLoop();
  }, [
    clearRoundVisuals,
    cowGrassConfig,
    resetRoundAntiRepeatHistory,
    selectedLevel,
    setupRound,
    startGameLoop,
    stopGameLoop,
    updateCowMood,
  ]);

  useEffect(() => {
    startGameplayRef.current = startGameplay;
  }, [startGameplay]);

  const startLevelFlow = useCallback(
    (levelId: AnimalFeedLevelId) => {
      if (!isLevelUnlocked(levelId)) return;
      const level = levelMap.get(levelId);
      if (!level) return;
      setSelectedLevelId(levelId);
      currentLevelRef.current = level;
      setDidPass(null);
      setLastEarnedStars(0);
      setShowRulesModal(false);
      const shouldRunTutorial = shouldShowTutorialForLevel(levelId);
      pendingTutorialRef.current = shouldRunTutorial;
      setPendingTutorial(shouldRunTutorial);
      clearRoundVisuals();
      stopGameLoop();
      roundRef.current = null;
      setRoundState(null);
      phaseRef.current = "countdown";
      setCountdownValue(3);
      setPhase("countdown");
    },
    [
      clearRoundVisuals,
      isLevelUnlocked,
      levelMap,
      shouldShowTutorialForLevel,
      stopGameLoop,
    ],
  );

  const handleUnlockLevel = useCallback(
    (levelId: AnimalFeedLevelId) => {
      if (pendingUnlockLevelId !== levelId) return;
      setPendingUnlockLevelId(null);
      setRecentlyUnlockedLevelId(levelId);
      clearTimeoutRef(unlockAnimationTimeoutRef);
      unlockAnimationTimeoutRef.current = window.setTimeout(() => {
        unlockAnimationTimeoutRef.current = null;
        setRecentlyUnlockedLevelId(null);
      }, 900);
    },
    [clearTimeoutRef, pendingUnlockLevelId],
  );

  const handleChoiceTap = useCallback(
    (choiceId: string) => {
      if (phaseRef.current !== "playing") return;
      const round = roundRef.current;
      const level = currentLevelRef.current;
      if (!round || !level) return;
      if (round.resolutionType) return;
      const choice = round.choices.find((item) => item.id === choiceId);
      if (!choice) return;
      if (choice.isCorrect) {
        startCorrectResolution(choice);
        return;
      }
      startWrongResolution(choice);
    },
    [startCorrectResolution, startWrongResolution],
  );

  const handleBack = useCallback(() => {
    stopGameLoop();
    stopAllAppAudio();
    onBack();
  }, [onBack, stopGameLoop]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const timeoutId = window.setTimeout(() => {
      if (countdownValue <= 1) {
        if (pendingTutorialRef.current && selectedLevel) {
          pendingTutorialRef.current = false;
          setPendingTutorial(false);
          startTutorial(selectedLevel);
        } else {
          startGameplay();
        }
        setCountdownValue(3);
        return;
      }

      setCountdownValue((current) => Math.max(1, current - 1));
    }, 900);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    countdownValue,
    phase,
    selectedLevel,
    startGameplay,
    startTutorial,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.render_game_to_text = () => {
      const level = currentLevelRef.current;
      const activeRound = roundRef.current;
      const tutorial = tutorialRuntimeRef.current;
      const payload = {
        mode: phaseRef.current,
        coordinateSystem:
          "origin at top-left; x increases to the right; y increases downward",
        level: level?.id ?? selectedLevelId,
        pendingTutorial,
        lives: livesRef.current,
        cowMood: cowMoodRef.current,
        roundTimeLeft: Number((activeRound?.remainingSeconds ?? 0).toFixed(2)),
        sentence: sentenceText,
        progressHits: progressHitsRef.current,
        progressRequired: level
          ? level.progressSegments.map((segment) => segment.requiredHits)
          : [],
        round: activeRound
          ? {
              id: activeRound.id,
              resolutionType: activeRound.resolutionType,
              hintVisible: activeRound.hintVisible,
              correctFlashVisible: activeRound.correctFlashVisible,
              selectedChoiceId: activeRound.selectedChoiceId,
              choices: activeRound.choices.map((choice) => ({
                id: choice.id,
                side: choice.side,
                text: choice.text,
                isCorrect: choice.isCorrect,
              })),
            }
          : null,
        tutorial: tutorial
          ? {
              levelId: tutorial.levelId,
              elapsedMs: Math.round(tutorial.elapsedMs),
              durationMs: tutorial.durationMs,
              didTap: tutorialDidTapRef.current,
              didFly: tutorialDidFlyRef.current,
              didOpen: tutorialDidOpenRef.current,
              didChew: tutorialDidChewRef.current,
            }
          : null,
      };
      return JSON.stringify(payload);
    };

    window.advanceTime = (ms: number) => {
      if (!runningRef.current) return;
      const stepCount = Math.max(1, Math.round(ms / (1000 / 60)));
      const stepMs = ms / stepCount;
      for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
        runPhaseStep(stepMs);
        if (!runningRef.current) break;
      }
      syncRoundState();
      setLives(livesRef.current);
      setProgressHits([...progressHitsRef.current]);
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [pendingTutorial, runPhaseStep, selectedLevelId, sentenceText, syncRoundState]);

  useEffect(() => {
    return () => {
      stopGameLoop();
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current = [];
      clearTimeoutRef(unlockAnimationTimeoutRef);
      stopAllAppAudio();
    };
  }, [clearTimeoutRef, stopGameLoop]);

  if (!cowGrassConfig || levelList.length === 0) {
    return (
      <div className="relative flex h-dvh w-full flex-col items-center justify-center gap-4 bg-background p-6">
        <p className="text-center text-foreground">
          Chưa có dữ liệu mini game cho tầng này.
        </p>
        <PrimaryButton
          onClick={handleBack}
          className="rounded-2xl"
          frontClassName="px-5 py-2 text-sm"
        >
          Quay Lại
        </PrimaryButton>
      </div>
    );
  }

  if (phase === "result" && selectedLevel && didPass !== null) {
    const totalHitsRequired = getTotalTargetHits(selectedLevel);
    const currentHits = progressHits.reduce((sum, value) => sum + value, 0);
    return (
      <LessonCompletionView
        stars={lastEarnedStars}
        score={currentHits}
        activeLessonsCount={totalHitsRequired}
        activeLessonsTotalStars={selectedLevel.starsReward}
        floorMaxStars={selectedLevel.starsReward}
        successSummary={`Bé đã hoàn thành mức ${selectedLevel.label} và cho bò ăn đủ "${sentenceText}"!`}
        failSummary={`Bé mới cho bò ăn ${currentHits}/${totalHitsRequired} lượt. Mình thử lại mức ${selectedLevel.label} nhé!`}
        onComplete={() => {
          setDidPass(null);
          phaseRef.current = "select";
          setPhase("select");
          clearRoundVisuals();
        }}
      />
    );
  }

  const levelSelectCards = LEVEL_ORDER.map((levelId) => {
    const level = levelMap.get(levelId);
    if (!level) return null;
    return {
      id: level.id,
      label: level.label,
      subtitle: `${level.roundDurationSeconds}s • ${getTotalTargetHits(level)} lượt đúng • ${level.startLives} tim`,
      starsReward: level.starsReward,
      earnedStars: levelStars[level.id],
      unlocked: isLevelUnlocked(level.id),
      pendingUnlock: pendingUnlockLevelId === level.id,
      actionLabel: "Chơi",
    };
  }).filter((level): level is NonNullable<typeof level> => level !== null);

  const progressSegments =
    selectedLevel?.progressSegments ??
    levelList[0]?.progressSegments ??
    cowGrassConfig.levels[0]?.progressSegments ??
    [];
  const displayedLives =
    phase === "playing" || phase === "tutorial" || phase === "sentence_celebration"
      ? lives
      : selectedLevel?.startLives ?? levelList[0]?.startLives ?? 0;
  const displayedRoundTime =
    phase === "playing" && roundState
      ? roundState.remainingSeconds
      : selectedLevel?.roundDurationSeconds ?? 0;
  const isClockWarning =
    phase === "playing" &&
    roundState !== null &&
    roundState.resolutionType === null &&
    roundState.remainingSeconds <= 1;

  const renderChoices =
    phase === "tutorial"
      ? tutorialChoices
      : roundState?.choices ?? [];
  const tutorialDurationForView = Math.max(1, tutorialDurationMs);
  const tutorialTapAtMs = tutorialDurationForView * 0.35;
  const tutorialFlyAtMs = tutorialDurationForView * 0.5;
  const tutorialShowHighlight =
    phase === "tutorial" &&
    tutorialElapsedMs < tutorialFlyAtMs &&
    tutorialCorrectChoiceId !== null;
  const tutorialShowHand =
    phase === "tutorial" &&
    tutorialElapsedMs >= tutorialTapAtMs &&
    tutorialElapsedMs < tutorialFlyAtMs &&
    tutorialCorrectChoiceId !== null;
  const canTapChoices =
    phase === "playing" && roundState?.resolutionType === null;
  const shouldRenderGameplayScreen =
    phase === "tutorial" ||
    phase === "playing" ||
    phase === "sentence_celebration";
  const shouldShowProgressBar =
    phase === "playing" || phase === "sentence_celebration";
  const shouldShowSelectHud = phase === "select";

  const currentProgressHits = progressHits;
  const progressTotalHits = currentProgressHits.reduce((sum, value) => sum + value, 0);
  const progressTargetHits = progressSegments.reduce(
    (sum, segment) => sum + Math.max(1, segment.requiredHits),
    0,
  );
  const hudProgressText = `${progressTotalHits}/${progressTargetHits || "--"}`;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-linear-to-b from-sky-100 via-emerald-50 to-lime-100">
      <AnimatePresence>
        {phase === "sentence_celebration" && <SuccessCelebrationOverlay />}
      </AnimatePresence>

      {shouldShowSelectHud ? (
        <MiniGameTopHud
          mode="simple"
          title={challengeHeaderTitle}
          onBack={handleBack}
          mascotEmotion="happy"
        />
      ) : (
        <div className="sticky top-0 z-30 bg-white/90 pt-safe shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 px-3 pb-3 pt-3">
            <button
              onClick={handleBack}
              className="rounded-xl bg-green-bright p-2.5 text-white shadow ios-button"
              aria-label="Quay lại chọn tầng"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-1">
              <div className="rounded-xl bg-rose-100/95 px-2 py-2">
                <div className="flex justify-center gap-1">
                  {[...Array(Math.max(0, displayedLives || 0))].map((_, index) => (
                    <Heart
                      key={`hud-heart-${index}`}
                      className={`h-4 w-4 ${
                        index < displayedLives
                          ? "fill-rose-400 text-rose-400"
                          : "fill-slate-200 text-slate-300"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white/95 px-2 py-1.5 text-center shadow-sm">
                <p className="truncate font-hp-special text-[1.45rem] font-black leading-[1.22] text-emerald-700 sm:text-[1.62rem]">
                  {hudProgressText}
                </p>
              </div>

              <motion.div
                animate={
                  isClockWarning
                    ? { x: [0, -2.5, 2.5, -1.5, 0] }
                    : { x: 0 }
                }
                transition={
                  isClockWarning
                    ? { duration: 0.28, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0.14, ease: "easeOut" }
                }
                className="rounded-xl bg-amber-100/95 px-2 py-2 text-center"
              >
                <p className="text-base font-black leading-none text-slate-800 sm:text-lg">
                  {formatRoundTime(displayedRoundTime)}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {shouldShowProgressBar && (
        <div className="px-4 pt-3">
          <FeedProgressBar
            segments={progressSegments}
            hits={currentProgressHits}
            pingIndex={progressPingIndex}
          />
        </div>
      )}

      <div className="flex-1 app-scroll overflow-y-auto px-4 pb-safe pt-4">
        {phase === "select" && (
          <div className="mx-auto mt-2 flex w-full max-w-md flex-col gap-3 pb-6">
            <MiniGameLevelSelectPanel
              title={cowGrassConfig.title ?? "Chọn mức độ"}
              description={cowGrassConfig.instruction ?? ""}
              levels={levelSelectCards}
              recentlyUnlockedLevelId={recentlyUnlockedLevelId}
              onSelectLevel={(levelId) => startLevelFlow(levelId as AnimalFeedLevelId)}
              onUnlockLevel={(levelId) =>
                handleUnlockLevel(levelId as AnimalFeedLevelId)
              }
              onRulesAction={() => setShowRulesModal(true)}
            />
          </div>
        )}

        {phase === "countdown" && (
          <MiniGameCountdown
            value={countdownValue}
            hint={
              <p className="text-lg font-semibold text-foreground">
                Chạm đúng bụi{" "}
                <span className="font-hp-special text-3xl font-black text-emerald-600">
                  &quot;{cowGrassConfig.correctWord}&quot;
                </span>
              </p>
            }
          />
        )}

        {shouldRenderGameplayScreen && (
          <div className="mx-auto mt-4 flex w-full max-w-md flex-col pb-6">
            <div className="relative h-[60dvh] min-h-107.5 w-full overflow-hidden rounded-3xl border-4 border-emerald-200 bg-linear-to-b from-lime-100 via-green-100 to-emerald-200 shadow-lg">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/40 via-transparent to-transparent" />
              <div className="pointer-events-none absolute -left-8 bottom-18 h-30 w-30 rounded-full bg-emerald-200/45 blur-xl" />
              <div className="pointer-events-none absolute -right-8 bottom-10 h-34 w-34 rounded-full bg-lime-200/40 blur-xl" />

              {phase === "tutorial" && (
                <div className="pointer-events-none absolute inset-0 z-20 bg-slate-900/45" />
              )}

              <div
                className={`absolute left-1/2 top-[7%] -translate-x-1/2 ${
                  phase === "tutorial" ? "z-30" : "z-10"
                }`}
              >
                <motion.div
                  animate={
                    cowMood === "open"
                      ? { y: [0, 1.5, 0], scale: [1, 1.02, 1] }
                      : cowMood === "chew"
                      ? { y: [0, 2, 0, 1, 0], scale: [1, 1.02, 1] }
                      : cowMood === "sad"
                        ? { rotate: [0, -5, 5, -3, 0], y: [0, 1.5, 0] }
                        : { y: 0, rotate: 0, scale: 1 }
                  }
                  transition={{
                    duration: cowMood === "idle" ? 0.16 : 0.5,
                    repeat: cowMood === "chew" ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                  className={`relative h-36 w-36 rounded-full bg-white/78 p-2 shadow-lg ${
                    phase === "tutorial"
                      ? "ring-4 ring-yellow-300 shadow-[0_0_30px_rgba(251,191,36,0.55)]"
                      : ""
                  }`}
                >
                  <FeedAnimalIcon
                    animalIconId={cowGrassConfig.animalIconId}
                    mood={cowMood}
                  />
                </motion.div>
              </div>

              {renderChoices.map((choice) => {
                const isSelected = roundState?.selectedChoiceId === choice.id;
                const isSelectedWrong =
                  isSelected && roundState?.resolutionType === "wrong";
                const isSelectedCorrect =
                  isSelected && roundState?.resolutionType === "correct";
                const shouldHighlightCorrect =
                  (choice.id === roundState?.correctChoiceId &&
                    (roundState?.hintVisible || roundState?.correctFlashVisible)) ||
                  (tutorialShowHighlight && choice.id === tutorialCorrectChoiceId);
                const showTutorialTap =
                  tutorialShowHand && choice.id === tutorialCorrectChoiceId;
                const disabled = !canTapChoices;

                return (
                  <motion.button
                    key={choice.id}
                    onClick={() => handleChoiceTap(choice.id)}
                    disabled={disabled}
                    className={`absolute bottom-4 flex h-38 w-[44%] items-end justify-center overflow-visible rounded-[46%] border-[3px] px-3 pb-8 text-center shadow-[0_14px_24px_rgba(5,46,22,0.22)] transition ${
                      choice.side === "left" ? "left-[5%]" : "right-[5%]"
                    } ${
                      isSelectedWrong
                        ? "border-rose-500 bg-linear-to-b from-rose-200 via-rose-300 to-rose-500"
                        : "border-emerald-900 bg-linear-to-b from-lime-200 via-emerald-400 to-emerald-700"
                    } ${
                      shouldHighlightCorrect
                        ? "ring-4 ring-yellow-300 shadow-[0_0_18px_rgba(251,191,36,0.75)]"
                        : ""
                    } ${isSelectedCorrect ? "opacity-45" : "opacity-100"} ${
                      disabled ? "cursor-default" : "active:scale-95"
                    } ${phase === "tutorial" && shouldHighlightCorrect ? "z-30" : "z-10"}`}
                    animate={
                      isSelectedWrong
                        ? { x: [0, -8, 8, -5, 0], rotate: [0, -1, 1, -1, 0] }
                        : { x: 0, rotate: 0, scale: 1 }
                    }
                    transition={{ duration: 0.26, ease: "easeInOut" }}
                    aria-label={`Bụi cỏ ${choice.text}`}
                  >
                    <FeedFoodVisual
                      foodVisualId={cowGrassConfig.foodVisualId}
                      text={choice.text}
                    />

                    {showTutorialTap && (
                      <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                          opacity: [0.95, 1, 0.95],
                          y: [0, 6, 0],
                          scale: [1, 1.08, 1],
                        }}
                        transition={{ duration: 0.62, repeat: Infinity }}
                        className="pointer-events-none absolute -top-18 left-1/2 -translate-x-1/2 text-[2.2rem] drop-shadow-[0_0_14px_rgba(255,255,255,0.95)]"
                      >
                        👆
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}

              <AnimatePresence>
                {activeFlight && (
                  <motion.div
                    key={`flight-${activeFlight.id}`}
                    initial={{
                      left: activeFlight.side === "left" ? "25%" : "75%",
                      top: "75%",
                      scale: 1,
                      rotate: 0,
                      opacity: 1,
                    }}
                    animate={{
                      left:
                        activeFlight.side === "left"
                          ? ["25%", "39%", "50%"]
                          : ["75%", "61%", "50%"],
                      top: ["75%", "54%", "31%"],
                      scale: [1, 0.84, 0.48],
                      rotate: [0, -12, 8],
                      opacity: [1, 1, 0.9],
                    }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{ duration: 0.58, ease: "easeInOut" }}
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-700 bg-linear-to-b from-emerald-200 to-emerald-500 px-5 py-2 shadow-lg"
                  >
                    <span className="font-hp-special text-3xl font-black text-emerald-950">
                      {cowGrassConfig.correctWord}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {floatingTexts.map((item) => (
                  <motion.span
                    key={item.id}
                    initial={{ opacity: 1, y: 0, scale: 0.92 }}
                    animate={{ opacity: 0, y: -24, scale: 1.06 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.72, ease: "easeOut" }}
                    className={`pointer-events-none absolute bottom-34 text-lg font-bold ${
                      item.tone === "good" ? "text-emerald-700" : "text-rose-600"
                    } ${item.side === "left" ? "left-[22%]" : "right-[22%]"}`}
                  >
                    {item.label}
                  </motion.span>
                ))}
              </AnimatePresence>

              <AnimatePresence>
                {heartDrops.map((drop) => (
                  <motion.div
                    key={drop.id}
                    initial={{ opacity: 0, y: -8, scale: 0.8 }}
                    animate={{ opacity: [0, 1, 0], y: [0, 22, 48], scale: [0.9, 1, 0.82] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.68, ease: "easeInOut" }}
                    className="pointer-events-none absolute left-6 top-5"
                  >
                    <Heart className="h-6 w-6 fill-rose-400 text-rose-400" />
                  </motion.div>
                ))}
              </AnimatePresence>

              {phase === "sentence_celebration" && (
                <div className="pointer-events-none absolute inset-0 bg-emerald-900/10" />
              )}
            </div>

          </div>
        )}
      </div>

      <AnimatePresence>
        {phase === "sentence_celebration" && (
          <motion.div
            key="sentence-fly"
            initial={{ opacity: 0, y: -24, scale: 0.78 }}
            animate={{ opacity: 1, y: 0, scale: [0.82, 1.14, 1.02] }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.74, ease: "easeOut" }}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="rounded-3xl border-4 border-yellow-200 bg-white/95 px-8 py-5 text-center shadow-[0_0_36px_rgba(251,191,36,0.65)]">
              <p className="font-hp-special text-5xl font-black text-emerald-600">
                {sentenceText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MiniGameRulesModal
        open={showRulesModal}
        rules={cowGrassConfig.rules}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}
