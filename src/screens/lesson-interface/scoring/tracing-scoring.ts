import {
  type TracingGlyphConfig,
  type TracingGridMetrics,
  type TracingStrokePath,
} from "@/data/tracing";
import {
  evaluateLessonScore,
  resolveLessonScoring,
  type LessonContent,
} from "@/data/game-config";
import {
  clamp01,
  createAutoStrokeMaskSet,
  createGlyphBinaryMask,
  drawGuideGlyph,
  extractConnectedComponents,
} from "@/lib/tracing-algo";

const DRAWN_ALPHA_THRESHOLD = 24;
const TARGET_ALPHA_THRESHOLD = 32;
const STROKE_MASK_ALPHA_THRESHOLD = 42;
const MIN_COMPONENT_PIXELS = 22;
const COMPONENT_X_BUCKET_PX = 8;
const MIN_STROKE_ASSIGNMENT_RATIO = 0.22;
const ORDER_VIOLATION_PENALTY = 0.35;

const MIN_PASS_COVERAGE = 0.4;
const MIN_PASS_PRECISION = 0.34;
const MAX_DRAWN_TO_TARGET_RATIO = 4.2;
const MIN_STROKE_ORDER_SCORE = 0.85;
const MIN_STROKE_COVERAGE_RATIO = 0.2;

export interface TraceStrokePoint {
  x: number;
  y: number;
}

export type TraceStroke = TraceStrokePoint[];

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
  expectedStrokes?: TracingStrokePath[];
  drawnStrokes?: TraceStroke[];
}

interface ExpectedStrokeMaskSet {
  width: number;
  height: number;
  masks: Uint8Array[];
}

interface StrokeOrderEvaluation {
  orderScore: number;
  matchedStrokeCount: number;
  expectedStrokeCount: number;
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

function createMaskFromAlphaData(
  rgbaData: Uint8ClampedArray,
  alphaThreshold: number,
): Uint8Array {
  const mask = new Uint8Array(Math.floor(rgbaData.length / 4));
  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (rgbaData[pixelIndex * 4 + 3] > alphaThreshold) {
      mask[pixelIndex] = 1;
    }
  }
  return mask;
}

function convertCanvasToBinaryMask(
  sourceCanvas: HTMLCanvasElement,
  alphaThreshold: number,
): Uint8Array | null {
  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) return null;
  const rgbaData = ctx.getImageData(
    0,
    0,
    sourceCanvas.width,
    sourceCanvas.height,
  ).data;
  return createMaskFromAlphaData(rgbaData, alphaThreshold);
}

function buildComponentMaskSet(binaryMask: {
  mask: Uint8Array;
  width: number;
  height: number;
}): ExpectedStrokeMaskSet | null {
  const components = extractConnectedComponents(
    binaryMask.mask,
    binaryMask.width,
    binaryMask.height,
    MIN_COMPONENT_PIXELS,
  );
  if (components.length <= 1) return null;

  const sortedComponents = components
    .map((pixels) => {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;

      for (const pixelIndex of pixels) {
        const x = pixelIndex % binaryMask.width;
        const y = Math.floor(pixelIndex / binaryMask.width);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
      }

      return {
        pixels,
        minX,
        minY,
        pixelCount: pixels.length,
      };
    })
    .sort((left, right) => {
      if (Math.abs(left.minX - right.minX) > COMPONENT_X_BUCKET_PX) {
        return left.minX - right.minX;
      }
      if (left.pixelCount !== right.pixelCount) {
        return right.pixelCount - left.pixelCount;
      }
      return left.minY - right.minY;
    });

  const masks = sortedComponents.map(({ pixels }) => {
    const mask = new Uint8Array(binaryMask.width * binaryMask.height);
    for (const pixelIndex of pixels) {
      mask[pixelIndex] = 1;
    }
    return mask;
  });

  return {
    width: binaryMask.width,
    height: binaryMask.height,
    masks,
  };
}

