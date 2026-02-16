"use client";

import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Lock } from "lucide-react";
import { FOG_ERASE_RADIUS } from "../constants";

interface FogRevealOverlayProps {
  revealKey: string;
  containerRef?: RefObject<HTMLElement | null>;
  roundedClassName?: string;
  locked?: boolean;
}

export function FogRevealOverlay({
  revealKey,
  containerRef,
  roundedClassName = "rounded-md",
  locked = false,
}: FogRevealOverlayProps) {
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const [isErasingFog, setIsErasingFog] = useState(false);

  const redrawFogLayer = useCallback(() => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;

    const targetElement = containerRef?.current ?? fogCanvas.parentElement;
    if (!targetElement) return;
    const rect = targetElement.getBoundingClientRect();
    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (width <= 0 || height <= 0) return;
    canvasSizeRef.current = { width, height };

    const ratio = window.devicePixelRatio || 1;
    fogCanvas.width = Math.floor(width * ratio);
    fogCanvas.height = Math.floor(height * ratio);
    fogCanvas.style.width = `${width}px`;
    fogCanvas.style.height = `${height}px`;

    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;
    fogCtx.setTransform(1, 0, 0, 1, 0, 0);
    fogCtx.scale(ratio, ratio);
    fogCtx.clearRect(0, 0, width, height);

    const fogGradient = fogCtx.createLinearGradient(0, 0, width, height);
    fogGradient.addColorStop(0, "rgba(217, 240, 223, 1)");
    fogGradient.addColorStop(1, "rgba(188, 224, 199, 1)");
    fogCtx.fillStyle = fogGradient;
    fogCtx.fillRect(0, 0, width, height);

    fogCtx.fillStyle = "rgba(236, 249, 239, 0.72)";
    const textureCount = Math.max(24, Math.round((width * height) / 1600));
    for (let i = 0; i < textureCount; i += 1) {
      const x = (i * 29 + 12) % width;
      const y = (i * 47 + 18) % height;
      const radius = 15 + (i % 5) * 5;
      fogCtx.beginPath();
      fogCtx.arc(x, y, radius, 0, Math.PI * 2);
      fogCtx.fill();
    }
  }, [containerRef]);

  // Vẽ lớp sương mới mỗi khi đổi lesson.
  useEffect(() => {
    const frameId = window.requestAnimationFrame(redrawFogLayer);
    return () => window.cancelAnimationFrame(frameId);
  }, [redrawFogLayer, revealKey]);

  // Theo dõi resize để lớp sương luôn phủ kín khung tracing (kể cả đổi layout cột/hàng).
  useEffect(() => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;
    const targetElement = containerRef?.current ?? fogCanvas.parentElement;
    if (!targetElement) return;

    redrawFogLayer();
    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      redrawFogLayer();
    });
    resizeObserver.observe(targetElement);
    return () => resizeObserver.disconnect();
  }, [containerRef, redrawFogLayer]);

  const eraseFogAtPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;
    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;

    const rect = fogCanvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const { width, height } = canvasSizeRef.current;
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;

    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.beginPath();
    fogCtx.arc(x, y, FOG_ERASE_RADIUS, 0, Math.PI * 2);
    fogCtx.fill();
    fogCtx.restore();
  };

  return (
    <div className={`absolute inset-0 z-10 ${roundedClassName}`}>
      <canvas
        ref={fogCanvasRef}
        className={`absolute inset-0 touch-none ${roundedClassName} ${
          locked ? "pointer-events-none" : ""
        }`}
        onPointerDown={(event) => {
          if (locked) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          setIsErasingFog(true);
          eraseFogAtPoint(event);
        }}
        onPointerMove={(event) => {
          if (locked || !isErasingFog) return;
          event.preventDefault();
          eraseFogAtPoint(event);
        }}
        onPointerUp={() => setIsErasingFog(false)}
        onPointerCancel={() => setIsErasingFog(false)}
        onPointerLeave={() => setIsErasingFog(false)}
        aria-label={
          locked
            ? "Lớp khóa che chữ cái"
            : "Lớp sương mờ để bé chạm và xóa"
        }
      />

      {locked && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-slate-700/15">
          <div className="rounded-full bg-white/90 p-3 shadow-lg">
            <Lock className="h-7 w-7 text-slate-700" strokeWidth={2.5} />
          </div>
        </div>
      )}
    </div>
  );
}
