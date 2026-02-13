"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getLetterStrokeAnimation,
  type TracingDemoAnimationConfig,
  type TracingGlyphConfig,
  type TracingStrokePath,
} from "@/data/tracing";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  buildCenterlineTrailsForComponent,
  buildClosedLoopPixelPathFromHint,
  buildComponentAdjacency,
  buildPathThroughAnchorsFromHint,
  createStrokeCandidateFromPixelPath,
  createTracingGridMetrics,
  extractConnectedComponents,
  filterAutoStrokeCandidates,
  getStrokePointDistance,
  getTrailStartOrderingValue,
  mapPauseAnchorsToPausePoints,
  mapSourcePointToCanvas,
  resolveAutoStrokeCandidates,
  resolveHintComponent,
  skeletonizeBinaryMask,
  SOURCE_CANVAS_SIZE,
  type DemoCanvasPoint,
  type GeneratedStrokeCandidate,
  type GlyphMaskConstraint,
  type SkeletonComponentModel,
  type TracingGridMetrics,
} from "@/lib/tracing-algorithm";

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

const LINE_WIDTH = 28;
const GENERIC_DEMO_DURATION_MS = 4200;
const DEFAULT_DEMO_PAUSE_MS = 800;
const DEFAULT_DEMO_STROKE_DURATION_MS = 1250;
const DEFAULT_STROKE_MASK_OVERLAP_PX = 1.25;
const GUIDE_STROKE_COLOR = "rgba(17, 24, 39, 0.16)";
const TRACE_STROKE_COLOR = "#111827";
const USER_STROKE_COLOR = "#0f172a";
const FILLED_STROKE_COLOR = "#0b0f1a";
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

