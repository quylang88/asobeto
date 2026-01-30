"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Volume2, X, Star } from "lucide-react";
import { Mascot } from "../components/beto-mascot";

interface LessonInterfaceProps {
  floorId: number;
  floorName: string;
  onComplete: () => void;
  onBack: () => void;
}

const lessonContent = [
  {
    type: "listen",
    letter: "A",
    pronunciation: "Ah",
    instruction: "Listen and repeat!",
    options: ["A", "B", "C"],
    correct: "A",
  },
  {
    type: "listen",
    letter: "B",
    pronunciation: "Buh",
    instruction: "Which letter makes this sound?",
    options: ["D", "B", "P"],
    correct: "B",
  },
  {
    type: "listen",
    letter: "C",
    pronunciation: "Kuh",
    instruction: "Tap the right letter!",
    options: ["C", "G", "K"],
    correct: "C",
  },
];

export function LessonInterface({
  floorName,
  onComplete,
  onBack,
}: LessonInterfaceProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const progress = ((currentStep + 1) / lessonContent.length) * 100;
  const currentLesson = lessonContent[currentStep];

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;

    setSelectedAnswer(answer);
    const correct = answer === currentLesson.correct;
    setIsCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }

    // Auto advance after delay
    setTimeout(() => {
      if (currentStep < lessonContent.length - 1) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setShowCompletion(true);
      }
    }, 1500);
  };

  if (showCompletion) {
    const stars = Math.ceil((score / lessonContent.length) * 3);

    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-bright/30 via-background to-green-bright/20 flex flex-col items-center justify-center p-6">
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
            Amazing Job!
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
            You got {score} out of {lessonContent.length} correct!
          </motion.p>

          <motion.button
            onClick={onComplete}
            className="mt-8 relative group"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 bg-orange-bright rounded-3xl translate-y-2 group-hover:translate-y-3 transition-transform" />
            <div className="relative bg-green-bright text-white text-xl font-bold px-12 py-4 rounded-3xl">
              Continue
            </div>
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-soft/20 via-background to-green-bright/10 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center gap-4">
        <motion.button
          onClick={onBack}
          className="p-3 bg-white rounded-2xl shadow-lg text-muted-foreground hover:text-foreground"
          whileHover={{ scale: 1.1 }}
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
          {currentStep + 1}/{lessonContent.length}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-md text-center"
          >
            {/* Instruction */}
            <p className="text-lg text-muted-foreground mb-4">
              {currentLesson.instruction}
            </p>

            {/* Main letter display */}
            <motion.div
              className="relative mx-auto w-48 h-48 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-8"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-8xl font-bold text-green-bright">
                {currentLesson.letter}
              </span>

              {/* Sound button */}
              <motion.button
                className="absolute -bottom-4 -right-4 w-14 h-14 bg-orange-bright rounded-full shadow-lg flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Volume2 className="w-7 h-7 text-white" />
              </motion.button>
            </motion.div>

            {/* Pronunciation hint */}
            <p className="text-2xl font-semibold text-foreground mb-8">
              Sounds like:{" "}
              <span className="text-green-bright">
                {currentLesson.pronunciation}
              </span>
            </p>

            {/* Answer options */}
            <div className="flex justify-center gap-4">
              {currentLesson.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectAnswer = option === currentLesson.correct;
                const showResult = selectedAnswer !== null;

                let bgColor = "bg-white";
                let borderColor = "border-gray-200";
                let textColor = "text-foreground";

                if (showResult && isCorrectAnswer) {
                  bgColor = "bg-green-bright";
                  borderColor = "border-green-bright";
                  textColor = "text-white";
                } else if (showResult && isSelected && !isCorrect) {
                  bgColor = "bg-red-500";
                  borderColor = "border-red-500";
                  textColor = "text-white";
                }

                return (
                  <motion.button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    disabled={selectedAnswer !== null}
                    className={`w-20 h-20 ${bgColor} ${textColor} text-3xl font-bold rounded-2xl border-4 ${borderColor} shadow-lg`}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={!selectedAnswer ? { scale: 1.1, y: -5 } : {}}
                    whileTap={!selectedAnswer ? { scale: 0.95 } : {}}
                  >
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
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
                    ? "Correct! Great job!"
                    : "Oops! Try again next time!"}
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
