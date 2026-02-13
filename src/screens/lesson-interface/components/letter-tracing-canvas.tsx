"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getLetterStrokeAnimation,
  type TracingAutoDemoConfig,
  type TracingAutoStrokeHint,
  type TracingDemoAnimationConfig,
  type TracingGlyphConfig,
  type TracingPausePoint,
  type TracingStrokePath,
  type TracingStrokePoint,
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

const SOURCE_CANVAS_SIZE = 280;
const LINE_WIDTH = 28;
const GENERIC_DEMO_DURATION_MS = 4200;
const DEFAULT_DEMO_PAUSE_MS = 800;
const DEFAULT_DEMO_STROKE_DURATION_MS = 1250;
const DEFAULT_WRITING_GRID_MARGIN = 8;
// Mặc định lưới ngang 3 ô, dọc 4 ô; một số từ ghép sẽ ghi đè (ví dụ "cá" dùng 4 ô ngang).
const DEFAULT_WRITING_GRID_COLUMNS = 3;
const DEFAULT_WRITING_GRID_ROWS = 4;
const DEFAULT_WRITING_GRID_CELL_SIZE = 70;
const GUIDE_STROKE_COLOR = "rgba(17, 24, 39, 0.16)";
const TRACE_STROKE_COLOR = "#111827";
const USER_STROKE_COLOR = "#0f172a";
const FILLED_STROKE_COLOR = "#0b0f1a";
const DEFAULT_SINGLE_LETTER_GLYPH: TracingGlyphConfig = {
  x: 30,
  y: 136,
  sizeScale: 2,
};

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

interface DemoCanvasPoint {
  x: number;
  y: number;
}

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

interface GeneratedStrokeCandidate {
  points: TracingStrokePoint[];
  length: number;
  orderValue: number;
  componentId: number;
  hint?: TracingAutoStrokeHint;
}

const EIGHT_NEIGHBOR_OFFSETS: Array<[number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];
const MAX_SAFE_MERGE_CONNECTOR_DISTANCE = 16;
const SMOOTHING_PASSES = 1;
const MIN_POINT_SPACING = 3;
const DEFAULT_STROKE_MASK_OVERLAP_PX = 1.25;

interface GlyphMaskConstraint {
  mask: Uint8Array;
  width: number;
  height: number;
  metrics: TracingGridMetrics;
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

function mapSourcePointToCanvas(
  point: DemoCanvasPoint,
  metrics: TracingGridMetrics,
): DemoCanvasPoint {
  return {
    x: metrics.margin + (point.x / SOURCE_CANVAS_SIZE) * metrics.drawAreaWidth,
    y: metrics.margin + (point.y / SOURCE_CANVAS_SIZE) * metrics.drawAreaHeight,
  };
}

function getDistanceBetweenPoints(
  start: DemoCanvasPoint,
  end: DemoCanvasPoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
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

function makePixelEdgeKey(
  pixelA: number,
  pixelB: number,
  totalPixels: number,
): number {
  const lower = pixelA < pixelB ? pixelA : pixelB;
  const higher = pixelA < pixelB ? pixelB : pixelA;
  return lower * totalPixels + higher;
}

function getStrokePointDistance(
  start: TracingStrokePoint,
  end: TracingStrokePoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function mapCanvasPointToSource(
  point: DemoCanvasPoint,
  metrics: TracingGridMetrics,
): TracingStrokePoint {
  const normalizedX = clamp01(
    (point.x - metrics.margin) / metrics.drawAreaWidth,
  );
  const normalizedY = clamp01(
    (point.y - metrics.margin) / metrics.drawAreaHeight,
  );
  return {
    x: normalizedX * SOURCE_CANVAS_SIZE,
    y: normalizedY * SOURCE_CANVAS_SIZE,
  };
}

function readBinaryMaskPixel(
  mask: Uint8Array,
  width: number,
  x: number,
  y: number,
): 0 | 1 {
  return mask[y * width + x] === 1 ? 1 : 0;
}

function mapSourcePointToMaskPixel(
  point: TracingStrokePoint,
  constraint: GlyphMaskConstraint,
): { x: number; y: number } {
  const { metrics, width, height } = constraint;
  const mappedX = Math.round(
    metrics.margin + (point.x / SOURCE_CANVAS_SIZE) * metrics.drawAreaWidth,
  );
  const mappedY = Math.round(
    metrics.margin + (point.y / SOURCE_CANVAS_SIZE) * metrics.drawAreaHeight,
  );
  return {
    x: Math.max(0, Math.min(width - 1, mappedX)),
    y: Math.max(0, Math.min(height - 1, mappedY)),
  };
}

function isMaskFilledNear(
  mask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const sampleX = x + offsetX;
      const sampleY = y + offsetY;
      if (
        sampleX < 0 ||
        sampleY < 0 ||
        sampleX >= width ||
        sampleY >= height
      ) {
        continue;
      }
      if (mask[sampleY * width + sampleX] === 1) {
        return true;
      }
    }
  }
  return false;
}

function isConnectorInsideGlyphMask(
  startPoint: TracingStrokePoint,
  endPoint: TracingStrokePoint,
  constraint: GlyphMaskConstraint | undefined,
): boolean {
  if (!constraint) return false;

  const startMaskPoint = mapSourcePointToMaskPixel(startPoint, constraint);
  const endMaskPoint = mapSourcePointToMaskPixel(endPoint, constraint);
  const deltaX = endMaskPoint.x - startMaskPoint.x;
  const deltaY = endMaskPoint.y - startMaskPoint.y;
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  if (steps === 0) return true;

  let filledSamples = 0;
  for (let stepIndex = 0; stepIndex <= steps; stepIndex += 1) {
    const sampleX = Math.round(startMaskPoint.x + (deltaX * stepIndex) / steps);
    const sampleY = Math.round(startMaskPoint.y + (deltaY * stepIndex) / steps);
    if (
      isMaskFilledNear(
        constraint.mask,
        constraint.width,
        constraint.height,
        sampleX,
        sampleY,
      )
    ) {
      filledSamples += 1;
    }
  }

  return filledSamples / (steps + 1) >= 0.92;
}

function zhangSuenTransitionCount(
  p2: 0 | 1,
  p3: 0 | 1,
  p4: 0 | 1,
  p5: 0 | 1,
  p6: 0 | 1,
  p7: 0 | 1,
  p8: 0 | 1,
  p9: 0 | 1,
): number {
  const sequence: Array<0 | 1> = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
  let transitions = 0;
  for (let index = 0; index < 8; index += 1) {
    if (sequence[index] === 0 && sequence[index + 1] === 1) {
      transitions += 1;
    }
  }
  return transitions;
}

function skeletonizeBinaryMask(
  inputMask: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const mask = new Uint8Array(inputMask);
  let didChange = true;
  let iterations = 0;
  const maxIterations = 80;

  while (didChange && iterations < maxIterations) {
    didChange = false;
    iterations += 1;

    const pixelsToDeletePass1: number[] = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x;
        if (mask[pixelIndex] !== 1) continue;

        const p2 = readBinaryMaskPixel(mask, width, x, y - 1);
        const p3 = readBinaryMaskPixel(mask, width, x + 1, y - 1);
        const p4 = readBinaryMaskPixel(mask, width, x + 1, y);
        const p5 = readBinaryMaskPixel(mask, width, x + 1, y + 1);
        const p6 = readBinaryMaskPixel(mask, width, x, y + 1);
        const p7 = readBinaryMaskPixel(mask, width, x - 1, y + 1);
        const p8 = readBinaryMaskPixel(mask, width, x - 1, y);
        const p9 = readBinaryMaskPixel(mask, width, x - 1, y - 1);

        const neighborCount = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (neighborCount < 2 || neighborCount > 6) continue;
        if (zhangSuenTransitionCount(p2, p3, p4, p5, p6, p7, p8, p9) !== 1) {
          continue;
        }
        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;

        pixelsToDeletePass1.push(pixelIndex);
      }
    }

