"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState } from "react";

export interface TraceEvaluation {
  score: number;
  stars: number;
  precision: number;
  coverage: number;
}

interface LetterTracingCanvasProps {
  targetText: string;
  disabled?: boolean;
  oneStarThreshold?: number;
  twoStarThreshold?: number;
  onEvaluate: (result: TraceEvaluation) => void;
}

const CANVAS_SIZE = 280;
const LINE_WIDTH = 28;

function toCanvasPoint(
  event: PointerEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
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

export function LetterTracingCanvas({
  targetText,
  disabled,
  oneStarThreshold = 0.5,
  twoStarThreshold = 0.85,
  onEvaluate,
}: LetterTracingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
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
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(CANVAS_SIZE * ratio);
    canvas.height = Math.floor(CANVAS_SIZE * ratio);
    canvas.style.width = `${CANVAS_SIZE}px`;
    canvas.style.height = `${CANVAS_SIZE}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(ratio, ratio);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = "#16a34a";
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, [normalizedTarget, lineWidth]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setHasStroke(false);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
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
    if (!isDrawing || disabled) return;
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

  const evaluateTrace = () => {
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

    targetCtx.fillStyle = "#111111";
    const ratio = window.devicePixelRatio || 1;
    targetCtx.scale(ratio, ratio);
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "middle";
    targetCtx.font = `${guideFontSize}px "Mali", "Varela Round", sans-serif`;
    targetCtx.fillText(
      normalizedTarget,
      CANVAS_SIZE / 2,
      CANVAS_SIZE / 2 + guideFontSize * 0.05,
    );

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
      <div className="relative h-[280px] w-[280px] rounded-3xl border-2 border-dashed border-green-bright/40 bg-white shadow-lg">
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center font-bold text-foreground/15 leading-none select-none"
          style={{ fontSize: `${guideFontSize}px` }}
        >
          {normalizedTarget || "a"}
        </div>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 rounded-3xl touch-none ${
            disabled ? "pointer-events-none opacity-80" : ""
          }`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={clearCanvas}
          disabled={disabled}
          className={`rounded-2xl border-2 border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-foreground ios-button ${
            disabled ? "pointer-events-none opacity-60" : ""
          }`}
        >
          Xóa nét
        </button>
        <button
          onClick={evaluateTrace}
          disabled={disabled || !hasStroke}
          className={`relative ios-button ${
            disabled || !hasStroke ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <div className="absolute inset-0 rounded-2xl bg-orange-bright translate-y-1.5 transition-transform" />
          <div className="relative rounded-2xl bg-green-bright px-6 py-2 text-sm font-bold text-white">
            Chấm điểm
          </div>
        </button>
      </div>
    </div>
  );
}
