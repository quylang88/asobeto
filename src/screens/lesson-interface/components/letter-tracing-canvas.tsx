"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getLetterStrokeAnimation,
  type TracingDemoAnimationConfig,
  type TracingGlyphConfig,
} from "@/data/tracing";
import {
  createTracingGridMetrics,
  LETTER_TRACING_CANVAS_WIDTH,
  LETTER_TRACING_CANVAS_HEIGHT,
} from "@/data/tracing/utils";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  clamp01,
  createAutoStrokeMaskSet,
  drawGuideGlyph,
  getDistanceBetweenPoints,
  generateAutoDemoConfigFromGlyph,
  mapSourcePointToCanvas,
  createGlyphBinaryMask,
  type AutoStrokeMaskSet,
  type DemoCanvasPoint,
} from "@/lib/tracing-algo";
import { type TracingGridMetrics } from "@/data/tracing";
import {
  evaluateTracingScore,
  getEmptyTraceEvaluation,
  type TraceEvaluation,
} from "../scoring/tracing-scoring";
import type { LessonContent } from "@/data/game-config";

// Re-export constants for backward compatibility if needed by index.ts
export { LETTER_TRACING_CANVAS_WIDTH, LETTER_TRACING_CANVAS_HEIGHT };
export type { TraceEvaluation };

type TracingCanvasMode = "practice" | "demo" | "preview";

interface LetterTracingCanvasProps {
  targetText: string;
  mode?: TracingCanvasMode;
  disabled?: boolean;
  lesson?: LessonContent;
  onEvaluate?: (result: TraceEvaluation) => void;
  onAutoTraceComplete?: () => void;
  onFrameTap?: () => void;
}

const GENERIC_DEMO_DURATION_MS = 4200;
const DEFAULT_DEMO_PAUSE_MS = 800;
const DEFAULT_DEMO_STROKE_DURATION_MS = 1250;
const GUIDE_STROKE_COLOR = "rgba(17, 24, 39, 0.16)";
const TRACE_STROKE_COLOR = "#111827";
const USER_STROKE_COLOR = "#0f172a";
const FILLED_STROKE_COLOR = "#0b0f1a";
const TRACING_PRIMARY_FONT_NAME = "HP001_4_hang_normal";
const DESCENDER_CHAR_SET = new Set(["q", "g", "y", "p"]);
const DESCENDER_EXTRA_ROWS = 3;
const WORD_DOT_BELOW_EXTRA_ROWS = 1;
const DOT_BELOW_COMBINING_MARK = "\u0323";
const DEFAULT_TRACING_ROWS = 4;
const PRIMARY_GRID_LINE_WIDTH = 2.2;
const DEFAULT_SINGLE_LETTER_GLYPH: TracingGlyphConfig = {
  x: 30,
  y: 136,
  sizeScale: 2,
};

interface DemoDrawTimelineSegment {
  type: "draw";
  strokeIndex: number;
  durationMs: number;
  start: DemoCanvasPoint;
  end: DemoCanvasPoint;
}

interface DemoPauseTimelineSegment {
  type: "pause";
  durationMs: number;
}

type DemoTimelineSegment = DemoDrawTimelineSegment | DemoPauseTimelineSegment;

interface PreparedDemoTimeline {
  segments: DemoTimelineSegment[];
  totalDurationMs: number;
}

function toCanvasPoint(
  event: PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  metrics: TracingGridMetrics,
) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * metrics.canvasWidth;
  const y = ((event.clientY - rect.top) / rect.height) * metrics.canvasHeight;
  return { x, y };
}

function getGuideFontSize(
  targetText: string,
  metrics: TracingGridMetrics,
): number {
  const targetLength = [...targetText].length;
  const baseSize = Math.min(metrics.drawAreaWidth, metrics.drawAreaHeight);
  if (targetLength <= 1) return Math.round(baseSize * 0.84);
  if (targetLength === 2) return Math.round(baseSize * 0.72);
  if (targetLength <= 4) return Math.round(baseSize * 0.58);
  return Math.round(baseSize * 0.48);
}