    if (pixelsToDeletePass1.length > 0) {
      didChange = true;
      pixelsToDeletePass1.forEach((pixelIndex) => {
        mask[pixelIndex] = 0;
      });
    }

    const pixelsToDeletePass2: number[] = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x;
        if (mask[pixelIndex] !== 1) continue;

        const p2 = readBinaryMaskPixel(mask, width, x, y - 1);
        const p3 = readBinaryMaskPixel(mask, width, x + 1, y - 1);
        const p4 = readBinaryMaskPixel(mask, width, x + 1, y);
        const p5 = readBinaryMaskPixel(mask, width, x + 1, y + 1);
        const p6 = readBinaryMaskPixel(mask, width, x, y + 1);
        const p7 = readBinaryMaskPixel(mask, width, x - 1, y + 1);
        const p8 = readBinaryMaskPixel(mask, width, x - 1, y);
        const p9 = readBinaryMaskPixel(mask, width, x - 1, y - 1);

        const neighborCount = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (neighborCount < 2 || neighborCount > 6) continue;
        if (zhangSuenTransitionCount(p2, p3, p4, p5, p6, p7, p8, p9) !== 1) {
          continue;
        }
        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;

        pixelsToDeletePass2.push(pixelIndex);
      }
    }

    if (pixelsToDeletePass2.length > 0) {
      didChange = true;
      pixelsToDeletePass2.forEach((pixelIndex) => {
        mask[pixelIndex] = 0;
      });
    }
  }

  return mask;
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

function extractConnectedComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  minPixels: number = 10,
): number[][] {
  const visited = new Uint8Array(mask.length);
  const components: number[][] = [];

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (mask[pixelIndex] !== 1 || visited[pixelIndex] === 1) continue;

    const queue: number[] = [pixelIndex];
    const componentPixels: number[] = [];
    visited[pixelIndex] = 1;

    while (queue.length > 0) {
      const currentPixel = queue.shift();
      if (currentPixel === undefined) break;
      componentPixels.push(currentPixel);

      const currentX = currentPixel % width;
      const currentY = Math.floor(currentPixel / width);

      for (const [offsetX, offsetY] of EIGHT_NEIGHBOR_OFFSETS) {
        const nextX = currentX + offsetX;
        const nextY = currentY + offsetY;
        if (
          nextX < 0 ||
          nextY < 0 ||
          nextX >= width ||
          nextY >= height
        ) {
          continue;
        }
        const nextPixel = nextY * width + nextX;
        if (mask[nextPixel] !== 1 || visited[nextPixel] === 1) continue;
        visited[nextPixel] = 1;
        queue.push(nextPixel);
      }
    }

    if (componentPixels.length >= minPixels) {
      components.push(componentPixels);
    }
  }

  return components;
}

function getTrailStartOrderingValue(pixelIndex: number, width: number): number {
  const x = pixelIndex % width;
  const y = Math.floor(pixelIndex / width);
  return y * 10000 + x;
}

