"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getLetterStrokeAnimation,
  type LetterStrokePath,
  type StrokePoint,
  type TracingGlyphConfig,
} from "@/data/tracing";
import { PrimaryButton } from "@/components/common/primary-button";

export interface TraceEvaluation {
  score: number;
  stars: number;
  precision: number;
  coverage: number;
}

type TracingCanvasMode = "practice" | "demo" | "preview";

interface LetterTracingCanvasProps {
  targetText: string;
  mode?: TracingCanvasMode;
  disabled?: boolean;
  oneStarThreshold?: number;
  twoStarThreshold?: number;
  onEvaluate?: (result: TraceEvaluation) => void;
  onAutoTraceComplete?: () => void;
  onFrameTap?: () => void;
}

interface SampledStroke {
  points: StrokePoint[];
  cumulativeLengths: number[];
  totalLength: number;
  durationMs: number;
  pauseAfterMs: number;
}

const SOURCE_CANVAS_SIZE = 280;
const LINE_WIDTH = 28;
const GENERIC_DEMO_DURATION_MS = 4200;
// Lấy mẫu dày hơn để nét auto-tô bám cong mượt, không bị gãy khi chạy chậm
const STROKE_SAMPLE_DENSITY = 220;
const DEFAULT_WRITING_GRID_MARGIN = 8;
// Mặc định lưới ngang 3 ô, dọc 4 ô; một số từ ghép sẽ ghi đè (ví dụ "cá" dùng 4 ô ngang).
const DEFAULT_WRITING_GRID_COLUMNS = 3;
const DEFAULT_WRITING_GRID_ROWS = 4;
const DEFAULT_WRITING_GRID_CELL_SIZE = 70;
const GUIDE_STROKE_COLOR = "rgba(17, 24, 39, 0.16)";
const TRACE_STROKE_COLOR = "#111827";
const USER_STROKE_COLOR = "#0f172a";
const FILLED_STROKE_COLOR = "#0b0f1a";

