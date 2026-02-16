"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "../../components/beto-mascot";
import {
  BrokenHeartCelebration,
  StarCelebration,
  SuccessCelebrationOverlay,
} from "@/components/celebrations";
import { BossReviewChoiceView, LessonCompletionView } from "@/components/completion";
import { preloadCelebrationAudio, stopAllAppAudio } from "@/lib/app-audio";
import { getStoredFloorProgress, getStoredLessonStars } from "@/lib/floor-progress";
import { getWorldData } from "@/data/game-config";
import { getScoringConfig } from "@/data/scoring-utils";
import { type LessonAnswer, type LessonContent } from "../../data/game-config";
import {
  LessonActiveRenderer,
  LessonPassivePreviewRenderer,
  WordBuildDragGhost,
} from "./renderers";
import { LessonTopBar, type TraceEvaluation } from "./components";
import { PrimaryButton } from "../../components/common/primary-button";
import {
  getAttemptFloorStars,
  getLessonMaxStars,
  getTracePracticeLessonIdFromDemoLessonId,
  getWordBuildSlotPlacements,
  getWordBuildStateForLesson,
  getWordBuildTokenDisplayText,
} from "./utils";
import {
  isFloor3ListenLookLessonKind,
  isFogRevealLessonKind,
  isLetterGridPreviewLessonKind,
  isLetterTraceDemoLessonKind,
  isPronunciationPracticeLessonKind,
  isTracePracticeLessonKind,
  isWordBuildLessonKind,
  shouldPromoteTitleToInstructionKind,
  shouldUseLargerVocabImageKind,
} from "./lesson-kind-guards";
import {
  useLessonAudio,
  useLessonFlow,
  usePassiveFlow,
  useThresholdSpeech,
  useWordBuildDrag,
} from "./hooks";

const LESSON_SUCCESS_FEEDBACK_AUDIO =
  "/assets/audio/feedback/success-answer.mp3";
const LESSON_FAILURE_FEEDBACK_AUDIO = "/assets/audio/feedback/wrong-answer.mp3";
const BOSS_REVIEW_PASS_THRESHOLD = 6;

interface LessonInterfaceProps {
  worldId: number;
  towerId: number;
  floorId: number;
  floorName: string;
  floorMaxStars: number;
  lessons: LessonContent[];
  onComplete: () => void;
  onBossFloorSelect?: (floorId: number) => void;
  onBack: () => void;
}

