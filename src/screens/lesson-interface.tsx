"use client";

import {
  type DragEvent,
  type PointerEvent,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, RotateCcw, X, Star, ArrowRight, Mic, Square } from "lucide-react";
import { Mascot } from "../components/beto-mascot";
import { LessonButton } from "../components/lesson-button";
import { LessonStarCelebration } from "../components/lesson-star-celebration";
import {
  LetterTracingCanvas,
  LETTER_TRACING_CANVAS_HEIGHT,
  LETTER_TRACING_CANVAS_WIDTH,
  type TraceEvaluation,
} from "../components/letter-tracing-canvas";
import { LessonContent, LessonAnswer } from "../data/game-config";
import { getStoredLessonStars, saveFloorProgress } from "@/lib/floor-progress";

interface LessonInterfaceProps {
  worldId: number;
  towerId: number;
  floorId: number;
  floorName: string;
  lessons: LessonContent[];
  onComplete: () => void;
  onBack: () => void;
}

const FEEDBACK_ADVANCE_DELAY_MS = 2600;
const TRACE_STARS_ADVANCE_DELAY_MS = 3800;
const FEEDBACK_SUCCESS_AUDIO = "/assets/audio/feedback/success-answer.mp3";
const FEEDBACK_WRONG_AUDIO = "/assets/audio/feedback/wrong-answer.mp3";
const FEEDBACK_FLOOR_CHEER_AUDIO = "/assets/audio/feedback/applause-cheering.mp3";
const FEEDBACK_FLOOR_TRY_AGAIN_AUDIO = "/assets/audio/feedback/try-again.mp3";
const CONFETTI_COLORS = ["#22c55e", "#f59e0b", "#38bdf8", "#fb7185", "#f97316"];
const FOG_ERASE_RADIUS = 24;
const LESSON_PREVIEW_CONTROL_OFFSET_CLASS = "-right-14";
const FLOOR_MAX_STARS = 3;
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
  xDrift: (index % 2 === 0 ? 1 : -1) * (10 + (index % 4) * 8),
  rotate: (index * 43) % 360,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionResultEventLike = {
  results: ArrayLike<{
    0?: {
      transcript?: string;
    };
  }>;
};