interface TracingGridMetrics {
  margin: number;
  columns: number;
  rows: number;
  cellSize: number;
  drawAreaWidth: number;
  drawAreaHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

function createTracingGridMetrics(layout?: {
  margin?: number;
  columns?: number;
  rows?: number;
  cellSize?: number;
}): TracingGridMetrics {
  const margin = layout?.margin ?? DEFAULT_WRITING_GRID_MARGIN;
  const columns = layout?.columns ?? DEFAULT_WRITING_GRID_COLUMNS;
  const rows = layout?.rows ?? DEFAULT_WRITING_GRID_ROWS;
  const cellSize = layout?.cellSize ?? DEFAULT_WRITING_GRID_CELL_SIZE;
  const drawAreaWidth = columns * cellSize;
  const drawAreaHeight = rows * cellSize;

  return {
    margin,
    columns,
    rows,
    cellSize,
    drawAreaWidth,
    drawAreaHeight,
    canvasWidth: drawAreaWidth + margin * 2,
    canvasHeight: drawAreaHeight + margin * 2,
  };
}

const DEFAULT_TRACING_GRID_METRICS = createTracingGridMetrics();

export const LETTER_TRACING_CANVAS_WIDTH =
  DEFAULT_TRACING_GRID_METRICS.canvasWidth;
export const LETTER_TRACING_CANVAS_HEIGHT =
  DEFAULT_TRACING_GRID_METRICS.canvasHeight;

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

function mapPointToWritingGrid(
  point: StrokePoint,
  metrics: TracingGridMetrics,
): StrokePoint {
  return {
    x: metrics.margin + (point.x / SOURCE_CANVAS_SIZE) * metrics.drawAreaWidth,
    y: metrics.margin + (point.y / SOURCE_CANVAS_SIZE) * metrics.drawAreaHeight,
  };
}

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function distance(from: StrokePoint, to: StrokePoint): number {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function cubicBezierPoint(
  t: number,
  start: StrokePoint,
  strokeCurve: LetterStrokePath["curves"][number],
): StrokePoint {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x:
      uuu * start.x +
      3 * uu * t * strokeCurve.control1.x +
      3 * u * tt * strokeCurve.control2.x +
      ttt * strokeCurve.end.x,
    y:
      uuu * start.y +
      3 * uu * t * strokeCurve.control1.y +
      3 * u * tt * strokeCurve.control2.y +
      ttt * strokeCurve.end.y,
  };
}

function sampleStrokePath(
  stroke: LetterStrokePath,
  metrics: TracingGridMetrics,
): SampledStroke {
  const mappedStart = mapPointToWritingGrid(stroke.start, metrics);
  const points: StrokePoint[] = [{ x: mappedStart.x, y: mappedStart.y }];
  let cursor: StrokePoint = { x: mappedStart.x, y: mappedStart.y };

  for (const curve of stroke.curves) {
    const mappedCurve = {
      control1: mapPointToWritingGrid(curve.control1, metrics),
      control2: mapPointToWritingGrid(curve.control2, metrics),
      end: mapPointToWritingGrid(curve.end, metrics),
    };
    for (let step = 1; step <= STROKE_SAMPLE_DENSITY; step += 1) {
      const t = step / STROKE_SAMPLE_DENSITY;
      points.push(cubicBezierPoint(t, cursor, mappedCurve));
    }
    cursor = { x: mappedCurve.end.x, y: mappedCurve.end.y };
  }

  const cumulativeLengths: number[] = [0];
  let totalLength = 0;

  for (let i = 1; i < points.length; i += 1) {
    totalLength += distance(points[i - 1], points[i]);
    cumulativeLengths.push(totalLength);
  }

  return {
    points,
    cumulativeLengths,
    totalLength,
    durationMs: stroke.durationMs,
    pauseAfterMs: stroke.pauseAfterMs ?? 0,
  };
}

function drawPartialSampledStroke(
  ctx: CanvasRenderingContext2D,
  sampledStroke: SampledStroke,
  progress: number,
) {
  if (sampledStroke.points.length <= 1) return;

  const normalizedProgress = clamp01(progress);
  const targetLength = sampledStroke.totalLength * normalizedProgress;

  const points = sampledStroke.points;
  const cumulativeLengths = sampledStroke.cumulativeLengths;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (targetLength <= 0) {
    ctx.stroke();
    return;
  }

  for (let i = 1; i < points.length; i += 1) {
    const segmentEndLength = cumulativeLengths[i];

    if (segmentEndLength <= targetLength) {
      ctx.lineTo(points[i].x, points[i].y);
      continue;
    }

    const segmentStartLength = cumulativeLengths[i - 1];
    const segmentLength = segmentEndLength - segmentStartLength;
    const segmentProgress =
      segmentLength > 0
        ? (targetLength - segmentStartLength) / segmentLength
        : 0;

    ctx.lineTo(
      lerp(points[i - 1].x, points[i].x, segmentProgress),
      lerp(points[i - 1].y, points[i].y, segmentProgress),
    );
    break;
  }

  ctx.stroke();
}

function drawSampledStrokeGuide(
  ctx: CanvasRenderingContext2D,
  sampledStrokes: SampledStroke[],
  metrics: TracingGridMetrics,
  guideLineWidth: number,
  strokeStyle: string = GUIDE_STROKE_COLOR,
  clearFirst: boolean = true,
) {
  if (clearFirst) {
    ctx.clearRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
  }
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = guideLineWidth;
  ctx.strokeStyle = strokeStyle;

  for (const sampledStroke of sampledStrokes) {
    drawPartialSampledStroke(ctx, sampledStroke, 1);
  }
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

function getTraceLineWidth(targetText: string): number {
  const targetLength = [...targetText].length;
  if (targetLength <= 1) return 16;
  if (targetLength === 2) return 14;
  if (targetLength <= 4) return 12;
  return Math.max(10, LINE_WIDTH * 0.38);
}

function getCanvasGuideFontFamily(): string {
  if (typeof window === "undefined") {
    return '"Mali", sans-serif';
  }

  const appFontFamily = window
    .getComputedStyle(document.body)
    .fontFamily.trim();
  if (appFontFamily.length > 0) {
    return appFontFamily;
  }

  return '"Mali", sans-serif';
}

function resolveGuideGlyphDrawModel(
  ctx: CanvasRenderingContext2D,
  targetText: string,
  metrics: TracingGridMetrics,
  guideFontSize: number,
  fallbackFontFamily: string,
  glyphConfig?: TracingGlyphConfig,
) {
  const text = glyphConfig?.text ?? targetText;
  const defaultGlyphFontFamily = '"HP001_4_hang_normal", "Mali", sans-serif';
  const fontFamily =
    glyphConfig?.fontFamily ??
    (glyphConfig ? defaultGlyphFontFamily : fallbackFontFamily);
  const fontWeight = glyphConfig?.fontWeight ?? 700;

  const sizeScale = glyphConfig?.sizeScale ?? 1;
  const fontSize = Math.max(12, Math.round(guideFontSize * sizeScale));

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const measured = ctx.measureText(text);
  const measuredWidth = Math.max(1, measured.width);
  const ascent = measured.actualBoundingBoxAscent || fontSize * 0.74;
  const descent = measured.actualBoundingBoxDescent || fontSize * 0.26;

  const mappedLeftX =
    glyphConfig?.x !== undefined
      ? metrics.margin + (glyphConfig.x / SOURCE_CANVAS_SIZE) * metrics.drawAreaWidth
      : undefined;
  const mappedTopY =
    glyphConfig?.y !== undefined
      ? metrics.margin + (glyphConfig.y / SOURCE_CANVAS_SIZE) * metrics.drawAreaHeight
      : undefined;

  const centerX =
    mappedLeftX !== undefined ? mappedLeftX + measuredWidth / 2 : metrics.canvasWidth / 2;
  const baselineY =
    mappedTopY !== undefined
      ? mappedTopY + ascent
      : metrics.canvasHeight / 2 + (ascent - descent) / 2;

  return {
    text,
    fontSize,
    fontFamily,
    fontWeight,
    centerX,
    baselineY,
  };
}

function drawGuideGlyph(
  ctx: CanvasRenderingContext2D,
  targetText: string,
  metrics: TracingGridMetrics,
  guideFontSize: number,
  fillStyle: string = "rgba(17, 24, 39, 0.15)",
  fontFamily: string = getCanvasGuideFontFamily(),
  glyphConfig?: TracingGlyphConfig,
  clearFirst: boolean = true,
) {
  if (clearFirst) {
    ctx.clearRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);
  }
  const guideGlyph = resolveGuideGlyphDrawModel(
    ctx,
    targetText,
    metrics,
    guideFontSize,
    fontFamily,
    glyphConfig,
  );
  ctx.fillStyle = fillStyle;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${guideGlyph.fontWeight} ${guideGlyph.fontSize}px ${guideGlyph.fontFamily}`;
  ctx.fillText(guideGlyph.text, guideGlyph.centerX, guideGlyph.baselineY);
}

function WritingGridOverlay({ metrics }: { metrics: TracingGridMetrics }) {
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
          strokeWidth={2.2}
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
          strokeWidth={2.2}
          strokeDasharray="8 8"
        />
      ))}
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
  oneStarThreshold = 0.5,
  twoStarThreshold = 0.85,
  onEvaluate,
  onAutoTraceComplete,
  onFrameTap,
}: LetterTracingCanvasProps) {
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
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
  const letterStrokeAnimation = useMemo(
    () => getLetterStrokeAnimation(normalizedTarget || "a"),
    [normalizedTarget],
  );
  const tracingGridMetrics = useMemo(
    () => createTracingGridMetrics(letterStrokeAnimation?.layout),
    [letterStrokeAnimation],
  );
  const guideFontSize = useMemo(
    () => getGuideFontSize(normalizedTarget || "a", tracingGridMetrics),
    [normalizedTarget, tracingGridMetrics],
  );
  const lineWidth = useMemo(
    () => getTraceLineWidth(normalizedTarget || "a"),
    [normalizedTarget],
  );
  const guideGlyphConfig = letterStrokeAnimation?.glyph;
  const hasGuideGlyph = Boolean(guideGlyphConfig);
  // Chuyển dữ liệu đường cong theo từng chữ thành danh sách điểm để vẽ mượt theo tiến trình
  const sampledDemoStrokes = useMemo(
    () =>
      letterStrokeAnimation?.strokes.map((stroke) =>
        sampleStrokePath(stroke, tracingGridMetrics),
      ) ?? [],
    [letterStrokeAnimation, tracingGridMetrics],
  );
  const totalDemoDurationMs = useMemo(() => {
    if (sampledDemoStrokes.length === 0) return GENERIC_DEMO_DURATION_MS;
    return sampledDemoStrokes.reduce(
      (sum, stroke) => sum + stroke.durationMs + stroke.pauseAfterMs,
      0,
    );
  }, [sampledDemoStrokes]);

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

    const guideStrokeWidth = Math.max(7, lineWidth * 0.7);
    if (hasGuideGlyph) {
      drawGuideGlyph(
        guideCtx,
        normalizedTarget || "a",
        tracingGridMetrics,
        guideFontSize,
        GUIDE_STROKE_COLOR,
        getCanvasGuideFontFamily(),
        guideGlyphConfig,
        true,
      );
    } else if (sampledDemoStrokes.length > 0) {
      drawSampledStrokeGuide(
        guideCtx,
        sampledDemoStrokes,
        tracingGridMetrics,
        guideStrokeWidth,
        GUIDE_STROKE_COLOR,
      );
    } else {
      drawGuideGlyph(
        guideCtx,
        normalizedTarget || "a",
        tracingGridMetrics,
        guideFontSize,
        GUIDE_STROKE_COLOR,
        getCanvasGuideFontFamily(),
      );
    }
  }, [
    guideGlyphConfig,
    guideFontSize,
    hasGuideGlyph,
    isPreviewMode,
    lineWidth,
    normalizedTarget,
    sampledDemoStrokes,
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

    if (hasGuideGlyph) {
      drawGuideGlyph(
        drawCtx,
        normalizedTarget || "a",
        tracingGridMetrics,
        guideFontSize,
        FILLED_STROKE_COLOR,
        getCanvasGuideFontFamily(),
        guideGlyphConfig,
        true,
      );
      return;
    }

    if (sampledDemoStrokes.length > 0) {
      drawSampledStrokeGuide(
        drawCtx,
        sampledDemoStrokes,
        tracingGridMetrics,
        previewStrokeWidth,
        FILLED_STROKE_COLOR,
      );
      return;
    }

    drawGuideGlyph(
      drawCtx,
      normalizedTarget || "a",
      tracingGridMetrics,
      guideFontSize,
      FILLED_STROKE_COLOR,
      getCanvasGuideFontFamily(),
    );
  }, [
    guideGlyphConfig,
    guideFontSize,
    hasGuideGlyph,
    isPreviewMode,
    lineWidth,
    normalizedTarget,
    sampledDemoStrokes,
    tracingGridMetrics,
  ]);

  useEffect(() => {
    if (!isDemoMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawCtx = canvas.getContext("2d");
    if (!drawCtx) return;

    const ratio = window.devicePixelRatio || 1;
    const traceText = normalizedTarget || "a";
    const traceLineWidth = Math.max(8, lineWidth * 0.74);
    const guideFontFamily = getCanvasGuideFontFamily();
    autoTraceDoneRef.current = false;

    const drawGenericFallbackFrame = (progress: number) => {
      const normalizedProgress = clamp01(progress);
      drawCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawCtx.scale(ratio, ratio);
      drawCtx.globalAlpha = 0.2 + normalizedProgress * 0.65;
      drawGuideGlyph(
        drawCtx,
        traceText,
        tracingGridMetrics,
        guideFontSize,
        TRACE_STROKE_COLOR,
        guideFontFamily,
        guideGlyphConfig,
        false,
      );
      drawCtx.globalAlpha = 1;
      drawGuideGlyph(
        drawCtx,
        traceText,
        tracingGridMetrics,
        guideFontSize,
        `rgba(17, 24, 39, ${0.08 + normalizedProgress * 0.18})`,
        guideFontFamily,
        guideGlyphConfig,
        false,
      );
    };

    // Ưu tiên vẽ theo từng nét chữ được định nghĩa riêng để đúng quy trình viết của từng chữ
    const drawLetterStrokeFrame = (elapsedMs: number) => {
      drawCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawCtx.scale(ratio, ratio);
      drawCtx.lineJoin = "round";
      drawCtx.lineCap = "round";
      drawCtx.lineWidth = traceLineWidth;
      drawCtx.strokeStyle = TRACE_STROKE_COLOR;
      // Bóng nhẹ để nét nổi nhưng vẫn sắc, tránh cảm giác lem
      drawCtx.shadowColor = "rgba(15, 23, 42, 0.2)";
      drawCtx.shadowBlur = 3;

      // Chạy timeline theo từng nét + khoảng dừng giữa các nét (nếu có)
      let remainingMs = elapsedMs;
      for (const sampledStroke of sampledDemoStrokes) {
        if (remainingMs <= 0) break;

        if (remainingMs < sampledStroke.durationMs) {
          drawPartialSampledStroke(
            drawCtx,
            sampledStroke,
            remainingMs / sampledStroke.durationMs,
          );
          break;
        }

        drawPartialSampledStroke(drawCtx, sampledStroke, 1);
        remainingMs -= sampledStroke.durationMs;

        if (remainingMs < sampledStroke.pauseAfterMs) {
          break;
        }

        remainingMs -= sampledStroke.pauseAfterMs;
      }

      drawCtx.shadowBlur = 0;
      drawCtx.shadowColor = "transparent";
    };

    let rafId = 0;
    let startTime = 0;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (sampledDemoStrokes.length > 0) {
        drawLetterStrokeFrame(elapsed);
      } else {
        drawGenericFallbackFrame(clamp01(elapsed / totalDemoDurationMs));
      }

      if (elapsed < totalDemoDurationMs) {
        rafId = window.requestAnimationFrame(tick);
        return;
      }

      if (!autoTraceDoneRef.current) {
        autoTraceDoneRef.current = true;
        onAutoTraceComplete?.();
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [
    guideGlyphConfig,
    guideFontSize,
    isDemoMode,
    lineWidth,
    normalizedTarget,
    onAutoTraceComplete,
    sampledDemoStrokes,
    tracingGridMetrics,
    totalDemoDurationMs,
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
      onEvaluate({ score: 0, stars: 0, precision: 0, coverage: 0 });
      return;
    }

    const drawCtx = canvas.getContext("2d");
    if (!drawCtx) {
      onEvaluate({ score: 0, stars: 0, precision: 0, coverage: 0 });
      return;
    }

    const targetCanvas = document.createElement("canvas");
    targetCanvas.width = canvas.width;
    targetCanvas.height = canvas.height;
    const targetCtx = targetCanvas.getContext("2d");
    if (!targetCtx) {
      onEvaluate({ score: 0, stars: 0, precision: 0, coverage: 0 });
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    targetCtx.scale(ratio, ratio);
    if (hasGuideGlyph) {
      drawGuideGlyph(
        targetCtx,
        normalizedTarget,
        tracingGridMetrics,
        guideFontSize,
        "#111111",
        getCanvasGuideFontFamily(),
        guideGlyphConfig,
        true,
      );
    } else if (sampledDemoStrokes.length > 0) {
      drawSampledStrokeGuide(
        targetCtx,
        sampledDemoStrokes,
        tracingGridMetrics,
        Math.max(7, lineWidth * 0.7),
        "#111111",
      );
    } else {
      drawGuideGlyph(
        targetCtx,
        normalizedTarget,
        tracingGridMetrics,
        guideFontSize,
        "#111111",
        getCanvasGuideFontFamily(),
      );
    }

    const drawnData = drawCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    ).data;
    const targetData = targetCtx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height,
    ).data;

    let drawnPixels = 0;
    let targetPixels = 0;
    let overlapPixels = 0;

    for (let i = 3; i < drawnData.length; i += 4) {
      const drawn = drawnData[i] > 24;
      const target = targetData[i] > 32;

      if (drawn) drawnPixels += 1;
      if (target) targetPixels += 1;
      if (drawn && target) overlapPixels += 1;
    }

    const coverage = targetPixels > 0 ? overlapPixels / targetPixels : 0;
    const precision = drawnPixels > 0 ? overlapPixels / drawnPixels : 0;
    const score = clamp01(coverage * 0.7 + precision * 0.3);
    const stars =
      score >= twoStarThreshold ? 2 : score >= oneStarThreshold ? 1 : 0;

    onEvaluate({ score, stars, precision, coverage });
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
        <WritingGridOverlay metrics={tracingGridMetrics} />
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
