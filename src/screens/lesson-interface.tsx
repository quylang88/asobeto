"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, Star, ArrowRight } from "lucide-react";
import { Mascot } from "../components/beto-mascot";
import {
  LetterTracingCanvas,
  type TraceEvaluation,
} from "../components/letter-tracing-canvas";
import { LessonContent, LessonAnswer } from "../data/game-config";

interface LessonInterfaceProps {
  floorId: number;
  floorName: string;
  lessons: LessonContent[];
  onComplete: () => void;
  onBack: () => void;
}

const FEEDBACK_ADVANCE_DELAY_MS = 2600;
const FEEDBACK_SUCCESS_AUDIO = "/assets/audio/feedback/gioi-qua.mp3";
const FEEDBACK_FAIL_AUDIO = "/assets/audio/feedback/tiec-qua.mp3";
const FEEDBACK_CHEER_AUDIO = "/assets/audio/feedback/applause-cheer.mp3";
const CONFETTI_COLORS = ["#22c55e", "#f59e0b", "#38bdf8", "#fb7185", "#f97316"];

const CONFETTI_PIECES = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: (index * 17) % 100,
  delay: (index % 7) * 0.07,
  duration: 1.2 + (index % 5) * 0.28,
  xDrift: ((index % 2 === 0 ? 1 : -1) * (10 + (index % 4) * 8)),
  rotate: (index * 43) % 360,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));

function getSpeedLabel(speed: string): string {
  if (speed === "slow") return "Chậm";
  if (speed === "fast") return "Nhanh";
  return "Thường";
}

function FullScreenSuccessCelebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-radial-[circle_at_center] from-yellow-bright/35 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
      />
      {CONFETTI_PIECES.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute top-0 h-3 w-2 rounded-sm"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotate}deg)`,
          }}
          initial={{ y: -16, opacity: 0, scale: 0.85 }}
          animate={{
            y: "110vh",
            opacity: [0, 1, 1, 0],
            x: [0, piece.xDrift, piece.xDrift * 0.4],
            rotate: [piece.rotate, piece.rotate + 180],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function LessonInterface({
  lessons,
  onComplete,
  onBack,
}: LessonInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [traceResult, setTraceResult] = useState<TraceEvaluation | null>(null);
  const [passiveReady, setPassiveReady] = useState(() => {
    const firstLesson = lessons[0];
    return !(
      firstLesson?.type === "passive" &&
      firstLesson.gating?.requireAnimationComplete
    );
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const hasLessons = lessons.length > 0;
  const currentLesson = hasLessons ? lessons[currentStep] : undefined;
  const progress = hasLessons ? ((currentStep + 1) / lessons.length) * 100 : 0;
  const isQuizLesson = currentLesson?.lessonKind === "letter_quiz";
  const isTracePracticeLesson =
    currentLesson?.lessonKind === "letter_trace_practice" ||
    currentLesson?.lessonKind === "vocab_trace_practice";
  const isLetterTracePracticeLesson =
    currentLesson?.lessonKind === "letter_trace_practice";
  const hasAnswerOptions = Boolean(currentLesson?.answers?.length);
  const targetText =
    currentLesson?.targetText ?? currentLesson?.targetLetter ?? "";
  const traceOneStarThreshold =
    currentLesson?.scoring?.starThresholds?.oneStar ?? 0.5;
  const traceTwoStarThreshold =
    currentLesson?.scoring?.starThresholds?.twoStars ?? 0.85;
  const showPreviewCard = !isTracePracticeLesson;
  const requiresAnimationComplete =
    currentLesson?.type === "passive" &&
    Boolean(currentLesson.gating?.requireAnimationComplete);
  const displayText = isQuizLesson
    ? "?"
    : currentLesson?.targetText ??
      currentLesson?.targetLetter ??
      currentLesson?.title ??
      "?";

  // Filter active lessons for scoring context
  const activeLessonsCount = lessons.filter((l) => l.type === "active").length;

  const playAudio = (src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(src);
    audioRef.current = audio;
    audio.play().catch((err) => console.log("Audio play failed:", err));
  };

  const playOneShotAudio = (src: string) => {
    const audio = new Audio(src);
    audio.play().catch((err) => console.log("Audio play failed:", err));
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Auto-play audio when lesson changes
  useEffect(() => {
    if (!currentLesson?.mainAudio) return;
    playAudio(currentLesson.mainAudio);
  }, [currentStep, currentLesson?.mainAudio]);

  useEffect(() => {
    if (!requiresAnimationComplete || passiveReady) return;

    const timeoutId = window.setTimeout(() => {
      setPassiveReady(true);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [requiresAnimationComplete, passiveReady, currentStep]);

  const handleScoringResult = (correct: boolean) => {
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + 1);
    }

    if (correct) {
      playOneShotAudio(FEEDBACK_SUCCESS_AUDIO);
      playOneShotAudio(FEEDBACK_CHEER_AUDIO);
    } else {
      playOneShotAudio(FEEDBACK_FAIL_AUDIO);
    }

    setTimeout(() => {
      handleNext();
    }, FEEDBACK_ADVANCE_DELAY_MS);
  };

  const handleAnswer = (answer: LessonAnswer) => {
    if (!currentLesson || selectedAnswer || currentLesson.type !== "active")
      return;

    setSelectedAnswer(answer.id);
    handleScoringResult(answer.isCorrect);
  };

  const handleTraceEvaluate = (result: TraceEvaluation) => {
    if (
      !currentLesson ||
      currentLesson.type !== "active" ||
      !isTracePracticeLesson ||
      isCorrect !== null
    ) {
      return;
    }

    setTraceResult(result);
    const correct = result.score >= traceOneStarThreshold;
    handleScoringResult(correct);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTraceResult(null);

    if (audioRef.current) {
      audioRef.current.pause();
    }

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

      setCurrentStep(nextStep);
      return;
    }

    setShowCompletion(true);
  };

  // Guard against empty lessons
  if (!hasLessons || !currentLesson) {
    return (
      <div className="relative w-full h-dvh flex flex-col items-center justify-center bg-background">
        <p>No lessons available.</p>
        <button onClick={onBack} className="mt-4 p-2 bg-gray-200 rounded">
          Back
        </button>
      </div>
    );
  }

  if (showCompletion) {
    // If there were active lessons, calculate based on score.
    // If purely passive, give full stars (3).
    const stars =
      activeLessonsCount > 0 ? Math.ceil((score / activeLessonsCount) * 3) : 3;

    return (
      <div className="relative w-full h-dvh bg-linear-to-b from-yellow-bright/30 via-background to-green-bright/20 flex flex-col items-center justify-center p-6 pt-safe pb-safe overflow-hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center"
        >
          <Mascot size="lg" emotion="excited" />

          <motion.h1
            className="mt-8 text-4xl md:text-5xl font-bold text-foreground"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Tuyệt Vời!
          </motion.h1>

          <motion.div
            className="flex justify-center gap-4 mt-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.7 + i * 0.2, type: "spring" }}
              >
                <Star
                  className={`w-16 h-16 ${
                    i < stars
                      ? "text-yellow-bright fill-yellow-bright"
                      : "text-gray-300 fill-gray-200"
                  }`}
                />
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            className="mt-4 text-xl text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
          >
            {activeLessonsCount > 0
              ? `Bạn đã làm đúng ${score}/${activeLessonsCount} câu!`
              : "Bạn đã hoàn thành bài học!"}
          </motion.p>

          <motion.button
            onClick={onComplete}
            className="mt-8 relative group ios-button"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-orange-bright rounded-3xl translate-y-2 transition-transform" />
            <div className="relative bg-green-bright text-white text-xl font-bold px-12 py-4 rounded-3xl">
              Tiếp Tục
            </div>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh bg-linear-to-b from-blue-soft/20 via-background to-green-bright/10 flex flex-col overflow-hidden">
      <AnimatePresence>
        {isCorrect === true && <FullScreenSuccessCelebration />}
      </AnimatePresence>

      <div className="p-4 flex items-center gap-4 pt-safe">
        <motion.button
          onClick={onBack}
          className="p-3 bg-white rounded-2xl shadow-lg text-muted-foreground ios-button"
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-6 h-6" />
        </motion.button>

        <div className="flex-1 h-5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-bright rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="text-lg font-bold text-foreground">
          {currentStep + 1}/{lessons.length}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 app-scroll pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative w-full max-w-md text-center"
          >
            {currentLesson.instruction && (
              <p className="text-lg text-muted-foreground mb-2">
                {currentLesson.instruction}
              </p>
            )}
            {currentLesson.question && (
              <p className="text-xl text-foreground font-semibold mb-4">
                {currentLesson.question}
              </p>
            )}

            {showPreviewCard && (
              <motion.div
                className="relative mx-auto w-48 h-48 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 overflow-hidden"
                animate={
                  currentLesson.type === "passive"
                    ? { scale: [1, 1.02, 1] }
                    : {}
                }
                transition={{ duration: 2, repeat: Infinity }}
                onClick={() =>
                  currentLesson.mainAudio && playAudio(currentLesson.mainAudio)
                }
              >
                {currentLesson.mainImage ? (
                  <div className="relative w-full h-full p-4">
                    <Image
                      src={currentLesson.mainImage}
                      alt={currentLesson.title || "Lesson Image"}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-6xl font-bold text-green-bright">
                    {displayText}
                  </span>
                )}

                {currentLesson.mainAudio && (
                  <motion.button
                    className="absolute bottom-2 right-2 w-10 h-10 bg-orange-bright rounded-full shadow-lg flex items-center justify-center z-10"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentLesson.mainAudio!);
                    }}
                  >
                    <Volume2 className="w-5 h-5 text-white" />
                  </motion.button>
                )}
              </motion.div>
            )}

            {currentLesson.audioVariants && currentLesson.audioVariants.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                {currentLesson.audioVariants.map((variant) => (
                  <button
                    key={variant.speed}
                    onClick={() => playAudio(variant.audio)}
                    className="rounded-xl border-2 border-green-bright/30 bg-white px-4 py-2 text-sm font-semibold text-foreground ios-button"
                  >
                    {getSpeedLabel(variant.speed)}
                  </button>
                ))}
              </div>
            )}

            {currentLesson.title && (
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {currentLesson.title}
              </h2>
            )}
            {currentLesson.pronunciation && (
              <p className="text-xl font-semibold text-foreground mb-8">
                Nghe như:{" "}
                <span className="text-green-bright">
                  {currentLesson.pronunciation}
                </span>
              </p>
            )}

            {currentLesson.type === "passive" && (
              <motion.button
                onClick={handleNext}
                disabled={!passiveReady}
                className={`mt-4 relative group ios-button inline-block ${
                  !passiveReady ? "pointer-events-none opacity-70" : ""
                }`}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={passiveReady ? { scale: 0.95 } : {}}
              >
                <div className="absolute inset-0 bg-blue-500 rounded-3xl translate-y-2 transition-transform" />
                <div className="relative bg-blue-400 text-white text-xl font-bold px-12 py-4 rounded-3xl flex items-center gap-2">
                  {passiveReady ? (
                    <>
                      Tiếp Tục <ArrowRight className="w-6 h-6" />
                    </>
                  ) : (
                    "Đang xem mẫu..."
                  )}
                </div>
              </motion.button>
            )}

            {currentLesson.type === "active" && hasAnswerOptions && (
              <div className="flex justify-center gap-4 flex-wrap">
                {currentLesson.answers!.map((answer, index) => {
                  const isSelected = selectedAnswer === answer.id;
                  const isCorrectAnswer = answer.isCorrect;
                  const showResult = selectedAnswer !== null;

                  let bgColor = "bg-white";
                  let borderColor = "border-gray-200";
                  let textColor = "text-foreground";

                  if (showResult) {
                    if (isCorrectAnswer) {
                      bgColor = "bg-green-bright";
                      borderColor = "border-green-bright";
                      textColor = "text-white";
                    } else if (isSelected && !isCorrectAnswer) {
                      bgColor = "bg-red-500";
                      borderColor = "border-red-500";
                      textColor = "text-white";
                    }
                  }

                  return (
                    <motion.button
                      key={answer.id}
                      onClick={() => handleAnswer(answer)}
                      disabled={selectedAnswer !== null}
                      className={`min-w-20 min-h-20 px-4 py-2 ${bgColor} ${textColor} text-3xl font-bold rounded-2xl border-4 ${borderColor} shadow-lg ios-button flex items-center justify-center relative overflow-hidden`}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
                    >
                      {answer.image ? (
                        <div className="w-12 h-12 relative">
                          <Image
                            src={answer.image}
                            alt={answer.text || "Answer"}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <span className="relative z-10">{answer.text}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {currentLesson.type === "active" && isTracePracticeLesson && (
              <div className="mt-2 flex flex-col items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {isLetterTracePracticeLesson
                    ? "Bé tô theo chữ cái mờ bên dưới nhé."
                    : `Bé tô theo mẫu từ "${targetText}".`}
                </p>

                <LetterTracingCanvas
                  key={currentLesson.id}
                  targetText={targetText}
                  disabled={isCorrect !== null}
                  oneStarThreshold={traceOneStarThreshold}
                  twoStarThreshold={traceTwoStarThreshold}
                  onEvaluate={handleTraceEvaluate}
                />

                {traceResult && (
                  <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-md">
                    <p className="text-sm font-semibold text-foreground">
                      Điểm tô: {(traceResult.score * 100).toFixed(0)}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sao đạt được: {traceResult.stars}/2
                    </p>
                  </div>
                )}
              </div>
            )}

            {currentLesson.type === "active" &&
              !hasAnswerOptions &&
              !isTracePracticeLesson && (
                <motion.button
                  onClick={handleNext}
                  className="mt-4 relative group ios-button inline-block"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="absolute inset-0 bg-blue-500 rounded-3xl translate-y-2 transition-transform" />
                  <div className="relative bg-blue-400 text-white text-xl font-bold px-12 py-4 rounded-3xl flex items-center gap-2">
                    Tiếp Tục <ArrowRight className="w-6 h-6" />
                  </div>
                </motion.button>
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
                  {isCorrect
                    ? "Đúng rồi! Giỏi quá!"
                    : "Tiếc quá! Thử lại sau nhé!"}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

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