type SpeechRecognitionErrorEventLike = {
  error?: string;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

type WordBuildToken = NonNullable<LessonContent["targetTokens"]>[number];

interface WordBuildSlotPlacement {
  slotIndex: number;
  column: number;
  row: 0 | 1 | 2;
}

function normalizeSpeechText(value: string, removeDiacritics: boolean): string {
  let normalized = value.toLocaleLowerCase("vi-VN");
  if (removeDiacritics) {
    normalized = normalized
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  }
  return normalized
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getLevenshteinDistance(a: string, b: string): number {
  if (!a) return b.length;
  if (!b) return a.length;

  const previousRow = new Array(b.length + 1);
  const currentRow = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) {
    previousRow[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    currentRow[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        previousRow[j] + 1,
        previousRow[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[b.length];
}

function getNormalizedSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength <= 0) return 1;
  return Math.max(0, 1 - getLevenshteinDistance(a, b) / maxLength);
}

function getSpeechSimilarity(spokenText: string, targetText: string): number {
  const spokenOriginal = normalizeSpeechText(spokenText, false);
  const targetOriginal = normalizeSpeechText(targetText, false);
  const spokenNoDiacritics = normalizeSpeechText(spokenText, true);
  const targetNoDiacritics = normalizeSpeechText(targetText, true);

  const directScore = getNormalizedSimilarity(spokenOriginal, targetOriginal);
  const noDiacriticsScore = getNormalizedSimilarity(
    spokenNoDiacritics,
    targetNoDiacritics,
  );

  return Math.max(directScore, noDiacriticsScore);
}

function getSpeedLabel(speed: string): string {
  if (speed === "slow") return "Chậm";
  if (speed === "fast") return "Nhanh";
  return "Thường";
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function getWordBuildTokenDisplayText(token: WordBuildToken): string {
  if (token.kind !== "tone") return token.text;

  const normalizedTokenId = token.id.toLocaleLowerCase("vi-VN");
  if (normalizedTokenId.includes("sac")) return "´";
  if (normalizedTokenId.includes("huyen")) return "`";
  if (normalizedTokenId.includes("nga")) return "~";
  if (normalizedTokenId.includes("hoi")) return "?";
  if (normalizedTokenId.includes("nang")) return "•";

  return token.text;
}

function getWordBuildSlotPlacements(tokens: WordBuildToken[]): {
  placements: WordBuildSlotPlacement[];
  columnCount: number;
} {
  let columnCount = 0;
  let lastLetterColumn = 0;
  const placements: WordBuildSlotPlacement[] = [];

  tokens.forEach((token, slotIndex) => {
    if (token.kind === "letter") {
      columnCount += 1;
      lastLetterColumn = columnCount;
      placements.push({
        slotIndex,
        column: columnCount,
        row: 1,
      });
      return;
    }

    const normalizedTokenId = token.id.toLocaleLowerCase("vi-VN");
    const normalizedTokenText = token.text.toLocaleLowerCase("vi-VN");
    const isDotBelowTone =
      normalizedTokenId.includes("nang") || normalizedTokenText.includes("nặng");
    const anchorColumn = lastLetterColumn || Math.max(1, columnCount);

    placements.push({
      slotIndex,
      column: anchorColumn,
      row: isDotBelowTone ? 2 : 0,
    });
  });

  return {
    placements,
    columnCount: Math.max(1, columnCount),
  };
}

function getPreviewTextSizeClass(value: string): string {
  const charCount = [...value].length;
  if (charCount <= 1) return "text-[10rem] md:text-[11rem]";
  if (charCount === 2) return "text-[8.5rem] md:text-[9.5rem]";
  return "text-7xl md:text-8xl";
}

function getLessonMaxStars(lesson: LessonContent): number {
  if (lesson.type !== "active") return 0;
  return lesson.scoring?.maxStars ?? 0;
}

function getAttemptFloorStars(
  lessons: LessonContent[],
  lessonStars: Record<string, number>,
): number {
  const totalPossibleStars = lessons.reduce(
    (sum, lesson) => sum + getLessonMaxStars(lesson),
    0,
  );
  const earnedStars = lessons.reduce((sum, lesson) => {
    if (lesson.type !== "active") return sum;
    return sum + (lessonStars[lesson.id] ?? 0);
  }, 0);

  if (totalPossibleStars <= 0) {
    return FLOOR_MAX_STARS;
  }

  return Math.max(0, Math.min(FLOOR_MAX_STARS, Math.round(earnedStars)));
}

function getWordBuildStateForLesson(
  lesson: LessonContent | undefined,
): {
  tokenOrder: string[];
  slotTokenIds: Array<string | null>;
} {
  if (!lesson || lesson.lessonKind !== "vocab_word_build") {
    return {
      tokenOrder: [],
      slotTokenIds: [],
    };
  }

  const expectedTokens = lesson.targetTokens ?? [];
  const sourceTokens = lesson.instruction
    ? (lesson.tokenPool ?? expectedTokens)
    : expectedTokens;

  return {
    tokenOrder: shuffleArray(sourceTokens.map((token) => token.id)),
    slotTokenIds: Array.from({ length: expectedTokens.length }, () => null),
  };
}

function getTracePracticeLessonIdFromDemoLessonId(
  demoLessonId: string | undefined,
): string | null {
  if (!demoLessonId) return null;
  const pairedLessonId = demoLessonId.replace(/-l3$/, "-l4");
  return pairedLessonId === demoLessonId ? null : pairedLessonId;
}

interface FogRevealOverlayProps {
  revealKey: string;
  width: number;
  height: number;
  roundedClassName?: string;
}

function FogRevealOverlay({
  revealKey,
  width,
  height,
  roundedClassName = "rounded-md",
}: FogRevealOverlayProps) {
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isErasingFog, setIsErasingFog] = useState(false);

  // Vẽ lớp sương mờ mới mỗi khi đổi lesson để bé cào/xóa lại từ đầu
  useEffect(() => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;

    const ratio = window.devicePixelRatio || 1;
    fogCanvas.width = Math.floor(width * ratio);
    fogCanvas.height = Math.floor(height * ratio);
    fogCanvas.style.width = `${width}px`;
    fogCanvas.style.height = `${height}px`;

    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;
    fogCtx.setTransform(1, 0, 0, 1, 0, 0);
    fogCtx.scale(ratio, ratio);
    fogCtx.clearRect(0, 0, width, height);

    // Tăng độ đậm của sương để không nhìn rõ nét chữ bên dưới trước khi bé xóa
    const fogGradient = fogCtx.createLinearGradient(0, 0, width, height);
    fogGradient.addColorStop(0, "rgba(217, 240, 223, 1)");
    fogGradient.addColorStop(1, "rgba(188, 224, 199, 1)");
    fogCtx.fillStyle = fogGradient;
    fogCtx.fillRect(0, 0, width, height);

    fogCtx.fillStyle = "rgba(236, 249, 239, 0.72)";
    const textureCount = Math.max(24, Math.round((width * height) / 1600));
    for (let i = 0; i < textureCount; i += 1) {
      const x = (i * 29 + 12) % width;
      const y = (i * 47 + 18) % height;
      const radius = 15 + (i % 5) * 5;
      fogCtx.beginPath();
      fogCtx.arc(x, y, radius, 0, Math.PI * 2);
      fogCtx.fill();
    }
  }, [revealKey, width, height]);

  // Xóa sương đúng vị trí ngón tay khi bé chạm/di trên canvas
  const eraseFogAtPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;
    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;

    const rect = fogCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;

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
      className={`absolute inset-0 z-10 touch-none ${roundedClassName}`}
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

export function LessonInterface({
  worldId,
  towerId,
  floorId,
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
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [isMicSubmitting, setIsMicSubmitting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceTimeoutRef = useRef<number | null>(null);
  const handleNextRef = useRef<() => void>(() => {});
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const speechFinalizeRef = useRef(false);
  const speechTranscriptRef = useRef("");
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAudioContextRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micFrameRef = useRef<number | null>(null);
  const wordBuildDragTokenIdRef = useRef<string | null>(null);

  const hasLessons = lessons.length > 0;
  const currentLesson = hasLessons ? lessons[currentStep] : undefined;
  const currentLessonId = currentLesson?.id;
  const currentLessonIntroVoice = currentLesson?.introVoice;
  const currentLessonMainAudio = currentLesson?.mainAudio;
  const progress = hasLessons ? ((currentStep + 1) / lessons.length) * 100 : 0;
  const isTracePracticeLesson =
    currentLesson?.lessonKind === "letter_trace_practice" ||
    currentLesson?.lessonKind === "vocab_trace_practice";
  const isLetterTracePracticeLesson =
    currentLesson?.lessonKind === "letter_trace_practice";
  const isVocabTracePracticeLesson =
    currentLesson?.lessonKind === "vocab_trace_practice";
  const isWordBuildLesson = currentLesson?.lessonKind === "vocab_word_build";
  const isLetterTraceDemoLesson =
    currentLesson?.lessonKind === "letter_trace_demo";
  const isLetterListenLesson = currentLesson?.lessonKind === "letter_listen";
  const isVocabListenRepeatLesson =
    currentLesson?.lessonKind === "vocab_listen_repeat";
  const isFloor3ListenLookLesson = Boolean(
    currentLesson?.lessonKind === "vocab_listen_look" &&
      !currentLesson?.instruction,
  );
  const shouldUseLargerVocabImage = Boolean(
    currentLesson?.mainImage &&
      (currentLesson.lessonKind === "vocab_listen_look" ||
        currentLesson.lessonKind === "vocab_listen_repeat"),
  );
  const isThresholdSpeechLesson = Boolean(
    isVocabListenRepeatLesson &&
      currentLesson?.scoring?.passPolicy === "threshold",
  );
  // Gom nhóm 4 lesson chữ cái để dùng chung cách hiển thị instruction trên cùng
  const shouldPromoteTitleToInstruction = Boolean(
    currentLesson?.lessonKind &&
    LETTER_TOP_INSTRUCTION_KINDS.has(currentLesson.lessonKind),
  );
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
  const wordBuildTargetTokenIds = wordBuildExpectedTokens.map(
    (token) => token.id,
  );
  const wordBuildSourceTokenIds = wordBuildSourceTokens.map((token) => token.id);
  const wordBuildPlacedTokenIds = new Set(
    wordBuildSlotTokenIds.filter((tokenId): tokenId is string => tokenId !== null),
  );
  const wordBuildTokenMap = new Map(
    [...wordBuildSourceTokens, ...wordBuildExpectedTokens].map((token) => [
      token.id,
      token,
    ]),
  );
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
  const isFogRevealLesson = currentLesson?.lessonKind === "letter_quiz";
  const isLetterGridPreviewLesson = isLetterListenLesson || isFogRevealLesson;
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

  const playAudio = (src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(src);
    audioRef.current = audio;
    audio.play().catch((err) => console.log("Audio play failed:", err));
  };

  const playOneShotAudio = useCallback((src: string) => {
    const audio = new Audio(src);
    audio.play().catch((err) => console.log("Audio play failed:", err));
  }, []);

  useEffect(() => {
    lessonStarsThisAttemptRef.current = lessonStarsThisAttempt;
  }, [lessonStarsThisAttempt]);

  // Dọn timeout chuyển lesson để tránh timer cũ "nhảy cóc" khi bé vào/ra màn nhiều lần
  const clearAdvanceTimeout = useCallback(() => {
    if (advanceTimeoutRef.current === null) return;
    window.clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = null;
  }, []);

  const stopMicLevelCapture = useCallback(() => {
    if (micFrameRef.current !== null) {
      window.cancelAnimationFrame(micFrameRef.current);
      micFrameRef.current = null;
    }
    if (micAudioContextRef.current) {
      micAudioContextRef.current.close().catch(() => undefined);
      micAudioContextRef.current = null;
    }
    micAnalyserRef.current = null;
    if (micStreamRef.current) {
      for (const track of micStreamRef.current.getTracks()) {
        track.stop();
      }
      micStreamRef.current = null;
    }
    setMicLevel(0);
  }, []);

  const stopSpeechRecognition = useCallback((abort: boolean) => {
    const recognition = speechRecognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    if (abort) {
      recognition.abort();
    } else {
      recognition.stop();
    }
    speechRecognitionRef.current = null;
  }, []);

  const resetSpeechSession = useCallback(() => {
    speechFinalizeRef.current = false;
    speechTranscriptRef.current = "";
    stopSpeechRecognition(true);
    stopMicLevelCapture();
    setIsMicRecording(false);
    setIsMicSubmitting(false);
  }, [stopMicLevelCapture, stopSpeechRecognition]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      clearAdvanceTimeout();
      resetSpeechSession();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [clearAdvanceTimeout, resetSpeechSession]);

  // Auto-play intro audio first, then main lesson audio.
  useEffect(() => {
    if (!currentLessonId) return;

    const introAudio = currentLessonIntroVoice?.trim();
    const mainAudio = currentLessonMainAudio;
    if (!introAudio && !mainAudio) return;

    let isCancelled = false;
    let primaryAudio: HTMLAudioElement | null = null;
    let followUpAudio: HTMLAudioElement | null = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    const playAudioSource = (
      src: string,
      onEnded?: () => void,
    ): HTMLAudioElement => {
      const audio = new Audio(src);
      audioRef.current = audio;
      if (onEnded) {
        audio.addEventListener("ended", onEnded, { once: true });
        audio.addEventListener("error", onEnded, { once: true });
      }
      audio.play().catch((err) => console.log("Audio play failed:", err));
      return audio;
    };

    const playMainAudio = () => {
      if (isCancelled || !mainAudio) {
        return;
      }
      followUpAudio = playAudioSource(mainAudio);
    };

    if (introAudio) {
      const shouldChainMainAudio =
        Boolean(mainAudio) && introAudio !== mainAudio;
      primaryAudio = playAudioSource(
        introAudio,
        shouldChainMainAudio ? playMainAudio : undefined,
      );
    } else if (mainAudio) {
      primaryAudio = playAudioSource(mainAudio);
    }

    return () => {
      isCancelled = true;
      if (primaryAudio) {
        primaryAudio.pause();
        primaryAudio.currentTime = 0;
      }
      if (followUpAudio) {
        followUpAudio.pause();
        followUpAudio.currentTime = 0;
      }
    };
  }, [
    currentStep,
    currentLessonId,
    currentLessonIntroVoice,
    currentLessonMainAudio,
  ]);

  const handleTraceDemoComplete = useCallback(() => {
    setPassiveReady(true);
  }, []);

  const handleReplayTraceDemo = () => {
    clearAdvanceTimeout();
    setPassiveReady(false);
    setTraceDemoFastForwarded(false);
    setTraceDemoReplayKey((prev) => prev + 1);
  };

  const handleFastForwardTraceDemo = useCallback(() => {
    if (!canFastForwardTraceDemo || passiveReady || traceDemoFastForwarded) {
      return;
    }

    clearAdvanceTimeout();
    setTraceDemoFastForwarded(true);
    setPassiveReady(true);
  }, [
    canFastForwardTraceDemo,
    clearAdvanceTimeout,
    passiveReady,
    traceDemoFastForwarded,
  ]);

  useEffect(() => {
    if (!requiresAnimationComplete || passiveReady || isLetterTraceDemoLesson)
      return;

    const timeoutId = window.setTimeout(() => {
      setPassiveReady(true);
    }, 2500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    requiresAnimationComplete,
    passiveReady,
    currentStep,
    isLetterTraceDemoLesson,
  ]);

  const handleScoringResult = useCallback(
    (
      correct: boolean,
      advanceDelayMs: number = FEEDBACK_ADVANCE_DELAY_MS,
      earnedStars: number = 0,
    ) => {
      resetSpeechSession();

      if (currentLesson?.type === "active") {
        const normalizedStars = Math.max(
          0,
          Math.min(getLessonMaxStars(currentLesson), Math.round(earnedStars)),
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

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      playOneShotAudio(correct ? FEEDBACK_SUCCESS_AUDIO : FEEDBACK_WRONG_AUDIO);

      // Luôn reset timer cũ rồi mới tạo timer mới để đảm bảo thời gian chờ đúng theo lesson hiện tại
      clearAdvanceTimeout();
      advanceTimeoutRef.current = window.setTimeout(() => {
        advanceTimeoutRef.current = null;
        handleNextRef.current();
      }, advanceDelayMs);
    },
    [clearAdvanceTimeout, currentLesson, playOneShotAudio, resetSpeechSession],
  );

  const finalizeSpeechAttempt = useCallback(
    (capturedTranscript: string) => {
      if (
        !currentLesson ||
        currentLesson.type !== "active" ||
        !isThresholdSpeechLesson
      ) {
        return;
      }
      if (speechFinalizeRef.current) return;
      speechFinalizeRef.current = true;

      const transcript = capturedTranscript.trim();
      setIsMicRecording(false);
      setIsMicSubmitting(false);
      stopSpeechRecognition(true);
      stopMicLevelCapture();

      const oneStarThreshold =
        currentLesson.scoring?.starThresholds?.oneStar ?? 0.5;
      const twoStarThreshold =
        currentLesson.scoring?.starThresholds?.twoStars ?? 0.75;
      const lessonMaxStars = currentLesson.scoring?.maxStars ?? 2;

      if (!transcript) {
        handleScoringResult(false, FEEDBACK_ADVANCE_DELAY_MS, 0);
        return;
      }

      const similarity = getSpeechSimilarity(transcript, targetText);

      let earnedStars = 0;
      if (similarity >= twoStarThreshold) {
        earnedStars = 2;
      } else if (similarity >= oneStarThreshold) {
        earnedStars = 1;
      }
      earnedStars = Math.min(lessonMaxStars, earnedStars);

      handleScoringResult(similarity >= oneStarThreshold, FEEDBACK_ADVANCE_DELAY_MS, earnedStars);
    },
    [
      currentLesson,
      handleScoringResult,
      isThresholdSpeechLesson,
      stopMicLevelCapture,
      stopSpeechRecognition,
      targetText,
    ],
  );

  const startSpeechCapture = useCallback(async () => {
    if (
      !currentLesson ||
      currentLesson.type !== "active" ||
      !isThresholdSpeechLesson ||
      isCorrect !== null ||
      isMicRecording ||
      isMicSubmitting
    ) {
      return;
    }

    const speechWindow = window as SpeechRecognitionWindow;
    const RecognitionCtor =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      return;
    }

    clearAdvanceTimeout();
    speechTranscriptRef.current = "";
    speechFinalizeRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const AudioContextCtor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextCtor) {
        const audioContext = new AudioContextCtor();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        micAudioContextRef.current = audioContext;
        micAnalyserRef.current = analyser;

        const pcmBuffer = new Uint8Array(analyser.fftSize);
        const tick = () => {
          const activeAnalyser = micAnalyserRef.current;
          if (!activeAnalyser) return;
          activeAnalyser.getByteTimeDomainData(pcmBuffer);
          let sumSquares = 0;
          for (let i = 0; i < pcmBuffer.length; i += 1) {
            const normalizedSample = (pcmBuffer[i] - 128) / 128;
            sumSquares += normalizedSample * normalizedSample;
          }
          const rms = Math.sqrt(sumSquares / pcmBuffer.length);
          setMicLevel(Math.min(1, rms * 8));
          micFrameRef.current = window.requestAnimationFrame(tick);
        };
        tick();
      }

      const recognition = new RecognitionCtor();
      speechRecognitionRef.current = recognition;

      recognition.lang = "vi-VN";
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
        const segments: string[] = [];
        for (let i = 0; i < event.results.length; i += 1) {
          const transcript = event.results[i]?.[0]?.transcript;
          if (typeof transcript === "string" && transcript.trim()) {
            segments.push(transcript.trim());
          }
        }
        const mergedTranscript = segments.join(" ").trim();
        speechTranscriptRef.current = mergedTranscript;
      };

      recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
        const errorCode =
          typeof event?.error === "string" ? event.error : "unknown";
        console.log("Speech recognition error:", errorCode);
      };

      recognition.onend = () => {
        finalizeSpeechAttempt(speechTranscriptRef.current);
      };

      setIsMicRecording(true);
      recognition.start();
    } catch (error) {
      console.log("Microphone start failed:", error);
      stopMicLevelCapture();
      setIsMicRecording(false);
      setIsMicSubmitting(false);
    }
  }, [
    clearAdvanceTimeout,
    currentLesson,
    finalizeSpeechAttempt,
    isCorrect,
    isMicRecording,
    isMicSubmitting,
    isThresholdSpeechLesson,
    stopMicLevelCapture,
  ]);

  const submitSpeechCapture = useCallback(() => {
    if (!isMicRecording || isMicSubmitting) return;
    setIsMicRecording(false);
    setIsMicSubmitting(true);

    const recognition = speechRecognitionRef.current;
    if (recognition) {
      recognition.stop();
      return;
    }

    finalizeSpeechAttempt(speechTranscriptRef.current);
  }, [finalizeSpeechAttempt, isMicRecording, isMicSubmitting]);

  const handleMicButtonClick = useCallback(() => {
    if (isMicRecording) {
      submitSpeechCapture();
      return;
    }
    if (!isMicSubmitting) {
      startSpeechCapture().catch((error) => {
        console.log("Start speech capture failed:", error);
      });
    }
  }, [isMicRecording, isMicSubmitting, startSpeechCapture, submitSpeechCapture]);

  const handleAnswer = (answer: LessonAnswer) => {
    if (!currentLesson || selectedAnswer || currentLesson.type !== "active")
      return;

    setSelectedAnswer(answer.id);
    const earnedStars =
      answer.isCorrect && currentLesson.scoring?.maxStars
        ? currentLesson.scoring.maxStars
        : 0;
    handleScoringResult(
      answer.isCorrect,
      FEEDBACK_ADVANCE_DELAY_MS,
      earnedStars,
    );
  };

  const placeWordBuildTokenInSlot = (tokenId: string, slotIndex: number) => {
    if (!isWordBuildLesson || isCorrect !== null) return;
    if (!wordBuildSourceTokenIds.includes(tokenId)) return;

    setWordBuildSlotTokenIds((previousSlots) => {
      if (slotIndex < 0 || slotIndex >= previousSlots.length) {
        return previousSlots;
      }

      const nextSlots = [...previousSlots];
      const sourceSlotIndex = nextSlots.findIndex(
        (placedTokenId) => placedTokenId === tokenId,
      );

      if (sourceSlotIndex === slotIndex) {
        return previousSlots;
      }

      const displacedTokenId = nextSlots[slotIndex];
      if (sourceSlotIndex >= 0) {
        nextSlots[sourceSlotIndex] = displacedTokenId ?? null;
      }

      nextSlots[slotIndex] = tokenId;
      return nextSlots;
    });
  };

  const handleWordBuildTokenDragStart = (
    event: DragEvent<HTMLElement>,
    tokenId: string,
  ) => {
    if (!isWordBuildLesson || isCorrect !== null) {
      event.preventDefault();
      return;
    }

    wordBuildDragTokenIdRef.current = tokenId;
    event.dataTransfer.setData("text/plain", tokenId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleWordBuildTokenDragEnd = () => {
    wordBuildDragTokenIdRef.current = null;
  };

  const handleWordBuildSlotDrop = (
    event: DragEvent<HTMLDivElement>,
    slotIndex: number,
  ) => {
    event.preventDefault();
    if (!isWordBuildLesson || isCorrect !== null) return;

    const tokenId =
      event.dataTransfer.getData("text/plain").trim() ||
      wordBuildDragTokenIdRef.current;
    if (!tokenId) return;

    placeWordBuildTokenInSlot(tokenId, slotIndex);
    wordBuildDragTokenIdRef.current = null;
  };

  const handleWordBuildCheck = () => {
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
    const earnedStars = isAssembledCorrectly
      ? currentLesson.scoring?.maxStars ?? 1
      : 0;

    handleScoringResult(
      isAssembledCorrectly,
      FEEDBACK_ADVANCE_DELAY_MS,
      earnedStars,
    );
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
    const lessonMaxStars = currentLesson.scoring?.maxStars ?? 2;
    const earnedStars = Math.min(lessonMaxStars, result.stars);
    const correct = result.score >= traceOneStarThreshold;
    const advanceDelayMs =
      currentLesson.lessonKind === "letter_trace_practice"
        ? TRACE_STARS_ADVANCE_DELAY_MS
        : FEEDBACK_ADVANCE_DELAY_MS;
    handleScoringResult(correct, advanceDelayMs, earnedStars);
  };

  const handleNext = () => {
    clearAdvanceTimeout();
    resetSpeechSession();
    speechFinalizeRef.current = false;
    speechTranscriptRef.current = "";
    setSelectedAnswer(null);
    setIsCorrect(null);
    setTraceResult(null);
    setTraceDemoReplayKey(0);
    setTraceDemoFastForwarded(false);
    setCelebrationStars(null);
    wordBuildDragTokenIdRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
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

      const nextWordBuildState = getWordBuildStateForLesson(nextLesson);
      setWordBuildTokenOrder(nextWordBuildState.tokenOrder);
      setWordBuildSlotTokenIds(nextWordBuildState.slotTokenIds);
      wordBuildDragTokenIdRef.current = null;

      setCurrentStep(nextStep);
      return;
    }

    const latestLessonStars = lessonStarsThisAttemptRef.current;
    const attemptFloorStars = getAttemptFloorStars(lessons, latestLessonStars);

    if (attemptFloorStars >= 1) {
      playOneShotAudio(FEEDBACK_FLOOR_CHEER_AUDIO);
    } else if (attemptFloorStars <= 0) {
      playOneShotAudio(FEEDBACK_FLOOR_TRY_AGAIN_AUDIO);
    }

    setCompletionStars(attemptFloorStars);
    saveFloorProgress({
      worldId,
      towerId,
      floorId,
      floorStars: attemptFloorStars,
      lessonStars: latestLessonStars,
      maxStars: FLOOR_MAX_STARS,
    });
    setShowCompletion(true);
  };

  useEffect(() => {
    handleNextRef.current = handleNext;
  });

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
    const stars =
      completionStars ?? getAttemptFloorStars(lessons, lessonStarsThisAttempt);
    const noStarsEarned = stars <= 0;
    const completionTitle = noStarsEarned ? "Cố lên bé nhé!" : "Tuyệt Vời!";
    const completionSummary =
      activeLessonsCount > 0
        ? noStarsEarned
          ? `Bé đã làm đúng ${score}/${activeLessonsCount} câu. Không sao, bé luyện thêm một chút nữa để lần sau nhận sao nhé!`
          : `Bé đã làm đúng ${score}/${activeLessonsCount} câu và nhận ${stars}/${Math.min(FLOOR_MAX_STARS, activeLessonsTotalStars)} sao!`
        : noStarsEarned
          ? "Bé đã hoàn thành bài học rồi. Mình thử lại để săn sao nhé!"
          : "Bé đã hoàn thành bài học!";

    return (
      <div className="relative w-full h-dvh bg-linear-to-b from-yellow-bright/30 via-background to-green-bright/20 flex flex-col items-center justify-center p-6 pt-safe pb-safe overflow-hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-center"
        >
          <Mascot
            size="lg"
            emotion={noStarsEarned ? "sad" : "excited"}
            className="mx-auto"
          />

          <motion.h1
            className={`mt-8 text-4xl md:text-5xl font-bold ${
              noStarsEarned ? "text-amber-700" : "text-foreground"
            }`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {completionTitle}
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
            {completionSummary}
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
        {celebrationStars && <LessonStarCelebration stars={celebrationStars} />}
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

            {showPreviewCard &&
              isLetterGridPreviewLesson &&
              !currentLesson.mainImage && (
                <motion.div
                  className="relative mx-auto mb-6 inline-block"
                  animate={
                    currentLesson.type === "passive"
                      ? { scale: [1, 1.02, 1] }
                      : {}
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                  onClick={() =>
                    currentLesson.mainAudio &&
                    playAudio(currentLesson.mainAudio)
                  }
                >
                  <LetterTracingCanvas
                    key={`${currentLesson.id}-filled-preview`}
                    mode="preview"
                    targetText={targetText || displayText}
                  />
                  {isFogRevealLesson && (
                    <FogRevealOverlay
                      revealKey={currentLesson.id}
                      width={LETTER_TRACING_CANVAS_WIDTH}
                      height={LETTER_TRACING_CANVAS_HEIGHT}
                      roundedClassName="rounded-md"
                    />
                  )}
                  {currentLesson.mainAudio && (
                    <motion.div
                      className={`absolute bottom-2 ${LESSON_PREVIEW_CONTROL_OFFSET_CLASS} z-20`}
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

            {showPreviewCard &&
              !(isLetterGridPreviewLesson && !currentLesson.mainImage) && (
                <motion.div
                  className="relative mx-auto h-96 w-68 rounded-3xl shadow-xl mb-6"
                  animate={
                    currentLesson.type === "passive"
                      ? { scale: [1, 1.02, 1] }
                      : {}
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                  onClick={() =>
                    currentLesson.mainAudio &&
                    playAudio(currentLesson.mainAudio)
                  }
                >
                  <div className="absolute inset-0 overflow-hidden rounded-3xl bg-white">
                    {currentLesson.mainImage ? (
                      <div
                        className={`relative w-full h-full ${
                          shouldUseLargerVocabImage ? "p-1" : "p-4"
                        }`}
                      >
                        <Image
                          src={currentLesson.mainImage}
                          alt={currentLesson.title || "Lesson Image"}
                          fill
                          className={`object-contain ${
                            shouldUseLargerVocabImage ? "scale-[1.06]" : ""
                          }`}
                        />
                      </div>
                    ) : (
                      <span
                        className={`absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-nowrap font-bold leading-none text-green-bright ${getPreviewTextSizeClass(displayText)}`}
                      >
                        {displayText}
                      </span>
                    )}
                  </div>

                  {currentLesson.mainAudio && (
                    <motion.div
                      className={`absolute bottom-2 ${LESSON_PREVIEW_CONTROL_OFFSET_CLASS} z-20`}
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

            {currentLesson.audioVariants &&
              currentLesson.audioVariants.length > 0 && (
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
              <div className="relative mt-2 w-fit mx-auto">
                {/* Dùng lại khung tô chữ và cho hệ thống tự chạy nét mẫu */}
                <LetterTracingCanvas
                  key={`${currentLesson.id}-${traceDemoFastForwarded ? "preview" : "demo"}-${traceDemoReplayKey}`}
                  mode={traceDemoFastForwarded ? "preview" : "demo"}
                  targetText={targetText}
                  onAutoTraceComplete={
                    traceDemoFastForwarded ? undefined : handleTraceDemoComplete
                  }
                  onFrameTap={handleFastForwardTraceDemo}
                />
                {canFastForwardTraceDemo && !passiveReady && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Chạm vào khung chữ để tua nhanh.
                  </p>
                )}
                <motion.div
                  className={`absolute bottom-2 ${LESSON_PREVIEW_CONTROL_OFFSET_CLASS} z-20`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LessonButton
                    className="rounded-full"
                    frontClassName="h-10 w-10"
                    aria-label="Xem lại nét mẫu"
                    onClick={handleReplayTraceDemo}
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </LessonButton>
                </motion.div>
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
                  const answerText = answer.text?.trim() ?? "";
                  const useSpecialAnswerFont =
                    !answer.image && [...answerText].length === 1;

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
                          <span
                            className={`relative z-10 ${useSpecialAnswerFont ? "font-hp-special" : ""}`}
                          >
                            {answer.text}
                          </span>
                        )}
                      </LessonButton>
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
                      const isSingleLetter =
                        token.kind === "letter" &&
                        [...tokenDisplayText].length === 1;

                      return (
                        <div
                          key={`word-build-pool-${tokenId}`}
                          className="h-20 w-20"
                        >
                          {isPlacedToken ? (
                            <div className="h-full w-full rounded-2xl border-4 border-dashed border-slate-200/80 bg-slate-100/40" />
                          ) : (
                            <motion.div whileTap={isCorrect === null ? { scale: 0.95 } : {}}>
                              <LessonButton
                                draggable={isCorrect === null}
                                onDragStart={(event) =>
                                  handleWordBuildTokenDragStart(event, tokenId)
                                }
                                onDragEnd={handleWordBuildTokenDragEnd}
                                disabled={isCorrect !== null}
                                className="h-full w-full rounded-2xl"
                                frontClassName={`h-full w-full px-2 ${
                                  isToneToken
                                    ? "text-5xl leading-none"
                                    : isSingleLetter
                                      ? "text-5xl leading-none"
                                      : "text-xl leading-tight"
                                }`}
                              >
                                <span
                                  className={
                                    !isToneToken && isSingleLetter
                                      ? "font-hp-special"
                                      : undefined
                                  }
                                >
                                  {tokenDisplayText}
                                </span>
                              </LessonButton>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full rounded-3xl bg-white/90 p-4 shadow-md">
                  <div className="mx-auto flex min-h-[15rem] items-center justify-center">
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
                        const displayRow =
                          wordBuildDisplayRowByLogicalRow.get(slotPlacement.row) ?? 1;

                        return (
                          <div
                            key={`word-build-slot-${slotIndex}`}
                            draggable={Boolean(placedToken) && isCorrect === null}
                            onDragStart={(event) => {
                              if (!placedTokenId) return;
                              handleWordBuildTokenDragStart(event, placedTokenId);
                            }}
                            onDragEnd={handleWordBuildTokenDragEnd}
                            onDragOver={(event) => {
                              event.preventDefault();
                            }}
                            onDrop={(event) =>
                              handleWordBuildSlotDrop(event, slotIndex)
                            }
                            className={`flex items-center justify-center rounded-2xl border-4 border-dashed px-2 text-center transition-colors ${
                              placedToken
                                ? "border-green-300 bg-green-50"
                                : "border-sky-200 bg-sky-50/80"
                            } ${placedToken ? "cursor-grab" : "cursor-default"} h-20 w-20`}
                            style={{
                              gridColumnStart: slotPlacement.column,
                              gridRowStart: displayRow,
                            }}
                          >
                            {placedToken ? (
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
                  <LessonButton
                    onClick={handleWordBuildCheck}
                    disabled={!isWordBuildReady || isCorrect !== null}
                    className="rounded-3xl"
                    frontClassName="px-10 py-3 text-lg"
                  >
                    Kiểm Tra
                  </LessonButton>
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
                    <LessonButton
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
                    </LessonButton>
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
                          animate={{ opacity: isMicRecording ? [0.55, 1, 0.55] : 0.45 }}
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
                {!isLetterTracePracticeLesson && (
                  <p className="text-sm text-muted-foreground">
                    {`Bé tô theo mẫu từ "${targetText}".`}
                  </p>
                )}

                <LetterTracingCanvas
                  key={currentLesson.id}
                  mode="practice"
                  targetText={targetText}
                  disabled={traceResult !== null}
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
              !isTracePracticeLesson &&
              !isThresholdSpeechLesson &&
              !isWordBuildLesson && (
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
                  {isCorrect ? "Giỏi quá!" : "Tiếc quá!"}
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
