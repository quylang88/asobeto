"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mascot } from "../components/beto-mascot";
import { getStoredLessonStars } from "@/lib/floor-progress";
import { type LessonContent } from "../data/game-config";
import {
  SuccessCelebrationOverlay,
  LessonActiveRenderer,
  GameButton,
  LessonCompletionView,
  LessonPassivePreviewRenderer,
  StarCelebration,
  LessonTopBar,
  type TraceEvaluation,
  WordBuildDragGhost,
  getAttemptFloorStars,
  getLessonMaxStars,
  getTracePracticeLessonIdFromDemoLessonId,
  getWordBuildSlotPlacements,
  getWordBuildStateForLesson,
  getWordBuildTokenDisplayText,
  isFloor3ListenLookLessonKind,
  isFogRevealLessonKind,
  isLetterGridPreviewLessonKind,
  isLetterTraceDemoLessonKind,
  isTracePracticeLessonKind,
  isVocabListenRepeatLessonKind,
  isVocabTracePracticeLessonKind,
  isWordBuildLessonKind,
  shouldPromoteTitleToInstructionKind,
  shouldUseLargerVocabImageKind,
  useLessonAudio,
  useLessonFlow,
  usePassiveFlow,
  useThresholdSpeech,
  useWordBuildDrag,
} from "./lesson-interface/index";

interface LessonInterfaceProps {
  worldId: number;
  towerId: number;
  floorId: number;
  floorName: string;
  floorMaxStars: number;
  lessons: LessonContent[];
  onComplete: () => void;
  onBack: () => void;
}
export function LessonInterface({
  worldId,
  towerId,
  floorId,
  floorMaxStars,
  lessons,
  onComplete,
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
  const [passiveReady, setPassiveReady] = useState(() => {
    const firstLesson = lessons[0];
    return !(
      firstLesson?.type === "passive" &&
      firstLesson.gating?.requireAnimationComplete
    );
  });
  const resetSpeechSessionRef = useRef<() => void>(() => {});

  const hasLessons = lessons.length > 0;
  const currentLesson = hasLessons ? lessons[currentStep] : undefined;
  const currentLessonKind = currentLesson?.lessonKind;
  const currentLessonId = currentLesson?.id;
  const currentLessonIntroVoice = currentLesson?.introVoice;
  const currentLessonMainAudio = currentLesson?.mainAudio;
  const { playAudio, playOneShotAudio, stopAudio } = useLessonAudio({
    currentStep,
    currentLessonId,
    currentLessonIntroVoice,
    currentLessonMainAudio,
  });
  const progress = hasLessons ? ((currentStep + 1) / lessons.length) * 100 : 0;
  const isTracePracticeLesson = isTracePracticeLessonKind(currentLessonKind);
  const isVocabTracePracticeLesson =
    isVocabTracePracticeLessonKind(currentLessonKind);
  const isWordBuildLesson = isWordBuildLessonKind(currentLessonKind);
  const isLetterTraceDemoLesson = isLetterTraceDemoLessonKind(currentLessonKind);
  const isVocabListenRepeatLesson =
    isVocabListenRepeatLessonKind(currentLessonKind);
  const isFloor3ListenLookLesson = isFloor3ListenLookLessonKind(
    currentLessonKind,
    Boolean(currentLesson?.instruction),
  );
  const shouldUseLargerVocabImage = Boolean(
    currentLesson?.mainImage && shouldUseLargerVocabImageKind(currentLessonKind),
  );
  const isThresholdSpeechLesson = Boolean(
    isVocabListenRepeatLesson &&
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
    : currentLesson?.instruction ?? currentLesson?.title;
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
  const hasAnswerOptions = Boolean(currentLesson?.answers?.length);
  const targetText =
    currentLesson?.targetText ?? currentLesson?.targetLetter ?? "";
  const wordBuildExpectedTokens = isWordBuildLesson
    ? (currentLesson?.targetTokens ?? [])
    : [];
  const wordBuildSourceTokens = isWordBuildLesson
    ? (currentLesson?.instruction
        ? (currentLesson?.tokenPool ?? currentLesson?.targetTokens ?? [])
        : (currentLesson?.targetTokens ?? []))
    : [];
  const wordBuildSourceTokenIds = wordBuildSourceTokens.map((token) => token.id);
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
    wordBuildSlotTokenIds.filter((tokenId): tokenId is string => tokenId !== null),
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
    wordBuildSlotTokenIds.every((tokenId): tokenId is string => tokenId !== null);
  const wordBuildSlotLayout = getWordBuildSlotPlacements(wordBuildExpectedTokens);
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
  const traceOneStarThreshold =
    currentLesson?.scoring?.starThresholds?.oneStar ?? 0.5;
  const traceTwoStarThreshold =
    currentLesson?.scoring?.starThresholds?.twoStars ?? 0.85;
  const showPreviewCard =
    !isTracePracticeLesson && !isLetterTraceDemoLesson && !isWordBuildLesson;
  const requiresAnimationComplete =
    currentLesson?.type === "passive" &&
    Boolean(currentLesson.gating?.requireAnimationComplete);
  // Lesson quiz hiển thị chữ cái thật dưới lớp sương, không còn dấu hỏi
  const isFogRevealLesson = isFogRevealLessonKind(currentLessonKind);
  const isLetterGridPreviewLesson =
    isLetterGridPreviewLessonKind(currentLessonKind);
  const displayText =
    currentLesson?.targetText ??
    currentLesson?.targetLetter ??
    currentLesson?.title ??
    "?";

  // Filter active lessons for scoring context
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
    traceOneStarThreshold,
    wordBuildSlotTokenIds,
    lessonStarsThisAttemptRef,
    stopAudio,
    playOneShotAudio,
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
    clearAdvanceTimeout,
    onScoringResult,
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

  // Guard against empty lessons
  if (!hasLessons || !currentLesson) {
    return (
      <div className="relative w-full h-dvh flex flex-col items-center justify-center bg-background">
        <p>No lessons available.</p>
        <GameButton
          onClick={onBack}
          className="mt-4 rounded-2xl"
          frontClassName="px-5 py-2 text-sm"
        >
          Back
        </GameButton>
      </div>
    );
  }

  if (showCompletion) {
    const stars =
      completionStars ??
      getAttemptFloorStars(lessons, lessonStarsThisAttempt, floorMaxStars);
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
        {celebrationStars && <StarCelebration stars={celebrationStars} />}
      </AnimatePresence>

      {/* Top bar tách riêng để dễ tái sử dụng khi thêm lesson/floor mới. */}
      <LessonTopBar
        progress={progress}
        currentStep={currentStep}
        totalSteps={lessons.length}
        onBack={onBack}
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
              traceOneStarThreshold={traceOneStarThreshold}
              traceTwoStarThreshold={traceTwoStarThreshold}
              handleTraceEvaluate={handleTraceEvaluate}
              isVocabTracePracticeLesson={isVocabTracePracticeLesson}
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