function buildComponentAdjacency(
  componentPixels: number[],
  width: number,
  height: number,
): Map<number, number[]> {
  const componentPixelSet = new Set(componentPixels);
  const adjacency = new Map<number, number[]>();

  componentPixels.forEach((pixelIndex) => {
    const pixelX = pixelIndex % width;
    const pixelY = Math.floor(pixelIndex / width);
    const neighbors: number[] = [];

    EIGHT_NEIGHBOR_OFFSETS.forEach(([offsetX, offsetY]) => {
      const neighborX = pixelX + offsetX;
      const neighborY = pixelY + offsetY;
      if (
        neighborX < 0 ||
        neighborY < 0 ||
        neighborX >= width ||
        neighborY >= height
      ) {
        return;
      }
      const neighborIndex = neighborY * width + neighborX;
      if (!componentPixelSet.has(neighborIndex)) return;
      neighbors.push(neighborIndex);
    });

    neighbors.sort(
      (leftPixel, rightPixel) =>
        getTrailStartOrderingValue(leftPixel, width) -
        getTrailStartOrderingValue(rightPixel, width),
    );
    adjacency.set(pixelIndex, neighbors);
  });

  return adjacency;
}

function findNearestComponentPixel(
  componentPixels: number[],
  width: number,
  targetX: number,
  targetY: number,
): number | null {
  if (componentPixels.length === 0) return null;

  let nearestPixel = componentPixels[0];
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;

  componentPixels.forEach((pixelIndex) => {
    const pixelX = pixelIndex % width;
    const pixelY = Math.floor(pixelIndex / width);
    const deltaX = pixelX - targetX;
    const deltaY = pixelY - targetY;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestPixel = pixelIndex;
    }
  });

  return nearestPixel;
}

function findShortestPixelPath(
  adjacency: Map<number, number[]>,
  startPixel: number,
  endPixel: number,
  blockedPixel?: number,
): number[] | null {
  if (startPixel === endPixel) return [startPixel];
  if (blockedPixel !== undefined) {
    if (startPixel === blockedPixel || endPixel === blockedPixel) return null;
  }

  const queue: number[] = [startPixel];
  const visited = new Set<number>([startPixel]);
  const parentByPixel = new Map<number, number>();
  let queueCursor = 0;

  while (queueCursor < queue.length) {
    const currentPixel = queue[queueCursor];
    queueCursor += 1;

    const neighbors = adjacency.get(currentPixel) ?? [];
    for (const neighborPixel of neighbors) {
      if (neighborPixel === blockedPixel) continue;
      if (visited.has(neighborPixel)) continue;

      visited.add(neighborPixel);
      parentByPixel.set(neighborPixel, currentPixel);

      if (neighborPixel === endPixel) {
        const reversedPath: number[] = [endPixel];
        let walkerPixel = endPixel;

        while (walkerPixel !== startPixel) {
          const parentPixel = parentByPixel.get(walkerPixel);
          if (parentPixel === undefined) return null;
          reversedPath.push(parentPixel);
          walkerPixel = parentPixel;
        }

        return reversedPath.reverse();
      }

      queue.push(neighborPixel);
    }
  }

  return null;
}

function pathMatchesInitialDirection(
  pixelPath: number[],
  width: number,
  initialDirection: TracingAutoStrokeHint["initialDirection"],
): boolean {
  if (!initialDirection || pixelPath.length < 2) return true;

  const firstPixel = pixelPath[0];
  const secondPixel = pixelPath[1];
  const deltaX = (secondPixel % width) - (firstPixel % width);
  const deltaY =
    Math.floor(secondPixel / width) - Math.floor(firstPixel / width);

  if (initialDirection === "left") return deltaX < 0;
  if (initialDirection === "right") return deltaX > 0;
  if (initialDirection === "up") return deltaY < 0;
  if (initialDirection === "down") return deltaY > 0;

  return true;
}

function orientPixelPathByInitialDirection(
  pixelPath: number[],
  width: number,
  initialDirection: TracingAutoStrokeHint["initialDirection"],
): number[] {
  if (pixelPath.length < 2 || !initialDirection) return pixelPath;
  if (pathMatchesInitialDirection(pixelPath, width, initialDirection)) {
    return pixelPath;
  }
  return [...pixelPath].reverse();
}

function orientClosedPixelPathByInitialDirection(
  pixelPath: number[],
  width: number,
  initialDirection: TracingAutoStrokeHint["initialDirection"],
): number[] {
  if (pixelPath.length < 4 || !initialDirection) return pixelPath;
  if (pathMatchesInitialDirection(pixelPath, width, initialDirection)) {
    return pixelPath;
  }

  const loopBody = pixelPath.slice(1, -1);
  const reversedLoop = [pixelPath[0], ...loopBody.reverse(), pixelPath[0]];
  return reversedLoop;
}

function mapPathAnchorsToMaskPixels(
  anchors: TracingStrokePoint[] | undefined,
  constraint: GlyphMaskConstraint,
): Array<{ x: number; y: number }> {
  if (!anchors || anchors.length === 0) return [];
  return anchors.map((anchorPoint) =>
    mapSourcePointToMaskPixel(anchorPoint, constraint),
  );
}

function scorePixelPathAgainstAnchors(
  pixelPath: number[],
  width: number,
  anchors: Array<{ x: number; y: number }>,
): number {
  if (anchors.length === 0 || pixelPath.length === 0) return 0;

  const pathPoints = pixelPath.map((pixelIndex) => ({
    x: pixelIndex % width,
    y: Math.floor(pixelIndex / width),
  }));
  let score = 0;
  let lastNearestIndex = -1;

  anchors.forEach((anchorPoint) => {
    let nearestIndex = 0;
    let bestDistanceSquared = Number.POSITIVE_INFINITY;

    pathPoints.forEach((pathPoint, pointIndex) => {
      const deltaX = pathPoint.x - anchorPoint.x;
      const deltaY = pathPoint.y - anchorPoint.y;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        nearestIndex = pointIndex;
      }
    });

    score += Math.sqrt(bestDistanceSquared);
    if (nearestIndex < lastNearestIndex) {
      score += (lastNearestIndex - nearestIndex) * 6;
    }
    lastNearestIndex = Math.max(lastNearestIndex, nearestIndex);
  });

  return score;
}

