"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Compass, Sparkles, Swords } from "lucide-react";
import { Mascot } from "@/components/beto-mascot";
import { PrimaryButton } from "@/components/common/primary-button";

interface BossReviewChoiceViewProps {
  passCount: number;
  totalLessons: number;
  onBack: () => void;
  onChooseReview: () => void;
  onChooseMysteryGame: () => void;
}

export function BossReviewChoiceView({
  passCount,
  totalLessons,
  onBack,
  onChooseReview,
  onChooseMysteryGame,
}: BossReviewChoiceViewProps) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-linear-to-b from-pink-soft/20 via-background to-blue-soft/25">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-24 h-56 w-56 rounded-full bg-orange-bright/35 blur-3xl" />
        <div className="absolute -right-14 top-28 h-52 w-52 rounded-full bg-blue-soft/35 blur-3xl" />
        <div className="absolute bottom-6 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-green-bright/20 blur-3xl" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(rgba(255,255,255,0.85)_1px,transparent_1px)] bg-size-[18px_18px]" />
      </div>

      <div className="sticky top-0 z-20 bg-white/92 pt-safe shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-3 p-4">
          <motion.div whileTap={{ scale: 0.95 }}>
            <PrimaryButton
              onClick={onBack}
              className="rounded-2xl shadow-lg"
              frontClassName="p-3"
              aria-label="Quay lại tháp"
            >
              <ChevronLeft className="h-6 w-6" />
            </PrimaryButton>
          </motion.div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              Tháp Boss
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Chọn hành trình tiếp theo
            </p>
          </div>
          <Mascot size="sm" emotion="excited" />
        </div>
      </div>

      <div className="relative z-10 flex-1 app-scroll px-4 pb-5 pb-safe pt-4 md:px-5">
        <div className="mx-auto flex w-full max-w-md flex-col gap-3 md:gap-4">
          <div className="rounded-3xl border-2 border-yellow-bright/70 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-yellow-bright/30 px-3 py-1 text-xs font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-orange-500" />
              Bé đã vượt qua {passCount}/{totalLessons} bài ôn tập
            </div>
          </div>

          <motion.button
            type="button"
            onClick={onChooseReview}
            whileTap={{ scale: 0.97 }}
            className="ios-button w-full rounded-3xl border-3 border-green-bright/70 bg-linear-to-br from-green-bright/95 to-emerald-400 p-4 text-left shadow-xl"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/30">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-hp-special text-2xl text-white">Ôn tập</h2>
                <p className="text-sm text-white/90">
                  Làm lại 10 bài để rèn thêm phản xạ.
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={onChooseMysteryGame}
            whileTap={{ scale: 0.97 }}
            className="ios-button relative w-full overflow-hidden rounded-3xl border-3 border-orange-bright/75 bg-linear-to-br from-violet-500 to-blue-soft p-4 text-left text-white shadow-2xl"
          >
            <motion.div
              className="pointer-events-none absolute -left-8 -top-8 h-36 w-36 rounded-full bg-yellow-bright/35 blur-2xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-10 -right-8 h-36 w-36 rounded-full bg-pink-soft/40 blur-2xl"
              animate={{ scale: [1.05, 1, 1.05] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            />
            <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(rgba(255,255,255,0.95)_1px,transparent_1px)] bg-size-[20px_20px]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/75 to-transparent" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/25">
                <Sparkles className="h-6 w-6 text-yellow-100" />
                <Swords className="absolute -right-1 -top-1 h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="font-hp-special text-2xl text-white">
                  Game bí ẩn
                </h2>
                <p className="text-sm text-white/90">
                  Bước vào thử thách huyền bí của Boss.
                </p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
