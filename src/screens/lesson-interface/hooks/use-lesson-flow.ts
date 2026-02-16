"use client";

import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { saveFloorProgress } from "@/lib/floor-progress";
import { getScoringConfig } from "@/data/scoring-utils";
import type { LessonAnswer, LessonContent } from "@/data/game-config";
import type { TraceEvaluation } from "../components";
import {
  FEEDBACK_ADVANCE_DELAY_MS,
  TRACE_STARS_ADVANCE_DELAY_MS,
} from "../constants";
import {
  getAttemptFloorStars,
  getLessonMaxStars,
  getWordBuildStateForLesson,
} from "../utils";

interface UseLessonFlowParams {
  worldId: number;
  towerId: number;
  floorId: number;
  floorMaxStars: number;
  lessons: LessonContent[];
  hasLessons: boolean;
  currentLesson: LessonContent | undefined;
  currentStep: number;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  isWordBuildLesson: boolean;
  isWordBuildReady: boolean;
  isTracePracticeLesson: boolean;
  isBossTower?: boolean;
  wordBuildSlotTokenIds: Array<string | null>;
  lessonStarsThisAttemptRef: RefObject<Record<string, number>>;
  stopAudio: () => void;
  playCelebrationFeedback: (correct: boolean) => void;
  resetSpeechSession: () => void;
  resetWordBuildDragState: () => void;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setSelectedAnswer: Dispatch<SetStateAction<string | null>>;
  setIsCorrect: Dispatch<SetStateAction<boolean | null>>;
  setScore: Dispatch<SetStateAction<number>>;
  setLessonStarsThisAttempt: Dispatch<SetStateAction<Record<string, number>>>;
  setCompletionStars: Dispatch<SetStateAction<number | null>>;
  setShowCompletion: Dispatch<SetStateAction<boolean>>;
  setTraceResult: Dispatch<SetStateAction<TraceEvaluation | null>>;
  setTraceDemoReplayKey: Dispatch<SetStateAction<number>>;
  setTraceDemoFastForwarded: Dispatch<SetStateAction<boolean>>;
  setCelebrationStars: Dispatch<SetStateAction<number | null>>;
  setPassiveReady: Dispatch<SetStateAction<boolean>>;
  setWordBuildTokenOrder: Dispatch<SetStateAction<string[]>>;
  setWordBuildSlotTokenIds: Dispatch<SetStateAction<Array<string | null>>>;
}