function createStrokeCandidateFromPixelPath(
  pixelPath: number[],
  width: number,
  metrics: TracingGridMetrics,
  componentId: number,
  hint?: TracingAutoStrokeHint,
): GeneratedStrokeCandidate | null {
  const sourcePoints = simplifyTrailToSourcePoints(pixelPath, width, metrics);
  if (sourcePoints.length < 2) return null;
  const adjustedPoints = [...sourcePoints];
  if (hint?.start) {
    adjustedPoints[0] = { ...hint.start };
  }
  if (hint?.end) {
    adjustedPoints[adjustedPoints.length - 1] = { ...hint.end };
  }
  return createStrokeCandidate(adjustedPoints, componentId, hint);
}

interface SkeletonComponentModel {
  componentId: number;
  pixels: number[];
  adjacency: Map<number, number[]>;
  trails: number[][];
}

function resolveHintComponent(
  hint: TracingAutoStrokeHint,
  components: SkeletonComponentModel[],
  constraint: GlyphMaskConstraint,
): SkeletonComponentModel | null {
  if (components.length === 0) return null;

  if (hint.componentIndex !== undefined) {
    const hintedComponent = components[hint.componentIndex];
    if (hintedComponent) return hintedComponent;
  }

  const referencePoint =
    hint.start ?? hint.pathAnchors?.[0] ?? hint.pauseAnchors?.[0]?.point ?? hint.end ?? null;
  if (!referencePoint) return components[0];

  const maskPoint = mapSourcePointToMaskPixel(referencePoint, constraint);
  let bestComponent = components[0];
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  components.forEach((component) => {
    const nearestPixel = findNearestComponentPixel(
      component.pixels,
      constraint.width,
      maskPoint.x,
      maskPoint.y,
    );
    if (nearestPixel === null) return;

    const nearestX = nearestPixel % constraint.width;
    const nearestY = Math.floor(nearestPixel / constraint.width);
    const deltaX = nearestX - maskPoint.x;
    const deltaY = nearestY - maskPoint.y;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestComponent = component;
    }
  });

  return bestComponent;
}

function buildClosedLoopPixelPathFromHint(
  hint: TracingAutoStrokeHint,
  component: SkeletonComponentModel,
  constraint: GlyphMaskConstraint,
): number[] | null {
  if (!hint.start) return null;

  const startMaskPoint = mapSourcePointToMaskPixel(hint.start, constraint);
  const startPixel = findNearestComponentPixel(
    component.pixels,
    constraint.width,
    startMaskPoint.x,
    startMaskPoint.y,
  );
  if (startPixel === null) return null;

  const startNeighbors = component.adjacency.get(startPixel) ?? [];
  if (startNeighbors.length < 2) return null;

  const anchorMaskPoints = mapPathAnchorsToMaskPixels(hint.pathAnchors, constraint);
  let bestCyclePath: number[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let leftIndex = 0; leftIndex < startNeighbors.length - 1; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < startNeighbors.length;
      rightIndex += 1
    ) {
      const leftNeighbor = startNeighbors[leftIndex];
      const rightNeighbor = startNeighbors[rightIndex];
      const connectingPath = findShortestPixelPath(
        component.adjacency,
        leftNeighbor,
        rightNeighbor,
        startPixel,
      );
      if (!connectingPath || connectingPath.length < 2) continue;

      const cyclePath = [startPixel, ...connectingPath, startPixel];
      const clockwisePath = orientClosedPixelPathByInitialDirection(
        cyclePath,
        constraint.width,
        hint.initialDirection,
      );
      const counterClockwisePath = [
        cyclePath[0],
        ...cyclePath.slice(1, -1).reverse(),
        cyclePath[0],
      ];

      [clockwisePath, counterClockwisePath].forEach((candidatePath) => {
        const anchorScore = scorePixelPathAgainstAnchors(
          candidatePath,
          constraint.width,
          anchorMaskPoints,
        );
        const directionPenalty = pathMatchesInitialDirection(
          candidatePath,
          constraint.width,
          hint.initialDirection,
        )
          ? 0
          : 12;
        const lengthPenalty =
          anchorMaskPoints.length > 0 ? candidatePath.length * 0.045 : -candidatePath.length;
        const totalScore = anchorScore + directionPenalty + lengthPenalty;
        if (totalScore < bestScore) {
          bestScore = totalScore;
          bestCyclePath = candidatePath;
        }
      });
    }
  }

  if (!bestCyclePath) return null;
  return bestCyclePath;
}