function shuffleLessonAnswers(answers: LessonAnswer[]): LessonAnswer[] {
  const shuffled = [...answers];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function getDisplayAnswersForLesson(
  lesson: LessonContent | undefined,
): LessonAnswer[] {
  if (!lesson?.answers?.length) return [];
  return shuffleLessonAnswers(lesson.answers);
}

export function LessonInterface({
  worldId,
  towerId,
  floorId,
  floorMaxStars,
  lessons,
  onComplete,
  onBossFloorSelect,
  onBack,
}: LessonInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [lessonStarsThisAttempt, setLessonStarsThisAttempt] = useState<
    Record<string, number>
  >({});
  const lessonStarsThisAttemptRef = useRef<Record<string, number>>({});
  const [completionStars, setCompletionStars] = useState<number | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showBossReviewChoiceScreen, setShowBossReviewChoiceScreen] =
    useState(false);
  const [traceResult, setTraceResult] = useState<TraceEvaluation | null>(null);
  const [traceDemoReplayKey, setTraceDemoReplayKey] = useState(0);
  const [traceDemoFastForwarded, setTraceDemoFastForwarded] = useState(false);
  const [celebrationStars, setCelebrationStars] = useState<number | null>(null);
  const [wordBuildTokenOrder, setWordBuildTokenOrder] = useState<string[]>(
    () => getWordBuildStateForLesson(lessons[0]).tokenOrder,
  );
  const [wordBuildSlotTokenIds, setWordBuildSlotTokenIds] = useState<
    Array<string | null>
  >(() => getWordBuildStateForLesson(lessons[0]).slotTokenIds);
  const [answerOptions, setAnswerOptions] = useState<LessonAnswer[]>(() =>
    getDisplayAnswersForLesson(lessons[0]),
  );
  const [passiveReady, setPassiveReady] = useState(() => {
    const firstLesson = lessons[0];
    return !(
      firstLesson?.type === "passive" &&
      firstLesson.gating?.requireAnimationComplete
    );
  });
  const resetSpeechSessionRef = useRef<() => void>(() => {});

  const hasLessons = lessons.length > 0;
  const currentTower = getWorldData(worldId).towers.find(
    (tower) => tower.id === towerId,
  );
  const isBossReviewFloor = Boolean(
    currentTower?.isBoss &&
      floorId === 1 &&
      lessons.length > 0 &&
      lessons.every((lesson) => lesson.type === "active"),
  );
  const isBossTower = Boolean(currentTower?.isBoss);

  const [bossEntryResolved, setBossEntryResolved] = useState(
    () => !isBossReviewFloor,
  );
  const currentLesson = hasLessons ? lessons[currentStep] : undefined;
  const currentLessonKind = currentLesson?.lessonKind;
  const currentLessonId = currentLesson?.id;
  const currentLessonIntroVoice = currentLesson?.introVoice;
  const currentLessonIntroVoiceOptions = currentLesson?.introVoiceOptions;
  const currentLessonMainAudio = currentLesson?.mainAudio;
  const currentLessonDisableIntro = Boolean(currentLesson?.disableIntro);
  const lessonAutoplayDelayMs = currentTower?.isBoss ? 1000 : 0;
  const { playAudio, playOneShotAudio, stopAudio } = useLessonAudio({
    currentStep,
    currentLessonId,
    currentLessonIntroVoice,
    currentLessonIntroVoiceOptions,
    currentLessonMainAudio,
    currentLessonDisableIntro,
    autoPlayEnabled:
      bossEntryResolved &&
      !(showBossReviewChoiceScreen && isBossReviewFloor),
    autoPlayDelayMs: lessonAutoplayDelayMs,
  });
  const playCelebrationFeedback = useCallback(
    (correct: boolean) => {
      playOneShotAudio(
        correct ? LESSON_SUCCESS_FEEDBACK_AUDIO : LESSON_FAILURE_FEEDBACK_AUDIO,
      );
    },
    [playOneShotAudio],
  );

  useEffect(() => {
    setAnswerOptions(getDisplayAnswersForLesson(currentLesson));
  }, [currentLesson]);

  useEffect(() => {
    preloadCelebrationAudio(LESSON_SUCCESS_FEEDBACK_AUDIO);
    preloadCelebrationAudio(LESSON_FAILURE_FEEDBACK_AUDIO);
  }, []);

  useEffect(() => {
    if (!isBossReviewFloor) {
      setBossEntryResolved(true);
      return;
    }
    const storedBossReviewProgress = getStoredFloorProgress({
      worldId,
      towerId,
      floorId,
    }, floorMaxStars);
    const storedPassCount = storedBossReviewProgress?.stars ?? 0;
    if (storedPassCount >= BOSS_REVIEW_PASS_THRESHOLD) {
      setScore(storedPassCount);
      setShowBossReviewChoiceScreen(true);
    } else {
      setShowBossReviewChoiceScreen(false);
    }
    setBossEntryResolved(true);
  }, [floorId, floorMaxStars, isBossReviewFloor, towerId, worldId]);

  const progress = hasLessons ? ((currentStep + 1) / lessons.length) * 100 : 0;
  const isTracePracticeLesson = isTracePracticeLessonKind(currentLessonKind);
  const isWordBuildLesson = isWordBuildLessonKind(currentLessonKind);
  const isLetterTraceDemoLesson =
    isLetterTraceDemoLessonKind(currentLessonKind);
  const isPronunciationPracticeLesson = isPronunciationPracticeLessonKind(
    currentLessonKind,
  );
  const isFloor3ListenLookLesson = isFloor3ListenLookLessonKind(
    currentLessonKind,
    Boolean(currentLesson?.instruction),
  );
  const shouldUseLargerVocabImage = Boolean(
    currentLesson?.mainImage &&
    shouldUseLargerVocabImageKind(currentLessonKind),
  );
  const isThresholdSpeechLesson = Boolean(
    isPronunciationPracticeLesson &&
    currentLesson?.scoring?.passPolicy === "threshold",
  );
  // Gom nhóm 4 lesson chữ cái để dùng chung cách hiển thị instruction trên cùng
  const shouldPromoteTitleToInstruction =
    shouldPromoteTitleToInstructionKind(currentLessonKind);
  const isTitlePromotedToTop = Boolean(
    shouldPromoteTitleToInstruction ||
    (!currentLesson?.instruction && currentLesson?.title),
  );
  const topInstructionText = shouldPromoteTitleToInstruction
    ? currentLesson?.title
    : (currentLesson?.instruction ?? currentLesson?.title);
  const topInstructionClassName = isTitlePromotedToTop
    ? "text-xl md:text-2xl text-foreground font-bold mb-5"
    : "text-lg text-muted-foreground mb-2";
  const secondaryQuestionText = shouldPromoteTitleToInstruction
    ? undefined
    : currentLesson?.question;
  const showTitleBelowPreview =
    Boolean(currentLesson?.title) &&
    !shouldPromoteTitleToInstruction &&
    Boolean(currentLesson?.instruction);
  const hasAnswerOptions = answerOptions.length > 0;
  const hasImageAnswerOptions =
    hasAnswerOptions && answerOptions.some((answer) => Boolean(answer.image));
  const targetText =
    currentLesson?.targetText ?? currentLesson?.targetLetter ?? "";
  const wordBuildExpectedTokens = isWordBuildLesson
    ? (currentLesson?.targetTokens ?? [])
    : [];
  const wordBuildSourceTokens = isWordBuildLesson
    ? currentLesson?.instruction
      ? (currentLesson?.tokenPool ?? currentLesson?.targetTokens ?? [])
      : (currentLesson?.targetTokens ?? [])
    : [];
  const wordBuildSourceTokenIds = wordBuildSourceTokens.map(
    (token) => token.id,
  );
  const {
    wordBuildActiveDrag,
    wordBuildGhostRef,
    handleWordBuildTokenPointerDown,
    resetWordBuildDragState,
  } = useWordBuildDrag({
    isWordBuildLesson,
    isCorrect,
    wordBuildSourceTokenIds,
    setWordBuildSlotTokenIds,
  });
  const wordBuildTargetTokenIds = wordBuildExpectedTokens.map(
    (token) => token.id,
  );
  const wordBuildPlacedTokenIds = new Set(
    wordBuildSlotTokenIds.filter(
      (tokenId): tokenId is string => tokenId !== null,
    ),
  );
  const wordBuildTokenMap = new Map(
    [...wordBuildSourceTokens, ...wordBuildExpectedTokens].map((token) => [
      token.id,
      token,
    ]),
  );
  const wordBuildDraggedToken = wordBuildActiveDrag
    ? wordBuildTokenMap.get(wordBuildActiveDrag.tokenId)
    : undefined;
  const wordBuildDraggedTokenText = wordBuildDraggedToken
    ? getWordBuildTokenDisplayText(wordBuildDraggedToken)
    : "";
  const isWordBuildDraggedTone = wordBuildDraggedToken?.kind === "tone";
  const isWordBuildDraggedSingleLetter =
    wordBuildDraggedToken?.kind === "letter" &&
    [...wordBuildDraggedTokenText].length === 1;
  const isWordBuildReady =
    isWordBuildLesson &&
    wordBuildSlotTokenIds.length === wordBuildTargetTokenIds.length &&
    wordBuildSlotTokenIds.length > 0 &&
    wordBuildSlotTokenIds.every(
      (tokenId): tokenId is string => tokenId !== null,
    );
  const wordBuildSlotLayout = getWordBuildSlotPlacements(
    wordBuildExpectedTokens,
  );
  const wordBuildPlacementBySlotIndex = new Map(
    wordBuildSlotLayout.placements.map((placement) => [
      placement.slotIndex,
      placement,
    ]),
  );
  const wordBuildUsedRows = Array.from(
    new Set(wordBuildSlotLayout.placements.map((placement) => placement.row)),
  ).sort((leftRow, rightRow) => leftRow - rightRow);
  const wordBuildGridRowCount = Math.max(1, wordBuildUsedRows.length);
  const wordBuildDisplayRowByLogicalRow = new Map(
    wordBuildUsedRows.map((logicalRow, rowIndex) => [logicalRow, rowIndex + 1]),
  );

  // Tính toán scoring config tập trung
  const scoringConfig = getScoringConfig(currentLesson, isBossTower);

  const showPreviewCard =
    !isTracePracticeLesson &&
    !isLetterTraceDemoLesson &&
    !isWordBuildLesson &&
    !hasImageAnswerOptions;
  const requiresAnimationComplete =
    currentLesson?.type === "passive" &&
    Boolean(currentLesson.gating?.requireAnimationComplete);
  // Lesson quiz hiển thị chữ cái thật dưới lớp sương, không còn dấu hỏi
  const isFogRevealLesson = isFogRevealLessonKind(currentLessonKind);
  const isFogRevealLocked = currentLesson?.fogMode === "locked";
  const isLetterGridPreviewLesson =
    isLetterGridPreviewLessonKind(currentLessonKind);
  const displayText =
    currentLesson?.targetText ??
    currentLesson?.targetLetter ??
    currentLesson?.title ??
    "?";

  // Lọc các bài học active cho ngữ cảnh chấm điểm
  const activeLessonsCount = lessons.filter((l) => l.type === "active").length;
  const activeLessonsTotalStars = lessons.reduce(
    (sum, lesson) => sum + getLessonMaxStars(lesson),
    0,
  );
  const pairedTracePracticeLessonId = getTracePracticeLessonIdFromDemoLessonId(
    currentLesson?.id,
  );
  const canFastForwardTraceDemo =
    isLetterTraceDemoLesson &&
    Boolean(
      pairedTracePracticeLessonId &&
      getStoredLessonStars({
        worldId,
        towerId,
        floorId,
        lessonId: pairedTracePracticeLessonId,
      }) >= 1,
    );

  const callResetSpeechSession = useCallback(() => {
    resetSpeechSessionRef.current();
  }, []);

  const handleBack = useCallback(() => {
    stopAudio();
    stopAllAppAudio();
    onBack();
  }, [onBack, stopAudio]);

  const {
    clearAdvanceTimeout,
    onScoringResult,
    handleAnswer,
    handleWordBuildCheck,
    handleTraceEvaluate,
    handleNext,
  } = useLessonFlow({
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
    isBossTower,
    wordBuildSlotTokenIds,
    lessonStarsThisAttemptRef,
    stopAudio,
    playCelebrationFeedback,
    resetSpeechSession: callResetSpeechSession,
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
  });

  const {
    isMicRecording,
    isMicSubmitting,
    micLevel,
    handleMicButtonClick,
    resetSpeechSession: resetThresholdSpeechSession,
  } = useThresholdSpeech({
    currentLesson,
    isThresholdSpeechLesson,
    isCorrect,
    targetText,
    isBossTower,
    clearAdvanceTimeout,
    onScoringResult,
    stopAudio,
  });

  useEffect(() => {
    resetSpeechSessionRef.current = resetThresholdSpeechSession;
  }, [resetThresholdSpeechSession]);

  const {
    handleTraceDemoComplete,
    handleReplayTraceDemo,
    handleFastForwardTraceDemo,
  } = usePassiveFlow({
    clearAdvanceTimeout,
    currentStep,
    requiresAnimationComplete,
    isLetterTraceDemoLesson,
    canFastForwardTraceDemo,
    passiveReady,
    traceDemoFastForwarded,
    setPassiveReady,
    setTraceDemoFastForwarded,
    setTraceDemoReplayKey,
  });

  const resetBossReviewRun = useCallback(() => {
    clearAdvanceTimeout();
    stopAudio();
    stopAllAppAudio();
    resetSpeechSessionRef.current();
    setCurrentStep(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setLessonStarsThisAttempt({});
    lessonStarsThisAttemptRef.current = {};
    setCompletionStars(null);
    setShowCompletion(false);
    setShowBossReviewChoiceScreen(false);
    setTraceResult(null);
    setTraceDemoReplayKey(0);
    setTraceDemoFastForwarded(false);
    setCelebrationStars(null);
    setBossEntryResolved(true);
    const firstLesson = lessons[0];
    setAnswerOptions(getDisplayAnswersForLesson(firstLesson));
    setPassiveReady(
      !(
        firstLesson?.type === "passive" &&
        firstLesson.gating?.requireAnimationComplete
      ),
    );
    const firstWordBuildState = getWordBuildStateForLesson(firstLesson);
    setWordBuildTokenOrder(firstWordBuildState.tokenOrder);
    setWordBuildSlotTokenIds(firstWordBuildState.slotTokenIds);
  }, [clearAdvanceTimeout, lessons, setWordBuildSlotTokenIds, stopAudio]);

  const handleChooseBossReview = useCallback(() => {
    resetBossReviewRun();
  }, [resetBossReviewRun]);

  const handleChooseBossMysteryGame = useCallback(() => {
    stopAudio();
    stopAllAppAudio();
    if (onBossFloorSelect) {
      onBossFloorSelect(2);
      return;
    }
    onComplete();
  }, [onBossFloorSelect, onComplete, stopAudio]);

  // Phòng ngừa trường hợp không có bài học nào
  if (!hasLessons || !currentLesson) {
    return (
      <div className="relative w-full h-dvh flex flex-col items-center justify-center bg-background">
        <p>No lessons available.</p>
        <PrimaryButton
          onClick={handleBack}
          className="mt-4 rounded-2xl"
          frontClassName="px-5 py-2 text-sm"
        >
          Back
        </PrimaryButton>
      </div>
    );
  }

  if (showBossReviewChoiceScreen && isBossReviewFloor) {
    return (
      <BossReviewChoiceView
        passCount={score}
        totalLessons={activeLessonsCount}
        onBack={handleBack}
        onChooseReview={handleChooseBossReview}
        onChooseMysteryGame={handleChooseBossMysteryGame}
      />
    );
  }

  if (showCompletion) {
    const stars =
      completionStars ??
      getAttemptFloorStars(lessons, lessonStarsThisAttempt, floorMaxStars);

    if (isBossReviewFloor) {
      const passCount = score;
      const hasPassedBossReview = passCount >= BOSS_REVIEW_PASS_THRESHOLD;
      const bossSummary = `Bé đã vượt qua ${passCount}/${activeLessonsCount} bài.`;

      return (
        <LessonCompletionView
          stars={hasPassedBossReview ? 1 : 0}
          showStars={false}
          score={passCount}
          activeLessonsCount={activeLessonsCount}
          activeLessonsTotalStars={activeLessonsCount}
          floorMaxStars={1}
          successTitle="Tuyệt vời!"
          failTitle="Cố lên nhé!"
          successSummary={bossSummary}
          failSummary={bossSummary}
          onComplete={
            hasPassedBossReview
              ? () => setShowBossReviewChoiceScreen(true)
              : onComplete
          }
        />
      );
    }

    return (
      <LessonCompletionView
        stars={stars}
        score={score}
        activeLessonsCount={activeLessonsCount}
        activeLessonsTotalStars={activeLessonsTotalStars}
        floorMaxStars={floorMaxStars}
        onComplete={onComplete}
      />
    );
  }

  return (
    <div className="relative w-full h-dvh bg-linear-to-b from-blue-soft/20 via-background to-green-bright/10 flex flex-col overflow-hidden">
      <AnimatePresence>
        {isCorrect === true && <SuccessCelebrationOverlay />}
      </AnimatePresence>
      <AnimatePresence>
        {isCorrect === false && <BrokenHeartCelebration muteSound />}
      </AnimatePresence>
      <AnimatePresence>
        {celebrationStars && <StarCelebration stars={celebrationStars} muteSound />}
      </AnimatePresence>

      {/* Top bar tách riêng để dễ tái sử dụng khi thêm lesson/floor mới. */}
      <LessonTopBar
        progress={progress}
        currentStep={currentStep}
        totalSteps={lessons.length}
        onBack={handleBack}
      />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 app-scroll pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className={`relative w-full max-w-md text-center ${isFloor3ListenLookLesson ? "-mt-4 md:-mt-5" : ""}`}
          >
            {/* Ưu tiên đưa tiêu đề lesson chữ cái lên đầu màn hình như instruction */}
            {topInstructionText && (
              <p className={topInstructionClassName}>{topInstructionText}</p>
            )}
            {secondaryQuestionText && (
              <p className="text-xl text-foreground font-semibold mb-4">
                {secondaryQuestionText}
              </p>
            )}

            <LessonPassivePreviewRenderer
              currentLesson={currentLesson}
              showPreviewCard={showPreviewCard}
              isLetterGridPreviewLesson={isLetterGridPreviewLesson}
              isFogRevealLesson={isFogRevealLesson}
              isFogRevealLocked={isFogRevealLocked}
              targetText={targetText}
              displayText={displayText}
              shouldUseLargerVocabImage={shouldUseLargerVocabImage}
              playAudio={playAudio}
              showTitleBelowPreview={showTitleBelowPreview}
              isLetterTraceDemoLesson={isLetterTraceDemoLesson}
              traceDemoFastForwarded={traceDemoFastForwarded}
              traceDemoReplayKey={traceDemoReplayKey}
              handleTraceDemoComplete={handleTraceDemoComplete}
              handleFastForwardTraceDemo={handleFastForwardTraceDemo}
              canFastForwardTraceDemo={canFastForwardTraceDemo}
              passiveReady={passiveReady}
              handleReplayTraceDemo={handleReplayTraceDemo}
              handleNext={handleNext}
            />

            <LessonActiveRenderer
              currentLesson={currentLesson}
              hasAnswerOptions={hasAnswerOptions}
              answerOptions={answerOptions}
              selectedAnswer={selectedAnswer}
              handleAnswer={handleAnswer}
              isWordBuildLesson={isWordBuildLesson}
              wordBuildTokenOrder={wordBuildTokenOrder}
              wordBuildTokenMap={wordBuildTokenMap}
              wordBuildPlacedTokenIds={wordBuildPlacedTokenIds}
              wordBuildActiveDrag={wordBuildActiveDrag}
              isCorrect={isCorrect}
              handleWordBuildTokenPointerDown={handleWordBuildTokenPointerDown}
              wordBuildSlotLayout={wordBuildSlotLayout}
              wordBuildGridRowCount={wordBuildGridRowCount}
              wordBuildSlotTokenIds={wordBuildSlotTokenIds}
              wordBuildExpectedTokens={wordBuildExpectedTokens}
              wordBuildPlacementBySlotIndex={wordBuildPlacementBySlotIndex}
              wordBuildDisplayRowByLogicalRow={wordBuildDisplayRowByLogicalRow}
              handleWordBuildCheck={handleWordBuildCheck}
              isWordBuildReady={isWordBuildReady}
              isThresholdSpeechLesson={isThresholdSpeechLesson}
              isTracePracticeLesson={isTracePracticeLesson}
              isMicRecording={isMicRecording}
              isMicSubmitting={isMicSubmitting}
              handleMicButtonClick={handleMicButtonClick}
              micLevel={micLevel}
              targetText={targetText}
              traceResult={traceResult}
              traceScoringConfig={scoringConfig}
              handleTraceEvaluate={handleTraceEvaluate}
              playAudio={playAudio}
              handleNext={handleNext}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <WordBuildDragGhost
        wordBuildActiveDrag={wordBuildActiveDrag}
        wordBuildDraggedToken={wordBuildDraggedToken}
        wordBuildDraggedTokenText={wordBuildDraggedTokenText}
        isWordBuildDraggedTone={isWordBuildDraggedTone}
        isWordBuildDraggedSingleLetter={isWordBuildDraggedSingleLetter}
        wordBuildGhostRef={wordBuildGhostRef}
      />

      <motion.div
        className="fixed bottom-4 left-4"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Mascot
          size="sm"
          emotion={
            isCorrect === true
              ? "excited"
              : isCorrect === false
                ? "thinking"
                : "happy"
          }
        />
      </motion.div>
    </div>
  );
}
