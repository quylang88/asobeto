"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gem, Sparkles, Star } from "lucide-react";
import type {
  LessonContent,
  MemoryFlipCardBackIcon,
  MemoryFlipCardBackOption,
  MemoryFlipCardToken,
  MemoryFlipLevelConfig,
  MemoryFlipLevelId,
  MemoryFlipMoveStarRule,
  World1BookPage,
} from "@/data/game-config";
import {
  getStoredFloorProgress,
  saveFloorProgress,
} from "@/lib/floor-progress";
import { getAppState, setAppState } from "@/services/dbService";
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
import {
  playAppAudio,
  preloadAppAudioList,
  stopAllAppAudio,
} from "@/lib/app-audio";

const LEVEL_ORDER: MemoryFlipLevelId[] = ["easy", "normal", "hard"];
const LEVEL_LABEL: Record<MemoryFlipLevelId, string> = {
  easy: "Dễ",
  normal: "Vừa",
  hard: "Khó",
};
const PASS_EFFECT_HOLD_MS = 1900;
const FAIL_EFFECT_HOLD_MS = 1900;
const CARD_MATCH_CLEAR_DELAY_MS = 320;
const MAX_FAIL_STREAK = 99;

type ChallengePhase = "select" | "countdown" | "tutorial" | "playing" | "result";
type CardStatus = "face_down" | "face_up" | "matched" | "cleared";
type TutorialStep =
  | "highlight-first"
  | "highlight-second"
  | "match-clear"
  | null;

interface MemoryCard {
  id: string;
  pairKey: string;
  matchKey: string;
  text: string;
  kind: "letter" | "word";
  status: CardStatus;
}

interface GameMemoryFlipProps {
  worldId: number;
  world1BookPage?: World1BookPage;
  towerId: number;
  floorId: number;
  floorName: string;
  floorMaxStars: number;
  lesson: LessonContent;
  forcedLevelId?: MemoryFlipLevelId;
  onMysteryRoundResolved?: (result: {
    passed: boolean;
    earnedStars: number;
    levelId: MemoryFlipLevelId;
  }) => void;
  onComplete: () => void;
  onBack: () => void;
}