function buildPathThroughAnchorsFromHint(
  hint: TracingAutoStrokeHint,
  component: SkeletonComponentModel,
  constraint: GlyphMaskConstraint,
): number[] | null {
  const waypoints: TracingStrokePoint[] = [];
  if (hint.start) waypoints.push(hint.start);
  const pathAnchors =
    hint.pathAnchors && hint.pathAnchors.length > 0
      ? hint.pathAnchors
      : hint.pauseAnchors?.map((pauseAnchor) => pauseAnchor.point) ?? [];
  pathAnchors.forEach((anchorPoint) => {
    waypoints.push(anchorPoint);
  });
  if (hint.end) waypoints.push(hint.end);
  if (waypoints.length < 2) return null;

  const waypointPixels = waypoints
    .map((waypoint) => {
      const maskPoint = mapSourcePointToMaskPixel(waypoint, constraint);
      return findNearestComponentPixel(
        component.pixels,
        constraint.width,
        maskPoint.x,
        maskPoint.y,
      );
    })
    .filter((pixelIndex): pixelIndex is number => pixelIndex !== null);
  if (waypointPixels.length < 2) return null;

  const dedupedWaypointPixels = waypointPixels.filter(
    (pixelIndex, waypointIndex) =>
      waypointIndex === 0 || pixelIndex !== waypointPixels[waypointIndex - 1],
  );
  if (dedupedWaypointPixels.length < 2) return null;

  const mergedPath: number[] = [];
  for (
    let waypointIndex = 0;
    waypointIndex < dedupedWaypointPixels.length - 1;
    waypointIndex += 1
  ) {
    const startPixel = dedupedWaypointPixels[waypointIndex];
    const endPixel = dedupedWaypointPixels[waypointIndex + 1];
    const segmentPath = findShortestPixelPath(
      component.adjacency,
      startPixel,
      endPixel,
    );
    if (!segmentPath || segmentPath.length < 1) return null;
    if (segmentPath.length === 1 && startPixel !== endPixel) return null;

    if (mergedPath.length === 0) {
      mergedPath.push(...segmentPath);
      continue;
    }

    mergedPath.push(...segmentPath.slice(1));
  }

  return orientPixelPathByInitialDirection(
    mergedPath,
    constraint.width,
    hint.initialDirection,
  );
}

function buildCenterlineTrailsForComponent(
  componentPixels: number[],
  width: number,
  height: number,
  totalPixels: number,
): number[][] {
  const adjacency = buildComponentAdjacency(componentPixels, width, height);
  const visitedEdges = new Set<number>();

  const trails: number[][] = [];
  const isVisited = (pixelA: number, pixelB: number): boolean =>
    visitedEdges.has(makePixelEdgeKey(pixelA, pixelB, totalPixels));
  const markVisited = (pixelA: number, pixelB: number) => {
    visitedEdges.add(makePixelEdgeKey(pixelA, pixelB, totalPixels));
  };
  const appendTrail = (trail: number[]) => {
    if (trail.length > 1) {
      trails.push(trail);
    }
  };
  const walkTrailFromEdge = (startPixel: number, nextPixel: number): number[] => {
    const trail = [startPixel, nextPixel];
    markVisited(startPixel, nextPixel);

    let previousPixel = startPixel;
    let currentPixel = nextPixel;

    while (true) {
      const neighbors = adjacency.get(currentPixel) ?? [];
      const nextUnvisitedPixel = neighbors.find(
        (neighborPixel) =>
          neighborPixel !== previousPixel &&
          !isVisited(currentPixel, neighborPixel),
      );
      if (nextUnvisitedPixel === undefined) {
        break;
      }
      trail.push(nextUnvisitedPixel);
      markVisited(currentPixel, nextUnvisitedPixel);

      previousPixel = currentPixel;
      currentPixel = nextUnvisitedPixel;
      const currentDegree = (adjacency.get(currentPixel) ?? []).length;
      if (currentDegree !== 2) {
        break;
      }
    }

    return trail;
  };

  const keyNodes = componentPixels
    .filter((pixelIndex) => (adjacency.get(pixelIndex)?.length ?? 0) !== 2)
    .sort(
      (leftPixel, rightPixel) =>
        getTrailStartOrderingValue(leftPixel, width) -
        getTrailStartOrderingValue(rightPixel, width),
    );

  keyNodes.forEach((keyPixel) => {
    const neighbors = adjacency.get(keyPixel) ?? [];
    neighbors.forEach((neighborPixel) => {
      if (isVisited(keyPixel, neighborPixel)) return;
      appendTrail(walkTrailFromEdge(keyPixel, neighborPixel));
    });
  });

  componentPixels.forEach((pixelIndex) => {
    const neighbors = adjacency.get(pixelIndex) ?? [];
    neighbors.forEach((neighborPixel) => {
      if (isVisited(pixelIndex, neighborPixel)) return;
      appendTrail(walkTrailFromEdge(pixelIndex, neighborPixel));
    });
  });

  return trails;
}

function smoothCanvasPolylineWithChaikin(
  points: DemoCanvasPoint[],
  iterations: number = 2,
): DemoCanvasPoint[] {
  if (points.length < 3 || iterations <= 0) return points;

  let working = points.map((point) => ({ ...point }));
  for (let iterationIndex = 0; iterationIndex < iterations; iterationIndex += 1) {
    if (working.length < 3) break;
    const smoothed: DemoCanvasPoint[] = [working[0]];
    for (let pointIndex = 0; pointIndex < working.length - 1; pointIndex += 1) {
      const currentPoint = working[pointIndex];
      const nextPoint = working[pointIndex + 1];
      const qPoint: DemoCanvasPoint = {
        x: currentPoint.x * 0.75 + nextPoint.x * 0.25,
        y: currentPoint.y * 0.75 + nextPoint.y * 0.25,
      };
      const rPoint: DemoCanvasPoint = {
        x: currentPoint.x * 0.25 + nextPoint.x * 0.75,
        y: currentPoint.y * 0.25 + nextPoint.y * 0.75,
      };
      smoothed.push(qPoint, rPoint);
    }
    smoothed.push(working[working.length - 1]);
    working = smoothed;
  }

  return working;
}

