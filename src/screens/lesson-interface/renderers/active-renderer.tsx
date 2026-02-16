"use client";

import { type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mic, Square, Volume2 } from "lucide-react";
import { LetterTracingCanvas, type TraceEvaluation } from "../components";
import type { TracingScoringThresholds } from "../scoring/tracing-scoring";
import { PrimaryButton } from "@/components/common/primary-button";
import type { LessonAnswer, LessonContent } from "@/data/game-config";
import type {
  WordBuildActiveDrag,
  WordBuildSlotPlacement,
  WordBuildToken,
} from "../types";
import { getWordBuildTokenDisplayText } from "../utils";

interface LessonActiveRendererProps {
  currentLesson: LessonContent;
  hasAnswerOptions: boolean;
  answerOptions: LessonAnswer[];
  selectedAnswer: string | null;
  handleAnswer: (answer: LessonAnswer) => void;
  isWordBuildLesson: boolean;
  wordBuildTokenOrder: string[];
  wordBuildTokenMap: Map<string, WordBuildToken>;
  wordBuildPlacedTokenIds: Set<string>;
  wordBuildActiveDrag: WordBuildActiveDrag | null;
  isCorrect: boolean | null;
  handleWordBuildTokenPointerDown: (
    event: PointerEvent<HTMLElement>,
    tokenId: string,
    sourceSlotIndex: number | null,
  ) => void;
  wordBuildSlotLayout: {
    placements: WordBuildSlotPlacement[];
    columnCount: number;
  };
  wordBuildGridRowCount: number;
  wordBuildSlotTokenIds: Array<string | null>;
  wordBuildExpectedTokens: WordBuildToken[];
  wordBuildPlacementBySlotIndex: Map<number, WordBuildSlotPlacement>;
  wordBuildDisplayRowByLogicalRow: Map<number, number>;
  handleWordBuildCheck: () => void;
  isWordBuildReady: boolean;
  isThresholdSpeechLesson: boolean;
  isTracePracticeLesson: boolean;
  isMicRecording: boolean;
  isMicSubmitting: boolean;
  handleMicButtonClick: () => void;
  micLevel: number;
  targetText: string;
  traceResult: TraceEvaluation | null;
  traceThresholds: TracingScoringThresholds;
  handleTraceEvaluate: (result: TraceEvaluation) => void;
  playAudio: (src: string) => void;
  handleNext: () => void;
}

function resolveAnswerImageSource(answer: LessonAnswer): string | null {
  return answer.image ?? null;
}