function normalizeTextForDescenderCheck(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasDotBelowToneMark(text: string): boolean {
  return text.normalize("NFD").includes(DOT_BELOW_COMBINING_MARK);
}

const STROKE_WIDTH_RATIO = 0.088;
function getTraceLineWidthLocal(fontSize: number): number {
  return Math.max(4, Math.round(fontSize * STROKE_WIDTH_RATIO));
}

async function ensureTracingFontReady(fontSize: number): Promise<void> {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load(
        `400 ${Math.max(12, Math.round(fontSize))}px "${TRACING_PRIMARY_FONT_NAME}"`,
      ),
      document.fonts.ready,
    ]);
  } catch {
    // Ignore font API failures and continue with current available font.
  }
}

function buildDemoTimeline(
  demoConfig: TracingDemoAnimationConfig | undefined,
  metrics: TracingGridMetrics,
): PreparedDemoTimeline | null {
  const demoStrokes = demoConfig?.strokes;
  if (!demoConfig || !demoStrokes || demoStrokes.length === 0) {
    return null;
  }

  const defaultPauseMs = demoConfig.pauseMs ?? DEFAULT_DEMO_PAUSE_MS;
  const defaultStrokeDurationMs =
    demoConfig.strokeDurationMs ?? DEFAULT_DEMO_STROKE_DURATION_MS;
  const timelineSegments: DemoTimelineSegment[] = [];

  demoStrokes.forEach((stroke, strokeIndex) => {
    const mappedPoints = stroke.points.map((point) =>
      mapSourcePointToCanvas(point, metrics),
    );

    if (mappedPoints.length < 2) {
      return;
    }

    const segmentLengths = mappedPoints
      .slice(1)
      .map((endPoint, index) =>
        getDistanceBetweenPoints(mappedPoints[index], endPoint),
      );
    const totalLength = segmentLengths.reduce(
      (sum, segmentLength) => sum + segmentLength,
      0,
    );
    const strokeDurationMs = Math.max(
      240,
      stroke.durationMs ?? defaultStrokeDurationMs,
    );
    const pauseByPointIndex = new Map<number, number>();

    for (const pausePoint of stroke.pausePoints ?? []) {
      const clampedIndex = Math.max(
        0,
        Math.min(mappedPoints.length - 1, pausePoint.pointIndex),
      );
      pauseByPointIndex.set(clampedIndex, pausePoint.pauseMs ?? defaultPauseMs);
    }

    const pauseBeforeMs = stroke.pauseBeforeMs ?? 0;
    if (pauseBeforeMs > 0) {
      timelineSegments.push({
        type: "pause",
        durationMs: pauseBeforeMs,
      });
    }

    const fallbackSegmentDurationMs = strokeDurationMs / segmentLengths.length;
    segmentLengths.forEach((segmentLength, segmentIndex) => {
      const segmentDurationMs =
        totalLength > 0
          ? (segmentLength / totalLength) * strokeDurationMs
          : fallbackSegmentDurationMs;

      timelineSegments.push({
        type: "draw",
        strokeIndex,
        durationMs: Math.max(36, segmentDurationMs),
        start: mappedPoints[segmentIndex],
        end: mappedPoints[segmentIndex + 1],
      });

      const pauseAfterPointMs = pauseByPointIndex.get(segmentIndex + 1);
      if (pauseAfterPointMs && pauseAfterPointMs > 0) {
        timelineSegments.push({
          type: "pause",
          durationMs: pauseAfterPointMs,
        });
      }
    });

    const isLastStroke = strokeIndex === demoStrokes.length - 1;
    const strokePauseAfterMs =
      stroke.pauseAfterMs ?? (!isLastStroke ? defaultPauseMs : 0);
    if (strokePauseAfterMs > 0) {
      timelineSegments.push({
        type: "pause",
        durationMs: strokePauseAfterMs,
      });
    }
  });

  if (timelineSegments.length === 0) {
    return null;
  }

  const totalDurationMs = timelineSegments.reduce(
    (sum, segment) => sum + segment.durationMs,
    0,
  );

  return {
    segments: timelineSegments,
    totalDurationMs,
  };
}

