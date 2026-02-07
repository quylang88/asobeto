"use client";

import { type PointerEvent, useCallback, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, Star, ArrowRight } from "lucide-react";
import { Mascot } from "../components/beto-mascot";
import { LessonButton } from "../components/lesson-button";
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
// Khung preview chữ đã tăng lên 240px nên canvas sương cần phủ kín đúng kích thước này
const FOG_CANVAS_SIZE = 240;
const FOG_ERASE_RADIUS = 24;
const LETTER_TOP_INSTRUCTION_KINDS = new Set([
  "letter_listen",
  "letter_quiz",
  "letter_trace_demo",
  "letter_trace_practice",
]);

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

function getPreviewTextSizeClass(value: string): string {
  const charCount = [...value].length;
  if (charCount <= 1) return "text-[10rem] md:text-[11rem]";
  if (charCount === 2) return "text-[8.5rem] md:text-[9.5rem]";
  return "text-7xl md:text-8xl";
}

interface FogRevealOverlayProps {
  revealKey: string;
}

function FogRevealOverlay({ revealKey }: FogRevealOverlayProps) {
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isErasingFog, setIsErasingFog] = useState(false);

  // Vẽ lớp sương mờ mới mỗi khi đổi lesson để bé cào/xóa lại từ đầu
  useEffect(() => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;

    const ratio = window.devicePixelRatio || 1;
    fogCanvas.width = Math.floor(FOG_CANVAS_SIZE * ratio);
    fogCanvas.height = Math.floor(FOG_CANVAS_SIZE * ratio);
    fogCanvas.style.width = `${FOG_CANVAS_SIZE}px`;
    fogCanvas.style.height = `${FOG_CANVAS_SIZE}px`;

    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;
    fogCtx.setTransform(1, 0, 0, 1, 0, 0);
    fogCtx.scale(ratio, ratio);
    fogCtx.clearRect(0, 0, FOG_CANVAS_SIZE, FOG_CANVAS_SIZE);

    // Tăng độ đậm của sương để không nhìn rõ nét chữ bên dưới trước khi bé xóa
    const fogGradient = fogCtx.createLinearGradient(
      0,
      0,
      FOG_CANVAS_SIZE,
      FOG_CANVAS_SIZE,
    );
    fogGradient.addColorStop(0, "rgba(217, 240, 223, 1)");
    fogGradient.addColorStop(1, "rgba(188, 224, 199, 1)");
    fogCtx.fillStyle = fogGradient;
    fogCtx.fillRect(0, 0, FOG_CANVAS_SIZE, FOG_CANVAS_SIZE);

    fogCtx.fillStyle = "rgba(236, 249, 239, 0.72)";
    for (let i = 0; i < 28; i += 1) {
      const x = (i * 29 + 12) % FOG_CANVAS_SIZE;
      const y = (i * 47 + 18) % FOG_CANVAS_SIZE;
      const radius = 15 + (i % 5) * 5;
      fogCtx.beginPath();
      fogCtx.arc(x, y, radius, 0, Math.PI * 2);
      fogCtx.fill();
    }
  }, [revealKey]);

  // Xóa sương đúng vị trí ngón tay khi bé chạm/di trên canvas
  const eraseFogAtPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;
    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;

    const rect = fogCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * FOG_CANVAS_SIZE;
    const y = ((event.clientY - rect.top) / rect.height) * FOG_CANVAS_SIZE;

    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.beginPath();
    fogCtx.arc(x, y, FOG_ERASE_RADIUS, 0, Math.PI * 2);
    fogCtx.fill();
    fogCtx.restore();
  };

  return (
    <canvas
      ref={fogCanvasRef}
      className="absolute inset-0 z-10 rounded-3xl touch-none"
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsErasingFog(true);
        eraseFogAtPoint(event);
      }}
      onPointerMove={(event) => {
        if (!isErasingFog) return;
        event.preventDefault();
        eraseFogAtPoint(event);
      }}
      onPointerUp={() => setIsErasingFog(false)}
      onPointerCancel={() => setIsErasingFog(false)}
      onPointerLeave={() => setIsErasingFog(false)}
      aria-label="Lớp sương mờ để bé chạm và xóa"
    />
  );
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

interface TraceStarsPopupProps {
  stars: number;
}