declare global {
  interface Window {
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

interface ScheduledAction {
  id: number;
  remainingMs: number;
  callback: () => void;
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function fisherYates<T>(items: T[]): T[] {
  const array = [...items];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function resolveLevelPairTarget(
  level: MemoryFlipLevelConfig | null | undefined,
  fallbackPairTarget: number,
): number {
  return clampInteger(level?.pairTarget ?? fallbackPairTarget, 1, 24);
}

function resolveLevelGridColumns(
  level: MemoryFlipLevelConfig | null | undefined,
  fallbackColumns: number,
): number {
  return clampInteger(level?.grid?.columns ?? fallbackColumns, 2, 8);
}

function doesMoveStarRuleMatch(
  rule: MemoryFlipMoveStarRule,
  moves: number,
): boolean {
  if (
    typeof rule.minMovesInclusive === "number" &&
    moves < rule.minMovesInclusive
  ) {
    return false;
  }
  if (
    typeof rule.maxMovesInclusive === "number" &&
    moves > rule.maxMovesInclusive
  ) {
    return false;
  }
  return true;
}

function sumStars(stars: Record<MemoryFlipLevelId, number>): number {
  return stars.easy + stars.normal + stars.hard;
}

function getNextLevelId(levelId: MemoryFlipLevelId): MemoryFlipLevelId | null {
  const index = LEVEL_ORDER.indexOf(levelId);
  if (index < 0 || index >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[index + 1];
}

function isLevelUnlockedByStars(
  levelId: MemoryFlipLevelId,
  stars: Record<MemoryFlipLevelId, number>,
): boolean {
  if (levelId === "easy") return true;
  if (levelId === "normal") return stars.easy > 0;
  return stars.normal > 0;
}

function getLevelStorageKey(
  lessonId: string,
  levelId: MemoryFlipLevelId,
): string {
  return `${lessonId}:${levelId}`;
}

function getTutorialSeenStorageKey(lessonId: string): string {
  return `${lessonId}:memory-flip:tutorial-seen`;
}

function getEasyFailStreakStorageKey(lessonId: string): string {
  return `${lessonId}:memory-flip:easy-fail-streak`;
}

async function readStoredTutorialSeen(lessonId: string): Promise<boolean> {
  const value = await getAppState<boolean>(getTutorialSeenStorageKey(lessonId));
  return value === true;
}

async function readStoredEasyFailStreak(lessonId: string): Promise<number> {
  const value = await getAppState<number>(getEasyFailStreakStorageKey(lessonId));
  return clampInteger(Number(value ?? 0), 0, MAX_FAIL_STREAK);
}

function getInitialLevelStarsFromStoredProgress({
  stored,
  lessonId,
}: {
  stored: Awaited<ReturnType<typeof getStoredFloorProgress>>;
  lessonId: string;
}): Record<MemoryFlipLevelId, number> {
  const emptyStars: Record<MemoryFlipLevelId, number> = {
    easy: 0,
    normal: 0,
    hard: 0,
  };
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

function buildDeck({
  levelId,
  pairTarget,
  tokenPools,
}: {
  levelId: MemoryFlipLevelId;
  pairTarget: number;
  tokenPools: Record<MemoryFlipLevelId, MemoryFlipCardToken[]>;
}): MemoryCard[] {
  const sourcePool = tokenPools[levelId] ?? [];
  const normalizedPool =
    sourcePool.length > 0
      ? sourcePool
      : [{ id: "fallback", text: "?", kind: "letter" as const }];
  const shuffledPool = fisherYates(normalizedPool);
  const selectedPairs = Array.from({ length: pairTarget }, (_, index) => {
    return shuffledPool[index % shuffledPool.length];
  });

  const cards: MemoryCard[] = [];
  selectedPairs.forEach((token, pairIndex) => {
    const pairKey = `${token.id}-${pairIndex + 1}`;
    const matchKey = token.text.trim().toLocaleLowerCase("vi-VN");
    cards.push(
      {
        id: `${pairKey}-a`,
        pairKey,
        matchKey,
        text: token.text,
        kind: token.kind,
        status: "face_down",
      },
      {
        id: `${pairKey}-b`,
        pairKey,
        matchKey,
        text: token.text,
        kind: token.kind,
        status: "face_down",
      },
    );
  });

  return fisherYates(cards);
}

function pickRandomCardBackOption(
  options: MemoryFlipCardBackOption[],
): MemoryFlipCardBackOption {
  if (!options.length) {
    return {
      id: "fallback-holo",
      label: "Holo",
      icon: "diamond",
      gradientFrom: "#38bdf8",
      gradientTo: "#2563eb",
      stripeColor: "rgba(255,255,255,0.25)",
      iconColor: "#ffffff",
      ringColor: "rgba(255,255,255,0.8)",
    };
  }
  const index = Math.floor(Math.random() * options.length);
  return options[index] ?? options[0];
}

function CardBackIcon({
  icon,
  color,
}: {
  icon: MemoryFlipCardBackIcon;
  color: string;
}) {
  if (icon === "star") {
    return <Star className="h-8 w-8" style={{ color }} />;
  }
  if (icon === "sparkle") {
    return <Sparkles className="h-8 w-8" style={{ color }} />;
  }
  return <Gem className="h-8 w-8" style={{ color }} />;
}

export function GameMemoryFlip({
  worldId,
  world1BookPage = 1,
  towerId,
  floorId,
  floorName,
  floorMaxStars,
  lesson,
  forcedLevelId,
  onMysteryRoundResolved,
  onBack,
}: GameMemoryFlipProps) {
  const memoryConfig = lesson.memoryFlipGame;
  const levelList = useMemo(() => memoryConfig?.levels ?? [], [memoryConfig]);
  const levelMap = useMemo(
    () => new Map(levelList.map((level) => [level.id, level])),
    [levelList],
  );
  const defaultPairTarget = memoryConfig?.pairTarget ?? 8;
  const defaultGridColumns = memoryConfig?.grid?.columns ?? 4;
  const challengeHeaderTitle = memoryConfig?.headerTitle?.trim() || floorName;

  const [phase, setPhase] = useState<ChallengePhase>("select");
  const [selectedLevelId, setSelectedLevelId] =
    useState<MemoryFlipLevelId | null>("easy");
  const [countdownValue, setCountdownValue] = useState(3);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsCleared, setPairsCleared] = useState(0);
  const [didPass, setDidPass] = useState<boolean | null>(null);
  const [lastEarnedStars, setLastEarnedStars] = useState(0);
  const [boardLocked, setBoardLocked] = useState(true);
  const [isBoardShaking, setIsBoardShaking] = useState(false);
  const [passCelebrationStars, setPassCelebrationStars] = useState(0);
  const [showFailCelebration, setShowFailCelebration] = useState(false);
  const [recentlyUnlockedLevelId, setRecentlyUnlockedLevelId] =
    useState<MemoryFlipLevelId | null>(null);
  const [pendingUnlockLevelId, setPendingUnlockLevelId] =
    useState<MemoryFlipLevelId | null>(null);
  const [activeBackOption, setActiveBackOption] =
    useState<MemoryFlipCardBackOption | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [boardWidthPx, setBoardWidthPx] = useState<number | null>(null);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(null);
  const [tutorialPairIds, setTutorialPairIds] = useState<[string, string] | null>(
    null,
  );
  const [hasSeenEasyTutorial, setHasSeenEasyTutorial] = useState(false);
  const [easyFailStreak, setEasyFailStreak] = useState(0);
  const [levelStars, setLevelStars] = useState<Record<MemoryFlipLevelId, number>>(
    {
      easy: 0,
      normal: 0,
      hard: 0,
    },
  );

  const currentLevelRef = useRef<MemoryFlipLevelConfig | null>(null);
  const phaseRef = useRef<ChallengePhase>("select");
  const cardsRef = useRef<MemoryCard[]>([]);
  const selectedCardIdsRef = useRef<string[]>([]);
  const movesRef = useRef(0);
  const pairsClearedRef = useRef(0);
  const boardLockedRef = useRef(false);
  const scheduledActionsRef = useRef<ScheduledAction[]>([]);
  const scheduledActionIdRef = useRef(1);
  const countdownActionIdRef = useRef<number | null>(null);
  const mismatchActionIdRef = useRef<number | null>(null);
  const matchActionIdRef = useRef<number | null>(null);
  const passActionIdRef = useRef<number | null>(null);
  const failActionIdRef = useRef<number | null>(null);
  const shakeActionIdRef = useRef<number | null>(null);
  const tutorialActionIdsRef = useRef<number[]>([]);
  const forcedLevelBootedRef = useRef(false);
  const mysteryResultReportedRef = useRef(false);

  const selectedLevel = selectedLevelId
    ? (levelMap.get(selectedLevelId) ?? null)
    : null;
  const selectedPairTarget = resolveLevelPairTarget(
    selectedLevel,
    defaultPairTarget,
  );
  const selectedGridColumns = resolveLevelGridColumns(
    selectedLevel,
    defaultGridColumns,
  );
  const selectedGridRows = clampInteger(
    selectedLevel?.grid?.rows ??
      Math.ceil(selectedPairTarget / selectedGridColumns),
    1,
    12,
  );
  useEffect(() => {
    if (!memoryConfig?.audio) return;
    preloadAppAudioList([
      memoryConfig.audio.flip,
      memoryConfig.audio.match,
      memoryConfig.audio.mismatch,
    ]);
  }, [memoryConfig]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const [storedFloorProgress, storedTutorialSeen, storedFailStreak] =
        await Promise.all([
          getStoredFloorProgress(
            {
              worldId,
              world1BookPage,
              towerId,
              floorId,
            },
            floorMaxStars,
          ),
          readStoredTutorialSeen(lesson.id),
          readStoredEasyFailStreak(lesson.id),
        ]);

      if (cancelled) return;

      setLevelStars(
        getInitialLevelStarsFromStoredProgress({
          stored: storedFloorProgress,
          lessonId: lesson.id,
        }),
      );
      setHasSeenEasyTutorial(storedTutorialSeen);
      setEasyFailStreak(storedFailStreak);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [floorId, floorMaxStars, lesson.id, towerId, world1BookPage, worldId]);

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
    const remainingActions: ScheduledAction[] = [];
    for (const action of scheduledActionsRef.current) {
      const remainingMs = action.remainingMs - deltaMs;
      if (remainingMs <= 0) {
        dueCallbacks.push(action.callback);
      } else {
        remainingActions.push({
          ...action,
          remainingMs,
        });
      }
    }
    scheduledActionsRef.current = remainingActions;
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

  const clearTutorialActions = useCallback(() => {
    tutorialActionIdsRef.current.forEach((actionId) =>
      clearScheduledAction(actionId),
    );
    tutorialActionIdsRef.current = [];
  }, [clearScheduledAction]);

  const clearRoundActions = useCallback(() => {
    clearScheduledAction(mismatchActionIdRef.current);
    clearScheduledAction(matchActionIdRef.current);
    clearScheduledAction(passActionIdRef.current);
    clearScheduledAction(failActionIdRef.current);
    clearScheduledAction(shakeActionIdRef.current);
    mismatchActionIdRef.current = null;
    matchActionIdRef.current = null;
    passActionIdRef.current = null;
    failActionIdRef.current = null;
    shakeActionIdRef.current = null;
    clearTutorialActions();
  }, [clearScheduledAction, clearTutorialActions]);

  const setBoardLock = useCallback((locked: boolean) => {
    boardLockedRef.current = locked;
    setBoardLocked(locked);
  }, []);

  const syncBoardState = useCallback(() => {
    setCards([...cardsRef.current]);
    setMoves(movesRef.current);
    setPairsCleared(pairsClearedRef.current);
  }, []);

  const playSfx = useCallback((audioSrc?: string | null) => {
    const src = audioSrc?.trim();
    if (!src) return;
    playAppAudio(src, {
      allowOverlap: true,
      retries: 1,
      retryDelayMs: 80,
    });
  }, []);

  const isLevelUnlocked = useCallback(
    (levelId: MemoryFlipLevelId) => {
      if (pendingUnlockLevelId === levelId) return false;
      if (levelId === "easy") return true;
      if (levelId === "normal") return levelStars.easy > 0;
      return levelStars.normal > 0;
    },
    [levelStars.easy, levelStars.normal, pendingUnlockLevelId],
  );

  const persistProgress = useCallback(
    (nextLevelStars: Record<MemoryFlipLevelId, number>) => {
      const normalized: Record<MemoryFlipLevelId, number> = {
        easy: clampInteger(nextLevelStars.easy, 0, 1),
        normal: clampInteger(nextLevelStars.normal, 0, 2),
        hard: clampInteger(nextLevelStars.hard, 0, 3),
      };
      const mergedStars = Math.min(floorMaxStars, sumStars(normalized));
      void saveFloorProgress({
        worldId,
        world1BookPage,
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
    [floorId, floorMaxStars, lesson.id, towerId, world1BookPage, worldId],
  );

  const persistEasyTutorialSeen = useCallback(
    (seen: boolean) => {
      void setAppState(getTutorialSeenStorageKey(lesson.id), seen);
      setHasSeenEasyTutorial(seen);
    },
    [lesson.id],
  );

  const persistEasyFailStreak = useCallback(
    (streak: number) => {
      const normalized = clampInteger(streak, 0, MAX_FAIL_STREAK);
      void setAppState(getEasyFailStreakStorageKey(lesson.id), normalized);
      setEasyFailStreak(normalized);
    },
    [lesson.id],
  );

  const getEarnedStarsOnPass = useCallback((level: MemoryFlipLevelConfig) => {
    const moveCount = movesRef.current;
    if (!level.passStarRules?.length) return level.starsReward;

    for (const rule of level.passStarRules) {
      if (!doesMoveStarRuleMatch(rule, moveCount)) continue;
      return clampInteger(rule.stars, 1, level.starsReward);
    }
    return 1;
  }, []);

  const finalizeLevel = useCallback(
    (passed: boolean, level: MemoryFlipLevelConfig, starsOnPass: number) => {
      clearRoundActions();
      setBoardLock(true);
      setPhase("result");
      setDidPass(passed);
      setLastEarnedStars(passed ? starsOnPass : 0);
      setPassCelebrationStars(0);
      setShowFailCelebration(false);
      setIsBoardShaking(false);
      setTutorialStep(null);
      setTutorialPairIds(null);

      if (level.id === memoryConfig?.tutorial.enabledLevelId) {
        if (passed) {
          persistEasyFailStreak(0);
        } else {
          persistEasyFailStreak(easyFailStreak + 1);
        }
      }

      if (!passed) return;

      setLevelStars((previous) => {
        const next = {
          ...previous,
          [level.id]: Math.max(previous[level.id], starsOnPass),
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
      clearRoundActions,
      easyFailStreak,
      memoryConfig?.tutorial.enabledLevelId,
      persistEasyFailStreak,
      persistProgress,
      setBoardLock,
    ],
  );

  const triggerLevelPass = useCallback(
    (level: MemoryFlipLevelConfig) => {
      clearRoundActions();
      setBoardLock(true);
      const earnedStars = getEarnedStarsOnPass(level);
      setShowFailCelebration(false);
      setPassCelebrationStars(earnedStars);
      passActionIdRef.current = scheduleAction(PASS_EFFECT_HOLD_MS, () => {
        passActionIdRef.current = null;
        finalizeLevel(true, level, earnedStars);
      });
    },
    [
      clearRoundActions,
      finalizeLevel,
      getEarnedStarsOnPass,
      scheduleAction,
      setBoardLock,
    ],
  );

  const triggerLevelFail = useCallback(
    (level: MemoryFlipLevelConfig) => {
      clearRoundActions();
      setBoardLock(true);
      setPassCelebrationStars(0);
      setShowFailCelebration(true);
      failActionIdRef.current = scheduleAction(FAIL_EFFECT_HOLD_MS, () => {
        failActionIdRef.current = null;
        finalizeLevel(false, level, 0);
      });
    },
    [clearRoundActions, finalizeLevel, scheduleAction, setBoardLock],
  );

  const startPlayingLevel = useCallback(
    (level: MemoryFlipLevelConfig) => {
      if (!memoryConfig) return;
      clearRoundActions();
      const levelPairTarget = resolveLevelPairTarget(level, defaultPairTarget);
      const deck = buildDeck({
        levelId: level.id,
        pairTarget: levelPairTarget,
        tokenPools: memoryConfig.levelTokenPools,
      });
      cardsRef.current = deck;
      selectedCardIdsRef.current = [];
      movesRef.current = 0;
      pairsClearedRef.current = 0;
      setBoardLock(false);
      currentLevelRef.current = level;

      setCards(deck);
      setMoves(0);
      setPairsCleared(0);
      setDidPass(null);
      setLastEarnedStars(0);
      setTutorialStep(null);
      setTutorialPairIds(null);
      setPassCelebrationStars(0);
      setShowFailCelebration(false);
      setIsBoardShaking(false);
      setActiveBackOption(
        pickRandomCardBackOption(memoryConfig.cardBackOptions),
      );
      setPhase("playing");
    },
    [clearRoundActions, defaultPairTarget, memoryConfig, setBoardLock],
  );

  const startTutorialThenPlay = useCallback(
    (level: MemoryFlipLevelConfig) => {
      if (!memoryConfig) return;
      clearRoundActions();
      const levelPairTarget = resolveLevelPairTarget(level, defaultPairTarget);
      const tutorialDeck = buildDeck({
        levelId: level.id,
        pairTarget: levelPairTarget,
        tokenPools: memoryConfig.levelTokenPools,
      });
      const pairMap = new Map<string, string[]>();
      tutorialDeck.forEach((card) => {
        const existing = pairMap.get(card.matchKey) ?? [];
        pairMap.set(card.matchKey, [...existing, card.id]);
      });
      const firstPair =
        [...pairMap.values()].find((ids) => ids.length >= 2) ?? [];
      const firstCardId = firstPair[0];
      const secondCardId = firstPair[1];
      if (!firstCardId || !secondCardId) {
        startPlayingLevel(level);
        return;
      }

      cardsRef.current = tutorialDeck;
      selectedCardIdsRef.current = [];
      movesRef.current = 0;
      pairsClearedRef.current = 0;
      setBoardLock(true);
      currentLevelRef.current = level;

      setCards(tutorialDeck);
      setMoves(0);
      setPairsCleared(0);
      setDidPass(null);
      setLastEarnedStars(0);
      setTutorialPairIds([firstCardId, secondCardId]);
      setTutorialStep("highlight-first");
      setPassCelebrationStars(0);
      setShowFailCelebration(false);
      setIsBoardShaking(false);
      setActiveBackOption(
        pickRandomCardBackOption(memoryConfig.cardBackOptions),
      );
      setPhase("tutorial");

      if (!hasSeenEasyTutorial) {
        persistEasyTutorialSeen(true);
      }
      if (easyFailStreak >= memoryConfig.tutorial.replayAfterFailCount) {
        persistEasyFailStreak(0);
      }

      const addTutorialAction = (delayMs: number, action: () => void) => {
        const actionId = scheduleAction(delayMs, action);
        tutorialActionIdsRef.current = [...tutorialActionIdsRef.current, actionId];
      };

      addTutorialAction(240, () => {
        cardsRef.current = cardsRef.current.map((card) =>
          card.id === firstCardId ? { ...card, status: "face_up" } : card,
        );
        setTutorialStep("highlight-second");
        playSfx(memoryConfig.audio.flip);
        syncBoardState();
      });

      addTutorialAction(760, () => {
        cardsRef.current = cardsRef.current.map((card) =>
          card.id === secondCardId ? { ...card, status: "face_up" } : card,
        );
        playSfx(memoryConfig.audio.flip);
        syncBoardState();
      });

      addTutorialAction(1120, () => {
        cardsRef.current = cardsRef.current.map((card) =>
          card.id === firstCardId || card.id === secondCardId
            ? { ...card, status: "matched" }
            : card,
        );
        setTutorialStep("match-clear");
        playSfx(memoryConfig.audio.match);
        syncBoardState();
      });

      addTutorialAction(1480, () => {
        cardsRef.current = cardsRef.current.map((card) =>
          card.id === firstCardId || card.id === secondCardId
            ? { ...card, status: "cleared" }
            : card,
        );
        syncBoardState();
      });

      addTutorialAction(1820, () => {
        clearTutorialActions();
        startPlayingLevel(level);
      });
    },
    [
      clearRoundActions,
      clearTutorialActions,
      easyFailStreak,
      hasSeenEasyTutorial,
      memoryConfig,
      defaultPairTarget,
      persistEasyFailStreak,
      persistEasyTutorialSeen,
      playSfx,
      scheduleAction,
      setBoardLock,
      startPlayingLevel,
      syncBoardState,
    ],
  );

  const startLevelCountdown = useCallback(
    (
      levelId: MemoryFlipLevelId,
      options: {
        ignoreUnlock?: boolean;
      } = {},
    ) => {
      if (!memoryConfig) return;
      if (!options.ignoreUnlock && !isLevelUnlocked(levelId)) return;
      const level = levelMap.get(levelId);
      if (!level) return;

      const beginCountdown = () => {
        clearRoundActions();
        mysteryResultReportedRef.current = false;
        setSelectedLevelId(levelId);
        setCountdownValue(3);
        setDidPass(null);
        setLastEarnedStars(0);
        setTutorialStep(null);
        setTutorialPairIds(null);
        setBoardLock(true);
        setPhase("countdown");
      };

      beginCountdown();
    },
    [
      clearRoundActions,
      isLevelUnlocked,
      levelMap,
      memoryConfig,
      setBoardLock,
    ],
  );

  const handleUnlockLevel = useCallback(
    (levelId: MemoryFlipLevelId) => {
      if (pendingUnlockLevelId !== levelId) return;
      setPendingUnlockLevelId(null);
      setRecentlyUnlockedLevelId(levelId);
      const unlockActionId = scheduleAction(900, () => {
        setRecentlyUnlockedLevelId(null);
      });
      tutorialActionIdsRef.current = [...tutorialActionIdsRef.current, unlockActionId];
    },
    [pendingUnlockLevelId, scheduleAction],
  );

  useEffect(() => {
    if (!forcedLevelId || forcedLevelBootedRef.current) return;
    if (!levelMap.has(forcedLevelId)) return;
    forcedLevelBootedRef.current = true;
    startLevelCountdown(forcedLevelId, { ignoreUnlock: true });
  }, [forcedLevelId, levelMap, startLevelCountdown]);

  useEffect(() => {
    if (
      !onMysteryRoundResolved ||
      phase !== "result" ||
      didPass === null ||
      !selectedLevel ||
      mysteryResultReportedRef.current
    ) {
      return;
    }
    mysteryResultReportedRef.current = true;
    onMysteryRoundResolved({
      passed: didPass,
      earnedStars: lastEarnedStars,
      levelId: selectedLevel.id,
    });
  }, [
    didPass,
    lastEarnedStars,
    onMysteryRoundResolved,
    phase,
    selectedLevel,
  ]);

  const handleCardTap = useCallback(
    (cardId: string) => {
      const level = currentLevelRef.current;
      if (!memoryConfig || !level) return;
      if (phaseRef.current !== "playing") return;
      if (boardLockedRef.current) return;

      const cardIndex = cardsRef.current.findIndex((card) => card.id === cardId);
      if (cardIndex < 0) return;
      const card = cardsRef.current[cardIndex];
      if (card.status !== "face_down") return;

      cardsRef.current = cardsRef.current.map((item) =>
        item.id === cardId ? { ...item, status: "face_up" } : item,
      );
      selectedCardIdsRef.current = [...selectedCardIdsRef.current, cardId];
      playSfx(memoryConfig.audio.flip);
      setCards([...cardsRef.current]);

      if (selectedCardIdsRef.current.length < 2) return;

      const [firstCardId, secondCardId] = selectedCardIdsRef.current;
      if (!firstCardId || !secondCardId) return;
      if (firstCardId === secondCardId) return;

      movesRef.current += 1;
      setMoves(movesRef.current);
      setBoardLock(true);

      if (movesRef.current > level.moveLimit) {
        triggerLevelFail(level);
        return;
      }

      const firstCard = cardsRef.current.find((item) => item.id === firstCardId);
      const secondCard = cardsRef.current.find((item) => item.id === secondCardId);
      if (!firstCard || !secondCard) {
        selectedCardIdsRef.current = [];
        setBoardLock(false);
        return;
      }

      if (firstCard.matchKey === secondCard.matchKey) {
        cardsRef.current = cardsRef.current.map((item) =>
          item.id === firstCardId || item.id === secondCardId
            ? { ...item, status: "matched" }
            : item,
        );
        playSfx(memoryConfig.audio.match);
        setCards([...cardsRef.current]);
        matchActionIdRef.current = scheduleAction(CARD_MATCH_CLEAR_DELAY_MS, () => {
          matchActionIdRef.current = null;
          cardsRef.current = cardsRef.current.map((item) =>
            item.id === firstCardId || item.id === secondCardId
              ? { ...item, status: "cleared" }
              : item,
          );
          selectedCardIdsRef.current = [];
          setBoardLock(false);
          pairsClearedRef.current += 1;
          syncBoardState();

          if (
            pairsClearedRef.current >=
            resolveLevelPairTarget(level, defaultPairTarget)
          ) {
            triggerLevelPass(level);
          }
        });
        return;
      }

      playSfx(memoryConfig.audio.mismatch);
      setIsBoardShaking(true);
      clearScheduledAction(shakeActionIdRef.current);
      shakeActionIdRef.current = scheduleAction(240, () => {
        shakeActionIdRef.current = null;
        setIsBoardShaking(false);
      });

      if ("vibrate" in navigator) {
        navigator.vibrate(30);
      }

      const flipBackDelay = randomBetween(
        memoryConfig.tutorial.mismatchFlipBackDelayMs.min,
        memoryConfig.tutorial.mismatchFlipBackDelayMs.max,
      );
      mismatchActionIdRef.current = scheduleAction(flipBackDelay, () => {
        mismatchActionIdRef.current = null;
        cardsRef.current = cardsRef.current.map((item) =>
          item.id === firstCardId || item.id === secondCardId
            ? { ...item, status: "face_down" }
            : item,
        );
        selectedCardIdsRef.current = [];
        setBoardLock(false);
        syncBoardState();
      });
    },
    [
      clearScheduledAction,
      defaultPairTarget,
      memoryConfig,
      playSfx,
      scheduleAction,
      setBoardLock,
      syncBoardState,
      triggerLevelFail,
      triggerLevelPass,
    ],
  );

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    let animationFrameId = 0;
    let lastTime = performance.now();
    const loop = (timestamp: number) => {
      const deltaMs = Math.min(64, timestamp - lastTime);
      lastTime = timestamp;
      flushScheduledActions(deltaMs);
      animationFrameId = window.requestAnimationFrame(loop);
    };
    animationFrameId = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [flushScheduledActions]);

  useEffect(() => {
    clearScheduledAction(countdownActionIdRef.current);
    countdownActionIdRef.current = null;
    if (phase !== "countdown" || !selectedLevel) return;

    countdownActionIdRef.current = scheduleAction(900, () => {
      countdownActionIdRef.current = null;
      if (countdownValue <= 1) {
        const shouldShowTutorial =
          selectedLevel.id === memoryConfig?.tutorial.enabledLevelId &&
          (!hasSeenEasyTutorial ||
            easyFailStreak >= memoryConfig.tutorial.replayAfterFailCount);
        if (shouldShowTutorial) {
          startTutorialThenPlay(selectedLevel);
          return;
        }
        startPlayingLevel(selectedLevel);
        return;
      }
      setCountdownValue((current) => current - 1);
    });
  }, [
    clearScheduledAction,
    countdownValue,
    easyFailStreak,
    hasSeenEasyTutorial,
    memoryConfig?.tutorial.enabledLevelId,
    memoryConfig?.tutorial.replayAfterFailCount,
    phase,
    scheduleAction,
    selectedLevel,
    startPlayingLevel,
    startTutorialThenPlay,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.render_game_to_text = () => {
      const payload = {
        mode: phaseRef.current,
        coordinateSystem:
          "grid index starts at top-left, row-major order; rows grow downward, columns to the right",
        level: currentLevelRef.current?.id ?? selectedLevelId,
        moveLimit:
          currentLevelRef.current?.moveLimit ?? selectedLevel?.moveLimit ?? 0,
        moves: movesRef.current,
        pairsCleared: pairsClearedRef.current,
        pairTarget: resolveLevelPairTarget(currentLevelRef.current, defaultPairTarget),
        boardLocked: boardLockedRef.current,
        tutorialStep,
        cards: cardsRef.current.map((card, index) => ({
          id: card.id,
          index,
          text: card.text,
          pairKey: card.pairKey,
          matchKey: card.matchKey,
          status: card.status,
        })),
      };
      return JSON.stringify(payload);
    };

    window.advanceTime = (ms: number) => {
      advanceScheduledTime(ms);
    };

    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
    };
  }, [
    advanceScheduledTime,
    defaultPairTarget,
    selectedLevel,
    selectedLevelId,
    tutorialStep,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (phase !== "playing" && phase !== "tutorial") return;

    const CARD_GAP_PX = 10;
    const BOARD_PADDING_PX = 20;
    const VIEWPORT_HORIZONTAL_PADDING_PX = 32;
    const RESERVED_VERTICAL_SPACE_PX = 220;

    const updateBoardWidth = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const maxBoardWidthByViewport = Math.max(
        220,
        viewportWidth - VIEWPORT_HORIZONTAL_PADDING_PX,
      );
      const availableHeight = Math.max(
        220,
        viewportHeight - RESERVED_VERTICAL_SPACE_PX,
      );
      const cardSizeByHeight =
        (availableHeight -
          BOARD_PADDING_PX -
          CARD_GAP_PX * (selectedGridRows - 1)) /
        selectedGridRows;
      const widthByHeight =
        BOARD_PADDING_PX +
        cardSizeByHeight * selectedGridColumns +
        CARD_GAP_PX * (selectedGridColumns - 1);
      const nextWidth = Math.floor(
        Math.max(220, Math.min(maxBoardWidthByViewport, widthByHeight)),
      );
      setBoardWidthPx(nextWidth);
    };

    updateBoardWidth();
    window.addEventListener("resize", updateBoardWidth);
    return () => {
      window.removeEventListener("resize", updateBoardWidth);
    };
  }, [phase, selectedGridColumns, selectedGridRows]);

  useEffect(() => {
    return () => {
      clearRoundActions();
      clearScheduledAction(countdownActionIdRef.current);
      setBoardLock(true);
      scheduledActionsRef.current = [];
      stopAllAppAudio();
    };
  }, [clearRoundActions, clearScheduledAction, setBoardLock]);
  const handleBack = useCallback(() => {
    stopAllAppAudio();
    onBack();
  }, [onBack]);

  if (!memoryConfig || levelList.length === 0) {
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
    return (
      <LessonCompletionView
        stars={lastEarnedStars}
        score={pairsCleared}
        activeLessonsCount={selectedPairTarget}
        activeLessonsTotalStars={selectedLevel.starsReward}
        floorMaxStars={selectedLevel.starsReward}
        successSummary={`Bé đã hoàn thành mức ${LEVEL_LABEL[selectedLevel.id]} với ${moves} lượt!`}
        failSummary={`Bé vượt quá ${selectedLevel.moveLimit} lượt. Mình thử lại mức ${LEVEL_LABEL[selectedLevel.id]} nhé!`}
        continueLabel="Tiếp Tục"
        onComplete={() => {
          clearRoundActions();
          cardsRef.current = [];
          selectedCardIdsRef.current = [];
          movesRef.current = 0;
          pairsClearedRef.current = 0;
          setDidPass(null);
          setCards([]);
          setMoves(0);
          setPairsCleared(0);
          setBoardLock(true);
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
      subtitle: `${resolveLevelPairTarget(level, defaultPairTarget)} cặp • tối đa ${level.moveLimit} lượt`,
      starsReward: level.starsReward,
      earnedStars: levelStars[level.id],
      unlocked: isLevelUnlocked(level.id),
      pendingUnlock: pendingUnlockLevelId === level.id,
      actionLabel: "Chơi",
    };
  }).filter((level): level is NonNullable<typeof level> => level !== null);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-linear-to-b from-rose-100 via-amber-50 to-cyan-100">
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
        onBack={handleBack}
        mascotEmotion={
          phase === "playing" || phase === "tutorial"
            ? "excited"
            : didPass === false
              ? "thinking"
              : "happy"
        }
        leftLabel="Pairs"
        leftValue={`${pairsCleared}/${selectedPairTarget}`}
        rightLabel="Moves"
        rightValue={`${moves} lần`}
        leftToneClassName="bg-cyan-100/90 text-cyan-700"
        rightToneClassName="bg-amber-100/90 text-amber-700"
      />

      <div
        className={`relative flex-1 px-4 pb-safe pt-4 ${
          phase === "select" ? "app-scroll overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {phase === "select" && (
          <MiniGameLevelSelectPanel
            title={memoryConfig.title ?? "Chọn mức độ"}
            description={memoryConfig.instruction ?? ""}
            levels={levelSelectCards}
            recentlyUnlockedLevelId={recentlyUnlockedLevelId}
            onSelectLevel={(levelId) =>
              startLevelCountdown(levelId as MemoryFlipLevelId)
            }
            onUnlockLevel={(levelId) =>
              handleUnlockLevel(levelId as MemoryFlipLevelId)
            }
            onRulesAction={() => setShowRulesModal(true)}
          />
        )}

        {(phase === "countdown" || phase === "tutorial" || phase === "playing") && (
          <div className="mx-auto flex w-full max-w-md flex-col pb-3">
            {phase === "countdown" && (
              <MiniGameCountdown
                value={countdownValue}
                hint={
                  <p className="text-lg font-semibold text-foreground">
                    Sẵn sàng lật thẻ nào!
                  </p>
                }
              />
            )}

            {(phase === "tutorial" || phase === "playing") && (
              <motion.div
                animate={isBoardShaking ? { x: [0, -4, 4, -3, 0] } : { x: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="mt-2"
              >
                <div
                  className="mx-auto rounded-3xl border-4 border-cyan-200/80 bg-white/70 p-2.5 shadow-lg"
                  style={{
                    width: boardWidthPx ? `${boardWidthPx}px` : undefined,
                    maxWidth: "100%",
                  }}
                >
                  <div
                    className="grid gap-2.5 sm:gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${selectedGridColumns}, minmax(0, 1fr))`,
                    }}
                  >
                    {cards.map((card) => {
                      const isFaceUp = card.status !== "face_down";
                      const isMatched = card.status === "matched";
                      const isCleared = card.status === "cleared";
                      const isTutorialHighlight =
                        phase === "tutorial" &&
                        tutorialPairIds &&
                        ((tutorialStep === "highlight-first" &&
                          card.id === tutorialPairIds[0]) ||
                          (tutorialStep === "highlight-second" &&
                            (card.id === tutorialPairIds[0] ||
                              card.id === tutorialPairIds[1])) ||
                          (tutorialStep === "match-clear" &&
                            (card.id === tutorialPairIds[0] ||
                              card.id === tutorialPairIds[1])));
                      const cardBack = activeBackOption;

                      return (
                        <motion.button
                          key={card.id}
                          type="button"
                          onClick={() => handleCardTap(card.id)}
                          disabled={
                            phase !== "playing" || isCleared || boardLocked
                          }
                          className={`relative aspect-square min-h-14 w-full rounded-2xl transition-all ${
                            isCleared
                              ? "pointer-events-none"
                              : "cursor-pointer active:scale-95"
                          } ${
                            isTutorialHighlight
                              ? "ring-4 ring-yellow-300 ring-offset-2 ring-offset-white"
                              : ""
                          }`}
                          animate={
                            isCleared
                              ? { scale: 0.8, opacity: 0.04 }
                              : { scale: 1, opacity: 1 }
                          }
                          transition={{ duration: 0.28, ease: "easeOut" }}
                        >
                          <span
                            className="relative block h-full w-full rounded-2xl transition-transform duration-300"
                            style={{
                              transformStyle: "preserve-3d",
                              WebkitTransformStyle: "preserve-3d",
                              transform: isFaceUp ? "rotateY(180deg)" : "rotateY(0deg)",
                            }}
                          >
                            <span
                              className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 shadow"
                              style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                borderColor: cardBack?.ringColor ?? "rgba(255,255,255,0.82)",
                                backgroundImage: `linear-gradient(135deg, ${cardBack?.gradientFrom ?? "#38bdf8"} 0%, ${cardBack?.gradientTo ?? "#2563eb"} 100%)`,
                              }}
                            >
                              <span
                                className="pointer-events-none absolute inset-0 rounded-2xl"
                                style={{
                                  backgroundImage: `repeating-linear-gradient(135deg, transparent 0px, transparent 9px, ${cardBack?.stripeColor ?? "rgba(255,255,255,0.24)"} 10px, ${cardBack?.stripeColor ?? "rgba(255,255,255,0.24)"} 14px)`,
                                }}
                              />
                              <span
                                className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white/15 backdrop-blur-sm"
                                style={{
                                  borderColor:
                                    cardBack?.ringColor ?? "rgba(255,255,255,0.72)",
                                }}
                              >
                                <CardBackIcon
                                  icon={cardBack?.icon ?? "diamond"}
                                  color={cardBack?.iconColor ?? "#ffffff"}
                                />
                              </span>
                            </span>

                            <span
                              className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-amber-200 bg-linear-to-b from-white to-amber-50 shadow-sm"
                              style={{
                                backfaceVisibility: "hidden",
                                WebkitBackfaceVisibility: "hidden",
                                transform: "rotateY(180deg)",
                              }}
                            >
                              <span
                                className={`font-hp-special text-slate-900 ${
                                  card.kind === "word"
                                    ? "translate-y-[6%] text-3xl leading-[1.12] sm:text-4xl"
                                    : "translate-y-[8%] text-5xl leading-[1.08] sm:text-6xl"
                                }`}
                              >
                                {card.text}
                              </span>
                            </span>
                          </span>

                          <AnimatePresence>
                            {isMatched && (
                              <motion.span
                                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                initial={{ opacity: 0, scale: 0.7 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.2 }}
                                transition={{ duration: 0.24 }}
                              >
                                <Sparkles className="h-8 w-8 text-yellow-300" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      <MiniGameRulesModal
        open={showRulesModal}
        rules={memoryConfig.rules}
        onClose={() => setShowRulesModal(false)}
      />

      <AnimatePresence>
        {phase === "tutorial" && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-25 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
