"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Star, Sparkles, Zap, Moon, Stars } from "lucide-react";
import { Mascot } from "@/components/beto-mascot";
import { PrimaryButton } from "@/components/common/primary-button";

interface BossReviewChoiceViewProps {
  passCount: number;
  totalLessons: number;
  onBack: () => void;
  onChooseReview: () => void;
  onChooseMysteryGame: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Floating animated elements for playful atmosphere                          */
/* -------------------------------------------------------------------------- */
function FloatingStars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -12, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeInOut",
          }}
        >
          <Star
            className={`h-${3 + (i % 2)} w-${3 + (i % 2)} ${
              i % 2 === 0
                ? "fill-yellow-bright/60 text-yellow-bright/60"
                : "fill-orange-bright/50 text-orange-bright/50"
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Progress indicator with visual appeal                                      */
/* -------------------------------------------------------------------------- */
function ProgressIndicator({
  passCount,
  totalLessons,
}: {
  passCount: number;
  totalLessons: number;
}) {
  const progressPercent = Math.round((passCount / totalLessons) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border-2 border-yellow-bright/50 bg-white/90 p-4 shadow-lg backdrop-blur-sm"
    >
      {/* Decorative corner ribbons */}
      <div className="absolute -right-6 -top-6 h-12 w-12 rotate-45 bg-yellow-bright/30" />
      <div className="absolute -left-6 -bottom-6 h-12 w-12 rotate-45 bg-green-bright/20" />

      <div className="relative z-10 flex items-center gap-4">
        {/* Trophy/Achievement icon */}
        <motion.div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-bright to-orange-bright shadow-md"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-2xl">🏆</span>
        </motion.div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">
            Tiến trình ôn tập
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-green-bright to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">
              Đã hoàn thành
            </span>
            <span className="font-bold text-green-bright">
              {passCount}/{totalLessons} bài
            </span>
          </div>
        </div>
      </div>

      {/* Celebration sparkles if progress > 50% */}
      {passCount > totalLessons / 2 && (
        <motion.div
          className="absolute right-3 top-3"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-5 w-5 text-yellow-bright" />
        </motion.div>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cheerful Review Card                                                       */
/* -------------------------------------------------------------------------- */
function CheerfulReviewCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="ios-button group relative w-full overflow-hidden rounded-3xl p-1 text-left shadow-xl"
    >
      {/* Rainbow border effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-bright via-emerald-400 to-teal-400" />

      {/* Card content */}
      <div className="relative rounded-[22px] bg-gradient-to-br from-green-bright via-emerald-400 to-teal-400 p-5">
        {/* Floating decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
          {/* Sun rays */}
          <motion.div
            className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-yellow-300/30 blur-xl"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          {/* Playful circles */}
          <motion.div
            className="absolute bottom-4 left-4 h-16 w-16 rounded-full border-4 border-white/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute right-12 top-8 h-8 w-8 rounded-full bg-white/15"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Dotted pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(white_1.5px,transparent_1.5px)] bg-size-[16px_16px]" />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          {/* Animated character icon */}
          <motion.div
            className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/30 backdrop-blur-sm"
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Cute book character */}
            <span className="text-4xl">📚</span>
            {/* Sparkle accent */}
            <motion.div
              className="absolute -right-1 -top-1"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 20, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Zap className="h-5 w-5 fill-yellow-300 text-yellow-300" />
            </motion.div>
          </motion.div>

          <div className="min-w-0 flex-1 py-1">
            <h2 className="font-hp-special text-2xl leading-tight text-white drop-shadow-sm md:text-3xl">
              Ôn tập vui vẻ
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/90">
              Làm 10 bài tập thú vị để ghi nhớ tốt hơn nào! 🎯
            </p>

            {/* Encouraging badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-xs font-medium text-white">
                <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                Nhận sao
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-xs font-medium text-white">
                ⚡ Nhanh & vui
              </span>
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/30 transition-transform group-hover:translate-x-1">
          <ChevronLeft className="h-5 w-5 rotate-180 text-white" />
        </div>
      </div>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mysterious Spin Card                                                       */
/* -------------------------------------------------------------------------- */
function MysterySpinCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="ios-button group relative w-full overflow-hidden rounded-3xl p-1 text-left shadow-2xl"
    >
      {/* Mystical border gradient */}
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-600"
        animate={{
          background: [
            "linear-gradient(90deg, #7c3aed, #a855f7, #4f46e5)",
            "linear-gradient(180deg, #7c3aed, #a855f7, #4f46e5)",
            "linear-gradient(270deg, #7c3aed, #a855f7, #4f46e5)",
            "linear-gradient(360deg, #7c3aed, #a855f7, #4f46e5)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Card content */}
      <div className="relative rounded-[22px] bg-gradient-to-br from-indigo-900 via-violet-800 to-purple-900 p-5">
        {/* Mystical atmosphere */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[22px]">
          {/* Glowing orbs */}
          <motion.div
            className="absolute -left-4 top-1/2 h-24 w-24 rounded-full bg-purple-500/40 blur-2xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-indigo-400/30 blur-2xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
          />
          <motion.div
            className="absolute bottom-0 right-1/3 h-20 w-20 rounded-full bg-pink-500/25 blur-xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          />

          {/* Twinkling stars */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-white"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 4) * 20}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 1.5 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Magical shimmer line */}
          <motion.div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(rgba(255,255,255,0.8)_1px,transparent_1px)] bg-size-[24px_24px]" />
        </div>

        <div className="relative z-10 flex items-start gap-4">
          {/* Mystery wheel icon */}
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            {/* Rotating outer ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-dashed border-purple-300/40"
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            {/* Inner glowing container */}
            <motion.div
              className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/50 to-purple-600/50 backdrop-blur-sm"
              animate={{ boxShadow: [
                "0 0 20px rgba(139, 92, 246, 0.3)",
                "0 0 30px rgba(139, 92, 246, 0.6)",
                "0 0 20px rgba(139, 92, 246, 0.3)",
              ]}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Crystal ball / Magic wheel */}
              <span className="text-3xl">🔮</span>
            </motion.div>
            {/* Orbiting sparkle */}
            <motion.div
              className="absolute"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              style={{ width: 80, height: 80 }}
            >
              <Stars className="absolute -top-1 left-1/2 h-4 w-4 -translate-x-1/2 fill-yellow-300 text-yellow-300" />
            </motion.div>
          </div>

          <div className="min-w-0 flex-1 py-1">
            <div className="flex items-center gap-2">
              <h2 className="font-hp-special text-2xl leading-tight text-white drop-shadow-md md:text-3xl">
                Vòng quay bí ẩn
              </h2>
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Moon className="h-5 w-5 fill-purple-300 text-purple-300" />
              </motion.div>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-purple-100/90">
              Khám phá thử thách huyền bí từ Boss! ✨
            </p>

            {/* Mystery tags */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-purple-100 backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-yellow-300" />
                Bất ngờ
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-purple-100 backdrop-blur-sm">
                🎁 Phần thưởng
              </span>
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
        <motion.div
          className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronLeft className="h-5 w-5 rotate-180 text-white" />
        </motion.div>
      </div>
    </motion.button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */
export function BossReviewChoiceView({
  passCount,
  totalLessons,
  onBack,
  onChooseReview,
  onChooseMysteryGame,
}: BossReviewChoiceViewProps) {
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-gradient-to-b from-sky-100 via-background to-violet-50">
      {/* Ambient background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Soft gradient blobs */}
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-green-bright/25 blur-3xl" />
        <div className="absolute -right-16 top-32 h-56 w-56 rounded-full bg-blue-soft/30 blur-3xl" />
        <div className="absolute bottom-20 left-1/4 h-48 w-48 rounded-full bg-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-10 right-1/4 h-52 w-52 rounded-full bg-yellow-bright/20 blur-3xl" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(rgba(255,255,255,0.9)_1px,transparent_1px)] bg-size-[20px_20px]" />
      </div>

      {/* Floating stars decoration */}
      <FloatingStars />

      {/* Header */}
      <header className="relative z-20 bg-white/85 pt-safe shadow-md backdrop-blur-md">
        <div className="flex items-center gap-3 p-4">
          <motion.div
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <PrimaryButton
              onClick={onBack}
              className="rounded-2xl shadow-lg"
              frontClassName="p-3"
              aria-label="Quay lại tháp"
            >
              <ChevronLeft className="h-6 w-6" />
            </PrimaryButton>
          </motion.div>
          <motion.div
            className="min-w-0 flex-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              🏰 Tháp Boss
            </h1>
            <p className="text-xs text-muted-foreground md:text-sm">
              Chọn hành trình phiêu lưu tiếp theo!
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Mascot size="sm" emotion="excited" />
          </motion.div>
        </div>
      </header>

      {/* Main content area */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-safe">
        <div className="mx-auto flex h-full max-w-md flex-col gap-4 py-5">
          {/* Progress indicator - prominent position at top */}
          <ProgressIndicator passCount={passCount} totalLessons={totalLessons} />

          {/* Section title */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <p className="text-sm font-medium text-muted-foreground">
              Chọn một trong hai cách ôn tập 👇
            </p>
          </motion.div>

          {/* Two main choice cards */}
          <div className="flex flex-1 flex-col gap-4">
            {/* Cheerful Review Option */}
            <CheerfulReviewCard onClick={onChooseReview} />

            {/* Divider with "or" */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-xs font-medium text-muted-foreground">
                hoặc
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Mystery Spin Option */}
            <MysterySpinCard onClick={onChooseMysteryGame} />
          </div>

          {/* Bottom encouragement */}
          <motion.div
            className="pb-2 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-muted-foreground">
              💪 Cố lên! Bé sắp chiến thắng Boss rồi!
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
