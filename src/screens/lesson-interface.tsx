"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, X, Star, ArrowRight, Play } from "lucide-react";
import { Mascot } from "../components/beto-mascot";
import { LessonContent, LessonAnswer } from "../data/game-config";

interface LessonInterfaceProps {
  floorId: number;
  floorName: string;
  lessons: LessonContent[];
  onComplete: () => void;
  onBack: () => void;
}

export function LessonInterface({
  floorName,
  lessons,
  onComplete,
  onBack,
}: LessonInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter active lessons for scoring context
  const activeLessonsCount = lessons.filter((l) => l.type === "active").length;

  // Guard against empty lessons
  if (!lessons || lessons.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>No lessons available.</p>
        <button onClick={onBack}>Back</button>
      </div>
    );
  }

  const currentLesson = lessons[currentStep];
  const progress = ((currentStep + 1) / lessons.length) * 100;

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
    if (currentLesson?.mainAudio) {
      playAudio(currentLesson.mainAudio);
    }
  }, [currentStep]); // Only re-run if step changes (avoids re-playing on state updates like selecting answer)

  const playAudio = (src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.play().catch((err) => console.log("Audio play failed:", err));
  };

  const handleAnswer = (answer: LessonAnswer) => {
    if (selectedAnswer || currentLesson.type !== "active") return;

    setSelectedAnswer(answer.id);
    const correct = answer.isCorrect;
    setIsCorrect(correct);

    if (correct) {
      setScore((prev) => prev + 1);
    }

    // Auto advance after delay
    setTimeout(() => {
      handleNext();
    }, 1500);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);
    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (currentStep < lessons.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowCompletion(true);
    }
  };

  if (showCompletion) {
    // If there were active lessons, calculate based on score.
    // If purely passive, give full stars (3).
    const stars =
      activeLessonsCount > 0 ? Math.ceil((score / activeLessonsCount) * 3) : 3;

    return (
      <div className="fixed inset-0 bg-linear-to-b from-yellow-bright/30 via-background to-green-bright/20 flex flex-col items-center justify-center p-6 pt-safe pb-safe overflow-hidden">
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

          {/* Stars */}
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
    <div className="fixed inset-0 bg-linear-to-b from-blue-soft/20 via-background to-green-bright/10 flex flex-col overflow-hidden">
      {/* Header - iOS safe area */}
      <div className="p-4 flex items-center gap-4 pt-safe">
        <motion.button
          onClick={onBack}
          className="p-3 bg-white rounded-2xl shadow-lg text-muted-foreground ios-button"
          whileTap={{ scale: 0.95 }}
        >
          <X className="w-6 h-6" />
        </motion.button>

        {/* Progress bar */}
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

      {/* Main content - Scrollable area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8 app-scroll pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md text-center"
          >
            {/* Instruction / Question */}
            <p className="text-lg text-muted-foreground mb-4">
              {currentLesson.instruction || currentLesson.question}
            </p>

            {/* Display Image or Title or Large Text */}
            <motion.div
              className="relative mx-auto w-48 h-48 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8 overflow-hidden"
              animate={
                currentLesson.type === "passive" ? { scale: [1, 1.02, 1] } : {}
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
                  {currentLesson.title || "?"}
                </span>
              )}

              {/* Sound indicator/button */}
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

            {/* Pronunciation / Title */}
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

            {/* PASSIVE: Next Button */}
            {currentLesson.type === "passive" && (
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

            {/* ACTIVE: Answer options */}
            {currentLesson.type === "active" && currentLesson.answers && (
              <div className="flex justify-center gap-4 flex-wrap">
                {currentLesson.answers.map((answer, index) => {
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
                      className={`min-w-[5rem] min-h-[5rem] px-4 py-2 ${bgColor} ${textColor} text-3xl font-bold rounded-2xl border-4 ${borderColor} shadow-lg ios-button flex items-center justify-center relative overflow-hidden`}
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

            {/* Feedback Message */}
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

      {/* Mascot helper */}
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
