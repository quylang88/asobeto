"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { PrimaryButton } from "@/components/common/primary-button";

interface LessonTopBarProps {
  progress: number;
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
}

export function LessonTopBar({
  progress,
  currentStep,
  totalSteps,
  onBack,
}: LessonTopBarProps) {
  // Tách top bar ra riêng để màn chính chỉ tập trung vào luồng lesson/state.
  return (
    <div className="p-4 flex items-center gap-4 pt-safe">
      <motion.div whileTap={{ scale: 0.95 }}>
        <PrimaryButton
          onClick={onBack}
          className="rounded-2xl"
          frontClassName="h-12 w-12"
          aria-label="Thoát bài học"
        >
          <X className="w-6 h-6" />
        </PrimaryButton>
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
        {currentStep + 1}/{totalSteps}
      </div>
    </div>
  );
}
