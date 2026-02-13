"use client";

import { ChevronLeft } from "lucide-react";
import { Mascot } from "@/components/beto-mascot";

type MascotEmotion = "happy" | "excited" | "thinking" | "sad";
type MiniGameHudMode = "simple" | "stats";

interface MiniGameTopHudProps {
  mode: MiniGameHudMode;
  title: string;
  onBack: () => void;
  mascotEmotion: MascotEmotion;
  leftLabel?: string;
  leftValue?: string;
  rightLabel?: string;
  rightValue?: string;
  leftToneClassName?: string;
  rightToneClassName?: string;
}

export function MiniGameTopHud({
  mode,
  title,
  onBack,
  mascotEmotion,
  leftLabel = "",
  leftValue = "",
  rightLabel = "",
  rightValue = "",
  leftToneClassName = "bg-cyan-100/90 text-cyan-700",
  rightToneClassName = "bg-amber-100/90 text-amber-700",
}: MiniGameTopHudProps) {
  return (
    <div className="sticky top-0 z-20 bg-white/90 shadow-sm backdrop-blur-md pt-safe pl-safe pr-safe">
      <div className="flex items-center gap-2 px-3 pb-2 pt-2.5">
        <button
          onClick={onBack}
          className="rounded-xl bg-green-bright p-2.5 text-white shadow ios-button"
          aria-label="Quay lại chọn tầng"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {mode === "simple" ? (
          <div className="min-w-0 flex-1 px-1">
            <h1 className="truncate text-[1.35rem] font-black leading-tight text-slate-800 font-hp-special sm:text-[1.55rem]">
              {title}
            </h1>
          </div>
        ) : (
          <div className="grid min-w-0 flex-1 grid-cols-3 items-center gap-1 text-[0.68rem] font-semibold text-slate-600 sm:text-xs">
            <div
              className={`rounded-xl px-2 py-1.5 text-center ${leftToneClassName}`}
            >
              <p className="leading-tight">{leftLabel}</p>
              <p className="text-sm font-black sm:text-base">{leftValue}</p>
            </div>
            <div className="rounded-xl bg-white/95 px-2 py-1.5 text-center shadow-sm">
              <p className="text-sm font-black text-slate-800 font-hp-special sm:text-base">
                {title}
              </p>
            </div>
            <div
              className={`rounded-xl px-2 py-1.5 text-center ${rightToneClassName}`}
            >
              <p className="leading-tight">{rightLabel}</p>
              <p className="text-sm font-black sm:text-base">{rightValue}</p>
            </div>
          </div>
        )}

        <Mascot size="sm" emotion={mascotEmotion} />
      </div>
    </div>
  );
}