function resampleCanvasPointsByMinDistance(
  points: DemoCanvasPoint[],
  minDistance: number,
): DemoCanvasPoint[] {
  if (points.length < 2) return points;
  const minDistanceSquared = minDistance * minDistance;
  const sampled: DemoCanvasPoint[] = [points[0]];
  let lastKept = points[0];

  for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
    const currentPoint = points[pointIndex];
    const deltaX = currentPoint.x - lastKept.x;
    const deltaY = currentPoint.y - lastKept.y;
    if (deltaX * deltaX + deltaY * deltaY < minDistanceSquared) continue;
    sampled.push(currentPoint);
    lastKept = currentPoint;
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}

function simplifyTrailToSourcePoints(
  trail: number[],
  width: number,
  metrics: TracingGridMetrics,
): TracingStrokePoint[] {
  const canvasPoints = trail.map((pixelIndex) => ({
    x: pixelIndex % width,
    y: Math.floor(pixelIndex / width),
  }));

  if (canvasPoints.length < 2) return [];

  const sampledCanvasPoints = resampleCanvasPointsByMinDistance(canvasPoints, 1.2);
  const smoothedCanvasPoints = smoothCanvasPolylineWithChaikin(
    sampledCanvasPoints,
    2,
  );
  const simplifiedCanvasPoints = resampleCanvasPointsByMinDistance(
    smoothedCanvasPoints,
    1.75,
  );

  const sourcePoints: TracingStrokePoint[] = [];
  simplifiedCanvasPoints.forEach((point) => {
    const sourcePoint = mapCanvasPointToSource(point, metrics);
    const previousPoint = sourcePoints[sourcePoints.length - 1];
    if (
      previousPoint &&
      getStrokePointDistance(previousPoint, sourcePoint) < 0.35
    ) {
      return;
    }
    sourcePoints.push(sourcePoint);
  });

  if (sourcePoints.length < 2) return [];
  return sourcePoints;
}

function getStrokePathLength(points: TracingStrokePoint[]): number {
  if (points.length < 2) return 0;
  let pathLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    pathLength += getStrokePointDistance(points[index - 1], points[index]);
  }
  return pathLength;
}

function getStrokeOrderingValue(points: TracingStrokePoint[]): number {
  if (points.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...points.map((point) => point.y * 10000 + point.x));
}

function dedupeConsecutiveStrokePoints(
  points: TracingStrokePoint[],
): TracingStrokePoint[] {
  if (points.length <= 1) return points;
  const deduped: TracingStrokePoint[] = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const currentPoint = points[index];
    const previousPoint = deduped[deduped.length - 1];
    if (currentPoint.x === previousPoint.x && currentPoint.y === previousPoint.y) {
      continue;
    }
    deduped.push(currentPoint);
  }
  return deduped;
}

function smoothStrokePoints(
  points: TracingStrokePoint[],
  passes: number = SMOOTHING_PASSES,
): TracingStrokePoint[] {
  if (points.length < 3 || passes <= 0) return points;

  let working = points.map((point) => ({ ...point }));
  for (let passIndex = 0; passIndex < passes; passIndex += 1) {
    const smoothed = working.map((point) => ({ ...point }));
    for (let pointIndex = 1; pointIndex < working.length - 1; pointIndex += 1) {
      const previousPoint = working[pointIndex - 1];
      const currentPoint = working[pointIndex];
      const nextPoint = working[pointIndex + 1];
      smoothed[pointIndex] = {
        x: (previousPoint.x + currentPoint.x * 2 + nextPoint.x) / 4,
        y: (previousPoint.y + currentPoint.y * 2 + nextPoint.y) / 4,
      };
    }
    working = smoothed;
  }

  return working;
}

function reduceStrokePointDensity(
  points: TracingStrokePoint[],
  minSpacing: number = MIN_POINT_SPACING,
): TracingStrokePoint[] {
  if (points.length < 3) return points;

  const reduced: TracingStrokePoint[] = [points[0]];
  let lastKeptPoint = points[0];

  for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
    const currentPoint = points[pointIndex];
    if (getStrokePointDistance(lastKeptPoint, currentPoint) < minSpacing) {
      continue;
    }
    reduced.push(currentPoint);
    lastKeptPoint = currentPoint;
  }

  reduced.push(points[points.length - 1]);
  return reduced;
}

function createStrokeCandidate(
  points: TracingStrokePoint[],
  componentId: number,
  hint?: TracingAutoStrokeHint,
): GeneratedStrokeCandidate {
  const dedupedPoints = dedupeConsecutiveStrokePoints(points);
  const smoothedPoints = smoothStrokePoints(dedupedPoints);
  const reducedPoints = reduceStrokePointDensity(smoothedPoints);
  const normalizedPoints = dedupeConsecutiveStrokePoints(reducedPoints);
  return {
    points: normalizedPoints,
    length: getStrokePathLength(normalizedPoints),
    orderValue: getStrokeOrderingValue(normalizedPoints),
    componentId,
    hint,
  };
}

function filterAutoStrokeCandidates(
  candidates: GeneratedStrokeCandidate[],
): GeneratedStrokeCandidate[] {
  if (candidates.length <= 1) return candidates;
  const longestLength = Math.max(...candidates.map((candidate) => candidate.length));
  const minAcceptedLength = Math.max(18, longestLength * 0.12);
  const filtered = candidates.filter(
    (candidate) => candidate.length >= minAcceptedLength,
  );
  return filtered.length > 0 ? filtered : candidates;
}

