"use client";

interface FeedFoodVisualProps {
  foodVisualId: string;
  text: string;
}

export function FeedFoodVisual({ foodVisualId, text }: FeedFoodVisualProps) {
  if (foodVisualId !== "grass-bush") {
    return (
      <span className="relative z-10 rounded-xl border-2 border-emerald-900/35 bg-white/92 px-2.5 pb-0.5 pt-0.5 font-hp-special text-[2.95rem] font-black leading-none text-emerald-950 shadow-[0_3px_10px_rgba(0,0,0,0.18)] [text-shadow:0_1px_0_rgba(255,255,255,0.65)]">
        {text}
      </span>
    );
  }

  return (
    <>
      <span className="pointer-events-none absolute inset-x-3 bottom-[13%] h-[58%] rounded-[48%] bg-linear-to-b from-lime-300/88 to-emerald-800/82" />
      <span className="pointer-events-none absolute -left-1 top-4 h-16 w-16 rounded-full bg-emerald-500/92" />
      <span className="pointer-events-none absolute left-[10%] top-0 h-20 w-20 rounded-full bg-lime-300/95" />
      <span className="pointer-events-none absolute left-[29%] top-1 h-18 w-18 rounded-full bg-emerald-500/94" />
      <span className="pointer-events-none absolute right-[26%] top-1 h-18 w-18 rounded-full bg-lime-400/93" />
      <span className="pointer-events-none absolute right-[8%] top-1 h-20 w-20 rounded-full bg-emerald-500/95" />
      <span className="pointer-events-none absolute -right-1 top-5 h-16 w-16 rounded-full bg-emerald-600/92" />
      <span className="pointer-events-none absolute bottom-[23%] left-[11%] h-14 w-3 rotate-[-24deg] rounded-full bg-linear-to-t from-emerald-900 to-lime-300" />
      <span className="pointer-events-none absolute bottom-[22%] left-[21%] h-16 w-3 rotate-[-15deg] rounded-full bg-linear-to-t from-emerald-900 to-lime-300" />
      <span className="pointer-events-none absolute bottom-[24%] left-[33%] h-18 w-3 rotate-[-8deg] rounded-full bg-linear-to-t from-emerald-900 to-lime-300" />
      <span className="pointer-events-none absolute bottom-[24%] left-[46%] h-17 w-3 rounded-full bg-linear-to-t from-emerald-900 to-lime-300" />
      <span className="pointer-events-none absolute bottom-[23%] left-[58%] h-18 w-3 rotate-[8deg] rounded-full bg-linear-to-t from-emerald-900 to-lime-300" />
      <span className="pointer-events-none absolute bottom-[21%] left-[70%] h-16 w-3 rotate-16 rounded-full bg-linear-to-t from-emerald-900 to-lime-300" />
      <span className="pointer-events-none absolute bottom-[20%] left-[80%] h-14 w-3 rotate-24 rounded-full bg-linear-to-t from-emerald-900 to-lime-300" />
      <span className="pointer-events-none absolute left-1/2 top-[14%] h-6 w-26 -translate-x-1/2 rounded-full bg-white/28 blur-[1px]" />
      <span className="pointer-events-none absolute bottom-[8%] left-1/2 h-5 w-9 -translate-x-1/2 rounded-full bg-emerald-900/55" />
      <span className="pointer-events-none absolute bottom-[1%] left-1/2 h-6 w-1.5 -translate-x-1/2 rounded-full bg-lime-950/55" />
      <span className="relative z-10 rounded-xl border-2 border-emerald-900/35 bg-white/92 px-2.5 pb-0.5 pt-0.5 font-hp-special text-[2.95rem] font-black leading-none text-emerald-950 shadow-[0_3px_10px_rgba(0,0,0,0.18)] [text-shadow:0_1px_0_rgba(255,255,255,0.65)]">
        {text}
      </span>
    </>
  );
}

