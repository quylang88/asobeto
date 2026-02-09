"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Mascot } from "@/components/beto-mascot";
import { GameButton } from ".";

interface LessonCompletionViewProps {
  stars: number;
  score: number;
  activeLessonsCount: number;
  activeLessonsTotalStars: number;
  floorMaxStars: number;
  onComplete: () => void;
}

export function LessonCompletionView({
  stars,
  score,
  activeLessonsCount,
  activeLessonsTotalStars,
  floorMaxStars,
  onComplete,
}: LessonCompletionViewProps) {
  // Tách màn hoàn thành thành component riêng để LessonInterface chỉ còn vai trò điều phối state.
  const displayedStarCount = Math.max(1, floorMaxStars);
  const starSizeClass =
    displayedStarCount > 3 ? "w-11 h-11 md:w-12 md:h-12" : "w-16 h-16";
  const noStarsEarned = stars <= 0;
  const completionTitle = noStarsEarned ? "Cố lên bé nhé!" : "Tuyệt Vời!";
  const completionSummary =
    activeLessonsCount > 0
      ? noStarsEarned
        ? `Bé đã làm đúng ${score}/${activeLessonsCount} câu. Không sao, bé luyện thêm một chút nữa để lần sau nhận sao nhé!`
        : `Bé đã làm đúng ${score}/${activeLessonsCount} câu và nhận ${stars}/${Math.min(floorMaxStars, activeLessonsTotalStars)} sao!`
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
          {[...Array(displayedStarCount)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.7 + i * 0.2, type: "spring" }}
            >
              <Star
                className={`${starSizeClass} ${
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
          <GameButton
            onClick={onComplete}
            className="rounded-3xl"
            frontClassName="px-12 py-4 text-xl"
          >
            Tiếp Tục
          </GameButton>
        </motion.div>
      </motion.div>
    </div>
  );
}