export function LessonActiveRenderer({
  currentLesson,
  hasAnswerOptions,
  answerOptions,
  selectedAnswer,
  handleAnswer,
  isWordBuildLesson,
  wordBuildTokenOrder,
  wordBuildTokenMap,
  wordBuildPlacedTokenIds,
  wordBuildActiveDrag,
  isCorrect,
  handleWordBuildTokenPointerDown,
  wordBuildSlotLayout,
  wordBuildGridRowCount,
  wordBuildSlotTokenIds,
  wordBuildExpectedTokens,
  wordBuildPlacementBySlotIndex,
  wordBuildDisplayRowByLogicalRow,
  handleWordBuildCheck,
  isWordBuildReady,
  isThresholdSpeechLesson,
  isTracePracticeLesson,
  isMicRecording,
  isMicSubmitting,
  handleMicButtonClick,
  micLevel,
  targetText,
  traceResult,
  traceThresholds,
  handleTraceEvaluate,
  playAudio,
  handleNext,
}: LessonActiveRendererProps) {
  const hasImageAnswerOptions = answerOptions.some((answer) =>
    Boolean(answer.image),
  );
  const isVocabImageQuizLesson = currentLesson.lessonKind === "vocab_image_quiz";
  const shouldRenderImageAnswers =
    isVocabImageQuizLesson || hasImageAnswerOptions;

  return (
    <>
      {currentLesson.type === "active" &&
        hasAnswerOptions &&
        shouldRenderImageAnswers && (
          <div className="mx-auto mt-2 w-full max-w-md">
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {answerOptions.map((answer, index) => {
                const answerImageSource = resolveAnswerImageSource(answer);
                const isSelected = selectedAnswer === answer.id;
                const isCorrectAnswer = answer.isCorrect;
                const showResult = selectedAnswer !== null;
                const shouldHighlightCorrect = showResult && isCorrectAnswer;
                const shouldHighlightWrongSelected =
                  showResult && isSelected && !isCorrectAnswer;
                const shouldFadeWrongUnselected =
                  showResult && !isCorrectAnswer && !isSelected;

                return (
                  <motion.button
                    key={answer.id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileTap={!selectedAnswer ? { scale: 0.96 } : {}}
                    onClick={() => handleAnswer(answer)}
                    disabled={selectedAnswer !== null}
                    className={`relative h-40 w-full overflow-hidden rounded-2xl border-4 bg-white shadow-md transition md:h-52 ${
                      shouldHighlightCorrect
                        ? "border-green-bright ring-4 ring-green-bright/30"
                        : shouldHighlightWrongSelected
                          ? "border-red-400 ring-4 ring-red-300/30"
                          : "border-sky-200"
                    } ${shouldFadeWrongUnselected ? "opacity-75" : ""} ${
                      selectedAnswer !== null
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {answerImageSource ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={answerImageSource}
                          alt={answer.text || "Answer image"}
                          loading="eager"
                          className="h-full w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-900/10 to-transparent" />
                      </>
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-foreground">
                        {answer.text}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {isVocabImageQuizLesson && currentLesson.mainAudio && (
              <motion.div
                className="mt-4 flex justify-center"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PrimaryButton
                  className="rounded-full shadow-lg"
                  frontClassName="h-12 w-12"
                  aria-label="Nghe lại từ vựng"
                  onClick={() => playAudio(currentLesson.mainAudio!)}
                >
                  <Volume2 className="h-6 w-6" />
                </PrimaryButton>
              </motion.div>
            )}
          </div>
        )}

      {currentLesson.type === "active" &&
        hasAnswerOptions &&
        !shouldRenderImageAnswers && (
        <div className="flex justify-center gap-4 flex-wrap">
          {answerOptions.map((answer, index) => {
            const isSelected = selectedAnswer === answer.id;
            const isCorrectAnswer = answer.isCorrect;
            const showResult = selectedAnswer !== null;
            const answerText = answer.text?.trim() ?? "";
            const useSpecialAnswerFont =
              !answer.image && [...answerText].length === 1;

            // Giữ tone xanh-cam cho đáp án, chỉ đổi đỏ khi bé chọn sai
            const answerTone =
              showResult && isSelected && !isCorrectAnswer ? "danger" : "brand";
            const fadeUnselectedWrong =
              showResult && !isCorrectAnswer && !isSelected ? "opacity-80" : "";
            const highlightCorrect = showResult && isCorrectAnswer;

            return (
              <motion.div
                key={answer.id}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
              >
                <PrimaryButton
                  tone={answerTone}
                  onClick={() => handleAnswer(answer)}
                  disabled={selectedAnswer !== null}
                  className={`rounded-2xl ${highlightCorrect ? "ring-4 ring-green-bright/30" : ""}`}
                  frontClassName={`min-w-24 min-h-24 px-4 py-2 text-5xl leading-none ${fadeUnselectedWrong}`}
                >
                  {answer.image ? (
                    <div className="w-12 h-12 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={answer.image}
                        alt={answer.text || "Answer"}
                        loading="eager"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <span
                      className={`relative z-10 ${useSpecialAnswerFont ? "font-hp-special" : ""}`}
                    >
                      {answer.text}
                    </span>
                  )}
                </PrimaryButton>
              </motion.div>
            );
          })}
        </div>
      )}

      {currentLesson.type === "active" && isWordBuildLesson && (
        <div className="mt-2 flex w-full flex-col items-center gap-4">
          <div className="w-full rounded-3xl bg-white/80 p-4 shadow-md">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {wordBuildTokenOrder.map((tokenId) => {
                const token = wordBuildTokenMap.get(tokenId);
                if (!token) return null;
                const tokenDisplayText = getWordBuildTokenDisplayText(token);
                const isToneToken = token.kind === "tone";
                const isPlacedToken = wordBuildPlacedTokenIds.has(tokenId);
                const isDraggingFromPool =
                  wordBuildActiveDrag?.tokenId === tokenId &&
                  wordBuildActiveDrag.sourceSlotIndex === null;
                const isSingleLetter =
                  token.kind === "letter" && [...tokenDisplayText].length === 1;

                return (
                  <div key={`word-build-pool-${tokenId}`} className="h-20 w-20">
                    {isPlacedToken || isDraggingFromPool ? (
                      <div className="h-full w-full rounded-2xl border-4 border-dashed border-slate-200/80 bg-slate-100/40" />
                    ) : (
                      <motion.div
                        whileTap={isCorrect === null ? { scale: 0.95 } : {}}
                        className="h-full w-full"
                      >
                        <div
                          onPointerDown={(event) =>
                            handleWordBuildTokenPointerDown(
                              event,
                              tokenId,
                              null,
                            )
                          }
                          className={`flex h-full w-full items-end justify-center rounded-2xl border-4 border-green-300 bg-green-bright px-2 pb-1 text-white shadow-md touch-none select-none ${
                            isCorrect !== null
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-grab"
                          } ${
                            isToneToken
                              ? "text-5xl leading-none"
                              : isSingleLetter
                                ? "font-hp-special text-5xl leading-none"
                                : "text-xl leading-tight"
                          }`}
                        >
                          {tokenDisplayText}
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="w-full rounded-3xl bg-white/90 p-4 shadow-md">
            <div className="mx-auto flex min-h-60 items-center justify-center">
              <div
                className="grid w-fit justify-items-center gap-x-3 gap-y-2"
                style={{
                  gridTemplateColumns: `repeat(${wordBuildSlotLayout.columnCount}, minmax(0, 5rem))`,
                  gridTemplateRows: `repeat(${wordBuildGridRowCount}, 5rem)`,
                }}
              >
                {wordBuildSlotTokenIds.map((placedTokenId, slotIndex) => {
                  const expectedToken = wordBuildExpectedTokens[slotIndex];
                  if (!expectedToken) return null;

                  const slotPlacement = wordBuildPlacementBySlotIndex.get(
                    slotIndex,
                  ) ?? {
                    slotIndex,
                    column: slotIndex + 1,
                    row: 1 as const,
                  };
                  const placedToken = placedTokenId
                    ? wordBuildTokenMap.get(placedTokenId)
                    : null;
                  const slotDisplayText = placedToken
                    ? getWordBuildTokenDisplayText(placedToken)
                    : "";
                  const isToneToken = placedToken?.kind === "tone";
                  const isSingleLetter =
                    placedToken?.kind === "letter" &&
                    [...slotDisplayText].length === 1;
                  const isDraggingFromCurrentSlot =
                    Boolean(placedTokenId) &&
                    wordBuildActiveDrag?.tokenId === placedTokenId &&
                    wordBuildActiveDrag.sourceSlotIndex === slotIndex;
                  const displayRow =
                    wordBuildDisplayRowByLogicalRow.get(slotPlacement.row) ?? 1;

                  return (
                    <div
                      key={`word-build-slot-${slotIndex}`}
                      data-word-build-slot-index={slotIndex}
                      onPointerDown={(event) => {
                        if (!placedTokenId) return;
                        handleWordBuildTokenPointerDown(
                          event,
                          placedTokenId,
                          slotIndex,
                        );
                      }}
                      className={`flex items-end justify-center rounded-2xl border-4 border-dashed px-2 pb-1 text-center transition-colors ${
                        placedToken
                          ? "border-green-300 bg-green-50"
                          : "border-sky-200 bg-sky-50/80"
                      } ${
                        placedToken
                          ? "cursor-grab touch-none select-none"
                          : "cursor-default"
                      } h-20 w-20`}
                      style={{
                        gridColumnStart: slotPlacement.column,
                        gridRowStart: displayRow,
                      }}
                    >
                      {placedToken && !isDraggingFromCurrentSlot ? (
                        <span
                          className={`font-bold text-foreground ${
                            isToneToken
                              ? "text-4xl leading-none"
                              : isSingleLetter
                                ? "font-hp-special text-5xl leading-none"
                                : "text-lg leading-tight"
                          }`}
                        >
                          {slotDisplayText}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <motion.div whileTap={isCorrect === null ? { scale: 0.95 } : {}}>
            <PrimaryButton
              onClick={handleWordBuildCheck}
              disabled={!isWordBuildReady || isCorrect !== null}
              className="rounded-3xl"
              frontClassName="px-10 py-3 text-lg"
            >
              Kiểm Tra
            </PrimaryButton>
          </motion.div>
        </div>
      )}

      {currentLesson.type === "active" &&
        isThresholdSpeechLesson &&
        !hasAnswerOptions &&
        !isTracePracticeLesson && (
          <div className="mt-3 flex flex-col items-center gap-4">
            <motion.div
              className="relative"
              animate={isMicRecording ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 0.9, repeat: Infinity }}
            >
              <PrimaryButton
                tone={isMicRecording ? "danger" : "brand"}
                onClick={handleMicButtonClick}
                disabled={isMicSubmitting || isCorrect !== null}
                className={`rounded-full ${isMicRecording ? "ring-4 ring-red-300/70" : "ring-4 ring-green-200/70"}`}
                frontClassName="h-24 w-24"
                aria-label={
                  isMicRecording
                    ? "Dừng và nộp bài nói"
                    : "Bắt đầu ghi âm bài nói"
                }
              >
                {isMicRecording ? (
                  <Square className="h-10 w-10 text-white" />
                ) : (
                  <Mic className="h-10 w-10 text-white" />
                )}
              </PrimaryButton>
              {isMicRecording && (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-full border-4 border-red-300"
                  animate={{ scale: [1, 1.24], opacity: [0.8, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
            </motion.div>

            <div className="flex h-12 items-end justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map((barIndex) => {
                const weight = 0.6 + barIndex * 0.15;
                const normalizedLevel = isMicRecording
                  ? Math.min(1, micLevel * weight)
                  : 0.08;
                const barHeight = 8 + normalizedLevel * 30;
                return (
                  <motion.span
                    key={`mic-bar-${barIndex}`}
                    className={`w-2 rounded-full ${isMicRecording ? "bg-red-400" : "bg-green-300"}`}
                    style={{ height: `${barHeight}px` }}
                    animate={{
                      opacity: isMicRecording ? [0.55, 1, 0.55] : 0.45,
                    }}
                    transition={{
                      duration: 0.45 + barIndex * 0.08,
                      repeat: Infinity,
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

      {currentLesson.type === "active" && isTracePracticeLesson && (
        <div className="mt-2 flex flex-col items-center gap-3">
          <LetterTracingCanvas
            key={currentLesson.id}
            mode="practice"
            targetText={targetText}
            disabled={traceResult !== null}
            thresholds={traceThresholds}
            onEvaluate={handleTraceEvaluate}
          />
        </div>
      )}

      {currentLesson.type === "active" &&
        !hasAnswerOptions &&
        !isTracePracticeLesson &&
        !isThresholdSpeechLesson &&
        !isWordBuildLesson && (
          <motion.div
            className="mt-4 inline-block"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
          >
            <PrimaryButton
              onClick={handleNext}
              className="rounded-3xl"
              frontClassName="px-12 py-4 text-xl flex items-center gap-2"
            >
              Tiếp Theo <ArrowRight className="w-6 h-6" />
            </PrimaryButton>
          </motion.div>
        )}

      <AnimatePresence>
        {isCorrect !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-8 text-2xl font-bold ${
              isCorrect ? "text-green-bright" : "text-red-500"
            }`}
          >
            {isCorrect ? "Giỏi quá!" : "Tiếc quá!"}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