function buildExpectedStrokeMasks({
  targetText,
  metrics,
  guideFontSize,
  guideGlyphConfig,
  expectedStrokes,
}: Pick<
  TraceScoringParams,
  | "targetText"
  | "metrics"
  | "guideFontSize"
  | "guideGlyphConfig"
  | "expectedStrokes"
>): ExpectedStrokeMaskSet | null {
  const binaryGlyphMask = createGlyphBinaryMask(
    targetText,
    metrics,
    guideFontSize,
    guideGlyphConfig,
  );
  if (!binaryGlyphMask) return null;

  if (expectedStrokes && expectedStrokes.length > 1) {
    const strokeMaskSet = createAutoStrokeMaskSet(
      expectedStrokes,
      binaryGlyphMask,
      metrics,
    );
    if (strokeMaskSet && strokeMaskSet.canvases.length > 1) {
      const masks = strokeMaskSet.canvases
        .map((canvas) =>
          convertCanvasToBinaryMask(canvas, STROKE_MASK_ALPHA_THRESHOLD),
        )
        .filter((mask): mask is Uint8Array => mask !== null);

      if (masks.length > 1) {
        return {
          width: strokeMaskSet.width,
          height: strokeMaskSet.height,
          masks,
        };
      }
    }
  }

  return buildComponentMaskSet(binaryGlyphMask);
}

function createDrawnMaskAtSize(
  drawCanvas: HTMLCanvasElement,
  width: number,
  height: number,
): Uint8Array | null {
  if (typeof document === "undefined") return null;
  const scratchCanvas = document.createElement("canvas");
  scratchCanvas.width = Math.max(1, width);
  scratchCanvas.height = Math.max(1, height);
  const scratchCtx = scratchCanvas.getContext("2d");
  if (!scratchCtx) return null;

  scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  scratchCtx.drawImage(
    drawCanvas,
    0,
    0,
    scratchCanvas.width,
    scratchCanvas.height,
  );
  const rgbaData = scratchCtx.getImageData(
    0,
    0,
    scratchCanvas.width,
    scratchCanvas.height,
  ).data;
  return createMaskFromAlphaData(rgbaData, DRAWN_ALPHA_THRESHOLD);
}

function getPixelIndexFromPoint(
  point: TraceStrokePoint,
  width: number,
  height: number,
): number {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
  if (x < 0 || y < 0 || x >= width || y >= height) return -1;
  return y * width + x;
}

function removeConsecutiveDuplicates(values: number[]): number[] {
  if (values.length === 0) return values;
  const deduped: number[] = [values[0]];
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] !== values[index - 1]) {
      deduped.push(values[index]);
    }
  }
  return deduped;
}

function evaluateStrokeOrder(
  drawnStrokes: TraceStroke[] | undefined,
  expectedStrokeMasks: ExpectedStrokeMaskSet,
): StrokeOrderEvaluation {
  const expectedStrokeCount = expectedStrokeMasks.masks.length;
  if (expectedStrokeCount <= 1) {
    return {
      orderScore: 1,
      matchedStrokeCount: expectedStrokeCount,
      expectedStrokeCount,
    };
  }

  if (!drawnStrokes || drawnStrokes.length === 0) {
    return {
      orderScore: 0,
      matchedStrokeCount: 0,
      expectedStrokeCount,
    };
  }

  const assignedStrokeIndices: number[] = [];

  drawnStrokes.forEach((strokePoints) => {
    if (!strokePoints || strokePoints.length === 0) return;

    const hitCounts = new Array(expectedStrokeCount).fill(0);
    let sampledPoints = 0;

    strokePoints.forEach((point) => {
      const pixelIndex = getPixelIndexFromPoint(
        point,
        expectedStrokeMasks.width,
        expectedStrokeMasks.height,
      );
      if (pixelIndex < 0) return;
      sampledPoints += 1;

      for (
        let expectedIndex = 0;
        expectedIndex < expectedStrokeCount;
        expectedIndex += 1
      ) {
        if (expectedStrokeMasks.masks[expectedIndex][pixelIndex] === 1) {
          hitCounts[expectedIndex] += 1;
        }
      }
    });

    if (sampledPoints === 0) return;
    let bestStrokeIndex = -1;
    let bestHitCount = 0;

    for (
      let expectedIndex = 0;
      expectedIndex < expectedStrokeCount;
      expectedIndex += 1
    ) {
      if (hitCounts[expectedIndex] > bestHitCount) {
        bestHitCount = hitCounts[expectedIndex];
        bestStrokeIndex = expectedIndex;
      }
    }

    const bestHitRatio = bestHitCount / sampledPoints;
    if (bestStrokeIndex >= 0 && bestHitRatio >= MIN_STROKE_ASSIGNMENT_RATIO) {
      assignedStrokeIndices.push(bestStrokeIndex);
    }
  });

  if (assignedStrokeIndices.length === 0) {
    return {
      orderScore: 0,
      matchedStrokeCount: 0,
      expectedStrokeCount,
    };
  }

  const normalizedSequence = removeConsecutiveDuplicates(assignedStrokeIndices);
  let expectedIndex = 0;
  let matchedStrokeCount = 0;
  let orderViolations = 0;

  normalizedSequence.forEach((assignedIndex) => {
    if (expectedIndex >= expectedStrokeCount) {
      orderViolations += 1;
      return;
    }

    if (assignedIndex === expectedIndex) {
      matchedStrokeCount += 1;
      expectedIndex += 1;
      return;
    }

    orderViolations += 1;
  });

  const orderScore = clamp01(
    (matchedStrokeCount - orderViolations * ORDER_VIOLATION_PENALTY) /
      expectedStrokeCount,
  );

  return {
    orderScore,
    matchedStrokeCount,
    expectedStrokeCount,
  };
}