function scoreCandidateForHint(
  candidate: GeneratedStrokeCandidate,
  hint: TracingAutoStrokeHint,
): { score: number; shouldReverse: boolean } {
  const points = candidate.points;
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const startHint = hint.start;
  const endHint = hint.end;

  const directScore =
    (startHint ? getStrokePointDistance(startPoint, startHint) : 0) +
    (endHint ? getStrokePointDistance(endPoint, endHint) : 0);
  const reverseScore =
    (startHint ? getStrokePointDistance(endPoint, startHint) : 0) +
    (endHint ? getStrokePointDistance(startPoint, endHint) : 0);

  if (reverseScore < directScore) {
    return { score: reverseScore, shouldReverse: true };
  }

  return { score: directScore, shouldReverse: false };
}

function mergeTwoStrokePointLists(
  firstPoints: TracingStrokePoint[],
  secondPoints: TracingStrokePoint[],
): { points: TracingStrokePoint[]; connectorDistance: number } {
  const connectorDistance = getStrokePointDistance(
    firstPoints[firstPoints.length - 1],
    secondPoints[0],
  );
  const mergedPoints = dedupeConsecutiveStrokePoints([
    ...firstPoints,
    ...secondPoints,
  ]);
  return {
    points: mergedPoints,
    connectorDistance,
  };
}

function mergeStrokePairToBestPath(
  firstStroke: GeneratedStrokeCandidate,
  secondStroke: GeneratedStrokeCandidate,
  maskConstraint?: GlyphMaskConstraint,
): { candidate: GeneratedStrokeCandidate; connectorDistance: number } | null {
  if (firstStroke.componentId !== secondStroke.componentId) {
    return null;
  }

  const firstVariants = [firstStroke.points, [...firstStroke.points].reverse()];
  const secondVariants = [secondStroke.points, [...secondStroke.points].reverse()];

  let bestPoints: TracingStrokePoint[] = [];
  let bestConnectorDistance = Number.POSITIVE_INFINITY;

  firstVariants.forEach((firstVariant) => {
    secondVariants.forEach((secondVariant) => {
      const firstThenSecond = mergeTwoStrokePointLists(firstVariant, secondVariant);
      const firstThenSecondSafe =
        firstThenSecond.connectorDistance <= MAX_SAFE_MERGE_CONNECTOR_DISTANCE ||
        isConnectorInsideGlyphMask(
          firstVariant[firstVariant.length - 1],
          secondVariant[0],
          maskConstraint,
        );
      if (firstThenSecondSafe) {
        if (firstThenSecond.connectorDistance < bestConnectorDistance) {
          bestConnectorDistance = firstThenSecond.connectorDistance;
          bestPoints = firstThenSecond.points;
        }
      }

      const secondThenFirst = mergeTwoStrokePointLists(secondVariant, firstVariant);
      const secondThenFirstSafe =
        secondThenFirst.connectorDistance <= MAX_SAFE_MERGE_CONNECTOR_DISTANCE ||
        isConnectorInsideGlyphMask(
          secondVariant[secondVariant.length - 1],
          firstVariant[0],
          maskConstraint,
        );
      if (secondThenFirstSafe) {
        if (secondThenFirst.connectorDistance < bestConnectorDistance) {
          bestConnectorDistance = secondThenFirst.connectorDistance;
          bestPoints = secondThenFirst.points;
        }
      }
    });
  });

  if (bestPoints.length === 0 || !Number.isFinite(bestConnectorDistance)) {
    return null;
  }

  return {
    candidate: createStrokeCandidate(
      bestPoints,
      firstStroke.componentId,
      firstStroke.hint ?? secondStroke.hint,
    ),
    connectorDistance: bestConnectorDistance,
  };
}

function mergeStrokeCandidatesToTargetCount(
  candidates: GeneratedStrokeCandidate[],
  targetCount: number,
  maskConstraint?: GlyphMaskConstraint,
): GeneratedStrokeCandidate[] {
  if (targetCount <= 0) return [];
  const working = [...candidates];

  while (working.length > targetCount) {
    let bestLeftIndex = -1;
    let bestRightIndex = -1;
    let bestMergedCandidate: GeneratedStrokeCandidate | null = null;
    let bestConnectionDistance = Number.POSITIVE_INFINITY;

    for (let leftIndex = 0; leftIndex < working.length - 1; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < working.length; rightIndex += 1) {
        const mergeResult = mergeStrokePairToBestPath(
          working[leftIndex],
          working[rightIndex],
          maskConstraint,
        );
        if (!mergeResult) continue;
        const connectionDistance = mergeResult.connectorDistance;
        if (connectionDistance < bestConnectionDistance) {
          bestConnectionDistance = connectionDistance;
          bestLeftIndex = leftIndex;
          bestRightIndex = rightIndex;
          bestMergedCandidate = mergeResult.candidate;
        }
      }
    }

    if (
      bestLeftIndex === -1 ||
      bestRightIndex === -1 ||
      !bestMergedCandidate
    ) {
      break;
    }

    working.splice(bestRightIndex, 1);
    working.splice(bestLeftIndex, 1, bestMergedCandidate);
  }

  return working;
}

function splitStrokeCandidateByMidpoint(
  candidate: GeneratedStrokeCandidate,
): [GeneratedStrokeCandidate, GeneratedStrokeCandidate] | null {
  const { points } = candidate;
  if (points.length < 4) return null;

  const cumulativeLengths: number[] = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulativeLengths[index] =
      cumulativeLengths[index - 1] +
      getStrokePointDistance(points[index - 1], points[index]);
  }

  const totalLength = cumulativeLengths[cumulativeLengths.length - 1];
  if (totalLength <= 1) return null;

  const halfLength = totalLength / 2;
  let splitIndex = 1;
  let minDelta = Number.POSITIVE_INFINITY;

  for (let index = 1; index < points.length - 1; index += 1) {
    const delta = Math.abs(cumulativeLengths[index] - halfLength);
    if (delta < minDelta) {
      minDelta = delta;
      splitIndex = index;
    }
  }

  if (splitIndex <= 0 || splitIndex >= points.length - 1) return null;

  const leftPoints = dedupeConsecutiveStrokePoints(points.slice(0, splitIndex + 1));
  const rightPoints = dedupeConsecutiveStrokePoints(points.slice(splitIndex));
  if (leftPoints.length < 2 || rightPoints.length < 2) return null;

  return [
    createStrokeCandidate(leftPoints, candidate.componentId, candidate.hint),
    createStrokeCandidate(rightPoints, candidate.componentId),
  ];
}

