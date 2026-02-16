import { type TracingGlyphConfig, type TracingGridMetrics } from "@/data/tracing";
import { clamp01, drawGuideGlyph } from "@/lib/tracing-algo";
import { DEFAULT_MAX_STARS } from "@/data/scoring-utils";

const DRAWN_ALPHA_THRESHOLD = 24;
const TARGET_ALPHA_THRESHOLD = 32;

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
  oneStarThreshold: number;
  twoStarThreshold: number;
  passThreshold?: number;
  maxStars?: number;
  guideGlyphConfig?: TracingGlyphConfig;
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
  oneStarThreshold,
  twoStarThreshold,
  passThreshold,
  maxStars = DEFAULT_MAX_STARS,
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

  // Tính điểm sao dựa trên ngưỡng
  let earnedStars = 0;
  if (score >= twoStarThreshold) {
    earnedStars = 2;
  } else if (score >= oneStarThreshold) {
    earnedStars = 1;
  }

  // Giới hạn sao bởi maxStars (ví dụ: Boss maxStars = 0 -> stars = 0)
  const stars = Math.min(maxStars, earnedStars);

  // Tính pass độc lập với sao (cho trường hợp Boss không có sao nhưng vẫn cần pass)
  const effectivePassThreshold = passThreshold ?? oneStarThreshold;
  const isPassed = score >= effectivePassThreshold;

  return {
    score,
    stars,
    precision,
    coverage,
    isPassed,
  };
}
