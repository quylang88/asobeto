"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, RotateCcw, Volume2 } from "lucide-react";
import type { LessonContent } from "@/data/game-config";
import {
  LetterTracingCanvas,
  FogRevealOverlay,
} from "../components";
import { PrimaryButton } from "@/components/common/primary-button";
import { LESSON_PREVIEW_CONTROL_OFFSET_CLASS } from "../constants";
import { getPreviewTextSizeClass } from "../utils";

interface LessonPassivePreviewRendererProps {
  currentLesson: LessonContent;
  showPreviewCard: boolean;
  isLetterGridPreviewLesson: boolean;
  isFogRevealLesson: boolean;
  targetText: string;
  displayText: string;
  shouldUseLargerVocabImage: boolean;
  playAudio: (src: string) => void;
  showTitleBelowPreview: boolean;
  isLetterTraceDemoLesson: boolean;
  traceDemoFastForwarded: boolean;
  traceDemoReplayKey: number;
  handleTraceDemoComplete: () => void;
  handleFastForwardTraceDemo: () => void;
  canFastForwardTraceDemo: boolean;
  passiveReady: boolean;
  handleReplayTraceDemo: () => void;
  handleNext: () => void;
}

export function LessonPassivePreviewRenderer({
  currentLesson,
  showPreviewCard,
  isLetterGridPreviewLesson,
  isFogRevealLesson,
  targetText,
  displayText,
  shouldUseLargerVocabImage,
  playAudio,
  showTitleBelowPreview,
  isLetterTraceDemoLesson,
  traceDemoFastForwarded,
  traceDemoReplayKey,
  handleTraceDemoComplete,
  handleFastForwardTraceDemo,
  canFastForwardTraceDemo,
  passiveReady,
  handleReplayTraceDemo,
  handleNext,
}: LessonPassivePreviewRendererProps) {
  const tracingPreviewContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      {showPreviewCard &&
        isLetterGridPreviewLesson &&
        !currentLesson.mainImage && (
          <motion.div
            className="relative mx-auto mb-6 inline-block"
            animate={
              currentLesson.type === "passive" ? { scale: [1, 1.02, 1] } : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() =>
              currentLesson.mainAudio && playAudio(currentLesson.mainAudio)
            }
          >
            <div
              ref={tracingPreviewContainerRef}
              className="relative w-fit mx-auto"
            >
              <LetterTracingCanvas
                key={`${currentLesson.id}-filled-preview`}
                mode="preview"
                targetText={targetText || displayText}
              />
              {isFogRevealLesson && (
                <FogRevealOverlay
                  revealKey={currentLesson.id}
                  containerRef={tracingPreviewContainerRef}
                  roundedClassName="rounded-md"
                />
              )}
            </div>
            {currentLesson.mainAudio && (
              <motion.div
                className={`absolute bottom-2 ${LESSON_PREVIEW_CONTROL_OFFSET_CLASS} z-20`}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <PrimaryButton
                  className="rounded-full"
                  frontClassName="h-10 w-10"
                  aria-label="Phát lại âm thanh"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentLesson.mainAudio!);
                  }}
                >
                  <Volume2 className="w-5 h-5 text-white" />
                </PrimaryButton>
              </motion.div>
            )}
          </motion.div>
        )}

      {showPreviewCard &&
        !(isLetterGridPreviewLesson && !currentLesson.mainImage) && (
          <motion.div
            className="relative mx-auto h-96 w-68 rounded-3xl shadow-xl mb-6"
            animate={
              currentLesson.type === "passive" ? { scale: [1, 1.02, 1] } : {}
            }
            transition={{ duration: 2, repeat: Infinity }}
            onClick={() =>
              currentLesson.mainAudio && playAudio(currentLesson.mainAudio)
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
                    quality={70}
                    sizes="(max-width: 768px) 74vw, 272px"
                    className={`object-contain ${
                      shouldUseLargerVocabImage
                        ? "object-bottom scale-[1.1] translate-y-[9%]"
                        : ""
                    }`}
                  />
                </div>
              ) : (
                <span
                  className={`absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center justify-center whitespace-nowrap font-bold leading-none text-green-bright ${getPreviewTextSizeClass(
                    displayText,
                  )}`}
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
                <PrimaryButton
                  className="rounded-full"
                  frontClassName="h-10 w-10"
                  aria-label="Phát lại âm thanh"
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(currentLesson.mainAudio!);
                  }}
                >
                  <Volume2 className="w-5 h-5 text-white" />
                </PrimaryButton>
              </motion.div>
            )}
          </motion.div>
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
            <PrimaryButton
              className="rounded-full"
              frontClassName="h-10 w-10"
              aria-label="Xem lại nét mẫu"
              onClick={handleReplayTraceDemo}
            >
              <RotateCcw className="w-5 h-5 text-white" />
            </PrimaryButton>
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
          <PrimaryButton
            onClick={handleNext}
            disabled={!passiveReady}
            className="rounded-3xl"
            frontClassName="px-12 py-4 text-xl flex items-center gap-2"
          >
            {passiveReady ? (
              <>
                Tiếp Theo <ArrowRight className="w-6 h-6" />
              </>
            ) : (
              "Đang xem mẫu..."
            )}
          </PrimaryButton>
        </motion.div>
      )}
    </>
  );
}
