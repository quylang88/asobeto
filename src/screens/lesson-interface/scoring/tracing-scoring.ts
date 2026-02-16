import { type TracingGlyphConfig, type TracingGridMetrics } from "@/data/tracing";
import { clamp01, drawGuideGlyph } from "@/lib/tracing-algo";
import type { LessonContent } from "@/data/game-config";

const DRAWN_ALPHA_THRESHOLD = 24;
const TARGET_ALPHA_THRESHOLD = 32;

const DEFAULT_TRACING_ONE_STAR_THRESHOLD = 0.5;
const DEFAULT_TRACING_TWO_STAR_THRESHOLD = 0.85;
const BOSS_TRACING_PASS_THRESHOLD = 0.7;

export interface TracingScoringThresholds {
  passThreshold: number;
  oneStarThreshold: number;
  twoStarThreshold: number;
  maxStars: number;
}

export interface TraceEvaluation {
  score: number;
  stars: number;
  precision: number;
  coverage: number;
  isPassed: boolean;
}

interface TraceScoringParams {
  drawCanvas: HTMLCanvasElement;
  targetText: string;
  metrics: TracingGridMetrics;
  guideFontSize: number;
  thresholds: TracingScoringThresholds;
  guideGlyphConfig?: TracingGlyphConfig;
}

export function getTracingScoringThresholds(
  lesson: LessonContent | undefined,
  isBossTower: boolean = false,
): TracingScoringThresholds {
  if (isBossTower) {
    return {
      passThreshold: BOSS_TRACING_PASS_THRESHOLD,
      // Boss floors don't award stars, effectively making star thresholds unreachable
      oneStarThreshold: 2.0,
      twoStarThreshold: 2.0,
      maxStars: 0,
    };
  }

  // Default to standard values if not specified in lesson config
  const oneStarThreshold = clamp01(
    lesson?.scoring?.starThresholds?.oneStar ?? DEFAULT_TRACING_ONE_STAR_THRESHOLD,
  );
  const twoStarThreshold = clamp01(
    lesson?.scoring?.starThresholds?.twoStars ?? DEFAULT_TRACING_TWO_STAR_THRESHOLD,
  );
  const maxStars = Math.max(0, lesson?.scoring?.maxStars ?? 2);

  // For standard lessons, passing is typically tied to achieving at least 1 star (the lowest threshold)
  const passThreshold = oneStarThreshold;

  return {
    passThreshold,
    oneStarThreshold,
    twoStarThreshold,
    maxStars,
  };
}

export function getEmptyTraceEvaluation(): TraceEvaluation {
  return {
    score: 0,
    stars: 0,
    precision: 0,
    coverage: 0,
    isPassed: false,
  };
}

export function evaluateTracingScore({
  drawCanvas,
  targetText,
  metrics,
  guideFontSize,
  thresholds,
  guideGlyphConfig,
}: TraceScoringParams): TraceEvaluation {
  const drawCtx = drawCanvas.getContext("2d");
  if (!drawCtx) {
    return getEmptyTraceEvaluation();
  }

  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = drawCanvas.width;
  targetCanvas.height = drawCanvas.height;
  const targetCtx = targetCanvas.getContext("2d");
  if (!targetCtx) {
    return getEmptyTraceEvaluation();
  }

  const ratio = window.devicePixelRatio || 1;
  targetCtx.scale(ratio, ratio);
  drawGuideGlyph(
    targetCtx,
    targetText,
    metrics,
    guideFontSize,
    "#111111",
    guideGlyphConfig,
    true,
  );

  const drawnData = drawCtx.getImageData(
    0,
    0,
    drawCanvas.width,
    drawCanvas.height,
  ).data;
  const targetData = targetCtx.getImageData(
    0,
    0,
    drawCanvas.width,
    drawCanvas.height,
  ).data;

  let drawnPixels = 0;
  let targetPixels = 0;
  let overlapPixels = 0;

  for (let i = 3; i < drawnData.length; i += 4) {
    const drawn = drawnData[i] > DRAWN_ALPHA_THRESHOLD;
    const target = targetData[i] > TARGET_ALPHA_THRESHOLD;

    if (drawn) drawnPixels += 1;
    if (target) targetPixels += 1;
    if (drawn && target) overlapPixels += 1;
  }

  const coverage = targetPixels > 0 ? overlapPixels / targetPixels : 0;
  const precision = drawnPixels > 0 ? overlapPixels / drawnPixels : 0;
  const score = clamp01(coverage * 0.7 + precision * 0.3);

  let stars = 0;
  if (score >= thresholds.twoStarThreshold) {
    stars = 2;
  } else if (score >= thresholds.oneStarThreshold) {
    stars = 1;
  }
  stars = Math.min(thresholds.maxStars, stars);

  return {
    score,
    stars,
    precision,
    coverage,
    isPassed: score >= thresholds.passThreshold,
  };
}
