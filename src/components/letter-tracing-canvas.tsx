"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { LessonButton } from "./lesson-button";

export interface TraceEvaluation {
  score: number;
  stars: number;
  precision: number;
  coverage: number;
}

interface LetterTracingCanvasProps {
  targetText: string;
  mode?: "practice" | "demo";
  disabled?: boolean;
  oneStarThreshold?: number;
  twoStarThreshold?: number;
  onEvaluate?: (result: TraceEvaluation) => void;
  onAutoTraceComplete?: () => void;
}

const CANVAS_SIZE = 280;
const LINE_WIDTH = 28;

function toCanvasPoint(
  event: PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE;
  const y = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE;
  return { x, y };
}

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function getGuideFontSize(targetText: string): number {
  const targetLength = [...targetText].length;
  if (targetLength <= 1) return 248;
  if (targetLength === 2) return 218;
  if (targetLength <= 4) return 172;
  return 142;
}

function getTraceLineWidth(targetText: string): number {
  const targetLength = [...targetText].length;
  if (targetLength <= 1) return 30;
  if (targetLength === 2) return 26;
  return LINE_WIDTH;
}

function drawGuideGlyph(
  ctx: CanvasRenderingContext2D,
  targetText: string,
  guideFontSize: number,
  fillStyle: string = "rgba(17, 24, 39, 0.15)",
) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = fillStyle;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${guideFontSize}px "Mali", "Varela Round", sans-serif`;
  ctx.fillText(targetText, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
}

export function LetterTracingCanvas({
  targetText,
  mode = "practice",
  disabled,
  oneStarThreshold = 0.5,
  twoStarThreshold = 0.85,
  onEvaluate,
  onAutoTraceComplete,
}: LetterTracingCanvasProps) {
  const guideCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const autoTraceDoneRef = useRef(false);
  const isDemoMode = mode === "demo";
  const normalizedTarget = useMemo(
    () => targetText.trim().toLocaleLowerCase(),
    [targetText],
  );
  const guideFontSize = useMemo(
    () => getGuideFontSize(normalizedTarget || "a"),
    [normalizedTarget],
  );
  const lineWidth = useMemo(
    () => getTraceLineWidth(normalizedTarget || "a"),
    [normalizedTarget],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const guideCanvas = guideCanvasRef.current;
    if (!canvas || !guideCanvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(CANVAS_SIZE * ratio);
    canvas.height = Math.floor(CANVAS_SIZE * ratio);
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;

    guideCanvas.width = Math.floor(CANVAS_SIZE * ratio);
    guideCanvas.height = Math.floor(CANVAS_SIZE * ratio);
    guideCanvas.style.width = `${CANVAS_SIZE}px`;
    guideCanvas.style.height = `${CANVAS_SIZE}px`;

    const drawCtx = canvas.getContext("2d");
    const guideCtx = guideCanvas.getContext("2d");
    if (!drawCtx || !guideCtx) return;

    drawCtx.scale(ratio, ratio);
    drawCtx.lineJoin = "round";
    drawCtx.lineCap = "round";
    drawCtx.lineWidth = lineWidth;
    drawCtx.strokeStyle = "#16a34a";
    drawCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    guideCtx.scale(ratio, ratio);
    drawGuideGlyph(guideCtx, normalizedTarget || "a", guideFontSize);
  }, [guideFontSize, normalizedTarget, lineWidth, isDemoMode]);

  useEffect(() => {
    if (!isDemoMode) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const drawCtx = canvas.getContext("2d");
    if (!drawCtx) return;

    const ratio = window.devicePixelRatio || 1;
    const traceText = normalizedTarget || "a";
    const traceLineWidth = Math.max(12, lineWidth * 0.56);
    const traceDurationMs = 2600;
    const dashLength = CANVAS_SIZE * 9;
    autoTraceDoneRef.current = false;

    // Vẽ hoạt ảnh auto-tô cho lesson demo và bật nút tiếp tục khi hoàn tất
    const drawAutoTraceFrame = (progress: number) => {
      drawCtx.setTransform(1, 0, 0, 1, 0, 0);
      drawCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawCtx.scale(ratio, ratio);
      drawCtx.lineJoin = "round";
      drawCtx.lineCap = "round";
      drawCtx.lineWidth = traceLineWidth;
      drawCtx.strokeStyle = "#16a34a";
      drawCtx.textAlign = "center";
      drawCtx.textBaseline = "middle";
      drawCtx.font = `${guideFontSize}px "Mali", "Varela Round", sans-serif`;
      drawCtx.setLineDash([dashLength]);
      drawCtx.lineDashOffset = dashLength * (1 - progress);
      drawCtx.strokeText(traceText, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      drawCtx.setLineDash([]);
      drawCtx.fillStyle = `rgba(22, 163, 74, ${0.08 + progress * 0.2})`;
      drawCtx.fillText(traceText, CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    };

    let rafId = 0;
    let startTime = 0;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = clamp01(elapsed / traceDurationMs);
      drawAutoTraceFrame(progress);

      if (progress < 1) {
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
    isDemoMode,
    normalizedTarget,
    guideFontSize,
    lineWidth,
    onAutoTraceComplete,
  ]);

  // Xóa toàn bộ nét bé đã vẽ để bắt đầu lại lượt tô
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setHasStroke(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || isDemoMode) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(event.pointerId);
    const point = toCanvasPoint(event, canvas);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    setIsDrawing(true);
    setHasStroke(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled || isDemoMode) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const point = toCanvasPoint(event, canvas);
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
    drawGuideGlyph(targetCtx, normalizedTarget, guideFontSize, "#111111");

    const drawnData = drawCtx.getImageData(0, 0, canvas.width, canvas.height).data;
    const targetData = targetCtx.getImageData(0, 0, canvas.width, canvas.height).data;

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
    const stars = score >= twoStarThreshold ? 2 : score >= oneStarThreshold ? 1 : 0;

    onEvaluate({ score, stars, precision, coverage });
  };

  return (
    <div className="mt-2 flex flex-col items-center gap-3">
      <div className="relative h-70 w-70 rounded-3xl border-2 border-dashed border-green-bright/40 bg-white shadow-lg">
        <canvas
          ref={guideCanvasRef}
          className="pointer-events-none absolute inset-0 rounded-3xl"
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-10 rounded-3xl touch-none ${
            disabled || isDemoMode ? "pointer-events-none opacity-80" : ""
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
          <LessonButton
            onClick={clearCanvas}
            disabled={disabled}
            className="rounded-2xl"
            frontClassName="px-5 py-2 text-sm"
          >
            Xóa nét
          </LessonButton>
          <LessonButton
            onClick={evaluateTrace}
            disabled={disabled || !hasStroke}
            className="rounded-2xl"
            frontClassName="px-6 py-2 text-sm"
          >
            Chấm điểm
          </LessonButton>
        </div>
      )}
    </div>
  );
}