function expandStrokeCandidatesToTargetCount(
  candidates: GeneratedStrokeCandidate[],
  targetCount: number,
): GeneratedStrokeCandidate[] {
  if (targetCount <= 0) return [];
  const working = [...candidates];

  while (working.length < targetCount) {
    let splitCandidateIndex = -1;
    let splitCandidateLength = 0;

    working.forEach((candidate, index) => {
      if (candidate.length > splitCandidateLength && candidate.points.length >= 4) {
        splitCandidateLength = candidate.length;
        splitCandidateIndex = index;
      }
    });

    if (splitCandidateIndex === -1) break;
    const splitResult = splitStrokeCandidateByMidpoint(working[splitCandidateIndex]);
    if (!splitResult) break;

    working.splice(splitCandidateIndex, 1, splitResult[0], splitResult[1]);
  }

  return working;
}

function mapPauseAnchorsToPausePoints(
  points: TracingStrokePoint[],
  hint: TracingAutoStrokeHint | undefined,
): TracingPausePoint[] | undefined {
  if (!hint || points.length < 2) return undefined;

  const pauseByIndex = new Map<number, number | undefined>();
  hint.pausePoints?.forEach((pausePoint) => {
    const clampedIndex = Math.max(
      1,
      Math.min(points.length - 1, Math.round(pausePoint.pointIndex)),
    );
    pauseByIndex.set(clampedIndex, pausePoint.pauseMs);
  });

  hint.pauseAnchors?.forEach((pauseAnchor) => {
    let nearestIndex = 1;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
      const distance = getStrokePointDistance(points[pointIndex], pauseAnchor.point);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = pointIndex;
      }
    }

    pauseByIndex.set(nearestIndex, pauseAnchor.pauseMs);
  });

  if (pauseByIndex.size === 0) return undefined;

  return [...pauseByIndex.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([pointIndex, pauseMs]) => ({
      pointIndex,
      pauseMs,
    }));
}

function resolveAutoStrokeCandidates(
  targetText: string,
  candidates: GeneratedStrokeCandidate[],
  autoConfig: TracingAutoDemoConfig | undefined,
  maskConstraint?: GlyphMaskConstraint,
): GeneratedStrokeCandidate[] {
  if (candidates.length === 0) return [];

  const strokeHints = autoConfig?.strokeHints ?? [];
  const singleLetterDefaultStrokeCount =
    [...targetText].length === 1 ? 1 : undefined;
  const targetStrokeCount =
    autoConfig?.strokeCount ??
    (strokeHints.length > 0 ? strokeHints.length : singleLetterDefaultStrokeCount);
  let didNormalizeToTarget = true;

  let normalizedCandidates = [...candidates];
  if (targetStrokeCount && targetStrokeCount > 0) {
    const minimumStrokeCount = Math.max(
      targetStrokeCount,
      new Set(normalizedCandidates.map((candidate) => candidate.componentId)).size,
    );
    if (normalizedCandidates.length > targetStrokeCount) {
      normalizedCandidates = mergeStrokeCandidatesToTargetCount(
        normalizedCandidates,
        minimumStrokeCount,
        maskConstraint,
      );
    }
    if (normalizedCandidates.length < targetStrokeCount) {
      normalizedCandidates = expandStrokeCandidatesToTargetCount(
        normalizedCandidates,
        targetStrokeCount,
      );
    }
    didNormalizeToTarget = normalizedCandidates.length === minimumStrokeCount;
  }

  const remainingCandidates = [...normalizedCandidates];
  const hintedCandidates: GeneratedStrokeCandidate[] = [];

  strokeHints.forEach((hint) => {
    if (remainingCandidates.length === 0) return;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    let shouldReverse = false;

    remainingCandidates.forEach((candidate, candidateIndex) => {
      const candidateScore = scoreCandidateForHint(candidate, hint);
      if (candidateScore.score < bestScore) {
        bestScore = candidateScore.score;
        bestIndex = candidateIndex;
        shouldReverse = candidateScore.shouldReverse;
      }
    });

    const selectedCandidate = remainingCandidates.splice(bestIndex, 1)[0];
    const selectedPoints = shouldReverse
      ? [...selectedCandidate.points].reverse()
      : selectedCandidate.points;
    hintedCandidates.push(
      createStrokeCandidate(
        selectedPoints,
        selectedCandidate.componentId,
        hint,
      ),
    );
  });

  remainingCandidates.sort(
    (leftCandidate, rightCandidate) =>
      leftCandidate.orderValue - rightCandidate.orderValue,
  );

  if (!targetStrokeCount || targetStrokeCount <= 0) {
    return [...hintedCandidates, ...remainingCandidates];
  }

  if (!didNormalizeToTarget) {
    return [...hintedCandidates, ...remainingCandidates];
  }

  if (hintedCandidates.length >= targetStrokeCount) {
    return hintedCandidates.slice(0, targetStrokeCount);
  }

  return [
    ...hintedCandidates,
    ...remainingCandidates.slice(0, targetStrokeCount - hintedCandidates.length),
  ];
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