function TraceStarsPopup({ stars }: TraceStarsPopupProps) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute h-40 w-40 rounded-full bg-yellow-bright/30 blur-2xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.05, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.35 }}
      />
      {Array.from({ length: stars }).map((_, index) => (
        <motion.div
          key={`trace-star-${index}`}
          className="absolute"
          initial={{
            opacity: 0,
            x: index % 2 === 0 ? -30 : 30,
            y: 34,
            scale: 0.4,
            rotate: index % 2 === 0 ? -20 : 20,
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: index % 2 === 0 ? -74 : 74,
            y: -108 - index * 16,
            scale: [0.4, 1.2, 1],
            rotate: index % 2 === 0 ? -18 : 18,
          }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 1.2, delay: index * 0.12, ease: "easeOut" }}
        >
          <Star className="h-16 w-16 fill-yellow-bright text-yellow-bright drop-shadow-[0_0_18px_rgba(250,204,21,0.65)]" />
        </motion.div>
      ))}
    </motion.div>
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
  const [traceStarBurstCount, setTraceStarBurstCount] = useState<number | null>(
    null,
  );
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
  const isTracePracticeLesson =
    currentLesson?.lessonKind === "letter_trace_practice" ||
    currentLesson?.lessonKind === "vocab_trace_practice";
  const isLetterTracePracticeLesson =
    currentLesson?.lessonKind === "letter_trace_practice";
  const isVocabTracePracticeLesson =
    currentLesson?.lessonKind === "vocab_trace_practice";
  const isLetterTraceDemoLesson = currentLesson?.lessonKind === "letter_trace_demo";
  // Gom nhóm 4 lesson chữ cái để dùng chung cách hiển thị instruction trên cùng
  const shouldPromoteTitleToInstruction = Boolean(
    currentLesson?.lessonKind &&
      LETTER_TOP_INSTRUCTION_KINDS.has(currentLesson.lessonKind),
  );
  const topInstructionText = shouldPromoteTitleToInstruction
    ? currentLesson?.title
    : currentLesson?.instruction;
  const topInstructionClassName = shouldPromoteTitleToInstruction
    ? "text-xl md:text-2xl text-foreground font-bold mb-5"
    : "text-lg text-muted-foreground mb-2";
  const secondaryQuestionText = shouldPromoteTitleToInstruction
    ? undefined
    : currentLesson?.question;
  const showTitleBelowPreview =
    Boolean(currentLesson?.title) && !shouldPromoteTitleToInstruction;
  const hasAnswerOptions = Boolean(currentLesson?.answers?.length);
  const targetText =
    currentLesson?.targetText ?? currentLesson?.targetLetter ?? "";
  const traceOneStarThreshold =
    currentLesson?.scoring?.starThresholds?.oneStar ?? 0.5;
  const traceTwoStarThreshold =
    currentLesson?.scoring?.starThresholds?.twoStars ?? 0.85;
  const showPreviewCard = !isTracePracticeLesson && !isLetterTraceDemoLesson;
  const requiresAnimationComplete =
    currentLesson?.type === "passive" &&
    Boolean(currentLesson.gating?.requireAnimationComplete);
  // Lesson quiz hiển thị chữ cái thật dưới lớp sương, không còn dấu hỏi
  const isFogRevealLesson = currentLesson?.lessonKind === "letter_quiz";
  const displayText =
    currentLesson?.targetText ??
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

  const handleTraceDemoComplete = useCallback(() => {
    setPassiveReady(true);
  }, []);

  useEffect(() => {
    if (!traceStarBurstCount) return;

    const timeoutId = window.setTimeout(() => {
      setTraceStarBurstCount(null);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [traceStarBurstCount]);

  useEffect(() => {
    if (!requiresAnimationComplete || passiveReady || isLetterTraceDemoLesson)
      return;

    const timeoutId = window.setTimeout(() => {
      setPassiveReady(true);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [requiresAnimationComplete, passiveReady, currentStep, isLetterTraceDemoLesson]);

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
    // Lesson 4 hiển thị popup sao bay lên thay vì hiện điểm %
    if (currentLesson.lessonKind === "letter_trace_practice" && result.stars > 0) {
      setTraceStarBurstCount(Math.min(2, result.stars));
    }
    const correct = result.score >= traceOneStarThreshold;
    handleScoringResult(correct);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTraceResult(null);
    setTraceStarBurstCount(null);

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
        <LessonButton
          onClick={onBack}
          className="mt-4 rounded-2xl"
          frontClassName="px-5 py-2 text-sm"
        >
          Back
        </LessonButton>
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

          <motion.div
            className="mt-8 inline-block"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            whileTap={{ scale: 0.95 }}
          >
            <LessonButton
              onClick={onComplete}
              className="rounded-3xl"
              frontClassName="px-12 py-4 text-xl"
            >
              Tiếp Tục
            </LessonButton>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-dvh bg-linear-to-b from-blue-soft/20 via-background to-green-bright/10 flex flex-col overflow-hidden">
      <AnimatePresence>
        {isCorrect === true && <FullScreenSuccessCelebration />}
      </AnimatePresence>
      <AnimatePresence>
        {traceStarBurstCount && isLetterTracePracticeLesson && (
          <TraceStarsPopup stars={traceStarBurstCount} />
        )}
      </AnimatePresence>

      <div className="p-4 flex items-center gap-4 pt-safe">
        <motion.div whileTap={{ scale: 0.95 }}>
          <LessonButton
            onClick={onBack}
            className="rounded-2xl"
            frontClassName="h-12 w-12"
            aria-label="Thoát bài học"
          >
            <X className="w-6 h-6" />
          </LessonButton>
        </motion.div>

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
            {/* Ưu tiên đưa tiêu đề lesson chữ cái lên đầu màn hình như instruction */}
            {topInstructionText && (
              <p className={topInstructionClassName}>
                {topInstructionText}
              </p>
            )}
            {secondaryQuestionText && (
              <p className="text-xl text-foreground font-semibold mb-4">
                {secondaryQuestionText}
              </p>
            )}

            {showPreviewCard && (
              <motion.div
                className="relative mx-auto h-60 w-60 bg-white rounded-3xl shadow-xl mb-6 overflow-hidden"
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
                  <span
                    className={`absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-nowrap font-bold leading-none text-green-bright ${getPreviewTextSizeClass(displayText)}`}
                  >
                    {displayText}
                  </span>
                )}

                {/* Lesson nghe-chọn hiển thị chữ cái dưới lớp sương để bé chạm và mở dần */}
                {isFogRevealLesson && !currentLesson.mainImage && (
                  <FogRevealOverlay revealKey={currentLesson.id} />
                )}

                {currentLesson.mainAudio && (
                  <motion.div
                    className="absolute bottom-2 right-2 z-20"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LessonButton
                      className="rounded-full"
                      frontClassName="h-10 w-10"
                      aria-label="Phát lại âm thanh"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudio(currentLesson.mainAudio!);
                      }}
                    >
                      <Volume2 className="w-5 h-5 text-white" />
                    </LessonButton>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentLesson.audioVariants && currentLesson.audioVariants.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                {currentLesson.audioVariants.map((variant) => (
                  <LessonButton
                    key={variant.speed}
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(variant.audio);
                    }}
                    className="rounded-xl"
                    frontClassName="px-4 py-2 text-sm"
                  >
                    {getSpeedLabel(variant.speed)}
                  </LessonButton>
                ))}
              </div>
            )}

            {showTitleBelowPreview && (
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

            {currentLesson.type === "passive" && isLetterTraceDemoLesson && (
              <div className="mt-2 flex flex-col items-center gap-3">
                {/* Dùng lại khung tô chữ và cho hệ thống tự chạy nét mẫu */}
                <LetterTracingCanvas
                  key={`${currentLesson.id}-demo`}
                  mode="demo"
                  targetText={targetText}
                  onAutoTraceComplete={handleTraceDemoComplete}
                />
              </div>
            )}

            {currentLesson.type === "passive" && (
              <motion.div
                className="mt-4 inline-block"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileTap={passiveReady ? { scale: 0.95 } : {}}
              >
                <LessonButton
                  onClick={handleNext}
                  disabled={!passiveReady}
                  className="rounded-3xl"
                  frontClassName="px-12 py-4 text-xl flex items-center gap-2"
                >
                  {passiveReady ? (
                    <>
                      Tiếp Tục <ArrowRight className="w-6 h-6" />
                    </>
                  ) : (
                    "Đang xem mẫu..."
                  )}
                </LessonButton>
              </motion.div>
            )}

            {currentLesson.type === "active" && hasAnswerOptions && (
              <div className="flex justify-center gap-4 flex-wrap">
                {currentLesson.answers!.map((answer, index) => {
                  const isSelected = selectedAnswer === answer.id;
                  const isCorrectAnswer = answer.isCorrect;
                  const showResult = selectedAnswer !== null;

                  // Giữ tone xanh-cam cho đáp án, chỉ đổi đỏ khi bé chọn sai
                  const answerTone =
                    showResult && isSelected && !isCorrectAnswer
                      ? "danger"
                      : "brand";
                  const fadeUnselectedWrong =
                    showResult && !isCorrectAnswer && !isSelected
                      ? "opacity-80"
                      : "";
                  const highlightCorrect = showResult && isCorrectAnswer;

                  return (
                    <motion.div
                      key={answer.id}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
                    >
                      <LessonButton
                        tone={answerTone}
                        onClick={() => handleAnswer(answer)}
                        disabled={selectedAnswer !== null}
                        className={`rounded-2xl ${highlightCorrect ? "ring-4 ring-green-bright/30" : ""}`}
                        frontClassName={`min-w-24 min-h-24 px-4 py-2 text-5xl leading-none ${fadeUnselectedWrong}`}
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
                      </LessonButton>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {currentLesson.type === "active" && isTracePracticeLesson && (
              <div className="mt-2 flex flex-col items-center gap-3">
                {!isLetterTracePracticeLesson && (
                  <p className="text-sm text-muted-foreground">
                    {`Bé tô theo mẫu từ "${targetText}".`}
                  </p>
                )}

                <LetterTracingCanvas
                  key={currentLesson.id}
                  mode="practice"
                  targetText={targetText}
                  disabled={isCorrect !== null}
                  oneStarThreshold={traceOneStarThreshold}
                  twoStarThreshold={traceTwoStarThreshold}
                  onEvaluate={handleTraceEvaluate}
                />

                {traceResult && isVocabTracePracticeLesson && (
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
                <motion.div
                  className="mt-4 inline-block"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LessonButton
                    onClick={handleNext}
                    className="rounded-3xl"
                    frontClassName="px-12 py-4 text-xl flex items-center gap-2"
                  >
                    Tiếp Tục <ArrowRight className="w-6 h-6" />
                  </LessonButton>
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