interface AutoStrokeMaskSet {
  width: number;
  height: number;
  canvases: HTMLCanvasElement[];
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

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
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

function resolveGuideGlyphDrawModel(
  ctx: CanvasRenderingContext2D,
  targetText: string,
  metrics: TracingGridMetrics,
  guideFontSize: number,
  glyphConfig?: TracingGlyphConfig,
) {
  const text = targetText;
  const defaultGlyphFontFamily = '"HP001_4_hang_normal", "Mali", sans-serif';
  const fontFamily = glyphConfig?.fontFamily ?? defaultGlyphFontFamily;

  const sizeScale = glyphConfig?.sizeScale ?? 1;
  const fontSize = Math.max(12, Math.round(guideFontSize * sizeScale));

  ctx.font = `400 ${fontSize}px ${fontFamily}`;
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
    glyphConfig,
  );
  ctx.fillStyle = fillStyle;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 ${guideGlyph.fontSize}px ${guideGlyph.fontFamily}`;
  ctx.fillText(guideGlyph.text, guideGlyph.centerX, guideGlyph.baselineY);
}

function getDistanceSquaredToSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  if (deltaX === 0 && deltaY === 0) {
    const dx = pointX - startX;
    const dy = pointY - startY;
    return dx * dx + dy * dy;
  }

  const t = clamp01(
    ((pointX - startX) * deltaX + (pointY - startY) * deltaY) /
      (deltaX * deltaX + deltaY * deltaY),
  );
  const projectedX = startX + deltaX * t;
  const projectedY = startY + deltaY * t;
  const distanceX = pointX - projectedX;
  const distanceY = pointY - projectedY;
  return distanceX * distanceX + distanceY * distanceY;
}

function getMinDistanceSquaredToStrokePolyline(
  strokePolyline: DemoCanvasPoint[],
  x: number,
  y: number,
): number {
  if (strokePolyline.length === 0) return Number.POSITIVE_INFINITY;
  if (strokePolyline.length === 1) {
    const deltaX = x - strokePolyline[0].x;
    const deltaY = y - strokePolyline[0].y;
    return deltaX * deltaX + deltaY * deltaY;
  }

  let bestDistanceSquared = Number.POSITIVE_INFINITY;
  for (
    let segmentIndex = 1;
    segmentIndex < strokePolyline.length;
    segmentIndex += 1
  ) {
    const segmentStart = strokePolyline[segmentIndex - 1];
    const segmentEnd = strokePolyline[segmentIndex];
    const distanceSquared = getDistanceSquaredToSegment(
      x,
      y,
      segmentStart.x,
      segmentStart.y,
      segmentEnd.x,
      segmentEnd.y,
    );
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
    }
  }

  return bestDistanceSquared;
}

function createAutoStrokeMaskSet(
  strokes: TracingStrokePath[] | undefined,
  binaryGlyphMask: { mask: Uint8Array; width: number; height: number } | null,
  metrics: TracingGridMetrics,
): AutoStrokeMaskSet | null {
  if (
    typeof document === "undefined" ||
    !binaryGlyphMask ||
    !strokes ||
    strokes.length <= 1
  ) {
    return null;
  }

  const strokePolylines = strokes.map((stroke) =>
    stroke.points.map((point) => mapSourcePointToCanvas(point, metrics)),
  );
  if (strokePolylines.some((polyline) => polyline.length < 2)) return null;

  const { width, height, mask } = binaryGlyphMask;
  const assignments = strokePolylines.map(() => new Uint8Array(width * height));
  const strokeOverlapSquared = strokes.map((stroke) => {
    const overlapPx = stroke.maskOverlapPx ?? DEFAULT_STROKE_MASK_OVERLAP_PX;
    return overlapPx * overlapPx;
  });

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (mask[pixelIndex] !== 1) continue;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const distances = strokePolylines.map((polyline) =>
      getMinDistanceSquaredToStrokePolyline(polyline, x, y),
    );
    const nearestDistanceSquared = Math.min(...distances);

    for (let strokeIndex = 0; strokeIndex < distances.length; strokeIndex += 1) {
      const distanceSquared = distances[strokeIndex];
      if (distanceSquared <= nearestDistanceSquared + strokeOverlapSquared[strokeIndex]) {
        assignments[strokeIndex][pixelIndex] = 1;
      }
    }
  }

  assignments.forEach((assignment, strokeIndex) => {
    const assignedPixelCount = assignment.reduce(
      (sum, value) => sum + value,
      0,
    );
    if (assignedPixelCount > 0) return;
    assignments[strokeIndex] = new Uint8Array(mask);
  });

  const canvases = assignments.map((assignment) => {
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext("2d");
    if (!maskCtx) return null;

    const imageData = maskCtx.createImageData(width, height);
    for (let pixelIndex = 0; pixelIndex < assignment.length; pixelIndex += 1) {
      if (assignment[pixelIndex] !== 1) continue;
      const dataOffset = pixelIndex * 4;
      imageData.data[dataOffset] = 255;
      imageData.data[dataOffset + 1] = 255;
      imageData.data[dataOffset + 2] = 255;
      imageData.data[dataOffset + 3] = 255;
    }
    maskCtx.putImageData(imageData, 0, 0);
    return maskCanvas;
  });
  if (canvases.some((canvas) => canvas === null)) return null;

  return {
    width,
    height,
    canvases: canvases as HTMLCanvasElement[],
  };
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

    const segmentLengths = mappedPoints.slice(1).map((endPoint, index) =>
      getStrokePointDistance(mappedPoints[index], endPoint),
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


function createGlyphBinaryMask(
  targetText: string,
  metrics: TracingGridMetrics,
  guideFontSize: number,
  glyphConfig: TracingGlyphConfig | undefined,
): { mask: Uint8Array; width: number; height: number } | null {
  if (typeof document === "undefined") return null;

  const width = Math.max(1, Math.round(metrics.canvasWidth));
  const height = Math.max(1, Math.round(metrics.canvasHeight));
  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const offscreenCtx = offscreenCanvas.getContext("2d");
  if (!offscreenCtx) return null;

  drawGuideGlyph(
    offscreenCtx,
    targetText,
    metrics,
    guideFontSize,
    "#111111",
    glyphConfig,
    true,
  );

  const imageData = offscreenCtx.getImageData(0, 0, width, height).data;
  const mask = new Uint8Array(width * height);
  let nonEmptyPixels = 0;

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
    const alpha = imageData[pixelIndex * 4 + 3];
    if (alpha > 48) {
      mask[pixelIndex] = 1;
      nonEmptyPixels += 1;
    }
  }

  if (nonEmptyPixels === 0) return null;
  return { mask, width, height };
}


function generateAutoDemoConfigFromGlyph(
  targetText: string,
  metrics: TracingGridMetrics,
  guideFontSize: number,
  glyphConfig: TracingGlyphConfig | undefined,
  baseDemoConfig: TracingDemoAnimationConfig | undefined,
): TracingDemoAnimationConfig | null {
  const binaryGlyphMask = createGlyphBinaryMask(
    targetText,
    metrics,
    guideFontSize,
    glyphConfig,
  );
  if (!binaryGlyphMask) return null;

  const { width, height } = binaryGlyphMask;
  const skeletonMask = skeletonizeBinaryMask(binaryGlyphMask.mask, width, height);
  const components = extractConnectedComponents(skeletonMask, width, height, 8);
  if (components.length === 0) return null;

  const sortedComponents: SkeletonComponentModel[] = components
    .sort((leftComponent, rightComponent) => {
      const leftValue = Math.min(
        ...leftComponent.map((pixelIndex) =>
          getTrailStartOrderingValue(pixelIndex, width),
        ),
      );
      const rightValue = Math.min(
        ...rightComponent.map((pixelIndex) =>
          getTrailStartOrderingValue(pixelIndex, width),
        ),
      );
      return leftValue - rightValue;
    })
    .map((componentPixels, componentIndex) => ({
      componentId: componentIndex,
      pixels: componentPixels,
      adjacency: buildComponentAdjacency(componentPixels, width, height),
      trails: buildCenterlineTrailsForComponent(
        componentPixels,
        width,
        height,
        width * height,
      ),
    }));

  const maskConstraint: GlyphMaskConstraint = {
    mask: binaryGlyphMask.mask,
    width: binaryGlyphMask.width,
    height: binaryGlyphMask.height,
    metrics,
  };
  const strokeHints = baseDemoConfig?.auto?.strokeHints ?? [];

  const guidedCandidatesByHint: Array<GeneratedStrokeCandidate | null> =
    strokeHints.map((hint) => {
      const hintMode = hint.mode ?? "centerline";
      if (hintMode === "centerline") return null;

      const hintComponent = resolveHintComponent(
        hint,
        sortedComponents,
        maskConstraint,
      );
      if (!hintComponent) return null;

      const guidedPixelPath =
        hintMode === "closedLoop"
          ? buildClosedLoopPixelPathFromHint(hint, hintComponent, maskConstraint)
          : buildPathThroughAnchorsFromHint(hint, hintComponent, maskConstraint);
      if (!guidedPixelPath || guidedPixelPath.length < 2) return null;

      return createStrokeCandidateFromPixelPath(
        guidedPixelPath,
        width,
        metrics,
        hintComponent.componentId,
        hint,
      );
    });

  const guidedCandidates = guidedCandidatesByHint.filter(
    (candidate): candidate is GeneratedStrokeCandidate => candidate !== null,
  );

  const autoStrokeCandidates = sortedComponents.flatMap((component) =>
    component.trails
      .map((trail) =>
        createStrokeCandidateFromPixelPath(
          trail,
          width,
          metrics,
          component.componentId,
        ),
      )
      .filter(
        (candidate): candidate is GeneratedStrokeCandidate => candidate !== null,
      ),
  );

  const fallbackAutoStrokeCandidates =
    filterAutoStrokeCandidates(autoStrokeCandidates);
  const mergedAutoStrokeCandidates = filterAutoStrokeCandidates([
    ...guidedCandidates,
    ...fallbackAutoStrokeCandidates,
  ]);
  if (mergedAutoStrokeCandidates.length === 0) return null;

  const hasGuidedForEveryHint =
    strokeHints.length > 0 &&
    guidedCandidatesByHint.length === strokeHints.length &&
    guidedCandidatesByHint.every((candidate) => candidate !== null);
  const resolvedAutoStrokes = hasGuidedForEveryHint
    ? (guidedCandidatesByHint as GeneratedStrokeCandidate[])
    : resolveAutoStrokeCandidates(
        targetText,
        mergedAutoStrokeCandidates,
        baseDemoConfig?.auto,
        maskConstraint,
      );
  if (resolvedAutoStrokes.length === 0) return null;

  const defaultStrokeDurationMs =
    baseDemoConfig?.strokeDurationMs ?? DEFAULT_DEMO_STROKE_DURATION_MS;
  const pathLengths = resolvedAutoStrokes.map((stroke) => stroke.length);
  const totalLength = pathLengths.reduce((sum, value) => sum + value, 0);
  const totalDurationBudget = Math.max(
    defaultStrokeDurationMs,
    defaultStrokeDurationMs * resolvedAutoStrokes.length,
  );

  const strokes = resolvedAutoStrokes.map((stroke, strokeIndex) => {
    const proportionalDuration =
      totalLength > 0
        ? (pathLengths[strokeIndex] / totalLength) * totalDurationBudget
        : defaultStrokeDurationMs;

    const pausePoints = mapPauseAnchorsToPausePoints(stroke.points, stroke.hint);

    return {
      points: stroke.points,
      durationMs:
        stroke.hint?.durationMs ?? Math.max(260, Math.round(proportionalDuration)),
      pauseBeforeMs: stroke.hint?.pauseBeforeMs,
      pauseAfterMs: stroke.hint?.pauseAfterMs,
      pausePoints,
      maskOverlapPx: stroke.hint?.maskOverlapPx,
    };
  });

  return {
    strategy: "auto",
    pauseMs: baseDemoConfig?.pauseMs ?? DEFAULT_DEMO_PAUSE_MS,
    strokeDurationMs: defaultStrokeDurationMs,
    strokes,
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
        x: segment.start.x + (segment.end.x - segment.start.x) * segmentProgress,
        y: segment.start.y + (segment.end.y - segment.start.y) * segmentProgress,
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
  const traceTargetText = normalizedTarget || "a";
  const letterStrokeAnimation = useMemo(
    () => getLetterStrokeAnimation(traceTargetText),
    [traceTargetText],
  );
  const traceDisplayText = letterStrokeAnimation?.letter ?? traceTargetText;
  const tracingGridMetrics = useMemo(
    () => createTracingGridMetrics(letterStrokeAnimation?.layout),
    [letterStrokeAnimation],
  );
  const guideFontSize = useMemo(
    () => getGuideFontSize(traceDisplayText, tracingGridMetrics),
    [traceDisplayText, tracingGridMetrics],
  );
  const lineWidth = useMemo(
    () => getTraceLineWidth(traceDisplayText),
    [traceDisplayText],
  );
  const traceDemoConfig = letterStrokeAnimation?.demo;
  const traceDemoStrategy = traceDemoConfig?.strategy ?? "auto";
  const isSingleLetterTarget = useMemo(
    () => [...traceDisplayText].length === 1,
    [traceDisplayText],
  );
  const guideGlyphConfig = useMemo<TracingGlyphConfig | undefined>(() => {
    if (isSingleLetterTarget) {
      return {
        ...DEFAULT_SINGLE_LETTER_GLYPH,
        ...letterStrokeAnimation?.glyph,
      };
    }
    return letterStrokeAnimation?.glyph;
  }, [isSingleLetterTarget, letterStrokeAnimation]);

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
          : autoGeneratedDemoConfig ?? undefined;
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
    drawGuideGlyph(
      targetCtx,
      traceDisplayText,
      tracingGridMetrics,
      guideFontSize,
      "#111111",
      guideGlyphConfig,
      true,
    );

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