function drawLineSegment(
  ctx: CanvasRenderingContext2D,
  start: DemoCanvasPoint,
  end: DemoCanvasPoint,
) {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function drawLineSegmentWithAutoMask(
  ctx: CanvasRenderingContext2D,
  start: DemoCanvasPoint,
  end: DemoCanvasPoint,
  strokeIndex: number,
  autoStrokeMaskSet: AutoStrokeMaskSet | null,
  scratchCanvas: HTMLCanvasElement | null,
  scratchCtx: CanvasRenderingContext2D | null,
) {
  if (
    !autoStrokeMaskSet ||
    !scratchCanvas ||
    !scratchCtx ||
    strokeIndex < 0 ||
    strokeIndex >= autoStrokeMaskSet.canvases.length
  ) {
    drawLineSegment(ctx, start, end);
    return;
  }

  scratchCtx.setTransform(1, 0, 0, 1, 0, 0);
  scratchCtx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
  scratchCtx.lineJoin = ctx.lineJoin;
  scratchCtx.lineCap = ctx.lineCap;
  scratchCtx.lineWidth = ctx.lineWidth;
  scratchCtx.strokeStyle = ctx.strokeStyle;
  drawLineSegment(scratchCtx, start, end);

  scratchCtx.globalCompositeOperation = "destination-in";
  scratchCtx.drawImage(autoStrokeMaskSet.canvases[strokeIndex], 0, 0);
  scratchCtx.globalCompositeOperation = "source-over";

  ctx.drawImage(scratchCanvas, 0, 0);
}

function drawDemoTimelineFrame(
  ctx: CanvasRenderingContext2D,
  timeline: PreparedDemoTimeline,
  elapsedMs: number,
  autoStrokeMaskSet: AutoStrokeMaskSet | null = null,
  scratchCanvas: HTMLCanvasElement | null = null,
  scratchCtx: CanvasRenderingContext2D | null = null,
) {
  let remainingMs = Math.max(0, elapsedMs);

  for (const segment of timeline.segments) {
    if (segment.type === "pause") {
      if (remainingMs >= segment.durationMs) {
        remainingMs -= segment.durationMs;
        continue;
      }
      break;
    }

    if (remainingMs >= segment.durationMs) {
      drawLineSegmentWithAutoMask(
        ctx,
        segment.start,
        segment.end,
        segment.strokeIndex,
        autoStrokeMaskSet,
        scratchCanvas,
        scratchCtx,
      );
      remainingMs -= segment.durationMs;
      continue;
    }

    if (remainingMs > 0) {
      const segmentProgress = clamp01(remainingMs / segment.durationMs);
      const partialEnd: DemoCanvasPoint = {
        x:
          segment.start.x + (segment.end.x - segment.start.x) * segmentProgress,
        y:
          segment.start.y + (segment.end.y - segment.start.y) * segmentProgress,
      };
      drawLineSegmentWithAutoMask(
        ctx,
        segment.start,
        partialEnd,
        segment.strokeIndex,
        autoStrokeMaskSet,
        scratchCanvas,
        scratchCtx,
      );
    }
    break;
  }
}

function WritingGridOverlay({
  metrics,
  baselineRowIndex,
}: {
  metrics: TracingGridMetrics;
  baselineRowIndex?: number;
}) {
  const columnWidth = metrics.cellSize;
  const rowHeight = metrics.cellSize;
  const primaryVerticalLines = Array.from(
    { length: metrics.columns + 1 },
    (_, index) => metrics.margin + index * columnWidth,
  );
  const primaryHorizontalLines = Array.from(
    { length: metrics.rows + 1 },
    (_, index) => metrics.margin + index * rowHeight,
  );
  const helperVerticalLines = Array.from(
    { length: metrics.columns },
    (_, index) => metrics.margin + (index + 0.5) * columnWidth,
  );
  const helperHorizontalLines = Array.from(
    { length: metrics.rows },
    (_, index) => metrics.margin + (index + 0.5) * rowHeight,
  );
  const emphasizedBaselineY =
    baselineRowIndex !== undefined &&
    baselineRowIndex >= 0 &&
    baselineRowIndex <= metrics.rows
      ? metrics.margin + baselineRowIndex * rowHeight
      : undefined;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      viewBox={`0 0 ${metrics.canvasWidth} ${metrics.canvasHeight}`}
      aria-hidden
    >
      {primaryVerticalLines.map((x, index) => (
        <line
          key={`grid-primary-v-${index}`}
          x1={x}
          y1={metrics.margin}
          x2={x}
          y2={metrics.canvasHeight - metrics.margin}
          stroke="#38bdf8"
          strokeWidth={PRIMARY_GRID_LINE_WIDTH}
          strokeDasharray="8 8"
        />
      ))}
      {primaryHorizontalLines.map((y, index) => (
        <line
          key={`grid-primary-h-${index}`}
          x1={metrics.margin}
          y1={y}
          x2={metrics.canvasWidth - metrics.margin}
          y2={y}
          stroke="#38bdf8"
          strokeWidth={PRIMARY_GRID_LINE_WIDTH}
          strokeDasharray="8 8"
        />
      ))}
      {emphasizedBaselineY !== undefined && (
        <line
          x1={metrics.margin}
          y1={emphasizedBaselineY}
          x2={metrics.canvasWidth - metrics.margin}
          y2={emphasizedBaselineY}
          stroke="#0284c7"
          strokeWidth={PRIMARY_GRID_LINE_WIDTH * 2}
        />
      )}
      {helperVerticalLines.map((x, index) => (
        <line
          key={`grid-helper-v-${index}`}
          x1={x}
          y1={metrics.margin}
          x2={x}
          y2={metrics.canvasHeight - metrics.margin}
          stroke="#93c5fd"
          strokeWidth={1}
          strokeDasharray="4 8"
        />
      ))}
      {helperHorizontalLines.map((y, index) => (
        <line
          key={`grid-helper-h-${index}`}
          x1={metrics.margin}
          y1={y}
          x2={metrics.canvasWidth - metrics.margin}
          y2={y}
          stroke="#93c5fd"
          strokeWidth={1}
          strokeDasharray="4 8"
        />
      ))}
    </svg>
  );
}