export function useLessonFlow({
  worldId,
  towerId,
  floorId,
  floorMaxStars,
  lessons,
  hasLessons,
  currentLesson,
  currentStep,
  selectedAnswer,
  isCorrect,
  isWordBuildLesson,
  isWordBuildReady,
  isTracePracticeLesson,
  isBossTower = false,
  wordBuildSlotTokenIds,
  lessonStarsThisAttemptRef,
  stopAudio,
  playCelebrationFeedback,
  resetSpeechSession,
  resetWordBuildDragState,
  setCurrentStep,
  setSelectedAnswer,
  setIsCorrect,
  setScore,
  setLessonStarsThisAttempt,
  setCompletionStars,
  setShowCompletion,
  setTraceResult,
  setTraceDemoReplayKey,
  setTraceDemoFastForwarded,
  setCelebrationStars,
  setPassiveReady,
  setWordBuildTokenOrder,
  setWordBuildSlotTokenIds,
}: UseLessonFlowParams) {
  const advanceTimeoutRef = useRef<number | null>(null);
  const handleNextRef = useRef<() => void>(() => {});

  // Dọn timeout chuyển lesson để tránh timer cũ "nhảy cóc" khi bé vào/ra màn nhiều lần
  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current === null) return;
    window.clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = null;
  }, []);

  const applyScoringResult = useCallback(
    (
      correct: boolean,
      advanceDelayMs: number = FEEDBACK_ADVANCE_DELAY_MS,
      earnedStars: number = 0,
    ) => {
      if (currentLesson?.type === "active") {
        // Đảm bảo không bao giờ vượt quá maxStars của lesson (hoặc 0 nếu là Boss)
        const scoringConfig = getScoringConfig(currentLesson, isBossTower);
        const normalizedStars = Math.max(
          0,
          Math.min(scoringConfig.maxStars, Math.round(earnedStars)),
        );

        setLessonStarsThisAttempt((prev) => {
          const next = {
            ...prev,
            [currentLesson.id]: Math.max(
              prev[currentLesson.id] ?? 0,
              normalizedStars,
            ),
          };
          lessonStarsThisAttemptRef.current = next;
          return next;
        });
      }

      setIsCorrect(correct);
      if (correct) {
        setScore((prev) => prev + 1);
        if (earnedStars > 0) {
          setCelebrationStars(Math.max(1, Math.min(3, Math.round(earnedStars))));
        }
      }

      stopAudio();
      playCelebrationFeedback(correct);

      // Luôn reset timer cũ rồi mới tạo timer mới để đảm bảo thời gian chờ đúng theo lesson hiện tại
      clearAdvanceTimeout();
      advanceTimeoutRef.current = window.setTimeout(() => {
        advanceTimeoutRef.current = null;
        handleNextRef.current();
      }, advanceDelayMs);
    },
    [
      clearAdvanceTimeout,
      currentLesson,
      isBossTower,
      lessonStarsThisAttemptRef,
      setCelebrationStars,
      setIsCorrect,
      setLessonStarsThisAttempt,
      setScore,
      stopAudio,
      playCelebrationFeedback,
    ],
  );

  const handleScoringResult = useCallback(
    (
      correct: boolean,
      advanceDelayMs: number = FEEDBACK_ADVANCE_DELAY_MS,
      earnedStars: number = 0,
    ) => {
      resetSpeechSession();
      applyScoringResult(correct, advanceDelayMs, earnedStars);
    },
    [applyScoringResult, resetSpeechSession],
  );

  const handleAnswer = useCallback(
    (answer: LessonAnswer) => {
      if (!currentLesson || selectedAnswer || currentLesson.type !== "active") {
        return;
      }

      setSelectedAnswer(answer.id);

      const scoringConfig = getScoringConfig(currentLesson, isBossTower);
      const earnedStars =
        answer.isCorrect && scoringConfig.maxStars > 0
          ? scoringConfig.maxStars
          : 0;

      handleScoringResult(
        answer.isCorrect,
        FEEDBACK_ADVANCE_DELAY_MS,
        earnedStars,
      );
    },
    [
      currentLesson,
      isBossTower,
      handleScoringResult,
      selectedAnswer,
      setSelectedAnswer,
    ],
  );

  const handleWordBuildCheck = useCallback(() => {
    if (
      !currentLesson ||
      currentLesson.type !== "active" ||
      !isWordBuildLesson ||
      !isWordBuildReady ||
      isCorrect !== null
    ) {
      return;
    }

    const targetTokenIds = (currentLesson.targetTokens ?? []).map(
      (token) => token.id,
    );
    const isAssembledCorrectly =
      targetTokenIds.length > 0 &&
      targetTokenIds.length === wordBuildSlotTokenIds.length &&
      targetTokenIds.every(
        (targetTokenId, tokenIndex) =>
          wordBuildSlotTokenIds[tokenIndex] === targetTokenId,
      );

    const scoringConfig = getScoringConfig(currentLesson, isBossTower);
    const earnedStars = isAssembledCorrectly
      ? scoringConfig.maxStars
      : 0;

    handleScoringResult(
      isAssembledCorrectly,
      FEEDBACK_ADVANCE_DELAY_MS,
      earnedStars,
    );
  }, [
    currentLesson,
    isBossTower,
    handleScoringResult,
    isCorrect,
    isWordBuildLesson,
    isWordBuildReady,
    wordBuildSlotTokenIds,
  ]);

  const handleTraceEvaluate = useCallback(
    (result: TraceEvaluation) => {
      if (
        !currentLesson ||
        currentLesson.type !== "active" ||
        !isTracePracticeLesson ||
        isCorrect !== null
      ) {
        return;
      }

      setTraceResult(result);
      const earnedStars = result.stars; // Đã được tính và clamp trong TraceEvaluation
      const correct = result.isPassed;
      const advanceDelayMs =
        currentLesson.lessonKind === "letter_trace_practice"
          ? TRACE_STARS_ADVANCE_DELAY_MS
          : FEEDBACK_ADVANCE_DELAY_MS;
      handleScoringResult(correct, advanceDelayMs, earnedStars);
    },
    [
      currentLesson,
      handleScoringResult,
      isCorrect,
      isTracePracticeLesson,
      setTraceResult,
    ],
  );

  const handleNext = useCallback(() => {
    clearAdvanceTimeout();
    resetSpeechSession();
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTraceResult(null);
    setTraceDemoReplayKey(0);
    setTraceDemoFastForwarded(false);
    setCelebrationStars(null);
    resetWordBuildDragState();

    stopAudio();

    if (!hasLessons) return;

    if (currentStep < lessons.length - 1) {
      const nextStep = currentStep + 1;
      const nextLesson = lessons[nextStep];

      if (
        nextLesson?.type === "passive" &&
        nextLesson.gating?.requireAnimationComplete
      ) {
        setPassiveReady(false);
      } else {
        setPassiveReady(true);
      }

      const nextWordBuildState = getWordBuildStateForLesson(nextLesson);
      setWordBuildTokenOrder(nextWordBuildState.tokenOrder);
      setWordBuildSlotTokenIds(nextWordBuildState.slotTokenIds);

      setCurrentStep(nextStep);
      return;
    }

    const latestLessonStars = lessonStarsThisAttemptRef.current;
    const attemptFloorStars = getAttemptFloorStars(
      lessons,
      latestLessonStars,
      floorMaxStars,
    );

    setCompletionStars(attemptFloorStars);
    saveFloorProgress({
      worldId,
      towerId,
      floorId,
      floorStars: attemptFloorStars,
      lessonStars: latestLessonStars,
      maxStars: floorMaxStars,
    });
    setShowCompletion(true);
  }, [
    clearAdvanceTimeout,
    currentStep,
    floorId,
    floorMaxStars,
    hasLessons,
    lessonStarsThisAttemptRef,
    lessons,
    resetSpeechSession,
    resetWordBuildDragState,
    setCelebrationStars,
    setCompletionStars,
    setCurrentStep,
    setIsCorrect,
    setPassiveReady,
    setSelectedAnswer,
    setShowCompletion,
    setTraceDemoFastForwarded,
    setTraceDemoReplayKey,
    setTraceResult,
    setWordBuildSlotTokenIds,
    setWordBuildTokenOrder,
    stopAudio,
    towerId,
    worldId,
  ]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAdvanceTimeout();
      resetSpeechSession();
      stopAudio();
    };
  }, [clearAdvanceTimeout, resetSpeechSession, stopAudio]);

  return {
    clearAdvanceTimeout,
    onScoringResult: applyScoringResult,
    handleAnswer,
    handleWordBuildCheck,
    handleTraceEvaluate,
    handleNext,
  };
}
