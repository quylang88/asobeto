import { type TracingGlyphConfig, type TracingGridMetrics } from "@/data/tracing";
import {
  evaluateLessonScore,
  resolveLessonScoring,
  type LessonContent,
} from "@/data/game-config";
import { clamp01, drawGuideGlyph } from "@/lib/tracing-algo";

const DRAWN_ALPHA_THRESHOLD = 24;
const TARGET_ALPHA_THRESHOLD = 32;

export interface TraceEvaluation {
  score: number;
  earnedStars: number;
  isPassed: boolean;
  precision: number;
  coverage: number;
}

interface TraceScoringParams {
  drawCanvas: HTMLCanvasElement;
  targetText: string;
  metrics: TracingGridMetrics;
  guideFontSize: number;
  lesson?: LessonContent;
  guideGlyphConfig?: TracingGlyphConfig;
}

export function getEmptyTraceEvaluation(): TraceEvaluation {
  return {
    score: 0,
    earnedStars: 0,
    isPassed: false,
    precision: 0,
    coverage: 0,
  };
}

export function evaluateTracingScore({
  drawCanvas,
  targetText,
  metrics,
  guideFontSize,
  lesson,
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
  const scoring = resolveLessonScoring(lesson, "trace_accuracy");
  const { earnedStars, isPassed } = evaluateLessonScore(score, scoring);

  return {
    score,
    earnedStars,
    isPassed,
    precision,
    coverage,
  };
}