export function LetterTracingCanvas({
  targetText,
  mode = "practice",
  disabled,
  lesson,
  onEvaluate,
  onAutoTraceComplete,
  onFrameTap,
}: LetterTracingCanvasProps) {
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [fontReadyTick, setFontReadyTick] = useState(0);
  const autoTraceDoneRef = useRef(false);
  const isDemoMode = mode === "demo";
  const isPreviewMode = mode === "preview";
  const rootClassName =
    mode === "practice"
      ? "mt-2 inline-flex flex-col items-center gap-3"
      : "inline-flex flex-col items-center gap-3";
  const normalizedTarget = useMemo(
    () => targetText.trim().toLocaleLowerCase(),
    [targetText],
  );
  const traceTargetText = normalizedTarget || "a";
  const letterStrokeAnimation = useMemo(
    () => getLetterStrokeAnimation(traceTargetText),
    [traceTargetText],
  );
  const traceDisplayText = letterStrokeAnimation?.letter ?? traceTargetText;
  const baseTracingLayout = letterStrokeAnimation?.layout;
  const baseTracingRows = baseTracingLayout?.rows ?? DEFAULT_TRACING_ROWS;
  const isWordLikeTarget = useMemo(
    () => [...traceDisplayText].length > 1,
    [traceDisplayText],
  );
  const normalizedDescenderText = useMemo(
    () => normalizeTextForDescenderCheck(traceDisplayText),
    [traceDisplayText],
  );
  const hasDescenderTarget = useMemo(
    () =>
      [...normalizedDescenderText].some((character) =>
        DESCENDER_CHAR_SET.has(character),
      ),
    [normalizedDescenderText],
  );
  const hasWordDotBelowTone = useMemo(
    () => isWordLikeTarget && hasDotBelowToneMark(traceDisplayText),
    [isWordLikeTarget, traceDisplayText],
  );
  const effectiveTracingRows =
    baseTracingRows +
    (hasDescenderTarget ? DESCENDER_EXTRA_ROWS : 0) +
    (hasWordDotBelowTone ? WORD_DOT_BELOW_EXTRA_ROWS : 0);
  const baselineRowIndex = baseTracingRows;
  const effectiveTracingLayout = useMemo(
    () => ({
      ...(baseTracingLayout ?? {}),
      rows: effectiveTracingRows,
    }),
    [baseTracingLayout, effectiveTracingRows],
  );
  const tracingGridMetrics = useMemo(
    () => createTracingGridMetrics(effectiveTracingLayout),
    [effectiveTracingLayout],
  );
  const guideFontSize = useMemo(
    () => getGuideFontSize(traceDisplayText, tracingGridMetrics),
    [traceDisplayText, tracingGridMetrics],
  );
  const lineWidth = useMemo(
    () => getTraceLineWidthLocal(guideFontSize),
    [guideFontSize],
  );
  const traceDemoConfig = letterStrokeAnimation?.demo;
  const traceDemoStrategy = traceDemoConfig?.strategy ?? "auto";
  const isSingleLetterTarget = useMemo(
    () => [...traceDisplayText].length === 1,
    [traceDisplayText],
  );
  const adjustedDescenderFallbackGlyph = useMemo<TracingGlyphConfig>(() => {
    const rowScale =
      effectiveTracingRows > 0 ? baseTracingRows / effectiveTracingRows : 1;
    const defaultGlyphY = DEFAULT_SINGLE_LETTER_GLYPH.y ?? 136;
    return {
      ...DEFAULT_SINGLE_LETTER_GLYPH,
      y: defaultGlyphY * rowScale,
    };
  }, [baseTracingRows, effectiveTracingRows]);
  const guideGlyphConfig = useMemo<TracingGlyphConfig | undefined>(() => {
    if (isSingleLetterTarget) {
      if (hasDescenderTarget && !letterStrokeAnimation?.glyph) {
        return adjustedDescenderFallbackGlyph;
      }
      return {
        ...DEFAULT_SINGLE_LETTER_GLYPH,
        ...letterStrokeAnimation?.glyph,
      };
    }
    return letterStrokeAnimation?.glyph;
  }, [
    adjustedDescenderFallbackGlyph,
    hasDescenderTarget,
    isSingleLetterTarget,
    letterStrokeAnimation,
  ]);

  useEffect(() => {
    let didCancel = false;
    const syncTracingFont = async () => {
      await ensureTracingFontReady(guideFontSize);
      if (didCancel) return;
      setFontReadyTick((current) => current + 1);
    };
    void syncTracingFont();
    return () => {
      didCancel = true;
    };
  }, [guideFontSize, traceDisplayText]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const guideCanvas = guideCanvasRef.current;
    if (!canvas || !guideCanvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(tracingGridMetrics.canvasWidth * ratio);
    canvas.height = Math.floor(tracingGridMetrics.canvasHeight * ratio);
    canvas.style.width = `${tracingGridMetrics.canvasWidth}px`;
    canvas.style.height = `${tracingGridMetrics.canvasHeight}px`;

    guideCanvas.width = Math.floor(tracingGridMetrics.canvasWidth * ratio);
    guideCanvas.height = Math.floor(tracingGridMetrics.canvasHeight * ratio);
    guideCanvas.style.width = `${tracingGridMetrics.canvasWidth}px`;
    guideCanvas.style.height = `${tracingGridMetrics.canvasHeight}px`;

    const drawCtx = canvas.getContext("2d");
    const guideCtx = guideCanvas.getContext("2d");
    if (!drawCtx || !guideCtx) return;

    drawCtx.scale(ratio, ratio);
    drawCtx.lineJoin = "round";
    drawCtx.lineCap = "round";
    drawCtx.lineWidth = lineWidth;
    drawCtx.strokeStyle = USER_STROKE_COLOR;
    drawCtx.clearRect(
      0,
      0,
      tracingGridMetrics.canvasWidth,
      tracingGridMetrics.canvasHeight,
    );

    guideCtx.scale(ratio, ratio);
    guideCtx.clearRect(
      0,
      0,
      tracingGridMetrics.canvasWidth,
      tracingGridMetrics.canvasHeight,
    );

    // Lesson 1 chế độ preview chỉ cần ô ly + chữ tô sẵn, không vẽ lớp chữ mờ nền
    if (isPreviewMode) return;

    drawGuideGlyph(
      guideCtx,
      traceDisplayText,
      tracingGridMetrics,
      guideFontSize,
      GUIDE_STROKE_COLOR,
      guideGlyphConfig,
      true,
    );
  }, [
    fontReadyTick,
    guideGlyphConfig,
    guideFontSize,
    isPreviewMode,
    lineWidth,
    traceDisplayText,
    tracingGridMetrics,
  ]);

  useEffect(() => {
    if (!isPreviewMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawCtx = canvas.getContext("2d");
    if (!drawCtx) return;

    const ratio = window.devicePixelRatio || 1;
    const previewStrokeWidth = Math.max(9, lineWidth * 0.92);

    drawCtx.setTransform(1, 0, 0, 1, 0, 0);
    drawCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawCtx.scale(ratio, ratio);
    drawCtx.lineJoin = "round";
    drawCtx.lineCap = "round";
    drawCtx.lineWidth = previewStrokeWidth;
    drawCtx.strokeStyle = FILLED_STROKE_COLOR;

    drawGuideGlyph(
      drawCtx,
      traceDisplayText,
      tracingGridMetrics,
      guideFontSize,
      FILLED_STROKE_COLOR,
      guideGlyphConfig,
      true,
    );
  }, [
    fontReadyTick,
    guideGlyphConfig,
    guideFontSize,
    isPreviewMode,
    lineWidth,
    traceDisplayText,
    tracingGridMetrics,
  ]);

  useEffect(() => {
    if (!isDemoMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawCtx = canvas.getContext("2d");
    if (!drawCtx) return;

    const ratio = window.devicePixelRatio || 1;
    const demoStrokeWidth = Math.max(8, lineWidth * 0.88);
    autoTraceDoneRef.current = false;
    let rafId = 0;
    let didCancel = false;

    const startDemoAnimation = async () => {
      if (
        traceDemoStrategy === "auto" &&
        isSingleLetterTarget &&
        typeof document !== "undefined" &&
        "fonts" in document
      ) {
        try {
          await document.fonts.ready;
        } catch {
          // Ignore font readiness failures and fallback to current rendered glyph.
        }
      }

      if (didCancel) return;

      const autoGeneratedDemoConfig =
        traceDemoStrategy === "auto" && isSingleLetterTarget
          ? generateAutoDemoConfigFromGlyph(
              traceDisplayText,
              tracingGridMetrics,
              guideFontSize,
              guideGlyphConfig,
              traceDemoConfig,
            )
          : null;
      const effectiveDemoConfig: TracingDemoAnimationConfig | undefined =
        traceDemoStrategy === "manual"
          ? traceDemoConfig
          : (autoGeneratedDemoConfig ?? undefined);
      const runtimeDemoTimeline = buildDemoTimeline(
        effectiveDemoConfig,
        tracingGridMetrics,
      );
      const autoBinaryMask =
        traceDemoStrategy === "auto" && isSingleLetterTarget
          ? createGlyphBinaryMask(
              traceDisplayText,
              tracingGridMetrics,
              guideFontSize,
              guideGlyphConfig,
            )
          : null;
      const autoStrokeMaskSet =
        traceDemoStrategy === "auto"
          ? createAutoStrokeMaskSet(
              effectiveDemoConfig?.strokes,
              autoBinaryMask,
              tracingGridMetrics,
            )
          : null;
      const scratchCanvas =
        autoStrokeMaskSet && typeof document !== "undefined"
          ? document.createElement("canvas")
          : null;
      if (scratchCanvas && autoStrokeMaskSet) {
        scratchCanvas.width = autoStrokeMaskSet.width;
        scratchCanvas.height = autoStrokeMaskSet.height;
      }
      const scratchCtx = scratchCanvas?.getContext("2d") ?? null;
      const demoDurationMs =
        runtimeDemoTimeline?.totalDurationMs ?? GENERIC_DEMO_DURATION_MS;

      const drawDemoFrame = (elapsedMs: number) => {
        drawCtx.setTransform(1, 0, 0, 1, 0, 0);
        drawCtx.clearRect(0, 0, canvas.width, canvas.height);
        drawCtx.scale(ratio, ratio);
        drawCtx.globalAlpha = 1;
        drawCtx.lineJoin = "round";
        drawCtx.lineCap = "round";
        drawCtx.lineWidth = demoStrokeWidth;
        drawCtx.strokeStyle = TRACE_STROKE_COLOR;

        if (runtimeDemoTimeline) {
          drawDemoTimelineFrame(
            drawCtx,
            runtimeDemoTimeline,
            elapsedMs,
            autoStrokeMaskSet,
            scratchCanvas,
            scratchCtx,
          );

          // Auto-demo luôn cắt nét theo đúng mask glyph để không tô ra ngoài chữ mờ.
          if (traceDemoStrategy === "auto") {
            drawCtx.globalCompositeOperation = "destination-in";
            drawGuideGlyph(
              drawCtx,
              traceDisplayText,
              tracingGridMetrics,
              guideFontSize,
              "#000000",
              guideGlyphConfig,
              false,
            );
            drawCtx.globalCompositeOperation = "source-over";

            // Chốt khung cuối bằng glyph đầy đủ để hình sau khi tô trùng khít chữ gốc.
            if (elapsedMs >= demoDurationMs - 8) {
              drawGuideGlyph(
                drawCtx,
                traceDisplayText,
                tracingGridMetrics,
                guideFontSize,
                TRACE_STROKE_COLOR,
                guideGlyphConfig,
                false,
              );
            }
          }
          return;
        }

        const normalizedProgress = clamp01(
          elapsedMs / GENERIC_DEMO_DURATION_MS,
        );
        drawCtx.globalAlpha = 0.2 + normalizedProgress * 0.65;
        drawGuideGlyph(
          drawCtx,
          traceDisplayText,
          tracingGridMetrics,
          guideFontSize,
          TRACE_STROKE_COLOR,
          guideGlyphConfig,
          false,
        );
        drawCtx.globalAlpha = 1;
        drawGuideGlyph(
          drawCtx,
          traceDisplayText,
          tracingGridMetrics,
          guideFontSize,
          `rgba(17, 24, 39, ${0.08 + normalizedProgress * 0.18})`,
          guideGlyphConfig,
          false,
        );
      };

      let startTime = 0;
      const tick = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        drawDemoFrame(elapsed);

        if (elapsed < demoDurationMs) {
          rafId = window.requestAnimationFrame(tick);
          return;
        }

        if (!autoTraceDoneRef.current) {
          autoTraceDoneRef.current = true;
          onAutoTraceComplete?.();
        }
      };

      rafId = window.requestAnimationFrame(tick);
    };

    void startDemoAnimation();
    return () => {
      didCancel = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [
    fontReadyTick,
    guideGlyphConfig,
    guideFontSize,
    isSingleLetterTarget,
    isDemoMode,
    lineWidth,
    onAutoTraceComplete,
    traceDemoConfig,
    traceDemoStrategy,
    traceDisplayText,
    tracingGridMetrics,
  ]);

  // Xóa toàn bộ nét bé đã vẽ để bắt đầu lại lượt tô
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(
      0,
      0,
      tracingGridMetrics.canvasWidth,
      tracingGridMetrics.canvasHeight,
    );
    setHasStroke(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || isDemoMode || isPreviewMode) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(event.pointerId);
    const point = toCanvasPoint(event, canvas, tracingGridMetrics);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setIsDrawing(true);
    setHasStroke(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || isDemoMode || isPreviewMode) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = toCanvasPoint(event, canvas, tracingGridMetrics);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // Chấm điểm dựa trên độ phủ và độ chính xác so với chữ mẫu
  const evaluateTrace = () => {
    if (!onEvaluate) return;
    const canvas = canvasRef.current;
    if (!canvas || !normalizedTarget) {
      onEvaluate(getEmptyTraceEvaluation());
      return;
    }
    onEvaluate(
      evaluateTracingScore({
        drawCanvas: canvas,
        targetText: traceDisplayText,
        metrics: tracingGridMetrics,
        guideFontSize,
        lesson,
        guideGlyphConfig,
      }),
    );
  };

  return (
    <div className={rootClassName}>
      <div
        className="relative overflow-hidden rounded-md border-2 border-sky-400 bg-white shadow-lg"
        style={{
          width: `${tracingGridMetrics.canvasWidth}px`,
          height: `${tracingGridMetrics.canvasHeight}px`,
        }}
        onPointerDown={() => {
          if (!onFrameTap || !isDemoMode) return;
          onFrameTap();
        }}
      >
        <WritingGridOverlay
          metrics={tracingGridMetrics}
          baselineRowIndex={baselineRowIndex}
        />
        <canvas
          ref={guideCanvasRef}
          className="pointer-events-none absolute inset-0"
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-10 touch-none ${
            disabled || isDemoMode || isPreviewMode
              ? "pointer-events-none opacity-80"
              : ""
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      {mode === "practice" && (
        <div className="flex items-center gap-3">
          <PrimaryButton
            onClick={clearCanvas}
            disabled={disabled}
            className="rounded-2xl"
            frontClassName="px-5 py-2 text-sm"
          >
            Xóa nét
          </PrimaryButton>
          <PrimaryButton
            onClick={evaluateTrace}
            disabled={disabled || !hasStroke}
            className="rounded-2xl"
            frontClassName="px-6 py-2 text-sm"
          >
            Chấm điểm
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
