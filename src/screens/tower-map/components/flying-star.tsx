"use client";

import { useEffect, useRef, useCallback, useState, memo } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Star } from "lucide-react";
import type { FlyingStarProps } from "../types";

/* ------------------------------------------------------------------ */
/*  Quadratic‑Bézier helper – evaluate (x,y) at parametric t ∈ [0,1] */
/* ------------------------------------------------------------------ */
function bezierPoint(t: number, p0: number, p1: number, p2: number): number {
  const inv = 1 - t;
  return inv * inv * p0 + 2 * inv * t * p1 + t * t * p2;
}

/* ------------------------------------------------------------------ */
/*  Tiny trail‑particle rendered with a single DOM element + opacity  */
/* ------------------------------------------------------------------ */
interface TrailDot {
  id: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

const TRAIL_COUNT = 6;
const TRAIL_LIFETIME_MS = 320;

/* ------------------------------------------------------------------ */
/*  Main FlyingStar component                                          */
/* ------------------------------------------------------------------ */
function FlyingStarInner({
  startX,
  startY,
  midX,
  midY,
  endX,
  endY,
  delay,
  duration,
  onArrive,
}: FlyingStarProps) {
  const progress = useMotionValue(0);
  const starRef = useRef<HTMLDivElement>(null);
  const trailIdRef = useRef(0);
  const [trails, setTrails] = useState<TrailDot[]>([]);
  const trailTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasArrivedRef = useRef(false);

  /* Derive x/y from a single 0→1 progress value along the Bézier curve */
  const x = useTransform(progress, (p) => bezierPoint(p, startX, midX, endX));
  const y = useTransform(progress, (p) => bezierPoint(p, startY, midY, endY));

  /* Scale: start small, swell in the arc, settle at landing */
  const scale = useTransform(
    progress,
    [0, 0.15, 0.5, 0.85, 1],
    [0.3, 0.85, 1.15, 1.05, 0.7],
  );

  /* Opacity: fast fade‑in, hold, softer fade at the end */
  const opacity = useTransform(
    progress,
    [0, 0.08, 0.2, 0.88, 1],
    [0, 0.6, 1, 1, 0.6],
  );

  /* Gentle spin */
  const rotate = useTransform(progress, [0, 1], [0, 340 + Math.random() * 80]);

  /* Glow pulse intensity mapped to arc position */
  const glowOpacity = useTransform(
    progress,
    [0, 0.35, 0.6, 1],
    [0.3, 1, 0.85, 0.4],
  );

  /* ---- trail emitter ---- */
  const emitTrail = useCallback(() => {
    const currentX = x.get();
    const currentY = y.get();
    const currentProgress = progress.get();
    if (currentProgress < 0.06 || currentProgress > 0.97) return;

    const id = trailIdRef.current++;
    const dot: TrailDot = {
      id,
      x: currentX + (Math.random() - 0.5) * 6,
      y: currentY + (Math.random() - 0.5) * 6,
      scale: 0.35 + Math.random() * 0.35,
      opacity: 0.65 + Math.random() * 0.35,
    };
    setTrails((prev) => [...prev.slice(-TRAIL_COUNT), dot]);
  }, [x, y, progress]);

  /* ---- kick off the animation ---- */
  useEffect(() => {
    const delayMs = delay * 1000;
    const timeout = setTimeout(() => {
      /* Start trail emitter */
      trailTimerRef.current = setInterval(emitTrail, 50);

      animate(progress, 1, {
        duration,
        ease: [0.22, 0.68, 0.35, 1.0], // custom cubic-bezier: fast start, graceful settle
        onComplete: () => {
          if (trailTimerRef.current) clearInterval(trailTimerRef.current);
          setTrails([]);
          if (!hasArrivedRef.current) {
            hasArrivedRef.current = true;
            onArrive?.();
          }
        },
      });
    }, delayMs);

    return () => {
      clearTimeout(timeout);
      if (trailTimerRef.current) clearInterval(trailTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* ---- sparkle trail dots ---- */}
      {trails.map((dot) => (
        <motion.div
          key={dot.id}
          className="fixed left-0 top-0 z-49 pointer-events-none"
          initial={{
            x: dot.x - 5,
            y: dot.y - 5,
            scale: dot.scale,
            opacity: dot.opacity,
          }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: TRAIL_LIFETIME_MS / 1000, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
        >
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(253,224,71,0.95) 0%, rgba(251,191,36,0.6) 50%, transparent 100%)",
              boxShadow: "0 0 6px 2px rgba(251,191,36,0.5)",
            }}
          />
        </motion.div>
      ))}

      {/* ---- main star body ---- */}
      <motion.div
        ref={starRef}
        className="fixed left-0 top-0 z-50 pointer-events-none"
        style={{
          x,
          y,
          scale,
          opacity,
          rotate,
          willChange: "transform, opacity",
          translateX: "-50%",
          translateY: "-50%",
        }}
      >
        {/* Outer glow halo */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 52,
            height: 52,
            opacity: glowOpacity,
            background:
              "radial-gradient(circle, rgba(253,224,71,0.55) 0%, rgba(251,191,36,0.25) 55%, transparent 100%)",
            boxShadow:
              "0 0 18px 6px rgba(251,191,36,0.4), 0 0 36px 12px rgba(245,158,11,0.2)",
          }}
        />

        {/* Inner bright core */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: 20,
            height: 20,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(253,224,71,0.7) 60%, transparent 100%)",
          }}
        />

        {/* Star icon */}
        <Star
          className="relative h-9 w-9 text-amber-800 fill-yellow-300"
          strokeWidth={2.2}
          style={{
            filter:
              "drop-shadow(0 0 6px rgba(253,224,71,0.9)) drop-shadow(0 0 12px rgba(251,191,36,0.6))",
          }}
        />
      </motion.div>
    </>
  );
}

export const FlyingStar = memo(FlyingStarInner);