function evaluatePerStrokeCoverage(
  drawnMask: Uint8Array,
  expectedStrokeMasks: ExpectedStrokeMaskSet,
): { averageCoverage: number; minCoverage: number } {
  if (expectedStrokeMasks.masks.length === 0) {
    return {
      averageCoverage: 1,
      minCoverage: 1,
    };
  }

  let totalCoverage = 0;
  let minCoverage = 1;

  expectedStrokeMasks.masks.forEach((strokeMask) => {
    let strokePixelCount = 0;
    let overlapPixelCount = 0;

    for (let pixelIndex = 0; pixelIndex < strokeMask.length; pixelIndex += 1) {
      if (strokeMask[pixelIndex] !== 1) continue;
      strokePixelCount += 1;
      if (drawnMask[pixelIndex] === 1) {
        overlapPixelCount += 1;
      }
    }

    const strokeCoverage =
      strokePixelCount > 0 ? overlapPixelCount / strokePixelCount : 0;
    totalCoverage += strokeCoverage;
    minCoverage = Math.min(minCoverage, strokeCoverage);
  });

  return {
    averageCoverage: totalCoverage / expectedStrokeMasks.masks.length,
    minCoverage,
  };
}

export function evaluateTracingScore({
  drawCanvas,
  targetText,
  metrics,
  guideFontSize,
  lesson,
  guideGlyphConfig,
  expectedStrokes,
  drawnStrokes,
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
  const drawnToTargetRatio =
    targetPixels > 0 ? drawnPixels / targetPixels : Number.POSITIVE_INFINITY;
  const pathScore = clamp01(coverage * 0.45 + precision * 0.55);

  let score = pathScore;
  let strokeOrderScore = 1;
  let strokeMinCoverage = 1;
  let shouldEnforceOrderGate = false;

  const expectedStrokeMasks = buildExpectedStrokeMasks({
    targetText,
    metrics,
    guideFontSize,
    guideGlyphConfig,
    expectedStrokes,
  });

  if (expectedStrokeMasks && expectedStrokeMasks.masks.length > 0) {
    const downscaledDrawnMask = createDrawnMaskAtSize(
      drawCanvas,
      expectedStrokeMasks.width,
      expectedStrokeMasks.height,
    );

    if (downscaledDrawnMask) {
      const strokeCoverage = evaluatePerStrokeCoverage(
        downscaledDrawnMask,
        expectedStrokeMasks,
      );
      strokeMinCoverage = strokeCoverage.minCoverage;
      const orderEvaluation = evaluateStrokeOrder(
        drawnStrokes,
        expectedStrokeMasks,
      );
      strokeOrderScore = orderEvaluation.orderScore;
      shouldEnforceOrderGate = orderEvaluation.expectedStrokeCount > 1;

      const strokeStructureScore = clamp01(
        strokeCoverage.averageCoverage * 0.62 + strokeOrderScore * 0.38,
      );
      score = clamp01(pathScore * 0.6 + strokeStructureScore * 0.4);
    }
  }

  const violatesPathShape =
    coverage < MIN_PASS_COVERAGE ||
    precision < MIN_PASS_PRECISION ||
    drawnToTargetRatio > MAX_DRAWN_TO_TARGET_RATIO;
  const violatesStrokeOrder =
    shouldEnforceOrderGate && strokeOrderScore < MIN_STROKE_ORDER_SCORE;
  const violatesStrokeCoverage =
    shouldEnforceOrderGate && strokeMinCoverage < MIN_STROKE_COVERAGE_RATIO;
  const forceFail =
    violatesPathShape || violatesStrokeOrder || violatesStrokeCoverage;

  const scoring = resolveLessonScoring(lesson, "trace_accuracy");
  const { earnedStars, isPassed } = evaluateLessonScore(score, scoring);

  return {
    score,
    earnedStars: forceFail ? 0 : earnedStars,
    isPassed: forceFail ? false : isPassed,
    precision,
    coverage,
  };
}
