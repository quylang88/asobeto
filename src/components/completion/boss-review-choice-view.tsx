"use client";

import { motion } from "framer-motion";
import { Compass, Lock, Sparkles } from "lucide-react";
import { Mascot } from "@/components/beto-mascot";

interface BossReviewChoiceViewProps {
  passCount: number;
  totalLessons: number;
  onChooseReview: () => void;
  onChooseMysteryGame: () => void;
}

export function BossReviewChoiceView({
  passCount,
  totalLessons,
  onChooseReview,
  onChooseMysteryGame,
}: BossReviewChoiceViewProps) {
  return (
    <div className="relative w-full h-dvh flex flex-col bg-linear-to-b from-sky-100 via-sky-50 to-emerald-50 overflow-hidden">
      <div className="sticky top-0 z-10 bg-white/85 px-5 py-4 pt-safe shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-hp-special">
              Chọn Hành Trình Tiếp Theo
            </h1>
            <p className="text-xs text-muted-foreground">
              Bé đã vượt qua {passCount}/{totalLessons} bài.
            </p>
          </div>
          <Mascot size="sm" emotion="excited" />
        </div>
      </div>

      <div className="flex-1 app-scroll px-5 pb-safe pt-5">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4">
          <motion.button
            type="button"
            onClick={onChooseReview}
            whileTap={{ scale: 0.97 }}
            className="ios-button w-full rounded-3xl border-3 border-emerald-300 bg-white p-4 text-left shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <Compass className="h-7 w-7 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Ôn tập</h2>
                <p className="text-sm text-muted-foreground">
                  Làm lại 10 bài để rèn thêm phản xạ.
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            type="button"
            onClick={onChooseMysteryGame}
            whileTap={{ scale: 0.97 }}
            className="ios-button relative w-full overflow-hidden rounded-3xl border-3 border-cyan-300/70 bg-linear-to-br from-slate-950 via-sky-950 to-slate-900 p-4 text-left text-cyan-50 shadow-2xl"
          >
            <div className="pointer-events-none absolute -left-10 -top-8 h-36 w-36 rounded-full bg-cyan-300/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-8 h-36 w-36 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="pointer-events-none absolute inset-0 opacity-20 [radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size:[20px_20px]" />

            <div className="relative z-10 flex items-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/60 bg-slate-900/60">
                <Sparkles className="h-7 w-7 text-cyan-200" />
                <Lock className="absolute -right-1 -top-1 h-4 w-4 text-cyan-100" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Game Bí Ẩn</h2>
                <p className="text-sm text-cyan-100/85">
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
